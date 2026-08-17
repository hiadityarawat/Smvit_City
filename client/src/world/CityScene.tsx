import { Html, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Color, MathUtils, Vector3, type AmbientLight, type DirectionalLight, type Group } from "three";
import type { WorldBuilding } from "./types";
import { useWorldStore } from "./worldStore";

const brownPalettes = [
  { base: "#4b2d22", facade: "#81513c", upper: "#a87054", trim: "#d4a37e" },
  { base: "#513627", facade: "#966044", upper: "#b77b5a", trim: "#e0b08b" },
  { base: "#3d2a22", facade: "#704938", upper: "#9b684f", trim: "#c99672" },
  { base: "#5b3426", facade: "#8a4e37", upper: "#b06e4e", trim: "#e2a879" },
];

function buildingFootprint(building: WorldBuilding) {
  return MathUtils.clamp(8.5 + Math.log10((building.followingCount ?? 0) + 1) * 1.35, 8.5, 14.5);
}

function WindowBands({ width, depth, height, online }: { width: number; depth: number; height: number; online: boolean }) {
  const count = MathUtils.clamp(Math.floor(height / 5), 2, 8);
  const material = <meshStandardMaterial color={online ? "#ffd79b" : "#263037"} emissive={online ? "#ff9e4f" : "#0b0e12"} emissiveIntensity={online ? 1.25 : .08} roughness={.35} />;
  return <>{Array.from({ length: count }, (_, index) => {
    const y = 2.4 + index * Math.max(3.2, (height - 3) / count);
    return <group key={index}>
      <mesh position={[0, y, depth / 2 + .08]}><boxGeometry args={[width * .72, .42, .12]} />{material}</mesh>
      <mesh position={[0, y, -depth / 2 - .08]}><boxGeometry args={[width * .72, .42, .12]} />{material}</mesh>
      <mesh position={[width / 2 + .08, y, 0]}><boxGeometry args={[.12, .42, depth * .68]} />{material}</mesh>
      <mesh position={[-width / 2 - .08, y, 0]}><boxGeometry args={[.12, .42, depth * .68]} />{material}</mesh>
    </group>;
  })}</>;
}

function BuildingMesh({ building }: { building: WorldBuilding }) {
  const selected = useWorldStore((state) => state.selected?.id === building.id);
  const select = useWorldStore((state) => state.select);
  const followers = building.followerCount ?? 0;
  const footprint = buildingFootprint(building);
  const depth = footprint * (.82 + (building.level % 3) * .06);
  const height = building.height;
  const palette = brownPalettes[building.level % brownPalettes.length]!;
  const tower = followers >= 1_000;
  const skyscraper = followers >= 100_000;
  const click = (event: { stopPropagation(): void }) => { event.stopPropagation(); select(building); };
  const baseHeight = Math.min(4.5, Math.max(2.4, height * .16));
  const mainHeight = tower ? height * (skyscraper ? .57 : .68) : height - baseHeight;
  const upperHeight = Math.max(2.2, height - baseHeight - mainHeight);
  const windowStart = baseHeight;

  return <group position={[building.x, 0, building.z]} scale={selected ? 1.045 : 1} onClick={click}>
    <mesh position={[0, .16, 0]} receiveShadow><boxGeometry args={[footprint + 3.4, .32, depth + 3.4]} /><meshStandardMaterial color="#6c4b36" roughness={.95} /></mesh>
    <mesh position={[0, baseHeight / 2 + .32, 0]} castShadow={selected} receiveShadow><boxGeometry args={[footprint, baseHeight, depth]} /><meshStandardMaterial color={palette.base} roughness={.78} /></mesh>
    <mesh position={[0, baseHeight + mainHeight / 2, 0]} castShadow={selected}><boxGeometry args={[footprint * .82, mainHeight, depth * .82]} /><meshStandardMaterial color={selected ? "#c88d69" : palette.facade} roughness={.66} /></mesh>
    {tower && <mesh position={[0, baseHeight + mainHeight + upperHeight / 2, 0]} castShadow><boxGeometry args={[footprint * (skyscraper ? .53 : .66), upperHeight, depth * (skyscraper ? .53 : .66)]} /><meshStandardMaterial color={palette.upper} roughness={.62} /></mesh>}
    {tower && <mesh position={[0, height + .22, 0]}><boxGeometry args={[footprint * .68, .45, depth * .68]} /><meshStandardMaterial color={palette.trim} metalness={.15} roughness={.55} /></mesh>}
    {skyscraper && <mesh position={[0, height + 2.25, 0]}><cylinderGeometry args={[.12, .24, 4, 8]} /><meshStandardMaterial color="#d7a576" metalness={.65} /></mesh>}
    <group position={[0, windowStart, 0]}><WindowBands width={footprint * .82} depth={depth * .82} height={mainHeight} online={building.online} /></group>
    <mesh position={[0, 1.65, depth / 2 + .12]}><boxGeometry args={[footprint * .36, 1.8, .2]} /><meshStandardMaterial color="#2e1d17" emissive={building.online ? "#7a321d" : "#000"} emissiveIntensity={.35} /></mesh>
    {(selected || building.online) && <Html position={[0, height + (skyscraper ? 5 : 2.2), 0]} center distanceFactor={18}><div className="world-name-tag"><span className={building.online ? "online" : ""} />{building.username}</div></Html>}
  </group>;
}

