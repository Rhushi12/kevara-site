
import { NextResponse } from 'next/server';
import { uploadFileToShopify, pollForFileUrl } from '@/lib/shopify-admin';

export async function POST(request: Request) {
    try {
        console.log("[DebugForm] Received request");
        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: "No file found" }, { status: 400 });
        }

        console.log(`[DebugForm] Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}`);

        // Use the exact same function used in product creation
        const gid = await uploadFileToShopify(file);
        console.log(`[DebugForm] Uploaded, GID: ${gid}`);

        // Poll for status
        const url = await pollForFileUrl(gid, 20, 1000); // 20s wait

        return NextResponse.json({
            success: true,
            gid,
            url,
            fileDetails: {
                name: file.name,
                type: file.type,
                size: file.size
            },
            fileStatus: url ? "READY" : "Checking..."
        });

    } catch (error: any) {
        console.error("[DebugForm] Error:", error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
