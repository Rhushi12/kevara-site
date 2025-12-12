
import fs from 'fs';
import path from 'path';
import { savePageData } from './lib/save-page-data';

// Load env vars from .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log("Loaded .env.local");
    } else {
        console.log(".env.local not found");
    }
} catch (e) {
    console.log("Error loading .env.local", e);
}

async function debug() {
    console.log("Attempting to save test page...");
    try {
        const testData = {
            sections: [
                {
                    id: "test-section",
                    type: "hero_slider",
                    settings: {
                        slides: []
                    }
                }
            ]
        };

        // Test with a random slug
        const slug = `debug-test-${Date.now()}`;
        const result = await savePageData(slug, testData, "page_content");
        console.log("Save successful!", result);
    } catch (error: any) {
        console.error("Save FAILED:");
        console.error(error);
        if (error.userErrors) {
            console.error("User Errors:", JSON.stringify(error.userErrors, null, 2));
        }
    }
}

debug();
