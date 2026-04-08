"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus,
  X,
  ArrowLeft,
  Pill,
  Thermometer,
  Heart,
  Activity,
  Scale,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  FileText,
  FileDown,
} from "lucide-react";
import PatientSearch from "@/components/shared/patient-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  bloodGroup?: string;
  allergies?: string;
}

interface SelectedPatientInfo {
  id: string;
  name: string;
  patientId: string;
  age: number;
  gender: string;
  phone: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
}

interface MedicineItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const FREQUENCY_OPTIONS = [
  { value: "OD", label: "OD (Once Daily)" },
  { value: "BD", label: "BD (Twice Daily)" },
  { value: "TDS", label: "TDS (Three Times Daily)" },
  { value: "QID", label: "QID (Four Times Daily)" },
  { value: "SOS", label: "SOS (As Needed)" },
  { value: "HS", label: "HS (At Bedtime)" },
  { value: "AC", label: "AC (Before Meals)" },
  { value: "PC", label: "PC (After Meals)" },
  { value: "STAT", label: "STAT (Immediately)" },
  { value: "Weekly", label: "Weekly" },
];

const emptyMedicine: MedicineItem = {
  medicineName: "",
  dosage: "",
  frequency: "OD",
  duration: "",
  instructions: "",
};

export default function NewPrescriptionPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Patient search
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatientInfo | null>(null);

  // Vitals
  const [showVitals, setShowVitals] = useState(false);
  const [vitals, setVitals] = useState({
    bloodPressure: "",
    temperature: "",
    pulseRate: "",
    weight: "",
    height: "",
    spO2: "",
  });

  // Form fields
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);

  // Medicine items
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { ...emptyMedicine },
  ]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Fetch templates
  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
        else if (data.templates) setTemplates(data.templates);
      })
      .catch(() => {});
  }, []);

  const clearPatient = () => {
    setSelectedPatient(null);
  };

  // Medicine management
  const addMedicine = () => {
    setMedicines((prev) => [...prev, { ...emptyMedicine }]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length <= 1) return;
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMedicine = (
    index: number,
    field: keyof MedicineItem,
    value: string
  ) => {
    setMedicines((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Validate
  const isValid = () => {
    if (!selectedPatient) return false;
    if (!diagnosis.trim()) return false;
    if (
      medicines.length === 0 ||
      !medicines.every(
        (m) => m.medicineName.trim() && m.dosage.trim() && m.duration.trim()
      )
    )
      return false;
    return true;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid() || !session?.user?.id) return;

    setSubmitting(true);
    try {
      const hasVitals = Object.values(vitals).some((v) => v.trim());
      const payload = {
        patientId: selectedPatient!.id,
        doctorId: session.user.id,
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || null,
        vitals: hasVitals ? vitals : null,
        templateId: templateId || null,
        items: medicines.map((m) => ({
          medicineName: m.medicineName.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency,
          duration: m.duration.trim(),
          instructions: m.instructions.trim() || null,
        })),
      };

      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create prescription");
      }

      const data = await res.json();
      setCreatedId(data.id);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to create prescription"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Success view
  if (createdId) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-12">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <Stethoscope className="h-8 w-8 text-teal-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Prescription Created Successfully
            </h2>
            <p className="text-center text-sm text-slate-500">
              The prescription has been saved. What would you like to do next?
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                onClick={() =>
                  router.push(`/dashboard/prescriptions/${createdId}`)
                }
                className="bg-teal-600 hover:bg-teal-700"
              >
                <FileText className="mr-2 h-4 w-4" />
                View Prescription
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  window.open(`/api/prescriptions/${createdId}/pdf`, "_blank")
                }
              >
                <FileDown className="mr-2 h-4 w-4" />
                Generate PDF
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/dashboard/billing/new?prescriptionId=${createdId}`)
                }
              >
                Create Bill
              </Button>
            </div>
            <Button
              variant="ghost"
              className="mt-2 text-slate-500"
              onClick={() => {
                setCreatedId(null);
                setSelectedPatient(null);
                setDiagnosis("");
                setNotes("");
                setVitals({
                  bloodPressure: "",
                  temperature: "",
                  pulseRate: "",
                  weight: "",
                  height: "",
                  spO2: "",
                });
                setMedicines([{ ...emptyMedicine }]);
                setTemplateId("");
              }}
            >
              Create Another Prescription
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            New Prescription
          </h1>
          <p className="text-sm text-slate-500">
            Create a new prescription for a patient
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-teal-600" />
              Patient Selection
            </CardTitle>
            <CardDescription>
              Search and select a patient for this prescription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PatientSearch
              onSelect={(patient) => setSelectedPatient(patient)}
              selectedPatient={selectedPatient}
              onClear={clearPatient}
            />
          </CardContent>
        </Card>

        {/* Vitals */}
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowVitals(!showVitals)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-teal-600" />
                Vitals
                <Badge variant="secondary" className="text-xs font-normal">
                  Optional
                </Badge>
              </CardTitle>
              {showVitals ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </CardHeader>
          {showVitals && (
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Heart className="h-3.5 w-3.5 text-red-500" />
                    Blood Pressure
                  </Label>
                  <Input
                    placeholder="e.g., 120/80"
                    value={vitals.bloodPressure}
                    onChange={(e) =>
                      setVitals((v) => ({ ...v, bloodPressure: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Thermometer className="h-3.5 w-3.5 text-orange-500" />
                    Temperature (°F)
                  </Label>
                  <Input
                    placeholder="e.g., 98.6"
                    value={vitals.temperature}
                    onChange={(e) =>
                      setVitals((v) => ({ ...v, temperature: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Activity className="h-3.5 w-3.5 text-pink-500" />
                    Pulse Rate (bpm)
                  </Label>
                  <Input
                    placeholder="e.g., 72"
                    value={vitals.pulseRate}
                    onChange={(e) =>
                      setVitals((v) => ({ ...v, pulseRate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Scale className="h-3.5 w-3.5 text-blue-500" />
                    Weight (kg)
                  </Label>
                  <Input
                    placeholder="e.g., 70"
                    value={vitals.weight}
                    onChange={(e) =>
                      setVitals((v) => ({ ...v, weight: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Scale className="h-3.5 w-3.5 text-indigo-500" />
                    Height (cm)
                  </Label>
                  <Input
                    placeholder="e.g., 170"
                    value={vitals.height}
                    onChange={(e) =>
                      setVitals((v) => ({ ...v, height: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Activity className="h-3.5 w-3.5 text-teal-500" />
                    SpO2 (%)
                  </Label>
                  <Input
                    placeholder="e.g., 98"
                    value={vitals.spO2}
                    onChange={(e) =>
                      setVitals((v) => ({ ...v, spO2: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Diagnosis and Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-teal-600" />
              Diagnosis & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diagnosis">
                Diagnosis <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="diagnosis"
                placeholder="Enter diagnosis..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="template">Prescription Template</Label>
                <select
                  id="template"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  <option value="">Default Template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medicine Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Pill className="h-5 w-5 text-teal-600" />
                Medicines
                <span className="text-red-500">*</span>
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedicine}
                className="text-teal-600 hover:text-teal-700"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Medicine
              </Button>
            </div>
            <CardDescription>
              Add at least one medicine to the prescription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {medicines.map((medicine, index) => (
                <div
                  key={index}
                  className="relative rounded-lg border bg-slate-50/50 p-4"
                >
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicine(index)}
                      className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-red-100 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <div className="mb-2 text-xs font-medium text-slate-500">
                    Medicine #{index + 1}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                      <Label className="text-xs">
                        Medicine Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g., Paracetamol"
                        value={medicine.medicineName}
                        onChange={(e) =>
                          updateMedicine(index, "medicineName", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Dosage <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g., 500mg"
                        value={medicine.dosage}
                        onChange={(e) =>
                          updateMedicine(index, "dosage", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Frequency</Label>
                      <select
                        value={medicine.frequency}
                        onChange={(e) =>
                          updateMedicine(index, "frequency", e.target.value)
                        }
                        className={cn(
                          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                      >
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Duration <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g., 5 days"
                        value={medicine.duration}
                        onChange={(e) =>
                          updateMedicine(index, "duration", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                      <Label className="text-xs">Instructions</Label>
                      <Input
                        placeholder="e.g., After meals"
                        value={medicine.instructions}
                        onChange={(e) =>
                          updateMedicine(index, "instructions", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700"
            disabled={!isValid() || submitting}
          >
            {submitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Stethoscope className="mr-2 h-4 w-4" />
                Create Prescription
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
