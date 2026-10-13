// =============================================================================
// VINDHYA PHYSIO & REHAB CENTER — MASTER SUPABASE POSTGRESQL DATABASE CLIENT
// Dr. Satyam Vishwakarma (PT) • Dual-Sync Engine with Google Sheets & Netlify
// =============================================================================

import { createClient } from "@supabase/supabase-js";

// Storage Keys for Custom Supabase Credentials entered in Doctor Portal Settings
export const SUPABASE_KEYS = {
  URL: "vindhy_supabase_url",
  ANON_KEY: "vindhy_supabase_anon_key",
  STATUS: "vindhy_supabase_status"
};

// Ready-to-execute PostgreSQL Schema to create all tables in Supabase SQL Editor
export const SUPABASE_SCHEMA_SQL = `-- =============================================================================
-- VINDHYA PHYSIO & REHAB CENTER — MASTER DATABASE TABLES & SCHEMA
-- Run this in your Supabase SQL Editor (supabase.com -> Project -> SQL Editor)
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

-- 5. ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ANON POLICIES
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- Allow anon public read/write access via your Supabase Anon API Key
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
`;

export function getSupabaseSchemaSql() {
  return SUPABASE_SCHEMA_SQL;
}

let cachedClient = null;
let lastUsedUrl = "";
let lastUsedKey = "";

/**
 * Get active Supabase configuration (from localStorage or Vite .env)
 */
export function getSupabaseConfig() {
  const localUrl = typeof window !== "undefined" ? localStorage.getItem(SUPABASE_KEYS.URL) : null;
  const localKey = typeof window !== "undefined" ? localStorage.getItem(SUPABASE_KEYS.ANON_KEY) : null;

  const envUrl = typeof import.meta !== "undefined" && import.meta.env ? (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL) : null;
  const envKey = typeof import.meta !== "undefined" && import.meta.env ? (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY) : null;

  const url = (localUrl && localUrl.trim()) || (envUrl && envUrl.trim()) || "";
  const anonKey = (localKey && localKey.trim()) || (envKey && envKey.trim()) || "";

  return {
    url,
    anonKey,
    isConfigured: !!(url && anonKey && url.startsWith("http"))
  };
}

/**
 * Save custom Supabase credentials from Doctor Portal Settings UI
 */
export function setSupabaseConfig(url, anonKey) {
  if (typeof window === "undefined") return;

  if (url && url.trim()) {
    localStorage.setItem(SUPABASE_KEYS.URL, url.trim());
  } else {
    localStorage.removeItem(SUPABASE_KEYS.URL);
  }

  if (anonKey && anonKey.trim()) {
    localStorage.setItem(SUPABASE_KEYS.ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(SUPABASE_KEYS.ANON_KEY);
  }

  // Invalidate cached client to recreate on next request
  cachedClient = null;
  lastUsedUrl = "";
  lastUsedKey = "";
}

/**
 * Get or initialize the Supabase client instance
 */
export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (cachedClient && lastUsedUrl === config.url && lastUsedKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    lastUsedUrl = config.url;
    lastUsedKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}

export function isSupabaseConnected() {
  return !!getSupabaseClient();
}

/**
 * Test live connection to Supabase database
 */
export async function testSupabaseConnection(customUrl = null, customKey = null) {
  let clientToTest = null;
  if (customUrl && customKey) {
    try {
      clientToTest = createClient(customUrl.trim(), customKey.trim(), {
        auth: { persistSession: false }
      });
    } catch (e) {
      return { ok: false, message: `Configuration error: ${e.message}` };
    }
  } else {
    clientToTest = getSupabaseClient();
  }

  if (!clientToTest) {
    return {
      ok: false,
      message: "Supabase is not configured yet. Please enter your Project URL and Anon Key."
    };
  }

  try {
    // 1. Test pinging the 'patients' table
    const { data, error, count } = await clientToTest
      .from("patients")
      .select("patient_id", { count: "exact", head: true });

    if (error) {
      // Check if table does not exist
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return {
          ok: false,
          needsSchema: true,
          message: "Connected to Supabase project, but tables are not created yet! Click 'Copy SQL Schema' and run it in your Supabase SQL Editor."
        };
      }
      return {
        ok: false,
        message: `Database connection error (${error.code || "ERR"}): ${error.message}`
      };
    }

    // 2. Also check visits table count
    let visitsCount = 0;
    try {
      const vRes = await clientToTest.from("visits").select("visit_id", { count: "exact", head: true });
      if (!vRes.error) visitsCount = vRes.count || 0;
    } catch (_) {}

    return {
      ok: true,
      message: `Successfully connected to PostgreSQL! Found ${count || 0} patients and ${visitsCount} visits in Supabase database.`,
      patientCount: count || 0,
      visitCount: visitsCount
    };
  } catch (err) {
    return {
      ok: false,
      message: `Network or connection failure: ${err.message || "Failed to reach Supabase"}`
    };
  }
}

