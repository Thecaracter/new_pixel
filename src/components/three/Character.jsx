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
 * Hair Style Components for Stylized Characters
 * Replaces sharp boxy blocks with smooth, rounded, layered geometries.
 */
function HairStyle({ style = 'short', hairColor = '#2a2236', headRadius = 0.22, longHair = false }) {
  const hairMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.6,
      metalness: 0.05,
    });
  }, [hairColor]);

  const bandMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#f43f5e',
      roughness: 0.4,
    });
  }, []);

  return (
    <group name="stylized-hair">
      {/* 1. Base hair dome covering top and back of head */}
      <mesh
        castShadow
        position={[0, headRadius * 0.2, -headRadius * 0.12]}
        material={hairMat}
      >
        <sphereGeometry args={[headRadius * 1.05, 24, 20]} />
      </mesh>

      {/* 2. Style-specific bangs, curls, buns, and flowing hair */}
      {style === 'bob' || (longHair && style === 'short') ? (
        // Neat bob style (curved side locks framing face + rounded bangs)
        <group>
          {/* Front rounded fringe */}
          <mesh castShadow position={[0, headRadius * 0.65, headRadius * 0.72]} rotation={[-0.2, 0, 0]} material={hairMat}>
            <capsuleGeometry args={[0.07, 0.16, 4, 12]} />
          </mesh>
          {/* Left side lock */}
          <mesh castShadow position={[-headRadius * 0.85, -0.05, headRadius * 0.2]} rotation={[0, 0, -0.1]} material={hairMat}>
            <capsuleGeometry args={[0.065, 0.26, 4, 12]} />
          </mesh>
          {/* Right side lock */}
          <mesh castShadow position={[headRadius * 0.85, -0.05, headRadius * 0.2]} rotation={[0, 0, 0.1]} material={hairMat}>
            <capsuleGeometry args={[0.065, 0.26, 4, 12]} />
          </mesh>
          {/* Back nape */}
          <mesh castShadow position={[0, -0.1, -headRadius * 0.5]} material={hairMat}>
            <capsuleGeometry args={[0.11, 0.18, 4, 12]} />
          </mesh>
        </group>
      ) : style === 'ponytail' || style === 'bun' ? (
        // Cute high ponytail / bun with hair scrunchie
        <group>
          {/* Front side-swept bangs */}
          <mesh castShadow position={[-0.04, headRadius * 0.68, headRadius * 0.74]} rotation={[-0.25, 0.15, -0.2]} material={hairMat}>
            <capsuleGeometry args={[0.06, 0.14, 4, 12]} />
          </mesh>
          <mesh castShadow position={[0.07, headRadius * 0.66, headRadius * 0.72]} rotation={[-0.25, -0.15, 0.2]} material={hairMat}>
            <capsuleGeometry args={[0.055, 0.12, 4, 12]} />
          </mesh>
          {/* Hair scrunchie/tie */}
          <mesh castShadow position={[0, headRadius * 0.7, -headRadius * 0.88]} rotation={[0.4, 0, 0]} material={bandMat}>
            <torusGeometry args={[0.05, 0.02, 8, 16]} />
          </mesh>
          {/* Ponytail tuft */}
          <mesh castShadow position={[0, headRadius * 0.5, -headRadius * 1.2]} rotation={[0.5, 0, 0]} material={hairMat}>
            <capsuleGeometry args={[0.075, 0.2, 4, 14]} />
          </mesh>
          {/* Soft side strands */}
          <mesh castShadow position={[-headRadius * 0.85, -0.02, headRadius * 0.2]} material={hairMat}>
            <capsuleGeometry args={[0.04, 0.16, 4, 10]} />
          </mesh>
          <mesh castShadow position={[headRadius * 0.85, -0.02, headRadius * 0.2]} material={hairMat}>
            <capsuleGeometry args={[0.04, 0.16, 4, 10]} />
          </mesh>
        </group>
      ) : style === 'long' ? (
        // Long flowing wavy hair
        <group>
          {/* Side-parted curved bangs */}
          <mesh castShadow position={[-0.05, headRadius * 0.68, headRadius * 0.72]} rotation={[-0.2, 0.1, -0.15]} material={hairMat}>
            <capsuleGeometry args={[0.065, 0.15, 4, 12]} />
          </mesh>
          <mesh castShadow position={[0.07, headRadius * 0.65, headRadius * 0.7]} rotation={[-0.2, -0.1, 0.15]} material={hairMat}>
            <capsuleGeometry args={[0.055, 0.13, 4, 12]} />
          </mesh>
          {/* Flowing side locks */}
          <mesh castShadow position={[-headRadius * 0.82, -0.16, headRadius * 0.1]} rotation={[0, 0, -0.08]} material={hairMat}>
            <capsuleGeometry args={[0.075, 0.36, 4, 12]} />
          </mesh>
          <mesh castShadow position={[headRadius * 0.82, -0.16, headRadius * 0.1]} rotation={[0, 0, 0.08]} material={hairMat}>
            <capsuleGeometry args={[0.075, 0.36, 4, 12]} />
          </mesh>
          {/* Flowing back hair */}
          <mesh castShadow position={[0, -0.18, -headRadius * 0.65]} rotation={[-0.05, 0, 0]} material={hairMat}>
            <capsuleGeometry args={[0.13, 0.38, 4, 14]} />
          </mesh>
        </group>
      ) : style === 'curly' ? (
        // Stylish textured / curly hair (Dimas style)
        <group>
          <mesh castShadow position={[0, headRadius * 0.82, 0]} material={hairMat}>
            <sphereGeometry args={[0.13, 14, 14]} />
          </mesh>
          <mesh castShadow position={[-0.09, headRadius * 0.75, headRadius * 0.35]} material={hairMat}>
            <sphereGeometry args={[0.09, 12, 12]} />
          </mesh>
          <mesh castShadow position={[0.09, headRadius * 0.75, headRadius * 0.35]} material={hairMat}>
            <sphereGeometry args={[0.09, 12, 12]} />
          </mesh>
          <mesh castShadow position={[-0.14, headRadius * 0.45, headRadius * 0.35]} material={hairMat}>
            <sphereGeometry args={[0.085, 12, 12]} />
          </mesh>
          <mesh castShadow position={[0.14, headRadius * 0.45, headRadius * 0.35]} material={hairMat}>
            <sphereGeometry args={[0.085, 12, 12]} />
          </mesh>
          <mesh castShadow position={[0, headRadius * 0.6, headRadius * 0.62]} material={hairMat}>
            <sphereGeometry args={[0.08, 12, 12]} />
          </mesh>
        </group>
      ) : (
        // Modern short / styled crop (Arif, Bayu, Eko)
        <group>
          {/* Front swept stylized bangs */}
          <mesh castShadow position={[-0.04, headRadius * 0.7, headRadius * 0.68]} rotation={[-0.3, 0.15, -0.2]} material={hairMat}>
            <capsuleGeometry args={[0.065, 0.14, 4, 12]} />
          </mesh>
          <mesh castShadow position={[0.06, headRadius * 0.68, headRadius * 0.65]} rotation={[-0.3, -0.1, 0.15]} material={hairMat}>
            <capsuleGeometry args={[0.055, 0.12, 4, 12]} />
          </mesh>
          {/* Top subtle volume */}
          <mesh castShadow position={[0, headRadius * 0.8, -0.02]} material={hairMat}>
            <sphereGeometry args={[0.11, 14, 14]} />
          </mesh>
          {/* Sideburns */}
          <mesh castShadow position={[-headRadius * 0.88, 0.02, 0.08]} material={hairMat}>
            <capsuleGeometry args={[0.035, 0.12, 4, 8]} />
          </mesh>
          <mesh castShadow position={[headRadius * 0.88, 0.02, 0.08]} material={hairMat}>
            <capsuleGeometry args={[0.035, 0.12, 4, 8]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/**
 * 3D Stylized Chibi Character Component
 * Upgraded from flat boxy primitives to smooth rounded meshes,
 * sculpted hair, cute expressive faces with eye sparkles,
 * blush cheeks, office ID lanyard, and stylish rounded sneakers.
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
  hairStyle = null,
  glasses = false,
  hasLanyard = true,
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

  // Check system prefers-reduced-motion
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

  // Determine hairstyle and accessories from name if not explicitly set
  const resolvedHairStyle = useMemo(() => {
    if (hairStyle) return hairStyle;
    const n = (name || '').toLowerCase();
    if (n.includes('rina')) return 'bob';
    if (n.includes('mira')) return 'ponytail';
    if (n.includes('sinta')) return 'long';
    if (n.includes('dimas')) return 'curly';
    if (longHair) return 'long';
    return 'short';
  }, [hairStyle, name, longHair]);

  const resolvedGlasses = useMemo(() => {
    if (typeof glasses === 'boolean') return glasses;
    const n = (name || '').toLowerCase();
    return n.includes('rina') || n.includes('arif');
  }, [glasses, name]);

  // High-quality materials with warm stylized palette
  const materials = useMemo(() => {
    return {
      skin: new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.55 }),
      hair: new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.6 }),
      shirt: new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.45 }),
      pants: new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.55 }),
      collar: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 }),
      lanyard: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 }),
      idBadge: new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.3 }),
      glasses: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.25, metalness: 0.2 }),
      eye: new THREE.MeshStandardMaterial({ color: '#181124', roughness: 0.2 }),
      eyeHighlight: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      eyebrow: new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8 }),
      blush: new THREE.MeshBasicMaterial({ color: '#fb7185', transparent: true, opacity: 0.45, depthWrite: false }),
      mouth: new THREE.MeshStandardMaterial({ color: '#be123c', roughness: 0.5 }),
      shoeSole: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 }),
      shoeAccent: new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.45 }),
      phone: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.2, metalness: 0.4 }),
      phoneScreen: new THREE.MeshBasicMaterial({ color: '#67e8f9' }),
      shadow: new THREE.MeshBasicMaterial({
        color: '#1b1740',
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    };
  }, [skinColor, hairColor, shirtColor, pantsColor]);

  // Dimensions & baselines
  const {
    legHeight,
    legRadius,
    bodyHeight,
    bodyWidth,
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

  // Animate via existing reusable animation preset registry
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
      leftArmRef.current.position.set(-bodyWidth / 2 - armRadius * 0.8, baselines.shoulderY, 0);
      leftArmRef.current.rotation.set(0, 0, 0.04);
    }
    if (rightArmRef.current) {
      rightArmRef.current.position.set(bodyWidth / 2 + armRadius * 0.8, baselines.shoulderY, 0);
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
        <circleGeometry args={[sitting ? 0.42 : 0.35, 24]} />
      </mesh>

      {/* Legs & Shoes */}
      {!sitting ? (
        // Standing legs with stylized sneakers
        <>
          <group ref={leftLegRef} position={[-0.13, baselines.hipY, 0]}>
            {/* Pants leg */}
            <mesh
              castShadow
              receiveShadow
              position={[0, -legHeight / 2 + 0.03, 0]}
              material={materials.pants}
            >
              <capsuleGeometry args={[legRadius * 0.95, legHeight * 0.75, 4, 14]} />
            </mesh>
            {/* Rolled hem */}
            <mesh position={[0, -legHeight + 0.08, 0]} material={materials.pants}>
              <cylinderGeometry args={[legRadius * 1.05, legRadius * 1.05, 0.03, 14]} />
            </mesh>
            {/* Stylish Sneaker */}
            <group position={[0, -legHeight + 0.045, 0.04]}>
              {/* Sole */}
              <mesh castShadow position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.shoeSole}>
                <capsuleGeometry args={[0.052, 0.1, 4, 12]} />
              </mesh>
              {/* Shoe Body */}
              <mesh castShadow position={[0, 0.015, -0.01]} rotation={[Math.PI / 2, 0, 0]} material={materials.shoeAccent}>
                <capsuleGeometry args={[0.048, 0.085, 4, 12]} />
              </mesh>
              {/* White Toe Cap */}
              <mesh castShadow position={[0, 0.01, 0.035]} material={materials.shoeSole}>
                <sphereGeometry args={[0.046, 12, 12]} />
              </mesh>
            </group>
          </group>

          <group ref={rightLegRef} position={[0.13, baselines.hipY, 0]}>
            {/* Pants leg */}
            <mesh
              castShadow
              receiveShadow
              position={[0, -legHeight / 2 + 0.03, 0]}
              material={materials.pants}
            >
              <capsuleGeometry args={[legRadius * 0.95, legHeight * 0.75, 4, 14]} />
            </mesh>
            {/* Rolled hem */}
            <mesh position={[0, -legHeight + 0.08, 0]} material={materials.pants}>
              <cylinderGeometry args={[legRadius * 1.05, legRadius * 1.05, 0.03, 14]} />
            </mesh>
            {/* Stylish Sneaker */}
            <group position={[0, -legHeight + 0.045, 0.04]}>
              {/* Sole */}
              <mesh castShadow position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.shoeSole}>
                <capsuleGeometry args={[0.052, 0.1, 4, 12]} />
              </mesh>
              {/* Shoe Body */}
              <mesh castShadow position={[0, 0.015, -0.01]} rotation={[Math.PI / 2, 0, 0]} material={materials.shoeAccent}>
                <capsuleGeometry args={[0.048, 0.085, 4, 12]} />
              </mesh>
              {/* White Toe Cap */}
              <mesh castShadow position={[0, 0.01, 0.035]} material={materials.shoeSole}>
                <sphereGeometry args={[0.046, 12, 12]} />
              </mesh>
            </group>
          </group>
        </>
      ) : (
        // Sitting legs (curved thighs forward, rounded knees, calves down to floor)
        <group position={[0, baselines.hipY, 0]}>
          {/* Solid Pelvis / Buttock seat cushion */}
          <mesh
            castShadow
            receiveShadow
            position={[0, -0.01, 0.05]}
            rotation={[0, 0, Math.PI / 2]}
            material={materials.pants}
          >
            <capsuleGeometry args={[0.15, 0.16, 4, 16]} />
          </mesh>

          {/* Left thigh */}
          <mesh
            castShadow
            receiveShadow
            position={[-0.13, -0.01, 0.18]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.pants}
          >
            <capsuleGeometry args={[legRadius * 0.95, 0.22, 4, 14]} />
          </mesh>
          {/* Right thigh */}
          <mesh
            castShadow
            receiveShadow
            position={[0.13, -0.01, 0.18]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.pants}
          >
            <capsuleGeometry args={[legRadius * 0.95, 0.22, 4, 14]} />
          </mesh>

          {/* Left calf */}
          <mesh
            castShadow
            receiveShadow
            position={[-0.13, -0.22, 0.32]}
            material={materials.pants}
          >
            <capsuleGeometry args={[legRadius * 0.92, 0.24, 4, 14]} />
          </mesh>
          {/* Right calf */}
          <mesh
            castShadow
            receiveShadow
            position={[0.13, -0.22, 0.32]}
            material={materials.pants}
          >
            <capsuleGeometry args={[legRadius * 0.92, 0.24, 4, 14]} />
          </mesh>

          {/* Left Sneaker on floor */}
          <group position={[-0.13, -0.44, 0.35]}>
            <mesh castShadow position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.shoeSole}>
              <capsuleGeometry args={[0.052, 0.1, 4, 12]} />
            </mesh>
            <mesh castShadow position={[0, 0.015, -0.01]} rotation={[Math.PI / 2, 0, 0]} material={materials.shoeAccent}>
              <capsuleGeometry args={[0.048, 0.085, 4, 12]} />
            </mesh>
            <mesh castShadow position={[0, 0.01, 0.035]} material={materials.shoeSole}>
              <sphereGeometry args={[0.046, 12, 12]} />
            </mesh>
          </group>

          {/* Right Sneaker on floor */}
          <group position={[0.13, -0.44, 0.35]}>
            <mesh castShadow position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.shoeSole}>
              <capsuleGeometry args={[0.052, 0.1, 4, 12]} />
            </mesh>
            <mesh castShadow position={[0, 0.015, -0.01]} rotation={[Math.PI / 2, 0, 0]} material={materials.shoeAccent}>
              <capsuleGeometry args={[0.048, 0.085, 4, 12]} />
            </mesh>
            <mesh castShadow position={[0, 0.01, 0.035]} material={materials.shoeSole}>
              <sphereGeometry args={[0.046, 12, 12]} />
            </mesh>
          </group>
        </group>
      )}

      {/* Body / Torso (Rounded Chibi Silhouette) */}
      <group ref={bodyRef} position={[0, baselines.bodyCenterY, 0]}>
        {/* Main curved torso */}
        <mesh castShadow receiveShadow position={[0, -0.02, 0]} material={materials.shirt}>
          <cylinderGeometry args={[0.21, 0.18, 0.38, 18]} />
        </mesh>

        {/* Rounded upper chest / shoulders */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 0.13, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={materials.shirt}
        >
          <capsuleGeometry args={[0.165, 0.15, 6, 16]} />
        </mesh>

        {/* Rounded lower waist / hem */}
        <mesh
          castShadow
          receiveShadow
          position={[0, -0.2, 0]}
          material={materials.shirt}
        >
          <capsuleGeometry args={[0.175, 0.06, 4, 16]} />
        </mesh>

        {/* Neck */}
        <mesh castShadow receiveShadow position={[0, 0.26, 0]} material={materials.skin}>
          <cylinderGeometry args={[0.075, 0.085, 0.12, 16]} />
        </mesh>

        {/* Shirt Collar / Crew Neck */}
        <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.collar}>
          <torusGeometry args={[0.09, 0.02, 8, 18]} />
        </mesh>

        {/* Office Lanyard & ID Card Badge */}
        {hasLanyard && (
          <group position={[0, 0.05, 0.14]}>
            {/* Lanyard ribbon left & right */}
            <mesh position={[-0.04, 0.1, 0]} rotation={[0, 0, 0.2]} material={materials.lanyard}>
              <capsuleGeometry args={[0.008, 0.18, 2, 6]} />
            </mesh>
            <mesh position={[0.04, 0.1, 0]} rotation={[0, 0, -0.2]} material={materials.lanyard}>
              <capsuleGeometry args={[0.008, 0.18, 2, 6]} />
            </mesh>
            {/* ID Badge Card hanging */}
            <mesh castShadow position={[0, -0.02, 0.01]} material={materials.idBadge}>
              <boxGeometry args={[0.065, 0.085, 0.01]} />
            </mesh>
            {/* ID Photo area */}
            <mesh position={[0, 0.005, 0.016]} material={materials.collar}>
              <boxGeometry args={[0.045, 0.04, 0.005]} />
            </mesh>
          </group>
        )}
      </group>

      {/* Left Arm */}
      <group
        ref={leftArmRef}
        position={[-bodyWidth / 2 - armRadius * 0.8, baselines.shoulderY, 0]}
      >
        {/* Shoulder sleeve cuff */}
        <mesh position={[0, -0.04, 0]} material={materials.shirt}>
          <cylinderGeometry args={[armRadius * 1.1, armRadius * 1.05, 0.1, 14]} />
        </mesh>
        {/* Arm capsule */}
        <mesh
          castShadow
          receiveShadow
          position={[0, -armHeight / 2, 0]}
          material={materials.shirt}
        >
          <capsuleGeometry args={[armRadius * 0.9, armHeight * 0.65, 4, 14]} />
        </mesh>
        {/* Forearm skin / hand */}
        <mesh
          castShadow
          position={[0, -armHeight - 0.01, 0]}
          material={materials.skin}
        >
          <sphereGeometry args={[armRadius * 0.95, 12, 12]} />
        </mesh>
        {/* Cute thumb */}
        <mesh
          castShadow
          position={[0.02, -armHeight - 0.01, 0.025]}
          rotation={[0.3, 0.2, 0]}
          material={materials.skin}
        >
          <capsuleGeometry args={[0.018, 0.03, 3, 8]} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group
        ref={rightArmRef}
        position={[bodyWidth / 2 + armRadius * 0.8, baselines.shoulderY, 0]}
      >
        {/* Shoulder sleeve cuff */}
        <mesh position={[0, -0.04, 0]} material={materials.shirt}>
          <cylinderGeometry args={[armRadius * 1.1, armRadius * 1.05, 0.1, 14]} />
        </mesh>
        {/* Arm capsule */}
        <mesh
          castShadow
          receiveShadow
          position={[0, -armHeight / 2, 0]}
          material={materials.shirt}
        >
          <capsuleGeometry args={[armRadius * 0.9, armHeight * 0.65, 4, 14]} />
        </mesh>
        {/* Hand */}
        <mesh
          castShadow
          position={[0, -armHeight - 0.01, 0]}
          material={materials.skin}
        >
          <sphereGeometry args={[armRadius * 0.95, 12, 12]} />
        </mesh>
        {/* Cute thumb */}
        <mesh
          castShadow
          position={[-0.02, -armHeight - 0.01, 0.025]}
          rotation={[0.3, -0.2, 0]}
          material={materials.skin}
        >
          <capsuleGeometry args={[0.018, 0.03, 3, 8]} />
        </mesh>

        {/* Smartphone held in hand */}
        {activity === 'phone' && (
          <group position={[0, -armHeight + 0.04, 0.08]} rotation={[0.4, -0.3, 0]}>
            <mesh castShadow material={materials.phone}>
              <boxGeometry args={[0.075, 0.13, 0.015]} />
            </mesh>
            <mesh position={[0, 0, 0.009]} material={materials.phoneScreen}>
              <planeGeometry args={[0.065, 0.115]} />
            </mesh>
          </group>
        )}

        {/* Document clipboard for walker */}
        {activity === 'walking' && (
          <group position={[0, -armHeight - 0.02, 0.12]} rotation={[0.35, -0.2, 0]}>
            {/* Clipboard board */}
            <mesh castShadow material={materials.pants}>
              <boxGeometry args={[0.18, 0.25, 0.015]} />
            </mesh>
            {/* Paper sheet */}
            <mesh position={[0, 0, 0.01]} material={materials.collar}>
              <planeGeometry args={[0.15, 0.21]} />
            </mesh>
            {/* Metal clip */}
            <mesh position={[0, 0.11, 0.015]} material={materials.glasses}>
              <boxGeometry args={[0.06, 0.02, 0.01]} />
            </mesh>
          </group>
        )}
      </group>

      {/* Head Group (Cute Chibi Face & Hair) */}
      <group ref={headRef} position={[0, baselines.headCenterY, 0]}>
        {/* Head Sphere */}
        <mesh castShadow receiveShadow material={materials.skin}>
          <sphereGeometry args={[headRadius, 24, 24]} />
        </mesh>

        {/* Left & Right Ears */}
        <mesh
          castShadow
          position={[-headRadius * 0.94, -0.01, -0.02]}
          scale={[0.6, 1, 0.8]}
          material={materials.skin}
        >
          <sphereGeometry args={[0.045, 12, 12]} />
        </mesh>
        <mesh
          castShadow
          position={[headRadius * 0.94, -0.01, -0.02]}
          scale={[0.6, 1, 0.8]}
          material={materials.skin}
        >
          <sphereGeometry args={[0.045, 12, 12]} />
        </mesh>

        {/* Stylized Hair */}
        <HairStyle
          style={resolvedHairStyle}
          hairColor={hairColor}
          headRadius={headRadius}
          longHair={longHair}
        />

        {/* Eyebrows */}
        <mesh
          position={[-0.075, 0.07, headRadius * 0.9]}
          rotation={[0, 0, -0.1]}
          material={materials.eyebrow}
        >
          <capsuleGeometry args={[0.01, 0.04, 2, 6]} />
        </mesh>
        <mesh
          position={[0.075, 0.07, headRadius * 0.9]}
          rotation={[0, 0, 0.1]}
          material={materials.eyebrow}
        >
          <capsuleGeometry args={[0.01, 0.04, 2, 6]} />
        </mesh>

        {/* Eyes: Expressive stylized eyes with shiny white highlight */}
        <group position={[-0.075, 0.015, headRadius * 0.92]}>
          {/* Pupil */}
          <mesh material={materials.eye}>
            <sphereGeometry args={[0.03, 12, 12]} />
          </mesh>
          {/* Sparkle highlight */}
          <mesh position={[0.009, 0.01, 0.022]} material={materials.eyeHighlight}>
            <sphereGeometry args={[0.01, 8, 8]} />
          </mesh>
        </group>

        <group position={[0.075, 0.015, headRadius * 0.92]}>
          {/* Pupil */}
          <mesh material={materials.eye}>
            <sphereGeometry args={[0.03, 12, 12]} />
          </mesh>
          {/* Sparkle highlight */}
          <mesh position={[0.009, 0.01, 0.022]} material={materials.eyeHighlight}>
            <sphereGeometry args={[0.01, 8, 8]} />
          </mesh>
        </group>

        {/* Glasses (Stylish wireframe rims for Arif & Rina) */}
        {resolvedGlasses && (
          <group position={[0, 0.015, headRadius * 0.96]}>
            {/* Left rim */}
            <mesh position={[-0.075, 0, 0]} material={materials.glasses}>
              <torusGeometry args={[0.048, 0.007, 8, 16]} />
            </mesh>
            {/* Right rim */}
            <mesh position={[0.075, 0, 0]} material={materials.glasses}>
              <torusGeometry args={[0.048, 0.007, 8, 16]} />
            </mesh>
            {/* Center bridge */}
            <mesh position={[0, 0.01, 0]} material={materials.glasses}>
              <boxGeometry args={[0.05, 0.008, 0.006]} />
            </mesh>
            {/* Temples */}
            <mesh position={[-0.125, 0, -0.06]} rotation={[0, 0.4, 0]} material={materials.glasses}>
              <boxGeometry args={[0.006, 0.006, 0.12]} />
            </mesh>
            <mesh position={[0.125, 0, -0.06]} rotation={[0, -0.4, 0]} material={materials.glasses}>
              <boxGeometry args={[0.006, 0.006, 0.12]} />
            </mesh>
          </group>
        )}

        {/* Blush Cheeks (Cute Kawaii Rosy glow) */}
        <mesh
          position={[-0.12, -0.045, headRadius * 0.86]}
          rotation={[0, -0.3, 0]}
          material={materials.blush}
        >
          <circleGeometry args={[0.036, 16]} />
        </mesh>
        <mesh
          position={[0.12, -0.045, headRadius * 0.86]}
          rotation={[0, 0.3, 0]}
          material={materials.blush}
        >
          <circleGeometry args={[0.036, 16]} />
        </mesh>

        {/* Cute Smile */}
        <mesh
          position={[0, -0.065, headRadius * 0.93]}
          rotation={[Math.PI, 0, 0]}
          material={materials.mouth}
        >
          <torusGeometry args={[0.03, 0.008, 6, 12, Math.PI * 0.8]} />
        </mesh>
      </group>

      {/* Tooltip on hover */}
      {hovered && (name || tip) && (
        <Html
          position={[0, baselines.headCenterY + headRadius + 0.45, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(27, 23, 64, 0.92)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              lineHeight: '1.35',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.2)',
              whiteSpace: 'nowrap',
              fontFamily: "'Nunito', sans-serif",
              textAlign: 'center',
            }}
          >
            {name && (
              <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '2px' }}>
                {name}
              </div>
            )}
            {tip && <div style={{ color: '#e2e8f0', fontSize: '11px', opacity: 0.95 }}>{tip}</div>}
          </div>
        </Html>
      )}
    </group>
  );
});

Character.displayName = 'Character';
export default Character;
