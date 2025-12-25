"use client";

import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function AnalyticsCharts() {
    const [userChartData, setUserChartData] = useState<any>({
        labels: [],
        datasets: [],
    });
    const [viewsChartData, setViewsChartData] = useState<any>({
        labels: [],
        datasets: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Generate last 7 days
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i)); // Start from 6 days ago to today
                    return d.toISOString().split('T')[0];
                });

                // 1. Fetch User Signups
                const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(50));
                const querySnapshot = await getDocs(q);

                const userCounts = last7Days.reduce((acc, date) => {
                    acc[date] = 0;
                    return acc;
                }, {} as Record<string, number>);

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.createdAt) {
                        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                        const dateStr = date.toISOString().split('T')[0];
                        if (userCounts[dateStr] !== undefined) {
                            userCounts[dateStr]++;
                        }
                    }
                });

                setUserChartData({
                    labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })),
                    datasets: [
                        {
                            label: 'New Users',
                            data: Object.values(userCounts),
                            backgroundColor: '#0E4D55',
                            borderRadius: 6,
                        },
                    ],
                });

                // 2. Fetch Page Views for last 7 days
                const viewCounts = await Promise.all(
                    last7Days.map(async (date) => {
                        try {
                            const viewDoc = await getDoc(doc(db, "page_views", date));
                            if (viewDoc.exists()) {
                                return viewDoc.data()?.count || 0;
                            }
                            return 0;
                        } catch {
                            return 0;
                        }
                    })
                );

                setViewsChartData({
                    labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })),
                    datasets: [
                        {
                            label: 'Page Views',
                            data: viewCounts,
                            borderColor: '#0E4D55',
                            backgroundColor: 'rgba(14, 77, 85, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#0E4D55',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7,
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Page Views Line Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-slate-800">Site Traffic</h3>
                <p className="text-sm text-gray-500 mb-4">Page views over the last 7 days</p>
                <div className="h-64">
                    <Line
                        data={viewsChartData}
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
                                    grid: {
                                        color: 'rgba(0,0,0,0.05)',
                                    },
                                },
                                x: {
                                    grid: {
                                        display: false,
                                    },
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* User Signups Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-slate-800">New Signups</h3>
                <p className="text-sm text-gray-500 mb-4">User registrations over the last 7 days</p>
                <div className="h-64">
                    <Bar
                        data={userChartData}
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
                                    },
                                    grid: {
                                        color: 'rgba(0,0,0,0.05)',
                                    },
                                },
                                x: {
                                    grid: {
                                        display: false,
                                    },
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

