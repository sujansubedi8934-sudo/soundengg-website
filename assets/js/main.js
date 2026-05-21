// --- SAFE STORAGE PROXY (Safari Protection) ---
const safeStorage = window.safeStorage || {
    getItem: function(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (e) {
            if (!window.localStorageFallback) window.localStorageFallback = {};
            return window.localStorageFallback[key] || null;
        }
    },
    setItem: function(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (e) {
            if (!window.localStorageFallback) window.localStorageFallback = {};
            window.localStorageFallback[key] = String(value);
        }
    },
    removeItem: function(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (e) {
            if (!window.localStorageFallback) window.localStorageFallback = {};
            delete window.localStorageFallback[key];
        }
    },
    clear: function() {
        try {
            window.localStorage.clear();
        } catch (e) {
            window.localStorageFallback = {};
        }
    }
};

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
            
            if (!supportsSinkId) {
                globalOutput.disabled = true;
                globalOutput.style.opacity = '0.6';
                globalOutput.style.cursor = 'not-allowed';
                const warningBox = document.getElementById('safari-output-warning');
                if (warningBox) {
                    warningBox.style.display = 'flex';
                }
            }
        }
        if (rtaOutput) {
            rtaOutput.innerHTML = outputOptions;
            const savedOutput = safeStorage.getItem('soundengg-output-id') || 'default';
            rtaOutput.value = savedOutput;
            
            if (!supportsSinkId) {
                rtaOutput.disabled = true;
                rtaOutput.style.opacity = '0.6';
                rtaOutput.style.cursor = 'not-allowed';
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

// --- MODAL UTILITIES (Senior Stability - Global Scope) ---
function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    document.body.classList.add('modal-open');
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    // Force wipe all inline styles used for the "frozen" fix
    modal.style.display = '';
    modal.style.visibility = '';
    modal.style.opacity = '';
    document.body.classList.remove('modal-open');
}

const initAuthAndCore = () => {
    // Pre-populate authentication header display using cached name to avoid initial page load flash/delay
    const cachedName = safeStorage.getItem('soundengg_user_display_name');
    if (cachedName) {
        document.querySelectorAll('.auth-toggle-btn').forEach(btn => {
            const authText = btn.querySelector('.btn-text');
            const authIcon = btn.querySelector('.material-symbols-outlined');
            if (authText) authText.textContent = cachedName;
            if (authIcon) authIcon.textContent = 'account_circle';
            btn.classList.add('logged-in');
        });
    }

    const safeInit = (fn, name) => {
        try {
            fn();
        } catch (e) {
            console.error(`Error initializing module: ${name || fn.name}`, e);
        }
    };

    safeInit(setupThemeToggle, 'setupThemeToggle');
    safeInit(applyAutoTheme, 'applyAutoTheme');
    safeInit(initGlobalUnits, 'initGlobalUnits');
    safeInit(setupNavigation, 'setupNavigation');
    safeInit(initDelayCalc, 'initDelayCalc');
    safeInit(initProfessionalRTA, 'initProfessionalRTA'); 
    safeInit(initPinout, 'initPinout');
    safeInit(initGlobalSearch, 'initGlobalSearch');
    safeInit(initBlog, 'initBlog');
    safeInit(initSignalGenerator, 'initSignalGenerator');
    safeInit(initEarTraining, 'initEarTraining');
    safeInit(initTuner, 'initTuner');
    safeInit(initSubCalc, 'initSubCalc');
    safeInit(initTapTempoDelay, 'initTapTempoDelay');
    safeInit(initAdManager, 'initAdManager');
    

    // GLOBAL AUTH ICON DELEGATION
    document.addEventListener('click', async (e) => {
        const authBtn = e.target.closest('.auth-toggle-btn');
        if (authBtn) {
            e.preventDefault();
            
            // Auto close mobile menu on selection
            const menu = document.getElementById('mobile-nav-dropdown-menu');
            const toggleBtn = document.getElementById('btn-mobile-nav-toggle');
            if (menu) menu.style.display = 'none';
            if (toggleBtn) toggleBtn.classList.remove('active');
            
            console.log('Global Auth Icon Triggered');
            
            if (!window.supabaseClient) {
                alert('Connection error. Please refresh.');
                return;
            }

            const iconSpan = authBtn.querySelector('.material-symbols-outlined');
            const isUserIcon = iconSpan && iconSpan.textContent === 'account_circle';

            if (isUserIcon) {
                const profileModal = document.getElementById('profile-modal');
                openModal(profileModal);
                
                // Fetch and populate latest profile details and billing ledger in real-time on modal open!
                if (window.supabaseClient) {
                    window.supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
                        if (session) {
                            try {
                                await syncSubscriptionStatus(session);
                                console.log('Real-time subscription status and profile details fully synced on modal open.');
                            } catch (err) {
                                console.error('Error syncing profile on open:', err);
                            }
                        }
                    });
                }
            } else {
                openModal(document.getElementById('auth-modal-overlay'));
            }

            // Perform background session check to correct UI if needed
            window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
                if (!session && isUserIcon) {
                    // Oops, icon was wrong, user is actually logged out
                    const profileModal = document.getElementById('profile-modal');
                    if (profileModal) closeModal(profileModal);
                    const authModal = document.getElementById('auth-modal-overlay');
                    if (authModal) authModal.classList.remove('hidden');
                }
            });
        }
    });
    
    // --- UNIFIED AUTHENTICATION MANAGER (Senior Consolidation) ---
    function handleAuthStateChange(event, session) {
        // Decouple execution asynchronously to prevent GoTrue thread/lock deadlocks
        setTimeout(async () => {
            console.group(`Auth Event: ${event}`);
            try {
                const user = session?.user;
                const authModalOverlay = document.getElementById('auth-modal-overlay');
                const profileModal = document.getElementById('profile-modal');

                // A. Close modals immediately on auth state change (Senior UI Snappiness)
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                    if (authModalOverlay) closeModal(authModalOverlay);
                    if (profileModal) closeModal(profileModal);
                }

                // B. Sync Pro/Free State and Profile Data in background (does not block UI/modals)
                try {
                    await syncSubscriptionStatus(session);
                } catch (syncErr) {
                    console.error('[handleAuthStateChange] Background syncSubscriptionStatus failed:', syncErr);
                }

                // C. Global UI Update (Icon, Text)
                const btnAuthToggles = document.querySelectorAll('.auth-toggle-btn');
                btnAuthToggles.forEach(btnAuthToggle => {
                    const authText = btnAuthToggle.querySelector('.btn-text');
                    const authIcon = btnAuthToggle.querySelector('.material-symbols-outlined');
                    
                    if (user) {
                        const name = user.user_metadata?.full_name || user.email.split('@')[0].toUpperCase();
                        safeStorage.setItem('soundengg_user_display_name', name);
                        if (authText) authText.textContent = name;
                        if (authIcon) authIcon.textContent = 'account_circle';
                        btnAuthToggle.classList.add('logged-in');
                    } else {
                        safeStorage.removeItem('soundengg_user_display_name');
                        if (authText) {
                            authText.textContent = btnAuthToggle.classList.contains('mobile-dropdown-btn') ? 'LOGIN/SIGNUP' : 'LOG IN';
                        }
                        if (authIcon) authIcon.textContent = 'login';
                        btnAuthToggle.classList.remove('logged-in', 'active');
                    }
                });

                // D. Signal Modules to refresh data
                if (event === 'SIGNED_IN') {
                    document.dispatchEvent(new CustomEvent('authSuccess', { detail: session }));
                    console.log('Global authSuccess signal dispatched');
                }
                if (event === 'SIGNED_OUT') {
                    document.dispatchEvent(new CustomEvent('authCleared'));
                    console.log('Global authCleared signal dispatched');
                }
            } catch (err) {
                console.error('[handleAuthStateChange] Error in callback:', err);
            } finally {
                console.groupEnd();
            }
        }, 0);
    }

    if (window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange(handleAuthStateChange);
        // Run once on init (Senior Fix: always trigger to sync UI even if logged out)
        window.supabaseClient.auth.getSession().then(({data}) => {
            handleAuthStateChange('INITIAL_SESSION', data.session);
        });

        // Safari Back-Forward Cache (bfcache) wake-up fix
        window.addEventListener('pageshow', (event) => {
            window.supabaseClient.auth.getSession().then(({data}) => {
                handleAuthStateChange('INITIAL_SESSION', data.session);
            });
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthAndCore);
} else {
    initAuthAndCore();
}

function setupThemeToggle() {
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');
    const htmlEl = document.documentElement;

    btnLight.addEventListener('click', () => {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
        btnLight.classList.add('active');
        btnDark.classList.remove('active');
    });

    btnDark.addEventListener('click', () => {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        btnDark.classList.add('active');
        btnLight.classList.remove('active');
    });
}

function applyAutoTheme() {
    const hour = new Date().getHours();
    const isDayTime = hour >= 6 && hour < 18; // Day: 6 AM to 6 PM
    
    const htmlEl = document.documentElement;
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');

    if (isDayTime) {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
        btnLight.classList.add('active');
        btnDark.classList.remove('active');
    } else {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        btnDark.classList.add('active');
        btnLight.classList.remove('active');
    }
}


let globalUnitSystem = 'metric'; // 'metric' or 'imperial'
window.isUserPro = false; // Global source of truth for subscription

window.isPremiumActive = function(featureKey) {
    if (window.isUserPro) return true;
    
    // Check specific feature unlock
    if (featureKey) {
        const tempFeatureUntil = safeStorage.getItem(`soundengg_temp_pro_until_${featureKey}`);
        if (tempFeatureUntil && Date.now() < parseInt(tempFeatureUntil, 10)) {
            return true;
        }
    }
    
    // Fallback/General: check global temp pro
    const tempProUntil = safeStorage.getItem('soundengg_temp_pro_until');
    if (tempProUntil && Date.now() < parseInt(tempProUntil, 10)) {
        return true;
    }
    
    return false;
};

window.isBlogUnlocked = function(articleId) {
    if (window.isUserPro) return true;
    const globalUntil = safeStorage.getItem('soundengg_temp_pro_until');
    if (globalUntil && Date.now() < parseInt(globalUntil, 10)) return true;
    const blogUntil = safeStorage.getItem(`soundengg_temp_pro_until_blog_${articleId}`);
    if (blogUntil && Date.now() < parseInt(blogUntil, 10)) return true;
    return false;
};

window.updatePremiumUI = function() {
    const isAnyPro = window.isUserPro || 
                     ['spectrogram', 'snapshots', 'mic_calibration', 'ear_training'].some(k => window.isPremiumActive(k));
    
    // Sync Pro navigation badge
    const profileTierBadge = document.getElementById('profile-tier-badge');
    const btnProfileUpgrade = document.getElementById('btn-profile-upgrade');
    if (profileTierBadge) {
        if (window.isUserPro) {
            profileTierBadge.textContent = 'PRO TIER';
            profileTierBadge.className = 'tier-badge pro';
        } else if (isAnyPro) {
            // Check if it's the global full-pro active, or a specific feature unlock
            const hasGlobalPro = safeStorage.getItem('soundengg_temp_pro_until') && Date.now() < parseInt(safeStorage.getItem('soundengg_temp_pro_until'), 10);
            if (hasGlobalPro) {
                profileTierBadge.textContent = '🎁 TEMP PRO (ALL)';
            } else {
                const activeFeatures = ['spectrogram', 'snapshots', 'mic_calibration', 'ear_training']
                    .filter(k => {
                        const tempFeatureUntil = safeStorage.getItem(`soundengg_temp_pro_until_${k}`);
                        return tempFeatureUntil && Date.now() < parseInt(tempFeatureUntil, 10);
                    });
                if (activeFeatures.length === 1) {
                    const featureNames = {
                        'spectrogram': 'SPECTRO',
                        'snapshots': 'SNAPSHOTS',
                        'mic_calibration': 'MIC CAL',
                        'ear_training': 'EAR TRAIN'
                    };
                    profileTierBadge.textContent = `🎁 TEMP PRO (${featureNames[activeFeatures[0]] || 'FEATURE'})`;
                } else if (activeFeatures.length > 1) {
                    profileTierBadge.textContent = `🎁 TEMP PRO (${activeFeatures.length} FEATURES)`;
                } else {
                    profileTierBadge.textContent = '🎁 TEMP PRO';
                }
            }
            profileTierBadge.className = 'tier-badge pro';
        } else {
            profileTierBadge.textContent = 'FREE TIER';
            profileTierBadge.className = 'tier-badge free';
        }
    }
    if (btnProfileUpgrade) {
        btnProfileUpgrade.style.display = window.isUserPro ? 'none' : 'inline-block';
    }

    // Hide locks/overlays
    const isFullProActive = window.isUserPro || (safeStorage.getItem('soundengg_temp_pro_until') && Date.now() < parseInt(safeStorage.getItem('soundengg_temp_pro_until'), 10));
    if (isFullProActive) {
        const adOverlay = document.getElementById('ad-manager-overlay');
        const adLockModal = document.getElementById('ad-lock-modal');
        const appContent = document.querySelector('.main-content');
        const sidebar = document.querySelector('.top-bar');
        
        if (adOverlay) adOverlay.classList.add('hidden');
        if (adLockModal) adLockModal.classList.add('hidden');
        if (appContent) appContent.classList.remove('app-blurred');
        if (sidebar) sidebar.classList.remove('app-blurred');
        
        // Collapse all AdSense slots completely
        document.querySelectorAll('.adsbygoogle, .ad-banner-bottom, .ad-placeholder, #bottom-sponsor-banner').forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none';
        });
    }

    // Sync specific modules
    if (typeof syncProLockUI === 'function') {
        syncProLockUI();
    }
    if (typeof renderSnapshotSlots === 'function') {
        renderSnapshotSlots();
    }
};

function getDeviceMetadata() {
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    if (ua.indexOf('Win') !== -1) os = 'Windows';
    else if (ua.indexOf('Mac') !== -1) os = 'macOS';
    else if (ua.indexOf('X11') !== -1) os = 'Linux';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux';
    else if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) os = 'iOS';
    else if (ua.indexOf('Android') !== -1) os = 'Android';

    let browser = 'Unknown Browser';
    if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
    else if (ua.indexOf('SamsungBrowser') !== -1) browser = 'Samsung Browser';
    else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) browser = 'Opera';
    else if (ua.indexOf('Trident') !== -1) browser = 'Internet Explorer';
    else if (ua.indexOf('Edge') !== -1 || ua.indexOf('Edg') !== -1) browser = 'Edge';
    else if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') !== -1) browser = 'Safari';

    return { os, browser };
}

function parseDeviceString(deviceStr) {
    if (!deviceStr) return null;
    const parts = deviceStr.split('|');
    const id = parts[0];
    const os = parts[1] || 'Legacy OS';
    const browser = parts[2] || 'Legacy Browser';
    const lastActive = parts[3] ? parseInt(parts[3], 10) : Date.now();
    return { id, os, browser, lastActive, raw: deviceStr };
}

async function syncSubscriptionStatus(session) {
    if (!window.supabaseClient) return;
    if (!session) {
        window.isUserPro = false;
        document.dispatchEvent(new CustomEvent('proStatusChanged', { detail: false }));
        return;
    }

    try {
        const user = session.user;
        if (user) {
            const emailDisplay = document.getElementById('profile-email-display');
            if (emailDisplay) emailDisplay.textContent = user.email;
        }

        // Try to fetch securely with a resilient retry loop to eliminate the JWT/RLS timing race condition.
        // We query the database up to 4 times (spaced 200ms apart) to allow session headers to fully register.
        // We do not need the client-side defensive insert because the database trigger 'handle_new_user'
        // already guarantees that every active user has an associated row in 'public.profiles'.
        let data = null;
        let error = null;

        for (let attempt = 1; attempt <= 4; attempt++) {
            const response = await window.supabaseClient
                .from('profiles')
                .select('is_pro, subscription_tier, subscription_expires_at, subscription_provider, subscription_id, full_name, company, device_ids')
                .eq('id', session.user.id)
                .maybeSingle();
            
            data = response.data;
            error = response.error;

            if (data) {
                console.log(`[syncSubscriptionStatus] Profile successfully loaded on attempt ${attempt}/4.`);
                break;
            }

            // Omission Fallback: If device_ids column does not exist in user's Supabase DB, fetch all other fields cleanly
            if (error && (error.code === '42703' || error.message.includes('not found') || error.message.includes('column'))) {
                console.warn('[syncSubscriptionStatus] Column error detected. Retrying profile fetch without device_ids...');
                const responseNoDevices = await window.supabaseClient
                    .from('profiles')
                    .select('is_pro, subscription_tier, subscription_expires_at, subscription_provider, subscription_id, full_name, company')
                    .eq('id', session.user.id)
                    .maybeSingle();
                
                if (responseNoDevices.data) {
                    data = responseNoDevices.data;
                    error = null;
                    console.log(`[syncSubscriptionStatus] Profile loaded successfully without device_ids on attempt ${attempt}/4.`);
                    break;
                }
            }

            if (attempt < 4) {
                console.warn(`[syncSubscriptionStatus] Profile fetch returned empty (attempt ${attempt}/4). Retrying in 200ms...`);
                await new Promise(r => setTimeout(r, 200));
            }
        }

        // Defensive creation of profile row on the fly if it does not exist in public.profiles
        if (!data) {
            console.log('[syncSubscriptionStatus] Profile row not found in database. Creating defensively on the fly...');
            try {
                const defaultProfile = {
                    id: session.user.id,
                    email: session.user.email,
                    is_pro: false,
                    subscription_tier: 'free',
                    full_name: 'EMPTY',
                    company: 'EMPTY'
                };
                const { error: insertErr } = await window.supabaseClient
                    .from('profiles')
                    .insert([defaultProfile]);
                
                if (!insertErr) {
                    console.log('[syncSubscriptionStatus] Profile row successfully created client-side.');
                    data = defaultProfile;
                } else {
                    console.warn('[syncSubscriptionStatus] Client-side profile insert error:', insertErr.message);
                }
            } catch (insertEx) {
                console.error('[syncSubscriptionStatus] Exception during client-side profile creation:', insertEx);
            }
        }

        if (error && !data) {
            console.warn('Profile fetch error (might be schema cache):', error.message);
            // Ultra Fallback: try fetching just is_pro if everything else fails
            const { data: fallbackData } = await window.supabaseClient
                .from('profiles')
                .select('is_pro')
                .eq('id', session.user.id)
                .maybeSingle();
            if (fallbackData) {
                window.isUserPro = !!fallbackData.is_pro;
                data = { is_pro: fallbackData.is_pro };
            }
        }

        if (data) {
            // Check device limits (Max 3 concurrent devices)
            let deviceIds = data.device_ids || [];
            if (!Array.isArray(deviceIds)) {
                try {
                    deviceIds = typeof deviceIds === 'string' ? JSON.parse(deviceIds) : [];
                } catch(e) {
                    deviceIds = [];
                }
            }
            
            let currentClientId = safeStorage.getItem('soundengg_device_id');
            if (!currentClientId) {
                currentClientId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
                safeStorage.setItem('soundengg_device_id', currentClientId);
            }
            
            const meta = getDeviceMetadata();
            const currentDeviceStr = `${currentClientId}|${meta.os}|${meta.browser}|${Date.now()}`;
            
            const findDeviceIndex = (list, clientId) => {
                return list.findIndex(item => item.split('|')[0] === clientId);
            };
            const existingIdx = findDeviceIndex(deviceIds, currentClientId);
            
            if (data.hasOwnProperty('device_ids') && existingIdx === -1) {
                if (deviceIds.length < 3) {
                    deviceIds.push(currentDeviceStr);
                    try {
                        const { error: devUpdateErr } = await window.supabaseClient
                            .from('profiles')
                            .update({ device_ids: deviceIds })
                            .eq('id', session.user.id);
                        if (devUpdateErr) throw devUpdateErr;
                    } catch (e) {
                        console.warn('[syncSubscriptionStatus] Bypassing device_ids update due to missing column:', e.message);
                    }
                } else {
                    // Trigger instant session lock overlay
                    const deviceLimitModal = document.getElementById('device-limit-modal');
                    const deviceListContainer = document.getElementById('device-limit-list');
                    const errDisplay = document.getElementById('device-limit-error');
                    
                    if (deviceLimitModal) {
                        deviceLimitModal.classList.remove('hidden');
                        deviceLimitModal.style.display = 'flex';
                    }
                    
                    // Render Device List for Selective Deauthorization
                    if (deviceListContainer) {
                        deviceListContainer.innerHTML = '';
                        
                        deviceIds.forEach((devStr) => {
                            const dev = parseDeviceString(devStr);
                            if (!dev) return;
                            
                            const item = document.createElement('div');
                            item.style.cssText = `
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                background: rgba(255, 255, 255, 0.03);
                                border: 1px solid rgba(255, 255, 255, 0.08);
                                padding: 0.75rem 1rem;
                                border-radius: 6px;
                                margin-bottom: 0.5rem;
                            `;
                            
                            const details = document.createElement('div');
                            details.style.cssText = `
                                display: flex;
                                flex-direction: column;
                                text-align: left;
                            `;
                            
                            const name = document.createElement('span');
                            name.style.cssText = 'font-weight: bold; font-size: 0.9rem; color: #fff;';
                            name.textContent = `${dev.browser} on ${dev.os}`;
                            
                            const activeTime = document.createElement('span');
                            activeTime.style.cssText = 'font-size: 0.75rem; color: var(--text-dim); margin-top: 0.2rem;';
                            activeTime.textContent = `Last Active: ${new Date(dev.lastActive).toLocaleString()}`;
                            
                            details.appendChild(name);
                            details.appendChild(activeTime);
                            
                            const deauthBtn = document.createElement('button');
                            deauthBtn.className = 'rugged-btn-sm';
                            deauthBtn.style.cssText = 'background: #ff3333; color: #fff; border: none; padding: 6px 12px; font-size: 0.75rem; font-weight: bold; border-radius: 4px; cursor: pointer;';
                            deauthBtn.textContent = 'DEAUTHORIZE';
                            
                            deauthBtn.onclick = async () => {
                                deauthBtn.disabled = true;
                                deauthBtn.textContent = 'WAIT...';
                                if (errDisplay) errDisplay.style.display = 'none';
                                
                                try {
                                    // Remove selected device, append current device metadata
                                    const updatedDevices = deviceIds
                                        .filter(d => d.split('|')[0] !== dev.id);
                                    updatedDevices.push(currentDeviceStr);
                                    
                                    const { error: updateErr } = await window.supabaseClient
                                        .from('profiles')
                                        .update({ device_ids: updatedDevices })
                                        .eq('id', session.user.id);
                                        
                                    if (updateErr) throw updateErr;
                                    
                                    // Success: Hide and reload
                                    if (deviceLimitModal) deviceLimitModal.classList.add('hidden');
                                    window.location.reload();
                                } catch (err) {
                                    console.error('[syncSubscriptionStatus] Selective deauth failed:', err.message);
                                    deauthBtn.disabled = false;
                                    deauthBtn.textContent = 'DEAUTHORIZE';
                                    if (errDisplay) {
                                        errDisplay.textContent = 'Failed to deauthorize device: ' + err.message;
                                        errDisplay.style.display = 'block';
                                    }
                                }
                            };
                            
                            item.appendChild(details);
                            item.appendChild(deauthBtn);
                            deviceListContainer.appendChild(item);
                        });
                    }
                    
                    // Wire dynamic deauthorize-all button
                    const btnDeauthorizeAll = document.getElementById('btn-device-limit-deauthorize-all');
                    if (btnDeauthorizeAll) {
                        btnDeauthorizeAll.onclick = async () => {
                            btnDeauthorizeAll.disabled = true;
                            btnDeauthorizeAll.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span> DEAUTHORIZING ALL...';
                            if (errDisplay) errDisplay.style.display = 'none';
                            
                            try {
                                const { error: devUpdateErr } = await window.supabaseClient
                                    .from('profiles')
                                    .update({ device_ids: [currentDeviceStr] })
                                    .eq('id', session.user.id);
                                    
                                if (devUpdateErr) throw devUpdateErr;
                                
                                if (deviceLimitModal) deviceLimitModal.classList.add('hidden');
                                window.location.reload();
                            } catch (e) {
                                console.error('[syncSubscriptionStatus] Deauthorize-all failed:', e.message);
                                btnDeauthorizeAll.disabled = false;
                                btnDeauthorizeAll.textContent = 'DEAUTHORIZE ALL OTHER DEVICES';
                                if (errDisplay) {
                                    errDisplay.textContent = 'Failed to reset sessions: ' + e.message;
                                    errDisplay.style.display = 'block';
                                }
                            }
                        };
                    }
                    
                    // Wire dynamic logout button
                    const btnDeviceLogout = document.getElementById('btn-device-limit-logout');
                    if (btnDeviceLogout) {
                        btnDeviceLogout.onclick = async () => {
                            try {
                                if (deviceLimitModal) deviceLimitModal.classList.add('hidden');
                                await window.supabaseClient.auth.signOut();
                                window.location.reload();
                            } catch (signOutErr) {
                                console.warn('[syncSubscriptionStatus] Manual device-limit signOut failed:', signOutErr);
                                window.location.reload();
                            }
                        };
                    }
                    
                    window.isUserPro = false;
                    if (window.updatePremiumUI) window.updatePremiumUI();
                    return;
                }
            }

            const now = new Date();
            const expiresAt = (data.subscription_expires_at && data.subscription_expires_at !== 'null') ? new Date(data.subscription_expires_at) : null;
            const isExpired = expiresAt && !isNaN(expiresAt.getTime()) && expiresAt < now;

            const isTierPro = data.subscription_tier && data.subscription_tier !== 'free';
            window.isUserPro = !!data.is_pro && isTierPro && !isExpired;
            console.log('Cloud Sync Success. Pro:', window.isUserPro);
            
            const profileTierBadge = document.getElementById('profile-tier-badge');
            const inputFullname = document.getElementById('profile-fullname');
            const inputCompany = document.getElementById('profile-company');
            const btnProfileUpgrade = document.getElementById('btn-profile-upgrade');

            // --- EXPANDED BILLING PORTAL HYDRATION ---
            const subPortalTier = document.getElementById('sub-portal-tier');
            const rowSubBilling = document.getElementById('row-sub-billing');
            const subBillingLabel = document.getElementById('sub-billing-label');
            const subPortalDate = document.getElementById('sub-portal-date');
            const rowSubProvider = document.getElementById('row-sub-provider');
            const subPortalProvider = document.getElementById('sub-portal-provider');
            const subPortalId = document.getElementById('sub-portal-id');
            const btnSubUpgrade = document.getElementById('btn-sub-upgrade');
            const btnSubManage = document.getElementById('btn-sub-manage');

            const isCancelled = data.subscription_provider === 'razorpay_cancelled';

            if (profileTierBadge) {
                if (window.isUserPro) {
                    const tierName = (data.subscription_tier || 'PRO').toUpperCase();
                    let expiryLabel = '';
                    if (isCancelled) {
                        profileTierBadge.className = 'tier-badge cancelled';
                        if (expiresAt && !isNaN(expiresAt.getTime())) {
                            expiryLabel = ` (Active until: ${expiresAt.toLocaleDateString()})`;
                        }
                        profileTierBadge.textContent = `${tierName} PASS${expiryLabel}`;
                    } else {
                        profileTierBadge.className = 'tier-badge pro';
                        if (expiresAt && !isNaN(expiresAt.getTime())) {
                            expiryLabel = ` (Next billing: ${expiresAt.toLocaleDateString()})`;
                        } else {
                            expiryLabel = ` (LIFETIME)`;
                        }
                        profileTierBadge.textContent = `${tierName} PASS${expiryLabel}`;
                    }
                } else if (window.isPremiumActive()) {
                    profileTierBadge.className = 'tier-badge pro';
                    profileTierBadge.textContent = '🎁 TEMPORARY PRO';
                } else {
                    profileTierBadge.className = 'tier-badge free';
                    profileTierBadge.textContent = 'FREE TIER';
                }
                
                if (btnProfileUpgrade) btnProfileUpgrade.style.display = window.isPremiumActive() ? 'none' : 'inline-block';
            }

            // Hydrate the expanded billing portal card details
            if (subPortalTier) {
                if (window.isUserPro) {
                    const tierClean = (data.subscription_tier || 'PRO').toUpperCase() + ' PASS';
                    subPortalTier.textContent = tierClean;
                    
                    // Expiration/Renewal Row
                    if (rowSubBilling && subBillingLabel && subPortalDate) {
                        if (expiresAt && !isNaN(expiresAt.getTime())) {
                            rowSubBilling.style.display = 'flex';
                            subPortalDate.textContent = expiresAt.toLocaleDateString();
                            
                            if (isCancelled) {
                                subBillingLabel.textContent = 'ACCESS UNTIL';
                                subPortalDate.style.color = '#ffb300'; // Amber
                            } else {
                                subBillingLabel.textContent = 'NEXT RECURRING';
                                subPortalDate.style.color = '#00ffcc'; // Neon cyan/green
                            }
                        } else {
                            rowSubBilling.style.display = 'flex';
                            subBillingLabel.textContent = 'ACCESS UNTIL';
                            subPortalDate.textContent = 'LIFETIME ACCESS';
                            subPortalDate.style.color = '#00ffcc';
                        }
                    }

                    // Provider Reference Row
                    if (rowSubProvider && subPortalProvider && subPortalId && data.subscription_id) {
                        rowSubProvider.style.display = 'flex';
                        subPortalProvider.textContent = data.subscription_provider ? data.subscription_provider.split('_')[0].toUpperCase() : 'GATEWAY';
                        subPortalId.textContent = data.subscription_id;
                    }

                    // Action buttons
                    if (btnSubUpgrade) btnSubUpgrade.style.display = 'none';
                    if (btnSubManage) {
                        btnSubManage.style.display = 'inline-block';
                        
                        if (isCancelled) {
                            btnSubManage.disabled = true;
                            btnSubManage.textContent = 'CANCELLATION PENDING';
                            btnSubManage.className = 'auth-submit-btn outline-warning';
                            btnSubManage.style.opacity = '0.5';
                            btnSubManage.style.cursor = 'not-allowed';
                        } else if (data.subscription_tier === 'lifetime') {
                            btnSubManage.disabled = true;
                            btnSubManage.textContent = 'LIFETIME IS PERMANENT';
                            btnSubManage.className = 'auth-submit-btn outline-warning';
                            btnSubManage.style.opacity = '0.5';
                            btnSubManage.style.cursor = 'not-allowed';
                        } else {
                            btnSubManage.disabled = false;
                            btnSubManage.textContent = 'MANAGE SUBSCRIPTION';
                            btnSubManage.className = 'auth-submit-btn outline-warning';
                            btnSubManage.style.opacity = '1';
                            btnSubManage.style.cursor = 'pointer';
                        }
                    }
                } else {
                    // Free Tier / Temporary Pro
                    subPortalTier.textContent = window.isPremiumActive() ? '🎁 TEMPORARY PRO' : 'FREE TIER';
                    if (rowSubBilling) rowSubBilling.style.display = 'none';
                    if (rowSubProvider) rowSubProvider.style.display = 'none';
                    
                    if (btnSubUpgrade) btnSubUpgrade.style.display = 'inline-block';
                    if (btnSubManage) btnSubManage.style.display = 'none';
                }
            }
            
            // EMERGENCY BYPASS: If premium is active, hide the ad/offline lock immediately
            if (window.isPremiumActive()) {
                const adOverlay = document.getElementById('ad-manager-overlay');
                if (adOverlay) adOverlay.classList.add('hidden');
                
                // Hide all standard Google AdSense and bottom sponsor elements globally
                document.querySelectorAll('.adsbygoogle, .ad-banner-bottom, .ad-placeholder, #bottom-sponsor-banner').forEach(el => {
                    el.classList.add('hidden');
                    el.style.display = 'none';
                });
            }

            if (inputFullname) {
                inputFullname.value = (data.full_name === 'EMPTY' ? '' : data.full_name) || '';
            }
            if (inputCompany) {
                inputCompany.value = (data.company === 'EMPTY' ? '' : data.company) || '';
            }
            
            if (window.updatePremiumUI) window.updatePremiumUI();
            document.dispatchEvent(new CustomEvent('proStatusChanged', { detail: window.isPremiumActive() }));
        }
    } catch (err) {
        console.error('Fatal Sync Error:', err);
    }
}

