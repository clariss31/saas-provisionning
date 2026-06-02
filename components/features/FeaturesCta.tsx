import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";

/**
 * Bandeau d'appel à l'action final de la page Fonctionnalités, sur un dégradé
 * de marque (accent → accent foncé).
 *
 * Rendu côté serveur. Un voile sombre léger (`bg-black/10`) est superposé au
 * dégradé pour que le texte blanc — y compris le libellé du bouton secondaire
 * en contour — conserve un contraste ≥ 4.5:1 (WCAG AA) sur toute la surface.
 */
export default function FeaturesCta() {
  return (
    <section className="bg-content px-6 py-20 sm:px-10 md:px-16">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-gradient-to-br from-accent to-accent-dark p-10 text-center shadow-dropdown sm:p-12">
        {/* Voile de contraste + halos décoratifs. */}
        <div aria-hidden="true" className="absolute inset-0 bg-black/10" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/3 translate-y-1/3 rounded-full bg-black/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col items-center">
          <h2 className="mb-4 text-[28px] font-bold tracking-tight text-white sm:text-[32px]">
            Prêt à moderniser votre activité ?
          </h2>
          <p className="mb-10 max-w-2xl text-[16px] leading-relaxed text-white">
            Rejoignez des centaines d&apos;artisans qui utilisent Provi au
            quotidien pour gagner du temps et se concentrer sur l&apos;essentiel :
            leur métier.
          </p>

          <div className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <ButtonLink
              href="/job"
              variant="white"
              size="lg"
              className="w-full sm:w-auto"
            >
              Démarrer ma configuration
            </ButtonLink>
            <Link
              href="/contact"
              className="inline-flex h-[48px] w-full items-center justify-center rounded-lg border border-white/40 px-8 text-[15px] font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              Demander une démo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
