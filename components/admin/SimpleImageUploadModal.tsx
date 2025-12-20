"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Upload, Crop as CropIcon, Check } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";

interface SimpleImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => Promise<void>;
    title?: string;
    accept?: string;
    aspectRatio?: number; // Optional: e.g. 1 for square, 16/9 for landscape
}

export default function SimpleImageUploadModal({
    isOpen,
    onClose,
    onUpload,
    title = "Upload Image",
    accept = "image/*,.heic,.heif",
    aspectRatio
}: SimpleImageUploadModalProps) {
    const isVideo = accept.includes("video");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null); // Final preview to show/upload
    const [imageSrc, setImageSrc] = useState<string | null>(null); // Source for cropper
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Crop State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropping, setIsCropping] = useState(false);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCropper = (src: string) => {
        setImageSrc(src);
        setIsCropping(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
    };

    const handleCropSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedBlob) {
                const croppedFile = new File([croppedBlob], "cropped.jpg", { type: "image/jpeg" });
                setFile(croppedFile);
                setPreview(URL.createObjectURL(croppedBlob));
                setIsCropping(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Handle Paste Event
    useEffect(() => {
        if (!isOpen) return;

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const pastedFile = items[i].getAsFile();
                    if (pastedFile && (accept === '*' || pastedFile.type.match(accept.replace('*', '.*')))) {
                        const src = URL.createObjectURL(pastedFile);
                        if (!isVideo) {
                            showCropper(src);
                        } else {
                            // Video doesn't support crop yet
                            setFile(pastedFile);
                            setPreview(src);
                        }
                        e.preventDefault();
                        return;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, accept, isVideo]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const src = URL.createObjectURL(selectedFile);
            if (!isVideo) {
                showCropper(src);
            } else {
                setFile(selectedFile);
                setPreview(src);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        try {
            await onUpload(file);
            onClose();
            setFile(null);
            setPreview(null);
            setImageSrc(null);
            setIsCropping(false);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-lora font-bold mb-6">{title}</h2>

                {isCropping && imageSrc ? (
                    <div className="space-y-4">
                        <div className="relative h-64 w-full bg-gray-100 rounded-lg overflow-hidden">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspectRatio} // Use passed aspect ratio or undefined for free crop
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-medium text-gray-500">Zoom</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#006D77]"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setIsCropping(false); setFile(null); }}
                                className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCropSave}
                                className="flex-1 py-3 bg-[#006D77] text-white rounded-lg text-sm font-medium hover:bg-[#005a63] transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={16} /> Apply Crop
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Drop/Select Area */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${preview ? "border-[#006D77] bg-[#006D77]/5" : "border-gray-300 hover:border-[#006D77]"
                                }`}
                        >
                            {preview ? (
                                isVideo ? (
                                    <video src={preview} className="max-h-48 object-contain rounded" controls muted />
                                ) : (
                                    <img src={preview} alt="Preview" className="max-h-48 object-contain rounded" />
                                )
                            ) : (
                                <>
                                    <Upload size={48} className="text-gray-400 mb-4" />
                                    <p className="text-sm text-gray-500 font-medium">Click to upload {isVideo ? "video" : "image"} <span className="text-gray-400 font-normal">(or Ctrl+V)</span></p>
                                    <p className="text-xs text-gray-400 mt-1">{isVideo ? "MP4, WEBM up to 100MB" : "JPG, PNG, WEBP, HEIC up to 10MB"}</p>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={accept}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        <LiquidButton
                            type="submit"
                            disabled={uploading || !file}
                            className={`w-full ${uploading || !file ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {uploading ? "Uploading..." : `Upload ${isVideo ? "Video" : "Image"}`}
                        </LiquidButton>
                    </form>
                )}
            </div>
        </div>
    );
}
