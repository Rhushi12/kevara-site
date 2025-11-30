import { NextRequest, NextResponse } from "next/server";
import { getCategoryPage } from "@/lib/shopify-admin";
import { savePageData } from "@/lib/save-page-data";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle");

    if (!handle) {
        return NextResponse.json({ error: "Missing handle" }, { status: 400 });
    }

    try {
        const data = await getCategoryPage(handle);
        return NextResponse.json(data || {});
    } catch (error) {
        console.error("Failed to fetch category page:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { handle, data } = body;

        if (!handle || !data) {
            return NextResponse.json({ error: "Missing handle or data" }, { status: 400 });
        }

        // Use the robust savePageData function
        await savePageData(handle, data, "category_page_layout");
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to update category page:", error);
        return NextResponse.json({ error: error.message || "Failed to update data" }, { status: 500 });
    }
}
