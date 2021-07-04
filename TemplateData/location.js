var requestLocationModal = {};

function requestUserLocation() {
    if (navigator.geolocation) {
        requestLocationModal = new tingle.modal({
            footer: false,
            stickyFooter: false,
            closeMethods: ["button", "escape"],
            cssClass: ["tingle-permission"],
            onOpen: function () {
    
            },
            onClose: function () {
                requestLocationModal.destroy();
            },
            beforeClose: function () {
                return true;
            }
        });
        requestLocationModal.setContent(
       '<div class="cookiesContent" id="cookiesPopup"> \
          <img src="./TemplateData/earth-icon.png" alt="cookies-img" /> \
          <p>We need your location for CO<sub>2</sub> calculations. Your location won\'t be stored. </p> \
          <div class="buttons">\
              <button onclick="gameInstance.Module.asmLibraryArg._denyLocation()" class="deny">Deny</button>\
              <button onclick="gameInstance.Module.asmLibraryArg._allowLocation()" class="allow">Allow</button>\
          </div>\
        </div>');
    
        requestLocationModal.open();
      }
      else
      {

      }

      if(false)
      {
        //DO NOT DELTE THIS IS ONLY FOR EMSCRIPTEN DEPENDENCY
        allowLocation();
        denyLocation();
        handlePermission();
        showPosition(position);
      }

}

function allowLocation()
{
    handlePermission();
    requestLocationModal.close();
}

function denyLocation()
{
    requestLocationModal.close();
}

function handlePermission() {
    navigator.permissions.query({name:'geolocation'}).then(function(result) {
      if (result.state == 'granted') {
        navigator.geolocation.getCurrentPosition(showPosition);
      } else if (result.state == 'prompt') {
        navigator.geolocation.getCurrentPosition(showPosition);
      } else if (result.state == 'denied') {

      }
      result.onchange = function() {
        
      }
    });
}

function showPosition(position) {
  var coordinates = position.coords.latitude + ";" + position.coords.longitude;
  gameInstance.SendMessage('LocationManager', 'CalculateCo2Savings', coordinates);
}


