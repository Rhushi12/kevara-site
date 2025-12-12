import { NextResponse } from 'next/server';
import { uploadFileToShopify, pollForFileUrl } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Starting debug PUT upload test...");

        // 1. Fetch a real image (small valid PNG)
        const imageUrl = "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();

        // 2. Create a File-like object (avoid new File() in Node)
        // IMPORTANT: shopify-admin.ts now expects a "File" which can be a plain object with arrayBuffer() method
        const file = {
            name: "debug-put-image.png",
            type: "image/png",
            size: arrayBuffer.byteLength,
            arrayBuffer: async () => arrayBuffer
        };

        // 3. Attempt Upload
        console.log("[debug-put] Starting upload...");
        const gid = await uploadFileToShopify(file);
        console.log("[debug-put] Uploaded, GID:", gid);

        // 4. Poll for status
        console.log("[debug-put] Polling for status...");
        const url = await pollForFileUrl(gid, 10, 2000);

        return NextResponse.json({
            success: true,
            gid,
            url,
            message: url ? "Upload successful and READY" : "Upload finished but URL not found (check status)"
        });

    } catch (error: any) {
        console.error("[debug-put] Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 200 });
    }
}
