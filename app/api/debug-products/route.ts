import { NextResponse } from 'next/server';
import { uploadFileToShopify, pollForFileUrl } from '@/lib/simple-admin';

export async function GET() {
  try {
    console.log("Starting debug upload test...");

    // 1. Fetch a real image (small valid PNG)
    const imageUrl = "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // 2. Create a File-like object (avoid new File() in Node)
    const file = {
      name: "debug-test-image.png",
      type: "image/png",
      size: arrayBuffer.byteLength,
      arrayBuffer: async () => arrayBuffer
    };

    // 3. Attempt Upload
    console.log("[debug-products] Starting upload...");
    const gid = await uploadFileToShopify(file);
    console.log("[debug-products] Uploaded, GID:", gid);

    // 4. Poll for status
    console.log("[debug-products] Polling for status...");
    const url = await pollForFileUrl(gid, 5, 2000);

    return NextResponse.json({
      success: true,
      gid,
      url,
      message: url ? "Upload successful and READY" : "Upload finished but URL not found (check status)"
    });

  } catch (error: any) {
    console.error("[debug-products] Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 200 });
  }
}
