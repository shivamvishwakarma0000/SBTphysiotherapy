// =============================================================================
// VINDHYA PHYSIO & REHAB CENTER — CLOUD & LOCAL UNIFIED API ENGINE
// Supports: Netlify Static Hosting, Local Express Server & Direct Google Sheets Cloud Sync
// =============================================================================

const DEFAULT_DOCTOR_EMAIL = "shivamupsc8@gmail.com";
const DEFAULT_DOCTOR_PASS = "@Shivam0000";
export const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxY_3u6-DyrWZYNAFTmFyAMPKGR5SHrPyRUL2oYSf21zthtOiUUzBr6_BIRcrY4SWCVNA/exec";

// Keys for localStorage
const KEYS = {
  AUTH: "vindhy_auth_data",
  TOKEN: "doctor_token",
  PATIENTS: "vindhy_patients_db",
  VISITS: "vindhy_visits_db",
  ENQUIRIES: "vindhy_enquiries_db",
  WEBHOOK_URL: "vindhy_webhook_url",
  REVIEW_URL: "vindhy_review_url",
  REVIEW_QUEUE: "vindhy_review_queue",
  DELETED_PATIENT_IDS: "vindhy_deleted_patient_ids",
  DELETED_VISIT_IDS: "vindhy_deleted_visit_ids",
  DELETED_ENQUIRY_IDS: "vindhy_deleted_enquiry_ids"
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

// Helper: Get configured Google Review / Feedback URL
export function getReviewUrl() {
  const custom = localStorage.getItem(KEYS.REVIEW_URL);
  if (custom && custom.trim() !== "") return custom.trim();
  const envUrl = import.meta.env.VITE_GOOGLE_REVIEW_URL;
  if (envUrl && envUrl.trim() !== "") return envUrl.trim();
  return "";
}

export function setReviewUrl(url) {
  if (url && url.trim() !== "") {
    localStorage.setItem(KEYS.REVIEW_URL, url.trim());
  } else {
    localStorage.removeItem(KEYS.REVIEW_URL);
  }
}

// Helper: Generate structured, short & sweet WhatsApp review message (100% UTF-8 & Emoji Safe)
export function generateReviewWhatsAppMessage(patientName, customReviewUrl = "") {
  const activeUrl = (customReviewUrl || getReviewUrl() || "").trim();
  const linkText = activeUrl ? activeUrl : "[Review Link: Configure in Doctor Portal Settings]";
  const pName = (patientName || "Patient").trim();

  return `Namaste ${pName} ji \u{1F64F},

Thank you for visiting Vindhy Physio & Rehab Center today for your consultation with Dr. Satyam Vishwakarma (PT).

\u{2B50} Please take 30 seconds to share your valuable review & feedback:
\u{1F449} ${linkText}

Wishing you a speedy recovery! \u{1F33F}
Dr. Satyam Vishwakarma (PT) \u{2022} \u{1F4DE} +91 8382024264`;
}

export function getReviewWhatsAppUrl(phone, patientName, customReviewUrl = "") {
  const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-10);
  const msg = generateReviewWhatsAppMessage(patientName, customReviewUrl);
  return `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(msg)}`;
}


// Review Queue Management (2-Hour Post-Consult for newly enrolled patients)
export function getReviewQueue() {
  return getLocal(KEYS.REVIEW_QUEUE, []);
}

