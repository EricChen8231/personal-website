import { Github, Linkedin, Mail } from "lucide-react";
import { socials } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="border-t border-card-border px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted">
          &copy; {new Date().getFullYear()} Eric Chen. All rights reserved.
        </p>

        <div className="flex items-center gap-4">
          <a
            href={socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-foreground"
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
          <a
            href={socials.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-foreground"
            aria-label="LinkedIn"
          >
            <Linkedin size={16} />
          </a>
          <a
            href={`mailto:${socials.email}`}
            className="text-muted transition-colors hover:text-foreground"
            aria-label="Email"
          >
            <Mail size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
