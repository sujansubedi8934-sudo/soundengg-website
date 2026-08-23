const { app, BrowserWindow, shell, session, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('SoundEngg: RTA & Audio Utility');

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 868,
        minWidth: 1024,
        minHeight: 700,
        backgroundColor: '#090a0f',
        title: 'SoundEngg: RTA & Audio Utility - Live Sound Calculators & RTA',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'electron-preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
        }
    });

    // Auto-approve audio device permissions (Web Audio API / RTA mic access)
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            callback(true); // Always allow microphone / audio input for RTA analysis
        } else {
            callback(true);
        }
    });

    // Intercept external links and open in default web browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    // Load compiled www/app.html or root app.html
    const wwwAppPath = path.join(__dirname, 'www', 'app.html');
    if (fs.existsSync(wwwAppPath)) {
        mainWindow.loadFile(wwwAppPath);
    } else {
        mainWindow.loadFile(path.join(__dirname, 'app.html'));
    }

    // Set custom application menu with F11 Fullscreen support for FOH engineers
    const template = [
        {
            label: 'SoundEngg',
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen', accelerator: 'F11' }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'RTA Spectrogram Analyzer',
                    accelerator: 'CmdOrCtrl+1',
                    click: () => mainWindow.webContents.executeJavaScript("window.showView && window.showView('rta')")
                },
                {
                    label: 'Subwoofer Array Calculator',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => mainWindow.webContents.executeJavaScript("window.showView && window.showView('subcalc')")
                },
                {
                    label: 'Speaker Delay Calculator',
                    accelerator: 'CmdOrCtrl+3',
                    click: () => mainWindow.webContents.executeJavaScript("window.showView && window.showView('delay')")
                },
                {
                    label: 'Signal Generator',
                    accelerator: 'CmdOrCtrl+4',
                    click: () => mainWindow.webContents.executeJavaScript("window.showView && window.showView('siggen')")
                },
                {
                    label: 'Ear Training Room',
                    accelerator: 'CmdOrCtrl+5',
                    click: () => mainWindow.webContents.executeJavaScript("window.showView && window.showView('eartraining')")
                },
                { type: 'separator' },
                { role: 'toggleDevTools', accelerator: 'F12' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'SoundEngg Official Website',
                    click: () => shell.openExternal('https://www.soundengg.com')
                },
                {
                    label: 'Technical Blog & Audio Library',
                    click: () => shell.openExternal('https://www.soundengg.com/blog.html')
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
