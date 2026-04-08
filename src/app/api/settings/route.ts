import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.clinicSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", clinicName: "My Clinic" },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      clinicName,
      address,
      phone,
      email,
      website,
      logoUrl,
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
        logoUrl: logoUrl || null,
        specialty: specialty || null,
        description: description || null,
        registrationNo: registrationNo || null,
        operatingHours: operatingHours || null,
        currency: currency || "INR",
        currencySymbol: currencySymbol || "₹",
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : 0,
        taxName: taxName || "GST",
      },
      create: {
        id: "default",
        clinicName: clinicName || "My Clinic",
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        logoUrl: logoUrl || null,
        specialty: specialty || null,
        description: description || null,
        registrationNo: registrationNo || null,
        operatingHours: operatingHours || null,
        currency: currency || "INR",
        currencySymbol: currencySymbol || "₹",
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : 0,
        taxName: taxName || "GST",
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
