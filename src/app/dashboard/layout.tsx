"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Building2 } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/patients": "Patients",
  "/dashboard/prescriptions": "Prescriptions",
  "/dashboard/billing": "Billing",
  "/dashboard/settings": "Settings",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [setupPending, setSetupPending] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const title = useMemo(() => {
    const exactMatch = pageTitles[pathname];
    if (exactMatch) return exactMatch;

    // Find the closest matching parent route
    const matchingKey = Object.keys(pageTitles)
      .filter((key) => pathname.startsWith(key))
      .sort((a, b) => b.length - a.length)[0];

    return matchingKey ? pageTitles[matchingKey] : "Dashboard";
  }, [pathname]);

  // Check onboarding status once after session loads
  useEffect(() => {
    if (status !== "authenticated" || onboardingChecked) return;

    const checkOnboarding = async () => {
      try {
        const res = await fetch("/api/settings/onboarding");
        if (res.ok) {
          const data = await res.json();
          if (!data.isOnboarded) {
            if (session?.user?.role === "ADMIN") {
              router.push("/onboarding");
              return;
            } else {
              setSetupPending(true);
            }
          }
        }
      } catch {
        // Silently fail - don't block dashboard access
      } finally {
        setOnboardingChecked(true);
      }
    };

    checkOnboarding();
  }, [status, onboardingChecked, session, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Non-admin user sees a pending message when clinic is not onboarded
  if (setupPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Building2 className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            Clinic Setup Pending
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Clinic setup pending. Please ask an administrator to complete the
            setup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title={title}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
