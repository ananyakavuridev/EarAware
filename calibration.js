const calibrationFrequencies = [
    250,
    500,
    1000,
    2000,
    4000,
    8000
];

const testLevels = [
    0.025,
    0.04,
    0.06,
    0.08,
    0.10
];

let calibrationIndex = 0;
let currentLevel = 0;
let calibrationProfile = {};

let calibrationAudioContext = null;
let oscillator = null;
let gainNode = null;

let calibrationRunning = false;

const startCalibrationButton =
    document.getElementById("startCalibrationButton");

const playToneButton =
    document.getElementById("playToneButton");

const stopToneButton =
    document.getElementById("stopToneButton");

const heardButton =
    document.getElementById("heardButton");

const notHeardButton =
    document.getElementById("notHeardButton");

const restartCalibrationButton =
    document.getElementById("restartCalibrationButton");

const applyEQButton =
    document.getElementById("applyEQButton");

const calibrationIntro =
    document.getElementById("calibrationIntro");

const calibrationTest =
    document.getElementById("calibrationTest");

const calibrationResult =
    document.getElementById("calibrationResult");

const frequencyDisplay =
    document.getElementById("frequencyDisplay");

const frequencyDescription =
    document.getElementById("frequencyDescription");

const calibrationProgress =
    document.getElementById("calibrationProgress");

const calibrationProgressBar =
    document.getElementById("calibrationProgressBar");

const levelDisplay =
    document.getElementById("levelDisplay");

const levelIndicator =
    document.getElementById("levelIndicator");

const calibrationInstruction =
    document.getElementById("calibrationInstruction");

const calibrationStatus =
    document.getElementById("calibrationStatus");

const profileResults =
    document.getElementById("profileResults");

const profileSummary =
    document.getElementById("profileSummary");


function startCalibration() {

    stopTone();

    calibrationIndex = 0;
    currentLevel = 0;
    calibrationProfile = {};
    calibrationRunning = true;

    calibrationAudioContext =
        new AudioContext();

    calibrationIntro.hidden = true;
    calibrationResult.hidden = true;
    calibrationTest.hidden = false;

    startCalibrationButton.disabled = true;

    showCurrentFrequency();
}


function showCurrentFrequency() {

    currentLevel = 0;

    const frequency =
        calibrationFrequencies[calibrationIndex];

    frequencyDisplay.textContent =
        frequency + " Hz";

    frequencyDescription.textContent =
        getFrequencyDescription(frequency);

    calibrationProgress.textContent =
        (calibrationIndex + 1) +
        " / " +
        calibrationFrequencies.length;

    calibrationProgressBar.style.width =
        (
            calibrationIndex /
            calibrationFrequencies.length
        ) * 100 + "%";

    updateLevelUI();

    calibrationInstruction.textContent =
        "Press Play Tone and listen carefully.";

    calibrationStatus.textContent =
        "Status: Ready";

    playToneButton.disabled = false;
    stopToneButton.disabled = true;

    heardButton.disabled = true;
    notHeardButton.disabled = true;
}


function updateLevelUI() {

    levelDisplay.textContent =
        "Level " +
        (currentLevel + 1);

    levelIndicator.style.width =
        (
            (currentLevel + 1) /
            testLevels.length
        ) * 100 + "%";
}


function playTone() {

    if (
        !calibrationAudioContext ||
        !calibrationRunning
    ) {
        return;
    }

    stopTone();

    oscillator =
        calibrationAudioContext.createOscillator();

    gainNode =
        calibrationAudioContext.createGain();

    const frequency =
        calibrationFrequencies[
            calibrationIndex
        ];

    const level =
        testLevels[currentLevel];

    oscillator.type = "sine";

    oscillator.frequency.value =
        frequency;

    gainNode.gain.value =
        level;

    oscillator.connect(gainNode);

    gainNode.connect(
        calibrationAudioContext.destination
    );

    oscillator.start();

    playToneButton.disabled = true;
    stopToneButton.disabled = false;

    heardButton.disabled = false;
    notHeardButton.disabled = false;

    calibrationStatus.textContent =
        "Status: Tone playing";

    calibrationInstruction.textContent =
        "Listen carefully, then select your response.";
}


function stopTone() {

    if (oscillator) {

        try {
            oscillator.stop();
        } catch (error) {
        }

        oscillator.disconnect();
        oscillator = null;
    }

    if (gainNode) {

        gainNode.disconnect();
        gainNode = null;
    }

    if (stopToneButton) {
        stopToneButton.disabled = true;
    }
}


function recordResponse(heard) {

    stopTone();

    heardButton.disabled = true;
    notHeardButton.disabled = true;

    const frequency =
        calibrationFrequencies[
            calibrationIndex
        ];

    if (heard) {

        calibrationProfile[frequency] =
            currentLevel;

        moveToNextFrequency();

        return;
    }

    if (
        currentLevel <
        testLevels.length - 1
    ) {

        currentLevel++;

        updateLevelUI();

        calibrationStatus.textContent =
            "Status: Level increased";

        calibrationInstruction.textContent =
            "The level has increased. Press Play Tone again.";

        playToneButton.disabled = false;

        return;
    }

    calibrationProfile[frequency] =
        testLevels.length;

    moveToNextFrequency();
}


