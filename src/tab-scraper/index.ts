const request = require("request");
const utils = require("./utils");

export function search(query, callback, requestOptions = {}) {
  query = utils.formatSearchQuery(query);
  requestOptions["url"] =
    process.env["TABS_BASE_URL"] + "/search.php?" + utils.encodeParams(query);
  request(requestOptions, (error, response, body) => {
    if (error) {
      callback(error, null, response, body);
    } else if (response.statusCode !== 200) {
      callback(new Error("Bad response"), null, response, body);
    } else {
      const tabs = utils.parseListTABs(body);
      callback(null, tabs, response, body);
    }
  });
}

export function autocomplete(query, callback, requestOptions = {}) {
  query = query.toLowerCase();
  const letter = query[0];
  // The tab site's autocomplete only supports a maximum of 5 characters, and underscores are recognized as spaces.
  query = query.slice(0, 5).replace(" ", "_");
  requestOptions["url"] =
    process.env["TABS_BASE_URL"] +
    "/static/article/suggestions/" +
    letter +
    "/" +
    query +
    ".js";
  request(requestOptions, (error, response, body) => {
    if (error) {
      callback(error, null, response, body);
    } else if (response.statusCode !== 200) {
      callback(new Error("Bad response"));
    } else {
      try {
        const results = JSON.parse(body);
        if (results.hasOwnProperty("suggestions")) {
          callback(null, results["suggestions"], response, body);
        } else {
          callback(new Error("Bad response"), null, response, body);
        }
      } catch (e) {
        callback(new Error("Bad response"), null, response, body);
      }
    }
  });
}

export function get(tabUrl, callback, requestOptions = {}) {
  requestOptions["url"] = tabUrl;
  request(requestOptions, (error, response, body) => {
    if (error) {
      callback(error, null, response, body);
    } else if (response.statusCode !== 200) {
      callback(new Error("Bad response"), null, response, body);
    } else {
      const tab = utils.parseSingleTAB(body, tabUrl);
      if (tab) {
        callback(null, tab, response, body);
      } else {
        callback(new Error("Can't parse TAB"), null, response, body);
      }
    }
  });
}
