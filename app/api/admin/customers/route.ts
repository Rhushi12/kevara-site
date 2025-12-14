import { NextResponse } from "next/server";
import { getShopifyCustomers } from "@/lib/shopify-customers";

export async function GET() {
    try {
        const customers = await getShopifyCustomers(50);
        return NextResponse.json({ customers });
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}
