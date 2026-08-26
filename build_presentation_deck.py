import os
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image as RLImage, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

USER_IMG_DIR = "/Users/college/.gemini/antigravity-ide/brain/47ad4de8-5b64-4d02-b49e-8d5101bcc6e0/.user_uploaded"
PROCESSED_IMG_DIR = "/Users/college/Desktop/ALL PROJECT/satyamvishwakarmawebsite/public/presentation_assets"
os.makedirs(PROCESSED_IMG_DIR, exist_ok=True)

def annotate_images():
    print("🎨 Processing & resizing screenshots...")

    # Helper to resize and save cleanly
    def process_and_save(src_name, dest_name, annotate_type=None):
        src_path = os.path.join(USER_IMG_DIR, src_name)
        if not os.path.exists(src_path):
            return
        im = Image.open(src_path).convert("RGB")
        draw = ImageDraw.Draw(im)
        w, h = im.size

        if annotate_type == "header":
            # Highlight Doctor Portal button and draw a large bright gold pointer arrow
            draw.rectangle([(250, 220), (560, 280)], outline="#10b981", width=8)
            draw.line([(405, 380), (405, 290)], fill="#f59e0b", width=10)
            draw.polygon([(385, 295), (425, 295), (405, 270)], fill="#f59e0b")
        elif annotate_type == "login":
            # Highlight Password input area
            draw.rectangle([(110, 535), (900, 615)], outline="#f59e0b", width=8)
            draw.rectangle([(110, 435), (900, 505)], outline="#38bdf8", width=6)

        # Optimize size for slide display (max width 600)
        ratio = min(600 / w, 900 / h)
        new_w, new_h = int(w * ratio), int(h * ratio)
        im_resized = im.resize((new_w, new_h), Image.LANCZOS)
        im_resized.save(os.path.join(PROCESSED_IMG_DIR, dest_name), quality=95)

    process_and_save("media_1787746649092.jpg", "slide_header.jpg", annotate_type="header")
    process_and_save("media_1787746648999.jpg", "slide_login.jpg", annotate_type="login")
    process_and_save("media_1787746649014.jpg", "slide_hub.jpg")
    process_and_save("media_1787746649033.jpg", "slide_intake.jpg")
    process_and_save("media_1787737452091.jpg", "slide_consult.jpg")
    process_and_save("media_1787737452100.jpg", "slide_receipt.jpg")

def draw_slide_background(canvas, doc):
    canvas.saveState()
    # Dark Executive Background
    canvas.setFillColor(colors.HexColor("#061726"))
    canvas.rect(0, 0, 842, 595, fill=True, stroke=False)
    
    # Top Emerald Glow Bar
    canvas.setFillColor(colors.HexColor("#10B981"))
    canvas.rect(0, 590, 842, 5, fill=True, stroke=False)
    
    # Bottom Footer Divider
    canvas.setStrokeColor(colors.HexColor("#1E3A56"))
    canvas.setLineWidth(0.5)
    canvas.line(30, 26, 812, 26)
    
    # Footer Text
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(30, 14, "🏥 VINDHYA PHYSIO & REHAB CENTER — Clinical Operations OS & Doctor Portal Guide")
    canvas.drawRightString(812, 14, f"Slide {doc.page} of 7")
    canvas.restoreState()

