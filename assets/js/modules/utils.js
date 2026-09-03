// --- Capacitor Native detection early helper ---
window.isNativeMobile = function() {
    return typeof window !== 'undefined' && window.Capacitor !== undefined;
};

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

window.safeStorage = safeStorage;

// --- MODAL UTILITIES (Senior Stability - Global Scope) ---
function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    document.body.classList.add('modal-open');
    if (typeof window.hideNativeBannerAd === 'function') {
        window.hideNativeBannerAd();
    }
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    // Force wipe all inline styles used for the "frozen" fix
    modal.style.display = '';
    modal.style.visibility = '';
    modal.style.opacity = '';
    document.body.classList.remove('modal-open');
    if (!window.isPremiumActive() && !window.isRtaFullscreenActive && typeof window.showNativeBannerAd === 'function') {
        window.showNativeBannerAd();
    }
}

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

// Make them available globally explicitly (in case they are needed across different script files)
window.openModal = openModal;
window.closeModal = closeModal;
window.getDeviceMetadata = getDeviceMetadata;
window.parseDeviceString = parseDeviceString;

// --- DYNAMIC NON-BLOCKING CUSTOM ALERT OVERRIDE (Thread-Safe & Premium) ---
(function() {
    window.alert = function(message) {
        // Create alert element
        const alertModal = document.createElement('div');
        alertModal.id = 'soundengg-custom-alert';
        alertModal.className = 'modal-overlay';
        alertModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5, 5, 8, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 999999; opacity: 1;';
        
        let icon = 'info';
        let accentColor = 'var(--primary, #00f0ff)';
        let title = 'SoundEngg Console';
        
        const lowerMsg = String(message).toLowerCase();
        if (lowerMsg.includes('fail') || lowerMsg.includes('error') || lowerMsg.includes('denied') || lowerMsg.includes('invalid') || lowerMsg.includes('offline')) {
            icon = 'gpp_maybe';
            accentColor = '#ff3860'; // Red Accent
            title = 'System Alert';
        } else if (lowerMsg.includes('success') || lowerMsg.includes('thank you') || lowerMsg.includes('unlocked') || lowerMsg.includes('awesome') || lowerMsg.includes('active')) {
            icon = 'check_circle';
            accentColor = '#23d160'; // Green Accent
            title = 'Success';
        }

        alertModal.innerHTML = `
            <div class="modal-content auth-modal-box" style="max-width: 400px; width: 85%; text-align: center; border: 1px solid ${accentColor}; box-shadow: 0 0 20px ${accentColor}40; background: #0b0c10; padding: 2rem 1.5rem; border-radius: 8px; font-family: var(--font-mono, monospace); color: #fff;">
                <div style="margin-bottom: 1rem; display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 50%; background: ${accentColor}15; border: 1px dashed ${accentColor};">
                    <span class="material-symbols-outlined" style="font-size: 28px; color: ${accentColor};">${icon}</span>
                </div>
                <h3 style="font-family: var(--font-headline); font-size: 1.2rem; font-weight: bold; margin-bottom: 0.75rem; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">${title}</h3>
                <p style="font-size: 0.82rem; color: var(--text-dim, #a9b7c6); margin-bottom: 1.5rem; line-height: 1.4; word-break: break-word;">${message}</p>
                <button id="btn-alert-ok" style="width: 100%; border: none; padding: 12px; font-weight: bold; font-family: var(--font-mono); font-size: 0.85rem; cursor: pointer; border-radius: 4px; background: ${accentColor}; color: #fff; box-shadow: 0 0 10px ${accentColor}40; transition: all 0.2s ease;">
                    DISMISS
                </button>
            </div>
        `;
        
        document.body.appendChild(alertModal);
        
        // Auto-focus OK button
        const okBtn = alertModal.querySelector('#btn-alert-ok');
        if (okBtn) {
            okBtn.focus();
            okBtn.onclick = () => {
                alertModal.remove();
            };
        }
        
        // Tap overlay to close (accessibility)
        alertModal.onclick = (e) => {
            if (e.target === alertModal) {
                alertModal.remove();
            }
        };
        
        console.log(`[Custom Alert] ${title}: ${message}`);
    };

    window.showToastNotification = function(message, duration = 2500) {
        const existingToast = document.getElementById('global-toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'global-toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: rgba(11, 12, 16, 0.95);
            border: 1px solid var(--primary, #00ffff);
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            color: #fff;
            padding: 10px 20px;
            border-radius: 24px;
            font-family: var(--font-mono, monospace);
            font-size: 0.85rem;
            font-weight: bold;
            letter-spacing: 0.5px;
            z-index: 999999;
            pointer-events: none;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        toast.innerHTML = `<span style="color: var(--primary, #00ffff);">✨</span> ${message}`;
        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
            setTimeout(() => toast.remove(), 350);
        }, duration);
    };

    // --- SMART ENGAGEMENT, 5-STAR RATING & PRO SHOWCASE ENGINE ---
    function getEngagementData() {
        const count = parseInt(window.safeStorage.getItem('soundengg_engagement_count') || '0', 10);
        const hasRated = window.safeStorage.getItem('soundengg_has_rated') === 'true';
        const lastRatingPrompt = parseInt(window.safeStorage.getItem('soundengg_last_rating_prompt') || '0', 10);
        const lastProPrompt = parseInt(window.safeStorage.getItem('soundengg_last_pro_prompt') || '0', 10);
        return { count, hasRated, lastRatingPrompt, lastProPrompt };
    }

    function recordEngagementEvent() {
        let { count } = getEngagementData();
        count += 1;
        window.safeStorage.setItem('soundengg_engagement_count', count.toString());
        console.log('[Engagement] Recorded active session event #' + count);
        checkSmartEngagementTriggers(count);
        return count;
    }

    function checkSmartEngagementTriggers(currentCount) {
        const { hasRated, lastRatingPrompt, lastProPrompt } = getEngagementData();

        // 1. Check 5-Star Rate & Review Prompt (Trigger on session 5, snooze for 10 sessions)
        if (!hasRated && currentCount >= 5 && (lastRatingPrompt === 0 || (currentCount - lastRatingPrompt >= 10))) {
            setTimeout(() => {
                window.triggerInAppRatingModal();
            }, 1200);
            return;
        }

        // 2. Check Pro Upgrade Showcase (Trigger on session 8 for free users, snooze for 10 sessions)
        if (!window.isPremiumActive() && currentCount >= 8 && (lastProPrompt === 0 || (currentCount - lastProPrompt >= 10))) {
            setTimeout(() => {
                const proModal = document.getElementById('pro-upgrade-modal');
                if (proModal) {
                    window.safeStorage.setItem('soundengg_last_pro_prompt', currentCount.toString());
                    window.openModal(proModal);
                }
            }, 1200);
        }
    }

    window.triggerInAppRatingModal = function() {
        const modal = document.getElementById('in-app-rating-modal');
        if (!modal) return;

        const currentCount = parseInt(window.safeStorage.getItem('soundengg_engagement_count') || '5', 10);
        window.safeStorage.setItem('soundengg_last_rating_prompt', currentCount.toString());
        window.openModal(modal);

        const btnRate = document.getElementById('btn-submit-app-rating');
        const btnLater = document.getElementById('btn-maybe-later-rating');
        const btnClose = document.getElementById('btn-close-rating-modal');
        const starsRow = document.getElementById('rating-stars-row');

        const handleRateAction = () => {
            window.safeStorage.setItem('soundengg_has_rated', 'true');
            window.closeModal(modal);
            if (typeof window.showToastNotification === 'function') {
                window.showToastNotification('Thank you for supporting SoundEngg! ❤️');
            }

            const isIOS = window.Capacitor?.getPlatform() === 'ios' || (typeof navigator !== 'undefined' && (navigator.platform === 'MacIntel' || /iPhone|iPad|iPod/.test(navigator.userAgent)));
            const isAndroid = window.Capacitor?.getPlatform() === 'android' || (typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent));

            if (isIOS) {
                // Direct to Apple App Store Write-Review Sheet
                window.location.href = 'itms-apps://apps.apple.com/app/id6758652430?action=write-review';
            } else if (isAndroid) {
                // Direct to Google Play Store App
                try {
                    window.location.href = 'market://details?id=com.soundengg.app';
                } catch (e) {
                    window.open('https://play.google.com/store/apps/details?id=com.soundengg.app', '_system');
                }
            } else {
                window.open('https://play.google.com/store/apps/details?id=com.soundengg.app', '_blank');
            }
        };

        if (btnRate) btnRate.onclick = handleRateAction;
        if (starsRow) starsRow.onclick = handleRateAction;

        const handleLater = () => {
            window.closeModal(modal);
        };

        if (btnLater) btnLater.onclick = handleLater;
        if (btnClose) btnClose.onclick = handleLater;
    };

    window.recordEngagementEvent = recordEngagementEvent;
    window.checkSmartEngagementTriggers = checkSmartEngagementTriggers;
})();

