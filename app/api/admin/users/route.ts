
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        // Fetch all users
        const usersSnapshot = await db.collection("users")
            .orderBy("createdAt", "desc")
            .get();

        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || "Unknown",
                email: data.email || "",
                role: data.role || "user",
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
                ...data
            };
        });

        return NextResponse.json({ users });

    } catch (error: any) {
        console.error("Users API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch users" },
            { status: 500 }
        );
    }
}
