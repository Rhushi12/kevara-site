
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        // Fetch all users without orderBy, because Firestore drops documents missing the orderBy field
        const usersSnapshot = await db.collection("users").get();

        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || "Unknown",
                email: data.email || "",
                role: data.role || "user",
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
                lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin || null
            };
        });
        // Sort in memory to include users missing createdAt
        users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ users });

    } catch (error: any) {
        console.error("Users API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch users" },
            { status: 500 }
        );
    }
}
