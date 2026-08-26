import cors from "cors";
import express from "express";
import helmet from "helmet";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");
const assessmentFile = path.join(dataDir, "assessments.json");
const appointmentFile = path.join(dataDir, "appointments.json");
const enquiriesFile = path.join(dataDir, "enquiries.json");
const patientsFile = path.join(dataDir, "patients.json");
const visitsFile = path.join(dataDir, "visits.json");
const authFile = path.join(dataDir, "auth.json");

const port = process.env.PORT || 5174;
const host = process.env.HOST || "127.0.0.1";
const JWT_SECRET = process.env.JWT_SECRET || "vindhya-physio-jwt-secret-secure-2026";
const AUTHORIZED_DOCTOR_EMAIL = process.env.DOCTOR_EMAIL || "shivamupsc8@gmail.com";
const INITIAL_DOCTOR_PASSWORD = process.env.INITIAL_DOCTOR_PASSWORD || "@Shivam0000";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "6mb" }));

// File storage helpers
async function ensureDataFile(file, defaultData = []) {
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw);
  } catch {
    await writeFile(file, JSON.stringify(defaultData, null, 2), "utf8");
    return defaultData;
  }
}

async function writeDataFile(file, data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

// Initialise auth
async function initAuth() {
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(authFile, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed.email !== AUTHORIZED_DOCTOR_EMAIL) {
      parsed.email = AUTHORIZED_DOCTOR_EMAIL;
      await writeDataFile(authFile, parsed);
    }
    return parsed;
  } catch {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(INITIAL_DOCTOR_PASSWORD, salt);
    const defaultAuth = {
      email: AUTHORIZED_DOCTOR_EMAIL,
      passwordHash: hash,
      isTemporaryPassword: true,
      lastPasswordChange: new Date().toISOString(),
      resetTokens: {}
    };
    await writeFile(authFile, JSON.stringify(defaultAuth, null, 2), "utf8");
    return defaultAuth;
  }
}

// Patient ID Generator: VPR-0001, VPR-0002...
async function generateNextPatientId() {
  const patients = await ensureDataFile(patientsFile, []);
  let maxNum = 0;
  for (const p of patients) {
    if (p.patientId && p.patientId.startsWith("VPR-")) {
      const num = parseInt(p.patientId.replace("VPR-", ""), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `VPR-${String(nextNum).padStart(4, "0")}`;
}

// Google Sheets Sync & Bidirectional Restore Service
async function syncToGoogleSheets(type, payload) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return { synced: false, status: "pending", reason: "GOOGLE_SHEETS_WEBHOOK_URL not configured" };
  }
  try {
    let action = "sync_patient";
    if (type === "visit") action = "sync_visit";
    if (type === "enquiry") action = "sync_enquiry";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        authorizedAccount: AUTHORIZED_DOCTOR_EMAIL,
        timestamp: new Date().toISOString(),
        data: payload
      })
    });
    if (response.ok) {
      return { synced: true, status: "synced" };
    }
    return { synced: false, status: "error", error: await response.text() };
  } catch (err) {
    return { synced: false, status: "pending", error: err.message };
  }
}

