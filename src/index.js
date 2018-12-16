import "@babel/polyfill";
import { Document, Packer, Paragraph } from "docx";
import * as fs from "fs";
import { getBestMatch, getTab } from "./ultimateGuitarSearcher";

const maxLinesPerSong = 116;
const linesInSinglePage = 67;
const maxColumns = 90;

// Have to use main because babel async won't work at top level
main();

async function main() {
  var songArray = await fs
    .readFileSync("in.txt")
    .toString()
    .split("\r\n");

  const doc = new Document(undefined, {
    top: 500,
    right: 500,
    bottom: 500,
    left: 500,
  });

  doc.Styles.createParagraphStyle("monospaced")
    .basedOn("Normal")
    .font("Courier New");
  doc.Styles.createParagraphStyle("tiny")
    .basedOn("Normal")
    .font("Courier New")
    .size(12);

  doc.addParagraph(new Paragraph("Table of Contents:").title());
  songArray.map(song =>
    doc.addParagraph(new Paragraph(song).style("monospaced")),
  );
  doc.addParagraph(new Paragraph().pageBreakBefore());

  console.log(songArray);

  for (const song of songArray) {
    await processSong(song, doc);
  }

  const packer = new Packer();

  packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync("My Document.docx", buffer);
  });
}

async function processSong(song, doc) {
  console.log(song);
  const title = song.split(" - ")[0].replace(/\(.+\)/g, "");
  const artist = song.split(" - ").slice(-1);
  console.log(`${title} - ${artist}`);
  const match = await getBestMatch(artist, title);
  if (!match) {
    console.error(`Couldn't locate song: ${song}`);
    return;
  }

  const tab = await getTab(match.url);
  writeTabToDoc(tab, doc);
}

function writeTabToDoc(tab, doc) {
  console.log(`writing ${tab.name} to doc`);
  doc.addParagraph(
    new Paragraph(`${tab.name} - ${tab.artist}`)
      .style("monospaced")
      .pageBreakBefore(),
  );
  doc.addParagraph(new Paragraph(`${tab.url}`).style("tiny"));
  doc.addParagraph(new Paragraph("").style("monospaced"));

  const tabLines = tab.content.text.split("\n");
  const firstLineOfChords = tabLines.findIndex(line => line.includes("[ch]"));
  const capoLine = tabLines.find(line => line.includes("capo"))
    ? [tabLines.find(line => line.includes("capo"))]
    : [];

  if (hasAnyOverflowingLines(tab.content.text, capoLine, firstLineOfChords))
    console.error(`${tab.name} contains lines that are too long\n`);

  const textLines = capoLine.concat(
    tab.content.text.split("\n").slice(firstLineOfChords, maxLinesPerSong),
  );

  textLines.map(line => writeLineToDoc(line, doc));

  if (textLines.length < linesInSinglePage)
    doc.addParagraph(new Paragraph().pageBreakBefore());
}

function writeLineToDoc(line, doc) {
  const para = doc.createParagraph().style("monospaced");

  const lineSplitByFormatting = line.split(/\[\/?ch\]/g);
  
  lineSplitByFormatting.forEach((lineFragment, index) => {
    if (lineFragment.length === 0)
      return;

    if (index % 2 === 0)
      para.createTextRun(lineFragment);
    else
      para.createTextRun(lineFragment).color("blue");
  });
}

function hasAnyOverflowingLines(tabContent, capoLine, firstLineOfChords) {
  const textLines = capoLine.concat(
    tabContent
      .replace(/\[ch\]/g, "")
      .replace(/\[\/ch\]/g, "")
      .split("\n")
      .slice(firstLineOfChords, maxLinesPerSong),
  );

  if (textLines.filter(line => line.length > maxColumns).length > 0)
    return true;

  return false;
}
