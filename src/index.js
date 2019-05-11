import "@babel/polyfill";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express from "express";
import enforce from "express-sslify";
import path from "path";
import { getMostPopularSongsForTimePeriod } from "./billboardTopHundredAggregator";
import "./db/knexfile";
import {
  addSongToSession,
  createNewSongbookSession,
  getAllActiveSongsForSession,
  getCurrentActiveSongForSession,
  getIndexOfCurrentSong,
  getSongbookForSession,
  getTotalNumberOfActiveSongsForSession,
  isSongbookFull,
  isValidSongbookSession,
  safeDeleteSongFromSession,
  setLastNavActionToNow,
  setMaxSongsForSession,
  setNoodleModeForSession,
  setSongToNextActiveSongForSession,
  setSongToPrevActiveSongForSession,
  setSongToSpecificIndexOfActiveSongsForSession,
} from "./db/repositories/songbook";
import { processSongbook } from "./songbookCreator";
import { getSpotifyPlaylistTracks } from "./spotifyPlaylistReader";
import * as ugs from "./tab-scraper";
import { formatTab, getBestMatch, getTabForUrl } from "./tabSearcher";

dotenv.config();

const app = express();
process.env["REQUIRE_HTTPS"] !== "false" &&
  app.use(enforce.HTTPS({ trustProtoHeader: true }));

app.set("views", path.join(__dirname, "../views")); // set express to look in this folder to render our view
app.set("view engine", "ejs"); // configure template engine
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.post("/submit-tab", (req, res) => {
  processSongbook(req.body.playlist, req.body.email);
  res.sendFile(path.join(__dirname, "../public", "/songbookProcessing.html"));
});

app.get("/playlistGenerator", (req, res) =>
  res.sendFile(path.join(__dirname, "../public", "/playlistGenerator.html")),
);

app.get("/billboardTopPlaylist", async (req, res) => {
  getMostPopularSongsForTimePeriod(
    req.query.startYear,
    req.query.endYear,
    req.query.count,
    req.query.email,
  );

  res.send("Queued job");
});

app.get("/spotifyPlaylist", async (req, res) =>
  res.send(await getSpotifyPlaylistTracks(req.query.playlist_id)),
);

// Live playlist code below (break out in to own file later)
app.get("/", (req, res) => res.redirect(`/live`));
app.get("/live", (req, res) =>
  res.sendFile(path.join(__dirname, "../public", "/liveLanding.html")),
);

app.get("/live/tab-autocomplete", async (req, res) => {
  const results = await new Promise((resolve, reject) => {
    ugs.autocomplete(req.query.term, (error, tabs) => {
      if (error) {
        reject(error);
      } else {
        resolve(tabs);
      }
    });
  });
  res.json(results);
});

app.get("/live/:sessionKey/view", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }

  const songbook = await getSongbookForSession(req.params.sessionKey);

  setLastNavActionToNow(req.params.sessionKey);

  return res.render("viewLivePlaylist.ejs", {
    sessionKey: songbook.session_key,
    powerHourTitle: songbook.title,
    noodleMode: songbook.is_noodle_mode,
  });
});

app.get("/live/:sessionKey/add", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }

  const songbook = await getSongbookForSession(req.params.sessionKey);

  return res.render("addToLivePlaylist.ejs", {
    sessionKey: songbook.session_key,
    powerHourTitle: songbook.title,
  });
});

app.get("/live/:sessionKey/current", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }
  const songbook = await getSongbookForSession(req.params.sessionKey);

  const curSong = await getCurrentPlaylistSong(
    req.params.sessionKey,
    songbook.is_noodle_mode,
  );
  if (!curSong) res.status(204);
  return res.json(curSong);
});

app.get("/live/:sessionKey/count", async (req, res) =>
  res.json({
    count: await getTotalNumberOfActiveSongsForSession(req.params.sessionKey),
  }),
);

app.get("/live/view", async (req, res) => {
  res.redirect(`/live/${req.query.sessionKey}/view`);
});

app.get("/live/create", (req, res) =>
  res.sendFile(path.join(__dirname, "../public", "/createSongbook.html")),
);

app.post("/live/create", async (req, res) => {
  const alphaNumericAndDashesRegex = /^[0-9A-Za-z\-]+$/;
  if (!req.body.sessionKey.match(alphaNumericAndDashesRegex)) {
    res.status(400);
    res.json(
      "Illegal name! You may only use letters, numbers, and dashes (no spaces!)",
    );
  }

  if (await isValidSongbookSession(req.body.sessionKey)) {
    res.status(400);
    return res.json("Songbook already exists");
  }

  await createNewSongbookSession(
    req.body.sessionKey,
    req.body.title,
    req.body.maxSongLimit || null,
    req.body.isNoodleMode === "on",
  );
  res.redirect(`/live/${req.body.sessionKey}/view`);
});

