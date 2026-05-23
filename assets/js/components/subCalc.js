function initSubCalc() {
    const freqInput = document.getElementById('subcalc-freq');
    const tempInput = document.getElementById('subcalc-temp');
    const cDepthInput = document.getElementById('c-depth-input');
    const presetBtns = document.querySelectorAll('.subcalc-preset-btn');
    const unitBtn = document.getElementById('btn-subcalc-unit');
    const cTabs = document.querySelectorAll('.c-tab');
    
    if (!freqInput || !tempInput) return;

    let currentCardioid = 'gradient'; // gradient, csa, lac

    function syncUI() {
        if (window.globalUnitSystem === 'metric') {
            unitBtn.innerHTML = '<span class="material-symbols-outlined">straighten</span> USE IMPERIAL (FT/°F)';
        } else {
            unitBtn.innerHTML = '<span class="material-symbols-outlined">straighten</span> USE METRIC (M/°C)';
        }
        updateCalculations();
    }

    function updateCalculations(skipCloudSave = false) {
        const isMetric = window.globalUnitSystem === 'metric';
        let f = parseFloat(freqInput.value);
        let t = parseFloat(tempInput.value);
        if (isNaN(f) || f <= 0) f = 100;
        if (isNaN(t)) t = isMetric ? 20 : 68;

        // Speed of Sound
        let c_ms = 0;
        if (isMetric) {
            c_ms = window.AudioCalcs.calcSpeedOfSound(t); // m/s
        } else {
            let t_c = (t - 32) * 5/9;
            c_ms = window.AudioCalcs.calcSpeedOfSound(t_c); // still m/s internally
        }
        
        let displaySpeed = isMetric ? c_ms : (c_ms * 3.28084);
        
        document.getElementById('subcalc-speed-val').textContent = displaySpeed.toFixed(1);
        document.getElementById('subcalc-freq-label').textContent = f + " HZ";

        // Wavelengths
        let lambda_m = window.AudioCalcs.calcWavelength(c_ms, f);
        let unit_mult = isMetric ? 1 : 3.28084;

        let w1_8 = (lambda_m / 8) * unit_mult;
        let w1_4 = (lambda_m / 4) * unit_mult;
        let w1_2 = (lambda_m / 2) * unit_mult;
        let w1   = lambda_m * unit_mult;

        document.getElementById('wave-1-8').textContent = w1_8.toFixed(3);
        document.getElementById('wave-1-4').textContent = w1_4.toFixed(3);
        document.getElementById('wave-1-2').textContent = w1_2.toFixed(3);
        document.getElementById('wave-1').textContent = w1.toFixed(3);

        // Cardioid Logic based on currentCardioid tab
        let cardioidDelayMs = 0;
        let cardioidSpaceM = 0;

        if (currentCardioid === 'gradient') {
            const grad = window.AudioCalcs.calcCardioidGradient(c_ms, f);
            cardioidSpaceM = grad.spacing;
            cardioidDelayMs = grad.delayMs;
            document.getElementById('cardioid-space').textContent = (cardioidSpaceM * unit_mult).toFixed(3);
        } else {
            let depthRaw = parseFloat(cDepthInput.value) || (isMetric ? 0.8 : 2.6);
            let depthM = isMetric ? depthRaw : (depthRaw / 3.28084);
            cardioidDelayMs = window.AudioCalcs.calcCardioidPhysicalDepth(c_ms, depthM).delayMs;
        }
        
        document.getElementById('cardioid-delay').textContent = cardioidDelayMs.toFixed(1);

        // End-Fire (1/4 lambda spacing)
        const endFire = window.AudioCalcs.calcEndFire(c_ms, f);
        document.getElementById('endfire-space').textContent = w1_4.toFixed(3);
        document.getElementById('endfire-delay').textContent = endFire.delayMs.toFixed(1);

        // Broadside
        const broadside = window.AudioCalcs.calcBroadside(c_ms, f);
        document.getElementById('broadside-half').textContent = (broadside.half * unit_mult).toFixed(3);
        document.getElementById('broadside-two-third').textContent = (broadside.twoThirds * unit_mult).toFixed(3);

        // --- Trigger Cloud Save ---
        if (!skipCloudSave) {
            saveConfigToCloud('subcalc', { 
                freq: f, 
                temp: t, 
                depth: cDepthInput.value,
                cardioidType: currentCardioid
            });
        }

        // --- SVG ANIMATIONS ---
        let spacingPx = Math.max(15, Math.min(80, (lambda_m / 4) * 20)); 

        if (currentCardioid === 'gradient') {
            let cSub1 = document.getElementById('svg-c-sub1'); 
            let cSub2 = document.getElementById('svg-c-sub2'); 
            let cLine = document.getElementById('svg-c-line'); 
            if (cSub1 && cSub2 && cLine) {
                let cx = 100 - (spacingPx / 2);
                cSub1.setAttribute('transform', `translate(${cx}, 40)`);
                cSub2.setAttribute('transform', `translate(${cx + spacingPx}, 40)`);
                cLine.setAttribute('x1', cx);
                cLine.setAttribute('x2', cx + spacingPx);
            }
        }

        // End-Fire Animation (Subs spread out)
        let eLine1 = document.getElementById('svg-e-line1');
        let eLine2 = document.getElementById('svg-e-line2');
        let eLine3 = document.getElementById('svg-e-line3');
        if (eLine1) {
            let startX = 100 - (spacingPx * 1.5);
            for(let i=1; i<=4; i++) {
                let sub = document.getElementById(`svg-e-sub${i}`);
                if (sub) sub.setAttribute('transform', `translate(${startX + (spacingPx * (i-1))}, 40)`);
            }
            eLine1.setAttribute('x1', startX); eLine1.setAttribute('x2', startX + spacingPx);
            eLine2.setAttribute('x1', startX + spacingPx); eLine2.setAttribute('x2', startX + spacingPx*2);
            eLine3.setAttribute('x1', startX + spacingPx*2); eLine3.setAttribute('x2', startX + spacingPx*3);
        }

        // Broadside Animation (Max spacing 1/2 lambda) - Vertical layout
        // Wavelengths are typically 2.8m (120Hz) to 11.4m (30Hz).
        // lambda/2 is 1.4m to 5.7m. Multiplying by 12 gives ~16px to ~68px. Clamp to 24-48px.
        let bSpacingPx = Math.max(24, Math.min(48, (lambda_m / 2) * 12));
        let bLine1 = document.getElementById('svg-b-line1');
        let bLine2 = document.getElementById('svg-b-line2');
        if (bLine1) {
            let bCenterY = 60;
            let sub1Y = bCenterY - bSpacingPx;
            let sub2Y = bCenterY;
            let sub3Y = bCenterY + bSpacingPx;
            
            let sub1 = document.getElementById('svg-b-sub1');
            let sub2 = document.getElementById('svg-b-sub2');
            let sub3 = document.getElementById('svg-b-sub3');

            if (sub1) sub1.setAttribute('transform', `translate(80, ${sub1Y})`);
            if (sub2) sub2.setAttribute('transform', `translate(80, ${sub2Y})`);
            if (sub3) sub3.setAttribute('transform', `translate(80, ${sub3Y})`);
            
            bLine1.setAttribute('y1', sub1Y); bLine1.setAttribute('y2', sub2Y);
            bLine2.setAttribute('y1', sub2Y); bLine2.setAttribute('y2', sub3Y);
        }
    }

    freqInput.addEventListener('input', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        updateCalculations();
    });

    tempInput.addEventListener('input', updateCalculations);
    if(cDepthInput) cDepthInput.addEventListener('input', updateCalculations);

    cTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            cTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCardioid = tab.getAttribute('data-ctype');

            const title = document.getElementById('c-title-text');
            const desc = document.getElementById('c-desc-text');
            const depthGroup = document.getElementById('c-depth-input-group');
            const spacingStat = document.getElementById('c-spacing-stat');
            
            const svgG = document.getElementById('svg-c-gradient');
            const svgC = document.getElementById('svg-c-csa');
            const svgL = document.getElementById('svg-c-lac');

            svgG.style.display = 'none';
            svgC.style.display = 'none';
            svgL.style.display = 'none';

            if (currentCardioid === 'gradient') {
                title.textContent = "Cardioid (Gradient)";
                desc.textContent = "Horizontal deployment. Rear sub inverted + delayed by ¼λ travel time.";
                depthGroup.style.display = "none";
                spacingStat.style.display = "flex";
                svgG.style.display = "block";
            } else if (currentCardioid === 'csa') {
                title.textContent = "d&b CSA (3-Box)";
                desc.textContent = "Same plane deployment. Middle sub inverted + delayed by cabinet depth.";
                depthGroup.style.display = "block";
                spacingStat.style.display = "none";
                svgC.style.display = "block";
            } else if (currentCardioid === 'lac') {
                title.textContent = "L-Acoustics Block (4-Box)";
                desc.textContent = "Same plane deployment. Bottom-rear inverted + delayed by cabinet depth.";
                depthGroup.style.display = "block";
                spacingStat.style.display = "none";
                svgL.style.display = "block";
            }

            updateCalculations();
        });
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            freqInput.value = btn.getAttribute('data-freq');
            updateCalculations();
        });
    });

    unitBtn.addEventListener('click', () => {
        const nextSystem = window.globalUnitSystem === 'metric' ? 'imperial' : 'metric';
        window.globalUnitSystem = nextSystem;
        safeStorage.setItem('soundengg-units', nextSystem);
        
        const globalSelect = document.getElementById('global-unit-select');
        if (globalSelect) globalSelect.value = nextSystem;

        document.dispatchEvent(new CustomEvent('unitsChanged'));
    });

    document.addEventListener('unitsChanged', () => {
        const isMetric = window.globalUnitSystem === 'metric';
        
        // Update labels
        document.getElementById('subcalc-temp-unit').textContent = isMetric ? "°C" : "°F";
        document.getElementById('subcalc-speed-unit').textContent = isMetric ? "m/s" : "ft/s";
        document.querySelectorAll('.wave-unit, .su-unit').forEach(el => el.textContent = isMetric ? "m" : "ft");
        
        unitBtn.innerHTML = isMetric 
            ? '<span class="material-symbols-outlined">straighten</span> USE IMPERIAL (FT/°F)'
            : '<span class="material-symbols-outlined">straighten</span> USE METRIC (M/°C)';

        // Convert current temperature input gracefully
        let currentT = parseFloat(tempInput.value);
        if (!isNaN(currentT)) {
            if (isMetric) {
                tempInput.value = Math.round((currentT - 32) * 5/9);
            } else {
                tempInput.value = Math.round((currentT * 9/5) + 32);
            }
        }

        // Convert cabinet depth gracefully
        let currentD = parseFloat(cDepthInput.value);
        if (!isNaN(currentD)) {
            if (isMetric) {
                cDepthInput.value = (currentD / 3.28084).toFixed(1);
            } else {
                cDepthInput.value = (currentD * 3.28084).toFixed(1);
            }
        }
        
        syncUI();
        pull();
    });

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
                .eq('config_type', 'subcalc')
                .maybeSingle();

            if (data && data.data) {
                freqInput.value = data.data.freq;
                tempInput.value = data.data.temp;
                if(cDepthInput) cDepthInput.value = data.data.depth || (window.globalUnitSystem === 'metric' ? 0.8 : 2.6);
                currentCardioid = data.data.cardioidType || 'gradient';
                
                const activeTab = Array.from(cTabs).find(t => t.getAttribute('data-ctype') === currentCardioid);
                if (activeTab) activeTab.click();
                
                updateCalculations(true); 
            }
        } catch (err) {
            console.error('Cloud Pull Error (SubCalc):', err);
        }
    }

    syncUI();
    pull();

    document.addEventListener('authSuccess', pull);
}