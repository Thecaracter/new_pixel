import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Character } from './Character';
import { SpeechBubble } from './SpeechBubble';

/**
 * Speech bubbles dialogues in Indonesian for all characters
 */
export const KALIMAT = {
  rina: ['Laporan bulan ini hampir beres!', 'Tinggal cek angka terakhir.', 'Kopi dulu, lanjut lagi.'],
  dimas: ['Warnanya kurang pop ya?', 'Mockup versi 3 siap!', 'Minta feedback dong.'],
  eko: ['Dokumen buat Pak Arif!', 'Permisi, numpang lewat.', 'Ambil air dulu ya.'],
  bayu: ['Rilis kita geser ke Jumat?', 'Fitur login sudah aman.', 'Cek timeline lagi yuk.'],
  sinta: ['Kampanye tayang besok.', 'Budget iklan masih cukup.', 'Setuju, mulai Senin!'],
  mira: ['Baik Pak, saya kirim ulang.', 'Penawarannya sudah saya cek.', 'Terima kasih waktunya!'],
  arif: ['Sprint ini ada 3 target.', 'Prioritas: onboarding dulu.', 'Ada yang mau nambah?'],
};

/**
 * Eko (Walker) Component
 * Walks smoothly along the wide, obstacle-free central hallway corridor:
 * - A: [8.8, 0, 2.2] (Near Workstation wing & Glass Meeting Room entrance)
 * - B: [8.8, 0, 7.2] (Near Breakout Lounge & Coffee Bar area)
 * Has complete obstacle clearance: avoids all desks, chairs, partitions, and plants!
 */
function EkoWalker() {
  const groupRef = useRef();
  const [isMoving, setIsMoving] = React.useState(true);
  const A = [8.8, 0, 2.2];
  const B = [8.8, 0, 7.2];

  const angleForward = Math.atan2(B[0] - A[0], B[2] - A[2]); // 0 (faces South towards Lounge)
  const angleBackward = Math.atan2(A[0] - B[0], A[2] - B[2]); // Math.PI (faces North towards Workstations)

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const cycle = t % 14;

    let f = 0;
    let walking = true;
    let angle = angleForward;

    if (cycle < 6) {
      // Walking South from A to B
      f = cycle / 6;
      angle = angleForward;
      walking = true;
    } else if (cycle < 7) {
      // Pausing at B and turning around
      f = 1;
      angle = angleBackward;
      walking = false;
    } else if (cycle < 13) {
      // Walking North from B to A
      f = 1 - (cycle - 7) / 6;
      angle = angleBackward;
      walking = true;
    } else {
      // Pausing at A and turning around
      f = 0;
      angle = angleForward;
      walking = false;
    }

    const curX = A[0] + (B[0] - A[0]) * f;
    const curZ = A[2] + (B[2] - A[2]) * f;

    groupRef.current.position.set(curX, 0, curZ);
    groupRef.current.rotation.y = angle;

    if (walking !== isMoving) {
      setIsMoving(walking);
    }
  });

  return (
    <group ref={groupRef} position={A}>
      <Character
        position={[0, 0, 0]}
        activity="walking"
        isWalking={isMoving}
        skinColor="#c68f64"
        hairColor="#2a2236"
        shirtColor="#2f9a92"
        pantsColor="#3b4468"
        sitting={false}
        lookDirection={0}
        name="Eko"
        tip="Eko – Admin | Mengantar dokumen antar meja"
      />
      <SpeechBubble characterId="eko" position={[0, 2.2, 0]} delay={1200} />
    </group>
  );
}

/**
 * Arif (Project Lead Routine)
 * Dynamically moves between Whiteboard and Meeting Table:
 * - 0s..12s: Writing sprint goals on whiteboard [13.2, 0, 1.1]
 * - 12s..15s: Walks down to meeting table [13.2, 0, 2.1]
 * - 15s..24s: Briefs and explains sprint to Mira at meeting table
 * - 24s..27s: Walks back to whiteboard [13.2, 0, 1.1]
 */
