import { NextResponse } from "next/server";
import { updateCustomProduct } from "@/lib/custom-products";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { handle, title, description, price, currency, colors, sizes, status } = body;

        if (!handle) {
            return NextResponse.json(
                { success: false, error: "Product handle is required" },
                { status: 400 }
            );
        }

        console.log("[/api/products/update] Received update request:", {
            handle,
            title,
            sizes,
            sizesType: typeof sizes,
            sizesIsArray: Array.isArray(sizes)
        });

        const result = await updateCustomProduct({
            handle,
            title,
            description,
            price,
            currency,
            colors,
            sizes,
            status
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[/api/products/update] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update product" },
            { status: 500 }
        );
    }
}
