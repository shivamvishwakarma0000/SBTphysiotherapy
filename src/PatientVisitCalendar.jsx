import React, { useState, useMemo } from "react";
import { cleanDateOnly, cleanTimeOnly } from "./receiptUtils";
import { patientApi } from "./apiService";

/**
 * PatientVisitCalendar
 * State-of-the-art clinical rehabilitation calendar component
 * Built for Vindhya Physio & Rehab Center (Dr. Satyam Vishwakarma)
 * Features:
 *  1. Total visits count & attendance adherence metrics
 *  2. Attended visit days highlighted with clinical badges
 *  3. Intelligently computed missing / missed therapy session days
 *  4. Eye-catching blinking & pulsing badge for the Next Clinical Follow-up
 *  5. Rich Drill-down view showing Next Follow-Up details AND complete Old Visits history
 */
export default function PatientVisitCalendar({
  visits = [],
  appointments = [],
  patientName = "",
  patientId = "",
  phone = "",
  onSelectVisit = null,
  onScheduleAppointment = null,
  onSaveAppointment = null,
  onSetFollowUpDate = null,
  isDailyCourse = false,
  dailyCourseDuration = "",
  dailyCourseStartDate = "",
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
  const [filterType, setFilterType] = useState("all"); // "all", "completed", "missed", "followup"

  const [overrideFollowUpKey, setOverrideFollowUpKey] = useState(null);

  const getCalPresetKey = (daysToAdd) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    if (d.getDay() === 0 && daysToAdd === 1) d.setDate(d.getDate() + 1); // skip Sunday if daily
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}/${m}/${y}`;
  };

  const handleSetDoctorFollowUp = async (targetDateKey) => {
    if (!targetDateKey) return;
    setOverrideFollowUpKey(targetDateKey);
    setSelectedDateStr(targetDateKey);
    if (onSetFollowUpDate) {
      await onSetFollowUpDate(targetDateKey);
    }
  };

  // Internal Schedule Visit Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedDate, setSchedDate] = useState(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toISOString().split("T")[0];
  });
  const [schedTime, setSchedTime] = useState("10:00 AM");
  const [schedReason, setSchedReason] = useState("Follow-up Rehabilitation Session");
  const [schedNotes, setSchedNotes] = useState("");
  const [schedSubmitting, setSchedSubmitting] = useState(false);
  const [schedSuccessMsg, setSchedSuccessMsg] = useState("");
  const [internalAppointments, setInternalAppointments] = useState([]);

  const allMergedAppointments = useMemo(() => {
    return [...(appointments || []), ...internalAppointments];
  }, [appointments, internalAppointments]);

  const minDateStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const quickDateOptions = useMemo(() => {
    const list = [];
    const now = new Date();
    const addDays = (num) => {
      const dt = new Date(now);
      dt.setDate(dt.getDate() + num);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()];
      const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dt.getMonth()];
      return {
        iso: `${y}-${m}-${d}`,
        display: `${d}/${m}/${y}`,
        sub: `${d} ${monthShort} (${dayName})`
      };
    };

    list.push({ label: "Tomorrow", ...addDays(1) });
    list.push({ label: "In 2 Days", ...addDays(2) });
    list.push({ label: "In 3 Days", ...addDays(3) });
    list.push({ label: "Next Week", ...addDays(7) });
    return list;
  }, []);

  const timeSlots = [
    "09:30 AM", "10:30 AM", "11:30 AM", "12:30 PM",
    "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
  ];

  const openSchedulerForDate = (dateKeyOrISO) => {
    if (dateKeyOrISO) {
      if (typeof dateKeyOrISO === "string" && dateKeyOrISO.includes("/")) {
        const parts = dateKeyOrISO.split("/");
        if (parts.length === 3) {
          setSchedDate(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateKeyOrISO)) {
        setSchedDate(dateKeyOrISO);
      }
    }
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!schedDate) return;
    setSchedSubmitting(true);
    try {
      const parts = schedDate.split("-");
      const ddmmyyyy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : schedDate;
      const payload = {
        patientId,
        patientName,
        phone,
        appointmentDate: ddmmyyyy,
        time: schedTime,
        reason: schedReason,
        notes: schedNotes,
        status: "Confirmed",
        requestedBy: isDoctorView ? "Doctor" : "Patient",
        createdAt: new Date().toISOString()
      };

      if (onSaveAppointment) {
        await onSaveAppointment(payload);
      } else {
        await patientApi.scheduleAppointment(payload);
      }

      setInternalAppointments((prev) => [...prev, payload]);
      setSelectedDateStr(ddmmyyyy);
      setSchedSuccessMsg(`Appointment booked for ${ddmmyyyy} at ${schedTime}! Dr. Satyam Vishwakarma has been alerted.`);
      setTimeout(() => {
        setShowScheduleModal(false);
        setSchedSuccessMsg("");
      }, 2500);
    } catch (err) {
      console.error("Failed to book appointment:", err);
      alert("Error scheduling appointment: " + (err.message || "Please try again."));
    } finally {
      setSchedSubmitting(false);
    }
  };

  // Standardize any date format to "DD/MM/YYYY" key
  const parseToKey = (rawDate) => {
    if (!rawDate) return "";
    const clean = cleanDateOnly(rawDate);
    if (!clean) return "";
    // If format is already DD/MM/YYYY, return
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;
    // If format is YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const parts = clean.split("-");
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return clean;
  };

  // Convert "DD/MM/YYYY" key back to Date object for timestamp comparisons
  const keyToDateObj = (dateKey) => {
    if (!dateKey) return null;
    const parts = dateKey.split("/");
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return new Date(dateKey);
  };

  // Today key
  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${d}/${m}/${y}`;
  }, []);

  // Sorted visits (oldest to newest for clinical timeline, and newest first for display)
  const sortedVisitsNewestFirst = useMemo(() => {
    const list = [...(visits || [])];
    return list.sort((a, b) => {
      const numA = parseInt(String(a?.visitNumber || 0).replace(/\D/g, "") || 0, 10);
      const numB = parseInt(String(b?.visitNumber || 0).replace(/\D/g, "") || 0, 10);
      if (numA !== numB) return numB - numA;
      const tA = keyToDateObj(parseToKey(a?.date))?.getTime() || 0;
      const tB = keyToDateObj(parseToKey(b?.date))?.getTime() || 0;
      return tB - tA;
    });
  }, [visits]);

  // Set of all dates the patient attended
  const attendedDateSet = useMemo(() => {
    const set = new Set();
    (visits || []).forEach((v) => {
      const k = parseToKey(v?.date);
      if (k) set.add(k);
    });
    return set;
  }, [visits]);

  // Find the Next Follow-Up Date (ONLY upcoming follow-up >= today, never in past!)
  const nextFollowUpInfo = useMemo(() => {
    const todayObj = keyToDateObj(todayKey);
    const todayTime = todayObj ? todayObj.getTime() : Date.now();

    // 1. Check doctor explicit milestone override first
    if (overrideFollowUpKey) {
      const oObj = keyToDateObj(overrideFollowUpKey);
      if (oObj && oObj.getTime() >= todayTime) {
        return {
          dateKey: overrideFollowUpKey,
          dateObj: oObj,
          time: "10:30 AM",
          isFutureOrToday: true
        };
      }
    }

    const allFollowUps = [];
    (visits || []).forEach((v) => {
      if (v?.followUpDate) {
        const k = parseToKey(v.followUpDate);
        const dObj = keyToDateObj(k);
        if (dObj) {
          allFollowUps.push({
            dateKey: k,
            dateObj: dObj,
            time: v.followUpTime || "",
            sourceVisit: v,
            isFutureOrToday: dObj.getTime() >= todayTime // strictly today or in future
          });
        }
      }
    });

    (allMergedAppointments || []).forEach((a) => {
      if (!a) return;
      const k = parseToKey(a.appointmentDate || a.date);
      const dObj = keyToDateObj(k);
      if (dObj) {
        allFollowUps.push({
          dateKey: k,
          dateObj: dObj,
          time: a.time || "",
          sourceAppointment: a,
          isFutureOrToday: dObj.getTime() >= todayTime
        });
      }
    });

    // Filter to ONLY genuine upcoming follow-ups that have NOT already been attended!
    const upcomingFollowUps = allFollowUps.filter(
      (fu) => fu.isFutureOrToday && !attendedDateSet.has(fu.dateKey)
    );

    if (upcomingFollowUps.length > 0) {
      upcomingFollowUps.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      return upcomingFollowUps[0];
    }

    // 2. If Daily Rehabilitation Course is active, automatically roll to next session
    if (isDailyCourse) {
      if (!attendedDateSet.has(todayKey)) {
        return {
          dateKey: todayKey,
          dateObj: todayObj || new Date(),
          time: "10:30 AM",
          isFutureOrToday: true
        };
      } else {
        const nextDt = new Date();
        nextDt.setDate(nextDt.getDate() + 1);
        if (nextDt.getDay() === 0) nextDt.setDate(nextDt.getDate() + 1); // skip Sunday
        const ny = nextDt.getFullYear();
        const nm = String(nextDt.getMonth() + 1).padStart(2, "0");
        const nd = String(nextDt.getDate()).padStart(2, "0");
        const nKey = `${nd}/${nm}/${ny}`;
        return {
          dateKey: nKey,
          dateObj: nextDt,
          time: "10:30 AM",
          isFutureOrToday: true
        };
      }
    }

    // If there is NO upcoming follow-up (all are in past or already attended): return null!
    return null;
  }, [visits, allMergedAppointments, todayKey, attendedDateSet, overrideFollowUpKey, isDailyCourse]);

  const nextFollowUpKey = nextFollowUpInfo ? nextFollowUpInfo.dateKey : null;

  // Calculate Missing / Gap days during the patient's active treatment course
  const missingDaysMap = useMemo(() => {
    const missing = {};

    // Collect timestamps of all visited dates and potential course start dates
    const startTimestamps = [];
    (visits || []).forEach((v) => {
      const dObj = keyToDateObj(parseToKey(v.date));
      if (dObj && !isNaN(dObj.getTime())) {
        startTimestamps.push(dObj.getTime());
      }
    });

    if (isDailyCourse && dailyCourseStartDate) {
      const sObj = keyToDateObj(parseToKey(dailyCourseStartDate));
      if (sObj && !isNaN(sObj.getTime())) {
        startTimestamps.push(sObj.getTime());
      }
    }

    if (startTimestamps.length === 0) return missing;

    const minTime = Math.min(...startTimestamps);
    const todayTime = keyToDateObj(todayKey)?.getTime() || Date.now();
    // Scan up to today (only past days are considered missed)
    const maxScanTime = todayTime;

    const ONE_DAY = 24 * 60 * 60 * 1000;
    // Iterate day-by-day from the day after start up to today
    for (let t = minTime + ONE_DAY; t < maxScanTime; t += ONE_DAY) {
      const curDate = new Date(t);
      // Skip Sundays (clinic typically closed or elective)
      if (curDate.getDay() === 0) continue;

      const d = String(curDate.getDate()).padStart(2, "0");
      const m = String(curDate.getMonth() + 1).padStart(2, "0");
      const y = curDate.getFullYear();
      const k = `${d}/${m}/${y}`;

      if (!attendedDateSet.has(k)) {
        missing[k] = {
          dateKey: k,
          dateObj: curDate,
          reason: "Missed scheduled therapy session during rehabilitation course"
        };
      }
    }

    // Also check if any past follow-up date had no visit logged
    (visits || []).forEach((v) => {
      if (v.followUpDate) {
        const fuKey = parseToKey(v.followUpDate);
        const fuObj = keyToDateObj(fuKey);
        if (fuObj && fuObj.getTime() < todayTime && !attendedDateSet.has(fuKey)) {
          missing[fuKey] = {
            dateKey: fuKey,
            dateObj: fuObj,
            reason: `Missed follow-up scheduled from Visit #${v.visitNumber || 1}`
          };
        }
      }
    });

    // Also check if any past appointment had no clinic visit logged
    (allMergedAppointments || []).forEach((a) => {
      if (!a) return;
      const apptKey = parseToKey(a.appointmentDate || a.date);
      const apptObj = keyToDateObj(apptKey);
      if (apptObj && apptObj.getTime() < todayTime && !attendedDateSet.has(apptKey)) {
        missing[apptKey] = {
          dateKey: apptKey,
          dateObj: apptObj,
          reason: `Missed scheduled appointment on ${apptKey}`
        };
      }
    });

    // Assign chronological missed index (e.g., Missed #1, Missed #2)
    const sortedMissingKeys = Object.keys(missing).sort((ka, kb) => {
      const ta = missing[ka].dateObj?.getTime() || 0;
      const tb = missing[kb].dateObj?.getTime() || 0;
      return ta - tb;
    });

    sortedMissingKeys.forEach((key, idx) => {
      missing[key].missedIndex = idx + 1;
    });

    return missing;
  }, [visits, allMergedAppointments, attendedDateSet, todayKey, isDailyCourse, dailyCourseStartDate]);

  const missingDaysCount = Object.keys(missingDaysMap).length;

  // Group visits, follow-ups, missing days, and appointments by DD/MM/YYYY date key
  const calendarMap = useMemo(() => {
    const map = {};

    (visits || []).forEach((v) => {
      const key = parseToKey(v.date);
      if (!key) return;
      if (!map[key]) map[key] = { visits: [], followUps: [], appointments: [], missed: null };
      map[key].visits.push({ ...v, itemType: "visit" });

      if (v.followUpDate) {
        const fuKey = parseToKey(v.followUpDate);
        if (fuKey) {
          if (!map[fuKey]) map[fuKey] = { visits: [], followUps: [], appointments: [], missed: null };
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
      if (!map[key]) map[key] = { visits: [], followUps: [], appointments: [], missed: null };
      map[key].appointments.push({ ...a, itemType: "appointment" });
    });

    // Attach missing day markers
    Object.keys(missingDaysMap).forEach((k) => {
      if (!map[k]) map[k] = { visits: [], followUps: [], appointments: [], missed: null };
      map[k].missed = missingDaysMap[k];
    });

    return map;
  }, [visits, appointments, missingDaysMap]);

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
    setSelectedDateStr(todayKey);
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
  const selectedEvents = calendarMap[selectedDateStr] || {
    visits: [],
    followUps: [],
    appointments: [],
    missed: null
  };

  const isSelectedDateNextFollowUp = selectedDateStr === nextFollowUpKey;

  // Countdown text for next follow up
  const followUpCountdownText = useMemo(() => {
    if (!nextFollowUpInfo) return "As advised by doctor";
    const todayObj = keyToDateObj(todayKey);
    const fuObj = nextFollowUpInfo.dateObj;
    if (!todayObj || !fuObj) return nextFollowUpInfo.dateKey;

    const diffDays = Math.round((fuObj.getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today!";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1) return `In ${diffDays} days`;
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`;
  }, [nextFollowUpInfo, todayKey]);

  return (
    <div className="clinical-calendar-container">
      {/* 1. Header Toolbar */}
      <div className="clinical-calendar-header">
        <div className="calendar-title-cluster">
          <div className="calendar-brand-badge">
            <span className="cal-icon">📅</span>
            <div>
              <h3 className="cal-heading">
                {patientName ? `${patientName}'s Visit Calendar` : "Patient Rehabilitation Calendar"}
              </h3>
              <p className="cal-subheading">
                {patientId ? `Patient ID: ${patientId} • ` : ""}
                Live attendance tracker, missed therapy days &amp; next follow-ups
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

          <button
            type="button"
            className="cal-schedule-action-btn"
            onClick={() => {
              if (isDoctorView && onScheduleAppointment) {
                onScheduleAppointment();
              } else {
                openSchedulerForDate(selectedDateStr);
              }
            }}
          >
            <span>+ {isDoctorView ? "Log Clinic Visit" : "Schedule Visit"}</span>
          </button>
        </div>
      </div>

      {/* Daily Rehabilitation Course Protocol Active Ribbon */}
      {isDailyCourse && (
        <div
          className="cal-daily-course-indicator-strip"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 95, 70, 0.08))",
            border: "1.5px solid #10b981",
            borderRadius: "12px",
            padding: "10px 14px",
            margin: "12px 0 4px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 8px #10b981" }}></span>
            <strong style={{ fontSize: "13px", color: "#065f46" }}>
              🔄 Continuous Daily Rehabilitation Protocol Active ({dailyCourseDuration || "Daily Auto Next-Day"})
            </strong>
          </div>
          <span style={{ fontSize: "11.5px", color: "#047857", fontWeight: "600" }}>
            ⚡ Attended sessions yield official receipts; skipped days record as missed.
          </span>
        </div>
      )}

      {/* 2. SUMMARY METRICS RIBBON (How Many Visits, When Visited, Missing Days, Next Follow-Up Blinking) */}
      <div className="calendar-metrics-ribbon">
        {/* Metric 1: Total Completed Visits */}
        <div className="cal-metric-card metric-completed">
          <div className="metric-icon-wrap green">🩺</div>
          <div className="metric-info">
            <span className="metric-label">Completed Visits</span>
            <strong className="metric-value">{visits.length} Sessions</strong>
            <span className="metric-sub">{attendedDateSet.size} Distinct Days Visited</span>
          </div>
        </div>

        {/* Metric 2: Attended Days */}
        <div className="cal-metric-card metric-attended">
          <div className="metric-icon-wrap blue">✅</div>
          <div className="metric-info">
            <span className="metric-label">Attendance Record</span>
            <strong className="metric-value">{attendedDateSet.size} Days Logged</strong>
            <span className="metric-sub">
              {visits.length > 0 ? `Started ${cleanDateOnly(visits[visits.length - 1]?.date)}` : "No visits yet"}
            </span>
          </div>
        </div>

        {/* Metric 3: Missing / Gap Days */}
        <div className="cal-metric-card metric-missed">
          <div className="metric-icon-wrap amber">⚠️</div>
          <div className="metric-info">
            <span className="metric-label">Missed Sessions</span>
            <strong className="metric-value">
              {missingDaysCount > 0 ? `Missing ${missingDaysCount}` : "0 Missed"}
            </strong>
            <span className="metric-sub">
              {missingDaysCount === 0 ? "Perfect 100% attendance!" : `${missingDaysCount} Unattended therapy ${missingDaysCount === 1 ? "day" : "days"}`}
            </span>
          </div>
        </div>

        {/* Metric 4: Next Follow-Up (BLINKING ALERT) */}
        <div className={`cal-metric-card metric-followup ${nextFollowUpKey ? "has-followup" : ""}`}>
          <div className="metric-icon-wrap indigo">
            <span className="blinking-bell-icon">🔔</span>
          </div>
          <div className="metric-info">
            <div className="metric-followup-header">
              <span className="metric-label">Next Follow-Up</span>
              {nextFollowUpKey && (
                <span className="followup-live-beacon" title="Next Follow-up active alert">
                  <span className="beacon-dot"></span>
                  <span className="beacon-text-desktop"> BLINKING</span>
                </span>
              )}
            </div>
            <strong className="metric-value text-indigo">
              {nextFollowUpKey ? nextFollowUpKey : "As Advised"}
            </strong>
            <span className="metric-sub followup-highlight-tag">
              {nextFollowUpKey ? `⚡ ${followUpCountdownText}` : "Schedule with Dr. Satyam"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Status Legend Filter Pills */}
      <div className="clinical-calendar-legend">
        <div
          className={`legend-item ${filterType === "all" ? "active-legend" : ""}`}
          onClick={() => setFilterType("all")}
        >
          <span className="legend-dot all-indicator"></span>
          <span className="legend-text">All Activity</span>
        </div>

        <div
          className={`legend-item ${filterType === "completed" ? "active-legend" : ""}`}
          onClick={() => setFilterType(filterType === "completed" ? "all" : "completed")}
        >
          <span className="legend-dot completed"></span>
          <span className="legend-text">Visited Days</span>
          <span className="legend-count">({visits.length})</span>
        </div>

        <div
          className={`legend-item ${filterType === "missed" ? "active-legend" : ""}`}
          onClick={() => setFilterType(filterType === "missed" ? "all" : "missed")}
        >
          <span className="legend-dot missed-indicator"></span>
          <span className="legend-text">Missing Days</span>
          <span className="legend-count">({missingDaysCount})</span>
        </div>

        <div
          className={`legend-item ${filterType === "followup" ? "active-legend" : ""}`}
          onClick={() => setFilterType(filterType === "followup" ? "all" : "followup")}
        >
          <span className="legend-dot upcoming followup-pulse-dot"></span>
          <span className="legend-text">Next Follow-Up</span>
          <span className="legend-count">
            {nextFollowUpKey ? `(🔔 ${nextFollowUpKey})` : "(0)"}
          </span>
        </div>

        <div className="legend-item" onClick={handleToday}>
          <span className="legend-dot today-indicator"></span>
          <span className="legend-text">Today ({todayKey})</span>
        </div>
      </div>

      {/* 4. Main Calendar Layout: Grid + Selected Date Drill-Down */}
      <div className="clinical-calendar-layout">
        {/* Left: The Month Grid */}
        <div className="calendar-month-grid-wrapper">
          <div className="calendar-weekdays-header">
            {daysOfWeek.map((day) => (
              <div key={day} className={`calendar-weekday-cell ${day === "Sun" ? "sunday-cell" : ""}`}>
                <span className="cal-weekday-desktop">{day}</span>
                <span className="cal-weekday-mobile">{day[0]}</span>
              </div>
            ))}
          </div>

          <div className="calendar-days-grid">
            {calendarDays.map((cell, idx) => {
              const data = calendarMap[cell.dateKey];
              const hasVisits = data && data.visits && data.visits.length > 0;
              const hasFollowUps = data && data.followUps && data.followUps.length > 0;
              const hasAppointments = data && data.appointments && data.appointments.length > 0;
              const isMissedDay = !!(data && data.missed);
              const isNextFollowUp = cell.dateKey === nextFollowUpKey;
              const isToday = cell.dateKey === todayKey;
              const isSelected = cell.dateKey === selectedDateStr;

              return (
                <div
                  key={`${cell.dateKey}-${idx}`}
                  className={`calendar-day-cell ${cell.isCurrentMonth ? "in-month" : "out-month"} ${isSelected ? "selected" : ""} ${isToday ? "is-today" : ""} ${hasVisits ? "has-visit" : ""} ${isMissedDay && !hasVisits ? "is-missed-day" : ""} ${isNextFollowUp ? "is-next-followup blinking-cell" : ""}`}
                  onClick={() => setSelectedDateStr(cell.dateKey)}
                  role="button"
                  tabIndex={0}
                  title={`Date: ${cell.dateKey}${isNextFollowUp ? " (⚡ NEXT CLINICAL FOLLOW-UP)" : ""}${isMissedDay && !hasVisits ? " (⚠️ Missed Therapy Session)" : ""}`}
                >
                  <div className="day-cell-top">
                    <span className="day-number">{cell.dayNumber}</span>
                    {isToday && <span className="today-badge">Today</span>}
                    {isNextFollowUp && (
                      <span className="followup-blinking-pill" title="Next Follow-up">
                        <span className="cal-pill-desktop">🔔 NEXT</span>
                        <span className="cal-pill-mobile">🔔</span>
                      </span>
                    )}
                  </div>

                  <div className="day-cell-badges">
                    {/* 1. Attended Visit Pill */}
                    {hasVisits && (
                      <div
                        className="day-event-pill completed-pill"
                        title={`${data.visits.length} Completed Visit(s) on ${cell.dateKey}`}
                      >
                        <span className="pill-dot">✓</span>
                        <span className="pill-text">
                          <span className="cal-pill-desktop">
                            Visit #{data.visits[0].visitNumber || 1}
                            {data.visits.length > 1 ? ` (+${data.visits.length - 1})` : ""}
                          </span>
                          <span className="cal-pill-mobile">
                            #{data.visits[0].visitNumber || 1}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* 2. Missed Session Pill: If missed and not visited, written missed ONLY! */}
                    {isMissedDay && !hasVisits && (
                      <div
                        className="day-event-pill missed-pill"
                        title={`Missed session #${data.missed?.missedIndex || ""} on ${cell.dateKey}. Therapy gap detected.`}
                      >
                        <span className="pill-dot">⚠️</span>
                        <span className="pill-text">
                          <span className="cal-pill-desktop">
                            {data.missed?.missedIndex ? `Missed #${data.missed.missedIndex}` : "Missed Day"}
                          </span>
                          <span className="cal-pill-mobile">
                            M{data.missed?.missedIndex || ""}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* 3. Follow-Up / Scheduled Pill: ONLY if NOT visited and NOT missed! */}
                    {!hasVisits && !isMissedDay && (hasFollowUps || hasAppointments) && (
                      <div
                        className={`day-event-pill follow-up-pill ${isNextFollowUp ? "pulsing-badge" : ""}`}
                        title="Scheduled Clinical Follow-up"
                      >
                        <span className="pill-dot">{isNextFollowUp ? "🔔" : "●"}</span>
                        <span className="pill-text">
                          <span className="cal-pill-desktop">
                            {isNextFollowUp ? "Next Follow-Up" : "Scheduled Visit"}
                          </span>
                          <span className="cal-pill-mobile">
                            {isNextFollowUp ? "Next" : "Appt"}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Doctor Milestone Setting Bar Right Below Calendar Grid */}
          {isDoctorView && onSetFollowUpDate && (
            <div
              className="cal-quick-followup-bar"
              style={{
                marginTop: "12px",
                padding: "12px 14px",
                background: "#f0f9ff",
                border: "1.5px solid #bae6fd",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>👆</span>
                  <span style={{ fontSize: "13px", color: "#0369a1", fontWeight: "700" }}>
                    Selected Calendar Date: <strong style={{ fontSize: "14px", color: "#0c4a6e" }}>{selectedDateStr}</strong>
                    {isSelectedDateNextFollowUp ? " (⚡ Current Target Follow-Up)" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSetDoctorFollowUp(selectedDateStr)}
                  style={{
                    padding: "7px 16px",
                    background: isSelectedDateNextFollowUp ? "#dcfce7" : "linear-gradient(135deg, #10b981, #059669)",
                    color: isSelectedDateNextFollowUp ? "#15803d" : "#ffffff",
                    border: isSelectedDateNextFollowUp ? "1.5px solid #86efac" : "none",
                    borderRadius: "8px",
                    fontWeight: "800",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    boxShadow: isSelectedDateNextFollowUp ? "none" : "0 2px 8px rgba(16, 185, 129, 0.35)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  🔔 {isSelectedDateNextFollowUp ? `✓ Follow-Up Active on ${selectedDateStr}` : `1-Tap: Set ${selectedDateStr} as Next Follow-Up`}
                </button>
              </div>

              {/* Quick Presets Row: 1-Tap Milestone Setting */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px dashed #bae6fd" }}>
                <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#0369a1" }}>⚡ Quick Milestones:</span>
                {[
                  { label: "Tomorrow", days: 1 },
                  { label: "In 2 Days", days: 2 },
                  { label: "In 1 Week", days: 7 },
                  { label: "In 15 Days", days: 15 },
                  { label: "1 Month (30 Days)", days: 30 }
                ].map((item) => {
                  const targetKey = getCalPresetKey(item.days);
                  const isCurrent = targetKey === nextFollowUpKey;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setSelectedDateStr(targetKey);
                        handleSetDoctorFollowUp(targetKey);
                      }}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                        border: isCurrent ? "1.5px solid #10b981" : "1px solid #93c5fd",
                        background: isCurrent ? "#ecfdf5" : "#ffffff",
                        color: isCurrent ? "#059669" : "#0284c7"
                      }}
                      title={`Set follow-up milestone for ${targetKey}`}
                    >
                      {item.label} ({targetKey})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Selected Date Drill-Down Panel */}
        <div className="calendar-drilldown-panel">
          {/* Section A: NEXT FOLLOW-UP SPOTLIGHT BANNER */}
          {nextFollowUpKey && (
            <div className={`drilldown-followup-spotlight ${isSelectedDateNextFollowUp ? "is-active-target" : ""}`}>
              <div className="spotlight-header">
                <span className="spotlight-bell-beacon">🔔</span>
                <div>
                  <h5 className="spotlight-title">Upcoming Clinical Follow-Up</h5>
                  <span className="spotlight-date">
                    {nextFollowUpKey} {nextFollowUpInfo.time ? `• ${nextFollowUpInfo.time}` : ""}
                  </span>
                </div>
                <span className="spotlight-countdown-badge">
                  {followUpCountdownText}
                </span>
              </div>
              <p className="spotlight-body">
                Dr. Satyam Vishwakarma scheduled this rehabilitation follow-up. Maintaining this milestone prevents symptom relapse.
              </p>
              <div className="spotlight-actions">
                <a
                  className="fu-whatsapp-confirm"
                  href={`https://wa.me/919793093316?text=${encodeURIComponent(
                    `Namaste Dr. Satyam Vishwakarma ji, I am confirming my follow-up appointment on ${nextFollowUpKey} for ${patientName || "Patient"} (Patient ID: ${patientId || "VPR"}).`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  💬 Confirm on WhatsApp (+91 9793093316)
                </a>
              </div>
            </div>
          )}

          {/* Section B: Selected Date Drill-Down Card */}
          <div className="drilldown-header">
            <div className="drilldown-date-display">
              <span className="drilldown-eyebrow">Clinical Record For Date</span>
              <h4 className="drilldown-selected-date">{selectedDateStr}</h4>
            </div>
            {selectedDateStr === todayKey ? (
              <span className="today-status-chip">Today</span>
            ) : isSelectedDateNextFollowUp ? (
              <span className="followup-status-chip">🔔 Target Follow-Up</span>
            ) : null}
          </div>

          <div className="drilldown-body">
            {/* Doctor Follow-Up Setting Action */}
            {isDoctorView && onSetFollowUpDate && (
              <div
                className="cal-doctor-followup-box"
                style={{
                  background: "#f0f9ff",
                  border: "1.5px solid #bae6fd",
                  borderRadius: "12px",
                  padding: "12px",
                  marginBottom: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#0369a1" }}>
                    👨‍⚕️ Doctor Milestone Control
                  </span>
                  {isSelectedDateNextFollowUp && (
                    <span style={{ fontSize: "10.5px", fontWeight: "800", color: "#0284c7", background: "#e0f2fe", padding: "2px 8px", borderRadius: "999px" }}>
                      Active Target Follow-Up
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleSetDoctorFollowUp(selectedDateStr)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    background: isSelectedDateNextFollowUp ? "#e0f2fe" : "linear-gradient(135deg, #0284c7, #0369a1)",
                    color: isSelectedDateNextFollowUp ? "#0369a1" : "#ffffff",
                    border: isSelectedDateNextFollowUp ? "1.5px solid #38bdf8" : "none",
                    borderRadius: "8px",
                    fontWeight: "800",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: isSelectedDateNextFollowUp ? "none" : "0 2px 8px rgba(2, 132, 199, 0.25)"
                  }}
                >
                  <span>🔔 {isSelectedDateNextFollowUp ? `Current Follow-Up (${selectedDateStr})` : `Set ${selectedDateStr} as Next Follow-Up`}</span>
                </button>
              </div>
            )}

            {/* If this selected day is flagged as a missed day */}
            {selectedEvents.missed && selectedEvents.visits.length === 0 && (
              <div className="drilldown-missed-alert-card">
                <div className="missed-alert-header">
                  <span>⚠️</span>
                  <strong>
                    Missed Session {selectedEvents.missed?.missedIndex ? `#${selectedEvents.missed.missedIndex}` : ""} ({selectedDateStr})
                  </strong>
                </div>
                <p>
                  No clinic visit was recorded on {selectedDateStr}. {missingDaysCount > 1 ? `(Total ${missingDaysCount} sessions missed in rehabilitation protocol).` : ""} Consistent therapy is vital for full spinal &amp; joint mobility recovery.
                </p>
                <button
                  type="button"
                  className="cal-mini-cta"
                  onClick={() => openSchedulerForDate(selectedDateStr)}
                >
                  + Schedule Make-Up Session
                </button>
              </div>
            )}

            {/* If no records on this date */}
            {selectedEvents.visits.length === 0 &&
              selectedEvents.followUps.length === 0 &&
              selectedEvents.appointments.length === 0 &&
              !selectedEvents.missed && (
                <div className="calendar-empty-day">
                  <span className="empty-day-icon">🗓️</span>
                  <h5>No clinical activity on this date</h5>
                  <p>
                    Tap any highlighted date on the calendar, or schedule a therapy appointment below.
                  </p>
                  <button
                    type="button"
                    className="cal-mini-cta"
                    onClick={() => {
                      if (isDoctorView && onScheduleAppointment) {
                        onScheduleAppointment();
                      } else {
                        openSchedulerForDate(selectedDateStr);
                      }
                    }}
                  >
                    + {isDoctorView ? `Log Visit on ${selectedDateStr}` : `Book Session on ${selectedDateStr}`}
                  </button>
                </div>
              )}

            {/* List of Visits Logged on this Selected Date */}
            {selectedEvents.visits.length > 0 && (
              <div className="drilldown-events-list">
                {selectedEvents.visits.map((v, i) => (
                  <div key={`visit-${i}`} className="drilldown-event-card completed-card">
                    <div className="card-status-bar completed-bar">
                      <span className="status-label">
                        ✅ Completed Visit #{v.visitNumber || i + 1}
                      </span>
                      {v.time && <span className="status-time">🕒 {cleanTimeOnly(v.time)}</span>}
                    </div>

                    <div className="card-detail-content">
                      <div className="detail-row">
                        <span className="detail-label">Chief Diagnosis / Reason:</span>
                        <strong className="detail-value text-primary">
                          {v.reason || v.diagnosis || "Physiotherapy Rehabilitation"}
                        </strong>
                      </div>

                      {v.treatmentNotes && (
                        <div className="detail-row">
                          <span className="detail-label">Clinical Treatment / Exercises:</span>
                          <span className="detail-value">{v.treatmentNotes}</span>
                        </div>
                      )}

                      {v.modalities && (
                        <div className="detail-row">
                          <span className="detail-label">Rehabilitation Modalities:</span>
                          <div className="modality-chips">
                            {String(v.modalities)
                              .split(",")
                              .map((m, mi) => (
                                <span key={mi} className="modality-chip">
                                  {m.trim()}
                                </span>
                              ))}
                          </div>
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
              </div>
            )}

            {/* Section C: COMPLETE PAST / OLD VISITS TIMELINE FOR THIS PATIENT */}
            <div className="patient-old-visits-history-section">
              <div className="old-visits-history-header">
                <h5>📜 Prior Visit History ({sortedVisitsNewestFirst.length})</h5>
                <span className="old-visits-sub">Full patient recovery timeline</span>
              </div>

              {sortedVisitsNewestFirst.length === 0 ? (
                <p className="no-prior-visits-text">No previous visits recorded yet.</p>
              ) : (
                <div className="old-visits-scrollable-list">
                  {sortedVisitsNewestFirst.map((ov, oIdx) => {
                    const isSelectedDateVisit = parseToKey(ov.date) === selectedDateStr;
                    return (
                      <div
                        key={`old-v-${ov.visitId || oIdx}`}
                        className={`old-visit-item-compact ${isSelectedDateVisit ? "is-selected-date-item" : ""}`}
                        onClick={() => setSelectedDateStr(parseToKey(ov.date))}
                      >
                        <div className="old-visit-top">
                          <span className="old-visit-num-badge">
                            Visit #{ov.visitNumber || sortedVisitsNewestFirst.length - oIdx}
                          </span>
                          <span className="old-visit-date-badge">
                            {cleanDateOnly(ov.date)} {ov.time ? `• ${cleanTimeOnly(ov.time)}` : ""}
                          </span>
                        </div>

                        <div className="old-visit-details">
                          <strong className="old-visit-diag">
                            {ov.diagnosis || ov.reason || "Rehabilitation Session"}
                          </strong>
                          {ov.treatmentNotes && (
                            <p className="old-visit-notes-snippet">{ov.treatmentNotes}</p>
                          )}
                        </div>

                        {onSelectVisit && (
                          <div className="old-visit-actions">
                            <button
                              type="button"
                              className="old-visit-receipt-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectVisit(ov);
                              }}
                            >
                              🧾 View Receipt
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE SCHEDULE VISIT & DATE PICKER MODAL */}
      {showScheduleModal && (
        <div className="cal-modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="cal-schedule-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-header">
              <div className="cal-modal-title-group">
                <span className="cal-modal-badge">🗓️ Clinical Appointment</span>
                <h3 className="cal-modal-title">Schedule Physical Therapy Visit</h3>
                <p className="cal-modal-subtitle">
                  {patientName ? `Patient: ${patientName} (${patientId || "Enrolled"})` : "Select your rehabilitation appointment date & time"}
                </p>
              </div>
              <button
                type="button"
                className="cal-modal-close-btn"
                onClick={() => setShowScheduleModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {schedSuccessMsg ? (
              <div className="cal-modal-success-state">
                <div className="cal-modal-success-icon">🎉</div>
                <h4 style={{ margin: "6px 0", color: "#15803d", fontSize: "18px", fontWeight: "800" }}>Appointment Confirmed!</h4>
                <p style={{ margin: "4px 0 14px 0", color: "#334155", fontSize: "14px" }}>{schedSuccessMsg}</p>
                <div className="cal-modal-success-note">
                  Dr. Satyam Vishwakarma has received your appointment notification. When you arrive at the clinic, the doctor will check you in and record Visit #{(visits?.length || 0) + 1}.
                </div>
                <button
                  type="button"
                  className="cal-modal-primary-btn"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSchedSuccessMsg("");
                  }}
                  style={{ marginTop: "16px", width: "100%" }}
                >
                  Done &amp; View on Calendar
                </button>
              </div>
            ) : (
              <form onSubmit={handleScheduleSubmit} className="cal-modal-form">
                {/* Quick Date Presets */}
                <div className="cal-form-group">
                  <label className="cal-form-label">
                    <span>Quick Date Presets</span>
                  </label>
                  <div className="cal-quick-dates-row">
                    {quickDateOptions.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        className={`cal-quick-date-chip ${schedDate === opt.iso ? "active" : ""}`}
                        onClick={() => setSchedDate(opt.iso)}
                      >
                        <span className="quick-label">{opt.label}</span>
                        <span className="quick-sub">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Picker Input */}
                <div className="cal-form-group">
                  <label className="cal-form-label" htmlFor="cal-date-input">
                    <span>Select Specific Date</span>
                    <span className="cal-label-hint">Pick on Calendar (Min: Today)</span>
                  </label>
                  <input
                    id="cal-date-input"
                    type="date"
                    className="cal-form-input"
                    min={minDateStr}
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    required
                  />
                </div>

                {/* Preferred Time Slot */}
                <div className="cal-form-group">
                  <label className="cal-form-label">
                    <span>Preferred Consultation / Therapy Time</span>
                  </label>
                  <div className="cal-time-slots-grid">
                    {timeSlots.map((ts) => (
                      <button
                        key={ts}
                        type="button"
                        className={`cal-time-slot-chip ${schedTime === ts ? "active" : ""}`}
                        onClick={() => setSchedTime(ts)}
                      >
                        {ts}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clinical Focus / Reason */}
                <div className="cal-form-group">
                  <label className="cal-form-label" htmlFor="cal-reason-select">
                    <span>Reason / Treatment Focus</span>
                  </label>
                  <select
                    id="cal-reason-select"
                    className="cal-form-select"
                    value={schedReason}
                    onChange={(e) => setSchedReason(e.target.value)}
                  >
                    <option value="Follow-up Rehabilitation Session">Follow-up Rehabilitation Session</option>
                    <option value="Spine / Lower Back Decompression (L4-L5)">Spine / Lower Back Decompression (L4-L5)</option>
                    <option value="Cervical Spine / Neck Pain &amp; Stiffness">Cervical Spine / Neck Pain &amp; Stiffness</option>
                    <option value="Knee Joint Mobilization &amp; Strengthening">Knee Joint Mobilization &amp; Strengthening</option>
                    <option value="Frozen Shoulder Rehabilitation">Frozen Shoulder Rehabilitation</option>
                    <option value="Electrotherapy &amp; IFT Modality">Electrotherapy &amp; IFT Modality</option>
                    <option value="General Physiotherapy Progress Review">General Physiotherapy Progress Review</option>
                  </select>
                </div>

                {/* Patient Symptoms / Notes */}
                <div className="cal-form-group">
                  <label className="cal-form-label" htmlFor="cal-notes-input">
                    <span>Symptom Updates / Specific Note (Optional)</span>
                  </label>
                  <input
                    id="cal-notes-input"
                    type="text"
                    className="cal-form-input"
                    placeholder="e.g. Mild morning stiffness, feeling better..."
                    value={schedNotes}
                    onChange={(e) => setSchedNotes(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="cal-modal-actions">
                  <button
                    type="button"
                    className="cal-modal-cancel-btn"
                    onClick={() => setShowScheduleModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cal-modal-submit-btn"
                    disabled={schedSubmitting}
                  >
                    {schedSubmitting ? "Booking & Alerting Doctor..." : "📅 Confirm & Schedule Visit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
