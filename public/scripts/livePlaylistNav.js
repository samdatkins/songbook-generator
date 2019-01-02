const sessionIdRegex = new RegExp("live/(.*)/view");
const sessionId = sessionIdRegex.exec(window.location.href)[1];
const songLength = 60;
const waitLength = 7;
const drinkLength = 7;
const totalTimer = songLength + waitLength + drinkLength;

const playlistTimer = new Interval(tick, 0.1, totalTimer, formatTimer);
const maxSongPollingInterval = 2;
var lastMaxSongUpdate = new Date();

$(document).ready(function() {
  $("#qrcode").qrcode({
    width: 120,
    height: 120,
    text: window.location.href.replace("view", "add"),
  });

  getPlaylist("current", "GET");
  $("body").keydown(function(e) {
    if (e.keyCode == 37) {
      // left
      getPlaylist("prev", "POST");
    } else if (e.keyCode == 39) {
      // right
      getPlaylist("next", "POST");
    } else if (e.keyCode == 32 && e.target == document.body) {
      // space
      playlistTimer.togglePause();
      e.preventDefault();
    } else if (e.keyCode == 27) {
      // escape
      playlistTimer.stop();
      playlistTimer.toggleDisabled();
    }
  });

  setInterval(updateTotalSongs, 200);
});

function tick() {
  const countdown = playlistTimer.getCountdownTime();
  var mode;
  var timeToDisplay;
  if (countdown > songLength + drinkLength) {
    mode = "wait";
    timeToDisplay = countdown - (songLength + drinkLength);
  } else if (countdown > drinkLength) {
    mode = "song";
    timeToDisplay = countdown - drinkLength;
  } else {
    mode = "drink";
    timeToDisplay = countdown;
  }
  timeToDisplay = timeToDisplay.toString().padStart(2, "0");

  var displayString;
  if (mode === "wait") {
    $("#timerCountdown")
      .css("position", "absolute")
      .css("left", "17%")
      .css("font-size", "50em");
    displayString = timeToDisplay;
  } else if (mode === "song") {
    $("#timerCountdown")
      .css("position", "static")
      .css("font-size", "3.5em");
    displayString = timeToDisplay;
  } else {
    $("#timerCountdown")
      .css("position", "absolute")
      .css("left", "5%")
      .css("font-size", "30em");
    displayString = "DRINK";
  }

  $("#timerCountdown").html(displayString);

  if (countdown <= 0) {
    getPlaylist("next", "POST");
  }
}

function getPlaylist(action, verb) {
  playlistTimer.stop();
  $.ajax({
    url: `/live/${sessionId}/${action}`,
    type: verb,
    success: function(result) {
      const title = result.tab.artist + " - " + result.tab.name;
      const tab = result.tab.content.text
        .split("\n")
        .slice(0, 90)
        .join("\n")
        .replace(/\r\n/g, "<br />")
        .replace(/\n/g, "<br />")
        .replace(/\[ch\]/g, "<span class='chord'>")
        .replace(/\[\/ch\]/g, "</span>");

      $("#songTitle").html(
        `${title} (${result.current} of <span id='totalSongs'>${
          result.total
        }</span>)`,
      );
      $("#songUrl").html(`${result.tab.url}`);
      $("#songTab").html(`${tab}`);

      playlistTimer.start();
    },
    error: function(result) {
      alert("Failed to fetch playlist");
    },
    timeout: 5000,
  });
}

function updateTotalSongs() {
  const songUpdateDelta = Date.now() - lastMaxSongUpdate;
  if (songUpdateDelta < maxSongPollingInterval * 1000) {
    return;
  } else {
    lastMaxSongUpdate = Date.now();
  }

  $.ajax({
    url: `/live/${sessionId}/count`,
    type: "GET",
    success: function(result) {
      $("#totalSongs").html(result.count);
    },
    timeout: 5000,
  });
}

function formatTimer() {
  if (!playlistTimer.isRunning()) {
    $("#timerCountdown").css("opacity", ".4");
  } else {
    $("#timerCountdown").css("opacity", "1");
  }
}

function Interval(fn, time, totalTime, formatTimerCB) {
  this.fn = fn;
  this.time = time;
  this.totalTime = totalTime;
  this.formatTimerCB;

  var timer = false;
  var timerStart;
  var pauseOffsetMS;
  var disabled = false;

  this.start = () => {
    if (!this.isRunning() && !disabled) {
      timer = setInterval(this.fn, this.time * 1000);
      timerStart = Date.now();
    }
    formatTimerCB();
  };

  this.stop = () => {
    clearInterval(timer);
    timer = false;
    formatTimerCB();
  };

  this.isRunning = () => {
    return timer !== false;
  };

  this.getCountdownTime = () => {
    const delta = this.getTimerDeltaMS();
    return this.totalTime - Math.floor(delta / 1000);
  };

  this.getTimerDeltaMS = () => {
    return Date.now() - timerStart;
  };

  this.togglePause = () => {
    if (this.isRunning()) {
      pauseOffsetMS = this.getTimerDeltaMS();
      this.stop();
    } else {
      this.start();
      timerStart -= pauseOffsetMS;
      pauseOffsetMS = 0;
    }
  };

  this.toggleDisabled = () => {
    disabled = !disabled;
  };
}
