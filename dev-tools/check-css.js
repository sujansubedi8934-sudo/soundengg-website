const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'assets', 'css');
if (!fs.existsSync(cssDir)) {
    console.error(`CSS directory not found at ${cssDir}`);
    process.exit(1);
}

const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

cssFiles.forEach(file => {
    const filePath = path.join(cssDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check comments
    let openCommentIndex = -1;
    let inComment = false;
    for (let i = 0; i < content.length; i++) {
        if (!inComment && content[i] === '/' && content[i+1] === '*') {
            inComment = true;
            openCommentIndex = i;
            i++;
        } else if (inComment && content[i] === '*' && content[i+1] === '/') {
            inComment = false;
            i++;
        }
    }
    if (inComment) {
        console.error(`❌ Syntax Error in ${file}: Unclosed comment starting at character index ${openCommentIndex}`);
    }

    // Check braces
    let braceCount = 0;
    let lastOpenLine = 0;
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
        // Strip comments for brace counting
        let cleanLine = line.replace(/\/\*[\s\S]*?\*\//g, '');
        
        for (let char of cleanLine) {
            if (char === '{') {
                braceCount++;
                lastOpenLine = index + 1;
            } else if (char === '}') {
                braceCount--;
                if (braceCount < 0) {
                    console.error(`❌ Syntax Error in ${file}: Extra closing brace '}' on line ${index + 1}`);
                    braceCount = 0; // reset
                }
            }
        }
    });

    if (braceCount > 0) {
        console.error(`❌ Syntax Error in ${file}: Unclosed brace '{' (count=${braceCount}), last opened around line ${lastOpenLine}`);
    } else {
        console.log(`✓ ${file}: No unclosed braces or comments detected.`);
    }
});
