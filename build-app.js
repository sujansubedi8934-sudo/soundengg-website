const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

const filesToCopy = [
    'index.html',
    'app.html',
    'pro.html',
    'blog.html',
    'privacy.html',
    'terms.html',
    'palm6bd854hde9.html',
    'beta.html',
    'manifest.json',
    'service-worker.js',
    'app-version.json',
    'ads.txt',
    'app-ads.txt',
    'robots.txt',
    'sitemap.xml'
];

// List of folders to copy recursively
const foldersToCopy = [
    'assets'
];

function deleteFolderRecursive(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // recurse
                deleteFolderRecursive(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(directoryPath);
    }
}

function copyFileSync(source, target) {
    let targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
    let files = [];

    // Check if folder needs to be created or clean
    const targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Copy
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach((file) => {
            const curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}

try {
    console.log('🧹 Cleaning existing www folder...');
    deleteFolderRecursive(destDir);

    console.log('📁 Creating www directory...');
    fs.mkdirSync(destDir, { recursive: true });

    console.log('📝 Copying root files...');
    filesToCopy.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        if (fs.existsSync(srcPath)) {
            copyFileSync(srcPath, destPath);
            console.log(`  - Copied ${file}`);
        } else {
            console.warn(`  - Warning: file ${file} does not exist.`);
        }
    });

    console.log('📂 Copying assets recursively...');
    foldersToCopy.forEach(folder => {
        const srcPath = path.join(srcDir, folder);
        if (fs.existsSync(srcPath)) {
            copyFolderRecursiveSync(srcPath, destDir);
            console.log(`  - Copied ${folder}/ recursively`);
        } else {
            console.warn(`  - Warning: folder ${folder} does not exist.`);
        }
    });

    console.log('🌐 Generating static blog posts for SEO & AdSense...');
    require('./generate-static-blog.js');

    console.log('✅ App bundle build completed successfully inside /www!');
} catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
}
