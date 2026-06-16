const fs = require('fs');
const path = require('path');

const cssFilePath = path.join(__dirname, '..', 'assets', 'css', 'styles.css');
const outputDir = path.join(__dirname, '..', 'assets', 'css');

console.log('📖 Reading styles.css...');
const cssContent = fs.readFileSync(cssFilePath, 'utf8');

// Split content by lines (handling both LF and CRLF)
const lines = cssContent.split(/\r?\n/);
console.log(`📊 Loaded ${lines.length} lines of CSS.`);

const targets = {
    'variables.css': [
        [1, 126]
    ],
    'layout.css': [
        [127, 865]
    ],
    'modals.css': [
        [866, 1023],
        [1527, 1612],
        [2835, 3050],
        [4711, 5125],
        [5596, 5643]
    ],
    'components.css': [
        [1024, 1252],
        [1613, 1705]
    ],
    'tools.css': [
        [1253, 1526],
        [2207, 2374],
        [2375, 2597],
        [2598, 2834],
        [3051, 3236],
        [3237, 3303]
    ],
    'pages.css': [
        [1706, 1961],
        [1962, 2206],
        [3733, 4710],
        [5644, 5726]
    ],
    'responsive.css': [
        [3304, 3331],
        [3332, 3732],
        [5126, 5328],
        [5329, 5595]
    ]
};

// Process each output file
let totalProcessedLines = 0;
for (const [filename, ranges] of Object.entries(targets)) {
    let fileLines = [];
    ranges.forEach(([start, end]) => {
        // Javascript slice is [start-1, end)
        const rangeLines = lines.slice(start - 1, end);
        fileLines = fileLines.concat(rangeLines);
        totalProcessedLines += rangeLines.length;
        console.log(`  - Slice for ${filename}: lines ${start} to ${end} (${rangeLines.length} lines)`);
    });

    const fileContent = fileLines.join('\n');
    const destPath = path.join(outputDir, filename);
    fs.writeFileSync(destPath, fileContent, 'utf8');
    console.log(`💾 Saved ${filename} (${fileLines.length} lines).`);
}

console.log(`🧮 Total processed lines: ${totalProcessedLines} / ${lines.length}`);

// Write bootsheet imports back to styles.css
const importBootsheet = `@import url('variables.css');
@import url('layout.css');
@import url('components.css');
@import url('modals.css');
@import url('tools.css');
@import url('pages.css');
@import url('responsive.css');
`;

fs.writeFileSync(cssFilePath, importBootsheet, 'utf8');
console.log('🔄 Overwrote styles.css with import bootsheet.');
console.log('✨ CSS splitting completed successfully!');
