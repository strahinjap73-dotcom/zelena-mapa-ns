import { useState, useEffect } from "react";
import { searchUsers, sendFriendRequest, getFriends } from "../api/api";

const tabStyle = (active) => ({
  flex: 1,
  fontSize: 13,
  padding: "7px 0",
  borderRadius: 8,
  border: active ? "none" : "1.5px solid #d1d5db",
  background: active ? "#16a34a" : "transparent",
  color: active ? "#fff" : "#555",
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
  transition: "all 0.15s",
});

export default function UserSearchPanel({ onClose, onFriendAdded }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [view, setView] = useState("search");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sentIds, setSentIds] = useState(new Set());
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const data = await getFriends();
      setFriends(Array.isArray(data) ? data : []);
    } catch {
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoadingSearch(true);
    try {
      const data = await searchUsers(query.trim());
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSendRequest = async (user) => {
    setSendingId(user.id);
    try {
      await sendFriendRequest(user.id);
      setSentIds((prev) => new Set(prev).add(user.id));
      if (onFriendAdded) onFriendAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal users-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notif-header">
          <h3>Korisnici</h3>
        </div>

        {/* Tabovi */}
        <div style={{ display: "flex", gap: 8, padding: "8px 16px 0" }}>
          <button
            style={tabStyle(view === "search")}
            onClick={() => setView("search")}
          >
            🔍 Pretraži
          </button>
          <button
            style={tabStyle(view === "friends")}
            onClick={() => setView("friends")}
          >
            👥 Prijatelji
            {friends.length > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background:
                    view === "friends"
                      ? "rgba(255,255,255,0.3)"
                      : "rgba(0,0,0,0.1)",
                  borderRadius: 10,
                  padding: "1px 6px",
                  fontSize: 11,
                }}
              >
                {friends.length}
              </span>
            )}
          </button>
        </div>

        {/* Search view */}
        {view === "search" && (
          <>
            <div style={{ display: "flex", gap: 8, padding: "12px 16px 4px" }}>
              <input
                style={{
                  flex: 1,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 14,
                  outline: "none",
                }}
                type="text"
                placeholder="Pretraži po korisničkom imenu..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
              />
              <button
                className="hb-login-btn"
                onClick={handleSearch}
                disabled={loadingSearch}
              >
                {loadingSearch ? "…" : "Traži"}
              </button>
            </div>

            <div className="notif-list">
              {results.length === 0 ? (
                <div className="notif-empty">
                  <span style={{ fontSize: 28 }}>👤</span>
                  <p>Unesite ime korisnika za pretragu</p>
                </div>
              ) : (
                results.map((user) => (
                  <div key={user.id} className="notif-item">
                    <div className="notif-item-content">
                      <p className="notif-message" style={{ fontWeight: 600 }}>
                        {user.username}
                      </p>
                      {user.email && (
                        <span className="notif-date">{user.email}</span>
                      )}
                    </div>
                    <button
                      className={
                        sentIds.has(user.id)
                          ? "notif-read-btn"
                          : "friend-req-accept-btn"
                      }
                      style={{ minWidth: 110, fontSize: 13 }}
                      disabled={sentIds.has(user.id) || sendingId === user.id}
                      onClick={() => handleSendRequest(user)}
                    >
                      {sentIds.has(user.id)
                        ? "✓ Zahtev poslat"
                        : sendingId === user.id
                          ? "Slanje…"
                          : "Dodaj prijatelja"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Friends view */}
        {view === "friends" && (
          <div className="notif-list">
            {loadingFriends ? (
              <div className="notif-empty">Učitavanje…</div>
            ) : friends.length === 0 ? (
              <div className="notif-empty">
                <span style={{ fontSize: 28 }}>👥</span>
                <p>Nemaš prijatelja još uvek</p>
              </div>
            ) : (
              friends.map((f) => (
                <div key={f.id} className="notif-item">
                  <div className="notif-item-content">
                    <p className="notif-message" style={{ fontWeight: 600 }}>
                      {f.username}
                    </p>
                    {f.email && <span className="notif-date">{f.email}</span>}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#16a34a",
                      fontWeight: 600,
                      background: "#dcfce7",
                      borderRadius: 6,
                      padding: "3px 8px",
                    }}
                  >
                    ✓ Prijatelj
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        <div className="notif-footer">
          <button className="notif-close-btn" onClick={onClose}>
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}
