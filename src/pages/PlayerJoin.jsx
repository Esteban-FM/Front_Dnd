import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase/config";
import { useApp } from "../context/AppContext";

export default function PlayerJoin() {
  const { user, setSessionCode } = useApp();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleJoin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const sessionRef = doc(db, "sessions", code.trim());
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        setError("Código inválido. Verifica con tu Master.");
        setLoading(false);
        return;
      }

      const sessionData = sessionSnap.data();

      if (sessionData.status === "finished") {
        setError("Esta sesión ya ha terminado.");
        setLoading(false);
        return;
      }

      // Agregar jugador si no está ya en la sesión
      const alreadyIn = sessionData.players?.some((p) => p.uid === user.uid);

      if (!alreadyIn) {
        await updateDoc(sessionRef, {
          players: arrayUnion({
            uid: user.uid,
            email: user.email,
          }),
        });
      }

      setSessionCode(code.trim());
      navigate("/player/chars");

    } catch (error) {
        console.error(error);
      setError("Error al unirse. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 scanlines flex items-center justify-center p-5">
      <div className="pixel-panel p-8 w-full max-w-sm">

        <h1 className="font-caudex text-yellow-600 text-center text-3xl mb-2 tracking-widest glow-gold">
          DnD Session
        </h1>
        <p className="font-caudex text-zinc-500 text-center text-sm mb-8">
          Unirse a sesión
        </p>

        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <label className="font-caudex text-zinc-400 text-sm text-center">
            CÓDIGO DE SESIÓN
          </label>
          <input
            className="bg-black border-2 border-yellow-600 text-yellow-400 font-vt text-5xl text-center tracking-[10px] p-3 w-full outline-none mb-2"
            type="text"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />

          {error && (
            <p className="font-caudex text-red-500 text-sm text-center leading-6">
              {error}
            </p>
          )}

          <button
            className="pixel-btn pixel-btn-gold mt-2"
            type="submit"
            disabled={loading || code.length < 6}
          >
            {loading ? "VERIFICANDO..." : "▶ UNIRSE"}
          </button>
        </form>

        <hr className="border-zinc-700 my-4" />

        <button
          className="pixel-btn"
          onClick={() => navigate("/role")}
        >
          ◀ VOLVER
        </button>

      </div>
    </div>
  );
}