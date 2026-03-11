import { NextResponse } from 'next/server';

/**
 * Customer Sync API
 * POST: Creates or updates a Shopify Customer from Firebase user data.
 * Called silently after Firebase authentication.
 * 
 * Uses direct fetch to gracefully handle ACCESS_DENIED errors
 * (e.g. when protected customer data access isn't configured).
 */

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_TOKEN;

async function shopifyDirect(query: string, variables: any = {}) {
    const res = await fetch(`https://${domain}/admin/api/2024-07/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token!,
        },
        body: JSON.stringify({ query, variables }),
        cache: 'no-store',
    });

    return res.json();
}

export async function POST(req: Request) {
    try {
        const { email, displayName, uid } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 1. Check if customer already exists in Shopify
        const searchQuery = `
            query findCustomer($query: String!) {
                customers(first: 1, query: $query) {
                    edges {
                        node {
                            id
                            email
                        }
                    }
                }
            }
        `;

        const searchResult = await shopifyDirect(searchQuery, { query: `email:${email}` });

        // Handle ACCESS_DENIED gracefully — don't crash the login flow
        if (searchResult.errors) {
            const hasAccessDenied = searchResult.errors.some((e: any) =>
                e.extensions?.code === 'ACCESS_DENIED'
            );
            if (hasAccessDenied) {
                console.warn("[CustomerSync] Protected customer data access not configured. Skipping sync.");
                return NextResponse.json({
                    success: true,
                    customerId: null,
                    isNew: false,
                    skipped: true,
                    reason: "Protected customer data access needs to be configured in Shopify."
                });
            }
            // Other errors
            console.error("[CustomerSync] Shopify error:", searchResult.errors);
            return NextResponse.json({
                success: true,
                customerId: null,
                isNew: false,
                skipped: true
            });
        }

        const existingCustomer = searchResult.data?.customers?.edges?.[0]?.node;

        if (existingCustomer) {
            console.log(`[CustomerSync] Customer already exists: ${email} (${existingCustomer.id})`);
            return NextResponse.json({
                success: true,
                customerId: existingCustomer.id,
                isNew: false
            });
        }

        // 2. Create new Shopify Customer
        const nameParts = (displayName || 'Customer').split(' ');
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || '';

        const createMutation = `
            mutation customerCreate($input: CustomerInput!) {
                customerCreate(input: $input) {
                    customer {
                        id
                        email
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const createResult = await shopifyDirect(createMutation, {
            input: {
                email,
                firstName,
                lastName,
                tags: ["firebase-synced", `uid:${uid}`],
                note: `Auto-synced from Firebase (UID: ${uid})`,
                emailMarketingConsent: {
                    marketingState: "SUBSCRIBED",
                    marketingOptInLevel: "SINGLE_OPT_IN"
                }
            }
        });

        // Handle ACCESS_DENIED on create too
        if (createResult.errors) {
            const hasAccessDenied = createResult.errors.some((e: any) =>
                e.extensions?.code === 'ACCESS_DENIED'
            );
            if (hasAccessDenied) {
                console.warn("[CustomerSync] Cannot create customer — access denied. Skipping.");
                return NextResponse.json({
                    success: true,
                    customerId: null,
                    isNew: false,
                    skipped: true
                });
            }
        }

        if (createResult.data?.customerCreate?.userErrors?.length > 0) {
            console.error("[CustomerSync] Shopify Error:", createResult.data.customerCreate.userErrors);
            return NextResponse.json({
                error: "Failed to create customer",
                details: createResult.data.customerCreate.userErrors
            }, { status: 400 });
        }

        const newCustomer = createResult.data?.customerCreate?.customer;
        
        if (!newCustomer) {
            console.warn("[CustomerSync] No customer returned from create mutation");
            return NextResponse.json({
                success: true,
                customerId: null,
                isNew: false,
                skipped: true
            });
        }

        console.log(`[CustomerSync] ✅ Created Shopify Customer: ${email} (${newCustomer.id})`);

        return NextResponse.json({
            success: true,
            customerId: newCustomer.id,
            isNew: true
        });

    } catch (error: any) {
        console.error("[CustomerSync] Exception:", error.message);
        // Return success anyway so login flow isn't blocked
        return NextResponse.json({
            success: true,
            customerId: null,
            skipped: true,
            error: "Sync failed but login proceeds"
        });
    }
}
