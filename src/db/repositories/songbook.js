import { differenceInMilliseconds } from "date-fns";
import { v4 as uuid } from "uuid";
import knex from "../knexfile";

export const createNewSongbookSession = async (
  sessionKey,
  title,
  maxSongLimit,
  isNoodleMode,
) => {
  return knex("songbook").insert({
    id: uuid(),
    created_at: new Date(),
    session_key: sessionKey,
    title: title,
    current_song_timestamp: new Date(),
    max_active_songs: maxSongLimit,
    is_noodle_mode: isNoodleMode,
  });
};

export const getSong = async url => {
  return await knex
    .from("song")
    .where("url", url)
    .first();
};

export const updateSong = async (url, content) => {
  await knex("song")
    .update({ content })
    .where({ url });
};

export const addSongToSession = async (newSong, sessionKey) => {
  const songbook_id = await getSongbookIdForSession(sessionKey);

  if (await isSongAlreadyInSongbook(newSong, songbook_id)) return;

  console.log("adding song");

  let songInDb = await getSong(newSong.url);
  if (!songInDb) {
    songInDb = await addSongToDb(newSong);
  }

  await knex("song_entry").insert({
    id: uuid(),
    created_at: new Date(),
    songbook_id,
    song_id: songInDb.id,
  });
};

export const safeDeleteSongFromSession = async (url, sessionKey) => {
  const songbook_id = await getSongbookIdForSession(sessionKey);

  const songInDb = await getSong(url);

  return knex("song_entry")
    .where("songbook_id", songbook_id)
    .andWhere("song_id", songInDb.id)
    .update("removed_at", new Date());
};

export const getTotalNumberOfActiveSongsForSession = async sessionKey => {
  return (await knex
    .from("songbook")
    .innerJoin("song_entry", "song_entry.songbook_id", "songbook.id")
    .whereNull("song_entry.removed_at")
    .andWhere("session_key", sessionKey)
    .count()
    .first()).count;
};

export const getAllActiveSongsForSession = async sessionKey => {
  return knex
    .from("songbook")
    .innerJoin("song_entry", "song_entry.songbook_id", "songbook.id")
    .whereNull("song_entry.removed_at")
    .andWhere("session_key", sessionKey)
    .innerJoin("song", "song_entry.song_id", "song.id")
    .orderBy("song_entry.created_at");
};

export const getIndexOfCurrentSong = async sessionKey => {
  return (await getNumberOfSongsBeforeCurrentSong(sessionKey)) + 1;
};

export const getNumberOfSongsBeforeCurrentSong = async sessionKey => {
  const currentSong = await getCurrentActiveSongForSession(sessionKey);

  return parseInt(
    (await knex
      .from("songbook")
      .innerJoin("song_entry", "song_entry.songbook_id", "songbook.id")
      .whereNull("song_entry.removed_at")
      .andWhere("session_key", sessionKey)
      .andWhere("song_entry.created_at", "<", currentSong.created_at)
      .count()
      .first()).count,
  );
};

export const isValidSongbookSession = async sessionKey => {
  return !!(await knex
    .select("current_song_timestamp")
    .from("songbook")
    .where("session_key", sessionKey)
    .first());
};

export const isSongbookFull = async sessionKey => {
  const { max_active_songs } = await knex
    .select("max_active_songs")
    .from("songbook")
    .where("session_key", sessionKey)
    .first();

  const totalSongs = await getTotalNumberOfActiveSongsForSession(sessionKey);

  return max_active_songs && totalSongs >= max_active_songs;
};

export const setMaxSongsForSession = async (sessionKey, maxSongs) => {
  return await knex("songbook")
    .where("session_key", sessionKey)
    .update("max_active_songs", maxSongs);
};

export const setNoodleModeForSession = async (sessionKey, isNoodleMode) => {
  return await knex("songbook")
    .where("session_key", sessionKey)
    .update("is_noodle_mode", isNoodleMode);
};

export const getCurrentActiveSongForSession = async sessionKey => {
  const current_song_timestamp = await getCurrentSongBookmarkForSession(
    sessionKey,
  );

  // get next song in playlist
  const curSong = await knex
    .from("songbook")
    .innerJoin("song_entry", "song_entry.songbook_id", "songbook.id")
    .whereNull("song_entry.removed_at")
    .andWhere("session_key", sessionKey)
    .andWhere("song_entry.created_at", ">=", current_song_timestamp)
    .innerJoin("song", "song_entry.song_id", "song.id")
    .orderBy("song_entry.created_at")
    .first();

  if (curSong) return curSong;

  // if there are no songs after the "bookmark", just return the last song
  return await knex
    .from("songbook")
    .innerJoin("song_entry", "song_entry.songbook_id", "songbook.id")
    .whereNull("song_entry.removed_at")
    .andWhere("session_key", sessionKey)
    .innerJoin("song", "song_entry.song_id", "song.id")
    .orderBy("song_entry.created_at", "desc")
    .first();
};