function ArifRoutine({ member }) {
  const groupRef = useRef();
  const [animState, setAnimState] = React.useState({
    sitting: false,
    activity: 'writing',
    isWalking: false,
    lookDirection: Math.PI,
  });

  const boardPos = [13.2, 0, 1.1];
  const tablePos = [13.2, 0, 2.1];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const cycle = t % 28;

    if (cycle < 12) {
      // 1. Writing on Whiteboard
      groupRef.current.position.set(boardPos[0], 0, boardPos[2]);
      setAnimState((prev) =>
        prev.activity === 'writing' && prev.lookDirection === Math.PI && !prev.isWalking
          ? prev
          : { sitting: false, activity: 'writing', isWalking: false, lookDirection: Math.PI }
      );
    } else if (cycle < 15) {
      // 2. Walking towards Meeting Table
      const f = (cycle - 12) / 3;
      const curZ = boardPos[2] + (tablePos[2] - boardPos[2]) * f;
      groupRef.current.position.set(boardPos[0], 0, curZ);
      setAnimState((prev) =>
        prev.activity === 'walking' && prev.isWalking && prev.lookDirection === 0
          ? prev
          : { sitting: false, activity: 'walking', isWalking: true, lookDirection: 0 }
      );
    } else if (cycle < 24) {
      // 3. Explaining & Discussing with Mira at Meeting Table
      groupRef.current.position.set(tablePos[0], 0, tablePos[2]);
      setAnimState((prev) =>
        prev.activity === 'talking' && !prev.isWalking && prev.lookDirection === -Math.PI * 0.75
          ? prev
          : { sitting: false, activity: 'talking', isWalking: false, lookDirection: -Math.PI * 0.75 }
      );
    } else {
      // 4. Walking back towards Whiteboard
      const f = (cycle - 24) / 3;
      const curZ = tablePos[2] + (boardPos[2] - tablePos[2]) * f;
      groupRef.current.position.set(boardPos[0], 0, curZ);
      setAnimState((prev) =>
        prev.activity === 'walking' && prev.isWalking && prev.lookDirection === Math.PI
          ? prev
          : { sitting: false, activity: 'walking', isWalking: true, lookDirection: Math.PI }
      );
    }
  });

  return (
    <group ref={groupRef} position={boardPos}>
      <Character
        position={[0, 0, 0]}
        sitting={animState.sitting}
        activity={animState.activity}
        isWalking={animState.isWalking}
        lookDirection={animState.lookDirection}
        skinColor={member?.skinColor || "#f2c9a0"}
        hairColor={member?.hairColor || "#2a2236"}
        shirtColor={member?.shirtColor || "#4a5fc1"}
        pantsColor={member?.pantsColor || "#2f3558"}
        name={member?.name || "Arif"}
        tip={`${member?.name || 'Arif'} – ${member?.role || 'Project Lead'} | ${member?.description || 'Menulis & koordinasi sprint'}`}
      />
      <SpeechBubble characterId="arif" position={[0, 2.2, 0]} delay={1600} />
    </group>
  );
}

/**
 * Sinta (Marketing Routine)
 * Dynamically roams between Breakout Lounge and Pantry:
 * - 0s..14s: Relaxing & discussing on Lounge Sofa [12.5, 0, 8.7]
 * - 14s..20s: Stands up and walks through corridor to Pantry Cafe [3.6, 0, 8.6]
 * - 20s..28s: Enjoys coffee & chatting by the pantry counter [3.6, 0, 8.6]
 * - 28s..34s: Walks back through corridor to Lounge [12.5, 0, 8.7]
 * - 34s..36s: Sits back down on sofa
 */
