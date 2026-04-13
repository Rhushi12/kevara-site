import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

function normalizeOrder(shopifyOrder: any) {
    // Convert edges to array
    const lineItems = shopifyOrder.lineItems?.edges?.map((e: any) => e.node) || [];

    return {
        shopifyOrderId: shopifyOrder.id.replace('gid://shopify/Order/', ''),
        orderNumber: parseInt(shopifyOrder.name.replace('#', '')),
        status: shopifyOrder.displayFulfillmentStatus?.toLowerCase() || 'unfulfilled',
        financialStatus: shopifyOrder.displayFinancialStatus?.toLowerCase() || 'pending',
        paymentStatus: shopifyOrder.displayFinancialStatus === 'PAID' ? 'Paid' : 'Pending',
        totalPrice: shopifyOrder.totalPriceSet?.presentmentMoney?.amount || "0",
        
        customerInfo: {
            email: shopifyOrder.email || shopifyOrder.customer?.email || '',
            phone: shopifyOrder.phone || shopifyOrder.shippingAddress?.phone || shopifyOrder.customer?.phone || '',
            firstName: shopifyOrder.customer?.firstName || shopifyOrder.shippingAddress?.firstName || '',
            lastName: shopifyOrder.customer?.lastName || shopifyOrder.shippingAddress?.lastName || '',
        },
        
        shippingAddress: shopifyOrder.shippingAddress ? {
            name: `${shopifyOrder.shippingAddress.firstName} ${shopifyOrder.shippingAddress.lastName}`.trim(),
            address1: shopifyOrder.shippingAddress.address1,
            address2: shopifyOrder.shippingAddress.address2 || '',
            city: shopifyOrder.shippingAddress.city,
            state: shopifyOrder.shippingAddress.province,
            zip: shopifyOrder.shippingAddress.zip,
            country: shopifyOrder.shippingAddress.country,
            phone: shopifyOrder.shippingAddress.phone
        } : null,

        items: lineItems.map((item: any) => ({
            id: item.id.replace('gid://shopify/LineItem/', ''),
            productId: item.product?.id?.replace('gid://shopify/Product/', '') || '',
            variantId: item.variant?.id?.replace('gid://shopify/ProductVariant/', '') || '',
            title: item.title,
            variantTitle: item.variantTitle || '',
            quantity: item.quantity,
            price: item.originalTotalSet?.presentmentMoney?.amount || "0",
            sku: item.sku || ''
        })),

        createdAt: shopifyOrder.createdAt,
        updatedAt: shopifyOrder.updatedAt
    };
}

export async function POST(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        const query = `
            query syncOrders {
                orders(first: 30, sortKey: CREATED_AT, reverse: true) {
                    edges {
                        node {
                            id
                            name
                            email
                            phone
                            createdAt
                            updatedAt
                            displayFinancialStatus
                            displayFulfillmentStatus
                            totalPriceSet {
                                presentmentMoney {
                                    amount
                                    currencyCode
                                }
                            }
                            customer {
                                firstName
                                lastName
                                email
                                phone
                            }
                            shippingAddress {
                                firstName
                                lastName
                                address1
                                address2
                                city
                                province
                                zip
                                country
                                phone
                            }
                            lineItems(first: 20) {
                                edges {
                                    node {
                                        id
                                        title
                                        variantTitle
                                        quantity
                                        sku
                                        originalTotalSet {
                                            presentmentMoney {
                                                amount
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
        const token = process.env.SHOPIFY_ADMIN_TOKEN;

        const apiRes = await fetch(`https://${domain}/admin/api/2024-07/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': token!,
            },
            body: JSON.stringify({ query }),
            cache: 'no-store',
        });

        const json = await apiRes.json();

        if (json.errors) {
            return NextResponse.json({ error: json.errors[0]?.message }, { status: 400 });
        }

        const edges = json.data?.orders?.edges || [];
        let count = 0;

        for (const edge of edges) {
            const rawShopify = edge.node;
            const normalized = normalizeOrder(rawShopify);
            const orderIdStr = normalized.shopifyOrderId;

            // Save to Firebase using numeric string ID or shopifyOrderId
            const docRef = db.collection('orders').doc(orderIdStr);
            const exists = await docRef.get();
            
            // Note: We merge if it exists so we don't overwrite manual tracking overrides or Delhivery couriers.
            if (!exists.exists) {
                await docRef.set(normalized);
                count++;
            } else {
                // If it already exists, gracefully update base statuses but not tracking info
                await docRef.set({
                    status: normalized.status,
                    financialStatus: normalized.financialStatus,
                    paymentStatus: normalized.paymentStatus
                }, { merge: true });
            }
        }

        return NextResponse.json({ success: true, message: `Successfully synced ${count} new missing orders from Shopify!` });
    } catch (err: any) {
        console.error('[Admin Order Sync Error]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
