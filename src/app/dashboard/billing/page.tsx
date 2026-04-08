"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Receipt,
  CheckCircle,
  IndianRupee,
  Printer,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BillPatient {
  id: string;
  name: string;
  patientId: string;
  phone: string;
}

interface BillItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Bill {
  id: string;
  billNumber: string;
  patientId: string;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: "PENDING" | "PAID" | "PARTIAL" | "CANCELLED";
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  patient: BillPatient;
  items: BillItem[];
}

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Partial", value: "PARTIAL" },
  { label: "Cancelled", value: "CANCELLED" },
];

const statusBadgeClass: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900 border-amber-300 font-semibold",
  PAID: "bg-green-100 text-green-800 border-green-200",
  PARTIAL: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isDoctor = userRole === "DOCTOR";

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Summary stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [billsToday, setBillsToday] = useState(0);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "10");

      const res = await fetch(`/api/billing?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setBills(data.bills);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  const fetchSummary = useCallback(async () => {
    try {
      const [paidRes, pendingRes, todayRes] = await Promise.all([
        fetch("/api/billing?status=PAID&limit=1000"),
        fetch("/api/billing?status=PENDING&limit=1000"),
        fetch("/api/billing?limit=1000"),
      ]);

      const paidData = await paidRes.json();
      const pendingData = await pendingRes.json();
      const todayData = await todayRes.json();

      const revenue = paidData.bills.reduce(
        (sum: number, b: Bill) => sum + b.totalAmount,
        0
      );
      const pending = pendingData.bills.reduce(
        (sum: number, b: Bill) => sum + b.totalAmount,
        0
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = todayData.bills.filter(
        (b: Bill) => new Date(b.createdAt) >= today
      ).length;

      setTotalRevenue(revenue);
      setPendingAmount(pending);
      setBillsToday(todayCount);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm("Mark this bill as paid?")) return;
    try {
      const res = await fetch(`/api/billing/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", paymentMethod: "Cash" }),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchBills();
      fetchSummary();
    } catch (error) {
      console.error("Error updating bill:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    try {
      const res = await fetch(`/api/billing/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchBills();
      fetchSummary();
    } catch (error) {
      console.error("Error deleting bill:", error);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Billing</h1>
            <p className="text-sm text-muted-foreground">
              Manage invoices and payments
            </p>
          </div>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => router.push("/dashboard/billing/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Bill
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                onClick={() => { setStatusFilter("PAID"); setPage(1); }}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100">
                <IndianRupee className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-amber-200"
                onClick={() => { setStatusFilter("PENDING"); setPage(1); }}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
                <IndianRupee className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pending Amount
                </p>
                <p className="text-2xl font-bold text-amber-700">
                  {formatCurrency(pendingAmount)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Bills Today
                </p>
                <p className="text-2xl font-bold">{billsToday}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs + Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  statusFilter === tab.value
                    ? "bg-teal-600 text-white"
                    : "bg-card text-muted-foreground hover:bg-muted border"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bill # or patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
                  <p className="text-sm text-muted-foreground">Loading bills...</p>
                </div>
              </div>
            ) : bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Receipt className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {search || statusFilter ? "No bills found" : "No bills yet"}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {search
                    ? "Try adjusting your search or filters."
                    : "Create your first bill to start tracking payments."}
                </p>
                {!search && !statusFilter && (
                  <Button
                    className="mt-6 bg-teal-600 hover:bg-teal-700"
                    onClick={() => router.push("/dashboard/billing/new")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Bill
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
                    <TableRow
                      key={bill.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/dashboard/billing/${bill.id}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        {bill.billNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{bill.patient.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {bill.patient.patientId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDate(bill.createdAt)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center text-muted-foreground">
                        {bill.items.length} item{bill.items.length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-semibold">{formatCurrency(bill.totalAmount)}</p>
                          {bill.discount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              -{formatCurrency(bill.discount)} disc.
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusBadgeClass[bill.status]}
                        >
                          {bill.status}
                        </Badge>
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
                                onClick={() => router.push(`/dashboard/billing/${bill.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View invoice</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(`/dashboard/billing/${bill.id}`, "_blank")}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print invoice</TooltipContent>
                          </Tooltip>
                          {bill.status === "PENDING" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleMarkAsPaid(bill.id)}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Mark as paid</TooltipContent>
                            </Tooltip>
                          )}
                          {!isDoctor && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(bill.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete bill</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of{" "}
              {total} bills
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
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
      </div>
    </TooltipProvider>
  );
}
