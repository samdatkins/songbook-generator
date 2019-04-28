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
  getCurrentActiveSongForSession,
  getIndexOfCurrentSong,
  getTotalNumberOfActiveSongsForSession,
  isSongbookFull,
  isValidSongbookSession,
  safeDeleteSongFromSession,
  setMaxSongsForSession,
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

app.get("/live/:sessionKey/view", async (req, res) =>
  res.sendFile(path.join(__dirname, "../public", "/livePlaylist.html")),
);

app.get("/live/:sessionKey/add", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }

  return res.render("addToLivePlaylist.ejs", {
    sessionKey: req.params.sessionKey,
  });
});

app.get("/live/:sessionKey/current", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }
  const curSong = await getCurrentPlaylistSong(req.params.sessionKey);
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

  await createNewSongbookSession(req.body.sessionKey);
  res.redirect(`/live/${req.body.sessionKey}/view`);
});

app.post("/live/:sessionKey/next", async (req, res) => {
  await setSongToNextActiveSongForSession(req.params.sessionKey);
  res.json(await getCurrentPlaylistSong(req.params.sessionKey));
});

app.post("/live/:sessionKey/prev", async (req, res) => {
  await setSongToPrevActiveSongForSession(req.params.sessionKey);
  res.json(await getCurrentPlaylistSong(req.params.sessionKey));
});

app.get("/live/:sessionKey/setMaxSongs", async (req, res) => {
  await setMaxSongsForSession(
    req.params.sessionKey,
    parseInt(req.query.maxSongs),
  );
  res.json(`Set max songs to ${req.query.maxSongs}`);
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

app.get("/live/:sessionKey/remove", async (req, res) => {
  safeDeleteSongFromSession(req.query.url, req.params.sessionKey);
  res.redirect(`/live/${req.params.sessionKey}/add`);
});

app.get("/live/:sessionKey/plainText", async (req, res) => {
  res.send(
    getAllPlaylistSongsForSession(req.params.sessionKey).reduce(
      (acc, cur) => acc + cur.song.toString() + "<br />",
      "",
    ),
  );
});

app.get("/live/:sessionKey/setCurrent", async (req, res) => {
  setSongToSpecificIndexOfActiveSongsForSession(
    req.params.sessionKey,
    req.query.cur,
  );
  res.json("updated");
});

app.listen(process.env["PORT"] || 3000, () =>
  console.log(`Tab writer app listening on port ${process.env["PORT"]}!`),
);

async function getCurrentPlaylistSong(sessionKey) {
  const song = await getCurrentActiveSongForSession(sessionKey);

  if (!song) {
    return null;
  }

  const totalActiveSongs = await getTotalNumberOfActiveSongsForSession(
    sessionKey,
  );
  const tab = formatTab(song.content);
  return {
    artist: song.artist,
    title: song.title,
    tabUrl: song.url,
    tab,
    current: await getIndexOfCurrentSong(sessionKey),
    total: totalActiveSongs,
  };
}
