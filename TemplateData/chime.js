var meetingSession;
var videoInputs;
var audioInputs;
var audioOutputs;
var selectedVideoInput;
var selectedAudioInput;
var selectedSpeakerOutput;
var browserBehavior;
var roster = [];
var meetingReadinessChecker;
var connectedToSession = false;
var audioOutputElement;

const root = document.documentElement;
const maxVideoTiles = 6;

$(function () {
  setUpCameraToggle();
});

function setUpCameraToggle()
{
  $("#camera-toggle").click(function () {
    let icon = $(this).children("i")[0];
    $(icon).toggleClass("fa-chevron-up").toggleClass("fa-chevron-down");
  });
  var cameraOffCanvas = $("#camera-off-canvas");
  cameraOffCanvas.on("hidden.bs.offcanvas", function () {
    setTimeout(() => {
      $(cameraOffCanvas).children("#camera-toggle").blur();
    });
  });
  cameraOffCanvas.on("shown.bs.offcanvas", function () {
    $(cameraOffCanvas).children("#camera-toggle").blur();
  });
}

function showCameraFeed() {
  $("#camera-off-canvas").addClass("visible");
}

async function setupSession(meetingData) {
  if(!connectedToSession)
  {
    try {
      if(!meetingData || !meetingData.MeetingDetails)
      {
        console.error("Meeting data is empty, failed to connect to chime.");
        return;
      }

      audioOutputElement = document.getElementById("meeting-audio");
  
      let meeting = meetingData.MeetingDetails.Meeting;
      let attendee = meetingData.MeetingDetails.Attendee;
  
      let logger = new ChimeSDK.ConsoleLogger("ChimeMeetingLogs", ChimeSDK.LogLevel.WARN);
      let deviceController = new ChimeSDK.DefaultDeviceController(logger);
  
      let configuration = new ChimeSDK.MeetingSessionConfiguration(meeting, attendee);
      meetingSession = new ChimeSDK.DefaultMeetingSession(configuration, logger, deviceController);

      browserBehavior = new ChimeSDK.DefaultBrowserBehavior();

      audioInputs = await listAudioInputDevicesAsync();
      videoInputs = await listVideoInputDevicesAsync();
      audioOutputs = await listAudioOutputDevicesAsync();

      meetingReadinessChecker = new MeetingReadiness(logger, meetingSession);

      gameInstance.SendMessage("UserWaitingCanvas", "ChimeSetupComplete");
  
    } catch (err) {
      console.error(err);
    }
  }
}

function locallyRemoveTile(attendeeId, tileId) {
  let videoElement = document.getElementById("video-" + tileId);
  if (videoElement) {
    videoElement.parentElement.remove();
    roster.find((x) => x.attendeeId === attendeeId).visible = false;
  }
}

function getAvailableVideoElement(attendeeId, tileId) {
  let videoElement = document.getElementById("video-" + tileId);

  if (videoElement) return videoElement;

  var videoList = document.getElementById("video-tiles");

  if (videoList.childElementCount >= maxVideoTiles) {
    return null;
  }

  let videoContainer = document.createElement("div");
  videoContainer.classList.add("col-md-auto", "p-1", "h-100");

  videoElement = document.createElement("video");
  videoElement.classList.add("h-100", "rounded-1", "webcam");
  videoElement.id = "video-" + tileId;
  videoElement.setAttribute("attendeeId", attendeeId);

  videoContainer.append(videoElement);
  videoList.append(videoContainer);

  return videoElement;
}

function addAttendeeToRoster(attendeeId, tileId) {
  let attendee = roster.find((x) => x.attendeeId === attendeeId);

  if (attendee) {
    attendee.tileId = tileId;
    return;
  }

  roster.push({
    attendeeId,
    tileId,
    visible: false,
  });
}

function createAttendeeRoster() {
  meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence((presentAttendeeId, present) => {
    if (!present) {
      roster = roster.filter((x) => x.attendeeId != presentAttendeeId);
      return;
    }
    
    subscribeToVolume(presentAttendeeId);

  });
}

