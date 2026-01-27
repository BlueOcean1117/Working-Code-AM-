const mongoose = require("mongoose");

const ShipmentSchema = new mongoose.Schema(
  {
    enquiry_no: { type: String },
    ff: { type: String },
    customer: { type: String },

    invoice_no: { type: String },
    invoice_date: { type: String },

    part_no: { type: String },
    part_desc: { type: String },

    part_qty: { type: Number, default: null },
    net_wt: { type: Number, default: null },
    gross_wt: { type: Number, default: null },
    packaging_wt: { type: Number, default: null },

    box_size: { type: String },
    package_type: { type: String },

    mode: { type: String },

    dispatch_date: { type: Date, default: null },
    incoterm: { type: String },

    sb_no: { type: String },
    sb_date: { type: Date, default: null },

    etd: { type: Date, default: null },
    eta: { type: Date, default: null },

    bl_no: { type: String },
    container_no: { type: String },

    final_delivery: { type: Date, default: null },

    notify_email: { type: String },
    email_message: { type: String },

    manual_desc: { type: String },

    label_files: { type: [String], default: [] },
    label_urls: { type: [String], default: [] },

    status: { type: String, default: "ACTIVE" },
    delivery_status: { type: String, default: "IN_PROCESS" }
  },
  { timestamps: true }
);

// ✅ IMPORTANT: prevent OverwriteModelError
module.exports =
  mongoose.models.Shipment ||
  mongoose.model("Shipment", ShipmentSchema);