app.post("/live/:sessionKey/next", async (req, res) => {
  await setSongToNextActiveSongForSession(req.params.sessionKey);
  const songbook = await getSongbookForSession(req.params.sessionKey);

  res.json(
    await getCurrentPlaylistSong(
      req.params.sessionKey,
      songbook.is_noodle_mode,
    ),
  );
});

app.post("/live/:sessionKey/prev", async (req, res) => {
  await setSongToPrevActiveSongForSession(req.params.sessionKey);
  const songbook = await getSongbookForSession(req.params.sessionKey);

  res.json(
    await getCurrentPlaylistSong(
      req.params.sessionKey,
      songbook.is_noodle_mode,
    ),
  );
});

app.post("/live/:sessionKey/add", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }

  if (await isSongbookFull(req.params.sessionKey)) {
    res.status(400);
    return res.send(
      `<p>Songbook full, no more requests allowed! </p><a href='/live/${
        req.params.sessionKey
      }/add><- Back</a>`,
    );
  }

  const match = await getBestMatch(req.body.song);
  if (!match) {
    res.send(
      `<p>No matches found :(</p><a href='/live/${
        req.params.sessionKey
      }/add><- Back</a>`,
    );
  }
  const tab = await getTabForUrl(match.url);
  const newSong = {
    artist: tab.artist,
    title: tab.name,
    url: tab.url,
    content: tab.content.text,
  };

  addSongToSession(newSong, req.params.sessionKey);

  res.render("addToLivePlaylistConfirm.ejs", {
    artist: newSong.artist,
    title: newSong.title,
    sessionKey: req.params.sessionKey,
    url: newSong.url,
  });
});

// used by viewer, should eventually be only endpoint
app.post("/live/:sessionKey/remove", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }

  await safeDeleteSongFromSession(req.body.url, req.params.sessionKey);

  const songbook = await getSongbookForSession(req.params.sessionKey);

  const curSong = await getCurrentPlaylistSong(
    req.params.sessionKey,
    songbook.is_noodle_mode,
  );
  if (!curSong) res.status(204);
  return res.json(curSong);
});

// used by phones, hack because it's easier to do query strings in dumb html/js
app.get("/live/:sessionKey/remove", async (req, res) => {
  safeDeleteSongFromSession(req.query.url, req.params.sessionKey);
  res.redirect(`/live/${req.params.sessionKey}/add`);
});

app.get("/live/:sessionKey/index", async (req, res) => {
  var index = 0;
  return res.send(
    (await getAllActiveSongsForSession(req.params.sessionKey)).reduce(
      (acc, song) =>
        acc +
        `<a href="/live/${
          req.params.sessionKey
        }/setCurrent?cur=${index++}" target="_blank">${song.artist} - ${
          song.title
        }</a>` +
        "<br />",
      "",
    ),
  );
});

app.get("/live/:sessionKey/setCurrent", async (req, res) => {
  setSongToSpecificIndexOfActiveSongsForSession(
    req.params.sessionKey,
    req.query.cur,
  );
  res.redirect(`/live/${req.params.sessionKey}/view`);
});

app.get("/live/:sessionKey/setMaxSongs", async (req, res) => {
  await setMaxSongsForSession(
    req.params.sessionKey,
    parseInt(req.query.maxSongs),
  );
  res.json(`Set max songs to ${req.query.maxSongs}`);
});

app.get("/live/:sessionKey/setNoodleMode", async (req, res) => {
  const isNoodleMode = req.query.noodleMode.toLowerCase() === "true";
  await setNoodleModeForSession(req.params.sessionKey, isNoodleMode);
  res.json(`Set noodleMode to ${isNoodleMode}`);
});

app.listen(process.env["PORT"] || 3000, () =>
  console.log(`Live Power Hour app listening on port ${process.env["PORT"]}!`),
);

app.get("/help", async (req, res) => {
  res.send(`/live/{sessionKey}/setMaxSongs?maxSongs={numberOfSongs}<br>
  /live/{sessionKey}/setNoodleMode?noodleMode={true/false}<br>
  /live/{sessionKey}/index<br>
  /live/{sessionKey}/remove?url={url pasted directly from the view page}<br><br>
  Old stuff:<br>
  /playlistGenerator<br>
  /billboardTopPlaylist?startYear={1990}&endYear={2000}&count={60}&email={you@gmail.com}<br>
  /spotifyPlaylist<br>`);
});

const WEB_MAX_LINES_PER_SONG = 90;
async function getCurrentPlaylistSong(sessionKey, isNoodleMode = false) {
  const song = await getCurrentActiveSongForSession(sessionKey);

  if (!song) {
    return null;
  }

  const totalActiveSongs = await getTotalNumberOfActiveSongsForSession(
    sessionKey,
  );

  const tab = formatTab(
    song.content,
    isNoodleMode ? 9999 : WEB_MAX_LINES_PER_SONG,
  );

  return {
    artist: song.artist,
    title: song.title,
    tabUrl: song.url,
    tab,
    current: await getIndexOfCurrentSong(sessionKey),
    total: totalActiveSongs,
  };
}
