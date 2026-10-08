# BeatApp (بيتاب) — Operating System for MedSpas

**BeatApp** is a modern, lightweight, Arabic-first SaaS client-facing application built on top of **GoHighLevel (HighLevel)**. HighLevel serves as the backend CRM, communications, and automation engine, while BeatApp delivers a simple, elegant operating system tailored specifically for MedSpa clinics and their front-desk/sales teams.

---

## 🌟 Product Vision

HighLevel is powerful but complex and overwhelming for clinic receptionists, doctors, and sales reps. **BeatApp** abstracts that complexity completely:

* **HighLevel** = Engine / CRM / Source of Truth / Automation / Workflows
* **BeatApp** = Clean, modern Arabic RTL client-facing experience ("Operating system for a MedSpa")

BeatApp is **not** a generic CRM, **not** a recreation of HighLevel, and **not** a literal translation of HighLevel menus. It is a purpose-built MedSpa application.

---

## 🚀 Key Modules (MVP)

1. **Dashboard (الرئيسية)**: Action-oriented summary displaying 4 core metrics (عملاء جدد, يحتاجون متابعة, مواعيد اليوم, فرص مبيعات نشطة) alongside recent conversations, today's appointment timeline, and high-priority follow-up leads.
2. **Conversations (المحادثات)**: Modern two-column inbox (WhatsApp/SMS/Instagram) with message history, quick canned replies, channel indicators, and fast actions.
3. **Contacts (العملاء)**: Clean customer list with search, status filters, "+ إضافة عميل" modal, and comprehensive customer profiles with notes and timelines.
4. **Sales & Opportunities (المبيعات)**: Streamlined 7-stage MedSpa Kanban pipeline (عميل جديد, تم التواصل, مهتم, حجز استشارة, تم الحجز, تم البيع, غير مهتم) with stage updating synchronized directly to HighLevel.
5. **Appointments (المواعيد)**: Day, week, and month calendar views displaying patient appointments, treatments, and specialists, synchronized with HighLevel Calendars.
6. **Settings & Integration (الإعدادات والربط)**: HighLevel connection diagnostics, webhook URL configuration, and clinic metadata.

---

## 🏗️ Architecture & Technology Stack

* **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS with custom MedSpa luxury color tokens, IBM Plex Sans Arabic typography, Lucide React icons.
* **Backend**: Next.js Server & Route Handlers (`/api/*`), Zod validation, tenant scoping.
* **HighLevel Integration**: Official HighLevel API v2 (`https://services.leadconnectorhq.com`) with version header `2021-07-28`.
* **State & Development Mode**: Controlled sandbox mode (`DEMO_MODE=true`) with in-memory persistence when live HighLevel keys are pending.

---

## ⚙️ Local Setup & Running

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd beatapp
npm install
```

### 2. Configure Environment Variables
Copy the template to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your HighLevel Location credentials (or leave `DEMO_MODE=true` to explore the sandbox):
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# HighLevel Sub-account (Location)
HIGHLEVEL_LOCATION_ID=your_ghl_location_id
HIGHLEVEL_PRIVATE_TOKEN=pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
HIGHLEVEL_API_BASE_URL=https://services.leadconnectorhq.com

# Set to false once live HighLevel credentials are provided
DEMO_MODE=true
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app will open in Arabic RTL mode.

---

## 🔗 HighLevel Integration & Webhooks

### HighLevel API Endpoints Used
* **Contacts**: `GET /contacts/?locationId=...`, `POST /contacts/`, `GET /contacts/{id}`, `POST /contacts/{id}/notes`
* **Conversations**: `GET /conversations/search?locationId=...`, `GET /conversations/{id}/messages`, `POST /conversations/messages`
* **Opportunities**: `GET /opportunities/search?locationId=...`, `PUT /opportunities/{id}/status`
* **Calendars**: `GET /calendars/events?locationId=...`, `POST /calendars/events/appointments`

### Webhook Configuration
In your HighLevel Sub-account under **Automations / Workflows**, configure a Webhook trigger pointing to:
```
https://<your-domain>/api/webhooks/highlevel
```
Supported inbound events:
* Inbound and Outbound WhatsApp/SMS messages
* Contact Created / Updated
* Opportunity Stage Updated
* Appointment Created / Updated

---

## 🛡️ Multi-Tenancy & Security Strategy

1. **Strict Tenant Isolation**: All backend requests are scoped to the authenticated user's tenant Location ID. The frontend never passes or dictates an arbitrary Location ID.
2. **Zero Secrets in Browser**: HighLevel private integration tokens, API keys, and database connection strings exist exclusively server-side.
3. **HighLevel as Source of Truth**: BeatApp never creates a parallel CRM that can drift out of sync. HighLevel remains the single source of truth.

---

## 📦 Production Deployment

To build and deploy BeatApp:
```bash
npm run build
npm run start
```
Can be deployed smoothly on Vercel, AWS ECS, or any Node.js production hosting environment.
