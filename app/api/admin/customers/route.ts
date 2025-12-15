import { NextResponse } from "next/server";
import { getShopifyCustomers } from "@/lib/shopify-customers";

export async function GET() {
    try {
        const customers = await getShopifyCustomers(50);
        return NextResponse.json({ customers });
    } catch (error: any) {
        console.error("Error fetching customers:", error);
        if (error.message?.includes("Access denied")) {
            console.error("[Admin API] MISSING SCOPES: Please add 'read_customers' to your Shopify Admin API scopes.");
            // Return empty list so UI doesn't crash
            return NextResponse.json({ customers: [] });
        }
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}
