import { useEffect, useState } from "react";
import axios from "axios";
import { Song } from "../models/song";
import { Box, Heading, Link, Spinner, Text } from "@chakra-ui/react";

function CurrentSongView() {
  const [currentSong, setCurrentSong] = useState<Song>();
  const splitTab = currentSong && currentSong.tab.split("\n");

  useEffect(() => {
    async function getCurrentSong() {
      const curSong = await axios.get<Song>("/live/sams-test/current");
      setCurrentSong(curSong.data);
    }

    getCurrentSong();
  }, []);

  return (
    <>
      {!currentSong ? (
        <Spinner />
      ) : (
        <Box padding="1rem">
          <Heading>
            <Link href={currentSong.tabUrl}>
              "{currentSong.title}" by {currentSong.artist}
            </Link>{" "}
            ({currentSong.current} of {currentSong.total})
          </Heading>
          <Box
            bgColor="gray.100"
            mt="1rem"
            p="1rem"
            style={{ columnCount: 2, columnGap: "1rem" }}
          >
            <pre style={{ fontSize: "1.2rem" }}>
              Tab:{" "}
              {splitTab?.map((tabLine) => {
                if (tabLine.includes("[ch]")) {
                  return (
                    <Text color="blue">
                      {tabLine.replaceAll("[ch]", "").replaceAll("[/ch]", "")}
                    </Text>
                  );
                } else {
                  return <Text>{tabLine}</Text>;
                }
              })}
            </pre>
          </Box>
        </Box>
      )}
    </>
  );
}

export default CurrentSongView;
