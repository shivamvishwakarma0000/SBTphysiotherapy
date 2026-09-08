// =============================================================================
// VINDHYA PHYSIO & REHAB CENTER — MASTER CLOUD DATABASE & SECURE API ENGINE
// Clinic: Vindhya Physio & Rehab Center (Dr. Satyam Vishwakarma)
// Location: Amravati Chauraha, Vindhyachal, Mirzapur, Uttar Pradesh
// Authorized Doctor Account: shivamupsc8@gmail.com
// Version: 3.1.0 — Unified Patient Portal + Doctor Portal + Google Sheets Engine
// Source of Truth: Google Sheets (Version 1 Primary Database)
// =============================================================================

// Configuration & Secrets
var AUTHORIZED_DOCTOR_EMAIL = "shivamupsc8@gmail.com";
var SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30-Day persistent session
var SPREADSHEET_URL = ""; // Optional: If running as standalone script, paste Sheet URL here, or leave blank to auto-detect

/**
 * 1. UNIVERSAL SPREADSHEET RESOLVER
 * Automatically binds to the active spreadsheet or discovers it in Google Drive.
 */
function getDatabaseSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;

  if (SPREADSHEET_URL && SPREADSHEET_URL.trim() !== "") {
    var trimmed = SPREADSHEET_URL.trim();
    if (trimmed.indexOf("http") === 0) {
      return SpreadsheetApp.openByUrl(trimmed);
    }
    return SpreadsheetApp.openById(trimmed);
  }

  try {
    var files = DriveApp.getFilesByName("Vindhya Physio & Rehab Database");
    if (files.hasNext()) {
      return SpreadsheetApp.open(files.next());
    }
  } catch (e) {}

  return SpreadsheetApp.create("Vindhya Physio & Rehab Database");
}

/**
 * 2. DATABASE INITIALIZER & SCHEMA FORMATTER
 * Safely creates missing tabs and appends new columns WITHOUT destroying or shifting existing data.
 */
function setupDatabase() {
  var ss = getDatabaseSpreadsheet();

  // Tab 1: PATIENTS
  var patientSheet = ss.getSheetByName("PATIENTS") || ss.insertSheet("PATIENTS");
  var patientHeaders = [
    "Patient ID", "Registration Date", "Patient Name", "Age", "Gender", 
    "Phone", "Alternate Phone", "Address", "Date of Birth", "Emergency Contact", 
    "Reason for Visit", "Status", "Created At", "Updated At"
  ];
  ensureSheetHeaders(patientSheet, patientHeaders, "#071927", "#10b981");

  // Tab 2: VISITS
  var visitSheet = ss.getSheetByName("VISITS") || ss.insertSheet("VISITS");
  var visitHeaders = [
    "Visit ID", "Patient ID", "Patient Name", "Phone", "Visit Number", 
    "Date", "Time", "Reason for Visit", "Complaint", "Diagnosis", 
    "Treatment / Notes", "Follow-up Date", "Status", "Doctor",
    "Appointment ID", "Amount", "Patient Visible", "Created At", "Updated At"
  ];
  ensureSheetHeaders(visitSheet, visitHeaders, "#071927", "#f59e0b");

  // Tab 3: ENQUIRIES
  var enquirySheet = ss.getSheetByName("ENQUIRIES") || ss.insertSheet("ENQUIRIES");
  var enquiryHeaders = [
    "Enquiry ID", "Date", "Time", "Patient Name", "Phone Number", 
    "Condition / Pain Area", "Duration", "Preferred Date", "Symptoms & Message",
    "Status", "Converted Patient ID", "Internal Notes", "Created At", "Updated At"
  ];
  ensureSheetHeaders(enquirySheet, enquiryHeaders, "#071927", "#38bdf8");

  // Tab 4: PATIENT_AUTH (Authentication & Recovery Credentials — Protected)
  var authSheet = ss.getSheetByName("PATIENT_AUTH") || ss.insertSheet("PATIENT_AUTH");
  var authHeaders = [
    "Patient ID", "Login Identifier", "Password Hash", "Password Salt", 
    "Recovery PIN", "Account Status", "Last Login", "Created At", "Updated At"
  ];
  ensureSheetHeaders(authSheet, authHeaders, "#071927", "#a855f7");

  // Tab 5: APPOINTMENTS
  var apptSheet = ss.getSheetByName("APPOINTMENTS") || ss.insertSheet("APPOINTMENTS");
  var apptHeaders = [
    "Appointment ID", "Patient ID", "Date", "Time", "Type", 
    "Status", "Notes", "Created At", "Updated At"
  ];
  ensureSheetHeaders(apptSheet, apptHeaders, "#071927", "#06b6d4");

  // Tab 6: RECEIPTS
  var receiptSheet = ss.getSheetByName("RECEIPTS") || ss.insertSheet("RECEIPTS");
  var receiptHeaders = [
    "Receipt ID", "Patient ID", "Visit ID", "Date", "Amount", 
    "Payment Method", "Payment Status", "Receipt URL", "Created At"
  ];
  ensureSheetHeaders(receiptSheet, receiptHeaders, "#071927", "#10b981");

  // Tab 7: TREATMENT_PLANS
  var planSheet = ss.getSheetByName("TREATMENT_PLANS") || ss.insertSheet("TREATMENT_PLANS");
  var planHeaders = [
    "Plan ID", "Patient ID", "Treatment Plan", "Start Date", 
    "Status", "Patient Visible", "Created At", "Updated At"
  ];
  ensureSheetHeaders(planSheet, planHeaders, "#071927", "#3b82f6");

  // Tab 8: AUDIT_LOG
  var auditSheet = ss.getSheetByName("AUDIT_LOG") || ss.insertSheet("AUDIT_LOG");
  var auditHeaders = [
    "Timestamp", "User Type", "User ID", "Action", "Patient ID", "Result", "Metadata"
  ];
  ensureSheetHeaders(auditSheet, auditHeaders, "#071927", "#94a3b8");

  // Clean default Sheet1 if empty
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  Logger.log("✅ Database initialized successfully: " + ss.getUrl());
}

/**
 * Ensures header row exists without destroying existing data.
 */
function ensureSheetHeaders(sheet, expectedHeaders, bgColor, fontColor) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
  } else {
    var existingHeaders = sheet.getRange(1, 1, 1, Math.max(1, lastCol)).getValues()[0];
    for (var i = 0; i < expectedHeaders.length; i++) {
      if (existingHeaders.indexOf(expectedHeaders[i]) === -1) {
        sheet.getRange(1, lastCol + 1).setValue(expectedHeaders[i]);
        lastCol++;
      }
    }
  }

  sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .setBackground(bgColor)
    .setFontColor(fontColor)
    .setFontWeight("bold")
    .setFontSize(10);
  sheet.setFrozenRows(1);
}

