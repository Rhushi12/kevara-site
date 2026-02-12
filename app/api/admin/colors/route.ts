import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// Collection name for storing custom colors
const COLORS_COLLECTION = "custom_colors";
const COLORS_DOC = "all_colors";

export interface CustomColor {
    name: string;
    hex: string;
    usageCount?: number;
    lastUsed?: string;
}

// GET - Fetch all saved custom colors
export async function GET() {
    try {
        const docRef = db.collection(COLORS_COLLECTION).doc(COLORS_DOC);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ colors: [] });
        }

        const data = doc.data();
        const colors: CustomColor[] = data?.colors || [];

        // Sort by usage count (most used first)
        colors.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

        return NextResponse.json({ colors });
    } catch (error: any) {
        console.error("[/api/admin/colors] GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch colors" },
            { status: 500 }
        );
    }
}

// POST - Add a new custom color
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, hex } = body;

        if (!name || !hex) {
            return NextResponse.json(
                { error: "Color name and hex are required" },
                { status: 400 }
            );
        }

        // Normalize hex to uppercase
        const normalizedHex = hex.toUpperCase();

        const docRef = db.collection(COLORS_COLLECTION).doc(COLORS_DOC);
        const doc = await docRef.get();

        let colors: CustomColor[] = [];
        if (doc.exists) {
            colors = doc.data()?.colors || [];
        }

        // Check if color already exists (by hex)
        const existingIndex = colors.findIndex(
            (c) => c.hex.toUpperCase() === normalizedHex
        );

        if (existingIndex >= 0) {
            // Update usage count and last used
            colors[existingIndex].usageCount = (colors[existingIndex].usageCount || 0) + 1;
            colors[existingIndex].lastUsed = new Date().toISOString();
            // Update name if different (user might rename)
            colors[existingIndex].name = name;
        } else {
            // Add new color
            colors.push({
                name,
                hex: normalizedHex,
                usageCount: 1,
                lastUsed: new Date().toISOString()
            });
        }

        await docRef.set({ colors });

        return NextResponse.json({ success: true, colors });
    } catch (error: any) {
        console.error("[/api/admin/colors] POST Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to save color" },
            { status: 500 }
        );
    }
}

