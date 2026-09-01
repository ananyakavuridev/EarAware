let mediaRecorder = null;
let audioChunks = [];
let replayAudio = null;
let currentReplayURL = null;

const BUFFER_DURATION = 10000;

const replayButton = document.getElementById("replayButton");
const replayStatus = document.getElementById("replayStatus");

replayButton.disabled = true;

function startAudioBuffer(stream) {
    if (!stream) {
        replayStatus.textContent = "Status: No microphone stream available.";
        return;
    }

    if (!window.MediaRecorder) {
        replayStatus.textContent =
            "Status: Audio replay is not supported in this browser.";
        return;
    }

    stopAudioBuffer();

    try {
        mediaRecorder = new MediaRecorder(stream);
    } catch (error) {
        console.error(error);
        replayStatus.textContent =
            "Status: Unable to start audio recording.";
        return;
    }

    audioChunks = [];

    mediaRecorder.ondataavailable = handleAudioChunk;

    mediaRecorder.start(1000);

    replayStatus.textContent =
        "Status: Recording recent audio...";
}

function handleAudioChunk(event) {
    if (!event.data || event.data.size === 0) {
        return;
    }

    audioChunks.push({
        blob: event.data,
        timestamp: Date.now()
    });

    cleanupOldChunks();
    updateReplayStatus();
}

function cleanupOldChunks() {
    const now = Date.now();

    audioChunks = audioChunks.filter(function(chunk) {
        return now - chunk.timestamp <= BUFFER_DURATION;
    });
}

function updateReplayStatus() {
    if (audioChunks.length === 0) {
        replayButton.disabled = true;
        replayStatus.textContent =
            "Status: Replay unavailable — recording...";
        return;
    }

    const oldestChunk = audioChunks[0].timestamp;
    const newestChunk =
        audioChunks[audioChunks.length - 1].timestamp;

    const recordedTime = newestChunk - oldestChunk;

    if (recordedTime < 8000) {
        replayButton.disabled = true;
        replayStatus.textContent =
            "Status: Recording recent audio...";
    } else {
        replayButton.disabled = false;
        replayStatus.textContent =
            "Status: Replay ready";
    }
}

function replayLastTenSeconds() {
    if (audioChunks.length === 0) {
        replayStatus.textContent =
            "Status: Replay unavailable — recording...";
        return;
    }

    const blobs = audioChunks.map(function(chunk) {
        return chunk.blob;
    });

    let mimeType = "audio/webm";

    if (blobs[0].type) {
        mimeType = blobs[0].type;
    }

    const replayBlob = new Blob(blobs, {
        type: mimeType
    });

    if (currentReplayURL) {
        URL.revokeObjectURL(currentReplayURL);
    }

    currentReplayURL =
        URL.createObjectURL(replayBlob);

    if (!replayAudio) {
        replayAudio = new Audio();
    }

    replayAudio.src = currentReplayURL;

    replayStatus.textContent =
        "Status: Playing recent audio...";

    replayAudio.play()
        .then(function() {
            replayAudio.onended = function() {
                replayStatus.textContent =
                    "Status: Replay ready";
            };
        })
        .catch(function(error) {
            console.error(error);

            replayStatus.textContent =
                "Status: Unable to play replay.";
        });
}

function stopAudioBuffer() {
    if (
        mediaRecorder &&
        mediaRecorder.state !== "inactive"
    ) {
        try {
            mediaRecorder.stop();
        } catch (error) {
            console.error(error);
        }
    }

    mediaRecorder = null;
    audioChunks = [];

    replayButton.disabled = true;

    replayStatus.textContent =
        "Status: Waiting for audio...";
}

replayButton.addEventListener(
    "click",
    replayLastTenSeconds
);
