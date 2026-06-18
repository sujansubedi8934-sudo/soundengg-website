function initTuner() {
    let audioCtx = null;
    let analyser = null;
    let mediaStreamSource = null;
    let isTuning = false;
    let rafID = null;
    let A4 = 440;
    let smoothedPitch = -1;
    
    let currentMode = 'needle'; // needle, strobe, bar
    let strobePhase = 0;
    let noiseThreshold = 0.040; // Default noise gate threshold (40 RMS = -28.0 dB FS) to filter room noise
    let pitchHistory = []; // median filter history
    let centsHistory = []; // cents offset history

    const btnStart = document.getElementById('btn-start-tuner');
    const a4Input = document.getElementById('tuner-a4-ref');
    const modeBtns = document.querySelectorAll('.tuner-mode-btn');
    
    const noteDisplay = document.getElementById('tuner-note-display');
    const centsDisplay = document.getElementById('tuner-cents-display');
    const freqDisplay = document.getElementById('tuner-freq-val');
    const statusText = document.getElementById('tuner-status-text');
    const canvas = document.getElementById('tuner-canvas');
    let ctx = null;

    const stabilityCanvas = document.getElementById('tuner-stability-canvas');
    let stabilityCtx = null;

    if (!btnStart || !canvas) return;

    ctx = canvas.getContext('2d');
    if (stabilityCanvas) stabilityCtx = stabilityCanvas.getContext('2d');
    const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    function autoCorrelate(buf, sampleRate) {
        let SIZE = buf.length;
        let rms = 0;
        for (let i = 0; i < SIZE; i++) {
            let val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < noiseThreshold) return -1;

        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

        buf = buf.slice(r1, r2);
        SIZE = buf.length;

        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + buf[j] * buf[j + i];
            }
        }

        let d = 0; while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        let T0 = maxpos;

        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    }

    function noteFromPitch(frequency) {
        let noteNum = 12 * (Math.log(frequency / A4) / Math.log(2));
        return Math.round(noteNum) + 69;
    }

    function frequencyFromNoteNumber(note) {
        return A4 * Math.pow(2, (note - 69) / 12);
    }

    function centsOffFromPitch(frequency, note) {
        return Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2));
    }

    function updatePitch() {
        if (!isTuning) return;

        let buf = new Float32Array(2048);
        analyser.getFloatTimeDomainData(buf);
        let pitch = autoCorrelate(buf, audioCtx.sampleRate);

        if (pitch == -1) {
            smoothedPitch = -1;
            pitchHistory = [];
            centsHistory.push(null);
            if (centsHistory.length > 150) centsHistory.shift();

            drawVisualizer(null);
            drawStabilityChart();
            noteDisplay.textContent = "--";
            centsDisplay.textContent = "0¢";
            freqDisplay.textContent = "---.-";
            statusText.textContent = "WAITING FOR SIGNAL";
            centsDisplay.className = "tuner-cents";
        } else {
            // Push to median filter history
            pitchHistory.push(pitch);
            if (pitchHistory.length > 5) pitchHistory.shift();

            // Calculate median of pitch history
            const sorted = [...pitchHistory].sort((a, b) => a - b);
            const medianPitch = sorted[Math.floor(sorted.length / 2)];

            // Apply exponential smoothing on median pitch
            if (smoothedPitch === -1 || Math.abs(smoothedPitch - medianPitch) > 30) {
                smoothedPitch = medianPitch;
            } else {
                smoothedPitch = smoothedPitch * 0.85 + medianPitch * 0.15;
            }

            let note = noteFromPitch(smoothedPitch);
            let noteName = noteStrings[note % 12];
            let octave = Math.floor(note / 12) - 1;
            let cents = centsOffFromPitch(smoothedPitch, note);
            
            centsHistory.push(cents);
            if (centsHistory.length > 150) centsHistory.shift();

            noteDisplay.textContent = `${noteName}${octave}`;
            freqDisplay.textContent = smoothedPitch.toFixed(1);
            
            let centsText = (cents > 0 ? "+" : "") + cents + "¢";
            centsDisplay.textContent = centsText;

            if (Math.abs(cents) <= 3) {
                centsDisplay.className = "tuner-cents in-tune";
                statusText.textContent = "IN TUNE";
                statusText.style.color = "#10b981";
            } else {
                centsDisplay.className = "tuner-cents";
                statusText.textContent = cents > 0 ? "SHARP" : "FLAT";
                statusText.style.color = "var(--text-muted)";
            }

            drawVisualizer(cents);
            drawStabilityChart();
        }

        if (!window.requestAnimationFrame) window.requestAnimationFrame = window.webkitRequestAnimationFrame;
        rafID = window.requestAnimationFrame(updatePitch);
    }

    function drawVisualizer(cents) {
        let w = canvas.width;
        let h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const isLight = document.documentElement.classList.contains('light');
        const colorMain = isLight ? '#2d3748' : '#e2e8f0';
        const colorPrimary = '#14A7B5';
        const colorSuccess = '#10b981';
        const colorDanger = '#ef4444';

        if (currentMode === 'needle') {
            ctx.beginPath();
            ctx.arc(w/2, h + 50, h, Math.PI + 0.2, Math.PI * 2 - 0.2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = isLight ? '#94a3b8' : '#4a5568';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(w/2, 50);
            ctx.lineTo(w/2, 70);
            ctx.lineWidth = 4;
            ctx.strokeStyle = colorSuccess;
            ctx.stroke();

            if (cents !== null) {
                let angle = (cents / 50) * (Math.PI / 4); 
                if (angle > Math.PI / 4) angle = Math.PI / 4;
                if (angle < -Math.PI / 4) angle = -Math.PI / 4;
                
                ctx.save();
                ctx.translate(w/2, h + 50);
                ctx.rotate(angle);
                
                let needleColor = Math.abs(cents) <= 3 ? colorSuccess : colorDanger;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -h + 10);
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.strokeStyle = needleColor;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI*2);
                ctx.fillStyle = needleColor;
                ctx.fill();
                
                ctx.restore();
            }
        } 
        else if (currentMode === 'bar') {
            ctx.beginPath();
            ctx.moveTo(w/2, h/2 - 20);
            ctx.lineTo(w/2, h/2 + 20);
            ctx.lineWidth = 2;
            ctx.strokeStyle = colorMain;
            ctx.stroke();

            if (cents !== null) {
                let barW = (Math.abs(cents) / 50) * (w / 2);
                if (barW > w/2) barW = w/2;
                
                let barColor = Math.abs(cents) <= 3 ? colorSuccess : (cents > 0 ? colorPrimary : colorDanger);
                ctx.fillStyle = barColor;
                
                if (cents > 0) {
                    ctx.fillRect(w/2, h/2 - 10, barW, 20);
                } else {
                    ctx.fillRect(w/2 - barW, h/2 - 10, barW, 20);
                }
            }
        }
        else if (currentMode === 'strobe') {
            if (cents !== null) {
                // Damping logic: slow down rotation speed exponentially when cents is close to 0
                let speedFactor = 0.08;
                if (Math.abs(cents) <= 3) {
                    speedFactor = 0.02; // ultra-slow crawl for fine adjustments
                }
                strobePhase += cents * speedFactor;
                
                let blockW = 16;
                let blockH = 48;
                let spacing = 16;
                let numBlocks = Math.ceil(w / (blockW + spacing)) + 1;
                
                // Conveyor line
                ctx.beginPath();
                ctx.moveTo(0, h/2);
                ctx.lineTo(w, h/2);
                ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
                ctx.lineWidth = 4;
                ctx.stroke();
                
                // Draw strobe blocks (rounded pills)
                for (let i = 0; i < numBlocks; i++) {
                    let x = (i * (blockW + spacing) + strobePhase) % (w + blockW + spacing);
                    if (x < 0) x += w + blockW + spacing;
                    x -= (blockW + spacing);
                    
                    // Rounded pill rect
                    ctx.save();
                    ctx.beginPath();
                    const rx = x;
                    const ry = h/2 - blockH/2;
                    
                    // Create linear gradient for individual pill
                    let blockGrad = ctx.createLinearGradient(rx, ry, rx, ry + blockH);
                    if (Math.abs(cents) <= 3) {
                        blockGrad.addColorStop(0, '#10b981');
                        blockGrad.addColorStop(1, '#059669');
                    } else {
                        blockGrad.addColorStop(0, '#00ffff');
                        blockGrad.addColorStop(1, '#008b9f');
                    }
                    
                    ctx.fillStyle = blockGrad;
                    ctx.strokeStyle = Math.abs(cents) <= 3 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(20, 167, 181, 0.4)';
                    ctx.lineWidth = 1;
                    
                    // Round rect path
                    ctx.roundRect(rx, ry, blockW, blockH, 4);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
                
                // Draw center target line with high-end neon glass overlay
                ctx.fillStyle = isLight ? 'rgba(255,255,255,0.4)' : 'rgba(2,2,4,0.4)';
                ctx.fillRect(w/2 - 20, 0, 40, h);
                
                // Center target line
                ctx.beginPath();
                ctx.moveTo(w/2, 0);
                ctx.lineTo(w/2, h);
                ctx.strokeStyle = colorSuccess;
                ctx.lineWidth = 2.5;
                ctx.shadowColor = colorSuccess;
                ctx.shadowBlur = 6;
                ctx.stroke();
                ctx.shadowBlur = 0; // Reset
            }
        }
    }    function drawStabilityChart() {
        if (!stabilityCanvas || !stabilityCtx) return;
        let w = stabilityCanvas.width;
        let h = stabilityCanvas.height;
        stabilityCtx.clearRect(0, 0, w, h);
        
        const isLight = document.documentElement.classList.contains('light');
        const colorGrid = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
        const colorLabel = isLight ? '#718096' : '#888';
        
        // Draw Horizontal Grids: ±50, ±25, 0 cents
        const yZero = h / 2;
        const getCentsY = (c) => yZero - (c / 50) * (h / 2 - 10);
        
        // Background horizontal grid lines
        const gridCents = [-50, -25, 0, 25, 50];
        stabilityCtx.lineWidth = 1;
        gridCents.forEach(gc => {
            const gy = getCentsY(gc);
            stabilityCtx.beginPath();
            stabilityCtx.moveTo(0, gy);
            stabilityCtx.lineTo(w, gy);
            
            if (gc === 0) {
                stabilityCtx.strokeStyle = isLight ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)';
            } else {
                stabilityCtx.strokeStyle = colorGrid;
            }
            stabilityCtx.stroke();
            
            // Label
            stabilityCtx.fillStyle = colorLabel;
            stabilityCtx.font = '7px monospace';
            stabilityCtx.fillText((gc > 0 ? '+' : '') + gc + '¢', 5, gy - 2);
        });

        if (centsHistory.length === 0) return;
        
        // Draw History Line with segments (handling null dropouts)
        stabilityCtx.lineWidth = 1.8;
        stabilityCtx.lineCap = 'round';
        stabilityCtx.lineJoin = 'round';
        
        let inSegment = false;
        let validCount = 0;
        let sumCents = 0;
        let maxCents = 0;

        stabilityCtx.beginPath();
        for (let i = 0; i < centsHistory.length; i++) {
            const cents = centsHistory[i];
            const x = (i / (150 - 1)) * w;
            
            if (cents !== null) {
                const y = getCentsY(cents);
                if (!inSegment) {
                    stabilityCtx.moveTo(x, y);
                    inSegment = true;
                } else {
                    stabilityCtx.lineTo(x, y);
                }
                validCount++;
                sumCents += Math.abs(cents);
                maxCents = Math.max(maxCents, Math.abs(cents));
            } else {
                inSegment = false;
            }
        }
        
        // Color styling based on average deviation
        const avgDev = validCount > 0 ? (sumCents / validCount) : 0;
        let strokeColor = '#14A7B5'; // Cyan
        if (avgDev <= 3) strokeColor = '#10b981'; // Green
        else if (avgDev > 15) strokeColor = '#ef4444'; // Red

        stabilityCtx.strokeStyle = strokeColor;
        stabilityCtx.shadowColor = strokeColor;
        stabilityCtx.shadowBlur = 4;
        stabilityCtx.stroke();
        stabilityCtx.shadowBlur = 0; // Reset

        // Update stats display text
        const statsDisplay = document.getElementById('tuner-stability-stats');
        if (statsDisplay) {
            if (validCount > 0) {
                statsDisplay.textContent = `AVG: ${avgDev.toFixed(1)}¢ | MAX: ${maxCents.toFixed(0)}¢`;
                if (avgDev <= 3) {
                    statsDisplay.style.color = '#10b981';
                } else {
                    statsDisplay.style.color = 'var(--text-muted)';
                }
            } else {
                statsDisplay.textContent = `AVG: --¢ | MAX: --¢`;
                statsDisplay.style.color = 'var(--text-muted)';
            }
        }
    }

    function resizeCanvas() {
        if (canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
        if (stabilityCanvas && stabilityCanvas.parentElement) {
            stabilityCanvas.width = stabilityCanvas.parentElement.clientWidth;
            stabilityCanvas.height = stabilityCanvas.parentElement.clientHeight;
        }
    }

    window.addEventListener('resize', () => {
        if (document.getElementById('tuner-view').style.display !== 'none') {
            resizeCanvas();
            drawVisualizer(null);
            drawStabilityChart();
        }
    });

    window.startTuner = function(deviceId) {
        if (isTuning) return;
        deviceId = deviceId || safeStorage.getItem('soundengg-mic-id') || 'default';
        const constraints = { audio: (deviceId && deviceId !== 'default') ? { deviceId: { exact: deviceId } } : true };
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            mediaStreamSource = audioCtx.createMediaStreamSource(stream);
            mediaStreamSource.connect(analyser);
            
            isTuning = true;
            resizeCanvas();
            updatePitch();
            
            btnStart.innerHTML = '<span class="material-symbols-outlined">mic_off</span> DEACTIVATE';
            btnStart.classList.add('active');
        }).catch(err => {
            alert('Microphone access denied. Please allow microphone permissions to use the Tuner.');
            btnStart.innerHTML = '<span class="material-symbols-outlined">mic</span> ACTIVATE_MIC';
        });
    };

    function stopTuner() {
        if (!isTuning) return;
        isTuning = false;
        window.cancelAnimationFrame(rafID);
        if (mediaStreamSource) mediaStreamSource.disconnect();
        if (audioCtx) audioCtx.suspend();
        btnStart.innerHTML = '<span class="material-symbols-outlined">mic</span> ACTIVATE_MIC';
        btnStart.classList.remove('active');
        centsHistory = [];
        drawVisualizer(null);
        drawStabilityChart();
        statusText.textContent = "TUNER INACTIVE";
        statusText.style.color = "var(--text-muted)";
    }
    window.stopTuner = stopTuner;

    btnStart.addEventListener('click', () => {
        if (isTuning) {
            stopTuner();
        } else {
            btnStart.innerHTML = 'CONNECTING...';
            window.startTuner();
        }
    });

    if (a4Input) {
        a4Input.addEventListener('change', (e) => {
            A4 = parseFloat(e.target.value) || 440;
        });
    }

    const thresholdInput = document.getElementById('tuner-threshold');
    const thresholdValDisplay = document.getElementById('tuner-threshold-val');
    
    if (thresholdInput) {
        const rmsToDb = (rms) => {
            if (rms <= 0) return "-∞";
            return (20 * Math.log10(rms)).toFixed(1);
        };

        // Load custom threshold from safeStorage if available
        const savedThresh = safeStorage.getItem('soundengg-tuner-threshold');
        if (savedThresh) {
            noiseThreshold = parseFloat(savedThresh);
            thresholdInput.value = savedThresh;
        } else {
            noiseThreshold = 0.040;
            thresholdInput.value = 0.040;
        }

        if (thresholdValDisplay) {
            thresholdValDisplay.textContent = `${rmsToDb(noiseThreshold)} dB`;
        }

        thresholdInput.addEventListener('input', (e) => {
            noiseThreshold = parseFloat(e.target.value) || 0.040;
            if (thresholdValDisplay) thresholdValDisplay.textContent = `${rmsToDb(noiseThreshold)} dB`;
            safeStorage.setItem('soundengg-tuner-threshold', noiseThreshold.toFixed(3));
        });
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.getAttribute('data-mode');
            if (!isTuning) drawVisualizer(null);
        });
    });

    window.resizeTunerCanvas = resizeCanvas;
    window.drawTunerVisualizer = drawVisualizer;
    
    // Initial resize and draw
    resizeCanvas();
    drawVisualizer(null);
    drawStabilityChart();

    // Listen for device changes to dynamically update tuner input source
    document.addEventListener('deviceChanged', (e) => {
        if (isTuning) {
            stopTuner();
            window.startTuner(e.detail);
        }
    });
}