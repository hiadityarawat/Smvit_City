import { useEffect, type ReactNode } from "react";
import { authApi } from "./authApi";
import { useAuthStore } from "./authStore";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const setSession = useAuthStore((state) => state.setSession);
  const setAnonymous = useAuthStore((state) => state.setAnonymous);

  useEffect(() => {
    if (status !== "bootstrapping") return;
    void authApi.refresh().then(setSession).catch(setAnonymous);
  }, [setAnonymous, setSession, status]);

  if (status === "bootstrapping") {
    return <main className="session-loading" role="status"><span className="brand-mark">SV</span><p>Restoring your city session…</p></main>;
  }
  return children;
}
