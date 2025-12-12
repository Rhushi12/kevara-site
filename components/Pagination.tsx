"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage = 1,
    totalPages = 6,
    onPageChange
}: PaginationProps) {
    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push("...");
            }

            // Show pages around current
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push("...");
            }

            // Always show last page
            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <nav
            className="flex justify-center items-center w-full"
            style={{ marginTop: "48px", marginBottom: "24px" }}
            aria-label="Page navigation"
        >
            <div className="flex items-center gap-1">
                {/* Previous Arrow */}
                <button
                    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`
                        w-10 h-10 flex items-center justify-center rounded
                        transition-all duration-200
                        ${currentPage === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-[#1a1a1a] hover:bg-gray-100 cursor-pointer"
                        }
                    `}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={18} strokeWidth={1.5} />
                </button>

                {/* Page Numbers */}
                {pageNumbers.map((page, index) => (
                    <button
                        key={index}
                        onClick={() => typeof page === "number" && onPageChange(page)}
                        disabled={page === "..."}
                        className={`
                            min-w-10 h-10 px-3 flex items-center justify-center
                            transition-all duration-200 font-figtree
                            ${page === currentPage
                                ? "border border-[#1a1a1a] text-[#1a1a1a] font-medium"
                                : page === "..."
                                    ? "cursor-default text-gray-400"
                                    : "text-[#1a1a1a] hover:bg-gray-100 cursor-pointer"
                            }
                        `}
                        style={{
                            fontSize: "14px",
                            letterSpacing: "0.5px"
                        }}
                    >
                        {page}
                    </button>
                ))}

                {/* Next Arrow */}
                <button
                    onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`
                        w-10 h-10 flex items-center justify-center rounded
                        transition-all duration-200
                        ${currentPage === totalPages
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-[#1a1a1a] hover:bg-gray-100 cursor-pointer"
                        }
                    `}
                    aria-label="Next page"
                >
                    <ChevronRight size={18} strokeWidth={1.5} />
                </button>
            </div>
        </nav>
    );
}
