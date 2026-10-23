// =========================================================================
// CHECKOUT, PRO UPGRADE, SETTINGS HUB & PLATFORM CONTROLLER (checkoutAndPlatform.js)
// Extracted from assets/js/main.js — 100% identical runtime behavior
// =========================================================================

// --- TOOL HELP MODAL SYSTEM ---
document.addEventListener('DOMContentLoaded', () => {
    const helpModal = document.getElementById('help-modal');
    if (!helpModal) return;

    const btnClose = document.getElementById('close-help-modal');
    const btnUnderstood = document.getElementById('btn-help-understood');
    const modalTitle = document.getElementById('help-modal-title');
    const modalBody = document.getElementById('help-modal-body');
    const helpButtons = document.querySelectorAll('.btn-help');

    const toolHelpData = {
        'delay': {
            title: 'DELAY CALCULATOR',
            content: `
                <h3>What it does</h3>
                <p>Calculates the exact acoustic delay (in milliseconds) required to time-align delay towers or fill speakers with the main PA system.</p>
                <h3>How to use it</h3>
                <ul>
                    <li>Measure the physical distance between the main PA and the delay speaker.</li>
                    <li>Enter the distance and the current venue temperature (sound speed changes with temperature).</li>
                    <li>Input the resulting delay time into your speaker processor or amplifier DSP.</li>
                </ul>
            `
        },
        'pinout': {
            title: 'PINOUT REFERENCE',
            content: `
                <h3>What it does</h3>
                <p>Provides an offline database of standard audio, power, and data connector wiring diagrams.</p>
                <h3>How to use it</h3>
                <ul>
                    <li>Search or scroll for the connector you are wiring (e.g., XLR, Speakon, RJ45).</li>
                    <li>Follow the color-coded pin numbers to solder or terminate your cables correctly on site.</li>
                </ul>
            `
        },
        'siggen': {
            title: 'SIGNAL GENERATOR',
            content: `
                <h3>What it does</h3>
                <p>Generates reference audio signals (Sine waves, Pink Noise, White Noise) for system testing and acoustic calibration.</p>
                <h3>How to use it</h3>
                <ul>
                    <li>Connect your device to the console via an audio interface.</li>
                    <li>Select 'Pink Noise' to tune the PA system using an RTA.</li>
                    <li>Select 'Sine Wave' and dial in a specific frequency to locate rattles, test crossovers, or ring out monitors.</li>
                </ul>
            `
        },
        'rta': {
            title: 'SPECTRUM ANALYZER (RTA)',
            content: `
                <h3>What it does</h3>
                <p>Uses your device's microphone to display a real-time visual representation of the acoustic frequency spectrum in the room.</p>
                <h3>How to use it</h3>
                <ul>
                    <li>Play Pink Noise through the PA system.</li>
                    <li>Watch the RTA bars to identify frequencies that are building up or canceling out in the room.</li>
                    <li>Use your console's graphic EQ to flatten out the major peaks and valleys shown on the screen.</li>
                </ul>
            `
        },
        'eartraining': {
            title: 'EAR TRAINING PRO',
            content: `
                <h3>What it does</h3>
                <p>A training module designed to help you instantly recognize boosted or cut frequencies by ear without looking at a screen.</p>
                <h3>How to use it</h3>
                <ul>
                    <li>Start a session. The app will play a track and apply an EQ boost/cut to a random frequency.</li>
                    <li>Listen carefully and guess which frequency was altered.</li>
                    <li>Consistent practice will make ringing out monitors on stage second nature.</li>
                </ul>
            `
        },
        'impedance': {
            title: 'IMPEDANCE & POWER',
            content: `
                <h3>What it does</h3>
                <p>Calculates combined impedance and delivered power per speaker for Parallel, Series, or Series-Parallel wiring, and recommends the optimal connection mode.</p>
                <h3>How to use it</h3>
                <ul>
                    <li>Input the number of speaker cabinets, their individual impedance, and their power rating (RMS).</li>
                    <li>Input your amplifier's power rating and its test load impedance.</li>
                    <li>Toggle between Connection Modes (Parallel, Series, Series-Parallel) to view live results.</li>
                    <li>Review the color-coded safety rating and optimal connection recommendation at the bottom of the screen.</li>
                </ul>
            `
        },
        'subcalc': {
            title: 'SUB ARRAY CALCULATOR',
            content: `
                <h3>What it does</h3>
                <p>Calculates the physical spacing and electronic delay times required to build directional subwoofer arrays (like Cardioid or End-Fire).</p>
                <h3>How to use it</h3>
                <ul>
                    <li>Select the type of array you want to build to keep bass off the stage.</li>
                    <li>Follow the spacing dimensions provided by the calculator when placing your physical boxes.</li>
                    <li>Apply the suggested delay times to the rear subwoofers in your DSP.</li>
                </ul>
            `
        },
        'tapdelay': {
            title: 'TAP TEMPO DELAY',
            content: `
                <h3>What it does</h3>
                <p>Computes beats per minute (BPM) and provides standard delay subdivisions in milliseconds to align effects processors, delays, and mixing consoles.</p>
                <h3>How to use it</h3>
                <ul>
                    <li>Tap the center button in sync with the song's beat.</li>
                    <li>The system computes the tempo using a rolling average of your taps.</li>
                    <li>Select and copy the desired millisecond subdivision (2x, 1x, 1/2, 1/4, or 1/8) to configure your console or FX processor.</li>
                </ul>
            `
        }
    };

    function openHelpModal(toolId) {
        const data = toolHelpData[toolId];
        if (data) {
            modalTitle.textContent = data.title;
            modalBody.innerHTML = data.content;
            helpModal.classList.remove('hidden');
        }
    }

    function closeHelpModal() {
        helpModal.classList.add('hidden');
    }

    helpButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const toolId = btn.getAttribute('data-tool');
            openHelpModal(toolId);
        });
    });

    if(btnClose) btnClose.addEventListener('click', closeHelpModal);
    if(btnUnderstood) btnUnderstood.addEventListener('click', closeHelpModal);

    // Close on click outside
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            closeHelpModal();
        }
    });
});

// --- SYSTEM SETTINGS HUB ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Selection
    const themeSelect = document.getElementById('global-theme-select');
    if (themeSelect) {
        const savedTheme = safeStorage.getItem('soundengg-theme') || 'theme-cyan';
        themeSelect.value = savedTheme;
        document.body.classList.add(savedTheme);
        
        themeSelect.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            document.body.classList.remove('theme-cyan', 'theme-amber', 'theme-green', 'theme-red');
            document.body.classList.add(newTheme);
            safeStorage.setItem('soundengg-theme', newTheme);
        });
    }

    // 2. Global Units
    const unitSelect = document.getElementById('global-unit-select');
    if (unitSelect) {
        const savedUnit = safeStorage.getItem('soundengg-units') || 'metric';
        unitSelect.value = savedUnit;
        window.globalUnitSystem = savedUnit; // Export globally
        
        unitSelect.addEventListener('change', (e) => {
            const system = e.target.value;
            window.globalUnitSystem = system; 
            safeStorage.setItem('soundengg-units', system);
            document.dispatchEvent(new CustomEvent('unitsChanged'));
        });
    }

    // 3. Audio Routing
    const micSelect = document.getElementById('global-mic-select');
    const outputSelect = document.getElementById('global-output-select');
    const btnRequestMic = document.getElementById('btn-request-mic');
    
    if (outputSelect) {
        outputSelect.disabled = false;
        outputSelect.style.opacity = '1';
        outputSelect.style.cursor = 'pointer';
        const warningBox = document.getElementById('safari-output-warning');
        if (warningBox) {
            warningBox.style.display = 'none';
        }
    }
    
    // Dynamic output sink applier
    window.applyAudioOutput = async function(deviceId) {
        safeStorage.setItem('soundengg-output-id', deviceId);
        if (window.activeAudioContexts) {
            window.activeAudioContexts = window.activeAudioContexts.filter(ctx => ctx && ctx.state !== 'closed');
            for (const ctx of window.activeAudioContexts) {
                if (typeof ctx.setSinkId === 'function') {
                    try {
                        await ctx.setSinkId(deviceId);
                        console.log(`Audio output routed to device ID: ${deviceId}`);
                    } catch (err) {
                        console.error(`Failed to route AudioContext to ${deviceId}:`, err);
                    }
                }
            }
        }
    };

    if (btnRequestMic) {
        btnRequestMic.addEventListener('click', async () => {
            try {
                const audioPlugin = window.Capacitor?.registerPlugin ? window.Capacitor.registerPlugin('AudioSessionPlugin') : window.Capacitor?.Plugins?.AudioSessionPlugin;
                if (audioPlugin && typeof audioPlugin.configureAudioSession === 'function') {
                    try {
                        await audioPlugin.configureAudioSession();
                    } catch (e) {
                        console.warn("AudioSessionPlugin call warning:", e);
                    }
                }
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(t => t.stop());
                btnRequestMic.textContent = 'Access Granted';
                btnRequestMic.style.background = 'linear-gradient(135deg, #059669, #10b981)';
                btnRequestMic.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                btnRequestMic.style.borderColor = '#10b981';
                btnRequestMic.style.color = '#ffffff';
                if (window.populateAllAudioDevices) {
                    await window.populateAllAudioDevices();
                }
            } catch (err) {
                alert('Microphone access denied. ' + err.message);
            }
        });
    }

    if (micSelect) {
        micSelect.addEventListener('change', (e) => {
            safeStorage.setItem('soundengg-mic-id', e.target.value);
            document.dispatchEvent(new CustomEvent('deviceChanged', { detail: e.target.value }));
        });
    }

    if (outputSelect) {
        outputSelect.addEventListener('change', async (e) => {
            const newDeviceId = e.target.value;
            if (window.applyAudioOutput) {
                await window.applyAudioOutput(newDeviceId);
            }
            document.dispatchEvent(new CustomEvent('outputDeviceChanged', { detail: newDeviceId }));
        });
    }

    // Sync input selection changes across panels
    document.addEventListener('deviceChanged', (e) => {
        if (micSelect && micSelect.value !== e.detail) {
            micSelect.value = e.detail;
        }
    });

    // Sync output selection changes across panels
    document.addEventListener('outputDeviceChanged', (e) => {
        if (outputSelect && outputSelect.value !== e.detail) {
            outputSelect.value = e.detail;
        }
    });

    // Initial load
    if (window.populateAllAudioDevices) {
        window.populateAllAudioDevices();
    }
});

