const status = document.getElementById("status");
const statusDescription = document.getElementById("statusDescription");
const micStatusBadge = document.getElementById("micStatusBadge");

let microphoneStream = null;
let audioContext = null;
let microphoneSource = null;


async function startMicrophone() {

    try {

        // Ask for microphone permission
        microphoneStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        // Create Web Audio API
        audioContext = new AudioContext();

        // Connect microphone to Web Audio API
        microphoneSource = audioContext.createMediaStreamSource(microphoneStream);

        // Update interface
        status.textContent = "Microphone is active";
        statusDescription.textContent = "Ear Aware is receiving audio from your microphone.";

        micStatusBadge.classList.remove("offline");
        micStatusBadge.classList.add("online");

        micStatusBadge.innerHTML = "<span></span> ON";

        console.log("Microphone stream:", microphoneStream);
        console.log("Audio context:", audioContext);
        console.log("Microphone source:", microphoneSource);

    }

    catch (error) {
        console.error("Microphone error:", error);

        status.textContent = "Microphone unavailable";

        statusDescription.textContent = "Please allow microphone access and reload the page.";

        micStatusBadge.classList.remove("online");
        micStatusBadge.classList.add("offline");

        micStatusBadge.innerHTML =  "<span></span> OFF";
    }
}

// Start microphone when application loads
startMicrophone();