import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Reference to today's document
        const viewRef = db.collection('page_views').doc(today);

        // Increment the view count atomically using Admin SDK
        await viewRef.set({
            date: today,
            count: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        return NextResponse.json({ success: true, date: today });
    } catch (error) {
        console.error('[PageViews API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to track page view' },
            { status: 500 }
        );
    }
}
