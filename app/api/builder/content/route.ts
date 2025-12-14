import { NextRequest, NextResponse } from "next/server";
import { getPageContent, deletePageContent, getPageContentBySlug, pollForFileUrl } from "@/lib/shopify-admin";
import { savePageData } from "@/lib/save-page-data";

export const dynamic = 'force-dynamic';

/**
 * Resolve all image GIDs in page sections to URLs
 * This fixes broken images where image_id contains GID but image URL is missing/expired
 */
async function resolveImageGidsInSections(pageData: any): Promise<any> {
    if (!pageData || !pageData.sections) return pageData;

    // Collect all GIDs that need resolution
    const gidsToResolve: { path: string; gid: string }[] = [];

    // Recursively find GIDs in settings
    function findGidsInObject(obj: any, path: string) {
        if (!obj || typeof obj !== 'object') return;

        if (Array.isArray(obj)) {
            obj.forEach((item, i) => findGidsInObject(item, `${path}[${i}]`));
        } else {
            for (const key of Object.keys(obj)) {
                const value = obj[key];

                // Check for image_id that's a GID
                if (key === 'image_id' && typeof value === 'string' && value.startsWith('gid://')) {
                    // Check if corresponding image field is missing or also a GID
                    const imageValue = obj.image;
                    if (!imageValue || (typeof imageValue === 'string' && imageValue.startsWith('gid://'))) {
                        gidsToResolve.push({ path: `${path}.image`, gid: value });
                    }
                }

                // Recurse into nested objects
                if (typeof value === 'object') {
                    findGidsInObject(value, `${path}.${key}`);
                }
            }
        }
    }

    // Find all GIDs
    pageData.sections.forEach((section: any, i: number) => {
        findGidsInObject(section.settings, `sections[${i}].settings`);
    });

    if (gidsToResolve.length === 0) return pageData;

    console.log(`[resolveImageGidsInSections] Resolving ${gidsToResolve.length} image GIDs...`);

    // Resolve GIDs in parallel (with reduced polling for speed)
    const results = await Promise.all(
        gidsToResolve.map(async ({ path, gid }) => {
            try {
                const url = await pollForFileUrl(gid, 3, 500); // Faster polling - 3 attempts, 500ms each
                return { path, url };
            } catch (e) {
                console.error(`[resolveImageGidsInSections] Failed to resolve ${gid}:`, e);
                return { path, url: null };
            }
        })
    );

    // Apply resolved URLs to page data
    const resolvedData = JSON.parse(JSON.stringify(pageData)); // Deep clone

    for (const { path, url } of results) {
        if (!url) continue;

        // Parse path and set value
        const parts = path.match(/([^\[\]\.]+|\d+)/g);
        if (!parts) continue;

        let obj = resolvedData;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            obj = obj[isNaN(Number(key)) ? key : Number(key)];
            if (!obj) break;
        }

        if (obj) {
            const lastKey = parts[parts.length - 1];
            obj[isNaN(Number(lastKey)) ? lastKey : Number(lastKey)] = url;
        }
    }

    console.log(`[resolveImageGidsInSections] Resolved ${results.filter(r => r.url).length} URLs`);

    return resolvedData;
}

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

    if (!handle) {
        return NextResponse.json({ error: "Missing handle" }, { status: 400 });
    }

    try {
        // 1. Find the page to get its ID
        const page = await getPageContentBySlug(handle);
        if (!page || !page.metaobject_id) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        // 2. Delete it
        await deletePageContent(page.metaobject_id);

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
        console.log(`[API /builder/content POST] Received for handle '${handle}'`);
        console.log(`[API /builder/content POST] Has sections:`, !!data?.sections);
        console.log(`[API /builder/content POST] Sections count:`, data?.sections?.length);
        console.log(`[API /builder/content POST] Section types:`, data?.sections?.map((s: any) => s?.type));

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
