import { Router } from "express";
import {
  addSongToSession,
  isSongbookFull,
  isValidSongbookSession,
} from "../db/repositories/songbook";
import { getBestMatch, getTabForUrl } from "../tabSearcher";

const alphaRegex = /[^0-9A-Za-z\ ]+/g;
const songbookRouter = Router();

songbookRouter.get("/:sessionKey/test", (req, res) =>
  res.send(`hi ${req.params.sessionKey}`),
);

songbookRouter.post("/:sessionKey/add", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    res.status(404);
    return res.json("Invalid session key");
  }

  if (await isSongbookFull(req.params.sessionKey)) {
    res.status(400);
    return res.send(
      `<p>Songbook full, no more requests allowed! </p><a href='/live/${req.params.sessionKey}/add><- Back</a>`,
    );
  }

  const match = await getBestMatch(req.body.song.replace(alphaRegex, ""));
  if (!match) {
    res.send(
      `<p>No matches found :(</p><a href='/live/${req.params.sessionKey}/add><- Back</a>`,
    );
  }
  try {
    const tab = (await getTabForUrl(match.url)) as any;

    const newSong = {
      artist: tab.artist,
      title: tab.name,
      url: tab.url,
      content: tab.content.text,
    };

    addSongToSession(newSong, req.params.sessionKey);

    return res.status(201).json("Song successfully added!");
  } catch (error) {
    return res.status(400).json("Couldn't find song. :(");
  }
});

export default songbookRouter;
