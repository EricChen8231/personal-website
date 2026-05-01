"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Github, Linkedin, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { socials } from "@/lib/data";

// Sign up free at https://formspree.io, create a form, and replace this with your form ID
const FORMSPREE_ID = "YOUR_FORM_ID";

type Status = "idle" | "loading" | "success" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = new FormData(form);

    // Basic validation
    const name = (data.get("name") as string).trim();
    const email = (data.get("email") as string).trim();
    const message = (data.get("message") as string).trim();

    if (!name || !email || !message) {
      setErrorMsg("Please fill in all fields.");
      setStatus("error");
      return;
    }

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        const json = await res.json();
        setErrorMsg(json?.errors?.[0]?.message ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

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
          onSubmit={handleSubmit}
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
                name="name"
                type="text"
                required
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
                name="email"
                type="email"
                required
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
              name="message"
              rows={5}
              required
              placeholder="Your message..."
              className="w-full resize-none rounded-lg border border-card-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none transition-colors focus:border-accent"
            />
          </div>

          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 rounded-lg border border-green-800 bg-green-950/40 px-4 py-3 text-sm text-green-400"
              >
                <CheckCircle size={16} className="shrink-0" />
                Message sent! I'll get back to you soon.
              </motion.div>
            ) : (
              <motion.div key="form-footer" className="space-y-4">
                {status === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400"
                  >
                    <AlertCircle size={16} className="shrink-0" />
                    {errorMsg}
                  </motion.div>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send size={16} />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
