import { Bell, Gauge, LogOut, MapPinned, PlugZap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../features/auth/authApi";
import { useAuthStore } from "../features/auth/authStore";
import { CityScene } from "../world/CityScene";
import { MiniMap } from "../world/MiniMap";
import { ProfilePanel } from "../world/ProfilePanel";
import { TouchControls } from "../world/TouchControls";
import { WorldSearch } from "../world/WorldSearch";
import { useMultiplayer } from "../world/useMultiplayer";
import { useWorldBuildings } from "../world/useWorldBuildings";

export default function WorldPage(){
  const {buildings,demoMode,isLoading}=useWorldBuildings();useMultiplayer();
  const user=useAuthStore((s)=>s.user);const anonymous=useAuthStore((s)=>s.setAnonymous);const navigate=useNavigate();
  async function logout(){try{await authApi.logout();}finally{anonymous();navigate("/",{replace:true});}}
  return <main className="world-page">
    <div className="world-canvas"><CityScene buildings={buildings}/></div>{isLoading&&<div className="world-loading">Loading city chunks…</div>}
    <header className="world-topbar"><Link className="world-brand" to={user?"/app":"/"}><span className="brand-mark">SV</span><strong>SocialVerse</strong></Link><WorldSearch buildings={buildings}/><div className="world-user"><Link className="api-link" aria-label="Integrate official APIs" to={user?"/settings":"/login"}><PlugZap size={15}/><span>Integrate APIs</span></Link>{user&&<Link aria-label="Notifications" to="/notifications"><Bell size={17}/></Link>}<span>{user?.username??"Preview"}</span>{user?<button aria-label="Sign out" onClick={()=>void logout()}><LogOut size={17}/></button>:<Link aria-label="Exit preview" to="/"><LogOut size={17}/></Link>}</div></header>
    <a className="campus-location" href="https://www.openstreetmap.org/?mlat=13.15135&mlon=77.60904#map=18/13.15135/77.60904" target="_blank" rel="noreferrer"><MapPinned size={16}/><span><strong>Sir MVIT Social Campus</strong><small>13.15135° N, 77.60904° E · Bengaluru 562157</small></span></a>
    <div className="controls-help"><Gauge size={15}/><span>WASD move · Shift run · Space jump · Mouse orbit</span></div>{demoMode&&<div className="demo-mode">Offline city preview — connect PostgreSQL for live citizens</div>}<ProfilePanel demoMode={demoMode}/><MiniMap buildings={buildings}/><TouchControls/>
  </main>;
}
