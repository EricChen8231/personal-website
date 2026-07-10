import StackClient from '@/components/StackClient';

const MONO = "var(--font-mono, 'Courier New', monospace)";

const STACK_ROWS = [
  ['L7', 'Application', 'end-to-end APIs · ML pipelines · CUDA inference'],
  ['L6', 'Network',     'TCP/IP · routing protocols · raw packet I/O'],
  ['L5', 'Compiler',    'C · C++ · Rust · Python · TypeScript · RISC-V ASM'],
  ['L4', 'Arch',        'OoO pipelines · branch prediction · gem5 research'],
  ['L3', 'RTL',         'Verilog · FPGA · Artix-7 · 100 MHz timing closure'],
  ['L2', 'Circuit',     'CMOS cells · Cadence Virtuoso · SPICE extraction'],
  ['L1', 'Physics',     '45nm MOSFET · Vth · gm/ID methodology'],
] as const;

const HERO_TAGS = [
  'C / C++', 'CUDA', 'Python', 'SystemVerilog', 'TypeScript', 'RISC-V', 'Verilog',
];

export default function Page() {
  return (
    <>
      <StackClient />
      <div id="content">

        {/* ── HERO (editorial lab-notebook page) ── */}
        <section id="hero">
          <div className="hero-page">
            <div className="hero-page-head">
              <span>Field notes — portfolio</span>
              <span>L1 → L7</span>
            </div>

            <div className="hero-page-body">
              <div className="hero-eyebrow">Entry · Summer 2026</div>

              <div className="hero-name-row">
                <h1 className="hero-name">Eric Chen</h1>
                <div className="hero-margin-note">
                  <div className="note-hire">← available for full-time</div>
                  <div className="note-loc">Los Angeles, CA</div>
                </div>
              </div>

              <div className="hero-tagline">
                From 45nm CMOS cells to production APIs.
              </div>
              <div className="hero-meta">USC Viterbi · B.S. CECS · M.S. EE</div>

              <div className="hero-divider" />

              <div className="hero-skills">{HERO_TAGS.join(' · ')}</div>

              {/* Quick links — always-visible escape hatch, no scrolling or terminal required */}
              <div className="hero-links">
                <a href="/personal-website/resume.pdf" target="_blank" rel="noopener noreferrer">Resume</a>
                <span className="sep">—</span>
                <a href="mailto:echen823@usc.edu">Email</a>
                <span className="sep">—</span>
                <a href="https://linkedin.com/in/ericchen823" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <span className="sep">—</span>
                <a href="https://github.com/ericchen8231" target="_blank" rel="noopener noreferrer">GitHub</a>
              </div>

              <div className="hero-prompt">
                <span className="prompt-pct">%</span>
                <span id="hero-cmd" /><span id="hero-cursor-el" />
              </div>
            </div>

            <div className="hero-page-foot">
              <span className="scroll-hint">continue reading ↓</span>
              <span>fig. 1 — system overview</span>
            </div>
          </div>
        </section>

        {/* ── NOW ── */}
        <section className="section" id="sec-now">
          <div className="section-inner">
            <div className="layer-tag">Now — <span>Current Work</span></div>
            <div className="section-title">What I&apos;m building</div>
            <div className="section-sub">summer 2026</div>
            <div className="project-list">
              <div className="project-item">
                <div className="project-name">Development Tools SWE Graduate Intern — Intel</div>
                <div className="project-tech">Python · Cadence Virtuoso · EDA</div>
                <div className="project-desc">Developing graph-based algorithms to convert Cadence netlist outputs into structured connectivity features. Engineered global-histogram features and random forest models to predict layer assignments, with automated design-rule checks validating predictions against layout-derived ground truth.</div>
              </div>
              <div className="project-item">
                <div className="project-name">AI Engineer Fellow — Handshake AI</div>
                <div className="project-tech">Python · PyTorch · Docker · CI/CD</div>
                <div className="project-desc">Fine-tuning LLMs for code generation via supervised learning on open-source codebases. Curating gold-standard demonstrations for functional correctness and multi-file reasoning, evaluating outputs against benchmarks, and building CI/CD pipelines for autonomous regression testing across model versions.</div>
              </div>
              <div className="project-item">
                <div className="project-name">Parallel MCCFR — NLH Poker Solver</div>
                <div className="project-tech">CUDA C++ · cuRAND · OpenMP · MPI · A100 GPUs</div>
                <div className="project-desc">Poker AI approximating Nash equilibrium via Monte Carlo CFR self-play and Linear CFR+ (the algorithm behind Pluribus). Ported to CUDA C++ for 65k simultaneous games per A100 kernel — high-throughput parallel self-play. Live-play bot with hash-based strategy lookup for sub-microsecond decision latency.</div>
                <a href="https://github.com/ericchen8231/cuda-mccfr" target="_blank" rel="noopener noreferrer" className="project-link">github ↗</a>
              </div>
              <div className="project-item">
                <div className="project-name">This site</div>
                <div className="project-tech">Next.js · TypeScript · Canvas · Zero dependencies</div>
                <div className="project-desc">Iterating on a portfolio that visualizes every layer from transistor to API — each section has a live animation that shows what&apos;s actually happening at that abstraction level.</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'var(--text4)', fontFamily: MONO }}>open to:</span>
              <span className="tag active">Systems Eng</span>
              <span className="tag active">Hardware Design</span>
              <span className="tag active">ML Infra</span>
              <span className="tag">Research roles</span>
            </div>
          </div>
        </section>

        {/* ── L7 ── */}
        <section className="section" id="sec-l7" data-layer="7">
          <div className="section-inner">
            <div className="layer-tag">L7 — <span>Application Layer</span></div>
            <div className="section-title">Software Engineering</div>
            <div className="section-sub">where humans meet systems</div>
            <div className="section-desc">Production APIs, end-to-end apps, and ML pipelines — the surface where commands enter the machine.</div>
            <div className="project-list">
              <div className="project-item">
                <div className="project-name">MUJI USA — Technology Intern, 2025</div>
                <div className="project-tech">Python · REST APIs · PostgreSQL · WMS Integration</div>
                <div className="project-desc">Built REST APIs syncing e-commerce orders with the WMS — cut p95 order-sync latency 42% across NYC stores. Optimized inventory/allocations queries (3.1× faster, 61% p99 cut). Built idempotent consistency checks and daily data integrity jobs that blocked 1.3k+ bad records/month.</div>
              </div>
              <div className="project-item">
                <div className="project-name">Rankify</div>
                <div className="project-tech">React · Node.js · Java · SQL · WebSockets</div>
                <div className="project-desc">Social web app to rank Spotify songs with friends. Real-time chatrooms via WebSockets with a multithreaded Java backend, rating system, leaderboards, and full auth flow.</div>
              </div>
              <div className="project-item">
                <div className="project-name">Game Resource Detection — YOLOv11</div>
                <div className="project-tech">Python · PyTorch · YOLOv11 · OpenCV · NumPy</div>
                <div className="project-desc">Annotated a custom multi-class dataset in Roboflow and fine-tuned YOLOv11 for in-game resource detection. Built an OpenCV/NumPy augmentation pipeline (HSV jitter, mosaic, blur) to harden rare-class accuracy, trained with mixed-precision and tuned anchors for real-time inference at native resolution. Packaged as a multi-threaded screen-capture overlay with non-blocking inference for live automated detection.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── L6 ── */}
        <section className="section" id="sec-l6" data-layer="6">
          <div className="section-inner">
            <div className="layer-tag">L6 — <span>Network Layer</span></div>
            <div className="section-title">Systems &amp; Networking</div>
            <div className="section-sub">where bits find their destination</div>
            <div className="section-desc">Packets, protocols, and the infrastructure connecting systems. Built from scratch to understand what abstractions hide.</div>
            <div className="project-list">
              <div className="project-item">
                <div className="project-name">Makeshift Router</div>
                <div className="project-tech">C++ · POSIX Threads · Sockets · Network Protocol Design</div>
                <div className="project-desc">Multi-threaded router simulation handling concurrent packet forwarding, routing, and TTL expiration. Layered protocol stack with checksums, distance-vector routing, and dynamic table updates — socket-based IPC for inter-node communication with custom serialization and timeout handling.</div>
              </div>
              <div className="project-item">
                <div className="project-name">Course Producer, CS353 — USC</div>
                <div className="project-tech">TCP/IP · Routing Protocols · Sockets · Threads</div>
                <div className="project-desc">Mentoring students in Intro to Networking through weekly tutoring hours — structured feedback on algorithms and code quality. Collaborating with course staff on routing protocols (BGP, OSPF, RIP) and socket programming curriculum. Office hours for 80+ students.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── L5 ── */}
        <section className="section" id="sec-l5" data-layer="5">
          <div className="section-inner">
            <div className="layer-tag">L5 — <span>Compilation Layer</span></div>
            <div className="section-title">Languages &amp; Toolchains</div>
            <div className="section-sub">where intent becomes instruction</div>
            <div className="section-desc">The bridge between human-readable source and machine-executable binary — lex, parse, IR, optimize, codegen.</div>
            <div className="project-list">
              <div className="project-item">
                <div className="project-name">Systems &amp; Low-Level</div>
                <div className="project-tech">C · C++ · Rust · x86-64 ASM · RISC-V ASM</div>
                <div className="project-desc">Manual memory, ownership models, and writing code where the compiler output actually matters. From POSIX sockets to bare-metal startup code.</div>
              </div>
              <div className="project-item">
                <div className="project-name">Hardware Description</div>
                <div className="project-tech">SystemVerilog · Verilog · VHDL</div>
                <div className="project-desc">RTL design and simulation — clocked pipelines, FSMs, and standard cell synthesis. Targeting FPGAs and ASIC flows.</div>
              </div>
              <div className="project-item">
                <div className="project-name">Scripting &amp; Web</div>
                <div className="project-tech">Python · JavaScript · TypeScript · Bash</div>
                <div className="project-desc">Python for tooling, ML pipelines, and simulation scripting. TypeScript/Next.js for end-to-end apps. Bash for everything that should have been automated already.</div>
              </div>
              <div className="project-item">
                <div className="project-name">Intel Pin Instrumentation</div>
                <div className="project-tech">Intel Pin · C++ · x86 ISA</div>
                <div className="project-desc">Binary instrumentation for instruction-level profiling. Used for microarchitecture analysis in gem5 branch predictor research.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── L4 ── */}
        <section className="section" id="sec-l4" data-layer="4">
          <div className="section-inner">
            <div className="layer-tag">L4 — <span>Computer Architecture</span></div>
            <div className="section-title">Microarchitecture</div>
            <div className="section-sub">where instructions become computation</div>
            <div className="section-desc">Out-of-order pipelines, branch prediction, cache hierarchies — the machinery that executes the ISA faster than the ISA specifies.</div>
            <div className="project-list">
              <div className="project-item">
                <div className="project-name">gem5 Branch Predictor Research</div>
                <div className="project-tech">gem5 · C++ · Python · SPEC CPU</div>
                <div className="project-desc">Implemented TAGE-SC-L branch predictor. Analyzed prediction accuracy and IPC sensitivity across SPEC benchmarks.</div>
              </div>
              <div className="project-item">
                <div className="project-name">Microarchitecture Analysis</div>
                <div className="project-tech">C++ · Perf · Hardware Counters</div>
                <div className="project-desc">Cache miss rates, branch misprediction penalties, IPC characterization using hardware performance counters.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── L3 ── */}
        <section className="section" id="sec-l3" data-layer="3">
          <div className="section-inner">
            <div className="layer-tag">L3 — <span>RTL / Digital Logic</span></div>
            <div className="section-title">FPGA &amp; HDL Design</div>
            <div className="section-sub">where logic becomes hardware</div>
            <div className="section-desc">Clocked state machines, synchronous pipelines, and digital logic running at real frequencies on real programmable silicon.</div>
            <div className="project-list">
              <div className="project-item">
                <div className="project-name">FPGA Battleship at 100 MHz</div>
                <div className="project-tech">Verilog · Artix-7 · Vivado · VGA</div>
                <div className="project-desc">Multi-FSM design: game logic, VGA controller (640×480), PS/2 keyboard. All timing constraints met at 100 MHz on Artix-7.</div>
              </div>
              <div className="project-item">
                <div className="project-name">Digital Design Coursework</div>
                <div className="project-tech">SystemVerilog · Vivado · ModelSim</div>
                <div className="project-desc">Pipelined ALU, UART, synchronous FIFO, clock domain crossing. Timing closure and functional simulation.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── L2 ── */}
        <section className="section" id="sec-l2" data-layer="2">
          <div className="section-inner">
            <div className="layer-tag">L2 — <span>Circuit Design</span></div>
            <div className="section-title">Analog &amp; Mixed-Signal</div>
            <div className="section-sub">where parallelism beats the ripple</div>
            <div className="section-desc">Carry-lookahead adder. All four carries precomputed in parallel from per-bit propagate (P) and generate (G) signals — addition resolves in ~4 gate delays regardless of bit width, instead of waiting for the carry to ripple through one bit at a time.</div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 14, background: 'var(--bg2)' }}>
              <div style={{ fontSize: 10, color: 'var(--text4)', fontFamily: MONO, letterSpacing: 1, marginBottom: 9 }}>TRY THE ADDER →</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 9, color: 'var(--text4)', fontFamily: MONO }}>A (0–15)</span>
                  <input id="l2-a" type="number" min={0} max={15} defaultValue={6}
                    style={{ width: 60, padding: '5px 8px', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 12, fontFamily: MONO, background: 'var(--card)', color: 'var(--text)' }} />
                </div>
                <div style={{ fontSize: 18, color: 'var(--text3)', paddingTop: 14 }}>+</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 9, color: 'var(--text4)', fontFamily: MONO }}>B (0–15)</span>
                  <input id="l2-b" type="number" min={0} max={15} defaultValue={5}
                    style={{ width: 60, padding: '5px 8px', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 12, fontFamily: MONO, background: 'var(--card)', color: 'var(--text)' }} />
                </div>
                <div style={{ paddingTop: 14, fontSize: 12, color: 'var(--text3)', fontFamily: MONO }}>=</div>
                <div id="l2-result" style={{ paddingTop: 14, fontSize: 13, fontFamily: MONO, color: 'var(--text)', fontWeight: 600 }} />
              </div>
              <div id="l2-binary" style={{ marginTop: 8, fontSize: 10, fontFamily: MONO, color: 'var(--text3)', lineHeight: 1.8 }} />
            </div>
            <div className="project-list">
              <div className="project-item">
                <div className="project-name">CMOS Standard Cell Library</div>
                <div className="project-tech">SPICE · Cadence · TSMC 45nm PDK</div>
                <div className="project-desc">Full standard cell library: NAND, NOR, XOR, D flip-flop, full adder. Extracted parasitics, verified timing arcs.</div>
              </div>
              <div className="project-item">
                <div className="project-name">Systolic Array</div>
                <div className="project-tech">Cadence Virtuoso · SPICE · Custom IC</div>
                <div className="project-desc">Designed for matrix multiplication. Matrix A flows east, B flows south, each PE performs a MAC — same dataflow as Google&apos;s TPU. Full custom IC in Cadence Virtuoso: schematic, layout, DRC/LVS, parasitic extraction, post-layout timing.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── L1 ── */}
        <section className="section" id="sec-l1" data-layer="1">
          <div className="section-inner">
            <div className="layer-tag">L1 — <span>Transistor Physics</span></div>
            <div className="section-title">Semiconductor Devices</div>
            <div className="section-sub">where physics becomes computation</div>
            <div className="section-desc">Drift-diffusion, inversion layers, threshold voltage — the physics making every abstraction above possible.</div>
            <div className="project-list">
              <div className="project-item">
                <div className="project-name">MOSFET Characterization</div>
                <div className="project-tech">SPICE · Device Physics</div>
                <div className="project-desc">NMOS/PMOS characterization: Vth extraction, gm/ID design methodology, short-channel effects, velocity saturation.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── INTERESTS ── */}
        <section className="section" id="sec-interests">
          <div className="section-inner">
            <div className="layer-tag" style={{ color: 'var(--text3)' }}>Personal — <span>Interests</span></div>
            <div className="section-title">Outside the lab</div>
            <div className="section-sub">the non-technical side</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              <div className="project-item">
                <div className="project-name">Poker — NLH &amp; PLO4</div>
                <div className="project-desc" style={{ fontSize: 12, marginTop: 4 }}>Working through GTO solver outputs (GTOWizard) and range construction. The PLO4 constraint rewards combinatorial thinking. Jane Street puzzle energy.</div>
              </div>
              <div className="project-item">
                <div className="project-name">Puzzles &amp; Problem Sets</div>
                <div className="project-desc" style={{ fontSize: 12, marginTop: 4 }}>Jane Street monthly puzzles, competitive programming, and the occasional AoC. Enjoy problems where the elegant solution is orders of magnitude faster than brute force.</div>
              </div>
              <div className="project-item">
                <div className="project-name">The Showdown — Live Tournament</div>
                <div className="project-desc" style={{ fontSize: 12, marginTop: 4 }}>Recently attended The Showdown poker tournament. Live poker adds a layer the solvers can&apos;t fully capture — physical tells, table dynamics, real-time range adjustments under pressure.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', position: 'relative', zIndex: 5 }}>
          <div style={{ textAlign: 'center', maxWidth: 560, width: '100%' }}>

            {/* Layer summary */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px', marginBottom: 40, textAlign: 'left' }}>
              <div style={{ fontSize: 9, color: 'var(--text4)', fontFamily: MONO, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                7-layer execution trace
              </div>
              {STACK_ROWS.map(([id, name, desc]) => (
                <div key={id} style={{ display: 'flex', gap: 10, padding: '4px 0', borderBottom: '1px solid var(--border2)', fontFamily: MONO }}>
                  <span style={{ fontSize: 9, color: 'var(--text4)', width: 18, flexShrink: 0 }}>{id}</span>
                  <span style={{ fontSize: 10, color: 'var(--text2)', width: 74, flexShrink: 0 }}>{name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{desc}</span>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text4)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 18 }}>
              End of trace
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--text)', letterSpacing: -1, marginBottom: 10 }}>
              Let&apos;s build something.
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 30, lineHeight: 1.7 }}>
              From bare silicon to production.
            </div>
            <div style={{ display: 'flex', gap: 9, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="mailto:echen823@usc.edu"
                style={{ color: 'var(--text)', textDecoration: 'none', fontSize: 12, border: '1px solid var(--border2)', padding: '9px 20px', borderRadius: 6, fontFamily: MONO }}>
                echen823@usc.edu ↗
              </a>
              <a href="https://linkedin.com/in/ericchen823" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: 12, border: '1px solid var(--border)', padding: '9px 20px', borderRadius: 6, fontFamily: MONO }}>
                linkedin ↗
              </a>
              <a href="https://github.com/ericchen8231" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: 12, border: '1px solid var(--border)', padding: '9px 20px', borderRadius: 6, fontFamily: MONO }}>
                github ↗
              </a>
              <a href="/personal-website/resume.pdf" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: 12, border: '1px solid var(--border)', padding: '9px 20px', borderRadius: 6, fontFamily: MONO }}>
                resume ↗
              </a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
