import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import API from "../services/api";
import "./ShipmentsList.css";
import { useNavigate, useLocation } from "react-router-dom";
import BulkShipmentUpload from "./BulkShipmentUpload";
import { toast } from "react-toastify";

export default function ShipmentsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstLoad = useRef(true);

  // Pagination + search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const [total, setTotal] = useState(0);

  // Data
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [descValues, setDescValues] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [showStatusAction, setShowStatusAction] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");

  // Bulk Upload Modal
  const [visibleBulkUploadModal, setVisibleBulkUploadModal] = useState(false);

  // ---------- INITIAL LOAD ----------
  useEffect(() => {
    API.get("/test")
      .then((res) => {
        setBackendStatus(
          res.data.database === "Connected" ? "connected" : "offline"
        );
      })
      .catch(() => setBackendStatus("disconnected"))
      .finally(() => fetchAll());
  }, []);

  // ---------- FETCH SHIPMENTS ----------
  const fetchAll = () => {
    setLoading(true);
    setError("");

    API.get("/shipment", { params: { page, pageSize, search } })
      .then((res) => {
        const data = res.data?.shipments || res.data || [];
        setRows(data);
        setFilteredRows(data);
        setTotal(res.data?.total || data.length);
      })
      .catch((err) => {
        console.error("Failed to load shipments:", err);
        setError("Failed to load shipments. Check backend.");
        setRows([]);
        setFilteredRows([]);
      })
      .finally(() => setLoading(false));
  };

  // ---------- LIVE SEARCH ----------
  useEffect(() => {
    fetchAll();
  }, [page, pageSize, search]);

  // ---------- STATUS UPDATE ----------
  async function updateStatus(id, status) {
    try {
      await API.patch(`/shipment/delivery-status/${id}`, { status });
      fetchAll();
    } catch {
      toast.error("Status update failed");
    }
  }

  // ---------- EXPORT EXCEL ----------
  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shipments");
    XLSX.writeFile(wb, "shipments.xlsx");
  }

  // ---------- EXPORT PDF ----------
  function exportPDF() {
    const doc = new jsPDF("l", "pt", "a4");
    doc.autoTable({
      head: [
        [
          "QMRel No",
          "Customer",
          "FF",
          "Invoice",
          "Part No",
          "Part Description",
          "Qty",
          "Net Wt",
          "Gross Wt",
          "Mode",
          "BL No",
          "Container No",
          "Status",
        ],
      ],
      body: filteredRows.map((r) => [
        r.enquiry_no,
        r.customer,
        r.ff,
        r.invoice_no,
        r.part_no,
        r.part_desc,
        r.part_qty,
        r.net_wt,
        r.gross_wt,
        r.mode,
        r.bl_no,
        r.container_no,
        r.status,
      ]),
    });
    doc.save("shipments.pdf");
  }

  // ---------- RENDER ----------
  return (
    <div className="shipments-page">
      {/* HEADER */}
      <div className="shipments-header">
        <div>
          <h2>Shipments List</h2>
          <div className="backend-status">
            Backend Status:
            <span className={`status-${backendStatus}`}>
              {backendStatus === "connected" && "🟢 Connected"}
              {backendStatus === "offline" && "🟡 Offline Mode"}
              {backendStatus === "disconnected" && "🔴 Disconnected"}
              {backendStatus === "checking" && "🔵 Checking..."}
            </span>
          </div>
        </div>

        <div className="actions">
          <button className="btn excel" onClick={exportExcel}>
            Export Excel
          </button>
          <button className="btn pdf" onClick={exportPDF}>
            Export PDF
          </button>
          <button
            className="btn upload"
            onClick={() => setVisibleBulkUploadModal(true)}
          >
            Upload Bulk
          </button>
        </div>
      </div>

      {/* BULK UPLOAD MODAL */}
      {visibleBulkUploadModal && (
        <BulkShipmentUpload
          visible={visibleBulkUploadModal}
          setVisible={setVisibleBulkUploadModal}
          onDone={fetchAll}
        />
      )}

      {/* SEARCH */}
      <div className="search-bar">
        <input
          placeholder="Search by QMRel / Part No / BL No"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="reset" onClick={() => setSearch("")}>
          Reset
        </button>
      </div>

      {loading && <p className="info">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {/* TABLE */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>QMRel No</th>
              <th>Customer</th>
              <th>FF</th>
              <th>Invoice</th>
              <th>Part No</th>
              <th>Part Description</th>
              <th>Qty</th>
              <th>Net Wt</th>
              <th>Gross Wt</th>
              <th>Mode</th>
              <th>BL No</th>
              <th>Container No</th>
              <th>Action</th>
              <th>Delivery Status</th>
              <th
                onClick={() => setShowStatusAction((p) => !p)}
                style={{ cursor: "pointer" }}
              >
                Invalid {showStatusAction ? "▲" : "▼"}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr
                key={r._id}
                className={r.status === "CANCELLED" ? "row-cancelled" : ""}
              >
                <td>{r.enquiry_no}</td>
                <td>{r.customer}</td>
                <td>{r.ff}</td>
                <td>{r.invoice_no}</td>
                <td>{r.part_no}</td>
                <td className="desc">{r.part_desc}</td>
                <td>{r.part_qty}</td>
                <td>{r.net_wt}</td>
                <td>{r.gross_wt}</td>
                <td>
                  <span className={`badge ${r.mode?.toLowerCase()}`}>
                    {r.mode}
                  </span>
                </td>
                <td>{r.bl_no}</td>
                <td>{r.container_no}</td>
                <td>
                  <button
                    className="edit-btn"
                    disabled={r.status === "CANCELLED"}
                    onClick={() =>
                      navigate(`/logistics/${r._id}`, { state: r })
                    }
                  >
                    ✏️
                  </button>
                </td>
                <td>
                  <select
                    className={`delivery-select ${
                      r.delivery_status || "IN_PROCESS"
                    }`}
                    value={r.delivery_status || "IN_PROCESS"}
                    onChange={async (e) => {
                      try {
                        await API.patch(
                          `/shipment/delivery-status/${r._id}`,
                          { delivery_status: e.target.value }
                        );
                        fetchAll();
                      } catch {
                        toast.error("Failed to update delivery status");
                      }
                    }}
                  >
                    <option value="IN_PROCESS">In Process</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="DELIVERED">Final Delivered</option>
                  </select>
                </td>
                <td>
                  {showStatusAction &&
                    (r.status === "CANCELLED" ? (
                      <button
                        className="btn-undo"
                        onClick={() => updateStatus(r._id, "ACTIVE")}
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        className="btn-cancel"
                        onClick={() => updateStatus(r._id, "CANCELLED")}
                      >
                        Cancel
                      </button>
                    ))}
                </td>
                <td>
                  <input
                    type="text"
                    className="desc-input"
                    placeholder="Add description"
                    value={descValues[r._id] ?? r.manual_desc ?? ""}
                    onChange={(e) =>
                      setDescValues((prev) => ({
                        ...prev,
                        [r._id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    className="btn small"
                    disabled={savingId === r._id}
                    onClick={async () => {
                      try {
                        setSavingId(r._id);
                        await API.patch(`/shipment/manual-desc/${r._id}`, {
                          manual_desc: descValues[r._id],
                        });
                        toast.success("Description saved ✅");
                        fetchAll();
                      } catch {
                        toast.error("Failed to save description ❌");
                      } finally {
                        setSavingId(null);
                      }
                    }}
                  >
                    {savingId === r._id ? "Saving..." : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          ⬅ Prev
        </button>

        <span>
          Page <strong>{page}</strong> of {Math.ceil(total / pageSize)}
        </span>

        <button
          disabled={page === Math.ceil(total / pageSize)}
          onClick={() => setPage(page + 1)}
        >
          Next ➡
        </button>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  );
}
