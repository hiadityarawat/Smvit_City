import type { AuthSession, SessionUser } from "@socialverse/shared";
import { create } from "zustand";

type AuthStatus = "bootstrapping" | "authenticated" | "anonymous";

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  user: SessionUser | null;
  setSession: (session: AuthSession) => void;
  setAnonymous: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "bootstrapping",
  accessToken: null,
  user: null,
  setSession: (session) => set({ status: "authenticated", accessToken: session.accessToken, user: session.user }),
  setAnonymous: () => set({ status: "anonymous", accessToken: null, user: null }),
}));
