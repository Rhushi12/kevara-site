"use server";

import { NextRequest, NextResponse } from "next/server";
import { getOfferSlides, saveOfferSlides } from "@/lib/shopify-admin";

export const dynamic = 'force-dynamic';

/**
 * GET /api/offer - Fetch offer slides from metaobject
 */
export async function GET() {
    try {
        const slides = await getOfferSlides();
        return NextResponse.json({ slides: slides || [] });
    } catch (error: any) {
        console.error("[API /offer GET] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch offer slides" }, { status: 500 });
    }
}

/**
 * POST /api/offer - Save offer slides to metaobject
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { slides } = body;

        if (!slides || !Array.isArray(slides)) {
            return NextResponse.json({ error: "Missing or invalid slides array" }, { status: 400 });
        }

        await saveOfferSlides(slides);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[API /offer POST] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to save offer slides" }, { status: 500 });
    }
}
