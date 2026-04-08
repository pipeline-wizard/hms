"use client";

import { useRouter } from "next/navigation";
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
    href: "/dashboard/patients",
  },
  {
    key: "todayPrescriptions" as const,
    label: "Today's Prescriptions",
    icon: FileText,
    bgColor: "bg-teal-100",
    iconColor: "text-teal-600",
    growthKey: null,
    format: (val: number) => val.toLocaleString("en-IN"),
    href: "/dashboard/prescriptions",
  },
  {
    key: "monthRevenue" as const,
    label: "Revenue This Month",
    icon: IndianRupee,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    growthKey: "revenueGrowth" as const,
    format: (val: number) => formatCurrency(val),
    href: "/dashboard/billing",
  },
  {
    key: "pendingBills" as const,
    label: "Pending Bills",
    icon: Receipt,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    growthKey: null,
    format: (val: number) => val.toLocaleString("en-IN"),
    href: "/dashboard/billing?status=PENDING",
  },
];

export function StatsCards({ stats }: StatsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const value = stats[card.key];
        const growth = card.growthKey ? stats[card.growthKey] : null;

        return (
          <Card
            key={card.key}
            className={cn(
              "animate-in cursor-pointer overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5",
            )}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
            onClick={() => router.push(card.href)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {card.format(value)}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full",
                    card.bgColor,
                  )}
                >
                  <Icon className={cn("h-5 w-5", card.iconColor)} />
                </div>
              </div>

              {growth !== null && (
                <div className="mt-2 flex items-center gap-1 text-sm">
                  {growth >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
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
