
const fs = require('fs');
const path = require('path');

const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
const envPath = path.join(process.cwd(), '.env.local');

console.log('--- Setup Env Script ---');

try {
    if (fs.existsSync(keyPath)) {
        // 1. Read and minify key
        const rawKey = fs.readFileSync(keyPath, 'utf8');
        const jsonKey = JSON.parse(rawKey); // Verify valid JSON
        const minifiedKey = JSON.stringify(jsonKey);

        console.log('Successfully read and validated serviceAccountKey.json');

        // 2. Read .env.local
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // 3. Check existence
        if (envContent.includes('FIREBASE_SERVICE_ACCOUNT_KEY=')) {
            console.log('FIREBASE_SERVICE_ACCOUNT_KEY already exists in .env.local');
            // Optional: Replace it if needed, but for now assuming if exists it might be wrong or right.
            // Let's replace it to be sure.
            const lines = envContent.split('\n');
            const newLines = lines.map(line => {
                if (line.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY=')) {
                    return `FIREBASE_SERVICE_ACCOUNT_KEY='${minifiedKey}'`;
                }
                return line;
            });
            fs.writeFileSync(envPath, newLines.join('\n'));
            console.log('Updated existing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local');

        } else {
            // Append
            const newContent = envContent + `\nFIREBASE_SERVICE_ACCOUNT_KEY='${minifiedKey}'\n`;
            fs.writeFileSync(envPath, newContent);
            console.log('Appended FIREBASE_SERVICE_ACCOUNT_KEY to .env.local');
        }

    } else {
        console.error('CRITICAL: serviceAccountKey.json not found in root.');
        process.exit(1);
    }
} catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
}

console.log('--- Success ---');
