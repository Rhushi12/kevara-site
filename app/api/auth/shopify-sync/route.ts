import { NextResponse } from "next/server";
import { createShopifyCustomer, getCustomerByEmail } from "@/lib/shopify-customers";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, displayName, uid } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const nameParts = displayName ? displayName.split(" ") : ["User"];
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        console.log(`[Sync] Syncing user ${email} to Shopify...`);

        // Check if exists
        let customer = await getCustomerByEmail(email);

        if (!customer) {
            // Create new
            customer = await createShopifyCustomer({
                email,
                firstName,
                lastName,
                acceptsMarketing: true // Default to true for leads
            });
            console.log(`[Sync] Created new customer: ${customer.id}`);
        } else {
            console.log(`[Sync] Customer already exists: ${customer.id}`);
        }

        return NextResponse.json({ success: true, customerId: customer.id });

    } catch (error) {
        console.error("[Sync] Error syncing to Shopify:", error);
        return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
    }
}
