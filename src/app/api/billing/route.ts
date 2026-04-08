import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBillNumber } from "@/lib/utils";

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
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { billNumber: { contains: q, mode: "insensitive" } },
        { patient: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: {
            select: { id: true, name: true, patientId: true, phone: true },
          },
          items: true,
        },
      }),
      prisma.bill.count({ where }),
    ]);

    return NextResponse.json({
      bills,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
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
      patientId,
      prescriptionId,
      items,
      discount = 0,
      taxRate = 0,
      paymentMethod,
      notes,
    } = body;

    if (!patientId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Patient and at least one item are required" },
        { status: 400 }
      );
    }

    // Calculate totals
    const calculatedItems = items.map(
      (item: {
        description: string;
        category: string;
        quantity: number;
        unitPrice: number;
      }) => ({
        description: item.description,
        category: item.category || "General",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
      })
    );

    const subtotal = calculatedItems.reduce(
      (sum: number, item: { amount: number }) => sum + item.amount,
      0
    );
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal - discount + taxAmount;

    const bill = await prisma.$transaction(async (tx) => {
      const created = await tx.bill.create({
        data: {
          billNumber: generateBillNumber(),
          patientId,
          prescriptionId: prescriptionId || null,
          subtotal,
          discount,
          taxRate,
          taxAmount,
          totalAmount,
          status: paymentMethod ? "PAID" : "PENDING",
          paymentMethod: paymentMethod || null,
          notes: notes || null,
          items: {
            create: calculatedItems,
          },
        },
        include: {
          patient: {
            select: { id: true, name: true, patientId: true, phone: true },
          },
          items: true,
          prescription: true,
        },
      });

      return created;
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}
