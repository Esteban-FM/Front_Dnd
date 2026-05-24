import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "./context/AppContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import RoleSelect from "./pages/RoleSelect";
import MasterLobby from "./pages/MasterLobby";
import PlayerJoin from "./pages/PlayerJoin";
import CharCreate from "./pages/CharCreate";
import CharSelect from "./pages/CharSelect";
import PlayerGame from "./pages/GameView/PlayerGame";
import MasterGame from "./pages/GameView/MasterGame";

function PrivateRoute({ children }) {
  const { user, loadingAuth } = useApp();
  if (loadingAuth) return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <p className="text-yellow-500 font-mono text-sm">Cargando...</p>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loadingAuth } = useApp();
  if (loadingAuth) return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <p className="text-yellow-500 font-mono text-sm">Cargando...</p>
    </div>
  );
  return !user ? children : <Navigate to="/role" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Privadas */}
        <Route path="/role" element={<PrivateRoute><RoleSelect /></PrivateRoute>} />
        <Route path="/master/lobby" element={<PrivateRoute><MasterLobby /></PrivateRoute>} />
        <Route path="/master/game" element={<PrivateRoute><MasterGame /></PrivateRoute>} />
        <Route path="/player/join" element={<PrivateRoute><PlayerJoin /></PrivateRoute>} />
        <Route path="/player/chars" element={<PrivateRoute><CharSelect /></PrivateRoute>} />
        <Route path="/player/create" element={<PrivateRoute><CharCreate /></PrivateRoute>} />
        <Route path="/player/game" element={<PrivateRoute><PlayerGame /></PrivateRoute>} />

        {/* Default */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}