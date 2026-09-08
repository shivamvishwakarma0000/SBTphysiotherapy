# Vindhya Physio & Rehab Center — Master Google Sheets & Google Apps Script Setup Guide (Part 3)

**Clinic:** Vindhya Physio & Rehab Center  
**Lead Doctor:** Dr. Satyam Vishwakarma  
**Location:** Amravati Chauraha, Vindhyachal, Mirzapur, Uttar Pradesh  
**Lead Doctor Account:** `shivamupsc8@gmail.com`  
**Version:** 3.1.0 — Unified Patient Portal + Doctor Portal + Google Sheets Engine  

---

## 📌 CORE ARCHITECTURAL PRINCIPLE: Google Sheet Remains Version 1 Source of Truth

- **Existing sheets & columns are preserved:** We do not replace or wipe your existing Google Sheets.
- **Non-destructive expansion:** When running `setupDatabase()`, any missing tabs are created, and any missing columns are safely appended to the right of the header row without shifting existing column positions.
- **No external third-party database required:** No Supabase, no Firebase, no paid SMS gateways, no OTP APIs. Everything runs directly on Google Sheets and Google Apps Script.
- **Zero plain-text password storage:** Cryptographic SHA-256 with unique per-user cryptographic salt. Password hashes and salts are stored only in the protected `PATIENT_AUTH` sheet and are **never** returned to the browser.
- **Self-Service 4-digit Recovery PIN:** In case a patient forgets their password, they can immediately reset it using their unique 4-digit Recovery PIN.
- **Concurrency & Race-Condition Safe:** Concurrency locking via `LockService.getScriptLock()` prevents duplicate Patient IDs or race conditions during peak hours.

---

## 📑 1. SHEET TABS & EXACT COLUMN HEADERS

Your Google Spreadsheet will have the following 8 tabs. Running `setupDatabase()` creates or updates them automatically.

### Tab 1: `PATIENTS` (Patient Directory)
*Header Background: `#071927` | Font: `#10b981` (Emerald)*
1. `Patient ID` (e.g., `VPR-0001`)
2. `Registration Date` (e.g., `2026-09-08`)
3. `Patient Name`
4. `Age`
5. `Gender`
6. `Phone`
7. `Alternate Phone`
8. `Address`
9. `Date of Birth`
10. `Emergency Contact`
11. `Reason for Visit`
12. `Status` (`Active` / `Completed` / `Follow-up`)
13. `Created At` *(Appended)*
14. `Updated At` *(Appended)*

---

### Tab 2: `VISITS` (Clinical Consultation Records)
*Header Background: `#071927` | Font: `#f59e0b` (Amber)*
1. `Visit ID` (e.g., `VST-0001`)
2. `Patient ID` (e.g., `VPR-0001`)
3. `Patient Name`
4. `Phone`
5. `Visit Number` (e.g., `1`, `2`, `3`)
6. `Date`
7. `Time`
8. `Reason for Visit`
9. `Complaint`
10. `Diagnosis`
11. `Treatment / Notes` (Patient-facing rehabilitation instructions & progress)
12. `Follow-up Date`
13. `Status` (`Completed` / `In Progress`)
14. `Doctor` (e.g., `Dr. Satyam Vishwakarma`)
15. `Appointment ID` *(Appended)*
16. `Amount` *(Appended, e.g. `500`)*
17. `Patient Visible` *(Appended: `TRUE` / `FALSE`. When `FALSE`, hidden from patient view)*
18. `Created At` *(Appended)*
19. `Updated At` *(Appended)*

---

### Tab 3: `ENQUIRIES` (Website Consultation Bookings)
*Header Background: `#071927` | Font: `#38bdf8` (Sky Blue)*
1. `Enquiry ID` (e.g., `ENQ-001`)
2. `Date`
3. `Time`
4. `Patient Name`
5. `Phone Number`
6. `Condition / Pain Area`
7. `Duration`
8. `Preferred Date`
9. `Symptoms & Message`
10. `Status` (`NEW`, `REVIEWED`, `HIDDEN`, `CONVERTED`, `LINKED`)
11. `Converted Patient ID` *(Appended)*
12. `Internal Notes` *(Appended, doctor internal remarks)*
13. `Created At` *(Appended)*
14. `Updated At` *(Appended)*

---

### Tab 4: `PATIENT_AUTH` (Authentication & Security Credentials — Protected)
*Header Background: `#071927` | Font: `#a855f7` (Purple)*
1. `Patient ID` (e.g., `VPR-0001`)
2. `Login Identifier` (Mobile number or Patient ID)
3. `Password Hash` (SHA-256 cryptographically salted hash)
4. `Password Salt` (Per-user cryptographic salt)
5. `Recovery PIN` (Unique 4-digit PIN for self-service password reset)
6. `Account Status` (`active` or `disabled`)
7. `Last Login` (ISO timestamp)
8. `Created At` (ISO timestamp)
9. `Updated At` (ISO timestamp)

