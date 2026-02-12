import { NextRequest, NextResponse } from "next/server";
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
        const file = formData.get("file") as File | null;
        const folder = (formData.get("folder") as string) || "uploads";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }


        // Generate unique key and upload to R2
        const key = generateFileKey(file.name, folder);
        const url = await uploadToR2(file, key, file.type);


        return NextResponse.json({ success: true, fileId: key, url });
    } catch (error: any) {
        console.error("Upload failed:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
