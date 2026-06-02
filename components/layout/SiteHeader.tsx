"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";

const NAV_LINKS = [
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Métiers", href: "/job" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Contact", href: "/contact" },
];

/**
 * Barre de navigation supérieure des pages vitrines.
 * Sticky, fond translucide avec flou ; se densifie légèrement au scroll.
 */
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-border-light py-7 backdrop-blur-md transition-all duration-300 ${
        scrolled ? "bg-surface/95 shadow-sm" : "bg-surface/80"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-16">
        {/* Marque */}
        <Logo />

        {/* Navigation (desktop). Le lien de la page courante est mis en
            évidence (couleur accent + soulignement) et signalé aux lecteurs
            d'écran via aria-current. */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`text-[13px] transition-colors hover:text-accent ${
                  isActive
                    ? "border-b-2 border-accent py-2 font-semibold text-accent-dark"
                    : "font-medium text-soft"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
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
            href="/job"
            className="inline-flex h-[38px] items-center justify-center rounded-lg bg-accent px-5 text-[12.5px] font-medium text-white shadow-card transition-all hover:-translate-y-px hover:shadow-lift"
          >
            Démarrer
          </Link>
        </div>
      </div>
    </header>
  );
}
