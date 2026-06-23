import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : window.location.hostname === "localhost"
    ? "http://localhost:8080"
    : "https://zelena-mapa-ns.onrender.com";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

async function submitReport(category, description) {
  const res = await fetch(`${BASE_URL}/api/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ category, description }),
  });
  if (!res.ok) throw new Error("Greška pri slanju prijave");
  return res.json();
}

async function fetchMyReports() {
  const res = await fetch(`${BASE_URL}/api/reports/mine`, {
    headers: authHeader(),
  });
  if (!res.ok) return [];
  return res.json();
}

function ReportModal({ open, onClose, username }) {
  const [tab, setTab] = useState("new");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setDescription("");
      setCategory(CATEGORIES[0]);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (open && tab === "list") {
      fetchMyReports().then(setReports);
    }
  }, [open, tab]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError("");
    try {
      await submitReport(category, description.trim());
      setSubmitted(true);
    } catch (e) {
      setError("Greška pri slanju prijave. Pokušajte ponovo.");
    } finally {
      setLoading(false);
    }
  };

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
            onClick={() => setTab("list")}
          >
            Moje prijave
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

                {error && <p style={{ color: "#e63946", fontSize: "0.85rem" }}>{error}</p>}

                <div className="modal-actions">
                  <button className="btn-cancel" onClick={onClose}>Odustani</button>
                  <button
                    className="btn-confirm"
                    onClick={handleSubmit}
                    disabled={!description.trim() || loading}
                  >
                    {loading ? "Slanje..." : "Pošalji prijavu"}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {tab === "list" && (
          <div className="report-list">
            {reports.length === 0 ? (
              <p className="report-empty">Nemate prijavljenih problema.</p>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="report-item">
                  <div className="report-item-header">
                    <span className="report-category">{r.category}</span>
                    <span
                      className="report-status"
                      style={{ background: STATUS_LABELS[r.status]?.color }}
                    >
                      {STATUS_LABELS[r.status]?.label || r.status}
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