function SintaRoutine({ member }) {
  const groupRef = useRef();
  const [animState, setAnimState] = React.useState({
    sitting: true,
    activity: 'talking',
    isWalking: false,
    lookDirection: Math.PI,
  });

  const loungePos = [12.5, 0, 8.7];
  const midPos = [9.0, 0, 8.0];
  const pantryPos = [3.6, 0, 8.6];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const cycle = t % 36;

    if (cycle < 14) {
      // 1. Sitting on Lounge Sofa
      groupRef.current.position.set(loungePos[0], 0, loungePos[2]);
      setAnimState((prev) =>
        prev.sitting && prev.activity === 'talking'
          ? prev
          : { sitting: true, activity: 'talking', isWalking: false, lookDirection: Math.PI }
      );
    } else if (cycle < 17) {
      // 2. Walking from Lounge to Corridor
      const f = (cycle - 14) / 3;
      const curX = loungePos[0] + (midPos[0] - loungePos[0]) * f;
      const curZ = loungePos[2] + (midPos[2] - loungePos[2]) * f;
      const angle = Math.atan2(midPos[0] - loungePos[0], midPos[2] - loungePos[2]);
      groupRef.current.position.set(curX, 0, curZ);
      setAnimState((prev) =>
        !prev.sitting && prev.activity === 'walking' && prev.isWalking && prev.lookDirection === angle
          ? prev
          : { sitting: false, activity: 'walking', isWalking: true, lookDirection: angle }
      );
    } else if (cycle < 20) {
      // 3. Walking from Corridor to Pantry Counter
      const f = (cycle - 17) / 3;
      const curX = midPos[0] + (pantryPos[0] - midPos[0]) * f;
      const curZ = midPos[2] + (pantryPos[2] - midPos[2]) * f;
      const angle = Math.atan2(pantryPos[0] - midPos[0], pantryPos[2] - midPos[2]);
      groupRef.current.position.set(curX, 0, curZ);
      setAnimState((prev) =>
        !prev.sitting && prev.activity === 'walking' && prev.isWalking && prev.lookDirection === angle
          ? prev
          : { sitting: false, activity: 'walking', isWalking: true, lookDirection: angle }
      );
    } else if (cycle < 28) {
      // 4. Standing at Pantry Counter enjoying warm drink
      groupRef.current.position.set(pantryPos[0], 0, pantryPos[2]);
      setAnimState((prev) =>
        !prev.sitting && prev.activity === 'talking' && !prev.isWalking && prev.lookDirection === Math.PI
          ? prev
          : { sitting: false, activity: 'talking', isWalking: false, lookDirection: Math.PI }
      );
    } else if (cycle < 31) {
      // 5. Walking back from Pantry towards Corridor
      const f = (cycle - 28) / 3;
      const curX = pantryPos[0] + (midPos[0] - pantryPos[0]) * f;
      const curZ = pantryPos[2] + (midPos[2] - pantryPos[2]) * f;
      const angle = Math.atan2(midPos[0] - pantryPos[0], midPos[2] - pantryPos[2]);
      groupRef.current.position.set(curX, 0, curZ);
      setAnimState((prev) =>
        !prev.sitting && prev.activity === 'walking' && prev.isWalking && prev.lookDirection === angle
          ? prev
          : { sitting: false, activity: 'walking', isWalking: true, lookDirection: angle }
      );
    } else if (cycle < 34) {
      // 6. Walking from Corridor to Lounge Sofa
      const f = (cycle - 31) / 3;
      const curX = midPos[0] + (loungePos[0] - midPos[0]) * f;
      const curZ = midPos[2] + (loungePos[2] - midPos[2]) * f;
      const angle = Math.atan2(loungePos[0] - midPos[0], loungePos[2] - midPos[2]);
      groupRef.current.position.set(curX, 0, curZ);
      setAnimState((prev) =>
        !prev.sitting && prev.activity === 'walking' && prev.isWalking && prev.lookDirection === angle
          ? prev
          : { sitting: false, activity: 'walking', isWalking: true, lookDirection: angle }
      );
    } else {
      // 7. Sits back down on Lounge Sofa
      groupRef.current.position.set(loungePos[0], 0, loungePos[2]);
      setAnimState((prev) =>
        prev.sitting && prev.activity === 'talking'
          ? prev
          : { sitting: true, activity: 'talking', isWalking: false, lookDirection: Math.PI }
      );
    }
  });

  return (
    <group ref={groupRef} position={loungePos}>
      <Character
        position={[0, 0, 0]}
        sitting={animState.sitting}
        activity={animState.activity}
        isWalking={animState.isWalking}
        lookDirection={animState.lookDirection}
        skinColor={member?.skinColor || "#f2c9a0"}
        hairColor={member?.hairColor || "#5a3425"}
        shirtColor={member?.shirtColor || "#8a63d2"}
        pantsColor={member?.pantsColor || "#2f3558"}
        longHair={true}
        name={member?.name || "Sinta"}
        tip={`${member?.name || 'Sinta'} – ${member?.role || 'Marketing'} | ${member?.description || 'Berdiskusi kampanye & ngopi di pantry'}`}
      />
      <SpeechBubble characterId="sinta" position={[0, animState.sitting ? 1.9 : 2.2, 0]} delay={3200} />
    </group>
  );
}

