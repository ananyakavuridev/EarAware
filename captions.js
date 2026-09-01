
const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;




let recognition = null;


let shouldRecognize = false;

const captionHistory = [];


const MAX_CAPTIONS = 10;


let interimText = "";




const captionButton =
    document.getElementById("captionButton");

const captionStatus =
    document.getElementById("captionStatus");

const captionArea =
    document.getElementById("captionArea");



function initializeSpeechRecognition() {

    
    if (!SpeechRecognition) {

        captionStatus.textContent =
            "Status: Live captions are not supported in this browser.";

        captionButton.disabled = true;

        return;
    }


    recognition = new SpeechRecognition();


    
    recognition.lang = "en-US";

    recognition.continuous = true;

    recognition.interimResults = true;


    
    recognition.onresult = handleSpeechResult;

    recognition.onerror = handleSpeechError;

    recognition.onend = handleSpeechEnd;
}



function startCaptions() {

    if (!recognition) {
        return;
    }

    shouldRecognize = true;

    interimText = "";

    try {

        recognition.start();

        captionButton.textContent =
            "Stop Captions";

        captionStatus.textContent =
            "Status: Captions active";

    }
    catch (error) {

        console.log(
            "Recognition could not start:",
            error
        );
    }
}



function stopCaptions() {

    shouldRecognize = false;

    interimText = "";

    if (recognition) {

        try {
            recognition.stop();
        }
        catch (error) {
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


        
        if (result.isFinal) {

            if (text.length > 0) {

                captionHistory.push({

                    text: text,

                    timestamp: Date.now()

                });
            }
        }


       
        else {

            interimText += text;
        }
    }


    cleanupCaptionHistory();

    updateCaptionUI();
}



function cleanupCaptionHistory() {

    const now = Date.now();


    

    while (
        captionHistory.length > 0 &&
        now - captionHistory[0].timestamp > 10000
    ) {

        captionHistory.shift();
    }


    

    while (
        captionHistory.length > MAX_CAPTIONS
    ) {

        captionHistory.shift();
    }
}




function updateCaptionUI() {

    captionArea.innerHTML = "";


   
    if (
        captionHistory.length === 0 &&
        !interimText
    ) {

        captionArea.textContent =
            "No captions yet.";

        return;
    }


    

    captionHistory.forEach(function(caption) {

        const element =
            document.createElement("div");

        element.className = "caption";

        element.textContent =
            caption.text;

        captionArea.appendChild(element);
    });


    

    if (interimText) {

        const element =
            document.createElement("div");

        element.className =
            "caption interim";

        element.textContent =
            interimText;

        captionArea.appendChild(element);
    }
}



function handleSpeechError(event) {

    console.log(
        "Speech recognition error:",
        event.error
    );


    if (event.error === "not-allowed") {

        captionStatus.textContent =
            "Status: Microphone permission denied.";

    }

    else if (event.error === "audio-capture") {

        captionStatus.textContent =
            "Status: Microphone unavailable.";

    }

    else if (event.error === "network") {

        captionStatus.textContent =
            "Status: Speech recognition network error.";

    }

    else if (event.error === "no-speech") {

        if (shouldRecognize) {

            captionStatus.textContent =
                "Status: Listening for speech...";
        }

    }

    else {

        captionStatus.textContent =
            "Status: Speech recognition error.";
    }
}




function handleSpeechEnd() {


    if (shouldRecognize) {

        try {

            recognition.start();

        }
        catch (error) {

            console.log(
                "Recognition restart failed:",
                error
            );
        }
    }
}
captionButton.addEventListener(
    "click",
    function() {

        if (shouldRecognize) {

            stopCaptions();

        }
        else {

            startCaptions();
        }

    }
);
initializeSpeechRecognition();