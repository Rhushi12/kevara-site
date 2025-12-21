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

        // Helper function to upload a single file to R2
        const uploadFileToR2 = async (file: File, folder: string = "products"): Promise<string> => {
            // Step 1: Get presigned URL
            const presignRes = await fetch("/api/r2/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    folder,
                }),
            });

            if (!presignRes.ok) {
                const err = await presignRes.json();
                throw new Error(err.error || "Failed to get upload URL");
            }

            const { uploadUrl, publicUrl } = await presignRes.json();

            // Step 2: Upload file directly to R2
            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            if (!uploadRes.ok) {
                throw new Error(`Failed to upload ${file.name} to storage`);
            }

            return publicUrl;
        };

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
                // Upload all images to R2
                const imageUrls: string[] = [];
                for (let i = 0; i < item.files.length; i++) {
                    const url = await uploadFileToR2(item.files[i], "products");
                    imageUrls.push(url);
                }

                // Send JSON payload to API
                const res = await fetch('/api/products/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: item.title,
                        price: item.price,
                        description: item.description,
                        imageUrls: imageUrls,
                        colors: item.colors.length > 0 ? item.colors : undefined,
                        sizes: item.sizes.length > 0 ? item.sizes : undefined,
                    }),
                });

                // Handle non-JSON responses (e.g. HTML error pages from proxies)
                const contentType = res.headers.get("content-type");
                let data;
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    data = await res.json();
                } else {
                    const text = await res.text();
                    console.error("Non-JSON Response in Queue:", text.substring(0, 500));
                    throw new Error(`Server returned ${res.status} (Potential firewall block during background upload)`);
                }

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
