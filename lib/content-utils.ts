
import { pollForFileUrl } from "@/lib/shopify-admin";

/**
 * Resolve all image GIDs in page sections to URLs
 * This fixes broken images where image_id contains GID but image URL is missing/expired
 */
export async function resolveImageGidsInSections(pageData: any): Promise<any> {
    if (!pageData || !pageData.sections) return pageData;

    // Collect all GIDs that need resolution
    const gidsToResolve: { path: string; gid: string }[] = [];

    // Recursively find GIDs in settings
    function findGidsInObject(obj: any, path: string) {
        if (!obj || typeof obj !== 'object') return;

        if (Array.isArray(obj)) {
            obj.forEach((item, i) => findGidsInObject(item, `${path}[${i}]`));
        } else {
            for (const key of Object.keys(obj)) {
                const value = obj[key];

                // Check for image_id that's a GID
                if (key === 'image_id' && typeof value === 'string' && value.startsWith('gid://')) {
                    // Check if corresponding image field is missing or also a GID
                    const imageValue = obj.image;
                    if (!imageValue || (typeof imageValue === 'string' && imageValue.startsWith('gid://'))) {
                        gidsToResolve.push({ path: `${path}.image`, gid: value });
                    }
                }

                // Recurse into nested objects
                if (typeof value === 'object') {
                    findGidsInObject(value, `${path}.${key}`);
                }
            }
        }
    }

    // Find all GIDs
    pageData.sections.forEach((section: any, i: number) => {
        findGidsInObject(section.settings, `sections[${i}].settings`);
    });

    if (gidsToResolve.length === 0) return pageData;


    // Resolve GIDs in parallel (with reduced polling for speed)
    const results = await Promise.all(
        gidsToResolve.map(async ({ path, gid }) => {
            try {
                const url = await pollForFileUrl(gid, 3, 500); // Faster polling - 3 attempts, 500ms each
                return { path, url };
            } catch (e) {
                console.error(`[resolveImageGidsInSections] Failed to resolve ${gid}:`, e);
                return { path, url: null };
            }
        })
    );

    // Apply resolved URLs to page data
    const resolvedData = JSON.parse(JSON.stringify(pageData)); // Deep clone

    for (const { path, url } of results) {
        if (!url) continue;

        // Parse path and set value
        const parts = path.match(/([^\[\]\.]+|\d+)/g);
        if (!parts) continue;

        let obj = resolvedData;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            obj = obj[isNaN(Number(key)) ? key : Number(key)];
            if (!obj) break;
        }

        if (obj) {
            const lastKey = parts[parts.length - 1];
            obj[isNaN(Number(lastKey)) ? lastKey : Number(lastKey)] = url;
        }
    }


    return resolvedData;
}
