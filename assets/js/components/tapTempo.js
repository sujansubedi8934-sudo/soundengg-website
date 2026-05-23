function initTapTempoDelay() {
    const btnTrigger = document.getElementById('btn-tap-delay-trigger');
    const btnReset = document.getElementById('btn-tap-delay-reset');
    const bpmDisplay = document.getElementById('tap-delay-bpm-display');
    const statusText = document.getElementById('tap-delay-status');

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

    if (!btnTrigger) return;

    // 1. Tapping Trigger click listener
    btnTrigger.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        
        // Push micro tactile animation
        btnTrigger.style.transform = 'scale(0.95)';
        setTimeout(() => { btnTrigger.style.transform = 'scale(1)'; }, 50);

        const now = Date.now();
        
        // Filter out taps older than 2.0 seconds to support auto-resetting
        tapTimes = tapTimes.filter(t => now - t < 2000);
        tapTimes.push(now);

        if (tapTimes.length < 2) {
            statusText.textContent = `TAP AGAIN TO MEASURE...`;
            bpmDisplay.textContent = '---';
            return;
        }

        // Calculate rolling interval average
        let intervals = [];
        for (let i = 1; i < tapTimes.length; i++) {
            intervals.push(tapTimes[i] - tapTimes[i - 1]);
        }
        
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = Math.round(60000 / avg);

        // Clamp validation to standard musical tempos
        if (bpm >= 30 && bpm <= 300) {
            bpmDisplay.textContent = `${bpm} BPM`;
            statusText.textContent = `LISTENING... (TAPS: ${tapTimes.length})`;

            // Output precise subdivisions
            if (sub2x) sub2x.innerHTML = `${Math.round(2 * avg)} <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
            if (sub1x) sub1x.innerHTML = `${Math.round(avg)} <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
            if (subHalf) subHalf.innerHTML = `${Math.round(avg / 2)} <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
            if (subQuarter) subQuarter.innerHTML = `${Math.round(avg / 4)} <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
            if (subEighth) subEighth.innerHTML = `${Math.round(avg / 8)} <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;

            // Active visual pulse sync
            if (blinkInterval) clearInterval(blinkInterval);
            let active = true;
            blinkInterval = setInterval(() => {
                fills.forEach(f => {
                    f.style.opacity = active ? '0.2' : '0';
                });
                active = !active;
            }, avg / 2);
        }
    });

    // 2. Reset Trigger
    btnReset.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        
        tapTimes = [];
        if (blinkInterval) {
            clearInterval(blinkInterval);
            blinkInterval = null;
        }

        bpmDisplay.textContent = '---';
        statusText.textContent = 'TAP BUTTON TO START CALCULATING';

        if (sub2x) sub2x.innerHTML = `--- <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (sub1x) sub1x.innerHTML = `--- <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (subHalf) subHalf.innerHTML = `--- <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (subQuarter) subQuarter.innerHTML = `--- <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;
        if (subEighth) subEighth.innerHTML = `--- <span style="font-size: 0.9rem; color: var(--text-dim);">ms</span>`;

        fills.forEach(f => { f.style.opacity = '0'; });
    });

    // 3. Clipboard helper integration
    const copyButtons = document.querySelectorAll('.btn-copy-delay');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const numeric = parseInt(targetEl.textContent, 10);
                if (!isNaN(numeric)) {
                    navigator.clipboard.writeText(numeric.toString()).then(() => {
                        const original = btn.innerHTML;
                        btn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 14px; color: var(--primary);">check</span> COPIED`;
                        setTimeout(() => { btn.innerHTML = original; }, 1200);
                    });
                }
            }
        });
    });
}