import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express from "express";
import enforce from "express-sslify";
import * as _ from "lodash";
import path from "path";
import "./db/knexfile";
import {
  addSongToSession,
  createNewSongbookSession,
  getAllActiveSongsForSession,
  getAllSongbooks,
  getAllSongs,
  getCurrentActiveSongForSession,
  getIndexOfCurrentSong,
  getSong,
  getSongbookForSession,
  getTotalNumberOfActiveSongsForSession,
  isSongbookFull,
  isValidSongbookSession,
  safeDeleteSongFromSession,
  setLastNavActionToNow,
  setMaxSongsForSession,
  setNoodleModeForSession,
  setSongToNextActiveSongForSession,
  setSongToPrevActiveSongForSession,
  setSongToSpecificIndexOfActiveSongsForSession,
  updateSong,
} from "./db/repositories/songbook";
import apiRouter from "./routes/api";
import { getSpotifyPlaylistTracks } from "./spotifyPlaylistReader";
import * as ugs from "./tab-scraper";
import { formatTab, getBestMatch, getTabForUrl } from "./tabSearcher";
dotenv.config();

const alphaRegex = /[^0-9A-Za-z\ ]+/g;

const app = express();
process.env["REQUIRE_HTTPS"] !== "false" &&
  app.use(enforce.HTTPS({ trustProtoHeader: true }));

app.set("views", path.join(__dirname, "../views")); // set express to look in this folder to render our view
app.set("view engine", "ejs"); // configure template engine
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.get("/playlistGenerator", (req, res) =>
  res.sendFile(path.join(__dirname, "../public", "/playlistGenerator.html"))
);

app.get("/spotifyPlaylist", async (req, res) =>
  res.send(await getSpotifyPlaylistTracks(req.query.playlist_id))
);

// Live playlist code below (break out in to own file later)
app.get("/", (req, res) => res.redirect(`/live`));
app.get("/live", (req, res) =>
  res.sendFile(path.join(__dirname, "../public", "/liveLanding.html"))
);

app.get("/live/tab-autocomplete", async (req, res) => {
  const results = await new Promise((resolve, reject) => {
    ugs.autocomplete(
      (req.query.term as any).replace(alphaRegex, ""),
      (error, tabs) => {
        if (error) {
          reject(error);
        } else {
          resolve(tabs);
        }
      }
    );
  });
  res.json(results);
});

app.get("/live/:sessionKey/view", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }

  const songbook = await getSongbookForSession(req.params.sessionKey);

  setLastNavActionToNow(req.params.sessionKey);

  const passengerMode =
    ((req.query.passengerMode || "") as any).toLowerCase() === "true";

  return res.render("viewLivePlaylist.ejs", {
    sessionKey: songbook.session_key,
    powerHourTitle: songbook.title,
    noodleMode: songbook.is_noodle_mode,
    passengerMode: passengerMode,
  });
});

app.get("/songs/:tabUrl/view", async (req, res) => {
  const song = await getSong(req.params.tabUrl);

  return res.render("viewSong.ejs", {
    song: song,
  });
});

app.get("/live/:sessionKey/add", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }

  const songbook = await getSongbookForSession(req.params.sessionKey);

  return res.render("addToLivePlaylist.ejs", {
    sessionKey: songbook.session_key,
    powerHourTitle: songbook.title,
    noodleMode: songbook.is_noodle_mode,
  });
});

app.get("/live/:sessionKey/current", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }
  const songbook = await getSongbookForSession(req.params.sessionKey);

  const curSong = await getCurrentPlaylistSong(
    req.params.sessionKey,
    songbook.is_noodle_mode
  );
  if (!curSong) res.status(204);
  return res.json(curSong);
});

app.get("/live/:sessionKey/count", async (req, res) =>
  res.json({
    count: await getTotalNumberOfActiveSongsForSession(req.params.sessionKey),
  })
);

app.get("/live/view", async (req, res) => {
  res.redirect(`/live/${req.query.sessionKey}/view`);
});

app.get("/live/create", (req, res) =>
  res.sendFile(path.join(__dirname, "../public", "/createSongbook.html"))
);

