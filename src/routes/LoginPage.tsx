import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === "authed") {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setError(null);
    setLoading(true);

    try {
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0b0b0c] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[420px] rounded-[28px] border border-neutral-200/80 bg-white p-8 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.25)]"
      >
        <div className="flex flex-col items-center gap-2">
          <img
            src="/logo.webp"
            alt="Remusa AI"
            className="h-14 w-auto object-contain"
            decoding="async"
          />
          <p className="font-mono text-[11px] text-neutral-500">
            {"> remusa ai · sign in"}
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 overflow-hidden"
            >
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nombre de usuario"
              autoComplete="username"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#75141C] focus:outline-none focus:ring-2 focus:ring-[#75141C]/15"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#75141C] focus:outline-none focus:ring-2 focus:ring-[#75141C]/15"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="mt-2 flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#8f2330] to-[#75141C] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_16px_-4px_rgba(117,20,28,0.5)] transition-all duration-200 hover:from-[#75141C] hover:to-[#5c1018] active:scale-[0.98] disabled:opacity-50 disabled:hover:from-[#8f2330] disabled:hover:to-[#75141C]"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <p className="mt-5 text-center font-mono text-[10px] text-neutral-400">
          {"> acceso restringido a personal autorizado"}
        </p>
      </motion.div>
    </div>
  );
}