// =============================================================================
// 3. SECURITY, CRYPTOGRAPHY & HELPER UTILITIES
// =============================================================================

function normalizePhone(phone) {
  var digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.indexOf("91") === 0) return digits.substring(2);
  if (digits.length === 11 && digits.indexOf("0") === 0) return digits.substring(1);
  if (digits.length === 10) return digits;
  return digits.slice(-10);
}

function generateRecoveryPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function generateSalt() {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(Math.random() + Date.now()))).substring(0, 16);
}

function hashPassword(password, salt) {
  var combined = password + ":" + salt;
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, combined, Utilities.Charset.UTF_8);
  var hex = "";
  for (var i = 0; i < rawHash.length; i++) {
    var b = (rawHash[i] < 0 ? rawHash[i] + 256 : rawHash[i]).toString(16);
    hex += (b.length === 1 ? "0" + b : b);
  }
  return hex;
}

function createSessionToken(patientId) {
  var payload = {
    patientId: patientId,
    role: "patient",
    expiresAt: Date.now() + SESSION_DURATION_MS,
    nonce: Utilities.getUuid()
  };
  var jsonStr = JSON.stringify(payload);
  var signature = Utilities.base64Encode(Utilities.computeHmacSha256Signature(jsonStr, AUTHORIZED_DOCTOR_EMAIL));
  return Utilities.base64EncodeWebSafe(jsonStr) + "." + Utilities.base64EncodeWebSafe(signature);
}

function verifySessionToken(token) {
  if (!token || token.indexOf(".") === -1) return null;
  try {
    var parts = token.split(".");
    var jsonStr = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
    var sig = parts[1];
    var expectedSig = Utilities.base64EncodeWebSafe(Utilities.base64Encode(Utilities.computeHmacSha256Signature(jsonStr, AUTHORIZED_DOCTOR_EMAIL)));
    if (sig !== expectedSig) return null;

    var payload = JSON.parse(jsonStr);
    if (!payload.expiresAt || Date.now() > payload.expiresAt) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

function logAudit(userType, userId, action, patientId, result, meta) {
  try {
    var ss = getDatabaseSpreadsheet();
    var sheet = ss.getSheetByName("AUDIT_LOG");
    if (sheet) {
      sheet.appendRow([
        new Date().toISOString(),
        userType || "UNKNOWN",
        userId || "N/A",
        action || "N/A",
        patientId || "N/A",
        result || "SUCCESS",
        meta ? JSON.stringify(meta) : ""
      ]);
    }
  } catch (e) {}
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(code, message) {
  return jsonResponse({
    success: false,
    ok: false,
    errorCode: code,
    message: message,
    error: message
  });
}

function successResponse(data, message) {
  var res = {
    success: true,
    ok: true,
    message: message || "Operation completed successfully"
  };
  if (data !== undefined && data !== null) {
    res.data = data;
    if (typeof data === "object" && !Array.isArray(data)) {
      for (var k in data) {
        if (data.hasOwnProperty(k) && !res.hasOwnProperty(k)) {
          res[k] = data[k];
        }
      }
    }
  }
  return jsonResponse(res);
}

// =============================================================================
// 4. HTTP GET DISPATCHER
// =============================================================================

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || "ping";
    var ss = getDatabaseSpreadsheet();

    // 1. Health check
    if (action === "ping" || action === "health") {
      return successResponse({
        service: "vindhya-sheets-api",
        leadDoctor: "Dr. Satyam Vishwakarma",
        timestamp: new Date().toISOString()
      }, "Google Sheets Cloud Engine is Online!");
    }

    // 2. Doctor: Pull full database (Patients, Visits, Enquiries)
    if (action === "fetchAll") {
      return handleDoctorFetchAll(ss);
    }

    // 3. Doctor: Search Patient
    if (action === "doctor_patient_search") {
      return handleDoctorPatientSearch(ss, params.query);
    }

    // 4. Doctor: Get Single Patient Full Clinical Profile
    if (action === "doctor_get_patient") {
      return handleDoctorGetPatientDetails(ss, params.patientId);
    }

    // 5. Patient Protected Endpoints (Session Token verification)
    if (action.indexOf("patient_") === 0) {
      var token = params.sessionToken || params.token;
      var session = verifySessionToken(token);
      if (!session) {
        return errorResponse("AUTH_REQUIRED", "Active patient session token required.");
      }
      return handlePatientGetAction(ss, session.patientId, action, params);
    }

    return errorResponse("UNKNOWN_ACTION", "Requested action not recognized.");
  } catch (err) {
    return errorResponse("SERVER_ERROR", err.toString());
  }
}

// =============================================================================
// 5. HTTP POST DISPATCHER
// =============================================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // Concurrency guard against race conditions

    var rawContent = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var payload = JSON.parse(rawContent);
    var action = payload.action;
    var data = payload.data || {};
    var ss = getDatabaseSpreadsheet();

    // 1. PUBLIC ACTIONS (No authentication required)
    if (action === "sync_enquiry" || action === "submit_enquiry") {
      return handlePublicEnquiry(ss, data);
    }

    if (action === "patient_login") {
      return handlePatientLogin(ss, payload.identifier || data.identifier, payload.password || data.password);
    }

    if (action === "verify_recovery_pin") {
      return handleVerifyRecoveryPin(ss, payload.identifier || data.identifier, payload.recoveryPin || data.recoveryPin);
    }

    if (action === "patient_reset_password" || action === "forgot_password") {
      return handlePatientResetPasswordWithPin(ss, payload.identifier || data.identifier, payload.recoveryPin || data.recoveryPin, payload.newPassword || data.newPassword);
    }

    // 2. PATIENT PROTECTED ACTIONS (Requires Session Token)
    if (action.indexOf("patient_") === 0) {
      var token = payload.sessionToken || payload.token;
      var session = verifySessionToken(token);
      if (!session) {
        return errorResponse("AUTH_REQUIRED", "Active patient session token required.");
      }
      return handlePatientPostAction(ss, session.patientId, action, payload);
    }

    // 3. DOCTOR ACTIONS (Synchronizations and clinical management)
    if (action === "sync_patient") return handleDoctorSyncPatient(ss, data);
    if (action === "sync_visit") return handleDoctorSyncVisit(ss, data);
    if (action === "sync_patient_auth") return handleDoctorSyncPatientAuth(ss, data);
    if (action === "delete_patient") return handleDoctorDeletePatient(ss, data);
    if (action === "doctor_convert_enquiry") return handleDoctorConvertEnquiry(ss, data);
    if (action === "doctor_link_enquiry") return handleDoctorLinkEnquiry(ss, data);
    if (action === "doctor_hide_enquiry") return handleDoctorHideEnquiry(ss, data);
    if (action === "doctor_set_password") return handleDoctorSetPatientPassword(ss, data);
    if (action === "doctor_toggle_status") return handleDoctorTogglePatientStatus(ss, data);
    if (action === "doctor_sync_appointment") return handleDoctorSyncAppointment(ss, data);
    if (action === "doctor_sync_receipt") return handleDoctorSyncReceipt(ss, data);
    if (action === "doctor_sync_treatment_plan") return handleDoctorSyncTreatmentPlan(ss, data);

    return errorResponse("INVALID_ACTION", "Action '" + action + "' not supported.");
  } catch (err) {
    return errorResponse("SERVER_ERROR", err.toString());
  } finally {
    try { lock.releaseLock(); } catch (lerr) {}
  }
}

