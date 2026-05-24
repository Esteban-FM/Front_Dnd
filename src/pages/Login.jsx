import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/role");
    } catch (err) {
      setError("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (



    <div className="min-h-screen bg-[#111] scanlines flex items-center justify-center p-5 ">
      <div className="pixel-panel p-8 w-full max-w-sm">
<br />
        <h1 className="font-medieval text-[#c8a840] text-center text-3xl m-8 tracking-widest mb-2 glow-gold  ">
          DnD Sesion
        </h1>
        <p className=" block font-medieval text-[#555] text-center text-sm ">
         Gestor para Dungeon Masters
        </p>
<br />
        <form onSubmit={handleLogin} className="flex flex-col gap-3 pt-0">

          <label className="font-medieval text-[#aaa] text-sm text-center ">CORREO</label>
          <input
            className="pixel-input mb-1"
            type="email"
            placeholder="aventurero@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="font-medieval text-[#aaa] text-sm text-center">CONTRASEÑA</label>
          <input
            className="pixel-input mb-1"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="font-medieval text-[#ff4444] text-[7px] text-center">
              {error}
            </p>
          )}

          <button
            className="pixel-btn pixel-btn-gold mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? "CARGANDO..." : "▶ INGRESAR"}
          </button>
        </form>

        <hr className="border-[#333] my-4" />

        <Link to="/register">
          <button className="pixel-btn"> CREAR CUENTA</button>
        </Link>

      </div>
    </div>
  );
}