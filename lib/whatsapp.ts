/**
 * WhatsApp Cloud API Client — Kevara
 * 
 * Uses Meta's free WhatsApp Cloud API (1,000 free service conversations/month)
 * to send order confirmations and shipping notifications to customers.
 * 
 * All sends are NON-BLOCKING. If WhatsApp fails, it logs an error
 * but never breaks the order/fulfillment flow.
 * 
 * Setup required:
 * 1. Create a Meta Business account at business.facebook.com
 * 2. Create a WhatsApp Business app at developers.facebook.com
 * 3. Register a phone number (dedicated SIM for API only)
 * 4. Submit message templates for approval
 * 5. Fill in env vars: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN
 */

const WHATSAPP_API_VERSION = 'v21.0';

interface WhatsAppConfig {
    phoneNumberId: string;
    accessToken: string;
}

function getConfig(): WhatsAppConfig | null {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        console.warn('[WhatsApp] Not configured — missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
        return null;
    }

    return { phoneNumberId, accessToken };
}

/**
 * Formats a phone number for WhatsApp API (needs country code, no + prefix).
 * Handles Indian numbers: "9876543210" → "919876543210"
 */
function formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, remove it (common Indian format)
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // If it's a 10-digit Indian number, prepend 91
    if (cleaned.length === 10) {
        cleaned = `91${cleaned}`;
    }

    // If it starts with +91, the + was already stripped by the regex above
    // so "91XXXXXXXXXX" is already correct

    return cleaned;
}

/**
 * Core function: Sends a template message via WhatsApp Cloud API.
 */
async function sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string,
    components: any[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = getConfig();
    if (!config) {
        return { success: false, error: 'WhatsApp not configured' };
    }

    const formattedPhone = formatPhoneNumber(to);

    if (formattedPhone.length < 10) {
        console.error(`[WhatsApp] Invalid phone number: ${to}`);
        return { success: false, error: 'Invalid phone number' };
    }

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${config.phoneNumberId}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
            name: templateName,
            language: { code: languageCode },
            components,
        },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`[WhatsApp] API error (${response.status}):`, JSON.stringify(data));
            return {
                success: false,
                error: data.error?.message || `HTTP ${response.status}`,
            };
        }

        const messageId = data.messages?.[0]?.id;
        console.log(`[WhatsApp] ✅ Message sent to ${formattedPhone} | Template: ${templateName} | ID: ${messageId}`);

        return { success: true, messageId };
    } catch (err: any) {
        console.error(`[WhatsApp] Network error sending to ${formattedPhone}:`, err.message);
        return { success: false, error: err.message };
    }
}

// ═══════════════════════════════════════════════════════════
// PUBLIC API — Call these from your routes
// ═══════════════════════════════════════════════════════════

/**
 * Sends an order confirmation WhatsApp message.
 * 
 * Template name: "order_confirmation" (must be approved on Meta dashboard)
 * Parameters: {{1}} = customer name, {{2}} = order number, {{3}} = items summary, {{4}} = total
 */
export async function sendOrderConfirmation(
    phone: string,
    customerName: string,
    orderNumber: string | number,
    itemsSummary: string,
    total: string
): Promise<void> {
    try {
        const result = await sendTemplateMessage(
            phone,
            'order_confirmation',
            'en',
            [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: customerName || 'there' },
                        { type: 'text', text: String(orderNumber) },
                        { type: 'text', text: itemsSummary },
                        { type: 'text', text: total },
                    ],
                },
            ]
        );

        if (!result.success) {
            console.warn(`[WhatsApp] Order confirmation failed for #${orderNumber}: ${result.error}`);
        }
    } catch (err: any) {
        // Non-blocking — never let WhatsApp break the order flow
        console.error(`[WhatsApp] Exception in sendOrderConfirmation:`, err.message);
    }
}

/**
 * Sends a shipping/dispatch notification WhatsApp message.
 * 
 * Template name: "order_shipped" (must be approved on Meta dashboard)
 * Parameters: {{1}} = customer name, {{2}} = order number, {{3}} = courier, {{4}} = AWB, {{5}} = tracking URL
 */
export async function sendShipmentNotification(
    phone: string,
    customerName: string,
    orderNumber: string | number,
    courierName: string,
    awbNumber: string,
    trackingUrl: string
): Promise<void> {
    try {
        const result = await sendTemplateMessage(
            phone,
            'order_shipped',
            'en',
            [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: customerName || 'there' },
                        { type: 'text', text: String(orderNumber) },
                        { type: 'text', text: courierName },
                        { type: 'text', text: awbNumber },
                        { type: 'text', text: trackingUrl },
                    ],
                },
            ]
        );

        if (!result.success) {
            console.warn(`[WhatsApp] Shipment notification failed for #${orderNumber}: ${result.error}`);
        }
    } catch (err: any) {
        // Non-blocking
        console.error(`[WhatsApp] Exception in sendShipmentNotification:`, err.message);
    }
}

/**
 * Quick check: Is WhatsApp configured and ready to send?
 */
export function isWhatsAppConfigured(): boolean {
    return getConfig() !== null;
}
