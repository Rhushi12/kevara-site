import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireAdmin, getVerifiedAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

// GET - Fetch all admin emails (admin-only)
export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        const adminsDoc = await db.collection('settings').doc('admins').get();

        if (!adminsDoc.exists) {
            const defaultAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",")[0] || "rhushimanumehta@gmail.com";
            return NextResponse.json({ emails: [defaultAdmin.trim().toLowerCase()] });
        }

        const data = adminsDoc.data();
        return NextResponse.json({ emails: data?.emails || [] });
    } catch (error) {
        console.error("[Admin API] Error fetching admins:", error);
        return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
    }
}

// POST - Add a new admin email (admin-only, verified via Firebase token)
export async function POST(req: NextRequest) {
    const { error: authError, auth } = await getVerifiedAdmin(req);
    if (authError) return authError;

    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const adminsDoc = await db.collection('settings').doc('admins').get();
        let currentAdmins: string[] = [];

        if (adminsDoc.exists) {
            currentAdmins = adminsDoc.data()?.emails || [];
        } else {
            const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "rhushimanumehta@gmail.com")
                .split(",").map(e => e.trim().toLowerCase());
            currentAdmins = envAdmins;
        }

        // Add new admin
        const newEmail = email.trim().toLowerCase();
        if (!currentAdmins.includes(newEmail)) {
            currentAdmins.push(newEmail);
        }

        await db.collection('settings').doc('admins').set({
            emails: currentAdmins,
            updatedAt: new Date(),
            updatedBy: auth.email // from verified token, not from body
        });

        return NextResponse.json({ success: true, emails: currentAdmins });
    } catch (error) {
        console.error("[Admin API] Error adding admin:", error);
        return NextResponse.json({ error: "Failed to add admin" }, { status: 500 });
    }
}

// DELETE - Remove an admin email (admin-only, verified via Firebase token)
export async function DELETE(req: NextRequest) {
    const { error: authError, auth } = await getVerifiedAdmin(req);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const adminsDoc = await db.collection('settings').doc('admins').get();
        let currentAdmins: string[] = [];

        if (adminsDoc.exists) {
            currentAdmins = adminsDoc.data()?.emails || [];
        }

        // Prevent removing the last admin
        if (currentAdmins.length <= 1) {
            return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 });
        }

        // Prevent admins from removing themselves
        if (email.toLowerCase() === auth.email?.toLowerCase()) {
            return NextResponse.json({ error: "Cannot remove your own admin access" }, { status: 400 });
        }

        const updatedAdmins = currentAdmins.filter(e => e !== email.toLowerCase());

        await db.collection('settings').doc('admins').set({
            emails: updatedAdmins,
            updatedAt: new Date(),
            updatedBy: auth.email // from verified token
        });

        return NextResponse.json({ success: true, emails: updatedAdmins });
    } catch (error) {
        console.error("[Admin API] Error removing admin:", error);
        return NextResponse.json({ error: "Failed to remove admin" }, { status: 500 });
    }
}