// =============================================================================
// 6. PATIENT AUTHENTICATION & PORTAL CONTROLLERS
// =============================================================================

function handlePatientLogin(ss, identifier, password) {
  if (!identifier || !password) {
    return errorResponse("MISSING_FIELDS", "Patient ID/Mobile and password are required.");
  }

  var cleanId = String(identifier).trim().toUpperCase();
  var cleanPhone = normalizePhone(identifier);

  // 1. Locate patient in PATIENTS tab
  var patientSheet = ss.getSheetByName("PATIENTS");
  if (!patientSheet || patientSheet.getLastRow() < 2) {
    return errorResponse("PATIENT_NOT_FOUND", "No patient records on file.");
  }

  var patientRows = patientSheet.getRange(2, 1, patientSheet.getLastRow() - 1, 8).getValues();
  var matchedPatient = null;

  for (var i = 0; i < patientRows.length; i++) {
    var pId = String(patientRows[i][0]).trim().toUpperCase();
    var pPhone = normalizePhone(patientRows[i][5]);
    if (pId === cleanId || (cleanPhone.length === 10 && pPhone === cleanPhone)) {
      matchedPatient = {
        patientId: pId,
        registrationDate: String(patientRows[i][1]),
        name: String(patientRows[i][2]),
        age: String(patientRows[i][3]),
        gender: String(patientRows[i][4]),
        phone: String(patientRows[i][5]),
        address: String(patientRows[i][7])
      };
      break;
    }
  }

  if (!matchedPatient) {
    return errorResponse("PATIENT_NOT_FOUND", "No patient record matching that ID or Mobile number.");
  }

  // 2. Fetch or initialize PATIENT_AUTH record
  var authSheet = ss.getSheetByName("PATIENT_AUTH") || ss.insertSheet("PATIENT_AUTH");
  var authData = authSheet.getLastRow() > 1 ? authSheet.getRange(2, 1, authSheet.getLastRow() - 1, 9).getValues() : [];
  var authRowIndex = -1;
  var authRecord = null;

  for (var j = 0; j < authData.length; j++) {
    if (String(authData[j][0]).trim().toUpperCase() === matchedPatient.patientId) {
      authRowIndex = j + 2;
      authRecord = {
        patientId: String(authData[j][0]),
        loginIdentifier: String(authData[j][1]),
        passwordHash: String(authData[j][2]),
        passwordSalt: String(authData[j][3]),
        recoveryPin: String(authData[j][4]),
        accountStatus: String(authData[j][5]) || "active"
      };
      break;
    }
  }

  // Create initial auth record if missing
  if (!authRecord) {
    var initialPin = generateRecoveryPin();
    var salt = generateSalt();
    var defaultHash = hashPassword(initialPin, salt);
    authRecord = {
      patientId: matchedPatient.patientId,
      loginIdentifier: matchedPatient.phone,
      passwordHash: defaultHash,
      passwordSalt: salt,
      recoveryPin: initialPin,
      accountStatus: "active"
    };
    authSheet.appendRow([
      authRecord.patientId,
      authRecord.loginIdentifier,
      authRecord.passwordHash,
      authRecord.passwordSalt,
      authRecord.recoveryPin,
      authRecord.accountStatus,
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString()
    ]);
  }

  if (authRecord.accountStatus === "disabled") {
    logAudit("PATIENT", matchedPatient.patientId, "LOGIN_FAILED", matchedPatient.patientId, "ACCOUNT_DISABLED");
    return errorResponse("ACCOUNT_DISABLED", "Your patient portal account has been deactivated. Please contact clinic reception.");
  }

  // 3. Verify Password or Recovery PIN
  var cleanPass = String(password).trim();
  var isMatch = false;
  if (authRecord.passwordHash && authRecord.passwordSalt) {
    var computed = hashPassword(cleanPass, authRecord.passwordSalt);
    if (computed === authRecord.passwordHash) isMatch = true;
  }
  if (!isMatch && authRecord.recoveryPin && cleanPass === String(authRecord.recoveryPin).trim()) {
    isMatch = true;
  }

  if (!isMatch) {
    logAudit("PATIENT", matchedPatient.patientId, "LOGIN_FAILED", matchedPatient.patientId, "BAD_PASSWORD");
    return errorResponse("AUTH_FAILED", "Incorrect password. You can also use your 4-digit Recovery PIN.");
  }

  // 4. Update Last Login timestamp
  if (authRowIndex > 0) {
    authSheet.getRange(authRowIndex, 7).setValue(new Date().toISOString());
  }

  var token = createSessionToken(matchedPatient.patientId);
  logAudit("PATIENT", matchedPatient.patientId, "LOGIN_SUCCESS", matchedPatient.patientId, "OK");

  return successResponse({
    token: token,
    patient: matchedPatient
  }, "Sign in successful!");
}

function handleVerifyRecoveryPin(ss, identifier, recoveryPin) {
  if (!identifier || !recoveryPin) {
    return errorResponse("MISSING_FIELDS", "Patient ID/Mobile and Recovery PIN are required.");
  }
  var cleanId = String(identifier).trim().toUpperCase();
  var cleanPhone = normalizePhone(identifier);

  var patientSheet = ss.getSheetByName("PATIENTS");
  var pRows = patientSheet.getRange(2, 1, patientSheet.getLastRow() - 1, 6).getValues();
  var patientId = null;
  for (var i = 0; i < pRows.length; i++) {
    if (String(pRows[i][0]).trim().toUpperCase() === cleanId || normalizePhone(pRows[i][5]) === cleanPhone) {
      patientId = String(pRows[i][0]).trim().toUpperCase();
      break;
    }
  }
  if (!patientId) return errorResponse("PATIENT_NOT_FOUND", "No patient record found.");

  var authSheet = ss.getSheetByName("PATIENT_AUTH");
  var authData = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, 6).getValues();
  for (var j = 0; j < authData.length; j++) {
    if (String(authData[j][0]).trim().toUpperCase() === patientId) {
      var storedPin = String(authData[j][4]).trim();
      var status = String(authData[j][5]) || "active";
      if (status === "disabled") return errorResponse("ACCOUNT_DISABLED", "Account is deactivated.");
      if (storedPin === String(recoveryPin).trim()) {
        return successResponse({ verified: true, patientId: patientId }, "Recovery PIN verified.");
      }
      return errorResponse("INVALID_PIN", "Incorrect Recovery PIN.");
    }
  }
  return errorResponse("NOT_FOUND", "Credentials record not found.");
}

