

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
    safeInit(initAuthSystem, 'initAuthSystem');
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthAndCore);
} else {
    initAuthAndCore();
}



let globalUnitSystem = 'metric'; // 'metric' or 'imperial'



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
    window.appNavigationHistory = [];

    function goBack() {
        if (window.appNavigationHistory && window.appNavigationHistory.length > 0) {
            const prevView = window.appNavigationHistory.pop();
            showView(prevView, null, false, true);
        } else {
            showView(dashboardView, btnNavDashboard);
        }
    }
    window.goBack = goBack;

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
    function showView(targetView, navButton = null, skipHistory = false, isBackAction = false) {
        if (!targetView) return;
        
        // Find the currently active view
        const currentView = ALL_VIEWS.find(v => v && v.style.display === 'block');
        
        if (!isBackAction) {
            // If the target is a main view, clear history (since main tabs reset the flow)
            const isMainView = (targetView === dashboardView || targetView === authorView || targetView === blogView);
            if (isMainView) {
                window.appNavigationHistory = [];
            } else if (currentView && currentView !== targetView) {
                // Otherwise push current view to history if it's a different view
                if (!window.appNavigationHistory) window.appNavigationHistory = [];
                window.appNavigationHistory.push(currentView);
            }
        }
        
        // Update back button text inside targetView dynamically
        const backBtnText = targetView.querySelector('.back-btn-text');
        if (backBtnText) {
            if (window.appNavigationHistory && window.appNavigationHistory.length > 0) {
                const prevView = window.appNavigationHistory[window.appNavigationHistory.length - 1];
                if (prevView.id === 'blog-view') {
                    backBtnText.textContent = 'BACK TO BLOG';
                } else {
                    backBtnText.textContent = 'BACK TO DASHBOARD';
                }
            } else {
                backBtnText.textContent = 'BACK TO DASHBOARD';
            }
        }
        
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
        
        // Push state to browser history for native mobile back button routing
        if (!skipHistory && window.history && window.history.pushState) {
            const currentHash = window.location.hash.substring(1);
            if (currentHash !== targetView.id) {
                window.history.pushState({ viewId: targetView.id }, "", "#" + targetView.id);
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

    // Listen to browser back/forward buttons (or Android hardware back button via Capacitor default routing)
    window.addEventListener('popstate', (e) => {
        const hash = window.location.hash.substring(1);
        
        // Handle overlays (if any are open, close them on back)
        const zoomOverlay = document.getElementById('zoom-overlay');
        if (zoomOverlay && zoomOverlay.style.display !== 'none' && !zoomOverlay.classList.contains('hidden')) {
            zoomOverlay.classList.add('hidden');
            zoomOverlay.style.display = 'none';
            // We should push the state back to keep the url correct since we just consumed a back action for the modal
            if (hash) {
                window.history.pushState({ viewId: hash }, "", "#" + hash);
            }
            return;
        }

        if (e.state && e.state.viewId) {
            const targetView = document.getElementById(e.state.viewId);
            if (targetView) {
                // Find nav button
                let navBtn = null;
                if (e.state.viewId === 'dashboard-view') navBtn = btnNavDashboard;
                if (e.state.viewId === 'author-view') navBtn = btnNavAuthor;
                if (e.state.viewId === 'blog-view') navBtn = btnNavBlog;
                
                showView(targetView, navBtn, true); // true = skip history push
            }
        } else if (hash) {
            const targetView = document.getElementById(hash);
            if (targetView) {
                showView(targetView, null, true);
            }
        } else {
            // Default fallback
            showView(document.getElementById('dashboard-view'), btnNavDashboard, true);
        }
    });

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
            if (typeof window.goBack === 'function') {
                window.goBack();
            } else {
                showView(dashboardView, btnNavDashboard);
            }
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

                        const edgeFuncUrl = "https://ewudkzyjcvjxxqpqnqiy.supabase.co/functions/v1/secure-payment";
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
                    const isNative = (typeof window.isNativeMobile === 'function' && window.isNativeMobile());
                    const redirectUrl = isNative
                        ? 'soundengg://login-callback'
                        : window.location.origin + window.location.pathname;

                    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: redirectUrl,
                            skipBrowserRedirect: isNative
                        }
                    });
                    if(error) throw error;
                    
                    if (isNative && data?.url) {
                        const BrowserPlugin = window.Capacitor?.Plugins?.Browser;
                        if (BrowserPlugin && typeof BrowserPlugin.open === 'function') {
                            console.log('[GoogleAuth] Opening Custom Tab with OAuth url:', data.url);
                            await BrowserPlugin.open({ url: data.url });
                        } else {
                            console.warn('[GoogleAuth] Capacitor Browser plugin not found, falling back to window.open');
                            window.open(data.url, '_system');
                        }
                    }
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

