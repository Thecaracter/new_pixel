import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Window component with sky gradient fill, frame, sill, and dividers.
 */
function OfficeWindow({ width, height, position, rotation, skyTexture }) {
  const frameThickness = 0.06;
  const frameDepth = 0.08;
  const halfW = width / 2;
  const halfH = height / 2;

  return (
    <group position={position} rotation={rotation}>
      {/* Sky backdrop with subtle gradient */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={skyTexture} toneMapped={false} />
      </mesh>

      {/* Frame: Top */}
      <mesh position={[0, halfH, 0.02]} castShadow>
        <boxGeometry args={[width + frameThickness * 2, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#fbf5e8" roughness={0.6} />
      </mesh>

      {/* Frame: Bottom / Sill */}
      <mesh position={[0, -halfH, 0.03]} castShadow>
        <boxGeometry args={[width + frameThickness * 2 + 0.1, frameThickness * 1.4, frameDepth + 0.06]} />
        <meshStandardMaterial color="#fbf5e8" roughness={0.6} />
      </mesh>

      {/* Frame: Left */}
      <mesh position={[-halfW, 0, 0.02]} castShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#fbf5e8" roughness={0.6} />
      </mesh>

      {/* Frame: Right */}
      <mesh position={[halfW, 0, 0.02]} castShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#fbf5e8" roughness={0.6} />
      </mesh>

      {/* Center vertical divider */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[0.04, height, frameDepth * 0.7]} />
        <meshStandardMaterial color="#fbf5e8" roughness={0.6} />
      </mesh>

      {/* Horizontal divider */}
      <mesh position={[0, -0.1, 0.015]}>
        <boxGeometry args={[width, 0.04, frameDepth * 0.7]} />
        <meshStandardMaterial color="#fbf5e8" roughness={0.6} />
      </mesh>

      {/* Subtle glass reflection sheet */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.12}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

/**
 * Modern Glass Partition for Conference / Meeting Room
 * Includes dark aluminum mullions, transparent glass panes, and frosted privacy strip
 */
function GlassPartition() {
  const glassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e0f2fe',
    transparent: true,
    opacity: 0.28,
    roughness: 0.1,
    metalness: 0.2,
  }), []);

  const frostedMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.42,
    roughness: 0.3,
  }), []);

  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.4,
    metalness: 0.3,
  }), []);

  return (
    <group name="glass-meeting-partition">
      {/* ================= 1. West Glass Wall (along X = 10.4, from Z=0 to Z=6.2) ================= */}
      {/* Section A: Z=0 to Z=3.8 */}
      <group position={[10.4, 0, 1.9]}>
        {/* Top Header */}
        <mesh position={[0, 3.2, 0]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 0.08, 3.8]} />
        </mesh>
        {/* Bottom Sill */}
        <mesh position={[0, 0.04, 0]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 0.08, 3.8]} />
        </mesh>
        {/* Vertical Post: Z=0 */}
        <mesh position={[0, 1.6, -1.9]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 3.2, 0.08]} />
        </mesh>
        {/* Vertical Post: Z=1.9 */}
        <mesh position={[0, 1.6, 0]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 3.2, 0.08]} />
        </mesh>
        {/* Vertical Post: Z=3.8 (Door jamb) */}
        <mesh position={[0, 1.6, 1.9]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 3.2, 0.08]} />
        </mesh>
        {/* Main Glass Sheets */}
        <mesh position={[0, 1.6, 0]} material={glassMat}>
          <boxGeometry args={[0.02, 3.1, 3.75]} />
        </mesh>
        {/* Frosted Privacy Band */}
        <mesh position={[0, 1.45, 0]} material={frostedMat}>
          <boxGeometry args={[0.025, 0.45, 3.75]} />
        </mesh>
      </group>

      {/* Doorway Header over walk-through opening (Z=3.8 to Z=5.0) */}
      <group position={[10.4, 0, 4.4]}>
        <mesh position={[0, 2.5, 0]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 0.08, 1.2]} />
        </mesh>
        {/* Transom glass above doorway */}
        <mesh position={[0, 2.85, 0]} material={glassMat}>
          <boxGeometry args={[0.02, 0.65, 1.15]} />
        </mesh>
        {/* Top Header */}
        <mesh position={[0, 3.2, 0]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 0.08, 1.2]} />
        </mesh>
      </group>

      {/* Section B: Z=5.0 to Z=6.2 */}
      <group position={[10.4, 0, 5.6]}>
        {/* Top Header */}
        <mesh position={[0, 3.2, 0]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 0.08, 1.2]} />
        </mesh>
        {/* Bottom Sill */}
        <mesh position={[0, 0.04, 0]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 0.08, 1.2]} />
        </mesh>
        {/* Vertical Post: Z=5.0 (Door jamb) */}
        <mesh position={[0, 1.6, -0.6]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 3.2, 0.08]} />
        </mesh>
        {/* Corner Post: Z=6.2 */}
        <mesh position={[0, 1.6, 0.6]} material={frameMat} castShadow>
          <boxGeometry args={[0.1, 3.2, 0.1]} />
        </mesh>
        {/* Glass Sheet */}
        <mesh position={[0, 1.6, 0]} material={glassMat}>
          <boxGeometry args={[0.02, 3.1, 1.15]} />
        </mesh>
        {/* Frosted Privacy Band */}
        <mesh position={[0, 1.45, 0]} material={frostedMat}>
          <boxGeometry args={[0.025, 0.45, 1.15]} />
        </mesh>
      </group>

      {/* ================= 2. South Glass Wall (along Z = 6.2, from X=10.4 to X=16.0) ================= */}
      <group position={[13.2, 0, 6.2]}>
        {/* Top Header */}
        <mesh position={[0, 3.2, 0]} material={frameMat} castShadow>
          <boxGeometry args={[5.6, 0.08, 0.08]} />
        </mesh>
        {/* Bottom Sill */}
        <mesh position={[0, 0.04, 0]} material={frameMat} castShadow>
          <boxGeometry args={[5.6, 0.08, 0.08]} />
        </mesh>
        {/* Intermediate Mullions */}
        <mesh position={[-0.93, 1.6, 0]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 3.2, 0.08]} />
        </mesh>
        <mesh position={[0.93, 1.6, 0]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 3.2, 0.08]} />
        </mesh>
        {/* End Post at X=16 */}
        <mesh position={[2.8, 1.6, 0]} material={frameMat} castShadow>
          <boxGeometry args={[0.08, 3.2, 0.08]} />
        </mesh>
        {/* Glass Panels */}
        <mesh position={[0, 1.6, 0]} material={glassMat}>
          <boxGeometry args={[5.55, 3.1, 0.02]} />
        </mesh>
        {/* Frosted Band */}
        <mesh position={[0, 1.45, 0]} material={frostedMat}>
          <boxGeometry args={[5.55, 0.45, 0.025]} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Architectural Vertical Wood Slat & Planter Divider
 * Separates workstation zone from lounge & pantry with warm natural oak slats
 */
