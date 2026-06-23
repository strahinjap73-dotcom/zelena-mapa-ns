import { useEffect, useState } from "react";
import { getPendingLocations, approveLocation, rejectLocation, getImages, deleteImage } from "../api/api";
import { toast } from "react-toastify";
import ConfirmModal from "./ConfirmModal";

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

async function fetchAdminReports() {
  const res = await fetch(`${BASE_URL}/api/reports/admin`, { headers: authHeader() });
  if (!res.ok) return [];
  return res.json();
}

async function updateReportStatus(id, status) {
  await fetch(`${BASE_URL}/api/reports/admin/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ status }),
  });
}

function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <img src={src} className="lightbox-img" onClick={(e) => e.stopPropagation()} alt="preview" />
      <button className="lightbox-close" onClick={onClose}>✕</button>
    </div>
  );
}

function AdminPanel({ onUpdate, onClose }) {
  const [locations, setLocations] = useState([]);
  const [imagesByLoc, setImagesByLoc] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [activeTab, setActiveTab] = useState("locations");
  const [reports, setReports] = useState([]);
  const [unreadReports, setUnreadReports] = useState(0);

  const [confirmState, setConfirmState] = useState({ open: false, locId: null, imgId: null });

  const load = async () => {
    const data = await getPendingLocations();
    setLocations(data);
  };

  const loadReports = async () => {
    const data = await fetchAdminReports();
    setReports(data);
    setUnreadReports(data.filter((r) => r.status === "novo").length);
  };

  useEffect(() => {
    load();
    loadReports();
  }, []);

  const handleApprove = async (id) => {
    await approveLocation(id);
    toast.success("Lokacija odobrena!");
    await onUpdate();
    load();
  };

  const handleReject = async (id) => {
    await rejectLocation(id);
    toast.success("Lokacija odbijena.");
    load();
  };

  const toggleImages = async (locId) => {
    if (expandedId === locId) { setExpandedId(null); return; }
    setExpandedId(locId);
    if (imagesByLoc[locId]) return;
    setLoadingImages((prev) => ({ ...prev, [locId]: true }));
    try {
      const imgs = await getImages(locId);
      setImagesByLoc((prev) => ({ ...prev, [locId]: Array.isArray(imgs) ? imgs : [] }));
    } catch {
      setImagesByLoc((prev) => ({ ...prev, [locId]: [] }));
    } finally {
      setLoadingImages((prev) => ({ ...prev, [locId]: false }));
    }
  };

  const askDeleteImage = (locId, imgId) => setConfirmState({ open: true, locId, imgId });

  const handleDeleteImage = async () => {
    const { locId, imgId } = confirmState;
    setConfirmState({ open: false, locId: null, imgId: null });
    try {
      await deleteImage(imgId);
      setImagesByLoc((prev) => ({ ...prev, [locId]: prev[locId].filter((img) => img.id !== imgId) }));
      toast.success("Slika obrisana.");
    } catch {
      toast.error("Greška pri brisanju slike.");
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    await updateReportStatus(reportId, newStatus);
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: newStatus } : r));
    setUnreadReports(reports.filter((r) => r.id !== reportId && r.status === "novo").length
      + (newStatus === "novo" ? 1 : 0));
    toast.success("Status prijave ažuriran.");
  };

  return (
    <>
      <div className="admin-overlay" onClick={onClose} />
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button className="admin-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="admin-tabs" style={{ display: "flex", gap: "8px", padding: "0 16px 12px" }}>
          <button
            className={activeTab === "locations" ? "report-tab active" : "report-tab"}
            onClick={() => setActiveTab("locations")}
          >
            📍 Lokacije {locations.length > 0 && <span className="badge">{locations.length}</span>}
          </button>
          <button
            className={activeTab === "reports" ? "report-tab active" : "report-tab"}
            onClick={() => { setActiveTab("reports"); loadReports(); }}
          >
            📋 Prijave
            {unreadReports > 0 && (
              <span style={{
                marginLeft: "6px",
                background: "#e63946",
                color: "white",
                borderRadius: "999px",
                fontSize: "0.7rem",
                padding: "1px 6px",
                fontWeight: 700,
              }}>
                {unreadReports}
              </span>
            )}
          </button>
        </div>

        <div className="admin-body">
          {activeTab === "locations" && (
            locations.length === 0 ? (
              <p className="admin-empty">Nema lokacija na čekanju.</p>
            ) : (
              locations.map((loc) => (
                <div key={loc.id} className="admin-card">
                  <div className="admin-card-info">
                    <h3>{loc.name}</h3>
                    <p>{loc.description}</p>
                  </div>
                  <div className="admin-card-actions">
                    <button className="admin-approve-btn" onClick={() => handleApprove(loc.id)}>✔ Odobri</button>
                    <button className="admin-reject-btn" onClick={() => handleReject(loc.id)}>✕ Odbij</button>
                    <button className="admin-images-btn" onClick={() => toggleImages(loc.id)}>
                      {expandedId === loc.id ? "▲ Sakrij slike" : "🖼 Slike"}
                    </button>
                  </div>
                  {expandedId === loc.id && (
                    <div className="admin-images-section">
                      {loadingImages[loc.id] ? (
                        <p>Učitavanje...</p>
                      ) : (imagesByLoc[loc.id] || []).length === 0 ? (
                        <p className="admin-no-images">Nema slika.</p>
                      ) : (
                        <div className="admin-image-grid">
                          {(imagesByLoc[loc.id] || []).map((img) => (
                            <div key={img.id} className="admin-image-item">
                              <img
                                src={img.imageUrl}
                                alt="loc"
                                className="admin-thumb"
                                onClick={() => setLightboxSrc(img.imageUrl)}
                              />
                              <button className="admin-delete-img-btn" onClick={() => askDeleteImage(loc.id, img.id)}>🗑</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )
          )}

          {activeTab === "reports" && (
            reports.length === 0 ? (
              <p className="admin-empty">Nema prijava.</p>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="admin-card">
                  <div className="admin-card-info">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{r.category}</strong>
                      <span style={{
                        background: STATUS_LABELS[r.status]?.color,
                        borderRadius: "12px",
                        padding: "2px 10px",
                        color: "white",
                        fontSize: "0.78rem"
                      }}>
                        {STATUS_LABELS[r.status]?.label || r.status}
                      </span>
                    </div>
                    <p style={{ margin: "6px 0", fontSize: "0.9rem" }}>{r.description}</p>
                    <small style={{ color: "#888" }}>
                      Od: <strong>{r.username}</strong> · {new Date(r.createdAt).toLocaleDateString("sr-RS")}
                    </small>
                  </div>
                  <div className="admin-card-actions" style={{ marginTop: "8px" }}>
                    {["novo", "u_obradi", "reseno"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(r.id, s)}
                        disabled={r.status === s}
                        style={{
                          background: r.status === s ? STATUS_LABELS[s].color : "#eee",
                          color: r.status === s ? "white" : "#333",
                          border: "none",
                          borderRadius: "8px",
                          padding: "4px 10px",
                          cursor: r.status === s ? "default" : "pointer",
                          fontSize: "0.8rem",
                        }}
                      >
                        {STATUS_LABELS[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      <ConfirmModal
        open={confirmState.open}
        title="Obriši sliku"
        message="Da li si siguran da želiš obrisati ovu sliku?"
        confirmText="Obriši"
        variant="danger"
        onConfirm={handleDeleteImage}
        onCancel={() => setConfirmState({ open: false, locId: null, imgId: null })}
      />
    </>
  );
}

export default AdminPanel;