
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { MenuItem } from "@/lib/menuData";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const docRef = db.collection("config").doc("navigation");
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            return NextResponse.json({ items: data?.items || [] });
        } else {
            return NextResponse.json({ items: [] });
        }
    } catch (error: any) {
        console.error("Menu API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch menu" },
            { status: 500 }
        );
    }
}
