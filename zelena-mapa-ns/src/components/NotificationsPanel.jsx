import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "../api/api";

export default function NotificationsPanel({ onClose, onUnreadChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await getNotifications();
    const unread = res.filter((n) => !n.readFlag);
    setItems(unread);
    if (onUnreadChange) onUnreadChange(unread.length);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await markNotificationRead(id);
    load();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal notif-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notif-header">
          <h3>Obaveštenja</h3>
          {items.length > 0 && (
            <span className="notif-count-badge">{items.length}</span>
          )}
        </div>

        <div className="notif-list">
          {loading ? (
            <div className="notif-empty">Učitavanje...</div>
          ) : items.length === 0 ? (
            <div className="notif-empty">
              <span style={{ fontSize: 28 }}>🔔</span>
              <p>Nema nepročitanih obaveštenja</p>
            </div>
          ) : (
            items.map((n) => (
              <div key={n.id} className="notif-item">
                <div className="notif-item-content">
                  <p className="notif-message">{n.message}</p>
                  <span className="notif-date">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  className="notif-read-btn"
                  onClick={() => markRead(n.id)}
                >
                  Pročitano
                </button>
              </div>
            ))
          )}
        </div>

        <div className="notif-footer">
          <button className="notif-close-btn" onClick={onClose}>
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}
