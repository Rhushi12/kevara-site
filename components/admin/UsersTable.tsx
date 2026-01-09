"use client";

import { useEffect, useState } from "react";


interface UserData {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    createdAt?: any;
    lastLogin?: any;
}

export default function UsersTable() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/admin/users');
                const data = await response.json();

                if (data.error) throw new Error(data.error);

                setUsers(data.users || []);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) return <div className="text-center py-8 text-gray-400">Loading Users from Firebase...</div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-medium">
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4">Last Login</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {users.map((user) => (
                            <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-[#0E4D55] flex items-center justify-center text-white text-xs font-medium">
                                                {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <span className="font-medium text-slate-900">
                                            {user.displayName || "User"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {user.createdAt?.toDate?.()?.toLocaleDateString() || '-'}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {user.lastLogin?.toDate?.()?.toLocaleString() || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {users.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                    No users found yet. Users will appear here when they sign up or log in.
                </div>
            )}
        </div>
    );
}


