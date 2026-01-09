
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// Opt out of caching for admin data
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Authenticate user - in a real app, verify session here
        // For now, we assume middleware/layout handles protection access or we add a check

        // 1. Fetch User Signups (last 50 for trend or all for count depending on need)
        // We'll fetch last 100 to get a good distribution for the last 7 days chart
        const usersSnapshot = await db.collection("users")
            .orderBy("createdAt", "desc")
            .limit(100)
            .get();

        const usersData = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert timestamps to ISO strings for serialization
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                data.createdAt = data.createdAt.toDate().toISOString();
            } else if (data.createdAt instanceof Date) {
                data.createdAt = data.createdAt.toISOString();
            }
            return data;
        });

        // 2. Fetch Page Views for last 7 days
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const viewsPromises = last7Days.map(async (date) => {
            const docRef = db.collection("page_views").doc(date);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                return { date, count: docSnap.data()?.count || 0 };
            }
            return { date, count: 0 };
        });

        const viewsData = await Promise.all(viewsPromises);

        return NextResponse.json({
            users: usersData,
            views: viewsData
        });

    } catch (error: any) {
        console.error("Analytics API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
