import { Product } from "@/lib/store";
import { parseProductTitle } from "@/lib/productUtils";

/**
 * Expands products that have per-color variant images into separate virtual product entries.
 * 
 * A product with 3 colors (each having images in `variantImages`) will become 3 separate
 * product entries in the returned array — one per color. Each entry uses that color's images
 * as its `images.edges`, and appends the color name to the title.
 * 
 * Products without `variantImages` pass through unchanged.
 * Colors without images are excluded entirely.
 */
export function expandProductsByColor(products: Product[]): Product[] {
    const expanded: Product[] = [];

    for (const product of products) {
        const node = product.node as any;
        const variantImages: Record<string, string[]> | undefined = node.variantImages;

        // If this product has variant images with at least one color that has images, expand it
        if (variantImages && Object.keys(variantImages).length > 0) {
            const colorsWithImages = Object.entries(variantImages).filter(
                ([, urls]) => urls && urls.length > 0
            );

            if (colorsWithImages.length === 0) {
                // No color has images — skip entirely
                continue;
            }

            // Find matching color metadata (hex) from the product's colors array
            const productColors: { name: string; hex: string }[] = node.colors || [];

            for (const [colorName, colorImageUrls] of colorsWithImages) {
                const colorMeta = productColors.find(
                    (c) => c.name.toLowerCase() === colorName.toLowerCase()
                );
                const hex = colorMeta?.hex || "#000000";

                // Parse the clean title (without batch number)
                const { cleanTitle } = parseProductTitle(node.title || "");
                const expandedTitle = `${cleanTitle} — ${colorName}`;

                const expandedProduct: Product = {
                    node: {
                        ...node,
                        // Override title with color-appended version
                        title: expandedTitle,
                        // Override images with color-specific images
                        images: {
                            edges: colorImageUrls.map((url: string) => ({
                                node: {
                                    url,
                                    altText: `${cleanTitle} ${colorName}`,
                                },
                            })),
                        },
                        // Add color variant metadata for ProductCard to use
                        _colorVariant: {
                            name: colorName,
                            hex,
                            isExpanded: true,
                        },
                    },
                };

                expanded.push(expandedProduct);
            }
        } else {
            // No variant images — check if the product has any images at all
            const hasImages = node.images?.edges?.length > 0;
            if (hasImages) {
                expanded.push(product);
            }
            // If no images at all, skip entirely
        }
    }

    return expanded;
}
