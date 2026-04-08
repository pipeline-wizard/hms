import { Stethoscope } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-medical-50 via-white to-medical-100">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-medical-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-medical-300/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-medical-100/40 blur-3xl" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Branding header */}
        <div className="mb-8 flex flex-col items-center animate-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-medical-500 to-medical-700 shadow-lg shadow-medical-500/25">
            <Stethoscope className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
            ClinicFlow
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clinic Management System
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
