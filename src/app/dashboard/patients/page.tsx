"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
  AlertCircle,
  BedDouble,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isDoctor = userRole === "DOCTOR";

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

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Patients</h1>
            <p className="text-sm text-muted-foreground">
              {total} patient{total !== 1 ? "s" : ""} registered
            </p>
          </div>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => router.push("/dashboard/patients/new")}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Patient
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or patient ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
                  <p className="text-sm text-muted-foreground">Loading patients...</p>
                </div>
              </div>
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Users className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {search ? "No patients found" : "No patients yet"}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {search
                    ? `No patients matching "${search}". Try a different search term or register a new patient.`
                    : typeFilter !== "ALL"
                    ? `No ${typeFilter.toLowerCase()} patients found.`
                    : "Get started by adding your first patient. All patient records, prescriptions, and billing will be tracked here."}
                </p>
                <Button
                  className="mt-6 bg-teal-600 hover:bg-teal-700"
                  onClick={() => router.push("/dashboard/patients/new")}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Your First Patient
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="hidden md:table-cell">Patient ID</TableHead>
                      <TableHead className="hidden lg:table-cell">Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow
                        key={patient.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/patients/${patient.id}`)
                        }
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {patient.gender.toLowerCase()}
                              {patient.bloodGroup && ` · ${patient.bloodGroup}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "text-xs",
                              patient.patientType === "INPATIENT"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "bg-green-100 text-green-800 hover:bg-green-100"
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
                        <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                          {patient.patientId}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {formatDate(patient.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    router.push(`/dashboard/patients/${patient.id}`)
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View details</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    router.push(`/dashboard/patients/${patient.id}/edit`)
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit patient</TooltipContent>
                            </Tooltip>
                            {!isDoctor && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteId(patient.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete patient</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
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
                )}
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
    </TooltipProvider>
  );
}
