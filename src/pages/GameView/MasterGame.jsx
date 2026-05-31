import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, arrayUnion, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useApp } from "../../context/AppContext";
import { RACES } from "../../data/races";
import { CLASSES } from "../../data/classes";
import { statMod, modStr, STAT_NAMES, STATS } from "../../data/charUtils";
import { rollRandomMonster } from "../../data/monsterApi";
import { diceApi } from "../../data/api";



const MASTER_TABS = ["JUGADORES", "GGENERADORES" ];
const STAT_LIST = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

const ITEMS_ENCYCLOPEDIA = [
  { id: "sword", name: "Espada Larga", type: "weapon", damage: "1d8", desc: "Daño cortante. +2 STR en combate." },
  { id: "dagger", name: "Daga", type: "weapon", damage: "1d4", desc: "Arma ligera. Puede lanzarse." },
  { id: "axe", name: "Hacha de Batalla", type: "weapon", damage: "1d8", desc: "Daño cortante pesado." },
  { id: "bow", name: "Arco Largo", type: "weapon", damage: "1d8", desc: "Rango 30m. Daño perforante." },
  { id: "staff", name: "Báculo Arcano", type: "weapon", damage: "1d6", desc: "+2 INT. Canaliza magia." },
  { id: "mace", name: "Maza", type: "weapon", damage: "1d6", desc: "Daño contundente sagrado." },
  { id: "shield", name: "Escudo", type: "armor", desc: "+2 CA. Protección básica." },
  { id: "leather", name: "Armadura de Cuero", type: "armor", desc: "+2 CA. Ligera y silenciosa." },
  { id: "potion_hp", name: "Poción de Vida", type: "consumable", desc: "Restaura 20 HP al usar." },
  { id: "potion_str", name: "Poción de Fuerza", type: "consumable", desc: "+4 STR por 1 hora." },
  { id: "antidote", name: "Antídoto", type: "consumable", desc: "Cura venenos y enfermedades." },
  { id: "torch", name: "Antorcha", type: "gift", desc: "Ilumina 6m. 1h de duración." },
  { id: "rope", name: "Cuerda", type: "gift", desc: "15m. Uso variado." },
  { id: "gem", name: "Gema Rara", type: "gift", desc: "Vende por 50 de oro." },
  { id: "ring_power", name: "Anillo del Poder", type: "gift", desc: "+5 a todos los ataques." },
  { id: "boots", name: "Botas de Rapidez", type: "armor", desc: "+2 DEX. +3m movimiento." },
  { id: "cloak", name: "Capa de Sombras", type: "armor", desc: "-2 a detectar sigilo." },
  { id: "map", name: "Mapa Antiguo", type: "gift", desc: "Revela mazmorra oculta." },
];

