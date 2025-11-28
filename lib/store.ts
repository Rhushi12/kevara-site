import { create } from 'zustand';

interface Product {
    node: {
        id: string;
        title: string;
        handle: string;
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
                    altText: string;
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
