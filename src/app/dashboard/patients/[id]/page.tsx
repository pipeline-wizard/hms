"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertCircle,
  Pencil,
  Plus,
  BedDouble,
  LogOut,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

interface Prescription {
  id: string;
  diagnosis: string;
  createdAt: string;
  doctor: {
    id: string;
    name: string;
    specialization: string | null;
  };
  items: {
    id: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
}

interface Bill {
  id: string;
  billNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
}

interface Admission {
  id: string;
  roomNumber: string | null;
  bedNumber: string | null;
  ward: string | null;
  admissionDate: string;
  dischargeDate: string | null;
  reason: string;
  status: "ADMITTED" | "DISCHARGED" | "TRANSFERRED";
  notes: string | null;
  admittedByUser: {
    id: string;
    name: string;
  };
}

interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string | null;
  address: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  patientType: "OUTPATIENT" | "INPATIENT";
  createdAt: string;
  updatedAt: string;
  prescriptions: Prescription[];
  bills: Bill[];
  admissions: Admission[];
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Admit dialog state
  const [admitOpen, setAdmitOpen] = useState(false);
  const [admitting, setAdmitting] = useState(false);
  const [admitForm, setAdmitForm] = useState({
    roomNumber: "",
    bedNumber: "",
    ward: "",
    reason: "",
    notes: "",
  });
  const [admitError, setAdmitError] = useState("");

