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
        console.error('[PageViews API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to track page view', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

