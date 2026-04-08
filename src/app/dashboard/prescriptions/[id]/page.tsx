"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileDown,
  Trash2,
  FileText,
  Pill,
  Thermometer,
  Heart,
  Activity,
  Scale,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

interface PrescriptionDetail {
  id: string;
  diagnosis: string;
  notes: string | null;
  vitals: {
    bloodPressure?: string;
    temperature?: string;
    pulseRate?: string;
    weight?: string;
    height?: string;
    spO2?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    patientId: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    email: string | null;
    bloodGroup: string | null;
    allergies: string | null;
  };
  doctor: {
    id: string;
    name: string;
    specialization: string | null;
    email: string;
    phone: string | null;
  };
  items: {
    id: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string | null;
  }[];
  template: {
    id: string;
    name: string;
    accentColor: string;
  } | null;
  bill: {
    id: string;
    billNumber: string;
    totalAmount: number;
    status: string;
    items: { id: string; description: string; amount: number }[];
  } | null;
}

export default function PrescriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const res = await fetch(`/api/prescriptions/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPrescription(data);
      } catch {
        router.push("/dashboard/prescriptions");
      } finally {
        setLoading(false);
      }
    };
    fetchPrescription();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this prescription?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/prescriptions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard/prescriptions");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch {
      alert("Failed to delete prescription");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/prescriptions/${id}/pdf`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          <p className="text-sm text-slate-500">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (!prescription) return null;

  const vitals = prescription.vitals;
  const hasVitals = vitals && Object.values(vitals).some((v) => v);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/prescriptions")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Prescription Details
            </h1>
            <p className="text-sm text-slate-500">
              Created on {formatDateTime(prescription.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            className="text-teal-600 hover:text-teal-700"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Link href={`/dashboard/prescriptions/${id}/edit`}>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          {!prescription.bill && (
            <Link
              href={`/dashboard/billing/new?prescriptionId=${id}`}
            >
              <Button className="bg-teal-600 hover:bg-teal-700">
                Create Bill
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Prescription Details */}
        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="h-5 w-5 text-teal-600" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-700">
                  {prescription.patient.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {prescription.patient.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    ID: {prescription.patient.patientId}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Age:</span>{" "}
                  <span className="font-medium">
                    {prescription.patient.age} years
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Gender:</span>{" "}
                  <span className="font-medium">
                    {prescription.patient.gender}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>{" "}
                  <span className="font-medium">
                    {prescription.patient.phone}
                  </span>
                </div>
                {prescription.patient.bloodGroup && (
                  <div>
                    <span className="text-slate-500">Blood Group:</span>{" "}
                    <span className="font-medium">
                      {prescription.patient.bloodGroup}
                    </span>
                  </div>
                )}
              </div>
              {prescription.patient.allergies && (
                <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">
                  <span className="font-medium">Allergies:</span>{" "}
                  {prescription.patient.allergies}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Doctor Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-700">
                Prescribing Doctor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-slate-900">
                Dr. {prescription.doctor.name}
              </p>
              {prescription.doctor.specialization && (
                <p className="text-sm text-slate-500">
                  {prescription.doctor.specialization}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Vitals */}
          {hasVitals && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-teal-600" />
                  Vitals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {vitals?.bloodPressure && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3">
                      <Heart className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-slate-500">Blood Pressure</p>
                        <p className="font-medium text-slate-900">
                          {vitals.bloodPressure} mmHg
                        </p>
                      </div>
                    </div>
                  )}
                  {vitals?.temperature && (
                    <div className="flex items-center gap-2 rounded-lg bg-orange-50 p-3">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-xs text-slate-500">Temperature</p>
                        <p className="font-medium text-slate-900">
                          {vitals.temperature} °F
                        </p>
                      </div>
                    </div>
                  )}
                  {vitals?.pulseRate && (
                    <div className="flex items-center gap-2 rounded-lg bg-pink-50 p-3">
                      <Activity className="h-4 w-4 text-pink-500" />
                      <div>
                        <p className="text-xs text-slate-500">Pulse Rate</p>
                        <p className="font-medium text-slate-900">
                          {vitals.pulseRate} bpm
                        </p>
                      </div>
                    </div>
                  )}
                  {vitals?.weight && (
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3">
                      <Scale className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-slate-500">Weight</p>
                        <p className="font-medium text-slate-900">
                          {vitals.weight} kg
                        </p>
                      </div>
                    </div>
                  )}
                  {vitals?.height && (
                    <div className="flex items-center gap-2 rounded-lg bg-indigo-50 p-3">
                      <Scale className="h-4 w-4 text-indigo-500" />
                      <div>
                        <p className="text-xs text-slate-500">Height</p>
                        <p className="font-medium text-slate-900">
                          {vitals.height} cm
                        </p>
                      </div>
                    </div>
                  )}
                  {vitals?.spO2 && (
                    <div className="flex items-center gap-2 rounded-lg bg-teal-50 p-3">
                      <Activity className="h-4 w-4 text-teal-500" />
                      <div>
                        <p className="text-xs text-slate-500">SpO2</p>
                        <p className="font-medium text-slate-900">
                          {vitals.spO2}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diagnosis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-700">
                Diagnosis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {prescription.diagnosis}
              </p>
            </CardContent>
          </Card>

          {/* Notes */}
          {prescription.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-700">
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {prescription.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Medicines and Bill */}
        <div className="space-y-6">
          {/* Medicines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Pill className="h-5 w-5 text-teal-600" />
                Medicines
                <Badge variant="secondary" className="ml-1">
                  {prescription.items.length}
                </Badge>
              </CardTitle>
              <CardDescription>Prescribed medications</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Instructions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescription.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-slate-500">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.medicineName}
                      </TableCell>
                      <TableCell>{item.dosage}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.frequency}</Badge>
                      </TableCell>
                      <TableCell>{item.duration}</TableCell>
                      <TableCell className="text-slate-500">
                        {item.instructions || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Bill Summary */}
          {prescription.bill && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Bill Summary</CardTitle>
                  <Badge
                    className={
                      prescription.bill.status === "PAID"
                        ? "bg-emerald-100 text-emerald-700"
                        : prescription.bill.status === "PARTIAL"
                        ? "bg-yellow-100 text-yellow-700"
                        : prescription.bill.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }
                  >
                    {prescription.bill.status}
                  </Badge>
                </div>
                <CardDescription>
                  Bill #{prescription.bill.billNumber}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Amount</span>
                  <span className="text-teal-700">
                    {formatCurrency(prescription.bill.totalAmount)}
                  </span>
                </div>
                <Link href={`/dashboard/billing/${prescription.bill.id}`}>
                  <Button variant="outline" className="w-full mt-2">
                    View Full Bill
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Template Info */}
          {prescription.template && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-700">
                  Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{
                      backgroundColor: prescription.template.accentColor,
                    }}
                  />
                  <span className="text-sm font-medium">
                    {prescription.template.name}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
