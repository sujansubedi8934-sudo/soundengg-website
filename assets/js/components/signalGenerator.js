function initSignalGenerator() {
    const btnToggle = document.getElementById('btn-siggen-toggle');
    const freqSlider = document.getElementById('siggen-freq-slider');
    const freqInput = document.getElementById('siggen-freq-input');
    const gainSlider = document.getElementById('siggen-gain-slider');
    const gainVal = document.getElementById('siggen-gain-val');
    const waveBtns = document.querySelectorAll('.wave-btn');
    const freqChips = document.querySelectorAll('.freq-chip');
    const statusBadge = document.getElementById('siggen-status');
    const vuFill = document.getElementById('siggen-vu-fill');
    const meterText = document.getElementById('siggen-meter-text');
    const btnSweep = document.getElementById('btn-siggen-sweep');
    const sweepTimeInput = document.getElementById('siggen-sweep-time');
    const sweepSection = document.getElementById('siggen-sweep-section');

    let audioCtx;
    let currentGain = -18;
    let currentWave = 'sine';
    let currentFreq = 1000;
    let isPlaying = false;
    let gainNode = null;
    let analyzer = null;
    let oscillator = null;
    let noiseNode = null;
    let stopTimeout = null;
    let waveRestartTimeout = null;
    let visualsRafId = null;
    let timeDomainData = null;

    function saveSignalGenState() {
        saveConfigToCloud('siggen_config', {
            wave: currentWave,
            freq: currentFreq,
            gain: currentGain
        });
    }

    function cleanupActiveSources() {
        if (stopTimeout) {
            clearTimeout(stopTimeout);
            stopTimeout = null;
        }
        if (oscillator) {
            try { oscillator.stop(); } catch (e) {}
            try { oscillator.disconnect(); } catch (e) {}
            oscillator = null;
        }
        if (noiseNode) {
            try { noiseNode.disconnect(); } catch (e) {}
            noiseNode = null;
        }
    }

    function initAudio() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error("Failed to create AudioContext:", e);
                return;
            }
            
            // Explicitly sync output device safely
            try {
                const savedOutput = safeStorage.getItem('soundengg-output-id') || 'default';
                if (savedOutput && savedOutput !== 'default' && typeof audioCtx.setSinkId === 'function') {
                    audioCtx.setSinkId(savedOutput).catch(err => {
                        console.warn("Failed to apply initial sink ID to Signal Generator:", err);
                    });
                }
            } catch (err) {
                console.warn("Failed to retrieve or set output device safely:", err);
            }

            try {
                gainNode = audioCtx.createGain();
                gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Start muted
                
                analyzer = audioCtx.createAnalyser();
                analyzer.fftSize = 1024;
                timeDomainData = new Float32Array(analyzer.fftSize);
                
                gainNode.connect(analyzer);
                analyzer.connect(audioCtx.destination);
            } catch (e) {
                console.error("Failed to build Web Audio graph:", e);
            }
        }
    }

    function createPinkNoise() {
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

    function createWhiteNoise() {
        const bufferSize = 4096;
        const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        };
        return node;
    }

    async function startOutput() {
        if (waveRestartTimeout) {
            clearTimeout(waveRestartTimeout);
            waveRestartTimeout = null;
        }
        initAudio();
        if (!audioCtx) return;

        // On iOS/Safari, we must await context resumption before scheduling parameters or starting oscillators
        if (audioCtx.state === 'suspended') {
            try {
                await audioCtx.resume();
            } catch (e) {
                console.error("Failed to resume AudioContext:", e);
            }
        }

        // On iOS/Safari, ensure native audio session routes to USB DAC / headphones
        const audioPlugin = window.Capacitor?.Plugins?.AudioSessionPlugin;
        if (audioPlugin && typeof audioPlugin.configureAudioSession === 'function') {
            try {
                await audioPlugin.configureAudioSession({ category: 'playback', mode: 'default' });
            } catch (e) {}
        }

        // Always tear down any prior source or pending stop timeout to prevent zombie tones
        cleanupActiveSources();

        if (currentWave === 'white' || currentWave === 'pink') {
            noiseNode = (currentWave === 'white') ? createWhiteNoise() : createPinkNoise();
            noiseNode.connect(gainNode);
        } else {
            oscillator = audioCtx.createOscillator();
            oscillator.type = currentWave;
            oscillator.frequency.setValueAtTime(currentFreq, audioCtx.currentTime);
            oscillator.connect(gainNode);
            oscillator.start();
        }

        // Soft Ramp In: 0.35 Second Linear Ramp to target volume
        const targetGain = Math.pow(10, currentGain / 20);
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 0.35);
        
        isPlaying = true;
        btnToggle.classList.add('active');
        btnToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.1rem;">stop_circle</span> <span>DISENGAGE</span>';
        statusBadge.textContent = 'STATUS: ACTIVE';
        statusBadge.classList.add('active');

        if (!visualsRafId) {
            visualsRafId = requestAnimationFrame(updateVisuals);
        }
    }

    // Common stop logic
    function stopOutput(immediate = false) {
        if (waveRestartTimeout) {
            clearTimeout(waveRestartTimeout);
            waveRestartTimeout = null;
        }
        if (!isPlaying && !oscillator && !noiseNode) return;
        isPlaying = false;

        if (visualsRafId) {
            cancelAnimationFrame(visualsRafId);
            visualsRafId = null;
        }
        if (vuFill) vuFill.style.height = '0%';
        if (meterText) meterText.textContent = '-∞ dB';

        if (immediate || !audioCtx || !gainNode) {
            cleanupActiveSources();
        } else {
            // Soft Ramp Out
            try {
                gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.015);
            } catch (e) {}
            if (stopTimeout) clearTimeout(stopTimeout);
            stopTimeout = setTimeout(() => {
                cleanupActiveSources();
            }, 45);
        }

        btnToggle.classList.remove('active');
        btnToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.1rem;">power_settings_new</span> <span>ENGAGE</span>';
        statusBadge.textContent = 'STATUS: STANDBY';
        statusBadge.classList.remove('active');
    }
    window.stopSignalGenerator = stopOutput;

    function updateVisuals() {
        if (!isPlaying || !analyzer) {
            visualsRafId = null;
            if (vuFill) vuFill.style.height = '0%';
            if (meterText) meterText.textContent = '-∞ dB';
            return;
        }

        if (!timeDomainData || timeDomainData.length !== analyzer.fftSize) {
            timeDomainData = new Float32Array(analyzer.fftSize);
        }
        analyzer.getFloatTimeDomainData(timeDomainData);
        
        let peakAbs = 0;
        let sumSq = 0;
        const N = timeDomainData.length;
        for (let i = 0; i < N; i++) {
            const s = timeDomainData[i];
            const abs = Math.abs(s);
            if (abs > peakAbs) peakAbs = abs;
            sumSq += s * s;
        }
        const rms = Math.sqrt(sumSq / N);
        // For periodic waveforms (sine/triangle/square/saw), peak amplitude directly equals targetGain dBFS;
        // for noise, display true RMS/peak dBFS smoothly.
        const measuredAmp = (currentWave === 'white' || currentWave === 'pink') ? Math.max(rms * 2.2, peakAbs * 0.707) : peakAbs;
        const db = measuredAmp > 1e-5 ? Math.min(0, Math.max(-60, 20 * Math.log10(measuredAmp))) : -60;
        const levelPercent = Math.min(100, Math.max(0, ((db + 60) / 60) * 100));
        
        if (vuFill) vuFill.style.height = `${levelPercent.toFixed(1)}%`;
        if (meterText) meterText.textContent = db <= -59.5 ? '-∞ dB' : `${db.toFixed(1)} dB`;

        visualsRafId = requestAnimationFrame(updateVisuals);
    }

    async function startSweep() {
        // If noise waveform is active, switch cleanly to Sine without triggering delayed button timeout race
        if (currentWave === 'white' || currentWave === 'pink') {
            currentWave = 'sine';
            waveBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-wave') === 'sine'));
            if (isPlaying) {
                stopOutput(true);
            }
        }

        if (!isPlaying || !oscillator) {
            await startOutput();
        }
        
        if (!oscillator) {
            console.warn("Oscillator could not be initialized for sweep.");
            return;
        }
        
        const duration = parseFloat(sweepTimeInput.value) || 5;
        // Add a small lookahead offset (+0.05s) to guarantee the Web Audio clock has started ticking
        const startTime = audioCtx.currentTime + 0.05;
        const endTime = startTime + duration;
        
        // Audio Ramp
        oscillator.frequency.cancelScheduledValues(startTime);
        oscillator.frequency.setValueAtTime(20, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(20000, endTime);
        
        btnSweep.classList.add('active');
        btnSweep.innerHTML = '<span class="material-symbols-outlined">sync</span> SWEEPING...';

        // UI Sync Loop
        function updateSweepUI() {
            if (!isPlaying || !oscillator || audioCtx.currentTime >= endTime) {
                btnSweep.classList.remove('active');
                btnSweep.innerHTML = '<span class="material-symbols-outlined">settings_backup_restore</span> START_SWEEP';
                if (isPlaying && oscillator) {
                    currentFreq = 20000;
                    freqInput.value = currentFreq;
                    freqSlider.value = 1;
                }
                return;
            }
            
            // Calculate current freq for UI sync (logarithmic interpolation)
            const elapsed = audioCtx.currentTime - startTime;
            const progress = Math.max(0, elapsed / duration);
            const minFreq = 20;
            const maxFreq = 20000;
            currentFreq = Math.round(minFreq * Math.pow(maxFreq / minFreq, progress));
            
            freqInput.value = currentFreq;
            freqSlider.value = Math.log(currentFreq / minFreq) / Math.log(maxFreq / minFreq);
            
            requestAnimationFrame(updateSweepUI);
        }
        
        updateSweepUI();
    }

    // --- Event Listeners ---

    btnToggle.addEventListener('click', async () => {
        if (isPlaying) stopOutput();
        else await startOutput();
    });

    // Logarithmic Frequency Mapping
    freqSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        // Map 0-1 to 20Hz - 20000Hz logarithmically
        const minFreq = 20;
        const maxFreq = 20000;
        currentFreq = Math.round(minFreq * Math.pow(maxFreq / minFreq, val));
        
        freqInput.value = currentFreq;
        if (oscillator) {
            oscillator.frequency.setTargetAtTime(currentFreq, audioCtx.currentTime, 0.01);
        }
        saveSignalGenState();
    });

    // Manual Frequency Input
    freqInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) return;
        if (val < 20) val = 20;
        if (val > 20000) val = 20000;
        
        currentFreq = val;
        
        // Update slider position
        const minFreq = 20;
        const maxFreq = 20000;
        const sliderVal = Math.log(currentFreq / minFreq) / Math.log(maxFreq / minFreq);
        freqSlider.value = sliderVal;

        if (oscillator) {
            oscillator.frequency.setTargetAtTime(currentFreq, audioCtx.currentTime, 0.01);
        }
        saveSignalGenState();
    });

    gainSlider.addEventListener('input', (e) => {
        currentGain = parseFloat(e.target.value);
        gainVal.textContent = `${currentGain} dB`;
        if (isPlaying && gainNode) {
            const targetGain = Math.pow(10, currentGain / 20);
            gainNode.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.02);
        }
        saveSignalGenState();
    });

    waveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newWave = btn.getAttribute('data-wave');
            if (newWave === currentWave) return;

            waveBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const wasPlaying = isPlaying;
            if (wasPlaying) stopOutput();
            
            currentWave = newWave;

            // Keep sweep active at all times
            sweepSection.style.opacity = '1';
            sweepSection.style.pointerEvents = 'all';
            
            if (wasPlaying) {
                waveRestartTimeout = setTimeout(startOutput, 60);
            }
            saveSignalGenState();
        });
    });

    if (btnSweep) {
        btnSweep.addEventListener('click', async () => {
            await startSweep();
        });
    }

    freqChips.forEach(chip => {
        chip.addEventListener('click', () => {
            currentFreq = parseInt(chip.getAttribute('data-freq'));
            freqInput.value = currentFreq;
            
            // Reverse map freq to slider value
            const minFreq = 20;
            const maxFreq = 20000;
            const sliderVal = Math.log(currentFreq / minFreq) / Math.log(maxFreq / minFreq);
            freqSlider.value = sliderVal;

            if (oscillator) {
                oscillator.frequency.setTargetAtTime(currentFreq, audioCtx.currentTime, 0.05);
            }
            saveSignalGenState();
        });
    });

    // Collapsible sweep card
    const sweepCard = document.getElementById('siggen-sweep-card');
    const btnToggleSweep = document.getElementById('btn-toggle-siggen-sweep');
    if (btnToggleSweep && sweepCard) {
        btnToggleSweep.addEventListener('click', (e) => {
            e.preventDefault();
            sweepCard.classList.toggle('expanded');
        });
    }

    // Collapsible operational notes card
    const notesCard = document.getElementById('siggen-notes-card');
    const btnToggleNotes = document.getElementById('btn-toggle-siggen-notes');
    if (btnToggleNotes && notesCard) {
        btnToggleNotes.addEventListener('click', (e) => {
            e.preventDefault();
            notesCard.classList.toggle('expanded');
        });
    }

    // --- Pull from Cloud ---
    async function pullSignalGen() {
        if (typeof supabaseClient === 'undefined') return;
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        try {
            const { data } = await supabaseClient
                .from('user_configs')
                .select('data')
                .eq('user_id', session.user.id)
                .eq('config_type', 'siggen_config')
                .maybeSingle();

            if (data && data.data) {
                currentWave = data.data.wave || 'sine';
                currentFreq = data.data.freq || 1000;
                currentGain = data.data.gain || -18;

                // Sync UI
                freqInput.value = currentFreq;
                gainSlider.value = currentGain;
                gainVal.textContent = `${currentGain} dB`;
                
                const minFreq = 20;
                const maxFreq = 20000;
                freqSlider.value = Math.log(currentFreq / minFreq) / Math.log(maxFreq / minFreq);

                waveBtns.forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-wave') === currentWave);
                });

                // Keep sweep active at all times
                sweepSection.style.opacity = '1';
                sweepSection.style.pointerEvents = 'all';
            }
        } catch (err) {
            console.error('Cloud Pull Error (SigGen):', err);
        }
    }

    pullSignalGen();
    document.addEventListener('authSuccess', pullSignalGen);

    // Sync output changes from global settings & Apply routes
    document.addEventListener('outputDeviceChanged', async (e) => {
        const newDeviceId = e.detail;
        if (audioCtx && typeof audioCtx.setSinkId === 'function') {
            try {
                await audioCtx.setSinkId(newDeviceId);
                console.log("Signal Generator AudioContext successfully routed to:", newDeviceId);
            } catch (err) {
                console.warn("Failed to route Signal Generator AudioContext on outputDeviceChanged:", err);
            }
        }
    });
}