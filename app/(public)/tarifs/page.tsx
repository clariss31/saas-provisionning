import type { Metadata } from "next";
import Pricing from "@/components/home/Pricing";
import PricingFaq from "@/components/pricing/PricingFaq";

/**
 * Métadonnées propres à la page « Tarifs » (SEO). Définies au niveau de la
 * page (Server Component) : elles sont injectées dans le HTML pré-rendu.
 */
export const metadata: Metadata = {
  title: "Provi — Tarifs",
  description:
    "Une tarification transparente, adaptée à votre métier : Starter, Professionnel ou Premium. Mensuel ou annuel (−20 %), sans surprise.",
};

/**
 * Page « Tarifs » (SPEC page 4, US 4.x).
 *
 * Réutilise le bloc tarifs de la page d'accueil (`Pricing`) — toggle
 * Mensuel / Annuel et grille des 3 offres — promu ici en titre principal de
 * page (h1) avec la copie dédiée, puis complété d'une FAQ. Seul le bloc tarifs
 * embarque du JavaScript (la bascule de périodicité) ; le reste est statique.
 */
export default function TarifsPage() {
  return (
    <>
      <Pricing
        headingLevel="h1"
        title="Une tarification transparente, adaptée à votre métier."
        subtitle="Choisissez la formule qui correspond le mieux à l'évolution de votre activité. Simple, transparent et sans surprise."
      />
      <PricingFaq />
    </>
  );
}
