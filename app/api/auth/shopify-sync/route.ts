import { NextResponse } from "next/server";
import { createShopifyCustomer, getCustomerByEmail } from "@/lib/shopify-customers";

export async function POST(req: Request) {
    try {
        // Debug: Check environment
        const hasToken = !!process.env.SHOPIFY_ADMIN_TOKEN;
        const hasDomain = !!(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN);
        console.log("[Shopify-Sync] Environment check - Token:", hasToken, "Domain:", hasDomain);

        const body = await req.json();
        const { email, displayName, uid } = body;

        console.log("[Shopify-Sync] Request received:", { email, displayName, uid });

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const nameParts = displayName ? displayName.split(" ") : ["User"];
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        console.log(`[Shopify-Sync] Syncing user ${email} to Shopify...`);

        // Check if exists
        let customer = null;
        try {
            customer = await getCustomerByEmail(email);
            console.log("[Shopify-Sync] Existing customer lookup result:", customer ? customer.id : "Not found");
        } catch (lookupError: any) {
            console.error("[Shopify-Sync] Error looking up customer:", lookupError.message);
            // Continue to try to create
        }

        if (!customer) {
            try {
                // Create new
                customer = await createShopifyCustomer({
                    email,
                    firstName,
                    lastName,
                    acceptsMarketing: true // Default to true for leads
                });
                console.log(`[Shopify-Sync] Created new customer: ${customer?.id}`);
            } catch (createError: any) {
                console.error("[Shopify-Sync] Error creating customer:", createError.message);
                // Check for common issues
                if (createError.message?.includes("Access denied")) {
                    console.error("[Shopify-Sync] MISSING SCOPES: Please add 'write_customers' and 'read_customers' to your Shopify Admin API scopes.");
                }
                throw createError;
            }
        } else {
            console.log(`[Shopify-Sync] Customer already exists: ${customer.id}`);
        }

        return NextResponse.json({ success: true, customerId: customer?.id });

    } catch (error: any) {
        console.error("[Shopify-Sync] Error syncing to Shopify:", {
            message: error.message,
            stack: error.stack
        });
        return NextResponse.json({
            error: "Failed to sync",
            details: error.message
        }, { status: 500 });
    }
}

