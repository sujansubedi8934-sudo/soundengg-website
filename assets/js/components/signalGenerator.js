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

    function saveSignalGenState() {
        saveConfigToCloud('siggen_config', {
            wave: currentWave,
            freq: currentFreq,
            gain: currentGain
        });
    }

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Explicitly sync output device
            const savedOutput = safeStorage.getItem('soundengg-output-id') || 'default';
            if (savedOutput && savedOutput !== 'default' && typeof audioCtx.setSinkId === 'function') {
                audioCtx.setSinkId(savedOutput).catch(err => {
                    console.warn("Failed to apply initial sink ID to Signal Generator:", err);
                });
            }

            gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Start muted
            
            analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 256;
            
            gainNode.connect(analyzer);
            analyzer.connect(audioCtx.destination);
            
            updateVisuals();
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

    function startOutput() {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();

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

        // Soft Ramp In: 1.0 Second Linear Ramp to target volume
        const targetGain = Math.pow(10, currentGain / 20);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 1.0);
        
        isPlaying = true;
        btnToggle.classList.add('active');
        btnToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.1rem;">stop_circle</span> <span>DISENGAGE</span>';
        statusBadge.textContent = 'STATUS: ACTIVE';
        statusBadge.classList.add('active');
    }

    // Common stop logic
    function stopOutput() {
        if (!isPlaying) return;
        
        // Soft Ramp Out
        gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.02);
        
        setTimeout(() => {
            if (oscillator) {
                oscillator.stop();
                oscillator.disconnect();
                oscillator = null;
            }
            if (noiseNode) {
                noiseNode.disconnect();
                noiseNode = null;
            }
            isPlaying = false;
        }, 50);

        btnToggle.classList.remove('active');
        btnToggle.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.1rem;">power_settings_new</span> <span>ENGAGE</span>';
        statusBadge.textContent = 'STATUS: STANDBY';
        statusBadge.classList.remove('active');
    }
    window.stopSignalGenerator = stopOutput;

    function updateVisuals() {
        if (!isPlaying) {
            vuFill.style.height = '0%';
            meterText.textContent = '-∞ dB';
            requestAnimationFrame(updateVisuals);
            return;
        }

        const data = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(data);
        
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const levelPercent = (avg / 255) * 100;
        
        vuFill.style.height = `${levelPercent}%`;
        
        // Map back to approximate dB for display
        const db = currentGain + (levelPercent / 10);
        meterText.textContent = `${db.toFixed(1)} dB`;

        requestAnimationFrame(updateVisuals);
    }

    function startSweep() {
        // If noise waveform is active, sweep is not possible. Programmatically click Sine button.
        if (currentWave === 'white' || currentWave === 'pink') {
            const sineBtn = document.querySelector('.wave-btn[data-wave="sine"]');
            if (sineBtn) {
                sineBtn.click();
            }
        }

        if (!isPlaying || !oscillator) {
            startOutput();
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
            if (!isPlaying || audioCtx.currentTime >= endTime) {
                btnSweep.classList.remove('active');
                btnSweep.innerHTML = '<span class="material-symbols-outlined">settings_backup_restore</span> START_SWEEP';
                currentFreq = 20000;
                freqInput.value = currentFreq;
                freqSlider.value = 1;
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

    btnToggle.addEventListener('click', () => {
        if (isPlaying) stopOutput();
        else startOutput();
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

            // Hide sweep for noise
            if (currentWave === 'white' || currentWave === 'pink') {
                sweepSection.style.opacity = '0.3';
                sweepSection.style.pointerEvents = 'none';
            } else {
                sweepSection.style.opacity = '1';
                sweepSection.style.pointerEvents = 'all';
            }
            
            if (wasPlaying) {
                setTimeout(startOutput, 100);
            }
            saveSignalGenState();
        });
    });

    if (btnSweep) {
        btnSweep.addEventListener('click', () => {
            startSweep();
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

                // Update sweep section visibility
                if (currentWave === 'white' || currentWave === 'pink') {
                    sweepSection.style.opacity = '0.3';
                    sweepSection.style.pointerEvents = 'none';
                } else {
                    sweepSection.style.opacity = '1';
                    sweepSection.style.pointerEvents = 'all';
                }
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