// --- GLOBAL PRO UPGRADE MODAL HANDLERS ---
let currentUnlockFeatureKey = null;

document.addEventListener('DOMContentLoaded', () => {
    const proModal = document.getElementById('pro-upgrade-modal');
    const btnClosePro = document.getElementById('btn-close-pro-upgrade');
    const btnLaterPro = document.getElementById('btn-maybe-later-pro');
    
    const PRO_FEATURES_META = {
        'fullscreen': {
            icon: 'fullscreen',
            title: 'Fullscreen Console Mode',
            desc: 'Expand your real-time FFT, phase traces, and RTA spectrum across the entire display without distractions.',
            buttonText: 'WATCH 1 AD (UNLOCK FULLSCREEN FOR SESSION)'
        },
        'pulse_delay': {
            icon: 'bolt',
            title: 'Acoustic Pulse Delay Finder',
            desc: 'Locate speaker arrival time down to 0.05 ms using a calibrated transient ping without blasting loud continuous noise.',
            buttonText: 'WATCH 1 AD (UNLOCK PULSE FINDER FOR SESSION)'
        },
        'spectrogram': {
            icon: 'waterfall_chart',
            title: '60FPS Waterfall Spectrogram',
            desc: 'High-density 3D frequency-time-energy waterfall visualization for tracking room decay, feedback spikes, and reverb tail.',
            buttonText: 'WATCH 1 AD (UNLOCK WATERFALL FOR SESSION)'
        },
        'snapshots': {
            icon: 'camera_alt',
            title: 'Multi-Trace Memory & Overlays',
            desc: 'Capture, store, and overlay up to 4 measurement curves simultaneously to verify system alignment across multiple listening zones.',
            buttonText: 'WATCH 1 AD (UNLOCK MULTI-TRACE FOR SESSION)'
        },
        'snapshot_slot_1': {
            icon: 'camera_alt',
            title: 'Unlock Trace B Reference Slot',
            desc: 'Watch a short ad to unlock Trace B snapshot memory slot for this session to capture and compare multiple acoustic curves.',
            buttonText: 'WATCH 1 AD (UNLOCK TRACE B)'
        },
        'snapshot_slot_2': {
            icon: 'camera_alt',
            title: 'Unlock Trace C Reference Slot',
            desc: 'Watch a short ad to unlock Trace C snapshot memory slot for this session to capture and compare multiple acoustic curves.',
            buttonText: 'WATCH 1 AD (UNLOCK TRACE C)'
        },
        'snapshot_slot_3': {
            icon: 'camera_alt',
            title: 'Unlock Trace D Reference Slot',
            desc: 'Watch a short ad to unlock Trace D snapshot memory slot for this session to capture and compare multiple acoustic curves.',
            buttonText: 'WATCH 1 AD (UNLOCK TRACE D)'
        },
        'mic_calibration': {
            icon: 'settings_input_antenna',
            title: 'Custom Mic Calibration Loader',
            desc: 'Load microphone frequency calibration files (.CAL / .TXT) to achieve lab-grade measurement accuracy on any audio hardware.',
            buttonText: 'WATCH 1 AD (UNLOCK CAL LOADER FOR SESSION)'
        },
        'ear_training': {
            icon: 'hearing',
            title: '1/6 ISO Octave Ear Training Lab',
            desc: 'Train your ears to identify surgical EQ cuts and boosts with pro-audio grade 1/6th octave frequency challenges.',
            buttonText: 'WATCH 1 AD (UNLOCK EAR TRAINING FOR SESSION)'
        },
        'ear_training_track': {
            icon: 'library_music',
            title: 'Reference Audio Track',
            desc: 'Practice frequency identification with studio-mastered musical reference tracks.',
            buttonText: 'WATCH 1 AD (UNLOCK REFERENCE TRACK FOR SESSION)'
        },
        'blog': {
            icon: 'menu_book',
            title: 'System Engineering Field Guide',
            desc: 'In-depth touring sound engineering masterclasses, line array directivity math, and system design whitepapers.',
            buttonText: 'WATCH 1 AD (UNLOCK GUIDE FOR SESSION)'
        }
    };

    window.showProUpgradeModal = function(featureKey) {
        currentUnlockFeatureKey = featureKey || null;
        window.currentUnlockFeatureKey = currentUnlockFeatureKey;
        
        const meta = PRO_FEATURES_META[featureKey] || {
            icon: 'workspace_premium',
            title: 'SoundEngg Pro Feature',
            desc: 'Take your acoustic tuning precision to the next level with our advanced audio engineering toolset.',
            buttonText: 'WATCH 1 AD (UNLOCK FOR SESSION)'
        };
        
        const iconEl = document.getElementById('pro-feature-icon');
        const titleEl = document.getElementById('pro-feature-title');
        const descEl = document.getElementById('pro-feature-desc');
        const watchAdTextEl = document.getElementById('btn-watch-ad-pro-text');
        const pricePreviewEl = document.getElementById('pro-plan-pricing-preview');
        
        if (iconEl) iconEl.textContent = meta.icon;
        if (titleEl) titleEl.textContent = meta.title;
        if (descEl) descEl.textContent = meta.desc;
        if (watchAdTextEl) watchAdTextEl.textContent = meta.buttonText;
        if (pricePreviewEl) {
            pricePreviewEl.textContent = window.isIndiaUser ? '7-Day Free Trial (₹999/yr)' : '7-Day Free Trial ($29.99/yr)';
        }
        
        if (proModal) {
            if (typeof window.openModal === 'function') {
                window.openModal(proModal);
            } else {
                proModal.classList.remove('hidden');
                document.body.classList.add('modal-open');
            }
        }
        if (typeof window.hideNativeBannerAd === 'function') {
            window.hideNativeBannerAd();
        }
    };
    
    window.closeProUpgradeModal = function() {
        if (proModal) {
            if (typeof window.closeModal === 'function') {
                window.closeModal(proModal);
            } else {
                proModal.classList.add('hidden');
            }
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        if (typeof window.cancelPendingSnapshotCapture === 'function') {
            window.cancelPendingSnapshotCapture();
        }
        if (!window.isPremiumActive() && !window.isRtaFullscreenActive && typeof window.showNativeBannerAd === 'function') {
            window.showNativeBannerAd();
        }
    };
    
    if (btnClosePro) btnClosePro.addEventListener('click', window.closeProUpgradeModal);
    if (btnLaterPro) btnLaterPro.addEventListener('click', window.closeProUpgradeModal);

    const watchAdBtnGlobal = document.getElementById('btn-watch-ad-pro-unlock');
    if (watchAdBtnGlobal) {
        watchAdBtnGlobal.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            if (typeof window.startAdPlayback === 'function') {
                window.startAdPlayback(true);
            }
        });
    }
    
    if (proModal) {
        proModal.addEventListener('click', (e) => {
            if (e.target === proModal) {
                window.closeProUpgradeModal();
            }
        });
    }
});

