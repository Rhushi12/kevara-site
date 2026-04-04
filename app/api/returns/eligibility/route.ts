import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/returns/eligibility?orderId=X&itemHandle=Y
 * 
 * Lightweight check to determine if an item is eligible for return.
 * Returns: { eligible, reason, returnDays, elapsedDays, daysRemaining }
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get("orderId");
        const itemHandle = searchParams.get("itemHandle");

        if (!orderId || !itemHandle) {
            return NextResponse.json(
                { eligible: false, reason: "Missing orderId or itemHandle" },
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
            return NextResponse.json({
                eligible: false,
                reason: "No shipment found. Returns can only be initiated after delivery.",
            });
        }

        const shipment = shipmentSnap.docs[0].data();

        // 2. Check that shipment has been delivered
        if (shipment.status !== "Delivered") {
            return NextResponse.json({
                eligible: false,
                reason: `Order has not been delivered yet. Current status: ${shipment.status}`,
            });
        }

        // 3. Get the delivery date
        const deliveredAt = shipment.deliveredAt?.toDate?.() || shipment.updatedAt?.toDate?.() || null;
        if (!deliveredAt) {
            return NextResponse.json({
                eligible: false,
                reason: "Could not determine delivery date. Please contact support.",
            });
        }

        // 4. Fetch the product's return window
        let returnDays = 30; // Default
        try {
            const { getCustomProductByHandle } = await import("@/lib/custom-products");
            const product = await getCustomProductByHandle(itemHandle);
            if (product) {
                returnDays = product.returnDays ?? 30;
            }
        } catch (err) {
            console.warn("[Returns/Eligibility] Failed to fetch product returnDays, using default 30:", err);
        }

        // 5. Non-returnable items
        if (returnDays === 0) {
            return NextResponse.json({
                eligible: false,
                reason: "This item is non-returnable.",
                returnDays: 0,
            });
        }

        // 6. Calculate elapsed days and check window
        const now = new Date();
        const elapsedMs = now.getTime() - deliveredAt.getTime();
        const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
        const daysRemaining = returnDays - elapsedDays;

        if (elapsedDays > returnDays) {
            return NextResponse.json({
                eligible: false,
                reason: `Return window expired. This item had a ${returnDays}-day return policy and was delivered ${elapsedDays} days ago.`,
                returnDays,
                elapsedDays,
                daysRemaining: 0,
            });
        }

        // 7. Check for existing return request
        // We don't need auth here since this is just a check
        // The actual submission in /api/returns/request checks for duplicates

        return NextResponse.json({
            eligible: true,
            returnDays,
            elapsedDays,
            daysRemaining,
            reason: `${daysRemaining} day(s) remaining in the ${returnDays}-day return window.`,
        });

    } catch (error: any) {
        console.error("[Returns/Eligibility] Error:", error.message);
        return NextResponse.json(
            { eligible: false, reason: "Failed to check eligibility. Please try again." },
            { status: 500 }
        );
    }
}
