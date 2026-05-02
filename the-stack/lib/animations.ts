// All canvas animation drawing functions for The Stack portfolio.
// Each function is a pure(ish) draw call: (ctx, W, H, alpha) => void.
// Module-level state is intentional — these are singleton animation loops.

type Ctx = CanvasRenderingContext2D;

const ink = (a: number) => `rgba(24,24,27,${a})`;

function drawGrid(ctx: Ctx, W: number, H: number) {
  ctx.fillStyle = 'rgba(24,24,27,0.055)';
  for (let x = 0; x < W; x += 28)
    for (let y = 0; y < H; y += 28) {
      ctx.beginPath(); ctx.arc(x, y, 0.7, 0, Math.PI * 2); ctx.fill();
    }
}

function bz(u: number, a0: number, a1: number, a2: number) {
  const v = 1 - u; return v * v * a0 + 2 * v * u * a1 + u * u * a2;
}

// ── L7: Neural Net Training Loop ──
const L7 = (() => {
  let t = 0;
  const layers = [4, 6, 5, 3];
  const lNames = ['Input', 'Hidden 1', 'Hidden 2', 'Output'];
  function seededRnd(s: number) { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); }
  const weights: number[][][] = [];
  for (let l = 0; l < layers.length - 1; l++) {
    const W2: number[][] = [];
    for (let i = 0; i < layers[l]; i++) {
      const row: number[] = [];
      for (let j = 0; j < layers[l + 1]; j++) row.push(seededRnd(l * 1000 + i * 100 + j) - .5);
      W2.push(row);
    }
    weights.push(W2);
  }
  let acts = layers.map(n => Array(n).fill(0) as number[]);
  let grads = layers.map(n => Array(n).fill(0) as number[]);
  const lossHist: (number | null)[] = Array(80).fill(null);
  let lossPtr = 0, epoch = 0, step = 0;
  let phase: 'fwd' | 'bwd' | 'pause' = 'fwd';
  let phaseT = 0, fwdLayer = 0, bwdLayer = 0;
  let lossVal = 2.4;
  type Pulse = { x0: number; y0: number; x1: number; y1: number; val: number; age: number; maxAge: number; isBwd: boolean };
  const pulses: Pulse[] = [];

  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++; phaseT++;
    if (phase === 'fwd') {
      if (phaseT % 18 === 0) {
        fwdLayer++;
        if (fwdLayer >= 1 && fwdLayer <= layers.length) {
          const netX = W * .44, netW = W * .42, netH = H * .72, netY = H * .14;
          const srcLayer = fwdLayer - 1, tgtLayer = fwdLayer;
          const x0 = netX + srcLayer * (netW / (layers.length - 1));
          const x1 = netX + tgtLayer * (netW / (layers.length - 1));
          for (let i = 0; i < layers[srcLayer]; i++) {
            const y0 = netY + (i + .5) * (netH / layers[srcLayer]);
            const j = Math.floor(seededRnd(t * 77 + srcLayer * 13 + i * 29) * layers[tgtLayer]);
            const y1 = netY + (j + .5) * (netH / layers[tgtLayer]);
            pulses.push({ x0, y0, x1, y1, val: acts[srcLayer][i], age: 0, maxAge: 20, isBwd: false });
          }
        }
        if (fwdLayer >= layers.length) { phase = 'bwd'; phaseT = 0; bwdLayer = layers.length - 1; }
      }
      for (let l = 0; l <= Math.min(fwdLayer, layers.length - 1); l++)
        for (let n = 0; n < layers[l]; n++) {
          const target = seededRnd(t * .003 + l * 77 + n * 13) * .8 + .15;
          acts[l][n] += (target - acts[l][n]) * .18;
        }
    } else if (phase === 'bwd') {
      if (phaseT % 16 === 0) {
        bwdLayer--;
        if (bwdLayer >= 0 && bwdLayer < layers.length - 1) {
          const netX = W * .44, netW = W * .42, netH = H * .72, netY = H * .14;
          const srcLayer = bwdLayer + 1, tgtLayer = bwdLayer;
          const x0 = netX + srcLayer * (netW / (layers.length - 1));
          const x1 = netX + tgtLayer * (netW / (layers.length - 1));
          for (let j = 0; j < layers[srcLayer]; j++) {
            const y0 = netY + (j + .5) * (netH / layers[srcLayer]);
            const i = Math.floor(seededRnd(t * 99 + srcLayer * 17 + j * 31) * layers[tgtLayer]);
            const y1 = netY + (i + .5) * (netH / layers[tgtLayer]);
            pulses.push({ x0, y0: y0, x1, y1, val: grads[srcLayer][j], age: 0, maxAge: 18, isBwd: true });
          }
        }
        if (bwdLayer < 0) {
          lossVal = Math.max(.04, lossVal * 0.96 + (seededRnd(epoch * 31) - .5) * 0.08 * lossVal);
          lossHist[lossPtr] = lossVal; lossPtr = (lossPtr + 1) % lossHist.length;
          epoch++; step++; phase = 'pause'; phaseT = 0; fwdLayer = 0;
          grads = layers.map(n => Array(n).fill(0));
        }
      }
      for (let l = bwdLayer; l < layers.length; l++)
        for (let n = 0; n < layers[l]; n++) {
          const target = seededRnd(t * .002 + l * 99 + n * 17) * .7 + .1;
          grads[l][n] += (target - grads[l][n]) * .22;
        }
    } else {
      if (phaseT > 28) { phase = 'fwd'; phaseT = 0; fwdLayer = 0; acts = layers.map(n => Array(n).fill(0)); }
    }
    const netX = W * .44, netW = W * .42, netH = H * .72, netY = H * .14;
    const lossX = W * .44, lossY = netY + netH + 10, lossW = netW, lossH = 48;
    for (let l = 0; l < layers.length - 1; l++) {
      const x0 = netX + l * (netW / (layers.length - 1));
      const x1 = netX + (l + 1) * (netW / (layers.length - 1));
      for (let i = 0; i < layers[l]; i++) {
        const y0 = netY + (i + .5) * (netH / layers[l]);
        for (let j = 0; j < layers[l + 1]; j++) {
          const y1 = netY + (j + .5) * (netH / layers[l + 1]);
          const w = weights[l][i][j];
          const isFwdActive = phase === 'fwd' && fwdLayer > l;
          const isBwdActive = phase === 'bwd' && bwdLayer <= l;
          let edgeA = .06;
          if (isFwdActive) { const sig = acts[l][i] * Math.abs(w); edgeA = .04 + sig * .22; }
          if (isBwdActive) { const sig = grads[l + 1][j] * Math.abs(w); edgeA = .04 + sig * .22; }
          if (phase === 'pause') {
            const flashAlpha = Math.sin(phaseT / 28 * Math.PI) * .15;
            ctx.strokeStyle = `rgba(34,197,94,${flashAlpha * a})`; ctx.lineWidth = Math.abs(w) * 1.4 + 1.2;
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          }
          const col = isBwdActive ? `rgba(190,18,60,${edgeA * a})` : `rgba(29,78,216,${edgeA * a})`;
          ctx.strokeStyle = col; ctx.lineWidth = Math.abs(w) * 1.4 + .3;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
      }
    }
    layers.forEach((n, l) => {
      const lx = netX + l * (netW / (layers.length - 1));
      for (let ni = 0; ni < n; ni++) {
        const ny2 = netY + (ni + .5) * (netH / n);
        const act = acts[l][ni], grad = grads[l][ni];
        const isFwdLit = phase === 'fwd' && fwdLayer >= l;
        const isBwdLit = phase === 'bwd' && bwdLayer <= l;
        let fill: string, stroke: string;
        if (isBwdLit && grad > .1) {
          fill = `rgba(190,18,60,${(.08 + grad * .28) * a})`; stroke = `rgba(190,18,60,${(.3 + grad * .4) * a})`;
        } else if (isFwdLit && act > .1) {
          fill = `rgba(29,78,216,${(.06 + act * .25) * a})`; stroke = `rgba(29,78,216,${(.2 + act * .45) * a})`;
        } else {
          fill = `rgba(244,244,245,${.55 * a})`; stroke = ink(.14 * a);
        }
        ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(lx, ny2, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (l === layers.length - 1 && isFwdLit) {
          ctx.fillStyle = ink(.45 * a); ctx.font = '8px Courier New'; ctx.textAlign = 'left';
          ctx.fillText(act.toFixed(2), lx + 13, ny2 + 3);
        }
      }
      ctx.fillStyle = ink(.24 * a); ctx.font = '9px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(lNames[l], netX + l * (netW / (layers.length - 1)), netY - 8);
      ctx.fillStyle = ink(.14 * a); ctx.font = '8px Courier New';
      ctx.fillText('×' + n, netX + l * (netW / (layers.length - 1)), netY + netH + 12);
    });
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]; p.age++;
      const progress = p.age / p.maxAge, fade = Math.max(0, 1 - progress);
      if (progress >= 1) { pulses.splice(i, 1); continue; }
      const px = p.x0 + progress * (p.x1 - p.x0), py = p.y0 + progress * (p.y1 - p.y0);
      const col = p.isBwd ? `rgba(190,18,60,${fade * .6 * a})` : `rgba(29,78,216,${fade * .6 * a})`;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(244,244,245,${fade * .8 * a})`; ctx.font = '7px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(p.val.toFixed(2), px, py + 2);
    }
    const phLbl = phase === 'fwd' ? '→ forward pass' : phase === 'bwd' ? '← backprop' : 'updating weights';
    const phCol = phase === 'bwd' ? `rgba(190,18,60,${.55 * a})` : ink(.4 * a);
    ctx.fillStyle = phCol; ctx.font = '10px Courier New'; ctx.textAlign = 'left';
    ctx.fillText(phLbl, netX, netY - 22);
    ctx.fillStyle = ink(.22 * a); ctx.textAlign = 'right';
    ctx.fillText(`epoch ${epoch}  step ${step}`, netX + netW, netY - 22);
    ctx.fillStyle = `rgba(244,244,245,${.45 * a})`; ctx.strokeStyle = ink(.1 * a); ctx.lineWidth = 1;
    ctx.fillRect(lossX, lossY, lossW, lossH); ctx.strokeRect(lossX, lossY, lossW, lossH);
    ctx.fillStyle = ink(.2 * a); ctx.font = '8px Courier New'; ctx.textAlign = 'left';
    ctx.fillText('training loss', lossX + 4, lossY + 10);
    const pts: [number, number][] = [];
    for (let i = 0; i < lossHist.length; i++) {
      const idx = (lossPtr + i) % lossHist.length;
      if (lossHist[idx] === null) continue;
      const px2 = lossX + 4 + (i / lossHist.length) * (lossW - 8);
      const py2 = lossY + lossH - 6 - ((lossHist[idx] as number) / 2.6) * (lossH - 16);
      pts.push([px2, py2]);
    }
    if (pts.length > 1) {
      ctx.strokeStyle = `rgba(21,128,61,${.7 * a})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(([px2, py2]) => ctx.lineTo(px2, py2)); ctx.stroke();
    }
    ctx.fillStyle = `rgba(21,128,61,${.6 * a})`; ctx.font = '9px Courier New'; ctx.textAlign = 'right';
    ctx.fillText('loss=' + lossVal.toFixed(3), lossX + lossW - 4, lossY + 10);
  };
})();

