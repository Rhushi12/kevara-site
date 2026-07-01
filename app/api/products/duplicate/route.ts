import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getCustomProductByHandle, createCustomProduct } from '@/lib/custom-products';
import { syncMetaobjectToShopifyProduct } from '@/lib/shopify-product-sync';
import { parseProductTitle } from '@/lib/productUtils';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { handle } = await request.json();

        if (!handle) {
            return NextResponse.json({ error: "Product handle is required" }, { status: 400 });
        }

        const originalProduct = await getCustomProductByHandle(handle);
        if (!originalProduct) {
            return NextResponse.json({ error: "Original product not found" }, { status: 404 });
        }

        // Add suffix to title to avoid identical titles
        const parsed = parseProductTitle(originalProduct.title || "");
        let newTitle = `${parsed.cleanTitle} (1)`;
        if (parsed.batchNumber) {
            newTitle += ` (${parsed.batchNumber})`;
        }

        // We map image edges to their URL.
        const imageUrls = originalProduct.images?.edges?.map((e: any) => e.node.url) || [];

        const duplicatedProduct = await createCustomProduct({
            title: newTitle,
            description: originalProduct.descriptionHtml || "",
            price: originalProduct.priceRange?.minVariantPrice?.amount || "0",
            currency: originalProduct.priceRange?.minVariantPrice?.currencyCode || "INR",
            imageUrls,
            videoUrl: originalProduct.video || undefined,
            colors: originalProduct.colors || [],
            sizes: originalProduct.sizes || [],
            stock: originalProduct.stock || 0,
            variantStock: originalProduct.variantStock || {},
            variantPrices: originalProduct.variantPrices || {},
            returnDays: originalProduct.returnDays ?? 30,
            status: originalProduct.status || "DRAFT" // Copy might default to DRAFT or same as original. Keep same as original for now.
        });

        if (!duplicatedProduct) {
            throw new Error("Failed to create duplicated product");
        }

        console.log(`[DuplicateAPI] Triggering shadow product sync for newly duplicated: ${duplicatedProduct.handle}`);
        await syncMetaobjectToShopifyProduct(duplicatedProduct.handle);

        return NextResponse.json({ success: true, product: duplicatedProduct });
    } catch (error: any) {
        console.error("[/api/products/duplicate] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to duplicate product" }, { status: 500 });
    }
}
