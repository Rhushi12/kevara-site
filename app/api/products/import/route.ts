import { NextRequest, NextResponse } from "next/server";
import { createCustomProduct } from "@/lib/custom-products";
import { requireAdmin } from "@/lib/auth";
import { generateFileKey, uploadToR2 } from "@/lib/r2";
import sharp from "sharp";

// Route segment config
export const maxDuration = 300; // 5 minutes for bulk operations
export const dynamic = 'force-dynamic';

// Image optimization settings (matching client-side compression)
const IMAGE_MAX_WIDTH = 1600;
const IMAGE_QUALITY = 80;

// Common color name to hex mapping
const COLOR_MAP: Record<string, string> = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#DC2626',
    'blue': '#2563EB',
    'green': '#16A34A',
    'yellow': '#EAB308',
    'pink': '#EC4899',
    'purple': '#9333EA',
    'gray': '#6B7280',
    'grey': '#6B7280',
    'beige': '#D4C5B0',
    'navy': '#1E3A5F',
    'burgundy': '#800020',
    'brown': '#8B4513',
    'orange': '#F97316',
    'teal': '#0D9488',
    'maroon': '#800000',
};

// Helper to parse CSV line correctly handling quotes
function parseCSVLine(text: string) {
    const result = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell.trim());
    return result.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
}

