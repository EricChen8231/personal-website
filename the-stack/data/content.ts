export const LAYERS = [
  { id: 7, name: 'Application', sec: 'sec-l7' },
  { id: 6, name: 'Network',     sec: 'sec-l6' },
  { id: 5, name: 'Compilation', sec: 'sec-l5' },
  { id: 4, name: 'Architecture',sec: 'sec-l4' },
  { id: 3, name: 'RTL / Digital',sec: 'sec-l3' },
  { id: 2, name: 'Circuit',      sec: 'sec-l2' },
  { id: 1, name: 'Transistor',   sec: 'sec-l1' },
] as const;

export type LayerEntry = [string, string];

export const TLOGS: Record<number, LayerEntry[]> = {
  7: [
    ['<span class="t-dim">% </span><span class="t-cmd">node server.js</span>', ''],
    ['[app] :8080 ready', 't-ok'],
    ['GET /inventory → 200 18ms', 't-info'],
    ['[cache] Redis HIT sku:900', 't-dim'],
    ['POST /orders → 201 31ms', 't-info'],
    ['[db] SELECT sku WHERE id=? 2ms', 't-dim'],
  ],
  6: [
    ['<span class="t-dim">% </span><span class="t-cmd">traceroute 10.0.1.1</span>', ''],
    ['TCP SYN → 10.0.1.1:443', 't-info'],
    ['SYN-ACK ← RTT 0.4ms', 't-ok'],
    ['1  gateway  0.4ms TTL=63', 't-dim'],
    ['2  core-router  1.2ms TTL=62', 't-dim'],
    ['3  10.0.1.1  2.8ms ✓', 't-ok'],
  ],
  5: [
    ['<span class="t-dim">% </span><span class="t-cmd">clang -O2 main.c -o main</span>', ''],
    ['lex: 847 tokens', 't-info'],
    ['parse: 312 AST nodes', 't-dim'],
    ['opt: DCE, LICM, inlining', 't-dim'],
    ['codegen: 680 x86-64 instrs', 't-ok'],
    ['14.2KB  0.31s', 't-dim'],
  ],
  4: [
    ['<span class="t-dim">% </span><span class="t-cmd">perf stat ./workload</span>', ''],
    ['IF: LOAD r4,[rbp-8]', 't-info'],
    ['EX: ALU add → 0x005A', 't-dim'],
    ['ROB commit: r1←0x5A r4←0x2C', 't-ok'],
    ['IPC: 3.12  br.miss: 1.2%', 't-info'],
    ['L1 miss: 0.8%  L2: 0.1%', 't-dim'],
  ],
  3: [
    ['<span class="t-dim">% </span><span class="t-cmd">vivado -source synth.tcl</span>', ''],
    ['posedge clk t=100ns', 't-info'],
    ['FSM: IDLE→EXECUTE', 't-dim'],
    ['Q[7:0]←0x5A  WNS=+0.42ns', 't-ok'],
    ['EXECUTE→WRITEBACK', 't-info'],
    ['util LUT:38% FF:22%', 't-dim'],
  ],
  2: [
    ['<span class="t-dim">% </span><span class="t-cmd">ngspice inverter.sp</span>', ''],
    ['Vin rising... 0.9V < Vth', 't-dim'],
    ['Vgs=1.3V > Vth=1.1V — ON', 't-warn'],
    ['NMOS: Id=0.48mA saturation', 't-info'],
    ['Vout = 0.05V (LOW)', 't-ok'],
    ['Pdyn = CL·Vdd²·f = 1.2μW', 't-dim'],
  ],
  1: [
    ['<span class="t-dim">% </span><span class="t-cmd">hspice mosfet.sp</span>', ''],
    ['Vgs=1.3V Vth=1.1V', 't-info'],
    ['inversion layer forming', 't-dim'],
    ['e⁻ drift: μn·E = 1.2×10⁵ m/s', 't-dim'],
    ['Id = W/L·μn·Cox·(Vgs-Vth)²/2', 't-ok'],
    ['▓ bare silicon ▓', 't-warn'],
  ],
};
