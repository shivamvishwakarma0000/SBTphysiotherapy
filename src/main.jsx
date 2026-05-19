import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const phonePrimary = "+919793093316";
const phoneSecondary = "+918382024264";
const formspreeEndpoint = "https://formspree.io/f/mnjrnylq";

const navItems = [
  ["Home", "#home"],
  ["Treatments", "#treatments"],
  ["Body Map", "#body-map"],
  ["Programs", "#programs"],
  ["BHU Heritage", "#heritage"],
  ["Portal", "#portal"],
  ["Contact", "#contact"]
];

const stats = [
  ["BPT, DPT", "Clinical physiotherapy diagnostics"],
  ["CCYP BHU", "Yoga and movement therapy"],
  ["Neuro + Sports", "Focused rehabilitation tracks"]
];

const treatments = [
  ["spine", "Spine and Disc Rehab", "Lower back pain, sciatica, disc prolapse, posture strain, and recurring stiffness.", "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1000&q=80"],
  ["runner", "Sports Injury Recovery", "Sprains, ligament injuries, shoulder overload, running pain, and return-to-sport planning.", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80"],
  ["brain", "Neuro-Rehabilitation", "Stroke, paralysis, Bell's palsy, balance, coordination, and functional retraining.", "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1000&q=80"],
  ["postop", "Post-Surgical Therapy", "Knee, shoulder, spine, fracture, and orthopedic recovery with strength progression.", "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1000&q=80"]
];

const bodyProblems = [
  ["neck", "Neck", "Cervical pain, tech neck, headaches, nerve irritation", "01", "50%", "17%", "/neck.jpg"],
  ["shoulder", "Shoulder", "Frozen shoulder, impingement, rotator cuff weakness", "02", "36%", "30%", "/shoulder.jpg"],
  ["elbow", "Elbow", "Tennis elbow, golfer's elbow, grip pain", "03", "28%", "47%", "/elbow.jpg"],
  ["hand", "Wrist & Hand", "Carpal tunnel, stiffness, post-fracture mobility", "04", "21%", "63%", "/hand.jpg"],
  ["upperback", "Upper Back", "Thoracic stiffness, posture fatigue, rib-area pain", "05", "50%", "34%", "/back.jpg"],
  ["lowerback", "Lower Back", "L4-L5 pain, disc bulge, muscle spasm, sciatica", "06", "50%", "53%", "/lowerback.jpg"],
  ["hip", "Hip", "Hip stiffness, bursitis, gait imbalance, mobility loss", "07", "42%", "66%", "/hip.jpg"],
  ["knee", "Knee", "ACL rehab, meniscus pain, arthritis, kneecap tracking", "08", "55%", "78%", "/knee.jpg"],
  ["ankle", "Ankle & Foot", "Sprain rehab, plantar fasciitis, heel pain, balance", "09", "61%", "91%", "/ankle.jpg"],
  ["trauma", "Sports Trauma", "Acute injury care, load management, performance rehab", "10", "48%", "58%", "/trauma.jpg"],
  ["stroke", "Paralysis & Stroke", "Neuro-muscular retraining and functional independence", "11", "66%", "39%", "/stroke.jpg"],
  ["postop", "Post Surgery", "Strength, range of motion, walking, return-to-work care", "12", "55%", "73%", "/postop.jpg"]
];

const programs = [
  ["Assessment First", "Movement screen, pain history, strength testing, posture review, and goal mapping."],
  ["Plan Built For You", "A staged rehab plan that progresses from pain control to confidence and performance."],
  ["Hands-On Recovery", "Manual therapy, guided exercise, mobility drills, neuromuscular control, and education."],
  ["Home Continuity", "Simple home programs and follow-up guidance so recovery continues between sessions."]
];

const timeline = [
  ["BHU Training", "Clinical foundation strengthened through BPT, DPT, and CCYP exposure."],
  ["Integrated Practice", "Physiotherapy, therapeutic yoga, strengthening, and movement retraining in one care model."],
  ["Patient-Centered Rehab", "Programs adjusted around pain, function, age, lifestyle, surgery stage, and sport demands."],
  ["Long-Term Prevention", "Education, load management, posture strategy, and recurrence prevention." ]
];

const testimonials = [
  ["Amit Singh", "L4-L5 disc prolapse", "The program was clear and progressive. Back pain reduced and walking became easier.", "5"],
  ["Neha Verma", "Knee ligament rehab", "Every exercise had a reason. I felt stronger week by week.", "5"],
  ["Rahul Mishra", "Sports shoulder injury", "Pain control and strength work were balanced very well.", "5"],
  ["Priya Tiwari", "Bell's palsy support", "The therapy was calm, structured, and practical for daily follow-up.", "5"]
];

function Crest() {
  return (
    <div className="physio-logo" aria-label="SBT Physiotherapy logo">
      <div className="logo-mark">
        <svg viewBox="0 0 48 48" aria-hidden="true" style={{ width: '38px', height: '38px' }}>
          {/* The Cross */}
          <path d="M24 4v40M4 24h40" fill="none" stroke="#20a88e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Top Left: Perfect Caduceus */}
          <g fill="#20a88e">
            {/* Staff */}
            <rect x="13.4" y="6" width="1.2" height="15" />
            <circle cx="14" cy="5" r="1.6" />
            <polygon points="13.4,21 14.6,21 14,22.5" />
            
            {/* Wings */}
            <path d="M 13.4 6.5 C 9 5.5, 6 4.5, 5 4.5 C 6 6.5, 8 7.5, 8.5 7.5 C 10 7.5, 11 8.5, 11.5 8.5 C 12.5 8.5, 13 9, 13.4 9 Z" />
            <path d="M 14.6 6.5 C 19 5.5, 22 4.5, 23 4.5 C 22 6.5, 20 7.5, 19.5 7.5 C 18 7.5, 17 8.5, 16.5 8.5 C 15.5 8.5, 15 9, 14.6 9 Z" />
          </g>
          
          <g fill="none" stroke="#20a88e" strokeWidth="1.2" strokeLinecap="round">
            {/* Snake 1 (Bottom Right to Top Left) */}
            <path d="M 16.5,20 C 10,20 10,16 14,15 C 18,14 18,10 14,9 C 11.5,8.5 11.5,10.5 12.5,10.5" />
            {/* Snake 2 (Bottom Left to Top Right) */}
            <path d="M 11.5,20 C 18,20 18,16 14,15 C 10,14 10,10 14,9 C 16.5,8.5 16.5,10.5 15.5,10.5" />
          </g>
          <circle cx="12.5" cy="10" r="0.8" fill="#20a88e" />
          <circle cx="15.5" cy="10" r="0.8" fill="#20a88e" />
          
          {/* Top Right: S */}
          <text x="34" y="15.5" fontSize="15" fill="#20a88e" stroke="none" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontWeight="900">S</text>
          
          {/* Bottom Left: B */}
          <text x="14" y="35.5" fontSize="15" fill="#20a88e" stroke="none" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontWeight="900">B</text>
          
          {/* Bottom Right: T */}
          <text x="34" y="35.5" fontSize="15" fill="#20a88e" stroke="none" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontWeight="900">T</text>
        </svg>
      </div>
      <div className="logo-type">
        <strong>SBT</strong>
        <span>PHYSIO<br />THERAPY</span>
      </div>
    </div>
  );
}

function LineIcon({ type = "runner" }) {
  return (
    <svg className="line-icon" viewBox="0 0 64 64" aria-hidden="true">
      {type === "spine" && <><path d="M32 8c8 7 8 14 1 21 8 5 10 14 0 27" /><path d="M23 14h14M22 24h16M25 34h18M24 44h15M27 54h10" /></>}
      {type === "runner" && <><circle cx="40" cy="12" r="5" /><path d="M34 22l-10 12 13 5 7 14" /><path d="M29 38L17 53M39 25l10 8 8-3M28 22l-10 2" /></>}
      {type === "brain" && <><path d="M31 12c-10 0-18 7-18 17 0 8 5 14 13 16v7h12v-7c8-2 13-8 13-16 0-10-9-17-20-17Z" /><path d="M24 29c3-5 10-5 14 0M22 38c5 4 14 4 19 0M31 12v36" /></>}
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
      {type === "stroke" && <><circle cx="22" cy="18" r="7" /><path d="M28 25l11 10 8-4M31 33l-6 16M24 49h18M14 34h13" /></>}
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

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Dr. Satyam Vishwakarma home">
        <Crest />
        <span>DR. SATYAM VISHWAKARMA</span>
      </a>
      <nav aria-label="Primary navigation">
        {navItems.map(([label, href]) => (
          <a href={href} key={href}>{label}</a>
        ))}
      </nav>
      <a className="header-cta" href="#portal">Book Free Consultation</a>
    </header>
  );
}

function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero-inner">
        <div className="hero-copy fade-up">
          <p className="eyebrow">ADVANCED PHYSIOTHERAPY | SPORTS | NEURO | POST-SURGERY</p>
          <h1>Advanced<br />Physiotherapy.</h1>
          <p className="lead">
            Premium rehabilitation care for pain relief,<br />
            mobility restoration, strength rebuilding, and<br />
            confident return to daily life or sport.
          </p>
          <div className="hero-actions">
            <a className="primary-btn" href="#portal">Start Free Consultation</a>
            <a className="secondary-btn" href={`tel:${phonePrimary}`}><CallIcon /> Call +91 9793093316</a>
          </div>
        </div>
        <aside className="doctor-card fade-up">
          <div className="doctor-photo-wrapper">
            <img src="/doctor.png" className="doctor-photo" alt="Dr. Satyam Vishwakarma" />
          </div>
          <div className="doctor-card-content">
            <p>Lead Clinician</p>
            <h2>Dr. Satyam Vishwakarma</h2>
            <span>Physiotherapist | BPT, DPT, CCYP (BHU)</span>
            <div className="mini-tags">
              <strong>Evidence-Based</strong>
              <strong>Movement Therapy</strong>
              <strong>Neuro Rehab</strong>
              <strong>Sports Recovery</strong>
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
        <p className="eyebrow">CLINICAL EXPERTISE</p>
        <h2>Specialized care for pain, movement, strength, and recovery.</h2>
      </div>
      <div className="treatment-grid">
        {treatments.map(([icon, title, copy, image]) => (
          <article className="treatment-card" key={title} style={{ "--treatment-image": `url("${image}")` }}>
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
        <p className="eyebrow">12 BODY PARTS & PROBLEMS</p>
        <h2>Choose the exact pain area. Build the correct recovery plan.</h2>
      </div>
      <div className="body-grid">
        {bodyProblems.map(([icon, title, copy, number, painX, painY, image]) => (
          <article className="new-body-card" key={title}>
            <div className="card-image-box">
              {image ? <img src={image} alt={title} /> : <div className="placeholder-img" />}
            </div>
            <div className="card-info-box">
              <h3>{title}</h3>
              <p>{copy}</p>
              <div className="card-action-box">
                <a href={`https://www.google.com/search?q=${encodeURIComponent(title + " physiotherapy treatment")}`} target="_blank" rel="noopener noreferrer" className="explore-btn">Explore</a>
                <a href="#portal" className="book-btn" onClick={() => handleBook(title)}>Consult Now</a>
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
        <p className="eyebrow">TREATMENT PROGRAMS</p>
        <h2>Not just exercise lists. A complete rehab pathway.</h2>
        <p>
          Every program begins with assessment, then moves through pain control, mobility, strength, control, and prevention. The goal is functional recovery that actually holds up in daily life.
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
        <p className="eyebrow">BHU HERITAGE</p>
        <h2>Clinical knowledge with therapeutic yoga depth.</h2>
        <p>
          Dr. Satyam Vishwakarma combines physiotherapy education with CCYP training from Banaras Hindu University, creating a care model that respects diagnosis, movement quality, strength, breathing, and long-term wellness.
        </p>
        <div className="credential-row">
          <span>BPT</span>
          <span>DPT</span>
          <span>CCYP (BHU)</span>
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
  const [form, setForm] = useState({
    painArea: "Lower Back",
    duration: "1-3 months",
    name: "",
    phone: "",
    appointmentDate: "",
    concern: ""
  });
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const handlePrefill = (e) => {
      setForm((current) => ({ ...current, painArea: e.detail }));
    };
    window.addEventListener("prefill-assessment", handlePrefill);
    return () => window.removeEventListener("prefill-assessment", handlePrefill);
  }, []);

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
    try {
      const response = await fetch(formspreeEndpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          phone: `+91${form.phone.trim()}`,
          clinicPhone: "+91 8382024264",
          source: "Dr. Satyam Vishwakarma Physiotherapy Website"
        })
      });
      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
      setForm({ painArea: "Lower Back", duration: "1-3 months", name: "", phone: "", appointmentDate: "", concern: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="portal" className="portal">
      <div className="portal-shell">
        <div className="portal-info">
          <p className="eyebrow">PATIENT PORTAL</p>
          <h2>Start your digital consultation.</h2>
          <p>
            Submit your pain area, duration, and phone number. The form is connected to Formspree and built for fast clinical follow-up.
          </p>
          <div className="contact-panel">
            <a href={`tel:${phonePrimary}`}><CallIcon /> +91 9793093316</a>
            <a href={`https://wa.me/${phoneSecondary.replace("+", "")}`}><WhatsAppIcon /> WhatsApp +91 8382024264</a>
          </div>
        </div>
        <form className="assessment-card" onSubmit={submit}>
          <div className="form-grid">
            <label>
              Pain Area
              <input name="painArea" value={form.painArea} onChange={update} list="painAreasList" placeholder="Select or type an area" />
              <datalist id="painAreasList">
                {bodyProblems.map(([, title]) => <option key={title} value={title} />)}
              </datalist>
            </label>
            <label>
              Duration
              <input name="duration" value={form.duration} onChange={update} list="durationList" placeholder="Select or type duration" />
              <datalist id="durationList">
                <option value="Less than a week" />
                <option value="1-4 weeks" />
                <option value="1-3 months" />
                <option value="Chronic 3+ months" />
              </datalist>
            </label>
            <label>
              Patient Name
              <input name="name" value={form.name} onChange={update} placeholder="Full name" autoComplete="name" />
            </label>
            <label>
              Mobile Number
              <div className="phone-input">
                <span>+91</span>
                <input name="phone" value={form.phone} onChange={update} inputMode="numeric" maxLength="10" placeholder="9876543210" autoComplete="tel" />
              </div>
            </label>
            <label className="wide">
              Preferred Date
              <input name="appointmentDate" type="date" value={form.appointmentDate} onChange={update} />
            </label>
            <label className="wide">
              Tell Us What Happened
              <textarea name="concern" value={form.concern} onChange={update} placeholder="Pain started after gym, long sitting, surgery, sports injury..." rows="4" />
            </label>
          </div>
          <button className="primary-btn form-submit" type="submit">Submit Request</button>
          {status === "invalid" && <p className="form-status">Enter a valid name and 10-digit Indian mobile number.</p>}
          {status === "loading" && <p className="form-status">Sending request...</p>}
          {status === "success" && <p className="form-status success">Request sent successfully through Formspree.</p>}
          {status === "error" && <p className="form-status">Form could not be sent. Please call the clinic directly.</p>}
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
    setFeedback((current) => [{ ...feedbackForm, condition: feedbackForm.condition || "Physiotherapy recovery" }, ...current]);
    setFeedbackForm({ name: "", condition: "", quote: "", rating: "5" });
  };

  return (
    <section className="section">
      <div className="trust-head">
        <div className="section-heading">
          <p className="eyebrow">PATIENT TRUST</p>
          <h2>Recovery stories from focused rehabilitation plans.</h2>
        </div>
        <form className="feedback-form" onSubmit={addFeedback}>
          <input name="name" value={feedbackForm.name} onChange={updateFeedback} placeholder="Patient name" />
          <input name="condition" value={feedbackForm.condition} onChange={updateFeedback} placeholder="Reason for visit (e.g. Lower Back Pain)" />
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star} 
                className={star <= feedbackForm.rating ? "star active" : "star"} 
                onClick={() => setFeedbackForm({...feedbackForm, rating: star})}
              >
                ★
              </span>
            ))}
          </div>
          <textarea name="quote" value={feedbackForm.quote} onChange={updateFeedback} placeholder="Write feedback here..." rows="3" />
          <button type="submit">Add Feedback</button>
        </form>
      </div>
      <div className="testimonial-window">
        <div className="testimonial-track">
          {[...allTestimonials, ...allTestimonials].map(([name, condition, quote, rating], index) => (
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

function Footer() {
  return (
    <footer id="contact" className="footer">
      <div>
        <div className="footer-brand">
          <Crest />
          <h2>Dr. Satyam Vishwakarma</h2>
        </div>
        <p>Physiotherapist | BPT, DPT, CCYP (BHU)</p>
      </div>
      <div>
        <h3>Contact</h3>
        <a href={`tel:${phonePrimary}`}><CallIcon /> +91 9793093316</a>
        <a href={`tel:${phoneSecondary}`}><CallIcon /> +91 8382024264</a>
        <a href={`https://wa.me/${phoneSecondary.replace("+", "")}`}><WhatsAppIcon /> WhatsApp Clinical Triage</a>
        <div className="social-links">
          <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
          </a>
          <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
          </a>
        </div>
      </div>
      <div>
        <h3>Treatments</h3>
        <a href="#body-map">Spine and Back</a>
        <a href="#body-map">Knee and Shoulder</a>
        <a href="#programs">Sports Rehab</a>
        <a href="#programs">Neuro Recovery</a>
      </div>
      <div>
        <h3>Portal</h3>
        <a href="#portal">Start Assessment</a>
        <iframe
          className="map-frame"
          title="Mirzapur Uttar Pradesh 231001 map"
          loading="lazy"
          src="https://www.openstreetmap.org/export/embed.html?bbox=82.50%2C25.05%2C82.63%2C25.18&layer=mapnik&marker=25.1337%2C82.5644"
        ></iframe>
      </div>
    </footer>
  );
}

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Treatments />
        <BodyMap />
        <Programs />
        <Heritage />
        <Assessment />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
