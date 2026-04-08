"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Receipt,
  CheckCircle,
  IndianRupee,
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
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  PARTIAL: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export default function BillingPage() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
      // Fetch all paid bills for revenue
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBills();
  };

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500">
            Manage invoices and payments
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/billing/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Bill
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <IndianRupee className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <IndianRupee className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Pending Amount
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(pendingAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Bills Today</p>
              <p className="text-2xl font-bold text-slate-900">{billsToday}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
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
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by bill number or patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Receipt className="mb-4 h-12 w-12" />
              <p className="text-lg font-medium">No bills found</p>
              <p className="text-sm">Create a new bill to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">
                      {bill.billNumber}
                    </TableCell>
                    <TableCell>{formatDate(bill.createdAt)}</TableCell>
                    <TableCell>{bill.patient.name}</TableCell>
                    <TableCell className="text-center">
                      {bill.items.length}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bill.subtotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bill.discount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bill.taxAmount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(bill.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusBadgeClass[bill.status]}
                      >
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View"
                          onClick={() =>
                            router.push(`/dashboard/billing/${bill.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {bill.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Mark as Paid"
                            onClick={() => handleMarkAsPaid(bill.id)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          onClick={() => handleDelete(bill.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
          <p className="text-sm text-slate-500">
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
  );
}
