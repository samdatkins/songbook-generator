import "@babel/polyfill";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express from "express";
import * as fs from "fs";
import path from "path";
import { sendEmail } from "./emailClient";
import { getSpotifyPlaylistTracks } from "./spotifyPlaylistReader";
import { TabWriter } from "./tabWriter";
import { getBestMatch, getTabForUrl } from "./ultimateGuitarSearcher";

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.post("/submit-tab", (req, res) => {
  console.log(req.body.playlist);
  processSongbook(req.body.playlist, req.body.email);
  res.sendFile(path.join(__dirname, "../public", "/songbook-processing.html"));
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname + "/index.html")));

app.get("/spotifyPlaylist", async (req, res) =>
  res.send(await getSpotifyPlaylistTracks(req.query.playlist_id)),
);

app.listen(process.env["PORT"] || 3000, () =>
  console.log(`Tab writer app listening on port ${process.env["PORT"]}!`),
);

async function processSongbook(playlistFile, toEmailAddress) {
  const songArray = playlistFile.split("\n");
  console.log(songArray);

  const { songOverrides } = JSON.parse(fs.readFileSync("songOverrides.json"));

  const tabWriter = new TabWriter();

  tabWriter.addTableOfContents(songArray);

  console.log(songArray);

  for (const song of songArray) {
    const override = getSongOverrideIfAny(song, songOverrides);
    var tab;
    override
      ? (tab = await getTabForUrl(override.urlOverride))
      : (tab = await getTabForSong(song, tabWriter));

    tab && tabWriter.writeTabToDoc(tab);
  }

  const tabAttachment = await tabWriter.getDocAsBase64String();

  const result = await sendEmail(toEmailAddress, tabAttachment);
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
  const match = await getBestMatch(artist, title);
  if (!match) {
    console.error(`Couldn't locate song: ${song}`);
    return;
  }

  return await getTabForUrl(match.url);
}

function trimAndCompareStringsInsensitive(s1, s2) {
  return s1.trim().toUpperCase() === s2.trim().toUpperCase();
}
