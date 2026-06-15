import { useState } from "react";

function RegisterModal({ open, onClose, onRegister, onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleRegister = async () => {
    setError("");

    if (!username || !email || !password) {
      setError("Popuni sva polja.");
      return;
    }

    try {
      await onRegister({ username, email, password });
      setUsername("");
      setEmail("");
      setPassword("");
      onClose();
    } catch (err) {
      setError("Registracija nije uspela. Pokušaj ponovo.");
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <h2>Registracija</h2>

        <input
          type="text"
          placeholder="Korisničko ime"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Lozinka"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button className="btn-confirm" onClick={handleRegister}>
            Registruj se
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Otkaži
          </button>
        </div>

        {onSwitchToLogin && (
          <p className="modal-switch">
            Već imaš nalog?{" "}
            <button onClick={onSwitchToLogin}>Prijavi se</button>
          </p>
        )}
      </div>
    </div>
  );
}

export default RegisterModal;