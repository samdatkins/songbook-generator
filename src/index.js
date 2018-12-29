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

var curIndex = 0;
var songEntries = [];

app.get("/live/:sessionId/view", async (req, res) =>
  res.sendFile(path.join(__dirname, "../public", "/livePlaylist.html")),
);

app.get("/live/:sessionId/modify", async (req, res) =>
  res.sendFile(path.join(__dirname, "../public", "/addToLivePlaylist.html")),
);

app.get("/live/:sessionId/current", async (req, res) =>
  res.json(await getLivePlaylistModel(curIndex)),
);

app.get("/live/:sessionId/count", async (req, res) =>
  res.json({ count: songEntries.length }),
);

app.post("/live/:sessionId/next", async (req, res) =>
  res.json(await getLivePlaylistModel(++curIndex)),
);

app.post("/live/:sessionId/prev", async (req, res) =>
  res.json(await getLivePlaylistModel(--curIndex)),
);

app.post("/live/:sessionId/add", async (req, res) => {
  const match = await getBestMatch(req.body.song);
  if (!match) {
    res.send(
      `<p>No matches found :(</p><a href='/live/${
        req.query.sessionID
      }/modify><- Back</a>`,
    );
  }
  const songName = `${match.artist} - ${match.name}`;
  const newEntry = {
    song: songName,
    url: match.url,
  };

  if (songEntries.filter(entry => entry.url === match.url).length === 0) {
    songEntries.push(newEntry);
  }
  res.render("test.ejs", newEntry);
});

app.get("/live/:sessionId/remove", async (req, res) => {
  songEntries = songEntries.filter(entry => entry.url !== req.query.url);
  res.redirect(`/live/${req.query.sessionId}/modify`);
});

app.get("/live/:sessionId/dump", async (req, res) => {
  res.json(songEntries);
});

app.post("/live/:sessionId/restore", async (req, res) => {
  songEntries = JSON.parse(req.body.songs);
  res.end();
});

app.get("/live/:sessionId/setCurrent", async (req, res) => {
  curIndex = req.query.cur - 1;
  res.json(curIndex);
});

app.listen(process.env["PORT"] || 3000, () =>
  console.log(`Tab writer app listening on port ${process.env["PORT"]}!`),
);

async function getLivePlaylistModel() {
  if (curIndex + 1 > songEntries.length) {
    curIndex = songEntries.length - 1;
  } else if (curIndex < 0) {
    curIndex = 0;
  }

  if (songEntries.length === 0) return null;

  const tab = await getTabForUrl(songEntries[curIndex].url);
  return { tab, current: curIndex + 1, total: songEntries.length };
}
