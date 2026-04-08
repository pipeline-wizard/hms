import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status && ["ADMITTED", "DISCHARGED", "TRANSFERRED"].includes(status)) {
      where.status = status;
    }

    const admissions = await prisma.admission.findMany({
      where,
      include: {
        patient: true,
        admittedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { admissionDate: "desc" },
    });

    return NextResponse.json(admissions);
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch admissions" },
      { status: 500 }
    );
  }
}
