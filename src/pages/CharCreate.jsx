import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useApp } from "../context/AppContext";
import { RACES } from "../data/races";
import { CLASSES } from "../data/classes";
import { GIFTS } from "../data/gifts";
import {
  STATS,
  STAT_NAMES,
  POINT_COST,
  STAT_VALUES,
  statMod,
  modStr,
  pointsSpent,
  calcMaxHp,
  applyBonuses,
} from "../data/charUtils";

const TOTAL_POINTS = 27;
const defaultStats = { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 };

export default function CharCreate() {
  const { user, sessionCode } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [race, setRace] = useState(null);
  const [cls, setCls] = useState(null);
  const [gift, setGift] = useState(null);
  const [stats, setStats] = useState({ ...defaultStats });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const spent = pointsSpent(stats);
  const remaining = TOTAL_POINTS - spent;

  function handleStatChange(stat, value) {
    const newStats = { ...stats, [stat]: value };
    const newSpent = pointsSpent(newStats);
    if (newSpent > TOTAL_POINTS) return;
    setStats(newStats);
  }

  function nextStep() {
    setError("");
    if (step === 1 && !name.trim()) { setError("Ingresa un nombre"); return; }
    if (step === 2 && !race) { setError("Elige una raza"); return; }
    if (step === 3 && !cls) { setError("Elige una clase"); return; }
    if (step === 4 && !gift) { setError("Elige un regalo"); return; }
    setStep(step + 1);
  }

  function prevStep() {
    setError("");
    setStep(step - 1);
  }

  async function handleFinish() {
    setError("");
    setSaving(true);
    try {
      const selectedRace = RACES.find((r) => r.id === race);
      const selectedCls = CLASSES.find((c) => c.id === cls);
      const selectedGift = GIFTS.find((g) => g.id === gift);
      const finalStats = applyBonuses(stats, selectedRace, selectedCls);
      const maxHp = calcMaxHp(selectedRace, selectedCls, finalStats.CON);

      const initialInventory = [
        {
          id: `weapon-${Date.now()}`,
          name: selectedCls.weapon,
          type: "weapon",
          desc: `Arma inicial del ${selectedCls.name}`,
        },
        {
          id: `armor-${Date.now() + 1}`,
          name: selectedCls.armor,
          type: "armor",
          desc: `Armadura inicial del ${selectedCls.name}`,
        },
        {
          id: `gift-${Date.now() + 2}`,
          name: selectedGift.name,
          type: "gift",
          desc: selectedGift.desc,
          effect: selectedGift.effect,
        },
      ];

      const character = {
        ownerUid: user.uid,
        ownerEmail: user.email,
        sessionCode: sessionCode || null,
        name: name.trim(),
        race,
        cls,
        gift,
        stats: finalStats,
        baseStats: { ...stats },
        maxHp,
        hp: maxHp,
        armorClass: selectedCls.armorClass,
        gold: selectedGift.effect.type === "gold" ? selectedGift.effect.value : 0,
        inventory: initialInventory,
        modifiers: [],
        effects: [],
        createdAt: Date.now(),
      };

      await addDoc(collection(db, "characters"), character);
      navigate("/player/chars");
    } catch (err) {
      console.error(err);
      setError("Error al guardar el personaje.");
    } finally {
      setSaving(false);
    }
  }

  const steps = ["NOMBRE", "RAZA", "CLASE", "REGALO", "ATRIBUTOS"];

  return (
    <div className="min-h-screen bg-zinc-900 scanlines p-6">
      <div className="max-w-6xl mx-auto">

        <h1 className="font-caudex text-yellow-600 text-center text-3xl mb-2 tracking-widest glow-gold">
          DnD Session
        </h1>
        <p className="font-caudex text-zinc-500 text-center text-sm mb-6">
          Crear personaje
        </p>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`font-caudex text-xs px-2 py-1 border ${
                i + 1 <= step
                  ? "border-yellow-600 text-yellow-600 bg-yellow-950"
                  : "border-zinc-700 text-zinc-600"
              }`}>
                {s}
              </div>
              {i < steps.length - 1 && (
                <span className="text-zinc-700 text-xs">─</span>
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Nombre */}
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <p className="font-caudex text-zinc-400 text-sm mb-4 text-center">
              ¿Cómo se llama tu aventurero?
            </p>
            <input
              className="pixel-input"
              type="text"
              placeholder="Nombre del personaje..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
          </div>
        )}

        {/* Step 2 — Raza */}
        {step === 2 && (
          <div>
            <p className="font-caudex text-zinc-400 text-sm mb-4 text-center">
              Elige tu raza
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {RACES.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setRace(r.id)}
                  className={`bg-black border-2 p-4 cursor-pointer text-center transition-all ${
                    race === r.id
                      ? "border-yellow-600 bg-yellow-950"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <p className="font-caudex text-yellow-600 text-sm">{r.name}</p>
                  <p className="font-caudex text-zinc-500 text-xs mt-1 leading-4">
                    {r.info}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Clase */}
        {step === 3 && (
          <div>
            <p className="font-caudex text-zinc-400 text-sm mb-4 text-center">
              Elige tu clase
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {CLASSES.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setCls(c.id)}
                  className={`bg-black border-2 cursor-pointer transition-all ${
                    cls === c.id
                      ? "border-yellow-600 bg-yellow-950"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <img
                    src={new URL(`../assets/classes/${c.id}.avif`, import.meta.url).href}
                    alt={c.name}
                    className="w-full h-64 object-contain grayscale"
                  />
                  <div className="p-3">
                    <p className="font-caudex text-yellow-600 text-sm">{c.name}</p>
                    <p className="font-caudex text-zinc-500 text-xs leading-4 mt-1">
                      {c.desc}
                    </p>
                    <p className="font-caudex text-zinc-600 text-xs mt-2">
                      🛡️ {c.armor}
                    </p>
                    <p className="font-caudex text-zinc-600 text-xs">
                      ⚔️ {c.weapon}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 — Regalo */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto">
            <p className="font-caudex text-zinc-400 text-sm mb-4 text-center">
              Elige tu regalo inicial
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {GIFTS.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setGift(g.id)}
                  className={`bg-black border-2 p-4 cursor-pointer text-center transition-all ${
                    gift === g.id
                      ? "border-yellow-600 bg-yellow-950"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <span className="text-3xl block mb-2">{g.icon}</span>
                  <p className="font-caudex text-yellow-600 text-sm mb-1">{g.name}</p>
                  <p className="font-caudex text-zinc-500 text-xs leading-4">{g.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5 — Atributos */}
        {step === 5 && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-black border border-yellow-600 p-3 text-center mb-6">
              <span className="font-caudex text-yellow-400 text-2xl">{remaining}</span>
              <p className="font-caudex text-zinc-500 text-xs">
                puntos disponibles de {TOTAL_POINTS}
              </p>
            </div>
            <p className="font-caudex text-zinc-500 text-xs text-center mb-4">
              Selecciona un valor para cada atributo. Los bonificadores de raza y clase se aplican al final.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {STATS.map((stat) => {
                const selectedRace = RACES.find((r) => r.id === race);
                const selectedCls = CLASSES.find((c) => c.id === cls);
                const bonus =
                  (selectedRace?.bonus?.[stat] || 0) +
                  (selectedCls?.bonus?.[stat] || 0);
                const total = stats[stat] + bonus;
                return (
                  <div key={stat} className="bg-black border border-zinc-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-caudex text-zinc-400 text-sm">
                        {STAT_NAMES[stat]}
                      </span>
                      <div className="flex items-center gap-2">
                        {bonus !== 0 && (
                          <span className="font-caudex text-xs text-green-500">
                            {bonus > 0 ? `+${bonus}` : bonus}
                          </span>
                        )}
                        <span className="font-caudex text-yellow-400 text-xl">{total}</span>
                        <span className="font-caudex text-zinc-500 text-xs">
                          ({modStr(statMod(total))})
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {STAT_VALUES.map((val) => {
                        const cost = POINT_COST[val] - POINT_COST[stats[stat]];
                        const canAfford = cost <= remaining;
                        const isSelected = stats[stat] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => handleStatChange(stat, val)}
                            disabled={!canAfford && !isSelected}
                            className={`font-caudex text-sm px-3 py-1 border transition-all ${
                              isSelected
                                ? "border-yellow-600 text-yellow-600 bg-yellow-950"
                                : canAfford
                                ? "border-zinc-600 text-zinc-400 hover:border-zinc-400"
                                : "border-zinc-800 text-zinc-700 cursor-not-allowed"
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="font-caudex text-red-500 text-sm text-center mt-4">
            {error}
          </p>
        )}

        {/* Navegación */}
        <div className="flex gap-3 mt-8 max-w-md mx-auto">
          {step > 1 && (
            <button onClick={prevStep} className="pixel-btn" style={{ flex: 1 }}>
              ◀ ATRÁS
            </button>
          )}
          {step < 5 ? (
            <button onClick={nextStep} className="pixel-btn pixel-btn-gold" style={{ flex: 2 }}>
              SIGUIENTE ▶
            </button>
          ) : (
            <button onClick={handleFinish} disabled={saving} className="pixel-btn pixel-btn-gold" style={{ flex: 2 }}>
              {saving ? "GUARDANDO..." : "⚔️ ¡CREAR AVENTURERO!"}
            </button>
          )}
        </div>

        <div className="max-w-md mx-auto mt-2">
          <button onClick={() => navigate("/player/chars")} className="pixel-btn">
            ✕ CANCELAR
          </button>
        </div>

      </div>
    </div>
  );
}