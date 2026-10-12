import React from 'react';
import { Html } from '@react-three/drei';

function TooltipTrigger({ name, role, task, position = [0, 1.2, 0] }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <group position={position}>
      {hovered && (
        <Html center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: '#2b2750',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              fontFamily: "'Nunito', sans-serif",
              transform: 'translateY(-20px)',
            }}
          >
            <b style={{ display: 'block', fontSize: '13px' }}>{name}</b>
            <span style={{ opacity: 0.85 }}>{role ? `${role} — ${task}` : task}</span>
          </div>
        </Html>
      )}
      <mesh
        visible={false}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.6, 1.5, 1.6]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

// Single Office Desk
function Desk({ position, rotation = [0, 0, 0], mugColor = '#f26a5b', hasPaper = true, label, role, task }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Table Top */}
      <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.08, 1.2]} />
        <meshStandardMaterial color="#e2ac72" roughness={0.7} />
      </mesh>

      {/* Legs (Left & Right panels) */}
      <mesh position={[-0.98, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.76, 1.05]} />
        <meshStandardMaterial color="#a8703f" roughness={0.8} />
      </mesh>
      <mesh position={[0.98, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.76, 1.05]} />
        <meshStandardMaterial color="#a8703f" roughness={0.8} />
      </mesh>
      {/* Back modesty panel */}
      <mesh position={[0, 0.45, -0.48]} castShadow>
        <boxGeometry args={[1.9, 0.45, 0.05]} />
        <meshStandardMaterial color="#a8703f" roughness={0.8} />
      </mesh>

      {/* Monitor */}
      <group position={[0, 0.8, -0.3]}>
        {/* Stand */}
        <mesh position={[0, 0.03, 0]} castShadow>
          <boxGeometry args={[0.3, 0.04, 0.2]} />
          <meshStandardMaterial color="#333" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.16, -0.05]} castShadow>
          <boxGeometry args={[0.06, 0.24, 0.05]} />
          <meshStandardMaterial color="#444" roughness={0.4} />
        </mesh>
        {/* Bezel */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[1.0, 0.58, 0.06]} />
          <meshStandardMaterial color="#262b40" roughness={0.3} />
        </mesh>
        {/* Screen with slight glow */}
        <mesh position={[0, 0.38, 0.032]}>
          <planeGeometry args={[0.92, 0.5]} />
          <meshStandardMaterial
            color="#58b9ff"
            emissive="#3888cc"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
        {/* Code lines on screen */}
        <mesh position={[-0.15, 0.46, 0.034]}>
          <planeGeometry args={[0.5, 0.03]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.1, 0.38, 0.034]}>
          <planeGeometry args={[0.6, 0.03]} />
          <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
        </mesh>
        <mesh position={[-0.2, 0.3, 0.034]}>
          <planeGeometry args={[0.4, 0.03]} />
          <meshBasicMaterial color="#a0e0ff" />
        </mesh>
      </group>

      {/* Keyboard */}
      <mesh position={[0, 0.81, 0.15]} castShadow>
        <boxGeometry args={[0.55, 0.02, 0.2]} />
        <meshStandardMaterial color="#f3f1ee" roughness={0.5} />
      </mesh>
      {/* Mousepad & Mouse */}
      <mesh position={[0.55, 0.805, 0.15]}>
        <boxGeometry args={[0.26, 0.005, 0.26]} />
        <meshStandardMaterial color="#3b4468" roughness={0.8} />
      </mesh>
      <mesh position={[0.55, 0.82, 0.15]} castShadow>
        <boxGeometry args={[0.1, 0.025, 0.14]} />
        <meshStandardMaterial color="#ddd" roughness={0.4} />
      </mesh>

      {/* Coffee Mug */}
      <group position={[-0.6, 0.8, 0.15]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.06, 0.16, 16]} />
          <meshStandardMaterial color={mugColor} roughness={0.3} />
        </mesh>
        {/* Coffee inside */}
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 16]} />
          <meshStandardMaterial color="#3a2215" roughness={0.2} />
        </mesh>
      </group>

      {/* Paper stacks */}
      {hasPaper && (
        <group position={[0.6, 0.81, -0.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.02, 0.4]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          <mesh position={[0.02, 0.02, -0.01]} rotation={[0, 0.08, 0]}>
            <boxGeometry args={[0.3, 0.015, 0.4]} />
            <meshStandardMaterial color="#fdfbf7" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Hover tooltip anchor */}
      {label && <TooltipTrigger name={label} role={role} task={task} position={[0, 1.0, 0]} />}
    </group>
  );
}

