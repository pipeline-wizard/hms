"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Trash2,
  IndianRupee,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  email: string | null;
  address: string | null;
}

interface BillItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface PrescriptionDoctor {
  id: string;
  name: string;
  specialization: string | null;
}

interface Prescription {
  id: string;
  diagnosis: string;
  doctor: PrescriptionDoctor;
}

interface Bill {
  id: string;
  billNumber: string;
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
  prescription: Prescription | null;
}

interface ClinicSettings {
  clinicName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxName: string;
}

const statusBadgeClass: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  PARTIAL: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export default function BillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [bill, setBill] = useState<Bill | null>(null);
  const [settings, setSettings] = useState<ClinicSettings>({
    clinicName: "My Clinic",
    address: null,
    phone: null,
    email: null,
    website: null,
    taxName: "GST",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [billRes, settingsRes] = await Promise.all([
          fetch(`/api/billing/${id}`),
          fetch("/api/settings").catch(() => null),
        ]);

        if (!billRes.ok) throw new Error("Bill not found");
        const billData = await billRes.json();
        setBill(billData);

        if (settingsRes && settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings((prev) => ({ ...prev, ...settingsData }));
        }
      } catch (error) {
        console.error("Error fetching bill:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsPaid = async () => {
    if (!bill || !confirm("Mark this bill as paid?")) return;
    try {
      const res = await fetch(`/api/billing/${bill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", paymentMethod: "Cash" }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setBill((prev) => (prev ? { ...prev, ...updated } : null));
    } catch (error) {
      console.error("Error updating bill:", error);
    }
  };

  const handleDelete = async () => {
    if (!bill || !confirm("Are you sure you want to delete this bill?")) return;
    try {
      const res = await fetch(`/api/billing/${bill.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/dashboard/billing");
    } catch (error) {
      console.error("Error deleting bill:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <p className="text-lg font-medium">Bill not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/billing")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Billing
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Action Bar - hidden on print */}
      <div className="no-print flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/billing")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Billing
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          {bill.status === "PENDING" && (
            <Button
              variant="outline"
              className="text-green-600 hover:text-green-700"
              onClick={handleMarkAsPaid}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Invoice */}
      <Card className="overflow-hidden">
        <CardContent className="p-8 sm:p-10">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b pb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {settings.clinicName}
              </h1>
              {settings.address && (
                <p className="mt-1 text-sm text-slate-500">
                  {settings.address}
                </p>
              )}
              {settings.phone && (
                <p className="text-sm text-slate-500">
                  Phone: {settings.phone}
                </p>
              )}
              {settings.email && (
                <p className="text-sm text-slate-500">
                  Email: {settings.email}
                </p>
              )}
              {settings.website && (
                <p className="text-sm text-slate-500">{settings.website}</p>
              )}
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-xl font-bold text-teal-600">INVOICE</h2>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-medium">Bill #:</span> {bill.billNumber}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Date:</span>{" "}
                {formatDate(bill.createdAt)}
              </p>
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={statusBadgeClass[bill.status]}
                >
                  {bill.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="grid gap-6 sm:grid-cols-2 border-b py-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Bill To
              </h3>
              <p className="mt-2 font-medium text-slate-900">
                {bill.patient.name}
              </p>
              <p className="text-sm text-slate-600">
                Patient ID: {bill.patient.patientId}
              </p>
              <p className="text-sm text-slate-600">
                Phone: {bill.patient.phone}
              </p>
              {bill.patient.email && (
                <p className="text-sm text-slate-600">{bill.patient.email}</p>
              )}
              {bill.patient.address && (
                <p className="text-sm text-slate-600">{bill.patient.address}</p>
              )}
            </div>
            {bill.prescription && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Prescription Details
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-medium">Doctor:</span>{" "}
                  {bill.prescription.doctor.name}
                  {bill.prescription.doctor.specialization &&
                    ` (${bill.prescription.doctor.specialization})`}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Diagnosis:</span>{" "}
                  {bill.prescription.diagnosis}
                </p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-slate-400">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="border-t pt-6">
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{formatCurrency(bill.subtotal)}</span>
                </div>
                {bill.discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Discount</span>
                    <span className="text-red-500">
                      -{formatCurrency(bill.discount)}
                    </span>
                  </div>
                )}
                {bill.taxAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {settings.taxName} ({bill.taxRate}%)
                    </span>
                    <span>{formatCurrency(bill.taxAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-lg font-bold text-slate-900">
                    Grand Total
                  </span>
                  <span className="text-lg font-bold text-teal-600">
                    {formatCurrency(bill.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {bill.paymentMethod && (
            <div className="mt-6 rounded-lg bg-green-50 p-4 border border-green-100">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Paid via {bill.paymentMethod}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          {bill.notes && (
            <div className="mt-6 rounded-lg bg-slate-50 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Notes
              </h4>
              <p className="mt-1 text-sm text-slate-600">{bill.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 border-t pt-6 text-center text-xs text-slate-400">
            <p>Thank you for choosing {settings.clinicName}.</p>
            <p className="mt-1">This is a computer-generated invoice.</p>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print,
          header,
          nav,
          aside {
            display: none !important;
          }
          body {
            background: white !important;
          }
          main {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
