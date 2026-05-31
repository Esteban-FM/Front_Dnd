import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useApp } from "../context/AppContext";
import { RACES } from "../data/races";
import { CLASSES } from "../data/classes";


export default function CharSelect() {
  const { user, setCurrentChar, sessionCode } = useApp();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCharacters();
  }, []);

  async function loadCharacters() {
    try {
      const q = query(
        collection(db, "characters"),
        where("ownerUid", "==", user.uid)
      );
      const snap = await getDocs(q);
      const chars = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCharacters(chars);
    } catch (err) {
      console.error("Error cargando personajes:", err);
    } finally {
      setLoading(false);
    }
  }

    async function handleSelect(char) {
      setCurrentChar(char);

      // Registrar el personaje activo en la sesión
      if (sessionCode) {
        try {
          const sessionRef = doc(db, "sessions", sessionCode);
          const snap = await getDoc(sessionRef);
          if (snap.exists()) {
            const players = snap.data().players || [];
            const updated = players.map((p) =>
              p.uid === user.uid ? { ...p, activeCharId: char.id } : p
            );
            await updateDoc(sessionRef, { players: updated });
          }
        } catch (err) {
          console.error("Error al registrar personaje:", err);
        }
      }

      navigate("/player/game");
    }

  function getRace(raceId) {
    return RACES.find((r) => r.id === raceId);
  }

  function getCls(clsId) {
    return CLASSES.find((c) => c.id === clsId);
  }

  function hpColor(char) {
    const pct = char.hp / char.maxHp;
    if (pct < 0.25) return "text-red-500";
    if (pct < 0.5) return "text-yellow-500";
    return "text-green-500";
  }

  return (
    <div className="min-h-screen bg-zinc-900 scanlines flex items-center justify-center p-5">
      <div className="pixel-panel p-8 w-full max-w-lg">

        <h1 className="font-caudex text-yellow-600 text-center text-3xl mb-2 tracking-widest glow-gold">
          DnD Session
        </h1>
        <p className="font-caudex text-zinc-500 text-center text-sm mb-8">
          Tus aventureros
        </p>

        {loading ? (
          <p className="font-caudex text-zinc-500 text-center text-sm py-8">
            Cargando aventureros...
          </p>
        ) : characters.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-caudex text-zinc-600 text-sm leading-8">
              No tienes personajes aún.
            </p>
            <p className="font-caudex text-zinc-600 text-sm leading-8">
              ¡Crea tu primer aventurero!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            {characters.map((char) => {
              const race = getRace(char.race);
              const cls = getCls(char.cls);
              return (
                <div
                  key={char.id}
                  className="bg-black border border-zinc-700 p-4 flex items-center justify-between gap-4 hover:border-yellow-600 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                        <img
                          src={new URL(`../assets/classes/${char.cls}.avif`, import.meta.url).href}
                          alt={cls?.name}
                          className="w-32 h-max object-contain grayscale flex-shrink-0"
                        />
                    <div>
                      <p className="font-caudex text-yellow-600 text-lg">
                        {char.name}
                      </p>
                      <p className="font-caudex text-zinc-500 text-xs">
                        {race?.icon} {race?.name} · {cls?.name}
                      </p>
                      <p className={`font-caudex text-xs mt-1 ${hpColor(char)}`}>
                        ❤️ {char.hp} / {char.maxHp}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelect(char)}
                    className="pixel-btn pixel-btn-gold"
                    style={{ width: "auto", padding: "8px 16px" }}
                  >
                    ▶ USAR
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <hr className="border-zinc-700 my-4" />

        <button
          onClick={() => navigate("/player/create")}
          className="pixel-btn pixel-btn-gold mb-2"
        >
          + NUEVO PERSONAJE
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