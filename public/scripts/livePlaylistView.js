const sessionKeyRegex = new RegExp("live/(.*)/view");
const sessionKey = sessionKeyRegex.exec(window.location.href)[1];
const songLength = 60;
const waitLength = 7;
const drinkLength = 7;
const totalTimer = songLength + waitLength + drinkLength;

const maxSongPollingInterval = 2;
var lastMaxSongUpdate = new Date();

$(document).ready(function () {
  $("#qrcode").qrcode({
    width: 240,
    height: 240,
    text: window.location.href.replace("view", "add"),
  });
  $("#qrcodelink").attr("href", window.location.href.replace("view", "add"));
  $("#qrcodelink").attr("target", "_blank");

  takePlaylistAction("current", "GET");

  setInterval(refreshSong, 1000);
});

function takePlaylistAction(action, verb, params = {}) {
  $.ajax({
    url: `/live/${sessionKey}/${action}`,
    data: params,
    type: verb,
    success: function (result, textStatus, xhr) {
      if (xhr.status === 204) {
        $("#songTitle").html(
          `<a href="add" target="_blank">No songs! Add some by clicking the QR code -></a>`,
        );
        $("#songTab").hide();
        return;
      }
      $("#songTab").show();

      const title = result.artist + " - " + result.title;
      const tab = result.tab
        .split("\n")
        .join("\n")
        .replace(/\r\n/g, "<br />")
        .replace(/\n/g, "<br />")
        .replace(/\[ch\]/g, "<span class='chord'>")
        .replace(/\[\/ch\]/g, "</span>")
        .replace(/\[tab\]/g, "")
        .replace(/\[\/tab\]/g, "");

      $("#songTitle").html(
        `${title} (${result.current} of <span id='totalSongs'>${result.total}</span>)`,
      );
      $("#songUrl").html(`<a href="${result.tabUrl}">${result.tabUrl}</a>`);
      $("#songTab").html(`${tab}`);
    },
    error: function (xhr, textStatus) {
      if (xhr.status === 404 && xhr.responseText === '"Invalid session key"') {
        $("#songTitle").html(
          `Invalid power hour session key, please create one <a href="/live">here</a>`,
        );
        $("#songTab").hide();
        $("#qrcode").hide();
        return;
      } else {
        alert("Failed to fetch playlist");
      }
    },
    timeout: 5000,
  });
}

function refreshSong() {
  const songUpdateDelta = Date.now() - lastMaxSongUpdate;
  if (songUpdateDelta < maxSongPollingInterval * 1000) {
    return;
  } else {
    lastMaxSongUpdate = Date.now();
  }

  takePlaylistAction("current", "GET");
}
