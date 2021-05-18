function SetupAudio(meetingString)
{
    window.onbeforeunload = function(e) {  
        gameInstance.SendMessage('SessionController', 'EndAudioSession');
    };
    
    meetingString = Pointer_stringify(meetingString);
    let meetingData = JSON.parse(meetingString);
    JoinAudio(meetingData);
}