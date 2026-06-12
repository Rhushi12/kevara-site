/**
 * Bulk Upload Script: SHREE KRISHNA ENTERPRISE Products
 * 
 * Reads local image folders, uploads to R2, creates custom_product metaobjects,
 * and syncs shadow products for checkout.
 * 
 * Usage: npx tsx scripts/bulk-upload-shree-krishna.ts
 */

// ⚡ CRITICAL: Load env BEFORE any other imports so R2/Shopify modules see the vars
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import * as fs from 'fs';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ============================================================================
// INLINE R2 CLIENT (to avoid the top-level env issue in lib/r2.ts)
// ============================================================================

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'kevara';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
    console.error('❌ Missing R2 env vars. Check .env.local for R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL');
    process.exit(1);
}

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

function generateFileKey(filename: string, folder: string = 'products'): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${folder}/${timestamp}-${randomId}-${sanitizedName}`;
}

async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
    });
    await r2Client.send(command);
    return `${R2_PUBLIC_URL}/${key}`;
}

// ============================================================================
// INLINE SHOPIFY + PRODUCT CREATION (to avoid module-level env issues)
// ============================================================================

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

if (!SHOPIFY_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
    console.error('❌ Missing Shopify env vars. Check .env.local for SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN');
    process.exit(1);
}

async function shopifyFetch(query: string, variables: any = {}): Promise<any> {
    const url = `https://${SHOPIFY_DOMAIN}/admin/api/2024-07/graphql.json`;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN!,
                },
                body: JSON.stringify({ query, variables }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Shopify API Error: ${response.status} - ${text}`);
            }

            const json = await response.json();
            if (json.errors) {
                throw new Error('Shopify GraphQL Error: ' + JSON.stringify(json.errors));
            }
            return json.data;
        } catch (error: any) {
            if (attempt < maxRetries && !error.message?.includes('GraphQL')) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
                continue;
            }
            throw error;
        }
    }
}

async function upsertMetaobject(type: string, handle: string, fields: any[]) {
    const mutation = `
        mutation upsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
            metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
                metaobject { id }
                userErrors { field message }
            }
        }
    `;

    const result = await shopifyFetch(mutation, {
        handle: { type, handle },
        metaobject: { fields },
    });

    if (result.metaobjectUpsert.userErrors.length > 0) {
        const msgs = result.metaobjectUpsert.userErrors.map((e: any) => e.message).join(', ');
        throw new Error(`Metaobject upsert failed: ${msgs}`);
    }
    return result.metaobjectUpsert.metaobject.id;
}

function generateProductHandle(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `product_${timestamp}_${random}`;
}

function slugify(text: string): string {
    const baseSlug = text.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
}

// ============================================================================
// Shadow product sync (simplified from lib/shopify-product-sync.ts)
// ============================================================================

const HEADLESS_PUBLICATION_ID = 'gid://shopify/Publication/212278116387';
const DEFAULT_LOCATION_ID = process.env.SHOPIFY_DEFAULT_LOCATION_ID || '';

async function stagedUploadImage(imageUrl: string, productTitle: string): Promise<string | null> {
    try {
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/jpeg, image/png, image/webp, */*',
            }
        });
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'application/octet-stream';
        const size = buffer.length;
        const extension = mimeType.split('/')[1] || 'jpg';
        const filename = `shadow-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;

        const stagedRes = await shopifyFetch(`
            mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
                stagedUploadsCreate(input: $input) {
                    stagedTargets {
                        url
                        resourceUrl
                        parameters { name value }
                    }
                    userErrors { field message }
                }
            }
        `, { input: [{ filename, mimeType, httpMethod: 'POST', resource: 'FILE', fileSize: size.toString() }] });

        const data = stagedRes?.stagedUploadsCreate;
        if (!data || data.userErrors?.length > 0) return null;

        const target = data.stagedTargets[0];
        const formData = new FormData();
        target.parameters.forEach((param: any) => formData.append(param.name, param.value));
        formData.append('file', new Blob([buffer], { type: mimeType }), filename);

        const uploadRes = await fetch(target.url, { method: 'POST', body: formData });
        if (uploadRes.status !== 201 && uploadRes.status !== 204) return null;

        return target.resourceUrl;
    } catch (err: any) {
        console.error(`  [Staged] Error: ${err.message}`);
        return null;
    }
}

