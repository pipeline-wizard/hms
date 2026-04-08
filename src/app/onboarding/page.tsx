"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Stethoscope,
  Building2,
  Phone,
  Mail,
  Globe,
  Clock,
  FileText,
  IndianRupee,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const onboardingSchema = z.object({
  clinicName: z.string().min(2, "Clinic name is required"),
  specialty: z.string().optional(),
  registrationNo: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  website: z.string().optional(),
  operatingHours: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().default("INR"),
  currencySymbol: z.string().default("₹"),
  taxName: z.string().default("GST"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPECIALTIES = [
  "General Medicine",
  "Pediatrics",
  "Orthopedics",
  "Ophthalmology",
  "Dermatology",
  "Cardiology",
  "Gynecology",
  "ENT",
  "Dental",
  "Psychiatry",
  "Multi-Specialty",
  "Other",
];

const CURRENCIES = [
  { value: "INR", symbol: "₹", label: "INR (₹)" },
  { value: "USD", symbol: "$", label: "USD ($)" },
  { value: "EUR", symbol: "€", label: "EUR (€)" },
  { value: "GBP", symbol: "£", label: "GBP (£)" },
  { value: "AED", symbol: "د.إ", label: "AED (د.إ)" },
];

const STEPS = [
  { title: "Clinic Basics", icon: Stethoscope },
  { title: "Contact & Location", icon: Building2 },
  { title: "Operations", icon: Clock },
  { title: "Billing", icon: IndianRupee },
  { title: "Review & Finish", icon: CheckCircle },
];

// Fields required per step for validation gating
const STEP_FIELDS: (keyof OnboardingData)[][] = [
  ["clinicName"],
  [],
  [],
  [],
  [],
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      clinicName: "",
      specialty: "",
      registrationNo: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      operatingHours: "",
      description: "",
      currency: "INR",
      currencySymbol: "₹",
      taxName: "GST",
      taxRate: 0,
    },
  });

  const formValues = watch();

  // Auth guard
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    router.push("/dashboard");
    return null;
  }

  // Step navigation
  const goNext = async () => {
    const fieldsToValidate = STEP_FIELDS[currentStep];
    if (fieldsToValidate && fieldsToValidate.length > 0) {
      const valid = await trigger(fieldsToValidate);
      if (!valid) return;
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleCurrencyChange = (value: string) => {
    const cur = CURRENCIES.find((c) => c.value === value);
    if (cur) {
      setValue("currency", cur.value);
      setValue("currencySymbol", cur.symbol);
    }
  };

  const onSubmit = async (data: OnboardingData) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/settings/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.error || "Failed to complete setup");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Step content renderers
  // ---------------------------------------------------------------------------

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-200/50">
          <Stethoscope className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome to ClinicFlow!
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Let&apos;s set up your clinic. This will only take a few minutes.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clinicName">
            Clinic Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="clinicName"
            placeholder="e.g., City Health Clinic"
            {...register("clinicName")}
            className={cn(errors.clinicName && "border-red-300")}
          />
          {errors.clinicName && (
            <p className="text-xs text-red-500">{errors.clinicName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialty">Specialty</Label>
          <Select
            value={formValues.specialty || ""}
            onValueChange={(v) => setValue("specialty", v)}
          >
            <SelectTrigger id="specialty">
              <SelectValue placeholder="Select a specialty" />
            </SelectTrigger>
            <SelectContent>
              {SPECIALTIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationNo">Registration / License Number</Label>
          <Input
            id="registrationNo"
            placeholder="e.g., MCI-12345"
            {...register("registrationNo")}
          />
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-200/50">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Contact & Location
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Where can patients find and reach you?
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            placeholder="Full clinic address"
            rows={3}
            {...register("address")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Phone
            </Label>
            <Input
              id="phone"
              placeholder="+91 98765 43210"
              {...register("phone")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onb-email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              Email
            </Label>
            <Input
              id="onb-email"
              type="email"
              placeholder="clinic@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            Website (optional)
          </Label>
          <Input
            id="website"
            placeholder="https://www.yourclinic.com"
            {...register("website")}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-200/50">
          <Clock className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Operations</h2>
        <p className="mt-2 text-sm text-slate-500">
          Tell us about your clinic hours and services.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="operatingHours" className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            Operating Hours
          </Label>
          <Input
            id="operatingHours"
            placeholder="e.g., Mon-Sat: 9:00 AM - 6:00 PM"
            {...register("operatingHours")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            Description / About
          </Label>
          <Textarea
            id="description"
            placeholder="A brief description of your clinic and the services you provide..."
            rows={4}
            {...register("description")}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-200/50">
          <IndianRupee className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Billing Configuration
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Set up your currency and tax preferences.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={formValues.currency}
            onValueChange={handleCurrencyChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="taxName">Tax Name</Label>
            <Input
              id="taxName"
              placeholder="e.g., GST, VAT, Sales Tax"
              {...register("taxName")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="18"
              {...register("taxRate")}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-200/50">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Review & Launch
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Everything looks great! Review your details and launch.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 space-y-5">
        {/* Basic Info */}
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Stethoscope className="h-4 w-4 text-teal-600" />
            Clinic Basics
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <SummaryItem label="Clinic Name" value={formValues.clinicName} />
            <SummaryItem label="Specialty" value={formValues.specialty} />
            <SummaryItem label="Registration No." value={formValues.registrationNo} />
          </div>
        </div>

        {/* Contact */}
        <div className="border-t pt-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Building2 className="h-4 w-4 text-teal-600" />
            Contact & Location
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <SummaryItem label="Address" value={formValues.address} />
            <SummaryItem label="Phone" value={formValues.phone} />
            <SummaryItem label="Email" value={formValues.email} />
            <SummaryItem label="Website" value={formValues.website} />
          </div>
        </div>

        {/* Operations */}
        <div className="border-t pt-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Clock className="h-4 w-4 text-teal-600" />
            Operations
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <SummaryItem label="Operating Hours" value={formValues.operatingHours} />
            <SummaryItem label="Description" value={formValues.description} />
          </div>
        </div>

        {/* Billing */}
        <div className="border-t pt-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <IndianRupee className="h-4 w-4 text-teal-600" />
            Billing
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <SummaryItem
              label="Currency"
              value={`${formValues.currency} (${formValues.currencySymbol})`}
            />
            <SummaryItem label="Tax Name" value={formValues.taxName} />
            <SummaryItem label="Tax Rate" value={formValues.taxRate ? `${formValues.taxRate}%` : ""} />
          </div>
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}
    </div>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={step.title} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                        isActive &&
                          "border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-200/50",
                        isCompleted &&
                          "border-teal-500 bg-teal-500 text-white",
                        !isActive &&
                          !isCompleted &&
                          "border-slate-200 bg-white text-slate-400"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 hidden text-xs font-medium sm:block",
                        isActive && "text-teal-700",
                        isCompleted && "text-teal-600",
                        !isActive && !isCompleted && "text-slate-400"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "mx-2 h-0.5 flex-1 rounded transition-colors duration-300",
                        index < currentStep ? "bg-teal-500" : "bg-slate-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <Card className="border-slate-200/80 shadow-xl shadow-slate-200/30 backdrop-blur-sm">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step content */}
              <div className="min-h-[380px]">{stepRenderers[currentStep]()}</div>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between border-t pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goBack}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                <span className="text-xs text-slate-400">
                  Step {currentStep + 1} of {STEPS.length}
                </span>

                {currentStep < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    className="gap-2 bg-teal-600 hover:bg-teal-700"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-200/50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isSubmitting ? "Setting up..." : "Launch ClinicFlow"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400">
          You can always update these settings later from the Settings page.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary helper
// ---------------------------------------------------------------------------

function SummaryItem({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">
        {value || <span className="text-slate-300">Not provided</span>}
      </span>
    </div>
  );
}