// Restore & Pull All Records from Google Sheets into Website Database
async function pullFromGoogleSheets() {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return { ok: false, error: "GOOGLE_SHEETS_WEBHOOK_URL not configured" };
  }
  try {
    const fetchUrl = webhookUrl.includes("?")
      ? `${webhookUrl}&action=fetchAll`
      : `${webhookUrl}?action=fetchAll`;

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Google Sheets responded with HTTP ${response.status}`);
    }
    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || "Failed to fetch sheets data");
    }

    const { patients: remotePatients = [], visits: remoteVisits = [], enquiries: remoteEnquiries = [] } = result;

    const localPatients = await ensureDataFile(patientsFile, []);
    const localVisits = await ensureDataFile(visitsFile, []);
    const localEnquiries = await ensureDataFile(enquiriesFile, []);

    // Merge Patients by patientId
    const patientMap = new Map();
    localPatients.forEach(p => patientMap.set(p.patientId, p));
    remotePatients.forEach(rp => {
      if (rp.patientId) {
        const existing = patientMap.get(rp.patientId);
        patientMap.set(rp.patientId, {
          ...(existing || {}),
          ...rp,
          syncStatus: "synced"
        });
      }
    });
    const mergedPatients = Array.from(patientMap.values());

    // Merge Visits by visitId
    const visitMap = new Map();
    localVisits.forEach(v => visitMap.set(v.visitId, v));
    remoteVisits.forEach(rv => {
      if (rv.visitId) {
        const existing = visitMap.get(rv.visitId);
        visitMap.set(rv.visitId, {
          ...(existing || {}),
          ...rv,
          syncStatus: "synced"
        });
      }
    });
    const mergedVisits = Array.from(visitMap.values());

    // Merge Enquiries by ID or Phone+Date
    const enquiryMap = new Map();
    localEnquiries.forEach(e => enquiryMap.set(e.id || `${e.phone}_${e.date}`, e));
    remoteEnquiries.forEach(re => {
      const key = re.id || `${re.phone}_${re.date}`;
      const existing = enquiryMap.get(key);
      enquiryMap.set(key, {
        ...(existing || {}),
        ...re,
        syncStatus: "synced"
      });
    });
    const mergedEnquiries = Array.from(enquiryMap.values());

    // Recalculate each patient's accurate total visits and last visit date
    mergedPatients.forEach(patient => {
      const patientVisits = mergedVisits
        .filter(v => v.patientId === patient.patientId)
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      
      patient.totalVisits = Math.max(patient.totalVisits || 1, patientVisits.length);
      if (patientVisits.length > 0 && patientVisits[0].date) {
        patient.lastVisitDate = patientVisits[0].date;
      }
    });

    await writeDataFile(patientsFile, mergedPatients);
    await writeDataFile(visitsFile, mergedVisits);
    await writeDataFile(enquiriesFile, mergedEnquiries);

    return {
      ok: true,
      patientsCount: mergedPatients.length,
      visitsCount: mergedVisits.length,
      enquiriesCount: mergedEnquiries.length,
      message: `Successfully restored ${mergedPatients.length} patients, ${mergedVisits.length} visits, and ${mergedEnquiries.length} enquiries from Google Sheets!`
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Middleware: Authentication Guard
function requireDoctorAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Doctor authentication required." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.doctor = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired or invalid token. Please log in again." });
  }
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const auth = await initAuth();
    const cleanEmail = String(email).trim().toLowerCase();
    const expectedEmail = String(auth.email).trim().toLowerCase();

    if (cleanEmail !== expectedEmail) {
      return res.status(401).json({ error: "Invalid doctor credentials." });
    }

    const valid = await bcrypt.compare(password, auth.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid doctor credentials." });
    }

    const token = jwt.sign(
      { email: auth.email, role: "lead_doctor", name: "Dr. Satyam Vishwakarma" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      ok: true,
      token,
      doctor: {
        email: auth.email,
        name: "Dr. Satyam Vishwakarma",
        title: "Consultant Physiotherapist",
        clinic: "Vindhya Physio & Rehab Center",
        isTemporaryPassword: !!auth.isTemporaryPassword
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Authentication service error." });
  }
});

app.get("/api/auth/me", requireDoctorAuth, async (req, res) => {
  const auth = await initAuth();
  res.json({
    ok: true,
    doctor: {
      email: auth.email,
      name: "Dr. Satyam Vishwakarma",
      title: "Consultant Physiotherapist",
      clinic: "Vindhya Physio & Rehab Center",
      isTemporaryPassword: !!auth.isTemporaryPassword
    }
  });
});

app.post("/api/auth/change-password", requireDoctorAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }

    const auth = await initAuth();
    const valid = await bcrypt.compare(currentPassword, auth.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    auth.passwordHash = await bcrypt.hash(newPassword, salt);
    auth.isTemporaryPassword = false;
    auth.lastPasswordChange = new Date().toISOString();
    await writeDataFile(authFile, auth);

    res.json({ ok: true, message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Could not update password." });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const auth = await initAuth();

    if (cleanEmail !== auth.email.toLowerCase()) {
      return res.status(404).json({ error: `Doctor email '${cleanEmail}' not recognized.` });
    }

    const resetToken = crypto.randomUUID().slice(0, 8).toUpperCase();
    if (!auth.resetTokens) auth.resetTokens = {};
    auth.resetTokens[resetToken] = {
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000
    };
    await writeDataFile(authFile, auth);

    res.json({
      ok: true,
      message: `Password reset token generated for ${auth.email}.`,
      resetToken,
      expiresInMinutes: 15
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to initiate password reset." });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Valid reset token and new password (min 6 chars) required." });
    }

    const auth = await initAuth();
    if (String(email).trim().toLowerCase() !== auth.email.toLowerCase()) {
      return res.status(400).json({ error: "Invalid doctor email." });
    }

    const record = auth.resetTokens && auth.resetTokens[resetToken.trim()];
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const salt = await bcrypt.genSalt(10);
    auth.passwordHash = await bcrypt.hash(newPassword, salt);
    auth.isTemporaryPassword = false;
    delete auth.resetTokens[resetToken.trim()];
    await writeDataFile(authFile, auth);

    res.json({ ok: true, message: "Password reset successful. You may now log in." });
  } catch (err) {
    res.status(500).json({ error: "Password reset failed." });
  }
});

// ==========================================
// 2. CLINIC & DOCTOR APIS
// ==========================================

app.get("/api/doctor/stats", requireDoctorAuth, async (req, res) => {
  try {
    const patients = await ensureDataFile(patientsFile, []);
    const visits = await ensureDataFile(visitsFile, []);
    const enquiries = await ensureDataFile(enquiriesFile, []);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayVisits = visits.filter(v => v.date === todayStr);

    const pendingPatients = patients.filter(p => p.syncStatus === "pending").length;
    const pendingVisits = visits.filter(v => v.syncStatus === "pending").length;
    const pendingEnquiries = enquiries.filter(e => e.syncStatus === "pending").length;

    res.json({
      ok: true,
      stats: {
        totalPatients: patients.length,
        todayVisitsCount: todayVisits.length,
        newPatientsCount: patients.filter(p => p.registrationDate === todayStr).length,
        totalVisitsCount: visits.length,
        totalEnquiriesCount: enquiries.length,
        newEnquiriesCount: enquiries.filter(e => e.status === "New" || !e.status).length,
        syncStatus: (pendingPatients + pendingVisits + pendingEnquiries === 0) ? "Connected" : "Sync Pending",
        pendingSyncCount: pendingPatients + pendingVisits + pendingEnquiries,
        authorizedAccount: AUTHORIZED_DOCTOR_EMAIL
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Could not retrieve statistics." });
  }
});

app.get("/api/doctor/patients", requireDoctorAuth, async (req, res) => {
  try {
    const query = String(req.query.search || "").trim().toLowerCase();
    const patients = await ensureDataFile(patientsFile, []);
    const visits = await ensureDataFile(visitsFile, []);

    let results = patients.map(patient => {
      const patientVisits = visits.filter(v => v.patientId === patient.patientId);
      const sortedVisits = patientVisits.sort((a, b) => new Date(b.date + " " + (b.time || "00:00")) - new Date(a.date + " " + (a.time || "00:00")));
      return {
        ...patient,
        totalVisits: patientVisits.length || 1,
        lastVisitDate: sortedVisits[0]?.date || patient.registrationDate
      };
    });

    if (query) {
      results = results.filter(p =>
        (p.patientId && p.patientId.toLowerCase().includes(query)) ||
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.phone && p.phone.includes(query))
      );
    }

    res.json({ ok: true, patients: results });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patients list." });
  }
});

app.get("/api/doctor/patients/:id", requireDoctorAuth, async (req, res) => {
  try {
    const patientId = req.params.id;
    const patients = await ensureDataFile(patientsFile, []);
    const visits = await ensureDataFile(visitsFile, []);

    const patient = patients.find(p => p.patientId === patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found." });
    }

    const patientVisits = visits
      .filter(v => v.patientId === patientId)
      .sort((a, b) => a.visitNumber - b.visitNumber);

    res.json({
      ok: true,
      patient: {
        ...patient,
        totalVisits: patientVisits.length,
        lastVisitDate: patientVisits[patientVisits.length - 1]?.date || patient.registrationDate
      },
      visits: patientVisits
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load patient profile." });
  }
});

app.post("/api/doctor/patients", requireDoctorAuth, async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      phone,
      altPhone,
      address,
      dob,
      emergencyContact,
      reasonForVisit,
      complaint,
      diagnosis,
      referredBy,
      visitDate,
      visitTime,
      treatmentNotes,
      followUpDate,
      status
    } = req.body;

    if (!name || !phone || !age || !gender) {
      return res.status(400).json({ error: "Name, age, gender, and phone number are required." });
    }

    const patients = await ensureDataFile(patientsFile, []);
    const visits = await ensureDataFile(visitsFile, []);

    const patientId = await generateNextPatientId();
    const todayStr = (visitDate || new Date().toISOString().slice(0, 10)).trim();
    const timeStr = (visitTime || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })).trim();

    const newPatient = {
      patientId,
      registrationDate: todayStr,
      name: name.trim(),
      age: String(age).trim(),
      gender: String(gender).trim(),
      phone: String(phone).trim(),
      altPhone: String(altPhone || "").trim(),
      address: String(address || "Vindhyachal, Mirzapur").trim(),
      dob: String(dob || "").trim(),
      emergencyContact: String(emergencyContact || "").trim(),
      firstVisitReason: String(reasonForVisit || complaint || "Initial Assessment").trim(),
      status: status || "Completed",
      totalVisits: 1,
      lastVisitDate: todayStr,
      syncStatus: "pending",
      createdAt: new Date().toISOString()
    };

    const firstVisit = {
      visitId: `VIS-${patientId}-01`,
      patientId,
      patientName: newPatient.name,
      phone: newPatient.phone,
      visitNumber: 1,
      date: todayStr,
      time: timeStr,
      reason: String(reasonForVisit || "Initial Assessment & Evaluation").trim(),
      complaint: String(complaint || "").trim(),
      diagnosis: String(diagnosis || "").trim(),
      treatmentNotes: String(treatmentNotes || "").trim(),
      referredBy: String(referredBy || "").trim(),
      followUpDate: String(followUpDate || "").trim(),
      status: status || "Completed",
      doctor: "Dr. Satyam Vishwakarma",
      syncStatus: "pending",
      createdAt: new Date().toISOString()
    };

    patients.unshift(newPatient);
    visits.unshift(firstVisit);

    await writeDataFile(patientsFile, patients);
    await writeDataFile(visitsFile, visits);

    syncToGoogleSheets("patient", newPatient).then(async (res) => {
      if (res.synced) {
        newPatient.syncStatus = "synced";
        await writeDataFile(patientsFile, patients);
      }
    });
    syncToGoogleSheets("visit", firstVisit).then(async (res) => {
      if (res.synced) {
        firstVisit.syncStatus = "synced";
        await writeDataFile(visitsFile, visits);
      }
    });

    res.status(201).json({
      ok: true,
      patient: newPatient,
      visit: firstVisit,
      message: "Patient enrolled successfully."
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to enroll new patient." });
  }
});

app.post("/api/doctor/patients/:id/visits", requireDoctorAuth, async (req, res) => {
  try {
    const patientId = req.params.id;
    const {
      visitDate,
      visitTime,
      reasonForVisit,
      complaint,
      diagnosis,
      treatmentNotes,
      followUpDate,
      status
    } = req.body;

    const patients = await ensureDataFile(patientsFile, []);
    const visits = await ensureDataFile(visitsFile, []);

    const patientIndex = patients.findIndex(p => p.patientId === patientId);
    if (patientIndex === -1) {
      return res.status(404).json({ error: "Patient not found." });
    }

    const patient = patients[patientIndex];
    const existingPatientVisits = visits.filter(v => v.patientId === patientId);
    const nextVisitNum = existingPatientVisits.length + 1;

    const todayStr = (visitDate || new Date().toISOString().slice(0, 10)).trim();
    const timeStr = (visitTime || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })).trim();

    const newVisit = {
      visitId: `VIS-${patientId}-${String(nextVisitNum).padStart(2, "0")}`,
      patientId,
      patientName: patient.name,
      phone: patient.phone,
      visitNumber: nextVisitNum,
      date: todayStr,
      time: timeStr,
      reason: String(reasonForVisit || "Follow-up Rehabilitation").trim(),
      complaint: String(complaint || "").trim(),
      diagnosis: String(diagnosis || "").trim(),
      treatmentNotes: String(treatmentNotes || "").trim(),
      followUpDate: String(followUpDate || "").trim(),
      status: status || "Completed",
      doctor: "Dr. Satyam Vishwakarma",
      syncStatus: "pending",
      createdAt: new Date().toISOString()
    };

    visits.unshift(newVisit);
    patient.totalVisits = nextVisitNum;
    patient.lastVisitDate = todayStr;
    patients[patientIndex] = patient;

    await writeDataFile(visitsFile, visits);
    await writeDataFile(patientsFile, patients);

    syncToGoogleSheets("visit", newVisit).then(async (res) => {
      if (res.synced) {
        newVisit.syncStatus = "synced";
        await writeDataFile(visitsFile, visits);
      }
    });

    res.status(201).json({
      ok: true,
      visit: newVisit,
      patient,
      message: `Visit #${nextVisitNum} added successfully.`
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to add new visit." });
  }
});