  // Discharge dialog state
  const [dischargeOpen, setDischargeOpen] = useState(false);
  const [discharging, setDischarging] = useState(false);
  const [dischargeNotes, setDischargeNotes] = useState("");
  const [dischargeError, setDischargeError] = useState("");

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch patient");
      const data = await res.json();
      setPatient(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchPatient();
    }
  }, [params.id]);

  const handleAdmit = async () => {
    if (!admitForm.reason.trim()) {
      setAdmitError("Reason for admission is required");
      return;
    }

    try {
      setAdmitting(true);
      setAdmitError("");
      const res = await fetch(`/api/patients/${params.id}/admit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(admitForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to admit patient");
      }

      setAdmitOpen(false);
      setAdmitForm({
        roomNumber: "",
        bedNumber: "",
        ward: "",
        reason: "",
        notes: "",
      });
      fetchPatient();
    } catch (err: any) {
      setAdmitError(err.message);
    } finally {
      setAdmitting(false);
    }
  };

  const handleDischarge = async () => {
    try {
      setDischarging(true);
      setDischargeError("");
      const res = await fetch(`/api/patients/${params.id}/discharge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: dischargeNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to discharge patient");
      }

      setDischargeOpen(false);
      setDischargeNotes("");
      fetchPatient();
    } catch (err: any) {
      setDischargeError(err.message);
    } finally {
      setDischarging(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold">Error loading patient</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || "Patient not found"}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/patients")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
      </div>
    );
  }

  const billStatusVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default";
      case "PENDING":
        return "secondary";
      case "PARTIAL":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const admissionStatusVariant = (status: string) => {
    switch (status) {
      case "ADMITTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "DISCHARGED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "TRANSFERRED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/patients")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {patient.name}
              </h1>
              <Badge
                className={cn(
                  "text-sm",
                  patient.patientType === "INPATIENT"
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300"
                )}
                variant="outline"
              >
                {patient.patientType === "INPATIENT" && (
                  <BedDouble className="mr-1 h-3.5 w-3.5" />
                )}
                {patient.patientType === "INPATIENT"
                  ? "Inpatient"
                  : "Outpatient"}
              </Badge>
            </div>
            <p className="font-mono text-sm text-muted-foreground">
              {patient.patientId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {patient.patientType === "OUTPATIENT" && (
            <Button
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
              onClick={() => setAdmitOpen(true)}
            >
              <BedDouble className="mr-2 h-4 w-4" />
              Admit Patient
            </Button>
          )}
          {patient.patientType === "INPATIENT" && (
            <Button
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"
              onClick={() => setDischargeOpen(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Discharge Patient
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/patients/${patient.id}/edit`)
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={() =>
              router.push(
                `/dashboard/prescriptions/new?patientId=${patient.id}`
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Prescription
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              router.push(`/dashboard/bills/new?patientId=${patient.id}`)
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Bill
          </Button>
        </div>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Age & Gender</p>
                <p className="text-sm font-medium">
                  {patient.age} years -{" "}
                  <Badge
                    variant={
                      patient.gender === "MALE"
                        ? "default"
                        : patient.gender === "FEMALE"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {patient.gender}
                  </Badge>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{patient.address}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {patient.bloodGroup && (
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Blood Group</p>
                    <p className="text-sm font-medium">{patient.bloodGroup}</p>
                  </div>
                </div>
              )}
              {patient.allergies && (
                <div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <p className="text-sm text-muted-foreground">Allergies</p>
                  </div>
                  <p className="mt-1 text-sm">{patient.allergies}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Registered</p>
              <p className="text-sm font-medium">
                {formatDate(patient.createdAt)}
              </p>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm font-medium">
                {formatDate(patient.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical History */}
      {patient.medicalHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{patient.medicalHistory}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Prescriptions, Bills & Admissions */}
      <Tabs defaultValue="prescriptions">
        <TabsList>
          <TabsTrigger value="prescriptions">
            Prescriptions ({patient.prescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="bills">
            Bills ({patient.bills.length})
          </TabsTrigger>
          <TabsTrigger value="admissions">
            Admission History ({patient.admissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions">
          <Card>
            <CardContent className="p-0">
              {patient.prescriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No prescriptions yet
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Medicines</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.prescriptions.map((rx) => (
                      <TableRow
                        key={rx.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/prescriptions/${rx.id}`)
                        }
                      >
                        <TableCell>{formatDate(rx.createdAt)}</TableCell>
                        <TableCell className="font-medium">
                          {rx.diagnosis}
                        </TableCell>
                        <TableCell>
                          {rx.doctor.name}
                          {rx.doctor.specialization && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({rx.doctor.specialization})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rx.items.length} medicine
                          {rx.items.length !== 1 ? "s" : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bills">
          <Card>
            <CardContent className="p-0">
              {patient.bills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No bills yet
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.bills.map((bill) => (
                      <TableRow
                        key={bill.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/bills/${bill.id}`)
                        }
                      >
                        <TableCell className="font-mono text-sm">
                          {bill.billNumber}
                        </TableCell>
                        <TableCell>{formatDate(bill.createdAt)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(bill.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={billStatusVariant(bill.status)}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {bill.paymentMethod || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admissions">
          <Card>
            <CardContent className="p-0">
              {patient.admissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No admission history
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admission Date</TableHead>
                      <TableHead>Discharge Date</TableHead>
                      <TableHead>Room/Bed</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admitted By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.admissions.map((admission) => (
                      <TableRow key={admission.id}>
                        <TableCell>
                          {formatDateTime(admission.admissionDate)}
                        </TableCell>
                        <TableCell>
                          {admission.dischargeDate
                            ? formatDateTime(admission.dischargeDate)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {admission.roomNumber || admission.bedNumber
                            ? `${admission.roomNumber || "-"} / ${admission.bedNumber || "-"}`
                            : "-"}
                        </TableCell>
                        <TableCell>{admission.ward || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {admission.reason}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={admissionStatusVariant(admission.status)}
                          >
                            {admission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {admission.admittedByUser.name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admit Patient Dialog */}
      <Dialog open={admitOpen} onOpenChange={setAdmitOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-blue-600" />
              Admit Patient
            </DialogTitle>
            <DialogDescription>
              Admit {patient.name} as an inpatient. Fill in the admission
              details below.
            </DialogDescription>
          </DialogHeader>

          {admitError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {admitError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g., 101"
                  value={admitForm.roomNumber}
                  onChange={(e) =>
                    setAdmitForm({ ...admitForm, roomNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedNumber">Bed Number</Label>
                <Input
                  id="bedNumber"
                  placeholder="e.g., A1"
                  value={admitForm.bedNumber}
                  onChange={(e) =>
                    setAdmitForm({ ...admitForm, bedNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ward</Label>
              <Select
                value={admitForm.ward}
                onValueChange={(value) =>
                  setAdmitForm({ ...admitForm, ward: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Pediatric">Pediatric</SelectItem>
                  <SelectItem value="Maternity">Maternity</SelectItem>
                  <SelectItem value="Surgical">Surgical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Admission *</Label>
              <Textarea
                id="reason"
                placeholder="Reason for admission"
                rows={2}
                value={admitForm.reason}
                onChange={(e) =>
                  setAdmitForm({ ...admitForm, reason: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admitNotes">Notes</Label>
              <Textarea
                id="admitNotes"
                placeholder="Additional notes (optional)"
                rows={2}
                value={admitForm.notes}
                onChange={(e) =>
                  setAdmitForm({ ...admitForm, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdmitOpen(false)}
              disabled={admitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdmit}
              disabled={admitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {admitting ? "Admitting..." : "Admit Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discharge Patient Dialog */}
      <Dialog open={dischargeOpen} onOpenChange={setDischargeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-orange-600" />
              Discharge Patient
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to discharge {patient.name}? The patient
              will be moved back to outpatient status.
            </DialogDescription>
          </DialogHeader>

          {dischargeError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {dischargeError}
            </div>
          )}

          <div className="space-y-2 py-2">
            <Label htmlFor="dischargeNotes">Discharge Notes</Label>
            <Textarea
              id="dischargeNotes"
              placeholder="Discharge notes (optional)"
              rows={3}
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDischargeOpen(false)}
              disabled={discharging}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDischarge}
              disabled={discharging}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {discharging ? "Discharging..." : "Discharge Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