async function syncShadowProduct(handle: string, title: string, imageUrls: string[]) {
    try {
        // Check if shadow already exists
        const existingRes = await shopifyFetch(`
            query getProductByHandle($handle: String!) {
                productByHandle(handle: $handle) { id }
            }
        `, { handle });
        const productId = existingRes.productByHandle?.id;

        // Upload images via staged uploads
        const validFiles: any[] = [];
        for (const url of imageUrls.slice(0, 5)) { // Limit to 5 images for shadow
            const resourceUrl = await stagedUploadImage(url, title);
            if (resourceUrl) {
                validFiles.push({ contentType: 'IMAGE', originalSource: resourceUrl, alt: title });
            }
        }

        const productSetInput: any = {
            title,
            handle,
            descriptionHtml: '',
            status: 'ACTIVE',
            variants: [{ price: '0', optionValues: [{ optionName: 'Title', name: 'Default Title' }], inventoryPolicy: 'DENY' }],
            productOptions: [{ name: 'Title', values: [{ name: 'Default Title' }] }],
        };

        if (validFiles.length > 0) {
            productSetInput.files = validFiles;
        }
        if (productId) {
            productSetInput.id = productId;
        }

        const setResult = await shopifyFetch(`
            mutation productSet($input: ProductSetInput!) {
                productSet(input: $input, synchronous: true) {
                    product {
                        id
                        variants(first: 10) {
                            edges { node { id title inventoryItem { id } } }
                        }
                    }
                    userErrors { field message }
                }
            }
        `, { input: productSetInput });

        if (setResult.productSet?.userErrors?.length > 0) {
            console.error('  [Shadow] Error:', setResult.productSet.userErrors);
            return null;
        }

        const newProductId = setResult.productSet.product.id;
        const variants = setResult.productSet.product.variants.edges;

        // Publish to headless channel
        await shopifyFetch(`
            mutation publishProduct($id: ID!, $input: [PublicationInput!]!) {
                publishablePublish(id: $id, input: $input) {
                    publishable { ... on Product { id } }
                    userErrors { field message }
                }
            }
        `, { id: newProductId, input: [{ publicationId: HEADLESS_PUBLICATION_ID }] });

        // Set inventory to 0
        if (DEFAULT_LOCATION_ID && variants.length > 0) {
            const quantities = variants.map((v: any) => ({
                inventoryItemId: v.node.inventoryItem.id,
                locationId: DEFAULT_LOCATION_ID,
                quantity: 0,
            }));

            await shopifyFetch(`
                mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
                    inventorySetQuantities(input: $input) {
                        userErrors { field message }
                    }
                }
            `, { input: { name: 'available', reason: 'correction', ignoreCompareQuantity: true, quantities } });
        }

        return { productId: newProductId, variants: variants.length };
    } catch (err: any) {
        console.error(`  [Shadow] Exception: ${err.message}`);
        return null;
    }
}

// ============================================================================
// CONFIG
// ============================================================================

const SOURCE_DIR = path.resolve(
    __dirname,
    '..',
    'SHREE KRISHNA ENTEPRISE-20260605T081102Z-3-001',
    'SHREE KRISHNA ENTEPRISE'
);

const SKIP_FOLDERS = new Set(['AMAZON', 'MYNTRA']);
const IMAGE_MAX_WIDTH = 1600;
const IMAGE_QUALITY = 80;

// ============================================================================
// HELPERS
// ============================================================================

async function optimizeImage(buffer: Buffer): Promise<Buffer> {
    try {
        const image = sharp(buffer);
        const metadata = await image.metadata();

        let pipeline = image;
        if (metadata.width && metadata.width > IMAGE_MAX_WIDTH) {
            pipeline = pipeline.resize(IMAGE_MAX_WIDTH, null, {
                withoutEnlargement: true,
                fit: 'inside',
            });
        }

        return await pipeline.jpeg({ quality: IMAGE_QUALITY, progressive: true }).toBuffer();
    } catch {
        return buffer;
    }
}

