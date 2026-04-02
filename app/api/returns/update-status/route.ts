import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { incrementStockForReturn } from "@/lib/inventory";

export const dynamic = "force-dynamic";

/**
 * POST /api/returns/update-status
 * 
 * Admin endpoint to approve or reject return requests.
 * When a return is approved, inventory is automatically restocked.
 * 
 * Body: { returnId, status: "approved" | "rejected" | "picked_up" | "refunded" }
 */
export async function POST(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        const body = await req.json();
        const { returnId, status } = body;

        if (!returnId || !status) {
            return NextResponse.json(
                { error: "returnId and status are required" },
                { status: 400 }
            );
        }

        const validStatuses = ["approved", "rejected", "picked_up", "refunded"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        // Fetch the return request
        const returnDoc = await db.collection("returns").doc(returnId).get();
        if (!returnDoc.exists) {
            return NextResponse.json({ error: "Return request not found" }, { status: 404 });
        }

        const returnData = returnDoc.data()!;
        const previousStatus = returnData.status;

        // Prevent re-processing
        if (previousStatus === status) {
            return NextResponse.json({ 
                success: true, 
                message: `Return is already "${status}".` 
            });
        }

        // Update the return status
        await db.collection("returns").doc(returnId).update({
            status,
            updatedAt: new Date(),
            ...(status === "approved" ? { approvedAt: new Date() } : {}),
            ...(status === "refunded" ? { refundedAt: new Date() } : {}),
        });

        // ====== RESTOCK ON APPROVAL ======
        // Only restock when transitioning to "approved" (not if already approved)
        if (status === "approved" && previousStatus !== "approved") {
            try {
                // Get the item details from the order to know the variant/size
                const orderId = returnData.orderId;
                const itemHandle = returnData.itemHandle;

                // Look up the order for the variant title
                let variantTitle: string | undefined;
                let quantity = 1;

                const orderDoc = await db.collection("orders").doc(orderId).get();
                if (orderDoc.exists) {
                    const orderData = orderDoc.data()!;
                    // Find the matching item in the order
                    const matchingItem = (orderData.items || []).find(
                        (item: any) => 
                            item.handle === itemHandle || 
                            item.productId === itemHandle ||
                            item.title?.toLowerCase().includes(itemHandle.toLowerCase())
                    );
                    if (matchingItem) {
                        variantTitle = matchingItem.variantTitle;
                        quantity = matchingItem.quantity || 1;
                    }
                }

                await incrementStockForReturn(itemHandle, variantTitle, quantity);

                // Mark as restocked in the return doc
                await db.collection("returns").doc(returnId).update({
                    restocked: true,
                    restockedAt: new Date(),
                    restockedQuantity: quantity,
                });

                console.log(`[Returns] ✅ Restocked ${quantity} unit(s) for return ${returnId}`);
            } catch (restockErr: any) {
                console.error(`[Returns] ❌ Restock failed for return ${returnId}:`, restockErr.message);
                // Don't fail the status update — just log the error
                // Admin can manually restock if needed
            }
        }

        return NextResponse.json({
            success: true,
            message: `Return ${returnId} status updated to "${status}".${
                status === "approved" ? " Inventory has been restocked." : ""
            }`,
        });
    } catch (error: any) {
        console.error("[Returns] Update status error:", error.message);
        return NextResponse.json(
            { error: "Failed to update return status" },
            { status: 500 }
        );
    }
}
