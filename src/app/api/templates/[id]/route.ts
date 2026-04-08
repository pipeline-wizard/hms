import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      description,
      headerText,
      footerText,
      logoUrl,
      accentColor,
      layout,
      isDefault,
    } = body;

    // Check if template exists
    const existing = await prisma.prescriptionTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // If this template is set as default, unset all others
    if (isDefault) {
      await prisma.prescriptionTemplate.updateMany({
        where: { isDefault: true, id: { not: params.id } },
        data: { isDefault: false },
      });
    }

    const template = await prisma.prescriptionTemplate.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description : existing.description,
        headerText: headerText !== undefined ? headerText : existing.headerText,
        footerText: footerText !== undefined ? footerText : existing.footerText,
        logoUrl: logoUrl !== undefined ? logoUrl : existing.logoUrl,
        accentColor: accentColor !== undefined ? accentColor : existing.accentColor,
        layout: layout !== undefined ? layout : existing.layout,
        isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
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

    // Check if template exists
    const existing = await prisma.prescriptionTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { prescriptions: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if template is used in prescriptions
    if (existing._count.prescriptions > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete template. It is used in ${existing._count.prescriptions} prescription(s).`,
        },
        { status: 400 }
      );
    }

    await prisma.prescriptionTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
