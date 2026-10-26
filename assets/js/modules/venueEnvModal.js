// =========================================================================
// VENUE ENVIRONMENT & GLOBAL AUDIO ROUTING MODULE (venueEnvModal.js)
// Extracted from assets/js/main.js — 100% identical runtime behavior
// =========================================================================

// --- iOS/iPadOS AudioSession configuration for Web Tools ---
(function() {
    // On native iOS Capacitor, AudioSessionPlugin.swift configures AVAudioSession (.playAndRecord + .measurement at 48kHz).
    // Setting navigator.audioSession.type = 'play-and-record' in WKWebView triggers WebKit's VoiceChat (16kHz / 8kHz cutoff) mode!
    const isNativeCapacitor = !!(window.Capacitor && (window.Capacitor.isNative || (typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform())));
    if (typeof navigator !== 'undefined' && navigator.audioSession) {
        try {
            navigator.audioSession.type = isNativeCapacitor ? 'auto' : 'play-and-record';
        } catch (e) {
            console.warn("Failed to set navigator.audioSession.type:", e);
        }
    }
})();

// --- AUDIO CONTEXT INTERCEPTOR (Dynamic Output Routing) ---
window.activeAudioContexts = window.activeAudioContexts || [];
(function() {
    const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
    if (OriginalAudioContext) {
        class InterceptedAudioContext extends OriginalAudioContext {
            constructor(...args) {
                // Apply active output sink via constructor options if supported
                const savedOutput = safeStorage.getItem('soundengg-output-id') || 'default';
                if (savedOutput && savedOutput !== 'default') {
                    if (!args[0]) args[0] = {};
                    if (typeof args[0] === 'object') {
                        args[0].sinkId = savedOutput;
                    }
                }
                
                super(...args);
                window.activeAudioContexts.push(this);
                
                // Add statechange listener to apply sink ID as soon as context becomes running
                this.addEventListener('statechange', () => {
                    if (this.state === 'running') {
                        // Safe small delay to let browser audio threads transition state fully
                        setTimeout(async () => {
                            const activeOutput = safeStorage.getItem('soundengg-output-id') || 'default';
                            if (activeOutput && activeOutput !== 'default' && typeof this.setSinkId === 'function') {
                                try {
                                    await this.setSinkId(activeOutput);
                                    console.log(`Audio output successfully applied on statechange: ${activeOutput}`);
                                } catch (err) {
                                    console.warn("Failed to apply initial setSinkId to AudioContext on statechange:", err);
                                }
                            }
                        }, 100);
                    }
                });
                
                // Keep the minor delayed fallback in constructor
                if (savedOutput && savedOutput !== 'default' && typeof this.setSinkId === 'function') {
                    setTimeout(() => {
                        if (this.state !== 'closed') {
                            this.setSinkId(savedOutput).catch(err => {
                                console.warn("Failed to apply initial setSinkId to AudioContext:", err);
                            });
                        }
                    }, 100);
                }
            }

            // Override resume to explicitly apply and await the output device when transitioning out of suspended
            async resume() {
                await super.resume();
                // Safe small delay to let browser audio threads transition state fully
                await new Promise(resolve => setTimeout(resolve, 100));
                const savedOutput = safeStorage.getItem('soundengg-output-id') || 'default';
                if (savedOutput && savedOutput !== 'default' && typeof this.setSinkId === 'function') {
                    try {
                        await this.setSinkId(savedOutput);
                        console.log(`Audio output successfully applied on resume: ${savedOutput}`);
                    } catch (err) {
                        console.warn("Failed to apply sink ID in overridden resume:", err);
                    }
                }
            }
        }
        // Override global constructors
        if (window.AudioContext) window.AudioContext = InterceptedAudioContext;
        if (window.webkitAudioContext) window.webkitAudioContext = InterceptedAudioContext;
    }
})();

