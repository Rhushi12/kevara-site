import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "kevara";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

// Create S3 client configured for R2
const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Generate a unique file key for R2 storage
 */
export function generateFileKey(filename: string, folder: string = "products"): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${folder}/${timestamp}-${randomId}-${sanitizedName}`;
}

/**
 * Get the public URL for a file stored in R2
 */
export function getR2PublicUrl(key: string): string {
    return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Generate a presigned URL for direct client-side upload
 * This bypasses Vercel's body size limits entirely
 */
export async function generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600 // 1 hour default
): Promise<{ uploadUrl: string; publicUrl: string }> {
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });
    const publicUrl = getR2PublicUrl(key);

    return { uploadUrl, publicUrl };
}

/**
 * Upload a file directly to R2 from the server
 * Use this for smaller files or server-side operations
 */
export async function uploadToR2(
    file: File | Buffer,
    key: string,
    contentType?: string
): Promise<string> {
    let body: Buffer;
    let mimeType: string;

    if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        body = Buffer.from(arrayBuffer);
        mimeType = contentType || file.type || "application/octet-stream";
    } else {
        body = file;
        mimeType = contentType || "application/octet-stream";
    }

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: mimeType,
    });

    await r2Client.send(command);
    return getR2PublicUrl(key);
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });
    await r2Client.send(command);
}

/**
 * Extract the R2 key from a public URL
 */
export function extractKeyFromUrl(url: string): string | null {
    if (!url.startsWith(R2_PUBLIC_URL)) {
        return null;
    }
    return url.replace(`${R2_PUBLIC_URL}/`, "");
}

export { r2Client };
