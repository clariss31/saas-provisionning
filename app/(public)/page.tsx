import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import SocialProof from "@/components/home/SocialProof";
import Features from "@/components/home/Features";
import Advantages from "@/components/home/Advantages";
import Jobs from "@/components/home/Jobs";
import Pricing from "@/components/home/Pricing";
import FinalCta from "@/components/home/FinalCta";

/**
 * Métadonnées propres à la page d'accueil (SEO). Définies au niveau de la page
 * (Server Component) : elles sont injectées dans le HTML pré-rendu.
 */
export const metadata: Metadata = {
  title: "Provi — La puissance d'un ERP Open-Source, en toute simplicité",
  description:
    "Souscrivez à une instance ERP clé en main, hébergée en France et pré-configurée pour votre métier : freelance, fleuriste, garagiste ou artisan.",
};

/**
 * Page d'accueil (vitrine).
 *
 * Server Component : la totalité du contenu est pré-rendue côté serveur
 * (SSR/SSG) pour un score Lighthouse optimal (US 2.1). Seule la section des
 * tarifs embarque du JavaScript, pour la bascule mensuel / annuel.
 *
 * L'enchaînement des sections suit la maquette : accroche → preuve sociale →
 * fonctionnalités → atouts → métiers → tarifs → appel à l'action final.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <Features />
      <Advantages />
      <Jobs />
      <Pricing />
      <FinalCta />
    </>
  );
}
