import { MetadataRoute } from 'next';
import { getCustomProducts } from '@/lib/custom-products';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Update daily

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kevara.in';

    // Base static routes
    const routes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/collections/all`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/about-story`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/account/returns`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
    ];

    try {
        // Fetch custom products from Shopify metaobjects (same source as PDP)
        const products = await getCustomProducts();
        
        products.forEach((edge: any) => {
            const product = edge.node;
            if (product && product.handle) {
                routes.push({
                    url: `${baseUrl}/products/${product.handle}`,
                    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
                    changeFrequency: 'weekly',
                    priority: 0.8,
                });
            }
        });
    } catch (error) {
        console.error("[Sitemap] Failed to fetch products for sitemap:", error);
    }

    return routes;
}
