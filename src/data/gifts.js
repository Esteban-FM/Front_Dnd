export const GIFTS = [
  {
    id: "potion",
    name: "Poción de Vida",
    icon: "🧪",
    desc: "Restaura 20 HP al usarla.",
    effect: { type: "potion", value: 20 },
  },
  {
    id: "key",
    name: "Llave Extraña",
    icon: "🗝️",
    desc: "Abre puertas secretas. Su uso es un misterio.",
    effect: { type: "key" },
  },
  {
    id: "ring",
    name: "Anillo Vital",
    icon: "💍",
    desc: "+10% de HP máximo permanente.",
    effect: { type: "hpBoost", value: 10 },
  },
  {
    id: "gold",
    name: "15 Monedas de Oro",
    icon: "🪙",
    desc: "Un poco de oro para comenzar la aventura.",
    effect: { type: "gold", value: 15 },
  },
];