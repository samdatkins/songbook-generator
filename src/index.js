import "@babel/polyfill";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express from "express";
import enforce from "express-sslify";
import path from "path";
import { getMostPopularSongsForTimePeriod } from "./billboardTopHundredAggregator";
import { processSongbook } from "./songbookCreator";
import { getSpotifyPlaylistTracks } from "./spotifyPlaylistReader";
import { getTabForUrl } from "./ultimateGuitarSearcher";

dotenv.config();

const app = express();
process.env["REQUIRE_HTTPS"] !== "false" &&
  app.use(enforce.HTTPS({ trustProtoHeader: true }));

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
const songEntries = [
  {
    song: "I Melt With You - Modern English",
    url:
      "https://tabs.ultimate-guitar.com/tab/modern_english/i_melt_with_you_chords_566021",
  },
  {
    song: "The Boys Of Summer - Don Henley",
    url:
      "https://tabs.ultimate-guitar.com/tab/don_henley/the_boys_of_summer_chords_1158736",
  },
  {
    song: "I Think Were Alone Now - Tiffany",
    url:
      "https://tabs.ultimate-guitar.com/tab/tiffany/i_think_were_alone_now_chords_87379",
  },
];

app.get("/live/:sessionId/view", async (req, res) =>
  res.sendFile(path.join(__dirname, "../public", "/livePlaylist.html")),
);

app.get("/live/:sessionId/current", async (req, res) =>
  res.json(await getTabForUrl(songEntries[curIndex].url)),
);

app.post("/live/:sessionId/next", async (req, res) =>
  res.json(await getTabForUrl(songEntries[++curIndex].url)),
);

app.post("/live/:sessionId/prev", async (req, res) =>
  res.json(await getTabForUrl(songEntries[--curIndex].url)),
);

app.listen(process.env["PORT"] || 3000, () =>
  console.log(`Tab writer app listening on port ${process.env["PORT"]}!`),
);
