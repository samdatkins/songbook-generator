$(document).ready(function() {
  $("#fetchPlaylist").click(function() {
    const regex = RegExp(/playlist\/(.*)\?/);
    const playlistURI = regex.exec($("[name=playlistURI]").val())[1];
    $.ajax({
      url: `/spotifyPlaylist?playlist_id=${playlistURI}`,
      type: "GET",
      success: function(result) {
        $("[name=playlist]").val(result.join("\n"));
      },
      error: function(result) {
        alert("Failed to fetch playlist");
      },
    });
  });
});
