import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, updateDoc, getDoc, serverTimestamp, query, where, getDocs, addDoc } from "firebase/firestore";
import { mapDelhiveryStatus, DelhiveryWebhookPayload, DELHIVERY_CONFIG } from "@/lib/delhivery";
import { fetchOrderLineItemsForRestock, restockOrderItems } from "@/lib/inventory";

/**
 * POST /api/webhooks/delhivery
 * 
 * Delhivery sends webhook payloads here when shipment statuses change.
 * This endpoint receives the payload, maps the status, and updates the
 * corresponding shipment record in Firestore.
 * 
 * SECTION 6: When an RTO/Return is delivered back, this endpoint also
 * automatically restocks the inventory in Shopify using the Admin API.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // TODO: Verify webhook signature when DELHIVERY_WEBHOOK_SECRET is configured
        // const signature = req.headers.get("x-delhivery-signature");
        // if (DELHIVERY_CONFIG.webhookSecret && signature !== expectedSignature) {
        //     return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        // }

        const payload = body as DelhiveryWebhookPayload;

        if (!payload.Waybill) {
            return NextResponse.json({ error: "Missing Waybill in payload" }, { status: 400 });
        }

        const mappedStatus = mapDelhiveryStatus(payload.CurrentStatus || "In Transit");

        // Find the shipment by AWB in Firestore
        const shipmentsRef = collection(db, "shipments");
        const q = query(shipmentsRef, where("awb", "==", payload.Waybill));
        const snap = await getDocs(q);

        if (snap.empty) {
            // If no matching shipment exists, create one (first webhook for this AWB)
            const docRef = await addDoc(shipmentsRef, {
                awb: payload.Waybill,
                orderId: payload.OrderID || "UNKNOWN",
                customer: { name: "Webhook Created", email: "", phone: "" },
                type: payload.CurrentStatus?.toLowerCase().includes("rto") ? "return" : "outbound",
                status: mappedStatus,
                lastScan: {
                    location: payload.StatusLocation || "Unknown",
                    timestamp: payload.StatusDateTime || new Date().toISOString(),
                },
                eta: payload.EDD || "Pending",
                restocked: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Check if this is already an RTO Delivered status on creation
            if (isRestockTrigger(mappedStatus) && payload.OrderID) {
                await handleAutoRestock(docRef.id, payload.OrderID, mappedStatus);
            }

            return NextResponse.json({ success: true, action: "created" });
        }

        // Update existing shipment document
        const shipmentDoc = snap.docs[0];
        const shipmentData = shipmentDoc.data();

        await updateDoc(doc(db, "shipments", shipmentDoc.id), {
            status: mappedStatus,
            lastScan: {
                location: payload.StatusLocation || "Unknown",
                timestamp: payload.StatusDateTime || new Date().toISOString(),
            },
            ...(payload.EDD && { eta: payload.EDD }),
            ...(mappedStatus.startsWith("RTO") && { type: "return" }),
            updatedAt: serverTimestamp(),
        });

        // ========== SECTION 6: AUTOMATED INVENTORY RESTOCK ==========
        // Trigger restock ONLY when status is "RTO Delivered" or "Return Delivered"
        // AND this shipment hasn't already been restocked (idempotency guard)
        if (isRestockTrigger(mappedStatus) && !shipmentData.restocked) {
            const orderId = shipmentData.orderId || payload.OrderID;
            if (orderId && orderId !== "UNKNOWN") {
                await handleAutoRestock(shipmentDoc.id, orderId, mappedStatus);
            }
        }
        // =============================================================

        return NextResponse.json({ success: true, action: "updated", status: mappedStatus });
    } catch (error: any) {
        console.error("[Webhook/Delhivery] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ---- Helper: Check if status should trigger a restock ----
function isRestockTrigger(status: string): boolean {
    return status === "RTO Delivered" || status.toLowerCase().includes("return delivered");
}

// ---- Helper: Execute the automatic restock with idempotency ----
async function handleAutoRestock(shipmentDocId: string, orderId: string, status: string) {
    try {
        console.log(`[AutoRestock] Triggered for order ${orderId} (status: ${status})`);

        // 1. Fetch order line items from Shopify
        const orderData = await fetchOrderLineItemsForRestock(orderId);
        if (!orderData || orderData.items.length === 0) {
            console.warn(`[AutoRestock] No restockable items found for order ${orderId}`);
            return;
        }

        // 2. Build the restock payload
        const restockItems = orderData.items.map((item: any) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
        }));

        // 3. Execute the Shopify inventory adjustment
        await restockOrderItems(restockItems, `Delhivery ${status} — AWB restock for ${orderData.orderName}`);

        // 4. Mark as restocked in Firestore (idempotency guard)
        await updateDoc(doc(db, "shipments", shipmentDocId), {
            restocked: true,
            restockedAt: serverTimestamp(),
            restockedItems: restockItems.length,
        });

        console.log(`[AutoRestock] ✅ Successfully restocked ${restockItems.length} item(s) for ${orderData.orderName}`);
    } catch (error: any) {
        console.error(`[AutoRestock] ❌ Failed for order ${orderId}:`, error.message);
        // Don't throw — allow the webhook to still return 200 to Delhivery
        // The shipment won't be marked as restocked, so it can be retried
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        service: "Delhivery Webhook Receiver",
        status: "active",
        configured: !!DELHIVERY_CONFIG.apiToken,
        features: ["status_tracking", "auto_inventory_restock"],
        timestamp: new Date().toISOString(),
    });
}
