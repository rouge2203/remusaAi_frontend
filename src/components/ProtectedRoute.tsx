import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0b0c]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#75141C]" />
          <p className="font-mono text-[11px] text-neutral-500">{"> cargando sesión..."}</p>
        </div>
      </div>
    );
  }

  if (status === "anon") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
