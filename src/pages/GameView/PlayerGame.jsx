import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useApp } from "../../context/AppContext";
import { RACES } from "../../data/races";
import { CLASSES } from "../../data/classes";
import { ABILITIES } from "../../data/abilities";
import { statMod, modStr, STAT_NAMES } from "../../data/charUtils";

const STATS = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const INV_TABS = ["Armas", "Objetos", "Consumibles"];


export default function PlayerGame() {
  const { currentChar, setCurrentChar } = useApp();
  const navigate = useNavigate();

  const [char, setChar] = useState(currentChar);
  const [activeTab, setActiveTab] = useState("Armas");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedAbility, setSelectedAbility] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState(null);

  const race = RACES.find((r) => r.id === char?.race);
  const cls = CLASSES.find((c) => c.id === char?.cls);
  const abilities = ABILITIES[char?.cls] || [];

  const [alert, setAlert] = useState(null);
  const prevCharRef = useRef(null);


  // Escuchar cambios en tiempo real del personaje
    useEffect(() => {
      if (!char?.id) return;
      const unsub = onSnapshot(doc(db, "characters", char.id), (snap) => {
        if (snap.exists()) {
          const updated = { id: snap.id, ...snap.data() };
          const prev = prevCharRef.current;

          if (prev) {
            // Detectar nuevo efecto
            const prevEffects = prev.effects || [];
            const newEffects = updated.effects || [];
            const addedEffect = newEffects.find((e) => !prevEffects.includes(e));
            if (addedEffect) {
              showAlert(`⚠️ ${addedEffect}`, "negative");
            }

            // Detectar nuevo modificador
            const prevMods = prev.modifiers || [];
            const newMods = updated.modifiers || [];
            const addedMod = newMods.find(
              (m) => !prevMods.some((pm) => pm.stat === m.stat && pm.val === m.val)
            );
            if (addedMod) {
              const sign = addedMod.val >= 0 ? "+" : "";
              showAlert(
                `${addedMod.stat} ${sign}${addedMod.val}`,
                addedMod.val >= 0 ? "positive" : "negative"
              );
            }

            // Detectar cambio de HP
            if (prev.hp !== updated.hp) {
              const diff = updated.hp - prev.hp;
              if (diff > 0) showAlert(`❤️ +${diff} HP`, "positive");
              else showAlert(`💔 ${diff} HP`, "negative");
            }

            // Detectar nuevo ítem
            const prevInv = prev.inventory || [];
            const newInv = updated.inventory || [];
            if (newInv.length > prevInv.length) {
              const newItem = newInv[newInv.length - 1];
              showAlert(`📦 Recibiste: ${newItem.name}`, "positive");
            }
          }

          prevCharRef.current = updated;
          setChar(updated);
          setCurrentChar(updated);
        }
      });
      return () => unsub();
    }, [char?.id]);

  if (!char) {
    navigate("/player/chars");
    return null;
  }

  const hpPct = Math.max(0, Math.min(100, (char.hp / char.maxHp) * 100));

  function hpBarColor() {
    if (hpPct < 25) return "bg-red-600";
    if (hpPct < 50) return "bg-yellow-500";
    return "bg-green-600";
  }

  // Filtrar inventario por pestaña
  const weapons = char.inventory?.filter((i) => i.type === "weapon") || [];
  const objects = char.inventory?.filter((i) => i.type === "armor" || i.type === "gift") || [];
  const consumibles = char.inventory?.filter((i) => i.type === "consumable") || [];

  function getTabItems() {
    if (activeTab === "Armas") return weapons;
    if (activeTab === "Objetos") return objects;
    if (activeTab === "Consumibles") return consumibles;
    return [];
  }

  async function handleUseConsumable(item) {
    if (item.type !== "consumable") return;
    const newInventory = char.inventory.filter((i) => i.id !== item.id);
    await updateDoc(doc(db, "characters", char.id), {
      inventory: newInventory,
    });
  }

  function showAlert(message, type) {
  setAlert({ message, type, id: Date.now() });
  setTimeout(() => setAlert(null), 3500);
  }

  return (
    <div className="min-h-screen bg-zinc-900 scanlines">


      {alert && (
      <div
        key={alert.id}
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-4 border-2 ${
          alert.type === "negative"
            ? "bg-red-950 border-red-600 text-red-300"
            : "bg-green-950 border-green-600 text-green-300"
        }`}
        style={{ animation: "alertPop 0.3s ease-out" }}
      >
        <p className="font-caudex text-lg text-center">{alert.message}</p>
      </div>
    )}

      {/* Top bar */}
      <div className="bg-black border-b border-zinc-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* <span className="font-caudex text-xs text-green-500 border border-green-800 px-2 py-1">
            ◉ EN PARTIDA
          </span> */}
          {/* <span className="font-caudex text-xs text-yellow-500">
            🪙 {char.gold || 0}
          </span> */}
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">

        {/* Sección superior: imagen + nombre + stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">

          {/* Columna izquierda: nombre + imagen + HP + Armadura */}
          <div className="col-span-1 flex flex-col gap-3">

            {/* Nombre */}
            <div className="bg-black border border-zinc-700 p-2 text-center">
              <p className="font-caudex text-yellow-600 text-lg">{char.name}</p>
              <p className="font-caudex text-zinc-500 text-xs">
                {race?.name} · {cls?.name}
              </p>
                <span className="font-caudex text-xs text-yellow-500">
                  🪙 {char.gold || 0}
                </span>
            </div>

            {/* Imagen del personaje */}
            <div className="bg-black border border-zinc-700 overflow-hidden">
              <img
                src={new URL(`../../assets/classes/${char.cls}.avif`, import.meta.url).href}
                alt={cls?.name}
                className="w-full object-contain grayscale"
                style={{ maxHeight: "200px" }}
              />
            </div>

            {/* HP */}
            <div className="bg-black border border-zinc-700 p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-caudex text-zinc-400 text-xs">HP</span>
                <span className={`font-caudex text-sm ${hpPct < 25 ? "text-red-500" : hpPct < 50 ? "text-yellow-500" : "text-green-500"}`}>
                  {char.hp} / {char.maxHp}
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-3 border border-zinc-700">
                <div
                  className={`h-full transition-all duration-500 ${hpBarColor()}`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            {/* Armadura */}
            <div className="bg-black border border-zinc-700 p-3 text-center">
              <p className="font-caudex text-zinc-400 text-xs mb-1">Armadura</p>
              <p className="font-caudex text-yellow-400 text-2xl">{char.armorClass}</p>
              <p className="font-caudex text-zinc-600 text-xs">{cls?.armor}</p>
            </div>

            {/* Efecto activo */}
            {char.effects && char.effects.length > 0 && (
              <div className="bg-black border border-red-800 p-3 text-center">
                <p className="font-caudex text-zinc-400 text-xs mb-1">Efecto activo</p>
                {char.effects.map((e, i) => (
                  <span key={i} className="font-caudex text-red-400 text-sm block">
                    ⚠️ {e}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha: stats + habilidades */}
          <div className="col-span-2 flex flex-col gap-3">

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {STATS.map((stat) => {
                const val = char.stats?.[stat] || 8;
                const mod = statMod(val);
                const modifier = char.modifiers?.find((m) => m.stat === stat);
                return (
                  <div key={stat} className="bg-black border border-zinc-700 p-3 text-center">
                    <p className="font-caudex text-zinc-500 text-xs mb-1">
                      {STAT_NAMES[stat]}
                    </p>
                    <p className={`font-caudex text-2xl ${mod >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {modStr(mod)}
                    </p>
                    <p className="font-caudex text-zinc-400 text-xs">{val}</p>
                    {modifier && (
                      <p className={`font-caudex text-xs ${modifier.val >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {modifier.val >= 0 ? `+${modifier.val}` : modifier.val}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tipos de ataque */}
            <div className="bg-black border border-zinc-700 p-3">
              <p className="font-caudex text-zinc-400 text-xs mb-2">Tipos de Ataque</p>
              <select
                className="bg-zinc-900 border border-zinc-600 text-yellow-400 font-caudex text-sm p-2 w-full outline-none"
                value={selectedWeapon || ""}
                onChange={(e) => setSelectedWeapon(e.target.value)}
              >
                <option value="">Selecciona un arma...</option>
                {weapons.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — {w.damage || "1D4 de daño"}
                  </option>
                ))}
              </select>
            </div>

            {/* Habilidades / Hechizos */}
            <div className="bg-black border border-zinc-700 p-3 flex-1">
              <p className="font-caudex text-zinc-400 text-xs mb-2">
                {cls?.isMagic ? "Hechizos y Encantamientos" : "Habilidades de Combate"}
              </p>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {abilities.map((ability) => (
                  <div
                    key={ability.id}
                    onClick={() => setSelectedAbility(
                      selectedAbility?.id === ability.id ? null : ability
                    )}
                    className={`border p-2 cursor-pointer transition-all ${
                      selectedAbility?.id === ability.id
                        ? "border-yellow-600 bg-yellow-950"
                        : "border-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-caudex text-yellow-600 text-sm">
                        {ability.name}
                      </p>
                      {ability.damage && (
                        <span className="font-caudex text-red-400 text-xs">
                          {ability.damage}
                        </span>
                      )}
                    </div>
                    {selectedAbility?.id === ability.id && (
                      <p className="font-caudex text-zinc-400 text-xs mt-1 leading-4">
                        {ability.desc}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Inventario con tabs */}
        <div className="bg-black border border-zinc-700">
          <div className="flex border-b border-zinc-700">
            <p className="font-caudex text-zinc-400 text-xs p-3 border-r border-zinc-700">
              Inventario
            </p>
            {INV_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedItem(null); }}
                className={`font-caudex text-xs px-4 py-3 border-r border-zinc-700 transition-all ${
                  activeTab === tab
                    ? "text-yellow-600 bg-yellow-950"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-3 min-h-32">
            {getTabItems().length === 0 ? (
              <p className="font-caudex text-zinc-600 text-xs text-center py-6">
                Sin {activeTab.toLowerCase()} en el inventario
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {getTabItems().map((item) => (
                  <div key={item.id}>
                    <div
                      onClick={() => setSelectedItem(
                        selectedItem?.id === item.id ? null : item
                      )}
                      className={`flex items-center justify-between p-2 border cursor-pointer transition-all ${
                        selectedItem?.id === item.id
                          ? "border-yellow-600 bg-yellow-950"
                          : "border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <span className="font-caudex text-zinc-300 text-sm">
                        {item.name}
                      </span>
                      {item.damage && (
                        <span className="font-caudex text-red-400 text-xs">
                          {item.damage}
                        </span>
                      )}
                    </div>

                    {/* Descripción al hacer clic */}
                    {selectedItem?.id === item.id && (
                      <div className="bg-zinc-900 border border-yellow-900 p-3">
                        <p className="font-caudex text-zinc-400 text-xs leading-5">
                          {item.desc}
                        </p>
                        {activeTab === "Consumibles" && (
                          <button
                            onClick={() => handleUseConsumable(item)}
                            className="pixel-btn pixel-btn-gold mt-2"
                            style={{ padding: "6px 12px", width: "auto", fontSize: "10px" }}
                          >
                            ▶ USAR
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4">
          <button
            onClick={() => navigate("/player/chars")}
            className="pixel-btn"
          >
            ⇄ CAMBIAR DE PERSONAJE
          </button>
        </div>

      </div>
    </div>
  );
}