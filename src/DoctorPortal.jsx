import React, { useState, useEffect, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import { CLINIC_LOGO_B64, DOCTOR_SIGNATURE_B64 } from "./pdfAssets";
import { api, getWebhookUrl, setWebhookUrl, restoreFromGoogleSheets, syncToGoogleSheets } from "./apiService";

export default function DoctorPortal({ onClose }) {
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
  const [todayVisits, setTodayVisits] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVisits, setPatientVisits] = useState([]);

  // Modals & Consultation Flow
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [shareFeedback, setShareFeedback] = useState("");

  // Custom Webhook Settings State
  const [customWebhookInput, setCustomWebhookInput] = useState(() => getWebhookUrl());
  const [webhookSavedMsg, setWebhookSavedMsg] = useState("");

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
    reasonForVisit: "Spine & Back Pain",
    complaint: "",
    diagnosis: "",
    referredBy: "",
    visitDate: new Date().toISOString().slice(0, 10),
    visitTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    treatmentNotes: "Comprehensive physical evaluation, spinal/joint mobilization, and therapeutic exercise guidance.",
    followUpDate: "",
    status: "In Consultation"
  });
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  // Add Visit State (Step 2: Subsequent Consultation)
  const [newVisitForm, setNewVisitForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    reason: "Physiotherapy Follow-up Treatment",
    complaint: "",
    diagnosis: "",
    treatmentNotes: "Electrotherapy + manual decompression + targeted postural re-education.",
    followUpDate: "",
    status: "In Consultation"
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
    localStorage.removeItem("doctor_token");
    setDoctorInfo(null);
    setSelectedPatient(null);
    setActiveReceipt(null);
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

      openPatientProfile(data.patient.patientId);
      setActiveTab("patients");

      setNewPatientForm({
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        altPhone: "",
        address: "Vindhyachal, Mirzapur",
        dob: "",
        emergencyContact: "",
        reasonForVisit: "Spine & Back Pain",
        complaint: "",
        diagnosis: "",
        referredBy: "",
        visitDate: new Date().toISOString().slice(0, 10),
        visitTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        treatmentNotes: "Comprehensive physical evaluation, spinal/joint mobilization, and therapeutic exercise guidance.",
        followUpDate: "",
        status: "In Consultation"
      });
    } catch (err) {
      setEnrollError(err.message);
    } finally {
      setEnrollLoading(false);
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
      }
    } catch (err) {
      alert("Failed to load patient profile.");
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

  const [restoreLoading, setRestoreLoading] = useState(false);

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

  const buildReceiptPDF = (receipt) => {
    const { patient, visit } = receipt;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Dark Header Banner
    doc.setFillColor(7, 25, 39);
    doc.rect(0, 0, 210, 44, "F");

    // Clinic Official Logo (Rendered with natural 3.186:1 aspect ratio)
    try {
      if (CLINIC_LOGO_B64) {
        doc.addImage(CLINIC_LOGO_B64, "PNG", 14, 6, 58, 18.2);
      }
    } catch (err) {
      console.log("Could not render logo in PDF:", err);
    }

    // Emerald & Gold Accent Lines
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 44, 105, 2.5, "F");
    doc.setFillColor(234, 179, 8);
    doc.rect(105, 44, 105, 2.5, "F");

    // Address & Phone below logo on left (No duplicate title text to prevent collision)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(200, 220, 230);
    doc.text("Amravati Chauraha, Vindhyachal, Mirzapur (U.P.)", 14, 32);
    doc.text("Phone: +91 9793093316  |  WhatsApp: +91 8382024264", 14, 38);

    // Doctor Details on Top Right (Cleanly separated on the right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("DR. SATYAM VISHWAKARMA", 196, 16, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(180, 210, 220);
    doc.text("Consultant Physiotherapist", 196, 22, { align: "right" });
    doc.text("BPT, DPT, CCYP (BHU)", 196, 28, { align: "right" });
    doc.text("Regd. Clinical Practitioner", 196, 34, { align: "right" });

    // Document Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(7, 25, 39);
    doc.text("OFFICIAL PATIENT REGISTRATION & CONSULTATION RECEIPT", 105, 56, { align: "center" });

    // Summary Box
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(15, 62, 180, 16, 2, 2, "FD");

    doc.setFontSize(9.5);
    doc.setTextColor(7, 25, 39);
    doc.text(`Patient ID: ${patient.patientId}`, 22, 72);
    doc.text(`Visit No: #${visit.visitNumber || 1}`, 90, 72);
    doc.text(`Date & Time: ${visit.date} ${visit.time || ""}`, 140, 72);

    // Demographics Section Box
    doc.roundedRect(15, 86, 180, 130, 2, 2, "D");

    // Subsection 1: Patient Information
    doc.setFillColor(220, 240, 235);
    doc.rect(15, 86, 180, 7.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(10, 80, 60);
    doc.text("1. PATIENT DEMOGRAPHICS", 20, 91.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    doc.text("Full Name:", 20, 101);
    doc.setFont("helvetica", "bold");
    doc.text(patient.name, 60, 101);
    doc.setFont("helvetica", "normal");

    doc.text("Age / Gender:", 120, 101);
    doc.text(`${patient.age} Yrs / ${patient.gender}`, 155, 101);

    doc.text("Contact Phone:", 20, 109);
    doc.text(`+91 ${patient.phone}`, 60, 109);

    doc.text("Alternate Phone:", 120, 109);
    doc.text(patient.altPhone ? `+91 ${patient.altPhone}` : "N/A", 155, 109);

    doc.text("Address:", 20, 117);
    doc.text(patient.address || "Vindhyachal, Mirzapur", 60, 117);

    doc.text("Total Visits to Date:", 120, 117);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`${patient.totalVisits || 1} Completed Visit(s)`, 155, 117);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    // Subsection 2: Clinical Assessment & Prescription
    doc.setFillColor(220, 240, 235);
    doc.rect(15, 126, 180, 7.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(10, 80, 60);
    doc.text("2. CLINICAL ASSESSMENT & REHABILITATION RECORD", 20, 131.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    doc.text("Reason for Visit:", 20, 141);
    doc.setFont("helvetica", "bold");
    doc.text(visit.reason || "Physiotherapy Rehabilitation", 60, 141);
    doc.setFont("helvetica", "normal");

    doc.text("Reported Complaint:", 20, 149);
    doc.text(visit.complaint || "Pain / Mobility limitation", 60, 149);

    doc.text("Clinical Diagnosis:", 20, 157);
    doc.setFont("helvetica", "bold");
    doc.text(visit.diagnosis || "Under Active Physiotherapy Management", 60, 157);
    doc.setFont("helvetica", "normal");

    doc.text("Therapy Provided:", 20, 165);
    const splitNotes = doc.splitTextToSize(visit.treatmentNotes || "Mobilization, targeted stretches, strengthening exercises, and home care protocol.", 125);
    doc.text(splitNotes, 60, 165);

    const nextY = 165 + (splitNotes.length * 5.5);
    doc.text("Next Follow-up:", 20, nextY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(visit.followUpDate ? `${visit.followUpDate} (Regular Rehab Session)` : "As advised by Consultant Doctor", 60, nextY);

    // Doctor Official Signature & Sign-off Box
    try {
      if (DOCTOR_SIGNATURE_B64) {
        doc.addImage(DOCTOR_SIGNATURE_B64, "PNG", 146, 214, 23, 21);
      }
    } catch (err) {
      console.log("Could not render signature in PDF:", err);
    }

    doc.line(130, 236, 185, 236);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(7, 25, 39);
    doc.text("Dr. Satyam Vishwakarma", 157.5, 241, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Consultant Physiotherapist", 157.5, 245, { align: "center" });
    doc.text("Vindhya Physio & Rehab Center", 157.5, 249, { align: "center" });

    // Footer
    doc.setFillColor(7, 25, 39);
    doc.rect(0, 276, 210, 21, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Thank you for choosing Vindhya Physio & Rehab Center", 105, 283, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(180, 200, 210);
    doc.text("For appointments & medical inquiries: Call 9793093316 | WhatsApp: 8382024264 | Amravati Chauraha, Vindhyachal", 105, 289, { align: "center" });

    return doc;
  };

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

    // Clean, highly professional WhatsApp receipt message without misleading text
    const receiptSummary = 
`🏥 *VINDHYA PHYSIO & REHAB CENTER*
*Official Patient Consultation & Clinical Receipt*
--------------------------------------------
👤 *Patient Name:* ${patient.name}
🆔 *Patient ID:* ${patient.patientId}
📅 *Visit:* #${visit.visitNumber || 1} • ${visit.date} ${visit.time ? `(${visit.time})` : ""}
🩺 *Reason / Diagnosis:* ${visit.diagnosis || visit.reason || "Physiotherapy Rehabilitation"}
💊 *Treatment Done:* ${visit.treatmentNotes || "Comprehensive physical evaluation & exercise guidance"}
🗓️ *Next Follow-up:* ${visit.followUpDate ? visit.followUpDate : "As advised by Consultant Doctor"}
--------------------------------------------
👨‍⚕️ *Consultant:* Dr. Satyam Vishwakarma (BPT, DPT, CCYP - BHU)
📍 *Clinic Address:* Amravati Chauraha, Vindhyachal, Mirzapur (U.P.)
📞 *Helpline:* +91 9793093316 | WhatsApp: +91 8382024264
--------------------------------------------
📄 *Official Digital Clinical Receipt*
_(Saved in patient clinic records)_`;

    // 1. First, always trigger download of the official PDF document so doctor has the file ready
    try {
      doc.save(fileName);
    } catch (e) {
      console.log("PDF download fallback:", e);
    }

    // 2. Try Native Web Share API if device supports direct file sharing (iPhone/Android Share Sheet)
    try {
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf", lastModified: Date.now() });
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        setShareFeedback("📲 Opening WhatsApp share menu — tap WhatsApp to send the PDF file!");
        await navigator.share({
          files: [pdfFile],
          title: `Vindhya Physio Receipt - ${patient.name}`,
          text: receiptSummary
        });
        setShareFeedback(`✅ PDF receipt sent to ${patient.name} (+91 ${patient.phone})!`);
        return;
      }
    } catch (shareErr) {
      if (shareErr.name === "AbortError") return; // User cancelled
      console.log("Native share fallback to direct chat:", shareErr);
    }

    // 3. Direct WhatsApp Chat workflow:
    try {
      await navigator.clipboard.writeText(receiptSummary);
    } catch (e) {}

    setShareFeedback(`✅ "${fileName}" downloaded! In WhatsApp, tap 📎 (Attach Document) to send the PDF to ${patient.name}!`);

    // Open WhatsApp Chat with pre-filled message
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${patientPhone}&text=${encodeURIComponent(receiptSummary)}`;
    setTimeout(() => {
      window.open(whatsappUrl, "_blank");
    }, 300);
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
            <img src="/vindhya-logo-transparent.png" alt="Vindhya Physio & Rehab Center" className="login-logo-img" />
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
        <div className="doctor-nav-brand">
          <img src="/vindhya-logo-transparent.png" alt="Vindhya Physio & Rehab Center" className="doctor-nav-logo" />
          <div className="doctor-nav-title">
            <strong>DR. SATYAM VISHWAKARMA</strong>
            <span>Consultant Physiotherapist</span>
          </div>
        </div>

        <nav className="doctor-nav-tabs">
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
            📊 Dashboard
          </button>
          <button className={activeTab === "new-patient" ? "active" : ""} onClick={() => setActiveTab("new-patient")}>
            ➕ Intake / Register
          </button>
          <button className={activeTab === "patients" ? "active" : ""} onClick={() => { setActiveTab("patients"); fetchPatients(); }}>
            👥 Patient Directory
          </button>
          <button className={activeTab === "today" ? "active" : ""} onClick={() => { setActiveTab("today"); fetchTodayVisits(); }}>
            📅 Today's Visits
          </button>
          <button className={activeTab === "enquiries" ? "active" : ""} onClick={() => { setActiveTab("enquiries"); fetchEnquiries(); }}>
            📩 Online Bookings {stats.newEnquiriesCount > 0 && <span className="enq-badge">{stats.newEnquiriesCount}</span>}
          </button>
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
            ⚙️ Settings & Sync
          </button>
        </nav>

        <div className="doctor-nav-actions">
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
            Sheets: {syncLoading ? "Syncing..." : (getWebhookUrl() ? "Cloud Connected" : "Connect Cloud")}
          </button>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            Logout
          </button>
          <button className="close-portal-btn" onClick={onClose} title="Return to public website">
            ✕ Exit Portal
          </button>
        </div>
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
          <div className="dashboard-view">
            {!getWebhookUrl() && (
              <div style={{
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(2, 132, 199, 0.15))",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "28px" }}>☁️</span>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#f59e0b", fontSize: "15px", fontWeight: "700" }}>Enable Universal Multi-Device Cloud Sync</h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1" }}>
                      Paste your Google Sheets Webhook URL in Settings once to automatically keep all patient records permanently synchronized across your phone, tablet, and laptop!
                    </p>
                  </div>
                </div>
                <button className="primary-btn" onClick={() => setActiveTab("settings")} style={{ padding: "8px 18px", fontSize: "13px" }}>
                  ⚡ Connect Webhook
                </button>
              </div>
            )}

            <div className="dashboard-hero">
              <div>
                <h2>Clinical Operations Dashboard</h2>
                <p>Vindhya Physio & Rehab Center • Amravati Chauraha, Vindhyachal, Mirzapur</p>
              </div>
              <div className="hero-quick-buttons">
                <button className="primary-btn" onClick={() => setActiveTab("new-patient")}>
                  ➕ Intake New Patient
                </button>
                <button className="secondary-btn" onClick={() => { setActiveTab("enquiries"); fetchEnquiries(); }}>
                  📩 Website Bookings ({enquiries.length})
                </button>
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card" onClick={() => { setActiveTab("patients"); fetchPatients(); }}>
                <span className="metric-icon">👥</span>
                <div>
                  <h3>{stats.totalPatients}</h3>
                  <p>Total Registered Patients</p>
                </div>
              </div>

              <div className="metric-card" onClick={() => { setActiveTab("today"); fetchTodayVisits(); }}>
                <span className="metric-icon">📅</span>
                <div>
                  <h3>{stats.todayVisitsCount}</h3>
                  <p>Today's Visits</p>
                </div>
              </div>

              <div className="metric-card" onClick={() => { setActiveTab("enquiries"); fetchEnquiries(); }}>
                <span className="metric-icon">📩</span>
                <div>
                  <h3>{stats.totalEnquiriesCount || enquiries.length}</h3>
                  <p>Website Consult Bookings</p>
                </div>
              </div>

              <div className="metric-card">
                <span className="metric-icon">🩺</span>
                <div>
                  <h3>{stats.totalVisitsCount}</h3>
                  <p>Total Completed Visits</p>
                </div>
              </div>
            </div>

            <div className="dashboard-split">
              <div className="dash-panel">
                <div className="panel-header">
                  <h3>Recent Patients</h3>
                  <button className="text-link-btn" onClick={() => { setActiveTab("patients"); fetchPatients(); }}>View All</button>
                </div>
                <div className="table-responsive">
                  <table className="doctor-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Total Visits</th>
                        <th>Last Visit</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.slice(0, 5).map(p => (
                        <tr key={p.patientId}>
                          <td><span className="patient-id-badge">{p.patientId}</span></td>
                          <td><strong>{p.name}</strong> ({p.age}y/{p.gender[0]})</td>
                          <td>+91 {p.phone}</td>
                          <td><span className="visit-count-tag">{p.totalVisits} visits</span></td>
                          <td>{p.lastVisitDate}</td>
                          <td>
                            <button className="table-action-btn" onClick={() => openPatientProfile(p.patientId)}>Consult & Slip</button>
                          </td>
                        </tr>
                      ))}
                      {patients.length === 0 && (
                        <tr>
                          <td colSpan="6" className="empty-cell">No patients enrolled yet. Click "+ Intake New Patient" to start.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="dash-panel">
                <div className="panel-header">
                  <h3>Today's Patient Queue</h3>
                  <button className="text-link-btn" onClick={() => { setActiveTab("today"); fetchTodayVisits(); }}>View All</button>
                </div>
                <div className="today-visits-list">
                  {todayVisits.slice(0, 5).map(v => (
                    <div className="today-visit-item" key={v.visitId} onClick={() => openPatientProfile(v.patientId)}>
                      <div className="visit-time-box">{v.time || "Today"}</div>
                      <div className="visit-item-info">
                        <strong>{v.patientName}</strong> ({v.patientId})
                        <p>{v.reason} • Visit #{v.visitNumber}</p>
                      </div>
                      <span className={`visit-badge ${v.status === "Completed" ? "green" : "orange"}`}>
                        {v.status || "Completed"}
                      </span>
                    </div>
                  ))}
                  {todayVisits.length === 0 && (
                    <p className="empty-state">No visits recorded for today yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. NEW PATIENT INTAKE ================= */}
        {activeTab === "new-patient" && (
          <div className="enroll-view">
            <div className="section-header-row">
              <div>
                <h2>Step 1: Patient Intake & Registration</h2>
                <p>Register arriving patient details. You will conduct consultation, finalize diagnosis, and issue the discharge slip on exit.</p>
              </div>
            </div>

            {enrollError && <div className="auth-alert error">{enrollError}</div>}

            <form onSubmit={handleEnrollPatient} className="enroll-form-card">
              <h3 className="form-section-title">1. Patient Personal Demographics</h3>
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
                  Referred By (Doctor / Self / Friend)
                  <input
                    type="text"
                    value={newPatientForm.referredBy}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, referredBy: e.target.value })}
                    placeholder="e.g. Dr. Verma / Direct"
                  />
                </label>
              </div>

              <h3 className="form-section-title" style={{ marginTop: "24px" }}>2. Initial Complaint & Symptoms</h3>
              <div className="form-row-3">
                <label>
                  Visit Date *
                  <input
                    type="date"
                    required
                    value={newPatientForm.visitDate}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, visitDate: e.target.value })}
                  />
                </label>
                <label>
                  Visit Time
                  <input
                    type="text"
                    value={newPatientForm.visitTime}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, visitTime: e.target.value })}
                    placeholder="e.g. 10:30 AM"
                  />
                </label>
                <label>
                  Primary Reason for Visit *
                  <select
                    value={newPatientForm.reasonForVisit}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, reasonForVisit: e.target.value })}
                  >
                    <option value="Spine & Back Pain">Spine & Back Pain</option>
                    <option value="Cup Therapy">Cup Therapy / Cupping</option>
                    <option value="Neuro Rehabilitation">Neuro Rehabilitation</option>
                    <option value="Paralysis Rehabilitation">Paralysis Rehabilitation</option>
                    <option value="Stroke Recovery">Stroke Recovery</option>
                    <option value="CP (Child) Therapy">CP (Child) Therapy / Cerebral Palsy</option>
                    <option value="Sports Injury Rehab">Sports Injury Rehab</option>
                    <option value="Post-Surgical Rehab">Post-Surgical Rehab</option>
                    <option value="Knee & Joint Arthritis">Knee & Joint Arthritis</option>
                    <option value="Neck & Cervical Spondylosis">Neck & Cervical Spondylosis</option>
                    <option value="Frozen Shoulder">Frozen Shoulder</option>
                    <option value="General Physiotherapy">General Physiotherapy</option>
                  </select>
                </label>
              </div>

              <div className="form-row-2">
                <label>
                  Chief Complaints
                  <textarea
                    rows="2"
                    value={newPatientForm.complaint}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, complaint: e.target.value })}
                    placeholder="e.g. Lower back stiffness, radiating nerve pain in leg, difficulty walking."
                  />
                </label>
                <label>
                  Initial Clinical Diagnosis / Findings
                  <textarea
                    rows="2"
                    value={newPatientForm.diagnosis}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, diagnosis: e.target.value })}
                    placeholder="e.g. Lumbar Disc Bulge (L4-L5), Muscle Spasm, Sciatica"
                  />
                </label>
              </div>

              <div className="form-actions-bar">
                <button type="submit" className="primary-btn" disabled={enrollLoading}>
                  {enrollLoading ? "Registering Patient..." : "Register Patient & Open Consultation Room"}
                </button>
              </div>
            </form>
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

            <div className="table-responsive">
              <table className="doctor-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Patient Name</th>
                    <th>Age/Gender</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Primary Concern</th>
                    <th>Total Visits</th>
                    <th>Last Visit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.patientId}>
                      <td><span className="patient-id-badge">{p.patientId}</span></td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.age}y / {p.gender}</td>
                      <td>+91 {p.phone}</td>
                      <td>{p.address || "Vindhyachal"}</td>
                      <td>{p.firstVisitReason}</td>
                      <td><span className="visit-count-tag">{p.totalVisits} Visits</span></td>
                      <td>{p.lastVisitDate}</td>
                      <td className="action-buttons-cell">
                        <button className="table-action-btn primary-action" onClick={() => openPatientProfile(p.patientId)} title="Open Full Profile">
                          👤 Profile
                        </button>
                        <button 
                          className="table-action-btn" 
                          style={{ background: "#25d366", color: "#fff", marginLeft: "4px", padding: "5px 8px", fontSize: "11.5px", fontWeight: "700" }}
                          onClick={() => {
                            handleWhatsAppDirectShare({
                              patient: p,
                              visit: {
                                visitId: `VST-${p.patientId}-1`,
                                patientId: p.patientId,
                                patientName: p.name,
                                phone: p.phone,
                                visitNumber: 1,
                                date: p.registrationDate ? String(p.registrationDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
                                time: "10:00 AM",
                                reason: p.firstVisitReason || "Physiotherapy Rehabilitation",
                                complaint: p.firstVisitReason || "Consultation",
                                diagnosis: p.firstVisitReason || "Under Evaluation",
                                treatmentNotes: "Physical evaluation & physiotherapy management.",
                                followUpDate: "As advised by doctor",
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
                          className="table-action-btn" 
                          style={{ background: "#0284c7", color: "#fff", marginLeft: "4px", padding: "5px 8px", fontSize: "11.5px" }}
                          onClick={() => {
                            handleDownloadPDF({
                              patient: p,
                              visit: {
                                visitId: `VST-${p.patientId}-1`,
                                patientId: p.patientId,
                                patientName: p.name,
                                phone: p.phone,
                                visitNumber: 1,
                                date: p.registrationDate ? String(p.registrationDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
                                time: "10:00 AM",
                                reason: p.firstVisitReason || "Physiotherapy Rehabilitation",
                                complaint: p.firstVisitReason || "Consultation",
                                diagnosis: p.firstVisitReason || "Under Evaluation",
                                treatmentNotes: "Physical evaluation & physiotherapy management.",
                                followUpDate: "As advised by doctor",
                                status: "Completed",
                                doctor: "Dr. Satyam Vishwakarma"
                              }
                            });
                          }}
                          title="Download PDF Receipt"
                        >
                          📥 PDF
                        </button>
                        <button 
                          className="table-action-btn delete-action" 
                          style={{ background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5", marginLeft: "4px", padding: "5px 8px" }}
                          onClick={() => handleDeletePatient(p.patientId, p.name)}
                          title="Permanently delete patient record"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan="9" className="empty-cell">No matching patient records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                <p>All direct patient consultation requests submitted from the website form.</p>
              </div>
              <button className="secondary-btn" onClick={() => handleExportCSV("enquiries")}>
                📥 Export Enquiries (CSV)
              </button>
            </div>

            <div className="table-responsive">
              <table className="doctor-table">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Patient Name</th>
                    <th>Phone</th>
                    <th>Condition / Pain Area</th>
                    <th>Duration</th>
                    <th>Preferred Date</th>
                    <th>Symptoms & Message</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map(e => (
                    <tr key={e.id}>
                      <td><strong>{e.date}</strong><br /><small>{e.time}</small></td>
                      <td><strong>{e.name}</strong></td>
                      <td>
                        <a href={`tel:${e.phone}`} className="phone-link">+91 {e.phone}</a>
                      </td>
                      <td><span className="condition-tag">{e.painArea}</span></td>
                      <td>{e.duration}</td>
                      <td>{e.appointmentDate || "Flexible"}</td>
                      <td style={{ maxWidth: "240px" }}>{e.concern}</td>
                      <td>
                        <button
                          className="table-action-btn primary-action"
                          onClick={() => convertEnquiryToPatient(e)}
                        >
                          ➕ Enroll as Patient
                        </button>
                      </td>
                    </tr>
                  ))}
                  {enquiries.length === 0 && (
                    <tr>
                      <td colSpan="8" className="empty-cell">No online consultation requests yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 12px 0", color: "#94a3b8", fontSize: "13px" }}>Initial Registration Consultation Record</p>
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
            <div className="receipt-actions-toolbar">
              <button
                className="whatsapp-share-btn"
                onClick={() => handleWhatsAppDirectShare(activeReceipt)}
                title={`Send official PDF prescription & receipt to ${activeReceipt.patient.name} on WhatsApp`}
              >
                📲 Send PDF Receipt on WhatsApp (+91 {activeReceipt.patient.phone})
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
                    src="/vindhya-logo-transparent.png"
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
                  <p className="doctor-cred">BPT, DPT, CCYP (BHU)</p>
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

              <div className="receipt-section">
                <h4>1. Patient Demographics</h4>
                <div className="receipt-table-grid">
                  <div className="receipt-cell">
                    <span className="cell-label">Full Name:</span>
                    <strong className="cell-value highlight">{activeReceipt.patient.name}</strong>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Age / Gender:</span>
                    <span className="cell-value">{activeReceipt.patient.age} Yrs / {activeReceipt.patient.gender}</span>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Contact Phone:</span>
                    <span className="cell-value">+91 {activeReceipt.patient.phone}</span>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Alternate Phone:</span>
                    <span className="cell-value">{activeReceipt.patient.altPhone ? `+91 ${activeReceipt.patient.altPhone}` : "N/A"}</span>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Address:</span>
                    <span className="cell-value">{activeReceipt.patient.address || "Vindhyachal, Mirzapur"}</span>
                  </div>
                  <div className="receipt-cell">
                    <span className="cell-label">Total Visits to Date:</span>
                    <strong className="cell-value text-emerald">{activeReceipt.patient.totalVisits || 1} Completed Visit(s)</strong>
                  </div>
                </div>
              </div>

              <div className="receipt-section">
                <h4>2. Clinical Assessment & Rehabilitation Record</h4>
                <div className="receipt-table-grid">
                  <div className="receipt-cell wide-cell">
                    <span className="cell-label">Reason for Visit:</span>
                    <strong className="cell-value">{activeReceipt.visit.reason || "Physiotherapy Rehabilitation"}</strong>
                  </div>
                  <div className="receipt-cell wide-cell">
                    <span className="cell-label">Reported Complaint:</span>
                    <span className="cell-value">{activeReceipt.visit.complaint || "Physical pain / functional limitation"}</span>
                  </div>
                  <div className="receipt-cell wide-cell">
                    <span className="cell-label">Clinical Diagnosis:</span>
                    <strong className="cell-value">{activeReceipt.visit.diagnosis || "Under active physiotherapy management"}</strong>
                  </div>
                  <div className="receipt-cell wide-cell">
                    <span className="cell-label">Therapy Provided:</span>
                    <span className="cell-value">{activeReceipt.visit.treatmentNotes || "Mobilization, stretching, and guided exercise therapy."}</span>
                  </div>
                  <div className="receipt-cell wide-cell">
                    <span className="cell-label">Next Recommended Follow-Up:</span>
                    <strong className="cell-value text-emerald">
                      {activeReceipt.visit.followUpDate ? `${activeReceipt.visit.followUpDate} (Regular Rehab Session)` : "As advised by Consultant Doctor"}
                    </strong>
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
          </div>
        </div>
      )}
    </div>
  );
}
