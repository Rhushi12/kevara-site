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
import { adminFetch } from "@/lib/admin-fetch";

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
    const [viewsChartData, setViewsChartData] = useState<any>({
        labels: [],
        datasets: [],
    });

    const [userChartData, setUserChartData] = useState<any>({
        labels: [],
        datasets: [],
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await adminFetch('/api/admin/analytics');
                const data = await response.json();

                if (data.error) throw new Error(data.error);

                const { users, pageViews } = data;

                // Process Users Data
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d.toISOString().split('T')[0];
                });

                const userCounts = last7Days.reduce((acc, date) => {
                    acc[date] = 0;
                    return acc;
                }, {} as Record<string, number>);

                users.forEach((user: any) => {
                    if (user.createdAt) {
                        const dateStr = user.createdAt.split('T')[0];
                        if (userCounts[dateStr] !== undefined) {
                            userCounts[dateStr]++;
                        }
                    }
                });

                const labels = last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' }));

                setUserChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'New Customers',
                            data: Object.values(userCounts),
                            backgroundColor: '#e2e8f0',
                            hoverBackgroundColor: '#0A3A40',
                            borderRadius: 4,
                            barPercentage: 0.6,
                        },
                    ],
                });

                // Process Page Views Data
                const viewsValues = last7Days.map(date => {
                    return pageViews ? (pageViews[date] || 0) : 0;
                });

                setViewsChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'Page Views',
                            data: viewsValues,
                            borderColor: '#0E4D55',
                            backgroundColor: 'rgba(14, 77, 85, 0.08)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#0E4D55',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
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

    if (loading) return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px] flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 animate-pulse">
                <span className="text-sm font-medium text-slate-300 tracking-widest uppercase font-figtree">Loading Traffic Trends...</span>
            </div>
            <div className="h-[400px] flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 animate-pulse">
                <span className="text-sm font-medium text-slate-300 tracking-widest uppercase font-figtree">Loading Acquisitions...</span>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Page Views Line Chart */}
            <div className="group relative bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(37,99,235,0.06)] hover:-translate-y-1">
                <h3 className="text-2xl font-kamundi font-medium mb-1 text-slate-900 tracking-tight">Traffic Trend</h3>
                <p className="text-xs text-slate-400 mb-8 font-medium tracking-wide uppercase">Daily page views (last 7 days)</p>
                <div className="h-[300px]">
                    <Line
                        data={viewsChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: '#0E4D55',
                                    titleFont: { family: 'Geist', size: 11 },
                                    bodyFont: { family: 'Geist', size: 13, weight: 'bold' },
                                    padding: 12,
                                    cornerRadius: 8,
                                    displayColors: false,
                                    callbacks: {
                                        label: (context) => `${context.raw?.toLocaleString()} views`
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(0,0,0,0.03)' },
                                    border: { display: false },
                                    ticks: {
                                        font: { family: 'Geist', size: 11 },
                                        color: '#94a3b8',
                                    }
                                },
                                x: {
                                    grid: { display: false },
                                    border: { display: false },
                                    ticks: {
                                        font: { family: 'Geist', size: 11 },
                                        color: '#64748b'
                                    }
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Customer Acquisitions Bar Chart */}
            <div className="group relative bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.06)] hover:-translate-y-1">
                <h3 className="text-2xl font-kamundi font-medium mb-1 text-slate-900 tracking-tight">Customer Acquisitions</h3>
                <p className="text-xs text-slate-400 mb-8 font-medium tracking-wide uppercase">New registered accounts (last 7 days)</p>
                <div className="h-[300px]">
                    <Bar
                        data={userChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: '#0F172A',
                                    titleFont: { family: 'Geist', size: 11 },
                                    bodyFont: { family: 'Geist', size: 13, weight: 'bold' },
                                    padding: 12,
                                    cornerRadius: 8,
                                    displayColors: false,
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(0,0,0,0.03)' },
                                    border: { display: false },
                                    ticks: {
                                        stepSize: 1,
                                        font: { family: 'Geist', size: 11 },
                                        color: '#94a3b8'
                                    }
                                },
                                x: {
                                    grid: { display: false },
                                    border: { display: false },
                                    ticks: {
                                        font: { family: 'Geist', size: 11 },
                                        color: '#64748b'
                                    }
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