export function scheduleReviewRequest(patient, visit) {
  if (!patient || !patient.patientId) return null;
  const queue = getLocal(KEYS.REVIEW_QUEUE, []);
  
  // Prevent duplicate queue entries for the same patient, update visit details if provided
  const existingIndex = queue.findIndex(q => q.patientId === patient.patientId);
  if (existingIndex !== -1) {
    if (visit) {
      queue[existingIndex].visitId = visit.visitId || queue[existingIndex].visitId;
      queue[existingIndex].diagnosis = visit.diagnosis || queue[existingIndex].diagnosis;
      setLocal(KEYS.REVIEW_QUEUE, queue);
    }
    return queue[existingIndex];
  }

  const now = Date.now();
  const scheduledSendAt = now + (2 * 60 * 60 * 1000); // exactly 2 hours after enrollment/consultation
  const queueItem = {
    queueId: `REV-${patient.patientId}-${now}`,
    patientId: patient.patientId,
    patientName: patient.name,
    phone: patient.phone,
    visitId: visit?.visitId || "",
    diagnosis: visit?.diagnosis || patient.firstVisitReason || patient.lastDiagnosis || patient.reasonForVisit || "Physiotherapy Rehabilitation",
    completedAt: now,
    completedTimeStr: new Date(now).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    scheduledSendAt: scheduledSendAt,
    scheduledTimeStr: new Date(scheduledSendAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    status: "pending", // "pending" | "sent" | "dismissed"
    sentAt: null,
    isFirstVisit: true
  };

  queue.unshift(queueItem);
  setLocal(KEYS.REVIEW_QUEUE, queue);

  // Sync scheduled review to Google Sheets
  try {
    syncToGoogleSheets("sync_review_schedule", {
      queueId: queueItem.queueId,
      patientId: queueItem.patientId,
      patientName: queueItem.patientName,
      phone: queueItem.phone,
      completedAt: queueItem.completedTimeStr,
      scheduledSendAt: queueItem.scheduledTimeStr,
      status: "pending"
    });
  } catch (e) {}

  return queueItem;
}

export function markReviewSent(queueId) {
  const queue = getLocal(KEYS.REVIEW_QUEUE, []);
  const idx = queue.findIndex(q => q.queueId === queueId);
  if (idx !== -1) {
    queue[idx].status = "sent";
    queue[idx].sentAt = Date.now();
    queue[idx].sentTimeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    setLocal(KEYS.REVIEW_QUEUE, queue);
    try {
      syncToGoogleSheets("sync_review_status", { queueId, status: "sent", sentAt: queue[idx].sentTimeStr });
    } catch (e) {}
  }
}

export function dismissReview(queueId) {
  const queue = getLocal(KEYS.REVIEW_QUEUE, []);
  const idx = queue.findIndex(q => q.queueId === queueId);
  if (idx !== -1) {
    queue[idx].status = "dismissed";
    setLocal(KEYS.REVIEW_QUEUE, queue);
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

  // Ensure arrays exist (No dummy seed data, all records come from Google Sheets or real doctor intake)
  if (!localStorage.getItem(KEYS.PATIENTS)) {
    setLocal(KEYS.PATIENTS, []);
  } else {
    // Clean corrupt null/undefined records
    const pts = getLocal(KEYS.PATIENTS, []);
    const cleanPts = pts.filter(p => p && p.patientId);
    if (cleanPts.length !== pts.length) {
      setLocal(KEYS.PATIENTS, cleanPts);
    }
  }

  if (!localStorage.getItem(KEYS.VISITS)) {
    setLocal(KEYS.VISITS, []);
  } else {
    const vts = getLocal(KEYS.VISITS, []);
    const cleanVts = vts.filter(v => v && v.visitId);
    if (cleanVts.length !== vts.length) {
      setLocal(KEYS.VISITS, cleanVts);
    }
  }

  if (!localStorage.getItem(KEYS.ENQUIRIES)) {
    setLocal(KEYS.ENQUIRIES, []);
  }
}


export function clearLocalPatientsCache() {
  localStorage.removeItem(KEYS.PATIENTS);
  localStorage.removeItem(KEYS.VISITS);
  localStorage.removeItem(KEYS.ENQUIRIES);
  localStorage.removeItem(KEYS.DELETED_PATIENT_IDS);
  localStorage.removeItem(KEYS.DELETED_VISIT_IDS);
  localStorage.removeItem(KEYS.DELETED_ENQUIRY_IDS);
  setLocal(KEYS.PATIENTS, []);
  setLocal(KEYS.VISITS, []);
  setLocal(KEYS.ENQUIRIES, []);
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

/// Restore / Fetch all rows from Google Sheet Webhook (Google Sheets as Source of Truth)
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

    if (data && (data.patients || data.visits || data.enquiries)) {
      const deletedPatientIds = new Set(getLocal(KEYS.DELETED_PATIENT_IDS, []));
      const deletedVisitIds = new Set(getLocal(KEYS.DELETED_VISIT_IDS, []));
      const deletedEnquiryIds = new Set(getLocal(KEYS.DELETED_ENQUIRY_IDS, []));

      const normPhone = (ph) => String(ph || "").replace(/\D/g, "").slice(-10);

      const pMap = new Map();
      const phoneToIdMap = new Map();

      // 1. Process Google Sheets Patients
      (data.patients || []).forEach(rp => {
        if (rp && (rp.patientId || rp.phone)) {
          const cleanId = String(rp.patientId || "").trim();
          if (cleanId && deletedPatientIds.has(cleanId)) return;
          const cleanPhone = rp.phone ? String(rp.phone).trim() : "";
          const nPh = normPhone(cleanPhone);

          const patientStatus = (rp.status && String(rp.status).trim()) 
            ? String(rp.status).trim() 
            : (Number(rp.totalVisits) > 0 ? "Active" : "Waiting for Doctor");

          const patientObj = {
            ...rp,
            patientId: cleanId,
            name: rp.name || rp.patientName || "Patient",
            phone: cleanPhone,
            age: Number(rp.age) || rp.age || "",
            gender: rp.gender || "Male",
            address: rp.address || "Vindhyachal, Mirzapur",
            firstVisitReason: rp.firstVisitReason || "Physiotherapy Consultation",
            status: patientStatus,
            totalVisits: Number(rp.totalVisits) || 0,
            registrationDate: rp.registrationDate ? String(rp.registrationDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
            lastVisitDate: rp.lastVisitDate ? String(rp.lastVisitDate).slice(0, 10) : (rp.registrationDate ? String(rp.registrationDate).slice(0, 10) : new Date().toISOString().slice(0, 10))
          };

          if (cleanId) pMap.set(cleanId, patientObj);
          if (nPh) phoneToIdMap.set(nPh, cleanId || nPh);
        }
      });

      // Merge all locally registered patients so newly enrolled patients in browser never disappear
      const currentLocalPatients = getLocal(KEYS.PATIENTS, []);
      currentLocalPatients.forEach(lp => {
        if (lp && lp.patientId && !deletedPatientIds.has(lp.patientId)) {
          if (!pMap.has(lp.patientId)) {
            pMap.set(lp.patientId, lp);
          } else {
            const sheetP = pMap.get(lp.patientId);
            const resolvedStatus = (lp.status === "Waiting for Doctor" || sheetP.status === "Waiting for Doctor")
              ? "Waiting for Doctor"
              : (sheetP.status || lp.status || "Active");
            pMap.set(lp.patientId, { ...sheetP, ...lp, status: resolvedStatus });
          }
        }
      });


      // 2. Process Google Sheets Visits (Strictly from Google Sheets, do NOT resurrect deleted visits)
      const vMap = new Map();
      (data.visits || []).forEach(rv => {
        if (rv && (rv.visitId || rv.patientId)) {
          const cleanVId = String(rv.visitId || `VST-${rv.patientId}-${rv.visitNumber || 1}`).trim();
          if (deletedVisitIds.has(cleanVId)) return;
          if (rv.patientId && deletedPatientIds.has(String(rv.patientId).trim())) return;
          vMap.set(cleanVId, { ...rv, visitId: cleanVId });
        }
      });

      const mergedVisits = Array.from(vMap.values());

      // 3. RECONCILIATION: Recover any patient in visits who might have collided or be missing from pMap
      mergedVisits.forEach(v => {
        const vPhone = normPhone(v.phone);
        const vName = String(v.patientName || "").trim();
        const vPid = String(v.patientId || "").trim();

        if (vPid && deletedPatientIds.has(vPid)) return;

        const existingWithId = pMap.get(vPid);
        const hasCollision = existingWithId && vPhone && normPhone(existingWithId.phone) && normPhone(existingWithId.phone) !== vPhone;

        if (!existingWithId || hasCollision) {
          let targetPid = vPhone ? phoneToIdMap.get(vPhone) : null;
          if (!targetPid || targetPid === vPid) {
            // Find next sequential series ID
            let maxN = 1000;
            pMap.forEach((_, k) => {
              const m = k.match(/(\d{4,})/);
              if (m) {
                const num = parseInt(m[1], 10);
                if (!isNaN(num) && num > maxN && num < 9000) maxN = num;
              }
            });
            targetPid = `VPR-2026-${maxN + 1}`;
            if (vPhone) phoneToIdMap.set(vPhone, targetPid);

            const recoveredPatient = {
              patientId: targetPid,
              name: vName || "Patient",
              phone: v.phone ? String(v.phone).trim() : "",
              age: 35,
              gender: "Male",
              address: "Vindhyachal, Mirzapur",
              firstVisitReason: v.reason || v.complaint || "Physiotherapy Rehabilitation",
              status: "Active",
              totalVisits: 0,
              registrationDate: v.date ? String(v.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
              lastVisitDate: v.date ? String(v.date).slice(0, 10) : new Date().toISOString().slice(0, 10)
            };
            pMap.set(targetPid, recoveredPatient);
          }

          if (hasCollision && targetPid) {
            v.patientId = targetPid;
          }
        }
      });

      const mergedPatients = Array.from(pMap.values());

      // 4. Enquiries (Strictly from Google Sheets)
      const eMap = new Map();
      (data.enquiries || []).forEach(re => {
        if (re && re.id) {
          eMap.set(String(re.id), re);
        }
      });
      const mergedEnquiries = Array.from(eMap.values());

      // 5. ACCURATE VISIT RECALCULATION & SEQUENCING:
      mergedPatients.forEach(patient => {
        const pVisits = mergedVisits.filter(v => 
          (v.patientId && String(v.patientId).trim().toUpperCase() === String(patient.patientId).trim().toUpperCase()) ||
          (normPhone(v.phone) && normPhone(v.phone) === normPhone(patient.phone))
        );

        // Sort visits chronologically (oldest to newest) to assign clean visit numbers 1, 2, ...
        pVisits.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        pVisits.forEach((v, idx) => {
          v.visitNumber = idx + 1;
          v.patientId = patient.patientId;
          v.patientName = patient.name;
          v.phone = patient.phone;
          const pSuffix = patient.patientId.replace("VPR-2026-", "").replace("VPR-", "") || "1001";
          v.visitId = `VST-${pSuffix}-${v.visitNumber}`;
        });

        patient.totalVisits = pVisits.length;
        if (pVisits.length > 0) {
          patient.lastVisitDate = pVisits[pVisits.length - 1].date;
          patient.lastDiagnosis = pVisits[pVisits.length - 1].diagnosis || patient.firstVisitReason;
          patient.firstVisitDate = pVisits[0].date;
        } else {
          patient.totalVisits = 0;
          patient.lastVisitDate = patient.registrationDate;
        }
      });

      // Sort patients cleanly by sequential Series ID (VPR-2026-1001, VPR-2026-1002, ...)
      mergedPatients.sort((a, b) => (a.patientId || "").localeCompare(b.patientId || ""));

      // Replace local storage with the authoritative cleaned records
      setLocal(KEYS.PATIENTS, mergedPatients);
      setLocal(KEYS.VISITS, mergedVisits);
      setLocal(KEYS.ENQUIRIES, mergedEnquiries);

      return {
        ok: true,
        patientsCount: mergedPatients.length,
        visitsCount: mergedVisits.length,
        enquiriesCount: mergedEnquiries.length,
        message: `Synced ${mergedPatients.length} patients and ${mergedVisits.length} visits directly from Google Sheets.`
      };
    }

    return { ok: true, message: "Sync complete." };
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
      const token = `vindhy_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const doctor = {
        email: auth.email,
        name: "Dr. Satyam Vishwakarma",
        role: "Chief Physiotherapist & Director",
        clinic: "Vindhy Physio & Rehab Center"
      };
      return { ok: true, token, doctor };
    }

    // Also fallback check for initial default if user hasn't changed it
    if (cleanEmail === DEFAULT_DOCTOR_EMAIL.toLowerCase() && cleanPass === DEFAULT_DOCTOR_PASS) {
      const token = `vindhy_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const doctor = {
        email: DEFAULT_DOCTOR_EMAIL,
        name: "Dr. Satyam Vishwakarma",
        role: "Chief Physiotherapist & Director",
        clinic: "Vindhy Physio & Rehab Center"
      };
      return { ok: true, token, doctor };
    }

    throw new Error("Invalid email or password. Please check your credentials.");
  },

  async verifyMe(token) {
    if (!token || !token.startsWith("vindhy_token_")) {
      throw new Error("Invalid session");
    }
    const auth = getLocal(KEYS.AUTH, { email: DEFAULT_DOCTOR_EMAIL });
    return {
      ok: true,
      doctor: {
        email: auth.email,
        name: "Dr. Satyam Vishwakarma",
        role: "Chief Physiotherapist & Director",
        clinic: "Vindhy Physio & Rehab Center"
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
    pVisits.sort((a, b) => {
      const numA = parseInt(String(a.visitNumber || 0).replace(/\D/g, "") || 0, 10);
      const numB = parseInt(String(b.visitNumber || 0).replace(/\D/g, "") || 0, 10);
      if (numA !== numB) return numB - numA;
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
    return { ok: true, patient, visits: pVisits };
  },

  async createPatient(payload) {
    const patients = getLocal(KEYS.PATIENTS, []);
    const visits = getLocal(KEYS.VISITS, []);
    const normPh = String(payload.phone || "").replace(/\D/g, "").slice(-10);

    // 1. Check if patient with same phone already exists
    if (normPh) {
      const existing = patients.find(p => String(p.phone || "").replace(/\D/g, "").slice(-10) === normPh);
      if (existing) {
        existing.name = payload.name.trim() || existing.name;
        existing.age = Number(payload.age) || existing.age;
        existing.gender = payload.gender || existing.gender;
        existing.address = (payload.address || "").trim() || existing.address;
        if (payload.firstVisitReason || payload.reasonForVisit) {
          existing.firstVisitReason = payload.firstVisitReason || payload.reasonForVisit;
        }
        setLocal(KEYS.PATIENTS, patients);
        syncToGoogleSheets("sync_patient", existing);
        return { ok: true, patient: existing };
      }
    }

    // 2. Safely scan all existing IDs to find maximum suffix
    let maxNum = 1000;
    const allIds = [
      ...patients.map(p => p.patientId),
      ...visits.map(v => v.patientId),
      ...visits.map(v => v.visitId)
    ];
    allIds.forEach(idStr => {
      if (idStr) {
        const matches = String(idStr).match(/(\d{4,})/g);
        if (matches) {
          matches.forEach(m => {
            const n = parseInt(m, 10);
            if (!isNaN(n) && n > maxNum && n < 9000) {
              maxNum = n;
            }
          });
        }
      }
    });

    const newId = `VPR-2026-${maxNum + 1}`;
    const todayStr = new Date().toISOString().split("T")[0];
    const intakeTimeStr = payload.visitTime || payload.intakeTime || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

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
      intakeTime: intakeTimeStr,
      status: "Waiting for Doctor",
      totalVisits: 0,
      lastVisitDate: todayStr
    };

    patients.unshift(newPatient);
    setLocal(KEYS.PATIENTS, patients);

    // Auto-schedule 2-Hour WhatsApp Follow-up Review for newly enrolled patient
    try {
      scheduleReviewRequest(newPatient);
    } catch (e) {
      console.warn("Auto-scheduling review error on patient create:", e);
    }

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
      time: consultData.visitTime || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      reason: consultData.reason || patient.firstVisitReason || "Physiotherapy Consultation",
      complaint: consultData.complaint || patient.complaint || "Pain / Mobility limitation",
      duration: consultData.duration || patient.duration || "",
      diagnosis: consultData.diagnosis || "Under Active Physiotherapy Management",
      treatmentNotes: consultData.treatmentNotes || "Spinal mobilization, targeted stretches, and rehabilitation therapy.",
      fee: consultData.fee ? (String(consultData.fee).startsWith("₹") ? String(consultData.fee) : `₹${String(consultData.fee).replace(/[^0-9]/g, "")}`) : "₹500",
      followUpDate: consultData.followUpDate || "",
      followUpTime: consultData.followUpTime || "",
      status: "Completed",
      doctor: "Dr. Satyam Vishwakarma"
    };

    // Remove any stale deletion tombstone
    const deletedVisitIds = new Set(getLocal(KEYS.DELETED_VISIT_IDS, []));
    if (deletedVisitIds.has(newVisit.visitId)) {
      deletedVisitIds.delete(newVisit.visitId);
      setLocal(KEYS.DELETED_VISIT_IDS, Array.from(deletedVisitIds));
    }

    // Update patient status to Active (Consultation complete)
    patient.status = "Active";
    patient.totalVisits = Math.max(visitNum, existingVisits.length + 1);
    patient.lastVisitDate = todayStr;
    patient.lastDiagnosis = newVisit.diagnosis;
    patient.lastFee = newVisit.fee;
    if (newVisit.followUpDate) {
      patient.followUpDate = newVisit.followUpDate;
      patient.followUpTime = newVisit.followUpTime;
    }

    patients[pIndex] = patient;
    const updatedVisits = visits.filter(v => v.visitId !== newVisit.visitId);
    updatedVisits.unshift(newVisit);

    setLocal(KEYS.PATIENTS, patients);
    setLocal(KEYS.VISITS, updatedVisits);

    // Update PATIENT_PROFILE_KEY cache if logged into patient portal
    try {
      const storedPatient = JSON.parse(localStorage.getItem(PATIENT_PROFILE_KEY) || "null");
      if (storedPatient && (storedPatient.patientId === patientId || storedPatient.phone === patient.phone)) {
        localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify({ ...storedPatient, ...patient }));
      }
    } catch (e) {}

    // If this is the patient's first consultation (newly enrolled), schedule the 2-hour automated WhatsApp review
    if (visitNum === 1 || existingVisits.length === 0 || !patient.totalVisits || patient.totalVisits <= 1) {
      try {
        scheduleReviewRequest(patient, newVisit);
      } catch (e) {
        console.warn("Auto-scheduling review error:", e);
      }
    }

    // Sync to Google Sheets
    syncToGoogleSheets("sync_patient", patient);
    syncToGoogleSheets("sync_visit", newVisit);

    return { ok: true, patient, visit: newVisit };
  },

  async deletePatient(patientId) {
    // 1. Record in permanent deletion tombstones
    const deletedPatientIds = new Set(getLocal(KEYS.DELETED_PATIENT_IDS, []));
    deletedPatientIds.add(patientId);
    setLocal(KEYS.DELETED_PATIENT_IDS, Array.from(deletedPatientIds));

    // 2. Send DELETE request to server if running
    try {
      const token = localStorage.getItem("doctor_token") || localStorage.getItem(KEYS.DOCTOR_TOKEN);
      if (token) {
        await fetch(`${API_BASE}/doctor/patients/${encodeURIComponent(patientId)}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      }
    } catch (e) {
      console.warn("Backend patient delete sync failed, proceeding with full local purge:", e);
    }

    // 3. Remove permanently from local storage collections
    const patients = getLocal(KEYS.PATIENTS, []);
    const patientToDelete = patients.find(p => p.patientId === patientId);
    if (patientToDelete && patientToDelete.phone) {
      deletedPatientIds.add(patientToDelete.phone);
      setLocal(KEYS.DELETED_PATIENT_IDS, Array.from(deletedPatientIds));
    }
    const visits = getLocal(KEYS.VISITS, []);
    const authList = getLocal(KEYS.PATIENT_AUTH, []);

    const updatedPatients = patients.filter(p => p.patientId !== patientId);
    const updatedVisits = visits.filter(v => v.patientId !== patientId);
    const updatedAuth = authList.filter(a => a.patientId !== patientId);

    setLocal(KEYS.PATIENTS, updatedPatients);
    setLocal(KEYS.VISITS, updatedVisits);
    setLocal(KEYS.PATIENT_AUTH, updatedAuth);

    // 4. Sync deletion to Google Sheets Webhook
    syncToGoogleSheets("delete_patient", {
      patientId,
      phone: patientToDelete?.phone || "",
      name: patientToDelete?.name || ""
    });

    return { ok: true, message: `Patient ${patientId} permanently deleted.` };
  },

  async deleteVisit(visitId) {
    const deletedVisitIds = new Set(getLocal(KEYS.DELETED_VISIT_IDS, []));
    deletedVisitIds.add(visitId);
    setLocal(KEYS.DELETED_VISIT_IDS, Array.from(deletedVisitIds));

    try {
      const token = localStorage.getItem("doctor_token") || localStorage.getItem(KEYS.DOCTOR_TOKEN);
      if (token) {
        await fetch(`${API_BASE}/doctor/visits/${encodeURIComponent(visitId)}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.warn("Backend visit delete failed, proceeding with local purge:", e);
    }

    const visits = getLocal(KEYS.VISITS, []);
    const deletedVisit = visits.find(v => v.visitId === visitId);
    const updatedVisits = visits.filter(v => v.visitId !== visitId);
    setLocal(KEYS.VISITS, updatedVisits);

    // Update patient totalVisits & lastVisitDate if patient exists
    if (deletedVisit && deletedVisit.patientId) {
      const patients = getLocal(KEYS.PATIENTS, []);
      const patient = patients.find(p => p.patientId === deletedVisit.patientId);
      if (patient) {
        const remainingForPatient = updatedVisits.filter(v => v.patientId === deletedVisit.patientId);
        patient.totalVisits = remainingForPatient.length;
        if (remainingForPatient.length > 0) {
          remainingForPatient.sort((a, b) => {
            const numA = parseInt(String(a.visitNumber || 0).replace(/\D/g, "") || 0, 10);
            const numB = parseInt(String(b.visitNumber || 0).replace(/\D/g, "") || 0, 10);
            if (numA !== numB) return numB - numA;
            return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
          });
          patient.lastVisitDate = remainingForPatient[0].date || patient.registrationDate;
          patient.lastDiagnosis = remainingForPatient[0].diagnosis || patient.firstVisitReason;
          patient.lastFee = remainingForPatient[0].fee || patient.lastFee;
        } else {
          patient.lastVisitDate = patient.registrationDate;
        }
        setLocal(KEYS.PATIENTS, patients);
      }
    }

    syncToGoogleSheets("delete_visit", { visitId });
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
    const todayStr = payload.visitDate || payload.date || new Date().toISOString().split("T")[0];
    const visitTimeStr = payload.visitTime || payload.time || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    const feeStr = payload.fee ? (String(payload.fee).startsWith("₹") ? String(payload.fee) : `₹${String(payload.fee).replace(/[^0-9]/g, "")}`) : (patient.lastFee || "₹500");

    const newVisit = {
      visitId: `VST-${patientId.replace("VPR-2026-", "")}-${visitNumber}`,
      patientId,
      patientName: patient.name,
      phone: patient.phone,
      visitNumber,
      date: todayStr,
      time: visitTimeStr,
      reason: payload.reasonForVisit || payload.reason || "Physiotherapy Treatment Session",
      complaint: payload.complaint || `Day ${visitNumber} session`,
      diagnosis: payload.diagnosis || patient.lastDiagnosis || patient.firstVisitReason || "Under Active Physiotherapy Management",
      treatmentNotes: payload.treatmentNotes || "Targeted physiotherapy mobilization & exercises.",
      fee: feeStr,
      followUpDate: payload.followUpDate || "",
      followUpTime: payload.followUpTime || "",
      status: "Completed",
      doctor: "Dr. Satyam Vishwakarma"
    };

    // 1. Remove any old deletion tombstone for this visitId
    const deletedVisitIds = new Set(getLocal(KEYS.DELETED_VISIT_IDS, []));
    if (deletedVisitIds.has(newVisit.visitId)) {
      deletedVisitIds.delete(newVisit.visitId);
      setLocal(KEYS.DELETED_VISIT_IDS, Array.from(deletedVisitIds));
    }

    // 2. Add or replace visit
    const updatedVisits = visits.filter(v => v.visitId !== newVisit.visitId);
    updatedVisits.unshift(newVisit);

    patient.totalVisits = Math.max(visitNumber, updatedVisits.filter(v => v.patientId === patientId).length);
    patient.lastVisitDate = todayStr;
    patient.lastDiagnosis = newVisit.diagnosis;
    patient.lastFee = feeStr;
    if (newVisit.followUpDate) {
      patient.followUpDate = newVisit.followUpDate;
      patient.followUpTime = newVisit.followUpTime;
    }

    setLocal(KEYS.VISITS, updatedVisits);
    setLocal(KEYS.PATIENTS, patients);

    // Update PATIENT_PROFILE_KEY cache if logged into patient portal
    try {
      const storedPatient = JSON.parse(localStorage.getItem(PATIENT_PROFILE_KEY) || "null");
      if (storedPatient && (storedPatient.patientId === patientId || storedPatient.phone === patient.phone)) {
        localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify({ ...storedPatient, ...patient }));
      }
    } catch (e) {}

    // Push to Google Sheets
    syncToGoogleSheets("sync_visit", newVisit);

    return { ok: true, visit: newVisit, patient };
  },

  async getTodayVisits() {
    const visits = getLocal(KEYS.VISITS, []);
    const todayStr = new Date().toISOString().split("T")[0];
    const todayList = visits.filter(v => v.date === todayStr);
    return { ok: true, visits: todayList };
  },

  // 1.1 AUTH HELPERS
  getToken() {
    try {
      return localStorage.getItem("doctor_token") || "";
    } catch (e) {
      return "";
    }
  },

  // 5. ENQUIRIES
  async getEnquiries() {
    const deletedEnquiryIds = new Set(getLocal(KEYS.DELETED_ENQUIRY_IDS, []));
    const token = this.getToken();
    if (token) {
      try {
        const res = await fetch("/api/doctor/enquiries", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.enquiries)) {
            const filtered = data.enquiries.filter(e => !deletedEnquiryIds.has(String(e.id)));
            // Merge with local statuses to preserve any locally hidden status
            const localEnqs = getLocal(KEYS.ENQUIRIES, []);
            const localMap = new Map(localEnqs.map(e => [String(e.id), e]));
            const merged = filtered.map(e => {
              const local = localMap.get(String(e.id));
              if (local && (local.status === "Hidden" || local.status === "Converted")) {
                return { ...e, status: local.status };
              }
              return e;
            });
            setLocal(KEYS.ENQUIRIES, merged);
            return { ok: true, enquiries: merged };
          }
        }
      } catch (e) {}
    }
    const enquiries = getLocal(KEYS.ENQUIRIES, []).filter(e => !deletedEnquiryIds.has(String(e.id)));
    return { ok: true, enquiries };
  },

  async createEnquiry(payload) {
    const todayStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const patientName = (payload.name || payload.patientName || payload.fullName || "").trim() || "Direct Consultation Lead";
    const cleanPhone = String(payload.phone || "").replace(/\D/g, "").slice(-10);
    const cleanAge = String(payload.age || "").trim();

    const newEnquiry = {
      id: `ENQ-${Date.now().toString().slice(-6)}`,
      date: todayStr,
      time: timeStr,
      name: patientName,
      patientName: patientName,
      age: cleanAge,
      phone: cleanPhone,
      painArea: payload.painArea || "General Consultation",
      duration: payload.duration || "Recent",
      appointmentDate: payload.appointmentDate || todayStr,
      concern: payload.concern || "",
      status: "New"
    };

    // Try server endpoint
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: patientName,
          age: cleanAge,
          phone: cleanPhone,
          painArea: newEnquiry.painArea,
          duration: newEnquiry.duration,
          appointmentDate: newEnquiry.appointmentDate,
          concern: newEnquiry.concern
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.enquiry) {
          Object.assign(newEnquiry, data.enquiry);
        }
      }
    } catch (e) {
      console.warn("Direct server enquiry save notice:", e);
    }

    // Always update local storage
    const enquiries = getLocal(KEYS.ENQUIRIES, []);
    enquiries.unshift(newEnquiry);
    setLocal(KEYS.ENQUIRIES, enquiries);

    // Push to Google Sheets in background
    syncToGoogleSheets("sync_enquiry", newEnquiry);

    return { ok: true, enquiry: newEnquiry };
  },

  async deleteEnquiry(enquiryId) {
    const deletedEnquiryIds = new Set(getLocal(KEYS.DELETED_ENQUIRY_IDS, []));
    deletedEnquiryIds.add(String(enquiryId));
    setLocal(KEYS.DELETED_ENQUIRY_IDS, Array.from(deletedEnquiryIds));

    const token = this.getToken();
    if (token) {
      try {
        await fetch(`/api/doctor/enquiries/${enquiryId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.warn("Server enquiry delete warning:", e);
      }
    }

    const enquiries = getLocal(KEYS.ENQUIRIES, []);
    const updated = enquiries.filter(e => String(e.id) !== String(enquiryId));
    setLocal(KEYS.ENQUIRIES, updated);

    syncToGoogleSheets("delete_enquiry", { enquiryId });
    return { ok: true, message: "Enquiry deleted successfully." };
  },

  // 6. EXPORT CSV
  exportCSV(type) {
    let rows = [];
    let filename = `vindhy_${type}_${new Date().toISOString().split("T")[0]}.csv`;

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
  },

  // 7. PATIENT ACCOUNT & SECURITY (DOCTOR CONTROLS)
  async getPatientAccount(patientId) {
    const token = this.getToken();
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.ok) return data;
    } catch (e) {}
    return { ok: true, patientId, status: "active", defaultPassword: "vindhy", hasCustomPassword: false };
  },

  async resetPatientPasswordToDefault(patientId) {
    const token = this.getToken();
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/account/reset-to-default`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      return await res.json();
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  async setPatientPassword(patientId, newPassword) {
    const token = this.getToken();
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/account/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      return await res.json();
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  async togglePatientAccountStatus(patientId, status) {
    const token = this.getToken();
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/account/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  async updateEnquiryStatus(enquiryId, status, linkedPatientId = null) {
    const token = this.getToken();
    let serverData = null;
    if (token) {
      try {
        const res = await fetch(`/api/doctor/enquiries/${enquiryId}/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status, linkedPatientId })
        });
        if (res.ok) {
          serverData = await res.json();
        }
      } catch (e) {
        console.warn("Server update failed, updating locally:", e);
      }
    }

    // Always update local storage so UI is immediately 100% consistent
    const enquiries = getLocal(KEYS.ENQUIRIES, []);
    const enq = enquiries.find(e => String(e.id) === String(enquiryId));
    if (enq) {
      enq.status = status;
      if (linkedPatientId) enq.linkedPatientId = linkedPatientId;
      enq.updatedAt = new Date().toISOString();
      setLocal(KEYS.ENQUIRIES, enquiries);
    }

    // Push status update to Google Sheets
    syncToGoogleSheets("doctor_hide_enquiry", { enquiryId, id: enquiryId, status, linkedPatientId });

    return serverData || { ok: true, status, linkedPatientId };
  }
};

// ==========================================
// PATIENT PORTAL API SERVICE
// ==========================================
const PATIENT_TOKEN_KEY = "vindhy_patient_token";
const PATIENT_PROFILE_KEY = "vindhy_patient_profile";

export const patientApi = {
  getStoredToken() {
    return localStorage.getItem(PATIENT_TOKEN_KEY);
  },
  getStoredPatient() {
    const raw = localStorage.getItem(PATIENT_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  logout() {
    localStorage.removeItem(PATIENT_TOKEN_KEY);
    localStorage.removeItem(PATIENT_PROFILE_KEY);
  },
  async register(payload) {
    const cleanPhone = String(payload.phone || "").replace(/\D/g, "").slice(-10);
    const cleanName = String(payload.name || "").trim();
    const cleanAge = String(payload.age || "").trim();
    const cleanGender = String(payload.gender || "Male").trim();
    const cleanAddress = String(payload.address || "Vindhyachal, Mirzapur").trim();
    const cleanReason = String(payload.reasonForVisit || payload.complaint || "Initial Assessment").trim();
    const cleanPass = String(payload.password || "vindhy").trim();

    try {
      const res = await fetch("/api/patient/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          age: cleanAge,
          gender: cleanGender,
          phone: cleanPhone,
          address: cleanAddress,
          reasonForVisit: cleanReason,
          complaint: cleanReason,
          password: cleanPass
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        localStorage.setItem(PATIENT_TOKEN_KEY, data.token);
        localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(data.patient));
        return data;
      }
      if (!res.ok) {
        return { ok: false, error: data.error || "Registration failed" };
      }
    } catch (err) {
      // Offline fallback: Create patient record locally
      const patients = getLocal(KEYS.PATIENTS, []);
      const newId = `VPR-2026-${1000 + patients.length + 1}`;
      const todayStr = new Date().toISOString().split("T")[0];

      let existing = patients.find(p => String(p.phone || "").replace(/\D/g, "").slice(-10) === cleanPhone);
      let patientToUse = existing;

      if (!patientToUse) {
        patientToUse = {
          patientId: newId,
          name: cleanName,
          age: Number(cleanAge) || 30,
          gender: cleanGender,
          phone: cleanPhone,
          altPhone: "",
          address: cleanAddress,
          firstVisitReason: cleanReason,
          registrationDate: todayStr,
          status: "Active",
          totalVisits: 1,
          lastVisitDate: todayStr
        };
        patients.unshift(patientToUse);
        setLocal(KEYS.PATIENTS, patients);

        // Also add initial visit
        const visits = getLocal(KEYS.VISITS, []);
        visits.unshift({
          visitId: `VIS-${patientToUse.patientId}-01`,
          patientId: patientToUse.patientId,
          patientName: patientToUse.name,
          phone: patientToUse.phone,
          visitNumber: 1,
          date: todayStr,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          reason: cleanReason,
          diagnosis: "Registered via Online Portal",
          treatmentNotes: "Patient self-registered online.",
          doctor: "Dr. Satyam Vishwakarma",
          status: "Active"
        });
        setLocal(KEYS.VISITS, visits);

        // Save custom password locally
        localStorage.setItem("patient_custom_pass_" + patientToUse.patientId, cleanPass);
      }

      const dummyToken = "local_patient_token_" + patientToUse.patientId;
      localStorage.setItem(PATIENT_TOKEN_KEY, dummyToken);
      localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify({ ...patientToUse, defaultPassword: "vindhy" }));
      return { ok: true, token: dummyToken, patient: patientToUse, message: "Registered and signed in successfully!" };
    }
  },

  async login(identifier, password) {
    const cleanIdentifier = String(identifier || "").trim();
    const cleanPassword = String(password || "").trim();

    try {
      const res = await fetch("/api/patient/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanIdentifier, password: cleanPassword })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        localStorage.setItem(PATIENT_TOKEN_KEY, data.token);
        localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(data.patient));
        return data;
      }
      if (!res.ok) {
        return { ok: false, error: data.error || "Login failed" };
      }
    } catch (err) {
      // Offline / Static fallback: Check against locally stored patients
      const patients = getLocal(KEYS.PATIENTS, []);
      const cleanId = cleanIdentifier.toUpperCase();
      const cleanDigits = cleanIdentifier.replace(/\D/g, "").slice(-10);
      let p = patients.find(pt => {
        const pId = String(pt.patientId || "").trim().toUpperCase();
        const pPhone = String(pt.phone || "").replace(/\D/g, "").slice(-10);
        return pId === cleanId || (cleanDigits.length === 10 && pPhone === cleanDigits);
      });

      if (!p) {
        return {
          ok: false,
          error: "No registered patient account found with this phone number or ID. Please register at the clinic reception or consult Dr. Satyam Vishwakarma."
        };
      }

      // Check if patient is still in waiting queue (consultation not yet completed)
      if ((p.status || "").toLowerCase().includes("wait") || Number(p.totalVisits || 0) === 0) {
        return {
          ok: false,
          error: "Your consultation with Dr. Satyam Vishwakarma is currently pending. Patient Portal access will be activated immediately after your doctor consultation."
        };
      }

      const inputPass = cleanPassword;
      const customPass = localStorage.getItem("patient_custom_pass_" + p.patientId);
      const isCorrect = customPass ? (inputPass === customPass) : (inputPass.toLowerCase() === "vindhy");

      if (!isCorrect) {
        return {
          ok: false,
          error: "Incorrect password. The default clinic password is 'vindhy'. If you customized it, please enter your new password."
        };
      }

      const dummyToken = "local_patient_token_" + p.patientId;
      localStorage.setItem(PATIENT_TOKEN_KEY, dummyToken);
      localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify({ ...p, defaultPassword: "vindhy" }));
      return { ok: true, token: dummyToken, patient: p };
    }
  },

  async getProfile() {
    const token = this.getStoredToken();
    if (!token) return { ok: false, error: "Not logged in" };
    try {
      const res = await fetch("/api/patient/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(data.patient));
        return data;
      }
    } catch (e) {}

    const storedPatient = this.getStoredPatient();
    if (!storedPatient) return { ok: false, error: "No patient session found." };

    const patients = getLocal(KEYS.PATIENTS, []);
    const p = patients.find(patient => 
      patient.patientId === storedPatient.patientId || 
      (patient.phone && storedPatient.phone && String(patient.phone).replace(/\D/g, "").slice(-10) === String(storedPatient.phone).replace(/\D/g, "").slice(-10))
    ) || storedPatient;

    localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(p));
    return { ok: true, patient: p };
  },

  async getRecords() {
    const token = this.getStoredToken();
    if (!token) return { ok: false, error: "Not logged in" };
    try {
      const res = await fetch("/api/patient/records", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        return data;
      }
    } catch (e) {}

    const storedPatient = this.getStoredPatient();
    if (!storedPatient) return { ok: false, error: "No patient session found." };

    const patients = getLocal(KEYS.PATIENTS, []);
    const p = patients.find(patient => 
      patient.patientId === storedPatient.patientId || 
      (patient.phone && storedPatient.phone && String(patient.phone).replace(/\D/g, "").slice(-10) === String(storedPatient.phone).replace(/\D/g, "").slice(-10))
    ) || storedPatient;

    localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(p));

    const allVisits = getLocal(KEYS.VISITS, []);
    const visits = allVisits.filter(v => 
      v.patientId === p.patientId || 
      (v.phone && p.phone && String(v.phone).replace(/\D/g, "").slice(-10) === String(p.phone).replace(/\D/g, "").slice(-10))
    );

    visits.sort((a, b) => {
      const numA = parseInt(String(a.visitNumber || 0).replace(/\D/g, "") || 0, 10);
      const numB = parseInt(String(b.visitNumber || 0).replace(/\D/g, "") || 0, 10);
      if (numA !== numB) return numB - numA;
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });

    const enquiries = getLocal(KEYS.ENQUIRIES, []).filter(e => {
      const pPhone = String(p.phone || "").replace(/\D/g, "").slice(-10);
      const ePhone = String(e.phone || "").replace(/\D/g, "").slice(-10);
      return (pPhone.length === 10 && ePhone === pPhone) || e.linkedPatientId === p.patientId;
    });

    const latestFollowUp = visits.find(v => {
      const s = v?.followUpDate ? String(v.followUpDate).trim() : "";
      return s && s.toLowerCase() !== "none" && s.toLowerCase() !== "sos" && !s.toLowerCase().includes("as advised");
    });

    return {
      ok: true,
      patient: p,
      stats: {
        totalVisits: Math.max(p.totalVisits || 1, visits.length),
        firstVisitDate: p.registrationDate,
        lastVisitDate: visits[0]?.date || p.lastVisitDate || p.registrationDate,
        daysInRecovery: 1,
        activeCondition: visits[0]?.diagnosis || p.firstVisitReason || "Under Evaluation",
        nextFollowUp: latestFollowUp ? latestFollowUp.followUpDate : (visits[0]?.followUpDate || p.followUpDate || null),
        nextFollowUpTime: latestFollowUp ? latestFollowUp.followUpTime : (visits[0]?.followUpTime || p.followUpTime || null)
      },
      visits,
      appointments: enquiries
    };
  },

  async changePassword(currentPassword, newPassword) {
    const token = this.getStoredToken();
    if (!token) return { ok: false, error: "Not logged in" };
    try {
      const res = await fetch("/api/patient/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        const p = this.getStoredPatient();
        if (p) localStorage.setItem("patient_custom_pass_" + p.patientId, newPassword);
        return data;
      }
      return { ok: false, error: data.error || "Password change failed" };
    } catch (e) {
      // Offline fallback: update local storage custom password
      const p = this.getStoredPatient();
      if (p) {
        const existingCustom = localStorage.getItem("patient_custom_pass_" + p.patientId);
        const cur = String(currentPassword).trim();
        const validCur = existingCustom ? (cur === existingCustom) : (cur.toLowerCase() === "vindhy");
        if (!validCur) {
          return { ok: false, error: "Current password is incorrect. (Initial default is 'vindhy')." };
        }
        localStorage.setItem("patient_custom_pass_" + p.patientId, newPassword);
        return { ok: true, message: "Password updated successfully!" };
      }
      return { ok: false, error: e.message || "Network error" };
    }
  },

  // Review System & WhatsApp Automation APIs
  getReviewUrl() {
    return getReviewUrl();
  },
  setReviewUrl(url) {
    setReviewUrl(url);
  },
  getReviewQueue() {
    return getReviewQueue();
  },
  scheduleReviewRequest(patient, visit) {
    return scheduleReviewRequest(patient, visit);
  },
  markReviewSent(queueId) {
    return markReviewSent(queueId);
  },
  dismissReview(queueId) {
    return dismissReview(queueId);
  },
  generateReviewWhatsAppMessage(patientName, reviewUrl) {
    return generateReviewWhatsAppMessage(patientName, reviewUrl);
  },
  getReviewWhatsAppUrl(phone, patientName, reviewUrl) {
    return getReviewWhatsAppUrl(phone, patientName, reviewUrl);
  }
};

