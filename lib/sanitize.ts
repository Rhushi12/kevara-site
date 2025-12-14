"use client";

import DOMPurify from "dompurify";

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Only works on client-side as DOMPurify requires window
 */
export function sanitizeHtml(html: string): string {
    if (typeof window === "undefined") {
        // Server-side: strip all tags as a fallback
        return html.replace(/<[^>]*>/g, "");
    }
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            "p", "br", "strong", "em", "u", "ul", "ol", "li",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "a", "span", "div", "blockquote"
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "class"],
    });
}
