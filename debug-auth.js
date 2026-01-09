
const fs = require('fs');
const path = require('path');
const cwd = process.cwd();
const keyPath = path.join(cwd, 'serviceAccountKey.json');

console.log('--- Debug Auth Script ---');
console.log(`Current Working Directory: ${cwd}`);
console.log(`Expected Key Path: ${keyPath}`);

try {
    if (fs.existsSync(keyPath)) {
        console.log('File EXISTS.');
        const content = fs.readFileSync(keyPath, 'utf8');
        console.log(`File Size: ${content.length} bytes`);
        try {
            const json = JSON.parse(content);
            console.log('JSON Parse: SUCCESS');
            console.log(`Project ID: ${json.project_id}`);
            console.log(`Client Email: ${json.client_email}`);
        } catch (e) {
            console.error('JSON Parse: FAILED', e.message);
        }
    } else {
        console.error('File does NOT exist.');
        // List files in current dir
        console.log('Files in CWD:', fs.readdirSync(cwd));
    }
} catch (e) {
    console.error('File Access Error:', e.message);
}
console.log('--- End Debug ---');
