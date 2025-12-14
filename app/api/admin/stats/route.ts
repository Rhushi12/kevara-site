import { NextResponse } from "next/server";
import { getCustomProducts } from "@/lib/custom-products";

// export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const products = await getCustomProducts();
        return NextResponse.json({
            productCount: products.length
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json({ productCount: 0 }, { status: 500 });
    }
}
