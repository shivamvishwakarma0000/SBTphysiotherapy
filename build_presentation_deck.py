import os
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas

USER_IMG_DIR = "/Users/college/.gemini/antigravity-ide/brain/47ad4de8-5b64-4d02-b49e-8d5101bcc6e0/.user_uploaded"
PROCESSED_IMG_DIR = "/Users/college/Desktop/ALL PROJECT/satyamvishwakarmawebsite/public/presentation_assets"
os.makedirs(PROCESSED_IMG_DIR, exist_ok=True)

def annotate_images():
    print("🎨 Annotating screenshots with visual callouts...")

    # 1. Header with Arrow to Doctor Portal
    header_raw = os.path.join(USER_IMG_DIR, "media_1787746649092.jpg")
    if os.path.exists(header_raw):
        im = Image.open(header_raw).convert("RGB")
        draw = ImageDraw.Draw(im)
        w, h = im.size
        # Draw glowing box around Doctor Portal button (top right area around x: 270 to 570, y: 220 to 280 roughly)
        # On this mobile screenshot, Doctor Portal button is around x: 260-560, y: 225-275
        box = [(250, 220), (560, 280)]
        draw.rectangle(box, outline="#10b981", width=6)
        # Arrow pointing to the box
        draw.line([(405, 360), (405, 290)], fill="#f59e0b", width=8)
        draw.polygon([(390, 295), (420, 295), (405, 275)], fill="#f59e0b")
        im.save(os.path.join(PROCESSED_IMG_DIR, "slide_header.jpg"), quality=92)

    # 2. Login Screen
    login_raw = os.path.join(USER_IMG_DIR, "media_1787746648999.jpg")
    if os.path.exists(login_raw):
        im = Image.open(login_raw).convert("RGB")
        draw = ImageDraw.Draw(im)
        # Box around Password Field
        draw.rectangle([(110, 540), (900, 610)], outline="#f59e0b", width=6)
        im.save(os.path.join(PROCESSED_IMG_DIR, "slide_login.jpg"), quality=92)

    # 3. Command Hub & Tabs
    hub_raw = os.path.join(USER_IMG_DIR, "media_1787746649014.jpg")
    if os.path.exists(hub_raw):
        im = Image.open(hub_raw).convert("RGB")
        im.save(os.path.join(PROCESSED_IMG_DIR, "slide_hub.jpg"), quality=92)

    # 4. Intake Screen
    intake_raw = os.path.join(USER_IMG_DIR, "media_1787746649033.jpg")
    if os.path.exists(intake_raw):
        im = Image.open(intake_raw).convert("RGB")
        im.save(os.path.join(PROCESSED_IMG_DIR, "slide_intake.jpg"), quality=92)

    # 5. Consultation Room Screen
    consult_raw = os.path.join(USER_IMG_DIR, "media_1787737452091.jpg")
    if os.path.exists(consult_raw):
        im = Image.open(consult_raw).convert("RGB")
        im.save(os.path.join(PROCESSED_IMG_DIR, "slide_consult.jpg"), quality=92)

    # 6. Receipt Modal Screen
    receipt_raw = os.path.join(USER_IMG_DIR, "media_1787737452100.jpg")
    if os.path.exists(receipt_raw):
        im = Image.open(receipt_raw).convert("RGB")
        im.save(os.path.join(PROCESSED_IMG_DIR, "slide_receipt.jpg"), quality=92)

class PPTXCanvas(canvas.Canvas):
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
            self.draw_slide_frame(num_pages)
            super().showPage()
        super().save()

    def draw_slide_frame(self, total_slides):
        self.saveState()
        # Draw Dark Executive Gradient Background
        self.setFillColor(colors.HexColor("#061726"))
        self.rect(0, 0, 842, 595, fill=True, stroke=False)
        
        # Subtle Top Glow Accent Bar
        self.setFillColor(colors.HexColor("#10B981"))
        self.rect(0, 590, 842, 5, fill=True, stroke=False)
        
        # Slide Footer
        self.setStrokeColor(colors.HexColor("#1E3A56"))
        self.setLineWidth(0.5)
        self.line(30, 28, 812, 28)
        
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(30, 16, "🏥 VINDHYA PHYSIO & REHAB CENTER — Clinical Operations Platform")
        self.drawRightString(812, 16, f"Slide {self._pageNumber} of {total_slides}")
        self.restoreState()