// Office Chair
function Chair({ position, rotation = [0, 0, 0], color = '#2fa7a0' }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Wheels Base */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 8]} />
        <meshStandardMaterial color="#444" roughness={0.5} />
      </mesh>
      {/* Central Pole */}
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.32, 12]} />
        <meshStandardMaterial color="#666" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Seat Cushion */}
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.09, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.74, 0.22]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.52, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

// Meeting Area Table + 6 Chairs
function MeetingArea({ position = [9.4, 0, 4.1] }) {
  const chairRadius = 1.6;
  const chairAngles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];

  return (
    <group position={position}>
      {/* Round Wooden Table Top */}
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.3, 1.3, 0.08, 32]} />
        <meshStandardMaterial color="#ecbf86" roughness={0.6} />
      </mesh>
      {/* Table Leg Base */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.35, 0.72, 16]} />
        <meshStandardMaterial color="#6b4f3a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.65, 0.65, 0.08, 24]} />
        <meshStandardMaterial color="#4a3a2e" roughness={0.7} />
      </mesh>

      {/* Laptops on table */}
      <group position={[-0.4, 0.83, -0.2]} rotation={[0, 0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.02, 0.3]} />
          <meshStandardMaterial color="#c9ccd6" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.14, -0.14]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.28, 0.02]} />
          <meshStandardMaterial color="#262b40" roughness={0.3} />
        </mesh>
        {/* glowing screen */}
        <mesh position={[0, 0.14, -0.128]} rotation={[-0.3, 0, 0]}>
          <planeGeometry args={[0.38, 0.24]} />
          <meshStandardMaterial color="#58b9ff" emissive="#3898ee" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Meeting documents */}
      <mesh position={[0.3, 0.83, 0.2]} rotation={[0, -0.5, 0]}>
        <boxGeometry args={[0.3, 0.015, 0.4]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Meeting Mugs */}
      <mesh position={[0.45, 0.88, -0.3]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.12, 12]} />
        <meshStandardMaterial color="#2fa7a0" />
      </mesh>
      <mesh position={[-0.2, 0.88, 0.4]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.12, 12]} />
        <meshStandardMaterial color="#d9674c" />
      </mesh>

      {/* Chairs around meeting table */}
      {chairAngles.map((angle, idx) => {
        const cx = Math.cos(angle) * chairRadius;
        const cz = Math.sin(angle) * chairRadius;
        return (
          <group key={idx} position={[cx, 0, cz]} rotation={[0, -angle - Math.PI / 2, 0]}>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.04, 8]} />
              <meshStandardMaterial color="#555" />
            </mesh>
            <mesh position={[0, 0.24, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.28, 8]} />
              <meshStandardMaterial color="#666" />
            </mesh>
            <mesh position={[0, 0.38, 0]} castShadow>
              <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
              <meshStandardMaterial color="#f26a5b" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.62, 0.18]} castShadow>
              <boxGeometry args={[0.36, 0.42, 0.06]} />
              <meshStandardMaterial color="#f26a5b" roughness={0.6} />
            </mesh>
          </group>
        );
      })}

      <TooltipTrigger
        name="Ruang Meeting"
        role="Area Diskusi"
        task="Sinkron mingguan dengan klien & tim"
        position={[0, 1.2, 0]}
      />
    </group>
  );
}