app.post("/live/create", async (req, res) => {
  const alphaNumericAndDashesRegex = /^[0-9A-Za-z\-]+$/;
  if (!req.body.sessionKey.match(alphaNumericAndDashesRegex)) {
    res.status(400);
    res.json(
      "Illegal name! You may only use letters, numbers, and dashes (no spaces!)"
    );
  }

  if (await isValidSongbookSession(req.body.sessionKey)) {
    res.status(400);
    return res.json("Songbook already exists");
  }

  await createNewSongbookSession(
    req.body.sessionKey,
    req.body.title,
    req.body.maxSongLimit || null,
    req.body.isNoodleMode === "on"
  );
  res.redirect(`/live/${req.body.sessionKey}/view`);
});

app.get("/live/:sessionKey/next", async (req, res) => {
  await setSongToNextActiveSongForSession(req.params.sessionKey);
  res.redirect(`/live/${req.params.sessionKey}/view`);
});

app.get("/live/:sessionKey/prev", async (req, res) => {
  await setSongToPrevActiveSongForSession(req.params.sessionKey);
  res.redirect(`/live/${req.params.sessionKey}/view`);
});

app.post("/live/:sessionKey/next", async (req, res) => {
  await setSongToNextActiveSongForSession(req.params.sessionKey);
  const songbook = await getSongbookForSession(req.params.sessionKey);

  res.json(
    await getCurrentPlaylistSong(req.params.sessionKey, songbook.is_noodle_mode)
  );
});

app.post("/live/:sessionKey/prev", async (req, res) => {
  await setSongToPrevActiveSongForSession(req.params.sessionKey);
  const songbook = await getSongbookForSession(req.params.sessionKey);

  res.json(
    await getCurrentPlaylistSong(req.params.sessionKey, songbook.is_noodle_mode)
  );
});

app.post("/live/:sessionKey/add", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }

  if (await isSongbookFull(req.params.sessionKey)) {
    res.status(400);
    return res.send(
      `<p>Songbook full, no more requests allowed! </p><a href='/live/${req.params.sessionKey}/add><- Back</a>`
    );
  }

  const match = await getBestMatch(req.body.song.replace(alphaRegex, ""));
  if (!match) {
    res.send(
      `<p>No matches found :(</p><a href='/live/${req.params.sessionKey}/add><- Back</a>`
    );
  }
  const tab = (await getTabForUrl(match.url)) as any;

  const newSong = {
    artist: tab.artist,
    title: tab.name,
    url: tab.url,
    content: tab.content.text,
  };

  addSongToSession(newSong, req.params.sessionKey);

  res.render("addToLivePlaylistConfirm.ejs", {
    artist: newSong.artist,
    title: newSong.title,
    sessionKey: req.params.sessionKey,
    url: newSong.url,
  });
});

app.get("/live/songs/:url/edit", async (req, res) => {
  const song = await getSong(req.params.url);
  res.render("editSong.ejs", {
    artist: song.artist,
    title: song.title,
    url: song.url,
    content: song.content,
  });
});

// this really should be a PUT but I'm using straight HTML to submit it so it's
// a post
app.post("/live/songs/:url/edit", async (req, res) => {
  await updateSong(req.params.url, req.body.content);
  return res.json("success");
});

// used by viewer, should eventually be only endpoint (e.g. remove the get version)
app.post("/live/:sessionKey/remove", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }

  await safeDeleteSongFromSession(req.body.url, req.params.sessionKey);

  const songbook = await getSongbookForSession(req.params.sessionKey);

  const curSong = await getCurrentPlaylistSong(
    req.params.sessionKey,
    songbook.is_noodle_mode
  );
  if (!curSong) res.status(204);
  return res.json(curSong);
});

// used by phones, hack because it's easier to do query strings in dumb html/js
app.get("/live/:sessionKey/remove", async (req, res) => {
  safeDeleteSongFromSession(req.query.url, req.params.sessionKey);
  res.redirect(`/live/${req.params.sessionKey}/add`);
});

