// ==========================================
// AD MANAGER SYSTEM
// ==========================================
// GLOBAL ADMOB CONFIGURATION & HELPERS (Capacitor v8 Spec)
// ========================================================
const ADMOB_ANDROID_REWARDED_ID = 'ca-app-pub-4117687060036448/8475961821'; // Production/Test Android ID
const ADMOB_IOS_REWARDED_ID = 'ca-app-pub-4117687060036448/9597471806';     // Production/Test iOS ID

const USE_TEST_REWARDED_ADS = true; // Toggle to false to use production rewarded video IDs
const ADMOB_ANDROID_REWARDED_TEST_ID = 'ca-app-pub-3940256099942544/5224354917';
const ADMOB_IOS_REWARDED_TEST_ID = 'ca-app-pub-3940256099942544/1712485313';

const USE_DIRECT_SPONSOR = false; // Toggle to true to bypass Google AdMob and use direct affiliate partnerships/support hub
const ACTIVE_SPONSOR_URL = 'https://soundengg.com/active-sponsor';
let isSponsorSpotlightFallback = false;

// AdMob Banner unit mappings
const USE_TEST_BANNER_ADS = true; // Toggle to false to use production banner IDs
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
        await AdMob.prepareRewardVideoAd({ adId: adId });
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
            if (onCloseCallback) onCloseCallback();
        });

        failLoadListener = await AdMob.addListener('onRewardedVideoAdFailedToLoad', (err) => {
            console.warn('Native AdMob failed to load:', err);
            cleanup();
            if (onFailureCallback) onFailureCallback();
        });

        failShowListener = await AdMob.addListener('onRewardedVideoAdFailedToShow', (err) => {
            console.warn('Native AdMob failed to show:', err);
            cleanup();
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
        if (onFailureCallback) onFailureCallback();
    }
};

