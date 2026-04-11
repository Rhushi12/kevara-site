"use client";

// export const dynamic = 'force-dynamic';
// export const fetchCache = 'force-no-store';
// export const revalidate = 0;

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Upload, X, Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";

import { Suspense } from "react";

function CreateProductContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get("return_to");

    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [description, setDescription] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages((prev) => [...prev, ...newFiles]);

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Upload images to R2
            const imageUrls: string[] = [];
            for (const file of images) {
                // Get presigned URL
                const presignRes = await adminFetch("/api/r2/presign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: file.name,
                        contentType: file.type,
                        folder: "products"
                    })
                });
                
                if (!presignRes.ok) throw new Error("Failed to get presigned URL for " + file.name);
                const { uploadUrl, publicUrl } = await presignRes.json();
                
                // Upload directly to R2
                const uploadRes = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": file.type },
                    body: file
                });
                
                if (!uploadRes.ok) throw new Error("Failed to upload " + file.name + " to R2");
                imageUrls.push(publicUrl);
            }

            // 2. Create product via API
            const productData = {
                title,
                price,
                stock: stock ? parseInt(stock) : 0,
                description,
                imageUrls,
            };

            const res = await adminFetch("/api/products/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create product");
            }

            const data = await res.json();
            alert("Product created successfully!");

            if (returnTo) {
                // Return to collection page with the new product ID to auto-add (future enhancement)
                // For now just return
                router.push(returnTo);
            } else {
                router.push("/admin"); // Or wherever
            }
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Sticky Header (Mimicking StickyProductBar) */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-lg font-lora font-medium">Create New Product</h1>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? "Creating..." : "Publish Product"}
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 mb-24">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    {/* Left: Image Upload (Mimicking ProductGallery) - 7 cols */}
                    <div className="md:col-span-7">
                        <div className="grid grid-cols-2 gap-4">
                            {previews.map((src, index) => (
                                <div key={index} className="relative aspect-[3/4] bg-gray-100 group">
                                    <Image
                                        src={src}
                                        alt={`Preview ${index}`}
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}

                            {/* Upload Placeholder */}
                            <label className="relative aspect-[3/4] bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <div className="bg-gray-200 p-4 rounded-full mb-4">
                                    <Plus size={24} className="text-gray-500" />
                                </div>
                                <span className="text-sm text-gray-500 font-medium">Add Images</span>
                                <span className="text-xs text-gray-400 mt-1">Drag & drop or click</span>
                            </label>
                        </div>
                    </div>

                    {/* Right: Product Info Form (Mimicking ProductInfo) - 5 cols */}
                    <div className="md:col-span-5">
                        <div className="sticky top-24 space-y-8">
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-500">
                                    Product Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Linen Summer Dress"
                                    className="w-full text-3xl md:text-4xl font-lora border-b border-gray-200 focus:border-black outline-none py-2 placeholder:text-gray-300"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-500">
                                    Price (INR)
                                </label>
                                <div className="flex items-center">
                                    <span className="text-xl mr-2">₹</span>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full text-xl font-medium border-b border-gray-200 focus:border-black outline-none py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-500">
                                    Initial Stock
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    placeholder="e.g. 100"
                                    className="w-full text-xl font-medium border-b border-gray-200 focus:border-black outline-none py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-500">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your product..."
                                    rows={6}
                                    className="w-full text-base text-gray-600 border border-gray-200 rounded-lg p-4 focus:border-black outline-none resize-none"
                                />
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <p className="text-xs text-gray-400">
                                    * Images will be uploaded to Kevara's storage (Cloudflare R2) and optimized.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}

export default function CreateProductPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <CreateProductContent />
        </Suspense>
    );
}
