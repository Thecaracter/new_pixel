import React, { Suspense, useLayoutEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { OfficeRoom } from './OfficeRoom';
import { Furniture } from './Furniture';
import { Characters } from './Characters';
import { CatMochi } from './CatMochi';
import { Particles } from './Particles';

/**
 * Camera aligner: guarantees camera points exactly at room center [8.0, 2.0, 5.5]
 * from isometric angle [26, 20, 23.5].
 */
function CameraAligner() {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(26, 20, 23.5);
    camera.lookAt(8.0, 2.0, 5.5);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

/**
 * Pure 3D Isometric Office Canvas (Expanded & Partitioned Layout)
 * Features distinct zones: Workstation Wing, Glass Meeting Room, Breakout Lounge, and Pantry.
 * Includes OrbitControls for smooth panning, zooming, and rotating across the spacious office.
 */
export function OfficeCanvas({ teamMembers = [] }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '75vh',
        minHeight: '540px',
        maxHeight: '780px',
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

          {/* Isometric Orthographic Camera framing the spacious 16x11 office */}
          <OrthographicCamera
            makeDefault
            position={[26, 20, 23.5]}
            near={0.1}
            far={120}
            left={-11.8}
            right={11.8}
            top={8.8}
            bottom={-8.8}
            zoom={1}
          />
          <CameraAligner />

          {/* Interactive controls: Smooth zoom & orbit rotation to explore all zones */}
          <OrbitControls
            target={[8.0, 1.8, 5.5]}
            enableDamping={true}
            dampingFactor={0.08}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 6}
            minZoom={0.65}
            maxZoom={2.4}
            enablePan={true}
          />

          {/* Ambient Room Light */}
          <ambientLight color="#fff8ee" intensity={0.92} />

          {/* Sunlight directional lamp from window direction */}
          <directionalLight
            position={[22, 28, 16]}
            color="#fff3dc"
            intensity={1.85}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={60}
            shadow-camera-left={-14}
            shadow-camera-right={14}
            shadow-camera-top={14}
            shadow-camera-bottom={-14}
            shadow-bias={-0.0004}
          />

          {/* Soft fill light */}
          <directionalLight
            position={[-10, 14, -8]}
            color="#a8c8fc"
            intensity={0.42}
          />

          {/* Warm center point light */}
          <pointLight
            position={[8.0, 3.4, 5.5]}
            color="#ffe2b8"
            intensity={0.5}
            distance={22}
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
