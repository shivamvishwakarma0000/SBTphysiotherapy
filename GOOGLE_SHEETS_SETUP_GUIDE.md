# Vindhya Physio & Rehab Center — 100% Automated Google Sheets Cloud Database Setup

Follow these simple steps. The code below contains a **Universal Spreadsheet Resolver** so it automatically connects to your Google Sheet whether you created it inside Sheets or directly in Apps Script!

---

## 💻 STEP 1: Replace the Code in Apps Script

In your **Apps Script editor** (which you have open in your screenshot), select all code, delete it, and paste this updated script:

```javascript
// =============================================================================
// VINDHYA PHYSIO & REHAB CENTER — CLOUD DATABASE ENGINE (UNIVERSAL)
// Authorized Doctor Account: shivamupsc8@gmail.com
// =============================================================================

// OPTIONAL: If using standalone script, you can paste your sheet URL here, OR leave blank to auto-detect:
var SPREADSHEET_URL = ""; 

/**
 * Universal Sheet Resolver:
 * Automatically finds your active sheet or searches Google Drive for "Vindhya Physio & Rehab Database".
 */
function getDatabaseSpreadsheet() {
  // 1. Try bound spreadsheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;

  // 2. Try explicit URL/ID if provided
  if (SPREADSHEET_URL && SPREADSHEET_URL.trim() !== "") {
    var trimmed = SPREADSHEET_URL.trim();
    if (trimmed.indexOf("http") === 0) {
      return SpreadsheetApp.openByUrl(trimmed);
    }
    return SpreadsheetApp.openById(trimmed);
  }

  // 3. Auto-search Google Drive for spreadsheet by name
  try {
    var files = DriveApp.getFilesByName("Vindhya Physio & Rehab Database");
    if (files.hasNext()) {
      return SpreadsheetApp.open(files.next());
    }
  } catch (e) {}

  // 4. Create new spreadsheet if not found
  return SpreadsheetApp.create("Vindhya Physio & Rehab Database");
}

/**
 * ⚡ 1-CLICK AUTO-SETUP:
 * Automatically creates all 3 tabs (PATIENTS, VISITS, ENQUIRIES) and formats headers.
 */
function setupDatabase() {
  var ss = getDatabaseSpreadsheet();

  // 1. Setup PATIENTS Tab
  var patientSheet = ss.getSheetByName("PATIENTS") || ss.insertSheet("PATIENTS");
  var patientHeaders = [
    "Patient ID", "Registration Date", "Patient Name", "Age", "Gender", 
    "Phone", "Alternate Phone", "Address", "Date of Birth", "Emergency Contact", 
    "Reason for Visit", "Status"
  ];
  patientSheet.getRange(1, 1, 1, patientHeaders.length).setValues([patientHeaders]);
  patientSheet.getRange(1, 1, 1, patientHeaders.length)
    .setBackground("#071927")
    .setFontColor("#10b981")
    .setFontWeight("bold")
    .setFontSize(10);
  patientSheet.setFrozenRows(1);

  // 2. Setup VISITS Tab
  var visitSheet = ss.getSheetByName("VISITS") || ss.insertSheet("VISITS");
  var visitHeaders = [
    "Visit ID", "Patient ID", "Patient Name", "Phone", "Visit Number", 
    "Date", "Time", "Reason for Visit", "Complaint", "Diagnosis", 
    "Treatment / Notes", "Follow-up Date", "Status", "Doctor"
  ];
  visitSheet.getRange(1, 1, 1, visitHeaders.length).setValues([visitHeaders]);
  visitSheet.getRange(1, 1, 1, visitHeaders.length)
    .setBackground("#071927")
    .setFontColor("#f59e0b")
    .setFontWeight("bold")
    .setFontSize(10);
  visitSheet.setFrozenRows(1);

  // 3. Setup ENQUIRIES Tab (Online Consultation Bookings)
  var enquirySheet = ss.getSheetByName("ENQUIRIES") || ss.insertSheet("ENQUIRIES");
  var enquiryHeaders = [
    "Enquiry ID", "Date", "Time", "Patient Name", "Phone Number", 
    "Condition / Pain Area", "Duration", "Preferred Date", "Symptoms & Message"
  ];
  enquirySheet.getRange(1, 1, 1, enquiryHeaders.length).setValues([enquiryHeaders]);
  enquirySheet.getRange(1, 1, 1, enquiryHeaders.length)
    .setBackground("#071927")
    .setFontColor("#38bdf8")
    .setFontWeight("bold")
    .setFontSize(10);
  enquirySheet.setFrozenRows(1);

  // Delete default blank "Sheet1" if empty
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  Logger.log("✅ Database URL: " + ss.getUrl());
  Logger.log("✅ Database initialized successfully with PATIENTS, VISITS, and ENQUIRIES tables!");
}

/**
 * 📥 RESTORE / PULL ENGINE:
 * Sends all historical rows from Google Sheets to the website upon doctor restore request.
 */
function doGet(e) {
  try {
    var ss = getDatabaseSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "fetchAll";

    if (action === "fetchAll") {
      // 1. Fetch Patients
      var patientSheet = ss.getSheetByName("PATIENTS");
      var patients = [];
      if (patientSheet && patientSheet.getLastRow() > 1) {
        var pData = patientSheet.getRange(2, 1, patientSheet.getLastRow() - 1, 12).getValues();
        pData.forEach(function(row) {
          if (row[0]) {
            patients.push({
              patientId: String(row[0]),
              registrationDate: String(row[1]),
              name: String(row[2]),
              age: String(row[3]),
              gender: String(row[4]),
              phone: String(row[5]),
              altPhone: String(row[6]),
              address: String(row[7]),
              dob: String(row[8]),
              emergencyContact: String(row[9]),
              firstVisitReason: String(row[10]),
              status: String(row[11]) || "Active"
            });
          }
        });
      }

      // 2. Fetch Visits
      var visitSheet = ss.getSheetByName("VISITS");
      var visits = [];
      if (visitSheet && visitSheet.getLastRow() > 1) {
        var vData = visitSheet.getRange(2, 1, visitSheet.getLastRow() - 1, 14).getValues();
        vData.forEach(function(row) {
          if (row[0] && row[1]) {
            visits.push({
              visitId: String(row[0]),
              patientId: String(row[1]),
              patientName: String(row[2]),
              phone: String(row[3]),
              visitNumber: Number(row[4]) || 1,
              date: String(row[5]),
              time: String(row[6]),
              reason: String(row[7]),
              complaint: String(row[8]),
              diagnosis: String(row[9]),
              treatmentNotes: String(row[10]),
              followUpDate: String(row[11]),
              status: String(row[12]) || "Completed",
              doctor: String(row[13]) || "Dr. Satyam Vishwakarma"
            });
          }
        });
      }

      // 3. Fetch Enquiries
      var enquirySheet = ss.getSheetByName("ENQUIRIES");
      var enquiries = [];
      if (enquirySheet && enquirySheet.getLastRow() > 1) {
        var eData = enquirySheet.getRange(2, 1, enquirySheet.getLastRow() - 1, 9).getValues();
        eData.forEach(function(row) {
          if (row[0]) {
            enquiries.push({
              id: String(row[0]),
              date: String(row[1]),
              time: String(row[2]),
              name: String(row[3]),
              phone: String(row[4]),
              painArea: String(row[5]),
              duration: String(row[6]),
              appointmentDate: String(row[7]),
              concern: String(row[8])
            });
          }
        });
      }

      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        patients: patients,
        visits: visits,
        enquiries: enquiries
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Vindhya Database Webhook is Online!" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 📤 REAL-TIME PUSH ENGINE:
 * Automatically appends new patients, visits, and bookings to the right Google Sheet.
 */
function doPost(e) {
  try {
    var ss = getDatabaseSpreadsheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;

    // 1. Patient Registration
    if (action === "sync_patient") {
      var patientSheet = ss.getSheetByName("PATIENTS") || ss.insertSheet("PATIENTS");
      if (patientSheet.getLastRow() === 0) {
        var patientHeaders = [
          "Patient ID", "Registration Date", "Patient Name", "Age", "Gender", 
          "Phone", "Alternate Phone", "Address", "Date of Birth", "Emergency Contact", 
          "Reason for Visit", "Status"
        ];
        patientSheet.getRange(1, 1, 1, patientHeaders.length).setValues([patientHeaders]);
        patientSheet.getRange(1, 1, 1, patientHeaders.length)
          .setBackground("#071927")
          .setFontColor("#10b981")
          .setFontWeight("bold")
          .setFontSize(10);
        patientSheet.setFrozenRows(1);
      }
      patientSheet.appendRow([
        data.patientId || "",
        data.registrationDate || "",
        data.name || "",
        data.age || "",
        data.gender || "",
        data.phone || "",
        data.altPhone || "",
        data.address || "",
        data.dob || "",
        data.emergencyContact || "",
        data.firstVisitReason || "",
        data.status || "Active"
      ]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, result: "success", type: "patient", id: data.patientId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Consultation & Visit Record
    if (action === "sync_visit") {
      var visitSheet = ss.getSheetByName("VISITS") || ss.insertSheet("VISITS");
      if (visitSheet.getLastRow() === 0) {
        var visitHeaders = [
          "Visit ID", "Patient ID", "Patient Name", "Phone", "Visit Number", 
          "Date", "Time", "Reason for Visit", "Complaint", "Diagnosis", 
          "Treatment / Notes", "Follow-up Date", "Status", "Doctor"
        ];
        visitSheet.getRange(1, 1, 1, visitHeaders.length).setValues([visitHeaders]);
        visitSheet.getRange(1, 1, 1, visitHeaders.length)
          .setBackground("#071927")
          .setFontColor("#f59e0b")
          .setFontWeight("bold")
          .setFontSize(10);
        visitSheet.setFrozenRows(1);
      }
      visitSheet.appendRow([
        data.visitId || "",
        data.patientId || "",
        data.patientName || "",
        data.phone || "",
        data.visitNumber || 1,
        data.date || "",
        data.time || "",
        data.reason || "",
        data.complaint || "",
        data.diagnosis || "",
        data.treatmentNotes || "",
        data.followUpDate || "",
        data.status || "Completed",
        data.doctor || "Dr. Satyam Vishwakarma"
      ]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, result: "success", type: "visit", id: data.visitId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Online Consultation Booking
    if (action === "sync_enquiry") {
      var enquirySheet = ss.getSheetByName("ENQUIRIES") || ss.insertSheet("ENQUIRIES");
      if (enquirySheet.getLastRow() === 0) {
        var enquiryHeaders = [
          "Enquiry ID", "Date", "Time", "Patient Name", "Phone Number", 
          "Condition / Pain Area", "Duration", "Preferred Date", "Symptoms & Message"
        ];
        enquirySheet.getRange(1, 1, 1, enquiryHeaders.length).setValues([enquiryHeaders]);
        enquirySheet.getRange(1, 1, 1, enquiryHeaders.length)
          .setBackground("#071927")
          .setFontColor("#38bdf8")
          .setFontWeight("bold")
          .setFontSize(10);
        enquirySheet.setFrozenRows(1);
      }
      enquirySheet.appendRow([
        data.id || "",
        data.date || "",
        data.time || "",
        data.name || "",
        data.phone || "",
        data.painArea || "",
        data.duration || "",
        data.appointmentDate || "",
        data.concern || ""
      ]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, result: "success", type: "enquiry", id: data.id }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Delete Patient Record from Sheet
    if (action === "delete_patient") {
      var pSheet = ss.getSheetByName("PATIENTS");
      if (pSheet && pSheet.getLastRow() > 1) {
        var pValues = pSheet.getRange(2, 1, pSheet.getLastRow() - 1, 1).getValues();
        for (var i = pValues.length - 1; i >= 0; i--) {
          if (String(pValues[i][0]) === String(data.patientId)) {
            pSheet.deleteRow(i + 2);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, result: "deleted" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, result: "ignored" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## ⚡ STEP 2: Run Auto-Setup & Deploy

1. Click the **Save icon (💾)** or `Cmd + S`.
2. Click **▶ Run** (with `setupDatabase` selected in the dropdown).
   * It will ask for permissions: Click **Review permissions** > Choose **`shivamupsc8@gmail.com`** > Click **Advanced** > Click **Go to Untitled project (unsafe)** > Click **Allow**.
   * *(The execution log will say: `✅ Database initialized successfully with PATIENTS, VISITS, and ENQUIRIES tables!`)*
3. Click **Deploy** (blue button in top right) > **New deployment**.
4. In the popup:
   * Click the **Gear icon ⚙️** next to *Select type* and select **Web app**.
   * **Description**: `Vindhya Database Cloud Engine`
   * **Execute as**: `Me (shivamupsc8@gmail.com)`
   * **Who has access**: **`Anyone`** *(Important: Must be "Anyone")*
5. Click **Deploy**.
6. Copy the **Web App URL** (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).
