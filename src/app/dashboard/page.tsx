"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentPatients } from "@/components/dashboard/recent-patients";
import { RecentPrescriptions } from "@/components/dashboard/recent-prescriptions";

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
    patient: { name: string };
    doctor: { name: string };
    diagnosis: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-lg border bg-card"
            />
          ))}
        </div>
        {/* Skeleton chart + lists */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-[400px] animate-pulse rounded-lg border bg-card" />
          <div className="h-[400px] animate-pulse rounded-lg border bg-card" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            {error ?? "Failed to load dashboard"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your clinic&apos;s performance
        </p>
      </div>

      <StatsCards stats={data.stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={data.revenueData} />
        <RecentPrescriptions prescriptions={data.recentPrescriptions} />
      </div>

      <RecentPatients patients={data.recentPatients} />
    </div>
  );
}
