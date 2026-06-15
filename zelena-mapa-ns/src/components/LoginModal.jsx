import { useState } from "react";
import { login } from "../api/api";

function LoginModal({ open, onClose, onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleLogin = async () => {
    setError("");
    try {
      const data = await login(email, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("email", data.email);

      onLogin(data);
      setEmail("");
      setPassword("");
      onClose();
    } catch (err) {
      setError("Pogrešan email ili lozinka.");
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <h2>Prijava</h2>

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
          <button className="btn-confirm" onClick={handleLogin}>
            Prijavi se
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Otkaži
          </button>
        </div>

        {onSwitchToRegister && (
          <p className="modal-switch">
            Nemaš nalog?{" "}
            <button onClick={onSwitchToRegister}>Registruj se</button>
          </p>
        )}
      </div>
    </div>
  );
}

export default LoginModal;