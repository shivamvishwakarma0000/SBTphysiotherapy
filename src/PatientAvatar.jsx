import React from "react";

// =============================================================================
// PATIENT VECTOR FACE AVATAR COMPONENT (Clean clinical avatar without photo upload)
// =============================================================================
export function PatientAvatar({ patient, size = 68 }) {
  const gender = String(patient?.gender || "").toLowerCase();
  const name = patient?.name || patient?.patientName || "Patient";
  const isFemale = gender.includes("female") || gender === "f" || gender.includes("woman") || gender.includes("girl");

  const charCode = name.charCodeAt(0) || 0;
  const gradients = [
    "linear-gradient(135deg, #0284c7, #0369a1)",
    "linear-gradient(135deg, #10b981, #047857)",
    "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    "linear-gradient(135deg, #f59e0b, #b45309)",
    "linear-gradient(135deg, #ec4899, #be185d)",
    "linear-gradient(135deg, #06b6d4, #0e7490)"
  ];
  const bg = gradients[charCode % gradients.length];

  return (
    <div
      className="patient-vector-avatar"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: "50%",
        background: bg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
        border: "3px solid #ffffff",
        position: "relative",
        flexShrink: 0
      }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size * 0.72}
        height={size * 0.72}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {isFemale ? (
          <>
            <circle cx="32" cy="22" r="11" fill="#ffffff" />
            <path d="M18 25C18 16 24 10 32 10C40 10 46 16 46 25C46 32 43 37 43 37L21 37C21 37 18 32 18 25Z" fill="#ffffff" opacity="0.35" />
            <path d="M14 56C14 44 22 39 32 39C42 39 50 44 50 56H14Z" fill="#ffffff" />
          </>
        ) : (
          <>
            <circle cx="32" cy="21" r="11" fill="#ffffff" />
            <path d="M12 56C12 43 21 38 32 38C43 38 52 43 52 56H12Z" fill="#ffffff" />
          </>
        )}
      </svg>
      <span
        style={{
          position: "absolute",
          bottom: "1px",
          right: "1px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: "#10b981",
          border: "2px solid #ffffff",
          display: "block"
        }}
        title="Active Clinic Patient"
      />
    </div>
  );
}

export default PatientAvatar;