// ==========================================================================
// --- CONSOLIDATED RAZORPAY PAYMENT GATEWAY & GEO-PRICING CONTROLLER ---
// ==========================================================================

window.isIndiaUser = false;

// Helper to manually toggle India ('IN') vs International ('US') pricing during testing
window.setPricingCountry = function(countryCode) {
    if (!countryCode) {
        localStorage.removeItem('soundengg-country-override');
    } else {
        const normalized = String(countryCode).toUpperCase().trim();
        localStorage.setItem('soundengg-country-override', normalized);
        window.isIndiaUser = (normalized === 'IN');
    }
    initPricingPage(true);
    return window.isIndiaUser ? 'India (INR: ₹199 / ₹999 / ₹1,999)' : 'International (USD: $4.99 / $29.99 / $69.00)';
};

// 1. Detect User Location (Exact Timezone check with reliable Geo-IP fallback)
async function detectUserCountry() {
    // 0. Check explicit testing override first
    const countryOverride = localStorage.getItem('soundengg-country-override') || window.forceCountryOverride;
    if (countryOverride) {
        window.isIndiaUser = (String(countryOverride).toUpperCase().trim() === 'IN');
        return window.isIndiaUser;
    }

    // 1. Timezone Check (strictly for India timezone) - local, instantaneous, and extremely accurate
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offset = new Date().getTimezoneOffset(); // e.g., India is -330
        if (
            (tz && (
                tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('Asia/Kolkata') || tz.includes('Asia/Calcutta')
            )) ||
            (offset === -330)
        ) {
            console.log("[Location] Timezone or offset matched India:", tz, offset);
            localStorage.setItem('soundengg-user-country', 'IN');
            window.isIndiaUser = true;
            return true;
        } else if (
            (tz && (
                tz.includes('Kathmandu') || tz.includes('Asia/Kathmandu') || tz.includes('Colombo') || tz.includes('Asia/Colombo') ||
                tz.includes('Dhaka') || tz.includes('Asia/Dhaka')
            )) ||
            (offset === -345 || offset === -360)
        ) {
            // Explicitly classify other South Asian countries outside India (like Nepal) as International (USD)
            console.log("[Location] Timezone or offset matched South Asia outside India:", tz, offset);
            localStorage.setItem('soundengg-user-country', 'US');
            window.isIndiaUser = false;
            return false;
        }
    } catch (tzErr) {
        console.warn("[Location] Timezone check failed:", tzErr);
    }

    // Read cache fallback (if not overwritten by explicit timezone matching above)
    const cachedLoc = localStorage.getItem('soundengg-user-country');
    if (cachedLoc) {
        window.isIndiaUser = (cachedLoc === 'IN');
        return window.isIndiaUser;
    }

    // 2. Geo-IP Lookup fallback
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const country = data.country_code || 'US';
        localStorage.setItem('soundengg-user-country', country);
        window.isIndiaUser = (country === 'IN');
    } catch (e) {
        console.warn("[Location] Geo-IP lookup failed. Defaulting to International.", e);
        window.isIndiaUser = false;
    }
    return window.isIndiaUser;
}
window.detectUserCountry = detectUserCountry;


// 2. Initialize Pricing Grid Dynamic Rendering
async function initPricingPage(skipDetect = false) {
    const priceMonthly = document.getElementById('price-monthly');
    const priceYearly = document.getElementById('price-yearly');
    const priceLifetime = document.getElementById('price-lifetime');

    const modalMonthly = document.getElementById('modal-price-monthly');
    const modalYearly = document.getElementById('modal-price-yearly');
    const modalLifetime = document.getElementById('modal-price-lifetime');
    const proPreview = document.getElementById('pro-plan-pricing-preview');
    
    // Check if we are either on pro.html or app.html plan selector modal
    if (!priceMonthly && !priceYearly && !priceLifetime && !modalMonthly && !modalYearly && !modalLifetime && !proPreview) return;

    if (!skipDetect) {
        await detectUserCountry();
    }

    // Set prices dynamically based on country
    if (window.isIndiaUser) {
        if (priceMonthly) priceMonthly.innerHTML = '₹199<span>/month</span>';
        if (priceYearly) priceYearly.innerHTML = '₹999<span>/year</span>';
        if (priceLifetime) priceLifetime.innerHTML = '₹1,999<span>one-time</span>';

        if (modalMonthly) modalMonthly.innerHTML = '₹199<span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">/mo</span>';
        if (modalYearly) modalYearly.innerHTML = '₹999<span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">/yr</span>';
        if (modalLifetime) modalLifetime.innerHTML = '₹1,999';
        if (proPreview) proPreview.textContent = '₹0.00 today • Renews at ₹999/yr';
    } else {
        if (priceMonthly) priceMonthly.innerHTML = '$4.99<span>/month</span>';
        if (priceYearly) priceYearly.innerHTML = '$29.99<span>/year</span>';
        if (priceLifetime) priceLifetime.innerHTML = '$69.00<span>one-time</span>';

        if (modalMonthly) modalMonthly.innerHTML = '$4.99<span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">/mo</span>';
        if (modalYearly) modalYearly.innerHTML = '$29.99<span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">/yr</span>';
        if (modalLifetime) modalLifetime.innerHTML = '$69.00';
        if (proPreview) proPreview.textContent = '$0.00 today • Renews at $29.99/yr';
    }

    // Bind checkout click listeners
    const pricingButtons = document.querySelectorAll('.pricing-btn');
    pricingButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (e) e.preventDefault();
            const plan = btn.getAttribute('data-plan') || 'yearly';

            // Validate authentication before checkout
            if (!window.supabaseClient) {
                // If on static marketing page (like pro.html) where Supabase is not loaded, redirect to app.html to login/checkout
                window.location.href = `app.html?checkout=true&plan=${plan}`;
                return;
            }

            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) {
                // Not Logged In: Redirect to app.html with query parameters to prompt auth and trigger checkout
                alert("Please log in or create an account to subscribe.");
                window.location.href = `app.html?checkout=true&plan=${plan}`;
            } else {
                // Logged In: Launch the blocker-proof checkout confirmation modal
                showCheckoutConfirmModal(session.user, plan);
            }
        });
    });
}
window.initPricingPage = initPricingPage;

