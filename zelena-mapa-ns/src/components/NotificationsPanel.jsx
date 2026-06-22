import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "../api/api";

export default function NotificationsPanel({ onClose }) {
  const [items, setItems] = useState([]);

  const load = async () => {
    const res = await getNotifications();
    setItems(res);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await markNotificationRead(id);
    load();
  };

  return (
    <div className="overlay">
      <div className="modal">
        <h3>Obaveštenja</h3>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {items.length === 0 && <div>Nema obaveštenja</div>}
          {items.map((n) => (
            <div key={n.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
              <div>{n.message}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{new Date(n.createdAt).toLocaleString()}</div>
              {!n.readFlag && <button onClick={() => markRead(n.id)}>Označi kao pročitano</button>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <button onClick={onClose}>Zatvori</button>
        </div>
      </div>
    </div>
  );
}
