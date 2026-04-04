import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { createDelhiveryShipment, trackDelhiveryShipment } from '@/lib/delhivery';
import { requireAdmin } from '@/lib/auth';
import { sendShipmentNotification } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * Admin Fulfillment API
 * POST: Creates a Delhivery shipment for a Firebase order. Generates AWB and updates the order.
 * GET:  Fetches live tracking status for an order's AWB from Delhivery.
 */
export async function POST(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        const body = await req.json();
        const { orderId, weight } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // Fetch the order from Firebase
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = orderDoc.data()!;

        // Validate shipping address
        if (!order.shippingAddress) {
            return NextResponse.json({ error: 'Order has no shipping address' }, { status: 400 });
        }

        // Build product description from line items
        const productDesc = order.items
            ?.map((item: any) => `${item.title} x${item.quantity}`)
            .join(', ')
            .substring(0, 200) || 'Kevara Order';

        // Create Delhivery shipment
        const result = await createDelhiveryShipment({
            orderNumber: order.orderNumber?.toString() || orderId,
            customerName: order.shippingAddress.name || `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim(),
            phone: order.shippingAddress.phone || order.customerInfo?.phone || '',
            address1: order.shippingAddress.address1,
            address2: order.shippingAddress.address2 || '',
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            pin: order.shippingAddress.zip,
            paymentMode: order.financialStatus === 'paid' ? 'Prepaid' : 'COD',
            totalAmount: parseFloat(order.totalPrice || '0'),
            productDescription: productDesc,
            weight: weight || 500, // default 500g
            quantity: order.items?.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) || 1,
        });

        if (!result.success) {
            return NextResponse.json({
                error: `Delhivery error: ${result.error}`,
                rawResponse: result.rawResponse,
            }, { status: 422 });
        }

        // Update the Firebase order with AWB and tracking info
        const trackingUrl = `https://www.delhivery.com/track/package/${result.waybill}`;

        await db.collection('orders').doc(orderId).update({
            status: 'shipped',
            courier: 'Delhivery',
            awbNumber: result.waybill,
            trackingUrl,
            updatedAt: new Date().toISOString(),
        });

        // Send WhatsApp shipping notification (non-blocking)
        const customerPhone = order.shippingAddress?.phone || order.customerInfo?.phone;
        if (customerPhone) {
            const customerName = order.shippingAddress?.name
                || `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim();

            sendShipmentNotification(
                customerPhone,
                customerName,
                order.orderNumber?.toString() || orderId,
                'Delhivery',
                result.waybill!,
                trackingUrl
            ).catch(err => console.error('[Fulfillment] WhatsApp notification error (non-blocking):', err.message));
        }

        return NextResponse.json({
            success: true,
            waybill: result.waybill,
            trackingUrl,
            message: `Shipment created! AWB: ${result.waybill}`,
        });

    } catch (error: any) {
        console.error('[Fulfillment] Error:', error.message);
        return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const waybill = searchParams.get('waybill');

        if (!waybill) {
            return NextResponse.json({ error: 'Missing waybill parameter' }, { status: 400 });
        }

        const tracking = await trackDelhiveryShipment(waybill);

        if (!tracking.success) {
            return NextResponse.json({ error: tracking.error }, { status: 404 });
        }

        return NextResponse.json({ success: true, tracking });

    } catch (error: any) {
        console.error('[Fulfillment] Tracking error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch tracking' }, { status: 500 });
    }
}
