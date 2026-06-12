"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import Icon from "@/components/ui/Icon";

const NAV_LINKS = [
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Métiers", href: "/metiers" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Contact", href: "/contact" },
];

/**
 * Barre de navigation supérieure des pages vitrines.
 *
 * Sticky, fond translucide avec flou ; se densifie légèrement au scroll.
 *
 * Responsive : à partir de `md`, la navigation s'affiche en ligne. En dessous
 * (mobile / petite tablette), elle est repliée derrière un bouton « hamburger »
 * qui ouvre un tiroir glissant depuis la droite. Ce tiroir se comporte comme
 * une boîte de dialogue : voile cliquable, fermeture par Échap, défilement de
 * l'arrière-plan verrouillé, focus déplacé à l'ouverture puis rendu au bouton à
 * la fermeture. Son état est annoncé via `aria-expanded`/`aria-controls`, et il
 * se referme automatiquement à chaque changement de page.
 *
 * NB technique : le tiroir et son voile sont rendus **en dehors** du `<header>`.
 * Ce dernier porte `backdrop-blur`, or un `backdrop-filter` fait de l'élément le
 * bloc conteneur de ses descendants `position: fixed` — placés dedans, le tiroir
 * et le voile seraient calés sur la barre (≈ 70px) au lieu du plein écran.
 */
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Références pour la gestion du focus (accessibilité clavier).
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // À chaque navigation, on referme le tiroir (sinon il resterait ouvert
  // par-dessus la nouvelle page). Reset d'état volontaire suite à un changement
  // de route (on synchronise l'UI avec le système de navigation) — pas une
  // cascade de rendus problématique, d'où le disable ciblé.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [pathname]);

  // Tant que le tiroir est ouvert : on verrouille le défilement de la page, on
  // déplace le focus sur le bouton de fermeture (entrée dans la « dialogue ») et
  // on permet de fermer au clavier via la touche Échap.
  useEffect(() => {
    if (!menuOpen) return;
    closeRef.current?.focus();
    // On appelle directement les setters/refs (stables) plutôt que `closeMenu`,
    // pour garder `menuOpen` comme unique dépendance de l'effet.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /** Ferme le tiroir et rend le focus au bouton « hamburger » qui l'a ouvert. */
  function closeMenu() {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full border-b border-border-light backdrop-blur-md transition-all duration-300 ${
          scrolled ? "bg-surface/95 shadow-sm" : "bg-surface/80"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 sm:px-10 md:px-16 md:py-7">
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
          <div className="flex items-center gap-3">
            {/* CTA principal : visible en ligne à partir de `md` ; sur mobile il
                est repris en pleine largeur dans le tiroir. */}
            <Link
              href="/metiers"
              className="hidden h-[38px] items-center justify-center rounded-lg bg-accent-dark px-5 text-[12.5px] font-medium text-white shadow-card transition-all hover:-translate-y-px hover:shadow-lift md:inline-flex"
            >
              Démarrer
            </Link>

            {/* Bouton « hamburger » : visible uniquement sous `md`. */}
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label="Ouvrir le menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-text transition-colors hover:bg-content md:hidden"
            >
              <Icon name="menu" size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Tiroir de navigation mobile + voile. Rendus hors du <header> (cf. note
          d'en-tête) et montés uniquement à l'ouverture ; le défilement de
          l'arrière-plan est verrouillé pendant ce temps. */}
      {menuOpen && (
        <div className="md:hidden">
          {/* Voile (ferme le tiroir au clic). Simple confort pointeur, masqué
              aux lecteurs d'écran : les utilisateurs clavier disposent déjà du
              bouton de fermeture et de la touche Échap. */}
          <div
            aria-hidden="true"
            onClick={closeMenu}
            className="animate-menu-backdrop fixed inset-0 z-40 bg-black/30"
          />

          {/* Panneau glissant depuis la droite. */}
          <nav
            id="menu-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
            className="animate-menu-drawer fixed top-0 right-0 z-50 flex h-full w-[82%] max-w-xs flex-col bg-surface shadow-lift"
          >
            {/* En-tête du tiroir : marque + bouton de fermeture. */}
            <div className="flex items-center justify-between border-b border-border-light px-6 py-5">
              <Logo />
              <button
                ref={closeRef}
                type="button"
                onClick={closeMenu}
                aria-label="Fermer le menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-text transition-colors hover:bg-content"
              >
                <Icon name="x" size={24} />
              </button>
            </div>

            {/* Liens de navigation. */}
            <ul className="flex flex-col gap-1 px-4 py-5">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`block rounded-lg px-4 py-3 text-[15px] transition-colors ${
                        isActive
                          ? "bg-accent-light font-semibold text-accent-dark"
                          : "font-medium text-soft hover:bg-content hover:text-text"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* CTA principal repris en pleine largeur, ancré en bas du tiroir. */}
            <div className="mt-auto border-t border-border-light p-4">
              <Link
                href="/metiers"
                onClick={() => setMenuOpen(false)}
                className="flex h-12 items-center justify-center rounded-lg bg-accent-dark px-5 text-[14px] font-medium text-white shadow-card transition-all hover:-translate-y-px hover:shadow-lift"
              >
                Démarrer
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
