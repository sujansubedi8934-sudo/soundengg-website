window.isUserPro = false; // Global source of truth for subscription

window.isPremiumActive = function(featureKey) {
    if (window.isUserPro) return true;
    
    // Check specific feature unlock
    if (featureKey) {
        const tempFeatureUntil = safeStorage.getItem(`soundengg_temp_pro_until_${featureKey}`);
        if (tempFeatureUntil && Date.now() < parseInt(tempFeatureUntil, 10)) {
            return true;
        }
    }
    
    // Fallback/General: check global temp pro
    const tempProUntil = safeStorage.getItem('soundengg_temp_pro_until');
    if (tempProUntil && Date.now() < parseInt(tempProUntil, 10)) {
        return true;
    }
    
    return false;
};

window.isBlogUnlocked = function(articleId) {
    if (window.isUserPro) return true;
    const globalUntil = safeStorage.getItem('soundengg_temp_pro_until');
    if (globalUntil && Date.now() < parseInt(globalUntil, 10)) return true;
    const blogUntil = safeStorage.getItem(`soundengg_temp_pro_until_blog_${articleId}`);
    if (blogUntil && Date.now() < parseInt(blogUntil, 10)) return true;
    return false;
};

window.updatePremiumUI = function() {
    const isAnyPro = window.isUserPro || 
                     ['spectrogram', 'snapshots', 'mic_calibration', 'ear_training'].some(k => window.isPremiumActive(k));
    
    // Sync Pro navigation badge
    const profileTierBadge = document.getElementById('profile-tier-badge');
    const btnProfileUpgrade = document.getElementById('btn-profile-upgrade');
    if (profileTierBadge) {
        if (window.isUserPro) {
            profileTierBadge.textContent = 'PRO TIER';
            profileTierBadge.className = 'tier-badge pro';
        } else if (isAnyPro) {
            // Check if it's the global full-pro active, or a specific feature unlock
            const hasGlobalPro = safeStorage.getItem('soundengg_temp_pro_until') && Date.now() < parseInt(safeStorage.getItem('soundengg_temp_pro_until'), 10);
            if (hasGlobalPro) {
                profileTierBadge.textContent = '🎁 TEMP PRO (ALL)';
            } else {
                const activeFeatures = ['spectrogram', 'snapshots', 'mic_calibration', 'ear_training']
                    .filter(k => {
                        const tempFeatureUntil = safeStorage.getItem(`soundengg_temp_pro_until_${k}`);
                        return tempFeatureUntil && Date.now() < parseInt(tempFeatureUntil, 10);
                    });
                if (activeFeatures.length === 1) {
                    const featureNames = {
                        'spectrogram': 'SPECTRO',
                        'snapshots': 'SNAPSHOTS',
                        'mic_calibration': 'MIC CAL',
                        'ear_training': 'EAR TRAIN'
                    };
                    profileTierBadge.textContent = `🎁 TEMP PRO (${featureNames[activeFeatures[0]] || 'FEATURE'})`;
                } else if (activeFeatures.length > 1) {
                    profileTierBadge.textContent = `🎁 TEMP PRO (${activeFeatures.length} FEATURES)`;
                } else {
                    profileTierBadge.textContent = '🎁 TEMP PRO';
                }
            }
            profileTierBadge.className = 'tier-badge pro';
        } else {
            profileTierBadge.textContent = 'FREE TIER';
            profileTierBadge.className = 'tier-badge free';
        }
    }
    if (btnProfileUpgrade) {
        btnProfileUpgrade.style.display = window.isUserPro ? 'none' : 'inline-block';
    }

    // Hide locks/overlays
    const isFullProActive = window.isUserPro || (safeStorage.getItem('soundengg_temp_pro_until') && Date.now() < parseInt(safeStorage.getItem('soundengg_temp_pro_until'), 10));
    if (isFullProActive) {
        const adOverlay = document.getElementById('ad-manager-overlay');
        const adLockModal = document.getElementById('ad-lock-modal');
        const appContent = document.querySelector('.main-content');
        const sidebar = document.querySelector('.top-bar');
        
        if (adOverlay) adOverlay.classList.add('hidden');
        if (adLockModal) adLockModal.classList.add('hidden');
        if (appContent) appContent.classList.remove('app-blurred');
        if (sidebar) sidebar.classList.remove('app-blurred');
        
        // Collapse all AdSense slots completely
        document.querySelectorAll('.adsbygoogle, .ad-banner-bottom, .ad-placeholder, #bottom-sponsor-banner').forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none';
        });

        // Hide native mobile bottom banner
        if (typeof window.hideNativeBannerAd === 'function') {
            window.hideNativeBannerAd();
        }
    } else {
        // If not Pro and on native mobile and unlocked, show native bottom banner
        if (window.isNativeMobile && window.isNativeMobile()) {
            const unlockedUntil = safeStorage.getItem('tools_unlocked_until');
            const now = Date.now();
            if (unlockedUntil && now < parseInt(unlockedUntil, 10)) {
                if (typeof window.showNativeBannerAd === 'function') {
                    window.showNativeBannerAd();
                }
            } else {
                if (typeof window.hideNativeBannerAd === 'function') {
                    window.hideNativeBannerAd();
                }
            }
        }
    }

    // Sync specific modules
    if (typeof syncProLockUI === 'function') {
        syncProLockUI();
    }
    if (typeof renderSnapshotSlots === 'function') {
        renderSnapshotSlots();
    }
};
