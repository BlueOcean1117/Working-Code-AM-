// frontend/src/wizard/steps/Step2.js
import React, { useState, useEffect } from "react";
import API from "../../services/api";

export default function Step2({ initial = {}, onNext, onPrev, onUpdate }) {
  const [form, setForm] = useState({
    label_files: [],
    label_urls: initial.label_urls || [],
    etd: "",
    eta: "",
    bl_no: "",
    container_no: "",
    final_delivery: "",
    notify_email: "",
    email_message: "",
    ...initial,
  });

  useEffect(() => {
    onUpdate(form);
  }, [form, onUpdate]); // push initial to parent

  function change(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    onUpdate({ ...form, [name]: value });
  }
  function sendMail() {
    if (!form.notify_email) {
      alert("Please enter recipient email");
      return;
    }

    API.post("/notification/send-tracking-email", {
      to: form.notify_email,
      subject: "Shipment Tracking Update",
      message: `
Shipment Tracking Details

BL No: ${form.bl_no}
Container No: ${form.container_no}
ETD: ${form.etd}
ETA: ${form.eta}
Final Delivery: ${form.final_delivery}

Message:
${form.email_message || ""}
    `,
    })
      .then(() => alert("Email sent successfully ✅"))
      .catch(() => alert("Failed to send email ❌"));
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    setForm((f) => ({ ...f, label_files: files }));
    onUpdate({ ...form, label_files: files });

    // Optional: upload immediately
    const fd = new FormData();
    files.forEach((file) => fd.append("files", file));
    try {
      const res = await API.post("/files/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // res.data should be array of { url, id }
      setForm((f) => ({ ...f, label_urls: res.data }));
      onUpdate({ ...form, label_urls: res.data });
    } catch (err) {
      console.error("Upload failed", err);
    }
  }

  return (
    <div>
      <h3>Step 2 — Tracking Details</h3>

      <div>
        <label className="muted">Upload Label Photos</label>
        <input type="file" accept="image/*" multiple onChange={handleFiles} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {form.label_urls?.map((u, i) => (
            <img
              key={i}
              src={u.url || u}
              style={{
                width: 80,
                height: 60,
                objectFit: "cover",
                borderRadius: 6,
              }}
              alt="label"
            />
          ))}
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label>ETD (Estimated Time of Departure)</label>
          <input
            type="date"
            name="etd"
            value={form.etd}
            onChange={change}
            className="input"
          />
        </div>

        <div className="field">
          <label>ETA (Estimated Time of Arrival)</label>
          <input
            type="date"
            name="eta"
            value={form.eta}
            onChange={change}
            className="input"
          />
        </div>
      </div>

      {/* BL / Container */}
      <div className="form-grid">
        <div className="field">
          <label>BL No</label>
          <input
            name="bl_no"
            value={form.bl_no}
            onChange={change}
            className="input"
            placeholder="Bill of Lading No"
          />
        </div>

        <div className="field">
          <label>Container No</label>
          <input
            name="container_no"
            value={form.container_no}
            onChange={change}
            className="input"
            placeholder="Container Number"
          />
        </div>
      </div>

      {/* Final Delivery */}
      <div className="field">
        <label>Final Delivery Date</label>
        <input
          type="date"
          name="final_delivery"
          value={form.final_delivery}
          onChange={change}
          className="input"
        />
      </div>
      <hr />

      <h4>📧 Send Tracking Email</h4>

      <input
        className="input"
        type="email"
        name="notify_email"
        placeholder="Recipient Email"
        value={form.notify_email}
        onChange={change}
      />

      <textarea
        className="input"
        name="email_message"
        placeholder="Optional message"
        value={form.email_message}
        onChange={change}
      />

      <button className="btn primary" onClick={sendMail}>
        Send Email
      </button>

      {/* Actions */}
      <div className="step-actions">
        <button className="btn outline" onClick={onPrev}>
          Back
        </button>
        <button className="btn primary" onClick={onNext}>
          Save & Next
        </button>
      </div>
    </div>
  );
}
