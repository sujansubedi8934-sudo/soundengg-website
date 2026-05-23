const fs = require('fs');

let rtaJs = fs.readFileSync('assets/js/components/rtaEngine.js', 'utf8');

const startStr = '// Helper to dynamically show native banner ads (Mitigating bottom viewport overlay)';
const endStr = '// Wait for WebAudio initialization user gesture';

const startIdx = rtaJs.indexOf(startStr);
const endIdx = rtaJs.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    let adCode = rtaJs.substring(startIdx, endIdx);
    
    // Ensure the adCode ends before the next comment properly
    const lastClosingBrace = adCode.lastIndexOf('};');
    adCode = adCode.substring(0, lastClosingBrace + 2);
    
    // Remove it from rtaEngine.js
    rtaJs = rtaJs.replace(adCode, '');
    fs.writeFileSync('assets/js/components/rtaEngine.js', rtaJs);
    
    // Add it to adManager.js right before function initAdManager()
    let adManagerJs = fs.readFileSync('assets/js/utils/adManager.js', 'utf8');
    adManagerJs = adManagerJs.replace('function initAdManager() {', adCode + '\n\nfunction initAdManager() {');
    fs.writeFileSync('assets/js/utils/adManager.js', adManagerJs);
    
    console.log('Moved showNativeBannerAd to adManager.js!');
} else {
    console.log('Could not find bounds in rtaEngine.js');
}
