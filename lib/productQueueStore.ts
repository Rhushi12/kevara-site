import { create } from 'zustand';

interface QueuedProduct {
    id: string;
    title: string;
    price: string;
    description: string;
    files: File[];
    colors: Array<{ name: string; hex: string }>;
    sizes: string[];
    status: 'pending' | 'processing' | 'success' | 'error';
    error?: string;
}

interface ProductQueueStore {
    queue: QueuedProduct[];
    isProcessing: boolean;
    addToQueue: (product: Omit<QueuedProduct, 'id' | 'status'>) => void;
    processQueue: () => Promise<void>;
    removeFromQueue: (id: string) => void;
    clearQueue: () => void;
}

export const useProductQueueStore = create<ProductQueueStore>((set, get) => ({
    queue: [],
    isProcessing: false,

    addToQueue: (product) => {
        const id = `product_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const queuedProduct: QueuedProduct = {
            ...product,
            id,
            status: 'pending',
        };

        set((state) => ({
            queue: [...state.queue, queuedProduct],
        }));

        // Auto-start processing if not already processing
        if (!get().isProcessing) {
            get().processQueue();
        }
    },

    processQueue: async () => {
        const { queue, isProcessing } = get();

        if (isProcessing || queue.length === 0) return;

        set({ isProcessing: true });

        // Process items one by one
        for (const item of queue) {
            if (item.status !== 'pending') continue;

            // Update status to processing
            set((state) => ({
                queue: state.queue.map((q) =>
                    q.id === item.id ? { ...q, status: 'processing' } : q
                ),
            }));

            try {
                const formData = new FormData();
                formData.append('title', item.title);
                formData.append('price', item.price);
                formData.append('description', item.description);
                item.files.forEach((file) => formData.append('images', file));

                if (item.colors.length > 0) {
                    formData.append('colors', JSON.stringify(item.colors));
                }
                if (item.sizes.length > 0) {
                    formData.append('sizes', JSON.stringify(item.sizes));
                }

                const res = await fetch('/api/products/create', {
                    method: 'POST',
                    body: formData,
                });

                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Failed to create product');

                // Update status to success
                set((state) => ({
                    queue: state.queue.map((q) =>
                        q.id === item.id ? { ...q, status: 'success' } : q
                    ),
                }));

                // Show success notification
                if (typeof window !== 'undefined') {
                    const event = new CustomEvent('product-created', {
                        detail: { product: data.product, title: item.title },
                    });
                    window.dispatchEvent(event);

                    // Trigger product refresh event
                    const refreshEvent = new CustomEvent('refresh-products');
                    window.dispatchEvent(refreshEvent);
                }
            } catch (error: any) {
                // Update status to error
                set((state) => ({
                    queue: state.queue.map((q) =>
                        q.id === item.id
                            ? { ...q, status: 'error', error: error.message }
                            : q
                    ),
                }));

                // Show error notification
                if (typeof window !== 'undefined') {
                    const event = new CustomEvent('product-creation-error', {
                        detail: { title: item.title, error: error.message },
                    });
                    window.dispatchEvent(event);
                }
            }
        }

        set({ isProcessing: false });

        // Auto-remove completed items after 5 seconds
        setTimeout(() => {
            set((state) => ({
                queue: state.queue.filter((q) => q.status === 'pending' || q.status === 'processing'),
            }));
        }, 5000);
    },

    removeFromQueue: (id) => {
        set((state) => ({
            queue: state.queue.filter((q) => q.id !== id),
        }));
    },

    clearQueue: () => {
        set({ queue: [], isProcessing: false });
    },
}));
