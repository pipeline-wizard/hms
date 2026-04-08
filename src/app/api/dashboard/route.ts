import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse date range from query params
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Determine chart date range
    let chartStart: Date;
    let chartDays: number;
    switch (range) {
      case "today":
        chartStart = todayStart;
        chartDays = 1;
        break;
      case "30d":
        chartStart = new Date(now);
        chartStart.setDate(chartStart.getDate() - 29);
        chartStart.setHours(0, 0, 0, 0);
        chartDays = 30;
        break;
      case "7d":
      default:
        chartStart = new Date(now);
        chartStart.setDate(chartStart.getDate() - 6);
        chartStart.setHours(0, 0, 0, 0);
        chartDays = 7;
        break;
    }

    // Run all queries in parallel
    const [
      totalPatients,
      todayPrescriptions,
      monthRevenueResult,
      pendingBills,
      lastMonthPatients,
      lastMonthRevenueResult,
      recentPatients,
      recentPrescriptions,
    ] = await Promise.all([
      prisma.patient.count(),

      prisma.prescription.count({
        where: { createdAt: { gte: todayStart } },
      }),

      prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "PAID",
          createdAt: { gte: monthStart },
        },
      }),

      prisma.bill.count({
        where: { status: "PENDING" },
      }),

      prisma.patient.count({
        where: { createdAt: { lte: lastMonthEnd } },
      }),

      prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "PAID",
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),

      prisma.patient.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          age: true,
          gender: true,
          phone: true,
          createdAt: true,
        },
      }),

      prisma.prescription.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          diagnosis: true,
          createdAt: true,
          patient: { select: { id: true, name: true } },
          doctor: { select: { name: true } },
        },
      }),
    ]);

    // Check which prescriptions have bills
    const prescriptionIds = recentPrescriptions.map((p) => p.id);
    const billsForPrescriptions = await prisma.bill.findMany({
      where: { prescriptionId: { in: prescriptionIds } },
      select: { prescriptionId: true },
    });
    const billedPrescriptionIds = new Set(
      billsForPrescriptions.map((b) => b.prescriptionId).filter(Boolean)
    );

    const prescriptionsWithBillStatus = recentPrescriptions.map((rx) => ({
      ...rx,
      hasBill: billedPrescriptionIds.has(rx.id),
    }));

    // Calculate growth percentages
    const monthRevenue = monthRevenueResult._sum.totalAmount ?? 0;
    const lastMonthRevenue = lastMonthRevenueResult._sum.totalAmount ?? 0;

    const thisMonthNewPatients = totalPatients - lastMonthPatients;
    const patientGrowth =
      lastMonthPatients > 0
        ? ((thisMonthNewPatients / lastMonthPatients) * 100)
        : 0;

    const revenueGrowth =
      lastMonthRevenue > 0
        ? (((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0;

    // Revenue data for chart based on selected range
    const revenueByDay = await prisma.bill.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: chartStart },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    // Group revenue by day
    const revenueMap = new Map<string, number>();
    for (let i = 0; i < chartDays; i++) {
      const d = new Date(chartStart);
      d.setDate(d.getDate() + i);
      const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      revenueMap.set(key, 0);
    }

    for (const bill of revenueByDay) {
      const key = new Date(bill.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + bill.totalAmount);
    }

    const revenueData = Array.from(revenueMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));

    return NextResponse.json({
      stats: {
        totalPatients,
        todayPrescriptions,
        monthRevenue,
        pendingBills,
        patientGrowth: Number(patientGrowth.toFixed(1)),
        revenueGrowth: Number(revenueGrowth.toFixed(1)),
      },
      revenueData,
      recentPatients,
      recentPrescriptions: prescriptionsWithBillStatus,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