// --- GLOBAL AUDIO ROUTING MANAGER & STATE SYNC ---
window.populateAllAudioDevices = async function() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        // 1. Inputs
        const inputs = devices.filter(d => d.kind === 'audioinput');
        const inputOptions = '<option value="default">Default System Microphone</option>' +
            inputs.map(d => `<option value="${d.deviceId}">${d.label || 'Input ' + d.deviceId.slice(0,4)}</option>`).join('');
            
        // 2. Outputs
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        const outputOptions = '<option value="default">Default System Speaker</option>' +
            outputs.map(d => `<option value="${d.deviceId}">${d.label || 'Output ' + d.deviceId.slice(0,4)}</option>`).join('');
            
        // Populate inputs
        const globalMic = document.getElementById('global-mic-select');
        const rtaInput = document.getElementById('rta-input-select');
        if (globalMic) {
            globalMic.innerHTML = inputOptions;
            const savedMic = safeStorage.getItem('soundengg-mic-id') || 'default';
            globalMic.value = savedMic;
        }
        if (rtaInput) {
            rtaInput.innerHTML = inputs.map(d => `<option value="${d.deviceId}">${d.label || 'Input ' + d.deviceId.slice(0,4)}</option>`).join('');
            const savedMic = safeStorage.getItem('soundengg-mic-id') || 'default';
            if (savedMic && savedMic !== 'default') {
                rtaInput.value = savedMic;
            } else if (inputs.length > 0) {
                rtaInput.value = inputs[0].deviceId;
            }
        }
        
        // Populate outputs
        const globalOutput = document.getElementById('global-output-select');
        const rtaOutput = document.getElementById('rta-output-select');
        const supportsSinkId = ('setSinkId' in AudioContext.prototype || 'setSinkId' in HTMLMediaElement.prototype);
        
        if (globalOutput) {
            globalOutput.innerHTML = outputOptions;
            const savedOutput = safeStorage.getItem('soundengg-output-id') || 'default';
            globalOutput.value = savedOutput;
            globalOutput.disabled = false;
            globalOutput.style.opacity = '1';
            globalOutput.style.cursor = 'pointer';
            const warningBox = document.getElementById('safari-output-warning');
            if (warningBox) {
                warningBox.style.display = 'none';
            }
        }
        if (rtaOutput) {
            rtaOutput.innerHTML = outputOptions;
            const savedOutput = safeStorage.getItem('soundengg-output-id') || 'default';
            rtaOutput.value = savedOutput;
            rtaOutput.disabled = false;
            rtaOutput.style.opacity = '1';
            rtaOutput.style.cursor = 'pointer';

            const outBadge = document.getElementById('rta-output-badge');
            if (outBadge && rtaOutput.selectedIndex >= 0) {
                const activeOpt = rtaOutput.options[rtaOutput.selectedIndex];
                outBadge.textContent = activeOpt ? (activeOpt.text.length > 18 ? activeOpt.text.slice(0, 16) + '...' : activeOpt.text).toUpperCase() : 'SPEAKER';
            }
        }
    } catch (e) {
        console.error("Device enumeration failed", e);
    }
};

// Wire device change listener to auto-refresh devices
if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
    navigator.mediaDevices.addEventListener('devicechange', () => {
        console.log("Audio hardware configuration changed, refreshing dropdowns...");
        window.populateAllAudioDevices();
    });
}


// --- GLOBAL VENUE ENVIRONMENT STATE (Units + Temperature) ---
(function initGlobalVenueState() {
    const savedDistUnit = safeStorage.getItem('soundengg-units');
    window.globalUnitSystem = (savedDistUnit === 'imperial' || savedDistUnit === 'metric') ? savedDistUnit : 'metric';

    const savedTempUnit = safeStorage.getItem('soundengg-temp-unit');
    window.globalTempUnit = (savedTempUnit === 'F' || savedTempUnit === 'C') ? savedTempUnit : 'C';

    const savedTempC = parseFloat(safeStorage.getItem('soundengg-temp-c'));
    window.globalTempC = (!isNaN(savedTempC) && savedTempC >= -30 && savedTempC <= 65) ? savedTempC : 22.0;

    window.getGlobalSpeedOfSoundMS = function() {
        const c = Number(window.globalTempC);
        const validC = (!isNaN(c) && c >= -30 && c <= 65) ? c : 22.0;
        return 331.3 + (0.606 * validC);
    };
})();

