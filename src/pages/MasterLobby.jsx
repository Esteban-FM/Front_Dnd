import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useApp } from "../context/AppContext";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function MasterLobby() {
  const { user, sessionCode, setSessionCode } = useApp();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let unsub;
    initSession().then((code) => {
      unsub = onSnapshot(doc(db, "sessions", code), (snap) => {
        if (snap.exists()) {
          setPlayers(snap.data().players || []);
        }
      });
    });
    return () => unsub && unsub();
  }, []);

  async function initSession() {
    const code = generateCode();
    setSessionCode(code);

    await setDoc(doc(db, "sessions", code), {
      code,
      masterUid: user.uid,
      masterEmail: user.email,
      status: "waiting",
      createdAt: Date.now(),
      players: [],
    });

    setLoading(false);
    return code;
  }

  function handleStartGame() {
    navigate("/master/game");
  }

  return (
    <div className="min-h-screen bg-zinc-900 scanlines flex items-center justify-center p-5">
      <div className="pixel-panel p-8 w-full max-w-md">

        <h1 className="font-caudex text-yellow-600 text-center text-3xl mb-2 tracking-widest glow-gold">
          DnD Session
        </h1>
        <p className="font-caudex text-zinc-500 text-center text-sm mb-8">
          Sala del Master
        </p>

        {/* Código de sesión */}
        {loading ? (
          <div className="bg-black border-2 border-zinc-700 p-8 text-center mb-4">
            <p className="font-caudex text-zinc-500 text-sm">Generando sesión...</p>
          </div>
        ) : (
          <div className="bg-black border-2 border-yellow-600 p-4 text-center mb-4">
            <p className="font-caudex text-zinc-400 text-xs mb-1">
              Comparte este código con los jugadores
            </p>
            <span
              className="font-vt text-yellow-400 tracking-[10px]"
              style={{ fontSize: "56px", textShadow: "0 0 12px rgba(200,168,64,0.4)" }}
            >
              {sessionCode}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="flex gap-2 justify-center mb-5 flex-wrap">
          <span className="font-caudex text-xs px-3 py-1 border border-green-600 text-green-500 bg-green-950">
            ◉ SESIÓN ACTIVA
          </span>
          <span className="font-caudex text-xs px-3 py-1 border border-blue-600 text-blue-400 bg-blue-950">
            👥 {players.length} jugadores
          </span>
        </div>

        {/* Lista de jugadores */}
        <div className="bg-black border border-zinc-700 p-4 min-h-[80px] mb-5">
          <p className="font-caudex text-zinc-500 text-xs mb-3">
            JUGADORES CONECTADOS:
          </p>
          {players.length === 0 ? (
            <p className="font-caudex text-zinc-700 text-sm text-center py-3">
              Esperando jugadores...
            </p>
          ) : (
            players.map((p, i) => (
              <div key={i} className="flex items-center gap-3 mb-2">
                <span className="text-green-500 text-sm">◉</span>
                <span className="font-caudex text-zinc-300 text-base">{p.email}</span>
              </div>
            ))
          )}
        </div>

        <button
          onClick={handleStartGame}
          disabled={players.length === 0}
          className="pixel-btn pixel-btn-gold mb-2"
        >
          ⚔️ INICIAR AVENTURA
        </button>

        <button
          onClick={() => navigate("/role")}
          className="pixel-btn"
        >
          ◀ VOLVER
        </button>

      </div>
    </div>
  );
}