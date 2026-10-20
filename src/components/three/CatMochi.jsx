import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Waypoints schedule for Mochi the office cat.
 * Mochi roams through all 4 office zones with 100% obstacle-clear paths:
 * 1. Breakout Lounge (sleeping / loafing on carpet)
 * 2. Pantry Cafe (sitting & grooming paw near coffee counter)
 * 3. Glass Meeting Room (walks to glass doorway, sits & inspects meeting room)
 * 4. Workstation Wing (walks down the main corridor past developer desks)
 */
const WAYPOINTS = [
  { pos: [10.6, 0, 8.4], pauseAction: 'sleep', pauseDuration: 9 }, // Lounge warm carpet
  { pos: [8.8, 0, 8.0] }, // Corridor south near lounge
  { pos: [6.8, 0, 8.0] }, // Entering pantry zone (safely past wood slat divider)
  { pos: [4.6, 0, 8.4], pauseAction: 'clean', pauseDuration: 6 }, // Pantry floor near coffee counter
  { pos: [6.8, 0, 8.0] }, // Exiting pantry
  { pos: [8.8, 0, 7.4] }, // Main corridor junction
  { pos: [8.8, 0, 4.4] }, // Main corridor in front of glass doorway
  { pos: [10.4, 0, 4.4], pauseAction: 'sit', pauseDuration: 6 }, // At glass doorway threshold
  { pos: [8.8, 0, 4.4] }, // Back out to hallway
  { pos: [8.8, 0, 2.2], pauseAction: 'sit', pauseDuration: 4 }, // Hallway north near workstations
  { pos: [8.8, 0, 6.0] }, // Hallway central
  { pos: [10.6, 0, 8.4] }, // Return to lounge carpet
];

const CAT_WALK_SPEED = 0.9; // units per second

