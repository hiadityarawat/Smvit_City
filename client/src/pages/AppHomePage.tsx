import { Building2, LogOut, MapPin, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../features/auth/authApi";
import { useAuthStore } from "../features/auth/authStore";

export function AppHomePage() {
  const user = useAuthStore((state) => state.user)!; const setAnonymous = useAuthStore((state) => state.setAnonymous); const navigate = useNavigate();
  async function logout() { try { await authApi.logout(); } finally { setAnonymous(); navigate("/", { replace: true }); } }
  return <main className="account-page"><nav className="nav shell"><a className="brand" href="/"><span className="brand-mark">SV</span><span>SocialVerse</span></a><button className="quiet-button" onClick={logout}><LogOut size={16} /> Sign out</button></nav><section className="account-shell shell"><div className="eyebrow"><span /> Account ready</div><h1>Welcome, {user.displayName}.</h1><p>Your secure account is active and your city identity has been provisioned.</p><Link className="primary-action" to="/world">Enter the city</Link><div className="account-grid"><article><Building2 /><span>Building</span><strong>{user.buildingId.slice(0, 8)}</strong></article><article><MapPin /><span>District</span><strong>{user.district}</strong></article><article><ShieldCheck /><span>Role</span><strong>{user.role}</strong></article></div></section></main>;
}
