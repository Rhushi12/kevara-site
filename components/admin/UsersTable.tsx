"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    lastLogin: Timestamp;
    role?: string;
}

export default function UsersTable() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/admin/customers');
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.customers || []);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) return <div className="text-center py-8 text-gray-400">Loading Leads from Shopify...</div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-medium">
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Created At</th>
                            <th className="px-6 py-4">Total Spent</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {user.firstName} {user.lastName}
                                </td>
                                <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-slate-700 font-medium">
                                        {user.amountSpent?.amount > 0 ?
                                            `${user.amountSpent.currencyCode} ${user.amountSpent.amount}` :
                                            '-'
                                        }
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {users.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                    No leads found in Shopify yet.
                </div>
            )}
        </div>
    );
}
