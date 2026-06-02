import type { Metadata } from "next";
import FeaturesHero from "@/components/features/FeaturesHero";
import Ecosystem from "@/components/features/Ecosystem";
import ValueProps from "@/components/features/ValueProps";
import Showcase from "@/components/features/Showcase";
import FeaturesCta from "@/components/features/FeaturesCta";

/**
 * Métadonnées propres à la page « Fonctionnalités » (SEO). Définies au niveau
 * de la page (Server Component) : elles sont injectées dans le HTML pré-rendu.
 */
export const metadata: Metadata = {
  title: "Provi — Fonctionnalités",
  description:
    "Découvrez l'écosystème complet de Provi : CRM, finance, stock, RH, marketing… Une interface modernisée pour gérer toute votre activité sans friction.",
};

/**
 * Page « Fonctionnalités » (US 2.x) : démonstration des modules transverses et
 * des atouts de la plateforme.
 *
 * Server Component : la totalité du contenu est pré-rendue côté serveur
 * (SSR/SSG) pour un score Lighthouse optimal — aucune interactivité cliente
 * n'est nécessaire sur cette page vitrine.
 *
 * Enchaînement des sections, fidèle à la maquette : accroche → écosystème de
 * modules → atouts de croissance → démonstrations visuelles → appel à
 * l'action.
 */
export default function FonctionnalitesPage() {
  return (
    <>
      <FeaturesHero />
      <Ecosystem />
      <ValueProps />
      <Showcase />
      <FeaturesCta />
    </>
  );
}
