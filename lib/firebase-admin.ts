import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for server-side use
// This is used by API routes that need to access Firestore

if (!admin.apps.length) {
    // Check if we have service account credentials
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id,
            });
            console.log('[Firebase Admin] Initialized with service account');
        } catch (error) {
            console.error('[Firebase Admin] Failed to parse service account:', error);
            // Initialize without credentials - will fail on actual Firestore operations
            admin.initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kevara-9bc71',
            });
        }
    } else {
        // Fallback: Check for serviceAccountKey.json file in root (common for local dev)
        try {
            // Dynamically require fs and path to avoid build issues if this file is somehow referenced in client
            // proper separation should prevent this, but safety first.
            const fs = require('fs');
            const path = require('path');
            const cwd = process.cwd();
            const keyPath = path.join(cwd, 'serviceAccountKey.json');

            console.log(`[Firebase Admin] CWD: ${cwd}`);
            console.log(`[Firebase Admin] Looking for key at: ${keyPath}`);

            if (fs.existsSync(keyPath)) {
                console.log('[Firebase Admin] Found serviceAccountKey.json!');
                const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                });
                console.log('[Firebase Admin] Initialized with local serviceAccountKey.json');
            } else {
                console.error(`[Firebase Admin] Key file NOT found at: ${keyPath}`);
                // Check if it's in a parent directory (sometimes helpful in monorepos or different run contexts)
                const parentKeyPath = path.join(cwd, '..', 'serviceAccountKey.json');
                console.log(`[Firebase Admin] Also checking parent directory at: ${parentKeyPath}`);
                if (fs.existsSync(parentKeyPath)) {
                    console.log('[Firebase Admin] Found key in parent directory!');
                    const serviceAccount = JSON.parse(fs.readFileSync(parentKeyPath, 'utf8'));
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                        projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    });
                    console.log('[Firebase Admin] Initialized with local serviceAccountKey.json from parent directory');
                } else {
                    // No file - try applicationDefault
                    console.log('[Firebase Admin] No Service Account Key found. Trying Application Default Credentials...');
                    admin.initializeApp({
                        credential: admin.credential.applicationDefault(),
                        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kevara-9bc71',
                    });
                }
            }
        } catch (error) {
            console.warn('[Firebase Admin] Failed to initialize with file or ADC:', error);
            // Last resort: Initialize without credentials
            admin.initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kevara-9bc71',
            });
        }
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
