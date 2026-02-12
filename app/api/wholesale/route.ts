import { NextResponse } from "next/server";
import { createWholesaleInquiry, getWholesaleLeads } from "@/lib/shopify-admin";

export async function POST(request: Request) {
    try {
        // Debug: Check if environment variables are present
        const hasToken = !!process.env.SHOPIFY_ADMIN_TOKEN;
        const hasDomain = !!(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN);


        if (!hasToken || !hasDomain) {
            console.error("[Wholesale API] Missing environment variables:", { hasToken, hasDomain });
            return NextResponse.json({
                error: "Server configuration error",
                details: `Missing: ${!hasToken ? 'SHOPIFY_ADMIN_TOKEN ' : ''}${!hasDomain ? 'SHOPIFY_STORE_DOMAIN' : ''}`.trim()
            }, { status: 500 });
        }

        const body = await request.json();

        // Validate required fields
        const requiredFields = [
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone Number' },
            { key: 'requirementType', label: 'Type of Requirement' },
            { key: 'state', label: 'State' },
            { key: 'city', label: 'City' },
            { key: 'address', label: 'Address' }
        ];

        const missingFields = requiredFields
            .filter(field => !body[field.key] || body[field.key].trim() === '')
            .map(field => field.label);

        if (missingFields.length > 0) {
            return NextResponse.json({
                error: `Please fill in the following required fields: ${missingFields.join(', ')}`,
                missingFields
            }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json({
                error: 'Please enter a valid email address'
            }, { status: 400 });
        }

        // Validate phone number (at least 10 digits)
        const phoneDigits = body.phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            return NextResponse.json({
                error: 'Please enter a valid phone number (at least 10 digits)'
            }, { status: 400 });
        }

        const id = await createWholesaleInquiry(body);
        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error("[Wholesale API] Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return NextResponse.json({
            error: error.message || "Failed to submit inquiry",
            errorType: error.name
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const leads = await getWholesaleLeads();
        return NextResponse.json({ leads });
    } catch (error: any) {
        console.error("Wholesale API Error:", error);
        return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }
}