// ── L6: TCP three-way handshake + packet routing ──
const L6 = (() => {
  type Router = { x: number; y: number; n: string };
  type Packet = {
    hop: number; prog: number; ttl: number; spd: number; id: number;
    proto: string; flags: string[]; src: string; dst: string;
    sport: number; dport: number; size: number; seq: number;
    trail: { x: number; y: number }[]; path: number[];
    _cx?: number; _cy?: number;
  };
  const rs: Router[] = [
    { x: .1, y: .5, n: 'SRC' }, { x: .28, y: .28, n: 'R1' }, { x: .28, y: .72, n: 'R2' },
    { x: .5, y: .5, n: 'R3' }, { x: .7, y: .28, n: 'R4' }, { x: .7, y: .72, n: 'R5' }, { x: .88, y: .5, n: 'DST' },
  ];
  const pktPaths = [[0,1,3,4,6],[0,2,3,5,6],[0,1,2,3,5,6],[0,2,3,4,6],[1,3,5,6],[2,3,4,6],[0,1,3,5,6],[1,2,3,4,6]];
  const revPath = [6, 4, 3, 1, 0];
  const allE: [number, number][] = [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6],[1,2]];
  let pkts: Packet[] = [], t = 0, pktId = 0;
  let tcpState = 1, tcpTimer = 0;
  type SynAck = { hop: number; prog: number; spd: number; trail: { x: number; y: number }[] } | null;
  let synAckPkt: SynAck = null;
  const protos = ['TCP', 'TCP', 'UDP', 'TCP', 'ICMP'];
  const flags = [['SYN'], ['ACK', 'PSH'], ['ACK'], ['SYN', 'ACK'], []];
  const srcs = ['10.0.0.1', '192.168.1.4', '172.16.0.2', '10.0.0.1', '10.0.0.7'];
  const dsts = ['10.0.0.9', '10.0.0.9', '224.0.0.5', '192.168.2.1', '10.0.0.9'];
  const ports = [[49152, 443], [58234, 80], [12345, 53], [44100, 443], [0, 0]];
  const sizes = [60, 1460, 512, 60, 84];
  let pidx = 0;
  const protoColor: Record<string, string> = { 'TCP': 'rgba(29,78,216,', 'UDP': 'rgba(180,83,9,', 'ICMP': 'rgba(100,100,110,' };

  function mkPkt(): Packet {
    const i = pidx % protos.length; pidx++;
    const pth = pktPaths[Math.floor(Math.random() * pktPaths.length)];
    return {
      hop: 0, prog: 0, ttl: 64 - Math.floor(Math.random() * 4), spd: .009 + Math.random() * .006, id: pktId++,
      proto: protos[i], flags: flags[i], src: srcs[i], dst: dsts[i],
      sport: ports[i][0], dport: ports[i][1], size: sizes[i], seq: Math.floor(Math.random() * 0xFFFF),
      trail: [], path: pth,
    };
  }

  function drawTCP(ctx: Ctx, W: number, H: number, a: number) {
    const sdX = 20, sdY = H * .1, sdW = W * 0.32, sdH = H * 0.8;
    const srcX = sdX + 20, dstX = sdX + sdW - 20, y1 = sdY + 40, y2 = sdY + sdH - 40;
    ctx.fillStyle = `rgba(244,244,245,${0.05 * a})`; ctx.strokeStyle = ink(.06 * a); ctx.lineWidth = 1;
    ctx.fillRect(sdX, sdY, sdW, sdH); ctx.strokeRect(sdX, sdY, sdW, sdH);
    ctx.fillStyle = ink(.25 * a); ctx.font = '10px Courier New'; ctx.textAlign = 'left';
    ctx.fillText('TCP Handshake', sdX + 8, sdY + 16);
    ctx.strokeStyle = ink(.15 * a); ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(srcX, y1); ctx.lineTo(srcX, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dstX, y1); ctx.lineTo(dstX, y2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = ink(.5 * a); ctx.font = '9px Courier New'; ctx.textAlign = 'center';
    ctx.fillText('SRC', srcX, y1 - 10); ctx.fillText('DST', dstX, y1 - 10);
    const arrows = [
      { label: 'SYN', from: 'SRC', to: 'DST', col: 'rgba(180,83,9,' },
      { label: 'SYN-ACK', from: 'DST', to: 'SRC', col: 'rgba(21,128,61,' },
      { label: 'ACK', from: 'SRC', to: 'DST', col: 'rgba(29,78,216,' },
      { label: 'DATA', from: 'SRC', to: 'DST', col: 'rgba(24,24,27,' },
    ];
    let yPos = y1 + 30;
    arrows.forEach((arr, idx) => {
      if (idx + 1 <= tcpState) {
        const fromX = arr.from === 'SRC' ? srcX : dstX, toX = arr.from === 'SRC' ? dstX : srcX;
        const progress = tcpState > idx + 1 ? 1 : tcpState === idx + 1 ? Math.min(tcpTimer / 80, 1) : 0;
        if (progress > 0) {
          const x1c = fromX, y = yPos, x2c = fromX + (toX - fromX) * progress;
          ctx.strokeStyle = `${arr.col}${0.7 * a})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x1c, y); ctx.lineTo(x2c, y); ctx.stroke();
          if (progress > 0.3) {
            const arrowSize = 6, dx = toX - fromX, angle = dx > 0 ? 0 : Math.PI;
            ctx.fillStyle = `${arr.col}${0.7 * a})`;
            ctx.beginPath(); ctx.moveTo(x2c, y);
            ctx.lineTo(x2c - arrowSize * Math.cos(angle - Math.PI / 6), y - arrowSize * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(x2c - arrowSize * Math.cos(angle + Math.PI / 6), y - arrowSize * Math.sin(angle + Math.PI / 6));
            ctx.closePath(); ctx.fill();
          }
          ctx.fillStyle = `${arr.col}${0.6 * a})`; ctx.font = '8px Courier New'; ctx.textAlign = 'center';
          ctx.fillText(arr.label, fromX + (toX - fromX) / 2, y - 6);
        }
        yPos += 25;
      }
    });
  }

  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++; tcpTimer++;
    if (tcpTimer > 90) { tcpState = tcpState < 4 ? tcpState + 1 : 1; tcpTimer = 0; }
    if (t % 140 === 0 || t === 1) pkts.push(mkPkt());
    const activeEdges = new Set<string>(), activeNodes = new Set<number>();
    pkts.forEach(p => {
      if (p.hop < p.path.length - 1) {
        const a2 = Math.min(p.path[p.hop], p.path[p.hop + 1]), b2 = Math.max(p.path[p.hop], p.path[p.hop + 1]);
        activeEdges.add(a2 + ',' + b2); activeNodes.add(p.path[p.hop]); activeNodes.add(p.path[p.hop + 1]);
      }
    });
    allE.forEach(([i, j]) => {
      const on = activeEdges.has(Math.min(i, j) + ',' + Math.max(i, j));
      ctx.strokeStyle = on ? ink(.22 * a) : ink(.06 * a); ctx.lineWidth = on ? 1.8 : 1;
      ctx.beginPath(); ctx.moveTo(rs[i].x * W, rs[i].y * H); ctx.lineTo(rs[j].x * W, rs[j].y * H); ctx.stroke();
    });
    rs.forEach((r, i) => {
      const rx = r.x * W, ry = r.y * H, on = activeNodes.has(i);
      ctx.fillStyle = on ? ink(.08 * a) : `rgba(244,244,245,${.6 * a})`;
      ctx.strokeStyle = on ? ink(.3 * a) : ink(.1 * a); ctx.lineWidth = on ? 1.5 : 1;
      ctx.beginPath(); ctx.arc(rx, ry, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = on ? ink(.6 * a) : ink(.25 * a); ctx.font = '10px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(r.n, rx, ry + 4);
    });
    pkts = pkts.filter(p => p.hop < p.path.length - 1);
    pkts.forEach(p => {
      p.prog += p.spd;
      if (p.prog >= 1) { p.hop++; p.prog = 0; p.ttl--; if (p.hop >= p.path.length - 1) return; }
      const c = rs[p.path[p.hop]], n2 = rs[p.path[Math.min(p.hop + 1, p.path.length - 1)]];
      p._cx = (c.x + (n2.x - c.x) * p.prog) * W; p._cy = (c.y + (n2.y - c.y) * p.prog) * H;
      p.trail.push({ x: p._cx, y: p._cy }); if (p.trail.length > 4) p.trail.shift();
      // Note: mouseX/mouseY from window are used for hover — skip hover in TS module, handled by BgCanvas
      const isHov = false;
      const col = protoColor[p.proto] || 'rgba(100,100,110,';
      p.trail.forEach((tp, tidx) => {
        const trailAlpha = ((tidx + 1) / p.trail.length) * 0.6 * a, trailRadius = 5 * (tidx + 1) / p.trail.length;
        ctx.fillStyle = `${col}${trailAlpha})`; ctx.beginPath(); ctx.arc(tp.x, tp.y, trailRadius, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = isHov ? `${col}0.9)` : `${col}${0.8 * a})`;
      ctx.beginPath(); ctx.arc(p._cx, p._cy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `${col}${0.8 * a})`; ctx.font = '9px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(`${p.proto} TTL=${p.ttl}`, p._cx, p._cy - 11);
    });
    if (tcpState === 1) synAckPkt = null;
    if (tcpState === 2 && !synAckPkt) synAckPkt = { hop: 0, prog: 0, spd: .014, trail: [] };
    if (synAckPkt) {
      synAckPkt.prog += synAckPkt.spd;
      if (synAckPkt.prog >= 1) { synAckPkt.hop++; synAckPkt.prog = 0; }
      if (synAckPkt.hop >= revPath.length - 1) { synAckPkt = null; }
      else {
        const c = rs[revPath[synAckPkt.hop]], n2 = rs[revPath[Math.min(synAckPkt.hop + 1, revPath.length - 1)]];
        const sx2 = (c.x + (n2.x - c.x) * synAckPkt.prog) * W, sy2 = (c.y + (n2.y - c.y) * synAckPkt.prog) * H;
        synAckPkt.trail.push({ x: sx2, y: sy2 }); if (synAckPkt.trail.length > 6) synAckPkt.trail.shift();
        synAckPkt.trail.forEach((tp, ti) => {
          ctx.fillStyle = `rgba(21,128,61,${((ti + 1) / synAckPkt!.trail.length) * 0.55 * a})`;
          ctx.beginPath(); ctx.arc(tp.x, tp.y, 5 * (ti + 1) / synAckPkt!.trail.length, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = `rgba(21,128,61,${0.85 * a})`; ctx.beginPath(); ctx.arc(sx2, sy2, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(21,128,61,${0.8 * a})`; ctx.font = '9px Courier New'; ctx.textAlign = 'center';
        ctx.fillText('SYN-ACK ←', sx2, sy2 - 11);
      }
    }
    drawTCP(ctx, W, H, a);
  };
})();

