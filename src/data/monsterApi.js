const BASE_URL = "https://www.dnd5eapi.co/api/2014";

let monsterListCache = null;

export async function getMonsterList() {
  if (monsterListCache) return monsterListCache;
  const res = await fetch(`${BASE_URL}/monsters`);
  const data = await res.json();
  monsterListCache = data.results;
  return monsterListCache;
}

export async function getMonsterDetail(index) {
  const res = await fetch(`${BASE_URL}/monsters/${index}`);
  if (!res.ok) throw new Error("Monstruo no encontrado");
  return await res.json();
}

export async function rollRandomMonster() {
  const list = await getMonsterList();
  const random = list[Math.floor(Math.random() * list.length)];
  const detail = await getMonsterDetail(random.index);
  return detail;
}