> ⚠️ **SECURITY GUARANTEE:** This tab is completely isolated. Neither `Password Hash` nor `Password Salt` is ever exposed via any API response.

---

### Tab 5: `APPOINTMENTS` (Patient & Clinic Schedule)
*Header Background: `#071927` | Font: `#06b6d4` (Cyan)*
1. `Appointment ID` (e.g., `APT-001`)
2. `Patient ID` (e.g., `VPR-0001`)
3. `Date`
4. `Time`
5. `Type` (`Initial Assessment`, `Follow-up`, `Rehab Session`)
6. `Status` (`Upcoming`, `Confirmed`, `Completed`, `Cancelled`, `Missed`, `Rescheduled`)
7. `Notes`
8. `Created At`
9. `Updated At`

---

### Tab 6: `RECEIPTS` (Official Clinic Slips & Invoices)
*Header Background: `#071927` | Font: `#10b981` (Emerald)*
1. `Receipt ID` (e.g., `REC-001`)
2. `Patient ID` (e.g., `VPR-0001`)
3. `Visit ID` (e.g., `VST-0001`)
4. `Date`
5. `Amount` (e.g., `500`)
6. `Payment Method` (`Cash`, `UPI`, `Card`)
7. `Payment Status` (`Paid`, `Pending`)
8. `Receipt URL`
9. `Created At`

---

### Tab 7: `TREATMENT_PLANS` (Rehabilitation Regimen)
*Header Background: `#071927` | Font: `#3b82f6` (Blue)*
1. `Plan ID` (e.g., `PLN-001`)
2. `Patient ID` (e.g., `VPR-0001`)
3. `Treatment Plan` (e.g., `Quadriceps Strengthening & Lumbar Stabilization`)
4. `Start Date`
5. `Status` (`Active`, `Completed`, `Paused`)
6. `Patient Visible` (`TRUE` / `FALSE`)
7. `Created At`
8. `Updated At`

---

### Tab 8: `AUDIT_LOG` (System Activity & Access Tracking)
*Header Background: `#071927` | Font: `#94a3b8` (Slate)*
1. `Timestamp`
2. `User Type` (`PATIENT`, `DOCTOR`, `PUBLIC`)
3. `User ID` (Patient ID or Doctor Email)
4. `Action` (e.g., `LOGIN_SUCCESS`, `RESET_PASSWORD`, `CONVERT_ENQUIRY`)
5. `Patient ID`
6. `Result` (`SUCCESS`, `OK`, `AUTH_FAILED`, `BAD_PASSWORD`)
7. `Metadata` (Optional non-sensitive diagnostic parameters)

---

## 🚀 2. STEP-BY-STEP INSTALLATION INSTRUCTIONS

