import { useEffect, useState } from "react";
import { Song } from "../models/song";
import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";

function CurrentSongView() {
  const [currentSong, setCurrentSong] = useState<Song>();
  const splitTab = currentSong && currentSong.tab;

  useEffect(() => {
    async function getCurrentSong() {
      setCurrentSong({} as Song);
    }

    getCurrentSong();
  }, []);

  return (
    <>
      <span>hello</span>
      {!currentSong ? (
        <Spinner />
      ) : (
        <Flex padding="1rem" flexDir="column"></Flex>
      )}
    </>
  );
}

export default CurrentSongView;
