import { useEffect } from "react";

/**
 * Reusable modal za potvrde i poruke.
 *
 * Props:
 *  - open: boolean
 *  - title: string
 *  - message: string
 *  - confirmText: string (default "Potvrdi")
 *  - cancelText: string | null — ako je null, nema cancel dugmeta (samo "OK" modal)
 *  - variant: "default" | "danger" (default "default")
 *  - onConfirm: () => void
 *  - onCancel: () => void
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Potvrdi",
  cancelText = "Otkaži",
  variant = "default",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (e.key === "Escape" && onCancel) onCancel();
      if (e.key === "Enter" && onConfirm) onConfirm();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="overlay confirm-modal-overlay">
      <div className="modal confirm-modal">
        {title && <h3 className="confirm-modal-title">{title}</h3>}
        {message && <p className="confirm-modal-message">{message}</p>}
        <div className="modal-actions confirm-modal-actions">
          {onConfirm && (
            <button
              className={variant === "danger" ? "btn-danger" : "btn-confirm"}
              onClick={onConfirm}
              autoFocus
            >
              {confirmText}
            </button>
          )}
          {cancelText && onCancel && (
            <button className="btn-cancel" onClick={onCancel}>
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}