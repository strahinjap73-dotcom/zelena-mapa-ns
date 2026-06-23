import { useState, useEffect } from "react";

const STORAGE_KEY = "zelena_mapa_reports";

export function getReports() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

export function saveReport(report) {
  const reports = getReports();
  const newReport = {
    id: Date.now(),
    ...report,
    status: "novo",
    createdAt: new Date().toISOString(),
  };
  reports.unshift(newReport);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  return newReport;
}

export function updateReportStatus(id, status) {
  const reports = getReports();
  const updated = reports.map((r) => (r.id === id ? { ...r, status } : r));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

const STATUS_LABELS = {
  novo: { label: "Novo", color: "#e76f51" },
  u_obradi: { label: "U obradi", color: "#f4a261" },
  reseno: { label: "Rešeno", color: "#52b788" },
};

const CATEGORIES = [
  "Tehnički problem",
  "Pogrešna lokacija",
  "Neprikladan sadržaj",
  "Predlog poboljšanja",
  "Ostalo",
];

function ReportModal({ open, onClose, username }) {
  const [tab, setTab] = useState("new"); // "new" | "list"
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (open) {
      setReports(getReports());
      setSubmitted(false);
      setDescription("");
      setCategory(CATEGORIES[0]);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!description.trim()) return;
    saveReport({
      category,
      description: description.trim(),
      username: username || "Anonimno",
    });
    setSubmitted(true);
    setReports(getReports());
    // Trigger storage event for AdminPanel
    window.dispatchEvent(new Event("reports-updated"));
  };

  const userReports = reports.filter(
    (r) => r.username === (username || "Anonimno")
  );

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal report-modal" onClick={(e) => e.stopPropagation()}>
        <h2>📋 Prijava problema</h2>

        <div className="report-tabs">
          <button
            className={tab === "new" ? "report-tab active" : "report-tab"}
            onClick={() => setTab("new")}
          >
            Nova prijava
          </button>
          <button
            className={tab === "list" ? "report-tab active" : "report-tab"}
            onClick={() => { setTab("list"); setReports(getReports()); }}
          >
            Moje prijave ({userReports.length})
          </button>
        </div>

        {tab === "new" && (
          <>
            {submitted ? (
              <div className="report-success">
                <div className="report-success-icon">✓</div>
                <p>Prijava je uspešno poslata!</p>
                <p className="report-success-sub">Admin će je pregledati u najkraćem roku.</p>
                <button className="btn-primary" onClick={() => setSubmitted(false)}>
                  Nova prijava
                </button>
              </div>
            ) : (
              <>
                <label className="report-label">Kategorija</label>
                <select
                  className="report-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <label className="report-label">Opis problema</label>
                <textarea
                  placeholder="Opišite problem što detaljnije..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />

                <div className="modal-actions">
                  <button className="btn-cancel" onClick={onClose}>Odustani</button>
                  <button
                    className="btn-confirm"
                    onClick={handleSubmit}
                    disabled={!description.trim()}
                  >
                    Pošalji prijavu
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {tab === "list" && (
          <div className="report-list">
            {userReports.length === 0 ? (
              <p className="report-empty">Nemate prijavljenih problema.</p>
            ) : (
              userReports.map((r) => (
                <div key={r.id} className="report-item">
                  <div className="report-item-header">
                    <span className="report-category">{r.category}</span>
                    <span
                      className="report-status"
                      style={{ background: STATUS_LABELS[r.status]?.color }}
                    >
                      {STATUS_LABELS[r.status]?.label}
                    </span>
                  </div>
                  <p className="report-desc">{r.description}</p>
                  <span className="report-date">
                    {new Date(r.createdAt).toLocaleDateString("sr-RS")}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportModal;