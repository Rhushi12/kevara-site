import { NextRequest, NextResponse } from "next/server";
import { updateGlobalMenu } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { menuTabs } = body;

        if (!menuTabs) {
            return NextResponse.json({ error: "Missing menuTabs" }, { status: 400 });
        }

        const result = await updateGlobalMenu(menuTabs);

        if (result.metaobjectUpsert?.userErrors?.length > 0) {
            return NextResponse.json({ error: result.metaobjectUpsert.userErrors }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Update failed:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
