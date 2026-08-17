import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthCard({ eyebrow, title, description, children, footer }: {
  eyebrow: string; title: string; description: string; children: ReactNode; footer: ReactNode;
}) {
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" to="/"><span className="brand-mark">SV</span><span>SocialVerse</span></Link>
      <section className="auth-card">
        <div className="eyebrow"><span />{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        <footer>{footer}</footer>
      </section>
    </main>
  );
}
