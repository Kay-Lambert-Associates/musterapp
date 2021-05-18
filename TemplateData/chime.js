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
   

	try
	{
	  await meetingSession.audioVideo.chooseAudioInputDevice(audioInputs[0].deviceId)
	}
	catch(ex)
	{
		console.log("Failed to use the default audio selection, continuing")
	}




    const audioOutputElement = document.getElementById("meeting-audio");
    meetingSession.audioVideo.bindAudioElement(audioOutputElement);
    meetingSession.audioVideo.start();
  } catch (err) {
    console.error(err);
  }
}
