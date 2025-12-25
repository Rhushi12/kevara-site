import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for server-side use
// This is used by API routes that need to access Firestore

if (!admin.apps.length) {
    // Check if we have service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
    } else {
        // Fallback: Use default credentials (works in some environments like Cloud Functions)
        // Or use the client-side config for development
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kevara-9bc71',
        });
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
