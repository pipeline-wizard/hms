"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, UserPlus, X, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PatientResult {
  id: string;
  name: string;
  patientId: string;
  age: number;
  gender: string;
  phone: string;
  bloodGroup?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface PatientSearchSelection {
  id: string;
  name: string;
  patientId: string;
  age: number;
  gender: string;
  phone: string;
}

export interface PatientSearchProps {
  onSelect: (patient: PatientSearchSelection) => void;
  selectedPatient?: { id: string; name: string; patientId: string } | null;
  onClear?: () => void;
}

export default function PatientSearch({
  onSelect,
  selectedPatient,
  onClear,
}: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<PatientResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Quick-add form state
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newGender, setNewGender] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newBloodGroup, setNewBloodGroup] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPatientType, setNewPatientType] = useState("Outpatient");
  const [formError, setFormError] = useState("");

  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/patients?q=${encodeURIComponent(query)}&limit=5`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.patients || []);
      } else {
        setResults([]);
      }
      setHasSearched(true);
    } catch {
      setResults([]);
      setHasSearched(true);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (selectedPatient) return;
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchPatients(searchTerm);
        setShowDropdown(true);
      } else {
        setResults([]);
        setHasSearched(false);
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedPatient, searchPatients]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (patient: PatientResult) => {
    onSelect({
      id: patient.id,
      name: patient.name,
      patientId: patient.patientId,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
    });
    setSearchTerm("");
    setResults([]);
    setShowDropdown(false);
    setHasSearched(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    setResults([]);
    setShowDropdown(false);
    setHasSearched(false);
    onClear?.();
  };

  const resetForm = () => {
    setNewName("");
    setNewAge("");
    setNewGender("");
    setNewPhone("");
    setNewEmail("");
    setNewBloodGroup("");
    setNewAddress("");
    setNewPatientType("Outpatient");
    setFormError("");
  };

  const openAddDialog = () => {
    resetForm();
    // Pre-fill name from search term
    setNewName(searchTerm);
    setShowDropdown(false);
    setShowAddDialog(true);
  };

  const handleCreatePatient = async () => {
    setFormError("");

    if (!newName.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!newAge.trim() || isNaN(Number(newAge)) || Number(newAge) <= 0) {
      setFormError("Valid age is required");
      return;
    }
    if (!newGender) {
      setFormError("Gender is required");
      return;
    }
    if (!newPhone.trim()) {
      setFormError("Phone is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          age: newAge.trim(),
          gender: newGender,
          phone: newPhone.trim(),
          email: newEmail.trim() || undefined,
          bloodGroup: newBloodGroup || undefined,
          address: newAddress.trim() || undefined,
          patientType: newPatientType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create patient");
      }

      const patient = await res.json();
      setShowAddDialog(false);
      resetForm();
      setSearchTerm("");
      setHasSearched(false);

      // Auto-select the newly created patient
      onSelect({
        id: patient.id,
        name: patient.name,
        patientId: patient.patientId,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to create patient"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Selected patient card view
  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-teal-50/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
            {selectedPatient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {selectedPatient.name}
            </p>
            <p className="text-xs text-slate-500">
              ID: {selectedPatient.patientId}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="h-8 w-8 text-slate-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by patient name, phone, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          onFocus={() => {
            if (results.length > 0 || (hasSearched && results.length === 0)) {
              setShowDropdown(true);
            }
          }}
        />

        {showDropdown && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
            {searching ? (
              <div className="p-3 text-center text-sm text-slate-500">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <>
                {results.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                    onClick={() => handleSelect(patient)}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-medium text-teal-700">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {patient.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{patient.patientId}</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </span>
                        <span>
                          {patient.age}y / {patient.gender}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                <div className="border-t">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-teal-600 hover:bg-teal-50"
                    onClick={openAddDialog}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add New Patient
                  </button>
                </div>
              </>
            ) : hasSearched ? (
              <div className="p-2">
                <div className="px-2 py-3 text-center text-sm text-slate-500">
                  No patients found for &quot;{searchTerm}&quot;
                </div>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
                  onClick={openAddDialog}
                >
                  <UserPlus className="h-4 w-4" />
                  Add New Patient
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Quick Add Patient Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-600" />
              Quick Add Patient
            </DialogTitle>
            <DialogDescription>
              Register a new patient quickly. You can add more details later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {formError && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>
            )}

            {/* Required fields */}
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qa-name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="qa-name"
                    placeholder="Patient name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="qa-age">
                    Age <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="qa-age"
                    type="number"
                    min={0}
                    max={150}
                    placeholder="Age"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qa-gender">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select value={newGender} onValueChange={setNewGender}>
                    <SelectTrigger id="qa-gender">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qa-phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="qa-phone"
                    placeholder="Phone number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Optional fields */}
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="qa-email" className="text-slate-500">
                    Email
                  </Label>
                  <Input
                    id="qa-email"
                    type="email"
                    placeholder="Email (optional)"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qa-blood" className="text-slate-500">
                    Blood Group
                  </Label>
                  <Select value={newBloodGroup} onValueChange={setNewBloodGroup}>
                    <SelectTrigger id="qa-blood">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qa-address" className="text-slate-500">
                  Address
                </Label>
                <Input
                  id="qa-address"
                  placeholder="Address (optional)"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-500">Patient Type</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewPatientType("Outpatient")}
                    className={cn(
                      "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      newPatientType === "Outpatient"
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Outpatient
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPatientType("Inpatient")}
                    className={cn(
                      "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      newPatientType === "Inpatient"
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Inpatient
                  </button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleCreatePatient}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Patient
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
