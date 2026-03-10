import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the Shopify Storefront Cart structure (simplified for state)
export interface CartItem {
    id: string; // The line item ID in Shopify
    merchandiseId: string; // The actual variant ID
    title: string;
    variantTitle: string;
    quantity: number;
    price: string;
    image: string;
    colorHex?: string; // Hex representation for the variant swatch
    handle?: string; // product slug/handle
    availableSizes?: string[];
    availableColors?: { name: string; hex: string; handle?: string; image?: string }[];
}

export interface CartState {
    cartId: string | null;
    items: CartItem[];
    subtotal: string;
    checkoutUrl: string | null;
    isCartOpen: boolean;
    discountCode: string | null;

    // Actions
    setCartId: (id: string | null) => void;
    setCart: (items: CartItem[], subtotal: string, checkoutUrl: string | null) => void;
    openCart: () => void;
    closeCart: () => void;
    updateItemQuantity: (id: string, quantity: number) => void;
    updateItemVariant: (id: string, updates: Partial<CartItem>) => void;
    removeItem: (id: string) => void;

    // Derived
    get cartCount(): number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            cartId: null,
            items: [],
            subtotal: "0.00",
            checkoutUrl: null,
            isCartOpen: false,
            discountCode: null,

            setCartId: (id) => set({ cartId: id }),
            setCart: (items, subtotal, checkoutUrl) => set({ items, subtotal, checkoutUrl }),
            openCart: () => set({ isCartOpen: true }),
            closeCart: () => set({ isCartOpen: false }),

            updateItemQuantity: (id, quantity) => set((state) => {
                const newItems = state.items.map(item =>
                    item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
                );
                const newSubtotal = newItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
                return { items: newItems, subtotal: newSubtotal };
            }),

            updateItemVariant: (id, updates) => set((state) => {
                const newItems = state.items.map(item =>
                    item.id === id ? { ...item, ...updates } : item
                );
                return { items: newItems };
            }),

            removeItem: (id) => set((state) => {
                const newItems = state.items.filter(item => item.id !== id);
                const newSubtotal = newItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
                return { items: newItems, subtotal: newSubtotal };
            }),

            get cartCount() {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            }
        }),
        {
            name: 'kevara-cart-storage',
            partialize: (state) => ({
                cartId: state.cartId,
                items: state.items,
                subtotal: state.subtotal
            }), // Temporarily persist items for UI testing until Shopify API is hooked up
        }
    )
);