/**
 * Bayu (Frontend Developer Routine)
 * Coding at desk, occasionally stands up to stretch legs by corridor:
 * - 0s..20s: Coding at desk [2.6, 0, 5.55]
 * - 20s..23s: Stands and steps to corridor [3.6, 0, 6.2]
 * - 23s..27s: Stretches & looks around [3.6, 0, 6.2]
 * - 27s..30s: Returns to desk chair and sits down
 */
function BayuRoutine({ member }) {
  const groupRef = useRef();
  const [animState, setAnimState] = React.useState({
    sitting: true,
    activity: 'typing',
    isWalking: false,
    lookDirection: Math.PI,
  });

  const deskPos = [2.6, 0, 5.55];
  const stretchPos = [3.6, 0, 6.2];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const cycle = t % 32;

    if (cycle < 20) {
      groupRef.current.position.set(deskPos[0], 0, deskPos[2]);
      setAnimState((prev) =>
        prev.sitting && prev.activity === 'typing'
          ? prev
          : { sitting: true, activity: 'typing', isWalking: false, lookDirection: Math.PI }
      );
    } else if (cycle < 23) {
      const f = (cycle - 20) / 3;
      const curX = deskPos[0] + (stretchPos[0] - deskPos[0]) * f;
      const curZ = deskPos[2] + (stretchPos[2] - deskPos[2]) * f;
      const angle = Math.atan2(stretchPos[0] - deskPos[0], stretchPos[2] - deskPos[2]);
      groupRef.current.position.set(curX, 0, curZ);
      setAnimState((prev) =>
        !prev.sitting && prev.activity === 'walking' && prev.isWalking && prev.lookDirection === angle
          ? prev
          : { sitting: false, activity: 'walking', isWalking: true, lookDirection: angle }
      );
    } else if (cycle < 27) {
      groupRef.current.position.set(stretchPos[0], 0, stretchPos[2]);
      setAnimState((prev) =>
        !prev.sitting && prev.activity === 'talking' && !prev.isWalking && prev.lookDirection === 0
          ? prev
          : { sitting: false, activity: 'talking', isWalking: false, lookDirection: 0 }
      );
    } else if (cycle < 30) {
      const f = (cycle - 27) / 3;
      const curX = stretchPos[0] + (deskPos[0] - stretchPos[0]) * f;
      const curZ = stretchPos[2] + (deskPos[2] - stretchPos[2]) * f;
      const angle = Math.atan2(deskPos[0] - stretchPos[0], deskPos[2] - stretchPos[2]);
      groupRef.current.position.set(curX, 0, curZ);
      setAnimState((prev) =>
        !prev.sitting && prev.activity === 'walking' && prev.isWalking && prev.lookDirection === angle
          ? prev
          : { sitting: false, activity: 'walking', isWalking: true, lookDirection: angle }
      );
    } else {
      groupRef.current.position.set(deskPos[0], 0, deskPos[2]);
      setAnimState((prev) =>
        prev.sitting && prev.activity === 'typing'
          ? prev
          : { sitting: true, activity: 'typing', isWalking: false, lookDirection: Math.PI }
      );
    }
  });

  return (
    <group ref={groupRef} position={deskPos}>
      <Character
        position={[0, 0, 0]}
        sitting={animState.sitting}
        activity={animState.activity}
        isWalking={animState.isWalking}
        lookDirection={animState.lookDirection}
        skinColor={member?.skinColor || "#d9a273"}
        hairColor={member?.hairColor || "#2a2236"}
        shirtColor={member?.shirtColor || "#f26a5b"}
        pantsColor={member?.pantsColor || "#3b4468"}
        name={member?.name || "Bayu"}
        tip={`${member?.name || 'Bayu'} – ${member?.role || 'Product'} | ${member?.description || 'Mengembangkan fitur aplikasi'}`}
      />
      <SpeechBubble characterId="bayu" position={[0, animState.sitting ? 1.9 : 2.2, 0]} delay={2400} />
    </group>
  );
}

