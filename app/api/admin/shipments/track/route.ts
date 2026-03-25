import { NextRequest, NextResponse } from "next/server";
import { delhiveryClient, DELHIVERY_CONFIG, mapDelhiveryStatus } from "@/lib/delhivery";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/shipments/track?awb=AWB123456
 * 
 * Tracks a specific shipment by AWB number.
 * - If Delhivery API is configured, fetches live tracking data and updates Firestore.
 * - If not configured, returns the cached Firestore data only.
 */
export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const awb = searchParams.get("awb");

        if (!awb) {
            return NextResponse.json({ error: "AWB parameter is required" }, { status: 400 });
        }

        // Try live tracking if Delhivery API is configured
        if (DELHIVERY_CONFIG.apiToken) {
            const trackingData = await delhiveryClient.trackByAWB(awb);

            if (trackingData?.ShipmentData?.[0]) {
                const shipment = trackingData.ShipmentData[0].Shipment;
                const mappedStatus = mapDelhiveryStatus(shipment.Status.Status);

                // Update Firestore with latest tracking data
                const shipmentsRef = collection(db, "shipments");
                const q = query(shipmentsRef, where("awb", "==", awb));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    await updateDoc(doc(db, "shipments", snap.docs[0].id), {
                        status: mappedStatus,
                        lastScan: {
                            location: shipment.Status.StatusLocation,
                            timestamp: shipment.Status.StatusDateTime,
                        },
                        eta: shipment.ExpectedDeliveryDate || "Pending",
                        updatedAt: serverTimestamp(),
                    });
                }

                return NextResponse.json({
                    source: "delhivery_api",
                    awb,
                    status: mappedStatus,
                    location: shipment.Status.StatusLocation,
                    timestamp: shipment.Status.StatusDateTime,
                    eta: shipment.ExpectedDeliveryDate,
                });
            }
        }

        // Fallback: return cached Firestore data
        const shipmentsRef = collection(db, "shipments");
        const q = query(shipmentsRef, where("awb", "==", awb));
        const snap = await getDocs(q);

        if (snap.empty) {
            return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
        }

        const data = snap.docs[0].data();
        return NextResponse.json({
            source: "firestore_cache",
            awb,
            status: data.status,
            location: data.lastScan?.location,
            timestamp: data.lastScan?.timestamp,
            eta: data.eta,
            note: DELHIVERY_CONFIG.apiToken
                ? "Live data returned"
                : "Delhivery API not configured. Showing cached data only. Set DELHIVERY_API_TOKEN in .env.local to enable live tracking.",
        });
    } catch (error: any) {
        console.error("[Track API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
