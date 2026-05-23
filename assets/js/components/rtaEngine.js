function initProfessionalRTA() {
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
    const labelsContainer = document.getElementById('rta-labels');
    const btnCapture = document.getElementById('btn-capture-snapshot');
    
    let audioCtx, analyser, source, stream;
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
    let currentWeighting = 'a'; // Default to A-weighted
    let averagingFactor = 4; // Default averaging
    let calibrationOffset = 100;
    let peakHoldEnabled = true;
    let peakData = new Array(ISO_FREQS.length).fill(-100);
    let domFreqDisplay = "--- Hz";

    // Fullscreen RTA & Ad Reward state variables
    let isFullscreenActive = false;
    let isAdRewardClaimed = false;
    let adCountdownTimer = null;
    let adSecondsRemaining = 15;

    // Advanced Spectrogram Waterfall Variables
    let waterfallCanvas = null;
    let waterfallCtx = null;

    // Custom Mic Calibration Variables
    let calProfile = []; // Parsed { freq, offset } pairs
    let calOffsets = null; // Precomputed Float32Array matching bufferLength
    let calEnabled = false;

    // Snapshot Memory Bank (PRO FEATURE)
    let snapshots = []; // Array of { rta: [], fft: [], color: '', visible: true, id: 0 }
    const SNAPSHOT_COLORS = ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#FF8C00', '#1E90FF', '#FF4500', '#ADFF2F', '#7B68EE', '#F0E68C'];
    const slotsContainer = document.getElementById('snapshot-slots-container');

    // A-Weighting Look-up Table for 1/6 octave (interpolated centers)
    const A_WEIGHTS = { 20:-50.5, 22.4:-48.0, 25:-44.7, 28:-41.6, 31.5:-39.4, 35.5:-37.0, 40:-34.6, 45:-32.4, 50:-30.2, 56:-28.2, 63:-26.2, 71:-24.1, 80:-22.5, 90:-20.8, 100:-19.1, 112:-17.5, 125:-16.1, 140:-14.7, 160:-13.4, 180:-12.2, 200:-10.9, 224:-9.6, 250:-8.6, 280:-7.5, 315:-6.6, 355:-5.7, 400:-4.8, 450:-4.0, 500:-3.2, 560:-2.5, 630:-1.9, 710:-1.3, 800:-0.8, 900:-0.4, 1000:0, 1120:0.3, 1250:0.6, 1400:0.8, 1600:1.0, 1800:1.1, 2000:1.2, 2240:1.3, 2500:1.3, 2800:1.3, 3150:1.2, 3550:1.1, 4000:1.0, 4500:0.8, 5000:0.5, 5600:0.2, 6300:-0.1, 7100:-0.5, 8000:-1.1, 9000:-1.7, 10000:-2.5, 11200:-3.3, 12500:-4.3, 14000:-5.4, 16000:-6.6, 18000:-7.9, 20000:-9.3 };

    // Inject Labels (Simplified for 1/6 density)
    if (labelsContainer) {
        labelsContainer.innerHTML = ISO_FREQS.map((f, i) => {
            const isMajor = i % 2 === 0; // Show label every 2 bands
            return isMajor ? `<span class="freq-label">${f >= 1000 ? (f/1000)+'k' : f}</span>` : `<span class="freq-label" style="opacity:0.2">·</span>`;
        }).join('');
    }

    async function getDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputs = devices.filter(d => d.kind === 'audioinput');
            if (inputSelect) {
                inputSelect.innerHTML = inputs.map(d => `<option value="${d.deviceId}">${d.label || 'Input ' + d.deviceId.slice(0,4)}</option>`).join('');
            }
        } catch (e) { console.error("Device enumeration failed", e); }
    }

    let isAnalyzing = false;
    
    window.startAnalyzer = async function startAnalyzer(deviceId) {
        if (isAnalyzing) return;
        deviceId = deviceId || safeStorage.getItem('soundengg-mic-id') || 'default';
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }

        try {
            const constraints = { 
                audio: (deviceId && deviceId !== 'default') ? { deviceId: { exact: deviceId } } : true 
            };
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') await audioCtx.resume();

            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048; 
            analyser.smoothingTimeConstant = 0; // We'll do custom smoothing
            
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
 
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Float32Array(bufferLength);
            timeData = new Float32Array(analyser.fftSize);
            smoothedDataArray = new Float32Array(bufferLength).fill(-100);
            
            // Precompute calibration offsets matching the current bin count
            precomputeCalibrationOffsets();
            
            isInitialized = true;
            isAnalyzing = true;
            startBtn.classList.remove('pulse-glow');
            startBtn.classList.add('active', 'danger-btn');
            startBtn.innerHTML = '<span class="material-symbols-outlined">stop</span> DEACTIVATE RTA';
            
            getDevices();
            rafID = requestAnimationFrame(draw);
        } catch (e) {
            console.error("Mic access failed", e);
            startBtn.innerHTML = '<span class="material-symbols-outlined">error</span> ACCESS_DENIED';
            isAnalyzing = false;
        }
    };

    function stopAnalyzer() {
        if (isRtaPinkNoiseActive) {
            toggleRtaPinkNoise();
        }
        if (!isAnalyzing) return;
        isAnalyzing = false;
        if (rafID) cancelAnimationFrame(rafID);
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
        if (audioCtx) {
            audioCtx.suspend();
        }
        startBtn.classList.remove('active', 'danger-btn');
        startBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span> START MEASUREMENT';
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGridAndLabels();
    }
    window.stopAnalyzer = stopAnalyzer;

    function createRtaPinkNoise() {
        const bufferSize = 4096 * 2;
        const b = [0, 0, 0, 0, 0, 0, 0];
        const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b[0] = 0.99886 * b[0] + white * 0.0555179;
                b[1] = 0.99332 * b[1] + white * 0.0750759;
                b[2] = 0.96900 * b[2] + white * 0.1538520;
                b[3] = 0.86650 * b[3] + white * 0.3104856;
                b[4] = 0.55000 * b[4] + white * 0.5329522;
                b[5] = -0.7616 * b[5] - white * 0.0168980;
                output[i] = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + white * 0.5362;
                output[i] *= 0.11; // (roughly) compensatory gain
                b[6] = white * 0.115926;
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
                try { rtaPinkNoiseNode.disconnect(); } catch(e){}
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
            
            // Revert premium styling
            btn.classList.remove('active');
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.style.boxShadow = '';
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">volume_up</span> PLAY NOISE';
        } else {
            // Turn on
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') await audioCtx.resume();

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

            // Apply active premium visual glow
            btn.classList.add('active');
            btn.style.background = 'var(--primary)';
            btn.style.borderColor = 'var(--primary)';
            btn.style.color = 'var(--surface)';
            btn.style.boxShadow = '0 0 15px var(--primary)';
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">volume_up</span> STOP NOISE';
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

    function draw() {
        if (!isInitialized) return;
        requestAnimationFrame(draw);
        
        // Manual FFT with Hanning Window
        analyser.getFloatTimeDomainData(timeData);
        
        // 1. Apply Hanning Window
        const N = timeData.length;
        const windowedData = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const hanning = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
            windowedData[i] = timeData[i] * hanning;
        }

        // 2. Perform FFT
        analyser.getFloatFrequencyData(dataArray);

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
        }
        
        if (currentMode === 'rta') {
            drawRTA();
        } else if (currentMode === 'fft') {
            drawFFT();
        } else if (currentMode === 'waterfall') {
            drawWaterfall();
        }

        drawGridAndLabels();
        drawDominantOverlay();
        updateTelemetry();
    }

    function drawGridAndLabels() {
        const isLight = document.documentElement.classList.contains('light');
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        const textColor = isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';

        ctx.save();
        ctx.textAlign = 'right';
        ctx.font = "12px 'Space Grotesk', sans-serif";
        ctx.lineWidth = 0.5;

        // dB Range to show: from calibrationOffset - 100 to calibrationOffset
        const minDisplayDB = Math.floor((calibrationOffset - 100) / 10) * 10;
        const maxDisplayDB = Math.ceil(calibrationOffset / 10) * 10;

        for (let displayDB = minDisplayDB; displayDB <= maxDisplayDB; displayDB += 10) {
            const internalDB = displayDB - calibrationOffset;
            const y = canvas.height - (internalDB + 100) * (canvas.height / 100);

            if (y < 0 || y > canvas.height) continue;

            // Draw Grid Line
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = gridColor;
            ctx.moveTo(40, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();

            // Draw Label
            ctx.fillStyle = textColor;
            ctx.fillText(`${displayDB}`, 35, y + 4);
        }
        ctx.restore();
    }

    function drawRTA() {
        const barWidth = canvas.width / ISO_FREQS.length;
        const sampleRate = audioCtx.sampleRate;
        const nyquist = sampleRate / 2;

        ISO_FREQS.forEach((centerFreq, i) => {
            const x = i * barWidth;
            const ratio = Math.pow(2, 1/12); // Half of 1/6 for band edges
            const lowFreq = centerFreq / ratio;
            const highFreq = centerFreq * ratio;
            
            const lowBin = Math.max(0, Math.floor(lowFreq / nyquist * bufferLength));
            const highBin = Math.min(bufferLength - 1, Math.floor(highFreq / nyquist * bufferLength));
            
            let sum = 0;
            let count = 0;
            for (let b = lowBin; b <= highBin; b++) {
                sum += dataArray[b];
                count++;
            }
            
            let db = count > 0 ? sum / count : -100;
            if (currentWeighting === 'a') db += (A_WEIGHTS[centerFreq] || 0);
            
            // Apply extra fine calibration correction to weighted RTA bands
            if (calEnabled) {
                db += getCalOffsetForFreq(centerFreq);
            }

            if (db > peakData[i]) peakData[i] = db;
            
            // --- Draw Multi-Snapshots (RTA) ---
            snapshots.forEach(snap => {
                if (!snap.visible) return;
                const snapDb = snap.rta[i];
                if (snapDb > -100) {
                    const snapH = Math.max(0, (snapDb + 100) * (canvas.height / 100));
                    // Draw faint background fill
                    ctx.fillStyle = snap.color + '22'; // 13% opacity
                    ctx.fillRect(x + 1, canvas.height - snapH, barWidth - 2, snapH);
                    
                    // Snapshot line
                    ctx.beginPath();
                    ctx.strokeStyle = snap.color;
                    ctx.globalAlpha = 0.6;
                    ctx.setLineDash([2, 2]);
                    ctx.moveTo(x, canvas.height - snapH);
                    ctx.lineTo(x + barWidth, canvas.height - snapH);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 1.0;
                }
            });

            if (isRtaPinkNoiseActive && rtaPinkNoiseAnalyserNode) {
                const w = barWidth - 2;
                const hMic = Math.max(2, (db + 100) * (canvas.height / 100));

                // 1. Draw Mic Input (Cyan) as filled bars
                ctx.fillStyle = 'rgba(20, 167, 181, 0.8)'; // brand cyan with 80% opacity
                ctx.fillRect(x + 1, canvas.height - hMic, w, hMic);
                
                ctx.strokeStyle = '#14A7B5';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x + 1, canvas.height - hMic, w, hMic);

                if (peakHoldEnabled) {
                    const isLight = document.documentElement.classList.contains('light');
                    const ph = (peakData[i] + 100) * (canvas.height / 100);
                    ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)';
                    ctx.fillRect(x + 1, canvas.height - ph - 2, w, 2);
                }
            } else {
                const h = Math.max(2, (db + 100) * (canvas.height / 100));
                ctx.fillStyle = getSPLColor(db);
                ctx.fillRect(x + 1, canvas.height - h, barWidth - 2, h);

                if (peakHoldEnabled) {
                    const isLight = document.documentElement.classList.contains('light');
                    const ph = (peakData[i] + 100) * (canvas.height / 100);
                    ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)';
                    ctx.fillRect(x + 1, canvas.height - ph - 2, barWidth - 2, 2);
                }
            }
        });

        // 2. Draw Pink Noise Output (Bold Pink Curve) overlaying on top of the RTA bars
        if (isRtaPinkNoiseActive && rtaPinkNoiseAnalyserNode) {
            ctx.beginPath();
            ctx.strokeStyle = '#FF2E93';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(255, 46, 147, 0.6)';
            
            ISO_FREQS.forEach((centerFreq, i) => {
                const x = i * barWidth;
                const ratio = Math.pow(2, 1/12);
                const lowFreq = centerFreq / ratio;
                const highFreq = centerFreq * ratio;
                const lowBin = Math.max(0, Math.floor(lowFreq / nyquist * bufferLength));
                const highBin = Math.min(bufferLength - 1, Math.floor(highFreq / nyquist * bufferLength));
                
                let pinkSum = 0;
                let count = 0;
                for (let b = lowBin; b <= highBin; b++) {
                    pinkSum += rtaPinkNoiseSmoothedDataArray[b];
                    count++;
                }
                let pinkDb = count > 0 ? pinkSum / count : -100;
                if (currentWeighting === 'a') pinkDb += (A_WEIGHTS[centerFreq] || 0);
                
                const hPink = Math.max(2, (pinkDb + 100) * (canvas.height / 100));
                const centerX = x + barWidth / 2;
                const centerY = canvas.height - hPink;
                
                if (i === 0) {
                    ctx.moveTo(centerX, centerY);
                } else {
                    ctx.lineTo(centerX, centerY);
                }
            });
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow glow
        }
    }

    function drawFFT() {
        const sliceWidth = canvas.width / bufferLength;

        // --- Draw Multi-Snapshots (Curve) ---
        snapshots.forEach(snap => {
            if (!snap.visible) return;
            ctx.beginPath();
            ctx.strokeStyle = snap.color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.7;
            ctx.setLineDash([4, 4]);
            for (let i = 0; i < bufferLength; i++) {
                const x = (Math.log10(i + 1) / Math.log10(bufferLength)) * canvas.width;
                const db = snap.fft[i];
                const y = canvas.height - (db + 100) * (canvas.height / 100);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
        });

        ctx.beginPath();
        ctx.strokeStyle = '#14A7B5';
        ctx.lineWidth = 1.5;
        
        for (let i = 0; i < bufferLength; i++) {
            let dbVal = dataArray[i];
            const x = (Math.log10(i + 1) / Math.log10(bufferLength)) * canvas.width;
            const y = Math.min(canvas.height, canvas.height - (dbVal + 100) * (canvas.height / 100));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 2. Draw Pink Noise Output (Bold Pink) if active
        if (isRtaPinkNoiseActive && rtaPinkNoiseAnalyserNode) {
            ctx.beginPath();
            ctx.strokeStyle = '#FF2E93';
            ctx.lineWidth = 2.0;
            
            for (let i = 0; i < bufferLength; i++) {
                let dbVal = rtaPinkNoiseSmoothedDataArray[i];
                const x = (Math.log10(i + 1) / Math.log10(bufferLength)) * canvas.width;
                const y = Math.min(canvas.height, canvas.height - (dbVal + 100) * (canvas.height / 100));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }

    function drawDominantOverlay() {
        ctx.save();
        // Use explicit font stack as canvas API doesn't support CSS variables
        ctx.font = "bold 72px 'Space Grotesk', sans-serif";
        ctx.fillStyle = '#14A7B5'; // Cyan/Turquoise
        ctx.textAlign = 'center';
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(20, 167, 181, 0.7)';
        ctx.fillText(domFreqDisplay, canvas.width / 2, 90);
        ctx.restore();
    }

    function updateTelemetry() {
        const peakValEl = document.getElementById('rta-peak-val');
        const domFreqEl = document.getElementById('rta-dom-val');
        
        const maxDB = Math.max(...peakData);
        if (peakValEl) peakValEl.textContent = `${(maxDB + calibrationOffset).toFixed(1)} dB`;
        
        let maxFFT = -120;
        let domIdx = 0;
        for (let i = 2; i < bufferLength; i++) { // Skip DC
            if (dataArray[i] > maxFFT) {
                maxFFT = dataArray[i];
                domIdx = i;
            }
        }
        const domFreq = Math.round(domIdx * (audioCtx.sampleRate / analyser.fftSize));
        domFreqDisplay = `${domFreq} Hz`;
        if (domFreqEl) domFreqEl.textContent = domFreqDisplay;
    }

    // --- Helper: Render Snapshot Slots UI ---
    function renderSnapshotSlots() {
        if (!slotsContainer) return;
        slotsContainer.innerHTML = '';
        
        const isPro = window.isPremiumActive('snapshots');

        for (let i = 0; i < 10; i++) {
            const slot = snapshots[i];
            const btn = document.createElement('div');
            
            // Allow slot 0 for everyone, lock others (1-9) for free users
            const isSlotLocked = !isPro && i > 0;

            if (isSlotLocked) {
                // Locked State for Free Users (Slots 2-10)
                btn.className = 'snapshot-slot locked-pro';
                btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">lock</span>';
                btn.title = `PRO FEATURE: Slot ${i+1} Locked (Upgrade to Unlock 10 slots)`;
                btn.addEventListener('click', () => {
                    window.showProUpgradeModal('snapshots');
                });
            } else {
                // Active State for Pro Users
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
                        snapshots.splice(i, 1);
                        saveConfigToCloud('rta_snapshots', { snapshots });
                        renderSnapshotSlots();
                    });
                } else {
                    btn.title = "Empty Slot (Click Capture New to save)";
                }
            }
            slotsContainer.appendChild(btn);
        }
    }

    // --- Core Logic: Capture New Snapshot ---
    function captureNewSnapshot() {
        if (!isInitialized) return;
        
        if (!window.isPremiumActive('snapshots') && snapshots.length >= 1) {
            window.showProUpgradeModal('snapshots');
            return;
        }

        if (snapshots.length >= 10) {
            alert("Snapshot Memory Full. Right-click a slot to delete it.");
            return;
        }

        const currentRTA = ISO_FREQS.map(centerFreq => {
            const ratio = Math.pow(2, 1/12);
            const lowFreq = centerFreq / ratio;
            const highFreq = centerFreq * ratio;
            const nyquist = audioCtx.sampleRate / 2;
            const lowBin = Math.max(0, Math.floor(lowFreq / nyquist * bufferLength));
            const highBin = Math.min(bufferLength - 1, Math.floor(highFreq / nyquist * bufferLength));
            let sum = 0; let count = 0;
            for (let b = lowBin; b <= highBin; b++) { sum += dataArray[b]; count++; }
            let db = count > 0 ? sum / count : -100;
            if (currentWeighting === 'a') db += (A_WEIGHTS[centerFreq] || 0);
            return db;
        });

        const newSnap = {
            rta: currentRTA,
            fft: Array.from(dataArray),
            color: SNAPSHOT_COLORS[snapshots.length],
            visible: true,
            id: Date.now()
        };

        snapshots.push(newSnap);
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
    }

    // --- Custom Mic Calibration Parser & Interpolator ---
    function parseCalibrationData(text) {
        const lines = text.split('\n');
        const parsed = [];
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith(';') || line.startsWith('#') || line.startsWith('*')) {
                continue;
            }
            
            const parts = line.replace(/,/g, ' ').split(/\s+/);
            if (parts.length >= 2) {
                const freq = parseFloat(parts[0]);
                const offset = parseFloat(parts[1]);
                if (!isNaN(freq) && !isNaN(offset)) {
                    parsed.push({ freq, offset });
                }
            }
        }
        return parsed;
    }

    function precomputeCalibrationOffsets() {
        if (!bufferLength) return;
        const nyquist = (audioCtx ? audioCtx.sampleRate : 48000) / 2;
        calOffsets = new Float32Array(bufferLength).fill(0);
        
        if (calProfile.length === 0) return;

        // Sort profile ascending by frequency
        calProfile.sort((a, b) => a.freq - b.freq);

        for (let i = 0; i < bufferLength; i++) {
            const f = (i * nyquist) / bufferLength;
            
            if (f <= calProfile[0].freq) {
                calOffsets[i] = calProfile[0].offset;
            } else if (f >= calProfile[calProfile.length - 1].freq) {
                calOffsets[i] = calProfile[calProfile.length - 1].offset;
            } else {
                let lowPt = calProfile[0];
                let highPt = calProfile[calProfile.length - 1];
                for (let j = 0; j < calProfile.length - 1; j++) {
                    if (f >= calProfile[j].freq && f <= calProfile[j + 1].freq) {
                        lowPt = calProfile[j];
                        highPt = calProfile[j + 1];
                        break;
                    }
                }
                const logF = Math.log10(f || 1);
                const logLow = Math.log10(lowPt.freq || 1);
                const logHigh = Math.log10(highPt.freq || 1);
                const pct = (logF - logLow) / (logHigh - logLow || 1);
                calOffsets[i] = lowPt.offset + pct * (highPt.offset - lowPt.offset);
            }
        }
    }

    function getCalOffsetForFreq(f) {
        if (calProfile.length === 0) return 0;
        if (f <= calProfile[0].freq) return calProfile[0].offset;
        if (f >= calProfile[calProfile.length - 1].freq) return calProfile[calProfile.length - 1].offset;
        
        for (let j = 0; j < calProfile.length - 1; j++) {
            if (f >= calProfile[j].freq && f <= calProfile[j + 1].freq) {
                const lowPt = calProfile[j];
                const highPt = calProfile[j + 1];
                const logF = Math.log10(f || 1);
                const logLow = Math.log10(lowPt.freq || 1);
                const logHigh = Math.log10(highPt.freq || 1);
                const pct = (logF - logLow) / (logHigh - logLow || 1);
                return lowPt.offset + pct * (highPt.offset - lowPt.offset);
            }
        }
        return 0;
    }

    // --- Rolling Spectrogram Waterfall Visualizer ---
    function getWaterfallColor(displayDB) {
        const minDB = 45;
        const maxDB = 110;
        const norm = Math.max(0, Math.min(1, (displayDB - minDB) / (maxDB - minDB)));
        
        if (norm < 0.2) {
            const p = norm / 0.2;
            return `hsl(240, 100%, ${Math.floor(2 + p * 8)}%)`;
        } else if (norm < 0.5) {
            const p = (norm - 0.2) / 0.3;
            return `hsl(${Math.floor(240 - p * 60)}, 100%, ${Math.floor(10 + p * 20)}%)`;
        } else if (norm < 0.8) {
            const p = (norm - 0.5) / 0.3;
            return `hsl(${Math.floor(180 - p * 160)}, 100%, ${Math.floor(30 + p * 20)}%)`;
        } else {
            const p = (norm - 0.8) / 0.2;
            return `hsl(${Math.floor(20 + p * 40)}, 100%, ${Math.floor(50 + p * 40)}%)`;
        }
    }

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

        for (let i = 0; i < bufferLength; i++) {
            const dbVal = dataArray[i];
            const color = getWaterfallColor(dbVal + calibrationOffset);
            
            const x1 = (Math.log10(i + 1) / Math.log10(bufferLength)) * canvas.width;
            const x2 = (Math.log10(i + 2) / Math.log10(bufferLength)) * canvas.width;
            
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
        });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
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
        });
    });

    weightBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            weightBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWeighting = btn.getAttribute('data-weight');
        });
    });

    if (calSlider) {
        calSlider.addEventListener('input', () => {
            calibrationOffset = parseFloat(calSlider.value);
            if (calValue) calValue.textContent = calibrationOffset;
        });
    }

    if (peakToggle) {
        peakToggle.addEventListener('click', () => {
            peakHoldEnabled = !peakHoldEnabled;
            peakToggle.classList.toggle('active', peakHoldEnabled);
            peakToggle.textContent = peakHoldEnabled ? 'ON' : 'OFF';
        });
    }

    if (peakReset) {
        peakReset.addEventListener('click', () => {
            peakData.fill(-100);
        });
    }

    if (btnCapture) {
        btnCapture.addEventListener('click', captureNewSnapshot);
    }

    const btnRtaPinkNoise = document.getElementById('btn-rta-pink-noise');
    if (btnRtaPinkNoise) {
        btnRtaPinkNoise.addEventListener('click', () => {
            toggleRtaPinkNoise();
        });
    }

    const btnClearAll = document.getElementById('btn-clear-all-snapshots');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            if (confirm("Clear all 10 snapshot slots?")) {
                snapshots = [];
                saveConfigToCloud('rta_snapshots', { snapshots });
                renderSnapshotSlots();
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


    // --- Premium Fullscreen & Rewarded Ad Features ---
    function syncRtaCanvasSize() {
        const wrapper = canvas.parentElement;
        if (!wrapper) return;
        if (isFullscreenActive) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        } else {
            canvas.width = wrapper.clientWidth;
            canvas.height = wrapper.clientHeight;
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
    }

    function toggleRtaFullscreen(forceState) {
        const wrapper = canvas.parentElement;
        if (!wrapper) return;
        
        const btnFullscreen = document.getElementById('btn-rta-fullscreen');
        let targetState = (forceState !== undefined) ? forceState : !isFullscreenActive;
        
        if (targetState) {
            isFullscreenActive = true;
            wrapper.classList.add('fullscreen-canvas');
            if (btnFullscreen) {
                btnFullscreen.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">fullscreen_exit</span>';
            }
            document.body.style.overflow = 'hidden'; // Stop background scrolling
        } else {
            isFullscreenActive = false;
            wrapper.classList.remove('fullscreen-canvas');
            if (btnFullscreen) {
                btnFullscreen.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">fullscreen</span>';
            }
            document.body.style.overflow = ''; // Restore background scrolling
        }
        
        syncRtaCanvasSize();
    }

    let isAdRewardForPro = false;

    // Capacitor Native AdMob integration helpers
    window.isNativeMobile = function() {
        return typeof window !== 'undefined' && window.Capacitor !== undefined;
    };

    // (Native AdMob variables & helpers are defined globally above initProfessionalRTA)

    // Helper to dynamically show native banner ads (Mitigating bottom viewport overlay)
    window.showNativeBannerAd = async function() {
        // Suppress ads immediately if user is a premium Pro subscriber
        if (window.isPremiumActive()) {
            window.hideNativeBannerAd();
            return;
        }

        if (!window.isNativeMobile()) {
            if (navigator.onLine) {
                const bottomBanner = document.getElementById('bottom-sponsor-banner');
                if (bottomBanner) {
                    bottomBanner.classList.remove('hidden');
                    bottomBanner.style.display = 'flex';
                }
                document.querySelectorAll('.adsbygoogle, .ad-banner-bottom, .ad-placeholder').forEach(el => {
                    el.classList.remove('hidden');
                    el.style.display = 'block';
                });
            }
            return;
        }

        if (!window.isAdMobInitialized) {
            console.warn('showNativeBannerAd called before AdMob initialization.');
            return;
        }

        if (!navigator.onLine) {
            console.log('Device is offline. Suppressing native banner ad.');
            return;
        }

        if (isNativeBannerActive) return;

        try {
            const { AdMob } = window.Capacitor?.Plugins || {};
            if (!AdMob) return;

            const isAndroid = window.Capacitor.getPlatform() === 'android';
            let adId = '';
            
            if (USE_TEST_BANNER_ADS) {
                adId = isAndroid ? ADMOB_ANDROID_BANNER_TEST_ID : ADMOB_IOS_BANNER_TEST_ID;
            } else {
                adId = isAndroid ? ADMOB_ANDROID_BANNER_PROD_ID : ADMOB_IOS_BANNER_PROD_ID;
            }

            console.log('Showing native bottom banner ad with unit ID:', adId);
            
            await AdMob.showBanner({
                adId: adId,
                adSize: 'ADAPTIVE_BANNER',
                position: 'BOTTOM_CENTER',
                margin: 0,
                isTesting: USE_TEST_BANNER_ADS
            });

            isNativeBannerActive = true;
            document.body.style.paddingBottom = '60px'; // Dynamically pad view to prevent covering navigation elements
        } catch (err) {
            console.error('Error showing native banner ad:', err);
        }
    };

    window.hideNativeBannerAd = async function() {
        // Hide HTML ads first
        const bottomBanner = document.getElementById('bottom-sponsor-banner');
        if (bottomBanner) {
            bottomBanner.classList.add('hidden');
            bottomBanner.style.display = 'none';
        }
        document.querySelectorAll('.adsbygoogle, .ad-banner-bottom, .ad-placeholder').forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none';
        });

        if (!window.isNativeMobile()) return;

        if (!window.isAdMobInitialized) {
            console.warn('hideNativeBannerAd called before AdMob initialization.');
            return;
        }

        if (!navigator.onLine) {
            console.log('Device is offline. Skipping native removeBanner to prevent crash.');
            isNativeBannerActive = false;
            document.body.style.paddingBottom = '0px';
            return;
        }

        if (!isNativeBannerActive) {
            console.log('Native banner is not active. Skipping native removeBanner.');
            return;
        }

        try {
            const { AdMob } = window.Capacitor?.Plugins || {};
            if (!AdMob) return;

            console.log('Removing native bottom banner ad...');
            await AdMob.removeBanner();
            isNativeBannerActive = false;
            document.body.style.paddingBottom = '0px';
        } catch (err) {
            console.error('Error hiding native banner ad:', err);
        }
    };

    function startAdPlayback(forPro = false) {
        isAdRewardForPro = !!forPro;
        
        // Hide pro/dynamic upgrade modals to avoid overlay/click blocking
        if (isAdRewardForPro) {
            const proUpgradeModal = document.getElementById('pro-upgrade-modal');
            if (proUpgradeModal) proUpgradeModal.classList.add('hidden');
            const dynamicUpgradeModal = document.getElementById('dynamic-upgrade-modal');
            if (dynamicUpgradeModal) dynamicUpgradeModal.classList.add('hidden');
        }
        
        // Connectivity Safeguard Check
        if (!navigator.onLine) {
            console.warn('Network connection is offline. Blocking unlock flow.');
            triggerBrowserAdPlayback(true);
            return;
        }

        // Bypass for Direct Sponsorship Configuration
        if (USE_DIRECT_SPONSOR) {
            console.log('USE_DIRECT_SPONSOR enabled. Bypassing AdMob to launch Sponsor Hub directly.');
            triggerBrowserAdPlayback();
            return;
        }
        
        const mobileLoader = document.getElementById('mobile-ad-loader');
        
        if (window.isNativeMobile()) {
            console.log('Native mobile detected. Launching native AdMob Rewarded Video...');
            
            if (mobileLoader) {
                mobileLoader.classList.add('active');
            }
            
            const { AdMob } = window.Capacitor?.Plugins || {};
            if (!AdMob) {
                console.log('AdMob native plugin not found/configured. Falling back to simulated browser ad.');
                setTimeout(() => {
                    if (mobileLoader) mobileLoader.classList.remove('active');
                    triggerBrowserAdPlayback();
                }, 800);
                return;
            }

            let hasAdStartedOrFailed = false;
            let nativeRewardGranted = false;

            const failSafeTimeout = setTimeout(() => {
                if (!hasAdStartedOrFailed) {
                    console.warn('Native AdMob timed out after 2000ms. Falling back to browser simulation.');
                    hasAdStartedOrFailed = true;
                    if (mobileLoader) mobileLoader.classList.remove('active');
                    triggerBrowserAdPlayback();
                }
            }, 2000);

            window.showNativeRewardedAd(
                () => {
                    clearTimeout(failSafeTimeout);
                    hasAdStartedOrFailed = true;
                    nativeRewardGranted = true;
                    if (mobileLoader) mobileLoader.classList.remove('active');
                    console.log('Native AdMob Reward granted!');
                    // Call grantAdRewardSuccess(false) to silently unlock the features in safeStorage/UI without showing a blocking alert popup yet.
                    grantAdRewardSuccess(false);
                },
                () => {
                    if (!hasAdStartedOrFailed) {
                        clearTimeout(failSafeTimeout);
                        hasAdStartedOrFailed = true;
                        console.warn('Native AdMob failed. Falling back to browser simulation.');
                        if (mobileLoader) mobileLoader.classList.remove('active');
                        triggerBrowserAdPlayback();
                    }
                },
                () => {
                    if (!hasAdStartedOrFailed) {
                        clearTimeout(failSafeTimeout);
                        hasAdStartedOrFailed = true;
                        console.log('Native AdMob started showing. Removing loading overlay.');
                        if (mobileLoader) mobileLoader.classList.remove('active');
                    }
                },
                () => {
                    console.log('Native AdMob ad dismiss callback triggered.');
                    setTimeout(() => {
                        if (nativeRewardGranted) {
                            // Crucial fix: Close the fallback/spotlight modal if it was opened due to a timeout race condition
                            closeAdPlayback(false);

                            // Defer the blocking confirmation alert popup until AFTER the native ad activity is completely dismissed and closed.
                            setTimeout(() => {
                                let displayName = "SoundEngg Pro Features";
                                if (currentUnlockFeatureKey) {
                                    if (currentUnlockFeatureKey === 'blog' && window.pendingArticleToOpen) {
                                        displayName = "Selected Premium Guide";
                                    } else if (currentUnlockFeatureKey === 'spectrogram') {
                                        displayName = "60FPS Spectrogram Waterfall";
                                    } else if (currentUnlockFeatureKey === 'snapshots') {
                                        displayName = "10 Multi-Overlay RTA Snapshots";
                                    } else if (currentUnlockFeatureKey === 'mic_calibration') {
                                        displayName = "Custom Mic Calibration Loader";
                                    } else if (currentUnlockFeatureKey === 'ear_training') {
                                        displayName = "1/6 ISO Octave Ear Training";
                                    } else if (currentUnlockFeatureKey === 'ear_training_track') {
                                        displayName = "Reference Track";
                                    }
                                }
                                alert(`🎉 Awesome! You have successfully unlocked ${displayName} for the next 4 hours.`);
                            }, 300);
                        } else {
                            console.log('Native AdMob ad dismissed early without granting reward. Restoring upgrade modals.');
                            if (isAdRewardForPro) {
                                const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                                if (proUpgradeModal) proUpgradeModal.classList.remove('hidden');
                                const dynamicUpgradeModal = document.getElementById('dynamic-upgrade-modal');
                                if (dynamicUpgradeModal) dynamicUpgradeModal.classList.remove('hidden');
                            }
                        }
                    }, 100);
                }
            );
            return;
        }
        
        triggerBrowserAdPlayback();
    }

    function grantAdRewardSuccess(showNotification = true) {
        if (isAdRewardForPro) {
            const duration = 4 * 60 * 60 * 1000; // 4 Hours
            let unlockedFeatureName = "SoundEngg Pro Features";
            if (currentUnlockFeatureKey) {
                if (currentUnlockFeatureKey === 'blog' && window.pendingArticleToOpen) {
                    safeStorage.setItem(`soundengg_temp_pro_until_blog_${window.pendingArticleToOpen}`, Date.now() + duration);
                    unlockedFeatureName = "Selected Premium Guide";
                } else {
                    const persistenceKey = currentUnlockFeatureKey === 'ear_training_track' ? 'ear_training' : currentUnlockFeatureKey;
                    safeStorage.setItem(`soundengg_temp_pro_until_${persistenceKey}`, Date.now() + duration);
                    if (currentUnlockFeatureKey === 'spectrogram') {
                        unlockedFeatureName = "60FPS Spectrogram Waterfall";
                    } else if (currentUnlockFeatureKey === 'snapshots') {
                        unlockedFeatureName = "10 Multi-Overlay RTA Snapshots";
                    } else if (currentUnlockFeatureKey === 'mic_calibration') {
                        unlockedFeatureName = "Custom Mic Calibration Loader";
                    } else if (currentUnlockFeatureKey === 'ear_training') {
                        unlockedFeatureName = "1/6 ISO Octave Ear Training";
                    } else if (currentUnlockFeatureKey === 'ear_training_track') {
                        unlockedFeatureName = "Reference Track";
                    }
                }
            } else {
                safeStorage.setItem('soundengg_temp_pro_until', Date.now() + duration);
            }
            
            // Also unlock the central app lock gate for the same duration to ensure no immediate lockout
            safeStorage.setItem('tools_unlocked_until', Date.now() + duration);
            
            const proUpgradeModal = document.getElementById('pro-upgrade-modal');
            if (proUpgradeModal) proUpgradeModal.classList.add('hidden');
            
            const dynamicUpgradeModal = document.getElementById('dynamic-upgrade-modal');
            if (dynamicUpgradeModal) dynamicUpgradeModal.classList.add('hidden');
            
            if (window.updatePremiumUI) {
                window.updatePremiumUI();
            }
            
            // Dispatch event globally to update modules like RTA (snapshots), Spectrogram, Ear Training, etc.
            document.dispatchEvent(new CustomEvent('proStatusChanged', { detail: true }));
            
            if (currentUnlockFeatureKey === 'blog' && window.pendingArticleToOpen) {
                const blogId = window.pendingArticleToOpen;
                
                const blogView = document.getElementById('blog-view');
                const btnNavBlog = document.getElementById('btn-nav-blog');
                if (window.showView && blogView) {
                    window.showView(blogView, btnNavBlog);
                }
                
                // Open the article!
                if (typeof window.openBlogArticle === 'function') {
                    window.openBlogArticle(blogId);
                }
                
                window.pendingArticleToOpen = null;
            }
            
            if (showNotification) {
                alert(`🎉 Awesome! You have successfully unlocked ${unlockedFeatureName} for the next 4 hours.`);
            }
        } else {
            isAdRewardClaimed = true;
            toggleRtaFullscreen(true);
        }
    }

    function triggerBrowserAdPlayback(isOffline = false) {
        const modal = document.getElementById('ad-reward-modal');
        const sponsorContainer = document.querySelector('.ad-sponsor-container');
        const btnClaim = document.getElementById('btn-ad-reward-claim');
        const countdownBar = document.getElementById('ad-reward-countdown-bar');
        const btnText = document.getElementById('ad-reward-btn-text');
        const btnIcon = document.getElementById('ad-reward-btn-icon');
        const alertBox = document.getElementById('ad-reward-alert');
        const descText = document.getElementById('ad-reward-text-desc');

        if (!modal) return;

        if (alertBox) alertBox.style.display = 'none';
        if (countdownBar) countdownBar.style.display = 'none';

        if (isOffline) {
            isSponsorSpotlightFallback = false;
            adSecondsRemaining = 0;

            if (sponsorContainer) {
                sponsorContainer.innerHTML = `
                    <div class="ad-sponsor-info" style="color: #ff5533; text-shadow: 0 0 8px rgba(255, 85, 51, 0.5); font-family: var(--font-mono); text-align: center; padding: 1.5rem; letter-spacing: 1px;">
                        <div style="font-size: 1rem; font-weight: 800; border: 1.5px solid #ff5533; padding: 12px; border-radius: 4px; background: rgba(255, 85, 51, 0.05); text-transform: uppercase;">
                            [ ERROR: LINK OFFLINE. RETRY CONNECTION ]
                        </div>
                    </div>
                `;
            }

            if (descText) {
                descText.innerHTML = 'An internet connection is required to check developer support streams and unlock Pro features. Please connect to a network and retry.';
            }

            if (btnClaim) {
                btnClaim.disabled = true;
                if (btnText) btnText.textContent = '⚠️ CONNECTION OFFLINE';
                if (btnIcon) btnIcon.textContent = 'wifi_off';
            }

            modal.classList.add('active');
            return;
        }

        // Online mode: Premium Sponsor Spotlight
        isSponsorSpotlightFallback = true;
        adSecondsRemaining = 0; // No countdown remaining

        if (sponsorContainer) {
            sponsorContainer.innerHTML = `
                <div class="ad-graphic-wave">
                    <div class="ad-wave-bar"></div>
                    <div class="ad-wave-bar"></div>
                    <div class="ad-wave-bar"></div>
                    <div class="ad-wave-bar"></div>
                    <div class="ad-wave-bar"></div>
                    <div class="ad-wave-bar"></div>
                    <div class="ad-wave-bar"></div>
                    <div class="ad-wave-bar"></div>
                    <div class="ad-wave-bar"></div>
                    <div class="ad-wave-bar"></div>
                </div>
                <div class="ad-sponsor-info">
                    <div class="ad-sponsor-brand">NEVE DYNAMICS</div>
                    <div class="ad-sponsor-tagline">ANALOG PRESENCE. DIGITAL PRECISION.</div>
                </div>
            `;
        }

        if (descText) {
            if (isAdRewardForPro) {
                let featLabel = "your selected tool";
                if (currentUnlockFeatureKey === 'blog') {
                    featLabel = "your selected guide";
                }
                descText.innerHTML = `Support the developer by viewing our featured partner spotlight to instantly unlock **${featLabel}** for the next **4 hours**.`;
            } else {
                descText.innerHTML = 'Support the developer by viewing our featured partner spotlight to instantly unlock the **Pro View Fullscreen Analyzer** for this session.';
            }
        }

        if (btnClaim) {
            btnClaim.disabled = false;
            if (btnText) btnText.textContent = '🎁 SUPPORT & UNLOCK';
            if (btnIcon) btnIcon.textContent = 'open_in_new';
        }

        modal.classList.add('active');
    }

    function closeAdPlayback(isAborted) {
        const modal = document.getElementById('ad-reward-modal');
        const alertBox = document.getElementById('ad-reward-alert');
        
        if (adCountdownTimer) {
            clearInterval(adCountdownTimer);
            adCountdownTimer = null;
        }

        if (isAborted) {
            // Do not show the interrupted warning alert if in Sponsor Spotlight or offline state
            const isFallbackOrOffline = isSponsorSpotlightFallback || !navigator.onLine;
            if (alertBox && !isFallbackOrOffline) {
                alertBox.style.display = 'block';
                setTimeout(() => {
                    if (modal) modal.classList.remove('active');
                    if (isAdRewardForPro) {
                        const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                        if (proUpgradeModal) proUpgradeModal.classList.remove('hidden');
                        const dynamicUpgradeModal = document.getElementById('dynamic-upgrade-modal');
                        if (dynamicUpgradeModal) dynamicUpgradeModal.classList.remove('hidden');
                    }
                }, 1800);
            } else {
                if (modal) modal.classList.remove('active');
                if (isAdRewardForPro) {
                    const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                    if (proUpgradeModal) proUpgradeModal.classList.remove('hidden');
                    const dynamicUpgradeModal = document.getElementById('dynamic-upgrade-modal');
                    if (dynamicUpgradeModal) dynamicUpgradeModal.classList.remove('hidden');
                }
            }
        } else {
            if (modal) modal.classList.remove('active');
        }
    }

    // Floating Button Click Trigger
    const btnFullscreen = document.getElementById('btn-rta-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const isUserPremium = window.isPremiumActive();
            
            if (isUserPremium || isAdRewardClaimed) {
                toggleRtaFullscreen();
            } else {
                startAdPlayback(false);
            }
        });
    }

    // Window Resize Handler for RTA view
    window.addEventListener('resize', () => {
        if (document.getElementById('rta-view').style.display !== 'none') {
            syncRtaCanvasSize();
        }
    });

    // Ad Modal Close & Skip logic
    const btnCloseAdReward = document.getElementById('btn-close-ad-reward');
    if (btnCloseAdReward) {
        btnCloseAdReward.addEventListener('click', () => {
            if (adSecondsRemaining > 0) {
                const promptMsg = isAdRewardForPro 
                    ? "Cancel ad playback? You will not unlock the 4-Hour Pro access."
                    : "Cancel ad playback? You will not unlock the premium fullscreen RTA view.";
                if (confirm(promptMsg)) {
                    closeAdPlayback(true);
                }
            } else {
                closeAdPlayback(false);
            }
        });
    }

    const btnClaimAdReward = document.getElementById('btn-ad-reward-claim');
    if (btnClaimAdReward) {
        btnClaimAdReward.addEventListener('click', async () => {
            if (isSponsorSpotlightFallback) {
                console.log('Sponsor Spotlight fallback clicked. Opening sponsor link and instantly granting reward.');
                try {
                    const BrowserPlugin = window.Capacitor?.Plugins?.Browser;
                    if (BrowserPlugin && typeof BrowserPlugin.open === 'function') {
                        await BrowserPlugin.open({ url: ACTIVE_SPONSOR_URL });
                    } else {
                        window.open(ACTIVE_SPONSOR_URL, '_blank');
                    }
                } catch (err) {
                    console.error('Error launching sponsor link:', err);
                    window.open(ACTIVE_SPONSOR_URL, '_blank');
                }
            }
            closeAdPlayback(false);
            grantAdRewardSuccess();
        });
    }

    const btnWatchAdProUnlock = document.getElementById('btn-watch-ad-pro-unlock');
    if (btnWatchAdProUnlock) {
        btnWatchAdProUnlock.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            startAdPlayback(true);
        });
    }

    renderSnapshotSlots(); 

    // RTA Input Change Handler (Rebuild stream & Sync global settings)
    if (inputSelect) {
        inputSelect.addEventListener('change', async (e) => {
            const newDeviceId = e.target.value;
            safeStorage.setItem('soundengg-mic-id', newDeviceId);
            
            const globalMic = document.getElementById('global-mic-select');
            if (globalMic) globalMic.value = newDeviceId;
            
            if (isAnalyzing) {
                // Hot-swap active stream
                isAnalyzing = false;
                if (rafID) cancelAnimationFrame(rafID);
                if (stream) {
                    stream.getTracks().forEach(t => t.stop());
                    stream = null;
                }
                await startAnalyzer(newDeviceId);
            }
            
            document.dispatchEvent(new CustomEvent('deviceChanged', { detail: newDeviceId }));
        });
    }

    // RTA Output Change Handler (Sync global settings & Apply routes)
    if (outputSelect) {
        outputSelect.addEventListener('change', async (e) => {
            const newDeviceId = e.target.value;
            safeStorage.setItem('soundengg-output-id', newDeviceId);
            
            const globalOutput = document.getElementById('global-output-select');
            if (globalOutput) globalOutput.value = newDeviceId;
            
            if (window.applyAudioOutput) {
                await window.applyAudioOutput(newDeviceId);
            }
            
            document.dispatchEvent(new CustomEvent('outputDeviceChanged', { detail: newDeviceId }));
        });
    }

    // Sync input changes from global settings
    document.addEventListener('deviceChanged', async (e) => {
        const newDeviceId = e.detail;
        if (inputSelect) {
            inputSelect.value = newDeviceId;
        }
        if (isAnalyzing) {
            isAnalyzing = false;
            if (rafID) cancelAnimationFrame(rafID);
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
                stream = null;
            }
            await startAnalyzer(newDeviceId);
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

    // Expose RTA drawing and reward functions globally to window scope
    window.renderSnapshotSlots = renderSnapshotSlots;
    window.syncProLockUI = syncProLockUI;
    window.grantAdRewardSuccess = grantAdRewardSuccess;
}
