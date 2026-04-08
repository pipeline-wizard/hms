import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.clinicSettings.findUnique({
      where: { id: "default" },
      select: { isOnboarded: true },
    });

    return NextResponse.json({ isOnboarded: settings?.isOnboarded ?? false });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      clinicName,
      address,
      phone,
      email,
      website,
      specialty,
      description,
      registrationNo,
      operatingHours,
      currency,
      currencySymbol,
      taxRate,
      taxName,
    } = body;

    const settings = await prisma.clinicSettings.upsert({
      where: { id: "default" },
      update: {
        clinicName: clinicName || "My Clinic",
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        specialty: specialty || null,
        description: description || null,
        registrationNo: registrationNo || null,
        operatingHours: operatingHours || null,
        currency: currency || "INR",
        currencySymbol: currencySymbol || "₹",
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : 0,
        taxName: taxName || "GST",
        isOnboarded: true,
      },
      create: {
        id: "default",
        clinicName: clinicName || "My Clinic",
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        specialty: specialty || null,
        description: description || null,
        registrationNo: registrationNo || null,
        operatingHours: operatingHours || null,
        currency: currency || "INR",
        currencySymbol: currencySymbol || "₹",
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : 0,
        taxName: taxName || "GST",
        isOnboarded: true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
