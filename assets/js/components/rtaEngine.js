// =========================================================================
// PROFESSIONAL RTA ENGINE, WATERFALL & SPEAKER ALIGNMENT WORKSTATION (rtaEngine.js)
// DSP Math, Octave Tables & Calibration live in assets/js/components/rta/rtaDspMath.js
// PNG/CSV Data Export lives in assets/js/components/rta/rtaDataExport.js
// Native AdMob & Pro Unlocks live in assets/js/components/rta/rtaAdController.js
// =========================================================================

function initProfessionalRTA() {
    const {
        ISO_FREQS,
        ISO_1_3_FREQS,
        ISO_1_1_FREQS,
        OCTAVE_TABLES,
        A_WEIGHTS,
        generateOctaveFrequencies,
        getIECWeighting,
        buildWindowTables,
        initFFTBuffers,
        computeCustomFFT,
        formatConsoleEQFader,
        parseCalibrationData,
        buildCalibrationOffsetsArray,
        interpolateCalOffsetForFreq,
        getWaterfallColor
    } = window.RtaDspMath;

    const canvas = document.getElementById('rta-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('btn-start-analyzer');
    const inputSelect = document.getElementById('rta-input-select');
    const outputSelect = document.getElementById('rta-output-select');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const weightBtns = document.querySelectorAll('.weight-btn');
    const calSlider = document.getElementById('rta-calibration');
    const calValue = document.getElementById('cal-offset');
    const peakToggle = document.getElementById('btn-peak-toggle');
    const peakReset = document.getElementById('btn-peak-reset');
    const labelsContainer = document.getElementById('rta-labels') || document.getElementById('rta-frequency-labels');
    const btnCapture = document.getElementById('btn-capture-snapshot');
    
    let audioCtx, analyser, source, stream, rafID = null, lastFrameTime = 0;
    let dataArray, bufferLength;
    let rtaPinkNoiseNode = null;
    let rtaPinkNoiseGainNode = null;
    let rtaPinkNoiseAnalyserNode = null;
    let rtaPinkNoiseDataArray = null;
    let rtaPinkNoiseSmoothedDataArray = null;
    let isRtaPinkNoiseActive = false;
    let timeData; // For Hanning/Manual FFT
    let smoothedDataArray;
    let isInitialized = false;
    let currentMode = 'fft'; // Default to Spectrum Curve
    let currentWeighting = 'a'; // Default to A-weighted ('a', 'c', 'z')
    let averagingFactor = 4; // Default averaging
    const isIOSPlatform = (() => {
        try {
            if (window.Capacitor && typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() === 'ios') return true;
            const ua = navigator.userAgent || '';
            if (/iPad|iPhone|iPod/.test(ua)) return true;
            if (ua.includes('Macintosh') && navigator.maxTouchPoints > 1) return true;
        } catch (e) {}
        return false;
    })();
    let calibrationOffset = isIOSPlatform ? 125 : 100;
    if (calSlider) calSlider.value = calibrationOffset;
    if (calValue) calValue.textContent = calibrationOffset;
    const initFsCalSlider = document.getElementById('rta-fs-cal-slider');
    const initFsCalVal = document.getElementById('rta-fs-cal-val');
    if (initFsCalSlider) initFsCalSlider.value = calibrationOffset;
    if (initFsCalVal) initFsCalVal.textContent = calibrationOffset;
    let peakHoldEnabled = true;

    // Phase 2: Octave Banding, Window Functions, and Spectrum Tilt State
    let currentOctaveFraction = 3; // 1/3-Octave (31 Bands) Default
    let currentOctaveFreqs = OCTAVE_TABLES[3];
    let currentWindow = 'hann';
    let currentBandMode = 'energy'; // 'energy' (RMS Power Sum) or 'max' (Peak Bin)
    let spectrumTilt = 0.0; // dB per octave around 1 kHz pivot (-6.0 to +6.0)
    let currentRtaLevels = new Float32Array(currentOctaveFreqs.length).fill(-150);
    let peakData = new Float32Array(currentOctaveFreqs.length).fill(-150);
    let peakHoldTimestamps = new Float64Array(currentOctaveFreqs.length).fill(0);
    let analyzerStartTime = 0;
    let lastRtaDrawTimestamp = 0;

    function resetPeakHoldData() {
        peakData = new Float32Array(currentOctaveFreqs.length).fill(-150);
        peakHoldTimestamps = new Float64Array(currentOctaveFreqs.length).fill(0);
    }

    let windowTables = buildWindowTables(2048);
    initFFTBuffers(2048);

    // Phase 4: Workstation Layout and Rolling SPL History State
    let currentLayout = safeStorage.getItem('soundengg_rta_layout') || 'single'; // 'single', 'spl_history'
    if (currentLayout !== 'spl_history') currentLayout = 'single';
    let splLimitThreshold = 100.0; // dB SPL Concert / Venue Limit (Option B)
    let splHistoryData = []; // Array of { time, spl, peak } up to 60 items
    let lastSplHistoryTick = 0;

    let domFreqDisplay = "--- Hz";
    let domConsoleEQ = "---";
    let showDominantWatermark = safeStorage.getItem('rta_show_dom_watermark') !== 'false';
    let showSplWatermark = safeStorage.getItem('rta_show_spl_watermark') !== 'false';

    // Damped Metering & Watermark Telemetry State (Anti-Flicker)
    let splSmoothedDbfs = -100;
    let splDisplayStr = '--.-';
    let splDisplayCategory = 'safe';
    let lastSplDisplayTick = 0;
    let lastTelemetryTime = 0;

    let lockedDomFreq = 0;
    let candidateDomFreq = 0;
    let candidateDomDb = -120;
    let candidateFirstSeen = 0;
    let lastDomDisplayTick = 0;
    let lastDomActiveTime = 0;
    let lockedRtaBandIdx = -1;
    let candidateRtaBandIdx = -1;

    let peakSmoothedDb = -120;
    let lastPeakDisplayTick = 0;

    let currentPeakFreq = 0;
    let currentPeakDb = -120;
    let peakFlagSmoothedX = -1;
    let peakFlagSmoothedY = -1;
    let peakFlagSmoothedDb = -120;
    let peakFlagAlpha = 0;
    let clipStickyUntil = 0;
    let inputRmsDbfs = -100;
    let inputPeakDbfs = -100;
    let keepAliveGain = null;
    let micGainTrimNode = null;
    let micGainTrimDb = parseFloat(safeStorage.getItem('soundengg-mic-gain-trim') || '0.0');
    if (isNaN(micGainTrimDb)) micGainTrimDb = 0.0;
    micGainTrimDb = Math.max(-24.0, Math.min(24.0, micGainTrimDb));
    let rtaInputProcessor = null;
    let latestScriptTimeData = null;
    let zeroSignalFrames = 0;
    let lastAutoRecoverTime = 0;
    let crosshairState = { active: false, x: 0, y: 0, freq: 0, db: -100, phase: 0, coh: 1.0, eqNotch: '---' };
    // Pinch-to-Zoom & Frequency Span State
    let viewMinFreq = 20;
    let viewMaxFreq = 20000;
    let isFrequencyZoomed = false;

    // Active Hardware Audio Input State & Disconnect Monitoring
    let activeInputDevice = { label: 'Internal Microphone', isExternal: false, sampleRate: 48000 };
    let disconnectAlertMessage = '';
    let disconnectAlertTimeout = null;
    let lastHapticAlertTick = 0; // Throttle venue limit alert vibration

    function resetFrequencyZoom() {
        viewMinFreq = 20;
        viewMaxFreq = 20000;
        isFrequencyZoomed = false;
        if (typeof window.triggerHaptic === 'function') window.triggerHaptic('light');
    }
    window.resetRtaFrequencyZoom = resetFrequencyZoom;

    function showInterfaceDisconnectAlert(deviceLabel) {
        disconnectAlertMessage = `⚠ INTERFACE DISCONNECTED: ${deviceLabel || 'EXTERNAL DEVICE'} — FALLBACK TO BUILT-IN MIC`;
        if (disconnectAlertTimeout) clearTimeout(disconnectAlertTimeout);
        disconnectAlertTimeout = setTimeout(() => {
            disconnectAlertMessage = '';
        }, 8000);
    }

    function getTiltOffset(freq) {
        if (!freq || freq <= 0 || spectrumTilt === 0) return 0;
        return spectrumTilt * Math.log2(freq / 1000);
    }
    window.getRtaTiltOffset = getTiltOffset;

    // Pointer event listeners for Interactive Touch/Hover Crosshair on Canvas
    function updateCrosshairFromEvent(e) {
        if (!isAnalyzing || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = (e.clientX !== undefined) ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = (e.clientY !== undefined) ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            crosshairState.x = x * scaleX;
            crosshairState.y = y * scaleY;

            const isDualView = (currentLayout === 'spl_history' && currentMode !== 'waterfall');
            const specWidth = isDualView ? Math.round(canvas.width * 0.64) : canvas.width;

            if (isDualView && crosshairState.x > specWidth) {
                crosshairState.active = false;
                return;
            }

            crosshairState.active = true;

            if (currentMode === 'rta') {
                const freqs = currentOctaveFreqs;
                const bandIdx = Math.floor((crosshairState.x / specWidth) * freqs.length);
                const clampedIdx = Math.max(0, Math.min(freqs.length - 1, bandIdx));
                crosshairState.freq = freqs[clampedIdx];
                crosshairState.db = (currentRtaLevels && currentRtaLevels[clampedIdx] !== undefined) ? currentRtaLevels[clampedIdx] : -100;
            } else if (currentMode === 'tf') {
                const padLeft = 46;
                const padRight = 15;
                const plotWidth = specWidth - padLeft - padRight;
                const relX = Math.max(0, Math.min(plotWidth, crosshairState.x - padLeft));
                const normX = relX / plotWidth;
                const minF = 20;
                const maxF = 20000;
                const freq = minF * Math.pow(maxF / minF, normX);
                crosshairState.freq = Math.round(freq);

                const tf = window.TransferFunctionEngine;
                if (tf && tf.freqs && tf.magnitude) {
                    const bin = Math.max(1, Math.min(tf.freqs.length - 1, Math.round(freq / (tf.sampleRate / (tf.freqs.length * 2)))));
                    const magArr = (tf.smoothingFraction > 0) ? tf.magnitudeSmoothed : tf.magnitude;
                    const phaseArr = (tf.smoothingFraction > 0) ? tf.phaseSmoothed : tf.phase;
                    crosshairState.db = magArr[bin] !== undefined ? magArr[bin] : 0;
                    crosshairState.phase = phaseArr[bin] !== undefined ? phaseArr[bin] : 0;
                    crosshairState.coh = tf.coherence[bin] !== undefined ? tf.coherence[bin] : 1.0;
                }
            } else {
                // FFT / Waterfall: Dynamic Log frequency mapping
                const normX = Math.max(0.001, Math.min(1.0, crosshairState.x / specWidth));
                const sampleRate = audioCtx ? audioCtx.sampleRate : 48000;
                const minF = viewMinFreq;
                const maxF = viewMaxFreq;
                const freq = minF * Math.pow(maxF / minF, normX);
                crosshairState.freq = Math.round(freq);

                if (analyser && bufferLength && dataArray) {
                    const bin = Math.max(0, Math.min(bufferLength - 1, Math.round(freq / (sampleRate / analyser.fftSize))));
                    let val = dataArray[bin] !== undefined ? dataArray[bin] : -100;
                    val += getIECWeighting(crosshairState.freq, currentWeighting);
                    val += getTiltOffset(crosshairState.freq);
                    crosshairState.db = val;
                }
            }
            crosshairState.eqNotch = formatConsoleEQFader(crosshairState.freq);
        } else {
            crosshairState.active = false;
        }
    }

    let touchPinchStartDist = 0;
    let touchPinchStartMinF = 20;
    let touchPinchStartMaxF = 20000;
    let touchPanStartX = 0;
    let touchPanStartMinF = 20;
    let touchPanStartMaxF = 20000;
    let lastTouchEndTime = 0;

    if (canvas) {
        canvas.addEventListener('pointerdown', (e) => {
            updateCrosshairFromEvent(e);
        }, { passive: true });
        canvas.addEventListener('pointermove', (e) => {
            if (e.buttons > 0 || e.pointerType === 'mouse') {
                updateCrosshairFromEvent(e);
            }
        }, { passive: true });
        canvas.addEventListener('pointerup', () => { crosshairState.active = false; }, { passive: true });
        canvas.addEventListener('pointercancel', () => { crosshairState.active = false; }, { passive: true });
        canvas.addEventListener('pointerleave', () => { crosshairState.active = false; }, { passive: true });

        // Multi-touch gestures: Pinch-to-Zoom & Drag on Frequency Axis
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                touchPinchStartDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                touchPinchStartMinF = viewMinFreq;
                touchPinchStartMaxF = viewMaxFreq;
            } else if (e.touches.length === 1) {
                touchPanStartX = e.touches[0].clientX;
                touchPanStartMinF = viewMinFreq;
                touchPanStartMaxF = viewMaxFreq;

                // Double tap detection to toggle fullscreen or reset zoom
                const now = Date.now();
                if (now - lastTouchEndTime < 300) {
                    if (isFrequencyZoomed) {
                        resetFrequencyZoom();
                    } else if (!isFullscreenActive) {
                        toggleRtaFullscreen(true);
                    }
                }
                lastTouchEndTime = now;
            }
        }, { passive: true });

        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && touchPinchStartDist > 0) {
                const currentDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const scale = touchPinchStartDist / Math.max(10, currentDist);
                
                const startLogMin = Math.log10(touchPinchStartMinF);
                const startLogMax = Math.log10(touchPinchStartMaxF);
                const centerLog = (startLogMin + startLogMax) / 2;
                const halfSpan = ((startLogMax - startLogMin) / 2) * scale;

                const clampedHalfSpan = Math.max(0.18, Math.min(1.5, halfSpan));
                let newLogMin = centerLog - clampedHalfSpan;
                let newLogMax = centerLog + clampedHalfSpan;

                if (newLogMin < Math.log10(20)) {
                    const shift = Math.log10(20) - newLogMin;
                    newLogMin += shift;
                    newLogMax = Math.min(Math.log10(20000), newLogMax + shift);
                }
                if (newLogMax > Math.log10(20000)) {
                    const shift = newLogMax - Math.log10(20000);
                    newLogMax -= shift;
                    newLogMin = Math.max(Math.log10(20), newLogMin - shift);
                }

                viewMinFreq = Math.round(Math.pow(10, newLogMin));
                viewMaxFreq = Math.round(Math.pow(10, newLogMax));
                isFrequencyZoomed = (viewMinFreq > 28 || viewMaxFreq < 18500);
            } else if (e.touches.length === 1 && isFrequencyZoomed) {
                const dx = e.touches[0].clientX - touchPanStartX;
                const logRatio = Math.log10(touchPanStartMaxF) - Math.log10(touchPanStartMinF);
                const logShift = -(dx / canvas.width) * logRatio;
                
                let newLogMin = Math.log10(touchPanStartMinF) + logShift;
                let newLogMax = Math.log10(touchPanStartMaxF) + logShift;

                if (newLogMin >= Math.log10(20) && newLogMax <= Math.log10(20000)) {
                    viewMinFreq = Math.round(Math.pow(10, newLogMin));
                    viewMaxFreq = Math.round(Math.pow(10, newLogMax));
                }
            }
        }, { passive: true });
    }

    // Fullscreen RTA state
    let isFullscreenActive = false;

    // Advanced Spectrogram Waterfall Variables
    let waterfallCanvas = null;
    let waterfallCtx = null;

    // Custom Mic Calibration Variables
    let calProfile = []; // Parsed { freq, offset } pairs
    let calOffsets = null; // Precomputed Float32Array matching bufferLength
    let calEnabled = false;

    // Snapshot Memory Bank (4 Slots Architecture)
    let snapshots = []; // Array of { rta: [], fraction: 3, fft: [], color: '', visible: true, id: 0 }
    let pendingSnapshotCaptureSlot = null;
    const SNAPSHOT_COLORS = ['#00FFFF', '#FF00FF', '#FFE600', '#00FF66'];
    const slotsContainer = document.getElementById('snapshot-slots-container');

    function isSnapshotSlotUnlocked(slotIdx) {
        const idx = parseInt(slotIdx, 10);
        if (isNaN(idx) || idx === 0) return true; // Slot 1 (Trace A, index 0) is unconditionally free
        if (window.isUserPro) return true;
        if (typeof window.isPremiumActive === 'function') {
            if (window.isPremiumActive('snapshots')) return true;
            if (window.isPremiumActive(`snapshot_slot_${idx}`)) return true;
        }
        return false;
    }
    window.isSnapshotSlotUnlocked = isSnapshotSlotUnlocked;
    window.cancelPendingSnapshotCapture = function() {
        pendingSnapshotCaptureSlot = null;
    };

    function syncFrequencyLabelsLayout() {
        const isDualView = (currentLayout === 'spl_history' && currentMode !== 'waterfall');
        const wrapper = canvas ? canvas.parentElement : null;
        if (wrapper) {
            wrapper.classList.toggle('layout-spl-history', isDualView);
            wrapper.classList.toggle('layout-dual-view', isDualView);
        }
        const labelsEl = labelsContainer || document.getElementById('rta-labels') || document.getElementById('rta-frequency-labels') || document.querySelector('.freq-labels') || document.querySelector('.frequency-labels');
        if (labelsEl) {
            if (isFullscreenActive) {
                labelsEl.style.width = '';
            } else {
                labelsEl.style.width = isDualView ? '64%' : '100%';
            }
            labelsEl.style.padding = '0';
            if (isDualView) {
                const isLight = document.documentElement.classList.contains('light');
                labelsEl.style.borderRight = isLight ? '1.5px solid rgba(0,0,0,0.15)' : '1.5px solid rgba(0, 240, 255, 0.25)';
            } else {
                labelsEl.style.borderRight = 'none';
            }
        }
    }
    window.syncFrequencyLabelsLayout = syncFrequencyLabelsLayout;

    // Adaptive Frequency Labels Generator: Scales dynamically across 1/1, 1/3, 1/6, 1/12, and 1/24 Octave bands
    function renderFrequencyLabels() {
        if (!labelsContainer) return;
        const freqs = currentOctaveFreqs || ISO_1_3_FREQS;
        const totalBands = freqs.length;

        if (totalBands <= 10) {
            // 1/1 Octave: every band is a standard ISO anchor (31.5 .. 16k)
            labelsContainer.style.position = 'relative';
            labelsContainer.innerHTML = freqs.map((f) => {
                const formatted = f >= 1000 ? (f % 1000 === 0 ? (f / 1000) + 'k' : (f / 1000).toFixed(1) + 'k') : f;
                return `<span class="freq-label active-anchor" style="flex: 1; text-align: center;">${formatted}</span>`;
            }).join('');
        } else {
            // 1/3, 1/6, 1/12, 1/24 Octaves: Render clean standard ISO anchor labels positioned precisely over their corresponding bars with safe edge insets
            const CLEAN_ISO_ANCHORS = [
                { target: 20, label: '20' },
                { target: 31.5, label: '31.5' },
                { target: 63, label: '63' },
                { target: 125, label: '125' },
                { target: 250, label: '250' },
                { target: 500, label: '500' },
                { target: 1000, label: '1k' },
                { target: 2000, label: '2k' },
                { target: 4000, label: '4k' },
                { target: 8000, label: '8k' },
                { target: 16000, label: '16k' },
                { target: 20000, label: '20k' }
            ];
            labelsContainer.style.position = 'relative';
            labelsContainer.innerHTML = CLEAN_ISO_ANCHORS.map((anchor, idx) => {
                let closestIdx = 0;
                let minLogDist = Infinity;
                for (let b = 0; b < totalBands; b++) {
                    const dist = Math.abs(Math.log2(freqs[b] / anchor.target));
                    if (dist < minLogDist) {
                        minLogDist = dist;
                        closestIdx = b;
                    }
                }
                const pct = ((closestIdx + 0.5) / totalBands) * 100;
                let posStyle;
                if (idx === 0) {
                    posStyle = `left: 6px; transform: none;`;
                } else if (idx === CLEAN_ISO_ANCHORS.length - 1) {
                    posStyle = `right: 6px; left: auto; transform: none;`;
                } else if (anchor.target === 16000) {
                    posStyle = `left: ${Math.min(91.5, pct).toFixed(2)}%; transform: translateX(-50%);`;
                } else {
                    posStyle = `left: ${pct.toFixed(2)}%; transform: translateX(-50%);`;
                }
                return `<span class="freq-label active-anchor" style="position: absolute; top: 50%; margin-top: -6px; ${posStyle} white-space: nowrap; pointer-events: none;">${anchor.label}</span>`;
            }).join('');
        }

        syncFrequencyLabelsLayout();
    }
    renderFrequencyLabels();

    async function getDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputs = devices.filter(d => d.kind === 'audioinput');
            const savedMic = safeStorage.getItem('soundengg-mic-id') || 'default';
            if (inputSelect) {
                const optionsHtml = '<option value="default">Default Device Microphone</option>' +
                    inputs.map(d => `<option value="${d.deviceId}" ${d.deviceId === savedMic ? 'selected' : ''}>${d.label || 'Input ' + d.deviceId.slice(0, 6)}</option>`).join('');
                inputSelect.innerHTML = optionsHtml;
                if (savedMic && savedMic !== 'default') {
                    inputSelect.value = savedMic;
                }
            }
            const micBadge = document.getElementById('rta-mic-badge');
            if (micBadge) {
                const activeOption = inputSelect && inputSelect.options[inputSelect.selectedIndex];
                micBadge.textContent = activeOption ? (activeOption.text.length > 18 ? activeOption.text.slice(0, 16) + '...' : activeOption.text).toUpperCase() : 'MIC ACTIVE';
            }
        } catch (e) { console.error("Device enumeration failed", e); }
    }

    if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
        navigator.mediaDevices.addEventListener('devicechange', async () => {
            getDevices();
            if (isAnalyzing && activeInputDevice && activeInputDevice.isExternal) {
                try {
                    const devs = await navigator.mediaDevices.enumerateDevices();
                    const stillPresent = devs.some(d => d.kind === 'audioinput' && d.label && d.label.includes(activeInputDevice.label));
                    if (!stillPresent) {
                        if (typeof window.triggerHaptic === 'function') {
                            window.triggerHaptic('warning');
                        }
                        showInterfaceDisconnectAlert(activeInputDevice.label);
                        activeInputDevice.isExternal = false;
                        activeInputDevice.label = 'Built-in Mic (Fallback)';
                    }
                } catch (e) {}
            }
        });
    }

    let isAnalyzing = false;
    let isStartingAnalyzer = false;

    function getAudioSessionPlugin() {
        if (window._cachedAudioSessionPlugin) return window._cachedAudioSessionPlugin;
        const existing = window.Capacitor?.Plugins?.AudioSessionPlugin;
        if (existing) {
            window._cachedAudioSessionPlugin = existing;
            return existing;
        }
        if (window.Capacitor?.registerPlugin) {
            try {
                window._cachedAudioSessionPlugin = window.Capacitor.registerPlugin('AudioSessionPlugin');
                return window._cachedAudioSessionPlugin;
            } catch (e) {}
        }
        return null;
    }

    function syncRunStopButtons(running, isErr = false) {
        if (startBtn) {
            if (isErr) {
                startBtn.classList.remove('active', 'danger-btn');
                startBtn.innerHTML = '<span class="material-symbols-outlined">error</span> ACCESS_DENIED';
            } else if (running) {
                startBtn.classList.remove('pulse-glow');
                startBtn.classList.add('active', 'danger-btn');
                startBtn.innerHTML = '<span class="material-symbols-outlined">stop</span> DEACTIVATE RTA';
            } else {
                startBtn.classList.remove('active', 'danger-btn');
                startBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span> START MEASUREMENT';
            }
        }
        const ribbonRunBtn = document.getElementById('btn-rta-ribbon-run');
        if (ribbonRunBtn) {
            if (isErr) {
                ribbonRunBtn.classList.remove('active');
                ribbonRunBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">error</span><span class="rta-run-label">ERR</span>';
            } else if (running) {
                ribbonRunBtn.classList.add('active');
                ribbonRunBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">stop</span><span class="rta-run-label">STOP</span>';
            } else {
                ribbonRunBtn.classList.remove('active');
                ribbonRunBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">play_arrow</span><span class="rta-run-label">RUN</span>';
            }
        }
        const fsRunBtn = document.getElementById('btn-rta-fs-run');
        if (fsRunBtn) {
            if (isErr) {
                fsRunBtn.classList.remove('active');
                fsRunBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 15px;">refresh</span><span class="fs-btn-label">RETRY</span>';
            } else if (running) {
                fsRunBtn.classList.add('active');
                fsRunBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 15px;">stop</span><span class="fs-btn-label">STOP</span>';
            } else {
                fsRunBtn.classList.remove('active');
                fsRunBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 15px;">play_arrow</span><span class="fs-btn-label">RUN</span>';
            }
        }
    }

    // --- Screen Wake Lock Management (Keeps display active during live show) ---
    let rtaWakeLock = null;
    async function requestRtaWakeLock() {
        if (!isAnalyzing) return;
        try {
            if ('wakeLock' in navigator && !rtaWakeLock) {
                rtaWakeLock = await navigator.wakeLock.request('screen');
                rtaWakeLock.addEventListener('release', () => {
                    rtaWakeLock = null;
                });
            }
        } catch (err) {
            // Non-critical, ignore if system policy or low battery prevents wake lock
        }
    }

    async function releaseRtaWakeLock() {
        try {
            if (rtaWakeLock) {
                await rtaWakeLock.release();
                rtaWakeLock = null;
            }
        } catch (e) {}
    }
    
    window.startAnalyzer = async function startAnalyzer(deviceId, forceRestart = false) {
        const hasLiveStream = stream && stream.getAudioTracks && stream.getAudioTracks().some(t => t.readyState === 'live' && t.enabled && !t.muted);
        if (isStartingAnalyzer) return;
        if (!forceRestart && isAnalyzing && hasLiveStream && audioCtx && audioCtx.state !== 'closed' && !deviceId) {
            if (audioCtx.state !== 'running') {
                audioCtx.resume().catch(() => {});
            }
            if (!rafID) {
                lastFrameTime = performance.now();
                rafID = requestAnimationFrame(draw);
            }
            syncRunStopButtons(true);
            return;
        }
        isStartingAnalyzer = true;
        zeroSignalFrames = 0;
        deviceId = deviceId || safeStorage.getItem('soundengg-mic-id') || 'default';

        // Ensure no background Delay Calculator audio loop or mic capture is holding the iOS AVAudioSession
        if (typeof window.stopAlignmentLoop === 'function') {
            try { window.stopAlignmentLoop(); } catch (e) {}
        }
        if (typeof window.stopAutoPingListening === 'function') {
            try { window.stopAutoPingListening(); } catch (e) {}
        }
        
        if (rafID) {
            cancelAnimationFrame(rafID);
            rafID = null;
        }
        if (rtaInputProcessor) {
            try { rtaInputProcessor.onaudioprocess = null; rtaInputProcessor.disconnect(); } catch (e) {}
            rtaInputProcessor = null;
        }
        if (stream) {
            try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
            stream = null;
        }
        if (source) {
            try { source.disconnect(); } catch (e) {}
            source = null;
        }
        if (keepAliveGain) {
            try { keepAliveGain.disconnect(); } catch (e) {}
            keepAliveGain = null;
        }
        if (audioCtx) {
            try { await audioCtx.close(); } catch (e) {}
            audioCtx = null;
        }

        try {
            // 1. Configure native iOS / Android audio session FIRST (before getUserMedia & AudioContext)
            // so CoreAudio locks the hardware sample rate and measurement input route cleanly
            const audioPlugin = getAudioSessionPlugin();
            if (audioPlugin && typeof audioPlugin.configureAudioSession === 'function') {
                try {
                    await audioPlugin.configureAudioSession({ category: 'playAndRecord', mode: 'measurement' });
                } catch (e) {
                    console.warn("AudioSessionPlugin call warning:", e);
                }
            }

            // 2. Request hardware microphone stream with uncolored 48kHz measurement constraints
            const baseAudioConstraints = {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                sampleRate: { ideal: 48000 },
                channelCount: { ideal: 2, min: 1 }
            };
            let constraints = {
                audio: (deviceId && deviceId !== 'default')
                    ? { ...baseAudioConstraints, deviceId: { exact: deviceId } }
                    : baseAudioConstraints
            };
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (constraintErr) {
                console.warn("Exact mic constraint failed, falling back to default measurement audio input:", constraintErr);
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: baseAudioConstraints });
                } catch (fallbackErr) {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                }
            }

            // Re-verify native iOS AVAudioSession after getUserMedia in case WebKit reset mode to voice/16kHz
            if (audioPlugin && typeof audioPlugin.configureAudioSession === 'function') {
                try {
                    await audioPlugin.configureAudioSession({ category: 'playAndRecord', mode: 'measurement' });
                } catch (e) {}
            }

            // 3. Create AudioContext at 48kHz AFTER getUserMedia so full 20Hz-20kHz spectrum is preserved
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            try {
                audioCtx = new AudioCtxClass({ sampleRate: 48000, latencyHint: 'interactive' });
            } catch (ctxOptErr) {
                audioCtx = new AudioCtxClass();
            }
            if (audioCtx.state !== 'running') {
                try {
                    await Promise.race([
                        audioCtx.resume(),
                        new Promise(res => setTimeout(res, 200))
                    ]);
                } catch (e) {
                    console.warn("AudioContext resume warning in RTA:", e);
                }
            }

            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048; 
            analyser.smoothingTimeConstant = 0; // We'll do custom smoothing
            
            source = audioCtx.createMediaStreamSource(stream);

            // Hardware Mic Sensitivity / Gain Trim (-24 dB to +24 dB)
            micGainTrimNode = audioCtx.createGain();
            const linearMicTrim = Math.pow(10.0, micGainTrimDb / 20.0);
            micGainTrimNode.gain.setValueAtTime(linearMicTrim, audioCtx.currentTime);

            keepAliveGain = audioCtx.createGain();
            keepAliveGain.gain.setValueAtTime(0, audioCtx.currentTime);

            bufferLength = analyser.frequencyBinCount;
            dataArray = new Float32Array(bufferLength);
            timeData = new Float32Array(analyser.fftSize);
            latestScriptTimeData = new Float32Array(analyser.fftSize);

            // 4. Attach active ScriptProcessor pull node so iPadOS/iOS WebKit continuously pumps mic PCM frames
            try {
                rtaInputProcessor = audioCtx.createScriptProcessor(2048, 1, 1);
                rtaInputProcessor.onaudioprocess = (e) => {
                    if (!isAnalyzing) return;
                    const input = e.inputBuffer.getChannelData(0);
                    if (latestScriptTimeData && input.length > 0) {
                        const copyLen = Math.min(latestScriptTimeData.length, input.length);
                        latestScriptTimeData.set(input.subarray(0, copyLen));
                    }
                };
                source.connect(micGainTrimNode);
                micGainTrimNode.connect(analyser);
                analyser.connect(rtaInputProcessor);
                rtaInputProcessor.connect(keepAliveGain);
                keepAliveGain.connect(audioCtx.destination);
            } catch (spErr) {
                source.connect(micGainTrimNode);
                micGainTrimNode.connect(analyser);
                analyser.connect(keepAliveGain);
                keepAliveGain.connect(audioCtx.destination);
            }

            if (!smoothedDataArray || smoothedDataArray.length !== bufferLength || !forceRestart) {
                smoothedDataArray = new Float32Array(bufferLength).fill(-100);
            }
            
            // Build / update window tables & FFT buffers matching analyser.fftSize
            windowTables = buildWindowTables(analyser.fftSize);
            initFFTBuffers(analyser.fftSize);

            // Precompute calibration offsets matching the current bin count
            precomputeCalibrationOffsets();
            
            isInitialized = true;
            isAnalyzing = true;
            isStartingAnalyzer = false;
            analyzerStartTime = performance.now();
            resetPeakHoldData();
            syncRunStopButtons(true);
            
            // Detect active audio hardware input label & classification + attach auto-recovery listener
            try {
                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack) {
                    audioTrack.addEventListener('ended', () => {
                        if (isAnalyzing && !isStartingAnalyzer) {
                            setTimeout(() => {
                                if (isAnalyzing && !isStartingAnalyzer) {
                                    startAnalyzer(undefined, true);
                                }
                            }, 250);
                        }
                    });
                }
                let rawLabel = audioTrack ? (audioTrack.label || '').trim() : '';
                if (!rawLabel && inputSelect && inputSelect.selectedIndex >= 0) {
                    const opt = inputSelect.options[inputSelect.selectedIndex];
                    if (opt && opt.text && !opt.text.toLowerCase().includes('default device')) {
                        rawLabel = opt.text.trim();
                    }
                }
                const lower = rawLabel.toLowerCase();
                const isBT = /buds|airpod|bluetooth|wireless|headset|hands-free|hfp|air6/i.test(lower);
                const isInternal = lower.includes('built-in') || 
                    lower.includes('internal') || 
                    lower.includes('iphone microphone') || 
                    lower.includes('ipad microphone') || 
                    lower.includes('default');
                const isUsb = !isInternal && !isBT && (lower.length > 0 || /evo|audient|scarlett|focusrite|behringer|motu|usb/i.test(lower));
                activeInputDevice = {
                    label: rawLabel || (isUsb ? 'USB Audio Interface' : (isBT ? 'Bluetooth Headset' : 'Built-in Mic')),
                    isExternal: isUsb,
                    isBluetooth: isBT,
                    deviceId: deviceId,
                    sampleRate: audioCtx ? audioCtx.sampleRate : 48000
                };
            } catch (e) {}

            getDevices();
            // If Pink Noise was active before startAnalyzer recreated audioCtx (e.g. when switching mic input to EVO4),
            // re-bind Pink Noise nodes to the new audioCtx so output continues seamlessly on the external USB interface
            if (isRtaPinkNoiseActive) {
                isRtaPinkNoiseActive = false;
                await toggleRtaPinkNoise();
            }
            lastFrameTime = performance.now();
            rafID = requestAnimationFrame(draw);
            requestRtaWakeLock();
            if (!forceRestart && typeof window.triggerHaptic === 'function') {
                window.triggerHaptic('medium');
            }
        } catch (e) {
            console.error("Mic access failed", e);
            syncRunStopButtons(false, true);
            isAnalyzing = false;
            isStartingAnalyzer = false;
        }
    };

    async function stopAnalyzer() {
        isStartingAnalyzer = false;
        zeroSignalFrames = 0;
        if (typeof window.triggerHaptic === 'function') {
            window.triggerHaptic('medium');
        }
        if (isRtaPinkNoiseActive) {
            toggleRtaPinkNoise();
        }
        if (window.TransferFunctionEngine && typeof window.TransferFunctionEngine.stop === 'function') {
            window.TransferFunctionEngine.stop();
        }
        isAnalyzing = false;
        releaseRtaWakeLock();
        if (rafID) {
            cancelAnimationFrame(rafID);
            rafID = null;
        }
        if (rtaInputProcessor) {
            try { rtaInputProcessor.onaudioprocess = null; rtaInputProcessor.disconnect(); } catch (e) {}
            rtaInputProcessor = null;
        }
        if (stream) {
            try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
            stream = null;
        }
        if (source) {
            try { source.disconnect(); } catch (e) {}
            source = null;
        }
        if (micGainTrimNode) {
            try { micGainTrimNode.disconnect(); } catch (e) {}
            micGainTrimNode = null;
        }
        if (keepAliveGain) {
            try { keepAliveGain.disconnect(); } catch (e) {}
            keepAliveGain = null;
        }
        if (audioCtx) {
            try { await audioCtx.close(); } catch (e) {}
            audioCtx = null;
        }
        syncRunStopButtons(false);
        
        // Reset Live Telemetry
        const vuLevelEl = document.getElementById('rta-vu-level');
        const vuPeakLineEl = document.getElementById('rta-vu-peak-line');
        const vuValEl = document.getElementById('rta-vu-val');
        const vuClipEl = document.getElementById('rta-vu-clip');
        const peakValEl = document.getElementById('rta-peak-val');
        const domFreqEl = document.getElementById('rta-dom-val');
        const ribbonSplEl = document.getElementById('rta-ribbon-spl-val');
        if (vuLevelEl) vuLevelEl.style.width = '0%';
        if (vuPeakLineEl) vuPeakLineEl.style.left = '0%';
        if (vuValEl) vuValEl.textContent = '-∞ dBFS';
        if (vuClipEl) vuClipEl.style.display = 'none';
        if (peakValEl) peakValEl.textContent = '-∞ dB';
        if (domFreqEl) domFreqEl.textContent = '--- Hz';
        if (ribbonSplEl) ribbonSplEl.textContent = `--.- dB${currentWeighting.toUpperCase()}`;
        crosshairState.active = false;

        // Reset Anti-Flicker Damped State
        splSmoothedDbfs = -100;
        splDisplayStr = '--.-';
        splDisplayCategory = 'safe';
        lastSplDisplayTick = 0;
        lockedDomFreq = 0;
        candidateDomFreq = 0;
        candidateDomDb = -120;
        candidateFirstSeen = 0;
        lastDomDisplayTick = 0;
        lastDomActiveTime = 0;
        domFreqDisplay = '--- Hz';
        peakSmoothedDb = -120;
        lastPeakDisplayTick = 0;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGridAndLabels();
    }
    window.stopAnalyzer = stopAnalyzer;

    function createRtaPinkNoise() {
        const bufferSize = 4096;
        const b = [0, 0, 0, 0, 0, 0, 0];
        let node;
        try {
            // Stereo 2-channel output so both Out 1 (L) and Out 2 (R) on USB interfaces (EVO4, Scarlett) receive Pink Noise
            node = audioCtx.createScriptProcessor(bufferSize, 1, 2);
        } catch (e) {
            node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
        }
        node.onaudioprocess = (e) => {
            const outL = e.outputBuffer.getChannelData(0);
            const outR = e.outputBuffer.numberOfChannels > 1 ? e.outputBuffer.getChannelData(1) : null;
            const len = outL.length;
            for (let i = 0; i < len; i++) {
                const white = Math.random() * 2 - 1;
                b[0] = 0.99886 * b[0] + white * 0.0555179;
                b[1] = 0.99332 * b[1] + white * 0.0750759;
                b[2] = 0.96900 * b[2] + white * 0.1538520;
                b[3] = 0.86650 * b[3] + white * 0.3104856;
                b[4] = 0.55000 * b[4] + white * 0.5329522;
                b[5] = -0.7616 * b[5] - white * 0.0168980;
                const sample = (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + white * 0.5362) * 0.11;
                b[6] = white * 0.115926;
                outL[i] = sample;
                if (outR) outR[i] = sample;
            }

            // Sync with Transfer Function engine virtual loopback reference
            if (window.TransferFunctionEngine && typeof window.TransferFunctionEngine.feedVirtualReference === 'function') {
                window.TransferFunctionEngine.feedVirtualReference(outL);
            }
        };
        return node;
    }

    async function toggleRtaPinkNoise() {
        const btn = document.getElementById('btn-rta-pink-noise');
        if (!btn) return;

        if (isRtaPinkNoiseActive) {
            // Turn off
            if (rtaPinkNoiseNode) {
                try { rtaPinkNoiseNode.onaudioprocess = null; rtaPinkNoiseNode.disconnect(); } catch(e){}
                rtaPinkNoiseNode = null;
            }
            if (rtaPinkNoiseAnalyserNode) {
                try { rtaPinkNoiseAnalyserNode.disconnect(); } catch(e){}
                rtaPinkNoiseAnalyserNode = null;
            }
            if (rtaPinkNoiseGainNode) {
                try { rtaPinkNoiseGainNode.disconnect(); } catch(e){}
                rtaPinkNoiseGainNode = null;
            }
            isRtaPinkNoiseActive = false;

            if (window.TransferFunctionEngine && typeof window.TransferFunctionEngine.setVirtualReferenceActive === 'function') {
                window.TransferFunctionEngine.setVirtualReferenceActive(false);
            }
            
            // Revert premium styling
            btn.classList.remove('active');
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.style.boxShadow = '';
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">volume_up</span> PLAY NOISE';
            const fsPinkBtn = document.getElementById('btn-rta-fs-pink-noise');
            if (fsPinkBtn) fsPinkBtn.classList.remove('active');
        } else {
            // Turn on: Ensure native iOS AVAudioSession routes directly to USB DAC (EVO 4)
            const audioPlugin = getAudioSessionPlugin();
            if (audioPlugin && typeof audioPlugin.configureAudioSession === 'function') {
                try {
                    const targetCat = isAnalyzing ? 'playAndRecord' : 'playback';
                    await audioPlugin.configureAudioSession({
                        category: targetCat,
                        mode: 'default'
                    });
                } catch (e) {}
            }

            try {
                if (!audioCtx || audioCtx.state === 'closed') {
                    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
                    audioCtx = new AudioCtxClass({ sampleRate: 48000, latencyHint: 'interactive' });
                }
            } catch (e) {
                try {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                } catch (e2) {
                    console.error("Failed to create AudioContext for RTA Pink Noise:", e2);
                    return;
                }
            }
            if (audioCtx.state === 'suspended') {
                try {
                    await audioCtx.resume();
                } catch (e) {
                    console.error("Failed to resume AudioContext for RTA Pink Noise:", e);
                }
            }

            // Ensure stereo destination channel count when supported by the USB interface
            try {
                if (audioCtx.destination && audioCtx.destination.maxChannelCount >= 2) {
                    audioCtx.destination.channelCount = 2;
                }
            } catch (e) {}

            // Sync output routing
            const savedOutput = safeStorage.getItem('soundengg-output-id') || 'default';
            if (savedOutput && savedOutput !== 'default' && typeof audioCtx.setSinkId === 'function') {
                try {
                    await audioCtx.setSinkId(savedOutput);
                } catch (err) {
                    console.warn("Failed to set output sink for RTA pink noise:", err);
                }
            }

            rtaPinkNoiseAnalyserNode = audioCtx.createAnalyser();
            rtaPinkNoiseAnalyserNode.fftSize = 2048;
            rtaPinkNoiseAnalyserNode.smoothingTimeConstant = 0;
            
            rtaPinkNoiseDataArray = new Float32Array(rtaPinkNoiseAnalyserNode.frequencyBinCount);
            rtaPinkNoiseSmoothedDataArray = new Float32Array(rtaPinkNoiseAnalyserNode.frequencyBinCount).fill(-100);

            rtaPinkNoiseGainNode = audioCtx.createGain();
            rtaPinkNoiseGainNode.gain.setValueAtTime(0.15, audioCtx.currentTime); // comfortable level

            rtaPinkNoiseNode = createRtaPinkNoise();
            rtaPinkNoiseNode.connect(rtaPinkNoiseAnalyserNode);
            rtaPinkNoiseAnalyserNode.connect(rtaPinkNoiseGainNode);
            rtaPinkNoiseGainNode.connect(audioCtx.destination);

            isRtaPinkNoiseActive = true;

            if (window.TransferFunctionEngine && typeof window.TransferFunctionEngine.setVirtualReferenceActive === 'function') {
                window.TransferFunctionEngine.setVirtualReferenceActive(true);
            }

            // Apply active premium visual glow
            btn.classList.add('active');
            btn.style.background = 'var(--primary)';
            btn.style.borderColor = 'var(--primary)';
            btn.style.color = 'var(--surface)';
            btn.style.boxShadow = '0 0 15px var(--primary)';
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">volume_up</span> STOP NOISE';
            const fsPinkBtn = document.getElementById('btn-rta-fs-pink-noise');
            if (fsPinkBtn) fsPinkBtn.classList.add('active');
        }
    }

    function getSPLColor(db) {
        const val = db + calibrationOffset;
        if (val > 105) return '#E24B4A'; // Red
        if (val > 95) return '#D85A30'; // Orange
        if (val > 85) return '#639922'; // Green
        if (val > 70) return '#378ADD'; // Light Blue
        return '#14A7B5'; // Turquoise
    }

    function draw(timestamp) {
        if (!isAnalyzing || !isInitialized) {
            rafID = null;
            return;
        }

        // Auto-recover if audio context was suspended or interrupted in background
        if (audioCtx && audioCtx.state !== 'running' && audioCtx.state !== 'closed') {
            audioCtx.resume().catch(() => {});
        }

        if (canvas && (canvas.width === 0 || canvas.height === 0)) {
            syncRtaCanvasSize();
        }

        rafID = requestAnimationFrame(draw);

        if (!timestamp) timestamp = performance.now();
        const elapsed = timestamp - lastFrameTime;
        const frameInterval = 1000 / 60; // 60 FPS target (~16.67ms)

        if (elapsed < frameInterval) {
            return; // Skip rendering this frame to maintain 60 FPS target
        }
        
        lastFrameTime = timestamp - (elapsed % frameInterval);
        
        // 1. Fetch real-time time-domain samples (with ScriptProcessor active-pull fallback for iOS/iPadOS WebKit)
        analyser.getFloatTimeDomainData(timeData);
        if (latestScriptTimeData) {
            let hasSignal = false;
            for (let i = 0; i < timeData.length; i += 8) {
                if (timeData[i] !== 0) {
                    hasSignal = true;
                    break;
                }
            }
            if (!hasSignal) {
                timeData.set(latestScriptTimeData);
            }
        }
        
        // 2. High-Precision Real FFT with Selected Window & Coherent Gain Calibration
        try {
            computeCustomFFT(timeData, currentWindow, windowTables, dataArray);
        } catch (fftErr) {
            // Fallback safety to Web Audio built-in FFT if custom routine throws
            analyser.getFloatFrequencyData(dataArray);
        }

        // 3. Apply Averaging / Smoothing
        const alpha = 1 / (averagingFactor + 1);
        for (let i = 0; i < bufferLength; i++) {
            // Clamp data to a reasonable floor to avoid -Infinity issues in rendering
            if (dataArray[i] < -120) dataArray[i] = -120;
            
            smoothedDataArray[i] = (dataArray[i] * alpha) + (smoothedDataArray[i] * (1 - alpha));
            
            // Apply Mic Calibration Correction if enabled
            let calCorr = (calEnabled && calOffsets && calOffsets[i]) ? calOffsets[i] : 0;
            dataArray[i] = smoothedDataArray[i] + calCorr;
        }

        // Apply Averaging / Smoothing to Pink Noise if active
        if (isRtaPinkNoiseActive && rtaPinkNoiseAnalyserNode) {
            rtaPinkNoiseAnalyserNode.getFloatFrequencyData(rtaPinkNoiseDataArray);
            for (let i = 0; i < bufferLength; i++) {
                if (rtaPinkNoiseDataArray[i] < -120) rtaPinkNoiseDataArray[i] = -120;
                rtaPinkNoiseSmoothedDataArray[i] = (rtaPinkNoiseDataArray[i] * alpha) + (rtaPinkNoiseSmoothedDataArray[i] * (1 - alpha));
            }
        }

        if (currentMode !== 'waterfall') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const isLight = document.documentElement.classList.contains('light');
            ctx.fillStyle = isLight ? '#F0F2F5' : '#030508';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Rolling 1-second SPL History Accumulator (IEC 61672 Leq tracking)
        if (!lastSplHistoryTick) lastSplHistoryTick = timestamp;
        if (timestamp - lastSplHistoryTick >= 1000) {
            lastSplHistoryTick = timestamp;
            const curSpl = (splSmoothedDbfs > -118) ? Math.max(25, splSmoothedDbfs + calibrationOffset) : 35;
            const curPeakSpl = (inputPeakDbfs > -118) ? Math.max(curSpl, inputPeakDbfs + calibrationOffset) : curSpl;
            splHistoryData.push({ time: Date.now(), spl: curSpl, peak: curPeakSpl });
            if (splHistoryData.length > 60) {
                splHistoryData.shift();
            }
        }

        let specLeft = 0;
        let specTop = (currentMode !== 'waterfall' && currentMode !== 'tf') ? (isFullscreenActive ? 60 : 10) : 0;
        let specWidth = canvas.width;
        let specHeight = (currentMode !== 'waterfall' && currentMode !== 'tf')
            ? Math.max(100, canvas.height - 26 - specTop)
            : canvas.height;

        const isDualView = (currentLayout === 'spl_history' && currentMode !== 'waterfall');

        if (isDualView) {
            // Side-by-Side Dual-View Console Layout (Left 64%: Spectrum, Right 36%: SPL History)
            // Always keep side-by-side in fullscreen landscape / dual-view console; never switch to portrait stacked
            specWidth = Math.round(canvas.width * 0.64);
            const splLeft = specWidth;
            const splWidth = canvas.width - splLeft;
            drawSplHistoryTimeline(splLeft, 0, splWidth, canvas.height);

            // Vertical dividing border between Spectrum and SPL History
            ctx.save();
            ctx.strokeStyle = document.documentElement.classList.contains('light') ? 'rgba(0,0,0,0.15)' : 'rgba(0, 240, 255, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(splLeft, 0);
            ctx.lineTo(splLeft, canvas.height);
            ctx.stroke();
            ctx.restore();
        }
        
        if (currentMode === 'rta') {
            drawRTA(specTop, specHeight, specLeft, specWidth);
        } else if (currentMode === 'fft') {
            drawFFT(specTop, specHeight, specLeft, specWidth);
        } else if (currentMode === 'waterfall') {
            drawWaterfall();
        } else if (currentMode === 'tf') {
            drawTransferFunction(specTop, specHeight, specLeft, specWidth);
        }

        // Update telemetry right after currentRtaLevels & FFT are calculated so HUD and Peak Pin are 100% synchronized
        try {
            updateTelemetry();
        } catch (telErr) {
            console.warn("RTA telemetry update warning:", telErr);
        }

        if (currentMode !== 'waterfall' && currentMode !== 'tf') {
            drawGridAndLabels(specTop, specHeight, specLeft, specWidth);
            if (showDominantWatermark) {
                drawDominantOverlay(specTop, specLeft, specWidth);
            }
            if (showSplWatermark) {
                drawSplWatermarkOverlay(specTop, specLeft, specWidth);
            }
            drawPeakFlagMarker(specTop, specHeight, specLeft, specWidth);
        }
        drawInputTelemetryBadge(specTop, specLeft);
        try {
            drawInteractiveCrosshair(specTop, specHeight, specLeft, specWidth);
        } catch (xhairErr) {}
    }

    function drawInputTelemetryBadge(specTop = 0, specLeft = 0) {
        ctx.save();
        const isLight = document.documentElement.classList.contains('light');
        const badgeY = isFullscreenActive ? 16 : (specTop + 8);
        const badgeX = specLeft + (isFullscreenActive ? 68 : 46); // Leave room for Close button in FS and Y-axis dB labels in inline mode
        
        // Check if there is an active disconnect alert banner
        if (disconnectAlertMessage) {
            ctx.fillStyle = 'rgba(255, 59, 48, 0.95)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.font = "bold 11px 'Space Grotesk', monospace";
            const alertW = ctx.measureText(disconnectAlertMessage).width + 20;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(badgeX, badgeY, alertW, 22, 4);
            } else {
                ctx.rect(badgeX, badgeY, alertW, 22);
            }
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(disconnectAlertMessage, badgeX + 10, badgeY + 11);
            ctx.restore();
            return;
        }

        if (!isAnalyzing) {
            ctx.restore();
            return;
        }

        // Normal Hardware Audio Input Telemetry Badge
        let label = '';
        let badgeColor = isLight ? '#008B9F' : '#00f2fe';
        let badgeBg = isLight ? 'rgba(0, 139, 159, 0.15)' : 'rgba(0, 242, 254, 0.12)';
        
        if (activeInputDevice.isBluetooth) {
            label = `⚠️ BT MIC (BAND-LIMITED <8k): ${activeInputDevice.label}`;
            badgeColor = '#ef4444';
            badgeBg = isLight ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.2)';
        } else if (activeInputDevice.isExternal) {
            label = `● USB: ${activeInputDevice.label} (${Math.round(activeInputDevice.sampleRate / 1000)}k)`;
            badgeColor = isLight ? '#008B9F' : '#00f2fe';
            badgeBg = isLight ? 'rgba(0, 139, 159, 0.15)' : 'rgba(0, 242, 254, 0.12)';
        } else {
            label = `● BUILT-IN MIC (${Math.round(activeInputDevice.sampleRate / 1000)}k)`;
            badgeColor = '#FFB800';
            badgeBg = isLight ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 184, 0, 0.18)';
        }
        
        ctx.font = "bold 10px 'Space Grotesk', monospace";
        const textW = ctx.measureText(label).width + 16;
        const badgeH = 20;

        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(badgeX, badgeY, textW, badgeH, 4);
        } else {
            ctx.rect(badgeX, badgeY, textW, badgeH);
        }
        ctx.fillStyle = badgeBg;
        ctx.fill();
        ctx.strokeStyle = badgeColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = badgeColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, badgeX + 8, badgeY + 10);

        // Zoom Reset Indicator Badge if zoomed
        if (isFrequencyZoomed) {
            const zoomX = badgeX + textW + 8;
            const zoomLabel = `🔍 ${viewMinFreq}Hz-${viewMaxFreq >= 1000 ? (viewMaxFreq/1000).toFixed(1)+'k' : viewMaxFreq}Hz [RESET]`;
            const zoomW = ctx.measureText(zoomLabel).width + 16;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(zoomX, badgeY, zoomW, badgeH, 4);
            } else {
                ctx.rect(zoomX, badgeY, zoomW, badgeH);
            }
            ctx.fillStyle = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';
            ctx.fill();
            ctx.strokeStyle = isLight ? '#0f172a' : '#ffffff';
            ctx.stroke();
            ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
            ctx.fillText(zoomLabel, zoomX + 8, badgeY + 10);
        }

        ctx.restore();
    }

    function drawGridAndLabels(specTop = 0, specHeight = canvas.height, specLeft = 0, specWidth = canvas.width) {
        const isLight = document.documentElement.classList.contains('light');
        const gridColor = isLight ? 'rgba(0, 139, 159, 0.22)' : 'rgba(0, 242, 254, 0.18)';
        const textColor = isLight ? '#007A8C' : '#00f2fe';

        ctx.save();
        ctx.textAlign = 'right';
        ctx.font = "12px 'Space Grotesk', sans-serif";
        ctx.lineWidth = 0.5;

        // Fixed 0 to 100 dB SPL vertical display scale so adjusting Calibration Offset visibly raises/lowers the curve
        const minDisplayDB = 0;
        const maxDisplayDB = 100;
        const bottomY = specTop + specHeight;

        const labelX = specLeft + 35;
        const lineStartX = specLeft + 40;
        const lineEndX = specLeft + specWidth;

        for (let displayDB = minDisplayDB; displayDB <= maxDisplayDB; displayDB += 10) {
            const y = bottomY - displayDB * (specHeight / 100);

            if (y < specTop - 1 || y > bottomY + 1) continue;

            // Draw Grid Line
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = gridColor;
            ctx.moveTo(lineStartX, y);
            ctx.lineTo(lineEndX, y);
            ctx.stroke();

            // Draw Label (clamp top and bottom labels so 100 and 0 are never clipped)
            ctx.fillStyle = textColor;
            const labelY = (y <= specTop + 6) ? (y + 9) : ((y >= bottomY - 4) ? (y - 3) : (y + 4));
            ctx.fillText(`${displayDB}`, labelX, labelY);
        }

        // Draw Vertical Frequency Grid Lines when in FFT Mode
        if (currentMode === 'fft') {
            const FREQ_TICKS = [20, 30, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000];
            const minF = viewMinFreq;
            const maxF = viewMaxFreq;
            const logRatio = Math.log10(maxF / minF);

            ctx.textAlign = 'center';
            ctx.font = "9px 'Space Grotesk', monospace";

            FREQ_TICKS.forEach(freq => {
                if (freq < minF || freq > maxF) return;
                const x = specLeft + (Math.log10(freq / minF) / logRatio) * specWidth;
                if (x < lineStartX || x > lineEndX - 8) return;

                const isMajor = [100, 250, 1000, 2500, 10000].includes(freq);

                ctx.beginPath();
                ctx.setLineDash(isMajor ? [4, 4] : [2, 6]);
                ctx.strokeStyle = isMajor 
                    ? (isLight ? 'rgba(0, 139, 159, 0.28)' : 'rgba(0, 242, 254, 0.22)')
                    : (isLight ? 'rgba(0, 139, 159, 0.12)' : 'rgba(0, 242, 254, 0.08)');
                ctx.moveTo(x, specTop);
                ctx.lineTo(x, bottomY);
                ctx.stroke();

                if (isMajor || isFrequencyZoomed) {
                    const freqText = freq >= 1000 ? (freq % 1000 === 0 ? (freq / 1000) + 'k' : (freq / 1000).toFixed(1) + 'k') : freq;
                    ctx.fillStyle = isLight ? '#64748b' : 'rgba(255, 255, 255, 0.45)';
                    ctx.fillText(freqText, x, bottomY - 4);
                }
            });
        }
        ctx.setLineDash([]);
        ctx.restore();
    }

    // --- 60-Second Rolling SPL Exposure Timeline (Adaptive Side-by-Side or Stacked) ---
    function drawSplHistoryTimeline(startX = 0, top = 0, totalWidth = canvas.width, height = canvas.height) {
        ctx.save();
        const isLight = document.documentElement.classList.contains('light');
        ctx.fillStyle = isLight ? 'rgba(235, 240, 245, 0.96)' : 'rgba(5, 9, 16, 0.96)';
        ctx.fillRect(startX, top, totalWidth, height);

        const padLeft = 45;
        const padRight = 15;
        const padTop = 30;
        const padBottom = 26;
        const chartW = Math.max(80, totalWidth - padLeft - padRight);
        const chartH = Math.max(60, height - padTop - padBottom);

        const minSpl = 20;
        const maxSpl = 120;
        const splToY = (val) => {
            const clamped = Math.max(minSpl, Math.min(maxSpl, val));
            const pct = (clamped - minSpl) / (maxSpl - minSpl);
            return (top + padTop + chartH) - (pct * chartH);
        };

        // Horizontal Guidelines (40, 60, 85, 95, 105 dB)
        ctx.lineWidth = 1;
        ctx.font = "10px 'Space Grotesk', monospace";
        ctx.textAlign = 'right';

        [40, 60, 85, 95, 105].forEach(level => {
            const y = splToY(level);
            ctx.beginPath();
            if (level === splLimitThreshold) {
                ctx.strokeStyle = 'rgba(255, 59, 48, 0.6)';
                ctx.setLineDash([4, 2]);
                ctx.fillStyle = '#ff3b30';
            } else if (level === 85) {
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
                ctx.setLineDash([3, 3]);
                ctx.fillStyle = '#f59e0b';
            } else {
                ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.1)';
                ctx.setLineDash([2, 4]);
                ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
            }
            ctx.moveTo(startX + padLeft, y);
            ctx.lineTo(startX + padLeft + chartW, y);
            ctx.stroke();
            ctx.fillText(`${level}dB`, startX + padLeft - 6, y + 3);
        });
        ctx.setLineDash([]);

        // Threshold limit annotation
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 59, 48, 0.85)';
        ctx.font = "bold 10px 'Space Grotesk', monospace";
        ctx.fillText(`LIMIT: ${splLimitThreshold} dB`, startX + padLeft + 6, splToY(splLimitThreshold) - 4);

        // Matching 26px footer bar for SPL History Timeline aligned with frequency labels bar
        ctx.fillStyle = isLight ? 'rgba(235, 240, 245, 0.98)' : 'rgba(2, 2, 4, 0.92)';
        ctx.fillRect(startX, top + height - 26, totalWidth, 26);
        ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(20, 167, 181, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, top + height - 26);
        ctx.lineTo(startX + totalWidth, top + height - 26);
        ctx.stroke();

        // Timeline labels (-60s, -45s, -30s, -15s, NOW)
        ctx.fillStyle = isLight ? '#475569' : '#64748b';
        ctx.font = "9px 'Space Grotesk', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        [60, 45, 30, 15, 0].forEach(sec => {
            const x = startX + padLeft + ((60 - sec) / 60) * chartW;
            ctx.fillText(sec === 0 ? 'NOW' : `-${sec}s`, x, top + height - 13);
        });
        ctx.textBaseline = 'alphabetic';

        // Draw Rolling SPL Curve
        const count = splHistoryData.length;
        let sumLin = 0;
        let maxPk = 0;
        let latestSpl = (splSmoothedDbfs > -118) ? Math.max(25, splSmoothedDbfs + calibrationOffset) : 35;

        if (count > 0) {
            ctx.beginPath();
            const curveStartX = startX + padLeft + ((60 - count) / 60) * chartW;
            
            for (let i = 0; i < count; i++) {
                const pt = splHistoryData[i];
                const x = curveStartX + (i / 60) * chartW;
                const y = splToY(pt.spl);
                sumLin += Math.pow(10, pt.spl / 10);
                if (pt.peak > maxPk) maxPk = pt.peak;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            // Connect to latest current level at NOW
            const nowX = startX + padLeft + chartW;
            const nowY = splToY(latestSpl);
            ctx.lineTo(nowX, nowY);

            const leq60 = 10 * Math.log10(sumLin / count);
            const strokeColor = leq60 >= splLimitThreshold ? '#ff3b30' : (leq60 >= 93 ? '#ff8c00' : (leq60 >= 85 ? '#eab308' : '#10b981'));
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2.0;
            ctx.stroke();

            // Gradient fill under curve
            ctx.lineTo(nowX, top + padTop + chartH);
            ctx.lineTo(curveStartX, top + padTop + chartH);
            ctx.closePath();
            ctx.fillStyle = leq60 >= splLimitThreshold ? 'rgba(239, 68, 68, 0.15)' : (leq60 >= 93 ? 'rgba(255, 140, 0, 0.12)' : 'rgba(16, 185, 129, 0.10)');
            ctx.fill();

            // Haptic trigger on limit breach (throttled to at most once every 6 seconds)
            if (leq60 >= splLimitThreshold || latestSpl >= splLimitThreshold) {
                const now = performance.now();
                if (now - lastHapticAlertTick > 6000) {
                    lastHapticAlertTick = now;
                    if (typeof window.triggerHaptic === 'function') {
                        window.triggerHaptic('warning');
                    }
                }
            }

            // Header Metrics Readout (Adaptive to column width)
            ctx.font = "bold 10px 'Space Grotesk', monospace";
            ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
            ctx.textAlign = 'left';

            if (totalWidth < 380) {
                // Compact Header for narrower side panels
                ctx.fillText(`60s SPL`, startX + padLeft + 4, top + 18);
                ctx.fillStyle = '#00f2fe';
                ctx.fillText(`L:${latestSpl.toFixed(0)}`, startX + padLeft + 68, top + 18);
                ctx.fillStyle = strokeColor;
                ctx.fillText(`Leq:${leq60.toFixed(0)}`, startX + padLeft + 120, top + 18);
                ctx.fillStyle = maxPk >= splLimitThreshold ? '#ff3b30' : '#f59e0b';
                ctx.fillText(`PK:${maxPk.toFixed(0)}`, startX + padLeft + 180, top + 18);
            } else {
                ctx.fillText(`60s SPL HISTORY`, startX + padLeft + 6, top + 18);
                ctx.fillStyle = '#00f2fe';
                ctx.fillText(`LIVE: ${latestSpl.toFixed(1)} dB`, startX + padLeft + 120, top + 18);
                ctx.fillStyle = strokeColor;
                ctx.fillText(`LAeq: ${leq60.toFixed(1)} dB`, startX + padLeft + 225, top + 18);
                ctx.fillStyle = maxPk >= splLimitThreshold ? '#ff3b30' : '#f59e0b';
                ctx.fillText(`MAX PK: ${maxPk.toFixed(1)} dB`, startX + padLeft + 335, top + 18);
            }
        } else {
            ctx.font = "11px 'Space Grotesk', monospace";
            ctx.fillStyle = isLight ? '#64748b' : '#64748b';
            ctx.textAlign = 'left';
            ctx.fillText(`60s SPL (Buffering...)`, startX + padLeft + 6, top + 18);
        }

        ctx.restore();
    }

    // --- Dual-Channel FFT Transfer Function Visualizer (Magnitude, Coherence & Phase) ---
    function drawTransferFunction(specTop = 0, specHeight = canvas.height) {
        const tf = window.TransferFunctionEngine;
        if (!tf) return;

        // Auto-start TransferFunctionEngine if not running and not currently starting (with 3s error backoff)
        if (!tf.isRunning && !tf.isStarting && isAnalyzing && (!tf.lastStartErrorTime || (Date.now() - tf.lastStartErrorTime > 3000))) {
            tf.start();
        }

        ctx.save();
        const isLight = document.documentElement.classList.contains('light');
        ctx.fillStyle = isLight ? '#f8fafc' : '#030812';
        ctx.fillRect(0, specTop, canvas.width, specHeight);

        // Safe insets to prevent top controls (Close/Fullscreen) and bottom HUD dock from overlapping curves
        const topSafePad = isFullscreenActive ? 56 : 4;
        const bottomSafePad = isFullscreenActive ? 68 : 6;
        const effSpecTop = specTop + topSafePad;
        const effSpecHeight = Math.max(120, specHeight - topSafePad - bottomSafePad);

        // Layout Split:
        // Upper 58%: Magnitude Response (dB) & Coherence (0-100%)
        // Divider 22px: Telemetry readout strip
        // Lower 42%: Phase Response (-180° to +180°)
        const dividerHeight = 22;
        const magHeight = Math.round((effSpecHeight - dividerHeight) * 0.58);
        const phaseTop = effSpecTop + magHeight + dividerHeight;
        const phaseHeight = effSpecHeight - (magHeight + dividerHeight);

        const padLeft = 46;
        const padRight = 15;
        const plotWidth = canvas.width - padLeft - padRight;

        const minFreq = 20;
        const maxFreq = 20000;
        const logRange = Math.log10(maxFreq / minFreq);

        function getX(freq) {
            const clamped = Math.max(minFreq, Math.min(maxFreq, freq));
            const norm = Math.log10(clamped / minFreq) / logRange;
            return padLeft + norm * plotWidth;
        }

        // ==========================================
        // 1. MAGNITUDE RESPONSE GRID & DISPLAY (-30dB to +15dB)
        // ==========================================
        const minMagDb = -30.0;
        const maxMagDb = 15.0;
        const magSpan = maxMagDb - minMagDb; // 45 dB

        function getMagY(db) {
            const clamped = Math.max(minMagDb, Math.min(maxMagDb, db));
            const norm = (clamped - minMagDb) / magSpan;
            return effSpecTop + magHeight - (norm * magHeight);
        }

        // Magnitude dB Grid Lines (every 6 dB)
        ctx.lineWidth = 0.6;
        ctx.textAlign = 'right';
        ctx.font = "10px 'Space Grotesk', monospace";

        const magGridDbs = [12, 6, 0, -6, -12, -18, -24, -30];
        for (const db of magGridDbs) {
            const y = getMagY(db);
            const isZero = (db === 0);

            ctx.strokeStyle = isZero ? 
                (isLight ? 'rgba(0, 139, 159, 0.7)' : 'rgba(0, 240, 255, 0.6)') : 
                (isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)');
            ctx.setLineDash(isZero ? [6, 4] : [2, 4]);

            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(canvas.width - padRight, y);
            ctx.stroke();

            ctx.fillStyle = isZero ? (isLight ? '#008B9F' : '#00f2fe') : (isLight ? '#64748b' : '#94a3b8');
            ctx.fillText(`${db > 0 ? '+' : ''}${db} dB`, padLeft - 6, y + 3);
        }
        ctx.setLineDash([]);

        // Vertical Logarithmic Frequency Grid Lines across both plots
        const freqGrid = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 0.5;
        for (const f of freqGrid) {
            const x = getX(f);
            ctx.beginPath();
            ctx.moveTo(x, specTop);
            ctx.lineTo(x, specTop + specHeight);
            ctx.stroke();
        }

        // --- Optional Ghost Dual-RTA Spectrum Overlays (Measurement Mic & Reference Input) ---
        if (tf.showRtaOverlay) {
            function getRtaSpecY(dbfs) {
                const clamped = Math.max(-80.0, Math.min(0.0, dbfs));
                const norm = (clamped - (-80.0)) / 80.0;
                return effSpecTop + magHeight - (norm * magHeight);
            }

            const measData = (tf.smoothingFraction > 0) ? tf.measSpectrumSmoothed : tf.measSpectrumDb;
            const refData = (tf.smoothingFraction > 0) ? tf.refSpectrumSmoothed : tf.refSpectrumDb;

            // 1. Ghost RTA Spectrum: Measurement Mic (Neon Green)
            if (measData && measData.length > 0 && tf.measPeakDbfs > -80) {
                ctx.beginPath();
                ctx.strokeStyle = isLight ? 'rgba(5, 150, 105, 0.45)' : 'rgba(0, 255, 157, 0.42)';
                ctx.lineWidth = 1.3;
                let firstMeas = true;
                for (let k = 1; k < tf.freqs.length; k++) {
                    const f = tf.freqs[k];
                    if (f < minFreq || f > maxFreq) continue;
                    const x = getX(f);
                    const y = getRtaSpecY(measData[k]);
                    if (firstMeas) { ctx.moveTo(x, y); firstMeas = false; }
                    else { ctx.lineTo(x, y); }
                }
                ctx.stroke();
            }

            // 2. Ghost RTA Spectrum: Reference Input / Virtual Loopback (Hot Pink)
            if (refData && refData.length > 0 && tf.refPeakDbfs > -80) {
                ctx.beginPath();
                ctx.strokeStyle = isLight ? 'rgba(225, 29, 72, 0.45)' : 'rgba(255, 46, 147, 0.42)';
                ctx.lineWidth = 1.3;
                let firstRef = true;
                for (let k = 1; k < tf.freqs.length; k++) {
                    const f = tf.freqs[k];
                    if (f < minFreq || f > maxFreq) continue;
                    const x = getX(f);
                    const y = getRtaSpecY(refData[k]);
                    if (firstRef) { ctx.moveTo(x, y); firstRef = false; }
                    else { ctx.lineTo(x, y); }
                }
                ctx.stroke();
            }
        }

        const hasValidRef = (typeof tf.hasValidReference === 'boolean') ? tf.hasValidReference : true;

        if (!hasValidRef) {
            // Smaart-grade No-Reference Banner in Magnitude Plot
            const bannerH = 44;
            const bannerY = effSpecTop + Math.round(magHeight * 0.44);
            ctx.fillStyle = isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 59, 48, 0.12)';
            ctx.fillRect(padLeft + 10, bannerY - (bannerH / 2), plotWidth - 20, bannerH);
            ctx.strokeStyle = isLight ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 59, 48, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(padLeft + 10, bannerY - (bannerH / 2), plotWidth - 20, bannerH);

            ctx.font = "bold 11px 'Space Grotesk', monospace";
            ctx.fillStyle = isLight ? '#dc2626' : '#ff453a';
            ctx.textAlign = 'center';
            const hintMsg = (tf.isVirtualLoopback || !tf.hasTwoChannels) ?
                "● NO REFERENCE SIGNAL — START PINK NOISE FOR TRANSFER FUNCTION" :
                "● NO REFERENCE DETECTED ON CH 2 — CONNECT CONSOLE/DAW REFERENCE FEED";
            ctx.fillText(hintMsg, padLeft + (plotWidth / 2), bannerY - 3);

            ctx.font = "9px 'Space Grotesk', monospace";
            ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
            ctx.fillText("Transfer Function requires an active reference signal (Tap 'PLAY NOISE' in drawer or toolbar)", padLeft + (plotWidth / 2), bannerY + 12);
        } else {
            // --- Plot Coherence Curve (0% to 100%, overlay top 28% of mag display) ---
            if (tf.coherence && tf.coherence.length > 0) {
                ctx.beginPath();
                ctx.strokeStyle = isLight ? 'rgba(217, 70, 239, 0.85)' : 'rgba(232, 121, 249, 0.85)';
                ctx.lineWidth = 1.2;
                const cohH = magHeight * 0.28;
                const cohBaseY = effSpecTop + cohH;

                let firstCoh = true;
                for (let k = 1; k < tf.freqs.length; k++) {
                    const f = tf.freqs[k];
                    if (f < minFreq || f > maxFreq) continue;
                    const x = getX(f);
                    const coh = tf.coherence[k];
                    const y = cohBaseY - (coh * cohH);
                    if (firstCoh) { ctx.moveTo(x, y); firstCoh = false; }
                    else { ctx.lineTo(x, y); }
                }
                ctx.stroke();
            }

            // --- Plot Primary Magnitude Response Curve (Bold Foreground) ---
            const magData = (tf.smoothingFraction > 0) ? tf.magnitudeSmoothed : tf.magnitude;
            if (magData && magData.length > 0) {
                ctx.beginPath();
                ctx.strokeStyle = isLight ? '#0284c7' : '#00FF9D';
                ctx.lineWidth = 2.2;
                ctx.shadowColor = isLight ? 'transparent' : 'rgba(0, 255, 157, 0.5)';
                ctx.shadowBlur = isLight ? 0 : 8;

                let firstMag = true;
                for (let k = 1; k < tf.freqs.length; k++) {
                    const f = tf.freqs[k];
                    if (f < minFreq || f > maxFreq) continue;
                    const x = getX(f);
                    const y = getMagY(magData[k]);
                    if (firstMag) { ctx.moveTo(x, y); firstMag = false; }
                    else { ctx.lineTo(x, y); }
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }

        // Title on Left
        ctx.font = "bold 11px 'Space Grotesk', monospace";
        ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`TRANSFER FUNCTION (H1 MAGNITUDE)`, padLeft + 8, effSpecTop + 14);

        // Pro Legend on Right: [● H1 MAG] [● CH1 MIC] [● CH2 REF] [● COH]
        const legY = effSpecTop + 14;
        const rEdge = canvas.width - padRight - 6;
        ctx.font = "bold 9px 'Space Grotesk', monospace";
        ctx.textAlign = 'right';

        ctx.fillStyle = isLight ? '#c026d3' : '#e879f9';
        ctx.fillText('● COH', rEdge, legY);

        ctx.fillStyle = '#FF2E93';
        ctx.fillText('● CH2 REF', rEdge - 55, legY);

        ctx.fillStyle = isLight ? '#059669' : '#10B981';
        ctx.fillText('● CH1 MIC', rEdge - 130, legY);

        ctx.fillStyle = isLight ? '#0284c7' : '#00FF9D';
        ctx.fillText('● H1 MAG', rEdge - 205, legY);

        // ==========================================
        // 2. CENTER DIVIDER & FREQUENCY AXIS STRIP
        // ==========================================
        const divY = effSpecTop + magHeight;
        ctx.fillStyle = isLight ? 'rgba(226, 232, 240, 0.95)' : 'rgba(10, 16, 28, 0.95)';
        ctx.fillRect(0, divY, canvas.width, dividerHeight);

        ctx.strokeStyle = isLight ? 'rgba(0, 139, 159, 0.4)' : 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, divY);
        ctx.lineTo(canvas.width, divY);
        ctx.moveTo(0, divY + dividerHeight);
        ctx.lineTo(canvas.width, divY + dividerHeight);
        ctx.stroke();

        // Frequency labels inside divider (Standard 10-Point ISO Reference)
        ctx.fillStyle = isLight ? '#008B9F' : '#00f2fe';
        ctx.font = (canvas.width < 450 ? "9px" : "10px") + " 'Space Grotesk', monospace";
        ctx.textAlign = 'center';
        const labelFreqs = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        const isNarrowCanvas = canvas.width < 450;
        for (const f of labelFreqs) {
            const x = getX(f);
            const str = (f >= 1000) ? 
                (f % 1000 === 0 ? `${f / 1000}k` : `${(f / 1000).toFixed(1)}k`) : 
                (f === 31.5 && isNarrowCanvas ? '31' : `${f}`);
            ctx.fillText(str, x, divY + 15);
        }

        // ==========================================
        // 3. PHASE RESPONSE GRID & DISPLAY (-180° to +180°)
        // ==========================================
        function getPhaseY(deg) {
            const clamped = Math.max(-180, Math.min(180, deg));
            const norm = (clamped + 180) / 360.0;
            return phaseTop + phaseHeight - (norm * phaseHeight);
        }

        // Phase Grid Lines (+180, +90, 0, -90, -180)
        const phaseGridDegs = [180, 90, 0, -90, -180];
        ctx.textAlign = 'right';
        ctx.font = "10px 'Space Grotesk', monospace";

        for (const deg of phaseGridDegs) {
            const y = getPhaseY(deg);
            const isZero = (deg === 0);

            ctx.strokeStyle = isZero ? 
                (isLight ? 'rgba(217, 119, 6, 0.7)' : 'rgba(255, 179, 0, 0.6)') : 
                (isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)');
            ctx.setLineDash(isZero ? [6, 4] : [2, 4]);

            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(canvas.width - padRight, y);
            ctx.stroke();

            ctx.fillStyle = isZero ? (isLight ? '#d97706' : '#FFB300') : (isLight ? '#64748b' : '#94a3b8');
            ctx.fillText(`${deg > 0 ? '+' : ''}${deg}°`, padLeft - 6, y + 3);
        }
        ctx.setLineDash([]);

        // --- Plot Phase Response Curve / Scatter with Coherence Blanking ---
        const phaseData = (tf.smoothingFraction > 0) ? tf.phaseSmoothed : tf.phase;
        if (hasValidRef && phaseData && phaseData.length > 0) {
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = isLight ? '#d97706' : '#FFB300';

            let lastX = -1;
            let lastY = -1;
            let inSegment = false;

            for (let k = 1; k < tf.freqs.length; k++) {
                const f = tf.freqs[k];
                if (f < minFreq || f > maxFreq) continue;

                const coh = tf.coherence[k];
                const isBlanked = tf.coherenceBlanking && (coh < tf.coherenceThreshold);
                const x = getX(f);
                const y = getPhaseY(phaseData[k]);

                if (isBlanked) {
                    inSegment = false;
                    continue;
                }

                // Check for phase wrap discontinuities (> 160° jump)
                if (inSegment && lastX >= 0) {
                    const diffY = Math.abs(y - lastY);
                    if (diffY > (phaseHeight * 0.45)) {
                        inSegment = false;
                    } else {
                        ctx.beginPath();
                        ctx.moveTo(lastX, lastY);
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    }
                }

                lastX = x;
                lastY = y;
                inSegment = true;
            }
        }

        // Badge in Phase plot
        ctx.font = "bold 11px 'Space Grotesk', monospace";
        ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
        ctx.textAlign = 'left';
        if (hasValidRef) {
            const cohPct = Math.round((tf.peakCoherence || 0) * 100);
            ctx.fillText(`PHASE RESPONSE (∠H1)  |  REF DELAY: ${tf.refDelayMs.toFixed(2)} ms  |  COH: ${cohPct}%`, padLeft + 8, phaseTop + 14);
        } else {
            ctx.fillText(`PHASE RESPONSE (∠H1)  |  WAITING FOR REFERENCE SIGNAL`, padLeft + 8, phaseTop + 14);
        }

        ctx.restore();
    }

    function drawIdleState(skipResize = false) {
        if (!canvas || isAnalyzing) return;
        if (!skipResize) {
            syncRtaCanvasSize(true);
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const isLight = document.documentElement.classList.contains('light');
        ctx.fillStyle = isLight ? '#F0F2F5' : '#030508';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const specLeft = 0;
        const specTop = isFullscreenActive ? 60 : 10;
        const bottomLabelReserve = isFullscreenActive ? 26 : 22;
        let specWidth = canvas.width;
        const specHeight = Math.max(80, canvas.height - bottomLabelReserve - specTop);

        const isDualView = (currentLayout === 'spl_history' && currentMode !== 'waterfall');
        if (isDualView) {
            specWidth = Math.round(canvas.width * 0.64);
            const splLeft = specWidth;
            const splWidth = canvas.width - splLeft;
            drawSplHistoryTimeline(splLeft, 0, splWidth, canvas.height);

            ctx.save();
            ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(0, 240, 255, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(splLeft, 0);
            ctx.lineTo(splLeft, canvas.height);
            ctx.stroke();
            ctx.restore();
        }

        drawGridAndLabels(specTop, specHeight, specLeft, specWidth);
        if (showDominantWatermark) {
            drawDominantOverlay(specTop, specLeft, specWidth);
        }
        if (showSplWatermark) {
            drawSplWatermarkOverlay(specTop, specLeft, specWidth);
        }
    }
    window.syncRtaIdleState = () => drawIdleState(false);

    function drawRTA(specTop = 0, specHeight = canvas.height, specLeft = 0, specWidth = canvas.width) {
        const freqs = currentOctaveFreqs;
        const numBands = freqs.length;
        const barWidth = specWidth / numBands;
        const sampleRate = audioCtx ? audioCtx.sampleRate : 48000;
        const nyquist = sampleRate / 2;
        const binHz = nyquist / bufferLength;
        const halfOctaveRatio = Math.pow(2, 1 / (2 * currentOctaveFraction));
        const bottomY = specTop + specHeight;

        const nowMs = performance.now();
        const dtSec = lastRtaDrawTimestamp > 0 ? Math.min(0.25, Math.max(0.001, (nowMs - lastRtaDrawTimestamp) / 1000)) : (1 / 60);
        lastRtaDrawTimestamp = nowMs;
        const isPastStartupMute = (nowMs - analyzerStartTime) >= 350;

        for (let i = 0; i < numBands; i++) {
            const centerFreq = freqs[i];
            const lowFreq = centerFreq / halfOctaveRatio;
            const highFreq = centerFreq * halfOctaveRatio;

            const lowBin = Math.max(1, Math.floor(lowFreq / binHz));
            const highBin = Math.min(bufferLength - 1, Math.ceil(highFreq / binHz));

            let db = -120;
            if (lowBin <= highBin) {
                if (currentBandMode === 'energy') {
                    // True Acoustic RMS Power Sum: sum of linear power across bins
                    let sumPower = 0;
                    for (let b = lowBin; b <= highBin; b++) {
                        sumPower += Math.pow(10, dataArray[b] / 10);
                    }
                    db = sumPower > 1e-12 ? 10 * Math.log10(sumPower) : -120;
                } else {
                    // Peak Bin Hold Mode: maximum bin in this fractional band
                    let maxB = -120;
                    for (let b = lowBin; b <= highBin; b++) {
                        if (dataArray[b] > maxB) maxB = dataArray[b];
                    }
                    db = maxB;
                }
            } else {
                // Low-frequency fallback interpolation (nearest bin)
                const nearestBin = Math.max(1, Math.min(bufferLength - 1, Math.round(centerFreq / binHz)));
                db = dataArray[nearestBin] !== undefined ? dataArray[nearestBin] : -120;
            }

            // Apply Frequency Weighting (IEC 61672 A, C, or Z/Flat)
            db += getIECWeighting(centerFreq, currentWeighting);

            // Apply Spectrum Tilt (1k Pivot)
            db += getTiltOffset(centerFreq);

            // Apply extra fine calibration correction to weighted RTA bands
            if (calEnabled) {
                db += getCalOffsetForFreq(centerFreq);
            }

            // Store in live levels array for crosshair tooltip tracking
            currentRtaLevels[i] = db;

            if (isPastStartupMute) {
                if (db >= peakData[i]) {
                    peakData[i] = db;
                    peakHoldTimestamps[i] = nowMs;
                } else if (averagingFactor < 7 && peakData[i] > -145) {
                    // Hold for 2.5s, then gentle decay (-1.5 dB/s) in FAST / SLOW modes; INFINITE (>= 7) stays frozen
                    if (nowMs - peakHoldTimestamps[i] > 2500) {
                        peakData[i] = Math.max(db, peakData[i] - (1.5 * dtSec));
                    }
                }
            }

            const x = specLeft + (i * barWidth);
            const w = Math.max(1, barWidth - (numBands > 100 ? 1 : 2));

            // --- Draw Multi-Snapshots (RTA) ---
            snapshots.forEach((snap, snapIdx) => {
                if (!snap || !snap.visible || !isSnapshotSlotUnlocked(snapIdx)) return;
                let snapDb = -100;
                if (snap.fraction === currentOctaveFraction && snap.rta && snap.rta[i] !== undefined) {
                    snapDb = snap.rta[i];
                } else if (snap.fft && snap.fft.length > 0) {
                    const bin = Math.max(0, Math.min(snap.fft.length - 1, Math.round(centerFreq / binHz)));
                    snapDb = snap.fft[bin] !== undefined ? snap.fft[bin] : -100;
                    snapDb += getIECWeighting(centerFreq, currentWeighting);
                    snapDb += getTiltOffset(centerFreq);
                }

                if (snapDb > -100) {
                    const snapH = Math.max(0, (snapDb + calibrationOffset) * (specHeight / 100));
                    ctx.fillStyle = snap.color + '22'; // 13% opacity
                    ctx.fillRect(x + 1, bottomY - snapH, w, snapH);

                    ctx.beginPath();
                    ctx.strokeStyle = snap.color;
                    ctx.globalAlpha = 0.6;
                    ctx.setLineDash([2, 2]);
                    ctx.moveTo(x, bottomY - snapH);
                    ctx.lineTo(x + barWidth, bottomY - snapH);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 1.0;
                }
            });

            if (isRtaPinkNoiseActive && rtaPinkNoiseAnalyserNode) {
                const hMic = Math.max(2, (db + calibrationOffset) * (specHeight / 100));

                // Draw Mic Input (Neon Green) as filled bars
                const isLight = document.documentElement.classList.contains('light');
                ctx.fillStyle = isLight ? 'rgba(5, 150, 105, 0.75)' : 'rgba(0, 255, 157, 0.75)';
                ctx.fillRect(x + 1, bottomY - hMic, w, hMic);

                ctx.strokeStyle = isLight ? '#059669' : '#00FF9D';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x + 1, bottomY - hMic, w, hMic);

                if (peakHoldEnabled) {
                    const ph = (peakData[i] + calibrationOffset) * (specHeight / 100);
                    if (ph > 2) {
                        ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)';
                        ctx.fillRect(x + 1, bottomY - ph - 2, w, 2);
                    }
                }
            } else {
                const h = Math.max(2, (db + calibrationOffset) * (specHeight / 100));
                ctx.fillStyle = getSPLColor(db);
                ctx.fillRect(x + 1, bottomY - h, w, h);

                if (peakHoldEnabled) {
                    const isLight = document.documentElement.classList.contains('light');
                    const ph = (peakData[i] + calibrationOffset) * (specHeight / 100);
                    if (ph > 2) {
                        ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)';
                        ctx.fillRect(x + 1, bottomY - ph - 2, w, 2);
                    }
                }
            }
        }
    }

    function drawFFT(specTop = 0, specHeight = canvas.height, specLeft = 0, specWidth = canvas.width) {
        const sampleRate = audioCtx ? audioCtx.sampleRate : 48000;
        const nyquist = sampleRate / 2;
        const bottomY = specTop + specHeight;
        const minF = viewMinFreq;
        const maxF = viewMaxFreq;
        const logRatio = Math.log10(maxF / minF);

        const freqToX = (f) => {
            if (f <= minF) return specLeft;
            if (f >= maxF) return specLeft + specWidth;
            return specLeft + (Math.log10(f / minF) / logRatio) * specWidth;
        };

        // --- Draw Multi-Snapshots (Curve) ---
        snapshots.forEach((snap, snapIdx) => {
            if (!snap || !snap.visible || !snap.fft || !isSnapshotSlotUnlocked(snapIdx)) return;
            ctx.beginPath();
            ctx.strokeStyle = snap.color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.7;
            ctx.setLineDash([4, 4]);
            let started = false;
            for (let i = 1; i < bufferLength; i++) {
                const freq = (i * nyquist) / bufferLength;
                if (freq < minF) continue;
                if (freq > maxF) break;
                let db = snap.fft[i] !== undefined ? snap.fft[i] : -100;
                db += getIECWeighting(freq, currentWeighting);
                db += getTiltOffset(freq);
                const x = freqToX(freq);
                const y = Math.min(bottomY, Math.max(specTop, bottomY - (db + calibrationOffset) * (specHeight / 100)));
                if (!started) {
                    ctx.moveTo(x, y);
                    started = true;
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
        });

        // 1. Live Spectrum Curve
        const isLight = document.documentElement.classList.contains('light');
        ctx.beginPath();
        ctx.strokeStyle = (isRtaPinkNoiseActive && rtaPinkNoiseAnalyserNode) ? 
            (isLight ? '#059669' : '#00FF9D') : '#14A7B5';
        ctx.lineWidth = (isRtaPinkNoiseActive && rtaPinkNoiseAnalyserNode) ? 2.0 : 1.6;

        let started = false;
        for (let i = 1; i < bufferLength; i++) {
            const freq = (i * nyquist) / bufferLength;
            if (freq < minF) continue;
            if (freq > maxF) break;
            let dbVal = dataArray[i];
            dbVal += getIECWeighting(freq, currentWeighting);
            dbVal += getTiltOffset(freq);
            const x = freqToX(freq);
            const y = Math.min(bottomY, Math.max(specTop, bottomY - (dbVal + calibrationOffset) * (specHeight / 100)));
            if (!started) {
                ctx.moveTo(x, y);
                started = true;
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    function formatDominantFreqLabel(freqVal) {
        if (!freqVal || freqVal <= 0) return '--- Hz';
        if (freqVal >= 1000) {
            return (freqVal % 1000 === 0 ? (freqVal / 1000) : (freqVal / 1000).toFixed(1).replace(/\.0$/, '')) + ' kHz';
        }
        return `${freqVal} Hz`;
    }

    function drawDominantOverlay(specTop = 0, specLeft = 0, specWidth = canvas.width) {
        if (!showDominantWatermark) return;
        ctx.save();
        const isLight = document.documentElement.classList.contains('light');
        const labelStr = (isAnalyzing && domFreqDisplay) ? domFreqDisplay : '--- Hz';

        const fontSize = (canvas.width < 500) ? 26 : 36;
        ctx.font = `bold ${fontSize}px 'Space Grotesk', sans-serif`;
        const textMetrics = ctx.measureText(labelStr);
        const textW = textMetrics.width;
        const textH = fontSize * 0.90;
        const centerX = specLeft + (specWidth / 2);
        const pillW = textW + 32;
        const pillH = textH + 14;
        const pillX = centerX - (pillW / 2);
        const pillY = isFullscreenActive ? 8 : Math.max(8, specTop + 4);
        const textY = pillY + textH + 3;

        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(pillX, pillY, pillW, pillH, 8);
        } else {
            ctx.rect(pillX, pillY, pillW, pillH);
        }
        ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(5, 10, 18, 0.84)';
        ctx.fill();
        ctx.strokeStyle = isLight ? 'rgba(0, 122, 140, 0.45)' : 'rgba(0, 242, 254, 0.40)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // High-Contrast Solid Dominant Text with Theme-Tailored Radiance
        ctx.textAlign = 'center';
        ctx.fillStyle = isLight ? '#007A8C' : '#00f2fe';
        ctx.shadowBlur = isLight ? 4 : 14;
        ctx.shadowColor = isLight ? 'rgba(0, 122, 140, 0.25)' : 'rgba(0, 242, 254, 0.75)';
        ctx.fillText(labelStr, centerX, textY);
        ctx.restore();
    }

    function drawSplWatermarkOverlay(specTop = 0, specLeft = 0, specWidth = canvas.width) {
        if (!showSplWatermark) return;
        ctx.save();
        const isLight = document.documentElement.classList.contains('light');
        const weight = (currentWeighting || 'a').toUpperCase();
        const activeSplStr = (isAnalyzing && splDisplayStr) ? splDisplayStr : '--.-';

        // WCAG AAA high-contrast colors for both Light & Dark themes
        let color, shadow, safetyTag, borderGlow;
        if (splDisplayCategory === 'safe') {
            color = isLight ? '#047857' : '#00FF9D';
            shadow = isLight ? 'rgba(4, 120, 87, 0.25)' : 'rgba(0, 255, 157, 0.75)';
            borderGlow = isLight ? 'rgba(4, 120, 87, 0.40)' : 'rgba(0, 255, 157, 0.45)';
            safetyTag = '● SAFE (<85)';
        } else if (splDisplayCategory === 'mix') {
            color = isLight ? '#B45309' : '#FFE600';
            shadow = isLight ? 'rgba(180, 83, 9, 0.25)' : 'rgba(255, 230, 0, 0.75)';
            borderGlow = isLight ? 'rgba(180, 83, 9, 0.40)' : 'rgba(255, 230, 0, 0.45)';
            safetyTag = '● LIVE MIX (85-92)';
        } else if (splDisplayCategory === 'caution') {
            color = isLight ? '#C2410C' : '#FF8C00';
            shadow = isLight ? 'rgba(194, 65, 12, 0.25)' : 'rgba(255, 140, 0, 0.75)';
            borderGlow = isLight ? 'rgba(194, 65, 12, 0.40)' : 'rgba(255, 140, 0, 0.45)';
            safetyTag = '▲ CAUTION (93-100)';
        } else if (splDisplayCategory === 'limit') {
            color = isLight ? '#B91C1C' : '#FF3B30';
            shadow = isLight ? 'rgba(185, 28, 28, 0.35)' : 'rgba(255, 59, 48, 0.85)';
            borderGlow = isLight ? 'rgba(185, 28, 28, 0.50)' : 'rgba(255, 59, 48, 0.6)';
            safetyTag = '■ VENUE LIMIT (>100)';
        } else {
            const flash = (Math.floor(Date.now() / 250) % 2 === 0);
            color = flash ? '#FF0055' : (isLight ? '#0f172a' : '#FFFFFF');
            shadow = 'rgba(255, 0, 85, 0.9)';
            borderGlow = '#FF0055';
            safetyTag = '⚠ CRITICAL NO-EXPOSURE (>115)';
        }

        const fontSize = (canvas.width < 450) ? 20 : 26;
        ctx.font = `bold ${fontSize}px 'Space Grotesk', sans-serif`;
        const textVal = `${activeSplStr} dB${weight}`;
        const mainW = ctx.measureText(textVal).width;
        
        ctx.font = "bold 9px 'Space Grotesk', monospace";
        const tagW = ctx.measureText(safetyTag).width;
        const boxW = Math.max(mainW, tagW) + 24;
        const boxH = fontSize + 20;

        const isDualView = (currentLayout === 'spl_history' && currentMode !== 'waterfall');
        let rightMargin = isFullscreenActive ? 16 : (isDualView ? 12 : 58); // Leave 58px in inline single-view for #btn-rta-fullscreen
        if (isFullscreenActive && !isDualView) {
            const drawerEl = document.getElementById('rta-fs-drawer');
            const wrapperEl = document.getElementById('rta-canvas-wrapper');
            if (drawerEl && drawerEl.classList.contains('open') && (!wrapperEl || !wrapperEl.classList.contains('drawer-docked'))) {
                const drawerWidth = drawerEl.offsetWidth || Math.min(340, Math.round(canvas.width * 0.42));
                rightMargin = drawerWidth + 14;
            }
        }
        const boxX = (specLeft + specWidth) - boxW - rightMargin;
        const boxY = isFullscreenActive ? 8 : Math.max(8, specTop + 4);

        // High-Contrast Translucent Backdrop Pill
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        } else {
            ctx.rect(boxX, boxY, boxW, boxH);
        }
        ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(5, 10, 18, 0.84)';
        ctx.fill();
        ctx.strokeStyle = borderGlow;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Render Values Inside Badge
        const textRight = boxX + boxW - 12;
        ctx.textAlign = 'right';
        ctx.font = `bold ${fontSize}px 'Space Grotesk', sans-serif`;
        ctx.fillStyle = color;
        ctx.shadowBlur = isLight ? 3 : 10;
        ctx.shadowColor = shadow;
        ctx.fillText(textVal, textRight, boxY + fontSize - 1);

        ctx.shadowBlur = 0;
        ctx.font = "bold 9px 'Space Grotesk', monospace";
        ctx.fillStyle = color;
        ctx.fillText(safetyTag, textRight, boxY + fontSize + 13);

        ctx.restore();
    }

    // --- Option 2: Floating Peak Pin / Flag (Anchored directly to highest peak on curve & 100% synced with Top-Center HUD) ---
    function drawPeakFlagMarker(specTop = 0, specHeight = canvas.height, specLeft = 0, specWidth = canvas.width) {
        if (!peakHoldEnabled) return;
        if (!isAnalyzing || domFreqDisplay === '--- Hz') {
            peakFlagAlpha = Math.max(0, peakFlagAlpha - 0.1);
            if (peakFlagAlpha <= 0) return;
        } else {
            peakFlagAlpha = Math.min(1.0, peakFlagAlpha + 0.18);
        }

        const bottomY = specTop + specHeight;
        const minF = viewMinFreq;
        const maxF = viewMaxFreq;
        const logRatio = Math.log10(maxF / minF);
        const freqToX = (f) => {
            if (f <= minF) return specLeft + 40;
            if (f >= maxF) return specLeft + specWidth - 15;
            return specLeft + (Math.log10(f / minF) / logRatio) * specWidth;
        };

        let targetX = -1;
        let targetY = -1;
        let peakFreq = currentPeakFreq || 1000;
        let peakDb = currentPeakDb || -60;

        if (currentMode === 'fft') {
            peakFreq = currentPeakFreq;
            peakDb = currentPeakDb;
            targetX = freqToX(peakFreq);
            targetY = Math.min(bottomY, Math.max(specTop + 24, bottomY - (peakDb + calibrationOffset) * (specHeight / 100)));
        } else if (currentMode === 'rta') {
            const freqs = currentOctaveFreqs || ISO_1_3_FREQS;
            const barWidth = specWidth / freqs.length;
            let activeIdx = (lockedRtaBandIdx >= 0 && lockedRtaBandIdx < freqs.length) ? lockedRtaBandIdx : -1;
            if (activeIdx < 0) {
                let maxRta = -120;
                for (let i = 0; i < currentRtaLevels.length; i++) {
                    if (currentRtaLevels[i] > maxRta) {
                        maxRta = currentRtaLevels[i];
                        activeIdx = i;
                    }
                }
            }
            if (activeIdx >= 0 && activeIdx < freqs.length) {
                peakFreq = freqs[activeIdx];
                peakDb = currentRtaLevels[activeIdx] !== undefined ? currentRtaLevels[activeIdx] : -60;
                targetX = specLeft + (activeIdx * barWidth) + (barWidth / 2);
                targetY = Math.min(bottomY, Math.max(specTop + 24, bottomY - (peakDb + calibrationOffset) * (specHeight / 100)));
            }
        }

        if (targetX < 0 || targetY < 0) return;

        // Smooth X/Y/dB tracking to prevent erratic jumping on pink noise
        if (peakFlagSmoothedX < 0) {
            peakFlagSmoothedX = targetX;
            peakFlagSmoothedY = targetY;
            peakFlagSmoothedDb = peakDb;
        } else {
            peakFlagSmoothedX += (targetX - peakFlagSmoothedX) * 0.28;
            peakFlagSmoothedY += (targetY - peakFlagSmoothedY) * 0.28;
            peakFlagSmoothedDb += (peakDb - peakFlagSmoothedDb) * 0.28;
        }

        const isLight = document.documentElement.classList.contains('light');
        const pinX = peakFlagSmoothedX;
        const pinY = Math.max(specTop + 26, Math.min(bottomY - 10, peakFlagSmoothedY));

        const freqStr = formatDominantFreqLabel(peakFreq);
        const dbStr = `${(peakFlagSmoothedDb + calibrationOffset).toFixed(1)} dB`;
        const badgeText = `${freqStr}  ${dbStr}`;

        ctx.save();
        ctx.globalAlpha = peakFlagAlpha;
        ctx.font = "bold 10px 'Space Grotesk', monospace";
        const textMetrics = ctx.measureText(badgeText);
        const badgeW = textMetrics.width + 14;
        const badgeH = 18;
        const badgeX = Math.max(10, Math.min(canvas.width - badgeW - 10, pinX - badgeW / 2));
        const badgeY = Math.max(specTop + 6, pinY - badgeH - 6);

        // Downward pointer arrow / chevron
        ctx.beginPath();
        ctx.moveTo(pinX, pinY - 1);
        ctx.lineTo(pinX - 4, pinY - 6);
        ctx.lineTo(pinX + 4, pinY - 6);
        ctx.closePath();
        ctx.fillStyle = isLight ? '#008B9F' : '#00f2fe';
        ctx.fill();

        // Badge Container
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        } else {
            ctx.rect(badgeX, badgeY, badgeW, badgeH);
        }
        ctx.fillStyle = isLight ? 'rgba(240, 245, 250, 0.95)' : 'rgba(6, 12, 22, 0.94)';
        ctx.fill();
        ctx.strokeStyle = isLight ? '#008B9F' : 'rgba(0, 242, 254, 0.85)';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Text Inside Badge
        ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, badgeX + (badgeW / 2), badgeY + (badgeH / 2));
        ctx.restore();
    }

    function drawInteractiveCrosshair(specTop = 0, specHeight = canvas.height, specLeft = 0, specWidth = canvas.width) {
        if (!crosshairState.active || !isAnalyzing) return;
        const bottomY = specTop + specHeight;
        if (crosshairState.y < specTop || crosshairState.y > bottomY) return;
        if (crosshairState.x < specLeft || crosshairState.x > specLeft + specWidth) return;
        
        ctx.save();
        const { x, y, freq, db } = crosshairState;
        
        // 1. Draw Vertical Guideline
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(x, specTop);
        ctx.lineTo(x, bottomY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 2. Draw Target Reticle at cursor point
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00f2fe';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 242, 254, 0.9)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 8.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // 3. Draw Floating Pill Tooltip Badge
        const freqText = freq >= 1000 ? (freq / 1000).toFixed(freq % 100 === 0 ? 1 : 2) + ' kHz' : freq + ' Hz';
        let label = '';
        if (currentMode === 'tf') {
            const magVal = (db !== undefined) ? `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB` : '0 dB';
            const phaseVal = (crosshairState.phase !== undefined) ? `${crosshairState.phase >= 0 ? '+' : ''}${crosshairState.phase.toFixed(1)}°` : '0°';
            const cohVal = (crosshairState.coh !== undefined) ? `${Math.round(crosshairState.coh * 100)}%` : '100%';
            label = `${freqText} | MAG: ${magVal} | ∠: ${phaseVal} | COH: ${cohVal}`;
        } else {
            const dbVal = (db !== undefined && db > -119) ? (db + calibrationOffset).toFixed(1) : '-∞';
            const dbText = `${dbVal} dB`;
            label = `${freqText}  |  ${dbText}`;
        }
        
        ctx.font = "bold 12px 'Space Grotesk', monospace";
        const textMetrics = ctx.measureText(label);
        const padX = 10;
        const boxW = textMetrics.width + (padX * 2);
        const boxH = 24;
        
        // Clamp tooltip so it remains inside the spectrum pane boundaries
        let pillX = x + 15;
        const maxPillX = specLeft + specWidth - 10;
        if (pillX + boxW > maxPillX) {
            pillX = x - boxW - 15;
        }
        if (pillX < specLeft + 10) pillX = specLeft + 10;
        
        let pillY = y - 32;
        if (pillY < specTop + 6) {
            pillY = y + 18;
        }
        if (pillY + boxH > bottomY - 6) {
            pillY = bottomY - boxH - 6;
        }
        
        // Rounded pill frame
        ctx.fillStyle = 'rgba(6, 12, 20, 0.92)';
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(0, 242, 254, 0.4)';
        
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(pillX, pillY, boxW, boxH, 6);
        } else {
            ctx.rect(pillX, pillY, boxW, boxH);
        }
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Tooltip text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, pillX + padX, pillY + boxH / 2);
        
        ctx.restore();
    }

    function updateTelemetry() {
        const peakValEl = document.getElementById('rta-peak-val');
        const domFreqEl = document.getElementById('rta-dom-val');
        const vuLevelEl = document.getElementById('rta-vu-level');
        const vuPeakLineEl = document.getElementById('rta-vu-peak-line');
        const vuValEl = document.getElementById('rta-vu-val');
        const vuClipEl = document.getElementById('rta-vu-clip');
        const now = performance.now();
        const dt = (lastTelemetryTime > 0) ? Math.max(0.004, Math.min(0.1, (now - lastTelemetryTime) / 1000)) : 0.016;
        lastTelemetryTime = now;

        const sampleRate = audioCtx ? audioCtx.sampleRate : 48000;
        const fftSize = analyser ? analyser.fftSize : 2048;
        const binHz = sampleRate / fftSize;

        // Scan FFT bins for dominant peak and broadband spectral energy fallback
        let maxFFT = -120;
        let domIdx = 0;
        let spectralEnergySum = 0;
        if (dataArray && bufferLength > 0 && isAnalyzing) {
            for (let i = 1; i < bufferLength; i++) {
                const freq = i * binHz;
                if (freq < 20 || freq > 20000) continue;
                const rawBinDb = dataArray[i];
                if (Number.isFinite(rawBinDb)) {
                    const weightedVal = rawBinDb + getIECWeighting(freq, currentWeighting) + getTiltOffset(freq);
                    if (weightedVal > maxFFT) {
                        maxFFT = weightedVal;
                        domIdx = i;
                    }
                    if (rawBinDb > -118) {
                        spectralEnergySum += Math.pow(10, weightedVal / 10);
                    }
                }
            }
        }
        const spectralRmsDbfs = spectralEnergySum > 1e-12 ? Math.min(0, 10 * Math.log10(spectralEnergySum)) : -118;

        // 1. Hardware Input VU Meter calculation from timeData (with spectral fallback)
        if (timeData && timeData.length > 0 && isAnalyzing) {
            let peakAbs = 0;
            let sumSq = 0;
            const N = timeData.length;
            for (let i = 0; i < N; i++) {
                const sample = timeData[i];
                if (!Number.isFinite(sample)) continue;
                const abs = Math.abs(sample);
                if (abs > peakAbs) peakAbs = abs;
                sumSq += abs * abs;
            }
            const rms = Math.sqrt(sumSq / N);
            const timePeakDbfs = peakAbs > 1e-7 ? 20 * Math.log10(peakAbs) : -118;
            const timeRmsDbfs = rms > 1e-7 ? 20 * Math.log10(rms) : -118;

            inputPeakDbfs = Math.max(timePeakDbfs, maxFFT);
            inputRmsDbfs = Math.max(timeRmsDbfs, spectralRmsDbfs);

            // Detect dead/frozen WebKit audio stream (all digital zeros) and auto-recover
            if (peakAbs < 1e-8 && maxFFT <= -118) {
                zeroSignalFrames++;
                if (zeroSignalFrames > 120 && !isStartingAnalyzer && (now - lastAutoRecoverTime > 4000)) {
                    zeroSignalFrames = 0;
                    lastAutoRecoverTime = now;
                    startAnalyzer(undefined, true);
                }
            } else {
                zeroSignalFrames = 0;
            }

            // Percentage from -60 dBFS (0%) to 0 dBFS (100%)
            const vuPct = Math.min(100, Math.max(0, ((inputRmsDbfs + 60) / 60) * 100));
            const peakPct = Math.min(100, Math.max(0, ((inputPeakDbfs + 60) / 60) * 100));

            if (vuLevelEl) vuLevelEl.style.width = `${vuPct.toFixed(1)}%`;
            if (vuPeakLineEl) vuPeakLineEl.style.left = `${peakPct.toFixed(1)}%`;
            if (vuValEl) {
                if (currentMode === 'tf' && window.TransferFunctionEngine) {
                    const mP = typeof window.TransferFunctionEngine.measPeakDbfs === 'number' ? window.TransferFunctionEngine.measPeakDbfs : -100;
                    const rP = typeof window.TransferFunctionEngine.refPeakDbfs === 'number' ? window.TransferFunctionEngine.refPeakDbfs : -100;
                    vuValEl.textContent = `M: ${mP > -59 ? mP.toFixed(0) : '-∞'} | R: ${rP > -59 ? rP.toFixed(0) : '-∞'} dBFS`;
                } else if (isRtaPinkNoiseActive) {
                    const micStr = inputRmsDbfs > -59 ? `${inputRmsDbfs.toFixed(1)} dBFS` : '-∞ dBFS';
                    vuValEl.textContent = `${micStr} (PINK ON)`;
                } else {
                    vuValEl.textContent = inputRmsDbfs > -59 ? `${inputRmsDbfs.toFixed(1)} dBFS` : `-∞ dBFS`;
                }
            }

            // Sticky clipping detection (>= -0.3 dBFS)
            if (inputPeakDbfs >= -0.3) {
                clipStickyUntil = now + 1500;
            }
            if (vuClipEl) {
                vuClipEl.style.display = (now < clipStickyUntil) ? 'inline-block' : 'none';
            }
        } else {
            if (vuLevelEl) vuLevelEl.style.width = '0%';
            if (vuPeakLineEl) vuPeakLineEl.style.left = '0%';
            if (vuValEl) vuValEl.textContent = '-∞ dBFS';
            if (vuClipEl) vuClipEl.style.display = 'none';
        }

        // --- Continuous IEC 61672 Ballistics for SPL ---
        if (!isAnalyzing || inputRmsDbfs <= -118) {
            splSmoothedDbfs = Math.max(-118, splSmoothedDbfs - (40 * dt));
            if (splSmoothedDbfs <= -116) {
                splDisplayStr = '--.-';
                splDisplayCategory = 'safe';
            }
        } else {
            if (splSmoothedDbfs <= -110 || !Number.isFinite(splSmoothedDbfs)) {
                splSmoothedDbfs = inputRmsDbfs; // Immediate pickup on start
            } else {
                // Ballistics: Fast (tau=0.20s), Slow (tau=0.50s), Inf (tau=1.20s)
                const tau = (averagingFactor <= 2) ? 0.20 : (averagingFactor < 7 ? 0.50 : 1.20);
                const splAlpha = Math.min(1.0, Math.max(0.01, 1.0 - Math.exp(-dt / tau)));
                splSmoothedDbfs += (inputRmsDbfs - splSmoothedDbfs) * splAlpha;
            }
        }

        // --- Throttle SPL Display Refresh to 4 Hz (250ms) to stop numerical jitter ---
        if (splDisplayStr === '--.-' || now - lastSplDisplayTick >= 250) {
            lastSplDisplayTick = now;
            if (isAnalyzing && splSmoothedDbfs > -116) {
                const liveSpl = Math.max(20, splSmoothedDbfs + calibrationOffset);
                splDisplayStr = liveSpl.toFixed(1);

                // Category with 0.5 dB hysteresis to stop color flicker:
                if (splDisplayCategory === 'safe' && liveSpl >= 85.3) {
                    splDisplayCategory = 'mix';
                } else if (splDisplayCategory === 'mix') {
                    if (liveSpl < 84.7) splDisplayCategory = 'safe';
                    else if (liveSpl >= 93.3) splDisplayCategory = 'caution';
                } else if (splDisplayCategory === 'caution') {
                    if (liveSpl < 92.7) splDisplayCategory = 'mix';
                    else if (liveSpl >= 100.3) splDisplayCategory = 'limit';
                } else if (splDisplayCategory === 'limit') {
                    if (liveSpl < 99.7) splDisplayCategory = 'caution';
                    else if (liveSpl >= 115.3) splDisplayCategory = 'critical';
                } else if (splDisplayCategory === 'critical') {
                    if (liveSpl < 114.7) splDisplayCategory = 'limit';
                }
            } else {
                splDisplayStr = '--.-';
                splDisplayCategory = 'safe';
            }
        }

        // 2. Dominant Peak & Peak Level Calculation (Works in both RTA and FFT modes)
        let localFloorSum = 0;
        let localFloorCount = 0;
        for (let j = Math.max(1, domIdx - 6); j <= Math.min(bufferLength - 1, domIdx + 6); j++) {
            if (Math.abs(j - domIdx) > 1) {
                const jf = j * binHz;
                const valJ = dataArray[j];
                if (Number.isFinite(valJ)) {
                    localFloorSum += valJ + getIECWeighting(jf, currentWeighting) + getTiltOffset(jf);
                    localFloorCount++;
                }
            }
        }
        const localFloor = localFloorCount > 0 ? (localFloorSum / localFloorCount) : -120;
        const prominence = maxFFT - localFloor;

        // Smooth Peak dB for top bar
        const effectivePeakDB = (currentMode === 'rta') ? Math.max(...peakData) : maxFFT;
        if (effectivePeakDB > -115) {
            if (peakSmoothedDb <= -115) peakSmoothedDb = effectivePeakDB;
            else {
                if (effectivePeakDB > peakSmoothedDb) peakSmoothedDb = effectivePeakDB;
                else peakSmoothedDb += (effectivePeakDB - peakSmoothedDb) * Math.min(1.0, 1.0 - Math.exp(-dt / 0.40));
            }
        } else {
            peakSmoothedDb = -120;
        }

        if (now - lastPeakDisplayTick >= 250) {
            lastPeakDisplayTick = now;
            if (peakValEl) {
                if (!isAnalyzing || peakSmoothedDb <= -115) {
                    peakValEl.textContent = `-∞ dB${(currentWeighting || 'a').toUpperCase()}`;
                } else {
                    peakValEl.textContent = `${(peakSmoothedDb + calibrationOffset).toFixed(1)} dB${(currentWeighting || 'a').toUpperCase()}`;
                }
            }
        }

        // Dominant frequency lock-on & anti-flicker (100% synchronized between Top-Center HUD and Floating Peak Pin)
        if (currentMode === 'rta') {
            const freqs = currentOctaveFreqs || ISO_1_3_FREQS;
            let rtaMaxDb = -150;
            let rtaMaxIdx = -1;
            let rtaSumDb = 0;
            let rtaValidCount = 0;
            for (let i = 0; i < currentRtaLevels.length; i++) {
                const val = currentRtaLevels[i];
                if (Number.isFinite(val)) {
                    if (val > rtaMaxDb) {
                        rtaMaxDb = val;
                        rtaMaxIdx = i;
                    }
                    rtaSumDb += val;
                    rtaValidCount++;
                }
            }
            const rtaFloor = rtaValidCount > 1 ? ((rtaSumDb - rtaMaxDb) / (rtaValidCount - 1)) : -120;
            const rtaProminence = rtaMaxDb - rtaFloor;

            if (!isAnalyzing || rtaMaxIdx < 0 || rtaMaxDb <= -116 || rtaProminence < 0.10) {
                if (now - lastDomActiveTime > 600) {
                    lockedDomFreq = 0;
                    candidateDomFreq = 0;
                    candidateFirstSeen = 0;
                    lockedRtaBandIdx = -1;
                    candidateRtaBandIdx = -1;
                    domFreqDisplay = `--- Hz`;
                    currentPeakFreq = 0;
                    currentPeakDb = -120;
                }
            } else {
                lastDomActiveTime = now;
                if (lockedRtaBandIdx < 0 || lockedRtaBandIdx >= freqs.length) {
                    lockedRtaBandIdx = rtaMaxIdx;
                    candidateRtaBandIdx = rtaMaxIdx;
                    candidateDomDb = rtaMaxDb;
                    candidateFirstSeen = now;
                } else if (rtaMaxIdx === lockedRtaBandIdx) {
                    candidateRtaBandIdx = lockedRtaBandIdx;
                    candidateDomDb = rtaMaxDb;
                    candidateFirstSeen = now;
                } else {
                    const lockedLevel = currentRtaLevels[lockedRtaBandIdx] !== undefined ? currentRtaLevels[lockedRtaBandIdx] : -150;
                    if (rtaMaxIdx === candidateRtaBandIdx) {
                        const elapsed = now - candidateFirstSeen;
                        const isMuchStronger = (rtaMaxDb > lockedLevel + 2.5);
                        if (elapsed >= 250 || isMuchStronger) {
                            lockedRtaBandIdx = rtaMaxIdx;
                            candidateDomDb = rtaMaxDb;
                            candidateFirstSeen = now;
                        }
                    } else {
                        candidateRtaBandIdx = rtaMaxIdx;
                        candidateDomDb = rtaMaxDb;
                        candidateFirstSeen = now;
                    }
                }
                lockedDomFreq = freqs[lockedRtaBandIdx];
                currentPeakFreq = lockedDomFreq;
                currentPeakDb = currentRtaLevels[lockedRtaBandIdx] !== undefined ? currentRtaLevels[lockedRtaBandIdx] : rtaMaxDb;
                domFreqDisplay = formatDominantFreqLabel(lockedDomFreq);
            }
        } else {
            if (!isAnalyzing || maxFFT <= -116 || prominence < 0.12) {
                if (now - lastDomActiveTime > 600) {
                    lockedDomFreq = 0;
                    candidateDomFreq = 0;
                    candidateFirstSeen = 0;
                    domFreqDisplay = `--- Hz`;
                    currentPeakFreq = 0;
                    currentPeakDb = -120;
                }
            } else {
                lastDomActiveTime = now;

                // Parabolic Interpolation for sub-bin precision
                let delta = 0;
                if (domIdx > 0 && domIdx < bufferLength - 1) {
                    const alpha = dataArray[domIdx - 1];
                    const beta = dataArray[domIdx];
                    const gamma = dataArray[domIdx + 1];
                    const denom = alpha - (2 * beta) + gamma;
                    if (denom !== 0 && Number.isFinite(denom)) {
                        delta = Math.max(-0.5, Math.min(0.5, 0.5 * (alpha - gamma) / denom));
                    }
                }
                const trueBin = domIdx + delta;
                const rawDomFreq = Math.max(20, Math.min(20000, Math.round(trueBin * binHz)));

                if (lockedDomFreq <= 0) {
                    lockedDomFreq = rawDomFreq;
                    candidateDomFreq = rawDomFreq;
                    candidateDomDb = maxFFT;
                    candidateFirstSeen = now;
                    currentPeakFreq = lockedDomFreq;
                    currentPeakDb = maxFFT;
                    domFreqDisplay = formatDominantFreqLabel(lockedDomFreq);
                } else {
                    const absDiff = Math.abs(rawDomFreq - lockedDomFreq);
                    const relDiff = absDiff / Math.max(20, lockedDomFreq);
                    if (relDiff <= 0.05 || absDiff <= binHz * 1.5) {
                        lockedDomFreq = Math.round(lockedDomFreq * 0.85 + rawDomFreq * 0.15);
                        candidateDomFreq = lockedDomFreq;
                        candidateDomDb = maxFFT;
                        candidateFirstSeen = now;
                        currentPeakFreq = lockedDomFreq;
                        currentPeakDb = maxFFT;
                    } else {
                        const candDiff = Math.abs(rawDomFreq - candidateDomFreq);
                        if (candidateDomFreq > 0 && (candDiff / Math.max(20, candidateDomFreq) <= 0.06 || candDiff <= binHz * 2.0)) {
                            const elapsed = now - candidateFirstSeen;
                            const isMuchStronger = (maxFFT > candidateDomDb + 2.5);
                            if (elapsed >= 250 || isMuchStronger) {
                                lockedDomFreq = rawDomFreq;
                                candidateDomFreq = rawDomFreq;
                                candidateDomDb = maxFFT;
                                candidateFirstSeen = now;
                                currentPeakFreq = lockedDomFreq;
                                currentPeakDb = maxFFT;
                            }
                        } else {
                            candidateDomFreq = rawDomFreq;
                            candidateDomDb = maxFFT;
                            candidateFirstSeen = now;
                        }
                    }
                }

                if (domFreqDisplay === '--- Hz' || now - lastDomDisplayTick >= 250) {
                    lastDomDisplayTick = now;
                    if (lockedDomFreq > 0) {
                        domFreqDisplay = formatDominantFreqLabel(lockedDomFreq);
                    }
                }
            }
        }
        if (domFreqEl) domFreqEl.textContent = domFreqDisplay;

        // Top Ribbon SPL Display (uses stabilized splDisplayStr)
        const ribbonSplEl = document.getElementById('rta-ribbon-spl-val');
        if (ribbonSplEl) {
            if (!isAnalyzing || splDisplayStr === '--.-') {
                ribbonSplEl.textContent = `--.- dB${(currentWeighting || 'a').toUpperCase()}`;
            } else {
                ribbonSplEl.textContent = `${splDisplayStr} dB${(currentWeighting || 'a').toUpperCase()}`;
            }
        }

        // 3. Transfer Function Live Hardware Meters & Delay Telemetry
        const tf = window.TransferFunctionEngine;
        if (tf && isAnalyzing) {
            const ch1VuBar = document.getElementById('fs-ch1-vu-bar');
            const ch1ValEl = document.getElementById('fs-ch1-meter-val');
            const ch1ClipLed = document.getElementById('fs-ch1-clip-led');
            const ch2VuBar = document.getElementById('fs-ch2-vu-bar');
            const ch2ValEl = document.getElementById('fs-ch2-meter-val');
            const ch2ClipLed = document.getElementById('fs-ch2-clip-led');

            const mPeak = (typeof tf.measPeakDbfs === 'number') ? tf.measPeakDbfs : -100;
            const rPeak = (typeof tf.refPeakDbfs === 'number') ? tf.refPeakDbfs : -100;

            const ch1Peak = (tf.measChannel === 0) ? mPeak : rPeak;
            const ch2Peak = (tf.refChannel === 1) ? rPeak : mPeak;

            if (ch1VuBar) {
                const p1 = Math.max(0, Math.min(100, ((ch1Peak + 60) / 60) * 100));
                ch1VuBar.style.width = `${p1.toFixed(1)}%`;
            }
            if (ch1ValEl) ch1ValEl.textContent = ch1Peak > -59 ? `${ch1Peak.toFixed(1)} dBFS` : '-∞ dBFS';
            if (ch1ClipLed) ch1ClipLed.classList.toggle('active', ch1Peak >= -0.3);

            if (ch2VuBar) {
                const p2 = Math.max(0, Math.min(100, ((ch2Peak + 60) / 60) * 100));
                ch2VuBar.style.width = `${p2.toFixed(1)}%`;
            }
            if (ch2ValEl) ch2ValEl.textContent = ch2Peak > -59 ? `${ch2Peak.toFixed(1)} dBFS` : '-∞ dBFS';
            if (ch2ClipLed) ch2ClipLed.classList.toggle('active', ch2Peak >= -0.3);

            const tfDelayReadout = document.getElementById('fs-tf-delay-readout');
            const hasValidRef = (typeof tf.hasValidReference === 'boolean') ? tf.hasValidReference : true;
            if (tfDelayReadout) {
                if (!hasValidRef || !tf.peakDelayValid || tf.peakDelayMs === null) {
                    tfDelayReadout.textContent = '-- ms (-- m)';
                    tfDelayReadout.style.color = 'var(--text-muted)';
                } else {
                    const isImp = window.globalUnitSystem === 'imperial';
                    const distStr = isImp ? `${tf.peakDistanceFt.toFixed(2)}ft` : `${tf.peakDistanceM.toFixed(2)}m`;
                    tfDelayReadout.textContent = `${tf.peakDelayMs.toFixed(2)} ms (${distStr})`;
                    tfDelayReadout.style.color = '#00FF9D';
                }
            }
            const tfCohReadout = document.getElementById('fs-tf-coh-readout');
            if (tfCohReadout) {
                if (!hasValidRef) {
                    tfCohReadout.textContent = 'COH: --%';
                    tfCohReadout.style.color = 'var(--text-muted)';
                } else {
                    const cohPct = Math.round(tf.peakCoherence * 100);
                    tfCohReadout.textContent = `COH: ${cohPct}%`;
                    tfCohReadout.style.color = cohPct >= 80 ? '#00FF9D' : (cohPct >= 50 ? '#FFB300' : '#FF3B30');
                }
            }
            const tfLockedDelay = document.getElementById('fs-tf-locked-delay');
            if (tfLockedDelay) {
                tfLockedDelay.textContent = `${tf.refDelayMs.toFixed(2)} ms`;
            }
        }
    }

    // --- Helper: Render Snapshot Slots UI (Supports Normal view and Fullscreen Precision Drawer) ---
    function renderSnapshotSlots() {
        const containers = [
            slotsContainer,
            document.getElementById('rta-fs-snapshot-slots')
        ].filter(Boolean);

        const isPro = window.isPremiumActive('snapshots');

        if (containers.length > 0) {
            containers.forEach(container => {
                container.innerHTML = '';
                for (let i = 0; i < 4; i++) {
                    const slot = snapshots[i];
                    const btn = document.createElement('div');
                    
                    // Slot 0 (Trace A) is free for everyone, Slots 1-3 require watching an ad per slot
                    const isSlotLocked = !isSnapshotSlotUnlocked(i);

                    if (isSlotLocked) {
                        // Locked State (Slots 2-4)
                        btn.className = 'snapshot-slot locked-pro';
                        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">lock</span>';
                        btn.title = `Slot ${i+1} Locked (Watch ad to unlock)`;
                        btn.addEventListener('click', () => {
                            pendingSnapshotCaptureSlot = i;
                            window.showProUpgradeModal(`snapshot_slot_${i}`);
                        });
                    } else {
                        // Active / Unlocked State
                        btn.className = `snapshot-slot ${slot ? 'active' : ''} ${slot && !slot.visible ? 'slot-hidden' : ''}`;
                        btn.style.color = slot ? slot.color : 'inherit';
                        btn.textContent = i + 1;
                        
                        if (slot) {
                            btn.title = `Snapshot ${i+1} (Click to toggle, Right-click to delete)`;
                            btn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                slot.visible = !slot.visible;
                                renderSnapshotSlots();
                            });
                            btn.addEventListener('contextmenu', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                snapshots[i] = null;
                                if (!snapshots.some(Boolean)) {
                                    snapshots = [];
                                }
                                saveConfigToCloud('rta_snapshots', { snapshots });
                                renderSnapshotSlots();
                            });
                        } else {
                            btn.title = "Empty Slot (Click to save)";
                            btn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                if (!isInitialized) {
                                    const startBtn = document.getElementById('btn-start-analyzer');
                                    if (startBtn) startBtn.click();
                                    return;
                                }
                                const defaultTraceColors = ['#00FFFF', '#FF00FF', '#FFE600', '#00FF66'];
                                const newSnap = {
                                    rta: Array.from(currentRtaLevels),
                                    fraction: currentOctaveFraction,
                                    fft: Array.from(dataArray),
                                    color: SNAPSHOT_COLORS[i] || defaultTraceColors[i] || '#00FFFF',
                                    visible: true,
                                    id: Date.now()
                                };
                                snapshots[i] = newSnap;
                                saveConfigToCloud('rta_snapshots', { snapshots });
                                renderSnapshotSlots();
                            });
                        }
                    }
                    container.appendChild(btn);
                }
            });
        }

        // Update Trace A, B, C, D capsules and buttons in drawer
        const traceConfigs = [
            { 
                btn: document.getElementById('btn-rta-trace-a'), 
                deleteBtn: document.getElementById('btn-rta-delete-trace-a'),
                capsule: document.getElementById('rta-trace-capsule-a'),
                index: 0, 
                defaultColor: '#00FFFF', 
                label: 'TRACE A' 
            },
            { 
                btn: document.getElementById('btn-rta-trace-b'), 
                deleteBtn: document.getElementById('btn-rta-delete-trace-b'),
                capsule: document.getElementById('rta-trace-capsule-b'),
                index: 1, 
                defaultColor: '#FF00FF', 
                label: 'TRACE B' 
            },
            { 
                btn: document.getElementById('btn-rta-trace-c'), 
                deleteBtn: document.getElementById('btn-rta-delete-trace-c'),
                capsule: document.getElementById('rta-trace-capsule-c'),
                index: 2, 
                defaultColor: '#FFE600', 
                label: 'TRACE C' 
            },
            { 
                btn: document.getElementById('btn-rta-trace-d'), 
                deleteBtn: document.getElementById('btn-rta-delete-trace-d'),
                capsule: document.getElementById('rta-trace-capsule-d'),
                index: 3, 
                defaultColor: '#00FF66', 
                label: 'TRACE D' 
            }
        ];

        traceConfigs.forEach(t => {
            if (!t.btn) return;
            const slot = snapshots[t.index];
            const statusText = t.btn.querySelector('.trace-status-text');
            const titleSpan = t.btn.querySelector('span:first-child');
            const isSlotLocked = !isSnapshotSlotUnlocked(t.index);

            if (isSlotLocked) {
                t.btn.classList.remove('active');
                t.btn.classList.add('trace-slot-locked');
                if (t.deleteBtn) t.deleteBtn.style.display = 'none';
                if (t.capsule) {
                    t.capsule.style.borderColor = 'rgba(255, 184, 0, 0.4)';
                    t.capsule.style.boxShadow = 'none';
                }
                t.btn.style.color = 'var(--text-muted)';
                if (titleSpan) {
                    titleSpan.style.color = 'var(--text-muted)';
                    titleSpan.style.opacity = '0.6';
                }
                if (statusText) {
                    statusText.innerHTML = '<span class="material-symbols-outlined" style="font-size: 11px; vertical-align: middle; margin-right: 2px; color: #FFB800;">lock</span><span style="color: #FFB800;">WATCH AD TO UNLOCK</span>';
                }
            } else if (slot) {
                t.btn.classList.remove('trace-slot-locked');
                t.btn.classList.add('active');
                if (t.deleteBtn) t.deleteBtn.style.display = 'flex';
                if (t.capsule) {
                    t.capsule.style.borderColor = slot.color || t.defaultColor;
                    t.capsule.style.boxShadow = `0 0 10px ${(slot.color || t.defaultColor)}33`;
                }
                if (titleSpan) {
                    titleSpan.style.color = slot.color || t.defaultColor;
                    titleSpan.style.opacity = '1';
                }
                if (slot.visible) {
                    t.btn.style.color = slot.color || t.defaultColor;
                    if (statusText) {
                        statusText.textContent = 'ACTIVE (SHOW)';
                        statusText.style.color = slot.color || t.defaultColor;
                    }
                } else {
                    t.btn.style.color = 'var(--text-muted)';
                    if (statusText) {
                        statusText.textContent = 'MUTED (HIDDEN)';
                        statusText.style.color = 'var(--text-muted)';
                    }
                }
            } else {
                t.btn.classList.remove('trace-slot-locked');
                t.btn.classList.remove('active');
                if (t.deleteBtn) t.deleteBtn.style.display = 'none';
                if (t.capsule) {
                    t.capsule.style.borderColor = 'var(--outline)';
                    t.capsule.style.boxShadow = 'none';
                }
                if (titleSpan) {
                    titleSpan.style.color = t.defaultColor;
                    titleSpan.style.opacity = '1';
                }
                t.btn.style.color = '';
                if (statusText) {
                    statusText.textContent = 'EMPTY (TAP TO SAVE)';
                    statusText.style.color = 'var(--text-muted)';
                }
            }
        });

        // Update Clear All button styling in drawer
        const clearBtn = document.getElementById('btn-rta-fs-clear-snaps');
        if (clearBtn) {
            const hasAny = snapshots.some(Boolean);
            clearBtn.style.opacity = hasAny ? '1' : '0.4';
            clearBtn.style.pointerEvents = hasAny ? 'auto' : 'none';
        }
    }

    // --- Core Logic: Capture New Snapshot ---
    function captureNewSnapshot() {
        if (!isInitialized) {
            const startBtn = document.getElementById('btn-start-analyzer');
            if (startBtn) startBtn.click();
            return;
        }

        // Find the first empty slot among the 4 slots (0, 1, 2, 3)
        let targetIdx = -1;
        for (let i = 0; i < 4; i++) {
            if (!snapshots[i]) {
                targetIdx = i;
                break;
            }
        }

        if (targetIdx === -1) {
            alert("All 4 snapshot slots are full. Delete a trace to capture a new one.");
            return;
        }

        if (!isSnapshotSlotUnlocked(targetIdx)) {
            pendingSnapshotCaptureSlot = targetIdx;
            window.showProUpgradeModal(`snapshot_slot_${targetIdx}`);
            return;
        }

        const defaultTraceColors = ['#00FFFF', '#FF00FF', '#FFE600', '#00FF66'];
        const newSnap = {
            rta: Array.from(currentRtaLevels),
            fraction: currentOctaveFraction,
            fft: Array.from(dataArray),
            color: SNAPSHOT_COLORS[targetIdx] || defaultTraceColors[targetIdx] || '#00FFFF',
            visible: true,
            id: Date.now()
        };

        snapshots[targetIdx] = newSnap;
        saveConfigToCloud('rta_snapshots', { snapshots });
        renderSnapshotSlots();

        if (btnCapture) {
            btnCapture.innerHTML = '<span class="material-symbols-outlined">check_circle</span> CAPTURED';
            btnCapture.classList.add('active');
            setTimeout(() => {
                btnCapture.innerHTML = '<span class="material-symbols-outlined">camera</span> CAPTURE_NEW';
                btnCapture.classList.remove('active');
            }, 1000);
        }

        const fsSnapBtn = document.getElementById('btn-rta-fs-snap');
        if (fsSnapBtn) {
            fsSnapBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 15px;">check_circle</span> <span class="fs-btn-label">SAVED</span>';
            fsSnapBtn.classList.add('active');
            setTimeout(() => {
                fsSnapBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 15px;">camera</span> <span class="fs-btn-label">SNAP</span>';
                fsSnapBtn.classList.remove('active');
            }, 1000);
        }
    }

    // --- Custom Mic Calibration Interpolator Wrappers (delegated to rtaDspMath.js) ---
    function precomputeCalibrationOffsets() {
        if (!bufferLength) return;
        const sampleRate = audioCtx ? audioCtx.sampleRate : 48000;
        calOffsets = buildCalibrationOffsetsArray(calProfile, bufferLength, sampleRate);
    }

    function getCalOffsetForFreq(f) {
        return interpolateCalOffsetForFreq(calProfile, f);
    }

    // --- Rolling Spectrogram Waterfall Visualizer ---
    function drawWaterfall() {
        if (!waterfallCanvas) {
            waterfallCanvas = document.createElement('canvas');
            waterfallCanvas.width = canvas.width;
            waterfallCanvas.height = canvas.height;
            waterfallCtx = waterfallCanvas.getContext('2d');
            waterfallCtx.fillStyle = '#050508';
            waterfallCtx.fillRect(0, 0, waterfallCanvas.width, waterfallCanvas.height);
        }

        const shiftY = 2;
        waterfallCtx.drawImage(
            waterfallCanvas, 
            0, 0, waterfallCanvas.width, waterfallCanvas.height - shiftY,
            0, shiftY, waterfallCanvas.width, waterfallCanvas.height - shiftY
        );

        const sampleRate = audioCtx ? audioCtx.sampleRate : 48000;
        const nyquist = sampleRate / 2;
        const minF = 20;
        const maxF = 20000;
        const logRatio = Math.log10(maxF / minF);

        for (let i = 1; i < bufferLength; i++) {
            const freq1 = (i * nyquist) / bufferLength;
            const freq2 = ((i + 1) * nyquist) / bufferLength;
            if (freq2 < minF) continue;
            if (freq1 > maxF) break;
            const dbVal = dataArray[i];
            const color = getWaterfallColor(dbVal + calibrationOffset);
            
            const x1 = Math.max(0, (Math.log10(Math.max(minF, freq1) / minF) / logRatio) * canvas.width);
            const x2 = Math.min(canvas.width, (Math.log10(Math.min(maxF, freq2) / minF) / logRatio) * canvas.width);
            
            waterfallCtx.fillStyle = color;
            waterfallCtx.fillRect(x1, 0, Math.max(1.5, x2 - x1), shiftY);
        }

        ctx.drawImage(waterfallCanvas, 0, 0);
    }

    // --- Listeners: Controls ---
    const avgSlider = document.getElementById('rta-averaging');
    const avgVal = document.getElementById('avg-val');
    if (avgSlider) {
        avgSlider.addEventListener('input', (e) => {
            averagingFactor = parseInt(e.target.value);
            if (avgVal) avgVal.textContent = averagingFactor;
            resetPeakHoldData();
            if (typeof syncFullscreenHudWithEngineState === 'function') syncFullscreenHudWithEngineState();
        });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (isAnalyzing) stopAnalyzer();
            else window.startAnalyzer();
        });
    }

    const ribbonRunBtn = document.getElementById('btn-rta-ribbon-run');
    if (ribbonRunBtn) {
        ribbonRunBtn.addEventListener('click', () => {
            if (isAnalyzing) stopAnalyzer();
            else window.startAnalyzer();
        });
    }

    const fsRunBtn = document.getElementById('btn-rta-fs-run');
    if (fsRunBtn) {
        fsRunBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isAnalyzing) stopAnalyzer();
            else window.startAnalyzer();
        });
    }
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');
            if (mode === 'waterfall' && !window.isPremiumActive('spectrogram')) {
                window.showProUpgradeModal('spectrogram');
                return;
            }
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = mode;
            if (currentMode === 'tf' && window.TransferFunctionEngine && !window.TransferFunctionEngine.isRunning) {
                window.TransferFunctionEngine.start();
            } else if (currentMode !== 'tf' && window.TransferFunctionEngine && window.TransferFunctionEngine.isRunning) {
                window.TransferFunctionEngine.stop();
            }
            if (typeof syncFullscreenHudWithEngineState === 'function') syncFullscreenHudWithEngineState();
        });
    });

    weightBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            weightBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWeighting = (btn.getAttribute('data-weight') || 'a').toLowerCase();
            resetPeakHoldData();
            if (typeof syncFullscreenHudWithEngineState === 'function') syncFullscreenHudWithEngineState();
        });
    });

    // Phase 2: Octave Resolution Selection Listener
    const octaveBtns = document.querySelectorAll('.octave-btn');
    const octaveBadge = document.getElementById('rta-octave-badge');
    const OCTAVE_LABELS = {
        1: '1/1 OCT (10 BANDS)',
        3: '1/3 OCT (31 BANDS)',
        6: '1/6 OCT (61 BANDS)',
        12: '1/12 OCT (121 BANDS)',
        24: '1/24 OCT (241 BANDS)'
    };
    octaveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const fraction = parseInt(btn.getAttribute('data-octave')) || 3;
            currentOctaveFraction = fraction;
            currentOctaveFreqs = OCTAVE_TABLES[fraction] || ISO_1_3_FREQS;
            resetPeakHoldData();
            currentRtaLevels = new Float32Array(currentOctaveFreqs.length).fill(-150);
            lockedRtaBandIdx = -1;
            candidateRtaBandIdx = -1;

            octaveBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (octaveBadge) octaveBadge.textContent = OCTAVE_LABELS[fraction] || `${fraction} BANDS`;
            renderFrequencyLabels();
            if (typeof syncFullscreenHudWithEngineState === 'function') syncFullscreenHudWithEngineState();
        });
    });

    // Phase 2: 7-Window Function Selector
    const windowSelect = document.getElementById('rta-window-select');
    if (windowSelect) {
        windowSelect.addEventListener('change', (e) => {
            currentWindow = e.target.value;
            if (typeof syncFullscreenHudWithEngineState === 'function') syncFullscreenHudWithEngineState();
        });
    }

    // Phase 2: Band Sum Calculation Mode (Energy Sum vs Peak Max)
    const bandModeBtns = document.querySelectorAll('.band-mode-btn');
    bandModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-bandmode') || 'energy';
            currentBandMode = mode;
            resetPeakHoldData();
            bandModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (typeof syncFullscreenHudWithEngineState === 'function') syncFullscreenHudWithEngineState();
        });
    });

    // Phase 2: Spectrum Tilt Engine (-6.0 to +6.0 dB/octave around 1kHz pivot)
    const tiltSlider = document.getElementById('rta-tilt');
    const tiltVal = document.getElementById('tilt-val');
    const tiltPresetBtns = document.querySelectorAll('.tilt-preset-btn');

    function setSpectrumTilt(val) {
        spectrumTilt = Math.max(-6.0, Math.min(6.0, parseFloat(val) || 0));
        if (tiltSlider) tiltSlider.value = spectrumTilt;
        if (tiltVal) {
            tiltVal.textContent = `${spectrumTilt > 0 ? '+' : ''}${spectrumTilt.toFixed(1)} dB/oct`;
        }
        tiltPresetBtns.forEach(b => {
            const pVal = parseFloat(b.getAttribute('data-tilt'));
            b.classList.toggle('active', Math.abs(pVal - spectrumTilt) < 0.1);
        });
        if (typeof syncFullscreenHudWithEngineState === 'function') {
            syncFullscreenHudWithEngineState();
        }
    }

    if (tiltSlider) {
        tiltSlider.addEventListener('input', (e) => {
            setSpectrumTilt(e.target.value);
        });
    }

    tiltPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pVal = btn.getAttribute('data-tilt');
            setSpectrumTilt(pVal);
        });
    });

    // Mic Sensitivity / Gain Trim Engine (-24 dB to +24 dB, 0.5 dB steps)
    function setMicGainTrim(val) {
        let db = parseFloat(val);
        if (isNaN(db)) db = 0.0;
        micGainTrimDb = Math.max(-24.0, Math.min(24.0, Math.round(db * 2) / 2));
        safeStorage.setItem('soundengg-mic-gain-trim', micGainTrimDb.toFixed(1));
        const linearGain = Math.pow(10.0, micGainTrimDb / 20.0);
        if (micGainTrimNode && audioCtx && audioCtx.state !== 'closed') {
            try {
                micGainTrimNode.gain.setValueAtTime(linearGain, audioCtx.currentTime);
            } catch (e) {}
        }
        // Sync native iOS CoreAudio input gain via AudioSessionPlugin if supported
        const audioPlugin = getAudioSessionPlugin();
        if (audioPlugin && typeof audioPlugin.setInputGain === 'function') {
            try {
                const normGain = Math.max(0.0, Math.min(1.0, (micGainTrimDb + 24.0) / 48.0));
                audioPlugin.setInputGain({ gain: normGain }).catch(() => {});
            } catch (e) {}
        }
        if (typeof syncFullscreenHudWithEngineState === 'function') {
            syncFullscreenHudWithEngineState();
        }
    }
    window.setMicGainTrim = setMicGainTrim;

    const micTrimSlider = document.getElementById('rta-mic-trim-slider');
    if (micTrimSlider) {
        micTrimSlider.addEventListener('input', (e) => {
            setMicGainTrim(e.target.value);
        });
        micTrimSlider.addEventListener('dblclick', () => {
            setMicGainTrim(0.0);
            if (typeof window.triggerHaptic === 'function') window.triggerHaptic('light');
        });
    }

    const btnMicTrimReset = document.getElementById('btn-rta-mic-trim-reset');
    if (btnMicTrimReset) {
        btnMicTrimReset.addEventListener('click', (e) => {
            e.stopPropagation();
            setMicGainTrim(0.0);
            if (typeof window.triggerHaptic === 'function') window.triggerHaptic('light');
        });
    }

    const btnQuickMicTrim = document.getElementById('btn-fs-tf-mic-trim-quick');
    if (btnQuickMicTrim) {
        btnQuickMicTrim.addEventListener('click', (e) => {
            e.stopPropagation();
            switchFsDrawerTab('io');
            openFsDrawer();
        });
    }

    if (calSlider) {
        calSlider.addEventListener('input', () => {
            calibrationOffset = parseFloat(calSlider.value);
            if (calValue) calValue.textContent = calibrationOffset;
            if (typeof syncFullscreenHudWithEngineState === 'function') syncFullscreenHudWithEngineState();
        });
    }

    if (peakToggle) {
        peakToggle.addEventListener('click', () => {
            peakHoldEnabled = !peakHoldEnabled;
            peakToggle.classList.toggle('active', peakHoldEnabled);
            peakToggle.textContent = peakHoldEnabled ? 'ON' : 'OFF';
            if (typeof syncFullscreenHudWithEngineState === 'function') syncFullscreenHudWithEngineState();
        });
    }

    if (peakReset) {
        peakReset.addEventListener('click', () => {
            resetPeakHoldData();
        });
    }

    if (btnCapture) {
        btnCapture.addEventListener('click', captureNewSnapshot);
    }

    const btnRtaPinkNoise = document.getElementById('btn-rta-pink-noise');
    if (btnRtaPinkNoise) {
        btnRtaPinkNoise.addEventListener('click', () => {
            toggleRtaPinkNoise();
            if (typeof syncFullscreenHudWithEngineState === 'function') syncFullscreenHudWithEngineState();
        });
    }

    const btnClearAll = document.getElementById('btn-clear-all-snapshots');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            if (confirm("Clear all 4 reference memory traces?")) {
                snapshots = [];
                saveConfigToCloud('rta_snapshots', { snapshots });
                renderSnapshotSlots();
            }
        });
    }

    // --- Phase 3: Fullscreen Floating Tactical HUD & Precision Drawer Logic ---
    const fsDock = document.getElementById('rta-fs-hud-dock');
    const fsRestoreBtn = document.getElementById('btn-rta-fs-restore-hud');
    const fsMinimizeBtn = document.getElementById('btn-rta-fs-minimize-hud');
    const fsDrawer = document.getElementById('rta-fs-drawer');
    const fsDrawerBackdrop = document.getElementById('rta-fs-drawer-backdrop');
    const fsOpenDrawerBtn = document.getElementById('btn-rta-fs-open-drawer');
    const fsCloseDrawerBtn = document.getElementById('btn-rta-fs-close-drawer');
    const fsCalSlider = document.getElementById('rta-fs-cal-slider');
    const fsPeakToggle = document.getElementById('btn-rta-fs-peak-toggle');
    const fsPeakReset = document.getElementById('btn-rta-fs-peak-reset');
    const fsClearSnapsBtn = document.getElementById('btn-rta-fs-clear-snaps');

    function openFsDrawer() {
        if (typeof window.triggerHaptic === 'function') window.triggerHaptic('light');
        if (fsDrawer) fsDrawer.classList.add('open');
        const wrapper = canvas.parentElement;
        if (wrapper && window.innerWidth >= 768) {
            wrapper.classList.add('drawer-docked');
            setTimeout(() => {
                syncRtaCanvasSize();
                syncFrequencyLabelsLayout();
            }, 50);
        } else if (fsDrawerBackdrop) {
            fsDrawerBackdrop.classList.add('open');
        }
        getDevices();
        syncFullscreenHudWithEngineState();
        if (isFullscreenActive) {
            resumeRtaAudioEngine();
        }
    }

    function closeFsDrawer() {
        if (typeof window.triggerHaptic === 'function') window.triggerHaptic('light');
        if (fsDrawer) fsDrawer.classList.remove('open');
        if (fsDrawerBackdrop) fsDrawerBackdrop.classList.remove('open');
        const wrapper = canvas.parentElement;
        if (wrapper) {
            wrapper.classList.remove('drawer-docked');
            setTimeout(() => {
                syncRtaCanvasSize();
                syncFrequencyLabelsLayout();
            }, 50);
        }
        if (isFullscreenActive) {
            resumeRtaAudioEngine();
        }
    }

    function syncFullscreenHudWithEngineState() {
        // 1. Mode Buttons Sync
        const fsModeBtns = document.querySelectorAll('.fs-mode-btn');
        fsModeBtns.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-mode') === currentMode);
        });

        // 2. Octave Buttons Sync
        const fsOctaveBtns = document.querySelectorAll('.fs-octave-btn');
        fsOctaveBtns.forEach(b => {
            const fraction = parseInt(b.getAttribute('data-octave')) || 3;
            b.classList.toggle('active', fraction === currentOctaveFraction);
        });

        // Dim octave selector if mode is not RTA
        const fsOctaveGroup = document.getElementById('rta-fs-octave-group');
        if (fsOctaveGroup) {
            fsOctaveGroup.style.opacity = (currentMode === 'rta') ? '1' : '0.65';
        }

        // 3. Weighting Buttons Sync
        const fsWeightBtns = document.querySelectorAll('.fs-weight-btn, .fs-drawer-weight-btn');
        fsWeightBtns.forEach(b => {
            const w = (b.getAttribute('data-weight') || '').toLowerCase();
            b.classList.toggle('active', w === (currentWeighting || 'a').toLowerCase());
        });

        // 4. Pink Noise Button Sync
        const fsPinkBtn = document.getElementById('btn-rta-fs-pink-noise') || document.getElementById('btn-rta-pink-noise');
        if (fsPinkBtn) {
            fsPinkBtn.classList.toggle('active', isRtaPinkNoiseActive);
            const lbl = fsPinkBtn.querySelector('#rta-pink-noise-label');
            if (lbl) {
                lbl.textContent = isRtaPinkNoiseActive ? 'STOP PINK NOISE' : 'START PINK NOISE';
            }
        }
        const rtaPinkBadge = document.getElementById('rta-pink-badge');
        if (rtaPinkBadge) {
            rtaPinkBadge.textContent = isRtaPinkNoiseActive ? 'ACTIVE (-18 dBFS)' : '-18 dBFS';
            rtaPinkBadge.style.color = isRtaPinkNoiseActive ? '#00FF9D' : 'var(--primary)';
        }

        // 5. Band Mode Sync
        const fsBandModeBtns = document.querySelectorAll('.fs-drawer-band-mode-btn');
        fsBandModeBtns.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-bandmode') === currentBandMode);
        });

        // 6. Averaging Speed Buttons & Badge Sync
        const fsAvgVal = document.getElementById('rta-fs-avg-val');
        if (fsAvgVal) {
            let speedLabel = 'SLOW';
            if (averagingFactor <= 2) speedLabel = 'FAST';
            else if (averagingFactor >= 7) speedLabel = 'INFINITE';
            fsAvgVal.textContent = speedLabel;
        }
        const fsSpeedBtns = document.querySelectorAll('.fs-drawer-speed-btn');
        fsSpeedBtns.forEach(b => {
            const spd = b.getAttribute('data-speed');
            const isActive = (spd === 'fast' && averagingFactor <= 2) ||
                             (spd === 'slow' && averagingFactor > 2 && averagingFactor < 7) ||
                             (spd === 'inf' && averagingFactor >= 7);
            b.classList.toggle('active', isActive);
        });

        // 9. Calibration Slider & Quick Presets Sync
        const fsCalVal = document.getElementById('rta-fs-cal-val');
        if (fsCalSlider) fsCalSlider.value = calibrationOffset;
        if (fsCalVal) fsCalVal.textContent = calibrationOffset;
        const calPresetBtns = document.querySelectorAll('.rta-cal-preset-btn');
        calPresetBtns.forEach(b => {
            const presetVal = parseInt(b.getAttribute('data-cal-preset'), 10);
            b.classList.toggle('active', presetVal === Math.round(calibrationOffset));
        });

        // 10. Peak Hold Controls Sync
        if (fsPeakToggle) {
            fsPeakToggle.classList.toggle('active', peakHoldEnabled);
            fsPeakToggle.textContent = peakHoldEnabled ? 'HOLD: ON' : 'HOLD: OFF';
        }
        const fsPeakBadge = document.getElementById('rta-fs-peak-badge');
        if (fsPeakBadge) {
            fsPeakBadge.textContent = peakHoldEnabled ? 'HOLD: ON' : 'HOLD: OFF';
        }

        // 11. WTFL & WATERFALL Pro Lock Icons Sync
        const isSpectrogramUnlocked = window.isPremiumActive('spectrogram');
        const fsWtflLock = document.getElementById('fs-wtfl-lock-icon');
        const wtflLock = document.getElementById('wtfl-lock-icon');
        if (fsWtflLock) {
            fsWtflLock.style.display = isSpectrogramUnlocked ? 'none' : 'inline-block';
        }
        if (wtflLock) {
            wtflLock.style.display = isSpectrogramUnlocked ? 'none' : 'inline-block';
        }

        // 12. Workstation Layout Pills Sync (HUD Dock & Drawer)
        const fsLayoutBtns = document.querySelectorAll('.fs-layout-btn, .fs-drawer-layout-btn');
        fsLayoutBtns.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-layout') === currentLayout);
        });
        const fsLayoutBadge = document.getElementById('rta-fs-layout-badge');
        if (fsLayoutBadge) {
            if (currentLayout === 'single') fsLayoutBadge.textContent = 'Full Spectrum (1D)';
            else if (currentLayout === 'spl_history') fsLayoutBadge.textContent = '60s SPL History + Spectrum';
        }
        syncFrequencyLabelsLayout();

        // 11. Dual-Channel Transfer Function Sync in Fullscreen HUD Dock
        const isTfMode = (currentMode === 'tf');
        const fsTfControls = document.getElementById('rta-fs-tf-controls-group');
        if (fsTfControls) {
            fsTfControls.style.display = isTfMode ? 'inline-flex' : 'none';
        }
        const fsOctGroup = document.getElementById('rta-fs-octave-group');
        if (fsOctGroup) {
            fsOctGroup.style.display = isTfMode ? 'none' : 'inline-flex';
        }
        const fsWeightGroup = document.querySelector('.rta-fs-segmented[title="Weighting Filter"]');
        if (fsWeightGroup) {
            fsWeightGroup.style.display = isTfMode ? 'none' : 'inline-flex';
        }
        const fsSnapBtn = document.getElementById('btn-rta-fs-snap');
        if (fsSnapBtn) {
            fsSnapBtn.style.display = isTfMode ? 'none' : 'inline-flex';
        }
        const tf = window.TransferFunctionEngine;
        const hwBadge = document.getElementById('rta-fs-hardware-badge');
        if (hwBadge && tf) {
            if (tf.isUsbHardware) {
                hwBadge.textContent = `${tf.deviceName} (${tf.hasTwoChannels ? '2-CH' : '1-CH'} ${Math.round(tf.sampleRate / 1000)}k)`.toUpperCase();
                hwBadge.style.color = '#00FF9D';
            } else {
                hwBadge.textContent = tf.hasTwoChannels ? '2-CH STEREO READY' : '1-CH (VIRTUAL REF)';
                hwBadge.style.color = tf.hasTwoChannels ? '#00FF9D' : '#FFB300';
            }
        }

        // 15. Transfer Function Matrix & Input Routing Visibility in Drawer
        const inputSectionTitle = document.getElementById('rta-input-section-title');
        if (inputSectionTitle) {
            inputSectionTitle.textContent = isTfMode ? 'Audio Hardware & I/O Matrix' : 'Audio Input Microphone';
        }
        const singleChNotice = document.getElementById('rta-single-ch-notice');
        if (singleChNotice) {
            singleChNotice.style.display = isTfMode ? 'none' : 'block';
        }
        const fsTfMatrixSection = document.getElementById('rta-fs-tf-matrix-section');
        if (fsTfMatrixSection) {
            fsTfMatrixSection.style.display = isTfMode ? 'block' : 'none';
        }
        const btnTfVloop = document.getElementById('btn-fs-tf-vloop');
        if (btnTfVloop && tf) {
            btnTfVloop.textContent = tf.isVirtualLoopback ? 'ON' : 'OFF';
            btnTfVloop.classList.toggle('active', tf.isVirtualLoopback);
        }
        if (typeof updateChannelAssignUI === 'function') {
            updateChannelAssignUI();
        }

        // 16. Mic Sensitivity / Gain Trim Sync
        const micTrimSliderEl = document.getElementById('rta-mic-trim-slider');
        const micTrimValEl = document.getElementById('rta-mic-trim-val');
        const micTrimStatusEl = document.getElementById('rta-mic-trim-status');
        const fsQuickTrimLabelEl = document.getElementById('fs-tf-mic-trim-label');
        if (micTrimSliderEl) micTrimSliderEl.value = micGainTrimDb;
        if (micTrimValEl) micTrimValEl.textContent = (micGainTrimDb >= 0 ? '+' : '') + micGainTrimDb.toFixed(1);
        if (micTrimStatusEl) {
            if (micGainTrimDb === 0) {
                micTrimStatusEl.textContent = '0.0 dB (UNITY)';
                micTrimStatusEl.style.color = '#00FF9D';
            } else if (micGainTrimDb > 0) {
                micTrimStatusEl.textContent = `+${micGainTrimDb.toFixed(1)} dB (BOOST)`;
                micTrimStatusEl.style.color = '#00f2fe';
            } else {
                micTrimStatusEl.textContent = `${micGainTrimDb.toFixed(1)} dB (PAD)`;
                micTrimStatusEl.style.color = '#FFB800';
            }
        }
        if (fsQuickTrimLabelEl) {
            fsQuickTrimLabelEl.textContent = (micGainTrimDb >= 0 ? '+' : '') + micGainTrimDb.toFixed(1) + 'dB';
        }

        updateWatermarkButtons();
        if (typeof updateSplWatermarkButtons === 'function') {
            updateSplWatermarkButtons();
        }
        syncRunStopButtons(isAnalyzing);
    }

    // Helper to switch 3-Tab Precision DSP Drawer tabs
    function switchFsDrawerTab(tabName) {
        if (!fsDrawer || !tabName) return;
        fsDrawer.setAttribute('data-active-tab', tabName);
        const tabBtns = fsDrawer.querySelectorAll('.rta-drawer-tab-btn');
        tabBtns.forEach(btn => {
            const isMatch = btn.getAttribute('data-drawer-tab') === tabName;
            btn.classList.toggle('active', isMatch);
            btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        });
        const drawerBody = fsDrawer.querySelector('.rta-fs-drawer-body');
        if (drawerBody) drawerBody.scrollTop = 0;
    }

    const drawerTabBtns = document.querySelectorAll('.rta-drawer-tab-btn');
    drawerTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tab = btn.getAttribute('data-drawer-tab');
            switchFsDrawerTab(tab);
        });
    });

    // Connect Fullscreen Mode Switcher Pills
    const fsModeBtns = document.querySelectorAll('.fs-mode-btn');
    fsModeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const mode = btn.getAttribute('data-mode');
            if (mode === 'waterfall' && !window.isPremiumActive('spectrogram')) {
                window.showProUpgradeModal('spectrogram');
                return;
            }
            currentMode = mode;
            if (currentMode === 'tf' && window.TransferFunctionEngine && !window.TransferFunctionEngine.isRunning) {
                window.TransferFunctionEngine.start();
            } else if (currentMode !== 'tf' && window.TransferFunctionEngine && window.TransferFunctionEngine.isRunning) {
                window.TransferFunctionEngine.stop();
            }
            if (currentMode === 'tf') {
                switchFsDrawerTab('io');
            }
            modeBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-mode') === currentMode));
            syncFullscreenHudWithEngineState();
        });
    });

    // Connect Fullscreen Octave Banding Pills
    const fsOctaveBtns = document.querySelectorAll('.fs-octave-btn');
    fsOctaveBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fraction = parseInt(btn.getAttribute('data-octave')) || 3;
            currentOctaveFraction = fraction;
            currentOctaveFreqs = OCTAVE_TABLES[fraction] || ISO_1_3_FREQS;
            resetPeakHoldData();
            currentRtaLevels = new Float32Array(currentOctaveFreqs.length).fill(-150);
            lockedRtaBandIdx = -1;
            candidateRtaBandIdx = -1;

            octaveBtns.forEach(b => {
                const f = parseInt(b.getAttribute('data-octave')) || 3;
                b.classList.toggle('active', f === currentOctaveFraction);
            });
            if (octaveBadge) octaveBadge.textContent = OCTAVE_LABELS[fraction] || `${fraction} BANDS`;
            syncFullscreenHudWithEngineState();
            renderFrequencyLabels();
        });
    });

    // Connect Fullscreen Weighting Pills
    const fsWeightBtns = document.querySelectorAll('.fs-weight-btn, .fs-drawer-weight-btn');
    fsWeightBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentWeighting = (btn.getAttribute('data-weight') || 'a').toLowerCase();
            resetPeakHoldData();
            weightBtns.forEach(b => b.classList.toggle('active', (b.getAttribute('data-weight') || '').toLowerCase() === currentWeighting));
            syncFullscreenHudWithEngineState();
        });
    });

    // Connect Fullscreen Pink Noise Button
    const fsPinkNoiseBtn = document.getElementById('btn-rta-fs-pink-noise') || document.getElementById('btn-rta-pink-noise');
    if (fsPinkNoiseBtn) {
        fsPinkNoiseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleRtaPinkNoise();
            syncFullscreenHudWithEngineState();
        });
    }

    // Connect Fullscreen Snapshot Button
    const fsSnapBtn = document.getElementById('btn-rta-fs-snap');
    if (fsSnapBtn) {
        fsSnapBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            captureNewSnapshot();
        });
    }

    // Connect Fullscreen Band Sum Mode in Drawer
    const fsBandModeBtns = document.querySelectorAll('.fs-drawer-band-mode-btn');
    fsBandModeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentBandMode = btn.getAttribute('data-bandmode') || 'energy';
            resetPeakHoldData();
            bandModeBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-bandmode') === currentBandMode));
            syncFullscreenHudWithEngineState();
        });
    });

    // Connect Fullscreen Averaging Speed Presets in Drawer
    const fsSpeedBtns = document.querySelectorAll('.fs-drawer-speed-btn');
    fsSpeedBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const spd = btn.getAttribute('data-speed');
            if (spd === 'fast') averagingFactor = 1;
            else if (spd === 'slow') averagingFactor = 4;
            else if (spd === 'inf') averagingFactor = 10;

            resetPeakHoldData();
            if (avgSlider) avgSlider.value = averagingFactor;
            if (avgVal) avgVal.textContent = averagingFactor;
            syncFullscreenHudWithEngineState();
        });
    });

    // Connect Fullscreen Calibration Slider & Quick Presets in Drawer
    if (fsCalSlider) {
        fsCalSlider.addEventListener('input', (e) => {
            calibrationOffset = parseFloat(e.target.value);
            if (calSlider) calSlider.value = calibrationOffset;
            if (calValue) calValue.textContent = calibrationOffset;
            syncFullscreenHudWithEngineState();
        });
    }

    const calPresetBtns = document.querySelectorAll('.rta-cal-preset-btn');
    calPresetBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const presetVal = parseFloat(btn.getAttribute('data-cal-preset'));
            if (!isNaN(presetVal)) {
                calibrationOffset = presetVal;
                if (fsCalSlider) fsCalSlider.value = calibrationOffset;
                if (calSlider) calSlider.value = calibrationOffset;
                if (calValue) calValue.textContent = calibrationOffset;
                resetPeakHoldData();
                syncFullscreenHudWithEngineState();
            }
        });
    });

    // Connect Fullscreen Peak Hold Controls in Drawer
    if (fsPeakToggle) {
        fsPeakToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            peakHoldEnabled = !peakHoldEnabled;
            if (peakToggle) {
                peakToggle.classList.toggle('active', peakHoldEnabled);
                peakToggle.textContent = peakHoldEnabled ? 'ON' : 'OFF';
            }
            syncFullscreenHudWithEngineState();
        });
    }

    if (fsPeakReset) {
        fsPeakReset.addEventListener('click', (e) => {
            e.stopPropagation();
            resetPeakHoldData();
            if (peakReset) {
                peakReset.classList.add('active');
                setTimeout(() => peakReset.classList.remove('active'), 200);
            }
            fsPeakReset.classList.add('active');
            setTimeout(() => fsPeakReset.classList.remove('active'), 200);
        });
    }

    // Connect Dominant Frequency Watermark Toggles (Normal Setup & Fullscreen Drawer)
    function toggleDominantWatermark() {
        showDominantWatermark = !showDominantWatermark;
        safeStorage.setItem('rta_show_dom_watermark', showDominantWatermark ? 'true' : 'false');
        updateWatermarkButtons();
        if (!isAnalyzing) drawIdleState();
    }

    function updateWatermarkButtons() {
        const watermarkBtns = document.querySelectorAll('.btn-rta-toggle-watermark');
        watermarkBtns.forEach(btn => {
            btn.classList.toggle('active', showDominantWatermark);
            const labelSpan = btn.querySelector('.watermark-label-text');
            if (labelSpan) {
                labelSpan.textContent = showDominantWatermark ? 'FREQ: ON' : 'FREQ: OFF';
            } else {
                btn.textContent = showDominantWatermark ? 'FREQ: ON' : 'FREQ: OFF';
            }
        });
    }

    const watermarkBtns = document.querySelectorAll('.btn-rta-toggle-watermark');
    watermarkBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDominantWatermark();
        });
    });
    updateWatermarkButtons();

    // Connect Live SPL Watermark Toggles
    function toggleSplWatermark() {
        showSplWatermark = !showSplWatermark;
        safeStorage.setItem('rta_show_spl_watermark', showSplWatermark ? 'true' : 'false');
        updateSplWatermarkButtons();
        if (!isAnalyzing) drawIdleState();
    }

    function updateSplWatermarkButtons() {
        const splWatermarkBtns = document.querySelectorAll('.btn-rta-toggle-spl-watermark');
        splWatermarkBtns.forEach(btn => {
            btn.classList.toggle('active', showSplWatermark);
            const labelSpan = btn.querySelector('.spl-watermark-label-text');
            if (labelSpan) {
                labelSpan.textContent = showSplWatermark ? 'SPL: ON' : 'SPL: OFF';
            } else {
                btn.textContent = showSplWatermark ? 'SPL: ON' : 'SPL: OFF';
            }
        });
    }

    const splWatermarkBtns = document.querySelectorAll('.btn-rta-toggle-spl-watermark');
    splWatermarkBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSplWatermark();
        });
    });
    updateSplWatermarkButtons();

    // Connect Fullscreen Snapshot Clear in Drawer
    if (fsClearSnapsBtn) {
        fsClearSnapsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!snapshots.some(Boolean)) return;
            if (confirm("Clear all reference memory traces?")) {
                snapshots = [];
                saveConfigToCloud('rta_snapshots', { snapshots });
                renderSnapshotSlots();
            }
        });
    }

    // Connect Dedicated Single Trace Delete Buttons (Trace A & Trace B)
    const traceDeleteBtns = document.querySelectorAll('.btn-delete-trace');
    traceDeleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const slotIdx = parseInt(btn.getAttribute('data-slot')) || 0;
            if (snapshots[slotIdx]) {
                snapshots[slotIdx] = null;
                if (!snapshots.some(Boolean)) {
                    snapshots = [];
                }
                saveConfigToCloud('rta_snapshots', { snapshots });
                renderSnapshotSlots();
            }
        });
    });

    // Connect Trace A and Trace B Buttons in Drawer
    const traceSlotBtns = document.querySelectorAll('.rta-trace-slot-btn');
    traceSlotBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const slotIdx = parseInt(btn.getAttribute('data-slot')) || 0;
            
            // Allow Slot 0 (Trace A) for free, check unlock for other slots
            if (!isSnapshotSlotUnlocked(slotIdx)) {
                pendingSnapshotCaptureSlot = slotIdx;
                window.showProUpgradeModal(`snapshot_slot_${slotIdx}`);
                return;
            }

            const existingSlot = snapshots[slotIdx];
            if (existingSlot) {
                // If it already exists, toggle visibility (even if analyzer is paused)
                existingSlot.visible = !existingSlot.visible;
                saveConfigToCloud('rta_snapshots', { snapshots });
                renderSnapshotSlots();
                return;
            }

            if (!isInitialized) {
                const startBtn = document.getElementById('btn-start-analyzer');
                if (startBtn) startBtn.click();
                return;
            }

            // Capture current RTA into this slot
            const defaultTraceColors = ['#00FFFF', '#FF00FF', '#FFE600', '#00FF66'];
            const newSnap = {
                rta: Array.from(currentRtaLevels),
                fraction: currentOctaveFraction,
                fft: Array.from(dataArray),
                color: SNAPSHOT_COLORS[slotIdx] || defaultTraceColors[slotIdx] || '#00FFFF',
                visible: true,
                id: Date.now()
            };
            snapshots[slotIdx] = newSnap;
            saveConfigToCloud('rta_snapshots', { snapshots });
            renderSnapshotSlots();
        });

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const slotIdx = parseInt(btn.getAttribute('data-slot')) || 0;
            if (snapshots[slotIdx]) {
                snapshots[slotIdx] = null;
                if (!snapshots.some(Boolean)) {
                    snapshots = [];
                }
                saveConfigToCloud('rta_snapshots', { snapshots });
                renderSnapshotSlots();
            }
        });
    });

    // Connect Drawer Open / Close Triggers
    if (fsOpenDrawerBtn) {
        fsOpenDrawerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFsDrawer();
        });
    }

    const ribbonDspBtn = document.getElementById('btn-rta-ribbon-dsp');
    if (ribbonDspBtn) {
        ribbonDspBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFsDrawer();
        });
    }

    if (fsCloseDrawerBtn) {
        fsCloseDrawerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeFsDrawer();
        });
    }

    if (fsDrawerBackdrop) {
        fsDrawerBackdrop.addEventListener('click', (e) => {
            e.stopPropagation();
            closeFsDrawer();
        });
    }

    // Connect Minimize / Restore Dock Triggers
    if (fsMinimizeBtn) {
        fsMinimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const wrapper = canvas.parentElement;
            if (fsDock) fsDock.classList.add('minimized');
            if (wrapper) wrapper.classList.add('hud-minimized');
        });
    }

    if (fsRestoreBtn) {
        fsRestoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const wrapper = canvas.parentElement;
            if (fsDock) fsDock.classList.remove('minimized');
            if (wrapper) wrapper.classList.remove('hud-minimized');
        });
    }

    // Connect Layout Selector Pills (HUD Dock & Precision Drawer)
    const fsLayoutBtns = document.querySelectorAll('.fs-layout-btn, .fs-drawer-layout-btn');
    fsLayoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const layout = btn.getAttribute('data-layout') || 'single';
            currentLayout = layout;
            safeStorage.setItem('soundengg_rta_layout', layout);
            syncFullscreenHudWithEngineState();
            if (isFullscreenActive && !isAnalyzing && !isStartingAnalyzer) {
                resumeRtaAudioEngine();
            } else if (!isAnalyzing) {
                drawIdleState();
            } else if (!rafID) {
                lastFrameTime = performance.now();
                rafID = requestAnimationFrame(draw);
            }
        });
    });

    // --- Phase 6: Acoustic Measurement Report & Data Export (delegated to rtaDataExport.js) ---
    function getExportState() {
        return {
            canvas,
            currentMode,
            currentOctaveFraction,
            currentOctaveFreqs,
            currentWeighting,
            averagingFactor,
            inputRmsDbfs,
            calibrationOffset,
            domFreqDisplay,
            peakFlagSmoothedDb,
            currentLayout,
            viewMinFreq,
            viewMaxFreq,
            snapshots,
            isSnapshotSlotUnlocked,
            currentRtaLevels,
            audioCtx,
            analyser,
            bufferLength,
            dataArray,
            getIECWeighting,
            getTiltOffset,
            isIOSPlatform,
            getAudioSessionPlugin
        };
    }

    function exportSpectrumPng(btnEl) {
        if (window.RtaDataExport && typeof window.RtaDataExport.buildAndExportSpectrumPng === 'function') {
            window.RtaDataExport.buildAndExportSpectrumPng(getExportState(), btnEl);
        }
    }

    function exportSpectrumCsv(btnEl) {
        if (window.RtaDataExport && typeof window.RtaDataExport.buildAndExportSpectrumCsv === 'function') {
            window.RtaDataExport.buildAndExportSpectrumCsv(getExportState(), btnEl);
        }
    }

    // Connect Export Action Buttons
    const btnExportPng = document.getElementById('btn-rta-export-png');
    if (btnExportPng) {
        btnExportPng.addEventListener('click', (e) => {
            e.stopPropagation();
            exportSpectrumPng(btnExportPng);
        });
    }

    const btnExportCsv = document.getElementById('btn-rta-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', (e) => {
            e.stopPropagation();
            exportSpectrumCsv(btnExportCsv);
        });
    }
    // --- Dual-Channel Transfer Function Event Listeners ---
    function updateChannelAssignUI() {
        const tf = window.TransferFunctionEngine;
        if (!tf) return;
        const fsChAssignBtns = document.querySelectorAll('.fs-ch-assign-btn');
        fsChAssignBtns.forEach(b => {
            const bCh = parseInt(b.getAttribute('data-channel'));
            const bRole = b.getAttribute('data-role');
            const isAct = (bRole === 'meas' && tf.measChannel === bCh) || 
                          (bRole === 'ref' && tf.refChannel === bCh);
            b.classList.toggle('active', isAct);
        });

        const ch1RoleBadge = document.getElementById('fs-ch1-role-badge');
        if (ch1RoleBadge) {
            const isMeas = (tf.measChannel === 0);
            ch1RoleBadge.textContent = isMeas ? '🎙️ MEAS MIC' : '⚡ REF SIGNAL';
            ch1RoleBadge.style.color = isMeas ? '#00FFFF' : '#FF00FF';
            ch1RoleBadge.style.background = isMeas ? 'rgba(0,255,255,0.1)' : 'rgba(255,0,255,0.1)';
        }

        const ch2RoleBadge = document.getElementById('fs-ch2-role-badge');
        if (ch2RoleBadge) {
            const isRef = (tf.refChannel === 1);
            ch2RoleBadge.textContent = isRef ? '⚡ REF SIGNAL' : '🎙️ MEAS MIC';
            ch2RoleBadge.style.color = isRef ? '#FF00FF' : '#00FFFF';
            ch2RoleBadge.style.background = isRef ? 'rgba(255,0,255,0.1)' : 'rgba(0,255,255,0.1)';
        }
    }

    const fsChAssignBtns = document.querySelectorAll('.fs-ch-assign-btn');
    fsChAssignBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tf = window.TransferFunctionEngine;
            if (!tf) return;
            const ch = parseInt(btn.getAttribute('data-channel'));
            const role = btn.getAttribute('data-role');

            if (role === 'meas') {
                tf.measChannel = ch;
                tf.refChannel = (ch === 0) ? 1 : 0;
            } else {
                tf.refChannel = ch;
                tf.measChannel = (ch === 0) ? 1 : 0;
            }

            updateChannelAssignUI();
            tf.resetAveraging();
        });
    });

    // 1-Tap Swap Mic ⇄ Ref Channels Button
    const btnSwapChannels = document.getElementById('btn-fs-tf-swap-channels');
    if (btnSwapChannels) {
        btnSwapChannels.addEventListener('click', (e) => {
            e.stopPropagation();
            const tf = window.TransferFunctionEngine;
            if (!tf) return;
            const prevMeas = tf.measChannel;
            tf.measChannel = tf.refChannel;
            tf.refChannel = prevMeas;
            updateChannelAssignUI();
            tf.resetAveraging();
            const toastFn = window.showToastNotification || window.showSoundEnggToast;
            if (toastFn) toastFn(`Routed: Input ${tf.measChannel + 1} = Mic, Input ${tf.refChannel + 1} = Reference`);
        });
    }

    // Quick switch to TF from Single-Channel RTA Notice in Drawer
    const btnQuickSwitchTf = document.getElementById('btn-quick-switch-tf');
    if (btnQuickSwitchTf) {
        btnQuickSwitchTf.addEventListener('click', (e) => {
            e.stopPropagation();
            currentMode = 'tf';
            if (window.TransferFunctionEngine && !window.TransferFunctionEngine.isRunning) {
                window.TransferFunctionEngine.start();
            }
            const fsModeBtns = document.querySelectorAll('.fs-mode-btn');
            fsModeBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-mode') === 'tf'));
            syncFullscreenHudWithEngineState();
            const toastFn = window.showToastNotification || window.showSoundEnggToast;
            if (toastFn) toastFn('Switched to Dual-Channel Transfer Function (TF)');
        });
    }

    const btnCh1Invert = document.getElementById('btn-fs-ch1-invert');
    if (btnCh1Invert) {
        btnCh1Invert.addEventListener('click', (e) => {
            e.stopPropagation();
            const tf = window.TransferFunctionEngine;
            if (!tf) return;
            tf.measInvert = !tf.measInvert;
            btnCh1Invert.textContent = tf.measInvert ? 'Ø INV' : 'Ø NORM';
            btnCh1Invert.classList.toggle('active', tf.measInvert);
            tf.resetAveraging();
        });
    }

    const btnCh2Invert = document.getElementById('btn-fs-ch2-invert');
    if (btnCh2Invert) {
        btnCh2Invert.addEventListener('click', (e) => {
            e.stopPropagation();
            const tf = window.TransferFunctionEngine;
            if (!tf) return;
            tf.refInvert = !tf.refInvert;
            btnCh2Invert.textContent = tf.refInvert ? 'Ø INV' : 'Ø NORM';
            btnCh2Invert.classList.toggle('active', tf.refInvert);
            tf.resetAveraging();
        });
    }

    const fsTfGenOutBtns = document.querySelectorAll('.fs-tf-gen-out-btn');
    fsTfGenOutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tf = window.TransferFunctionEngine;
            if (!tf) return;
            tf.generatorRouting = btn.getAttribute('data-out') || 'both';
            fsTfGenOutBtns.forEach(b => b.classList.toggle('active', b === btn));
            if (tf.generatorActive) {
                tf.startGenerator(tf.generatorType);
            }
        });
    });

    const btnTfVloop = document.getElementById('btn-fs-tf-vloop');
    if (btnTfVloop) {
        btnTfVloop.addEventListener('click', (e) => {
            e.stopPropagation();
            const tf = window.TransferFunctionEngine;
            if (!tf) return;
            tf.isVirtualLoopback = !tf.isVirtualLoopback;
            btnTfVloop.textContent = tf.isVirtualLoopback ? 'ON' : 'OFF';
            btnTfVloop.classList.toggle('active', tf.isVirtualLoopback);
            tf.resetAveraging();
        });
    }

    async function handleFindDelayAction() {
        const tf = window.TransferFunctionEngine;
        if (!tf) return;
        const toastFn = window.showToastNotification || window.showSoundEnggToast;

        if (!tf.isRunning) {
            if (typeof toastFn === 'function') toastFn('Starting Transfer Function engine...');
            await tf.start();
            await new Promise(r => setTimeout(r, 250));
        }

        const mDbfs = tf.measPeakDbfs;
        const rDbfs = tf.refPeakDbfs;

        if (!tf.hasTwoChannels && !isRtaPinkNoiseActive && !tf.virtualRefActive) {
            if (typeof toastFn === 'function') {
                toastFn(`⚠️ Tap PINK button to start Pink Noise for Virtual Loopback reference.`);
            }
            return;
        }

        if (tf.hasTwoChannels && rDbfs < -60) {
            if (typeof toastFn === 'function') {
                toastFn(`⚠️ Low Ref Signal on Input 2 (${rDbfs.toFixed(1)} dBFS). Send Pink Noise / Loopback to Input 2.`);
            }
            return;
        }

        if (mDbfs < -60) {
            if (typeof toastFn === 'function') {
                toastFn(`⚠️ Low Mic Signal on Input 1 (${mDbfs.toFixed(1)} dBFS). Increase mic preamp gain.`);
            }
            return;
        }

        const locked = tf.lockDelay();
        if (typeof toastFn === 'function') {
            if (!tf.hasTwoChannels && !tf.isUsbHardware) {
                toastFn(`Delay Locked: ${locked.toFixed(2)} ms (Virtual Loopback)`);
            } else {
                toastFn(`Delay Locked: ${locked.toFixed(2)} ms (${tf.peakDistanceM.toFixed(2)} m / ${tf.peakDistanceFt.toFixed(1)} ft) ✓`);
            }
        }
    }

    const btnFindDelayHud = document.getElementById('btn-fs-tf-find-delay');
    if (btnFindDelayHud) {
        btnFindDelayHud.addEventListener('click', (e) => {
            e.stopPropagation();
            handleFindDelayAction();
        });
    }

    const btnFindDelayDrawer = document.getElementById('btn-fs-tf-find-delay-drawer');
    if (btnFindDelayDrawer) {
        btnFindDelayDrawer.addEventListener('click', (e) => {
            e.stopPropagation();
            handleFindDelayAction();
        });
    }

    // --- Acoustic Pulse Delay Auto-Locator (PRO) ---
    async function handleAcousticPulseAction() {
        const tf = window.TransferFunctionEngine;
        if (!tf) return;

        const isPro = window.isPremiumActive('pulse_delay');
        if (!isPro) {
            if (typeof window.showProUpgradeModal === 'function') {
                window.showProUpgradeModal('pulse_delay');
            }
            return;
        }

        const toastFn = window.showToastNotification || console.log;
        toastFn('⚡ Emitting acoustic pulse ping...');

        const btnPulseHud = document.getElementById('btn-fs-tf-pulse-ping');
        const btnPulseDrawer = document.getElementById('btn-fs-tf-pulse-drawer');
        if (btnPulseHud) btnPulseHud.classList.add('pulse-active');
        if (btnPulseDrawer) btnPulseDrawer.classList.add('pulse-active');

        tf.runAcousticPulseFinder((res) => {
            if (btnPulseHud) btnPulseHud.classList.remove('pulse-active');
            if (btnPulseDrawer) btnPulseDrawer.classList.remove('pulse-active');

            toastFn(`⚡ Pulse Delay: ${res.delayMs.toFixed(2)} ms (${res.distM.toFixed(2)} m / ${res.distFt.toFixed(1)} ft) ✓`);
            
            const lockedEl = document.getElementById('fs-tf-locked-delay');
            const readoutEl = document.getElementById('fs-tf-delay-readout');
            if (lockedEl) lockedEl.textContent = `${res.delayMs.toFixed(2)} ms`;
            if (readoutEl) readoutEl.textContent = `${res.delayMs.toFixed(2)} ms (${res.distM.toFixed(1)}m)`;
        }, (err) => {
            if (btnPulseHud) btnPulseHud.classList.remove('pulse-active');
            if (btnPulseDrawer) btnPulseDrawer.classList.remove('pulse-active');
            toastFn(`⚠️ Pulse Finder: ${err}`);
        });
    }
    window.handleAcousticPulseAction = handleAcousticPulseAction;

    const btnTfAutotrack = document.getElementById('btn-fs-tf-autotrack');
    if (btnTfAutotrack) {
        btnTfAutotrack.addEventListener('click', (e) => {
            e.stopPropagation();
            const tf = window.TransferFunctionEngine;
            if (!tf) return;
            tf.autoTrackingDelay = !tf.autoTrackingDelay;
            btnTfAutotrack.textContent = tf.autoTrackingDelay ? 'TRACK: ON' : 'TRACK: OFF';
            btnTfAutotrack.classList.toggle('active', tf.autoTrackingDelay);
        });
    }

    const fsTfDelayTrimBtns = document.querySelectorAll('.fs-tf-delay-trim');
    fsTfDelayTrimBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tf = window.TransferFunctionEngine;
            if (!tf) return;
            const trim = parseFloat(btn.getAttribute('data-trim')) || 0;
            tf.trimDelay(trim);
        });
    });

    const btnTfDelayZero = document.getElementById('btn-fs-tf-delay-zero');
    if (btnTfDelayZero) {
        btnTfDelayZero.addEventListener('click', (e) => {
            e.stopPropagation();
            const tf = window.TransferFunctionEngine;
            if (!tf) return;
            tf.setDelayMs(0);
        });
    }

    // --- 2-Step Speaker Delay Alignment Wizard (Reference Speaker vs Target Speaker) ---
    let spkRefTimeMs = null;
    let spkTargetTimeMs = null;

    function updateSpkAlignmentWizardUI() {
        const refBtn = document.getElementById('btn-spk-ping-ref');
        const targetBtn = document.getElementById('btn-spk-ping-target');
        const refTimeEl = document.getElementById('spk-ping-ref-time');
        const targetTimeEl = document.getElementById('spk-ping-target-time');
        const delayValEl = document.getElementById('spk-align-delay-val');
        const distValEl = document.getElementById('spk-align-dist-val');
        const applyBtn = document.getElementById('btn-spk-align-apply');
        const hintEl = document.getElementById('spk-align-hint');

        if (refTimeEl) {
            refTimeEl.textContent = (spkRefTimeMs !== null) ? `t₁: ${spkRefTimeMs.toFixed(1)} ms ✓` : 'TAP TO PING (t₁)';
        }
        if (refBtn) {
            refBtn.classList.toggle('active', spkRefTimeMs !== null);
        }

        if (targetTimeEl) {
            targetTimeEl.textContent = (spkTargetTimeMs !== null) ? `t₂: ${spkTargetTimeMs.toFixed(1)} ms ✓` : 'TAP TO PING (t₂)';
        }
        if (targetBtn) {
            targetBtn.classList.toggle('active', spkTargetTimeMs !== null);
        }

        if (spkRefTimeMs !== null && spkTargetTimeMs !== null) {
            const deltaMs = Math.abs(spkTargetTimeMs - spkRefTimeMs);
            const tf = window.TransferFunctionEngine;
            const tempC = tf ? tf.temperatureC : 20.0;
            const c = (331.3 + 0.606 * tempC);
            const distM = (deltaMs / 1000.0) * c;
            const distFt = distM * 3.28084;

            if (delayValEl) {
                delayValEl.textContent = `${deltaMs.toFixed(2)} ms`;
            }
            if (distValEl) {
                distValEl.textContent = `${distM.toFixed(2)} m / ${distFt.toFixed(1)} ft`;
            }
            if (applyBtn) {
                applyBtn.style.display = 'inline-flex';
            }
            if (hintEl) {
                hintEl.style.display = 'block';
                if (spkRefTimeMs > spkTargetTimeMs) {
                    hintEl.textContent = `💡 Delay Target Speaker by ${deltaMs.toFixed(1)} ms so it aligns to Reference Speaker.`;
                } else if (spkTargetTimeMs > spkRefTimeMs) {
                    hintEl.textContent = `💡 Delay Reference Speaker by ${deltaMs.toFixed(1)} ms so it aligns to Target Speaker.`;
                } else {
                    hintEl.textContent = `💡 Perfect arrival synchronization (0.0 ms offset).`;
                }
            }
        } else {
            if (delayValEl) delayValEl.textContent = '-- ms';
            if (distValEl) distValEl.textContent = '-- m / -- ft';
            if (applyBtn) applyBtn.style.display = 'none';
            if (hintEl) hintEl.style.display = 'none';
        }
    }

    async function pingSpeaker(step) {
        const tf = window.TransferFunctionEngine;
        if (!tf) return;
        const isPro = window.isPremiumActive('pulse_delay');
        if (!isPro) {
            if (typeof window.showProUpgradeModal === 'function') {
                window.showProUpgradeModal('pulse_delay');
            }
            return;
        }

        const toastFn = window.showToastNotification || console.log;
        const btnId = (step === 'ref') ? 'btn-spk-ping-ref' : 'btn-spk-ping-target';
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.add('pulse-active');

        toastFn(`⚡ Emitting pulse for ${step === 'ref' ? 'Reference' : 'Target'} Speaker...`);

        tf.runAcousticPulseFinder((res) => {
            if (btn) btn.classList.remove('pulse-active');
            if (step === 'ref') {
                spkRefTimeMs = res.delayMs;
                toastFn(`✓ Reference Speaker arrival: ${res.delayMs.toFixed(1)} ms`);
            } else {
                spkTargetTimeMs = res.delayMs;
                toastFn(`✓ Target Speaker arrival: ${res.delayMs.toFixed(1)} ms`);
            }
            updateSpkAlignmentWizardUI();
        }, (err) => {
            if (btn) btn.classList.remove('pulse-active');
            toastFn(`⚠️ Speaker Pulse: ${err}`);
        });
    }

    const btnSpkPingRef = document.getElementById('btn-spk-ping-ref');
    if (btnSpkPingRef) {
        btnSpkPingRef.addEventListener('click', (e) => {
            e.stopPropagation();
            pingSpeaker('ref');
        });
    }

    const btnSpkPingTarget = document.getElementById('btn-spk-ping-target');
    if (btnSpkPingTarget) {
        btnSpkPingTarget.addEventListener('click', (e) => {
            e.stopPropagation();
            pingSpeaker('target');
        });
    }

    const btnSpkAlignReset = document.getElementById('btn-spk-align-reset');
    if (btnSpkAlignReset) {
        btnSpkAlignReset.addEventListener('click', (e) => {
            e.stopPropagation();
            spkRefTimeMs = null;
            spkTargetTimeMs = null;
            updateSpkAlignmentWizardUI();
        });
    }

    const btnSpkAlignApply = document.getElementById('btn-spk-align-apply');
    if (btnSpkAlignApply) {
        btnSpkAlignApply.addEventListener('click', (e) => {
            e.stopPropagation();
            if (spkRefTimeMs === null || spkTargetTimeMs === null) return;
            const deltaMs = Math.abs(spkTargetTimeMs - spkRefTimeMs);
            const tf = window.TransferFunctionEngine;
            if (tf) {
                tf.setDelayMs(deltaMs);
                const toastFn = window.showToastNotification || console.log;
                toastFn(`✓ Applied ${deltaMs.toFixed(2)} ms delay to Transfer Function`);
            }
        });
    }

    // --- Mic Calibration Event Listeners ---
    const micCalModal = document.getElementById('mic-cal-modal');
    const btnMicCalModal = document.getElementById('btn-mic-cal-modal');
    const btnCloseMicCal = document.getElementById('btn-close-mic-cal');
    const calDropZone = document.getElementById('cal-drop-zone');
    const calFileInput = document.getElementById('cal-file-input');
    const calTextInput = document.getElementById('cal-text-input');
    const btnSaveCal = document.getElementById('btn-save-cal');
    const btnClearCal = document.getElementById('btn-clear-cal');
    const calStatusBadge = document.getElementById('cal-status-badge');
    const calDetails = document.getElementById('cal-details');

    if (btnMicCalModal) {
        btnMicCalModal.addEventListener('click', () => {
            if (!window.isPremiumActive('mic_calibration')) {
                window.showProUpgradeModal('mic_calibration');
                return;
            }
            openModal(micCalModal);
        });
    }

    if (btnCloseMicCal) {
        btnCloseMicCal.addEventListener('click', () => closeModal(micCalModal));
    }

    if (calDropZone) {
        calDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            calDropZone.classList.add('dragover');
        });

        calDropZone.addEventListener('dragleave', () => {
            calDropZone.classList.remove('dragover');
        });

        calDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            calDropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) loadCalFile(file);
        });

        calDropZone.addEventListener('click', () => {
            calFileInput.click();
        });
    }

    if (calFileInput) {
        calFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) loadCalFile(file);
        });
    }

    function loadCalFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            calTextInput.value = e.target.result;
            if (calDropZone) {
                calDropZone.style.borderColor = 'var(--primary)';
                setTimeout(() => calDropZone.style.borderColor = '', 1000);
            }
        };
        reader.readAsText(file);
    }

    if (btnSaveCal) {
        btnSaveCal.addEventListener('click', async () => {
            const text = calTextInput.value.trim();
            if (!text) {
                alert("Please paste value pairs or drop a calibration file first.");
                return;
            }

            const parsed = parseCalibrationData(text);
            if (parsed.length === 0) {
                alert("No valid calibration points found. Please verify the file format (frequency offset).");
                return;
            }

            calProfile = parsed;
            calEnabled = true;
            precomputeCalibrationOffsets();

            if (calStatusBadge) {
                calStatusBadge.textContent = "ACTIVE";
                calStatusBadge.className = "cal-status-badge active";
            }
            if (calDetails) {
                calDetails.textContent = `${parsed.length} points applied`;
            }

            await saveConfigToCloud('mic_calibration', {
                text: text,
                enabled: true,
                pointsCount: parsed.length
            });

            closeModal(micCalModal);
        });
    }

    if (btnClearCal) {
        btnClearCal.addEventListener('click', async () => {
            calProfile = [];
            calOffsets = null;
            calEnabled = false;
            calTextInput.value = '';
            
            if (calStatusBadge) {
                calStatusBadge.textContent = "NO PROFILE ACTIVE";
                calStatusBadge.className = "cal-status-badge inactive";
            }
            if (calDetails) {
                calDetails.textContent = "Standard response applied (flat)";
            }

            await saveConfigToCloud('mic_calibration', {
                text: '',
                enabled: false,
                pointsCount: 0
            });

            closeModal(micCalModal);
        });
    }

    async function pullCalibrationProfile() {
        if (!window.isUserPro || !window.supabaseClient) return;
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) return;

            const { data, error } = await window.supabaseClient
                .from('user_configs')
                .select('data')
                .eq('user_id', session.user.id)
                .eq('config_type', 'mic_calibration')
                .maybeSingle();

            if (data && data.data && data.data.text) {
                const text = data.data.text;
                calTextInput.value = text;
                const parsed = parseCalibrationData(text);
                if (parsed.length > 0) {
                    calProfile = parsed;
                    calEnabled = data.data.enabled !== false;
                    precomputeCalibrationOffsets();

                    if (calStatusBadge) {
                        calStatusBadge.textContent = calEnabled ? "ACTIVE" : "INACTIVE";
                        calStatusBadge.className = calEnabled ? "cal-status-badge active" : "cal-status-badge inactive";
                    }
                    if (calDetails) {
                        calDetails.textContent = `${parsed.length} points applied`;
                    }
                }
            }
        } catch (err) {
            console.warn("Could not pull calibration profile", err);
        }
    }

    pullCalibrationProfile();
    document.addEventListener('authSuccess', pullCalibrationProfile);

    // --- Dynamic Pro Lock UI Synchronization ---
    function syncProLockUI() {
        const isWaterfallPro = window.isPremiumActive('spectrogram');
        const btnWaterfall = Array.from(modeBtns).find(btn => btn.getAttribute('data-mode') === 'waterfall');
        if (btnWaterfall) {
            btnWaterfall.classList.toggle('locked-pro', !isWaterfallPro);
            btnWaterfall.innerHTML = isWaterfallPro 
                ? 'WATERFALL' 
                : '<span class="material-symbols-outlined" style="font-size:12px; margin-right:4px; vertical-align: middle;">lock</span>WATERFALL';
        }

        const isCalPro = window.isPremiumActive('mic_calibration');
        if (btnMicCalModal) {
            btnMicCalModal.classList.toggle('locked-pro', !isCalPro);
            btnMicCalModal.innerHTML = isCalPro 
                ? '<span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">settings_input_antenna</span> LOAD PROFILE'
                : '<span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">lock</span> LOAD PROFILE';
        }
    }

    document.addEventListener('proStatusChanged', (e) => {
        syncProLockUI();
        renderSnapshotSlots();
        if (typeof syncFullscreenHudWithEngineState === 'function') {
            syncFullscreenHudWithEngineState();
        }
    });

    // Run initial sync on load
    syncProLockUI(window.isPremiumActive());
    if (window.updatePremiumUI) window.updatePremiumUI();

    // --- Cloud Sync ---
    async function pullSnapshots() {
        if (typeof supabaseClient === 'undefined') return;
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        try {
            const { data } = await supabaseClient
                .from('user_configs')
                .select('data')
                .eq('user_id', session.user.id)
                .eq('config_type', 'rta_snapshots')
                .maybeSingle();


            if (data && data.data && data.data.snapshots) {
                snapshots = data.data.snapshots;
                renderSnapshotSlots();
            }
        } catch (err) {
            console.error('Cloud Pull Error (RTA):', err);
        }
    }

    pullSnapshots();
    document.addEventListener('authSuccess', pullSnapshots);


    // --- Robust Audio Engine Recovery on Lifecycle & Ad Interruptions ---
    async function restartAnalyzer() {
        if (isStartingAnalyzer) return;
        console.log("[RTA Engine] Cleanly restarting hardware audio pipeline...");
        await stopAnalyzer();
        await new Promise(res => setTimeout(res, 120));
        await startAnalyzer();
    }
    window.restartAnalyzer = restartAnalyzer;

    async function resumeRtaAudioEngine() {
        if (isStartingAnalyzer) return;

        // If stream is already live and analyzing, do NOT tear it down on orientation/focus events!
        const hasLiveTrack = stream && typeof stream.getAudioTracks === 'function' &&
            stream.getAudioTracks().some(t => t.readyState === 'live' && t.enabled);

        if (isAnalyzing && hasLiveTrack && audioCtx && analyser) {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
            if (!rafID) {
                lastFrameTime = performance.now();
                rafID = requestAnimationFrame(draw);
            }
            syncRunStopButtons(true);
            return;
        }

        if (!isAnalyzing) {
            await startAnalyzer();
        } else {
            await restartAnalyzer();
        }
    }
    window.resumeRtaAudioEngine = resumeRtaAudioEngine;

    // --- Premium Fullscreen & Rewarded Ad Features ---
    function syncRtaCanvasSize(skipRedraw = false) {
        const wrapper = canvas.parentElement;
        if (!wrapper) return;
        const rect = canvas.getBoundingClientRect();
        if (rect && rect.width >= 100 && rect.height >= 100) {
            canvas.width = Math.round(rect.width);
            canvas.height = Math.round(rect.height);
        } else if (isFullscreenActive) {
            if (wrapper.classList.contains('drawer-docked') && window.innerWidth >= 768) {
                canvas.width = Math.max(300, window.innerWidth - 360);
            } else {
                canvas.width = window.innerWidth;
            }
            canvas.height = window.innerHeight;
        } else {
            canvas.width = wrapper.clientWidth || 800;
            canvas.height = wrapper.clientHeight || 400;
        }
        
        // Resize spectrogram waterfall cache canvas in lockstep
        if (waterfallCanvas) {
            waterfallCanvas.width = canvas.width;
            waterfallCanvas.height = canvas.height;
            if (waterfallCtx) {
                waterfallCtx.fillStyle = '#050508';
                waterfallCtx.fillRect(0, 0, waterfallCanvas.width, waterfallCanvas.height);
            }
        }

        if (skipRedraw) return;

        // Prevent blank canvas after resize/dock transitions
        if (isAnalyzing) {
            if (!rafID) {
                lastFrameTime = performance.now();
                rafID = requestAnimationFrame(draw);
            }
        } else {
            drawIdleState(true);
        }
    }

    if (typeof ResizeObserver !== 'undefined' && canvas && canvas.parentElement) {
        try {
            const ro = new ResizeObserver(() => {
                syncRtaCanvasSize();
            });
            ro.observe(canvas.parentElement);
        } catch (e) {}
    }

    function isRtaViewOrFullscreenActive() {
        const rtaViewEl = document.getElementById('rta-view');
        const isRtaVisible = rtaViewEl && rtaViewEl.style.display !== 'none' && window.getComputedStyle(rtaViewEl).display !== 'none';
        return !!(
            isFullscreenActive ||
            window.isRtaFullscreenActive ||
            isRtaVisible ||
            document.body.classList.contains('has-fullscreen-canvas')
        );
    }
    window.isRtaViewOrFullscreenActive = isRtaViewOrFullscreenActive;

    function toggleRtaFullscreen(forceState) {
        const wrapper = canvas.parentElement;
        if (!wrapper) return;
        
        const btnFullscreen = document.getElementById('btn-rta-fullscreen');
        const btnCloseFullscreen = document.getElementById('btn-rta-close-fullscreen');
        const tabbar = document.getElementById('mobile-bottom-tabs');
        const safeHeader = document.getElementById('mobile-safe-header');
        let targetState = (forceState !== undefined) ? forceState : !isFullscreenActive;
        
        if (targetState) {
            isFullscreenActive = true;
            window.isRtaFullscreenActive = true;
            wrapper.classList.add('fullscreen-canvas');
            document.body.classList.add('has-fullscreen-canvas');
            document.documentElement.classList.add('has-fullscreen-canvas');

            if (tabbar) tabbar.classList.add('hidden-tab-bar');
            if (safeHeader) safeHeader.style.display = 'none';

            if (btnFullscreen) {
                btnFullscreen.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">fullscreen_exit</span>';
                btnFullscreen.title = 'Exit Fullscreen';
            }
            if (btnCloseFullscreen) {
                btnCloseFullscreen.style.display = 'flex';
            }
            document.body.style.overflow = 'hidden'; // Stop background scrolling

            // Fullscreen RTA hides native banner ad immediately to give unobstructed visualizer
            if (typeof window.hideNativeBannerAd === 'function') {
                window.hideNativeBannerAd();
            }

            // Start or resume live measurement immediately inside the user tap gesture before native rotation
            if (!isAnalyzing && !isStartingAnalyzer) {
                startAnalyzer();
            } else {
                resumeRtaAudioEngine();
            }

            // Lock screen orientation to landscape natively (Android & iOS Capacitor) + Web API fallback
            try {
                const audioPlugin = getAudioSessionPlugin();
                if (audioPlugin && typeof audioPlugin.setScreenOrientation === 'function') {
                    audioPlugin.setScreenOrientation({ orientation: 'landscape' }).catch(() => {});
                }
            } catch (e) {}
            if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.lock === 'function') {
                try {
                    screen.orientation.lock('landscape').catch(() => {});
                } catch (e) {}
            }

            if (typeof window.triggerHaptic === 'function') {
                window.triggerHaptic('medium');
            }
            
            syncRtaCanvasSize();
            renderFrequencyLabels();
            // Re-sync canvas dimensions & enforce ad removal after native landscape rotation animation completes
            setTimeout(() => {
                syncRtaCanvasSize();
                renderFrequencyLabels();
                if (typeof window.hideNativeBannerAd === 'function') window.hideNativeBannerAd();
            }, 80);
            setTimeout(() => {
                syncRtaCanvasSize();
                renderFrequencyLabels();
                if (!isAnalyzing && !isStartingAnalyzer && isFullscreenActive) startAnalyzer();
            }, 220);
            setTimeout(() => {
                syncRtaCanvasSize();
                renderFrequencyLabels();
                if (typeof window.hideNativeBannerAd === 'function') window.hideNativeBannerAd();
            }, 450);

            if (typeof syncFullscreenHudWithEngineState === 'function') {
                syncFullscreenHudWithEngineState();
            }
        } else {
            isFullscreenActive = false;
            window.isRtaFullscreenActive = false;
            wrapper.classList.remove('fullscreen-canvas', 'drawer-docked');
            document.body.classList.remove('has-fullscreen-canvas');
            document.documentElement.classList.remove('has-fullscreen-canvas');

            if (safeHeader) safeHeader.style.display = '';
            const rtaViewEl = document.getElementById('rta-view');
            if (tabbar && (!rtaViewEl || rtaViewEl.style.display === 'none')) {
                tabbar.classList.remove('hidden-tab-bar');
            }

            if (typeof closeFsDrawer === 'function') {
                closeFsDrawer();
            }
            if (btnFullscreen) {
                btnFullscreen.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">fullscreen</span>';
                btnFullscreen.title = 'Toggle Fullscreen View';
            }
            if (btnCloseFullscreen) {
                btnCloseFullscreen.style.display = 'none';
            }
            document.body.style.overflow = ''; // Restore background scrolling

            // Release orientation lock natively (restore portrait on phones, unspecified on tablets) + Web API fallback
            try {
                const audioPlugin = getAudioSessionPlugin();
                if (audioPlugin && typeof audioPlugin.setScreenOrientation === 'function') {
                    const isPhoneViewport = Math.min(window.screen.width || 0, window.screen.height || 0) < 600;
                    audioPlugin.setScreenOrientation({ orientation: isPhoneViewport ? 'portrait' : 'unspecified' }).catch(() => {});
                    if (isPhoneViewport) {
                        setTimeout(() => {
                            if (!isFullscreenActive) {
                                audioPlugin.setScreenOrientation({ orientation: 'unspecified' }).catch(() => {});
                            }
                        }, 600);
                    }
                }
            } catch (e) {}
            if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.unlock === 'function') {
                try {
                    screen.orientation.unlock();
                } catch (e) {}
            }

            if (typeof window.triggerHaptic === 'function') {
                window.triggerHaptic('light');
            }

            // Exiting fullscreen restores native banner ad ONLY if we are also leaving RTA view
            if (!window.isPremiumActive() && !isRtaViewOrFullscreenActive() && typeof window.showNativeBannerAd === 'function') {
                window.showNativeBannerAd();
            }
            
            syncRtaCanvasSize();
            renderFrequencyLabels();
            setTimeout(() => { syncRtaCanvasSize(); renderFrequencyLabels(); }, 100);
            setTimeout(() => { syncRtaCanvasSize(); renderFrequencyLabels(); }, 300);
            
            if (isAnalyzing) {
                resumeRtaAudioEngine();
            }
        }
    }
    window.toggleRtaFullscreen = toggleRtaFullscreen;

    // --- Native AdMob Banner & Rewarded Pro Unlock Controller (delegated to rtaAdController.js) ---
    const adController = window.RtaAdController.init({
        isRtaViewOrFullscreenActive: () => isRtaViewOrFullscreenActive(),
        isAnalyzing: () => isAnalyzing,
        startAnalyzer: (devId) => startAnalyzer(devId),
        stopAnalyzer: () => stopAnalyzer(),
        toggleRtaFullscreen: (force) => toggleRtaFullscreen(force),
        handleAcousticPulseAction: () => {
            if (typeof handleAcousticPulseAction === 'function') handleAcousticPulseAction();
        },
        setMode: (mode) => { currentMode = mode; },
        syncFullscreenHudWithEngineState: () => {
            if (typeof syncFullscreenHudWithEngineState === 'function') syncFullscreenHudWithEngineState();
        },
        renderSnapshotSlots: () => renderSnapshotSlots(),
        consumePendingSnapshotCapture: () => {
            if (pendingSnapshotCaptureSlot !== null && pendingSnapshotCaptureSlot !== undefined) {
                const targetSlot = pendingSnapshotCaptureSlot;
                pendingSnapshotCaptureSlot = null;
                if (isInitialized && currentRtaLevels && currentRtaLevels.length > 0) {
                    const defaultTraceColors = ['#00FFFF', '#FF00FF', '#FFE600', '#00FF66'];
                    snapshots[targetSlot] = {
                        rta: Array.from(currentRtaLevels),
                        fraction: currentOctaveFraction,
                        fft: Array.from(dataArray),
                        color: SNAPSHOT_COLORS[targetSlot] || defaultTraceColors[targetSlot] || '#00FFFF',
                        visible: true,
                        id: Date.now()
                    };
                    saveConfigToCloud('rta_snapshots', { snapshots });
                    renderSnapshotSlots();
                }
            }
        }
    });
    const { startAdPlayback, grantAdRewardSuccess, closeAdPlayback } = adController;

    // Floating Button Click Trigger (Toggle / Exit Fullscreen)
    // Floating Button Click Trigger (Toggle / Exit Fullscreen)
    const btnFullscreen = document.getElementById('btn-rta-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleRtaFullscreen();
        });
    }

    const btnCloseFullscreen = document.getElementById('btn-rta-close-fullscreen');
    if (btnCloseFullscreen) {
        btnCloseFullscreen.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleRtaFullscreen(false);
            // Return cleanly to previous view or dashboard
            if (typeof window.goBack === 'function' && window.appNavigationHistory && window.appNavigationHistory.length > 0) {
                window.goBack();
            } else if (typeof window.showView === 'function') {
                const dash = document.getElementById('dashboard-view');
                if (dash) window.showView(dash);
            }
        });
    }

    // Tap on canvas to enter fullscreen if not in fullscreen or reset zoom
    if (canvas) {
        canvas.addEventListener('click', (e) => {
            if (!isFullscreenActive) {
                toggleRtaFullscreen(true);
            } else if (isFrequencyZoomed) {
                const rect = canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                if (clickY < 50 && clickX > 140 && clickX < 380) {
                    resetFrequencyZoom();
                }
            }
        });
    }

    // Window Resize Handler for RTA view
    window.addEventListener('resize', () => {
        if (document.getElementById('rta-view').style.display !== 'none') {
            syncRtaCanvasSize();
        }
    });

    renderSnapshotSlots(); 

    // RTA Input Change Handler (Rebuild stream & Sync global settings)
    if (inputSelect) {
        inputSelect.addEventListener('change', async (e) => {
            const newDeviceId = e.target.value;
            safeStorage.setItem('soundengg-mic-id', newDeviceId);
            
            const globalMic = document.getElementById('global-mic-select');
            if (globalMic) globalMic.value = newDeviceId;

            const activeOption = inputSelect.options[inputSelect.selectedIndex];
            const rawLabel = activeOption ? activeOption.text : '';
            const micBadge = document.getElementById('rta-mic-badge');
            if (micBadge) {
                micBadge.textContent = rawLabel ? (rawLabel.length > 18 ? rawLabel.slice(0, 16) + '...' : rawLabel).toUpperCase() : 'MIC ACTIVE';
            }

            // Immediately categorize device and update activeInputDevice so canvas and badges reflect EVO 4
            const lower = rawLabel.toLowerCase();
            const isBT = /buds|airpod|bluetooth|wireless|headset|hands-free|hfp|air6/i.test(lower);
            const isInternal = lower.includes('built-in') || 
                lower.includes('internal') || 
                lower.includes('iphone microphone') || 
                lower.includes('ipad microphone') || 
                lower.includes('default');
            const isUsb = !isInternal && !isBT && (lower.length > 0 || /evo|audient|scarlett|focusrite|behringer|motu|usb/i.test(lower));

            activeInputDevice = {
                label: rawLabel || (isUsb ? 'USB Audio Interface' : (isBT ? 'Bluetooth Headset' : 'Built-in Mic')),
                isExternal: isUsb,
                isBluetooth: isBT,
                deviceId: newDeviceId,
                sampleRate: audioCtx ? audioCtx.sampleRate : 48000
            };

            // Lock native iOS / Android preferred input route to the selected USB interface
            const audioPlugin = getAudioSessionPlugin();
            if (audioPlugin && typeof audioPlugin.setPreferredInputDevice === 'function') {
                try {
                    await audioPlugin.setPreferredInputDevice({
                        deviceId: newDeviceId,
                        deviceName: rawLabel
                    });
                } catch (plugErr) {
                    console.warn("setPreferredInputDevice error:", plugErr);
                }
            }

            if (currentMode === 'tf') {
                const tf = window.TransferFunctionEngine;
                // Cleanly restart analyzer pipeline and TF engine with the new device
                isAnalyzing = false;
                if (rafID) {
                    cancelAnimationFrame(rafID);
                    rafID = null;
                }
                if (stream) {
                    try { stream.getTracks().forEach(t => t.stop()); } catch (stErr) {}
                    stream = null;
                }
                await startAnalyzer(newDeviceId, true);
                if (tf && tf.isRunning) {
                    tf.stop();
                    await tf.start(newDeviceId);
                }
            } else if (isAnalyzing) {
                // Hot-swap active stream
                isAnalyzing = false;
                if (rafID) {
                    cancelAnimationFrame(rafID);
                    rafID = null;
                }
                if (stream) {
                    try { stream.getTracks().forEach(t => t.stop()); } catch (stErr) {}
                    stream = null;
                }
                await startAnalyzer(newDeviceId, true);
            }
            
            document.dispatchEvent(new CustomEvent('deviceChanged', { detail: newDeviceId, deviceName: rawLabel }));
        });
    }

    // RTA Output Change Handler (Sync global settings & Apply routes)
    if (outputSelect) {
        outputSelect.addEventListener('change', async (e) => {
            const newDeviceId = e.target.value;
            safeStorage.setItem('soundengg-output-id', newDeviceId);
            
            const globalOutput = document.getElementById('global-output-select');
            if (globalOutput) globalOutput.value = newDeviceId;

            const outBadge = document.getElementById('rta-output-badge');
            if (outBadge) {
                const activeOption = outputSelect.options[outputSelect.selectedIndex];
                outBadge.textContent = activeOption ? (activeOption.text.length > 18 ? activeOption.text.slice(0, 16) + '...' : activeOption.text).toUpperCase() : 'SPEAKER';
            }
            
            if (window.applyAudioOutput) {
                await window.applyAudioOutput(newDeviceId);
            }
            
            document.dispatchEvent(new CustomEvent('outputDeviceChanged', { detail: newDeviceId }));
        });
    }

    // Sync input changes from global settings
    document.addEventListener('deviceChanged', async (e) => {
        const newDeviceId = (typeof e.detail === 'object' && e.detail !== null) ? e.detail.deviceId : e.detail;
        if (inputSelect && newDeviceId && inputSelect.value !== newDeviceId) {
            inputSelect.value = newDeviceId;
            const micBadge = document.getElementById('rta-mic-badge');
            if (micBadge) {
                const activeOption = inputSelect.options[inputSelect.selectedIndex];
                micBadge.textContent = activeOption ? (activeOption.text.length > 18 ? activeOption.text.slice(0, 16) + '...' : activeOption.text).toUpperCase() : 'MIC ACTIVE';
            }
        }
        if (currentMode === 'tf') {
            const tf = window.TransferFunctionEngine;
            if (tf && tf.isRunning) {
                isAnalyzing = false;
                if (rafID) { cancelAnimationFrame(rafID); rafID = null; }
                if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch(err){} stream = null; }
                await startAnalyzer(newDeviceId, true);
                tf.stop();
                await tf.start(newDeviceId);
            }
        } else if (isAnalyzing) {
            isAnalyzing = false;
            if (rafID) {
                cancelAnimationFrame(rafID);
                rafID = null;
            }
            if (stream) {
                try { stream.getTracks().forEach(t => t.stop()); } catch(err){}
                stream = null;
            }
            await startAnalyzer(newDeviceId, true);
        }
    });

    // Sync output changes from global settings & Apply routes
    document.addEventListener('outputDeviceChanged', async (e) => {
        const newDeviceId = e.detail;
        if (outputSelect && outputSelect.value !== newDeviceId) {
            outputSelect.value = newDeviceId;
        }
        if (audioCtx && typeof audioCtx.setSinkId === 'function') {
            try {
                await audioCtx.setSinkId(newDeviceId);
                console.log("RTA AudioContext successfully routed to:", newDeviceId);
            } catch (err) {
                console.warn("Failed to route RTA AudioContext on outputDeviceChanged:", err);
            }
        }
    });

    // Initial enumeration
    if (window.populateAllAudioDevices) {
        window.populateAllAudioDevices();
    } else {
        getDevices();
    }

    // Lifecycle Event Listeners for Background Throttling & Auto-Recovery on iPad / iOS / Android
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (isAnalyzing || isFullscreenActive) {
                resumeRtaAudioEngine();
                requestRtaWakeLock();
                if (!rafID) {
                    lastFrameTime = performance.now();
                    rafID = requestAnimationFrame(draw);
                }
            }
        } else if (document.visibilityState === 'hidden') {
            // High-Performance Background Throttling: Pause 60 FPS drawing loop & release wake lock
            if (rafID) {
                cancelAnimationFrame(rafID);
                rafID = null;
            }
            releaseRtaWakeLock();
        }
    });

    window.addEventListener('focus', () => {
        if (isAnalyzing || isFullscreenActive) {
            resumeRtaAudioEngine();
            requestRtaWakeLock();
            if (!rafID) {
                lastFrameTime = performance.now();
                rafID = requestAnimationFrame(draw);
            }
        }
    });

    window.addEventListener('blur', () => {
        if (document.visibilityState === 'hidden') {
            if (rafID) {
                cancelAnimationFrame(rafID);
                rafID = null;
            }
            releaseRtaWakeLock();
        }
    });

    window.addEventListener('pageshow', () => {
        if (isAnalyzing || isFullscreenActive) {
            resumeRtaAudioEngine();
            requestRtaWakeLock();
            if (!rafID) {
                lastFrameTime = performance.now();
                rafID = requestAnimationFrame(draw);
            }
        }
    });

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
            if (state.isActive) {
                if (isAnalyzing || isFullscreenActive) {
                    resumeRtaAudioEngine();
                    requestRtaWakeLock();
                    if (!rafID) {
                        lastFrameTime = performance.now();
                        rafID = requestAnimationFrame(draw);
                    }
                }
            } else {
                if (rafID) {
                    cancelAnimationFrame(rafID);
                    rafID = null;
                }
                releaseRtaWakeLock();
            }
        });
    }

    // Expose RTA drawing and reward functions globally to window scope
    window.renderSnapshotSlots = renderSnapshotSlots;
    window.syncProLockUI = syncProLockUI;
    window.grantAdRewardSuccess = grantAdRewardSuccess;
    window.syncFullscreenHudWithEngineState = syncFullscreenHudWithEngineState;
    window.startAdPlayback = startAdPlayback;
    window.exportSpectrumPng = exportSpectrumPng;
    window.exportSpectrumCsv = exportSpectrumCsv;
    window.getSnapshots = () => snapshots;
    window.getRtaAudioPipeline = () => ({
        audioCtx,
        stream,
        source,
        micGainTrimNode,
        micGainTrimDb,
        setMicGainTrim,
        isAnalyzing,
        activeInputDevice
    });
    syncFullscreenHudWithEngineState();

    // Auto-enter fullscreen by default if RTA view is already active or requested via deep-link
    const rtaViewEl = document.getElementById('rta-view');
    if (rtaViewEl && (rtaViewEl.style.display !== 'none' || window.location.hash === '#rta-view' || window.location.search.includes('view=rta'))) {
        toggleRtaFullscreen(true);
    }
}