// Extra spots for newly added team members in the spacious partitioned office
const EXTRA_SPOTS = [
  // Spot 1: Shared Workstation Desk 4
  { position: [6.6, 0, 5.55], sitting: true, lookDirection: Math.PI, activity: 'typing' },
  // Spot 2: Meeting Table East Chair (inside Glass Meeting Room)
  { position: [14.8, 0, 3.4], sitting: true, lookDirection: -Math.PI / 2, activity: 'phone' },
  // Spot 3: Meeting Table North-West Chair (inside Glass Meeting Room)
  { position: [12.4, 0, 2.01], sitting: true, lookDirection: 0.5236, activity: 'typing' },
  // Spot 4: Meeting Table South-West Chair (inside Glass Meeting Room)
  { position: [12.4, 0, 4.79], sitting: true, lookDirection: 2.618, activity: 'phone' },
  // Spot 5: Coffee counter / pantry
  { position: [3.8, 0, 9.4], sitting: false, lookDirection: -Math.PI * 0.4, activity: 'talking' },
  // Spot 6: Bookshelf / reading nook
  { position: [0.8, 0, 1.8], sitting: false, lookDirection: Math.PI * 0.8, activity: 'writing' },
];

/**
 * Characters Group Component
 * Dynamically instantiates office characters based on active teamMembers roster
 */
