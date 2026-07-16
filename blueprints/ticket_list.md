# Feature Ticket List (FTL) - SoundEngg

This document tracks all buildable tickets, priorities, and execution status for the SoundEngg billing and app store launch.

---

## 🏁 Completed Tickets (Version 1.0.7)

### 🎫 SE-101: Create Supabase Reviewer Account
*   **Priority:** CRITICAL
*   **Description:** Register a test account `apple-reviewer@soundengg.com` with password `AppleReviewer123!` in the live Supabase authentication database to bypass the login screen for Apple reviewers.
*   **Status:** `DONE`

### 🎫 SE-102: Draft and Submit Reviewer Reply
*   **Priority:** CRITICAL
*   **Description:** Reply directly to Apple's rejection ticket in the App Store Connect Resolution Center with the test reviewer login details to resume the review.
*   **Status:** `DONE`

### 🎫 SE-103: Install Purchases Capacitor Plugin
*   **Priority:** HIGH
*   **Description:** Install the `@revenuecat/purchases-capacitor` dependency in `package.json` to enable native store APIs.
*   **Status:** `DONE`

### 🎫 SE-104: Build billing.js Core Module
*   **Priority:** HIGH
*   **Description:** Develop the JavaScript wrapper module `assets/js/modules/billing.js` to initialize RevenueCat with API keys, sync Supabase Auth session UIDs, monitor entitlement changes, and execute transactions.
*   **Status:** `DONE`

### 🎫 SE-105: Update Web-Native Checkout Routing
*   **Priority:** HIGH
*   **Description:** Modify checkout click listeners in `assets/js/main.js` to bypass Razorpay and Lemon Squeezy popups when running natively on iOS or Android, calling RevenueCat instead.
*   **Status:** `DONE`

### 🎫 SE-106: Update UI Price Display
*   **Priority:** MEDIUM
*   **Description:** Change marketing price values from $2.99 / $29.99 / $49.99 to $1.99 / $19.99 / $34.99 across `app.html`, `pro.html`, and dynamic JS formatters.
*   **Status:** `DONE`

---

## ⏳ Active & Pending Tickets (Version 1.2.0)

### 🎫 SE-201: Verify Banking Agreement Activation
*   **Priority:** HIGH
*   **Status:** `IN PROGRESS`
*   **Description:** Wait for the bank verification checks and U.S. Tax Questionnaire status to change to **Active** (typically 24 hours). This will unlock the paid IAP products page in App Store Connect.
*   **Assignee:** User / Apple Support

### 🎫 SE-202: Create Products in App Store Connect
*   **Priority:** HIGH
*   **Status:** `TODO`
*   **Description:** Create three products in App Store Connect with identical IDs:
    *   `com.soundengg.app.monthly` ($1.99 / ₹99)
    *   `com.soundengg.app.yearly` ($19.99 / ₹999)
    *   `com.soundengg.app.lifetime` ($34.99 / ₹1,999)
*   **Assignee:** User

### 🎫 SE-203: Link App Store Products in RevenueCat
*   **Priority:** HIGH
*   **Status:** `TODO`
*   **Description:** Register the three product IDs under the App Store integration in the RevenueCat dashboard and attach them under the `SoundEngg Pro` Entitlement.
*   **Assignee:** User

### 🎫 SE-204: Google Play Billing Setup (Android Update)
*   **Priority:** LOW
*   **Status:** `TODO`
*   **Description:** Link the Android app in RevenueCat to Google Play Console via a Service Account JSON Key, create matching in-app subscriptions, and submit the Android update.
*   **Assignee:** Developer
