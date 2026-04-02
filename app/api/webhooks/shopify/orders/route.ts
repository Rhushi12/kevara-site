import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase-admin';
import { sendOrderConfirmation } from '@/lib/whatsapp';
import { decrementStockForOrder } from '@/lib/inventory';

export const dynamic = 'force-dynamic';

/**
 * Validates the HMAC signature sent by Shopify in the webhook header.
 */
function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
    if (!hmacHeader) return false;
    
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[Webhook] Missing SHOPIFY_WEBHOOK_SECRET env variable');
        return false;
    }

    const generatedHash = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('base64');

    return generatedHash === hmacHeader;
}

/**
 * Normalizes a complex Shopify Order payload into a clean format for Firebase.
 */
function normalizeOrder(shopifyOrder: any) {
    const { 
        id, order_number, email, phone, 
        current_total_price, financial_status, fulfillment_status,
        customer, shipping_address, line_items, created_at
    } = shopifyOrder;

    return {
        shopifyOrderId: id.toString(),
        orderNumber: order_number,
        status: fulfillment_status || 'unfulfilled',
        financialStatus: financial_status,
        paymentStatus: financial_status === 'paid' ? 'Paid' : 'Pending',
        totalPrice: current_total_price,
        
        customerInfo: {
            email: email || customer?.email || '',
            phone: phone || shipping_address?.phone || customer?.phone || '',
            firstName: customer?.first_name || shipping_address?.first_name || '',
            lastName: customer?.last_name || shipping_address?.last_name || '',
        },
        
        shippingAddress: shipping_address ? {
            name: shipping_address.name,
            address1: shipping_address.address1,
            address2: shipping_address.address2 || '',
            city: shipping_address.city,
            state: shipping_address.province,
            zip: shipping_address.zip,
            country: shipping_address.country,
            phone: shipping_address.phone
        } : null,

        // Map line items to a simpler structure
        items: line_items?.map((item: any) => ({
            id: item.id?.toString(),
            productId: item.product_id?.toString() || '',
            variantId: item.variant_id?.toString() || '',
            title: item.title,
            variantTitle: item.variant_title || '',
            quantity: item.quantity,
            price: item.price,
            sku: item.sku || ''
        })) || [],

        // Delivery/Tracking info (filled later)
        courier: null,
        awbNumber: null,
        expectedDeliveryDate: null,
        trackingUrl: null,

        createdAt: created_at ? new Date(created_at).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
        const topic = req.headers.get('x-shopify-topic');

        // Verify the webhook is authentically from Shopify
        if (!verifyShopifyWebhook(rawBody, hmacHeader)) {
            console.error('[Webhook] Invalid HMAC signature');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const orderId = payload.id?.toString();

        if (!orderId) {
            return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
        }

        // Handle creations and fulfillments
        if (topic === 'orders/create' || topic === 'orders/updated' || topic === 'orders/fulfilled') {
            const normalizedOrder = normalizeOrder(payload);
            
            // Push to Firebase `orders` collection
            const orderRef = db.collection('orders').doc(orderId);
            
            // Using set with merge to create or update
            await orderRef.set(normalizedOrder, { merge: true });

            console.log(`[Webhook] ✅ Order ${normalizedOrder.orderNumber} successfully synced to Firebase`);

            // Decrement stock for each ordered item (non-blocking)
            if (topic === 'orders/create' && normalizedOrder.items?.length > 0) {
                decrementStockForOrder(
                    normalizedOrder.items.map((i: any) => ({
                        productId: i.productId,
                        variantId: i.variantId,
                        variantTitle: i.variantTitle,
                        title: i.title,
                        quantity: i.quantity || 1,
                        sku: i.sku,
                    }))
                ).catch(err => console.error('[Webhook] Stock decrement error (non-blocking):', err.message));
            }

            // Send WhatsApp order confirmation (non-blocking)
            if (topic === 'orders/create' && normalizedOrder.customerInfo?.phone) {
                const itemsSummary = normalizedOrder.items
                    .map((i: any) => `${i.title}${i.variantTitle ? ` (${i.variantTitle})` : ''} x${i.quantity}`)
                    .join(', ');
                const customerName = `${normalizedOrder.customerInfo.firstName} ${normalizedOrder.customerInfo.lastName}`.trim();

                sendOrderConfirmation(
                    normalizedOrder.customerInfo.phone,
                    customerName,
                    normalizedOrder.orderNumber,
                    itemsSummary,
                    `${normalizedOrder.totalPrice}`
                ).catch(err => console.error('[Webhook] WhatsApp notification error (non-blocking):', err.message));
            }

            return NextResponse.json({ success: true, message: `Synced order ${orderId}` });
        }

        // Topic not handled
        return NextResponse.json({ success: true, message: 'Ignored topic' });

    } catch (error: any) {
        console.error('[Webhook] Exception processing order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