app.get("/live/:sessionKey/index", async (req, res) => {
  var index = 0;
  return res.send(
    (await getAllActiveSongsForSession(req.params.sessionKey)).reduce(
      (acc, song) =>
        acc +
        `<a href="/live/${req.params.sessionKey}/setCurrent?cur=${index++}">${
          song.artist
        } - ${song.title}</a>` +
        " - " +
        `<a href="/live/songs/${encodeURIComponent(song.url)}/edit">edit</a>` +
        "<br />",
      ""
    )
  );
});

app.get("/live/:sessionKey/setCurrent", async (req, res) => {
  setSongToSpecificIndexOfActiveSongsForSession(
    req.params.sessionKey,
    req.query.cur
  );
  res.redirect(`/live/${req.params.sessionKey}/view`);
});

app.get("/live/:sessionKey/setMaxSongs", async (req, res) => {
  await setMaxSongsForSession(
    req.params.sessionKey,
    parseInt(req.query.maxSongs as any)
  );
  res.json(`Set max songs to ${req.query.maxSongs}`);
});

app.get("/live/:sessionKey/setNoodleMode", async (req, res) => {
  const isNoodleMode = (req.query.noodleMode as any).toLowerCase() === "true";
  await setNoodleModeForSession(req.params.sessionKey, isNoodleMode);
  res.json(`Set noodleMode to ${isNoodleMode}`);
});

app.get("/live/secretList", async (req, res) => {
  const songbookList = await getAllSongbooks();
  res.render("secretList.ejs", {
    songbookList,
  });
});

app.get("/live/secretList2", async (req, res) => {
  const songs = await getAllSongs();
  res.render("secretList2.ejs", {
    songs,
  });
});

// app.get("/live/playlistToPdf", async (req, res) => {
//   const songbook = await getSongbookForSession(req.query.sessionKey);
//   const songs = await getAllActiveSongsForSession(req.query.sessionKey);

//   const email = req.query.email;
//   const tabs = songs.map((song) => convertSongToTab(song));
//   await generateSongbook(
//     tabs,
//     email,
//     true, // do add TOC
//     songbook.title
//   );

//   res.json("done");
// });

// app.get("/live/allPlaylistsToPdf", async (req, res) => {
//   const songbooks = await getAllSongbooks();
//   const email = req.query.email;

//   for (const songbook of songbooks) {
//     const songs = await getAllActiveSongsForSession(songbook.session_key);
//     const tabs = songs.map((song) => convertSongToTab(song));
//     await generateSongbook(
//       tabs,
//       email,
//       true, // do add TOC
//       songbook.title
//     );
//   }

//   res.json("done");
// });

app.use(express.static(path.resolve(__dirname, "../frontend/build")));
app.get("/react", async (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build", "index.html"));
});

app.get("/help", async (req, res) => {
  res.send(`/live/{sessionKey}/setMaxSongs?maxSongs={numberOfSongs}<br>
  /live/{sessionKey}/setNoodleMode?noodleMode={true/false}<br>
  /live/{sessionKey}/index<br>
  /live/{sessionKey}/remove?url={url pasted directly from the view page}<br><br>
  Old stuff:<br>
  /playlistGenerator<br>
  /spotifyPlaylist<br>`);
});

app.use("/api", apiRouter);

const WEB_MAX_LINES_PER_SONG = 90;
async function getCurrentPlaylistSong(sessionKey, isNoodleMode = false) {
  const song = await getCurrentActiveSongForSession(sessionKey);

  if (!song) {
    return null;
  }

  const totalActiveSongs = await getTotalNumberOfActiveSongsForSession(
    sessionKey
  );

  const tab = formatTab(
    song.content,
    isNoodleMode ? 9999 : WEB_MAX_LINES_PER_SONG
  );

  return {
    artist: song.artist,
    title: song.title,
    tabUrl: song.url,
    tab,
    current: await getIndexOfCurrentSong(sessionKey),
    total: parseInt(totalActiveSongs),
  };
}

app.listen(process.env["PORT"] || 3001, () =>
  console.log(`Live Power Hour app listening on port ${process.env["PORT"]}!`)
);
