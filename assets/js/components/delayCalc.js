function initDelayCalc() {
    const distInput = document.getElementById('delay-dist-mod');
    const distLabel = document.getElementById('label-dist-mod');
    const tempInput = document.getElementById('delay-temp-mod');
    const tempUnitSelect = document.getElementById('delay-temp-unit-mod');
    const outputEl = document.getElementById('delay-output-mod');
    const progressEl = document.getElementById('delay-progress-mod');
    const progressPercentEl = document.getElementById('delay-progress-percent');
    const btnShareDelay = document.getElementById('btn-share-delay');

    // Sub-mode and Differential elements
    const btnManualSubmodeSingle = document.getElementById('btn-manual-submode-single');
    const btnManualSubmodeDiff = document.getElementById('btn-manual-submode-diff');
    const rowDelaySingle = document.getElementById('row-delay-single');
    const rowDelayDiff = document.getElementById('row-delay-diff');
    const diffMainInput = document.getElementById('delay-diff-main');
    const diffMainLabel = document.getElementById('label-diff-main');
    const diffDelayInput = document.getElementById('delay-diff-delay');
    const diffDelayLabel = document.getElementById('label-diff-delay');
    const diffResultEl = document.getElementById('delay-diff-result');
    const diffEquivFeetEl = document.getElementById('delay-diff-equiv-feet');
    const diffBadgeEl = document.getElementById('delay-diff-badge');
    const speedReadoutEl = document.getElementById('delay-speed-readout');
    const manualSubreadoutEl = document.getElementById('delay-manual-subreadout');
    const haasManualBadge = document.getElementById('delay-manual-haas-badge');
    const haasManualBtns = document.querySelectorAll('.btn-haas-manual');

    let manualMode = 'single'; // 'single' or 'diff'
    let selectedManualHaasMs = 0;

    if (!distInput || !tempInput || !outputEl || !progressEl) return;

    // --- Submode Switching ---
    function switchManualSubmode(mode) {
        manualMode = mode;
        if (mode === 'diff') {
            btnManualSubmodeDiff?.classList.add('active');
            btnManualSubmodeSingle?.classList.remove('active');
            if (rowDelaySingle) rowDelaySingle.style.display = 'none';
            if (rowDelayDiff) rowDelayDiff.style.display = 'flex';
        } else {
            btnManualSubmodeSingle?.classList.add('active');
            btnManualSubmodeDiff?.classList.remove('active');
            if (rowDelaySingle) rowDelaySingle.style.display = 'grid';
            if (rowDelayDiff) rowDelayDiff.style.display = 'none';
        }
        update();
    }
    window.switchManualSubmode = switchManualSubmode;

    if (btnManualSubmodeSingle) {
        btnManualSubmodeSingle.addEventListener('click', () => switchManualSubmode('single'));
    }
    if (btnManualSubmodeDiff) {
        btnManualSubmodeDiff.addEventListener('click', () => switchManualSubmode('diff'));
    }

    haasManualBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            haasManualBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedManualHaasMs = parseFloat(btn.dataset.haas) || 0;
            if (haasManualBadge) {
                haasManualBadge.textContent = selectedManualHaasMs === 0 ? '0 ms (EXACT)' : `+${selectedManualHaasMs} ms`;
            }
            update();
        });
    });

    if (diffMainInput) diffMainInput.addEventListener('input', () => update());
    if (diffDelayInput) diffDelayInput.addEventListener('input', () => update());

    // --- Parse URL Share Parameters ---
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam === 'delay') {
        const distQ = urlParams.get('dist');
        const tempQ = urlParams.get('temp');
        const unitQ = urlParams.get('unit');
        const modeQ = urlParams.get('mode');
        const mainQ = urlParams.get('main');
        const delayQ = urlParams.get('del');
        if (distQ) distInput.value = parseFloat(distQ);
        if (tempQ) tempInput.value = parseFloat(tempQ);
        if (unitQ) tempUnitSelect.value = unitQ;
        if (mainQ && diffMainInput) diffMainInput.value = parseFloat(mainQ);
        if (delayQ && diffDelayInput) diffDelayInput.value = parseFloat(delayQ);
        if (modeQ === 'diff') switchManualSubmode('diff');
    } else {
        // Initialize from Global Venue Environment state
        const gUnit = window.globalTempUnit || 'C';
        const gTempC = typeof window.globalTempC === 'number' ? window.globalTempC : 22.0;
        if (tempUnitSelect) tempUnitSelect.value = gUnit;
        if (tempInput) {
            tempInput.value = gUnit === 'F' ? ((gTempC * 9 / 5) + 32).toFixed(1) : gTempC.toFixed(1);
        }
    }

    function syncTempFromGlobal() {
        const gUnit = window.globalTempUnit || 'C';
        const gTempC = typeof window.globalTempC === 'number' ? window.globalTempC : 22.0;
        if (tempUnitSelect) tempUnitSelect.value = gUnit;
        if (tempInput && document.activeElement !== tempInput) {
            tempInput.value = gUnit === 'F' ? ((gTempC * 9 / 5) + 32).toFixed(1) : gTempC.toFixed(1);
        }
    }

    function update(skipCloudSave = false) {
        const temp = parseFloat(tempInput.value) || 0;
        const tUnit = tempUnitSelect.value;
        const isMetric = window.globalUnitSystem === 'metric';

        // Calculate acoustic speed of sound based on temperature
        let speedM_s = 344;
        let speedFt_s = 1128;
        if (tUnit === 'C') {
            speedM_s = window.AudioCalcs.calcSpeedOfSound(temp);
            speedFt_s = speedM_s * 3.28084;
        } else {
            speedFt_s = window.AudioCalcs.calcSpeedOfSoundF(temp);
            speedM_s = speedFt_s / 3.28084;
        }

        // Keep Auto Ping's measuredSpeedOfSound synced with current temperature
        if (typeof measuredSpeedOfSound !== 'undefined') {
            measuredSpeedOfSound = speedM_s;
        }

        if (speedReadoutEl) {
            speedReadoutEl.textContent = `${speedM_s.toFixed(1)} m/s (${speedFt_s.toFixed(1)} ft/s)`;
        }

        // Sync input field labels according to global unit system
        if (distLabel) distLabel.textContent = isMetric ? 'Distance (m)' : 'Distance (ft)';
        if (diffMainLabel) diffMainLabel.textContent = isMetric ? 'Ref Spkr / Far (m)' : 'Ref Spkr / Far (ft)';
        if (diffDelayLabel) diffDelayLabel.textContent = isMetric ? 'Target / Near (m)' : 'Target / Near (ft)';

        let effDist = 0;
        if (manualMode === 'diff') {
            const dMain = parseFloat(diffMainInput?.value) || 0;
            const dDelay = parseFloat(diffDelayInput?.value) || 0;
            const diff = dMain - dDelay;
            effDist = Math.max(0, diff);

            if (diffResultEl) {
                diffResultEl.textContent = `${diff >= 0 ? diff.toFixed(2) : '0.00'} ${isMetric ? 'm' : 'ft'}`;
            }
            if (diffEquivFeetEl) {
                if (isMetric) {
                    diffEquivFeetEl.textContent = `(${(effDist * 3.28084).toFixed(2)} ft)`;
                } else {
                    diffEquivFeetEl.textContent = `(${(effDist / 3.28084).toFixed(2)} m)`;
                }
            }
            if (diffBadgeEl) {
                if (dDelay >= dMain && dMain > 0) {
                    diffBadgeEl.classList.add('warning');
                    diffBadgeEl.innerHTML = `<span>⚠️ Target is equidistant or farther than Reference. <strong>0.00 ${isMetric ? 'm' : 'ft'}</strong></span><span style="opacity: 0.8; font-size: 0.62rem;">(No delay required)</span>`;
                } else {
                    diffBadgeEl.classList.remove('warning');
                    diffBadgeEl.innerHTML = `<span>ΔD = (Ref − Target): <strong>${effDist.toFixed(2)} ${isMetric ? 'm' : 'ft'}</strong></span><span style="opacity: 0.8; font-size: 0.62rem;">(${isMetric ? (effDist * 3.28084).toFixed(2) + ' ft' : (effDist / 3.28084).toFixed(2) + ' m'})</span>`;
                }
            }
        } else {
            effDist = parseFloat(distInput.value) || 0;
        }

        const speed = isMetric ? speedM_s : speedFt_s;
        const acousticDelayMs = effDist > 0 ? (effDist / speed) * 1000 : 0;
        const totalDelayMs = acousticDelayMs + (acousticDelayMs > 0 ? selectedManualHaasMs : 0);

        outputEl.innerHTML = `${totalDelayMs.toFixed(2)}<span class="delay-unit">ms</span>`;
        if (manualSubreadoutEl) {
            manualSubreadoutEl.textContent = `ACOUSTIC: ${acousticDelayMs.toFixed(2)} ms • HAAS: +${selectedManualHaasMs.toFixed(1)} ms • EFF. DIST: ${effDist.toFixed(2)} ${isMetric ? 'm' : 'ft'}`;
        }

        const progressPercent = Math.min(100, (totalDelayMs / 50) * 100);
        progressEl.style.width = `${progressPercent}%`;
        if (progressPercentEl) {
            progressPercentEl.textContent = `${progressPercent.toFixed(1)}%`;
        }

        // Trigger Cloud Save if not just loading
        if (!skipCloudSave) {
            saveConfigToCloud('delay', {
                dist: distInput.value,
                temp,
                tUnit,
                manualMode,
                dMain: diffMainInput?.value,
                dDelay: diffDelayInput?.value,
                haas: selectedManualHaasMs
            });
            if (typeof window.trackUsageForRating === 'function') {
                window.trackUsageForRating();
            }
        }
    }

    // --- Pull from Cloud ---
    async function pull() {
        if (typeof supabaseClient === 'undefined') return;
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        try {
            const { data, error } = await supabaseClient
                .from('user_configs')
                .select('data')
                .eq('user_id', session.user.id)
                .eq('config_type', 'delay')
                .maybeSingle();

            if (data && data.data && viewParam !== 'delay') {
                if (data.data.dist !== undefined) distInput.value = data.data.dist;
                if (!safeStorage.getItem('soundengg-temp-c')) {
                    if (data.data.temp !== undefined) tempInput.value = data.data.temp;
                    if (data.data.tUnit !== undefined) tempUnitSelect.value = data.data.tUnit;
                } else {
                    syncTempFromGlobal();
                }
                update(true); // Initial UI sync without triggering a re-save
            }
        } catch (err) {
            console.error('Cloud Pull Error (Delay):', err);
        }
    }

    // --- Mode Tab Switching ---
    const tabManual = document.getElementById('tab-delay-manual');
    const tabAuto = document.getElementById('tab-delay-auto');
    const manualContainer = document.getElementById('delay-manual-container');
    const autoContainer = document.getElementById('delay-auto-container');

    function switchMode(mode) {
        if (mode === 'auto') {
            tabAuto.classList.add('active');
            tabManual.classList.remove('active');

            manualContainer.style.display = 'none';
            autoContainer.style.display = 'flex';
            drawEmptyOscilloscope();
        } else {
            tabManual.classList.add('active');
            tabAuto.classList.remove('active');

            autoContainer.style.display = 'none';
            manualContainer.style.display = 'flex';
            stopAutoPingListening();
            stopAlignmentLoop();
        }
    }

    if (tabManual && tabAuto) {
        tabManual.addEventListener('click', () => switchMode('manual'));
        tabAuto.addEventListener('click', () => switchMode('auto'));
    }

    // --- FOH Reference Alignment Click Player (Web Audio Engine) ---
    const btnPlayAlignment = document.getElementById('btn-play-alignment-click');
    const iconPlayAlignment = document.getElementById('icon-play-alignment');
    const textPlayAlignment = document.getElementById('text-play-alignment');
    const btnDownloadAlignment = document.getElementById('btn-download-alignment-click');
    const iconDownloadAlignment = document.getElementById('icon-download-alignment');
    const textDownloadAlignment = document.getElementById('text-download-alignment');

    let loopAudioCtx = null;
    let loopAudioBuffer = null;
    let loopSourceNode = null;
    let loopFallbackAudio = null;
    let isLoopingClick = false;

    // Broadband Micro-Chirp Pulse & Loop Buffer (extracted to delay/delaySignalSynth.js)
    const {
        synthesizeChirpPulseSample,
        buildLoopAudioBuffer,
        generateAlignmentWavBlob,
        exportAlignmentWavFile
    } = window.DelaySignalSynth;

    function stopAlignmentLoop() {
        if (loopSourceNode) {
            try {
                loopSourceNode.stop();
                loopSourceNode.disconnect();
            } catch (e) {}
            loopSourceNode = null;
        }
        if (loopAudioCtx && loopAudioCtx.state === 'running') {
            try {
                loopAudioCtx.suspend();
            } catch (e) {}
        }
        if (loopFallbackAudio) {
            try {
                loopFallbackAudio.pause();
                loopFallbackAudio.currentTime = 0;
            } catch (e) {}
            loopFallbackAudio = null;
        }
        isLoopingClick = false;
        if (iconPlayAlignment) iconPlayAlignment.textContent = 'play_arrow';
        if (textPlayAlignment) textPlayAlignment.textContent = 'LOOP FROM PHONE';
        if (btnPlayAlignment) {
            btnPlayAlignment.classList.remove('is-looping');
        }
    }
    window.stopAlignmentLoop = stopAlignmentLoop;

    async function startAlignmentLoop() {
        try {
            // Configure native iOS / Android audio session for speaker output
            try {
                const audioPlugin = window.Capacitor?.registerPlugin ? window.Capacitor.registerPlugin('AudioSessionPlugin') : window.Capacitor?.Plugins?.AudioSessionPlugin;
                if (audioPlugin && typeof audioPlugin.configureAudioSession === 'function') {
                    await audioPlugin.configureAudioSession();
                }
            } catch (pluginErr) {
                console.warn('AudioSessionPlugin configuration warning:', pluginErr);
            }

            if (!loopAudioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                loopAudioCtx = new AudioContextClass();
            }
            if (loopAudioCtx.state === 'suspended') {
                await loopAudioCtx.resume();
            }
            if (!loopAudioBuffer || loopAudioBuffer.sampleRate !== loopAudioCtx.sampleRate) {
                loopAudioBuffer = buildLoopAudioBuffer(loopAudioCtx);
            }

            // Clean up previous instance if running
            if (loopSourceNode) {
                try { loopSourceNode.stop(); loopSourceNode.disconnect(); } catch (e) {}
            }

            const gainNode = loopAudioCtx.createGain();
            gainNode.gain.setValueAtTime(1.0, loopAudioCtx.currentTime);

            loopSourceNode = loopAudioCtx.createBufferSource();
            loopSourceNode.buffer = loopAudioBuffer;
            loopSourceNode.loop = true;
            loopSourceNode.connect(gainNode);
            gainNode.connect(loopAudioCtx.destination);

            // Schedule 60ms into future to allow iOS hardware DAC amplifier to un-mute smoothly
            const startTime = loopAudioCtx.currentTime + 0.06;
            loopSourceNode.start(startTime);

            isLoopingClick = true;
            if (iconPlayAlignment) iconPlayAlignment.textContent = 'stop';
            if (textPlayAlignment) textPlayAlignment.textContent = 'STOP LOOPING';
            if (btnPlayAlignment) {
                btnPlayAlignment.classList.add('is-looping');
            }
            if (typeof window.showSoundEnggToast === 'function') {
                window.showSoundEnggToast('Looping 60 BPM Pulse. Ensure iPad Silent Mode is OFF & Volume is UP.');
            }
        } catch (err) {
            console.error('Web Audio loop error:', err);
            // Fallback to HTML5 audio with 16-bit WAV
            try {
                if (loopFallbackAudio) {
                    try { loopFallbackAudio.pause(); } catch (e) {}
                }
                loopFallbackAudio = new Audio('assets/audio/soundengg-delay-alignment-click-48k.wav');
                loopFallbackAudio.loop = true;
                await loopFallbackAudio.play();
                isLoopingClick = true;
                if (iconPlayAlignment) iconPlayAlignment.textContent = 'stop';
                if (textPlayAlignment) textPlayAlignment.textContent = 'STOP LOOPING';
                if (btnPlayAlignment) {
                    btnPlayAlignment.classList.add('is-looping');
                }
            } catch (fallbackErr) {
                console.error('Fallback audio playback error:', fallbackErr);
                alert('Audio playback could not start. Please ensure phone media volume is unmuted.');
            }
        }
    }

    if (btnPlayAlignment) {
        btnPlayAlignment.addEventListener('click', () => {
            if (isLoopingClick) {
                stopAlignmentLoop();
            } else {
                startAlignmentLoop();
            }
        });
    }

    // --- Universal Download & Export Handler (extracted to delay/delaySignalSynth.js) ---
    if (btnDownloadAlignment) {
        btnDownloadAlignment.addEventListener('click', async (e) => {
            e.preventDefault();
            await exportAlignmentWavFile({ textDownloadAlignment, iconDownloadAlignment });
        });
    }

    // --- Acoustic Auto Ping DSP Engine ---
    const btnStartAutoPing = document.getElementById('btn-start-auto-ping');
    const btnAutoPingText = document.getElementById('btn-auto-ping-text');
    const iconAutoPing = document.getElementById('icon-auto-ping');
    const autoPingStatus = document.getElementById('auto-ping-status');
    const autoPingDelayOutput = document.getElementById('auto-ping-delay-output');
    const autoPingDistReadout = document.getElementById('auto-ping-dist-readout');
    const autoPingTargetTitle = document.getElementById('auto-ping-target-title');
    const btnApplyAutoDelay = document.getElementById('btn-apply-auto-delay');
    const canvasOscilloscope = document.getElementById('delay-oscilloscope');
    const haasButtons = document.querySelectorAll('.btn-haas-opt');
    const pingPips = [
        document.getElementById('ping-pip-1'),
        document.getElementById('ping-pip-2'),
        document.getElementById('ping-pip-3'),
        document.getElementById('ping-pip-4'),
        document.getElementById('ping-pip-5')
    ].filter(Boolean);

    // Target Speaker / Zone Selection
    const delayZoneSelect = document.getElementById('delay-zone-select');
    const delayZoneCustomInput = document.getElementById('delay-zone-custom-input');

    // Detection Sensitivity Preset Buttons (LOW | NORMAL | HIGH)
    const btnSensLow = document.getElementById('btn-sens-low');
    const btnSensNormal = document.getElementById('btn-sens-normal');
    const btnSensHigh = document.getElementById('btn-sens-high');
    const autoPingBurstLockBadge = document.getElementById('auto-ping-burst-lock-badge');

    // Multi-Position Spatial Averaging
    const delayPositionsList = document.getElementById('delay-positions-list');
    const spatialCountBadge = document.getElementById('spatial-count-badge');
    const spatialEmptyHint = document.getElementById('spatial-empty-hint');
    const spatialSummaryStrip = document.getElementById('spatial-summary-strip');
    const spatialAvgReadout = document.getElementById('spatial-avg-readout');
    const spatialVarianceReadout = document.getElementById('spatial-variance-readout');
    const btnAddSpatialPosition = document.getElementById('btn-add-spatial-position');
    const btnClearSpatial = document.getElementById('btn-clear-spatial');

    let currentScopeViewMode = 'auto'; // 'auto' | '100ms' | '500ms'
    let lastDrawnEtc = null;
    let lastDrawnSampleRate = 48000;
    let lastDrawnP1 = null;
    let lastDrawnP2 = null;
    let lastDrawnDeltaMs = 0;
    let lastDrawnWindowStart = 0;
    let lastDrawnStep = 1;

    let autoAudioCtx = null;
    let autoMediaStream = null;
    let isListeningPing = false;
    let measuredRawDelayMs = 0;
    let selectedHaasMs = 0;
    let measuredSpeedOfSound = 344;
    let capturedPings = [];
    let autoPingTimeoutTimer = null;
    let venuePositions = [];
    let reMeasureTargetId = null;
    let captureDurationSec = 6.0;
    let batchProcessor = null;
    let lastRecordedBuffer = null;
    let lastRecordedSampleRate = 48000;
    let liveRunningPeak = 0.008;

    const btnCapDur6s = document.getElementById('btn-cap-dur-6s');
    const btnCapDur10s = document.getElementById('btn-cap-dur-10s');
    if (btnCapDur6s && btnCapDur10s) {
        btnCapDur6s.addEventListener('click', () => {
            captureDurationSec = 6.0;
            btnCapDur6s.classList.add('active');
            btnCapDur6s.style.background = 'rgba(0,240,255,0.15)';
            btnCapDur6s.style.borderColor = 'var(--primary)';
            btnCapDur6s.style.color = 'var(--primary)';
            btnCapDur10s.classList.remove('active');
            btnCapDur10s.style.background = 'transparent';
            btnCapDur10s.style.borderColor = 'var(--outline)';
            btnCapDur10s.style.color = 'var(--text-muted)';
        });
        btnCapDur10s.addEventListener('click', () => {
            captureDurationSec = 10.0;
            btnCapDur10s.classList.add('active');
            btnCapDur10s.style.background = 'rgba(0,240,255,0.15)';
            btnCapDur10s.style.borderColor = 'var(--primary)';
            btnCapDur10s.style.color = 'var(--primary)';
            btnCapDur6s.classList.remove('active');
            btnCapDur6s.style.background = 'transparent';
            btnCapDur6s.style.borderColor = 'var(--outline)';
            btnCapDur6s.style.color = 'var(--text-muted)';
        });
    }

    function getSelectedZoneName() {
        if (!delayZoneSelect) return 'Front Fill';
        if (delayZoneSelect.value === 'Custom') {
            const custom = (delayZoneCustomInput && delayZoneCustomInput.value.trim()) ? delayZoneCustomInput.value.trim() : 'Custom Zone';
            return custom;
        }
        return delayZoneSelect.value;
    }

    function updateZoneDisplayTitle() {
        const name = getSelectedZoneName();
        if (autoPingTargetTitle) {
            autoPingTargetTitle.textContent = `${name.toUpperCase()} DELAY OFFSET`;
        }
    }

    if (delayZoneSelect) {
        delayZoneSelect.addEventListener('change', () => {
            if (delayZoneCustomInput) {
                delayZoneCustomInput.style.display = (delayZoneSelect.value === 'Custom') ? 'block' : 'none';
                if (delayZoneSelect.value === 'Custom') delayZoneCustomInput.focus();
            }
            updateZoneDisplayTitle();
        });
    }
    if (delayZoneCustomInput) {
        delayZoneCustomInput.addEventListener('input', () => updateZoneDisplayTitle());
    }

    let currentSensitivity = 'normal'; // 'low' | 'normal' | 'high'

    function getSensitivityMultiplier() {
        if (currentSensitivity === 'low') return 1.60;
        if (currentSensitivity === 'high') return 0.50;
        return 1.00;
    }

    function setSensitivity(level) {
        currentSensitivity = level;
        const btns = [
            { el: btnSensLow, id: 'low' },
            { el: btnSensNormal, id: 'normal' },
            { el: btnSensHigh, id: 'high' }
        ];
        btns.forEach(({ el, id }) => {
            if (!el) return;
            if (id === level) {
                el.classList.add('active');
                el.style.background = 'rgba(0, 240, 255, 0.18)';
                el.style.color = 'var(--primary)';
                el.style.fontWeight = 'bold';
            } else {
                el.classList.remove('active');
                el.style.background = 'transparent';
                el.style.color = 'var(--text-muted)';
                el.style.fontWeight = 'normal';
            }
        });
        // Immediately re-analyze the last captured buffer when sensitivity is adjusted
        if (!isListeningPing && lastRecordedBuffer && lastRecordedBuffer.length > 0) {
            analyzeBatchRecording(lastRecordedBuffer, lastRecordedSampleRate, true);
        }
    }

    if (btnSensLow) btnSensLow.addEventListener('click', () => setSensitivity('low'));
    if (btnSensNormal) btnSensNormal.addEventListener('click', () => setSensitivity('normal'));
    if (btnSensHigh) btnSensHigh.addEventListener('click', () => setSensitivity('high'));

    function getSpatialAverageData() {
        const enabled = venuePositions.filter(p => p.enabled);
        if (enabled.length === 0) return null;
        const avgMs = enabled.reduce((s, p) => s + p.deltaMs, 0) / enabled.length;
        const avgDistM = (avgMs / 1000) * measuredSpeedOfSound;
        const varianceMs = (enabled.length > 1)
            ? Math.max(...enabled.map(p => Math.abs(p.deltaMs - avgMs)))
            : 0;
        return { enabledCount: enabled.length, totalCount: venuePositions.length, avgMs, avgDistM, varianceMs };
    }

    function renderVenuePositions() {
        if (!delayPositionsList) return;
        delayPositionsList.innerHTML = '';

        if (venuePositions.length === 0) {
            if (spatialEmptyHint) spatialEmptyHint.style.display = 'block';
            if (spatialSummaryStrip) spatialSummaryStrip.style.display = 'none';
            if (spatialCountBadge) spatialCountBadge.textContent = '0';
            return;
        }

        if (spatialEmptyHint) spatialEmptyHint.style.display = 'none';
        if (spatialCountBadge) spatialCountBadge.textContent = venuePositions.length;

        venuePositions.forEach((pos) => {
            const row = document.createElement('div');
            row.className = 'spatial-pos-row';
            if (!pos.enabled) row.style.opacity = '0.45';

            const left = document.createElement('div');
            left.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;';

            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = pos.enabled;
            chk.style.cssText = 'accent-color: var(--primary); cursor: pointer;';
            chk.addEventListener('change', () => {
                pos.enabled = chk.checked;
                renderVenuePositions();
            });

            const info = document.createElement('div');
            info.style.cssText = 'display: flex; flex-direction: column; min-width: 0;';

            const title = document.createElement('span');
            title.style.cssText = `font-family: var(--font-mono); font-size: 0.72rem; font-weight: bold; color: ${pos.enabled ? 'var(--text-heading)' : 'var(--text-muted)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
            title.textContent = pos.label;

            const isMetric = window.globalUnitSystem === 'metric';
            pos.equivDistM = (pos.deltaMs / 1000) * measuredSpeedOfSound;
            const shownDist = isMetric ? pos.equivDistM : (pos.equivDistM * 3.28084);
            const distUnitStr = isMetric ? 'm' : 'ft';

            const val = document.createElement('span');
            val.style.cssText = 'font-family: var(--font-mono); font-size: 0.65rem; color: var(--primary);';
            val.textContent = `${pos.deltaMs.toFixed(2)} ms (${shownDist.toFixed(2)} ${distUnitStr})`;

            info.appendChild(title);
            info.appendChild(val);
            left.appendChild(chk);
            left.appendChild(info);

            const actions = document.createElement('div');
            actions.style.cssText = 'display: flex; gap: 4px; align-items: center;';

            // Re-measure button
            const btnRe = document.createElement('button');
            btnRe.className = 'rugged-btn delay-btn-remeasure';
            btnRe.title = 'Re-measure this seat position';
            btnRe.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">sync</span>';
            btnRe.addEventListener('click', () => {
                reMeasureTargetId = pos.id;
                startAutoPingListening();
                if (autoPingStatus) autoPingStatus.textContent = `RE-MEASURING ${pos.label.toUpperCase()}...`;
                if (typeof window.showSoundEnggToast === 'function') {
                    window.showSoundEnggToast(`Listening to re-measure ${pos.label}...`);
                }
            });

            // Discard button
            const btnDel = document.createElement('button');
            btnDel.className = 'rugged-btn delay-btn-discard';
            btnDel.title = 'Discard this position sample';
            btnDel.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">delete</span>';
            btnDel.addEventListener('click', () => {
                venuePositions = venuePositions.filter(p => p.id !== pos.id);
                renderVenuePositions();
                if (typeof window.showSoundEnggToast === 'function') {
                    window.showSoundEnggToast(`Discarded ${pos.label}`);
                }
            });

            actions.appendChild(btnRe);
            actions.appendChild(btnDel);

            row.appendChild(left);
            row.appendChild(actions);
            delayPositionsList.appendChild(row);
        });

        const stats = getSpatialAverageData();
        const isMetric = window.globalUnitSystem === 'metric';
        const avgShownDist = stats ? (isMetric ? stats.avgDistM : stats.avgDistM * 3.28084) : 0;
        const avgDistUnit = isMetric ? 'm' : 'ft';
        if (stats && stats.enabledCount >= 2) {
            if (spatialSummaryStrip) spatialSummaryStrip.style.display = 'flex';
            if (spatialAvgReadout) spatialAvgReadout.textContent = `${stats.avgMs.toFixed(2)} ms (${avgShownDist.toFixed(2)} ${avgDistUnit})`;
            if (spatialVarianceReadout) spatialVarianceReadout.textContent = `±${stats.varianceMs.toFixed(2)} ms`;
        } else if (stats && stats.enabledCount === 1) {
            if (spatialSummaryStrip) spatialSummaryStrip.style.display = 'flex';
            if (spatialAvgReadout) spatialAvgReadout.textContent = `${stats.avgMs.toFixed(2)} ms (${avgShownDist.toFixed(2)} ${avgDistUnit})`;
            if (spatialVarianceReadout) spatialVarianceReadout.textContent = 'SINGLE SEAT';
        } else {
            if (spatialSummaryStrip) spatialSummaryStrip.style.display = 'none';
        }
    }

    if (btnAddSpatialPosition) {
        btnAddSpatialPosition.addEventListener('click', () => {
            if (measuredRawDelayMs <= 0) {
                if (typeof window.showSoundEnggToast === 'function') {
                    window.showSoundEnggToast('Take a measurement first using LISTEN, then record position.');
                } else {
                    alert('Please take a measurement first using LISTEN button.');
                }
                return;
            }

            const defaultNames = ['On-Axis Center', 'Off-Axis Left', 'Off-Axis Right', 'Far Boundary', 'Near Boundary'];
            const nextName = defaultNames[venuePositions.length] || `Seat Position ${venuePositions.length + 1}`;
            const label = prompt('Enter Position Name / Seat location:', nextName) || nextName;

            const distM = (measuredRawDelayMs / 1000) * measuredSpeedOfSound;
            venuePositions.push({
                id: Date.now(),
                label: label.trim(),
                deltaMs: measuredRawDelayMs,
                equivDistM: distM,
                enabled: true
            });
            renderVenuePositions();
            if (typeof window.showSoundEnggToast === 'function') {
                window.showSoundEnggToast(`Saved "${label}" (${measuredRawDelayMs.toFixed(2)}ms) to spatial samples`);
            }
        });
    }

    if (btnClearSpatial) {
        btnClearSpatial.addEventListener('click', () => {
            if (venuePositions.length === 0) return;
            if (confirm('Clear all recorded venue spatial positions?')) {
                venuePositions = [];
                renderVenuePositions();
            }
        });
    }

    function updatePingPips(activeCount) {
        pingPips.forEach((pip, idx) => {
            if (!pip) return;
            if (idx < activeCount) {
                if (idx >= 3) {
                    pip.style.background = '#00f0ff';
                    pip.style.borderColor = '#00f0ff';
                    pip.style.boxShadow = '0 0 8px rgba(0, 240, 255, 0.8)';
                } else {
                    pip.style.background = '#00ff78';
                    pip.style.borderColor = '#00ff78';
                    pip.style.boxShadow = '0 0 8px rgba(0, 255, 120, 0.8)';
                }
            } else {
                pip.style.background = 'rgba(255, 255, 255, 0.15)';
                pip.style.borderColor = 'var(--outline)';
                pip.style.boxShadow = 'none';
            }
        });
    }

    function drawEmptyOscilloscope() {
        if (!canvasOscilloscope) return;
        const ctx = canvasOscilloscope.getContext('2d');
        const w = canvasOscilloscope.width;
        const h = canvasOscilloscope.height;
        ctx.fillStyle = '#01050a';
        ctx.fillRect(0, 0, w, h);

        // VFD Grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 26) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Bottom baseline
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(0, h - 22);
        ctx.lineTo(w, h - 22);
        ctx.stroke();
    }

    function drawLiveMicScope(chunk, recordedBuffer, recordedCount, totalSamples, sampleRate) {
        if (!canvasOscilloscope) return;
        const ctx = canvasOscilloscope.getContext('2d');
        const w = canvasOscilloscope.width;
        const h = canvasOscilloscope.height;
        ctx.fillStyle = '#01050a';
        ctx.fillRect(0, 0, w, h);

        // VFD Grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 26) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        const sensMult = getSensitivityMultiplier();
        const sensGain = 1.0 / Math.max(0.32, sensMult);
        const baselineY = h - 20;
        const midY = h / 2;

        // Track adaptive peak so iPad .measurement mode (-40 dBFS) and Android both render tall clear spikes
        let chunkPeak = 0;
        if (chunk && chunk.length > 0) {
            for (let i = 0; i < chunk.length; i++) {
                const a = Math.abs(chunk[i]);
                if (a > chunkPeak) chunkPeak = a;
            }
        }
        if (chunkPeak > liveRunningPeak) {
            liveRunningPeak = chunkPeak;
        } else {
            liveRunningPeak = Math.max(0.004 * sensMult, liveRunningPeak * 0.985);
        }
        const normRef = Math.max(0.004 * sensMult, liveRunningPeak / Math.min(2.2, Math.sqrt(sensGain)));

        // 1. Subtle Live Instantaneous Oscilloscope Wave in Background (Min/Max per pixel column)
        if (chunk && chunk.length > 0) {
            ctx.strokeStyle = 'rgba(0, 255, 120, 0.28)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const step = chunk.length / w;
            for (let x = 0; x < w; x++) {
                const s0 = Math.floor(x * step);
                const s1 = Math.max(s0 + 1, Math.min(chunk.length, Math.floor((x + 1) * step)));
                let maxAbs = 0;
                let signedVal = 0;
                for (let j = s0; j < s1; j++) {
                    const v = chunk[j];
                    const av = Math.abs(v);
                    if (av >= maxAbs) {
                        maxAbs = av;
                        signedVal = v;
                    }
                }
                const normVal = Math.max(-1, Math.min(1, signedVal / normRef));
                const y = midY - normVal * (midY - 16);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // 2. Full-Scan High-Contrast Burst Spike Envelope Timeline (0s -> captureDurationSec)
        if (recordedBuffer && totalSamples > 0 && recordedCount > 0) {
            const playheadX = Math.min(w, Math.max(1, Math.floor((recordedCount / totalSamples) * w)));
            const samplesPerPx = totalSamples / w;

            // Fill under captured burst spikes
            ctx.beginPath();
            ctx.moveTo(0, baselineY);
            for (let x = 0; x < playheadX; x++) {
                const sStart = Math.floor(x * samplesPerPx);
                const sEnd = Math.min(recordedCount, Math.max(sStart + 1, Math.floor((x + 1) * samplesPerPx)));
                let colPeak = 0;
                // Stride by at most 2 samples for speed while never missing a 3.5ms (168-sample) pulse
                const stride = (sEnd - sStart > 64) ? 2 : 1;
                for (let idx = sStart; idx < sEnd; idx += stride) {
                    const a = Math.abs(recordedBuffer[idx]);
                    if (a > colPeak) colPeak = a;
                }
                const ratio = Math.min(1.0, colPeak / normRef);
                const comp = Math.pow(ratio, 0.65); // Crisp visual contrast for spikes over noise floor
                const y = baselineY - comp * (baselineY - 24);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(playheadX, baselineY);
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, 18, 0, baselineY);
            grad.addColorStop(0, 'rgba(0, 255, 120, 0.45)');
            grad.addColorStop(0.65, 'rgba(0, 240, 255, 0.18)');
            grad.addColorStop(1, 'rgba(0, 240, 255, 0.02)');
            ctx.fillStyle = grad;
            ctx.fill();

            // Glowing Spike Contour Line
            ctx.beginPath();
            for (let x = 0; x < playheadX; x++) {
                const sStart = Math.floor(x * samplesPerPx);
                const sEnd = Math.min(recordedCount, Math.max(sStart + 1, Math.floor((x + 1) * samplesPerPx)));
                let colPeak = 0;
                const stride = (sEnd - sStart > 64) ? 2 : 1;
                for (let idx = sStart; idx < sEnd; idx += stride) {
                    const a = Math.abs(recordedBuffer[idx]);
                    if (a > colPeak) colPeak = a;
                }
                const ratio = Math.min(1.0, colPeak / normRef);
                const comp = Math.pow(ratio, 0.65);
                const y = baselineY - comp * (baselineY - 24);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = '#00ff78';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            // Active Playhead Sweep Line
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(playheadX, 0);
            ctx.lineTo(playheadX, baselineY);
            ctx.stroke();
        }

        // Baseline Axis
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, baselineY);
        ctx.lineTo(w, baselineY);
        ctx.stroke();

        // Pulsing Live Indicator Badge
        ctx.fillStyle = 'rgba(0, 255, 120, 0.15)';
        ctx.fillRect(8, 6, 195, 16);
        ctx.strokeStyle = '#00ff78';
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 6, 195, 16);
        ctx.fillStyle = '#00ff78';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('LIVE MIC • CAPTURING 60 BPM SPIKES', 14, 17);
    }

    function stopAutoPingListening() {
        isListeningPing = false;
        if (autoPingTimeoutTimer) {
            clearTimeout(autoPingTimeoutTimer);
            autoPingTimeoutTimer = null;
        }
        if (batchProcessor) {
            try {
                batchProcessor.disconnect();
            } catch (e) {}
            batchProcessor = null;
        }
        if (autoMediaStream) {
            autoMediaStream.getTracks().forEach(t => t.stop());
            autoMediaStream = null;
        }
        if (autoAudioCtx && autoAudioCtx.state === 'running') {
            try {
                autoAudioCtx.suspend();
            } catch (e) {}
        }
        const progressWrap = document.getElementById('delay-record-progress-wrap');
        const progressBar = document.getElementById('delay-record-progress-bar');
        if (progressWrap) progressWrap.style.display = 'none';
        if (progressBar) progressBar.style.width = '0%';

        if (btnStartAutoPing) btnStartAutoPing.classList.remove('is-recording');
        if (btnAutoPingText) btnAutoPingText.textContent = 'RECORD & ANALYZE (60 BPM)';
        if (iconAutoPing) iconAutoPing.textContent = 'mic';
        const levelBadge = document.getElementById('auto-ping-level-badge');
        if (levelBadge) {
            levelBadge.textContent = 'STANDBY';
            levelBadge.style.background = 'rgba(0, 240, 255, 0.15)';
            levelBadge.style.color = 'var(--primary)';
            levelBadge.style.borderColor = 'var(--primary)';
        }
    }
    window.stopAutoPingListening = stopAutoPingListening;

    function updateAutoPingDisplay() {
        const totalDelay = Math.max(0, measuredRawDelayMs + selectedHaasMs);
        if (autoPingDelayOutput) {
            autoPingDelayOutput.innerHTML = `${totalDelay.toFixed(2)}<span class="delay-unit">ms</span>`;
        }

        const equivDistMeters = (totalDelay / 1000) * measuredSpeedOfSound;
        const equivDistFeet = equivDistMeters * 3.28084;
        if (autoPingDistReadout) {
            if (window.globalUnitSystem === 'imperial') {
                autoPingDistReadout.textContent = `Equiv. Distance: ${equivDistFeet.toFixed(2)} ft`;
            } else {
                autoPingDistReadout.textContent = `Equiv. Distance: ${equivDistMeters.toFixed(2)} m`;
            }
        }
    }

    // Acoustic Pulse-Compression & GCC-PHAT DSP Functions (extracted to delay/delayAcousticDsp.js)
    const {
        applyBandpassFilter,
        fftRadix2,
        buildTemplateAutoCorrelation,
        getReferencePulseTemplates,
        correlateTemplateIQ,
        computeMatchedFilterETC,
        smoothETCEnvelope,
        analyzeBurstArrivals
    } = window.DelayAcousticDsp;

    // Continuous Batch Audio Analyzer (60 BPM multi-burst segmentation, ensemble averaging & consensus)
    function analyzeBatchRecording(recordedBuffer, sampleRate, isReanalysis = false) {
        if (!recordedBuffer || recordedBuffer.length < sampleRate * 1.5) {
            if (autoPingStatus) autoPingStatus.textContent = 'CAPTURE TOO SHORT • RETRY';
            return;
        }

        // Persist recording so adjusting the Detection Sensitivity slider re-analyzes immediately
        lastRecordedBuffer = recordedBuffer;
        lastRecordedSampleRate = sampleRate;

        const sensMultiplier = getSensitivityMultiplier();

        // 1. Zero-phase wideband bandpass filter (650 Hz - 7000 Hz)
        const filtered = applyBandpassFilter(recordedBuffer, sampleRate);

        // 2. Dual reference templates (Broadband Micro-Chirp + Classic Click auto-sensing)
        const templates = getReferencePulseTemplates(sampleRate);

        // 3. Segment into 60 BPM burst epochs (1.0s interval)
        const blockSize = Math.round(0.005 * sampleRate); // 5ms
        const numBlocks = Math.floor(filtered.length / blockSize);
        const blockEnergy = new Float32Array(numBlocks);
        let maxBlockEnergy = 0;
        for (let b = 0; b < numBlocks; b++) {
            let sum = 0;
            const start = b * blockSize;
            for (let i = 0; i < blockSize; i++) {
                const s = filtered[start + i];
                sum += s * s;
            }
            blockEnergy[b] = sum / blockSize;
            if (blockEnergy[b] > maxBlockEnergy) maxBlockEnergy = blockEnergy[b];
        }

        const minBlockGate = 0.0000008 * Math.min(1.0, sensMultiplier);
        if (maxBlockEnergy < minBlockGate) {
            if (autoPingStatus) autoPingStatus.textContent = 'NO BURSTS DETECTED • CHECK VOLUME';
            if (!isReanalysis && typeof window.showSoundEnggToast === 'function') {
                window.showSoundEnggToast('No acoustic pulses detected. Increase volume or Detection Sensitivity.');
            }
            updatePingPips(0);
            return;
        }

        const minBurstSpacingBlocks = Math.round(0.65 * sampleRate / blockSize); // 650ms min spacing between 60 BPM bursts
        const energyThreshold = maxBlockEnergy * 0.05 * sensMultiplier;

        const burstBlocks = [];
        let lastBlock = -minBurstSpacingBlocks;
        for (let b = 2; b < numBlocks - 20; b++) {
            if (blockEnergy[b] >= energyThreshold &&
                blockEnergy[b] >= blockEnergy[b - 1] &&
                blockEnergy[b] >= blockEnergy[b + 1] &&
                (b - lastBlock) >= minBurstSpacingBlocks) {
                burstBlocks.push(b);
                lastBlock = b;
            }
        }

        // Fallback: If coarse block detection found fewer than 2 bursts, scan with more sensitive threshold
        if (burstBlocks.length < 2) {
            const fallbackThreshold = maxBlockEnergy * 0.018 * sensMultiplier;
            burstBlocks.length = 0;
            lastBlock = -minBurstSpacingBlocks;
            for (let b = 2; b < numBlocks - 20; b++) {
                if (blockEnergy[b] >= fallbackThreshold &&
                    blockEnergy[b] >= blockEnergy[b - 1] &&
                    blockEnergy[b] >= blockEnergy[b + 1] &&
                    (b - lastBlock) >= minBurstSpacingBlocks) {
                    burstBlocks.push(b);
                    lastBlock = b;
                }
            }
        }

        // 4. Process each burst epoch (800ms window with 200ms causal pre-trigger lead) + build pMain-aligned Ensemble ETC & Cepstrum
        const windowDurationSec = 0.800;
        const windowLen = Math.round(windowDurationSec * sampleRate);
        const leadSamples = Math.round(0.200 * sampleRate); // 200ms pre-trigger lead so whichever click triggers first, the other is never clipped
        const alignedPreSamples = Math.round(0.350 * sampleRate); // 350ms before pMain
        const alignedPostSamples = Math.round(0.550 * sampleRate); // 550ms after pMain (supports up to ~190 meters)
        const alignedLen = alignedPreSamples + alignedPostSamples;
        const ensembleETC = new Float32Array(alignedLen);
        const ensemblePhat = new Float32Array(alignedLen);
        const maxCepLag = Math.round(0.550 * sampleRate);
        const ensembleCepstrum = new Float32Array(maxCepLag);
        let ensembleCount = 0;

        capturedPings = [];
        const allBurstETCs = [];

        burstBlocks.forEach((bIdx) => {
            const centerSample = bIdx * blockSize;
            const startSample = Math.max(0, centerSample - leadSamples);
            const endSample = Math.min(filtered.length, startSample + windowLen);
            if (endSample - startSample < windowLen * 0.75) return;

            const windowSamples = filtered.subarray(startSample, endSample);
            const { etc, maxEnergy, cepstrum, phatEnv, maxPhat } = computeMatchedFilterETC(windowSamples, templates, sampleRate);
            const arrivals = analyzeBurstArrivals(etc, maxEnergy, sampleRate, sensMultiplier, cepstrum, phatEnv);

            if (arrivals.p1 !== -1 && maxEnergy > 0) {
                const anchorIdx = (arrivals.pMain !== undefined && arrivals.pMain !== -1) ? arrivals.pMain : arrivals.p1;
                allBurstETCs.push({ etc, maxEnergy, p1: arrivals.p1, pMain: anchorIdx, candidates: arrivals.candidates || [] });
                // Accumulate normalized ETC aligned at primary peak (anchorIdx) so both pre-peak (quiet Main) and post-peak (quiet Delay) sum coherently
                const invMax = 1.0 / maxEnergy;
                const invPhat = (phatEnv && maxPhat > 0) ? (1.0 / maxPhat) : 0;
                for (let k = 0; k < alignedLen; k++) {
                    const srcIdx = anchorIdx - alignedPreSamples + k;
                    if (srcIdx >= 0 && srcIdx < etc.length) {
                        ensembleETC[k] += etc[srcIdx] * invMax;
                        if (invPhat > 0) {
                            ensemblePhat[k] += phatEnv[srcIdx] * invPhat;
                        }
                    }
                }
                if (cepstrum) {
                    const cLen = Math.min(maxCepLag, cepstrum.length);
                    for (let tau = 0; tau < cLen; tau++) {
                        ensembleCepstrum[tau] += cepstrum[tau];
                    }
                }
                ensembleCount++;
            }

            if (arrivals.p1 !== -1 && arrivals.p2 !== -1) {
                const deltaSamples = arrivals.refinedP2 - arrivals.refinedP1;
                const deltaMs = (deltaSamples / sampleRate) * 1000;
                if (deltaMs >= 0.5 && deltaMs <= 550) {
                    capturedPings.push({
                        deltaMs,
                        p1: arrivals.p1,
                        p2: arrivals.p2,
                        etc: arrivals.etcSmooth || etc,
                        sampleRate,
                        windowSamples,
                        candidates: arrivals.candidates || []
                    });
                }
            }
        });

        // 4b. Evaluate coherent pMain-aligned Ensemble ETC (boosts quiet Main or quiet Delay speaker SNR by sqrt(N))
        let ensemblePing = null;
        if (ensembleCount >= 1) {
            let ensMax = 0;
            for (let k = 0; k < alignedLen; k++) {
                ensembleETC[k] /= ensembleCount;
                ensemblePhat[k] /= ensembleCount;
                if (ensembleETC[k] > ensMax) ensMax = ensembleETC[k];
            }
            for (let tau = 0; tau < maxCepLag; tau++) {
                ensembleCepstrum[tau] /= ensembleCount;
            }
            const ensArrivals = analyzeBurstArrivals(ensembleETC, ensMax, sampleRate, sensMultiplier, ensembleCepstrum, ensemblePhat);
            if (ensArrivals.p1 !== -1 && ensArrivals.p2 !== -1) {
                const ensDeltaMs = ((ensArrivals.refinedP2 - ensArrivals.refinedP1) / sampleRate) * 1000;
                if (ensDeltaMs >= 0.5 && ensDeltaMs <= 550) {
                    ensemblePing = {
                        deltaMs: ensDeltaMs,
                        p1: ensArrivals.p1,
                        p2: ensArrivals.p2,
                        etc: ensArrivals.etcSmooth || ensembleETC,
                        sampleRate,
                        candidates: ensArrivals.candidates || []
                    };
                    capturedPings.push(ensemblePing);
                }
            }
        }

        // 5. Evaluate captured bursts
        if (capturedPings.length === 0) {
            if (autoPingStatus) autoPingStatus.textContent = 'NO DUAL ARRIVALS (INCREASE SENSITIVITY OR PA LEVEL)';
            if (!isReanalysis && typeof window.showSoundEnggToast === 'function') {
                window.showSoundEnggToast('Could not resolve 2 speaker arrivals. Try increasing Detection Sensitivity or PA volume.');
            }
            // Still draw the single-arrival ETC so the user can see the captured primary wavefront
            if (allBurstETCs.length > 0) {
                const singleEtc = ensembleCount >= 1 ? ensembleETC : allBurstETCs[0].etc;
                const singleP1 = ensembleCount >= 1 ? alignedPreSamples : allBurstETCs[0].p1;
                drawCaptureWaveform(singleEtc, singleP1, -1, sampleRate, 0);
            }
            updatePingPips(0);
            return;
        }

        // Outlier rejection & statistical cluster consensus:
        // Group pings into clusters within ±1.2ms to find the dominant physical arrival
        const clusters = [];
        capturedPings.forEach(p => {
            let cl = clusters.find(c => Math.abs(c.center - p.deltaMs) <= 1.2);
            if (cl) {
                cl.pings.push(p);
                cl.center = cl.pings.reduce((s, x) => s + x.deltaMs, 0) / cl.pings.length;
            } else {
                clusters.push({ center: p.deltaMs, pings: [p] });
            }
        });
        clusters.sort((a, b) => b.pings.length - a.pings.length);
        const bestCluster = clusters[0];
        const validPings = bestCluster.pings;
        const validDeltas = validPings.map(p => p.deltaMs);
        const avgDelta = validDeltas.reduce((s, v) => s + v, 0) / validDeltas.length;
        measuredRawDelayMs = avgDelta;

        const spread = (validDeltas.length >= 2)
            ? (Math.max(...validDeltas) - Math.min(...validDeltas))
            : 0;

        let conf = '99.9%';
        if (spread > 0.35) conf = '95%';
        else if (spread > 0.15) conf = '98.5%';

        const totalBurstsDetected = Math.max(1, burstBlocks.length);
        const lockedBurstsCount = Math.min(totalBurstsDetected, validPings.length);
        updatePingPips(Math.min(5, lockedBurstsCount));

        if (autoPingStatus) {
            autoPingStatus.textContent = `LOCKED (${lockedBurstsCount}/${totalBurstsDetected} BURSTS • ${conf} CONF)`;
        }

        // Prefer ensemblePing if it agrees with consensus, otherwise pick cleanest representative burst
        let bestPing = (ensemblePing && Math.abs(ensemblePing.deltaMs - avgDelta) <= 1.2)
            ? ensemblePing
            : (validPings[0] || capturedPings[0]);
        if (bestPing !== ensemblePing) {
            let minDiff = 999;
            validPings.forEach(p => {
                const diff = Math.abs(p.deltaMs - avgDelta);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestPing = p;
                }
            });
        }

        drawCaptureWaveform(bestPing.etc, bestPing.p1, bestPing.p2, sampleRate, avgDelta);

        // If this was a re-measure of a specific position, update it in venuePositions
        if (reMeasureTargetId) {
            const targetPos = venuePositions.find(p => p.id === reMeasureTargetId);
            if (targetPos) {
                targetPos.deltaMs = measuredRawDelayMs;
                targetPos.equivDistM = (measuredRawDelayMs / 1000) * measuredSpeedOfSound;
                if (!isReanalysis && typeof window.showSoundEnggToast === 'function') {
                    window.showSoundEnggToast(`Updated ${targetPos.label} to ${measuredRawDelayMs.toFixed(2)}ms!`);
                }
            }
            reMeasureTargetId = null;
            renderVenuePositions();
        }

        updateAutoPingDisplay();
        if (btnApplyAutoDelay) {
            btnApplyAutoDelay.removeAttribute('disabled');
            btnApplyAutoDelay.classList.add('ready');
        }

        // Inline Result Lock Badge: Display directly within the VFD card
        if (autoPingBurstLockBadge) {
            autoPingBurstLockBadge.style.display = 'inline-block';
            autoPingBurstLockBadge.textContent = `✓ ${lockedBurstsCount}/${totalBurstsDetected} BURSTS LOCKED`;
        }
    }

    async function startAutoPingListening() {
        if (isListeningPing) {
            stopAutoPingListening();
            if (autoPingStatus) {
                autoPingStatus.textContent = 'CANCELLED';
            }
            return;
        }

        try {
            // Configure native iOS / Android audio session for .measurement mode
            const audioPlugin = window.Capacitor?.registerPlugin ? window.Capacitor.registerPlugin('AudioSessionPlugin') : window.Capacitor?.Plugins?.AudioSessionPlugin;
            try {
                if (audioPlugin && typeof audioPlugin.configureAudioSession === 'function') {
                    await audioPlugin.configureAudioSession();
                }
            } catch (pluginErr) {
                console.warn('AudioSessionPlugin configuration warning:', pluginErr);
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: { ideal: 48000 },
                    channelCount: { ideal: 1 }
                }
            });
            try {
                if (audioPlugin && typeof audioPlugin.configureAudioSession === 'function') {
                    await audioPlugin.configureAudioSession();
                }
            } catch (e) {}
            autoMediaStream = stream;
            isListeningPing = true;
            capturedPings = [];
            liveRunningPeak = 0.008 * getSensitivityMultiplier();
            updatePingPips(0);
            if (autoPingBurstLockBadge) {
                autoPingBurstLockBadge.style.display = 'none';
            }

            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!autoAudioCtx || autoAudioCtx.state === 'closed') {
                try {
                    autoAudioCtx = new AudioContextClass({ sampleRate: 48000, latencyHint: 'interactive' });
                } catch (e) {
                    autoAudioCtx = new AudioContextClass();
                }
            }
            if (autoAudioCtx.state === 'suspended') {
                await autoAudioCtx.resume();
            }

            const source = autoAudioCtx.createMediaStreamSource(stream);
            const sampleRate = autoAudioCtx.sampleRate;

            // Temperature speed of sound
            const temp = parseFloat(tempInput.value) || 20;
            const tUnit = tempUnitSelect.value;
            const tempC = (tUnit === 'F') ? (temp - 32) * 5/9 : temp;
            measuredSpeedOfSound = window.AudioCalcs.calcSpeedOfSound(tempC);

            if (btnStartAutoPing) btnStartAutoPing.classList.add('is-recording');
            if (btnAutoPingText) btnAutoPingText.textContent = `STOP SCAN (${captureDurationSec.toFixed(0)}s)`;
            if (iconAutoPing) iconAutoPing.textContent = 'stop';
            if (autoPingStatus) autoPingStatus.textContent = `RECORDING 0.0s / ${captureDurationSec.toFixed(0)}s...`;

            const levelBadge = document.getElementById('auto-ping-level-badge');
            if (levelBadge) {
                levelBadge.textContent = 'MIC ACTIVE 🟢';
                levelBadge.style.background = 'rgba(0, 255, 120, 0.15)';
                levelBadge.style.color = '#00ff78';
                levelBadge.style.borderColor = '#00ff78';
            }

            const progressWrap = document.getElementById('delay-record-progress-wrap');
            const progressBar = document.getElementById('delay-record-progress-bar');
            if (progressWrap) progressWrap.style.display = 'block';
            if (progressBar) progressBar.style.width = '0%';

            const totalSamples = Math.round(captureDurationSec * sampleRate);
            const recordedBuffer = new Float32Array(totalSamples);
            let recordedCount = 0;
            let lastScopeDraw = 0;
            let liveBurstCount = 0;
            let lastLiveBurstSample = -sampleRate;

            // Continuous batch recording processor
            batchProcessor = autoAudioCtx.createScriptProcessor(4096, 1, 1);
            source.connect(batchProcessor);
            batchProcessor.connect(autoAudioCtx.destination);

            batchProcessor.onaudioprocess = (e) => {
                if (!isListeningPing) return;
                const chunk = e.inputBuffer.getChannelData(0);

                // Accumulate samples
                const needed = totalSamples - recordedCount;
                const toCopy = Math.min(chunk.length, needed);
                recordedBuffer.set(chunk.subarray(0, toCopy), recordedCount);
                recordedCount += toCopy;

                // Progress update
                const progressRatio = Math.min(1.0, recordedCount / totalSamples);
                if (progressBar) progressBar.style.width = `${(progressRatio * 100).toFixed(1)}%`;
                const elapsedSec = (recordedCount / sampleRate).toFixed(1);
                if (autoPingStatus) {
                    autoPingStatus.textContent = `RECORDING... ${elapsedSec}s / ${captureDurationSec.toFixed(0)}s`;
                }

                // Level badge & live burst pip counter update
                let peakChunk = 0;
                for (let i = 0; i < chunk.length; i++) {
                    const abs = Math.abs(chunk[i]);
                    if (abs > peakChunk) peakChunk = abs;
                }
                const sensMult = getSensitivityMultiplier();
                const liveGate = Math.max(0.0025 * sensMult, liveRunningPeak * 0.38 * sensMult);
                if (peakChunk >= liveGate && (recordedCount - lastLiveBurstSample) >= Math.round(0.60 * sampleRate)) {
                    liveBurstCount++;
                    lastLiveBurstSample = recordedCount;
                    updatePingPips(Math.min(5, liveBurstCount));
                }

                if (levelBadge) {
                    if (peakChunk >= 0.94) {
                        levelBadge.textContent = 'MIC CLIPPED ⚠️';
                        levelBadge.style.background = 'rgba(255, 50, 50, 0.2)';
                        levelBadge.style.color = '#ff4444';
                        levelBadge.style.borderColor = '#ff4444';
                    } else if (peakChunk < 0.003 * sensMult) {
                        levelBadge.textContent = 'LEVEL LOW 🟡';
                        levelBadge.style.background = 'rgba(255, 200, 0, 0.15)';
                        levelBadge.style.color = '#ffcc00';
                        levelBadge.style.borderColor = '#ffcc00';
                    } else {
                        const dbfs = 20 * Math.log10(peakChunk);
                        levelBadge.textContent = `${dbfs.toFixed(0)} dBFS 🟢`;
                        levelBadge.style.background = 'rgba(0, 255, 120, 0.15)';
                        levelBadge.style.color = '#00ff78';
                        levelBadge.style.borderColor = '#00ff78';
                    }
                }

                // Live Oscilloscope sweep with full-scan spike accumulation
                const now = Date.now();
                if (now - lastScopeDraw > 40) {
                    lastScopeDraw = now;
                    drawLiveMicScope(chunk, recordedBuffer, recordedCount, totalSamples, sampleRate);
                }

                // Check completion
                if (recordedCount >= totalSamples) {
                    stopAutoPingListening();
                    if (autoPingStatus) autoPingStatus.textContent = 'ANALYZING BURSTS...';
                    setTimeout(() => {
                        analyzeBatchRecording(recordedBuffer, sampleRate, false);
                    }, 40);
                }
            };
        } catch (err) {
            console.error('Microphone access error:', err);
            alert('Could not access microphone. Please grant audio permissions.');
            stopAutoPingListening();
        }
    }

    // Professional Unipolar Energy Time Curve (ETC) Canvas Renderer
    function drawCaptureWaveform(etc, p1, p2, sampleRate, deltaMs) {
        if (!canvasOscilloscope) return;
        const ctx = canvasOscilloscope.getContext('2d');
        const w = canvasOscilloscope.width;
        const h = canvasOscilloscope.height;

        lastDrawnEtc = etc;
        lastDrawnSampleRate = sampleRate;
        lastDrawnP1 = p1;
        lastDrawnP2 = p2;
        lastDrawnDeltaMs = deltaMs;

        ctx.fillStyle = '#01050a';
        ctx.fillRect(0, 0, w, h);

        // VFD Grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 26) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        const baselineY = h - 22;

        if (!etc || etc.length === 0) {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
            ctx.beginPath();
            ctx.moveTo(0, baselineY);
            ctx.lineTo(w, baselineY);
            ctx.stroke();
            return;
        }

        // Dynamic Zoom: Auto-framing vs 100ms vs 500ms
        const p1Idx = (p1 !== null && p1 >= 0) ? p1 : 0;
        const p2Idx = (p2 !== null && p2 >= 0) ? p2 : p1Idx + Math.round(0.010 * sampleRate);
        const maxPeakIdx = Math.max(p1Idx, p2Idx);

        let windowStart = 0;
        let windowLength = etc.length;

        if (currentScopeViewMode === '500ms') {
            // 500ms Field view (~172 meters)
            const leadSamples = Math.round(0.010 * sampleRate);
            windowStart = Math.max(0, p1Idx - leadSamples);
            windowLength = Math.min(etc.length - windowStart, Math.round(0.500 * sampleRate));
        } else if (currentScopeViewMode === '100ms') {
            // 100ms Stage / Nearfield view (~34 meters)
            const leadSamples = Math.round(0.005 * sampleRate);
            windowStart = Math.max(0, p1Idx - leadSamples);
            windowLength = Math.min(etc.length - windowStart, Math.round(0.100 * sampleRate));
        } else {
            // Dynamic Auto-Zoom: window tightly frames both arrivals with 35% margin
            const leadSamples = Math.round(0.006 * sampleRate); // 6ms lead before Peak 1
            windowStart = Math.max(0, p1Idx - leadSamples);
            const arrivalSpan = maxPeakIdx - p1Idx;
            const targetSpan = Math.max(
                Math.round(0.025 * sampleRate), // At least 25ms view
                Math.round(arrivalSpan * 1.35)  // 35% margin past delay arrival
            );
            windowLength = Math.min(etc.length - windowStart, targetSpan);
        }

        if (windowLength <= 0) windowLength = etc.length;
        const step = windowLength / w;
        lastDrawnWindowStart = windowStart;
        lastDrawnStep = step;

        // Find peak within window for optimal vertical normalization
        let localMax = 0;
        for (let x = 0; x < w; x++) {
            const idx = Math.floor(windowStart + x * step);
            const val = etc[idx] || 0;
            if (val > localMax) localMax = val;
        }
        const normScale = localMax > 0 ? 1.0 / localMax : 1.0;

        // 1. Draw Translucent Cyan Gradient Fill under Energy Curve
        ctx.beginPath();
        ctx.moveTo(0, baselineY);
        for (let x = 0; x < w; x++) {
            const idx = Math.floor(windowStart + x * step);
            const val = (etc[idx] || 0) * normScale;
            const comp = Math.sqrt(Math.max(0, Math.min(1.0, val)));
            const y = baselineY - (comp * (baselineY - 16));
            ctx.lineTo(x, y);
        }
        ctx.lineTo(w, baselineY);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 10, 0, baselineY);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
        grad.addColorStop(0.7, 'rgba(0, 240, 255, 0.15)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0.02)');
        ctx.fillStyle = grad;
        ctx.fill();

        // 2. Draw Energy Time Curve Glowing Contour
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const idx = Math.floor(windowStart + x * step);
            const val = (etc[idx] || 0) * normScale;
            const comp = Math.sqrt(Math.max(0, Math.min(1.0, val)));
            const y = baselineY - (comp * (baselineY - 16));
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 3. Baseline Axis
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, baselineY);
        ctx.lineTo(w, baselineY);
        ctx.stroke();

        // 4. Marker Flag 1: Target Arrival (Green)
        let x1 = null;
        if (p1 !== null && p1 >= windowStart && p1 <= windowStart + windowLength) {
            x1 = (p1 - windowStart) / step;
            ctx.strokeStyle = '#00ff78';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(x1, 0);
            ctx.lineTo(x1, baselineY);
            ctx.stroke();
            ctx.setLineDash([]);

            const zoneName = getSelectedZoneName();
            const flag1Text = `TARGET: ${zoneName.toUpperCase()} (t1)`;
            ctx.font = 'bold 9px monospace';
            const flag1W = Math.max(90, ctx.measureText(flag1Text).width + 10);
            const badgeX = Math.max(2, Math.min(w - flag1W - 2, x1 - 4));
            ctx.fillStyle = 'rgba(0, 255, 120, 0.22)';
            ctx.fillRect(badgeX, 2, flag1W, 15);
            ctx.strokeStyle = '#00ff78';
            ctx.lineWidth = 1;
            ctx.strokeRect(badgeX, 2, flag1W, 15);
            ctx.fillStyle = '#00ff78';
            ctx.fillText(flag1Text, badgeX + 4, 13);
        }

        // 5. Marker Flag 2: Reference Main PA Delay (Orange) - Vertically Staggered
        let x2 = null;
        if (p2 !== null && p2 >= windowStart && p2 <= windowStart + windowLength) {
            x2 = (p2 - windowStart) / step;
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(x2, 0);
            ctx.lineTo(x2, baselineY);
            ctx.stroke();
            ctx.setLineDash([]);

            const flag2Text = `REF: MAIN PA (+${deltaMs.toFixed(2)}ms)`;
            ctx.font = 'bold 9px monospace';
            const flag2W = Math.max(110, ctx.measureText(flag2Text).width + 10);
            const badge2X = Math.max(2, Math.min(w - flag2W - 2, x2 + 4));
            ctx.fillStyle = 'rgba(255, 153, 0, 0.22)';
            ctx.fillRect(badge2X, 19, flag2W, 15);
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 1;
            ctx.strokeRect(badge2X, 19, flag2W, 15);
            ctx.fillStyle = '#ff9900';
            ctx.fillText(flag2Text, badge2X + 4, 30);
        }

        // 5b. Fallback: If Peak 2 is missing
        if ((p2 === null || p2 === -1) && p1 !== null) {
            const warnText = '⚠️ 1 ARRIVAL DETECTED: TAP WAVEFORM OR UNMUTE MAIN PA';
            ctx.font = 'bold 9px monospace';
            const warnW = ctx.measureText(warnText).width + 12;
            ctx.fillStyle = 'rgba(255, 153, 0, 0.25)';
            ctx.fillRect(w - warnW - 8, 8, warnW, 18);
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 1;
            ctx.strokeRect(w - warnW - 8, 8, warnW, 18);
            ctx.fillStyle = '#ff9900';
            ctx.fillText(warnText, w - warnW - 2, 20);
        }

        // 6. Bottom Delta Bracket & Text
        if (x1 !== null && x2 !== null && Math.abs(x2 - x1) > 3) {
            const leftX = Math.min(x1, x2);
            const rightX = Math.max(x1, x2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(leftX, baselineY + 4);
            ctx.lineTo(leftX, baselineY + 9);
            ctx.lineTo(rightX, baselineY + 9);
            ctx.lineTo(rightX, baselineY + 4);
            ctx.stroke();

            const distM = (deltaMs / 1000) * measuredSpeedOfSound;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px monospace';
            const bracketText = `Δt = ${deltaMs.toFixed(2)} ms (${distM.toFixed(2)}m)`;
            const textWidth = ctx.measureText(bracketText).width;
            const textX = Math.max(4, Math.min(w - textWidth - 4, (leftX + rightX) / 2 - textWidth / 2));
            ctx.fillText(bracketText, textX, baselineY + 16);
        }
    }

    // Direct waveform click/tap to manually select reference peak
    if (canvasOscilloscope) {
        canvasOscilloscope.addEventListener('click', (e) => {
            if (!lastDrawnEtc || lastDrawnP1 === null || !lastDrawnStep) return;
            const rect = canvasOscilloscope.getBoundingClientRect();
            const clickX = (e.clientX - rect.left) * (canvasOscilloscope.width / rect.width);
            const clickSampleIdx = Math.round(lastDrawnWindowStart + clickX * lastDrawnStep);

            // Search local peak within ±10ms of clicked position
            const searchRadius = Math.round(0.010 * lastDrawnSampleRate);
            const sStart = Math.max(0, clickSampleIdx - searchRadius);
            const sEnd = Math.min(lastDrawnEtc.length - 1, clickSampleIdx + searchRadius);
            let localMaxVal = -1;
            let localMaxIdx = clickSampleIdx;
            for (let s = sStart; s <= sEnd; s++) {
                if (lastDrawnEtc[s] > localMaxVal) {
                    localMaxVal = lastDrawnEtc[s];
                    localMaxIdx = s;
                }
            }

            if (Math.abs(localMaxIdx - lastDrawnP1) > 8) {
                const deltaSamples = Math.abs(localMaxIdx - lastDrawnP1);
                measuredRawDelayMs = (deltaSamples / lastDrawnSampleRate) * 1000;
                lastDrawnP2 = localMaxIdx;
                lastDrawnDeltaMs = measuredRawDelayMs;
                updateAutoPingDisplay();
                drawCaptureWaveform(lastDrawnEtc, lastDrawnP1, lastDrawnP2, lastDrawnSampleRate, measuredRawDelayMs);

                const equivDistM = (measuredRawDelayMs / 1000) * measuredSpeedOfSound;
                const isMetric = window.globalUnitSystem === 'metric';
                const distStr = isMetric ? `${equivDistM.toFixed(2)}m` : `${(equivDistM * 3.28084).toFixed(2)}ft`;
                if (typeof window.showSoundEnggToast === 'function') {
                    window.showSoundEnggToast(`Pinned arrival: +${measuredRawDelayMs.toFixed(2)}ms (${distStr})`);
                }
            }
        });
    }

    // Oscilloscope Zoom Modes Handler
    function setScopeZoomMode(mode) {
        currentScopeViewMode = mode;
        const btnAuto = document.getElementById('btn-scope-zoom-auto');
        const btn100 = document.getElementById('btn-scope-zoom-100');
        const btn500 = document.getElementById('btn-scope-zoom-500');

        if (btnAuto) {
            btnAuto.classList.toggle('active', mode === 'auto');
            btnAuto.style.background = mode === 'auto' ? 'rgba(0,240,255,0.18)' : 'transparent';
            btnAuto.style.color = mode === 'auto' ? 'var(--primary)' : 'var(--text-muted)';
            btnAuto.style.fontWeight = mode === 'auto' ? 'bold' : 'normal';
        }
        if (btn100) {
            btn100.classList.toggle('active', mode === '100ms');
            btn100.style.background = mode === '100ms' ? 'rgba(0,240,255,0.18)' : 'transparent';
            btn100.style.color = mode === '100ms' ? 'var(--primary)' : 'var(--text-muted)';
            btn100.style.fontWeight = mode === '100ms' ? 'bold' : 'normal';
        }
        if (btn500) {
            btn500.classList.toggle('active', mode === '500ms');
            btn500.style.background = mode === '500ms' ? 'rgba(0,240,255,0.18)' : 'transparent';
            btn500.style.color = mode === '500ms' ? 'var(--primary)' : 'var(--text-muted)';
            btn500.style.fontWeight = mode === '500ms' ? 'bold' : 'normal';
        }

        if (lastDrawnEtc) {
            drawCaptureWaveform(lastDrawnEtc, lastDrawnP1, lastDrawnP2, lastDrawnSampleRate, lastDrawnDeltaMs);
        }
    }

    const btnScopeZoomAuto = document.getElementById('btn-scope-zoom-auto');
    const btnScopeZoom100 = document.getElementById('btn-scope-zoom-100');
    const btnScopeZoom500 = document.getElementById('btn-scope-zoom-500');

    if (btnScopeZoomAuto) btnScopeZoomAuto.addEventListener('click', () => setScopeZoomMode('auto'));
    if (btnScopeZoom100) btnScopeZoom100.addEventListener('click', () => setScopeZoomMode('100ms'));
    if (btnScopeZoom500) btnScopeZoom500.addEventListener('click', () => setScopeZoomMode('500ms'));

    if (btnStartAutoPing) {
        btnStartAutoPing.addEventListener('click', () => startAutoPingListening());
    }

    // Haas button selection
    haasButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            haasButtons.forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            selectedHaasMs = parseFloat(btn.dataset.haas) || 0;
            updateAutoPingDisplay();
        });
    });

    // Apply measured auto delay to manual inputs
    if (btnApplyAutoDelay) {
        btnApplyAutoDelay.addEventListener('click', () => {
            const stats = getSpatialAverageData();
            const useSpatialAvg = stats && stats.enabledCount >= 2;
            const baseDelay = useSpatialAvg ? stats.avgMs : measuredRawDelayMs;

            if (baseDelay <= 0) return;
            const totalDelay = baseDelay + selectedHaasMs;
            const equivDistMeters = (totalDelay / 1000) * measuredSpeedOfSound;
            
            if (window.globalUnitSystem === 'imperial') {
                distInput.value = (equivDistMeters * 3.28084).toFixed(2);
            } else {
                distInput.value = equivDistMeters.toFixed(2);
            }
            switchManualSubmode('single');
            update();
            switchMode('manual');

            if (typeof window.showSoundEnggToast === 'function') {
                window.showSoundEnggToast(`Applied +${totalDelay.toFixed(2)}ms to Delay Calculator!`);
            }
        });
    }

    function syncGlobalFromLocalTemp() {
        const rawTemp = parseFloat(tempInput.value);
        const tUnit = tempUnitSelect.value === 'F' ? 'F' : 'C';
        if (!isNaN(rawTemp)) {
            const tempC = tUnit === 'F' ? (rawTemp - 32) * 5 / 9 : rawTemp;
            window.globalTempUnit = tUnit;
            window.globalTempC = Math.max(-30, Math.min(65, tempC));
            safeStorage.setItem('soundengg-temp-unit', tUnit);
            safeStorage.setItem('soundengg-temp-c', window.globalTempC.toFixed(2));
            if (typeof window.syncVenueEnvUI === 'function') {
                window.syncVenueEnvUI();
            }
        }
    }

    distInput.addEventListener('input', () => update());
    tempInput.addEventListener('input', () => {
        syncGlobalFromLocalTemp();
        update();
        updateAutoPingDisplay();
        renderVenuePositions();
    });
    tempUnitSelect.addEventListener('change', () => {
        const prevUnit = window.globalTempUnit || 'C';
        const nextUnit = tempUnitSelect.value === 'F' ? 'F' : 'C';
        if (prevUnit !== nextUnit && typeof window.globalTempC === 'number') {
            tempInput.value = nextUnit === 'F'
                ? ((window.globalTempC * 9 / 5) + 32).toFixed(1)
                : window.globalTempC.toFixed(1);
        }
        syncGlobalFromLocalTemp();
        update();
        updateAutoPingDisplay();
        renderVenuePositions();
    });
    document.addEventListener('unitsChanged', () => {
        syncTempFromGlobal();
        update(true);
        updateAutoPingDisplay();
        renderVenuePositions();
    });
    
    if (btnShareDelay) {
        btnShareDelay.addEventListener('click', (e) => {
            e.preventDefault();
            const t = tempInput.value;
            const u = tempUnitSelect.value;
            const isMetric = window.globalUnitSystem === 'metric';
            let shareUrl = '';
            let effD = parseFloat(distInput.value) || 0;

            if (manualMode === 'diff') {
                const m = diffMainInput?.value || '0';
                const del = diffDelayInput?.value || '0';
                effD = Math.max(0, parseFloat(m) - parseFloat(del));
                shareUrl = `${window.location.origin}${window.location.pathname}?view=delay&mode=diff&main=${m}&del=${del}&temp=${t}&unit=${u}`;
            } else {
                shareUrl = `${window.location.origin}${window.location.pathname}?view=delay&dist=${distInput.value}&temp=${t}&unit=${u}`;
            }

            const tempC = (u === 'F') ? (parseFloat(t) - 32) * 5/9 : parseFloat(t);
            const speed = isMetric ? window.AudioCalcs.calcSpeedOfSound(tempC) : window.AudioCalcs.calcSpeedOfSoundF(parseFloat(t));
            const rawMs = (effD / speed) * 1000;
            const totalMs = rawMs + selectedManualHaasMs;
            const reportStr = `SoundEngg Delay Alignment Report:\nMode: ${manualMode === 'diff' ? '2-Point Differential (Main: ' + diffMainInput?.value + ', Delay: ' + diffDelayInput?.value + ' | ΔD = ' + effD.toFixed(2) + (isMetric ? 'm' : 'ft') + ')' : 'Single Distance (' + distInput.value + (isMetric ? 'm' : 'ft') + ')'}\nTotal Delay Setting: ${totalMs.toFixed(2)} ms (Acoustic: ${rawMs.toFixed(2)} ms + Haas: +${selectedManualHaasMs} ms)\nSpeed of Sound: ${speed.toFixed(1)} ${isMetric ? 'm/s' : 'ft/s'} @ ${t}°${u}\nLink: ${shareUrl}`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(reportStr).then(() => {
                    if (typeof window.showSoundEnggToast === 'function') {
                        window.showSoundEnggToast('✓ Copied complete delay alignment report!');
                    } else {
                        alert('Report copied:\n' + reportStr);
                    }
                }).catch(() => {
                    alert('Share Link: ' + shareUrl);
                });
            } else {
                alert('Share Link: ' + shareUrl);
            }
            
            if (typeof window.trackUsageForRating === 'function') {
                window.trackUsageForRating();
            }
        });
    }

    // --- Viral FOH Alignment Share Card (Manual Mode) ---
    const btnShareCardDelay = document.getElementById('btn-share-card-delay');
    if (btnShareCardDelay) {
        btnShareCardDelay.addEventListener('click', (e) => {
            e.preventDefault();
            const t = tempInput.value;
            const u = tempUnitSelect.value;
            const isMetric = window.globalUnitSystem !== 'imperial';
            let effD = parseFloat(distInput.value) || 0;
            let zoneTitle = 'Delay Alignment Spec';

            if (manualMode === 'diff') {
                const m = diffMainInput?.value || '0';
                const del = diffDelayInput?.value || '0';
                effD = Math.max(0, parseFloat(m) - parseFloat(del));
                zoneTitle = `Ref ${m}${isMetric ? 'm' : 'ft'} − Target ${del}${isMetric ? 'm' : 'ft'}`;
            } else {
                zoneTitle = `Main PA ↔ Delay (${distInput.value}${isMetric ? 'm' : 'ft'})`;
            }

            const tempC = (u === 'F') ? (parseFloat(t) - 32) * 5/9 : parseFloat(t);
            const speed = isMetric ? window.AudioCalcs.calcSpeedOfSound(tempC) : window.AudioCalcs.calcSpeedOfSoundF(parseFloat(t));
            const rawMs = effD > 0 ? (effD / speed) * 1000 : 0;
            const totalMs = rawMs + (rawMs > 0 ? selectedManualHaasMs : 0);

            const cardData = {
                mode: 'manual',
                precision: 2,
                zoneName: zoneTitle,
                venueName: 'Festival Main Stage FOH',
                totalDelayMs: totalMs.toFixed(2),
                flightTimeMs: rawMs.toFixed(2),
                haasMs: selectedManualHaasMs.toFixed(1),
                distance: effD.toFixed(2),
                unit: isMetric ? 'm' : 'ft',
                equivDist: isMetric ? (effD * 3.28084).toFixed(2) + ' ft' : (effD / 3.28084).toFixed(2) + ' m',
                temp: parseFloat(t || 22).toFixed(1),
                tempUnit: `°${u}`,
                speed: (isMetric ? speed : speed / 3.28084).toFixed(1)
            };

            if (window.SoundEnggShareCard) {
                window.SoundEnggShareCard.openModal(cardData);
            }
        });
    }

    // --- Viral FOH Alignment Share Card (Auto-Ping Mode) ---
    const btnAutoPingShareCard = document.getElementById('btn-auto-ping-share-card');
    if (btnAutoPingShareCard) {
        btnAutoPingShareCard.addEventListener('click', (e) => {
            e.preventDefault();
            const zoneName = typeof getSelectedZoneName === 'function'
                ? getSelectedZoneName()
                : ((document.getElementById('delay-zone-select')?.value === 'Custom' && document.getElementById('delay-zone-custom-input')?.value)
                    ? document.getElementById('delay-zone-custom-input').value
                    : (document.getElementById('delay-zone-select')?.value || 'Front Fill'));

            const isMetric = window.globalUnitSystem !== 'imperial';
            const stats = typeof getSpatialAverageData === 'function' ? getSpatialAverageData() : null;
            const useSpatialAvg = stats && stats.enabledCount >= 2;
            let rawDelayMs = useSpatialAvg
                ? stats.avgMs
                : (typeof measuredRawDelayMs === 'number' && measuredRawDelayMs > 0 ? measuredRawDelayMs : 0);

            // Fallback: parse directly from DOM readout if variable was reset
            if (rawDelayMs <= 0 && autoPingDelayOutput) {
                const parsedDom = parseFloat(autoPingDelayOutput.textContent);
                if (!isNaN(parsedDom) && parsedDom > 0) {
                    rawDelayMs = Math.max(0, parsedDom - (typeof selectedHaasMs === 'number' ? selectedHaasMs : 0));
                }
            }

            const haasOffset = typeof selectedHaasMs === 'number' ? selectedHaasMs : 0;
            const totalDelay = rawDelayMs > 0 ? (rawDelayMs + haasOffset) : 0;

            const gUnit = window.globalTempUnit || (tempUnitSelect ? tempUnitSelect.value : 'C');
            const gTempC = typeof window.globalTempC === 'number'
                ? window.globalTempC
                : (tempInput ? ((gUnit === 'F') ? (parseFloat(tempInput.value) - 32) * 5 / 9 : parseFloat(tempInput.value)) : 22.0);
            const displayTemp = gUnit === 'F' ? ((gTempC * 9 / 5) + 32).toFixed(1) : gTempC.toFixed(1);

            const effSpeed = (typeof measuredSpeedOfSound === 'number' && measuredSpeedOfSound > 0)
                ? measuredSpeedOfSound
                : window.AudioCalcs.calcSpeedOfSound(gTempC);
            const equivDistMeters = (totalDelay / 1000) * effSpeed;
            const equivDistFeet = equivDistMeters * 3.28084;

            const burstStatusText = autoPingStatus ? autoPingStatus.textContent.trim() : '';

            const cardData = {
                mode: 'autoping',
                precision: 2,
                zoneName: `Main PA ↔ ${zoneName}`,
                targetShortName: zoneName,
                venueName: 'Festival Main Stage FOH',
                totalDelayMs: totalDelay.toFixed(2),
                flightTimeMs: rawDelayMs.toFixed(2),
                haasMs: haasOffset.toFixed(1),
                distance: isMetric ? equivDistMeters.toFixed(2) : equivDistFeet.toFixed(2),
                unit: isMetric ? 'm' : 'ft',
                equivDist: isMetric ? equivDistFeet.toFixed(2) + ' ft' : equivDistMeters.toFixed(2) + ' m',
                temp: displayTemp,
                tempUnit: `°${gUnit}`,
                speed: effSpeed.toFixed(1),
                burstStatus: burstStatusText,
                etcCurve: lastDrawnEtc || null,
                p1: lastDrawnP1,
                p2: lastDrawnP2,
                sampleRate: lastDrawnSampleRate || 48000,
                windowStart: lastDrawnWindowStart || 0,
                step: lastDrawnStep || 1
            };

            if (window.SoundEnggShareCard) {
                window.SoundEnggShareCard.openModal(cardData);
            }
        });
    }

    // Collapsible theory card
    const theoryCard = document.getElementById('delay-theory-card');
    const btnToggleTheory = document.getElementById('btn-toggle-delay-theory');
    if (btnToggleTheory && theoryCard) {
        btnToggleTheory.addEventListener('click', () => {
            theoryCard.classList.toggle('expanded');
        });
    }

    // Initial runs
    update(true);
    switchMode('auto');
    pull();
    document.addEventListener('authSuccess', pull);

    // Lifecycle Listeners to cleanly deactivate loop when app is hidden or backgrounded
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (isLoopingClick) stopAlignmentLoop();
            if (isListeningPing) stopAutoPingListening();
        }
    });

    if (window.Capacitor?.Plugins?.App) {
        try {
            window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
                if (state && !state.isActive) {
                    if (isLoopingClick) stopAlignmentLoop();
                    if (isListeningPing) stopAutoPingListening();
                }
            });
        } catch (e) {}
    }
}