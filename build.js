const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Obfuscation configuration for production deployment
const obfuscatorOptions = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: false,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['rc4'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
};

async function build() {
    console.log('Starting production obfuscation build...');
    const srcDir = __dirname;
    const distDir = path.join(__dirname, 'dist');

    // 1. Clean dist directory
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir);

    // Recursively copy files and obfuscate Javascript files on the fly
    function copyAndObfuscate(src, dest) {
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest);
            const files = fs.readdirSync(src);
            for (const file of files) {
                if ([
                    'node_modules', 
                    'dist', 
                    '.git', 
                    '.gemini', 
                    '.github', 
                    '.agents', 
                    'public',
                    'package.json',
                    'package-lock.json',
                    'vite.config.js',
                    'build.js'
                ].includes(file) || file.startsWith('vite.config.js.timestamp')) continue;
                copyAndObfuscate(path.join(src, file), path.join(dest, file));
            }
        } else {
            const ext = path.extname(src);
            const filename = path.basename(src);
            // Obfuscate all JS files except build script and sw.js
            if (ext === '.js' && filename !== 'build.js' && filename !== 'sw.js') {
                console.log(`Obfuscating: ${path.relative(srcDir, src)}`);
                const code = fs.readFileSync(src, 'utf8');
                try {
                    const result = JavaScriptObfuscator.obfuscate(code, obfuscatorOptions);
                    fs.writeFileSync(dest, result.getObfuscatedCode(), 'utf8');
                } catch (err) {
                    console.error(`Failed to obfuscate ${src}:`, err);
                    fs.copyFileSync(src, dest);
                }
            } else {
                fs.copyFileSync(src, dest);
            }
        }
    }

    // Start deep copy & obfuscate
    copyAndObfuscate(srcDir, distDir);

    // 2. Move public assets to dist root
    const publicDir = path.join(srcDir, 'public');
    if (fs.existsSync(publicDir)) {
        console.log('Copying public assets to dist root...');
        const publicFiles = fs.readdirSync(publicDir);
        for (const file of publicFiles) {
            const srcPath = path.join(publicDir, file);
            const destPath = path.join(distDir, file);
            if (fs.statSync(srcPath).isDirectory()) {
                fs.cpSync(srcPath, destPath, { recursive: true });
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    console.log('\nProduction build successfully compiled and obfuscated inside dist/ folder!');
}

build().catch(console.error);
