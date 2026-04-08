"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

interface RecentPrescriptionsProps {
  prescriptions: Array<{
    id: string;
    patient: { name: string };
    doctor: { name: string };
    diagnosis: string;
    createdAt: string;
  }>;
}

export function RecentPrescriptions({ prescriptions }: RecentPrescriptionsProps) {
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
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <Link
              key={rx.id}
              href={`/dashboard/prescriptions/${rx.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium leading-tight truncate">
                    {rx.patient.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {rx.diagnosis}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dr. {rx.doctor.name}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      "bg-teal-100 text-teal-700",
                    )}
                  >
                    Completed
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(rx.createdAt)}
                  </p>
                </div>
              </div>
            </Link>
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