function CampusGround() {
  const roads = [-140, -84, -28, 28, 84, 140];
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.08, 0]} receiveShadow><planeGeometry args={[900, 900]} /><meshStandardMaterial color="#344b2d" roughness={1} /></mesh>
    {roads.map((offset) => <group key={offset}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[offset, .01, 0]}><planeGeometry args={[10, 520]} /><meshStandardMaterial color="#393b3c" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .012, offset]}><planeGeometry args={[520, 10]} /><meshStandardMaterial color="#393b3c" /></mesh>
    </group>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .025, 0]}><circleGeometry args={[25, 48]} /><meshStandardMaterial color="#8b5b3e" /></mesh>
    <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[7, 9, 2.4, 8]} /><meshStandardMaterial color="#70412f" /></mesh>
    <Html position={[0, 5, 0]} center distanceFactor={24}><div className="campus-marker"><strong>SIR MVIT</strong><span>Social Campus · Bengaluru 562157</span></div></Html>
  </group>;
}

function DayNight() {
  const ambient = useRef<AmbientLight>(null); const sun = useRef<DirectionalLight>(null); const day = useRef(new Color("#9bb7d0")); const night = useRef(new Color("#11151a")); const sky = useRef(new Color());
  useFrame(({ clock, scene }) => { const phase = (clock.elapsedTime % 180) / 180; const daylight = MathUtils.smoothstep(Math.sin(phase * Math.PI * 2) * .5 + .5, .15, .85); if (ambient.current) ambient.current.intensity = .34 + daylight * 1.05; if (sun.current) sun.current.intensity = .35 + daylight * 2.25; sky.current.copy(night.current).lerp(day.current, daylight); scene.background = sky.current; if (scene.fog) scene.fog.color.copy(sky.current); });
  return <><ambientLight ref={ambient} /><directionalLight ref={sun} position={[80, 120, 30]} color="#ffe0b7" castShadow /></>;
}

