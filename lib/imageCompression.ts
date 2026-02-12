export async function compressImage(file: File, options?: { maxWidth?: number, quality?: number, type?: string }): Promise<File> {
    const maxWidth = options?.maxWidth || 1600;
    const quality = options?.quality || 0.8;
    const type = options?.type || "image/jpeg"; // Default to JPEG for compatibility

    // Check if HEIC/HEIF
    let processFile = file;
    if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith('.heic')) {
        try {
            // Dynamic import to avoid SSR "window is not defined" error
            const heic2any = (await import("heic2any")).default;

            const convertedBlob = await heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: quality
            });

            // Handle potential array return
            const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            processFile = new File([finalBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: "image/jpeg",
                lastModified: Date.now()
            });
        } catch (error) {
            console.error("HEIC conversion failed:", error);
            // Fallback or rethrow? Let's try to proceed if possible or throw
            throw new Error("HEIC conversion failed. Please try a different format.");
        }
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(processFile);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Canvas to Blob failed'));
                        return;
                    }
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                        type: type,
                        lastModified: Date.now(),
                    });
                    resolve(newFile);
                }, type, quality);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}