### Step 1: Open Google Apps Script
1. Open your Google Sheet in your web browser:  
   👉 [Open Your Google Sheet](https://docs.google.com/spreadsheets)
2. In the top menu bar, click **Extensions** > **Apps Script**.
3. In the left panel, click on **`Code.gs`** (or create it if not present).

### Step 2: Replace Code
1. Select all existing code in `Code.gs` (`Ctrl+A` or `Cmd+A`) and delete it.
2. Copy the entire script from `google-apps-script/Code.gs` in this repository (or from Section 4 below) and paste it into the editor.
3. Click the 💾 **Save** icon (`Ctrl+S` or `Cmd+S`).

### Step 3: Run 1-Click Database Setup
1. In the function dropdown toolbar at the top, select **`setupDatabase`**.
2. Click **Run**.
3. *Authorization Prompt:* If Google asks for authorization:
   - Click **Review permissions**.
   - Select your Google account (`shivamupsc8@gmail.com`).
   - Click **Advanced** (small text at bottom left).
   - Click **Go to Vindhya Physio Cloud Engine (unsafe)**.
   - Click **Allow**.
4. The script will automatically format all 8 sheets and headers within 3 seconds!

### Step 4: Deploy as Web App
1. At the top right of the Apps Script editor, click **Deploy** > **New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
3. Configure the settings **EXACTLY** as follows:
   - **Description:** `Vindhya Physio V3 API`
   - **Execute as:** `Me (shivamupsc8@gmail.com)`
   - **Who has access:** `Anyone` *(Crucial: allows the website frontend to communicate securely with Apps Script)*
4. Click **Deploy**.
5. Copy the generated **Web app URL** (it will look like `https://script.google.com/macros/s/.../exec`).

### Step 5: Save URL in Your Website
1. Open your website.
2. Go to **Doctor Portal** > **Cloud Database Settings**.
3. Paste the URL into the **Google Apps Script Webhook URL** field and click **Save & Test Connection**.
4. Both Doctor Portal and Patient Portal are now directly linked to your Google Sheet!

---

## 📡 3. API ACTION & ENDPOINT REFERENCE

All requests receive clean, structured JSON responses:
- **Success:** `{ success: true, ok: true, data: { ... }, message: "..." }`
- **Error:** `{ success: false, ok: false, errorCode: "...", message: "..." }`

### Public Endpoints (No Auth Required)
| Method | Action | Input Parameters | Description |
|---|---|---|---|
| `GET` | `ping` | none | Health check / verification |
| `POST` | `submit_enquiry` | `{ data: { name, phone, painArea, duration, preferredDate, concern } }` | Patient submits enquiry from website |
| `POST` | `patient_login` | `{ identifier, password }` | Patient logs in with Patient ID / Mobile + Password or PIN |
| `POST` | `verify_recovery_pin` | `{ identifier, recoveryPin }` | Verifies 4-digit PIN before password reset |
| `POST` | `patient_reset_password` | `{ identifier, recoveryPin, newPassword }` | Resets password using 4-digit Recovery PIN |

### Patient Protected Endpoints (Requires `sessionToken`)
*Patient ID is automatically resolved from the authenticated session token.*
| Method | Action | Query / Body Parameters | Description |
|---|---|---|---|
| `GET` | `patient_session` | `sessionToken` | Verifies active session token |
| `GET` | `patient_dashboard` | `sessionToken` | Complete dashboard: profile, stats, upcoming appointment, visits, plans, receipts |
| `GET` | `patient_visits` | `sessionToken` | Patient's visits (respects `Patient Visible !== false`) |
| `GET` | `patient_appointments`| `sessionToken` | Patient's appointments |
| `GET` | `patient_receipts` | `sessionToken` | Patient's official receipts |
| `GET` | `patient_treatment` | `sessionToken` | Patient's treatment plans (respects `Patient Visible !== false`) |
| `GET` | `patient_profile` | `sessionToken` | Patient demographic details & 4-digit PIN |
| `POST` | `patient_change_password` | `{ sessionToken, currentPassword, newPassword }` | Updates patient password |
| `POST` | `patient_logout` | `{ sessionToken }` | Ends patient session and logs audit trail |

### Doctor Protected Endpoints
| Method | Action | Parameters | Description |
|---|---|---|---|
| `GET` | `fetchAll` | none | Restores full database to local cache |
| `GET` | `doctor_patient_search` | `query` (name, phone, ID) | Real-time patient search |
| `GET` | `doctor_get_patient` | `patientId` | Returns full clinical profile, visits, PIN, appointments, receipts |
| `POST` | `sync_patient` | `{ data: patientObject }` | Upsert patient record |
| `POST` | `sync_visit` | `{ data: visitObject }` | Upsert visit record |
| `POST` | `sync_patient_auth` | `{ data: authObject }` | Sync patient credentials / PIN |
| `POST` | `delete_patient` | `{ data: { patientId } }` | Removes patient row |
| `POST` | `doctor_convert_enquiry` | `{ data: { enquiryId } }` | Converts enquiry to patient with phone deduplication |
| `POST` | `doctor_link_enquiry` | `{ data: { enquiryId, patientId } }` | Links enquiry to existing patient ID |
| `POST` | `doctor_hide_enquiry` | `{ data: { enquiryId } }` | Toggles enquiry status between `HIDDEN` and `NEW` |
| `POST` | `doctor_set_password` | `{ data: { patientId, newPassword } }` | Doctor sets new password for patient |
| `POST` | `doctor_toggle_status` | `{ data: { patientId, status: "active"|"disabled" } }` | Enable / Disable patient portal account |
| `POST` | `doctor_sync_appointment`| `{ data: appointmentObject }` | Upsert appointment |
| `POST` | `doctor_sync_receipt` | `{ data: receiptObject }` | Upsert receipt |
| `POST` | `doctor_sync_treatment_plan` | `{ data: planObject }` | Upsert treatment plan |

---

## 🧪 4. VERIFICATION & TEST CHECKLIST

Run through this test checklist to confirm 100% operation:

- [x] **Database Initialization:** Run `setupDatabase()` in Apps Script. Verify that 8 tabs exist with colored frozen header rows.
- [x] **Web App Deployment:** Deploy with "Execute as: Me" and "Who has access: Anyone". Verify ping URL returns `{ success: true, service: "vindhya-sheets-api" }`.
- [x] **Patient Login:**
  - Login with registered Mobile (`9876543210`) or Patient ID (`VPR-0001`).
  - Verify password hash is verified against `PATIENT_AUTH`.
  - Verify response contains `token` and `patient` info, with **NO** `passwordHash` or `passwordSalt`.
- [x] **Password Recovery:**
  - Enter Patient ID + 4-digit PIN (`1234`) + new password.
  - Verify password updates in `PATIENT_AUTH` sheet with a new cryptographic salt and hash.
- [x] **Patient Data Isolation:**
  - Call `patient_visits` with `sessionToken`.
  - Verify only visits matching the token's `patientId` are returned.
  - Verify visits with `Patient Visible = FALSE` are withheld.
- [x] **Doctor Enquiry Conversion:**
  - Convert an enquiry whose mobile already exists in `PATIENTS`.
  - Verify it links to existing `patientId` instead of duplicating the patient.
- [x] **Concurrency & LockService:**
  - Verify simultaneous writes use `LockService.getScriptLock()` to prevent collision and race conditions.