function initGlobalUnits() {
    const btnUnit = document.getElementById('btn-delaycalc-unit');
    const modal = document.getElementById('venue-env-modal');
    const btnClose = document.getElementById('btn-close-venue-env');
    const btnConfirm = document.getElementById('btn-confirm-venue-env');
    const btnDistMetric = document.getElementById('btn-env-dist-metric');
    const btnDistImperial = document.getElementById('btn-env-dist-imperial');
    const btnTempC = document.getElementById('btn-env-temp-c');
    const btnTempF = document.getElementById('btn-env-temp-f');
    const tempInput = document.getElementById('venue-env-temp-input');
    const tempSuffix = document.getElementById('venue-env-temp-unit-suffix');
    const tempAltLabel = document.getElementById('venue-env-temp-alt-label');
    const btnTempDec = document.getElementById('btn-env-temp-dec');
    const btnTempInc = document.getElementById('btn-env-temp-inc');
    const speedPreview = document.getElementById('venue-env-speed-preview');
    const supportBox = document.getElementById('venue-env-support-box');
    const btnSupportAd = document.getElementById('btn-venue-support-ad');
    const btnBuyPro = document.getElementById('btn-venue-buy-pro');

    let draftDistUnit = window.globalUnitSystem || 'metric';
    let draftTempUnit = window.globalTempUnit || 'C';
    let draftTempC = typeof window.globalTempC === 'number' ? window.globalTempC : 22.0;

    function cToF(c) { return (c * 9 / 5) + 32; }
    function fToC(f) { return (f - 32) * 5 / 9; }

    window.syncVenueEnvUI = function() {
        const distUnit = window.globalUnitSystem || 'metric';
        const tempUnit = window.globalTempUnit || 'C';
        const tempC = typeof window.globalTempC === 'number' ? window.globalTempC : 22.0;
        const speedMS = 331.3 + (0.606 * tempC);
        const speedFtS = speedMS * 3.28084;

        const displayTemp = tempUnit === 'F' ? `${cToF(tempC).toFixed(1)}°F` : `${tempC.toFixed(1)}°C`;
        const shortUnit = distUnit === 'imperial' ? 'ft' : 'm';
        const pillText = `${displayTemp} • ${shortUnit}`;

        const mobPillText = document.getElementById('mobile-env-pill-text');
        const deskPillText = document.getElementById('desktop-env-pill-text');
        if (mobPillText) mobPillText.textContent = pillText;
        if (deskPillText) deskPillText.textContent = pillText;

        const delaySumTemp = document.getElementById('delay-env-summary-temp');
        const delaySumUnit = document.getElementById('delay-env-summary-unit');
        const delaySumSpeed = document.getElementById('delay-env-summary-speed');
        const fullUnitLabel = distUnit === 'imperial' ? 'FEET (ft)' : 'METERS (m)';
        const speedLabel = distUnit === 'imperial'
            ? `c = ${speedFtS.toFixed(1)} ft/s`
            : `c = ${speedMS.toFixed(1)} m/s`;
        if (delaySumTemp) delaySumTemp.textContent = displayTemp;
        if (delaySumUnit) delaySumUnit.textContent = fullUnitLabel;
        if (delaySumSpeed) delaySumSpeed.textContent = speedLabel;

        const dashSumTemp = document.getElementById('dash-env-summary-temp');
        const dashSumUnit = document.getElementById('dash-env-summary-unit');
        const dashSumSpeed = document.getElementById('dash-env-summary-speed');
        if (dashSumTemp) dashSumTemp.textContent = displayTemp;
        if (dashSumUnit) dashSumUnit.textContent = fullUnitLabel;
        if (dashSumSpeed) dashSumSpeed.textContent = speedLabel;

        const rtaDrawerEnvText = document.getElementById('rta-drawer-env-text');
        if (rtaDrawerEnvText) {
            const shortSpeed = distUnit === 'imperial' ? `${speedFtS.toFixed(1)} ft/s` : `${speedMS.toFixed(1)} m/s`;
            rtaDrawerEnvText.textContent = `${displayTemp} • ${distUnit === 'imperial' ? 'FEET' : 'METERS'} • ${shortSpeed}`;
        }

        if (btnUnit) {
            if (distUnit === 'metric') {
                btnUnit.dataset.unit = 'metric';
                btnUnit.innerHTML = '<span class="material-symbols-outlined">straighten</span> USE IMPERIAL (FT/°F)';
            } else {
                btnUnit.dataset.unit = 'imperial';
                btnUnit.innerHTML = '<span class="material-symbols-outlined">straighten</span> USE METRIC (M/°C)';
            }
        }

        if (window.TransferFunctionEngine) {
            window.TransferFunctionEngine.temperatureC = tempC;
        }
    };

    function renderModalDraft() {
        if (!modal) return;
        const activeStyle = 'background: rgba(0, 240, 255, 0.18); border: 1px solid var(--primary); color: var(--primary); box-shadow: 0 0 12px rgba(0, 240, 255, 0.2);';
        const inactiveStyle = 'background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); color: var(--text-muted); box-shadow: none;';

        if (btnDistMetric && btnDistImperial) {
            btnDistMetric.style.cssText += ';' + (draftDistUnit === 'metric' ? activeStyle : inactiveStyle);
            btnDistImperial.style.cssText += ';' + (draftDistUnit === 'imperial' ? activeStyle : inactiveStyle);
        }
        if (btnTempC && btnTempF) {
            btnTempC.style.cssText += ';' + (draftTempUnit === 'C' ? activeStyle : inactiveStyle);
            btnTempF.style.cssText += ';' + (draftTempUnit === 'F' ? activeStyle : inactiveStyle);
        }

        if (tempSuffix) tempSuffix.textContent = `°${draftTempUnit}`;
        if (tempInput && document.activeElement !== tempInput) {
            const shownVal = draftTempUnit === 'F' ? cToF(draftTempC) : draftTempC;
            tempInput.value = shownVal.toFixed(1);
        }
        if (tempAltLabel) {
            tempAltLabel.textContent = draftTempUnit === 'F'
                ? `= ${draftTempC.toFixed(1)}°C`
                : `= ${cToF(draftTempC).toFixed(1)}°F`;
        }

        const speedMS = 331.3 + (0.606 * draftTempC);
        const speedFtS = speedMS * 3.28084;
        if (speedPreview) {
            speedPreview.textContent = `${speedMS.toFixed(1)} m/s • ${speedFtS.toFixed(1)} ft/s`;
        }

        if (supportBox) {
            const isPro = window.isUserPro || (typeof window.isPremiumActive === 'function' && window.isPremiumActive());
            supportBox.style.display = isPro ? 'none' : 'flex';
        }
    }

    function readDraftInputTemp() {
        if (tempInput) {
            const raw = parseFloat(tempInput.value);
            if (!isNaN(raw)) {
                draftTempC = draftTempUnit === 'F' ? fToC(raw) : raw;
                draftTempC = Math.max(-30, Math.min(65, draftTempC));
            }
        }
    }

    window.openVenueEnvModal = function() {
        draftDistUnit = window.globalUnitSystem || 'metric';
        draftTempUnit = window.globalTempUnit || 'C';
        draftTempC = typeof window.globalTempC === 'number' ? window.globalTempC : 22.0;
        renderModalDraft();
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.removeProperty('display');
            document.body.classList.add('modal-open');
        }
        // Preload interstitial immediately so if user presses "SUPPORT (1 AD)", it is ready to serve with 0 lag
        if (window.isNativeMobile && window.isNativeMobile() && typeof window.preloadNativeInterstitialAd === 'function') {
            window.preloadNativeInterstitialAd();
        }
    };

    window.closeVenueEnvModal = function() {
        if (modal) {
            modal.classList.add('hidden');
            modal.style.setProperty('display', 'none', 'important');
            document.body.classList.remove('modal-open');
        }
    };

    window.applyGlobalVenueEnvironment = function(distUnit, tempUnit, tempC, silent = false) {
        const cleanDist = distUnit === 'imperial' ? 'imperial' : 'metric';
        const cleanTempUnit = tempUnit === 'F' ? 'F' : 'C';
        const cleanTempC = Math.max(-30, Math.min(65, isNaN(tempC) ? 22.0 : tempC));

        window.globalUnitSystem = cleanDist;
        window.globalTempUnit = cleanTempUnit;
        window.globalTempC = cleanTempC;

        safeStorage.setItem('soundengg-units', cleanDist);
        safeStorage.setItem('soundengg-temp-unit', cleanTempUnit);
        safeStorage.setItem('soundengg-temp-c', cleanTempC.toFixed(2));
        sessionStorage.setItem('soundengg_venue_env_prompted', '1');

        const unitSelect = document.getElementById('global-unit-select');
        if (unitSelect) unitSelect.value = cleanDist;

        window.syncVenueEnvUI();

        const eventDetail = { distUnit: cleanDist, tempUnit: cleanTempUnit, tempC: cleanTempC };
        document.dispatchEvent(new CustomEvent('unitsChanged', { detail: eventDetail }));
        document.dispatchEvent(new CustomEvent('venueEnvChanged', { detail: eventDetail }));

        if (!silent && typeof window.showToast === 'function') {
            const speedMS = 331.3 + (0.606 * cleanTempC);
            const speedStr = cleanDist === 'imperial'
                ? `${(speedMS * 3.28084).toFixed(1)} ft/s`
                : `${speedMS.toFixed(1)} m/s`;
            const tempStr = cleanTempUnit === 'F'
                ? `${cToF(cleanTempC).toFixed(1)}°F`
                : `${cleanTempC.toFixed(1)}°C`;
            const unitStr = cleanDist === 'imperial' ? 'Feet (ft)' : 'Meters (m)';
            window.showToast(`Venue Set: ${tempStr} • ${unitStr} (${speedStr})`);
        }
    };

    if (btnDistMetric) {
        btnDistMetric.addEventListener('click', () => {
            draftDistUnit = 'metric';
            renderModalDraft();
        });
    }
    if (btnDistImperial) {
        btnDistImperial.addEventListener('click', () => {
            draftDistUnit = 'imperial';
            renderModalDraft();
        });
    }
    if (btnTempC) {
        btnTempC.addEventListener('click', () => {
            draftTempUnit = 'C';
            if (tempInput) tempInput.value = draftTempC.toFixed(1);
            renderModalDraft();
        });
    }
    if (btnTempF) {
        btnTempF.addEventListener('click', () => {
            draftTempUnit = 'F';
            if (tempInput) tempInput.value = cToF(draftTempC).toFixed(1);
            renderModalDraft();
        });
    }
    if (tempInput) {
        tempInput.addEventListener('input', () => {
            const raw = parseFloat(tempInput.value);
            if (!isNaN(raw)) {
                draftTempC = draftTempUnit === 'F' ? fToC(raw) : raw;
                draftTempC = Math.max(-30, Math.min(65, draftTempC));
                renderModalDraft();
            }
        });
    }
    if (btnTempDec) {
        btnTempDec.addEventListener('click', () => {
            if (draftTempUnit === 'F') {
                const nextF = cToF(draftTempC) - 1;
                draftTempC = fToC(nextF);
            } else {
                draftTempC -= 1;
            }
            draftTempC = Math.max(-30, Math.min(65, draftTempC));
            if (tempInput) tempInput.value = (draftTempUnit === 'F' ? cToF(draftTempC) : draftTempC).toFixed(1);
            renderModalDraft();
        });
    }
    if (btnTempInc) {
        btnTempInc.addEventListener('click', () => {
            if (draftTempUnit === 'F') {
                const nextF = cToF(draftTempC) + 1;
                draftTempC = fToC(nextF);
            } else {
                draftTempC += 1;
            }
            draftTempC = Math.max(-30, Math.min(65, draftTempC));
            if (tempInput) tempInput.value = (draftTempUnit === 'F' ? cToF(draftTempC) : draftTempC).toFixed(1);
            renderModalDraft();
        });
    }
    if (btnSupportAd) {
        btnSupportAd.addEventListener('click', () => {
            readDraftInputTemp();
            window.applyGlobalVenueEnvironment(draftDistUnit, draftTempUnit, draftTempC, true);
            window.closeVenueEnvModal();

            const thankYouMsg = '❤️ Thank you for supporting SoundEngg! 10 min ad-free tools unlocked.';
            // Condition: When user voluntarily presses "SUPPORT (1 AD)", always serve ad immediately, ignoring any active cooldown period
            if (window.isNativeMobile && window.isNativeMobile() && typeof window.showNativeInterstitialAd === 'function') {
                if (typeof window.showToast === 'function') {
                    window.showToast('Loading ad... Thank you for supporting SoundEngg!');
                }
                window.showNativeInterstitialAd(
                    () => {
                        // Voluntary ad watched: Reward the user with 10 minutes of ad-free cooldown
                        const now = Date.now();
                        safeStorage.setItem('tools_unlocked_until', (now + 10 * 60 * 1000).toString());
                        safeStorage.setItem('tool_switch_count', '0');
                        if (typeof window.showToast === 'function') window.showToast(thankYouMsg);
                    },
                    () => {
                        if (typeof window.showToast === 'function') window.showToast('❤️ Thank you for supporting SoundEngg! Venue settings applied.');
                    }
                );
            } else {
                if (typeof window.showToast === 'function') window.showToast('❤️ Thank you for supporting SoundEngg! Venue settings applied.');
            }
        });
    }
    if (btnBuyPro) {
        btnBuyPro.addEventListener('click', () => {
            readDraftInputTemp();
            window.applyGlobalVenueEnvironment(draftDistUnit, draftTempUnit, draftTempC, true);
            window.closeVenueEnvModal();
            if (typeof window.openPlanSelector === 'function') {
                window.openPlanSelector();
            } else {
                const planSelectorModal = document.getElementById('plan-selector-modal');
                if (planSelectorModal) {
                    if (typeof window.openModal === 'function') {
                        window.openModal(planSelectorModal);
                    } else {
                        planSelectorModal.classList.remove('hidden');
                        planSelectorModal.style.removeProperty('display');
                    }
                } else {
                    window.location.href = 'pro.html';
                }
            }
        });
    }
    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            readDraftInputTemp();
            window.applyGlobalVenueEnvironment(draftDistUnit, draftTempUnit, draftTempC, false);
            window.closeVenueEnvModal();
        });
    }
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            sessionStorage.setItem('soundengg_venue_env_prompted', '1');
            window.closeVenueEnvModal();
        });
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                sessionStorage.setItem('soundengg_venue_env_prompted', '1');
                window.closeVenueEnvModal();
            }
        });
    }

    if (btnUnit) {
        btnUnit.addEventListener('click', () => {
            const nextSystem = window.globalUnitSystem === 'metric' ? 'imperial' : 'metric';
            const nextTempUnit = nextSystem === 'imperial' ? 'F' : 'C';
            window.applyGlobalVenueEnvironment(nextSystem, nextTempUnit, window.globalTempC, false);
        });
    }

    document.addEventListener('unitsChanged', window.syncVenueEnvUI);
    window.syncVenueEnvUI();

    // Prompt once on app launch so the engineer can confirm venue units & temperature right away
    if (!sessionStorage.getItem('soundengg_venue_env_prompted')) {
        setTimeout(() => {
            window.openVenueEnvModal();
        }, 400);
    }
}
window.initGlobalUnits = initGlobalUnits;
