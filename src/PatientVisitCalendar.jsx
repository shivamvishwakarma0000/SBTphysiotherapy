import React, { useState, useMemo } from "react";
import { cleanDateOnly, cleanTimeOnly } from "./receiptUtils";
import { patientApi } from "./apiService";

/**
 * PatientVisitCalendar
 * State-of-the-art clinical rehabilitation calendar component
 * Built for Vindhy Physiotherapy & Rehab Center (Dr. Satyam Vishwakarma)
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
  condition = "",
  onSelectVisit = null,
  onScheduleAppointment = null,
  onSaveAppointment = null,
  onSetFollowUpDate = null,
  isDailyCourse = false,
  dailyCourseDuration = "",
  dailyCourseStartDate = "",
  dailyCourseEndDate = "",
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

  const [overrideFollowUpKey, setOverrideFollowUpKey] = useState(null);
  const [showPriorHistory, setShowPriorHistory] = useState(false);

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

    list.push({ label: "Today", ...addDays(0) });
    list.push({ label: "Tomorrow", ...addDays(1) });
    list.push({ label: "In 2 Days", ...addDays(2) });
    list.push({ label: "Next Week", ...addDays(7) });
    return list;
  }, []);

  const timeSlots = [
    "09:30 AM", "10:30 AM", "11:30 AM", "12:30 PM",
    "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
  ];

  // Prevent collision: Compute slots already occupied by appointments or visits on selected date
  const occupiedSlotsOnSchedDate = useMemo(() => {
    if (!schedDate) return new Set();
    const parts = schedDate.split("-");
    const ddmmyyyy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : schedDate;

    const set = new Set();
    const allApts = [...(appointments || []), ...(internalAppointments || [])];
    allApts.forEach(apt => {
      const aptDate = cleanDateOnly(apt.date || apt.appointmentDate);
      if (aptDate === ddmmyyyy && apt.status !== "Rejected" && apt.status !== "Doctor Not Available" && apt.status !== "Cancelled") {
        const cleanT = cleanTimeOnly(apt.time);
        if (cleanT) set.add(cleanT);
      }
    });
    (visits || []).forEach(v => {
      const vDate = cleanDateOnly(v.date);
      if (vDate === ddmmyyyy) {
        const cleanT = cleanTimeOnly(v.time);
        if (cleanT) set.add(cleanT);
      }
    });
    return set;
  }, [schedDate, appointments, internalAppointments, visits]);

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
    } else {
      setSchedDate(minDateStr);
    }
    setShowScheduleModal(true);
  };

  const [lastBookedSession, setLastBookedSession] = useState(null);

  const handleScheduleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!schedDate) return;

    const parts = schedDate.split("-");
    const ddmmyyyy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : schedDate;

    // Check collision before proceeding
    if (occupiedSlotsOnSchedDate.has(schedTime)) {
      alert(`⚠️ Slot Clash: The ${schedTime} slot on ${ddmmyyyy} is already reserved for another appointment. Please choose another open time slot.`);
      return;
    }

    setSchedSubmitting(true);
    try {
      const initialStatus = isDoctorView ? "Approved" : "Pending Approval";
      const payload = {
        patientId,
        patientName,
        phone,
        date: ddmmyyyy,
        appointmentDate: ddmmyyyy,
        time: schedTime,
        reason: schedReason || "Follow-up Rehabilitation Session",
        notes: "",
        status: initialStatus,
        requestedBy: isDoctorView ? "Doctor" : "Patient",
        createdAt: new Date().toISOString()
      };

      let res;
      if (onSaveAppointment) {
        res = await onSaveAppointment(payload);
      } else {
        res = await patientApi.scheduleAppointment(payload);
      }

      if (res && res.ok === false) {
        alert("⚠️ Booking Notice: " + (res.error || "Slot conflict detected. Please select another slot."));
        return;
      }

      setInternalAppointments((prev) => [...prev, payload]);
      setSelectedDateStr(ddmmyyyy);
      setLastBookedSession({
        date: ddmmyyyy,
        time: schedTime,
        reason: schedReason || "Follow-up Rehabilitation Session"
      });
      setSchedSuccessMsg(`Appointment requested for ${ddmmyyyy} at ${schedTime}!`);
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

  const dailyCourseSpan = useMemo(() => {
    if (!isDailyCourse) return null;
    const sKey = parseToKey(dailyCourseStartDate) || todayKey;
    const sObj = keyToDateObj(sKey) || new Date();

    let eKey = parseToKey(dailyCourseEndDate);
    let eObj = eKey ? keyToDateObj(eKey) : null;

    if (!eObj || isNaN(eObj.getTime())) {
      let days = 30; // default 30 days treatment plan
      const dur = String(dailyCourseDuration || "").toLowerCase();
      if (dur.includes("5 day")) days = 5;
      else if (dur.includes("7 day") || dur.includes("1 week")) days = 7;
      else if (dur.includes("10 day")) days = 10;
      else if (dur.includes("15 day")) days = 15;
      else if (dur.includes("30 day") || dur.includes("1 month")) days = 30;
      else if (dur.includes("60 day") || dur.includes("2 month")) days = 60;

      eObj = new Date(sObj.getTime());
      eObj.setDate(eObj.getDate() + (days - 1));
      const ed = String(eObj.getDate()).padStart(2, "0");
      const em = String(eObj.getMonth() + 1).padStart(2, "0");
      const ey = eObj.getFullYear();
      eKey = `${ed}/${em}/${ey}`;
    }

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.round((eObj.getTime() - sObj.getTime()) / ONE_DAY) + 1);

    const reservedDates = [];
    const reservedSet = new Set();
    for (let t = sObj.getTime(); t <= eObj.getTime() + 1000; t += ONE_DAY) {
      const cur = new Date(t);
      const cd = String(cur.getDate()).padStart(2, "0");
      const cm = String(cur.getMonth() + 1).padStart(2, "0");
      const cy = cur.getFullYear();
      const k = `${cd}/${cm}/${cy}`;
      reservedDates.push(k);
      reservedSet.add(k);
    }

    const attendedInCourse = reservedDates.filter(k => attendedDateSet.has(k)).length;

    return {
      startKey: sKey,
      endKey: eKey,
      totalDays,
      reservedDates,
      reservedSet,
      attendedCount: attendedInCourse,
      remainingCount: Math.max(0, totalDays - attendedInCourse)
    };
  }, [isDailyCourse, dailyCourseStartDate, dailyCourseEndDate, dailyCourseDuration, todayKey, attendedDateSet]);

  // Calculate Missing / Absent days during the patient's active treatment course
  const missingDaysMap = useMemo(() => {
    const missing = {};
    const todayTime = keyToDateObj(todayKey)?.getTime() || Date.now();

    // 1. If dailyCourseSpan is set (e.g. 30 days treatment plan):
    if (dailyCourseSpan && dailyCourseSpan.reservedDates.length > 0) {
      dailyCourseSpan.reservedDates.forEach(k => {
        const dObj = keyToDateObj(k);
        if (dObj && dObj.getTime() <= todayTime) {
          if (!attendedDateSet.has(k)) {
            missing[k] = {
              dateKey: k,
              dateObj: dObj,
              reason: "Absent / Missed scheduled physical therapy session"
            };
          }
        }
      });
    } else {
      // Collect timestamps of all visited dates
      const startTimestamps = [];
      (visits || []).forEach((v) => {
        const dObj = keyToDateObj(parseToKey(v.date));
        if (dObj && !isNaN(dObj.getTime())) {
          startTimestamps.push(dObj.getTime());
        }
      });
      if (startTimestamps.length > 0) {
        const minTime = Math.min(...startTimestamps);
        const ONE_DAY = 24 * 60 * 60 * 1000;
        for (let t = minTime + ONE_DAY; t < todayTime; t += ONE_DAY) {
          const curDate = new Date(t);
          const d = String(curDate.getDate()).padStart(2, "0");
          const m = String(curDate.getMonth() + 1).padStart(2, "0");
          const y = curDate.getFullYear();
          const k = `${d}/${m}/${y}`;
          if (!attendedDateSet.has(k)) {
            missing[k] = {
              dateKey: k,
              dateObj: curDate,
              reason: "Missed scheduled therapy session"
            };
          }
        }
      }
    }

    // Also check past follow-ups
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

    // Assign chronological missed index
    const sortedMissingKeys = Object.keys(missing).sort((ka, kb) => {
      const ta = missing[ka].dateObj?.getTime() || 0;
      const tb = missing[kb].dateObj?.getTime() || 0;
      return ta - tb;
    });

    sortedMissingKeys.forEach((key, idx) => {
      missing[key].missedIndex = idx + 1;
    });

    return missing;
  }, [visits, allMergedAppointments, attendedDateSet, todayKey, dailyCourseSpan]);

  const missingDaysCount = Object.keys(missingDaysMap).length;

  // Compute Attendance % and Predicted Clinical Recovery % based on Condition & Sessions
  const { attendancePercentage, attendedDaysCount, totalScheduledElapsed, predictedRecoveryPct, conditionLabel } = useMemo(() => {
    const todayTime = keyToDateObj(todayKey)?.getTime() || Date.now();
    let totalElapsed = 0;
    let attendedInPeriod = 0;

    if (dailyCourseSpan && dailyCourseSpan.reservedDates.length > 0) {
      const elapsedDates = dailyCourseSpan.reservedDates.filter(k => {
        const dObj = keyToDateObj(k);
        return dObj && dObj.getTime() <= todayTime;
      });
      totalElapsed = Math.max(1, elapsedDates.length);
      attendedInPeriod = elapsedDates.filter(k => attendedDateSet.has(k)).length;
    } else {
      const totalDays = attendedDateSet.size + missingDaysCount;
      totalElapsed = Math.max(1, totalDays);
      attendedInPeriod = attendedDateSet.size;
    }

    const attendancePct = Math.round((attendedInPeriod / totalElapsed) * 100);

    // Condition-based benchmark for predicted recovery calculation
    const condStr = String(condition || visits[0]?.reason || "").toLowerCase();
    let benchmarkSessions = 18;
    let condName = "General Physiotherapy";

    if (condStr.includes("spine") || condStr.includes("back") || condStr.includes("sciatica") || condStr.includes("disc")) {
      benchmarkSessions = 20;
      condName = "Spine & Back Pain";
    } else if (condStr.includes("cervical") || condStr.includes("neck")) {
      benchmarkSessions = 14;
      condName = "Cervical & Neck Spondylosis";
    } else if (condStr.includes("knee") || condStr.includes("acl") || condStr.includes("arthritis")) {
      benchmarkSessions = 22;
      condName = "Knee & Joint Rehab";
    } else if (condStr.includes("cup") || condStr.includes("hijama")) {
      benchmarkSessions = 5;
      condName = "Cupping Therapy";
    } else if (condStr.includes("shoulder") || condStr.includes("frozen")) {
      benchmarkSessions = 20;
      condName = "Frozen Shoulder";
    } else if (condStr.includes("paralysis") || condStr.includes("stroke") || condStr.includes("neuro")) {
      benchmarkSessions = 35;
      condName = "Neuro Rehabilitation";
    } else if (condStr.includes("sport") || condStr.includes("ligament")) {
      benchmarkSessions = 15;
      condName = "Sports Injury Recovery";
    } else if (condStr.includes("post-op") || condStr.includes("post-surg") || condStr.includes("surgery")) {
      benchmarkSessions = 25;
      condName = "Post-Surgical Rehab";
    }

    const target = (dailyCourseSpan && dailyCourseSpan.totalDays > 0) ? dailyCourseSpan.totalDays : benchmarkSessions;
    const completed = visits.length;

    let recovery = 15; // baseline intake done
    if (completed > 0) {
      recovery = Math.round((completed / target) * 100);
      if (attendancePct >= 90 && completed > 2) recovery += 5;
      else if (attendancePct < 60 && completed > 2) recovery -= 5;
      recovery = Math.max(20, Math.min(95, recovery));
    }

    return {
      attendancePercentage: Math.min(100, attendancePct),
      attendedDaysCount: attendedInPeriod,
      totalScheduledElapsed: totalElapsed,
      predictedRecoveryPct: recovery,
      conditionLabel: condName
    };
  }, [dailyCourseSpan, todayKey, attendedDateSet, missingDaysCount, condition, visits]);

  // Group visits, follow-ups, missing days, and appointments by DD/MM/YYYY date key
  const calendarMap = useMemo(() => {
    const map = {};

    (visits || []).forEach((v) => {
      const key = parseToKey(v.date);
      if (!key) return;
      if (!map[key]) map[key] = { visits: [], followUps: [], appointments: [], missed: null };
      
      const vNum = parseInt(String(v.visitNumber || 0).replace(/\D/g, ""), 10);
      const isDuplicate = map[key].visits.some(existing => {
        if (v.visitId && existing.visitId && existing.visitId === v.visitId) return true;
        const exNum = parseInt(String(existing.visitNumber || 0).replace(/\D/g, ""), 10);
        return vNum > 0 && exNum > 0 && exNum === vNum;
      });

      if (!isDuplicate) {
        map[key].visits.push({ ...v, itemType: "visit" });
      }

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
      if (a.status === "Completed") return; // Completed appointments removed from pending calendar slots
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

    // Attach reserved daily course slots
    if (dailyCourseSpan) {
      const todayTime = keyToDateObj(todayKey)?.getTime() || Date.now();
      dailyCourseSpan.reservedDates.forEach((k) => {
        if (!map[k]) map[k] = { visits: [], followUps: [], appointments: [], missed: null };
        map[k].isDailyCourseSlot = true;
        const kObj = keyToDateObj(k);
        if (kObj && kObj.getTime() >= todayTime && map[k].visits.length === 0) {
          map[k].dailySlot = true;
        }
      });
    }

    return map;
  }, [visits, appointments, missingDaysMap, dailyCourseSpan, todayKey]);

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

          {isDoctorView && (
            <button
              type="button"
              className="cal-schedule-action-btn"
              onClick={() => {
                if (onScheduleAppointment) {
                  onScheduleAppointment();
                } else {
                  openSchedulerForDate(selectedDateStr);
                }
              }}
            >
              <span>+ Log Clinic Visit</span>
            </button>
          )}
        </div>
      </div>

      {/* Daily Rehabilitation Course Protocol Active Ribbon */}
      {isDailyCourse && dailyCourseSpan && (
        <div
          className="cal-daily-course-indicator-strip"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 95, 70, 0.08))",
            border: "1.5px solid #10b981",
            borderRadius: "12px",
            padding: "12px 16px",
            margin: "12px 0 16px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 8px #10b981" }}></span>
              <strong style={{ fontSize: "14px", color: "#065f46" }}>
                🗓️ Daily Therapy Schedule: From {dailyCourseSpan.startKey} to {dailyCourseSpan.endKey}
              </strong>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#047857" }}>
              Consecutive attendance active • {dailyCourseSpan.attendedCount} of {dailyCourseSpan.totalDays} sessions attended ({dailyCourseSpan.remainingCount} remaining). All daily slots reserved.
            </p>
          </div>
          {phone && (
            <a
              href={`https://wa.me/91${String(phone).replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                `Namaste ${patientName || "Patient"} ji, Dr. Satyam Vishwakarma has prescribed your daily physical therapy protocol from ${dailyCourseSpan.startKey} to ${dailyCourseSpan.endKey} (${dailyCourseSpan.totalDays} Days). All consecutive daily therapy slots are reserved for you at Vindhy Physiotherapy & Rehab Center.`
              )}`}
              target="_blank"
              rel="noreferrer"
              style={{
                background: "#25d366",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "800",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              📲 WhatsApp Schedule
            </a>
          )}
        </div>
      )}





      {/* 4. SEPARATE CARD C: MONTH CALENDAR GRID & DAILY DRILL-DOWN */}
      <div className="cal-section-panel calendar-panel" style={{ background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "14px", padding: "16px 18px", margin: "14px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>📅</span>
            <strong style={{ fontSize: "14.5px", color: "#0f172a" }}>Monthly Attendance &amp; Rehabilitation Calendar</strong>
          </div>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Select any day to inspect clinical notes</span>
        </div>

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
                  className={`calendar-day-cell ${cell.isCurrentMonth ? "in-month" : "out-month"} ${isSelected ? "selected" : ""} ${isToday ? "is-today" : ""} ${hasVisits ? "has-visit is-attended-day" : ""} ${isMissedDay && !hasVisits ? "is-missed-day is-absent-day" : ""} ${isNextFollowUp ? "is-next-followup blinking-cell" : ""}`}
                  onClick={() => setSelectedDateStr(cell.dateKey)}
                  role="button"
                  tabIndex={0}
                  title={`Date: ${cell.dateKey}${hasVisits ? " (✅ Present / Attended)" : ""}${isMissedDay && !hasVisits ? " (❌ Absent / Missed Therapy Session)" : ""}`}
                >
                  <div className="day-cell-top">
                    <span className="day-number">{cell.dayNumber}</span>
                    {isToday && <span className="today-badge">Today</span>}
                  </div>

                  <div className="day-cell-badges">
                    {/* 1. Attended Visit Pill (GREEN) */}
                    {hasVisits && (
                      <div
                        className="day-event-pill completed-pill"
                        title={`${data.visits.length} Completed Visit(s) on ${cell.dateKey}`}
                      >
                        <span className="pill-dot">✓</span>
                        <span className="pill-text">
                          <span className="cal-pill-desktop">
                            Present (#{data.visits[0].visitNumber || 1})
                            {data.visits.length > 1 ? ` (+${data.visits.length - 1})` : ""}
                          </span>
                          <span className="cal-pill-mobile">
                            P#{data.visits[0].visitNumber || 1}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* 2. Missed / Absent Session Pill (RED) */}
                    {isMissedDay && !hasVisits && (
                      <div
                        className="day-event-pill missed-pill"
                        title={`Absent on ${cell.dateKey}. Therapy gap detected.`}
                      >
                        <span className="pill-dot">✕</span>
                        <span className="pill-text">
                          <span className="cal-pill-desktop">
                            Absent
                          </span>
                          <span className="cal-pill-mobile">
                            Abs
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
                        <span className="pill-dot">●</span>
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

                    {/* 4. Reserved Daily Therapy Course Slot */}
                    {!hasVisits && !isMissedDay && !hasFollowUps && !hasAppointments && data?.dailySlot && (
                      <div
                        className="day-event-pill daily-slot-pill"
                        title="Reserved Daily Therapy Slot"
                        style={{
                          background: "#ecfdf5",
                          color: "#059669",
                          border: "1px solid #a7f3d0",
                          fontWeight: "700"
                        }}
                      >
                        <span className="pill-dot">🗓️</span>
                        <span className="pill-text">
                          <span className="cal-pill-desktop">Reserved</span>
                          <span className="cal-pill-mobile">Slot</span>
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

              {phone && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px dashed #bae6fd" }}>
                  <a
                    href={`https://wa.me/91${String(phone).replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                      `Namaste ${patientName || "Patient"} ji, Dr. Satyam Vishwakarma has scheduled your next physiotherapy follow-up on ${selectedDateStr}. Please arrive at Vindhy Physiotherapy & Rehab Center on time for optimal rehabilitation.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "#25d366",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "7px",
                      padding: "7px 14px",
                      fontSize: "12px",
                      fontWeight: "800",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 6px rgba(37, 211, 102, 0.25)"
                    }}
                  >
                    💬 Send Follow-Up Message to Patient WhatsApp (+91 {String(phone).replace(/\D/g, "").slice(-10)})
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Selected Date Drill-Down Panel */}
        <div className="calendar-drilldown-panel">

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

            {/* If there are booked appointments on this date */}
            {selectedEvents.appointments.length > 0 && (
              <div className="drilldown-appointments-list" style={{ marginBottom: "14px" }}>
                {selectedEvents.appointments.map((apt, ai) => (
                  <div
                    key={`apt-${ai}`}
                    style={{
                      background: "#f8fafc",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      marginBottom: "8px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                      <span style={{ fontWeight: "800", fontSize: "13px", color: "#0f172a" }}>
                        🗓️ Booked Session • {apt.time || "10:00 AM"}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          background:
                            apt.status === "Approved" || apt.status === "Confirmed" || apt.status === "Booked"
                              ? "#dcfce7"
                              : apt.status === "Rejected"
                              ? "#fee2e2"
                              : "#fef3c7",
                          color:
                            apt.status === "Approved" || apt.status === "Confirmed" || apt.status === "Booked"
                              ? "#15803d"
                              : apt.status === "Rejected"
                              ? "#b91c1c"
                              : "#b45309",
                          border:
                            apt.status === "Approved" || apt.status === "Confirmed" || apt.status === "Booked"
                              ? "1px solid #86efac"
                              : "1px solid #cbd5e1"
                        }}
                      >
                        {apt.status === "Completed"
                          ? "✅ Completed"
                          : apt.status === "Approved" || apt.status === "Confirmed" || apt.status === "Booked"
                          ? "✅ Booked & Confirmed by Doctor"
                          : apt.status === "Rejected"
                          ? "❌ Doctor Not Available"
                          : "⏳ Pending Doctor Confirmation"}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#475569" }}>
                      <strong>Service:</strong> {apt.service || apt.reason || "Physiotherapy Session"}
                    </p>
                    <a
                      href={`https://wa.me/919793093316?text=${encodeURIComponent(
                        `Namaste Dr. Satyam Vishwakarma ji, I am inquiring about my appointment booking on ${selectedDateStr} (${apt.time || "10:00 AM"}) for ${patientName || "Patient"} (Patient ID: ${patientId || "VPR"}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#25d366",
                        color: "#ffffff",
                        padding: "6px 12px",
                        borderRadius: "7px",
                        fontSize: "12px",
                        fontWeight: "700",
                        textDecoration: "none"
                      }}
                    >
                      💬 Confirm with Dr. Satyam on WhatsApp (+91 9793093316)
                    </a>
                  </div>
                ))}
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

            {/* Section: UPCOMING CLINICAL FOLLOW-UP SPOTLIGHT BANNER (ONLY IN PATIENT VIEW, HIDDEN IN DOCTOR PORTAL) */}
            {!isDoctorView && nextFollowUpKey && (
              <div className={`drilldown-followup-spotlight ${isSelectedDateNextFollowUp ? "is-active-target" : ""}`} style={{ marginTop: "16px", marginBottom: "16px" }}>
                <div className="spotlight-header">
                  <span className="spotlight-bell-beacon">🔔</span>
                  <div>
                    <h5 className="spotlight-title">Upcoming Clinical Follow-Up</h5>
                    <span className="spotlight-date">
                      {nextFollowUpKey} {nextFollowUpInfo?.time ? `• ${nextFollowUpInfo.time}` : ""}
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

            {/* Section C: COMPLETE PAST / OLD VISITS TIMELINE FOR THIS PATIENT (Collapsible so selected date records stay clear and uncluttered) */}
            <div className="patient-old-visits-history-section" style={{ marginTop: "14px", borderTop: "1.5px dashed #cbd5e1", paddingTop: "12px" }}>
              <div 
                className="old-visits-history-header"
                onClick={() => setShowPriorHistory(prev => !prev)}
                style={{ 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  background: showPriorHistory ? "#f8fafc" : "#f0f9ff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: showPriorHistory ? "1px solid #cbd5e1" : "1px solid #bae6fd"
                }}
                title="Click to toggle past receipts history"
              >
                <div>
                  <h5 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#0369a1" }}>
                    📜 All Prior Visits &amp; Receipts ({sortedVisitsNewestFirst.length})
                  </h5>
                  <span className="old-visits-sub" style={{ fontSize: "11px", color: "#64748b" }}>
                    {showPriorHistory ? "Tap to collapse previous receipts" : "Tap to expand full past history"}
                  </span>
                </div>
                <button
                  type="button"
                  style={{
                    background: showPriorHistory ? "#e2e8f0" : "#0284c7",
                    color: showPriorHistory ? "#334155" : "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: "800",
                    cursor: "pointer"
                  }}
                >
                  {showPriorHistory ? "▲ Hide" : "▼ Show"}
                </button>
              </div>

              {showPriorHistory && (
                sortedVisitsNewestFirst.length === 0 ? (
                  <p className="no-prior-visits-text" style={{ padding: "8px 12px", fontSize: "12px", color: "#64748b" }}>No previous visits recorded yet.</p>
                ) : (
                  <div className="old-visits-scrollable-list" style={{ marginTop: "10px" }}>
                    {sortedVisitsNewestFirst.map((ov, oIdx) => {
                      const isSelectedDateVisit = parseToKey(ov.date) === selectedDateStr;
                      return (
                        <div
                          key={`old-v-${ov.visitId || oIdx}`}
                          className={`old-visit-item-compact ${isSelectedDateVisit ? "is-selected-date-item" : ""}`}
                          onClick={() => {
                            setSelectedDateStr(parseToKey(ov.date));
                            if (onSelectVisit) {
                              onSelectVisit(ov);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                          title="Click to view full visit details and official receipt"
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
                )
              )}
            </div>
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
                <h4 style={{ margin: "6px 0", color: "#15803d", fontSize: "18px", fontWeight: "800" }}>
                  {isDoctorView ? "Appointment Scheduled!" : "Appointment Request Sent!"}
                </h4>
                <p style={{ margin: "4px 0 10px 0", color: "#334155", fontSize: "14px" }}>{schedSuccessMsg}</p>
                <div className="cal-modal-success-note">
                  {isDoctorView
                    ? "The follow-up slot has been recorded on the clinic roster and calendar."
                    : "Dr. Satyam Vishwakarma will review and confirm your slot. You can notify the doctor directly via WhatsApp below:"}
                </div>

                <a
                  href={`https://wa.me/919793093316?text=${encodeURIComponent(
                    `Namaste Dr. Satyam Vishwakarma ji, I have booked a rehabilitation visit on ${lastBookedSession?.date || schedDate} at ${lastBookedSession?.time || schedTime}${lastBookedSession?.reason ? ` (${lastBookedSession.reason})` : ""}. Patient ID: ${patientId || "VPR"}, Name: ${patientName || "Patient"}. Please confirm my slot.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "#25d366",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "13px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    margin: "14px 0 8px 0",
                    boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)"
                  }}
                >
                  💬 Inform &amp; Confirm with Dr. Satyam on WhatsApp (+91 9793093316)
                </a>

                <button
                  type="button"
                  className="cal-modal-primary-btn"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSchedSuccessMsg("");
                  }}
                  style={{ marginTop: "8px", width: "100%" }}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label className="cal-form-label" style={{ margin: 0 }}>
                      <span>Preferred Consultation / Therapy Time</span>
                    </label>
                    {occupiedSlotsOnSchedDate.size > 0 && (
                      <span style={{ fontSize: "11px", color: "#dc2626", fontWeight: "700" }}>
                        ⚠️ {occupiedSlotsOnSchedDate.size} slot(s) already booked
                      </span>
                    )}
                  </div>
                  <div className="cal-time-slots-grid">
                    {timeSlots.map((ts) => {
                      const isOccupied = occupiedSlotsOnSchedDate.has(ts);
                      return (
                        <button
                          key={ts}
                          type="button"
                          disabled={isOccupied}
                          className={`cal-time-slot-chip ${schedTime === ts ? "active" : ""} ${isOccupied ? "occupied-slot" : ""}`}
                          onClick={() => {
                            if (!isOccupied) setSchedTime(ts);
                          }}
                          title={isOccupied ? "This slot is already booked for another patient" : "Available slot"}
                          style={isOccupied ? {
                            opacity: 0.55,
                            cursor: "not-allowed",
                            background: "#fee2e2",
                            color: "#991b1b",
                            border: "1.5px dashed #f87171"
                          } : {}}
                        >
                          <span>{ts}</span>
                          {isOccupied && <span style={{ display: "block", fontSize: "9.5px", fontWeight: "800", color: "#b91c1c" }}>⛔ Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Clinical Focus / Reason (Optional) */}
                <div className="cal-form-group">
                  <label className="cal-form-label" htmlFor="cal-reason-select">
                    <span>Reason / Treatment Focus (Optional)</span>
                  </label>
                  <select
                    id="cal-reason-select"
                    className="cal-form-select"
                    value={schedReason}
                    onChange={(e) => setSchedReason(e.target.value)}
                  >
                    <option value="">-- Select Focus / Reason (Optional) --</option>
                    <option value="Follow-up Rehabilitation Session">Follow-up Rehabilitation Session</option>
                    <option value="Spine / Lower Back Decompression (L4-L5)">Spine / Lower Back Decompression (L4-L5)</option>
                    <option value="Cervical Spine / Neck Pain &amp; Stiffness">Cervical Spine / Neck Pain &amp; Stiffness</option>
                    <option value="Knee Joint Mobilization &amp; Strengthening">Knee Joint Mobilization &amp; Strengthening</option>
                    <option value="Frozen Shoulder Rehabilitation">Frozen Shoulder Rehabilitation</option>
                    <option value="Electrotherapy &amp; IFT Modality">Electrotherapy &amp; IFT Modality</option>
                    <option value="General Physiotherapy Progress Review">General Physiotherapy Progress Review</option>
                  </select>
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
