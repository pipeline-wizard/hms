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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
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
import { formatDate } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Prescriptions</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500">
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

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Search Prescriptions</CardTitle>
          <CardDescription>
            Search by patient name or diagnosis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search prescriptions..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            {canFilterByDoctor && (
              <div className="w-full sm:w-[220px]">
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
                        {doctor.specialization ? ` (${doctor.specialization})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                <p className="text-sm text-slate-500">Loading prescriptions...</p>
              </div>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FileText className="h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-medium text-slate-900">
                No prescriptions found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try adjusting your search terms"
                  : "Create your first prescription to get started"}
              </p>
              {!search && (
                <Link href="/dashboard/prescriptions/new" className="mt-4">
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
                    <TableHead>Patient Name</TableHead>
                    <TableHead className="hidden md:table-cell">Doctor</TableHead>
                    <TableHead className="hidden lg:table-cell">Diagnosis</TableHead>
                    <TableHead className="text-center">Medicines</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.map((prescription) => (
                    <TableRow
                      key={prescription.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() =>
                        router.push(`/dashboard/prescriptions/${prescription.id}`)
                      }
                    >
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(prescription.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {prescription.patient.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {prescription.patient.patientId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <p className="text-sm">Dr. {prescription.doctor.name}</p>
                          {prescription.doctor.specialization && (
                            <p className="text-xs text-slate-500">
                              {prescription.doctor.specialization}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="max-w-[200px] truncate text-sm text-slate-600">
                          {prescription.diagnosis}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {prescription.items.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {prescription.bill ? (
                          <Badge
                            variant={
                              prescription.bill.status === "PAID"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              prescription.bill.status === "PAID"
                                ? "bg-emerald-100 text-emerald-700"
                                : ""
                            }
                          >
                            {prescription.bill.status === "PAID"
                              ? "Billed"
                              : "Bill Pending"}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-slate-500"
                          >
                            No Bill
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-teal-600"
                            onClick={() => handleDownloadPdf(prescription.id)}
                            title="Download PDF"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                            onClick={() => handleDelete(prescription.id)}
                            disabled={deleting === prescription.id}
                            title="Delete"
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-slate-500">
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
  );
}
