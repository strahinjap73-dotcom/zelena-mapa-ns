import { useEffect, useState } from "react";
import {
  getPendingLocations,
  approveLocation,
  rejectLocation
} from "../api/api";
import { getReports, updateReportStatus } from "./ReportModal";

const STATUS_LABELS = {
  novo: { label: "Novo", color: "#e76f51" },
  u_obradi: { label: "U obradi", color: "#f4a261" },
  reseno: { label: "Rešeno", color: "#52b788" },
};

function AdminPanel() {
  const [locations, setLocations] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("locations");

  const loadReports = () => setReports(getReports());

  const load = async () => {
    const data = await getPendingLocations();
    setLocations(data);
  };

  useEffect(() => {
    load();
    loadReports();
    window.addEventListener("reports-updated", loadReports);
    return () => window.removeEventListener("reports-updated", loadReports);
  }, []);

  const handleApprove = async (id) => {
    await approveLocation(id);
    load();
  };

  const handleReject = async (id) => {
    await rejectLocation(id);
    load();
  };

  const handleStatusChange = (id, status) => {
    updateReportStatus(id, status);
    loadReports();
  };

  const newReportsCount = reports.filter((r) => r.status === "novo").length;

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h2>Admin Panel</h2>

      <div className="report-tabs" style={{ marginBottom: "20px" }}>
        <button
          className={activeTab === "locations" ? "report-tab active" : "report-tab"}
          onClick={() => setActiveTab("locations")}
        >
          Pending lokacije ({locations.length})
        </button>
        <button
          className={activeTab === "reports" ? "report-tab active" : "report-tab"}
          onClick={() => setActiveTab("reports")}
        >
          Prijave problema
          {newReportsCount > 0 && (
            <span className="admin-notif-badge">{newReportsCount}</span>
          )}
        </button>
      </div>

      {activeTab === "locations" && (
        <>
          {locations.length === 0 && <p>Nema lokacija na čekanju</p>}
          {locations.map((loc) => (
            <div key={loc.id} className="admin-report-item">
              <h3 style={{ margin: "0 0 6px" }}>{loc.name}</h3>
              <p style={{ margin: "0 0 10px", color: "#555" }}>{loc.description}</p>
              <div className="admin-report-actions">
                <button
                  style={{ background: "#52b788", color: "white", border: "none", borderRadius: "8px" }}
                  onClick={() => handleApprove(loc.id)}
                >
                  ✔ Approve
                </button>
                <button
                  style={{ background: "#e76f51", color: "white", border: "none", borderRadius: "8px" }}
                  onClick={() => handleReject(loc.id)}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {activeTab === "reports" && (
        <div className="admin-reports">
          {reports.length === 0 && <p>Nema prijavljenih problema.</p>}
          {reports.map((r) => (
            <div key={r.id} className="admin-report-item">
              <div className="admin-report-header">
                <strong>{r.category}</strong>
                <span
                  className="report-status"
                  style={{ background: STATUS_LABELS[r.status]?.color }}
                >
                  {STATUS_LABELS[r.status]?.label}
                </span>
              </div>
              <div className="admin-report-meta">
                👤 {r.username} · {new Date(r.createdAt).toLocaleDateString("sr-RS")}
              </div>
              <p className="report-desc">{r.description}</p>
              <div className="admin-report-actions">
                <button
                  style={{ background: "#f4a261", color: "white", border: "none", borderRadius: "8px" }}
                  onClick={() => handleStatusChange(r.id, "u_obradi")}
                >
                  U obradi
                </button>
                <button
                  style={{ background: "#52b788", color: "white", border: "none", borderRadius: "8px" }}
                  onClick={() => handleStatusChange(r.id, "reseno")}
                >
                  ✔ Rešeno
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;