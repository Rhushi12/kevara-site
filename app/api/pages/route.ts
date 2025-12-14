import { NextRequest, NextResponse } from 'next/server';
import { getCollectionPage, updateCollectionPage } from '@/lib/shopify-admin';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');

    if (!handle) {
        return NextResponse.json({ error: "Missing handle" }, { status: 400 });
    }

    try {
        const pageData = await getCollectionPage(handle);
        return NextResponse.json(pageData || {});
    } catch (error) {
        console.error("Failed to fetch page:", error);
        return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const body = await request.json();
        const { handle, data } = body;

        if (!handle || !data) {
            return NextResponse.json({ error: "Missing handle or data" }, { status: 400 });
        }

        const result = await updateCollectionPage(handle, data);

        if (result.metaobjectUpsert?.userErrors?.length > 0) {
            return NextResponse.json({ success: false, errors: result.metaobjectUpsert.userErrors }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to save page:", error);
        return NextResponse.json({ error: error.message || "Failed to save page" }, { status: 500 });
    }
}

