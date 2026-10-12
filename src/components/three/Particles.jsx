import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Sunbeam dust motes gently hovering near windows
 */
function DustMotes({ count = 60 }) {
  const pointsRef = useRef();

  const [basePositions, phases] = useMemo(() => {
    const base = new Float32Array(count * 3);
    const ph = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Clustered near sunlight windows
      base[i * 3 + 0] = 0.5 + Math.random() * 5.5;
      base[i * 3 + 1] = 1.2 + Math.random() * 2.2;
      base[i * 3 + 2] = 0.5 + Math.random() * 5.5;

      ph[i * 3 + 0] = Math.random() * Math.PI * 2;
      ph[i * 3 + 1] = Math.random() * Math.PI * 2;
      ph[i * 3 + 2] = Math.random() * Math.PI * 2;
    }

    return [base, ph];
  }, [count]);

  const currentPositions = useMemo(() => new Float32Array(basePositions), [basePositions]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const array = posAttr.array;
    const t = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Soft hovering in place, no crazy drifting or teleporting
      array[idx + 0] = basePositions[idx + 0] + Math.sin(t * 0.6 + phases[idx + 0]) * 0.12;
      array[idx + 1] = basePositions[idx + 1] + Math.cos(t * 0.45 + phases[idx + 1]) * 0.08;
      array[idx + 2] = basePositions[idx + 2] + Math.sin(t * 0.5 + phases[idx + 2]) * 0.12;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={currentPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#fff9ea"
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Rising gentle steam from coffee mugs
 */
function MugSteam({ position }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.children.forEach((mesh, i) => {
      const progress = ((t * 0.5 + i * 0.33) % 1);
      mesh.position.y = progress * 0.28;
      mesh.position.x = Math.sin(progress * Math.PI * 2 + i) * 0.02;
      mesh.scale.setScalar(0.012 + progress * 0.02);
      mesh.material.opacity = (1 - progress) * 0.4;
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0, 0]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Particles() {
  return (
    <group name="office-particles">
      <DustMotes count={60} />
      <MugSteam position={[2.3 - 0.6, 0.98, 2.2 + 0.15]} />
      <MugSteam position={[5.8 - 0.6, 0.98, 2.2 + 0.15]} />
      <MugSteam position={[9.4 + 0.45, 1.02, 4.1 - 0.3]} />
    </group>
  );
}

export default Particles;