function handlePatientResetPasswordWithPin(ss, identifier, recoveryPin, newPassword) {
  if (!identifier || !recoveryPin || !newPassword || newPassword.length < 4) {
    return errorResponse("INVALID_INPUT", "Patient ID/Phone, 4-digit PIN, and new password (min 4 chars) required.");
  }

  var cleanId = String(identifier).trim().toUpperCase();
  var cleanPhone = normalizePhone(identifier);

  var patientSheet = ss.getSheetByName("PATIENTS");
  var pRows = patientSheet.getRange(2, 1, patientSheet.getLastRow() - 1, 6).getValues();
  var patientId = null;
  for (var i = 0; i < pRows.length; i++) {
    if (String(pRows[i][0]).trim().toUpperCase() === cleanId || normalizePhone(pRows[i][5]) === cleanPhone) {
      patientId = String(pRows[i][0]).trim().toUpperCase();
      break;
    }
  }

  if (!patientId) {
    return errorResponse("PATIENT_NOT_FOUND", "No patient record matching that ID or Mobile number.");
  }

  var authSheet = ss.getSheetByName("PATIENT_AUTH");
  var authData = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, 9).getValues();
  var targetRow = -1;
  var existingPin = null;

  for (var j = 0; j < authData.length; j++) {
    if (String(authData[j][0]).trim().toUpperCase() === patientId) {
      targetRow = j + 2;
      existingPin = String(authData[j][4]).trim();
      break;
    }
  }

  if (targetRow === -1 || existingPin !== String(recoveryPin).trim()) {
    logAudit("PATIENT", patientId, "RESET_PASSWORD_FAILED", patientId, "INVALID_PIN");
    return errorResponse("INVALID_PIN", "Invalid 4-digit Recovery PIN. Please verify your PIN or contact clinic reception.");
  }

  var salt = generateSalt();
  var newHash = hashPassword(newPassword, salt);
  authSheet.getRange(targetRow, 3, 1, 2).setValues([[newHash, salt]]);
  authSheet.getRange(targetRow, 9).setValue(new Date().toISOString());

  logAudit("PATIENT", patientId, "RESET_PASSWORD_SUCCESS", patientId, "OK");
  return successResponse(null, "Password reset successfully! You can now log in.");
}

// =============================================================================
// 7. PATIENT PROTECTED DATA APIS (AUTOMATIC PATIENT-ID ISOLATION)
// =============================================================================

function handlePatientGetAction(ss, patientId, action, params) {
  // Session Validation Check
  if (action === "patient_session" || action === "patient_validate_session") {
    return successResponse({ valid: true, patientId: patientId, role: "patient" });
  }

  // Complete Patient Dashboard Aggregation
  if (action === "patient_dashboard") {
    return handlePatientDashboard(ss, patientId);
  }

  // Visits
  if (action === "patient_visits" || action === "patient_get_visits") {
    return handlePatientVisits(ss, patientId);
  }

  // Appointments
  if (action === "patient_appointments" || action === "patient_get_appointments") {
    return handlePatientAppointments(ss, patientId);
  }

  // Receipts
  if (action === "patient_receipts" || action === "patient_get_receipts") {
    return handlePatientReceipts(ss, patientId);
  }

  // Treatment Plans
  if (action === "patient_treatment" || action === "patient_plans") {
    return handlePatientTreatmentPlans(ss, patientId);
  }

  // Profile & Recovery PIN
  if (action === "patient_profile" || action === "patient_get_profile") {
    return handlePatientProfile(ss, patientId);
  }

  return errorResponse("UNKNOWN_ACTION", "Action not supported.");
}

function handlePatientDashboard(ss, patientId) {
  var visitsRes = handlePatientVisits(ss, patientId);
  var apptsRes = handlePatientAppointments(ss, patientId);
  var receiptsRes = handlePatientReceipts(ss, patientId);
  var plansRes = handlePatientTreatmentPlans(ss, patientId);
  var profileRes = handlePatientProfile(ss, patientId);

  var visits = visitsRes.data ? visitsRes.data.visits : [];
  var appointments = apptsRes.data ? apptsRes.data.appointments : [];
  var receipts = receiptsRes.data ? receiptsRes.data.receipts : [];
  var plans = plansRes.data ? plansRes.data.plans : [];
  var patient = profileRes.data ? profileRes.data.patient : null;

  var upcoming = appointments.find(function(a) { return a.status === "Upcoming" || a.status === "Confirmed"; }) || null;

  return successResponse({
    patient: patient,
    stats: {
      totalVisits: visits.length,
      upcomingAppointments: appointments.filter(function(a) { return a.status === "Upcoming" || a.status === "Confirmed"; }).length,
      activePlansCount: plans.filter(function(p) { return p.status === "Active"; }).length,
      totalReceipts: receipts.length
    },
    upcomingAppointment: upcoming,
    recentVisits: visits.slice(0, 5),
    activePlans: plans,
    recentReceipts: receipts.slice(0, 5)
  });
}

function handlePatientVisits(ss, patientId) {
  var visitSheet = ss.getSheetByName("VISITS");
  var visits = [];
  if (visitSheet && visitSheet.getLastRow() > 1) {
    var vData = visitSheet.getRange(2, 1, visitSheet.getLastRow() - 1, 19).getValues();
    vData.forEach(function(r) {
      if (String(r[1]).trim().toUpperCase() === patientId) {
        var isVisible = (r[16] === "" || r[16] === true || String(r[16]).toLowerCase() === "true");
        if (isVisible) {
          visits.push({
            visitId: String(r[0]),
            patientId: String(r[1]),
            patientName: String(r[2]),
            phone: String(r[3]),
            visitNumber: Number(r[4]) || 1,
            date: String(r[5]),
            time: String(r[6]),
            reason: String(r[7]),
            complaint: String(r[8]),
            diagnosis: String(r[9]),
            treatmentNotes: String(r[10]),
            followUpDate: String(r[11]),
            status: String(r[12]) || "Completed",
            doctor: String(r[13]) || "Dr. Satyam Vishwakarma",
            amount: r[15] || 500
          });
        }
      }
    });
  }
  return successResponse({ visits: visits });
}