export const Characters = React.memo(function Characters({ teamMembers = [] }) {
  // Map members by lowercase ID
  const memberMap = React.useMemo(() => {
    const map = {};
    if (Array.isArray(teamMembers)) {
      teamMembers.forEach(m => {
        if (m && m.id) {
          map[m.id.toLowerCase()] = m;
        }
      });
    }
    return map;
  }, [teamMembers]);

  const hasLoaded = Array.isArray(teamMembers) && teamMembers.length > 0;

  // Active status checks (defaults to true if roster not loaded yet)
  const rina = memberMap['rina'];
  const isRinaActive = hasLoaded ? (rina ? rina.active !== false : false) : true;

  const dimas = memberMap['dimas'];
  const isDimasActive = hasLoaded ? (dimas ? dimas.active !== false : false) : true;

  const eko = memberMap['eko'];
  const isEkoActive = hasLoaded ? (eko ? eko.active !== false : false) : true;

  const arif = memberMap['arif'];
  const isArifActive = hasLoaded ? (arif ? arif.active !== false : false) : true;

  const bayu = memberMap['bayu'];
  const isBayuActive = hasLoaded ? (bayu ? bayu.active !== false : false) : true;

  const sinta = memberMap['sinta'];
  const isSintaActive = hasLoaded ? (sinta ? sinta.active !== false : false) : true;

  const mira = memberMap['mira'];
  const isMiraActive = hasLoaded ? (mira ? mira.active !== false : false) : true;

  // Filter custom added members (not part of the default 7) that are active
  const standardIds = ['rina', 'dimas', 'eko', 'arif', 'bayu', 'sinta', 'mira'];
  const customMembers = hasLoaded
    ? teamMembers.filter(m => m && m.id && !standardIds.includes(m.id.toLowerCase()) && m.active !== false)
    : [];

  return (
    <group name="office-characters">
      {/* 1. Rina - Seated at Desk 1 (Workstation Wing) */}
      {isRinaActive && (
        <group position={[2.6, 0, 2.95]}>
          <Character
            position={[0, 0, 0]}
            sitting={true}
            activity="typing"
            lookDirection={Math.PI}
            skinColor={rina?.skinColor || "#f2c9a0"}
            hairColor={rina?.hairColor || "#3a2a24"}
            shirtColor={rina?.shirtColor || "#2fa7a0"}
            pantsColor={rina?.pantsColor || "#3b4468"}
            name={rina?.name || "Rina"}
            tip={`${rina?.name || 'Rina'} – ${rina?.role || 'Akuntan'} | ${rina?.description || 'Mengetik laporan bulanan'}`}
          />
          <SpeechBubble characterId="rina" position={[0, 1.9, 0]} delay={0} />
        </group>
      )}

      {/* 2. Dimas - Seated at Desk 2 (Workstation Wing) */}
      {isDimasActive && (
        <group position={[6.6, 0, 2.95]}>
          <Character
            position={[0, 0, 0]}
            sitting={true}
            activity="typing"
            lookDirection={Math.PI}
            skinColor={dimas?.skinColor || "#d9a273"}
            hairColor={dimas?.hairColor || "#1f1b2e"}
            shirtColor={dimas?.shirtColor || "#8a63d2"}
            pantsColor={dimas?.pantsColor || "#3b4468"}
            name={dimas?.name || "Dimas"}
            tip={`${dimas?.name || 'Dimas'} – ${dimas?.role || 'Desainer'} | ${dimas?.description || 'Menyusun mockup'}`}
          />
          <SpeechBubble characterId="dimas" position={[0, 1.9, 0]} delay={800} />
        </group>
      )}

      {/* 3. Eko - Walker across central hallway */}
      {isEkoActive && <EkoWalker />}

      {/* 4. Arif - Project Lead Routine (Whiteboard & Meeting Discussion) */}
      {isArifActive && <ArifRoutine member={arif} />}

      {/* 5. Bayu - Product Developer Routine (Desk & Stretch Walk) */}
      {isBayuActive && <BayuRoutine member={bayu} />}

      {/* 6. Sinta - Marketing Lead Routine (Lounge & Pantry Coffee Walk) */}
      {isSintaActive && <SintaRoutine member={sinta} />}

      {/* 7. Mira - Seated at Meeting Table in Glass Meeting Room */}
      {isMiraActive && (
        <group position={[11.6, 0, 3.4]}>
          <Character
            position={[0, 0, 0]}
            sitting={true}
            activity="phone"
            lookDirection={Math.PI / 2}
            skinColor={mira?.skinColor || "#f2c9a0"}
            hairColor={mira?.hairColor || "#4a2c2a"}
            shirtColor={mira?.shirtColor || "#f2b84b"}
            pantsColor={mira?.pantsColor || "#3b4468"}
            longHair={true}
            name={mira?.name || "Mira"}
            tip={`${mira?.name || 'Mira'} – ${mira?.role || 'Sales'} | ${mira?.description || 'Telepon dengan klien di ruang rapat'}`}
          />
          <SpeechBubble characterId="mira" position={[0, 1.9, 0]} delay={4000} />
        </group>
      )}

      {/* Custom newly added members rendered at extra spots */}
      {customMembers.map((member, idx) => {
        const spot = EXTRA_SPOTS[idx % EXTRA_SPOTS.length];
        return (
          <group key={member.id} position={spot.position}>
            <Character
              position={[0, 0, 0]}
              sitting={spot.sitting}
              activity={spot.activity}
              lookDirection={spot.lookDirection}
              skinColor={member.skinColor || "#f2c9a0"}
              hairColor={member.hairColor || "#2a2236"}
              shirtColor={member.shirtColor || "#38bdf8"}
              pantsColor={member.pantsColor || "#334155"}
              name={member.name}
              tip={`${member.name} – ${member.role} | ${member.description || 'Bertugas di kantor virtual'}`}
            />
          </group>
        );
      })}
    </group>
  );
});

Characters.displayName = 'Characters';
export default Characters;
