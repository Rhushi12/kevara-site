import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const query = `
            query getRecentOrders {
                orders(first: 5, sortKey: CREATED_AT, reverse: true) {
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
                            customer {
                                firstName
                                lastName
                                email
                            }
                        }
                    }
                }
            }
        `;

        let needsScope = false;
        let orders: any[] = [];

        // Direct fetch to avoid shopifyFetch throwing on Shopify's partial errors/warnings
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

        // Check for real ACCESS_DENIED error code
        if (json.errors) {
            const hasAccessDenied = json.errors.some((e: any) =>
                e.extensions?.code === 'ACCESS_DENIED'
            );
            if (hasAccessDenied) {
                needsScope = true;
            } else {
                console.warn("[Recent Orders] Shopify returned warnings:", JSON.stringify(json.errors));
            }
        }

        // Process data if available
        if (json.data?.orders?.edges && !needsScope) {
            orders = json.data.orders.edges.map((edge: any) => edge.node);
        }

        return NextResponse.json({
            orders,
            needsScope
        });
    } catch (error: any) {
        console.error("[Recent Orders] Error:", error.message);
        return NextResponse.json(
            { error: error.message || "Failed to fetch recent orders" },
            { status: 500 }
        );
    }
}
