$(document).ready(function() {
  $("[name=playlist]").change(function() {
    const releaseDates = $("[name=playlist]")
      .val()
      .split("\n")
      .map(line => parseInt(line.split(" - ")[0]));
    const minDate = Math.min.apply(Math, releaseDates);
    const maxDate = Math.max.apply(Math, releaseDates);
    $("#playlistYearRange").html(`${minDate} - ${maxDate}`);
  });
});
