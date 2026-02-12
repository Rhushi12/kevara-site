"use server";

import { generatePresignedUploadUrl, generateFileKey, uploadToR2 } from "@/lib/r2";
import { verifyToken } from "@/lib/auth";

export async function uploadMediaAction(formData: FormData) {
    try {
        const token = formData.get("token") as string;
        const file = formData.get("file") as File;
        const folder = (formData.get("folder") as string) || "media";

        if (!token) {
            return { success: false, error: "Authentication required" };
        }

        if (!file) {
            return { success: false, error: "No file provided" };
        }

        // Verify Auth
        const authResult = await verifyToken(token);
        if (!authResult.authenticated) {
            return { success: false, error: authResult.error || "Unauthorized" };
        }


        // Generate unique key and upload to R2
        const key = generateFileKey(file.name, folder);
        const url = await uploadToR2(file, key, file.type);


        // Return URL directly (no fileId for R2, just the URL)
        return { success: true, url, fileId: key };
    } catch (error: any) {
        console.error("[UploadAction] Failed:", error);
        return { success: false, error: error.message || "Upload failed" };
    }
}

/**
 * Get a presigned URL for client-side direct upload to R2
 * This bypasses Vercel's 4.5MB limit entirely
 */
export async function getPresignedUploadUrl(token: string, filename: string, contentType: string, folder: string = "media") {
    try {
        // Verify Auth
        const authResult = await verifyToken(token);
        if (!authResult.authenticated) {
            return { success: false, error: authResult.error || "Unauthorized" };
        }

        const key = generateFileKey(filename, folder);
        const { uploadUrl, publicUrl } = await generatePresignedUploadUrl(key, contentType);

        return { success: true, uploadUrl, publicUrl, key };
    } catch (error: any) {
        console.error("[getPresignedUploadUrl] Failed:", error);
        return { success: false, error: error.message || "Failed to get upload URL" };
    }
}
