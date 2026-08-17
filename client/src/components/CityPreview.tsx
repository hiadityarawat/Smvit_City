import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";

const blocks = [
  [-4, 1.2, 2.4], [-2.6, 2.1, 1.8], [-1.2, 1.5, 2.2], [0.2, 2.8, 1.7],
  [1.6, 1.8, 2.1], [3, 2.5, 1.8], [4.4, 1.3, 2.3],
] as const;

function Skyline() {
  const group = useRef<Group>(null);
  const buildings = useMemo(() => blocks, []);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.12) * 0.07;
  });

  return (
    <group ref={group} rotation={[-0.08, -0.18, 0]}>
      {buildings.map(([x, height, depth], index) => (
        <mesh key={x} position={[x, height / 2 - 1.1, index % 2 ? 0.1 : -0.55]}>
          <boxGeometry args={[1.05, height, depth]} />
          <meshStandardMaterial color={index === 3 ? "#75f0d2" : "#28314d"} emissive={index === 3 ? "#143d38" : "#10152a"} />
        </mesh>
      ))}
      <mesh position={[0, -1.16, 0]}>
        <boxGeometry args={[11, 0.12, 5]} />
        <meshStandardMaterial color="#11182b" />
      </mesh>
    </group>
  );
}

export function CityPreview() {
  return (
    <div className="city-preview" aria-label="Abstract 3D preview of the future SocialVerse city">
      <Canvas camera={{ position: [0, 3.1, 9], fov: 37 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#080b18"]} />
        <fog attach="fog" args={["#080b18", 8, 17]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 7, 5]} intensity={2.5} color="#b7c6ff" />
        <pointLight position={[0, 2, 3]} intensity={20} color="#54e9c0" />
        <Skyline />
      </Canvas>
      <div className="preview-caption"><span /> Procedural city preview</div>
    </div>
  );
}