// =============================================================================
// ROW MAPPERS (CamelCase <-> Snake_Case)
// =============================================================================

export function patientToRow(p) {
  if (!p) return null;
  return {
    patient_id: p.patientId || p.patient_id,
    name: p.name || "",
    age: Number(p.age) || 0,
    gender: p.gender || "Male",
    phone: String(p.phone || "").trim(),
    alt_phone: p.altPhone || p.alt_phone || "",
    address: p.address || "",
    dob: p.dob || "",
    emergency_contact: p.emergencyContact || p.emergency_contact || "",
    first_visit_reason: p.firstVisitReason || p.first_visit_reason || p.reasonForVisit || "",
    complaint: p.complaint || "",
    duration: p.duration || "",
    registration_date: p.registrationDate || p.registration_date || new Date().toISOString().split("T")[0],
    intake_time: p.intakeTime || p.intake_time || "",
    status: p.status || "Active",
    total_visits: Number(p.totalVisits || p.total_visits || 0),
    last_visit_date: p.lastVisitDate || p.last_visit_date || "",
    follow_up_date: p.followUpDate || p.follow_up_date || "",
    follow_up_time: p.followUpTime || p.follow_up_time || "",
    updated_at: new Date().toISOString()
  };
}

export function rowToPatient(r) {
  if (!r) return null;
  return {
    patientId: r.patient_id || r.patientId,
    name: r.name || "",
    age: Number(r.age) || 0,
    gender: r.gender || "Male",
    phone: r.phone || "",
    altPhone: r.alt_phone || r.altPhone || "",
    address: r.address || "",
    dob: r.dob || "",
    emergencyContact: r.emergency_contact || r.emergencyContact || "",
    firstVisitReason: r.first_visit_reason || r.firstVisitReason || "Physiotherapy Rehabilitation",
    complaint: r.complaint || "",
    duration: r.duration || "",
    registrationDate: r.registration_date || r.registrationDate || "",
    intakeTime: r.intake_time || r.intakeTime || "",
    status: r.status || "Active",
    totalVisits: Number(r.total_visits !== undefined ? r.total_visits : (r.totalVisits || 0)),
    lastVisitDate: r.last_visit_date || r.lastVisitDate || "",
    followUpDate: r.follow_up_date || r.followUpDate || "",
    followUpTime: r.follow_up_time || r.followUpTime || "",
    createdAt: r.created_at || r.createdAt
  };
}

