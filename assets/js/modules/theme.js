function setupThemeToggle() {
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');
    const btnMobile = document.getElementById('btn-mobile-theme-toggle');
    const mobileIcon = document.getElementById('mobile-theme-icon');
    const htmlEl = document.documentElement;

    const setLightMode = () => {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
        if (btnLight) btnLight.classList.add('active');
        if (btnDark) btnDark.classList.remove('active');
        if (mobileIcon) mobileIcon.textContent = 'dark_mode';
        try { localStorage.setItem('soundengg-color-theme', 'light'); } catch (e) {}
    };

    const setDarkMode = () => {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        if (btnDark) btnDark.classList.add('active');
        if (btnLight) btnLight.classList.remove('active');
        if (mobileIcon) mobileIcon.textContent = 'light_mode';
        try { localStorage.setItem('soundengg-color-theme', 'dark'); } catch (e) {}
    };

    if (btnLight) btnLight.addEventListener('click', setLightMode);
    if (btnDark) btnDark.addEventListener('click', setDarkMode);

    if (btnMobile) {
        btnMobile.addEventListener('click', () => {
            if (htmlEl.classList.contains('light')) {
                setDarkMode();
            } else {
                setLightMode();
            }
        });
    }
}

function applyAutoTheme() {
    const htmlEl = document.documentElement;
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');
    const mobileIcon = document.getElementById('mobile-theme-icon');

    // Check localStorage first
    let theme = null;
    try {
        theme = localStorage.getItem('soundengg-color-theme');
    } catch (e) {}

    if (!theme) {
        // Fallback to time-of-day
        const hour = new Date().getHours();
        theme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
    }

    if (theme === 'light') {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
        if (btnLight) btnLight.classList.add('active');
        if (btnDark) btnDark.classList.remove('active');
        if (mobileIcon) mobileIcon.textContent = 'dark_mode';
    } else {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        if (btnDark) btnDark.classList.add('active');
        if (btnLight) btnLight.classList.remove('active');
        if (mobileIcon) mobileIcon.textContent = 'light_mode';
    }
}

window.setupThemeToggle = setupThemeToggle;
window.applyAutoTheme = applyAutoTheme;