// ── L5: Source → Tokens → AST → ASM ──
const L5 = (() => {
  let t = 0;
  type Tok = { t: string; c: string };
  const toks: Tok[] = [
    { t: 'int', c: '#b45309' }, { t: 'main', c: '#1d4ed8' }, { t: '(', c: '#6b7280' }, { t: ')', c: '#6b7280' },
    { t: '{', c: '#7e22ce' }, { t: 'ret', c: '#b45309' }, { t: 'x', c: '#15803d' }, { t: '+', c: '#1d4ed8' },
    { t: 'y', c: '#15803d' }, { t: ';', c: '#9ca3af' }, { t: '}', c: '#7e22ce' },
  ];
  const asm = ['push  rbp', 'mov   rbp,rsp', 'mov   eax,[rbp-4]', 'add   eax,[rbp-8]', 'pop   rbp', 'ret'];
  let lastSpawnedTokenIdx = -1;
  type Particle = { id: number; x: number; y: number; startX: number; startY: number; endX: number; endY: number; label: string; color: string; progress: number; speed: number; stage: number };
  let particles: Particle[] = [], nextParticleId = 0;
  let highlightedAstNode: number | null = null, highlightIntensity = 0;
  const tokenToAstMap: Record<string, number> = { 'x': 2, 'y': 3, '+': 1, 'ret': 0 };

  function spawnParticle(sx: number, sy: number, ex: number, ey: number, label: string, color: string) {
    particles.push({ id: nextParticleId++, x: sx, y: sy, startX: sx, startY: sy, endX: ex, endY: ey, label, color, progress: 0, speed: .045, stage: 0 });
  }

  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++;
    const xs = [W * .11, W * .34, W * .57, W * .80], cy = H / 2;
    ['SOURCE', 'TOKENS', 'AST', 'ASM'].forEach((h, i) => {
      ctx.fillStyle = ink(.25 * a); ctx.font = '9px Courier New'; ctx.textAlign = 'center'; ctx.fillText(h, xs[i], cy - 128);
      ctx.strokeStyle = ink(.07 * a); ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(xs[i], cy - 120); ctx.lineTo(xs[i], cy + 130); ctx.stroke(); ctx.setLineDash([]);
    });
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = ink(.12 * a); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xs[i] + 52, cy); ctx.lineTo(xs[i + 1] - 52, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xs[i + 1] - 57, cy - 4); ctx.lineTo(xs[i + 1] - 50, cy); ctx.lineTo(xs[i + 1] - 57, cy + 4); ctx.stroke();
    }
    const sourceLines = ['int x=42;', 'int y=8;', 'ret x+y;'], sourceY = [cy - 20, cy + 2, cy + 24];
    sourceLines.forEach((l, i) => {
      ctx.fillStyle = ink(.4 * a); ctx.font = '10px Courier New'; ctx.textAlign = 'left'; ctx.fillText(l, xs[0] - 38, sourceY[i]);
    });
    const scanProgress = (t % 240) / 240, scanCursorX = xs[0] - 38 + scanProgress * 70;
    ctx.strokeStyle = `rgba(29,78,216,${.5 * a})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(scanCursorX, cy - 35); ctx.lineTo(scanCursorX, cy + 35); ctx.stroke();
    if (t % 55 === 0 && lastSpawnedTokenIdx < toks.length - 1) {
      lastSpawnedTokenIdx++;
      if (lastSpawnedTokenIdx < toks.length) {
        const tok = toks[lastSpawnedTokenIdx];
        spawnParticle(xs[0] + 10, cy, xs[1] - 26, cy - 46, tok.t, tok.c);
      }
    }
    particles = particles.filter(p => {
      p.progress += p.speed;
      const t_lerp = Math.min(1, p.progress);
      p.x = p.startX + (p.endX - p.startX) * t_lerp;
      p.y = p.startY + (p.endY - p.startY) * t_lerp;
      if (p.progress >= 1 && p.stage < 2) {
        p.stage++; p.progress = 0;
        if (p.stage === 1) {
          p.startX = xs[1]; p.startY = cy - 46; p.endX = xs[2]; p.endY = cy - 2;
          highlightedAstNode = tokenToAstMap[p.label] ?? null; highlightIntensity = 1;
        } else if (p.stage === 2) {
          p.startX = xs[2]; p.startY = cy - 2; p.endX = xs[3]; p.endY = cy; highlightedAstNode = null;
        }
        return true;
      }
      return p.stage < 2 || (p.stage === 2 && p.progress < 1);
    });
    toks.forEach((tok, i) => {
      const ap = Math.sin(t * .035 + i * .55) * .5 + .5;
      ctx.globalAlpha = ap * a; ctx.fillStyle = tok.c; ctx.font = '11px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(tok.t, xs[1] - 26 + (i % 3) * 24, cy - 46 + Math.floor(i / 3) * 22); ctx.globalAlpha = 1;
    });
    type AstNode = { l: string; x: number; y: number };
    const ast: AstNode[] = [{ l: 'ret', x: xs[2], y: cy - 42 }, { l: '+', x: xs[2], y: cy - 2 }, { l: 'x', x: xs[2] - 24, y: cy + 38 }, { l: 'y', x: xs[2] + 24, y: cy + 38 }];
    if (highlightedAstNode !== null) highlightIntensity = Math.max(0, highlightIntensity - .06);
    [[0, 1], [1, 2], [1, 3]].forEach(([s, d]) => {
      ctx.strokeStyle = ink(.18 * a); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ast[s].x, ast[s].y + 10); ctx.lineTo(ast[d].x, ast[d].y - 10); ctx.stroke();
    });
    ast.forEach((n, idx) => {
      const isHL = highlightedAstNode === idx && highlightIntensity > 0.05;
      if (isHL) { ctx.fillStyle = `rgba(29,78,216,${(.15 + highlightIntensity * .25) * a})`; ctx.strokeStyle = `rgba(29,78,216,${(.5 + highlightIntensity * .3) * a})`; ctx.lineWidth = 2.5; }
      else { ctx.fillStyle = `rgba(244,244,245,${.9 * a})`; ctx.strokeStyle = ink(.25 * a); ctx.lineWidth = 1; }
      ctx.beginPath(); ctx.arc(n.x, n.y, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = isHL ? `rgba(29,78,216,${(.8 + highlightIntensity * .2) * a})` : ink(.55 * a);
      ctx.font = `${isHL ? '600 ' : ''}10px Courier New`; ctx.textAlign = 'center'; ctx.fillText(n.l, n.x, n.y + 4);
    });
    const cur = Math.floor(t * .04) % asm.length;
    asm.forEach((l, i) => {
      if (i === cur) { ctx.fillStyle = ink(.07 * a); ctx.fillRect(xs[3] - 46, cy - 50 + i * 22 - 11, 95, 15); }
      ctx.fillStyle = i === cur ? ink(.8 * a) : ink(.28 * a);
      ctx.font = `${i === cur ? '600 ' : ''}10px Courier New`; ctx.textAlign = 'left'; ctx.fillText(l, xs[3] - 44, cy - 39 + i * 22);
    });
    particles.forEach(p => {
      ctx.fillStyle = p.color; ctx.globalAlpha = .85 * a;
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(244,244,245,${.3 * a})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(244,244,245,${.9 * a})`; ctx.font = '8px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(p.label, p.x, p.y + 3);
    });
  };
})();