function handlePatientAppointments(ss, patientId) {
  var sheet = ss.getSheetByName("APPOINTMENTS");
  var appts = [];
  if (sheet && sheet.getLastRow() > 1) {
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
    rows.forEach(function(r) {
      if (String(r[1]).trim().toUpperCase() === patientId) {
        appts.push({
          appointmentId: String(r[0]),
          patientId: String(r[1]),
          date: String(r[2]),
          time: String(r[3]),
          type: String(r[4]),
          status: String(r[5]) || "Upcoming",
          notes: String(r[6])
        });
      }
    });
  }
  return successResponse({ appointments: appts });
}

function handlePatientReceipts(ss, patientId) {
  var sheet = ss.getSheetByName("RECEIPTS");
  var receipts = [];
  if (sheet && sheet.getLastRow() > 1) {
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
    rows.forEach(function(r) {
      if (String(r[1]).trim().toUpperCase() === patientId) {
        receipts.push({
          receiptId: String(r[0]),
          patientId: String(r[1]),
          visitId: String(r[2]),
          date: String(r[3]),
          amount: Number(r[4]) || 500,
          paymentMethod: String(r[5]) || "Cash",
          paymentStatus: String(r[6]) || "Paid",
          receiptUrl: String(r[7])
        });
      }
    });
  }
  return successResponse({ receipts: receipts });
}

function handlePatientTreatmentPlans(ss, patientId) {
  var sheet = ss.getSheetByName("TREATMENT_PLANS");
  var plans = [];
  if (sheet && sheet.getLastRow() > 1) {
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
    rows.forEach(function(r) {
      if (String(r[1]).trim().toUpperCase() === patientId) {
        var isVisible = (r[5] === "" || r[5] === true || String(r[5]).toLowerCase() === "true");
        if (isVisible) {
          plans.push({
            planId: String(r[0]),
            patientId: String(r[1]),
            treatmentPlan: String(r[2]),
            startDate: String(r[3]),
            status: String(r[4]) || "Active"
          });
        }
      }
    });
  }
  return successResponse({ plans: plans });
}

function handlePatientProfile(ss, patientId) {
  var pSheet = ss.getSheetByName("PATIENTS");
  var aSheet = ss.getSheetByName("PATIENT_AUTH");
  var pRows = pSheet.getRange(2, 1, pSheet.getLastRow() - 1, 12).getValues();
  var patient = null;

  for (var i = 0; i < pRows.length; i++) {
    if (String(pRows[i][0]).trim().toUpperCase() === patientId) {
      patient = {
        patientId: String(pRows[i][0]),
        registrationDate: String(pRows[i][1]),
        name: String(pRows[i][2]),
        age: String(pRows[i][3]),
        gender: String(pRows[i][4]),
        phone: String(pRows[i][5]),
        altPhone: String(pRows[i][6]),
        address: String(pRows[i][7]),
        dob: String(pRows[i][8]),
        emergencyContact: String(pRows[i][9]),
        firstVisitReason: String(pRows[i][10]),
        status: String(pRows[i][11])
      };
      break;
    }
  }

  var pin = null;
  if (aSheet && aSheet.getLastRow() > 1) {
    var aRows = aSheet.getRange(2, 1, aSheet.getLastRow() - 1, 6).getValues();
    for (var j = 0; j < aRows.length; j++) {
      if (String(aRows[j][0]).trim().toUpperCase() === patientId) {
        pin = String(aRows[j][4]);
        break;
      }
    }
  }

  if (!patient) return errorResponse("NOT_FOUND", "Profile not found.");
  patient.recoveryPin = pin; // Safe: only 4-digit PIN for self-service recovery, NO hash or salt
  return successResponse({ patient: patient });
}

function handlePatientPostAction(ss, patientId, action, payload) {
  if (action === "patient_change_password") {
    var currentPassword = payload.currentPassword;
    var newPassword = payload.newPassword;
    if (!currentPassword || !newPassword || newPassword.length < 4) {
      return errorResponse("INVALID_INPUT", "New password must be at least 4 characters long.");
    }

    var authSheet = ss.getSheetByName("PATIENT_AUTH");
    var aRows = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, 9).getValues();
    var targetRow = -1;
    var storedHash = null;
    var storedSalt = null;
    var storedPin = null;

    for (var i = 0; i < aRows.length; i++) {
      if (String(aRows[i][0]).trim().toUpperCase() === patientId) {
        targetRow = i + 2;
        storedHash = String(aRows[i][2]);
        storedSalt = String(aRows[i][3]);
        storedPin = String(aRows[i][4]);
        break;
      }
    }

    if (targetRow === -1) return errorResponse("NOT_FOUND", "Security credentials not found.");

    var isCurrentValid = (hashPassword(currentPassword, storedSalt) === storedHash) || (currentPassword === storedPin);
    if (!isCurrentValid) {
      return errorResponse("AUTH_FAILED", "Current password or PIN is incorrect.");
    }

    var newSalt = generateSalt();
    var newHash = hashPassword(newPassword, newSalt);
    authSheet.getRange(targetRow, 3, 1, 2).setValues([[newHash, newSalt]]);
    authSheet.getRange(targetRow, 9).setValue(new Date().toISOString());

    logAudit("PATIENT", patientId, "CHANGE_PASSWORD", patientId, "SUCCESS");
    return successResponse(null, "Password changed successfully!");
  }

  if (action === "patient_logout") {
    logAudit("PATIENT", patientId, "LOGOUT", patientId, "OK");
    return successResponse(null, "Session ended successfully.");
  }

  return errorResponse("UNKNOWN_ACTION", "Action not supported.");
}

// =============================================================================
// 8. PUBLIC ENQUIRIES CONTROLLER
// =============================================================================

function handlePublicEnquiry(ss, data) {
  var enquirySheet = ss.getSheetByName("ENQUIRIES") || ss.insertSheet("ENQUIRIES");
  var newId = data.id || ("ENQ-" + Date.now().toString().slice(-6));
  var today = new Date().toISOString().slice(0, 10);
  var time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  enquirySheet.appendRow([
    newId,
    data.date || today,
    data.time || time,
    data.name || "Anonymous",
    data.phone || "",
    data.painArea || "General Consultation",
    data.duration || "Recent",
    data.appointmentDate || "Flexible",
    data.concern || "",
    "NEW",
    "", // Converted Patient ID
    "", // Internal Notes
    new Date().toISOString(),
    new Date().toISOString()
  ]);

  logAudit("PUBLIC", "GUEST", "SUBMIT_ENQUIRY", newId, "SUCCESS");
  return successResponse({ id: newId }, "Consultation enquiry received.");
}

// =============================================================================
// 9. DOCTOR CONTROLLERS & SECURE SYNC ENGINE
// =============================================================================

