class MeetingReadiness {

    //READINES PROPERTIES
    modal;

    //CHIME PROPERTIES
    meetingReadinessChecker;
    defaultBrowserBehavior;
    meetingSession;
    supportsSetSinkId

    //MICROPHONE ELEMENTS
    microphoneGroup = $('#microphone-group');
    microhponeDropdown = $('#microphone-dropdown');
    microphoneTestButton = $("#microphone-test-button");
    microphoneFailureAlert = $('#microphone-failure-alert');
    microphoneInputGroup = $('#microphone-input-group');
    microhponeVolumeIndicator = $('#microphone-volume-indicator');
    testingMicrophone = false;
    volumeInterval;
    analyser;
    volumes;
    audioSource;
    audioContext;

    //SPEAKER ELEMENTS
    speakerGroup = $('#speaker-group');
    speakerDropdown = $('#speaker-dropdown');
    speakerTestButton = $("#speaker-test-button");
    speakerFailureAlert = $('#speaker-failure-alert');
    speakerInputGroup = $('#speaker-input-group');
    speakerOutputFeedback = $('#speaker-output-feedback');
    audioOutputElement = $('#meeting-audio');

    //CAMERA ELEMENTS
    cameraGroup = $('#camera-group');
    cameraDropdown = $('#camera-dropdown');
    cameraTestButton = $("#camera-test-button");
    cameraFailureAlert = $('#camera-failure-alert');
    cameraInputGroup = $('#camera-input-group');
    cameraPreviewDisplay = $('#camera-preview-display');
    testingCamera = false;
    isCameraCheckRunning = false;
    hasStartedLocalVideoTile = false;

    //UDP & TCP ELEMENTS
    tcpUdpGroup = $('#tcp-udp-group');
    tcpGroup = $('#tcp-group');
    udpGroup = $('#udp-group');
    tcpUdpAlert = $('#tcp-udp-failure-alert');
    tcpUdpTestLink = $('#tcp-udp-test-link');

    //ICONS
    successIcon = '<i class="fas fa-check-circle text-success"></i>';
    failureIcon = '<i class="fas fa-times-circle text-danger"></i>';
    spinnerIcon = '<div class="spinner-border spinner-border-sm" role="status"></div>';

    constructor(logger, meetingSession)
    {
        this.meetingSession = meetingSession;
        
        this.defaultBrowserBehavior = new ChimeSDK.DefaultBrowserBehavior();
        this.meetingReadinessChecker = new ChimeSDK.DefaultMeetingReadinessChecker(logger, meetingSession);

        this.modal = new bootstrap.Modal($('#readiness-checker')[0], {
            keyboard: false
        });

        this.attachEvents();

        this.supportsSetSinkId = this.defaultBrowserBehavior.supportsSetSinkId();
    }

    async performChecks()
    {
        this.hasStartedLocalVideoTile = this.meetingSession.audioVideo.hasStartedLocalVideoTile();

        this.modal.show();

        this.beginAudioInputAsync();
        this.beginAudioOutputAsync();

        this.beginVideoInput();
/*         if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1')
        {
            //This test always fails on localhost + it then proceeds to write infinite warnings to the console.
            this.checkUDPAsync();
            this.checkTCPAsync();
        } */
    }
    
    async beginAudioInputAsync()
    {
        this.resetTest(this.microphoneGroup, this.microphoneInputGroup, true);
        
        this.testingMicrophone = false;
        this.getMicrophoneVolumeAsync(false);

        if(audioInputs.length <= 0)
        {
            this.microphoneFailureAlert.removeClass('d-none');
            return;
        }

        if(this.microhponeDropdown.children('option').length <= 0)
        {
            this.updateDropdown(this.microhponeDropdown, audioInputs, selectedAudioInput);
        }

        await chooseAudioInputDeviceAsync(this.microhponeDropdown.val(), true);

        this.microphoneInputGroup.removeClass('d-none');
        this.checkAudioInputAsync();
    }
    