function initGlobalUnits() {
    const btnUnit = document.getElementById('btn-delaycalc-unit');
    if (!btnUnit) return;

    function syncUI() {
        if (window.globalUnitSystem === 'metric') {
            btnUnit.dataset.unit = 'metric';
            btnUnit.innerHTML = '<span class="material-symbols-outlined">straighten</span> USE IMPERIAL (FT/°F)';
        } else {
            btnUnit.dataset.unit = 'imperial';
            btnUnit.innerHTML = '<span class="material-symbols-outlined">straighten</span> USE METRIC (M/°C)';
        }
    }

    btnUnit.addEventListener('click', () => {
        const nextSystem = window.globalUnitSystem === 'metric' ? 'imperial' : 'metric';
        window.globalUnitSystem = nextSystem;
        safeStorage.setItem('soundengg-units', nextSystem);
        
        // Also update the global select if it exists
        const unitSelect = document.getElementById('global-unit-select');
        if (unitSelect) unitSelect.value = nextSystem;

        document.dispatchEvent(new CustomEvent('unitsChanged'));
    });

    document.addEventListener('unitsChanged', syncUI);
    syncUI();
}

// --- Cloud Sync UI Manager ---
function updateSyncStatus(status) {
    const el = document.getElementById('sync-status');
    if (!el) return;

    const icon = el.querySelector('.status-icon');
    const text = el.querySelector('.status-text');

    el.classList.remove('syncing', 'error');

    switch (status) {
        case 'syncing':
            el.classList.add('syncing');
            icon.textContent = 'sync';
            text.textContent = 'SAVING...';
            break;
        case 'synced':
            icon.textContent = 'cloud_done';
            text.textContent = 'SYNCED';
            break;
        case 'error':
            el.classList.add('error');
            icon.textContent = 'cloud_off';
            text.textContent = 'OFFLINE';
            break;
        case 'unsaved':
            icon.textContent = 'cloud_upload';
            text.textContent = 'UNSAVED';
            break;
    }
}

// --- Cloud Save Logic (Debounced) ---
let saveTimeout;
async function saveConfigToCloud(type, data) {
    // Only proceed if supabaseClient is available
    if (typeof supabaseClient === 'undefined') return;
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return; // Only sync if logged in

    updateSyncStatus('syncing');
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        try {
            const { error } = await supabaseClient
                .from('user_configs')
                .upsert({ 
                    user_id: session.user.id, 
                    config_type: type, 
                    data: data,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,config_type' });

            if (error) throw error;
            updateSyncStatus('synced');
        } catch (err) {
            console.error('Cloud Sync Error:', err);
            updateSyncStatus('error');
        }
    }, 1500); // 1.5s debounce for industrial feel
}

