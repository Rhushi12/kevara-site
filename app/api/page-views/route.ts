import { NextRequest, NextResponse } from 'next/server';
import admin, { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Reference to today's document
        const viewRef = db.collection('page_views').doc(today);

        // Increment the view count atomically using Admin SDK
        await viewRef.set({
            date: today,
            count: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return NextResponse.json({ success: true, date: today });
    } catch (error) {
        // Log the error but return success to not break user experience
        console.error('[PageViews API] Error:', error);
        // Return success anyway - page view tracking shouldn't break the site
        return NextResponse.json({
            success: true,
            skipped: true,
            reason: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}



