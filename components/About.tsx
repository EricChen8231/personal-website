"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import SectionHeading from "./SectionHeading";

export default function About() {
  return (
    <section id="about" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="About Me" subtitle="A bit about who I am" />

        <div className="grid gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="space-y-4 text-muted leading-relaxed"
          >
            <p>
              I&apos;m Eric Chen, a Progressive Degree student at the University of
              Southern California pursuing an M.S. in Electrical Engineering
              and a B.S. in Computer Engineering &amp; Computer Science
              (graduating May 2027).
            </p>
            <p>
              My work spans the full stack — from building REST APIs and
              real-time web applications to designing synchronous RTL
              architectures on FPGAs and exploring out-of-order
              microarchitectures with gem5. I&apos;m passionate about the
              intersection of software and silicon.
            </p>
            <p>
              Outside of engineering, I&apos;m fluent in Mandarin, AutoCAD
              Certified, and love to gym and lift heavy things. I also love
              to eat! Add me on beli @echen823
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-xl border border-card-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-light">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">
                    University of Southern California
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    M.S. Electrical Engineering
                  </p>
                  <p className="text-sm text-muted">
                    B.S. Computer Engineering &amp; Computer Science
                  </p>
                  <p className="mt-2 text-xs text-accent-light">
                    Aug 2023 – May 2027 &middot; Los Angeles, CA
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
