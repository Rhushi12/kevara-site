import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Public Order Tracking API
 * POST: Looks up an order by order number + email for secure customer access.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderNumber, email } = body;

        if (!orderNumber || !email) {
            return NextResponse.json({ error: 'Order number and email are required' }, { status: 400 });
        }

        // Query Firebase for the order
        const snapshot = await db.collection('orders')
            .where('orderNumber', '==', parseInt(orderNumber))
            .limit(5)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ error: 'Order not found. Please check your order number.' }, { status: 404 });
        }

        // Find the order that matches the email
        const matchingDoc = snapshot.docs.find(doc => {
            const data = doc.data();
            return data.customerInfo?.email?.toLowerCase() === email.toLowerCase();
        });

        if (!matchingDoc) {
            return NextResponse.json({ error: 'No order found matching that email and order number.' }, { status: 404 });
        }

        const order = { id: matchingDoc.id, ...matchingDoc.data() };

        return NextResponse.json({ success: true, order });
    } catch (error: any) {
        console.error('[Track] Error:', error.message);
        return NextResponse.json({ error: 'Failed to look up order' }, { status: 500 });
    }
}