function HeroAvatar({ remote = false }: { remote?: boolean }) {
  const red = remote ? "#ba5d4b" : "#d83f38"; const black = "#16191d";
  return <group scale={remote ? .82 : 1}>
    <mesh position={[0, 2.65, 0]} castShadow scale={[.72, .88, .68]}><sphereGeometry args={[.62, 18, 14]} /><meshStandardMaterial color={red} roughness={.55} /></mesh>
    <mesh position={[-.24, 2.75, .49]} rotation={[0, -.2, -.16]} scale={[.18, .3, .07]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#e8f4ed" emissive="#bfe9ff" emissiveIntensity={.55} /></mesh>
    <mesh position={[.24, 2.75, .49]} rotation={[0, .2, .16]} scale={[.18, .3, .07]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#e8f4ed" emissive="#bfe9ff" emissiveIntensity={.55} /></mesh>
    <mesh position={[0, 1.65, 0]} castShadow scale={[.82, 1.05, .48]}><capsuleGeometry args={[.48, .82, 8, 14]} /><meshStandardMaterial color={red} roughness={.62} /></mesh>
    <mesh position={[0, 1.1, .38]} scale={[.5, .34, .08]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={black} /></mesh>
    <mesh position={[0, .92, 0]} scale={[.66, .4, .46]}><sphereGeometry args={[.65, 12, 8]} /><meshStandardMaterial color={black} /></mesh>
    <group name="left-arm" position={[-.72, 1.72, 0]} rotation={[0, 0, .15]}><mesh position={[0, -.55, 0]} castShadow><capsuleGeometry args={[.19, .78, 6, 10]} /><meshStandardMaterial color={black} /></mesh><mesh position={[0, -1.12, 0]}><sphereGeometry args={[.23, 10, 8]} /><meshStandardMaterial color={red} /></mesh></group>
    <group name="right-arm" position={[.72, 1.72, 0]} rotation={[0, 0, -.15]}><mesh position={[0, -.55, 0]} castShadow><capsuleGeometry args={[.19, .78, 6, 10]} /><meshStandardMaterial color={black} /></mesh><mesh position={[0, -1.12, 0]}><sphereGeometry args={[.23, 10, 8]} /><meshStandardMaterial color={red} /></mesh></group>
    <group name="left-leg" position={[-.3, .72, 0]}><mesh position={[0, -.58, 0]} castShadow><capsuleGeometry args={[.24, .76, 6, 10]} /><meshStandardMaterial color={black} /></mesh><mesh position={[0, -1.12, .08]} scale={[.3, .2, .5]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={red} /></mesh></group>
    <group name="right-leg" position={[(.3), .72, 0]}><mesh position={[0, -.58, 0]} castShadow><capsuleGeometry args={[.24, .76, 6, 10]} /><meshStandardMaterial color={black} /></mesh><mesh position={[0, -1.12, .08]} scale={[.3, .2, .5]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={red} /></mesh></group>
  </group>;
}

function Player({ buildings }: { buildings: WorldBuilding[] }) {
  const group = useRef<Group>(null); const avatar = useRef<Group>(null); const velocity = useRef(new Vector3()); const grounded = useRef(true); const updateClock = useRef(0); const { camera } = useThree();
  const setPlayer = useWorldStore((state) => state.setPlayer); const consumeTeleport = useWorldStore((state) => state.consumeTeleport);
  useEffect(() => { const keyMap: Record<string, keyof ReturnType<typeof useWorldStore.getState>["input"]> = { KeyW: "forward", ArrowUp: "forward", KeyS: "back", ArrowDown: "back", KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right", ShiftLeft: "run", Space: "jump" }; const down = (event: KeyboardEvent) => { const key = keyMap[event.code]; if (key) { event.preventDefault(); useWorldStore.getState().setInput(key, true); } }; const up = (event: KeyboardEvent) => { const key = keyMap[event.code]; if (key) useWorldStore.getState().setInput(key, false); }; window.addEventListener("keydown", down); window.addEventListener("keyup", up); return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); }; }, []);
  useFrame(({ clock }, deltaRaw) => { if (!group.current) return; const delta = Math.min(deltaRaw, .05); const store = useWorldStore.getState(); if (store.teleport) { group.current.position.set(store.teleport.x, 1.25, store.teleport.z + 16); velocity.current.set(0, 0, 0); consumeTeleport(); }
    const input = store.input; const forward = new Vector3(); camera.getWorldDirection(forward); forward.y = 0; forward.normalize(); const right = new Vector3(-forward.z, 0, forward.x); const intent = new Vector3().addScaledVector(forward, Number(input.forward) - Number(input.back)).addScaledVector(right, Number(input.right) - Number(input.left)); if (intent.lengthSq() > 0) intent.normalize(); const speed = input.run ? 18 : 10; velocity.current.x = MathUtils.damp(velocity.current.x, intent.x * speed, intent.lengthSq() ? 9 : 12, delta); velocity.current.z = MathUtils.damp(velocity.current.z, intent.z * speed, intent.lengthSq() ? 9 : 12, delta); if (input.jump && grounded.current) { velocity.current.y = 8; grounded.current = false; } velocity.current.y -= 22 * delta;
    const next = group.current.position.clone().addScaledVector(velocity.current, delta); const collides = buildings.some((building) => { const half = buildingFootprint(building) / 2 + .8; return Math.abs(next.x - building.x) < half && Math.abs(next.z - building.z) < half && next.y < 5; }); if (!collides) { group.current.position.x = MathUtils.clamp(next.x, -430, 430); group.current.position.z = MathUtils.clamp(next.z, -430, 430); } if (next.y <= 1.25) { group.current.position.y = 1.25; velocity.current.y = 0; grounded.current = true; } else group.current.position.y = next.y; if (intent.lengthSq()) group.current.rotation.y = Math.atan2(intent.x, intent.z);
    if (avatar.current) { const swing = intent.lengthSq() ? Math.sin(clock.elapsedTime * (input.run ? 13 : 9)) * .08 : 0; avatar.current.rotation.z = MathUtils.damp(avatar.current.rotation.z, swing, 10, delta); avatar.current.position.y = Math.abs(swing) * .45; }
    updateClock.current += delta; if (updateClock.current > .08) { setPlayer({ x: group.current.position.x, y: group.current.position.y, z: group.current.position.z }); updateClock.current = 0; }
  });
  return <group ref={group} position={[0, 1.25, 14]}><group ref={avatar}><HeroAvatar /></group></group>;
}

function RemotePlayers() { const remotePlayers = useWorldStore((state) => state.remotePlayers); return <>{Object.values(remotePlayers).map((player) => <group key={player.userId} position={[player.x, player.y, player.z]} rotation={[0, player.rotationY, 0]}><HeroAvatar remote /><Html position={[0, 3.6, 0]} center distanceFactor={18}><div className="world-name-tag"><span className="online" />{player.username}</div></Html></group>)}</>; }

function Scene({ buildings }: { buildings: WorldBuilding[] }) {
  return <><color attach="background" args={[new Color("#11151a")]} /><fog attach="fog" args={["#11151a", 190, 540]} /><DayNight /><pointLight position={[0, 16, 0]} intensity={36} color="#ffb171" /><Stars radius={250} depth={70} count={650} factor={3} fade speed={.25} /><CampusGround />{buildings.map((building) => <BuildingMesh key={building.id} building={building} />)}<Player buildings={buildings} /><RemotePlayers /><OrbitControls makeDefault enablePan={false} minDistance={10} maxDistance={82} minPolarAngle={.45} maxPolarAngle={1.38} target={[0, 3, -4]} /></>;
}

export function CityScene({ buildings }: { buildings: WorldBuilding[] }) { return <Canvas shadows camera={{ position: [48, 46, 62], fov: 50 }} dpr={[1, 1.5]} onPointerMissed={() => useWorldStore.getState().select(null)}><Scene buildings={buildings} /></Canvas>; }
