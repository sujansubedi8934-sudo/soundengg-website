function initDelayCalc() {
    const distInput = document.getElementById('delay-dist-mod');
    const distLabel = document.getElementById('label-dist-mod');
    const tempInput = document.getElementById('delay-temp-mod');
    const tempUnitSelect = document.getElementById('delay-temp-unit-mod');
    const outputEl = document.getElementById('delay-output-mod');
    const progressEl = document.getElementById('delay-progress-mod');

    if (!distInput || !tempInput || !outputEl || !progressEl) return;

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

        // Trigger Cloud Save if not just loading
        if (!skipCloudSave) {
            saveConfigToCloud('delay', { dist, temp, tUnit });
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

            if (data && data.data) {
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
    
    // Initial runs
    update(true);
    pull();
    document.addEventListener('authSuccess', pull);
}