function getImageFiles(dirPath: string): string[] {
    const validExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
    try {
        return fs.readdirSync(dirPath)
            .filter(f => {
                const ext = path.extname(f).toLowerCase();
                return validExtensions.has(ext) && !f.startsWith('.');
            })
            .sort();
    } catch {
        return [];
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log('=== SHREE KRISHNA ENTERPRISE — Bulk Product Upload ===\n');
    console.log(`Source: ${SOURCE_DIR}`);
    console.log(`R2 Bucket: ${R2_BUCKET_NAME}`);
    console.log(`Shopify: ${SHOPIFY_DOMAIN}\n`);

    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
        process.exit(1);
    }

    const allFolders = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && !SKIP_FOLDERS.has(d.name))
        .map(d => d.name)
        .sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
        });

    console.log(`Found ${allFolders.length} product folders to process.\n`);

    const results: { batch: string; status: string; handle?: string; images?: number; error?: string }[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allFolders.length; i++) {
        const batchNumber = allFolders[i];
        const folderPath = path.join(SOURCE_DIR, batchNumber);
        const progress = `[${i + 1}/${allFolders.length}]`;

        console.log(`${progress} Processing batch ${batchNumber}...`);

        try {
            // 1. Get image files
            const imageFiles = getImageFiles(folderPath);
            if (imageFiles.length === 0) {
                console.log(`  ⚠ No images found, skipping.`);
                results.push({ batch: batchNumber, status: 'skipped', error: 'No images' });
                continue;
            }
            console.log(`  📸 ${imageFiles.length} image(s)`);

            // 2. Upload each image to R2
            const imageUrls: string[] = [];
            for (const fileName of imageFiles) {
                const filePath = path.join(folderPath, fileName);
                try {
                    const rawBuffer = fs.readFileSync(filePath);
                    const optimized = await optimizeImage(rawBuffer);

                    const sanitizedName = `batch-${batchNumber}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const key = generateFileKey(sanitizedName, 'products');
                    const publicUrl = await uploadToR2(optimized, key, 'image/jpeg');

                    imageUrls.push(publicUrl);
                    process.stdout.write('.');
                } catch (imgErr: any) {
                    console.error(`\n  ⚠ Failed: ${fileName}: ${imgErr.message}`);
                }
            }
            console.log(`\n  ☁️  Uploaded ${imageUrls.length}/${imageFiles.length} to R2`);

            if (imageUrls.length === 0) {
                results.push({ batch: batchNumber, status: 'error', error: 'All uploads failed' });
                errorCount++;
                continue;
            }

            // 3. Create custom_product metaobject
            const handle = generateProductHandle();
            const slug = slugify(`batch-${batchNumber}`);

            const fields = [
                { key: 'product_id', value: handle },
                { key: 'title', value: `Batch ${batchNumber}` },
                { key: 'description', value: `Product batch ${batchNumber} — SHREE KRISHNA ENTERPRISE` },
                { key: 'price', value: '0' },
                { key: 'currency', value: 'INR' },
                { key: 'status', value: 'ACTIVE' },
                { key: 'slug', value: slug },
                { key: 'image_urls', value: JSON.stringify(imageUrls) },
                { key: 'stock', value: '0' },
                { key: 'return_days', value: '30' },
            ];

            const metaobjectId = await upsertMetaobject('custom_product', handle, fields);
            console.log(`  🏷️  Metaobject: ${handle} (slug: ${slug})`);

            // 4. Sync shadow product
            try {
                const syncResult = await syncShadowProduct(handle, `Batch ${batchNumber}`, imageUrls);
                if (syncResult) {
                    console.log(`  ✅ Shadow: ${syncResult.productId} (${syncResult.variants} variants)`);
                } else {
                    console.warn(`  ⚠ Shadow sync returned null`);
                }
            } catch (syncErr: any) {
                console.error(`  ⚠ Shadow sync failed (non-fatal): ${syncErr.message}`);
            }

            results.push({ batch: batchNumber, status: 'success', handle, images: imageUrls.length });
            successCount++;

        } catch (err: any) {
            console.error(`  ❌ Failed: ${err.message}`);
            results.push({ batch: batchNumber, status: 'error', error: err.message });
            errorCount++;
        }

        // Rate limit pause every 3 products
        if ((i + 1) % 3 === 0 && i < allFolders.length - 1) {
            console.log('  ⏳ Rate limit pause (2s)...');
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================

    console.log('\n========================================');
    console.log('         UPLOAD SUMMARY');
    console.log('========================================');
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ❌ Errors:  ${errorCount}`);
    console.log(`  ⏭  Skipped: ${results.filter(r => r.status === 'skipped').length}`);
    console.log(`  📦 Total:   ${allFolders.length}`);
    console.log('========================================\n');

    // Detailed table
    console.log('Batch   | Status  | Handle                          | Images');
    console.log('--------|---------|--------------------------------|-------');
    for (const r of results) {
        const batch = r.batch.padEnd(7);
        const status = r.status.padEnd(7);
        const handle = (r.handle || r.error || '-').substring(0, 32).padEnd(32);
        const images = r.images !== undefined ? String(r.images) : '-';
        console.log(`${batch} | ${status} | ${handle}| ${images}`);
    }
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
