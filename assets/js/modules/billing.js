/**
 * SoundEngg Billing & In-App Purchases Module (Version 1.2)
 * Integrates RevenueCat's Capacitor Purchases SDK with Supabase Auth
 */

const REVENUECAT_IOS_API_KEY = "appl_colKSceOQdHfEjWTEocAwJkBjGj";
const REVENUECAT_ANDROID_API_KEY = "test_jJwYMCBMjObenYRxyfglVMzOakP";
const ENTITLEMENT_ID = "SoundEngg Pro"; // Match your entitlement ID set up in RevenueCat Dashboard

window.billingManager = {
    purchases: null,
    isInitialized: false,

    /**
     * Initializes the RevenueCat Purchases SDK
     */
    init: async function() {
        // Only run purchases code on native mobile platforms
        if (!window.isNativeMobile || !window.isNativeMobile()) {
            console.log("[Billing] Web environment detected. Skipping native In-App Purchase initialization.");
            return;
        }

        try {
            // Retrieve Capacitor Plugins
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases) {
                this.purchases = window.Capacitor.Plugins.Purchases;
            } else {
                console.warn("[Billing] RevenueCat Purchases plugin not found in Capacitor Plugins list.");
                return;
            }

            // Determine platform and corresponding key
            let apiKey = "";
            if (window.Capacitor.getPlatform() === 'ios') {
                apiKey = REVENUECAT_IOS_API_KEY;
            } else if (window.Capacitor.getPlatform() === 'android') {
                apiKey = REVENUECAT_ANDROID_API_KEY;
            }

            if (!apiKey || apiKey.includes("placeholder")) {
                console.warn("[Billing] RevenueCat API keys are not yet configured. Please update them in assets/js/modules/billing.js.");
                return;
            }

            // Initialize SDK
            await this.purchases.configure({ apiKey });
            this.isInitialized = true;
            console.log("[Billing] RevenueCat Purchases SDK successfully initialized.");

            // Sync user authentication status if logged in
            this.syncUserSession();

            // Set up listener for purchaser info updates
            this.purchases.addCustomerInfoUpdateListener((customerInfo) => {
                this.updateUserEntitlements(customerInfo);
            });

            // Perform initial status check
            const customerInfo = await this.purchases.getCustomerInfo();
            this.updateUserEntitlements(customerInfo);

        } catch (err) {
            console.error("[Billing] Failed to initialize RevenueCat:", err);
        }
    },

    /**
     * Syncs current Supabase Auth user ID with RevenueCat
     */
    syncUserSession: async function() {
        if (!this.isInitialized || !window.supabaseClient) return;

        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            const user = session?.user;

            if (user) {
                console.log(`[Billing] Logged in. Syncing Supabase UID: ${user.id} with RevenueCat.`);
                await this.purchases.logIn({ appUserID: user.id });
            } else {
                console.log("[Billing] Logged out. Resetting RevenueCat user identity.");
                await this.purchases.logOut();
            }
        } catch (err) {
            console.error("[Billing] Error syncing user session with RevenueCat:", err);
        }
    },

    /**
     * Handles updating premium status in the global window object and refreshing the UI
     */
    updateUserEntitlements: async function(customerInfo) {
        if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) {
            return;
        }

        const isProEntitled = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

        console.log(`[Billing] Entitlement check complete. Pro active: ${isProEntitled}`);
        
        // Update local session variables
        window.isUserPro = isProEntitled;
        
        let targetTier = "free";
        let activeEntitled = null;

        if (isProEntitled) {
            activeEntitled = customerInfo.entitlements.active[ENTITLEMENT_ID];
            // Match transaction product identifiers to determine monthly/yearly/lifetime tier
            if (activeEntitled.productIdentifier.includes("lifetime")) {
                window.userSubscriptionTier = "lifetime";
            } else if (activeEntitled.productIdentifier.includes("yearly")) {
                window.userSubscriptionTier = "yearly";
            } else {
                window.userSubscriptionTier = "pro";
            }
            targetTier = window.userSubscriptionTier;
        } else {
            window.userSubscriptionTier = "free";
        }

        // Trigger global layout refreshes
        if (typeof window.updatePremiumUI === 'function') {
            window.updatePremiumUI();
        }

        // --- SUPABASE CLOUD SYNC LOGIC ---
        if (window.supabaseClient) {
            try {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                const user = session?.user;
                if (user) {
                    // Fetch existing profile to protect other subscription providers (Stripe, Razorpay, etc.)
                    const { data: profile } = await window.supabaseClient
                        .from('profiles')
                        .select('subscription_provider, is_pro, subscription_tier')
                        .eq('id', user.id)
                        .single();

                    if (isProEntitled) {
                        // If user is Pro in RevenueCat, always update Supabase
                        console.log(`[Billing] Syncing Pro status to Supabase for ${user.email}...`);
                        await window.supabaseClient
                            .from('profiles')
                            .update({
                                is_pro: true,
                                subscription_tier: targetTier,
                                subscription_provider: 'apple_iap',
                                subscription_id: activeEntitled.productIdentifier,
                                subscription_expires_at: activeEntitled.expirationDate || null
                            })
                            .eq('id', user.id);
                    } else if (profile && profile.subscription_provider === 'apple_iap' && profile.is_pro) {
                        // If they are no longer Pro on Apple, but the database still says Apple Pro, downgrade them
                        console.log(`[Billing] Downgrading expired Apple subscription in Supabase...`);
                        await window.supabaseClient
                            .from('profiles')
                            .update({
                                is_pro: false,
                                subscription_tier: 'free',
                                subscription_provider: null,
                                subscription_id: null,
                                subscription_expires_at: null
                            })
                            .eq('id', user.id);
                    }
                }
            } catch (err) {
                console.error("[Billing] Failed to sync entitlements with Supabase database:", err);
            }
        }
    },

    /**
     * Triggers the purchase flow for your IAP product package
     * @param {string} productIdentifier Product ID defined in App Store Connect / Play Console
     */
    purchasePackage: async function(productIdentifier) {
        if (!this.isInitialized) {
            alert("Billing system is currently offline or not configured yet. Please try again later.");
            return { success: false, error: "Not initialized" };
        }

        console.log(`[Billing] Requesting purchase of: ${productIdentifier}...`);

        // 1. Try to purchase using Offerings (RevenueCat standard flow)
        try {
            const offerings = await this.purchases.getOfferings();
            if (offerings && offerings.current && offerings.current.availablePackages.length > 0) {
                const pkgToBuy = offerings.current.availablePackages.find(p => {
                    const type = p.packageType ? p.packageType.toLowerCase() : "";
                    const id = p.storeProduct && p.storeProduct.identifier ? p.storeProduct.identifier.toLowerCase() : "";
                    const target = productIdentifier.toLowerCase();
                    return type === target || id === target || type === ('$' + target) || type === target.replace('$', '');
                });
                
                if (pkgToBuy) {
                    console.log(`[Billing] Found matching package in offerings. Launching package checkout...`);
                    const { customerInfo } = await this.purchases.purchasePackage({ aPackage: pkgToBuy });
                    this.updateUserEntitlements(customerInfo);
                    return { success: window.isUserPro, customerInfo };
                }
            }
        } catch (offeringErr) {
            console.warn("[Billing] Failed to fetch offerings. Proceeding to direct product checkout fallback:", offeringErr);
        }

        // 2. Fallback: Try to query product directly and purchase via StoreProduct object (iOS App Store sandbox compliant)
        try {
            console.log(`[Billing] Fetching product details for ID: ${productIdentifier}...`);
            const products = await this.purchases.getProducts({ productIdentifiers: [productIdentifier] });
            
            if (products && products.length > 0) {
                const productToBuy = products[0];
                console.log(`[Billing] Found direct product: ${productToBuy.identifier}. Launching store product checkout...`);
                const { customerInfo } = await this.purchases.purchaseStoreProduct({ storeProduct: productToBuy });
                this.updateUserEntitlements(customerInfo);
                return { success: window.isUserPro, customerInfo };
            }
            
            // 3. Absolute Final Fallback: Try raw identifier in case the SDK version accepts it
            console.log(`[Billing] Direct product query returned empty. Attempting raw identifier fallback...`);
            const { customerInfo } = await this.purchases.purchaseStoreProduct({ storeProduct: productIdentifier });
            this.updateUserEntitlements(customerInfo);
            return { success: window.isUserPro, customerInfo };

        } catch (err) {
            console.error("[Billing] Purchase transaction failed or cancelled:", err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Restores previous purchases (required for App Store compliance)
     */
    restorePurchases: async function() {
        if (!this.isInitialized) return;

        try {
            console.log("[Billing] Restoring previous purchases...");
            const customerInfo = await this.purchases.restorePurchases();
            this.updateUserEntitlements(customerInfo);
            return { success: window.isUserPro, customerInfo };
        } catch (err) {
            console.error("[Billing] Failed to restore purchases:", err);
            return { success: false, error: err.message };
        }
    }
};

// Listen for authentication changes to automatically log in/out of RevenueCat
document.addEventListener("DOMContentLoaded", () => {
    if (window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange(() => {
            window.billingManager.syncUserSession();
        });
    }
    
    // Initialize on boot
    window.billingManager.init();
});
