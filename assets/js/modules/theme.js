function setupThemeToggle() {
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');
    const btnMobile = document.getElementById('btn-mobile-theme-toggle');
    const mobileIcon = document.getElementById('mobile-theme-icon');
    const btnMenu = document.getElementById('btn-menu-theme-toggle');
    const menuIcon = document.getElementById('menu-theme-icon');
    const menuText = document.getElementById('menu-theme-text');
    const htmlEl = document.documentElement;

    const setLightMode = () => {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
        if (btnLight) btnLight.classList.add('active');
        if (btnDark) btnDark.classList.remove('active');
        if (mobileIcon) mobileIcon.textContent = 'dark_mode';
        if (menuIcon) menuIcon.textContent = 'dark_mode';
        if (menuText) menuText.textContent = 'DARK MODE';
        try { localStorage.setItem('soundengg-color-theme', 'light'); } catch (e) {}
    };

    const setDarkMode = () => {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        if (btnDark) btnDark.classList.add('active');
        if (btnLight) btnLight.classList.remove('active');
        if (mobileIcon) mobileIcon.textContent = 'light_mode';
        if (menuIcon) menuIcon.textContent = 'light_mode';
        if (menuText) menuText.textContent = 'LIGHT MODE';
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

    if (btnMenu) {
        btnMenu.addEventListener('click', () => {
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
    const menuIcon = document.getElementById('menu-theme-icon');
    const menuText = document.getElementById('menu-theme-text');

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
        if (menuIcon) menuIcon.textContent = 'dark_mode';
        if (menuText) menuText.textContent = 'DARK MODE';
    } else {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        if (btnDark) btnDark.classList.add('active');
        if (btnLight) btnLight.classList.remove('active');
        if (mobileIcon) mobileIcon.textContent = 'light_mode';
        if (menuIcon) menuIcon.textContent = 'light_mode';
        if (menuText) menuText.textContent = 'LIGHT MODE';
    }
}

window.setupThemeToggle = setupThemeToggle;
window.applyAutoTheme = applyAutoTheme;
