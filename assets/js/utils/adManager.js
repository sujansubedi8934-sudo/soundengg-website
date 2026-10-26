// ==========================================
// AD MANAGER SYSTEM
// ==========================================
// GLOBAL ADMOB CONFIGURATION & HELPERS (Capacitor v8 Spec)
// ========================================================
const ADMOB_ANDROID_REWARDED_ID = 'ca-app-pub-4117687060036448/8475961821'; // Production/Test Android ID
const ADMOB_IOS_REWARDED_ID = 'ca-app-pub-4117687060036448/9597471806';     // Production/Test iOS ID

const USE_TEST_REWARDED_ADS = false; // Toggle to false to use production rewarded video IDs
const ADMOB_ANDROID_REWARDED_TEST_ID = 'ca-app-pub-3940256099942544/5224354917';
const ADMOB_IOS_REWARDED_TEST_ID = 'ca-app-pub-3940256099942544/1712485313';

// Interstitial Ad Unit mappings (Guideline compliant transitions)
// Replace with production IDs from AdMob dashboard and toggle USE_TEST_INTERSTITIAL_ADS to false
const ADMOB_ANDROID_INTERSTITIAL_ID = 'ca-app-pub-4117687060036448/8882338662';
const ADMOB_IOS_INTERSTITIAL_ID = 'ca-app-pub-4117687060036448/6642471524';

const USE_TEST_INTERSTITIAL_ADS = false; // Live production mode enabled for App Store and Google Play!
const ADMOB_ANDROID_INTERSTITIAL_TEST_ID = 'ca-app-pub-3940256099942544/1033173712';
const ADMOB_IOS_INTERSTITIAL_TEST_ID = 'ca-app-pub-3940256099942544/4411468910';

const USE_DIRECT_SPONSOR = false; // Toggle to true to bypass Google AdMob and use direct affiliate partnerships/support hub
const ACTIVE_SPONSOR_URL = 'https://www.soundengg.com/active-sponsor';
let isSponsorSpotlightFallback = false;

// AdMob Banner unit mappings
const USE_TEST_BANNER_ADS = false; // Toggle to false to use production banner IDs
const ADMOB_ANDROID_BANNER_TEST_ID = 'ca-app-pub-3940256099942544/6300978111';
const ADMOB_IOS_BANNER_TEST_ID = 'ca-app-pub-3940256099942544/2934735716';
const ADMOB_ANDROID_BANNER_PROD_ID = 'ca-app-pub-4117687060036448/8473227865';
const ADMOB_IOS_BANNER_PROD_ID = 'ca-app-pub-4117687060036448/3645470223';

let nativeRewardedAdLoaded = false;
let isNativeBannerActive = false;
window.isAdMobInitialized = false;

// ========================================================
// PALM EXPO 2026 AUTOMATED BYPASS (MUMBAI)
// Unlocks all tools and completely disables ads for visitors up to June 5, 2026.
// ========================================================
const EXPO_BYPASS_DATE = new Date("2026-06-05T23:59:59Z").getTime();
const IS_EXPO_MODE_ACTIVE = Date.now() < EXPO_BYPASS_DATE;

window.preloadNativeRewardedAd = async function preloadNativeRewardedAd() {
    if (!window.isNativeMobile()) return;
    if (!window.isAdMobInitialized) {
        console.warn('preloadNativeRewardedAd called before AdMob initialization.');
        return;
    }
    if (!navigator.onLine) {
        console.log('Device is offline. Skipping native rewarded ad preloading.');
        return;
    }
    try {
        const { AdMob } = window.Capacitor?.Plugins || {};
        if (!AdMob) return;
        const isAndroid = window.Capacitor?.getPlatform() === 'android';
        let adId;
        if (USE_TEST_REWARDED_ADS) {
            adId = isAndroid ? ADMOB_ANDROID_REWARDED_TEST_ID : ADMOB_IOS_REWARDED_TEST_ID;
        } else {
            adId = isAndroid ? ADMOB_ANDROID_REWARDED_ID : ADMOB_IOS_REWARDED_ID;
        }
        console.log('Preloading native rewarded ad with unit ID:', adId);
        await AdMob.prepareRewardVideoAd({ adId: adId, isTesting: false });
        nativeRewardedAdLoaded = true;
    } catch (err) {
        console.error('Error preloading native rewarded video ad:', err);
        nativeRewardedAdLoaded = false;
    }
};

