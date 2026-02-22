"use client";

import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import type { Project } from "@/lib/data";

export default function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group rounded-xl border border-card-border bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-card-hover hover:shadow-[0_0_30px_-10px_rgba(124,58,237,0.15)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold transition-colors group-hover:text-accent-light">
            {project.title}
          </h3>
          <p className="mt-1 text-xs text-accent-light">{project.date}</p>
        </div>
        <div className="flex gap-2">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted transition-colors hover:text-foreground"
              aria-label={`${project.title} GitHub`}
            >
              <Github size={16} />
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted transition-colors hover:text-foreground"
              aria-label={`${project.title} live demo`}
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        {project.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.tech.map((t) => (
          <span
            key={t}
            className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent-light"
          >
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