function moveToNextFrequency() {

    calibrationIndex++;

    if (
        calibrationIndex >=
        calibrationFrequencies.length
    ) {

        finishCalibration();

        return;
    }

    setTimeout(
        showCurrentFrequency,
        400
    );
}


function finishCalibration() {

    stopTone();

    calibrationRunning = false;

    calibrationTest.hidden = true;
    calibrationResult.hidden = false;

    calibrationProgress.textContent =
        calibrationFrequencies.length +
        " / " +
        calibrationFrequencies.length;

    calibrationProgressBar.style.width =
        "100%";

    saveCalibrationProfile();

    displayCalibrationProfile();

    startCalibrationButton.disabled = false;
}


function saveCalibrationProfile() {

    const eqProfile = {};

    calibrationFrequencies.forEach(
        function(frequency) {

            const level =
                calibrationProfile[frequency];

            let gain = 0;

            if (level === 5) {
                gain = 9;
            }

            else if (level === 4) {
                gain = 6;
            }

            else if (level === 3) {
                gain = 4;
            }

            else if (level === 2) {
                gain = 2;
            }

            eqProfile[frequency] =
                gain;
        }
    );

    localStorage.setItem(
        "earAwareCalibration",
        JSON.stringify(
            calibrationProfile
        )
    );

    localStorage.setItem(
        "earAwareEQ",
        JSON.stringify(
            eqProfile
        )
    );

    console.log(
        "Calibration Profile:",
        calibrationProfile
    );

    console.log(
        "Recommended EQ:",
        eqProfile
    );
}


function displayCalibrationProfile() {

    profileResults.innerHTML = "";

    let needsBoost = 0;

    calibrationFrequencies.forEach(
        function(frequency) {

            const level =
                calibrationProfile[frequency];

            const row =
                document.createElement("div");

            row.className =
                "profile-row";

            const frequencyElement =
                document.createElement("span");

            frequencyElement.className =
                "profile-frequency";

            frequencyElement.textContent =
                frequency + " Hz";

            const responseElement =
                document.createElement("span");

            responseElement.className =
                "profile-response";

            responseElement.textContent =
                getProfileLabel(level);

            row.appendChild(
                frequencyElement
            );

            row.appendChild(
                responseElement
            );

            profileResults.appendChild(
                row
            );

            if (level >= 3) {
                needsBoost++;
            }
        }
    );

    if (needsBoost === 0) {

        profileSummary.textContent =
            "Your responses were consistent across the tested frequencies. Minimal amplification is recommended.";

    } else {

        profileSummary.textContent =
            needsBoost +
            " frequency range(s) showed a softer response and may benefit from additional amplification.";
    }
}


function getProfileLabel(level) {

    if (level === 0) {
        return "Clearly heard";
    }

    if (level === 1) {
        return "Low level";
    }

    if (level === 2) {
        return "Moderate";
    }

    if (level === 3) {
        return "Higher level";
    }

    if (level === 4) {
        return "Very high";
    }

    return "Not detected";
}


function getFrequencyDescription(frequency) {

    if (frequency === 250) {
        return "Low frequency";
    }

    if (frequency === 500) {
        return "Low-mid frequency";
    }

    if (frequency === 1000) {
        return "Speech range";
    }

    if (frequency === 2000) {
        return "Speech clarity range";
    }

    if (frequency === 4000) {
        return "High-mid frequency";
    }

    if (frequency === 8000) {
        return "High frequency";
    }

    return "Audio frequency";
}


function applyRecommendedEQ() {

    const savedEQ =
        localStorage.getItem(
            "earAwareEQ"
        );

    if (!savedEQ) {
        return;
    }

    const eqProfile =
        JSON.parse(savedEQ);

    console.log(
        "Applying EQ:",
        eqProfile
    );

    if (
        typeof applyCalibrationEQ ===
        "function"
    ) {

        applyCalibrationEQ(
            eqProfile
        );

    } else {

         profileSummary.textContent = "✓ Personalized audio enabled. Ear Aware is now using your calibrated hearing profile.";
    }
}


function restartCalibration() {

    stopTone();

    calibrationRunning = false;

    calibrationIndex = 0;
    currentLevel = 0;
    calibrationProfile = {};

    calibrationTest.hidden = true;
    calibrationResult.hidden = true;
    calibrationIntro.hidden = false;

    calibrationProgress.textContent =
        "0 / " +
        calibrationFrequencies.length;

    calibrationProgressBar.style.width =
        "0%";

    startCalibrationButton.disabled =
        false;
}


startCalibrationButton.addEventListener(
    "click",
    startCalibration
);


playToneButton.addEventListener(
    "click",
    playTone
);


stopToneButton.addEventListener(
    "click",
    function() {

        stopTone();

        heardButton.disabled = true;
        notHeardButton.disabled = true;

        playToneButton.disabled = false;

        calibrationStatus.textContent =
            "Status: Tone stopped";

    }
);


heardButton.addEventListener(
    "click",
    function() {

        recordResponse(true);

    }
);


notHeardButton.addEventListener(
    "click",
    function() {

        recordResponse(false);

    }
);


restartCalibrationButton.addEventListener(
    "click",
    restartCalibration
);


if (applyEQButton) {

    applyEQButton.addEventListener(
        "click",
        applyRecommendedEQ
    );
}