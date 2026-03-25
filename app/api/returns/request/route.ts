import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db as adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        // Ensure the user is authenticated
        const authResult = await verifyAuth(request);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json(
                { error: authResult.error || "Unauthorized" },
                { status: 401 }
            );
        }

        const uid = authResult.userId;
        const email = authResult.email || "";
        const body = await request.json();
        const { orderId, itemHandle, reason } = body;

        if (!orderId || !itemHandle) {
            return NextResponse.json(
                { error: "orderId and itemHandle are required" },
                { status: 400 }
            );
        }

        // 1. Find the shipment record for this order
        const shipmentsRef = adminDb.collection("shipments");
        const shipmentSnap = await shipmentsRef
            .where("orderId", "==", orderId)
            .where("type", "==", "outbound")
            .limit(1)
            .get();

        if (shipmentSnap.empty) {
            return NextResponse.json(
                { error: "No shipment found for this order. Returns can only be initiated after delivery." },
                { status: 404 }
            );
        }

        const shipment = shipmentSnap.docs[0].data();

        // 2. Check that shipment has been delivered
        if (shipment.status !== "Delivered") {
            return NextResponse.json(
                { error: `Order has not been delivered yet. Current status: ${shipment.status}` },
                { status: 400 }
            );
        }

        // 3. Get the delivery date
        const deliveredAt = shipment.deliveredAt?.toDate?.() || shipment.updatedAt?.toDate?.() || null;
        if (!deliveredAt) {
            return NextResponse.json(
                { error: "Could not determine delivery date. Please contact support." },
                { status: 400 }
            );
        }

        // 4. Fetch the product to check its returnDays
        // Try Firestore shadow products first, then the custom products metaobject data
        let returnDays = 30; // Default
        try {
            const { getCustomProductByHandle } = await import("@/lib/custom-products");
            const product = await getCustomProductByHandle(itemHandle);
            if (product) {
                returnDays = product.returnDays ?? 30;
            }
        } catch (err) {
            console.warn("[Returns] Failed to fetch product returnDays, using default 30:", err);
        }

        // 5. Validate return window
        if (returnDays === 0) {
            return NextResponse.json(
                { error: "This item is non-returnable." },
                { status: 400 }
            );
        }

        const now = new Date();
        const elapsedMs = now.getTime() - deliveredAt.getTime();
        const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

        if (elapsedDays > returnDays) {
            return NextResponse.json(
                {
                    error: `This item has passed its ${returnDays}-day return window. It was delivered ${elapsedDays} days ago.`,
                    returnDays,
                    elapsedDays,
                },
                { status: 400 }
            );
        }

        // 6. Check for duplicate return requests
        const existingReturn = await adminDb
            .collection("returns")
            .where("orderId", "==", orderId)
            .where("itemHandle", "==", itemHandle)
            .where("userId", "==", uid)
            .limit(1)
            .get();

        if (!existingReturn.empty) {
            const existing = existingReturn.docs[0].data();
            return NextResponse.json(
                { error: `A return request already exists for this item (status: ${existing.status}).` },
                { status: 409 }
            );
        }

        // 7. Create the return request
        const returnDoc = await adminDb.collection("returns").add({
            orderId,
            itemHandle,
            userId: uid,
            userEmail: email,
            reason: reason || "",
            status: "pending",
            returnDays,
            deliveredAt,
            elapsedDays,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // 8. Deduct loyalty points
        try {
            await deductLoyaltyPoints(uid, orderId, itemHandle);
        } catch (err) {
            console.warn("[Returns] Failed to deduct loyalty points:", err);
            // Don't block the return request if loyalty deduction fails
        }

        return NextResponse.json({
            success: true,
            returnId: returnDoc.id,
            message: `Return request created. You have ${returnDays - elapsedDays} day(s) remaining in your return window.`,
        });
    } catch (error: any) {
        console.error("[Returns] Error processing return request:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process return request" },
            { status: 500 }
        );
    }
}

/**
 * Deduct loyalty points earned from the returned item.
 * Creates a negative transaction in the user's loyalty ledger.
 */
async function deductLoyaltyPoints(uid: string, orderId: string, itemHandle: string) {
    const loyaltyRef = adminDb.doc(`users/${uid}/loyalty/summary`);
    const loyaltySnap = await loyaltyRef.get();

    if (!loyaltySnap.exists) return; // No loyalty record, nothing to deduct

    const loyaltyData = loyaltySnap.data()!;
    const currentPoints = loyaltyData.totalPoints || 0;

    // Calculate points to deduct (e.g., 1 point per ₹100 spent on this item)
    // For simplicity, deduct a flat 10 points per return. Adjust based on actual order value.
    const pointsToDeduct = Math.min(10, currentPoints); // Don't go below 0

    if (pointsToDeduct <= 0) return;

    // Update the summary
    await loyaltyRef.update({
        totalPoints: currentPoints - pointsToDeduct,
        updatedAt: new Date(),
    });

    // Add a negative ledger entry
    await adminDb.collection(`users/${uid}/loyalty/transactions`).add({
        type: "deduction",
        points: -pointsToDeduct,
        description: `Points deducted for return on Order #${orderId} (item: ${itemHandle})`,
        orderId,
        itemHandle,
        createdAt: new Date(),
    });
}
