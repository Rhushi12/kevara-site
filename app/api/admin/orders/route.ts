import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Admin Orders API
 * GET: Fetches all orders from Firebase `orders` collection.
 * PATCH: Updates order status/tracking for a specific order.
 */
export async function GET() {
    try {
        const snapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ success: true, orders });
    } catch (error: any) {
        console.error('[Admin Orders] Fetch error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { orderId, status, courier, awbNumber, trackingUrl, expectedDeliveryDate } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        const updateData: any = { updatedAt: new Date().toISOString() };
        if (status) updateData.status = status;
        if (courier) updateData.courier = courier;
        if (awbNumber) updateData.awbNumber = awbNumber;
        if (trackingUrl) updateData.trackingUrl = trackingUrl;
        if (expectedDeliveryDate) updateData.expectedDeliveryDate = expectedDeliveryDate;

        await db.collection('orders').doc(orderId).update(updateData);

        return NextResponse.json({ success: true, message: `Order ${orderId} updated` });
    } catch (error: any) {
        console.error('[Admin Orders] Update error:', error.message);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
