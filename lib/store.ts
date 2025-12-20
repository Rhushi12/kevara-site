import { create } from 'zustand';

export interface Product {
    node: {
        id: string;
        title: string;
        handle: string;
        slug?: string;
        priceRange: {
            minVariantPrice: {
                amount: string;
                currencyCode: string;
            };
        };
        images: {
            edges: {
                node: {
                    url: string;
                    altText?: string;
                };
            }[];
        };
        variants: {
            edges: {
                node: {
                    id: string;
                    title: string;
                };
            }[];
        };
        colors?: { name: string; hex: string }[];
        sizes?: string[];
        relatedProducts?: string[];
        video?: string;
        status?: string;
    };
}

interface QuickViewState {
    isOpen: boolean;
    selectedProduct: Product | null;
    openQuickView: (product: Product) => void;
    closeQuickView: () => void;
}

export const useQuickViewStore = create<QuickViewState>((set) => ({
    isOpen: false,
    selectedProduct: null,
    openQuickView: (product) => set({ isOpen: true, selectedProduct: product }),
    closeQuickView: () => set({ isOpen: false }),
}));

interface SizeGuideState {
    isOpen: boolean;
    openSizeGuide: () => void;
    closeSizeGuide: () => void;
}

export const useSizeGuideStore = create<SizeGuideState>((set) => ({
    isOpen: false,
    openSizeGuide: () => set({ isOpen: true }),
    closeSizeGuide: () => set({ isOpen: false }),
}));

// Wholesale Inquiry Modal Store
interface WholesaleInquiryState {
    isOpen: boolean;
    productTitle: string;
    productHandle: string;
    openInquiry: (title?: string, handle?: string) => void;
    closeInquiry: () => void;
}

export const useWholesaleInquiryStore = create<WholesaleInquiryState>((set) => ({
    isOpen: false,
    productTitle: "General Inquiry",
    productHandle: "general",
    openInquiry: (title = "General Inquiry", handle = "general") =>
        set({ isOpen: true, productTitle: title, productHandle: handle }),
    closeInquiry: () => set({ isOpen: false }),
}));
