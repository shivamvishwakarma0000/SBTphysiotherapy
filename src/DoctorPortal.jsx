import React, { useState, useEffect, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import { CLINIC_LOGO_B64, DOCTOR_SIGNATURE_B64 } from "./pdfAssets";
import { api, getWebhookUrl, setWebhookUrl, restoreFromGoogleSheets, syncToGoogleSheets } from "./apiService";
import { buildReceiptPDF, downloadReceiptPDF, cleanDateOnly, cleanTimeOnly } from "./receiptUtils";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "./useTheme";

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
    name: "Vindhya Physio & Rehab Center"
  };

  const [clinicLocation, setClinicLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("vindhya_clinic_location");
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
          name: place.display_name.split(",")[0] || "Vindhya Physio & Rehab Center"
        };
        setClinicLocation(updated);
        localStorage.setItem("vindhya_clinic_location", JSON.stringify(updated));
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
      name: "Vindhya Physio & Rehab Center"
    };
    setClinicLocation(updated);
    localStorage.setItem("vindhya_clinic_location", JSON.stringify(updated));
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
    setNewPatientForm({
      name: enquiry.name || "",
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
        setAccountActionMsg({ text: "✅ Password reset to default 'vindhya' successfully.", isError: false });
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

  const handleMarkEnquirySpam = async (enquiry) => {
    if (!enquiry || !enquiry.id) return;
    const isCurrentlySpam = enquiry.status === "Hidden / Spam";
    const newStatus = isCurrentlySpam ? "New" : "Hidden / Spam";

    // Optimistic UI update so the action responds instantly
    setEnquiries(prev => prev.map(e => String(e.id) === String(enquiry.id) ? { ...e, status: newStatus } : e));

    try {
      const res = await api.updateEnquiryStatus(enquiry.id, newStatus);
      if (res.ok) {
        fetchEnquiries();
      }
    } catch (err) {
      console.error("Failed to update enquiry status:", err);
      fetchEnquiries(); // rollback on error
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
    const fileName = `Vindhya_Receipt_${receipt.patient.name.replace(/\s+/g, "_")}_${receipt.patient.patientId}_Visit${receipt.visit.visitNumber || 1}.pdf`;
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
    const fileName = `Vindhya_Receipt_${patient.name.replace(/\s+/g, "_")}_${patient.patientId}_Visit${visit.visitNumber || 1}.pdf`;
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
      await api.deletePatient(patientId);
      if (selectedPatient && selectedPatient.patientId === patientId) {
        setSelectedPatient(null);
      }
      fetchStats();
      fetchPatients();
      fetchTodayVisits();
      alert(`Patient "${patientName}" (${patientId}) has been permanently deleted.`);
    } catch (err) {
      alert("Could not delete patient: " + err.message);
    }
  };

  const handleExportCSV = (type = "visits") => {
    api.exportCSV(type);
  };

  // ==========================================
  // RENDER: LOGIN VIEW
  // ==========================================
  if (!token) {
    return (
      <div className="doctor-portal-modal-overlay">
        <div className="doctor-login-card">
          <div className="login-header">
            <img
              src={CLINIC_LOGO_B64 || "/vindhya-receipt-logo.png"}
              alt="Vindhya Physio & Rehab Center"
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
            <div className="inner-modal-overlay">
              <div className="inner-modal-card">
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
              src="/vindhya-receipt-logo.png"
              alt="Vindhya Physio & Rehab Center"
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
                localStorage.getItem("vindhya_app_installed") === "true"
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
                      alert("To install the Vindhya Physio App on your phone, tap your browser's menu (⋮ or Share icon) and select 'Add to Home Screen' or 'Install App'.");
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
                  alt="Vindhya Physio & Rehab Center"
                  className="mobile-hero-logo"
                />
              </div>

              <div className="greeting-text">
                <span className="greeting-wave">👋</span>
                <div>
                  <h1 className="greeting-title">Hello, Dr. Satyam!</h1>
                  <p className="greeting-subtitle">Clinical Operations • Vindhya Physio & Rehab Center</p>
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
                <div className="card-content">
                  <h3 className="card-title">Intake Patient</h3>
                  <p className="card-desc">Register new case</p>
                </div>
              </div>

              <div className="mobile-app-card" onClick={() => selectDoctorTab("waiting")}>
                <div className="card-icon-bubble amber">⏳</div>
                <div className="card-content">
                  <div className="card-header-row">
                    <h3 className="card-title">Waiting Queue</h3>
                    <span className="card-count-badge amber">
                      {patients.filter(p => p.status === "Waiting for Doctor" || p.totalVisits === 0).length}
                    </span>
                  </div>
                  <p className="card-desc">Awaiting consult</p>
                </div>
              </div>

              <div className="mobile-app-card" onClick={() => { selectDoctorTab("patients"); fetchPatients(); }}>
                <div className="card-icon-bubble teal">👥</div>
                <div className="card-content">
                  <div className="card-header-row">
                    <h3 className="card-title">All Patients</h3>
                    <span className="card-count-badge teal">{stats.totalPatients || patients.length}</span>
                  </div>
                  <p className="card-desc">Full patient registry</p>
                </div>
              </div>

              <div className="mobile-app-card" onClick={() => { selectDoctorTab("today"); fetchTodayVisits(); }}>
                <div className="card-icon-bubble green">📅</div>
                <div className="card-content">
                  <div className="card-header-row">
                    <h3 className="card-title">Today's Visits</h3>
                    <span className="card-count-badge green">{stats.todayVisitsCount || todayVisits.length}</span>
                  </div>
                  <p className="card-desc">Scheduled sessions</p>
                </div>
              </div>

              <div className="mobile-app-card" onClick={() => { selectDoctorTab("enquiries"); fetchEnquiries(); }}>
                <div className="card-icon-bubble purple">📩</div>
                <div className="card-content">
                  <div className="card-header-row">
                    <h3 className="card-title">Online Bookings</h3>
                    <span className="card-count-badge purple">{stats.totalEnquiriesCount || enquiries.length}</span>
                  </div>
                  <p className="card-desc">Web appointment leads</p>
                </div>
              </div>

              <div className="mobile-app-card" onClick={() => { selectDoctorTab("enquiries"); fetchEnquiries(); }}>
                <div className="card-icon-bubble cyan">🌐</div>
                <div className="card-content">
                  <div className="card-header-row">
                    <h3 className="card-title">Website Enquiries</h3>
                    <span className="card-count-badge cyan">
                      {enquiries.filter(e => e.status !== "Resolved").length || enquiries.length}
                    </span>
                  </div>
                  <p className="card-desc">Pending questions</p>
                </div>
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
                <label>
                  Intake / Arrival Time * <small style={{ color: "#38bdf8", fontWeight: "normal" }}>(Auto-matched to current live clock)</small>
                  <input
                    type="text"
                    required
                    value={newPatientForm.visitTime || getNowTimeStr()}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, visitTime: e.target.value })}
                    placeholder="e.g. 02:30 PM"
                  />
                </label>
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
                    <span className="waiting-time-tag">Reg: {String(p.registrationDate).slice(0, 10)}</span>
                  </div>

                  <div className="waiting-card-body">
                    <h3 className="waiting-patient-name">{p.name}</h3>
                    <p className="waiting-patient-sub">
                      {p.age} Yrs • {p.gender} • <strong>Phone:</strong> +91 {p.phone}
                    </p>

                    <div className="waiting-problem-box">
                      <strong>🩺 Chief Concern:</strong> {p.firstVisitReason}
                      <br />
                      <strong>⏱️ Duration / Frequency:</strong> {p.duration || "Initial onset"}
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
                        onClick={() => handleCopyPhoneNumber(p.phone)}
                        title="Copy Patient Phone"
                      >
                        📋 Copy Phone
                      </button>
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
            <div className="section-header-row">
              <div>
                <h2>Patient Directory & Clinical Profiles</h2>
                <p>Search by Patient ID (VPR-XXXX), Patient Name, or Phone Number.</p>
              </div>
              <button className="primary-btn" onClick={() => setActiveTab("new-patient")}>
                ➕ Intake New Patient
              </button>
            </div>

            <div className="search-bar-row">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search by Patient ID, Name, or 10-digit Phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchPatients(e.target.value);
                }}
              />
              <button className="secondary-btn" onClick={() => handleExportCSV("patients")}>
                📥 Export Patients (CSV)
              </button>
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
                      <h3 className="mobile-patient-name">{p.name}</h3>
                      <p className="mobile-patient-sub">{p.age}y • {p.gender} • +91 {p.phone}</p>
                    </div>
                    <span className={`status-badge ${(p.status || "Active").toLowerCase().replace(/\s+/g, '-')}`}>
                      {p.status || "Active"}
                    </span>
                  </div>
                  <div className="mobile-patient-info">
                    <span className="patient-concern-pill">🩺 {p.firstVisitReason}</span>
                    <span className="visit-count-tag">{p.totalVisits || 1} Visits</span>
                  </div>
                  <div className="mobile-patient-actions">
                    <button className="table-action-btn btn-profile" onClick={() => openPatientProfile(p.patientId)}>
                      👤 Profile
                    </button>
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
            <div className="section-header-row">
              <div>
                <h2>Website Consultation Bookings ({enquiries.length})</h2>
                <p>Manage patient consultation requests, convert to patients, or link to existing records without duplication.</p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "14px" }}>
                <label className="checkbox-filter-label" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: "#0f172a", fontWeight: "600" }}>
                  <input
                    type="checkbox"
                    checked={showSpamFilter}
                    onChange={(e) => setShowSpamFilter(e.target.checked)}
                    style={{ width: "18px", height: "18px", minHeight: "18px", margin: 0, accentColor: "#0878C9", cursor: "pointer" }}
                  />
                  <span>Show Hidden / Spam</span>
                </label>
                <button className="secondary-btn" onClick={() => handleExportCSV("enquiries")}>
                  📥 Export Enquiries (CSV)
                </button>
              </div>
            </div>

            {/* Mobile Cards View (Visible on Phones) */}
            <div className="mobile-enquiry-cards hide-on-desktop">
              {enquiries
                .filter(e => showSpamFilter || e.status !== "Hidden / Spam")
                .map(e => {
                  const isSpam = e.status === "Hidden / Spam";
                  const isLinked = String(e.status || "").startsWith("Linked:");
                  const cleanPhone = String(e.phone || "").replace(/\D/g, "").slice(-10);
                  return (
                    <div key={e.id} className="mobile-enquiry-card" style={{ opacity: isSpam ? 0.6 : 1 }}>
                      <div className="enquiry-card-header">
                        <div className="enquiry-date-block">
                          <span className="enquiry-date-pill">📅 {cleanDateOnly(e.date)}</span>
                          {e.time && <span className="enquiry-time-sub">⏰ {cleanTimeOnly(e.time) || e.time}</span>}
                        </div>
                        <span className={`enquiry-status-pill ${isSpam ? "spam" : isLinked ? "linked" : (e.status === "Converted" ? "converted" : "new")}`}>
                          {e.status || "New"}
                        </span>
                      </div>

                      <div className="enquiry-patient-meta">
                        <h4 className="enquiry-patient-name">{e.name}</h4>
                        <div className="enquiry-contact-row">
                          <a href={`tel:${cleanPhone}`} className="enquiry-phone-btn">
                            📞 +91 {cleanPhone}
                          </a>
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${e.name}, thank you for contacting Vindhya Physio & Rehab Center. Dr. Satyam Vishwakarma is reviewing your consultation enquiry.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="enquiry-wa-btn"
                          >
                            💬 WhatsApp
                          </a>
                        </div>
                      </div>

                      <div className="enquiry-details-grid">
                        <div className="enquiry-detail-row">
                          <span className="enquiry-detail-label">Concern:</span>
                          <span className="condition-tag">{e.painArea || "General Physiotherapy"}</span>
                        </div>
                        <div className="enquiry-detail-row">
                          <span className="enquiry-detail-label">Preferred Date:</span>
                          <span className="enquiry-pref-date">{cleanDateOnly(e.appointmentDate) || "Flexible"}</span>
                        </div>
                        {e.concern && (
                          <div className="enquiry-message-box">
                            "{e.concern}"
                          </div>
                        )}
                      </div>

                      <div className="enquiry-actions-row">
                        <button
                          type="button"
                          className="enquiry-action-btn enroll"
                          onClick={() => convertEnquiryToPatient(e)}
                          title="Enroll as a new patient record"
                        >
                          ➕ Enroll
                        </button>
                        <button
                          type="button"
                          className="enquiry-action-btn link"
                          onClick={() => {
                            if (patients.length === 0) fetchPatients();
                            setLinkingEnquiry(e);
                            setLinkSearchQuery("");
                          }}
                          title="Link this request to an existing patient"
                        >
                          🔗 Link
                        </button>
                        <button
                          type="button"
                          className="enquiry-action-btn spam"
                          onClick={() => handleMarkEnquirySpam(e)}
                          title={isSpam ? "Unhide enquiry" : "Hide spam enquiry"}
                        >
                          {isSpam ? "Unhide" : "🚫 Hide"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              {enquiries.length === 0 && (
                <div className="empty-state-box">
                  <p>No online consultation requests yet.</p>
                </div>
              )}
            </div>

            {/* Desktop Scannable Table (Visible on Tablets & Laptops) */}
            <div className="table-responsive hide-on-mobile">
              <table className="doctor-table">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Patient Name</th>
                    <th>Phone</th>
                    <th>Condition / Pain</th>
                    <th>Preferred Date</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries
                    .filter(e => showSpamFilter || e.status !== "Hidden / Spam")
                    .map(e => {
                      const isSpam = e.status === "Hidden / Spam";
                      const isLinked = String(e.status || "").startsWith("Linked:");
                      return (
                        <tr key={e.id} style={{ opacity: isSpam ? 0.55 : 1 }}>
                          <td><strong>{cleanDateOnly(e.date)}</strong><br /><small>{cleanTimeOnly(e.time) || e.time}</small></td>
                          <td><strong>{e.name}</strong></td>
                          <td>
                            <a href={`tel:${e.phone}`} className="phone-link">+91 {e.phone}</a>
                          </td>
                          <td><span className="condition-tag">{e.painArea}</span></td>
                          <td>{cleanDateOnly(e.appointmentDate) || "Flexible"}</td>
                          <td style={{ maxWidth: "200px" }}>{e.concern}</td>
                          <td>
                            <span style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              whiteSpace: "nowrap",
                              background: isSpam ? "#fee2e2" : isLinked ? "#f3e8ff" : (e.status === "Converted" ? "#dcfce7" : "#e0f2fe"),
                              color: isSpam ? "#dc2626" : isLinked ? "#7e22ce" : (e.status === "Converted" ? "#15803d" : "#0369a1")
                            }}>
                              {e.status || "New"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              <button
                                className="table-action-btn primary-action"
                                onClick={() => convertEnquiryToPatient(e)}
                                title="Enroll as a new patient record"
                              >
                                ➕ Enroll
                              </button>
                              <button
                                className="table-action-btn"
                                style={{ background: "rgba(126, 34, 206, 0.12)", color: "#9333ea", borderColor: "rgba(126, 34, 206, 0.3)" }}
                                onClick={() => {
                                  if (patients.length === 0) fetchPatients();
                                  setLinkingEnquiry(e);
                                  setLinkSearchQuery("");
                                }}
                                title="Link this request to an existing patient"
                              >
                                🔗 Link
                              </button>
                              <button
                                className="table-action-btn"
                                style={{
                                  background: isSpam ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                  color: isSpam ? "#10b981" : "#ef4444",
                                  borderColor: isSpam ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"
                                }}
                                onClick={() => handleMarkEnquirySpam(e)}
                                title={isSpam ? "Unhide enquiry" : "Hide spam enquiry"}
                              >
                                {isSpam ? "Unhide" : "🚫 Hide"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {enquiries.length === 0 && (
                    <tr>
                      <td colSpan="8" className="empty-cell">No online consultation requests yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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

                <button
                  className="secondary-btn full-btn"
                  onClick={handleManualSync}
                  disabled={syncLoading}
                >
                  {syncLoading ? "Syncing to Google Sheets..." : "🔄 Push All Records to Google Sheets"}
                </button>
                <button
                  className="primary-btn full-btn"
                  style={{ marginTop: "10px", background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
                  onClick={handleRestoreFromSheets}
                  disabled={restoreLoading}
                  title="Import and restore all patient profiles, past visits, and bookings from Google Sheets"
                >
                  {restoreLoading ? "Restoring from Google Sheets..." : "📥 Restore / Pull All Data from Google Sheets"}
                </button>
                <button
                  type="button"
                  className="secondary-btn full-btn"
                  style={{ marginTop: "10px", background: "rgba(234, 179, 8, 0.12)", color: "#facc15", borderColor: "rgba(234, 179, 8, 0.4)" }}
                  onClick={async () => {
                    const defaultUrl = "https://script.google.com/macros/s/AKfycbyq_8IPpItrS6W60AjV3GaOEQ9zaXvEQ-OrH6qjCc3ighhLsBQ0JMmXAZnyn2SUQm1VSQ/exec";
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

      {/* ================= PATIENT PROFILE MODAL ================= */}
      {selectedPatient && (
        <div className="patient-profile-modal-overlay">
          <div className="patient-profile-card">
            <div className="profile-header">
              <div>
                <span className="patient-id-badge large">{selectedPatient.patientId}</span>
                <h2>{selectedPatient.name}</h2>
                <p>
                  {selectedPatient.age} Yrs • {selectedPatient.gender} • Phone: +91 {selectedPatient.phone}
                  {selectedPatient.registrationDate && (
                    <> • Reg: {String(selectedPatient.registrationDate).slice(0, 10)}</>
                  )}
                </p>
              </div>
              <div className="profile-header-actions">
                <button className="primary-btn" onClick={() => setShowAddVisitModal(true)}>
                  ➕ Record Visit
                </button>
                <button 
                  className="secondary-btn" 
                  style={{ background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" }}
                  onClick={() => handleDeletePatient(selectedPatient.patientId, selectedPatient.name)}
                  title="Permanently Delete Patient"
                >
                  🗑️ Delete
                </button>
                <button className="secondary-btn close-btn" onClick={() => setSelectedPatient(null)}>
                  ✕
                </button>
              </div>
            </div>

            <div className="profile-body">
              {/* Quick Patient Receipt & WhatsApp Toolbar */}
              <div className="quick-receipt-actions-box" style={{
                background: "linear-gradient(135deg, rgba(37, 211, 102, 0.12), rgba(2, 132, 199, 0.12))",
                border: "1px solid rgba(37, 211, 102, 0.35)",
                borderRadius: "10px",
                padding: "14px",
                marginBottom: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <strong style={{ color: "#25d366", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                    📄 Patient Official Receipt & Prescription Slip
                  </strong>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Patient: +91 {selectedPatient.phone}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    className="whatsapp-share-btn"
                    style={{ flex: "1 1 200px", minHeight: "42px", fontSize: "13px", padding: "10px 16px", borderRadius: "8px", fontWeight: "700" }}
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
                    style={{ flex: "1 1 130px", minHeight: "42px", fontSize: "13px", padding: "10px 14px", borderRadius: "8px" }}
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
                    style={{ flex: "1 1 120px", minHeight: "42px", fontSize: "13px", padding: "10px 14px", borderRadius: "8px", background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8", borderColor: "#0284c7" }}
                    onClick={() => handleCopyPhoneNumber(selectedPatient.phone)}
                    title="Copy Patient Phone Number"
                  >
                    📋 Copy Phone
                  </button>
                  <button
                    className="secondary-btn"
                    style={{ flex: "1 1 100px", minHeight: "42px", fontSize: "13px", padding: "10px 14px", borderRadius: "8px" }}
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

              <div className="demographics-grid">
                <div>
                  <label>Alternate Phone</label>
                  <span>{selectedPatient.altPhone ? `+91 ${selectedPatient.altPhone}` : "None"}</span>
                </div>
                <div>
                  <label>Address</label>
                  <span>{selectedPatient.address || "Vindhyachal, Mirzapur"}</span>
                </div>
                <div>
                  <label>Emergency Contact</label>
                  <span>{selectedPatient.emergencyContact || "None"}</span>
                </div>
                <div>
                  <label>Completed Visits</label>
                  <span className="visit-count-tag">{selectedPatient.totalVisits || (patientVisits.length > 0 ? patientVisits.length : 1)} Visits</span>
                </div>
              </div>

              {/* Patient Portal Account & Recovery PIN (Doctor Control) */}
              <div className="patient-portal-account-card" style={{
                background: "linear-gradient(135deg, rgba(8, 120, 201, 0.08), rgba(118, 184, 42, 0.08))",
                border: "1px solid rgba(8, 120, 201, 0.25)",
                borderRadius: "10px",
                padding: "14px 16px",
                marginTop: "16px",
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>🔐</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-primary, #0f172a)" }}>
                      Patient Portal Access & 4-Digit Recovery PIN
                    </strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: (patientAccountData?.status === "disabled") ? "#fee2e2" : "#dcfce7",
                      color: (patientAccountData?.status === "disabled") ? "#dc2626" : "#15803d"
                    }}>
                      Account: {patientAccountData?.status || "Active"}
                    </span>
                    <button
                      type="button"
                      className="secondary-btn"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                      onClick={() => handleTogglePatientAccountStatus(patientAccountData?.status || "active")}
                      disabled={accountActionLoading}
                    >
                      {patientAccountData?.status === "disabled" ? "Activate Account" : "Deactivate Account"}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", display: "block" }}>Universal Default Password</span>
                      <strong style={{
                        fontSize: "18px",
                        letterSpacing: "1.5px",
                        color: "#16a34a",
                        fontFamily: "monospace",
                        background: "rgba(34, 197, 94, 0.12)",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        display: "inline-block"
                      }}>
                        vindhya
                      </strong>
                      <span style={{ fontSize: "11px", marginLeft: "8px", color: "var(--text-muted, #64748b)" }}>
                        ({patientAccountData?.hasCustomPassword ? "Custom password active" : "Default active"})
                      </span>
                    </div>
                    <button
                      type="button"
                      className="secondary-btn"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                      onClick={handleDoctorResetToDefault}
                      disabled={accountActionLoading}
                      title="Reset patient's password back to universal default 'vindhya'"
                    >
                      🔄 Reset to 'vindhya'
                    </button>
                  </div>

                  <form
                    onSubmit={handleDoctorResetPatientPassword}
                    style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}
                  >
                    <input
                      type="text"
                      placeholder="Set custom password"
                      value={newPatientPassInput}
                      onChange={(e) => setNewPatientPassInput(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        fontSize: "12px",
                        borderRadius: "6px",
                        border: "1px solid var(--border, #cbd5e1)",
                        width: "170px"
                      }}
                    />
                    <button
                      type="submit"
                      className="primary-btn"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                      disabled={accountActionLoading || !newPatientPassInput}
                    >
                      Set Custom
                    </button>
                  </form>
                </div>

                {accountActionMsg.text && (
                  <div style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: accountActionMsg.isError ? "#dc2626" : "#16a34a"
                  }}>
                    {accountActionMsg.text}
                  </div>
                )}

                <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-muted, #64748b)" }}>
                  💡 Patient can log into their Patient Portal using Registered Mobile <strong>+91 {selectedPatient.phone}</strong> (or ID <strong>{selectedPatient.patientId}</strong>) and password <strong>vindhya</strong>.
                </div>
              </div>

              <h3 className="section-subtitle">Chronological Consultation & Visit Records</h3>
              <div className="visit-timeline">
                {patientVisits.map(v => (
                  <div className="timeline-visit-card" key={v.visitId}>
                    <div className="timeline-visit-head">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span className="visit-num-badge">Visit #{v.visitNumber}</span>
                        <span className="visit-date">{String(v.date || "").slice(0, 10)} {v.time ? `(${v.time})` : ""}</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          className="receipt-btn finalize-action-btn"
                          onClick={() => handleFinalizeAndIssueReceipt(selectedPatient, v)}
                        >
                          📄 Slip & WhatsApp PDF
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={() => handleDownloadPDF({ patient: selectedPatient, visit: v })}
                          style={{ padding: "6px 12px", minHeight: "36px", fontSize: "12px" }}
                          title="Instant Download PDF"
                        >
                          📥 Download
                        </button>
                      </div>
                    </div>
                    <div className="timeline-visit-details">
                      <p><strong>Reason:</strong> {v.reason}</p>
                      {v.complaint && <p><strong>Complaint:</strong> {v.complaint}</p>}
                      {v.diagnosis && <p><strong>Diagnosis:</strong> {v.diagnosis}</p>}
                      {v.treatmentNotes && <p><strong>Therapy Notes:</strong> {v.treatmentNotes}</p>}
                      {v.followUpDate && <p><strong>Next Follow-Up:</strong> {v.followUpDate}</p>}
                    </div>
                  </div>
                ))}
                {patientVisits.length === 0 && (
                  <div style={{ background: "var(--panel)", border: "1px dashed var(--line)", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 12px 0", color: "var(--muted)", fontSize: "13px" }}>Initial Registration Consultation Record</p>
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
                      <button
                        className="secondary-btn"
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
                          handleDownloadPDF({ patient: selectedPatient, visit: fallbackVisit });
                        }}
                        style={{ padding: "8px 14px", fontSize: "13px" }}
                      >
                        📥 Download PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD VISIT MODAL ================= */}
      {showAddVisitModal && selectedPatient && (
        <div className="add-visit-modal-overlay">
          <div className="add-visit-card">
            <h3>Record Follow-Up Visit for {selectedPatient.name}</h3>
            <p>Patient ID: <strong>{selectedPatient.patientId}</strong> | Allocating: <strong>Visit #{patientVisits.length + 1}</strong></p>

            <form onSubmit={handleAddVisit}>
              <div className="form-row-2">
                <label>
                  Visit Date *
                  <input
                    type="date"
                    required
                    value={newVisitForm.visitDate}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, visitDate: e.target.value })}
                  />
                </label>
                <label>
                  Visit Time
                  <input
                    type="text"
                    value={newVisitForm.visitTime}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, visitTime: e.target.value })}
                  />
                </label>
              </div>

              <label>
                Therapy / Visit Focus *
                <select
                  value={newVisitForm.reasonForVisit}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, reasonForVisit: e.target.value })}
                >
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
              </label>

              <label>
                Current Complaint & Response to Therapy
                <textarea
                  rows="2"
                  value={newVisitForm.complaint}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, complaint: e.target.value })}
                  placeholder="e.g. Pain score reduced from 8/10 to 3/10, walking posture improved."
                />
              </label>

              <label>
                Clinical Diagnosis / Findings
                <input
                  type="text"
                  value={newVisitForm.diagnosis}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, diagnosis: e.target.value })}
                  placeholder="e.g. Resolving lumbar strain"
                />
              </label>

              <label>
                Therapy Provided & Home Exercises
                <textarea
                  rows="2"
                  value={newVisitForm.treatmentNotes}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, treatmentNotes: e.target.value })}
                  placeholder="e.g. 20 mins lumbar mobilization, pelvic tilts, isometric core strengthening."
                />
              </label>

              <label>
                Next Recommended Follow-Up
                <input
                  type="date"
                  value={newVisitForm.followUpDate}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, followUpDate: e.target.value })}
                />
              </label>

              <div className="form-actions-bar">
                <button type="submit" className="primary-btn">Save Visit to Clinical History</button>
                <button type="button" className="secondary-btn" onClick={() => setShowAddVisitModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <button
                className="secondary-btn"
                style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8", borderColor: "#0284c7" }}
                onClick={() => handleCopyPhoneNumber(activeReceipt.patient.phone)}
                title="Copy Patient WhatsApp Phone Number"
              >
                📋 Copy Phone (+91 {activeReceipt.patient.phone})
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
                    src="/vindhya-receipt-logo.png"
                    alt="Vindhya Physio & Rehab Center"
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
                <span>Vindhya Physio & Rehab Center</span>
              </div>

              <div className="receipt-footer">
                <p>Thank you for choosing Vindhya Physio & Rehab Center</p>
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
          <div className="add-visit-card boxy-consult-card" style={{ maxWidth: "680px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span className="status-pill warning" style={{ marginBottom: "6px", display: "inline-block" }}>🩺 Doctor Consultation Room</span>
                <h3 style={{ margin: "4px 0", color: "#fff", fontSize: "18px" }}>
                  Clinical Diagnosis & Treatment: {activeConsultPatient.name}
                </h3>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                  Patient ID: <strong>{activeConsultPatient.patientId}</strong> • Phone: +91 {activeConsultPatient.phone}
                </p>
              </div>
              <button className="secondary-btn close-btn" onClick={() => setActiveConsultPatient(null)}>✕</button>
            </div>

            {/* Quick Patient Intake Summary Box */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "6px" }}>
                <div><span style={{ color: "#94a3b8" }}>Chief Problem:</span> <strong style={{ color: "#38bdf8" }}>{activeConsultPatient.firstVisitReason}</strong></div>
                <div><span style={{ color: "#94a3b8" }}>Duration / Frequency:</span> <strong style={{ color: "#f59e0b" }}>{activeConsultPatient.duration || "Initial"}</strong></div>
              </div>
              {activeConsultPatient.complaint && (
                <div style={{ color: "#cbd5e1", marginTop: "4px" }}>
                  <span style={{ color: "#94a3b8" }}>Reported Symptoms:</span> <em>"{activeConsultPatient.complaint}"</em>
                </div>
              )}
            </div>

            <form onSubmit={handleFinalizeConsultationSubmit}>
              <div className="form-row-2">
                <label>
                  Consultation Date *
                  <input
                    type="date"
                    required
                    value={consultForm.visitDate}
                    onChange={(e) => setConsultForm({ ...consultForm, visitDate: e.target.value })}
                  />
                </label>

                <label>
                  Consultation Time *
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
                <div className="form-row-1" style={{ marginTop: "6px" }}>
                  <label>
                    Enter Specific Consultation Time *
                    <input
                      type="text"
                      required
                      value={consultForm.visitTime}
                      onChange={(e) => setConsultForm({ ...consultForm, visitTime: e.target.value })}
                      placeholder="e.g. 03:15 PM"
                    />
                  </label>
                </div>
              )}

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
                  <label style={{ margin: 0, fontWeight: "700", color: "#f1f5f9" }}>
                    Final Clinical Diagnosis & Assessment *
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
                      background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                      color: "#ffffff",
                      border: "1px solid #a78bfa",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
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
                  placeholder="e.g. Lumbar Disc Herniation (L4-L5) with Right Sciatica & Muscle Spasm"
                />
              </div>

              <div style={{ marginTop: "14px", marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", color: "#f1f5f9" }}>
                  Therapy & Treatment Administered Today *
                </label>
                <textarea
                  rows="3"
                  required
                  value={consultForm.treatmentNotes}
                  onChange={(e) => setConsultForm({ ...consultForm, treatmentNotes: e.target.value })}
                  placeholder="e.g. IFT + Ultrasonic therapy for 15 mins. Manual spinal decompression + Isometric core stabilization."
                  style={{ display: "block", width: "100%", minHeight: "85px", boxSizing: "border-box" }}
                />
              </div>

              {/* Fee Entry with Quick Presets */}
              <div style={{ marginTop: "16px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "8px", padding: "14px", clear: "both" }}>
                <label style={{ margin: "0 0 6px 0", color: "#6ee7b7", fontWeight: "700", display: "block" }}>
                  Consultation & Therapy Fee (₹) *
                </label>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                  {["300", "500", "700", "1000", "1200"].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setConsultForm({ ...consultForm, fee: amt })}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        border: consultForm.fee === amt ? "2px solid #10b981" : "1px solid rgba(255,255,255,0.15)",
                        background: consultForm.fee === amt ? "#10b981" : "rgba(255,255,255,0.05)",
                        color: "#fff"
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <div className="phone-prefix-input" style={{ maxWidth: "200px" }}>
                  <span>₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={consultForm.fee}
                    onChange={(e) => setConsultForm({ ...consultForm, fee: e.target.value })}
                    placeholder="500"
                  />
                </div>
              </div>

              {/* Follow-up Section (Optional) */}
              <div style={{ marginTop: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ margin: 0, color: "#94a3b8", fontWeight: "700" }}>
                    🗓️ Next Follow-Up Session <span style={{ color: "#f59e0b", fontSize: "12px" }}>(Optional - Leave blank if only today's session completed)</span>
                  </label>
                  {consultForm.followUpDate && (
                    <button
                      type="button"
                      onClick={() => setConsultForm({ ...consultForm, followUpDate: "", followUpTime: "" })}
                      style={{ background: "none", border: "none", color: "#f87171", fontSize: "12px", cursor: "pointer", textDecoration: "underline" }}
                    >
                      Clear / No Follow-up
                    </button>
                  )}
                </div>
                <div className="form-row-2">
                  <label>
                    Follow-Up Date
                    <input
                      type="date"
                      value={consultForm.followUpDate}
                      onChange={(e) => setConsultForm({ ...consultForm, followUpDate: e.target.value })}
                    />
                  </label>
                  <label>
                    Follow-Up Time
                    <select
                      value={consultForm.followUpTime || "10:30 AM"}
                      onChange={(e) => setConsultForm({ ...consultForm, followUpTime: e.target.value })}
                      disabled={!consultForm.followUpDate}
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

              <div className="form-actions-bar" style={{ marginTop: "20px" }}>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={consultLoading}
                  style={{ minHeight: "48px", fontSize: "14px", fontWeight: "700", width: "100%", background: "#10b981" }}
                >
                  {consultLoading ? "Finalizing Consultation..." : "⚡ Complete Consultation & Issue Official Receipt"}
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
