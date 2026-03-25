import { NextRequest, NextResponse } from "next/server";
import { getShopifyCustomers } from "@/lib/shopify-customers";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

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
