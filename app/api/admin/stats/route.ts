import { NextResponse } from "next/server";
import { getCustomProducts } from "@/lib/custom-products";
import { getShopifyCustomers } from "@/lib/shopify-customers";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [products, customers] = await Promise.all([
            getCustomProducts(),
            getShopifyCustomers(250) // Fetch up to 250 to get a count
        ]);

        return NextResponse.json({
            productCount: products.length,
            customerCount: customers.length
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json({ productCount: 0, customerCount: 0 }, { status: 500 });
    }
}
