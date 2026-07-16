/**
 * SoundEngg Billing & In-App Purchases Module (Version 1.2)
 * Integrates RevenueCat's Capacitor Purchases SDK with Supabase Auth
 */

const REVENUECAT_IOS_API_KEY = "appl_placeholder_key_here";
const REVENUECAT_ANDROID_API_KEY = "goog_placeholder_key_here";
const ENTITLEMENT_ID = "pro"; // Match your entitlement ID set up in RevenueCat Dashboard

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
    updateUserEntitlements: function(customerInfo) {
        if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) {
            return;
        }

        const isProEntitled = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

        console.log(`[Billing] Entitlement check complete. Pro active: ${isProEntitled}`);
        
        // Update local session variables
        window.isUserPro = isProEntitled;
        
        if (isProEntitled) {
            const activeEntitled = customerInfo.entitlements.active[ENTITLEMENT_ID];
            // Match transaction product identifiers to determine monthly/annual/lifetime tier
            if (activeEntitled.productIdentifier.includes("lifetime")) {
                window.userSubscriptionTier = "lifetime";
            } else {
                window.userSubscriptionTier = "pro";
            }
        } else {
            window.userSubscriptionTier = "free";
        }

        // Trigger global layout refreshes
        if (typeof window.updatePremiumUI === 'function') {
            window.updatePremiumUI();
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

        try {
            console.log(`[Billing] Requesting purchase of: ${productIdentifier}...`);
            // Fetch packages
            const offerings = await this.purchases.getOfferings();
            
            if (offerings.current && offerings.current.availablePackages.length > 0) {
                // Find matching package
                const pkgToBuy = offerings.current.availablePackages.find(p => p.packageType === productIdentifier || p.storeProduct.identifier === productIdentifier);
                
                if (pkgToBuy) {
                    const { customerInfo } = await this.purchases.purchasePackage({ aPackage: pkgToBuy });
                    this.updateUserEntitlements(customerInfo);
                    return { success: window.isUserPro, customerInfo };
                }
            }
            
            // Fallback to direct product purchase if offerings aren't populated
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
