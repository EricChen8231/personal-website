"use client";

import { motion } from "framer-motion";
import type { Experience } from "@/lib/data";

export default function TimelineItem({
  experience,
  index,
}: {
  experience: Experience;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative pl-8 before:absolute before:left-0 before:top-0 before:h-full before:w-px before:bg-card-border"
    >
      <div className="absolute left-0 top-1 h-2.5 w-2.5 -translate-x-[calc(50%-0.5px)] rounded-full border-2 border-accent bg-background" />
      <div className="rounded-xl border border-card-border bg-card p-6 transition-colors hover:border-accent/30 hover:bg-card-hover">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold">{experience.title}</h3>
          <span className="text-xs text-accent-light">
            {experience.period}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {experience.company} &middot; {experience.location}
        </p>
        <ul className="mt-4 space-y-2">
          {experience.bullets.map((bullet, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
