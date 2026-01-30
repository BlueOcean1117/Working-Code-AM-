require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

// Routes
const shipmentRoutes = require("./routes/shipments");
const fileRoutes = require("./routes/files");
const mailRoutes = require("./routes/mail");

// Models
const Shipment = require("./models/shipment");
const Part = require("./models/part");

const app = express();
const PORT = process.env.PORT || 4000;

/* ======================
   MIDDLEWARE
====================== */
app.use(
  cors({
    origin: true,
   /*  [  "http://localhost:3000",
      "https://blue-ocean-erp-system-1.vercel.app",
      "https://working-code-am.vercel.app"],*/

    credentials: true
  })
);


app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


/* ===================
   MONGODB CONNECTION
====================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* ======================
   ROUTES
====================== */
app.use("/api/shipments", shipmentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/mail", mailRoutes);

/* ======================
   ✅ HEALTH CHECK (REQUIRED – NO BEHAVIOR CHANGE)
====================== */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ONLINE",
    database: "MongoDB"
  });
});

/* ======================
   TEST API
====================== */
app.get("/api/v1/test", (_, res) => {
  res.json({
    status: "OK",
    database: "MongoDB Atlas",
    timestamp: new Date().toISOString()
  });
});

/* ======================
   ENQUIRY NUMBER
====================== */
app.get("/api/enquiry-number", async (_, res) => {
  try {
    const year = new Date().getFullYear();

    const last = await Shipment
      .findOne({ enquiry_no: new RegExp(`^QMRel-${year}-`) })
      .sort({ createdAt: -1 });

    let seq = 1;
    if (last) {
      const parts = last.enquiry_no.split("-");
      seq = parseInt(parts[2]) + 1;
    }

    res.json({
      enquiryNo: `QMRel-${year}-${String(seq).padStart(4, "0")}`
    });
  } catch (err) {
    console.error("Enquiry error:", err);
    res.status(500).json({ error: "Failed to generate enquiry number" });
  }
});

/* ======================
   FETCH ALL SHIPMENTS
====================== */
app.get("/api/v1/shipments", async (_, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });
    res.json(shipments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shipments" });
  }
});

/* ======================
   DASHBOARD SUMMARY
====================== */
app.get("/api/v1/shipments/dashboard/summary", async (_, res) => {
  try {
    const totalShipments = await Shipment.countDocuments();

    const modeWise = await Shipment.aggregate([
      { $group: { _id: "$mode", count: { $sum: 1 } } },
      { $project: { mode: "$_id", count: 1, _id: 0 } }
    ]);

    const statusWise = await Shipment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } }
    ]);

    res.json({ totalShipments, modeWise, statusWise });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Dashboard fetch failed" });
  }
});

/* ======================
   PART MASTER
====================== */
app.get("/api/parts/:partNo", async (req, res) => {
  try {
    const part = await Part.findOne({ part_no: req.params.partNo });
    res.json(part || {});
  } catch (err) {
    res.status(500).json({ error: "Part fetch failed" });
  }
});

app.post("/api/parts", async (req, res) => {
  try {
    const { part_no, part_desc } = req.body;

    if (!part_no || !part_desc) {
      return res.status(400).json({ error: "Missing data" });
    }

    await Part.updateOne(
      { part_no },
      { part_desc },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Part save failed" });
  }
});

/* ======================
   MAIL (GMAIL SMTP)
====================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

transporter.verify(err => {
  if (err) console.error("MAIL ERROR:", err);
  else console.log("✅ MAIL READY");
});

/* ======================
   START SERVER
====================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 ERP API running on port ${PORT}`);
});