export function visitToRow(v) {
  if (!v) return null;
  return {
    visit_id: v.visitId || v.visit_id,
    patient_id: v.patientId || v.patient_id,
    patient_name: v.patientName || v.patient_name || "",
    phone: String(v.phone || "").trim(),
    visit_number: Number(v.visitNumber || v.visit_number || 1),
    date: v.date || new Date().toISOString().split("T")[0],
    time: v.time || "",
    reason: v.reason || "",
    complaint: v.complaint || "",
    duration: v.duration || "",
    diagnosis: v.diagnosis || "",
    treatment_notes: v.treatmentNotes || v.treatment_notes || v.treatment || "",
    modalities: v.modalities || "",
    fee: v.fee || "₹500",
    follow_up_date: v.followUpDate || v.follow_up_date || "",
    follow_up_time: v.followUpTime || v.follow_up_time || "",
    status: v.status || "Completed",
    doctor: v.doctor || "Dr. Satyam Vishwakarma",
    updated_at: new Date().toISOString()
  };
}

export function rowToVisit(r) {
  if (!r) return null;
  return {
    visitId: r.visit_id || r.visitId,
    patientId: r.patient_id || r.patientId,
    patientName: r.patient_name || r.patientName || "",
    phone: r.phone || "",
    visitNumber: Number(r.visit_number !== undefined ? r.visit_number : (r.visitNumber || 1)),
    date: r.date || "",
    time: r.time || "",
    reason: r.reason || "",
    complaint: r.complaint || "",
    duration: r.duration || "",
    diagnosis: r.diagnosis || "",
    treatmentNotes: r.treatment_notes || r.treatmentNotes || "",
    treatment: r.treatment_notes || r.treatment || "",
    modalities: r.modalities || "",
    fee: r.fee || "₹500",
    followUpDate: r.follow_up_date || r.followUpDate || "",
    followUpTime: r.follow_up_time || r.followUpTime || "",
    status: r.status || "Completed",
    doctor: r.doctor || "Dr. Satyam Vishwakarma",
    createdAt: r.created_at || r.createdAt
  };
}

export function enquiryToRow(e) {
  if (!e) return null;
  return {
    enquiry_id: e.enquiryId || e.enquiry_id || e.id,
    name: e.name || "",
    phone: String(e.phone || "").trim(),
    service: e.service || e.treatment || "",
    message: e.message || e.notes || "",
    date: e.date || new Date().toISOString().split("T")[0],
    time: e.time || "",
    status: e.status || "Pending",
    linked_patient_id: e.linkedPatientId || e.linked_patient_id || null,
    updated_at: new Date().toISOString()
  };
}

export function rowToEnquiry(r) {
  if (!r) return null;
  return {
    enquiryId: r.enquiry_id || r.enquiryId,
    name: r.name || "",
    phone: r.phone || "",
    service: r.service || "",
    treatment: r.service || "",
    message: r.message || "",
    date: r.date || "",
    time: r.time || "",
    status: r.status || "Pending",
    linkedPatientId: r.linked_patient_id || r.linkedPatientId || null,
    createdAt: r.created_at || r.createdAt
  };
}

// =============================================================================
// DATABASE CRUD OPERATIONS
// =============================================================================

export async function supabaseGetPatients() {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(rowToPatient);
  } catch (err) {
    console.warn("supabaseGetPatients error:", err);
    return null;
  }
}

export async function supabaseUpsertPatient(patient) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const row = patientToRow(patient);
    const { data, error } = await sb
      .from("patients")
      .upsert(row, { onConflict: "patient_id" })
      .select()
      .single();

    if (error) throw error;
    return rowToPatient(data);
  } catch (err) {
    console.warn("supabaseUpsertPatient error:", err);
    return null;
  }
}

export async function supabaseDeletePatient(patientId) {
  const sb = getSupabaseClient();
  if (!sb) return false;

  try {
    const { error } = await sb
      .from("patients")
      .delete()
      .eq("patient_id", patientId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("supabaseDeletePatient error:", err);
    return false;
  }
}

export async function supabaseGetVisits(patientId = null) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    let query = sb.from("visits").select("*").order("date", { ascending: false });
    if (patientId) {
      query = query.eq("patient_id", patientId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(rowToVisit);
  } catch (err) {
    console.warn("supabaseGetVisits error:", err);
    return null;
  }
}

export async function supabaseUpsertVisit(visit) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const row = visitToRow(visit);
    const { data, error } = await sb
      .from("visits")
      .upsert(row, { onConflict: "visit_id" })
      .select()
      .single();

    if (error) throw error;
    return rowToVisit(data);
  } catch (err) {
    console.warn("supabaseUpsertVisit error:", err);
    return null;
  }
}

