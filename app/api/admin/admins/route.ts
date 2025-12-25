import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

// GET - Fetch all admin emails
export async function GET() {
    try {
        const adminsDoc = await db.collection('settings').doc('admins').get();

        if (!adminsDoc.exists) {
            // Return default admin if no settings exist
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

// POST - Add a new admin email
export async function POST(req: Request) {
    try {
        const { email, requesterEmail } = await req.json();

        if (!email || !requesterEmail) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        // Verify requester is an admin
        const adminsDoc = await db.collection('settings').doc('admins').get();
        let currentAdmins: string[] = [];

        if (adminsDoc.exists) {
            currentAdmins = adminsDoc.data()?.emails || [];
        } else {
            // Initialize with env variable admins
            const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "rhushimanumehta@gmail.com")
                .split(",").map(e => e.trim().toLowerCase());
            currentAdmins = envAdmins;
        }

        if (!currentAdmins.includes(requesterEmail.toLowerCase())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Add new admin
        const newEmail = email.trim().toLowerCase();
        if (!currentAdmins.includes(newEmail)) {
            currentAdmins.push(newEmail);
        }

        await db.collection('settings').doc('admins').set({
            emails: currentAdmins,
            updatedAt: new Date(),
            updatedBy: requesterEmail
        });

        return NextResponse.json({ success: true, emails: currentAdmins });
    } catch (error) {
        console.error("[Admin API] Error adding admin:", error);
        return NextResponse.json({ error: "Failed to add admin" }, { status: 500 });
    }
}

// DELETE - Remove an admin email
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const requesterEmail = searchParams.get('requester');

        if (!email || !requesterEmail) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        // Verify requester is an admin
        const adminsDoc = await db.collection('settings').doc('admins').get();
        let currentAdmins: string[] = [];

        if (adminsDoc.exists) {
            currentAdmins = adminsDoc.data()?.emails || [];
        }

        if (!currentAdmins.includes(requesterEmail.toLowerCase())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Prevent removing the last admin
        if (currentAdmins.length <= 1) {
            return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 });
        }

        // Remove admin
        const updatedAdmins = currentAdmins.filter(e => e !== email.toLowerCase());

        await db.collection('settings').doc('admins').set({
            emails: updatedAdmins,
            updatedAt: new Date(),
            updatedBy: requesterEmail
        });

        return NextResponse.json({ success: true, emails: updatedAdmins });
    } catch (error) {
        console.error("[Admin API] Error removing admin:", error);
        return NextResponse.json({ error: "Failed to remove admin" }, { status: 500 });
    }
}
