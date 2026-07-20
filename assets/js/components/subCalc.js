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
        let w1_6 = (lambda_m / 6) * unit_mult;
        let w1_4 = (lambda_m / 4) * unit_mult;
        let w1_3 = (lambda_m / 3) * unit_mult;
        let w1_2 = (lambda_m / 2) * unit_mult;
        let w1   = lambda_m * unit_mult;

        document.getElementById('wave-1-8').textContent = w1_8.toFixed(3);
        document.getElementById('wave-1-6').textContent = w1_6.toFixed(3);
        document.getElementById('wave-1-4').textContent = w1_4.toFixed(3);
        document.getElementById('wave-1-3').textContent = w1_3.toFixed(3);
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
            const activeMasterTabBtn = document.querySelector('.subcalc-master-tab.active');
            const activeMaster = activeMasterTabBtn ? activeMasterTabBtn.getAttribute('data-tab') : 'cardioid';
            
            saveConfigToCloud('subcalc', { 
                freq: f, 
                temp: t, 
                depth: cDepthInput.value,
                cardioidType: currentCardioid,
                activeTab: activeMaster
            });

            if (typeof window.trackUsageForRating === 'function') {
                window.trackUsageForRating();
            }
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

    // Frequency Presets expandable dropdown toggle
    const togglePresetsBtn = document.getElementById('btn-toggle-subcalc-presets');
    const presetsDropdown = document.getElementById('subcalc-presets-dropdown');
    if (togglePresetsBtn && presetsDropdown) {
        togglePresetsBtn.addEventListener('click', () => {
            const isCollapsed = presetsDropdown.classList.contains('collapsed');
            if (isCollapsed) {
                presetsDropdown.classList.remove('collapsed');
                presetsDropdown.classList.add('expanded');
                presetsDropdown.style.maxHeight = '200px';
                togglePresetsBtn.querySelector('.chevron-icon').style.transform = 'rotate(180deg)';
            } else {
                presetsDropdown.classList.remove('expanded');
                presetsDropdown.classList.add('collapsed');
                presetsDropdown.style.maxHeight = '0px';
                togglePresetsBtn.querySelector('.chevron-icon').style.transform = 'rotate(0deg)';
            }
        });
    }

    // Collapsible Engineering Insight Card toggle
    const toggleTheoryBtn = document.getElementById('btn-toggle-subcalc-theory');
    const theoryCard = document.getElementById('subcalc-theory-card');
    if (toggleTheoryBtn && theoryCard) {
        toggleTheoryBtn.addEventListener('click', () => {
            const isCollapsed = theoryCard.classList.contains('collapsed');
            if (isCollapsed) {
                theoryCard.classList.remove('collapsed');
                theoryCard.classList.add('expanded');
            } else {
                theoryCard.classList.remove('expanded');
                theoryCard.classList.add('collapsed');
            }
        });
    }

    // Master configuration tab switching
    const masterTabs = document.querySelectorAll('.subcalc-master-tab');
    masterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            masterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');

            // Hide all configuration body sections
            document.getElementById('subcalc-body-cardioid').style.display = 'none';
            document.getElementById('subcalc-body-endfire').style.display = 'none';
            document.getElementById('subcalc-body-broadside').style.display = 'none';

            // Show targeted body section
            const targetBody = document.getElementById(`subcalc-body-${target}`);
            if (targetBody) {
                targetBody.style.display = 'flex';
            }
            
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

                // Restore master tab
                const savedMaster = data.data.activeTab || 'cardioid';
                const masterTabBtn = Array.from(document.querySelectorAll('.subcalc-master-tab')).find(t => t.getAttribute('data-tab') === savedMaster);
                if (masterTabBtn) {
                    masterTabBtn.click();
                } else {
                    updateCalculations(true);
                }
            }
        } catch (err) {
            console.error('Cloud Pull Error (SubCalc):', err);
        }
    }

    // --- Share Button Event Handler ---
    const btnShareSub = document.getElementById('btn-share-subcalc');
    if (btnShareSub) {
        btnShareSub.addEventListener('click', (e) => {
            e.preventDefault();
            const f = freqInput.value;
            const t = tempInput.value;
            const d = cDepthInput ? cDepthInput.value : '';
            const activeMasterTabBtn = document.querySelector('.subcalc-master-tab.active');
            const activeMaster = activeMasterTabBtn ? activeMasterTabBtn.getAttribute('data-tab') : 'cardioid';
            
            const shareUrl = `${window.location.origin}${window.location.pathname}?view=subcalc&freq=${f}&temp=${t}&depth=${d}&type=${currentCardioid}&tab=${activeMaster}`;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    if (typeof window.showSoundEnggToast === 'function') {
                        window.showSoundEnggToast('Subwoofer configuration copied to clipboard!');
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

    // --- Process Shared URL Link on Load ---
    if (viewParam === 'subcalc') {
        const freqQ = urlParams.get('freq');
        const tempQ = urlParams.get('temp');
        const depthQ = urlParams.get('depth');
        const typeQ = urlParams.get('type');
        const tabQ = urlParams.get('tab');
        
        if (freqQ) freqInput.value = parseInt(freqQ);
        if (tempQ) tempInput.value = parseFloat(tempQ);
        if (depthQ && cDepthInput) cDepthInput.value = parseFloat(depthQ);
        if (typeQ) {
            currentCardioid = typeQ;
            const activeTab = Array.from(cTabs).find(t => t.getAttribute('data-ctype') === currentCardioid);
            if (activeTab) {
                cTabs.forEach(t => t.classList.remove('active'));
                activeTab.classList.add('active');
            }
        }
        if (tabQ) {
            const masterTabBtn = Array.from(document.querySelectorAll('.subcalc-master-tab')).find(t => t.getAttribute('data-tab') === tabQ);
            if (masterTabBtn) {
                masterTabBtn.click();
            }
        }
    }

    syncUI();
    if (viewParam !== 'subcalc') {
        pull();
    } else {
        updateCalculations(true);
    }

    document.addEventListener('authSuccess', pull);
}