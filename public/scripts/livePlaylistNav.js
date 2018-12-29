$(document).ready(function() {
  getPlaylist("current", "GET");

  $("body").keydown(function(e) {
    if (e.keyCode == 37) {
      // left
      getPlaylist("prev", "POST");
    } else if (e.keyCode == 39) {
      // right
      getPlaylist("next", "POST");
    }
  });
});

function getPlaylist(action, verb) {
  $.ajax({
    url: `/live/fake/${action}`,
    type: verb,
    success: function(result) {
      const title = result.artist + " - " + result.name;
      const tab = result.content.text
        .replace(/\r\n/g, "<br />")
        .replace(/\n/g, "<br />")
        .replace(/\[ch\]/g, "<span class='chord'>")
        .replace(/\[\/ch\]/g, "</span>");

      $("#songTitle").html(`${title}`);
      $("#songUrl").html(`${result.url}`);
      $("#songTab").html(`${tab}`);
    },
    error: function(result) {
      alert("Failed to fetch playlist");
    },
    timeout: 5000,
  });
}