// Extract product name from image URL
function extractTitleFromImageUrl(url: string, rowIndex?: number): string {
    try {
        const urlPath = new URL(url).pathname;
        const filename = urlPath.split('/').pop() || '';
        // Remove extension and clean up, but KEEP numbers for uniqueness
        const name = filename
            .replace(/\.(jpg|jpeg|png|webp|gif)$/i, '')
            .replace(/___/g, ' - ')
            .replace(/_/g, ' ')
            .replace(/KONICA/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        // If name is too short or generic after cleanup, use file number
        if (!name || name.length < 3) {
            // Try to extract just the number from filename
            const numMatch = filename.match(/(\d+)/);
            if (numMatch) {
                return `Product ${numMatch[1]}`;
            }
            return `Product ${rowIndex || Date.now()}`;
        }

        return name;
    } catch {
        return `Product ${rowIndex || Date.now()}`;
    }
}

// Check if URL is already an R2 URL
function isR2Url(url: string): boolean {
    return url.includes('r2.dev') || url.includes('r2.cloudflarestorage.com');
}

// Optimize image using sharp (server-side)
async function optimizeImage(buffer: Buffer): Promise<Buffer> {
    try {
        const image = sharp(buffer);
        const metadata = await image.metadata();

        const originalSize = buffer.length;

        // Resize if wider than max width, maintaining aspect ratio
        let pipeline = image;
        if (metadata.width && metadata.width > IMAGE_MAX_WIDTH) {
            pipeline = pipeline.resize(IMAGE_MAX_WIDTH, null, {
                withoutEnlargement: true,
                fit: 'inside'
            });
        }

        // Convert to optimized JPEG
        const optimized = await pipeline
            .jpeg({ quality: IMAGE_QUALITY, progressive: true })
            .toBuffer();

        const newSize = optimized.length;
        const savings = Math.round((1 - newSize / originalSize) * 100);

        return optimized;
    } catch (error) {
        console.error('[Bulk Import] Image optimization failed, using original:', error);
        return buffer; // Fallback to original if optimization fails
    }
}

// Download image from URL, optimize, and upload to R2
async function processImageUrl(url: string, folder: string = "products"): Promise<string | null> {
    try {
        // If already an R2 URL, use it directly!
        if (isR2Url(url)) {
            return url;
        }


        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*,*/*;q=0.8',
            },
            signal: controller.signal,
            redirect: 'follow',
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            console.error(`[Bulk Import] Failed to download ${url}: ${res.status}`);
            return null;
        }

        const contentType = res.headers.get('content-type') || 'image/jpeg';

        if (contentType.includes('text/html')) {
            console.error(`[Bulk Import] Got HTML instead of image. Skipping: ${url}`);
            return null;
        }

        let buffer: Buffer = Buffer.from(await res.arrayBuffer());

        if (buffer.length < 1000) {
            console.error(`[Bulk Import] File too small (${buffer.length} bytes): ${url}`);
            return null;
        }

        // Optimize image using sharp
        const optimizedBuffer = await optimizeImage(buffer);

        const filename = `image_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`;
        const key = generateFileKey(filename, folder);
        const publicUrl = await uploadToR2(optimizedBuffer, key, 'image/jpeg');

        return publicUrl;
    } catch (error) {
        console.error(`[Bulk Import] Error processing ${url}:`, error);
        return null;
    }
}

// Parse color string (handles both "black" and "black:#000000" formats)
function parseColors(colorStr: string): { name: string; hex: string }[] {
    if (!colorStr) return [];

    return colorStr.split('|').map(c => {
        const trimmed = c.trim().toLowerCase();

        // Check if it has hex code (format: "name:#hex")
        if (trimmed.includes(':')) {
            const [name, hex] = trimmed.split(':');
            return { name: name.trim(), hex: hex.trim() };
        }

        // Just a color name - look up hex
        const hex = COLOR_MAP[trimmed] || '#000000';
        return { name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1), hex };
    }).filter(c => c.name);
}

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const authError = await requireAdmin(req);
        if (authError) return authError;

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('.'));
        const headers = parseCSVLine(lines[0].toLowerCase());


        const results = [];
        const errors = [];

        // Process rows (skip header)
        for (let i = 1; i < lines.length; i++) {
            try {
                const row = parseCSVLine(lines[i]);
                if (row.length < 2) continue;

                const data: any = {};
                headers.forEach((h, idx) => {
                    data[h] = row[idx];
                });

                // Handle Images first (we may need it for title)
                const imageUrls: string[] = [];
                if (data.images) {
                    const urls = data.images.split(',').map((u: string) => u.trim());
                    for (const url of urls) {
                        if (url && url.startsWith('http')) {
                            const finalUrl = await processImageUrl(url, "products");
                            if (finalUrl) {
                                imageUrls.push(finalUrl);
                            }
                        }
                    }
                }

                // Auto-generate title from image URL if missing
                let title = data.title;
                if (!title && imageUrls.length > 0) {
                    title = extractTitleFromImageUrl(data.images.split(',')[0].trim(), i + 1);
                }

                // Validation - now with auto-generated title
                if (!title || !data.price) {
                    errors.push(`Row ${i + 1}: Missing title or price (title="${title}", price="${data.price}")`);
                    continue;
                }


                // Handle Video URL
                let videoUrl: string | undefined;
                if (data.video && data.video.startsWith('http') && !data.video.includes('example.com')) {
                    const finalVideoUrl = await processImageUrl(data.video.trim(), "videos");
                    if (finalVideoUrl) {
                        videoUrl = finalVideoUrl;
                    }
                }

                // Handle Colors with flexible format
                const colors = parseColors(data.colors);

                // Handle Sizes
                let sizes: string[] = [];
                if (data.sizes) {
                    sizes = data.sizes.split(',').map((s: string) => s.trim().toUpperCase());
                }


                // Create Product
                const product = await createCustomProduct({
                    title,
                    description: data.description || "",
                    price: data.price,
                    currency: data.currency || "INR",
                    imageUrls,
                    videoUrl,
                    colors,
                    sizes,
                    status: data.status || "ACTIVE"
                });

                results.push({ row: i + 1, title, handle: product?.handle, slug: product?.slug, images: imageUrls.length, status: 'success' });

            } catch (err: any) {
                console.error(`Error processing row ${i + 1}:`, err);
                errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }

        return NextResponse.json({ success: true, results, errors });

    } catch (error: any) {
        console.error("Bulk upload failed:", error);
        return NextResponse.json({ error: error.message || "Bulk upload failed" }, { status: 500 });
    }
}

