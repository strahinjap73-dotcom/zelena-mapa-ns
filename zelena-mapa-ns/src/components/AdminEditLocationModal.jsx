import { useState } from "react";
import { adminUpdateLocation } from "../api/api";
import { toast } from "react-toastify";

function AdminEditLocationModal({ location, onClose, onUpdated }) {
  const [name, setName] = useState(location.name || "");
  const [description, setDescription] = useState(location.description || "");
  const [lat, setLat] = useState(location.lat ?? "");
  const [lng, setLng] = useState(location.lng ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
  if (!name.trim()) {
    toast.error("Naziv ne može biti prazan.");
    return;
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    toast.error("Koordinate moraju biti validni brojevi.");
    return;
  }

  setLoading(true);

  try {
    await adminUpdateLocation(location.id, {
      name: name.trim(),
      description: description.trim(),
      lat: parsedLat,
      lng: parsedLng,
      status: "APPROVED",
    });

    toast.success("Lokacija uspešno izmenjena!");

    onUpdated?.({
      ...location,
      name: name.trim(),
      description: description.trim(),
      lat: parsedLat,
      lng: parsedLng,
    });

    onClose();
  } catch (err) {
    toast.error("Greška pri izmeni lokacije: " + err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🛡️ Admin — Izmena lokacije</h2>
        <p style={{ margin: "0 0 12px", fontSize: "0.9rem", color: "#666" }}>
          Promene se primenjuju odmah bez odobrenja.
        </p>

        <label className="report-label">Naziv</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Naziv lokacije"
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "0.95rem",
            marginBottom: 10,
            boxSizing: "border-box",
          }}
        />

        <label className="report-label">Opis</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Opis lokacije..."
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "0.95rem",
            marginBottom: 10,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label className="report-label">Geografska širina (lat)</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="report-label">Geografska dužina (lng)</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Odustani
          </button>
          <button
            className="btn-confirm"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
          >
            {loading ? "Čuvam..." : "Sačuvaj izmene"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminEditLocationModal;