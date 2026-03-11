import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/shopify-webhook-verify';
import { shopifyFetch } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

/**
 * Webhook: products/delete
 * When a shadow product is deleted from Shopify Admin,
 * this cleans up the corresponding metaobject to prevent orphaned data.
 */
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();

        const isValid = await verifyShopifyWebhook(req, rawBody);
        if (!isValid) {
            console.error("[Webhook:products/delete] Invalid HMAC signature");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const { handle } = payload;

        if (!handle) {
            return NextResponse.json({ error: "No handle in payload" }, { status: 400 });
        }

        console.log(`[Webhook:products/delete] Product deleted: ${handle}`);

        // Check if a metaobject exists for this handle
        const query = `
            query getMetaobjectByHandle($handle: MetaobjectHandleInput!) {
                metaobjectByHandle(handle: $handle) {
                    id
                }
            }
        `;

        const result = await shopifyFetch(query, {
            handle: { type: "custom_product", handle }
        });

        if (result.metaobjectByHandle?.id) {
            // Delete the orphaned metaobject
            const deleteMutation = `
                mutation deleteMetaobject($id: ID!) {
                    metaobjectDelete(id: $id) {
                        deletedId
                        userErrors { field message }
                    }
                }
            `;

            await shopifyFetch(deleteMutation, { id: result.metaobjectByHandle.id });
            console.log(`[Webhook:products/delete] ✅ Metaobject cleaned up for: ${handle}`);
        } else {
            console.log(`[Webhook:products/delete] No metaobject found for: ${handle}. Nothing to clean up.`);
        }

        return NextResponse.json({ status: "ok" });
    } catch (error: any) {
        console.error("[Webhook:products/delete] Error:", error.message);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
