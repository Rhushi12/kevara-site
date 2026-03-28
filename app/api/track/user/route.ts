import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { trackDelhiveryShipment } from '@/lib/delhivery';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Query Firebase for all orders
        // Note: For production with thousands of orders, an index on customerInfo.email is recommended
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
        
        let userOrders = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((o: any) => o.customerInfo?.email?.toLowerCase() === email.toLowerCase());

        // Limit to most recent 20 for performance
        userOrders = userOrders.slice(0, 20);

        // Fetch live handling for active orders
        const enrichedOrders = await Promise.all(userOrders.map(async (order: any) => {
            let liveTracking = null;
            
            // Only fetch LIVE tracking if it has an AWB and isn't delivered/returned already
            // This prevents spamming Delhivery API
            if (order.awbNumber && order.courier?.toLowerCase() === 'delhivery') {
                if (order.status !== 'delivered' && order.status !== 'returned') {
                    const trackingResult = await trackDelhiveryShipment(order.awbNumber);
                    if (trackingResult.success) {
                        liveTracking = trackingResult;
                        
                        // Sync status to Firebase if changed
                        const delhiveryStatus = trackingResult.data?.status?.toLowerCase();
                        if (delhiveryStatus) {
                            let mappedStatus = order.status;
                            if (delhiveryStatus === 'delivered') {
                                mappedStatus = 'delivered';
                            } else if (delhiveryStatus === 'in transit' || delhiveryStatus === 'dispatched') {
                                mappedStatus = 'shipped';
                            } else if (delhiveryStatus === 'rto' || delhiveryStatus === 'returned') {
                                mappedStatus = 'returned';
                            }

                            if (mappedStatus !== order.status) {
                                await db.collection('orders').doc(order.id).update({
                                    status: mappedStatus,
                                    updatedAt: new Date().toISOString(),
                                });
                                order.status = mappedStatus;
                            }
                        }
                    }
                }
            }
            return { ...order, liveTracking };
        }));

        return NextResponse.json({ success: true, orders: enrichedOrders });
    } catch (error: any) {
        console.error('[TrackUser] Error:', error.message);
        return NextResponse.json({ error: 'Failed to look up user orders' }, { status: 500 });
    }
}
