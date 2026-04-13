import { auth, db } from '../lib/firebase-admin';
import admin from 'firebase-admin';

async function syncUsers() {
    console.log('Starting user sync from Auth to Firestore...');
    let nextPageToken;
    let count = 0;

    try {
        do {
            const listUsersResult = await auth.listUsers(1000, nextPageToken);
            nextPageToken = listUsersResult.pageToken;

            for (const userRecord of listUsersResult.users) {
                const userRef = db.collection('users').doc(userRecord.uid);
                const doc = await userRef.get();

                if (!doc.exists) {
                    console.log(`Adding missing user: ${userRecord.email} (${userRecord.uid})`);
                    
                    const createdAt = userRecord.metadata.creationTime 
                        ? admin.firestore.Timestamp.fromDate(new Date(userRecord.metadata.creationTime))
                        : admin.firestore.FieldValue.serverTimestamp();
                        
                    const lastLogin = userRecord.metadata.lastSignInTime
                        ? admin.firestore.Timestamp.fromDate(new Date(userRecord.metadata.lastSignInTime))
                        : admin.firestore.FieldValue.serverTimestamp();

                    await userRef.set({
                        uid: userRecord.uid,
                        email: userRecord.email || '',
                        displayName: userRecord.displayName || 'User',
                        photoURL: userRecord.photoURL || null,
                        createdAt: createdAt,
                        lastLogin: lastLogin,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    count++;
                } else {
                    console.log(`User already exists: ${userRecord.email}`);
                }
            }
        } while (nextPageToken);

        console.log(`Sync complete! Added ${count} missing users to Firestore.`);
    } catch (error) {
        console.error('Error syncing users:', error);
    }
}

syncUsers().then(() => process.exit(0));