window.showNativeRewardedAd = async function showNativeRewardedAd(onRewardCallback, onFailureCallback, onAdStartedCallback, onCloseCallback) {
    if (!window.isNativeMobile()) {
        if (onFailureCallback) onFailureCallback();
        return;
    }
    
    if (!window.isAdMobInitialized) {
        console.warn("showNativeRewardedAd called before AdMob initialization.");
        if (onFailureCallback) onFailureCallback();
        return;
    }

    if (!navigator.onLine) {
        console.warn("Device is offline. Blocking showNativeRewardedAd.");
        if (onFailureCallback) onFailureCallback();
        return;
    }
    
    let rewardListener, closeListener, failLoadListener, failShowListener;
    let isFinalized = false;

    const cleanup = () => {
        if (isFinalized) return;
        isFinalized = true;
        if (rewardListener && typeof rewardListener.remove === 'function') rewardListener.remove();
        if (closeListener && typeof closeListener.remove === 'function') closeListener.remove();
        if (failLoadListener && typeof failLoadListener.remove === 'function') failLoadListener.remove();
        if (failShowListener && typeof failShowListener.remove === 'function') failShowListener.remove();
    };

    try {
        const { AdMob } = window.Capacitor?.Plugins || {};
        if (!AdMob) {
            if (onFailureCallback) onFailureCallback();
            return;
        }

        // Updated event listener strings to match Capacitor community AdMob v8 specification
        rewardListener = await AdMob.addListener('onRewardedVideoAdReward', (info) => {
            console.log('Native AdMob rewarded reward received:', info);
            // Do NOT call cleanup() here to prevent removing the close listener before the ad is dismissed
            if (onRewardCallback) onRewardCallback();
        });

        closeListener = await AdMob.addListener('onRewardedVideoAdDismissed', () => {
            console.log('Native AdMob rewarded ad dismissed.');
            cleanup();
            window.preloadNativeRewardedAd();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            if (onCloseCallback) onCloseCallback();
        });

        failLoadListener = await AdMob.addListener('onRewardedVideoAdFailedToLoad', (err) => {
            console.warn('Native AdMob failed to load:', err);
            cleanup();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            if (onFailureCallback) onFailureCallback();
        });

        failShowListener = await AdMob.addListener('onRewardedVideoAdFailedToShow', (err) => {
            console.warn('Native AdMob failed to show:', err);
            cleanup();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            if (onFailureCallback) onFailureCallback();
        });

        if (!nativeRewardedAdLoaded) {
            await window.preloadNativeRewardedAd();
        }
        await AdMob.showRewardVideoAd();
        if (onAdStartedCallback) onAdStartedCallback();
    } catch (err) {
        console.error('Failed to show native AdMob rewarded ad:', err);
        cleanup();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        if (onFailureCallback) onFailureCallback();
    }
};

let nativeInterstitialAdLoaded = false;
let isInterstitialPreloadInProgress = false;

window.preloadNativeInterstitialAd = async function preloadNativeInterstitialAd() {
    if (!window.isNativeMobile()) return;
    if (window.isPremiumActive && window.isPremiumActive()) return;
    if (isInterstitialPreloadInProgress) return;
    if (!window.isAdMobInitialized) {
        console.warn('preloadNativeInterstitialAd called before AdMob initialization.');
        return;
    }
    if (!navigator.onLine) {
        console.log('Device is offline. Skipping native interstitial preloading.');
        return;
    }
    isInterstitialPreloadInProgress = true;
    try {
        const { AdMob } = window.Capacitor?.Plugins || {};
        if (!AdMob) {
            isInterstitialPreloadInProgress = false;
            return;
        }
        const isAndroid = window.Capacitor?.getPlatform() === 'android';
        let adId;
        if (USE_TEST_INTERSTITIAL_ADS) {
            adId = isAndroid ? ADMOB_ANDROID_INTERSTITIAL_TEST_ID : ADMOB_IOS_INTERSTITIAL_TEST_ID;
        } else {
            adId = isAndroid ? ADMOB_ANDROID_INTERSTITIAL_ID : ADMOB_IOS_INTERSTITIAL_ID;
        }
        console.log('Preloading native interstitial ad with unit ID:', adId);
        await AdMob.prepareInterstitial({ adId: adId, isTesting: USE_TEST_INTERSTITIAL_ADS });
        nativeInterstitialAdLoaded = true;
    } catch (err) {
        console.error('Error preloading native interstitial ad:', err);
        nativeInterstitialAdLoaded = false;
        // Auto-retry in 15 seconds if failed (e.g. network ramp on launch)
        setTimeout(() => {
            if (!nativeInterstitialAdLoaded && navigator.onLine && (!window.isPremiumActive || !window.isPremiumActive())) {
                window.preloadNativeInterstitialAd();
            }
        }, 15000);
    } finally {
        isInterstitialPreloadInProgress = false;
    }
};

