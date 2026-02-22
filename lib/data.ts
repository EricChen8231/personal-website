export interface Experience {
  title: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
}

export interface Project {
  title: string;
  tech: string[];
  date: string;
  description: string;
  bullets: string[];
  category: "software" | "hardware";
  github?: string;
  live?: string;
}

export interface SkillCategory {
  label: string;
  skills: string[];
}

export const experiences: Experience[] = [
  {
    title: "Technology Intern",
    company: "MUJI USA",
    location: "New York, NY",
    period: "May 2025 – Aug 2025",
    bullets: [
      "Built REST APIs to sync e-commerce orders with the WMS; cut p95 order-sync latency by 42% across NYC stores.",
      "Optimized inventory/allocations tables and queries, making reports 3.1x faster and cutting p99 latency 61%.",
      "Built idempotent verification checks; improved online-warehouse consistency and cut leftover stock.",
      "Built daily data integrity jobs (diff scans, duplicates); prevented 1.3k+ bad records/month from reaching reports.",
    ],
  },
  {
    title: "Course Producer — CS353 (Networking)",
    company: "University of Southern California",
    location: "Los Angeles, CA",
    period: "Spring 2026",
    bullets: [
      "Hold weekly office hours supporting students with socket programming and protocol stack debugging.",
      "Debug student C/C++ networking code, diagnosing issues in concurrent and low-level socket programs.",
      "Clarify lecture concepts spanning TCP/IP, routing, and reliable transport during mentoring sessions.",
    ],
  },
  {
    title: "Tutor",
    company: "Step Up Tutoring",
    location: "Los Angeles, CA",
    period: "Sep 2025 – Dec 2025",
    bullets: [
      "Tutor K-8 students in math and science, using interactive modules to build problem-solving fluency.",
      "Create adaptive problem sets that reinforce foundational STEM skills and track mastery over time.",
    ],
  },
  {
    title: "Fellow — 2-week FinTech Build Sprint",
    company: "Fintech Focus",
    location: "Remote",
    period: "Jul 2023",
    bullets: [
      "Built 2 Flask MVPs end-to-end — DB models, REST APIs, UIs; shipped in 10 days and onboarded 30+ pilots.",
      "Improved usability across two prototype cycles; cut time to complete the core task by 28% in testing.",
      "Delivered a live demo and Q&A to 150 peers/mentors, summarizing test results and the next-iteration roadmap.",
    ],
  },
];

export const softwareProjects: Project[] = [
  {
    title: "SFT for Code Generation",
    tech: ["Python", "C++", "Go"],
    date: "In Progress",
    category: "software",
    description:
      "Supervised fine-tuning of an LLM for code generation using gold-standard demonstrations from open-source projects.",
    bullets: [
      "Curating gold-standard code demonstrations from open-source repositories across Python, C++, and Go.",
      "Fine-tuning a language model with supervised learning to improve code generation quality and correctness.",
    ],
  },
  {
    title: "Game Resource Detection System",
    tech: ["Python", "PyTorch", "YOLOv11", "OpenCV"],
    date: "Jul 2025",
    category: "software",
    description:
      "Real-time in-game resource detection using a custom-trained YOLOv11 model deployed as an overlay.",
    bullets: [
      "Built and annotated a custom dataset in Roboflow to train YOLOv11 for detecting in-game resources.",
      "Applied preprocessing and augmentation with OpenCV and NumPy to improve detection robustness.",
      "Trained YOLOv11 in PyTorch, achieving real-time performance suitable for automation workflows.",
      "Deployed the model as an in-game overlay for real-time recognition and automated repetitive tasks.",
    ],
  },
  {
    title: "Makeshift Router",
    tech: ["C++", "POSIX Threads", "Sockets"],
    date: "Apr 2025",
    category: "software",
    description:
      "Multi-threaded router simulation with message forwarding, routing, and a layered protocol stack.",
    bullets: [
      "Constructed a router simulation with message forwarding, routing, and TTL handling.",
      "Implemented multi-threaded message handling to support concurrent packet processing.",
      "Designed a layered protocol stack with node-based routing, checksums, and dynamic table updates.",
      "Simulated realistic behavior using timers for packet timeouts and custom logs.",
    ],
  },
  {
    title: "Rankify",
    tech: ["React", "Node.js", "Java", "SQL", "WebSockets"],
    date: "Dec 2024",
    category: "software",
    description:
      "Social web app integrating the Spotify API for ranking songs, real-time chatrooms, and leaderboards.",
    bullets: [
      "Developed a social web app integrating the Spotify API for users to rank songs and interact with friends.",
      "Implemented song previews, rating system, user profiles, and leaderboards for top tracks.",
      "Built authentication with login, registration, and password recovery using Node.js and SQL.",
      "Added real-time chatrooms via WebSockets with a multithreaded Java backend.",
    ],
  },
];

