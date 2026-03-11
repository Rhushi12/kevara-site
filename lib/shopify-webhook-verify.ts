import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || '';

/**
 * Verifies the HMAC-SHA256 signature of a Shopify webhook request.
 */
export async function verifyShopifyWebhook(req: NextRequest, rawBody: string): Promise<boolean> {
    if (!SHOPIFY_WEBHOOK_SECRET) {
        console.warn("[Webhook] No SHOPIFY_WEBHOOK_SECRET set — skipping verification in dev.");
        return true;
    }

    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    if (!hmacHeader) return false;

    const generatedHash = crypto
        .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
        .update(rawBody, 'utf8')
        .digest('base64');

    return crypto.timingSafeEqual(
        Buffer.from(generatedHash),
        Buffer.from(hmacHeader)
    );
}
