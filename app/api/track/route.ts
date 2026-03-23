import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { trackDelhiveryShipment } from '@/lib/delhivery';

export const dynamic = 'force-dynamic';

/**
 * Public Order Tracking API
 * POST: Looks up an order by order number + email.
 *       If the order has an AWB from Delhivery, it also fetches
 *       live tracking data directly from Delhivery's API so the
 *       customer sees real-time scan updates without admin intervention.
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

        const order: any = { id: matchingDoc.id, ...matchingDoc.data() };

        // If order has an AWB (Delhivery shipment), fetch live tracking
        let liveTracking = null;
        if (order.awbNumber && order.courier?.toLowerCase() === 'delhivery') {
            const trackingResult = await trackDelhiveryShipment(order.awbNumber);
            if (trackingResult.success) {
                liveTracking = trackingResult;

                // Auto-update the order status in Firebase based on Delhivery's status
                const delhiveryStatus = trackingResult.status?.toLowerCase();
                let mappedStatus = order.status;

                if (delhiveryStatus === 'delivered') {
                    mappedStatus = 'delivered';
                } else if (delhiveryStatus === 'in transit' || delhiveryStatus === 'dispatched') {
                    mappedStatus = 'shipped';
                } else if (delhiveryStatus === 'rto' || delhiveryStatus === 'returned') {
                    mappedStatus = 'returned';
                }

                // Only update if status changed
                if (mappedStatus !== order.status) {
                    await db.collection('orders').doc(order.id).update({
                        status: mappedStatus,
                        updatedAt: new Date().toISOString(),
                    });
                    order.status = mappedStatus;
                }
            }
        }

        return NextResponse.json({ success: true, order, liveTracking });
    } catch (error: any) {
        console.error('[Track] Error:', error.message);
        return NextResponse.json({ error: 'Failed to look up order' }, { status: 500 });
    }
}
