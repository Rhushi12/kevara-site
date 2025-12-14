import { NextResponse } from "next/server";
import { getGlobalMenu } from "@/lib/shopify-admin";

export const dynamic = 'force-dynamic'; // Ensure it's not cached statically

export async function GET() {
    try {
        const menuData = await getGlobalMenu();
        if (!menuData) {
            return NextResponse.json({ error: "Menu not found" }, { status: 404 });
        }

        // Add cache headers for 60 seconds, stale-while-revalidate for 5 minutes
        const response = NextResponse.json(menuData);
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        return response;
    } catch (error) {
        console.error("Failed to fetch navigation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