def build_presentation():
    annotate_images()
    pdf_path = "/Users/college/Desktop/ALL PROJECT/satyamvishwakarmawebsite/public/Vindhya_Physio_Doctor_Portal_Presentation.pdf"
    
    # 842 x 595 (A4 Landscape = 16:11 ~ 16:9 Presentation slide size)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=landscape(A4),
        leftMargin=30,
        rightMargin=30,
        topMargin=25,
        bottomMargin=35
    )

    styles = getSampleStyleSheet()
    
    # Colors
    C_NAVY_CARD = colors.HexColor("#0A2238")
    C_EMERALD = colors.HexColor("#10B981")
    C_GOLD = colors.HexColor("#F59E0B")
    C_BLUE = colors.HexColor("#38BDF8")
    C_WHITE = colors.white
    C_GRAY = colors.HexColor("#94A3B8")
    C_LIGHT_BG = colors.HexColor("#0F2D4A")

    # Styles
    slide_title_style = ParagraphStyle(
        'SlideTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=C_WHITE
    )
    slide_subtitle_style = ParagraphStyle(
        'SlideSubtitle',
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=C_GOLD
    )
    badge_style = ParagraphStyle(
        'Badge',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=C_EMERALD
    )
    card_title_style = ParagraphStyle(
        'CardTitle',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=C_BLUE
    )
    card_body_style = ParagraphStyle(
        'CardBody',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#E2E8F0")
    )
    bold_item = ParagraphStyle(
        'BoldItem',
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=C_WHITE
    )

    story = []

    # ============================== SLIDE 1: COVER SLIDE ==============================
    story.append(Spacer(1, 40))
    cover_data = [
        [
            Paragraph("🏥 <b>VINDHYA PHYSIO & REHAB CENTER</b>", ParagraphStyle('CoverH1', fontName='Helvetica-Bold', fontSize=28, leading=34, textColor=C_WHITE, alignment=TA_CENTER))
        ],
        [
            Paragraph("<b>Next-Generation Clinical OS & Doctor Operations Portal</b>", ParagraphStyle('CoverH2', fontName='Helvetica-Bold', fontSize=15, leading=20, textColor=C_EMERALD, alignment=TA_CENTER))
        ],
        [
            Paragraph("Official Operating Manual & Feature Walkthrough Deck", ParagraphStyle('CoverH3', fontName='Helvetica', fontSize=12, leading=16, textColor=C_GOLD, alignment=TA_CENTER))
        ],
        [
            Spacer(1, 20)
        ],
        [
            Paragraph(
                "<b>Consultant:</b> Dr. Satyam Vishwakarma (BPT, DPT, CCYP - BHU)<br/>"
                "<b>Address:</b> Amravati Chauraha, Vindhyachal, Mirzapur (U.P.) • <b>Helpline:</b> +91 9793093316<br/>"
                "<b>Live Cloud Portal:</b> https://vindhyaphysio.netlify.app",
                ParagraphStyle('CoverMeta', fontName='Helvetica', fontSize=10, leading=15, textColor=colors.HexColor("#CBD5E1"), alignment=TA_CENTER)
            )
        ]
    ]
    cover_table = Table(cover_data, colWidths=[782])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_CARD),
        ('BOX', (0, 0), (-1, -1), 1.5, C_EMERALD),
        ('PADDING', (0, 0), (-1, -1), 18),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(cover_table)
    story.append(PageBreak())

    # ============================== SLIDE 2: TRADITIONAL VS MODERN CLINIC OS ==============================
    story.append(Paragraph("<b>The Great Clinical Transformation: Old vs. New</b>", slide_title_style))
    story.append(Paragraph("Why switching from paper registers to the digital portal revolutionizes clinic efficiency and patient trust.", slide_subtitle_style))
    story.append(Spacer(1, 10))

    comp_data = [
        [
            Paragraph("<b>❌ OLD TRADITIONAL WAY (Pen & Paper)</b>", ParagraphStyle('C1', fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=colors.HexColor("#F87171"))),
            Paragraph("<b>✅ VINDHYA DIGITAL CLINICAL PORTAL</b>", ParagraphStyle('C2', fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=C_EMERALD))
        ],
        [
            Paragraph(
                "• <b>Manual Writing:</b> Receptionist / Doctor writes every detail by hand into large physical paper registers.<br/><br/>"
                "• <b>Slow Retrieval:</b> Looking up an old patient requires flipping through hundreds of paper pages; takes 5-10 minutes.<br/><br/>"
                "• <b>Paper Slips Lost:</b> Patients lose paper prescription receipts within 2 days; no backup available.<br/><br/>"
                "• <b>Paper Damage Risk:</b> Physical books can tear, burn, get water-damaged, or be stolen.<br/><br/>"
                "• <b>Stationary Costs:</b> Continuous recurring expenses on receipt books, carbon copies, and printing.",
                card_body_style
            ),
            Paragraph(
                "• <b>1-Tap Digital Intake:</b> Auto live-time clock match + smart dropdowns (Spine, Knee, Neuro, CP Child).<br/><br/>"
                "• <b>1-Second Instant Search:</b> Search any past patient instantly by Name, Phone Number, or ID.<br/><br/>"
                "• <b>Automated WhatsApp PDF:</b> Direct 1-tap delivery of digital receipt to patient's WhatsApp with clinic seal & signature.<br/><br/>"
                "• <b>100% Secure Cloud Sync:</b> Automatically synced to Google Sheets; works on Phone, Tablet & PC.<br/><br/>"
                "• <b>Zero Paper Costs:</b> Eliminates receipt booklet expenses permanently; saves <b>₹12,000+/yr</b>.",
                card_body_style
            )
        ]
    ]
    comp_table = Table(comp_data, colWidths=[385, 385])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#1A0F1A")),
        ('BACKGROUND', (1, 0), (1, -1), colors.HexColor("#082136")),
        ('BOX', (0, 0), (0, -1), 1, colors.HexColor("#EF4444")),
        ('BOX', (1, 0), (1, -1), 1, C_EMERALD),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(comp_table)
    story.append(PageBreak())

    # ============================== SLIDE 3: ACCESS & DOCTOR LOGIN ==============================
    story.append(Paragraph("<b>Step 1: Accessing the Doctor Portal & Secure Login</b>", slide_title_style))
    story.append(Paragraph("How Dr. Satyam Vishwakarma accesses the administrative clinical control room.", slide_subtitle_style))
    story.append(Spacer(1, 10))

    img_header_path = os.path.join(PROCESSED_IMG_DIR, "slide_header.jpg")
    img_login_path = os.path.join(PROCESSED_IMG_DIR, "slide_login.jpg")

    login_content = [
        [
            Paragraph("<b>1. Locate Doctor Portal Button</b>", card_title_style),
            Paragraph("<b>2. Enter Doctor Credentials</b>", card_title_style)
        ],
        [
            RLImage(img_header_path, width=370, height=195) if os.path.exists(img_header_path) else Paragraph("Header Image", card_body_style),
            RLImage(img_login_path, width=370, height=195) if os.path.exists(img_login_path) else Paragraph("Login Image", card_body_style)
        ],
        [
            Paragraph("Click the <b>'🔒 Doctor Portal'</b> button in the top-right navbar of <b>vindhyaphysio.netlify.app</b>.", card_body_style),
            Paragraph("<b>Email:</b> <font color='#38BDF8'><b>shivamupsc8@gmail.com</b></font><br/><b>Password:</b> <font color='#F59E0B'><b>@Shivam0000</b></font><br/>Tap <b>'Login to Doctor Portal'</b>.", card_body_style)
        ]
    ]
    login_table = Table(login_content, colWidths=[385, 385])
    login_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_CARD),
        ('BOX', (0, 0), (-1, -1), 1, C_BLUE),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(login_table)
    story.append(PageBreak())

    # ============================== SLIDE 4: PATIENT INTAKE & AI TRANSLATOR ==============================
    story.append(Paragraph("<b>Step 2: Rapid Patient Intake & AI Hindi Translator</b>", slide_title_style))
    story.append(Paragraph("Register arriving patients in under 30 seconds with automatic live clock matching.", slide_subtitle_style))
    story.append(Spacer(1, 10))

    img_intake_path = os.path.join(PROCESSED_IMG_DIR, "slide_intake.jpg")

    intake_content = [
        [
            RLImage(img_intake_path, width=340, height=380) if os.path.exists(img_intake_path) else Paragraph("Intake Image", card_body_style),
            Paragraph(
                "<b>⚡ Key Intake Features:</b><br/><br/>"
                "• <b>Auto-Time Match:</b> The intake clock automatically reads and locks the live time (e.g. <i>03:10 PM</i>) with zero manual hassle.<br/><br/>"
                "• <b>Duration Selector:</b> 1-Tap selection for acute or chronic conditions (<i>1 to 2 Weeks, 1 to 3 Months, 6 Months to 1 Year, etc.</i>).<br/><br/>"
                "• <b>5-Source Referral Tracking:</b> Walk-in, Doctor Referral, Friend/Relative, Old Patient, Google Search, or Custom name.<br/><br/>"
                "<b>✨ Standalone Built-in AI Medical Translator:</b><br/>"
                "Doctor can type raw complaints in Hindi or Hinglish:<br/>"
                "<i>'कमर में बहुत तेज दर्द है और पैर में झनझनाहट'</i><br/>"
                "➔ Click <b>'✨ Convert Hindi / Hinglish ➔ English'</b><br/>"
                "➔ Converts instantly to: <b>'Severe lower back (lumbar) pain with lower extremity paresthesia, tingling and numbness.'</b><br/><br/>"
                "• <b>Save to Waiting Queue:</b> Generates unique Patient ID (e.g. <i>VPR-2026-1004</i>) and adds patient to the Doctor's live exam queue.",
                card_body_style
            )
        ]
    ]
    intake_table = Table(intake_content, colWidths=[350, 420])
    intake_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_CARD),
        ('BOX', (0, 0), (-1, -1), 1, C_EMERALD),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(intake_table)
    story.append(PageBreak())

    # ============================== SLIDE 5: WAITING QUEUE & CONSULTATION ROOM ==============================
    story.append(Paragraph("<b>Step 3: Live Waiting Queue & Clinical Consultation Room</b>", slide_title_style))
    story.append(Paragraph("Two-step separation: Reception registers arrival ➔ Doctor examines in Consultation Room.", slide_subtitle_style))
    story.append(Spacer(1, 10))

    img_consult_path = os.path.join(PROCESSED_IMG_DIR, "slide_consult.jpg")

    consult_content = [
        [
            RLImage(img_consult_path, width=340, height=380) if os.path.exists(img_consult_path) else Paragraph("Consult Image", card_body_style),
            Paragraph(
                "<b>🩺 Clinical Consultation & Fee Flow:</b><br/><br/>"
                "<b>1. Open Active Waiting Queue:</b><br/>"
                "Doctor sees the list of all registered patients waiting outside in the clinic.<br/><br/>"
                "<b>2. Start Doctor Consultation:</b><br/>"
                "Click <i>'🩺 Start Doctor Consultation'</i> to open the dedicated clinical room.<br/><br/>"
                "<b>3. Clinical Diagnosis & Therapy Log:</b><br/>"
                "• Review the patient's reported symptoms.<br/>"
                "• Enter definitive diagnosis (e.g. <i>Lumbar Spondylosis L4-L5 Disc Bulge</i>).<br/>"
                "• Log therapy given (e.g. <i>IFT + Ultrasonic therapy for 15 mins + Core exercises</i>).<br/><br/>"
                "<b>4. 1-Tap Fee Presets:</b><br/>"
                "Tap preset fee chips: <b>₹300 | ₹500 | ₹700 | ₹1000 | ₹1200</b> or type any custom fee amount.<br/><br/>"
                "<b>5. Next Follow-Up Scheduling:</b><br/>"
                "Choose next appointment date & time for structured rehabilitation progress.<br/><br/>"
                "<b>6. Finalize & Issue:</b> Generates official sealed digital prescription receipt.",
                card_body_style
            )
        ]
    ]
    consult_table = Table(consult_content, colWidths=[350, 420])
    consult_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_CARD),
        ('BOX', (0, 0), (-1, -1), 1, C_GOLD),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(consult_table)
    story.append(PageBreak())

    # ============================== SLIDE 6: WHATSAPP RECEIPT & PDF SLIP ==============================
    story.append(Paragraph("<b>Step 4: Official PDF Receipt & 1-Tap WhatsApp Dispatch</b>", slide_title_style))
    story.append(Paragraph("Instant prescription & consultation receipt delivered directly to the patient's phone.", slide_subtitle_style))
    story.append(Spacer(1, 10))

    img_receipt_path = os.path.join(PROCESSED_IMG_DIR, "slide_receipt.jpg")

    receipt_content = [
        [
            RLImage(img_receipt_path, width=340, height=380) if os.path.exists(img_receipt_path) else Paragraph("Receipt Image", card_body_style),
            Paragraph(
                "<b>📲 1-Tap WhatsApp Receipt Features:</b><br/><br/>"
                "• <b>Prominent WhatsApp Share Button:</b> Pinned to both the top toolbar and bottom mobile bar for instant 1-tap access.<br/><br/>"
                "• <b>What Happens on Tap:</b><br/>"
                "1. Official PDF receipt automatically downloads to your device.<br/>"
                "2. Directly launches WhatsApp targeted to that patient's +91 phone number.<br/>"
                "3. Clinical consultation message is pre-typed and ready to send!<br/><br/>"
                "<b>📄 What the Official Receipt Contains:</b><br/>"
                "• Official Clinic Logo & Header (Vindhya Physio & Rehab Center)<br/>"
                "• Patient Demographics (ID, Name, Age, Gender, Phone, Address)<br/>"
                "• Clinical Assessment (Chief Focus, Symptoms, Diagnosis, Therapy Given)<br/>"
                "• Next Recommended Follow-Up Appointment Date & Time<br/>"
                "• Fee Settlement Status (Paid & Settled - Cash / UPI)<br/>"
                "• Official Doctor Signature & Clinic Stamp.<br/><br/>"
                "• <b>Copy Phone Button:</b> 1-Tap copy of patient phone number for quick dialing.",
                card_body_style
            )
        ]
    ]
    receipt_table = Table(receipt_content, colWidths=[350, 420])
    receipt_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_CARD),
        ('BOX', (0, 0), (-1, -1), 1, C_EMERALD),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(receipt_table)
    story.append(PageBreak())

    # ============================== SLIDE 7: CLOUD SYNC & CLINIC DIRECTORY ==============================
    story.append(Paragraph("<b>Universal Multi-Device Cloud Sync & Clinic Summary</b>", slide_title_style))
    story.append(Paragraph("Lifetime secure Google Sheets cloud backup across Phone, Tablet, and PC.", slide_subtitle_style))
    story.append(Spacer(1, 10))

    img_hub_path = os.path.join(PROCESSED_IMG_DIR, "slide_hub.jpg")

    cloud_content = [
        [
            RLImage(img_hub_path, width=340, height=380) if os.path.exists(img_hub_path) else Paragraph("Hub Image", card_body_style),
            Paragraph(
                "<b>☁️ Universal Multi-Device Cloud Sync:</b><br/><br/>"
                "• <b>Real-Time Google Sheets Backup:</b> Every patient intake, completed visit, and online booking is automatically pushed to the official Google Sheets database.<br/><br/>"
                "• <b>Cross-Device Freedom:</b> Dr. Satyam can use his mobile phone during rounds, a tablet at the reception, and a laptop in his office — all synchronized in real time!<br/><br/>"
                "• <b>One-Click Restore:</b> If switching to a new phone, simply go to <i>'6. Cloud Settings'</i> ➔ click <b>'📥 Restore from Google Sheets'</b> to load all clinic data back instantly.<br/><br/>"
                "<b>🏥 Clinic Contact Information:</b><br/>"
                "• <b>Clinic Name:</b> Vindhya Physio & Rehab Center<br/>"
                "• <b>Consultant:</b> Dr. Satyam Vishwakarma (BPT, DPT, CCYP - BHU)<br/>"
                "• <b>Clinic Address:</b> Amravati Chauraha, Vindhyachal, Mirzapur (U.P.)<br/>"
                "• <b>Helpline:</b> +91 9793093316 | <b>WhatsApp:</b> +91 8382024264<br/>"
                "• <b>Web Portal:</b> https://vindhyaphysio.netlify.app",
                card_body_style
            )
        ]
    ]
    cloud_table = Table(cloud_content, colWidths=[350, 420])
    cloud_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_CARD),
        ('BOX', (0, 0), (-1, -1), 1, C_BLUE),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(cloud_table)

    # Build Document
    doc.build(story, canvasmaker=PPTXCanvas)
    print(f"✅ Generated Premium Presentation Deck PDF at: {pdf_path}")

if __name__ == "__main__":
    build_presentation()
