import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "./authStore";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();
  if (status !== "authenticated") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