// Precalculate timeline segments for zero-allocation useFrame updates
function buildSchedule() {
  let totalTime = 0;
  const segments = [];

  for (let i = 0; i < WAYPOINTS.length; i++) {
    const from = WAYPOINTS[i].pos;
    const to = WAYPOINTS[(i + 1) % WAYPOINTS.length].pos;
    const dx = to[0] - from[0];
    const dz = to[2] - from[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const travelDuration = dist / CAT_WALK_SPEED;
    const pauseDuration = WAYPOINTS[i].pauseDuration || 0;
    const pauseAction = WAYPOINTS[i].pauseAction || null;

    segments.push({
      from,
      to,
      pauseDuration,
      pauseAction,
      travelDuration,
      startTime: totalTime,
      pauseEndTime: totalTime + pauseDuration,
      travelEndTime: totalTime + pauseDuration + travelDuration,
      angle: Math.atan2(dx, dz),
    });
    totalTime += pauseDuration + travelDuration;
  }

  return { totalTime, segments };
}

const SCHEDULE = buildSchedule();

/**
 * 3D Stylized Chibi Cat Component (Mochi)
 * Sculpted with horizontal chubby body, white muzzle whisker-pads, cute ears,
 * big emerald anime eyes with double sparkles, tail with question-mark curl,
 * and quadruped diagonal walk cycle!
 */
export const CatMochi = React.memo(function CatMochi() {
  const rootRef = useRef();
  const bodyRef = useRef();
  const headRef = useRef();
  const tailBaseRef = useRef();
  const tailMidRef = useRef();
  const legFLRef = useRef();
  const legFRRef = useRef();
  const legBLRef = useRef();
  const legBRRef = useRef();

  const [hovered, setHovered] = useState(false);
  const [clickedMeow, setClickedMeow] = useState(false);
  const [currentAction, setCurrentAction] = useState('sleep');

  const meowTimeoutRef = useRef(null);

  const handleMeow = (e) => {
    e.stopPropagation();
    setClickedMeow(true);
    if (meowTimeoutRef.current) clearTimeout(meowTimeoutRef.current);
    meowTimeoutRef.current = setTimeout(() => setClickedMeow(false), 3000);
  };

  // Materials with vibrant, warm kawaii palette
  const materials = useMemo(() => {
    return {
      fur: new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.6,
      }),
      furDark: new THREE.MeshStandardMaterial({
        color: '#d97706',
        roughness: 0.65,
      }),
      whiteFur: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.5,
      }),
      earInner: new THREE.MeshStandardMaterial({
        color: '#fda4af',
        roughness: 0.7,
      }),
      nose: new THREE.MeshStandardMaterial({
        color: '#fb7185',
        roughness: 0.4,
      }),
      whisker: new THREE.MeshBasicMaterial({
        color: '#475569',
      }),
      collar: new THREE.MeshStandardMaterial({
        color: '#ef4444',
        roughness: 0.35,
      }),
      bell: new THREE.MeshStandardMaterial({
        color: '#fbbf24',
        metalness: 0.85,
        roughness: 0.2,
      }),
      eyeIris: new THREE.MeshStandardMaterial({
        color: '#10b981',
        roughness: 0.2,
      }),
      pupil: new THREE.MeshBasicMaterial({
        color: '#09090b',
      }),
      sparkle: new THREE.MeshBasicMaterial({
        color: '#ffffff',
      }),
      eyeSleep: new THREE.MeshBasicMaterial({
        color: '#78350f',
      }),
      shadow: new THREE.MeshBasicMaterial({
        color: '#1b1740',
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    };
  }, []);

  // Multi-behavior motion loop
  useFrame((state) => {
    if (!rootRef.current) return;
    const t = state.clock.getElapsedTime();
    const cycleTime = t % SCHEDULE.totalTime;

    // Find current active schedule segment
    let curSeg = SCHEDULE.segments[0];
    for (let i = 0; i < SCHEDULE.segments.length; i++) {
      if (cycleTime >= SCHEDULE.segments[i].startTime && cycleTime < SCHEDULE.segments[i].travelEndTime) {
        curSeg = SCHEDULE.segments[i];
        break;
      }
    }

    const inPause = cycleTime < curSeg.pauseEndTime;
    const action = inPause ? (curSeg.pauseAction || 'sit') : 'walk';

    if (action !== currentAction) {
      setCurrentAction(action);
    }

    // Position & Orientation
    if (inPause) {
      rootRef.current.position.set(curSeg.from[0], 0, curSeg.from[2]);
      if (action === 'sleep') {
        rootRef.current.rotation.y = 0.4;
      }
    } else {
      const travelElapsed = cycleTime - curSeg.pauseEndTime;
      const progress = Math.min(1, Math.max(0, travelElapsed / curSeg.travelDuration));
      const curX = curSeg.from[0] + (curSeg.to[0] - curSeg.from[0]) * progress;
      const curZ = curSeg.from[2] + (curSeg.to[2] - curSeg.from[2]) * progress;
      rootRef.current.position.set(curX, 0, curZ);
      rootRef.current.rotation.y = curSeg.angle;
    }

    // Quadruped animations per action
    if (action === 'walk') {
      const walkT = t * 10;
      // Diagonal trot gait (FL + BR together, FR + BL together)
      const swingL = Math.sin(walkT) * 0.45;
      const swingR = Math.sin(walkT + Math.PI) * 0.45;

      if (legFLRef.current) legFLRef.current.rotation.x = swingL;
      if (legBRRef.current) legBRRef.current.rotation.x = swingL;
      if (legFRRef.current) legFRRef.current.rotation.x = swingR;
      if (legBLRef.current) legBLRef.current.rotation.x = swingR;

      // Body trot bounce & sway
      if (bodyRef.current) {
        bodyRef.current.position.y = 0.15 + Math.abs(Math.sin(walkT)) * 0.02;
        bodyRef.current.rotation.x = 0;
        bodyRef.current.rotation.z = Math.sin(walkT * 0.5) * 0.04;
      }

      // Tail graceful rhythmic sway
      if (tailBaseRef.current) {
        tailBaseRef.current.rotation.y = Math.sin(t * 5) * 0.4;
        tailBaseRef.current.rotation.x = -0.5 + Math.sin(t * 3) * 0.1;
      }
      if (tailMidRef.current) {
        tailMidRef.current.rotation.y = Math.sin(t * 5 + 0.5) * 0.3;
      }

      // Head bobbing
      if (headRef.current) {
        headRef.current.position.set(0, 0.22, 0.18);
        headRef.current.rotation.set(Math.sin(walkT) * 0.06, 0, 0);
      }
    } else if (action === 'sit') {
      // Sitting pose: hind legs tucked, front legs straight, body tilted upright
      if (legFLRef.current) legFLRef.current.rotation.set(0, 0, 0);
      if (legFRRef.current) legFRRef.current.rotation.set(0, 0, 0);
      if (legBLRef.current) legBLRef.current.rotation.set(-1.1, 0, 0);
      if (legBRRef.current) legBRRef.current.rotation.set(-1.1, 0, 0);

      if (bodyRef.current) {
        bodyRef.current.position.y = 0.13;
        bodyRef.current.rotation.set(-0.45, 0, 0); // tilted upright
        bodyRef.current.rotation.z = 0;
      }

      // Head looking around curiously
      if (headRef.current) {
        headRef.current.position.set(0, 0.25, 0.14);
        headRef.current.rotation.set(-0.1 + Math.sin(t * 2) * 0.04, Math.sin(t * 1.5) * 0.5, 0);
      }

      // Tail resting on floor with gentle tip flick
      if (tailBaseRef.current) {
        tailBaseRef.current.rotation.set(0.1, Math.sin(t * 3) * 0.35, 0);
      }
    } else if (action === 'clean') {
      // Grooming / licking front paw
      if (legFRRef.current) legFRRef.current.rotation.set(0, 0, 0);
      if (legBLRef.current) legBLRef.current.rotation.set(-1.1, 0, 0);
      if (legBRRef.current) legBRRef.current.rotation.set(-1.1, 0, 0);

      // Left paw raised towards cheek
      if (legFLRef.current) {
        legFLRef.current.rotation.set(-1.3 + Math.sin(t * 6) * 0.15, 0, 0.2);
      }

      if (bodyRef.current) {
        bodyRef.current.position.y = 0.12;
        bodyRef.current.rotation.set(-0.35, 0, 0);
      }

      // Head tilted licking paw
      if (headRef.current) {
        headRef.current.position.set(0, 0.23, 0.14);
        headRef.current.rotation.set(0.25 + Math.sin(t * 6) * 0.1, -0.3, 0.1);
      }

      if (tailBaseRef.current) {
        tailBaseRef.current.rotation.set(0.1, Math.sin(t * 2) * 0.2, 0);
      }
    } else if (action === 'sleep') {
      // Cat Loaf / Sleep pose: legs completely tucked, body resting on floor
      const breath = 1 + Math.sin(t * 1.8) * 0.04;

      if (legFLRef.current) legFLRef.current.rotation.set(-Math.PI / 2.1, 0, 0);
      if (legFRRef.current) legFRRef.current.rotation.set(-Math.PI / 2.1, 0, 0);
      if (legBLRef.current) legBLRef.current.rotation.set(Math.PI / 2.1, 0, 0);
      if (legBRRef.current) legBRRef.current.rotation.set(Math.PI / 2.1, 0, 0);

      if (bodyRef.current) {
        bodyRef.current.position.y = 0.09 * breath;
        bodyRef.current.rotation.set(0, 0, 0);
        bodyRef.current.scale.set(1.15, 0.85 * breath, 1);
      }

      if (headRef.current) {
        headRef.current.position.set(0, 0.13, 0.16);
        headRef.current.rotation.set(0.15, 0.35, 0);
      }

      if (tailBaseRef.current) {
        tailBaseRef.current.rotation.set(0.2, 1.1, -0.2);
      }
    }
  });

  return (
    <group
      ref={rootRef}
      name="CatMochi"
      onClick={handleMeow}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Ground Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} material={materials.shadow}>
        <circleGeometry args={[0.32, 24]} />
      </mesh>

      {/* Cat Torso (Horizontal Chubby Body) */}
      <group ref={bodyRef} position={[0, 0.15, 0]}>
        {/* Main curved torso oriented horizontally along Z */}
        <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.fur}>
          <capsuleGeometry args={[0.11, 0.22, 6, 18]} />
        </mesh>

        {/* White Belly & Fluffy Chest Bib */}
        <mesh position={[0, -0.04, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={materials.whiteFur}>
          <capsuleGeometry args={[0.08, 0.18, 4, 16]} />
        </mesh>

        {/* Tabby Back Stripes */}
        <mesh position={[0, 0.07, -0.04]} rotation={[Math.PI / 2, 0, 0]} material={materials.furDark}>
          <cylinderGeometry args={[0.112, 0.112, 0.025, 16, 1, true, -Math.PI * 0.7, Math.PI * 1.4]} />
        </mesh>
        <mesh position={[0, 0.07, 0.04]} rotation={[Math.PI / 2, 0, 0]} material={materials.furDark}>
          <cylinderGeometry args={[0.112, 0.112, 0.025, 16, 1, true, -Math.PI * 0.7, Math.PI * 1.4]} />
        </mesh>

        {/* Red Collar with Golden Jingle Bell */}
        <mesh position={[0, 0.02, 0.14]} rotation={[0.3, 0, 0]} material={materials.collar}>
          <torusGeometry args={[0.095, 0.015, 8, 18]} />
        </mesh>
        <mesh position={[0, -0.03, 0.22]} castShadow material={materials.bell}>
          <sphereGeometry args={[0.024, 12, 12]} />
        </mesh>
      </group>

      {/* Cat Head & Kawaii Face */}
      <group ref={headRef} position={[0, 0.22, 0.18]}>
        {/* Rounded Skull */}
        <mesh castShadow receiveShadow material={materials.fur} scale={[1.06, 0.96, 1.0]}>
          <sphereGeometry args={[0.13, 24, 24]} />
        </mesh>

        {/* Puffy White Muzzle & Whisker Pads */}
        <mesh position={[-0.038, -0.034, 0.11]} material={materials.whiteFur}>
          <sphereGeometry args={[0.045, 14, 14]} />
        </mesh>
        <mesh position={[0.038, -0.034, 0.11]} material={materials.whiteFur}>
          <sphereGeometry args={[0.045, 14, 14]} />
        </mesh>

        {/* Cute Pink Cat Nose */}
        <mesh position={[0, -0.008, 0.14]} material={materials.nose}>
          <sphereGeometry args={[0.016, 10, 10]} />
        </mesh>

        {/* Whiskers (3 left, 3 right) */}
        {[-0.015, 0, 0.015].map((wy, idx) => (
          <group key={`whisker-l-${idx}`} position={[-0.08, -0.03 + wy, 0.1]}>
            <mesh rotation={[0, 0, 0.1 + idx * 0.1]} material={materials.whisker}>
              <boxGeometry args={[0.08, 0.003, 0.003]} />
            </mesh>
          </group>
        ))}
        {[-0.015, 0, 0.015].map((wy, idx) => (
          <group key={`whisker-r-${idx}`} position={[0.08, -0.03 + wy, 0.1]}>
            <mesh rotation={[0, 0, -0.1 - idx * 0.1]} material={materials.whisker}>
              <boxGeometry args={[0.08, 0.003, 0.003]} />
            </mesh>
          </group>
        ))}

        {/* 3D Cat Ears with Pink Inner Pockets */}
        {/* Left Ear */}
        <group position={[-0.075, 0.11, 0.02]} rotation={[0.1, 0.1, 0.4]}>
          <mesh castShadow material={materials.fur}>
            <coneGeometry args={[0.05, 0.095, 6]} />
          </mesh>
          <mesh position={[0, -0.005, 0.012]} material={materials.earInner}>
            <coneGeometry args={[0.032, 0.07, 6]} />
          </mesh>
        </group>
        {/* Right Ear */}
        <group position={[0.075, 0.11, 0.02]} rotation={[0.1, -0.1, -0.4]}>
          <mesh castShadow material={materials.fur}>
            <coneGeometry args={[0.05, 0.095, 6]} />
          </mesh>
          <mesh position={[0, -0.005, 0.012]} material={materials.earInner}>
            <coneGeometry args={[0.032, 0.07, 6]} />
          </mesh>
        </group>

        {/* Eyes: Awake or Sleeping */}
        {currentAction === 'sleep' ? (
          // Happy Sleeping Crescent Eyes (^._.^)
          <group position={[0, 0.025, 0.12]}>
            <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 6]} material={materials.eyeSleep}>
              <boxGeometry args={[0.035, 0.008, 0.01]} />
            </mesh>
            <mesh position={[0.05, 0, 0]} rotation={[0, 0, -Math.PI / 6]} material={materials.eyeSleep}>
              <boxGeometry args={[0.035, 0.008, 0.01]} />
            </mesh>
          </group>
        ) : (
          // Big Anime Kawaii Eyes with Dual Sparkles
          <group position={[0, 0.03, 0.115]}>
            {/* Left Eye */}
            <mesh position={[-0.05, 0, 0]} material={materials.eyeIris} scale={[1, 1.15, 1]}>
              <sphereGeometry args={[0.026, 14, 14]} />
            </mesh>
            <mesh position={[-0.05, 0, 0.018]} material={materials.pupil}>
              <capsuleGeometry args={[0.009, 0.016, 2, 6]} />
            </mesh>
            {/* Main Sparkle */}
            <mesh position={[-0.044, 0.012, 0.022]} material={materials.sparkle}>
              <sphereGeometry args={[0.008, 8, 8]} />
            </mesh>
            {/* Sub Sparkle */}
            <mesh position={[-0.056, -0.008, 0.02]} material={materials.sparkle}>
              <sphereGeometry args={[0.004, 6, 6]} />
            </mesh>

            {/* Right Eye */}
            <mesh position={[0.05, 0, 0]} material={materials.eyeIris} scale={[1, 1.15, 1]}>
              <sphereGeometry args={[0.026, 14, 14]} />
            </mesh>
            <mesh position={[0.05, 0, 0.018]} material={materials.pupil}>
              <capsuleGeometry args={[0.009, 0.016, 2, 6]} />
            </mesh>
            {/* Main Sparkle */}
            <mesh position={[0.056, 0.012, 0.022]} material={materials.sparkle}>
              <sphereGeometry args={[0.008, 8, 8]} />
            </mesh>
            {/* Sub Sparkle */}
            <mesh position={[0.044, -0.008, 0.02]} material={materials.sparkle}>
              <sphereGeometry args={[0.004, 6, 6]} />
            </mesh>
          </group>
        )}
      </group>

      {/* Front-Left Leg & White Sock */}
      <group ref={legFLRef} position={[-0.08, 0.12, 0.11]}>
        <mesh castShadow position={[0, -0.03, 0]} material={materials.fur}>
          <capsuleGeometry args={[0.032, 0.08, 4, 10]} />
        </mesh>
        <mesh position={[0, -0.08, 0.01]} material={materials.whiteFur}>
          <sphereGeometry args={[0.036, 10, 10]} />
        </mesh>
      </group>

      {/* Front-Right Leg & White Sock */}
      <group ref={legFRRef} position={[0.08, 0.12, 0.11]}>
        <mesh castShadow position={[0, -0.03, 0]} material={materials.fur}>
          <capsuleGeometry args={[0.032, 0.08, 4, 10]} />
        </mesh>
        <mesh position={[0, -0.08, 0.01]} material={materials.whiteFur}>
          <sphereGeometry args={[0.036, 10, 10]} />
        </mesh>
      </group>

      {/* Back-Left Leg (Thicker Cat Thigh & White Sock) */}
      <group ref={legBLRef} position={[-0.09, 0.12, -0.1]}>
        {/* Curved upper thigh */}
        <mesh castShadow position={[0, 0.01, 0]} material={materials.fur}>
          <sphereGeometry args={[0.052, 12, 12]} />
        </mesh>
        <mesh castShadow position={[0, -0.04, 0]} material={materials.fur}>
          <capsuleGeometry args={[0.032, 0.07, 4, 10]} />
        </mesh>
        <mesh position={[0, -0.08, 0.01]} material={materials.whiteFur}>
          <sphereGeometry args={[0.036, 10, 10]} />
        </mesh>
      </group>

      {/* Back-Right Leg (Thicker Cat Thigh & White Sock) */}
      <group ref={legBRRef} position={[0.09, 0.12, -0.1]}>
        {/* Curved upper thigh */}
        <mesh castShadow position={[0, 0.01, 0]} material={materials.fur}>
          <sphereGeometry args={[0.052, 12, 12]} />
        </mesh>
        <mesh castShadow position={[0, -0.04, 0]} material={materials.fur}>
          <capsuleGeometry args={[0.032, 0.07, 4, 10]} />
        </mesh>
        <mesh position={[0, -0.08, 0.01]} material={materials.whiteFur}>
          <sphereGeometry args={[0.036, 10, 10]} />
        </mesh>
      </group>

      {/* S-Curved Articulated Cat Tail */}
      <group ref={tailBaseRef} position={[0, 0.16, -0.12]}>
        <mesh castShadow position={[0, 0.08, -0.04]} rotation={[0.4, 0, 0]} material={materials.fur}>
          <capsuleGeometry args={[0.024, 0.14, 4, 12]} />
        </mesh>
        {/* Upper curl */}
        <group ref={tailMidRef} position={[0, 0.15, -0.08]}>
          <mesh castShadow position={[0, 0.07, 0.02]} rotation={[-0.4, 0, 0]} material={materials.fur}>
            <capsuleGeometry args={[0.022, 0.12, 4, 12]} />
          </mesh>
          {/* Darker Tabby Tip */}
          <mesh castShadow position={[0, 0.14, 0.05]} material={materials.furDark}>
            <sphereGeometry args={[0.026, 10, 10]} />
          </mesh>
        </group>
      </group>

      {/* Floating 'zZz' when sleeping */}
      {currentAction === 'sleep' && (
        <Html position={[0, 0.42, 0]} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              color: '#fbbf24',
              fontWeight: 800,
              fontSize: '12px',
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
              fontFamily: "'Nunito', system-ui, sans-serif",
              userSelect: 'none',
            }}
          >
            zZz...
          </div>
        </Html>
      )}

      {/* Interactive Speech Bubble when Clicked (Meow!) */}
      {clickedMeow && (
        <Html position={[0, 0.52, 0]} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: '#ffffff',
              color: '#1e293b',
              padding: '5px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 800,
              boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
              border: '2px solid #fbbf24',
              whiteSpace: 'nowrap',
              fontFamily: "'Nunito', system-ui, sans-serif",
              textAlign: 'center',
            }}
          >
            Meow~ Purrr 🐾
          </div>
        </Html>
      )}

      {/* Tooltip on hover */}
      {hovered && !clickedMeow && (
        <Html position={[0, 0.5, 0]} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'rgba(27, 23, 64, 0.94)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              lineHeight: '1.35',
              boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.18)',
              whiteSpace: 'nowrap',
              fontFamily: "'Nunito', sans-serif",
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 800, color: '#fbbf24', marginBottom: '1px' }}>
              Mochi 🐱
            </div>
            <div style={{ color: '#e2e8f0', fontSize: '10.5px' }}>
              {currentAction === 'sleep'
                ? 'Lagi tidur siang di karpet'
                : currentAction === 'clean'
                ? 'Lagi santai & jilat cakar'
                : currentAction === 'sit'
                ? 'Lagi noleh-noleh di ruang rapat'
                : 'Lagi keliling patroli kantor'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '9.5px', marginTop: '2px' }}>
              (Klik untuk elus!)
            </div>
          </div>
        </Html>
      )}
    </group>
  );
});

CatMochi.displayName = 'CatMochi';
export default CatMochi;