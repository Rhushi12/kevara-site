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
    pickupName: process.env.DELHIVERY_PICKUP_NAME || "KEVARA CLOTHING",
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
        productDescription?: string;
        quantity?: number;
    }): Promise<{ awb: string; success: boolean; rawResponse?: any } | null> {
        if (!this.token) {
            console.warn("[Delhivery] API token not configured. Cannot create shipment.");
            return null;
        }

        try {
            const shipmentPayload = {
                shipments: [
                    {
                        name: orderData.customerName,
                        add: orderData.address,
                        pin: orderData.pin,
                        city: orderData.city,
                        state: orderData.state,
                        country: "India",
                        phone: orderData.phone,
                        order: orderData.orderId,
                        payment_mode: orderData.paymentMode,
                        return_pin: "",
                        return_city: "",
                        return_phone: "",
                        return_add: "",
                        return_state: "",
                        return_country: "",
                        products_desc: orderData.productDescription || "Kevara Clothing",
                        hsn_code: "",
                        cod_amount: orderData.paymentMode === "COD" ? (orderData.codAmount || 0).toString() : "0",
                        order_date: new Date().toISOString(),
                        total_amount: (orderData.codAmount || 0).toString(),
                        seller_add: "",
                        seller_name: "",
                        seller_inv: "",
                        quantity: orderData.quantity || 1,
                        waybill: "", // Empty = Delhivery auto-generates AWB
                        shipment_width: 20,
                        shipment_height: 10,
                        weight: orderData.weight,
                        seller_gst_tin: "",
                        shipping_mode: "Surface",
                        address_type: "home",
                    },
                ],
                pickup_location: {
                    name: DELHIVERY_CONFIG.pickupName,
                },
            };

            const formData = `format=json&data=${encodeURIComponent(JSON.stringify(shipmentPayload))}`;

            const res = await fetch(`${this.baseUrl}/api/cmu/create.json`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Token ${this.token}`,
                },
                body: formData,
            });

            const data = await res.json();
            console.log("[Delhivery] createShipment response:", JSON.stringify(data));

            if (data.success && data.packages && data.packages.length > 0) {
                const pkg = data.packages[0];
                if (pkg.waybill) {
                    return { success: true, awb: pkg.waybill, rawResponse: data };
                }
                // Package created but has remarks (validation error)
                return { success: false, awb: "", rawResponse: data };
            }

            // Check for rmk (remark) field indicating errors
            if (data.rmk) {
                console.error("[Delhivery] Shipment creation error:", data.rmk);
            }

            return { success: false, awb: "", rawResponse: data };
        } catch (error) {
            console.error("[Delhivery] createShipment failed:", error);
            return null;
        }
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

        try {
            const res = await fetch(`${this.baseUrl}/api/p/edit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${this.token}`,
                },
                body: JSON.stringify({ waybill: awb, cancellation: true }),
            });

            const data = await res.json();
            console.log("[Delhivery] cancelShipment response:", JSON.stringify(data));
            return res.ok;
        } catch (error) {
            console.error("[Delhivery] cancelShipment failed:", error);
            return false;
        }
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
        productDescription: params.productDescription,
        quantity: params.quantity,
    });

    if (!result) {
        return { success: false, error: "Delhivery API not configured or call failed" };
    }
    return { success: result.success, waybill: result.awb, rawResponse: result.rawResponse, error: result.success ? undefined : "Shipment creation failed — check rawResponse" };
}

export async function trackDelhiveryShipment(waybill: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const result = await delhiveryClient.trackByAWB(waybill);
    if (!result) {
        return { success: false, error: "Tracking data unavailable" };
    }
    return { success: true, data: result };
}
