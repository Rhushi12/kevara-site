import { useState, useRef } from "react";
import { X, Upload, Download, Loader2, CheckCircle, AlertCircle, FileText, XCircle } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";

interface BulkUploadResult {
    row: number;
    title: string;
    handle?: string;
    status: 'success' | 'error';
    error?: string;
}

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Helper to reliably parse CSV lines taking quotes into account
function parseCSVLine(text: string) {
    const result = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell.trim());
    return result.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [results, setResults] = useState<BulkUploadResult[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    if (!isOpen) return null;

    const handleDownloadTemplate = () => {
        const headers = "title,price,stock,description,images,video,colors,sizes,returns,status";
        const row1 = '"Classic Linen Shirt",2499,100,"Premium linen shirt with a comfort fit","https://images.unsplash.com/photo-1596755094514-f87e32f05e41?w=500","","White:#FFFFFF|Navy:#000080","S,M,L,XL",30,"ACTIVE"';
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + row1;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "kevara_product_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetState = () => {
        setFile(null);
        setIsUploading(false);
        setProgress(0);
        setStatusText("");
        setResults([]);
        setErrors([]);
        setIsComplete(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setIsComplete(false);
            setResults([]);
            setErrors([]);
            setProgress(0);
        }
    };

    const processUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setIsComplete(false);
        setResults([]);
        setErrors([]);
        setProgress(0);
        setStatusText("Reading file...");

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('.'));
            
            if (lines.length < 2) {
                throw new Error("CSV file is empty or only contains headers.");
            }

            const headerLine = lines[0];
            const dataLines = lines.slice(1);
            const totalRows = dataLines.length;

            setStatusText(`Found ${totalRows} products. Starting import...`);

            // We process in small chunks to show progress accurately and avoid timeouts
            const batchSize = 3;
            let processed = 0;
            const newResults: BulkUploadResult[] = [];
            const newErrors: string[] = [];

            for (let i = 0; i < dataLines.length; i += batchSize) {
                const chunkLines = dataLines.slice(i, i + batchSize);
                const chunkText = headerLine + '\n' + chunkLines.join('\n');
                
                // Create a file object for the chunk
                const chunkFile = new File([chunkText], "chunk.csv", { type: "text/csv" });
                const formData = new FormData();
                formData.append("file", chunkFile);

                setStatusText(`Processing row ${i + 1} to ${Math.min(i + batchSize, totalRows)} of ${totalRows}...`);

                // We use our existing endpoint which accepts file formData
                const response = await fetch("/api/products/import", {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();

                if (!response.ok) {
                    newErrors.push(`Batch error: ${data.error || "Failed to process chunk"}`);
                } else {
                    if (data.results) {
                        // Adjust row numbers to match the original file
                        const adjustedResults = data.results.map((r: any) => ({
                            ...r,
                            row: r.row + i // r.row logic assumes row 1 is first data row in chunk
                        }));
                        newResults.push(...adjustedResults);
                    }
                    if (data.errors) {
                        const adjustedErrors = data.errors.map((e: string) => {
                            // Find 'Row X:' and shift it by i
                            return e.replace(/Row (\d+):/, (match, p1) => `Row ${parseInt(p1) + i}:`);
                        });
                        newErrors.push(...adjustedErrors);
                    }
                }

                processed += chunkLines.length;
                setProgress(Math.round((processed / totalRows) * 100));
            }

            setResults(newResults);
            setErrors(newErrors);
            setStatusText("Completed!");
            onSuccess(); // Refresh product list
        } catch (error: any) {
            setErrors([error.message || "Failed to read or process file."]);
            setStatusText("Failed!");
        } finally {
            setIsUploading(false);
            setIsComplete(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-200 text-slate-800 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Bulk Upload Products</h2>
                            <p className="text-sm text-slate-500">Import multiple products at once using a CSV file</p>
                        </div>
                    </div>
                    {!isUploading && (
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-white">
                    {!isUploading && !isComplete && (
                        <div className="space-y-6">
                            {/* Step 1: Download Template */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-100 text-blue-700 rounded-full mt-1">
                                        <Download size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-blue-900 mb-1">Step 1: Download Template</h3>
                                        <p className="text-sm text-blue-800 mb-3">
                                            Start with our pre-formatted CSV template. It includes all necessary columns like title, price, images, sizes, and colors.
                                        </p>
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Download Template CSV
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Upload */}
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-3">Step 2: Upload Filled CSV</h3>
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                                        file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-slate-800 bg-gray-50'
                                    }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="csv-file-upload"
                                    />
                                    <label htmlFor="csv-file-upload" className="cursor-pointer flex flex-col items-center w-full h-full">
                                        {file ? (
                                            <>
                                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3">
                                                    <CheckCircle size={28} />
                                                </div>
                                                <span className="font-medium text-emerald-900">{file.name}</span>
                                                <span className="text-xs text-emerald-700 mt-1">File selected. Ready to upload.</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-3 bg-white text-slate-400 rounded-full shadow-sm border border-gray-100 mb-3 hover:text-slate-900 hover:border-slate-900 transition-colors">
                                                    <Upload size={28} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">Click to select CSV file</span>
                                                <span className="text-xs text-slate-500 mt-1">Accepts only .csv extension</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Uploading State */}
                    {isUploading && (
                        <div className="py-12 space-y-8 flex flex-col items-center">
                            <div className="relative">
                                <Loader2 className="animate-spin text-slate-900" size={64} />
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                                    {progress}%
                                </div>
                            </div>
                            
                            <div className="w-full max-w-md space-y-2 text-center">
                                <h3 className="text-lg font-bold text-slate-900">{statusText}</h3>
                                <p className="text-sm text-slate-500">Please leave this page open while we process.</p>
                                
                                {/* Progress Bar */}
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mt-4">
                                    <div 
                                        className="h-full bg-slate-900 rounded-full transition-all duration-300 ease-out" 
                                        style={{ width: `${progress}%` }} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Competion State */}
                    {!isUploading && isComplete && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex-1 text-center border-r border-gray-200">
                                    <div className="text-3xl font-bold text-emerald-600">{results.length}</div>
                                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Success</div>
                                </div>
                                <div className="flex-1 text-center">
                                    <div className={`text-3xl font-bold ${errors.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {errors.length}
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Failed</div>
                                </div>
                            </div>

                            {/* Success List */}
                            {results.length > 0 && (
                                <div>
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-800 mb-3 bg-emerald-50 py-2 px-3 rounded-lg">
                                        <CheckCircle size={16} /> Created Products
                                    </h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {results.map((r, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm bg-white border border-gray-100 px-3 py-2 rounded-lg shadow-sm">
                                                <span className="font-medium text-slate-800 truncate">{r.title}</span>
                                                <span className="text-xs text-slate-400 font-mono">Row {r.row}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Error List */}
                            {errors.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-red-800 mb-3 bg-red-50 py-2 px-3 rounded-lg">
                                        <AlertCircle size={16} /> Issues Detected
                                    </h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {errors.map((err, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-red-700 bg-white border border-red-100 px-3 py-2 rounded-lg shadow-sm">
                                                <XCircle size={16} className="mt-0.5 flex-shrink-0 text-red-500" />
                                                <span className="leading-snug">{err}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end gap-3">
                    {!isUploading && !isComplete && (
                        <>
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processUpload}
                                disabled={!file}
                                className="px-6 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                            >
                                <Upload size={16} /> Process Bulk Upload
                            </button>
                        </>
                    )}
                    
                    {isComplete && (
                        <button
                            onClick={() => {
                                resetState();
                                onClose();
                            }}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