// ── L4: OoO Tomasulo — 4-box overview + hover detail ──
export let L4_hov = -1;
const L4 = (() => {
  let t = 0;
  const iNms = ['ADD', 'MUL', 'LOAD', 'FMUL', 'AND', 'STR', 'MUL', 'XOR'];
  const iTps = ['INT', 'MUL', 'LOAD', 'MUL', 'INT', 'STR', 'MUL', 'INT'];
  const iCls = ['#1d4ed8', '#7e22ce', '#b45309', '#15803d', '#1d4ed8', '#b45309', '#be123c', '#1d4ed8'];
  let rob: ({ nm: string; cl: string; done: boolean; tag: string } | null)[] = Array(12).fill(null);
  let robHead = 0, robTail = 0;
  const rsCap: Record<string, number> = { INT: 3, LOAD: 2, MUL: 2, STR: 2 };
  const rsE: Record<string, { nm: string; cl: string; tag: string; rdy: boolean; tmr: number }[]> = { INT: [], LOAD: [], MUL: [], STR: [] };
  let rat: (string | null)[] = Array(8).fill(null);
  type Fe = { nm: string; tp: string; cl: string; st: number; age: number; regIdx: number; gone?: boolean };
  let fe: Fe[] = [], iSeq = 0, cdb: { nm: string; tag: string; prog: number; cl: string } | null = null;
  const fuBusy: Record<string, number> = { INT: 0, LOAD: 0, MUL: 0, STR: 0 };
  let robFlash = { tag: null as string | null, timer: 0 }, ratFlash = { tag: null as string | null, timer: 0 };
  type Flow = { x0: number; y0: number; x1: number; y1: number; cpx: number; cpy: number; cl: string; nm: string; phase: string; spd: number; prog: number };
  let flows: Flow[] = [];
  const rsTypes = ['INT', 'LOAD', 'MUL', 'STR'];
  const rsCl: Record<string, string> = { INT: '#1d4ed8', LOAD: '#b45309', MUL: '#7e22ce', STR: '#15803d' };

  function spawnFlow(x0: number, y0: number, x1: number, y1: number, cpx: number, cpy: number, cl: string, nm: string, phase: string, spd = .055) {
    flows.push({ x0, y0, x1, y1, cpx, cpy, cl, nm, phase, spd, prog: 0 });
  }

  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++;
    const sx = W * .42, ag = Math.max(12, Math.floor(W * .018));
    const bW = Math.floor((W * .56 - 3 * ag) / 4), bH = 72, bY = H * .42;
    const bX = [sx, sx + bW + ag, sx + 2 * (bW + ag), sx + 3 * (bW + ag)];
    const bCX = bX.map(x => x + bW / 2), bCY = bY + bH / 2;
    const dpY = bY + bH + 18, dpH = 170;
    if (t % 22 === 0 && fe.length < 4) {
      const idx = iSeq % iNms.length;
      fe.push({ nm: iNms[idx], tp: iTps[idx], cl: iCls[idx], st: 0, age: 0, regIdx: iSeq % 8 });
      iSeq++;
    }
    fe.forEach(p => p.age++);
    fe.filter(p => p.st < 2 && p.age > 10).forEach(p => {
      const jx = bCX[0] + (p.st === 0 ? -14 : 14);
      spawnFlow(jx, bCY, jx + 28, bCY, jx + 14, bCY - 12, p.cl, p.nm, 'fe', .1);
      p.st++; p.age = 0;
    });
    fe.filter(p => p.st === 2 && p.age > 8).forEach(p => {
      if (rsE[p.tp].length < rsCap[p.tp] && (robTail - robHead) < 12) {
        const tag = 'T' + (robTail % 12);
        rsE[p.tp].push({ nm: p.nm, cl: p.cl, tag, rdy: false, tmr: 0 });
        rob[robTail % 12] = { nm: p.nm, cl: p.cl, done: false, tag };
        rat[p.regIdx] = tag; robTail++;
        spawnFlow(bCX[0], bCY, bCX[1], bCY, (bCX[0] + bCX[1]) / 2, bCY - 30, p.cl, p.nm, 'dispatch', .05);
        p.gone = true;
      }
    });
    fe = fe.filter(p => !p.gone);
    Object.entries(rsE).forEach(([tp, arr]) => {
      arr.forEach(e => { e.tmr++; if (!e.rdy && e.tmr > 8) e.rdy = true; });
      if (fuBusy[tp] === 0) {
        const ri = arr.findIndex(e => e.rdy);
        if (ri >= 0) {
          const e = arr[ri];
          fuBusy[tp] = tp === 'MUL' ? 32 : tp === 'LOAD' ? 50 : 40;
          const ri2 = parseInt(e.tag.slice(1));
          if (rob[ri2]) rob[ri2]!.done = true;
          rat = rat.map(r => r === e.tag ? null : r);
          spawnFlow(bCX[1], bCY, bCX[2], bCY, (bCX[1] + bCX[2]) / 2, bCY - 30, e.cl, e.nm, 'rs_fu', .065);
          if (!cdb) cdb = { nm: e.nm, tag: e.tag, prog: 0, cl: e.cl };
          arr.splice(ri, 1);
        }
      } else fuBusy[tp]--;
    });
    if (cdb) {
      cdb.prog += 0.025;
      if (cdb.prog >= 1) { robFlash = { tag: cdb.tag, timer: 22 }; ratFlash = { tag: cdb.tag, timer: 22 }; cdb = null; }
    }
    if (robFlash.timer > 0) robFlash.timer--;
    if (ratFlash.timer > 0) ratFlash.timer--;
    const hi = robHead % 12;
    if (rob[hi]?.done && t % 10 === 0) {
      spawnFlow(bCX[3], bCY, bCX[3], bCY - 52, bCX[3] + 30, bCY - 26, rob[hi]!.cl, rob[hi]!.nm, 'commit', .062);
      rob[hi] = null; robHead++;
    }
    flows.forEach(f => f.prog = Math.min(1, f.prog + f.spd));
    flows = flows.filter(f => f.prog < 1);
    const boxLabels = ['FE / Issue', 'RS / Dispatch', 'Func. Units', 'ROB + RAT'];
    const boxAccent = ['rgba(29,78,216,', 'rgba(180,83,9,', 'rgba(126,34,206,', 'rgba(21,128,61,'];
    const dotSets = [
      fe.map(p => ({ cl: p.cl, nm: p.nm })),
      Object.values(rsE).flat().map(e => ({ cl: e.cl, nm: e.nm })),
      rsTypes.filter(tp => fuBusy[tp] > 0).map(tp => ({ cl: rsCl[tp], nm: tp })),
      rob.filter(r => r).map(r => ({ cl: r!.cl, nm: r!.nm })),
    ];
    ctx.fillStyle = ink(.22 * a); ctx.font = '10px Courier New'; ctx.textAlign = 'left';
    ctx.fillText('Tomasulo Out-of-Order Machine', sx, bY - 14);
    boxLabels.forEach((lbl, i) => {
      const x = bX[i], y = bY, isHov = L4_hov === i;
      ctx.fillStyle = boxAccent[i] + (.07 * a) + ')';
      ctx.strokeStyle = boxAccent[i] + (isHov ? .6 : .2) * a + ')';
      ctx.lineWidth = isHov ? 1.5 : 1;
      ctx.fillRect(x, y, bW, bH); ctx.strokeRect(x, y, bW, bH);
      ctx.fillStyle = boxAccent[i] + (.72 * a) + ')';
      ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(lbl, x + bW / 2, y + 15);
      const dots = dotSets[i], dR = 5, dSp = 13, maxDots = Math.min(dots.length, 9);
      const dotRowW = maxDots * dSp - dSp + dR * 2, dotX0 = x + bW / 2 - dotRowW / 2 + dR;
      dots.slice(0, 9).forEach((d, di) => {
        ctx.fillStyle = d.cl; ctx.globalAlpha = .85 * a;
        ctx.beginPath(); ctx.arc(dotX0 + di * dSp, y + bH / 2 + 10, dR, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      });
      ctx.fillStyle = boxAccent[i] + (.38 * a) + ')'; ctx.font = '8px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(dots.length + ' active', x + bW / 2, y + bH - 5);
    });
    for (let i = 0; i < 3; i++) {
      const ax = bX[i] + bW + 2, ay = bCY, aw = ag - 4;
      ctx.strokeStyle = ink(.18 * a); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + aw, ay); ctx.stroke();
      ctx.fillStyle = ink(.18 * a);
      ctx.beginPath(); ctx.moveTo(ax + aw - 4, ay - 3); ctx.lineTo(ax + aw, ay); ctx.lineTo(ax + aw - 4, ay + 3); ctx.fill();
    }
    {
      const x0 = bCX[2], x1 = bCX[1], arcY = bY - 28;
      ctx.strokeStyle = cdb ? `rgba(126,34,206,${.5 * a})` : ink(.1 * a);
      ctx.lineWidth = cdb ? 1.5 : 1; ctx.setLineDash(cdb ? [] : [3, 4]);
      ctx.beginPath(); ctx.moveTo(x0, bY);
      ctx.quadraticCurveTo((x0 + x1) / 2, arcY, x1, bY);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = ink(.2 * a); ctx.font = '7px Courier New'; ctx.textAlign = 'center';
      ctx.fillText('CDB', (x0 + x1) / 2, arcY - 4);
      if (cdb) {
        const cx2 = bz(cdb.prog, x0, (x0 + x1) / 2, x1), cy2 = bz(cdb.prog, bY, arcY, bY);
        ctx.fillStyle = cdb.cl; ctx.globalAlpha = .85 * a;
        ctx.beginPath(); ctx.arc(cx2, cy2, 5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = 'white'; ctx.font = 'bold 6px Courier New'; ctx.textAlign = 'center';
        ctx.fillText(cdb.nm, cx2, cy2 + 2);
      }
    }
    const hov = L4_hov;
    if (hov >= 0) {
      const px = bX[hov], panW = Math.min(hov === 3 ? bW * 2 + ag : bW, W - bX[hov] - 2);
      ctx.fillStyle = `rgba(250,250,250,${.94 * a})`;
      ctx.strokeStyle = boxAccent[hov] + (.3 * a) + ')'; ctx.lineWidth = 1;
      ctx.fillRect(px, dpY, panW, dpH); ctx.strokeRect(px, dpY, panW, dpH);
      if (hov === 0) {
        const stages = ['IF', 'Rename', 'ROB Alloc'], sw2 = Math.floor((panW - 12) / 3), sh2 = 48;
        stages.forEach((s, si) => {
          const bx2 = px + 4 + si * (sw2 + 2), by2 = dpY + 12;
          ctx.fillStyle = `rgba(29,78,216,${.07 * a})`; ctx.strokeStyle = `rgba(29,78,216,${.28 * a})`; ctx.lineWidth = 1;
          ctx.fillRect(bx2, by2, sw2, sh2); ctx.strokeRect(bx2, by2, sw2, sh2);
          ctx.fillStyle = `rgba(29,78,216,${.65 * a})`; ctx.font = '8px Courier New'; ctx.textAlign = 'center';
          ctx.fillText(s, bx2 + sw2 / 2, by2 + 13);
          const occ = fe.filter(p => p.st === si);
          occ.forEach((p, pi) => {
            ctx.fillStyle = p.cl; ctx.globalAlpha = .82 * a;
            ctx.beginPath(); ctx.arc(bx2 + sw2 / 2 + (pi - occ.length / 2 + .5) * 12, by2 + 34, 5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
          });
        });
        ctx.fillStyle = ink(.32 * a); ctx.font = '8px Courier New'; ctx.textAlign = 'left';
        ctx.fillText('In-order fetch → rename → ROB allocation', px + 4, dpY + 80);
        ctx.fillText('Dispatches out-of-order to RS on alloc', px + 4, dpY + 93);
        ctx.fillText('Stalls if ROB or RS is full', px + 4, dpY + 106);
      } else if (hov === 1) {
        const cw = Math.floor((panW - 10) / 4) - 2;
        rsTypes.forEach((tp, ti) => {
          const rx2 = px + 4 + ti * (cw + 2), ry2 = dpY + 8;
          ctx.fillStyle = rsCl[tp] + '15'; ctx.strokeStyle = rsCl[tp] + '55'; ctx.lineWidth = 1;
          ctx.fillRect(rx2, ry2, cw, dpH - 14); ctx.strokeRect(rx2, ry2, cw, dpH - 14);
          ctx.fillStyle = rsCl[tp]; ctx.font = 'bold 8px Courier New'; ctx.textAlign = 'center';
          ctx.fillText(tp, rx2 + cw / 2, ry2 + 12);
          ctx.fillStyle = ink(.3 * a); ctx.font = '7px Courier New';
          ctx.fillText(rsE[tp].length + '/' + rsCap[tp], rx2 + cw / 2, ry2 + 23);
          rsE[tp].forEach((e, ei) => {
            const ey2 = ry2 + 32 + ei * 30;
            ctx.fillStyle = e.rdy ? `rgba(21,128,61,${.5 * a})` : `rgba(100,100,100,${.25 * a})`;
            ctx.fillRect(rx2 + 2, ey2, cw - 4, 26);
            ctx.fillStyle = 'white'; ctx.font = 'bold 7px Courier New'; ctx.textAlign = 'center';
            ctx.fillText(e.nm, rx2 + cw / 2, ey2 + 10);
            ctx.fillStyle = e.rdy ? 'rgba(34,197,94,.9)' : 'rgba(160,160,160,.8)';
            ctx.font = '6px Courier New'; ctx.fillText(e.rdy ? 'RDY' : 'wait', rx2 + cw / 2, ey2 + 20);
          });
        });
      } else if (hov === 2) {
        const cw = Math.floor((panW - 10) / 4) - 2;
        rsTypes.forEach((tp, ti) => {
          const fx2 = px + 4 + ti * (cw + 2), fy2 = dpY + 10;
          const busy = fuBusy[tp] > 0, maxLat = tp === 'MUL' ? 32 : tp === 'LOAD' ? 50 : 40;
          ctx.fillStyle = busy ? rsCl[tp] + '15' : `rgba(244,244,245,${.45 * a})`;
          ctx.strokeStyle = busy ? rsCl[tp] + '66' : ink(.12 * a); ctx.lineWidth = busy ? 1.5 : 1;
          ctx.fillRect(fx2, fy2, cw, dpH - 16); ctx.strokeRect(fx2, fy2, cw, dpH - 16);
          ctx.fillStyle = rsCl[tp]; ctx.font = 'bold 8px Courier New'; ctx.textAlign = 'center';
          ctx.fillText(tp, fx2 + cw / 2, fy2 + 13);
          const latLbl = tp === 'MUL' ? '32cy' : tp === 'LOAD' ? '50cy' : '40cy';
          ctx.fillStyle = ink(.3 * a); ctx.font = '7px Courier New'; ctx.fillText(latLbl, fx2 + cw / 2, fy2 + 25);
          if (busy) {
            const prog = 1 - fuBusy[tp] / maxLat;
            ctx.fillStyle = rsCl[tp]; ctx.globalAlpha = .55 * a;
            ctx.fillRect(fx2 + 3, fy2 + dpH - 32, (cw - 6) * prog, 10); ctx.globalAlpha = 1;
            ctx.fillStyle = ink(.45 * a); ctx.font = '8px Courier New'; ctx.textAlign = 'center';
            ctx.fillText(Math.round(prog * 100) + '%', fx2 + cw / 2, fy2 + dpH - 46);
            ctx.fillStyle = rsCl[tp]; ctx.font = 'bold 8px Courier New'; ctx.fillText('BUSY', fx2 + cw / 2, fy2 + 45);
          } else { ctx.fillStyle = ink(.2 * a); ctx.font = '8px Courier New'; ctx.fillText('idle', fx2 + cw / 2, fy2 + 45); }
        });
      } else if (hov === 3) {
        const robEW2 = Math.floor((panW - 10) / 12), robEH2 = 38, rRobY = dpY + 16;
        ctx.fillStyle = ink(.28 * a); ctx.font = '9px Courier New'; ctx.textAlign = 'left';
        ctx.fillText('Reorder Buffer — commits in program order →', px + 4, rRobY - 3);
        for (let i = 0; i < 12; i++) {
          const rx2 = px + 4 + i * robEW2, e = rob[i], isH = (i === robHead % 12) && !!e;
          const fl = robFlash.timer > 0 && robFlash.tag === e?.tag;
          ctx.fillStyle = e ? `rgba(24,24,27,${.06 * a})` : `rgba(250,250,250,${.22 * a})`;
          ctx.strokeStyle = fl ? `rgba(34,197,94,${.8 * a})` : (e?.done ? ink(.38 * a) : ink(.1 * a));
          ctx.lineWidth = fl ? 2 : 1;
          ctx.fillRect(rx2, rRobY, robEW2 - 1, robEH2); ctx.strokeRect(rx2, rRobY, robEW2 - 1, robEH2);
          if (fl) { ctx.fillStyle = `rgba(34,197,94,${.12 * a})`; ctx.fillRect(rx2, rRobY, robEW2 - 1, robEH2); }
          if (e) {
            ctx.fillStyle = e.cl; ctx.globalAlpha = .72 * a;
            ctx.beginPath(); ctx.arc(rx2 + robEW2 / 2 - .5, rRobY + 11, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
            ctx.fillStyle = ink(.4 * a); ctx.font = '6px Courier New'; ctx.textAlign = 'center';
            ctx.fillText(e.nm, rx2 + robEW2 / 2 - .5, rRobY + 26);
            ctx.fillStyle = e.done ? `rgba(21,128,61,${.6 * a})` : `rgba(130,130,130,${.4 * a})`;
            ctx.fillText(e.done ? '✓' : '…', rx2 + robEW2 / 2 - .5, rRobY + 36);
          }
          if (isH) { ctx.fillStyle = ink(.25 * a); ctx.font = '6px Courier New'; ctx.textAlign = 'center'; ctx.fillText('▲', rx2 + robEW2 / 2 - .5, rRobY - 3); }
        }
        const ratEW2 = Math.floor((panW - 10) / 8), ratRowY = rRobY + robEH2 + 14;
        ctx.fillStyle = ink(.28 * a); ctx.font = '9px Courier New'; ctx.textAlign = 'left';
        ctx.fillText('Register Alias Table (8 regs)', px + 4, ratRowY - 3);
        rat.forEach((tag, i) => {
          const rx2 = px + 4 + i * ratEW2, fl = ratFlash.timer > 0 && ratFlash.tag === tag;
          ctx.fillStyle = tag ? `rgba(24,24,27,${.07 * a})` : `rgba(250,250,250,${.2 * a})`;
          ctx.strokeStyle = fl ? `rgba(34,197,94,${.8 * a})` : (tag ? ink(.22 * a) : ink(.09 * a));
          ctx.lineWidth = fl ? 2 : 1;
          ctx.fillRect(rx2, ratRowY, ratEW2 - 1, 30); ctx.strokeRect(rx2, ratRowY, ratEW2 - 1, 30);
          if (fl) { ctx.fillStyle = `rgba(34,197,94,${.12 * a})`; ctx.fillRect(rx2, ratRowY, ratEW2 - 1, 30); }
          ctx.fillStyle = ink(.35 * a); ctx.font = '7px Courier New'; ctx.textAlign = 'center';
          ctx.fillText('r' + i, rx2 + ratEW2 / 2 - .5, ratRowY + 11);
          ctx.fillStyle = tag ? ink(.6 * a) : ink(.16 * a);
          ctx.fillText(tag || '—', rx2 + ratEW2 / 2 - .5, ratRowY + 24);
        });
        const rsUtil = Object.values(rsE).reduce((s, e) => s + e.length, 0);
        const rsTot = Object.values(rsCap).reduce((s, v) => s + v, 0);
        ctx.fillStyle = ink(.32 * a); ctx.font = '8px Courier New'; ctx.textAlign = 'left';
        ctx.fillText('IPC ' + (2.6 + Math.sin(t * .018) * .35).toFixed(2) + '  ROB ' + rob.filter(r => r).length + '/12' + '  RS ' + rsUtil + '/' + rsTot + '  CDB ' + (cdb ? 'active' : 'idle'), px + 4, ratRowY + 44);
      }
    } else {
      ctx.fillStyle = ink(.16 * a); ctx.font = '8px Courier New'; ctx.textAlign = 'left';
      ctx.fillText('hover a block to expand', bX[0], dpY + 14);
    }
    flows.forEach(f => {
      const u = f.prog;
      const fpx = bz(u, f.x0, f.cpx, f.x1), fpy = bz(u, f.y0, f.cpy, f.y1);
      const fade = f.phase === 'commit' ? 1 - u : 1;
      ctx.globalAlpha = .2 * fade * a; ctx.strokeStyle = f.cl; ctx.lineWidth = 2; ctx.beginPath();
      for (let s = 0; s <= 6; s++) {
        const tu = Math.max(0, u - .12) + (u - Math.max(0, u - .12)) * (s / 6);
        const tx2 = bz(tu, f.x0, f.cpx, f.x1), ty2 = bz(tu, f.y0, f.cpy, f.y1);
        s === 0 ? ctx.moveTo(tx2, ty2) : ctx.lineTo(tx2, ty2);
      }
      ctx.stroke();
      ctx.globalAlpha = .9 * fade * a; ctx.fillStyle = f.cl;
      ctx.beginPath(); ctx.arc(fpx, fpy, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.93)'; ctx.font = 'bold 6px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(f.nm, fpx, fpy + 2);
      if (f.phase === 'commit') {
        ctx.globalAlpha = .35 * (1 - u) * a; ctx.strokeStyle = f.cl; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(fpx, fpy, 6 + u * 13, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  };
})();

// ── L3: Waveforms + FSM ──
const L3 = (() => {
  let t = 0, prevState = 0;
  let transitionDot = { fromState: 0, toState: 0, prog: 0 };
  type Sig = { n: string; p: number; dly?: number };
  const sigs: Sig[] = [{ n: 'CLK', p: 36 }, { n: 'D', p: 72 }, { n: 'Q', p: 72, dly: 36 }, { n: 'STATE', p: 108 }, { n: 'VALID', p: 144 }, { n: 'VGA_HS', p: 60 }];
  const fsmStates = ['IDLE', 'FETCH', 'DECODE', 'EXECUTE', 'WRITEBACK'];
  const fsmEdges: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,0],[2,0]];
  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++;
    const waveW = W * .52, waveX = W * .44, rh = 38, sy = H / 2 - (sigs.length * rh) / 2;
    const curState = Math.floor(t / 48) % fsmStates.length;
    sigs.forEach((s, i) => {
      const y = sy + i * rh;
      ctx.fillStyle = ink(.45 * a); ctx.font = '10px Courier New'; ctx.textAlign = 'right';
      ctx.fillText(s.n, waveX - 10, y + rh * .5 + 4);
      if (s.n === 'STATE') {
        const segW = 72, clkOff = (t * 1.5) % segW, firstEdge = (segW - clkOff) % segW;
        const topY = y + rh * .14, botY = y + rh * .86;
        const stateColors = ['rgba(120,120,160,', 'rgba(60,150,220,', 'rgba(220,170,50,', 'rgba(60,200,120,', 'rgba(210,80,80,'];
        const rightBound = firstEdge + Math.floor((waveW - firstEdge) / segW) * segW;
        for (let ex = firstEdge - segW; ex <= waveW; ex += segW) {
          const x0 = Math.max(0, ex), x1 = Math.min(waveW, ex + segW);
          if (x1 - x0 < 8) continue;
          const segsFromRight = Math.max(0, Math.round((rightBound - ex) / segW));
          const stIdx = ((curState - segsFromRight) % fsmStates.length + fsmStates.length) % fsmStates.length;
          ctx.fillStyle = stateColors[stIdx] + (.18 * a) + ')';
          ctx.fillRect(waveX + x0, topY, x1 - x0, botY - topY);
          ctx.fillStyle = stateColors[stIdx] + (0.9 * a) + ')';
          ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center';
          ctx.fillText(fsmStates[stIdx], waveX + (x0 + x1) / 2, y + rh * .54 + 3);
        }
        ctx.strokeStyle = ink(.6 * a); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(waveX, topY); ctx.lineTo(waveX + waveW, topY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(waveX, botY); ctx.lineTo(waveX + waveW, botY); ctx.stroke();
        for (let ex = firstEdge; ex <= waveW + 1; ex += segW) {
          if (ex > 4 && ex < waveW - 4) {
            ctx.beginPath(); ctx.moveTo(waveX + ex - 6, topY); ctx.lineTo(waveX + ex + 6, botY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(waveX + ex - 6, botY); ctx.lineTo(waveX + ex + 6, topY); ctx.stroke();
          }
        }
      } else {
        ctx.strokeStyle = ink(.06 * a); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(waveX, y + rh * .5); ctx.lineTo(waveX + waveW, y + rh * .5); ctx.stroke();
        ctx.strokeStyle = ink(.6 * a); ctx.lineWidth = 1.5; ctx.beginPath();
        let prev = false;
        for (let x = 0; x <= waveW; x++) {
          const ph = ((x + t * 1.5 + (s.dly || 0)) % s.p) / s.p, hi = ph < .5;
          const wx = waveX + x;
          if (x === 0) { ctx.moveTo(wx, y + (hi ? rh * .1 : rh * .9)); }
          else if (hi !== prev) { ctx.lineTo(wx, y + (prev ? rh * .1 : rh * .9)); ctx.lineTo(wx, y + (hi ? rh * .1 : rh * .9)); }
          else { ctx.lineTo(wx, y + (hi ? rh * .1 : rh * .9)); }
          prev = hi;
        }
        ctx.stroke();
      }
      if (s.n === 'CLK') {
        for (let x = 0; x < waveW; x += s.p) {
          const ex = waveX + ((x - (t * 1.5) % s.p + s.p) % s.p);
          if (ex > waveX && ex < waveX + waveW) {
            ctx.strokeStyle = ink(.08 * a); ctx.setLineDash([2, 4]);
            ctx.beginPath(); ctx.moveTo(ex, sy); ctx.lineTo(ex, sy + sigs.length * rh); ctx.stroke(); ctx.setLineDash([]);
          }
        }
      }
    });
    ctx.fillStyle = ink(.22 * a); ctx.font = '10px Courier New'; ctx.textAlign = 'left';
    ctx.fillText(`t=${Math.floor(t * 1.5)}ns  clk=100MHz  Artix-7`, waveX, sy + sigs.length * rh + 16);
    const fsmCX = W * .2, fsmCY = H * .5, fsmR = 78;
    ctx.fillStyle = ink(.22 * a); ctx.font = '9px Courier New'; ctx.textAlign = 'center';
    ctx.fillText('FSM State Machine', fsmCX, fsmCY - fsmR - 16);
    if (curState !== prevState) { transitionDot = { fromState: prevState, toState: curState, prog: 0 }; prevState = curState; }
    if (transitionDot.prog < 1) transitionDot.prog += 0.06;
    fsmStates.forEach((s, i) => {
      const ang = -Math.PI / 2 + (i / fsmStates.length) * Math.PI * 2;
      const sx2 = fsmCX + Math.cos(ang) * fsmR, sy2 = fsmCY + Math.sin(ang) * fsmR, active = i === curState;
      ctx.fillStyle = active ? ink(.08 * a) : `rgba(244,244,245,${.8 * a})`;
      ctx.strokeStyle = active ? ink(.45 * a) : ink(.14 * a); ctx.lineWidth = active ? 1.5 : 1;
      ctx.beginPath(); ctx.arc(sx2, sy2, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = active ? ink(.7 * a) : ink(.28 * a); ctx.font = '8px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(s, sx2, sy2 + 4);
    });
    fsmEdges.forEach(([from, to]) => {
      const a1 = -Math.PI / 2 + (from / fsmStates.length) * Math.PI * 2;
      const a2 = -Math.PI / 2 + (to / fsmStates.length) * Math.PI * 2;
      const fx = fsmCX + Math.cos(a1) * fsmR, fy = fsmCY + Math.sin(a1) * fsmR;
      const tx2 = fsmCX + Math.cos(a2) * fsmR, ty = fsmCY + Math.sin(a2) * fsmR;
      const dx = tx2 - fx, dy = ty - fy, dist = Math.sqrt(dx * dx + dy * dy);
      const sx2 = fx + dx * (18 / dist), sy2 = fy + dy * (18 / dist);
      const ex = tx2 - dx * (18 / dist), ey = ty - dy * (18 / dist);
      ctx.strokeStyle = ink(.1 * a); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx2, sy2); ctx.lineTo(ex, ey); ctx.stroke();
      const edgeAngle = Math.atan2(ey - sy2, ex - sx2), arrowSize = 6, arrowAngle = Math.PI / 2.5;
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(edgeAngle - arrowAngle) * arrowSize, ey - Math.sin(edgeAngle - arrowAngle) * arrowSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(edgeAngle + arrowAngle) * arrowSize, ey - Math.sin(edgeAngle + arrowAngle) * arrowSize); ctx.stroke();
    });
    if (transitionDot.prog < 1) {
      const a1 = -Math.PI / 2 + (transitionDot.fromState / fsmStates.length) * Math.PI * 2;
      const a2 = -Math.PI / 2 + (transitionDot.toState / fsmStates.length) * Math.PI * 2;
      const fx = fsmCX + Math.cos(a1) * fsmR, fy = fsmCY + Math.sin(a1) * fsmR;
      const tx2 = fsmCX + Math.cos(a2) * fsmR, ty = fsmCY + Math.sin(a2) * fsmR;
      const dx = tx2 - fx, dy = ty - fy, dist = Math.sqrt(dx * dx + dy * dy);
      const sx2 = fx + dx * (18 / dist), sy2 = fy + dy * (18 / dist);
      const ex = tx2 - dx * (18 / dist), ey = ty - dy * (18 / dist);
      const dotX = sx2 + transitionDot.prog * (ex - sx2), dotY = sy2 + transitionDot.prog * (ey - sy2);
      ctx.fillStyle = ink(.5 * a); ctx.beginPath(); ctx.arc(dotX, dotY, 4, 0, Math.PI * 2); ctx.fill();
    }
    const ca = -Math.PI / 2 + (curState / fsmStates.length) * Math.PI * 2;
    const cx2 = fsmCX + Math.cos(ca) * fsmR, cy2 = fsmCY + Math.sin(ca) * fsmR;
    const pulse = Math.sin(t * .1) * .5 + .5;
    ctx.strokeStyle = ink(.3 * pulse * a); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx2, cy2, 22 + pulse * 4, 0, Math.PI * 2); ctx.stroke();
  };
})();

// ── L2: 4-bit Ripple Carry Adder ──
export let L2_A = 6, L2_B = 5, L2_A_locked = false;
const L2 = (() => {
  let t = 0, eTmr = 0, carryProg = 0;
  const examples = [[6,5],[3,7],[12,4],[9,6],[15,1],[8,7],[11,3]];
  let eIdx = 0;
  function b4(n: number) { return [3, 2, 1, 0].map(i => (n >> i) & 1); }
  function gshape(ctx: Ctx, x: number, y: number, w: number, h: number, type: string, fill: string, stk: string) {
    ctx.fillStyle = fill; ctx.strokeStyle = stk; ctx.lineWidth = 1.2;
    if (type === 'AND') {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w * .5, y + h);
      ctx.arc(x + w * .5, y + h / 2, h / 2, Math.PI / 2, -Math.PI / 2, true); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (type === 'OR') {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w * .38, y, x + w, y + h / 2);
      ctx.quadraticCurveTo(x + w * .38, y + h, x, y + h); ctx.quadraticCurveTo(x + w * .22, y + h / 2, x, y);
      ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.quadraticCurveTo(x + w * .38 + 4, y, x + w, y + h / 2);
      ctx.quadraticCurveTo(x + w * .38 + 4, y + h, x + 4, y + h); ctx.quadraticCurveTo(x + w * .22 + 4, y + h / 2, x + 4, y);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w * .22, y + h / 2, x, y + h); ctx.stroke();
    }
  }
  function wl(ctx: Ctx, pts: [number, number][], col: string, lw = 1.4) {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(([x, y]) => ctx.lineTo(x, y)); ctx.stroke();
  }
  function dotc(ctx: Ctx, x: number, y: number, col: string) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 2.8, 0, Math.PI * 2); ctx.fill(); }
  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++; eTmr++;
    if (eTmr > 290 && !L2_A_locked) { eTmr = 0; eIdx = (eIdx + 1) % examples.length; carryProg = 0; }
    carryProg = Math.min(1, carryProg + 0.007);
    const A = (L2_A_locked ? L2_A : examples[eIdx][0]) & 15;
    const B = (L2_A_locked ? L2_B : examples[eIdx][1]) & 15;
    const fullSum = A + B;
    const aBits = b4(A), bBits = b4(B);
    const cin = [0];
    for (let i = 0; i < 4; i++) { const ai = (A >> i) & 1, bi = (B >> i) & 1, c = cin[i]; cin.push((ai & bi) | ((ai ^ bi) & c)); }
    const gw = 32, gh = 18, cw = 210, ox = 220, oy = 72;
    const totalW = 3 * ox + cw, sx = Math.max(12, (W - totalW) / 2), sy = H * .09;
    ctx.fillStyle = ink(.2 * a); ctx.font = '10px Courier New'; ctx.textAlign = 'left';
    ctx.fillText('4-bit Ripple Carry Adder  —  gate-level schematic', sx, sy - 12);
    for (let i = 0; i < 4; i++) {
      const bit = i, cx2 = sx + i * ox, cy2 = sy + i * oy;
      const ai = (A >> bit) & 1, bi = (B >> bit) & 1, ci = cin[bit];
      const si = (fullSum >> bit) & 1, co = cin[bit + 1];
      const carryLit = bit === 0 || carryProg >= (bit - 1) * 0.28 + 0.30;
      const wA = (v: number) => v ? `rgba(29,78,216,${.55 * a})` : `rgba(185,185,195,${.3 * a})`;
      const wS = (v: number) => v ? `rgba(21,128,61,${.55 * a})` : `rgba(185,185,195,${.3 * a})`;
      const wC = (v: number, lit: boolean) => v && lit ? `rgba(190,18,60,${.55 * a})` : `rgba(185,185,195,${.25 * a})`;
      const s1 = ai ^ bi, G = ai & bi, P = s1 & ci, S = s1 ^ ci;
      const bOn = `rgba(29,78,216,${.14 * a})`, bOff = `rgba(248,248,250,${.88 * a})`;
      const bOnS = `rgba(29,78,216,${.45 * a})`, bOffS = ink(.18 * a);
      const gOn = `rgba(21,128,61,${.14 * a})`, gOnS = `rgba(21,128,61,${.45 * a})`;
      const rOn = `rgba(190,18,60,${.12 * a})`, rOnS = `rgba(190,18,60,${.4 * a})`;
      const x1c = cx2 + 18, x2c = cx2 + 90, x3c = cx2 + 152;
      const yX1 = cy2 + 9, yA1 = cy2 + 36, yX2 = cy2 + 9, yA2 = cy2 + 36, yOR = cy2 + 22;
      gshape(ctx, x1c, yX1, gw, gh, 'XOR', s1 ? bOn : bOff, s1 ? bOnS : bOffS);
      gshape(ctx, x1c, yA1, gw, gh, 'AND', G ? rOn : bOff, G ? rOnS : bOffS);
      gshape(ctx, x2c, yX2, gw, gh, 'XOR', S ? gOn : bOff, S ? gOnS : bOffS);
      gshape(ctx, x2c, yA2, gw, gh, 'AND', P ? rOn : bOff, P ? rOnS : bOffS);
      gshape(ctx, x3c, yOR, gw, gh, 'OR', co && carryLit ? rOn : bOff, co && carryLit ? rOnS : bOffS);
      ctx.fillStyle = ink(.26 * a); ctx.font = '9px Courier New'; ctx.textAlign = 'center';
      ctx.fillText('⊕', x1c + 16, yX1 + 12); ctx.fillText('·', x1c + 14, yA1 + 12);
      ctx.fillText('⊕', x2c + 16, yX2 + 12); ctx.fillText('·', x2c + 14, yA2 + 12);
      ctx.fillText('≥1', x3c + 15, yOR + 12);
      wl(ctx, [[cx2, cy2 + 12], [cx2 + 12, cy2 + 12], [cx2 + 22, cy2 + 12]], wA(ai));
      wl(ctx, [[cx2 + 12, cy2 + 12], [cx2 + 12, cy2 + 39], [cx2 + 18, cy2 + 39]], wA(ai));
      dotc(ctx, cx2 + 12, cy2 + 12, wA(ai));
      wl(ctx, [[cx2, cy2 + 24], [cx2 + 16, cy2 + 24], [cx2 + 22, cy2 + 24]], wA(bi));
      wl(ctx, [[cx2 + 16, cy2 + 24], [cx2 + 16, cy2 + 51], [cx2 + 18, cy2 + 51]], wA(bi));
      dotc(ctx, cx2 + 16, cy2 + 24, wA(bi));
      wl(ctx, [[cx2 + 50, cy2 + 18], [cx2 + 62, cy2 + 18]], wA(s1));
      wl(ctx, [[cx2 + 62, cy2 + 18], [cx2 + 62, cy2 + 12], [cx2 + 94, cy2 + 12]], wA(s1));
      wl(ctx, [[cx2 + 62, cy2 + 18], [cx2 + 62, cy2 + 39], [cx2 + 90, cy2 + 39]], wA(s1));
      dotc(ctx, cx2 + 62, cy2 + 18, wA(s1));
      if (bit === 0) {
        wl(ctx, [[cx2 - 20, cy2 + 68], [cx2, cy2 + 68]], wC(ci, carryLit));
        ctx.fillStyle = ink(.22 * a); ctx.font = '8px Courier New'; ctx.textAlign = 'right';
        ctx.fillText('0', cx2 - 22, cy2 + 72);
      }
      wl(ctx, [[cx2, cy2 + 68], [cx2 + 82, cy2 + 68], [cx2 + 82, cy2 + 24]], wC(ci, carryLit));
      wl(ctx, [[cx2 + 82, cy2 + 51], [cx2 + 90, cy2 + 51]], wC(ci, carryLit));
      wl(ctx, [[cx2 + 82, cy2 + 24], [cx2 + 94, cy2 + 24]], wC(ci, carryLit));
      dotc(ctx, cx2 + 82, cy2 + 51, wC(ci, carryLit));
      wl(ctx, [[cx2 + 43, cy2 + 45], [cx2 + 72, cy2 + 45], [cx2 + 72, cy2 + 25], [cx2 + 152, cy2 + 25]], wC(G, true));
      wl(ctx, [[cx2 + 115, cy2 + 45], [cx2 + 137, cy2 + 45], [cx2 + 137, cy2 + 37], [cx2 + 152, cy2 + 37]], wC(P, carryLit));
      wl(ctx, [[cx2 + 122, cy2 + 18], [cx2 + cw, cy2 + 18]], wS(si));
      wl(ctx, [[cx2 + 184, cy2 + 31], [cx2 + cw, cy2 + 31]], wC(co, carryLit));
      if (bit < 3) {
        const ncy2 = cy2 + oy;
        wl(ctx, [[cx2 + cw, cy2 + 31], [cx2 + cw, ncy2 + 68], [cx2 + ox, ncy2 + 68]], wC(co, carryLit), 1.5);
      } else if (co) {
        wl(ctx, [[cx2 + cw, cy2 + 31], [cx2 + cw + 14, cy2 + 31]], wC(co, true), 1.5);
        ctx.fillStyle = `rgba(190,18,60,${.65 * a})`; ctx.font = '8px Courier New'; ctx.textAlign = 'left';
        ctx.fillText('Cout=1', cx2 + cw + 16, cy2 + 35);
      }
      ctx.font = '8px Courier New'; ctx.textAlign = 'right';
      ctx.fillStyle = ai ? `rgba(29,78,216,${.65 * a})` : `rgba(150,150,150,${.35 * a})`;
      ctx.fillText('A' + bit, cx2 - 2, cy2 + 16);
      ctx.fillStyle = bi ? `rgba(29,78,216,${.65 * a})` : `rgba(150,150,150,${.35 * a})`;
      ctx.fillText('B' + bit, cx2 - 2, cy2 + 28);
      if (bit > 0) { ctx.fillStyle = wC(ci, carryLit); ctx.fillText('C' + bit, cx2 - 2, cy2 + 72); }
      ctx.textAlign = 'left';
      ctx.fillStyle = si ? `rgba(21,128,61,${.65 * a})` : `rgba(150,150,150,${.32 * a})`;
      ctx.fillText('S' + bit + '=' + si, cx2 + cw + 2, cy2 + 22);
    }
    const L1c = cw - 184, L2c = oy + 37, L3c = ox - cw, Ltot = L1c + L2c + L3c;
    for (let i = 0; i < 3; i++) {
      const co = cin[i + 1]; if (!co) continue;
      const cx2 = sx + i * ox, cy2 = sy + i * oy, ncy2 = cy2 + oy;
      const pStart = i * 0.28 + 0.12, pEnd = i * 0.28 + 0.30;
      const pulseT = Math.max(0, Math.min(1.4, (carryProg - pStart) / (pEnd - pStart)));
      if (pulseT <= 0) continue;
      const d = Math.min(pulseT, 1) * Ltot;
      let px: number, py: number;
      if (d <= L1c) { px = cx2 + 184 + d; py = cy2 + 31; }
      else if (d <= L1c + L2c) { px = cx2 + cw; py = cy2 + 31 + (d - L1c); }
      else { px = cx2 + cw + (d - L1c - L2c); py = ncy2 + 68; }
      const fade = pulseT <= 1 ? 1 : Math.max(0, 1 - (pulseT - 1) / 0.4);
      for (let j = 1; j <= 5; j++) {
        const td = d - j * 6; if (td < 0) continue;
        let tx: number, ty: number;
        if (td <= L1c) { tx = cx2 + 184 + td; ty = cy2 + 31; }
        else if (td <= L1c + L2c) { tx = cx2 + cw; ty = cy2 + 31 + (td - L1c); }
        else { tx = cx2 + cw + (td - L1c - L2c); ty = ncy2 + 68; }
        ctx.fillStyle = `rgba(200,30,60,${(1 - j / 6) * 0.38 * fade * a})`;
        ctx.beginPath(); ctx.arc(tx, ty, Math.max(0, 2.8 - j * 0.35), 0, Math.PI * 2); ctx.fill();
      }
      const gr = ctx.createRadialGradient(px, py, 0, px, py, 11);
      gr.addColorStop(0, `rgba(255,110,150,${0.92 * fade * a})`);
      gr.addColorStop(0.35, `rgba(230,40,75,${0.55 * fade * a})`);
      gr.addColorStop(1, `rgba(190,18,60,0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,235,240,${0.95 * fade * a})`; ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI * 2); ctx.fill();
      if (pulseT > 0.78) {
        const at = Math.min(1, (pulseT - 0.78) / 0.62);
        ctx.strokeStyle = `rgba(220,40,70,${Math.max(0, (1 - at) * 0.7 * a)})`; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(cx2 + ox, ncy2 + 68, at * 20, 0, Math.PI * 2); ctx.stroke();
      }
    }
    const ry = sy + 3 * oy + 90;
    ctx.fillStyle = `rgba(240,240,242,${.6 * a})`; ctx.strokeStyle = ink(.12 * a); ctx.lineWidth = 1;
    ctx.fillRect(sx, ry, totalW, 24); ctx.strokeRect(sx, ry, totalW, 24);
    ctx.fillStyle = ink(.46 * a); ctx.font = '10px Courier New'; ctx.textAlign = 'center';
    const sumBin = (fullSum >>> 0).toString(2).padStart(5, '0');
    ctx.fillText(A + ' + ' + B + ' = ' + fullSum + '  ·  ' + aBits.join('') + ' + ' + bBits.join('') + ' = ' + sumBin, sx + totalW / 2, ry + 16);
  };
})();

