const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;
let shouldRecognize = false;
let captionHistory = [];
let interimText = "";

const MAX_CAPTIONS = 10;

const captionButton = document.getElementById("captionButton");
const captionStatus = document.getElementById("captionStatus");
const captionArea = document.getElementById("captionArea");

function initializeSpeechRecognition() {

    if (!SpeechRecognition) {
        captionStatus.textContent =
            "Status: Live captions are not supported in this browser.";

        captionButton.disabled = true;
        return;
    }

    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
        captionStatus.textContent =
            "Status: Captions active";
    };

    recognition.onresult = handleSpeechResult;

    recognition.onerror = function(event) {

        console.log("Speech error:", event.error);

        if (event.error === "not-allowed") {
            shouldRecognize = false;
            captionStatus.textContent =
                "Status: Microphone permission denied.";
        }

        else if (event.error === "no-speech") {
            captionStatus.textContent =
                "Status: Listening...";
        }

        else if (event.error === "network") {
            captionStatus.textContent =
                "Status: Network error.";
        }

        else {
            captionStatus.textContent =
                "Status: Speech recognition error.";
        }
    };

    recognition.onend = function() {

        if (shouldRecognize) {

            setTimeout(function() {

                try {
                    recognition.start();
                } catch (error) {
                    console.log("Restart:", error);
                }

            }, 300);

        }
    };
}

function startCaptions() {

    if (!recognition) {
        initializeSpeechRecognition();
    }

    shouldRecognize = true;
    interimText = "";

    try {

        recognition.start();

        captionButton.textContent =
            "Stop Captions";

        captionStatus.textContent =
            "Status: Starting captions...";

    } catch (error) {

        console.log("Start error:", error);
    }
}

function stopCaptions() {

    shouldRecognize = false;
    interimText = "";

    if (recognition) {

        try {
            recognition.stop();
        } catch (error) {
            console.log(error);
        }
    }

    captionButton.textContent =
        "Start Captions";

    captionStatus.textContent =
        "Status: Captions stopped";

    updateCaptionUI();
}

function handleSpeechResult(event) {

    interimText = "";

    for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
    ) {

        const result = event.results[i];

        const text =
            result[0].transcript.trim();

        if (!text) {
            continue;
        }

        if (result.isFinal) {

            captionHistory.push({
                text: text,
                timestamp: Date.now()
            });

        } else {

            interimText += text;
        }
    }

    cleanupCaptionHistory();
    updateCaptionUI();
}

function cleanupCaptionHistory() {

    const now = Date.now();

    captionHistory =
        captionHistory.filter(function(caption) {
            return now - caption.timestamp <= 10000;
        });

    if (captionHistory.length > MAX_CAPTIONS) {
        captionHistory =
            captionHistory.slice(-MAX_CAPTIONS);
    }
}

function updateCaptionUI() {

    captionArea.innerHTML = "";

    if (
        captionHistory.length === 0 &&
        !interimText
    ) {

        captionArea.textContent =
            "Listening for speech...";

        return;
    }

    captionHistory.forEach(function(caption) {

        const element =
            document.createElement("div");

        element.className = "caption";
        element.textContent = caption.text;

        captionArea.appendChild(element);
    });

    if (interimText) {

        const element =
            document.createElement("div");

        element.className = "caption interim";
        element.textContent = interimText;

        captionArea.appendChild(element);
    }
}

captionButton.addEventListener(
    "click",
    function() {

        if (shouldRecognize) {
            stopCaptions();
        } else {
            startCaptions();
        }

    }
);

initializeSpeechRecognition();