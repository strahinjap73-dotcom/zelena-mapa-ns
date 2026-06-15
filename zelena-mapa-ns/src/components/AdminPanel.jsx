import { useEffect, useState } from "react";
import {
  getPendingLocations,
  approveLocation,
  rejectLocation
} from "../api/api";

function AdminPanel() {
  const [locations, setLocations] = useState([]);

  const load = async () => {
    const data = await getPendingLocations();
    setLocations(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    await approveLocation(id);
    load();
  };

  const handleReject = async (id) => {
    await rejectLocation(id);
    load();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Panel - Pending lokacije</h2>

      {locations.length === 0 && <p>Nema lokacija na čekanju</p>}

      {locations.map((loc) => (
        <div
          key={loc.id}
          style={{
            border: "1px solid #ccc",
            marginBottom: "10px",
            padding: "10px"
          }}
        >
          <h3>{loc.name}</h3>
          <p>{loc.description}</p>

          <button onClick={() => handleApprove(loc.id)}>
            ✔ Approve
          </button>

          <button
            onClick={() => handleReject(loc.id)}
            style={{ marginLeft: "10px" }}
          >
            ❌ Reject
          </button>
        </div>
      ))}
    </div>
  );
}

export default AdminPanel;