import { PrismaClient, Role, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create default clinic settings
  await prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      clinicName: "ClinicFlow Medical Center",
      address: "123 Health Street, Medical District",
      phone: "+91 98765 43210",
      email: "info@clinicflow.com",
      currency: "INR",
      currencySymbol: "₹",
      taxRate: 18,
      taxName: "GST",
    },
  });

  // Create default admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@clinicflow.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@clinicflow.com",
      password: adminPassword,
      role: Role.ADMIN,
      phone: "+91 98765 00001",
    },
  });

  // Create a doctor
  const doctorPassword = await bcrypt.hash("doctor123", 12);
  const doctor = await prisma.user.upsert({
    where: { email: "dr.sharma@clinicflow.com" },
    update: {},
    create: {
      name: "Dr. Priya Sharma",
      email: "dr.sharma@clinicflow.com",
      password: doctorPassword,
      role: Role.DOCTOR,
      phone: "+91 98765 00002",
      specialization: "General Medicine",
    },
  });

  // Create a receptionist
  const receptionistPassword = await bcrypt.hash("reception123", 12);
  await prisma.user.upsert({
    where: { email: "reception@clinicflow.com" },
    update: {},
    create: {
      name: "Rahul Verma",
      email: "reception@clinicflow.com",
      password: receptionistPassword,
      role: Role.RECEPTIONIST,
      phone: "+91 98765 00003",
    },
  });

  // Create prescription templates
  const templates = [
    {
      name: "Standard",
      description: "Clean, professional prescription layout",
      headerText: "Medical Prescription",
      footerText: "Get well soon! Please complete the full course of medication.",
      accentColor: "#0891b2",
      layout: "standard",
      isDefault: true,
    },
    {
      name: "Modern",
      description: "Contemporary design with accent colors",
      headerText: "Prescription",
      footerText: "Follow-up visit recommended if symptoms persist.",
      accentColor: "#7c3aed",
      layout: "modern",
      isDefault: false,
    },
    {
      name: "Minimal",
      description: "Simple, minimalist prescription format",
      headerText: "",
      footerText: "",
      accentColor: "#374151",
      layout: "minimal",
      isDefault: false,
    },
    {
      name: "Detailed",
      description: "Comprehensive layout with all details",
      headerText: "Detailed Medical Prescription",
      footerText: "This prescription is valid for 30 days from the date of issue.",
      accentColor: "#059669",
      layout: "detailed",
      isDefault: false,
    },
  ];

  for (const template of templates) {
    await prisma.prescriptionTemplate.upsert({
      where: { id: template.name.toLowerCase() },
      update: template,
      create: { id: template.name.toLowerCase(), ...template },
    });
  }

  // Create sample patients
  const patients = [
    {
      patientId: "PT25001",
      name: "Amit Patel",
      age: 35,
      gender: Gender.MALE,
      phone: "+91 87654 32101",
      email: "amit.patel@email.com",
      address: "45 Green Park, New Delhi",
      bloodGroup: "B+",
      allergies: "Penicillin",
      medicalHistory: "Hypertension (diagnosed 2022)",
    },
    {
      patientId: "PT25002",
      name: "Sneha Gupta",
      age: 28,
      gender: Gender.FEMALE,
      phone: "+91 87654 32102",
      email: "sneha.gupta@email.com",
      address: "12 Lake View, Mumbai",
      bloodGroup: "O+",
      allergies: null,
      medicalHistory: null,
    },
    {
      patientId: "PT25003",
      name: "Rajesh Kumar",
      age: 52,
      gender: Gender.MALE,
      phone: "+91 87654 32103",
      address: "78 MG Road, Bangalore",
      bloodGroup: "A+",
      allergies: "Sulfa drugs",
      medicalHistory: "Type 2 Diabetes, controlled with Metformin",
    },
    {
      patientId: "PT25004",
      name: "Fatima Khan",
      age: 42,
      gender: Gender.FEMALE,
      phone: "+91 87654 32104",
      email: "fatima.k@email.com",
      address: "56 Civil Lines, Hyderabad",
      bloodGroup: "AB+",
      allergies: null,
      medicalHistory: "Thyroid disorder",
    },
    {
      patientId: "PT25005",
      name: "Arjun Singh",
      age: 19,
      gender: Gender.MALE,
      phone: "+91 87654 32105",
      address: "23 Sector 15, Chandigarh",
      bloodGroup: "O-",
      allergies: "Aspirin",
      medicalHistory: null,
    },
  ];

  const createdPatients = [];
  for (const patient of patients) {
    const p = await prisma.patient.upsert({
      where: { patientId: patient.patientId },
      update: patient,
      create: patient,
    });
    createdPatients.push(p);
  }

  // Create sample prescriptions
  const prescription1 = await prisma.prescription.create({
    data: {
      patientId: createdPatients[0].id,
      doctorId: doctor.id,
      diagnosis: "Upper Respiratory Tract Infection",
      notes: "Patient presents with sore throat, mild fever, and cough for 3 days. No signs of pneumonia.",
      vitals: {
        bp: "120/80",
        temperature: "99.5°F",
        pulse: "78 bpm",
        weight: "72 kg",
        spo2: "98%",
      },
      templateId: "standard",
      items: {
        create: [
          {
            medicineName: "Amoxicillin 500mg",
            dosage: "500mg",
            frequency: "TDS",
            duration: "5 days",
            instructions: "After meals",
          },
          {
            medicineName: "Paracetamol 650mg",
            dosage: "650mg",
            frequency: "SOS",
            duration: "3 days",
            instructions: "For fever above 100°F",
          },
          {
            medicineName: "Cetirizine 10mg",
            dosage: "10mg",
            frequency: "OD",
            duration: "5 days",
            instructions: "At bedtime",
          },
        ],
      },
    },
  });

  await prisma.prescription.create({
    data: {
      patientId: createdPatients[1].id,
      doctorId: doctor.id,
      diagnosis: "Migraine",
      notes: "Recurrent headaches, predominantly unilateral. Photophobia present.",
      vitals: {
        bp: "110/70",
        temperature: "98.6°F",
        pulse: "72 bpm",
        weight: "58 kg",
        spo2: "99%",
      },
      templateId: "modern",
      items: {
        create: [
          {
            medicineName: "Sumatriptan 50mg",
            dosage: "50mg",
            frequency: "SOS",
            duration: "As needed",
            instructions: "At onset of migraine",
          },
          {
            medicineName: "Domperidone 10mg",
            dosage: "10mg",
            frequency: "BD",
            duration: "5 days",
            instructions: "Before meals",
          },
        ],
      },
    },
  });

  // Create sample bills
  await prisma.bill.create({
    data: {
      billNumber: "INV-2504-0001",
      patientId: createdPatients[0].id,
      prescriptionId: prescription1.id,
      subtotal: 1500,
      discount: 100,
      taxRate: 18,
      taxAmount: 252,
      totalAmount: 1652,
      status: "PAID",
      paymentMethod: "UPI",
      items: {
        create: [
          {
            description: "Consultation Fee",
            category: "Consultation",
            quantity: 1,
            unitPrice: 500,
            amount: 500,
          },
          {
            description: "Amoxicillin 500mg (15 tablets)",
            category: "Medicine",
            quantity: 1,
            unitPrice: 450,
            amount: 450,
          },
          {
            description: "Paracetamol 650mg (10 tablets)",
            category: "Medicine",
            quantity: 1,
            unitPrice: 120,
            amount: 120,
          },
          {
            description: "Cetirizine 10mg (5 tablets)",
            category: "Medicine",
            quantity: 1,
            unitPrice: 80,
            amount: 80,
          },
          {
            description: "Blood Test - CBC",
            category: "Lab Test",
            quantity: 1,
            unitPrice: 350,
            amount: 350,
          },
        ],
      },
    },
  });

  await prisma.bill.create({
    data: {
      billNumber: "INV-2504-0002",
      patientId: createdPatients[1].id,
      subtotal: 800,
      discount: 0,
      taxRate: 18,
      taxAmount: 144,
      totalAmount: 944,
      status: "PENDING",
      items: {
        create: [
          {
            description: "Consultation Fee",
            category: "Consultation",
            quantity: 1,
            unitPrice: 500,
            amount: 500,
          },
          {
            description: "Sumatriptan 50mg (4 tablets)",
            category: "Medicine",
            quantity: 1,
            unitPrice: 200,
            amount: 200,
          },
          {
            description: "Domperidone 10mg (10 tablets)",
            category: "Medicine",
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
      },
    },
  });

  console.log("Seed data created successfully!");
  console.log("\nDefault login credentials:");
  console.log("  Admin:        admin@clinicflow.com / admin123");
  console.log("  Doctor:       dr.sharma@clinicflow.com / doctor123");
  console.log("  Receptionist: reception@clinicflow.com / reception123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
