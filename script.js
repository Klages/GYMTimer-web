// script.js

// --- DOM Elements ---
const timerDisplay = document.getElementById('timer-display');
const thresholdInput = document.getElementById('threshold-input');
const setThresholdBtn = document.getElementById('set-threshold-btn');
const startMicBtn = document.getElementById('start-mic-btn');
const maxVolSpan = document.getElementById('max-vol');
const liveVolSpan = document.getElementById('live-vol');
const statusBar = document.getElementById('status-bar');

// --- Configuration & Constants ---
const DOUBLE_CLAP_INTERVAL = 0.6;
const MIN_DETECTION_INTERVAL = 0.15;
const ATTACK_FACTOR = 1.8;
const FFT_SIZE = 512;
const SMOOTHING_TIME_CONSTANT = 0.3;
const FLASH_DURATION_MS = 150;

// --- Font resizing constants REMOVED (handled by CSS) ---

// --- Audio Context & State ---
let audioContext = null;
let analyser = null;
let microphone = null;
let audioData = new Float32Array(FFT_SIZE / 2);

let currentClapThreshold = parseFloat(localStorage.getItem('clapThreshold') || thresholdInput.value);
thresholdInput.value = currentClapThreshold.toFixed(3);
let timerRunning = false;
let startTime = null;
let animationFrameId = null;
let firstClapTime = 0.0;
let lastDetectionTime = 0.0;
let highestVolumeRecorded = 0.0;
let currentVolumeLevel = 0.0;
let previousVolumeNorm = 0.0;
let isListening = false;

