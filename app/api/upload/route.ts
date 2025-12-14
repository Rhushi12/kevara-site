import { NextRequest, NextResponse } from "next/server";
import { uploadFileToShopify, pollForFileUrl } from "@/lib/shopify-admin";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const authError = await requireAdmin(req);
        if (authError) return authError;

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const fileId = await uploadFileToShopify(file);

        // We can't easily get the URL immediately because Shopify processes it asynchronously.
        // However, for the purpose of the UI, we might need it.
        // The `uploadFileToShopify` function returns the ID.
        // We might need to poll or just return the ID and let the frontend handle it?
        // Or we can return a temporary URL or just the ID.
        // The frontend expects { src: url }.
        // Let's return the ID and maybe a placeholder or try to construct the URL if possible?
        // Actually, `uploadFileToShopify` returns the ID.
        // We can return { id: fileId, src: "gid://..." } effectively.
        // But the frontend needs a displayable URL.
        // For now, let's return the ID. The frontend might need to refetch or we accept that it won't show immediately?
        // Wait, `uploadFileToShopify` logic:
        /*
          ... on GenericFile { url }
          ... on MediaImage { image { url } }
        */
        // It returns `fileData.fileCreate.files[0].id`.
        // It doesn't return the URL because it's not ready yet.
        // This is a limitation.
        // For now, we will return the ID. The frontend can use `URL.createObjectURL(file)` for immediate preview,
        // and store the ID for the backend.

        // Poll for the URL so we can return a permanent link
        const url = await pollForFileUrl(fileId);

        return NextResponse.json({ success: true, fileId, url });
    } catch (error: any) {
        console.error("Upload failed:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
