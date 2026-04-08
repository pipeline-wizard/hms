"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Settings,
  Building2,
  FileText,
  Users,
  Palette,
  Save,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Shield,
  Loader2,
  Stethoscope,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClinicSettings {
  id: string;
  clinicName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  specialty: string | null;
  description: string | null;
  registrationNo: string | null;
  operatingHours: string | null;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  taxName: string;
}

interface PrescriptionTemplate {
  id: string;
  name: string;
  description: string | null;
  headerText: string | null;
  footerText: string | null;
  logoUrl: string | null;
  accentColor: string;
  layout: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { prescriptions: number };
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  specialization: string | null;
  isActive: boolean;
  createdAt: string;
}

const CURRENCIES = [
  { value: "INR", symbol: "₹", label: "INR (₹)" },
  { value: "USD", symbol: "$", label: "USD ($)" },
  { value: "EUR", symbol: "€", label: "EUR (€)" },
  { value: "GBP", symbol: "£", label: "GBP (£)" },
  { value: "AED", symbol: "د.إ", label: "AED (د.إ)" },
];

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

const LAYOUTS = [
  { value: "standard", label: "Standard" },
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
  { value: "detailed", label: "Detailed" },
];

const emptyTemplateForm = {
  name: "",
  description: "",
  headerText: "",
  footerText: "",
  logoUrl: "",
  accentColor: "#0891b2",
  layout: "standard",
  isDefault: false,
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";

  // Clinic settings state
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);

  // Users state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // ------- Fetch helpers -------

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch {
      toast({ title: "Error", description: "Failed to load clinic settings", variant: "destructive" });
    } finally {
      setSettingsLoading(false);
    }
  }, [toast]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch {
      toast({ title: "Error", description: "Failed to load templates", variant: "destructive" });
    } finally {
      setTemplatesLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
    fetchUsers();
  }, [fetchSettings, fetchTemplates, fetchUsers]);

  // ------- Settings handlers -------

  const handleSettingsSave = async () => {
    if (!settings) return;
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        toast({ title: "Saved", description: "Clinic settings updated successfully." });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to save settings", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleCurrencyChange = (value: string) => {
    const cur = CURRENCIES.find((c) => c.value === value);
    if (cur && settings) {
      setSettings({ ...settings, currency: cur.value, currencySymbol: cur.symbol });
    }
  };

  // ------- Template handlers -------

  const openNewTemplate = () => {
    setEditingTemplateId(null);
    setTemplateForm(emptyTemplateForm);
    setTemplateDialogOpen(true);
  };

  const openEditTemplate = (t: PrescriptionTemplate) => {
    setEditingTemplateId(t.id);
    setTemplateForm({
      name: t.name,
      description: t.description || "",
      headerText: t.headerText || "",
      footerText: t.footerText || "",
      logoUrl: t.logoUrl || "",
      accentColor: t.accentColor,
      layout: t.layout,
      isDefault: t.isDefault,
    });
    setTemplateDialogOpen(true);
  };

  const handleTemplateSave = async () => {
    if (!templateForm.name.trim()) {
      toast({ title: "Validation", description: "Template name is required.", variant: "destructive" });
      return;
    }
    setTemplateSaving(true);
    try {
      const url = editingTemplateId ? `/api/templates/${editingTemplateId}` : "/api/templates";
      const method = editingTemplateId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });
      if (res.ok) {
        toast({ title: "Saved", description: `Template ${editingTemplateId ? "updated" : "created"} successfully.` });
        setTemplateDialogOpen(false);
        fetchTemplates();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to save template", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleTemplateDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Template deleted successfully." });
        fetchTemplates();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to delete template", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        toast({ title: "Updated", description: "Default template updated." });
        fetchTemplates();
      }
    } catch {
      toast({ title: "Error", description: "Failed to update default template", variant: "destructive" });
    }
  };

  // ------- User handlers -------

  const handleToggleUserActive = async (user: UserRecord) => {
    setUpdatingUserId(user.id);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      if (res.ok) {
        toast({ title: "Updated", description: `User ${!user.isActive ? "activated" : "deactivated"}.` });
        fetchUsers();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to update user", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      if (res.ok) {
        toast({ title: "Updated", description: "User role updated." });
        fetchUsers();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to update role", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ------- Render helpers -------

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

  const roleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 border-red-200";
      case "DOCTOR":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RECEPTIONIST":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
          <Settings className="h-5 w-5 text-teal-700" />
        </div>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-sm text-slate-500">Manage clinic configuration, templates, and users</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="clinic" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clinic Information</span>
            <span className="sm:hidden">Clinic</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Prescription Templates</span>
            <span className="sm:hidden">Templates</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ================================================================= */}
        {/* TAB 1 : Clinic Information                                        */}
        {/* ================================================================= */}
        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-600" />
                Clinic Information
              </CardTitle>
              <CardDescription>
                Configure your clinic details. These appear on prescriptions and bills.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
              ) : settings ? (
                <div className="space-y-8">
                  {/* Basic Info Section */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Stethoscope className="h-4 w-4 text-teal-600" />
                      Basic Information
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="clinicName">Clinic Name</Label>
                        <Input
                          id="clinicName"
                          value={settings.clinicName}
                          onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
                          placeholder="Enter clinic name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Specialty</Label>
                        <Select
                          value={settings.specialty || ""}
                          onValueChange={(v) => setSettings({ ...settings, specialty: v })}
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
                        <Label htmlFor="registrationNo">Registration / License No.</Label>
                        <Input
                          id="registrationNo"
                          value={settings.registrationNo || ""}
                          onChange={(e) => setSettings({ ...settings, registrationNo: e.target.value })}
                          placeholder="e.g., MCI-12345"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="logoUrl">Logo URL</Label>
                        <Input
                          id="logoUrl"
                          value={settings.logoUrl || ""}
                          onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Section */}
                  <div className="border-t pt-6">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Building2 className="h-4 w-4 text-teal-600" />
                      Contact & Location
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={settings.address || ""}
                          onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                          placeholder="Clinic address"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={settings.phone || ""}
                          onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={settings.email || ""}
                          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                          placeholder="clinic@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={settings.website || ""}
                          onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Operations Section */}
                  <div className="border-t pt-6">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Clock className="h-4 w-4 text-teal-600" />
                      Operations
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="operatingHours">Operating Hours</Label>
                        <Input
                          id="operatingHours"
                          value={settings.operatingHours || ""}
                          onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
                          placeholder="e.g., Mon-Sat: 9:00 AM - 6:00 PM"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="description">Description / About</Label>
                        <Textarea
                          id="description"
                          value={settings.description || ""}
                          onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                          placeholder="A brief description of your clinic"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Section */}
                  <div className="border-t pt-6">
                    <h3 className="mb-4 text-sm font-semibold text-slate-700">Currency &amp; Tax Settings</h3>
                    <div className="grid gap-6 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={settings.currency} onValueChange={handleCurrencyChange}>
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
                      <div className="space-y-2">
                        <Label htmlFor="taxName">Tax Name</Label>
                        <Input
                          id="taxName"
                          value={settings.taxName}
                          onChange={(e) => setSettings({ ...settings, taxName: e.target.value })}
                          placeholder="GST"
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
                          value={settings.taxRate}
                          onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                          placeholder="18"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end border-t pt-6">
                    <Button onClick={handleSettingsSave} disabled={settingsSaving} className="gap-2">
                      {settingsSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">Failed to load settings.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB 2 : Prescription Templates                                    */}
        {/* ================================================================= */}
        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  Prescription Templates
                </CardTitle>
                <CardDescription>
                  Create and manage templates for prescription printouts.
                </CardDescription>
              </div>
              <Button onClick={openNewTemplate} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">No templates yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Create your first prescription template to get started.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      {/* Color accent bar */}
                      <div
                        className="absolute left-0 top-0 h-1 w-full rounded-t-lg"
                        style={{ backgroundColor: t.accentColor }}
                      />

                      <div className="mt-1 flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-slate-900">{t.name}</h3>
                            {t.isDefault && (
                              <Badge variant="secondary" className="shrink-0 bg-teal-50 text-teal-700">
                                Default
                              </Badge>
                            )}
                          </div>
                          {t.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-3 w-3 rounded-full border border-slate-200"
                            style={{ backgroundColor: t.accentColor }}
                          />
                          <span>{t.accentColor}</span>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {t.layout}
                        </Badge>
                        {t._count && t._count.prescriptions > 0 && (
                          <span className="text-slate-400">
                            {t._count.prescriptions} Rx
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center gap-2 border-t pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => openEditTemplate(t)}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        {!t.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => handleSetDefault(t.id)}
                          >
                            <Check className="h-3 w-3" />
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-8 gap-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleTemplateDelete(t.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Dialog */}
          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplateId ? "Edit Template" : "Create Template"}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplateId
                    ? "Update the prescription template details."
                    : "Set up a new prescription template layout."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                {/* Row 1 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tplName">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tplName"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="Template name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tplLayout">Layout</Label>
                    <Select
                      value={templateForm.layout}
                      onValueChange={(v) => setTemplateForm({ ...templateForm, layout: v })}
                    >
                      <SelectTrigger id="tplLayout">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LAYOUTS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="tplDesc">Description</Label>
                  <Input
                    id="tplDesc"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    placeholder="Brief description of this template"
                  />
                </div>

                {/* Header / Footer */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tplHeader">Header Text</Label>
                    <Textarea
                      id="tplHeader"
                      value={templateForm.headerText}
                      onChange={(e) => setTemplateForm({ ...templateForm, headerText: e.target.value })}
                      placeholder="Text at the top of prescriptions"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tplFooter">Footer Text</Label>
                    <Textarea
                      id="tplFooter"
                      value={templateForm.footerText}
                      onChange={(e) => setTemplateForm({ ...templateForm, footerText: e.target.value })}
                      placeholder="Text at the bottom of prescriptions"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Logo URL + Color */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tplLogo">Logo URL</Label>
                    <Input
                      id="tplLogo"
                      value={templateForm.logoUrl}
                      onChange={(e) => setTemplateForm({ ...templateForm, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tplColor">Accent Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="tplColor"
                        type="color"
                        value={templateForm.accentColor}
                        onChange={(e) => setTemplateForm({ ...templateForm, accentColor: e.target.value })}
                        className="h-10 w-14 cursor-pointer rounded border border-slate-200 p-1"
                      />
                      <Input
                        value={templateForm.accentColor}
                        onChange={(e) => setTemplateForm({ ...templateForm, accentColor: e.target.value })}
                        className="flex-1"
                        placeholder="#0891b2"
                      />
                    </div>
                  </div>
                </div>

                {/* Default checkbox */}
                <div className="flex items-center gap-3">
                  <Switch
                    id="tplDefault"
                    checked={templateForm.isDefault}
                    onCheckedChange={(v) => setTemplateForm({ ...templateForm, isDefault: v })}
                  />
                  <Label htmlFor="tplDefault" className="cursor-pointer">
                    Set as default template
                  </Label>
                </div>

                {/* Mini Preview */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Preview
                  </Label>
                  <TemplatePreview form={templateForm} clinicName={settings?.clinicName || "My Clinic"} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleTemplateSave} disabled={templateSaving} className="gap-2">
                  {templateSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingTemplateId ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB 3 : User Management (ADMIN only)                              */}
        {/* ================================================================= */}
        {isAdmin && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-teal-600" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and access. Deactivate users instead of deleting them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No users found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          <th className="pb-3 pr-4">Name</th>
                          <th className="pb-3 pr-4">Email</th>
                          <th className="pb-3 pr-4">Role</th>
                          <th className="pb-3 pr-4">Status</th>
                          <th className="pb-3 pr-4">Created</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u) => (
                          <tr key={u.id} className={cn("transition-colors", !u.isActive && "opacity-60")}>
                            <td className="py-3 pr-4 font-medium text-slate-900">{u.name}</td>
                            <td className="py-3 pr-4 text-slate-600">{u.email}</td>
                            <td className="py-3 pr-4">
                              <Select
                                value={u.role}
                                onValueChange={(v) => handleChangeUserRole(u.id, v)}
                                disabled={u.id === session?.user?.id || updatingUserId === u.id}
                              >
                                <SelectTrigger className="h-8 w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                  <SelectItem value="DOCTOR">Doctor</SelectItem>
                                  <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  u.isActive
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-red-200 bg-red-50 text-red-700"
                                )}
                              >
                                {u.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-slate-500">{formatDate(u.createdAt)}</td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Switch
                                  checked={u.isActive}
                                  onCheckedChange={() => handleToggleUserActive(u)}
                                  disabled={u.id === session?.user?.id || updatingUserId === u.id}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template Preview Component
// ---------------------------------------------------------------------------

function TemplatePreview({
  form,
  clinicName,
}: {
  form: typeof emptyTemplateForm;
  clinicName: string;
}) {
  const layoutStyles: Record<string, string> = {
    standard: "font-serif",
    modern: "font-sans",
    minimal: "font-sans text-slate-700",
    detailed: "font-mono text-xs",
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 shadow-sm",
        layoutStyles[form.layout] || ""
      )}
    >
      {/* Header */}
      <div
        className="mb-3 border-b-2 pb-2"
        style={{ borderColor: form.accentColor }}
      >
        <div className="flex items-center gap-3">
          {form.logoUrl && (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-[10px] text-slate-400">
              Logo
            </div>
          )}
          <div>
            <p className="text-sm font-bold" style={{ color: form.accentColor }}>
              {clinicName}
            </p>
            {form.headerText && (
              <p className="text-[10px] text-slate-500">{form.headerText}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body preview */}
      <div className="space-y-2 py-2">
        <div className="flex gap-2 text-[10px]">
          <span className="font-semibold text-slate-600">Patient:</span>
          <span className="text-slate-400">John Doe</span>
          <span className="ml-auto font-semibold text-slate-600">Date:</span>
          <span className="text-slate-400">07 Apr 2026</span>
        </div>
        <div className="text-[10px]">
          <span className="font-semibold text-slate-600">Diagnosis:</span>{" "}
          <span className="text-slate-400">Sample diagnosis</span>
        </div>
        <div className="mt-2 rounded border border-dashed border-slate-200 p-2">
          <p className="text-[10px] font-semibold" style={{ color: form.accentColor }}>
            Rx
          </p>
          <div className="mt-1 space-y-1 text-[9px] text-slate-400">
            <p>1. Paracetamol 500mg - 1 tab - 3 times/day - 5 days</p>
            <p>2. Amoxicillin 250mg - 1 cap - 2 times/day - 7 days</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      {form.footerText && (
        <div
          className="mt-3 border-t pt-2 text-center text-[9px] text-slate-400"
          style={{ borderColor: form.accentColor }}
        >
          {form.footerText}
        </div>
      )}

      {/* Layout badge */}
      <div className="mt-2 text-right">
        <span
          className="inline-block rounded px-1.5 py-0.5 text-[9px] font-medium capitalize text-white"
          style={{ backgroundColor: form.accentColor }}
        >
          {form.layout}
        </span>
      </div>
    </div>
  );
}
