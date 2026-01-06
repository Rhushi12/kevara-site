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
        // No service account - try applicationDefault or initialize without credentials
        try {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kevara-9bc71',
            });
            console.log('[Firebase Admin] Initialized with application default credentials');
        } catch (error) {
            console.warn('[Firebase Admin] No credentials available, Firestore operations may fail');
            // Initialize without credentials - will fail on actual Firestore operations
            admin.initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kevara-9bc71',
            });
        }
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