function WoodSlatPartition({ position = [3.0, 0, 6.8] }) {
  const oakMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#9a6b41',
    roughness: 0.65,
  }), []);

  const planterMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.5,
  }), []);

  const plantLeafMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2d8659',
    roughness: 0.6,
  }), []);

  // 12 vertical wooden slats spaced evenly
  const slats = useMemo(() => Array.from({ length: 12 }, (_, i) => -2.4 + i * 0.44), []);

  return (
    <group position={position} name="wood-slat-partition">
      {/* Planter Box Base */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow material={planterMat}>
        <boxGeometry args={[5.4, 0.7, 0.32]} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.71, 0]}>
        <boxGeometry args={[5.25, 0.04, 0.26]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>

      {/* Lush Green Foliage along planter */}
      {Array.from({ length: 9 }).map((_, i) => (
        <group key={`plant-${i}`} position={[-2.2 + i * 0.55, 0.76, 0]}>
          <mesh castShadow material={plantLeafMat}>
            <sphereGeometry args={[0.13, 8, 8]} />
          </mesh>
          <mesh castShadow position={[0.04, 0.06, 0.04]} material={plantLeafMat}>
            <sphereGeometry args={[0.09, 8, 8]} />
          </mesh>
        </group>
      ))}

      {/* Top Ceiling Track */}
      <mesh position={[0, 3.2, 0]} castShadow material={oakMat}>
        <boxGeometry args={[5.4, 0.08, 0.16]} />
      </mesh>

      {/* Vertical Slats */}
      {slats.map((x, idx) => (
        <mesh key={`slat-${idx}`} position={[x, 1.95, 0]} castShadow receiveShadow material={oakMat}>
          <boxGeometry args={[0.06, 2.45, 0.12]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Expanded OfficeRoom Component (16x11 Spacious Layout)
 * Renders floor, walls, windows, architectural sekat/partitions, and zone rugs.
 */
export function OfficeRoom() {
  // Procedural sky gradient texture matching the SVG sky
  const skyTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#7cc3ff');
    grad.addColorStop(0.5, '#a3d3ff');
    grad.addColorStop(1, '#e8f5ff');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 256);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(16, 170, 70, 8);
    ctx.fillRect(40, 130, 60, 6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(20, 95, 80, 7);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  // Floor wood plank line indices (x = 1 to 15)
  const plankLines = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 1), []);

  return (
    <group name="OfficeRoom">
      {/* ===================== FLOOR (16 x 11) ===================== */}
      {/* Main Floor centered at [8.0, 0, 5.5] */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[8.0, 0, 5.5]}
        receiveShadow
      >
        <planeGeometry args={[16, 11]} />
        <meshStandardMaterial
          color="#e3b47e"
          roughness={0.78}
          metalness={0.05}
        />
      </mesh>

      {/* Wood plank divider lines */}
      {plankLines.map((x) => (
        <mesh
          key={`plank-${x}`}
          position={[x, 0.001, 5.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.018, 11]} />
          <meshBasicMaterial
            color="#8a5a2b"
            transparent
            opacity={0.16}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ===================== ZONE AREA RUGS ===================== */}
      {/* 1. Main Workstation Area modern woven rug */}
      <mesh
        position={[4.8, 0.002, 3.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[7.2, 5.4]} />
        <meshStandardMaterial
          color="#d5e1ee"
          transparent
          opacity={0.38}
          roughness={0.9}
        />
      </mesh>

      {/* 2. Glass Meeting Room Executive Rug */}
      <mesh
        position={[13.2, 0.002, 3.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[4.8, 5.0]} />
        <meshStandardMaterial
          color="#1e3a5f"
          transparent
          opacity={0.35}
          roughness={0.9}
        />
      </mesh>
      <mesh
        position={[13.2, 0.0025, 3.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[4.4, 4.6]} />
        <meshStandardMaterial
          color="#2fa7a0"
          transparent
          opacity={0.25}
          roughness={0.9}
        />
      </mesh>

      {/* 3. Breakout Lounge Area golden yellow circular rug */}
      <mesh
        position={[12.8, 0.002, 8.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[2.0, 48]} />
        <meshStandardMaterial
          color="#f2b84b"
          transparent
          opacity={0.4}
          roughness={0.9}
        />
      </mesh>

      {/* 4. Pantry & Coffee Corner tile runner */}
      <mesh
        position={[3.0, 0.002, 9.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[5.2, 2.8]} />
        <meshStandardMaterial
          color="#334155"
          transparent
          opacity={0.18}
          roughness={0.95}
        />
      </mesh>

      {/* Floor edge foundation trims for isometric cutout depth */}
      {/* Front edge along z=11 (0 to 16) */}
      <mesh position={[8.0, -0.25, 11.04]} castShadow receiveShadow>
        <boxGeometry args={[16.08, 0.5, 0.08]} />
        <meshStandardMaterial color="#b07a45" roughness={0.85} />
      </mesh>
      {/* Right edge along x=16 (0 to 11) */}
      <mesh position={[16.04, -0.25, 5.5]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.5, 11.08]} />
        <meshStandardMaterial color="#8d5d33" roughness={0.85} />
      </mesh>

      {/* ===================== WALLS ===================== */}
      {/* Back Wall: along z=0 line, x from 0 to 16, height 4, centered at [8.0, 2, -0.05] */}
      <mesh position={[8.0, 2, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[16, 4, 0.1]} />
        <meshStandardMaterial color="#f7ecd6" roughness={0.9} />
      </mesh>

      {/* Side Wall: along x=0 line, z from 0 to 11, height 4, centered at [-0.05, 2, 5.5] */}
      <mesh position={[-0.05, 2, 5.5]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 4, 11]} />
        <meshStandardMaterial color="#e6d1ad" roughness={0.9} />
      </mesh>

      {/* ===================== BASEBOARDS ===================== */}
      {/* Back wall baseboards (along z=0, length 16) */}
      <mesh position={[8.0, 0.1, 0.01]} castShadow>
        <boxGeometry args={[16, 0.2, 0.04]} />
        <meshStandardMaterial color="#cdb28a" roughness={0.8} />
      </mesh>
      <mesh position={[8.0, 0.325, 0.01]} castShadow>
        <boxGeometry args={[16, 0.25, 0.03]} />
        <meshStandardMaterial color="#3bb4ab" roughness={0.6} />
      </mesh>

      {/* Side wall baseboards (along x=0, length 11) */}
      <mesh position={[0.01, 0.1, 5.5]} castShadow>
        <boxGeometry args={[0.04, 0.2, 11]} />
        <meshStandardMaterial color="#bfa27a" roughness={0.8} />
      </mesh>
      <mesh position={[0.01, 0.325, 5.5]} castShadow>
        <boxGeometry args={[0.03, 0.25, 11]} />
        <meshStandardMaterial color="#2f9a92" roughness={0.6} />
      </mesh>

      {/* ===================== CROWN MOLDINGS ===================== */}
      <mesh position={[8.0, 3.88, 0.02]} castShadow>
        <boxGeometry args={[16, 0.14, 0.06]} />
        <meshStandardMaterial color="#e4cfa8" roughness={0.7} />
      </mesh>
      <mesh position={[0.02, 3.88, 5.5]} castShadow>
        <boxGeometry args={[0.06, 0.14, 11]} />
        <meshStandardMaterial color="#d4bb92" roughness={0.7} />
      </mesh>

      {/* ===================== WINDOWS ===================== */}
      {/* Back wall Windows */}
      <OfficeWindow
        width={2.2}
        height={2.2}
        position={[2.4, 2.35, 0.01]}
        rotation={[0, 0, 0]}
        skyTexture={skyTexture}
      />
      <OfficeWindow
        width={2.2}
        height={2.2}
        position={[6.4, 2.35, 0.01]}
        rotation={[0, 0, 0]}
        skyTexture={skyTexture}
      />
      <OfficeWindow
        width={2.2}
        height={2.2}
        position={[14.2, 2.35, 0.01]}
        rotation={[0, 0, 0]}
        skyTexture={skyTexture}
      />

      {/* Side wall Windows */}
      <OfficeWindow
        width={2.0}
        height={2.2}
        position={[0.01, 2.35, 3.0]}
        rotation={[0, Math.PI / 2, 0]}
        skyTexture={skyTexture}
      />
      <OfficeWindow
        width={2.0}
        height={2.2}
        position={[0.01, 2.35, 6.2]}
        rotation={[0, Math.PI / 2, 0]}
        skyTexture={skyTexture}
      />
      <OfficeWindow
        width={2.0}
        height={2.2}
        position={[0.01, 2.35, 9.2]}
        rotation={[0, Math.PI / 2, 0]}
        skyTexture={skyTexture}
      />

      {/* ===================== MODERN ARCHITECTURAL PARTITIONS (SEKAT) ===================== */}
      {/* 1. Glass Meeting Room Partition (Ruang Rapat Eksklusif) */}
      <GlassPartition />

      {/* 2. Natural Wood Slat & Planter Partition (Sekat Area Kerja vs Lounge/Pantry) */}
      <WoodSlatPartition position={[3.0, 0, 6.8]} />
    </group>
  );
}

export default React.memo(OfficeRoom);
