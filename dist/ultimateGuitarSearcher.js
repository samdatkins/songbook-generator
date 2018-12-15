"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBestMatch = getBestMatch;
exports.getTab = getTab;

var ugs = _interopRequireWildcard(require("ultimate-guitar-scraper"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function getBestMatch(_x, _x2) {
  return _getBestMatch.apply(this, arguments);
}

function _getBestMatch() {
  _getBestMatch = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(artist, title) {
    var matches, maxNumberOfRatings;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return fetchMatches(artist, title);

          case 2:
            matches = _context.sent;

            if (!(matches.length == 0)) {
              _context.next = 5;
              break;
            }

            return _context.abrupt("return", null);

          case 5:
            maxNumberOfRatings = matches.reduce(function (prev, cur) {
              return prev.numberRates > cur.numberRates ? prev : cur;
            }).numberRates;
            return _context.abrupt("return", matches.reduce(function (prev, cur) {
              return prev.numberRates / maxNumberOfRatings * prev.rating > cur.numberRates / maxNumberOfRatings * cur.rating ? prev : cur;
            }));

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _getBestMatch.apply(this, arguments);
}

function fetchMatches(_x3, _x4) {
  return _fetchMatches.apply(this, arguments);
}

function _fetchMatches() {
  _fetchMatches = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(artist, title) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", new Promise(function (resolve, reject) {
              ugs.search({
                query: "".concat(artist, " ").concat(title),
                page: 1,
                type: ["Chords"]
              }, function (error, tabs) {
                if (error) {
                  reject();
                } else {
                  resolve(tabs);
                }
              });
            }));

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _fetchMatches.apply(this, arguments);
}

function getTab(_x5) {
  return _getTab.apply(this, arguments);
}

function _getTab() {
  _getTab = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(url) {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt("return", new Promise(function (resolve, reject) {
              ugs.get(url, function (error, tab) {
                if (error) {
                  reject();
                } else {
                  resolve(tab);
                }
              });
            }));

          case 1:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _getTab.apply(this, arguments);
}