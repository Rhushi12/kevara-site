
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const docRef = db.collection("config").doc("seo");
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            return NextResponse.json(docSnap.data());
        } else {
            // Default config if none exists
            return NextResponse.json({
                ogImage: '/og-image.jpg',
                description: "Discover Kevara's high-end fashion collection."
            });
        }
    } catch (error: any) {
        console.error("SEO API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch SEO config" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.ogImage && !body.description && !body.title) {
            return NextResponse.json({ error: "No data to update" }, { status: 400 });
        }

        const docRef = db.collection("config").doc("seo");
        await docRef.set(body, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("SEO API Update Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update SEO config" },
            { status: 500 }
        );
    }
}
