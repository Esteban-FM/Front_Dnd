import { auth } from "../firebase/config";

const API_URL = "http://localhost:3001/api";

async function authFetch(endpoint, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("No autenticado");

  const token = await user.getIdToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export const diceApi = {
  rollBodyPart: () => authFetch("/dice/body-part"),
  rollTrap: () => authFetch("/dice/trap"),
  rollGold: () => authFetch("/dice/gold"),
  rollItem: () => authFetch("/dice/item"),
  roll: (sides, count) =>
    authFetch("/dice/roll", {
      method: "POST",
      body: JSON.stringify({ sides, count }),
    }),
};