"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, Trash2, Shield, Loader2 } from "lucide-react";

export default function AdminManager() {
    const { user } = useAuth();
    const [admins, setAdmins] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch current admins
    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const res = await fetch('/api/admin/admins');
                if (res.ok) {
                    const data = await res.json();
                    setAdmins(data.emails || []);
                }
            } catch (err) {
                console.error("Failed to fetch admins:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdmins();
    }, []);

    const handleAddAdmin = async () => {
        if (!newEmail.trim()) return;
        if (!newEmail.includes("@")) {
            setError("Please enter a valid email address");
            return;
        }

        setAdding(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch('/api/admin/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newEmail.trim(),
                    requesterEmail: user?.email
                })
            });

            if (res.ok) {
                const data = await res.json();
                setAdmins(data.emails);
                setNewEmail("");
                setSuccess(`${newEmail.trim()} added as admin`);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to add admin");
            }
        } catch (err) {
            setError("Failed to add admin");
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveAdmin = async (email: string) => {
        if (!confirm(`Remove ${email} as admin?`)) return;

        setRemoving(email);
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`/api/admin/admins?email=${encodeURIComponent(email)}&requester=${encodeURIComponent(user?.email || '')}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                const data = await res.json();
                setAdmins(data.emails);
                setSuccess(`${email} removed as admin`);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to remove admin");
            }
        } catch (err) {
            setError("Failed to remove admin");
        } finally {
            setRemoving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <Shield className="text-[#0E4D55]" size={24} />
                <h3 className="text-lg font-bold text-slate-800">Admin Management</h3>
            </div>

            {/* Add New Admin */}
            <div className="flex gap-3">
                <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0E4D55] text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
                />
                <button
                    onClick={handleAddAdmin}
                    disabled={adding || !newEmail.trim()}
                    className="px-6 py-3 bg-[#0E4D55] text-white rounded-lg font-medium hover:bg-[#0A3A40] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {adding ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                    Add Admin
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
                    {success}
                </div>
            )}

            {/* Current Admins List */}
            <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Current Admins</p>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                    {admins.map((email) => (
                        <div key={email} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#0E4D55]/10 flex items-center justify-center">
                                    <span className="text-[#0E4D55] font-bold text-sm">
                                        {email.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">{email}</p>
                                    {email === user?.email?.toLowerCase() && (
                                        <span className="text-xs text-[#0E4D55]">(You)</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveAdmin(email)}
                                disabled={removing === email || admins.length <= 1}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={admins.length <= 1 ? "Cannot remove the last admin" : "Remove admin"}
                            >
                                {removing === email ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <Trash2 size={18} />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-400">
                Note: Users must first sign up on your site before being added as admins.
            </p>
        </div>
    );
}
