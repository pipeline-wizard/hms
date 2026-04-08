import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { roomNumber, bedNumber, ward, reason, notes } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Reason for admission is required" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    if (patient.patientType === "INPATIENT") {
      return NextResponse.json(
        { error: "Patient is already admitted as an inpatient" },
        { status: 400 }
      );
    }

    const [updatedPatient, admission] = await prisma.$transaction([
      prisma.patient.update({
        where: { id: params.id },
        data: { patientType: "INPATIENT" },
      }),
      prisma.admission.create({
        data: {
          patientId: params.id,
          admittedBy: session.user.id,
          roomNumber: roomNumber || null,
          bedNumber: bedNumber || null,
          ward: ward || null,
          reason,
          notes: notes || null,
          status: "ADMITTED",
        },
        include: {
          patient: true,
          admittedByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json(admission, { status: 201 });
  } catch (error) {
    console.error("Error admitting patient:", error);
    return NextResponse.json(
      { error: "Failed to admit patient" },
      { status: 500 }
    );
  }
}
