import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

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
}) {
  const rootRef = useRef();
  const bodyRef = useRef();
  const headRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  const [hovered, setHovered] = useState(false);

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

  // Sitting vs Standing dimensions & baselines
  const legHeight = 0.5;
  const legRadius = 0.08;
  const bodyHeight = 0.6;
  const bodyWidth = 0.5;
  const bodyDepth = 0.3;
  const armRadius = 0.06;
  const armHeight = 0.45;
  const headRadius = 0.22;

  const hipY = sitting ? 0.38 : legHeight;
  const bodyCenterY = hipY + bodyHeight / 2;
  const shoulderY = hipY + bodyHeight - 0.08;
  const headCenterY = hipY + bodyHeight + headRadius + 0.04;

  // Staggered timing for breathing & movement
  const animOffset = useMemo(() => {
    return (position[0] * 1.7 + position[2] * 2.3) % 10;
  }, [position]);

  // Gentle, polished animations
  useFrame((state) => {
    const t = state.clock.getElapsedTime() + animOffset;

    // Reset baselines
    if (bodyRef.current) {
      bodyRef.current.position.y = bodyCenterY;
      bodyRef.current.rotation.set(0, 0, 0);
    }
    if (headRef.current) {
      headRef.current.rotation.set(0, 0, 0);
    }

    switch (activity) {
      case 'idle': {
        // Very subtle natural breathing
        const breath = 1 + Math.sin(t * 1.5) * 0.015;
        if (bodyRef.current) bodyRef.current.scale.set(1, breath, 1);
        if (headRef.current) headRef.current.rotation.x = Math.sin(t * 1.2) * 0.02;
        if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0.04);
        if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, -0.04);
        break;
      }

      case 'typing': {
        // Hands rest stably on keyboard with subtle calm typing
        const tapL = Math.sin(t * 5.5) * 0.03;
        const tapR = Math.sin(t * 5.5 + Math.PI) * 0.03;

        if (leftArmRef.current) {
          leftArmRef.current.rotation.set(-1.05 + tapL, 0.05, 0.12);
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.set(-1.05 + tapR, -0.05, -0.12);
        }
        // Subtle focus nod
        if (headRef.current) {
          headRef.current.rotation.x = 0.12 + Math.sin(t * 1.4) * 0.015;
        }
        // Gentle breathing
        const breath = 1 + Math.sin(t * 1.5) * 0.012;
        if (bodyRef.current) bodyRef.current.scale.set(1, breath, 1);
        break;
      }

      case 'talking': {
        // Calm discussion gestures (polite office talk)
        const gesture = Math.sin(t * 2.0) * 0.08;
        if (rightArmRef.current) {
          rightArmRef.current.rotation.set(-0.65 + gesture, 0, -0.2);
        }
        if (leftArmRef.current) {
          leftArmRef.current.rotation.set(-0.15, 0, 0.06);
        }
        if (headRef.current) {
          headRef.current.rotation.set(
            Math.sin(t * 2.2) * 0.04,
            Math.sin(t * 1.5) * 0.06,
            0
          );
        }
        break;
      }

      case 'walking': {
        if (!isWalking) {
          // Standing still / paused
          if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0);
          if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0);
          if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0.04);
          if (rightArmRef.current) rightArmRef.current.rotation.set(-0.35, 0, -0.05);
          if (bodyRef.current) bodyRef.current.position.y = bodyCenterY;
        } else {
          // Gentle walk cycle
          const walkSpeed = 4.2;
          const swingLeg = Math.sin(t * walkSpeed) * 0.32;
          const swingArm = Math.sin(t * walkSpeed) * 0.28;

          if (leftLegRef.current) leftLegRef.current.rotation.x = swingLeg;
          if (rightLegRef.current) rightLegRef.current.rotation.x = -swingLeg;

          if (leftArmRef.current) leftArmRef.current.rotation.x = -swingArm;
          // Right arm holds folder/papers stably
          if (rightArmRef.current) rightArmRef.current.rotation.set(-0.4, 0, -0.05);

          if (bodyRef.current) {
            bodyRef.current.position.y = bodyCenterY + Math.abs(Math.sin(t * walkSpeed)) * 0.02;
          }
          if (headRef.current) {
            headRef.current.rotation.y = Math.sin(t * (walkSpeed / 2)) * 0.03;
          }
        }
        break;
      }

      case 'writing': {
        // Holding marker near whiteboard, writing smoothly
        const writeWave = Math.sin(t * 2.5) * 0.035;
        if (rightArmRef.current) {
          rightArmRef.current.rotation.set(-1.3 + writeWave, Math.cos(t * 2.0) * 0.04, -0.1);
        }
        if (leftArmRef.current) {
          leftArmRef.current.rotation.set(0, 0, 0.06);
        }
        if (headRef.current) {
          headRef.current.rotation.x = 0.08 + Math.sin(t * 1.5) * 0.015;
        }
        break;
      }

      case 'phone': {
        // Calm phone call posture
        if (rightArmRef.current) {
          // Hand holding phone near ear stably
          rightArmRef.current.rotation.set(-2.0, -0.2, -0.45);
        }
        if (leftArmRef.current) {
          leftArmRef.current.rotation.set(-0.3, 0, 0.1);
        }
        if (headRef.current) {
          headRef.current.rotation.set(0.04, 0, -0.1 + Math.sin(t * 1.2) * 0.02);
        }
        break;
      }

      default:
        break;
    }
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
          <group ref={leftLegRef} position={[-0.14, hipY, 0]}>
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

          <group ref={rightLegRef} position={[0.14, hipY, 0]}>
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
        // Sitting legs (bent: thighs forward + calves down)
        <group position={[0, hipY, 0]}>
          <mesh
            castShadow
            receiveShadow
            position={[-0.13, -0.04, 0.16]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.pants}
          >
            <cylinderGeometry args={[legRadius, legRadius, 0.32, 16]} />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            position={[0.13, -0.04, 0.16]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.pants}
          >
            <cylinderGeometry args={[legRadius, legRadius, 0.32, 16]} />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            position={[-0.13, -0.22, 0.32]}
            material={materials.pants}
          >
            <cylinderGeometry args={[legRadius, legRadius * 0.9, 0.32, 16]} />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            position={[0.13, -0.22, 0.32]}
            material={materials.pants}
          >
            <cylinderGeometry args={[legRadius, legRadius * 0.9, 0.32, 16]} />
          </mesh>
          <mesh
            castShadow
            position={[-0.13, -0.36, 0.36]}
            material={materials.pants}
          >
            <boxGeometry args={[legRadius * 1.8, 0.06, 0.14]} />
          </mesh>
          <mesh
            castShadow
            position={[0.13, -0.36, 0.36]}
            material={materials.pants}
          >
            <boxGeometry args={[legRadius * 1.8, 0.06, 0.14]} />
          </mesh>
        </group>
      )}

      {/* Body / Torso */}
      <group ref={bodyRef} position={[0, bodyCenterY, 0]}>
        <mesh castShadow receiveShadow material={materials.shirt}>
          <boxGeometry args={[bodyWidth, bodyHeight, bodyDepth]} />
        </mesh>
      </group>

      {/* Left Arm */}
      <group
        ref={leftArmRef}
        position={[-bodyWidth / 2 - armRadius, shoulderY, 0]}
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
        position={[bodyWidth / 2 + armRadius, shoulderY, 0]}
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
      <group ref={headRef} position={[0, headCenterY, 0]}>
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
          position={[0, headCenterY + headRadius + 0.4, 0]}
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
