import { useState } from "react";
import { searchUsers, addFriend } from "../api/api";

export default function UserSearchPanel({ onClose, onFriendAdded }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);

  const doSearch = async () => {
    const res = await searchUsers(q);
    setResults(res);
  };

  const handleAdd = async (id) => {
    await addFriend(id);
    onFriendAdded && onFriendAdded();
  };

  return (
    <div className="overlay">
      <div className="modal user-search-modal">
        <h3>Pronađi i dodaj prijatelje</h3>
        <div className="search-box">
          <input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Unesi username..." 
            onKeyPress={(e) => e.key === 'Enter' && doSearch()}
          />
          <button onClick={doSearch} className="search-btn">Pretraži</button>
        </div>
        <div className="results-list">
          {results.length === 0 && q && <div className="no-results">Nema rezultata</div>}
          {results.map((u) => (
            <div key={u.id} className="user-item">
              <div className="user-info">
                <div className="username">{u.username}</div>
                <div className="email">{u.email}</div>
              </div>
              <button className="add-btn" onClick={() => handleAdd(u.id)}>+ Dodaj</button>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="close-btn">Zatvori</button>
        </div>
      </div>
    </div>
  );
}
