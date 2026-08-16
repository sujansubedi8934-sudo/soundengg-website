const fs = require('fs');

let mainJs = fs.readFileSync('assets/js/main.js', 'utf8');
const admobStart = mainJs.indexOf('// GLOBAL ADMOB CONFIGURATION');
const admobEnd = mainJs.indexOf('// --- SIGNAL GENERATOR CORE LOGIC ---');

if (admobStart !== -1 && admobEnd !== -1) {
    const admobCode = mainJs.substring(admobStart, admobEnd);
    mainJs = mainJs.slice(0, admobStart) + mainJs.slice(admobEnd);
    fs.writeFileSync('assets/js/main.js', mainJs);

    let adManagerJs = fs.readFileSync('assets/js/utils/adManager.js', 'utf8');
    // Prepend the AdMob configuration to the top of adManager.js (below the header comment)
    adManagerJs = adManagerJs.replace(
        'function initAdManager() {',
        admobCode + '\nfunction initAdManager() {'
    );
    fs.writeFileSync('assets/js/utils/adManager.js', adManagerJs);
    console.log('AdMob logic moved to adManager.js successfully!');
} else {
    console.log('Could not find AdMob block in main.js');
}