function handleDoctorPatientSearch(ss, query) {
  if (!query) return successResponse({ patients: [] });
  var cleanQ = String(query).trim().toLowerCase();
  var pSheet = ss.getSheetByName("PATIENTS");
  var results = [];

  if (pSheet && pSheet.getLastRow() > 1) {
    var pData = pSheet.getRange(2, 1, pSheet.getLastRow() - 1, 12).getValues();
    pData.forEach(function(r) {
      var id = String(r[0] || "").toLowerCase();
      var name = String(r[2] || "").toLowerCase();
      var phone = normalizePhone(r[5]);
      if (id.indexOf(cleanQ) !== -1 || name.indexOf(cleanQ) !== -1 || phone.indexOf(cleanQ) !== -1) {
        results.push({
          patientId: String(r[0]),
          registrationDate: String(r[1]),
          name: String(r[2]),
          age: String(r[3]),
          gender: String(r[4]),
          phone: String(r[5]),
          address: String(r[7]),
          status: String(r[11]) || "Active"
        });
      }
    });
  }
  return successResponse({ patients: results });
}

function handleDoctorGetPatientDetails(ss, patientId) {
  if (!patientId) return errorResponse("MISSING_ID", "Patient ID required.");
  var cleanId = String(patientId).trim().toUpperCase();

  var profileRes = handlePatientProfile(ss, cleanId);
  if (!profileRes.success) return profileRes;

  var patient = profileRes.data.patient;

  // Fetch Auth Status
  var authSheet = ss.getSheetByName("PATIENT_AUTH");
  var accountStatus = "active";
  var lastLogin = "";
  if (authSheet && authSheet.getLastRow() > 1) {
    var aRows = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, 7).getValues();
    for (var i = 0; i < aRows.length; i++) {
      if (String(aRows[i][0]).trim().toUpperCase() === cleanId) {
        accountStatus = String(aRows[i][5]) || "active";
        lastLogin = String(aRows[i][6]) || "";
        break;
      }
    }
  }

  // All visits including internal notes
  var visitSheet = ss.getSheetByName("VISITS");
  var visits = [];
  if (visitSheet && visitSheet.getLastRow() > 1) {
    var vData = visitSheet.getRange(2, 1, visitSheet.getLastRow() - 1, 19).getValues();
    vData.forEach(function(r) {
      if (String(r[1]).trim().toUpperCase() === cleanId) {
        visits.push({
          visitId: String(r[0]),
          visitNumber: Number(r[4]) || 1,
          date: String(r[5]),
          time: String(r[6]),
          diagnosis: String(r[9]),
          treatmentNotes: String(r[10]),
          status: String(r[12]),
          amount: r[15] || 500,
          patientVisible: (r[16] === "" || r[16] === true || String(r[16]).toLowerCase() === "true")
        });
      }
    });
  }

  // Appointments
  var apptsRes = handlePatientAppointments(ss, cleanId);
  // Receipts
  var receiptsRes = handlePatientReceipts(ss, cleanId);
  // Plans
  var plansRes = handlePatientTreatmentPlans(ss, cleanId);

  return successResponse({
    patient: patient,
    accountStatus: accountStatus,
    lastLogin: lastLogin,
    recoveryPin: patient.recoveryPin,
    visits: visits,
    appointments: apptsRes.data ? apptsRes.data.appointments : [],
    receipts: receiptsRes.data ? receiptsRes.data.receipts : [],
    plans: plansRes.data ? plansRes.data.plans : []
  });
}

function handleDoctorSyncPatient(ss, data) {
  var sheet = ss.getSheetByName("PATIENTS") || ss.insertSheet("PATIENTS");
  var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  var existingRow = -1;

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toUpperCase() === String(data.patientId).trim().toUpperCase()) {
      existingRow = i + 2;
      break;
    }
  }

  var rowVals = [
    data.patientId || "",
    data.registrationDate || new Date().toISOString().slice(0, 10),
    data.name || "",
    data.age || "",
    data.gender || "",
    data.phone || "",
    data.altPhone || "",
    data.address || "Vindhyachal, Mirzapur",
    data.dob || "",
    data.emergencyContact || "",
    data.firstVisitReason || "",
    data.status || "Active",
    data.createdAt || new Date().toISOString(),
    new Date().toISOString()
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowVals.length).setValues([rowVals]);
  } else {
    sheet.appendRow(rowVals);
  }

  logAudit("DOCTOR", AUTHORIZED_DOCTOR_EMAIL, "SYNC_PATIENT", data.patientId, "OK");
  return successResponse({ patientId: data.patientId }, "Patient record synchronized.");
}

function handleDoctorSyncVisit(ss, data) {
  var sheet = ss.getSheetByName("VISITS") || ss.insertSheet("VISITS");
  var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  var existingRow = -1;

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.visitId)) {
      existingRow = i + 2;
      break;
    }
  }

  var rowVals = [
    data.visitId || "",
    data.patientId || "",
    data.patientName || "",
    data.phone || "",
    data.visitNumber || 1,
    data.date || new Date().toISOString().slice(0, 10),
    data.time || "10:00 AM",
    data.reason || "Physiotherapy Rehabilitation",
    data.complaint || "",
    data.diagnosis || "Under Evaluation",
    data.treatmentNotes || "",
    data.followUpDate || "",
    data.status || "Completed",
    data.doctor || "Dr. Satyam Vishwakarma",
    data.appointmentId || "",
    data.amount || 500,
    data.patientVisible !== false,
    data.createdAt || new Date().toISOString(),
    new Date().toISOString()
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowVals.length).setValues([rowVals]);
  } else {
    sheet.appendRow(rowVals);
  }

  logAudit("DOCTOR", AUTHORIZED_DOCTOR_EMAIL, "SYNC_VISIT", data.patientId, "OK");
  return successResponse({ visitId: data.visitId }, "Visit synchronized.");
}

function handleDoctorSyncAppointment(ss, data) {
  var sheet = ss.getSheetByName("APPOINTMENTS") || ss.insertSheet("APPOINTMENTS");
  var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  var existingRow = -1;

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.appointmentId)) {
      existingRow = i + 2;
      break;
    }
  }

  var rowVals = [
    data.appointmentId || ("APT-" + Date.now().toString().slice(-6)),
    data.patientId || "",
    data.date || new Date().toISOString().slice(0, 10),
    data.time || "10:00 AM",
    data.type || "Follow-up",
    data.status || "Upcoming",
    data.notes || "",
    data.createdAt || new Date().toISOString(),
    new Date().toISOString()
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowVals.length).setValues([rowVals]);
  } else {
    sheet.appendRow(rowVals);
  }

  logAudit("DOCTOR", AUTHORIZED_DOCTOR_EMAIL, "SYNC_APPOINTMENT", data.patientId, "OK");
  return successResponse({ appointmentId: rowVals[0] }, "Appointment synchronized.");
}

