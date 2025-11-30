import { savePageData } from "@/lib/save-page-data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();

    try {
        // Use collection_page_layout as the type for collection pages
        await savePageData(body.handle, body.data, "collection_page_layout");
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
