"use client";

import { useState } from "react";

export default function DebugUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState("Idle");
    const [result, setResult] = useState<any>(null);

    const handleUpload = async () => {
        if (!file) return;
        setStatus("Uploading...");

        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch("/api/debug-upload-form", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            setResult(data);
            setStatus("Done");
        } catch (e: any) {
            setResult({ error: e.message });
            setStatus("Error");
        }
    };

    return (
        <div className="p-10">
            <h1 className="text-xl font-bold mb-4">Debug Upload Form</h1>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button
                onClick={handleUpload}
                className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
            >
                Upload Test
            </button>
            <div className="mt-4">
                <p>Status: {status}</p>
                <pre className="bg-gray-100 p-2 mt-2 border text-xs">
                    {JSON.stringify(result, null, 2)}
                </pre>
            </div>
        </div>
    );
}
