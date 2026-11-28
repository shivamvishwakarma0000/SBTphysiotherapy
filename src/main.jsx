import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import DoctorPortal from "./DoctorPortal";
import PatientPortal from "./PatientPortal";
import ErrorBoundary from "./ErrorBoundary";
import { api } from "./apiService";
import { useTheme } from "./useTheme";
import ThemeToggle from "./ThemeToggle";
import AppUpdateNotifier from "./AppUpdateNotifier";
import ClinicLeafletMap, { CLINIC_SHARE_URL, CLINIC_EXACT_LOCATION } from "./ClinicLeafletMap";

const phonePrimary = "9793093316";
const phoneWhatsApp = "9793093316";
const clinicAddress = "Vindhy Physiotherapy & Rehab Center, Atal Chauraha (Amravati), Vindhyachal, Mirzapur, Uttar Pradesh 231001";

const navItems = [
  ["Home", "#home"],
  ["Clinical Services", "#treatments"],
  ["Body Map", "#body-map"],
  ["Rehab Pathways", "#programs"],
  ["Patient FAQs & Guide", "#faqs"],
  ["Consultation", "#consultation"],
  ["Contact", "#contact"]
];

const stats = [
  ["DPT, BPT", "Clinical Diagnostics & Therapeutics"],
  ["CCYP BHU", "Yoga & Movement Biomechanics"],
  ["Neuro + Sports", "Advanced Clinical Protocols"]
];

const treatments = [
  [
    "spine",
    "Spine & Back Pain",
    "Slip disc, sciatica, cervical spondylosis, postural correction, spinal decompression, and chronic ache relief.",
    "/back.jpg",
    "Most Requested"
  ],
  [
    "cup",
    "Cup Therapy / Cupping",
    "Deep myofascial decompression, micro-circulation boost, localized pain release, and muscle toxin clearance.",
    "/cupping.png",
    "Specialized"
  ],
  [
    "neuro",
    "Neuro Rehabilitation",
    "Parkinson's, ataxia, balance retraining, multiple sclerosis, and motor pathway re-education.",
    "/stroke.jpg",
    "Clinical"
  ],
  [
    "paralysis",
    "Paralysis Rehabilitation",
    "Neuro-muscular stimulation, gait retraining, functional independence, and muscle activation.",
    "/stroke.jpg",
    "High Priority"
  ],
  [
    "stroke",
    "Stroke Recovery",
    "Post-stroke hemiplegia recovery, spasticity control, upper/lower limb coordination, and mobility restoration.",
    "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1000&q=80",
    "Specialized"
  ],
  [
    "child",
    "CP (Child) Therapy",
    "Cerebral palsy neuro-developmental therapy, pediatric motor milestone training, and pediatric posture support.",
    "/cp-child.png",
    "Pediatric"
  ],
  [
    "runner",
    "Sports Injury Rehab",
    "Sprains, ACL/meniscus care, tendon tears, runner's knee, agility conditioning, and return-to-sport planning.",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80",
    "Sports Track"
  ],
  [
    "postop",
    "Post-Surgical Rehab",
    "Knee & hip replacement, spine surgery recovery, fracture mobility restoration, and progressive strengthening.",
    "/postop.jpg",
    "Orthopedic"
  ]
];

const bodyProblems = [
  ["neck", "Neck & Cervical", "Cervical spondylosis, tech neck, headaches, arm numbness", "01", "/neck.jpg"],
  ["shoulder", "Shoulder & Rotator Cuff", "Frozen shoulder, rotator cuff tear, bursitis, impingement", "02", "/shoulder.jpg"],
  ["elbow", "Elbow & Forearm", "Tennis elbow, golfer's elbow, tendon strain, grip weakness", "03", "/elbow.jpg"],
  ["hand", "Wrist & Hand", "Carpal tunnel, tendonitis, post-fracture stiffness", "04", "/hand.jpg"],
  ["upperback", "Upper Back & Thoracic", "Thoracic stiffness, posture fatigue, rib strain", "05", "/back.jpg"],
  ["lowerback", "Lower Back & Sciatica", "L4-L5 disc bulge, slip disc, severe muscle spasms, sciatica", "06", "/lowerback.jpg"],
  ["hip", "Hip & Pelvis", "Hip arthritis, bursitis, gait imbalance, mobility loss", "07", "/hip.jpg"],
  ["knee", "Knee & ACL", "ACL rehab, meniscus tear, osteoarthritis, patella tracking", "08", "/knee.jpg"],
  ["ankle", "Ankle & Foot", "Ankle sprain, plantar fasciitis, heel pain, Achilles strain", "09", "/ankle.jpg"],
  ["trauma", "Sports Trauma", "Acute muscle tears, ligament overload, performance recovery", "10", "/trauma.jpg"],
  ["stroke", "Paralysis & Neuro Care", "Neuro-muscular retraining, gait therapy, functional recovery", "11", "/stroke.jpg"],
  ["postop", "Post-Surgery Recovery", "Knee & hip replacement, fracture rehab, mobility restoration", "12", "/postop.jpg"]
];

const programs = [
  ["Clinical Assessment", "In-depth diagnostic movement screen, pain history, joint biomechanics, and recovery mapping."],
  ["Personalized Therapy", "A staged rehabilitation blueprint progressing from acute pain relief to strength, mobility, and confidence."],
  ["Recovery & Progress", "Targeted corrective exercises, ergonomic posture strategy, and home exercise routines to prevent relapse."]
];

const timeline = [
  ["Clinical Foundation & Training", "Advanced diagnostic expertise and clinical therapeutics strengthened through DPT & BPT degrees."],
  ["BHU CCYP Depth", "Combining evidence-based physiotherapy with CCYP depth from Banaras Hindu University for holistic recovery."],
  ["Specialized Clinical Focus", "Tailored treatment tracks for spine care, cupping therapy, neuro & paralysis rehab, and pediatric care."],
  ["Patient-Centered Results", "Serving patients across Vindhyachal, Mirzapur, and Eastern U.P. with compassionate, evidence-based care."]
];

const testimonials = [
  ["Amit Singh", "L4-L5 Disc Bulge & Sciatica", "Dr. Satyam's diagnosis and therapy protocol helped eliminate severe back and nerve pain within weeks. Walking is completely painless now.", "5"],
  ["Neha Verma", "Post-Surgical Knee Rehab", "Every session had clear goals and progress. My joint mobility and leg strength recovered much faster than expected.", "5"],
  ["Rahul Mishra", "Frozen Shoulder & Sports Injury", "The combination of mobilization, cupping therapy, and strength exercises restored 100% range of motion in my shoulder.", "5"],
  ["Priya Tiwari", "Paralysis & Stroke Recovery", "The patient-focused neuro-rehabilitation and gait training gave my father his independence and confidence back.", "5"],
  ["Vikram Srivastava", "Cervical Spondylosis & Neck Pain", "Tech neck and radiating arm pain disappeared completely after 6 therapy sessions. Highly recommended!", "5"]
];

function ClinicLogo() {
  return (
    <div className="clinic-logo-wrap">
      <img
        src="/vindhy-logo.png"
        alt="Vindhy Physiotherapy & Rehab Center"
        className="clinic-logo-img"
        loading="eager"
      />
    </div>
  );
}

