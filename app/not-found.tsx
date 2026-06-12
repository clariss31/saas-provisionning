import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ButtonLink from "@/components/ui/ButtonLink";

/**
 * Métadonnées de la page 404. Next injecte automatiquement `noindex` pour
 * les réponses 404 ; on se contente d'un titre explicite côté onglet.
 */
export const metadata: Metadata = {
  title: "Page introuvable — Provi",
};

/**
 * Liens de rebond proposés depuis la 404 : on ramène l'utilisateur vers les
 * pages clés de la vitrine plutôt que de le laisser dans une impasse.
 */
const HELPFUL_LINKS = [
  { label: "Tarifs", href: "/tarifs" },
  { label: "Métiers", href: "/metiers" },
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Contact", href: "/contact" },
];

/**
 * Page d'erreur 404 globale (remplace l'écran par défaut de Next).
 *
 * Le fichier `app/not-found.tsx` racine capture toute URL non reconnue. Comme
 * il s'affiche en dehors du layout `(public)`, on recompose ici le header, le
 * pied de page et le lien d'évitement afin de conserver l'identité Kaleïdo et
 * la conformité WCAG (navigation cohérente, saut de contenu au clavier).
 */
export default function NotFound() {
  return (
    <>
      {/* Lien d'évitement : saut direct au contenu pour le clavier / lecteur
          d'écran (WCAG 2.4.1), invisible jusqu'au focus. */}
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-accent-dark focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium focus:text-white focus:shadow-lift"
      >
        Aller au contenu principal
      </a>

      <SiteHeader />

      <main
        id="contenu-principal"
        className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-20"
      >
        {/* Halo lavande décoratif, posé derrière le « 404 » pour la profondeur.
            Purement esthétique → masqué aux technologies d'assistance. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-light opacity-60 blur-3xl"
        />

        <section className="flex max-w-xl flex-col items-center text-center">
          {/* Grand « 404 » en dégradé signature (cf. DESIGN, bouton gradient).
              Décoratif : le sens est porté par le titre h1 ci-dessous. */}
          <p
            aria-hidden="true"
            className="select-none bg-[linear-gradient(135deg,#6366f1_0%,#a855f7_100%)] bg-clip-text text-[96px] font-bold leading-none tracking-tight text-transparent sm:text-[140px]"
          >
            404
          </p>

          <h1 className="mt-4 text-[26px] font-bold text-text sm:text-[32px]">
            Cette page a disparu
          </h1>

          <p className="mt-4 max-w-md text-[14px] leading-6 text-soft">
            La page que vous cherchez n&apos;existe pas ou a été déplacée. Pas
            d&apos;inquiétude&nbsp;: reprenons depuis le début.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <ButtonLink href="/" size="lg" withArrow>
              Retour à l&apos;accueil
            </ButtonLink>
            <ButtonLink href="/contact" variant="soft" size="lg">
              Nous contacter
            </ButtonLink>
          </div>

          {/* Rebonds rapides vers les pages principales de la vitrine. */}
          <nav aria-label="Liens utiles" className="mt-12">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {HELPFUL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] font-medium text-soft underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
