"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

interface RecentPrescriptionsProps {
  prescriptions: Array<{
    id: string;
    patient: { name: string; id?: string };
    doctor: { name: string };
    diagnosis: string;
    createdAt: string;
    hasBill?: boolean;
  }>;
}

export function RecentPrescriptions({ prescriptions }: RecentPrescriptionsProps) {
  const router = useRouter();

  return (
    <Card className="animate-in" style={{ animationDelay: "600ms", animationFillMode: "backwards" }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Recent Prescriptions
        </CardTitle>
        <Link
          href="/dashboard/prescriptions"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="group rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-medium leading-tight truncate">
                    {rx.patient.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {rx.diagnosis}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      Dr. {rx.doctor.name}
                    </p>
                    <span className="text-xs text-muted-foreground/50">·</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(rx.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!rx.hasBill && (
                    <span className="mr-1 text-xs text-amber-600 font-medium">
                      No bill
                    </span>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/prescriptions/${rx.id}`)}
                    className="icon-btn opacity-0 group-hover:opacity-100"
                    title="View prescription"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {!rx.hasBill && (
                    <button
                      onClick={() => router.push(`/dashboard/billing/new?prescriptionId=${rx.id}`)}
                      className="icon-btn opacity-0 group-hover:opacity-100"
                      title="Create bill"
                    >
                      <Receipt className="h-4 w-4 text-amber-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {prescriptions.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No prescriptions found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
