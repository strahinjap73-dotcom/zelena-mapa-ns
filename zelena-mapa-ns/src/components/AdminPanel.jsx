import { useEffect, useState } from "react";
import { getPendingLocations, approveLocation, rejectLocation, getImages, deleteImage } from "../api/api";
import { toast } from "react-toastify";
import ConfirmModal from "./ConfirmModal";

function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <img
        src={src}
        className="lightbox-img"
        onClick={(e) => e.stopPropagation()}
        alt="preview"
      />
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

  // Confirm modal state
  const [confirmState, setConfirmState] = useState({ open: false, locId: null, imgId: null });

  const load = async () => {
    const data = await getPendingLocations();
    setLocations(data);
  };

  useEffect(() => { load(); }, []);

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
    if (expandedId === locId) {
      setExpandedId(null);
      return;
    }
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

  const askDeleteImage = (locId, imgId) => {
    setConfirmState({ open: true, locId, imgId });
  };

  const handleDeleteImage = async () => {
    const { locId, imgId } = confirmState;
    setConfirmState({ open: false, locId: null, imgId: null });
    try {
      await deleteImage(imgId);
      setImagesByLoc((prev) => ({
        ...prev,
        [locId]: prev[locId].filter((img) => img.id !== imgId),
      }));
      toast.success("Slika obrisana.");
    } catch {
      toast.error("Greška pri brisanju slike.");
    }
  };

  return (
    <>
      <div className="admin-overlay" onClick={onClose} />
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button className="admin-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="admin-body">
          {locations.length === 0 ? (
            <p className="admin-empty">Nema lokacija na čekanju.</p>
          ) : (
            locations.map((loc) => (
              <div key={loc.id} className="admin-card">
                <div className="admin-card-info">
                  <h3>{loc.name}</h3>
                  <p>{loc.description}</p>
                </div>

                <div className="admin-card-actions">
                  <button className="admin-approve-btn" onClick={() => handleApprove(loc.id)}>
                    ✔ Odobri
                  </button>
                  <button className="admin-reject-btn" onClick={() => handleReject(loc.id)}>
                    ✕ Odbij
                  </button>
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
                            <button
                              className="admin-delete-img-btn"
                              onClick={() => askDeleteImage(loc.id, img.id)}
                            >
                              🗑
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

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