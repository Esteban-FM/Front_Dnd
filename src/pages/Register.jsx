import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate, Link } from "react-router-dom";
import ForgotPassword from "../components/ui/ForgotPassword";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/role");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado");
      } else {
        setError("Error al crear la cuenta");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#111] scanlines flex items-center justify-center p-5">
       {showReset && <ForgotPassword onClose={() => setShowReset(false)} />}

      <div className="pixel-panel p-8 w-full max-w-sm">
<br />
        <h1 className="font-caudex  text-[#c8a840] text-center text-3xl tracking-widest mb-2 glow-gold">
          Register
        </h1>
        <p className="font-caudex text-[#555] text-center text-sm mb-8">
          ── Nuevo Jugador ──
        </p>
<br />
        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <label className="font-caudex text-[#aaa] text-xl text-center">CORREO</label>
          <input
            className="pixel-input mb-1"
            type="email"
            placeholder="aventurero@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="font-caudex text-[#aaa] text-xl text-center">CONTRASEÑA</label>
          <input
            className="pixel-input mb-1"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className="font-pixel text-[#aaa] text-[7px]">CONFIRMAR CONTRASEÑA</label>
          <input
            className="pixel-input mb-1"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? "CREANDO..." : "◆ CREAR CUENTA"}
          </button>
        </form>

        <button
          onClick={() => setShowReset(true)}
          className="font-pixel text-[#555] text-[7px] w-full text-center mt-3 hover:text-[#c8a840] transition-colors cursor-pointer bg-transparent border-none">
          ¿Olvidaste tu contraseña?
        </button>

        <hr className="border-[#333] my-4" />

        <Link to="/login">
          <button className="pixel-btn">◀ YA TENGO CUENTA</button>
        </Link>

      </div>
    </div>
  );
}