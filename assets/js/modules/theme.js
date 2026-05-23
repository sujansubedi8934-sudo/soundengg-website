function setupThemeToggle() {
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');
    const htmlEl = document.documentElement;

    if (!btnLight || !btnDark) return;

    btnLight.addEventListener('click', () => {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
        btnLight.classList.add('active');
        btnDark.classList.remove('active');
    });

    btnDark.addEventListener('click', () => {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        btnDark.classList.add('active');
        btnLight.classList.remove('active');
    });
}

function applyAutoTheme() {
    const hour = new Date().getHours();
    const isDayTime = hour >= 6 && hour < 18; // Day: 6 AM to 6 PM
    
    const htmlEl = document.documentElement;
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');

    if (!btnLight || !btnDark) return;

    if (isDayTime) {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
        btnLight.classList.add('active');
        btnDark.classList.remove('active');
    } else {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        btnDark.classList.add('active');
        btnLight.classList.remove('active');
    }
}

window.setupThemeToggle = setupThemeToggle;
window.applyAutoTheme = applyAutoTheme;
