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

      {/* 4. Arif - Project Lead at Whiteboard inside Glass Meeting Room */}
      {isArifActive && (
        <group position={[13.2, 0, 1.2]}>
          <Character
            position={[0, 0, 0]}
            sitting={false}
            activity="writing"
            lookDirection={Math.PI}
            skinColor={arif?.skinColor || "#f2c9a0"}
            hairColor={arif?.hairColor || "#2a2236"}
            shirtColor={arif?.shirtColor || "#4a5fc1"}
            pantsColor={arif?.pantsColor || "#2f3558"}
            name={arif?.name || "Arif"}
            tip={`${arif?.name || 'Arif'} – ${arif?.role || 'Project Lead'} | ${arif?.description || 'Menulis rencana sprint di papan'}`}
          />
          <SpeechBubble characterId="arif" position={[0, 2.2, 0]} delay={1600} />
        </group>
      )}

      {/* 5. Bayu - Seated at Desk 3 (Workstation Wing) */}
      {isBayuActive && (
        <group position={[2.6, 0, 5.55]}>
          <Character
            position={[0, 0, 0]}
            sitting={true}
            activity="typing"
            lookDirection={Math.PI}
            skinColor={bayu?.skinColor || "#d9a273"}
            hairColor={bayu?.hairColor || "#2a2236"}
            shirtColor={bayu?.shirtColor || "#f26a5b"}
            pantsColor={bayu?.pantsColor || "#3b4468"}
            name={bayu?.name || "Bayu"}
            tip={`${bayu?.name || 'Bayu'} – ${bayu?.role || 'Product'} | ${bayu?.description || 'Mengembangkan fitur aplikasi'}`}
          />
          <SpeechBubble characterId="bayu" position={[0, 1.9, 0]} delay={2400} />
        </group>
      )}

      {/* 6. Sinta - Relaxing/Brainstorming in Breakout Lounge */}
      {isSintaActive && (
        <group position={[12.5, 0, 8.7]}>
          <Character
            position={[0, 0, 0]}
            sitting={true}
            activity="talking"
            lookDirection={Math.PI}
            skinColor={sinta?.skinColor || "#f2c9a0"}
            hairColor={sinta?.hairColor || "#5a3425"}
            shirtColor={sinta?.shirtColor || "#8a63d2"}
            pantsColor={sinta?.pantsColor || "#2f3558"}
            longHair={true}
            name={sinta?.name || "Sinta"}
            tip={`${sinta?.name || 'Sinta'} – ${sinta?.role || 'Marketing'} | ${sinta?.description || 'Berdiskusi strategi kampanye di lounge'}`}
          />
          <SpeechBubble characterId="sinta" position={[0, 1.9, 0]} delay={3200} />
        </group>
      )}

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
