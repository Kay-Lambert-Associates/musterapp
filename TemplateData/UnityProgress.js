const loadingTemplate = `
<div class='space'></div>
<div class="content">
<div class="planet">
   <div class="ring"></div>
      <div class="cover-ring"></div>
   <div class="spots">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>

   </div>
</div>
<p id="loading-text">Loading</p>
</div>`;

let loadingAdded = false;
let loadingElement;

function UnityProgress(unityInstance, progress) {
  if (!unityInstance.Module)
    return;
  if (!unityInstance.logo) {
    if(!loadingAdded)
    {
      loadingElement = $(loadingTemplate);
      $(unityInstance.container).append(loadingElement);
      loadingAdded = true;
    }
  }

  loadingElement.children('#loading-text').text('Loading ' + Math.round((progress * 100)) + '%')

  if(progress === 1)
  {
    loadingElement.addClass('d-none');
  }
}