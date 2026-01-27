const { default: mongoose } = require("mongoose");
const part = require("../models/part");
const shipment = require("../models/shipment");

function normalize(data) {
  const out = { ...data };

  Object.keys(out).forEach((k) => {
    if (out[k] === "") out[k] = null;
  });

  // Numbers
  ["part_qty", "net_wt", "gross_wt", "packaging_wt", "total_cost"].forEach(
    (f) => {
      if (out[f] !== null && out[f] !== undefined) {
        out[f] = Number(out[f]);
      }
    },
  );

  // Dates
  ["dispatch_date", "sb_date", "etd", "eta", "final_delivery"].forEach((d) => {
    if (out[d]) out[d] = new Date(out[d]);
  });

  return out;
}

exports.fetchDashboardSummary = async (req, res) => {
  try {
    const totalShipments = await shipment.countDocuments();

    const modeWise = await shipment.aggregate([
      { $group: { _id: "$mode", count: { $sum: 1 } } },
      { $project: { mode: "$_id", count: 1, _id: 0 } },
    ]);

    const statusWise = await shipment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);

    res.json({ totalShipments, modeWise, statusWise });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Dashboard fetch failed" });
  }
};

exports.addShipment = async (req, res) => {
  try {
    const data = normalize(req.body);

    if (data.part_no && data.part_desc) {
      await part.updateOne(
        { part_no: data.part_no },
        { part_desc: data.part_desc },
        { upsert: true },
      );
    }

    const result = await shipment.create({
      ...data,
      status: "ACTIVE",
      delivery_status: "IN_PROCESS",
    });

    // ✅ REQUIRED FIX
    res.json({ id: result._id.toString() });
  } catch (err) {
    console.error("🔥 MONGO CREATE ERROR 🔥");
    console.error(err);

    res.status(500).json({
      message: err.message,
      name: err.name,
      errors: err.errors,
    });
  }
};

exports.updateShipment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid shipment ID" });
    }

    const data = normalize(req.body);

    const updated = await shipment.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
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

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const isValid = mongoose.Types.ObjectId.isValid(req.params.id);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid shipment ID" });
    }

    await shipment.findByIdAndUpdate(req.params.id, {
      delivery_status: req.body.delivery_status,
    });

    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false });
  }
};

exports.updateManualDesc = async (req, res) => {
  try {
    const isValid = mongoose.Types.ObjectId.isValid(req.params.id);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid shipment ID" });
    }

    await shipment.findByIdAndUpdate(req.params.id, {
      manual_desc: req.body.manual_desc,
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
};

exports.bulkUploadShipments = async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const docs = rows.map((r) => ({
      ...normalize(r),
      status: "ACTIVE",
      delivery_status: "IN_PROCESS",
    }));

    await shipment.insertMany(docs);

    fs.unlinkSync(req.file.path);
    res.json({ success: true, inserted: docs.length });
  } catch (err) {
    console.error("BULK ERROR:", err);
    res.status(500).json({ error: "Bulk upload failed" });
  }
};

exports.getEnquiryNumber = async (req, res) => {
  try {
    const year = new Date().getFullYear();

    const last = await shipment
      .findOne({
        enquiry_no: new RegExp(`^QMRel-${year}-`),
      })
      .sort({ createdAt: -1 });

    let seq = 1;
    if (last) {
      const parts = last.enquiry_no.split("-");
      seq = parseInt(parts[2]) + 1;
    }

    res.json({
      enquiryNo: `QMRel-${year}-${String(seq).padStart(4, "0")}`,
    });
  } catch (err) {
    console.error("Enquiry error:", err);
    res.status(500).json({ error: "Failed to generate enquiry number" });
  }
};

exports.fetchAllShipments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * limit;

    const matchQuery = {
      status: { $ne: "DELETED" },
    };

    if(req.query?.search) {
      matchQuery["$or"] = [
        { enquiry_no: { $regex: req.query.search, $options: "i" } },
        { part_no: { $regex: req.query.search, $options: "i" } },
        { part_desc: { $regex: req.query.search, $options: "i" } },
        { customer_name: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const shipments = await shipment.aggregate([
      {
        $match: matchQuery,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);
    return res.json(shipments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shipments" });
  }
};
