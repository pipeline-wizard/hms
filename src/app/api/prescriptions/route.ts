import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const doctorIdParam = searchParams.get("doctorId");
    const skip = (page - 1) * limit;

    const userRole = session.user.role;
    const userId = session.user.id;

    // Build base filter
    const where: Record<string, unknown> = {};

    // Doctor isolation: DOCTOR role sees only their own prescriptions by default
    if (userRole === "DOCTOR") {
      where.doctorId = doctorIdParam || userId;
    } else if (doctorIdParam) {
      // ADMIN/RECEPTIONIST can filter by doctorId if provided
      where.doctorId = doctorIdParam;
    }

    // Add search conditions
    if (search) {
      where.OR = [
        { patient: { name: { contains: search, mode: "insensitive" as const } } },
        { diagnosis: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
          patient: {
            select: { id: true, name: true, patientId: true, age: true, gender: true },
          },
          doctor: {
            select: { id: true, name: true, specialization: true },
          },
          items: true,
          bill: { select: { id: true, billNumber: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.prescription.count({ where }),
    ]);

    return NextResponse.json({
      prescriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, doctorId, diagnosis, notes, vitals, templateId, items } = body;

    if (!patientId || !doctorId || !diagnosis || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Patient, doctor, diagnosis, and at least one medicine are required" },
        { status: 400 }
      );
    }

    const userRole = session.user.role;
    const userId = session.user.id;

    // For DOCTOR role, always use the logged-in doctor's ID to prevent impersonation
    const effectiveDoctorId = userRole === "DOCTOR" ? userId : doctorId;

    const prescription = await prisma.$transaction(async (tx) => {
      const created = await tx.prescription.create({
        data: {
          patientId,
          doctorId: effectiveDoctorId,
          diagnosis,
          notes: notes || null,
          vitals: vitals || null,
          templateId: templateId || null,
          items: {
            create: items.map((item: {
              medicineName: string;
              dosage: string;
              frequency: string;
              duration: string;
              instructions?: string;
            }) => ({
              medicineName: item.medicineName,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions || null,
            })),
          },
        },
        include: {
          patient: {
            select: { id: true, name: true, patientId: true, age: true, gender: true },
          },
          doctor: {
            select: { id: true, name: true, specialization: true },
          },
          items: true,
          template: true,
        },
      });
      return created;
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 }
    );
  }
}
