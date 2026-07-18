const fs = require('fs');
const path = require('path');

// Target file paths
const paths = {
    versionJson: path.join(__dirname, '..', 'app-version.json'),
    androidGradle: path.join(__dirname, '..', 'android', 'app', 'build.gradle'),
    iosPbxproj: path.join(__dirname, '..', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj')
};

// Help helper
function printHelp() {
    console.log(`
SoundEngg Version Bumping Utility
=================================
Usage: node dev-tools/bump-version.js [options]

Options:
  --type <patch|minor|major>  Increment version name by type (default: patch)
  --name <version_string>     Set the version name directly (e.g., 1.2.0)
  --code <version_code>       Set the version code directly (e.g., 22)
  --help                      Print this help menu
`);
    process.exit(0);
}

// Parse args
const args = process.argv.slice(2);
let type = 'patch';
let customName = null;
let customCode = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') {
        printHelp();
    } else if (args[i] === '--type') {
        type = args[i + 1];
        i++;
    } else if (args[i] === '--name') {
        customName = args[i + 1];
        i++;
    } else if (args[i] === '--code') {
        customCode = parseInt(args[i + 1], 10);
        i++;
    }
}

// 1. Read app-version.json (Source of truth)
if (!fs.existsSync(paths.versionJson)) {
    console.error(`Error: app-version.json not found at ${paths.versionJson}`);
    process.exit(1);
}

const versionData = JSON.parse(fs.readFileSync(paths.versionJson, 'utf8'));
const oldCode = versionData.latestVersionCode;
const oldName = versionData.latestVersionName;

// Calculate new code
const newCode = customCode !== null ? customCode : oldCode + 1;

// Calculate new name
let newName = oldName;
if (customName !== null) {
    newName = customName;
} else {
    // Parse semantic versioning: major.minor.patch
    const parts = oldName.split('.').map(p => parseInt(p, 10));
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
        if (type === 'major') {
            parts[0] += 1;
            parts[1] = 0;
            parts[2] = 0;
        } else if (type === 'minor') {
            parts[1] += 1;
            parts[2] = 0;
        } else {
            // default: patch
            parts[2] += 1;
        }
        newName = parts.join('.');
    } else {
        console.warn(`Warning: Could not parse '${oldName}' as semantic version. Leaving version name unchanged.`);
    }
}

console.log('--- Version Bump Summary ---');
console.log(`Version Code: ${oldCode} -> ${newCode}`);
console.log(`Version Name: ${oldName} -> ${newName}`);
console.log('----------------------------');

// 2. Write to app-version.json
versionData.latestVersionCode = newCode;
versionData.latestVersionName = newName;
fs.writeFileSync(paths.versionJson, JSON.stringify(versionData, null, 2) + '\n', 'utf8');
console.log('✓ Updated app-version.json');

// 3. Write to android/app/build.gradle
if (fs.existsSync(paths.androidGradle)) {
    let gradleContent = fs.readFileSync(paths.androidGradle, 'utf8');
    
    // Replace versionCode
    const originalGradle = gradleContent;
    gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
    // Replace versionName
    gradleContent = gradleContent.replace(/versionName\s+"[^"]+"/, `versionName "${newName}"`);
    
    if (originalGradle !== gradleContent) {
        fs.writeFileSync(paths.androidGradle, gradleContent, 'utf8');
        console.log('✓ Updated android/app/build.gradle');
    } else {
        console.warn('⚠️ Warning: No version changes made to build.gradle (targets not found or unchanged)');
    }
} else {
    console.warn(`⚠️ Warning: build.gradle not found at ${paths.androidGradle}. Skipping.`);
}

// 4. Write to ios/App/App.xcodeproj/project.pbxproj
if (fs.existsSync(paths.iosPbxproj)) {
    let pbxprojContent = fs.readFileSync(paths.iosPbxproj, 'utf8');
    const originalPbxproj = pbxprojContent;
    
    // Replace CURRENT_PROJECT_VERSION (can appear multiple times for Debug/Release)
    const versionCodeRegex = /CURRENT_PROJECT_VERSION\s*=\s*\d+;/g;
    pbxprojContent = pbxprojContent.replace(versionCodeRegex, `CURRENT_PROJECT_VERSION = ${newCode};`);
    
    // Replace MARKETING_VERSION
    const versionNameRegex = /MARKETING_VERSION\s*=\s*[^;]+;/g;
    pbxprojContent = pbxprojContent.replace(versionNameRegex, `MARKETING_VERSION = ${newName};`);
    
    if (originalPbxproj !== pbxprojContent) {
        fs.writeFileSync(paths.iosPbxproj, pbxprojContent, 'utf8');
        console.log('✓ Updated ios/App/App.xcodeproj/project.pbxproj');
    } else {
        console.warn('⚠️ Warning: No version changes made to project.pbxproj (targets not found or unchanged)');
    }
} else {
    console.warn(`⚠️ Warning: project.pbxproj not found at ${paths.iosPbxproj}. Skipping.`);
}

console.log('\nSuccess! Version bump completed successfully.');
