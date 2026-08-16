const fs = require('fs');
const crypto = require('crypto');

// ==========================================
// ⚙️ CONFIGURATION: Fill in your values here
// ==========================================
const KEY_ID = '83LDBX5HX4'; // e.g. 'ABC123XYZ8'
const P8_PATH = '/Users/sujansubedi/Downloads/AuthKey_83LDBX5HX4.p8'; // e.g. '/Users/sujan/Downloads/AuthKey_ABC123XYZ8.p8'

const TEAM_ID = 'NXCNY3ZVL6';
const SERVICES_ID = 'com.soundengg.app.sid';
// ==========================================

function base64url(buf) {
    return buf.toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function generateJWT() {
    if (KEY_ID === 'YOUR_KEY_ID_HERE' || P8_PATH === 'PATH_TO_YOUR_P8_FILE_HERE') {
        console.error('❌ Error: Please open this script and configure your KEY_ID and P8_PATH values first.');
        process.exit(1);
    }

    if (!fs.existsSync(P8_PATH)) {
        console.error(`❌ Error: Private key file not found at: ${P8_PATH}`);
        process.exit(1);
    }

    const privateKey = fs.readFileSync(P8_PATH, 'utf8');

    // 1. JWT Header
    const header = {
        alg: 'ES256',
        kid: KEY_ID
    };

    // 2. JWT Payload (Valid for 180 days / ~6 months maximum)
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: TEAM_ID,
        iat: now,
        exp: now + (180 * 24 * 60 * 60), // 180 days
        aud: 'https://appleid.apple.com',
        sub: SERVICES_ID
    };

    const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
    const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
    const tokenInput = `${headerB64}.${payloadB64}`;

    try {
        // 3. Sign using SHA-256 and ES256 private key
        const sign = crypto.createSign('RSA-SHA256'); // Will use ES256 dynamically based on key
        const signature = crypto.sign('sha256', Buffer.from(tokenInput), privateKey);

        // Convert DER format signature to IEEE P1363 (Raw R+S) format for JWT
        let rOffset = 4;
        let rLen = signature[3];
        if (signature[rOffset] === 0x00) {
            rOffset++;
            rLen--;
        }
        const r = signature.slice(rOffset, rOffset + rLen);

        let sOffset = rOffset + rLen + 2;
        let sLen = signature[sOffset - 1];
        if (signature[sOffset] === 0x00) {
            sOffset++;
            sLen--;
        }
        const s = signature.slice(sOffset, sOffset + sLen);

        const rPad = Buffer.alloc(32);
        r.copy(rPad, 32 - r.length);

        const sPad = Buffer.alloc(32);
        s.copy(sPad, 32 - s.length);

        const rawSignature = Buffer.concat([rPad, sPad]);
        const signatureB64 = base64url(rawSignature);

        const jwt = `${tokenInput}.${signatureB64}`;
        
        console.log('\n=========================================');
        console.log('✅ APPLE CLIENT SECRET GENERATED SUCCESSFULLY!');
        console.log('=========================================\n');
        console.log('Copy the JWT key below and paste it into the "Secret Key" input in Supabase:\n');
        console.log(jwt);
        console.log('\n=========================================');

    } catch (err) {
        console.error('❌ Signing failed. Please check if your key ID or .p8 file is correct.', err);
    }
}

generateJWT();