// 3. Simulated Razorpay Standard Checkout Overlay
window.showRazorpaySimOverlay = function(plan) {
    if (typeof window.hideNativeBannerAd === 'function') {
        window.hideNativeBannerAd();
    }
    // Prevent duplicate overlays
    const existing = document.getElementById('razorpay-sim-overlay');
    if (existing) existing.remove();

    // Determine values
    let priceLabel = '';
    let currencySymbol = window.isIndiaUser ? '₹' : '$';
    let currencyCode = window.isIndiaUser ? 'INR' : 'USD';

    if (window.isIndiaUser) {
        if (plan === 'monthly') { priceLabel = '₹199 / month'; }
        else if (plan === 'yearly') { priceLabel = '₹999 / year'; }
        else { priceLabel = '₹1,999 one-time'; }
    } else {
        if (plan === 'monthly') { priceLabel = '$4.99 / month'; }
        else if (plan === 'yearly') { priceLabel = '$29.99 / year'; }
        else { priceLabel = '$69.00 one-time'; }
    }

    const overlay = document.createElement('div');
    overlay.id = 'razorpay-sim-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(11, 12, 16, 0.95);
        z-index: 15000;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(10px);
        font-family: 'JetBrains Mono', monospace;
        color: #ffffff;
        box-sizing: border-box;
    `;

    overlay.innerHTML = `
        <div style="background: #0f1015; border: 2px solid var(--primary); box-shadow: 0 0 25px rgba(20, 167, 181, 0.3); border-radius: 8px; width: 100%; max-width: 480px; padding: 2rem; position: relative;">
            <button id="btn-close-rzp" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 1.5rem;">&times;</button>
            
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <div style="font-weight: 900; font-size: 1.3rem; letter-spacing: -0.05em; display: flex; align-items: center; gap: 5px;">
                    <span class="material-symbols-outlined" style="color: var(--primary);">payments</span>
                    RAZORPAY<span>SECURE</span>
                </div>
                <div style="background: rgba(20, 167, 181, 0.1); border: 1px solid var(--primary); color: var(--primary); padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 4px; text-transform: uppercase; font-weight: bold;">
                    SANDBOX
                </div>
            </div>

            <div style="margin-bottom: 1.5rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1rem; border-radius: 4px;">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Product / License</div>
                <div style="font-size: 1.1rem; font-weight: bold; color: #fff; margin-top: 2px;">SoundEngg Pro - ${plan.toUpperCase()} LICENSE</div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Amount Due:</span>
                    <span style="font-size: 1.3rem; font-weight: bold; color: var(--primary);">${priceLabel}</span>
                </div>
            </div>

            <div id="rzp-status-box" style="margin-bottom: 2rem; font-size: 0.8rem; line-height: 1.5; min-height: 60px;">
                <div style="color: var(--text-muted);">Select simulated authorization mode below:</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button id="btn-rzp-success" style="width: 100%; background: linear-gradient(135deg, var(--primary), #008b9f); border: none; color: #fff; padding: 12px; font-weight: bold; border-radius: 4px; cursor: pointer; text-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: all 0.2s;">
                    SIMULATE SUCCESSFUL PAYMENT
                </button>
                <button id="btn-rzp-cancel" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-dim); padding: 10px; font-weight: bold; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                    CANCEL / ABORT TRANSACTION
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Wire simulated steps inside checkout box
    const btnSuccess = overlay.querySelector('#btn-rzp-success');
    const btnCancel = overlay.querySelector('#btn-rzp-cancel');
    const btnClose = overlay.querySelector('#btn-close-rzp');
    const statusBox = overlay.querySelector('#rzp-status-box');

    const closeOverlay = () => {
        overlay.remove();
        if (!window.isPremiumActive() && typeof window.showNativeBannerAd === 'function') {
            window.showNativeBannerAd();
        }
    };
    btnClose.addEventListener('click', closeOverlay);
    btnCancel.addEventListener('click', closeOverlay);

    btnSuccess.addEventListener('click', async () => {
        btnSuccess.disabled = true;
        btnCancel.disabled = true;
        
        const steps = [
            { text: '⚡ Establishing secure SSL Razorpay Order handshake...', delay: 400 },
            { text: '🔒 Authorizing transaction via simulated digital banking node...', delay: 500 },
            { text: '💾 Updating subscription status profiles securely on Supabase cloud...', delay: 600 },
            { text: '✅ Transaction Completed! SoundEngg Pro unlocked.', delay: 400 }
        ];

        for (const step of steps) {
            statusBox.innerHTML = `<div style="color: var(--primary); font-weight: bold; animation: pulse 1s infinite;">${step.text}</div>`;
            await new Promise(r => setTimeout(r, step.delay));
        }

        // Apply dynamic upgrade sync to Supabase
        if (window.supabaseClient) {
            try {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                if (session) {
                    try {
                        const expiresAt = (plan === 'lifetime') ? null : new Date(Date.now() + (plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString();
                        const { error: updateErr } = await window.supabaseClient.from('profiles')
                            .update({ 
                                is_pro: true,
                                subscription_tier: plan,
                                subscription_provider: 'razorpay',
                                subscription_id: 'rzp_mock_' + Date.now().toString().slice(-8),
                                subscription_expires_at: expiresAt
                            })
                            .eq('id', session.user.id);
                        if (updateErr) throw updateErr;
                    } catch (dbErr) {
                        console.warn('Advanced subscription fields write failed. Falling back to basic is_pro write:', dbErr.message);
                        await window.supabaseClient.from('profiles')
                            .update({ 
                                is_pro: true
                            })
                            .eq('id', session.user.id);
                    }
                    
                    // Trigger global refresh
                    if (typeof syncSubscriptionStatus === 'function') {
                        await syncSubscriptionStatus(session);
                    }
                }
            } catch (err) {
                console.error("Failed to sync simulated subscription to cloud database:", err);
            }
        } else {
            // Local fallback if offline
            window.isUserPro = true;
            if (window.updatePremiumUI) window.updatePremiumUI();
            document.dispatchEvent(new CustomEvent('proStatusChanged', { detail: true }));
        }

        closeOverlay();
        showCheckoutSuccessOverlay(plan);
    });
};

// 4. Upgraded License Welcome Congratulations overlay
window.showCheckoutSuccessOverlay = function(plan) {
    const existing = document.getElementById('checkout-success-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'checkout-success-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(11, 12, 16, 0.98);
        z-index: 16000;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(15px);
        font-family: 'JetBrains Mono', monospace;
        color: #ffffff;
        box-sizing: border-box;
    `;

    overlay.innerHTML = `
        <div style="background: #0f1015; border: 2px solid #00ffcc; box-shadow: 0 0 35px rgba(0, 255, 200, 0.35); border-radius: 12px; width: 100%; max-width: 500px; padding: 3rem; text-align: center; position: relative;">
            <div style="margin: 0 auto 1.5rem; width: 80px; height: 80px; background: rgba(0, 255, 200, 0.1); border: 2px dashed #00ffcc; border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
                <span class="material-symbols-outlined" style="color: #00ffcc; font-size: 3rem; font-weight: bold;">workspace_premium</span>
            </div>
            
            <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 2.2rem; font-weight: bold; color: #00ffcc; text-shadow: 0 0 10px rgba(0,255,200,0.5); margin-bottom: 1rem;">
                Welcome to Pro!
            </h2>
            
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem;">
                Your payment was successfully validated via Razorpay! The extreme high-fidelity SoundEngg Pro hardware diagnostic toolkit is now completely unlocked.
            </p>

            <div style="text-align: left; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 1.2rem; margin-bottom: 2rem; font-size: 0.85rem;">
                <div style="color: #00ffcc; font-weight: bold; margin-bottom: 0.5rem; text-transform: uppercase; font-size: 0.75rem;">UNLOCKED CAPABILITIES:</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.4rem;"><span class="material-symbols-outlined" style="color: #00ffcc; font-size: 16px;">check_circle</span> 60FPS Logarithmic Waterfall Spectrogram</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.4rem;"><span class="material-symbols-outlined" style="color: #00ffcc; font-size: 16px;">check_circle</span> Unlimited Measurement Snapshot Overlays</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.4rem;"><span class="material-symbols-outlined" style="color: #00ffcc; font-size: 16px;">check_circle</span> Custom Mic Calibration Profile Interpolator</div>
                <div style="display: flex; align-items: center; gap: 8px;"><span class="material-symbols-outlined" style="color: #00ffcc; font-size: 16px;">check_circle</span> Surgical 1/6 Octave Ear Training Drills</div>
            </div>

            <button id="btn-success-dismiss" style="background: linear-gradient(135deg, #00ffcc, #00b386); border: none; color: #000; font-weight: 900; font-size: 1rem; width: 100%; padding: 14px; border-radius: 4px; cursor: pointer; box-shadow: 0 0 15px rgba(0, 255, 200, 0.4); transition: all 0.2s;">
                LAUNCH PRO CONSOLE
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btn-success-dismiss').addEventListener('click', () => {
        overlay.remove();
        // Redirect back to console view
        if (window.showView && document.getElementById('dashboard-view')) {
            window.showView(document.getElementById('dashboard-view'));
        } else {
            window.location.href = 'app.html';
        }
    });
};

