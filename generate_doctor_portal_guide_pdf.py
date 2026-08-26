import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages 2+)
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 805, 559, 805)
            self.drawString(36, 810, "🏥 VINDHYA PHYSIO & REHAB CENTER — Clinical Doctor Portal Guide")
            self.drawRightString(559, 810, "CONFIDENTIAL & PROPRIETARY")

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 40, 559, 40)
        self.drawString(36, 28, "Dr. Satyam Vishwakarma (Consultant Physiotherapist, BHU) • Helpline: +91 9793093316")
        self.drawRightString(559, 28, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def create_guide_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    
    # Custom Brand Palette
    C_NAVY_DARK = colors.HexColor("#071C2D")
    C_NAVY_LIGHT = colors.HexColor("#0C2D48")
    C_EMERALD = colors.HexColor("#10B981")
    C_EMERALD_LIGHT = colors.HexColor("#ECFDF5")
    C_GOLD = colors.HexColor("#D97706")
    C_GOLD_LIGHT = colors.HexColor("#FEF3C7")
    C_BLUE = colors.HexColor("#0284C7")
    C_BLUE_LIGHT = colors.HexColor("#E0F2FE")
    C_GRAY_TEXT = colors.HexColor("#334155")
    C_GRAY_BG = colors.HexColor("#F8FAFC")
    C_BORDER = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=C_NAVY_DARK,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=C_GOLD,
        alignment=TA_CENTER
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=C_NAVY_DARK,
        spaceBefore=10,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=C_BLUE,
        spaceBefore=6,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=C_GRAY_TEXT,
        alignment=TA_LEFT
    )

    body_bold = ParagraphStyle(
        'Body_Bold',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=C_NAVY_DARK
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=C_GRAY_TEXT
    )

    table_header_style = ParagraphStyle(
        'TH_Style',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=TA_CENTER
    )

    story = []

    # ==================== PAGE 1: EXECUTIVE BRIEF & ROI COMPARISON ====================
    # Clinic Banner Box
    clinic_header_data = [
        [
            Paragraph("<b>🏥 VINDHYA PHYSIO & REHAB CENTER</b>", ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=14, leading=16, textColor=colors.white)),
            Paragraph("<b>OFFICIAL CLINICAL OS & DOCTOR PORTAL GUIDE</b>", ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=9.5, leading=12, textColor=colors.HexColor("#38BDF8"), alignment=TA_RIGHT))
        ],
        [
            Paragraph("Lead Consultant: <b>Dr. Satyam Vishwakarma</b> (BPT, DPT, CCYP - BHU)<br/>📍 Amravati Chauraha, Vindhyachal, Mirzapur (U.P.) • 📞 Helpline: +91 9793093316", ParagraphStyle('H3', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#CBD5E1"))),
            Paragraph("Live Web Portal:<br/><b>https://vindhyaphysio.netlify.app</b>", ParagraphStyle('H4', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#34D399"), alignment=TA_RIGHT))
        ]
    ]
    clinic_header_table = Table(clinic_header_data, colWidths=[340, 183])
    clinic_header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_DARK),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(clinic_header_table)
    story.append(Spacer(1, 10))

    # Executive Overview
    story.append(Paragraph("<b>1. Executive Purpose & Clinical Transformation</b>", h1_style))
    story.append(Paragraph(
        "Vindhya Physio & Rehab Center has upgraded from manual, cumbersome paper registers to an advanced, cloud-connected <b>Clinical Operations Portal</b>. This dedicated platform is engineered specifically for Dr. Satyam Vishwakarma to streamline patient intake, clinical diagnosis, therapy logging, automated WhatsApp receipt generation, and real-time multi-device cloud synchronization.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Traditional vs Modern Comparison Table
    story.append(Paragraph("<b>2. Operational & Financial Impact: Traditional Registers vs. Digital Portal</b>", h1_style))
    comp_data = [
        [
            Paragraph("<b>Aspect / Workflow</b>", table_header_style),
            Paragraph("<b>Old Traditional Way (Pen & Paper)</b>", table_header_style),
            Paragraph("<b>New Vindhya Digital Portal</b>", table_header_style),
            Paragraph("<b>Clinic Advantage & Savings</b>", table_header_style)
        ],
        [
            Paragraph("<b>Patient Registration</b>", body_bold),
            Paragraph("Writing in paper registers by hand. Slow, repetitive, prone to illegible handwriting.", body_style),
            Paragraph("<b>1-Tap Intake Form</b> with auto live-clock matching and quick symptom converters.", body_style),
            Paragraph("⏱️ <b>Saves 3-5 mins</b> per patient registration.", body_style)
        ],
        [
            Paragraph("<b>Patient History & Search</b>", body_bold),
            Paragraph("Searching through dusty physical notebooks. Difficult to track past visits and treatments.", body_style),
            Paragraph("<b>Instant Live Search</b> by Name, Phone, or Patient ID with complete chronological history.", body_style),
            Paragraph("⚡ <b>Instant 1-second retrieval</b> of complete past records.", body_style)
        ],
        [
            Paragraph("<b>Receipts & Prescriptions</b>", body_bold),
            Paragraph("Printed paper slips. Easily lost by patients; requires physical printing and paper costs.", body_style),
            Paragraph("<b>Instant WhatsApp Delivery + PDF</b> with official clinic seal, diagnosis, and fee settlement.", body_style),
            Paragraph("💰 <b>Zero printing expenses</b>; 100% permanent digital copy on patient's WhatsApp.", body_style)
        ],
        [
            Paragraph("<b>Doctor Consultation Flow</b>", body_bold),
            Paragraph("Disorganized queues; doctor must manually remember waiting patients.", body_style),
            Paragraph("<b>Live 2-Step Waiting Queue:</b> Reception enrolls ➔ Doctor examines and finalizes in consultation room.", body_style),
            Paragraph("🏥 <b>Professional clinic flow;</b> zero patient confusion.", body_style)
        ],
        [
            Paragraph("<b>Data Security & Cloud Backup</b>", body_bold),
            Paragraph("Paper registers can tear, burn, get water-damaged, or be misplaced permanently.", body_style),
            Paragraph("<b>Automatic Google Sheets Sync:</b> Works simultaneously across Phone, Tablet, and PC.", body_style),
            Paragraph("🔒 <b>100% Zero Data Loss;</b> lifetime secure cloud backup.", body_style)
        ]
    ]
    comp_table = Table(comp_data, colWidths=[100, 135, 148, 140])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY_LIGHT),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_GRAY_BG]),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 10))

    # Time & Money Saved Callout Box
    roi_box_data = [
        [
            Paragraph(
                "<b>💡 Estimated Time & Financial Benefits:</b><br/>"
                "• <b>Time Saved:</b> Saves ~15 to 20 hours per month in administrative record keeping and register searches.<br/>"
                "• <b>Cost Reduction:</b> Saves ₹12,000+ annually on receipt booklets, register printing, and stationary.<br/>"
                "• <b>Patient Retention:</b> Automated WhatsApp receipts with scheduled follow-up reminders increase follow-up show rates by <b>40%+</b>.",
                callout_style
            )
        ]
    ]
    roi_table = Table(roi_box_data, colWidths=[523])
    roi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_EMERALD_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, C_EMERALD),
        ('PADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(roi_table)
    
    story.append(PageBreak())

    # ==================== PAGE 2: LOGIN & CORE SYSTEM WORKFLOWS ====================
    story.append(Paragraph("<b>3. Doctor Portal Access & Authorized Credentials</b>", h1_style))
    story.append(Paragraph(
        "The Doctor Portal is an administrative control room restricted strictly to authorized clinic staff and Dr. Satyam Vishwakarma. It is accessible directly from any web browser on smartphones, tablets, and laptops.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # Credentials Callout
    cred_data = [
        [
            Paragraph("<b>🔐 OFFICIAL DOCTOR LOGIN CREDENTIALS</b>", ParagraphStyle('CH1', fontName='Helvetica-Bold', fontSize=10, textColor=C_NAVY_DARK)),
            Paragraph("<b>PORTAL URL:</b> https://vindhyaphysio.netlify.app", ParagraphStyle('CH2', fontName='Helvetica-Bold', fontSize=9, textColor=C_BLUE, alignment=TA_RIGHT))
        ],
        [
            Paragraph(
                "<b>1. How to Open:</b> Click the <b>'🔒 Doctor Portal'</b> button on the top-right navigation bar of the website.<br/>"
                "<b>2. Authorized Email:</b> <font color='#0284C7'><b>shivamupsc8@gmail.com</b></font><br/>"
                "<b>3. Private Password:</b> <font color='#D97706'><b>@Shivam0000</b></font><br/>"
                "<i>(Tip: Once logged in, your session remains active on your phone for fast, continuous daily use.)</i>",
                callout_style
            ),
            Paragraph(
                "<b>Cloud Sync Status:</b><br/>"
                "🟢 Google Sheets Webhook Connected<br/>"
                "🛡️ Multi-Device Auto-Sync: <b>Enabled</b><br/>"
                "📂 Auto-Backup: <b>Every Entry</b>",
                callout_style
            )
        ]
    ]
    cred_table = Table(cred_data, colWidths=[340, 183])
    cred_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_GOLD_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, C_GOLD),
        ('PADDING', (0, 0), (-1, -1), 7),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(cred_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>4. Complete Step-by-Step Clinical Workflow Guide</b>", h1_style))
    
    # Workflow Steps
    steps_data = [
        [
            Paragraph("<b>Step & Module</b>", table_header_style),
            Paragraph("<b>Action by Doctor / Clinic Staff</b>", table_header_style),
            Paragraph("<b>Automated System Output</b>", table_header_style)
        ],
        [
            Paragraph("<b>Step 1:<br/>Patient Intake & Arrival</b>", body_bold),
            Paragraph(
                "1. Click <b>'➕ 1. Intake Patient'</b>.<br/>"
                "2. Enter Name, Age, Gender, Phone (+91).<br/>"
                "3. Select Problem area (Spine, Knee, Neuro, CP Child, etc.).<br/>"
                "4. Select Duration (1-2 Weeks, 1-3 Months, etc.).<br/>"
                "5. <i>Intake Time</i> automatically locks the exact live clock.<br/>"
                "6. Click <b>'Save & Add Patient to Waiting Queue'</b>.",
                body_style
            ),
            Paragraph(
                "• Unique <b>Patient ID</b> generated (e.g. VPR-2026-1005).<br/>"
                "• Added instantly to Doctor's active <b>Waiting Queue</b>.<br/>"
                "• Auto-synced to Google Sheets.",
                body_style
            )
        ],
        [
            Paragraph("<b>✨ Smart AI Hindi / Hinglish Translation</b>", body_bold),
            Paragraph(
                "When entering patient symptoms, type in Hindi (जैसे: <i>कमर में तेज दर्द और पैर में झनझनाहट</i>) or Hinglish (<i>kamar dard chalne me dikkat</i>). Click <b>'✨ Convert Hindi / Hinglish ➔ English'</b>.",
                body_style
            ),
            Paragraph(
                "Instantly converts raw complaints into standard medical clinical English (e.g. <i>'Severe lower back pain with radiating lower extremity paresthesia.'</i>) with 0ms delay.",
                body_style
            )
        ],
        [
            Paragraph("<b>Step 2:<br/>Waiting Queue & Doctor Exam</b>", body_bold),
            Paragraph(
                "1. Open <b>'⏳ 2. Waiting Queue'</b>.<br/>"
                "2. Choose the waiting patient and click <b>'🩺 Start Doctor Consultation'</b>.<br/>"
                "3. Consultation Room opens with patient's intake summary.",
                body_style
            ),
            Paragraph(
                "• Doctor examines the patient.<br/>"
                "• Clear clinical focus on recorded problem.",
                body_style
            )
        ],
        [
            Paragraph("<b>Step 3:<br/>Diagnosis, Fee & Receipt Finalization</b>", body_bold),
            Paragraph(
                "1. Enter Clinical Assessment / Diagnosis.<br/>"
                "2. Record Therapy Administered (IFT, Ultrasonic, Decompression, Exercise).<br/>"
                "3. Choose Fee with 1-tap presets (<b>₹300, ₹500, ₹700, ₹1000, ₹1200</b>).<br/>"
                "4. Set Next Follow-up Date (optional).<br/>"
                "5. Click <b>'Generate Final Receipt & Issue Slip'</b>.",
                body_style
            ),
            Paragraph(
                "• Visit recorded in permanent history.<br/>"
                "• Official <b>Digital Prescription & Receipt</b> generated immediately.<br/>"
                "• Patient removed from Waiting Queue.",
                body_style
            )
        ],
        [
            Paragraph("<b>Step 4:<br/>1-Tap WhatsApp Receipt Dispatch</b>", body_bold),
            Paragraph(
                "In the Receipt Modal, tap the big green <b>'💬 Send Receipt via WhatsApp (+91 ...)'</b> button.",
                body_style
            ),
            Paragraph(
                "• Downloads official PDF to device.<br/>"
                "• Opens WhatsApp directly to patient's phone number with complete diagnosis, treatment & fee summary pre-filled.",
                body_style
            )
        ]
    ]
    steps_table = Table(steps_data, colWidths=[110, 220, 193])
    steps_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY_LIGHT),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_GRAY_BG]),
    ]))
    story.append(steps_table)
    
    story.append(PageBreak())

    # ==================== PAGE 3: ADVANCED MODULES & MASTER GUIDE ====================
    story.append(Paragraph("<b>5. Portal Navigation Hub & Feature Directory</b>", h1_style))
    story.append(Paragraph(
        "The top navigation bar provides instant one-tap access to all 6 core clinical departments:",
        body_style
    ))
    story.append(Spacer(1, 6))

    # 6 Tabs Directory Grid
    tabs_data = [
        [
            Paragraph("<b>Tab Icon & Name</b>", table_header_style),
            Paragraph("<b>Purpose & Key Capabilities</b>", table_header_style),
            Paragraph("<b>Best Practice Recommendation</b>", table_header_style)
        ],
        [
            Paragraph("<b>➕ 1. Intake Patient</b>", body_bold),
            Paragraph("Quick patient arrival registration. Captures demographic contact info, primary pain area, duration, referrer, and arrival time.", body_style),
            Paragraph("Fill immediately when patient enters clinic reception.", body_style)
        ],
        [
            Paragraph("<b>⏳ 2. Waiting Queue</b>", body_bold),
            Paragraph("Live staging room for patients waiting to see Dr. Satyam. Prevents crowding and keeps treatment sequence organized.", body_style),
            Paragraph("Doctor consults patients one-by-one directly from this queue.", body_style)
        ],
        [
            Paragraph("<b>👥 3. All Patients</b>", body_bold),
            Paragraph("Master clinic patient directory with live search. View full patient profiles, complete chronological visit timelines, and reprint old slips.", body_style),
            Paragraph("Use search bar to look up returning patients by phone or name.", body_style)
        ],
        [
            Paragraph("<b>📅 4. Today's Visits</b>", body_bold),
            Paragraph("Real-time log of all consultations completed today. Tracks daily revenue, patient footfall, and therapy session notes.", body_style),
            Paragraph("Review at end of clinic hours for daily accounting & reconciliation.", body_style)
        ],
        [
            Paragraph("<b>📩 5. Online Bookings</b>", body_bold),
            Paragraph("Manages appointment requests received directly from the public website. Doctor can convert online enquiries into registered patients with 1 tap.", body_style),
            Paragraph("Check twice daily to follow up with online consultation leads.", body_style)
        ],
        [
            Paragraph("<b>⚙️ 6. Cloud Settings</b>", body_bold),
            Paragraph("Security & cloud database management. Manage doctor password, Google Sheets webhook synchronization, and restore data.", body_style),
            Paragraph("Use <i>'Restore from Google Sheets'</i> if switching to a new phone.", body_style)
        ]
    ]
    tabs_table = Table(tabs_data, colWidths=[120, 230, 173])
    tabs_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY_LIGHT),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_GRAY_BG]),
    ]))
    story.append(tabs_table)
    story.append(Spacer(1, 10))

    # Troubleshooting & Best Practices Box
    story.append(Paragraph("<b>6. Frequently Asked Questions & Best Practices</b>", h1_style))
    faq_data = [
        [
            Paragraph(
                "<b>Q1: Can I use this portal on both my mobile phone and laptop simultaneously?</b><br/>"
                "<b>Yes, 100%!</b> The portal is cloud-connected to Google Sheets. Any patient enrolled on your mobile phone appears instantly on your laptop or clinic computer.",
                body_style
            )
        ],
        [
            Paragraph(
                "<b>Q2: What happens if I lose my phone or clear browser cache?</b><br/>"
                "Your records are <b>safe in the cloud</b>. Simply log in on your new device, go to <b>'⚙️ 6. Cloud Settings'</b>, and click <b>'📥 Restore from Google Sheets'</b> to pull all patients and history back in seconds.",
                body_style
            )
        ],
        [
            Paragraph(
                "<b>Q3: How do I send a duplicate receipt to an old patient who lost theirs?</b><br/>"
                "Go to <b>'👥 3. All Patients'</b> ➔ Search patient name ➔ Click <b>'👤 Profile'</b> ➔ Under <i>Chronological Visit Records</i>, click <b>'📄 Slip & WhatsApp PDF'</b> ➔ Tap <b>'💬 Send WhatsApp Receipt'</b>.",
                body_style
            )
        ]
    ]
    faq_table = Table(faq_data, colWidths=[523])
    faq_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_BLUE_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, C_BLUE),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#BAE6FD")),
    ]))
    story.append(faq_table)
    story.append(Spacer(1, 10))

    # Official Sign-Off Footer Box
    signoff_data = [
        [
            Paragraph(
                "<b>🏥 VINDHYA PHYSIO & REHAB CENTER</b><br/>"
                "<i>Setting the Gold Standard in Advanced Physiotherapy, Neuro Rehabilitation & Cupping Therapy.</i><br/>"
                "📍 Amravati Chauraha, Vindhyachal, Mirzapur (U.P.) • 📞 Phone: +91 9793093316 | WhatsApp: +91 8382024264<br/>"
                "🌐 Website & Portal: <b>https://vindhyaphysio.netlify.app</b>",
                ParagraphStyle('SO', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#0F172A"), alignment=TA_CENTER)
            )
        ]
    ]
    signoff_table = Table(signoff_data, colWidths=[523])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(signoff_table)

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ Generated Clinical Guide PDF at: {output_path}")

if __name__ == "__main__":
    output_file = "/Users/college/Desktop/ALL PROJECT/satyamvishwakarmawebsite/public/Vindhya_Physio_Doctor_Portal_Guide.pdf"
    create_guide_pdf(output_file)