function handleDoctorSyncReceipt(ss, data) {
  var sheet = ss.getSheetByName("RECEIPTS") || ss.insertSheet("RECEIPTS");
  var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  var existingRow = -1;

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.receiptId)) {
      existingRow = i + 2;
      break;
    }
  }

  var rowVals = [
    data.receiptId || ("REC-" + Date.now().toString().slice(-6)),
    data.patientId || "",
    data.visitId || "",
    data.date || new Date().toISOString().slice(0, 10),
    data.amount || 500,
    data.paymentMethod || "Cash",
    data.paymentStatus || "Paid",
    data.receiptUrl || "",
    data.createdAt || new Date().toISOString()
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowVals.length).setValues([rowVals]);
  } else {
    sheet.appendRow(rowVals);
  }

  logAudit("DOCTOR", AUTHORIZED_DOCTOR_EMAIL, "SYNC_RECEIPT", data.patientId, "OK");
  return successResponse({ receiptId: rowVals[0] }, "Receipt synchronized.");
}

function handleDoctorSyncTreatmentPlan(ss, data) {
  var sheet = ss.getSheetByName("TREATMENT_PLANS") || ss.insertSheet("TREATMENT_PLANS");
  var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  var existingRow = -1;

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.planId)) {
      existingRow = i + 2;
      break;
    }
  }

  var rowVals = [
    data.planId || ("PLN-" + Date.now().toString().slice(-6)),
    data.patientId || "",
    data.treatmentPlan || "",
    data.startDate || new Date().toISOString().slice(0, 10),
    data.status || "Active",
    data.patientVisible !== false,
    data.createdAt || new Date().toISOString(),
    new Date().toISOString()
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowVals.length).setValues([rowVals]);
  } else {
    sheet.appendRow(rowVals);
  }

  logAudit("DOCTOR", AUTHORIZED_DOCTOR_EMAIL, "SYNC_PLAN", data.patientId, "OK");
  return successResponse({ planId: rowVals[0] }, "Treatment plan synchronized.");
}

function handleDoctorSyncPatientAuth(ss, data) {
  var sheet = ss.getSheetByName("PATIENT_AUTH") || ss.insertSheet("PATIENT_AUTH");
  var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  var targetRow = -1;

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toUpperCase() === String(data.patientId).trim().toUpperCase()) {
      targetRow = i + 2;
      break;
    }
  }

  var rowVals = [
    data.patientId,
    data.phone || data.loginIdentifier || "",
    data.passwordHash || "",
    data.passwordSalt || "",
    data.recoveryPin || generateRecoveryPin(),
    data.status || "active",
    data.lastLogin || "",
    data.createdAt || new Date().toISOString(),
    new Date().toISOString()
  ];

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, rowVals.length).setValues([rowVals]);
  } else {
    sheet.appendRow(rowVals);
  }

  return successResponse({ patientId: data.patientId }, "Patient credentials synced.");
}

function handleDoctorDeletePatient(ss, data) {
  var pSheet = ss.getSheetByName("PATIENTS");
  if (pSheet && pSheet.getLastRow() > 1) {
    var pValues = pSheet.getRange(2, 1, pSheet.getLastRow() - 1, 1).getValues();
    for (var i = pValues.length - 1; i >= 0; i--) {
      if (String(pValues[i][0]).trim().toUpperCase() === String(data.patientId).trim().toUpperCase()) {
        pSheet.deleteRow(i + 2);
      }
    }
  }
  logAudit("DOCTOR", AUTHORIZED_DOCTOR_EMAIL, "DELETE_PATIENT", data.patientId, "OK");
  return successResponse({ patientId: data.patientId }, "Patient removed from Sheet.");
}

