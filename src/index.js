import "@babel/polyfill";
import { Document, Packer, Paragraph } from "docx";
import * as fs from "fs";
import { getBestMatch, getTab } from "./ultimateGuitarSearcher";

main();

async function main() {
  const songs = [
    {
      artist: "Pink Floyd",
      title: "Wish you were here",
    },
    {
      artist: "Incubus",
      title: "Wish you were here",
    },
  ];

  const doc = new Document();

  doc.Styles.createParagraphStyle("monospaced")
    .basedOn("Normal")
    .font("Courier New");
  doc.Styles.createParagraphStyle("tiny")
    .basedOn("Normal")
    .font("Courier New")
    .size(12);

  doc.addParagraph(new Paragraph("New Power Hour!").title());

  // Why do we need to await these promises later?
  const songPromises = songs.map(async (song) => {
    const match = await getBestMatch(song.artist, song.title);
    const tab = await getTab(match.url);
    writeTabToDoc(tab, doc);
  });

  await Promise.all(songPromises);

  const packer = new Packer();

  packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync("My Document.docx", buffer);
  });
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

  const textParagraphs = tab.content.text
    .replace(/\[ch\]/g, "")
    .replace(/\[\/ch\]/g, "")
    .split("\n");

  textParagraphs.map(paragraph =>
    doc.addParagraph(new Paragraph(paragraph).style("monospaced")),
  );
}