// 4.7 Global Lemon Squeezy Checkout Initiator (International Web Checkouts)
window.initiateLemonSqueezyCheckout = function(user, plan = 'lifetime') {
    const LEMON_SQUEEZY_URLS = {
        monthly: 'https://soundengg.lemonsqueezy.com/checkout/buy/ae264353-27d2-483b-958c-1718ed29bc32',
        yearly: 'https://soundengg.lemonsqueezy.com/checkout/buy/b83283fe-7901-455e-a90f-4b39bf78d074',
        lifetime: 'https://soundengg.lemonsqueezy.com/checkout/buy/f0cd82b2-102c-473b-99dd-5f44cecd5717'
    };

    let checkoutUrl = LEMON_SQUEEZY_URLS[plan] || LEMON_SQUEEZY_URLS.lifetime;
    try {
        const url = new URL(checkoutUrl);
        if (user) {
            if (user.id) url.searchParams.set('checkout[custom][user_id]', user.id);
            if (user.email) url.searchParams.set('checkout[email]', user.email);
        }
        url.searchParams.set('checkout[custom][plan]', plan);
        checkoutUrl = url.toString();
    } catch (e) {
        console.warn("[LemonSqueezy] Could not append params to URL, using raw link:", e);
    }

    console.log(`[LemonSqueezy] Redirecting to checkout for plan: ${plan}`, checkoutUrl);
    window.location.href = checkoutUrl;
};

// 4.8 Premium Checkout Confirmation Modal to completely bypass Browser Popup Blockers
function showCheckoutConfirmModal(user, plan) {
    if (typeof window.hideNativeBannerAd === 'function') {
        window.hideNativeBannerAd();
    }
    const existing = document.getElementById('checkout-confirm-modal');
    if (existing) existing.remove();

    const nativePlatform = (window.isNativeMobile && window.isNativeMobile() && window.Capacitor && typeof window.Capacitor.getPlatform === 'function')
        ? window.Capacitor.getPlatform()
        : null;
    const isIOSNative = nativePlatform === 'ios';
    const isAndroidNative = nativePlatform === 'android';
    const isNativeMobileApp = isIOSNative || isAndroidNative;
    const isTrialEligible = (plan === 'monthly' || plan === 'yearly');
    let planTitle = "Founder's Lifetime";
    let planCost = "₹1,999";
    let dueToday = window.isIndiaUser ? "₹0.00 (7-Day Free Trial)" : "$0.00 (7-Day Free Trial)";

    if (window.isIndiaUser) {
        if (plan === 'monthly') {
            planTitle = "Monthly Pro Pass";
            planCost = "₹199 / month";
        } else if (plan === 'yearly') {
            planTitle = "Yearly Pro Pass";
            planCost = "₹999 / year";
        } else {
            planTitle = "Founder's Lifetime";
            planCost = "₹1,999 (One-Time)";
        }
    } else {
        if (plan === 'monthly') {
            planTitle = "Monthly Pro Pass";
            planCost = "$4.99 / month";
        } else if (plan === 'yearly') {
            planTitle = "Yearly Pro Pass";
            planCost = "$29.99 / year";
        } else {
            planTitle = "Founder's Lifetime";
            planCost = "$69.00 (One-Time)";
        }
    }

    const gatewayLabel = isIOSNative
        ? "Secured by Apple App Store"
        : (isAndroidNative 
            ? "Secured by Google Play" 
            : (window.isIndiaUser ? "Secured by Razorpay Payment Gateway" : "Secured by Lemon Squeezy (Merchant of Record)"));

    const modal = document.createElement('div');
    modal.id = 'checkout-confirm-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5,5,8,0.92); display: flex; align-items: center; justify-content: center; z-index: 10000; font-family: var(--font-mono), monospace; color: #fff; padding: 12px; box-sizing: border-box;';

    const emailDisplay = user ? user.email : "Guest User (Device Local)";
    const guestNoticeHtml = !user ? `
        <p style="font-size: 0.7rem; color: #ffaa00; margin: 0.75rem 0 0 0; line-height: 1.3; text-align: left; font-family: var(--font-mono); border: 1px dashed rgba(255, 170, 0, 0.3); padding: 7px 8px; border-radius: 4px;">
            ⚠️ <strong>Optional Registration:</strong> You can purchase as a guest. To access your purchase on other devices later, register an account in the profile menu anytime.
        </p>
    ` : "";

    const trialRowHtml = isTrialEligible ? `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 0.65rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem;">
            <span style="font-size: 0.74rem; color: var(--text-dim); white-space: nowrap; flex-shrink: 0;">DUE TODAY</span>
            <span style="font-size: 0.8rem; color: #00ffcc; font-weight: bold; text-align: right;">${dueToday}</span>
        </div>
    ` : "";

    const priceLabelText = isTrialEligible ? "THEN RENEWS AT" : "PRICE RATE";
    const actionBtnLabel = isTrialEligible ? "START 7-DAY FREE TRIAL" : "PROCEED TO SECURE PAYMENT";
    const actionBtnIcon = isTrialEligible ? "bolt" : "lock";

    modal.innerHTML = `
        <div class="modal-content auth-modal-box" style="display: block !important; gap: 0 !important; max-width: 420px; width: 94%; max-height: 88vh; overflow-y: auto; text-align: center; border: 2px solid var(--neon-blue); box-shadow: 0 0 25px rgba(0, 240, 255, 0.3); background: #0b0c10; padding: 1.5rem 1.25rem !important; border-radius: 12px; position: relative; box-sizing: border-box;">
            <button id="btn-close-checkout-confirm" style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 20px; padding: 4px; line-height: 1;"><span class="material-symbols-outlined">close</span></button>
            
            <div style="margin: 0 auto 0.85rem; display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: rgba(20, 167, 181, 0.1); border: 2px dashed var(--primary);">
                <span class="material-symbols-outlined" style="font-size: 26px; color: var(--primary);">shopping_cart</span>
            </div>
            
            <h2 style="font-family: var(--font-headline); font-size: 1.4rem; font-weight: bold; margin: 0 0 0.35rem 0; color: #fff; text-shadow: 0 0 10px rgba(20, 167, 181, 0.4);">Secure Checkout</h2>
            <p style="font-size: 0.78rem; color: var(--text-dim); margin: 0 0 1rem 0; line-height: 1.35;">Unlock full acoustic precision. Review your purchase order details below:</p>
            
            <div style="text-align: left; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.9rem 1rem; margin-bottom: 1.1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 0.65rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem;">
                    <span style="font-size: 0.74rem; color: var(--text-dim); white-space: nowrap; flex-shrink: 0;">UPGRADE PLAN</span>
                    <span style="font-size: 0.82rem; color: #fff; font-weight: bold; text-transform: uppercase; text-align: right;">${planTitle}</span>
                </div>
                ${trialRowHtml}
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 0.65rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem;">
                    <span style="font-size: 0.74rem; color: var(--text-dim); white-space: nowrap; flex-shrink: 0;">${priceLabelText}</span>
                    <span style="font-size: 0.82rem; color: var(--primary); font-weight: bold; text-align: right;">${planCost}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 0.1rem;">
                    <span style="font-size: 0.74rem; color: var(--text-dim); white-space: nowrap; flex-shrink: 0;">ACCOUNT</span>
                    <span style="font-size: 0.8rem; color: #fff; text-align: right; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; min-width: 0; flex: 1;">${emailDisplay}</span>
                </div>
                ${guestNoticeHtml}
            </div>
            
            <button id="btn-proceed-to-payment" style="width: 100%; border: none; padding: 13px 14px; font-weight: bold; font-family: var(--font-mono); font-size: 0.88rem; cursor: pointer; border-radius: 6px; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; box-shadow: 0 0 15px rgba(20, 167, 181, 0.4); display: flex; align-items: center; justify-content: center; gap: 0.45rem; transition: all 0.2s ease; box-sizing: border-box;">
                <span class="material-symbols-outlined" style="font-size: 18px;">${actionBtnIcon}</span> <span>${actionBtnLabel}</span>
            </button>
            <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 0.65rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <span class="material-symbols-outlined" style="font-size: 14px; color: var(--primary);">shield</span> ${gatewayLabel}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btn-close-checkout-confirm').onclick = () => {
        modal.remove();
        if (!window.isPremiumActive() && typeof window.showNativeBannerAd === 'function') {
            window.showNativeBannerAd();
        }
    };

    const proceedBtn = modal.querySelector('#btn-proceed-to-payment');
    proceedBtn.onclick = async () => {
        proceedBtn.disabled = true;
        proceedBtn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> LAUNCHING SECURE GATEWAY...`;
        
        // Native mobile route: iOS uses Apple App Store IAP, Android uses Google Play Billing (both via RevenueCat)
        if (isNativeMobileApp) {
            modal.remove();
            if (window.billingManager && typeof window.billingManager.purchasePackage === 'function') {
                const res = await window.billingManager.purchasePackage(plan);
                if (res.success && res.alreadyOwned) {
                    const storeName = isAndroidNative ? "Google Play account" : "Apple ID";
                    alert(`Your ${storeName} already owns this pass! Your Pro access has been restored and synced automatically.`);
                } else if (res.success) {
                    alert("Thank you! Your Pro Upgrade was successful.");
                } else if (res.error && res.error !== "Cancelled" && !res.error.includes("user cancelled")) {
                    alert("Transaction failed: " + res.error);
                }
            } else {
                alert("Error: Native billing manager is not active.");
            }
            return;
        }

        // Web Route:
        // Indian users route to Razorpay (UPI, RuPay, Netbanking in INR)
        // International users route to Lemon Squeezy (USD, Credit Cards, PayPal, Global MoR)
        modal.remove();

        if (window.isIndiaUser) {
            if (typeof Razorpay === 'undefined') {
                console.log("Loading Razorpay SDK dynamically...");
                const script = document.createElement('script');
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = () => {
                    if (typeof window.initiateRazorpayCheckout === 'function') {
                        window.initiateRazorpayCheckout(user, plan);
                    } else {
                        console.error("window.initiateRazorpayCheckout is not defined");
                        alert("Error: Checkout handler not initialized properly. Please refresh the page.");
                    }
                };
                script.onerror = () => {
                    alert("Failed to load Razorpay payment SDK.");
                };
                document.head.appendChild(script);
            } else {
                if (typeof window.initiateRazorpayCheckout === 'function') {
                    window.initiateRazorpayCheckout(user, plan);
                } else {
                    console.error("window.initiateRazorpayCheckout is not defined");
                    alert("Error: Checkout handler not initialized properly. Please refresh the page.");
                }
            }
        } else {
            // International Web Checkouts via Lemon Squeezy
            if (typeof window.initiateLemonSqueezyCheckout === 'function') {
                window.initiateLemonSqueezyCheckout(user, plan);
            } else {
                console.error("window.initiateLemonSqueezyCheckout is not defined");
                alert("Error: International checkout handler not initialized properly. Please refresh the page.");
            }
        }
    };
}
window.showCheckoutConfirmModal = showCheckoutConfirmModal;

