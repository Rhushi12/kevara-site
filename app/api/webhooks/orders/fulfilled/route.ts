import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/shopify-webhook-verify';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Webhook: orders/fulfilled
 * When an order is marked as fulfilled (shipped), this logs the fulfillment
 * and can be extended to trigger shipping notification emails or update
 * a tracking dashboard.
 */
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();

        const isValid = await verifyShopifyWebhook(req, rawBody);
        if (!isValid) {
            console.error("[Webhook:orders/fulfilled] Invalid HMAC signature");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const { name, email, fulfillments, line_items } = payload;

        console.log(`[Webhook:orders/fulfilled] Order ${name} fulfilled`);

        // Extract tracking information from the fulfillment
        const trackingInfo = fulfillments?.map((f: any) => ({
            trackingNumber: f.tracking_number || null,
            trackingUrl: f.tracking_url || null,
            trackingCompany: f.tracking_company || null,
            status: f.status,
            createdAt: f.created_at
        })) || [];

        // Store fulfillment event in Firestore for tracking dashboard
        await db.collection('order_fulfillments').add({
            orderName: name,
            customerEmail: email,
            trackingInfo,
            items: line_items?.map((li: any) => ({
                title: li.title,
                quantity: li.quantity,
                sku: li.sku
            })) || [],
            fulfilledAt: new Date().toISOString()
        });

        console.log(`[Webhook:orders/fulfilled] ✅ Fulfillment logged for order: ${name}`);

        // TODO: Send a custom shipping notification email here if desired
        // e.g., using Resend, SendGrid, or AWS SES

        return NextResponse.json({ status: "ok" });
    } catch (error: any) {
        console.error("[Webhook:orders/fulfilled] Error:", error.message);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
