const sessionId = "placeholder";
const songLength = 60;
const waitLength = 10;
const totalTimer = songLength + waitLength;
const playlistTimer = new Interval(tick, 0.1, totalTimer, formatTimer);
const maxSongPollingInterval = 2;
var lastMaxSongUpdate = new Date();

$(document).ready(function() {
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
    }
  });

  setInterval(updateTotalSongs, 200);
});

function tick() {
  const countdown = playlistTimer.getCountdownTime();

  const timeToDisplay =
    countdown > songLength ? countdown - songLength : countdown;
  $("#timerCountdown").html(timeToDisplay.toString().padStart(2, "0"));

  if (timeToDisplay !== countdown) {
    $("#timerCountdown")
      .css("position", "absolute")
      .css("left", "17%")
      .css("font-size", "50em");
  } else {
    $("#timerCountdown")
      .css("position", "static")
      .css("font-size", "3.5em");
  }

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

  this.start = () => {
    if (!this.isRunning()) {
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
}
