import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        prescriptions: {
          include: {
            doctor: {
              select: { id: true, name: true, specialization: true },
            },
            items: true,
          },
          orderBy: { createdAt: "desc" },
        },
        bills: {
          orderBy: { createdAt: "desc" },
        },
        admissions: {
          include: {
            admittedByUser: {
              select: { id: true, name: true },
            },
          },
          orderBy: { admissionDate: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    } = body;

    const existing = await prisma.patient.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const patient = await prisma.patient.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(age !== undefined && { age: parseInt(age) }),
        ...(gender !== undefined && { gender }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email: email || null }),
        ...(address !== undefined && { address: address || null }),
        ...(bloodGroup !== undefined && { bloodGroup: bloodGroup || null }),
        ...(allergies !== undefined && { allergies: allergies || null }),
        ...(medicalHistory !== undefined && {
          medicalHistory: medicalHistory || null,
        }),
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.patient.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    await prisma.patient.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