export const setLastNavActionToNow = async sessionKey => {
  return knex("songbook")
    .where("session_key", sessionKey)
    .update({
      last_nav_action_taken_at: new Date(),
    });
};

export const setSongToNextActiveSongForSession = async sessionKey => {
  updatePlayStatisticsOnNav(sessionKey);

  const nextSong = await getNextActiveSongForSession(sessionKey);
  await knex("songbook")
    .where("session_key", sessionKey)
    .update("current_song_timestamp", nextSong.created_at);
  return nextSong;
};

export const setSongToSpecificIndexOfActiveSongsForSession = async (
  sessionKey,
  index,
) => {
  updatePlayStatisticsOnNav(sessionKey);

  const specificSong = (await knex
    .from("songbook")
    .innerJoin("song_entry", "song_entry.songbook_id", "songbook.id")
    .whereNull("song_entry.removed_at")
    .andWhere("session_key", sessionKey)
    .orderBy("song_entry.created_at"))[index];

  await knex("songbook")
    .where("session_key", sessionKey)
    .update("current_song_timestamp", specificSong.created_at);
  return specificSong;
};

export const setSongToPrevActiveSongForSession = async sessionKey => {
  updatePlayStatisticsOnNav(sessionKey);

  const prevSong = await getPrevActiveSongForSession(sessionKey);

  await knex("songbook")
    .where("session_key", sessionKey)
    .update("current_song_timestamp", prevSong.created_at);

  return prevSong;
};

export const getSongbookForSession = async sessionKey => {
  return knex
    .from("songbook")
    .where("session_key", sessionKey)
    .first();
};

const getNextActiveSongForSession = async sessionKey => {
  const currentSong = await getCurrentActiveSongForSession(sessionKey);

  const nextSong = await knex
    .from("songbook")
    .innerJoin("song_entry", "song_entry.songbook_id", "songbook.id")
    .whereNull("song_entry.removed_at")
    .andWhere("session_key", sessionKey)
    .andWhere("song_entry.created_at", ">", currentSong.created_at)
    .innerJoin("song", "song_entry.song_id", "song.id")
    .orderBy("song_entry.created_at")
    .first();

  if (nextSong) return nextSong;

  return getCurrentActiveSongForSession(sessionKey);
};

const getPrevActiveSongForSession = async sessionKey => {
  const currentSong = await getCurrentActiveSongForSession(sessionKey);

  const prevSong = await knex
    .from("songbook")
    .innerJoin("song_entry", "song_entry.songbook_id", "songbook.id")
    .whereNull("song_entry.removed_at")
    .andWhere("session_key", sessionKey)
    .andWhere("song_entry.created_at", "<", currentSong.created_at)
    .innerJoin("song", "song_entry.song_id", "song.id")
    .orderBy("song_entry.created_at", "desc")
    .first();

  if (prevSong) return prevSong;

  return getCurrentActiveSongForSession(sessionKey);
};

const getCurrentSongBookmarkForSession = async sessionKey => {
  try {
    const { current_song_timestamp } = await knex
      .select("current_song_timestamp")
      .from("songbook")
      .where("session_key", sessionKey)
      .first();

    return current_song_timestamp;
  } catch {
    console.log(`Couldn't find session ${sessionKey}`);
    return null;
  }
};

const getSongbookIdForSession = async sessionKey => {
  const { id } = await knex
    .select("id")
    .from("songbook")
    .where("session_key", sessionKey)
    .first();

  return id;
};

const isSongAlreadyInSongbook = async (song, songbookId) => {
  const songInDb = await getSong(song.url);
  if (!songInDb) return;
  const matches = await knex
    .from("song_entry")
    .whereNull("song_entry.removed_at")
    .where("songbook_id", songbookId)
    .andWhere("song_id", songInDb.id)
    .count()
    .first();
  return matches && parseInt(matches.count) > 0;
};

const addSongToDb = async song => {
  const addedSong = await knex("song")
    .insert({
      ...song,
      id: uuid(),
    })
    .returning("*");

  return addedSong[0];
};

const updatePlayStatisticsOnNav = async sessionKey => {
  const songbook = await getSongbookForSession(sessionKey);
  const currentSong = await getCurrentActiveSongForSession(sessionKey);

  const elapsedTimeMS = Math.abs(
    differenceInMilliseconds(songbook.last_nav_action_taken_at, new Date()),
  );

  const play_time = (currentSong.play_time || 0.0) + elapsedTimeMS / 1000.0;
  const last_nav_action_taken_at = new Date();

  await knex("songbook")
    .where("id", songbook.id)
    .update({
      last_nav_action_taken_at,
    });

  await knex("song_entry")
    .where("id", currentSong.id)
    .update({
      play_time,
    });
};
