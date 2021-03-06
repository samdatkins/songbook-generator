import * as ugs from "./tab-scraper";

export async function getBestMatch(term) {
  var matches;
  try {
    matches = await fetchMatches(term);
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

async function fetchMatches(term) {
  return new Promise((resolve, reject) => {
    ugs.search(
      {
        query: `${term}`,
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
        resolve(tab);
      }
    });
  });
}

export function formatTab(tabContent, maxLinesPerSong) {
  const tabLines = tabContent.split("\n");
  const firstLineOfChords = tabLines.findIndex(line => line.includes("[ch]"));
  const capoString = tabLines.find(line => line.toUpperCase().includes("CAPO"));
  const capoLine = capoString ? [capoString] : [];

  const textLines = capoLine.concat(
    tabContent.split("\n").slice(firstLineOfChords, maxLinesPerSong),
  );

  tabContent = textLines.join("\n");
  return tabContent;
}
