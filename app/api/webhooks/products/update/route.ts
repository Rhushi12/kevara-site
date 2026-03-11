import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/shopify-webhook-verify';
import { shopifyFetch } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

/**
 * Webhook: products/update
 * When a product is edited on the Shopify Admin side, this updates the
 * corresponding custom_product metaobject to keep data in sync.
 */
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();

        const isValid = await verifyShopifyWebhook(req, rawBody);
        if (!isValid) {
            console.error("[Webhook:products/update] Invalid HMAC signature");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const { handle, title, body_html, status, variants } = payload;

        if (!handle) {
            return NextResponse.json({ error: "No handle in payload" }, { status: 400 });
        }

        console.log(`[Webhook:products/update] Received update for: ${handle}`);

        // Check if this handle corresponds to a custom_product metaobject
        const query = `
            query getMetaobjectByHandle($handle: MetaobjectHandleInput!) {
                metaobjectByHandle(handle: $handle) {
                    id
                    fields { key value }
                }
            }
        `;

        const result = await shopifyFetch(query, {
            handle: { type: "custom_product", handle }
        });

        if (!result.metaobjectByHandle) {
            // Not a shadow product — ignore
            console.log(`[Webhook:products/update] No metaobject found for handle: ${handle}. Ignoring.`);
            return NextResponse.json({ status: "ignored" });
        }

        // Update the metaobject with the new title and description
        const fields: { key: string; value: string }[] = [];
        if (title) fields.push({ key: "title", value: title });
        if (body_html !== undefined) fields.push({ key: "description", value: body_html || "" });

        // Sync the first variant's price
        if (variants && variants.length > 0) {
            const price = variants[0].price;
            if (price) fields.push({ key: "price", value: price });
        }

        if (fields.length > 0) {
            const upsertMutation = `
                mutation upsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
                    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
                        metaobject { id }
                        userErrors { field message }
                    }
                }
            `;

            await shopifyFetch(upsertMutation, {
                handle: { type: "custom_product", handle },
                metaobject: { fields }
            });

            console.log(`[Webhook:products/update] ✅ Metaobject updated for: ${handle}`);
        }

        return NextResponse.json({ status: "ok" });
    } catch (error: any) {
        console.error("[Webhook:products/update] Error:", error.message);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
