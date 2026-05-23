function initEarTraining() {
    const ISO_FREQS = [50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000];
    
    const btnPlayToggle = document.getElementById('btn-train-toggle');
    const playIcon = document.getElementById('train-play-icon');
    const btnA = document.querySelector('.ab-channel-btn[data-channel="A"]');
    const btnB = document.querySelector('.ab-channel-btn[data-channel="B"]');
    
    const statRound = document.getElementById('train-stat-round');
    const statQ = document.getElementById('train-stat-q');
    const statScore = document.getElementById('train-stat-score');
    
    const optionsContainer = document.getElementById('train-options-container');
    const sourceBtns = document.querySelectorAll('#ear-training-view .train-source-btn');
    const tierBtns = document.querySelectorAll('.train-tier-btn');
    const boostBtns = document.querySelectorAll('.train-boost-btn');

    // Pro Feature elements: Custom track uploader and seeker
    const uploadContainer = document.getElementById('train-track-upload-container');
    const uploadBtn = document.getElementById('btn-train-upload');
    const fileInput = document.getElementById('train-track-file');
    const statusLabel = document.getElementById('train-track-status');
    const seekContainer = document.getElementById('train-track-seek-container');
    const seekSlider = document.getElementById('train-track-seek-slider');
    const timeCurrent = document.getElementById('train-track-time-current');
    const timeTotal = document.getElementById('train-track-time-total');

    let audioCtx;
    let sourceNode;
    let filterNode;
    let gainNode;
    
    let isTraining = false;
    let currentTargetFreq = 0;
    let currentBoost = 6;
    let currentSource = 'pink';
    let currentTier = 'octave';
    let currentChannel = 'B';
    let customTrackBuffer = null;
    let seekOffset = 0;
    let startTime = 0;
    let seekUpdateInterval = null;
    let isUserSeeking = false;
    
    let sessionRound = 1;
    let questionsTotal = 0;
    let questionsCorrect = 0;

    const OCTAVE_FREQS = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const THIRD_OCTAVE_FREQS = [50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000];
    const SIXTH_OCTAVE_FREQS = [
        50, 56, 63, 71, 80, 90, 100, 112, 125, 140, 160, 180, 200, 224, 250, 280, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120, 1250, 1400, 1600, 1800, 2000, 2240, 2500, 2800, 3150, 3550, 4000, 4500, 5000, 5600, 6300, 7100, 8000, 9000, 10000, 11200, 12500, 14000, 16000
    ];

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Explicitly sync output device
            const savedOutput = safeStorage.getItem('soundengg-output-id') || 'default';
            if (savedOutput && savedOutput !== 'default' && typeof audioCtx.setSinkId === 'function') {
                audioCtx.setSinkId(savedOutput).catch(err => {
                    console.warn("Failed to apply initial sink ID to Ear Training:", err);
                });
            }

            gainNode = audioCtx.createGain();
            filterNode = audioCtx.createBiquadFilter();
            filterNode.type = 'peaking';
            filterNode.Q.value = 4.32; // 1/3 octave
            
            filterNode.connect(gainNode);
            gainNode.connect(audioCtx.destination);
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
                output[i] *= 0.11;
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

    function setChannel(ch) {
        if (!isTraining) return;
        currentChannel = ch;
        if (btnA) btnA.classList.toggle('active', ch === 'A');
        if (btnB) btnB.classList.toggle('active', ch === 'B');
        
        if (filterNode) {
            const targetGain = (ch === 'B') ? currentBoost : 0;
            filterNode.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.05);
        }
    }

    function startChallenge() {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        stopAudio();

        const freqList = (currentTier === 'octave') 
            ? OCTAVE_FREQS 
            : ((currentTier === 'third') ? THIRD_OCTAVE_FREQS : SIXTH_OCTAVE_FREQS);
        const idx = Math.floor(Math.random() * freqList.length);
        currentTargetFreq = freqList[idx];
        
        if (currentSource === 'pink') {
            sourceNode = createPinkNoise();
        } else if (currentSource === 'white') {
            sourceNode = createWhiteNoise();
        } else if (currentSource === 'sine') {
            sourceNode = audioCtx.createOscillator();
            sourceNode.type = 'sine';
            sourceNode.frequency.value = currentTargetFreq;
        } else if (currentSource === 'track') {
            if (!customTrackBuffer) {
                // Trigger file picker
                if (fileInput) fileInput.click();
                alert("Please select a reference audio track from your device first.");
                stopAudio();
                return;
            }
            sourceNode = audioCtx.createBufferSource();
            sourceNode.buffer = customTrackBuffer;
            sourceNode.loop = true;
        }

        if (filterNode) {
            filterNode.frequency.setTargetAtTime(currentTargetFreq, audioCtx.currentTime, 0.01);
            filterNode.gain.setTargetAtTime((currentChannel === 'B') ? currentBoost : 0, audioCtx.currentTime, 0.01);
            filterNode.Q.value = (currentTier === 'octave') 
                ? 2.0 
                : ((currentTier === 'third') ? 4.32 : 8.65);
        }

        if (sourceNode) {
            sourceNode.connect(filterNode);
        }
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.5);
        
        if (sourceNode && sourceNode.start) {
            if (currentSource === 'track') {
                sourceNode.start(0, seekOffset);
                startTime = audioCtx.currentTime;
                startSeekTracker();
            } else {
                sourceNode.start();
            }
        }
        
        isTraining = true;
        if (btnPlayToggle) btnPlayToggle.classList.add('playing');
        if (playIcon) playIcon.textContent = 'pause';
        
        renderOptions(currentTargetFreq);
        updateStats();
    }

    function stopAudio() {
        stopSeekTracker();
        if (sourceNode) {
            try {
                sourceNode.stop();
            } catch(e) {}
            sourceNode.disconnect();
            sourceNode = null;
        }
        isTraining = false;
        if (btnPlayToggle) btnPlayToggle.classList.remove('playing');
        if (playIcon) playIcon.textContent = 'play_arrow';
    }
    window.stopEarTraining = stopAudio;

    function togglePlay() {
        if (isTraining) {
            stopAudio();
        } else {
            startChallenge();
        }
    }

    function updateStats() {
        if (statRound) statRound.textContent = sessionRound;
        if (statQ) statQ.textContent = `${questionsTotal}/10`;
        const percentage = questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 0;
        if (statScore) statScore.textContent = `${percentage}%`;
    }

    function renderOptions(correctFreq) {
        if (!optionsContainer) return;
        optionsContainer.innerHTML = '';
        
        const freqList = (currentTier === 'octave') 
            ? OCTAVE_FREQS 
            : ((currentTier === 'third') ? THIRD_OCTAVE_FREQS : SIXTH_OCTAVE_FREQS);
        const correctIdx = freqList.indexOf(correctFreq);
        
        let options = [correctFreq];
        
        // Pick 4 additional random distractors from the list
        while (options.length < 5) {
            const randIdx = Math.floor(Math.random() * freqList.length);
            const randFreq = freqList[randIdx];
            if (!options.includes(randFreq)) {
                options.push(randFreq);
            }
        }

        // Shuffle distractors
        options.sort((a, b) => a - b); // Sort numerically for easier reading or shuffle for difficulty

        options.forEach(freq => {
            const btn = document.createElement('button');
            btn.className = 'train-option-btn';
            btn.textContent = freq >= 1000 ? (freq/1000).toFixed(2).replace(/\.00$/, '') + 'k' : freq;
            btn.addEventListener('click', () => handleAnswer(freq, btn));
            optionsContainer.appendChild(btn);
        });
    }

    async function saveTrainingScore() {
        if (!window.supabaseClient) return;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        try {
            await saveConfigToCloud('training_stats', {
                total: questionsTotal,
                correct: questionsCorrect,
                accuracy: questionsTotal > 0 ? (questionsCorrect / questionsTotal) * 100 : 0,
                lastSession: new Date().toISOString()
            });
        } catch (err) {
            console.error('Cloud Score Sync Error:', err);
        }
    }

    function handleAnswer(selectedFreq, btn) {
        if (!isTraining) return;
        
        questionsTotal++;
        const isCorrect = (Math.abs(selectedFreq - currentTargetFreq) < 0.1);
        
        const allBtns = optionsContainer.querySelectorAll('.train-option-btn');
        allBtns.forEach(b => b.style.pointerEvents = 'none');
        
        if (isCorrect) {
            questionsCorrect++;
            btn.classList.add('correct');
        } else {
            btn.classList.add('error');
            allBtns.forEach(b => {
                const fText = currentTargetFreq >= 1000 ? (currentTargetFreq/1000).toFixed(2).replace(/\.00$/, '') + 'k' : currentTargetFreq.toString();
                if (b.textContent === fText) b.classList.add('correct');
            });
        }

        updateStats();
        saveTrainingScore();
        
        setTimeout(() => {
            if (questionsTotal >= 10) {
                stopAudio();
                sessionRound++;
                questionsTotal = 0;
                questionsCorrect = 0;
                optionsContainer.innerHTML = '<div class="placeholder-text" style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Round Complete! Click Play to start next round.</div>';
                updateStats();
            } else {
                startChallenge();
            }
        }, 1500);
    }

    // Listeners
    if (btnPlayToggle) btnPlayToggle.addEventListener('click', (e) => { if (e) e.preventDefault(); togglePlay(); });
    if (btnA) btnA.addEventListener('click', (e) => { if (e) e.preventDefault(); setChannel('A'); });
    if (btnB) btnB.addEventListener('click', (e) => { if (e) e.preventDefault(); setChannel('B'); });

    tierBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            const tier = btn.getAttribute('data-tier');
            if (btn.classList.contains('locked-pro') && tier === 'sixth' && !window.isPremiumActive('ear_training')) {
                window.showProUpgradeModal('ear_training');
                return;
            }
            tierBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTier = tier;
            if (isTraining) startChallenge();
        });
    });

    sourceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            if (btn.classList.contains('locked-pro') && !window.isPremiumActive('ear_training')) {
                const source = btn.getAttribute('data-source');
                if (source === 'track') {
                    window.showProUpgradeModal('ear_training_track');
                } else {
                    window.showProUpgradeModal('ear_training');
                }
                return;
            }
            sourceBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSource = btn.getAttribute('data-source');
            
            // Dynamic container slide-toggle
            if (uploadContainer) {
                uploadContainer.style.display = (currentSource === 'track') ? 'block' : 'none';
            }

            if (isTraining) startAudio();
        });
    });

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            initAudio();
            if (statusLabel) statusLabel.textContent = "Decoding...";
            
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const arrayBuffer = evt.target.result;
                    customTrackBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    if (statusLabel) statusLabel.textContent = file.name;
                    console.log("Successfully decoded custom track:", file.name);
                    
                    // Show seek controls and populate duration
                    if (seekContainer) seekContainer.style.display = 'flex';
                    if (seekSlider) {
                        seekSlider.max = customTrackBuffer.duration;
                        seekSlider.value = 0;
                    }
                    if (timeTotal) timeTotal.textContent = formatTime(customTrackBuffer.duration);
                    if (timeCurrent) timeCurrent.textContent = "0:00";
                    seekOffset = 0;

                    // If playing and source is TRACK, reload audio dynamically
                    if (isTraining && currentSource === 'track') {
                        startAudio();
                    }
                } catch (err) {
                    alert("Error decoding audio file. Please try another standard format like MP3 or WAV.");
                    if (statusLabel) statusLabel.textContent = "Error loading";
                    customTrackBuffer = null;
                    console.error("Audio Decode Error:", err);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    function formatTime(secs) {
        if (isNaN(secs)) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    function startSeekTracker() {
        stopSeekTracker();
        seekUpdateInterval = setInterval(() => {
            if (!isTraining || currentSource !== 'track' || !customTrackBuffer || isUserSeeking) return;
            
            const elapsed = audioCtx.currentTime - startTime + seekOffset;
            const currentPos = elapsed % customTrackBuffer.duration;
            
            if (seekSlider) seekSlider.value = currentPos;
            if (timeCurrent) timeCurrent.textContent = formatTime(currentPos);
        }, 100);
    }
    
    function stopSeekTracker() {
        if (seekUpdateInterval) {
            clearInterval(seekUpdateInterval);
            seekUpdateInterval = null;
        }
    }

    if (seekSlider) {
        seekSlider.addEventListener('input', () => {
            isUserSeeking = true;
            if (timeCurrent) {
                timeCurrent.textContent = formatTime(seekSlider.value);
            }
        });
        
        seekSlider.addEventListener('change', () => {
            const newOffset = parseFloat(seekSlider.value);
            seekOffset = newOffset;
            
            // If playing, we need to stop and start the buffer node at the new offset!
            if (isTraining && currentSource === 'track' && sourceNode && customTrackBuffer) {
                try {
                    sourceNode.stop();
                } catch(e) {}
                sourceNode.disconnect();
                
                sourceNode = audioCtx.createBufferSource();
                sourceNode.buffer = customTrackBuffer;
                sourceNode.loop = true;
                
                if (filterNode) {
                    sourceNode.connect(filterNode);
                }
                
                sourceNode.start(0, seekOffset);
                startTime = audioCtx.currentTime;
            }
            isUserSeeking = false;
        });
    }

    boostBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            boostBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBoost = parseInt(btn.getAttribute('data-boost'));
            if (isTraining && currentChannel === 'B' && filterNode) {
                filterNode.gain.setTargetAtTime(currentBoost, audioCtx.currentTime, 0.05);
            }
        });
    });

    // Handle Pro Status Changed to update tier buttons
    document.addEventListener('proStatusChanged', (e) => {
        const isPro = e.detail;
        tierBtns.forEach(btn => {
            const tier = btn.getAttribute('data-tier');
            // Only 1/6 Octave is Pro-locked now
            if (tier === 'sixth') {
                btn.classList.toggle('locked-pro', !isPro);
            }
        });
        sourceBtns.forEach(btn => {
            if (btn.getAttribute('data-source') === 'track') {
                btn.classList.toggle('locked-pro', !isPro);
            }
        });
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        const view = document.getElementById('ear-training-view');
        if (!view || view.style.display === 'none') return;
        
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
        } else if (e.code === 'KeyA') {
            setChannel('A');
        } else if (e.code === 'KeyB') {
            setChannel('B');
        }
    });

    // Initialize container display state
    if (uploadContainer) {
        uploadContainer.style.display = 'none';
    }

    // Sync output changes from global settings & Apply routes
    document.addEventListener('outputDeviceChanged', async (e) => {
        const newDeviceId = e.detail;
        if (audioCtx && typeof audioCtx.setSinkId === 'function') {
            try {
                await audioCtx.setSinkId(newDeviceId);
                console.log("Ear Training AudioContext successfully routed to:", newDeviceId);
            } catch (err) {
                console.warn("Failed to route Ear Training AudioContext on outputDeviceChanged:", err);
            }
        }
    });
}