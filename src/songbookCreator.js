import * as fs from "fs";
import { sendEmail } from "./emailClient";
import { formatTab, getBestMatch, getTabForUrl } from "./tabSearcher";
import { TabWriter } from "./tabWriter";

const WEB_MAX_LINES_PER_SONG = 116;

export async function processSongbook(playlistFile, toEmailAddress) {
  const songArray = playlistFile.split("\n");

  const { songOverrides } = JSON.parse(fs.readFileSync("songOverrides.json"));

  var tabs = [];

  for (const song of songArray) {
    const override = getSongOverrideIfAny(song, songOverrides);
    var tab;
    override
      ? (tab = await getTabForUrl(override.urlOverride))
      : (tab = await getTabForSong(song));

    tab && tabs.push(tab);
  }

  generateSongbook(tabs, toEmailAddress);
}

export async function generateSongbook(
  tabs,
  toEmailAddress,
  shouldAddTOC = true,
  songbookTitle = "songbook",
) {
  const tabWriter = new TabWriter();

  if (shouldAddTOC) {
    tabWriter.addTableOfContents(tabs.map(tab => tab.name));
  }

  for (const tab of tabs) {
    tab.content.text = formatTab(tab.content.text, WEB_MAX_LINES_PER_SONG);
    tabWriter.writeTabToDoc(tab);
  }

  const tabAttachment = await tabWriter.getDocAsBase64String();

  const result = await sendEmail(
    toEmailAddress,
    "Songbook Generated",
    "Attached is your songbook",
    null,
    tabAttachment,
    songbookTitle,
  );
}

export function convertSongToTab(song) {
  return {
    name: song.title,
    artist: song.artist,
    url: song.url,
    content: {
      text: song.content,
    },
  };
}

function getSongOverrideIfAny(song, songOverrides) {
  const override = songOverrides.find(songOverride =>
    trimAndCompareStringsInsensitive(songOverride.song, song),
  );

  return override;
}

async function getTabForSong(song) {
  console.log(`Read in: ${song}`);
  const splitSong = song.split(" - ");
  const title = splitSong[1].replace(/\(.+\)/g, "");
  const artist = splitSong.slice(-1);
  console.log(`Searching for: ${title} - ${artist}`);
  const match = await getBestMatch(`${artist} ${title}`);
  if (!match) {
    console.error(`Couldn't locate song: ${song}`);
    return;
  }

  return await getTabForUrl(match.url);
}

function trimAndCompareStringsInsensitive(s1, s2) {
  return s1.trim().toUpperCase() === s2.trim().toUpperCase();
}
