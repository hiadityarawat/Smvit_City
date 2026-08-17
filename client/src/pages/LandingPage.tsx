import { ArrowRight, Box, Database, Radio, ShieldCheck } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useHealth } from "../hooks/useHealth";
import { useAuthStore } from "../features/auth/authStore";

const CityPreview = lazy(async () => {
  const module = await import("../components/CityPreview");
  return { default: module.CityPreview };
});

const foundations = [
  { icon: Box, label: "React + Three.js", detail: "Immersive client foundation" },
  { icon: Database, label: "PostgreSQL + Prisma", detail: "Relational world model" },
  { icon: Radio, label: "Socket.IO", detail: "Realtime-ready transport" },
  { icon: ShieldCheck, label: "Secure by design", detail: "Server-owned authorization" },
];

export function LandingPage() {
  const health = useHealth();
  const apiOnline = health.data?.status === "ok";
  const authenticated = useAuthStore((state) => state.status === "authenticated");

  return (
    <main>
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="SocialVerse home">
          <span className="brand-mark">SV</span>
          <span>SocialVerse</span>
        </a>
        <div className="nav-actions"><span className="phase-badge">Authentication / Phase 2</span>{authenticated ? <Link className="nav-link" to="/app">My account</Link> : <><Link className="nav-link" to="/login">Sign in</Link><Link className="nav-cta" to="/register">Create account</Link></>}</div>
      </nav>

      <section id="top" className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span /> A living social city</div>
          <h1>Your social network is now a <em>city.</em></h1>
          <p>Explore profiles, discover communities, and watch your social presence become part of a living virtual world.</p>
          <Link className="primary-action" to={authenticated ? "/app" : "/register"}>{authenticated ? "Open my account" : "Claim your building"} <ArrowRight size={18} /></Link>
          <div className="status-line" role="status">
            <span className={apiOnline ? "status-dot online" : "status-dot"} />
            {health.isPending ? "Checking platform services…" : apiOnline ? "API foundation online" : "API is offline — start the server to connect"}
          </div>
        </div>
        <Suspense fallback={<div className="city-preview preview-loading">Preparing the skyline…</div>}>
          <CityPreview />
        </Suspense>
      </section>

      <section id="foundation" className="foundation shell" aria-labelledby="foundation-title">
        <div>
          <div className="eyebrow">Built to grow</div>
          <h2 id="foundation-title">The city starts with solid ground.</h2>
        </div>
        <div className="foundation-grid">
          {foundations.map(({ icon: Icon, label, detail }) => (
            <article className="foundation-card" key={label}>
              <Icon size={20} aria-hidden="true" />
              <strong>{label}</strong>
              <span>{detail}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
