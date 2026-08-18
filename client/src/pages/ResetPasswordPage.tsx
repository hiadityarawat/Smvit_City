import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthCard } from "../features/auth/AuthCard";
import { authApi } from "../features/auth/authApi";
import { formError } from "../features/auth/formError";

export function ResetPasswordPage() {
  const [params] = useSearchParams(); const token = params.get("token") ?? ""; const [password, setPassword] = useState(""); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(token ? null : "This reset link is missing its token."); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (!token) return; setPending(true); setError(null); try { setMessage((await authApi.resetPassword(token, password)).message); } catch (caught) { setError(formError(caught)); } finally { setPending(false); } }
  return <AuthCard eyebrow="Secure reset" title="Choose a new key." description="Resetting your password signs out every existing SocialVerse session." footer={<Link to="/login">Return to sign in</Link>}>
    <form className="auth-form" onSubmit={submit}><label>New password<input type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={password} onChange={(e) => setPassword(e.target.value)} /><small>At least 10 characters with uppercase, lowercase, and a number.</small></label>{message && <div className="form-success" role="status">{message}</div>}{error && <div className="form-error" role="alert">{error}</div>}<button className="primary-action" disabled={pending || !token || !!message}>{pending ? "Resetting…" : "Reset password"}</button></form>
  </AuthCard>;
}
