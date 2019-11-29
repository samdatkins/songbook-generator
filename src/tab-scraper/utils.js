const cheerio = require("cheerio");
const JSON5 = require("json5");

const debug = true;

function extractJavaScriptAssignation($, assignTo) {
  let script = $("script")
    .toArray()
    .find(script => {
      return (
        $(script)
          .html()
          .indexOf(assignTo) !== -1
      );
    });
  if (!script) return;
  const content = $(script).html();
  const index = content.indexOf("=");
  if (index === -1) return;
  try {
    let indexEnd = content.indexOf("};");
    if (indexEnd === -1) {
      indexEnd = content.length;
    } else {
      // Because we search for `};`.
      indexEnd = indexEnd + 1;
    }
    return JSON5.parse(content.slice(index + 1, indexEnd));
  } catch (error) {
    console.error(error);
  }
}

const tabTypes = {
  Video: "Video",
  Tab: "Tab",
  Chords: "Chords",
  Bass: "Bass",
  "Guitar Pro": "Guitar Pro",
  Power: "Power",
  Drums: "Drums",
  Ukulele: "Ukulele",
};

const tabTypeValues = {
  Video: 100,
  Tab: 200,
  Chords: 300,
  Bass: 400,
  "Guitar Pro": 500,
  Power: 600,
  Drums: 700,
  Ukulele: 800,
};

/**
 * Change a string with camelCase to snake_case
 * @param {String} camelCase string
 * @return {String} snake_case string
 */
function underscore(string) {
  let underscored = string[0].toLowerCase();
  return (
    underscored +
    string.slice(1, string.length).replace(/([A-Z])/g, match => {
      return "_" + match.toLowerCase();
    })
  );
}

/**
 * Take the name of a TAB type and return its value.
 * @param {String} type name
 * @return {Number} type value
 */
function validateType(type) {
  type = String(type);
  if (tabTypeValues.hasOwnProperty(type)) {
    return tabTypeValues[type];
  } else {
    throw new Error(
      "Unknown type '" +
        type +
        "'. Accepted type are: '" +
        Object.keys(tabTypeValues).join("', '") +
        "'",
    );
  }
}

