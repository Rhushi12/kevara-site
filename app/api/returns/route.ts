import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST: Submit a return/exchange request for an order.
 * Stores it in Firestore `return_requests` collection.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderNumber, orderId, customerEmail, customerName, reason, items, type } = body;

        if (!orderNumber || !customerEmail || !reason) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const docRef = await db.collection('return_requests').add({
            orderNumber,
            orderId: orderId || '',
            customerEmail,
            customerName: customerName || '',
            reason,
            items: items || [],
            type: type || 'return', // 'return' or 'exchange'
            status: 'pending',
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            requestId: docRef.id,
            message: "Your return request has been submitted. We'll get back to you within 2–3 business days."
        });
    } catch (error: any) {
        console.error("[ReturnRequest] Error:", error.message);
        return NextResponse.json({ error: "Failed to submit return request" }, { status: 500 });
    }
}

/**
 * GET: Fetch all return requests (admin) or by email (customer)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        let query: FirebaseFirestore.Query = db.collection('return_requests')
            .orderBy('createdAt', 'desc')
            .limit(50);

        if (email) {
            query = db.collection('return_requests')
                .where('customerEmail', '==', email)
                .orderBy('createdAt', 'desc')
                .limit(20);
        }

        const snapshot = await query.get();
        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ success: true, requests });
    } catch (error: any) {
        console.error("[ReturnRequest] GET Error:", error.message);
        return NextResponse.json({ error: "Failed to fetch return requests" }, { status: 500 });
    }
}
