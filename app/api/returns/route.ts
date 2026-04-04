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

        const allRequests: any[] = [];

        // Query 'return_requests' collection (from the simple POST endpoint)
        try {
            let query1: FirebaseFirestore.Query = db.collection('return_requests')
                .orderBy('createdAt', 'desc')
                .limit(50);

            if (email) {
                query1 = db.collection('return_requests')
                    .where('customerEmail', '==', email)
                    .orderBy('createdAt', 'desc')
                    .limit(20);
            }

            const snapshot1 = await query1.get();
            snapshot1.docs.forEach(doc => {
                allRequests.push({ id: doc.id, ...doc.data() });
            });
        } catch (e: any) {
            // Index may not exist yet — skip gracefully
            console.warn("[ReturnRequest] return_requests query failed (index may be missing):", e.message);
        }

        // Also query 'returns' collection (from the authenticated request endpoint)
        try {
            let query2: FirebaseFirestore.Query = db.collection('returns')
                .orderBy('createdAt', 'desc')
                .limit(50);

            if (email) {
                query2 = db.collection('returns')
                    .where('userEmail', '==', email)
                    .orderBy('createdAt', 'desc')
                    .limit(20);
            }

            const snapshot2 = await query2.get();
            snapshot2.docs.forEach(doc => {
                allRequests.push({ id: doc.id, ...doc.data() });
            });
        } catch (e: any) {
            console.warn("[ReturnRequest] returns query failed (index may be missing):", e.message);
        }

        // Sort combined results by createdAt descending
        allRequests.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
        });

        return NextResponse.json({ success: true, requests: allRequests });
    } catch (error: any) {
        console.error("[ReturnRequest] GET Error:", error.message);
        return NextResponse.json({ success: true, requests: [] });
    }
}
