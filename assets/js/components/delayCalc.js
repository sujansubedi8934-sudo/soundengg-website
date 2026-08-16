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

    distInput.addEventListener('input', () => update());
    tempInput.addEventListener('input', () => update());
    tempUnitSelect.addEventListener('change', () => update());
    document.addEventListener('unitsChanged', () => update(true));
    
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