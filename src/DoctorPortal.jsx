// =============================================================================
// PATIENT VECTOR FACE AVATAR COMPONENT (Clean clinical avatar without photo upload)
// =============================================================================
export function PatientAvatar({ patient, size = 68 }) {
  const gender = String(patient?.gender || "").toLowerCase();
  const name = patient?.name || "Patient";
  const isFemale = gender.includes("female") || gender === "f" || gender.includes("woman") || gender.includes("girl");

  const charCode = name.charCodeAt(0) || 0;
  const gradients = [
    "linear-gradient(135deg, #0284c7, #0369a1)",
    "linear-gradient(135deg, #10b981, #047857)",
    "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    "linear-gradient(135deg, #f59e0b, #b45309)",
    "linear-gradient(135deg, #ec4899, #be185d)",
    "linear-gradient(135deg, #06b6d4, #0e7490)"
  ];
  const bg = gradients[charCode % gradients.length];

  return (
    <div
      className="patient-vector-avatar"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: "50%",
        background: bg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
        border: "3px solid #ffffff",
        position: "relative",
        flexShrink: 0
      }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size * 0.72}
        height={size * 0.72}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {isFemale ? (
          <>
            <circle cx="32" cy="22" r="11" fill="#ffffff" />
            <path d="M18 25C18 16 24 10 32 10C40 10 46 16 46 25C46 32 43 37 43 37L21 37C21 37 18 32 18 25Z" fill="#ffffff" opacity="0.35" />
            <path d="M14 56C14 44 22 39 32 39C42 39 50 44 50 56H14Z" fill="#ffffff" />
          </>
        ) : (
          <>
            <circle cx="32" cy="21" r="11" fill="#ffffff" />
            <path d="M12 56C12 43 21 38 32 38C43 38 52 43 52 56H12Z" fill="#ffffff" />
          </>
        )}
      </svg>
      <span
        style={{
          position: "absolute",
          bottom: "1px",
          right: "1px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: "#10b981",
          border: "2px solid #ffffff",
          display: "block"
        }}
        title="Active Clinic Patient"
      />
    </div>
  );
}


import React, { useState, useEffect, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import { CLINIC_LOGO_B64, DOCTOR_SIGNATURE_B64 } from "./pdfAssets";
import { api, getWebhookUrl, setWebhookUrl, restoreFromGoogleSheets, syncToGoogleSheets, clearLocalPatientsCache } from "./apiService";
import { buildReceiptPDF, downloadReceiptPDF, cleanDateOnly, cleanTimeOnly, formatVisitDateTimeDisplay } from "./receiptUtils";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "./useTheme";


// =============================================================================
// SMART AI CLINICAL PHYSIOTHERAPY PROTOCOL PROGRESSION ENGINE
// =============================================================================
export const generateDailyPhysioProtocol = (diagnosisOrConcern, visitNumber = 1) => {
  const text = (diagnosisOrConcern || "").toLowerCase();
  const day = parseInt(visitNumber, 10) || 1;

  // 1. Back / Spine / Lumbar / Sciatica
  if (text.includes("back") || text.includes("lumbar") || text.includes("spine") || text.includes("sciatica") || text.includes("kamar") || text.includes("spondyl")) {
    if (day <= 1) {
      return {
        focus: "Spine Decompression & Acute Analgesia",
        diagnosis: "Lumbar Spondylosis with Acute Muscle Spasm (Day 1 Assessment)",
        treatment: "Day 1: Comprehensive physical exam + IFT electrotherapy (15 mins) + gentle manual spinal decompression + cold/thermal application + core isometric cues."
      };
    } else if (day <= 3) {
      return {
        focus: "Spine Decompression & Traction",
        diagnosis: "Lumbar Radiculopathy / Disc Alignment (Decompression Phase)",
        treatment: `Day ${day}: Grade I/II Maitland lumbar mobilization + mechanical spinal traction + pelvic tilting & gluteal activation + piriformis release.`
      };
    } else if (day <= 7) {
      return {
        focus: "Spinal Core Rehabilitation & Strengthening",
        diagnosis: "Resolving Lumbar Spondylosis (Strengthening Phase)",
        treatment: `Day ${day}: Grade III mobilization + dynamic core stabilization (bird-dog, bridges) + lumbar flexion/extension motor control + posture correction.`
      };
    } else {
      return {
        focus: "Functional Restoration & Maintenance",
        diagnosis: "Lumbar Rehabilitation (Maintenance & Relapse Prevention)",
        treatment: `Day ${day}: Advanced resistance band spinal endurance + heavy functional lifting mechanics re-education + tailored home regimen review.`
      };
    }
  }

  // 2. Neck / Cervical / Trapezitis / Headaches
  if (text.includes("neck") || text.includes("cervical") || text.includes("trapezi") || text.includes("gardan") || text.includes("headache")) {
    if (day <= 1) {
      return {
        focus: "Cervical Decompression & Pain Relief",
        diagnosis: "Cervical Spondylosis with Muscle Spasm",
        treatment: "Day 1: TENS/Ultrasonic therapy to upper trapezius + gentle manual cervical traction + active-assisted cervical ROM."
      };
    } else if (day <= 4) {
      return {
        focus: "Cervical Spine Mobilization & Release",
        diagnosis: "Cervical Radiculopathy Management",
        treatment: `Day ${day}: Myofascial trigger point release + deep neck flexor (chin tucks) isometric strengthening + scapular retraction drills.`
      };
    } else {
      return {
        focus: "Postural Restoration & Ergonomic Rehab",
        diagnosis: "Cervicogenic Postural Syndrome (Strengthening)",
        treatment: `Day ${day}: Thoracic spine extension mobilization + resistance band scapular stabilization + screen ergonomics review.`
      };
    }
  }

  // 3. Frozen Shoulder / Shoulder Pain
  if (text.includes("shoulder") || text.includes("kandha") || text.includes("capsulitis") || text.includes("rotator")) {
    if (day <= 2) {
      return {
        focus: "Shoulder Pain Modulation & Capsular Release",
        diagnosis: "Adhesive Capsulitis (Frozen Shoulder - Stage 1/2)",
        treatment: `Day ${day}: Ultrasonic therapy + hot fomentation + Codman pendulum swings + gentle passive glenohumeral mobilization.`
      };
    } else if (day <= 6) {
      return {
        focus: "Shoulder Mobilization & Range Restoration",
        diagnosis: "Adhesive Capsulitis (Mobilization Phase)",
        treatment: `Day ${day}: Grade III inferior/posterior glide mobilization + finger ladder / pulley elevation + isometric rotator cuff strengthening.`
      };
    } else {
      return {
        focus: "Rotator Cuff Dynamic Strengthening",
        diagnosis: "Restored Glenohumeral Mobility (Late Rehab)",
        treatment: `Day ${day}: Theraband internal/external rotation drills + overhead functional reaching + proprioceptive stability drills.`
      };
    }
  }

  // 4. Knee / Osteoarthritis / ACL / Ligament
  if (text.includes("knee") || text.includes("ghutna") || text.includes("osteoarthritis") || text.includes("patell") || text.includes("acl") || text.includes("meniscus")) {
    if (day <= 2) {
      return {
        focus: "Knee Joint Effusion & Pain Relief",
        diagnosis: "Knee Osteoarthritis (Grade II/III Pain Relief)",
        treatment: `Day ${day}: IFT with hot pack over knee joint + static quadriceps activation + passive patellar glides.`
      };
    } else if (day <= 6) {
      return {
        focus: "Quadriceps & Hamstring Strengthening",
        diagnosis: "Knee Osteoarthritis Rehabilitation",
        treatment: `Day ${day}: Straight leg raises (SLR) with 1kg weight cuff + short arc quads + closed chain mini-squats + calf stretching.`
      };
    } else {
      return {
        focus: "Weight-Bearing & Functional Gait Training",
        diagnosis: "Knee Rehab (Functional Gait Training)",
        treatment: `Day ${day}: Step-ups + resistance loop hip abductor activation + proprioceptive wobble board balance drills.`
      };
    }
  }

  // 5. Paralysis / Stroke / Neuro Rehab / Hemiplegia
  if (text.includes("paralysis") || text.includes("stroke") || text.includes("neuro") || text.includes("hemiplegia") || text.includes("lakwa") || text.includes("brain")) {
    return {
      focus: "Neuro Retraining & Gait",
      diagnosis: "Post-Stroke Motor Hemiparesis Rehabilitation",
      treatment: `Day ${day}: Neuromuscular electrical stimulation (NMES) + PNF diagonals + weight-shifting in parallel bars + active-assisted hemiplegic limb facilitation.`
    };
  }

  // 6. Cerebral Palsy (CP Child)
  if (text.includes("cp") || text.includes("cerebral") || text.includes("child") || text.includes("pediatric")) {
    return {
      focus: "Cerebral Palsy Pediatric Rehab",
      diagnosis: "Spastic Cerebral Palsy Motor Development",
      treatment: `Day ${day}: Sensory integration + dynamic trunk balance on Physioball + tone inhibition & prolonged hamstring/tendo-achilles stretching.`
    };
  }

  // 7. Cupping Therapy
  if (text.includes("cup") || text.includes("hijama")) {
    return {
      focus: "Cupping Therapy Session",
      diagnosis: "Myofascial Pain Syndrome & Muscle Adhesions",
      treatment: `Day ${day}: Dynamic gliding cupping + targeted dry cupping decompression (10-15 mins) + localized soothing massage.`
    };
  }

  // Default General Physio Protocol
  return {
    focus: "Follow-up Rehabilitation",
    diagnosis: diagnosisOrConcern ? `${diagnosisOrConcern} (Day ${day} Active Rehab)` : `Daily Physiotherapy Session (Day ${day})`,
    treatment: `Day ${day}: Targeted therapeutic modality (IFT/TENS) + manual joint mobilization + tailored functional therapeutic exercises.`
  };
};

// =============================================================================
// REUSABLE TOUCH-FRIENDLY TIME PICKER SELECTOR COMPONENT
// =============================================================================
export function TimePickerSelector({ value, onChange, label, sublabel, allowLive = true }) {
  const [mode, setMode] = useState("auto"); // "auto" | "slots" | "custom"
  const [hour, setHour] = useState("10");
  const [minute, setMinute] = useState("30");
  const [period, setPeriod] = useState("AM");

  useEffect(() => {
    if (value) {
      const match = String(value).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        setHour(match[1].padStart(2, "0"));
        setMinute(match[2]);
        setPeriod((match[3] || "AM").toUpperCase());
      }
    }
  }, [value]);

  const presetSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
    "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM"
  ];

  const handleSetLiveNow = () => {
    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    onChange(nowStr);
    setMode("auto");
  };

  const handleCustomChange = (newH, newM, newP) => {
    const h = newH !== undefined ? newH : hour;
    const m = newM !== undefined ? newM : minute;
    const p = newP !== undefined ? newP : period;
    setHour(h);
    setMinute(m);
    setPeriod(p);
    onChange();
    setMode("custom");
  };

  const handleNativeTimeChange = (e) => {
    const val = e.target.value; // e.g. "14:30"
    if (!val) return;
    const [h24, m] = val.split(":");
    let hNum = parseInt(h24, 10);
    const p = hNum >= 12 ? "PM" : "AM";
    hNum = hNum % 12 || 12;
    const hStr = String(hNum).padStart(2, "0");
    setHour(hStr);
    setMinute(m);
    setPeriod(p);
    onChange();
    setMode("custom");
  };

  const get24HrTime = () => {
    if (!value) return "";
    const match = String(value).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return "";
    let h = parseInt(match[1], 10);
    const m = match[2];
    const isPM = (match[3] || "AM").toUpperCase() === "PM";
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return ;
  };

  return (
    <div className="time-picker-selector-wrap" style={{ marginTop: "6px", marginBottom: "6px" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
          <label style={{ margin: 0, fontWeight: "700", color: "var(--heading, #0f172a)", fontSize: "13px" }}>
            {label}
            {sublabel && <small style={{ color: "#0284c7", fontWeight: "600", marginLeft: "6px" }}>{sublabel}</small>}
          </label>
          <div style={{ display: "inline-flex", gap: "4px", flexWrap: "wrap" }}>
            {allowLive && (
              <button
                type="button"
                onClick={handleSetLiveNow}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: "700",
                  borderRadius: "6px",
                  border: "1px solid #0284c7",
                  background: mode === "auto" ? "linear-gradient(135deg, #0284c7, #0369a1)" : "rgba(2, 132, 199, 0.1)",
                  color: mode === "auto" ? "#ffffff" : "#0284c7",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                title="Auto-match to current live clock time"
              >
                ⚡ Live Clock
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode(mode === "slots" ? "auto" : "slots")}
              style={{
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: "700",
                borderRadius: "6px",
                border: "1px solid #059669",
                background: mode === "slots" ? "linear-gradient(135deg, #059669, #047857)" : "rgba(5, 150, 105, 0.1)",
                color: mode === "slots" ? "#ffffff" : "#059669",
                cursor: "pointer"
              }}
            >
              🕒 Choose Slot
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "custom" ? "auto" : "custom")}
              style={{
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: "700",
                borderRadius: "6px",
                border: "1px solid #d97706",
                background: mode === "custom" ? "linear-gradient(135deg, #d97706, #b45309)" : "rgba(217, 119, 6, 0.1)",
                color: mode === "custom" ? "#ffffff" : "#d97706",
                cursor: "pointer"
              }}
            >
              ⚙️ Hour/Min
            </button>
          </div>
        </div>
      )}

      {/* Selected Time Display Pill & Native Quick Picker */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(2, 132, 199, 0.06)",
        padding: "8px 12px",
        borderRadius: "8px",
        border: "1.5px solid #38bdf8"
      }}>
        <span style={{ fontSize: "18px" }}>🕒</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--heading, #0f172a)", letterSpacing: "0.5px" }}>
            {value || "10:30 AM"}
          </span>
          <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "8px" }}>
            {mode === "auto" ? "(⚡ Live Auto)" : mode === "slots" ? "(🕒 Slot)" : "(⚙️ Custom)"}
          </span>
        </div>
        <label style={{ margin: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", background: "#0284c7", color: "#ffffff", padding: "5px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: "700", position: "relative" }}>
          <span>Choose Time ⌚</span>
          <input
            type="time"
            value={get24HrTime()}
            onChange={handleNativeTimeChange}
            style={{
              opacity: 0,
              width: "100%",
              height: "100%",
              position: "absolute",
              left: 0,
              top: 0,
              cursor: "pointer"
            }}
          />
        </label>
      </div>

      {/* Quick 1-Tap Preset Slots Tray */}
      {mode === "slots" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(82px, 1fr))",
          gap: "6px",
          marginTop: "8px",
          padding: "10px",
          background: "rgba(2, 132, 199, 0.08)",
          borderRadius: "8px",
          border: "1px solid rgba(2, 132, 199, 0.25)"
        }}>
          {presetSlots.map(slot => (
            <button
              key={slot}
              type="button"
              onClick={() => { onChange(slot); setMode("slots"); }}
              style={{
                padding: "6px 2px",
                fontSize: "11.5px",
                fontWeight: value === slot ? "800" : "600",
                borderRadius: "6px",
                border: value === slot ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
                background: value === slot ? "#0284c7" : "#ffffff",
                color: value === slot ? "#ffffff" : "#0f172a",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              {slot}
            </button>
          ))}
        </div>
      )}

      {/* Custom Dropdowns (Hour, Minute, Period) */}
      {mode === "custom" && (
        <div style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          marginTop: "8px",
          padding: "10px",
          background: "rgba(217, 119, 6, 0.08)",
          borderRadius: "8px",
          border: "1px solid rgba(217, 119, 6, 0.25)"
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "2px" }}>Hour</label>
            <select
              value={hour}
              onChange={(e) => handleCustomChange(e.target.value, undefined, undefined)}
              style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "700" }}
            >
              {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "2px" }}>Minute</label>
            <select
              value={minute}
              onChange={(e) => handleCustomChange(undefined, e.target.value, undefined)}
              style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "700" }}
            >
              {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "2px" }}>AM / PM</label>
            <select
              value={period}
              onChange={(e) => handleCustomChange(undefined, undefined, e.target.value)}
              style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "700" }}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}


