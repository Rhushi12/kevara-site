import { NextResponse } from 'next/server';
import { shopifyFetch } from '@/lib/shopify-admin';

/**
 * Order History API
 * GET: Fetches real Shopify orders for a customer by email.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
        }

        // Query Shopify Admin API for orders by customer email
        const query = `
            query getOrdersByEmail($query: String!) {
                orders(first: 20, query: $query, sortKey: CREATED_AT, reverse: true) {
                    edges {
                        node {
                            id
                            name
                            createdAt
                            displayFinancialStatus
                            displayFulfillmentStatus
                            totalPriceSet {
                                shopMoney {
                                    amount
                                    currencyCode
                                }
                            }
                            lineItems(first: 10) {
                                edges {
                                    node {
                                        title
                                        quantity
                                        variant {
                                            title
                                            image {
                                                url
                                            }
                                        }
                                        originalTotalSet {
                                            shopMoney {
                                                amount
                                                currencyCode
                                            }
                                        }
                                    }
                                }
                            }
                            fulfillments {
                                trackingInfo {
                                    number
                                    url
                                    company
                                }
                                status
                                createdAt
                            }
                            shippingAddress {
                                city
                                province
                                country
                            }
                        }
                    }
                }
            }
        `;

        const result = await shopifyFetch(query, { query: `email:${email}` });
        const orders = result.orders?.edges?.map((edge: any) => {
            const order = edge.node;

            // Extract tracking info from fulfillments
            const tracking = order.fulfillments?.flatMap((f: any) =>
                f.trackingInfo?.map((t: any) => ({
                    number: t.number,
                    url: t.url,
                    company: t.company
                })) || []
            ) || [];

            return {
                id: order.id,
                orderNumber: order.name,
                createdAt: order.createdAt,
                financialStatus: order.displayFinancialStatus,
                fulfillmentStatus: order.displayFulfillmentStatus,
                total: order.totalPriceSet?.shopMoney?.amount,
                currency: order.totalPriceSet?.shopMoney?.currencyCode,
                items: order.lineItems?.edges?.map((li: any) => ({
                    title: li.node.title,
                    quantity: li.node.quantity,
                    variantTitle: li.node.variant?.title,
                    image: li.node.variant?.image?.url,
                    price: li.node.originalTotalSet?.shopMoney?.amount
                })),
                tracking,
                shippingCity: order.shippingAddress?.city,
                shippingCountry: order.shippingAddress?.country
            };
        }) || [];

        return NextResponse.json({ success: true, orders });

    } catch (error: any) {
        console.error("[Orders] Exception:", error.message);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

