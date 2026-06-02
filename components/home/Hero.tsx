import Image from "next/image";
import ButtonLink from "@/components/ui/ButtonLink";
import heroDashboard from "./images/hero-dashboard.jpg";

/**
 * Section Hero de la page d'accueil : proposition de valeur, double appel à
 * l'action et aperçu du tableau de bord.
 *
 * Rendue côté serveur (Server Component) pour un FCP/LCP optimal. L'aperçu
 * utilise `next/image` avec `priority` (préchargement du LCP) et un import
 * statique (dimensions + placeholder flou générés au build → aucun décalage
 * de mise en page).
 */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-titre"
      className="hero-surface relative overflow-hidden rounded-b-[40px] border-b border-border-light px-6 pt-20 pb-28 sm:px-10 md:px-16"
    >
      {/* Halos décoratifs (purement esthétiques → masqués aux technologies
          d'assistance). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-20 right-10 h-64 w-64 rounded-full bg-purple-light opacity-60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-10 h-48 w-48 rounded-full bg-pink-light opacity-60 blur-3xl"
      />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Colonne gauche : discours */}
        <div className="flex flex-col items-start gap-6">
          {/* Bandeau « nouveauté » */}
          <p className="inline-flex items-center gap-2 rounded-full border border-purple/20 bg-purple-light px-3 py-1.5 shadow-sm">
            <span
              aria-hidden="true"
              className="relative flex h-2 w-2"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-dark" />
            </span>
            <span className="text-[11px] font-bold tracking-[0.6px] text-accent-dark uppercase">
              Nouveau · Facturation électronique
            </span>
          </p>

          <h1
            id="hero-titre"
            className="text-[34px] leading-[1.1] font-bold tracking-tight text-text sm:text-[42px] lg:text-[48px]"
          >
            La puissance d&apos;un ERP Open-Source,{" "}
            <span className="bg-gradient-to-r from-accent to-purple bg-clip-text text-transparent">
              en toute simplicité.
            </span>
          </h1>

          <p className="max-w-lg text-[16px] leading-relaxed text-soft">
            Souscrivez à une instance ERP clé en main, hébergée en France,
            configurée spécifiquement pour votre métier. Facturez, gérez et
            développez votre activité sans friction.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <ButtonLink href="/job" withArrow>
              Choisir mon métier
            </ButtonLink>
            <ButtonLink href="#tarifs" variant="soft">
              Voir les tarifs
            </ButtonLink>
          </div>
        </div>

        {/* Colonne droite : aperçu du tableau de bord, dans un cadre incliné.
            Le tilt 3D n'est appliqué qu'à partir de `lg` pour éviter tout
            rognage gênant sur mobile. */}
        <div className="relative w-full lg:[perspective:1200px]">
          <div className="overflow-hidden rounded-3xl border-4 border-white shadow-lift transition-transform duration-500 lg:[transform:rotateY(-12deg)_rotateX(5deg)] lg:hover:[transform:rotateY(-5deg)_rotateX(2deg)]">
            <Image
              src={heroDashboard}
              alt="Aperçu du tableau de bord Provi : facturation et indicateurs d'activité."
              priority
              placeholder="blur"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
