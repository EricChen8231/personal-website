"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import ProjectCard from "./ProjectCard";
import { softwareProjects, hardwareProjects } from "@/lib/data";

const tabs = [
  { id: "software" as const, label: "Software" },
  { id: "hardware" as const, label: "Hardware / EE" },
];

export default function Projects() {
  const [activeTab, setActiveTab] = useState<"software" | "hardware">(
    "software"
  );

  const projects =
    activeTab === "software" ? softwareProjects : hardwareProjects;

  return (
    <section id="projects" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="Projects"
          subtitle="Things I've built across software and hardware"
        />

        <div className="mb-10 flex justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 sm:grid-cols-2"
        >
          {projects.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