// 4.5 Helper to Highlight the Pre-selected Plan inside Selector Modal
function highlightPlanCard(plan) {
    const planSelectorModal = document.getElementById('plan-selector-modal');
    if (!planSelectorModal) return;
    
    const validPlans = ['monthly', 'yearly', 'lifetime', 'quarterly'];
    const safePlan = validPlans.includes(plan) ? plan : 'yearly';

    // Clear previous highlighting style triggers
    planSelectorModal.querySelectorAll('.plan-card-option').forEach(card => {
        card.style.transform = 'none';
        card.style.boxShadow = 'none';
        if (card.getAttribute('data-plan') !== 'yearly') {
            card.style.borderColor = 'var(--outline)';
        } else {
            card.style.borderColor = 'var(--primary)';
        }
    });

    const targetCard = planSelectorModal.querySelector(`.plan-card-option[data-plan="${safePlan}"]`);
    if (targetCard) {
        // Apply beautiful scaling, primary glow, and smooth scroll focus
        targetCard.style.transform = 'scale(1.03)';
        targetCard.style.boxShadow = '0 0 20px rgba(0, 255, 204, 0.25)';
        targetCard.style.borderColor = 'var(--primary)';
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}
window.highlightPlanCard = highlightPlanCard;

// 5. Deep-Link URL Subscription Triggers
async function handleUrlSubCheckout() {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const plan = params.get('plan') || 'yearly';

    if (checkout !== 'true') return;

    // Clean query parameters so refreshes do not re-trigger checkout modal
    try {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    } catch (historyErr) {
        console.warn('[handleUrlSubCheckout] Bypassing history state replacement on local file origin:', historyErr.message);
    }

    if (!window.supabaseClient) return;

    const planSelectorModal = document.getElementById('plan-selector-modal');

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        // Not Logged In: Inject helper banner inside auth modal, then pop it!
        const authModal = document.getElementById('auth-modal-overlay');
        const loginForm = document.getElementById('form-login');
        if (authModal && loginForm) {
            let banner = document.getElementById('auth-checkout-helper-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'auth-checkout-helper-banner';
                banner.style.cssText = 'background: rgba(20, 167, 181, 0.1); border: 1px solid var(--primary); border-radius: 4px; color: var(--primary); padding: 10px; margin-bottom: 1.5rem; font-size: 0.8rem; font-family: var(--font-mono); text-align: center;';
                banner.innerHTML = `<strong>SUBSCRIBE TO PRO TIER</strong><br>Please log in or register below to access the plan selector modal.`;
                loginForm.insertBefore(banner, loginForm.firstChild);
            }
            openModal(authModal);

            // Register temporary success callback to trigger plan selector upon login success
            const onAuthSuccess = async (ev) => {
                document.removeEventListener('authSuccess', onAuthSuccess);
                if (planSelectorModal) {
                    setTimeout(() => {
                        openModal(planSelectorModal);
                        highlightPlanCard(plan);
                    }, 800);
                }
            };
            document.addEventListener('authSuccess', onAuthSuccess);
        }
    } else {
        // Logged In: Pop Plan Selector instantly
        if (planSelectorModal) {
            setTimeout(() => {
                openModal(planSelectorModal);
                highlightPlanCard(plan);
            }, 500);
        }
    }
}
window.handleUrlSubCheckout = handleUrlSubCheckout;

// 6. Inject Location Sandbox Controls inside User Profile Modal
function injectSandboxControls() {
    // Legacy sandbox location simulator deactivated. Native HTML5 browser geolocation permissions used instead.
}

// 6.5 Mobile Selector Navigation and Label Sync
function initMobileNavDropdown() {
    const toggleBtn = document.getElementById('btn-mobile-nav-toggle');
    const menu = document.getElementById('mobile-nav-dropdown-menu');
    const navItems = document.querySelectorAll('.mobile-nav-item');

    if (!toggleBtn || !menu) return;

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = menu.style.display === 'flex';
        menu.style.display = isVisible ? 'none' : 'flex';
        toggleBtn.classList.toggle('active', !isVisible);
    });

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== toggleBtn) {
            menu.style.display = 'none';
            toggleBtn.classList.remove('active');
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            menu.style.display = 'none';
            toggleBtn.classList.remove('active');

            const targetId = item.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            
            if (targetView && window.showView) {
                // Map to corresponding desktop header button to sync highlight
                let navBtn = null;
                if (targetId === 'dashboard-view') navBtn = document.getElementById('btn-nav-dashboard');
                else if (targetId === 'author-view') navBtn = document.getElementById('btn-nav-author');
                else if (targetId === 'blog-view') navBtn = document.getElementById('btn-nav-blog');

                window.showView(targetView, navBtn);
            }
        });
    });
}
window.initMobileNavDropdown = initMobileNavDropdown;

