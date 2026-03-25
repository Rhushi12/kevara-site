import { NextRequest, NextResponse } from "next/server";
import { getCustomProducts } from "@/lib/custom-products";
import { db } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        let productCount = 0;
        let userCount = 0;
        let todayViews = 0;
        let totalViews = 0;

        // 1. Fetch Products
        try {
            const products = await getCustomProducts();
            productCount = products.length;
        } catch (e) {
            console.error("[Admin Stats] Failed to fetch products:", e);
        }

        // 2. Fetch User Count from Firebase
        try {
            const usersSnapshot = await db.collection('users').get();
            userCount = usersSnapshot.size;
        } catch (e: any) {
            console.error("[Admin Stats] Failed to fetch users from Firebase:", e);
        }

        // 3. Fetch Today's Page Views + Total Views from Firebase
        try {
            const today = new Date().toISOString().split('T')[0];
            const viewsSnapshot = await db.collection('page_views').get();
            viewsSnapshot.docs.forEach(doc => {
                const count = doc.data()?.count || 0;
                totalViews += count;
                if (doc.id === today) {
                    todayViews = count;
                }
            });
        } catch (e: any) {
            console.error("[Admin Stats] Failed to fetch page views:", e);
        }

        return NextResponse.json({
            productCount,
            userCount,
            todayViews,
            totalViews
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json({ productCount: 0, userCount: 0, todayViews: 0, totalViews: 0 }, { status: 500 });
    }
}
