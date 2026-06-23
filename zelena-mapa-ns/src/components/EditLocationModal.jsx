import { useState } from "react";
import { submitEditRequest } from "../api/api";
import { toast } from "react-toastify";

function EditLocationModal({ location, onClose }) {
  const [description, setDescription] = useState(location.description || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    if (description.trim() === location.description) {
      toast.info("Niste promenili opis.");
      return;
    }
    setLoading(true);
    try {
      await submitEditRequest(location.id, description.trim());
      toast.success("Zahtev za izmenu je poslat adminu na odobrenje!");
      onClose();
    } catch (err) {
      toast.error("Greška pri slanju zahteva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>✏️ Izmena lokacije</h2>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
          Predlog izmene će biti poslat adminu na odobrenje.
        </p>

        <label className="report-label">Lokacija</label>
        <p style={{ margin: 0, fontWeight: 700, color: "var(--forest)" }}>
          {location.name}
        </p>

        <label className="report-label">Novi opis</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Unesite novi opis lokacije..."
        />

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Odustani
          </button>
          <button
            className="btn-confirm"
            onClick={handleSubmit}
            disabled={loading || !description.trim()}
          >
            {loading ? "Šaljem..." : "Pošalji zahtev"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditLocationModal;