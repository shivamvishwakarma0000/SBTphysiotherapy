import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import DoctorPortal from "./DoctorPortal";

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
  ["Comprehensive Clinical Screen", "In-depth diagnostic movement screen, pain history, joint biomechanics, and recovery mapping."],
  ["Personalized Therapy Protocol", "A staged rehabilitation blueprint progressing from acute pain relief to strength, mobility, and confidence."],
  ["Hands-On Advanced Modalities", "Manual therapy, joint mobilization, cupping therapy, IFT/TENS, and neuromuscular retraining."],
  ["Long-Term Strength & Prevention", "Targeted corrective exercises, ergonomic posture strategy, and home exercise routines to prevent relapse."]
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

function ClinicLogo() {
  return (
    <div className="clinic-logo-wrap">
      <img
        src="/vindhya-logo-transparent.png"
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '6px', verticalAlign: 'middle' }}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
  );
}

function Header({ onOpenDoctorPortal }) {
  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Vindhya Physio & Rehab Center home">
        <ClinicLogo />
      </a>
      <nav aria-label="Primary navigation">
        {navItems.map(([label, href]) => (
          <a href={href} key={href}>{label}</a>
        ))}
      </nav>
      <div className="header-actions-group">
        <button
          className="doctor-portal-pill-btn"
          onClick={onOpenDoctorPortal}
          title="Doctor Login & Clinic Management"
        >
          🔒 Doctor Portal
        </button>
        <a className="header-cta" href="#consultation">Book Consultation</a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="home" className="hero">
      <div className="live-clinic-status-bar">
        <span className="status-live-dot"></span>
        <strong>CLINIC OPEN IN VINDHYACHAL, MIRZAPUR</strong> • Timings: 9:00 AM – 8:00 PM • Call: +91 9793093316
      </div>

      <div className="hero-inner">
        <div className="hero-copy fade-up">
          <p className="eyebrow">ADVANCED PHYSIOTHERAPY & REHABILITATION CENTER</p>
          <h1>Move Better.<br />Feel Better.<br />Live Better.</h1>
          <p className="lead">
            Expert clinical rehabilitation for acute & chronic pain, cupping therapy, neuro & paralysis recovery, sports injury conditioning, and post-surgical rehabilitation under <strong>DR. SATYAM VISHWAKARMA</strong>.
          </p>
          <div className="hero-actions">
            <a className="primary-btn" href="#consultation">Start Free Consultation</a>
            <a className="secondary-btn" href={`tel:${phonePrimary}`}><CallIcon /> Call +91 9793093316</a>
          </div>
        </div>
        <aside className="doctor-card fade-up">
          <div className="doctor-photo-wrapper">
            <img src="/doctor.png" className="doctor-photo" alt="Dr. Satyam Vishwakarma - Consultant Physiotherapist" />
          </div>
          <div className="doctor-card-content">
            <p>Lead Clinician & Consultant</p>
            <h2>DR. SATYAM VISHWAKARMA</h2>
            <span>Consultant Physiotherapist | BPT, DPT, CCYP (BHU)</span>
            <div className="mini-tags">
              <strong>Spine & Back Pain</strong>
              <strong>Cupping Therapy</strong>
              <strong>Neuro & Paralysis</strong>
              <strong>CP Child Rehab</strong>
              <strong>Sports Injury</strong>
              <strong>Post-Surgical</strong>
            </div>
          </div>
        </aside>
      </div>
      <div className="stats-strip">
        {stats.map(([value, label]) => (
          <div key={value}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Treatments() {
  return (
    <section id="treatments" className="section">
      <div className="section-heading">
        <p className="eyebrow">SPECIALIZED CLINICAL SERVICES</p>
        <h2>Targeted rehabilitation pathways designed for rapid pain relief & long-term mobility.</h2>
      </div>
      <div className="treatment-grid">
        {treatments.map(([icon, title, copy, image, tag]) => (
          <article className="treatment-card" key={title} style={{ "--treatment-image": `url("${image}")` }}>
            <span className="card-badge">{tag}</span>
            <LineIcon type={icon} />
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BodyMap() {
  const handleBook = (title) => {
    window.dispatchEvent(new CustomEvent("prefill-assessment", { detail: title }));
  };

  return (
    <section id="body-map" className="section body-section">
      <div className="section-heading center">
        <p className="eyebrow">12 BODY REGIONS & DIAGNOSTICS</p>
        <h2>Select your pain region to pinpoint targeted clinical care.</h2>
      </div>
      <div className="body-grid">
        {bodyProblems.map(([icon, title, copy, number, image]) => (
          <article className="new-body-card" key={title}>
            <div className="card-image-box">
              {image ? <img src={image} alt={title} /> : <div className="placeholder-img" />}
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
                >
                  Explore
                </a>
                <a href="#consultation" className="book-btn" onClick={() => handleBook(title)}>
                  Consult Now
                </a>
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
    <section id="programs" className="programs">
      <div className="program-copy">
        <p className="eyebrow">CLINICAL METHODOLOGY</p>
        <h2>Structured therapy programs engineered for lasting recovery.</h2>
        <p>
          At <strong>Vindhya Physio & Rehab Center</strong>, every patient journey begins with diagnostic evaluation, progressing systematically through pain management, tissue healing, functional strengthening, and relapse prevention.
        </p>
      </div>
      <div className="program-stack">
        {programs.map(([title, copy], index) => (
          <article key={title}>
            <span>0{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Heritage() {
  return (
    <section id="heritage" className="section heritage">
      <div>
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
            <span></span>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </article>
        ))}
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
      setSelectedPainArea(e.detail);
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
      // Direct Server & Real-time Google Sheets Cloud Sync
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to save enquiry");

      setStatus("success");
      setForm({ name: "", phone: "", appointmentDate: "", concern: "" });
      setCustomPainArea("");
      setCustomDuration("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="consultation" className="portal">
      <div className="portal-shell">
        <div className="portal-info">
          <p className="eyebrow">DIRECT CLINIC CONSULTATION</p>
          <h2>Book your clinical appointment today.</h2>
          <p>
            Share your symptoms and preferred date. Dr. Satyam Vishwakarma and the clinic team will reach out directly for your appointment triage.
          </p>
          <div className="contact-panel">
            <a href={`tel:${phonePrimary}`}><CallIcon /> Call +91 9793093316</a>
            <a href={`https://api.whatsapp.com/send?phone=91${phoneWhatsApp}&text=${encodeURIComponent("Hello Dr. Satyam Vishwakarma, I would like to book a physiotherapy consultation.")}`}><WhatsAppIcon /> WhatsApp +91 8382024264</a>
          </div>
          <div className="location-badge-box">
            <strong>📍 Clinic Address:</strong>
            <span>{clinicAddress}</span>
          </div>
        </div>
        <form className="assessment-card" onSubmit={submit}>
          <div className="form-grid">
            
            {/* Condition Dropdown with Custom option */}
            <label>
              Pain Area / Clinical Condition *
              <select
                value={selectedPainArea}
                onChange={(e) => setSelectedPainArea(e.target.value)}
              >
                <option value="Spine & Back Pain">Spine & Back Pain (Slip Disc / Sciatica)</option>
                <option value="Cup Therapy / Cupping">Cup Therapy / Cupping Therapy</option>
                <option value="Neuro Rehabilitation">Neuro Rehabilitation (Parkinson's / Balance)</option>
                <option value="Paralysis Rehabilitation">Paralysis Rehabilitation & Gait Retraining</option>
                <option value="Stroke Recovery">Stroke Recovery & Mobility</option>
                <option value="CP (Child) Therapy">CP (Child) Therapy / Pediatric Rehab</option>
                <option value="Sports Injury Rehab">Sports Injury & Ligament Recovery</option>
                <option value="Post-Surgical Rehab">Post-Surgical Knee / Shoulder Rehab</option>
                <option value="Neck & Cervical Spondylosis">Neck & Cervical Spondylosis</option>
                <option value="Frozen Shoulder">Frozen Shoulder & Rotator Cuff</option>
                <option value="Knee Arthritis & ACL">Knee Arthritis & ACL Pain</option>
                <option value="Hip & Pelvis Pain">Hip & Pelvis Pain</option>
                <option value="Wrist / Hand / Tennis Elbow">Wrist / Hand / Tennis Elbow</option>
                <option value="Ankle Sprain & Heel Pain">Ankle Sprain & Plantar Fasciitis</option>
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
    <section className="section">
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

      {/* Infinite Auto-Scrolling Testimonial Marquee (Pauses on Hover) */}
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

function Footer({ onOpenDoctorPortal }) {
  return (
    <footer id="contact" className="footer">
      <div>
        <div className="footer-brand">
          <ClinicLogo />
          <h2>DR. SATYAM VISHWAKARMA</h2>
        </div>
        <p>Consultant Physiotherapist | BPT, DPT, CCYP (BHU)</p>
        <p style={{ marginTop: '8px', color: 'var(--muted)', fontSize: '0.9rem' }}>
          {clinicAddress}
        </p>
      </div>
      <div>
        <h3>Clinic Contact</h3>
        <a href={`tel:${phonePrimary}`}><CallIcon /> Call: +91 9793093316</a>
        <a href={`https://api.whatsapp.com/send?phone=91${phoneWhatsApp}&text=${encodeURIComponent("Hello Dr. Satyam Vishwakarma, I want to connect regarding physiotherapy appointment.")}`}><WhatsAppIcon /> WhatsApp: +91 8382024264</a>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '10px' }}>
          Open Monday – Saturday | Timing: 9:00 AM – 8:00 PM
        </p>
      </div>
      <div>
        <h3>Clinical Services</h3>
        <a href="#treatments">Spine & Back Pain</a>
        <a href="#treatments">Cupping Therapy</a>
        <a href="#treatments">Neuro & Paralysis Rehab</a>
        <a href="#treatments">CP (Child) Therapy</a>
        <a href="#treatments">Sports Injury & Post-Surgical</a>
      </div>
      <div>
        <h3>Doctor Access & Location</h3>
        <button
          className="footer-doctor-portal-btn"
          onClick={onOpenDoctorPortal}
        >
          🔒 Doctor Portal Login
        </button>
        <iframe
          className="map-frame"
          title="Vindhyachal Mirzapur Uttar Pradesh map"
          loading="lazy"
          src="https://www.openstreetmap.org/export/embed.html?bbox=82.48%2C25.10%2C82.60%2C25.20&layer=mapnik&marker=25.1337%2C82.5644"
        ></iframe>
      </div>
    </footer>
  );
}

function App() {
  const [showDoctorPortal, setShowDoctorPortal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#doctor" || window.location.pathname.startsWith("/doctor")) {
        setShowDoctorPortal(true);
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  return (
    <div className="app-root dark">
      <Header onOpenDoctorPortal={() => setShowDoctorPortal(true)} />
      <main>
        <Hero />
        <Treatments />
        <BodyMap />
        <Programs />
        <Heritage />
        <Assessment />
        <Testimonials />
      </main>
      <Footer onOpenDoctorPortal={() => setShowDoctorPortal(true)} />

      {/* Doctor Portal Modal / View */}
      {showDoctorPortal && (
        <DoctorPortal onClose={() => setShowDoctorPortal(false)} />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
