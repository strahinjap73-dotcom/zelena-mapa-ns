import { useState } from "react";
import { addRating } from "../api/api";

function RatingWidget({ locationId, username, onRated }) {
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (!username) {
    return <p className="rating-login-hint">Prijavi se da bi ocenio lokaciju.</p>;
  }

  const handleRate = async (value) => {
    try {
      const token = localStorage.getItem("token");
      await addRating(locationId, { value, token });
      setSubmitted(true);
      onRated();
    } catch (err) {
      console.error(err);
    }
  };

  if (submitted) {
    return <p>Hvala na oceni!</p>;
  }

  return (
    <div className="rating-widget">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => handleRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            cursor: "pointer",
            color: star <= hover ? "#ffc107" : "#ccc",
            fontSize: "1.5rem",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default RatingWidget;