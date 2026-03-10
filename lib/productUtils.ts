export interface ParsedProductTitle {
    cleanTitle: string;
    batchNumber: string | null;
}

/**
 * Parses a product title to extract the base name and the batch number if present.
 * Example: "Classic T-Shirt (1)" -> { cleanTitle: "Classic T-Shirt", batchNumber: "1" }
 * Example: "Classic T-Shirt" -> { cleanTitle: "Classic T-Shirt", batchNumber: null }
 */
export function parseProductTitle(title: string): ParsedProductTitle {
    if (!title) return { cleanTitle: "", batchNumber: null };

    // Regex to match " (number)" at the end of the string
    const match = title.match(/\s*\((\d+)\)$/);

    if (match) {
        return {
            cleanTitle: title.replace(match[0], '').trim(),
            batchNumber: match[1]
        };
    }

    return {
        cleanTitle: title.trim(),
        batchNumber: null
    };
}
