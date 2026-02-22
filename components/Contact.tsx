"use client";

import { motion } from "framer-motion";
import { Send, Github, Linkedin, Mail } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { socials } from "@/lib/data";

export default function Contact() {
  return (
    <section id="contact" className="px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          title="Get In Touch"
          subtitle="Have a question or want to work together?"
        />

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          onSubmit={(e) => e.preventDefault()}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-muted"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                className="w-full rounded-lg border border-card-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none transition-colors focus:border-accent"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-muted"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-card-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none transition-colors focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1.5 block text-sm font-medium text-muted"
            >
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              placeholder="Your message..."
              className="w-full resize-none rounded-lg border border-card-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none transition-colors focus:border-accent"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-light"
          >
            Send Message
            <Send size={16} />
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 flex items-center justify-center gap-6"
        >
          <a
            href={socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <Github size={18} />
            GitHub
          </a>
          <a
            href={socials.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <Linkedin size={18} />
            LinkedIn
          </a>
          <a
            href={`mailto:${socials.email}`}
            className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <Mail size={18} />
            Email
          </a>
        </motion.div>
      </div>
    </section>
  );
}
