import { NextResponse } from "next/server";
import { createWholesaleInquiry, getWholesaleLeads } from "@/lib/shopify-admin";

export async function POST(request: Request) {
    try {
        // Debug: Check if environment variables are present
        const hasToken = !!process.env.SHOPIFY_ADMIN_TOKEN;
        const hasDomain = !!(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN);

        console.log("[Wholesale API] Environment check - Token present:", hasToken, "Domain present:", hasDomain);

        if (!hasToken || !hasDomain) {
            console.error("[Wholesale API] Missing environment variables:", { hasToken, hasDomain });
            return NextResponse.json({
                error: "Server configuration error",
                details: `Missing: ${!hasToken ? 'SHOPIFY_ADMIN_TOKEN ' : ''}${!hasDomain ? 'SHOPIFY_STORE_DOMAIN' : ''}`.trim()
            }, { status: 500 });
        }

        const body = await request.json();
        console.log("[Wholesale API] Request body:", JSON.stringify(body, null, 2));

        // Basic validation
        if (!body.name || !body.email || !body.phone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const id = await createWholesaleInquiry(body);
        console.log("[Wholesale API] Successfully created inquiry:", id);
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
