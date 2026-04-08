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
    const { notes } = body;

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    if (patient.patientType !== "INPATIENT") {
      return NextResponse.json(
        { error: "Patient is not currently admitted as an inpatient" },
        { status: 400 }
      );
    }

    const latestAdmission = await prisma.admission.findFirst({
      where: {
        patientId: params.id,
        status: "ADMITTED",
      },
      orderBy: { admissionDate: "desc" },
    });

    if (!latestAdmission) {
      return NextResponse.json(
        { error: "No active admission found for this patient" },
        { status: 400 }
      );
    }

    const [updatedPatient, updatedAdmission] = await prisma.$transaction([
      prisma.patient.update({
        where: { id: params.id },
        data: { patientType: "OUTPATIENT" },
      }),
      prisma.admission.update({
        where: { id: latestAdmission.id },
        data: {
          status: "DISCHARGED",
          dischargeDate: new Date(),
          notes: notes
            ? latestAdmission.notes
              ? `${latestAdmission.notes}\n\nDischarge Notes: ${notes}`
              : `Discharge Notes: ${notes}`
            : latestAdmission.notes,
        },
        include: {
          patient: true,
          admittedByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json(updatedAdmission);
  } catch (error) {
    console.error("Error discharging patient:", error);
    return NextResponse.json(
      { error: "Failed to discharge patient" },
      { status: 500 }
    );
  }
}
