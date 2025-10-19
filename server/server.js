/* eslint-disable no-undef */
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path"); // ✅ Added for Render deployment
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });
console.log("🔍 Mongo URI loaded:", process.env.MONGODB_URI);

const app = express();

/* =====================================================
   🩹 Middleware to fix hardcoded localhost API calls
   ===================================================== */
app.use((req, res, next) => {
  // If frontend accidentally calls localhost:5000 — rewrite to Render domain
  if (req.url.includes("localhost:5000")) {
    const newUrl = req.url.replace(
      "http://localhost:5000",
      "https://pickwise.onrender.com"
    );
    console.log(`🔁 Redirecting localhost → ${newUrl}`);
    req.url = newUrl;
  }

  // Fix any Origin header from localhost dev
  if (req.headers.origin && req.headers.origin.includes("localhost:5173")) {
    req.headers.origin = "https://pickwise.onrender.com";
  }

  next();
});

/* =====================================================
   🧩 ROUTE IMPORTS
   ===================================================== */
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const recommendationRoutes = require("./routes/recommendations");
const feedbackRoutes = require("./routes/feedbackRoutes");
const moodRoutes = require("./routes/moodRoutes");
const groupSyncRoutes = require("./routes/groupsyncRoutes");
const chatRoutes = require("./routes/chatRoutes");
const adminRoutes = require("./routes/adminRoutes");
const tmdbRoutes = require("./routes/tmdbRoutes");
const spotifyRoutes = require("./routes/spotifyRoutes");
const booksRouter = require("./routes/books");
const { errorHandler } = require("./middlewares/errorHandler");

/* =====================================================
   ⚙️ MIDDLEWARE CONFIGURATION
   ===================================================== */
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local dev
      "https://pickwise.onrender.com", // production
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

/* =====================================================
   📧 OTP SUPPORT — Email Verification (Signup)
   ===================================================== */
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const OTP_EXPIRY_SECONDS = process.env.OTP_EXPIRY_SECONDS
  ? Number(process.env.OTP_EXPIRY_SECONDS)
  : 300;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const otpStore = new Map();
function generateOtp(digits = 6) {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
}
async function sendMail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: SMTP_USER,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    throw new Error("Email delivery failed");
  }
}

app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const otp = generateOtp(6);
    const expiresAt = Date.now() + OTP_EXPIRY_SECONDS * 1000;

    if (otpStore.has(email)) {
      clearTimeout(otpStore.get(email).timeoutHandle);
    }

    const timeoutHandle = setTimeout(
      () => otpStore.delete(email),
      OTP_EXPIRY_SECONDS * 1000
    );
    otpStore.set(email, { otp, expiresAt, timeoutHandle });

    await sendMail(
      email,
      "Your Signup OTP",
      `Your OTP is: ${otp}\n\nThis code will expire in ${Math.floor(
        OTP_EXPIRY_SECONDS / 60
      )} minutes.\n\nIf you did not request this, please ignore this email.`
    );

    console.log(`✅ OTP sent to ${email}: ${otp}`);
    return res.json({ ok: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("❌ send-otp error:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ error: "Email and OTP required" });

  const record = otpStore.get(email);
  if (!record)
    return res
      .status(400)
      .json({ ok: false, error: "No OTP requested or OTP expired" });

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ ok: false, error: "OTP expired" });
  }

  if (record.otp !== String(otp).trim())
    return res.status(400).json({ ok: false, error: "Invalid OTP" });

  clearTimeout(record.timeoutHandle);
  otpStore.delete(email);

  console.log(`✅ OTP verified for ${email}`);
  return res.json({ ok: true, message: "OTP verified" });
});

/* =====================================================
   🌐 API ROUTES
   ===================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/groupsync", groupSyncRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tmdb", tmdbRoutes);
app.use("/api/spotify", spotifyRoutes);
app.use("/api/books", booksRouter);

app.use(errorHandler);

/* =====================================================
   💾 DATABASE CONNECTION
   ===================================================== */
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI/MONGODB_URI in .env file");
} else {
  mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}

/* =====================================================
   ✅ Serve React frontend (Vite dist folder for Render)
   ===================================================== */
const clientDistPath = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDistPath));

app.get("/*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

/* =====================================================
   🚀 SERVER LISTENER
   ===================================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Serving frontend from: ${clientDistPath}`);
  console.log(
    `🌍 Frontend origin: ${process.env.CLIENT_ORIGIN || "http://localhost:5173"}`
  );
});
