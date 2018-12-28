$(document).ready(function() {
  $("#fetchPlaylist").click(function() {
    const regex = RegExp(/playlist\/(.*)\?/);
    const playlistURL = regex.exec($("[name=playlistURL]").val())[1];
    $.ajax({
      url: `/spotifyPlaylist?playlist_id=${playlistURL}`,
      type: "GET",
      success: function(result) {
        $("[name=playlist]").val(result.join("\n"));
        $("[name=playlist]").trigger("change");
      },
      error: function(result) {
        alert("Failed to fetch playlist");
      },
      timeout: 5000,
    });
  });
});
