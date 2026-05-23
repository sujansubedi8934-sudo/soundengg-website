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
    };

    const setDarkMode = () => {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        if (btnDark) btnDark.classList.add('active');
        if (btnLight) btnLight.classList.remove('active');
        if (mobileIcon) mobileIcon.textContent = 'light_mode';
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
    const hour = new Date().getHours();
    const isDayTime = hour >= 6 && hour < 18; // Day: 6 AM to 6 PM
    
    const htmlEl = document.documentElement;
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');
    const mobileIcon = document.getElementById('mobile-theme-icon');

    if (isDayTime) {
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
