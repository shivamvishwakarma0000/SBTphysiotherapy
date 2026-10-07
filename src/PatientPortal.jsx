import React, { useState, useEffect, useMemo } from "react";
import { patientApi } from "./apiService";
import { downloadReceiptPDF, cleanDateOnly, cleanTimeOnly } from "./receiptUtils";
import { CLINIC_LOGO_B64 } from "./pdfAssets";
import { PatientAvatar } from "./DoctorPortal";

export default function PatientPortal({ onClose, themeProps }) {
  const handleToggleTheme = () => {
    if (themeProps && typeof themeProps.toggleTheme === "function") {
      themeProps.toggleTheme();
    } else {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(next);
      try { localStorage.setItem("vindhy_physio_theme", next); } catch (e) {}
    }
  };

  const isDark = themeProps?.isDark !== undefined
    ? themeProps.isDark
    : (document.documentElement.getAttribute("data-theme") !== "light");
  const isDarkMode = isDark;

  const [patientToken, setPatientToken] = useState(() => patientApi.getStoredToken() || "");
  const [patientProfile, setPatientProfile] = useState(() => patientApi.getStoredPatient() || null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "appointments", "visits", "receipts", "treatment", "exercises", "security"
  const [recordsData, setRecordsData] = useState({
    visits: [],
    appointments: [],
    stats: {
      totalVisits: 0,
      firstVisitDate: "",
      lastVisitDate: "",
      daysInRecovery: 1,
      activeCondition: "Under Evaluation",
      nextFollowUp: null
    }
  });

  // Auth View Switcher: "login" or "register"
  const [authMode, setAuthMode] = useState("login");

  // Login Form State
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [loginError, setLoginError] = useState("");

  // Registration Form State
  const [registerForm, setRegisterForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    address: "Vindhyachal, Mirzapur",
    reasonForVisit: "Spine & Back Pain",
    password: ""
  });
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  // Password Change State
  const [changePassForm, setChangePassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changePassMsg, setChangePassMsg] = useState({ text: "", isError: false });

  // Selected receipt for digital preview modal
  const [previewReceipt, setPreviewReceipt] = useState(null);

  // Mobile App Navigation States
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Expanded Visit IDs accordion state
  const [expandedVisitIds, setExpandedVisitIds] = useState({});
  const toggleVisitExpand = (vId) => {
    setExpandedVisitIds((prev) => ({ ...prev, [vId]: !prev[vId] }));
  };

  // Phone hardware/browser back button navigation handling
  useEffect(() => {
    // Initial history anchor for patient portal
    if (!window.history.state || window.history.state.portal !== "patient") {
      window.history.replaceState({ portal: "patient", tab: "dashboard" }, "");
    }

    const handlePopState = (event) => {
      // 1. If receipt preview modal is open, close it
      if (previewReceipt) {
        setPreviewReceipt(null);
        return;
      }
      // 2. If contact modal is open, close it
      if (showContactModal) {
        setShowContactModal(false);
        return;
      }
      // 3. If more action sheet is open, close it
      if (showMoreSheet) {
        setShowMoreSheet(false);
        return;
      }
      // 4. If on another tab, return to dashboard
      if (activeTab !== "dashboard") {
        setActiveTab("dashboard");
        return;
      }
      // 5. If already on dashboard and onClose is passed, exit to site
      if (onClose) {
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [previewReceipt, showContactModal, showMoreSheet, activeTab, onClose]);

  // Tab navigation with history push
  const selectTab = (tab) => {
    if (tab !== activeTab) {
      window.history.pushState({ portal: "patient", tab }, "");
      setActiveTab(tab);
    }
    setShowMoreSheet(false);
  };

  const toggleMoreSheet = () => {
    if (!showMoreSheet) {
      window.history.pushState({ portal: "patient", sheet: "more" }, "");
      setShowMoreSheet(true);
    } else {
      setShowMoreSheet(false);
    }
  };

  const openContact = () => {
    window.history.pushState({ portal: "patient", modal: "contact" }, "");
    setShowContactModal(true);
  };

  const openReceiptPreview = (receipt) => {
    window.history.pushState({ portal: "patient", modal: "receipt" }, "");
    setPreviewReceipt(receipt);
  };

  // Auto load profile and records if logged in
  useEffect(() => {
    if (patientToken) {
      loadPatientData();
    }
  }, [patientToken]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const [profileRes, recordsRes] = await Promise.all([
        patientApi.getProfile(),
        patientApi.getRecords()
      ]);

      if (profileRes.ok && profileRes.patient) {
        setPatientProfile(profileRes.patient);
      }
      if (recordsRes.ok) {
        setRecordsData({
          visits: recordsRes.visits || [],
          appointments: recordsRes.appointments || [],
          stats: recordsRes.stats || {
            totalVisits: recordsRes.visits?.length || 1,
            firstVisitDate: profileRes?.patient?.registrationDate || recordsRes.patient?.registrationDate,
            lastVisitDate: recordsRes.visits?.[0]?.date || profileRes?.patient?.registrationDate,
            daysInRecovery: 1,
            activeCondition: recordsRes.visits?.[0]?.diagnosis || profileRes?.patient?.firstVisitReason || "Under Evaluation",
            nextFollowUp: recordsRes.visits?.[0]?.followUpDate || null
          }
        });
      }
    } catch (err) {
      console.error("Error loading patient records:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const res = await patientApi.login(loginForm.identifier, loginForm.password);
      if (res.ok) {
        setPatientToken(res.token);
        setPatientProfile(res.patient);
        setLoginForm({ identifier: "", password: "" });
      } else {
        setLoginError(res.error || "Login failed. Please check your Patient ID or Registered Mobile number.");
      }
    } catch (err) {
      setLoginError("Login service currently unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");

    const cleanPhone = registerForm.phone.replace(/\D/g, "");
    if (!registerForm.name.trim() || registerForm.name.trim().length < 2) {
      setRegisterError("Please enter your full patient name.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setRegisterError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!registerForm.age || Number(registerForm.age) < 1 || Number(registerForm.age) > 120) {
      setRegisterError("Please enter a valid patient age.");
      return;
    }

    setLoading(true);
    try {
      const res = await patientApi.register({
        ...registerForm,
        phone: cleanPhone
      });
      if (res.ok) {
        setPatientToken(res.token);
        setPatientProfile(res.patient);
        setRegisterSuccess("Registration successful! Entering your recovery portal...");
      } else {
        setRegisterError(res.error || "Registration failed. Please check your details.");
      }
    } catch (err) {
      setRegisterError("Registration service currently unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePassMsg({ text: "", isError: false });
    if (changePassForm.newPassword !== changePassForm.confirmPassword) {
      setChangePassMsg({ text: "New passwords do not match.", isError: true });
      return;
    }
    setLoading(true);
    try {
      const res = await patientApi.changePassword(
        changePassForm.currentPassword,
        changePassForm.newPassword
      );
      if (res.ok) {
        setChangePassMsg({ text: "✅ Password changed successfully!", isError: false });
        setChangePassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setChangePassMsg({ text: "", isError: false }), 4000);
      } else {
        setChangePassMsg({ text: res.error || "Could not change password.", isError: true });
      }
    } catch (err) {
      setChangePassMsg({ text: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    patientApi.logout();
    setPatientToken("");
    setPatientProfile(null);
    setActiveTab("dashboard");
    try {
      localStorage.removeItem("active_portal");
      if (window.location.hash === "#patient") {
        history.replaceState(null, "", window.location.pathname);
      }
    } catch (e) {}
    setShowMoreSheet(false);
    if (onClose) onClose();
  };

  // Helper: Build standard receipt object for PDF export from visit
  const makeReceiptObj = (v) => {
    if (v.receipt && v.receipt.patient && v.receipt.visit) {
      return v.receipt;
    }
    return {
      receiptNumber: `REC-${v.visitId || "01"}`,
      receiptDate: v.date || new Date().toISOString().slice(0, 10),
      fee: v.fee || 300,
      paymentMode: v.paymentMode || "Cash",
      patient: {
        patientId: patientProfile?.patientId || v.patientId,
        name: patientProfile?.name || v.patientName,
        phone: patientProfile?.phone || v.phone,
        age: patientProfile?.age || 35,
        gender: patientProfile?.gender || "Male",
        address: patientProfile?.address || "Vindhyachal, Mirzapur"
      },
      visit: {
        visitId: v.visitId,
        visitNumber: v.visitNumber || 1,
        date: v.date,
        time: v.time || "10:00 AM",
        reason: v.reason || "Consultation & Therapy",
        complaint: v.complaint || "Initial Assessment",
        diagnosis: v.diagnosis || "Under Evaluation",
        treatmentNotes: v.treatmentNotes || "Physiotherapy & Rehabilitation",
        followUpDate: v.followUpDate || "As advised",
        doctor: v.doctor || "Dr. Satyam Vishwakarma",
        fee: v.fee || 300
      }
    };
  };

  // =========================================================================
  // VIEW A: PATIENT AUTH (SIGN IN & SELF REGISTRATION)
  // =========================================================================
  if (!patientToken || !patientProfile) {
    return (
      <div className="patient-portal-overlay patient-login-forced-dark" data-theme="dark">
        <div className="patient-login-modal patient-login-card-dark" data-theme="dark">
          <div className="patient-login-header">
            <div className="patient-portal-badge">PATIENT RECOVERY PORTAL</div>
            <img
              src={CLINIC_LOGO_B64 || "/vindhy-receipt-logo.png"}
              alt="Vindhy Physio & Rehab Center Logo"
              className="patient-portal-logo prominent-landing-logo"
            />
            <h2>Vindhy Physio & Rehab Center</h2>
            <p className="subtext">Dr. Satyam Vishwakarma • Amravati Chauraha, Vindhyachal</p>
          </div>

          <div className="patient-login-card">
            <h3 style={{ marginTop: "6px", fontSize: "18px", fontWeight: "800", color: "var(--heading)" }}>
              🔐 Sign In to Your Health Portal
            </h3>

            {loginError && <div className="patient-alert error">{loginError}</div>}

            <form onSubmit={handleLogin} className="patient-login-form">
              <label>
                Patient ID or Registered Mobile (10 Digits)
                <input
                  type="text"
                  required
                  placeholder="e.g. 8858496345 or VPR-0001"
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                  autoComplete="username"
                />
              </label>

              <label>
                Password (Default is \x27vindhy\x27)
                <input
                  type="password"
                  required
                  placeholder="Enter password (default: vindhy)"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  autoComplete="current-password"
                />
              </label>

              <button type="submit" className="patient-primary-btn" disabled={loading} style={{ marginTop: "6px" }}>
                {loading ? "Signing in..." : "Sign In to Portal →"}
              </button>
            </form>

            <div className="patient-support-note">
              <span>💡 First time here or newly registered?</span>
              <p>
                Use your <strong>10-digit Registered Mobile Number</strong> or <strong>Patient ID</strong>.<br />
                Your universal clinic password is <strong>vindhy</strong>.
              </p>
              <div className="helpline-chips">
                <a href="tel:+919793093316" className="help-chip">📞 Call: +91 9793093316</a>
                <a href="https://wa.me/918382024264" target="_blank" rel="noreferrer" className="help-chip wa">💬 WhatsApp Helpline</a>
              </div>
            </div>
          </div>

          <div className="patient-login-footer">
            <button className="patient-secondary-btn" onClick={onClose}>
              ← Back to Clinic Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: PATIENT PORTAL DASHBOARD & SECTIONS
  // =========================================================================
  const patientDisplayName = patientProfile?.name || patientProfile?.patientName || "Patient";
  const patientFirstName = patientDisplayName.split(" ")[0];
  const totalVisitsCount = recordsData?.stats?.totalVisits || recordsData?.visits?.length || 1;
  const latestVisit = recordsData?.visits?.[0] || null;

  return (
    <div className="patient-portal-root">
      {/* Top Clinic Header */}
      <header className="patient-header">
        <div className="header-left">
          {CLINIC_LOGO_B64 && (
            <img
              src={CLINIC_LOGO_B64}
              alt="Vindhy Physio & Rehab Center Logo"
              className="portal-nav-logo"
            />
          )}
          <div className="portal-clinic-meta">
            <h1>Vindhy Physio & Rehab Center</h1>
            <span className="portal-badge-pill">PATIENT RECOVERY PORTAL</span>
          </div>
        </div>

        <div className="header-right">
          <div className="patient-user-chip">
            <span className="avatar-circle">👤</span>
            <div className="user-text">
              <span className="user-name">{patientFirstName}</span>
              <span className="user-id">{patientProfile?.patientId || "VPR"}</span>
            </div>
          </div>

          <button className="portal-exit-btn" onClick={handleLogout} title="Sign Out">
            <span className="btn-icon">🚪</span>
            <span className="btn-label">Sign Out</span>
          </button>
          <button className="portal-close-btn" onClick={onClose} title="Close to Website">
            ✕
          </button>
        </div>
      </header>

      {/* Navigation Bar (Desktop Top Tabs & Mobile Sticky Bottom Bar) */}
      <nav className="patient-navbar">
        <button
          className={`nav-tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Dashboard</span>
        </button>

        <button
          className={`nav-tab ${activeTab === "appointments" ? "active" : ""}`}
          onClick={() => setActiveTab("appointments")}
        >
          <span className="tab-icon">📅</span>
          <span className="tab-label">Appointments</span>
          {recordsData?.appointments?.length > 0 && (
            <span className="tab-bubble">{recordsData.appointments.length}</span>
          )}
        </button>

        <button
          className={`nav-tab ${activeTab === "visits" ? "active" : ""}`}
          onClick={() => setActiveTab("visits")}
        >
          <span className="tab-icon">🩺</span>
          <span className="tab-label">My Visits</span>
          <span className="tab-bubble">{recordsData?.visits?.length || 0}</span>
        </button>

        <button
          className={`nav-tab ${activeTab === "receipts" ? "active" : ""}`}
          onClick={() => setActiveTab("receipts")}
        >
          <span className="tab-icon">🧾</span>
          <span className="tab-label">Receipts</span>
        </button>

        <button
          className={`nav-tab ${activeTab === "treatment" ? "active" : ""}`}
          onClick={() => setActiveTab("treatment")}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-label">Treatment</span>
        </button>

        <button
          className={`nav-tab ${activeTab === "exercises" ? "active" : ""}`}
          onClick={() => setActiveTab("exercises")}
        >
          <span className="tab-icon">🏃</span>
          <span className="tab-label">Exercises</span>
        </button>

        <button
          className={`nav-tab ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <span className="tab-icon">🔐</span>
          <span className="tab-label">Profile & Password</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="patient-main-container">
        {/* ================================================================= */}
        {/* TAB 1: DASHBOARD */}
        {/* ========================        {/* ================================================================= */}
        {/* TAB 1: DASHBOARD (Mobile Native App 6-Box Layout) */}
        {/* ================================================================= */}
        {activeTab === "dashboard" && (
          <div className="tab-pane dashboard-pane mobile-app-home-view">
            {/* 1. Dynamic Greeting & Patient Identity (Matching Image 3 Reference) */}
            {/* 1. Dynamic Greeting & Patient Identity (Matching Image 2 Reference) */}
            <div className="mobile-app-greeting-card">
              <div className="mobile-hero-brand">
                {CLINIC_LOGO_B64 && (
                  <img
                    src={CLINIC_LOGO_B64}
                    alt="Vindhy Physio & Rehab Center"
                    className="mobile-hero-logo"
                  />
                )}
              </div>

              <div className="greeting-text-col">
                <span className="greeting-salutation">👋 Hello, {patientFirstName}</span>
                <h2 className="greeting-headline" style={{ color: "#ffffff", margin: "4px 0", fontSize: "22px", fontWeight: "800", textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>Take Charge of Your Recovery!</h2>

                <div className="patient-hero-id-badge">
                  <span className="id-sub-label">PATIENT ID</span>
                  <span className="id-main-code">{patientProfile?.patientId || "VPR-2026-1007"}</span>
                </div>
              </div>
            </div>

            {/* 2. Desktop Only: Status / Next Appointment Highlight */}
            <div className="app-status-highlight-card desktop-only-widget">
              {recordsData?.appointments?.length > 0 ? (
                <div className="status-highlight-body">
                  <div className="status-badge-row">
                    <span className="status-indicator-dot green"></span>
                    <span className="status-tag-text">NEXT APPOINTMENT</span>
                  </div>
                  <div className="status-highlight-content">
                    <h4>{cleanDateOnly(recordsData.appointments[0].date)} • {cleanTimeOnly(recordsData.appointments[0].time)}</h4>
                    <p>{recordsData.appointments[0].reason || "Physiotherapy & Rehabilitation Session"}</p>
                  </div>
                  <button className="status-action-btn" onClick={() => selectTab("appointments")}>
                    View Appointment →
                  </button>
                </div>
              ) : latestVisit ? (
                <div className="status-highlight-body">
                  <div className="status-badge-row">
                    <span className="status-indicator-dot blue"></span>
                    <span className="status-tag-text">RECENT VISIT</span>
                    <span className="status-date-sub">{cleanDateOnly(latestVisit.date)}</span>
                  </div>
                  <div className="status-highlight-content">
                    <h4>{latestVisit.diagnosis || "Active Clinical Rehabilitation"}</h4>
                    <p>✓ {latestVisit.status || "Completed"} • Follow-up: {latestVisit.followUpDate || "As advised"}</p>
                  </div>
                  <button className="status-action-btn" onClick={() => selectTab("visits")}>
                    View Visit Details →
                  </button>
                </div>
              ) : (
                <div className="status-highlight-body">
                  <div className="status-badge-row">
                    <span className="status-indicator-dot green"></span>
                    <span className="status-tag-text">CARE STATUS</span>
                  </div>
                  <div className="status-highlight-content">
                    <h4>Active Clinic Rehabilitation</h4>
                    <p>Consultant: Dr. Satyam Vishwakarma (B.P.T.)</p>
                  </div>
                  <button className="status-action-btn" onClick={openContact}>
                    Contact Clinic →
                  </button>
                </div>
              )}
            </div>

            {/* 3. EXACTLY SIX PROMINENT FEATURE BOXES (2x3 Touch Grid Matching Image 3) */}
            <div className="mobile-app-grid-6">
              <button className="mobile-app-card" onClick={() => selectTab("appointments")}>
                <div className="card-icon-bubble blue">
                  <span>📅</span>
                </div>
                <strong className="card-title">My Appointments</strong>
                <span className="card-caption">
                  {recordsData?.appointments?.length > 0
                    ? `${recordsData.appointments.length} Scheduled`
                    : "View & manage"}
                </span>
              </button>

              <button className="mobile-app-card" onClick={() => selectTab("visits")}>
                <div className="card-icon-bubble green">
                  <span>📋</span>
                </div>
                <strong className="card-title">My Visits</strong>
                <span className="card-caption">
                  {recordsData?.visits?.length > 0
                    ? `${recordsData.visits.length} Completed`
                    : "Visit history"}
                </span>
              </button>

              <button className="mobile-app-card" onClick={() => selectTab("receipts")}>
                <div className="card-icon-bubble emerald">
                  <span>🧾</span>
                </div>
                <strong className="card-title">My Receipts</strong>
                <span className="card-caption">View receipts</span>
              </button>

              <button className="mobile-app-card" onClick={() => selectTab("exercises")}>
                <div className="card-icon-bubble cyan">
                  <span>🏃</span>
                </div>
                <strong className="card-title">My Exercises</strong>
                <span className="card-caption">Recovery exercises</span>
              </button>

              <button className="mobile-app-card" onClick={() => selectTab("security")}>
                <div className="card-icon-bubble purple">
                  <span>👤</span>
                </div>
                <strong className="card-title">My Profile</strong>
                <span className="card-caption">Personal details</span>
              </button>

              <button className="mobile-app-card" onClick={openContact}>
                <div className="card-icon-bubble green-phone">
                  <span>📞</span>
                </div>
                <strong className="card-title">Contact Clinic</strong>
                <span className="card-caption">Call & WhatsApp</span>
              </button>
            </div>

            {/* 4. Desktop Only: Recent Visits Timeline */}
            <div className="recent-visits-section compact-preview desktop-only-widget">
              <div className="section-header-flex">
                <h3>Recent Visit History</h3>
                <button className="view-all-link" onClick={() => setActiveTab("visits")}>
                  View All ({recordsData.visits.length}) →
                </button>
              </div>

              {recordsData.visits.length === 0 ? (
                <div className="empty-state-box">
                  <span>🩺</span>
                  <p>Your visit history will appear here following your clinic consultation.</p>
                </div>
              ) : (
                <div className="timeline-cards-list">
                  {recordsData.visits.slice(0, 2).map((v) => {
                    const receiptObj = makeReceiptObj(v);
                    return (
                      <div className="patient-visit-card" key={v.visitId}>
                        <div className="visit-card-head">
                          <div className="head-left">
                            <span className="visit-number-badge">Visit #{v.visitNumber || 1}</span>
                            <span className="visit-date-str">
                              {cleanDateOnly(v.date)} {v.time ? `• ${v.time}` : ""}
                            </span>
                          </div>
                          <button
                            className="receipt-download-btn-sm"
                            onClick={() => downloadReceiptPDF(receiptObj)}
                            title="Download PDF Receipt"
                          >
                            📥 PDF Receipt
                          </button>
                        </div>

                        <div className="visit-card-content">
                          <div className="row-item">
                            <span className="item-label">Diagnosis:</span>
                            <strong className="item-value">{v.diagnosis || "Under Evaluation"}</strong>
                          </div>
                          {v.treatmentNotes && (
                            <div className="row-item">
                              <span className="item-label">Treatment:</span>
                              <span className="item-value">{v.treatmentNotes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: APPOINTMENTS */}
        {/* ================================================================= */}
        {activeTab === "appointments" && (
          <div className="tab-pane appointments-pane">
            <div className="section-title-box">
              <h2>My Appointments & Bookings</h2>
              <p>Review scheduled clinic appointments and submit new appointment requests.</p>
            </div>

            <div className="appointment-booking-card">
              <div className="booking-info">
                <h3 className="appointment-schedule-title" style={{ color: "#0f172a" }}>Need to schedule your next session?</h3>
                <p style={{ color: "#334155" }}>
                  You can directly message Dr. Satyam Vishwakarma or clinic reception to reserve your preferred morning or evening physiotherapy slot.
                </p>
              </div>
              <div className="booking-actions">
                <a
                  href={`https://wa.me/918382024264?text=Hello%20Dr.%20Satyam,%20I%20am%20${encodeURIComponent(patientProfile.name)}%20(ID:%20${patientProfile.patientId}).%20I%20would%20like%20to%20schedule%20my%20next%20physiotherapy%20visit.`}
                  target="_blank"
                  rel="noreferrer"
                  className="patient-primary-btn"
                >
                  💬 Schedule via WhatsApp
                </a>
                <a href="tel:+919793093316" className="patient-secondary-btn">
                  📞 Call +91 9793093316
                </a>
              </div>
            </div>

            <div className="appointments-list-container">
              <h3 className="appointments-history-title" style={{ color: "#0f172a" }}>Appointment History & Booking Enquiries ({recordsData.appointments.length})</h3>
              {recordsData.appointments.length === 0 ? (
                <div className="empty-state-box">
                  <span>📅</span>
                  <p>No prior online booking requests on file. Your direct clinic visits are recorded under <strong>My Visits</strong>.</p>
                </div>
              ) : (
                <div className="appointments-grid">
                  {recordsData.appointments.map((appt) => (
                    <div className="appointment-card" key={appt.id}>
                      <div className="appt-head">
                        <span className="appt-id">{appt.id}</span>
                        <span className={`status-pill ${String(appt.status).toLowerCase()}`}>
                          {appt.status || "Confirmed"}
                        </span>
                      </div>
                      <div className="appt-body">
                        <p><strong>Preferred Date:</strong> {cleanDateOnly(appt.appointmentDate || appt.date)}</p>
                        <p><strong>Condition:</strong> {appt.painArea || "Physiotherapy Consultation"}</p>
                        {appt.concern && <p><strong>Notes:</strong> {appt.concern}</p>}
                        <small>Submitted on {cleanDateOnly(appt.date)} {cleanTimeOnly(appt.time) ? `at ${cleanTimeOnly(appt.time)}` : ""}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: MY VISITS */}
        {/* ================================================================= */}
        {activeTab === "visits" && (
          <div className="tab-pane visits-pane">
            <div className="section-title-box">
              <h2>Chronological Visit History ({recordsData.visits.length})</h2>
              <p>Complete record of your physical therapy sessions, clinical evaluations, and doctor recommendations.</p>
            </div>

            {recordsData.visits.length === 0 ? (
              <div className="empty-state-box">
                <span>🩺</span>
                <p>No clinic visits logged yet. Records are added in real-time during your consultation with Dr. Satyam Vishwakarma.</p>
              </div>
            ) : (
              <>
                {/* 1. Quick Select Visit Boxes (Visit 1, 2, 3...) */}
                <div style={{
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                  paddingBottom: "10px",
                  marginBottom: "14px",
                  WebkitOverflowScrolling: "touch"
                }}>
                  {recordsData.visits.map((v) => {
                    const isExp = !!expandedVisitIds[v.visitId];
                    return (
                      <button
                        key={v.visitId}
                        type="button"
                        onClick={() => toggleVisitExpand(v.visitId)}
                        style={{
                          flex: "0 0 auto",
                          padding: "8px 14px",
                          borderRadius: "10px",
                          border: isExp ? "2px solid #0284c7" : "1.5px solid #cbd5e1",
                          background: isExp ? "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)" : "#ffffff",
                          color: isExp ? "#0369a1" : "#334155",
                          fontWeight: "800",
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          boxShadow: isExp ? "0 4px 10px rgba(2, 132, 199, 0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <span style={{ color: isExp ? "#0284c7" : "#0f172a" }}>Visit #{v.visitNumber || 1}</span>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: isExp ? "#0369a1" : "#64748b" }}>
                          {cleanDateOnly(v.date)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Compact Expandable Visit Cards */}
                <div className="visits-full-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {recordsData.visits.map((v) => {
                    const receiptObj = makeReceiptObj(v);
                    const isExpanded = !!expandedVisitIds[v.visitId];
                    return (
                      <div
                        className="visit-detailed-card"
                        key={v.visitId}
                        style={{
                          background: "#ffffff",
                          border: isExpanded ? "1.5px solid #0284c7" : "1.5px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "12px 16px",
                          boxShadow: isExpanded ? "0 4px 14px rgba(2, 132, 199, 0.09)" : "0 1px 4px rgba(0,0,0,0.03)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div
                          className="detailed-card-header"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "8px",
                            cursor: "pointer"
                          }}
                          onClick={() => toggleVisitExpand(v.visitId)}
                          title="Click to view full clinical details"
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span className="visit-num-tag" style={{ background: "#0284c7", color: "#ffffff", padding: "4px 10px", borderRadius: "6px", fontWeight: "800", fontSize: "12.5px" }}>
                              Visit #{v.visitNumber || 1}
                            </span>
                            <span className="visit-date-meta" style={{ fontWeight: "700", color: "#0f172a", fontSize: "13.5px" }}>
                              📅 {cleanDateOnly(v.date)} {v.time ? `• 🕒 ${cleanTimeOnly(v.time)}` : ""}
                            </span>
                            {v.fee && (
                              <span style={{ fontWeight: "800", color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: "6px", fontSize: "12px" }}>
                                {String(v.fee).startsWith("₹") ? v.fee : `₹${v.fee}`}
                              </span>
                            )}
                            <span style={{ fontSize: "12px", color: isExpanded ? "#0284c7" : "#64748b", fontWeight: "700" }}>
                              {isExpanded ? "▲ Hide Details" : "▼ View Details"}
                            </span>
                          </div>

                          <div
                            className="detailed-card-actions-row"
                            style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="patient-secondary-btn"
                              style={{ padding: "6px 12px", fontSize: "12px", fontWeight: "700", borderRadius: "6px" }}
                              onClick={() => setPreviewReceipt(receiptObj)}
                            >
                              📄 Digital Slip
                            </button>
                            <button
                              className="patient-primary-btn outline"
                              style={{ padding: "6px 12px", fontSize: "12px", fontWeight: "700", borderRadius: "6px" }}
                              onClick={() => downloadReceiptPDF(receiptObj)}
                              title="Download PDF"
                            >
                              📥 Download PDF
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Details Content Inside the Box */}
                        {isExpanded && (
                          <div
                            className="detailed-card-body"
                            style={{
                              marginTop: "12px",
                              paddingTop: "12px",
                              borderTop: "1px dashed #cbd5e1",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              fontSize: "13.5px",
                              color: "#334155"
                            }}
                          >
                            <div className="info-block">
                              <strong style={{ color: "#0f172a", display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                🩺 Clinical Diagnosis / Assessment:
                              </strong>
                              <div className="diagnosis-highlight" style={{ marginTop: "2px", fontWeight: "700", color: "#0369a1" }}>
                                {v.diagnosis || "Initial Clinical Evaluation"}
                              </div>
                            </div>

                            {v.reason && (
                              <div className="info-block">
                                <strong style={{ color: "#0f172a", display: "block", fontSize: "12px" }}>Focus:</strong>
                                <p style={{ margin: "2px 0 0 0" }}>{v.reason}</p>
                              </div>
                            )}

                            {v.complaint && (
                              <div className="info-block">
                                <strong style={{ color: "#0f172a", display: "block", fontSize: "12px" }}>Patient Complaint:</strong>
                                <p style={{ margin: "2px 0 0 0" }}>{v.complaint}</p>
                              </div>
                            )}

                            {v.treatmentNotes && (
                              <div className="info-block">
                                <strong style={{ color: "#0f172a", display: "block", fontSize: "12px" }}>Therapy Delivered & Protocol:</strong>
                                <p style={{ margin: "2px 0 0 0", color: "#0284c7" }}>{v.treatmentNotes}</p>
                              </div>
                            )}

                            <div className="info-row-split" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
                              <div className="split-item">
                                <span style={{ fontSize: "11.5px", color: "#64748b" }}>Consulting Doctor: </span>
                                <strong>{v.doctor || "Dr. Satyam Vishwakarma"}</strong>
                              </div>
                              <div className="split-item">
                                <span style={{ fontSize: "11.5px", color: "#64748b" }}>Next Follow-Up: </span>
                                <strong style={{ color: "#16a34a" }}>{cleanDateOnly(v.followUpDate) || v.followUpDate || "As needed / SOS"}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: MY RECEIPTS */}
        {/* ================================================================= */}
        {activeTab === "receipts" && (
          <div className="tab-pane receipts-pane">
            <div className="section-title-box">
              <h2>Official Consultation & Fee Receipts</h2>
              <p>Download and print clinic-authenticated receipts featuring official registration, clinic header, and Dr. Satyam Vishwakarma's signature.</p>
            </div>

            {recordsData.visits.length === 0 ? (
              <div className="empty-state-box">
                <span>🧾</span>
                <p>No receipts available yet. When a visit is recorded, your official slip will be available here immediately.</p>
              </div>
            ) : (
              <div className="receipts-grid">
                {recordsData.visits.map((v) => {
                  const receiptObj = makeReceiptObj(v);
                  return (
                    <div className="receipt-summary-card" key={v.visitId}>
                      <div className="receipt-card-top">
                        <span className="receipt-badge">OFFICIAL CLINIC SLIP</span>
                        <span className="receipt-no">{receiptObj.receiptNumber}</span>
                      </div>

                      <div className="receipt-card-center">
                        <div className="amount-display">
                          <span className="currency">₹</span>
                          <strong className="amount">{receiptObj.fee || 300}</strong>
                        </div>
                        <span className="payment-mode">Paid via {receiptObj.paymentMode || "Cash"} • Status: Verified</span>
                      </div>

                      <div className="receipt-card-meta">
                        <div className="receipt-meta-row">
                          <span className="meta-label">Treatment:</span>
                          <span className="meta-val">{v.treatmentGiven || v.reason || "Physical Therapy & Rehabilitation"}</span>
                        </div>
                        <div className="receipt-meta-row">
                          <span className="meta-label">Visit & Date:</span>
                          <span className="meta-val">Visit #{v.visitNumber || 1} • {cleanDateOnly(v.date)}</span>
                        </div>
                        <div className="receipt-meta-row">
                          <span className="meta-label">Doctor:</span>
                          <span className="meta-val">Dr. Satyam Vishwakarma (B.P.T. - BHU)</span>
                        </div>
                        <div className="receipt-meta-row">
                          <span className="meta-label">Clinic:</span>
                          <span className="meta-val">Vindhy Physio & Rehab Center</span>
                        </div>
                      </div>

                      <div className="receipt-card-actions">
                        <button
                          className="patient-primary-btn"
                          onClick={() => downloadReceiptPDF(receiptObj)}
                        >
                          📥 Download PDF
                        </button>
                        <button
                          className="patient-secondary-btn"
                          onClick={() => setPreviewReceipt(receiptObj)}
                        >
                          👁️ View Slip
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: MY TREATMENT */}
        {/* ================================================================= */}
        {activeTab === "treatment" && (
          <div className="tab-pane treatment-pane">
            <div className="section-title-box">
              <h2>My Treatment & Care Summary</h2>
              <p>Overview of your diagnosis, therapy plan, and personalized medical guidance.</p>
            </div>

            <div className="treatment-overview-card">
              <div className="overview-header">
                <h3>Current Physical Rehabilitation Profile</h3>
                <span className="care-tag">Under Active Care</span>
              </div>

              <div className="overview-grid">
                <div className="grid-box">
                  <label>Primary Diagnosis</label>
                  <h4>{latestVisit?.diagnosis || patientProfile.firstVisitReason || "Under Comprehensive Evaluation"}</h4>
                </div>
                <div className="grid-box">
                  <label>Consulting Physiotherapist</label>
                  <h4>Dr. Satyam Vishwakarma (B.P.T.)</h4>
                </div>
                <div className="grid-box">
                  <label>Initial Assessment Date</label>
                  <h4>{cleanDateOnly(recordsData.stats.firstVisitDate || patientProfile.registrationDate)}</h4>
                </div>
                <div className="grid-box">
                  <label>Total Sessions Attended</label>
                  <h4>{totalVisitsCount} Clinical Sessions</h4>
                </div>
              </div>

              <div className="care-guidance-box">
                <h4>🩺 General Rehabilitation Guidelines & Precautions</h4>
                <ul className="guidance-list">
                  <li>
                    <strong>Consistency:</strong> Perform prescribed exercises at least 1–2 times daily as instructed by Dr. Satyam.
                  </li>
                  <li>
                    <strong>Pain Rule:</strong> If sharp or sudden shooting pain occurs during any movement, stop immediately and contact the clinic. Mild muscular stretching sensation is normal.
                  </li>
                  <li>
                    <strong>Ergonomics & Posture:</strong> Avoid prolonged sitting or slouching without lumbar support. Take short 2-minute posture breaks every 45 minutes.
                  </li>
                  <li>
                    <strong>Hydration & Recovery:</strong> Keep well-hydrated to aid muscle tissue recovery and reduce post-therapy stiffness.
                  </li>
                </ul>
              </div>

              <div className="treatment-contact-bar">
                <span>Questions about your care plan?</span>
                <a
                  href="https://wa.me/918382024264"
                  target="_blank"
                  rel="noreferrer"
                  className="patient-primary-btn"
                >
                  💬 Ask Dr. Satyam on WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: MY EXERCISES */}
        {/* ================================================================= */}
        {activeTab === "exercises" && (
          <div className="tab-pane exercises-pane">
            <div className="section-title-box">
              <h2>Home Rehabilitation Exercise Library</h2>
              <p>Physiotherapist-guided home exercise regimens to accelerate your mobility and recovery between clinic visits.</p>
            </div>

            <div className="exercises-grid">
              <div className="exercise-card">
                <div className="exercise-icon-header">
                  <span className="badge-ex">SPINE & CORE</span>
                  <span className="ex-icon">🧘</span>
                </div>
                <h3>Pelvic Tilts & Bridging</h3>
                <p className="ex-desc">
                  Strengthens the glutes, lower back, and core stabilizers while decompressing the lumbar vertebrae.
                </p>
                <div className="ex-protocol">
                  <span><strong>Sets:</strong> 2–3 Sets</span>
                  <span><strong>Reps:</strong> 10–12 Repetitions</span>
                  <span><strong>Hold:</strong> 5 Seconds Hold</span>
                </div>
                <div className="ex-tip">
                  💡 Keep your core engaged and avoid arching your neck while lifting the hips.
                </div>
              </div>

              <div className="exercise-card">
                <div className="exercise-icon-header">
                  <span className="badge-ex">NECK & SHOULDERS</span>
                  <span className="ex-icon">💆</span>
                </div>
                <h3>Cervical Retraction (Chin Tucks)</h3>
                <p className="ex-desc">
                  Corrects forward-head posture and relieves tension in the suboccipital and upper trapezius muscles.
                </p>
                <div className="ex-protocol">
                  <span><strong>Sets:</strong> 3 Sets</span>
                  <span><strong>Reps:</strong> 10 Repetitions</span>
                  <span><strong>Hold:</strong> 3 Seconds Hold</span>
                </div>
                <div className="ex-tip">
                  💡 Move your chin straight back as if making a double chin, keeping eyes level.
                </div>
              </div>

              <div className="exercise-card">
                <div className="exercise-icon-header">
                  <span className="badge-ex">KNEE & LOWER LIMB</span>
                  <span className="ex-icon">🦵</span>
                </div>
                <h3>Isometric Quadriceps Setting</h3>
                <p className="ex-desc">
                  Builds essential vastus medialis strength and knee joint stability without overloading cartilage.
                </p>
                <div className="ex-protocol">
                  <span><strong>Sets:</strong> 3 Sets</span>
                  <span><strong>Reps:</strong> 15 Repetitions</span>
                  <span><strong>Hold:</strong> 6 Seconds Hold</span>
                </div>
                <div className="ex-tip">
                  💡 Place a small rolled towel under your knee and press gently downwards into the bed.
                </div>
              </div>

              <div className="exercise-card">
                <div className="exercise-icon-header">
                  <span className="badge-ex">MOBILITY & FLEXIBILITY</span>
                  <span className="ex-icon">🤸</span>
                </div>
                <h3>Cat-Cow Spinal Mobilization</h3>
                <p className="ex-desc">
                  Promotes gentle spinal flexion and extension, lubricating facet joints and soothing muscle spasms.
                </p>
                <div className="ex-protocol">
                  <span><strong>Sets:</strong> 2 Sets</span>
                  <span><strong>Reps:</strong> 8–10 Cycles</span>
                  <span><strong>Pace:</strong> Slow & Controlled</span>
                </div>
                <div className="ex-tip">
                  💡 Coordinate with your breath: inhale as belly drops, exhale as spine rounds upward.
                </div>
              </div>
            </div>

            <div className="exercise-notice-box">
              <strong>⚠️ Important Exercise Safety Notice:</strong>
              <p>
                Perform only the exercises specifically prescribed for your condition by Dr. Satyam Vishwakarma during your clinic assessment. If you experience discomfort or dizziness, discontinue and message the clinic immediately.
              </p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 7: PROFILE & PASSWORD SETTINGS */}
        {/* ================================================================= */}
        {activeTab === "security" && (
          <div className="tab-pane security-pane">
            <div className="section-title-box" style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 4px 0" }}>My Profile & Password Settings</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>View your patient registration details and manage your portal login password.</p>
            </div>

            {/* 1. MASTER TOP HEADER BOX (Matching Image 5 Reference) */}
            <div className="profile-master-header-box" style={{
              background: "linear-gradient(135deg, #071927, #0B2A3D)",
              borderRadius: "16px",
              padding: "20px",
              color: "#ffffff",
              marginBottom: "16px",
              boxShadow: "0 6px 20px rgba(7, 25, 39, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: "18px",
              flexWrap: "wrap"
            }}>
              <PatientAvatar patient={patientProfile} size={76} />
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                  <span style={{
                    background: "rgba(16, 185, 129, 0.2)",
                    color: "#34d399",
                    border: "1px solid #059669",
                    fontWeight: "800",
                    fontSize: "12.5px",
                    padding: "3px 10px",
                    borderRadius: "6px"
                  }}>
                    {patientProfile?.patientId || "VPR-2026-1001"}
                  </span>
                  <span style={{
                    fontSize: "12px",
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    fontWeight: "700"
                  }}>
                    {patientProfile?.status || "Active"}
                  </span>
                </div>

                <h2 style={{ margin: "2px 0 6px 0", fontSize: "24px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.3px", wordBreak: "break-word" }}>
                  {patientProfile?.name || "Patient"}
                </h2>

                <div style={{ fontSize: "13.5px", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span>{patientProfile?.age || "--"} Yrs • {patientProfile?.gender || "Not specified"}</span>
                  <span>•</span>
                  <a
                    href={`tel:+91${patientProfile?.phone}`}
                    style={{ color: "#38bdf8", textDecoration: "none", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    📞 +91 {patientProfile?.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* 2. DEMOGRAPHICS DETAILS BOXES (Boxy Grid Aesthetic) */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
              marginBottom: "16px"
            }}>
              <div className="profile-detail-card" style={{ background: "var(--bg-card, #ffffff)", border: "1.5px solid var(--line, #e2e8f0)", borderRadius: "12px", padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                  📱 Alternate Mobile
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--heading, #0f172a)" }}>
                  {patientProfile?.altPhone ? `+91 ${patientProfile.altPhone}` : "Not provided"}
                </div>
              </div>

              <div className="profile-detail-card" style={{ background: "var(--bg-card, #ffffff)", border: "1.5px solid var(--line, #e2e8f0)", borderRadius: "12px", padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                  📍 Clinic / Home Address
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--heading, #0f172a)" }}>
                  {patientProfile?.address || "Vindhyachal, Mirzapur"}
                </div>
              </div>

              <div className="profile-detail-card" style={{ background: "var(--bg-card, #ffffff)", border: "1.5px solid var(--line, #e2e8f0)", borderRadius: "12px", padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                  🚨 Emergency Contact
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--heading, #0f172a)" }}>
                  {patientProfile?.emergencyContact || "Not provided"}
                </div>
              </div>

              <div className="profile-detail-card" style={{ background: "var(--bg-card, #ffffff)", border: "1.5px solid var(--line, #e2e8f0)", borderRadius: "12px", padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                  📅 Registration Date
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--heading, #0f172a)" }}>
                  {cleanDateOnly(patientProfile?.registrationDate)}
                </div>
              </div>
            </div>

            {/* 3. UNIVERSAL PASSWORD INFORMATION CARD */}
            <div className="security-card credentials-info-box" style={{ borderRadius: "14px", border: "1.5px solid var(--line, #e2e8f0)", padding: "18px 20px", marginBottom: "16px", background: "var(--bg-card, #ffffff)" }}>
              <div className="pin-head">
                <div className="pin-title-row">
                  <span className="pin-icon">🔑</span>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "var(--heading)" }}>Clinic Login Credentials</h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                      Your account was enrolled at Vindhy Physio & Rehab Center by Dr. Satyam Vishwakarma.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginTop: "14px" }}>
                <div style={{ background: "rgba(2, 132, 199, 0.05)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(2, 132, 199, 0.2)" }}>
                  <label style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "2px" }}>LOGIN ID</label>
                  <strong style={{ color: "#0284c7", fontSize: "14px" }}>+91 {patientProfile?.phone || ""} <small style={{ color: "var(--text-muted)", fontWeight: "normal" }}>({patientProfile?.patientId || "VPR"})</small></strong>
                </div>
                <div style={{ background: "rgba(22, 163, 74, 0.05)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(22, 163, 74, 0.2)" }}>
                  <label style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "2px" }}>INITIAL DEFAULT PASSWORD</label>
                  <strong style={{ fontFamily: "monospace", letterSpacing: "1px", color: "#16a34a", fontSize: "14px" }}>vindhy</strong>
                </div>
              </div>

              <div className="pin-security-tips" style={{ marginTop: "14px" }}>
                <span>🛡️ Security Tip:</span>
                <p>
                  The initial default password for all patients is <strong>vindhy</strong>. You can change your password below to your own private password anytime. If you ever forget it, the doctor can reset it back to default for you at the clinic.
                </p>
              </div>
            </div>

            {/* 4. CHANGE PASSWORD FORM */}
            <div className="security-card" style={{ borderRadius: "14px", border: "1.5px solid var(--line, #e2e8f0)", padding: "18px 20px", background: "var(--bg-card, #ffffff)" }}>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "var(--heading)" }}>Change Your Password</h3>
              <p className="card-subtext" style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
                Enter your current password (enter <strong>vindhy</strong> if this is your first time) and choose a new password.
              </p>

              {changePassMsg.text && (
                <div className={`patient-alert ${changePassMsg.isError ? "error" : "success"}`}>
                  {changePassMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="patient-login-form">
                <label>
                  Current Password
                  <input
                    type="password"
                    required
                    placeholder="Enter current password (default: vindhy)"
                    value={changePassForm.currentPassword}
                    onChange={(e) => setChangePassForm({ ...changePassForm, currentPassword: e.target.value })}
                  />
                </label>

                <div className="form-row-double">
                  <label>
                    New Password
                    <input
                      type="password"
                      required
                      minLength={4}
                      placeholder="Minimum 4 characters"
                      value={changePassForm.newPassword}
                      onChange={(e) => setChangePassForm({ ...changePassForm, newPassword: e.target.value })}
                    />
                  </label>

                  <label>
                    Confirm New Password
                    <input
                      type="password"
                      required
                      minLength={4}
                      placeholder="Re-enter new password"
                      value={changePassForm.confirmPassword}
                      onChange={(e) => setChangePassForm({ ...changePassForm, confirmPassword: e.target.value })}
                    />
                  </label>
                </div>

                <button type="submit" className="patient-primary-btn" disabled={loading} style={{ alignSelf: "flex-start", minWidth: "180px", marginTop: "8px" }}>
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Digital Receipt Preview Modal */}
      {previewReceipt && (
        <div className="patient-submodal-overlay" onClick={() => setPreviewReceipt(null)}>
          <div className="receipt-preview-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="preview-dialog-head">
              <h3>Official Clinic Receipt Slip</h3>
              <button className="submodal-close" onClick={() => setPreviewReceipt(null)}>✕</button>
            </div>

            <div className="digital-slip-sheet">
              <div className="slip-top-bar">
                <div>
                  <h4>VINDHYA PHYSIO & REHAB CENTER</h4>
                  <p>Amravati Chauraha, Vindhyachal, Mirzapur (U.P.)</p>
                  <p>Phone: +91 9793093316 | WhatsApp: +91 8382024264</p>
                </div>
                <div className="slip-doctor-right">
                  <strong>DR. SATYAM VISHWAKARMA</strong>
                  <p>Consultant Physiotherapist (B.P.T.)</p>
                  <small>Reg. No: PT-2024-VPRC</small>
                </div>
              </div>

              <div className="slip-meta-grid">
                <div>
                  <span className="lbl">Patient Name:</span>
                  <strong>{previewReceipt.patient?.name}</strong>
                </div>
                <div>
                  <span className="lbl">Patient ID:</span>
                  <strong>{previewReceipt.patient?.patientId}</strong>
                </div>
                <div>
                  <span className="lbl">Receipt No:</span>
                  <strong>{previewReceipt.receiptNumber}</strong>
                </div>
                <div>
                  <span className="lbl">Date:</span>
                  <strong>{cleanDateOnly(previewReceipt.receiptDate)}</strong>
                </div>
              </div>

              <div className="slip-treatment-details">
                <p><strong>Clinical Reason:</strong> {previewReceipt.visit?.reason || "Physiotherapy & Rehabilitation"}</p>
                <p><strong>Diagnosis:</strong> {previewReceipt.visit?.diagnosis || "Under Evaluation"}</p>
                <p><strong>Complaint:</strong> {previewReceipt.visit?.complaint || "None logged"}</p>
                <p><strong>Treatment Done:</strong> {previewReceipt.visit?.treatmentNotes || "Physical assessment & therapy"}</p>
                <p><strong>Next Follow-Up:</strong> {previewReceipt.visit?.followUpDate || "As advised"}</p>
              </div>

              <div className="slip-fee-box">
                <span>Total Consultation & Therapy Fee:</span>
                <strong>₹{previewReceipt.fee || 500} ({previewReceipt.paymentMode || "Paid via Cash / UPI"})</strong>
              </div>

              <div className="slip-footer">
                <small>This is an official clinic issued receipt generated by Vindhy Physio & Rehab Center.</small>
                <div className="slip-doc-sign">
                  <div className="sign-line"></div>
                  <strong>Authorized Signatory</strong>
                  <span>Dr. Satyam Vishwakarma</span>
                </div>
              </div>
            </div>

            <div className="preview-dialog-actions">
              <button
                className="patient-primary-btn"
                onClick={() => downloadReceiptPDF(previewReceipt)}
              >
                📥 Download Official PDF File
              </button>
              <button
                className="patient-secondary-btn"
                onClick={() => setPreviewReceipt(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* FIXED 4-ITEM MOBILE BOTTOM NAVIGATION */}
      {/* ================================================================= */}
      <nav className="mobile-bottom-nav-4" aria-label="Mobile Bottom Navigation">
        <button
          className={`nav-item-4 ${activeTab === "dashboard" && !showMoreSheet ? "active" : ""}`}
          onClick={() => { setActiveTab("dashboard"); setShowMoreSheet(false); }}
        >
          <span className="nav-icon-4">🏠</span>
          <span className="nav-label-4">Home</span>
        </button>

        <button
          className={`nav-item-4 ${activeTab === "appointments" && !showMoreSheet ? "active" : ""}`}
          onClick={() => { setActiveTab("appointments"); setShowMoreSheet(false); }}
        >
          <span className="nav-icon-4">📅</span>
          <span className="nav-label-4">Appointments</span>
          {recordsData?.appointments?.length > 0 && (
            <span className="bottom-nav-badge">{recordsData.appointments.length}</span>
          )}
        </button>

        <button
          className={`nav-item-4 ${activeTab === "visits" && !showMoreSheet ? "active" : ""}`}
          onClick={() => selectTab("visits")}
        >
          <span className="nav-icon-4">🩺</span>
          <span className="nav-label-4">Visits</span>
          {recordsData?.visits?.length > 0 && (
            <span className="bottom-nav-badge">{recordsData.visits.length}</span>
          )}
        </button>

        <button
          className={`nav-item-4 ${showMoreSheet ? "active" : ""}`}
          onClick={toggleMoreSheet}
        >
          <span className="nav-icon-4">☰</span>
          <span className="nav-label-4">More</span>
        </button>
      </nav>

      {/* ================================================================= */}
      {/* "MORE" SECONDARY ESSENTIAL FEATURES SHEET */}
      {/* ================================================================= */}
      {showMoreSheet && (
        <div className="app-more-sheet-overlay" onClick={() => setShowMoreSheet(false)}>
          <div className="app-more-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="more-sheet-handle"></div>
            <div className="more-sheet-head">
              <div>
                <h3>More Features & Settings</h3>
                <p className="more-sheet-sub">Essential recovery tools & security</p>
              </div>
              <button className="more-sheet-close" onClick={() => setShowMoreSheet(false)}>✕</button>
            </div>

            <div className="more-sheet-list">
              <button
                className="more-sheet-item"
                onClick={() => selectTab("treatment")}
              >
                <span className="more-item-icon blue">📋</span>
                <div className="more-item-text">
                  <strong>Treatment Plan & Clinical Diagnosis</strong>
                  <span>Doctor recommendations, diagnosis & staging</span>
                </div>
                <span className="more-arrow">›</span>
              </button>

              <button
                className="more-sheet-item"
                onClick={() => selectTab("security")}
              >
                <span className="more-item-icon purple">🔐</span>
                <div className="more-item-text">
                  <strong>Recovery PIN & Password</strong>
                  <span>View confidential recovery PIN or change password</span>
                </div>
                <span className="more-arrow">›</span>
              </button>

              <button
                className="more-sheet-item"
                onClick={() => { setShowMoreSheet(false); openContact(); }}
              >
                <span className="more-item-icon green-phone">📞</span>
                <div className="more-item-text">
                  <strong>Contact Clinic & Doctor</strong>
                  <span>WhatsApp direct message & reception phone</span>
                </div>
                <span className="more-arrow">›</span>
              </button>

              <button
                type="button"
                className="more-sheet-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreSheet(false);
                  try {
                    localStorage.removeItem("active_portal");
                    if (window.location.hash === "#patient") {
                      history.replaceState(null, "", window.location.pathname);
                    }
                  } catch (err) {}
                  if (onClose) onClose();
                }}
              >
                <span className="more-item-icon cyan">🚪</span>
                <div className="more-item-text">
                  <strong>Exit to Clinic Website</strong>
                  <span>Return to public clinic home page</span>
                </div>
                <span className="more-arrow">›</span>
              </button>

              {/* Styled Dedicated Logout Button */}
              <button
                type="button"
                className="more-sheet-logout-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreSheet(false);
                  handleLogout();
                }}
              >
                <span className="logout-icon">🔒</span>
                <span>Logout Patient Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* QUICK CONTACT CLINIC MODAL */}
      {/* ================================================================= */}
      {showContactModal && (
        <div className="patient-submodal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="patient-submodal-card" onClick={(e) => e.stopPropagation()}>
            <div className="submodal-head">
              <h3>📞 Contact Vindhy Physio Clinic</h3>
              <button className="submodal-close" onClick={() => setShowContactModal(false)}>✕</button>
            </div>
            <p style={{ margin: "8px 0 16px", color: "var(--text-secondary, #475569)", fontSize: "13px", lineHeight: "1.5" }}>
              Dr. Satyam Vishwakarma and our clinical care team are available in Mirzapur/Vindhyachal for clinical consultation and home care support.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a
                href={`https://wa.me/918382024264?text=Hello%20Dr.%20Satyam,%20I%20am%20${encodeURIComponent(patientProfile?.name || "Patient")}%20(ID:%20${patientProfile?.patientId || "VPR"}).%20I%20have%20an%20inquiry%20regarding%20my%20physiotherapy.`}
                target="_blank"
                rel="noreferrer"
                className="patient-primary-btn"
                style={{ background: "#25D366", color: "#fff", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <span>💬</span>
                <span>Message Doctor on WhatsApp</span>
              </a>
              <a
                href="tel:+919793093316"
                className="patient-secondary-btn"
                style={{ textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <span>📞</span>
                <span>Call Reception (+91 9793093316)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
