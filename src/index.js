import "@babel/polyfill";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express from "express";
import * as fs from "fs";
import path from "path";
import { sendEmail } from "./emailClient";
import { TabWriter } from "./tabWriter";
import { getBestMatch, getTabForUrl } from "./ultimateGuitarSearcher";

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
const port = 3000;

app.post("/submit-tab", (req, res) => {
  console.log(req.body.playlist);
  processSongbook(req.body.playlist, req.body.email);
  res.send("Songbook processing");
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname + "/index.html")));

app.listen(port, () =>
  console.log(`Tab writer app listening on port ${port}!`),
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
  const title = song.split(" - ")[0].replace(/\(.+\)/g, "");
  const artist = song.split(" - ").slice(-1);
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
