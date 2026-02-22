"use client";

import SectionHeading from "./SectionHeading";
import TimelineItem from "./TimelineItem";
import { experiences } from "@/lib/data";

export default function Experience() {
  return (
    <section id="experience" className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          title="Experience"
          subtitle="Where I've worked and contributed"
        />
        <div className="space-y-8">
          {experiences.map((exp, i) => (
            <TimelineItem key={exp.company + exp.period} experience={exp} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
