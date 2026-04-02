import { NextResponse } from 'next/server';
import { storefrontFetch } from '@/lib/shopify-storefront';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * Checkout Creation API Route
 * 
 * Receives cart items from the frontend CartDrawer, resolves real Shopify
 * Variant GIDs from shadow products via the Storefront API, then creates
 * a Shopify checkout session and returns the redirect URL.
 */

interface CartItemPayload {
    merchandiseId: string; // Mock variant ID or real GID
    quantity: number;
    handle?: string;       // The Metaobject/Shadow Product handle
    variantTitle?: string; // e.g. "M / Blue"
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, discountCode, phone } = body as { items: CartItemPayload[]; discountCode?: string; phone?: string };

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        // 1. Resolve real Storefront Variant GIDs for each cart item
        const lineItems: { variantId: string; quantity: number }[] = [];

        for (const item of items) {
            let variantId: string | null = null;

            // If it's already a real GID, use it directly
            if (item.merchandiseId.startsWith('gid://shopify/ProductVariant/')) {
                variantId = item.merchandiseId;
            }
            // Otherwise, resolve via the Storefront API using the product handle
            else if (item.handle) {
                variantId = await resolveVariantGid(item.handle, item.variantTitle);
            }

            if (!variantId) {
                console.error(`[Checkout] Could not resolve variant for: ${item.handle || item.merchandiseId}`);
                return NextResponse.json({
                    error: `Could not find product variant for "${item.handle}". The product may still be syncing.`,
                }, { status: 400 });
            }

            lineItems.push({ variantId, quantity: item.quantity });
        }

        console.log("[Checkout] Resolved line items:", lineItems);

        // 2. Create cart via Storefront Cart API (replaces deprecated checkoutCreate)
        let checkoutBody: any;
        try {
            const result = await storefrontFetch({
                query: `
                    mutation cartCreate($input: CartInput!) {
                        cartCreate(input: $input) {
                            cart {
                                id
                                checkoutUrl
                                discountCodes {
                                    applicable
                                    code
                                }
                                lines(first: 10) {
                                    edges {
                                        node {
                                            merchandise {
                                                ... on ProductVariant {
                                                    title
                                                }
                                            }
                                            quantity
                                        }
                                    }
                                }
                            }
                            userErrors {
                                code
                                field
                                message
                            }
                        }
                    }
                `,
                variables: {
                    input: {
                        lines: lineItems.map(li => ({
                            merchandiseId: li.variantId,
                            quantity: li.quantity
                        })),
                        ...(discountCode ? { discountCodes: [discountCode] } : {}),
                        ...(phone ? { buyerIdentity: { phone: phone.startsWith('+') ? phone : `+91${phone}` } } : {})
                    }
                }
            });
            checkoutBody = result.body;
        } catch (sfError: any) {
            console.error("[Checkout] Storefront API call failed:", sfError.message);
            return NextResponse.json({
                error: "Storefront API error: " + sfError.message
            }, { status: 502 });
        }

        console.log("[Checkout] Full Storefront Response:", JSON.stringify(checkoutBody, null, 2));

        const cartData = checkoutBody?.data?.cartCreate;

        if (!cartData) {
            console.error("[Checkout] No cartCreate data returned. Full body:", JSON.stringify(checkoutBody));
            return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
        }

        if (cartData.userErrors?.length > 0) {
            console.error("[Checkout] UserErrors:", cartData.userErrors);
            return NextResponse.json({
                error: "Invalid cart items",
                details: cartData.userErrors
            }, { status: 400 });
        }

        // Check if the discount code was actually accepted by Shopify
        const appliedDiscounts = cartData.cart.discountCodes || [];
        const discountApplied = appliedDiscounts.length > 0 && appliedDiscounts[0]?.applicable === true;

        console.log("[Checkout] ✅ Checkout URL:", cartData.cart.checkoutUrl);
        console.log("[Checkout] Discount codes:", appliedDiscounts);

        let finalCheckoutUrl = cartData.cart.checkoutUrl;

        return NextResponse.json({
            success: true,
            checkoutUrl: finalCheckoutUrl,
            discountApplied,
            discountCodes: appliedDiscounts
        });

    } catch (error: any) {
        console.error("[Checkout] Exception:", error.message, error.stack);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * Resolves a real Shopify ProductVariant GID from the Storefront API
 * by querying the shadow product by handle and matching selected options.
 */
async function resolveVariantGid(handle: string, variantTitle?: string): Promise<string | null> {
    try {
        const { body } = await storefrontFetch({
            query: `
                query resolveVariant($handle: String!) {
                    product(handle: $handle) {
                        variants(first: 100) {
                            edges {
                                node {
                                    id
                                    title
                                }
                            }
                        }
                    }
                }
            `,
            variables: { handle }
        });

        const variants = body?.data?.product?.variants?.edges || [];

        if (variants.length === 0) {
            console.warn(`[Resolve] No variants found for handle: ${handle}`);
            return null;
        }

        // If no specific variant title, return the first variant
        if (!variantTitle) {
            return variants[0].node.id;
        }

        // Try exact match on variant title (e.g. "M / Blue")
        const exactMatch = variants.find((v: any) => v.node.title === variantTitle);
        if (exactMatch) return exactMatch.node.id;

        // Try loose match — split by "/" and check all parts are present
        const parts = variantTitle.split('/').map((s: string) => s.trim().toLowerCase());
        const looseMatch = variants.find((v: any) => {
            const vTitle = v.node.title.toLowerCase();
            return parts.every((p: string) => vTitle.includes(p));
        });
        if (looseMatch) return looseMatch.node.id;

        // Fallback to first variant
        console.warn(`[Resolve] No exact match for "${variantTitle}", falling back to first variant`);
        return variants[0].node.id;
    } catch (err: any) {
        console.error(`[Resolve] Error resolving variant for ${handle}:`, err.message);
        return null;
    }
}
