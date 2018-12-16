"use strict";

require("@babel/polyfill");

var _docx = require("docx");

var fs = _interopRequireWildcard(require("fs"));

var _ultimateGuitarSearcher = require("./ultimateGuitarSearcher");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var maxLinesPerSong = 116;
var linesInSinglePage = 67;
var maxColumns = 90; // Todo: add capo info

main();

function main() {
  return _main.apply(this, arguments);
}

function _main() {
  _main = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var songArray, doc, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, song, packer;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return fs.readFileSync("in.txt").toString().split("\r\n");

          case 2:
            songArray = _context.sent;
            doc = new _docx.Document(undefined, {
              top: 500,
              right: 500,
              bottom: 500,
              left: 500
            });
            doc.Styles.createParagraphStyle("monospaced").basedOn("Normal").font("Courier New");
            doc.Styles.createParagraphStyle("tiny").basedOn("Normal").font("Courier New").size(12);
            doc.addParagraph(new _docx.Paragraph("Table of Contents:").title());
            songArray.map(function (song) {
              return doc.addParagraph(new _docx.Paragraph(song).style("monospaced"));
            });
            doc.addParagraph(new _docx.Paragraph().pageBreakBefore());
            console.log(songArray);
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 13;
            _iterator = songArray[Symbol.iterator]();

          case 15:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 22;
              break;
            }

            song = _step.value;
            _context.next = 19;
            return processSong(song, doc);

          case 19:
            _iteratorNormalCompletion = true;
            _context.next = 15;
            break;

          case 22:
            _context.next = 28;
            break;

          case 24:
            _context.prev = 24;
            _context.t0 = _context["catch"](13);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 28:
            _context.prev = 28;
            _context.prev = 29;

            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }

          case 31:
            _context.prev = 31;

            if (!_didIteratorError) {
              _context.next = 34;
              break;
            }

            throw _iteratorError;

          case 34:
            return _context.finish(31);

          case 35:
            return _context.finish(28);

          case 36:
            packer = new _docx.Packer();
            packer.toBuffer(doc).then(function (buffer) {
              fs.writeFileSync("My Document.docx", buffer);
            });

          case 38:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[13, 24, 28, 36], [29,, 31, 35]]);
  }));
  return _main.apply(this, arguments);
}

function processSong(_x, _x2) {
  return _processSong.apply(this, arguments);
}

function _processSong() {
  _processSong = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(song, doc) {
    var title, artist, match, tab;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            console.log(song);
            title = song.split(" - ")[0].replace(/\(.+\)/g, "");
            artist = song.split(" - ").slice(-1);
            console.log("".concat(title, " - ").concat(artist));
            _context2.next = 6;
            return (0, _ultimateGuitarSearcher.getBestMatch)(artist, title);

          case 6:
            match = _context2.sent;

            if (match) {
              _context2.next = 10;
              break;
            }

            console.error("Couldn't locate song: ".concat(song));
            return _context2.abrupt("return");

          case 10:
            _context2.next = 12;
            return (0, _ultimateGuitarSearcher.getTab)(match.url);

          case 12:
            tab = _context2.sent;
            writeTabToDoc(tab, doc);

          case 14:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _processSong.apply(this, arguments);
}

function writeTabToDoc(tab, doc) {
  console.log("writing ".concat(tab.name, " to doc"));
  doc.addParagraph(new _docx.Paragraph("".concat(tab.name, " - ").concat(tab.artist)).style("monospaced").pageBreakBefore());
  doc.addParagraph(new _docx.Paragraph("".concat(tab.url)).style("tiny"));
  doc.addParagraph(new _docx.Paragraph("").style("monospaced"));
  var tabLines = tab.content.text.split("\n");
  var firstLineOfChords = tabLines.findIndex(function (line) {
    return line.includes("[ch]");
  });
  var capoLine = tabLines.find(function (line) {
    return line.includes("capo");
  }) ? [tabLines.find(function (line) {
    return line.includes("capo");
  })] : [];
  debugger;
  var textLines = capoLine.concat(tab.content.text.replace(/\[ch\]/g, "").replace(/\[\/ch\]/g, "").split("\n").slice(firstLineOfChords, maxLinesPerSong));
  if (textLines.filter(function (line) {
    return line.length > maxColumns;
  }).length > 0) console.error("".concat(tab.name, " contains lines that are too long\n"));
  textLines.map(function (line) {
    return doc.addParagraph(new _docx.Paragraph(line).style("monospaced"));
  });
  if (textLines.length < linesInSinglePage) doc.addParagraph(new _docx.Paragraph().pageBreakBefore());
}