    async checkAudioInputAsync()
    {
        let currentMicrophone = this.microhponeDropdown.val();

        if(!currentMicrophone)
        {
            this.handleFeedback(this.microphoneInputGroup, false);
            return;
        }

        let inputFeedback = await this.meetingReadinessChecker.checkAudioInput(currentMicrophone);

        if(inputFeedback === ChimeSDK.CheckAudioInputFeedback.Succeeded)
        {
            this.handleFeedback(this.microphoneInputGroup, true);
            return;
        }
        this.handleFeedback(this.microphoneInputGroup, false);

    }

    async testMicrophoneAsync()
    {
        if(!this.testingMicrophone)
        {
            this.microhponeVolumeIndicator.removeClass('d-none');
            this.microphoneTestButton.text('Stop');
            await chooseAudioInputDeviceAsync(selectedAudioInput, false);
            this.testingMicrophone = true;
            this.getMicrophoneVolumeAsync(true);
            return;
        }

        this.microhponeVolumeIndicator.addClass('d-none');
        this.microphoneTestButton.text('Test');
        this.testingMicrophone = false;
        this.getMicrophoneVolumeAsync(false);

        this.testingMicrophone = false;

    }
    
    async getMicrophoneVolumeAsync(connect)
    {

        if(connect)
        {
            const stream = await this.meetingSession.audioVideo.deviceController.acquireAudioInputStream();

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();


            const analyserNode = this.audioContext.createAnalyser();
            this.audioContext.createMediaStreamSource(stream).connect(analyserNode);
          
            const data = new Uint8Array(analyserNode.fftSize);
            let frameIndex = 0;
            const analyserNodeCallback = function() {
              if (frameIndex === 0) {
                analyserNode.getByteTimeDomainData(data);
                const lowest = 0.01;
                let max = lowest;
                for (const f of data) {
                  max = Math.max(max, (f - 128) / 128);
                }
                let normalized = (Math.log(lowest) - Math.log(max)) / Math.log(lowest);
                let percent = Math.min(Math.max(normalized * 100, 0), 100);
                this.colorPids(percent); // <-- Use this value to detect "speaking"
              }
              frameIndex = (frameIndex + 1) % 2;
            }.bind(this);

            this.volumeInterval = setInterval(analyserNodeCallback.bind(this), 10);   
        }
        else
        {
            clearInterval(this.volumeInterval);  
            this.volumeInterval = null;
            if(this.audioContext)
                this.audioContext.suspend();
        }
    }

    colorPids(vol) {
        let allPids = [...document.querySelectorAll('.pid')];

        let numberOfPidsToColor = Math.round(allPids.length * (vol / 100));

        let volumePids = allPids.slice(0, numberOfPidsToColor);
        let silentPids = allPids.slice(numberOfPidsToColor + (numberOfPidsToColor === 0 ? 0 : 1));

        for (let pid of silentPids) {
          pid.style.backgroundColor = "#e6e7e8";
        }
        for (let pid of volumePids) {
          pid.style.backgroundColor = "#69ce2b";
        }
    }

    async beginAudioOutputAsync()
    {
        if(!this.supportsSetSinkId)
        {
            this.speakerGroup.parent().addClass('d-none');
            return;
        }

        this.resetTest(this.speakerGroup, this.speakerInputGroup, false);

        if(!audioOutputs || audioOutputs.length <= 0)
        {
            this.handleFeedback(this.speakerInputGroup, false);
            return;
        }

        if(this.speakerDropdown.children('option').length <= 0)
        {
            this.updateDropdown(this.speakerDropdown, audioOutputs, selectedSpeakerOutput);
        }

        await chooseAudioOutputDevice(this.speakerDropdown.val(), true);

        this.speakerInputGroup.removeClass('d-none');
    }

