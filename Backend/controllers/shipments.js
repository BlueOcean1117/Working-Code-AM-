const XLSX = require("xlsx");
const fs = require("fs");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const connectMongo = require("../config/database");
const Shipment = require("../models/shipment");
const Part = require("../models/part");

/* ================= MAIL ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/* ================= UTIL ================= */
// ✅ REQUIRED: normalize Mongo-safe payload
function normalize(data) {
  const out = { ...data };

  Object.keys(out).forEach(k => {
    if (out[k] === "") out[k] = null;
  });

  // Numbers
  ["part_qty", "net_wt", "gross_wt", "packaging_wt", "total_cost"].forEach(f => {
    if (out[f] !== null && out[f] !== undefined) {
      out[f] = Number(out[f]);
    }
  });

  // Dates
  ["dispatch_date", "sb_date", "etd", "eta", "final_delivery"].forEach(d => {
    if (out[d]) out[d] = new Date(out[d]);
  });

  return out;
}


/* ================= CREATE ================= */
exports.create = async (req, res) => {
  try {

    const data = normalize(req.body);

    if (data.part_no && data.part_desc) {
      await Part.updateOne(
        { part_no: data.part_no },
        { part_desc: data.part_desc },
        { upsert: true }
      );
    }

    const shipment = await Shipment.create({
      ...data,
      status: "ACTIVE",
      delivery_status: "IN_PROCESS"
    });

    // ✅ REQUIRED FIX
    res.json({ id: shipment._id.toString() });
  } catch (err) {
  console.error("🔥 MONGO CREATE ERROR 🔥");
  console.error(err);

  res.status(500).json({
    message: err.message,
    name: err.name,
    errors: err.errors
  });
}

};

/* ================= UPDATE ================= */
exports.update = async (req, res) => {
  try {
    await connectMongo();

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid shipment ID" });
    }

    const data = normalize(req.body);

    const updated = await Shipment.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    res.json({ success: true, shipment: updated });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "update failed" });
  }
};

/* ================= GET ONE ================= */
exports.get = async (req, res) => {
  try {
    await connectMongo();

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid shipment ID" });
    }

    const shipment = await Shipment.findById(id);
    if (!shipment) return res.status(404).json(null);

    res.json(shipment);
  } catch {
    res.status(500).json({ message: "fetch failed" });
  }
};

/* ================= LIST ================= */
exports.list = async (_, res) => {
  try {
    await connectMongo();
    const shipments = await Shipment.find()
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(shipments);
  } catch {
    res.json([]);
  }
};

/* ================= BULK UPLOAD ================= */
exports.bulkUpload = async (req, res) => {
  try {
    await connectMongo();

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const docs = rows.map(r => ({
      ...normalize(r),
      status: "ACTIVE",
      delivery_status: "IN_PROCESS"
    }));

    await Shipment.insertMany(docs);

    fs.unlinkSync(req.file.path);
    res.json({ success: true, inserted: docs.length });
  } catch (err) {
    console.error("BULK ERROR:", err);
    res.status(500).json({ error: "Bulk upload failed" });
  }
};

/* ================= DELIVERY STATUS ================= */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    await connectMongo();

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid shipment ID" });
    }

    await Shipment.findByIdAndUpdate(req.params.id, {
      delivery_status: req.body.delivery_status
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
};

/* ================= STATUS ================= */
exports.updateStatus = async (req, res) => {
  try {
    await connectMongo();

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid shipment ID" });
    }

    const updated = await Shipment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json({ success: true, shipment: updated });
  } catch {
    res.status(500).json({ message: "status update failed" });
  }
};

/* ================= MANUAL DESC ================= */
exports.updateManualDesc = async (req, res) => {
  try {
    await connectMongo();

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid shipment ID" });
    }

    await Shipment.findByIdAndUpdate(req.params.id, {
      manual_desc: req.body.manual_desc
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
};

/* ================= DASHBOARD ================= */
exports.dashboard = async (_, res) => {
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

    return res.json({ totalShipments, modeWise, statusWise });
  } catch {
    res.status(500).json({ message: "Dashboard fetch failed" });
  }
};

/* ================= MAIL ================= */
exports.sendTrackingMail = async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: req.body.notify_email,
      subject: "Shipment Tracking Update",
      html: `
        <p><b>BL No:</b> ${req.body.bl_no}</p>
        <p><b>Container No:</b> ${req.body.container_no}</p>
        <p><b>ETD:</b> ${req.body.etd}</p>
        <p><b>ETA:</b> ${req.body.eta}</p>
        <p>${req.body.email_message || ""}</p>
      `
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
};
