import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useApp } from "../context/AppContext";

export default function RoleSelect() {
  const { user, setSessionRole } = useApp();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  function handleMaster() {
    setSessionRole("master");
    navigate("/master/lobby");
  }

  function handlePlayer() {
    setSessionRole("player");
    navigate("/player/join");
  }

  return (
    <div className="min-h-screen bg-zinc-900 scanlines flex items-center justify-center p-5">
      <div className="pixel-panel p-8 w-full max-w-md">

        <h1 className="font-caudex text-yellow-600 text-center text-3xl mb-2 tracking-widest glow-gold">
          DnD Session
        </h1>
        <p className="font-caudex text-zinc-400 text-center text-sm mb-1">
          Bienvenido, {user?.email}
        </p>
        <p className="font-caudex text-zinc-600 text-center text-sm mb-8">
          ¿Cuál es tu rol hoy?
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Master */}
          <div
            onClick={handleMaster}
            className="bg-black border-2 border-zinc-700 p-6 text-center cursor-pointer transition-all duration-100 hover:border-yellow-600 hover:bg-zinc-950 active:translate-x-px active:translate-y-px"
          >
            <span className="text-4xl block mb-3">🎲</span>
            <h3 className="font-caudex text-yellow-600 text-lg mb-3">
              MASTER
            </h3>
            <p className="font-caudex text-zinc-500 text-xs leading-5">
              Dirige la aventura y controla el destino de los aventureros.
            </p>
          </div>

          {/* Player */}
          <div
            onClick={handlePlayer}
            className="bg-black border-2 border-zinc-700 p-6 text-center cursor-pointer transition-all duration-100 hover:border-yellow-600 hover:bg-zinc-950 active:translate-x-px active:translate-y-px"
          >
            <span className="text-4xl block mb-3">⚔️</span>
            <h3 className="font-caudex text-yellow-600 text-lg mb-3">
              PLAYER
            </h3>
            <p className="font-caudex text-zinc-500 text-xs leading-5">
              Únete a una sesión y vive la aventura.
            </p>
          </div>
        </div>

        <hr className="border-zinc-700 mb-4" />

        <button
          onClick={handleLogout}
          className="font-caudex text-zinc-600 text-sm bg-black border-2 border-zinc-800 w-full py-3 cursor-pointer transition-all hover:border-red-600 hover:text-red-500"
        >
          ✕ CERRAR SESIÓN
        </button>

      </div>
    </div>
  );
}