import "@babel/polyfill";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express from "express";
import enforce from "express-sslify";
import path from "path";
import { getMostPopularSongsForTimePeriod } from "./billboardTopHundredAggregator";
import { processSongbook } from "./songbookCreator";
import { getSpotifyPlaylistTracks } from "./spotifyPlaylistReader";
import { getBestMatch, getTabForUrl } from "./ultimateGuitarSearcher";

dotenv.config();

const app = express();
process.env["REQUIRE_HTTPS"] !== "false" &&
  app.use(enforce.HTTPS({ trustProtoHeader: true }));

app.set("views", path.join(__dirname, "../views")); // set express to look in this folder to render our view
app.set("view engine", "ejs"); // configure template engine
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.post("/submit-tab", (req, res) => {
  console.log(req.body.playlist);
  processSongbook(req.body.playlist, req.body.email);
  res.sendFile(path.join(__dirname, "../public", "/songbookProcessing.html"));
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname + "/index.html")));

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

var curIndex = {};
var songEntries = [];

app.get("/live/:sessionId/view", async (req, res) =>
  res.sendFile(path.join(__dirname, "../public", "/livePlaylist.html")),
);

app.get("/live/:sessionId/add", async (req, res) =>
  res.render("addToLivePlaylist.ejs", { sessionId: req.params.sessionId }),
);

app.get("/live/:sessionId/current", async (req, res) =>
  res.json(await getCurrentPlaylistSong(req.params.sessionId)),
);

app.get("/live/:sessionId/count", async (req, res) =>
  res.json({
    count: getAllPlaylistSongsForSession(req.params.sessionId).length,
  }),
);

app.post("/live/:sessionId/next", async (req, res) => {
  setIndex(req.params.sessionId, getIndex(req.params.sessionId) + 1);
  res.json(await getCurrentPlaylistSong(req.params.sessionId));
});

app.post("/live/:sessionId/prev", async (req, res) => {
  setIndex(req.params.sessionId, getIndex(req.params.sessionId) - 1);
  res.json(await getCurrentPlaylistSong(req.params.sessionId));
});

app.post("/live/:sessionId/add", async (req, res) => {
  const match = await getBestMatch(req.body.song);
  if (!match) {
    res.send(
      `<p>No matches found :(</p><a href='/live/${
        req.params.sessionId
      }/add><- Back</a>`,
    );
  }
  const songName = `${match.artist} - ${match.name}`;
  const newEntry = {
    song: songName,
    url: match.url,
    sessionId: req.params.sessionId,
  };

  if (songEntries.filter(entry => entry.url === match.url).length === 0) {
    songEntries.push(newEntry);
  }
  res.render("addToLivePlaylistConfirm.ejs", newEntry);
});

app.get("/live/:sessionId/remove", async (req, res) => {
  songEntries = songEntries.filter(
    entry =>
      !(
        entry.url === req.query.url && entry.sessionId === req.params.sessionId
      ),
  );
  res.redirect(`/live/${req.params.sessionId}/add`);
});

app.get("/live/:sessionId/plainText", async (req, res) => {
  res.send(
    getAllPlaylistSongsForSession(req.params.sessionId).reduce(
      (acc, cur) => acc + cur.song.toString() + "<br />",
      "",
    ),
  );
});

app.get("/live/dump", async (req, res) => {
  res.json(songEntries);
});

app.post("/live/restore", async (req, res) => {
  songEntries = JSON.parse(req.body.songs);
  res.end();
});

app.get("/live/:sessionId/setCurrent", async (req, res) => {
  setIndex(req.params.sessionId, req.query.cur - 1);
  res.json(getIndex(req.params.sessionId));
});

app.listen(process.env["PORT"] || 3000, () =>
  console.log(`Tab writer app listening on port ${process.env["PORT"]}!`),
);

async function getCurrentPlaylistSong(sessionId) {
  const songEntriesForSession = getAllPlaylistSongsForSession(sessionId);
  console.log(songEntriesForSession);
  if (songEntriesForSession.length === 0) return null;

  if (getIndex(sessionId) + 1 > songEntriesForSession.length) {
    setIndex(sessionId, songEntriesForSession.length - 1);
  } else if (getIndex(sessionId) < 0) {
    setIndex(sessionId, 0);
  }

  const tab = await getTabForUrl(
    songEntriesForSession[getIndex(sessionId)].url,
  );
  return {
    tab,
    current: getIndex(sessionId) + 1,
    total: songEntriesForSession.length,
  };
}

function getAllPlaylistSongsForSession(sessionId) {
  return songEntries.filter(entry => entry.sessionId === sessionId);
}

function getIndex(sessionId) {
  !curIndex[sessionId] && setIndex(sessionId, 0);
  return curIndex[sessionId];
}

function setIndex(sessionId, newVal) {
  curIndex[sessionId] = newVal;
}
