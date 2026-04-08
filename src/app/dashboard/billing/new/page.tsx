"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  ArrowLeft,
  X,
  IndianRupee,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PatientSearch from "@/components/shared/patient-search";

interface Patient {
  id: string;
  patientId: string;
  name: string;
  phone: string;
}

interface BillItemRow {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

const CATEGORIES = [
  "Consultation",
  "Lab Test",
  "Medicine",
  "Procedure",
  "Other",
];

const COMMON_PRESETS = [
  { description: "Consultation Fee", category: "Consultation", unitPrice: 500 },
  { description: "Follow-up Visit", category: "Consultation", unitPrice: 300 },
  { description: "Lab - Blood Test", category: "Lab Test", unitPrice: 400 },
  { description: "Lab - Urine Test", category: "Lab Test", unitPrice: 200 },
  { description: "X-Ray", category: "Procedure", unitPrice: 800 },
  { description: "ECG", category: "Procedure", unitPrice: 600 },
];

const PAYMENT_METHODS = [
  { value: "Cash", icon: Banknote },
  { value: "Card", icon: CreditCard },
  { value: "UPI", icon: Smartphone },
  { value: "Bank Transfer", icon: IndianRupee },
  { value: "Insurance", icon: CreditCard },
];

let itemCounter = 0;
function newItemId() {
  return `item-${++itemCounter}`;
}

function NewBillForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prescriptionId = searchParams.get("prescriptionId") || "";

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [linkedPrescriptionId, setLinkedPrescriptionId] =
    useState(prescriptionId);

  const [items, setItems] = useState<BillItemRow[]>([
    {
      id: newItemId(),
      description: "",
      category: "Consultation",
      quantity: 1,
      unitPrice: 0,
    },
  ]);

  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Fetch clinic settings for tax rate
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.taxRate !== undefined) {
            setTaxRate(data.taxRate);
          }
        }
      } catch {
        // Settings endpoint may not exist yet, use default
      }
    }
    fetchSettings();
  }, []);

  // Calculations
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal - discount + taxAmount;

  const addItem = () => {
    setItems([
      ...items,
      {
        id: newItemId(),
        description: "",
        category: "Consultation",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const addPreset = (preset: (typeof COMMON_PRESETS)[number]) => {
    setItems([
      ...items,
      {
        id: newItemId(),
        description: preset.description,
        category: preset.category,
        quantity: 1,
        unitPrice: preset.unitPrice,
      },
    ]);
    setShowPresets(false);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BillItemRow, value: string | number) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      alert("Please select a patient");
      return;
    }

    const validItems = items.filter(
      (item) => item.description.trim() && item.unitPrice > 0
    );
    if (validItems.length === 0) {
      alert("Please add at least one valid item");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          prescriptionId: linkedPrescriptionId || undefined,
          items: validItems.map((item) => ({
            description: item.description,
            category: item.category,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          discount,
          taxRate,
          paymentMethod: paymentMethod || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create bill");
      }

      const bill = await res.json();
      router.push(`/dashboard/billing/${bill.id}`);
    } catch (error) {
      console.error("Error creating bill:", error);
      alert(error instanceof Error ? error.message : "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/billing")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Bill</h1>
          <p className="text-sm text-slate-500">
            Create a new invoice for a patient
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patient">Patient</Label>
              <div className="mt-1">
                <PatientSearch
                  onSelect={(patient) =>
                    setSelectedPatient({
                      id: patient.id,
                      name: patient.name,
                      patientId: patient.patientId,
                      phone: patient.phone,
                    })
                  }
                  selectedPatient={selectedPatient}
                  onClear={() => setSelectedPatient(null)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="prescriptionId">
                Linked Prescription ID (optional)
              </Label>
              <Input
                id="prescriptionId"
                placeholder="Prescription ID"
                value={linkedPrescriptionId}
                onChange={(e) => setLinkedPrescriptionId(e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bill Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Bill Items</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPresets(!showPresets)}
                  >
                    Add Common Item
                  </Button>
                  {showPresets && (
                    <div className="absolute right-0 z-10 mt-1 w-56 rounded-md border bg-white shadow-lg">
                      {COMMON_PRESETS.map((preset) => (
                        <button
                          key={preset.description}
                          type="button"
                          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50"
                          onClick={() => addPreset(preset)}
                        >
                          <span>{preset.description}</span>
                          <span className="text-slate-400">
                            {formatCurrency(preset.unitPrice)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Table Header */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-medium text-slate-500 px-1">
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-lg border p-3 sm:p-2 sm:items-center"
                >
                  <div className="sm:col-span-4">
                    <Label className="sm:hidden text-xs text-slate-500">
                      Description
                    </Label>
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, "description", e.target.value)
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="sm:hidden text-xs text-slate-500">
                      Category
                    </Label>
                    <select
                      value={item.category}
                      onChange={(e) =>
                        updateItem(item.id, "category", e.target.value)
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <Label className="sm:hidden text-xs text-slate-500">
                      Qty
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="h-9 text-center"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="sm:hidden text-xs text-slate-500">
                      Unit Price
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "unitPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-9 text-right"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-end">
                    <span className="text-sm font-medium">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                  <div className="sm:col-span-1 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={items.length <= 1}
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totals & Payment */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="discount" className="text-sm text-slate-600">
                Discount
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">-</span>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(parseFloat(e.target.value) || 0)
                  }
                  className="h-9 w-32 text-right"
                />
              </div>
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="taxRate" className="text-sm text-slate-600">
                Tax Rate (%)
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="taxRate"
                  type="number"
                  min={0}
                  step="0.01"
                  value={taxRate}
                  onChange={(e) =>
                    setTaxRate(parseFloat(e.target.value) || 0)
                  }
                  className="h-9 w-24 text-right"
                />
                <span className="w-32 text-right text-sm text-slate-500">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">
                  Grand Total
                </span>
                <span className="text-2xl font-bold text-teal-600">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="mb-3 block text-sm text-slate-600">
                Payment Method (leave empty for pending bill)
              </Label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() =>
                        setPaymentMethod(
                          paymentMethod === method.value ? "" : method.value
                        )
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                        paymentMethod === method.value
                          ? "border-teal-600 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {method.value}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/billing")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Bill"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewBillPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
        </div>
      }
    >
      <NewBillForm />
    </Suspense>
  );
}
