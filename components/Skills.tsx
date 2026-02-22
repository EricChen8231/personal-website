"use client";

import { motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import { skillCategories } from "@/lib/data";

export default function Skills() {
  return (
    <section id="skills" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="Skills & Tech Stack"
          subtitle="Technologies I work with"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skillCategories.map((category, catIdx) => (
            <motion.div
              key={category.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: catIdx * 0.1 }}
              className="rounded-xl border border-card-border bg-card p-6"
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent-light">
                {category.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
