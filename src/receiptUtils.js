import { jsPDF } from "jspdf";
import { CLINIC_LOGO_B64, DOCTOR_SIGNATURE_B64 } from "./pdfAssets.js";

export const cleanDateOnly = (d) => {
  if (!d) return new Date().toISOString().slice(0, 10);
  const s = String(d).trim();
  if (s.includes("GMT") || s.includes("T") || s.length > 10) {
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return s.slice(0, 10);
};

export const cleanTimeOnly = (t) => {
  if (!t) return "";
  const s = String(t).trim();
  if (s.includes("1899") || s.includes("GMT") || s.includes("Standard Time")) {
    const match = s.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    return match ? match[1] : "";
  }
  return s;
};

export const buildReceiptPDF = (receipt) => {
  const { patient, visit } = receipt;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Dark Header Banner
  doc.setFillColor(7, 25, 39);
  doc.rect(0, 0, 210, 44, "F");

  // Clinic Official Receipt Logo
  try {
    if (CLINIC_LOGO_B64) {
      doc.addImage(CLINIC_LOGO_B64, "PNG", 14, 6, 58, 18.91);
    }
  } catch (err) {
    console.log("Could not render logo in PDF:", err);
  }

  // Emerald & Gold Accent Lines
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 44, 105, 2.5, "F");
  doc.setFillColor(234, 179, 8);
  doc.rect(105, 44, 105, 2.5, "F");

  // Address & Phone below logo on left
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 220, 230);
  doc.text("Amravati Chauraha, Vindhyachal, Mirzapur (U.P.)", 14, 32);
  doc.text("Phone: +91 9793093316  |  WhatsApp: +91 8382024264", 14, 38);

  // Doctor Details on Top Right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("DR. SATYAM VISHWAKARMA", 196, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(180, 210, 220);
  doc.text("Consultant Physiotherapist", 196, 25, { align: "right" });
  doc.text("Regd. Clinical Practitioner", 196, 31, { align: "right" });

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
  doc.text(`Visit No: #${visit.visitNumber || 1}`, 85, 72);
  doc.text(`Date & Time: ${cleanDateOnly(visit.date)} ${visit.time || ""}`, 130, 72);

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

  const feeY = 165 + (splitNotes.length * 5.2);
  
  // Fee Box inside Section 2
  const cleanFeeNum = String(visit.fee || "500").replace(/[^0-9]/g, "");
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(20, feeY, 170, 14, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(3, 105, 161);
  doc.text("Consultation & Treatment Fee:", 25, feeY + 9);
  doc.setFontSize(10.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`Rs. ${cleanFeeNum}`, 78, feeY + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Status: Paid & Settled (Cash / UPI)", 118, feeY + 9);

  const nextY = feeY + 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("Next Follow-up:", 20, nextY);
  doc.setFont("helvetica", "bold");
  if (visit.followUpDate) {
    doc.setTextColor(16, 185, 129);
    doc.text(`${visit.followUpDate} ${visit.followUpTime ? `(${visit.followUpTime})` : "(Regular Session)"}`, 60, nextY);
  } else {
    doc.setTextColor(100, 116, 139);
    doc.text("None Required / SOS (Only Today Consultation Completed)", 60, nextY);
  }

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

export const downloadReceiptPDF = (receipt) => {
  if (!receipt || !receipt.patient || !receipt.visit) return false;
  const doc = buildReceiptPDF(receipt);
  const fileName = `Vindhya_Receipt_${receipt.patient.name.replace(/\s+/g, "_")}_${receipt.patient.patientId}_Visit${receipt.visit.visitNumber || 1}.pdf`;
  doc.save(fileName);
  return fileName;
};