function setupNavigation() {
    const dashboardView = document.getElementById('dashboard-view');
    const rtaView = document.getElementById('rta-view');
    const authorView = document.getElementById('author-view');
    const moduleView = document.getElementById('module-view');
    const pinoutView = document.getElementById('pinout-view');
    const blogView = document.getElementById('blog-view');
    const siggenView = document.getElementById('siggen-view');
    const earTrainingView = document.getElementById('ear-training-view');
    const tunerView = document.getElementById('tuner-view');
    const subcalcView = document.getElementById('sub-calc-view');
    const tapdelayView = document.getElementById('tap-delay-view');
    
    // IDs for ALL primary views to manage visibility
    const ALL_VIEWS = [dashboardView, rtaView, authorView, moduleView, pinoutView, blogView, siggenView, earTrainingView, tunerView, subcalcView, tapdelayView];

    const btnLaunchRta = document.getElementById('btn-launch-rta');
    const btnLaunchDelay = document.getElementById('btn-launch-delay');
    const btnLaunchTapdelay = document.getElementById('btn-launch-tapdelay');
    const btnLaunchPinout = document.getElementById('btn-launch-pinout');
    const btnLaunchTuner = document.getElementById('btn-launch-tuner');
    const btnLaunchSubcalc = document.getElementById('btn-launch-subcalc');
    
    const btnNavDashboard = document.getElementById('btn-nav-dashboard');
    const btnNavAuthor = document.getElementById('btn-nav-author');
    const btnNavBlog = document.getElementById('btn-nav-blog');
    const btnLaunchEarTraining = document.getElementById('widget-ear-training');
    const backButtons = document.querySelectorAll('.btn-back-home, .btn-back');

    // Mobile Nav Logic
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const topNav = document.querySelector('.top-nav');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');

    function closeMobileMenu() {
        if (topNav) topNav.classList.remove('open');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
    }

    if (btnMobileMenu && topNav && mobileOverlay) {
        btnMobileMenu.addEventListener('click', () => {
            topNav.classList.add('open');
            mobileOverlay.classList.add('active');
        });

        mobileOverlay.addEventListener('click', closeMobileMenu);
        mobileOverlay.addEventListener('touchstart', closeMobileMenu, { passive: true });
    }

    const updateActiveNav = (activeBtn) => {
        if (btnNavDashboard) btnNavDashboard.classList.toggle('active', activeBtn === btnNavDashboard);
        if (btnNavAuthor) btnNavAuthor.classList.toggle('active', activeBtn === btnNavAuthor);
        if (btnNavBlog) btnNavBlog.classList.toggle('active', activeBtn === btnNavBlog);
        
        // Dashboard Widgets don't need active nav classes but we sync them if needed
    };

    // Make showView accessible globally for fallbacks
    window.showView = showView;

    /**
     * Senior View Manager: Ensures ONLY one view is visible at any time.
     */
    function showView(targetView, navButton = null) {
        if (!targetView) return;
        
        // Deactivate inactive loops and generators to save CPU/battery and eliminate sluggishness
        if (targetView !== rtaView && typeof window.stopAnalyzer === 'function') {
            window.stopAnalyzer();
        }
        if (targetView !== tunerView && typeof window.stopTuner === 'function') {
            window.stopTuner();
        }
        if (targetView !== siggenView && typeof window.stopSignalGenerator === 'function') {
            window.stopSignalGenerator();
        }
        if (targetView !== earTrainingView && typeof window.stopEarTraining === 'function') {
            window.stopEarTraining();
        }
        
        // Hide ALL other views first
        ALL_VIEWS.forEach(v => {
            if (v) v.style.display = 'none';
        });

        // Show target
        targetView.style.display = 'block';
        targetView.style.opacity = '1'; // Ensure visibility for animation-driven layouts
        
        // Handle Nav Highlights
        updateActiveNav(navButton);
        
        // Auto-close mobile menu when navigating
        closeMobileMenu();
        
        // Common Reset
        window.scrollTo(0, 0);
        if (typeof window.syncMobileNavDropdownLabel === 'function') {
            window.syncMobileNavDropdownLabel(targetView.id);
        }

        // Specific View Re-initialization
        if (targetView === rtaView) {
            const canvas = document.getElementById('rta-canvas');
            if (canvas) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        } else if (targetView === tunerView) {
            if (window.resizeTunerCanvas) {
                window.resizeTunerCanvas();
            }
            if (window.drawTunerVisualizer) {
                window.drawTunerVisualizer(null);
            }
        }
    }

    // Dashboard Launcher Listeners
    if (btnLaunchRta) btnLaunchRta.addEventListener('click', () => showView(rtaView));
    if (btnLaunchDelay) btnLaunchDelay.addEventListener('click', () => showView(moduleView));
    if (btnLaunchTapdelay) btnLaunchTapdelay.addEventListener('click', () => showView(tapdelayView));
    if (btnLaunchPinout) btnLaunchPinout.addEventListener('click', () => showView(pinoutView));
    if (btnLaunchTuner) btnLaunchTuner.addEventListener('click', () => showView(tunerView));
    if (btnLaunchSubcalc) btnLaunchSubcalc.addEventListener('click', () => showView(subcalcView));

    const btnLaunchSiggen = document.getElementById('btn-launch-siggen');
    if (btnLaunchSiggen) btnLaunchSiggen.addEventListener('click', () => showView(siggenView));

    if (btnLaunchEarTraining) btnLaunchEarTraining.addEventListener('click', () => showView(earTrainingView));
    
    // Top Navigation Listeners
    if (btnNavDashboard) {
        btnNavDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            showView(dashboardView, btnNavDashboard);
        });
    }

    // btnNavEarTraining removed from logic as it was removed from HTML

    if (btnNavAuthor) {
        btnNavAuthor.addEventListener('click', (e) => {
            e.preventDefault();
            showView(authorView, btnNavAuthor);
        });
    }

    if (btnNavBlog) {
        btnNavBlog.addEventListener('click', (e) => {
            e.preventDefault();
            showView(blogView, btnNavBlog);
            
            // Explicitly Reset Blog to Index state and clear filters
            const blogIndex = document.getElementById('blog-index');
            const blogReader = document.getElementById('blog-reader');
            if (blogIndex && blogReader) {
                blogIndex.style.display = 'grid';
                blogReader.style.display = 'none';
                
                // Clear any active category filtering (Senior Fix)
                const catBtns = document.querySelectorAll('.cat-btn');
                catBtns.forEach(b => b.classList.remove('active'));
                const allBtn = document.querySelector('.cat-btn[data-cat="all"]');
                if (allBtn) allBtn.classList.add('active');
                
                // Trigger re-render of all articles to clear the filter
                if (typeof window.renderBlogList === 'function') {
                    window.renderBlogList('all');
                }
            }
        });
    }

    // Common Back Navigation - Using delegation for robustness
    document.addEventListener('click', (e) => {
        const backBtn = e.target.closest('.btn-back-home, .btn-back');
        if (backBtn) {
            e.preventDefault();
            showView(dashboardView, btnNavDashboard);
        }
    });

    // Settings Toggle Logic (Non-exclusive view)
    const settingsPanel = document.getElementById('settings-panel');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    if (settingsPanel && btnCloseSettings) {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btn-settings, #btn-mobile-settings')) {
                settingsPanel.classList.add('open');
                // Auto close mobile menu on selection
                const menu = document.getElementById('mobile-nav-dropdown-menu');
                const toggleBtn = document.getElementById('btn-mobile-nav-toggle');
                if (menu) menu.style.display = 'none';
                if (toggleBtn) toggleBtn.classList.remove('active');
            }
        });
        btnCloseSettings.addEventListener('click', () => {
            settingsPanel.classList.remove('open');
        });
    }

    // Auth Modal Logic
    const btnAuthToggle = document.getElementById('btn-auth-toggle');
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const btnCloseAuth = document.getElementById('btn-close-auth');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authContents = document.querySelectorAll('.auth-content');
    
    // Profile Modal Elements
    const profileModal = document.getElementById('profile-modal');
    const btnCloseProfile = document.getElementById('btn-close-profile');
    const profileEmailDisplay = document.getElementById('profile-email-display');
    const profileTierBadge = document.getElementById('profile-tier-badge');
    const btnProfileUpgrade = document.getElementById('btn-profile-upgrade');
    const formUpdateProfile = document.getElementById('form-update-profile');
    const formUpdatePassword = document.getElementById('form-update-password');
    const btnProfileSignout = document.getElementById('btn-profile-signout');
    const inputFullname = document.getElementById('profile-fullname');
    const inputCompany = document.getElementById('profile-company');

    // Billing portal & cancellation modal elements
    const btnSubManage = document.getElementById('btn-sub-manage');
    const billingCancelConfirmModal = document.getElementById('billing-cancel-confirm-modal');
    const btnCloseBillingCancel = document.getElementById('btn-close-billing-cancel');
    const btnBillingCancelExecute = document.getElementById('btn-billing-cancel-execute');
    const btnBillingCancelAbort = document.getElementById('btn-billing-cancel-abort');
    const billingCancelError = document.getElementById('billing-cancel-error');

    // Account deletion elements
    const btnProfileDeleteAccount = document.getElementById('btn-profile-delete-account');
    const accountDeleteConfirmModal = document.getElementById('account-delete-confirm-modal');
    const btnCloseAccountDelete = document.getElementById('btn-close-account-delete');
    const btnAccountDeleteExecute = document.getElementById('btn-account-delete-execute');
    const btnAccountDeleteAbort = document.getElementById('btn-account-delete-abort');
    const accountDeleteError = document.getElementById('account-delete-error');

    if (btnAuthToggle) {
        // Handled by global delegation for robustness
        console.log('Auth toggle logic migrated to global delegate');
    }

        // Close Auth Modal
        btnCloseAuth.addEventListener('click', () => {
            closeModal(authModalOverlay);
        });

        // Close on overlay click
        authModalOverlay.addEventListener('click', (e) => {
            if (e.target === authModalOverlay) {
                closeModal(authModalOverlay);
            }
        });

        // Profile Modal Listeners
        if (profileModal) {
            if(btnCloseProfile) {
                btnCloseProfile.addEventListener('click', () => closeModal(profileModal));
            }
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) closeModal(profileModal);
            });

            // Wire Subscription Cancellation handlers inside Profile Modal context
            if (btnSubManage && billingCancelConfirmModal) {
                btnSubManage.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (billingCancelError) {
                        billingCancelError.style.display = 'none';
                        billingCancelError.textContent = '';
                    }
                    openModal(billingCancelConfirmModal);
                });
            }

            if (btnCloseBillingCancel && billingCancelConfirmModal) {
                btnCloseBillingCancel.addEventListener('click', () => closeModal(billingCancelConfirmModal));
            }

            if (btnBillingCancelAbort && billingCancelConfirmModal) {
                btnBillingCancelAbort.addEventListener('click', () => closeModal(billingCancelConfirmModal));
            }

            if (billingCancelConfirmModal) {
                billingCancelConfirmModal.addEventListener('click', (e) => {
                    if (e.target === billingCancelConfirmModal) {
                        closeModal(billingCancelConfirmModal);
                    }
                });
            }

            if (btnBillingCancelExecute && billingCancelConfirmModal) {
                btnBillingCancelExecute.addEventListener('click', async () => {
                    const originalText = btnBillingCancelExecute.textContent;
                    btnBillingCancelExecute.textContent = 'PROCESSING...';
                    btnBillingCancelExecute.disabled = true;
                    if (btnBillingCancelAbort) btnBillingCancelAbort.disabled = true;
                    if (billingCancelError) {
                        billingCancelError.style.display = 'none';
                        billingCancelError.textContent = '';
                    }

                    try {
                        if (!window.supabaseClient) {
                            throw new Error('Supabase client not initialized.');
                        }
                        const { data: { session } } = await window.supabaseClient.auth.getSession();
                        if (!session) {
                            throw new Error('No active session found. Please sign in again.');
                        }

                        const edgeFuncUrl = "https://ewudkzyjcvjxxqpqnqiy.supabase.co/functions/v1/razorpay-checkout";
                        const response = await fetch(edgeFuncUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({
                                action: "cancel_subscription"
                            })
                        });

                        const resData = await response.json();
                        if (!response.ok) {
                            throw new Error(resData.error || "Failed to cancel subscription.");
                        }

                        // Sync state immediately in real-time
                        await syncSubscriptionStatus(session);

                        closeModal(billingCancelConfirmModal);

                        alert("Recurring billing successfully deactivated! Your PRO PASS will remain active until the end of your paid cycle.");
                    } catch (err) {
                        console.error('[Billing Cancellation Error]:', err);
                        if (billingCancelError) {
                            billingCancelError.textContent = err.message || "An unexpected error occurred.";
                            billingCancelError.style.display = 'block';
                        }
                    } finally {
                        btnBillingCancelExecute.textContent = originalText;
                        btnBillingCancelExecute.disabled = false;
                        if (btnBillingCancelAbort) btnBillingCancelAbort.disabled = false;
                    }
                });
            }

            // Wire Account Deletion handlers inside Profile Modal context
            if (btnProfileDeleteAccount && accountDeleteConfirmModal) {
                btnProfileDeleteAccount.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (accountDeleteError) {
                        accountDeleteError.style.display = 'none';
                        accountDeleteError.textContent = '';
                    }
                    openModal(accountDeleteConfirmModal);
                });
            }

            if (btnCloseAccountDelete && accountDeleteConfirmModal) {
                btnCloseAccountDelete.addEventListener('click', () => closeModal(accountDeleteConfirmModal));
            }

            if (btnAccountDeleteAbort && accountDeleteConfirmModal) {
                btnAccountDeleteAbort.addEventListener('click', () => closeModal(accountDeleteConfirmModal));
            }

            if (accountDeleteConfirmModal) {
                accountDeleteConfirmModal.addEventListener('click', (e) => {
                    if (e.target === accountDeleteConfirmModal) {
                        closeModal(accountDeleteConfirmModal);
                    }
                });
            }

            if (btnAccountDeleteExecute && accountDeleteConfirmModal) {
                btnAccountDeleteExecute.addEventListener('click', async () => {
                    btnAccountDeleteExecute.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 1s linear infinite; vertical-align: middle; margin-right: 4px;">sync</span> DELETING...';
                    btnAccountDeleteExecute.disabled = true;
                    if (btnAccountDeleteAbort) btnAccountDeleteAbort.disabled = true;
                    if (accountDeleteError) {
                        accountDeleteError.style.display = 'none';
                        accountDeleteError.textContent = '';
                    }

                    try {
                        if (!window.supabaseClient) {
                            throw new Error('Supabase client not initialized.');
                        }
                        const { data: { session } } = await window.supabaseClient.auth.getSession();
                        if (!session) {
                            throw new Error('No active session found. Please sign in again.');
                        }

                        const edgeFuncUrl = "https://ewudkzyjcvjxxqpqnqiy.supabase.co/functions/v1/delete-account";
                        const response = await fetch(edgeFuncUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${session.access_token}`
                            }
                        });

                        const resData = await response.json();
                        if (!response.ok) {
                            throw new Error(resData.error || "Failed to execute account deletion.");
                        }

                        // Clear local cache completely and safely
                        safeStorage.clear();

                        // Perform signout from client auth pool
                        await window.supabaseClient.auth.signOut();

                        // Close modals
                        closeModal(accountDeleteConfirmModal);
                        if (profileModal) closeModal(profileModal);

                        alert("Account permanently deleted. All synced presets and billing maps have been completely purged.");
                        
                        // Force window reload to return to pristine logged out state
                        window.location.reload();

                    } catch (err) {
                        console.error('[Account Deletion Error]:', err);
                        if (accountDeleteError) {
                            accountDeleteError.textContent = err.message || "An unexpected error occurred.";
                            accountDeleteError.style.display = 'block';
                        }
                    } finally {
                        btnAccountDeleteExecute.innerHTML = '<span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 4px;">delete_forever</span> CONFIRM DELETION';
                        btnAccountDeleteExecute.disabled = false;
                        if (btnAccountDeleteAbort) btnAccountDeleteAbort.disabled = false;
                    }
                });
            }

            if (formUpdateProfile) {
                formUpdateProfile.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const submitBtn = formUpdateProfile.querySelector('button[type="submit"]');
                    const originalText = submitBtn.textContent;
                    submitBtn.textContent = 'SAVING...';
                    submitBtn.disabled = true;

                    try {
                        const { data: { session } } = await window.supabaseClient.auth.getSession();
                        if (!session) throw new Error('No active user session found.');

                        const { error } = await window.supabaseClient
                            .from('profiles')
                            .update({
                                full_name: inputFullname.value || 'EMPTY',
                                company: inputCompany.value || 'EMPTY'
                            })
                            .eq('id', session.user.id);

                        if (error) throw error;
                        submitBtn.textContent = 'SAVED!';
                        
                        // Update cached user display name instantly!
                        if (inputFullname.value) {
                            const shortName = inputFullname.value.split(' ')[0];
                            safeStorage.setItem('soundengg_user_display_name', shortName);
                            
                            // Synchronize other header buttons across page instantly
                            document.querySelectorAll('.auth-toggle-btn').forEach(btn => {
                                const authText = btn.querySelector('.btn-text');
                                if (authText) authText.textContent = shortName;
                            });
                        }
                    } catch (err) {
                        console.error('Profile Save Error:', err);
                        submitBtn.textContent = 'ERROR';
                    } finally {
                        setTimeout(() => {
                            submitBtn.textContent = originalText;
                            submitBtn.disabled = false;
                        }, 2000);
                    }
                });
            }

            if (formUpdatePassword) {
                formUpdatePassword.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const newPassword = document.getElementById('profile-new-password').value;
                    const msgEl = document.getElementById('password-update-msg');
                    const btn = formUpdatePassword.querySelector('button[type="submit"]');
                    
                    try {
                        btn.textContent = 'UPDATING...';
                        btn.disabled = true;
                        const { data, error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
                        if (error) throw error;
                        
                        msgEl.style.color = '#00ffcc';
                        msgEl.textContent = 'Password updated successfully.';
                        formUpdatePassword.reset();
                    } catch (err) {
                        msgEl.style.color = '#ff4444';
                        msgEl.textContent = err.message;
                    } finally {
                        btn.textContent = 'UPDATE PASSWORD';
                        btn.disabled = false;
                        setTimeout(() => msgEl.textContent = '', 3000);
                    }
                });
            }

            // Wire the gorgeous new Plan Selection Modal
            const planSelectorModal = document.getElementById('plan-selector-modal');
            const btnClosePlanSelector = document.getElementById('btn-close-plan-selector');
            
            if (btnProfileUpgrade && planSelectorModal) {
                btnProfileUpgrade.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (profileModal) closeModal(profileModal);
                    openModal(planSelectorModal);
                });
            }
            
            if (btnClosePlanSelector && planSelectorModal) {
                btnClosePlanSelector.addEventListener('click', () => closeModal(planSelectorModal));
            }
            
            if (planSelectorModal) {
                planSelectorModal.addEventListener('click', (e) => {
                    if (e.target === planSelectorModal) closeModal(planSelectorModal);
                });
                
                // Clicking plan cards inside modal triggers checkout
                planSelectorModal.querySelectorAll('.plan-card-option').forEach(card => {
                    card.addEventListener('click', async () => {
                        const plan = card.getAttribute('data-plan') || 'yearly';
                        closeModal(planSelectorModal);
                        
                        if (window.supabaseClient) {
                            const { data: { session } } = await window.supabaseClient.auth.getSession();
                            if (session) {
                                showCheckoutConfirmModal(session.user, plan);
                            } else {
                                alert('Please sign in or register to complete your purchase.');
                                const authModalOverlay = document.getElementById('auth-modal-overlay');
                                if (authModalOverlay) authModalOverlay.classList.remove('hidden');
                            }
                        } else {
                            alert('Authentication client not initialized.');
                        }
                    });
                });
            }

            if (btnProfileSignout) {
                btnProfileSignout.addEventListener('click', async (e) => {
                    e.preventDefault();
                    console.log('Direct Sign Out Triggered');
                    
                    if (!window.supabaseClient) {
                        alert('DEBUG: Supabase Client not found. Forcing logout...');
                        window.location.href = 'index.html?force=true';
                        return;
                    }

                    try {
                        // Deauthorize this device from database to free up concurrent slot
                        const currentClientId = safeStorage.getItem('soundengg_device_id');
                        if (currentClientId && window.supabaseClient) {
                            try {
                                const { data: { session } } = await window.supabaseClient.auth.getSession();
                                if (session) {
                                    const { data: profile } = await window.supabaseClient
                                        .from('profiles')
                                        .select('device_ids')
                                        .eq('id', session.user.id)
                                        .maybeSingle();
                                    
                                    if (profile && profile.device_ids) {
                                        let deviceIds = profile.device_ids || [];
                                        if (!Array.isArray(deviceIds)) {
                                            try {
                                                deviceIds = typeof deviceIds === 'string' ? JSON.parse(deviceIds) : [];
                                            } catch(e) {
                                                deviceIds = [];
                                            }
                                        }
                                        const updatedDevices = deviceIds.filter(d => d.split('|')[0] !== currentClientId);
                                        await window.supabaseClient
                                            .from('profiles')
                                            .update({ device_ids: updatedDevices })
                                            .eq('id', session.user.id);
                                        console.log('Device successfully deauthorized on voluntary sign out.');
                                    }
                                }
                            } catch (dbErr) {
                                console.warn('Could not deauthorize device from DB during sign out:', dbErr);
                            }
                        }

                        // 1. Unregister all service workers to clear offline caches/state completely
                        if ('serviceWorker' in navigator) {
                            try {
                                const registrations = await navigator.serviceWorker.getRegistrations();
                                for (let registration of registrations) {
                                    await registration.unregister();
                                    console.log('Service Worker unregistered during sign out');
                                }
                            } catch (swErr) {
                                console.warn('Failed to unregister Service Worker:', swErr);
                            }
                        }

                        // 2. Clear local storage and session cache immediately
                        safeStorage.clear();
                        sessionStorage.clear();

                        // 3. Fire Supabase signOut asynchronously so a network/ServiceWorker hang doesn't block the client
                        try {
                            window.supabaseClient.auth.signOut().catch(e => {
                                console.warn('Background signOut failed:', e);
                            });
                        } catch (e) {
                            console.warn('Background signOut invocation failed:', e);
                        }

                        alert('Sign out successful! Returning to landing page.');
                        window.location.assign('index.html?logout=true&t=' + Date.now());
                    } catch (err) {
                        console.error('Sign out error:', err);
                        window.location.assign('index.html?force=true');
                    }
                });
            }
        }

        // Tab Switching
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = `tab-${tab.getAttribute('data-tab')}`;
                authTabs.forEach(t => t.classList.remove('active'));
                authContents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(targetId).classList.add('active');
            });
        });

        // REAL Supabase Auth Submissions
        const formLogin = document.getElementById('form-login');
        const formSignup = document.getElementById('form-signup');

        if (formLogin) {
            formLogin.addEventListener('submit', async (e) => {
                e.preventDefault();
                if(!window.supabaseClient) return alert('Auth not configured.');
                
                const email = formLogin.querySelector('input[type="email"]').value;
                const password = formLogin.querySelector('input[type="password"]').value;
                const btn = formLogin.querySelector('.auth-submit-btn');

                try {
                    btn.textContent = 'Verifying...';
                    btn.disabled = true;
                    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    closeModal(authModalOverlay);
                } catch (error) {
                    alert('Login failed: ' + error.message);
                } finally {
                    btn.textContent = 'Log In';
                    btn.disabled = false;
                }
            });
        }

        if (formSignup) {
            formSignup.addEventListener('submit', async (e) => {
                e.preventDefault();
                if(!window.supabaseClient) return alert('Auth not configured.');
                
                const email = formSignup.querySelector('input[type="email"]').value;
                const password = formSignup.querySelector('input[type="password"]').value;
                const btn = formSignup.querySelector('.auth-submit-btn');

                try {
                    btn.textContent = 'Creating...';
                    btn.disabled = true;
                    const { data, error } = await window.supabaseClient.auth.signUp({ email, password });
                    if (error) throw error;
                    closeModal(authModalOverlay);
                    alert('Account created! You can now log in.');
                } catch (error) {
                    alert('Signup failed: ' + error.message);
                } finally {
                    btn.textContent = 'Create Account';
                    btn.disabled = false;
                }
            });
        }
        
        // REAL Google Auth
        const btnGoogle = document.getElementById('btn-google-auth');
        if (btnGoogle) {
            btnGoogle.addEventListener('click', async () => {
                if(!window.supabaseClient) return alert('Auth not configured.');
                
                try {
                    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: window.location.origin + window.location.pathname
                        }
                    });
                    if(error) throw error;
                    // Supabase redirects to Google, so we don't hide the modal manually here.
                } catch (error) {
                    alert('Google login failed: ' + error.message);
                }
            });
        }


    // Gallery Zoom Logic
    const galleryBoxes = document.querySelectorAll('.gallery-img-box');
    const zoomOverlay = document.getElementById('image-zoom-overlay');
    const zoomImageView = document.getElementById('zoom-image-view');
    const btnCloseZoom = document.getElementById('btn-close-zoom');

    if (zoomOverlay && zoomImageView && btnCloseZoom) {
        galleryBoxes.forEach(box => {
            box.addEventListener('click', () => {
                // Extract background-image url from inline style
                const bgImage = box.style.backgroundImage;
                if (bgImage) {
                    // Extract url string: url("...")
                    const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
                    if (urlMatch && urlMatch[1]) {
                        zoomImageView.src = urlMatch[1];
                        zoomOverlay.classList.remove('hidden');
                        zoomOverlay.style.display = 'flex';
                    }
                }
            });
        });

        // Close logic
        const closeZoomModal = () => {
            zoomOverlay.classList.add('hidden');
            zoomOverlay.style.display = 'none';
            setTimeout(() => { zoomImageView.src = ''; }, 300); // clear src after hide
        };

        btnCloseZoom.addEventListener('click', closeZoomModal);
        zoomOverlay.addEventListener('click', (e) => {
            if(e.target === zoomOverlay) closeZoomModal();
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !zoomOverlay.classList.contains('hidden')) {
                closeZoomModal();
            }
        });
    }

    // --- DEEP LINKING / URL ROUTING ---
    function handleDeepLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view') || window.location.hash.substring(1);
        
        if (viewParam) {
            // Mapping of view keys to their DOM elements
            const viewMap = {
                'rta': rtaView,
                'delay': moduleView,
                'pinout': pinoutView,
                'tuner': tunerView,
                'subcalc': subcalcView,
                'siggen': siggenView,
                'ear-training': earTrainingView,
                'author': authorView,
                'blog': blogView
            };

            const target = viewMap[viewParam];
            if (target) {
                // Determine which nav button to highlight if any
                let navBtn = null;
                if (viewParam === 'author') navBtn = btnNavAuthor;
                if (viewParam === 'blog') navBtn = btnNavBlog;
                
                // Small timeout ensures all other DOM initializations are settled
                setTimeout(() => {
                    showView(target, navBtn);
                    console.log(`Deep link triggered: ${viewParam}`);
                }, 100);
            }
        }
    }

    // Run on load and on hash change
    handleDeepLink();
    window.addEventListener('hashchange', handleDeepLink);
}

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

        if (globalUnitSystem === 'metric') {
            if (distLabel) distLabel.textContent = 'Distance (m)';
            const tempC = (tUnit === 'F') ? (temp - 32) * 5/9 : temp;
            const speed = 331.3 + (0.606 * tempC);
            delayMs = (dist / speed) * 1000;
        } else {
            if (distLabel) distLabel.textContent = 'Distance (ft)';
            const tempF = (tUnit === 'C') ? (temp * 9/5) + 32 : temp;
            const speed = 1052.3 + (1.106 * tempF);
            delayMs = (dist / speed) * 1000;
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

const RTA_BARS_COUNT = 24;
function initRTA() {
    const container = document.getElementById('rta-bars');
    for (let i = 0; i < RTA_BARS_COUNT; i++) {
        const bar = document.createElement('div');
        bar.className = 'rta-bar';
        // Base opacity mapped to standard
        bar.style.opacity = Math.random() * 0.5 + 0.3;
        bar.style.height = `${Math.random() * 100}%`;
        container.appendChild(bar);
    }
}

function updateRTA() {
    const bars = document.querySelectorAll('.rta-bar');
    bars.forEach(bar => {
        // Mock random frequency activity
        const val = Math.max(10, Math.min(100, parseFloat(bar.style.height) + (Math.random() * 30 - 15)));
        bar.style.height = `${val}%`;
        bar.style.opacity = val / 100 + 0.2;
    });
}


function updateCPU() {
    const cpuVal = Math.floor(Math.random() * 15) + 5;
    const cpuEl = document.getElementById('cpu-load');
    cpuEl.textContent = `${cpuVal}%`;
    if (cpuVal > 15) {
        cpuEl.style.color = 'var(--primary)';
    } else {
        cpuEl.style.color = 'var(--text-main)';
    }
}

// --- PINOUT COMPONENT LOGIC ---

const PINOUT_DATA = [
  {id:'xlr3',name:'XLR 3-pin',cat:'analog',tag:'Balanced mic/line',color:'#378ADD',desc:'The industry standard balanced audio connector. Used for microphones, line-level balanced signals, and DMX lighting (not recommended for DMX — use XLR 5-pin instead). Pin 2 is "hot" per IEC standard.',
   pins:[{n:'1',sig:'Ground / shield',color:'#888780',note:'Cable screen / chassis ground'},
         {n:'2',sig:'Hot (+)',color:'#E24B4A',note:'Positive / non-inverting signal'},
         {n:'3',sig:'Cold (−)',color:'#ffffff',note:'Negative / inverting signal',border:'#cccccc'}],
   uses:['Microphone','Line level','Balanced send','AES/EBU digital'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#444" stroke-width="1.5"/><circle cx="40" cy="25" r="8" fill="#888780" stroke="#666" stroke-width="1"/><text x="40" y="29" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">1</text><circle cx="22" cy="56" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="60" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">2</text><circle cx="58" cy="56" r="8" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="58" y="60" text-anchor="middle" fill="#333" font-size="10" font-weight="500">3</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Female (front)</text></svg>`
  },
  {id:'xlr5',name:'XLR 5-pin',cat:'digital',tag:'DMX / AES stereo',color:'#7F77DD',desc:'5-pin XLR is the professional standard for DMX512 lighting control. Also used for stereo AES/EBU digital audio (two channels in one connector) and some stereo microphone/intercom systems.',
   pins:[{n:'1',sig:'Ground / shield',color:'#888780',note:'Common ground'},
         {n:'2',sig:'Data − (DMX) / AES Ch1 −',color:'#E24B4A',note:'DMX negative data line'},
         {n:'3',sig:'Data + (DMX) / AES Ch1 +',color:'#ffffff',note:'DMX positive data line',border:'#cccccc'},
         {n:'4',sig:'Data − Ch2 (AES)',color:'#1D9E75',note:'Second data channel −'},
         {n:'5',sig:'Data + Ch2 (AES)',color:'#378ADD',note:'Second data channel +'}],
   uses:['DMX512 lighting','AES/EBU stereo','Intercom','Stereo mic'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#534AB7" stroke-width="1.5"/><circle cx="40" cy="17" r="7" fill="#888780" stroke="#666" stroke-width="1"/><text x="40" y="21" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">1</text><circle cx="20" cy="34" r="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="20" y="38" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">2</text><circle cx="60" cy="34" r="7" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="60" y="38" text-anchor="middle" fill="#333" font-size="9" font-weight="500">3</text><circle cx="26" cy="60" r="7" fill="#1D9E75" stroke="#0F6E56" stroke-width="1"/><text x="26" y="64" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">4</text><circle cx="54" cy="60" r="7" fill="#378ADD" stroke="#185FA5" stroke-width="1"/><text x="54" y="64" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">5</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Female (front)</text></svg>`
  },
  {id:'ts',name:'TS — 6.35mm mono jack',cat:'analog',tag:'Unbalanced mono',color:'#EF9F27',desc:'Two-conductor connector: Tip = signal, Sleeve = ground. Used for unbalanced mono signals such as guitars, bass, and mono line connections. The sleeve also acts as the cable screen.',
   pins:[{n:'T',sig:'Tip — signal (+)',color:'#EF9F27',note:'Mono audio signal'},
         {n:'S',sig:'Sleeve — ground',color:'#888780',note:'Ground and cable screen'}],
   uses:['Guitar/bass instrument','Mono unbalanced line','Effects loops','Amp send'],
   warn:'Unbalanced — susceptible to noise over long cable runs. Max recommended run: ~6m.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="10" y="38" width="60" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect x="10" y="38" width="20" height="14" rx="7" fill="#EF9F27" stroke="#BA7517" stroke-width="1"/><text x="20" y="48" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">T</text><text x="55" y="48" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">Side view</text></svg>`
  },
  {id:'trs',name:'TRS — 6.35mm stereo/balanced',cat:'analog',tag:'Balanced / stereo',color:'#1D9E75',desc:'Three-conductor: Tip = left/hot, Ring = right/cold, Sleeve = ground. Used for balanced mono signals in professional gear, stereo headphones, and insert loops (send/return on one cable).',
   pins:[{n:'T',sig:'Tip — Left / Hot (+)',color:'#E24B4A',note:'Left channel or positive signal'},
         {n:'R',sig:'Ring — Right / Cold (−)',color:'#1D9E75',note:'Right channel or negative signal'},
         {n:'S',sig:'Sleeve — Ground',color:'#888780',note:'Ground and cable screen'}],
   uses:['Balanced insert','Stereo headphone','Balanced line','Y-cable source'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="8" y="38" width="64" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect x="8" y="38" width="18" height="14" rx="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><rect x="29" y="38" width="16" height="14" fill="#1D9E75" stroke="#0F6E56" stroke-width="1"/><text x="17" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">T</text><text x="37" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">R</text><text x="58" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">Side view</text></svg>`
  },
  {id:'trs35',name:'3.5mm TRS (mini jack)',cat:'analog',tag:'Consumer stereo',color:'#D4537E',desc:'Miniature version of TRS used in consumer devices — phones, laptops, tablets. Same Tip/Ring/Sleeve layout. TRRS (4-conductor) variants add a microphone pin and are found on smartphones.',
   pins:[{n:'T',sig:'Tip — Left channel',color:'#E24B4A',note:'Left audio'},
         {n:'R',sig:'Ring — Right channel',color:'#1D9E75',note:'Right audio'},
         {n:'S',sig:'Sleeve — Ground',color:'#888780',note:'Common ground'},
         {n:'R2',sig:'(TRRS) Mic / ground',color:'#7F77DD',note:'4th conductor on phone headsets'}],
   uses:['Phone/tablet output','Laptop audio','Consumer playback','TRRS headsets'],
   note:'TRRS pinout varies: CTIA (Apple/Android) vs OMTP (older Nokia). Always verify before wiring.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="14" y="38" width="52" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect x="14" y="38" width="15" height="14" rx="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><rect x="32" y="38" width="12" height="14" fill="#1D9E75" stroke="#0F6E56" stroke-width="1"/><text x="21" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">T</text><text x="38" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">R</text><text x="57" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">3.5mm</text></svg>`
  },
  {id:'rca',name:'RCA (phono) connector',cat:'analog',tag:'Consumer unbalanced',color:'#D85A30',desc:'Unbalanced single-channel connector standard in consumer hi-fi, DJ gear, and home audio. Center pin = signal, outer ring = ground. Always wired in stereo pairs — red (right) and white/black (left).',
   pins:[{n:'C',sig:'Centre pin — signal',color:'#E24B4A',note:'Audio signal'},
         {n:'O',sig:'Outer ring — ground',color:'#888780',note:'Ground / screen'}],
   uses:['DJ mixer phono/line','Consumer hi-fi','CD/media player','Turntable output'],
   warn:'Unbalanced — not suitable for long runs without a DI box. Max recommended: 3–5m.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="28" fill="#1a1a22" stroke="#888" stroke-width="8"/><circle cx="40" cy="45" r="10" fill="#E24B4A" stroke="#c0392b" stroke-width="1.5"/><text x="40" y="49" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">C</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'nl2',name:'Speakon NL2',cat:'speaker',tag:'2-pole speaker',color:'#639922',desc:'2-pole Neutrik Speakon. One speaker channel. The locking twist connector is the safe standard for amplifier-to-speaker runs. Used on smaller PA speakers and some monitors.',
   pins:[{n:'1+',sig:'Positive (+)',color:'#E24B4A',note:'Hot — from amp positive'},
         {n:'1−',sig:'Negative (−)',color:'#1a1a22',note:'Return — from amp negative',border:'#555'}],
   uses:['Passive speakers','Stage monitors','Small PA systems'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect x="28" y="35" width="12" height="18" rx="2" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="34" y="47" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">1+</text><rect x="42" y="35" width="12" height="18" rx="2" fill="#333" stroke="#555" stroke-width="1"/><text x="48" y="47" text-anchor="middle" fill="#aaa" font-size="8" font-weight="500">1−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'nl4',name:'Speakon NL4',cat:'speaker',tag:'4-pole speaker',color:'#639922',desc:'4-pole Neutrik Speakon. Carries two speaker channels (bi-amp) or one channel on 1+/1− with 2+/2− unused. Standard in most professional loudspeaker systems. Never use with live mains voltage.',
   pins:[{n:'1+',sig:'Ch 1 positive',color:'#E24B4A',note:'Low frequency / full range +'},
         {n:'1−',sig:'Ch 1 negative',color:'#1a1a22',note:'Low frequency / full range −',border:'#555'},
         {n:'2+',sig:'Ch 2 positive',color:'#378ADD',note:'High frequency (bi-amp) +'},
         {n:'2−',sig:'Ch 2 negative',color:'#0C447C',note:'High frequency (bi-amp) −'}],
   uses:['Full-range passive speakers','Bi-amp systems','Sub + top runs'],
   note:'For single-amp use: wire 1+/1− only. Leave 2+/2− disconnected or loop through.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect x="24" y="28" width="12" height="15" rx="2" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="30" y="39" text-anchor="middle" fill="#fff" font-size="7" font-weight="500">1+</text><rect x="44" y="28" width="12" height="15" rx="2" fill="#333" stroke="#555" stroke-width="1"/><text x="50" y="39" text-anchor="middle" fill="#aaa" font-size="7" font-weight="500">1−</text><rect x="24" y="48" width="12" height="15" rx="2" fill="#378ADD" stroke="#185FA5" stroke-width="1"/><text x="30" y="59" text-anchor="middle" fill="#fff" font-size="7" font-weight="500">2+</text><rect x="44" y="48" width="12" height="15" rx="2" fill="#0C447C" stroke="#042C53" stroke-width="1"/><text x="50" y="59" text-anchor="middle" fill="#fff" font-size="7" font-weight="500">2−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'nl8',name:'Speakon NL8',cat:'speaker',tag:'8-pole speaker',color:'#639922',desc:'8-pole Neutrik Speakon. Carries up to four independent speaker channels, used for tri-amp or quad systems, or running multiple speakers through one cable from an amp rack. Fully backward compatible with NL4.',
   pins:[{n:'1+/1−',sig:'Ch 1 — LF or full range',color:'#E24B4A',note:'Low frequency channel'},
         {n:'2+/2−',sig:'Ch 2 — MF or HF',color:'#378ADD',note:'Mid or high frequency'},
         {n:'3+/3−',sig:'Ch 3 — subwoofer or aux',color:'#1D9E75',note:'Third amplifier channel'},
         {n:'4+/4−',sig:'Ch 4 — aux / spare',color:'#7F77DD',note:'Fourth channel or loop through'}],
   uses:['Tri-amp systems','Multi-way loudspeakers','Amp rack multicore'],
   note:'NL8 sockets also accept NL4 and NL2 plugs — only the matching pins connect.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect x="16" y="26" width="10" height="12" rx="1" fill="#E24B4A"/><text x="21" y="36" text-anchor="middle" fill="#fff" font-size="7">1+</text><rect x="28" y="26" width="10" height="12" rx="1" fill="#c0392b"/><text x="33" y="36" text-anchor="middle" fill="#fff" font-size="7">1−</text><rect x="42" y="26" width="10" height="12" rx="1" fill="#378ADD"/><text x="47" y="36" text-anchor="middle" fill="#fff" font-size="7">2+</text><rect x="54" y="26" width="10" height="12" rx="1" fill="#185FA5"/><text x="59" y="36" text-anchor="middle" fill="#fff" font-size="7">2−</text><rect x="16" y="52" width="10" height="12" rx="1" fill="#1D9E75"/><text x="21" y="62" text-anchor="middle" fill="#fff" font-size="7">3+</text><rect x="28" y="52" width="10" height="12" rx="1" fill="#0F6E56"/><text x="33" y="62" text-anchor="middle" fill="#fff" font-size="7">3−</text><rect x="42" y="52" width="10" height="12" rx="1" fill="#7F77DD"/><text x="47" y="62" text-anchor="middle" fill="#fff" font-size="7">4+</text><rect x="54" y="52" width="10" height="12" rx="1" fill="#534AB7"/><text x="59" y="62" text-anchor="middle" fill="#fff" font-size="7">4−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'ts-xlr',name:'TS to XLR — unbalanced',cat:'adapter',tag:'Instrument → console',color:'#D85A30',desc:'Connects an unbalanced TS source (guitar, synth, playback device) to an XLR balanced input. Pin 2 carries the signal and pin 3 is tied to pin 1 (ground) to prevent hum. The signal remains unbalanced — no noise rejection gain.',
   pins:[{n:'TS Tip',sig:'→ XLR Pin 2 (hot)',color:'#E24B4A',note:'Signal wire'},
         {n:'TS Sleeve',sig:'→ XLR Pin 1 + Pin 3',color:'#888780',note:'Ground bridged to both pins 1 and 3'}],
   uses:['Guitar DI (no box)','Synth unbalanced out','Media player to console'],
   warn:'Tie pin 3 to pin 1 at the XLR end to avoid hum. Never leave pin 3 floating.',
   svg:`<svg width="160" height="60" viewBox="0 0 160 60"><rect x="4" y="22" width="30" height="14" rx="7" fill="#888780" stroke="#666"/><rect x="4" y="22" width="12" height="14" rx="7" fill="#EF9F27" stroke="#BA7517"/><text x="10" y="32" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">T</text><text x="25" y="32" text-anchor="middle" fill="#fff" font-size="9">S</text><line x1="35" y1="29" x2="60" y2="29" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="35" y1="29" x2="60" y2="46" stroke="#888780" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="80" cy="20" r="7" fill="#888780" stroke="#666" stroke-width="1"/><text x="80" y="24" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">1</text><circle cx="65" cy="44" r="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="65" y="48" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">2</text><circle cx="95" cy="44" r="7" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="95" y="48" text-anchor="middle" fill="#333" font-size="8" font-weight="500">3</text><line x1="60" y1="29" x2="72" y2="21" stroke="#888780" stroke-width="1.5"/><line x1="60" y1="46" x2="57" y2="44" stroke="#E24B4A" stroke-width="1.5"/><line x1="80" y1="27" x2="95" y2="37" stroke="#888780" stroke-width="1" stroke-dasharray="2 2"/><text x="80" y="58" text-anchor="middle" fill="#888" font-size="8">pin 3 tied to pin 1</text></svg>`
  },
  {id:'trs-xlr-bal',name:'TRS to XLR — balanced',cat:'adapter',tag:'Balanced send',color:'#1D9E75',desc:'Fully balanced connection. TRS Tip → XLR Pin 2 (hot), TRS Ring → XLR Pin 3 (cold), TRS Sleeve → XLR Pin 1 (ground). Used to connect balanced TRS outputs (interfaces, consoles) to balanced XLR inputs. Full common-mode noise rejection.',
   pins:[{n:'TRS Tip',sig:'→ XLR Pin 2 (hot +)',color:'#E24B4A',note:'Hot / positive signal'},
         {n:'TRS Ring',sig:'→ XLR Pin 3 (cold −)',color:'#1D9E75',note:'Cold / negative signal'},
         {n:'TRS Sleeve',sig:'→ XLR Pin 1 (ground)',color:'#888780',note:'Shield / ground'}],
   uses:['Interface balanced out','Console insert send','Keyboard/synth balanced','DI box through'],
   note:'This is a true balanced connection — both hot and cold are carried. Best noise rejection of all adapter types.',
   svg:`<svg width="160" height="60" viewBox="0 0 160 60"><rect x="2" y="20" width="42" height="14" rx="7" fill="#888780" stroke="#666"/><rect x="2" y="20" width="13" height="14" rx="7" fill="#E24B4A" stroke="#c0392b"/><rect x="18" y="20" width="11" height="14" fill="#1D9E75" stroke="#0F6E56"/><text x="8" y="30" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">T</text><text x="24" y="30" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">R</text><text x="36" y="30" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">S</text><line x1="44" y1="23" x2="70" y2="44" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="44" y1="27" x2="98" y2="44" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="44" y1="30" x2="84" y2="20" stroke="#888780" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="84" cy="16" r="7" fill="#888780" stroke="#666" stroke-width="1"/><text x="84" y="20" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">1</text><circle cx="70" cy="40" r="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="70" y="44" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">2</text><circle cx="98" cy="40" r="7" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="98" y="44" text-anchor="middle" fill="#333" font-size="8" font-weight="500">3</text></svg>`
  },
  {id:'trs-xlr-insert',name:'TRS to dual XLR — Y insert cable',cat:'adapter',tag:'Console insert loop',color:'#7F77DD',desc:'Y cable with one TRS plug splitting to two XLR connectors — one male (send, from console to outboard) and one female (return, from outboard back to console). TRS Tip = send, TRS Ring = return, Sleeve = ground on both sides.',
   pins:[{n:'TRS Tip',sig:'→ XLR Male Pin 2 (send)',color:'#E24B4A',note:'Console send to outboard input'},
         {n:'TRS Ring',sig:'→ XLR Female Pin 2 (return)',color:'#1D9E75',note:'Outboard output back to console'},
         {n:'TRS Sleeve',sig:'→ XLR Pin 1 both sides',color:'#888780',note:'Ground both connectors'}],
   uses:['Console channel insert','Compressor loop','EQ in-line','Effects processor loop'],
   warn:'Tip = SEND (to outboard IN), Ring = RETURN (from outboard OUT). Swapping these kills the loop.',
   svg:`<svg width="160" height="70" viewBox="0 0 160 70"><rect x="2" y="26" width="40" height="14" rx="7" fill="#888780" stroke="#666"/><rect x="2" y="26" width="13" height="14" rx="7" fill="#E24B4A" stroke="#c0392b"/><rect x="18" y="26" width="10" height="14" fill="#1D9E75" stroke="#0F6E56"/><text x="9" y="36" text-anchor="middle" fill="#fff" font-size="8">T</text><text x="23" y="36" text-anchor="middle" fill="#fff" font-size="8">R</text><text x="36" y="36" text-anchor="middle" fill="#fff" font-size="8">S</text><line x1="42" y1="30" x2="80" y2="16" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="42" y1="34" x2="80" y2="54" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="94" cy="12" r="7" fill="#0C0C0F" stroke="#E24B4A" stroke-width="1.5"/><text x="94" y="16" text-anchor="middle" fill="#E24B4A" font-size="7" font-weight="500">M</text><text x="94" y="26" text-anchor="middle" fill="#888" font-size="7">Send</text><circle cx="94" cy="52" r="7" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="94" y="56" text-anchor="middle" fill="#1D9E75" font-size="7" font-weight="500">F</text><text x="94" y="66" text-anchor="middle" fill="#888" font-size="7">Return</text></svg>`
  },
  {id:'35-xlr',name:'3.5mm TRS to XLR stereo',cat:'adapter',tag:'Phone/laptop → system',color:'#D4537E',desc:'Converts stereo 3.5mm consumer output to two balanced XLR males (L + R). Tip → XLR-L Pin 2, Ring → XLR-R Pin 2, Sleeve → Pin 1 on both XLR connectors. Signal is unbalanced on each XLR output — adequate for short runs.',
   pins:[{n:'3.5mm Tip',sig:'→ XLR Left Pin 2',color:'#E24B4A',note:'Left channel signal'},
         {n:'3.5mm Ring',sig:'→ XLR Right Pin 2',color:'#1D9E75',note:'Right channel signal'},
         {n:'3.5mm Sleeve',sig:'→ XLR (both) Pin 1+3',color:'#888780',note:'Ground, pins 1+3 bridged each side'}],
   uses:['Phone/laptop to PA','DJ backup source','Media player to console'],
   warn:'Output is unbalanced at each XLR. Use a stereo DI box for runs over 5m or in noisy environments.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="20" y="12" width="40" height="12" rx="6" fill="#888780" stroke="#666"/><rect x="20" y="12" width="12" height="12" rx="6" fill="#E24B4A" stroke="#c0392b"/><rect x="34" y="12" width="10" height="12" fill="#1D9E75" stroke="#0F6E56"/><text x="26" y="21" text-anchor="middle" fill="#fff" font-size="8">T</text><text x="39" y="21" text-anchor="middle" fill="#fff" font-size="8">R</text><text x="52" y="21" text-anchor="middle" fill="#fff" font-size="8">S</text><line x1="30" y1="24" x2="20" y2="45" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="50" y1="24" x2="60" y2="45" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="56" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="20" y="60" text-anchor="middle" fill="#378ADD" font-size="7" font-weight="500">L</text><circle cx="60" cy="56" r="9" fill="#1a1a22" stroke="#E24B4A" stroke-width="1.5"/><text x="60" y="60" text-anchor="middle" fill="#E24B4A" font-size="7" font-weight="500">R</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">XLR M × 2</text></svg>`
  },
  {id:'35-rca',name:'3.5mm to stereo RCA',cat:'adapter',tag:'Consumer stereo',color:'#D85A30',desc:'Standard cable for connecting consumer devices (phones, laptops, media players) to DJ mixers or hi-fi amplifiers with RCA inputs. Tip → Red RCA (right), Ring → White/Black RCA (left), Sleeve → ground on both RCAs.',
   pins:[{n:'Tip',sig:'→ RCA Red — Right channel',color:'#E24B4A',note:'Right audio'},
         {n:'Ring',sig:'→ RCA White — Left channel',color:'#1D9E75',note:'Left audio'},
         {n:'Sleeve',sig:'→ RCA outer rings (both)',color:'#888780',note:'Common ground'}],
   uses:['Phone to DJ mixer','Media player to amplifier','Laptop to mixing desk (line)'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="22" y="10" width="36" height="12" rx="6" fill="#888780" stroke="#666"/><rect x="22" y="10" width="11" height="12" rx="6" fill="#E24B4A" stroke="#c0392b"/><rect x="35" y="10" width="9" height="12" fill="#1D9E75" stroke="#0F6E56"/><line x1="30" y1="22" x2="20" y2="46" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="50" y1="22" x2="60" y2="46" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="58" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="20" cy="58" r="4" fill="#fff"/><text x="20" y="74" text-anchor="middle" fill="#E24B4A" font-size="8">R</text><circle cx="60" cy="58" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="60" cy="58" r="4" fill="#fff"/><text x="60" y="74" text-anchor="middle" fill="#888" font-size="8">L</text></svg>`
  },
  {id:'trs-rca',name:'TRS to stereo RCA',cat:'adapter',tag:'Pro to consumer',color:'#D4537E',desc:'Connects a professional TRS stereo output (interface, mixer headphone out, DJ monitor out) to a consumer RCA input. Same wiring as 3.5mm to RCA but with a full-size 6.35mm TRS plug on the pro side.',
   pins:[{n:'TRS Tip',sig:'→ RCA Red (right)',color:'#E24B4A',note:'Right channel'},
         {n:'TRS Ring',sig:'→ RCA White (left)',color:'#1D9E75',note:'Left channel'},
         {n:'TRS Sleeve',sig:'→ RCA outer rings',color:'#888780',note:'Ground both RCAs'}],
   uses:['Interface to monitors (RCA)','DJ booth monitoring','Club install amplifiers'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="14" y="10" width="48" height="12" rx="6" fill="#888780" stroke="#666"/><rect x="14" y="10" width="14" height="12" rx="6" fill="#E24B4A" stroke="#c0392b"/><rect x="30" y="10" width="11" height="12" fill="#1D9E75" stroke="#0F6E56"/><line x1="28" y1="22" x2="20" y2="46" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="52" y1="22" x2="60" y2="46" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="58" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="20" cy="58" r="4" fill="#fff"/><text x="20" y="74" text-anchor="middle" fill="#E24B4A" font-size="8">R</text><circle cx="60" cy="58" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="60" cy="58" r="4" fill="#fff"/><text x="60" y="74" text-anchor="middle" fill="#888" font-size="8">L</text></svg>`
  },
  {id:'rca-xlrm',name:'RCA to male XLR (stereo pair)',cat:'adapter',tag:'Consumer → balanced',color:'#D85A30',desc:'Two RCA connectors to two XLR males. Converts unbalanced consumer outputs to XLR for connecting to PA systems or mixing consoles. RCA centre pin → XLR Pin 2, RCA outer → XLR Pins 1+3 (bridged).',
   pins:[{n:'RCA Red centre',sig:'→ XLR-R Male Pin 2',color:'#E24B4A',note:'Right signal to console'},
         {n:'RCA White centre',sig:'→ XLR-L Male Pin 2',color:'#1D9E75',note:'Left signal to console'},
         {n:'RCA outer (both)',sig:'→ XLR Pin 1 + Pin 3',color:'#888780',note:'Ground, pin 3 bridged to pin 1'}],
   uses:['CD player to PA','Laptop to front-of-house','Media server to console'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="22" cy="20" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="22" cy="20" r="4" fill="#fff"/><circle cx="58" cy="20" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="58" cy="20" r="4" fill="#fff"/><line x1="22" y1="30" x2="20" y2="52" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="58" y1="30" x2="60" y2="52" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="64" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="20" y="68" text-anchor="middle" fill="#fff" font-size="7">XLR</text><circle cx="60" cy="64" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="60" y="68" text-anchor="middle" fill="#fff" font-size="7">XLR</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">L + R male XLR</text></svg>`
  },
  {id:'rca-xlrf',name:'RCA to female XLR (stereo pair)',cat:'adapter',tag:'Consumer to balanced in',color:'#D85A30',desc:'Same wiring as RCA to male XLR but terminates in female XLR connectors. Used when the destination has XLR male pins sticking out (e.g. some amplifiers, powered speakers with XLR male inputs). Less common — verify your destination connector gender first.',
   pins:[{n:'RCA Red centre',sig:'→ XLR-R Female Pin 2',color:'#E24B4A',note:'Right channel input'},
         {n:'RCA White centre',sig:'→ XLR-L Female Pin 2',color:'#1D9E75',note:'Left channel input'},
         {n:'RCA outer (both)',sig:'→ XLR Female Pin 1+3',color:'#888780',note:'Bridged ground'}],
   uses:['Consumer source to amp with male XLR','Broadcast input adapters'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="22" cy="20" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="22" cy="20" r="4" fill="#fff"/><circle cx="58" cy="20" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="58" cy="20" r="4" fill="#fff"/><line x1="22" y1="30" x2="20" y2="52" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="58" y1="30" x2="60" y2="52" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="64" r="9" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="20" y="68" text-anchor="middle" fill="#0F6E56" font-size="7">XLR</text><circle cx="60" cy="64" r="9" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="60" y="68" text-anchor="middle" fill="#0F6E56" font-size="7">XLR</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">L + R female XLR</text></svg>`
  },
  {id:'pcon',name:'PowerCon — general (NAC3)',cat:'power',tag:'Locking mains power',color:'#E24B4A',desc:'Neutrik PowerCon is a twist-locking mains power connector rated at 250V / 16A. The NAC3FCA (blue, IN) and NAC3FCB (grey, OUT) variants are keyed differently — they cannot be cross-connected. Used for powering stage equipment, intelligent lighting, and amplifiers.',
   pins:[{n:'L',sig:'Line (live)',color:'#E24B4A',note:'Brown wire (UK) / Black (US)'},
         {n:'N',sig:'Neutral',color:'#1a1a22',note:'Blue wire (UK) / White (US)',border:'#555'},
         {n:'E',sig:'Earth / ground',color:'#639922',note:'Green-yellow wire'}],
   uses:['Amp rack power','Intelligent lighting','Powered speaker mains','Stage power distro'],
   warn:'DANGER — live mains voltage (230V/120V). Never connect or disconnect under load. Do not use as a breakout connector.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#E24B4A" stroke-width="2"/><circle cx="22" cy="52" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="56" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">L</text><circle cx="58" cy="52" r="8" fill="#222" stroke="#555" stroke-width="1"/><text x="58" y="56" text-anchor="middle" fill="#aaa" font-size="9" font-weight="500">N</text><circle cx="40" cy="30" r="8" fill="#3B6D11" stroke="#639922" stroke-width="1"/><text x="40" y="34" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">E</text><text x="40" y="82" text-anchor="middle" fill="#E24B4A" font-size="8">⚡ mains voltage</text></svg>`
  },
  {id:'pcon-in',name:'PowerCon IN — NAC3FCA (blue)',cat:'power',tag:'Power input',color:'#378ADD',desc:'Blue PowerCon — the input connector. Accepts mains power into equipment. The blue colour and unique key orientation prevents cross-connection with OUT connectors. Wired: L = Line (brown), N = Neutral (blue), E = Earth (green-yellow).',
   pins:[{n:'L',sig:'Line (live) — brown',color:'#E24B4A',note:'Connect to live/line from distro'},
         {n:'N',sig:'Neutral — blue',color:'#1a1a22',note:'Connect to neutral',border:'#555'},
         {n:'E',sig:'Earth — green/yellow',color:'#639922',note:'Always connect earth first'}],
   uses:['Equipment power input','Powered speakers IN','Amplifier mains IN'],
   warn:'Blue = IN (power into device). Grey = OUT (power through device). These are physically keyed and incompatible.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#378ADD" stroke-width="3"/><circle cx="22" cy="52" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="56" text-anchor="middle" fill="#fff" font-size="9">L</text><circle cx="58" cy="52" r="8" fill="#222" stroke="#555" stroke-width="1"/><text x="58" y="56" text-anchor="middle" fill="#aaa" font-size="9">N</text><circle cx="40" cy="30" r="8" fill="#3B6D11" stroke="#639922" stroke-width="1"/><text x="40" y="34" text-anchor="middle" fill="#fff" font-size="9">E</text><text x="40" y="82" text-anchor="middle" fill="#378ADD" font-size="8">Blue — IN</text></svg>`
  },
  {id:'pcon-out',name:'PowerCon OUT — NAC3FCB (grey)',cat:'power',tag:'Power loop-through',color:'#888780',desc:'Grey PowerCon — the output connector. Passes mains power through from one device to the next (daisy-chain / loop-through). Used to feed power from a distribution unit or one device to another. Same L/N/E pinout as the IN connector but physically keyed differently.',
   pins:[{n:'L',sig:'Line (live) — brown',color:'#E24B4A',note:'Loop-through to next device'},
         {n:'N',sig:'Neutral — blue',color:'#1a1a22',note:'Neutral loop-through',border:'#555'},
         {n:'E',sig:'Earth — green/yellow',color:'#639922',note:'Earth continuity through'}],
   uses:['Power distro output','Daisy-chain amplifier power','Dimmer rack output'],
   warn:'Grey = OUT / through. Never use OUT to connect to standard mains sockets.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#888780" stroke-width="3"/><circle cx="22" cy="52" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="56" text-anchor="middle" fill="#fff" font-size="9">L</text><circle cx="58" cy="52" r="8" fill="#222" stroke="#555" stroke-width="1"/><text x="58" y="56" text-anchor="middle" fill="#aaa" font-size="9">N</text><circle cx="40" cy="30" r="8" fill="#3B6D11" stroke="#639922" stroke-width="1"/><text x="40" y="34" text-anchor="middle" fill="#fff" font-size="9">E</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">Grey — OUT</text></svg>`
  },
  {id:'rj45',name:'RJ45 / EtherCon (Ethernet)',cat:'digital',tag:'Network / Dante / AES67',color:'#7F77DD',desc:'8-position 8-contact connector for Ethernet, Dante audio networking, AES67, AVB, and AES/EBU over Cat5e/Cat6. Pin 1+2 = TX pair, Pin 3+6 = RX pair. EtherCon (Neutrik) is the ruggedized, XLR-body version for live and touring use.',
   pins:[{n:'1',sig:'TX+ (transmit)',color:'#E24B4A',note:'White-orange'},
         {n:'2',sig:'TX− (transmit)',color:'#D85A30',note:'Orange'},
         {n:'3',sig:'RX+ (receive)',color:'#1D9E75',note:'White-green'},
         {n:'4',sig:'PoE / unused',color:'#378ADD',note:'Blue'},
         {n:'5',sig:'PoE / unused',color:'#85B7EB',note:'White-blue'},
         {n:'6',sig:'RX− (receive)',color:'#639922',note:'Green'},
         {n:'7',sig:'Unused / PoE',color:'#D4537E',note:'White-brown'},
         {n:'8',sig:'Unused / PoE',color:'#8B4513',note:'Brown'}],
   uses:['Dante audio network','AES67 / AVB','Stage network','EtherCon touring runs'],
   note:'Use Cat5e minimum (Cat6 preferred for Dante). T568B wiring standard for all pro audio networking.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="16" y="20" width="48" height="44" rx="4" fill="#1a1a22" stroke="#7F77DD" stroke-width="1.5"/><rect x="20" y="26" width="5" height="28" rx="1" fill="#E24B4A"/><rect x="27" y="26" width="5" height="28" rx="1" fill="#D85A30"/><rect x="34" y="26" width="5" height="28" rx="1" fill="#1D9E75"/><rect x="41" y="26" width="5" height="28" rx="1" fill="#378ADD"/><rect x="48" y="26" width="5" height="28" rx="1" fill="#85B7EB"/><rect x="55" y="26" width="5" height="28" rx="1" fill="#639922"/><rect x="62" y="26" width="1.5" height="28" rx="1" fill="#D4537E"/><text x="40" y="80" text-anchor="middle" fill="#888" font-size="8">T568B — 8 pins</text></svg>`
  },
  {id:'bnc',name:'BNC — word clock / video sync',cat:'digital',tag:'75Ω coax',color:'#888780',desc:'Bayonet Neill-Concelman connector. Used for word clock distribution (44.1/48/96kHz sync), video sync signals, SPDIF digital audio (75Ω), and MADI (coaxial format). Twist-lock coaxial connector with centre pin (signal) and outer barrel (ground/shield). Requires 75Ω coaxial cable.',
   pins:[{n:'C',sig:'Centre — signal / clock',color:'#EF9F27',note:'Word clock or digital audio signal'},
         {n:'O',sig:'Outer barrel — ground',color:'#888780',note:'Coaxial shield / ground'}],
   uses:['Word clock sync','SPDIF coaxial','MADI coaxial','Video sync / black burst'],
   warn:'Use 75Ω cable only. 50Ω BNC cable causes reflections and sync errors. Always terminate unused word clock outputs with a 75Ω terminator.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="28" fill="#1a1a22" stroke="#888780" stroke-width="6"/><circle cx="40" cy="44" r="10" fill="#EF9F27" stroke="#BA7517" stroke-width="1.5"/><text x="40" y="48" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">75Ω</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">Coax — BNC</text></svg>`
  },
  {id:'midi',name:'DIN 5-pin MIDI',cat:'digital',tag:'MIDI control',color:'#D4537E',desc:'Standard MIDI connector. 5-pin DIN, but only 3 pins are used for standard MIDI. Pin 2 = cable screen/ground, Pin 4 = MIDI current source (+5V through 220Ω), Pin 5 = MIDI data. Pins 1 and 3 are not connected in standard MIDI (used in some proprietary extensions).',
   pins:[{n:'1',sig:'Not connected (NC)',color:'#D3D1C7',note:'Unused in standard MIDI'},
         {n:'2',sig:'Cable screen / shield',color:'#888780',note:'Ground — connect at one end only'},
         {n:'3',sig:'Not connected (NC)',color:'#D3D1C7',note:'Unused in standard MIDI'},
         {n:'4',sig:'+5V source (220Ω)',color:'#E24B4A',note:'Current loop positive'},
         {n:'5',sig:'MIDI data',color:'#7F77DD',note:'Serial data 31.25 kbaud'}],
   uses:['MIDI keyboard/controller','MIDI patchbay','Synthesizers','MIDI time code (MTC)'],
   note:'MIDI is an opto-isolated current loop — not a voltage signal. Never connect MIDI OUT to MIDI OUT.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#D4537E" stroke-width="1.5"/><circle cx="40" cy="18" r="6" fill="#D3D1C7" stroke="#888" stroke-width="1"/><text x="40" y="22" text-anchor="middle" fill="#555" font-size="8">1</text><circle cx="20" cy="34" r="6" fill="#888780" stroke="#666" stroke-width="1"/><text x="20" y="38" text-anchor="middle" fill="#fff" font-size="8">2</text><circle cx="60" cy="34" r="6" fill="#D3D1C7" stroke="#888" stroke-width="1"/><text x="60" y="38" text-anchor="middle" fill="#555" font-size="8">3</text><circle cx="26" cy="56" r="6" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="26" y="60" text-anchor="middle" fill="#fff" font-size="8">4</text><circle cx="54" cy="56" r="6" fill="#7F77DD" stroke="#534AB7" stroke-width="1"/><text x="54" y="60" text-anchor="middle" fill="#fff" font-size="8">5</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">DIN 5-pin</text></svg>`
  },
  {id:'db25',name:'DB25 / D-Sub — Tascam & Elco',cat:'digital',tag:'Multicore analog/digital',color:'#D85A30',desc:'25-pin D-sub connector used as a multicore analog connector. The Tascam wiring standard carries 8 balanced analog channels on one connector (common on audio interfaces, patchbays, and consoles). Elco/Edac 38-pin is an alternative format on some vintage consoles.',
   pins:[{n:'1–8',sig:'Signals (Tascam: alt. hot/cold)',color:'#378ADD',note:'8 channels of balanced audio'},
         {n:'9–17',sig:'Hot and cold pairs',color:'#1D9E75',note:'Pins arranged in pairs per channel'},
         {n:'18–25',sig:'Ground returns',color:'#888780',note:'One ground per channel'}],
   uses:['Audio interface analog I/O','Patchbay multicore','Console sub-group routing','Pro Tools HD interfaces'],
   note:'Tascam pinout and Yamaha pinout differ — always check which standard your gear uses before building loom cables.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="8" y="24" width="64" height="40" rx="3" fill="#1a1a22" stroke="#D85A30" stroke-width="1.5"/><g fill="#378ADD"><circle cx="14" cy="36" r="3.5"/><circle cx="23" cy="36" r="3.5"/><circle cx="32" cy="36" r="3.5"/><circle cx="41" cy="36" r="3.5"/><circle cx="50" cy="36" r="3.5"/><circle cx="59" cy="36" r="3.5"/><circle cx="68" cy="36" r="3.5"/></g><g fill="#1D9E75"><circle cx="18" cy="48" r="3.5"/><circle cx="27" cy="48" r="3.5"/><circle cx="36" cy="48" r="3.5"/><circle cx="45" cy="48" r="3.5"/><circle cx="54" cy="48" r="3.5"/><circle cx="63" cy="48" r="3.5"/></g><text x="40" y="80" text-anchor="middle" fill="#888" font-size="8">DB25 — 25 pins</text></svg>`
  },
  {id:'toslink',name:'Optical / TOSLINK',cat:'digital',tag:'Digital optical',color:'#EF9F27',desc:'Toshiba Link optical connector. Carries S/PDIF or ADAT Lightpipe digital audio on a fiber optic cable. Immune to electrical interference and ground loops. ADAT Lightpipe carries 8 channels at 44.1/48kHz or 4 channels at 96kHz. S/PDIF carries 2 channels up to 192kHz.',
   pins:[{n:'TX',sig:'Transmit — light out',color:'#EF9F27',note:'Red/IR light pulse = digital signal'},
         {n:'RX',sig:'Receive — light in',color:'#888780',note:'Photodiode receiver'}],
   uses:['ADAT lightpipe (8ch)','S/PDIF optical','Interface I/O','Consumer DAC/ADC'],
   note:'ADAT = 8 channels. S/PDIF optical = 2 channels. Same connector, different protocols. Max cable length ~5m for reliable transmission.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="16" y="24" width="48" height="36" rx="4" fill="#1a1a22" stroke="#EF9F27" stroke-width="1.5"/><rect x="24" y="32" width="32" height="20" rx="2" fill="#0C0C0F"/><circle cx="40" cy="42" r="8" fill="#EF9F27" opacity="0.9"/><circle cx="40" cy="42" r="4" fill="#fff" opacity="0.6"/><text x="40" y="78" text-anchor="middle" fill="#888" font-size="8">TOSLINK optical</text></svg>`
  }
];

const PINOUT_CATS = [
    {id:'all',label:'All'},
    {id:'analog',label:'Analog audio'},
    {id:'speaker',label:'Speaker connectors'},
    {id:'adapter',label:'Adapter cables'},
    {id:'power',label:'Power connectors'},
    {id:'digital',label:'Digital & networking'}
];

let activePinoutCat = 'all';

window.initPinout = function() {
    const listEl = document.getElementById('pinout-list');
    const srchEl = document.getElementById('pinout-srch');
    const catContainer = document.getElementById('pinout-cats');
    if(!listEl || !srchEl || !catContainer) return;

    catContainer.innerHTML = '';
    PINOUT_CATS.forEach(c => {
        const btn = document.createElement('button');
        btn.className = `cat-btn ${c.id === 'all' ? 'on' : ''}`;
        btn.textContent = c.label;
        btn.onclick = () => window.setPinoutCat(c.id, btn);
        catContainer.appendChild(btn);
    });

    srchEl.addEventListener('input', window.renderPinouts);
    window.renderPinouts();
};

window.setPinoutCat = function(catId, btnEl) {
    activePinoutCat = catId;
    document.querySelectorAll('#pinout-cats .cat-btn').forEach(b => b.classList.remove('on'));
    btnEl.classList.add('on');
    window.renderPinouts();
};

window.renderPinouts = function() {
    const listEl = document.getElementById('pinout-list');
    const badgeEl = document.getElementById('pinout-count-badge');
    const srchInput = document.getElementById('pinout-srch');
    if(!listEl) return;

    const q = (srchInput.value || '').toLowerCase();
    listEl.innerHTML = '';
    let total = 0;

    PINOUT_CATS.filter(c => c.id !== 'all').forEach(cat => {
        if (activePinoutCat !== 'all' && activePinoutCat !== cat.id) return;
        
        const items = PINOUT_DATA.filter(d => d.cat === cat.id && 
            (d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q) || d.tag.toLowerCase().includes(q))
        );
        
        if (!items.length) return;
        total += items.length;
        
        const hdr = document.createElement('div');
        hdr.className = 'section-hdr pinout-section-hdr';
        hdr.textContent = cat.label.toUpperCase();
        listEl.appendChild(hdr);
        
        items.forEach(conn => {
            const acc = document.createElement('div');
            acc.className = 'acc pinout-acc';
            acc.innerHTML = `
                <div class="acc-hdr" onclick="window.togglePinout(this)">
                    <div class="conn-dot" style="background:${conn.color};box-shadow: 0 0 8px ${conn.color};"></div>
                    <div class="acc-name">${conn.name}</div>
                    <div class="acc-tag" style="background:var(--outline);color:var(--primary);border:1px solid var(--outline-light)">${conn.tag}</div>
                    <div class="acc-arrow"><span class="material-symbols-outlined">expand_more</span></div>
                </div>
                <div class="acc-body">
                    <div class="desc">${conn.desc}</div>
                    <div class="pin-layout">
                        <div class="pin-svg">${conn.svg}</div>
                        <div class="pin-table-container">
                            <table class="pin-table">
                                <thead><tr><th>Pin</th><th>Signal</th><th>Note</th></tr></thead>
                                <tbody>${conn.pins.map(p=>`<tr><td><div class="dot-cell"><div class="pd" style="background:${p.color};border:1px solid ${p.border||'rgba(255,255,255,0.1)'}"></div><strong>${p.n}</strong></div></td><td>${p.sig}</td><td class="pin-note">${p.note}</td></tr>`).join('')}</tbody>
                            </table>
                        </div>
                    </div>
                    <div class="use-row">${conn.uses.map(u=>`<span class="use-tag">${u}</span>`).join('')}</div>
                    ${conn.warn?`<div class="warn-box">⚠ ${conn.warn}</div>`:''}
                    ${conn.note?`<div class="note-box">ℹ ${conn.note}</div>`:''}
                </div>
            `;
            listEl.appendChild(acc);
        });
    });
    
    if(badgeEl) badgeEl.textContent = total + ' CONNECTORS';
};

window.togglePinout = function(hdrEl) {
    const body = hdrEl.nextElementSibling;
    const arrow = hdrEl.querySelector('.acc-arrow');
    const open = body.classList.contains('open');
    body.classList.toggle('open', !open);
    arrow.classList.toggle('open', !open);
};
function initGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const searchBtn = document.getElementById('btn-global-search');
    const widgets = document.querySelectorAll('.dashboard-grid .widget');
    const dropdown = document.getElementById('search-results-dropdown');

    if (!searchInput || !widgets.length || !dropdown) return;

    let searchQuery = '';

    function performFilter() {
        // Filter Dashboard Widgets on screen
        widgets.forEach(widget => {
            const title = widget.querySelector('.widget-title')?.textContent.toLowerCase() || '';
            const subtitle = widget.querySelector('.widget-subtitle')?.textContent.toLowerCase() || '';
            const matchesSearch = title.includes(searchQuery) || subtitle.includes(searchQuery);

            if (matchesSearch) {
                widget.classList.remove('filtered-out');
            } else {
                widget.classList.add('filtered-out');
            }
        });
    }

    // Input Search (Real-time Dropdown + Filter)
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        performFilter();

        if (searchQuery.length < 2) {
            dropdown.style.display = 'none';
            dropdown.innerHTML = '';
            return;
        }

        // 1. Search matching local widgets/tools
        const matchedTools = [];
        widgets.forEach(widget => {
            const title = widget.querySelector('.widget-title')?.textContent || '';
            const subtitle = widget.querySelector('.widget-subtitle')?.textContent || '';
            if (title.toLowerCase().includes(searchQuery) || subtitle.toLowerCase().includes(searchQuery)) {
                matchedTools.push({ title, subtitle, widget });
            }
        });

        // 2. Search matching blog articles
        const matchedBlogs = [];
        if (typeof blogArticles !== 'undefined') {
            blogArticles.forEach(item => {
                const title = item.title || '';
                const excerpt = item.excerpt || '';
                const cat = item.categoryLabel || item.cat || '';
                if (title.toLowerCase().includes(searchQuery) || excerpt.toLowerCase().includes(searchQuery) || cat.toLowerCase().includes(searchQuery)) {
                    matchedBlogs.push({ title, excerpt, cat, id: item.id, isPro: item.isPro });
                }
            });
        }

        // 3. Render floating results
        if (matchedTools.length === 0 && matchedBlogs.length === 0) {
            dropdown.innerHTML = `<div class="search-no-results">No matching tools or blog articles found.</div>`;
        } else {
            let html = '';

            if (matchedTools.length > 0) {
                html += `
                    <div class="search-results-section">
                        <div class="search-results-header">
                            <span>TOOLS & CALCULATORS</span>
                            <span>${matchedTools.length} MATCHES</span>
                        </div>
                        <div class="search-results-list">
                `;
                matchedTools.forEach((tool, index) => {
                    html += `
                        <div class="search-result-item" data-type="tool" data-index="${index}">
                            <div class="search-result-title">${tool.title}</div>
                            <div class="search-result-subtitle">${tool.subtitle}</div>
                        </div>
                    `;
                });
                html += `</div></div>`;
            }

            if (matchedBlogs.length > 0) {
                html += `
                    <div class="search-results-section">
                        <div class="search-results-header">
                            <span>BLOG DEEP DIVES & GUIDES</span>
                            <span>${matchedBlogs.length} MATCHES</span>
                        </div>
                        <div class="search-results-list">
                `;
                matchedBlogs.forEach((blog, index) => {
                    html += `
                        <div class="search-result-item" data-type="blog" data-index="${index}">
                            <div class="search-result-title">${blog.title}</div>
                            <div class="search-result-subtitle">${blog.cat.toUpperCase()} — ${blog.excerpt.substring(0, 75)}...</div>
                        </div>
                    `;
                });
                html += `</div></div>`;
            }

            dropdown.innerHTML = html;

            // Add Click listeners dynamically
            const resultItems = dropdown.querySelectorAll('.search-result-item');
            resultItems.forEach(item => {
                item.addEventListener('click', () => {
                    const type = item.getAttribute('data-type');
                    const index = parseInt(item.getAttribute('data-index'), 10);

                    if (type === 'tool') {
                        const tool = matchedTools[index];
                        if (tool) {
                            const btn = tool.widget.querySelector('button, .rugged-btn');
                            if (btn) btn.click();
                        }
                    } else if (type === 'blog') {
                        const blog = matchedBlogs[index];
                        if (blog.isPro && !window.isBlogUnlocked(blog.id)) {
                            window.pendingArticleToOpen = blog.id;
                            window.showProUpgradeModal('blog');
                            dropdown.style.display = 'none';
                            return;
                        }
                        
                        const blogView = document.getElementById('blog-view');
                        const btnNavBlog = document.getElementById('btn-nav-blog');
                        
                        if (blogView && window.showView) {
                            window.showView(blogView, btnNavBlog);
                            
                            // Highlight nav button active status
                            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                            if (btnNavBlog) btnNavBlog.classList.add('active');

                            // Open the specific article
                            if (typeof window.openBlogArticle === 'function') {
                                window.openBlogArticle(blog.id);
                            }
                        }
                    }

                    // Reset search input and hide dropdown
                    searchInput.value = '';
                    dropdown.style.display = 'none';
                    dropdown.innerHTML = '';
                    searchQuery = '';
                    performFilter(); // Restore widgets display
                });
            });
        }

        dropdown.style.display = 'block';
    });

    // Dismiss search dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== searchInput) {
            dropdown.style.display = 'none';
        }
    });

    // Button Click
    searchBtn.addEventListener('click', () => {
        searchQuery = searchInput.value.toLowerCase().trim();
        performFilter();
        dropdown.style.display = 'none';
    });

    // Enter Key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchQuery = searchInput.value.toLowerCase().trim();
            performFilter();
            dropdown.style.display = 'none';
        }
    });
}
function initBlog() {
    const blogIndex = document.getElementById('blog-index');
    const blogReader = document.getElementById('blog-reader');
    const catBtns = document.querySelectorAll('.cat-btn');
    const backBtn = document.querySelector('.btn-back-to-index');

    if (!blogIndex || !blogReader) return;

    // Render all articles (Live and Placeholders)
    function renderBlogList(filter = 'all') {
        blogIndex.innerHTML = '';

        // Combine real articles and placeholders
        const allItems = [
            ...blogArticles.map(a => ({ ...a, type: 'live' })),
            ...blogPlaceholders.map(p => ({ ...p, type: 'locked', id: null }))
        ];

        allItems.forEach(item => {
            const itemCat = item.category || item.cat;
            if (filter !== 'all' && itemCat !== filter) return;

            const isLockedPro = item.isPro && !window.isBlogUnlocked(item.id);

            const card = document.createElement('article');
            card.className = `article-card widget rugged-bevel brushed-metal ${item.type === 'locked' ? 'locked' : ''} ${isLockedPro ? 'pro-locked' : ''}`;
            if (item.id) card.setAttribute('data-id', item.id);
            card.setAttribute('data-cat', itemCat);

            const metaTag = isLockedPro 
                ? `<span class="status-tag gold-tag" style="display: inline-flex; align-items: center; gap: 4px; background: rgba(212, 175, 55, 0.1) !important; color: #FFD700 !important; border: 1px solid rgba(212, 175, 55, 0.3);"><span class="material-symbols-outlined" style="font-size: 0.95rem; vertical-align: middle;">lock</span>LOCKED</span>` 
                : `<span class="read-time">${item.readTime}</span>`;

            card.innerHTML = `
                <div class="card-meta">
                    <span class="cat-tag ${item.isPro ? 'gold-tag' : ''}">${(item.categoryLabel || item.cat).toUpperCase()}</span>
                    ${item.type === 'locked' ? `<span class="status-tag">UPCOMING</span>` : metaTag}
                </div>
                <h3 class="article-title ${item.type === 'live' ? 'text-primary' : ''}">${item.title}</h3>
                <p class="article-excerpt">${item.excerpt}</p>
                ${(item.type === 'live') ? (isLockedPro 
                    ? `<button class="read-more unlock-ad-btn" style="color: #FFD700 !important; border-color: rgba(212, 175, 55, 0.5) !important; background: rgba(212, 175, 55, 0.1) !important; display: inline-flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 1.1rem; vertical-align: middle;">workspace_premium</span>🔓 UNLOCK WITH AD</button>` 
                    : `<button class="read-more">READ DEEP DIVE <span class="material-symbols-outlined">arrow_forward</span></button>`
                ) : ''}
            `;

            if (item.type === 'live') {
                if (isLockedPro) {
                    const readBtn = card.querySelector('.read-more');
                    if (readBtn) {
                        readBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            window.pendingArticleToOpen = item.id;
                            window.showProUpgradeModal('blog');
                        });
                    }
                    card.addEventListener('click', () => {
                        window.pendingArticleToOpen = item.id;
                        window.showProUpgradeModal('blog');
                    });
                } else {
                    const readBtn = card.querySelector('.read-more');
                    if(readBtn) {
                        readBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            openArticle(item.id);
                        });
                    }
                    card.addEventListener('click', () => openArticle(item.id));
                }
            }

            blogIndex.appendChild(card);
        });
    }

    function openArticle(id) {
        const article = blogArticles.find(a => a.id === id);
        if (!article) return;

        const container = document.getElementById('article-view');
        container.innerHTML = article.content;
        
        blogIndex.style.display = 'none';
        blogReader.style.display = 'block';
        window.scrollTo(0, 0);
    }
    window.openBlogArticle = openArticle;

    // Category Filtering
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-cat');
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Return to index if reading an article
            blogReader.style.display = 'none';
            blogIndex.style.display = 'grid';
            
            renderBlogList(cat);
        });
    });

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            blogReader.style.display = 'none';
            blogIndex.style.display = 'grid';
        });
    }

    // Initial Render
    renderBlogList();

    // Listen for Pro status changes to re-render gated content
    document.addEventListener('proStatusChanged', () => {
        const activeBtn = Array.from(catBtns).find(b => b.classList.contains('active'));
        renderBlogList(activeBtn ? activeBtn.getAttribute('data-cat') : 'all');
    });
}

