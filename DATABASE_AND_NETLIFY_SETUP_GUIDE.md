# 🏥 Vindhya Physio & Rehab Center — Master Database & Netlify Deployment Guide
**Author:** Dr. Satyam Vishwakarma (D.P.T., B.P.T.) Physical Therapy & Rehabilitation Platform  
**Architecture:** Dual-Sync Engine — Supabase PostgreSQL Cloud Database + Google Sheets Real-Time Sync + Netlify Production Hosting

---

## 🌟 Executive Summary

Your platform now features a **dual-engine cloud database** that combines:
1. **Supabase (PostgreSQL Cloud Database)**: The world's #1 modern open-source database. It provides high performance, instant real-time queries, automatic REST APIs, and 100% serverless client-side connectivity that works flawlessly on **Netlify**, laptops, tablets, and smartphones without needing any backend server!
2. **Google Sheets (Google Apps Script Webhook)**: Real-time dual sync so you can view, edit, and share live spreadsheet backups at any time.
3. **Interactive Clinical Attendance Calendar**:
   - **Total Visits Count**: Tracks how many rehabilitation sessions have been completed.
   - **Visited Days**: Highlights attended days on the calendar grid with clear checkmarks and diagnosis tags.
   - **Missing Days**: Detects missed therapy sessions during the rehabilitation course to alert the doctor and patient.
   - **Blinking Next Follow-Up**: Eye-catching pulsating beacon alert on the next recommended follow-up date with live countdowns (*"Today!"*, *"Tomorrow"*, *"In 3 Days"*).
   - **Drill-Down View**: Clicking any date immediately displays next follow-up instructions, WhatsApp confirmation CTA, and the patient's **complete chronological history of old/prior visits** with treatment notes and official receipts.

---

## 🚀 Part 1: How to Set Up Supabase Database (Free in 2 Minutes)

Supabase provides a generous **100% Free Forever Tier** with full PostgreSQL database hosting.