// Bookshelf with colorful books
function Bookshelf({ position = [0.4, 0, 0.8] }) {
  const colors = ['#f26a5b', '#2fa7a0', '#f2b84b', '#4a5fc1', '#8a63d2', '#3fae6a'];

  return (
    <group position={position}>
      {/* Wooden Main Frame */}
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 2.6, 1.4]} />
        <meshStandardMaterial color="#b98048" roughness={0.8} />
      </mesh>
      {/* Inner shelves cutout backing */}
      <mesh position={[0.02, 1.3, 0]}>
        <boxGeometry args={[0.66, 2.45, 1.3]} />
        <meshStandardMaterial color="#8a5a32" roughness={0.8} />
      </mesh>

      {/* 3 Shelves with books */}
      {[0.5, 1.2, 1.9].map((shelfY, sIdx) => (
        <group key={sIdx} position={[0.08, shelfY, 0]}>
          {Array.from({ length: 8 }).map((_, bIdx) => {
            const bWidth = 0.06 + (bIdx % 2) * 0.03;
            const bHeight = 0.32 + ((bIdx * 3) % 4) * 0.05;
            const bDepth = 0.45;
            const bZ = -0.48 + bIdx * 0.13;
            return (
              <mesh key={bIdx} position={[0.1, bHeight / 2, bZ]} castShadow>
                <boxGeometry args={[bDepth, bHeight, bWidth]} />
                <meshStandardMaterial
                  color={colors[(bIdx + sIdx * 2) % colors.length]}
                  roughness={0.5}
                />
              </mesh>
            );
          })}
        </group>
      ))}

      <TooltipTrigger
        name="Rak Arsip"
        role="Perpustakaan"
        task="Dokumen proyek & referensi desain"
        position={[0.4, 1.5, 0]}
      />
    </group>
  );
}

// Whiteboard on Back Wall
function Whiteboard({ position = [8.8, 2.3, 0.08] }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[3.4, 2.1, 0.06]} />
        <meshStandardMaterial color="#c4ccd8" roughness={0.4} />
      </mesh>
      {/* Board Surface */}
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[3.2, 1.9]} />
        <meshStandardMaterial color="#ffffff" roughness={0.15} />
      </mesh>
      {/* Marker Tray */}
      <mesh position={[0, -0.98, 0.06]} castShadow>
        <boxGeometry args={[3.2, 0.06, 0.12]} />
        <meshStandardMaterial color="#9aa3b4" roughness={0.4} />
      </mesh>

      {/* Colorful Sticky Notes */}
      <mesh position={[-1.0, 0.4, 0.036]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color="#2fa7a0" />
      </mesh>
      <mesh position={[-0.6, 0.4, 0.036]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color="#f26a5b" />
      </mesh>
      <mesh position={[-0.2, 0.4, 0.036]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color="#f2b84b" />
      </mesh>
      <mesh position={[0.7, 0.5, 0.036]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color="#ffe27a" />
      </mesh>
      <mesh position={[0.7, 0.1, 0.036]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color="#ff9f8a" />
      </mesh>
      <mesh position={[1.1, 0.5, 0.036]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color="#9ee3c0" />
      </mesh>

      {/* Chart lines */}
      <mesh position={[0.1, -0.3, 0.036]}>
        <planeGeometry args={[1.6, 0.03]} />
        <meshBasicMaterial color="#3b46c9" />
      </mesh>
      <mesh position={[0.1, -0.5, 0.036]}>
        <planeGeometry args={[1.2, 0.03]} />
        <meshBasicMaterial color="#8a63d2" />
      </mesh>

      <TooltipTrigger
        name="Papan Sprint"
        role="Roadmap"
        task="Rencana kerja & pembagian sprint minggu ini"
        position={[0, 0, 0.2]}
      />
    </group>
  );
}

// Wall Clock
function WallClock({ position = [6.6, 3.2, 0.05] }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.05, 32]} />
        <meshStandardMaterial color="#2d3a6b" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.028]}>
        <circleGeometry args={[0.28, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      {/* Hands */}
      <mesh position={[0, 0.08, 0.032]} rotation={[0, 0, -0.2]}>
        <planeGeometry args={[0.02, 0.16]} />
        <meshBasicMaterial color="#2d3a6b" />
      </mesh>
      <mesh position={[0.06, 0, 0.032]} rotation={[0, 0, -Math.PI / 2]}>
        <planeGeometry args={[0.02, 0.14]} />
        <meshBasicMaterial color="#f26a5b" />
      </mesh>
    </group>
  );
}

// Wall Poster
function WallPoster({ position = [11.2, 2.3, 0.05] }) {
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[0.9, 1.4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.2, 0.002]}>
        <planeGeometry args={[0.75, 0.8]} />
        <meshStandardMaterial color="#ffd9c9" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.35, 0.002]}>
        <planeGeometry args={[0.75, 0.3]} />
        <meshStandardMaterial color="#2fa7a0" roughness={0.4} />
      </mesh>
    </group>
  );
}

