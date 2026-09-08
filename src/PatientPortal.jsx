import React, { useState, useEffect, useMemo } from "react";
import { patientApi } from "./apiService";
import { downloadReceiptPDF, cleanDateOnly } from "./receiptUtils";
import { CLINIC_LOGO_B64 } from "./pdfAssets";

export default function PatientPortal({ onClose, themeProps }) {
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

  // Login & Recovery Form State
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotForm, setForgotForm] = useState({ identifier: "", recoveryPin: "", newPassword: "" });
  const [forgotMsg, setForgotMsg] = useState({ text: "", isError: false });

  // Security & Password Change State
  const [showPin, setShowPin] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);
  const [changePassForm, setChangePassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changePassMsg, setChangePassMsg] = useState({ text: "", isError: false });

  // Selected receipt for digital preview modal
  const [previewReceipt, setPreviewReceipt] = useState(null);

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
            firstVisitDate: profileRes.patient?.registrationDate,
            lastVisitDate: recordsRes.visits?.[0]?.date || profileRes.patient?.registrationDate,
            daysInRecovery: 1,
            activeCondition: recordsRes.visits?.[0]?.diagnosis || profileRes.patient?.firstVisitReason || "Under Evaluation",
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
        setLoginError(res.error || "Login failed. Please check your Patient ID or Mobile number.");
      }
    } catch (err) {
      setLoginError("Login service currently unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotMsg({ text: "", isError: false });
    setLoading(true);
    try {
      const res = await patientApi.resetPasswordWithPin(
        forgotForm.identifier,
        forgotForm.recoveryPin,
        forgotForm.newPassword
      );
      if (res.ok) {
        setForgotMsg({ text: "✅ Password reset successfully! You can now log in.", isError: false });
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotMsg({ text: "", isError: false });
          setForgotForm({ identifier: "", recoveryPin: "", newPassword: "" });
        }, 2200);
      } else {
        setForgotMsg({ text: res.error || "Password reset failed.", isError: true });
      }
    } catch (err) {
      setForgotMsg({ text: "Could not reset password: " + err.message, isError: true });
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
  };

  const handleCopyPin = (pin) => {
    if (!pin) return;
    navigator.clipboard.writeText(String(pin));
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 3000);
  };

  // Helper: Build standard receipt object for PDF export from visit
  const makeReceiptObj = (v) => {
    if (v.receipt && v.receipt.patient && v.receipt.visit) {
      return v.receipt;
    }
    return {
      receiptNumber: `REC-${v.visitId || "01"}`,
      receiptDate: v.date || new Date().toISOString().slice(0, 10),
      fee: v.fee || 500,
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
        fee: v.fee || 500
      }
    };
  };

  // =========================================================================
  // VIEW A: PATIENT LOGIN & SELF-RECOVERY SCREEN
  // =========================================================================
  if (!patientToken || !patientProfile) {
    return (
      <div className="patient-portal-overlay">
        <div className="patient-login-modal">
          <div className="patient-login-header">
            <div className="patient-portal-badge">PATIENT RECOVERY PORTAL</div>
            {CLINIC_LOGO_B64 && (
              <img
                src={CLINIC_LOGO_B64}
                alt="Vindhya Physio & Rehab Center Logo"
                className="patient-portal-logo"
              />
            )}
            <h2>Vindhya Physio & Rehab Center</h2>
            <p className="subtext">Dr. Satyam Vishwakarma • Amravati Chauraha, Vindhyachal</p>
          </div>

          <div className="patient-login-card">
            <h3>Sign In to Your Health Portal</h3>
            <p className="login-desc">
              Access your visit history, official doctor receipts, treatment progress & home rehab plan.
            </p>

            {loginError && <div className="patient-alert error">{loginError}</div>}

            <form onSubmit={handleLogin} className="patient-login-form">
              <label>
                Patient ID or Registered Mobile
                <input
                  type="text"
                  required
                  placeholder="e.g. VPR-0001 or 9793093316"
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                  autoComplete="username"
                />
              </label>

              <label>
                Password or 4-Digit Recovery PIN
                <input
                  type="password"
                  required
                  placeholder="Enter password or your 4-digit PIN"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  autoComplete="current-password"
                />
              </label>

              <div className="login-help-row">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotMsg({ text: "", isError: false });
                  }}
                >
                  Forgot Password? (Use 4-Digit PIN)
                </button>
              </div>

              <button type="submit" className="patient-primary-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign In to Portal →"}
              </button>
            </form>

            <div className="patient-support-note">
              <span>💡 First time logging in?</span>
              <p>
                Use your <strong>Patient ID</strong> or <strong>Registered Mobile</strong>. Your initial default
                password is your <strong>4-digit Recovery PIN</strong> provided by the clinic reception.
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

        {/* Self-Reset Password Modal using 4-Digit PIN */}
        {showForgotModal && (
          <div className="patient-submodal-overlay">
            <div className="patient-submodal-card">
              <div className="submodal-head">
                <h3>Self-Reset Password with PIN</h3>
                <button className="submodal-close" onClick={() => setShowForgotModal(false)}>✕</button>
              </div>
              <p className="submodal-desc">
                No OTP or SMS needed! Enter your <strong>Patient ID / Mobile</strong> along with your unique <strong>4-digit Recovery PIN</strong>.
              </p>

              {forgotMsg.text && (
                <div className={`patient-alert ${forgotMsg.isError ? "error" : "success"}`}>
                  {forgotMsg.text}
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="patient-login-form">
                <label>
                  Patient ID or Registered Mobile
                  <input
                    type="text"
                    required
                    placeholder="e.g. VPR-0001 or 9793093316"
                    value={forgotForm.identifier}
                    onChange={(e) => setForgotForm({ ...forgotForm, identifier: e.target.value })}
                  />
                </label>

                <label>
                  4-Digit Recovery PIN
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="e.g. 4829"
                    value={forgotForm.recoveryPin}
                    onChange={(e) => setForgotForm({ ...forgotForm, recoveryPin: e.target.value })}
                  />
                </label>

                <label>
                  New Password (min 4 characters)
                  <input
                    type="password"
                    minLength={4}
                    required
                    placeholder="Enter your new password"
                    value={forgotForm.newPassword}
                    onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                  />
                </label>

                <div className="submodal-actions">
                  <button type="button" className="patient-secondary-btn" onClick={() => setShowForgotModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="patient-primary-btn" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password & Login"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW B: PATIENT PORTAL DASHBOARD & SECTIONS
  // =========================================================================
  const patientFirstName = (patientProfile.name || "Patient").split(" ")[0];
  const totalVisitsCount = recordsData.stats.totalVisits || recordsData.visits.length || 1;
  const latestVisit = recordsData.visits[0] || null;

  return (
    <div className="patient-portal-root">
      {/* Top Clinic Header */}
      <header className="patient-header">
        <div className="header-left">
          {CLINIC_LOGO_B64 && (
            <img
              src={CLINIC_LOGO_B64}
              alt="Vindhya Physio & Rehab Center Logo"
              className="portal-nav-logo"
            />
          )}
          <div className="portal-clinic-meta">
            <h1>Vindhya Physio & Rehab Center</h1>
            <span className="portal-badge-pill">PATIENT RECOVERY PORTAL</span>
          </div>
        </div>

        <div className="header-right">
          <div className="patient-user-chip">
            <span className="avatar-circle">👤</span>
            <div className="user-text">
              <span className="user-name">{patientProfile.name}</span>
              <span className="user-id">{patientProfile.patientId}</span>
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
          {recordsData.appointments.length > 0 && (
            <span className="tab-bubble">{recordsData.appointments.length}</span>
          )}
        </button>

        <button
          className={`nav-tab ${activeTab === "visits" ? "active" : ""}`}
          onClick={() => setActiveTab("visits")}
        >
          <span className="tab-icon">🩺</span>
          <span className="tab-label">My Visits</span>
          <span className="tab-bubble">{recordsData.visits.length}</span>
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
          <span className="tab-label">Profile & PIN</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="patient-main-container">
        {/* ================================================================= */}
        {/* TAB 1: DASHBOARD */}
        {/* ================================================================= */}
        {activeTab === "dashboard" && (
          <div className="tab-pane dashboard-pane">
            {/* Welcoming Greeting Header */}
            <div className="welcome-banner">
              <div className="welcome-text">
                <h2>Hello, {patientFirstName} 👋</h2>
                <p className="welcome-subtitle">
                  Welcome to your personalized recovery portal. Dr. Satyam Vishwakarma and our team are dedicated to restoring your mobility, strength, and pain-free living.
                </p>
              </div>
              <div className="patient-quick-badge">
                <span className="badge-title">PATIENT ID</span>
                <span className="badge-value">{patientProfile.patientId}</span>
              </div>
            </div>

            {/* Recovery Journey Highlights Grid */}
            <div className="journey-stats-grid">
              <div className="journey-card highlight-card">
                <span className="card-icon">🩺</span>
                <div className="card-info">
                  <span className="card-label">Visits Completed</span>
                  <strong className="card-value">{totalVisitsCount}</strong>
                  <span className="card-subtext">Clinical consultations & therapy</span>
                </div>
              </div>

              <div className="journey-card">
                <span className="card-icon">⚡</span>
                <div className="card-info">
                  <span className="card-label">Active Condition</span>
                  <strong className="card-value condition-text">
                    {recordsData.stats.activeCondition || "Under Assessment"}
                  </strong>
                  <span className="card-subtext">Primary rehabilitation focus</span>
                </div>
              </div>

              <div className="journey-card">
                <span className="card-icon">🗓️</span>
                <div className="card-info">
                  <span className="card-label">Days in Care</span>
                  <strong className="card-value">{recordsData.stats.daysInRecovery} Days</strong>
                  <span className="card-subtext">
                    Since {cleanDateOnly(recordsData.stats.firstVisitDate || patientProfile.registrationDate)}
                  </span>
                </div>
              </div>

              <div className="journey-card accent-card">
                <span className="card-icon">🔔</span>
                <div className="card-info">
                  <span className="card-label">Next Follow-Up</span>
                  <strong className="card-value follow-text">
                    {recordsData.stats.nextFollowUp || "As Advised / SOS"}
                  </strong>
                  <span className="card-subtext">Dr. Satyam Vishwakarma</span>
                </div>
              </div>
            </div>

            {/* Next Appointment & Action Card */}
            <div className="dashboard-feature-card">
              <div className="feature-head">
                <div className="feature-title-row">
                  <span className="pulse-dot"></span>
                  <h3>Next Care Step & Clinic Appointment</h3>
                </div>
                <span className="feature-badge">Active Care</span>
              </div>

              <div className="feature-body">
                <div className="doctor-profile-strip">
                  <div className="doctor-badge-avatar">🩺</div>
                  <div className="doctor-meta">
                    <strong>Dr. Satyam Vishwakarma</strong>
                    <span>Consultant Physiotherapist • Vindhya Physio & Rehab Center</span>
                    <small>Amravati Chauraha, Vindhyachal, Mirzapur, U.P.</small>
                  </div>
                </div>

                <div className="appointment-details-box">
                  <div className="detail-item">
                    <span className="label">Recommended Follow-up Date</span>
                    <strong className="value">
                      {recordsData.stats.nextFollowUp || "Flexible / Continue Home Rehab Protocol"}
                    </strong>
                  </div>
                  <div className="detail-item">
                    <span className="label">Clinic Timing</span>
                    <strong className="value">10:00 AM – 02:00 PM & 04:00 PM – 08:00 PM</strong>
                  </div>
                </div>

                <div className="feature-actions">
                  <a
                    href="https://wa.me/918382024264?text=Hello%20Dr.%20Satyam,%20I%20am%20patient%20"
                    target="_blank"
                    rel="noreferrer"
                    className="action-btn wa"
                  >
                    💬 Message Doctor on WhatsApp
                  </a>
                  <a href="tel:+919793093316" className="action-btn call">
                    📞 Call Reception (+91 9793093316)
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="shortcuts-section">
              <h3>Quick Actions & Portal Shortcuts</h3>
              <div className="shortcuts-grid">
                <button className="shortcut-box" onClick={() => setActiveTab("visits")}>
                  <span className="shortcut-icon">🩺</span>
                  <strong>View All Visits</strong>
                  <span>History & treatment progress</span>
                </button>

                <button className="shortcut-box" onClick={() => setActiveTab("receipts")}>
                  <span className="shortcut-icon">🧾</span>
                  <strong>Official Receipts</strong>
                  <span>Download consultation slips</span>
                </button>

                <button className="shortcut-box" onClick={() => setActiveTab("treatment")}>
                  <span className="shortcut-icon">📋</span>
                  <strong>Treatment Notes</strong>
                  <span>Diagnosis & doctor advice</span>
                </button>

                <button className="shortcut-box" onClick={() => setActiveTab("exercises")}>
                  <span className="shortcut-icon">🏃</span>
                  <strong>Home Exercises</strong>
                  <span>Daily rehabilitation guide</span>
                </button>

                <button className="shortcut-box" onClick={() => setActiveTab("security")}>
                  <span className="shortcut-icon">🔐</span>
                  <strong>Account & 4-Digit PIN</strong>
                  <span>View PIN or change password</span>
                </button>

                <a
                  href="https://maps.google.com/?q=Amravati+Chauraha+Vindhyachal+Mirzapur"
                  target="_blank"
                  rel="noreferrer"
                  className="shortcut-box"
                >
                  <span className="shortcut-icon">📍</span>
                  <strong>Clinic Location</strong>
                  <span>Directions to Vindhyachal center</span>
                </a>
              </div>
            </div>

            {/* Recent Visits Timeline (Preview) */}
            <div className="recent-visits-section">
              <div className="section-header-flex">
                <h3>Recent Visit History</h3>
                <button className="view-all-link" onClick={() => setActiveTab("visits")}>
                  View All ({recordsData.visits.length}) →
                </button>
              </div>

              {recordsData.visits.length === 0 ? (
                <div className="empty-state-box">
                  <span>🩺</span>
                  <p>Your visit history will appear here following your consultation.</p>
                </div>
              ) : (
                <div className="timeline-cards-list">
                  {recordsData.visits.slice(0, 3).map((v) => {
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
                            <span className="item-label">Diagnosis / Assessment:</span>
                            <strong className="item-value">{v.diagnosis || "Under Evaluation"}</strong>
                          </div>
                          {v.complaint && (
                            <div className="row-item">
                              <span className="item-label">Chief Complaint:</span>
                              <span className="item-value">{v.complaint}</span>
                            </div>
                          )}
                          {v.treatmentNotes && (
                            <div className="row-item">
                              <span className="item-label">Treatment & Plan:</span>
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
                <h3>Need to schedule your next session?</h3>
                <p>
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
              <h3>Appointment History & Booking Enquiries ({recordsData.appointments.length})</h3>
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
                        <p><strong>Preferred Date:</strong> {appt.appointmentDate || cleanDateOnly(appt.date)}</p>
                        <p><strong>Condition:</strong> {appt.painArea || "Physiotherapy Consultation"}</p>
                        {appt.concern && <p><strong>Notes:</strong> {appt.concern}</p>}
                        <small>Submitted on {cleanDateOnly(appt.date)} at {appt.time || ""}</small>
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
              <div className="visits-full-list">
                {recordsData.visits.map((v) => {
                  const receiptObj = makeReceiptObj(v);
                  return (
                    <div className="visit-detailed-card" key={v.visitId}>
                      <div className="detailed-card-header">
                        <div className="badge-row">
                          <span className="visit-num-tag">Visit #{v.visitNumber || 1}</span>
                          <span className="visit-status-tag">{v.status || "Completed"}</span>
                        </div>
                        <div className="date-meta">
                          <strong>{cleanDateOnly(v.date)}</strong>
                          <span>{v.time || ""}</span>
                        </div>
                      </div>

                      <div className="detailed-card-body">
                        <div className="info-block">
                          <label>Clinical Diagnosis / Assessment</label>
                          <div className="diagnosis-highlight">
                            {v.diagnosis || "Initial Clinical Evaluation"}
                          </div>
                        </div>

                        {v.complaint && (
                          <div className="info-block">
                            <label>Patient Chief Complaint</label>
                            <p>{v.complaint}</p>
                          </div>
                        )}

                        {v.treatmentNotes && (
                          <div className="info-block">
                            <label>Treatment Delivered & Rehabilitation Protocol</label>
                            <p>{v.treatmentNotes}</p>
                          </div>
                        )}

                        <div className="info-row-split">
                          <div className="split-item">
                            <label>Consulting Doctor</label>
                            <strong>{v.doctor || "Dr. Satyam Vishwakarma"}</strong>
                          </div>
                          <div className="split-item">
                            <label>Next Follow-Up</label>
                            <strong>{v.followUpDate || "As needed / SOS"}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="detailed-card-actions">
                        <button
                          className="patient-primary-btn outline"
                          onClick={() => downloadReceiptPDF(receiptObj)}
                        >
                          📥 Download Official PDF Receipt
                        </button>
                        <button
                          className="patient-secondary-btn"
                          onClick={() => setPreviewReceipt(receiptObj)}
                        >
                          👁️ View Digital Slip
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
                        <span className="receipt-badge">OFFICIAL SLIP</span>
                        <span className="receipt-no">{receiptObj.receiptNumber}</span>
                      </div>

                      <div className="receipt-card-center">
                        <div className="amount-display">
                          <span className="currency">₹</span>
                          <strong className="amount">{receiptObj.fee || 500}</strong>
                        </div>
                        <span className="payment-mode">Paid via {receiptObj.paymentMode || "Cash / UPI"}</span>
                      </div>

                      <div className="receipt-card-meta">
                        <p><strong>Visit:</strong> Visit #{v.visitNumber || 1}</p>
                        <p><strong>Date:</strong> {cleanDateOnly(v.date)}</p>
                        <p><strong>Service:</strong> {v.reason || "Physiotherapy Assessment & Treatment"}</p>
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
        {/* TAB 7: PROFILE & SECURITY (RECOVERY PIN VIEW) */}
        {/* ================================================================= */}
        {activeTab === "security" && (
          <div className="tab-pane security-pane">
            <div className="section-title-box">
              <h2>My Profile & Security Settings</h2>
              <p>View your patient registration details, manage your 4-digit Recovery PIN, and change your portal password.</p>
            </div>

            {/* Profile Demographics */}
            <div className="security-card">
              <h3>Patient Personal Details</h3>
              <div className="patient-details-grid">
                <div className="detail-cell">
                  <label>Full Name</label>
                  <strong>{patientProfile.name}</strong>
                </div>
                <div className="detail-cell">
                  <label>Patient ID</label>
                  <strong className="accent-id">{patientProfile.patientId}</strong>
                </div>
                <div className="detail-cell">
                  <label>Age / Gender</label>
                  <span>{patientProfile.age} Yrs • {patientProfile.gender}</span>
                </div>
                <div className="detail-cell">
                  <label>Registered Mobile</label>
                  <span>+91 {patientProfile.phone}</span>
                </div>
                <div className="detail-cell">
                  <label>Alternate Mobile</label>
                  <span>{patientProfile.altPhone ? `+91 ${patientProfile.altPhone}` : "Not provided"}</span>
                </div>
                <div className="detail-cell">
                  <label>Clinic Address</label>
                  <span>{patientProfile.address || "Vindhyachal, Mirzapur"}</span>
                </div>
                <div className="detail-cell">
                  <label>Emergency Contact</label>
                  <span>{patientProfile.emergencyContact || "Not provided"}</span>
                </div>
                <div className="detail-cell">
                  <label>Registration Date</label>
                  <span>{cleanDateOnly(patientProfile.registrationDate)}</span>
                </div>
              </div>
            </div>

            {/* 4-Digit Recovery PIN Box */}
            <div className="security-card recovery-pin-box">
              <div className="pin-head">
                <div className="pin-title-row">
                  <span className="pin-icon">🔐</span>
                  <div>
                    <h3>Your 4-Digit Recovery PIN</h3>
                    <p>
                      Your personal master recovery key. Use this 4-digit PIN to reset your password or sign in from any new phone or device without waiting for SMS or OTP.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pin-display-area">
                <div className="pin-bubble">
                  {showPin ? (
                    <span className="pin-digits">{patientProfile.recoveryPin || "4829"}</span>
                  ) : (
                    <span className="pin-digits masked">••••</span>
                  )}
                </div>

                <div className="pin-button-group">
                  <button
                    className="patient-secondary-btn"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? "🙈 Hide PIN" : "👁️ Show PIN"}
                  </button>
                  <button
                    className="patient-primary-btn"
                    onClick={() => handleCopyPin(patientProfile.recoveryPin || "4829")}
                  >
                    {pinCopied ? "✅ Copied!" : "📋 Copy PIN"}
                  </button>
                </div>
              </div>

              <div className="pin-security-tips">
                <span>🛡️ Security Note:</span>
                <p>
                  Keep this 4-digit PIN confidential. If you ever forget your password, you can use this PIN on the login screen to set a new password instantly.
                </p>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="security-card">
              <h3>Change Portal Password</h3>
              <p className="card-subtext">
                Choose a memorable password for regular sign-in. Your 4-digit Recovery PIN will always remain available as a backup.
              </p>

              {changePassMsg.text && (
                <div className={`patient-alert ${changePassMsg.isError ? "error" : "success"}`}>
                  {changePassMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="patient-login-form">
                <label>
                  Current Password or 4-Digit PIN
                  <input
                    type="password"
                    required
                    placeholder="Enter current password or PIN"
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

                <button type="submit" className="patient-primary-btn" disabled={loading}>
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
                <small>This is an official clinic issued receipt generated by Vindhya Physio & Rehab Center.</small>
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
    </div>
  );
}
