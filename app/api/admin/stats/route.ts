import { NextResponse } from "next/server";
import { getCustomProducts } from "@/lib/custom-products";
import { getShopifyCustomers } from "@/lib/shopify-customers";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let productCount = 0;
        let customerCount = 0;

        // 1. Fetch Products
        try {
            const products = await getCustomProducts();
            productCount = products.length;
        } catch (e) {
            console.error("[Admin Stats] Failed to fetch products:", e);
        }

        // 2. Fetch Customers
        try {
            const customers = await getShopifyCustomers(250);
            customerCount = customers.length;
        } catch (e: any) {
            console.error("[Admin Stats] Failed to fetch customers:", e);
            if (e.message?.includes("access denied") || e.message?.includes("scope")) {
                console.error("[Admin Stats] HINT: Check if your Shopify Access Token has 'read_customers' scope.");
            }
        }

        return NextResponse.json({
            productCount,
            customerCount
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json({ productCount: 0, customerCount: 0 }, { status: 500 });
    }
}
