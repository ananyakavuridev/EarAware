const status = document.getElementById("status");
const statusDescription = document.getElementById("statusDescription");
const micStatusBadge = document.getElementById("micStatusBadge");

let microphoneStream = null;
let audioContext = null;
let microphoneSource = null;

let highPassFilter = null;
let speechFilters = [];
let calibrationFilters = [];
let compressor = null;
let masterGain = null;

let audioOutputStarted = false;

const SPEECH_BANDS = [
    {
        frequency: 250,
        gain: -2,
        Q: 0.8
    },
    {
        frequency: 500,
        gain: 1,
        Q: 0.9
    },
    {
        frequency: 1000,
        gain: 2,
        Q: 1
    },
    {
        frequency: 2000,
        gain: 3,
        Q: 1
    },
    {
        frequency: 4000,
        gain: 2,
        Q: 1
    },
    {
        frequency: 8000,
        gain: -1,
        Q: 0.8
    }
];

const CALIBRATION_FREQUENCIES = [
    250,
    500,
    1000,
    2000,
    4000,
    8000
];


function updateMicrophoneStatus(isOn) {

    if (isOn) {

        status.textContent =
            "Microphone is active";

        statusDescription.textContent =
            "Ear Aware is receiving and enhancing microphone audio.";

        micStatusBadge.classList.remove("offline");
        micStatusBadge.classList.add("online");

        micStatusBadge.innerHTML =
            "<span></span> ON";

    } else {

        status.textContent =
            "Microphone is off";

        statusDescription.textContent =
            "Microphone access is required to use Ear Aware.";

        micStatusBadge.classList.remove("online");
        micStatusBadge.classList.add("offline");

        micStatusBadge.innerHTML =
            "<span></span> OFF";
    }
}


function createAudioProcessingChain() {

    if (
        !audioContext ||
        !microphoneSource
    ) {
        return;
    }

    disconnectAudioProcessing();

    highPassFilter =
        audioContext.createBiquadFilter();

    highPassFilter.type =
        "highpass";

    highPassFilter.frequency.value =
        100;

    highPassFilter.Q.value =
        0.7;


    let previousNode =
        highPassFilter;


    speechFilters = [];

    SPEECH_BANDS.forEach(
        function(band) {

            const filter =
                audioContext.createBiquadFilter();

            filter.type =
                "peaking";

            filter.frequency.value =
                band.frequency;

            filter.gain.value =
                band.gain;

            filter.Q.value =
                band.Q;

            previousNode.connect(
                filter
            );

            previousNode = filter;

            speechFilters.push(
                filter
            );
        }
    );


    calibrationFilters = [];

    CALIBRATION_FREQUENCIES.forEach(
        function(frequency) {

            const filter =
                audioContext.createBiquadFilter();

            filter.type =
                "peaking";

            filter.frequency.value =
                frequency;

            filter.gain.value =
                0;

            filter.Q.value =
                1;

            previousNode.connect(
                filter
            );

            previousNode = filter;

            calibrationFilters.push(
                filter
            );
        }
    );


    compressor =
        audioContext.createDynamicsCompressor();

    compressor.threshold.value =
        -24;

    compressor.knee.value =
        18;

    compressor.ratio.value =
        3;

    compressor.attack.value =
        0.003;

    compressor.release.value =
        0.25;


    masterGain =
        audioContext.createGain();

    masterGain.gain.value =
        0.65;


    previousNode.connect(
        compressor
    );

    compressor.connect(
        masterGain
    );

    masterGain.connect(
        audioContext.destination
    );


    microphoneSource.connect(
        highPassFilter
    );

    audioOutputStarted = true;

    console.log(
        "Speech enhancement pipeline created."
    );
}


