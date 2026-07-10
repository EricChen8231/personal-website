'use client';

import { useEffect, useRef } from 'react';
import { DRAWFNS, drawGrid, setL4Hov, setL2Inputs, setHeroScroll, getHeroHotspots, setHeroHover } from '@/lib/animations';

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
            termLine('<span class="t-dim">Loading layers...</span>');
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
    let dpr = window.devicePixelRatio || 1;
    const reducedMql = window.matchMedia('(prefers-reduced-motion: reduce)');
    function rBg() {
      const c = bgRef.current;
      if (!c) return;
      dpr = window.devicePixelRatio || 1;
      const cssW = window.innerWidth, cssH = window.innerHeight;
      c.width = Math.floor(cssW * dpr);
      c.height = Math.floor(cssH * dpr);
      c.style.width = cssW + 'px';
      c.style.height = cssH + 'px';
    }
    rBg();
    window.addEventListener('resize', rBg);

    const L_OFF = 36;   // signal-bar width
    const R_OFF = 310;  // right-panel width
    let rafId: number;
    function renderBg() {
      // Cheap early-out: tab hidden or user prefers reduced motion.
      // We keep the RAF chain alive (browsers throttle hidden RAF to ~1Hz anyway)
      // so visibility/preference changes pick up automatically.
      if (document.hidden || reducedMql.matches) {
        rafId = requestAnimationFrame(renderBg);
        return;
      }
      const c = bgRef.current;
      if (!c) return;
      // CSS-pixel dimensions; ctx gets pre-scaled by DPR each frame.
      const W = window.innerWidth, H = window.innerHeight;
      bgX.setTransform(dpr, 0, 0, dpr, 0, 0);
      bgX.clearRect(0, 0, W, H);
      bgX.imageSmoothingEnabled = true;
      bgX.imageSmoothingQuality = 'high';

      // Hero-specific scroll progress (0..1 across the first viewport-height of scroll).
      // Used for the "dive into the screen" zoom and to grow the focal folder.
      const heroProg = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
      setHeroScroll(heroProg);
      const heroEased = Math.sqrt(heroProg);
      // Zoom origin = the center of the screen rect drawn by HERO_BG.
      // Bezel margins in HERO_BG: bzlMx ≈ 6% W. Screen rect center ≈ canvas center.
      const cx = W / 2, cy = H / 2;

      // Layer animations use the drawable area (between the two side panels).
      const aW = W - L_OFF - R_OFF;
      Object.keys(bgA).forEach(k => {
        const ki = parseInt(k);
        if (bgA[ki] > .005) {
          if (ki === 0) {
            // Hero / desktop scene — apply the dive-in zoom only here.
            const zoom = 1 + heroEased * 1.4;  // 1.0 → 2.4 across the hero
            bgX.save();
            bgX.translate(cx, cy);
            bgX.scale(zoom, zoom);
            bgX.translate(-cx, -cy);
            DRAWFNS[0]?.(bgX, W, H, bgA[0]);
            bgX.restore();
          } else {
            // Layer animations draw at their natural size (no extra zoom).
            drawGrid(bgX, W, H);
            bgX.save();
            bgX.translate(L_OFF, 0);
            DRAWFNS[ki]?.(bgX, aW, H, bgA[ki]);
            bgX.restore();
          }
        }
      });

      // Vignette overlay — only during the hero dive, fades out once L7 takes over.
      if (bgA[0] > 0.02) {
        const vig = (0.10 + heroEased * 0.30) * bgA[0];
        const vgrad = bgX.createRadialGradient(cx, cy, Math.min(W, H) * 0.30, cx, cy, Math.max(W, H) * 0.75);
        vgrad.addColorStop(0, 'rgba(0,0,0,0)');
        vgrad.addColorStop(1, `rgba(0,0,0,${vig})`);
        bgX.fillStyle = vgrad;
        bgX.fillRect(0, 0, W, H);
      }

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
    let sigDpr = window.devicePixelRatio || 1;
    const reducedMql = window.matchMedia('(prefers-reduced-motion: reduce)');
    function rSig() {
      const c = sigRef.current;
      if (!c) return;
      sigDpr = window.devicePixelRatio || 1;
      const cssH = window.innerHeight;
      c.width = Math.floor(36 * sigDpr);
      c.height = Math.floor(cssH * sigDpr);
      c.style.width = '36px';
      c.style.height = cssH + 'px';
    }
    rSig();
    window.addEventListener('resize', rSig);

    let rafId: number;
    function renderSig() {
      if (document.hidden || reducedMql.matches) {
        rafId = requestAnimationFrame(renderSig);
        return;
      }
      const c = sigRef.current;
      if (!c) return;
      const W = 36, H = window.innerHeight;
      sigX.setTransform(sigDpr, 0, 0, sigDpr, 0, 0);
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
        sigX.font = '7px ui-monospace, Menlo, Consolas, monospace'; sigX.textAlign = 'center'; sigX.fillText(`L${l.id}`, tx, ny + 13);
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
        // Hero zooms IN (toward the viewer) and fades — feels like diving past the surface.
        heroEl.style.transform = `scale(${1 + heroFrac * 0.18})`;
        heroEl.style.opacity = String(1 - heroFrac * 0.85);
        heroEl.style.filter = `blur(${heroFrac * 4}px)`;
      }
      let active: number | null = null;
      sections.forEach(s => {
        const r = s.getBoundingClientRect();
        if (Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0) > window.innerHeight * .3)
          active = parseInt(s.dataset.layer!);
      });
      // Hero / desktop scene is only visible while the user is at the hero itself.
      // After scrolling past it, never bring it back — even on segments where no
      // layer section is currently in view (e.g. between sections, or past L1).
      const onHero = window.scrollY < window.innerHeight * 0.85;
      Object.keys(bgA).forEach(k => {
        const ki = parseInt(k);
        let tgt: number;
        if (active !== null) {
          tgt = ki === active ? 1 : 0;
        } else if (onHero) {
          tgt = ki === 0 ? 1 : 0;
        } else {
          tgt = 0;  // past hero with no section in view → fade everything
        }
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
    function onMouseMove(e: MouseEvent) {
      const bgA = bgARef.current;
      if (bgA[4] < .05) { setL4Hov(-1); return; }
      // All math in CSS pixels — drawing coords are CSS pixels after DPR setup.
      const cx = e.clientX - 36, cy2 = e.clientY;
      const H = window.innerHeight;
      const aW = window.innerWidth - 36 - 310;
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

  // ── Hero desktop-icon clicks ──
  // Icons fade out as you scroll, so we only listen while in the hero band.
  useEffect(() => {
    function withinHero() { return window.scrollY < window.innerHeight * 0.6; }
    function hitTest(e: MouseEvent) {
      const hs = getHeroHotspots(window.innerWidth, window.innerHeight, window.scrollY);
      return hs.find(h => e.clientX >= h.x && e.clientX <= h.x + h.w && e.clientY >= h.y && e.clientY <= h.y + h.h) || null;
    }
    function onMove(e: MouseEvent) {
      if (!withinHero()) { setHeroHover(-1); document.body.style.cursor = ''; return; }
      const hit = hitTest(e);
      setHeroHover(hit ? hit.idx : -1);
      document.body.style.cursor = hit ? 'pointer' : '';
    }
    function onClick(e: MouseEvent) {
      if (!withinHero()) return;
      const hit = hitTest(e);
      if (!hit) return;
      if (hit.url.startsWith('#')) {
        const el = document.querySelector(hit.url);
        if (el) {
          e.preventDefault();
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        e.preventDefault();
        window.open(hit.url, '_blank', 'noopener,noreferrer');
      }
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick);
      document.body.style.cursor = '';
      setHeroHover(-1);
    };
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
        // CLA-style breakdown: P = A⊕B, G = A·B, then carries precomputed in parallel
        // from P and G via the lookahead equations.
        const aBits = [0,1,2,3].map(i => (A >> i) & 1);
        const bBits = [0,1,2,3].map(i => (B >> i) & 1);
        const P = [0,1,2,3].map(i => aBits[i] ^ bBits[i]);
        const G = [0,1,2,3].map(i => aBits[i] & bBits[i]);
        const C0 = 0;
        const C1 = G[0] | (P[0] & C0);
        const C2 = G[1] | (P[1] & G[0]) | (P[1] & P[0] & C0);
        const C3 = G[2] | (P[2] & G[1]) | (P[2] & P[1] & G[0]) | (P[2] & P[1] & P[0] & C0);
        const C4 = G[3] | (P[3] & G[2]) | (P[3] & P[2] & G[1]) | (P[3] & P[2] & P[1] & G[0]) | (P[3] & P[2] & P[1] & P[0] & C0);
        const carries = [C0, C1, C2, C3, C4];
        const sumBits = [0,1,2,3].map(i => P[i] ^ carries[i]);
        const cols = [3,2,1,0];
        const td  = (v: string|number, cls?: string) =>
          '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</td>';
        const hdr = '<tr>' + td('', 'row-label') +
          cols.map(i => '<td style="font-size:9px;color:var(--text4)">b' + i + '</td>').join('') + '</tr>';
        const aRow = '<tr>' + td('A:', 'row-label') +
          cols.map(i => td(aBits[i])).join('') + '</tr>';
        const bRow = '<tr>' + td('B:', 'row-label') +
          cols.map(i => td(bBits[i])).join('') + '</tr>';
        const pRow = '<tr>' + td('P:', 'row-label') +
          cols.map(i => td(P[i], 'c-bit' + (P[i] ? ' active' : ''))).join('') + '</tr>';
        const gRow = '<tr>' + td('G:', 'row-label') +
          cols.map(i => td(G[i], 'c-bit' + (G[i] ? ' active' : ''))).join('') + '</tr>';
        const cRow = '<tr>' + td('C<sub>i</sub>:', 'row-label') +
          cols.map(i => td(carries[i], 'c-bit' + (carries[i] ? ' active' : ''))).join('') + '</tr>';
        const sRow = '<tr class="sum-row">' + td('Sum:', 'row-label') +
          cols.map(i => td(sumBits[i])).join('') +
          '<td class="cout-cell" style="font-size:9px;padding-left:4px">Cout=' + C4 + '</td></tr>';
        binaryEl.innerHTML =
          '<table class="carry-table">' + hdr + aRow + bRow + pRow + gRow + cRow + sRow + '</table>' +
          '<div style="margin-top:5px;font-size:10px;color:var(--text4);' +
          'font-family:ui-monospace, Menlo, Consolas, monospace">' +
          pad(A, 4) + ' + ' + pad(B, 4) + ' = ' + C4 +
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

  // ── Interactive terminal ──
  // Click anywhere in the terminal body focuses the input. Commands print to #term-log.
  useEffect(() => {
    const form = document.getElementById('term-form') as HTMLFormElement | null;
    const input = document.getElementById('term-input') as HTMLInputElement | null;
    const log = document.getElementById('term-log');
    const body = document.getElementById('term-body');
    if (!form || !input || !log || !body) return;

    function print(html: string, cls = 't-info') {
      const d = document.createElement('div'); d.className = cls; d.innerHTML = html;
      log!.appendChild(d); body!.scrollTop = 99999;
    }
    function echo(cmd: string) {
      print(`<span class="t-dim">~ % </span><span class="t-cmd">${escapeHtml(cmd)}</span>`);
    }
    function escapeHtml(s: string) {
      return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
    }

    const COMMANDS: Record<string, (args: string[]) => void> = {
      help: () => {
        print('available commands:', 't-info');
        print('  <span class="t-cmd">help</span>           this list', 't-dim');
        print('  <span class="t-cmd">whoami</span>         about me', 't-dim');
        print('  <span class="t-cmd">ls</span>             list resources', 't-dim');
        print('  <span class="t-cmd">cat about</span>      bio', 't-dim');
        print('  <span class="t-cmd">cat skills</span>     tech stack', 't-dim');
        print('  <span class="t-cmd">cat contact</span>    email / socials', 't-dim');
        print('  <span class="t-cmd">open resume</span>    pull up resume.pdf', 't-dim');
        print('  <span class="t-cmd">open github</span>    profile on github', 't-dim');
        print('  <span class="t-cmd">goto L&lt;n&gt;</span>      jump to layer (1–7)', 't-dim');
        print('  <span class="t-cmd">theme</span>          toggle dark/light', 't-dim');
        print('  <span class="t-cmd">clear</span>          wipe terminal', 't-dim');
      },
      whoami: () => {
        print('eric chen — usc viterbi · b.s. cecs · m.s. ee · los angeles');
        print('open to: <span class="t-hi">systems eng</span>, <span class="t-hi">hardware design</span>, <span class="t-hi">ml infra</span>', 't-dim');
      },
      ls: () => {
        print('<span class="t-cmd">about.txt</span>   <span class="t-cmd">skills.txt</span>   <span class="t-cmd">contact.txt</span>   <span class="t-cmd">resume.pdf</span>');
        print('<span class="t-cmd">layers/</span>    <span class="t-cmd">projects/</span>    <span class="t-cmd">interests/</span>', 't-info');
      },
      pwd: () => print('/home/eric'),
      cat: (args) => {
        const f = (args[0] || '').replace(/\.txt$/, '');
        if (f === 'about') {
          print('engineer working from 45nm cmos cells up to production apis.', 't-info');
          print('happiest where physics meets', 't-info');
          print('abstraction: branch predictors, mosfet biasing, gpu kernels, distributed', 't-info');
          print('training. lately: training models on large codebases + cuda mccfr.', 't-info');
        } else if (f === 'skills') {
          print('languages: c · c++ · rust · python · typescript · systemverilog · risc-v asm', 't-info');
          print('hardware : verilog · cadence virtuoso · spice · fpga (artix-7) · gem5', 't-info');
          print('systems  : linux · tcp/ip · cuda · pytorch · postgres · raw packet i/o', 't-info');
        } else if (f === 'contact') {
          print('email   : echen823@usc.edu', 't-info');
          print('linkedin: linkedin.com/in/ericchen823', 't-info');
          print('github  : github.com/ericchen8231', 't-info');
        } else if (f === 'resume') {
          print('binary file — try <span class="t-cmd">open resume</span>', 't-warn');
        } else if (!args[0]) {
          print('cat: missing operand', 't-warn');
        } else {
          print(`cat: ${escapeHtml(args[0])}: no such file`, 't-warn');
        }
      },
      open: (args) => {
        const t = args[0] || '';
        if (t === 'resume' || t === 'resume.pdf') {
          window.open('/personal-website/resume.pdf', '_blank', 'noopener,noreferrer');
          print('opening resume.pdf...', 't-ok');
        } else if (t === 'github' || t === 'gh') {
          window.open('https://github.com/ericchen8231', '_blank', 'noopener,noreferrer');
          print('opening github...', 't-ok');
        } else if (t === 'linkedin' || t === 'li') {
          window.open('https://linkedin.com/in/ericchen823', '_blank', 'noopener,noreferrer');
          print('opening linkedin...', 't-ok');
        } else if (t === 'email' || t === 'mail') {
          window.location.href = 'mailto:echen823@usc.edu';
          print('opening mail client...', 't-ok');
        } else if (!t) {
          print('usage: open [resume|github|linkedin|email]', 't-warn');
        } else {
          print(`open: ${escapeHtml(t)}: unknown target`, 't-warn');
        }
      },
      goto: (args) => {
        const m = (args[0] || '').match(/^L?([1-7])$/i);
        if (!m) { print('usage: goto L<n>  (1–7)', 't-warn'); return; }
        const el = document.getElementById(`sec-l${m[1]}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          print(`jumping to L${m[1]}...`, 't-ok');
        }
      },
      theme: () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        const btn = document.getElementById('theme-btn');
        if (btn) btn.textContent = isDark ? '○' : '◐';
        print(`theme: ${isDark ? 'dark' : 'light'}`, 't-ok');
      },
      clear: () => { log!.innerHTML = ''; },
      sudo: () => print('nice try.', 't-warn'),
      exit: () => print("can't exit the stack. you ARE the stack.", 't-warn'),
    };
    // Aliases.
    COMMANDS.man = COMMANDS.help;
    COMMANDS['?'] = COMMANDS.help;

    function run(line: string) {
      const trimmed = line.trim();
      if (!trimmed) return;
      echo(trimmed);
      const [cmd, ...args] = trimmed.split(/\s+/);
      const fn = COMMANDS[cmd.toLowerCase()];
      if (fn) fn(args);
      else print(`zsh: command not found: ${escapeHtml(cmd)} — try <span class="t-cmd">help</span>`, 't-warn');
    }

    function onSubmit(e: Event) {
      e.preventDefault();
      const v = input!.value;
      input!.value = '';
      run(v);
    }
    function focusInput(e: Event) {
      // Only auto-focus if user clicked terminal *body*, not a button inside.
      if ((e.target as HTMLElement).closest('button')) return;
      input!.focus();
    }
    form.addEventListener('submit', onSubmit);
    body.addEventListener('click', focusInput);
    return () => {
      form.removeEventListener('submit', onSubmit);
      body.removeEventListener('click', focusInput);
    };
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
            <span style={{ marginLeft: 5 }}>eric@silicon — zsh</span>
            <button id="theme-btn">&#9680;</button>
          </div>
          <div id="term-body">
            <div><span className="t-dim">~ % </span><span id="typed-init" /><span id="term-cursor" /></div>
            <div id="term-log" />
            <form id="term-form" autoComplete="off">
              <span className="t-dim">~ % </span>
              <input id="term-input" type="text" placeholder="type 'help' ↵" spellCheck={false} autoComplete="off" />
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
