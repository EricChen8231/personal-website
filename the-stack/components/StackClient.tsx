'use client';

import { useEffect, useRef } from 'react';
import { DRAWFNS, drawGrid, setL4Hov, setL2Inputs } from '@/lib/animations';

import { LAYERS, TLOGS } from '@/data/content';

const CMD = './eric_chen --trace-execution --all-layers';

export default function StackClient() {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const sigRef = useRef<HTMLCanvasElement>(null);
  const bgARef = useRef<Record<number, number>>({ 0: 1, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const scrollProgRef = useRef(0);

  // ── Terminal ──
  useEffect(() => {
    const termLog = document.getElementById('term-log');
    const termBody = document.getElementById('term-body');
    function termLine(html: string, cls = 't-info') {
      if (!termLog || !termBody) return;
      const d = document.createElement('div'); d.className = cls; d.innerHTML = html;
      termLog.appendChild(d); termBody.scrollTop = 99999;
    }

    // Hero typewriter
    const heroCmd = document.getElementById('hero-cmd');
    const heroCurEl = document.getElementById('hero-cursor-el');
    let ci = 0;
    function typeHero() {
      if (!heroCmd) return;
      if (ci <= CMD.length) {
        heroCmd.textContent = CMD.slice(0, ci++);
        setTimeout(typeHero, ci > CMD.length ? 0 : 42 + Math.random() * 22);
      } else {
        if (heroCurEl) heroCurEl.style.display = 'none';
        setTimeout(() => {
          const ti = document.getElementById('typed-init');
          if (ti) ti.textContent = CMD;
          const tc = document.getElementById('term-cursor');
          if (tc) tc.style.display = 'none';
          setTimeout(() => {
            termLine('<span class="t-dim">Loading stack layers...</span>');
            LAYERS.forEach((l, i) => setTimeout(() => {
              termLine(`[L${l.id}] ${l.name} loaded`, 't-ok');
              if (i === LAYERS.length - 1) setTimeout(() => termLine('Ready — scroll to trace ↓', 't-cmd'), 300);
            }, i * 140));
          }, 200);
        }, 500);
      }
    }
    const typeTimer = setTimeout(typeHero, 700);
    return () => clearTimeout(typeTimer);
  }, []);

  // ── Background canvas RAF loop ──
  useEffect(() => {
    const canvas = bgRef.current;
    if (!canvas) return;
    const bgX = canvas.getContext('2d')!;
    const bgA = bgARef.current;
    function rBg() {
      const c = bgRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    }
    rBg();
    window.addEventListener('resize', rBg);

    const L_OFF = 36;   // signal-bar width
    const R_OFF = 310;  // right-panel width
    let rafId: number;
    function renderBg() {
      const c = bgRef.current;
      if (!c) return;
      const W = c.width, H = c.height;
      bgX.clearRect(0, 0, W, H);
      drawGrid(bgX, W, H);
      const aW = W - L_OFF - R_OFF; // drawable width between the two panels
      Object.keys(bgA).forEach(k => {
        const ki = parseInt(k);
        if (bgA[ki] > .005) {
          bgX.save();
          bgX.translate(L_OFF, 0);
          DRAWFNS[ki]?.(bgX, aW, H, bgA[ki]);
          bgX.restore();
        }
      });
      rafId = requestAnimationFrame(renderBg);
    }
    renderBg();
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', rBg); };
  }, []);

  // ── Signal bar RAF loop ──
  useEffect(() => {
    const sigCanvas = sigRef.current;
    if (!sigCanvas) return;
    const sigX = sigCanvas.getContext('2d')!;
    let sigT = 0;
    function rSig() {
      const c = sigRef.current;
      if (!c) return;
      c.width = 36;
      c.height = window.innerHeight;
    }
    rSig();
    window.addEventListener('resize', rSig);

    let rafId: number;
    function renderSig() {
      const c = sigRef.current;
      if (!c) return;
      const W = 36, H = c.height;
      sigX.clearRect(0, 0, W, H);
      const pt = 50, pb = 50, th = H - pt - pb, tx = W / 2;
      sigT += .01;
      const cs = getComputedStyle(document.documentElement);
      const cTrack = cs.getPropertyValue('--sig-track').trim();
      const cFill  = cs.getPropertyValue('--sig-fill').trim();
      const cDot   = cs.getPropertyValue('--sig-dot').trim();
      const cDim   = cs.getPropertyValue('--sig-dot-dim').trim();
      sigX.strokeStyle = cTrack; sigX.lineWidth = 1;
      sigX.beginPath(); sigX.moveTo(tx, pt); sigX.lineTo(tx, pt + th); sigX.stroke();
      const fh = th * scrollProgRef.current;
      sigX.strokeStyle = cFill; sigX.lineWidth = 2;
      sigX.beginPath(); sigX.moveTo(tx, pt); sigX.lineTo(tx, pt + fh); sigX.stroke();
      LAYERS.forEach((l, i) => {
        const ny = pt + (i / (LAYERS.length - 1)) * th;
        const act = scrollProgRef.current >= (i / (LAYERS.length - 1)) - .04;
        sigX.fillStyle = act ? cDot : cDim;
        sigX.beginPath(); sigX.arc(tx, ny, act ? 5 : 3, 0, Math.PI * 2); sigX.fill();
        sigX.fillStyle = act ? cFill : cDim;
        sigX.font = '7px Courier New'; sigX.textAlign = 'center'; sigX.fillText(`L${l.id}`, tx, ny + 13);
      });
      const dy = pt + th * scrollProgRef.current, pr = 3 + Math.sin(sigT * Math.PI * 6) * 1.5;
      sigX.fillStyle = cTrack; sigX.beginPath(); sigX.arc(tx, dy, pr * 2.5, 0, Math.PI * 2); sigX.fill();
      sigX.fillStyle = cDot;   sigX.beginPath(); sigX.arc(tx, dy, pr * .55, 0, Math.PI * 2); sigX.fill();
      rafId = requestAnimationFrame(renderSig);
    }
    renderSig();
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', rSig); };
  }, []);

  // ── Scroll handler ──
  useEffect(() => {
    const bgA = bgARef.current;
    const sections = document.querySelectorAll<HTMLElement>('.section[data-layer]');
    const logged = new Set<number>();
    const termLog = document.getElementById('term-log');
    const termBody = document.getElementById('term-body');
    function termLine(html: string, cls = 't-info') {
      if (!termLog || !termBody) return;
      const d = document.createElement('div'); d.className = cls; d.innerHTML = html;
      termLog.appendChild(d); termBody.scrollTop = 99999;
    }
    function onScroll() {
      const dh = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgRef.current = Math.max(0, Math.min(1, window.scrollY / dh));
      const heroEl = document.getElementById('hero');
      if (heroEl) {
        const heroFrac = Math.min(1, window.scrollY / (window.innerHeight * 0.6));
        heroEl.style.transform = `scale(${1 - heroFrac * 0.06})`;
        heroEl.style.opacity = String(1 - heroFrac * 0.45);
      }
      let active: number | null = null;
      sections.forEach(s => {
        const r = s.getBoundingClientRect();
        if (Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0) > window.innerHeight * .3)
          active = parseInt(s.dataset.layer!);
      });
      Object.keys(bgA).forEach(k => {
        const ki = parseInt(k);
        const tgt = active === null ? (ki === 0 ? 1 : 0) : (ki === active ? 1 : 0);
        bgA[ki] += (tgt - bgA[ki]) * .07;
      });
      if (active && !logged.has(active)) {
        logged.add(active);
        (TLOGS[active] || []).forEach(([h, c], i) =>
          setTimeout(() => termLine(h, c || 't-info'), i * 190)
        );
      }
      // Layer nav visibility + active item
      const layerNav = document.getElementById('layer-nav');
      if (layerNav) layerNav.classList.toggle('visible', window.scrollY > window.innerHeight * 0.5);
      document.querySelectorAll<HTMLElement>('.ln-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.layer!) === active);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    const interval = setInterval(onScroll, 120);
    return () => { window.removeEventListener('scroll', onScroll); clearInterval(interval); };
  }, []);

  // ── Intersection Observer (section zoom-in) ──
  useEffect(() => {
    const obs = new IntersectionObserver(entries =>
      entries.forEach(e => {
        const el = e.target.querySelector<HTMLElement>('.section-inner');
        if (el) el.classList.toggle('visible', e.isIntersecting);
      }),
      { threshold: .15 }
    );
    document.querySelectorAll('.section').forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  // ── L4 hover tracking ──
  useEffect(() => {
    const bgC = bgRef.current;
    function onMouseMove(e: MouseEvent) {
      const mx = e.clientX, my = e.clientY;
      const bgA = bgARef.current;
      if (bgA[4] < .05) { setL4Hov(-1); return; }
      if (!bgC) return;
      const W = bgC.width, H = bgC.height;
      const scaleX = W / bgC.offsetWidth, scaleY = H / bgC.offsetHeight;
      // subtract left panel offset so cx is in the same coordinate space as the draw functions
      const cx = mx * scaleX - 36, cy2 = my * scaleY;
      const aW = W - 36 - 310;
      const sx = aW * .42, ag = Math.max(12, Math.floor(aW * .018));
      const bW = Math.max(1, Math.floor((aW * .56 - 3 * ag) / 4)), bH = 72, bY = H * .42;
      const bX = [sx, sx + bW + ag, sx + 2 * (bW + ag), sx + 3 * (bW + ag)];
      const dpH = 170;
      const inRow = (cy2 >= bY && cy2 <= bY + bH) || (cy2 >= bY + bH + 18 && cy2 <= bY + bH + 18 + dpH);
      if (!inRow) { setL4Hov(-1); return; }
      const widths = [bW, bW, bW, bW * 2 + ag];
      setL4Hov(bX.findIndex((x, i) => cx >= x && cx <= x + widths[i]));
    }
    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []);

  // ── L2 interactive adder ──
  useEffect(() => {
    function updateL2() {
      const aEl = document.getElementById('l2-a') as HTMLInputElement | null;
      const bEl = document.getElementById('l2-b') as HTMLInputElement | null;
      if (!aEl || !bEl) return;
      const A = Math.max(0, Math.min(15, parseInt(aEl.value) || 0));
      const B = Math.max(0, Math.min(15, parseInt(bEl.value) || 0));
      setL2Inputs(A, B);
      const s = A + B;
      const pad = (n: number, bits: number) => n.toString(2).padStart(bits, '0');
      const resultEl = document.getElementById('l2-result');
      const binaryEl = document.getElementById('l2-binary');
      if (resultEl) resultEl.textContent = String(s);
      if (binaryEl) {
        // Ripple-carry chain: index 0 = LSB
        const aBits = [0,1,2,3].map(i => (A >> i) & 1);
        const bBits = [0,1,2,3].map(i => (B >> i) & 1);
        const carries = [0,0,0,0,0]; // carries[i] = carry into bit i
        const sumBits = [0,0,0,0];
        for (let i = 0; i < 4; i++) {
          sumBits[i] = aBits[i] ^ bBits[i] ^ carries[i];
          carries[i+1] = (aBits[i] & bBits[i]) | (aBits[i] & carries[i]) | (bBits[i] & carries[i]);
        }
        const cols = [3,2,1,0];
        const td  = (v: string|number, cls?: string) =>
          '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</td>';
        const hdr = '<tr>' + td('', 'row-label') +
          cols.map(i => '<td style="font-size:9px;color:var(--text4)">b' + i + '</td>').join('') + '</tr>';
        const aRow = '<tr>' + td('A:', 'row-label') +
          cols.map(i => td(aBits[i])).join('') + '</tr>';
        const bRow = '<tr>' + td('B:', 'row-label') +
          cols.map(i => td(bBits[i])).join('') + '</tr>';
        const cRow = '<tr>' + td('C<sub>i</sub>:', 'row-label') +
          cols.map(i => td(carries[i], 'c-bit' + (carries[i] ? ' active' : ''))).join('') + '</tr>';
        const sRow = '<tr class="sum-row">' + td('Sum:', 'row-label') +
          cols.map(i => td(sumBits[i])).join('') +
          '<td class="cout-cell" style="font-size:9px;padding-left:4px">C=' + carries[4] + '</td></tr>';
        binaryEl.innerHTML =
          '<table class="carry-table">' + hdr + aRow + bRow + cRow + sRow + '</table>' +
          '<div style="margin-top:5px;font-size:10px;color:var(--text4);' +
          'font-family:\'Courier New\',monospace">' +
          pad(A, 4) + ' + ' + pad(B, 4) + ' = ' + carries[4] +
          cols.map(i => sumBits[i]).join('') +
          '&nbsp;&nbsp;(' + (s > 15 ? 'Cout=1, overflow' : 'no overflow') + ')</div>';
      }
    }
    const aEl = document.getElementById('l2-a');
    const bEl = document.getElementById('l2-b');
    aEl?.addEventListener('input', updateL2);
    bEl?.addEventListener('input', updateL2);
    setTimeout(updateL2, 200);
    return () => {
      aEl?.removeEventListener('input', updateL2);
      bEl?.removeEventListener('input', updateL2);
    };
  }, []);

  // ── Dark mode toggle ──
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.documentElement.classList.add('dark');
    const btn = document.getElementById('theme-btn') as HTMLButtonElement | null;
    function setIcon() {
      if (btn) btn.textContent = document.documentElement.classList.contains('dark') ? '○' : '◐';
    }
    setIcon();
    function toggleTheme() {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      setIcon();
    }
    btn?.addEventListener('click', toggleTheme);
    return () => btn?.removeEventListener('click', toggleTheme);
  }, []);

  // ── Mobile panel toggle ──
  useEffect(() => {
    const btn = document.getElementById('panel-toggle');
    const panel = document.getElementById('right-panel');
    function togglePanel() { panel?.classList.toggle('panel-open'); }
    btn?.addEventListener('click', togglePanel);
    return () => btn?.removeEventListener('click', togglePanel);
  }, []);

  return (
    <>
      <canvas id="bg-canvas" ref={bgRef} />
      <button id="panel-toggle">&#8801; terminal</button>
      <nav id="layer-nav">
        {LAYERS.map(l => (
          <a key={l.id} href={`#sec-l${l.id}`} className="ln-item" data-layer={String(l.id)}>L{l.id}</a>
        ))}
      </nav>
      <div id="right-panel">
        <div id="sig-wrap"><canvas id="signal-canvas" ref={sigRef} /></div>
        <div id="terminal">
          <div id="term-header">
            <div className="term-dot" style={{ background: '#ef4444' }} />
            <div className="term-dot" style={{ background: '#f59e0b' }} />
            <div className="term-dot" style={{ background: '#22c55e' }} />
            <span style={{ marginLeft: 5 }}>eric@stack — zsh</span>
            <button id="theme-btn">&#9680;</button>
          </div>
          <div id="term-body">
            <div><span className="t-dim">~ % </span><span id="typed-init" /><span id="term-cursor" /></div>
            <div id="term-log" />
          </div>
        </div>
      </div>
    </>
  );
}