function extractContent(tabData) {
  const type = tabData.tab.type_name;
  switch (type) {
    case tabTypes["Video"]:
      let videoId = tabData.tab.marty_youtube_video_id;
      if (!videoId) {
        videoId = tabData.tab_view.wiki_tab.content;
      }
      return {
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    case tabTypes["Tab"]:
    case tabTypes["Chords"]:
    case tabTypes["Bass"]:
    case tabTypes["Drums"]:
    case tabTypes["Ukulele"]:
      return {
        text: tabData.tab_view.wiki_tab.content,
      };
    case tabTypes["Power"]:
    case tabTypes["Guitar Pro"]:
      const id = tabData.tab.id;
      return {
        url: `${process.env["TABS_BASE_URL"]}/tab/download?id=${id}`,
      };
    case tabTypes["Pro"]:
    case tabTypes["Official"]:
      return;
    default:
      if (debug) console.log(`Unknown TAB type '${type}'`);
  }
}

/**
 * Return TABs from the response body.
 */
function parseListTABs(body) {
  const $ = cheerio.load(body);
  const data = JSON.parse($(".js-store")[0].attribs["data-content"]);
  if (!data) return [];
  let results = [];
  if (typeof data.store.page.data.other_tabs !== "undefined") {
    results = results.concat(data.data.other_tabs);
  }
  if (typeof data.store.page.data.results !== "undefined") {
    results = results.concat(data.store.page.data.results);
  }
  return results.reduce((tabs, result) => {
    if (typeof result.marketing_type !== "undefined") return tabs;
    const tab = {};
    // Artist.
    tab.artist = result.artist_name;
    // Name.
    tab.name = result.song_name;
    // Url.
    tab.url = result.tab_url;
    // Rating and number rates.
    tab.rating = result.rating;
    tab.numberRates = result.votes;
    // Type.
    tab.type = result.type_name;

    tabs.push(tab);
    return tabs;
  }, []);
}

function parseSingleTAB(html, tabUrl) {
  const $ = cheerio.load(html);
  const data = JSON.parse($(".js-store")[0].attribs["data-content"]);
  if (!data) return;
  const tabData = data.store.page.data;
  const tab = {};
  // Artist.
  tab.artist = tabData.tab.artist_name;
  // Name.
  tab.name = tabData.tab.song_name;
  // Url.
  tab.url = tabData.tab.tab_url;
  // Rating and number rates.
  tab.rating = tabData.tab.rating;
  tab.numberRates = tabData.tab.votes;
  // Type.
  tab.type = tabData.tab.type_name;
  // Difficulty.
  if (typeof tabData.tab_view.meta.difficulty === "string") {
    tab.difficulty = tabData.tab_view.meta.difficulty;
  }
  // Capo
  if (tabData.tab_view.meta.capo !== undefined) {
    tab.capo = tabData.tab_view.meta.capo;
  }
  // Key
  if (tabData.tab_view.meta.tonality !== undefined) {
    tab.tonality = tabData.tab_view.meta.tonality;
  }
  // Tuning
  if (
    tabData.tab_view.meta.tuning !== undefined &&
    tabData.tab_view.meta.tuning.value !== undefined
  ) {
    tab.tuning = tabData.tab_view.meta.tuning.value;
  }
  // Content.
  tab.content = extractContent(tabData);

  return tab;
}

/**
 * Validate the query params and set the default params for the 'search'
 *
 * @param {Object} query params
 * @return {Object} formatted query params
 */
function formatSearchQuery(query) {
  let params = {};
  let acceptedParams = ["query", "type", "page"];
  let requiredParams = ["query"];
  let defaults = {
    type: [tabTypes["Chords"], tabTypes["Tab"]],
    page: 1,
  };

  // accepted params only
  for (let param in query) {
    let underscored = underscore(param);
    if (acceptedParams.indexOf(underscored) !== -1) {
      params[underscored] = query[param];
    } else {
      throw new Error(
        "Unknown param '" +
          underscored +
          "'. Accepted params are: '" +
          acceptedParams.join("', '") +
          "'.",
      );
    }
  }
  // required params
  for (let i = 0; i < requiredParams.length; i++) {
    if (Object.keys(params).indexOf(requiredParams[i]) === -1) {
      throw new Error("Query requires param '" + requiredParams[i] + "'.");
    }
  }
  // default params
  for (let param in defaults) {
    if (!params.hasOwnProperty(param)) {
      params[param] = defaults[param];
    }
  }
  // param 'type' can be a string or an array of string
  if (Array.isArray(params.type)) {
    for (let i = 0; i < params.type.length; i++) {
      params.type[i] = validateType(params.type[i]);
    }
  } else {
    params.type = validateType(params.type);
  }
  // Rename `query` => `value`
  params.value = params.query;
  delete params.query;

  // to not evoke suspicion, we try to make the same request as in the tab website's web application
  params.search_type = "title";
  params.order = "";

  // avoid the ad page
  params.followRedirect = false;

  return params;
}

function encodeParam(key, value) {
  if (Array.isArray(value)) {
    return value.map(item => encodeParam(`${key}[]`, item)).join("&");
  } else {
    return key + "=" + encodeURIComponent(value);
  }
}

/**
 * Encode the query params
 *
 * @param {Object} query params
 * @return {String} encoded query params
 */
function encodeParams(params) {
  // encode everything
  return Object.keys(params)
    .map(key => {
      return encodeParam(key, params[key]);
    })
    .join("&")
    .replace(/%20/g, "+");
}

module.exports = {
  encodeParams,
  parseListTABs,
  parseSingleTAB,
  formatSearchQuery,
};
