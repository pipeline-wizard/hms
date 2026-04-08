"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
  AlertCircle,
  BedDouble,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";

interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  phone: string;
  email: string | null;
  bloodGroup: string | null;
  patientType: "OUTPATIENT" | "INPATIENT";
  createdAt: string;
}

type PatientTypeFilter = "ALL" | "OUTPATIENT" | "INPATIENT";

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<PatientTypeFilter>("ALL");

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { q: search }),
        ...(typeFilter !== "ALL" && { patientType: typeFilter }),
      });
      const res = await fetch(`/api/patients?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPatients(data.patients);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/patients/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteId(null);
      fetchPatients();
    } catch (error) {
      console.error("Error deleting patient:", error);
    } finally {
      setDeleting(false);
    }
  };

  const genderVariant = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "default";
      case "FEMALE":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="text-muted-foreground">
            Manage your patient records
          </p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => router.push("/dashboard/patients/new")}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Patient
        </Button>
      </div>

      {/* Filter Tabs and Search */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Patient Type Filter */}
          <div className="flex items-center gap-2">
            {(
              [
                { value: "ALL", label: "All Patients" },
                { value: "OUTPATIENT", label: "Outpatient" },
                { value: "INPATIENT", label: "Inpatient" },
              ] as { value: PatientTypeFilter; label: string }[]
            ).map((filter) => (
              <Button
                key={filter.value}
                variant={typeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTypeFilter(filter.value);
                  setPage(1);
                }}
                className={cn(
                  typeFilter === filter.value && filter.value === "INPATIENT" &&
                    "bg-blue-600 hover:bg-blue-700",
                  typeFilter === filter.value && filter.value === "OUTPATIENT" &&
                    "bg-green-600 hover:bg-green-700"
                )}
              >
                {filter.value === "INPATIENT" && (
                  <BedDouble className="mr-1.5 h-3.5 w-3.5" />
                )}
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or patient ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              className="bg-teal-600 hover:bg-teal-700 shrink-0"
              onClick={() => router.push("/dashboard/patients/new")}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No patients found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {search
                  ? `No patients matching "${search}". Would you like to register a new patient?`
                  : typeFilter !== "ALL"
                  ? `No ${typeFilter.toLowerCase()} patients found`
                  : "Get started by registering your first patient"}
              </p>
              <Button
                className="mt-4 bg-teal-600 hover:bg-teal-700"
                onClick={() => router.push("/dashboard/patients/new")}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Patient
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono text-sm">
                        {patient.patientId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {patient.name}
                      </TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell>
                        <Badge variant={genderVariant(patient.gender)}>
                          {patient.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            patient.patientType === "INPATIENT"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300"
                          )}
                          variant="outline"
                        >
                          {patient.patientType === "INPATIENT" && (
                            <BedDouble className="mr-1 h-3 w-3" />
                          )}
                          {patient.patientType === "INPATIENT"
                            ? "Inpatient"
                            : "Outpatient"}
                        </Badge>
                      </TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.bloodGroup || "-"}</TableCell>
                      <TableCell>{formatDate(patient.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(
                                `/dashboard/patients/${patient.id}`
                              )
                            }
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(
                                `/dashboard/patients/${patient.id}/edit`
                              )
                            }
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(patient.id)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 10 + 1} to{" "}
                  {Math.min(page * 10, total)} of {total} patients
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Patient
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this patient? This action cannot be
              undone. All associated prescriptions and bills will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