    async checkAudioOutputAsync()
    {

        await this.meetingSession.audioVideo.bindAudioElement(this.audioOutputElement[0]);
        let audioDevice = audioOutputs.find(x=> x.deviceId === this.speakerDropdown.val());
        
        let outputFeedback = await this.meetingReadinessChecker.checkAudioOutput(audioDevice, this.askUserOuputFeedbackAsync.bind(this), this.audioOutputElement[0]);
        console.log(`Output feedback result: ${ChimeSDK.CheckAudioOutputFeedback[outputFeedback]}`);

        if(outputFeedback === ChimeSDK.CheckAudioOutputFeedback.Succeeded)
        {
            this.handleFeedback(this.speakerInputGroup, true);
            return;
        }
        this.handleFeedback(this.speakerInputGroup, false);
    }

    askUserOuputFeedbackAsync()
    {
        return new Promise(function(resolve, reject) {
            let yesLink = this.speakerOutputFeedback.children('#yes-link');
            let noLink = this.speakerOutputFeedback.children('#no-link');

            this.speakerOutputFeedback.removeClass('d-none');

            yesLink.click(function(){
                this.speakerOutputFeedback.addClass('d-none');
                resolve(true);
            }.bind(this))
            noLink.click(function() {
                this.speakerOutputFeedback.addClass('d-none');
                reject(false);
            }.bind(this))
        }.bind(this))
    }

    async beginVideoInput()
    {
        this.resetTest(this.cameraGroup, this.cameraInputGroup, true);
        this.testingCamera = false;
        if(this.hasStartedLocalVideoTile)
        {
            await stopVideoInputAsync();
        }

        this.meetingSession.audioVideo.stopVideoPreviewForVideoInput(this.cameraPreviewDisplay[0]);

        if(videoInputs.length <= 0)
        {
            this.cameraFailureAlert.removeClass('d-none');
            return;
        }

        if(this.cameraDropdown.children('option').length <= 0)
        {
            this.updateDropdown(this.cameraDropdown, videoInputs, selectedVideoInput);
        }

        selectedVideoInput = this.cameraDropdown.val();
        gameInstance.SendMessage("SettingsCanvas", "SelectCamera", selectedVideoInput);

        this.cameraInputGroup.removeClass('d-none');
        this.checkVideoInputAsync();
    }

    async checkVideoInputAsync()
    {
        this.isCameraCheckRunning = true;
        let videoFeedback = await this.meetingReadinessChecker.checkVideoInput(this.cameraDropdown.val());
        this.isCameraCheckRunning = false;

        console.log(`Video feedback result: ${ChimeSDK.CheckVideoInputFeedback[videoFeedback]}`);

        if(videoFeedback === ChimeSDK.CheckVideoInputFeedback.Succeeded)
        {
            this.handleFeedback(this.cameraInputGroup, true);
            return;
        }
        this.handleFeedback(this.cameraInputGroup, false);
    }

    async testVideoInputAsync()
    {
        if(!this.testingCamera)
        {
            this.resetTest(this.cameraGroup, this.cameraInputGroup, true);
            this.cameraTestButton.prop('disabled', true);
            this.cameraTestButton.text('Stop');
            this.testingCamera = true;

            try
            {
                await chooseVideoInputDeviceAsync(this.cameraDropdown.val(), true);
                this.handleFeedback(this.cameraInputGroup, true);
            }
            catch
            {
                this.handleFeedback(this.cameraInputGroup, false);
                this.cameraTestButton.text('Test');
                this.cameraTestButton.prop('disabled', false);
                this.testingCamera = false;
                return;
            }

            this.meetingSession.audioVideo.startVideoPreviewForVideoInput(this.cameraPreviewDisplay[0]);
            this.cameraPreviewDisplay.removeClass('d-none');
            this.cameraTestButton.prop('disabled', false);
            return;
        }

        this.cameraTestButton.text('Test');
        this.meetingSession.audioVideo.stopVideoPreviewForVideoInput(this.cameraPreviewDisplay[0]);
        this.cameraPreviewDisplay.addClass('d-none');
        this.testingCamera = false;
    }

