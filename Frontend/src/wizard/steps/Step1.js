import React, { useState, useEffect } from "react";
import API from "../../services/api";

/* ======================
   INCOTERMS
====================== */
const INCOTERMS = [
  "DAP",
  "EXW",
  "CIF",
  "CIP",
  "CFR",
  "CPT",
  "DAT",
  "DDP",
  "FAS",
  "FCA",
  "FOB",
];

export default function Step1({ initial = {}, onNext, onUpdate = () => {} }) {
  const [form, setForm] = useState({
    enquiry_no: "",
    ff: "",
    customer: "",
    invoice_no: "",
    invoice_date: "",
    part_no: "",
    part_desc: "",
    part_net_wt: "",
    part_qty: "",
    packaging_wt: "",
    box_size: "",
    net_wt: "",
    gross_wt: "",
    package_type: "",
    mode: "Sea",
    dispatch_date: "",
    incoterm: "",
    sb_no: "",
    sb_date: "",
    ...initial,
  });

  /* ============================
     AUTO ENQUIRY NUMBER
  ============================ */
  useEffect(() => {
    if (form.enquiry_no) return;

    fetch("https://backend-project-2fav.onrender.com/api/v1/shipment/enquiry-number")
      .then((res) => res.json())
      .then((data) => {
        if (data?.enquiryNo) {
          setForm((prev) => ({ ...prev, enquiry_no: data.enquiryNo }));
          onUpdate({ enquiry_no: data.enquiryNo });
        }
      })
      .catch(() => {
        const fallback = `QMRel-${Date.now()}`;
        setForm((prev) => ({ ...prev, enquiry_no: fallback }));
        onUpdate({ enquiry_no: fallback });
      });
  }, [form.enquiry_no, onUpdate]);

  /* ============================
     AUTO FETCH PART DESCRIPTION
  ============================ */
  useEffect(() => {
    if (!form.part_no) return;

    API.get(`/parts/${form.part_no}`)
      .then((res) => {
        if (res.data?.part_desc) {
          setForm((prev) => ({
            ...prev,
            part_desc: res.data.part_desc,
          }));
          onUpdate({ part_desc: res.data.part_desc });
        }
      })
      .catch(() => {
        // silently ignore if not found
        // user can type description manually
      });
  }, [form.part_no]);

  /* ============================
     SAVE NEW PART WHEN DESCRIPTION CHANGES
  ============================ */
  const saveNewPart = async (partNo, partDesc) => {
    if (!partNo || !partDesc) return;
    try {
      await API.post("/parts", { part_no: partNo, part_desc: partDesc });
      console.log("New part saved:", partNo);
    } catch (err) {
      console.log("Failed to save part:", err);
    }
  };

  /* ============================
     NET & GROSS WEIGHT CALC
  ============================ */
  useEffect(() => {
    const partNet = Number(form.part_net_wt);
    const qty = Number(form.part_qty);
    const packaging = Number(form.packaging_wt);

    let net = "";
    let gross = "";

    if (partNet > 0 && qty > 0) net = partNet * qty;
    if (net > 0 && packaging > 0) gross = net + packaging;

    setForm((prev) => ({
      ...prev,
      net_wt: net || prev.net_wt,
      gross_wt: gross || prev.gross_wt,
    }));

    onUpdate({
      net_wt: net,
      gross_wt: gross,
    });
  }, [form.part_net_wt, form.part_qty, form.packaging_wt]);

  /* ======================
     HANDLE INPUT CHANGE
  ====================== */
  function change(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    onUpdate({ ...form, [name]: value });
  }

  return (
    <div className="step-form">
      <h3 className="step-title">Step 1 — Shipment Details</h3>

      {/* Row 1 */}
      <div className="form-grid">
        <div className="field">
          <label>Enquiry No</label>
          <input className="input" value={form.enquiry_no} readOnly />
        </div>

        <div className="field">
          <label>Freight Forwarder</label>
          <input
            className="input"
            name="ff"
            value={form.ff}
            onChange={change}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="form-grid">
        <div className="field">
          <label>Customer</label>
          <input
            className="input"
            name="customer"
            value={form.customer}
            onChange={change}
          />
        </div>

        <div className="field">
          <label>Invoice No</label>
          <input
            className="input"
            name="invoice_no"
            value={form.invoice_no}
            onChange={change}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="form-grid">
        <div className="field">
          <label>Invoice Date</label>
          <input
            className="input"
            type="date"
            name="invoice_date"
            value={form.invoice_date}
            onChange={change}
          />
        </div>

        <div className="field">
          <label>Dispatch Date</label>
          <input
            className="input"
            type="date"
            name="dispatch_date"
            value={form.dispatch_date}
            onChange={change}
          />
        </div>
      </div>

      {/* Part Section */}
      <div className="form-grid">
        <div className="field full">
          <label>Part No</label>
          <input
            className="input"
            name="part_no"
            value={form.part_no}
            onChange={change}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="field full">
          <label>Part Description</label>
          <input
            className="input"
            name="part_desc"
            value={form.part_desc}
            onChange={change}
            onBlur={() => saveNewPart(form.part_no, form.part_desc)}
            placeholder="Part Description"
          />
        </div>
      </div>

      {/* Weights */}
      <div className="form-grid">
        <div className="field">
          <label>Part Net Wt (per unit)</label>
          <input
            className="input"
            name="part_net_wt"
            value={form.part_net_wt}
            onChange={change}
          />
        </div>

        <div className="field">
          <label>Quantity</label>
          <input
            className="input"
            name="part_qty"
            value={form.part_qty}
            onChange={change}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label>Packaging Weight</label>
          <input
            className="input"
            name="packaging_wt"
            value={form.packaging_wt}
            onChange={change}
          />
        </div>

        <div className="field">
          <label>Gross Weight</label>
          <input
            className="input"
            name="gross_wt"
            value={form.gross_wt}
            onChange={change}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label>Net Weight (Auto)</label>
          <input className="input" value={form.net_wt} readOnly />
        </div>

        <div className="field">
          <label>Box Size</label>
          <input
            className="input"
            name="box_size"
            value={form.box_size}
            onChange={change}
          />
        </div>
      </div>

      {/* Logistics */}
      <div className="form-grid">
        <div className="field">
          <label>Package Type</label>
          <input
            className="input"
            name="package_type"
            value={form.package_type}
            onChange={change}
          />
        </div>

        <div className="field">
          <label>Mode</label>
          <select
            className="input"
            name="mode"
            value={form.mode}
            onChange={change}
          >
            <option>Sea</option>
            <option>Air</option>
            <option>Road</option>
            <option>Rail</option>
          </select>
        </div>
      </div>

      <div className="form-grid">
        <div className="field full">
          <label>Incoterm</label>
          <select
            className="input"
            name="incoterm"
            value={form.incoterm}
            onChange={change}
          >
            <option value="">Select Incoterm</option>
            {INCOTERMS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SB */}
      <div className="form-grid">
        <div className="field">
          <label>SB No</label>
          <input
            className="input"
            name="sb_no"
            value={form.sb_no}
            onChange={change}
          />
        </div>

        <div className="field">
          <label>SB Date</label>
          <input
            className="input"
            type="date"
            name="sb_date"
            value={form.sb_date}
            onChange={change}
          />
        </div>
      </div>

      <div className="actions">
        <button className="btn primary" onClick={onNext}>
          Save & Next
        </button>
      </div>
    </div>
  );
}
