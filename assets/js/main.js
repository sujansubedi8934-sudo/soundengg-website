// =========================================================================
// CORE APP BOOTSTRAPPER, CLOUD SYNC, NAVIGATION & GLOBAL SEARCH (main.js)
// Global Audio Routing & Venue Environment Modal live in assets/js/modules/venueEnvModal.js
// Checkout, Pro Upgrade, Settings Hub & Platform live in assets/js/modules/checkoutAndPlatform.js
// =========================================================================

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
    safeInit(initImpedanceCalculator, 'initImpedanceCalculator');
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
        if (typeof window.closeBlogArticleIfOpen === 'function' && window.closeBlogArticleIfOpen()) {
            return;
        }
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
    const impedanceView = document.getElementById('impedance-view');
    const subcalcView = document.getElementById('sub-calc-view');
    const tapdelayView = document.getElementById('tap-delay-view');
    const menuView = document.getElementById('menu-view');
    const settingsView = document.getElementById('settings-view');
    const privacyView = document.getElementById('privacy-view');
    const termsView = document.getElementById('terms-view');
    
    // IDs for ALL primary views to manage visibility
    const ALL_VIEWS = [dashboardView, rtaView, authorView, moduleView, pinoutView, blogView, siggenView, earTrainingView, impedanceView, subcalcView, tapdelayView, menuView, settingsView, privacyView, termsView];

    const btnLaunchRta = document.getElementById('btn-launch-rta');
    const btnLaunchDelay = document.getElementById('btn-launch-delay');
    const btnLaunchTapdelay = document.getElementById('btn-launch-tapdelay');
    const btnLaunchPinout = document.getElementById('btn-launch-pinout');
    const btnLaunchImpedance = document.getElementById('btn-launch-impedance');
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

    // --- Enhanced Cross-Platform Haptic Feedback Helper (Capacitor + Web Vibrate) ---
    function triggerHaptic(type = 'light') {
        try {
            const { Haptics } = window.Capacitor?.Plugins || {};
            if (Haptics) {
                if (type === 'warning') {
                    if (typeof Haptics.notification === 'function') {
                        Haptics.notification({ type: 'warning' }).catch(() => {});
                        return;
                    }
                }
                if (typeof Haptics.impact === 'function') {
                    const styleMap = {
                        'light': 'light',
                        'medium': 'medium',
                        'heavy': 'heavy',
                        'warning': 'heavy'
                    };
                    Haptics.impact({ style: styleMap[type] || 'light' }).catch(() => {});
                    return;
                }
            }
            // Web / Android browser vibration fallback
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                if (type === 'warning') {
                    navigator.vibrate([40, 60, 40]);
                } else if (type === 'heavy') {
                    navigator.vibrate(35);
                } else if (type === 'medium') {
                    navigator.vibrate(22);
                } else {
                    navigator.vibrate(12);
                }
            }
        } catch (e) {
            // Non-critical, ignore if user gestures or browser policy restricts haptics
        }
    }
    window.triggerHaptic = triggerHaptic;

    // --- Recently Used Tool Logging ---
    function logRecentTool(viewId) {
        const toolViews = ['rta-view', 'module-view', 'sub-calc-view', 'impedance-view', 'siggen-view', 'ear-training-view', 'pinout-view', 'tap-delay-view'];
        if (toolViews.includes(viewId)) {
            try {
                let recent = JSON.parse(localStorage.getItem('soundengg_recent_tools')) || [];
                recent = recent.filter(id => id !== viewId);
                recent.unshift(viewId);
                if (recent.length > 4) recent.pop();
                localStorage.setItem('soundengg_recent_tools', JSON.stringify(recent));
                updateRecentlyUsedUI();
            } catch (e) {
                console.error('Failed to log recent tool:', e);
            }
        }
    }

    // --- Render Recently Used Tool UI ---
    function updateRecentlyUsedUI() {
        const container = document.getElementById('mobile-recently-used-list');
        if (!container) return;
        
        try {
            const recent = JSON.parse(localStorage.getItem('soundengg_recent_tools')) || [];
            const toolViews = {
                'rta-view': { name: 'RTA Analyzer', icon: 'analytics', color: 'cyan' },
                'module-view': { name: 'Delay Calc', icon: 'straighten', color: 'amber' },
                'sub-calc-view': { name: 'Sub Arrays', icon: 'speaker', color: 'purple' },
                'impedance-view': { name: 'Impedance & Power', icon: 'settings_input_component', color: 'emerald' },
                'siggen-view': { name: 'Signal Generator', icon: 'waves', color: 'blue' },
                'ear-training-view': { name: 'Ear Training', icon: 'hearing', color: 'pink' },
                'pinout-view': { name: 'Pinout Reference', icon: 'cable', color: 'orange' },
                'tap-delay-view': { name: 'Tap Delay', icon: 'ads_click', color: 'yellow' }
            };
            
            if (recent.length === 0) {
                container.innerHTML = `<div class="recent-empty">No recently used tools. Launch a tool above to populate!</div>`;
                return;
            }
            
            container.innerHTML = recent.map(id => {
                const tool = toolViews[id];
                if (!tool) return '';
                return `
                    <button class="recent-tool-item" data-target="${id}">
                        <span class="material-symbols-outlined recent-icon icon-${tool.color}">${tool.icon}</span>
                        <span class="recent-name">${tool.name}</span>
                        <span class="material-symbols-outlined recent-chevron">chevron_right</span>
                    </button>
                `;
            }).join('');
            
            // Add click listeners to recent items
            container.querySelectorAll('.recent-tool-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.getAttribute('data-target');
                    const targetView = document.getElementById(targetId);
                    if (targetView) {
                        showView(targetView);
                    }
                });
            });
        } catch (e) {
            console.error('Error rendering recently used UI:', e);
        }
    }
    window.updateRecentlyUsedUI = updateRecentlyUsedUI;

    // --- Bottom Tab Bar Visibility & State Sync ---
    function updateBottomTabBarVisibility(targetView) {
        const tabbar = document.getElementById('mobile-bottom-tabs');
        if (tabbar) {
            // Keep bottom navigation bar visible across ALL tools and views (hide when in RTA workstation view or Fullscreen mode)
            if (window.isRtaFullscreenActive || targetView === rtaView) {
                tabbar.classList.add('hidden-tab-bar');
            } else {
                tabbar.classList.remove('hidden-tab-bar');
            }
            
            // Sync active states on bottom tab buttons
            const btnTabHome = document.getElementById('btn-tab-home');
            const btnTabConsole = document.getElementById('btn-tab-console');
            const btnTabBlog = document.getElementById('btn-tab-blog');
            const btnTabMenu = document.getElementById('btn-tab-menu');
            const btnTabSettings = document.getElementById('btn-tab-settings');
            
            if (btnTabHome) btnTabHome.classList.toggle('active', targetView === dashboardView);
            if (btnTabConsole) btnTabConsole.classList.toggle('active', targetView === rtaView);
            if (btnTabBlog) btnTabBlog.classList.toggle('active', targetView === blogView);
            if (btnTabMenu) btnTabMenu.classList.toggle('active', targetView === menuView);
            if (btnTabSettings) btnTabSettings.classList.toggle('active', targetView === settingsView);
        }
    }

    // --- Update Mobile Safe Header Title & Back Button ---
    function updateMobileHeader(targetView) {
        const headerTitle = document.getElementById('mobile-header-title');
        const backBtn = document.getElementById('mobile-header-back');
        const logoContainer = document.getElementById('mobile-header-logo');
        const isMainView = (targetView.id === 'dashboard-view' || targetView.id === 'blog-view' || targetView.id === 'menu-view' || targetView.id === 'settings-view');
        
        if (logoContainer) {
            logoContainer.style.display = isMainView ? 'flex' : 'none';
        }
        
        if (headerTitle) {
            if (isMainView) {
                headerTitle.textContent = '';
            } else {
                const viewTitles = {
                    'rta-view': 'RTA SPECTROGRAM',
                    'author-view': 'AUTHOR',
                    'module-view': 'DELAY CALCULATOR',
                    'pinout-view': 'PINOUT REFERENCE',
                    'siggen-view': 'SIGNAL GENERATOR',
                    'ear-training-view': 'EAR TRAINING',
                    'impedance-view': 'IMPEDANCE & POWER',
                    'sub-calc-view': 'SUB ARRAY CALC',
                    'tap-delay-view': 'TAP DELAY'
                };
                headerTitle.textContent = viewTitles[targetView.id] || 'SOUNDENGG';
            }
        }
        
        if (backBtn) {
            backBtn.style.visibility = isMainView ? 'hidden' : 'visible';
        }
    }

    /**
     * Senior View Manager: Ensures ONLY one view is visible at any time.
     */
    function showView(targetView, navButton = null, skipHistory = false, isBackAction = false, bypassAd = false) {
        if (!targetView) return;
        
        // Find the currently active view
        const currentView = ALL_VIEWS.find(v => v && v.style.display === 'block');

        // Transition ad gate interceptor for free users (Native Mobile only)
        if (!bypassAd && window.isNativeMobile() && !window.isUserPro && !window.isPremiumActive()) {
            const toolIds = ['rta-view', 'siggen-view', 'delay-view', 'subcalc-view', 'voltage-view', 'freq-view', 'attenuation-view', 'pinout-view', 'ear-training-view', 'impedance-view', 'tap-delay-view', 'module-view', 'sub-calc-view'];
            const isTargetTool = targetView && toolIds.includes(targetView.id);
            const isCurrentTool = currentView && toolIds.includes(currentView.id);
            const isGoingToDashboard = (targetView === dashboardView);

            const hasSeenFirstToolConsent = safeStorage.getItem('has_seen_first_tool_consent') === 'true';

            if (isTargetTool && currentView !== targetView) {
                if (typeof window.recordEngagementEvent === 'function') {
                    window.recordEngagementEvent();
                }
            }

            // SCENARIO 1: First time launching any tool -> Open immediately without blocking popup (Option A)
            if (isTargetTool && !hasSeenFirstToolConsent && currentView !== targetView) {
                safeStorage.setItem('has_seen_first_tool_consent', 'true');
                safeStorage.setItem('tool_switch_count', '0');
            }

            // SCENARIO 2: Returning to Dashboard from a tool -> Trigger Interstitial ad on every 2 tool switches after 2.5m cooldown
            if (isCurrentTool && isGoingToDashboard) {
                let toolSwitchCount = parseInt(safeStorage.getItem('tool_switch_count') || '0', 10) + 1;
                const unlockedUntil = safeStorage.getItem('tools_unlocked_until');
                const now = Date.now();
                const isCooldownExpired = !unlockedUntil || now >= parseInt(unlockedUntil, 10);

                if (toolSwitchCount >= 2 && isCooldownExpired) {
                    console.log('[AdGate] 2 tool switches completed & cooldown expired. Triggering native interstitial ad...');
                    safeStorage.setItem('tool_switch_count', '0');
                    safeStorage.setItem('tools_unlocked_until', (now + 2.5 * 60 * 1000).toString()); // Reset 2.5m cooldown
                    if (window.isNativeMobile() && typeof window.showNativeInterstitialAd === 'function') {
                        window.showNativeInterstitialAd(
                            () => showView(targetView, navButton, skipHistory, isBackAction, true),
                            () => showView(targetView, navButton, skipHistory, isBackAction, true)
                        );
                        return;
                    }
                } else {
                    safeStorage.setItem('tool_switch_count', toolSwitchCount.toString());
                }
            }
        }
        
        if (!isBackAction) {
            // If the target is a main view, clear history (since main tabs reset the flow)
            const isMainView = (targetView === dashboardView || targetView === authorView || targetView === blogView || targetView === menuView || targetView === settingsView);
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

        if (targetView !== siggenView && typeof window.stopSignalGenerator === 'function') {
            window.stopSignalGenerator();
        }
        if (targetView !== earTrainingView && typeof window.stopEarTraining === 'function') {
            window.stopEarTraining();
        }
        if (targetView !== tapdelayView && typeof window.stopTapTempoPulse === 'function') {
            window.stopTapTempoPulse();
        }
        if (targetView !== moduleView) {
            if (typeof window.stopAlignmentLoop === 'function') {
                window.stopAlignmentLoop();
            }
            if (typeof window.stopAutoPingListening === 'function') {
                window.stopAutoPingListening();
            }
        }
        
        // Log view change for Recently Used feed
        logRecentTool(targetView.id);

        // Update mobile bottom tab bar visibility for deep sub-tools
        updateBottomTabBarVisibility(targetView);

        // Update mobile safe header view name and back chevron visibility
        updateMobileHeader(targetView);

        // Determine view transition direction type
        let transitionType = 'fade';
        if (isBackAction) {
            transitionType = 'backward';
        } else if (currentView && currentView !== targetView) {
            const isMainView = (targetView === dashboardView || targetView === authorView || targetView === blogView || targetView === menuView || targetView === settingsView);
            if (!isMainView) {
                transitionType = 'forward';
            }
        }

        const updateDOM = () => {
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
                // Immediately hide outer navigation, header bars, and native banner ad for full-bleed RTA
                const tabbar = document.getElementById('mobile-bottom-tabs');
                if (tabbar) tabbar.classList.add('hidden-tab-bar');
                const safeHeader = document.getElementById('mobile-safe-header');
                if (safeHeader) safeHeader.style.display = 'none';
                if (typeof window.hideNativeBannerAd === 'function') {
                    window.hideNativeBannerAd();
                }

                if (typeof window.syncRtaIdleState === 'function') {
                    window.syncRtaIdleState();
                }

                // Automatically switch to full-screen landscape workstation mode and start live measurement
                if (typeof window.toggleRtaFullscreen === 'function') {
                    window.toggleRtaFullscreen(true);
                }
                setTimeout(() => {
                    if (typeof window.toggleRtaFullscreen === 'function' && !window.isRtaFullscreenActive) {
                        window.toggleRtaFullscreen(true);
                    }
                    if (typeof window.hideNativeBannerAd === 'function') {
                        window.hideNativeBannerAd();
                    }
                }, 60);
                setTimeout(() => {
                    if (typeof window.toggleRtaFullscreen === 'function' && !window.isRtaFullscreenActive) {
                        window.toggleRtaFullscreen(true);
                    }
                }, 220);
            } else {
                if (window.isRtaFullscreenActive && typeof window.toggleRtaFullscreen === 'function') {
                    window.toggleRtaFullscreen(false);
                }
                const safeHeader = document.getElementById('mobile-safe-header');
                if (safeHeader) safeHeader.style.display = '';
                // Keep banner ad visible across non-RTA views and tools (unless Pro active)
                if (!window.isPremiumActive() && typeof window.showNativeBannerAd === 'function') {
                    window.showNativeBannerAd();
                }
            }

        };

        // Smooth single-page swaps using the View Transitions API (skip for rtaView so AudioContext/mic start synchronously inside tap gesture)
        if (currentView && currentView !== targetView && targetView !== rtaView && document.startViewTransition) {
            try {
                document.startViewTransition({
                    update: updateDOM,
                    types: [transitionType]
                });
            } catch (e) {
                try {
                    document.startViewTransition(updateDOM);
                } catch (err) {
                    updateDOM();
                }
            }
        } else {
            updateDOM();
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
    if (btnLaunchImpedance) btnLaunchImpedance.addEventListener('click', () => showView(impedanceView));
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
            if (typeof window.resetBlogToIndex === 'function') {
                window.resetBlogToIndex();
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

    // Settings View Navigation
    if (settingsView) {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btn-settings, #btn-mobile-settings')) {
                showView(settingsView);
                // Auto close mobile menu on selection
                const menu = document.getElementById('mobile-nav-dropdown-menu');
                const toggleBtn = document.getElementById('btn-mobile-nav-toggle');
                if (menu) menu.style.display = 'none';
                if (toggleBtn) toggleBtn.classList.remove('active');
            }
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
    const menuBtnProfileDeleteAccount = document.getElementById('menu-btn-profile-delete-account');
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

            if (menuBtnProfileDeleteAccount && accountDeleteConfirmModal) {
                menuBtnProfileDeleteAccount.addEventListener('click', (e) => {
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
            
            const openPlanSelector = (e) => {
                if (e) e.preventDefault();
                
                // Close any open modals to clean up the screen
                if (profileModal) closeModal(profileModal);
                
                const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                if (proUpgradeModal) closeModal(proUpgradeModal);
                
                const adLockModal = document.getElementById('ad-lock-modal');
                if (adLockModal) closeModal(adLockModal);
                
                openModal(planSelectorModal);
            };
            window.openPlanSelector = openPlanSelector;
            
            if (planSelectorModal) {
                if (btnProfileUpgrade) {
                    btnProfileUpgrade.addEventListener('click', openPlanSelector);
                }
                
                const btnSubUpgrade = document.getElementById('btn-sub-upgrade');
                if (btnSubUpgrade) {
                    btnSubUpgrade.addEventListener('click', openPlanSelector);
                }
                
                document.querySelectorAll('.pro-nav-redirect-btn').forEach(btn => {
                    btn.addEventListener('click', openPlanSelector);
                });
                
                const btnBuyPro = document.getElementById('btn-buy-pro');
                if (btnBuyPro) {
                    btnBuyPro.addEventListener('click', openPlanSelector);
                }
            }
            
            if (btnClosePlanSelector && planSelectorModal) {
                btnClosePlanSelector.addEventListener('click', () => closeModal(planSelectorModal));
            }
            
            if (planSelectorModal) {
                planSelectorModal.addEventListener('click', (e) => {
                    if (e.target === planSelectorModal) closeModal(planSelectorModal);
                });

                const btnRestorePurchases = document.getElementById('btn-restore-purchases');
                if (btnRestorePurchases) {
                    btnRestorePurchases.addEventListener('click', async (e) => {
                        e.preventDefault();
                        if (window.billingManager && typeof window.billingManager.restorePurchases === 'function') {
                            try {
                                btnRestorePurchases.textContent = "Restoring...";
                                const res = await window.billingManager.restorePurchases();
                                if (res && res.success) {
                                    alert("Purchases successfully restored!");
                                    closeModal(planSelectorModal);
                                } else {
                                    alert("No previous purchases found to restore.");
                                }
                            } catch (err) {
                                console.error("Restore failed:", err);
                                alert("Failed to restore purchases: " + err.message);
                            } finally {
                                btnRestorePurchases.textContent = "Restore Purchases";
                            }
                        } else {
                            alert("Restore is only supported on native mobile apps.");
                        }
                    });
                }
                
                // Clicking plan cards inside modal triggers checkout
                planSelectorModal.querySelectorAll('.plan-card-option').forEach(card => {
                    card.addEventListener('click', async () => {
                        const plan = card.getAttribute('data-plan') || 'yearly';
                        closeModal(planSelectorModal);
                        
                        let session = null;
                        if (window.supabaseClient) {
                            const { data: { session: currentSession } } = await window.supabaseClient.auth.getSession();
                            session = currentSession;
                        }

                        if (session) {
                            showCheckoutConfirmModal(session.user, plan);
                        } else {
                            // On native mobile builds, allow guest checkouts without forcing sign-in (Apple compliant)
                            if (window.isNativeMobile && window.isNativeMobile()) {
                                showCheckoutConfirmModal(null, plan);
                            } else {
                                alert('Please sign in or register to complete your purchase.');
                                const authModalOverlay = document.getElementById('auth-modal-overlay');
                                if (authModalOverlay) authModalOverlay.classList.remove('hidden');
                            }
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

            const forgotPasswordLink = formLogin.querySelector('.auth-link');
            if (forgotPasswordLink) {
                forgotPasswordLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    if (!window.supabaseClient) return alert('Auth not configured.');
                    
                    const emailInput = formLogin.querySelector('input[type="email"]');
                    const email = emailInput ? emailInput.value.trim() : '';
                    
                    if (!email) {
                        alert('Please enter your Email Address in the input box first, then click "Forgot password?".');
                        if (emailInput) emailInput.focus();
                        return;
                    }
                    
                    try {
                        forgotPasswordLink.style.pointerEvents = 'none';
                        forgotPasswordLink.style.opacity = '0.5';
                        forgotPasswordLink.textContent = 'Sending...';
                        
                        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                            redirectTo: typeof window.getPublicAppUrl === 'function'
                                ? window.getPublicAppUrl()
                                : (window.isNativeMobile() ? 'https://www.soundengg.com/app.html' : window.location.origin + window.location.pathname)
                        });
                        
                        if (error) throw error;
                        
                        alert('Password reset link sent to your email! Please check your inbox.');
                    } catch (error) {
                        console.error('Password Reset Error:', error);
                        const msg = error.message || error.error_description || (typeof error === 'object' ? JSON.stringify(error) : error);
                        alert('Error: ' + msg);
                    } finally {
                        forgotPasswordLink.style.pointerEvents = 'auto';
                        forgotPasswordLink.style.opacity = '1';
                        forgotPasswordLink.textContent = 'Forgot password?';
                    }
                });
            }
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

        // REAL Apple Auth
        const btnApple = document.getElementById('btn-apple-auth');
        if (btnApple) {
            btnApple.addEventListener('click', async () => {
                if (!window.supabaseClient) return alert('Auth not configured.');
                
                try {
                    const isNative = (typeof window.isNativeMobile === 'function' && window.isNativeMobile());
                    const isIOS = isNative && window.Capacitor?.getPlatform() === 'ios';

                    if (isIOS) {
                        const AppleSignInPlugin = window.Capacitor?.Plugins?.AppleSignIn;
                        if (!AppleSignInPlugin) {
                            throw new Error("Apple Sign-In plugin is not available on this platform.");
                        }

                        console.log('[AppleAuth] Launching native iOS Apple Sign-In sheet...');
                        const result = await AppleSignInPlugin.signIn({
                            scopes: ['EMAIL', 'FULL_NAME']
                        });

                        if (result && result.idToken) {
                            console.log('[AppleAuth] Native login successful, passing identity token to Supabase...');
                            const { data, error } = await window.supabaseClient.auth.signInWithIdToken({
                                provider: 'apple',
                                token: result.idToken
                            });
                            
                            if (error) throw error;
                            closeModal(authModalOverlay);
                        } else {
                            throw new Error("Failed to receive authentication token from Apple.");
                        }
                    } else {
                        // Web or Android Redirect Fallback
                        console.log('[AppleAuth] Launching OAuth redirect fallback...');
                        const redirectUrl = isNative
                            ? 'soundengg://login-callback'
                            : window.location.origin + window.location.pathname;

                        const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                            provider: 'apple',
                            options: {
                                redirectTo: redirectUrl,
                                skipBrowserRedirect: isNative
                            }
                        });
                        
                        if (error) throw error;
                        
                        if (isNative && data?.url) {
                            const BrowserPlugin = window.Capacitor?.Plugins?.Browser;
                            if (BrowserPlugin && typeof BrowserPlugin.open === 'function') {
                                console.log('[AppleAuth] Opening Custom Tab with OAuth url:', data.url);
                                await BrowserPlugin.open({ url: data.url });
                            } else {
                                window.open(data.url, '_system');
                            }
                        }
                    }
                } catch (error) {
                    alert('Apple login failed: ' + error.message);
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
        const rawParam = urlParams.get('view') || window.location.hash.substring(1);
        
        if (rawParam) {
            const viewParam = rawParam.toLowerCase().trim();
            const normalizedKey = viewParam.replace(/[-_]/g, '');

            // Comprehensive mapping of view keys and aliases to their DOM elements
            const viewMap = {
                // RTA Analyzer
                'rta': rtaView,
                'rtaanalyzer': rtaView,
                'rtaview': rtaView,

                // Delay Finder
                'delay': moduleView,
                'delayfinder': moduleView,
                'delaycalc': moduleView,
                'moduleview': moduleView,

                // Audio Pinouts
                'pinout': pinoutView,
                'pinouts': pinoutView,
                'audiopinouts': pinoutView,
                'pinoutview': pinoutView,

                // Speaker Impedance
                'impedance': impedanceView,
                'speakerimpedance': impedanceView,
                'impedanceview': impedanceView,

                // Subwoofer Array
                'subcalc': subcalcView,
                'subwoofer': subcalcView,
                'subwooferarray': subcalcView,
                'subcalcview': subcalcView,

                // Signal Generator
                'siggen': siggenView,
                'signalgen': siggenView,
                'signalgenerator': siggenView,
                'siggenview': siggenView,

                // Ear Training Lab
                'eartraining': earTrainingView,
                'ear': earTrainingView,
                'eartrainingview': earTrainingView,

                // Tap Tempo Delay
                'tapdelay': tapdelayView,
                'taptempo': tapdelayView,
                'tap': tapdelayView,
                'tapdelayview': tapdelayView,
                'taptempoview': tapdelayView,

                // Main navigation & system views
                'author': authorView,
                'blog': blogView,
                'menu': menuView,
                'settings': settingsView,
                'dashboard': dashboardView,
                'privacy': privacyView,
                'terms': termsView
            };

            const target = viewMap[normalizedKey] || viewMap[viewParam];
            if (target) {
                // Determine which nav button to highlight if any
                let navBtn = null;
                if (normalizedKey === 'author') navBtn = btnNavAuthor;
                if (normalizedKey === 'blog') navBtn = btnNavBlog;
                if (normalizedKey === 'dashboard') navBtn = btnNavDashboard;
                
                // Small timeout ensures all other DOM initializations are settled
                setTimeout(() => {
                    showView(target, navBtn);
                    console.log(`Deep link triggered: ${viewParam}`);
                    
                    // Trigger shared loading notification toast
                    if (urlParams.get('dist') || urlParams.get('freq')) {
                        setTimeout(() => {
                            if (typeof window.showSoundEnggToast === 'function') {
                                window.showSoundEnggToast('Shared calculation loaded successfully!');
                            }
                        }, 800);
                    }
                }, 100);
            }
        }
    }

    // --- Add Native Mobile Platform Body Class ---
    if (typeof window.isNativeMobile === 'function' && window.isNativeMobile()) {
        document.body.classList.add('native-mobile-platform');
    }

    // --- Mobile Safe Header back button ---
    const mobileHeaderBack = document.getElementById('mobile-header-back');
    if (mobileHeaderBack) {
        mobileHeaderBack.addEventListener('click', (e) => {
            e.preventDefault();
            goBack();
        });
    }

    // --- Mobile Bottom Tab Bar click handlers ---
    const btnTabHome = document.getElementById('btn-tab-home');
    const btnTabBlog = document.getElementById('btn-tab-blog');
    const btnTabConsole = document.getElementById('btn-tab-console');
    const btnTabSettings = document.getElementById('btn-tab-settings');
    const btnTabMenu = document.getElementById('btn-tab-menu');
    
    if (btnTabHome) {
        btnTabHome.addEventListener('click', (e) => {
            e.preventDefault();
            showView(dashboardView, btnNavDashboard);
        });
    }
    if (btnTabBlog) {
        btnTabBlog.addEventListener('click', (e) => {
            e.preventDefault();
            showView(blogView, btnNavBlog);
            if (typeof window.resetBlogToIndex === 'function') {
                window.resetBlogToIndex();
            }
        });
    }
    if (btnTabConsole) {
        btnTabConsole.addEventListener('click', (e) => {
            e.preventDefault();
            showView(rtaView);
        });
    }
    if (btnTabSettings) {
        btnTabSettings.addEventListener('click', (e) => {
            e.preventDefault();
            if (settingsView) {
                showView(settingsView, btnTabSettings);
            }
        });
    }
    if (btnTabMenu) {
        btnTabMenu.addEventListener('click', (e) => {
            e.preventDefault();
            showView(menuView);
        });
    }

    // --- Mobile Quick Tools Card launchers (All 8 Tools directly on dashboard) ---
    const btnMobileLaunchRta = document.getElementById('btn-mobile-launch-rta');
    const btnMobileLaunchEarTraining = document.getElementById('btn-mobile-launch-ear-training');
    const btnMobileLaunchSiggen = document.getElementById('btn-mobile-launch-siggen');
    const btnMobileLaunchDelay = document.getElementById('btn-mobile-launch-delay');
    const btnMobileLaunchImpedance = document.getElementById('btn-mobile-launch-impedance');
    const btnMobileLaunchSubcalc = document.getElementById('btn-mobile-launch-subcalc');
    const btnMobileLaunchPinout = document.getElementById('btn-mobile-launch-pinout');
    const btnMobileLaunchTapDelay = document.getElementById('btn-mobile-launch-tap-delay');

    if (btnMobileLaunchRta) btnMobileLaunchRta.addEventListener('click', () => showView(rtaView));
    if (btnMobileLaunchEarTraining) btnMobileLaunchEarTraining.addEventListener('click', () => showView(earTrainingView));
    if (btnMobileLaunchSiggen) btnMobileLaunchSiggen.addEventListener('click', () => showView(siggenView));
    if (btnMobileLaunchDelay) btnMobileLaunchDelay.addEventListener('click', () => showView(moduleView));
    if (btnMobileLaunchImpedance) btnMobileLaunchImpedance.addEventListener('click', () => showView(impedanceView));
    if (btnMobileLaunchSubcalc) btnMobileLaunchSubcalc.addEventListener('click', () => showView(subcalcView));
    if (btnMobileLaunchPinout) btnMobileLaunchPinout.addEventListener('click', () => showView(pinoutView));
    if (btnMobileLaunchTapDelay) btnMobileLaunchTapDelay.addEventListener('click', () => showView(tapdelayView));

    // --- Inline Menu View Preference Bindings ---
    function openExternalOrInAppUrl(url) {
        const BrowserPlugin = window.Capacitor?.Plugins?.Browser;
        if (typeof window.isNativeMobile === 'function' && window.isNativeMobile() && BrowserPlugin && typeof BrowserPlugin.open === 'function') {
            BrowserPlugin.open({ url: url });
        } else {
            window.open(url, '_blank');
        }
    }

    const btnMenuNavAuthor = document.getElementById('btn-menu-nav-author');
    if (btnMenuNavAuthor) {
        btnMenuNavAuthor.addEventListener('click', (e) => {
            e.preventDefault();
            showView(authorView);
        });
    }

    const btnMenuNavPrivacy = document.getElementById('btn-menu-nav-privacy');
    if (btnMenuNavPrivacy) {
        btnMenuNavPrivacy.addEventListener('click', (e) => {
            e.preventDefault();
            showView(privacyView);
        });
    }

    const btnMenuNavTerms = document.getElementById('btn-menu-nav-terms');
    if (btnMenuNavTerms) {
        btnMenuNavTerms.addEventListener('click', (e) => {
            e.preventDefault();
            showView(termsView);
        });
    }

    // Sign out button delegate for mobile menu view
    const menuBtnProfileSignout = document.getElementById('menu-btn-profile-signout');
    if (menuBtnProfileSignout) {
        menuBtnProfileSignout.addEventListener('click', (e) => {
            e.preventDefault();
            const btnProfileSignout = document.getElementById('btn-profile-signout');
            if (btnProfileSignout) {
                btnProfileSignout.click();
            }
        });
    }

    // Manage subscription delegate for mobile menu view
    const menuBtnBillingPortal = document.getElementById('menu-btn-billing-portal');
    if (menuBtnBillingPortal) {
        menuBtnBillingPortal.addEventListener('click', (e) => {
            e.preventDefault();
            const btnSubManage = document.getElementById('btn-sub-manage');
            if (btnSubManage) {
                btnSubManage.click();
            }
        });
    }

    // Accent Selector logic for mobile preferences
    const menuAccentSelect = document.getElementById('menu-accent-select');
    if (menuAccentSelect) {
        const globalThemeSelect = document.getElementById('global-theme-select');
        // Initial value load
        const savedTheme = safeStorage.getItem('soundengg-theme') || 'theme-cyan';
        menuAccentSelect.value = savedTheme;
        
        menuAccentSelect.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            if (globalThemeSelect) {
                globalThemeSelect.value = newTheme;
                globalThemeSelect.dispatchEvent(new Event('change'));
            } else {
                document.body.classList.remove('theme-cyan', 'theme-amber', 'theme-green', 'theme-red');
                document.body.classList.add(newTheme);
                safeStorage.setItem('soundengg-theme', newTheme);
            }
        });

        // Also listen for changes in the global selector to update the menu selector
        if (globalThemeSelect) {
            globalThemeSelect.addEventListener('change', (e) => {
                menuAccentSelect.value = e.target.value;
            });
        }
    }

    // --- Global Click Listener for Haptic Feedback on active clicks ---
    document.addEventListener('click', (e) => {
        const isClickable = e.target.closest('button, a, .widget, .role-btn, .recent-tool-item, .mobile-tool-card');
        if (isClickable) {
            triggerHaptic();
        }
    });

    // --- Populate recently used list on load ---
    updateRecentlyUsedUI();

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
