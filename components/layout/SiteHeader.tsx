"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";

const NAV_LINKS = [
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Métiers", href: "/metiers" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Contact", href: "/contact" },
];

/**
 * Barre de navigation supérieure des pages vitrines.
 * Sticky, fond translucide avec flou ; se densifie légèrement au scroll.
 */
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 h-20 w-full border-b border-border-light backdrop-blur-md transition-all duration-300 ${
        scrolled ? "bg-surface/95 shadow-sm" : "bg-surface/80"
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-16">
        {/* Marque */}
        <Logo />

        {/* Navigation (desktop) */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-soft transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/connexion"
            className="hidden rounded-lg px-3 py-2 text-[12.5px] font-medium text-soft transition-colors hover:bg-content hover:text-accent md:inline-flex"
          >
            Se connecter
          </Link>
          <Link
            href="/metiers"
            className="inline-flex h-[38px] items-center justify-center rounded-lg bg-accent px-5 text-[12.5px] font-medium text-white shadow-card transition-all hover:-translate-y-px hover:shadow-lift"
          >
            Démarrer
          </Link>
        </div>
      </div>
    </header>
  );
}