function subscribeToVolume(presentAttendeeId)
{
  meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
    presentAttendeeId,
    (attendeeId, volume, muted, signalStrength) => {
      const baseAttendeeId = new ChimeSDK.DefaultModality(attendeeId).base();
        if (baseAttendeeId !== attendeeId) {
          return;
        }
      let attendee = roster.find((x) => x.attendeeId === attendeeId);

      if (attendee) {
        attendee.volume = volume; // a fraction between 0 and 1
        attendee.muted = muted; // A boolean
        attendee.signalStrength = signalStrength; // 0 (no signal), 0.5 (weak), 1 (strong)
        attendee.lastActive = new Date().getTime();

        if (attendee.visible) {
          setVolumeOutline(attendee.tileId, volume);
        }
        if (attendee.tileId && !attendee.visible && volume > 0) {
          replaceVideoTile(attendeeId, attendee.tileId);
        }

        return;
      }

      roster.push({
        attendeeId,
        volume,
        muted,
        signalStrength,
      });
    }
  );
}

function replaceVideoTile(attendeeId, tileId) {
  let videoElement = getAndBindVideoElement(attendeeId, tileId);

  if (!videoElement) {
    let lastActive = getLeastActiveUser(attendeeId);
    if (lastActive) {
      locallyRemoveTile(lastActive.attendeeId, lastActive.tileId);
      getAndBindVideoElement(attendeeId, tileId);
    }
  }
}

function getAndBindVideoElement(attendeeId, tileId) {
  let videoElement = getAvailableVideoElement(attendeeId, tileId);

  if (videoElement) {
    meetingSession.audioVideo.bindVideoElement(tileId, videoElement);
    let attendee = roster.find((x) => x.attendeeId === attendeeId);
    attendee.visible = true;
    attendee.lastChanged = new Date().getTime();
    return videoElement;
  }

  return null;
}

/**
 * Sorts the user roster by the lastActive and then loops to find one that has not been addded in the last 5 seconds
 * @param  {string} attendeeId The id of the current user to be ignored from the sort
 */
function setVolumeOutline(tileId, volume) {
  let videoElement = document.getElementById("video-" + tileId);
  if (videoElement) {
    if (volume > 0) {
      let color = videoElement.style.outlineColor;
      root.style.setProperty("--opacity-color", color.replace(/[^,]+(?=\))/, volume));
      videoElement.classList.add("speaking");
    } else {
      videoElement.classList.remove("speaking");
    }
  }
}

/**
 * Sorts the user roster by the lastActive and then loops to find one that has not been addded in the last 5 seconds
 * @param  {string} attendeeId The id of the current user to be ignored from the sort
 */
function getLeastActiveUser(attendeeId) {
  let sortedByActiveRoster = roster
    .filter((x) => x.attendeeId != attendeeId && x.visible == true)
    .sort((a, b) => {
      return a.lastActive - b.lastActive;
    });

  for (var i = 0, length = sortedByActiveRoster.length; i < length; i++) {
    if (
      !sortedByActiveRoster[i].lastChanged ||
      (sortedByActiveRoster[i].lastChanged &&
        diffInSeconds(sortedByActiveRoster[i].lastChanged, new Date().getTime())) > 5
    ) {
      return sortedByActiveRoster[i];
    }
  }
}

function troubleshoot()
{
  if(!meetingReadinessChecker)
  {
    showInfoToast("Please accept camera and microphone permission prompts.");
    return;
  }
  meetingReadinessChecker.performChecks();
}

async function connectSession()
{
  if(!connectedToSession)
  {
    meetingSession.audioVideo.bindAudioElement(audioOutputElement);

    try {
      await connectAudio();
    } catch (error) {
      console.error("Failed to connect audio.");
    }
  
    try {
      await connectVideo();
    } catch (error) {
      console.error("Failed to connect video. Default camera might be in use by another software.");
    }
  
    showCameraFeed();

    await addObserver();
    createAttendeeRoster();
    startSession();

    connectedToSession = true;
  }
}

function startSession()
{
  meetingSession.audioVideo.start();
}

