import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, RoundedBox, Environment, ContactShadows } from "@react-three/drei";
import { useMemo } from "react";

interface Peca {
  id: number;
  largura: number;
  altura: number;
  qtd: number;
  material: string;
}

interface Plano {
  id: number;
  nome: string;
  data: string;
  status: "concluido" | "andamento" | "pendente";
  chapa: { largura: number; altura: number };
  pecas: Peca[];
  aproveitamento: number;
}

const COLORS = [
  "#5ba3f5", "#5cc98a", "#e8a838",
  "#b07ce8", "#e06b6b", "#5cc4b8",
];

const GLASS_THICKNESS = 0.08;

function GlassPane({ position, size, color, label }: {
  position: [number, number, number];
  size: [number, number];
  color: string;
  label: string;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[size[0], size[1], GLASS_THICKNESS]} radius={0.005} smoothness={4}>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.45}
          roughness={0.05}
          metalness={0.1}
          transmission={0.6}
          thickness={0.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>
      {/* Edge wireframe */}
      <RoundedBox args={[size[0], size[1], GLASS_THICKNESS]} radius={0.005} smoothness={4}>
        <meshBasicMaterial color={color} wireframe transparent opacity={0.6} />
      </RoundedBox>
      {/* Label */}
      <Text
        position={[0, 0, GLASS_THICKNESS / 2 + 0.005]}
        fontSize={Math.min(0.06, size[0] * 0.15)}
        color="#1a2a3a"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        {label}
      </Text>
    </group>
  );
}

function ChapaPrimitive({ width, height }: { width: number; height: number }) {
  return (
    <group>
      <RoundedBox args={[width, height, 0.02]} radius={0.01} smoothness={4} position={[0, 0, -GLASS_THICKNESS / 2 - 0.015]}>
        <meshStandardMaterial color="#d4dbe6" transparent opacity={0.3} roughness={0.8} />
      </RoundedBox>
      {/* Border */}
      <RoundedBox args={[width, height, 0.02]} radius={0.01} smoothness={4} position={[0, 0, -GLASS_THICKNESS / 2 - 0.015]}>
        <meshBasicMaterial color="#94a3b8" wireframe />
      </RoundedBox>
    </group>
  );
}

export function CuttingDiagram3D({ plano }: { plano: Plano }) {
  const scale = 1 / Math.max(plano.chapa.largura, plano.chapa.altura);
  const chapaW = plano.chapa.largura * scale;
  const chapaH = plano.chapa.altura * scale;

  const pieces = useMemo(() => {
    const result: { x: number; y: number; w: number; h: number; color: string; label: string }[] = [];
    let cx = -chapaW / 2 + 0.02;
    let cy = chapaH / 2 - 0.02;
    let rowH = 0;

    plano.pecas.forEach((p, pi) => {
      for (let q = 0; q < p.qtd; q++) {
        const pw = p.largura * scale;
        const ph = p.altura * scale;

        if (cx + pw > chapaW / 2 - 0.02) {
          cx = -chapaW / 2 + 0.02;
          cy -= rowH + 0.015;
          rowH = 0;
        }

        result.push({
          x: cx + pw / 2,
          y: cy - ph / 2,
          w: pw,
          h: ph,
          color: COLORS[pi % COLORS.length],
          label: `${p.largura}x${p.altura}`,
        });

        cx += pw + 0.015;
        rowH = Math.max(rowH, ph);
      }
    });

    return result;
  }, [plano, chapaW, chapaH, scale]);

  const cameraDistance = Math.max(chapaW, chapaH) * 1.2;

  return (
    <div className="w-full h-[400px] bg-gradient-to-b from-muted/20 to-muted/40 rounded-xl border border-border overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, cameraDistance], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={1} castShadow />
        <directionalLight position={[-2, -1, 2]} intensity={0.3} />
        <pointLight position={[0, 0, 2]} intensity={0.4} />

        <ChapaPrimitive width={chapaW} height={chapaH} />

        {pieces.map((piece, i) => (
          <GlassPane
            key={i}
            position={[piece.x, piece.y, 0]}
            size={[piece.w, piece.h]}
            color={piece.color}
            label={piece.label}
          />
        ))}

        <ContactShadows position={[0, -chapaH / 2 - 0.1, 0]} opacity={0.2} scale={2} blur={2} />
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={0.3}
          maxDistance={3}
          autoRotate
          autoRotateSpeed={0.5}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
