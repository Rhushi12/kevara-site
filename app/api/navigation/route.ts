import { NextResponse } from "next/server";
import { getGlobalMenu } from "@/lib/shopify-admin";

export const dynamic = 'force-dynamic'; // Ensure it's not cached statically

export async function GET() {
    try {
        const menuData = await getGlobalMenu();
        if (!menuData) {
            return NextResponse.json({ error: "Menu not found" }, { status: 404 });
        }
        return NextResponse.json(menuData);
    } catch (error) {
        console.error("Failed to fetch navigation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
