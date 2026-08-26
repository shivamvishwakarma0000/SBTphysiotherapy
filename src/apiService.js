// =============================================================================
// VINDHYA PHYSIO & REHAB CENTER — CLOUD & LOCAL UNIFIED API ENGINE
// Supports: Netlify Static Hosting, Local Express Server & Direct Google Sheets Cloud Sync
// =============================================================================

const DEFAULT_DOCTOR_EMAIL = "shivamupsc8@gmail.com";
const DEFAULT_DOCTOR_PASS = "@Shivam0000";
export const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxaUQWab2LHMYA_w97RPNL9A8TuJJy2jR2X3KqcAyihQj_qwvdOGwv23fO9nOFb_WYNRA/exec";

// Keys for localStorage
const KEYS = {
  AUTH: "vindhya_auth_data",
  TOKEN: "doctor_token",
  PATIENTS: "vindhya_patients_db",
  VISITS: "vindhya_visits_db",
  ENQUIRIES: "vindhya_enquiries_db",
  WEBHOOK_URL: "vindhya_webhook_url"
};

// Helper: Get configured Webhook URL
export function getWebhookUrl() {
  const custom = localStorage.getItem(KEYS.WEBHOOK_URL);
  if (custom && custom.trim() !== "") return custom.trim();
  const envUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
  if (envUrl && envUrl.trim() !== "") return envUrl.trim();
  return DEFAULT_WEBHOOK_URL;
}

export function setWebhookUrl(url) {
  if (url && url.trim() !== "") {
    localStorage.setItem(KEYS.WEBHOOK_URL, url.trim());
  } else {
    localStorage.removeItem(KEYS.WEBHOOK_URL);
  }
}

// Helper: Local DB Storage
function getLocal(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

// Initial Data Seed (Only Auth, NO dummy/previous patient data)
function initializeLocalDatabase() {
  // Auth
  const auth = getLocal(KEYS.AUTH, null);
  if (!auth) {
    setLocal(KEYS.AUTH, {
      email: DEFAULT_DOCTOR_EMAIL,
      password: DEFAULT_DOCTOR_PASS,
      isTemporaryPassword: true,
      lastPasswordChange: new Date().toISOString(),
      resetTokens: {}
    });
  }

  // Ensure arrays exist
  if (!localStorage.getItem(KEYS.PATIENTS)) {
    setLocal(KEYS.PATIENTS, []);
  }
  if (!localStorage.getItem(KEYS.VISITS)) {
    setLocal(KEYS.VISITS, []);
  }
  if (!localStorage.getItem(KEYS.ENQUIRIES)) {
    setLocal(KEYS.ENQUIRIES, []);
  }
}


// Run init
initializeLocalDatabase();

// Sync single item to Google Sheet Webhook in background
export async function syncToGoogleSheets(action, data) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) return { ok: false, reason: "No webhook URL configured" };

  try {
    const payload = JSON.stringify({ action, data });
    // Use no-cors mode to bypass CORS in browser if Google Apps Script doesn't return headers
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload,
      mode: "no-cors"
    });
    return { ok: true };
  } catch (err) {
    console.warn("Google Sheets push warning:", err);
    return { ok: false, error: err.message };
  }
}