app.get("/api/doctor/today-visits", requireDoctorAuth, async (req, res) => {
  try {
    const visits = await ensureDataFile(visitsFile, []);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayVisits = visits
      .filter(v => v.date === todayStr)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

    res.json({ ok: true, date: todayStr, visits: todayVisits });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch today's visits." });
  }
});

// Online Enquiries List
app.get("/api/doctor/enquiries", requireDoctorAuth, async (req, res) => {
  try {
    const enquiries = await ensureDataFile(enquiriesFile, []);
    res.json({ ok: true, enquiries });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch enquiries." });
  }
});

// Trigger Google Sheets Sync
app.post("/api/doctor/sync", requireDoctorAuth, async (req, res) => {
  try {
    const patients = await ensureDataFile(patientsFile, []);
    const visits = await ensureDataFile(visitsFile, []);
    const enquiries = await ensureDataFile(enquiriesFile, []);

    let syncedPatients = 0;
    let syncedVisits = 0;
    let syncedEnquiries = 0;

    for (const p of patients) {
      if (p.syncStatus === "pending") {
        const syncRes = await syncToGoogleSheets("patient", p);
        if (syncRes.synced) {
          p.syncStatus = "synced";
          syncedPatients++;
        }
      }
    }

    for (const v of visits) {
      if (v.syncStatus === "pending") {
        const syncRes = await syncToGoogleSheets("visit", v);
        if (syncRes.synced) {
          v.syncStatus = "synced";
          syncedVisits++;
        }
      }
    }

    for (const e of enquiries) {
      if (e.syncStatus === "pending") {
        const syncRes = await syncToGoogleSheets("enquiry", e);
        if (syncRes.synced) {
          e.syncStatus = "synced";
          syncedEnquiries++;
        }
      }
    }

    await writeDataFile(patientsFile, patients);
    await writeDataFile(visitsFile, visits);
    await writeDataFile(enquiriesFile, enquiries);

    res.json({
      ok: true,
      syncedPatients,
      syncedVisits,
      syncedEnquiries,
      message: `Sync completed: ${syncedPatients} patients, ${syncedVisits} visits, ${syncedEnquiries} enquiries.`
    });
  } catch (err) {
    res.status(500).json({ error: "Sync operation encountered an error." });
  }
});

