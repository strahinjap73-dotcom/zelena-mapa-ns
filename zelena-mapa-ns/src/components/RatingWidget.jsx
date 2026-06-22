import { useState } from "react";
import { addRating } from "../api/api";

function RatingWidget({ locationId, username, onRated }) {
  const [distanceFromCenter, setDistanceFromCenter] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [greenArea, setGreenArea] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  if (!username) {
    return <p className="rating-login-hint">Prijavi se da bi ocenio lokaciju.</p>;
  }

  const handleSubmit = async () => {
    setError(null);

    if (!distanceFromCenter || !cleanliness || !greenArea) {
      setError("Molimo ocenite sve tri kategorije.");
      return;
    }

    try {
      await addRating(locationId, {
        distanceFromCenter,
        cleanliness,
        greenArea,
      });
      setSubmitted(true);
      onRated();
    } catch (err) {
      console.error(err);
      setError(err.message || "Greška pri slanju ocene.");
    }
  };

  if (submitted) {
    return <p>Hvala na oceni!</p>;
  }

  const renderSelect = (label, value, setter) => (
    <div className="rating-field">
      <label>{label}</label>
      <select value={value} onChange={(e) => setter(Number(e.target.value))}>
        <option value={0}>Izaberi...</option>
        {[1, 2, 3, 4, 5].map((val) => (
          <option key={val} value={val}>{val}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="rating-widget">
      {renderSelect("Udaljenost od centra:", distanceFromCenter, setDistanceFromCenter)}
      {renderSelect("Čistoća:", cleanliness, setCleanliness)}
      {renderSelect("Veličina zelene površine:", greenArea, setGreenArea)}

      {error && <p className="rating-error">{error}</p>}
      <button className="btn-primary rating-submit-btn" onClick={handleSubmit}>
        Pošalji ocenu
      </button>
    </div>
  );
}

export default RatingWidget;