// --- PROFESSIONAL RTA SUITE (1/6 OCTAVE REFINE) ---
const ISO_FREQS = [
    20, 22.4, 25, 28, 31.5, 35.5, 40, 45, 50, 56, 63, 71, 80, 90, 100, 
    112, 125, 140, 160, 180, 200, 224, 250, 280, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 
    1120, 1250, 1400, 1600, 1800, 2000, 2240, 2500, 2800, 3150, 3550, 4000, 4500, 5000, 5600, 6300, 7100, 8000, 9000, 10000, 
    11200, 12500, 14000, 16000, 18000, 20000
];

function initProfessionalRTA() {
    const canvas = document.getElementById('rta-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('btn-start-analyzer');
    const inputSelect = document.getElementById('rta-input-select');
    const outputSelect = document.getElementById('rta-output-select');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const weightBtns = document.querySelectorAll('.weight-btn');
    const calSlider = document.getElementById('rta-calibration');
    const calValue = document.getElementById('cal-offset');
    const peakToggle = document.getElementById('btn-peak-toggle');
    const peakReset = document.getElementById('btn-peak-reset');
    const labelsContainer = document.getElementById('rta-labels');
    const btnCapture = document.getElementById('btn-capture-snapshot');
    
    let audioCtx, analyser, source, stream;
    let dataArray, bufferLength;
    let rtaPinkNoiseNode = null;
    let rtaPinkNoiseGainNode = null;
    let rtaPinkNoiseAnalyserNode = null;
    let rtaPinkNoiseDataArray = null;
    let rtaPinkNoiseSmoothedDataArray = null;
    let isRtaPinkNoiseActive = false;
    let timeData; // For Hanning/Manual FFT
    let smoothedDataArray;
    let isInitialized = false;
    let currentMode = 'fft'; // Default to Spectrum Curve
    let currentWeighting = 'a'; // Default to A-weighted
    let averagingFactor = 4; // Default averaging
    let calibrationOffset = 100;
    let peakHoldEnabled = true;
    let peakData = new Array(ISO_FREQS.length).fill(-100);
    let domFreqDisplay = "--- Hz";

    // Fullscreen RTA & Ad Reward state variables
    let isFullscreenActive = false;
    let isAdRewardClaimed = false;
    let adCountdownTimer = null;
    let adSecondsRemaining = 15;

    // Advanced Spectrogram Waterfall Variables
    let waterfallCanvas = null;
    let waterfallCtx = null;

    // Custom Mic Calibration Variables
    let calProfile = []; // Parsed { freq, offset } pairs
    let calOffsets = null; // Precomputed Float32Array matching bufferLength
    let calEnabled = false;

    // Snapshot Memory Bank (PRO FEATURE)
    let snapshots = []; // Array of { rta: [], fft: [], color: '', visible: true, id: 0 }
    const SNAPSHOT_COLORS = ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#FF8C00', '#1E90FF', '#FF4500', '#ADFF2F', '#7B68EE', '#F0E68C'];
    const slotsContainer = document.getElementById('snapshot-slots-container');

    // A-Weighting Look-up Table for 1/6 octave (interpolated centers)
    const A_WEIGHTS = { 20:-50.5, 22.4:-48.0, 25:-44.7, 28:-41.6, 31.5:-39.4, 35.5:-37.0, 40:-34.6, 45:-32.4, 50:-30.2, 56:-28.2, 63:-26.2, 71:-24.1, 80:-22.5, 90:-20.8, 100:-19.1, 112:-17.5, 125:-16.1, 140:-14.7, 160:-13.4, 180:-12.2, 200:-10.9, 224:-9.6, 250:-8.6, 280:-7.5, 315:-6.6, 355:-5.7, 400:-4.8, 450:-4.0, 500:-3.2, 560:-2.5, 630:-1.9, 710:-1.3, 800:-0.8, 900:-0.4, 1000:0, 1120:0.3, 1250:0.6, 1400:0.8, 1600:1.0, 1800:1.1, 2000:1.2, 2240:1.3, 2500:1.3, 2800:1.3, 3150:1.2, 3550:1.1, 4000:1.0, 4500:0.8, 5000:0.5, 5600:0.2, 6300:-0.1, 7100:-0.5, 8000:-1.1, 9000:-1.7, 10000:-2.5, 11200:-3.3, 12500:-4.3, 14000:-5.4, 16000:-6.6, 18000:-7.9, 20000:-9.3 };

    // Inject Labels (Simplified for 1/6 density)
    if (labelsContainer) {
        labelsContainer.innerHTML = ISO_FREQS.map((f, i) => {
            const isMajor = i % 2 === 0; // Show label every 2 bands
            return isMajor ? `<span class="freq-label">${f >= 1000 ? (f/1000)+'k' : f}</span>` : `<span class="freq-label" style="opacity:0.2">·</span>`;
        }).join('');
    }

    async function getDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputs = devices.filter(d => d.kind === 'audioinput');
            if (inputSelect) {
                inputSelect.innerHTML = inputs.map(d => `<option value="${d.deviceId}">${d.label || 'Input ' + d.deviceId.slice(0,4)}</option>`).join('');
            }
        } catch (e) { console.error("Device enumeration failed", e); }
    }

    let isAnalyzing = false;
    
    window.startAnalyzer = async function startAnalyzer(deviceId) {
        if (isAnalyzing) return;
        deviceId = deviceId || safeStorage.getItem('soundengg-mic-id') || 'default';
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }

        try {
            const constraints = { 
                audio: (deviceId && deviceId !== 'default') ? { deviceId: { exact: deviceId } } : true 
            };
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') await audioCtx.resume();

            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048; 
            analyser.smoothingTimeConstant = 0; // We'll do custom smoothing
            
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
 
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Float32Array(bufferLength);
            timeData = new Float32Array(analyser.fftSize);
            smoothedDataArray = new Float32Array(bufferLength).fill(-100);
            
            // Precompute calibration offsets matching the current bin count
            precomputeCalibrationOffsets();
            
            isInitialized = true;
            isAnalyzing = true;
            startBtn.classList.remove('pulse-glow');
            startBtn.classList.add('active', 'danger-btn');
            startBtn.innerHTML = '<span class="material-symbols-outlined">stop</span> DEACTIVATE RTA';
            
            getDevices();
            rafID = requestAnimationFrame(draw);
        } catch (e) {
            console.error("Mic access failed", e);
            startBtn.innerHTML = '<span class="material-symbols-outlined">error</span> ACCESS_DENIED';
            isAnalyzing = false;
        }
    };

    function stopAnalyzer() {
        if (isRtaPinkNoiseActive) {
            toggleRtaPinkNoise();
        }
        if (!isAnalyzing) return;
        isAnalyzing = false;
        if (rafID) cancelAnimationFrame(rafID);
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
        if (audioCtx) {
            audioCtx.suspend();
        }
        startBtn.classList.remove('active', 'danger-btn');
        startBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span> START MEASUREMENT';
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGridAndLabels();
    }
    window.stopAnalyzer = stopAnalyzer;

    function createRtaPinkNoise() {
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

    async function toggleRtaPinkNoise() {
        const btn = document.getElementById('btn-rta-pink-noise');
        if (!btn) return;

        if (isRtaPinkNoiseActive) {
            // Turn off
            if (rtaPinkNoiseNode) {
                try { rtaPinkNoiseNode.disconnect(); } catch(e){}
                rtaPinkNoiseNode = null;
            }
            if (rtaPinkNoiseAnalyserNode) {
                try { rtaPinkNoiseAnalyserNode.disconnect(); } catch(e){}
                rtaPinkNoiseAnalyserNode = null;
            }
            if (rtaPinkNoiseGainNode) {
                try { rtaPinkNoiseGainNode.disconnect(); } catch(e){}
                rtaPinkNoiseGainNode = null;
            }
            isRtaPinkNoiseActive = false;
            
            // Revert premium styling
            btn.classList.remove('active');
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.style.boxShadow = '';
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">volume_up</span> PLAY NOISE';
        } else {
            // Turn on
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') await audioCtx.resume();

            // Sync output routing
            const savedOutput = safeStorage.getItem('soundengg-output-id') || 'default';
            if (savedOutput && savedOutput !== 'default' && typeof audioCtx.setSinkId === 'function') {
                try {
                    await audioCtx.setSinkId(savedOutput);
                } catch (err) {
                    console.warn("Failed to set output sink for RTA pink noise:", err);
                }
            }

            rtaPinkNoiseAnalyserNode = audioCtx.createAnalyser();
            rtaPinkNoiseAnalyserNode.fftSize = 2048;
            rtaPinkNoiseAnalyserNode.smoothingTimeConstant = 0;
            
            rtaPinkNoiseDataArray = new Float32Array(rtaPinkNoiseAnalyserNode.frequencyBinCount);
            rtaPinkNoiseSmoothedDataArray = new Float32Array(rtaPinkNoiseAnalyserNode.frequencyBinCount).fill(-100);

            rtaPinkNoiseGainNode = audioCtx.createGain();
            rtaPinkNoiseGainNode.gain.setValueAtTime(0.15, audioCtx.currentTime); // comfortable level

            rtaPinkNoiseNode = createRtaPinkNoise();
            rtaPinkNoiseNode.connect(rtaPinkNoiseAnalyserNode);
            rtaPinkNoiseAnalyserNode.connect(rtaPinkNoiseGainNode);
            rtaPinkNoiseGainNode.connect(audioCtx.destination);

            isRtaPinkNoiseActive = true;

            // Apply active premium visual glow
            btn.classList.add('active');
            btn.style.background = 'var(--primary)';
            btn.style.borderColor = 'var(--primary)';
            btn.style.color = 'var(--surface)';
            btn.style.boxShadow = '0 0 15px var(--primary)';
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">volume_up</span> STOP NOISE';
        }
    }

    function getSPLColor(db) {
        const val = db + calibrationOffset;
        if (val > 105) return '#E24B4A'; // Red
        if (val > 95) return '#D85A30'; // Orange
        if (val > 85) return '#639922'; // Green
        if (val > 70) return '#378ADD'; // Light Blue
        return '#14A7B5'; // Turquoise
    }

    function draw() {
        if (!isInitialized) return;
        requestAnimationFrame(draw);
        
        // Manual FFT with Hanning Window
        analyser.getFloatTimeDomainData(timeData);
        
        // 1. Apply Hanning Window
        const N = timeData.length;
        const windowedData = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const hanning = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
            windowedData[i] = timeData[i] * hanning;
        }

        // 2. Perform FFT
        analyser.getFloatFrequencyData(dataArray);

        // 3. Apply Averaging / Smoothing
        const alpha = 1 / (averagingFactor + 1);
        for (let i = 0; i < bufferLength; i++) {
            // Clamp data to a reasonable floor to avoid -Infinity issues in rendering
            if (dataArray[i] < -120) dataArray[i] = -120;
            
            smoothedDataArray[i] = (dataArray[i] * alpha) + (smoothedDataArray[i] * (1 - alpha));
            
            // Apply Mic Calibration Correction if enabled
            let calCorr = (calEnabled && calOffsets && calOffsets[i]) ? calOffsets[i] : 0;
            dataArray[i] = smoothedDataArray[i] + calCorr;
        }

        // Apply Averaging / Smoothing to Pink Noise if active
        if (isRtaPinkNoiseActive && rtaPinkNoiseAnalyserNode) {
            rtaPinkNoiseAnalyserNode.getFloatFrequencyData(rtaPinkNoiseDataArray);
            for (let i = 0; i < bufferLength; i++) {
                if (rtaPinkNoiseDataArray[i] < -120) rtaPinkNoiseDataArray[i] = -120;
                rtaPinkNoiseSmoothedDataArray[i] = (rtaPinkNoiseDataArray[i] * alpha) + (rtaPinkNoiseSmoothedDataArray[i] * (1 - alpha));
            }
        }

        if (currentMode !== 'waterfall') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        if (currentMode === 'rta') {
            drawRTA();
        } else if (currentMode === 'fft') {
            drawFFT();
        } else if (currentMode === 'waterfall') {
            drawWaterfall();
        }

        drawGridAndLabels();
        drawDominantOverlay();
        updateTelemetry();
    }

    function drawGridAndLabels() {
        const isLight = document.documentElement.classList.contains('light');
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        const textColor = isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';

        ctx.save();
        ctx.textAlign = 'right';
        ctx.font = "12px 'Space Grotesk', sans-serif";
        ctx.lineWidth = 0.5;

        // dB Range to show: from calibrationOffset - 100 to calibrationOffset
        const minDisplayDB = Math.floor((calibrationOffset - 100) / 10) * 10;
        const maxDisplayDB = Math.ceil(calibrationOffset / 10) * 10;

        for (let displayDB = minDisplayDB; displayDB <= maxDisplayDB; displayDB += 10) {
            const internalDB = displayDB - calibrationOffset;
            const y = canvas.height - (internalDB + 100) * (canvas.height / 100);

            if (y < 0 || y > canvas.height) continue;

            // Draw Grid Line
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = gridColor;
            ctx.moveTo(40, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();

            // Draw Label
            ctx.fillStyle = textColor;
            ctx.fillText(`${displayDB}`, 35, y + 4);
        }
        ctx.restore();
    }

    function drawRTA() {
        const barWidth = canvas.width / ISO_FREQS.length;
        const sampleRate = audioCtx.sampleRate;
        const nyquist = sampleRate / 2;

        ISO_FREQS.forEach((centerFreq, i) => {
            const x = i * barWidth;
            const ratio = Math.pow(2, 1/12); // Half of 1/6 for band edges
            const lowFreq = centerFreq / ratio;
            const highFreq = centerFreq * ratio;
            
            const lowBin = Math.max(0, Math.floor(lowFreq / nyquist * bufferLength));
            const highBin = Math.min(bufferLength - 1, Math.floor(highFreq / nyquist * bufferLength));
            
            let sum = 0;
            let count = 0;
            for (let b = lowBin; b <= highBin; b++) {
                sum += dataArray[b];
                count++;
            }
            
            let db = count > 0 ? sum / count : -100;
            if (currentWeighting === 'a') db += (A_WEIGHTS[centerFreq] || 0);
            
            // Apply extra fine calibration correction to weighted RTA bands
            if (calEnabled) {
                db += getCalOffsetForFreq(centerFreq);
            }

            if (db > peakData[i]) peakData[i] = db;
            
            // --- Draw Multi-Snapshots (RTA) ---
            snapshots.forEach(snap => {
                if (!snap.visible) return;
                const snapDb = snap.rta[i];
                if (snapDb > -100) {
                    const snapH = Math.max(0, (snapDb + 100) * (canvas.height / 100));
                    // Draw faint background fill
                    ctx.fillStyle = snap.color + '22'; // 13% opacity
                    ctx.fillRect(x + 1, canvas.height - snapH, barWidth - 2, snapH);
                    
                    // Snapshot line
                    ctx.beginPath();
                    ctx.strokeStyle = snap.color;
                    ctx.globalAlpha = 0.6;
                    ctx.setLineDash([2, 2]);
                    ctx.moveTo(x, canvas.height - snapH);
                    ctx.lineTo(x + barWidth, canvas.height - snapH);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 1.0;
                }
            });

            if (isRtaPinkNoiseActive && rtaPinkNoiseAnalyserNode) {
                const w = barWidth - 2;
                const hMic = Math.max(2, (db + 100) * (canvas.height / 100));

                // 1. Draw Mic Input (Cyan) as filled bars
                ctx.fillStyle = 'rgba(20, 167, 181, 0.8)'; // brand cyan with 80% opacity
                ctx.fillRect(x + 1, canvas.height - hMic, w, hMic);
                
                ctx.strokeStyle = '#14A7B5';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x + 1, canvas.height - hMic, w, hMic);

                if (peakHoldEnabled) {
                    const isLight = document.documentElement.classList.contains('light');
                    const ph = (peakData[i] + 100) * (canvas.height / 100);
                    ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)';
                    ctx.fillRect(x + 1, canvas.height - ph - 2, w, 2);
                }
            } else {
                const h = Math.max(2, (db + 100) * (canvas.height / 100));
                ctx.fillStyle = getSPLColor(db);
                ctx.fillRect(x + 1, canvas.height - h, barWidth - 2, h);

                if (peakHoldEnabled) {
                    const isLight = document.documentElement.classList.contains('light');
                    const ph = (peakData[i] + 100) * (canvas.height / 100);
                    ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)';
                    ctx.fillRect(x + 1, canvas.height - ph - 2, barWidth - 2, 2);
                }
            }
        });

        // 2. Draw Pink Noise Output (Bold Pink Curve) overlaying on top of the RTA bars
        if (isRtaPinkNoiseActive && rtaPinkNoiseAnalyserNode) {
            ctx.beginPath();
            ctx.strokeStyle = '#FF2E93';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(255, 46, 147, 0.6)';
            
            ISO_FREQS.forEach((centerFreq, i) => {
                const x = i * barWidth;
                const ratio = Math.pow(2, 1/12);
                const lowFreq = centerFreq / ratio;
                const highFreq = centerFreq * ratio;
                const lowBin = Math.max(0, Math.floor(lowFreq / nyquist * bufferLength));
                const highBin = Math.min(bufferLength - 1, Math.floor(highFreq / nyquist * bufferLength));
                
                let pinkSum = 0;
                let count = 0;
                for (let b = lowBin; b <= highBin; b++) {
                    pinkSum += rtaPinkNoiseSmoothedDataArray[b];
                    count++;
                }
                let pinkDb = count > 0 ? pinkSum / count : -100;
                if (currentWeighting === 'a') pinkDb += (A_WEIGHTS[centerFreq] || 0);
                
                const hPink = Math.max(2, (pinkDb + 100) * (canvas.height / 100));
                const centerX = x + barWidth / 2;
                const centerY = canvas.height - hPink;
                
                if (i === 0) {
                    ctx.moveTo(centerX, centerY);
                } else {
                    ctx.lineTo(centerX, centerY);
                }
            });
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow glow
        }
    }

    function drawFFT() {
        const sliceWidth = canvas.width / bufferLength;

        // --- Draw Multi-Snapshots (Curve) ---
        snapshots.forEach(snap => {
            if (!snap.visible) return;
            ctx.beginPath();
            ctx.strokeStyle = snap.color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.7;
            ctx.setLineDash([4, 4]);
            for (let i = 0; i < bufferLength; i++) {
                const x = (Math.log10(i + 1) / Math.log10(bufferLength)) * canvas.width;
                const db = snap.fft[i];
                const y = canvas.height - (db + 100) * (canvas.height / 100);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
        });

        ctx.beginPath();
        ctx.strokeStyle = '#14A7B5';
        ctx.lineWidth = 1.5;
        
        for (let i = 0; i < bufferLength; i++) {
            let dbVal = dataArray[i];
            const x = (Math.log10(i + 1) / Math.log10(bufferLength)) * canvas.width;
            const y = Math.min(canvas.height, canvas.height - (dbVal + 100) * (canvas.height / 100));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 2. Draw Pink Noise Output (Bold Pink) if active
        if (isRtaPinkNoiseActive && rtaPinkNoiseAnalyserNode) {
            ctx.beginPath();
            ctx.strokeStyle = '#FF2E93';
            ctx.lineWidth = 2.0;
            
            for (let i = 0; i < bufferLength; i++) {
                let dbVal = rtaPinkNoiseSmoothedDataArray[i];
                const x = (Math.log10(i + 1) / Math.log10(bufferLength)) * canvas.width;
                const y = Math.min(canvas.height, canvas.height - (dbVal + 100) * (canvas.height / 100));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }

    function drawDominantOverlay() {
        ctx.save();
        // Use explicit font stack as canvas API doesn't support CSS variables
        ctx.font = "bold 72px 'Space Grotesk', sans-serif";
        ctx.fillStyle = '#14A7B5'; // Cyan/Turquoise
        ctx.textAlign = 'center';
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(20, 167, 181, 0.7)';
        ctx.fillText(domFreqDisplay, canvas.width / 2, 90);
        ctx.restore();
    }

    function updateTelemetry() {
        const peakValEl = document.getElementById('rta-peak-val');
        const domFreqEl = document.getElementById('rta-dom-val');
        
        const maxDB = Math.max(...peakData);
        if (peakValEl) peakValEl.textContent = `${(maxDB + calibrationOffset).toFixed(1)} dB`;
        
        let maxFFT = -120;
        let domIdx = 0;
        for (let i = 2; i < bufferLength; i++) { // Skip DC
            if (dataArray[i] > maxFFT) {
                maxFFT = dataArray[i];
                domIdx = i;
            }
        }
        const domFreq = Math.round(domIdx * (audioCtx.sampleRate / analyser.fftSize));
        domFreqDisplay = `${domFreq} Hz`;
        if (domFreqEl) domFreqEl.textContent = domFreqDisplay;
    }

    // --- Helper: Render Snapshot Slots UI ---
    function renderSnapshotSlots() {
        if (!slotsContainer) return;
        slotsContainer.innerHTML = '';
        
        const isPro = window.isPremiumActive('snapshots');

        for (let i = 0; i < 10; i++) {
            const slot = snapshots[i];
            const btn = document.createElement('div');
            
            // Allow slot 0 for everyone, lock others (1-9) for free users
            const isSlotLocked = !isPro && i > 0;

            if (isSlotLocked) {
                // Locked State for Free Users (Slots 2-10)
                btn.className = 'snapshot-slot locked-pro';
                btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">lock</span>';
                btn.title = `PRO FEATURE: Slot ${i+1} Locked (Upgrade to Unlock 10 slots)`;
                btn.addEventListener('click', () => {
                    showProUpgradeModal('snapshots');
                });
            } else {
                // Active State for Pro Users
                btn.className = `snapshot-slot ${slot ? 'active' : ''} ${slot && !slot.visible ? 'hidden' : ''}`;
                btn.style.color = slot ? slot.color : 'inherit';
                btn.textContent = i + 1;
                
                if (slot) {
                    btn.title = `Snapshot ${i+1} (Click to toggle, Right-click to delete)`;
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        slot.visible = !slot.visible;
                        renderSnapshotSlots();
                    });
                    btn.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        snapshots.splice(i, 1);
                        saveConfigToCloud('rta_snapshots', { snapshots });
                        renderSnapshotSlots();
                    });
                } else {
                    btn.title = "Empty Slot (Click Capture New to save)";
                }
            }
            slotsContainer.appendChild(btn);
        }
    }

    // --- Core Logic: Capture New Snapshot ---
    function captureNewSnapshot() {
        if (!isInitialized) return;
        
        if (!window.isPremiumActive('snapshots') && snapshots.length >= 1) {
            showProUpgradeModal('snapshots');
            return;
        }

        if (snapshots.length >= 10) {
            alert("Snapshot Memory Full. Right-click a slot to delete it.");
            return;
        }

        const currentRTA = ISO_FREQS.map(centerFreq => {
            const ratio = Math.pow(2, 1/12);
            const lowFreq = centerFreq / ratio;
            const highFreq = centerFreq * ratio;
            const nyquist = audioCtx.sampleRate / 2;
            const lowBin = Math.max(0, Math.floor(lowFreq / nyquist * bufferLength));
            const highBin = Math.min(bufferLength - 1, Math.floor(highFreq / nyquist * bufferLength));
            let sum = 0; let count = 0;
            for (let b = lowBin; b <= highBin; b++) { sum += dataArray[b]; count++; }
            let db = count > 0 ? sum / count : -100;
            if (currentWeighting === 'a') db += (A_WEIGHTS[centerFreq] || 0);
            return db;
        });

        const newSnap = {
            rta: currentRTA,
            fft: Array.from(dataArray),
            color: SNAPSHOT_COLORS[snapshots.length],
            visible: true,
            id: Date.now()
        };

        snapshots.push(newSnap);
        saveConfigToCloud('rta_snapshots', { snapshots });
        renderSnapshotSlots();

        if (btnCapture) {
            btnCapture.innerHTML = '<span class="material-symbols-outlined">check_circle</span> CAPTURED';
            btnCapture.classList.add('active');
            setTimeout(() => {
                btnCapture.innerHTML = '<span class="material-symbols-outlined">camera</span> CAPTURE_NEW';
                btnCapture.classList.remove('active');
            }, 1000);
        }
    }

    // --- Custom Mic Calibration Parser & Interpolator ---
    function parseCalibrationData(text) {
        const lines = text.split('\n');
        const parsed = [];
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith(';') || line.startsWith('#') || line.startsWith('*')) {
                continue;
            }
            
            const parts = line.replace(/,/g, ' ').split(/\s+/);
            if (parts.length >= 2) {
                const freq = parseFloat(parts[0]);
                const offset = parseFloat(parts[1]);
                if (!isNaN(freq) && !isNaN(offset)) {
                    parsed.push({ freq, offset });
                }
            }
        }
        return parsed;
    }

    function precomputeCalibrationOffsets() {
        if (!bufferLength) return;
        const nyquist = (audioCtx ? audioCtx.sampleRate : 48000) / 2;
        calOffsets = new Float32Array(bufferLength).fill(0);
        
        if (calProfile.length === 0) return;

        // Sort profile ascending by frequency
        calProfile.sort((a, b) => a.freq - b.freq);

        for (let i = 0; i < bufferLength; i++) {
            const f = (i * nyquist) / bufferLength;
            
            if (f <= calProfile[0].freq) {
                calOffsets[i] = calProfile[0].offset;
            } else if (f >= calProfile[calProfile.length - 1].freq) {
                calOffsets[i] = calProfile[calProfile.length - 1].offset;
            } else {
                let lowPt = calProfile[0];
                let highPt = calProfile[calProfile.length - 1];
                for (let j = 0; j < calProfile.length - 1; j++) {
                    if (f >= calProfile[j].freq && f <= calProfile[j + 1].freq) {
                        lowPt = calProfile[j];
                        highPt = calProfile[j + 1];
                        break;
                    }
                }
                const logF = Math.log10(f || 1);
                const logLow = Math.log10(lowPt.freq || 1);
                const logHigh = Math.log10(highPt.freq || 1);
                const pct = (logF - logLow) / (logHigh - logLow || 1);
                calOffsets[i] = lowPt.offset + pct * (highPt.offset - lowPt.offset);
            }
        }
    }

    function getCalOffsetForFreq(f) {
        if (calProfile.length === 0) return 0;
        if (f <= calProfile[0].freq) return calProfile[0].offset;
        if (f >= calProfile[calProfile.length - 1].freq) return calProfile[calProfile.length - 1].offset;
        
        for (let j = 0; j < calProfile.length - 1; j++) {
            if (f >= calProfile[j].freq && f <= calProfile[j + 1].freq) {
                const lowPt = calProfile[j];
                const highPt = calProfile[j + 1];
                const logF = Math.log10(f || 1);
                const logLow = Math.log10(lowPt.freq || 1);
                const logHigh = Math.log10(highPt.freq || 1);
                const pct = (logF - logLow) / (logHigh - logLow || 1);
                return lowPt.offset + pct * (highPt.offset - lowPt.offset);
            }
        }
        return 0;
    }

    // --- Rolling Spectrogram Waterfall Visualizer ---
    function getWaterfallColor(displayDB) {
        const minDB = 45;
        const maxDB = 110;
        const norm = Math.max(0, Math.min(1, (displayDB - minDB) / (maxDB - minDB)));
        
        if (norm < 0.2) {
            const p = norm / 0.2;
            return `hsl(240, 100%, ${Math.floor(2 + p * 8)}%)`;
        } else if (norm < 0.5) {
            const p = (norm - 0.2) / 0.3;
            return `hsl(${Math.floor(240 - p * 60)}, 100%, ${Math.floor(10 + p * 20)}%)`;
        } else if (norm < 0.8) {
            const p = (norm - 0.5) / 0.3;
            return `hsl(${Math.floor(180 - p * 160)}, 100%, ${Math.floor(30 + p * 20)}%)`;
        } else {
            const p = (norm - 0.8) / 0.2;
            return `hsl(${Math.floor(20 + p * 40)}, 100%, ${Math.floor(50 + p * 40)}%)`;
        }
    }

    function drawWaterfall() {
        if (!waterfallCanvas) {
            waterfallCanvas = document.createElement('canvas');
            waterfallCanvas.width = canvas.width;
            waterfallCanvas.height = canvas.height;
            waterfallCtx = waterfallCanvas.getContext('2d');
            waterfallCtx.fillStyle = '#050508';
            waterfallCtx.fillRect(0, 0, waterfallCanvas.width, waterfallCanvas.height);
        }

        const shiftY = 2;
        waterfallCtx.drawImage(
            waterfallCanvas, 
            0, 0, waterfallCanvas.width, waterfallCanvas.height - shiftY,
            0, shiftY, waterfallCanvas.width, waterfallCanvas.height - shiftY
        );

        for (let i = 0; i < bufferLength; i++) {
            const dbVal = dataArray[i];
            const color = getWaterfallColor(dbVal + calibrationOffset);
            
            const x1 = (Math.log10(i + 1) / Math.log10(bufferLength)) * canvas.width;
            const x2 = (Math.log10(i + 2) / Math.log10(bufferLength)) * canvas.width;
            
            waterfallCtx.fillStyle = color;
            waterfallCtx.fillRect(x1, 0, Math.max(1.5, x2 - x1), shiftY);
        }

        ctx.drawImage(waterfallCanvas, 0, 0);
    }

    // --- Listeners: Controls ---
    const avgSlider = document.getElementById('rta-averaging');
    const avgVal = document.getElementById('avg-val');
    if (avgSlider) {
        avgSlider.addEventListener('input', (e) => {
            averagingFactor = parseInt(e.target.value);
            if (avgVal) avgVal.textContent = averagingFactor;
        });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (isAnalyzing) stopAnalyzer();
            else window.startAnalyzer();
        });
    }
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');
            if (mode === 'waterfall' && !window.isPremiumActive('spectrogram')) {
                showProUpgradeModal('spectrogram');
                return;
            }
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = mode;
        });
    });

    weightBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            weightBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWeighting = btn.getAttribute('data-weight');
        });
    });

    if (calSlider) {
        calSlider.addEventListener('input', () => {
            calibrationOffset = parseFloat(calSlider.value);
            if (calValue) calValue.textContent = calibrationOffset;
        });
    }

    if (peakToggle) {
        peakToggle.addEventListener('click', () => {
            peakHoldEnabled = !peakHoldEnabled;
            peakToggle.classList.toggle('active', peakHoldEnabled);
            peakToggle.textContent = peakHoldEnabled ? 'ON' : 'OFF';
        });
    }

    if (peakReset) {
        peakReset.addEventListener('click', () => {
            peakData.fill(-100);
        });
    }

    if (btnCapture) {
        btnCapture.addEventListener('click', captureNewSnapshot);
    }

    const btnRtaPinkNoise = document.getElementById('btn-rta-pink-noise');
    if (btnRtaPinkNoise) {
        btnRtaPinkNoise.addEventListener('click', () => {
            toggleRtaPinkNoise();
        });
    }

    const btnClearAll = document.getElementById('btn-clear-all-snapshots');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            if (confirm("Clear all 10 snapshot slots?")) {
                snapshots = [];
                saveConfigToCloud('rta_snapshots', { snapshots });
                renderSnapshotSlots();
            }
        });
    }

    // --- Mic Calibration Event Listeners ---
    const micCalModal = document.getElementById('mic-cal-modal');
    const btnMicCalModal = document.getElementById('btn-mic-cal-modal');
    const btnCloseMicCal = document.getElementById('btn-close-mic-cal');
    const calDropZone = document.getElementById('cal-drop-zone');
    const calFileInput = document.getElementById('cal-file-input');
    const calTextInput = document.getElementById('cal-text-input');
    const btnSaveCal = document.getElementById('btn-save-cal');
    const btnClearCal = document.getElementById('btn-clear-cal');
    const calStatusBadge = document.getElementById('cal-status-badge');
    const calDetails = document.getElementById('cal-details');

    if (btnMicCalModal) {
        btnMicCalModal.addEventListener('click', () => {
            if (!window.isPremiumActive('mic_calibration')) {
                showProUpgradeModal('mic_calibration');
                return;
            }
            openModal(micCalModal);
        });
    }

    if (btnCloseMicCal) {
        btnCloseMicCal.addEventListener('click', () => closeModal(micCalModal));
    }

    if (calDropZone) {
        calDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            calDropZone.classList.add('dragover');
        });

        calDropZone.addEventListener('dragleave', () => {
            calDropZone.classList.remove('dragover');
        });

        calDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            calDropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) loadCalFile(file);
        });

        calDropZone.addEventListener('click', () => {
            calFileInput.click();
        });
    }

    if (calFileInput) {
        calFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) loadCalFile(file);
        });
    }

    function loadCalFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            calTextInput.value = e.target.result;
            if (calDropZone) {
                calDropZone.style.borderColor = 'var(--primary)';
                setTimeout(() => calDropZone.style.borderColor = '', 1000);
            }
        };
        reader.readAsText(file);
    }

    if (btnSaveCal) {
        btnSaveCal.addEventListener('click', async () => {
            const text = calTextInput.value.trim();
            if (!text) {
                alert("Please paste value pairs or drop a calibration file first.");
                return;
            }

            const parsed = parseCalibrationData(text);
            if (parsed.length === 0) {
                alert("No valid calibration points found. Please verify the file format (frequency offset).");
                return;
            }

            calProfile = parsed;
            calEnabled = true;
            precomputeCalibrationOffsets();

            if (calStatusBadge) {
                calStatusBadge.textContent = "ACTIVE";
                calStatusBadge.className = "cal-status-badge active";
            }
            if (calDetails) {
                calDetails.textContent = `${parsed.length} points applied`;
            }

            await saveConfigToCloud('mic_calibration', {
                text: text,
                enabled: true,
                pointsCount: parsed.length
            });

            closeModal(micCalModal);
        });
    }

    if (btnClearCal) {
        btnClearCal.addEventListener('click', async () => {
            calProfile = [];
            calOffsets = null;
            calEnabled = false;
            calTextInput.value = '';
            
            if (calStatusBadge) {
                calStatusBadge.textContent = "NO PROFILE ACTIVE";
                calStatusBadge.className = "cal-status-badge inactive";
            }
            if (calDetails) {
                calDetails.textContent = "Standard response applied (flat)";
            }

            await saveConfigToCloud('mic_calibration', {
                text: '',
                enabled: false,
                pointsCount: 0
            });

            closeModal(micCalModal);
        });
    }

    async function pullCalibrationProfile() {
        if (!window.isUserPro || !window.supabaseClient) return;
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) return;

            const { data, error } = await window.supabaseClient
                .from('user_configs')
                .select('data')
                .eq('user_id', session.user.id)
                .eq('config_type', 'mic_calibration')
                .maybeSingle();

            if (data && data.data && data.data.text) {
                const text = data.data.text;
                calTextInput.value = text;
                const parsed = parseCalibrationData(text);
                if (parsed.length > 0) {
                    calProfile = parsed;
                    calEnabled = data.data.enabled !== false;
                    precomputeCalibrationOffsets();

                    if (calStatusBadge) {
                        calStatusBadge.textContent = calEnabled ? "ACTIVE" : "INACTIVE";
                        calStatusBadge.className = calEnabled ? "cal-status-badge active" : "cal-status-badge inactive";
                    }
                    if (calDetails) {
                        calDetails.textContent = `${parsed.length} points applied`;
                    }
                }
            }
        } catch (err) {
            console.warn("Could not pull calibration profile", err);
        }
    }

    pullCalibrationProfile();
    document.addEventListener('authSuccess', pullCalibrationProfile);

    // --- Dynamic Pro Lock UI Synchronization ---
    function syncProLockUI() {
        const isWaterfallPro = window.isPremiumActive('spectrogram');
        const btnWaterfall = Array.from(modeBtns).find(btn => btn.getAttribute('data-mode') === 'waterfall');
        if (btnWaterfall) {
            btnWaterfall.classList.toggle('locked-pro', !isWaterfallPro);
            btnWaterfall.innerHTML = isWaterfallPro 
                ? 'WATERFALL' 
                : '<span class="material-symbols-outlined" style="font-size:12px; margin-right:4px; vertical-align: middle;">lock</span>WATERFALL';
        }

        const isCalPro = window.isPremiumActive('mic_calibration');
        if (btnMicCalModal) {
            btnMicCalModal.classList.toggle('locked-pro', !isCalPro);
            btnMicCalModal.innerHTML = isCalPro 
                ? '<span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">settings_input_antenna</span> LOAD PROFILE'
                : '<span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">lock</span> LOAD PROFILE';
        }
    }

    document.addEventListener('proStatusChanged', (e) => {
        syncProLockUI();
        renderSnapshotSlots();
    });

    // Run initial sync on load
    syncProLockUI(window.isPremiumActive());
    if (window.updatePremiumUI) window.updatePremiumUI();

    // --- Cloud Sync ---
    async function pullSnapshots() {
        if (typeof supabaseClient === 'undefined') return;
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        try {
            const { data } = await supabaseClient
                .from('user_configs')
                .select('data')
                .eq('user_id', session.user.id)
                .eq('config_type', 'rta_snapshots')
                .maybeSingle();


            if (data && data.data && data.data.snapshots) {
                snapshots = data.data.snapshots;
                renderSnapshotSlots();
            }
        } catch (err) {
            console.error('Cloud Pull Error (RTA):', err);
        }
    }

    pullSnapshots();
    document.addEventListener('authSuccess', pullSnapshots);


    // --- Premium Fullscreen & Rewarded Ad Features ---
    function syncRtaCanvasSize() {
        const wrapper = canvas.parentElement;
        if (!wrapper) return;
        if (isFullscreenActive) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        } else {
            canvas.width = wrapper.clientWidth;
            canvas.height = wrapper.clientHeight;
        }
        
        // Resize spectrogram waterfall cache canvas in lockstep
        if (waterfallCanvas) {
            waterfallCanvas.width = canvas.width;
            waterfallCanvas.height = canvas.height;
            if (waterfallCtx) {
                waterfallCtx.fillStyle = '#050508';
                waterfallCtx.fillRect(0, 0, waterfallCanvas.width, waterfallCanvas.height);
            }
        }
    }

    function toggleRtaFullscreen(forceState) {
        const wrapper = canvas.parentElement;
        if (!wrapper) return;
        
        const btnFullscreen = document.getElementById('btn-rta-fullscreen');
        let targetState = (forceState !== undefined) ? forceState : !isFullscreenActive;
        
        if (targetState) {
            isFullscreenActive = true;
            wrapper.classList.add('fullscreen-canvas');
            if (btnFullscreen) {
                btnFullscreen.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">fullscreen_exit</span>';
            }
            document.body.style.overflow = 'hidden'; // Stop background scrolling
        } else {
            isFullscreenActive = false;
            wrapper.classList.remove('fullscreen-canvas');
            if (btnFullscreen) {
                btnFullscreen.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">fullscreen</span>';
            }
            document.body.style.overflow = ''; // Restore background scrolling
        }
        
        syncRtaCanvasSize();
    }

    let isAdRewardForPro = false;

    // Capacitor Native AdMob integration helpers
    window.isNativeMobile = function() {
        return typeof window !== 'undefined' && window.Capacitor !== undefined;
    };

    let nativeRewardedAdLoaded = false;

    async function preloadNativeRewardedAd() {
        if (!window.isNativeMobile()) return;
        try {
            const { AdMob } = window.Capacitor.Plugins;
            if (!AdMob) return;
            const isAndroid = window.Capacitor.getPlatform() === 'android';
            const adId = isAndroid 
                ? 'ca-app-pub-3940256099942544/5224354917' 
                : 'ca-app-pub-3940256099942544/1712485313';
            console.log('Preloading native rewarded ad with unit ID:', adId);
            await AdMob.prepareRewardVideoAd({ adId: adId });
            nativeRewardedAdLoaded = true;
        } catch (err) {
            console.error('Error preloading native rewarded video ad:', err);
            nativeRewardedAdLoaded = false;
        }
    }

    async function showNativeRewardedAd(onRewardCallback, onFailureCallback) {
        if (!window.isNativeMobile()) {
            if (onFailureCallback) onFailureCallback();
            return;
        }
        try {
            const { AdMob } = window.Capacitor.Plugins;
            if (!AdMob) {
                if (onFailureCallback) onFailureCallback();
                return;
            }
            const rewardListener = await AdMob.addListener('onRewardVideoAdRewarded', (info) => {
                console.log('Native AdMob rewarded reward received:', info);
                rewardListener.remove();
                if (onRewardCallback) onRewardCallback();
            });
            const closeListener = await AdMob.addListener('onRewardVideoAdClosed', () => {
                closeListener.remove();
                preloadNativeRewardedAd();
            });
            if (!nativeRewardedAdLoaded) {
                await preloadNativeRewardedAd();
            }
            await AdMob.showRewardVideoAd();
        } catch (err) {
            console.error('Failed to show native AdMob rewarded ad:', err);
            if (onFailureCallback) onFailureCallback();
        }
    }

    function startAdPlayback(forPro = false) {
        isAdRewardForPro = !!forPro;
        
        if (window.isNativeMobile()) {
            console.log('Native mobile detected. Launching native AdMob Rewarded Video...');
            const { AdMob } = window.Capacitor?.Plugins || {};
            if (!AdMob) {
                console.log('AdMob native plugin not found/configured. Auto-granting reward for local mobile debugging.');
                grantAdRewardSuccess();
                return;
            }

            showNativeRewardedAd(
                () => {
                    console.log('Native AdMob Reward granted!');
                    grantAdRewardSuccess();
                },
                () => {
                    console.warn('Native AdMob failed. Auto-granting reward to prevent lockout in mobile.');
                    grantAdRewardSuccess();
                }
            );
            return;
        }
        
        triggerBrowserAdPlayback();
    }

    function grantAdRewardSuccess() {
        if (isAdRewardForPro) {
            const duration = 4 * 60 * 60 * 1000; // 4 Hours
            let unlockedFeatureName = "SoundEngg Pro Features";
            if (currentUnlockFeatureKey) {
                if (currentUnlockFeatureKey === 'blog' && window.pendingArticleToOpen) {
                    safeStorage.setItem(`soundengg_temp_pro_until_blog_${window.pendingArticleToOpen}`, Date.now() + duration);
                    unlockedFeatureName = "Selected Premium Guide";
                } else {
                    const persistenceKey = currentUnlockFeatureKey === 'ear_training_track' ? 'ear_training' : currentUnlockFeatureKey;
                    safeStorage.setItem(`soundengg_temp_pro_until_${persistenceKey}`, Date.now() + duration);
                    if (currentUnlockFeatureKey === 'spectrogram') {
                        unlockedFeatureName = "60FPS Spectrogram Waterfall";
                    } else if (currentUnlockFeatureKey === 'snapshots') {
                        unlockedFeatureName = "10 Multi-Overlay RTA Snapshots";
                    } else if (currentUnlockFeatureKey === 'mic_calibration') {
                        unlockedFeatureName = "Custom Mic Calibration Loader";
                    } else if (currentUnlockFeatureKey === 'ear_training') {
                        unlockedFeatureName = "1/6 ISO Octave Ear Training";
                    } else if (currentUnlockFeatureKey === 'ear_training_track') {
                        unlockedFeatureName = "Reference Track";
                    }
                }
            } else {
                safeStorage.setItem('soundengg_temp_pro_until', Date.now() + duration);
            }
            
            const proUpgradeModal = document.getElementById('pro-upgrade-modal');
            if (proUpgradeModal) proUpgradeModal.classList.add('hidden');
            
            const dynamicUpgradeModal = document.getElementById('dynamic-upgrade-modal');
            if (dynamicUpgradeModal) dynamicUpgradeModal.classList.add('hidden');
            
            if (window.updatePremiumUI) {
                window.updatePremiumUI();
            }
            
            if (currentUnlockFeatureKey === 'blog' && window.pendingArticleToOpen) {
                const blogId = window.pendingArticleToOpen;
                // Dispatch event so rendering updates
                document.dispatchEvent(new CustomEvent('proStatusChanged'));
                
                const blogView = document.getElementById('blog-view');
                const btnNavBlog = document.getElementById('btn-nav-blog');
                if (window.showView && blogView) {
                    window.showView(blogView, btnNavBlog);
                }
                
                // Open the article!
                if (typeof window.openBlogArticle === 'function') {
                    window.openBlogArticle(blogId);
                }
                
                window.pendingArticleToOpen = null;
            }
            
            alert(`🎉 Awesome! You have successfully unlocked ${unlockedFeatureName} for the next 4 hours.`);
        } else {
            isAdRewardClaimed = true;
            toggleRtaFullscreen(true);
        }
    }

    function triggerBrowserAdPlayback() {
        const modal = document.getElementById('ad-reward-modal');
        const btnClaim = document.getElementById('btn-ad-reward-claim');
        const countdownBar = document.getElementById('ad-reward-countdown-bar');
        const btnText = document.getElementById('ad-reward-btn-text');
        const btnIcon = document.getElementById('ad-reward-btn-icon');
        const alertBox = document.getElementById('ad-reward-alert');
        const descText = document.getElementById('ad-reward-text-desc');

        if (!modal) return;

        adSecondsRemaining = 15;
        if (alertBox) alertBox.style.display = 'none';
        
        if (descText) {
            if (isAdRewardForPro) {
                let featLabel = "your selected tool";
                if (currentUnlockFeatureKey === 'blog') {
                    featLabel = "your selected guide";
                }
                descText.innerHTML = `Watch this 15-second sponsor showcase of premium engineering gear to unlock **${featLabel}** for the next **4 hours**.`;
            } else {
                descText.innerHTML = 'Watch this 15-second sponsor showcase of premium engineering gear to unlock the **Pro View Fullscreen Analyzer** for this session.';
            }
        }
        
        if (btnClaim) {
            btnClaim.disabled = true;
            if (btnText) btnText.textContent = `🔒 Skip Ad in ${adSecondsRemaining}s`;
            if (btnIcon) btnIcon.textContent = 'lock';
        }
        
        if (countdownBar) {
            countdownBar.style.transition = 'none';
            countdownBar.style.width = '100%';
            countdownBar.offsetHeight; // Force reflow
            countdownBar.style.transition = 'width 15s linear';
            countdownBar.style.width = '0%';
        }

        modal.classList.add('active');

        // Dynamically request AdSense render if available
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {}

        if (adCountdownTimer) clearInterval(adCountdownTimer);
        
        adCountdownTimer = setInterval(() => {
            adSecondsRemaining--;
            if (adSecondsRemaining > 0) {
                if (btnText) btnText.textContent = `🔒 Skip Ad in ${adSecondsRemaining}s`;
            } else {
                clearInterval(adCountdownTimer);
                adCountdownTimer = null;
                
                if (btnClaim) {
                    btnClaim.disabled = false;
                    if (btnText) {
                        btnText.textContent = isAdRewardForPro 
                            ? '🎁 CLAIM REWARD: UNLOCK 4-HOUR PRO' 
                            : '🎁 CLAIM REWARD: UNLOCK FULLSCREEN';
                    }
                    if (btnIcon) btnIcon.textContent = 'redeem';
                }
            }
        }, 1000);
    }

    function closeAdPlayback(isAborted) {
        const modal = document.getElementById('ad-reward-modal');
        const alertBox = document.getElementById('ad-reward-alert');
        
        if (adCountdownTimer) {
            clearInterval(adCountdownTimer);
            adCountdownTimer = null;
        }

        if (isAborted) {
            if (alertBox) {
                alertBox.style.display = 'block';
                setTimeout(() => {
                    if (modal) modal.classList.remove('active');
                }, 1800);
            } else {
                if (modal) modal.classList.remove('active');
            }
        } else {
            if (modal) modal.classList.remove('active');
        }
    }

    // Floating Button Click Trigger
    const btnFullscreen = document.getElementById('btn-rta-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const isUserPremium = window.isPremiumActive();
            
            if (isUserPremium || isAdRewardClaimed) {
                toggleRtaFullscreen();
            } else {
                startAdPlayback(false);
            }
        });
    }

    // Window Resize Handler for RTA view
    window.addEventListener('resize', () => {
        if (document.getElementById('rta-view').style.display !== 'none') {
            syncRtaCanvasSize();
        }
    });

    // Ad Modal Close & Skip logic
    const btnCloseAdReward = document.getElementById('btn-close-ad-reward');
    if (btnCloseAdReward) {
        btnCloseAdReward.addEventListener('click', () => {
            if (adSecondsRemaining > 0) {
                const promptMsg = isAdRewardForPro 
                    ? "Cancel ad playback? You will not unlock the 4-Hour Pro access."
                    : "Cancel ad playback? You will not unlock the premium fullscreen RTA view.";
                if (confirm(promptMsg)) {
                    closeAdPlayback(true);
                }
            } else {
                closeAdPlayback(false);
            }
        });
    }

    const btnClaimAdReward = document.getElementById('btn-ad-reward-claim');
    if (btnClaimAdReward) {
        btnClaimAdReward.addEventListener('click', () => {
            closeAdPlayback(false);
            grantAdRewardSuccess();
        });
    }

    const btnWatchAdProUnlock = document.getElementById('btn-watch-ad-pro-unlock');
    if (btnWatchAdProUnlock) {
        btnWatchAdProUnlock.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            startAdPlayback(true);
        });
    }

    renderSnapshotSlots(); 

    // RTA Input Change Handler (Rebuild stream & Sync global settings)
    if (inputSelect) {
        inputSelect.addEventListener('change', async (e) => {
            const newDeviceId = e.target.value;
            safeStorage.setItem('soundengg-mic-id', newDeviceId);
            
            const globalMic = document.getElementById('global-mic-select');
            if (globalMic) globalMic.value = newDeviceId;
            
            if (isAnalyzing) {
                // Hot-swap active stream
                isAnalyzing = false;
                if (rafID) cancelAnimationFrame(rafID);
                if (stream) {
                    stream.getTracks().forEach(t => t.stop());
                    stream = null;
                }
                await startAnalyzer(newDeviceId);
            }
            
            document.dispatchEvent(new CustomEvent('deviceChanged', { detail: newDeviceId }));
        });
    }

    // RTA Output Change Handler (Sync global settings & Apply routes)
    if (outputSelect) {
        outputSelect.addEventListener('change', async (e) => {
            const newDeviceId = e.target.value;
            safeStorage.setItem('soundengg-output-id', newDeviceId);
            
            const globalOutput = document.getElementById('global-output-select');
            if (globalOutput) globalOutput.value = newDeviceId;
            
            if (window.applyAudioOutput) {
                await window.applyAudioOutput(newDeviceId);
            }
            
            document.dispatchEvent(new CustomEvent('outputDeviceChanged', { detail: newDeviceId }));
        });
    }

    // Sync input changes from global settings
    document.addEventListener('deviceChanged', async (e) => {
        const newDeviceId = e.detail;
        if (inputSelect) {
            inputSelect.value = newDeviceId;
        }
        if (isAnalyzing) {
            isAnalyzing = false;
            if (rafID) cancelAnimationFrame(rafID);
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
                stream = null;
            }
            await startAnalyzer(newDeviceId);
        }
    });

    // Sync output changes from global settings & Apply routes
    document.addEventListener('outputDeviceChanged', async (e) => {
        const newDeviceId = e.detail;
        if (outputSelect && outputSelect.value !== newDeviceId) {
            outputSelect.value = newDeviceId;
        }
        if (audioCtx && typeof audioCtx.setSinkId === 'function') {
            try {
                await audioCtx.setSinkId(newDeviceId);
                console.log("RTA AudioContext successfully routed to:", newDeviceId);
            } catch (err) {
                console.warn("Failed to route RTA AudioContext on outputDeviceChanged:", err);
            }
        }
    });

    // Initial enumeration
    if (window.populateAllAudioDevices) {
        window.populateAllAudioDevices();
    } else {
        getDevices();
    }
}

// --- SIGNAL GENERATOR CORE LOGIC ---
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
        btnToggle.innerHTML = '<span class="material-symbols-outlined">stop_circle</span> DISENGAGE_OUTPUT';
        statusBadge.textContent = 'STATUS: ACTIVE';
        statusBadge.classList.add('active');
    }

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
        btnToggle.innerHTML = '<span class="material-symbols-outlined">power_settings_new</span> ENGAGE_OUTPUT';
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
        if (!isPlaying || !oscillator) {
            startOutput();
        }
        
        const duration = parseFloat(sweepTimeInput.value) || 5;
        const startTime = audioCtx.currentTime;
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
            const progress = elapsed / duration;
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

// --- EAR TRAINING LOGIC ---
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
                showProUpgradeModal('ear_training');
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
                    showProUpgradeModal('ear_training_track');
                } else {
                    showProUpgradeModal('ear_training');
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

// --- TUNER LOGIC ---
function initTuner() {
    let audioCtx = null;
    let analyser = null;
    let mediaStreamSource = null;
    let isTuning = false;
    let rafID = null;
    let A4 = 440;
    let smoothedPitch = -1;
    
    let currentMode = 'needle'; // needle, strobe, bar
    let strobePhase = 0;
    let noiseThreshold = 0.040; // Default noise gate threshold (40 RMS = -28.0 dB FS) to filter room noise

    const btnStart = document.getElementById('btn-start-tuner');
    const a4Input = document.getElementById('tuner-a4-ref');
    const modeBtns = document.querySelectorAll('.tuner-mode-btn');
    
    const noteDisplay = document.getElementById('tuner-note-display');
    const centsDisplay = document.getElementById('tuner-cents-display');
    const freqDisplay = document.getElementById('tuner-freq-val');
    const statusText = document.getElementById('tuner-status-text');
    const canvas = document.getElementById('tuner-canvas');
    let ctx = null;

    if (!btnStart || !canvas) return;

    ctx = canvas.getContext('2d');
    const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    function autoCorrelate(buf, sampleRate) {
        let SIZE = buf.length;
        let rms = 0;
        for (let i = 0; i < SIZE; i++) {
            let val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < noiseThreshold) return -1;

        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

        buf = buf.slice(r1, r2);
        SIZE = buf.length;

        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + buf[j] * buf[j + i];
            }
        }

        let d = 0; while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        let T0 = maxpos;

        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    }

    function noteFromPitch(frequency) {
        let noteNum = 12 * (Math.log(frequency / A4) / Math.log(2));
        return Math.round(noteNum) + 69;
    }

    function frequencyFromNoteNumber(note) {
        return A4 * Math.pow(2, (note - 69) / 12);
    }

    function centsOffFromPitch(frequency, note) {
        return Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2));
    }

    function updatePitch() {
        if (!isTuning) return;

        let buf = new Float32Array(2048);
        analyser.getFloatTimeDomainData(buf);
        let pitch = autoCorrelate(buf, audioCtx.sampleRate);

        if (pitch == -1) {
            smoothedPitch = -1;
            drawVisualizer(null);
            noteDisplay.textContent = "--";
            centsDisplay.textContent = "0¢";
            freqDisplay.textContent = "---.-";
            statusText.textContent = "WAITING FOR SIGNAL";
            centsDisplay.className = "tuner-cents";
        } else {
            // Apply exponential smoothing unless there is a huge jump (new note)
            if (smoothedPitch === -1 || Math.abs(smoothedPitch - pitch) > 30) {
                smoothedPitch = pitch;
            } else {
                smoothedPitch = smoothedPitch * 0.80 + pitch * 0.20; // 80% old, 20% new
            }

            let note = noteFromPitch(smoothedPitch);
            let noteName = noteStrings[note % 12];
            let octave = Math.floor(note / 12) - 1;
            let cents = centsOffFromPitch(smoothedPitch, note);
            
            noteDisplay.textContent = `${noteName}${octave}`;
            freqDisplay.textContent = smoothedPitch.toFixed(1);
            
            let centsText = (cents > 0 ? "+" : "") + cents + "¢";
            centsDisplay.textContent = centsText;

            if (Math.abs(cents) <= 3) {
                centsDisplay.className = "tuner-cents in-tune";
                statusText.textContent = "IN TUNE";
                statusText.style.color = "#10b981";
            } else {
                centsDisplay.className = "tuner-cents";
                statusText.textContent = cents > 0 ? "SHARP" : "FLAT";
                statusText.style.color = "var(--text-muted)";
            }

            drawVisualizer(cents);
        }

        if (!window.requestAnimationFrame) window.requestAnimationFrame = window.webkitRequestAnimationFrame;
        rafID = window.requestAnimationFrame(updatePitch);
    }

    function drawVisualizer(cents) {
        let w = canvas.width;
        let h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const isLight = document.documentElement.classList.contains('light');
        const colorMain = isLight ? '#2d3748' : '#e2e8f0';
        const colorPrimary = '#14A7B5';
        const colorSuccess = '#10b981';
        const colorDanger = '#ef4444';

        if (currentMode === 'needle') {
            ctx.beginPath();
            ctx.arc(w/2, h + 50, h, Math.PI + 0.2, Math.PI * 2 - 0.2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = isLight ? '#94a3b8' : '#4a5568';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(w/2, 50);
            ctx.lineTo(w/2, 70);
            ctx.lineWidth = 4;
            ctx.strokeStyle = colorSuccess;
            ctx.stroke();

            if (cents !== null) {
                let angle = (cents / 50) * (Math.PI / 4); 
                if (angle > Math.PI / 4) angle = Math.PI / 4;
                if (angle < -Math.PI / 4) angle = -Math.PI / 4;
                
                ctx.save();
                ctx.translate(w/2, h + 50);
                ctx.rotate(angle);
                
                let needleColor = Math.abs(cents) <= 3 ? colorSuccess : colorDanger;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -h + 10);
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.strokeStyle = needleColor;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI*2);
                ctx.fillStyle = needleColor;
                ctx.fill();
                
                ctx.restore();
            }
        } 
        else if (currentMode === 'bar') {
            ctx.beginPath();
            ctx.moveTo(w/2, h/2 - 20);
            ctx.lineTo(w/2, h/2 + 20);
            ctx.lineWidth = 2;
            ctx.strokeStyle = colorMain;
            ctx.stroke();

            if (cents !== null) {
                let barW = (Math.abs(cents) / 50) * (w / 2);
                if (barW > w/2) barW = w/2;
                
                let barColor = Math.abs(cents) <= 3 ? colorSuccess : (cents > 0 ? colorPrimary : colorDanger);
                ctx.fillStyle = barColor;
                
                if (cents > 0) {
                    ctx.fillRect(w/2, h/2 - 10, barW, 20);
                } else {
                    ctx.fillRect(w/2 - barW, h/2 - 10, barW, 20);
                }
            }
        }
        else if (currentMode === 'strobe') {
            if (cents !== null) {
                strobePhase += cents * 0.1; 
                let blockW = 40;
                let spacing = 20;
                let numBlocks = Math.ceil(w / (blockW + spacing)) + 1;
                
                ctx.fillStyle = Math.abs(cents) <= 3 ? colorSuccess : colorPrimary;
                
                for(let i=0; i<numBlocks; i++) {
                    let x = (i * (blockW + spacing) + strobePhase) % (w + blockW + spacing);
                    if (x < 0) x += w + blockW + spacing;
                    x -= (blockW + spacing);
                    ctx.fillRect(x, h/2 - 30, blockW, 60);
                }
                
                ctx.fillStyle = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
                ctx.fillRect(w/2 - 40, 0, 80, h);
                ctx.beginPath();
                ctx.moveTo(w/2, 0);
                ctx.lineTo(w/2, h);
                ctx.strokeStyle = colorSuccess;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }

    function resizeCanvas() {
        if (canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
    }

    window.addEventListener('resize', () => {
        if (document.getElementById('tuner-view').style.display !== 'none') {
            resizeCanvas();
            drawVisualizer(null);
        }
    });

    window.startTuner = function(deviceId) {
        if (isTuning) return;
        deviceId = deviceId || safeStorage.getItem('soundengg-mic-id') || 'default';
        const constraints = { audio: (deviceId && deviceId !== 'default') ? { deviceId: { exact: deviceId } } : true };
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            mediaStreamSource = audioCtx.createMediaStreamSource(stream);
            mediaStreamSource.connect(analyser);
            
            isTuning = true;
            resizeCanvas();
            updatePitch();
            
            btnStart.innerHTML = '<span class="material-symbols-outlined">mic_off</span> DEACTIVATE';
            btnStart.classList.add('active');
        }).catch(err => {
            alert('Microphone access denied. Please allow microphone permissions to use the Tuner.');
            btnStart.innerHTML = '<span class="material-symbols-outlined">mic</span> ACTIVATE_MIC';
        });
    };

    function stopTuner() {
        if (!isTuning) return;
        isTuning = false;
        window.cancelAnimationFrame(rafID);
        if (mediaStreamSource) mediaStreamSource.disconnect();
        if (audioCtx) audioCtx.suspend();
        btnStart.innerHTML = '<span class="material-symbols-outlined">mic</span> ACTIVATE_MIC';
        btnStart.classList.remove('active');
        drawVisualizer(null);
        statusText.textContent = "TUNER INACTIVE";
        statusText.style.color = "var(--text-muted)";
    }
    window.stopTuner = stopTuner;

    btnStart.addEventListener('click', () => {
        if (isTuning) {
            stopTuner();
        } else {
            btnStart.innerHTML = 'CONNECTING...';
            window.startTuner();
        }
    });

    if (a4Input) {
        a4Input.addEventListener('change', (e) => {
            A4 = parseFloat(e.target.value) || 440;
        });
    }

    const thresholdInput = document.getElementById('tuner-threshold');
    const thresholdValDisplay = document.getElementById('tuner-threshold-val');
    
    if (thresholdInput) {
        const rmsToDb = (rms) => {
            if (rms <= 0) return "-∞";
            return (20 * Math.log10(rms)).toFixed(1);
        };

        // Load custom threshold from safeStorage if available
        const savedThresh = safeStorage.getItem('soundengg-tuner-threshold');
        if (savedThresh) {
            noiseThreshold = parseFloat(savedThresh);
            thresholdInput.value = savedThresh;
        } else {
            noiseThreshold = 0.040;
            thresholdInput.value = 0.040;
        }

        if (thresholdValDisplay) {
            thresholdValDisplay.textContent = `${rmsToDb(noiseThreshold)} dB`;
        }

        thresholdInput.addEventListener('input', (e) => {
            noiseThreshold = parseFloat(e.target.value) || 0.040;
            if (thresholdValDisplay) thresholdValDisplay.textContent = `${rmsToDb(noiseThreshold)} dB`;
            safeStorage.setItem('soundengg-tuner-threshold', noiseThreshold.toFixed(3));
        });
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.getAttribute('data-mode');
            if (!isTuning) drawVisualizer(null);
        });
    });

    window.resizeTunerCanvas = resizeCanvas;
    window.drawTunerVisualizer = drawVisualizer;
    
    // Initial resize and draw
    resizeCanvas();
    drawVisualizer(null);

    // Listen for device changes to dynamically update tuner input source
    document.addEventListener('deviceChanged', (e) => {
        if (isTuning) {
            stopTuner();
            window.startTuner(e.detail);
        }
    });
}

