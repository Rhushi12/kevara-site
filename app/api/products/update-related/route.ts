import { NextResponse } from "next/server";
import { updateProductRelatedItems } from "@/lib/custom-products";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { handle, relatedIds } = body;

        if (!handle || !Array.isArray(relatedIds)) {
            return NextResponse.json(
                { error: "Missing required fields: handle and relatedIds array" },
                { status: 400 }
            );
        }

        await updateProductRelatedItems(handle, relatedIds);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating related products:", error);
        return NextResponse.json(
            { error: "Failed to update related products" },
            { status: 500 }
        );
    }
}