function handleDoctorConvertEnquiry(ss, data) {
  var enquiryId = data.enquiryId;
  var enquirySheet = ss.getSheetByName("ENQUIRIES");
  if (!enquirySheet || enquirySheet.getLastRow() < 2) return errorResponse("NOT_FOUND", "Enquiries sheet empty.");

  var eRows = enquirySheet.getRange(2, 1, enquirySheet.getLastRow() - 1, 12).getValues();
  var targetEnquiryRow = -1;
  var enquiryData = null;

  for (var i = 0; i < eRows.length; i++) {
    if (String(eRows[i][0]) === String(enquiryId)) {
      targetEnquiryRow = i + 2;
      enquiryData = {
        name: String(eRows[i][3]),
        phone: String(eRows[i][4]),
        condition: String(eRows[i][5]),
        concern: String(eRows[i][8])
      };
      break;
    }
  }

  if (targetEnquiryRow === -1) return errorResponse("NOT_FOUND", "Enquiry not found.");

  // Check if patient with normalized phone already exists
  var patientSheet = ss.getSheetByName("PATIENTS");
  var pRows = patientSheet.getLastRow() > 1 ? patientSheet.getRange(2, 1, patientSheet.getLastRow() - 1, 6).getValues() : [];
  var existingPatientId = null;
  var normPhone = normalizePhone(enquiryData.phone);

  for (var j = 0; j < pRows.length; j++) {
    if (normalizePhone(pRows[j][5]) === normPhone) {
      existingPatientId = String(pRows[j][0]);
      break;
    }
  }

  var finalPatientId = existingPatientId;
  var isNewPatient = false;

  if (!finalPatientId) {
    var maxNum = 0;
    for (var k = 0; k < pRows.length; k++) {
      var idStr = String(pRows[k][0]);
      if (idStr.indexOf("VPR-") === 0) {
        var n = parseInt(idStr.replace("VPR-", ""), 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    }
    finalPatientId = "VPR-" + ("0000" + (maxNum + 1)).slice(-4);
    isNewPatient = true;

    // Register Patient
    patientSheet.appendRow([
      finalPatientId,
      new Date().toISOString().slice(0, 10),
      enquiryData.name,
      "35",
      "Other",
      enquiryData.phone,
      "",
      "Vindhyachal, Mirzapur",
      "",
      "",
      enquiryData.condition || enquiryData.concern,
      "Active",
      new Date().toISOString(),
      new Date().toISOString()
    ]);

    // Create Auth & PIN
    var authSheet = ss.getSheetByName("PATIENT_AUTH");
    var pin = generateRecoveryPin();
    var salt = generateSalt();
    authSheet.appendRow([
      finalPatientId,
      enquiryData.phone,
      hashPassword(pin, salt),
      salt,
      pin,
      "active",
      "",
      new Date().toISOString(),
      new Date().toISOString()
    ]);
  }

  // Update Enquiry Status
  enquirySheet.getRange(targetEnquiryRow, 10).setValue("CONVERTED");
  enquirySheet.getRange(targetEnquiryRow, 11).setValue(finalPatientId);
  enquirySheet.getRange(targetEnquiryRow, 14).setValue(new Date().toISOString());

  logAudit("DOCTOR", AUTHORIZED_DOCTOR_EMAIL, "CONVERT_ENQUIRY", finalPatientId, "OK");
  return successResponse({
    patientId: finalPatientId,
    isNewPatient: isNewPatient,
    enquiryId: enquiryId
  }, "Enquiry converted successfully.");
}

function handleDoctorLinkEnquiry(ss, data) {
  var enquiryId = data.enquiryId;
  var targetPatientId = data.patientId;
  var enquirySheet = ss.getSheetByName("ENQUIRIES");
  if (!enquirySheet || enquirySheet.getLastRow() < 2) return errorResponse("NOT_FOUND", "No enquiries.");

  var eRows = enquirySheet.getRange(2, 1, enquirySheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < eRows.length; i++) {
    if (String(eRows[i][0]) === String(enquiryId)) {
      enquirySheet.getRange(i + 2, 10).setValue("LINKED");
      enquirySheet.getRange(i + 2, 11).setValue(targetPatientId);
      enquirySheet.getRange(i + 2, 14).setValue(new Date().toISOString());
      logAudit("DOCTOR", AUTHORIZED_DOCTOR_EMAIL, "LINK_ENQUIRY", targetPatientId, "OK");
      return successResponse({ enquiryId: enquiryId, patientId: targetPatientId }, "Enquiry linked to patient.");
    }
  }
  return errorResponse("NOT_FOUND", "Enquiry not found.");
}

function handleDoctorHideEnquiry(ss, data) {
  var enquiryId = data.enquiryId;
  var enquirySheet = ss.getSheetByName("ENQUIRIES");
  var eRows = enquirySheet.getRange(2, 1, enquirySheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < eRows.length; i++) {
    if (String(eRows[i][0]) === String(enquiryId)) {
      var currentStatus = enquirySheet.getRange(i + 2, 10).getValue();
      var newStatus = (currentStatus === "HIDDEN" || currentStatus === "Hidden / Spam") ? "NEW" : "HIDDEN";
      enquirySheet.getRange(i + 2, 10).setValue(newStatus);
      return successResponse({ enquiryId: enquiryId, status: newStatus }, "Status updated.");
    }
  }
  return errorResponse("NOT_FOUND", "Enquiry not found.");
}

function handleDoctorSetPatientPassword(ss, data) {
  var patientId = data.patientId;
  var newPassword = data.newPassword;
  if (!patientId || !newPassword || newPassword.length < 4) {
    return errorResponse("INVALID_INPUT", "Valid Patient ID and password (min 4 chars) required.");
  }

  var authSheet = ss.getSheetByName("PATIENT_AUTH");
  var aRows = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, 1).getValues();
  var targetRow = -1;

  for (var i = 0; i < aRows.length; i++) {
    if (String(aRows[i][0]).trim().toUpperCase() === String(patientId).trim().toUpperCase()) {
      targetRow = i + 2;
      break;
    }
  }

  var salt = generateSalt();
  var newHash = hashPassword(newPassword, salt);

  if (targetRow > 0) {
    authSheet.getRange(targetRow, 3, 1, 2).setValues([[newHash, salt]]);
    authSheet.getRange(targetRow, 9).setValue(new Date().toISOString());
  } else {
    authSheet.appendRow([
      patientId,
      "",
      newHash,
      salt,
      generateRecoveryPin(),
      "active",
      "",
      new Date().toISOString(),
      new Date().toISOString()
    ]);
  }

  logAudit("DOCTOR", AUTHORIZED_DOCTOR_EMAIL, "SET_PASSWORD", patientId, "OK");
  return successResponse(null, "Password set successfully for patient.");
}

function handleDoctorTogglePatientStatus(ss, data) {
  var patientId = data.patientId;
  var targetStatus = data.status; // "active" or "disabled"
  var authSheet = ss.getSheetByName("PATIENT_AUTH");
  var aRows = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, 1).getValues();

  for (var i = 0; i < aRows.length; i++) {
    if (String(aRows[i][0]).trim().toUpperCase() === String(patientId).trim().toUpperCase()) {
      authSheet.getRange(i + 2, 6).setValue(targetStatus);
      authSheet.getRange(i + 2, 9).setValue(new Date().toISOString());
      logAudit("DOCTOR", AUTHORIZED_DOCTOR_EMAIL, "TOGGLE_STATUS", patientId, targetStatus);
      return successResponse({ patientId: patientId, status: targetStatus }, "Status updated.");
    }
  }
  return errorResponse("NOT_FOUND", "Patient auth not found.");
}

function handleDoctorFetchAll(ss) {
  var patients = [];
  var visits = [];
  var enquiries = [];

  var pSheet = ss.getSheetByName("PATIENTS");
  if (pSheet && pSheet.getLastRow() > 1) {
    var pData = pSheet.getRange(2, 1, pSheet.getLastRow() - 1, 12).getValues();
    pData.forEach(function(r) {
      if (r[0]) {
        patients.push({
          patientId: String(r[0]),
          registrationDate: String(r[1]),
          name: String(r[2]),
          age: String(r[3]),
          gender: String(r[4]),
          phone: String(r[5]),
          altPhone: String(r[6]),
          address: String(r[7]),
          dob: String(r[8]),
          emergencyContact: String(r[9]),
          firstVisitReason: String(r[10]),
          status: String(r[11]) || "Active"
        });
      }
    });
  }

  var vSheet = ss.getSheetByName("VISITS");
  if (vSheet && vSheet.getLastRow() > 1) {
    var vData = vSheet.getRange(2, 1, vSheet.getLastRow() - 1, 14).getValues();
    vData.forEach(function(r) {
      if (r[0] && r[1]) {
        visits.push({
          visitId: String(r[0]),
          patientId: String(r[1]),
          patientName: String(r[2]),
          phone: String(r[3]),
          visitNumber: Number(r[4]) || 1,
          date: String(r[5]),
          time: String(r[6]),
          reason: String(r[7]),
          complaint: String(r[8]),
          diagnosis: String(r[9]),
          treatmentNotes: String(r[10]),
          followUpDate: String(r[11]),
          status: String(r[12]) || "Completed",
          doctor: String(r[13]) || "Dr. Satyam Vishwakarma"
        });
      }
    });
  }

  var eSheet = ss.getSheetByName("ENQUIRIES");
  if (eSheet && eSheet.getLastRow() > 1) {
    var eData = eSheet.getRange(2, 1, eSheet.getLastRow() - 1, 10).getValues();
    eData.forEach(function(r) {
      if (r[0]) {
        enquiries.push({
          id: String(r[0]),
          date: String(r[1]),
          time: String(r[2]),
          name: String(r[3]),
          phone: String(r[4]),
          painArea: String(r[5]),
          duration: String(r[6]),
          appointmentDate: String(r[7]),
          concern: String(r[8]),
          status: String(r[9]) || "NEW"
        });
      }
    });
  }

  return successResponse({
    patients: patients,
    visits: visits,
    enquiries: enquiries
  }, "All records retrieved successfully.");
}
