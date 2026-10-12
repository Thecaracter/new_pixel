import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  CHARACTER_DIMENSIONS,
  getCharacterBaselines,
  CHARACTER_ANIMATION_PRESETS,
} from './characterAnimations';

export {
  CHARACTER_DIMENSIONS,
  getCharacterBaselines,
  CHARACTER_ANIMATION_PRESETS,
};

/**
 * 3D Low-poly Stylized Character Component
 * Clean, calm, cute isometric aesthetic.
 */
export const Character = React.memo(function Character({
  position = [0, 0, 0],
  skinColor = '#f2c9a0',
  hairColor = '#2a2236',
  shirtColor = '#2fa7a0',
  pantsColor = '#3b4468',
  sitting = false,
  activity = 'idle',
  isWalking = true,
  lookDirection = 0,
  longHair = false,
  name,
  tip,
  prefersReducedMotion = null,
}) {
  const rootRef = useRef();
  const bodyRef = useRef();
  const headRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  const [hovered, setHovered] = useState(false);

  // Check system prefers-reduced-motion if not explicitly provided
  const reducedMotion = useMemo(() => {
    if (typeof prefersReducedMotion === 'boolean') {
      return prefersReducedMotion;
    }
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, [prefersReducedMotion]);

  // Materials with warm, stylized low-poly aesthetic
  const materials = useMemo(() => {
    return {
      skin: new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 }),
      hair: new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.7 }),
      shirt: new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.5 }),
      pants: new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.6 }),
      eye: new THREE.MeshStandardMaterial({ color: '#2b2233', roughness: 0.3 }),
      mouth: new THREE.MeshStandardMaterial({ color: '#b4504a', roughness: 0.5 }),
      phone: new THREE.MeshStandardMaterial({ color: '#1f1b2e', roughness: 0.3, metalness: 0.2 }),
      shadow: new THREE.MeshBasicMaterial({
        color: '#1b1740',
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    };
  }, [skinColor, hairColor, shirtColor, pantsColor]);

  // Dimensions & explicit positional baselines
  const {
    legHeight,
    legRadius,
    bodyHeight,
    bodyWidth,
    bodyDepth,
    armRadius,
    armHeight,
    headRadius,
  } = CHARACTER_DIMENSIONS;

  const baselines = useMemo(() => {
    return getCharacterBaselines(sitting);
  }, [sitting]);

  // Staggered timing for breathing & movement
  const animOffset = useMemo(() => {
    return (position[0] * 1.7 + position[2] * 2.3) % 10;
  }, [position]);

  // Animate via reusable animation preset registry
  useFrame((state) => {
    const t = reducedMotion ? 0 : state.clock.getElapsedTime() + animOffset;

    // Reset default baselines
    if (bodyRef.current) {
      bodyRef.current.position.set(0, baselines.bodyCenterY, 0);
      bodyRef.current.rotation.set(0, 0, 0);
      bodyRef.current.scale.set(1, 1, 1);
    }
    if (headRef.current) {
      headRef.current.position.set(0, baselines.headCenterY, 0);
      headRef.current.rotation.set(0, 0, 0);
    }
    if (leftArmRef.current) {
      leftArmRef.current.position.set(-bodyWidth / 2 - armRadius, baselines.shoulderY, 0);
      leftArmRef.current.rotation.set(0, 0, 0.04);
    }
    if (rightArmRef.current) {
      rightArmRef.current.position.set(bodyWidth / 2 + armRadius, baselines.shoulderY, 0);
      rightArmRef.current.rotation.set(0, 0, -0.04);
    }
    if (leftLegRef.current) {
      leftLegRef.current.rotation.set(0, 0, 0);
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.set(0, 0, 0);
    }

    const preset = CHARACTER_ANIMATION_PRESETS[activity] || CHARACTER_ANIMATION_PRESETS.idle;
    preset({
      t,
      sitting,
      isWalking,
      baselines,
      refs: {
        body: bodyRef.current,
        head: headRef.current,
        leftArm: leftArmRef.current,
        rightArm: rightArmRef.current,
        leftLeg: leftLegRef.current,
        rightLeg: rightLegRef.current,
      },
      reducedMotion,
    });
  });

  return (
    <group
      ref={rootRef}
      position={position}
      rotation={[0, lookDirection, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Ground Shadow */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        material={materials.shadow}
      >
        <circleGeometry args={[sitting ? 0.38 : 0.32, 24]} />
      </mesh>

      {/* Legs */}
      {!sitting ? (
        // Standing legs
        <>
          <group ref={leftLegRef} position={[-0.14, baselines.hipY, 0]}>
            <mesh
              castShadow
              receiveShadow
              position={[0, -legHeight / 2, 0]}
              material={materials.pants}
            >
              <cylinderGeometry args={[legRadius, legRadius * 0.9, legHeight, 16]} />
            </mesh>
            {/* Foot */}
            <mesh
              castShadow
              position={[0, -legHeight + 0.03, 0.05]}
              material={materials.pants}
            >
              <boxGeometry args={[legRadius * 1.8, 0.06, 0.16]} />
            </mesh>
          </group>

          <group ref={rightLegRef} position={[0.14, baselines.hipY, 0]}>
            <mesh
              castShadow
              receiveShadow
              position={[0, -legHeight / 2, 0]}
              material={materials.pants}
            >
              <cylinderGeometry args={[legRadius, legRadius * 0.9, legHeight, 16]} />
            </mesh>
            {/* Foot */}
            <mesh
              castShadow
              position={[0, -legHeight + 0.03, 0.05]}
              material={materials.pants}
            >
              <boxGeometry args={[legRadius * 1.8, 0.06, 0.16]} />
            </mesh>
          </group>
        </>
      ) : (
        // Sitting legs (bent: thighs forward + calves down to floor)
        <group position={[0, baselines.hipY, 0]}>
          {/* Thighs extending forward along local +Z */}
          <mesh
            castShadow
            receiveShadow
            position={[-0.13, -0.02, 0.17]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.pants}
          >
            <cylinderGeometry args={[legRadius, legRadius, 0.34, 16]} />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            position={[0.13, -0.02, 0.17]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.pants}
          >
            <cylinderGeometry args={[legRadius, legRadius, 0.34, 16]} />
          </mesh>

          {/* Calves descending from knees at Z=0.32 down to ankles */}
          <mesh
            castShadow
            receiveShadow
            position={[-0.13, -0.23, 0.32]}
            material={materials.pants}
          >
            <cylinderGeometry args={[legRadius, legRadius * 0.9, 0.38, 16]} />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            position={[0.13, -0.23, 0.32]}
            material={materials.pants}
          >
            <cylinderGeometry args={[legRadius, legRadius * 0.9, 0.38, 16]} />
          </mesh>

          {/* Feet flat on the floor at Y=0 */}
          <mesh
            castShadow
            position={[-0.13, -0.45, 0.36]}
            material={materials.pants}
          >
            <boxGeometry args={[legRadius * 1.8, 0.06, 0.16]} />
          </mesh>
          <mesh
            castShadow
            position={[0.13, -0.45, 0.36]}
            material={materials.pants}
          >
            <boxGeometry args={[legRadius * 1.8, 0.06, 0.16]} />
          </mesh>
        </group>
      )}

      {/* Body / Torso */}
      <group ref={bodyRef} position={[0, baselines.bodyCenterY, 0]}>
        <mesh castShadow receiveShadow material={materials.shirt}>
          <boxGeometry args={[bodyWidth, bodyHeight, bodyDepth]} />
        </mesh>
      </group>

      {/* Left Arm */}
      <group
        ref={leftArmRef}
        position={[-bodyWidth / 2 - armRadius, baselines.shoulderY, 0]}
      >
        <mesh
          castShadow
          receiveShadow
          position={[0, -armHeight / 2, 0]}
          material={materials.shirt}
        >
          <cylinderGeometry args={[armRadius, armRadius * 0.9, armHeight, 16]} />
        </mesh>
        {/* Hand */}
        <mesh
          castShadow
          position={[0, -armHeight - 0.03, 0]}
          material={materials.skin}
        >
          <sphereGeometry args={[armRadius * 0.95, 12, 12]} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group
        ref={rightArmRef}
        position={[bodyWidth / 2 + armRadius, baselines.shoulderY, 0]}
      >
        <mesh
          castShadow
          receiveShadow
          position={[0, -armHeight / 2, 0]}
          material={materials.shirt}
        >
          <cylinderGeometry args={[armRadius, armRadius * 0.9, armHeight, 16]} />
        </mesh>
        {/* Hand */}
        <mesh
          castShadow
          position={[0, -armHeight - 0.03, 0]}
          material={materials.skin}
        >
          <sphereGeometry args={[armRadius * 0.95, 12, 12]} />
        </mesh>
        {/* Phone held in hand if phone activity */}
        {activity === 'phone' && (
          <mesh
            castShadow
            position={[0, -armHeight - 0.03, 0.06]}
            rotation={[0, 0, 0]}
            material={materials.phone}
          >
            <boxGeometry args={[0.08, 0.14, 0.02]} />
          </mesh>
        )}
        {/* Document clipboard held in hand if walker activity */}
        {activity === 'walking' && (
          <mesh
            castShadow
            position={[0, -armHeight - 0.04, 0.1]}
            rotation={[0.3, 0, 0]}
          >
            <boxGeometry args={[0.2, 0.28, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        )}
      </group>

      {/* Head Group */}
      <group ref={headRef} position={[0, baselines.headCenterY, 0]}>
        {/* Head Sphere */}
        <mesh castShadow receiveShadow material={materials.skin}>
          <sphereGeometry args={[headRadius, 24, 24]} />
        </mesh>

        {/* Hair */}
        <group>
          <mesh
            castShadow
            position={[0, headRadius * 0.25, -headRadius * 0.15]}
            material={materials.hair}
          >
            <sphereGeometry args={[headRadius * 1.05, 20, 20]} />
          </mesh>
          <mesh
            castShadow
            position={[0, 0.09, 0.12]}
            rotation={[-0.4, 0, 0]}
            material={materials.hair}
          >
            <boxGeometry args={[headRadius * 1.6, 0.08, 0.12]} />
          </mesh>
          {longHair && (
            <mesh
              castShadow
              position={[0, -0.22, -0.1]}
              material={materials.hair}
            >
              <boxGeometry args={[headRadius * 1.7, 0.44, 0.14]} />
            </mesh>
          )}
        </group>

        {/* Eyes: Two tiny dark spheres */}
        <mesh
          position={[-0.075, 0.02, headRadius * 0.92]}
          material={materials.eye}
        >
          <sphereGeometry args={[0.026, 8, 8]} />
        </mesh>
        <mesh
          position={[0.075, 0.02, headRadius * 0.92]}
          material={materials.eye}
        >
          <sphereGeometry args={[0.026, 8, 8]} />
        </mesh>

        {/* Smile / Mouth */}
        <mesh
          position={[0, -0.07, headRadius * 0.93]}
          material={materials.mouth}
        >
          <boxGeometry args={[0.06, 0.015, 0.01]} />
        </mesh>
      </group>

      {/* Tooltip on hover */}
      {hovered && (name || tip) && (
        <Html
          position={[0, baselines.headCenterY + headRadius + 0.4, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: '#2b2750',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              lineHeight: '1.3',
              boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
              whiteSpace: 'nowrap',
              fontFamily: "'Nunito', sans-serif",
              textAlign: 'center',
            }}
          >
            {name && (
              <div style={{ fontWeight: 800, color: '#ffe27a', marginBottom: '2px' }}>
                {name}
              </div>
            )}
            {tip && <div style={{ color: '#e8f0fe', fontSize: '11px', opacity: 0.9 }}>{tip}</div>}
          </div>
        </Html>
      )}
    </group>
  );
});

Character.displayName = 'Character';
export default Character;
