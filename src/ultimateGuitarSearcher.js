import * as ugs from "ultimate-guitar-scraper";

const maxLinesPerSong = 116;

export async function getBestMatch(artist, title) {
  var matches;
  try {
    matches = await fetchMatches(artist, title);
  } catch {
    return null;
  }

  if (matches.length == 0) return null;

  const maxNumberOfRatings = matches.reduce((prev, cur) =>
    prev.numberRates > cur.numberRates ? prev : cur,
  ).numberRates;

  return matches.reduce((prev, cur) =>
    (prev.numberRates / maxNumberOfRatings) * prev.rating >
    (cur.numberRates / maxNumberOfRatings) * cur.rating
      ? prev
      : cur,
  );
}

async function fetchMatches(artist, title) {
  return new Promise((resolve, reject) => {
    ugs.search(
      {
        query: `${artist} ${title}`,
        page: 1,
        type: ["Chords"],
      },
      (error, tabs) => {
        if (error) {
          reject(error);
        } else {
          resolve(tabs);
        }
      },
    );
  });
}

export async function getTabForUrl(url) {
  return new Promise((resolve, reject) => {
    ugs.get(url, (error, tab) => {
      if (error) {
        console.error(`Failed to find tab at URL: ${url}`);
        reject();
      } else {
        resolve(formatTab(tab));
      }
    });
  });
}

function formatTab(tab) {
  const tabLines = tab.content.text.split("\n");
  const firstLineOfChords = tabLines.findIndex(line => line.includes("[ch]"));
  const capoString = tabLines.find(line => line.toUpperCase().includes("CAPO"));
  const capoLine = capoString ? [capoString] : [];

  const textLines = capoLine.concat(
    tab.content.text.split("\n").slice(firstLineOfChords, maxLinesPerSong),
  );

  tab.content.text = textLines.join("\n");
  return tab;
}
