"use client";

import { useState, useCallback } from "react";
import EditableProductGallery from "./EditableProductGallery";
import EditableProductInfo from "./EditableProductInfo";

interface ProductImage {
    url: string;
    altText: string;
}

interface ProductColor {
    name: string;
    hex: string;
}

interface PDPClientWrapperProps {
    product: {
        title: string;
        handle: string;
        descriptionHtml: string;
        price: string | number;
        images: {
            edges: {
                node: ProductImage;
            }[];
        };
        video?: string | null;
        colors: ProductColor[];
        sizes: string[];
    };
}

export default function PDPClientWrapper({ product }: PDPClientWrapperProps) {
    const [isEditMode, setIsEditMode] = useState(false);

    // Get initial image URLs from product
    const initialImageUrls = product.images.edges.map(edge => edge.node.url);
    const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls);

    const handleImagesChange = useCallback((newImageUrls: string[]) => {
        setImageUrls(newImageUrls);
    }, []);

    const handleEditModeChange = useCallback((editMode: boolean) => {
        setIsEditMode(editMode);
        // Reset images if exiting edit mode without save (handled in EditableProductInfo)
    }, []);

    // Create a mutable images object for the gallery
    const galleryImages = {
        edges: imageUrls.map(url => ({
            node: {
                url,
                altText: product.title
            }
        }))
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Left: Gallery (7 cols) */}
            <div className="md:col-span-7">
                <EditableProductGallery
                    images={galleryImages}
                    video={product.video}
                    isEditMode={isEditMode}
                    onImagesChange={handleImagesChange}
                />
            </div>

            {/* Right: Info (5 cols) */}
            <div className="md:col-span-5">
                <EditableProductInfo
                    title={product.title}
                    price={product.price}
                    colors={product.colors}
                    sizes={product.sizes}
                    description={product.descriptionHtml}
                    handle={product.handle}
                    imageUrls={imageUrls}
                    onImagesChange={handleImagesChange}
                    onEditModeChange={handleEditModeChange}
                />
            </div>
        </div>
    );
}
