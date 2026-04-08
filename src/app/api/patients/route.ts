import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePatientId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const patientType = searchParams.get("patientType");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q, mode: "insensitive" as const } },
        { patientId: { contains: q, mode: "insensitive" as const } },
      ];
    }

    if (patientType && ["OUTPATIENT", "INPATIENT"].includes(patientType)) {
      where.patientType = patientType;
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({
      patients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      age,
      gender,
      phone,
      email,
      address,
      bloodGroup,
      allergies,
      medicalHistory,
      patientType,
    } = body;

    if (!name || !age || !gender || !phone) {
      return NextResponse.json(
        { error: "Name, age, gender, and phone are required" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        patientId: generatePatientId(),
        name,
        age: parseInt(age),
        gender,
        phone,
        email: email || null,
        address: address || null,
        bloodGroup: bloodGroup || null,
        allergies: allergies || null,
        medicalHistory: medicalHistory || null,
        patientType: patientType === "INPATIENT" ? "INPATIENT" : "OUTPATIENT",
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
