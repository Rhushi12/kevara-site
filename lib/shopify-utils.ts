
// Helper: Recursively find all Image GIDs
export function extractMediaGids(data: any): string[] {
    const gids = new Set<string>();
    // Matches MediaImage, Video, and GenericFile GIDs
    const gidPattern = /gid:\/\/shopify\/(?:MediaImage|Video|GenericFile)\/\d+/;

    function traverse(obj: any) {
        if (!obj) return;

        if (typeof obj === 'string') {
            if (gidPattern.test(obj)) gids.add(obj);
        } else if (Array.isArray(obj)) {
            obj.forEach(traverse);
        } else if (typeof obj === 'object') {
            Object.values(obj).forEach(traverse);
        }
    }

    traverse(data);
    return Array.from(gids);
}
