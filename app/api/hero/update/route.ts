import { NextRequest, NextResponse } from "next/server";
import { updateHeroSlide } from "@/lib/shopify-admin";
import { uploadToR2, generateFileKey } from "@/lib/r2";
import { requireAdmin } from "@/lib/auth";

export const maxDuration = 60; // 60 seconds timeout for file uploads
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const authError = await requireAdmin(req);
        if (authError) return authError;

        const formData = await req.formData();

        // Extract text fields
        const handle = formData.get("handle") as string;
        const heading = formData.get("heading");
        const subheading = formData.get("subheading");
        const buttonText = formData.get("buttonText");
        const link = formData.get("link");

        // Extract file
        const file = formData.get("file") as File | null;
        let fileUrl = null;

        if (file && file.size > 0) {
            console.log(`[Hero Update] Uploading file to R2: ${file.name} (${file.size} bytes)`);

            // Upload to R2 instead of Shopify
            const key = generateFileKey(file.name, "hero");
            fileUrl = await uploadToR2(file, key, file.type);

            console.log(`[Hero Update] R2 upload complete: ${fileUrl}`);
        }

        // Update Metaobject with the R2 URL
        // Note: updateHeroSlide might need to be updated to accept URL instead of fileId
        const updateResult = await updateHeroSlide(handle, {
            heading,
            subheading,
            buttonText,
            link,
            fileUrl // Pass R2 URL instead of Shopify file ID
        });

        return NextResponse.json({ success: true, data: updateResult });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to update slide" }, { status: 500 });
    }
}
