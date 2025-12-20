import { NextRequest, NextResponse } from "next/server";
import { generatePresignedUploadUrl, generateFileKey } from "@/lib/r2";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/r2/presign
 * Generate a presigned URL for direct client-side upload to R2
 * This bypasses Vercel's 4.5MB body size limit entirely
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { filename, contentType, folder } = await request.json();

        if (!filename || !contentType) {
            return NextResponse.json(
                { error: "filename and contentType are required" },
                { status: 400 }
            );
        }

        // Generate unique key and presigned URL
        const key = generateFileKey(filename, folder || "products");
        const { uploadUrl, publicUrl } = await generatePresignedUploadUrl(key, contentType);

        return NextResponse.json({
            success: true,
            key,
            uploadUrl,
            publicUrl,
        });
    } catch (error: any) {
        console.error("[R2 Presign] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate presigned URL" },
            { status: 500 }
        );
    }
}