window.showNativeInterstitialAd = async function showNativeInterstitialAd(onDismissedCallback, onFailureCallback) {
    if (!window.isNativeMobile()) {
        if (onFailureCallback) onFailureCallback();
        return;
    }
    if (!window.isAdMobInitialized) {
        console.warn("showNativeInterstitialAd called before AdMob initialization. Auto-initializing...");
        try {
            const { AdMob } = window.Capacitor?.Plugins || {};
            if (AdMob) {
                await AdMob.initialize({ requestTrackingAuthorization: false, testingDevices: [] });
                window.isAdMobInitialized = true;
            } else {
                if (onFailureCallback) onFailureCallback();
                return;
            }
        } catch (e) {
            console.error("AdMob auto-init failed:", e);
            if (onFailureCallback) onFailureCallback();
            return;
        }
    }
    if (!navigator.onLine) {
        console.warn("Device is offline. Blocking showNativeInterstitialAd.");
        if (onFailureCallback) onFailureCallback();
        return;
    }

    let closeListener, failListener, showListener;
    let isFinalized = false;

    const cleanup = () => {
        if (isFinalized) return;
        isFinalized = true;
        if (closeListener && typeof closeListener.remove === 'function') closeListener.remove();
        if (failListener && typeof failListener.remove === 'function') failListener.remove();
        if (showListener && typeof showListener.remove === 'function') showListener.remove();
    };

    try {
        const { AdMob } = window.Capacitor?.Plugins || {};
        if (!AdMob) {
            if (onFailureCallback) onFailureCallback();
            return;
        }

        // Hide any active in-app HTML loaders/overlays before native presentation to avoid trapping touches
        const mobileLoader = document.getElementById('mobile-ad-loader');
        if (mobileLoader) mobileLoader.classList.remove('active');
        const lockModal = document.getElementById('ad-lock-modal');
        if (lockModal) lockModal.classList.add('hidden');

        closeListener = await AdMob.addListener('interstitialAdDismissed', () => {
            console.log('Native AdMob interstitial dismissed.');
            cleanup();
            window.preloadNativeInterstitialAd();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            if (onDismissedCallback) onDismissedCallback();
        });

        failListener = await AdMob.addListener('interstitialAdFailedToShow', (err) => {
            console.warn('Native AdMob interstitial failed to show:', err);
            cleanup();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            if (onFailureCallback) onFailureCallback();
        });

        showListener = await AdMob.addListener('interstitialAdShowed', () => {
            console.log('Native AdMob interstitial successfully showed on screen.');
            const ml = document.getElementById('mobile-ad-loader');
            if (ml) ml.classList.remove('active');
        });

        if (!nativeInterstitialAdLoaded) {
            console.log('Preloading interstitial before show with 3.5s safety timeout...');
            const preloadPromise = window.preloadNativeInterstitialAd();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Ad preload timeout')), 3500));
            try {
                await Promise.race([preloadPromise, timeoutPromise]);
            } catch (timeoutErr) {
                console.warn('Ad preload timed out or failed, falling back gracefully:', timeoutErr);
                cleanup();
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
                if (onFailureCallback) onFailureCallback();
                return;
            }
        }

        // Temporarily pause active audio/tones and switch to standard .playback mode so AdMob video player has full AV focus
        try {
            if (typeof window.stopAlignmentLoop === 'function') window.stopAlignmentLoop();
            if (typeof window.stopSignalGenerator === 'function') window.stopSignalGenerator();
            if (typeof window.stopEarTrainingAudio === 'function') window.stopEarTrainingAudio();
            const audioPlugin = window.Capacitor?.registerPlugin ? window.Capacitor.registerPlugin('AudioSessionPlugin') : window.Capacitor?.Plugins?.AudioSessionPlugin;
            if (audioPlugin && typeof audioPlugin.configureAudioSession === 'function') {
                await audioPlugin.configureAudioSession({ category: 'playback', mode: 'default' });
            }
        } catch (e) {
            console.warn('Pre-ad audio cleanup note:', e);
        }

        await AdMob.showInterstitial();
        nativeInterstitialAdLoaded = false;
    } catch (err) {
        console.error('Failed to show native AdMob interstitial:', err);
        cleanup();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        if (onFailureCallback) onFailureCallback();
    }
};

