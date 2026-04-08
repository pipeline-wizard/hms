"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus,
  Search,
  FileDown,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Pill,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatDate } from "@/lib/utils";

interface Prescription {
  id: string;
  diagnosis: string;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    patientId: string;
    age: number;
    gender: string;
  };
  doctor: {
    id: string;
    name: string;
    specialization: string | null;
  };
  items: { id: string }[];
  bill: { id: string; billNumber: string; status: string } | null;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
}

type BillFilter = "all" | "billed" | "unbilled";

export default function PrescriptionsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [billFilter, setBillFilter] = useState<BillFilter>("all");

  const userRole = session?.user?.role;
  const isDoctor = userRole === "DOCTOR";
  const canFilterByDoctor = userRole === "ADMIN" || userRole === "RECEPTIONIST";

  // Fetch doctors list for the filter dropdown (ADMIN/RECEPTIONIST only)
  useEffect(() => {
    if (!canFilterByDoctor) return;
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        const users = Array.isArray(data) ? data : data.users || [];
        const doctorUsers = users.filter(
          (u: { role: string; isActive?: boolean }) =>
            u.role === "DOCTOR" && u.isActive !== false
        );
        setDoctors(doctorUsers);
      })
      .catch(() => {});
  }, [canFilterByDoctor]);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (search) params.set("search", search);
      if (selectedDoctorId) params.set("doctorId", selectedDoctorId);

      const res = await fetch(`/api/prescriptions?${params}`);
      const data = await res.json();
      setPrescriptions(data.prescriptions || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDoctorId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPrescriptions();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPrescriptions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prescription?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/prescriptions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPrescriptions();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete prescription");
      }
    } catch (error) {
      console.error("Error deleting prescription:", error);
      alert("Failed to delete prescription");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadPdf = (id: string) => {
    window.open(`/api/prescriptions/${id}/pdf`, "_blank");
  };

  // Client-side bill filter
  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (billFilter === "billed") return rx.bill !== null;
    if (billFilter === "unbilled") return rx.bill === null;
    return true;
  });

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-title">Prescriptions</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {total} prescription{total !== 1 ? "s" : ""} total
              </p>
              {isDoctor && (
                <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">
                  Showing your prescriptions
                </Badge>
              )}
            </div>
          </div>
          <Link href="/dashboard/prescriptions/new">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" />
              New Prescription
            </Button>
          </Link>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name or diagnosis..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              {canFilterByDoctor && (
                <div className="w-full sm:w-[200px]">
                  <Select
                    value={selectedDoctorId}
                    onValueChange={(value) => {
                      setSelectedDoctorId(value === "all" ? "" : value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Doctors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doctors</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="w-full sm:w-[160px]">
                <Select
                  value={billFilter}
                  onValueChange={(value: BillFilter) => setBillFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bill Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="billed">Billed</SelectItem>
                    <SelectItem value="unbilled">Not Billed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  <p className="text-sm text-muted-foreground">Loading prescriptions...</p>
                </div>
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {search || billFilter !== "all" ? "No prescriptions found" : "No prescriptions yet"}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {search
                    ? "Try adjusting your search terms or filters."
                    : "Create your first prescription to get started."}
                </p>
                {!search && (
                  <Link href="/dashboard/prescriptions/new" className="mt-6">
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="mr-2 h-4 w-4" />
                      New Prescription
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead className="hidden md:table-cell">Doctor</TableHead>
                      <TableHead className="hidden lg:table-cell">Diagnosis</TableHead>
                      <TableHead className="text-center">Meds</TableHead>
                      <TableHead className="hidden sm:table-cell">Billing</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrescriptions.map((rx) => (
                      <TableRow
                        key={rx.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/dashboard/prescriptions/${rx.id}`)}
                      >
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(rx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rx.patient.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {rx.patient.patientId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>
                            <p className="text-sm">Dr. {rx.doctor.name}</p>
                            {rx.doctor.specialization && (
                              <p className="text-xs text-muted-foreground">
                                {rx.doctor.specialization}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                                {rx.diagnosis}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              {rx.diagnosis}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                            <Pill className="h-3.5 w-3.5" />
                            {rx.items.length}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {rx.bill ? (
                            <Badge
                              className={cn(
                                "text-xs",
                                rx.bill.status === "PAID"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              )}
                              variant="outline"
                            >
                              {rx.bill.status === "PAID" ? "Paid" : "Bill Pending"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              No Bill
                            </Badge>
                          )}
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
                                  onClick={() => router.push(`/dashboard/prescriptions/${rx.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View prescription</TooltipContent>
                            </Tooltip>
                            {!rx.bill && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-amber-600 hover:text-amber-700"
                                    onClick={() =>
                                      router.push(`/dashboard/billing/new?prescriptionId=${rx.id}`)
                                    }
                                  >
                                    <Receipt className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Create bill</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDownloadPdf(rx.id)}
                                >
                                  <FileDown className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download PDF</TooltipContent>
                            </Tooltip>
                            {!isDoctor && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(rx.id)}
                                    disabled={deleting === rx.id}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
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
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
