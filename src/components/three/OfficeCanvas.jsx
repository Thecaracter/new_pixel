import React, { Suspense, useLayoutEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

import { OfficeRoom } from './OfficeRoom';
import { Furniture } from './Furniture';
import { Characters } from './Characters';
import { CatMochi } from './CatMochi';
import { Particles } from './Particles';

/**
 * Camera aligner: guarantees camera points exactly at room center [6.0, 2.0, 4.5]
 * from isometric angle [22, 16, 20.5].
 */
function CameraAligner() {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(22, 16, 20.5);
    camera.lookAt(6.0, 2.0, 4.5);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

/**
 * Pure 3D Isometric Office Canvas
 * Completely stable, perfectly centered, no wall clipping, no scroll hijacking.
 */
export function OfficeCanvas({ teamMembers = [] }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '75vh',
        minHeight: '520px',
        maxHeight: '760px',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(27, 23, 64, 0.35)',
        background: '#241d47',
      }}
    >
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#241d47']} />

          {/* Exact Isometric Camera framing all room corners */}
          <OrthographicCamera
            makeDefault
            position={[22, 16, 20.5]}
            near={0.1}
            far={100}
            left={-9.5}
            right={9.5}
            top={7.2}
            bottom={-7.2}
          />
          <CameraAligner />

          {/* Ambient Room Light */}
          <ambientLight color="#fff8ee" intensity={0.95} />

          {/* Sunlight directional lamp from window direction */}
          <directionalLight
            position={[18, 24, 14]}
            color="#fff3dc"
            intensity={1.8}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
            shadow-bias={-0.0004}
          />

          {/* Soft fill light */}
          <directionalLight
            position={[-8, 12, -6]}
            color="#a8c8fc"
            intensity={0.4}
          />

          {/* Warm center point light */}
          <pointLight
            position={[6, 3.2, 4.5]}
            color="#ffe2b8"
            intensity={0.5}
            distance={16}
          />

          {/* 3D Scene Components */}
          <group name="office-root">
            <OfficeRoom />
            <Furniture />
            <Characters teamMembers={teamMembers} />
            <CatMochi />
            <Particles />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default OfficeCanvas;
