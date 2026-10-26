// =========================================================================
// RTA AD CONTROLLER, NATIVE BANNER AD LIFECYCLE & REWARDED PRO UNLOCKS (rtaAdController.js)
// Extracted from assets/js/components/rtaEngine.js — 100% identical runtime behavior
// =========================================================================

window.isNativeMobile = window.isNativeMobile || function() {
    return typeof window !== 'undefined' && window.Capacitor !== undefined;
};

window.RtaAdController = {
    init: function(rtaCtx) {
        let isAdRewardForPro = false;
        let isAdRewardClaimed = false;
        let adCountdownTimer = null;
        let adSecondsRemaining = 15;
        let isBannerOperationInProgress = false;
        let currentBannerMargin = null;
        let bannerDebounceTimer = null;
        let wasAnalyzingBeforeAd = false;
        let isNativeBannerLoaded = false;
        let isNativeBannerHidden = false;

        const isRtaViewOrFullscreenActive = () => rtaCtx.isRtaViewOrFullscreenActive();

        // Helper to dynamically show native banner ads (Mitigating bottom viewport overlay & recycling banner instance)
        window.showNativeBannerAd = function() {
            // Suppress ads immediately if user is a premium Pro subscriber OR inside RTA / Fullscreen RTA
            if (window.isPremiumActive() || isRtaViewOrFullscreenActive()) {
                window.hideNativeBannerAd(false);
                return;
            }

            if (!window.isNativeMobile()) {
                if (navigator.onLine) {
                    const bottomBanner = document.getElementById('bottom-sponsor-banner');
                    if (bottomBanner) {
                        bottomBanner.classList.remove('hidden');
                        bottomBanner.style.display = 'flex';
                    }
                    document.querySelectorAll('.adsbygoogle, .ad-banner-bottom, .ad-placeholder').forEach(el => {
                        el.classList.remove('hidden');
                        el.style.display = 'block';
                    });
                }
                return;
            }

            if (!window.isAdMobInitialized) {
                console.warn('showNativeBannerAd called before AdMob initialization; scheduling retry in 600ms...');
                if (bannerDebounceTimer) clearTimeout(bannerDebounceTimer);
                bannerDebounceTimer = setTimeout(() => {
                    bannerDebounceTimer = null;
                    if (window.isAdMobInitialized && typeof window.showNativeBannerAd === 'function') {
                        window.showNativeBannerAd();
                    }
                }, 600);
                return;
            }

            if (!navigator.onLine) {
                console.log('Device is offline. Suppressing native banner ad.');
                return;
            }

            const bottomTabs = document.getElementById('mobile-bottom-tabs');
            const isTabsVisible = bottomTabs && window.getComputedStyle(bottomTabs).display !== 'none' && !bottomTabs.classList.contains('hidden-tab-bar');
            const isTablet = window.innerWidth >= 768;
            const bannerMargin = isTabsVisible ? (isTablet ? 80 : 72) : 0;

            // If banner is already actively displayed with the correct layout margin, avoid redundant calls
            if (window.isNativeBannerActive && !isNativeBannerHidden && currentBannerMargin === bannerMargin) {
                return;
            }

            // Debounce ad calls by 250ms so rapid tab switching doesn't fire discarded ad requests
            if (bannerDebounceTimer) {
                clearTimeout(bannerDebounceTimer);
            }

            bannerDebounceTimer = setTimeout(async () => {
                bannerDebounceTimer = null;

                if (window.isPremiumActive() || isRtaViewOrFullscreenActive() || !navigator.onLine || !window.isNativeMobile() || !window.isAdMobInitialized) {
                    if (isRtaViewOrFullscreenActive()) {
                        window.hideNativeBannerAd(false);
                    }
                    return;
                }

                if (window.isNativeBannerActive && !isNativeBannerHidden && currentBannerMargin === bannerMargin) {
                    return;
                }

                if (isBannerOperationInProgress) {
                    console.log('Banner operation currently in progress. Skipping duplicate call.');
                    return;
                }

                isBannerOperationInProgress = true;

                try {
                    const { AdMob } = window.Capacitor?.Plugins || {};
                    if (!AdMob) {
                        isBannerOperationInProgress = false;
                        return;
                    }

                    // FAST RESUME: If banner already loaded in memory and margin matches, simply resume it
                    if (isNativeBannerLoaded && isNativeBannerHidden && currentBannerMargin === bannerMargin) {
                        try {
                            console.log('[AdMob] Resuming cached native banner ad (saving redundant request)...');
                            await AdMob.resumeBanner();
                            isNativeBannerHidden = false;
                            window.isNativeBannerActive = true;
                            document.body.classList.add('has-native-banner');
                            return;
                        } catch (resumeErr) {
                            console.warn('[AdMob] resumeBanner failed, will recreate banner:', resumeErr);
                            try { await AdMob.removeBanner(); } catch (_) {}
                            isNativeBannerLoaded = false;
                            isNativeBannerHidden = false;
                        }
                    }

                    // If margin changed while banner was loaded, destroy previous banner before recreating
                    if (isNativeBannerLoaded && currentBannerMargin !== bannerMargin) {
                        try { await AdMob.removeBanner(); } catch (_) {}
                        isNativeBannerLoaded = false;
                        isNativeBannerHidden = false;
                    }

                    const isAndroid = window.Capacitor.getPlatform() === 'android';
                    const useTest = (typeof USE_TEST_BANNER_ADS !== 'undefined' && USE_TEST_BANNER_ADS);
                    const adId = useTest
                        ? (isAndroid ? ADMOB_ANDROID_BANNER_TEST_ID : ADMOB_IOS_BANNER_TEST_ID)
                        : (isAndroid ? ADMOB_ANDROID_BANNER_PROD_ID : ADMOB_IOS_BANNER_PROD_ID);

                    console.log('Showing native bottom banner ad with unit ID:', adId, 'margin:', bannerMargin);
                    
                    await AdMob.showBanner({
                        adId: adId,
                        adSize: 'ADAPTIVE_BANNER',
                        position: 'BOTTOM_CENTER',
                        margin: bannerMargin,
                        isTesting: !!useTest
                    });

                    // If user entered RTA while AdMob.showBanner was awaiting, hide immediately
                    if (isRtaViewOrFullscreenActive() || window.isPremiumActive()) {
                        try { await AdMob.hideBanner(); } catch (e) {}
                        isNativeBannerHidden = true;
                        window.isNativeBannerActive = false;
                        document.body.classList.remove('has-native-banner');
                        return;
                    }

                    isNativeBannerLoaded = true;
                    isNativeBannerHidden = false;
                    window.isNativeBannerActive = true;
                    currentBannerMargin = bannerMargin;
                    document.body.classList.add('has-native-banner');
                } catch (err) {
                    console.error('Error showing native banner ad:', err);
                    window.isNativeBannerActive = false;
                    isNativeBannerLoaded = false;
                    isNativeBannerHidden = false;
                    currentBannerMargin = null;
                    document.body.classList.remove('has-native-banner');
                } finally {
                    // Keep a 300ms cooldown before next banner operation
                    setTimeout(() => {
                        isBannerOperationInProgress = false;
                    }, 300);
                }
            }, 250);
        };

        window.hideNativeBannerAd = async function(isPermanent = false) {
            if (bannerDebounceTimer) {
                clearTimeout(bannerDebounceTimer);
                bannerDebounceTimer = null;
            }

            // Hide HTML ads first
            const bottomBanner = document.getElementById('bottom-sponsor-banner');
            if (bottomBanner) {
                bottomBanner.classList.add('hidden');
                bottomBanner.style.display = 'none';
            }
            document.querySelectorAll('.adsbygoogle, .ad-banner-bottom, .ad-placeholder').forEach(el => {
                el.classList.add('hidden');
                el.style.display = 'none';
            });

            // Always clean up DOM banner padding and class states
            window.isNativeBannerActive = false;
            document.body.classList.remove('has-native-banner');

            if (!window.isNativeMobile()) return;

            try {
                const { AdMob } = window.Capacitor?.Plugins || {};
                if (!AdMob) return;

                if (window.isPremiumActive() || isPermanent) {
                    console.log('Permanently removing native bottom banner ad...');
                    try { await AdMob.removeBanner(); } catch (e) {}
                    isNativeBannerLoaded = false;
                    isNativeBannerHidden = false;
                    currentBannerMargin = null;
                } else if (isNativeBannerLoaded && !isNativeBannerHidden) {
                    console.log('Temporarily hiding native bottom banner ad (preserving memory instance)...');
                    try {
                        await AdMob.hideBanner();
                        isNativeBannerHidden = true;
                    } catch (e) {
                        try { await AdMob.removeBanner(); } catch (_) {}
                        isNativeBannerLoaded = false;
                        isNativeBannerHidden = false;
                        currentBannerMargin = null;
                    }
                }
            } catch (err) {
                console.error('Error hiding native banner ad:', err);
            } finally {
                isBannerOperationInProgress = false;
            }
        };

        function startAdPlayback(forPro = false) {
            if (typeof window.hideNativeBannerAd === 'function') {
                window.hideNativeBannerAd();
            }
            isAdRewardForPro = !!forPro;
            wasAnalyzingBeforeAd = rtaCtx.isAnalyzing();

            if (wasAnalyzingBeforeAd) {
                rtaCtx.stopAnalyzer();
            }
            
            // Hide pro/dynamic upgrade modals to avoid overlay/click blocking
            if (isAdRewardForPro) {
                const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                if (proUpgradeModal) {
                    if (typeof window.closeModal === 'function') window.closeModal(proUpgradeModal);
                    else proUpgradeModal.classList.add('hidden');
                }
                const dynamicUpgradeModal = document.getElementById('dynamic-upgrade-modal');
                if (dynamicUpgradeModal) {
                    if (typeof window.closeModal === 'function') window.closeModal(dynamicUpgradeModal);
                    else dynamicUpgradeModal.classList.add('hidden');
                }
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            }
            
            // Web environment: ad popups disabled until official Google AdSense integration
            if (!window.isNativeMobile()) {
                console.log('[AdController] Web environment: ad popups disabled. Granting feature access directly.');
                grantAdRewardSuccess(true);
                closeAdPlayback(false);
                return;
            }

            // Connectivity Safeguard Check
            if (!navigator.onLine) {
                console.warn('Network connection is offline. Blocking unlock flow.');
                triggerBrowserAdPlayback(true);
                return;
            }

            // Bypass for Direct Sponsorship Configuration
            if (typeof USE_DIRECT_SPONSOR !== 'undefined' && USE_DIRECT_SPONSOR) {
                console.log('USE_DIRECT_SPONSOR enabled. Bypassing AdMob to launch Sponsor Hub directly.');
                triggerBrowserAdPlayback();
                return;
            }
            
            const mobileLoader = document.getElementById('mobile-ad-loader');
            
            if (window.isNativeMobile()) {
                console.log('Native mobile detected. Launching native AdMob Interstitial...');
                
                if (mobileLoader) {
                    mobileLoader.classList.add('active');
                }
                
                const { AdMob } = window.Capacitor?.Plugins || {};
                if (!AdMob) {
                    console.log('AdMob native plugin not found/configured. Falling back to simulated browser ad.');
                    setTimeout(() => {
                        if (mobileLoader) mobileLoader.classList.remove('active');
                        triggerBrowserAdPlayback();
                    }, 800);
                    return;
                }

                let hasAdStartedOrFailed = false;
                const timeoutDuration = 1800; // Fast 1.8s timeout for superior UX

                const failSafeTimeout = setTimeout(() => {
                    if (!hasAdStartedOrFailed) {
                        console.warn(`Native AdMob timed out after ${timeoutDuration}ms. Granting access gracefully...`);
                        hasAdStartedOrFailed = true;
                        if (mobileLoader) mobileLoader.classList.remove('active');
                        grantAdRewardSuccess(false);
                        closeAdPlayback(false);
                        if (typeof window.showToastNotification === 'function') {
                            window.showToastNotification('✓ Unlocked Pro feature');
                        }
                    }
                }, timeoutDuration);

                window.showNativeInterstitialAd(
                    () => {
                        // Ad watched and dismissed successfully
                        clearTimeout(failSafeTimeout);
                        hasAdStartedOrFailed = true;
                        if (mobileLoader) mobileLoader.classList.remove('active');
                        console.log('Native AdMob Interstitial watched & dismissed!');
                        
                        // Grant feature unlock
                        grantAdRewardSuccess(false);
                        closeAdPlayback(false);

                        setTimeout(async () => {
                            await rtaCtx.startAnalyzer();
                        }, 350);

                        setTimeout(() => {
                            let displayName = "Pro Features";
                            const activeKey = window.currentUnlockFeatureKey || (typeof currentUnlockFeatureKey !== 'undefined' ? currentUnlockFeatureKey : null);
                            if (activeKey) {
                                if (activeKey === 'blog' && window.pendingArticleToOpen) {
                                    displayName = "Selected Guide";
                                } else if (activeKey === 'spectrogram') {
                                    displayName = "Spectrogram Waterfall";
                                } else if (activeKey === 'snapshots') {
                                    displayName = "4 RTA Snapshots";
                                } else if (activeKey === 'snapshot_slot_1') {
                                    displayName = "Trace B Snapshot";
                                } else if (activeKey === 'snapshot_slot_2') {
                                    displayName = "Trace C Snapshot";
                                } else if (activeKey === 'snapshot_slot_3') {
                                    displayName = "Trace D Snapshot";
                                } else if (activeKey === 'mic_calibration') {
                                    displayName = "Mic Calibration Loader";
                                } else if (activeKey === 'ear_training') {
                                    displayName = "Ear Training Lab";
                                } else if (activeKey === 'ear_training_track') {
                                    displayName = "Reference Track";
                                }
                            }
                            if (typeof window.showToastNotification === 'function') {
                                window.showToastNotification(`✓ Unlocked ${displayName} for this session`);
                            }
                        }, 200);
                    },
                    () => {
                        // Ad failed to show
                        if (!hasAdStartedOrFailed) {
                            clearTimeout(failSafeTimeout);
                            hasAdStartedOrFailed = true;
                            console.warn('Native AdMob Interstitial failed. Granting access gracefully...');
                            if (mobileLoader) mobileLoader.classList.remove('active');
                            grantAdRewardSuccess(false);
                            closeAdPlayback(false);
                        }
                    }
                );
                return;
            }
            
            triggerBrowserAdPlayback();
        }

        function grantAdRewardSuccess(showNotification = true) {
            if (isAdRewardForPro) {
                const duration = 45 * 60 * 1000; // 45 Minutes single-feature session
                let unlockedFeatureName = "Pro Feature";
                const featureKey = window.currentUnlockFeatureKey || (typeof currentUnlockFeatureKey !== 'undefined' ? currentUnlockFeatureKey : null);
                if (featureKey) {
                    if (featureKey === 'blog' && window.pendingArticleToOpen) {
                        safeStorage.setItem(`soundengg_temp_pro_until_blog_${window.pendingArticleToOpen}`, Date.now() + duration);
                        unlockedFeatureName = "Selected Guide";
                    } else {
                        const persistenceKey = featureKey === 'ear_training_track' ? 'ear_training' : featureKey;
                        safeStorage.setItem(`soundengg_temp_pro_until_${persistenceKey}`, Date.now() + duration);
                        if (featureKey === 'fullscreen') {
                            unlockedFeatureName = "Fullscreen Console";
                        } else if (featureKey === 'pulse_delay') {
                            unlockedFeatureName = "Acoustic Pulse Finder";
                        } else if (featureKey === 'spectrogram') {
                            unlockedFeatureName = "Spectrogram Waterfall";
                        } else if (featureKey === 'snapshots') {
                            unlockedFeatureName = "4 RTA Snapshots";
                        } else if (featureKey === 'snapshot_slot_1') {
                            unlockedFeatureName = "Trace B Snapshot Slot";
                        } else if (featureKey === 'snapshot_slot_2') {
                            unlockedFeatureName = "Trace C Snapshot Slot";
                        } else if (featureKey === 'snapshot_slot_3') {
                            unlockedFeatureName = "Trace D Snapshot Slot";
                        } else if (featureKey === 'mic_calibration') {
                            unlockedFeatureName = "Mic Calibration Loader";
                        } else if (featureKey === 'ear_training') {
                            unlockedFeatureName = "Ear Training Lab";
                        } else if (featureKey === 'ear_training_track') {
                            unlockedFeatureName = "Reference Track";
                        }
                    }
                }
                
                // Soft cooldown for tools lock gate
                safeStorage.setItem('tools_unlocked_until', Date.now() + duration);
                
                const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                if (proUpgradeModal) {
                    if (typeof window.closeModal === 'function') window.closeModal(proUpgradeModal);
                    else proUpgradeModal.classList.add('hidden');
                }
                
                const dynamicUpgradeModal = document.getElementById('dynamic-upgrade-modal');
                if (dynamicUpgradeModal) {
                    if (typeof window.closeModal === 'function') window.closeModal(dynamicUpgradeModal);
                    else dynamicUpgradeModal.classList.add('hidden');
                }
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
                
                if (window.updatePremiumUI) {
                    window.updatePremiumUI();
                }
                
                // Dispatch event globally to update modules like RTA (snapshots), Spectrogram, Ear Training, etc.
                document.dispatchEvent(new CustomEvent('proStatusChanged', { detail: window.isPremiumActive() }));

                if (featureKey === 'fullscreen') {
                    rtaCtx.toggleRtaFullscreen(true);
                } else if (featureKey === 'pulse_delay') {
                    setTimeout(() => {
                        rtaCtx.handleAcousticPulseAction();
                    }, 300);
                } else if (featureKey === 'spectrogram') {
                    rtaCtx.setMode('waterfall');
                    const allModeBtns = document.querySelectorAll('.mode-btn, .fs-mode-btn');
                    allModeBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-mode') === 'waterfall'));
                    rtaCtx.syncFullscreenHudWithEngineState();
                } else if (featureKey === 'snapshots' || (featureKey && featureKey.startsWith('snapshot_slot_'))) {
                    rtaCtx.renderSnapshotSlots();
                    rtaCtx.consumePendingSnapshotCapture();
                }
                
                if (featureKey === 'blog' && window.pendingArticleToOpen) {
                    const blogId = window.pendingArticleToOpen;
                    
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

                window.currentUnlockFeatureKey = null;
                if (typeof currentUnlockFeatureKey !== 'undefined') currentUnlockFeatureKey = null;
                
                if (showNotification && typeof window.showToastNotification === 'function') {
                    window.showToastNotification(`✓ Unlocked ${unlockedFeatureName} for this session`);
                }
            } else {
                isAdRewardClaimed = true;
                rtaCtx.toggleRtaFullscreen(true);
                setTimeout(async () => {
                    await rtaCtx.startAnalyzer();
                }, 350);
            }
        }

        function triggerBrowserAdPlayback(isOffline = false) {
            // Ad popups disabled on web app until Google AdSense is officially configured
            const modal = document.getElementById('ad-reward-modal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
            return;
        }

        function closeAdPlayback(isAborted) {
            const modal = document.getElementById('ad-reward-modal');
            const alertBox = document.getElementById('ad-reward-alert');
            const mobileLoader = document.getElementById('mobile-ad-loader');
            if (mobileLoader) mobileLoader.classList.remove('active');
            
            if (adCountdownTimer) {
                clearInterval(adCountdownTimer);
                adCountdownTimer = null;
            }

            if (isAborted) {
                // Do not show the interrupted warning alert if in Sponsor Spotlight or offline state
                const isFallbackOrOffline = (typeof isSponsorSpotlightFallback !== 'undefined' && isSponsorSpotlightFallback) || !navigator.onLine;
                if (alertBox && !isFallbackOrOffline) {
                    alertBox.style.display = 'block';
                    setTimeout(() => {
                        if (modal) modal.classList.remove('active');
                        if (!window.isPremiumActive() && !window.isRtaFullscreenActive && typeof window.showNativeBannerAd === 'function') {
                            window.showNativeBannerAd();
                        }
                        if (isAdRewardForPro) {
                            const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                            if (proUpgradeModal) {
                                if (typeof window.openModal === 'function') window.openModal(proUpgradeModal);
                                else proUpgradeModal.classList.remove('hidden');
                            }
                            const dynamicUpgradeModal = document.getElementById('dynamic-upgrade-modal');
                            if (dynamicUpgradeModal) {
                                if (typeof window.openModal === 'function') window.openModal(dynamicUpgradeModal);
                                else dynamicUpgradeModal.classList.remove('hidden');
                            }
                        }
                    }, 1800);
                } else {
                    if (modal) modal.classList.remove('active');
                    if (!window.isPremiumActive() && !window.isRtaFullscreenActive && typeof window.showNativeBannerAd === 'function') {
                        window.showNativeBannerAd();
                    }
                    if (isAdRewardForPro) {
                        const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                        if (proUpgradeModal) {
                            if (typeof window.openModal === 'function') window.openModal(proUpgradeModal);
                            else proUpgradeModal.classList.remove('hidden');
                        }
                        const dynamicUpgradeModal = document.getElementById('dynamic-upgrade-modal');
                        if (dynamicUpgradeModal) {
                            if (typeof window.openModal === 'function') window.openModal(dynamicUpgradeModal);
                            else dynamicUpgradeModal.classList.remove('hidden');
                        }
                    }
                }
            } else {
                if (modal) {
                    if (typeof window.closeModal === 'function') window.closeModal(modal);
                    else modal.classList.remove('active');
                }
                const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                if (proUpgradeModal) {
                    if (typeof window.closeModal === 'function') window.closeModal(proUpgradeModal);
                    else proUpgradeModal.classList.add('hidden');
                }
                const dynamicUpgradeModal = document.getElementById('dynamic-upgrade-modal');
                if (dynamicUpgradeModal) {
                    if (typeof window.closeModal === 'function') window.closeModal(dynamicUpgradeModal);
                    else dynamicUpgradeModal.classList.add('hidden');
                }
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
                if (!window.isPremiumActive() && !window.isRtaFullscreenActive && typeof window.showNativeBannerAd === 'function') {
                    window.showNativeBannerAd();
                }
            }
        }

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
            btnClaimAdReward.addEventListener('click', async () => {
                if (typeof isSponsorSpotlightFallback !== 'undefined' && isSponsorSpotlightFallback) {
                    console.log('Sponsor Spotlight fallback clicked. Opening sponsor link and instantly granting reward.');
                    try {
                        const BrowserPlugin = window.Capacitor?.Plugins?.Browser;
                        if (BrowserPlugin && typeof BrowserPlugin.open === 'function') {
                            await BrowserPlugin.open({ url: ACTIVE_SPONSOR_URL });
                        } else {
                            window.open(ACTIVE_SPONSOR_URL, '_blank');
                        }
                    } catch (err) {
                        console.error('Error launching sponsor link:', err);
                        window.open(ACTIVE_SPONSOR_URL, '_blank');
                    }
                }
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

        window.grantAdRewardSuccess = grantAdRewardSuccess;
        window.startAdPlayback = startAdPlayback;

        return {
            startAdPlayback,
            grantAdRewardSuccess,
            closeAdPlayback,
            isAdRewardClaimed: () => isAdRewardClaimed
        };
    }
};
