import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true,
            phone: true,
          },
        },
        items: true,
        template: true,
        bill: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Doctor isolation: DOCTOR role can only view their own prescriptions
    if (session.user.role === "DOCTOR" && prescription.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only view your own prescriptions" },
        { status: 403 }
      );
    }

    return NextResponse.json(prescription);
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescription" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Doctor isolation: verify ownership before allowing edit
    if (session.user.role === "DOCTOR") {
      const existing = await prisma.prescription.findUnique({
        where: { id: params.id },
        select: { doctorId: true },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Prescription not found" },
          { status: 404 }
        );
      }
      if (existing.doctorId !== session.user.id) {
        return NextResponse.json(
          { error: "Forbidden: You can only edit your own prescriptions" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { diagnosis, notes, vitals, templateId, items } = body;

    if (!diagnosis || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Diagnosis and at least one medicine are required" },
        { status: 400 }
      );
    }

    const prescription = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.prescriptionItem.deleteMany({
        where: { prescriptionId: params.id },
      });

      // Update prescription and create new items
      const updated = await tx.prescription.update({
        where: { id: params.id },
        data: {
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

      return updated;
    });

    return NextResponse.json(prescription);
  } catch (error) {
    console.error("Error updating prescription:", error);
    return NextResponse.json(
      { error: "Failed to update prescription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.prescription.findUnique({
      where: { id: params.id },
      include: { bill: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Doctor isolation: verify ownership before allowing delete
    if (session.user.role === "DOCTOR" && existing.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own prescriptions" },
        { status: 403 }
      );
    }

    if (existing.bill) {
      return NextResponse.json(
        { error: "Cannot delete prescription with an associated bill. Delete the bill first." },
        { status: 400 }
      );
    }

    await prisma.prescription.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Prescription deleted successfully" });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return NextResponse.json(
      { error: "Failed to delete prescription" },
      { status: 500 }
    );
  }
}
