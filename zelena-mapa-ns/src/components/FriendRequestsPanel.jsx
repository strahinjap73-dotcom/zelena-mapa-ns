import { useEffect, useState } from "react";
import { getPendingFriendRequests, respondToFriendRequest } from "../api/api";

export default function FriendRequestsPanel({ onClose, onRequestResponded }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPendingFriendRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRespond = async (requestId, accept) => {
    setRespondingId(requestId);
    try {
      await respondToFriendRequest(requestId, accept);
      if (onRequestResponded) onRequestResponded(accept);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal users-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notif-header">
          <h3>Zahtevi za prijateljstvo</h3>
          {requests.length > 0 && (
            <span className="notif-count-badge">{requests.length}</span>
          )}
        </div>

        {/* List */}
        <div className="notif-list">
          {loading ? (
            <div className="notif-empty">Učitavanje...</div>
          ) : requests.length === 0 ? (
            <div className="notif-empty">
              <span style={{ fontSize: 28 }}>👥</span>
              <p>Nema novih zahteva za prijateljstvo</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="notif-item friend-req-item">
                <div className="notif-item-content">
                  <p className="notif-message">
                    <strong>{req.sender?.username ?? "Nepoznat"}</strong> te je
                    dodao/la kao prijatelja
                  </p>
                  {req.createdAt && (
                    <span className="notif-date">
                      {new Date(req.createdAt).toLocaleString("sr-RS")}
                    </span>
                  )}
                </div>
                <div className="friend-req-actions">
                  <button
                    className="friend-req-accept-btn"
                    disabled={respondingId === req.id}
                    onClick={() => handleRespond(req.id, true)}
                    title="Prihvati"
                  >
                    {respondingId === req.id ? "…" : "✓"}
                  </button>
                  <button
                    className="friend-req-reject-btn"
                    disabled={respondingId === req.id}
                    onClick={() => handleRespond(req.id, false)}
                    title="Odbij"
                  >
                    {respondingId === req.id ? "…" : "✕"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="notif-footer">
          <button className="notif-close-btn" onClick={onClose}>
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}