// --- SUB CALCULATOR LOGIC ---
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
            c_ms = 331.3 + (0.606 * t); // m/s
        } else {
            let t_c = (t - 32) * 5/9;
            c_ms = 331.3 + (0.606 * t_c); // still m/s internally
        }
        
        let displaySpeed = isMetric ? c_ms : (c_ms * 3.28084);
        
        document.getElementById('subcalc-speed-val').textContent = displaySpeed.toFixed(1);
        document.getElementById('subcalc-freq-label').textContent = f + " HZ";

        // Wavelengths
        let lambda_m = c_ms / f;
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
            cardioidSpaceM = lambda_m / 4;
            cardioidDelayMs = (cardioidSpaceM / c_ms) * 1000;
            document.getElementById('cardioid-space').textContent = (cardioidSpaceM * unit_mult).toFixed(3);
        } else {
            let depthRaw = parseFloat(cDepthInput.value) || (isMetric ? 0.8 : 2.6);
            let depthM = isMetric ? depthRaw : (depthRaw / 3.28084);
            cardioidDelayMs = (depthM / c_ms) * 1000;
        }
        
        document.getElementById('cardioid-delay').textContent = cardioidDelayMs.toFixed(1);

        // End-Fire (1/4 lambda spacing)
        let delay_ms = ((lambda_m / 4) / c_ms) * 1000;
        document.getElementById('endfire-space').textContent = w1_4.toFixed(3);
        document.getElementById('endfire-delay').textContent = delay_ms.toFixed(1);

        // Broadside
        let bt = (lambda_m * (2/3)) * unit_mult;
        document.getElementById('broadside-half').textContent = w1_2.toFixed(3);
        document.getElementById('broadside-two-third').textContent = bt.toFixed(3);

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

