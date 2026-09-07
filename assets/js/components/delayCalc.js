function initDelayCalc() {
    const distInput = document.getElementById('delay-dist-mod');
    const distLabel = document.getElementById('label-dist-mod');
    const tempInput = document.getElementById('delay-temp-mod');
    const tempUnitSelect = document.getElementById('delay-temp-unit-mod');
    const outputEl = document.getElementById('delay-output-mod');
    const progressEl = document.getElementById('delay-progress-mod');
    const progressPercentEl = document.getElementById('delay-progress-percent');

    const btnShareDelay = document.getElementById('btn-share-delay');

    if (!distInput || !tempInput || !outputEl || !progressEl) return;

    // --- Parse URL Share Parameters ---
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam === 'delay') {
        const distQ = urlParams.get('dist');
        const tempQ = urlParams.get('temp');
        const unitQ = urlParams.get('unit');
        if (distQ) distInput.value = parseFloat(distQ);
        if (tempQ) tempInput.value = parseFloat(tempQ);
        if (unitQ) tempUnitSelect.value = unitQ;
    }

    function update(skipCloudSave = false) {
        const dist = parseFloat(distInput.value) || 0;
        const temp = parseFloat(tempInput.value) || 0;
        const tUnit = tempUnitSelect.value;
        
        let delayMs = 0;

        if (window.globalUnitSystem === 'metric') {
            if (distLabel) distLabel.textContent = 'Distance (m)';
            const tempC = (tUnit === 'F') ? (temp - 32) * 5/9 : temp;
            const speed = window.AudioCalcs.calcSpeedOfSound(tempC);
            delayMs = window.AudioCalcs.calcDelayMs(dist, speed);
        } else {
            if (distLabel) distLabel.textContent = 'Distance (ft)';
            const tempF = (tUnit === 'C') ? (temp * 9/5) + 32 : temp;
            const speed = window.AudioCalcs.calcSpeedOfSoundF(tempF);
            delayMs = window.AudioCalcs.calcDelayMs(dist, speed);
        }

        outputEl.innerHTML = `${delayMs.toFixed(2)}<span class="delay-unit">ms</span>`;
        const progressPercent = Math.min(100, (delayMs / 50) * 100); 
        progressEl.style.width = `${progressPercent}%`;
        
        if (progressPercentEl) {
            progressPercentEl.textContent = `${progressPercent.toFixed(1)}%`;
        }

        // Trigger Cloud Save if not just loading
        if (!skipCloudSave) {
            saveConfigToCloud('delay', { dist, temp, tUnit });
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
                distInput.value = data.data.dist;
                tempInput.value = data.data.temp;
                tempUnitSelect.value = data.data.tUnit;
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
            tabAuto.style.background = 'rgba(0, 240, 255, 0.15)';
            tabAuto.style.color = 'var(--primary)';
            tabAuto.style.borderColor = 'var(--primary)';

            tabManual.classList.remove('active');
            tabManual.style.background = 'transparent';
            tabManual.style.color = 'var(--text-muted)';
            tabManual.style.borderColor = 'transparent';

            manualContainer.style.display = 'none';
            autoContainer.style.display = 'flex';
            drawEmptyOscilloscope();
        } else {
            tabManual.classList.add('active');
            tabManual.style.background = 'rgba(0, 240, 255, 0.15)';
            tabManual.style.color = 'var(--primary)';
            tabManual.style.borderColor = 'var(--primary)';

            tabAuto.classList.remove('active');
            tabAuto.style.background = 'transparent';
            tabAuto.style.color = 'var(--text-muted)';
            tabAuto.style.borderColor = 'transparent';

            autoContainer.style.display = 'none';
            manualContainer.style.display = 'flex';
            stopAutoPingListening();
        }
    }

    if (tabManual && tabAuto) {
        tabManual.addEventListener('click', () => switchMode('manual'));
        tabAuto.addEventListener('click', () => switchMode('auto'));
    }

    // --- FOH Reference Alignment Click Player ---
    const btnPlayAlignment = document.getElementById('btn-play-alignment-click');
    const iconPlayAlignment = document.getElementById('icon-play-alignment');
    const textPlayAlignment = document.getElementById('text-play-alignment');
    let alignmentAudio = null;
    let isLoopingClick = false;

    if (btnPlayAlignment) {
        btnPlayAlignment.addEventListener('click', () => {
            if (isLoopingClick) {
                if (alignmentAudio) {
                    alignmentAudio.pause();
                    alignmentAudio.currentTime = 0;
                }
                isLoopingClick = false;
                if (iconPlayAlignment) iconPlayAlignment.textContent = 'play_arrow';
                if (textPlayAlignment) textPlayAlignment.textContent = 'LOOP FROM PHONE';
                btnPlayAlignment.style.background = 'rgba(0, 240, 255, 0.1)';
                btnPlayAlignment.style.borderColor = 'var(--primary)';
            } else {
                if (!alignmentAudio) {
                    alignmentAudio = new Audio('assets/audio/soundengg-delay-alignment-click-48k.wav');
                    alignmentAudio.loop = true;
                }
                alignmentAudio.play().then(() => {
                    isLoopingClick = true;
                    if (iconPlayAlignment) iconPlayAlignment.textContent = 'stop';
                    if (textPlayAlignment) textPlayAlignment.textContent = 'STOP LOOPING';
                    btnPlayAlignment.style.background = 'rgba(0, 255, 120, 0.15)';
                    btnPlayAlignment.style.borderColor = '#00ff78';
                    if (typeof window.showSoundEnggToast === 'function') {
                        window.showSoundEnggToast('Looping 1Hz Alignment Click through audio output');
                    }
                }).catch((err) => {
                    console.error('Audio playback error:', err);
                    alert('Tap screen or connect headphones/DI to play audio.');
                });
            }
        });
    }

    // --- Acoustic Auto Ping DSP Engine ---
    const btnStartAutoPing = document.getElementById('btn-start-auto-ping');
    const btnAutoPingText = document.getElementById('btn-auto-ping-text');
    const iconAutoPing = document.getElementById('icon-auto-ping');
    const autoPingStatus = document.getElementById('auto-ping-status');
    const autoPingDelayOutput = document.getElementById('auto-ping-delay-output');
    const autoPingDistReadout = document.getElementById('auto-ping-dist-readout');
    const btnApplyAutoDelay = document.getElementById('btn-apply-auto-delay');
    const canvasOscilloscope = document.getElementById('delay-oscilloscope');
    const haasButtons = document.querySelectorAll('.btn-haas-opt');

    let autoAudioCtx = null;
    let autoMediaStream = null;
    let isListeningPing = false;
    let measuredRawDelayMs = 0;
    let selectedHaasMs = 0;
    let measuredSpeedOfSound = 344;

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

        // Center baseline
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
    }

    function stopAutoPingListening() {
        isListeningPing = false;
        if (autoMediaStream) {
            autoMediaStream.getTracks().forEach(t => t.stop());
            autoMediaStream = null;
        }
        if (btnAutoPingText) btnAutoPingText.textContent = 'LISTEN FOR TRANSIENT DELTA';
        if (iconAutoPing) iconAutoPing.textContent = 'hearing';
        if (autoPingStatus) autoPingStatus.textContent = 'STANDBY';
    }

    async function startAutoPingListening() {
        if (isListeningPing) {
            stopAutoPingListening();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            autoMediaStream = stream;
            isListeningPing = true;

            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!autoAudioCtx || autoAudioCtx.state === 'closed') {
                autoAudioCtx = new AudioContextClass();
            }
            if (autoAudioCtx.state === 'suspended') {
                await autoAudioCtx.resume();
            }

            const source = autoAudioCtx.createMediaStreamSource(stream);
            const sampleRate = autoAudioCtx.sampleRate;
            
            // Calculate current speed of sound from temperature setting
            const temp = parseFloat(tempInput.value) || 20;
            const tUnit = tempUnitSelect.value;
            const tempC = (tUnit === 'F') ? (temp - 32) * 5/9 : temp;
            measuredSpeedOfSound = window.AudioCalcs.calcSpeedOfSound(tempC);

            if (btnAutoPingText) btnAutoPingText.textContent = 'RECORDING TRANSIENTS...';
            if (iconAutoPing) iconAutoPing.textContent = 'graphic_eq';
            if (autoPingStatus) autoPingStatus.textContent = 'CAPTURING...';

            // Record 1.2 seconds of audio buffer to capture transient arrivals
            const recordDurationSec = 1.2;
            const bufferSize = Math.round(sampleRate * recordDurationSec);
            const rawSamples = new Float32Array(bufferSize);
            let samplesCollected = 0;

            const processor = autoAudioCtx.createScriptProcessor(4096, 1, 1);
            source.connect(processor);
            processor.connect(autoAudioCtx.destination);

            processor.onaudioprocess = (e) => {
                if (!isListeningPing) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const toCopy = Math.min(inputData.length, bufferSize - samplesCollected);
                rawSamples.set(inputData.subarray(0, toCopy), samplesCollected);
                samplesCollected += toCopy;

                if (samplesCollected >= bufferSize) {
                    processor.disconnect();
                    source.disconnect();
                    stopAutoPingListening();
                    processTransientBuffer(rawSamples, sampleRate);
                }
            };
        } catch (err) {
            console.error('Microphone access error:', err);
            alert('Could not access microphone. Please grant audio permissions.');
            stopAutoPingListening();
        }
    }

    // Process buffer: High-pass filter, energy derivative, double-peak detection
    function processTransientBuffer(samples, sampleRate) {
        if (autoPingStatus) autoPingStatus.textContent = 'ANALYZING DELAY...';

        // 1. Digital 2nd-order High-Pass Filter at 2500 Hz (fc) to isolate transient click
        const fc = 2500;
        const omega = 2 * Math.PI * fc / sampleRate;
        const alpha = Math.sin(omega) / (2 * 0.7071);
        const cosw = Math.cos(omega);
        const b0 = (1 + cosw) / 2;
        const b1 = -(1 + cosw);
        const b2 = (1 + cosw) / 2;
        const a0 = 1 + alpha;
        const a1 = -2 * cosw;
        const a2 = 1 - alpha;

        const filtered = new Float32Array(samples.length);
        let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        for (let i = 0; i < samples.length; i++) {
            const x0 = samples[i];
            const y0 = (b0/a0)*x0 + (b1/a0)*x1 + (b2/a0)*x2 - (a1/a0)*y1 - (a2/a0)*y2;
            filtered[i] = y0;
            x2 = x1; x1 = x0;
            y2 = y1; y1 = y0;
        }

        // 2. Energy Envelope & Derivative
        const envelope = new Float32Array(filtered.length);
        let maxEnergy = 0;
        for (let i = 0; i < filtered.length; i++) {
            envelope[i] = filtered[i] * filtered[i];
            if (envelope[i] > maxEnergy) maxEnergy = envelope[i];
        }

        if (maxEnergy < 0.0005) {
            if (autoPingStatus) autoPingStatus.textContent = 'NO CLICK DETECTED (LOW LEVEL)';
            drawCaptureWaveform(filtered, null, null, sampleRate);
            return;
        }

        // 3. Peak 1 (Direct Fill) - First significant transient above threshold
        const threshold = maxEnergy * 0.25;
        let peak1Idx = -1;
        for (let i = 100; i < envelope.length - 200; i++) {
            if (envelope[i] > threshold && envelope[i] >= envelope[i - 1] && envelope[i] >= envelope[i + 1]) {
                peak1Idx = i;
                break;
            }
        }

        if (peak1Idx === -1) {
            if (autoPingStatus) autoPingStatus.textContent = 'TRANSIENT TOO DIFFUSE';
            drawCaptureWaveform(filtered, null, null, sampleRate);
            return;
        }

        // 4. Peak 2 (Main PA) - Look after 3ms lockout up to 100ms
        const lockoutSamples = Math.round(0.003 * sampleRate); // 3ms minimum separation
        const maxSearchSamples = Math.round(0.120 * sampleRate); // 120ms max delay
        let peak2Idx = -1;
        let peak2Energy = 0;

        const startSearch = peak1Idx + lockoutSamples;
        const endSearch = Math.min(envelope.length - 50, peak1Idx + maxSearchSamples);

        for (let i = startSearch; i < endSearch; i++) {
            if (envelope[i] > threshold * 0.4 && envelope[i] > peak2Energy) {
                if (envelope[i] >= envelope[i - 1] && envelope[i] >= envelope[i + 1]) {
                    peak2Energy = envelope[i];
                    peak2Idx = i;
                }
            }
        }

        if (peak2Idx === -1) {
            if (autoPingStatus) autoPingStatus.textContent = 'SINGLE ARRIVAL DETECTED (CHECK MAIN PA)';
            measuredRawDelayMs = 0;
            drawCaptureWaveform(filtered, peak1Idx, null, sampleRate);
            return;
        }

        // 5. Calculate Result
        const deltaSamples = peak2Idx - peak1Idx;
        measuredRawDelayMs = (deltaSamples / sampleRate) * 1000;
        
        if (autoPingStatus) autoPingStatus.textContent = 'ALIGNMENT DELTA LOCKED';
        updateAutoPingDisplay();
        drawCaptureWaveform(filtered, peak1Idx, peak2Idx, sampleRate);

        if (btnApplyAutoDelay) {
            btnApplyAutoDelay.removeAttribute('disabled');
            btnApplyAutoDelay.style.opacity = '1';
        }
    }

    function updateAutoPingDisplay() {
        const totalDelay = measuredRawDelayMs + selectedHaasMs;
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

    function drawCaptureWaveform(samples, p1, p2, sampleRate) {
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

        // Waveform
        const windowStart = (p1 !== null) ? Math.max(0, p1 - Math.round(0.005 * sampleRate)) : 0;
        const windowLength = Math.min(samples.length - windowStart, Math.round(0.100 * sampleRate)); // 100ms window
        const step = windowLength / w;

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const idx = Math.floor(windowStart + x * step);
            const val = samples[idx] || 0;
            const y = (h / 2) - (val * (h / 2) * 2.5);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Flag 1: Fill Arrival (Green)
        if (p1 !== null && p1 >= windowStart) {
            const x1 = (p1 - windowStart) / step;
            ctx.strokeStyle = '#00ff78';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, 0);
            ctx.lineTo(x1, h);
            ctx.stroke();

            ctx.fillStyle = '#00ff78';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('FILL ARRIVAL (t1)', Math.min(w - 110, x1 + 4), 16);
        }

        // Flag 2: Main PA Arrival (Orange)
        if (p2 !== null && p2 >= windowStart) {
            const x2 = (p2 - windowStart) / step;
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x2, 0);
            ctx.lineTo(x2, h);
            ctx.stroke();

            ctx.fillStyle = '#ff9900';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`MAIN PA (+${measuredRawDelayMs.toFixed(2)}ms)`, Math.min(w - 140, x2 + 4), 32);

            // Delta arrow / bracket
            if (p1 !== null) {
                const x1 = (p1 - windowStart) / step;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(x1, h - 14);
                ctx.lineTo(x2, h - 14);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`Δt = ${measuredRawDelayMs.toFixed(2)} ms`, (x1 + x2) / 2 - 30, h - 4);
            }
        }
    }

    if (btnStartAutoPing) {
        btnStartAutoPing.addEventListener('click', () => startAutoPingListening());
    }

    // Haas button selection
    haasButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            haasButtons.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--text-muted)';
                b.style.borderColor = 'var(--outline)';
            });
            btn.classList.add('active');
            btn.style.background = 'rgba(0, 240, 255, 0.15)';
            btn.style.color = 'var(--primary)';
            btn.style.borderColor = 'var(--primary)';
            selectedHaasMs = parseFloat(btn.dataset.haas) || 0;
            updateAutoPingDisplay();
        });
    });

    // Apply measured auto delay to manual inputs and cloud
    if (btnApplyAutoDelay) {
        btnApplyAutoDelay.addEventListener('click', () => {
            if (measuredRawDelayMs <= 0) return;
            const totalDelay = measuredRawDelayMs + selectedHaasMs;
            const equivDistMeters = (totalDelay / 1000) * measuredSpeedOfSound;
            
            if (window.globalUnitSystem === 'imperial') {
                distInput.value = (equivDistMeters * 3.28084).toFixed(2);
            } else {
                distInput.value = equivDistMeters.toFixed(2);
            }
            update();
            switchMode('manual');

            if (typeof window.showSoundEnggToast === 'function') {
                window.showSoundEnggToast(`Applied +${totalDelay.toFixed(2)}ms to system delay!`);
            }
        });
    }

    distInput.addEventListener('input', () => update());
    tempInput.addEventListener('input', () => update());
    tempUnitSelect.addEventListener('change', () => update());
    document.addEventListener('unitsChanged', () => {
        update(true);
        updateAutoPingDisplay();
    });
    
    if (btnShareDelay) {
        btnShareDelay.addEventListener('click', (e) => {
            e.preventDefault();
            const d = distInput.value;
            const t = tempInput.value;
            const u = tempUnitSelect.value;
            const shareUrl = `${window.location.origin}${window.location.pathname}?view=delay&dist=${d}&temp=${t}&unit=${u}`;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    if (typeof window.showSoundEnggToast === 'function') {
                        window.showSoundEnggToast('Delay calculation copied! Share with your crew.');
                    } else {
                        alert('Link copied to clipboard: ' + shareUrl);
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
    pull();
    document.addEventListener('authSuccess', pull);
}