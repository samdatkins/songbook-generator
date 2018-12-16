import "@babel/polyfill";
import * as fs from "fs";
import { TabWriter } from "./tabWriter";
import { getBestMatch, getTab } from "./ultimateGuitarSearcher";

// Have to use a wrapper function because babel won't recognize async at top level
main();

async function main() {
  var songArray = await fs
    .readFileSync("in.txt")
    .toString()
    .split("\r\n");

  const tabWriter = new TabWriter();

  tabWriter.addTableOfContents(songArray);

  console.log(songArray);

  for (const song of songArray) {
    const tab = await getTabForSong(song, tabWriter);
    tab && tabWriter.writeTabToDoc(tab);
  }

  tabWriter.save("My Document.docx");
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

  return await getTab(match.url);
}
