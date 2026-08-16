const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find the latest archive in ~/Library/Developer/Xcode/Archives/
function findLatestArchive() {
    const archivesRoot = path.join(process.env.HOME, 'Library/Developer/Xcode/Archives');
    if (!fs.existsSync(archivesRoot)) {
        throw new Error('Archives directory does not exist: ' + archivesRoot);
    }

    // List all files/folders recursively up to level 3 (Archives / YYYY-MM-DD / xxx.xcarchive)
    const dates = fs.readdirSync(archivesRoot).filter(f => {
        const fullPath = path.join(archivesRoot, f);
        return fs.statSync(fullPath).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(f);
    });

    if (dates.length === 0) {
        throw new Error('No date folders found in Archives directory.');
    }

    // Sort dates descending
    dates.sort((a, b) => b.localeCompare(a));

    for (const dateFolder of dates) {
        const datePath = path.join(archivesRoot, dateFolder);
        const archives = fs.readdirSync(datePath).filter(f => f.endsWith('.xcarchive'));
        if (archives.length > 0) {
            // Sort by mtime descending
            archives.sort((a, b) => {
                const statA = fs.statSync(path.join(datePath, a));
                const statB = fs.statSync(path.join(datePath, b));
                return statB.mtimeMs - statA.mtimeMs;
            });
            const latestArchive = path.join(datePath, archives[0]);
            console.log(`Found latest archive: ${latestArchive}`);
            return latestArchive;
        }
    }

    throw new Error('No .xcarchive found.');
}

// Modify an Info.plist file using plutil
function patchPlist(plistPath) {
    console.log(`Patching Plist: ${plistPath}`);
    const commands = [
        `plutil -replace DTPlatformVersion -string "26.0" "${plistPath}"`,
        `plutil -replace DTSDKName -string "iphoneos26.0" "${plistPath}"`,
        `plutil -replace DTXcode -string "2600" "${plistPath}"`,
        `plutil -replace DTXcodeBuild -string "17A324" "${plistPath}"`,
        `plutil -replace BuildMachineOSBuild -string "24G231" "${plistPath}"`
    ];

    for (const cmd of commands) {
        try {
            execSync(cmd, { stdio: 'ignore' });
        } catch (e) {
            console.warn(`Warning: Failed to set some key in ${plistPath}: ${e.message}`);
        }
    }
}

// Check and patch a binary's LC_BUILD_VERSION using vtool
function patchBinary(binaryPath) {
    console.log(`Checking binary: ${binaryPath}`);
    let otoolOutput;
    try {
        otoolOutput = execSync(`otool -l "${binaryPath}"`).toString();
    } catch (e) {
        console.error(`Failed to run otool on ${binaryPath}`);
        return;
    }

    // We look for LC_BUILD_VERSION or LC_VERSION_MIN_IPHONEOS
    const buildVersionRegex = /cmd\s+LC_BUILD_VERSION[\s\S]*?minos\s+(\d+\.\d+)[\s\S]*?sdk\s+(\d+\.\d+)/;
    const match = otoolOutput.match(buildVersionRegex);

    if (match) {
        const minos = match[1];
        const sdk = match[2];
        console.log(`Found LC_BUILD_VERSION: minos=${minos}, sdk=${sdk}`);

        if (sdk !== '26.0') {
            console.log(`Patching SDK version to 26.0 for ${binaryPath}...`);
            const tempPatched = binaryPath + '_patched';
            const vtoolCmd = `vtool -set-build-version ios ${minos} 26.0 -output "${tempPatched}" "${binaryPath}"`;
            try {
                execSync(vtoolCmd);
                fs.renameSync(tempPatched, binaryPath);
                console.log(`Successfully patched binary!`);
            } catch (e) {
                console.error(`Failed to patch binary using vtool: ${e.message}`);
            }
        } else {
            console.log(`Binary already has SDK version 26.0.`);
        }
    } else {
        // Check for LC_VERSION_MIN_IPHONEOS
        const minVersionRegex = /cmd\s+LC_VERSION_MIN_IPHONEOS[\s\S]*?minos\s+(\d+\.\d+)[\s\S]*?sdk\s+(\d+\.\d+)/;
        const matchMin = otoolOutput.match(minVersionRegex);
        if (matchMin) {
            const minos = matchMin[1];
            const sdk = matchMin[2];
            console.log(`Found LC_VERSION_MIN_IPHONEOS: minos=${minos}, sdk=${sdk}`);

            if (sdk !== '26.0') {
                console.log(`Patching min version SDK to 26.0 for ${binaryPath}...`);
                const tempPatched = binaryPath + '_patched';
                const vtoolCmd = `vtool -set-version-min ios ${minos} 26.0 -output "${tempPatched}" "${binaryPath}"`;
                try {
                    execSync(vtoolCmd);
                    fs.renameSync(tempPatched, binaryPath);
                    console.log(`Successfully patched binary!`);
                } catch (e) {
                    console.error(`Failed to patch binary using vtool: ${e.message}`);
                }
            } else {
                console.log(`Binary already has SDK version 26.0.`);
            }
        } else {
            console.log(`No LC_BUILD_VERSION or LC_VERSION_MIN_IPHONEOS found in ${binaryPath}.`);
        }
    }
}

// Find all Mach-O binaries in the directory (excluding symlinks and non-mach-o files)
function findMachOBinaries(dir) {
    const binaries = [];
    function traverse(currentDir) {
        const files = fs.readdirSync(currentDir);
        for (const file of files) {
            const fullPath = path.join(currentDir, file);
            const stat = fs.lstatSync(fullPath);
            if (stat.isSymbolicLink()) continue;
            if (stat.isDirectory()) {
                traverse(fullPath);
            } else if (stat.isFile()) {
                // Check if file is a Mach-O binary using file utility
                try {
                    const fileType = execSync(`file "${fullPath}"`).toString();
                    if (fileType.includes('Mach-O')) {
                        binaries.push(fullPath);
                    }
                } catch (e) {
                    // Ignore errors
                }
            }
        }
    }
    traverse(dir);
    return binaries;
}

