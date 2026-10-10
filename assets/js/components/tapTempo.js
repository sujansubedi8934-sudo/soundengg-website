function initTapTempoDelay() {
    const btnTrigger = document.getElementById('btn-tap-delay-trigger');
    const btnReset = document.getElementById('btn-tap-delay-reset');
    const bpmDisplay = document.getElementById('tap-delay-bpm-display');
    const statusText = document.getElementById('tap-delay-status');
    const manualInput = document.getElementById('tap-delay-manual-bpm');

    // Values Elements
    const sub2x = document.getElementById('tap-sub-2x-val');
    const sub1x = document.getElementById('tap-sub-1x-val');
    const subHalf = document.getElementById('tap-sub-half-val');
    const subQuarter = document.getElementById('tap-sub-quarter-val');
    const subEighth = document.getElementById('tap-sub-eighth-val');

    // Blink Fill Elements
    const fills = document.querySelectorAll('.bpm-pulse-fill');

    let tapTimes = [];
    let blinkInterval = null;
    let blinkIdleTimeout = null;

    function stopTapTempoPulse() {
        if (blinkInterval) {
            clearInterval(blinkInterval);
            blinkInterval = null;
        }
        if (blinkIdleTimeout) {
            clearTimeout(blinkIdleTimeout);
            blinkIdleTimeout = null;
        }
        fills.forEach(f => { f.style.opacity = '0'; });
    }
    window.stopTapTempoPulse = stopTapTempoPulse;

    function renderTempo(bpm, isManual = false) {
        if (bpm < 20 || bpm > 320) return;

        bpmDisplay.textContent = Math.round(bpm);
        if (!isManual && manualInput) {
            manualInput.value = Math.round(bpm);
        }

        if (isManual) {
            statusText.textContent = `MANUAL TEMPO SET (${Math.round(bpm)} BPM)`;
        } else {
            statusText.textContent = `LISTENING... (TAPS: ${tapTimes.length})`;
        }

        const avg = 60000 / bpm;

        // Output precise subdivisions
        if (sub2x) sub2x.innerHTML = `${Math.round(2 * avg)} <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (sub1x) sub1x.innerHTML = `${Math.round(avg)} <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (subHalf) subHalf.innerHTML = `${Math.round(avg / 2)} <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (subQuarter) subQuarter.innerHTML = `${Math.round(avg / 4)} <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (subEighth) subEighth.innerHTML = `${Math.round(avg / 8)} <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;

        // Active visual pulse sync (auto-stops after 5s of inactivity)
        stopTapTempoPulse();
        let active = true;
        blinkInterval = setInterval(() => {
            fills.forEach(f => {
                f.style.opacity = active ? '0.2' : '0';
            });
            active = !active;
        }, avg / 2);
        blinkIdleTimeout = setTimeout(() => {
            stopTapTempoPulse();
        }, 5000);
    }

    if (!btnTrigger) return;

    // 1. Tapping Trigger click listener
    btnTrigger.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        
        // Push micro tactile animation
        btnTrigger.style.transform = 'scale(0.95)';
        setTimeout(() => { btnTrigger.style.transform = 'scale(1)'; }, 50);

        const now = Date.now();
        
        // Reset tap history only when pause since the last tap exceeds 2.5 seconds (supports tempos down to 24 BPM)
        if (tapTimes.length > 0 && (now - tapTimes[tapTimes.length - 1]) > 2500) {
            tapTimes = [];
        }
        tapTimes.push(now);
        // Keep last 9 taps (8 intervals) for smooth rolling BPM stability
        if (tapTimes.length > 9) {
            tapTimes = tapTimes.slice(-9);
        }

        if (tapTimes.length < 2) {
            statusText.textContent = `TAP AGAIN TO MEASURE...`;
            bpmDisplay.textContent = '---';
            return;
        }

        // Calculate rolling interval average across last up to 8 intervals
        let intervals = [];
        for (let i = 1; i < tapTimes.length; i++) {
            intervals.push(tapTimes[i] - tapTimes[i - 1]);
        }
        
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = Math.round(60000 / avg);

        // Clamp validation to standard musical tempos
        if (bpm >= 20 && bpm <= 320) {
            renderTempo(bpm, false);
        }
    });

    // 2. Manual BPM Input Listener
    if (manualInput) {
        manualInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val >= 20 && val <= 320) {
                tapTimes = []; // Clear previous tap history so next taps start fresh
                renderTempo(val, true);
            }
        });
    }

    // 3. Reset Trigger
    btnReset.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        
        tapTimes = [];
        stopTapTempoPulse();

        bpmDisplay.textContent = '---';
        if (manualInput) manualInput.value = '';
        statusText.textContent = 'TAP BUTTON TO START CALCULATING';

        if (sub2x) sub2x.innerHTML = `--- <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (sub1x) sub1x.innerHTML = `--- <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (subHalf) subHalf.innerHTML = `--- <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (subQuarter) subQuarter.innerHTML = `--- <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (subEighth) subEighth.innerHTML = `--- <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
    });

    // 4. Individual Subdivision Clipboard Copy Integration
    const subLabels = {
        'tap-sub-2x-val': '2x / Half Note',
        'tap-sub-1x-val': '1x / Quarter Note',
        'tap-sub-half-val': '1/2 / Eighth Note',
        'tap-sub-quarter-val': '1/4 / Sixteenth Note',
        'tap-sub-eighth-val': '1/8 / Thirty-Second Note'
    };
    const copyButtons = document.querySelectorAll('.btn-copy-delay');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const numeric = parseInt(targetEl.textContent, 10);
                if (!isNaN(numeric)) {
                    const currentBpm = parseInt(bpmDisplay.textContent, 10) || parseInt(manualInput?.value, 10) || 120;
                    const label = subLabels[targetId] || 'Subdivision';
                    navigator.clipboard.writeText(numeric.toString()).then(() => {
                        const original = btn.innerHTML;
                        btn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 14px; color: var(--primary);">check</span> COPIED`;
                        setTimeout(() => { btn.innerHTML = original; }, 1200);
                        if (typeof window.showSoundEnggToast === 'function') {
                            window.showSoundEnggToast(`✓ Copied ${numeric} ms (${label} @ ${currentBpm} BPM)`);
                        }
                    });
                } else if (typeof window.showSoundEnggToast === 'function') {
                    window.showSoundEnggToast('Tap or enter a BPM first to copy delay time!');
                }
            }
        });
    });

    // 5. Share Complete Tap Tempo Delay Chart (#btn-share-taptempo)
    const btnShareTap = document.getElementById('btn-share-taptempo');
    if (btnShareTap) {
        btnShareTap.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            let bpm = parseInt(bpmDisplay.textContent, 10) || parseInt(manualInput?.value, 10);
            if (isNaN(bpm) || bpm < 20 || bpm > 320) {
                bpm = 120;
                renderTempo(bpm, true);
            }
            const avg = 60000 / bpm;
            const baseUrl = typeof window.getPublicAppUrl === 'function'
                ? window.getPublicAppUrl()
                : 'https://www.soundengg.com/app.html';
            const shareUrl = `${baseUrl}?view=tapdelay&bpm=${bpm}`;

            const reportStr = [
                `SoundEngg Tap Tempo FX Delay Chart`,
                `• Tempo: ${bpm} BPM`,
                `• Double Delay (2x / Half Note): ${Math.round(2 * avg)} ms`,
                `• Single Delay (1x / Quarter Note): ${Math.round(avg)} ms`,
                `• Half Delay (1/2 / Eighth Note): ${Math.round(avg / 2)} ms`,
                `• Quarter Delay (1/4 / Sixteenth Note): ${Math.round(avg / 4)} ms`,
                `• Eighth Delay (1/8 / Thirty-Second Note): ${Math.round(avg / 8)} ms`,
                `• Interactive Config: ${shareUrl}`
            ].join('\n');

            if (typeof window.shareConfigReport === 'function') {
                window.shareConfigReport(
                    `SoundEngg Tap Tempo FX Delay Chart (${bpm} BPM)`,
                    reportStr,
                    `✓ Copied ${bpm} BPM Delay Chart & Link!`
                );
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(reportStr).then(() => {
                    if (typeof window.showSoundEnggToast === 'function') {
                        window.showSoundEnggToast(`✓ Copied ${bpm} BPM Delay Chart & Link!`);
                    } else {
                        alert(reportStr);
                    }
                }).catch(() => {
                    alert(reportStr);
                });
            } else {
                alert(reportStr);
            }
        });
    }

    // 6. Restore Shared BPM from URL Query Params
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = (urlParams.get('view') || '').toLowerCase();
    if (viewParam === 'tapdelay' || viewParam === 'taptempo') {
        const bpmQ = parseFloat(urlParams.get('bpm'));
        if (!isNaN(bpmQ) && bpmQ >= 20 && bpmQ <= 320) {
            renderTempo(bpmQ, true);
        }
    }
}