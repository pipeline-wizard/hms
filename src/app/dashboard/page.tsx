"use client";

import { useEffect, useState, useCallback } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentPatients } from "@/components/dashboard/recent-patients";
import { RecentPrescriptions } from "@/components/dashboard/recent-prescriptions";
import { cn } from "@/lib/utils";

type DateRange = "today" | "7d" | "30d";

const rangeLabels: Record<DateRange, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "This month",
};

interface DashboardData {
  stats: {
    totalPatients: number;
    todayPrescriptions: number;
    monthRevenue: number;
    pendingBills: number;
    patientGrowth: number;
    revenueGrowth: number;
  };
  revenueData: Array<{ date: string; amount: number }>;
  recentPatients: Array<{
    id: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    createdAt: string;
  }>;
  recentPrescriptions: Array<{
    id: string;
    patient: { id: string; name: string };
    doctor: { name: string };
    diagnosis: string;
    createdAt: string;
    hasBill: boolean;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>("7d");

  const fetchDashboard = useCallback(async (r: DateRange) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard?range=${r}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(range);
  }, [range, fetchDashboard]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[110px] animate-pulse rounded-lg border bg-card"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-[400px] animate-pulse rounded-lg border bg-card" />
          <div className="h-[400px] animate-pulse rounded-lg border bg-card" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            {error}
          </p>
          <button
            onClick={() => fetchDashboard(range)}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with date range selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your clinic&apos;s performance
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          {(Object.keys(rangeLabels) as DateRange[]).map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                range === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {rangeLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <>
          <StatsCards stats={data.stats} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RevenueChart data={data.revenueData} />
            <RecentPrescriptions prescriptions={data.recentPrescriptions} />
          </div>

          <RecentPatients patients={data.recentPatients} />
        </>
      )}
    </div>
  );
}
