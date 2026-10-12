import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';

export const KALIMAT = {
  rina: ['Laporan bulan ini hampir beres!', 'Tinggal cek angka terakhir.', 'Kopi dulu, lanjut lagi.'],
  dimas: ['Warnanya kurang pop ya?', 'Mockup versi 3 siap!', 'Minta feedback dong.'],
  eko: ['Dokumen buat Pak Arif!', 'Permisi, numpang lewat.', 'Ambil air dulu ya.'],
  bayu: ['Rilis kita geser ke Jumat?', 'Fitur login sudah aman.', 'Cek timeline lagi yuk.'],
  sinta: ['Kampanye tayang besok.', 'Budget iklan masih cukup.', 'Setuju, mulai Senin!'],
  mira: ['Baik Pak, saya kirim ulang.', 'Penawarannya sudah saya cek.', 'Terima kasih waktunya!'],
  arif: ['Sprint ini ada 3 target.', 'Prioritas: onboarding dulu.', 'Ada yang mau nambah?'],
};

export function SpeechBubble({ characterId, position = [0, 2.1, 0], delay = 0 }) {
  const sentences = KALIMAT[characterId] || [];
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sentences.length) return;

    let timeoutHide;
    let timeoutNext;

    const initialTimer = setTimeout(() => {
      setVisible(true);

      const loop = () => {
        setVisible(true);
        timeoutHide = setTimeout(() => {
          setVisible(false);
          timeoutNext = setTimeout(() => {
            setIndex((prev) => (prev + 1) % sentences.length);
            loop();
          }, 900);
        }, 3600);
      };

      loop();
    }, 800 + delay);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(timeoutHide);
      clearTimeout(timeoutNext);
    };
  }, [characterId, delay, sentences.length]);

  if (!sentences.length) return null;

  return (
    <group position={position}>
      {/* NO distanceFactor here because OrthographicCamera blows it up! */}
      <Html center style={{ pointerEvents: 'none' }}>
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(5px) scale(0.9)',
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            background: '#ffffff',
            border: '1.5px solid #d6d0f0',
            borderRadius: '10px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: '800',
            color: '#2b2750',
            boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
            whiteSpace: 'nowrap',
            fontFamily: "'Nunito', system-ui, sans-serif",
            position: 'relative',
            userSelect: 'none',
          }}
        >
          {sentences[index]}
          {/* Bubble tail */}
          <div
            style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '5px solid #ffffff',
            }}
          />
        </div>
      </Html>
    </group>
  );
}

export default SpeechBubble;
