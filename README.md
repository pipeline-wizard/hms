# ClinicFlow - Modern Clinic Management System

A full-stack, production-ready Hospital Management System (HMS) built for small to mid-size clinics. Replaces paper prescriptions, manual billing, and scattered patient records with a modern, centralized platform.

**Live:** [https://clinicflow-app-prod.azurewebsites.net](https://clinicflow-app-prod.azurewebsites.net)

---

## Features

### Core Modules

- **Multi-Role Authentication** - Admin, Doctor, and Receptionist roles with role-based access control
- **Patient Management** - Registration, search, medical history, allergies, blood group tracking
- **Prescription Generator** - Digital prescriptions with vitals, medicine table, and downloadable PDF export
- **Itemized Billing** - Consultation fees, lab tests, medicines with tax/discount calculations
- **Dashboard** - Real-time stats, revenue charts, recent patients and prescriptions

### Advanced Features

- **Inpatient/Outpatient Tracking** - Admit and discharge patients with ward/bed/room assignment and full admission history
- **Doctor Prescription Isolation** - Doctors see only their own prescriptions by default; admins/receptionists see all
- **Prescription Templates** - 4 built-in templates (Standard, Modern, Minimal, Detailed) with custom accent colors and layouts
- **Quick Patient Creation** - Add new patients inline from any search across prescriptions, billing, or patient list
- **Admin Onboarding Wizard** - 5-step guided setup for clinic name, specialty, contact details, and billing configuration
- **PDF Generation** - Professional prescription PDFs with clinic branding, vitals section, and medicine tables
- **Print-Ready Invoices** - Browser-printable invoice view with itemized breakdown

### Production Features

- **Auth Middleware** - Route protection and role-based API access control via Next.js middleware
- **Structured Logging** - JSON-formatted logs with severity levels for production observability
- **Error Boundaries** - Graceful error handling with retry capabilities
- **Reusable Components** - Shared patient search, confirmation dialogs, empty states, loading skeletons

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma |
| **Auth** | NextAuth.js v4 (Credentials Provider) |
| **Charts** | Recharts |
| **PDF** | jsPDF + jspdf-autotable |
| **Icons** | Lucide React |
| **Deployment** | Docker + Azure App Service |
| **IaC** | Azure Bicep |
| **CI/CD** | GitHub Actions |

---

## Screenshots

> Login with the admin credentials, then explore Dashboard, Patients, Prescriptions, Billing, and Settings.

---

## Project Structure

```
clinicflow/
├── prisma/
│   ├── schema.prisma          # Database schema (9 models)
│   └── seed.ts                # Sample data seeder
├── infra/
│   ├── main.bicep             # Azure infrastructure as code
│   ├── deploy.sh              # One-click deployment script
│   └── parameters.prod.json   # Production parameters template
├── .github/workflows/
│   └── deploy.yml             # CI/CD pipeline
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & Register pages
│   │   ├── onboarding/        # Admin setup wizard (5 steps)
│   │   ├── dashboard/
│   │   │   ├── patients/      # Patient CRUD + admit/discharge
│   │   │   ├── prescriptions/ # Prescription management + PDF
│   │   │   ├── billing/       # Invoice management + print
│   │   │   └── settings/      # Clinic config, templates, users
│   │   └── api/               # 18 API route handlers
│   ├── components/
│   │   ├── ui/                # 21 shadcn/ui primitives
│   │   ├── layout/            # Sidebar, Header
│   │   ├── dashboard/         # Stats cards, Charts, Tables
│   │   └── shared/            # Patient search, Confirm dialog,
│   │                            Error boundary, Empty state,
│   │                            Loading skeletons
│   ├── lib/
│   │   ├── prisma.ts          # Database client (singleton)
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── utils.ts           # Formatting, ID generation
│   │   ├── api-utils.ts       # Standardized API responses
│   │   └── logger.ts          # Structured JSON logging
│   ├── middleware.ts           # Auth & role-based route protection
│   └── types/
│       └── next-auth.d.ts     # Session type extensions
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Local dev with PostgreSQL
└── package.json
```

**77 source files** | **9 database models** | **18 API routes** | **11 dashboard pages**

---

## Database Schema

```
User ──────────────── Prescription ──── PrescriptionItem
  │                      │
  │                      ├── PrescriptionTemplate
  │                      │
  └── Admission ──── Patient ──── Bill ──── BillItem

                     ClinicSettings (singleton)
```

**Models:** User, Patient, Prescription, PrescriptionItem, PrescriptionTemplate, Bill, BillItem, Admission, ClinicSettings

**Enums:** Role (Admin/Doctor/Receptionist), Gender, BillStatus (Pending/Paid/Partial/Cancelled), PatientType (Outpatient/Inpatient), AdmissionStatus (Admitted/Discharged/Transferred)

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

### Local Development

```bash
# Clone the repository
git clone https://github.com/pipeline-wizard/hms.git
cd hms

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Push database schema and seed sample data
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using Docker Compose

```bash
# Start PostgreSQL + App together
docker-compose up

# In another terminal, run migrations and seed
npx prisma db push
npx prisma db seed
```

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@clinicflow.com` | `admin123` |
| Doctor | `dr.sharma@clinicflow.com` | `doctor123` |
| Receptionist | `reception@clinicflow.com` | `reception123` |

> **First-time admin login** triggers the onboarding wizard to set up clinic details.

---

## Azure Deployment

### Option 1: Quick Deploy Script

```bash
chmod +x infra/deploy.sh
./infra/deploy.sh
```

The script interactively prompts for passwords and handles everything: resource group, Bicep deployment, Docker build, database migration, and app restart.

### Option 2: Manual Deployment

#### 1. Login and create resource group

```bash
az login
az group create --name clinicflow-rg --location canadacentral
```

#### 2. Deploy infrastructure with Bicep

```bash
az deployment group create \
  --resource-group clinicflow-rg \
  --template-file infra/main.bicep \
  --parameters environment=prod \
               dbAdminPassword="YourStr0ngP@ssw0rd" \
               nextAuthSecret="$(openssl rand -base64 32)"
```

This creates:
- Azure Container Registry (Basic)
- PostgreSQL Flexible Server (Burstable B1ms)
- App Service Plan (B1 Linux) + Web App

#### 3. Build and push Docker image

```bash
ACR_NAME=$(az acr list -g clinicflow-rg --query "[0].name" -o tsv)
az acr build --registry $ACR_NAME --image clinicflow:latest .
```

#### 4. Run database migrations

```bash
DB_HOST=$(az postgres flexible-server list -g clinicflow-rg \
  --query "[0].fullyQualifiedDomainName" -o tsv)

export DATABASE_URL="postgresql://clinicadmin:YourStr0ngP@ssw0rd@${DB_HOST}:5432/clinic_hms?sslmode=require"
npx prisma db push
npx prisma db seed
```

#### 5. Restart to pull new image

```bash
WEB_APP=$(az webapp list -g clinicflow-rg --query "[0].name" -o tsv)
az webapp restart -g clinicflow-rg -n $WEB_APP
```

### CI/CD with GitHub Actions

The included workflow (`.github/workflows/deploy.yml`) auto-deploys on push to `main`.

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | Service principal JSON (see below) |
| `ACR_PASSWORD` | Container registry admin password |

**Create service principal:**

```bash
az ad sp create-for-rbac \
  --name clinicflow-deploy \
  --role contributor \
  --scopes /subscriptions/{sub-id}/resourceGroups/clinicflow-rg \
  --sdk-auth
```

Copy the JSON output to GitHub Settings > Secrets > `AZURE_CREDENTIALS`.

### Estimated Monthly Cost

| Resource | SKU | Cost |
|----------|-----|------|
| Container Registry | Basic | ~$5 |
| PostgreSQL Flexible Server | Burstable B1ms | ~$13 |
| App Service Plan | B1 Linux | ~$13 |
| **Total** | | **~$31/month** |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/callback/credentials` | Public | Login |
| GET | `/api/auth/session` | Public | Get current session |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | All roles | Stats, revenue data, recent activity |

### Patients

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/patients` | All roles | List patients (search, filter, paginate) |
| POST | `/api/patients` | All roles | Create patient |
| GET | `/api/patients/:id` | All roles | Patient detail with prescriptions, bills, admissions |
| PUT | `/api/patients/:id` | All roles | Update patient |
| DELETE | `/api/patients/:id` | All roles | Delete patient |
| POST | `/api/patients/:id/admit` | All roles | Admit as inpatient |
| POST | `/api/patients/:id/discharge` | All roles | Discharge to outpatient |

### Prescriptions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/prescriptions` | Filtered* | List prescriptions |
| POST | `/api/prescriptions` | All roles | Create prescription |
| GET | `/api/prescriptions/:id` | Owner/Admin | Prescription detail |
| PUT | `/api/prescriptions/:id` | Owner/Admin | Update prescription |
| DELETE | `/api/prescriptions/:id` | Owner/Admin | Delete prescription |
| GET | `/api/prescriptions/:id/pdf` | Owner/Admin | Download PDF |

> *Doctors see only their own prescriptions unless filtering by another doctor ID.

### Billing

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/billing` | All roles | List bills (search, filter by status) |
| POST | `/api/billing` | All roles | Create itemized bill |
| GET | `/api/billing/:id` | All roles | Bill/invoice detail |
| PUT | `/api/billing/:id` | All roles | Update bill status |
| DELETE | `/api/billing/:id` | All roles | Delete bill |

### Settings & Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/PUT | `/api/settings` | All roles | Clinic settings |
| GET | `/api/settings/onboarding` | Public | Check onboarding status |
| POST | `/api/settings/onboarding` | Admin | Complete onboarding |
| GET/POST | `/api/templates` | All roles | Prescription templates |
| PUT/DELETE | `/api/templates/:id` | All roles | Manage templates |
| GET | `/api/users` | Admin only | List users |
| PUT | `/api/users` | Admin only | Update user role/status |
| GET | `/api/admissions` | All roles | List admission records |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio (port 5555) |

---

## Roadmap

- [ ] Pharmacy inventory management
- [ ] WhatsApp/Telegram prescription sending
- [ ] Appointment scheduling with reminders
- [ ] AI-powered diagnosis suggestions
- [ ] Lab report management and integration
- [ ] Multi-clinic/branch support
- [ ] Patient self-service portal
- [ ] Comprehensive audit logging
- [ ] Dark mode
- [ ] Mobile-responsive PWA

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "Add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is proprietary software. All rights reserved.

---

<p align="center">
  Built with <b>Next.js</b>, <b>TypeScript</b>, and <b>Tailwind CSS</b><br>
  Deployed on <b>Microsoft Azure</b>
</p>
