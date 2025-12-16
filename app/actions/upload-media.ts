"use server";

import { uploadFileToShopify, pollForFileUrl } from "@/lib/shopify-admin";
import { verifyToken } from "@/lib/auth";

export async function uploadMediaAction(formData: FormData) {
    try {
        const token = formData.get("token") as string;
        const file = formData.get("file") as File;

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

        console.log(`[UploadAction] Starting upload for ${file.name} (${file.size} bytes)`);

        // Upload to Shopify
        const fileId = await uploadFileToShopify(file);

        // Poll for URL (optional, but good for UI feedback)
        // Note: Polling might take time, we might want to return ID and let client poll?
        // But for <50MB it should be reasonably fast.
        const url = await pollForFileUrl(fileId);

        return { success: true, fileId, url };
    } catch (error: any) {
        console.error("[UploadAction] Failed:", error);
        return { success: false, error: error.message || "Upload failed" };
    }
}