function disconnectAudioProcessing() {

    if (microphoneSource) {

        try {
            microphoneSource.disconnect();
        } catch (error) {
        }
    }


    if (highPassFilter) {

        try {
            highPassFilter.disconnect();
        } catch (error) {
        }

        highPassFilter = null;
    }


    speechFilters.forEach(
        function(filter) {

            try {
                filter.disconnect();
            } catch (error) {
            }
        }
    );

    speechFilters = [];


    calibrationFilters.forEach(
        function(filter) {

            try {
                filter.disconnect();
            } catch (error) {
            }
        }
    );

    calibrationFilters = [];


    if (compressor) {

        try {
            compressor.disconnect();
        } catch (error) {
        }

        compressor = null;
    }


    if (masterGain) {

        try {
            masterGain.disconnect();
        } catch (error) {
        }

        masterGain = null;
    }


    audioOutputStarted = false;
}


function applyCalibrationEQ(eqProfile) {

    if (
        !audioContext ||
        calibrationFilters.length === 0
    ) {

        console.log(
            "Calibration EQ is not ready."
        );

        return;
    }


    calibrationFilters.forEach(
        function(filter) {

            const frequency =
                Math.round(
                    filter.frequency.value
                );

            const gain =
                Number(
                    eqProfile[frequency] || 0
                );

            const safeGain =
                Math.max(
                    -12,
                    Math.min(
                        gain,
                        9
                    )
                );

            filter.gain.setTargetAtTime(
                safeGain,
                audioContext.currentTime,
                0.05
            );
        }
    );


    console.log(
        "Calibration EQ applied:",
        eqProfile
    );
}


function resetCalibrationEQ() {

    if (!audioContext) {
        return;
    }

    calibrationFilters.forEach(
        function(filter) {

            filter.gain.setTargetAtTime(
                0,
                audioContext.currentTime,
                0.05
            );
        }
    );


    console.log(
        "Calibration EQ reset."
    );
}


function setMasterVolume(value) {

    if (!masterGain) {
        return;
    }

    const safeValue =
        Math.max(
            0,
            Math.min(
                value,
                1
            )
        );

    masterGain.gain.setTargetAtTime(
        safeValue,
        audioContext.currentTime,
        0.05
    );
}


async function startMicrophone() {

    try {

        console.log(
            "Requesting microphone..."
        );


        microphoneStream =
            await navigator.mediaDevices.getUserMedia({

                audio: {

                    echoCancellation: true,

                    noiseSuppression: true,

                    autoGainControl: false,

                    channelCount: 1
                }
            });


        const audioTracks =
            microphoneStream.getAudioTracks();


        if (
            audioTracks.length === 0
        ) {

            throw new Error(
                "No microphone audio track found."
            );
        }


        const microphoneTrack =
            audioTracks[0];


        audioContext =
            new AudioContext();


        if (
            audioContext.state ===
            "suspended"
        ) {

            await audioContext.resume();
        }


        microphoneSource =
            audioContext.createMediaStreamSource(
                microphoneStream
            );


        createAudioProcessingChain();


        if (
            typeof startAudioBuffer ===
            "function"
        ) {

            startAudioBuffer(
                microphoneStream
            );
        }


        if (
            microphoneTrack.readyState ===
            "live"
        ) {

            updateMicrophoneStatus(
                true
            );

            console.log(
                "MICROPHONE IS ON"
            );

        } else {

            updateMicrophoneStatus(
                false
            );
        }


        microphoneTrack.onended =
            function() {

                console.log(
                    "Microphone track ended."
                );

                updateMicrophoneStatus(
                    false
                );

                disconnectAudioProcessing();
            };


        console.log(
            "Audio Context:",
            audioContext
        );

        console.log(
            "Audio Context State:",
            audioContext.state
        );

        console.log(
            "Speech enhancement active."
        );

    }

    catch (error) {

        console.error(
            "Microphone error:",
            error
        );

        updateMicrophoneStatus(
            false
        );

        status.textContent =
            "Microphone unavailable";

        statusDescription.textContent =
            error.message;
    }
}

const startEarAwareButton =
    document.getElementById("startEarAwareButton");

startEarAwareButton.addEventListener(
    "click",
    async function() {

        startEarAwareButton.disabled = true;

        await startMicrophone();

        if (microphoneStream) {
            startEarAwareButton.textContent =
                "Ear Aware Active";
        } else {
            startEarAwareButton.disabled = false;
        }

    }
);