"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loaded = false;

/**
 * Load FFmpeg WASM - only needs to be done once
 */
async function loadFFmpeg(onProgress?: (msg: string) => void) {
    if (loaded && ffmpeg) return ffmpeg;

    ffmpeg = new FFmpeg();

    ffmpeg.on("log", ({ message }) => {
        console.log("[FFmpeg]", message);
    });

    onProgress?.("Loading video compressor...");

    // Load the FFmpeg core
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    loaded = true;
    onProgress?.("Video compressor ready!");
    return ffmpeg;
}

export interface CompressionResult {
    blob: Blob;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
}

export interface CompressionOptions {
    maxWidth?: number;       // Default: 720 (HD ready for portrait videos)
    quality?: number;        // CRF value: 23-28 for good quality, higher = smaller file
    onProgress?: (progress: number) => void;
    onMessage?: (message: string) => void;
}

/**
 * Compress a video file using FFmpeg WASM
 * Optimized for web playback: H.264 codec, MP4 container, 720p
 */
export async function compressVideo(
    file: File,
    options: CompressionOptions = {}
): Promise<CompressionResult> {
    const {
        maxWidth = 720,
        quality = 28, // Higher CRF = smaller file, 28 is good for web
        onProgress,
        onMessage
    } = options;

    const ffmpegInstance = await loadFFmpeg(onMessage);
    if (!ffmpegInstance) throw new Error("Failed to load FFmpeg");

    const inputName = "input" + getFileExtension(file.name);
    const outputName = "output.mp4";

    onMessage?.("Reading video file...");

    // Write input file to FFmpeg virtual filesystem
    await ffmpegInstance.writeFile(inputName, await fetchFile(file));

    // Set up progress tracking
    let duration = 0;
    ffmpegInstance.on("log", ({ message }) => {
        // Try to extract duration
        const durationMatch = message.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        if (durationMatch) {
            const hours = parseFloat(durationMatch[1]);
            const mins = parseFloat(durationMatch[2]);
            const secs = parseFloat(durationMatch[3]);
            duration = hours * 3600 + mins * 60 + secs;
        }

        // Try to extract current time for progress
        const timeMatch = message.match(/time=\s*(\d+):(\d+):(\d+\.\d+)/);
        if (timeMatch && duration > 0) {
            const hours = parseFloat(timeMatch[1]);
            const mins = parseFloat(timeMatch[2]);
            const secs = parseFloat(timeMatch[3]);
            const currentTime = hours * 3600 + mins * 60 + secs;
            const progress = Math.min((currentTime / duration) * 100, 99);
            onProgress?.(progress);
        }
    });

    onMessage?.("Compressing video (this may take a while)...");

    // FFmpeg command for web-optimized compression
    // -vf scale: resize to maxWidth maintaining aspect ratio
    // -c:v libx264: H.264 codec (most compatible)
    // -crf: Constant Rate Factor (quality, lower = better, 23-28 is good)
    // -preset ultrafast: faster encoding (slightly larger file)
    // -movflags +faststart: enables progressive playback
    // -an: remove audio for silent looping videos
    await ffmpegInstance.exec([
        "-i", inputName,
        "-vf", `scale=${maxWidth}:-2`,  // -2 ensures height is divisible by 2
        "-c:v", "libx264",
        "-crf", quality.toString(),
        "-preset", "ultrafast",
        "-movflags", "+faststart",
        "-an",  // No audio for promo videos
        "-y",   // Overwrite output
        outputName
    ]);

    onMessage?.("Reading compressed video...");
    onProgress?.(100);

    // Read the output file
    const data = await ffmpegInstance.readFile(outputName);
    // Handle both Uint8Array and string returns from ffmpeg
    let blobData: BlobPart;
    if (typeof data === 'string') {
        blobData = new TextEncoder().encode(data);
    } else {
        blobData = new Uint8Array(data);
    }
    const blob = new Blob([blobData], { type: "video/mp4" });

    // Cleanup
    await ffmpegInstance.deleteFile(inputName);
    await ffmpegInstance.deleteFile(outputName);

    const result: CompressionResult = {
        blob,
        originalSize: file.size,
        compressedSize: blob.size,
        compressionRatio: ((file.size - blob.size) / file.size) * 100
    };

    onMessage?.(`Compression complete! Reduced by ${result.compressionRatio.toFixed(0)}%`);

    return result;
}

function getFileExtension(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext ? `.${ext}` : ".mp4";
}

/**
 * Check if browser supports FFmpeg WASM
 */
export function isCompressionSupported(): boolean {
    return typeof SharedArrayBuffer !== "undefined";
}
