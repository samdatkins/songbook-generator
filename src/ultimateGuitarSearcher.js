import * as ugs from "ultimate-guitar-scraper";

export async function getBestMatch(artist, title) {
  const matches = await fetchMatches(artist, title);

  if (matches.length == 0)
    return null;

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
          reject();
        } else {
          resolve(tabs);
        }
      },
    );
  });
}

export async function getTab(url) {
  return new Promise((resolve, reject) => {
    ugs.get(
      url,
      (error, tab) => {
        if (error) {
          reject();
        } else {
          resolve(tab);
        }
      },
    );
  });
}