function syncMobileNavDropdownLabel(viewId) {
    const activeLabel = document.getElementById('mobile-nav-active-label');
    const navItems = document.querySelectorAll('.mobile-nav-item');
    if (!activeLabel) return;

    activeLabel.textContent = 'MENU';

    // Keep active highlight class accurate
    navItems.forEach(item => {
        const target = item.getAttribute('data-target');
        if (target === viewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

window.syncMobileNavDropdownLabel = syncMobileNavDropdownLabel;

// --- Capacitor App Version Verification & Force Updates ---
function initAppVersionCheck() {
    if (typeof window.isNativeMobile === 'function' && window.isNativeMobile()) {
        console.log('[VersionCheck] Native mobile detected, verifying store version status...');
        const AppPlugin = window.Capacitor?.Plugins?.App;
        const DevicePlugin = window.Capacitor?.Plugins?.Device;
        const platform = window.Capacitor?.getPlatform ? window.Capacitor.getPlatform() : 'web';
        const isIOS = platform === 'ios';
        const isAndroid = platform === 'android';

        async function resolveAppVersion() {
            let build = 0;
            let version = "1.0.0";
            if (AppPlugin && typeof AppPlugin.getInfo === 'function') {
                try {
                    const appInfo = await AppPlugin.getInfo();
                    build = parseInt(appInfo.build, 10) || 0;
                    version = appInfo.version || "1.0.0";
                } catch (e) {
                    console.warn('[VersionCheck] AppPlugin.getInfo error:', e);
                }
            }
            if (!build && DevicePlugin && typeof DevicePlugin.getInfo === 'function') {
                try {
                    const devInfo = await DevicePlugin.getInfo();
                    build = parseInt(devInfo.appBuild || devInfo.build, 10) || 0;
                    version = devInfo.appVersion || devInfo.version || version;
                } catch (e) {
                    console.warn('[VersionCheck] DevicePlugin.getInfo error:', e);
                }
            }
            return { build, version };
        }

        resolveAppVersion().then(async ({ build: currentBuild, version: currentVersionName }) => {
            console.log('[VersionCheck] Local Platform:', platform, 'Build:', currentBuild, 'Version:', currentVersionName);
            
            // If local build is unresolved, avoid false trigger
            if (currentBuild <= 0 && currentVersionName === "1.0.0") {
                console.log('[VersionCheck] Local build info not available. Bypassing check.');
                return;
            }

            const currentBuildEl = document.getElementById('update-current-build');
            if (currentBuildEl) {
                currentBuildEl.textContent = `${currentVersionName} (${currentBuild})`;
            }
                
            try {
                let hasNewVersion = false;
                let latestStoreVersion = currentVersionName;
                let requiredBuild = currentBuild;
                let downloadUrl = isIOS 
                    ? 'https://apps.apple.com/app/soundengg/id6783749210' 
                    : 'https://play.google.com/store/apps/details?id=com.soundengg.app';
                let updateMessage = "A new version of SoundEngg is available with RTA optimizations and performance upgrades.";
                let isForceUpdate = false;

                // 1. Fetch SoundEngg central version configuration
                try {
                    const res = await fetch('https://www.soundengg.com/app-version.json?t=' + Date.now());
                    if (res.ok) {
                        const versionConfig = await res.json();
                        requiredBuild = parseInt(versionConfig.latestVersionCode, 10) || currentBuild;
                        isForceUpdate = !!versionConfig.forceUpdate;
                        if (versionConfig.message) updateMessage = versionConfig.message;
                        if (isIOS && versionConfig.iosDownloadUrl) {
                            downloadUrl = versionConfig.iosDownloadUrl;
                        } else if (isAndroid && versionConfig.androidDownloadUrl) {
                            downloadUrl = versionConfig.androidDownloadUrl;
                        } else if (versionConfig.downloadUrl) {
                            downloadUrl = versionConfig.downloadUrl;
                        }
                        if (versionConfig.latestVersionName) {
                            latestStoreVersion = versionConfig.latestVersionName;
                        }
                        // Android & General: If installed build is older than available build, prompt update
                        if (currentBuild > 0 && currentBuild < requiredBuild) {
                            hasNewVersion = true;
                        }
                    }
                } catch (configErr) {
                    console.warn('[VersionCheck] Central config fetch warning:', configErr);
                }

                // 2. On iOS: Always cross-verify directly with Apple's Live App Store API
                if (isIOS) {
                    try {
                        const itunesRes = await fetch('https://itunes.apple.com/lookup?bundleId=com.soundengg.app&t=' + Date.now());
                        if (itunesRes.ok) {
                            const itunesData = await itunesRes.json();
                            if (itunesData.resultCount > 0 && itunesData.results[0]?.version) {
                                const appStoreVersion = itunesData.results[0].version;
                                console.log('[VersionCheck] Live App Store Version:', appStoreVersion);
                                if (itunesData.results[0].trackViewUrl) {
                                    downloadUrl = itunesData.results[0].trackViewUrl;
                                }
                                // If Apple App Store version is higher than installed version, trigger update prompt
                                if (appStoreVersion !== currentVersionName && compareSemVer(appStoreVersion, currentVersionName) > 0) {
                                    hasNewVersion = true;
                                    latestStoreVersion = appStoreVersion;
                                } else {
                                    // If Apple hasn't published the new version yet, suppress prompt on iOS
                                    hasNewVersion = false;
                                }
                            }
                        }
                    } catch (itunesErr) {
                        console.warn('[VersionCheck] iTunes lookup warning:', itunesErr);
                    }
                }

                const requiredBuildEl = document.getElementById('update-required-build');
                if (requiredBuildEl) {
                    requiredBuildEl.textContent = `${latestStoreVersion} (${requiredBuild})`;
                }
                
                if (hasNewVersion) {
                    console.warn('[VersionCheck] Update available! Presenting update prompt to user...');
                    const updateOverlay = document.getElementById('update-modal-overlay');
                    if (updateOverlay) {
                        openModal(updateOverlay);
                        
                        const downloadBtn = document.getElementById('btn-update-download');
                        if (downloadBtn) {
                            downloadBtn.href = downloadUrl;
                            downloadBtn.onclick = (e) => {
                                e.preventDefault();
                                if (isAndroid) {
                                    // Directly open native Google Play Store App
                                    try {
                                        window.location.href = 'market://details?id=com.soundengg.app';
                                    } catch (err) {
                                        window.open('https://play.google.com/store/apps/details?id=com.soundengg.app', '_system');
                                    }
                                } else if (isIOS) {
                                    // Directly open native Apple App Store App
                                    try {
                                        window.location.href = 'itms-apps://apps.apple.com/app/soundengg/id6783749210';
                                    } catch (err) {
                                        window.open(downloadUrl, '_system');
                                    }
                                } else {
                                    window.open(downloadUrl, '_system');
                                }
                            };
                        }
                        
                        const messageEl = document.getElementById('update-modal-message');
                        if (messageEl) {
                            messageEl.textContent = updateMessage;
                        }

                        const laterBtn = document.getElementById('btn-update-later');
                        if (laterBtn) {
                            if (isForceUpdate) {
                                laterBtn.style.display = 'none';
                            } else {
                                laterBtn.style.display = 'block';
                                laterBtn.onclick = () => {
                                    closeModal(updateOverlay);
                                };
                            }
                        }
                    }
                } else {
                    console.log('[VersionCheck] SoundEngg version is up to date:', currentVersionName, `(Build ${currentBuild})`);
                }
            } catch (err) {
                console.error('[VersionCheck] Error verifying app updates:', err);
            }
        }).catch((err) => {
            console.error('[VersionCheck] Failed to get app info:', err);
        });
    } else {
        console.log('[VersionCheck] App is running in standard web browser/PWA. Version checking bypassed.');
    }
}
window.initAppVersionCheck = initAppVersionCheck;

// Helper: Semantic Version Comparison (returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal)
function compareSemVer(v1, v2) {
    const p1 = (v1 || '').split('.').map(n => parseInt(n, 10) || 0);
    const p2 = (v2 || '').split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
        const num1 = p1[i] || 0;
        const num2 = p2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

// --- Capacitor Native App Logo Swap ---
function initNativeAppLogo() {
    if (typeof window.isNativeMobile === 'function' && window.isNativeMobile()) {
        console.log('[NativeLogo] Swapping header logo for native app...');
        const mobileHeaderLogoImgs = document.querySelectorAll('#mobile-header-logo img');
        mobileHeaderLogoImgs.forEach(img => {
            img.src = 'assets/img/app-icon.png';
            img.style.height = '32px';
            img.style.width = '32px';
            img.style.borderRadius = '6px';
            img.style.boxShadow = '0 0 10px rgba(0, 170, 255, 0.4)';
            img.style.border = '1px solid rgba(0, 170, 255, 0.3)';
        });
    }
}

// 7. Global Payment System Initialization DOM Trigger
const initPageSystems = () => {
    // Add native-mobile and platform-specific classes if running inside native mobile wrapper
    if (typeof window.isNativeMobile === 'function' && window.isNativeMobile()) {
        document.body.classList.add('native-mobile');
        document.documentElement.classList.add('native-mobile');
        const platform = window.Capacitor?.getPlatform();
        if (platform === 'ios') {
            document.body.classList.add('platform-ios');
            document.documentElement.classList.add('platform-ios');
        } else if (platform === 'android') {
            document.body.classList.add('platform-android');
            document.documentElement.classList.add('platform-android');
        }

        // Intercept all clicks on upgrade links pointing to pro.html and display plan selector modal directly
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
                const href = link.getAttribute('href');
                if (href && (href === 'pro.html' || href.includes('pro.html'))) {
                    e.preventDefault();
                    const planSelectorModal = document.getElementById('plan-selector-modal');
                    if (planSelectorModal) {
                        // Close any open conflicting modals
                        const profileModal = document.getElementById('profile-modal');
                        if (profileModal) closeModal(profileModal);
                        const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                        if (proUpgradeModal) closeModal(proUpgradeModal);
                        const adLockModal = document.getElementById('ad-lock-modal');
                        if (adLockModal) closeModal(adLockModal);

                        openModal(planSelectorModal);
                    }
                }
            }
        });
    }

    // Start dynamic pricing converter immediately
    initPricingPage();

    // Check query params for checkout deep-links
    handleUrlSubCheckout();

    // Inject sandbox controller row into user profile modal settings
    injectSandboxControls();

    // Initialize custom mobile header selector nav dropdown
    initMobileNavDropdown();

    // Wire up the Author tab contact form for Web3Forms transmission
    if (typeof setupAuthorContactForm === 'function') {
        setupAuthorContactForm();
    }

    // Check Capacitor native app build versions for force updates
    initAppVersionCheck();

    // Swap native header logo if running on iOS/Android
    initNativeAppLogo();

    // Boot up Smart Banner, Rating alert, and Toast notifications
    initGrowthLoops();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageSystems);
} else {
    initPageSystems();
}

function setupAuthorContactForm() {
    const authorContactForm = document.getElementById('author-contact-form');
    const submitBtn = document.getElementById('author-submit-btn');
    const formStatus = document.getElementById('author-form-status');

    if (authorContactForm && submitBtn && formStatus) {
        authorContactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Visual Loading Feedback
            submitBtn.disabled = true;
            submitBtn.textContent = 'TRANSMITTING MESSAGE...';
            submitBtn.style.opacity = '0.7';
            
            formStatus.style.display = 'block';
            formStatus.style.background = 'rgba(0, 170, 255, 0.1)';
            formStatus.style.color = '#00AAFF';
            formStatus.style.border = '1px solid #005588';
            formStatus.innerHTML = '[SYSTEM] CONNECTING TO TELEMETRY ROUTER...';

            const formData = new FormData(authorContactForm);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
            .then(async (response) => {
                let res = await response.json();
                if (response.status == 200) {
                    formStatus.style.background = 'rgba(16, 185, 129, 0.15)';
                    formStatus.style.color = '#10B981';
                    formStatus.style.border = '1px solid #10B981';
                    formStatus.innerHTML = '[SUCCESS] SECURE ROUTING COMPLETE. Your message has been sent directly to sujan@soundengg.com!';
                    authorContactForm.reset();
                } else {
                    console.error(response);
                    formStatus.style.background = 'rgba(239, 68, 68, 0.15)';
                    formStatus.style.color = '#EF4444';
                    formStatus.style.border = '1px solid #EF4444';
                    formStatus.innerHTML = '[ERROR] ROUTING FAILED: ' + (res.message || 'Unknown network error');
                }
            })
            .catch((error) => {
                console.error(error);
                formStatus.style.background = 'rgba(239, 68, 68, 0.15)';
                formStatus.style.color = '#EF4444';
                formStatus.style.border = '1px solid #EF4444';
                formStatus.innerHTML = '[ERROR] NETWORK TRANSIT FAILURE. Verify local console connectivity.';
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Your Request';
                submitBtn.style.opacity = '1';
            });
        });
    }
}
window.setupAuthorContactForm = setupAuthorContactForm;

