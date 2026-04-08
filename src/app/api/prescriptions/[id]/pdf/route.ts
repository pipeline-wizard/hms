import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
            specialization: true,
            phone: true,
            email: true,
          },
        },
        items: true,
        template: true,
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    const settings = await prisma.clinicSettings.findFirst({
      where: { id: "default" },
    });

    const clinicName = settings?.clinicName || "My Clinic";
    const clinicAddress = settings?.address || "";
    const clinicPhone = settings?.phone || "";
    const clinicEmail = settings?.email || "";
    const accentColor = prescription.template?.accentColor || "#0891b2";

    // Parse accent color to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 8, g: 145, b: 178 };
    };

    const accent = hexToRgb(accentColor);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // --- Header ---
    doc.setFillColor(accent.r, accent.g, accent.b);
    doc.rect(0, 0, pageWidth, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(clinicName, pageWidth / 2, y, { align: "center" });
    y += 8;

    if (clinicAddress) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(clinicAddress, pageWidth / 2, y, { align: "center" });
      y += 5;
    }

    const contactParts: string[] = [];
    if (clinicPhone) contactParts.push(`Phone: ${clinicPhone}`);
    if (clinicEmail) contactParts.push(`Email: ${clinicEmail}`);
    if (contactParts.length > 0) {
      doc.setFontSize(8);
      doc.text(contactParts.join("  |  "), pageWidth / 2, y, { align: "center" });
    }

    y = 42;

    // --- Doctor Info ---
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr. ${prescription.doctor.name}`, 14, y);
    if (prescription.doctor.specialization) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(prescription.doctor.specialization, 14, y + 5);
    }

    // Date on right
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date(prescription.createdAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Date: ${dateStr}`, pageWidth - 14, y, { align: "right" });

    y += 12;

    // --- Divider ---
    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    // --- Patient Info ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("Patient Information", 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    const patientInfo = [
      [`Name: ${prescription.patient.name}`, `ID: ${prescription.patient.patientId}`],
      [`Age: ${prescription.patient.age} years`, `Gender: ${prescription.patient.gender}`],
    ];

    patientInfo.forEach((row) => {
      doc.text(row[0], 14, y);
      doc.text(row[1], 110, y);
      y += 5;
    });

    y += 3;

    // --- Vitals ---
    const vitals = prescription.vitals as Record<string, string> | null;
    if (vitals && Object.values(vitals).some((v) => v)) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text("Vitals", 14, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      const vitalEntries: string[] = [];
      if (vitals.bloodPressure) vitalEntries.push(`BP: ${vitals.bloodPressure} mmHg`);
      if (vitals.temperature) vitalEntries.push(`Temp: ${vitals.temperature} °F`);
      if (vitals.pulseRate) vitalEntries.push(`Pulse: ${vitals.pulseRate} bpm`);
      if (vitals.weight) vitalEntries.push(`Weight: ${vitals.weight} kg`);
      if (vitals.height) vitalEntries.push(`Height: ${vitals.height} cm`);
      if (vitals.spO2) vitalEntries.push(`SpO2: ${vitals.spO2}%`);

      // Display vitals in a row, wrapping as needed
      const vitalsLine = vitalEntries.join("   |   ");
      doc.text(vitalsLine, 14, y);
      y += 8;
    }

    // --- Rx Symbol ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.text("Rx", 14, y + 2);
    y += 8;

    // --- Medicine Table ---
    const tableData = prescription.items.map((item, index) => [
      (index + 1).toString(),
      item.medicineName,
      item.dosage,
      item.frequency,
      item.duration,
      item.instructions || "-",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["#", "Medicine", "Dosage", "Frequency", "Duration", "Instructions"]],
      body: tableData,
      margin: { left: 14, right: 14 },
      headStyles: {
        fillColor: [accent.r, accent.g, accent.b],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: "auto" },
      },
      theme: "grid",
      styles: {
        lineColor: [220, 220, 220],
        lineWidth: 0.25,
      },
    });

    // Get Y after table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;

    // --- Diagnosis ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text("Diagnosis", 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const diagLines = doc.splitTextToSize(prescription.diagnosis, pageWidth - 28);
    doc.text(diagLines, 14, y);
    y += diagLines.length * 4.5 + 4;

    // --- Notes ---
    if (prescription.notes) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text("Notes", 14, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const noteLines = doc.splitTextToSize(prescription.notes, pageWidth - 28);
      doc.text(noteLines, 14, y);
      y += noteLines.length * 4.5 + 4;
    }

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 20;

    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.setLineWidth(0.3);
    doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

    const footerText = prescription.template?.footerText || "Get well soon!";
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text(footerText, pageWidth / 2, footerY, { align: "center" });

    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Generated on ${new Date().toLocaleDateString("en-IN")} | ${clinicName}`,
      pageWidth / 2,
      footerY + 8,
      { align: "center" }
    );

    // Return PDF
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="prescription-${params.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