### Step 1: Create Your Supabase Account & Project
1. Open [https://supabase.com](https://supabase.com) in your web browser.
2. Click **Start your project** (Sign in with GitHub or your Google account).
3. Click **New Project** and enter:
   - **Name:** `vindhya-physio-db` (or any name you like)
   - **Database Password:** Enter a strong password (e.g. `VindhyPhysio2026!`) and note it down safely.
   - **Region:** Choose **India (Mumbai)** (or the closest region for ultra-fast local speeds).
   - **Pricing Plan:** **Free Tier ($0/month)**.
4. Click **Create new project**. Supabase will provision your PostgreSQL database in about 1–2 minutes.

---

## 🔑 Part 2: How to Get Your API Keys from Supabase

Once your project is created:
1. In the Supabase Dashboard, look at the left sidebar and click the **Project Settings** (gear icon ⚙️) at the bottom.
2. Click **API** under Configuration.
3. You will see two essential credentials:
   - **Project URL:** Looks like `https://abcdefghijklmnop.supabase.co`
   - **Project API keys -> anon (public):** A long key starting with `eyJhbGciOiJIUzI1NiIsInR5cCI...` or `sb_publishable_...`
4. Copy both of these values!

---

## 📜 Part 3: Run the 1-Click SQL Schema in Supabase

This creates all required tables (`patients`, `visits`, `enquiries`, `clinic_settings`) and indexes:

1. In your Supabase Dashboard, click **SQL Editor** in the left sidebar menu (terminal icon `>_`).
2. Click **New query** (or the **+** button).
3. Paste the following complete SQL script and click the green **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`):

```sql
-- =============================================================================
-- VINDHYA PHYSIO & REHAB CENTER — MASTER SUPABASE POSTGRESQL SCHEMA
-- Dr. Satyam Vishwakarma (D.P.T., B.P.T.) | Clinic Database & Patient Records
-- =============================================================================

-- 1. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
  patient_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER DEFAULT 0,
  gender TEXT DEFAULT 'Male',
  phone TEXT NOT NULL,
  alt_phone TEXT,
  address TEXT,
  dob TEXT,
  emergency_contact TEXT,
  first_visit_reason TEXT,
  complaint TEXT,
  duration TEXT,
  registration_date TEXT,
  intake_time TEXT,
  status TEXT DEFAULT 'Active',
  total_visits INTEGER DEFAULT 0,
  last_visit_date TEXT,
  follow_up_date TEXT,
  follow_up_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_reg_date ON patients(registration_date);

-- 2. VISITS TABLE
CREATE TABLE IF NOT EXISTS visits (
  visit_id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  patient_name TEXT,
  phone TEXT,
  visit_number INTEGER DEFAULT 1,
  date TEXT NOT NULL,
  time TEXT,
  reason TEXT,
  complaint TEXT,
  duration TEXT,
  diagnosis TEXT,
  treatment_notes TEXT,
  modalities TEXT,
  fee TEXT DEFAULT '₹500',
  follow_up_date TEXT,
  follow_up_time TEXT,
  status TEXT DEFAULT 'Completed',
  doctor TEXT DEFAULT 'Dr. Satyam Vishwakarma',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);
CREATE INDEX IF NOT EXISTS idx_visits_followup ON visits(follow_up_date);

-- 3. ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS enquiries (
  enquiry_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT,
  message TEXT,
  date TEXT,
  time TEXT,
  status TEXT DEFAULT 'Pending',
  linked_patient_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLINIC SETTINGS TABLE
CREATE TABLE IF NOT EXISTS clinic_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES FOR CLIENT ACCESS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon all patients') THEN
    CREATE POLICY "Allow anon all patients" ON patients FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon all visits') THEN
    CREATE POLICY "Allow anon all visits" ON visits FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon all enquiries') THEN
    CREATE POLICY "Allow anon all enquiries" ON enquiries FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon all clinic_settings') THEN
    CREATE POLICY "Allow anon all clinic_settings" ON clinic_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
```

You will see `Success. No rows returned`. That's it! Your tables are ready.

---

## 💻 Part 4: Connecting the Database in the Website

You have two simple ways to connect your database:

### Option A: Direct Connection from Doctor Portal Settings (Zero Code!)
1. Open your website and log into the **Doctor Portal**.
2. Click the **Settings** tab.
3. Scroll to the **🗄️ Supabase PostgreSQL Database** card.
4. Paste your **Supabase Project URL** into the first box.
5. Paste your **Supabase Anon Public API Key** into the second box.
6. Click **💾 Save Supabase Credentials**.
7. Click **⚡ Test Database Connection** — you will see a green confirmation badge: `✅ Successfully connected to PostgreSQL!`.
8. Click **🔄 Sync All Records to Supabase** to immediately upload all existing patients and visits into your new database!

### Option B: Via Local `.env` File (For Local Development)
Add the keys to your project's `.env` file:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🌐 Part 5: Deploying on Netlify (Step-by-Step)

The project is already pre-configured with `netlify.toml` for 1-click deployments.

### Step 1: Push Code to GitHub
Ensure all code is committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Add Supabase PostgreSQL database and interactive clinical calendar"
git push origin main
```

### Step 2: Connect to Netlify
1. Log in to [https://netlify.com](https://netlify.com).
2. Click **Add new site** &rarr; **Import an existing project**.
3. Select **GitHub** and authorize Netlify to access your repository.
4. Select `satyamvishwakarmawebsite` (or your repo name).

### Step 3: Configure Build Settings
Netlify will automatically detect settings from `netlify.toml`:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

### Step 4: Add Environment Variables in Netlify
Before deploying, click **Add environment variables** (or go to **Site configuration &rarr; Environment variables**):

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` | Supabase Cloud Database URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase Public Anon API Key |
| `VITE_GOOGLE_SHEETS_WEBHOOK_URL` | Your Apps Script Webhook URL | Google Sheets Sync |
| `DOCTOR_EMAIL` | `shivamupsc8@gmail.com` | Doctor login identity |

### Step 5: Click Deploy Site
Netlify will run the build and publish your high-performance static React site with custom SSL and lightning-fast worldwide CDN!

---

## 📅 Part 6: How the Calendar & Attendance Feature Works

### 1. In Doctor Portal:
- Navigate to **Patients** &rarr; Click on any patient &rarr; Click **Profile & Records**.
- The patient profile modal opens with the **📅 Visit Calendar** active by default!
- The calendar shows:
  - **Total Completed Visits**: Number of treatment sessions completed.
  - **Attendance Record**: Distinct attended calendar days.
  - **Missed Sessions**: Gaps during the patient's prescribed course where a scheduled session was missed.
  - **Next Follow-Up**: Eye-catching pulsating **blinking alert** on the upcoming scheduled date with countdown badge (*"Today!"*, *"Tomorrow"*, *"In 2 Days"*).
  - **Selected Date Drill-Down**: Shows clinical record, diagnosis, treatments, modalities, doctor notes, and a 1-click button to view/print the official receipt.
  - **Complete Old Visits History**: Lists every previous visit for this patient so the doctor can review the whole timeline at a glance.

### 2. In Patient Portal:
- When a patient signs in, their **Dashboard** prominently features their **📅 My Rehabilitation Calendar & Attendance** card!
- Patients can see:
  - When they visited and which days they attended (green badges).
  - Which days they missed during their therapy plan (amber warning badges).
  - When their **Next Follow-Up** is scheduled (blinking pulsating beacon).
  - A 1-click **Confirm on WhatsApp** button to message Dr. Satyam directly.
  - Clicking any date expands the full clinical record and their earlier past visits!

---

## ✅ Verification Checklist

- [x] `@supabase/supabase-js` installed and integrated.
- [x] `src/supabaseClient.js` client created with bidirectional camelCase <-> snake_case row mappers.
- [x] Dual-sync engine in `src/apiService.js` updating both Supabase PostgreSQL and Google Sheets in parallel.
- [x] Doctor Portal Settings equipped with Supabase credential inputs, live test connection, and full sync buttons.
- [x] 1-Click SQL Schema modal built into the Doctor Portal.
- [x] `PatientVisitCalendar.jsx` enhanced with metrics ribbon, attended days, missed sessions detection, blinking next follow-up alert, and complete old visits timeline in drill-down.
- [x] Interactive calendar embedded directly in both the Patient Portal Dashboard and the Doctor Portal Patient Profile modal.
- [x] `netlify.toml` configured for SPA routing, security headers, and asset caching.
- [x] Production build passes cleanly with 0 errors (`npm run build`).
