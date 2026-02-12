import { NextRequest, NextResponse } from "next/server";
import { getPageContent, deletePageContent, getPageContentBySlug, pollForFileUrl } from "@/lib/shopify-admin";
import { savePageData } from "@/lib/save-page-data";

export const dynamic = 'force-dynamic';

/**
 * Resolve all image GIDs in page sections to URLs
 * This fixes broken images where image_id contains GID but image URL is missing/expired
 */
import { resolveImageGidsInSections } from "@/lib/content-utils";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle");

    if (!handle) {
        return NextResponse.json({ error: "Missing handle" }, { status: 400 });
    }

    try {
        const data = await getPageContent(handle);

        // Resolve any GIDs in section images before returning
        const resolvedData = await resolveImageGidsInSections(data);

        const response = NextResponse.json(resolvedData || { sections: [] });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    } catch (error) {
        console.error("Failed to fetch page content:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle");
    const directId = searchParams.get("id"); // New: accept ID directly

    if (!handle && !directId) {
        return NextResponse.json({ error: "Missing handle or id" }, { status: 400 });
    }

    try {
        let metaobjectId = directId;

        // If no direct ID provided, look up by handle/slug
        if (!metaobjectId) {
            const page = await getPageContentBySlug(handle!);
            if (!page || !page.metaobject_id) {
                return NextResponse.json({ error: "Page not found" }, { status: 404 });
            }
            metaobjectId = page.metaobject_id;
        }

        // Delete the metaobject
        await deletePageContent(metaobjectId as string);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete page:", error);
        return NextResponse.json({ error: error.message || "Failed to delete page" }, { status: 500 });
    }
}


import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { handle, data } = body;

        // DEBUG: Log received data

        if (!handle || !data) {
            return NextResponse.json({ error: "Missing handle or data" }, { status: 400 });
        }

        // Use the robust savePageData function with strict "page_content" type
        await savePageData(handle, data, "page_content");
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to update page content:", error);

        // Log to file for debugging
        try {
            const logPath = path.resolve(process.cwd(), 'server-error.log');
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ${error.message}\n${JSON.stringify(error, null, 2)}\n\n`;
            fs.appendFileSync(logPath, logMessage);
        } catch (e) {
            console.error("Failed to write to log file", e);
        }

        return NextResponse.json({ error: error.message || "Failed to update data" }, { status: 500 });
    }
}
