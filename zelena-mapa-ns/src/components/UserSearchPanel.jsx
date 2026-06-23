import { useState, useEffect, useRef } from "react";
import { searchUsers, addFriend, getFriends } from "../api/api";

export default function UserSearchPanel({ onClose, onFriendAdded }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [addedIds, setAddedIds] = useState([]);
  const [friendIds, setFriendIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  // Učitaj postojeće prijatelje pri otvaranju
  useEffect(() => {
    getFriends()
      .then((friends) => setFriendIds(friends.map((f) => f.id)))
      .catch(() => {});
  }, []);

  const doSearch = async (value) => {
    const term = value ?? q;
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await searchUsers(term);
      setResults(Array.isArray(res) ? res : []);
    } catch (e) {
      setError("Greška pri pretrazi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQ(value);

    // Debounce: čekaj 1s nakon poslednjeg kucanja
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(value);
    }, 1000);
  };

  const handleAdd = async (id) => {
    try {
      await addFriend(id);
      setAddedIds((prev) => [...prev, id]);
      setFriendIds((prev) => [...prev, id]);
      onFriendAdded && onFriendAdded();
    } catch (e) {
      console.error("Add friend error:", e);
    }
  };

  const isFriend = (id) => friendIds.includes(id) || addedIds.includes(id);

  return (
    <div className="overlay">
      <div className="modal user-search-modal">
        <h3>Pronađi i dodaj prijatelje</h3>

        <div className="search-box">
          <input
            value={q}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                doSearch();
              }
            }}
            placeholder="Unesi username..."
            autoFocus
          />
          <button
            onClick={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              doSearch();
            }}
            className="search-btn"
            disabled={loading}
          >
            {loading ? "..." : "Pretraži"}
          </button>
        </div>

        {error && <div style={{ color: "red", padding: "8px" }}>{error}</div>}

        <div className="results-list">
          {!loading && results.length === 0 && q && !error && (
            <div className="no-results">Nema rezultata</div>
          )}
          {results.map((u) => (
            <div key={u.id} className="user-item">
              <div className="user-info">
                <div className="username">{u.username}</div>
                <div className="email">{u.email}</div>
              </div>
              {isFriend(u.id) ? (
                <span className="already-friend">✓ Prijatelj</span>
              ) : (
                <button className="add-btn" onClick={() => handleAdd(u.id)}>
                  + Dodaj
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="close-btn">
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}