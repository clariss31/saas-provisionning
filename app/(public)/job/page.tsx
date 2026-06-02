import type { Metadata } from "next";
import JobHero from "@/components/job/JobHero";
import JobCatalog from "@/components/job/JobCatalog";

/**
 * Métadonnées propres à la page « Métiers » (SEO). Définies au niveau de la
 * page (Server Component) : elles sont injectées dans le HTML pré-rendu.
 */
export const metadata: Metadata = {
  title: "Provi — Catalogue Métiers",
  description:
    "Choisissez votre métier : freelance, fleuriste, garagiste ou artisan du BTP. Chaque template Provi est pré-configuré avec les modules essentiels à votre activité.",
};

/**
 * Page « Catalogue Métiers » (SPEC page 3, US 3.x).
 *
 * Server Component : la totalité du contenu est pré-rendue côté serveur
 * (SSR/SSG) pour un score Lighthouse optimal — aucune interactivité cliente
 * n'est nécessaire (la sélection est un simple lien vers le tunnel
 * d'inscription, pré-paramétré par `?job=`).
 */
export default function JobPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-16 px-6 py-20 sm:px-10 md:px-16">
      <JobHero />
      <JobCatalog />
    </div>
  );
}
