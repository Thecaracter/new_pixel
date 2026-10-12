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
 * OfficeRoom component
 * Renders the room floor, walls, moldings, baseboards, floor trims, rugs, and windows.
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

    // Stylized soft cloud bands from isometric art style
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

  // Floor wood plank line indices (x = 1 to 11)
  const plankLines = useMemo(() => Array.from({ length: 11 }, (_, i) => i + 1), []);

  return (
    <group name="OfficeRoom">
      {/* ===================== FLOOR ===================== */}
      {/* Main Floor (12x9) centered at [6, 0, 4.5] */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[6, 0, 4.5]}
        receiveShadow
      >
        <planeGeometry args={[12, 9]} />
        <meshStandardMaterial
          color="#e3b47e"
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      {/* Wood plank divider lines */}
      {plankLines.map((x) => (
        <mesh
          key={`plank-${x}`}
          position={[x, 0.001, 4.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.018, 9]} />
          <meshBasicMaterial
            color="#8a5a2b"
            transparent
            opacity={0.16}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Decorative stylized area rugs matching SVG palette */}
      {/* 1. Meeting Area teal rug */}
      <mesh
        position={[9.4, 0.002, 4.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[2.4, 48]} />
        <meshStandardMaterial
          color="#2fa7a0"
          transparent
          opacity={0.35}
          roughness={0.9}
        />
      </mesh>
      <mesh
        position={[9.4, 0.0025, 4.1]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[2.0, 48]} />
        <meshStandardMaterial
          color="#f6efe0"
          transparent
          opacity={0.25}
          roughness={0.9}
        />
      </mesh>

      {/* 2. Desk area lavender rug */}
      <mesh
        position={[2.6, 0.002, 3.6]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[2.1, 48]} />
        <meshStandardMaterial
          color="#d9c6f2"
          transparent
          opacity={0.4}
          roughness={0.9}
        />
      </mesh>

      {/* 3. Lounge area golden yellow rug */}
      <mesh
        position={[10.0, 0.002, 7.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[1.8, 48]} />
        <meshStandardMaterial
          color="#f2b84b"
          transparent
          opacity={0.35}
          roughness={0.9}
        />
      </mesh>

      {/* Floor edge / foundation trims for isometric cutout depth */}
      {/* Front edge along z=9 (0 to 12) */}
      <mesh position={[6, -0.25, 9.04]} castShadow receiveShadow>
        <boxGeometry args={[12.08, 0.5, 0.08]} />
        <meshStandardMaterial color="#b07a45" roughness={0.85} />
      </mesh>
      {/* Right edge along x=12 (0 to 9) */}
      <mesh position={[12.04, -0.25, 4.5]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.5, 9.08]} />
        <meshStandardMaterial color="#8d5d33" roughness={0.85} />
      </mesh>

      {/* ===================== WALLS ===================== */}
      {/* Back Wall: along z=0 line, x from 0 to 12, height 4, centered at [6, 2, -0.05] */}
      <mesh position={[6, 2, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[12, 4, 0.1]} />
        <meshStandardMaterial color="#f7ecd6" roughness={0.9} />
      </mesh>

      {/* Side Wall: along x=0 line, z from 0 to 9, height 4, centered at [-0.05, 2, 4.5] */}
      <mesh position={[-0.05, 2, 4.5]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 4, 9]} />
        <meshStandardMaterial color="#e6d1ad" roughness={0.9} />
      </mesh>

      {/* ===================== BASEBOARDS ===================== */}
      {/* Back wall baseboards (along z=0) */}
      {/* Bottom wood strip */}
      <mesh position={[6, 0.1, 0.01]} castShadow>
        <boxGeometry args={[12, 0.2, 0.04]} />
        <meshStandardMaterial color="#cdb28a" roughness={0.8} />
      </mesh>
      {/* Teal accent strip */}
      <mesh position={[6, 0.325, 0.01]} castShadow>
        <boxGeometry args={[12, 0.25, 0.03]} />
        <meshStandardMaterial color="#3bb4ab" roughness={0.6} />
      </mesh>

      {/* Side wall baseboards (along x=0) */}
      {/* Bottom wood strip */}
      <mesh position={[0.01, 0.1, 4.5]} castShadow>
        <boxGeometry args={[0.04, 0.2, 9]} />
        <meshStandardMaterial color="#bfa27a" roughness={0.8} />
      </mesh>
      {/* Teal accent strip */}
      <mesh position={[0.01, 0.325, 4.5]} castShadow>
        <boxGeometry args={[0.03, 0.25, 9]} />
        <meshStandardMaterial color="#2f9a92" roughness={0.6} />
      </mesh>

      {/* ===================== CROWN MOLDINGS ===================== */}
      {/* Back wall crown molding */}
      <mesh position={[6, 3.88, 0.02]} castShadow>
        <boxGeometry args={[12, 0.14, 0.06]} />
        <meshStandardMaterial color="#e4cfa8" roughness={0.7} />
      </mesh>

      {/* Side wall crown molding */}
      <mesh position={[0.02, 3.88, 4.5]} castShadow>
        <boxGeometry args={[0.06, 0.14, 9]} />
        <meshStandardMaterial color="#d4bb92" roughness={0.7} />
      </mesh>

      {/* ===================== WINDOWS ===================== */}
      {/* Back wall: Window 1 (x: 0.8 - 2.8, center 1.8, y: 2.3) */}
      <OfficeWindow
        width={2.0}
        height={2.2}
        position={[1.8, 2.35, 0.01]}
        rotation={[0, 0, 0]}
        skyTexture={skyTexture}
      />

      {/* Back wall: Window 2 (x: 3.4 - 5.4, center 4.4, y: 2.3) */}
      <OfficeWindow
        width={2.0}
        height={2.2}
        position={[4.4, 2.35, 0.01]}
        rotation={[0, 0, 0]}
        skyTexture={skyTexture}
      />

      {/* Side wall: Window 3 (z: 2.2 - 4.0, center 3.1, y: 2.3) */}
      <OfficeWindow
        width={1.8}
        height={2.2}
        position={[0.01, 2.35, 3.1]}
        rotation={[0, Math.PI / 2, 0]}
        skyTexture={skyTexture}
      />

      {/* Side wall: Window 4 (z: 4.8 - 6.6, center 5.7, y: 2.3) */}
      <OfficeWindow
        width={1.8}
        height={2.2}
        position={[0.01, 2.35, 5.7]}
        rotation={[0, Math.PI / 2, 0]}
        skyTexture={skyTexture}
      />
    </group>
  );
}

export default React.memo(OfficeRoom);