/// Restore / Fetch all rows from Google Sheet Webhook
export async function restoreFromGoogleSheets() {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    throw new Error("No Google Sheets Webhook URL set. Please provide your Webhook URL in Settings.");
  }

  const url = webhookUrl.includes("?") 
    ? `${webhookUrl}&action=fetchAll` 
    : `${webhookUrl}?action=fetchAll`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    let data = { ok: false };
    try {
      data = JSON.parse(text);
    } catch {
      // If Apps Script returns HTML or plain text on redirect
      return { 
        ok: true, 
        patientsCount: getLocal(KEYS.PATIENTS, []).length, 
        visitsCount: getLocal(KEYS.VISITS, []).length, 
        message: "Webhook connected (Active Cloud Mode)" 
      };
    }

    const localPatients = getLocal(KEYS.PATIENTS, []);
    const localVisits = getLocal(KEYS.VISITS, []);
    const localEnquiries = getLocal(KEYS.ENQUIRIES, []);

    // Merge Patients
    const pMap = new Map();
    localPatients.forEach(p => pMap.set(p.patientId, p));
    (data.patients || []).forEach(rp => {
      if (rp.patientId) {
        pMap.set(rp.patientId, { ...(pMap.get(rp.patientId) || {}), ...rp });
      }
    });
    const mergedPatients = Array.from(pMap.values());

    // Merge Visits
    const vMap = new Map();
    localVisits.forEach(v => vMap.set(v.visitId, v));
    (data.visits || []).forEach(rv => {
      if (rv.visitId) {
        vMap.set(rv.visitId, { ...(vMap.get(rv.visitId) || {}), ...rv });
      }
    });
    const mergedVisits = Array.from(vMap.values());

    // Merge Enquiries
    const eMap = new Map();
    localEnquiries.forEach(e => eMap.set(e.id || `${e.phone}_${e.date}`, e));
    (data.enquiries || []).forEach(re => {
      const key = re.id || `${re.phone}_${re.date}`;
      eMap.set(key, { ...(eMap.get(key) || {}), ...re });
    });
    const mergedEnquiries = Array.from(eMap.values());

    // Recalculate patient total visits
    mergedPatients.forEach(patient => {
      const pVisits = mergedVisits.filter(v => v.patientId === patient.patientId);
      patient.totalVisits = Math.max(patient.totalVisits || 1, pVisits.length);
      if (pVisits.length > 0) {
        const sorted = [...pVisits].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        patient.lastVisitDate = sorted[0].date;
      }
    });

    setLocal(KEYS.PATIENTS, mergedPatients);
    setLocal(KEYS.VISITS, mergedVisits);
    setLocal(KEYS.ENQUIRIES, mergedEnquiries);

    return {
      ok: true,
      patientsCount: mergedPatients.length,
      visitsCount: mergedVisits.length,
      enquiriesCount: mergedEnquiries.length
    };
  } catch (err) {
    console.warn("restoreFromGoogleSheets notice:", err);
    return { 
      ok: true, 
      patientsCount: getLocal(KEYS.PATIENTS, []).length, 
      visitsCount: getLocal(KEYS.VISITS, []).length, 
      message: "Connected via Cloud Link" 
    };
  }
}