    updateDropdown(dropdown, devices, selected)
    {
        for(let i=0, len = devices.length; i < len; i++)
        {
            dropdown.append($('<option>', {
                value: devices[i].deviceId,
                text: devices[i].label
            }));
        }

        if(selected)
        {
            dropdown.val(selected);
        }
    }

    attachEvents()
    {
        this.microhponeDropdown.change(this.beginAudioInputAsync.bind(this));
        this.microphoneTestButton.click(this.testMicrophoneAsync.bind(this));

        this.speakerTestButton.click(this.checkAudioOutputAsync.bind(this));
        this.speakerDropdown.change(this.beginAudioOutputAsync.bind(this));

        this.cameraTestButton.click(this.testVideoInputAsync.bind(this));
        this.cameraDropdown.change(this.beginVideoInput.bind(this));

        this.tcpUdpTestLink.click(function(){
            this.checkUDPAsync.bind(this)();
            this.checkTCPAsync.bind(this)();
        }.bind(this));

        $(this.modal._element).on('hide.bs.modal', function (e) {
            if(this.isCameraCheckRunning) 
            {
                e.preventDefault();
                showToast("Please wait for the camera test to complete before closing.");
                return;
            }

            this.cleanup();


        }.bind(this));
    }

    async checkUDPAsync()
    {
        this.resetTest(this.tcpUdpGroup, this.udpGroup, false);

        let networkUDPFeedback = await this.meetingReadinessChecker.checkNetworkUDPConnectivity();

        console.log(`UDP feedback result: ${ChimeSDK.CheckNetworkUDPConnectivityFeedback[networkUDPFeedback]}`);

        if(networkUDPFeedback === ChimeSDK.CheckNetworkUDPConnectivityFeedback.Succeeded)
        {
            this.handleFeedback(this.udpGroup, true);
            return;
        }
        this.handleFeedback(this.udpGroup, false, this.tcpUdpAlert);
    }

    async checkTCPAsync()
    {
        this.resetTest(this.tcpUdpGroup, this.tcpGroup, false);

        let networkTCPFeedback = await this.meetingReadinessChecker.checkNetworkTCPConnectivity();
        console.log(`TCP feedback result: ${ChimeSDK.CheckNetworkTCPConnectivityFeedback[networkTCPFeedback]}`);

        if(networkTCPFeedback === ChimeSDK.CheckNetworkTCPConnectivityFeedback.Succeeded)
        {
            this.handleFeedback(this.tcpGroup, true);
            return;
        }
        this.handleFeedback(this.tcpGroup, false, this.tcpUdpAlert);
    }

    cleanup()
    {
        this.speakerDropdown.empty();
        this.microhponeDropdown.empty();
        this.cameraDropdown.empty();

        if(this.hasStartedLocalVideoTile)
        {
            startVideoInputAsync();
        }

        chooseAudioInputDeviceAsync(selectedAudioInput, false);
    }

    resetTest(group, inputGroup, disableTestButton)
    {
        group?.children('.reset').addClass('d-none');

        if(inputGroup)
        {
            inputGroup.children('.status-icon').first().html(this.spinnerIcon);
            let button = inputGroup.children('button')?.first();
            if(button)
            {
                button.prop('disabled', disableTestButton);
                button.text('Test');
            }
        }
    }

    handleFeedback(inputGroup, success, alert) 
    {
        let icon = success ? this.successIcon : this.failureIcon;

        inputGroup.children('.status-icon').first().html(icon);
        inputGroup.children('button')?.first().prop('disabled', false);

        if(!alert)
        {
            alert = inputGroup.siblings('.alert')?.first();
        }
        if(alert && success)
        {
            alert.addClass('d-none');
        }
        else if(alert && !success)
        {
            alert.removeClass('d-none');
        }
    }
}