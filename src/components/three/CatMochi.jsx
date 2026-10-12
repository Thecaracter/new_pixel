import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * CatMochi Component
 * The office cat sleeping peacefully on the floor at ~[3.1, 0, 3.9].
 *
 * Visual specifications:
 * - Body: Stretched ellipsoid (scaleX: 1.2, scaleY: 0.6, scaleZ: 0.8), color #f2b84b
 * - Head: Sphere attached to body side, color #f2b84b, radius 0.15
 * - Ears: Two small cones/triangles on head, same color
 * - Tail: Curved cylinder, color #f2b84b with darker stripe #e29a2a
 * - Closed eyes: Sleeping curve detail
 * - Animation: Subtle breathing (scaleY oscillation, 3s period)
 * - Floating 'z' text above using drei's <Html> or <Text>, animated floating up
 * - Shadow ellipse beneath
 * - Tooltip data: 'Mochi | Kucing kantor, lagi tidur siang'
 */
export const CatMochi = React.memo(function CatMochi({ position = [3.1, 0, 3.9] }) {
  const rootRef = useRef();
  const bodyRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Materials
  const materials = useMemo(() => {
    return {
      fur: new THREE.MeshStandardMaterial({
        color: '#f2b84b',
        roughness: 0.7,
      }),
      tailStripe: new THREE.MeshStandardMaterial({
        color: '#e29a2a',
        roughness: 0.7,
      }),
      earInner: new THREE.MeshStandardMaterial({
        color: '#f9d29b',
        roughness: 0.8,
      }),
      eyeLine: new THREE.MeshBasicMaterial({
        color: '#5a3b1a',
      }),
      shadow: new THREE.MeshBasicMaterial({
        color: '#1b1740',
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    };
  }, []);

  // Animation: gentle slow breathing
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (bodyRef.current) {
      const breath = 1 + Math.sin(t * 1.6) * 0.035;
      bodyRef.current.scale.y = 0.6 * breath;
    }
  });

  return (
    <group
      ref={rootRef}
      position={position}
      rotation={[0, -0.4, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      {/* Ground Shadow */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        material={materials.shadow}
      >
        <circleGeometry args={[0.32, 24]} />
      </mesh>

      {/* Sleeping Cat Body: Stretched ellipsoid (scaleX: 1.2, scaleY: 0.6, scaleZ: 0.8) */}
      <mesh
        ref={bodyRef}
        castShadow
        receiveShadow
        position={[0, 0.14, 0]}
        scale={[1.2, 0.6, 0.8]}
        material={materials.fur}
      >
        <sphereGeometry args={[0.22, 24, 24]} />
      </mesh>

      {/* Cat Head: Sphere attached to body side, radius 0.15 */}
      <group position={[-0.22, 0.16, 0.05]}>
        <mesh castShadow receiveShadow material={materials.fur}>
          <sphereGeometry args={[0.15, 20, 20]} />
        </mesh>

        {/* Ears: Two small cones on head */}
        <mesh
          castShadow
          position={[-0.04, 0.13, 0.07]}
          rotation={[0.1, 0.2, 0.3]}
          material={materials.fur}
        >
          <coneGeometry args={[0.045, 0.09, 8]} />
        </mesh>
        <mesh
          castShadow
          position={[-0.04, 0.13, -0.07]}
          rotation={[-0.1, -0.2, 0.3]}
          material={materials.fur}
        >
          <coneGeometry args={[0.045, 0.09, 8]} />
        </mesh>

        {/* Inner ear accents */}
        <mesh
          position={[-0.035, 0.125, 0.065]}
          rotation={[0.1, 0.2, 0.3]}
          material={materials.earInner}
        >
          <coneGeometry args={[0.025, 0.06, 6]} />
        </mesh>
        <mesh
          position={[-0.035, 0.125, -0.065]}
          rotation={[-0.1, -0.2, 0.3]}
          material={materials.earInner}
        >
          <coneGeometry args={[0.025, 0.06, 6]} />
        </mesh>

        {/* Closed sleeping eyes (tiny subtle curved lines/cubes) */}
        <mesh
          position={[-0.135, 0.01, 0.045]}
          rotation={[0, 0, 0.15]}
          material={materials.eyeLine}
        >
          <boxGeometry args={[0.01, 0.015, 0.035]} />
        </mesh>
        <mesh
          position={[-0.135, 0.01, -0.045]}
          rotation={[0, 0, 0.15]}
          material={materials.eyeLine}
        >
          <boxGeometry args={[0.01, 0.015, 0.035]} />
        </mesh>
      </group>

      {/* Tail: Curved cylinder curled around the body */}
      <group position={[0.2, 0.08, -0.05]} rotation={[0.2, 0.4, -0.2]}>
        {/* Main tail body */}
        <mesh
          castShadow
          position={[0.07, 0.02, 0.08]}
          rotation={[Math.PI / 2.3, 0.2, -0.4]}
          material={materials.fur}
        >
          <cylinderGeometry args={[0.035, 0.045, 0.22, 12]} />
        </mesh>
        {/* Tail tip with darker stripe #e29a2a */}
        <mesh
          castShadow
          position={[0.11, 0.04, 0.19]}
          rotation={[Math.PI / 2.1, 0.4, -0.6]}
          material={materials.tailStripe}
        >
          <cylinderGeometry args={[0.025, 0.035, 0.12, 12]} />
        </mesh>
      </group>

      {/* Floating 'z' sleep text */}
      <Html
        position={[-0.1, 0.35, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            color: '#ffd76a',
            fontWeight: 800,
            fontSize: '13px',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            fontFamily: "'Nunito', system-ui, sans-serif",
            userSelect: 'none',
            opacity: 0.85,
          }}
        >
          zZz
        </div>
      </Html>

      {/* Tooltip on hover: Mochi | Kucing kantor, lagi tidur siang */}
      {hovered && (
        <Html
          position={[0, 0.55, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(27, 23, 64, 0.92)',
              color: '#ffffff',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              lineHeight: '1.3',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.15)',
              whiteSpace: 'nowrap',
              fontFamily: 'Inter, system-ui, sans-serif',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 700, color: '#f2b84b', marginBottom: '2px' }}>
              Mochi
            </div>
            <div style={{ color: '#e8f0fe', fontSize: '11px' }}>
              Kucing kantor, lagi tidur siang
            </div>
          </div>
        </Html>
      )}
    </group>
  );
});

CatMochi.displayName = 'CatMochi';
export default CatMochi;
