mergeInto(LibraryManager.library, {
    requestLocationModal: {},
    requestUserLocation__deps: [
        'requestLocationModal',
        'allowLocation',
        'denyLocation',
        'handlePermission',
        'showPosition'
    ],
    requestUserLocation: function () {
        if (navigator.geolocation) {
            _requestLocationModal = new tingle.modal({
                footer: false,
                stickyFooter: false,
                closeMethods: [
                    'button',
                    'escape'
                ],
                cssClass: ['tingle-permission'],
                onOpen: function () {
                },
                onClose: function () {
                    _requestLocationModal.destroy();
                },
                beforeClose: function () {
                    return true;
                }
            });
            _requestLocationModal.setContent('<div class="cookiesContent" id="cookiesPopup">           <img src="./TemplateData/earth-icon.png" alt="cookies-img" />           <p>We need your location for CO<sub>2</sub> calculations. Your location won\'t be stored. </p>           <div class="buttons">              <button onclick="gameInstance.Module.asmLibraryArg._denyLocation()" class="deny">Deny</button>              <button onclick="gameInstance.Module.asmLibraryArg._allowLocation()" class="allow">Allow</button>          </div>        </div>');
            _requestLocationModal.open();
        } else {
        }
        if (false) {
            _allowLocation();
            _denyLocation();
            _handlePermission();
            _showPosition(position);
        }
    },
    allowLocation__deps: [
        'handlePermission',
        'requestLocationModal'
    ],
    allowLocation: function () {
        _handlePermission();
        _requestLocationModal.close();
    },
    denyLocation__deps: ['requestLocationModal'],
    denyLocation: function () {
        _requestLocationModal.close();
    },
    handlePermission__deps: ['showPosition'],
    handlePermission: function () {
        navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
            if (result.state == 'granted') {
                navigator.geolocation.getCurrentPosition(_showPosition);
            } else if (result.state == 'prompt') {
                navigator.geolocation.getCurrentPosition(_showPosition);
            } else if (result.state == 'denied') {
            }
            result.onchange = function () {
            };
        });
    },
    showPosition: function (position) {
        var coordinates = position.coords.latitude + ';' + position.coords.longitude;
        gameInstance.SendMessage('LocationManager', 'CalculateCo2Savings', coordinates);
    }
});
