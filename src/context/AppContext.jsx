import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [sessionCode, setSessionCode] = useState(null);
  const [sessionRole, setSessionRole] = useState(null); // "master" | "player"
  const [currentChar, setCurrentChar] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  // Helper para obtener el token y hacer llamadas al backend
  async function authFetch(url, options = {}) {
    const token = await user.getIdToken();
    return fetch(`http://localhost:3001/api${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  }

  const value = {
    user,
    loadingAuth,
    sessionCode,
    setSessionCode,
    sessionRole,
    setSessionRole,
    currentChar,
    setCurrentChar,
    authFetch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}