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
 * Walks back and forth between [4.1, 0, 3.4] and [3.0, 0, 8.0] over 12 seconds:
 * - 0s..5s: walks from A to B (5s)
 * - 5s..6s: pauses at B (1s)
 * - 6s..11s: walks from B to A (5s)
 * - 11s..12s: pauses at A (1s)
 */
function EkoWalker() {
  const groupRef = useRef();
  const [isMoving, setIsMoving] = React.useState(true);
  const A = [4.1, 0, 3.4];
  const B = [3.0, 0, 8.0];

  const angleForward = Math.atan2(B[0] - A[0], B[2] - A[2]);
  const angleBackward = Math.atan2(A[0] - B[0], A[2] - B[2]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const cycle = t % 14;

    let f = 0;
    let walking = true;
    let angle = angleForward;

    if (cycle < 6) {
      f = cycle / 6;
      angle = angleForward;
      walking = true;
    } else if (cycle < 7) {
      f = 1;
      angle = angleForward;
      walking = false;
    } else if (cycle < 13) {
      f = 1 - (cycle - 7) / 6;
      angle = angleBackward;
      walking = true;
    } else {
      f = 0;
      angle = angleBackward;
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
 * Characters Group Component
 * Instantiates all 7 office characters + walker Eko
 */
export const Characters = React.memo(function Characters() {
  // Meeting area Mira position:
  // Meeting table center C = [9.4, 4.1], Mira chair at 160 deg, radius 1.9
  // x = 9.4 + 1.9 * cos(160 * pi / 180) = 9.4 + 1.9 * (-0.93969) ≈ 7.615
  // z = 4.1 + 1.9 * sin(160 * pi / 180) = 4.1 + 1.9 * (0.34202) ≈ 4.750
  // Mira faces towards table center [9.4, 4.1] or slight angled:
  // dx = 9.4 - 7.615 = 1.785, dz = 4.1 - 4.75 = -0.65 => angle ≈ Math.atan2(1.785, -0.65)
  const miraAngle = Math.atan2(9.4 - 7.615, 4.1 - 4.750);

  return (
    <group name="office-characters">
      {/* 1. Rina */}
      <group position={[2.3, 0, 2.65]}>
        <Character
          position={[0, 0, 0]}
          sitting={true}
          activity="typing"
          lookDirection={Math.PI}
          skinColor="#f2c9a0"
          hairColor="#3a2a24"
          shirtColor="#2fa7a0"
          pantsColor="#3b4468"
          name="Rina"
          tip="Rina – Akuntan | Mengetik laporan bulanan"
        />
        <SpeechBubble characterId="rina" position={[0, 1.8, 0]} delay={0} />
      </group>

      {/* 2. Dimas */}
      <group position={[5.8, 0, 2.65]}>
        <Character
          position={[0, 0, 0]}
          sitting={true}
          activity="typing"
          lookDirection={Math.PI}
          skinColor="#d9a273"
          hairColor="#1f1b2e"
          shirtColor="#8a63d2"
          pantsColor="#3b4468"
          name="Dimas"
          tip="Dimas – Desainer | Menyusun mockup"
        />
        <SpeechBubble characterId="dimas" position={[0, 1.8, 0]} delay={800} />
      </group>

      {/* 3. Eko - Walker */}
      <EkoWalker />

      {/* 4. Arif */}
      <group position={[8.9, 0, 0.55]}>
        <Character
          position={[0, 0, 0]}
          sitting={false}
          activity="writing"
          lookDirection={Math.PI}
          skinColor="#f2c9a0"
          hairColor="#2a2236"
          shirtColor="#4a5fc1"
          pantsColor="#2f3558"
          name="Arif"
          tip="Arif – Project Lead | Menulis rencana sprint di papan"
        />
        <SpeechBubble characterId="arif" position={[0, 2.2, 0]} delay={1600} />
      </group>

      {/* 5. Bayu */}
      <group position={[5.4, 0, 6.1]}>
        <Character
          position={[0, 0, 0]}
          sitting={false}
          activity="talking"
          lookDirection={Math.PI / 4}
          skinColor="#d9a273"
          hairColor="#2a2236"
          shirtColor="#f26a5b"
          pantsColor="#3b4468"
          name="Bayu"
          tip="Bayu – Product | Berdiskusi soal jadwal rilis"
        />
        <SpeechBubble characterId="bayu" position={[0, 2.2, 0]} delay={2400} />
      </group>

      {/* 6. Sinta */}
      <group position={[6.7, 0, 6.4]}>
        <Character
          position={[0, 0, 0]}
          sitting={false}
          activity="talking"
          lookDirection={-Math.PI * 0.75}
          skinColor="#f2c9a0"
          hairColor="#5a3425"
          shirtColor="#8a63d2"
          pantsColor="#2f3558"
          longHair={true}
          name="Sinta"
          tip="Sinta – Marketing | Berdiskusi soal kampanye"
        />
        <SpeechBubble characterId="sinta" position={[0, 2.2, 0]} delay={3200} />
      </group>

      {/* 7. Mira */}
      <group position={[7.615, 0, 4.750]}>
        <Character
          position={[0, 0, 0]}
          sitting={true}
          activity="phone"
          lookDirection={miraAngle}
          skinColor="#f2c9a0"
          hairColor="#4a2c2a"
          shirtColor="#f2b84b"
          pantsColor="#3b4468"
          longHair={true}
          name="Mira"
          tip="Mira – Sales | Telepon dengan klien"
        />
        <SpeechBubble characterId="mira" position={[0, 1.8, 0]} delay={4000} />
      </group>
    </group>
  );
});

Characters.displayName = 'Characters';
export default Characters;
