import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { ShipmentRecord } from "@/lib/delhivery";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/shipments?type=outbound|return
 * 
 * Fetches shipment records from Firestore for the admin Logistics Dashboard.
 * Supports filtering by type (outbound/return).
 */
export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // "outbound" or "return"

        const shipmentsRef = collection(db, "shipments");
        let q;

        if (type === "outbound" || type === "return") {
            q = query(shipmentsRef, where("type", "==", type), orderBy("createdAt", "desc"));
        } else {
            q = query(shipmentsRef, orderBy("createdAt", "desc"));
        }

        const snap = await getDocs(q);
        const shipments: ShipmentRecord[] = snap.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                awb: d.awb || "",
                orderId: d.orderId || "",
                customer: d.customer || { name: "Unknown", email: "" },
                type: d.type || "outbound",
                status: d.status || "In Transit",
                lastScan: d.lastScan || { location: "Unknown", timestamp: "" },
                eta: d.eta || "Pending",
                returnReason: d.returnReason,
                createdAt: d.createdAt?.toDate?.() ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
                updatedAt: d.updatedAt?.toDate?.() ? d.updatedAt.toDate().toISOString() : new Date().toISOString(),
            };
        });

        return NextResponse.json({ shipments });
    } catch (error: any) {
        console.error("[Shipments API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/shipments
 * 
 * Manually creates a shipment record in Firestore.
 * Used when creating an order manually or when Delhivery AWB is generated.
 * The AWB can be left blank and filled later when Delhivery integration is live.
 */
export async function POST(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        const body = await req.json();
        const { awb, orderId, customerName, customerEmail, customerPhone, type, status, eta, returnReason } = body;

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        const shipmentsRef = collection(db, "shipments");
        const docRef = await addDoc(shipmentsRef, {
            awb: awb || "PENDING_AWB",
            orderId,
            customer: {
                name: customerName || "Unknown",
                email: customerEmail || "",
                phone: customerPhone || "",
            },
            type: type || "outbound",
            status: status || "Manifested",
            lastScan: {
                location: "Order Created",
                timestamp: new Date().toISOString(),
            },
            eta: eta || "Pending",
            ...(returnReason && { returnReason }),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error("[Shipments API] Create error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
