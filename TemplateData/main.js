function setUpTooltips() {
  $('[data-toggle="tooltip"]').tooltip();
}

$(function () {
  setUpTooltips();
  $('#camera-toggle').on('click', togglePaddingToUnity);

});

function togglePaddingToUnity()
{
  $('#unityContainer').toggleClass('camera-visible');
}
