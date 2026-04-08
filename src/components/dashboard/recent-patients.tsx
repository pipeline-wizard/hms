"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface RecentPatientsProps {
  patients: Array<{
    id: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    createdAt: string;
  }>;
}

export function RecentPatients({ patients }: RecentPatientsProps) {
  return (
    <Card className="animate-in" style={{ animationDelay: "500ms", animationFillMode: "backwards" }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Patients</CardTitle>
        <Link
          href="/dashboard/patients"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Age</th>
                <th className="pb-3 font-medium">Gender</th>
                <th className="pb-3 font-medium hidden sm:table-cell">Phone</th>
                <th className="pb-3 font-medium hidden md:table-cell">Registered</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b last:border-0 transition-colors hover:bg-muted/50"
                >
                  <td className="py-3">
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {patient.name}
                    </Link>
                  </td>
                  <td className="py-3 text-muted-foreground">{patient.age}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize">
                      {patient.gender.toLowerCase()}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground hidden sm:table-cell">
                    {patient.phone}
                  </td>
                  <td className="py-3 text-muted-foreground hidden md:table-cell">
                    {formatDate(patient.createdAt)}
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No patients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