// --- Utility Functions ---
function formatTime(seconds) {
    if (seconds === null || seconds < 0) seconds = 0;
    const totalSeconds = Math.round(seconds);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateStatus(message, isError = false) {
    console.log(`Status Update: ${message}`);
    statusBar.textContent = message;
    statusBar.style.color = isError ? 'red' : 'var(--static-text-color)';
}

function flashElement(element, className) {
    if (!element) return;
    element.classList.add(className);
    setTimeout(() => {
        element.classList.remove(className);
    }, FLASH_DURATION_MS);
}

// --- adjustTimerFontSize function REMOVED ---

// --- Core Logic (processAudio, updateTimerDisplay, startListening, stopListening, setThreshold) ---

function processAudio() {
    if (!analyser || !isListening) { return; }
    analyser.getFloatTimeDomainData(audioData);
    let sumOfSquares = 0;
    for (let i = 0; i < audioData.length; i++) { sumOfSquares += audioData[i] * audioData[i]; }
    currentVolumeLevel = Math.sqrt(sumOfSquares / audioData.length);
    if (isListening) {
        liveVolSpan.textContent = currentVolumeLevel.toFixed(3);
        if (currentVolumeLevel > highestVolumeRecorded) { highestVolumeRecorded = currentVolumeLevel; maxVolSpan.textContent = highestVolumeRecorded.toFixed(3); }
    }
    if (isListening) {
        const currentTime = performance.now() / 1000; const threshold = currentClapThreshold;
        const isAboveThreshold = currentVolumeLevel > threshold; const isAfterInterval = (currentTime - lastDetectionTime) > MIN_DETECTION_INTERVAL; const hasSharpAttack = currentVolumeLevel > (previousVolumeNorm + 1e-6) * ATTACK_FACTOR;
        if (isAboveThreshold && isAfterInterval && hasSharpAttack) {
            lastDetectionTime = currentTime;
            if (firstClapTime > 0) {
                if (currentTime - firstClapTime < DOUBLE_CLAP_INTERVAL) {
                    updateStatus("DOUBLE CLAP DETECTED"); flashElement(timerDisplay, 'flash-timer');
                    if (!timerRunning) { timerRunning = true; startTime = performance.now(); updateStatus("Timer STARTED."); if (!animationFrameId) { animationFrameId = requestAnimationFrame(updateTimerDisplay); } }
                    else { startTime = performance.now(); updateStatus("Timer RESET."); }
                    firstClapTime = 0.0;
                } else { firstClapTime = currentTime; updateStatus("First clap registered... (Previous too late)"); }
            } else { firstClapTime = currentTime; updateStatus("First clap registered..."); }
        }
        previousVolumeNorm = currentVolumeLevel;

        // Reset first_clap_time AND status if the double clap window expires
        if (firstClapTime > 0 && (currentTime - firstClapTime >= DOUBLE_CLAP_INTERVAL)) {
            console.log("Double clap window expired, resetting status."); // Optional console log
            first_clap_time = 0.0;
            // --- STATUS UPDATE ADDED HERE ---
            updateStatus(`Listening... Threshold=${currentClapThreshold.toFixed(3)}`);
        }
    } // end if(isListening) for clap detection
}

function updateTimerDisplay() {
    if (isListening && analyser) { processAudio(); }
    if (!timerRunning) {
        if (isListening) { animationFrameId = requestAnimationFrame(updateTimerDisplay); }
        else { if (animationFrameId) console.log("Stopping animation loop."); animationFrameId = null; }
        return;
    }
    const elapsedTime = (performance.now() - startTime) / 1000;
    timerDisplay.textContent = formatTime(elapsedTime);
    animationFrameId = requestAnimationFrame(updateTimerDisplay);
}

async function startListening() {
    if (isListening) { updateStatus("Already listening."); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { updateStatus("getUserMedia not supported!", true); return; }
    try {
        updateStatus("Requesting microphone access...");
        if (!audioContext || audioContext.state === 'closed') { audioContext = new (window.AudioContext || window.webkitAudioContext)(); console.log("AudioContext created."); }
        if (audioContext.state === 'suspended') { await audioContext.resume(); console.log("AudioContext resumed."); }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        updateStatus("Microphone access granted.");
        analyser = audioContext.createAnalyser(); analyser.fftSize = FFT_SIZE; analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;
        microphone = audioContext.createMediaStreamSource(stream); microphone.connect(analyser);
        isListening = true; previousVolumeNorm = 0.0; firstClapTime = 0.0; lastDetectionTime = 0.0; highestVolumeRecorded = 0.0;
        maxVolSpan.textContent = highestVolumeRecorded.toFixed(3); updateStatus(`Listening... Threshold=${currentClapThreshold.toFixed(3)}`);
        if (!animationFrameId) { console.log("Starting animation loop."); animationFrameId = requestAnimationFrame(updateTimerDisplay); }
        startMicBtn.textContent = "Stop Listening";
    } catch (err) { updateStatus(`Error accessing microphone: ${err.name} - ${err.message}`, true); console.error("getUserMedia error:", err); stopListening(true); }
}

function stopListening(isDueToError = false) {
    const wasListening = isListening; isListening = false;
    if (!wasListening && !audioContext && !isDueToError) { console.log("Stop called but nothing seems active."); return; }
    console.log("Stopping listening process...");
    if (microphone && microphone.mediaStream) { microphone.mediaStream.getTracks().forEach(track => track.stop()); console.log("Mic stream tracks stopped."); }
    if (microphone) { try { microphone.disconnect(); } catch(e) {} microphone = null; }
    if (analyser) { try { analyser.disconnect(); } catch(e) {} analyser = null; }
    currentVolumeLevel = 0.0; previousVolumeNorm = 0.0;
    if(liveVolSpan) liveVolSpan.textContent = currentVolumeLevel.toFixed(3);
    if(startMicBtn) startMicBtn.textContent = "Start Listening";
    if (!timerRunning) { updateStatus('Stopped listening.'); } else { updateStatus('Paused. Press Start Listening to resume detection.'); }
}

function setThreshold() {
    try {
        const newThreshold = parseFloat(thresholdInput.value);
        if (isNaN(newThreshold) || newThreshold <= 0) { alert("Invalid Threshold."); thresholdInput.value = currentClapThreshold.toFixed(3); return; }
        currentClapThreshold = newThreshold; localStorage.setItem('clapThreshold', currentClapThreshold);
        updateStatus(`Threshold set to ${currentClapThreshold.toFixed(3)}`); flashElement(setThresholdBtn, 'flash-button');
        setTimeout(() => {
            if (isListening) { updateStatus(`Listening... Threshold=${currentClapThreshold.toFixed(3)}`); }
            else if (!timerRunning) { updateStatus('Threshold set. Press Start Listening.'); }
            else { updateStatus('Paused. Press Start Listening to resume detection.'); }
        }, 1500);
    } catch (e) { alert(`Error setting threshold: ${e.message}`); thresholdInput.value = currentClapThreshold.toFixed(3); }
}

// --- Event Listeners ---
startMicBtn.addEventListener('click', () => { if (!isListening) { startListening(); } else { stopListening(); } });
setThresholdBtn.addEventListener('click', setThreshold);
thresholdInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { setThreshold(); } });
// --- resize listener REMOVED ---

// --- Initial Setup ---
updateStatus('Ready. Press "Start Listening".');
// --- initial adjustTimerFontSize call REMOVED ---

window.addEventListener('beforeunload', () => {
    stopListening();
    if (audioContext && audioContext.state !== 'closed') { audioContext.close().then(() => console.log("AudioContext closed on unload.")); }
});