export default function DoctorPortal({ onClose, themeProps }) {
  const fallbackTheme = useTheme();
  const theme = themeProps || fallbackTheme;
  const { themePreference, setTheme, isDark } = theme;
  const [token, setToken] = useState(() => localStorage.getItem("doctor_token") || "");
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "new-patient", "patients", "today", "enquiries", "settings"
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayVisitsCount: 0,
    newPatientsCount: 0,
    totalVisitsCount: 0,
    totalEnquiriesCount: 0,
    newEnquiriesCount: 0,
    syncStatus: "Connected",
    pendingSyncCount: 0
  });

  // Auth State
  const [loginForm, setLoginForm] = useState({ email: "shivamupsc8@gmail.com", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("shivamupsc8@gmail.com");
  const [forgotStatus, setForgotStatus] = useState({ message: "", token: "", isError: false });
  const [resetTokenInput, setResetTokenInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");

  // Change Password State
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState({ text: "", isError: false });

  // Patients & Enquiries State
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [patientFilter, setPatientFilter] = useState("all"); // "all", "today", "active", "waiting", "completed"
  const [patientSort, setPatientSort] = useState("newest"); // "newest", "name", "visits"
  const [todayVisits, setTodayVisits] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVisits, setPatientVisits] = useState([]);

  // Modals & Consultation Flow
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [shareFeedback, setShareFeedback] = useState("");
  const [showDoctorMore, setShowDoctorMore] = useState(false);

  // Custom Webhook Settings State
  const [customWebhookInput, setCustomWebhookInput] = useState(() => getWebhookUrl());
  const [webhookSavedMsg, setWebhookSavedMsg] = useState("");
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Clinic Map Location State
  const DEFAULT_CLINIC_LOCATION = {
    address: "Amravati Chauraha, Vindhyachal, Mirzapur (U.P.)",
    lat: 25.1337,
    lng: 82.5644,
    name: "Vindhy Physio & Rehab Center"
  };

  const [clinicLocation, setClinicLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("vindhy_clinic_location");
      return saved ? JSON.parse(saved) : DEFAULT_CLINIC_LOCATION;
    } catch {
      return DEFAULT_CLINIC_LOCATION;
    }
  });
  const [locationAddressInput, setLocationAddressInput] = useState(() => clinicLocation.address);
  const [locationLatInput, setLocationLatInput] = useState(() => clinicLocation.lat);
  const [locationLngInput, setLocationLngInput] = useState(() => clinicLocation.lng);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [locationSavedMsg, setLocationSavedMsg] = useState("");

  // Patient Portal Security Account State (Doctor Controls)
  const [patientAccountData, setPatientAccountData] = useState(null);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [accountActionMsg, setAccountActionMsg] = useState({ text: "", isError: false });
  const [newPatientPassInput, setNewPatientPassInput] = useState("");
  const [copiedPatientPin, setCopiedPatientPin] = useState(false);

  // Link Enquiry to Existing Patient State
  const [linkingEnquiry, setLinkingEnquiry] = useState(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [showSpamFilter, setShowSpamFilter] = useState(false);

  // Patient Profile & Visit Details Accordion State
  const [expandedVisitIds, setExpandedVisitIds] = useState({});
  const toggleVisitExpand = (vId) => {
    setExpandedVisitIds(prev => ({ ...prev, [vId]: !prev[vId] }));
  };

  // Leads Management & Direct Conversion States
  const [enquirySubTab, setEnquirySubTab] = useState("active"); // "active", "converted", "hidden", "all"
  const [enquirySearchQuery, setEnquirySearchQuery] = useState("");
  const [convertingLead, setConvertingLead] = useState(null);
  const [convertingLeadForm, setConvertingLeadForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    address: "Vindhyachal, Mirzapur",
    reasonForVisit: "Spine & Back Pain",
    complaint: "",
    diagnosis: "Initial Physiotherapy Assessment",
    treatmentNotes: "Physical evaluation and targeted physiotherapy therapy.",
    fee: "₹300",
    followUpDate: "As Advised"
  });
  const [convertLoading, setConvertLoading] = useState(false);
  const [leadActionToast, setLeadActionToast] = useState("");

  const handleSearchPlaceLocation = async (e) => {
    if (e) e.preventDefault();
    if (!locationAddressInput.trim()) return;
    setLocationSearchLoading(true);
    setLocationSavedMsg("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationAddressInput.trim())}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const place = data[0];
        const newLat = parseFloat(place.lat);
        const newLng = parseFloat(place.lon);
        setLocationLatInput(newLat);
        setLocationLngInput(newLng);
        const updated = {
          address: locationAddressInput.trim(),
          lat: newLat,
          lng: newLng,
          name: place.display_name.split(",")[0] || "Vindhy Physio & Rehab Center"
        };
        setClinicLocation(updated);
        localStorage.setItem("vindhy_clinic_location", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("clinic-location-updated", { detail: updated }));
        setLocationSavedMsg("📍 Location found and pinned on map!");
        setTimeout(() => setLocationSavedMsg(""), 5000);
      } else {
        setLocationSavedMsg("⚠️ Place not found automatically. You can enter Latitude & Longitude directly.");
      }
    } catch (err) {
      setLocationSavedMsg("⚠️ Search service busy. You can save manual Latitude & Longitude.");
    } finally {
      setLocationSearchLoading(false);
    }
  };

  const handleSaveClinicLocation = (e) => {
    if (e) e.preventDefault();
    const updated = {
      address: locationAddressInput.trim() || DEFAULT_CLINIC_LOCATION.address,
      lat: parseFloat(locationLatInput) || DEFAULT_CLINIC_LOCATION.lat,
      lng: parseFloat(locationLngInput) || DEFAULT_CLINIC_LOCATION.lng,
      name: "Vindhy Physio & Rehab Center"
    };
    setClinicLocation(updated);
    localStorage.setItem("vindhy_clinic_location", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("clinic-location-updated", { detail: updated }));
    setLocationSavedMsg("✅ Clinic location and map marker saved successfully!");
    setTimeout(() => setLocationSavedMsg(""), 5000);
  };

  const getNowTimeStr = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const cleanDateOnly = (d) => {
    if (!d) return new Date().toISOString().slice(0, 10);
    const s = String(d).trim();
    if (s.includes("GMT") || s.includes("T") || s.length > 10) {
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    return s.slice(0, 10);
  };

  const filteredPatients = useMemo(() => {
    let list = [...patients];
    const todayStr = new Date().toISOString().slice(0, 10);
    if (patientFilter === "today") {
      list = list.filter(p => cleanDateOnly(p.lastVisitDate || p.registrationDate) === todayStr);
    } else if (patientFilter === "active") {
      list = list.filter(p => (p.status || "Active").toLowerCase() === "active");
    } else if (patientFilter === "waiting") {
      list = list.filter(p => (p.status || "").toLowerCase().includes("wait") || p.totalVisits === 0);
    } else if (patientFilter === "completed") {
      list = list.filter(p => (p.status || "").toLowerCase().includes("complete"));
    }

    if (patientSort === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (patientSort === "visits") {
      list.sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0));
    } else {
      list.sort((a, b) => (b.registrationDate || b.patientId || "").localeCompare(a.registrationDate || a.patientId || ""));
    }
    return list;
  }, [patients, patientFilter, patientSort]);

  // Standalone Comprehensive Clinical Hindi / Hinglish / Raw English Translator
  const translateSymptomsToEnglish = (rawText) => {
    if (!rawText || !rawText.trim()) return "";
    let str = rawText.trim();

    // 1. Compound Hindi Devanagari expressions
    const devanagariMap = [
      { pattern: /कमर\s*(में)?\s*(बहुत\s*)?(तेज़\s*|ज्यादा\s*)?दर्द/gi, text: "severe lower back (lumbar) pain" },
      { pattern: /गर्दन\s*(में)?\s*(बहुत\s*)?(तेज़\s*|ज्यादा\s*)?दर्द/gi, text: "cervical neck pain and stiffness" },
      { pattern: /घुटने?\s*(में)?\s*(बहुत\s*)?(तेज़\s*|ज्यादा\s*)?दर्द/gi, text: "knee joint arthritis and pain" },
      { pattern: /कंधा\s*जाम|हाथ\s*नहीं\s*उठ\s*रहा/gi, text: "frozen shoulder (adhesive capsulitis) with restricted mobility" },
      { pattern: /पैर\s*(में)?\s*(झनझनाहट|झुनझुनी|सुन्न)/gi, text: "lower extremity paresthesia, tingling and numbness" },
      { pattern: /हाथ\s*(में)?\s*(झनझनाहट|झुनझुनी|सुन्न)/gi, text: "upper limb tingling, numbness and paresthesia" },
      { pattern: /सूजन\s*(है)?/gi, text: "localized joint swelling and edema" },
      { pattern: /चलने\s*में\s*(दिक्कत|परेशानी|तकलीफ)|चल\s*नहीं\s*पा\s*रहे/gi, text: "impaired ambulation and difficulty in walking" },
      { pattern: /उठने\s*बैठने\s*में\s*(दिक्कत|परेशानी)/gi, text: "difficulty in sit-to-stand movements and weight-bearing" },
      { pattern: /झुकने\s*(पर|में)\s*(दर्द|दिक्कत)/gi, text: "pain aggravated on forward flexion/bending" },
      { pattern: /नस\s*(दब\s*गई|खिंच\s*रही|ब्लॉक)/gi, text: "lumbar nerve root compression / sciatica radiculopathy" },
      { pattern: /लकवा|फालिज|पैरालिसिस/gi, text: "motor hemiplegia / neurological muscle weakness" },
      { pattern: /चक्कर\s*(आता\s*है|आना|आ\s*रहा)/gi, text: "cervical vertigo and dizziness" },
      { pattern: /सुबह\s*(जकड़न|अकड़न)/gi, text: "morning joint stiffness" },
      { pattern: /एड़ी\s*(में)?\s*दर्द|पैर\s*के\s*तलवे\s*में\s*दर्द/gi, text: "plantar fasciitis / calcaneal heel pain" },
      { pattern: /चोट\s*लग\s*गई|गिर\s*गए\s*थे|मोच\s*आ\s*गई/gi, text: "post-traumatic musculoskeletal sprain / contusion" },
      { pattern: /बहुत\s*दिन\s*से|पुराना\s*दर्द/gi, text: "chronic persistent pain" },
      { pattern: /दर्द/gi, text: "pain" },
      { pattern: /कमर|पीठ/gi, text: "lumbar spine" },
      { pattern: /गर्दन/gi, text: "cervical neck" },
      { pattern: /घुटना|घुटने/gi, text: "knee joint" },
      { pattern: /कंधा|कंधे/gi, text: "shoulder" },
      { pattern: /पैर|पैरों|टांग/gi, text: "lower limb" },
      { pattern: /हाथ|हाथों|कलाई/gi, text: "upper limb / hand" },
      { pattern: /रीढ़/gi, text: "spine" },
      { pattern: /नस/gi, text: "nerve" },
      { pattern: /सूजन/gi, text: "swelling" }
    ];

    devanagariMap.forEach(({ pattern, text }) => {
      str = str.replace(pattern, text);
    });

    // 2. Compound Hinglish & phonetic expressions
    const hinglishMap = [
      { pattern: /kamar\s*(me)?\s*(bahut\s*|bohot\s*)?(tez\s*|jyada\s*)?dard/gi, text: "severe lower back (lumbar) pain" },
      { pattern: /gardan\s*(me)?\s*(bahut\s*|bohot\s*)?(tez\s*|jyada\s*)?dard/gi, text: "cervical neck pain and stiffness" },
      { pattern: /ghutne?\s*(me)?\s*(bahut\s*|bohot\s*)?(tez\s*|jyada\s*)?dard/gi, text: "knee joint pain and stiffness" },
      { pattern: /kandha\s*jam|hath\s*nahi\s*uth\s*raha/gi, text: "frozen shoulder (adhesive capsulitis) with restricted mobility" },
      { pattern: /jhanjhanahat|jhunjhuni|sunn\s*pad\s*jana|sunn/gi, text: "neuropathic tingling, numbness and paresthesia" },
      { pattern: /sujan|sweling|swelling/gi, text: "localized joint swelling and edema" },
      { pattern: /chalne\s*me\s*(dikkat|problem|pareshani)|chal\s*nahi\s*pa\s*rahe/gi, text: "impaired ambulation and difficulty in walking" },
      { pattern: /uthne\s*baithne\s*me\s*(dikkat|problem)/gi, text: "difficulty in sit-to-stand transitions" },
      { pattern: /jhukne\s*me\s*(dikkat|dard|problem)/gi, text: "pain aggravated on forward flexion/bending" },
      { pattern: /nas\s*(dab\s*gayi|khinch\s*rahi|dab\s*gaya|block)/gi, text: "lumbar nerve root compression / sciatica radiculopathy" },
      { pattern: /lakwa|paralysis|falij/gi, text: "neurological motor hemiplegia / paralysis" },
      { pattern: /chakkar\s*(aana|aata\s*hai|aa\s*raha)/gi, text: "cervical vertigo and dizziness" },
      { pattern: /subah\s*(jakdan|stiffness|akdan)/gi, text: "morning joint stiffness" },
      { pattern: /edhi\s*(me)?\s*dard|heel\s*pain|talwe\s*me\s*dard/gi, text: "plantar fasciitis / calcaneal heel pain" },
      { pattern: /chot\s*lag\s*gayi|gir\s*gaye\s*the|moch/gi, text: "post-traumatic musculoskeletal sprain" },
      { pattern: /bahut\s*tez\s*dard|bohot\s*dard/gi, text: "acute severe pain" },
      { pattern: /\bkamar\b/gi, text: "lumbar back" },
      { pattern: /\bgardan\b/gi, text: "cervical neck" },
      { pattern: /\bghutna\b|\bghutne\b/gi, text: "knee" },
      { pattern: /\bkandha\b|\bkandhe\b/gi, text: "shoulder" },
      { pattern: /\bpair\b|\bpaav\b/gi, text: "lower limb" },
      { pattern: /\bhath\b|\bhaath\b/gi, text: "upper limb" },
      { pattern: /\bdard\b/gi, text: "pain" },
      { pattern: /\bdikkat\b|\bpareshani\b/gi, text: "discomfort" },
      { pattern: /\bdin\s*se\b/gi, text: "days duration" },
      { pattern: /\bmahine\s*se\b/gi, text: "months duration" }
    ];

    hinglishMap.forEach(({ pattern, text }) => {
      str = str.replace(pattern, text);
    });

    // 3. Common English spelling and phonetic fixes
    const spellingMap = [
      { pattern: /\bbak\s*pain\b/gi, text: "back pain" },
      { pattern: /\bnek\s*pain\b/gi, text: "neck pain" },
      { pattern: /\bsweling\b/gi, text: "swelling" },
      { pattern: /\bstifness\b/gi, text: "stiffness" },
      { pattern: /\btinling\b/gi, text: "tingling" },
      { pattern: /\bscatica\b/gi, text: "sciatica" },
      { pattern: /\bsholder\b/gi, text: "shoulder" },
      { pattern: /\bcant\s*walk\b/gi, text: "unable to walk properly" }
    ];

    spellingMap.forEach(({ pattern, text }) => {
      str = str.replace(pattern, text);
    });

    // Clean whitespace and capitalize
    str = str.replace(/\s+/g, " ").trim();
    if (str.length > 0) {
      str = str.charAt(0).toUpperCase() + str.slice(1);
      if (!str.endsWith(".")) str += ".";
    }
    return str;
  };

  const [translatingIntake, setTranslatingIntake] = useState(false);
  const [translatingConsult, setTranslatingConsult] = useState(false);

  // Enrollment Form State (Step 1: Patient Intake)
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    altPhone: "",
    address: "Vindhyachal, Mirzapur",
    dob: "",
    emergencyContact: "",
    isFirstTime: "Yes",
    reasonForVisit: "Spine & Back Pain",
    reasonForVisitSelect: "Spine & Back Pain",
    duration: "1 to 2 Weeks",
    complaint: "",
    referredBy: "Self / Walk-in",
    visitTime: getNowTimeStr()
  });
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  // Doctor Consultation & Treatment Form State (Step 2: Diagnosis & Fee Entry)
  const [activeConsultPatient, setActiveConsultPatient] = useState(null);
  const [consultForm, setConsultForm] = useState({
    visitDate: new Date().toISOString().slice(0, 10),
    visitTime: getNowTimeStr(),
    visitTimeSelect: "Custom",
    reason: "Spine & Back Pain",
    complaint: "",
    duration: "",
    diagnosis: "Lumbar Spondylosis (L4-L5 Disc Bulge) with Muscle Spasm",
    treatmentNotes: "IFT + Ultrasonic therapy applied for 15 mins. Core isometric exercises taught.",
    fee: "500",
    followUpDate: "",
    followUpTime: ""
  });
  const [consultLoading, setConsultLoading] = useState(false);

  // Add Subsequent Visit State
  const [newVisitForm, setNewVisitForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: "10:30 AM",
    timeSelect: "10:30 AM",
    reason: "Physiotherapy Follow-up Treatment",
    complaint: "",
    diagnosis: "",
    treatmentNotes: "Electrotherapy + manual decompression + targeted postural re-education.",
    fee: "500",
    followUpDate: "",
    followUpTime: "",
    status: "Completed"
  });

  const [syncLoading, setSyncLoading] = useState(false);
  const receiptPrintRef = useRef(null);

  // ================= REAL-TIME CLOUD AUTO-SYNC (6s Live Background Sync) =================
  useEffect(() => {
    if (!token) return;

    let syncInterval;
    const performLiveSync = async () => {
      if (document.hidden) return; // Save bandwidth if tab is in background
      try {
        if (getWebhookUrl()) {
          await restoreFromGoogleSheets();
        }
        await Promise.all([fetchStats(), fetchPatients(), fetchTodayVisits(), fetchEnquiries()]);
      } catch (e) {
        // silent background sync
      }
    };

    // 1. Instant sync when browser tab is opened / focused
    const handleWindowFocus = () => {
      performLiveSync();
    };
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleWindowFocus);
    document.addEventListener("visibilitychange", handleWindowFocus);

    // 2. Continuous 7-second background live sync loop
    syncInterval = setInterval(performLiveSync, 7000);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("online", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleWindowFocus);
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      api.verifyMe(token)
        .then(async (data) => {
          if (data.ok) {
            setDoctorInfo(data.doctor);
            // Auto-pull fresh cloud records from Google Sheets on any device
            if (getWebhookUrl()) {
              try {
                setSyncLoading(true);
                await restoreFromGoogleSheets();
              } catch (err) {
                console.log("Auto-cloud sync on load:", err);
              } finally {
                setSyncLoading(false);
              }
            }
            fetchStats();
            fetchPatients();
            fetchTodayVisits();
            fetchEnquiries();
          }
        })
        .catch(() => {
          setToken("");
          localStorage.removeItem("doctor_token");
        });
    }
  }, [token]);

  // Phone hardware/browser back button navigation handling for Doctor Portal
  useEffect(() => {
    if (!window.history.state || window.history.state.portal !== "doctor") {
      window.history.replaceState({ portal: "doctor", tab: "dashboard" }, "");
    }

    const handlePopState = () => {
      // 1. If Doctor More sheet is open, close it
      if (showDoctorMore) {
        setShowDoctorMore(false);
        return;
      }
      // 2. If Add visit modal or receipt modal is open, close it
      if (showAddVisitModal) {
        setShowAddVisitModal(false);
        return;
      }
      if (activeReceipt) {
        setActiveReceipt(null);
        return;
      }
      // 3. If Patient profile modal is open, close it
      if (selectedPatient) {
        setSelectedPatient(null);
        return;
      }
      // 4. If on another tab, return to dashboard
      if (activeTab !== "dashboard") {
        setActiveTab("dashboard");
        return;
      }
      // 5. If already on dashboard, exit portal to site
      if (onClose) {
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showDoctorMore, showAddVisitModal, activeReceipt, selectedPatient, activeTab, onClose]);

  const selectDoctorTab = (tab) => {
    if (tab !== activeTab) {
      window.history.pushState({ portal: "doctor", tab }, "");
      setActiveTab(tab);
    }
    setShowDoctorMore(false);
  };

  const toggleDoctorMore = () => {
    if (!showDoctorMore) {
      window.history.pushState({ portal: "doctor", sheet: "more" }, "");
      setShowDoctorMore(true);
    } else {
      setShowDoctorMore(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      if (data.ok) setStats(data.stats);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPatients = async (query = "") => {
    try {
      const data = await api.getPatients(query);
      if (data.ok) setPatients(data.patients);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTodayVisits = async () => {
    try {
      const data = await api.getTodayVisits();
      if (data.ok) setTodayVisits(data.visits);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEnquiries = async () => {
    try {
      const data = await api.getEnquiries();
      if (data.ok) setEnquiries(data.enquiries);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await api.login(loginForm);
      setToken(data.token);
      localStorage.setItem("doctor_token", data.token);
      setDoctorInfo(data.doctor);
      fetchStats();
      fetchPatients();
      fetchTodayVisits();
      fetchEnquiries();
    } catch (err) {
      setAuthError(err.message || "Invalid credentials");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    try {
      localStorage.removeItem("doctor_token");
      localStorage.removeItem("active_portal");
      if (window.location.hash === "#doctor") {
        history.replaceState(null, "", window.location.pathname);
      }
    } catch (e) {}
    setDoctorInfo(null);
    setSelectedPatient(null);
    setActiveReceipt(null);
    setShowDoctorMore(false);
    if (onClose) onClose();
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotStatus({ message: "Generating reset token...", token: "", isError: false });
    try {
      const data = await api.forgotPassword(forgotEmail);
      setForgotStatus({
        message: `Reset token created. Enter it below to set your new password.`,
        token: data.resetToken,
        isError: false
      });
      setResetTokenInput(data.resetToken || "");
    } catch (err) {
      setForgotStatus({ message: err.message, token: "", isError: true });
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await api.resetPassword({
        token: resetTokenInput,
        newPassword: newPasswordInput
      });
      alert(data.message || "Password reset successfully! Please log in with your new password.");
      setShowForgotModal(false);
      setLoginForm({ email: forgotEmail, password: newPasswordInput });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: "", isError: false });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ text: "New passwords do not match.", isError: true });
      return;
    }
    try {
      const data = await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordMsg({ text: data.message || "Password changed successfully!", isError: false });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      if (doctorInfo) {
        setDoctorInfo({ ...doctorInfo, isTemporaryPassword: false });
      }
    } catch (err) {
      setPasswordMsg({ text: err.message, isError: true });
    }
  };

  const handleEnrollPatient = async (e) => {
    e.preventDefault();
    setEnrollError("");
    setEnrollLoading(true);
    try {
      const data = await api.createPatient(newPatientForm);
      
      fetchStats();
      fetchPatients();
      fetchTodayVisits();

      setNewPatientForm({
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        altPhone: "",
        address: "Vindhyachal, Mirzapur",
        dob: "",
        emergencyContact: "",
        isFirstTime: "Yes",
        reasonForVisit: "Spine & Back Pain",
        reasonForVisitSelect: "Spine & Back Pain",
        duration: "1 to 2 Weeks",
        complaint: "",
        referredBy: "Self / Walk-in",
        visitTime: getNowTimeStr(),
        visitTimeSelect: "Custom"
      });

      // Switch to Waiting Queue
      setActiveTab("waiting");
      setShareFeedback(`✅ Patient ${data.patient.name} (${data.patient.patientId}) enrolled and added to Waiting Queue!`);
      setTimeout(() => setShareFeedback(""), 4000);
    } catch (err) {
      setEnrollError(err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

    const openQuickDailyVisitModal = (patient) => {
    if (!patient) return;
    setSelectedPatient(patient);

    const existingCount = (patient.totalVisits || (patientVisits ? patientVisits.length : 0)) || 0;
    const nextVisitNum = existingCount + 1;
    const initialConcern = patient.lastDiagnosis || patient.firstVisitReason || patient.reasonForVisit || "Physiotherapy Rehabilitation";
    const protocol = generateDailyPhysioProtocol(initialConcern, nextVisitNum);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    setNewVisitForm({
      visitDate: new Date().toISOString().slice(0, 10),
      visitTime: getNowTimeStr(),
      reasonForVisit: protocol.focus,
      complaint: `Day ${nextVisitNum} rehabilitation: ${patient.firstVisitReason || initialConcern}`,
      diagnosis: patient.lastDiagnosis || protocol.diagnosis,
      treatmentNotes: protocol.treatment,
      fee: patient.lastFee ? String(patient.lastFee).replace(/[^0-9]/g, "") : "500",
      followUpDate: tomorrowStr,
      followUpTime: "10:30 AM",
      status: "Completed"
    });

    setShowAddVisitModal(true);
  };

  const handleOpenConsultationModal = (patient) => {
    setActiveConsultPatient(patient);
    setConsultForm({
      visitDate: new Date().toISOString().slice(0, 10),
      visitTime: getNowTimeStr(),
      visitTimeSelect: "Custom",
      reason: patient.firstVisitReason || "Physiotherapy Rehabilitation",
      complaint: patient.complaint || "Initial Pain & Stiffness",
      duration: patient.duration || "1 to 2 Weeks",
      diagnosis: patient.firstVisitReason ? `${patient.firstVisitReason} (Active Rehabilitation)` : "Lumbar Spondylosis (L4-L5 Disc Bulge)",
      treatmentNotes: "Electrotherapy (IFT) + Targeted manual decompression + Isometric strengthening exercises.",
      fee: "500",
      followUpDate: "",
      followUpTime: ""
    });
  };

  const handleFinalizeConsultationSubmit = async (e) => {
    e.preventDefault();
    if (!activeConsultPatient) return;
    setConsultLoading(true);
    try {
      const data = await api.finalizeConsultation(activeConsultPatient.patientId, consultForm);
      fetchStats();
      fetchPatients();
      fetchTodayVisits();
      setActiveConsultPatient(null);
      // Immediately open the official receipt modal
      setActiveReceipt({ patient: data.patient, visit: data.visit });
      setShareFeedback(`✅ Consultation finalized! Fee: ${data.visit.fee}. Official receipt ready.`);
    } catch (err) {
      alert("Error finalizing consultation: " + err.message);
    } finally {
      setConsultLoading(false);
    }
  };

  const convertEnquiryToPatient = (enquiry) => {
    const cleanPhone = String(enquiry.phone || "").replace(/\D/g, "").slice(-10);
    const resolvedName = (
      enquiry.name ||
      enquiry.patientName ||
      enquiry.fullName ||
      patients.find(p => String(p.phone || "").replace(/\D/g, "").slice(-10) === cleanPhone)?.name ||
      ""
    ).trim();

    setNewPatientForm({
      name: resolvedName,
      age: "",
      gender: "Male",
      phone: enquiry.phone || "",
      altPhone: "",
      address: "Vindhyachal, Mirzapur",
      dob: "",
      emergencyContact: "",
      reasonForVisit: enquiry.painArea || "Spine & Back Pain",
      complaint: enquiry.concern || "",
      diagnosis: "",
      referredBy: "Website Consultation Form",
      visitDate: new Date().toISOString().slice(0, 10),
      visitTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      treatmentNotes: "Initial consultation from online booking.",
      followUpDate: "",
      status: "In Consultation"
    });
    setActiveTab("new-patient");
  };

  const openPatientProfile = async (patientId) => {
    try {
      const data = await api.getPatientDetails(patientId);
      if (data.ok) {
        setSelectedPatient(data.patient);
        setPatientVisits(data.visits);
        setNewPatientPassInput("");
        setAccountActionMsg({ text: "", isError: false });
        api.getPatientAccount(patientId).then(accRes => {
          if (accRes && accRes.ok) {
            setPatientAccountData(accRes);
          }
        });
      }
    } catch (err) {
      alert("Failed to load patient profile.");
    }
  };

  const handleDoctorResetPatientPassword = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPatient || !newPatientPassInput || newPatientPassInput.length < 4) {
      setAccountActionMsg({ text: "Please enter a password with at least 4 characters.", isError: true });
      return;
    }
    setAccountActionLoading(true);
    setAccountActionMsg({ text: "", isError: false });
    try {
      const res = await api.setPatientPassword(selectedPatient.patientId, newPatientPassInput);
      if (res.ok) {
        setAccountActionMsg({ text: "✅ Password updated successfully for patient.", isError: false });
        setNewPatientPassInput("");
        const acc = await api.getPatientAccount(selectedPatient.patientId);
        if (acc.ok) setPatientAccountData(acc);
      } else {
        setAccountActionMsg({ text: res.error || "Failed to set password.", isError: true });
      }
    } catch (err) {
      setAccountActionMsg({ text: err.message, isError: true });
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleDoctorResetToDefault = async () => {
    if (!selectedPatient) return;
    setAccountActionLoading(true);
    setAccountActionMsg({ text: "", isError: false });
    try {
      const res = await api.resetPatientPasswordToDefault(selectedPatient.patientId);
      if (res.ok) {
        setAccountActionMsg({ text: "✅ Password reset to default 'vindhy' successfully.", isError: false });
        const acc = await api.getPatientAccount(selectedPatient.patientId);
        if (acc.ok) setPatientAccountData(acc);
      } else {
        setAccountActionMsg({ text: res.error || "Failed to reset password to default.", isError: true });
      }
    } catch (err) {
      setAccountActionMsg({ text: err.message, isError: true });
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleTogglePatientAccountStatus = async (currentStatus) => {
    if (!selectedPatient) return;
    const targetStatus = currentStatus === "disabled" ? "active" : "disabled";
    setAccountActionLoading(true);
    setAccountActionMsg({ text: "", isError: false });
    try {
      const res = await api.togglePatientAccountStatus(selectedPatient.patientId, targetStatus);
      if (res.ok) {
        setAccountActionMsg({ text: `✅ Patient portal account is now ${targetStatus}.`, isError: false });
        const acc = await api.getPatientAccount(selectedPatient.patientId);
        if (acc.ok) setPatientAccountData(acc);
      } else {
        setAccountActionMsg({ text: res.error || "Failed to toggle status.", isError: true });
      }
    } catch (err) {
      setAccountActionMsg({ text: err.message, isError: true });
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleHideEnquiry = async (enquiry) => {
    if (!enquiry || !enquiry.id) return;
    setEnquiries(prev => prev.map(e => String(e.id) === String(enquiry.id) ? { ...e, status: "Hidden" } : e));
    setLeadActionToast("Lead moved to Hidden section.");
    setTimeout(() => setLeadActionToast(""), 3000);
    try {
      await api.updateEnquiryStatus(enquiry.id, "Hidden");
      fetchEnquiries();
    } catch (err) {
      console.error("Failed to hide enquiry:", err);
      fetchEnquiries();
    }
  };

  const handleUnhideEnquiry = async (enquiry) => {
    if (!enquiry || !enquiry.id) return;
    setEnquiries(prev => prev.map(e => String(e.id) === String(enquiry.id) ? { ...e, status: "New" } : e));
    setLeadActionToast("Lead restored to Active leads.");
    setTimeout(() => setLeadActionToast(""), 3000);
    try {
      await api.updateEnquiryStatus(enquiry.id, "New");
      fetchEnquiries();
    } catch (err) {
      console.error("Failed to unhide enquiry:", err);
      fetchEnquiries();
    }
  };

  const handleDeleteEnquiry = async (enquiry) => {
    if (!enquiry || !enquiry.id) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the lead from "${enquiry.name || 'Patient'}"? This lead will never show again.`);
    if (!confirmDelete) return;

    setEnquiries(prev => prev.filter(e => String(e.id) !== String(enquiry.id)));
    setLeadActionToast("Lead permanently deleted.");
    setTimeout(() => setLeadActionToast(""), 3000);

    try {
      await api.deleteEnquiry(enquiry.id);
      fetchEnquiries();
    } catch (err) {
      console.error("Failed to delete enquiry:", err);
      fetchEnquiries();
    }
  };

  const openQuickConvertModal = (enquiry) => {
    const cleanPhone = String(enquiry.phone || "").replace(/\D/g, "").slice(-10);
    const resolvedName = (
      enquiry.name ||
      enquiry.patientName ||
      enquiry.fullName ||
      patients.find(p => String(p.phone || "").replace(/\D/g, "").slice(-10) === cleanPhone)?.name ||
      ""
    ).trim();

    setConvertingLead(enquiry);
    setConvertingLeadForm({
      name: resolvedName,
      age: enquiry.age || "",
      gender: "Male",
      phone: cleanPhone || enquiry.phone || "",
      address: "Vindhyachal, Mirzapur",
      reasonForVisit: enquiry.painArea || "Spine & Back Pain",
      complaint: enquiry.concern || "",
      diagnosis: `Clinical Evaluation for ${enquiry.painArea || "Physiotherapy"}`,
      treatmentNotes: "Patient enrolled from online website lead. Initial consultation scheduled.",
      fee: "₹300",
      followUpDate: "As Advised"
    });
  };

  const handleDirectEnrollSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!convertingLeadForm.name.trim() || !convertingLeadForm.phone.trim()) {
      alert("Please enter patient name and mobile number.");
      return;
    }

    setConvertLoading(true);
    try {
      // 1. Create Patient Record
      const pRes = await api.createPatient({
        name: convertingLeadForm.name.trim(),
        age: convertingLeadForm.age ? Number(convertingLeadForm.age) : 30,
        gender: convertingLeadForm.gender || "Male",
        phone: convertingLeadForm.phone.trim(),
        address: convertingLeadForm.address.trim(),
        reasonForVisit: convertingLeadForm.reasonForVisit,
        complaint: convertingLeadForm.complaint
      });

      const createdPatient = pRes.patient;

      // 2. Finalize Consultation
      await api.finalizeConsultation(createdPatient.patientId, {
        reason: convertingLeadForm.reasonForVisit,
        complaint: convertingLeadForm.complaint,
        diagnosis: convertingLeadForm.diagnosis,
        treatmentNotes: convertingLeadForm.treatmentNotes,
        fee: convertingLeadForm.fee,
        followUpDate: convertingLeadForm.followUpDate
      });

      // 3. Mark Enquiry Converted
      if (convertingLead && convertingLead.id) {
        await api.updateEnquiryStatus(convertingLead.id, "Converted", createdPatient.patientId);
      }

      setConvertingLead(null);
      setLeadActionToast(`🎉 Patient ${createdPatient.name} (${createdPatient.patientId}) enrolled successfully!`);
      setTimeout(() => setLeadActionToast(""), 5000);

      await Promise.all([fetchPatients(), fetchEnquiries(), fetchStats()]);
      openPatientProfile(createdPatient.patientId);
    } catch (err) {
      alert("Failed to enroll patient: " + err.message);
    } finally {
      setConvertLoading(false);
    }
  };

  const handleLinkEnquiryToPatient = async (enquiry, targetPatient) => {
    if (!enquiry || !enquiry.id || !targetPatient) return;
    const status = `Linked: ${targetPatient.patientId}`;

    // Optimistic UI update
    setEnquiries(prev => prev.map(e => String(e.id) === String(enquiry.id) ? { ...e, status, linkedPatientId: targetPatient.patientId } : e));
    setLinkingEnquiry(null);

    try {
      const res = await api.updateEnquiryStatus(enquiry.id, status, targetPatient.patientId);
      if (res.ok) {
        fetchEnquiries();
        alert(`✓ Enquiry linked successfully to ${targetPatient.name} (${targetPatient.patientId}) without creating duplicate records.`);
      }
    } catch (err) {
      console.error("Failed to link enquiry:", err);
      alert("Failed to link enquiry: " + err.message);
      fetchEnquiries();
    }
  };

  const handleAddVisit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const data = await api.createVisit(selectedPatient.patientId, newVisitForm);
      if (!data.ok) throw new Error("Failed to add visit");
      
      setShowAddVisitModal(false);
      openPatientProfile(selectedPatient.patientId);
      fetchStats();
      fetchPatients();
      fetchTodayVisits();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFinalizeAndIssueReceipt = (patient, visit) => {
    setActiveReceipt({ patient, visit });
  };

  const handleRestoreFromSheets = async () => {
    if (!confirm("Restore all patient records, visits, and bookings from Google Sheets into the website?")) return;
    setRestoreLoading(true);
    try {
      const data = await restoreFromGoogleSheets();
      alert(data.message || "Data restored successfully from Google Sheets!");
      fetchStats();
      fetchPatients();
      fetchTodayVisits();
      fetchEnquiries();
    } catch (err) {
      alert("Restore failed: " + err.message);
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleCleanAndRestoreFromSheets = async () => {
    if (!window.confirm("This will clear any old test data and pull real patients & visits directly from your Google Sheet. Proceed?")) {
      return;
    }
    setRestoreLoading(true);
    try {
      clearLocalPatientsCache();
      const res = await restoreFromGoogleSheets();
      fetchPatients();
      fetchTodayVisits();
      fetchEnquiries();
      fetchStats();
      if (res && res.ok) {
        alert(`✅ Success! Synced ${res.patientsCount || 0} patients and ${res.visitsCount || 0} visits from your Google Sheet.`);
      } else {
        alert("✅ Cache reset. Data will sync directly from your active Google Sheet.");
      }
    } catch (err) {
      alert("Error pulling from Google Sheets. Please check your Webhook URL in Cloud Settings.");
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncLoading(true);
    try {
      const webhookUrl = getWebhookUrl();
      if (!webhookUrl) {
        alert("Please configure your Google Sheets Webhook URL below in settings first.");
        return;
      }
      // Trigger sync for all current patients and visits
      patients.forEach(p => syncToGoogleSheets("sync_patient", p));
      todayVisits.forEach(v => syncToGoogleSheets("sync_visit", v));
      alert("All records sent to Google Sheets!");
      fetchStats();
      fetchPatients();
      fetchEnquiries();
    } catch (err) {
      alert("Sync failed. Check network or webhook settings.");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSaveCustomWebhook = async (e) => {
    e.preventDefault();
    const cleanUrl = (customWebhookInput || "").trim();
    if (!cleanUrl) {
      setWebhookUrl("");
      setWebhookSavedMsg("Webhook URL cleared.");
      setTimeout(() => setWebhookSavedMsg(""), 3000);
      return;
    }
    setWebhookUrl(cleanUrl);
    setWebhookSavedMsg("⏳ Connecting to Google Sheets Cloud Database and pulling records...");
    try {
      setRestoreLoading(true);
      const res = await restoreFromGoogleSheets();
      setWebhookSavedMsg(`✅ Connected! Auto-restored ${res.patientsCount} patients and ${res.visitsCount} visits.`);
      fetchStats();
      fetchPatients();
      fetchTodayVisits();
      fetchEnquiries();
    } catch (err) {
      setWebhookSavedMsg(`⚠️ Webhook saved! (${err.message})`);
    } finally {
      setRestoreLoading(false);
      setTimeout(() => setWebhookSavedMsg(""), 6000);
    }
  };

  // Note: buildReceiptPDF and downloadReceiptPDF are imported from ./receiptUtils

  const handleDownloadPDF = (receipt) => {
    if (!receipt || !receipt.patient || !receipt.visit) return;
    const doc = buildReceiptPDF(receipt);
    const fileName = `Vindhy_Receipt_${receipt.patient.name.replace(/\s+/g, "_")}_${receipt.patient.patientId}_Visit${receipt.visit.visitNumber || 1}.pdf`;
    doc.save(fileName);
    setShareFeedback(`✅ PDF Receipt downloaded successfully as "${fileName}"`);
  };

  const handleViewPDF = (receipt) => {
    if (!receipt || !receipt.patient || !receipt.visit) return;
    const doc = buildReceiptPDF(receipt);
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, "_blank");
  };

  // Direct WhatsApp PDF & Prescription Sharing Workflow
  const handleWhatsAppDirectShare = async (receipt) => {
    if (!receipt || !receipt.patient || !receipt.visit) return;
    const { patient, visit } = receipt;
    let cleanDigits = String(patient.phone || "").replace(/\D/g, "");
    if (cleanDigits.startsWith("0")) cleanDigits = cleanDigits.substring(1);
    const patientPhone = cleanDigits.startsWith("91") && cleanDigits.length > 10 ? cleanDigits : `91${cleanDigits}`;
    const fileName = `Vindhy_Receipt_${patient.name.replace(/\s+/g, "_")}_${patient.patientId}_Visit${visit.visitNumber || 1}.pdf`;
    const doc = buildReceiptPDF(receipt);
    const pdfBlob = doc.output("blob");

    const followUpSummary = visit.followUpDate
      ? `${visit.followUpDate}${visit.followUpTime ? ` (${visit.followUpTime})` : ""}`
      : "None Required (Only Today Consultation Completed / SOS)";

    const cleanFeeDisplay = `₹${String(visit.fee || "500").replace(/[^0-9]/g, "")}`;

    // Clean, highly professional WhatsApp receipt message
    const receiptSummary = 
`🏥 *VINDHYA PHYSIO & REHAB CENTER*
*Official Patient Consultation & Clinical Receipt*
--------------------------------------------
👤 *Patient Name:* ${patient.name}
🆔 *Patient ID:* ${patient.patientId}
📅 *Visit Date & Time:* ${visit.date} ${visit.time ? `(${visit.time})` : ""}
🩺 *Reason / Diagnosis:* ${visit.diagnosis || visit.reason || "Physiotherapy Rehabilitation"}
💊 *Treatment Done:* ${visit.treatmentNotes || "Comprehensive physical evaluation & exercise guidance"}
💰 *Consultation Fee:* ${cleanFeeDisplay} (Paid & Settled)
🗓️ *Next Follow-up:* ${followUpSummary}
--------------------------------------------
👨‍⚕️ *Consultant:* Dr. Satyam Vishwakarma
📍 *Clinic Address:* Amravati Chauraha, Vindhyachal, Mirzapur (U.P.)
📞 *Helpline:* +91 9793093316 | WhatsApp: +91 8382024264
--------------------------------------------
📄 *Official Digital Clinical Receipt*
_(Saved in patient clinic records)_`;

    // 1. Download official PDF document to device
    try {
      doc.save(fileName);
    } catch (e) {
      console.log("PDF download:", e);
    }

    // 2. Copy receipt summary to clipboard
    try {
      await navigator.clipboard.writeText(receiptSummary);
    } catch (e) {}

    setShareFeedback(`✅ Opening direct WhatsApp chat for ${patient.name} (+91 ${patient.phone})...`);

    // 3. Directly open WhatsApp for that exact patient's phone number
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${patientPhone}&text=${encodeURIComponent(receiptSummary)}`;
    
    // Direct navigation to WhatsApp
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyPhoneNumber = async (phone) => {
    if (!phone) return;
    let cleanDigits = String(phone).replace(/\D/g, "");
    if (cleanDigits.startsWith("0")) cleanDigits = cleanDigits.substring(1);
    const formatted = cleanDigits.startsWith("91") && cleanDigits.length > 10 ? cleanDigits : `91${cleanDigits}`;
    try {
      await navigator.clipboard.writeText(formatted);
      setShareFeedback(`✅ Phone number +${formatted} copied to clipboard!`);
    } catch {
      setShareFeedback(`Phone: +${formatted}`);
    }
    setTimeout(() => setShareFeedback(""), 3500);
  };

  const handleDeletePatient = async (patientId, patientName) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete patient "${patientName}" (${patientId}) and all associated visit records?\n\nThis action cannot be undone.`)) {
      return;
    }
    try {
      // Immediately remove from UI state
      setPatients((prev) => prev.filter((p) => p.patientId !== patientId));
      setTodayVisits((prev) => prev.filter((v) => v.patientId !== patientId));
      if (selectedPatient && selectedPatient.patientId === patientId) {
        setSelectedPatient(null);
      }

      await api.deletePatient(patientId);

      fetchStats();
      fetchPatients();
      fetchTodayVisits();
      alert(`Patient "${patientName}" (${patientId}) has been permanently deleted.`);
    } catch (err) {
      fetchPatients();
      alert("Could not delete patient: " + err.message);
    }
  };

  const handleExportCSV = (type = "visits") => {
    api.exportCSV(type);
  };

  // ==========================================
  // RENDER: LOGIN VIEW (FORCED DARK THEME)
  // ==========================================
  if (!token) {
    return (
      <div className="doctor-portal-modal-overlay doctor-login-forced-dark" data-theme="dark">
        <div className="doctor-login-card doctor-login-card-dark" data-theme="dark">
          <div className="login-header">
            <img
              src={CLINIC_LOGO_B64 || "/vindhy-receipt-logo.png"}
              alt="Vindhy Physio & Rehab Center"
              className="login-logo-img prominent-landing-logo"
            />
            <h2>Doctor Portal Login</h2>
            <p>Authorized access for Dr. Satyam Vishwakarma</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {authError && <div className="auth-alert error">{authError}</div>}
            
            <label>
              Authorized Email
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="shivamupsc8@gmail.com"
                autoComplete="username"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Enter doctor password"
                autoComplete="current-password"
              />
            </label>

            <div className="login-links">
              <button
                type="button"
                className="text-link-btn"
                onClick={() => setShowForgotModal(true)}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="primary-btn full-btn" disabled={authLoading}>
              {authLoading ? "Authenticating Doctor..." : "Login to Doctor Portal"}
            </button>

            <button type="button" className="secondary-btn full-btn close-modal-btn" onClick={onClose}>
              Back to Website
            </button>
          </form>

          {showForgotModal && (
            <div className="inner-modal-overlay doctor-inner-modal-overlay" data-theme="dark">
              <div className="inner-modal-card doctor-inner-modal-dark" data-theme="dark">
                <h3>Reset Doctor Password</h3>
                <p>Verify authorized doctor email to generate a secure reset token.</p>
                
                <form onSubmit={handleForgotSubmit}>
                  <label>
                    Authorized Email
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </label>
                  <button type="submit" className="primary-btn full-btn">Generate Reset Token</button>
                </form>

                {forgotStatus.message && (
                  <div className={`status-box ${forgotStatus.isError ? "error" : "success"}`}>
                    {forgotStatus.message}
                    {forgotStatus.token && (
                      <div className="token-display">
                        <strong>Token:</strong> <code>{forgotStatus.token}</code>
                      </div>
                    )}
                  </div>
                )}

                {forgotStatus.token && (
                  <form onSubmit={handleResetSubmit} className="reset-confirm-form">
                    <label>
                      Reset Token
                      <input
                        type="text"
                        value={resetTokenInput}
                        onChange={(e) => setResetTokenInput(e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      New Password (min 6 chars)
                      <input
                        type="password"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        required
                        minLength={6}
                      />
                    </label>
                    <button type="submit" className="primary-btn full-btn">Confirm New Password</button>
                  </form>
                )}

                <button
                  type="button"
                  className="secondary-btn full-btn"
                  style={{ marginTop: "10px" }}
                  onClick={() => setShowForgotModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: DOCTOR DASHBOARD & CLINIC MANAGEMENT
  // ==========================================
  return (
    <div className="doctor-portal-fullscreen">
      <header className="doctor-navbar">
        <div className="doctor-nav-top-row">
          <div className="doctor-nav-brand">
            <img
              src={CLINIC_LOGO_B64 || "/vindhy-logo-light.png"}
              alt="Vindhy Physio & Rehab Center"
              className="doctor-nav-logo"
            />
            <div className="doctor-brand-text">
              <strong>Dr. Satyam Vishwakarma</strong>
              <span>Consultant Physiotherapist (B.P.T.)</span>
            </div>
          </div>

          <div className="doctor-nav-actions">
            {(() => {
              const isInstalledApp = typeof window !== "undefined" && (
                window.matchMedia("(display-mode: standalone)").matches ||
                window.navigator.standalone === true ||
                localStorage.getItem("vindhy_app_installed") === "true"
              );
              const isMobileScreen = typeof window !== "undefined" && (
                /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || window.innerWidth <= 768
              );
              if (!isMobileScreen || isInstalledApp) return null;
              return (
                <button
                  className="download-app-icon-btn doctor-download-icon-btn"
                  onClick={() => {
                    if (window.deferredPWAInstallPrompt) {
                      window.deferredPWAInstallPrompt.prompt();
                    } else {
                      alert("To install the Vindhy Physio App on your phone, tap your browser's menu (⋮ or Share icon) and select 'Add to Home Screen' or 'Install App'.");
                    }
                  }}
                  title="Download / Install App on Phone"
                  aria-label="Download App"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              );
            })()}
            <button
              className="sync-badge-btn"
              onClick={() => {
                if (!getWebhookUrl()) {
                  setActiveTab("settings");
                } else {
                  handleManualSync();
                }
              }}
              title={getWebhookUrl() ? "Google Sheets Connected (Click to sync)" : "Click to connect Google Sheets Webhook"}
            >
              <span className={`sync-dot ${getWebhookUrl() ? "green" : "orange"}`}></span>
              {syncLoading ? "Syncing..." : "Sync"}
            </button>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              Logout
            </button>
            <button className="close-portal-btn" onClick={onClose} title="Return to public website">
              ✕ Exit
            </button>
          </div>
        </div>

        <nav className="doctor-nav-tabs">
          <button className={activeTab === "new-patient" ? "active" : ""} onClick={() => setActiveTab("new-patient")}>
            ➕ 1. Intake Patient
          </button>
          <button className={activeTab === "waiting" ? "active" : ""} onClick={() => setActiveTab("waiting")}>
            ⏳ 2. Waiting Queue {patients.filter(p => p.status === "Waiting for Doctor" || p.totalVisits === 0).length > 0 && (
              <span className="enq-badge" style={{ background: "#f59e0b" }}>
                {patients.filter(p => p.status === "Waiting for Doctor" || p.totalVisits === 0).length}
              </span>
            )}
          </button>
          <button className={activeTab === "patients" ? "active" : ""} onClick={() => { setActiveTab("patients"); fetchPatients(); }}>
            👥 3. All Patients ({patients.length})
          </button>
          <button className={activeTab === "today" ? "active" : ""} onClick={() => { setActiveTab("today"); fetchTodayVisits(); }}>
            📅 4. Today's Visits ({todayVisits.length})
          </button>
          <button className={activeTab === "enquiries" ? "active" : ""} onClick={() => { setActiveTab("enquiries"); fetchEnquiries(); }}>
            📩 5. Online Bookings {stats.newEnquiriesCount > 0 && <span className="enq-badge">{stats.newEnquiriesCount}</span>}
          </button>
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
            ⚙️ 6. Cloud Settings
          </button>
        </nav>
      </header>

      {doctorInfo?.isTemporaryPassword && (
        <div className="temp-password-banner">
          ⚠️ <strong>Security Notice:</strong> You are using the temporary password. Please set your private password in Settings.
          <button onClick={() => setActiveTab("settings")}>Change Password</button>
        </div>
      )}

      <main className="doctor-main-content">
        
        {/* ================= 1. DASHBOARD VIEW ================= */}
        {activeTab === "dashboard" && (
          <div className="dashboard-view mobile-app-home-view">
            {/* Mobile App Doctor Greeting */}
            <div className="mobile-app-greeting-card doctor-greeting">
              <div className="mobile-hero-brand">
                <img
                  src={CLINIC_LOGO_B64}
                  alt="Vindhy Physio & Rehab Center"
                  className="mobile-hero-logo"
                />
              </div>

              <div className="greeting-text">
                <span className="greeting-wave">👋</span>
                <div>
                  <h1 className="greeting-title" style={{ color: "#ffffff", textShadow: "0 2px 10px rgba(0, 0, 0, 0.8)", fontWeight: 800 }}>
                    Hello, Dr. Satyam!
                  </h1>
                  <p className="greeting-subtitle" style={{ color: "rgba(255, 255, 255, 0.95)", textShadow: "0 1px 4px rgba(0, 0, 0, 0.6)" }}>
                    Clinical Operations • Vindhy Physio &amp; Rehab Center
                  </p>
                </div>
              </div>
              <button 
                className="doctor-intake-primary-action desktop-only-widget" 
                onClick={() => selectDoctorTab("new-patient")}
              >
                <span className="action-plus">➕</span>
                <span>Intake New Patient</span>
              </button>
            </div>

            {/* 6 Primary Live-Count Cards Grid */}
            <div className="mobile-app-grid-6">
              <div className="mobile-app-card" onClick={() => selectDoctorTab("new-patient")}>
                <div className="card-icon-bubble blue">➕</div>
                <strong className="card-title">Intake Patient</strong>
              </div>

              <div className="mobile-app-card" onClick={() => selectDoctorTab("waiting")}>
                <div className="card-icon-bubble amber">⏳</div>
                <strong className="card-title">Waiting Queue</strong>
                <span className="card-count-badge amber">
                  {patients.filter(p => p.status === "Waiting for Doctor" || p.totalVisits === 0).length}
                </span>
              </div>

              <div className="mobile-app-card" onClick={() => { selectDoctorTab("patients"); fetchPatients(); }}>
                <div className="card-icon-bubble teal">👥</div>
                <strong className="card-title">All Patients</strong>
                <span className="card-count-badge teal">{stats.totalPatients || patients.length}</span>
              </div>

              <div className="mobile-app-card" onClick={() => { selectDoctorTab("today"); fetchTodayVisits(); }}>
                <div className="card-icon-bubble green">📅</div>
                <strong className="card-title">Today's Visits</strong>
                <span className="card-count-badge green">{stats.todayVisitsCount || todayVisits.length}</span>
              </div>

              <div className="mobile-app-card" onClick={() => { selectDoctorTab("enquiries"); fetchEnquiries(); }}>
                <div className="card-icon-bubble purple">📩</div>
                <strong className="card-title">Online Bookings</strong>
                <span className="card-count-badge purple">{stats.totalEnquiriesCount || enquiries.length}</span>
              </div>

              <div className="mobile-app-card" onClick={() => { selectDoctorTab("enquiries"); fetchEnquiries(); }}>
                <div className="card-icon-bubble cyan">🌐</div>
                <strong className="card-title">Website Enquiries</strong>
                <span className="card-count-badge cyan">
                  {enquiries.filter(e => e.status !== "Resolved").length || enquiries.length}
                </span>
              </div>
            </div>

            {!getWebhookUrl() && (
              <div className="cloud-sync-banner-card desktop-only-widget">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>☁️</span>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#f59e0b", fontSize: "14px", fontWeight: "700" }}>Enable Multi-Device Cloud Sync</h4>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
                      Connect Google Sheets Webhook to sync patient records across phone & desktop.
                    </p>
                  </div>
                </div>
                <button className="primary-btn" onClick={() => setActiveTab("settings")} style={{ padding: "6px 14px", fontSize: "12px", whiteSpace: "nowrap" }}>
                  Connect
                </button>
              </div>
            )}

            {/* Split view: Today's Queue & Recent Patients */}
            <div className="dashboard-split desktop-only-widget">
              <div className="dash-panel today-queue-compact-card">
                <div className="panel-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Today's Patient Queue</h3>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{todayVisits.length} visits registered today</span>
                  </div>
                  <button className="text-link-btn" onClick={() => { setActiveTab("today"); fetchTodayVisits(); }}>View All →</button>
                </div>
                <div className="today-visits-list">
                  {todayVisits.slice(0, 4).map(v => (
                    <div className="today-visit-item" key={v.visitId} onClick={() => openPatientProfile(v.patientId)}>
                      <div className="visit-time-box">{v.time || "Today"}</div>
                      <div className="visit-item-info">
                        <strong>{v.patientName}</strong> <span className="text-muted">({v.patientId})</span>
                        <p>{v.reason} • Visit #{v.visitNumber}</p>
                      </div>
                      <span className={`visit-badge ${v.status === "Completed" ? "green" : "orange"}`}>
                        {v.status || "Completed"}
                      </span>
                    </div>
                  ))}
                  {todayVisits.length === 0 && (
                    <p className="empty-state" style={{ padding: "16px 0", textAlign: "center" }}>No visits recorded for today yet.</p>
                  )}
                </div>
              </div>

              <div className="dash-panel">
                <div className="panel-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Recent Patients</h3>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{patients.length} total enrolled</span>
                  </div>
                  <button className="text-link-btn" onClick={() => { setActiveTab("patients"); fetchPatients(); }}>View All →</button>
                </div>
                <div className="table-responsive">
                  <table className="doctor-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.slice(0, 5).map(p => (
                        <tr key={p.patientId}>
                          <td><span className="patient-id-badge">{p.patientId}</span></td>
                          <td><strong>{p.name}</strong> ({p.age}y/{p.gender?.[0] || ""})</td>
                          <td>+91 {p.phone}</td>
                          <td>
                            <button className="table-action-btn" onClick={() => openPatientProfile(p.patientId)}>Consult & Slip</button>
                          </td>
                        </tr>
                      ))}
                      {patients.length === 0 && (
                        <tr>
                          <td colSpan="4" className="empty-cell">No patients enrolled yet. Click "+ Intake New Patient" to start.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 1. PATIENT INTAKE (STEP 1) ================= */}
        {activeTab === "new-patient" && (
          <div className="enroll-view">
            <div className="section-header-row">
              <div>
                <h2>Step 1: Patient Intake & Registration</h2>
                <p>Register arriving patient details & problem history. Patient will be placed in the Waiting Queue for Dr. Satyam Vishwakarma.</p>
              </div>
            </div>

            {enrollError && <div className="auth-alert error">{enrollError}</div>}

            <form onSubmit={handleEnrollPatient} className="enroll-form-card">
              <h3 className="form-section-title">1. Patient Personal & Contact Information</h3>
              <div className="form-row-3">
                <label>
                  Full Name *
                  <input
                    type="text"
                    required
                    value={newPatientForm.name}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                  />
                </label>
                <label>
                  Age (Years) *
                  <input
                    type="number"
                    required
                    value={newPatientForm.age}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                    placeholder="e.g. 45"
                  />
                </label>
                <label>
                  Gender *
                  <select
                    value={newPatientForm.gender}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>

              <div className="form-row-3">
                <label>
                  Primary Phone Number (10 Digits) *
                  <div className="phone-prefix-input">
                    <span>+91</span>
                    <input
                      type="tel"
                      required
                      maxLength="10"
                      value={newPatientForm.phone}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                </label>
                <label>
                  Alternate Phone (Optional)
                  <div className="phone-prefix-input">
                    <span>+91</span>
                    <input
                      type="tel"
                      maxLength="10"
                      value={newPatientForm.altPhone}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, altPhone: e.target.value })}
                      placeholder="Alternate phone"
                    />
                  </div>
                </label>
                <label>
                  Emergency Contact (Optional)
                  <input
                    type="text"
                    value={newPatientForm.emergencyContact}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyContact: e.target.value })}
                    placeholder="Relation & Phone"
                  />
                </label>
              </div>

              <div className="form-row-2">
                <label>
                  Address / City
                  <input
                    type="text"
                    value={newPatientForm.address}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })}
                    placeholder="e.g. Amravati Chauraha, Vindhyachal"
                  />
                </label>
                <label>
                  Referred By
                  <select
                    value={newPatientForm.referredBySelect || "Self / Walk-in"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPatientForm({
                        ...newPatientForm,
                        referredBySelect: val,
                        referredBy: val === "Custom" ? "" : val
                      });
                    }}
                  >
                    <option value="Self / Walk-in">Self / Walk-in</option>
                    <option value="Friend / Relative Referral">Friend / Relative Referral</option>
                    <option value="Old Patient Reference">Old Patient Reference</option>
                    <option value="Hospital / Clinic Reference">Hospital / Clinic Reference</option>
                    <option value="Google / Social Media / Online">Google / Social Media / Online</option>
                    <option value="Custom">✏️ Other / Custom Referrer...</option>
                  </select>
                </label>
              </div>

              {newPatientForm.referredBySelect === "Custom" && (
                <div className="form-row-1" style={{ marginTop: "8px" }}>
                  <label>
                    Type Referrer / Doctor Name
                    <input
                      type="text"
                      required
                      value={newPatientForm.referredBy}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, referredBy: e.target.value })}
                      placeholder="Enter referrer name (doctor, hospital, relative, etc.)"
                    />
                  </label>
                </div>
              )}

              <h3 className="form-section-title" style={{ marginTop: "24px" }}>2. Problem, Symptoms & History</h3>
              <div className="form-row-3">
                <label>
                  First Time Visiting Clinic? *
                  <select
                    value={newPatientForm.isFirstTime}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, isFirstTime: e.target.value })}
                  >
                    <option value="Yes">Yes (First Time Patient)</option>
                    <option value="No">No (Returning Patient)</option>
                  </select>
                </label>

                <label>
                  Primary Problem / Pain Area *
                  <select
                    value={newPatientForm.reasonForVisitSelect || newPatientForm.reasonForVisit}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPatientForm({
                        ...newPatientForm,
                        reasonForVisitSelect: val,
                        reasonForVisit: val === "Custom" ? "" : val
                      });
                    }}
                  >
                    <option value="Spine & Back Pain">Spine & Back Pain</option>
                    <option value="Knee & Joint Arthritis">Knee & Joint Arthritis</option>
                    <option value="Neck & Cervical Spondylosis">Neck & Cervical Spondylosis</option>
                    <option value="Cup Therapy">Cup Therapy / Cupping</option>
                    <option value="Neuro Rehabilitation">Neuro Rehabilitation</option>
                    <option value="Paralysis Rehabilitation">Paralysis Rehabilitation</option>
                    <option value="Stroke Recovery">Stroke Recovery</option>
                    <option value="CP (Child) Therapy">CP (Child) Therapy / Cerebral Palsy</option>
                    <option value="Sports Injury Rehab">Sports Injury Rehab</option>
                    <option value="Post-Surgical Rehab">Post-Surgical Rehab</option>
                    <option value="Frozen Shoulder">Frozen Shoulder</option>
                    <option value="Sciatica & Nerve Pain">Sciatica & Nerve Pain</option>
                    <option value="Bell's Palsy / Facial Palsy">Bell's Palsy / Facial Palsy</option>
                    <option value="General Physiotherapy">General Physiotherapy</option>
                    <option value="Custom">✏️ Other / Custom Problem...</option>
                  </select>
                </label>

                <label>
                  How Long / How Many Times Occurred? *
                  <select
                    value={newPatientForm.durationSelect || "1 to 2 Weeks"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPatientForm({
                        ...newPatientForm,
                        durationSelect: val,
                        duration: val === "Custom" ? "" : val
                      });
                    }}
                  >
                    <option value="Less than 1 Week (Acute)">Less than 1 Week (Acute)</option>
                    <option value="1 to 2 Weeks">1 to 2 Weeks</option>
                    <option value="2 to 4 Weeks (1 Month)">2 to 4 Weeks (1 Month)</option>
                    <option value="1 to 3 Months">1 to 3 Months</option>
                    <option value="3 to 6 Months (Sub-acute)">3 to 6 Months (Sub-acute)</option>
                    <option value="6 Months to 1 Year (Chronic)">6 Months to 1 Year (Chronic)</option>
                    <option value="More than 1 Year / Recurring">More than 1 Year / Recurring</option>
                    <option value="Happened 2-3 times earlier">Happened 2-3 times earlier</option>
                    <option value="Custom">✏️ Other / Custom Duration...</option>
                  </select>
                </label>
              </div>

              {newPatientForm.durationSelect === "Custom" && (
                <div className="form-row-1" style={{ marginTop: "8px" }}>
                  <label>
                    Type Custom Duration / Frequency *
                    <input
                      type="text"
                      required
                      value={newPatientForm.duration}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, duration: e.target.value })}
                      placeholder="e.g. Happened 3 times after gym / Chronic 2 years"
                    />
                  </label>
                </div>
              )}

              {newPatientForm.reasonForVisitSelect === "Custom" && (
                <div className="form-row-1" style={{ marginTop: "8px" }}>
                  <label>
                    Type Custom Problem / Pain Area *
                    <input
                      type="text"
                      required
                      value={newPatientForm.reasonForVisit}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, reasonForVisit: e.target.value })}
                      placeholder="e.g. Ankle Ligament Tear, Plantar Fasciitis, Tennis Elbow, Heel Spur..."
                    />
                  </label>
                </div>
              )}

              <div className="form-row-1" style={{ marginTop: "12px" }}>
                <TimePickerSelector
                  value={newPatientForm.visitTime || getNowTimeStr()}
                  onChange={(val) => setNewPatientForm({ ...newPatientForm, visitTime: val })}
                  label="Intake / Arrival Time *"
                  sublabel="(Choose below or auto-sync with live clock)"
                  allowLive={true}
                />
              </div>

              {/* Patient's Reported Symptoms with AI Translation Button */}
              <div className="form-row-1" style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
                  <label style={{ margin: 0, fontWeight: "700", color: "var(--heading)" }}>
                    Patient's Reported Symptoms & Complaints
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPatientForm.complaint.trim()) {
                        alert("Please type something in Hindi or Hinglish first.");
                        return;
                      }
                      const translated = translateSymptomsToEnglish(newPatientForm.complaint);
                      setNewPatientForm({ ...newPatientForm, complaint: translated });
                    }}
                    disabled={!newPatientForm.complaint}
                    style={{
                      background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                      color: "#ffffff",
                      border: "1px solid #a78bfa",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 8px rgba(139, 92, 246, 0.35)"
                    }}
                    title="Instant smart translation from Hindi/Hinglish to clinical English"
                  >
                    ✨ Convert Hindi / Hinglish ➔ English
                  </button>
                </div>
                <textarea
                  rows="3"
                  value={newPatientForm.complaint}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, complaint: e.target.value })}
                  placeholder="Type in Hindi (जैसे: कमर में दर्द है और पैर में झनझनाहट होती है), Hinglish (e.g. kamar dard chalne me dikkat), or English. Click 'Convert' to auto-translate into medical English."
                />
              </div>

              <div className="form-actions-bar">
                <button type="submit" className="primary-btn" disabled={enrollLoading} style={{ minHeight: "46px", fontSize: "14px", fontWeight: "700" }}>
                  {enrollLoading ? "Enrolling Patient..." : "📥 Save & Add Patient to Waiting Queue"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= 2. WAITING QUEUE / DOCTOR CONSULTATION ROOM ================= */}
        {activeTab === "waiting" && (
          <div className="waiting-queue-view">
            <div className="section-header-row">
              <div>
                <h2>Step 2: Patients Awaiting Doctor Consultation</h2>
                <p>Enrolled patients currently waiting in the clinic. Open a patient to perform examination, enter diagnosis & fee, and issue the official receipt.</p>
              </div>
              <button className="primary-btn" onClick={() => setActiveTab("new-patient")}>
                ➕ 1. Intake New Patient
              </button>
            </div>

            <div className="waiting-patients-grid">
              {patients.filter(p => p.status === "Waiting for Doctor" || p.totalVisits === 0).map(p => (
                <div className="waiting-patient-card" key={p.patientId}>
                  <div className="waiting-card-header">
                    <div className="waiting-badge-row">
                      <span className="status-pill warning">⏳ Waiting for Doctor</span>
                      <span className="patient-id-badge">{p.patientId}</span>
                    </div>
                    <span className="waiting-time-tag" style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #7dd3fc", fontWeight: "700" }}>
                      🕒 Arrived: {p.intakeTime || p.visitTime || "Live Now"}
                    </span>
                  </div>

                  <div className="waiting-card-body">
                    <h3 className="waiting-patient-name">{p.name}</h3>
                    <p className="waiting-patient-sub">
                      {p.age} Yrs • {p.gender} • <strong>Phone:</strong> +91 {p.phone}
                    </p>

                    <div className="waiting-problem-box">
                      <strong>🩺 Chief Concern:</strong> {p.firstVisitReason}
                      <br />
                      <strong>⏱️ Duration:</strong> {p.duration || "Initial onset"}
                      {p.isFirstTime && <span className="first-time-tag"> • First Time Visit</span>}
                    </div>

                    {p.complaint && (
                      <p className="waiting-complaint-snippet">
                        <em>"{p.complaint}"</em>
                      </p>
                    )}
                  </div>

                  <div className="waiting-card-actions">
                    <button
                      className="primary-btn consult-start-btn"
                      onClick={() => handleOpenConsultationModal(p)}
                    >
                      🩺 Start Doctor Consultation & Issue Receipt
                    </button>
                    <div className="waiting-mini-actions">
                      <button
                        className="secondary-btn"
                        onClick={() => openPatientProfile(p.patientId)}
                        title="View Full Profile"
                      >
                        👤 Profile
                      </button>
                      <button
                        className="secondary-btn delete-action"
                        style={{ background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" }}
                        onClick={() => handleDeletePatient(p.patientId, p.name)}
                        title="Delete Patient"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {patients.filter(p => p.status === "Waiting for Doctor" || p.totalVisits === 0).length === 0 && (
                <div className="empty-waiting-card">
                  <span style={{ fontSize: "40px" }}>🎉</span>
                  <h3>No Patients Currently in Waiting Queue!</h3>
                  <p>All enrolled patients have completed their doctor consultations.</p>
                  <button className="primary-btn" onClick={() => setActiveTab("new-patient")} style={{ marginTop: "12px" }}>
                    ➕ 1. Intake Arriving Patient
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= 3. PATIENTS DIRECTORY ================= */}
        {activeTab === "patients" && (
          <div className="patients-directory-view">
            <div className="section-header-row patient-directory-header-banner" style={{
              background: "linear-gradient(135deg, #071927, #0B2A3D)",
              borderRadius: "14px",
              padding: "18px 20px",
              color: "#ffffff",
              marginBottom: "16px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 6px 20px rgba(7, 25, 39, 0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}>
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <h2 style={{ color: "#ffffff", margin: "0 0 4px 0", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.3px" }}>
                  Patient Directory & Clinical Profiles
                </h2>
                <p style={{ color: "#94a3b8", margin: 0, fontSize: "13px" }}>
                  Search by Patient ID (VPR-XXXX), Patient Name, or Phone Number.
                </p>
              </div>
              <button
                className="primary-btn"
                onClick={() => setActiveTab("new-patient")}
                style={{
                  background: "linear-gradient(135deg, #0284c7, #0369a1)",
                  color: "#ffffff",
                  fontWeight: "800",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.35)",
                  whiteSpace: "nowrap"
                }}
              >
                ➕ Intake New Patient
              </button>
            </div>

            <div className="search-bar-container" style={{ width: "100%", marginBottom: "14px" }}>
              <input
                type="text"
                className="search-input full-width-search"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: "44px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  marginBottom: "10px",
                  background: "#ffffff",
                  color: "#0f172a"
                }}
                placeholder="🔍 Search by Patient ID, Name, or 10-digit Phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchPatients(e.target.value);
                }}
              />
              <div className="search-actions-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  className="secondary-btn"
                  onClick={() => handleExportCSV("patients")}
                  style={{ minHeight: "42px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "13px", padding: "8px 12px" }}
                >
                  📥 Export Patients (CSV)
                </button>
                <button
                  className="secondary-btn"
                  style={{ minHeight: "42px", background: "#e0f2fe", color: "#0284c7", borderColor: "#7dd3fc", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", padding: "8px 12px" }}
                  onClick={handleCleanAndRestoreFromSheets}
                  disabled={restoreLoading}
                  title="Clear local test cache and pull latest records from connected Google Sheet"
                >
                  {restoreLoading ? "⏳ Syncing..." : "🔄 Sync Fresh from Sheet"}
                </button>
              </div>
            </div>

            <div className="directory-controls-bar">
              <div className="directory-filter-pills">
                <button
                  className={`filter-pill ${patientFilter === "all" ? "active" : ""}`}
                  onClick={() => setPatientFilter("all")}
                >
                  All ({patients.length})
                </button>
                <button
                  className={`filter-pill ${patientFilter === "today" ? "active" : ""}`}
                  onClick={() => setPatientFilter("today")}
                >
                  📅 Today ({patients.filter(p => cleanDateOnly(p.lastVisitDate || p.registrationDate) === new Date().toISOString().slice(0, 10)).length})
                </button>
                <button
                  className={`filter-pill ${patientFilter === "active" ? "active" : ""}`}
                  onClick={() => setPatientFilter("active")}
                >
                  Active ({patients.filter(p => (p.status || "Active").toLowerCase() === "active").length})
                </button>
                <button
                  className={`filter-pill ${patientFilter === "waiting" ? "active" : ""}`}
                  onClick={() => setPatientFilter("waiting")}
                >
                  ⏳ Waiting ({patients.filter(p => (p.status || "").toLowerCase().includes("wait") || p.totalVisits === 0).length})
                </button>
                <button
                  className={`filter-pill ${patientFilter === "completed" ? "active" : ""}`}
                  onClick={() => setPatientFilter("completed")}
                >
                  ✓ Completed ({patients.filter(p => (p.status || "").toLowerCase().includes("complete")).length})
                </button>
              </div>

              <div className="directory-sort-box">
                <label>Sort:</label>
                <select
                  value={patientSort}
                  onChange={(e) => setPatientSort(e.target.value)}
                  className="sort-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Name (A–Z)</option>
                  <option value="visits">Most Visits</option>
                </select>
              </div>
            </div>

            {/* Desktop Scannable Table (Visible on Tablets & Desktops) */}
            <div className="table-responsive hide-on-mobile">
              <table className="doctor-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Patient Name</th>
                    <th>Age/Gender</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Primary Concern</th>
                    <th>Status</th>
                    <th>Total Visits</th>
                    <th>Last Visit</th>
                    <th style={{ minWidth: "260px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(p => (
                    <tr key={p.patientId}>
                      <td><span className="patient-id-badge">{p.patientId}</span></td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.age}y / {p.gender}</td>
                      <td>+91 {p.phone}</td>
                      <td>{p.address || "Vindhyachal"}</td>
                      <td>{p.firstVisitReason}</td>
                      <td>
                        <span className={`status-badge ${(p.status || "Active").toLowerCase().replace(/\s+/g, '-')}`}>
                          {p.status || "Active"}
                        </span>
                      </td>
                      <td><span className="visit-count-tag">{p.totalVisits || 1} Visits</span></td>
                      <td>{cleanDateOnly(p.lastVisitDate || p.registrationDate)}</td>
                      <td>
                        <div className="patient-table-actions-grid">
                          <button className="table-action-btn btn-profile" onClick={() => openPatientProfile(p.patientId)} title="Open Full Profile">
                            👤 Profile
                          </button>
                          <button 
                            className="table-action-btn"
                            style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", fontWeight: "800" }}
                            onClick={() => openQuickDailyVisitModal(p)} 
                            title="1-Tap Quick Daily Session Entry"
                          >
                            ⚡ +1 Daily Visit
                          </button>
                          <button 
                            className="table-action-btn btn-consult" 
                            onClick={() => {
                              setSelectedPatient(p);
                              setShowAddVisitModal(true);
                            }} 
                            title="Record Consultation / Visit"
                          >
                            ➕ Consult
                          </button>
                          <button 
                            className="table-action-btn btn-whatsapp" 
                            onClick={() => {
                              handleWhatsAppDirectShare({
                                patient: p,
                                visit: {
                                  visitId: `VST-${p.patientId}-1`,
                                  patientId: p.patientId,
                                  patientName: p.name,
                                  phone: p.phone,
                                  visitNumber: p.totalVisits || 1,
                                  date: cleanDateOnly(p.lastVisitDate || p.registrationDate),
                                  time: "10:00 AM",
                                  reason: p.firstVisitReason || "Physiotherapy Rehabilitation",
                                  complaint: p.firstVisitReason || "Consultation",
                                  diagnosis: p.lastDiagnosis || p.firstVisitReason || "Under Evaluation",
                                  treatmentNotes: "Physical evaluation & physiotherapy management.",
                                  followUpDate: "As advised by doctor",
                                  fee: p.lastFee || "₹500",
                                  status: "Completed",
                                  doctor: "Dr. Satyam Vishwakarma"
                                }
                              });
                            }}
                            title="Send Receipt PDF to WhatsApp"
                          >
                            💬 WhatsApp
                          </button>
                          <button 
                            className="table-action-btn btn-delete" 
                            onClick={() => handleDeletePatient(p.patientId, p.name)}
                            title="Permanently delete patient record"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan="10" className="empty-cell">No matching patient records found for the selected filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Patient Cards (No horizontal overflow, compact & touch-friendly) */}
            <div className="mobile-patient-cards hide-on-desktop">
              {filteredPatients.map(p => (
                <article className="mobile-patient-card" key={p.patientId}>
                  <div className="mobile-patient-top">
                    <div>
                      <span className="patient-id-badge">{p.patientId}</span>
                      <h3 className="mobile-patient-name" style={{ color: "#0f172a" }}>{p.name || p.patientName || "Patient"}</h3>
                      <p className="mobile-patient-sub" style={{ color: "#0f172a" }}>{p.age}y • {p.gender} • +91 {p.phone}</p>
                    </div>
                    <span className={`status-badge ${(p.status || "Active").toLowerCase().replace(/\s+/g, '-')}`}>
                      {p.status || "Active"}
                    </span>
                  </div>
                  <div className="mobile-patient-info">
                    <span className="patient-concern-pill">🩺 {p.firstVisitReason}</span>
                    <span className="visit-count-tag">{p.totalVisits || 1} Visits</span>
                  </div>
                  <div className="mobile-patient-actions-2x2">
                    <div className="mobile-actions-row">
                      <button className="table-action-btn btn-profile" onClick={() => openPatientProfile(p.patientId)}>
                        👤 Profile
                      </button>
                      <button 
                        className="table-action-btn btn-daily"
                        style={{ background: "#ecfdf5", color: "#059669", border: "1.5px solid #a7f3d0", fontWeight: "800" }}
                        onClick={() => openQuickDailyVisitModal(p)}
                      >
                        ⚡ +1 Daily Visit
                      </button>
                    </div>
                    <div className="mobile-actions-row">
                      <button 
                        className="table-action-btn btn-consult"
                        onClick={() => {
                          setSelectedPatient(p);
                          setShowAddVisitModal(true);
                        }}
                      >
                        ➕ Consult
                      </button>
                      <button 
                        className="table-action-btn btn-whatsapp"
                        onClick={() => {
                          handleWhatsAppDirectShare({
                            patient: p,
                            visit: {
                              visitId: `VST-${p.patientId}-1`,
                              patientId: p.patientId,
                              patientName: p.name,
                              phone: p.phone,
                              visitNumber: p.totalVisits || 1,
                              date: cleanDateOnly(p.lastVisitDate || p.registrationDate),
                              time: "10:00 AM",
                              reason: p.firstVisitReason || "Physiotherapy Rehabilitation",
                              complaint: p.firstVisitReason || "Consultation",
                              diagnosis: p.lastDiagnosis || p.firstVisitReason || "Under Evaluation",
                              treatmentNotes: "Physical evaluation & physiotherapy management.",
                              followUpDate: "As advised by doctor",
                              fee: p.lastFee || "₹500",
                              status: "Completed",
                              doctor: "Dr. Satyam Vishwakarma"
                            }
                          });
                        }}
                      >
                        💬 WhatsApp
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {filteredPatients.length === 0 && (
                <div className="mobile-empty-card">
                  <p>No matching patient records found for the selected filter.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= 4. TODAY'S VISITS ================= */}
        {activeTab === "today" && (
          <div className="today-visits-view">
            <div className="section-header-row">
              <div>
                <h2>Today's Patient Queue ({new Date().toISOString().slice(0, 10)})</h2>
                <p>Real-time list of all patient consultations logged for today.</p>
              </div>
              <button className="secondary-btn" onClick={() => handleExportCSV("visits")}>
                📥 Export Today's Visits (CSV)
              </button>
            </div>

            <div className="table-responsive">
              <table className="doctor-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient ID</th>
                    <th>Patient Name</th>
                    <th>Phone</th>
                    <th>Visit No</th>
                    <th>Reason / Treatment</th>
                    <th>Doctor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {todayVisits.map(v => (
                    <tr key={v.visitId}>
                      <td><strong>{v.time || "Scheduled"}</strong></td>
                      <td><span className="patient-id-badge">{v.patientId}</span></td>
                      <td>{v.patientName}</td>
                      <td>+91 {v.phone}</td>
                      <td><span className="visit-count-tag">Visit #{v.visitNumber}</span></td>
                      <td>{v.reason}</td>
                      <td>Dr. Satyam Vishwakarma</td>
                      <td>
                        <button className="table-action-btn" onClick={() => openPatientProfile(v.patientId)}>
                          Open Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                  {todayVisits.length === 0 && (
                    <tr>
                      <td colSpan="8" className="empty-cell">No visits recorded for today yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 5. ONLINE BOOKINGS & ENQUIRIES ================= */}
        {activeTab === "enquiries" && (
          <div className="enquiries-view">
            {leadActionToast && (
              <div className="doctor-toast-alert" style={{ background: "#0878C9", color: "#ffffff", padding: "12px 18px", borderRadius: "10px", marginBottom: "16px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 14px rgba(8,120,201,0.3)" }}>
                <span>{leadActionToast}</span>
                <button onClick={() => setLeadActionToast("")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "16px" }}>✕</button>
              </div>
            )}

            <div className="section-header-row">
              <div>
                <h2>Website Consultation Leads ({enquiries.length})</h2>
                <p>Clean, organized cards for every consultation request. Convert directly to registered patients, hide/archive, or delete spam.</p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "14px" }}>
                <button className="secondary-btn" onClick={() => handleExportCSV("enquiries")}>
                  📥 Export Leads (CSV)
                </button>
              </div>
            </div>

            {/* Segmented Leads Navigation Sub-Tabs */}
            <div className="enquiry-subtabs-bar" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px", background: "var(--card-bg, #ffffff)", padding: "6px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
              {(() => {
                const activeCount = enquiries.filter(e => e.status !== "Hidden" && e.status !== "Hidden / Spam" && e.status !== "Converted" && !String(e.status || "").startsWith("Linked:")).length;
                const convertedCount = enquiries.filter(e => e.status === "Converted" || String(e.status || "").startsWith("Linked:")).length;
                const hiddenCount = enquiries.filter(e => e.status === "Hidden" || e.status === "Hidden / Spam").length;
                const allCount = enquiries.length;
                return (
                  <>
                    <button
                      type="button"
                      className={`subtab-btn ${enquirySubTab === "active" ? "active" : ""}`}
                      onClick={() => setEnquirySubTab("active")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                        background: enquirySubTab === "active" ? "#0878C9" : "transparent",
                        color: enquirySubTab === "active" ? "#ffffff" : "var(--text-secondary, #475569)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      📌 Active Leads ({activeCount})
                    </button>
                    <button
                      type="button"
                      className={`subtab-btn ${enquirySubTab === "converted" ? "active" : ""}`}
                      onClick={() => setEnquirySubTab("converted")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                        background: enquirySubTab === "converted" ? "#10b981" : "transparent",
                        color: enquirySubTab === "converted" ? "#ffffff" : "var(--text-secondary, #475569)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      ✅ Converted / Patients ({convertedCount})
                    </button>
                    <button
                      type="button"
                      className={`subtab-btn ${enquirySubTab === "hidden" ? "active" : ""}`}
                      onClick={() => setEnquirySubTab("hidden")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                        background: enquirySubTab === "hidden" ? "#f59e0b" : "transparent",
                        color: enquirySubTab === "hidden" ? "#ffffff" : "var(--text-secondary, #475569)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      👁️ Hidden / Archived Leads ({hiddenCount})
                    </button>
                    <button
                      type="button"
                      className={`subtab-btn ${enquirySubTab === "all" ? "active" : ""}`}
                      onClick={() => setEnquirySubTab("all")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                        background: enquirySubTab === "all" ? "#64748b" : "transparent",
                        color: enquirySubTab === "all" ? "#ffffff" : "var(--text-secondary, #475569)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      📑 All Leads ({allCount})
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Leads Search Bar */}
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="🔍 Search leads by Patient Name, Phone Number, Pain Area, or Symptoms..."
                value={enquirySearchQuery}
                onChange={(e) => setEnquirySearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1.5px solid var(--border-color, #cbd5e1)",
                  background: "var(--input-bg, #ffffff)",
                  color: "var(--text-primary, #0f172a)",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Clean, Separated Cards Grid */}
            {(() => {
              const filteredLeads = enquiries.filter(e => {
                const isHidden = e.status === "Hidden" || e.status === "Hidden / Spam";
                const isConverted = e.status === "Converted" || String(e.status || "").startsWith("Linked:");

                if (enquirySubTab === "active" && (isHidden || isConverted)) return false;
                if (enquirySubTab === "converted" && !isConverted) return false;
                if (enquirySubTab === "hidden" && !isHidden) return false;

                const q = (enquirySearchQuery || "").trim().toLowerCase();
                if (!q) return true;
                const cleanPhone = String(e.phone || "").replace(/\D/g, "");
                const nameMatch = (e.name || e.patientName || "").toLowerCase().includes(q);
                const phoneMatch = cleanPhone.includes(q);
                const painMatch = (e.painArea || "").toLowerCase().includes(q);
                const concernMatch = (e.concern || "").toLowerCase().includes(q);
                const dateMatch = (e.date || "").includes(q);
                return nameMatch || phoneMatch || painMatch || concernMatch || dateMatch;
              });

              if (filteredLeads.length === 0) {
                return (
                  <div className="empty-state-box" style={{ padding: "40px 20px", textAlign: "center", background: "var(--card-bg, #ffffff)", borderRadius: "12px", border: "1px dashed var(--border-color, #cbd5e1)" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>
                      {enquirySubTab === "hidden" ? "👁️" : enquirySubTab === "converted" ? "✅" : "📭"}
                    </div>
                    <h3 style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>
                      {enquirySubTab === "hidden"
                        ? "No Hidden Leads"
                        : enquirySubTab === "converted"
                        ? "No Converted Leads Yet"
                        : enquirySearchQuery
                        ? "No matching leads found"
                        : "No active website consultation requests"}
                    </h3>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px" }}>
                      {enquirySubTab === "hidden"
                        ? "Any leads you hide will appear here for reference or restoration."
                        : "Website consultation bookings will appear here in real-time."}
                    </p>
                  </div>
                );
              }

              return (
                <div className="leads-cards-container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "18px" }}>
                  {filteredLeads.map(e => {
                    const isHidden = e.status === "Hidden" || e.status === "Hidden / Spam";
                    const isConverted = e.status === "Converted";
                    const isLinked = String(e.status || "").startsWith("Linked:");
                    const cleanPhone = String(e.phone || "").replace(/\D/g, "").slice(-10);
                    const patientName = (
                      e.name ||
                      e.patientName ||
                      e.fullName ||
                      patients.find(p => String(p.phone || "").replace(/\D/g, "").slice(-10) === cleanPhone)?.name ||
                      "Patient (Online Lead)"
                    ).trim();

                    return (
                      <div
                        key={e.id}
                        className="lead-card-premium"
                        style={{
                          background: "var(--card-bg, #ffffff)",
                          border: isHidden ? "1.5px solid #f59e0b" : isConverted ? "1.5px solid #10b981" : "1.5px solid var(--border-color, #e2e8f0)",
                          borderRadius: "14px",
                          padding: "18px",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {/* Top Meta Bar */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>
                            <span>📅 {cleanDateOnly(e.date)}</span>
                            {e.time && <span>• ⏰ {cleanTimeOnly(e.time) || e.time}</span>}
                          </div>

                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "800",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              background: isHidden ? "#fef3c7" : isConverted ? "#dcfce7" : isLinked ? "#f3e8ff" : "#e0f2fe",
                              color: isHidden ? "#b45309" : isConverted ? "#15803d" : isLinked ? "#7e22ce" : "#0369a1"
                            }}
                          >
                            {isHidden ? "👁️ Hidden" : isConverted ? "✅ Converted Patient" : isLinked ? e.status : "⚡ New Lead"}
                          </span>
                        </div>

                        {/* Patient Name, Age & Contact Header */}
                        <div style={{ borderBottom: "1px solid var(--border-color, #f1f5f9)", paddingBottom: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                            <div>
                              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "var(--text-primary)" }}>
                                👤 {patientName}
                              </h3>
                              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px", fontWeight: "600" }}>
                                🎂 Age: {e.age ? <strong>{e.age} Yrs</strong> : <em>Not specified</em>}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "6px" }}>
                              <a
                                href={`tel:${cleanPhone}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  background: "rgba(8, 120, 201, 0.1)",
                                  color: "#0878C9",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  textDecoration: "none"
                                }}
                              >
                                📞 Call
                              </a>
                              <a
                                href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${patientName}, thank you for contacting Vindhy Physio & Rehab Center. Dr. Satyam Vishwakarma is reviewing your consultation booking for ${e.painArea || "Physiotherapy"}.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  background: "#25D366",
                                  color: "#ffffff",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  textDecoration: "none"
                                }}
                              >
                                💬 WhatsApp
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Clinical Details */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>Pain / Condition:</span>
                            <span style={{ fontWeight: "700", color: "#0878C9", background: "rgba(8, 120, 201, 0.08)", padding: "2px 8px", borderRadius: "6px" }}>
                              🩺 {e.painArea || "General Physiotherapy"}
                            </span>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>Preferred Date:</span>
                            <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                              📅 {cleanDateOnly(e.appointmentDate) || "Flexible"}
                            </span>
                          </div>

                          {e.duration && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>Duration:</span>
                              <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                                ⏱️ {e.duration}
                              </span>
                            </div>
                          )}

                          {e.concern && (
                            <div style={{ background: "var(--bg-subtle, #f8fafc)", padding: "8px 10px", borderRadius: "8px", fontSize: "12.5px", color: "var(--text-secondary)", fontStyle: "italic", borderLeft: "3px solid #0878C9", marginTop: "4px" }}>
                              "{e.concern}"
                            </div>
                          )}
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid var(--border-color, #f1f5f9)" }}>
                          {!isConverted && (
                            <button
                              type="button"
                              onClick={() => openQuickConvertModal(e)}
                              style={{
                                flex: "1 1 auto",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#0878C9",
                                color: "#ffffff",
                                fontWeight: "700",
                                fontSize: "12.5px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px"
                              }}
                            >
                              ⚡ Direct Add Patient
                            </button>
                          )}

                          {!isConverted && !isLinked && (
                            <button
                              type="button"
                              onClick={() => {
                                if (patients.length === 0) fetchPatients();
                                setLinkingEnquiry(e);
                                setLinkSearchQuery("");
                              }}
                              style={{
                                padding: "8px 10px",
                                borderRadius: "8px",
                                border: "1px solid #c084fc",
                                background: "rgba(192, 132, 252, 0.1)",
                                color: "#9333ea",
                                fontWeight: "700",
                                fontSize: "12px",
                                cursor: "pointer"
                              }}
                              title="Link to an existing registered patient record"
                            >
                              🔗 Link
                            </button>
                          )}

                          {/* Hide / Unhide Button */}
                          <button
                            type="button"
                            onClick={() => isHidden ? handleUnhideEnquiry(e) : handleHideEnquiry(e)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: "8px",
                              border: isHidden ? "1px solid #10b981" : "1px solid #f59e0b",
                              background: isHidden ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                              color: isHidden ? "#10b981" : "#d97706",
                              fontWeight: "700",
                              fontSize: "12px",
                              cursor: "pointer"
                            }}
                            title={isHidden ? "Restore to Active Leads" : "Hide this lead into separate Hidden section"}
                          >
                            {isHidden ? "↩️ Unhide" : "👁️ Hide"}
                          </button>

                          {/* Permanent Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteEnquiry(e)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: "8px",
                              border: "1px solid #ef4444",
                              background: "rgba(239, 68, 68, 0.1)",
                              color: "#ef4444",
                              fontWeight: "700",
                              fontSize: "12px",
                              cursor: "pointer"
                            }}
                            title="Permanently delete lead so it never shows again"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Direct Quick Add / Convert Lead to Patient Modal */}
            {convertingLead && (
              <div className="patient-submodal-overlay" onClick={() => setConvertingLead(null)}>
                <div className="patient-submodal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px", width: "95%" }}>
                  <div className="submodal-head">
                    <h3>⚡ Direct Convert Lead to Registered Patient</h3>
                    <button className="submodal-close" onClick={() => setConvertingLead(null)}>✕</button>
                  </div>
                  <p className="submodal-desc">
                    Instantly enroll <strong>{convertingLeadForm.name}</strong> as an official clinic patient, create their consultation file, and activate their patient portal.
                  </p>

                  <form onSubmit={handleDirectEnrollSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", fontWeight: "700" }}>
                        Patient Full Name *
                        <input
                          type="text"
                          required
                          value={convertingLeadForm.name}
                          onChange={(e) => setConvertingLeadForm({ ...convertingLeadForm, name: e.target.value })}
                          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", fontWeight: "700" }}>
                        Patient Age (Years) *
                        <input
                          type="number"
                          required
                          min="1"
                          max="120"
                          placeholder="e.g. 35"
                          value={convertingLeadForm.age}
                          onChange={(e) => setConvertingLeadForm({ ...convertingLeadForm, age: e.target.value })}
                          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                          autoFocus={!convertingLeadForm.age}
                        />
                      </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", fontWeight: "700" }}>
                        Mobile Number *
                        <input
                          type="tel"
                          required
                          maxLength="10"
                          value={convertingLeadForm.phone}
                          onChange={(e) => setConvertingLeadForm({ ...convertingLeadForm, phone: e.target.value })}
                          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", fontWeight: "700" }}>
                        Gender *
                        <select
                          value={convertingLeadForm.gender}
                          onChange={(e) => setConvertingLeadForm({ ...convertingLeadForm, gender: e.target.value })}
                          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", fontWeight: "700" }}>
                      Address / City
                      <input
                        type="text"
                        value={convertingLeadForm.address}
                        onChange={(e) => setConvertingLeadForm({ ...convertingLeadForm, address: e.target.value })}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", fontWeight: "700" }}>
                      Clinical Condition / Reason *
                      <input
                        type="text"
                        required
                        value={convertingLeadForm.reasonForVisit}
                        onChange={(e) => setConvertingLeadForm({ ...convertingLeadForm, reasonForVisit: e.target.value })}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", fontWeight: "700" }}>
                        Consultation Fee
                        <input
                          type="text"
                          value={convertingLeadForm.fee}
                          onChange={(e) => setConvertingLeadForm({ ...convertingLeadForm, fee: e.target.value })}
                          placeholder="₹300"
                          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", fontWeight: "700" }}>
                        Initial Diagnosis
                        <input
                          type="text"
                          value={convertingLeadForm.diagnosis}
                          onChange={(e) => setConvertingLeadForm({ ...convertingLeadForm, diagnosis: e.target.value })}
                          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setConvertingLead(null)}
                        style={{ flex: "1" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="primary-btn"
                        disabled={convertLoading}
                        style={{ flex: "2", background: "#0878C9" }}
                      >
                        {convertLoading ? "Enrolling Patient..." : "⚡ Complete Direct Enrollment →"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Link Enquiry to Patient Modal */}
            {linkingEnquiry && (
              <div className="patient-submodal-overlay doctor-link-overlay" onClick={() => setLinkingEnquiry(null)}>
                <div className="patient-submodal-card doctor-link-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px", width: "94%" }}>
                  <div className="submodal-head">
                    <h3>Link Enquiry to Existing Patient</h3>
                    <button className="submodal-close" onClick={() => setLinkingEnquiry(null)}>✕</button>
                  </div>
                  <p className="submodal-desc" style={{ marginTop: "4px", fontSize: "13px", color: "#64748b" }}>
                    Link enquiry from <strong>{linkingEnquiry.name}</strong> (+91 {linkingEnquiry.phone}) to an existing patient file to prevent duplicate patient IDs.
                  </p>

                  <div style={{ margin: "14px 0 10px 0" }}>
                    <input
                      type="text"
                      placeholder="Search patient by Name, ID, or Phone..."
                      value={linkSearchQuery}
                      onChange={(e) => setLinkSearchQuery(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                      autoFocus
                    />
                  </div>

                  <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                    {patients
                      .filter(p => {
                        const q = (linkSearchQuery || "").trim().toLowerCase();
                        if (!q) return true;
                        const matchName = (p.name || "").toLowerCase().includes(q);
                        const matchId = (p.patientId || "").toLowerCase().includes(q);
                        const matchPhone = (p.phone ? String(p.phone) : "").includes(q);
                        return matchName || matchId || matchPhone;
                      })
                      .slice(0, 15)
                      .map(p => (
                        <div
                          key={p.patientId}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            gap: "10px"
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <strong style={{ color: "#0f172a", fontSize: "14px" }}>{p.name}</strong>
                              <span className="patient-id-badge" style={{ fontSize: "11px", fontWeight: "700" }}>{p.patientId}</span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                              +91 {p.phone} • {p.age || "—"} Yrs • {p.gender || "Patient"}
                            </div>
                          </div>
                          <button
                            className="primary-btn"
                            style={{ fontSize: "12px", padding: "7px 14px", borderRadius: "8px", whiteSpace: "nowrap", flexShrink: 0 }}
                            onClick={() => handleLinkEnquiryToPatient(linkingEnquiry, p)}
                          >
                            🔗 Link Here
                          </button>
                        </div>
                      ))}

                    {patients.length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "13.5px" }}>
                        No existing patients found in registry yet.
                      </div>
                    )}

                    {patients.length > 0 && patients.filter(p => {
                      const q = (linkSearchQuery || "").trim().toLowerCase();
                      if (!q) return true;
                      return (p.name || "").toLowerCase().includes(q) || (p.patientId || "").toLowerCase().includes(q) || (p.phone && String(p.phone).includes(q));
                    }).length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "13.5px" }}>
                        No patients matching "<strong>{linkSearchQuery}</strong>".
                      </div>
                    )}
                  </div>

                  <div className="submodal-actions" style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                    <button className="secondary-btn" onClick={() => setLinkingEnquiry(null)} style={{ padding: "8px 18px" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 6. SETTINGS & SYNC ================= */}
        {activeTab === "settings" && (
          <div className="settings-view">
            <h2>Settings & Cloud Synchronization</h2>
            <p>Manage doctor security credentials, real-time Google Sheets sync, and database backups.</p>

            <div className="settings-grid">
              <div className="settings-card">
                <h3>Change Doctor Password</h3>
                {passwordMsg.text && (
                  <div className={`status-box ${passwordMsg.isError ? "error" : "success"}`}>
                    {passwordMsg.text}
                  </div>
                )}
                <form onSubmit={handleChangePassword}>
                  <label>
                    Current Password
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                  </label>
                  <label>
                    New Password (min 6 characters)
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </label>
                  <label>
                    Confirm New Password
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </label>
                  <button type="submit" className="primary-btn">Update Doctor Password</button>
                </form>
              </div>

              <div className="settings-card">
                <h3>Google Sheets Cloud Database</h3>
                <p>Authorized Doctor Account: <strong>{doctorInfo?.email || "shivamupsc8@gmail.com"}</strong></p>
                <div className="sync-status-indicator">
                  <div className="status-row">
                    <span>Connection Status:</span>
                    <strong className={stats.syncStatus === "Connected" ? "text-green" : "text-orange"}>
                      {stats.syncStatus}
                    </strong>
                  </div>
                  <div className="status-row">
                    <span>Pending Sync Records:</span>
                    <span>{stats.pendingSyncCount || 0} records</span>
                  </div>
                </div>

                <form onSubmit={handleSaveCustomWebhook} style={{ marginTop: "15px" }}>
                  <label>
                    Google Sheets Webhook URL
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      value={customWebhookInput}
                      onChange={(e) => setCustomWebhookInput(e.target.value)}
                      style={{ fontSize: "12px" }}
                    />
                  </label>
                  {webhookSavedMsg && (
                    <div style={{ color: "#10b981", fontSize: "12px", marginBottom: "8px", fontWeight: "600" }}>
                      {webhookSavedMsg}
                    </div>
                  )}
                  <button type="submit" className="secondary-btn full-btn" style={{ marginBottom: "10px" }}>
                    💾 Save Webhook URL
                  </button>
                </form>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                  <button
                    className="primary-btn full-btn"
                    style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", minHeight: "46px", fontSize: "14px", fontWeight: "800", boxShadow: "0 4px 12px rgba(5, 150, 105, 0.35)" }}
                    onClick={handleCleanAndRestoreFromSheets}
                    disabled={restoreLoading}
                    title="Pull all live records directly from your Google Sheets database into the website"
                  >
                    {restoreLoading ? "⏳ Pulling All Data from Sheet..." : "🔄 Sync & Pull All Live Records from Google Sheets"}
                  </button>
                  <button
                    className="secondary-btn full-btn"
                    onClick={handleManualSync}
                    disabled={syncLoading}
                    title="Manually push current local records to your Google Sheet"
                  >
                    {syncLoading ? "⏳ Sending to Google Sheets..." : "📤 Push Local Records to Google Sheets"}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn full-btn"
                    style={{ background: "rgba(234, 179, 8, 0.08)", color: "#ca8a04", borderColor: "rgba(234, 179, 8, 0.3)" }}
                    onClick={async () => {
                      const defaultUrl = DEFAULT_WEBHOOK_URL;
                      setCustomWebhookInput(defaultUrl);
                      setWebhookUrl(defaultUrl);
                      setWebhookSavedMsg("⏳ Restoring clinic records from official Google Sheets database...");
                      setRestoreLoading(true);
                      try {
                        const res = await restoreFromGoogleSheets();
                        setWebhookSavedMsg(`✅ Connected! Synced with official Sheets database.`);
                        fetchStats();
                        fetchPatients();
                        fetchTodayVisits();
                      } catch (err) {
                        setWebhookSavedMsg("✅ Official Webhook Configured.");
                      } finally {
                        setRestoreLoading(false);
                        setTimeout(() => setWebhookSavedMsg(""), 5000);
                      }
                    }}
                  >
                    ⚡ Reset to Official Google Sheets Webhook
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <h3>Export Clinic Database (CSV / Excel)</h3>
                <p>Download comprehensive records of all registered patients, visit history, and website enquiries.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "15px" }}>
                  <button className="secondary-btn" onClick={() => handleExportCSV("patients")}>
                    📥 Patients (CSV)
                  </button>
                  <button className="secondary-btn" onClick={() => handleExportCSV("visits")}>
                    📥 Visits (CSV)
                  </button>
                  <button className="secondary-btn" onClick={() => handleExportCSV("enquiries")}>
                    📥 Enquiries (CSV)
                  </button>
                </div>
              </div>

              {/* Clinic Map Location & Pin Assignment Card */}
              <div className="settings-card" style={{ gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0 }}>📍 Clinic Map Location & Geo-Pin</h3>
                  <span style={{ fontSize: "12px", color: "var(--emerald)", fontWeight: "600" }}>
                    Public Website Map Synced
                  </span>
                </div>
                <p>
                  As an admin/doctor, enter your clinic place name, address, or manual coordinates (Latitude & Longitude) below. The map will place an exact marker and automatically update the map on the public website.
                </p>

                {locationSavedMsg && (
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid #10b981",
                    color: "#34d399",
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "14px"
                  }}>
                    {locationSavedMsg}
                  </div>
                )}

                <form onSubmit={handleSaveClinicLocation}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                    <label>
                      Clinic Address / Place Name
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        <input
                          type="text"
                          placeholder="e.g. Amravati Chauraha, Vindhyachal, Mirzapur (U.P.)"
                          value={locationAddressInput}
                          onChange={(e) => setLocationAddressInput(e.target.value)}
                          required
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={handleSearchPlaceLocation}
                          disabled={locationSearchLoading}
                          style={{ whiteSpace: "nowrap", padding: "0 14px", minHeight: "42px" }}
                          title="Search and auto-detect latitude and longitude"
                        >
                          {locationSearchLoading ? "Searching..." : "🔍 Locate"}
                        </button>
                      </div>
                    </label>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <label style={{ flex: 1 }}>
                        Latitude (Manual)
                        <input
                          type="number"
                          step="any"
                          value={locationLatInput}
                          onChange={(e) => setLocationLatInput(e.target.value)}
                          required
                          style={{ marginTop: "4px" }}
                        />
                      </label>
                      <label style={{ flex: 1 }}>
                        Longitude (Manual)
                        <input
                          type="number"
                          step="any"
                          value={locationLngInput}
                          onChange={(e) => setLocationLngInput(e.target.value)}
                          required
                          style={{ marginTop: "4px" }}
                        />
                      </label>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
                    <button type="submit" className="primary-btn" style={{ padding: "10px 22px", fontWeight: "700" }}>
                      💾 Save & Update Clinic Location Pin
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              const lat = parseFloat(pos.coords.latitude.toFixed(6));
                              const lng = parseFloat(pos.coords.longitude.toFixed(6));
                              setLocationLatInput(lat);
                              setLocationLngInput(lng);
                              setLocationSavedMsg(`📍 Detected GPS: ${lat}, ${lng}. Click "Save & Update Clinic Location Pin" to apply.`);
                              setTimeout(() => setLocationSavedMsg(""), 5000);
                            },
                            (err) => alert("Could not fetch device GPS: " + err.message)
                          );
                        } else {
                          alert("Geolocation not supported on this browser.");
                        }
                      }}
                      style={{ padding: "10px 16px" }}
                      title="Fetch coordinates from phone or laptop GPS"
                    >
                      🎯 Use My Current GPS
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        setLocationAddressInput(DEFAULT_CLINIC_LOCATION.address);
                        setLocationLatInput(DEFAULT_CLINIC_LOCATION.lat);
                        setLocationLngInput(DEFAULT_CLINIC_LOCATION.lng);
                      }}
                      style={{ padding: "10px 16px" }}
                    >
                      ↺ Reset Default
                    </button>
                  </div>
                </form>

                {/* Live Interactive Map Preview */}
                <div style={{ marginTop: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "var(--text)" }}>
                      Live Clinic Marker Preview: {clinicLocation.address} ({clinicLocation.lat}, {clinicLocation.lng})
                    </strong>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${clinicLocation.lat},${clinicLocation.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-link-btn"
                      style={{ fontSize: "12px", textDecoration: "underline" }}
                    >
                      ↗ View on Google Maps
                    </a>
                  </div>
                  <iframe
                    title="Clinic Location Map Preview"
                    style={{
                      width: "100%",
                      height: "230px",
                      borderRadius: "10px",
                      border: "1.5px solid var(--line)",
                      display: "block"
                    }}
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(clinicLocation.lng) - 0.02}%2C${parseFloat(clinicLocation.lat) - 0.02}%2C${parseFloat(clinicLocation.lng) + 0.02}%2C${parseFloat(clinicLocation.lat) + 0.02}&layer=mapnik&marker=${clinicLocation.lat}%2C${clinicLocation.lng}`}
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= PATIENT PROFILE MODAL (BOXY CLINICAL DESIGN WITH AVATAR) ================= */}
      {selectedPatient && (
        <div className="patient-profile-modal-overlay">
          <div className="patient-profile-card boxy-profile-card" style={{ maxWidth: "820px", width: "95%", maxHeight: "92vh", overflowY: "auto", borderRadius: "16px" }}>
            
            {/* 1. MASTER TOP HEADER BOX (Vector Avatar + Info + 1-Tap Daily Session Action) */}
            <div className="profile-master-header-box" style={{
              position: "relative",
              background: "linear-gradient(135deg, #071927, #0B2A3D)",
              borderRadius: "14px",
              padding: "18px 20px",
              color: "#ffffff",
              marginBottom: "16px",
              boxShadow: "0 6px 20px rgba(7, 25, 39, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
              {/* Top-Right Absolute Close button */}
              <button
                type="button"
                className="profile-modal-close-btn"
                onClick={() => setSelectedPatient(null)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  zIndex: 10,
                  background: "rgba(255, 255, 255, 0.18)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  transition: "all 0.2s ease"
                }}
                title="Close Patient Profile"
              >
                ✕
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingRight: "44px" }}>
                {/* Left: Vector Avatar & Patient Key Demographics */}
                <PatientAvatar patient={selectedPatient} size={70} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <span className="patient-id-badge large" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid #059669", fontWeight: "800", fontSize: "12.5px" }}>
                      {selectedPatient.patientId}
                    </span>
                    <span style={{ fontSize: "12px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "2px 8px", borderRadius: "6px", fontWeight: "700" }}>
                      {selectedPatient.status || "Active"}
                    </span>
                  </div>
                  
                  <h2 style={{ margin: "2px 0 4px 0", fontSize: "22px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.3px", wordBreak: "break-word" }}>
                    {selectedPatient.name}
                  </h2>
                  
                  <div style={{ fontSize: "13px", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>{selectedPatient.age} Yrs • {selectedPatient.gender}</span>
                    <span>•</span>
                    <a
                      href={`tel:+91${selectedPatient.phone}`}
                      style={{ color: "#38bdf8", textDecoration: "none", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      📞 +91 {selectedPatient.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Toolbar on Master Header */}
              <div style={{
                display: "flex",
                gap: "8px",
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                flexWrap: "wrap"
              }}>
                <button
                  type="button"
                  className="primary-btn"
                  style={{
                    flex: "2 1 180px",
                    minHeight: "44px",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    borderColor: "#059669",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "800",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                  onClick={() => openQuickDailyVisitModal(selectedPatient)}
                  title="Auto-fill and record today's daily physiotherapy visit with AI clinical progression"
                >
                  <span>⚡ +1 Daily Physio Session</span>
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  style={{ flex: "1 1 110px", minHeight: "44px", background: "rgba(2, 132, 199, 0.25)", color: "#38bdf8", borderColor: "#0284c7", fontWeight: "700" }}
                  onClick={() => setShowAddVisitModal(true)}
                >
                  ➕ Custom Visit
                </button>

                <a
                  href={`https://wa.me/91${String(selectedPatient.phone || "").replace(/\D/g, "").slice(-10)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="secondary-btn"
                  style={{ flex: "1 1 100px", minHeight: "44px", background: "rgba(37, 211, 102, 0.2)", color: "#4ade80", borderColor: "#22c55e", fontWeight: "700", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", textDecoration: "none" }}
                >
                  💬 Chat
                </a>

                <button
                  type="button"
                  className="secondary-btn"
                  style={{ minHeight: "44px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", borderColor: "#ef4444", fontWeight: "700", padding: "0 12px" }}
                  onClick={() => handleDeletePatient(selectedPatient.patientId, selectedPatient.name)}
                  title="Permanently Delete Patient Record"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="profile-body">
              {/* 2. BOXY TILES GRID (Matching Doctor Dashboard Box Aesthetic) */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "12px",
                marginBottom: "16px"
              }}>
                
                {/* Box A: Clinical Diagnosis & Condition */}
                <div style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "#0284c7", display: "flex", alignItems: "center", gap: "6px" }}>
                      🩺 Chief Problem & Condition
                    </strong>
                    <span style={{ fontSize: "11px", fontWeight: "800", background: "#ecfdf5", color: "#059669", padding: "2px 8px", borderRadius: "6px" }}>
                      {selectedPatient.totalVisits || (patientVisits.length > 0 ? patientVisits.length : 1)} Total Visits
                    </span>
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
                    {selectedPatient.firstVisitReason || "Physiotherapy Rehabilitation"}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                    <strong>Onset/Duration:</strong> {selectedPatient.duration || "Initial onset"}
                  </div>
                  {selectedPatient.complaint && (
                    <div style={{ fontSize: "12px", color: "#475569", marginTop: "6px", background: "#f8fafc", padding: "6px 8px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                      <em>"{selectedPatient.complaint}"</em>
                    </div>
                  )}
                </div>

                {/* Box B: Patient Contact & Demographics */}
                <div style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                  <strong style={{ fontSize: "13px", color: "#0284c7", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    📍 Contact & Demographics
                  </strong>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12.5px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Address</span>
                      <strong style={{ color: "#0f172a" }}>{selectedPatient.address || "Vindhyachal, Mirzapur"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Registered Date</span>
                      <strong style={{ color: "#0f172a" }}>{cleanDateOnly(selectedPatient.registrationDate)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Alt Phone</span>
                      <strong style={{ color: "#0f172a" }}>{selectedPatient.altPhone ? `+91 ${selectedPatient.altPhone}` : "None"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Emergency Contact</span>
                      <strong style={{ color: "#0f172a" }}>{selectedPatient.emergencyContact || "None"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. PRESCRIPTION & OFFICIAL RECEIPT HUB BOX */}
              <div style={{
                background: "linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(2, 132, 199, 0.08))",
                border: "1.5px solid rgba(37, 211, 102, 0.35)",
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                  <strong style={{ color: "#15803d", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "800" }}>
                    📄 Patient Official Receipt & Prescription Slip
                  </strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Patient: +91 {selectedPatient.phone}
                  </span>
                </div>
                
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    className="whatsapp-share-btn"
                    style={{ flex: "1 1 180px", minHeight: "42px", fontSize: "13px", padding: "10px 14px", borderRadius: "8px", fontWeight: "800" }}
                    onClick={() => {
                      const latestVisit = patientVisits[0] || {
                        visitId: `VST-${selectedPatient.patientId}-1`,
                        patientId: selectedPatient.patientId,
                        patientName: selectedPatient.name,
                        phone: selectedPatient.phone,
                        visitNumber: 1,
                        date: selectedPatient.registrationDate ? String(selectedPatient.registrationDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
                        time: "10:00 AM",
                        reason: selectedPatient.firstVisitReason || "Initial Consultation & Assessment",
                        complaint: selectedPatient.firstVisitReason || "Initial Consultation",
                        diagnosis: selectedPatient.firstVisitReason || "Under Evaluation",
                        treatmentNotes: "Comprehensive physical evaluation & physiotherapy management.",
                        followUpDate: "As advised by doctor",
                        status: "Completed",
                        doctor: "Dr. Satyam Vishwakarma"
                      };
                      handleWhatsAppDirectShare({ patient: selectedPatient, visit: latestVisit });
                    }}
                  >
                    💬 Send PDF on WhatsApp
                  </button>
                  <button
                    className="primary-btn"
                    style={{ flex: "1 1 130px", minHeight: "42px", fontSize: "13px", padding: "10px 14px", borderRadius: "8px", fontWeight: "700" }}
                    onClick={() => {
                      const latestVisit = patientVisits[0] || {
                        visitId: `VST-${selectedPatient.patientId}-1`,
                        patientId: selectedPatient.patientId,
                        patientName: selectedPatient.name,
                        phone: selectedPatient.phone,
                        visitNumber: 1,
                        date: selectedPatient.registrationDate ? String(selectedPatient.registrationDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
                        time: "10:00 AM",
                        reason: selectedPatient.firstVisitReason || "Initial Consultation & Assessment",
                        complaint: selectedPatient.firstVisitReason || "Initial Consultation",
                        diagnosis: selectedPatient.firstVisitReason || "Under Evaluation",
                        treatmentNotes: "Comprehensive physical evaluation & physiotherapy management.",
                        followUpDate: "As advised by doctor",
                        status: "Completed",
                        doctor: "Dr. Satyam Vishwakarma"
                      };
                      handleDownloadPDF({ patient: selectedPatient, visit: latestVisit });
                    }}
                  >
                    📥 Download PDF
                  </button>
                  <button
                    className="secondary-btn"
                    style={{ flex: "1 1 100px", minHeight: "42px", fontSize: "13px", padding: "10px 14px", borderRadius: "8px", fontWeight: "700" }}
                    onClick={() => {
                      const latestVisit = patientVisits[0] || {
                        visitId: `VST-${selectedPatient.patientId}-1`,
                        patientId: selectedPatient.patientId,
                        patientName: selectedPatient.name,
                        phone: selectedPatient.phone,
                        visitNumber: 1,
                        date: selectedPatient.registrationDate ? String(selectedPatient.registrationDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
                        time: "10:00 AM",
                        reason: selectedPatient.firstVisitReason || "Initial Consultation & Assessment",
                        complaint: selectedPatient.firstVisitReason || "Initial Consultation",
                        diagnosis: selectedPatient.firstVisitReason || "Under Evaluation",
                        treatmentNotes: "Comprehensive physical evaluation & physiotherapy management.",
                        followUpDate: "As advised by doctor",
                        status: "Completed",
                        doctor: "Dr. Satyam Vishwakarma"
                      };
                      handleFinalizeAndIssueReceipt(selectedPatient, latestVisit);
                    }}
                  >
                    👁️ View Slip
                  </button>
                </div>
              </div>

              {/* 5. CHRONOLOGICAL VISITS TIMELINE */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <h3 className="section-subtitle" style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                  📜 Chronological Consultation & Visit Records ({patientVisits.length})
                </h3>
                <button
                  type="button"
                  onClick={() => openQuickDailyVisitModal(selectedPatient)}
                  style={{
                    background: "#ecfdf5",
                    color: "#059669",
                    border: "1px solid #86efac",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: "pointer"
                  }}
                >
                  ⚡ +1 Add Today's Visit
                </button>
              </div>

              <div className="visit-timeline">
                {patientVisits.map(v => {
                  const isExpanded = !!expandedVisitIds[v.visitId];
                  return (
                    <div
                      className="timeline-visit-card"
                      key={v.visitId}
                      style={{
                        background: "#ffffff",
                        border: isExpanded ? "1.5px solid #0284c7" : "1.5px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        marginBottom: "10px",
                        boxShadow: isExpanded ? "0 4px 12px rgba(2, 132, 199, 0.08)" : "0 1px 3px rgba(0,0,0,0.02)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {/* Row 1: Visit Badge, Clean Date & Time, Fee */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span className="visit-num-badge" style={{ background: "#0284c7", color: "#ffffff", fontWeight: "800", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
                            Visit #{v.visitNumber}
                          </span>
                          <span className="visit-date" style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px" }}>
                            📅 {cleanDateOnly(v.date)} {cleanTimeOnly(v.time) ? `(${cleanTimeOnly(v.time)})` : ""}
                          </span>
                        </div>
                        {v.fee && (
                          <span style={{ fontWeight: "800", color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: "6px", fontSize: "12px" }}>
                            {String(v.fee).startsWith("₹") ? v.fee : `₹${v.fee}`}
                          </span>
                        )}
                      </div>

                      {/* Row 2: Slip & WhatsApp PDF + Download in the SAME ROW side by side */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px", width: "100%" }}>
                        <button
                          className="receipt-btn finalize-action-btn"
                          style={{ minHeight: "38px", padding: "8px 10px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}
                          onClick={() => handleFinalizeAndIssueReceipt(selectedPatient, v)}
                        >
                          📄 Slip & WhatsApp PDF
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={() => handleDownloadPDF({ patient: selectedPatient, visit: v })}
                          style={{ minHeight: "38px", padding: "8px 10px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}
                          title="Instant Download PDF"
                        >
                          📥 Download
                        </button>
                      </div>

                      {/* Row 3: Details Arrow Toggle BELOW the action buttons */}
                      <div
                        onClick={() => toggleVisitExpand(v.visitId)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "8px",
                          paddingTop: "6px",
                          borderTop: "1px dashed #e2e8f0",
                          cursor: "pointer"
                        }}
                      >
                        <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                          {v.reason ? v.reason : "Clinical Notes & Treatment Details"}
                        </span>
                        <span style={{ fontSize: "12px", color: isExpanded ? "#0284c7" : "#0284c7", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          {isExpanded ? "▲ Details" : "▼ Details"}
                        </span>
                      </div>

                      {/* Expandable Details Box */}
                      {isExpanded && (
                        <div
                          className="timeline-visit-details"
                          style={{
                            marginTop: "8px",
                            paddingTop: "8px",
                            borderTop: "1px dashed #cbd5e1",
                            fontSize: "13px",
                            color: "#334155",
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px"
                          }}
                        >
                          <p style={{ margin: 0 }}><strong>Reason:</strong> {v.reason}</p>
                          {v.complaint && <p style={{ margin: 0 }}><strong>Complaint:</strong> {v.complaint}</p>}
                          {v.diagnosis && <p style={{ margin: 0 }}><strong>Diagnosis:</strong> {v.diagnosis}</p>}
                          {v.treatmentNotes && <p style={{ margin: 0, color: "#0369a1" }}><strong>Therapy Notes:</strong> {v.treatmentNotes}</p>}
                          {v.followUpDate && <p style={{ margin: 0, color: "#059669" }}><strong>Next Follow-Up:</strong> {cleanDateOnly(v.followUpDate)}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}

                {patientVisits.length === 0 && (
                  <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "10px", padding: "18px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 10px 0", color: "#64748b", fontSize: "13px" }}>
                      Initial Registration Consultation Record
                    </p>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                      <button
                        className="receipt-btn finalize-action-btn"
                        onClick={() => {
                          const fallbackVisit = {
                            visitId: `VST-${selectedPatient.patientId}-1`,
                            patientId: selectedPatient.patientId,
                            patientName: selectedPatient.name,
                            phone: selectedPatient.phone,
                            visitNumber: 1,
                            date: selectedPatient.registrationDate ? String(selectedPatient.registrationDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
                            time: "10:00 AM",
                            reason: selectedPatient.firstVisitReason || "Initial Consultation & Assessment",
                            complaint: selectedPatient.firstVisitReason || "Initial Consultation",
                            diagnosis: selectedPatient.firstVisitReason || "Under Evaluation",
                            treatmentNotes: "Comprehensive physical evaluation & physiotherapy management.",
                            followUpDate: "As advised by doctor",
                            status: "Completed",
                            doctor: "Dr. Satyam Vishwakarma"
                          };
                          handleFinalizeAndIssueReceipt(selectedPatient, fallbackVisit);
                        }}
                      >
                        📄 Generate Slip & Send WhatsApp PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD VISIT MODAL & 1-TAP REPEAT VISIT ================= */}
      {showAddVisitModal && selectedPatient && (() => {
        const nextVisitNum = (selectedPatient.totalVisits || (patientVisits ? patientVisits.length : 0) || 0) + 1;
        const currentProblem = selectedPatient.lastDiagnosis || selectedPatient.firstVisitReason || selectedPatient.reasonForVisit || "Physiotherapy Rehabilitation";

        return (
          <div className="add-visit-modal-overlay">
            <div className="add-visit-card" style={{ maxWidth: "660px", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <span className="status-pill success" style={{ marginBottom: "6px", display: "inline-block", background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", fontWeight: "800" }}>
                    ⚡ Daily Physiotherapy Session Entry
                  </span>
                  <h3 style={{ margin: "2px 0 4px 0", color: "var(--heading, #0f172a)", fontSize: "19px", fontWeight: "800" }}>
                    Record Follow-Up Visit for {selectedPatient.name}
                  </h3>
                  <p style={{ margin: 0, color: "var(--text-muted, #64748b)", fontSize: "13px" }}>
                    Patient ID: <strong style={{ color: "#0284c7" }}>{selectedPatient.patientId}</strong> | Allocating: <strong style={{ color: "#16a34a" }}>Visit #{nextVisitNum} (Day {nextVisitNum})</strong>
                  </p>
                </div>
                <button className="secondary-btn close-btn" onClick={() => setShowAddVisitModal(false)}>✕</button>
              </div>

              {/* 1-Tap Pre-Filled Protocol Banner */}
              <div style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(2, 132, 199, 0.12))",
                border: "1.5px solid rgba(16, 185, 129, 0.35)",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                flexWrap: "wrap"
              }}>
                <div>
                  <div style={{ fontWeight: "800", color: "#065f46", fontSize: "13.5px" }}>
                    ✨ Auto-Prefilled with Day {nextVisitNum} Clinical Protocol
                  </div>
                  <div style={{ fontSize: "12px", color: "#047857" }}>
                    Condition: <strong>{currentProblem}</strong> • Fee: <strong>₹{newVisitForm.fee || "500"}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const freshProtocol = generateDailyPhysioProtocol(currentProblem, nextVisitNum);
                    setNewVisitForm(prev => ({
                      ...prev,
                      reasonForVisit: freshProtocol.focus,
                      diagnosis: selectedPatient.lastDiagnosis || freshProtocol.diagnosis,
                      treatmentNotes: freshProtocol.treatment
                    }));
                  }}
                  style={{
                    background: "#059669",
                    color: "#ffffff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  title="Generate Day-Specific Exercise Progression"
                >
                  🔄 AI Regenerate Notes
                </button>
              </div>

              <form onSubmit={handleAddVisit}>
                {/* Date & Date Quick Presets */}
                <div className="form-row-1" style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                    <label style={{ margin: 0, fontWeight: "700", color: "var(--heading, #0f172a)", fontSize: "13px" }}>
                      Visit Date *
                    </label>
                    <div style={{ display: "inline-flex", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => setNewVisitForm({ ...newVisitForm, visitDate: new Date().toISOString().slice(0, 10) })}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "700",
                          borderRadius: "6px",
                          border: "1px solid #0284c7",
                          background: newVisitForm.visitDate === new Date().toISOString().slice(0, 10) ? "#0284c7" : "#e0f2fe",
                          color: newVisitForm.visitDate === new Date().toISOString().slice(0, 10) ? "#fff" : "#0284c7",
                          cursor: "pointer"
                        }}
                      >
                        📅 Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const yest = new Date();
                          yest.setDate(yest.getDate() - 1);
                          setNewVisitForm({ ...newVisitForm, visitDate: yest.toISOString().slice(0, 10) });
                        }}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "700",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#f8fafc",
                          color: "#475569",
                          cursor: "pointer"
                        }}
                      >
                        📅 Yesterday
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={newVisitForm.visitDate}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, visitDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color, #cbd5e1)" }}
                  />
                </div>

                {/* Visit Time Selector */}
                <TimePickerSelector
                  value={newVisitForm.visitTime || getNowTimeStr()}
                  onChange={(val) => setNewVisitForm({ ...newVisitForm, visitTime: val })}
                  label="Visit Time *"
                  sublabel="(1-tap select or live time)"
                  allowLive={true}
                />

                {/* Therapy / Visit Focus */}
                <div className="form-row-1" style={{ marginTop: "12px" }}>
                  <label style={{ fontWeight: "700", color: "var(--heading, #0f172a)", fontSize: "13px", display: "block", marginBottom: "4px" }}>
                    Therapy / Visit Focus *
                  </label>
                  <select
                    value={newVisitForm.reasonForVisit}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, reasonForVisit: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color, #cbd5e1)", fontSize: "13.5px" }}
                  >
                    <option value="Daily Physiotherapy Session">⚡ Daily Physiotherapy Session</option>
                    <option value="Follow-up Rehabilitation">Follow-up Rehabilitation</option>
                    <option value="Spine Decompression & Traction">Spine Decompression & Traction</option>
                    <option value="Cupping Therapy Session">Cupping Therapy Session</option>
                    <option value="Neuro Retraining & Gait">Neuro Retraining & Gait</option>
                    <option value="Cerebral Palsy Pediatric Rehab">Cerebral Palsy Pediatric Rehab</option>
                    <option value="Sports Injury Recovery">Sports Injury Recovery</option>
                    <option value="Post-Operative Mobilization">Post-Operative Mobilization</option>
                    <option value="Electro-Therapy (IFT/TENS)">Electro-Therapy (IFT/TENS)</option>
                    <option value="Progress Review & Discharge">Progress Review & Discharge</option>
                  </select>
                </div>

                {/* Clinical Diagnosis */}
                <div className="form-row-1" style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "6px" }}>
                    <label style={{ margin: 0, fontWeight: "700", color: "var(--heading, #0f172a)", fontSize: "13px" }}>
                      Clinical Diagnosis / Findings
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newVisitForm.diagnosis) return;
                        const translated = translateSymptomsToEnglish(newVisitForm.diagnosis);
                        setNewVisitForm({ ...newVisitForm, diagnosis: translated });
                      }}
                      style={{
                        background: "rgba(139, 92, 246, 0.1)",
                        color: "#7c3aed",
                        border: "1px solid #c4b5fd",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      ✨ Auto-Translate Medical Terms
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newVisitForm.diagnosis}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, diagnosis: e.target.value })}
                    placeholder="e.g. Lumbar Spondylosis, Cervical Radiculopathy, Knee OA..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color, #cbd5e1)" }}
                  />
                </div>

                {/* Therapy Administered & Exercises (Pre-filled by AI) */}
                <div className="form-row-1" style={{ marginTop: "12px" }}>
                  <label style={{ fontWeight: "700", color: "var(--heading, #0f172a)", fontSize: "13px", display: "block", marginBottom: "4px" }}>
                    Therapy Administered Today & Protocol Notes
                  </label>
                  <textarea
                    rows="3"
                    value={newVisitForm.treatmentNotes}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, treatmentNotes: e.target.value })}
                    placeholder="e.g. IFT 15 mins + Lumbar decompression + core isometric exercises."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color, #cbd5e1)", fontSize: "13px", lineHeight: "1.4" }}
                  />
                </div>

                {/* Fee Entry with Quick 1-Tap Chips */}
                <div style={{
                  marginTop: "14px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1.5px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "8px",
                  padding: "12px 14px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                    <label style={{ margin: 0, color: "#065f46", fontWeight: "800", fontSize: "13.5px" }}>
                      Today's Session Fee (₹) *
                    </label>
                    <span style={{ fontSize: "12px", color: "#047857", fontWeight: "600" }}>
                      Tap amount to change in 1 tap
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                    {["200", "300", "500", "700", "1000", "0"].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNewVisitForm({ ...newVisitForm, fee: amt })}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12.5px",
                          fontWeight: "800",
                          cursor: "pointer",
                          border: String(newVisitForm.fee) === amt ? "2px solid #10b981" : "1px solid #cbd5e1",
                          background: String(newVisitForm.fee) === amt ? "#10b981" : "#ffffff",
                          color: String(newVisitForm.fee) === amt ? "#ffffff" : "#0f172a"
                        }}
                      >
                        {amt === "0" ? "₹0 (Pkg / Free)" : `₹${amt}`}
                      </button>
                    ))}
                  </div>
                  <div className="phone-prefix-input" style={{ maxWidth: "180px" }}>
                    <span>₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="50"
                      value={newVisitForm.fee || "500"}
                      onChange={(e) => setNewVisitForm({ ...newVisitForm, fee: e.target.value })}
                      placeholder="500"
                    />
                  </div>
                </div>

                {/* Next Follow-Up Date & Quick Chips */}
                <div className="form-row-1" style={{ marginTop: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                    <label style={{ margin: 0, fontWeight: "700", color: "var(--heading, #0f172a)", fontSize: "13px" }}>
                      Next Follow-Up / Session
                    </label>
                    <div style={{ display: "inline-flex", gap: "4px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          const tom = new Date();
                          tom.setDate(tom.getDate() + 1);
                          setNewVisitForm({ ...newVisitForm, followUpDate: tom.toISOString().slice(0, 10) });
                        }}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "700",
                          borderRadius: "6px",
                          border: "1px solid #10b981",
                          background: "#ecfdf5",
                          color: "#059669",
                          cursor: "pointer"
                        }}
                      >
                        ⚡ Tomorrow (Daily)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const in2 = new Date();
                          in2.setDate(in2.getDate() + 2);
                          setNewVisitForm({ ...newVisitForm, followUpDate: in2.toISOString().slice(0, 10) });
                        }}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "700",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#f8fafc",
                          color: "#475569",
                          cursor: "pointer"
                        }}
                      >
                        In 2 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewVisitForm({ ...newVisitForm, followUpDate: "" })}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "600",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#f8fafc",
                          color: "#64748b",
                          cursor: "pointer"
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={newVisitForm.followUpDate}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, followUpDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color, #cbd5e1)" }}
                  />
                </div>

                {/* Form Actions */}
                <div className="form-actions-bar" style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    className="primary-btn"
                    style={{
                      flex: 1,
                      minHeight: "48px",
                      fontSize: "15px",
                      fontWeight: "800",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      borderColor: "#059669",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                  >
                    <span>⚡ 1-Tap Save Visit & Issue Receipt</span>
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowAddVisitModal(false)}
                    style={{ minHeight: "48px", padding: "0 18px", fontWeight: "700" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ================= PREMIUM REGISTRATION RECEIPT & PDF SLIP ================= */}
      {activeReceipt && (
        <div className="receipt-modal-overlay">
          <div className="receipt-modal-card">
            <div className="receipt-actions-toolbar sticky-receipt-toolbar">
              <button
                className="whatsapp-share-btn main-whatsapp-action"
                onClick={() => handleWhatsAppDirectShare(activeReceipt)}
                title={`Send official PDF prescription & receipt to ${activeReceipt.patient.name} on WhatsApp`}
              >
                <span style={{ fontSize: "18px" }}>💬</span>
                <span>Send Receipt via WhatsApp (+91 {activeReceipt.patient.phone})</span>
              </button>
              <button className="primary-btn" onClick={() => handleDownloadPDF(activeReceipt)}>
                📥 Download PDF
              </button>
              <button className="secondary-btn" onClick={() => handleViewPDF(activeReceipt)}>
                👁️ View PDF
              </button>
              <button className="secondary-btn" onClick={() => window.print()}>
                🖨️ Print
              </button>
              <button className="close-receipt-btn" onClick={() => { setActiveReceipt(null); setShareFeedback(""); }}>
                ✕ Close
              </button>
            </div>

            {shareFeedback && (
              <div className="share-feedback-notice">{shareFeedback}</div>
            )}

            {/* Official Registration Slip with Deep Navy Header and Transparent Logo */}
            <div className="printable-receipt" ref={receiptPrintRef}>
              <div className="receipt-header-banner">
                <div className="receipt-banner-left">
                  <img
                    src="/vindhy-receipt-logo.png"
                    alt="Vindhy Physio & Rehab Center"
                    className="receipt-logo"
                  />
                  <p className="receipt-banner-address">
                    Amravati Chauraha, Vindhyachal, Mirzapur (U.P.)<br />
                    Phone: +91 9793093316 &nbsp;|&nbsp; WhatsApp: +91 8382024264
                  </p>
                </div>
                <div className="receipt-banner-right">
                  <h3>DR. SATYAM VISHWAKARMA</h3>
                  <p className="doctor-sub">Lead Consultant Physiotherapist</p>
                  <span className="doctor-badge">Regd. Clinical Practitioner</span>
                </div>
              </div>

              <div className="receipt-divider"></div>
              <h3 className="receipt-title">OFFICIAL PATIENT REGISTRATION & CONSULTATION RECEIPT</h3>

              <div className="receipt-id-bar">
                <div><span>Patient ID:</span> <strong>{activeReceipt.patient.patientId}</strong></div>
                <div><span>Visit Number:</span> <strong>#{activeReceipt.visit.visitNumber || 1}</strong></div>
                <div><span>Date & Time:</span> <strong>{activeReceipt.visit.date} {activeReceipt.visit.time ? `(${activeReceipt.visit.time})` : ""}</strong></div>
              </div>

              {/* Patient Demographics Box */}
              <div className="receipt-section">
                <h4 className="receipt-sec-header">1. PATIENT DEMOGRAPHICS</h4>
                <div className="receipt-table-grid">
                  <div className="receipt-cell">
                    <span className="cell-label">Full Name:</span>
                    <strong className="cell-value highlight">{activeReceipt.patient.name}</strong>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Age & Gender:</span>
                    <span className="cell-value">{activeReceipt.patient.age} Yrs / {activeReceipt.patient.gender}</span>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Primary Phone:</span>
                    <span className="cell-value">+91 {activeReceipt.patient.phone}</span>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Alternate Contact:</span>
                    <span className="cell-value">{activeReceipt.patient.altPhone ? `+91 ${activeReceipt.patient.altPhone}` : "N/A"}</span>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Address / Location:</span>
                    <span className="cell-value">{activeReceipt.patient.address || "Vindhyachal, Mirzapur"}</span>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Clinical History:</span>
                    <strong className="cell-value text-emerald">{activeReceipt.patient.totalVisits || 1} Completed Visit(s)</strong>
                  </div>
                </div>
              </div>

              {/* Consultation & Clinical Assessment */}
              <div className="receipt-section">
                <h4 className="receipt-sec-header">2. CLINICAL DIAGNOSIS & REHABILITATION PLAN</h4>
                <div className="receipt-table-grid">
                  <div className="receipt-cell full-width">
                    <span className="cell-label">Chief Clinical Focus:</span>
                    <strong className="cell-value">{activeReceipt.visit.reason || "Physiotherapy Rehabilitation"}</strong>
                  </div>
                  <div className="receipt-cell full-width">
                    <span className="cell-label">Symptoms & Complaints:</span>
                    <span className="cell-value">{activeReceipt.visit.complaint || "Physical pain / functional limitation"}</span>
                  </div>
                  <div className="receipt-cell full-width">
                    <span className="cell-label">Final Medical Diagnosis:</span>
                    <strong className="cell-value">{activeReceipt.visit.diagnosis || "Under active physiotherapy management"}</strong>
                  </div>
                  <div className="receipt-cell full-width">
                    <span className="cell-label">Therapy Administered:</span>
                    <span className="cell-value">{activeReceipt.visit.treatmentNotes || "Mobilization, stretching, and guided exercise therapy."}</span>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Follow-Up Advice:</span>
                    <strong className="cell-value text-orange">
                      {activeReceipt.visit.followUpDate ? `${activeReceipt.visit.followUpDate} (Regular Rehab Session)` : "As advised by Consultant Doctor"}
                    </strong>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Next Visit Time:</span>
                    <strong className="cell-value">{activeReceipt.visit.followUpTime || "10:30 AM (Morning Clinic)"}</strong>
                  </div>
                </div>
              </div>

              {/* Fee and Payment Settlement */}
              <div className="receipt-section">
                <h4 className="receipt-sec-header">3. CONSULTATION & TREATMENT CHARGES</h4>
                <div className="receipt-table-grid single-col">
                  <div className="receipt-cell highlight-fee">
                    <span className="cell-label">Consultation & Treatment Fee:</span>
                    <strong className="cell-value fee-amount">
                      {activeReceipt.visit.fee || "₹500"}
                    </strong>
                    <span className="payment-status-badge">Status: Paid & Settled (Cash / UPI)</span>
                  </div>
                </div>
              </div>

              {/* Official Signature */}
              <div className="receipt-sign-box">
                <div className="sign-signature-container">
                  <img
                    src="/signature.png"
                    alt="Doctor Signature"
                    className="doctor-signature-img"
                    onError={(e) => { e.currentTarget.src = "/signature.jpg"; }}
                  />
                </div>
                <div className="sign-line"></div>
                <p><strong>Dr. Satyam Vishwakarma</strong></p>
                <span>Consultant Physiotherapist</span>
                <span>Vindhy Physio & Rehab Center</span>
              </div>

              <div className="receipt-footer">
                <p>Thank you for choosing Vindhy Physio & Rehab Center</p>
                <span>For appointments & medical inquiries: Call 9793093316 | WhatsApp: 8382024264 | Amravati Chauraha, Vindhyachal</span>
              </div>
            </div>

            {/* Quick Sticky Bottom WhatsApp Action on Mobile */}
            <div className="mobile-receipt-bottom-bar hide-on-desktop" style={{ marginTop: "14px" }}>
              <button
                className="whatsapp-share-btn main-whatsapp-action"
                onClick={() => handleWhatsAppDirectShare(activeReceipt)}
              >
                <span style={{ fontSize: "18px" }}>💬</span>
                <span>Send Receipt via WhatsApp (+91 {activeReceipt.patient.phone})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 2: DOCTOR CONSULTATION & FEE DIALOG MODAL ================= */}
      {activeConsultPatient && (
        <div className="add-visit-modal-overlay">
          <div className="add-visit-card consultation-premium-card" style={{ maxWidth: "680px", width: "100%", background: "#ffffff", borderRadius: "18px", border: "1.5px solid #cbd5e1", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: "22px 24px", boxSizing: "border-box", color: "#0f172a" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "14px", borderBottom: "1.5px solid #f1f5f9", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <PatientAvatar patient={activeConsultPatient} size={52} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", background: "#fef3c7", color: "#92400e", padding: "3px 9px", borderRadius: "6px", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                      🩺 Doctor Consultation & Slip
                    </span>
                  </div>
                  <h3 style={{ margin: "2px 0", color: "#0f172a", fontSize: "19px", fontWeight: "800", letterSpacing: "-0.3px" }}>
                    {activeConsultPatient.name}
                  </h3>
                  <p style={{ margin: 0, color: "#475569", fontSize: "13px", fontWeight: "500" }}>
                    ID: <strong style={{ color: "#0284c7" }}>{activeConsultPatient.patientId}</strong> • {activeConsultPatient.age}y/{activeConsultPatient.gender} • <strong style={{ color: "#0f172a" }}>+91 {activeConsultPatient.phone}</strong>
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="secondary-btn close-btn" 
                onClick={() => setActiveConsultPatient(null)} 
                style={{ fontSize: "16px", padding: "6px 12px", borderRadius: "8px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", cursor: "pointer" }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Quick Patient Intake Problem Banner */}
            <div style={{ background: "#f0fdfa", border: "1.5px solid #99f6e4", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                <div><span style={{ color: "#0f766e", fontWeight: "700" }}>Chief Concern:</span> <strong style={{ color: "#134e4a", marginLeft: "4px" }}>{activeConsultPatient.firstVisitReason || "General Rehabilitation"}</strong></div>
                <div><span style={{ color: "#0f766e", fontWeight: "700" }}>Duration:</span> <strong style={{ color: "#b45309", marginLeft: "4px" }}>{activeConsultPatient.duration || "1 to 2 Weeks"}</strong></div>
              </div>
              {activeConsultPatient.complaint && (
                <div style={{ color: "#334155", marginTop: "6px", fontSize: "12.5px", paddingTop: "6px", borderTop: "1px dashed #ccfbf1" }}>
                  <span style={{ color: "#0f766e", fontWeight: "700" }}>Reported Symptoms:</span> <em style={{ color: "#1e293b" }}>"{activeConsultPatient.complaint}"</em>
                </div>
              )}
            </div>

            <form onSubmit={handleFinalizeConsultationSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Consultation Date & Time */}
              <div className="form-row-2">
                <label style={{ margin: 0, fontWeight: "800", color: "#0f172a", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span>📅 Consultation Date <span style={{ color: "#e11d48" }}>*</span></span>
                  <input
                    type="date"
                    required
                    value={consultForm.visitDate}
                    onChange={(e) => setConsultForm({ ...consultForm, visitDate: e.target.value })}
                    style={{ height: "44px", width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px", color: "#0f172a", background: "#ffffff", fontWeight: "600", boxSizing: "border-box" }}
                  />
                </label>

                <label style={{ margin: 0, fontWeight: "800", color: "#0f172a", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span>🕒 Consultation Time <span style={{ color: "#e11d48" }}>*</span></span>
                  <select
                    value={consultForm.visitTimeSelect || "10:30 AM"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConsultForm({
                        ...consultForm,
                        visitTimeSelect: val,
                        visitTime: val === "Custom" ? "" : val
                      });
                    }}
                    style={{ height: "44px", width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px", color: "#0f172a", background: "#ffffff", fontWeight: "700", boxSizing: "border-box" }}
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="12:30 PM">12:30 PM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                    <option value="07:30 PM">07:30 PM</option>
                    <option value="08:00 PM">08:00 PM</option>
                    <option value="08:30 PM">08:30 PM</option>
                    <option value="Custom">✏️ Custom / Other Time...</option>
                  </select>
                </label>
              </div>

              {consultForm.visitTimeSelect === "Custom" && (
                <div className="form-row-1">
                  <label style={{ margin: 0, fontWeight: "800", color: "#0f172a", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span>Enter Specific Consultation Time <span style={{ color: "#e11d48" }}>*</span></span>
                    <input
                      type="text"
                      required
                      value={consultForm.visitTime}
                      onChange={(e) => setConsultForm({ ...consultForm, visitTime: e.target.value })}
                      placeholder="e.g. 09:45 PM"
                      style={{ height: "44px", width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px", color: "#0f172a", background: "#ffffff", fontWeight: "600", boxSizing: "border-box" }}
                    />
                  </label>
                </div>
              )}

              {/* Diagnosis Field */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                  <label style={{ margin: 0, fontWeight: "800", color: "#0f172a", fontSize: "13px" }}>
                    🩺 Final Clinical Diagnosis & Assessment <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!consultForm.diagnosis.trim()) return;
                      const translated = translateSymptomsToEnglish(consultForm.diagnosis);
                      setConsultForm({ ...consultForm, diagnosis: translated });
                    }}
                    disabled={!consultForm.diagnosis}
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "5px 12px",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: "0 2px 6px rgba(124, 58, 237, 0.25)"
                    }}
                  >
                    ✨ AI Convert to Medical English
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={consultForm.diagnosis}
                  onChange={(e) => setConsultForm({ ...consultForm, diagnosis: e.target.value })}
                  placeholder="e.g. Spine & Back Pain (Active Rehabilitation)"
                  style={{ height: "44px", width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px", color: "#0f172a", background: "#ffffff", fontWeight: "700", boxSizing: "border-box" }}
                />
              </div>

              {/* Therapy & Treatment Notes */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "800", color: "#0f172a", fontSize: "13px" }}>
                  ⚡ Therapy & Treatment Administered Today <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  value={consultForm.treatmentNotes}
                  onChange={(e) => setConsultForm({ ...consultForm, treatmentNotes: e.target.value })}
                  placeholder="e.g. Electrotherapy (IFT) + Targeted manual decompression + Isometric strengthening exercises."
                  style={{ display: "block", width: "100%", minHeight: "80px", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13px", color: "#0f172a", background: "#ffffff", lineHeight: "1.45", fontWeight: "600", boxSizing: "border-box" }}
                />
              </div>

              {/* Fee Entry with Quick 1-Tap Chips */}
              <div style={{
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: "12px",
                padding: "14px 16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                  <label style={{ margin: 0, color: "#065f46", fontWeight: "800", fontSize: "13.5px" }}>
                    💰 Consultation & Therapy Fee (₹) <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <span style={{ fontSize: "12px", color: "#047857", fontWeight: "700" }}>
                    Tap amount to select in 1 tap
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                  {[
                    { val: "200", label: "₹200" },
                    { val: "300", label: "₹300" },
                    { val: "500", label: "₹500" },
                    { val: "700", label: "₹700" },
                    { val: "1000", label: "₹1000" },
                    { val: "0", label: "₹0 (Pkg / Free)" }
                  ].map((chip) => {
                    const isSelected = String(consultForm.fee) === chip.val;
                    return (
                      <button
                        key={chip.val}
                        type="button"
                        onClick={() => setConsultForm({ ...consultForm, fee: chip.val })}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "800",
                          cursor: "pointer",
                          border: isSelected ? "2px solid #047857" : "1.5px solid #94a3b8",
                          background: isSelected ? "#059669" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#0f172a",
                          boxShadow: isSelected ? "0 3px 8px rgba(5, 150, 105, 0.4)" : "0 1px 2px rgba(0,0,0,0.05)",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
                <div className="phone-prefix-input" style={{ maxWidth: "200px" }}>
                  <span style={{ fontWeight: "800", color: "#065f46" }}>₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={consultForm.fee}
                    onChange={(e) => setConsultForm({ ...consultForm, fee: e.target.value })}
                    placeholder="500"
                    style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", background: "#ffffff", border: "1.5px solid #86efac", borderRadius: "8px", padding: "8px 12px" }}
                  />
                </div>
              </div>

              {/* Next Follow-Up Session Section */}
              <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                  <label style={{ margin: 0, color: "#0f172a", fontWeight: "800", fontSize: "13px" }}>
                    🗓️ Next Follow-Up Session <span style={{ color: "#64748b", fontSize: "12px", fontWeight: "600" }}>(Optional)</span>
                  </label>
                  <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => {
                        const tom = new Date();
                        tom.setDate(tom.getDate() + 1);
                        setConsultForm({ ...consultForm, followUpDate: tom.toISOString().slice(0, 10), followUpTime: consultForm.followUpTime || "10:30 AM" });
                      }}
                      style={{
                        padding: "5px 10px",
                        fontSize: "12px",
                        fontWeight: "800",
                        borderRadius: "6px",
                        border: "1.5px solid #10b981",
                        background: "#ecfdf5",
                        color: "#065f46",
                        cursor: "pointer"
                      }}
                    >
                      ⚡ Tomorrow (Daily)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const in2 = new Date();
                        in2.setDate(in2.getDate() + 2);
                        setConsultForm({ ...consultForm, followUpDate: in2.toISOString().slice(0, 10), followUpTime: consultForm.followUpTime || "10:30 AM" });
                      }}
                      style={{
                        padding: "5px 10px",
                        fontSize: "12px",
                        fontWeight: "800",
                        borderRadius: "6px",
                        border: "1.5px solid #94a3b8",
                        background: "#ffffff",
                        color: "#0f172a",
                        cursor: "pointer"
                      }}
                    >
                      In 2 Days
                    </button>
                    {consultForm.followUpDate && (
                      <button
                        type="button"
                        onClick={() => setConsultForm({ ...consultForm, followUpDate: "", followUpTime: "" })}
                        style={{
                          padding: "5px 10px",
                          fontSize: "12px",
                          fontWeight: "800",
                          borderRadius: "6px",
                          border: "1.5px solid #fca5a5",
                          background: "#fef2f2",
                          color: "#dc2626",
                          cursor: "pointer"
                        }}
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="form-row-2">
                  <label style={{ margin: 0, fontWeight: "700", color: "#334155", fontSize: "12.5px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span>Follow-Up Date</span>
                    <input
                      type="date"
                      value={consultForm.followUpDate}
                      onChange={(e) => setConsultForm({ ...consultForm, followUpDate: e.target.value })}
                      style={{ height: "40px", width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "13px", color: "#0f172a", background: "#ffffff", fontWeight: "600", boxSizing: "border-box" }}
                    />
                  </label>
                  <label style={{ margin: 0, fontWeight: "700", color: "#334155", fontSize: "12.5px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span>Follow-Up Time</span>
                    <select
                      value={consultForm.followUpTime || "10:30 AM"}
                      onChange={(e) => setConsultForm({ ...consultForm, followUpTime: e.target.value })}
                      disabled={!consultForm.followUpDate}
                      style={{ height: "40px", width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "13px", color: "#0f172a", background: "#ffffff", fontWeight: "600", boxSizing: "border-box" }}
                    >
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="04:30 PM">04:30 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                      <option value="05:30 PM">05:30 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                      <option value="07:00 PM">07:00 PM</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-actions-bar" style={{ marginTop: "10px" }}>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={consultLoading}
                  style={{
                    minHeight: "50px",
                    fontSize: "15px",
                    fontWeight: "800",
                    width: "100%",
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    boxShadow: "0 6px 16px rgba(5, 150, 105, 0.4)",
                    cursor: "pointer",
                    letterSpacing: "0.2px"
                  }}
                >
                  {consultLoading ? "⏳ Finalizing Consultation & Generating Slip..." : "🩺 Issue Slip & Finalize Receipt (WhatsApp PDF)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4-Item Doctor Mobile Bottom Nav (Matching Image 3) */}
      <nav className="mobile-bottom-nav-4 doctor-bottom-nav">
        <button 
          className={`nav-item-4 ${activeTab === "dashboard" && !showDoctorMore ? "active" : ""}`}
          onClick={() => selectDoctorTab("dashboard")}
        >
          <span className="nav-icon-4">🏠</span>
          <span className="nav-label-4">Home</span>
        </button>

        <button 
          className={`nav-item-4 ${activeTab === "patients" && !showDoctorMore ? "active" : ""}`}
          onClick={() => { selectDoctorTab("patients"); fetchPatients(); }}
        >
          <span className="nav-icon-4">👥</span>
          <span className="nav-label-4">Patients</span>
          {stats.totalPatients > 0 && <span className="bottom-nav-badge">{stats.totalPatients}</span>}
        </button>

        <button 
          className={`nav-item-4 ${activeTab === "today" && !showDoctorMore ? "active" : ""}`}
          onClick={() => { selectDoctorTab("today"); fetchTodayVisits(); }}
        >
          <span className="nav-icon-4">📅</span>
          <span className="nav-label-4">Visits</span>
          {todayVisits.length > 0 && <span className="bottom-nav-badge green">{todayVisits.length}</span>}
        </button>

        <button 
          className={`nav-item-4 ${showDoctorMore ? "active" : ""}`}
          onClick={toggleDoctorMore}
        >
          <span className="nav-icon-4">☰</span>
          <span className="nav-label-4">More</span>
          {enquiries.length > 0 && <span className="bottom-nav-badge orange">{enquiries.length}</span>}
        </button>
      </nav>

      {/* Doctor More Action Sheet */}
      {showDoctorMore && (
        <div className="app-more-sheet-overlay" onClick={() => setShowDoctorMore(false)}>
          <div className="app-more-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="more-sheet-handle"></div>
            <div className="more-sheet-header">
              <div>
                <h3>Doctor Operations & Tools</h3>
                <p>Dr. Satyam Vishwakarma • Admin Console</p>
              </div>
              <button className="close-sheet-btn" onClick={() => setShowDoctorMore(false)}>✕</button>
            </div>
            <div className="more-sheet-grid">
              <button className="more-sheet-item" onClick={() => selectDoctorTab("waiting")}>
                <span className="sheet-icon amber">⏳</span>
                <div className="sheet-info">
                  <strong>Waiting Queue ({patients.filter(p => p.status === "Waiting for Doctor" || p.totalVisits === 0).length})</strong>
                  <span>Patients currently in waiting area</span>
                </div>
                <span className="more-arrow">›</span>
              </button>

              <button className="more-sheet-item" onClick={() => { selectDoctorTab("enquiries"); fetchEnquiries(); }}>
                <span className="sheet-icon purple">📩</span>
                <div className="sheet-info">
                  <strong>Online Bookings & Enquiries ({enquiries.length})</strong>
                  <span>Website appointments & patient leads</span>
                </div>
                <span className="more-arrow">›</span>
              </button>

              <button className="more-sheet-item" onClick={() => selectDoctorTab("settings")}>
                <span className="sheet-icon teal">⚙️</span>
                <div className="sheet-info">
                  <strong>Cloud Settings & Backup</strong>
                  <span>Security & Google Sheets sync</span>
                </div>
                <span className="more-arrow">›</span>
              </button>

              <button className="more-sheet-item" onClick={() => { handleManualSync(); setShowDoctorMore(false); }}>
                <span className="sheet-icon green">🔄</span>
                <div className="sheet-info">
                  <strong>Force Google Sheets Sync</strong>
                  <span>Trigger full cloud sync now</span>
                </div>
                <span className="more-arrow">›</span>
              </button>

              <button
                type="button"
                className="more-sheet-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDoctorMore(false);
                  try {
                    localStorage.removeItem("active_portal");
                    if (window.location.hash === "#doctor") {
                      history.replaceState(null, "", window.location.pathname);
                    }
                  } catch (err) {}
                  if (onClose) onClose();
                }}
              >
                <span className="sheet-icon cyan">🚪</span>
                <div className="sheet-info">
                  <strong>Exit to Clinic Website</strong>
                  <span>Return to public clinic page</span>
                </div>
                <span className="more-arrow">›</span>
              </button>

              {/* Styled Dedicated Logout Button */}
              <button
                type="button"
                className="more-sheet-logout-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDoctorMore(false);
                  handleLogout();
                }}
              >
                <span className="logout-icon">🔒</span>
                <span>Logout Doctor Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
