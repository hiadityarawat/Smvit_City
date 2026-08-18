import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../features/auth/AuthCard";
import { authApi } from "../features/auth/authApi";
import { useAuthStore } from "../features/auth/authStore";
import { formError } from "../features/auth/formError";

export function RegisterPage() {
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  const field = (name: keyof typeof form) => ({ value: form[name], onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [name]: event.target.value })) });

  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true); setError(null);
    try { setSession(await authApi.register(form)); navigate("/app", { replace: true }); }
    catch (caught) { setError(formError(caught)); } finally { setPending(false); }
  }

  return <AuthCard eyebrow="Claim your place" title="Build your identity." description="Your account creates a profile and reserves your first building in the Newcomer District." footer={<>Already have an account? <Link to="/login">Sign in</Link></>}>
    <form className="auth-form" onSubmit={submit}>
      <label>Display name<input autoComplete="name" maxLength={80} required {...field("displayName")} /></label>
      <label>Username<input autoComplete="username" minLength={3} maxLength={32} pattern="[a-zA-Z0-9_]+" required {...field("username")} /><small>Letters, numbers, and underscores.</small></label>
      <label>Email<input type="email" autoComplete="email" maxLength={320} required {...field("email")} /></label>
      <label>Password<input type="password" autoComplete="new-password" minLength={10} maxLength={128} required {...field("password")} /><small>At least 10 characters with uppercase, lowercase, and a number.</small></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary-action" disabled={pending}>{pending ? "Creating your building…" : "Create account"}</button>
    </form>
  </AuthCard>;
}
