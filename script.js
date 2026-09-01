const status = document.getElementById("status");
const statusDescription = document.getElementById("statusDescription");
const micStatusBadge = document.getElementById("micStatusBadge");

let microphoneStream = null;
let audioContext = null;
let microphoneSource = null;


// Update microphone UI
function updateMicrophoneStatus(isOn) {

    if (isOn) {

        status.textContent = "Microphone is active";

        statusDescription.textContent =
            "Ear Aware is receiving audio from your microphone.";

        micStatusBadge.classList.remove("offline");
        micStatusBadge.classList.add("online");

        micStatusBadge.innerHTML =
            "<span></span> ON";

    } else {

        status.textContent = "Microphone is off";

        statusDescription.textContent =
            "Microphone access is required to use Ear Aware.";

        micStatusBadge.classList.remove("online");
        micStatusBadge.classList.add("offline");

        micStatusBadge.innerHTML =
            "<span></span> OFF";
    }
}


// Start microphone
async function startMicrophone() {

    try {

        console.log("Requesting microphone...");

        microphoneStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        console.log("Microphone permission granted.");
        console.log("Stream:", microphoneStream);


        // Check microphone tracks
        const audioTracks =
            microphoneStream.getAudioTracks();

        console.log("Audio tracks:", audioTracks);


        if (audioTracks.length === 0) {
            throw new Error("No microphone audio track found.");
        }


        const microphoneTrack = audioTracks[0];

        console.log("Track:", microphoneTrack);
        console.log("Track state:", microphoneTrack.readyState);
        console.log("Track enabled:", microphoneTrack.enabled);


        // Create Web Audio API
        audioContext = new AudioContext();


        // Some browsers initially suspend the AudioContext
        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }


        // Convert microphone stream into Web Audio source
        microphoneSource =
            audioContext.createMediaStreamSource(
                microphoneStream
            );
        startAudioBuffer(microphoneStream);


        console.log("Audio Context:", audioContext);
        console.log("Audio Context state:", audioContext.state);
        console.log("Microphone Source:", microphoneSource);


        // Check that the microphone track is actually active
        if (microphoneTrack.readyState === "live") {

            updateMicrophoneStatus(true);

            console.log("✓ MICROPHONE IS ON");

        } else {

            updateMicrophoneStatus(false);

            console.log("✗ MICROPHONE TRACK IS NOT LIVE");
        }


        // Detect if microphone is turned off later
        microphoneTrack.onended = () => {

            console.log("Microphone track ended.");

            updateMicrophoneStatus(false);
        };

    }

    catch (error) {

        console.error("Microphone error:", error);

        updateMicrophoneStatus(false);

        status.textContent =
            "Microphone unavailable";

        statusDescription.textContent =
            error.message;
    }
}


// Start the microphone
startMicrophone();