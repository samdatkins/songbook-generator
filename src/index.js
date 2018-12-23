import "@babel/polyfill";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { sendEmail } from "./emailClient";
import { TabWriter } from "./tabWriter";
import { getBestMatch, getTabForUrl } from "./ultimateGuitarSearcher";

dotenv.config();
// Have to use a wrapper function because babel won't recognize async at top level
main();

async function main() {
  const songArray = await fs
    .readFileSync("in.txt")
    .toString()
    .split("\r\n");

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

  const result = await sendEmail(tabAttachment);
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
