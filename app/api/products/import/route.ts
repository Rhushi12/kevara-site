import { NextRequest, NextResponse } from "next/server";
import { createCustomProduct } from "@/lib/custom-products";
import { uploadFileToShopify } from "@/lib/shopify-admin";

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

// Helper to fetch image from URL and convert to File-like object
async function fetchImageAsFile(url: string): Promise<File | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        const blob = await res.blob();
        const filename = url.split('/').pop()?.split('?')[0] || 'image.jpg';
        const type = res.headers.get('content-type') || 'image/jpeg';

        return new File([blob], filename, { type });
    } catch (e) {
        console.error(`Error fetching image ${url}:`, e);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        const headers = parseCSVLine(lines[0].toLowerCase());

        const results = [];
        const errors = [];

        // Process rows (skip header)
        for (let i = 1; i < lines.length; i++) {
            try {
                const row = parseCSVLine(lines[i]);
                if (row.length < 2) continue; // Skip empty rows

                const data: any = {};
                headers.forEach((h, idx) => {
                    data[h] = row[idx];
                });

                // Validation
                if (!data.title || !data.price) {
                    errors.push(`Row ${i + 1}: Missing title or price`);
                    continue;
                }

                // Handle Images
                const imageGids: string[] = [];
                if (data.images) {
                    const urls = data.images.split(',').map((u: string) => u.trim());
                    for (const url of urls) {
                        if (url) {
                            const imageFile = await fetchImageAsFile(url);
                            if (imageFile) {
                                const gid = await uploadFileToShopify(imageFile);
                                imageGids.push(gid);
                            }
                        }
                    }
                }

                // Handle Video
                let videoGid = undefined;
                if (data.video) {
                    const videoFile = await fetchImageAsFile(data.video);
                    if (videoFile) {
                        videoGid = await uploadFileToShopify(videoFile);
                    }
                }

                // Handle Colors (Format: Name:Hex|Name:Hex)
                let colors = [];
                if (data.colors) {
                    colors = data.colors.split('|').map((c: string) => {
                        const [name, hex] = c.split(':');
                        return { name: name?.trim(), hex: hex?.trim() };
                    }).filter((c: any) => c.name && c.hex);
                }

                // Handle Sizes
                let sizes = [];
                if (data.sizes) {
                    sizes = data.sizes.split(',').map((s: string) => s.trim());
                }

                // Create Product
                const product = await createCustomProduct({
                    title: data.title,
                    description: data.description,
                    price: data.price,
                    currency: data.currency || "INR",
                    imageGids,
                    videoGid,
                    colors,
                    sizes,
                    status: data.status || "ACTIVE"
                });

                results.push({ row: i + 1, title: data.title, handle: product?.handle, status: 'success' });

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
