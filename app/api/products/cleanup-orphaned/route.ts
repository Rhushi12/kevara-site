import { NextRequest, NextResponse } from 'next/server';
import { removeOrphanedProductsFromPages } from '@/lib/remove-product-from-pages';
import { requireAdmin } from '@/lib/auth';

/**
 * API endpoint to clean up orphaned product references
 * Removes products from page sections if they don't exist in all products
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const authError = await requireAdmin(request);
        if (authError) return authError;


        const result = await removeOrphanedProductsFromPages();

        return NextResponse.json({
            message: `Cleanup complete. Updated ${result.updatedCount} pages, removed ${result.removedCount} orphaned products.`,
            ...result
        });
    } catch (error: any) {
        console.error("Failed to clean up orphaned products:", error);
        return NextResponse.json({
            error: error.message || "Failed to clean up orphaned products"
        }, { status: 500 });
    }
}