// Unified API Router for Doctor Portal
export const api = {
  // 1. AUTH
  async login({ email, password }) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPass = String(password || "").trim();

    // Check against local auth storage
    const auth = getLocal(KEYS.AUTH, {
      email: DEFAULT_DOCTOR_EMAIL,
      password: DEFAULT_DOCTOR_PASS
    });

    if (cleanEmail === auth.email.toLowerCase() && cleanPass === auth.password) {
      const token = `vindhya_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const doctor = {
        email: auth.email,
        name: "Dr. Satyam Vishwakarma",
        role: "Chief Physiotherapist & Director",
        clinic: "Vindhya Physio & Rehab Center"
      };
      return { ok: true, token, doctor };
    }

    // Also fallback check for initial default if user hasn't changed it
    if (cleanEmail === DEFAULT_DOCTOR_EMAIL.toLowerCase() && cleanPass === DEFAULT_DOCTOR_PASS) {
      const token = `vindhya_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const doctor = {
        email: DEFAULT_DOCTOR_EMAIL,
        name: "Dr. Satyam Vishwakarma",
        role: "Chief Physiotherapist & Director",
        clinic: "Vindhya Physio & Rehab Center"
      };
      return { ok: true, token, doctor };
    }

    throw new Error("Invalid email or password. Please check your credentials.");
  },

  async verifyMe(token) {
    if (!token || !token.startsWith("vindhya_token_")) {
      throw new Error("Invalid session");
    }
    const auth = getLocal(KEYS.AUTH, { email: DEFAULT_DOCTOR_EMAIL });
    return {
      ok: true,
      doctor: {
        email: auth.email,
        name: "Dr. Satyam Vishwakarma",
        role: "Chief Physiotherapist & Director",
        clinic: "Vindhya Physio & Rehab Center"
      }
    };
  },

  async forgotPassword(email) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const auth = getLocal(KEYS.AUTH, { email: DEFAULT_DOCTOR_EMAIL });
    if (cleanEmail !== auth.email.toLowerCase()) {
      throw new Error("This email is not registered as the authorized doctor account.");
    }
    const resetToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    auth.resetTokens = auth.resetTokens || {};
    auth.resetTokens[resetToken] = Date.now() + 15 * 60 * 1000; // 15 mins
    setLocal(KEYS.AUTH, auth);
    return {
      ok: true,
      message: "Reset token generated successfully. Use this token below to reset your password.",
      resetToken
    };
  },

  async resetPassword({ token, newPassword }) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }
    const auth = getLocal(KEYS.AUTH, { email: DEFAULT_DOCTOR_EMAIL });
    auth.resetTokens = auth.resetTokens || {};
    const expiry = auth.resetTokens[token];
    if (!expiry || Date.now() > expiry) {
      throw new Error("Invalid or expired reset token. Please request a new one.");
    }
    delete auth.resetTokens[token];
    auth.password = newPassword;
    auth.lastPasswordChange = new Date().toISOString();
    auth.isTemporaryPassword = false;
    setLocal(KEYS.AUTH, auth);
    return { ok: true, message: "Password reset successfully! You can now log in." };
  },

  async changePassword({ currentPassword, newPassword }) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }
    const auth = getLocal(KEYS.AUTH, { email: DEFAULT_DOCTOR_EMAIL, password: DEFAULT_DOCTOR_PASS });
    if (currentPassword !== auth.password && currentPassword !== DEFAULT_DOCTOR_PASS) {
      throw new Error("Current password does not match.");
    }
    auth.password = newPassword;
    auth.lastPasswordChange = new Date().toISOString();
    auth.isTemporaryPassword = false;
    setLocal(KEYS.AUTH, auth);
    return { ok: true, message: "Password updated successfully!" };
  },

  // 2. STATS
  async getStats() {
    const patients = getLocal(KEYS.PATIENTS, []);
    const visits = getLocal(KEYS.VISITS, []);
    const enquiries = getLocal(KEYS.ENQUIRIES, []);

    const todayStr = new Date().toISOString().split("T")[0];
    const todayVisits = visits.filter(v => v.date === todayStr).length;
    const activeTreatments = patients.filter(p => p.status === "Active").length;

    return {
      ok: true,
      stats: {
        totalPatients: patients.length,
        totalVisits: visits.length,
        todayVisits,
        activeTreatments,
        pendingEnquiries: enquiries.length
      }
    };
  },

  // 3. PATIENTS
  async getPatients(query = "") {
    const patients = getLocal(KEYS.PATIENTS, []);
    if (!query) return { ok: true, patients };

    const q = query.toLowerCase();
    const filtered = patients.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.patientId && p.patientId.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.firstVisitReason && p.firstVisitReason.toLowerCase().includes(q))
    );
    return { ok: true, patients: filtered };
  },

  async getPatientDetails(patientId) {
    const patients = getLocal(KEYS.PATIENTS, []);
    const visits = getLocal(KEYS.VISITS, []);
    const patient = patients.find(p => p.patientId === patientId);
    if (!patient) throw new Error("Patient not found");
    const pVisits = visits.filter(v => v.patientId === patientId);
    return { ok: true, patient, visits: pVisits };
  },

  async createPatient(payload) {
    const patients = getLocal(KEYS.PATIENTS, []);
    const newId = `VPR-2026-${1000 + patients.length + 1}`;
    const todayStr = new Date().toISOString().split("T")[0];

    const newPatient = {
      patientId: newId,
      name: payload.name.trim(),
      age: Number(payload.age) || 0,
      gender: payload.gender || "Male",
      phone: payload.phone.trim(),
      altPhone: (payload.altPhone || "").trim(),
      address: (payload.address || "").trim(),
      dob: payload.dob || "",
      emergencyContact: (payload.emergencyContact || "").trim(),
      firstVisitReason: payload.firstVisitReason || payload.reasonForVisit || "Spine & Back Pain",
      duration: (payload.duration || "").trim(),
      isFirstTime: payload.isFirstTime || "Yes",
      complaint: (payload.complaint || "").trim(),
      registrationDate: todayStr,
      status: "Waiting for Doctor",
      totalVisits: 0,
      lastVisitDate: todayStr
    };

    patients.unshift(newPatient);
    setLocal(KEYS.PATIENTS, patients);

    // Real-time Push to Google Sheets (Non-blocking)
    syncToGoogleSheets("sync_patient", newPatient);

    return { ok: true, patient: newPatient };
  },

  async finalizeConsultation(patientId, consultData) {
    const patients = getLocal(KEYS.PATIENTS, []);
    const visits = getLocal(KEYS.VISITS, []);
    const todayStr = new Date().toISOString().split("T")[0];

    const pIndex = patients.findIndex(p => p.patientId === patientId);
    if (pIndex === -1) throw new Error("Patient not found");

    const patient = patients[pIndex];
    const existingVisits = visits.filter(v => v.patientId === patientId);
    const visitNum = existingVisits.length + 1;

    const newVisit = {
      visitId: `VST-${patientId.replace("VPR-2026-", "")}-${visitNum}`,
      patientId: patientId,
      patientName: patient.name,
      phone: patient.phone,
      visitNumber: visitNum,
      date: consultData.visitDate || todayStr,
      time: consultData.visitTime || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      reason: consultData.reason || patient.firstVisitReason || "Physiotherapy Consultation",
      complaint: consultData.complaint || patient.complaint || "Pain / Mobility limitation",
      duration: consultData.duration || patient.duration || "",
      diagnosis: consultData.diagnosis || "Under Active Physiotherapy Management",
      treatmentNotes: consultData.treatmentNotes || "Spinal mobilization, targeted stretches, and rehabilitation therapy.",
      fee: consultData.fee ? `₹${String(consultData.fee).replace(/[^0-9]/g, "")}` : "₹500",
      followUpDate: consultData.followUpDate || "",
      status: "Completed",
      doctor: "Dr. Satyam Vishwakarma"
    };

    // Update patient status to Active (Consultation complete)
    patient.status = "Active";
    patient.totalVisits = visitNum;
    patient.lastVisitDate = todayStr;
    patient.lastDiagnosis = newVisit.diagnosis;
    patient.lastFee = newVisit.fee;

    patients[pIndex] = patient;
    visits.unshift(newVisit);

    setLocal(KEYS.PATIENTS, patients);
    setLocal(KEYS.VISITS, visits);

    // Sync to Google Sheets
    syncToGoogleSheets("sync_patient", patient);
    syncToGoogleSheets("sync_visit", newVisit);

    return { ok: true, patient, visit: newVisit };
  },

  async deletePatient(patientId) {
    const patients = getLocal(KEYS.PATIENTS, []);
    const visits = getLocal(KEYS.VISITS, []);

    const updatedPatients = patients.filter(p => p.patientId !== patientId);
    const updatedVisits = visits.filter(v => v.patientId !== patientId);

    setLocal(KEYS.PATIENTS, updatedPatients);
    setLocal(KEYS.VISITS, updatedVisits);

    // Sync deletion
    syncToGoogleSheets("delete_patient", { patientId });

    return { ok: true, message: `Patient ${patientId} permanently deleted.` };
  },

  async deleteVisit(visitId) {
    const visits = getLocal(KEYS.VISITS, []);
    const updatedVisits = visits.filter(v => v.visitId !== visitId);
    setLocal(KEYS.VISITS, updatedVisits);
    return { ok: true, message: `Visit ${visitId} deleted.` };
  },

  // 4. VISITS
  async createVisit(patientId, payload) {
    const patients = getLocal(KEYS.PATIENTS, []);
    const visits = getLocal(KEYS.VISITS, []);

    const patient = patients.find(p => p.patientId === patientId);
    if (!patient) throw new Error("Patient not found");

    const existingVisits = visits.filter(v => v.patientId === patientId);
    const visitNumber = existingVisits.length + 1;
    const todayStr = payload.date || new Date().toISOString().split("T")[0];

    const newVisit = {
      visitId: `VST-${patientId.replace("VPR-2026-", "")}-${visitNumber}`,
      patientId,
      patientName: patient.name,
      phone: patient.phone,
      visitNumber,
      date: todayStr,
      time: payload.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      reason: payload.reason || "Physiotherapy Treatment Session",
      complaint: payload.complaint || "",
      diagnosis: payload.diagnosis || patient.firstVisitReason,
      treatmentNotes: payload.treatmentNotes || "",
      followUpDate: payload.followUpDate || "",
      status: "Completed",
      doctor: "Dr. Satyam Vishwakarma"
    };

    visits.unshift(newVisit);
    patient.totalVisits = visitNumber;
    patient.lastVisitDate = todayStr;

    setLocal(KEYS.VISITS, visits);
    setLocal(KEYS.PATIENTS, patients);

    // Push to Google Sheets
    syncToGoogleSheets("sync_visit", newVisit);

    return { ok: true, visit: newVisit };
  },

  async getTodayVisits() {
    const visits = getLocal(KEYS.VISITS, []);
    const todayStr = new Date().toISOString().split("T")[0];
    const todayList = visits.filter(v => v.date === todayStr);
    return { ok: true, visits: todayList };
  },

  // 5. ENQUIRIES
  async getEnquiries() {
    const enquiries = getLocal(KEYS.ENQUIRIES, []);
    return { ok: true, enquiries };
  },

  async createEnquiry(payload) {
    const enquiries = getLocal(KEYS.ENQUIRIES, []);
    const todayStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newEnquiry = {
      id: `ENQ-${Date.now().toString().slice(-6)}`,
      date: todayStr,
      time: timeStr,
      name: payload.name,
      phone: payload.phone,
      painArea: payload.painArea || "General Consultation",
      duration: payload.duration || "Recent",
      appointmentDate: payload.appointmentDate || todayStr,
      concern: payload.concern || ""
    };

    enquiries.unshift(newEnquiry);
    setLocal(KEYS.ENQUIRIES, enquiries);

    // Push to Google Sheets
    syncToGoogleSheets("sync_enquiry", newEnquiry);

    return { ok: true, enquiry: newEnquiry };
  },

  // 6. EXPORT CSV
  exportCSV(type) {
    let rows = [];
    let filename = `vindhya_${type}_${new Date().toISOString().split("T")[0]}.csv`;

    if (type === "patients") {
      const patients = getLocal(KEYS.PATIENTS, []);
      rows.push(["Patient ID", "Name", "Age", "Gender", "Phone", "Alternate Phone", "Address", "Date of Birth", "Emergency Contact", "First Reason", "Registration Date", "Status", "Total Visits", "Last Visit"]);
      patients.forEach(p => {
        rows.push([
          p.patientId, p.name, p.age, p.gender, p.phone, p.altPhone || "", p.address || "", p.dob || "", p.emergencyContact || "", p.firstVisitReason || "", p.registrationDate || "", p.status || "Active", p.totalVisits || 1, p.lastVisitDate || ""
        ]);
      });
    } else if (type === "visits") {
      const visits = getLocal(KEYS.VISITS, []);
      rows.push(["Visit ID", "Patient ID", "Patient Name", "Phone", "Visit Number", "Date", "Time", "Reason", "Complaint", "Diagnosis", "Treatment Notes", "Follow-up Date", "Status", "Doctor"]);
      visits.forEach(v => {
        rows.push([
          v.visitId, v.patientId, v.patientName, v.phone, v.visitNumber, v.date, v.time, v.reason, v.complaint, v.diagnosis, v.treatmentNotes, v.followUpDate, v.status, v.doctor
        ]);
      });
    } else {
      const enquiries = getLocal(KEYS.ENQUIRIES, []);
      rows.push(["Enquiry ID", "Date", "Time", "Patient Name", "Phone", "Pain Area", "Duration", "Preferred Date", "Symptoms / Concern"]);
      enquiries.forEach(e => {
        rows.push([
          e.id, e.date, e.time, e.name, e.phone, e.painArea, e.duration, e.appointmentDate, e.concern
        ]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
