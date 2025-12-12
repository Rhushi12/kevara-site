"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download } from "lucide-react";
import Link from "next/link";

export default function ImportProductsPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResults([]);
            setErrors([]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResults([]);
        setErrors([]);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/products/import", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data.results) setResults(data.results);
            if (data.errors) setErrors(data.errors);

            if (!res.ok && !data.results) {
                setErrors([data.error || "Upload failed"]);
            }

        } catch (error) {
            setErrors(["Network error occurred"]);
        } finally {
            setUploading(false);
        }
    };

    const downloadSample = () => {
        const headers = "title,price,description,images,video,colors,sizes,status";
        const row1 = '"Summer Dress",1299,"Beautiful cotton dress","https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500","","Red:#FF0000|Blue:#0000FF","S,M,L","ACTIVE"';
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + row1;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sample_products.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-light tracking-tight mb-2">Import Products</h1>
                    <p className="text-gray-500">Bulk upload products via CSV</p>
                </div>
                <Link href="/admin/products" className="text-sm hover:underline">
                    Back to Products
                </Link>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">

                {/* File Upload Area */}
                <div className="mb-8">
                    <label className="block text-sm font-medium mb-2">Upload CSV File</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-black transition-colors">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                            id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                            <Upload className="w-8 h-8 text-gray-400 mb-3" />
                            <span className="text-sm font-medium">
                                {file ? file.name : "Click to upload CSV"}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">
                                Supported format: .csv
                            </span>
                        </label>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={downloadSample}
                            className="text-xs flex items-center gap-1 text-gray-500 hover:text-black"
                        >
                            <Download className="w-3 h-3" /> Download Sample CSV
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 border-t pt-6">
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Start Import"
                        )}
                    </button>
                </div>

            </div>

            {/* Results */}
            {(results.length > 0 || errors.length > 0) && (
                <div className="mt-8 space-y-4">
                    <h3 className="font-medium">Import Results</h3>

                    {errors.length > 0 && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm space-y-1">
                            {errors.map((err, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{err}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm space-y-1">
                            <div className="font-medium mb-2">Successfully imported {results.length} products:</div>
                            {results.map((res, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    <span>Row {res.row}: <strong>{res.title}</strong> (Handle: {res.handle})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