def build_presentation():
    annotate_images()
    pdf_path = "/Users/college/Desktop/ALL PROJECT/satyamvishwakarmawebsite/public/Vindhya_Physio_Doctor_Portal_Presentation.pdf"
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=landscape(A4),
        leftMargin=30,
        rightMargin=30,
        topMargin=20,
        bottomMargin=32
    )

    # Styles
    C_NAVY_CARD = colors.HexColor("#0A2238")
    C_EMERALD = colors.HexColor("#10B981")
    C_GOLD = colors.HexColor("#F59E0B")
    C_BLUE = colors.HexColor("#38BDF8")
    C_WHITE = colors.white

    slide_title_style = ParagraphStyle(
        'SlideTitle',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=C_WHITE,
        spaceAfter=2
    )
    slide_subtitle_style = ParagraphStyle(
        'SlideSubtitle',
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=C_GOLD,
        spaceAfter=8
    )
    card_title_style = ParagraphStyle(
        'CardTitle',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=C_BLUE,
        spaceAfter=4
    )
    card_body_style = ParagraphStyle(
        'CardBody',
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#E2E8F0")
    )
    card_body_large = ParagraphStyle(
        'CardBodyLarge',
        fontName='Helvetica',
        fontSize=9.5,
        leading=14.5,
        textColor=colors.HexColor("#E2E8F0")
    )

    story = []

    # ============================== SLIDE 1: COVER SLIDE ==============================
    story.append(Spacer(1, 30))
    cover_data = [
        [
            Paragraph("🏥 <b>VINDHYA PHYSIO & REHAB CENTER</b>", ParagraphStyle('CoverH1', fontName='Helvetica-Bold', fontSize=28, leading=34, textColor=C_WHITE, alignment=TA_CENTER))
        ],
        [
            Paragraph("<b>Next-Generation Clinical Operations OS & Doctor Portal</b>", ParagraphStyle('CoverH2', fontName='Helvetica-Bold', fontSize=15, leading=20, textColor=C_EMERALD, alignment=TA_CENTER))
        ],
        [
            Paragraph("Official Operating Manual & Digital Feature Walkthrough Deck", ParagraphStyle('CoverH3', fontName='Helvetica', fontSize=12, leading=16, textColor=C_GOLD, alignment=TA_CENTER))
        ],
        [
            Spacer(1, 15)
        ],
        [
            Paragraph(
                "<b>Lead Consultant:</b> Dr. Satyam Vishwakarma (BPT, DPT, CCYP - BHU)<br/>"
                "<b>Clinic Address:</b> Amravati Chauraha, Vindhyachal, Mirzapur (U.P.) • <b>Helpline:</b> +91 9793093316<br/>"
                "<b>Live Cloud Web Portal:</b> <font color='#38BDF8'><b>https://vindhyaphysio.netlify.app</b></font>",
                ParagraphStyle('CoverMeta', fontName='Helvetica', fontSize=10.5, leading=16, textColor=colors.HexColor("#CBD5E1"), alignment=TA_CENTER)
            )
        ]
    ]
    cover_table = Table(cover_data, colWidths=[775])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_CARD),
        ('BOX', (0, 0), (-1, -1), 2, C_EMERALD),
        ('PADDING', (0, 0), (-1, -1), 18),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(cover_table)
    story.append(PageBreak())

    # ============================== SLIDE 2: TRADITIONAL VS DIGITAL OS ==============================
    story.append(Paragraph("<b>The Great Clinical Transformation: Traditional vs. Modern Portal</b>", slide_title_style))
    story.append(Paragraph("Direct comparison of pen-and-paper registers versus Vindhya's modern clinical operating system.", slide_subtitle_style))

    comp_data = [
        [
            Paragraph("<b>❌ OLD TRADITIONAL WAY (Pen & Paper)</b>", ParagraphStyle('C1', fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=colors.HexColor("#F87171"))),
            Paragraph("<b>✅ NEW VINDHYA DIGITAL CLINICAL OS</b>", ParagraphStyle('C2', fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=C_EMERALD))
        ],
        [
            Paragraph(
                "• <b>Manual Handwriting:</b> Writing patient details by hand in large physical paper registers; slow, repetitive, prone to illegible doctor handwriting.<br/><br/>"
                "• <b>Painful Search:</b> Searching an old patient requires flipping through hundreds of paper pages; takes 5 to 10 minutes.<br/><br/>"
                "• <b>Lost Paper Slips:</b> Patients lose physical paper slips within days; clinic has zero digital record backup.<br/><br/>"
                "• <b>Physical Risk:</b> Paper notebooks can tear, burn, get water-damaged, or be misplaced permanently.<br/><br/>"
                "• <b>Printing Costs:</b> Continuous recurring expenses on receipt books, carbon copies, and stationary.",
                card_body_large
            ),
            Paragraph(
                "• <b>1-Tap Digital Intake:</b> Auto live-clock match + structured dropdowns (Spine, Knee, Neuro, CP Child).<br/><br/>"
                "• <b>1-Second Instant Search:</b> Search any returning patient instantly by Name, Phone Number, or Patient ID.<br/><br/>"
                "• <b>Automated WhatsApp PDF:</b> Direct 1-tap delivery of official digital receipt to patient's WhatsApp with clinic seal & signature.<br/><br/>"
                "• <b>Permanent Cloud Sync:</b> Automatically synced to Google Sheets; works simultaneously on Phone, Tablet & PC.<br/><br/>"
                "• <b>Zero Stationary Expenses:</b> Saves <b>₹12,000+ per year</b> on receipt booklets and stationary.",
                card_body_large
            )
        ]
    ]
    comp_table = Table(comp_data, colWidths=[382, 382])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#1A0F1A")),
        ('BACKGROUND', (1, 0), (1, -1), colors.HexColor("#082136")),
        ('BOX', (0, 0), (0, -1), 1.5, colors.HexColor("#EF4444")),
        ('BOX', (1, 0), (1, -1), 1.5, C_EMERALD),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(comp_table)
    story.append(PageBreak())

    # ============================== SLIDE 3: ACCESS & LOGIN ==============================
    story.append(Paragraph("<b>Step 1: Doctor Portal Access & Authorized Login</b>", slide_title_style))
    story.append(Paragraph("How Dr. Satyam Vishwakarma logs into the secure clinical control room on any device.", slide_subtitle_style))

    img_header_path = os.path.join(PROCESSED_IMG_DIR, "slide_header.jpg")
    img_login_path = os.path.join(PROCESSED_IMG_DIR, "slide_login.jpg")

    login_content = [
        [
            Paragraph("<b>1. Locate Doctor Portal Button</b>", card_title_style),
            Paragraph("<b>2. Enter Doctor Credentials</b>", card_title_style)
        ],
        [
            RLImage(img_header_path, width=365, height=270) if os.path.exists(img_header_path) else Paragraph("Header Image", card_body_style),
            RLImage(img_login_path, width=365, height=270) if os.path.exists(img_login_path) else Paragraph("Login Image", card_body_style)
        ],
        [
            Paragraph("Click the <b>'🔒 Doctor Portal'</b> button on top right of <b>vindhyaphysio.netlify.app</b>.", card_body_style),
            Paragraph("<b>Authorized Email:</b> <font color='#38BDF8'><b>shivamupsc8@gmail.com</b></font><br/><b>Private Password:</b> <font color='#F59E0B'><b>@Shivam0000</b></font> ➔ Click <b>'Login to Doctor Portal'</b>.", card_body_style)
        ]
    ]
    login_table = Table(login_content, colWidths=[382, 382])
    login_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_CARD),
        ('BOX', (0, 0), (-1, -1), 1, C_BLUE),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(login_table)
    story.append(PageBreak())

    # ============================== SLIDE 4: PATIENT INTAKE & TRANSLATOR ==============================
    story.append(Paragraph("<b>Step 2: Rapid Patient Intake & AI Hindi Translator</b>", slide_title_style))
    story.append(Paragraph("Register arriving patients in under 30 seconds with automatic live clock matching.", slide_subtitle_style))

    img_intake_path = os.path.join(PROCESSED_IMG_DIR, "slide_intake.jpg")

    intake_content = [
        [
            RLImage(img_intake_path, width=220, height=430) if os.path.exists(img_intake_path) else Paragraph("Intake Image", card_body_style),
            Paragraph(
                "<b>⚡ Key Intake Features:</b><br/><br/>"
                "• <b>Auto Live-Time Clock Match:</b> Arrival time automatically extracts the exact real-time clock (e.g. <i>03:10 PM</i>) with zero manual hassle.<br/><br/>"
                "• <b>Duration & Chronicity Selector:</b> 1-Tap dropdown for acute or chronic conditions (<i>1 to 2 Weeks, 1 to 3 Months, 6 Months to 1 Year, etc.</i>).<br/><br/>"
                "• <b>5-Source Referral Tracking:</b> Walk-in, Doctor Referral, Friend/Relative, Old Patient, Google Search, or Custom Referrer.<br/><br/>"
                "<b>✨ Standalone Built-in AI Medical Translation:</b><br/>"
                "Doctor can type raw complaints in Hindi or Hinglish:<br/>"
                "<i>'कमर में बहुत तेज दर्द है और पैर में झनझनाहट'</i><br/>"
                "➔ Click <b>'✨ Convert Hindi / Hinglish ➔ English'</b><br/>"
                "➔ Instantly translates to: <font color='#34D399'><b>'Severe lower back (lumbar) pain with lower extremity paresthesia, tingling and numbness.'</b></font><br/><br/>"
                "• <b>Save to Waiting Queue:</b> Generates unique Patient ID (e.g. <i>VPR-2026-1004</i>) and adds patient to Doctor's live queue.",
                card_body_large
            )
        ]
    ]
    intake_table = Table(intake_content, colWidths=[230, 535])
    intake_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_CARD),
        ('BOX', (0, 0), (-1, -1), 1, C_EMERALD),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(intake_table)
    story.append(PageBreak())

    # ============================== SLIDE 5: WAITING QUEUE & CONSULTATION ==============================
    story.append(Paragraph("<b>Step 3: Live Waiting Queue & Clinical Consultation Room</b>", slide_title_style))
    story.append(Paragraph("Seamless clinic flow: Reception registers arrival ➔ Doctor examines in Consultation Room.", slide_subtitle_style))

    img_consult_path = os.path.join(PROCESSED_IMG_DIR, "slide_consult.jpg")

    consult_content = [
        [
            RLImage(img_consult_path, width=220, height=430) if os.path.exists(img_consult_path) else Paragraph("Consult Image", card_body_style),
            Paragraph(
                "<b>🩺 Clinical Consultation & Fee Flow:</b><br/><br/>"
                "<b>1. Open Active Waiting Queue:</b><br/>"
                "Doctor sees the live list of all registered patients waiting outside.<br/><br/>"
                "<b>2. Start Doctor Consultation:</b><br/>"
                "Click <i>'🩺 Start Doctor Consultation'</i> to open the dedicated clinical examination modal.<br/><br/>"
                "<b>3. Clinical Diagnosis & Therapy Log:</b><br/>"
                "• Review the patient's reported symptoms.<br/>"
                "• Enter definitive diagnosis (e.g. <i>Lumbar Spondylosis L4-L5 Disc Bulge with Spasm</i>).<br/>"
                "• Log therapy administered (e.g. <i>IFT + Ultrasonic therapy for 15 mins + Core exercises</i>).<br/><br/>"
                "<b>4. 1-Tap Fee Presets:</b><br/>"
                "Tap preset fee chips: <b>₹300 | ₹500 | ₹700 | ₹1000 | ₹1200</b> or enter custom fee.<br/><br/>"
                "<b>5. Next Follow-Up Scheduling:</b><br/>"
                "Choose next appointment date & time for structured patient rehabilitation.<br/><br/>"
                "<b>6. Finalize & Issue:</b> Automatically generates official sealed digital prescription receipt.",
                card_body_large
            )
        ]
    ]
    consult_table = Table(consult_content, colWidths=[230, 535])
    consult_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_CARD),
        ('BOX', (0, 0), (-1, -1), 1, C_GOLD),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(consult_table)
    story.append(PageBreak())

    # ============================== SLIDE 6: WHATSAPP RECEIPT & PDF ==============================
    story.append(Paragraph("<b>Step 4: Official PDF Receipt & 1-Tap WhatsApp Dispatch</b>", slide_title_style))
    story.append(Paragraph("Instant prescription & consultation receipt delivered directly to the patient's phone.", slide_subtitle_style))

    img_receipt_path = os.path.join(PROCESSED_IMG_DIR, "slide_receipt.jpg")

    receipt_content = [
        [
            RLImage(img_receipt_path, width=220, height=430) if os.path.exists(img_receipt_path) else Paragraph("Receipt Image", card_body_style),
            Paragraph(
                "<b>📲 1-Tap WhatsApp Receipt Features:</b><br/><br/>"
                "• <b>Prominent WhatsApp Share Button:</b> Pinned to both the top toolbar and bottom mobile bar for instant 1-tap access.<br/><br/>"
                "• <b>What Happens on Tap:</b><br/>"
                "1. Official PDF receipt automatically downloads to your device.<br/>"
                "2. Directly launches WhatsApp targeted to that patient's +91 phone number.<br/>"
                "3. Clinical consultation message is pre-typed and ready to send with 1 click!<br/><br/>"
                "<b>📄 What the Official Receipt Contains:</b><br/>"
                "• Official Clinic Logo & Header (Vindhya Physio & Rehab Center)<br/>"
                "• Patient Demographics (ID, Name, Age, Gender, Phone, Address)<br/>"
                "• Clinical Assessment (Chief Focus, Symptoms, Diagnosis, Therapy Given)<br/>"
                "• Next Recommended Follow-Up Appointment Date & Time<br/>"
                "• Fee Settlement Status (Paid & Settled - Cash / UPI)<br/>"
                "• Official Doctor Signature & Clinic Stamp.<br/><br/>"
                "• <b>Copy Phone Button:</b> 1-Tap copy of patient phone number for quick dialing.",
                card_body_large
            )
        ]
    ]
    receipt_table = Table(receipt_content, colWidths=[230, 535])
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

    img_hub_path = os.path.join(PROCESSED_IMG_DIR, "slide_hub.jpg")

    cloud_content = [
        [
            RLImage(img_hub_path, width=220, height=430) if os.path.exists(img_hub_path) else Paragraph("Hub Image", card_body_style),
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
                "• <b>Web Portal:</b> <font color='#38BDF8'><b>https://vindhyaphysio.netlify.app</b></font>",
                card_body_large
            )
        ]
    ]
    cloud_table = Table(cloud_content, colWidths=[230, 535])
    cloud_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NAVY_CARD),
        ('BOX', (0, 0), (-1, -1), 1, C_BLUE),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(cloud_table)

    # Build Document with onFirstPage and onLaterPages
    doc.build(story, onFirstPage=draw_slide_background, onLaterPages=draw_slide_background)
    print(f"✅ Generated Premium Presentation Deck PDF at: {pdf_path}")

if __name__ == "__main__":
    build_presentation()