// Potted Plant (Monstera / Indoor Foliage)
function Plant({ position, scale = 1.0 }) {
  return (
    <group position={position} scale={scale}>
      {/* Terracotta Pot */}
      <mesh position={[0, 0.3 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.26 * scale, 0.2 * scale, 0.6 * scale, 16]} />
        <meshStandardMaterial color="#d9674c" roughness={0.8} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.58 * scale, 0]}>
        <cylinderGeometry args={[0.25 * scale, 0.25 * scale, 0.04 * scale, 16]} />
        <meshStandardMaterial color="#3b2b1e" roughness={0.9} />
      </mesh>
      {/* Foliage leaves */}
      {[-50, -25, 0, 25, 50].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const leafColor = i % 2 === 0 ? '#3fae6a' : '#2f9a5a';
        return (
          <group
            key={i}
            position={[0, 0.58 * scale, 0]}
            rotation={[0.3 * Math.sin(rad), rad, 0.4 * Math.cos(rad)]}
          >
            <mesh position={[0, 0.35 * scale, 0]} castShadow>
              <coneGeometry args={[0.18 * scale, 0.7 * scale, 6]} />
              <meshStandardMaterial color={leafColor} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Lounge Sofa & Coffee Table
function LoungeArea({ position = [9.9, 0, 7.8] }) {
  return (
    <group position={position}>
      {/* Main Couch Base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.5, 0.95]} />
        <meshStandardMaterial color="#4a5fc1" roughness={0.7} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.65, 0.35]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.6, 0.3]} />
        <meshStandardMaterial color="#3c4faa" roughness={0.7} />
      </mesh>
      {/* Left Armrest */}
      <mesh position={[-1.1, 0.45, 0]} castShadow>
        <boxGeometry args={[0.22, 0.45, 0.95]} />
        <meshStandardMaterial color="#3c4faa" roughness={0.7} />
      </mesh>
      {/* Right Armrest */}
      <mesh position={[1.1, 0.45, 0]} castShadow>
        <boxGeometry args={[0.22, 0.45, 0.95]} />
        <meshStandardMaterial color="#3c4faa" roughness={0.7} />
      </mesh>
      {/* Yellow Throw Pillow */}
      <mesh position={[0.65, 0.45, 0.15]} rotation={[0.2, 0.4, 0]} castShadow>
        <boxGeometry args={[0.42, 0.4, 0.14]} />
        <meshStandardMaterial color="#f2b84b" roughness={0.6} />
      </mesh>

      {/* Coffee Table */}
      <group position={[0, 0, -0.9]}>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.06, 24]} />
          <meshStandardMaterial color="#e2ac72" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.11, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.18, 0.22, 12]} />
          <meshStandardMaterial color="#8a5a2b" roughness={0.7} />
        </mesh>
      </group>

      <TooltipTrigger
        name="Area Santai"
        role="Lounge"
        task="Istirahat 5 menit, ngopi, dan obrolan santai"
        position={[0, 1.0, 0]}
      />
    </group>
  );
}

