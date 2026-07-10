// All canvas animation drawing functions for The Stack portfolio.
// Each function is a pure(ish) draw call: (ctx, W, H, alpha) => void.
// Module-level state is intentional — these are singleton animation loops.

type Ctx = CanvasRenderingContext2D;

const ink = (a: number) => {
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return dark ? `rgba(230,237,243,${a})` : `rgba(24,24,27,${a})`;
};

function drawGrid(ctx: Ctx, W: number, H: number) {
  ctx.fillStyle = ink(0.055);
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
  let accVal = 0.32;
  const accHist: (number | null)[] = Array(80).fill(null);
  let accPtr = 0;
  type Pulse = { x0: number; y0: number; x1: number; y1: number; val: number; age: number; maxAge: number; isBwd: boolean };
  const pulses: Pulse[] = [];
  // Weight-delta markers shown during pause phase.
  type WDelta = { x: number; y: number; sign: 1 | -1; mag: number; age: number };
  let wDeltas: WDelta[] = [];

  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++; phaseT++;
    if (phase === 'fwd') {
      if (phaseT % 18 === 0) {
        fwdLayer++;
        if (fwdLayer >= 1 && fwdLayer < layers.length) {
          const netX = W * .44, netW = W * .42, netH = H * .72, netY = H * .14;
          const srcLayer = fwdLayer - 1, tgtLayer = fwdLayer;
          const x0 = netX + srcLayer * (netW / (layers.length - 1));
          const x1 = netX + tgtLayer * (netW / (layers.length - 1));
          // Spawn a pulse for every (i, j) edge so the propagation looks fully connected.
          for (let i = 0; i < layers[srcLayer]; i++) {
            const y0 = netY + (i + .5) * (netH / layers[srcLayer]);
            for (let j = 0; j < layers[tgtLayer]; j++) {
              const y1 = netY + (j + .5) * (netH / layers[tgtLayer]);
              pulses.push({ x0, y0, x1, y1, val: acts[srcLayer][i], age: 0, maxAge: 20, isBwd: false });
            }
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
          // Spawn a gradient pulse for every (j, i) edge — backprop touches every weight.
          for (let j = 0; j < layers[srcLayer]; j++) {
            const y0 = netY + (j + .5) * (netH / layers[srcLayer]);
            for (let i = 0; i < layers[tgtLayer]; i++) {
              const y1 = netY + (i + .5) * (netH / layers[tgtLayer]);
              pulses.push({ x0, y0, x1, y1, val: grads[srcLayer][j], age: 0, maxAge: 18, isBwd: true });
            }
          }
        }
        if (bwdLayer < 0) {
          lossVal = Math.max(.04, lossVal * 0.96 + (seededRnd(epoch * 31) - .5) * 0.08 * lossVal);
          accVal = Math.min(.99, accVal + (1 - accVal) * (.05 + seededRnd(epoch * 41) * .03));
          lossHist[lossPtr] = lossVal; lossPtr = (lossPtr + 1) % lossHist.length;
          accHist[accPtr] = accVal; accPtr = (accPtr + 1) % accHist.length;
          // Update *every* weight in the network — that's what an SGD step actually does.
          // Then sample 14 edges to spawn floating ±Δw markers (full set would be visual noise).
          const netX = W * .44, netW = W * .42, netH = H * .72, netY = H * .14;
          for (let l = 0; l < layers.length - 1; l++) {
            for (let i = 0; i < layers[l]; i++) {
              for (let j = 0; j < layers[l + 1]; j++) {
                const w = weights[l][i][j];
                const upd = (seededRnd(epoch * 131 + l * 911 + i * 53 + j * 7) - .5) * .12;
                weights[l][i][j] = Math.max(-1.2, Math.min(1.2, w + upd));
              }
            }
          }
          for (let s = 0; s < 14; s++) {
            const l = Math.floor(seededRnd(epoch * 17 + s * 3) * (layers.length - 1));
            const i = Math.floor(seededRnd(epoch * 19 + s * 5) * layers[l]);
            const j = Math.floor(seededRnd(epoch * 23 + s * 7) * layers[l + 1]);
            const x0 = netX + l * (netW / (layers.length - 1));
            const x1 = netX + (l + 1) * (netW / (layers.length - 1));
            const y0 = netY + (i + .5) * (netH / layers[l]);
            const y1 = netY + (j + .5) * (netH / layers[l + 1]);
            const upd = (seededRnd(epoch * 131 + l * 911 + i * 53 + j * 7) - .5) * .12;
            wDeltas.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, sign: upd >= 0 ? 1 : -1, mag: Math.abs(upd), age: 0 });
          }
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
    // Clamp the chart strip so it never falls below the viewport on short windows.
    const lossH = 48;
    const lossX = W * .44, lossW = netW;
    const lossY = Math.min(netY + netH + 10, H - lossH - 6);
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
          ctx.fillStyle = ink(.45 * a); ctx.font = '8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left';
          ctx.fillText(act.toFixed(2), lx + 13, ny2 + 3);
        }
      }
      ctx.fillStyle = ink(.24 * a); ctx.font = '9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
      ctx.fillText(lNames[l], netX + l * (netW / (layers.length - 1)), netY - 8);
      ctx.fillStyle = ink(.14 * a); ctx.font = '8px ui-monospace, Menlo, Consolas, monospace';
      ctx.fillText('×' + n, netX + l * (netW / (layers.length - 1)), netY + netH + 12);
    });
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]; p.age++;
      const progress = p.age / p.maxAge, fade = Math.max(0, 1 - progress);
      if (progress >= 1) { pulses.splice(i, 1); continue; }
      const px = p.x0 + progress * (p.x1 - p.x0), py = p.y0 + progress * (p.y1 - p.y0);
      const col = p.isBwd ? `rgba(190,18,60,${fade * .75 * a})` : `rgba(29,78,216,${fade * .75 * a})`;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2); ctx.fill();
      // Bright halo + dark glyph: legible on light AND dark backgrounds.
      ctx.fillStyle = `rgba(255,255,255,${fade * .9 * a})`;
      ctx.beginPath(); ctx.arc(px, py, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(24,24,27,${fade * .9 * a})`; ctx.font = 'bold 7px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
      ctx.fillText(p.val.toFixed(2), px, py + 2);
    }
    const phLbl = phase === 'fwd' ? '→ forward pass' : phase === 'bwd' ? '← backprop' : 'updating weights';
    const phCol = phase === 'bwd' ? `rgba(190,18,60,${.55 * a})` : ink(.4 * a);
    ctx.fillStyle = phCol; ctx.font = '10px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left';
    ctx.fillText(phLbl, netX, netY - 22);
    ctx.fillStyle = ink(.22 * a); ctx.textAlign = 'right';
    ctx.fillText(`epoch ${epoch}  step ${step}`, netX + netW, netY - 22);
    // Two side-by-side mini-charts: loss (left) and accuracy (right).
    const halfW = (lossW - 6) / 2;
    // ── Loss panel ──
    ctx.fillStyle = `rgba(244,244,245,${.45 * a})`; ctx.strokeStyle = ink(.1 * a); ctx.lineWidth = 1;
    ctx.fillRect(lossX, lossY, halfW, lossH); ctx.strokeRect(lossX, lossY, halfW, lossH);
    ctx.fillStyle = ink(.2 * a); ctx.font = '8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left';
    ctx.fillText('training loss', lossX + 4, lossY + 10);
    const pts: [number, number][] = [];
    for (let i = 0; i < lossHist.length; i++) {
      const idx = (lossPtr + i) % lossHist.length;
      if (lossHist[idx] === null) continue;
      const px2 = lossX + 4 + (i / lossHist.length) * (halfW - 8);
      const py2 = lossY + lossH - 6 - ((lossHist[idx] as number) / 2.6) * (lossH - 16);
      pts.push([px2, py2]);
    }
    if (pts.length > 1) {
      ctx.strokeStyle = `rgba(21,128,61,${.7 * a})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(([px2, py2]) => ctx.lineTo(px2, py2)); ctx.stroke();
    }
    ctx.fillStyle = `rgba(21,128,61,${.6 * a})`; ctx.font = '9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'right';
    ctx.fillText('loss=' + lossVal.toFixed(3), lossX + halfW - 4, lossY + 10);
    // ── Accuracy panel ──
    const accX = lossX + halfW + 6;
    ctx.fillStyle = `rgba(244,244,245,${.45 * a})`; ctx.strokeStyle = ink(.1 * a); ctx.lineWidth = 1;
    ctx.fillRect(accX, lossY, halfW, lossH); ctx.strokeRect(accX, lossY, halfW, lossH);
    ctx.fillStyle = ink(.2 * a); ctx.font = '8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left';
    ctx.fillText('val accuracy', accX + 4, lossY + 10);
    const accPts: [number, number][] = [];
    for (let i = 0; i < accHist.length; i++) {
      const idx = (accPtr + i) % accHist.length;
      if (accHist[idx] === null) continue;
      const px2 = accX + 4 + (i / accHist.length) * (halfW - 8);
      const py2 = lossY + lossH - 6 - (accHist[idx] as number) * (lossH - 16);
      accPts.push([px2, py2]);
    }
    if (accPts.length > 1) {
      // Fill area under curve.
      ctx.fillStyle = `rgba(29,78,216,${.08 * a})`;
      ctx.beginPath(); ctx.moveTo(accPts[0][0], lossY + lossH - 6);
      accPts.forEach(([px2, py2]) => ctx.lineTo(px2, py2));
      ctx.lineTo(accPts[accPts.length - 1][0], lossY + lossH - 6);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(29,78,216,${.7 * a})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(accPts[0][0], accPts[0][1]);
      accPts.slice(1).forEach(([px2, py2]) => ctx.lineTo(px2, py2)); ctx.stroke();
    }
    ctx.fillStyle = `rgba(29,78,216,${.65 * a})`; ctx.font = '9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'right';
    ctx.fillText('acc=' + (accVal * 100).toFixed(1) + '%', accX + halfW - 4, lossY + 10);

    // ── Weight-update markers, only visible during pause phase ──
    if (wDeltas.length) {
      wDeltas = wDeltas.filter(d => d.age < 30);
      wDeltas.forEach(d => {
        d.age++;
        const fade = Math.max(0, 1 - d.age / 30);
        const col = d.sign > 0 ? `rgba(21,128,61,${fade * .85 * a})` : `rgba(190,18,60,${fade * .85 * a})`;
        ctx.fillStyle = col; ctx.font = `bold ${8 + d.mag * 6}px ui-monospace, Menlo, Consolas, monospace`; ctx.textAlign = 'center';
        ctx.fillText(d.sign > 0 ? '+Δw' : '−Δw', d.x, d.y - d.age * .4);
      });
    }
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
    // ── LAN-A (sources) ──
    { x: .04, y: .25, n: 'SRC-A' },     // 0
    { x: .04, y: .75, n: 'SRC-B' },     // 1
    // ── Edge routers (ingress) ──
    { x: .15, y: .25, n: 'E1' },        // 2
    { x: .15, y: .75, n: 'E2' },        // 3
    // ── Distribution layer (left core) ──
    { x: .30, y: .12, n: 'D1' },        // 4
    { x: .30, y: .50, n: 'D2' },        // 5
    { x: .30, y: .88, n: 'D3' },        // 6
    // ── Backbone (BGP / AS65001) ──
    { x: .47, y: .25, n: 'BB1' },       // 7
    { x: .47, y: .75, n: 'BB2' },       // 8
    // ── Distribution layer (right core) ──
    { x: .62, y: .12, n: 'D4' },        // 9
    { x: .62, y: .50, n: 'D5' },        // 10
    { x: .62, y: .88, n: 'D6' },        // 11
    // ── Edge routers (egress) ──
    { x: .78, y: .25, n: 'E3' },        // 12
    { x: .78, y: .75, n: 'E4' },        // 13
    // ── LAN-B (destinations) ──
    { x: .89, y: .25, n: 'DST-A' },     // 14
    { x: .89, y: .75, n: 'DST-B' },     // 15
  ];
  // Three logical regions — sources, backbone, destinations.
  const subnets: { ids: number[]; label: string; col: string }[] = [
    { ids: [0, 1, 2, 3],                label: 'LAN-A · 10.0.0.0/24',     col: 'rgba(29,78,216,'  },
    { ids: [4, 5, 6, 7, 8, 9, 10, 11],  label: 'Backbone · AS65001',      col: 'rgba(126,34,206,' },
    { ids: [12, 13, 14, 15],            label: 'LAN-B · 192.168.2.0/24',  col: 'rgba(180,83,9,'   },
  ];
  // 15+ distinct paths from various sources to various destinations, varying hop counts (5–7).
  const pktPaths = [
    // SRC-A → DST-A
    [0, 2, 4, 7, 9, 12, 14],
    [0, 2, 5, 7, 10, 12, 14],
    [0, 2, 5, 10, 12, 14],
    [0, 2, 4, 5, 7, 9, 12, 14],
    // SRC-A → DST-B
    [0, 2, 5, 8, 11, 13, 15],
    [0, 2, 5, 10, 8, 13, 15],
    [0, 2, 4, 7, 8, 13, 15],
    // SRC-B → DST-A
    [1, 3, 5, 7, 9, 12, 14],
    [1, 3, 5, 10, 12, 14],
    [1, 3, 6, 8, 7, 9, 12, 14],
    // SRC-B → DST-B
    [1, 3, 6, 8, 11, 13, 15],
    [1, 3, 5, 8, 11, 13, 15],
    [1, 3, 6, 11, 13, 15],
    [1, 3, 5, 10, 13, 15],
    // Cross traffic
    [0, 2, 4, 7, 8, 11, 13, 15],
    [1, 3, 6, 8, 10, 12, 14],
  ];
  // SYN-ACK reverse path: a representative DST→SRC route.
  const revPath = [14, 12, 9, 7, 5, 2, 0];
  // All bidirectional edges in the mesh.
  const allE: [number, number][] = [
    // LAN-A → edges
    [0, 2], [1, 3],
    // Edges → distribution (left)
    [2, 4], [2, 5], [3, 5], [3, 6],
    // Left distribution mesh
    [4, 5], [5, 6],
    // Distribution → backbone
    [4, 7], [5, 7], [5, 8], [6, 8],
    // Backbone mesh
    [7, 8],
    // Cross-backbone horizontal links — distribution layers connect across BB.
    [5, 10], [4, 9], [6, 11],
    // Backbone → right distribution
    [7, 9], [7, 10], [8, 10], [8, 11],
    // Right distribution mesh
    [9, 10], [10, 11],
    // Right distribution → edges + backbone shortcut to edge
    [9, 12], [10, 12], [10, 13], [11, 13], [8, 13],
    // Edges → LAN-B
    [12, 14], [13, 15],
  ];
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

  // Per-router pulse decay timers (one per router).
  const routerPulse: number[] = new Array(16).fill(0);
  // Drop animations: red X with optional ICMP-time-exceeded reply.
  type Drop = { x: number; y: number; age: number; proto: string };
  let drops: Drop[] = [];
  // Running stats — recomputed every 60 frames (~1s).
  const stats = { pps: 0, bps: 0, dps: 0, activeFlows: 0 };
  let statBucketPkts = 0, statBucketBytes = 0, statBucketDrops = 0, statSampleT = 0;

  function mkPkt(): Packet {
    const i = pidx % protos.length; pidx++;
    const pth = pktPaths[Math.floor(Math.random() * pktPaths.length)];
    // 1 in 6 packets starts with a low TTL so it'll expire mid-route (creates drama).
    const lowTtl = Math.random() < 0.16;
    statBucketPkts++;
    statBucketBytes += sizes[i];
    return {
      hop: 0, prog: 0,
      ttl: lowTtl ? 2 + Math.floor(Math.random() * 2) : 64 - Math.floor(Math.random() * 4),
      spd: .009 + Math.random() * .006, id: pktId++,
      proto: protos[i], flags: flags[i], src: srcs[i], dst: dsts[i],
      sport: ports[i][0], dport: ports[i][1], size: sizes[i], seq: Math.floor(Math.random() * 0xFFFF),
      trail: [], path: pth,
    };
  }

  // Draw a packet "icon" matching its protocol (TCP=●, UDP=■, ICMP=▲).
  function drawPacket(ctx: Ctx, x: number, y: number, r: number, proto: string, col: string) {
    ctx.fillStyle = col;
    if (proto === 'UDP') {
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    } else if (proto === 'ICMP') {
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y + r);
      ctx.lineTo(x - r, y + r);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++; tcpTimer++;
    // Right-area wrap (avoids the section text card on the left).
    ctx.save();
    const _rightX = W * 0.42, _fitS = (W - _rightX) / W;
    ctx.translate(Math.round(_rightX), Math.round((H - H * _fitS) / 2));
    ctx.scale(_fitS, _fitS);

    if (tcpTimer > 90) { tcpState = tcpState < 4 ? tcpState + 1 : 1; tcpTimer = 0; }
    if (t % 120 === 0 || t === 1) pkts.push(mkPkt());
    // Tick down router pulses and drop animations every frame.
    for (let i = 0; i < routerPulse.length; i++) if (routerPulse[i] > 0) routerPulse[i]--;
    drops = drops.filter(d => ++d.age < 50);

    // ── Subnet color regions drawn behind everything ──
    subnets.forEach(sub => {
      // Compute bounding box of routers in this subnet.
      let minX = 1, minY = 1, maxX = 0, maxY = 0;
      sub.ids.forEach(id => {
        if (rs[id].x < minX) minX = rs[id].x;
        if (rs[id].y < minY) minY = rs[id].y;
        if (rs[id].x > maxX) maxX = rs[id].x;
        if (rs[id].y > maxY) maxY = rs[id].y;
      });
      const padX = .055, padY = .085;
      const rx = (minX - padX) * W, ry = (minY - padY) * H;
      const rw = (maxX - minX + 2 * padX) * W, rh = (maxY - minY + 2 * padY) * H;
      ctx.fillStyle = sub.col + (0.08 * a) + ')';
      ctx.strokeStyle = sub.col + (0.35 * a) + ')';
      ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.fillRect(rx, ry, rw, rh); ctx.strokeRect(rx, ry, rw, rh);
      ctx.setLineDash([]);
      ctx.fillStyle = sub.col + (0.7 * a) + ')';
      ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left';
      ctx.fillText(sub.label, rx + 4, ry + 11);
    });

    const activeEdges = new Set<string>(), activeNodes = new Set<number>();
    pkts.forEach(p => {
      if (p.hop < p.path.length - 1) {
        const a2 = Math.min(p.path[p.hop], p.path[p.hop + 1]), b2 = Math.max(p.path[p.hop], p.path[p.hop + 1]);
        activeEdges.add(a2 + ',' + b2); activeNodes.add(p.path[p.hop]); activeNodes.add(p.path[p.hop + 1]);
      }
    });
    allE.forEach(([i, j]) => {
      const on = activeEdges.has(Math.min(i, j) + ',' + Math.max(i, j));
      ctx.strokeStyle = on ? ink(.35 * a) : ink(.12 * a); ctx.lineWidth = on ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(rs[i].x * W, rs[i].y * H); ctx.lineTo(rs[j].x * W, rs[j].y * H); ctx.stroke();
    });
    rs.forEach((r, i) => {
      const rx = r.x * W, ry = r.y * H, on = activeNodes.has(i);
      // Pulse halo on packet arrival.
      const pulse = routerPulse[i] / 18;
      if (pulse > 0.05) {
        ctx.fillStyle = `rgba(29,78,216,${pulse * .35 * a})`;
        ctx.beginPath(); ctx.arc(rx, ry, 15 + pulse * 18, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = on ? `rgba(248,250,255,${.96 * a})` : `rgba(248,250,253,${.8 * a})`;
      ctx.strokeStyle = on ? ink(.5 * a) : ink(.25 * a); ctx.lineWidth = on ? 1.6 : 1;
      ctx.beginPath(); ctx.arc(rx, ry, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = on ? ink(.85 * a) : ink(.5 * a); ctx.font = 'bold 10px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
      ctx.fillText(r.n, rx, ry + 4);
    });
    pkts = pkts.filter(p => p.hop < p.path.length - 1);
    pkts.forEach(p => {
      p.prog += p.spd;
      if (p.prog >= 1) {
        p.hop++; p.prog = 0; p.ttl--;
        // Pulse the router we just arrived at.
        const arrivedAt = p.path[p.hop];
        if (arrivedAt !== undefined) routerPulse[arrivedAt] = 18;
        // TTL expired → drop the packet here and emit an ICMP time-exceeded reply.
        if (p.ttl <= 0 && p.hop < p.path.length - 1) {
          const cd = rs[p.path[p.hop]];
          drops.push({ x: cd.x * W, y: cd.y * H, age: 0, proto: p.proto });
          statBucketDrops++;
          p.hop = p.path.length;  // mark for removal
          return;
        }
        if (p.hop >= p.path.length - 1) return;
      }
      const c = rs[p.path[p.hop]], n2 = rs[p.path[Math.min(p.hop + 1, p.path.length - 1)]];
      p._cx = (c.x + (n2.x - c.x) * p.prog) * W; p._cy = (c.y + (n2.y - c.y) * p.prog) * H;
      p.trail.push({ x: p._cx, y: p._cy }); if (p.trail.length > 4) p.trail.shift();
      const col = protoColor[p.proto] || 'rgba(100,100,110,';
      // Trail (shape-agnostic, just dots).
      p.trail.forEach((tp, tidx) => {
        const trailAlpha = ((tidx + 1) / p.trail.length) * 0.55 * a;
        const trailRadius = 5 * (tidx + 1) / p.trail.length;
        ctx.fillStyle = `${col}${trailAlpha})`;
        ctx.beginPath(); ctx.arc(tp.x, tp.y, trailRadius, 0, Math.PI * 2); ctx.fill();
      });
      // Head — protocol-specific shape.
      drawPacket(ctx, p._cx, p._cy, 5.5, p.proto, `${col}${0.9 * a})`);
      // Hot label showing protocol + remaining TTL (red if low).
      const ttlCol = p.ttl <= 2 ? 'rgba(190,18,60,' : col;
      ctx.fillStyle = `${ttlCol}${0.88 * a})`;
      ctx.font = 'bold 9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
      ctx.fillText(`${p.proto} TTL=${p.ttl}`, p._cx, p._cy - 12);
    });
    // ── Drop animations: red X + "ICMP time-exceeded" label ──
    drops.forEach(d => {
      const u = d.age / 50;
      const fade = 1 - u;
      const r = 8 + u * 10;
      // Red X.
      ctx.strokeStyle = `rgba(190,18,60,${0.85 * fade * a})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(d.x - r, d.y - r); ctx.lineTo(d.x + r, d.y + r);
      ctx.moveTo(d.x + r, d.y - r); ctx.lineTo(d.x - r, d.y + r);
      ctx.stroke();
      // Expanding ring.
      ctx.strokeStyle = `rgba(190,18,60,${0.4 * fade * a})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(d.x, d.y, r + u * 14, 0, Math.PI * 2); ctx.stroke();
      // Label.
      if (u < 0.7) {
        ctx.fillStyle = `rgba(190,18,60,${0.85 * fade * a})`;
        ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
        ctx.fillText('ICMP time-exceeded', d.x, d.y - r - 6);
      }
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
        ctx.fillStyle = `rgba(21,128,61,${0.8 * a})`; ctx.font = '9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
        ctx.fillText('SYN-ACK ←', sx2, sy2 - 11);
      }
    }
    // TCP handshake panel removed — the multi-source/destination routing
    // takes up the full width now. Handshake info still visible via packet
    // labels (SYN / ACK / etc.) flowing through the network.

    // ── Live stats panel (bottom-right) ──
    statSampleT++;
    if (statSampleT >= 60) {
      stats.pps = statBucketPkts;
      stats.bps = statBucketBytes;
      stats.dps = statBucketDrops;
      statBucketPkts = 0; statBucketBytes = 0; statBucketDrops = 0;
      statSampleT = 0;
    }
    stats.activeFlows = pkts.length;
    {
      const spW = 168, spH = 64;
      const spX = W - spW - 12, spY = H - spH - 12;
      ctx.fillStyle = `rgba(248,250,253,${0.92 * a})`;
      ctx.strokeStyle = ink(.3 * a); ctx.lineWidth = 1;
      ctx.fillRect(spX, spY, spW, spH); ctx.strokeRect(spX, spY, spW, spH);
      ctx.fillStyle = ink(.55 * a);
      ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left';
      ctx.fillText('NETSTAT', spX + 8, spY + 12);
      ctx.font = '9px ui-monospace, Menlo, Consolas, monospace';
      ctx.fillStyle = ink(.6 * a);
      ctx.fillText('pkts/s', spX + 8, spY + 26);
      ctx.fillText('bytes/s', spX + 8, spY + 38);
      ctx.fillText('flows', spX + 8, spY + 50);
      ctx.fillText('drops/s', spX + 8, spY + 60);
      ctx.font = 'bold 9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'right';
      ctx.fillStyle = `rgba(29,78,216,${0.9 * a})`;
      ctx.fillText(String(stats.pps), spX + spW - 8, spY + 26);
      ctx.fillStyle = `rgba(29,78,216,${0.9 * a})`;
      ctx.fillText(stats.bps.toLocaleString(), spX + spW - 8, spY + 38);
      ctx.fillStyle = `rgba(21,128,61,${0.9 * a})`;
      ctx.fillText(String(stats.activeFlows), spX + spW - 8, spY + 50);
      ctx.fillStyle = stats.dps > 0 ? `rgba(190,18,60,${0.9 * a})` : ink(.5 * a);
      ctx.fillText(String(stats.dps), spX + spW - 8, spY + 60);
    }

    ctx.restore();
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
    // Right-area wrap (avoids the section text card on the left).
    ctx.save();
    const _rightX = W * 0.42, _fitS = (W - _rightX) / W;
    ctx.translate(Math.round(_rightX), Math.round((H - H * _fitS) / 2));
    ctx.scale(_fitS, _fitS);

    const xs = [W * .11, W * .34, W * .57, W * .80], cy = H / 2;
    ['SOURCE', 'TOKENS', 'AST', 'ASM'].forEach((h, i) => {
      ctx.fillStyle = ink(.25 * a); ctx.font = '9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center'; ctx.fillText(h, xs[i], cy - 128);
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
      ctx.fillStyle = ink(.4 * a); ctx.font = '10px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left'; ctx.fillText(l, xs[0] - 38, sourceY[i]);
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
      ctx.globalAlpha = ap * a; ctx.fillStyle = tok.c; ctx.font = '11px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
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
      ctx.font = `${isHL ? '600 ' : ''}10px ui-monospace, Menlo, Consolas, monospace`; ctx.textAlign = 'center'; ctx.fillText(n.l, n.x, n.y + 4);
    });
    const cur = Math.floor(t * .04) % asm.length;
    asm.forEach((l, i) => {
      if (i === cur) { ctx.fillStyle = ink(.07 * a); ctx.fillRect(xs[3] - 46, cy - 50 + i * 22 - 11, 95, 15); }
      ctx.fillStyle = i === cur ? ink(.8 * a) : ink(.28 * a);
      ctx.font = `${i === cur ? '600 ' : ''}10px ui-monospace, Menlo, Consolas, monospace`; ctx.textAlign = 'left'; ctx.fillText(l, xs[3] - 44, cy - 39 + i * 22);
    });
    particles.forEach(p => {
      ctx.fillStyle = p.color; ctx.globalAlpha = .85 * a;
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(244,244,245,${.3 * a})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(244,244,245,${.9 * a})`; ctx.font = '8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
      ctx.fillText(p.label, p.x, p.y + 3);
    });

    ctx.restore();
  };
})();

// ── L4: OoO Tomasulo — pipelined view with wakeup-select + Gantt timeline ──
export let L4_hov = -1;
const L4 = (() => {
  // ===== Pipeline state =====
  let t = 0, cycle = 0;
  const FRAMES_PER_CYCLE = 14;  // ~4.3 cycles/sec
  type InstDef = { op: string; dst: number; src1: number; src2: number; tp: string; cl: string; lat: number; isBranch?: boolean; isLoad?: boolean; isStore?: boolean };
  const STREAM: InstDef[] = [
    { op: 'add',  dst: 5, src1: 1, src2: 3, tp: 'INT',  cl: '#1d4ed8', lat: 1 },
    { op: 'mul',  dst: 2, src1: 5, src2: 4, tp: 'MUL',  cl: '#7e22ce', lat: 4 },
    { op: 'ld',   dst: 7, src1: 2, src2: 0, tp: 'LOAD', cl: '#b45309', lat: 6, isLoad: true },
    { op: 'xor',  dst: 3, src1: 7, src2: 1, tp: 'INT',  cl: '#1d4ed8', lat: 1 },
    { op: 'st',   dst: 0, src1: 3, src2: 6, tp: 'STR',  cl: '#15803d', lat: 2, isStore: true },
    { op: 'mul',  dst: 6, src1: 3, src2: 7, tp: 'MUL',  cl: '#be123c', lat: 4 },
    { op: 'add',  dst: 1, src1: 6, src2: 2, tp: 'INT',  cl: '#1d4ed8', lat: 1 },
    { op: 'bnz',  dst: 0, src1: 5, src2: 0, tp: 'INT',  cl: '#0891b2', lat: 1, isBranch: true },
    { op: 'and',  dst: 4, src1: 1, src2: 6, tp: 'INT',  cl: '#1d4ed8', lat: 1 },
    { op: 'ld',   dst: 0, src1: 4, src2: 0, tp: 'LOAD', cl: '#b45309', lat: 6, isLoad: true },
    { op: 'sub',  dst: 6, src1: 5, src2: 4, tp: 'INT',  cl: '#1d4ed8', lat: 1 },
    { op: 'mul',  dst: 7, src1: 6, src2: 3, tp: 'MUL',  cl: '#7e22ce', lat: 4 },
  ];
  let streamIdx = 0, instSeq = 0;
  type Inst = {
    seq: number; op: string; dst: number; src1: number; src2: number;
    src1Tag: string | null; src2Tag: string | null;
    rdy1: boolean; rdy2: boolean;
    tp: string; cl: string; lat: number;
    tag: string;
    speculative: boolean;
    isBranch: boolean; isLoad: boolean; isStore: boolean;
    cF: number; cI: number; cX: number; cW: number; cC: number;
  };
  let feQueue: Inst[] = [];
  const FE_CAP = 3;
  const rsTypes = ['INT', 'LOAD', 'MUL', 'STR'];
  const rsE: Record<string, Inst[]> = { INT: [], LOAD: [], MUL: [], STR: [] };
  const rsCap: Record<string, number> = { INT: 3, LOAD: 2, MUL: 2, STR: 2 };
  const rsCl: Record<string, string> = { INT: '#1d4ed8', LOAD: '#b45309', MUL: '#7e22ce', STR: '#15803d' };
  type FU = { inst: Inst | null; remaining: number; total: number };
  const fu: Record<string, FU> = {
    INT: { inst: null, remaining: 0, total: 0 },
    LOAD: { inst: null, remaining: 0, total: 0 },
    MUL: { inst: null, remaining: 0, total: 0 },
    STR: { inst: null, remaining: 0, total: 0 },
  };
  let rob: (Inst | null)[] = Array(12).fill(null);
  let robHead = 0, robTail = 0;
  let rat: (string | null)[] = Array(8).fill(null);
  let cdb: { tag: string; value: number; cl: string; prog: number } | null = null;
  let specBranch: Inst | null = null;
  let squashTimer = 0;
  type GanttEntry = { seq: number; op: string; dst: number; src1: number; src2: number; cl: string;
                       cF: number; cI: number; cX: number; cW: number; cC: number;
                       speculative: boolean; squashed: boolean };
  let ganttHistory: GanttEntry[] = [];
  const GANTT_ROWS = 6;
  const ipcHist: number[] = Array(60).fill(1.5);
  let ipcPtr = 0, commitCount = 0, ipcSampleC = 0;
  let robFlash: { tag: string | null; timer: number } = { tag: null, timer: 0 };
  let ratFlash: { tag: string | null; timer: number } = { tag: null, timer: 0 };
  type WakeArrow = { tag: string; consumerSeq: number; age: number };
  let wakeArrows: WakeArrow[] = [];

  function instLabel(inst: { op: string; dst: number; src1: number; src2: number }, full: boolean): string {
    const dst = inst.dst > 0 ? 'r' + inst.dst : '';
    const s1 = inst.src1 > 0 ? 'r' + inst.src1 : '';
    const s2 = inst.src2 > 0 ? 'r' + inst.src2 : '';
    if (full) {
      const parts: string[] = [];
      if (dst) parts.push(dst);
      if (s1) parts.push(s1);
      if (s2) parts.push(s2);
      return inst.op + ' ' + parts.join(',');
    }
    return inst.op + (dst ? ' ' + dst : '');
  }
  function pushToGantt(inst: Inst, squashed: boolean) {
    ganttHistory.push({
      seq: inst.seq, op: inst.op, dst: inst.dst, src1: inst.src1, src2: inst.src2,
      cl: inst.cl, cF: inst.cF, cI: inst.cI, cX: inst.cX, cW: inst.cW, cC: inst.cC,
      speculative: inst.speculative, squashed,
    });
    while (ganttHistory.length > 24) ganttHistory.shift();
  }

  function tick() {
    cycle++;
    // 1. COMMIT (up to 2 per cycle, in-order from ROB head)
    let committed = 0;
    while (committed < 2) {
      const headSlot = robHead % 12;
      const headInst = rob[headSlot];
      if (!headInst || headInst.cW < 0) break;
      headInst.cC = cycle;
      pushToGantt(headInst, false);
      rob[headSlot] = null;
      robHead++;
      commitCount++;
      committed++;
      if (rat.includes(headInst.tag)) rat = rat.map(r => r === headInst.tag ? null : r);
    }
    // 2. WRITEBACK: broadcast a finished FU's result on the CDB, wake up dependents
    if (!cdb) {
      for (const tp of rsTypes) {
        const f = fu[tp];
        if (f.inst && f.remaining === 0) {
          const done = f.inst;
          cdb = { tag: done.tag, value: (done.seq * 7 + 0x42) & 0xff, cl: done.cl, prog: 0 };
          done.cW = cycle;
          for (const tp2 of rsTypes) {
            for (const rsi of rsE[tp2]) {
              let woke = false;
              if (rsi.src1Tag === done.tag) { rsi.src1Tag = null; rsi.rdy1 = true; woke = true; }
              if (rsi.src2Tag === done.tag) { rsi.src2Tag = null; rsi.rdy2 = true; woke = true; }
              if (woke) wakeArrows.push({ tag: done.tag, consumerSeq: rsi.seq, age: 0 });
            }
          }
          robFlash = { tag: done.tag, timer: 18 };
          ratFlash = { tag: done.tag, timer: 18 };
          if (done.isBranch && specBranch === done) {
            if (Math.random() < 0.3) {
              squashTimer = 28;
              feQueue.forEach(i => { if (i.speculative && i.seq > done.seq) pushToGantt(i, true); });
              feQueue = feQueue.filter(i => !i.speculative || i.seq <= done.seq);
              for (const tp2 of rsTypes) {
                rsE[tp2].forEach(i => { if (i.speculative && i.seq > done.seq) pushToGantt(i, true); });
                rsE[tp2] = rsE[tp2].filter(i => !i.speculative || i.seq <= done.seq);
              }
              for (const tp2 of rsTypes) {
                const fi = fu[tp2].inst;
                if (fi && fi.speculative && fi.seq > done.seq) {
                  pushToGantt(fi, true);
                  fu[tp2].inst = null; fu[tp2].remaining = 0; fu[tp2].total = 0;
                }
              }
              for (let i = robHead; i < robTail; i++) {
                const slot = rob[i % 12];
                if (slot && slot.speculative && slot.seq > done.seq) rob[i % 12] = null;
              }
              let newTail = robHead;
              for (let i = robHead; i < robHead + 12; i++) {
                if (rob[i % 12]) newTail = i + 1;
              }
              robTail = newTail;
              for (let i = 0; i < 8; i++) {
                const tag = rat[i];
                if (tag) {
                  let found = false;
                  for (let r = robHead; r < robTail; r++) if (rob[r % 12]?.tag === tag) { found = true; break; }
                  if (!found) rat[i] = null;
                }
              }
            }
            feQueue.forEach(i => { i.speculative = false; });
            for (const tp2 of rsTypes) rsE[tp2].forEach(i => { i.speculative = false; });
            for (let i = robHead; i < robTail; i++) { const s = rob[i % 12]; if (s) s.speculative = false; }
            specBranch = null;
          }
          f.inst = null; f.remaining = 0; f.total = 0;
          break;
        }
      }
    }
    // 3. EXECUTE: tick down running FUs
    for (const tp of rsTypes) {
      const f = fu[tp];
      if (f.inst && f.remaining > 0) f.remaining--;
    }
    // 4. ISSUE: pick a ready RS entry per FU type and dispatch
    for (const tp of rsTypes) {
      const f = fu[tp];
      if (f.inst === null) {
        const idx = rsE[tp].findIndex(e => e.rdy1 && e.rdy2);
        if (idx >= 0) {
          const inst = rsE[tp][idx];
          f.inst = inst;
          f.remaining = inst.lat;
          f.total = inst.lat;
          inst.cX = cycle;
          rsE[tp].splice(idx, 1);
        }
      }
    }
    // 5. DISPATCH (rename + ROB alloc): up to 2 from feQueue → RS
    let dispatchedThisCycle = 0;
    while (feQueue.length > 0 && dispatchedThisCycle < 2) {
      const inst = feQueue[0];
      if (rsE[inst.tp].length >= rsCap[inst.tp]) break;
      if (robTail - robHead >= 12) break;
      inst.tag = 'T' + (robTail % 12);
      if (inst.src1 > 0 && rat[inst.src1]) { inst.src1Tag = rat[inst.src1]; inst.rdy1 = false; }
      if (inst.src2 > 0 && rat[inst.src2]) { inst.src2Tag = rat[inst.src2]; inst.rdy2 = false; }
      rob[robTail % 12] = inst;
      if (inst.dst > 0) rat[inst.dst] = inst.tag;
      robTail++;
      inst.cI = cycle;
      rsE[inst.tp].push(inst);
      feQueue.shift();
      dispatchedThisCycle++;
    }
    // 6. FETCH: fill FE queue
    while (feQueue.length < FE_CAP) {
      const def = STREAM[streamIdx % STREAM.length];
      const inst: Inst = {
        seq: instSeq++, op: def.op, dst: def.dst, src1: def.src1, src2: def.src2,
        src1Tag: null, src2Tag: null, rdy1: true, rdy2: true,
        tp: def.tp, cl: def.cl, lat: def.lat, tag: '',
        speculative: !!specBranch,
        isBranch: !!def.isBranch, isLoad: !!def.isLoad, isStore: !!def.isStore,
        cF: cycle, cI: -1, cX: -1, cW: -1, cC: -1,
      };
      feQueue.push(inst);
      streamIdx++;
      if (def.isBranch && !specBranch) specBranch = inst;
    }
  }

  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++;
    const tickNow = (t % FRAMES_PER_CYCLE) === 0;
    if (tickNow) tick();
    if (robFlash.timer > 0) robFlash.timer--;
    if (ratFlash.timer > 0) ratFlash.timer--;
    if (squashTimer > 0) squashTimer--;
    wakeArrows = wakeArrows.filter(w => ++w.age < 24);
    if (cdb) {
      cdb.prog += 0.045;
      if (cdb.prog >= 1) cdb = null;
    }
    ipcSampleC++;
    if (ipcSampleC >= 60) {
      const cyclesInSample = ipcSampleC / FRAMES_PER_CYCLE;
      ipcHist[ipcPtr] = Math.max(.3, Math.min(3.2, commitCount / Math.max(1, cyclesInSample)));
      ipcPtr = (ipcPtr + 1) % ipcHist.length;
      commitCount = 0;
      ipcSampleC = 0;
    }

    // ===== Layout =====
    const sx = W * .42;
    const wAvail = W - sx - 8;
    const ag = Math.max(10, Math.floor(wAvail * .018));
    const bW = Math.floor((wAvail - 3 * ag) / 4);
    const bH = 76;
    const y0Top = Math.max(40, (H - 440) / 2);
    const titleY = y0Top + 14;
    const boxesY = y0Top + 38;
    const miniROBY = boxesY + bH + 18;
    const ratY = miniROBY + 42;
    const ganttY = ratY + 28;
    const bX = [sx, sx + bW + ag, sx + 2 * (bW + ag), sx + 3 * (bW + ag)];

    // ===== Top strip: cycle counter + clock pulse + title + IPC =====
    const clockPhase = (t % FRAMES_PER_CYCLE) / FRAMES_PER_CYCLE;
    const clockPulse = clockPhase < 0.25 ? 1 - clockPhase * 4 : 0;
    ctx.fillStyle = `rgba(34,197,94,${(.55 + clockPulse * .4) * a})`;
    ctx.font = 'bold 14px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('cycle ' + cycle, sx, titleY);
    ctx.fillStyle = `rgba(34,197,94,${.85 * (.3 + clockPulse) * a})`;
    ctx.beginPath();
    ctx.arc(sx + 78, titleY - 4, 3 + clockPulse * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink(.55 * a);
    ctx.font = 'bold 11px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Tomasulo OoO Machine · wakeup-select + ROB commit', sx + wAvail / 2, titleY);
    // IPC sparkline
    const spkW = 130, spkH = 22;
    const spkX = sx + wAvail - spkW, spkY = titleY - 16;
    ctx.fillStyle = `rgba(244,244,245,${.55 * a})`;
    ctx.strokeStyle = ink(.14 * a); ctx.lineWidth = 1;
    ctx.fillRect(spkX, spkY, spkW, spkH); ctx.strokeRect(spkX, spkY, spkW, spkH);
    ctx.fillStyle = ink(.4 * a); ctx.font = '7px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left';
    ctx.fillText('IPC', spkX + 4, spkY + 9);
    const lastIpc = ipcHist[(ipcPtr - 1 + ipcHist.length) % ipcHist.length];
    ctx.fillStyle = ink(.65 * a); ctx.font = 'bold 9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'right';
    ctx.fillText(lastIpc.toFixed(2), spkX + spkW - 4, spkY + 10);
    ctx.strokeStyle = `rgba(21,128,61,${.75 * a})`; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < ipcHist.length; i++) {
      const idx = (ipcPtr + i) % ipcHist.length;
      const px = spkX + 24 + (i / (ipcHist.length - 1)) * (spkW - 30);
      const py = spkY + spkH - 3 - (ipcHist[idx] / 3.5) * (spkH - 10);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Branch speculation indicator
    if (specBranch) {
      ctx.fillStyle = `rgba(244,114,182,${.85 * a})`;
      ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('▸ SPEC bnz #' + specBranch.seq, sx + 100, titleY);
    }

    // ===== 4 stage boxes =====
    const boxLabels = ['FE / Issue', 'RS / Wakeup', 'Func. Units', 'ROB + RAT'];
    const boxAccent = ['rgba(29,78,216,', 'rgba(180,83,9,', 'rgba(126,34,206,', 'rgba(21,128,61,'];
    for (let bi = 0; bi < 4; bi++) {
      const x = bX[bi], y = boxesY;
      const isHov = L4_hov === bi;
      ctx.fillStyle = boxAccent[bi] + (.07 * a) + ')';
      ctx.strokeStyle = boxAccent[bi] + ((isHov ? .65 : .3) * a) + ')';
      ctx.lineWidth = isHov ? 1.5 : 1;
      ctx.fillRect(x, y, bW, bH); ctx.strokeRect(x, y, bW, bH);
      ctx.fillStyle = boxAccent[bi] + (.75 * a) + ')';
      ctx.font = 'bold 10px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(boxLabels[bi], x + bW / 2, y + 13);
    }

    // Box 0: FE — show instruction queue with real operands
    {
      const x = bX[0], y = boxesY;
      ctx.font = '8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left';
      feQueue.slice(0, 3).forEach((inst, j) => {
        const ly = y + 26 + j * 12;
        const isSpec = inst.speculative;
        ctx.fillStyle = isSpec ? `rgba(244,114,182,${.88 * a})` : ink(.7 * a);
        ctx.fillText(instLabel(inst, true), x + 6, ly);
        if (isSpec) {
          ctx.fillStyle = `rgba(244,114,182,${.55 * a})`;
          ctx.font = '6px ui-monospace, Menlo, Consolas, monospace';
          ctx.fillText('spec', x + bW - 22, ly);
          ctx.font = '8px ui-monospace, Menlo, Consolas, monospace';
        }
      });
      ctx.fillStyle = ink(.4 * a);
      ctx.font = '7px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(feQueue.length + '/' + FE_CAP + ' fetched', x + bW - 4, y + bH - 4);
    }

    // Box 1: RS — entries with ready/waiting state
    {
      const x = bX[1], y = boxesY;
      const colW = (bW - 8) / 4;
      rsTypes.forEach((tp, ti) => {
        const cxx = x + 4 + ti * colW;
        ctx.fillStyle = rsCl[tp];
        ctx.globalAlpha = .9 * a;
        ctx.font = 'bold 7px ui-monospace, Menlo, Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(tp, cxx + colW / 2, y + 25);
        ctx.globalAlpha = 1;
        const entries = rsE[tp];
        entries.slice(0, 3).forEach((inst, j) => {
          const ey = y + 29 + j * 14;
          const allRdy = inst.rdy1 && inst.rdy2;
          ctx.fillStyle = allRdy ? `rgba(21,128,61,${.62 * a})` : `rgba(110,110,120,${.45 * a})`;
          ctx.fillRect(cxx + 2, ey, colW - 4, 12);
          ctx.fillStyle = `rgba(255,255,255,${.95 * a})`;
          ctx.font = 'bold 7px ui-monospace, Menlo, Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(inst.tag + (allRdy ? '·R' : ''), cxx + colW / 2, ey + 9);
        });
      });
    }

    // Box 2: FU — latency bars (always visible)
    {
      const x = bX[2], y = boxesY;
      const rowH = (bH - 22) / 4;
      rsTypes.forEach((tp, ti) => {
        const ry = y + 22 + ti * rowH;
        const f = fu[tp];
        ctx.fillStyle = rsCl[tp];
        ctx.globalAlpha = .9 * a;
        ctx.font = 'bold 7px ui-monospace, Menlo, Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(tp, x + 4, ry + 9);
        ctx.globalAlpha = 1;
        const barX = x + 28, barW2 = bW - 36, barH = 8;
        ctx.fillStyle = `rgba(220,220,225,${.55 * a})`;
        ctx.fillRect(barX, ry + 3, barW2, barH);
        if (f.inst) {
          const prog = (f.total - f.remaining) / Math.max(1, f.total);
          ctx.fillStyle = f.inst.cl;
          ctx.globalAlpha = .88 * a;
          ctx.fillRect(barX, ry + 3, barW2 * prog, barH);
          ctx.globalAlpha = 1;
          ctx.fillStyle = ink(.55 * a);
          ctx.font = '6px ui-monospace, Menlo, Consolas, monospace';
          ctx.textAlign = 'right';
          ctx.fillText(f.inst.tag, barX + barW2 - 2, ry + rowH - 1);
        } else {
          ctx.fillStyle = ink(.3 * a);
          ctx.font = '6px ui-monospace, Menlo, Consolas, monospace';
          ctx.textAlign = 'right';
          ctx.fillText('idle', barX + barW2 - 2, ry + rowH - 1);
        }
      });
    }

    // Box 3: ROB + RAT summary
    {
      const x = bX[3], y = boxesY;
      const robCount = rob.filter(r => r).length;
      const ratCount = rat.filter(r => r).length;
      const ready = Object.values(rsE).reduce((s, e) => s + e.filter(i => i.rdy1 && i.rdy2).length, 0);
      const waiting = Object.values(rsE).reduce((s, e) => s + e.filter(i => !(i.rdy1 && i.rdy2)).length, 0);
      ctx.fillStyle = ink(.6 * a);
      ctx.font = '8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('ROB  ' + robCount + '/12', x + 6, y + 26);
      ctx.fillText('RAT  ' + ratCount + '/8', x + 6, y + 38);
      ctx.fillStyle = `rgba(21,128,61,${.78 * a})`;
      ctx.fillText('rdy  ' + ready, x + 6, y + 52);
      ctx.fillStyle = ink(.45 * a);
      ctx.fillText('wait ' + waiting, x + 6, y + 64);
    }

    // Arrows between boxes
    for (let i = 0; i < 3; i++) {
      const ax = bX[i] + bW + 2, ay = boxesY + bH / 2, aw = ag - 6;
      ctx.strokeStyle = ink(.25 * a); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + aw, ay); ctx.stroke();
      ctx.fillStyle = ink(.25 * a);
      ctx.beginPath(); ctx.moveTo(ax + aw - 4, ay - 3); ctx.lineTo(ax + aw, ay); ctx.lineTo(ax + aw - 4, ay + 3); ctx.fill();
    }

    // ===== Mini-ROB strip (always visible) =====
    {
      ctx.fillStyle = ink(.55 * a);
      ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Reorder Buffer (in-order commit →)', sx, miniROBY - 4);
      const robSlotW = wAvail / 12;
      const robSlotH = 30;
      for (let i = 0; i < 12; i++) {
        const ex = sx + i * robSlotW;
        const inst = rob[i];
        const isHead = (i === robHead % 12) && !!inst;
        const isFlash = robFlash.timer > 0 && !!inst && robFlash.tag === inst.tag;
        const isDone = !!inst && inst.cW >= 0;
        ctx.fillStyle = inst ? `rgba(244,244,245,${.65 * a})` : `rgba(250,250,250,${.18 * a})`;
        ctx.strokeStyle = isFlash ? `rgba(34,197,94,${.9 * a})` : (isDone ? ink(.5 * a) : ink(.18 * a));
        ctx.lineWidth = isFlash ? 2 : 1;
        ctx.fillRect(ex + 1, miniROBY, robSlotW - 3, robSlotH);
        ctx.strokeRect(ex + 1, miniROBY, robSlotW - 3, robSlotH);
        if (isFlash) {
          ctx.fillStyle = `rgba(34,197,94,${.18 * a})`;
          ctx.fillRect(ex + 1, miniROBY, robSlotW - 3, robSlotH);
        }
        ctx.fillStyle = ink(.32 * a);
        ctx.font = '6px ui-monospace, Menlo, Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('T' + i, ex + 3, miniROBY + 7);
        if (inst) {
          ctx.fillStyle = inst.cl;
          ctx.globalAlpha = .88 * a;
          ctx.beginPath();
          ctx.arc(ex + robSlotW / 2, miniROBY + 11, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = ink(.55 * a);
          ctx.font = '7px ui-monospace, Menlo, Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(inst.op + (inst.dst > 0 ? ' r' + inst.dst : ''), ex + robSlotW / 2, miniROBY + 21);
          ctx.fillStyle = isDone ? `rgba(21,128,61,${.85 * a})` : ink(.3 * a);
          ctx.font = '7px ui-monospace, Menlo, Consolas, monospace';
          ctx.fillText(isDone ? '✓' : '·', ex + robSlotW / 2, miniROBY + 28);
        }
        if (isHead) {
          ctx.fillStyle = ink(.6 * a);
          ctx.font = '8px ui-monospace, Menlo, Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('▲ head', ex + robSlotW / 2, miniROBY + robSlotH + 9);
        }
      }
    }

    // ===== RAT strip =====
    {
      ctx.fillStyle = ink(.55 * a);
      ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('RAT — arch reg → in-flight tag (eliminates WAR/WAW)', sx, ratY - 4);
      const ratSlotW = wAvail / 8;
      const ratH = 18;
      for (let i = 0; i < 8; i++) {
        const ex = sx + i * ratSlotW;
        const tag = rat[i];
        const isFlash = ratFlash.timer > 0 && ratFlash.tag === tag;
        ctx.fillStyle = tag ? `rgba(244,244,245,${.65 * a})` : `rgba(250,250,250,${.18 * a})`;
        ctx.strokeStyle = isFlash ? `rgba(34,197,94,${.9 * a})` : ink(.18 * a);
        ctx.lineWidth = isFlash ? 2 : 1;
        ctx.fillRect(ex + 1, ratY, ratSlotW - 3, ratH);
        ctx.strokeRect(ex + 1, ratY, ratSlotW - 3, ratH);
        ctx.fillStyle = ink(.45 * a);
        ctx.font = '7px ui-monospace, Menlo, Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('r' + i, ex + 4, ratY + 8);
        ctx.fillStyle = tag ? ink(.75 * a) : ink(.25 * a);
        ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(tag || '—', ex + ratSlotW - 5, ratY + 13);
      }
    }

    // ===== Gantt chart =====
    {
      ctx.fillStyle = ink(.55 * a);
      ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Pipeline timeline — out-of-order execution, in-order commit →', sx, ganttY - 4);
      const cyclesShown = 18;
      const labelW = 84;
      const colW = (wAvail - labelW) / cyclesShown;
      const rowH = 14;
      const headerH = 13;
      for (let c = 0; c < cyclesShown; c++) {
        if (c % 3 === 0) {
          const cycNum = cycle - cyclesShown + c + 1;
          if (cycNum > 0) {
            ctx.fillStyle = ink(.38 * a);
            ctx.font = '7px ui-monospace, Menlo, Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String(cycNum), sx + labelW + c * colW + colW / 2, ganttY + headerH - 1);
          }
        }
      }
      const recentMap = new Map<number, GanttEntry>();
      for (let i = robHead; i < robTail; i++) {
        const inst = rob[i % 12];
        if (!inst) continue;
        recentMap.set(inst.seq, {
          seq: inst.seq, op: inst.op, dst: inst.dst, src1: inst.src1, src2: inst.src2,
          cl: inst.cl, cF: inst.cF, cI: inst.cI, cX: inst.cX, cW: inst.cW, cC: inst.cC,
          speculative: inst.speculative, squashed: false,
        });
      }
      for (let i = ganttHistory.length - 1; i >= 0 && recentMap.size < GANTT_ROWS + 6; i--) {
        const g = ganttHistory[i];
        if (!recentMap.has(g.seq)) recentMap.set(g.seq, g);
      }
      const allEntries = Array.from(recentMap.values()).sort((a2, b2) => a2.seq - b2.seq);
      const rows = allEntries.slice(-GANTT_ROWS);
      rows.forEach((entry, ri) => {
        const ry = ganttY + headerH + ri * rowH;
        ctx.fillStyle = entry.squashed ? `rgba(190,18,60,${.7 * a})` : ink(.6 * a);
        ctx.font = '7px ui-monospace, Menlo, Consolas, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(instLabel(entry, true), sx + labelW - 4, ry + rowH - 4);
        const stages: { name: string; cyc: number; col: string }[] = [
          { name: 'F', cyc: entry.cF, col: 'rgba(160,160,170,' },
          { name: 'I', cyc: entry.cI, col: 'rgba(180,83,9,' },
          { name: 'X', cyc: entry.cX, col: 'rgba(126,34,206,' },
          { name: 'W', cyc: entry.cW, col: 'rgba(21,128,61,' },
          { name: 'C', cyc: entry.cC, col: 'rgba(190,18,60,' },
        ];
        for (let c = 0; c < cyclesShown; c++) {
          const cycNum = cycle - cyclesShown + c + 1;
          let activeStage: { name: string; cyc: number; col: string } | null = null;
          for (const s of stages) {
            if (s.cyc >= 0 && s.cyc <= cycNum) activeStage = s;
          }
          if (!activeStage) continue;
          const cxg = sx + labelW + c * colW;
          const col = entry.squashed ? 'rgba(190,18,60,' : activeStage.col;
          ctx.fillStyle = col + (.6 * a) + ')';
          ctx.fillRect(cxg + 1, ry + 1, colW - 2, rowH - 3);
          ctx.fillStyle = `rgba(255,255,255,${.95 * a})`;
          ctx.font = 'bold 7px ui-monospace, Menlo, Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(activeStage.name, cxg + colW / 2, ry + rowH - 4);
        }
      });
    }

    // ===== CDB (upgraded with tag bubble) =====
    if (cdb) {
      const fromX = bX[2] + bW * 0.5;
      const toX = bX[1] + bW * 0.5;
      const arcY = boxesY - 26;
      const u = cdb.prog;
      ctx.strokeStyle = cdb.cl;
      ctx.globalAlpha = .65 * a;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(fromX, boxesY);
      ctx.quadraticCurveTo((fromX + toX) / 2, arcY, toX, boxesY);
      ctx.stroke();
      ctx.globalAlpha = 1;
      const px = bz(u, fromX, (fromX + toX) / 2, toX);
      const py = bz(u, boxesY, arcY, boxesY);
      ctx.fillStyle = cdb.cl;
      ctx.globalAlpha = .92 * a;
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 7px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cdb.tag, px, py + 2.5);
      ctx.fillStyle = cdb.cl;
      ctx.globalAlpha = .85 * a;
      ctx.font = '8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CDB · ' + cdb.tag + ' = 0x' + cdb.value.toString(16).padStart(2, '0'), (fromX + toX) / 2, arcY - 4);
      ctx.globalAlpha = 1;
    }

    // Wakeup pulse indicators on the RS box
    wakeArrows.forEach(arr => {
      const fade = Math.max(0, 1 - arr.age / 24);
      const x = bX[1] + bW / 2 + ((arr.consumerSeq % 5) - 2) * 9;
      ctx.strokeStyle = `rgba(34,197,94,${.65 * fade * a})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, boxesY - 4);
      ctx.lineTo(x, boxesY + 16);
      ctx.stroke();
    });

    // Squash flash overlay
    if (squashTimer > 0) {
      const fa = squashTimer / 28;
      ctx.fillStyle = `rgba(190,18,60,${.10 * fa * a})`;
      ctx.fillRect(sx, y0Top, wAvail, ganttY + 6 * 14 + 14 - y0Top);
      ctx.fillStyle = `rgba(190,18,60,${.9 * fa * a})`;
      ctx.font = 'bold 13px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ SQUASH — branch mispredict ⚡', sx + wAvail / 2, y0Top + 2);
    }
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
    // Right-area wrap (avoids the section text card on the left).
    ctx.save();
    const _rightX = W * 0.42, _fitS = (W - _rightX) / W;
    ctx.translate(Math.round(_rightX), Math.round((H - H * _fitS) / 2));
    ctx.scale(_fitS, _fitS);

    const waveW = W * .52, waveX = W * .44, rh = 38, sy = H / 2 - (sigs.length * rh) / 2;
    const curState = Math.floor(t / 48) % fsmStates.length;
    sigs.forEach((s, i) => {
      const y = sy + i * rh;
      ctx.fillStyle = ink(.45 * a); ctx.font = '10px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'right';
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
          ctx.font = 'bold 9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
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
    ctx.fillStyle = ink(.22 * a); ctx.font = '10px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left';
    ctx.fillText(`t=${Math.floor(t * 1.5)}ns  clk=100MHz  Artix-7`, waveX, sy + sigs.length * rh + 16);
    const fsmCX = W * .2, fsmCY = H * .5, fsmR = 78;
    ctx.fillStyle = ink(.22 * a); ctx.font = '9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
    ctx.fillText('FSM State Machine', fsmCX, fsmCY - fsmR - 16);
    if (curState !== prevState) { transitionDot = { fromState: prevState, toState: curState, prog: 0 }; prevState = curState; }
    if (transitionDot.prog < 1) transitionDot.prog += 0.06;
    fsmStates.forEach((s, i) => {
      const ang = -Math.PI / 2 + (i / fsmStates.length) * Math.PI * 2;
      const sx2 = fsmCX + Math.cos(ang) * fsmR, sy2 = fsmCY + Math.sin(ang) * fsmR, active = i === curState;
      ctx.fillStyle = active ? ink(.08 * a) : `rgba(244,244,245,${.8 * a})`;
      ctx.strokeStyle = active ? ink(.45 * a) : ink(.14 * a); ctx.lineWidth = active ? 1.5 : 1;
      ctx.beginPath(); ctx.arc(sx2, sy2, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = active ? ink(.7 * a) : ink(.28 * a); ctx.font = '8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
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

    ctx.restore();
  };
})();

// ── L2: 4-bit Carry-Lookahead Adder (gate-level) ──
export let L2_A = 6, L2_B = 5, L2_A_locked = false;
const L2 = (() => {
  let t = 0, eTmr = 0;
  const CYCLE = 290;  // total animation cycle in frames (≈4.8s at 60fps)
  const examples = [[6,5],[3,7],[12,4],[9,6],[15,1],[8,7],[11,3]];
  let eIdx = 0;
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
  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++; eTmr++;
    if (eTmr > CYCLE) {
      if (L2_A_locked) {
        // User has typed inputs — stay at the settled phase forever.
        eTmr = CYCLE;
      } else {
        eTmr = 0;
        eIdx = (eIdx + 1) % examples.length;
      }
    }

    const A = (L2_A_locked ? L2_A : examples[eIdx][0]) & 15;
    const B = (L2_A_locked ? L2_B : examples[eIdx][1]) & 15;
    const fullSum = A + B;

    // ── Per-bit propagate / generate (parallel: 1 gate delay) ──
    const P: number[] = [], G: number[] = [];
    for (let i = 0; i < 4; i++) {
      const ai = (A >> i) & 1, bi = (B >> i) & 1;
      P.push(ai ^ bi);
      G.push(ai & bi);
    }
    const C0 = 0;
    // ── Lookahead: all carries computed in parallel from P, G, C₀ ──
    const C1 = G[0] | (P[0] & C0);
    const C2 = G[1] | (P[1] & G[0]) | (P[1] & P[0] & C0);
    const C3 = G[2] | (P[2] & G[1]) | (P[2] & P[1] & G[0]) | (P[2] & P[1] & P[0] & C0);
    const C4 = G[3] | (P[3] & G[2]) | (P[3] & P[2] & G[1]) | (P[3] & P[2] & P[1] & G[0]) | (P[3] & P[2] & P[1] & P[0] & C0);
    const C = [C0, C1, C2, C3, C4];
    const S = P.map((p, i) => p ^ C[i]);

    // ── Phase machine ──
    // 0: inputs · 1: P,G · 2: fan-in · 3: products · 4: carries · 5: sum · 6: hold
    let phase = 0;
    if (eTmr < 18) phase = 0;
    else if (eTmr < 54) phase = 1;
    else if (eTmr < 84) phase = 2;
    else if (eTmr < 120) phase = 3;
    else if (eTmr < 150) phase = 4;
    else if (eTmr < 180) phase = 5;
    else phase = 6;
    const inputLit = phase >= 0;
    const pgLit = phase >= 1;
    const flowLit = phase >= 2;
    const prodLit = phase >= 3;
    const carryLit = phase >= 4;
    const sumLit = phase >= 5;

    // ── Layout (canvas-local, before fit-scale) ──
    const PG_W = 78, PG_H = 60;
    const SUM_W = 60, SUM_H = 40;
    const ROW_H = 72;
    const PG_X = 0;
    const BLOCK_X = 104;
    const BLOCK_W = 240;
    const BLOCK_H = 4 * ROW_H;
    const SUM_X = 372;
    const NATURAL_W = 522;
    const NATURAL_H = 5 * ROW_H + 70;
    // Per-signal vertical bus positions inside the left edge of the block.
    // Spaced out for readability — each bus is clearly distinguishable.
    const busDx = 5;
    const busBase = BLOCK_X + 6;
    const sigX: Record<string, number> = {
      C0: busBase + 0 * busDx,
      P0: busBase + 1 * busDx,
      G0: busBase + 2 * busDx,
      P1: busBase + 3 * busDx,
      G1: busBase + 4 * busDx,
      P2: busBase + 5 * busDx,
      G2: busBase + 6 * busDx,
      P3: busBase + 7 * busDx,
      G3: busBase + 8 * busDx,
    };

    const rightAreaX = W * 0.42;
    const rightAreaW = W - rightAreaX - 10;
    const fitScale = Math.min(1, rightAreaW / NATURAL_W, (H * 0.86) / NATURAL_H);
    // Round translate origin to integer pixels — sub-pixel translates blur text/lines.
    const fitTx = Math.round(rightAreaX + (rightAreaW - NATURAL_W * fitScale) / 2);
    const fitTy = Math.round((H - NATURAL_H * fitScale) / 2);
    ctx.save();
    ctx.translate(fitTx, fitTy);
    ctx.scale(fitScale, fitScale);

    const sx = 0, sy = 28;
    const blockTop = sy + ROW_H;  // block starts at bit 1's row (bit 0 has no carry input from lookahead)

    // ── Title + phase label ──
    ctx.fillStyle = ink(.5 * a);
    ctx.font = 'bold 11px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('4-bit Carry-Lookahead Adder · all carries in parallel', sx, sy - 12);
    const PHASE_LABELS = ['inputs', 'P,G — parallel', 'fan-in →', 'product terms', 'carries — parallel', 'sum — parallel', 'settled'];
    ctx.fillStyle = ink(.4 * a);
    ctx.font = '9px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('phase: ' + PHASE_LABELS[phase], sx + NATURAL_W, sy - 12);

    // ── PG cells (left column, 4 stacked, bit 0 at top) ──
    for (let i = 0; i < 4; i++) {
      const cellY = sy + i * ROW_H;
      const ai = (A >> i) & 1, bi = (B >> i) & 1;
      ctx.fillStyle = `rgba(252,252,253,${.72 * a})`;
      ctx.strokeStyle = ink(.22 * a);
      ctx.lineWidth = 1;
      ctx.fillRect(PG_X, cellY, PG_W, PG_H);
      ctx.strokeRect(PG_X, cellY, PG_W, PG_H);
      ctx.fillStyle = ink(.55 * a);
      ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('bit ' + i, PG_X + 4, cellY + 10);
      const aCol = ai && inputLit ? `rgba(29,78,216,${a})` : ink(.55 * a);
      const bCol = bi && inputLit ? `rgba(29,78,216,${a})` : ink(.55 * a);
      ctx.fillStyle = aCol;
      ctx.font = '9px ui-monospace, Menlo, Consolas, monospace';
      ctx.fillText('A' + i + '=' + ai, PG_X + 6, cellY + 26);
      ctx.fillStyle = bCol;
      ctx.fillText('B' + i + '=' + bi, PG_X + 6, cellY + 40);
      // XOR (P) gate
      const pgGateX = PG_X + 38;
      gshape(ctx, pgGateX, cellY + 18, 18, 12, 'XOR',
        P[i] && pgLit ? `rgba(29,78,216,${.5 * a})` : `rgba(255,255,255,${.95 * a})`,
        P[i] && pgLit ? `rgba(29,78,216,${a})` : ink(.5 * a));
      // AND (G) gate
      gshape(ctx, pgGateX, cellY + 36, 18, 12, 'AND',
        G[i] && pgLit ? `rgba(190,18,60,${.5 * a})` : `rgba(255,255,255,${.95 * a})`,
        G[i] && pgLit ? `rgba(190,18,60,${a})` : ink(.5 * a));
      // ── A_i and B_i input wires: each branches to BOTH the XOR and the AND ──
      // A_i wire (top input of XOR + top input of AND).
      const aJx = pgGateX - 6, aWY = cellY + 23;
      wl(ctx, [[PG_X + 28, aWY], [aJx, aWY]], aCol, 1);
      wl(ctx, [[aJx, aWY], [aJx, cellY + 21], [pgGateX + 3, cellY + 21]], aCol, 1);     // → XOR top input
      wl(ctx, [[aJx, aWY], [aJx, cellY + 39], [pgGateX + 1, cellY + 39]], aCol, 1);     // → AND top input
      ctx.fillStyle = aCol;
      ctx.beginPath(); ctx.arc(aJx, aWY, 1.5, 0, Math.PI * 2); ctx.fill();
      // B_i wire (bottom input of XOR + bottom input of AND).
      const bJx = pgGateX - 3, bWY = cellY + 37;
      wl(ctx, [[PG_X + 28, bWY], [bJx, bWY]], bCol, 1);
      wl(ctx, [[bJx, bWY], [bJx, cellY + 27], [pgGateX + 3, cellY + 27]], bCol, 1);     // → XOR bottom input
      wl(ctx, [[bJx, bWY], [bJx, cellY + 45], [pgGateX + 1, cellY + 45]], bCol, 1);     // → AND bottom input
      ctx.fillStyle = bCol;
      ctx.beginPath(); ctx.arc(bJx, bWY, 1.5, 0, Math.PI * 2); ctx.fill();
      // P, G output labels
      ctx.fillStyle = P[i] && pgLit ? `rgba(29,78,216,${.9 * a})` : ink(.4 * a);
      ctx.font = 'bold 9px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('P' + i + '=' + P[i], PG_X + PG_W - 4, cellY + 26);
      ctx.fillStyle = G[i] && pgLit ? `rgba(190,18,60,${.9 * a})` : ink(.4 * a);
      ctx.fillText('G' + i + '=' + G[i], PG_X + PG_W - 4, cellY + 44);
    }

    // ── Block rows definition (used for both bus extents and row rendering) ──
    type ProductDef = { label: string; value: number; signals: string[] };
    const blockRows: { products: ProductDef[]; g: number; gLabel: string; gSig: string; result: number; cLabel: string }[] = [
      { products: [{ label: 'P₀·C₀', value: P[0] & C0, signals: ['P0', 'C0'] }],
        g: G[0], gLabel: 'G₀', gSig: 'G0', result: C1, cLabel: 'C₁' },
      { products: [
          { label: 'P₁·G₀',     value: P[1] & G[0],         signals: ['P1', 'G0'] },
          { label: 'P₁·P₀·C₀',  value: P[1] & P[0] & C0,    signals: ['P1', 'P0', 'C0'] },
        ],
        g: G[1], gLabel: 'G₁', gSig: 'G1', result: C2, cLabel: 'C₂' },
      { products: [
          { label: 'P₂·G₁',        value: P[2] & G[1],                 signals: ['P2', 'G1'] },
          { label: 'P₂·P₁·G₀',     value: P[2] & P[1] & G[0],          signals: ['P2', 'P1', 'G0'] },
          { label: 'P₂·P₁·P₀·C₀',  value: P[2] & P[1] & P[0] & C0,     signals: ['P2', 'P1', 'P0', 'C0'] },
        ],
        g: G[2], gLabel: 'G₂', gSig: 'G2', result: C3, cLabel: 'C₃' },
      { products: [
          { label: 'P₃·G₂',           value: P[3] & G[2],                         signals: ['P3', 'G2'] },
          { label: 'P₃·P₂·G₁',        value: P[3] & P[2] & G[1],                  signals: ['P3', 'P2', 'G1'] },
          { label: 'P₃·P₂·P₁·G₀',     value: P[3] & P[2] & P[1] & G[0],           signals: ['P3', 'P2', 'P1', 'G0'] },
          { label: 'P₃·P₂·P₁·P₀·C₀',  value: P[3] & P[2] & P[1] & P[0] & C0,      signals: ['P3', 'P2', 'P1', 'P0', 'C0'] },
        ],
        g: G[3], gLabel: 'G₃', gSig: 'G3', result: C4, cLabel: 'Cout' },
    ];

    // ── Compute the deepest y where each signal is consumed ──
    // Buses terminate just past their last tap so they don't dangle into empty space.
    const blockBottom = blockTop + BLOCK_H;
    const deepestY: Record<string, number> = {
      C0: blockTop, P0: blockTop, G0: blockTop, P1: blockTop, G1: blockTop,
      P2: blockTop, G2: blockTop, P3: blockTop, G3: blockTop,
    };
    for (let r = 0; r < 4; r++) {
      const rwy = blockTop + r * ROW_H;
      const aTop = rwy + 6;
      const np = blockRows[r].products.length;
      for (let k = 0; k < np; k++) {
        const aY = aTop + k * 13;
        const sigs = blockRows[r].products[k].signals;
        const inSp = (11 - 2) / Math.max(1, sigs.length - 1);
        sigs.forEach((s, si) => {
          const inY = sigs.length === 1 ? aY + 11 / 2 : aY + 1 + si * inSp;
          if (inY > deepestY[s]) deepestY[s] = inY;
        });
      }
      const gwY = aTop + np * 13 + 6;
      const gs = blockRows[r].gSig;
      if (gwY > deepestY[gs]) deepestY[gs] = gwY;
    }
    // Pad each bus by 4px below its last tap for visual breathing room.
    Object.keys(deepestY).forEach(s => { deepestY[s] = Math.min(deepestY[s] + 4, blockBottom); });

    // ── Fan-in wires + per-signal buses ──
    // Each P_i and G_i: horizontal from PG cell to its bus column, then a
    // VERTICAL bus extending down only as far as its last consumer.
    for (let i = 0; i < 4; i++) {
      const cellY = sy + i * ROW_H;
      const py = cellY + 22, gy = cellY + 40;
      const pCol = P[i] && flowLit ? `rgba(29,78,216,${a})` : ink(.55 * a);
      const gCol = G[i] && flowLit ? `rgba(190,18,60,${a})` : ink(.55 * a);
      const pBus = sigX['P' + i], gBus = sigX['G' + i];
      wl(ctx, [[PG_X + PG_W, py], [pBus, py]], pCol, 1.3);
      wl(ctx, [[PG_X + PG_W, gy], [gBus, gy]], gCol, 1.3);
      wl(ctx, [[pBus, py], [pBus, deepestY['P' + i]]], pCol, 1.2);
      wl(ctx, [[gBus, gy], [gBus, deepestY['G' + i]]], gCol, 1.2);
      ctx.fillStyle = pCol;
      ctx.beginPath(); ctx.arc(pBus, py, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = gCol;
      ctx.beginPath(); ctx.arc(gBus, gy, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pCol;
      ctx.font = '6px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('P' + i, pBus, py - 4);
      ctx.fillStyle = gCol;
      ctx.fillText('G' + i, gBus, gy - 4);
    }
    // C0 bus — terminates at its last tap too.
    {
      const c0Col = ink(.32 * a);
      wl(ctx, [[sigX.C0, blockTop], [sigX.C0, deepestY.C0]], c0Col, 1.2);
      ctx.fillStyle = ink(.5 * a);
      ctx.font = 'bold 6px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('C₀=0', sigX.C0, blockTop - 4);
    }

    // ── Lookahead block ──
    // Tinted block fill + stronger border so the lookahead region clearly stands out.
    ctx.fillStyle = `rgba(244,247,252,${.85 * a})`;
    ctx.strokeStyle = ink(.45 * a);
    ctx.lineWidth = 1.5;
    ctx.fillRect(BLOCK_X, blockTop, BLOCK_W, BLOCK_H);
    ctx.strokeRect(BLOCK_X, blockTop, BLOCK_W, BLOCK_H);
    ctx.fillStyle = ink(.6 * a);
    ctx.font = 'bold 9px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOOKAHEAD BLOCK', BLOCK_X + BLOCK_W / 2, blockTop - 6);

    for (let r = 0; r < 4; r++) {
      const row = blockRows[r];
      const rowY = blockTop + r * ROW_H;
      const orX = BLOCK_X + BLOCK_W - 30;
      const andW = 22, andH = 11, andX = BLOCK_X + 58;
      const numP = row.products.length;
      const andSp = 13;
      const andTop = rowY + 6;

      // Signal value lookup for tap colors.
      const sigValue = (s: string): number => {
        if (s === 'C0') return C0;
        if (s[0] === 'P') return P[parseInt(s[1])];
        return G[parseInt(s[1])];
      };
      const sigColor = (s: string, lit: boolean): string => {
        const v = sigValue(s);
        if (s[0] === 'P') return v && lit ? `rgba(29,78,216,${a})` : ink(.55 * a);
        if (s[0] === 'G') return v && lit ? `rgba(190,18,60,${a})` : ink(.55 * a);
        return ink(.55 * a);  // C0

      };

      // OR gate height grows with input count so each input line has clear space.
      // Use ≥4 px between inputs. Center the OR vertically at rowY+33 so the
      // carry-out (orY+orH/2) stays at rowY+33 regardless of size.
      const numInputs = numP + 1;
      const minSpacing = 4;
      const orH = Math.max(14, (numInputs - 1) * minSpacing + 8);
      const orY = rowY + 33 - orH / 2;
      const orInYs: number[] = [];
      const span = orH - 6;
      const step = numInputs === 1 ? 0 : span / (numInputs - 1);
      for (let k = 0; k < numInputs; k++) {
        orInYs.push(orY + 3 + k * step);
      }

      for (let k = 0; k < numP; k++) {
        const andY = andTop + k * andSp;
        const v = row.products[k].value;
        const sigs = row.products[k].signals;
        gshape(ctx, andX, andY, andW, andH, 'AND',
          v && prodLit ? `rgba(126,34,206,${.55 * a})` : `rgba(255,255,255,${.95 * a})`,
          v && prodLit ? `rgba(126,34,206,${a})` : ink(.5 * a));
        // Input stubs (bus → AND): one horizontal per signal, drawn on top of the AND.
        const inSpacing = (andH - 2) / Math.max(1, sigs.length - 1);
        sigs.forEach((s, si) => {
          const busXVal = sigX[s];
          const inY = sigs.length === 1 ? andY + andH / 2 : andY + 1 + si * inSpacing;
          const col = sigColor(s, prodLit || flowLit);
          wl(ctx, [[busXVal, inY], [andX + 1, inY]], col, 1.1);
          if (sigValue(s) && (prodLit || flowLit)) {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(busXVal, inY, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.fillStyle = v && prodLit ? `rgba(126,34,206,${a})` : ink(.6 * a);
        ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(row.products[k].label, Math.round(andX + andW + 4), Math.round(andY + 9));
        // AND → OR: Manhattan-routed (horizontal + vertical only).
        // Each AND uses its own bend-x so verticals don't overlap, then each
        // enters the OR at its own unique y slot on the left side.
        const wireCol = v && prodLit ? `rgba(126,34,206,${a})` : ink(.5 * a);
        const bendX = orX - 6 - k * 4;  // staggered so verticals are distinct
        wl(ctx, [
          [andX + andW, andY + andH / 2],
          [bendX, andY + andH / 2],
          [bendX, orInYs[k]],
          [orX + 3, orInYs[k]],
        ], wireCol, 1.1);
      }

      // G_n direct input to OR — Manhattan-routed, own bend-x and own slot.
      const gActive = row.g && flowLit;
      const gWireY = andTop + numP * andSp + 6;
      ctx.fillStyle = gActive ? `rgba(190,18,60,${.88 * a})` : ink(.45 * a);
      ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(row.gLabel, Math.round(sigX[row.gSig] + 4), Math.round(gWireY - 2));
      const gWireCol = gActive ? `rgba(190,18,60,${a})` : ink(.5 * a);
      const gBendX = orX - 6 - numP * 4;
      wl(ctx, [
        [sigX[row.gSig], gWireY],
        [gBendX, gWireY],
        [gBendX, orInYs[numInputs - 1]],
        [orX + 3, orInYs[numInputs - 1]],
      ], gWireCol, 1.1);

      // OR gate
      gshape(ctx, orX, orY, 22, orH, 'OR',
        row.result && carryLit ? `rgba(190,18,60,${.55 * a})` : `rgba(255,255,255,${.95 * a})`,
        row.result && carryLit ? `rgba(190,18,60,${a})` : ink(.5 * a));
    }

    // ── Sum cells (right column, 4 stacked) ──
    // Each XOR has TWO inputs entering from the LEFT: P_i (top) and C_i (bottom).
    for (let i = 0; i < 4; i++) {
      const cellY = sy + i * ROW_H + 10;
      ctx.fillStyle = `rgba(252,252,253,${.72 * a})`;
      ctx.strokeStyle = ink(.22 * a);
      ctx.lineWidth = 1;
      ctx.fillRect(SUM_X, cellY, SUM_W, SUM_H);
      ctx.strokeRect(SUM_X, cellY, SUM_W, SUM_H);
      ctx.fillStyle = ink(.5 * a);
      ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('S' + i, SUM_X + 4, cellY + 10);
      const xorX = SUM_X + 18, xorY = cellY + 14;
      gshape(ctx, xorX, xorY, 18, 12, 'XOR',
        S[i] && sumLit ? `rgba(21,128,61,${.55 * a})` : `rgba(255,255,255,${.95 * a})`,
        S[i] && sumLit ? `rgba(21,128,61,${a})` : ink(.5 * a));
      ctx.fillStyle = S[i] && sumLit ? `rgba(21,128,61,${a})` : ink(.6 * a);
      ctx.font = 'bold 11px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('=' + S[i], SUM_X + 40, cellY + 24);

      // P_i input — short horizontal stub entering the XOR's TOP input from the LEFT.
      const pInY = xorY + 3;
      const pCol = P[i] && pgLit ? `rgba(29,78,216,${a})` : ink(.55 * a);
      wl(ctx, [[SUM_X - 14, pInY], [xorX + 3, pInY]], pCol, 1.1);
      ctx.fillStyle = pCol;
      ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('P' + i + '=' + P[i], SUM_X - 2, Math.round(pInY + 3));
    }

    // ── Block carry outputs → Sum cells (C₁→Sum1, C₂→Sum2, C₃→Sum3, C₄=Cout) ──
    // Start each carry wire at the OR gate's right tip (touching the gate).
    for (let r = 0; r < 4; r++) {
      const row = blockRows[r];
      const orOutY = blockTop + r * ROW_H + 33;
      const orTipX = BLOCK_X + BLOCK_W - 30 + 22;   // orX + orW
      const carryOutX = BLOCK_X + BLOCK_W;
      const carryCol = row.result && carryLit ? `rgba(190,18,60,${a})` : ink(.5 * a);
      if (r < 3) {
        const sumI = r + 1;
        const sumCellY = sy + sumI * ROW_H + 10;
        const xorBotInY = sumCellY + 14 + 9;
        wl(ctx, [
          [orTipX, orOutY],
          [carryOutX + 14, orOutY],
          [carryOutX + 14, xorBotInY],
          [SUM_X + 18 + 3, xorBotInY],
        ], carryCol, 1.5);
        // Carry label sits OUTSIDE the Sum cell on the left, at the C input y —
        // mirrors the P label placement so they stack neatly without overlap.
        ctx.fillStyle = carryCol;
        ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(row.cLabel + '=' + row.result, SUM_X - 2, Math.round(xorBotInY + 3));
      } else {
        // C₄ = Cout — extends past the block with overflow label.
        wl(ctx, [[orTipX, orOutY], [carryOutX + 38, orOutY]], carryCol, 1.7);
        ctx.fillStyle = carryCol;
        ctx.font = 'bold 9px ui-monospace, Menlo, Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Cout=' + C4, carryOutX + 42, orOutY + 3);
      }
    }

    // C₀ = 0 stub into Sum 0's XOR bottom input (Sum 0 has no carry from the block).
    {
      const cellY0 = sy + 10;
      const xorBotInY = cellY0 + 14 + 9;
      ctx.fillStyle = ink(.55 * a);
      ctx.font = 'bold 8px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('C₀=0', SUM_X - 2, Math.round(xorBotInY + 3));
      wl(ctx, [[SUM_X - 14, xorBotInY], [SUM_X + 18 + 5, xorBotInY]], ink(.32 * a), 1.1);
    }

    // ── Bottom sum bar (below the lookahead block) ──
    const ry = blockTop + BLOCK_H + 18;
    ctx.fillStyle = `rgba(240,240,242,${.65 * a})`;
    ctx.strokeStyle = ink(.16 * a);
    ctx.lineWidth = 1;
    ctx.fillRect(sx, ry, NATURAL_W, 24);
    ctx.strokeRect(sx, ry, NATURAL_W, 24);
    ctx.fillStyle = ink(.55 * a);
    ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    const sumBin = (fullSum >>> 0).toString(2).padStart(5, '0');
    const aBitStr = [3, 2, 1, 0].map(j => (A >> j) & 1).join('');
    const bBitStr = [3, 2, 1, 0].map(j => (B >> j) & 1).join('');
    ctx.fillText(A + ' + ' + B + ' = ' + fullSum + '  ·  ' + aBitStr + ' + ' + bBitStr + ' = ' + sumBin, sx + NATURAL_W / 2, ry + 16);

    ctx.restore();
  };
})();

// ── L1: MOSFET cross-section + band diagram ──
const L1 = (() => {
  let t = 0;
  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    t++;
    // Right-area wrap: shift + scale content to live in the right portion of the canvas
    // so the section text card (on the left) doesn't cover it.
    ctx.save();
    const _rightX = W * 0.42, _fitS = (W - _rightX) / W;
    ctx.translate(Math.round(_rightX), Math.round((H - H * _fitS) / 2));
    ctx.scale(_fitS, _fitS);

    const Vgs = 0.7 + 0.8 * (Math.sin(t * .02) * .5 + .5);
    const Vth = 1.1, on = Vgs > Vth, chan = on ? (Vgs - Vth) / .7 : 0;
    const cx2 = W * .42, cy = H / 2, sw = 250, sh = 155, sx = cx2 - sw / 2, sy = cy - sh / 2;
    ctx.fillStyle = `rgba(234,224,210,${.4 * a})`; ctx.strokeStyle = ink(.12 * a); ctx.lineWidth = 1;
    ctx.fillRect(sx, sy + sh * .35, sw, sh * .65); ctx.strokeRect(sx, sy + sh * .35, sw, sh * .65);
    ctx.fillStyle = ink(.3 * a); ctx.font = '10px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center'; ctx.fillText('p-substrate', cx2, sy + sh * .68);
    [[8, 56, 'n+ src'], [sw - 64, 56, 'n+ drn']].forEach(([ox, ow, lbl]) => {
      ctx.fillStyle = `rgba(186,220,255,${.5 * a})`; ctx.strokeStyle = ink(.18 * a); ctx.lineWidth = 1;
      ctx.fillRect(sx + (ox as number), sy + sh * .35, ow as number, sh * .27); ctx.strokeRect(sx + (ox as number), sy + sh * .35, ow as number, sh * .27);
      ctx.fillStyle = ink(.4 * a); ctx.font = '9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
      ctx.fillText(lbl as string, sx + (ox as number) + (ow as number) / 2, sy + sh * .35 + sh * .13 + 4);
    });
    ctx.fillStyle = `rgba(200,200,240,${.45 * a})`; ctx.strokeStyle = ink(.18 * a); ctx.lineWidth = 1;
    ctx.fillRect(sx + 64, sy + sh * .27, sw - 128, sh * .08); ctx.strokeRect(sx + 64, sy + sh * .27, sw - 128, sh * .08);
    ctx.fillStyle = ink(.4 * a); ctx.font = '9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center'; ctx.fillText('SiO₂', cx2, sy + sh * .27 + sh * .04 + 4);
    ctx.fillStyle = `rgba(255,220,140,${.4 * a})`; ctx.strokeStyle = ink(.18 * a); ctx.lineWidth = 1;
    ctx.fillRect(sx + 64, sy + sh * .09, sw - 128, sh * .18); ctx.strokeRect(sx + 64, sy + sh * .09, sw - 128, sh * .18);
    ctx.fillStyle = ink(.45 * a); ctx.font = '10px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`gate  Vgs=${Vgs.toFixed(2)}V`, cx2, sy + sh * .18);
    const depthDepletionMax = sh * .15 * (Vgs / 1.5);
    ctx.fillStyle = `rgba(100,150,220,${.12 * a})`; ctx.fillRect(sx + 64, sy + sh * .35, sw - 128, depthDepletionMax);
    ctx.strokeStyle = `rgba(80,120,200,${.25 * a})`; ctx.lineWidth = 1; ctx.setLineDash([3, 2]);
    ctx.beginPath(); ctx.moveTo(sx + 64, sy + sh * .35 + depthDepletionMax); ctx.lineTo(sx + sw - 64, sy + sh * .35 + depthDepletionMax); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = ink(.25 * a); ctx.font = '8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
    ctx.fillText('depletion', cx2, sy + sh * .35 + depthDepletionMax + 10);
    if (on) {
      const ch = sh * .04 * chan;
      ctx.fillStyle = `rgba(100,180,255,${.3 * chan * a})`; ctx.fillRect(sx + 64, sy + sh * .35, sw - 128, ch);
      ctx.strokeStyle = `rgba(60,130,220,${.4 * a})`; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(sx + 64, sy + sh * .35); ctx.lineTo(sx + sw - 64, sy + sh * .35); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = ink(.38 * a); ctx.font = '9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
      ctx.fillText('inversion channel  e⁻→', cx2, sy + sh * .35 + ch + 12);
      const ne = Math.floor(5 * chan);
      for (let i = 0; i < ne; i++) {
        const ex = sx + 64 + ((i * 44 + t * (2.0 + i * 0.15)) % (sw - 128));
        const ey = sy + sh * .35 + 2 + (Math.sin(i * 7.3 + t * .08) * 2.5);
        ctx.fillStyle = `rgba(40,120,210,${.55 * a})`; ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = ink(.35 * a); ctx.font = '10px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
    ctx.fillText(on ? `Vgs=${Vgs.toFixed(2)}V > Vth=${Vth}V → channel OPEN` : `Vgs=${Vgs.toFixed(2)}V < Vth=${Vth}V → DEPLETED`, cx2, sy - 10);
    const bx = W * .65, by = H * .2, bw = W * .28, bh = H * .6;
    ctx.fillStyle = `rgba(248,248,250,${.85 * a})`; ctx.strokeStyle = ink(.12 * a); ctx.lineWidth = 1;
    ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = ink(.3 * a); ctx.font = '9px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center'; ctx.fillText('Band Diagram', bx + bw / 2, by - 5);
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
    ctx.fillStyle = `rgba(29,78,216,${.55 * a})`; ctx.font = '8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'right'; ctx.fillText('Ec', bx + bw - 4, by + bh * .25 - 3);
    ctx.fillStyle = `rgba(126,34,206,${.55 * a})`; ctx.fillText('Ev', bx + bw - 4, by + bh * .65 - 3);
    ctx.fillStyle = `rgba(180,83,9,${.5 * a})`; ctx.fillText('Ef', bx + bw - 4, by + bh * .45 - 3);
    if (on) { ctx.fillStyle = `rgba(40,120,210,${.4 * a})`; ctx.font = '8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center'; ctx.fillText('inversion', bx + bw / 2, by + bh * .32); }

    // ── Id-Vgs sweep curve (compact overlay under the MOSFET) ──
    const ivX = sx, ivY = sy + sh + 28, ivW = sw, ivH = 76;
    ctx.fillStyle = `rgba(248,248,250,${.85 * a})`; ctx.strokeStyle = ink(.12 * a); ctx.lineWidth = 1;
    ctx.fillRect(ivX, ivY, ivW, ivH); ctx.strokeRect(ivX, ivY, ivW, ivH);
    ctx.fillStyle = ink(.32 * a); ctx.font = '8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left';
    ctx.fillText('Id vs Vgs', ivX + 6, ivY + 11);
    ctx.fillStyle = ink(.22 * a); ctx.textAlign = 'right';
    ctx.fillText('Vth=' + Vth + 'V', ivX + ivW - 6, ivY + 11);
    // Axis tick marks (Vgs 0..2V on x, Id 0..max on y)
    const padL = 22, padR = 10, padT = 18, padB = 14;
    const plotX = ivX + padL, plotY = ivY + padT;
    const plotW = ivW - padL - padR, plotH = ivH - padT - padB;
    // Threshold line
    const vthX = plotX + (Vth / 2) * plotW;
    ctx.strokeStyle = `rgba(190,18,60,${.3 * a})`; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(vthX, plotY); ctx.lineTo(vthX, plotY + plotH); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = `rgba(190,18,60,${.45 * a})`; ctx.font = '7px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'center';
    ctx.fillText('Vth', vthX, plotY - 3);
    // Id curve (square law beyond Vth, ~0 below).
    const idAt = (vgs: number) => { const ov = Math.max(0, vgs - Vth); return ov * ov * .9; };
    const maxId = idAt(2);
    ctx.strokeStyle = `rgba(29,78,216,${.7 * a})`; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let px = 0; px <= plotW; px++) {
      const vgs = (px / plotW) * 2;
      const id = idAt(vgs);
      const py = plotY + plotH - (id / maxId) * plotH;
      px === 0 ? ctx.moveTo(plotX, py) : ctx.lineTo(plotX + px, py);
    }
    ctx.stroke();
    // Axis labels
    ctx.fillStyle = ink(.3 * a); ctx.font = '7px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'right';
    ctx.fillText('Id', plotX - 3, plotY + 6);
    ctx.textAlign = 'center';
    ctx.fillText('Vgs', plotX + plotW / 2, plotY + plotH + 11);
    // Live marker at current Vgs.
    const markX = plotX + (Vgs / 2) * plotW;
    const markY = plotY + plotH - (idAt(Vgs) / maxId) * plotH;
    ctx.strokeStyle = `rgba(29,78,216,${.25 * a})`; ctx.lineWidth = 1; ctx.setLineDash([1, 2]);
    ctx.beginPath(); ctx.moveTo(markX, plotY + plotH); ctx.lineTo(markX, markY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(plotX, markY); ctx.lineTo(markX, markY); ctx.stroke();
    ctx.setLineDash([]);
    // Marker glow
    const gr2 = ctx.createRadialGradient(markX, markY, 0, markX, markY, 9);
    gr2.addColorStop(0, `rgba(29,78,216,${.85 * a})`);
    gr2.addColorStop(.5, `rgba(29,78,216,${.25 * a})`);
    gr2.addColorStop(1, 'rgba(29,78,216,0)');
    ctx.fillStyle = gr2; ctx.beginPath(); ctx.arc(markX, markY, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(29,78,216,${.95 * a})`;
    ctx.beginPath(); ctx.arc(markX, markY, 2.5, 0, Math.PI * 2); ctx.fill();
    // Current readout
    ctx.fillStyle = ink(.45 * a); ctx.font = '8px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left';
    ctx.fillText('Id=' + idAt(Vgs).toFixed(2) + 'mA', markX + 6, markY - 4);

    ctx.restore();
  };
})();

// ── HERO_BG ──
// Desktop scene: wallpaper, menu bar, dock, windows, scattered desktop icons,
// and a prominent focal folder that grows with scroll — the "zoom into the machine" target.
let heroScroll = 0;
export function setHeroScroll(v: number) { heroScroll = v; }

// Hero icon hotspots — populated by HERO_BG init, queried by StackClient.
export type HeroHotspot = { idx: number; x: number; y: number; w: number; h: number; url: string; label: string };
let hotspotsFn: ((W: number, H: number, scrollY: number) => HeroHotspot[]) | null = null;
export function getHeroHotspots(W: number, H: number, scrollY: number): HeroHotspot[] {
  return hotspotsFn ? hotspotsFn(W, H, scrollY) : [];
}
let heroHover = -1;
export function setHeroHover(idx: number) { heroHover = idx; }
export function getHeroHover() { return heroHover; }

const HERO_BG = (() => {
  // Drafting-desk scene: warm graph-paper grid with faint ink schematic
  // doodles in the margins — the notebook hero card sits on top of it.
  // Static by design; the only motion is the camera dive StackClient
  // applies on scroll. No hotspots (hotspotsFn stays null), so the hero
  // links row is the single source of truth for resume/contact.
  const dk = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  function mosfet(ctx: Ctx, x: number, y: number, s: number) {
    ctx.beginPath();
    ctx.moveTo(x - s, y); ctx.lineTo(x - s * .25, y);
    ctx.moveTo(x - s * .25, y - s * .55); ctx.lineTo(x - s * .25, y + s * .55);
    ctx.moveTo(x, y - s * .6); ctx.lineTo(x, y + s * .6);
    ctx.moveTo(x, y - s * .5); ctx.lineTo(x + s * .55, y - s * .5); ctx.lineTo(x + s * .55, y - s);
    ctx.moveTo(x, y + s * .5); ctx.lineTo(x + s * .55, y + s * .5); ctx.lineTo(x + s * .55, y + s);
    ctx.stroke();
  }

  function resistor(ctx: Ctx, x: number, y: number, s: number) {
    const u = s / 8;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + u * 1.5, y);
    ctx.lineTo(x + u * 2, y - u); ctx.lineTo(x + u * 3, y + u);
    ctx.lineTo(x + u * 4, y - u); ctx.lineTo(x + u * 5, y + u);
    ctx.lineTo(x + u * 6, y - u); ctx.lineTo(x + u * 6.5, y);
    ctx.lineTo(x + u * 8, y);
    ctx.stroke();
  }

  function opamp(ctx: Ctx, x: number, y: number, s: number) {
    ctx.beginPath();
    ctx.moveTo(x, y - s * .6); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * .6); ctx.closePath();
    ctx.moveTo(x - s * .4, y - s * .3); ctx.lineTo(x, y - s * .3);
    ctx.moveTo(x - s * .4, y + s * .3); ctx.lineTo(x, y + s * .3);
    ctx.moveTo(x + s, y); ctx.lineTo(x + s * 1.4, y);
    ctx.stroke();
    ctx.font = `${Math.round(s * .32)}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('−', x + s * .08, y - s * .2);
    ctx.fillText('+', x + s * .08, y + s * .42);
  }

  function inverter(ctx: Ctx, x: number, y: number, s: number) {
    ctx.beginPath();
    ctx.moveTo(x, y - s * .5); ctx.lineTo(x + s * .85, y); ctx.lineTo(x, y + s * .5); ctx.closePath();
    ctx.moveTo(x - s * .35, y); ctx.lineTo(x, y);
    ctx.moveTo(x + s * 1.05, y); ctx.lineTo(x + s * 1.4, y);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x + s * .95, y, s * .1, 0, Math.PI * 2); ctx.stroke();
  }

  function dimension(ctx: Ctx, x: number, y: number, w: number) {
    ctx.beginPath();
    ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5);
    ctx.moveTo(x + w, y - 5); ctx.lineTo(x + w, y + 5);
    ctx.moveTo(x, y); ctx.lineTo(x + w, y);
    ctx.moveTo(x + 4, y - 2.5); ctx.lineTo(x, y); ctx.lineTo(x + 4, y + 2.5);
    ctx.moveTo(x + w - 4, y - 2.5); ctx.lineTo(x + w, y); ctx.lineTo(x + w - 4, y + 2.5);
    ctx.stroke();
  }

  function coffeeRing(ctx: Ctx, x: number, y: number, r: number) {
    ctx.beginPath(); ctx.arc(x, y, r, 0.2, Math.PI * 1.75); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 2, y + 1, r - 2.5, Math.PI * 0.6, Math.PI * 2.2); ctx.stroke();
  }

  return function draw(ctx: Ctx, W: number, H: number, a: number) {
    const dark = dk();
    ctx.save();
    ctx.globalAlpha = a;

    // Desk surface — a step darker than the hero paper so the card reads.
    ctx.fillStyle = dark ? '#17130e' : '#eee7d5';
    ctx.fillRect(0, 0, W, H);

    // Graph-paper grid: minor every 28px, major every 140px.
    const minor = dark ? 'rgba(236,229,214,0.05)' : 'rgba(154,143,110,0.15)';
    const major = dark ? 'rgba(236,229,214,0.10)' : 'rgba(154,143,110,0.26)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= W; gx += 28) {
      ctx.strokeStyle = gx % 140 === 0 ? major : minor;
      ctx.beginPath(); ctx.moveTo(gx + .5, 0); ctx.lineTo(gx + .5, H); ctx.stroke();
    }
    for (let gy = 0; gy <= H; gy += 28) {
      ctx.strokeStyle = gy % 140 === 0 ? major : minor;
      ctx.beginPath(); ctx.moveTo(0, gy + .5); ctx.lineTo(W, gy + .5); ctx.stroke();
    }

    // Ink doodles — kept out of the terminal panel (right 340px on desktop)
    // and mostly clear of the hero card, which occupies the left ~680px.
    const rEdge = W > 900 ? W - 340 : W;
    const ink = dark ? 'rgba(207,198,178,0.32)' : 'rgba(107,95,67,0.38)';
    const inkDim = dark ? 'rgba(207,198,178,0.18)' : 'rgba(107,95,67,0.22)';
    const stain = dark ? 'rgba(201,169,122,0.10)' : 'rgba(176,105,58,0.14)';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const label = (txt: string, x: number, y: number) => {
      ctx.fillStyle = inkDim;
      ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(txt, x, y);
    };

    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 1.2;
    mosfet(ctx, rEdge - 130, H * .24, 26);
    label('fig. 2 — nmos, Vth ≈ 1.1 V', rEdge - 172, H * .24 + 48);

    ctx.strokeStyle = ink; ctx.fillStyle = ink;
    opamp(ctx, rEdge - 150, H * .56, 30);
    label('fig. 3 — gm/ID', rEdge - 152, H * .56 + 34);

    ctx.strokeStyle = ink;
    resistor(ctx, rEdge - 260, H * .8, 64);
    label('R = V / I', rEdge - 244, H * .8 + 22);

    ctx.strokeStyle = ink;
    inverter(ctx, Math.max(90, W * .08), H * .12, 22);
    label('fig. 1 — inverter', Math.max(90, W * .08) - 12, H * .12 + 28);

    ctx.strokeStyle = inkDim;
    dimension(ctx, Math.max(80, W * .07), H * .88, 52);
    label('45 nm', Math.max(80, W * .07) + 14, H * .88 - 8);

    ctx.strokeStyle = stain; ctx.lineWidth = 3.5;
    coffeeRing(ctx, rEdge - 60, H * .1, 24);

    ctx.restore();
  };
})();

export type DrawFn = (ctx: Ctx, W: number, H: number, a: number) => void;
export const DRAWFNS: Record<number, DrawFn> = { 0: HERO_BG, 7: L7, 6: L6, 5: L5, 4: L4, 3: L3, 2: L2, 1: L1 };
export { drawGrid };

// Setters for mutable module-level state (exported lets are read-only via namespace imports)
export function setL4Hov(v: number) { L4_hov = v; }
export function setL2Inputs(a: number, b: number) { L2_A = a; L2_B = b; L2_A_locked = true; }