async function addObserver()
{
  let audioVideoObserver = {
    videoTileDidUpdate: (tileState) => {
      // Ignore a tile without attendee ID and a content/screen share.
      if (!tileState.boundAttendeeId || tileState.isContent) {
        return;
      }

      let tileId = tileState.tileId;

      addAttendeeToRoster(tileState.boundAttendeeId, tileId);
      getAndBindVideoElement(tileState.boundAttendeeId, tileId);
    },
    videoTileWasRemoved: (tileId) => {
      remoteRemoveTile(tileId);
    },
    audioVideoDidStop: sessionStatus => {
      const sessionStatusCode = sessionStatus.statusCode();
      console.log('Session status code: ' + sessionStatusCode);
      if (sessionStatusCode === ChimeSDK.MeetingSessionStatusCode.MeetingEnded) {
        /*
          - You (or someone else) have called the DeleteMeeting API action in your server application.
          - You attempted to join a deleted meeting.
          - No audio connections are present in the meeting for more than five minutes.
          - Fewer than two audio connections are present in the meeting for more than 30 minutes.
          - Screen share viewer connections are inactive for more than 30 minutes.
          - The meeting time exceeds 24 hours.
          See https://docs.aws.amazon.com/chime/latest/dg/mtgs-sdk-mtgs.html for details.
        */
        console.log('The session has ended');
      } else {
        console.log('Stopped with a session status code: ', sessionStatusCode);
      }
    }
  };

  await meetingSession.audioVideo.addObserver(audioVideoObserver);
}

async function connectAudio()
{
  await chooseAudioInputDeviceAsync(selectedAudioInput ?? audioInputs[0].deviceId);
}

async function connectVideo()
{
   chooseVideoInputDeviceAsync(selectedVideoInput ?? videoInputs[0].deviceId).then(res=> {
      meetingSession.audioVideo.startLocalVideoTile();
   });
}

async function remoteRemoveTile(tileId) {
  let videoElement = document.getElementById("video-" + tileId);
  if (videoElement) {
    let attendeeId = videoElement.getAttribute("attendeeId");
    videoElement.parentElement.remove();

    let attendee = roster.find((x) => x.attendeeId === attendeeId);
    if(!attendee) return; //if the attendee is null, the player has left the seesion and is no longer part of the roster.
    attendee.tileId = null;
    attendee.visible = false;
  }
}

async function listAudioInputDevicesAsync() {
  return await meetingSession.audioVideo.listAudioInputDevices();
}

async function listVideoInputDevicesAsync() {
  return await meetingSession.audioVideo.listVideoInputDevices();
}

async function listAudioOutputDevicesAsync()
{
  return await meetingSession.audioVideo.listAudioOutputDevices();
}

function supportsSetSinkId()
{
  return browserBehavior.supportsSetSinkId();
}

async function chooseVideoInputDeviceAsync(deviceId, updateGame) {
  try {
    selectedVideoInput = deviceId;
    await meetingSession.audioVideo.chooseVideoInputDevice(deviceId);
    if(updateGame)
    {
      gameInstance.SendMessage("SettingsCanvas", "SelectCamera", selectedVideoInput);
    }
  } catch (ex) {
    console.error("Failed to use the default video selection, continuing");
    showToast("The video camera device is used by another software. Turn off all other browser tabs and/or software that uses your camera. Alternatively, select a different camera.");
  }
}



async function chooseAudioOutputDevice(deviceId, updateGame) {
  try {

    selectedSpeakerOutput = deviceId;
    await meetingSession.audioVideo.chooseAudioOutputDevice(deviceId);
    await meetingSession.audioVideo.bindAudioElement(audioOutputElement);
    
    if(updateGame)
    {
      gameInstance.SendMessage("SettingsCanvas", "SelectSpeaker", selectedSpeakerOutput);
    }
  } catch (ex) {
    console.error("Failed to use the default audio selection, continuing");
  }
}

async function chooseAudioInputDeviceAsync(deviceId, updateGame) {
  try {
    selectedAudioInput = deviceId;
    await meetingSession.audioVideo.chooseAudioInputDevice(deviceId);
    if(updateGame)
    {
      gameInstance.SendMessage("SettingsCanvas", "SelectMicrophone", selectedAudioInput);
    }

  } catch (ex) {
    console.error("Failed to use the default audio selection, continuing");
  }
}

async function muteAudioInputAsync() {
  meetingSession.audioVideo.realtimeMuteLocalAudio();
}

async function unmuteAudioInputAsync() {
  meetingSession.audioVideo.realtimeUnmuteLocalAudio();
}

async function stopVideoInputAsync() {
  await meetingSession.audioVideo.chooseVideoInputDevice(null);
  meetingSession.audioVideo.removeLocalVideoTile();
}

async function startVideoInputAsync() {
  await chooseVideoInputDeviceAsync(selectedVideoInput).then(res=> {
    meetingSession.audioVideo.startLocalVideoTile();
  });
}


