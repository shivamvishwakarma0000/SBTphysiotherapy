import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import DoctorPortal from "./DoctorPortal";
import PatientPortal from "./PatientPortal";
import { api } from "./apiService";
import { useTheme } from "./useTheme";
import ThemeToggle from "./ThemeToggle";

const phonePrimary = "9793093316";
const phoneWhatsApp = "8382024264";
const clinicAddress = "Amravati Chauraha, Vindhyachal, Mirzapur (U.P.)";

const navItems = [
  ["Home", "#home"],
  ["Clinical Services", "#treatments"],
  ["Body Map", "#body-map"],
  ["Rehab Pathways", "#programs"],
  ["BHU Heritage", "#heritage"],
  ["Consultation", "#consultation"],
  ["Contact", "#contact"]
];

const stats = [
  ["BPT, DPT", "Clinical Diagnostics & Therapeutics"],
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
  ["Clinical Foundation & Training", "Advanced diagnostic expertise and clinical therapeutics strengthened through BPT & DPT degrees."],
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

function ClinicLogo({ isDark = false }) {
  return (
    <div className="clinic-logo-wrap">
      <img
        src="/vindhya-receipt-logo.png"
        alt="Vindhya Physio & Rehab Center"
        className="clinic-logo-img"
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

function Header({ onOpenDoctorPortal, onOpenPatientPortal, onOpenDownloadApp, showDownloadBtn, themeProps }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDark = false;

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#home" aria-label="Vindhya Physio & Rehab Center home" onClick={handleNavClick}>
            <ClinicLogo isDark={isDark} />
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map(([label, href]) => (
              <a href={href} key={href}>{label}</a>
            ))}
          </nav>

          <div className="header-actions-group">
            {showDownloadBtn && (
              <button
                className="header-rect-btn download-app-rect-btn"
                onClick={() => { setMobileMenuOpen(false); onOpenDownloadApp(); }}
                title="Download & Install Clinic App"
                aria-label="Download App"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="rect-btn-text">Download App</span>
                <span className="rect-btn-text-short">App</span>
              </button>
            )}
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
            <a className="header-cta desktop-only-cta" href="#consultation">Book Consultation</a>

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
              <ClinicLogo isDark={false} />
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
              {showDownloadBtn && (
                <button
                  className="mobile-drawer-btn download-btn"
                  onClick={() => { setMobileMenuOpen(false); onOpenDownloadApp(); }}
                >
                  <span>📲</span> Download Clinic App
                </button>
              )}
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
              <a
                href="#consultation"
                className="mobile-drawer-cta"
                onClick={handleNavClick}
              >
                Book In-Clinic Consultation
              </a>
              <a
                href={`tel:${phonePrimary}`}
                className="mobile-drawer-call"
              >
                <CallIcon /> Call +91 9793093316
              </a>
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
            <div className="hero-rehab-badge">
              <span className="rehab-pulse-dot"></span>
              <span>Targeted Mobility & Pain Recovery</span>
            </div>
          </div>
        </div>
        <div className="hero-actions hero-actions-centered">
          <a className="primary-btn hero-consult-btn" href="#consultation">Book Consultation</a>
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
          </div>
        </div>
        <div className="consultant-info-side">
          <p className="consultant-eyebrow">CHIEF PHYSIOTHERAPIST & FOUNDER</p>
          <h2>Dr. Satyam Vishwakarma</h2>
          <p className="consultant-qualification">
            Consultant Physiotherapist • BPT, DPT, CCYP (BHU)
          </p>
          <p className="consultant-bio">
            Dedicated to restoring natural, pain-free movement through clinical diagnostics and advanced rehabilitation. Trained at Banaras Hindu University (BHU), Dr. Satyam specializes in non-surgical spine decompression, paralysis rehabilitation, cupping therapy, pediatric care, and sports injury recovery.
          </p>
          <div className="consultant-specialties">
            <span>Spine & Back Pain</span>
            <span>Cupping Therapy</span>
            <span>Neuro & Paralysis</span>
            <span>CP Child Rehab</span>
            <span>Sports Injury</span>
            <span>Post-Surgical</span>
          </div>
          <div className="consultant-btn-group">
            <a href="#consultation" className="primary-btn consultant-book-btn">Book Consultation With Dr. Satyam</a>
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
                  href={`https://www.google.com/search?q=${encodeURIComponent("Vindhya Physio " + title + " treatment")}`}
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
          At <strong>Vindhya Physio & Rehab Center</strong>, every patient journey begins with diagnostic evaluation, progressing systematically through pain management, tissue healing, functional strengthening, and relapse prevention.
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

function Heritage() {
  return (
    <section id="heritage" className="section heritage-section">
      <div className="heritage-grid">
        <div className="heritage-content">
          <p className="eyebrow">BANARAS HINDU UNIVERSITY DEPTH</p>
          <h2>Clinical diagnostic rigor paired with therapeutic movement science.</h2>
          <p>
            <strong>DR. SATYAM VISHWAKARMA</strong> combines clinical physiotherapy education (BPT, DPT) with CCYP training from Banaras Hindu University (BHU), creating an integrative model of care focused on musculoskeletal health, neuromuscular retraining, and long-term functional recovery.
          </p>
          <div className="credential-row">
            <span>BPT</span>
            <span>DPT</span>
            <span>CCYP (BHU)</span>
            <span>Consultant Physiotherapist</span>
          </div>
        </div>
        <div className="timeline">
          {timeline.map(([title, copy]) => (
            <article key={title}>
              <span className="timeline-node"></span>
              <div className="timeline-box">
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Assessment() {
  const [selectedPainArea, setSelectedPainArea] = useState("Spine & Back Pain");
  const [customPainArea, setCustomPainArea] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("1-3 months");
  const [customDuration, setCustomDuration] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    appointmentDate: "",
    concern: ""
  });
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const handlePrefill = (e) => {
      if (e.detail) {
        setSelectedPainArea(e.detail);
      }
    };
    window.addEventListener("prefill-assessment", handlePrefill);
    return () => window.removeEventListener("prefill-assessment", handlePrefill);
  }, []);

  const finalPainArea = selectedPainArea === "custom" ? (customPainArea || "Custom Condition") : selectedPainArea;
  const finalDuration = selectedDuration === "custom" ? (customDuration || "Custom Duration") : selectedDuration;

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
    const payload = {
      ...form,
      painArea: finalPainArea,
      duration: finalDuration,
      phone: form.phone.trim()
    };

    try {
      await api.createEnquiry(payload);
      setStatus("success");
      setForm({ name: "", phone: "", appointmentDate: "", concern: "" });
      setCustomPainArea("");
      setCustomDuration("");
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
            <a href={`https://api.whatsapp.com/send?phone=91${phoneWhatsApp}&text=${encodeURIComponent("Hello Dr. Satyam Vishwakarma, I would like to book a physiotherapy consultation.")}`} target="_blank" rel="noreferrer" className="contact-wa-btn"><WhatsAppIcon /> WhatsApp: +91 8382024264</a>
          </div>
          <div className="location-badge-box">
            <strong>📍 Clinic Location:</strong>
            <span>{clinicAddress}</span>
            <span className="timing-note">Mon – Sat: 9:00 AM – 8:00 PM</span>
          </div>
        </div>
        <form className="assessment-card" onSubmit={submit}>
          <div className="form-heading-row">
            <h3>Consultation Request</h3>
            <span className="form-subnote">Direct Clinic Triage</span>
          </div>
          <div className="form-grid">
            {/* Condition Dropdown with Custom option */}
            <label>
              Pain Area / Clinical Condition *
              <select
                value={selectedPainArea}
                onChange={(e) => setSelectedPainArea(e.target.value)}
              >
                {!["Spine & Back Pain", "Cup Therapy / Cupping", "Neuro Rehabilitation", "Paralysis Rehabilitation", "Stroke Recovery", "CP (Child) Therapy", "Sports Injury Rehab", "Post-Surgical Rehab", "Neck & Cervical", "Shoulder & Rotator Cuff", "Elbow & Forearm", "Wrist & Hand", "Upper Back & Thoracic", "Lower Back & Sciatica", "Hip & Pelvis", "Knee & ACL", "Ankle & Foot", "Sports Trauma", "Paralysis & Neuro Care", "Post-Surgery Recovery", "General Physiotherapy"].includes(selectedPainArea) && selectedPainArea !== "custom" && (
                  <option value={selectedPainArea}>{selectedPainArea}</option>
                )}
                <option value="Spine & Back Pain">Spine & Back Pain (Slip Disc / Sciatica)</option>
                <option value="Cup Therapy / Cupping">Cup Therapy / Cupping Therapy</option>
                <option value="Neuro Rehabilitation">Neuro Rehabilitation (Parkinson's / Balance)</option>
                <option value="Paralysis Rehabilitation">Paralysis Rehabilitation & Gait Retraining</option>
                <option value="Stroke Recovery">Stroke Recovery & Mobility</option>
                <option value="CP (Child) Therapy">CP (Child) Therapy / Pediatric Rehab</option>
                <option value="Sports Injury Rehab">Sports Injury & Ligament Recovery</option>
                <option value="Post-Surgical Rehab">Post-Surgical Knee / Shoulder Rehab</option>
                <option value="Neck & Cervical">Neck & Cervical Spondylosis</option>
                <option value="Shoulder & Rotator Cuff">Shoulder & Rotator Cuff / Frozen Shoulder</option>
                <option value="Elbow & Forearm">Elbow & Forearm (Tennis / Golfer's Elbow)</option>
                <option value="Wrist & Hand">Wrist & Hand (Carpal Tunnel / Tendonitis)</option>
                <option value="Upper Back & Thoracic">Upper Back & Thoracic Pain</option>
                <option value="Lower Back & Sciatica">Lower Back & Sciatica (L4-L5 Disc)</option>
                <option value="Hip & Pelvis">Hip & Pelvis Pain</option>
                <option value="Knee & ACL">Knee & ACL / Arthritis Rehabilitation</option>
                <option value="Ankle & Foot">Ankle & Foot (Sprain / Plantar Fasciitis)</option>
                <option value="Sports Trauma">Sports Trauma & Performance Recovery</option>
                <option value="Paralysis & Neuro Care">Paralysis & Neuro Care</option>
                <option value="Post-Surgery Recovery">Post-Surgery Recovery</option>
                <option value="General Physiotherapy">General Physiotherapy / Body Aches</option>
                <option value="custom">✏️ Other / Custom Condition (Write Your Own)...</option>
              </select>
            </label>

            {/* Custom Condition */}
            {selectedPainArea === "custom" && (
              <label>
                Enter Your Specific Condition / Pain Region *
                <input
                  type="text"
                  required
                  value={customPainArea}
                  onChange={(e) => setCustomPainArea(e.target.value)}
                  placeholder="e.g. Sharp pain in lower ribs when bending"
                />
              </label>
            )}

            {/* Duration Dropdown with Custom option */}
            <label>
              Duration of Symptoms *
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
              >
                <option value="Less than a week">Less than a week (Acute)</option>
                <option value="1-4 weeks">1 to 4 weeks</option>
                <option value="1-3 months">1 to 3 months</option>
                <option value="3-6 months">3 to 6 months</option>
                <option value="Chronic 6+ months">Chronic (6+ months / years)</option>
                <option value="custom">✏️ Custom Duration (Write Your Own)...</option>
              </select>
            </label>

            {/* Custom Duration */}
            {selectedDuration === "custom" && (
              <label>
                Enter Custom Duration *
                <input
                  type="text"
                  required
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="e.g. 2 years, since cricket match yesterday"
                />
              </label>
            )}

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
            <label className="wide">
              Preferred Date of Visit
              <input name="appointmentDate" type="date" value={form.appointmentDate} onChange={update} />
            </label>
            <label className="wide">
              Tell Us About Your Symptoms / Medical History
              <textarea name="concern" value={form.concern} onChange={update} placeholder="Describe how pain started, surgical history, or previous treatments..." rows="3" />
            </label>
          </div>
          <button className="primary-btn form-submit" type="submit">Submit Consultation Request</button>
          {status === "invalid" && <p className="form-status">Please enter a valid patient name and 10-digit Indian mobile number.</p>}
          {status === "loading" && <p className="form-status">Submitting consultation request...</p>}
          {status === "success" && <p className="form-status success">Consultation request received! Our clinic team will call you shortly.</p>}
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
      const saved = localStorage.getItem("vindhya_clinic_location");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      address: "Amravati Chauraha, Vindhyachal, Mirzapur (U.P.)",
      lat: 25.1337,
      lng: 82.5644
    };
  });

  useEffect(() => {
    const handleLocUpdate = (e) => {
      if (e.detail) setClinicLoc(e.detail);
    };
    window.addEventListener("clinic-location-updated", handleLocUpdate);
    return () => window.removeEventListener("clinic-location-updated", handleLocUpdate);
  }, []);

  const lat = parseFloat(clinicLoc.lat) || 25.1337;
  const lng = parseFloat(clinicLoc.lng) || 82.5644;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <footer id="contact" className="site-footer">
      <div className="footer-inner">
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <ClinicLogo isDark={isDark} />
            <h2>DR. SATYAM VISHWAKARMA</h2>
          </div>
          <p className="footer-credentials">Consultant Physiotherapist | BPT, DPT, CCYP (BHU)</p>
          <p className="footer-address">
            📍 {clinicLoc.address || clinicAddress}
          </p>
          <div className="footer-portal-buttons">
            <button className="footer-pill-btn patient" onClick={onOpenPatientPortal}>
              👤 Patient Portal
            </button>
            <button className="footer-pill-btn doctor" onClick={onOpenDoctorPortal}>
              🔒 Doctor Portal
            </button>
          </div>
        </div>
        <div className="footer-col contact-col">
          <h3>Clinic Contact & Timings</h3>
          <a href={`tel:${phonePrimary}`} className="footer-link"><CallIcon /> Call: +91 9793093316</a>
          <a href={`https://api.whatsapp.com/send?phone=91${phoneWhatsApp}&text=${encodeURIComponent("Hello Dr. Satyam Vishwakarma, I want to connect regarding physiotherapy appointment.")}`} target="_blank" rel="noreferrer" className="footer-link"><WhatsAppIcon /> WhatsApp: +91 8382024264</a>
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
          <iframe
            className="footer-map-frame"
            title="Vindhyachal Mirzapur clinic location map"
            loading="lazy"
            src={mapSrc}
          ></iframe>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="footer-map-link"
          >
            ↗ Open in Google Maps
          </a>
        </div>
      </div>
      <div className="footer-bottom-bar">
        <p>© {new Date().getFullYear()} Vindhya Physio & Rehab Center. All rights reserved. Dr. Satyam Vishwakarma (BPT, DPT, CCYP BHU).</p>
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

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          sessionStorage.setItem('vindhya_download_prompt_dismissed', 'true');
          localStorage.setItem('vindhya_app_installed', 'true');
          if (onInstalled) onInstalled();
        }
      } catch (err) {
        console.log("Install prompt error:", err);
      }
      onClose();
    } else if (isIOS) {
      localStorage.setItem('vindhya_app_installed', 'true');
      if (onInstalled) onInstalled();
      onClose();
    } else {
      localStorage.setItem('vindhya_app_installed', 'true');
      if (onInstalled) onInstalled();
      alert("To install the official app, tap your browser's menu (⋮ or Share icon) and select 'Install app' or 'Add to Home Screen'.");
      onClose();
    }
  };

  const handleIOSGotIt = () => {
    localStorage.setItem('vindhya_app_installed', 'true');
    if (onInstalled) onInstalled();
    onClose();
  };

  return (
    <div className="app-download-modal-overlay" onClick={onClose}>
      <div className="app-download-card" onClick={(e) => e.stopPropagation()}>
        <button className="download-modal-close" onClick={onClose} aria-label="Close modal">✕</button>
        
        <div className="app-download-header">
          <img
            src="/icon-192.png"
            alt="Vindhya Physio & Rehab Center"
            className="app-download-logo"
          />
          <div className="app-download-meta">
            <h3>Get the Vindhya App 📱</h3>
            <span className="app-download-badge">Official Clinic App</span>
          </div>
        </div>

        <ul className="app-download-benefits">
          <li>✓ Fast consultation booking & appointment tracking</li>
          <li>✓ View visits, receipts & doctor notes in Patient Portal</li>
          <li>✓ Access guided home exercises & recovery plans</li>
        </ul>

        {isIOS ? (
          <div className="ios-install-steps">
            <strong>📲 How to Install on iPhone / iPad:</strong>
            <ol>
              <li>Tap the <strong>Share</strong> icon <span className="ios-icon">⎋</span> at the bottom of Safari.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong> <span className="ios-icon">⊞</span>.</li>
              <li>Tap <strong>Add</strong> at top right corner.</li>
            </ol>
            <div className="download-modal-actions" style={{ marginTop: "14px" }}>
              <button className="primary-btn download-btn" onClick={handleIOSGotIt} style={{ width: "100%" }}>
                Got It & Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="download-modal-actions">
            <button className="primary-btn download-btn" onClick={handleDownload}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Install App
            </button>
            <button className="secondary-btn later-btn" onClick={onClose}>
              Maybe Later
            </button>
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
    concern: ""
  });
  const [status, setStatus] = useState("idle"); // idle, loading, success, error, invalid

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
        phone: cleanPhone,
        painArea: form.painArea,
        concern: form.concern.trim() || "Automatic 5-second website exploration enquiry",
        duration: "Direct Online Enquiry"
      });
      setStatus("success");
      try {
        localStorage.setItem("vindhya_auto_enquiry_ever_shown", "true");
      } catch (e) {}
      setTimeout(() => {
        onClose();
      }, 2500);
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
          title="Close and explore website"
          aria-label="Close enquiry popup"
        >
          ✕
        </button>

        <div className="auto-enquiry-badge">
          <span>🩺 Free Consultation Triage</span>
        </div>

        <h3 className="auto-enquiry-title">Need Expert Physio Guidance?</h3>
        <p className="auto-enquiry-desc">
          Tell us about your pain or condition. Dr. Satyam Vishwakarma & our clinic team will reach out directly for advice.
        </p>

        {status === "success" ? (
          <div className="auto-enquiry-status success">
            🎉 <strong>Enquiry Submitted!</strong><br />
            Dr. Satyam's clinic team will call you at +91 {form.phone} shortly.
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
              Mobile Number (10 Digits) *
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
              Pain Area / Clinical Condition *
              <select name="painArea" value={form.painArea} onChange={update}>
                <option value="Spine & Back Pain (Sciatica / Slip Disc)">Spine & Lower Back Pain (Sciatica / Disc Bulge)</option>
                <option value="Cupping Therapy / Hijama">Cupping Therapy / Pain Relief</option>
                <option value="Cervical & Neck Spondylosis">Cervical & Neck Pain (Tech Neck)</option>
                <option value="Knee Pain & Arthritis / ACL">Knee Pain & Arthritis / ACL Recovery</option>
                <option value="Paralysis & Neuro Rehabilitation">Paralysis & Neuro Rehabilitation</option>
                <option value="Frozen Shoulder & Shoulder Pain">Frozen Shoulder & Rotator Cuff</option>
                <option value="Sports Injury Recovery">Sports Injury & Ligament Rehabilitation</option>
                <option value="Post-Surgical Rehabilitation">Post-Surgical Knee / Hip / Spine Rehab</option>
                <option value="Other Clinical Condition">Other Clinical Pain / Query</option>
              </select>
            </label>

            <label className="auto-enquiry-field">
              Describe Symptoms / Query (Optional)
              <input
                type="text"
                name="concern"
                value={form.concern}
                onChange={update}
                placeholder="e.g. Pain since 2 weeks, worse while sitting"
              />
            </label>

            {status === "invalid" && (
              <div className="auto-enquiry-status error">
                Please provide your name and a valid 10-digit mobile number.
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
              {status === "loading" ? "Submitting..." : "Send Quick Enquiry ➔"}
            </button>

            <button
              type="button"
              className="auto-enquiry-cancel-btn"
              onClick={onClose}
            >
              Cancel & Continue Exploring Website
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
    return hash === "#doctor" || path.startsWith("/doctor") || saved === "doctor";
  });
  const [showPatientPortal, setShowPatientPortal] = useState(() => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash;
    const path = window.location.pathname;
    const saved = localStorage.getItem("active_portal");
    return (
      hash === "#patient" ||
      path.startsWith("/patient") ||
      saved === "patient" ||
      !!localStorage.getItem("vindhya_patient_token")
    );
  });
  const [showAutoEnquiry, setShowAutoEnquiry] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      localStorage.getItem("vindhya_app_installed") === "true"
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

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPWAInstallPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      localStorage.setItem('vindhya_app_installed', 'true');
      setShowDownloadModal(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    const handleResize = () => {
      setIsMobileDevice(/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const dismissed = sessionStorage.getItem('vindhya_download_prompt_dismissed');

    let timer;
    const isPortalActive =
      window.location.hash === "#doctor" ||
      window.location.hash === "#patient" ||
      window.location.pathname.startsWith("/doctor") ||
      window.location.pathname.startsWith("/patient") ||
      showDoctorPortal ||
      showPatientPortal;

    // Trigger Download App popup on first visit for anyone landing on the website
    if (!isStandalone && !isAppInstalled && !dismissed && !isPortalActive) {
      timer = setTimeout(() => {
        setShowDownloadModal(true);
      }, 1200);
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
      localStorage.getItem("vindhya_app_installed") === "true"
    );
    if (isStandalone || isAppInstalled) return;

    const hasDoctorAccount = !!localStorage.getItem("doctor_token") || localStorage.getItem("doctorLoggedIn") === "true";
    const hasPatientAccount = !!localStorage.getItem("vindhya_patient_token") || !!localStorage.getItem("vindhya_patient_profile");
    if (hasDoctorAccount || hasPatientAccount) return;

    if (showDoctorPortal || showPatientPortal) return;

    const hasEverShown = localStorage.getItem("vindhya_auto_enquiry_ever_shown") === "true";
    if (hasEverShown) return;

    const autoTimer = setTimeout(() => {
      const stillEverShown = localStorage.getItem("vindhya_auto_enquiry_ever_shown") === "true";
      const currentlyInPortal = showDoctorPortal || showPatientPortal;
      if (!stillEverShown && !currentlyInPortal) {
        try {
          localStorage.setItem("vindhya_auto_enquiry_ever_shown", "true");
        } catch (e) {}
        setShowAutoEnquiry(true);
      }
    }, 5000);

    return () => clearTimeout(autoTimer);
  }, [showDoctorPortal, showPatientPortal, isAppInstalled]);

  const handleCloseAutoEnquiry = () => {
    try {
      localStorage.setItem("vindhya_auto_enquiry_ever_shown", "true");
    } catch (e) {}
    setShowAutoEnquiry(false);
  };

  const handleDismissDownload = () => {
    sessionStorage.setItem('vindhya_download_prompt_dismissed', 'true');
    setShowDownloadModal(false);
  };

  const canShowDownloadBtn = !isAppInstalled && !showDoctorPortal && !showPatientPortal;

  return (
    <div className={`app-root ${themeProps.resolvedTheme}`}>
      <Header
        onOpenDoctorPortal={openDoctorPortal}
        onOpenPatientPortal={openPatientPortal}
        onOpenDownloadApp={() => setShowDownloadModal(true)}
        showDownloadBtn={canShowDownloadBtn}
        themeProps={themeProps}
      />
      <main>
        <Hero />
        <QuickActions />
        <LeadConsultant />
        <Treatments />
        <BodyMap />
        <Programs />
        <Heritage />
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
        isOpen={showDownloadModal && canShowDownloadBtn && !showDoctorPortal && !showPatientPortal}
        onClose={handleDismissDownload}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setIsAppInstalled(true)}
      />


      {/* Doctor Portal Modal / View */}
      {showDoctorPortal && (
        <DoctorPortal
          onClose={closeDoctorPortal}
          themeProps={themeProps}
        />
      )}

      {/* Patient Recovery Portal Modal / View */}
      {showPatientPortal && (
        <PatientPortal
          onClose={closePatientPortal}
          themeProps={themeProps}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
