import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

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
      // Total patients
      prisma.patient.count(),

      // Today's prescriptions
      prisma.prescription.count({
        where: { createdAt: { gte: todayStart } },
      }),

      // This month's revenue (sum of paid bills)
      prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "PAID",
          createdAt: { gte: monthStart },
        },
      }),

      // Pending bills count
      prisma.bill.count({
        where: { status: "PENDING" },
      }),

      // Last month's patient count (for growth)
      prisma.patient.count({
        where: { createdAt: { lte: lastMonthEnd } },
      }),

      // Last month's revenue (for growth)
      prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "PAID",
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),

      // Recent 5 patients
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

      // Recent 5 prescriptions with patient and doctor
      prisma.prescription.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          diagnosis: true,
          createdAt: true,
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
        },
      }),
    ]);

    // Calculate growth percentages
    const monthRevenue = monthRevenueResult._sum.totalAmount ?? 0;
    const lastMonthRevenue = lastMonthRevenueResult._sum.totalAmount ?? 0;

    const thisMonthNewPatients = totalPatients - lastMonthPatients;
    // Approximate last month new patients using total at end of last month vs month before
    const patientGrowth =
      lastMonthPatients > 0
        ? ((thisMonthNewPatients / lastMonthPatients) * 100)
        : 0;

    const revenueGrowth =
      lastMonthRevenue > 0
        ? (((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0;

    // Last 7 days revenue data
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const revenueByDay = await prisma.bill.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    // Group revenue by day
    const revenueMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
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
      recentPrescriptions,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