// Aliases for global compatibility
window.preloadNativeRewardedAd = window.preloadNativeRewardedAd;
window.showNativeRewardedAd = window.showNativeRewardedAd;



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
            const { AdMob } = window.Capacitor?.Plugins || {};
            if (AdMob) {
                AdMob.initialize({
                    requestTrackingAuthorization: true
                }).then(() => {
                    console.log("AdMob successfully initialized!");
                    window.isAdMobInitialized = true;
                    window.preloadNativeRewardedAd();
                }).catch(err => {
                    console.error("AdMob initialization failed:", err);
                    window.isAdMobInitialized = false;
                });
            }
        } catch (e) {
            console.error("Capacitor AdMob initialization error: ", e);
        }
    }

    let countdownInterval;
    let countdownVal = 15;

    function checkAdStatus() {
        // If PALM EXPO mode is active, always bypass the ad-gate instantly
        if (IS_EXPO_MODE_ACTIVE) {
            console.log("⚡ PALM EXPO 2026 ACTIVE MODE: Instant premium access, ads disabled.");
            unlockApp();
            return;
        }

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
        if (bottomBanner) {
            bottomBanner.classList.add('hidden');
            bottomBanner.style.display = 'none';
        }

        if (window.isNativeMobile()) {
            console.log('Native Mobile detected. Triggering mobile lock modal flow...');
            if (typeof window.hideNativeBannerAd === 'function') {
                window.hideNativeBannerAd(); // Hide native bottom banner on locking screen
            }
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
            
            // Hide the video ad container (sponsor reward ad design) completely on native mobile when online
            const videoAdContainer = modal.querySelector('.video-ad-container');
            if (videoAdContainer) {
                videoAdContainer.style.display = 'none';
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
            
            // Restore display for standard desktop browser flow (which uses Google AdSense)
            const videoAdContainer = modal.querySelector('.video-ad-container');
            if (videoAdContainer) {
                videoAdContainer.style.display = 'block';
            }
            
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
                if (typeof window.showNativeBannerAd === 'function') {
                    window.showNativeBannerAd(); // Show native bottom banner ad
                }
            } else {
                if (bottomBanner) {
                    bottomBanner.classList.remove('hidden');
                    bottomBanner.style.display = 'flex';
                }
            }
        }
        
        modal.classList.add('hidden');

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
        if (IS_EXPO_MODE_ACTIVE) {
            onSuccessCallback();
            return;
        }

        if (window.isPremiumActive()) {
            onSuccessCallback();
            return;
        }

        const unlockedUntil = safeStorage.getItem('tools_unlocked_until');
        const now = Date.now();
        if (unlockedUntil && now < parseInt(unlockedUntil, 10)) {
            onSuccessCallback();
            return;
        }

        console.log(`Access to ${featureName} is gated. Opening central ad gate...`);
        window.pendingAdAction = onSuccessCallback;
        lockApp();
    };

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

                window.showNativeRewardedAd(
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

    // --- LEMON SQUEEZY SUBSCRIPTION & ONE-TIME CHECKOUT ---
    async function initiateLemonSqueezyCheckout(user, plan = 'lifetime') {
        if (typeof window.hideNativeBannerAd === 'function') {
            window.hideNativeBannerAd();
        }
        
        let currency = "USD";
        
        // Show loading spinner
        let loadingOverlay = document.createElement('div');
        loadingOverlay.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10,15,20,0.85); backdrop-filter: blur(10px); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: sans-serif;";
        loadingOverlay.innerHTML = `
            <div style="width: 50px; height: 50px; border: 4px solid var(--primary, #14A7B5); border-top-color: transparent; border-radius: 50%; animation: spin 1s infinite linear; margin-bottom: 20px;"></div>
            <div style="font-size: 1.1rem; font-weight: 500; letter-spacing: 0.5px;">Establishing secure handshake...</div>
            <div style="font-size: 0.85rem; color: #888; margin-top: 8px;">Contacting Lemon Squeezy gateway securely</div>
        `;
        document.body.appendChild(loadingOverlay);

        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) throw new Error("No active session found. Please log in.");

            // Fetch secure checkout URL from Deno Edge Function
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
            
            const checkoutUrl = data.checkout_url;
            if (!checkoutUrl) throw new Error("Server did not return a valid checkout URL.");

            // Launch the Checkout URL
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
                // Inside native Capacitor wrapper, open native browser tab
                await window.Capacitor.Plugins.Browser.open({ url: checkoutUrl });
                // Start polling database for status update
                pollForSubscriptionActivation(session, plan);
            } else {
                // In standard web browser, open the Lemon Squeezy overlay modal if loaded, else fallback to window.open
                if (window.LemonSqueezy) {
                    window.LemonSqueezy.Url.Open(checkoutUrl);
                    pollForSubscriptionActivation(session, plan);
                } else {
                    window.open(checkoutUrl, '_blank');
                    pollForSubscriptionActivation(session, plan);
                }
            }

        } catch (e) {
            loadingOverlay.remove();
            console.error("Lemon Squeezy Checkout error:", e);
            alert(`Could not launch secure payment gateway:\n${e.message}`);
        }
    }
    window.initiateLemonSqueezyCheckout = initiateLemonSqueezyCheckout;

    // --- SECURE REAL-TIME POLLING FOR WEBHOOK COMPLETION ---
    function pollForSubscriptionActivation(session, plan) {
        const verifyOverlay = document.createElement('div');
        verifyOverlay.id = 'lemonsqueezy-verify-overlay';
        verifyOverlay.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10,15,20,0.85); backdrop-filter: blur(10px); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: sans-serif;";
        verifyOverlay.innerHTML = `
            <div style="width: 50px; height: 50px; border: 4px solid var(--primary, #14A7B5); border-top-color: transparent; border-radius: 50%; animation: spin 1s infinite linear; margin-bottom: 20px;"></div>
            <div style="font-size: 1.1rem; font-weight: 500; letter-spacing: 0.5px;">Waiting for payment confirmation...</div>
            <div style="font-size: 0.85rem; color: #888; margin-top: 8px;">Please complete checkout in the browser. Unlocking automatically...</div>
            <button id="btn-cancel-verify-polling" style="margin-top: 25px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 10px 20px; font-family: monospace; border-radius: 4px; cursor: pointer;">DISMISS</button>
        `;
        document.body.appendChild(verifyOverlay);

        let isDismissed = false;
        const btnDismiss = verifyOverlay.querySelector('#btn-cancel-verify-polling');
        btnDismiss.onclick = () => {
            isDismissed = true;
            verifyOverlay.remove();
            if (!window.isPremiumActive() && typeof window.showNativeBannerAd === 'function') {
                window.showNativeBannerAd();
            }
        };

        const edgeFuncUrl = "https://ewudkzyjcvjxxqpqnqiy.supabase.co/functions/v1/secure-payment";
        let attempts = 0;
        const maxAttempts = 50; // Poll for 100 seconds (2s intervals)
        
        const interval = setInterval(async () => {
            if (isDismissed) {
                clearInterval(interval);
                return;
            }

            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(interval);
                verifyOverlay.remove();
                alert("Payment verification is taking longer than expected. If your payment went through, it will automatically update in your profile shortly!");
                if (!window.isPremiumActive() && typeof window.showNativeBannerAd === 'function') {
                    window.showNativeBannerAd();
                }
                return;
            }

            try {
                const response = await fetch(edgeFuncUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        action: "verify_payment",
                        plan: plan,
                        provider: "lemonsqueezy",
                        user_currency: "USD"
                    })
                });

                const verifyResult = await response.json();
                if (response.ok && verifyResult.success) {
                    clearInterval(interval);
                    
                    safeStorage.setItem('tools_unlocked_until', (plan === 'lifetime') ? (Date.now() + (10 * 365 * 24 * 60 * 60 * 1000)) : (Date.now() + (plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000));
                    
                    await syncSubscriptionStatus(session);
                    
                    const proUpgradeModal = document.getElementById('pro-upgrade-modal');
                    if (proUpgradeModal) proUpgradeModal.classList.add('hidden');
                    
                    if (window.updatePremiumUI) {
                        window.updatePremiumUI();
                    }
                    
                    unlockApp();
                    verifyOverlay.remove();
                    if (typeof showCheckoutSuccessOverlay === 'function') {
                        showCheckoutSuccessOverlay(plan);
                    } else if (typeof window.showCheckoutSuccessOverlay === 'function') {
                        window.showCheckoutSuccessOverlay(plan);
                    }
                }
            } catch (err) {
                console.warn("Polling verify error:", err);
            }
        }, 2000);
    }

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

            if (window.isIndiaUser) {
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
            } else {
                // Dynamically load Lemon Squeezy SDK if not already in document
                if (typeof LemonSqueezy === 'undefined') {
                    console.log("Loading Lemon Squeezy SDK dynamically...");
                    const script = document.createElement('script');
                    script.src = "https://assets.lemonsqueezy.com/lemon.js";
                    script.onload = () => initiateLemonSqueezyCheckout(user);
                    script.onerror = () => alert("Failed to load Lemon Squeezy payment SDK. Check your internet connection.");
                    document.head.appendChild(script);
                } else {
                    initiateLemonSqueezyCheckout(user);
                }
            }
        });
    }

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

    // Run initial check
    checkAdStatus();
}
