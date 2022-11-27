// import * as billboard from "billboard-top-100";
// import * as _ from "lodash";
// import Moment from "moment";
// import { extendMoment } from "moment-range";
// import { sendEmail } from "./emailClient";

// const moment = extendMoment(Moment);

// export async function getMostPopularSongsForTimePeriod(
//   startYear,
//   endYear,
//   count,
//   email,
// ) {
//   var dict = new Object();
//   const dates = Array.from(
//     moment
//       .range(`${parseInt(startYear) - 1}-12-01`, `${parseInt(endYear)}-11-30`)
//       .by("week"),
//   );

//   // Break requests up in to chunks of 52 so we don't make hundreds of requests
//   // at the same time
//   await _.chunk(dates, process.env["BILLBOARD_CHUNK_SIZE"]).reduce(
//     async (acc, dateChunk) => {
//       await acc;
//       const billboardPromises = dateChunk.map(async date => {
//         try {
//           const billboardResults = await getBillboardChart(
//             "hot-100",
//             date.format("YYYY-MM-DD"),
//           );
//           billboardResults.map(songEntry => {
//             const song = `${songEntry.artist} - ${songEntry.title}`;
//             dict[song] === undefined && (dict[song] = 0);
//             dict[song] += 101 - parseInt(songEntry.rank);
//           });
//         } catch (err) {
//           console.log(`Failed to get chart for ${date.format("YYYY-MM-DD")}`);
//         }
//       });

//       await Promise.all(billboardPromises);
//     },
//     Promise.resolve(),
//   );

//   var unorderedSongs = Object.keys(dict).map(function(key) {
//     return [key, dict[key]];
//   });

//   const orderedSongs = unorderedSongs.sort(
//     (first, second) => second[1] - first[1],
//   );

//   const html =
//     "<ol>" +
//     orderedSongs
//       .slice(0, parseInt(count))
//       .reduce((total, cur) => total + `<li>${cur[0]}</li>`, "") +
//     "</ol>";

//   const era = startYear === endYear ? startYear : `${startYear} - ${endYear}`;
//   const result = await sendEmail(
//     email,
//     `Billboard Playlist Generated (${era})`,
//     null,
//     html,
//     null,
//   );
// }

// async function getBillboardChart(chart, date) {
//   return new Promise((resolve, reject) => {
//     billboard.getChart(chart, date, (error, data) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve(data);
//       }
//     });
//   });
// }
