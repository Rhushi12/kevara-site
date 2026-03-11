"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMediaGids = extractMediaGids;
// Helper: Recursively find all Image GIDs
function extractMediaGids(data) {
    var gids = new Set();
    // Matches MediaImage, Video, and GenericFile GIDs
    var gidPattern = /gid:\/\/shopify\/(?:MediaImage|Video|GenericFile)\/\d+/;
    function traverse(obj) {
        if (!obj)
            return;
        if (typeof obj === 'string') {
            if (gidPattern.test(obj))
                gids.add(obj);
        }
        else if (Array.isArray(obj)) {
            obj.forEach(traverse);
        }
        else if (typeof obj === 'object') {
            Object.values(obj).forEach(traverse);
        }
    }
    traverse(data);
    return Array.from(gids);
}
