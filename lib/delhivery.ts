// ==========================================================================
// Delhivery Integration Module — Integration-Ready Infrastructure
// ==========================================================================
// This file contains types, configuration, and a placeholder client class
// for Delhivery API integration. When the Delhivery account is activated,
// replace the placeholder methods with live API calls.
// ==========================================================================

// ---- Firestore Collection Schema ----
// shipments/{shipmentId}
//   - awb: string (Delhivery AWB number)
//   - orderId: string (internal Kevara order ID)
//   - customer: { name: string, email: string, phone: string }
//   - type: "outbound" | "return"
//   - status: ShipmentStatus
//   - lastScan: { location: string, timestamp: Timestamp }
//   - eta: string
//   - returnReason?: string
//   - createdAt: Timestamp
//   - updatedAt: Timestamp

export type ShipmentStatus =
    | "Manifested"
    | "Picked Up"
    | "In Transit"
    | "Out for Delivery"
    | "Delivered"
    | "RTO Initiated"
    | "RTO In Transit"
    | "RTO Delivered"
    | "Cancelled"
    | "Lost";

export interface ShipmentRecord {
    id: string;
    awb: string;
    orderId: string;
    customer: {
        name: string;
        email: string;
        phone?: string;
    };
    type: "outbound" | "return";
    status: ShipmentStatus;
    lastScan: {
        location: string;
        timestamp: string;
    };
    eta: string;
    returnReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DelhiveryTrackingResponse {
    ShipmentData: Array<{
        Shipment: {
            Status: { Status: string; StatusLocation: string; StatusDateTime: string };
            AWB: string;
            OrderID: string;
            ExpectedDeliveryDate: string;
        };
    }>;
}

export interface DelhiveryWebhookPayload {
    Waybill: string;
    CurrentStatus: string;
    StatusDateTime: string;
    StatusLocation: string;
    OrderID?: string;
    EDD?: string;
}

// ---- Configuration (Environment Variables) ----
// Add these to your .env.local when ready:
//   DELHIVERY_API_TOKEN=your_api_token_here
//   DELHIVERY_API_BASE=https://track.delhivery.com (or staging URL)
//   DELHIVERY_WEBHOOK_SECRET=your_webhook_secret_here

export const DELHIVERY_CONFIG = {
    apiBase: process.env.DELHIVERY_API_BASE || "https://track.delhivery.com",
    apiToken: process.env.DELHIVERY_API_TOKEN || "",
    webhookSecret: process.env.DELHIVERY_WEBHOOK_SECRET || "",
};

// ---- Status Mapping ----
// Maps Delhivery's raw status strings to our internal ShipmentStatus enum
export function mapDelhiveryStatus(rawStatus: string): ShipmentStatus {
    const normalized = rawStatus.toLowerCase().trim();
    if (normalized.includes("manifested")) return "Manifested";
    if (normalized.includes("picked up")) return "Picked Up";
    if (normalized.includes("in transit") && !normalized.includes("rto")) return "In Transit";
    if (normalized.includes("out for delivery")) return "Out for Delivery";
    if (normalized.includes("delivered") && !normalized.includes("rto")) return "Delivered";
    if (normalized.includes("rto initiated") || normalized.includes("rto_initiated")) return "RTO Initiated";
    if (normalized.includes("rto") && normalized.includes("transit")) return "RTO In Transit";
    if (normalized.includes("rto") && normalized.includes("delivered")) return "RTO Delivered";
    if (normalized.includes("cancelled") || normalized.includes("canceled")) return "Cancelled";
    if (normalized.includes("lost")) return "Lost";
    return "In Transit"; // default fallback
}

// ---- Placeholder Client ----
// When Delhivery account is ready, implement these methods with real API calls.
export class DelhiveryClient {
    private token: string;
    private baseUrl: string;

    constructor() {
        this.token = DELHIVERY_CONFIG.apiToken;
        this.baseUrl = DELHIVERY_CONFIG.apiBase;
    }

    /**
     * Track a shipment by AWB number.
     * TODO: Replace with real Delhivery API call:
     * GET {baseUrl}/api/v1/packages/json/?waybill={awb}&token={token}
     */
    async trackByAWB(awb: string): Promise<DelhiveryTrackingResponse | null> {
        if (!this.token) {
            console.warn("[Delhivery] API token not configured. Returning null.");
            return null;
        }

        try {
            const res = await fetch(
                `${this.baseUrl}/api/v1/packages/json/?waybill=${awb}&token=${this.token}`,
                { headers: { "Content-Type": "application/json" } }
            );
            if (!res.ok) throw new Error(`Delhivery API error: ${res.status}`);
            return await res.json();
        } catch (error) {
            console.error("[Delhivery] Track failed:", error);
            return null;
        }
    }

    /**
     * Create a shipment / generate AWB.
     * TODO: Replace with real Delhivery API call:
     * POST {baseUrl}/api/cmu/create.json
     */
    async createShipment(orderData: {
        orderId: string;
        customerName: string;
        address: string;
        city: string;
        state: string;
        pin: string;
        phone: string;
        weight: number;
        paymentMode: "Prepaid" | "COD";
        codAmount?: number;
    }): Promise<{ awb: string; success: boolean } | null> {
        if (!this.token) {
            console.warn("[Delhivery] API token not configured. Cannot create shipment.");
            return null;
        }

        // Placeholder — will be replaced with real API call
        console.log("[Delhivery] createShipment called with:", orderData);
        return null;
    }

    /**
     * Cancel a shipment.
     * TODO: Replace with real Delhivery API call:
     * POST {baseUrl}/api/p/edit
     */
    async cancelShipment(awb: string): Promise<boolean> {
        if (!this.token) {
            console.warn("[Delhivery] API token not configured.");
            return false;
        }

        console.log("[Delhivery] cancelShipment called for AWB:", awb);
        return false;
    }

    /**
     * Verify if the API token is valid by making a test call.
     */
    async verifyConnection(): Promise<boolean> {
        if (!this.token) return false;
        try {
            const res = await fetch(`${this.baseUrl}/api/kinko/v1/invoice/charges/.json`, {
                headers: { Authorization: `Token ${this.token}` },
            });
            return res.ok;
        } catch {
            return false;
        }
    }
}

// Singleton instance
export const delhiveryClient = new DelhiveryClient();

// ---- Exported convenience functions (used by fulfill route) ----

export async function createDelhiveryShipment(params: {
    orderNumber: string;
    customerName: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pin: string;
    paymentMode: "Prepaid" | "COD";
    totalAmount: number;
    productDescription: string;
    weight: number;
    quantity: number;
}): Promise<{ success: boolean; waybill?: string; error?: string; rawResponse?: any }> {
    const result = await delhiveryClient.createShipment({
        orderId: params.orderNumber,
        customerName: params.customerName,
        address: `${params.address1} ${params.address2 || ""}`.trim(),
        city: params.city,
        state: params.state,
        pin: params.pin,
        phone: params.phone,
        weight: params.weight,
        paymentMode: params.paymentMode,
        codAmount: params.paymentMode === "COD" ? params.totalAmount : undefined,
    });

    if (!result) {
        return { success: false, error: "Delhivery API not configured or call failed" };
    }
    return { success: result.success, waybill: result.awb };
}

export async function trackDelhiveryShipment(waybill: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const result = await delhiveryClient.trackByAWB(waybill);
    if (!result) {
        return { success: false, error: "Tracking data unavailable" };
    }
    return { success: true, data: result };
}