export default function MasterGame() {
  const { user, sessionCode } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [players, setPlayers] = useState([]);
  const [characters, setCharacters] = useState({});
  const [openAccordion, setOpenAccordion] = useState(null);
  const [modInputs, setModInputs] = useState({});
  const [randResults, setRandResults] = useState({ body: null, trap: null, gold: null, item: null });
  const [monster, setMonster] = useState(null);
  const [loadingMonster, setLoadingMonster] = useState(false);
  const [dragItem, setDragItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [copied, setCopied] = useState(false);

  // Escuchar jugadores de la sesión en tiempo real
  useEffect(() => {
    if (!sessionCode) return;
    const unsub = onSnapshot(doc(db, "sessions", sessionCode), async (snap) => {
      if (!snap.exists()) return;
      const sessionPlayers = snap.data().players || [];
      setPlayers(sessionPlayers);

      // Cargar personajes de cada jugador
      for (const p of sessionPlayers) {
      // Solo cargar si el jugador ya eligió un personaje
      if (!p.activeCharId) {
        setCharacters((prev) => {
          const copy = { ...prev };
          delete copy[p.uid];
          return copy;
        });
        continue;
      }

      // Escuchar el personaje activo específico en tiempo real
      onSnapshot(doc(db, "characters", p.activeCharId), (cSnap) => {
        if (cSnap.exists()) {
          setCharacters((prev) => ({
            ...prev,
            [p.uid]: { id: cSnap.id, ...cSnap.data() },
          }));
        }
      });
    }
    });
    return () => unsub();
  }, [sessionCode]);

  async function handleHpChange(playerUid, amount) {
    const char = characters[playerUid];
    if (!char) return;
    const newHp = Math.max(0, Math.min(char.maxHp, char.hp + amount));
    await updateDoc(doc(db, "characters", char.id), { hp: newHp });
  }
  async function handleGoldChange(playerUid, amount) {
  const char = characters[playerUid];
  if (!char) return;
  const newGold = Math.max(0, (char.gold || 0) + amount);
  await updateDoc(doc(db, "characters", char.id), { gold: newGold });
}

  async function handleAddModifier(playerUid) {
    const char = characters[playerUid];
    if (!char) return;
    const input = modInputs[playerUid];
    if (!input?.stat || !input?.val) return;

    const val = parseInt(input.val);
    if (isNaN(val)) return;

    const newModifiers = [
      ...(char.modifiers || []).filter((m) => m.stat !== input.stat),
      { stat: input.stat, val },
    ];

    await updateDoc(doc(db, "characters", char.id), { modifiers: newModifiers });
    setModInputs((prev) => ({ ...prev, [playerUid]: { stat: "STR", val: "" } }));
  }

  async function handleRemoveModifier(playerUid, stat) {
    const char = characters[playerUid];
    if (!char) return;
    const newModifiers = (char.modifiers || []).filter((m) => m.stat !== stat);
    await updateDoc(doc(db, "characters", char.id), { modifiers: newModifiers });
  }

  async function handleAddEffect(playerUid, effect) {
    const char = characters[playerUid];
    if (!char || !effect.trim()) return;
    const newEffects = [...(char.effects || []), effect.trim()];
    await updateDoc(doc(db, "characters", char.id), { effects: newEffects });
  }

  async function handleRemoveEffect(playerUid, effect) {
    const char = characters[playerUid];
    if (!char) return;
    const newEffects = (char.effects || []).filter((e) => e !== effect);
    await updateDoc(doc(db, "characters", char.id), { effects: newEffects });
  }

  async function handleDropItem(playerUid, item) {
    const char = characters[playerUid];
    if (!char) return;
    const newItem = {
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      type: item.type,
      desc: item.desc,
      damage: item.damage || null,
    };
    const newInventory = [...(char.inventory || []), newItem];
    await updateDoc(doc(db, "characters", char.id), { inventory: newInventory });
  }

    async function handleRollMonster() {
    setLoadingMonster(true);
    setMonster(null);
    try {
      const data = await rollRandomMonster();
      setMonster(data);
    } catch (err) {
      console.error("Error al obtener monstruo:", err);
    } finally {
      setLoadingMonster(false);
    }
  }

  function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function hpColor(char) {
    const pct = char.hp / char.maxHp;
    if (pct < 0.25) return "text-red-500";
    if (pct < 0.5) return "text-yellow-500";
    return "text-green-500";
  }

  function hpBarColor(char) {
    const pct = char.hp / char.maxHp;
    if (pct < 0.25) return "bg-red-600";
    if (pct < 0.5) return "bg-yellow-500";
    return "bg-green-600";
  }

  return (
    <div className="min-h-screen bg-zinc-900 scanlines">

      {/* Top bar */}
      <div className="bg-black border-b border-zinc-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
          <h1 className="font-caudex text-yellow-600 text-lg tracking-widest">
            🎲 Master
          </h1>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(sessionCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-2 bg-black border-2 border-yellow-600 px-3 py-1 hover:bg-yellow-950 transition-all cursor-pointer"
            title="Clic para copiar el código"
          >
            <span className="font-caudex text-zinc-500 text-xs">CÓDIGO:</span>
            <span className="font-caudex text-yellow-400 text-lg tracking-widest">
              {sessionCode}
            </span>
            <span className="font-caudex text-zinc-500 text-xs">
              {copied ? "✓ Copiado" : "📋"}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-caudex text-xs text-green-500 border border-green-800 px-2 py-1">
            ◉ ACTIVO
          </span>
          <span className="font-caudex text-xs text-blue-400 border border-blue-800 px-2 py-1">
            👥 {players.length}
          </span>
          <button
            onClick={() => navigate("/role")}
            className="font-caudex text-xs text-zinc-500 border border-zinc-700 px-3 py-1 hover:border-red-600 hover:text-red-500 transition-all"
          >
            ✕ SALIR
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-700">
        {MASTER_TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`font-caudex text-xs px-6 py-3 border-r border-zinc-700 transition-all ${
              activeTab === i
                ? "text-yellow-600 bg-yellow-950 border-b-2 border-b-yellow-600"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-6xl mx-auto">

        {/* TAB 0 — JUGADORES */}
          {activeTab === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Columna izquierda: Lista de jugadores (2/3) */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {players.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="font-caudex text-zinc-600 text-sm">
                      No hay jugadores en la sesión.
                    </p>
                    <p className="font-caudex text-yellow-700 text-sm mt-2">
                      Código: {sessionCode}
                    </p>
                  </div>
                ) : (
                  players.map((p) => {
                    const char = characters[p.uid];
                    const race = char ? RACES.find((r) => r.id === char.race) : null;
                    const cls = char ? CLASSES.find((c) => c.id === char.cls) : null;
                    const isOpen = openAccordion === p.uid;
                    const hpPct = char ? Math.max(0, Math.min(100, (char.hp / char.maxHp) * 100)) : 0;
                    const modInput = modInputs[p.uid] || { stat: "STR", val: "" };

                    return (
                      <div key={p.uid} className="bg-black border border-zinc-700">

                        {/* Accordion header */}
                        <div
                          onClick={() => setOpenAccordion(isOpen ? null : p.uid)}
                          onDragOver={(e) => { e.preventDefault(); setDropTarget(p.uid); }}
                          onDragLeave={() => setDropTarget(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragItem) handleDropItem(p.uid, dragItem);
                            setDropTarget(null);
                            setDragItem(null);
                          }}
                          className={`flex items-center justify-between p-4 cursor-pointer transition-all ${
                            dropTarget === p.uid ? "bg-yellow-950 border-2 border-yellow-600" : "hover:bg-zinc-950"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {char && (
                              <img
                                src={new URL(`../../assets/classes/${char.cls}.avif`, import.meta.url).href}
                                alt={cls?.name}
                                className="w-10 h-10 object-contain grayscale"
                              />
                            )}
                            <div>
                              <p className="font-caudex text-yellow-600 text-base">
                                {char?.name || p.email}
                              </p>
                              <p className="font-caudex text-zinc-500 text-xs">
                                {char ? `${race?.name} · ${cls?.name}` : "Eligiendo personaje..."}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {char && (
                              <span className={`font-caudex text-lg ${hpColor(char)}`}>
                                ❤️ {char.hp}/{char.maxHp}
                              </span>
                            )}
                            <span className="text-zinc-500 text-xs">
                              {isOpen ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>

                        {/* Accordion body */}
                        {isOpen && char && (
                          <div className="border-t border-zinc-700 p-4 flex flex-col gap-4">

                            {/* HP Bar */}
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="font-caudex text-zinc-400 text-xs">VIDA</span>
                                <span className={`font-caudex text-sm ${hpColor(char)}`}>
                                  {char.hp} / {char.maxHp}
                                </span>
                              </div>
                              <div className="w-full bg-zinc-800 h-4 border border-zinc-700 mb-3">
                                <div
                                  className={`h-full transition-all duration-500 ${hpBarColor(char)}`}
                                  style={{ width: `${hpPct}%` }}
                                />
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {[2, 5].map((n) => (
                                  <button
                                    key={`+${n}`}
                                    onClick={() => handleHpChange(p.uid, n)}
                                    className="font-caudex text-xs px-3 py-2 border border-green-700 text-green-500 hover:bg-green-950 transition-all"
                                  >
                                    +{n}
                                  </button>
                                ))}
                                {[2, 5].map((n) => (
                                  <button
                                    key={`-${n}`}
                                    onClick={() => handleHpChange(p.uid, -n)}
                                    className="font-caudex text-xs px-3 py-2 border border-red-700 text-red-500 hover:bg-red-950 transition-all"
                                  >
                                    -{n}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Oro */}
                            <div>
                              <div className="flex justify-between mb-2">
                                <span className="font-caudex text-zinc-400 text-xs">ORO</span>
                                <span className="font-caudex text-yellow-400 text-sm">
                                  🪙 {char.gold || 0}
                                </span>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {[1, 5, 10].map((n) => (
                                  <button
                                    key={`g+${n}`}
                                    onClick={() => handleGoldChange(p.uid, n)}
                                    className="font-caudex text-xs px-3 py-2 border border-yellow-700 text-yellow-500 hover:bg-yellow-950 transition-all"
                                  >
                                    +{n}
                                  </button>
                                ))}
                                {[1, 5, 10].map((n) => (
                                  <button
                                    key={`g-${n}`}
                                    onClick={() => handleGoldChange(p.uid, -n)}
                                    className="font-caudex text-xs px-3 py-2 border border-zinc-600 text-zinc-400 hover:bg-zinc-800 transition-all"
                                  >
                                    -{n}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Modificadores de stats */}
                            <div>
                              <p className="font-caudex text-zinc-400 text-xs mb-2">
                                MODIFICADORES DE ATRIBUTOS
                              </p>
                              {char.modifiers && char.modifiers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {char.modifiers.map((m, i) => (
                                    <div key={i} className="flex items-center gap-1 border border-zinc-600 px-2 py-1">
                                      <span className="font-caudex text-xs text-zinc-300">
                                        {m.stat}: {m.val >= 0 ? `+${m.val}` : m.val}
                                      </span>
                                      <button
                                        onClick={() => handleRemoveModifier(p.uid, m.stat)}
                                        className="font-caudex text-red-500 text-xs ml-1 hover:text-red-400"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <select
                                  value={modInput.stat}
                                  onChange={(e) => setModInputs((prev) => ({
                                    ...prev,
                                    [p.uid]: { ...modInput, stat: e.target.value },
                                  }))}
                                  className="bg-zinc-900 border border-zinc-600 text-zinc-300 font-caudex text-xs p-2 outline-none"
                                >
                                  {STAT_LIST.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  placeholder="+2 / -3"
                                  value={modInput.val}
                                  onChange={(e) => setModInputs((prev) => ({
                                    ...prev,
                                    [p.uid]: { ...modInput, val: e.target.value },
                                  }))}
                                  className="bg-zinc-900 border border-zinc-600 text-zinc-300 font-caudex text-xs p-2 outline-none w-20"
                                />
                                <button
                                  onClick={() => handleAddModifier(p.uid)}
                                  className="font-caudex text-xs px-3 py-2 border border-yellow-700 text-yellow-500 hover:bg-yellow-950 transition-all"
                                >
                                  + APLICAR
                                </button>
                              </div>
                            </div>

                            {/* Efectos */}
                            <div>
                              <p className="font-caudex text-zinc-400 text-xs mb-2">
                                EFECTOS ACTIVOS
                              </p>
                              {char.effects && char.effects.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {char.effects.map((e, i) => (
                                    <div key={i} className="flex items-center gap-1 border border-red-800 px-2 py-1">
                                      <span className="font-caudex text-xs text-red-400">{e}</span>
                                      <button
                                        onClick={() => handleRemoveEffect(p.uid, e)}
                                        className="font-caudex text-red-500 text-xs ml-1"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Ej: Envenenado, Quemado..."
                                  className="bg-zinc-900 border border-zinc-600 text-zinc-300 font-caudex text-xs p-2 outline-none flex-1"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddEffect(p.uid, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                />
                                <button
                                  onClick={(e) => {
                                    const input = e.target.previousSibling;
                                    handleAddEffect(p.uid, input.value);
                                    input.value = "";
                                  }}
                                  className="font-caudex text-xs px-3 py-2 border border-red-700 text-red-500 hover:bg-red-950 transition-all"
                                >
                                  + AGREGAR
                                </button>
                              </div>
                            </div>

                            {/* Inventario actual del jugador */}
                            <div>
                              <p className="font-caudex text-zinc-400 text-xs mb-2">
                                INVENTARIO ACTUAL
                              </p>
                              <div className="flex flex-col gap-1">
                                {(char.inventory || []).length === 0 ? (
                                  <p className="font-caudex text-zinc-600 text-xs">Vacío</p>
                                ) : (
                                  char.inventory.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between border border-zinc-800 px-2 py-1">
                                      <span className="font-caudex text-zinc-400 text-xs">{item.name}</span>
                                      <span className="font-caudex text-zinc-600 text-xs">{item.type}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Columna derecha: Enciclopedia fija (1/3) */}
              <div className="lg:col-span-1">
                <div className="bg-black border border-zinc-700 p-3 sticky top-4">
                  <p className="font-caudex text-yellow-600 text-xs mb-1">
                    📦 ENCICLOPEDIA DE ÍTEMS
                  </p>
                  <p className="font-caudex text-zinc-600 text-xs mb-3 leading-4">
                    Arrastra un ítem sobre un jugador para entregárselo.
                  </p>
                  <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
                    {ITEMS_ENCYCLOPEDIA.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => setDragItem(item)}
                        onDragEnd={() => setDragItem(null)}
                        className="bg-zinc-900 border border-zinc-700 p-2 cursor-grab hover:border-yellow-600 transition-all active:cursor-grabbing"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-caudex text-yellow-600 text-xs">{item.name}</span>
                          {item.damage && (
                            <span className="font-caudex text-red-400 text-xs">{item.damage}</span>
                          )}
                        </div>
                        <p className="font-caudex text-zinc-500 text-xs leading-4 mt-1">
                          {item.desc}
                        </p>
                        <span className={`font-caudex text-xs mt-1 block ${
                          item.type === "weapon" ? "text-red-500" :
                          item.type === "armor" ? "text-blue-400" :
                          item.type === "consumable" ? "text-green-400" : "text-zinc-500"
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

        {/* TAB 1 — ALEATORIEDAD */}
        {activeTab === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">

            {/* Parte del cuerpo */}
            <div className="bg-black border border-zinc-700 p-4 text-center">
              <p className="font-caudex text-yellow-600 text-xs mb-3">
                PARTE DEL CUERPO
              </p>
              <p className="font-caudex text-zinc-300 text-sm min-h-10 mb-4 leading-5">
                {randResults.body || "─"}
              </p>
              <button
                onClick={async () => {
                  try {
                    const data = await diceApi.rollBodyPart();
                    setRandResults((p) => ({ ...p, body: data.result }));
                  } catch (err) {
                    console.error("Error al tirar:", err);
                  }
                }}
                className="pixel-btn pixel-btn-gold"
                style={{ fontSize: "10px", padding: "8px" }}
              >
                🎲 TIRAR
              </button>
            </div>

            {/* Trampa */}
            <div className="bg-black border border-zinc-700 p-4 text-center">
              <p className="font-caudex text-yellow-600 text-xs mb-3">
                TRAMPA
              </p>
              <p className="font-caudex text-zinc-300 text-sm min-h-10 mb-4 leading-5">
                {randResults.trap || "─"}
              </p>
              <button
                onClick={async () => {
                  try {
                    const data = await diceApi.rollTrap();
                    setRandResults((p) => ({ ...p, trap: data.result }));
                  } catch (err) {
                    console.error("Error al tirar:", err);
                  }
                }}
                className="pixel-btn pixel-btn-gold"
                style={{ fontSize: "10px", padding: "8px" }}
              >
                🎲 TIRAR
              </button>
            </div>

            {/* Monstruo */}
            <div className="bg-black border border-zinc-700 p-4 text-center sm:col-span-2">
              <p className="font-caudex text-yellow-600 text-xs mb-3">
                ENCUENTRO (DnD 5e API)
              </p>

              {loadingMonster ? (
                <p className="font-caudex text-zinc-500 text-sm min-h-10 mb-4">
                  Invocando criatura...
                </p>
              ) : monster ? (
                <div className="text-left mb-4 max-h-48 overflow-y-auto">
                  <p className="font-caudex text-yellow-500 text-base text-center mb-2">
                    {monster.name}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="border border-zinc-800 p-1 text-center">
                      <p className="font-caudex text-zinc-600 text-xs">HP</p>
                      <p className="font-caudex text-red-400 text-sm">{monster.hit_points}</p>
                    </div>
                    <div className="border border-zinc-800 p-1 text-center">
                      <p className="font-caudex text-zinc-600 text-xs">CA</p>
                      <p className="font-caudex text-blue-400 text-sm">
                        {monster.armor_class?.[0]?.value ?? "?"}
                      </p>
                    </div>
                    <div className="border border-zinc-800 p-1 text-center">
                      <p className="font-caudex text-zinc-600 text-xs">CR</p>
                      <p className="font-caudex text-yellow-400 text-sm">{monster.challenge_rating}</p>
                    </div>
                  </div>
                  <p className="font-caudex text-zinc-500 text-xs mb-1">
                    {monster.type} · {monster.size} · {monster.alignment}
                  </p>
                  {monster.actions && monster.actions.length > 0 && (
                    <div className="mt-2">
                      <p className="font-caudex text-zinc-400 text-xs mb-1">Acciones:</p>
                      {monster.actions.slice(0, 3).map((a, i) => (
                        <p key={i} className="font-caudex text-zinc-500 text-xs leading-4 mb-1">
                          <span className="text-yellow-600">{a.name}:</span> {a.desc}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="font-caudex text-zinc-300 text-sm min-h-10 mb-4">─</p>
              )}

              <button
                onClick={handleRollMonster}
                disabled={loadingMonster}
                className="pixel-btn pixel-btn-gold"
                style={{ fontSize: "10px", padding: "8px" }}
              >
                🎲 TIRAR
              </button>
            </div>

            {/* Oro */}
            <div className="bg-black border border-zinc-700 p-4 text-center">
              <p className="font-caudex text-yellow-600 text-xs mb-3">
                ORO ENCONTRADO
              </p>
              <p className="font-caudex text-zinc-300 text-sm min-h-10 mb-4 leading-5">
                {randResults.gold ? `🪙 ${randResults.gold} monedas` : "─"}
              </p>
              <button
                onClick={async () => {
                  try {
                    const data = await diceApi.rollGold();
                    setRandResults((p) => ({ ...p, gold: data.result }));
                  } catch (err) {
                    console.error("Error al tirar:", err);
                  }
                }}
                className="pixel-btn pixel-btn-gold"
                style={{ fontSize: "10px", padding: "8px" }}
              >
                🎲 TIRAR
              </button>
            </div>

            {/* Objeto aleatorio */}
            <div className="bg-black border border-zinc-700 p-4 text-center">
              <p className="font-caudex text-yellow-600 text-xs mb-3">
                OBJETO ENCONTRADO
              </p>
              {randResults.item ? (
                <div className="mb-4 min-h-10">
                  <p className="font-caudex text-yellow-500 text-sm">
                    {randResults.item.name}
                  </p>
                  {randResults.item.damage && (
                    <p className="font-caudex text-red-400 text-xs">
                      ⚔️ {randResults.item.damage}
                    </p>
                  )}
                  <p className="font-caudex text-zinc-500 text-xs leading-4 mt-1">
                    {randResults.item.desc}
                  </p>
                </div>
              ) : (
                <p className="font-caudex text-zinc-300 text-sm min-h-10 mb-4">─</p>
              )}
              <button
                onClick={async () => {
                  try {
                    const data = await diceApi.rollItem();
                    setRandResults((p) => ({ ...p, item: data.result }));
                  } catch (err) {
                    console.error("Error al tirar:", err);
                  }
                }}
                className="pixel-btn pixel-btn-gold"
                style={{ fontSize: "10px", padding: "8px" }}
              >
                🎲 TIRAR
              </button>
            </div>

          </div>
        )}

      

      </div>
    </div>
  );
}