import SpotifyWebApi from "spotify-web-api-node";

export async function getSpotifyPlaylistTracks(playlistId) {
  const clientId = process.env["SPOTIFY_CLIENT_ID"],
    clientSecret = process.env["SPOTIFY_CLIENT_SECRET"];

  // Create the api object with the credentials
  const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
  });

  // Retrieve an access token.
  const authData = await spotifyApi.clientCredentialsGrant();

  // Save the access token so that it's used in future calls
  spotifyApi.setAccessToken(authData.body["access_token"]);

  const playlistData = await spotifyApi.getPlaylistTracks(playlistId, {
    fields: "items(track(name,release_date,album(release_date),artists(name)))",
  });

  return playlistData.body.items.map(
    trackContainer =>
      `${new Date(trackContainer.track.album.release_date).getFullYear()} - ${
        trackContainer.track.name
      } - ${trackContainer.track.artists[0].name}`,
  );
}
