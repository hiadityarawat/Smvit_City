import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Link2, Unlink } from "lucide-react";
import { apiClient } from "../api/client";
import { useAuthStore } from "../features/auth/authStore";

interface Integration { name: string; label: string; configured: boolean; connected: boolean; handle?: string }

export function SettingsPage() {
  const user = useAuthStore((state) => state.user)!;
  const [searchParams] = useSearchParams();
  const [displayName, setName] = useState(user.displayName);
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState("MIDNIGHT");
  const [message, setMessage] = useState(searchParams.get("integration") === "connected" ? `${searchParams.get("provider") ?? "Account"} connected.` : "");
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  async function loadIntegrations() {
    const response = await apiClient.get<{ data: Integration[] }>("/integrations");
    setIntegrations(response.data.data);
  }
  useEffect(() => { void loadIntegrations(); }, []);

  async function saveProfile(event: FormEvent) { event.preventDefault(); await apiClient.patch("/users/me/profile", { displayName, bio }); setMessage("Profile saved."); }
  async function saveBuilding(event: FormEvent) { event.preventDefault(); await apiClient.patch(`/buildings/${user.buildingId}`, { theme }); setMessage("Building updated."); }
  async function connect(name: string) {
    const response = await apiClient.post<{ data: { authorizationUrl: string } }>(`/integrations/${name}/connect`);
    window.location.assign(response.data.data.authorizationUrl);
  }
  async function disconnect(name: string) { await apiClient.delete(`/integrations/${name}`); await loadIntegrations(); setMessage("Account disconnected."); }

  return <main className="data-page shell">
    <Link className="back-link" to="/app"><ArrowLeft />Dashboard</Link>
    <div className="data-header"><div><div className="eyebrow"><span />Personal controls</div><h1>Settings</h1></div></div>
    {message && <div className="form-success">{message}</div>}
    <div className="settings-grid">
      <form className="auth-form settings-card" onSubmit={saveProfile}><h2>Public profile</h2><label>Display name<input value={displayName} onChange={(event) => setName(event.target.value)} required maxLength={80} /></label><label>Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} /></label><button className="primary-action">Save profile</button></form>
      <form className="auth-form settings-card" onSubmit={saveBuilding}><h2>Building theme</h2><label>Theme<select value={theme} onChange={(event) => setTheme(event.target.value)}>{["MIDNIGHT", "AURORA", "SUNSET", "FOREST", "OCEAN", "NEON"].map((value) => <option key={value}>{value}</option>)}</select></label><button className="primary-action">Update building</button></form>
      <section className="settings-card integration-card"><h2><Link2 size={20} /> Connected accounts</h2><p>Bring verified public profile details into your SocialVerse building through official provider APIs.</p><div className="integration-list">{integrations.map((integration) => <div className="integration-row" key={integration.name}><div><strong>{integration.label}</strong><small>{integration.connected ? `Connected${integration.handle ? ` as ${integration.handle}` : ""}` : integration.configured ? "Ready to connect" : "Not enabled by the operator"}</small></div>{integration.connected ? <button type="button" className="secondary-action" onClick={() => void disconnect(integration.name)}><Unlink size={15} />Disconnect</button> : <button type="button" className="secondary-action" disabled={!integration.configured} onClick={() => void connect(integration.name)}><ExternalLink size={15} />Connect</button>}</div>)}</div></section>
    </div>
  </main>;
}
