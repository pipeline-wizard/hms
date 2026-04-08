"use client";

import { Users, FileText, IndianRupee, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

interface StatsProps {
  stats: {
    totalPatients: number;
    todayPrescriptions: number;
    monthRevenue: number;
    pendingBills: number;
    patientGrowth: number;
    revenueGrowth: number;
  };
}

const cards = [
  {
    key: "totalPatients" as const,
    label: "Total Patients",
    icon: Users,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    growthKey: "patientGrowth" as const,
    format: (val: number) => val.toLocaleString("en-IN"),
  },
  {
    key: "todayPrescriptions" as const,
    label: "Today's Prescriptions",
    icon: FileText,
    bgColor: "bg-teal-100",
    iconColor: "text-teal-600",
    growthKey: null,
    format: (val: number) => val.toLocaleString("en-IN"),
  },
  {
    key: "monthRevenue" as const,
    label: "Revenue This Month",
    icon: IndianRupee,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    growthKey: "revenueGrowth" as const,
    format: (val: number) => formatCurrency(val),
  },
  {
    key: "pendingBills" as const,
    label: "Pending Bills",
    icon: Receipt,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    growthKey: null,
    format: (val: number) => val.toLocaleString("en-IN"),
  },
];

export function StatsCards({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const value = stats[card.key];
        const growth = card.growthKey ? stats[card.growthKey] : null;

        return (
          <Card
            key={card.key}
            className={cn(
              "animate-in overflow-hidden transition-shadow hover:shadow-md",
            )}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">
                    {card.format(value)}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    card.bgColor,
                  )}
                >
                  <Icon className={cn("h-6 w-6", card.iconColor)} />
                </div>
              </div>

              {growth !== null && (
                <div className="mt-3 flex items-center gap-1 text-sm">
                  {growth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={cn(
                      "font-medium",
                      growth >= 0 ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {growth >= 0 ? "+" : ""}
                    {growth.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
