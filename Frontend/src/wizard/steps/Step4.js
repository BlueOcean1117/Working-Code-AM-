// frontend/src/wizard/steps/Step3.js
import React from "react";
import API from "../../services/api";

export default function Step3({ data = {}, onPrev, onSave }) {
  async function handleSave() {
    if (onSave) await onSave();
  }

  async function exportExcel() {
    // placeholder: call backend to return excel binary or implement client-side
    window.open(`https://backend-project-2fav.onrender.com/api/shipments/${data.id}/export/excel`);
  }

  async function exportPDF() {
    window.open(`https://backend-project-2fav.onrender.com/api/shipments/${data.id}/export/pdf`);
  }

  return (
    <div>
      <h3>Step3 — Review & Save</h3>

      <div className="card">
        <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(data, null, 2)}</pre>
      </div>

      <div style={{marginTop:12}} className="grid-2">
        <button className="btn" onClick={onPrev}>Back</button>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" onClick={exportExcel}>Export Excel</button>
          <button className="btn" onClick={exportPDF}>Export PDF</button>
          <button className="btn primary" onClick={onSave}>Save Shipment</button>
        </div>
      </div>
    </div>
  );
}
