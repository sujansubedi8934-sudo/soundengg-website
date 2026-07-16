# Feature Ticket List (FTL) - SoundEngg

This document tracks all buildable tickets, priorities, and execution status for the SoundEngg billing and app store launch.

---

## 🏁 Completed Tickets (Version 1.0.7)

### 🎫 SE-101: Create Supabase Reviewer Account
*   **Priority:** Must-have for launch (CRITICAL)
*   **Task Description:** Register a dedicated, confirmed test account for Apple reviewers in the production Supabase GoTrue database so that they can log in without entering external verification pins or using their own emails.
*   **Acceptance Criteria:** 
    *   Reviewer account email is `apple-reviewer@soundengg.com` and password is `AppleReviewer123!`.
    *   Account registration succeeds and status displays as "email confirmed/active" immediately in Supabase without requiring verification email link clicks.
*   **Dependencies:** None
*   **Status:** `DONE`

### 🎫 SE-102: Draft and Submit Reviewer Reply
*   **Priority:** Must-have for launch (CRITICAL)
*   **Task Description:** Reply directly to Apple's rejection ticket in the App Store Connect Resolution Center with the pre-configured credentials to request continuation of the review.
*   **Acceptance Criteria:** 
    *   Form credentials are saved in the "App Review Information" page in App Store Connect.
    *   Formal notification containing the email and password is sent through the Resolution Center.
*   **Dependencies:** SE-101
*   **Status:** `DONE`

### 🎫 SE-103: Install Purchases Capacitor Plugin
*   **Priority:** Must-have for launch (HIGH)
*   **Task Description:** Install the `@revenuecat/purchases-capacitor` dependency locally and sync Capacitor web assets configuration parameters.
*   **Acceptance Criteria:**
    *   `package.json` contains `@revenuecat/purchases-capacitor`.
    *   Plugin installs without warnings or conflicts and compiles successfully in node dependencies.
*   **Dependencies:** None
*   **Status:** `DONE`

### 🎫 SE-104: Build billing.js Core Module
*   **Priority:** Must-have for launch (HIGH)
*   **Task Description:** Develop the client module `assets/js/modules/billing.js` to manage native StoreKit / Play Console bridge initialization and entitling.
*   **Acceptance Criteria:**
    *   RevenueCat SDK initializes on startup using the Public key `test_jJwYMCBMjObenYRxyfglVMzOakP`.
    *   User auth sessions sync Supabase User UUID with RevenueCat customer logs.
    *   Entitlement check queries `"SoundEngg Pro"` correctly and updates the local storage cache variables (`isUserPro`).
*   **Dependencies:** SE-103
*   **Status:** `DONE`

### 🎫 SE-105: Update Web-Native Checkout Routing
*   **Priority:** Must-have for launch (HIGH)
*   **Task Description:** Update the primary checkout confirm modal bindings in `main.js` to bypass web credit card checkouts (Razorpay/Lemon Squeezy) when running in Capacitor native contexts.
*   **Acceptance Criteria:**
    *   Running on browser triggers Razorpay (India) or Lemon Squeezy (International).
    *   Running on native iOS / Android bypasses web views and triggers the native RevenueCat SDK purchase sheet instead.
*   **Dependencies:** SE-104
*   **Status:** `DONE`

### 🎫 SE-106: Update UI Price Display
*   **Priority:** Should-have (MEDIUM)
*   **Task Description:** Change pricing values on all marketing landing layouts and modular popup displays to match the new rates ($1.99 monthly / $19.99 yearly / $34.99 lifetime).
*   **Acceptance Criteria:**
    *   `pro.html` pricing cards show the updated values.
    *   `app.html` in-app upgrade options container displays the correct rates.
    *   `main.js` dynamic UI formatters reflect the values for international targets.
*   **Dependencies:** None
*   **Status:** `DONE`

---

## ⏳ Active & Pending Tickets (Version 1.2.0)

### 🎫 SE-201: Verify Banking Agreement Activation
*   **Priority:** Must-have for launch (HIGH)
*   **Task Description:** Wait for the bank verification checks and U.S. Tax Questionnaire status to change to **Active** (typically 24 hours). This will unlock the paid IAP products page in App Store Connect.
*   **Acceptance Criteria:**
    *   Apple banking status changes from "Processing" to "Active".
    *   "In-App Purchases" error page in App Store Connect unlocks and displays correctly without generic failures.
*   **Dependencies:** None
*   **Status:** `IN PROGRESS`

### 🎫 SE-202: Create Products in App Store Connect
*   **Priority:** Must-have for launch (HIGH)
*   **Task Description:** Define and configure three in-app product items in App Store Connect with identical IDs matching the codebase:
    *   `com.soundengg.app.monthly` ($1.99 / ₹99)
    *   `com.soundengg.app.yearly` ($19.99 / ₹999)
    *   `com.soundengg.app.lifetime` ($34.99 / ₹1,999)
*   **Acceptance Criteria:**
    *   Product metadata, localization details (45-character maximum descriptions), and prices are saved.
    *   Product states turn to "Ready to Submit".
*   **Dependencies:** SE-201
*   **Status:** `TODO`

### 🎫 SE-203: Link App Store Products in RevenueCat
*   **Priority:** Must-have for launch (HIGH)
*   **Task Description:** Register the three product IDs under the App Store integration in the RevenueCat dashboard and attach them under the `SoundEngg Pro` Entitlement.
*   **Acceptance Criteria:**
    *   All three product IDs are registered.
    *   Products are attached to the `SoundEngg Pro` Entitlement in RevenueCat.
*   **Dependencies:** SE-202
*   **Status:** `TODO`

### 🎫 SE-204: Google Play Billing Setup (Android Update)
*   **Priority:** Nice-to-have (LOW)
*   **Task Description:** Link the Android app in RevenueCat to Google Play Console via a Service Account JSON Key, create matching in-app subscriptions, and submit the Android update.
*   **Acceptance Criteria:**
    *   Google Play Developer API is linked to RevenueCat.
    *   Subscriptions are created in Google Play Console (₹99 / ₹999 / ₹1,999).
    *   Android app update compiles and deploys natively.
*   **Dependencies:** SE-203
*   **Status:** `TODO`
