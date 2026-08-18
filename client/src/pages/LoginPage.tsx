import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../features/auth/AuthCard";
import { authApi } from "../features/auth/authApi";
import { useAuthStore } from "../features/auth/authStore";
import { formError } from "../features/auth/formError";

export function LoginPage() {
  const [emailOrUsername, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true); setError(null);
    try {
      setSession(await authApi.login({ emailOrUsername, password }));
      const destination = typeof location.state === "object" && location.state && "from" in location.state ? String(location.state.from) : "/app";
      navigate(destination, { replace: true });
    } catch (caught) { setError(formError(caught)); } finally { setPending(false); }
  }

  return <AuthCard eyebrow="Welcome back" title="Return to your city." description="Sign in with your email address or SocialVerse username." footer={<>New to SocialVerse? <Link to="/register">Create an account</Link></>}>
    <form className="auth-form" onSubmit={submit}>
      <label>Email or username<input autoComplete="username" value={emailOrUsername} onChange={(e) => setIdentifier(e.target.value)} required /></label>
      <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      <div className="form-row"><Link to="/forgot-password">Forgot password?</Link></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary-action" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  </AuthCard>;
}
