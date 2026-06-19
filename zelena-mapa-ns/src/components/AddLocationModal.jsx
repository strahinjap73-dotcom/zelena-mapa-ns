import { useState } from "react";
import { toast } from "react-toastify";

function AddLocationModal({ isOpen, onClose, onSave, selectedPosition }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSave(form);
    toast.success("Uspešno sačuvano!");
    setForm({ name: "", description: "" });
  };

  return (
    <div className="overlay">
      <div className="modal">
        <h2>Dodaj lokaciju</h2>

        {selectedPosition && (
          <p className="selected-coords">
            📍 {selectedPosition.lat.toFixed(5)}, {selectedPosition.lng.toFixed(5)}
          </p>
        )}

        <input
          name="name"
          placeholder="Naziv lokacije"
          value={form.name}
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Opis lokacije"
          value={form.description}
          onChange={handleChange}
        />

        <div className="modal-actions">
          <button className="btn-confirm" onClick={handleSubmit}>
            Sačuvaj
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Otkaži
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddLocationModal;