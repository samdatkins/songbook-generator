import { Router } from "express";
import {
  addSongToSession,
  isSongbookFull,
  isValidSongbookSession,
  getAllSongbooksWithRelationships,
} from "../db/repositories/songbook";
import { getBestMatch, getTabForUrl } from "../tabSearcher";
import { StatusCodes } from "http-status-codes";

const alphaRegex = /[^0-9A-Za-z\ ]+/g;
const songbookRouter = Router();

songbookRouter.get("/:sessionKey/test", (req, res) =>
  res.send(`hi ${req.params.sessionKey}`)
);

songbookRouter.get("/jsondump", async (req, res) => {
  return res
    .status(StatusCodes.OK)
    .json(await getAllSongbooksWithRelationships());
});

songbookRouter.post("/:sessionKey/add", async (req, res) => {
  if (!(await isValidSongbookSession(req.params.sessionKey))) {
    return res.status(StatusCodes.NOT_FOUND).json("Invalid session key.");
  }

  if (await isSongbookFull(req.params.sessionKey)) {
    return res
      .status(StatusCodes.CONFLICT)
      .json("Songbook full, no more requests allowed!");
  }

  const match = await getBestMatch(req.body.song.replace(alphaRegex, ""));
  if (!match) {
    res.status(StatusCodes.NOT_FOUND).json("Song match could not be found.");
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

    return res.status(StatusCodes.CREATED).json("Song successfully added!");
  } catch (error) {
    return res.status(400).json("Couldn't find song. :(");
  }
});

export default songbookRouter;
