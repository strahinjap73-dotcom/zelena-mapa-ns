import { useEffect, useState } from "react";
import { getFriends, recommendLocation } from "../api/api";
import { toast } from "react-toastify";

export default function RecommendModal({ location, onClose }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null); // id prijatelja koji se šalje
  const [sentIds, setSentIds] = useState([]);

  useEffect(() => {
    getFriends()
      .then(setFriends)
      .catch(() => setFriends([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRecommend = async (friend) => {
    setSending(friend.id);
    try {
      await recommendLocation(location.id, friend.id);
      setSentIds((prev) => [...prev, friend.id]);
      toast.success(`Preporuka poslata za ${friend.username}!`);
    } catch (e) {
      toast.error("Greška pri slanju preporuke.");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="overlay">
      <div className="modal recommend-modal">
        <h3>Preporuči lokaciju</h3>
        <p className="recommend-location-name">📍 {location.name}</p>

        {loading ? (
          <p className="recommend-loading">Učitavanje prijatelja...</p>
        ) : friends.length === 0 ? (
          <p className="recommend-no-friends">Nemate prijatelje za preporuku.</p>
        ) : (
          <div className="recommend-friends-list">
            {friends.map((f) => (
              <div key={f.id} className="recommend-friend-item">
                <div className="username">{f.username}</div>
                <button
                  className="recommend-send-btn"
                  onClick={() => handleRecommend(f)}
                  disabled={sending === f.id || sentIds.includes(f.id)}
                >
                  {sentIds.includes(f.id)
                    ? "✓ Poslato"
                    : sending === f.id
                    ? "Slanje..."
                    : "Pošalji"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <button onClick={onClose} className="close-btn">
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}