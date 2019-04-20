$(document).ready(function() {
  $("#song").autocomplete({
    source: "/live/tab-autocomplete",
    minLength: 2
  });
});
