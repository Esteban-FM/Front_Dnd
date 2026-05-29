import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";

export default function ForgotPassword({ onClose }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No existe una cuenta con ese correo");
      } else {
        setError("Error al enviar el correo");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    // Overlay
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-5">
      <div className="pixel-panel p-8 w-full max-w-sm">

        <h2 className="font-caudex text-[#c8a840] text-center text-[10px] tracking-widest mb-2">
          RECUPERAR ACCESO
        </h2>
        <p className="font-caudex text-[#555] text-center text-[7px] mb-6">
          Te enviaremos un correo para restablecer tu contraseña
        </p>

        {sent ? (
          <div className="text-center">
            <p className="font-caudex text-[#44aa44] text-[7px] leading-6 mb-6">
              ✓ Correo enviado. Revisa tu bandeja de entrada.
            </p>
            <button className="pixel-btn pixel-btn-gold" onClick={onClose}>
              ◀ VOLVER
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-3">
            <label className="font-pixel text-[#aaa] text-[7px]">
              CORREO DE TU CUENTA
            </label>
            <input
              className="pixel-input mb-1"
              type="email"
              placeholder="aventurero@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <p className="font-pixel text-[#ff4444] text-[7px] text-center leading-6">
                {error}
              </p>
            )}

            <button
              className="pixel-btn pixel-btn-gold mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? "ENVIANDO..." : "✉ ENVIAR CORREO"}
            </button>

            <button
              type="button"
              className="pixel-btn"
              onClick={onClose}
            >
              ◀ CANCELAR
            </button>
          </form>
        )}

      </div>
    </div>
  );
}