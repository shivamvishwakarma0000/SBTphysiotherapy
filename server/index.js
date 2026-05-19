import cors from "cors";
import express from "express";
import helmet from "helmet";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");
const assessmentFile = path.join(dataDir, "assessments.json");
const appointmentFile = path.join(dataDir, "appointments.json");
const port = process.env.PORT || 5174;
const host = process.env.HOST || "127.0.0.1";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "32kb" }));

async function ensureStore(file) {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(file, "utf8");
  } catch {
    await writeFile(file, "[]", "utf8");
  }
}

async function appendRecord(file, payload) {
  await ensureStore(file);
  const current = JSON.parse(await readFile(file, "utf8"));
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...payload
  };
  current.unshift(record);
  await writeFile(file, JSON.stringify(current, null, 2), "utf8");
  return record;
}

function sanitizeText(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 160);
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

async function notifyClinic(record) {
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  const payload = {
    to: "+918382024264",
    template: "new_patient_assessment",
    message: `New assessment: ${record.name}, ${record.phone}, ${record.painArea}, ${record.duration}`,
    record
  };
  if (!webhookUrl) return { queued: false, reason: "WHATSAPP_WEBHOOK_URL not configured" };
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return { queued: response.ok, status: response.status };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "dr-satyam-physio-api" });
});

app.post("/api/assessments", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const name = sanitizeText(req.body.name);
    if (!phone || name.length < 2) {
      return res.status(422).json({ error: "Valid patient name and Indian mobile number are required." });
    }
    const record = await appendRecord(assessmentFile, {
      name,
      phone,
      painArea: sanitizeText(req.body.painArea, "Neuro/Other"),
      duration: sanitizeText(req.body.duration, "Not specified"),
      appointmentDate: sanitizeText(req.body.appointmentDate)
    });
    const notification = await notifyClinic(record);
    res.status(201).json({ ok: true, record, notification });
  } catch (error) {
    res.status(500).json({ error: "Assessment could not be processed." });
  }
});

app.post("/api/appointments", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const name = sanitizeText(req.body.name);
    if (!phone || name.length < 2 || !req.body.date) {
      return res.status(422).json({ error: "Name, mobile number, and date are required." });
    }
    const record = await appendRecord(appointmentFile, {
      name,
      phone,
      date: sanitizeText(req.body.date),
      concern: sanitizeText(req.body.concern)
    });
    res.status(201).json({ ok: true, record });
  } catch {
    res.status(500).json({ error: "Appointment could not be processed." });
  }
});

app.use(express.static(path.join(root, "dist")));

app.use((req, res) => {
  res.sendFile(path.join(root, "dist", "index.html"));
});

app.listen(port, host, () => {
  console.log(`Physio API running on http://${host}:${port}`);
});