export async function supabaseDeleteVisit(visitId) {
  const sb = getSupabaseClient();
  if (!sb) return false;

  try {
    const { error } = await sb
      .from("visits")
      .delete()
      .eq("visit_id", visitId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("supabaseDeleteVisit error:", err);
    return false;
  }
}

export async function supabaseGetEnquiries() {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(rowToEnquiry);
  } catch (err) {
    console.warn("supabaseGetEnquiries error:", err);
    return null;
  }
}

export async function supabaseUpsertEnquiry(enquiry) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const row = enquiryToRow(enquiry);
    const { data, error } = await sb
      .from("enquiries")
      .upsert(row, { onConflict: "enquiry_id" })
      .select()
      .single();

    if (error) throw error;
    return rowToEnquiry(data);
  } catch (err) {
    console.warn("supabaseUpsertEnquiry error:", err);
    return null;
  }
}

/**
 * Push all local records to Supabase (Full Database Migration / Sync)
 */
export async function supabasePushAllData(patients = [], visits = [], enquiries = []) {
  const sb = getSupabaseClient();
  if (!sb) {
    throw new Error("Supabase is not configured yet. Please configure URL and Anon Key first.");
  }

  const results = {
    patientsCount: 0,
    visitsCount: 0,
    enquiriesCount: 0
  };

  // 1. Push patients
  if (patients && patients.length > 0) {
    const patientRows = patients.map(patientToRow).filter(Boolean);
    const { error: pErr } = await sb
      .from("patients")
      .upsert(patientRows, { onConflict: "patient_id" });

    if (pErr) throw new Error(`Patients sync failed: ${pErr.message}`);
    results.patientsCount = patientRows.length;
  }

  // 2. Push visits
  if (visits && visits.length > 0) {
    const visitRows = visits.map(visitToRow).filter(Boolean);
    const { error: vErr } = await sb
      .from("visits")
      .upsert(visitRows, { onConflict: "visit_id" });

    if (vErr) throw new Error(`Visits sync failed: ${vErr.message}`);
    results.visitsCount = visitRows.length;
  }

  // 3. Push enquiries
  if (enquiries && enquiries.length > 0) {
    const enquiryRows = enquiries.map(enquiryToRow).filter(Boolean);
    const { error: eErr } = await sb
      .from("enquiries")
      .upsert(enquiryRows, { onConflict: "enquiry_id" });

    if (eErr) throw new Error(`Enquiries sync failed: ${eErr.message}`);
    results.enquiriesCount = enquiryRows.length;
  }

  return results;
}

/**
 * Pull all records from Supabase into local app
 */
export async function supabasePullAllData() {
  const sb = getSupabaseClient();
  if (!sb) {
    throw new Error("Supabase is not configured.");
  }

  const [pRes, vRes, eRes] = await Promise.all([
    sb.from("patients").select("*").order("created_at", { ascending: false }),
    sb.from("visits").select("*").order("date", { ascending: false }),
    sb.from("enquiries").select("*").order("created_at", { ascending: false })
  ]);

  if (pRes.error) throw new Error(`Patients pull error: ${pRes.error.message}`);
  if (vRes.error) throw new Error(`Visits pull error: ${vRes.error.message}`);

  return {
    patients: (pRes.data || []).map(rowToPatient),
    visits: (vRes.data || []).map(rowToVisit),
    enquiries: (eRes.data || []).map(rowToEnquiry)
  };
}