// Restore / Pull All Data from Google Sheets into local website
app.post("/api/doctor/restore", requireDoctorAuth, async (req, res) => {
  try {
    const restoreResult = await pullFromGoogleSheets();
    if (!restoreResult.ok) {
      return res.status(400).json({ error: restoreResult.error || "Could not restore data from Google Sheets." });
    }
    res.json(restoreResult);
  } catch (err) {
    res.status(500).json({ error: "Restore operation encountered an error: " + err.message });
  }
});

// CSV Export
app.get("/api/doctor/export", requireDoctorAuth, async (req, res) => {
  try {
    const patients = await ensureDataFile(patientsFile, []);
    const visits = await ensureDataFile(visitsFile, []);
    const enquiries = await ensureDataFile(enquiriesFile, []);
    const type = req.query.type || "visits";

    if (type === "enquiries") {
      const headers = ["ID", "Date", "Time", "Name", "Phone", "Condition", "Duration", "Preferred Date", "Concern", "Status"];
      const rows = enquiries.map(e => [
        `"${e.id || ""}"`,
        `"${e.date || ""}"`,
        `"${e.time || ""}"`,
        `"${e.name || ""}"`,
        `"${e.phone || ""}"`,
        `"${(e.painArea || "").replace(/"/g, '""')}"`,
        `"${(e.duration || "").replace(/"/g, '""')}"`,
        `"${e.appointmentDate || ""}"`,
        `"${(e.concern || "").replace(/"/g, '""')}"`,
        `"${e.status || "New"}"`
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="vindhya_enquiries_${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.send(csv);
    }

    if (type === "patients") {
      const headers = ["Patient ID", "Registration Date", "Name", "Age", "Gender", "Phone", "Alt Phone", "Address", "Emergency Contact", "Total Visits", "Last Visit", "Status"];
      const rows = patients.map(p => [
        `"${p.patientId || ""}"`,
        `"${p.registrationDate || ""}"`,
        `"${p.name || ""}"`,
        `"${p.age || ""}"`,
        `"${p.gender || ""}"`,
        `"${p.phone || ""}"`,
        `"${p.altPhone || ""}"`,
        `"${(p.address || "").replace(/"/g, '""')}"`,
        `"${p.emergencyContact || ""}"`,
        `"${p.totalVisits || 1}"`,
        `"${p.lastVisitDate || ""}"`,
        `"${p.status || "Active"}"`
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="vindhya_patients_${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.send(csv);
    }

    const headers = ["Visit ID", "Patient ID", "Patient Name", "Phone", "Visit Number", "Date", "Time", "Reason for Visit", "Complaint", "Diagnosis", "Treatment / Notes", "Follow-up Date", "Status", "Doctor"];
    const rows = visits.map(v => [
      `"${v.visitId || ""}"`,
      `"${v.patientId || ""}"`,
      `"${v.patientName || ""}"`,
      `"${v.phone || ""}"`,
      `"${v.visitNumber || 1}"`,
      `"${v.date || ""}"`,
      `"${v.time || ""}"`,
      `"${(v.reason || "").replace(/"/g, '""')}"`,
      `"${(v.complaint || "").replace(/"/g, '""')}"`,
      `"${(v.diagnosis || "").replace(/"/g, '""')}"`,
      `"${(v.treatmentNotes || "").replace(/"/g, '""')}"`,
      `"${v.followUpDate || ""}"`,
      `"${v.status || "Completed"}"`,
      `"${v.doctor || "Dr. Satyam Vishwakarma"}"`
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="vindhya_visits_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "Failed to export data." });
  }
});

// ==========================================
// 3. PUBLIC WEBSITE ENQUIRY API
// ==========================================

function sanitizeText(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 200);
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "vindhya-physio-api",
    clinic: "Vindhya Physio & Rehab Center",
    leadDoctor: "Dr. Satyam Vishwakarma",
    authorizedAccount: AUTHORIZED_DOCTOR_EMAIL
  });
});

// Direct Public Website Enquiry / Consultation Booking (Saves locally & Google Sheets)
app.post("/api/enquiries", async (req, res) => {
  try {
    const rawPhone = req.body.phone;
    const phone = normalizePhone(rawPhone);
    const name = sanitizeText(req.body.name);

    if (!phone || name.length < 2) {
      return res.status(422).json({ error: "Valid patient name and 10-digit Indian mobile number are required." });
    }

    const currentEnquiries = await ensureDataFile(enquiriesFile, []);
    const todayStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    const newEnquiry = {
      id: `ENQ-${Date.now().toString().slice(-6)}`,
      date: todayStr,
      time: timeStr,
      name,
      phone: phone.replace("+91", ""),
      fullPhone: phone,
      painArea: sanitizeText(req.body.painArea, "Spine & Back Pain"),
      duration: sanitizeText(req.body.duration, "Not specified"),
      appointmentDate: sanitizeText(req.body.appointmentDate, "Flexible"),
      concern: sanitizeText(req.body.concern, "General Enquiry"),
      status: "New",
      syncStatus: "pending",
      createdAt: new Date().toISOString()
    };

    currentEnquiries.unshift(newEnquiry);
    await writeDataFile(enquiriesFile, currentEnquiries);

    // Sync to Google Sheets ENQUIRIES tab
    syncToGoogleSheets("enquiry", newEnquiry).then(async (result) => {
      if (result.synced) {
        newEnquiry.syncStatus = "synced";
        await writeDataFile(enquiriesFile, currentEnquiries);
      }
    });

    res.status(201).json({
      ok: true,
      message: "Consultation enquiry received and logged.",
      enquiry: newEnquiry
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to process enquiry." });
  }
});

// Legacy aliases
app.post("/api/assessments", async (req, res) => {
  return app._router.handle({ ...req, url: "/api/enquiries" }, res);
});
app.post("/api/appointments", async (req, res) => {
  return app._router.handle({ ...req, url: "/api/enquiries" }, res);
});

// Static dist serve
app.use(express.static(path.join(root, "dist")));
app.use((req, res) => {
  res.sendFile(path.join(root, "dist", "index.html"));
});

app.listen(port, host, () => {
  console.log(`Vindhya Physio & Rehab API running on http://${host}:${port}`);
});