export const hardwareProjects: Project[] = [
  {
    title: "Battleship on FPGA with VGA Output",
    tech: ["Verilog", "Nexys A7", "Vivado"],
    date: "Spring 2025",
    category: "hardware",
    description:
      "Fully synchronous Battleship game implemented in RTL at 100 MHz on Xilinx Artix-7, displayed via VGA.",
    bullets: [
      "Implemented a Battleship game as a fully synchronous RTL architecture operating at 100 MHz on Xilinx Artix-7 FPGA.",
      "Drove a VGA monitor for real-time game display, handling pixel timing and frame rendering in hardware.",
      "Partitioned datapath and control; implemented parameterized FSMs with deterministic state transitions.",
      "Developed a self-checking testbench and achieved timing closure with positive slack via static timing analysis.",
    ],
  },
  {
    title: "CMOS Standard Cell Design & Verification",
    tech: ["Cadence Virtuoso", "SPICE"],
    date: "Spring 2026",
    category: "hardware",
    description:
      "Full-custom CMOS inverter, NAND, and NOR cell layout with DRC/LVS verification.",
    bullets: [
      "Designed and laid out CMOS inverter, NAND, and NOR cells in a scaled PDK environment.",
      "Ran transient and DC SPICE simulations to extract propagation delay, rise/fall time, and dynamic power.",
      "Performed DRC and LVS verification and characterized post-layout parasitic effects on timing.",
      "Evaluated transistor sizing trade-offs (W/L scaling) for performance and power optimization.",
    ],
  },
  {
    title: "Out-of-Order Microarchitecture (gem5)",
    tech: ["gem5", "RISC-V", "O3CPU"],
    date: "Spring 2026",
    category: "hardware",
    description:
      "Design-space exploration of O3 core under 300M transistor and 30 mm² area constraints using gem5.",
    bullets: [
      "Configured gem5 for RISC-V and explored O3 core design under 300M transistor and 30 mm² area constraints.",
      "Swept issue width, branch predictor size, BTB entries, LSQ depth, functional units, and cache hierarchy parameters.",
      "Measured MIPS from simInsts/simSeconds across control-flow, memory-bound, and dependency-heavy benchmarks.",
      "Identified pipeline utilization bottlenecks, memory stalls, and cache miss patterns to guide configuration decisions.",
    ],
  },
  {
    title: "Branch Predictor Design",
    tech: ["C++", "Intel Pin Tool"],
    date: "Spring 2026",
    category: "hardware",
    description:
      "Implemented and profiled 4 branch predictor designs across 50M dynamic branches.",
    bullets: [
      "Implemented Always-Taken, Global, Bimodal, and Correlated predictors in C++ instrumented via Intel Pin.",
      "Profiled 5×10⁷ dynamic branches and characterized misprediction rates across benchmark workloads.",
      "Quantified the storage overhead vs. control hazard mitigation trade-off for each predictor design.",
    ],
  },
];

export const skillCategories: SkillCategory[] = [
  {
    label: "Languages",
    skills: ["Python", "C++", "Java", "JavaScript", "TypeScript", "SQL", "Verilog"],
  },
  {
    label: "Frameworks & Libraries",
    skills: ["React", "Node.js", "Express", "Flask", "PyTorch", "OpenCV", "NumPy", "WebSockets"],
  },
  {
    label: "Systems & Tools",
    skills: ["Linux", "Git", "Docker", "GDB", "POSIX Threads", "Sockets", "Vivado", "Cadence", "Wireshark"],
  },
  {
    label: "EDA & Simulation",
    skills: ["gem5", "Intel Pin", "ModelSim", "SPICE"],
  },
  {
    label: "Databases & Cloud",
    skills: ["PostgreSQL", "MySQL", "Google Cloud Platform"],
  },
];

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

export const socials = {
  github: "https://github.com/ericchen8231",
  linkedin: "https://linkedin.com/in/ericchen823",
  email: "echen823@usc.edu",
};