function LineIcon({ type = "runner" }) {
  return (
    <svg className="line-icon" viewBox="0 0 64 64" aria-hidden="true">
      {type === "spine" && <><path d="M32 8c8 7 8 14 1 21 8 5 10 14 0 27" /><path d="M23 14h14M22 24h16M25 34h18M24 44h15M27 54h10" /></>}
      {type === "cup" && <><path d="M18 20a14 14 0 0 1 28 0v18a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V20z" /><circle cx="32" cy="12" r="4" /><path d="M22 42v6M42 42v6M26 28h12M28 34h8" /></>}
      {type === "runner" && <><circle cx="40" cy="12" r="5" /><path d="M34 22l-10 12 13 5 7 14" /><path d="M29 38L17 53M39 25l10 8 8-3M28 22l-10 2" /></>}
      {type === "neuro" && <><path d="M31 12c-10 0-18 7-18 17 0 8 5 14 13 16v7h12v-7c8-2 13-8 13-16 0-10-9-17-20-17Z" /><path d="M24 29c3-5 10-5 14 0M22 38c5 4 14 4 19 0M31 12v36" /></>}
      {type === "paralysis" && <><circle cx="32" cy="14" r="6" /><path d="M22 30h20M32 20v24M24 44l-6 12M40 44l6 12M20 34l-6 8M44 34l6 8" /></>}
      {type === "stroke" && <><circle cx="22" cy="18" r="7" /><path d="M28 25l11 10 8-4M31 33l-6 16M24 49h18M14 34h13" /></>}
      {type === "child" && <><circle cx="24" cy="16" r="5" /><circle cx="42" cy="20" r="4" /><path d="M24 21v16M18 27h12M20 37l-4 13M28 37l4 13M42 24v12M38 29h8M39 36l-3 10M45 36l3 10" /></>}
      {type === "postop" && <><path d="M18 48h28M32 14v34M22 24h20M24 34h16" /><path d="M14 14h36v10H14z" /></>}
      {type === "neck" && <><path d="M24 12h16l-3 18 7 16H20l7-16-3-18Z" /><path d="M25 23h14M23 46h18" /></>}
      {type === "shoulder" && <><circle cx="23" cy="22" r="8" /><path d="M31 23c10 2 17 8 20 19M17 30c-5 6-7 12-7 20" /></>}
      {type === "elbow" && <><path d="M16 22h20l13 14" /><path d="M36 22c1 10-2 18-11 24" /><circle cx="38" cy="25" r="5" /></>}
      {type === "hand" && <><path d="M20 34V16M28 34V11M36 35V15M44 38V22" /><path d="M20 34c0 14 7 20 18 20 8 0 14-5 14-14V29" /></>}
      {type === "upperback" && <><path d="M24 12c-8 9-9 22-5 40M40 12c8 9 9 22 5 40" /><path d="M25 22h14M23 34h18M22 46h20" /></>}
      {type === "lowerback" && <><path d="M32 10c6 8 6 16 0 24 7 5 8 12 1 20" /><path d="M20 42c8-4 16-4 24 0M23 52h18" /></>}
      {type === "hip" && <><path d="M24 12c2 12 1 20-5 30" /><path d="M40 12c-2 12-1 20 5 30" /><circle cx="32" cy="34" r="9" /></>}
      {type === "knee" && <><path d="M25 10l14 18-5 26" /><path d="M21 29h23M26 54h18" /><circle cx="37" cy="30" r="5" /></>}
      {type === "ankle" && <><path d="M28 10v24l-8 14h28" /><path d="M28 34h14M20 48c5 6 14 7 28 4" /></>}
      {type === "trauma" && <><path d="M32 8l7 16 17 2-13 11 4 17-15-9-15 9 4-17L8 26l17-2 7-16Z" /></>}
    </svg>
  );
}

function CallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '6px', verticalAlign: 'middle' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', marginRight: '6px', verticalAlign: 'middle' }}>
      <path d="M12.031 0C5.399 0 0 5.399 0 12.031c0 2.115.553 4.18 1.603 5.998L.057 24l6.163-1.615a12.01 12.01 0 0 0 5.811 1.493h.005c6.632 0 12.031-5.399 12.031-12.031.001-3.214-1.25-6.234-3.523-8.508C18.271 1.25 15.245 0 12.031 0zm0 22.046h-.004a9.98 9.98 0 0 1-5.088-1.39l-.365-.217-3.778.991 1.008-3.684-.237-.378a9.986 9.986 0 0 1-1.533-5.337c0-5.514 4.486-10 10-10 2.671 0 5.183 1.04 7.073 2.93a9.94 9.94 0 0 1 2.926 7.073c0 5.515-4.486 10.002-10 10.002zm5.485-7.492c-.3-.15-1.777-.876-2.053-.976-.276-.1-.476-.15-.676.15-.2.3-.776.976-.951 1.176-.176.2-.351.225-.652.075-.3-.15-1.267-.467-2.414-1.489-.893-.796-1.496-1.78-1.671-2.08-.175-.3-.019-.463.132-.612.135-.135.301-.351.451-.526.151-.176.201-.301.301-.502.101-.2.05-.376-.025-.526-.075-.15-.677-1.63-.927-2.233-.244-.587-.492-.507-.677-.517l-.577-.01c-.2 0-.526.075-.802.376-.276.3-1.053 1.028-1.053 2.508s1.078 2.91 1.228 3.11c.15.201 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.23 1.377.197 1.895.12.578-.087 1.777-.727 2.028-1.43.251-.702.251-1.304.176-1.43-.075-.125-.276-.2-.577-.35z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px', marginRight: '6px', verticalAlign: 'middle' }}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px', marginRight: '6px', verticalAlign: 'middle' }}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function Header({ onOpenDoctorPortal, onOpenPatientPortal, onOpenDownloadApp, themeProps }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDark = true;

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#home" aria-label="Vindhy Physiotherapy & Rehab Center home" onClick={handleNavClick}>
            <ClinicLogo isDark={true} />
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map(([label, href]) => (
              <a href={href} key={href}>{label}</a>
            ))}
          </nav>

          <div className="header-actions-group">
            <button
              className="header-rect-btn patient-portal-rect-btn"
              onClick={() => { setMobileMenuOpen(false); onOpenPatientPortal(); }}
              title="Patient Portal — Visits, Receipts & Recovery Plan"
            >
              <span className="portal-rect-icon">👤</span>
              <span className="rect-btn-text">Patient Portal</span>
              <span className="rect-btn-text-short">Patient</span>
            </button>

            <button
              className="header-rect-btn doctor-portal-rect-btn desktop-only-portal-btn"
              onClick={() => { setMobileMenuOpen(false); onOpenDoctorPortal(); }}
              title="Doctor Login & Clinic Management"
            >
              <span className="portal-rect-icon">🔒</span>
              <span className="rect-btn-text">Doctor Portal</span>
            </button>
            <a 
              className="header-cta desktop-only-cta" 
              href="#consultation"
              onClick={() => window.dispatchEvent(new CustomEvent("highlight-assessment"))}
            >
              Book Consultation
            </a>

            <button
              className="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <span className="menu-icon-cross">✕</span>
              ) : (
                <span className="menu-icon-bars">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu outside header so backdrop-filter does not trap position:fixed */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <ClinicLogo isDark={true} />
              <button
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <div className="mobile-drawer-nav">
              {navItems.map(([label, href]) => (
                <a
                  href={href}
                  key={href}
                  className="mobile-drawer-link"
                  onClick={handleNavClick}
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="mobile-drawer-actions">
              <button
                className="mobile-drawer-btn download-btn android-download-btn"
                onClick={() => { setMobileMenuOpen(false); onOpenDownloadApp(); }}
                title="Download & Install Vindhy Physiotherapy App on Android"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ marginRight: '4px' }}>
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4114 13.8533 8.081 12 8.081s-3.5902.3304-5.1367.8687L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
                </svg>
                Download Android App
              </button>
              <button
                className="mobile-drawer-btn patient-btn"
                onClick={() => { setMobileMenuOpen(false); onOpenPatientPortal(); }}
              >
                <span>👤</span> Patient Portal
              </button>
              <button
                className="mobile-drawer-btn doctor-btn"
                onClick={() => { setMobileMenuOpen(false); onOpenDoctorPortal(); }}
              >
                <span>🔒</span> Doctor Portal
              </button>
              <button
                type="button"
                className="mobile-drawer-btn refresh-sync-btn"
                style={{
                  background: "linear-gradient(135deg, #0284c7, #0369a1)",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "800",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  try {
                    localStorage.setItem("active_portal", "closed");
                  } catch (e) {}
                  if (typeof window !== "undefined") {
                    if ("caches" in window) {
                      caches.keys().then((names) => {
                        names.forEach((name) => caches.delete(name));
                      });
                    }
                    if (navigator.serviceWorker) {
                      navigator.serviceWorker.getRegistrations().then((regs) => {
                        regs.forEach((r) => r.unregister());
                      });
                    }
                    window.location.reload(true);
                  }
                }}
                title="Force refresh app and clear cache for latest updates"
              >
                <span>🔄</span> Refresh App &amp; Sync Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero-bg-overlay"></div>
      <div className="hero-inner">
        <div className="hero-copy">
          <h1 className="hero-headline">
            Move Better.<br />
            Feel Better.<br />
            <span className="hero-headline-blue">Live Better.</span>
          </h1>
          <p className="hero-lead">
            Personalized clinical physiotherapy, spinal decompression, and targeted rehabilitation designed to restore natural pain-free mobility under Dr. Satyam Vishwakarma.
          </p>
        </div>
        <div className="hero-visual-frame">
          <div className="hero-rehab-card-3d">
            <img
              src="/physio_rehab_hero.jpg"
              className="hero-rehab-photo"
              alt="Targeted physiotherapy rehabilitation session"
            />
          </div>
        </div>
        <div className="hero-actions hero-actions-centered">
          <a 
            className="primary-btn hero-consult-btn" 
            href="#consultation"
            onClick={() => window.dispatchEvent(new CustomEvent("highlight-assessment"))}
          >
            Book Consultation
          </a>
          <a className="secondary-btn hero-call-btn" href={`tel:${phonePrimary}`}><CallIcon /> Call Clinic</a>
        </div>
      </div>
      <div className="stats-strip">
        {stats.map(([value, label]) => (
          <div key={value} className="stat-box-3d">
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function LeadConsultant() {
  return (
    <section id="doctor" className="section consultant-section">
      <div className="consultant-shell-3d">
        <div className="consultant-photo-side">
          <div className="consultant-photo-container">
            <img
              src="/doctor_satyam_green.png"
              alt="Dr. Satyam Vishwakarma - Chief Physiotherapist"
              className="consultant-main-photo"
            />
            <div className="consultant-lead-badge">Lead Consultant</div>
            <div className="consultant-exp-badge" style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "30px",
              fontSize: "12.5px",
              fontWeight: "800",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.35)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "1.5px solid rgba(255, 255, 255, 0.3)"
            }}>
              <span>🏆</span>
              <span>7+ Years Experience</span>
            </div>
          </div>
        </div>
        <div className="consultant-info-side">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <p className="consultant-eyebrow" style={{ margin: 0 }}>CHIEF PHYSIOTHERAPIST & FOUNDER</p>
            <span style={{ fontSize: "11px", fontWeight: "800", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "12px" }}>
              7+ Years Clinical Practice
            </span>
          </div>
          <h2>Dr. Satyam Vishwakarma</h2>
          <p className="consultant-qualification">
            Consultant Physiotherapist • DPT, BPT, CCYP (BHU)
          </p>

          <p className="consultant-bio">
            Dedicated to restoring natural, pain-free movement through clinical diagnostics and advanced rehabilitation. Trained at Banaras Hindu University (BHU), Dr. Satyam specializes in non-surgical spine decompression, paralysis rehabilitation, cupping therapy, pediatric care, and sports injury recovery with over 7 years of trusted practice in Vindhyachal & Mirzapur.
          </p>
          <div className="consultant-specialties" style={{ marginBottom: "20px" }}>
            <span>Spine & Back Pain</span>
            <span>Cupping Therapy</span>
            <span>Neuro & Paralysis</span>
            <span>CP Child Rehab</span>
            <span>Sports Injury</span>
            <span>Post-Surgical</span>
          </div>

          <div className="consultant-btn-group">
            <a 
              href="#consultation" 
              className="primary-btn consultant-book-btn"
              onClick={() => window.dispatchEvent(new CustomEvent("highlight-assessment"))}
            >
              Book Consultation With Dr. Satyam
            </a>
            <a href={`tel:${phonePrimary}`} className="secondary-btn consultant-call-btn"><CallIcon /> Direct Call</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickActions() {
  const quickItems = [
    {
      icon: "🩺",
      title: "Clinical Services",
      desc: "Specialized pain relief, spine & neuro therapies",
      href: "#treatments",
      badge: "8 Services"
    },
    {
      icon: "🎯",
      title: "Find Pain Area",
      desc: "Pinpoint symptoms across 12 body regions",
      href: "#body-map",
      badge: "12 Regions"
    },
    {
      icon: "📋",
      title: "Rehab Pathways",
      desc: "3-step structured recovery methodology",
      href: "#programs",
      badge: "Methodology"
    },
    {
      icon: "📅",
      title: "Book Consultation",
      desc: "Direct appointment triage with clinic team",
      href: "#consultation",
      badge: "Fast Triage"
    }
  ];

  return (
    <section className="quick-actions-section">
      <div className="quick-actions-grid">
        {quickItems.map((item) => (
          <a href={item.href} className="quick-action-card" key={item.title}>
            <div className="quick-action-top">
              <span className="quick-action-icon">{item.icon}</span>
              <span className="quick-action-badge">{item.badge}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
            <span className="quick-action-arrow">Explore ➔</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Treatments() {
  const handleBookService = (title) => {
    window.dispatchEvent(new CustomEvent("prefill-assessment", { detail: title }));
    const el = document.getElementById("consultation");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="treatments" className="section treatments-section">
      <div className="section-heading center">
        <p className="eyebrow">CLINICAL SERVICES</p>
        <h2>Specialized rehabilitation pathways designed for rapid pain relief & lasting mobility.</h2>
      </div>
      <div className="treatment-grid">
        {treatments.map(([icon, title, copy, image, tag]) => (
          <article className="treatment-card" key={title}>
            <div className="treatment-card-header">
              <div className="treatment-icon-wrap">
                <LineIcon type={icon} />
              </div>
              <span className="card-badge">{tag}</span>
            </div>
            <h3>{title}</h3>
            <p>{copy}</p>
            <div className="treatment-card-footer">
              <button
                type="button"
                className="treatment-action-btn"
                onClick={() => handleBookService(title)}
              >
                Explore & Consult ➔
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BodyMap() {
  const handleSelectPainRegion = (title) => {
    window.dispatchEvent(new CustomEvent("prefill-assessment", { detail: title }));
    const el = document.getElementById("consultation");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        const nameInput = document.querySelector('input[name="name"]');
        if (nameInput) nameInput.focus();
      }, 400);
    }
  };

  return (
    <section id="body-map" className="section body-section">
      <div className="section-heading center">
        <p className="eyebrow">FIND YOUR PAIN AREA</p>
        <h2>Select your pain region to pinpoint targeted clinical care.</h2>
      </div>
      <div className="body-grid">
        {bodyProblems.map(([icon, title, copy, number, image]) => (
          <article
            className="new-body-card"
            key={title}
            onClick={() => handleSelectPainRegion(title)}
            style={{ cursor: "pointer" }}
            title={`Select ${title} and book consultation`}
          >
            <div className="card-image-box">
              {image ? <img src={image} alt={title} loading="lazy" /> : <div className="placeholder-img" />}
              <span className="card-number-tag">{number}</span>
            </div>
            <div className="card-info-box">
              <h3>{title}</h3>
              <p>{copy}</p>
              <div className="card-action-box">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent("Vindhy Physiotherapy " + title + " treatment")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explore-btn"
                  onClick={(e) => e.stopPropagation()}
                >
                  Explore
                </a>
                <button
                  type="button"
                  className="book-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPainRegion(title);
                  }}
                >
                  Consult Now
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Programs() {
  return (
    <section id="programs" className="section programs-section">
      <div className="section-heading center">
        <p className="eyebrow">CLINICAL METHODOLOGY</p>
        <h2>Structured therapy programs engineered for lasting recovery.</h2>
        <p className="section-sublead">
          At <strong>Vindhy Physiotherapy & Rehab Center</strong>, every patient journey begins with diagnostic evaluation, progressing systematically through pain management, tissue healing, functional strengthening, and relapse prevention.
        </p>
      </div>
      <div className="programs-grid">
        {programs.map(([title, copy], index) => (
          <article className="methodology-card" key={title}>
            <div className="methodology-step-badge">Step 0{index + 1}</div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PatientFAQSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: "What clinical conditions are treated by Dr. Satyam Vishwakarma at Vindhy Physiotherapy & Rehab Center?",
      a: "Dr. Satyam Vishwakarma specializes in evidence-based rehabilitation for spine & lower back pain (sciatica, disc herniation, slip disc), cervical spondylosis & neck stiffness, knee osteoarthritis & ACL post-operative recovery, frozen shoulder (adhesive capsulitis), paralysis & stroke neuro-rehabilitation, pediatric motor therapy (CP), sports injuries, and clinical cupping (hijama) for myofascial decompression."
    },
    {
      q: "How does the online Patient Portal & daily attendance calendar work?",
      a: "When you begin physical therapy at Vindhy Physiotherapy & Rehab Center, your digital profile tracks consecutive daily attendance in real-time. Each attended session turns green on your personalized interactive calendar. You can review attended session dates, treatment milestones, recovery percentages, and download clinic-authenticated receipts directly on your phone."
    },
    {
      q: "How are session fees and rehabilitation packages structured?",
      a: "Our clinic provides 100% fee transparency. Standard daily sessions are billed at ₹500, or you can opt for custom subsidized rehabilitation packages (e.g., 15-day or 30-day comprehensive recovery courses) with reserved consecutive daily slots. Official digital receipts with clinic registration PHY/11123 and doctor authentication are generated for every session."
    },
    {
      q: "What qualifications and clinical experience does Dr. Satyam Vishwakarma hold?",
      a: "Dr. Satyam Vishwakarma holds Doctor of Physical Therapy (DPT) and Bachelor of Physiotherapy (BPT) degrees, complemented by Certificate Course in Yoga Practices (CCYP) from Banaras Hindu University (BHU). This unique synthesis unites rigorous modern orthopedic diagnostics with functional movement biomechanics for lasting recovery."
    },
    {
      q: "How do I schedule or confirm my next physiotherapy appointment?",
      a: "You can book appointments directly via the website consultation form, select preferred slots inside your Patient Portal, or message our clinic desk via WhatsApp (+91 9793093316). Dr. Satyam confirms your slot with an official reminder."
    }
  ];

  return (
    <section id="faqs" className="section faq-guide-section" style={{ padding: "64px 20px", background: "var(--bg-secondary, #f8fafc)" }}>
      {/* Anchor for heritage backwards compatibility */}
      <div id="heritage" style={{ position: "relative", top: "-80px" }}></div>
      <div style={{ maxWidth: "880px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <p className="eyebrow" style={{ color: "#0284c7", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase", fontSize: "12px", marginBottom: "8px" }}>
            PATIENT INFORMATION &amp; CLINICAL GUIDE
          </p>
          <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a", margin: "0 0 12px 0", letterSpacing: "-0.5px" }}>
            Frequently Asked Questions &amp; Patient Guide
          </h2>
          <p style={{ color: "#64748b", fontSize: "15px", maxWidth: "640px", margin: "0 auto", lineHeight: "1.6" }}>
            Everything you need to know about starting physical therapy, tracking attendance in the digital portal, treatment packages, and Dr. Satyam Vishwakarma's BHU-backed clinical approach.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  border: isOpen ? "2px solid #0284c7" : "1.5px solid #e2e8f0",
                  borderRadius: "14px",
                  overflow: "hidden",
                  boxShadow: isOpen ? "0 6px 20px rgba(2, 132, 199, 0.1)" : "0 2px 6px rgba(0,0,0,0.03)",
                  transition: "all 0.2s ease"
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  style={{
                    width: "100%",
                    padding: "18px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <span style={{ fontSize: "15.5px", fontWeight: "800", color: isOpen ? "#0284c7" : "#0f172a", lineHeight: "1.4" }}>
                    {faq.q}
                  </span>
                  <span
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: isOpen ? "#e0f2fe" : "#f1f5f9",
                      color: isOpen ? "#0284c7" : "#64748b",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "13px",
                      fontWeight: "900",
                      flexShrink: 0,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 20px 18px 20px", color: "#334155", fontSize: "14px", lineHeight: "1.7", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Doctor Heritage & Credentials highlight box */}
        <div
          style={{
            marginTop: "32px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            borderRadius: "16px",
            padding: "22px 24px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ background: "#0284c7", color: "#ffffff", padding: "3px 9px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" }}>
                CCYP BHU HERITAGE
              </span>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Reg. No: PHY/11123</span>
            </div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "800", color: "#f8fafc" }}>
              Dr. Satyam Vishwakarma (DPT, BPT, CCYP BHU)
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1", maxWidth: "560px", lineHeight: "1.5" }}>
              Evidence-based musculoskeletal &amp; neuromuscular rehabilitation at Atal Chauraha (Amravati), Vindhyachal, Mirzapur.
            </p>
          </div>
          <a
            href="#consultation"
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: "800",
              fontSize: "13.5px",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>📅</span> Book Clinic Consultation
          </a>
        </div>
      </div>
    </section>
  );
}

function Assessment() {
  const [selectedPainArea, setSelectedPainArea] = useState("Spine & Back Pain (Sciatica / Slip Disc)");
  const [customPainArea, setCustomPainArea] = useState("");
  const [highlightCard, setHighlightCard] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    concern: ""
  });
  const [lastSubmittedLead, setLastSubmittedLead] = useState(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const handlePrefill = (e) => {
      if (e.detail) {
        setSelectedPainArea(e.detail);
        setHighlightCard(true);
        setTimeout(() => setHighlightCard(false), 2000);
      }
    };
    const handleHighlight = () => {
      setHighlightCard(true);
      setTimeout(() => setHighlightCard(false), 2000);
    };
    const checkHash = () => {
      if (window.location.hash === "#consultation") {
        setHighlightCard(true);
        setTimeout(() => setHighlightCard(false), 2000);
      }
    };

    window.addEventListener("prefill-assessment", handlePrefill);
    window.addEventListener("highlight-assessment", handleHighlight);
    window.addEventListener("hashchange", checkHash);
    return () => {
      window.removeEventListener("prefill-assessment", handlePrefill);
      window.removeEventListener("highlight-assessment", handleHighlight);
      window.removeEventListener("hashchange", checkHash);
    };
  }, []);

  const finalPainArea = selectedPainArea === "custom" ? (customPainArea || "Custom Condition") : selectedPainArea;

  const canSubmit = useMemo(() => form.name.trim().length > 1 && /^[6-9]\d{9}$/.test(form.phone.trim()), [form]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) {
      setStatus("invalid");
      return;
    }
    setStatus("loading");
    const cleanName = form.name.trim();
    const payload = {
      name: cleanName,
      patientName: cleanName,
      age: "",
      painArea: finalPainArea,
      duration: "Direct Online Booking",
      appointmentDate: form.appointmentDate || new Date().toISOString().split("T")[0],
      phone: form.phone.trim(),
      concern: form.concern.trim() || "Consultation Request"
    };

    try {
      await api.createEnquiry(payload);
      setLastSubmittedLead(payload);
      setStatus("success");
      setForm({ name: "", phone: "", appointmentDate: new Date().toISOString().split("T")[0], concern: "" });
      setCustomPainArea("");
      setTimeout(() => {
        setStatus((cur) => (cur === "success" ? "" : cur));
      }, 7000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="consultation" className="portal consultation-section">
      <div className="portal-shell">
        <div className="portal-info">
          <p className="eyebrow">DIRECT CLINIC CONSULTATION</p>
          <h2>Book Your Consultation</h2>
          <p className="portal-lead">
            Share your concern and preferred date. Dr. Satyam Vishwakarma and our clinic team will contact you directly for appointment triage.
          </p>
          <div className="contact-panel">
            <a href={`tel:${phonePrimary}`} className="contact-call-btn"><CallIcon /> Call: +91 9793093316</a>
            <a href={`https://api.whatsapp.com/send?phone=91${phoneWhatsApp}&text=${encodeURIComponent("Hello Dr. Satyam Vishwakarma, I would like to book a physiotherapy consultation.")}`} target="_blank" rel="noreferrer" className="contact-wa-btn"><WhatsAppIcon /> WhatsApp: +91 9793093316</a>
          </div>
          <div className="location-badge-box">
            <strong>📍 Clinic Location:</strong>
            <span>{clinicAddress}</span>
            <span className="timing-note">Mon – Sat: 9:00 AM – 8:00 PM</span>
          </div>
        </div>
        <form className={`assessment-card ${highlightCard ? "highlight-focus" : ""}`} onSubmit={submit}>
          <div className="form-heading-row">
            <h3>Quick Consultation Booking</h3>
            <span className="form-subnote">1-Step Booking</span>
          </div>
          <div className="form-grid">
            <label>
              Patient Full Name *
              <input name="name" value={form.name} onChange={update} placeholder="e.g. Rajesh Sharma" autoComplete="name" required />
            </label>

            <label>
              Mobile Number (10 Digits) *
              <div className="phone-input">
                <span>+91</span>
                <input name="phone" value={form.phone} onChange={update} inputMode="numeric" maxLength="10" placeholder="9876543210" autoComplete="tel" required />
              </div>
            </label>

            <label>
              Pain Area / Clinical Problem *
              <select
                value={selectedPainArea}
                onChange={(e) => setSelectedPainArea(e.target.value)}
              >
                <option value="Spine & Back Pain (Sciatica / Slip Disc)">Lower Back & Spine (Sciatica / Slip Disc)</option>
                <option value="Neck & Cervical Spondylosis">Neck & Cervical Spondylosis</option>
                <option value="Knee & ACL / Arthritis Rehabilitation">Knee Pain & Arthritis / ACL Recovery</option>
                <option value="Cup Therapy / Cupping">Cupping Therapy / Hijama Pain Relief</option>
                <option value="Shoulder & Rotator Cuff">Frozen Shoulder & Rotator Cuff</option>
                <option value="Paralysis & Neuro Care">Paralysis & Neuro Rehabilitation</option>
                <option value="Sports Injury Rehab">Sports Injury & Ligament Recovery</option>
                <option value="Post-Surgical Rehab">Post-Surgical Knee / Spine Rehab</option>
                <option value="General Physiotherapy">General Body Pain / Other Condition</option>
                <option value="custom">✏️ Other Condition (Write Your Own)...</option>
              </select>
            </label>

            {selectedPainArea === "custom" && (
              <label>
                Specify Your Condition *
                <input
                  type="text"
                  required
                  value={customPainArea}
                  onChange={(e) => setCustomPainArea(e.target.value)}
                  placeholder="e.g. Sharp pain in lower ribs"
                />
              </label>
            )}

            <label>
              Preferred Date of Visit *
              <input
                name="appointmentDate"
                type="date"
                required
                value={form.appointmentDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={update}
              />
            </label>

            <label className="wide">
              Symptoms / Note (Optional)
              <input
                type="text"
                name="concern"
                value={form.concern}
                onChange={update}
                placeholder="e.g. Pain since 2 weeks, worse while sitting"
              />
            </label>
          </div>
          <button className="primary-btn form-submit" type="submit">Confirm Consultation Booking ➔</button>
          {status === "invalid" && <p className="form-status">Please enter patient name and a valid 10-digit Indian mobile number.</p>}
          {status === "loading" && <p className="form-status">Submitting consultation request...</p>}
          {status === "success" && (
            <div className="form-status-box success" style={{ position: "relative", background: "rgba(16, 185, 129, 0.12)", border: "1.5px solid #10b981", borderRadius: "10px", padding: "14px 16px", marginTop: "14px", color: "var(--text-primary)" }}>
              <button
                type="button"
                onClick={() => setStatus("")}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "12px",
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#10b981",
                  cursor: "pointer",
                  padding: "2px 6px"
                }}
                title="Dismiss"
              >
                ✕
              </button>
              <div style={{ fontWeight: "700", color: "#10b981", fontSize: "15px", marginBottom: "4px" }}>
                ✅ Consultation Request Successfully Received!
              </div>
              <p style={{ margin: "0 0 10px 0", fontSize: "13px" }}>
                Dr. Satyam Vishwakarma and clinic reception have received your request. (Auto-closing shortly).
              </p>
              {lastSubmittedLead && (
                <a
                  href={`https://api.whatsapp.com/send?phone=91${phoneWhatsApp}&text=${encodeURIComponent(`Hello Dr. Satyam Vishwakarma, I have booked a consultation on your website:\n\n👤 Name: ${lastSubmittedLead.name}\n🎂 Age: ${lastSubmittedLead.age || "N/A"}\n📞 Phone: +91 ${lastSubmittedLead.phone}\n🩺 Problem: ${lastSubmittedLead.painArea}\n⏱️ Duration: ${lastSubmittedLead.duration}\n📅 Preferred Date: ${lastSubmittedLead.appointmentDate || "Flexible"}\n💬 Message: ${lastSubmittedLead.concern || "Consultation requested"}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#25D366",
                    color: "#ffffff",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "700",
                    textDecoration: "none"
                  }}
                >
                  <WhatsAppIcon /> Notify Dr. Satyam on WhatsApp ➔
                </a>
              )}
            </div>
          )}
          {status === "error" && <p className="form-status">Form could not be sent online. Please call +91 9793093316 directly.</p>}
        </form>
      </div>
    </section>
  );
}

function Testimonials() {
  const [feedback, setFeedback] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("patientFeedback") || "[]");
    } catch {
      return [];
    }
  });
  const [feedbackForm, setFeedbackForm] = useState({ name: "", condition: "", quote: "", rating: "5" });
  const allTestimonials = [...testimonials, ...feedback.map((item) => [item.name, item.condition, item.quote, item.rating || "5"])];

  useEffect(() => {
    localStorage.setItem("patientFeedback", JSON.stringify(feedback));
  }, [feedback]);

  const updateFeedback = (event) => {
    const { name, value } = event.target;
    setFeedbackForm((current) => ({ ...current, [name]: value }));
  };

  const addFeedback = (event) => {
    event.preventDefault();
    if (!feedbackForm.name.trim() || !feedbackForm.quote.trim()) return;
    setFeedback((current) => [{ ...feedbackForm, condition: feedbackForm.condition || "Physiotherapy Rehabilitation" }, ...current]);
    setFeedbackForm({ name: "", condition: "", quote: "", rating: "5" });
  };

  return (
    <section className="section testimonials-section">
      <div className="trust-head">
        <div className="section-heading">
          <p className="eyebrow">PATIENT TESTIMONIALS & TRUST</p>
          <h2>Recovery stories from focused physiotherapy care.</h2>
        </div>
        <form className="feedback-form" onSubmit={addFeedback}>
          <input name="name" value={feedbackForm.name} onChange={updateFeedback} placeholder="Patient name" />
          <input name="condition" value={feedbackForm.condition} onChange={updateFeedback} placeholder="Treated condition (e.g. Spine, Cupping, Knee)" />
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= feedbackForm.rating ? "star active" : "star"}
                onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
              >
                ★
              </span>
            ))}
          </div>
          <textarea name="quote" value={feedbackForm.quote} onChange={updateFeedback} placeholder="Write your recovery experience..." rows="2" />
          <button type="submit">Submit Feedback</button>
        </form>
      </div>

      <div className="testimonial-window">
        <div className="testimonial-track">
          {[...allTestimonials, ...allTestimonials, ...allTestimonials].map(([name, condition, quote, rating], index) => (
            <article className="testimonial-card" key={`${name}-${index}`}>
              <div className="stars">{"★★★★★".slice(0, Number(rating || 5))}</div>
              <p>“{quote}”</p>
              <h3>{name}</h3>
              <span>{condition}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer({ onOpenDoctorPortal, onOpenPatientPortal, isDark = false }) {
  const [clinicLoc, setClinicLoc] = useState(() => {
    try {
      const saved = localStorage.getItem("vindhy_clinic_location");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return CLINIC_EXACT_LOCATION;
  });

  useEffect(() => {
    const handleLocUpdate = (e) => {
      if (e.detail) setClinicLoc(e.detail);
    };
    window.addEventListener("clinic-location-updated", handleLocUpdate);
    return () => window.removeEventListener("clinic-location-updated", handleLocUpdate);
  }, []);

  const lat = parseFloat(clinicLoc.lat) || CLINIC_EXACT_LOCATION.lat;
  const lng = parseFloat(clinicLoc.lng) || CLINIC_EXACT_LOCATION.lng;

  return (
    <footer id="contact" className="site-footer">
      <div className="footer-inner">
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <ClinicLogo isDark={true} />
            <h2>DR. SATYAM VISHWAKARMA</h2>
          </div>
          <p className="footer-credentials">Consultant Physiotherapist | DPT, BPT, CCYP (BHU)</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "20px", padding: "4px 10px", margin: "6px 0 10px", color: "#34d399", fontSize: "11.5px", fontWeight: "800" }}>
            <span>⭐</span>
            <span>7+ Years Clinical Excellence</span>
          </div>
          <p className="footer-address">
            📍 {clinicLoc.address || clinicAddress}
          </p>

          {/* Social Media Follow Section */}
          <div style={{ marginTop: "12px" }}>
            <h4 style={{ color: "#ffffff", fontSize: "12.5px", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Follow Dr. Satyam</h4>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <a
                href="https://www.instagram.com/vindhydrsatyam1/"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "700",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(220, 39, 67, 0.3)"
                }}
              >
                <InstagramIcon />
                <span>Instagram</span>
              </a>
              <a
                href="https://www.facebook.com/vindhydrsatyam1"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  background: "#1877f2",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "700",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(24, 119, 242, 0.3)"
                }}
              >
                <FacebookIcon />
                <span>Facebook</span>
              </a>
              <a
                href={`https://api.whatsapp.com/send?phone=91${phoneWhatsApp}&text=${encodeURIComponent("Hello Dr. Satyam Vishwakarma, I want to connect regarding physiotherapy appointment.")}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  background: "#25D366",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "700",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(37, 211, 102, 0.3)"
                }}
              >
                <WhatsAppIcon />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-col contact-col">
          <h3>Clinic Contact & Timings</h3>
          <a href={`tel:${phonePrimary}`} className="footer-link"><CallIcon /> Call: +91 9793093316</a>
          <a href={`https://api.whatsapp.com/send?phone=91${phoneWhatsApp}&text=${encodeURIComponent("Hello Dr. Satyam Vishwakarma, I want to connect regarding physiotherapy appointment.")}`} target="_blank" rel="noreferrer" className="footer-link"><WhatsAppIcon /> WhatsApp: +91 9793093316</a>
          <div className="footer-hours">
            🗓️ Monday – Saturday<br />
            ⏰ 9:00 AM – 8:00 PM
          </div>
        </div>
        <div className="footer-col services-col">
          <h3>Key Clinical Services</h3>
          <a href="#treatments">Spine & Sciatica Care</a>
          <a href="#treatments">Hijama & Cupping Therapy</a>
          <a href="#treatments">Paralysis & Neuro Rehab</a>
          <a href="#treatments">Pediatric (CP Child) Care</a>
          <a href="#treatments">Sports Injury Conditioning</a>
          <a href="#treatments">Post-Surgical Joint Rehab</a>
        </div>
        <div className="footer-col map-col">
          <h3>Clinic Location</h3>
          <ClinicLeafletMap
            lat={lat}
            lng={lng}
            address={clinicLoc.address || clinicAddress}
            height="150px"
          />
          <a
            href={clinicLoc.shareUrl || clinicLoc.mapUrl || CLINIC_SHARE_URL}
            target="_blank"
            rel="noreferrer"
            className="footer-map-link"
          >
            ↗ Open in Google Maps
          </a>
        </div>
      </div>
      <div className="footer-bottom-bar">
        <p>© {new Date().getFullYear()} Vindhy Physiotherapy & Rehab Center. All rights reserved. Dr. Satyam Vishwakarma (DPT, BPT, CCYP BHU) • 7+ Years Experience.</p>
      </div>
    </footer>
  );
}

function AppDownloadModal({ isOpen, onClose, deferredPrompt, onInstalled }) {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    const promptToUse = deferredPrompt || window.deferredPWAInstallPrompt;
    if (promptToUse) {
      try {
        promptToUse.prompt();
        const choice = await promptToUse.userChoice;
        if (choice && choice.outcome === 'accepted') {
          sessionStorage.setItem('vindhy_download_prompt_dismissed', 'true');
          localStorage.setItem('vindhy_app_installed', 'true');
          if (onInstalled) onInstalled();
        }
      } catch (err) {
        console.log("Install prompt error:", err);
      }
      onClose();
    } else if (isIOS) {
      localStorage.setItem('vindhy_app_installed', 'true');
      if (onInstalled) onInstalled();
      onClose();
    } else {
      localStorage.setItem('vindhy_app_installed', 'true');
      if (onInstalled) onInstalled();
      alert("📲 To install Vindhy Physiotherapy App on Android:\n1. Tap the three dots (⋮) in Chrome (top right)\n2. Select 'Install app' or 'Add to Home screen'\n3. Tap 'Install'");
      onClose();
    }
  };

  const handleIOSGotIt = () => {
    localStorage.setItem('vindhy_app_installed', 'true');
    if (onInstalled) onInstalled();
    onClose();
  };

  return (
    <div className="app-download-modal-overlay" onClick={onClose}>
      <div className="app-download-card" onClick={(e) => e.stopPropagation()}>
        <button className="download-modal-close" onClick={onClose} aria-label="Close download popup" title="Close">✕</button>
        
        <div className="app-download-header">
          <img
            src="/icon-192.png"
            alt="Vindhy Physiotherapy & Rehab Center"
            className="app-download-logo"
          />
          <div className="app-download-meta">
            <h3>Download Clinic App 📱</h3>
            <span className="app-download-badge">Official Clinic App</span>
          </div>
        </div>

        <ul className="app-download-benefits">
          <li>✓ 1-Tap access to Patient Portal, Visits & PDF Receipts</li>
          <li>✓ Fast consultation booking & recovery tracking</li>
        </ul>

        {isIOS ? (
          <div className="ios-install-steps">
            <strong>📲 How to Install on iPhone:</strong>
            <ol>
              <li>Tap <strong>Share</strong> <span className="ios-icon">⎋</span> in Safari</li>
              <li>Tap <strong>Add to Home Screen</strong> <span className="ios-icon">⊞</span></li>
              <li>Tap <strong>Add</strong> at top right corner</li>
            </ol>
            <div className="download-modal-actions" style={{ marginTop: "12px" }}>
              <button className="primary-btn download-btn" onClick={handleIOSGotIt} style={{ width: "100%", justifyContent: "center" }}>
                Got It & Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="android-install-flow">
            <div className="download-modal-actions" style={{ marginBottom: "10px" }}>
              <button className="primary-btn download-btn" onClick={handleDownload} style={{ width: "100%", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ marginRight: "6px" }}>
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4114 13.8533 8.081 12 8.081s-3.5902.3304-5.1367.8687L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
                </svg>
                Install Android App Now
              </button>
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748b", background: "var(--panel, #f1f5f9)", padding: "8px 10px", border: "1px solid var(--line, #e2e8f0)", borderRadius: "8px", textAlign: "left", lineHeight: "1.35" }}>
              <strong>💡 Quick Android Tip:</strong> If install prompt doesn't open automatically, tap your Chrome menu <strong>(⋮ top right)</strong> and tap <strong>"Install app"</strong>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



function WhatsAppFloating() {
  return (
    <a
      href={`https://api.whatsapp.com/send?phone=91${phoneWhatsApp}&text=${encodeURIComponent("Hello Dr. Satyam Vishwakarma, I would like to book a physiotherapy consultation.")}`}
      target="_blank"
      rel="noreferrer"
      className="whatsapp-floating-btn"
      aria-label="Chat on WhatsApp with Dr. Satyam Vishwakarma"
      title="Chat on WhatsApp with Dr. Satyam Vishwakarma"
    >
      <WhatsAppIcon />
      <span className="whatsapp-floating-label">WhatsApp</span>
    </a>
  );
}

function AutoEnquiryModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    painArea: "Spine & Back Pain (Sciatica / Slip Disc)",
    appointmentDate: new Date().toISOString().split("T")[0],
    concern: ""
  });
  const [status, setStatus] = useState("idle"); // idle, loading, success, error, invalid

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const update = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (!form.name.trim() || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setStatus("invalid");
      return;
    }
    setStatus("loading");
    try {
      await api.createEnquiry({
        name: form.name.trim(),
        age: "",
        phone: cleanPhone,
        painArea: form.painArea,
        appointmentDate: form.appointmentDate || new Date().toISOString().split("T")[0],
        concern: form.concern.trim() || "Website Consultation Booking Form",
        duration: "Direct Online Booking"
      });
      setStatus("success");
      try {
        sessionStorage.setItem("vindhy_auto_enquiry_dismissed", "true");
      } catch (e) {}
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="auto-enquiry-overlay" onClick={onClose}>
      <div className="auto-enquiry-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="auto-enquiry-close-btn"
          onClick={onClose}
          title="Close and cancel"
          aria-label="Close consultation popup"
        >
          ✕
        </button>

        <div className="auto-enquiry-badge">
          <span>🩺 Consultation Booking</span>
        </div>

        <h3 className="auto-enquiry-title">Book Your Physiotherapy Consultation</h3>
        <p className="auto-enquiry-desc">
          Fill your details below. Dr. Satyam Vishwakarma &amp; clinic reception will confirm your slot.
        </p>

        {status === "success" ? (
          <div className="auto-enquiry-status success" style={{ textAlign: "center", padding: "16px 12px" }}>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>🎉</div>
            <div style={{ fontWeight: "800", fontSize: "16px", color: "#10b981", marginBottom: "4px" }}>
              Consultation Request Received!
            </div>
            <p style={{ margin: "0 0 14px 0", fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Dr. Satyam Vishwakarma and clinic reception will contact you at <strong>+91 {form.phone}</strong> shortly.
            </p>
            <a
              href={`https://api.whatsapp.com/send?phone=91${phoneWhatsApp}&text=${encodeURIComponent(`Hello Dr. Satyam Vishwakarma, I booked a consultation on your website:\n\n👤 Name: ${form.name}\n📞 Phone: +91 ${form.phone}\n🩺 Problem: ${form.painArea}\n📅 Preferred Date: ${form.appointmentDate}`)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "#25D366",
                color: "#ffffff",
                padding: "10px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "700",
                textDecoration: "none",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <WhatsAppIcon /> Open WhatsApp Confirmation ➔
            </a>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: "12px",
                background: "none",
                border: "none",
                color: "var(--muted)",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Close &amp; Explore Website
            </button>
          </div>
        ) : (
          <form className="auto-enquiry-form" onSubmit={handleSubmit}>
            <label className="auto-enquiry-field">
              Patient Full Name *
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={update}
                placeholder="e.g. Rahul Sharma"
                autoComplete="name"
              />
            </label>

            <label className="auto-enquiry-field">
              Mobile Number *
              <div className="auto-enquiry-phone-row">
                <span>+91</span>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength="10"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={update}
                  placeholder="9876543210"
                  autoComplete="tel"
                />
              </div>
            </label>

            <label className="auto-enquiry-field">
              Pain Area / Clinical Problem *
              <select name="painArea" value={form.painArea} onChange={update}>
                <option value="Spine & Back Pain (Sciatica / Slip Disc)">Lower Back Pain / Sciatica / Slip Disc</option>
                <option value="Cervical & Neck Spondylosis">Neck &amp; Cervical Pain / Spondylosis</option>
                <option value="Knee Pain & Arthritis / ACL">Knee Pain &amp; Arthritis / ACL Rehab</option>
                <option value="Cupping Therapy / Hijama">Cupping Therapy / Hijama Pain Relief</option>
                <option value="Frozen Shoulder & Shoulder Pain">Frozen Shoulder &amp; Rotator Cuff</option>
                <option value="Sports Injury Recovery">Sports Injury &amp; Ligament Recovery</option>
                <option value="Paralysis & Neuro Rehabilitation">Paralysis &amp; Neuro Recovery</option>
                <option value="Post-Surgical Rehabilitation">Post-Surgical Knee / Spine Rehab</option>
                <option value="Other Clinical Condition">Other Pain / Clinical Consultation</option>
              </select>
            </label>

            <label className="auto-enquiry-field">
              Preferred Date of Visit *
              <input
                type="date"
                name="appointmentDate"
                required
                value={form.appointmentDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={update}
              />
            </label>

            <label className="auto-enquiry-field">
              Symptoms / Note (Optional)
              <input
                type="text"
                name="concern"
                value={form.concern}
                onChange={update}
                placeholder="e.g. Back stiffness, pain while bending"
              />
            </label>

            {status === "invalid" && (
              <div className="auto-enquiry-status error">
                Please enter full name and a valid 10-digit mobile number.
              </div>
            )}
            {status === "error" && (
              <div className="auto-enquiry-status error">
                Failed to send online. Please call +91 9793093316 directly.
              </div>
            )}

            <button
              type="submit"
              className="auto-enquiry-submit-btn"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Submitting..." : "Confirm Consultation Booking ➔"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function App() {
  const [showDoctorPortal, setShowDoctorPortal] = useState(() => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash;
    const path = window.location.pathname;
    const saved = localStorage.getItem("active_portal");
    if (hash === "#doctor" || path.startsWith("/doctor")) return true;
    if (hash === "#patient" || path.startsWith("/patient")) return false;
    return saved === "doctor";
  });
  const [showPatientPortal, setShowPatientPortal] = useState(() => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash;
    const path = window.location.pathname;
    const saved = localStorage.getItem("active_portal");
    if (hash === "#doctor" || path.startsWith("/doctor")) return false;
    if (hash === "#patient" || path.startsWith("/patient")) return true;
    if (saved === "doctor" || saved === "closed") return false;
    return saved === "patient";
  });
  const [showAutoEnquiry, setShowAutoEnquiry] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      localStorage.getItem("vindhy_app_installed") === "true"
    );
  });
  const [isMobileDevice, setIsMobileDevice] = useState(() => {
    if (typeof window === "undefined") return false;
    return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || window.innerWidth <= 768;
  });

  const themeProps = useTheme();

  const openDoctorPortal = () => {
    try {
      localStorage.setItem("active_portal", "doctor");
      window.location.hash = "doctor";
    } catch (e) {}
    setShowDoctorPortal(true);
    setShowPatientPortal(false);
  };

  const closeDoctorPortal = () => {
    try {
      localStorage.setItem("active_portal", "closed");
      if (window.location.hash === "#doctor") {
        history.replaceState(null, "", window.location.pathname);
      }
    } catch (e) {}
    setShowDoctorPortal(false);
  };

  const openPatientPortal = () => {
    try {
      localStorage.setItem("active_portal", "patient");
      window.location.hash = "patient";
    } catch (e) {}
    setShowPatientPortal(true);
    setShowDoctorPortal(false);
  };

  const closePatientPortal = () => {
    try {
      localStorage.setItem("active_portal", "closed");
      if (window.location.hash === "#patient") {
        history.replaceState(null, "", window.location.pathname);
      }
    } catch (e) {}
    setShowPatientPortal(false);
  };

  // Anti-Inspect & Client Security Protections
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I / Cmd+Option+I (Inspect DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U / Cmd+Option+U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's' || e.keyCode === 83) && !e.shiftKey) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPWAInstallPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      localStorage.setItem('vindhy_app_installed', 'true');
      setShowDownloadModal(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    const handleResize = () => {
      setIsMobileDevice(/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const dismissed = sessionStorage.getItem('vindhy_download_prompt_dismissed');

    let timer;
    const isPortalActive =
      window.location.hash === "#doctor" ||
      window.location.hash === "#patient" ||
      window.location.pathname.startsWith("/doctor") ||
      window.location.pathname.startsWith("/patient") ||
      showDoctorPortal ||
      showPatientPortal;

    // Trigger Download App popup after user has explored the website (not immediately on first touch)
    if (!isStandalone && !isAppInstalled && !dismissed && !isPortalActive) {
      timer = setTimeout(() => {
        setShowDownloadModal(true);
      }, 12000);
    }

    const checkHash = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === "#doctor" || path.startsWith("/doctor")) {
        try { localStorage.setItem("active_portal", "doctor"); } catch (e) {}
        setShowDoctorPortal(true);
        setShowPatientPortal(false);
        setShowDownloadModal(false);
      } else if (hash === "#patient" || path.startsWith("/patient")) {
        try { localStorage.setItem("active_portal", "patient"); } catch (e) {}
        setShowPatientPortal(true);
        setShowDoctorPortal(false);
        setShowDownloadModal(false);
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("hashchange", checkHash);
    };
  }, [isMobileDevice, isAppInstalled, showDoctorPortal, showPatientPortal]);

  // Automatic Enquiry Pop-up Form after 5 seconds of exploring
  // Constraints:
  // 1. Never show for phone app (only for website)
  // 2. Never show if user already has an account or is a doctor
  // 3. Never show if currently inside Doctor Portal or Patient Portal
  // 4. Appear ONLY ONCE EVER for new visitors on website (never again after app/browser is closed & reopened)
  useEffect(() => {
    const isStandalone = typeof window !== "undefined" && (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      localStorage.getItem("vindhy_app_installed") === "true"
    );
    if (isStandalone || isAppInstalled) return;

    const hasDoctorAccount = !!localStorage.getItem("doctor_token") || localStorage.getItem("doctorLoggedIn") === "true";
    const hasPatientAccount = !!localStorage.getItem("vindhy_patient_token") || !!localStorage.getItem("vindhy_patient_profile");
    if (hasDoctorAccount || hasPatientAccount) return;

    if (showDoctorPortal || showPatientPortal) return;

    const hasDismissed = sessionStorage.getItem("vindhy_auto_enquiry_dismissed") === "true";
    if (hasDismissed) return;

    let triggered = false;
    const handleScroll = () => {
      if (triggered) return;
      if (window.scrollY > 280) {
        triggered = true;
        setShowAutoEnquiry(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showDoctorPortal, showPatientPortal]);

  const handleCloseAutoEnquiry = () => {
    try {
      sessionStorage.setItem("vindhy_auto_enquiry_dismissed", "true");
    } catch (e) {}
    setShowAutoEnquiry(false);
  };

  const handleDismissDownload = () => {
    sessionStorage.setItem('vindhy_download_prompt_dismissed', 'true');
    setShowDownloadModal(false);
  };

  const isTabletOrPhone = typeof window !== "undefined" && (
    /android|iphone|ipad|ipod|mobile|tablet/i.test(navigator.userAgent) ||
    window.innerWidth <= 1024
  );
  const canShowDownloadBtn = isTabletOrPhone && !isAppInstalled && !showDoctorPortal && !showPatientPortal;

  // Lock background body scroll when doctor or patient portal is active
  useEffect(() => {
    const isPortalActive = showDoctorPortal || showPatientPortal;
    if (isPortalActive) {
      document.body.classList.add("portal-active");
      document.documentElement.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.classList.remove("portal-active");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("portal-active");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showDoctorPortal, showPatientPortal]);

  return (
    <div className={`app-root ${themeProps.resolvedTheme}`}>
        <AppUpdateNotifier />
        <Header
          onOpenDoctorPortal={openDoctorPortal}
          onOpenPatientPortal={openPatientPortal}
          onOpenDownloadApp={() => setShowDownloadModal(true)}
          themeProps={themeProps}
        />
        <main>
          <Hero />
          <QuickActions />
          <LeadConsultant />
          <Treatments />
          <BodyMap />
          <Programs />
          <PatientFAQSection />
          <Assessment />
          <Testimonials />
        </main>
        <Footer
          onOpenDoctorPortal={openDoctorPortal}
          onOpenPatientPortal={openPatientPortal}
          isDark={themeProps.isDark}
        />

        <WhatsAppFloating />

        <AutoEnquiryModal
          isOpen={showAutoEnquiry && !showDoctorPortal && !showPatientPortal}
          onClose={handleCloseAutoEnquiry}
        />

        <AppDownloadModal
          isOpen={showDownloadModal && !showDoctorPortal && !showPatientPortal}
          onClose={handleDismissDownload}
          deferredPrompt={deferredPrompt}
          onInstalled={() => setIsAppInstalled(true)}
        />

        {/* Doctor Portal Modal / View */}
        {showDoctorPortal && (
          <ErrorBoundary fallbackMessage="Doctor Portal session is ready. Tap to reload.">
            <DoctorPortal
              onClose={closeDoctorPortal}
              themeProps={themeProps}
            />
          </ErrorBoundary>
        )}

        {/* Patient Recovery Portal Modal / View */}
        {showPatientPortal && (
          <ErrorBoundary fallbackMessage="Patient Health Portal session is ready. Tap to enter.">
            <PatientPortal
              onClose={closePatientPortal}
              themeProps={themeProps}
            />
          </ErrorBoundary>
        )}
      </div>
  );
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
