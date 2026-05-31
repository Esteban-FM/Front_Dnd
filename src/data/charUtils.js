// Costo de puntos por valor de atributo (sistema point buy DnD)
export const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

// Valores disponibles para asignar
export const STAT_VALUES = [8, 10, 12, 13, 14, 15];

export const STATS = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

export const STAT_NAMES = {
  STR: "Fuerza",
  DEX: "Destreza",
  CON: "Constitución",
  INT: "Inteligencia",
  WIS: "Sabiduría",
  CHA: "Carisma",
};

// Calcula el modificador de un atributo
export function statMod(val) {
  return Math.floor((val - 10) / 2);
}

// Formatea el modificador con signo
export function modStr(val) {
  return val >= 0 ? `+${val}` : `${val}`;
}

// Calcula puntos gastados
export function pointsSpent(stats) {
  return Object.values(stats).reduce((a, v) => a + (POINT_COST[v] || 0), 0);
}

// Calcula HP máximo base
export function calcMaxHp(race, cls, conScore) {
  const conMod = statMod(conScore);
  return cls.baseHp + race.baseHp + conMod;
}

// Aplica bonificadores de raza y clase a los stats base
export function applyBonuses(stats, race, cls) {
  const result = { ...stats };
  if (race?.bonus) {
    Object.entries(race.bonus).forEach(([k, v]) => {
      result[k] = (result[k] || 8) + v;
    });
  }
  if (cls?.bonus) {
    Object.entries(cls.bonus).forEach(([k, v]) => {
      result[k] = (result[k] || 8) + v;
    });
  }
  return result;
}