// =========================================================================
// PRODUCT-LED ORGANIC GROWTH & RETENTION ENGINE
// =========================================================================

function initGrowthLoops() {
    
    // 1. Toast Notification Service
    window.showSoundEnggToast = function(message) {
        const toast = document.getElementById('soundengg-toast');
        const toastText = document.getElementById('soundengg-toast-text');
        if (!toast || !toastText) return;
        toastText.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    };

    // 2. In-App Store Review / Rating Trigger
    window.trackUsageForRating = function() {
        if (localStorage.getItem('soundengg-rated') === 'true') return;

        let count = parseInt(localStorage.getItem('soundengg-calc-count')) || 0;
        count++;
        localStorage.setItem('soundengg-calc-count', count);

        // Prompt user after 15 interactions
        if (count === 15) {
            const ratingDialog = document.getElementById('app-rating-dialog');
            if (ratingDialog) {
                const btnRedirect = document.getElementById('btn-rating-store-redirect');
                if (btnRedirect) {
                    const isIOS = (window.Capacitor?.getPlatform && window.Capacitor.getPlatform() === 'ios') ||
                                  window.Capacitor?.platform === 'ios' ||
                                  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                                  ((navigator.platform === 'MacIntel' || /Macintosh/.test(navigator.userAgent)) && navigator.maxTouchPoints > 1);
                    if (isIOS) {
                        btnRedirect.href = 'https://apps.apple.com/app/id6783749210?action=write-review';
                    } else {
                        btnRedirect.href = 'https://play.google.com/store/apps/details?id=com.soundengg.app';
                    }
                }

                const btnLater = document.getElementById('btn-rating-later');
                if (btnLater) {
                    btnLater.onclick = function() {
                        ratingDialog.close();
                        localStorage.setItem('soundengg-calc-count', '0'); // Snooze counter
                    };
                }

                if (btnRedirect) {
                    btnRedirect.onclick = function(e) {
                        localStorage.setItem('soundengg-rated', 'true');
                        ratingDialog.close();

                        const audioPlugin = window.Capacitor?.registerPlugin ? window.Capacitor.registerPlugin('AudioSessionPlugin') : window.Capacitor?.Plugins?.AudioSessionPlugin;
                        if (window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform() && audioPlugin && typeof audioPlugin.requestAppReview === 'function') {
                            e.preventDefault();
                            audioPlugin.requestAppReview().catch(() => {
                                const targetUrl = btnRedirect.href;
                                window.open(targetUrl, '_system');
                            });
                        } else if (window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform()) {
                            e.preventDefault();
                            const targetUrl = btnRedirect.href;
                            window.open(targetUrl, '_system');
                        }
                    };
                }

                // Fallback for older browsers without declarative light dismiss support
                if (!('closedBy' in HTMLDialogElement.prototype)) {
                    ratingDialog.onclick = function(event) {
                        if (event.target !== ratingDialog) return;
                        const rect = ratingDialog.getBoundingClientRect();
                        const isDialogContent = (
                            rect.top <= event.clientY &&
                            event.clientY <= rect.top + rect.height &&
                            rect.left <= event.clientX &&
                            event.clientX <= rect.left + rect.width
                        );
                        if (!isDialogContent) ratingDialog.close();
                    };
                }

                setTimeout(() => {
                    ratingDialog.showModal();
                }, 1500);
            }
        }
    };

    // 3. Smart App Banner Trigger (Mobile web browsers only)
    function initSmartAppBanner() {
        const banner = document.getElementById('web-smart-banner');
        const closeBtn = document.getElementById('btn-close-smart-banner');
        if (!banner || !closeBtn) return;

        // Never show if running inside the Capacitor Native App build container
        if (window.Capacitor || (typeof window.isNativeMobile === 'function' && window.isNativeMobile())) {
            banner.style.display = 'none';
            return;
        }

        // Do not show if recently dismissed (remember choice for 7 days)
        const dismissedTime = localStorage.getItem('soundengg-banner-dismissed');
        if (dismissedTime) {
            const diff = Date.now() - parseInt(dismissedTime);
            if (diff < 7 * 24 * 60 * 60 * 1000) {
                banner.style.display = 'none';
                return;
            }
        }

        // Display banner on mobile or tablet viewport widths
        const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
        if (isMobile) {
            banner.style.display = 'flex';
            document.body.style.paddingTop = '54px'; // Shift content layout down to avoid header collisions
        } else {
            banner.style.display = 'none';
        }

        closeBtn.onclick = function(e) {
            e.preventDefault();
            banner.style.transform = 'translateY(-100%)';
            banner.style.opacity = '0';
            document.body.style.paddingTop = '0';
            localStorage.setItem('soundengg-banner-dismissed', Date.now().toString());
            setTimeout(() => {
                banner.style.display = 'none';
            }, 300);
        };
    }

    initSmartAppBanner();
}
