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
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Fetch top 50 most recent logins
                const q = query(collection(db, "users"), orderBy("lastLogin", "desc"), limit(50));
                const snapshot = await getDocs(q);
                const fetchedUsers: UserData[] = [];
                snapshot.forEach((doc) => {
                    fetchedUsers.push(doc.data() as UserData);
                });
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) return <div className="text-center py-8 text-gray-400">Loading Leads...</div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-medium">
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Last Active</th>
                            <th className="px-6 py-4">Role</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {users.map((user) => (
                            <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {user.displayName || "Unknown"}
                                </td>
                                <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {user.lastLogin?.toDate
                                        ? user.lastLogin.toDate().toLocaleString()
                                        : "N/A"}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-block px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${user.role === 'admin' ? 'bg-[#0E4D55] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {user.role || 'User'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {users.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                    No leads found yet.
                </div>
            )}
        </div>
    );
}