// Printer Cabinet
function PrinterCabinet({ position = [0.5, 0, 7.4] }) {
  return (
    <group position={position}>
      {/* Cabinet Body */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.1, 1.2]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.7} />
      </mesh>
      {/* Handles */}
      <mesh position={[0.41, 0.65, -0.2]}>
        <boxGeometry args={[0.02, 0.12, 0.04]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>
      <mesh position={[0.41, 0.65, 0.2]}>
        <boxGeometry args={[0.02, 0.12, 0.04]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>

      {/* Printer Machine */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[0.65, 0.3, 0.85]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      {/* Paper tray output */}
      <mesh position={[0.1, 1.42, 0]} castShadow>
        <boxGeometry args={[0.35, 0.04, 0.45]} />
        <meshStandardMaterial color="#e5e5e5" />
      </mesh>

      <TooltipTrigger
        name="Printer & Lemari"
        role="Peralatan Kantor"
        task="Cetak kontrak, scan berkas, arsip formulir"
        position={[0, 1.4, 0]}
      />
    </group>
  );
}

// Pantry & Water Dispenser
function PantryCorner({ position = [2.0, 0, 8.4] }) {
  return (
    <group position={position}>
      {/* Pantry Counter Cabinet */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.9, 0.6]} />
        <meshStandardMaterial color="#e9eef7" roughness={0.6} />
      </mesh>
      {/* Water Dispenser Base */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.35, 0.3, 0.35]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Blue Water Gallon */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.38, 16]} />
        <meshStandardMaterial
          color="#8fd3ff"
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      <TooltipTrigger
        name="Pantry"
        role="Area Minum"
        task="Isi ulang air mineral, teh hangat, dan kopi segar"
        position={[0, 1.4, 0]}
      />
    </group>
  );
}

/**
 * Main Furniture Component
 * Combines all office furniture into a single high-performance static scene graph.
 */
export const Furniture = React.memo(function Furniture() {
  return (
    <group>
      {/* Desk 1: Rina */}
      <Desk
        position={[2.3, 0, 2.2]}
        mugColor="#f26a5b"
        hasPaper={true}
        label="Meja 01 — Rina"
        role="Akuntan"
        task="Mengetik laporan bulanan & verifikasi invoice"
      />
      <Chair position={[2.3, 0, 2.75]} color="#2fa7a0" />

      {/* Desk 2: Eko */}
      <Desk
        position={[2.3, 0, 5.5]}
        mugColor="#4a5fc1"
        hasPaper={false}
        label="Meja 02 — Eko"
        role="Admin"
        task="Sedang berkeliling mengantar dokumen"
      />
      <Chair position={[2.3, 0, 6.05]} color="#f2b84b" />

      {/* Desk 3: Dimas */}
      <Desk
        position={[5.8, 0, 2.2]}
        mugColor="#f26a5b"
        hasPaper={true}
        label="Meja 03 — Dimas"
        role="Desainer"
        task="Menyusun mockup UI/UX versi 3"
      />
      <Chair position={[5.8, 0, 2.75]} color="#f26a5b" />

      {/* Meeting Area */}
      <MeetingArea position={[9.4, 0, 4.1]} />

      {/* Bookshelf */}
      <Bookshelf position={[0.4, 0, 0.8]} />

      {/* Whiteboard */}
      <Whiteboard position={[8.8, 2.3, 0.05]} />

      {/* Wall Clock */}
      <WallClock position={[6.6, 3.2, 0.05]} />

      {/* Wall Poster */}
      <WallPoster position={[11.2, 2.3, 0.05]} />

      {/* Plants */}
      <Plant position={[11.4, 0, 0.8]} scale={1.2} />
      <Plant position={[11.3, 0, 8.4]} scale={1.0} />
      <Plant position={[6.3, 0, 8.5]} scale={0.85} />

      {/* Lounge Sofa */}
      <LoungeArea position={[9.9, 0, 7.8]} />

      {/* Printer Cabinet */}
      <PrinterCabinet position={[0.5, 0, 7.4]} />

      {/* Pantry */}
      <PantryCorner position={[2.0, 0, 8.4]} />
    </group>
  );
});

export default Furniture;
