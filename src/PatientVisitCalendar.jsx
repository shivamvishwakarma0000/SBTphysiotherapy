import React, { useState, useMemo } from "react";
import { cleanDateOnly, cleanTimeOnly } from "./receiptUtils";

/**
 * PatientVisitCalendar
 * High-fidelity clinical healthcare calendar component
 * Built for Vindhy Physio & Rehab Center using Stitch Design System tokens:
 * Primary Navy (#0B2A55), Action Blue (#2563EB), Healing Teal (#10B981)
 */
export default function PatientVisitCalendar({
  visits = [],
  appointments = [],
  patientName = "",
  patientId = "",
  onSelectVisit = null,
  onScheduleAppointment = null,
  isDoctorView = false
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${d}/${m}/${y}`;
  });
  const [filterType, setFilterType] = useState("all"); // "all", "completed", "upcoming"

  // Standardize dates to DD/MM/YYYY
  const parseToKey = (rawDate) => {
    if (!rawDate) return "";
    return cleanDateOnly(rawDate);
  };

  // Group visits and appointments by DD/MM/YYYY date key
  const calendarMap = useMemo(() => {
    const map = {};

    (visits || []).forEach((v) => {
      const key = parseToKey(v.date);
      if (!key) return;
      if (!map[key]) map[key] = { visits: [], followUps: [], appointments: [] };
      map[key].visits.push({ ...v, itemType: "visit" });

      // If this visit scheduled a follow-up, mark that follow-up date as well
      if (v.followUpDate) {
        const fuKey = parseToKey(v.followUpDate);
        if (fuKey) {
          if (!map[fuKey]) map[fuKey] = { visits: [], followUps: [], appointments: [] };
          map[fuKey].followUps.push({
            ...v,
            itemType: "follow-up",
            targetDate: fuKey,
            sourceVisitNumber: v.visitNumber
          });
        }
      }
    });

    (appointments || []).forEach((a) => {
      const key = parseToKey(a.appointmentDate || a.date);
      if (!key) return;
      if (!map[key]) map[key] = { visits: [], followUps: [], appointments: [] };
      map[key].appointments.push({ ...a, itemType: "appointment" });
    });

    return map;
  }, [visits, appointments]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    setSelectedDateStr(`${d}/${m}/${y}`);
  };

  // Month grid calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const key = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
      days.push({
        dayNumber: d,
        isCurrentMonth: false,
        dateKey: key
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const m = month + 1;
      const key = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${year}`;
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateKey: key
      });
    }

    // Next month padding (total slots = 35 or 42)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const key = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
      days.push({
        dayNumber: d,
        isCurrentMonth: false,
        dateKey: key
      });
    }

    return days;
  }, [year, month]);

  // Selected date events
  const selectedEvents = calendarMap[selectedDateStr] || { visits: [], followUps: [], appointments: [] };
  const allEventsForSelectedDate = [
    ...selectedEvents.visits,
    ...selectedEvents.followUps,
    ...selectedEvents.appointments
  ];

  // Today key
  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${d}/${m}/${y}`;
  }, []);

  return (
    <div className="clinical-calendar-container">
      {/* 1. Header Toolbar */}
      <div className="clinical-calendar-header">
        <div className="calendar-title-cluster">
          <div className="calendar-brand-badge">
            <span className="cal-icon">📅</span>
            <div>
              <h3 className="cal-heading">Patient Visit Calendar</h3>
              <p className="cal-subheading">
                {patientName ? `Rehabilitation timeline for ${patientName}` : "Clinical appointments & follow-up scheduler"}
              </p>
            </div>
          </div>
        </div>

        <div className="calendar-actions-cluster">
          <div className="calendar-nav-buttons">
            <button
              type="button"
              className="cal-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              ◀
            </button>
            <span className="cal-current-month-label">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              className="cal-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
            >
              ▶
            </button>
            <button
              type="button"
              className="cal-today-btn"
              onClick={handleToday}
            >
              Today
            </button>
          </div>

          {onScheduleAppointment && (
            <button
              type="button"
              className="cal-schedule-action-btn"
              onClick={onScheduleAppointment}
            >
              <span>+ Schedule Visit</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Status Legend Pills */}
      <div className="clinical-calendar-legend">
        <div className="legend-item" onClick={() => setFilterType(filterType === "completed" ? "all" : "completed")}>
          <span className="legend-dot completed"></span>
          <span className="legend-text">Completed Visit</span>
          <span className="legend-count">({visits.length})</span>
        </div>
        <div className="legend-item" onClick={() => setFilterType(filterType === "upcoming" ? "all" : "upcoming")}>
          <span className="legend-dot upcoming"></span>
          <span className="legend-text">Scheduled / Follow-Up</span>
          <span className="legend-count">
            ({(appointments.length || 0) + (visits.filter(v => v.followUpDate).length || 0)})
          </span>
        </div>
        <div className="legend-item">
          <span className="legend-dot today-indicator"></span>
          <span className="legend-text">Today</span>
        </div>
      </div>

      {/* 3. Main Calendar Layout: Grid + Selected Date Drill-Down */}
      <div className="clinical-calendar-layout">
        {/* Left: The Month Grid */}
        <div className="calendar-month-grid-wrapper">
          <div className="calendar-weekdays-header">
            {daysOfWeek.map((day) => (
              <div key={day} className="calendar-weekday-cell">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days-grid">
            {calendarDays.map((cell, idx) => {
              const data = calendarMap[cell.dateKey];
              const hasVisits = data && data.visits && data.visits.length > 0;
              const hasFollowUps = data && data.followUps && data.followUps.length > 0;
              const hasAppointments = data && data.appointments && data.appointments.length > 0;
              const isToday = cell.dateKey === todayKey;
              const isSelected = cell.dateKey === selectedDateStr;

              return (
                <div
                  key={`${cell.dateKey}-${idx}`}
                  className={`calendar-day-cell ${cell.isCurrentMonth ? "in-month" : "out-month"} ${isSelected ? "selected" : ""} ${isToday ? "is-today" : ""}`}
                  onClick={() => setSelectedDateStr(cell.dateKey)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="day-cell-top">
                    <span className="day-number">{cell.dayNumber}</span>
                    {isToday && <span className="today-badge">Today</span>}
                  </div>

                  <div className="day-cell-badges">
                    {hasVisits && (
                      <div className="day-event-pill completed-pill" title={`${data.visits.length} Completed Visit(s)`}>
                        <span className="pill-dot">✓</span>
                        <span className="pill-text">
                          {data.visits[0].reason ? data.visits[0].reason.slice(0, 14) : "Visit"}
                          {data.visits.length > 1 ? ` (+${data.visits.length - 1})` : ""}
                        </span>
                      </div>
                    )}

                    {(hasFollowUps || hasAppointments) && (
                      <div className="day-event-pill follow-up-pill" title="Upcoming Follow-Up / Appointment">
                        <span className="pill-dot">●</span>
                        <span className="pill-text">Follow-up</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Date Drill-Down Card */}
        <div className="calendar-drilldown-panel">
          <div className="drilldown-header">
            <div className="drilldown-date-display">
              <span className="drilldown-eyebrow">Daily Clinical Log</span>
              <h4 className="drilldown-selected-date">{selectedDateStr}</h4>
            </div>
            {selectedDateStr === todayKey && (
              <span className="today-status-chip">Current Date</span>
            )}
          </div>

          <div className="drilldown-body">
            {allEventsForSelectedDate.length === 0 ? (
              <div className="calendar-empty-day">
                <span className="empty-day-icon">🗓️</span>
                <h5>No clinical records on this date</h5>
                <p>
                  Click on any highlighted date on the calendar, or tap below to schedule a new therapy appointment.
                </p>
                {onScheduleAppointment && (
                  <button
                    type="button"
                    className="cal-mini-cta"
                    onClick={onScheduleAppointment}
                  >
                    + Schedule Session on {selectedDateStr}
                  </button>
                )}
              </div>
            ) : (
              <div className="drilldown-events-list">
                {selectedEvents.visits.map((v, i) => (
                  <div key={`visit-${i}`} className="drilldown-event-card completed-card">
                    <div className="card-status-bar completed-bar">
                      <span className="status-label">✅ Completed Clinic Visit #{v.visitNumber || (i + 1)}</span>
                      {v.time && <span className="status-time">🕒 {cleanTimeOnly(v.time)}</span>}
                    </div>

                    <div className="card-detail-content">
                      <div className="detail-row">
                        <span className="detail-label">Diagnosis / Reason:</span>
                        <strong className="detail-value text-primary">{v.reason || v.diagnosis || "Therapy Session"}</strong>
                      </div>

                      {v.treatment && (
                        <div className="detail-row">
                          <span className="detail-label">Treatment Provided:</span>
                          <span className="detail-value">{v.treatment}</span>
                        </div>
                      )}

                      {v.modalities && (
                        <div className="detail-row">
                          <span className="detail-label">Clinical Modalities:</span>
                          <div className="modality-chips">
                            {String(v.modalities).split(",").map((m, mi) => (
                              <span key={mi} className="modality-chip">{m.trim()}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {v.notes && (
                        <div className="detail-row notes-row">
                          <span className="detail-label">Doctor Notes:</span>
                          <p className="detail-notes">{v.notes}</p>
                        </div>
                      )}

                      {v.followUpDate && (
                        <div className="follow-up-marker">
                          <span>📅 Next Recommended Follow-up:</span>
                          <strong>{cleanDateOnly(v.followUpDate)}</strong>
                        </div>
                      )}
                    </div>

                    {onSelectVisit && (
                      <div className="card-action-footer">
                        <button
                          type="button"
                          className="view-receipt-link-btn"
                          onClick={() => onSelectVisit(v)}
                        >
                          View Official Receipt / Summary →
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {selectedEvents.followUps.map((fu, i) => (
                  <div key={`fu-${i}`} className="drilldown-event-card follow-up-card">
                    <div className="card-status-bar follow-up-bar">
                      <span className="status-label">🔔 Scheduled Clinical Follow-Up</span>
                      <span className="status-badge subtle-glow">Upcoming</span>
                    </div>

                    <div className="card-detail-content">
                      <p className="fu-explanation">
                        Follow-up scheduled from prior <strong>Visit #{fu.sourceVisitNumber || 1}</strong> ({fu.reason || "Rehab plan"}).
                      </p>
                      <div className="fu-action-row">
                        <a
                          className="fu-whatsapp-confirm"
                          href={`https://wa.me/919793093316?text=${encodeURIComponent(`Hello Dr. Satyam, I am confirming my follow-up appointment on ${selectedDateStr} for ${patientName || "Patient"} (ID: ${patientId}).`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          💬 Confirm on WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedEvents.appointments.map((a, i) => (
                  <div key={`appt-${i}`} className="drilldown-event-card appointment-card">
                    <div className="card-status-bar appointment-bar">
                      <span className="status-label">📌 Booked Appointment</span>
                      {a.time && <span className="status-time">{cleanTimeOnly(a.time)}</span>}
                    </div>
                    <div className="card-detail-content">
                      <p><strong>Reason:</strong> {a.reason || "Physiotherapy Consultation"}</p>
                      <p><small>Status: {a.status || "Confirmed"}</small></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
