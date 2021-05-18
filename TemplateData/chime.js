async function JoinAudio(meetingData) {
  try {
    let meeting = meetingData.MeetingDetails.Meeting;
    let attendee = meetingData.MeetingDetails.Attendee;

    const logger = new ChimeSDK.ConsoleLogger(
      "ChimeMeetingLogs",
      ChimeSDK.LogLevel.INFO
    );
    const deviceController = new ChimeSDK.DefaultDeviceController(logger);

    const configuration = new ChimeSDK.MeetingSessionConfiguration(
      meeting,
      attendee
    );
    window.meetingSession = new ChimeSDK.DefaultMeetingSession(
      configuration,
      logger,
      deviceController
    );

    const audioInputs = await meetingSession.audioVideo.listAudioInputDevices();
    const videoInputs = await meetingSession.audioVideo.listVideoInputDevices();

    await meetingSession.audioVideo.chooseAudioInputDevice(
      audioInputs[0].deviceId
    );
    await meetingSession.audioVideo.chooseVideoInputDevice(
      videoInputs[0].deviceId
    );

    const audioOutputElement = document.getElementById("meeting-audio");
    meetingSession.audioVideo.bindAudioElement(audioOutputElement);
    meetingSession.audioVideo.start();
  } catch (err) {
    console.error(err);
  }
}
