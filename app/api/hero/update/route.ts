import { NextRequest, NextResponse } from "next/server";
import { updateHeroSlide, uploadFileToShopify } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        // Extract text fields
        const handle = formData.get("handle") as string;
        const heading = formData.get("heading");
        const subheading = formData.get("subheading");
        const buttonText = formData.get("buttonText");
        const link = formData.get("link");

        // Extract file
        const file = formData.get("file") as File | null;
        let fileId = null;

        if (file && file.size > 0) {
            console.log("Uploading file to Shopify...");
            fileId = await uploadFileToShopify(file);
        }

        // Update Metaobject
        const updateResult = await updateHeroSlide(handle, {
            heading,
            subheading,
            buttonText,
            link,
            fileId // Only pass if a new file was uploaded
        });

        return NextResponse.json({ success: true, data: updateResult });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to update slide" }, { status: 500 });
    }
}
