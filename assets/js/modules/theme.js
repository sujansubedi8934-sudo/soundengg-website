function getTimeBasedPeriod() {
    const hour = new Date().getHours();
    // Day time: 6:00 AM (06:00) to 5:59 PM (17:59) -> 'day' (Light Mode)
    // Night time: 6:00 PM (18:00) to 5:59 AM (05:59) -> 'night' (Dark Mode)
    return (hour >= 6 && hour < 18) ? 'day' : 'night';
}

function getTimeBasedTheme() {
    return getTimeBasedPeriod() === 'day' ? 'light' : 'dark';
}

function applyThemeClassAndUI(theme) {
    const htmlEl = document.documentElement;
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');
    const mobileIcon = document.getElementById('mobile-theme-icon');
    const menuIcon = document.getElementById('menu-theme-icon');
    const menuText = document.getElementById('menu-theme-text');

    if (theme === 'light') {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
        if (document.body) {
            document.body.classList.add('light');
            document.body.classList.remove('dark');
        }
        if (btnLight) btnLight.classList.add('active');
        if (btnDark) btnDark.classList.remove('active');
        if (mobileIcon) mobileIcon.textContent = 'dark_mode';
        if (menuIcon) menuIcon.textContent = 'dark_mode';
        if (menuText) menuText.textContent = 'LIGHT MODE';
    } else {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        if (document.body) {
            document.body.classList.add('dark');
            document.body.classList.remove('light');
        }
        if (btnDark) btnDark.classList.add('active');
        if (btnLight) btnLight.classList.remove('active');
        if (mobileIcon) mobileIcon.textContent = 'light_mode';
        if (menuIcon) menuIcon.textContent = 'light_mode';
        if (menuText) menuText.textContent = 'DARK MODE';
    }

    if (typeof window.syncRtaIdleState === 'function') {
        window.syncRtaIdleState();
    }
}

function resolveEffectiveTheme() {
    const currentPeriod = getTimeBasedPeriod();
    const autoTheme = currentPeriod === 'day' ? 'light' : 'dark';
    try {
        const overridePeriod = localStorage.getItem('soundengg-theme-override-period');
        const overrideTheme = localStorage.getItem('soundengg-theme-override-val');
        const overrideDate = localStorage.getItem('soundengg-theme-override-date');
        const userTheme = localStorage.getItem('soundengg-user-theme');
        const todayStr = new Date().toDateString();

        // 1. Explicit user preference persists across pages
        if (userTheme === 'light' || userTheme === 'dark') {
            return userTheme;
        }

        // 2. Day-window override
        if (overridePeriod === currentPeriod && overrideDate === todayStr && (overrideTheme === 'light' || overrideTheme === 'dark')) {
            return overrideTheme;
        }
    } catch (e) {}
    return autoTheme;
}

function setManualThemeOverride(targetTheme) {
    const currentPeriod = getTimeBasedPeriod();
    const todayStr = new Date().toDateString();
    try {
        localStorage.setItem('soundengg-theme-override-period', currentPeriod);
        localStorage.setItem('soundengg-theme-override-val', targetTheme);
        localStorage.setItem('soundengg-theme-override-date', todayStr);
        localStorage.setItem('soundengg-user-theme', targetTheme);
        localStorage.setItem('theme', targetTheme);
    } catch (e) {}
    applyThemeClassAndUI(targetTheme);
}

function setupThemeToggle() {
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');
    const btnMobile = document.getElementById('btn-mobile-theme-toggle');
    const btnMenu = document.getElementById('btn-menu-theme-toggle');
    const htmlEl = document.documentElement;

    if (btnLight && !btnLight._themeBound) {
        btnLight._themeBound = true;
        btnLight.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setManualThemeOverride('light');
        });
    }

    if (btnDark && !btnDark._themeBound) {
        btnDark._themeBound = true;
        btnDark.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setManualThemeOverride('dark');
        });
    }

    // Attach to any theme-toggle pill containers
    const toggleContainers = document.querySelectorAll('.theme-toggle');
    toggleContainers.forEach(container => {
        if (!container._themeBound) {
            container._themeBound = true;
            container.addEventListener('click', (e) => {
                if (e.target.closest('#btn-light')) {
                    e.preventDefault();
                    e.stopPropagation();
                    setManualThemeOverride('light');
                } else if (e.target.closest('#btn-dark')) {
                    e.preventDefault();
                    e.stopPropagation();
                    setManualThemeOverride('dark');
                }
            });
        }
    });

    if (btnMobile && !btnMobile._themeBound) {
        btnMobile._themeBound = true;
        btnMobile.addEventListener('click', (e) => {
            e.preventDefault();
            const isLight = htmlEl.classList.contains('light');
            setManualThemeOverride(isLight ? 'dark' : 'light');
        });
    }

    if (btnMenu && !btnMenu._themeBound) {
        btnMenu._themeBound = true;
        btnMenu.addEventListener('click', (e) => {
            e.preventDefault();
            const isLight = htmlEl.classList.contains('light');
            setManualThemeOverride(isLight ? 'dark' : 'light');
        });
    }

    // Periodically check every 30 seconds and on app resume
    if (!window._soundenggThemeTimer) {
        window._soundenggThemeTimer = setInterval(() => {
            applyAutoTheme();
        }, 30000);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                applyAutoTheme();
            }
        });
    }
}

function applyAutoTheme() {
    const isDesktopElectron = (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.isDesktop) ||
                              (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('Electron'));
    if (isDesktopElectron) {
        applyThemeClassAndUI('dark');
        return;
    }

    const effectiveTheme = resolveEffectiveTheme();
    applyThemeClassAndUI(effectiveTheme);
}

// Global exposure
window.setupThemeToggle = setupThemeToggle;
window.applyAutoTheme = applyAutoTheme;
window.setManualThemeOverride = setManualThemeOverride;

// Self-initialize on DOM ready
function initSoundEnggTheme() {
    applyAutoTheme();
    setupThemeToggle();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSoundEnggTheme);
} else {
    initSoundEnggTheme();
}

// Cross-tab theme synchronization
window.addEventListener('storage', (e) => {
    if (e.key === 'soundengg-user-theme' || e.key === 'soundengg-theme-override-val') {
        applyAutoTheme();
    }
});
