"use client";

import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function AnalyticsCharts() {
    const [chartData, setChartData] = useState<any>({
        labels: [],
        datasets: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(50));
                const querySnapshot = await getDocs(q);

                // Group by date (Last 7 days)
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                }).reverse();

                const counts = last7Days.reduce((acc, date) => {
                    acc[date] = 0;
                    return acc;
                }, {} as Record<string, number>);

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.createdAt) {
                        // Handle different timestamp formats just in case
                        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                        const dateStr = date.toISOString().split('T')[0];
                        if (counts[dateStr] !== undefined) {
                            counts[dateStr]++;
                        }
                    }
                });

                setChartData({
                    labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
                    datasets: [
                        {
                            label: 'New Users',
                            data: Object.values(counts),
                            backgroundColor: '#0E4D55',
                        },
                    ],
                });
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">Loading Analytics...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4 text-slate-800">New User Signups (Last 7 Days)</h3>
            <div className="h-64">
                <Bar
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false,
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
}
