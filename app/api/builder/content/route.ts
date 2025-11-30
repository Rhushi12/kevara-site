import { NextRequest, NextResponse } from "next/server";
import { getPageContent } from "@/lib/shopify-admin";
import { savePageData } from "@/lib/save-page-data";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle");

    if (!handle) {
        return NextResponse.json({ error: "Missing handle" }, { status: 400 });
    }

    try {
        const data = await getPageContent(handle);
        return NextResponse.json(data || { sections: [] });
    } catch (error) {
        console.error("Failed to fetch page content:", error);
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

        // Use the robust savePageData function with strict "page_content" type
        await savePageData(handle, data, "page_content");
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to update page content:", error);
        return NextResponse.json({ error: error.message || "Failed to update data" }, { status: 500 });
    }
}
