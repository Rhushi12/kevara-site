import { NextResponse } from 'next/server';
import { getHeroSlides, updateHeroSlide } from '@/lib/shopify-admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || "";

    try {
        const slides = await getHeroSlides(prefix);
        return NextResponse.json(slides);
    } catch (error) {
        console.error("Failed to fetch hero slides:", error);
        return NextResponse.json({ error: "Failed to fetch hero slides" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { handle, data } = body;

        if (!handle || !data) {
            return NextResponse.json({ error: "Missing handle or data" }, { status: 400 });
        }

        const result = await updateHeroSlide(handle, data);
        return NextResponse.json({ success: true, id: result });
    } catch (error) {
        console.error("Failed to update hero slide:", error);
        return NextResponse.json({ error: "Failed to update hero slide" }, { status: 500 });
    }
}
