import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Text, RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import type { ResultadoCorte } from "@/lib/calculo-esquadria";

interface Props {
  largura: number;
  altura: number;
  tipo: string;
  folhas: number;
  resultados: ResultadoCorte[];
}

const PROFILE_DEPTH = 0.04;
const PROFILE_WIDTH = 0.05;

function FrameProfile({ position, size, rotation, color }: {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
    </mesh>
  );
}

function GlassPane({ position, size }: {
  position: [number, number, number];
  size: [number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[size[0], size[1], 0.008]} />
      <meshPhysicalMaterial
        color="#88ccff"
        transparent
        opacity={0.3}
        roughness={0.05}
        metalness={0.1}
        transmission={0.7}
        thickness={0.5}
      />
    </mesh>
  );
}

function EsquadriaModel({ largura, altura, tipo, folhas }: Omit<Props, 'resultados'>) {
  const scale = 1 / Math.max(largura, altura);
  const w = largura * scale;
  const h = altura * scale;
  const pw = PROFILE_WIDTH;
  const pd = PROFILE_DEPTH;
  const frameColor = "#8a8a8a";
  const trackColor = "#6a6a6a";

  const elements = useMemo(() => {
    const els: JSX.Element[] = [];

    if (tipo === "correr" || tipo === "balcao" || tipo === "camarao") {
      const nFolhas = folhas || 2;

      // Tracks (top and bottom)
      els.push(
        <FrameProfile key="track-bot" position={[0, -h / 2, 0]} size={[w, pw * 0.6, pd * 1.5]} color={trackColor} />,
        <FrameProfile key="track-top" position={[0, h / 2, 0]} size={[w, pw * 0.6, pd * 1.5]} color={trackColor} />
      );

      // Sliding leaves
      const leafW = w / nFolhas;
      for (let i = 0; i < nFolhas; i++) {
        const xOff = -w / 2 + leafW / 2 + i * leafW;
        const zOff = (i % 2 === 0 ? -1 : 1) * pd * 0.4;

        // Vertical profiles (montantes)
        els.push(
          <FrameProfile key={`m-l-${i}`} position={[xOff - leafW / 2 + pw / 2, 0, zOff]} size={[pw, h - pw, pd]} color={frameColor} />,
          <FrameProfile key={`m-r-${i}`} position={[xOff + leafW / 2 - pw / 2, 0, zOff]} size={[pw, h - pw, pd]} color={frameColor} />
        );

        // Horizontal profiles (travessas)
        els.push(
          <FrameProfile key={`t-t-${i}`} position={[xOff, h / 2 - pw, zOff]} size={[leafW - pw * 2, pw, pd]} color={frameColor} />,
          <FrameProfile key={`t-b-${i}`} position={[xOff, -h / 2 + pw, zOff]} size={[leafW - pw * 2, pw, pd]} color={frameColor} />
        );

        // Glass
        els.push(
          <GlassPane key={`g-${i}`} position={[xOff, 0, zOff]} size={[leafW - pw * 3, h - pw * 3]} />
        );
      }
    } else {
      // Generic frame (fixa, maxim-ar, basculante, pivotante, giro, etc.)
      // Outer frame
      els.push(
        <FrameProfile key="frame-l" position={[-w / 2 + pw / 2, 0, 0]} size={[pw, h, pd]} color={frameColor} />,
        <FrameProfile key="frame-r" position={[w / 2 - pw / 2, 0, 0]} size={[pw, h, pd]} color={frameColor} />,
        <FrameProfile key="frame-t" position={[0, h / 2 - pw / 2, 0]} size={[w - pw * 2, pw, pd]} color={frameColor} />,
        <FrameProfile key="frame-b" position={[0, -h / 2 + pw / 2, 0]} size={[w - pw * 2, pw, pd]} color={frameColor} />
      );

      // Glass
      els.push(
        <GlassPane key="glass" position={[0, 0, 0]} size={[w - pw * 3, h - pw * 3]} />
      );

      // For pivotante/giro, add inner frame slightly offset
      if (tipo === "pivotante" || tipo === "giro") {
        const innerPw = pw * 0.8;
        const zOff = pd * 0.5;
        els.push(
          <FrameProfile key="inner-l" position={[-w / 2 + pw + innerPw / 2, 0, zOff]} size={[innerPw, h - pw * 3, pd * 0.8]} color="#999" />,
          <FrameProfile key="inner-r" position={[w / 2 - pw - innerPw / 2, 0, zOff]} size={[innerPw, h - pw * 3, pd * 0.8]} color="#999" />,
          <FrameProfile key="inner-t" position={[0, h / 2 - pw - innerPw / 2, zOff]} size={[w - pw * 4, innerPw, pd * 0.8]} color="#999" />,
          <FrameProfile key="inner-b" position={[0, -h / 2 + pw + innerPw / 2, zOff]} size={[w - pw * 4, innerPw, pd * 0.8]} color="#999" />
        );
      }
    }

    return els;
  }, [w, h, tipo, folhas]);

  return <group>{elements}</group>;
}

export function EsquadriaViewer3D({ largura, altura, tipo, folhas, resultados }: Props) {
  const scale = 1 / Math.max(largura, altura);
  const camDist = 1.8;

  return (
    <div className="w-full h-[450px] bg-gradient-to-b from-muted/20 to-muted/40 rounded-xl border border-border overflow-hidden">
      <Canvas camera={{ position: [0, 0, camDist], fov: 40 }} gl={{ antialias: true }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1} />
        <directionalLight position={[-2, -1, 3]} intensity={0.3} />

        <EsquadriaModel largura={largura} altura={altura} tipo={tipo} folhas={folhas} />

        {/* Dimension labels */}
        <Text position={[0, -(altura * scale) / 2 - 0.08, 0]} fontSize={0.04} color="#666" anchorX="center">
          {largura}mm
        </Text>
        <Text
          position={[-(largura * scale) / 2 - 0.08, 0, 0]}
          fontSize={0.04}
          color="#666"
          anchorX="center"
          rotation={[0, 0, Math.PI / 2]}
        >
          {altura}mm
        </Text>

        <ContactShadows position={[0, -(altura * scale) / 2 - 0.12, 0]} opacity={0.15} scale={3} blur={3} />
        <OrbitControls enablePan enableZoom enableRotate minDistance={0.5} maxDistance={5} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