// ==========================================
// AD MANAGER SYSTEM
// ==========================================
function initAdManager() {
    const modal = document.getElementById('ad-lock-modal');
    const stateOnline = document.getElementById('ad-state-online');
    const stateOffline = document.getElementById('ad-state-offline');
    const btnCloseAd = document.getElementById('btn-close-ad');
    const btnGracePeriod = document.getElementById('btn-grace-period');
    const btnBuyPro = document.getElementById('btn-buy-pro');
    const countdownEl = document.getElementById('ad-countdown');
    const appContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.top-bar'); // Using top-bar since sidebar is removed
    const bottomBanner = document.getElementById('bottom-sponsor-banner');

    if (!modal) return;

    if (window.isNativeMobile()) {
        console.log("Initializing native AdMob system inside Ad Manager...");
        try {
            const { AdMob } = window.Capacitor.Plugins;
            if (AdMob) {
                AdMob.initialize({
                    requestTrackingAuthorization: true
                }).then(() => {
                    preloadNativeRewardedAd();
                });
            }
        } catch (e) {
            console.error("Capacitor AdMob initialization error: ", e);
        }
    }

    let countdownInterval;
    let countdownVal = 15;

    function checkAdStatus() {
        // If user is premium active, always unlocked
        if (window.isPremiumActive()) {
            unlockApp();
            return;
        }

        const unlockedUntil = safeStorage.getItem('tools_unlocked_until');
        const now = Date.now();

        if (unlockedUntil && now < parseInt(unlockedUntil, 10)) {
            unlockApp();
        } else {
            lockApp();
        }
    }

    function lockApp() {
        if (appContent) appContent.classList.add('app-blurred');
        if (sidebar) sidebar.classList.add('app-blurred');
        if (bottomBanner) bottomBanner.classList.add('hidden');

        if (window.isNativeMobile()) {
            console.log('Native Mobile detected. Triggering mobile lock modal flow...');
            triggerMobileLock();
            return;
        }

        // Standard Web Browser Flow
        triggerBrowserLock();
    }

    function triggerMobileLock() {
        modal.classList.remove('hidden');

        if (navigator.onLine) {
            stateOnline.classList.remove('hidden');
            stateOffline.classList.add('hidden');
            
            // Customize modal online contents dynamically for mobile view
            const videoAdContainer = modal.querySelector('.video-ad-container');
            if (videoAdContainer) {
                videoAdContainer.innerHTML = `
                    <div class="native-ad-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 120px; padding: 1rem;">
                        <span class="material-symbols-outlined" style="font-size: 48px; color: var(--primary); text-shadow: 0 0 10px var(--primary-glow); animation: pulse 2s infinite;">smart_display</span>
                        <h4 style="font-family: var(--font-mono); color: #fff; margin: 0; font-size: 0.95rem; letter-spacing: 1px;">SPONSOR_REWARD_AD</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4; max-width: 250px; text-align: center;">
                            Support the project by playing a short video to unlock all tools.
                        </p>
                    </div>
                `;
            }

            // Enable the button by default on native mobile to watch ad
            btnCloseAd.disabled = false;
            btnCloseAd.innerHTML = '<span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 4px;">play_circle</span> Watch Ad to Unlock';
        } else {
            stateOnline.classList.add('hidden');
            stateOffline.classList.remove('hidden');
        }
    }

    function triggerBrowserLock() {
        modal.classList.remove('hidden');

        if (navigator.onLine) {
            stateOnline.classList.remove('hidden');
            stateOffline.classList.add('hidden');
            
            // Dynamically request AdSense render if available
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {}

            startAdCountdown();
        } else {
            stateOnline.classList.add('hidden');
            stateOffline.classList.remove('hidden');
        }
    }

    function unlockApp() {
        if (appContent) appContent.classList.remove('app-blurred');
        if (sidebar) sidebar.classList.remove('app-blurred');
        if (bottomBanner) bottomBanner.classList.remove('hidden');
        modal.classList.add('hidden');
    }

    function grantAccess(hours) {
        const ms = hours * 60 * 60 * 1000;
        safeStorage.setItem('tools_unlocked_until', Date.now() + ms);
        unlockApp();
    }

    function startAdCountdown() {
        countdownVal = 15;
        countdownEl.textContent = countdownVal;
        btnCloseAd.disabled = true;
        btnCloseAd.innerHTML = '<span class="material-symbols-outlined">lock</span> Wait for Ad';

        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            countdownVal--;
            countdownEl.textContent = countdownVal;
            if (countdownVal <= 0) {
                clearInterval(countdownInterval);
                btnCloseAd.disabled = false;
                btnCloseAd.innerHTML = '<span class="material-symbols-outlined">lock_open</span> Unlock Tools';
            }
        }, 1000);
    }

    // Listeners
    if (btnCloseAd) {
        btnCloseAd.addEventListener('click', () => {
            if (btnCloseAd.disabled) return;

            if (window.isNativeMobile()) {
                // Native mobile click triggers the native AdMob rewarded ad
                const originalText = btnCloseAd.innerHTML;
                btnCloseAd.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 1s linear infinite; vertical-align: middle; margin-right: 4px;">sync</span> Loading Ad...';
                btnCloseAd.disabled = true;

                showNativeRewardedAd(
                    () => {
                        console.log('Native Lock Ad completed successfully!');
                        grantAccess(6);
                    },
                    () => {
                        console.warn('Native AdMob failed to play. Unlocking app gracefully to prevent lockout.');
                        btnCloseAd.disabled = false;
                        btnCloseAd.innerHTML = originalText;
                        grantAccess(6); // Gracefully grant access to prevent lock out
                    }
                );
            } else {
                // Desktop Web Flow
                grantAccess(6);
            }
        });
    }

    if (btnGracePeriod) {
        btnGracePeriod.addEventListener('click', () => {
            grantAccess(2); // Grant 2 hours
        });
    }

    async function initiateRazorpayCheckout(user, plan = 'lifetime') {
        const keyId = window.RAZORPAY_KEY_ID || "rzp_test_SrF0fu6ZZuNFbC";
        
        let amount = 349900; // Default INR Lifetime
        let currency = "INR";
        let planDescription = "Lifetime SoundEngg Pro Access";

        if (window.isIndiaUser) {
            currency = "INR";
            if (plan === 'monthly') {
                amount = 19900;
                planDescription = "Monthly SoundEngg Pro Subscription";
            } else if (plan === 'yearly') {
                amount = 199900;
                planDescription = "Yearly SoundEngg Pro Subscription";
            } else {
                amount = 349900;
                planDescription = "Lifetime SoundEngg Pro Access";
            }
        } else {
            currency = "USD";
            if (plan === 'monthly') {
                amount = 299;
                planDescription = "Monthly SoundEngg Pro Subscription";
            } else if (plan === 'yearly') {
                amount = 2999;
                planDescription = "Yearly SoundEngg Pro Subscription";
            } else {
                amount = 4999;
                planDescription = "Lifetime SoundEngg Pro Access";
            }
        }

        // Show checkout overlay spinner
        let loadingOverlay = document.createElement('div');
        loadingOverlay.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10,15,20,0.85); backdrop-filter: blur(10px); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: sans-serif;";
        loadingOverlay.innerHTML = `
            <div style="width: 50px; height: 50px; border: 4px solid var(--primary, #14A7B5); border-top-color: transparent; border-radius: 50%; animation: spin 1s infinite linear; margin-bottom: 20px;"></div>
            <div style="font-size: 1.1rem; font-weight: 500; letter-spacing: 0.5px;">Establishing secure handshake...</div>
            <div style="font-size: 0.85rem; color: #888; margin-top: 8px;">Contacting Razorpay gateway securely</div>
        `;
        document.body.appendChild(loadingOverlay);

        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) throw new Error("No active session found. Please log in.");

            // 1. Backend handshake to pre-create Razorpay Order / Subscription securely
            const edgeFuncUrl = "https://ewudkzyjcvjxxqpqnqiy.supabase.co/functions/v1/razorpay-checkout";
            const response = await fetch(edgeFuncUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    action: "create_checkout",
                    plan: plan,
                    user_currency: currency
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to initialize payment handshake with server.");
            }

            loadingOverlay.remove();

            const options = {
                key: keyId,
                name: "SoundEngg Console",
                description: planDescription,
                image: "assets/img/logo.png",
                prefill: {
                    name: user.email ? user.email.split('@')[0] : "Audio Engineer",
                    email: user.email || ""
                },
                theme: {
                    color: "#14A7B5"
                },
                handler: async function (verifyResponse) {
                    // Show a secure verification overlay
                    let verifyOverlay = document.createElement('div');
                    verifyOverlay.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10,15,20,0.85); backdrop-filter: blur(10px); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: sans-serif;";
                    verifyOverlay.innerHTML = `
                        <div style="width: 50px; height: 50px; border: 4px solid var(--primary, #14A7B5); border-top-color: transparent; border-radius: 50%; animation: spin 1s infinite linear; margin-bottom: 20px;"></div>
                        <div style="font-size: 1.1rem; font-weight: 500; letter-spacing: 0.5px;">Verifying payment signature...</div>
                        <div style="font-size: 0.85rem; color: #888; margin-top: 8px;">Synchronizing subscription data securely...</div>
                    `;
                    document.body.appendChild(verifyOverlay);

                    try {
                        const verifyResultRaw = await fetch(edgeFuncUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({
                                action: "verify_payment",
                                plan: plan,
                                payment_id: verifyResponse.razorpay_payment_id,
                                order_id: verifyResponse.razorpay_order_id || data.order_id,
                                subscription_id: verifyResponse.razorpay_subscription_id || data.subscription_id,
                                signature: verifyResponse.razorpay_signature
                            })
                        });

                        const verifyResult = await verifyResultRaw.json();
                        if (!verifyResultRaw.ok || !verifyResult.success) {
                            throw new Error(verifyResult.error || "Payment signature mismatch.");
                        }

                        // Success! Update local storage for absolute resilience
                        safeStorage.setItem('tools_unlocked_until', (plan === 'lifetime') ? (Date.now() + (10 * 365 * 24 * 60 * 60 * 1000)) : (Date.now() + (plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000));
                        
                        await syncSubscriptionStatus(session);
                        
                        const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                        if (proUpgradeModal) proUpgradeModal.classList.add('hidden');
                        
                        if (window.updatePremiumUI) {
                            window.updatePremiumUI();
                        }
                        
                        unlockApp();
                        verifyOverlay.remove();
                        showCheckoutSuccessOverlay(plan);

                    } catch (verifyErr) {
                        verifyOverlay.remove();
                        console.error("Signature verification failed:", verifyErr);
                        alert(`❌ Verification Failed: ${verifyErr.message}\nPlease contact support@soundengg.com with your payment ID: ${verifyResponse.razorpay_payment_id}`);
                    }
                }
            };

            // Dynamically assign order or subscription ID based on response
            if (data.order_id) {
                options.order_id = data.order_id;
            } else if (data.subscription_id) {
                options.subscription_id = data.subscription_id;
            }

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (resp) {
                alert("❌ Payment Failed: " + resp.error.description);
            });
            rzp.open();

        } catch (e) {
            loadingOverlay.remove();
            console.error("Secure Checkout handshake error:", e);
            alert(`Could not launch secure payment gateway:\n${e.message}`);
        }
    }
    window.initiateRazorpayCheckout = initiateRazorpayCheckout;

    if (btnBuyPro) {
        btnBuyPro.addEventListener('click', async () => {
            if(!window.supabaseClient) return alert('Auth not configured.');
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (!user) {
                alert('Please log in to purchase SoundEngg Pro.');
                const authModalOverlay = document.getElementById('auth-modal-overlay');
                if (authModalOverlay) authModalOverlay.classList.remove('hidden');
                return;
            }

            // Dynamically load Razorpay SDK if not already in document
            if (typeof Razorpay === 'undefined') {
                console.log("Loading Razorpay SDK dynamically...");
                const script = document.createElement('script');
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = () => initiateRazorpayCheckout(user);
                script.onerror = () => alert("Failed to load Razorpay payment SDK. Check your internet connection.");
                document.head.appendChild(script);
            } else {
                initiateRazorpayCheckout(user);
            }
        });
    }

    // Monitor network changes to toggle modal dynamically if locked
    window.addEventListener('online', () => {
        if (!modal.classList.contains('hidden')) {
            lockApp(); // Re-trigger lock to switch states
        }
    });
    
    window.addEventListener('offline', () => {
        if (!modal.classList.contains('hidden')) {
            lockApp(); // Re-trigger lock to switch states
        }
    });

    // Listen for Pro status changes to instantly unlock
    document.addEventListener('proStatusChanged', (e) => {
        if (e.detail === true) unlockApp();
    });

    // Run initial check
    checkAdStatus();
}

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
        'tuner': {
            title: 'PRECISION TUNER',
            content: `
                <h3>What it does</h3>
                <p>A highly accurate chromatic instrument tuner for guitars, basses, and other acoustic instruments.</p>
                <h3>How to use it</h3>
                <ul>
                    <li>Place your device near the instrument.</li>
                    <li>Pluck a string. The tuner will detect the pitch and show you how many cents sharp or flat you are.</li>
                    <li>Adjust until the needle is dead center.</li>
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
    
    // Check if AudioContext supports output routing (sinkId)
    const supportsSinkId = ('setSinkId' in AudioContext.prototype || 'setSinkId' in HTMLMediaElement.prototype);
    if (!supportsSinkId && outputSelect) {
        outputSelect.disabled = true;
        outputSelect.style.opacity = '0.6';
        outputSelect.style.cursor = 'not-allowed';
        const warningBox = document.getElementById('safari-output-warning');
        if (warningBox) {
            warningBox.style.display = 'flex';
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
    
    window.showProUpgradeModal = function(featureKey) {
        currentUnlockFeatureKey = featureKey || null;
        
        // Dynamic title and button copy updates based on which feature requested the modal
        const modalTitle = document.querySelector('#pro-upgrade-modal h2');
        const watchAdBtn = document.getElementById('btn-watch-ad-pro-unlock');
        
        let featureName = "SoundEngg Pro Features";
        let buttonText = "🎁 UNLOCK ALL PRO FOR 4 HOURS (WATCH AD)";
        
        if (featureKey === 'spectrogram') {
            featureName = "60FPS Spectrogram Waterfall";
            buttonText = "🎁 UNLOCK WATERFALL FOR 4 HOURS (WATCH AD)";
        } else if (featureKey === 'snapshots') {
            featureName = "10 Multi-Overlay RTA Snapshots";
            buttonText = "🎁 UNLOCK SNAPSHOTS FOR 4 HOURS (WATCH AD)";
        } else if (featureKey === 'mic_calibration') {
            featureName = "Custom Mic Calibration Loader";
            buttonText = "🎁 UNLOCK CALIBRATION FOR 4 HOURS (WATCH AD)";
        } else if (featureKey === 'ear_training') {
            featureName = "1/6 ISO Octave Ear Training";
            buttonText = "🎁 UNLOCK EAR TRAINING FOR 4 HOURS (WATCH AD)";
        } else if (featureKey === 'ear_training_track') {
            featureName = "Reference Track";
            buttonText = "🎁 UNLOCK REFERENCE TRACK FOR 4 HOURS (WATCH AD)";
        } else if (featureKey === 'blog') {
            featureName = "Premium Engineering Guide";
            buttonText = "🎁 UNLOCK GUIDE FOR 4 HOURS (WATCH AD)";
        }
        
        if (modalTitle) {
            modalTitle.textContent = `Unlock ${featureName}`;
        }
        if (watchAdBtn) {
            watchAdBtn.innerHTML = `<span class="material-symbols-outlined">workspace_premium</span> ${buttonText}`;
        }
        
        if (proModal) proModal.classList.remove('hidden');
    };
    
    window.closeProUpgradeModal = function() {
        if (proModal) proModal.classList.add('hidden');
    };
    
    if (btnClosePro) btnClosePro.addEventListener('click', window.closeProUpgradeModal);
    if (btnLaterPro) btnLaterPro.addEventListener('click', window.closeProUpgradeModal);
    
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

window.isIndiaUser = true;

// 1. Detect User Location (Exact Timezone check with reliable Geo-IP fallback)
async function detectUserCountry() {
    // TEMPORARY: Force INR pricing and payment globally for all users
    // because Razorpay international (USD) payment is currently not active.
    window.isIndiaUser = true;
    return true;
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


// 2. Initialize Pricing Grid Dynamic Rendering
async function initPricingPage() {
    const priceMonthly = document.getElementById('price-monthly');
    const priceYearly = document.getElementById('price-yearly');
    const priceLifetime = document.getElementById('price-lifetime');

    const modalMonthly = document.getElementById('modal-price-monthly');
    const modalYearly = document.getElementById('modal-price-yearly');
    const modalLifetime = document.getElementById('modal-price-lifetime');
    
    // Check if we are either on pro.html or app.html plan selector modal
    if (!priceMonthly && !priceYearly && !priceLifetime && !modalMonthly && !modalYearly && !modalLifetime) return;

    await detectUserCountry();

    // Set prices dynamically based on country
    if (window.isIndiaUser) {
        if (priceMonthly) priceMonthly.innerHTML = '₹199<span>/month</span>';
        if (priceYearly) priceYearly.innerHTML = '₹1,999<span>/year</span>';
        if (priceLifetime) priceLifetime.innerHTML = '₹3,499<span>one-time</span>';

        if (modalMonthly) modalMonthly.innerHTML = '₹199<span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">/mo</span>';
        if (modalYearly) modalYearly.innerHTML = '₹1,999<span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">/yr</span>';
        if (modalLifetime) modalLifetime.innerHTML = '₹3,499';
    } else {
        if (priceMonthly) priceMonthly.innerHTML = '$2.99<span>/month</span>';
        if (priceYearly) priceYearly.innerHTML = '$29.99<span>/year</span>';
        if (priceLifetime) priceLifetime.innerHTML = '$49.99<span>one-time</span>';

        if (modalMonthly) modalMonthly.innerHTML = '$2.99<span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">/mo</span>';
        if (modalYearly) modalYearly.innerHTML = '$29.99<span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">/yr</span>';
        if (modalLifetime) modalLifetime.innerHTML = '$49.99';
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

// 3. Simulated Razorpay Standard Checkout Overlay
window.showRazorpaySimOverlay = function(plan) {
    // Prevent duplicate overlays
    const existing = document.getElementById('razorpay-sim-overlay');
    if (existing) existing.remove();

    // Determine values
    let priceLabel = '';
    let currencySymbol = window.isIndiaUser ? '₹' : '$';
    let currencyCode = window.isIndiaUser ? 'INR' : 'USD';

    if (window.isIndiaUser) {
        if (plan === 'monthly') { priceLabel = '₹199 / month'; }
        else if (plan === 'yearly') { priceLabel = '₹1,999 / year'; }
        else { priceLabel = '₹3,499 one-time'; }
    } else {
        if (plan === 'monthly') { priceLabel = '$2.99 / month'; }
        else if (plan === 'yearly') { priceLabel = '$29.99 / year'; }
        else { priceLabel = '$49.99 one-time'; }
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

    const closeOverlay = () => overlay.remove();
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
                    await syncSubscriptionStatus(session);
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
function showCheckoutSuccessOverlay(plan) {
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
}

// 4.8 Premium Checkout Confirmation Modal to completely bypass Browser Popup Blockers
function showCheckoutConfirmModal(user, plan) {
    const existing = document.getElementById('checkout-confirm-modal');
    if (existing) existing.remove();

    let planTitle = "Lifetime Pro Access";
    let planCost = "₹3,499";
    if (window.isIndiaUser) {
        if (plan === 'monthly') {
            planTitle = "Monthly Pro Subscription";
            planCost = "₹199";
        } else if (plan === 'yearly') {
            planTitle = "Yearly Pro Subscription";
            planCost = "₹1,999";
        } else {
            planTitle = "Lifetime Pro Access";
            planCost = "₹3,499";
        }
    } else {
        if (plan === 'monthly') {
            planTitle = "Monthly Pro Subscription";
            planCost = "$2.99";
        } else if (plan === 'yearly') {
            planTitle = "Yearly Pro Subscription";
            planCost = "$29.99";
        } else {
            planTitle = "Lifetime Pro Access";
            planCost = "$49.99";
        }
    }

    const modal = document.createElement('div');
    modal.id = 'checkout-confirm-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5,5,8,0.92); display: flex; align-items: center; justify-content: center; z-index: 10000; font-family: var(--font-mono), monospace; color: #fff;';

    modal.innerHTML = `
        <div class="modal-content auth-modal-box" style="max-width: 440px; width: 90%; text-align: center; border: 2px solid var(--neon-blue); box-shadow: 0 0 25px rgba(0, 240, 255, 0.3); background: #0b0c10; padding: 2.5rem 2rem; border-radius: 8px; position: relative;">
            <button id="btn-close-checkout-confirm" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 20px;"><span class="material-symbols-outlined">close</span></button>
            
            <div style="margin-bottom: 1.5rem; display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; border-radius: 50%; background: rgba(20, 167, 181, 0.1); border: 2px dashed var(--primary);">
                <span class="material-symbols-outlined" style="font-size: 32px; color: var(--primary);">shopping_cart</span>
            </div>
            
            <h2 style="font-family: var(--font-headline); font-size: 1.6rem; font-weight: bold; margin-bottom: 0.5rem; color: #fff; text-shadow: 0 0 10px rgba(20, 167, 181, 0.4);">Secure Checkout</h2>
            <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 1.5rem; line-height: 1.4;">Unlock full acoustic precision. Review your purchase order details below:</p>
            
            <div style="text-align: left; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 1.2rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--text-dim);">UPGRADE PLAN</span>
                    <span style="font-size: 0.85rem; color: #fff; font-weight: bold; text-transform: uppercase;">${planTitle}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--text-dim);">PRICE RATE</span>
                    <span style="font-size: 0.85rem; color: var(--primary); font-weight: bold;">${planCost}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 0.25rem;">
                    <span style="font-size: 0.8rem; color: var(--text-dim);">ACCOUNT EMAIL</span>
                    <span style="font-size: 0.85rem; color: #fff; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 200px;">${user.email}</span>
                </div>
            </div>
            
            <button id="btn-proceed-to-payment" style="width: 100%; border: none; padding: 14px; font-weight: bold; font-family: var(--font-mono); font-size: 0.95rem; cursor: pointer; border-radius: 4px; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; box-shadow: 0 0 15px rgba(20, 167, 181, 0.4); display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s ease;">
                <span class="material-symbols-outlined">lock</span> PROCEED TO SECURE PAYMENT
            </button>
            <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <span class="material-symbols-outlined" style="font-size: 14px; color: var(--primary);">shield</span> Secured by Razorpay Payment Gateway
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btn-close-checkout-confirm').onclick = () => modal.remove();

    const proceedBtn = modal.querySelector('#btn-proceed-to-payment');
    proceedBtn.onclick = () => {
        proceedBtn.disabled = true;
        proceedBtn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> LAUNCHING SECURE GATEWAY...`;
        
        if (typeof Razorpay === 'undefined') {
            console.log("Loading Razorpay SDK dynamically...");
            const script = document.createElement('script');
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => {
                modal.remove();
                if (typeof window.initiateRazorpayCheckout === 'function') {
                    window.initiateRazorpayCheckout(user, plan);
                } else {
                    console.error("window.initiateRazorpayCheckout is not defined");
                    alert("Error: Checkout handler not initialized properly. Please refresh the page.");
                }
            };
            script.onerror = () => {
                proceedBtn.disabled = false;
                proceedBtn.innerHTML = `<span class="material-symbols-outlined">lock</span> PROCEED TO SECURE PAYMENT`;
                alert("Failed to load Razorpay payment SDK.");
            };
            document.head.appendChild(script);
        } else {
            modal.remove();
            if (typeof window.initiateRazorpayCheckout === 'function') {
                window.initiateRazorpayCheckout(user, plan);
            } else {
                console.error("window.initiateRazorpayCheckout is not defined");
                alert("Error: Checkout handler not initialized properly. Please refresh the page.");
            }
        }
    };
}

// 4.5 Helper to Highlight the Pre-selected Plan inside Selector Modal
function highlightPlanCard(plan) {
    const planSelectorModal = document.getElementById('plan-selector-modal');
    if (!planSelectorModal) return;
    
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

    const targetCard = planSelectorModal.querySelector(`.plan-card-option[data-plan="${plan}"]`);
    if (targetCard) {
        // Apply beautiful scaling, primary glow, and smooth scroll focus
        targetCard.style.transform = 'scale(1.03)';
        targetCard.style.boxShadow = '0 0 20px rgba(0, 255, 204, 0.25)';
        targetCard.style.borderColor = 'var(--primary)';
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

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

// 7. Global Payment System Initialization DOM Trigger
const initPageSystems = () => {
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
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageSystems);
} else {
    initPageSystems();
}

// =========================================================================
// TAP TEMPO DELAY LIVE UTILITY MODULE
// =========================================================================
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

