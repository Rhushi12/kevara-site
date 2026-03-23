/**
 * Delhivery API Client
 * Handles shipment creation, AWB generation, and tracking lookups.
 *
 * Required env vars:
 *   DELHIVERY_API_TOKEN  — Your Delhivery API token
 *   DELHIVERY_BASE_URL   — "https://track.delhivery.com" (production) or "https://staging-express.delhivery.com" (staging)
 *   DELHIVERY_PICKUP_LOCATION — Your registered warehouse/pickup location name on Delhivery
 */

const BASE_URL = process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com';
const API_TOKEN = process.env.DELHIVERY_API_TOKEN || '';
const PICKUP_LOCATION = process.env.DELHIVERY_PICKUP_LOCATION || '';

// ─── Types ──────────────────────────────────────────────────────────────

export interface DelhiveryShipmentInput {
    orderNumber: string;
    customerName: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pin: string;
    country?: string;
    paymentMode: 'Prepaid' | 'COD';
    totalAmount: number;
    codAmount?: number;
    productDescription: string;
    weight: number; // grams
    quantity: number;
}

export interface DelhiveryCreateResponse {
    success: boolean;
    waybill?: string;
    orderNumber?: string;
    error?: string;
    rawResponse?: any;
}

export interface DelhiveryTrackingResponse {
    success: boolean;
    status?: string;
    statusDetail?: string;
    currentLocation?: string;
    estimatedDelivery?: string;
    scans?: {
        date: string;
        location: string;
        activity: string;
    }[];
    error?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getHeaders() {
    return {
        'Authorization': `Token ${API_TOKEN}`,
        'Content-Type': 'application/json',
    };
}

// ─── Create Shipment (Generate AWB) ─────────────────────────────────────

export async function createDelhiveryShipment(
    input: DelhiveryShipmentInput
): Promise<DelhiveryCreateResponse> {
    try {
        if (!API_TOKEN) {
            return { success: false, error: 'Missing DELHIVERY_API_TOKEN environment variable' };
        }
        if (!PICKUP_LOCATION) {
            return { success: false, error: 'Missing DELHIVERY_PICKUP_LOCATION environment variable' };
        }

        const shipmentData = {
            shipments: [
                {
                    name: input.customerName,
                    add: input.address1,
                    add2: input.address2 || '',
                    city: input.city,
                    state: input.state,
                    pin: input.pin,
                    country: input.country || 'India',
                    phone: input.phone,
                    order: input.orderNumber,
                    payment_mode: input.paymentMode,
                    total_amount: input.totalAmount,
                    cod_amount: input.paymentMode === 'COD' ? (input.codAmount || input.totalAmount) : 0,
                    product_desc: input.productDescription,
                    weight: input.weight,
                    quantity: input.quantity,
                    pickup_location: {
                        name: PICKUP_LOCATION,
                    },
                },
            ],
            pickup_location: {
                name: PICKUP_LOCATION,
            },
        };

        const formData = `format=json&data=${encodeURIComponent(JSON.stringify(shipmentData))}`;

        const response = await fetch(`${BASE_URL}/api/cmu/create.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${API_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        const result = await response.json();

        // Delhivery returns success in various formats
        if (result.success || result.upload_wbn) {
            const pkg = result.packages?.[0];
            return {
                success: true,
                waybill: pkg?.waybill || result.upload_wbn,
                orderNumber: pkg?.refnum || input.orderNumber,
                rawResponse: result,
            };
        }

        // Check for package-level errors
        const pkg = result.packages?.[0];
        if (pkg?.waybill) {
            return {
                success: true,
                waybill: pkg.waybill,
                orderNumber: pkg.refnum || input.orderNumber,
                rawResponse: result,
            };
        }

        return {
            success: false,
            error: pkg?.remarks?.[0] || result.rmk || JSON.stringify(result),
            rawResponse: result,
        };

    } catch (error: any) {
        console.error('[Delhivery] Create shipment error:', error.message);
        return { success: false, error: error.message };
    }
}

// ─── Track Shipment ─────────────────────────────────────────────────────

export async function trackDelhiveryShipment(
    waybill: string
): Promise<DelhiveryTrackingResponse> {
    try {
        if (!API_TOKEN) {
            return { success: false, error: 'Missing DELHIVERY_API_TOKEN' };
        }

        const response = await fetch(
            `${BASE_URL}/api/v1/packages/json/?waybill=${waybill}`,
            { headers: getHeaders() }
        );

        const result = await response.json();
        const shipment = result.ShipmentData?.[0]?.Shipment;

        if (!shipment) {
            return { success: false, error: 'Shipment not found' };
        }

        const scans = shipment.Scans?.map((scan: any) => ({
            date: scan.ScanDetail?.ScanDateTime,
            location: scan.ScanDetail?.ScannedLocation,
            activity: scan.ScanDetail?.Instructions,
        })) || [];

        return {
            success: true,
            status: shipment.Status?.Status,
            statusDetail: shipment.Status?.StatusType,
            currentLocation: shipment.Status?.StatusLocation,
            estimatedDelivery: shipment.EstimatedDate,
            scans,
        };

    } catch (error: any) {
        console.error('[Delhivery] Tracking error:', error.message);
        return { success: false, error: error.message };
    }
}

// ─── Pincode Serviceability Check ───────────────────────────────────────

export async function checkDelhiveryServiceability(
    pin: string
): Promise<{ success: boolean; serviceable?: boolean; prepaid?: boolean; cod?: boolean; error?: string }> {
    try {
        if (!API_TOKEN) {
            return { success: false, error: 'Missing DELHIVERY_API_TOKEN' };
        }

        const response = await fetch(
            `${BASE_URL}/c/api/pin-codes/json/?filter_codes=${pin}`,
            { headers: getHeaders() }
        );

        const result = await response.json();
        const info = result.delivery_codes?.[0]?.postal_code;

        if (!info) {
            return { success: true, serviceable: false };
        }

        return {
            success: true,
            serviceable: true,
            prepaid: info.pre_paid === 'Y',
            cod: info.cod === 'Y',
        };

    } catch (error: any) {
        console.error('[Delhivery] Serviceability error:', error.message);
        return { success: false, error: error.message };
    }
}
