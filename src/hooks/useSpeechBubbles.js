import { useEffect } from 'react';

const KALIMAT = {
  rina: ['Laporan bulan ini hampir beres!', 'Tinggal cek angka terakhir.', 'Kopi dulu, lanjut lagi.'],
  dimas: ['Warnanya kurang pop ya?', 'Mockup versi 3 siap!', 'Minta feedback dong.'],
  eko: ['Dokumen buat Pak Arif!', 'Permisi, numpang lewat.', 'Ambil air dulu ya.'],
  bayu: ['Rilis kita geser ke Jumat?', 'Fitur login sudah aman.', 'Cek timeline lagi yuk.'],
  sinta: ['Kampanye tayang besok.', 'Budget iklan masih cukup.', 'Setuju, mulai Senin!'],
  mira: ['Baik Pak, saya kirim ulang.', 'Penawarannya sudah saya cek.', 'Terima kasih waktunya!'],
  arif: ['Sprint ini ada 3 target.', 'Prioritas: onboarding dulu.', 'Ada yang mau nambah?'],
};

const JEDA = 3600; // duration each sentence is shown (ms)

/**
 * Manages rotating speech bubble text for characters
 * Cycles through character-specific dialogue with fade transitions
 * Respects prefers-reduced-motion preference
 */
export function useSpeechBubbles(svgRef, prefersReducedMotion) {
  useEffect(() => {
    if (!svgRef.current) return;

    const sayElements = svgRef.current.querySelectorAll('.say');
    const timeoutIds = [];

    sayElements.forEach((g, n) => {
      const charKey = g.dataset.say;
      const T = KALIMAT[charKey] || [];
      if (T.length === 0) return;

      const tx = g.querySelector('text');
      const rc = g.querySelector('rect');
      const tl = g.querySelector('.tail');

      let i = 0;

      const show = () => {
        if (!tx) return;
        tx.textContent = T[i % T.length];
        let w = 0;
        try {
          w = tx.getComputedTextLength();
        } catch (e) {}
        w = (w || 60) + 16;
        rc?.setAttribute('x', (-w / 2).toString());
        rc?.setAttribute('y', '-9');
        rc?.setAttribute('width', w.toString());
        rc?.setAttribute('height', '16');
        rc?.setAttribute('rx', '8');
        tl?.setAttribute('d', 'M-4 7l-2 5 8-5z');
      };

      show();

      if (prefersReducedMotion) {
        g.style.opacity = '1';
        return;
      }

      const loop = () => {
        show();
        g.style.opacity = '1';
        const hideTimeout = setTimeout(() => {
          g.style.opacity = '0';
          i++;
          const loopTimeout = setTimeout(loop, 500);
          timeoutIds.push(loopTimeout);
        }, JEDA - 900);
        timeoutIds.push(hideTimeout);
      };

      const startTimeout = setTimeout(loop, 600 + n * 1100);
      timeoutIds.push(startTimeout);
    });

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [svgRef, prefersReducedMotion]);
}
