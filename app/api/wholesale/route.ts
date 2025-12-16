import { NextResponse } from "next/server";
import { createWholesaleInquiry, getWholesaleLeads } from "@/lib/shopify-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.name || !body.email || !body.phone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const id = await createWholesaleInquiry(body);
        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error("Wholesale API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to submit inquiry" }, { status: 500 });
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