// Aliases for global compatibility
window.preloadNativeRewardedAd = window.preloadNativeRewardedAd;
window.showNativeRewardedAd = window.showNativeRewardedAd;
window.preloadNativeInterstitialAd = window.preloadNativeInterstitialAd;
window.showNativeInterstitialAd = window.showNativeInterstitialAd;



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

    if (!window.isNativeMobile()) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
        const rewardModal = document.getElementById('ad-reward-modal');
        if (rewardModal) {
            rewardModal.style.display = 'none';
            rewardModal.classList.remove('active');
        }
        const mobileLoader = document.getElementById('mobile-ad-loader');
        if (mobileLoader) {
            mobileLoader.style.display = 'none';
            mobileLoader.classList.remove('active');
        }
    }

    if (window.isNativeMobile()) {
        console.log("Initializing native AdMob system inside Ad Manager...");
        try {
            const { AdMob } = window.Capacitor?.Plugins || {};
            if (AdMob) {
                AdMob.initialize({
                    requestTrackingAuthorization: false,
                    testingDevices: []
                }).then(async () => {
                    console.log("AdMob successfully initialized!");
                    window.isAdMobInitialized = true;
                    window.preloadNativeInterstitialAd();

                    // Register Banner Ad Event Listeners to guarantee clean layout bounds
                    try {
                        AdMob.addListener('bannerAdLoaded', () => {
                            if (window.isPremiumActive() || window.isRtaFullscreenActive || (typeof window.isRtaViewOrFullscreenActive === 'function' && window.isRtaViewOrFullscreenActive())) {
                                console.log("AdMob Banner Ad loaded while RTA/Pro active — hiding immediately.");
                                if (typeof window.hideNativeBannerAd === 'function') {
                                    window.hideNativeBannerAd();
                                }
                                return;
                            }
                            console.log("AdMob Banner Ad loaded successfully.");
                            window.isNativeBannerActive = true;
                            document.body.classList.add('has-native-banner');
                        });

                        AdMob.addListener('bannerAdFailedToLoad', (err) => {
                            console.warn("AdMob Banner Ad failed to load (No ad to show):", err);
                            window.isNativeBannerActive = false;
                            document.body.classList.remove('has-native-banner');

                            // Automatic background retry after 45 seconds to pick up newly filled inventory
                            if (!window.bannerRetryTimeout) {
                                window.bannerRetryTimeout = setTimeout(() => {
                                    window.bannerRetryTimeout = null;
                                    const inRta = window.isRtaFullscreenActive || (typeof window.isRtaViewOrFullscreenActive === 'function' && window.isRtaViewOrFullscreenActive());
                                    if (!window.isNativeBannerActive && !window.isPremiumActive() && !inRta && typeof window.showNativeBannerAd === 'function') {
                                        console.log("Retrying native banner ad after 45s cooldown...");
                                        window.showNativeBannerAd();
                                    }
                                }, 45000);
                            }
                        });
                    } catch (e) {
                        console.warn("Could not attach AdMob banner event listeners:", e);
                    }

                    // iOS App Tracking Transparency: request ATT FIRST before triggering initial ad request
                    // to eliminate duplicate requests and maximize iOS eCPM & fill rate.
                    if (window.Capacitor?.getPlatform() === 'ios') {
                        try {
                            const trackingStatus = await AdMob.trackingAuthorizationStatus();
                            console.log("App Tracking Transparency initial status:", trackingStatus?.status);
                            if (trackingStatus?.status === 'notDetermined') {
                                console.log("Requesting App Tracking Transparency authorization...");
                                const requestResult = await AdMob.requestTrackingAuthorization();
                                console.log("App Tracking Transparency request result:", requestResult?.status);
                            }
                        } catch (e) {
                            console.warn("App Tracking Transparency authorization error:", e);
                        }
                    }

                    // Trigger the native bottom banner cleanly after initialization & ATT checks
                    const inRtaNow = window.isRtaFullscreenActive || (typeof window.isRtaViewOrFullscreenActive === 'function' && window.isRtaViewOrFullscreenActive());
                    if (!window.isPremiumActive() && !inRtaNow && typeof window.showNativeBannerAd === 'function') {
                        console.log("Triggering native banner ad after AdMob initialization & ATT check...");
                        window.showNativeBannerAd();
                    } else if (inRtaNow && typeof window.hideNativeBannerAd === 'function') {
                        window.hideNativeBannerAd();
                    }
                }).catch(err => {
                    console.error("AdMob initialization failed:", err);
                    window.isAdMobInitialized = false;
                });
            }
        } catch (e) {
            console.error("Capacitor AdMob initialization error: ", e);
        }
    }

    function checkAdStatus() {
        // Cold start opens directly to the clean dashboard with passive banner active (no blocking startup popup)
        unlockApp();
    }

    function lockApp() {
        // Legacy #ad-lock-modal disabled (Option A): tools open directly and Pro features use #pro-upgrade-modal
        unlockApp();
    }

    window.lockApp = lockApp;
    window.triggerMobileLock = triggerMobileLock;
    
    function triggerMobileLock() {
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        unlockApp();
    }

    function triggerBrowserLock() {
        // Disabled on web app: no ad popups
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        return;
    }

    function unlockApp() {
        if (appContent) appContent.classList.remove('app-blurred');
        if (sidebar) sidebar.classList.remove('app-blurred');
        
        if (!navigator.onLine) {
            // Automatically hide all online elements when offline
            if (bottomBanner) {
                bottomBanner.classList.add('hidden');
                bottomBanner.style.display = 'none';
            }
            if (window.isNativeMobile() && typeof window.hideNativeBannerAd === 'function') {
                window.hideNativeBannerAd();
            }
            document.querySelectorAll('.adsbygoogle, .ad-banner-bottom, .ad-placeholder').forEach(el => {
                el.classList.add('hidden');
                el.style.display = 'none';
            });
        } else {
            // Online: restore standard behavior
            if (window.isNativeMobile()) {
                if (bottomBanner) {
                    bottomBanner.classList.add('hidden');
                    bottomBanner.style.display = 'none';
                }
                const inRta = window.isRtaFullscreenActive || (typeof window.isRtaViewOrFullscreenActive === 'function' && window.isRtaViewOrFullscreenActive());
                if (!window.isPremiumActive() && !inRta) {
                    if (typeof window.showNativeBannerAd === 'function') {
                        window.showNativeBannerAd(); // Show native bottom banner ad
                    }
                } else {
                    if (typeof window.hideNativeBannerAd === 'function') {
                        window.hideNativeBannerAd(); // Ensure it is hidden
                    }
                }
            } else {
                if (bottomBanner) {
                    bottomBanner.classList.remove('hidden');
                    bottomBanner.style.display = 'flex';
                }
            }
        }
        
        if (typeof window.closeModal === 'function') {
            window.closeModal(modal);
        } else {
            modal.classList.add('hidden');
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';

        // Trigger any pending action that requested access
        if (typeof window.pendingAdAction === 'function') {
            const action = window.pendingAdAction;
            window.pendingAdAction = null;
            try {
                action();
            } catch (err) {
                console.error("Error running pending action after ad unlock:", err);
            }
        }
    }

    // Centralized Ad Gatekeeper (Interceptor) wrapper
    window.executeWithAdGate = function(onSuccessCallback, featureName = "PRO_FEATURE") {
        if (IS_EXPO_MODE_ACTIVE || !window.isNativeMobile() || window.isPremiumActive()) {
            onSuccessCallback();
            return;
        }

        const unlockedUntil = safeStorage.getItem('tools_unlocked_until');
        const now = Date.now();
        if (unlockedUntil && now < parseInt(unlockedUntil, 10)) {
            onSuccessCallback();
            return;
        }

        console.log(`Access to ${featureName} is gated on mobile. Triggering direct mobile Interstitial ad...`);
        let adGateDone = false;
        const safetyTimer = setTimeout(() => {
            if (!adGateDone) {
                adGateDone = true;
                console.warn(`Interstitial safety timer reached for ${featureName}. Unlocking tool gracefully.`);
                safeStorage.setItem('tools_unlocked_until', (Date.now() + 2.5 * 60 * 1000).toString());
                onSuccessCallback();
            }
        }, 2000);

        window.showNativeInterstitialAd(
            () => {
                if (adGateDone) return;
                adGateDone = true;
                clearTimeout(safetyTimer);
                console.log("Interstitial ad dismissed. Granting 2.5-minute cooldown...");
                safeStorage.setItem('tools_unlocked_until', (Date.now() + 2.5 * 60 * 1000).toString()); 
                onSuccessCallback();
            },
            () => {
                if (adGateDone) return;
                adGateDone = true;
                clearTimeout(safetyTimer);
                console.warn("Failed to show Interstitial ad. Granting access gracefully...");
                safeStorage.setItem('tools_unlocked_until', (Date.now() + 2.5 * 60 * 1000).toString());
                onSuccessCallback();
            }
        );
    };

    // Explicit Pro Feature Gatekeeper with Trial exemption and 2.5m Cooldown
    window.gateProFeature = function(featureName, onUnlockedCallback) {
        if (typeof onUnlockedCallback !== 'function') return;

        // 1. Pro subscribers and Active 7-Day Trial users have 100% zero ads
        if (typeof window.isPremiumActive === 'function' && window.isPremiumActive()) {
            onUnlockedCallback();
            return;
        }

        // 2. Active 2.5-minute cooldown check
        const unlockedUntil = Number(safeStorage.getItem('tools_unlocked_until') || 0);
        if (Date.now() < unlockedUntil) {
            onUnlockedCallback();
            return;
        }

        // 3. Trigger ad gate on free tier
        if (typeof window.executeWithAdGate === 'function') {
            window.executeWithAdGate(onUnlockedCallback, featureName);
        } else {
            onUnlockedCallback();
        }
    };

    function grantAccess(hours) {
        const ms = hours * 60 * 60 * 1000;
        safeStorage.setItem('tools_unlocked_until', Date.now() + ms);
        unlockApp();
    }

    function grantAccessMinutes(minutes) {
        const ms = minutes * 60 * 1000;
        safeStorage.setItem('tools_unlocked_until', Date.now() + ms);
        unlockApp();
    }

    function startAdCountdown() {
        countdownVal = 5; // Reduced from 15 to 5 seconds for superior web UX
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

                window.showNativeInterstitialAd(
                    () => {
                        console.log('Native Lock Ad completed successfully!');
                        grantAccessMinutes(4.5);
                    },
                    () => {
                        console.warn('Native AdMob failed to play. Unlocking app gracefully to prevent lockout.');
                        btnCloseAd.disabled = false;
                        btnCloseAd.innerHTML = originalText;
                        grantAccessMinutes(4.5); // Gracefully grant access to prevent lock out
                    }
                );
            } else {
                // Desktop Web Flow
                grantAccessMinutes(4.5);
            }
        });
    }

    if (btnGracePeriod) {
        btnGracePeriod.addEventListener('click', () => {
            grantAccess(2); // Grant 2 hours
        });
    }

    // ========================================================
    // RAZORPAY & SUPABASE PREMIUM INTEGRATION (Phase 6)
    // Replace this test key with your production Razorpay Live Key ID
    // ========================================================
    const RAZORPAY_PRODUCTION_KEY_ID = "rzp_live_SsjbdTD8vcr6Hp";

    async function initiateRazorpayCheckout(user, plan = 'lifetime') {
        if (typeof window.hideNativeBannerAd === 'function') {
            window.hideNativeBannerAd();
        }
        const keyId = window.RAZORPAY_KEY_ID || RAZORPAY_PRODUCTION_KEY_ID;
        
        let amount = 199900; // Default INR Lifetime
        let currency = "INR";
        let planDescription = "Lifetime SoundEngg Pro Access";

        if (window.isIndiaUser) {
            currency = "INR";
            if (plan === 'monthly') {
                amount = 19900;
                planDescription = "Monthly SoundEngg Pro Subscription (₹199/mo)";
            } else if (plan === 'yearly') {
                amount = 99900;
                planDescription = "Yearly SoundEngg Pro Subscription (₹999/yr)";
            } else {
                amount = 199900;
                planDescription = "Lifetime SoundEngg Pro Access (₹1,999)";
            }
        } else {
            currency = "USD";
            if (plan === 'monthly') {
                amount = 499;
                planDescription = "Monthly SoundEngg Pro Subscription ($4.99/mo)";
            } else if (plan === 'yearly') {
                amount = 2999;
                planDescription = "Yearly SoundEngg Pro Subscription ($29.99/yr)";
            } else {
                amount = 6900;
                planDescription = "Lifetime SoundEngg Pro Access ($69.00)";
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
            const edgeFuncUrl = "https://ewudkzyjcvjxxqpqnqiy.supabase.co/functions/v1/secure-payment";
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
                name: "SoundEngg: RTA & Audio Utility",
                description: planDescription,
                image: "https://soundengg.com/assets/img/app-icon.jpg",
                prefill: {
                    name: user.email ? user.email.split('@')[0] : "Audio Engineer",
                    email: user.email || ""
                },
                theme: {
                    color: "#14A7B5"
                },
                modal: {
                    ondismiss: function () {
                        console.log("Razorpay checkout modal closed by user.");
                        if (!window.isPremiumActive() && typeof window.showNativeBannerAd === 'function') {
                            window.showNativeBannerAd();
                        }
                    }
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
                        if (proUpgradeModal) {
                            if (typeof window.closeModal === 'function') window.closeModal(proUpgradeModal);
                            else proUpgradeModal.classList.add('hidden');
                        }
                        document.body.classList.remove('modal-open');
                        document.body.style.overflow = '';
                        document.documentElement.style.overflow = '';
                        
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

            // Force Razorpay to show native UPI intents inside WebViews
            options.webview_intent = true;

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
                alert("❌ Payment Failed: " + resp.error.description);
                if (!window.isPremiumActive() && typeof window.showNativeBannerAd === 'function') {
                    window.showNativeBannerAd();
                }
            });
            rzp.open();

        } catch (e) {
            loadingOverlay.remove();
            console.error("Secure Checkout handshake error:", e);
            alert(`Could not launch secure payment gateway:\n${e.message}`);
        }
    }
    window.initiateRazorpayCheckout = initiateRazorpayCheckout;

    // Note: btn-buy-pro click listener is handled in main.js to open the Plan Selector modal.


    // Monitor network changes to toggle modal dynamically if locked, or update online elements if unlocked
    window.addEventListener('online', () => {
        if (!modal.classList.contains('hidden')) {
            lockApp(); // Re-trigger lock to switch states
        } else {
            unlockApp(); // Re-trigger unlock to restore/show online elements
        }
    });
    
    window.addEventListener('offline', () => {
        if (!modal.classList.contains('hidden')) {
            lockApp(); // Re-trigger lock to switch states
        } else {
            unlockApp(); // Re-trigger unlock to hide online elements
        }
    });

    // Listen for Pro status changes to instantly lock/unlock
    document.addEventListener('proStatusChanged', (e) => {
        if (e.detail === true) {
            unlockApp();
        } else {
            checkAdStatus();
        }
    });

    // Run initial startup check to show lock overlay if cooldown is expired
    checkAdStatus();
}

// --- Global Lifecycle Scroll & Modal Recovery Guard ---
// Ensures that returning from native AdActivities (interstitial/rewarded) or multitasking
// never leaves document.body in a locked scrolling state.
function restoreAppScrollState() {
    const visibleModals = document.querySelectorAll('.modal-overlay:not(.hidden):not([style*="display: none"]), .mobile-ad-loader.active, .ad-modal.active');
    if (visibleModals.length === 0) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }
}
window.restoreAppScrollState = restoreAppScrollState;

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        setTimeout(restoreAppScrollState, 80);
        setTimeout(restoreAppScrollState, 350);
    }
});

window.addEventListener('focus', () => {
    setTimeout(restoreAppScrollState, 80);
    setTimeout(restoreAppScrollState, 350);
});

if (window.Capacitor?.Plugins?.App) {
    try {
        window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
            if (state && state.isActive) {
                setTimeout(restoreAppScrollState, 80);
                setTimeout(restoreAppScrollState, 350);
            }
        });
    } catch (e) {
        console.warn("Capacitor App listener registration:", e);
    }
}

