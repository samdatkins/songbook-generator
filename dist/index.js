"use strict";

require("@babel/polyfill");

var _docx = require("docx");

var fs = _interopRequireWildcard(require("fs"));

var _ultimateGuitarSearcher = require("./ultimateGuitarSearcher");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

main();

function main() {
  return _main.apply(this, arguments);
}

function _main() {
  _main = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var songs, doc, songPromises, packer;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            songs = [{
              artist: "Pink Floyd",
              title: "Wish you were here"
            }, {
              artist: "Incubus",
              title: "Wish you were here"
            }];
            doc = new _docx.Document();
            doc.Styles.createParagraphStyle("monospaced").basedOn("Normal").font("Courier New");
            doc.Styles.createParagraphStyle("tiny").basedOn("Normal").font("Courier New").size(12);
            doc.addParagraph(new _docx.Paragraph("New Power Hour!").title());
            songPromises = songs.map(
            /*#__PURE__*/
            function () {
              var _ref = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee(song) {
                var match, tab;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return (0, _ultimateGuitarSearcher.getBestMatch)(song.artist, song.title);

                      case 2:
                        match = _context.sent;
                        _context.next = 5;
                        return (0, _ultimateGuitarSearcher.getTab)(match.url);

                      case 5:
                        tab = _context.sent;
                        writeTabToDoc(tab, doc);
                        return _context.abrupt("return");

                      case 8:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x) {
                return _ref.apply(this, arguments);
              };
            }());
            _context2.next = 8;
            return Promise.all(songPromises);

          case 8:
            packer = new _docx.Packer();
            packer.toBuffer(doc).then(function (buffer) {
              fs.writeFileSync("My Document.docx", buffer);
            });

          case 10:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _main.apply(this, arguments);
}

function writeTabToDoc(tab, doc) {
  console.log("writing ".concat(tab.name, " to doc"));
  doc.addParagraph(new _docx.Paragraph("".concat(tab.name, " - ").concat(tab.artist)).style("monospaced").pageBreakBefore());
  doc.addParagraph(new _docx.Paragraph("".concat(tab.url)).style("tiny"));
  doc.addParagraph(new _docx.Paragraph("").style("monospaced"));
  var textParagraphs = tab.content.text.replace(/\[ch\]/g, "").replace(/\[\/ch\]/g, "").split("\n");
  textParagraphs.map(function (paragraph) {
    return doc.addParagraph(new _docx.Paragraph(paragraph).style("monospaced"));
  });
}