// Find all Info.plist files
function findPlists(dir) {
    const plists = [];
    function traverse(currentDir) {
        const files = fs.readdirSync(currentDir);
        for (const file of files) {
            const fullPath = path.join(currentDir, file);
            const stat = fs.lstatSync(fullPath);
            if (stat.isSymbolicLink()) continue;
            if (stat.isDirectory()) {
                traverse(fullPath);
            } else if (stat.isFile()) {
                if (file === 'Info.plist') {
                    plists.push(fullPath);
                }
            }
        }
    }
    traverse(dir);
    return plists;
}

function main() {
    const archivePath = findLatestArchive();
    const appDir = path.join(archivePath, 'Products/Applications/App.app');

    if (!fs.existsSync(appDir)) {
        throw new Error(`App directory not found inside archive: ${appDir}`);
    }

    console.log(`App directory: ${appDir}`);

    // 1. Patch all Info.plist files
    const plists = findPlists(appDir);
    for (const plist of plists) {
        patchPlist(plist);
    }

    // 1.5. Patch Build Number and Version String if provided as command-line arguments
    const args = process.argv.slice(2);
    const buildNumber = args[0];
    const versionString = args[1];

    if (buildNumber) {
        console.log(`Setting build number to ${buildNumber}...`);
        
        // Patch root Info.plist of the archive
        const archivePlist = path.join(archivePath, 'Info.plist');
        if (fs.existsSync(archivePlist)) {
            try {
                execSync(`plutil -replace ApplicationProperties.CFBundleVersion -string "${buildNumber}" "${archivePlist}"`);
            } catch (e) {
                console.warn(`Failed to set CFBundleVersion in archive plist: ${e.message}`);
            }
        }
        
        // Patch main App Info.plist
        const appPlist = path.join(appDir, 'Info.plist');
        if (fs.existsSync(appPlist)) {
            try {
                execSync(`plutil -replace CFBundleVersion -string "${buildNumber}" "${appPlist}"`);
            } catch (e) {
                console.warn(`Failed to set CFBundleVersion in app plist: ${e.message}`);
            }
        }
    }

    if (versionString) {
        console.log(`Setting version string to ${versionString}...`);
        
        // Patch root Info.plist of the archive
        const archivePlist = path.join(archivePath, 'Info.plist');
        if (fs.existsSync(archivePlist)) {
            try {
                execSync(`plutil -replace ApplicationProperties.CFBundleShortVersionString -string "${versionString}" "${archivePlist}"`);
            } catch (e) {
                console.warn(`Failed to set CFBundleShortVersionString in archive plist: ${e.message}`);
            }
        }
        
        // Patch main App Info.plist
        const appPlist = path.join(appDir, 'Info.plist');
        if (fs.existsSync(appPlist)) {
            try {
                execSync(`plutil -replace CFBundleShortVersionString -string "${versionString}" "${appPlist}"`);
            } catch (e) {
                console.warn(`Failed to set CFBundleShortVersionString in app plist: ${e.message}`);
            }
        }
    }

    // 2. Patch all Mach-O binaries
    const binaries = findMachOBinaries(appDir);
    console.log(`Found Mach-O binaries:`, binaries);
    for (const bin of binaries) {
        patchBinary(bin);
    }

    // 3. Re-sign everything
    const signingIdentity = "Apple Development: Sujan Subedi (LY7HV5D52V)";
    console.log(`Re-signing all components in the bundle...`);

    // First sign all frameworks in Frameworks/
    const frameworksDir = path.join(appDir, 'Frameworks');
    if (fs.existsSync(frameworksDir)) {
        const frameworks = fs.readdirSync(frameworksDir).filter(f => f.endsWith('.framework'));
        for (const framework of frameworks) {
            const frameworkPath = path.join(frameworksDir, framework);
            console.log(`Re-signing framework: ${frameworkPath}`);
            const codesignCmd = `codesign --force --sign "${signingIdentity}" --timestamp=none "${frameworkPath}"`;
            execSync(codesignCmd, { stdio: 'inherit' });
        }
    }

    // Now extract app entitlements and sign the main App.app
    console.log(`Extracting entitlements from App.app...`);
    const entitlementsFile = path.join(__dirname, 'entitlements.plist');
    try {
        execSync(`codesign -d --entitlements - --xml "${appDir}" | grep -v "Executable=" > "${entitlementsFile}"`);
    } catch (e) {
        console.error(`Failed to extract entitlements: ${e.message}`);
    }

    console.log(`Re-signing App.app...`);
    let codesignAppCmd = `codesign --force --sign "${signingIdentity}" --timestamp=none --generate-entitlement-der `;
    if (fs.existsSync(entitlementsFile)) {
        codesignAppCmd += `--entitlements "${entitlementsFile}" `;
    }
    codesignAppCmd += `"${appDir}"`;

    try {
        execSync(codesignAppCmd, { stdio: 'inherit' });
        console.log(`Successfully re-signed App.app!`);
    } catch (e) {
        console.error(`Failed to re-sign App.app: ${e.message}`);
    }

    // Verify signature
    console.log(`Verifying app signature...`);
    try {
        const verifyOutput = execSync(`codesign --verify --verbose "${appDir}"`).toString();
        console.log(`Verification: ${verifyOutput || 'OK'}`);
    } catch (e) {
        console.error(`Verification failed: ${e.message}`);
    }

    console.log(`ALL DONE!`);
}

main();
