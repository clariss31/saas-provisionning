/**
 * Section d'accroche de la page « Fonctionnalités ».
 *
 * Rendue côté serveur (contenu statique) pour un FCP/LCP optimal. Le trait
 * ondulé sous « activité avec brio » est un SVG décoratif (masqué aux
 * technologies d'assistance).
 */
export default function FeaturesHero() {
  return (
    <section
      aria-labelledby="features-hero-titre"
      className="relative overflow-hidden bg-surface px-6 py-24 text-center sm:px-10 md:px-16"
    >
      {/* Halo lavande diffus, purement décoratif. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-accent/5 blur-[120px]"
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        <h1
          id="features-hero-titre"
          className="mb-6 text-[34px] leading-tight font-bold tracking-tight text-text sm:text-[44px]"
        >
          Tout ce qu&apos;il faut pour gérer
          <br />
          votre{" "}
          <span className="relative inline-block text-accent">
            activité avec brio
            {/* Trait ondulé décoratif sous le segment mis en valeur. */}
            <svg
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-3 w-full text-accent/30"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
            >
              <path
                d="M0 5 Q 50 10 100 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-[16px] leading-relaxed text-soft">
          Une interface modernisée et pensée pour les professionnels de
          l&apos;artisanat. Fini les tableurs complexes, place à la fluidité et à
          l&apos;efficacité.
        </p>
      </div>
    </section>
  );
}
