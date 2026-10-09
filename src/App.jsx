import React, { useState, useEffect, useRef } from 'react';
import { generateScene } from './utils/sceneGenerator';
import './App.css';

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

export default function App() {
  const [tooltip, setTooltip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [walkerPos, setWalkerPos] = useState([0, 0]);
  const [walkerDir, setWalkerDir] = useState(1);
  const [walkerMoving, setWalkerMoving] = useState(false);
  const [svgTransform, setSvgTransform] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const stageRef = useRef(null);
  const tipRef = useRef(null);
  const walkerRef = useRef(null);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const isMobile = window.matchMedia('(max-width:640px)').matches;

  // Scene generation and SVG content
  useEffect(() => {
    if (svgRef.current) {
      const sceneSvg = generateScene();
      svgRef.current.innerHTML = sceneSvg;
    }
  }, []);

  // Walker animation
  useEffect(() => {
    if (prefersReducedMotion || !walkerRef.current) return;

    const A = [4.1, 3.4];
    const B = [3.0, 8.0];

    let t0;
    const fr = (ts) => {
      t0 = t0 || ts;
      const u = ((ts - t0) / 1000) % 12;
      let f, d, m = true;

      if (u < 5) {
        f = u / 5;
        d = 1;
      } else if (u < 6) {
        f = 1;
        d = 1;
        m = false;
      } else if (u < 11) {
        f = 1 - (u - 6) / 5;
        d = -1;
      } else {
        f = 0;
        d = -1;
        m = false;
      }

      setWalkerPos([
        A[0] + (B[0] - A[0]) * f,
        A[1] + (B[1] - A[1]) * f,
      ]);
      setWalkerDir(d);
      setWalkerMoving(m);
      requestAnimationFrame(fr);
    };

    requestAnimationFrame(fr);
  }, [prefersReducedMotion]);

  // Tooltip interaction
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!stageRef.current || !tipRef.current) return;
      const target = e.target.closest('[data-tip]');
      if (!target) {
        setTooltip(null);
        return;
      }

      const tipText = target.dataset.tip;
      const [title, desc] = tipText.split('|');
      const rect = target.getBoundingClientRect();
      const stageRect = stageRef.current.getBoundingClientRect();

      setTooltip({ title, desc });
      setTooltipPos({
        x: rect.left + rect.width / 2 - stageRect.left,
        y: rect.top - stageRect.top,
      });
    };

    const handlePointerDown = (e) => {
      if (!stageRef.current) return;
      const target = e.target.closest('[data-tip]');
      if (target) {
        const tipText = target.dataset.tip;
        const [title, desc] = tipText.split('|');
        const rect = target.getBoundingClientRect();
        const stageRect = stageRef.current.getBoundingClientRect();

        setTooltip({ title, desc });
        setTooltipPos({
          x: rect.left + rect.width / 2 - stageRect.left,
          y: rect.top - stageRect.top,
        });
      }
    };

    const handlePointerLeave = () => {
      setTooltip(null);
    };

    if (svgRef.current) {
      svgRef.current.addEventListener('pointerover', handlePointerMove);
      svgRef.current.addEventListener('pointerdown', handlePointerDown);
      svgRef.current.addEventListener('pointerleave', handlePointerLeave);

      return () => {
        svgRef.current?.removeEventListener('pointerover', handlePointerMove);
        svgRef.current?.removeEventListener('pointerdown', handlePointerDown);
        svgRef.current?.removeEventListener('pointerleave', handlePointerLeave);
      };
    }
  }, []);

  // Parallax effect
  useEffect(() => {
    if (prefersReducedMotion) return;

    let mx = 0, my = 0;

    const handlePointerMove = (e) => {
      if (e.pointerType === 'touch') return;
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      updateParallax(mx, my);
    };

    const handleScroll = () => {
      updateParallax(mx, my);
    };

    const updateParallax = (mx, my) => {
      const sc = window.scrollY * -0.04;
      setSvgTransform({
        x: mx * 10,
        y: my * 6 + sc,
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [prefersReducedMotion]);

  // Mobile viewBox update
  useEffect(() => {
    const updateViewBox = () => {
      if (svgRef.current) {
        const isMobile = window.matchMedia('(max-width:640px)').matches;
        svgRef.current.setAttribute('viewBox', isMobile ? '130 10 760 640' : '60 0 900 650');
      }
    };

    const mq = window.matchMedia('(max-width:640px)');
    updateViewBox();
    mq.addEventListener('change', updateViewBox);

    return () => mq.removeEventListener('change', updateViewBox);
  }, []);

  // Speech bubble text rotation
  useEffect(() => {
    if (!svgRef.current) return;

    const sayElements = svgRef.current.querySelectorAll('.say');
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
        setTimeout(() => {
          g.style.opacity = '0';
          i++;
          setTimeout(loop, 500);
        }, JEDA - 900);
      };

      setTimeout(loop, 600 + n * 1100);
    });
  }, [prefersReducedMotion]);

  return (
    <div>
      <div className="bg" id="bg">
        <i></i>
        <i></i>
        <i></i>
      </div>

      <header>
        <div>
          <h1>Kantor Virtual — Pixel Works</h1>
          <p>Tim kecil yang sibuk. Lihat siapa mengerjakan apa pagi ini.</p>
        </div>
        <div className="chip">
          <b>🟢</b> Live — Senin 09.41
        </div>
      </header>

      <main className="stage" ref={stageRef}>
        <svg
          id="svg"
          ref={svgRef}
          viewBox="60 0 900 650"
          role="img"
          aria-label="Ilustrasi isometrik kantor virtual dengan karyawan yang sedang bekerja"
          style={{
            transform: `translate(${svgTransform.x}px, ${svgTransform.y}px)`,
          }}
        />
        <div
          id="tip"
          ref={tipRef}
          style={{
            opacity: tooltip ? 1 : 0,
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          {tooltip && (
            <>
              <b>{tooltip.title}</b>
              <span>{tooltip.desc}</span>
            </>
          )}
        </div>
      </main>

      <section className="notes">
        <h2>Perilaku responsif &amp; aksesibilitas</h2>
        <div className="grid">
          <div className="card">
            <b>Desktop ≥ 1024px</b>
            Seluruh ruangan dengan 7 karakter, label meja saat hover, parallax kursor dan scroll.
          </div>
          <div className="card">
            <b>Tablet 640–1023px</b>
            Adegan penuh. Label muncul saat ketuk, parallax hanya dari scroll.
          </div>
          <div className="card">
            <b>Mobile &lt; 640px</b>
            Ruangan disederhanakan: lounge, pantry, dan 2 karakter disembunyikan (sisa 5), kamera lebih dekat.
          </div>
          <div className="card">
            <b>prefers-reduced-motion</b>
            Semua loop berhenti. Adegan jadi statis, tanpa parallax. Gelembung bicara tetap terlihat.
          </div>
        </div>
      </section>
    </div>
  );
}