;
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
                        if (window.Capacitor) {
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
                        } else {
                            window.open(`blog/${blog.id}.html`, '_blank');
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


// --- PROFESSIONAL RTA SUITE (1/6 OCTAVE REFINE) ---
const ISO_FREQS = [
    20, 22.4, 25, 28, 31.5, 35.5, 40, 45, 50, 56, 63, 71, 80, 90, 100, 
    112, 125, 140, 160, 180, 200, 224, 250, 280, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 
    1120, 1250, 1400, 1600, 1800, 2000, 2240, 2500, 2800, 3150, 3550, 4000, 4500, 5000, 5600, 6300, 7100, 8000, 9000, 10000, 
    11200, 12500, 14000, 16000, 18000, 20000
];

// ========================================================
// --- SIGNAL GENERATOR CORE LOGIC ---


// --- EAR TRAINING LOGIC ---


// --- TUNER LOGIC ---


// --- SUB CALCULATOR LOGIC ---



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
    if (typeof window.hideNativeBannerAd === 'function') {
        window.hideNativeBannerAd();
    }
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

    modal.querySelector('#btn-close-checkout-confirm').onclick = () => {
        modal.remove();
        if (!window.isPremiumActive() && typeof window.showNativeBannerAd === 'function') {
            window.showNativeBannerAd();
        }
    };

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

// --- Capacitor App Version Verification & Force Updates ---
function initAppVersionCheck() {
    if (typeof window.isNativeMobile === 'function' && window.isNativeMobile()) {
        console.log('[VersionCheck] Native mobile detected, checking build version...');
        const DevicePlugin = window.Capacitor?.Plugins?.Device;
        if (DevicePlugin) {
            DevicePlugin.getInfo().then(async (info) => {
                const currentBuild = parseInt(info.appBuild, 10);
                console.log('[VersionCheck] Local App Build:', currentBuild);
                
                const currentBuildEl = document.getElementById('update-current-build');
                if (currentBuildEl) {
                    currentBuildEl.textContent = currentBuild;
                }
                
                try {
                    // Bypass caching to fetch version settings live
                    const res = await fetch('https://www.soundengg.com/app-version.json?t=' + Date.now());
                    if (!res.ok) {
                        throw new Error(`Failed to fetch version metadata (Status: ${res.status})`);
                    }
                    const versionConfig = await res.json();
                    const requiredBuild = parseInt(versionConfig.latestVersionCode, 10);
                    console.log('[VersionCheck] Remote Required Build:', requiredBuild, 'Force Update:', versionConfig.forceUpdate);
                    
                    const requiredBuildEl = document.getElementById('update-required-build');
                    if (requiredBuildEl) {
                        requiredBuildEl.textContent = requiredBuild;
                    }
                    
                    if (currentBuild < requiredBuild && versionConfig.forceUpdate) {
                        console.warn('[VersionCheck] App build is stale! Triggering mandatory update block...');
                        const updateOverlay = document.getElementById('update-modal-overlay');
                        if (updateOverlay) {
                            openModal(updateOverlay);
                            
                            const downloadBtn = document.getElementById('btn-update-download');
                            if (downloadBtn && versionConfig.downloadUrl) {
                                downloadBtn.href = versionConfig.downloadUrl;
                            }
                            
                            const messageEl = document.getElementById('update-modal-message');
                            if (messageEl && versionConfig.message) {
                                messageEl.textContent = versionConfig.message;
                            }
                        }
                    } else {
                        console.log('[VersionCheck] App version is up to date.');
                    }
                } catch (err) {
                    console.error('[VersionCheck] Error verifying app updates:', err);
                }
            }).catch((err) => {
                console.error('[VersionCheck] Failed to get device info:', err);
            });
        } else {
            console.error('[VersionCheck] Capacitor Device plugin is not registered.');
        }
    } else {
        console.log('[VersionCheck] App is running in standard web browser/PWA. Version checking bypassed.');
    }
}

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

    // Check Capacitor native app build versions for force updates
    initAppVersionCheck();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageSystems);
} else {
    initPageSystems();
}

// =========================================================================
// TAP TEMPO DELAY LIVE UTILITY MODULE
// =========================================================================


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


