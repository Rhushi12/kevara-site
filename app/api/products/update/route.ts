import { NextResponse } from "next/server";
import { updateCustomProduct } from "@/lib/custom-products";
import { syncMetaobjectToShopifyProduct } from "@/lib/shopify-product-sync";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { handle, title, description, price, currency, colors, sizes, status, imageUrls, stock } = body;

        if (!handle) {
            return NextResponse.json(
                { success: false, error: "Product handle is required" },
                { status: 400 }
            );
        }

        // 1. Update the metaobject
        const result = await updateCustomProduct({
            handle,
            title,
            description,
            price,
            currency,
            colors,
            sizes,
            status,
            imageUrls,
            stock
        });

        // 2. Re-sync the shadow product so Shopify stays in sync
        try {
            await syncMetaobjectToShopifyProduct(handle);
            console.log(`[ProductUpdate] ✅ Shadow product re-synced for: ${handle}`);
        } catch (syncError: any) {
            console.error(`[ProductUpdate] Shadow re-sync failed for ${handle}:`, syncError.message);
            // Don't fail the whole request — metaobject was updated successfully
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[/api/products/update] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update product" },
            { status: 500 }
        );
    }
}

