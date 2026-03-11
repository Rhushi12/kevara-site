import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// Opt out of caching for admin data
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // 1. Fetch User Signups (last 100 for trend)
        const usersSnapshot = await db.collection("users")
            .orderBy("createdAt", "desc")
            .limit(100)
            .get();

        const usersData = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                data.createdAt = data.createdAt.toDate().toISOString();
            } else if (data.createdAt instanceof Date) {
                data.createdAt = data.createdAt.toISOString();
            }
            return data;
        });

        // 2. Fetch Page Views for the last 7 days
        const pageViews: Record<string, number> = {};
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            pageViews[dateStr] = 0;
            return dateStr;
        });

        try {
            const viewsSnapshot = await db.collection('page_views').get();
            viewsSnapshot.docs.forEach(doc => {
                const dateStr = doc.id; // doc IDs are like "2026-03-11"
                const count = doc.data()?.count || 0;
                if (pageViews[dateStr] !== undefined) {
                    pageViews[dateStr] = count;
                }
            });
        } catch (e) {
            console.error("[Analytics] Failed to fetch page views:", e);
        }

        return NextResponse.json({
            users: usersData,
            pageViews,
        });

    } catch (error: any) {
        console.error("Analytics API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