// ── L1: MOSFET cross-section + band diagram ──
const L1 = (() => {
  let t = 0;
  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++;
    const Vgs = 0.7 + 0.8 * (Math.sin(t * .02) * .5 + .5);
    const Vth = 1.1, on = Vgs > Vth, chan = on ? (Vgs - Vth) / .7 : 0;
    const cx2 = W * .42, cy = H / 2, sw = 250, sh = 155, sx = cx2 - sw / 2, sy = cy - sh / 2;
    ctx.fillStyle = `rgba(234,224,210,${.4 * a})`; ctx.strokeStyle = ink(.12 * a); ctx.lineWidth = 1;
    ctx.fillRect(sx, sy + sh * .35, sw, sh * .65); ctx.strokeRect(sx, sy + sh * .35, sw, sh * .65);
    ctx.fillStyle = ink(.3 * a); ctx.font = '10px Courier New'; ctx.textAlign = 'center'; ctx.fillText('p-substrate', cx2, sy + sh * .68);
    [[8, 56, 'n+ src'], [sw - 64, 56, 'n+ drn']].forEach(([ox, ow, lbl]) => {
      ctx.fillStyle = `rgba(186,220,255,${.5 * a})`; ctx.strokeStyle = ink(.18 * a); ctx.lineWidth = 1;
      ctx.fillRect(sx + (ox as number), sy + sh * .35, ow as number, sh * .27); ctx.strokeRect(sx + (ox as number), sy + sh * .35, ow as number, sh * .27);
      ctx.fillStyle = ink(.4 * a); ctx.font = '9px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(lbl as string, sx + (ox as number) + (ow as number) / 2, sy + sh * .35 + sh * .13 + 4);
    });
    ctx.fillStyle = `rgba(200,200,240,${.45 * a})`; ctx.strokeStyle = ink(.18 * a); ctx.lineWidth = 1;
    ctx.fillRect(sx + 64, sy + sh * .27, sw - 128, sh * .08); ctx.strokeRect(sx + 64, sy + sh * .27, sw - 128, sh * .08);
    ctx.fillStyle = ink(.4 * a); ctx.font = '9px Courier New'; ctx.textAlign = 'center'; ctx.fillText('SiO₂', cx2, sy + sh * .27 + sh * .04 + 4);
    ctx.fillStyle = `rgba(255,220,140,${.4 * a})`; ctx.strokeStyle = ink(.18 * a); ctx.lineWidth = 1;
    ctx.fillRect(sx + 64, sy + sh * .09, sw - 128, sh * .18); ctx.strokeRect(sx + 64, sy + sh * .09, sw - 128, sh * .18);
    ctx.fillStyle = ink(.45 * a); ctx.font = '10px Courier New'; ctx.textAlign = 'center';
    ctx.fillText(`gate  Vgs=${Vgs.toFixed(2)}V`, cx2, sy + sh * .18);
    const depthDepletionMax = sh * .15 * (Vgs / 1.5);
    ctx.fillStyle = `rgba(100,150,220,${.12 * a})`; ctx.fillRect(sx + 64, sy + sh * .35, sw - 128, depthDepletionMax);
    ctx.strokeStyle = `rgba(80,120,200,${.25 * a})`; ctx.lineWidth = 1; ctx.setLineDash([3, 2]);
    ctx.beginPath(); ctx.moveTo(sx + 64, sy + sh * .35 + depthDepletionMax); ctx.lineTo(sx + sw - 64, sy + sh * .35 + depthDepletionMax); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = ink(.25 * a); ctx.font = '8px Courier New'; ctx.textAlign = 'center';
    ctx.fillText('depletion', cx2, sy + sh * .35 + depthDepletionMax + 10);
    if (on) {
      const ch = sh * .04 * chan;
      ctx.fillStyle = `rgba(100,180,255,${.3 * chan * a})`; ctx.fillRect(sx + 64, sy + sh * .35, sw - 128, ch);
      ctx.strokeStyle = `rgba(60,130,220,${.4 * a})`; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(sx + 64, sy + sh * .35); ctx.lineTo(sx + sw - 64, sy + sh * .35); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = ink(.38 * a); ctx.font = '9px Courier New'; ctx.textAlign = 'center';
      ctx.fillText('inversion channel  e⁻→', cx2, sy + sh * .35 + ch + 12);
      const ne = Math.floor(5 * chan);
      for (let i = 0; i < ne; i++) {
        const ex = sx + 64 + ((i * 44 + t * (2.0 + i * 0.15)) % (sw - 128));
        const ey = sy + sh * .35 + 2 + (Math.sin(i * 7.3 + t * .08) * 2.5);
        ctx.fillStyle = `rgba(40,120,210,${.55 * a})`; ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = ink(.35 * a); ctx.font = '10px Courier New'; ctx.textAlign = 'center';
    ctx.fillText(on ? `Vgs=${Vgs.toFixed(2)}V > Vth=${Vth}V → channel OPEN` : `Vgs=${Vgs.toFixed(2)}V < Vth=${Vth}V → DEPLETED`, cx2, sy - 10);
    const bx = W * .65, by = H * .2, bw = W * .28, bh = H * .6;
    ctx.fillStyle = `rgba(248,248,250,${.85 * a})`; ctx.strokeStyle = ink(.12 * a); ctx.lineWidth = 1;
    ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = ink(.3 * a); ctx.font = '9px Courier New'; ctx.textAlign = 'center'; ctx.fillText('Band Diagram', bx + bw / 2, by - 5);
    const bend = on ? chan * 0.18 : 0;
    ctx.fillStyle = `rgba(180,180,190,${.06 * a})`;
    ctx.beginPath();
    for (let x = 0; x < bw; x++) {
      const bnd = x < bw * .3 || x > bw * .7 ? 0 : -bend * Math.sin(((x - bw * .3) / (bw * .4)) * Math.PI);
      const ecY = by + bh * .25 + bnd * bh;
      x === 0 ? ctx.moveTo(bx + x, ecY) : ctx.lineTo(bx + x, ecY);
    }
    for (let x = bw - 1; x >= 0; x--) {
      const bnd = x < bw * .3 || x > bw * .7 ? 0 : -bend * Math.sin(((x - bw * .3) / (bw * .4)) * Math.PI);
      const evY = by + bh * .65 + bnd * bh;
      ctx.lineTo(bx + x, evY);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(29,78,216,${.5 * a})`; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = 0; x < bw; x++) {
      const bnd = x < bw * .3 || x > bw * .7 ? 0 : -bend * Math.sin(((x - bw * .3) / (bw * .4)) * Math.PI);
      const ey = by + bh * .25 + bnd * bh;
      x === 0 ? ctx.moveTo(bx + x, ey) : ctx.lineTo(bx + x, ey);
    }
    ctx.stroke();
    ctx.strokeStyle = `rgba(126,34,206,${.5 * a})`; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = 0; x < bw; x++) {
      const bnd = x < bw * .3 || x > bw * .7 ? 0 : -bend * Math.sin(((x - bw * .3) / (bw * .4)) * Math.PI);
      const ey = by + bh * .65 + bnd * bh;
      x === 0 ? ctx.moveTo(bx + x, ey) : ctx.lineTo(bx + x, ey);
    }
    ctx.stroke();
    const efBend = on ? chan * 0.09 : 0;
    ctx.strokeStyle = `rgba(180,83,9,${.45 * a})`; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x < bw; x++) {
      const efBndBend = x > bw * .3 && x < bw * .7 ? -efBend * Math.sin(((x - bw * .3) / (bw * .4)) * Math.PI) : 0;
      const efY = by + bh * .45 + efBndBend * bh;
      x === 0 ? ctx.moveTo(bx + x, efY) : ctx.lineTo(bx + x, efY);
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(29,78,216,${.55 * a})`; ctx.font = '8px Courier New'; ctx.textAlign = 'right'; ctx.fillText('Ec', bx + bw - 4, by + bh * .25 - 3);
    ctx.fillStyle = `rgba(126,34,206,${.55 * a})`; ctx.fillText('Ev', bx + bw - 4, by + bh * .65 - 3);
    ctx.fillStyle = `rgba(180,83,9,${.5 * a})`; ctx.fillText('Ef', bx + bw - 4, by + bh * .45 - 3);
    if (on) { ctx.fillStyle = `rgba(40,120,210,${.4 * a})`; ctx.font = '8px Courier New'; ctx.textAlign = 'center'; ctx.fillText('inversion', bx + bw / 2, by + bh * .32); }
  };
})();

// ── HERO_BG ──
const HERO_BG = (() => {
  type Trace = { x: number; y: number; dx: number; dy: number; len: number; t: number };
  const traces: Trace[] = [];
  for (let i = 0; i < 10; i++) traces.push({ x: Math.random(), y: Math.random(), dx: (Math.random() - .5) * .0018, dy: (Math.random() - .5) * .0018, len: .04 + Math.random() * .1, t: Math.random() * 1000 });
  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    traces.forEach(tr => {
      tr.t += .007; tr.x += tr.dx; tr.y += tr.dy;
      if (tr.x < 0 || tr.x > 1) tr.dx *= -1; if (tr.y < 0 || tr.y > 1) tr.dy *= -1;
      const p = Math.sin(tr.t) * .5 + .5;
      ctx.strokeStyle = ink(.035 * p * a); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tr.x * W, tr.y * H); ctx.lineTo(tr.x * W + tr.len * W, tr.y * H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tr.x * W + tr.len * W, tr.y * H); ctx.lineTo(tr.x * W + tr.len * W, tr.y * H + tr.len * H * .5); ctx.stroke();
    });
  };
})();

export type DrawFn = (ctx: Ctx, W: number, H: number, a: number) => void;
export const DRAWFNS: Record<number, DrawFn> = { 0: HERO_BG, 7: L7, 6: L6, 5: L5, 4: L4, 3: L3, 2: L2, 1: L1 };
export { drawGrid };

// Setters for mutable module-level state (exported lets are read-only via namespace imports)
export function setL4Hov(v: number) { L4_hov = v; }
export function setL2Inputs(a: number, b: number) { L2_A = a; L2_B = b; L2_A_locked = true; }
