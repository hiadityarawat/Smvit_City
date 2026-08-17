import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "../features/auth/AuthCard";
import { authApi } from "../features/auth/authApi";
import { formError } from "../features/auth/formError";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setPending(true); setError(null); try { setMessage((await authApi.forgotPassword(email)).message); } catch (caught) { setError(formError(caught)); } finally { setPending(false); } }
  return <AuthCard eyebrow="Account recovery" title="Find your way back." description="Enter your email address to prepare a secure, single-use reset link." footer={<Link to="/login">Return to sign in</Link>}>
    <form className="auth-form" onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>{message && <div className="form-success" role="status">{message}</div>}{error && <div className="form-error" role="alert">{error}</div>}<button className="primary-action" disabled={pending}>{pending ? "Preparing…" : "Request reset link"}</button></form>
  </AuthCard>;
}
