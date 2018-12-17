import { Document, Packer, Paragraph } from "docx";
import * as fs from "fs";

const maxLinesPerSong = 116;
const linesInSinglePage = 63;
const maxColumns = 90;

const _writeLineToDoc = Symbol("writeLineToDoc");
const _hasAnyOverflowingLines = Symbol("hasAnyOverflowingLines");

var doc;

export class TabWriter {
  constructor() {
    doc = new Document(undefined, {
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
  }

  save(fileName) {
    const packer = new Packer();

    packer.toBuffer(doc).then(buffer => {
      fs.writeFileSync(fileName, buffer);
    });
  }

  addTableOfContents(songArray) {
    doc.addParagraph(new Paragraph("Table of Contents:").title());
    songArray.map(song =>
      doc.addParagraph(new Paragraph(song).style("monospaced")),
    );
    if (songArray.length <= 63)
      doc.addParagraph(new Paragraph().pageBreakBefore());
  }

  writeTabToDoc(tab) {
    console.log(`Writing ${tab.name} - ${tab.artist} to doc`);
    doc.addParagraph(
      new Paragraph(`${tab.name} - ${tab.artist}`)
        .style("monospaced")
        .pageBreakBefore(),
    );
    doc.addParagraph(new Paragraph(`${tab.url}`).style("tiny"));
    doc.addParagraph(new Paragraph("").style("monospaced"));

    const tabLines = tab.content.text.split("\n");
    const firstLineOfChords = tabLines.findIndex(line => line.includes("[ch]"));
    const capoString = tabLines.find(line =>
      line.toUpperCase().includes("CAPO"),
    );
    const capoLine = capoString ? [capoString] : [];
    debugger;
    if (
      this[_hasAnyOverflowingLines](
        tab.content.text,
        capoLine,
        firstLineOfChords,
      )
    )
      console.error(`${tab.name} contains lines that are too long`);

    const textLines = capoLine.concat(
      tab.content.text.split("\n").slice(firstLineOfChords, maxLinesPerSong),
    );

    textLines.map((line, lineIndex) => this[_writeLineToDoc](line, lineIndex));

    if (textLines.length < linesInSinglePage)
      doc.addParagraph(new Paragraph().pageBreakBefore());
  }

  // private method
  [_writeLineToDoc](line, lineIndex) {
    const lineSplitByFormatting = line.split(/\[\/?ch\]/g);

    // Don't split chord/lyric line pairs over a new page
    if (lineIndex + 1 == linesInSinglePage && lineSplitByFormatting.length > 1)
      doc.addParagraph(new Paragraph(" "));

    const para = doc.createParagraph().style("monospaced");

    lineSplitByFormatting.forEach((lineFragment, index) => {
      if (lineFragment.length === 0) return;

      if (index % 2 === 0) para.createTextRun(lineFragment);
      else para.createTextRun(lineFragment).color("blue");
    });
  }

  // private method
  [_hasAnyOverflowingLines](tabContent, capoLine, firstLineOfChords) {
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
}
