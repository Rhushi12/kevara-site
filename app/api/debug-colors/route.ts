import { NextResponse } from 'next/server';
import { getCustomProducts } from '@/lib/custom-products';

export async function GET() {
    try {
        const products = await getCustomProducts();
        
        const debugData = products.map((p: any) => ({
            title: p.node.title,
            colors: p.node.colors,
            sizes: p.node.sizes,
        })).slice(0, 10);
        
        return NextResponse.json({ success: true, count: products.length, products: debugData });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
