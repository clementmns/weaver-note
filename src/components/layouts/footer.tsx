import { HiHeart } from "react-icons/hi";
import { PiCoffeeFill } from "react-icons/pi";
import { FaGithub } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { Button } from "../ui/button";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full text-xs font-mono text-muted-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Made with</span>
          <span role="img" aria-label="love">
            <HiHeart />
          </span>
          <span>and</span>
          <span role="img" aria-label="coffee">
            <PiCoffeeFill />
          </span>
        </div>
        <Button
          className="group"
          variant="outline"
          size="icon"
          asChild
          aria-label="GitHub profile"
        >
          <Link
            href="https://github.com/clementmns"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub
              strokeWidth={2.5}
              className="group-hover:rotate-12 transition-transform"
            />
          </Link>
        </Button>
        <Button
          className="group"
          variant="outline"
          size="icon"
          asChild
          aria-label="LinkedIn profile"
        >
          <Link
            href="https://www.linkedin.com/in/clement-omnes"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaLinkedin
              strokeWidth={2.5}
              className="group-hover:rotate-12 transition-transform"
            />
          </Link>
        </Button>
        <div>
          <span>© {new Date().getFullYear()} Clément Omnès</span>
        </div>
      </div>
    </footer>
  );
}
