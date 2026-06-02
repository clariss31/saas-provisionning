import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

/**
 * Layout des pages vitrines (Accueil, Fonctionnalités, Métiers, Tarifs,
 * Contact) : header sticky + contenu + footer, sur fond `background`.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Lien d'évitement : permet aux utilisateurs clavier / lecteur d'écran
          de sauter la navigation et d'aller droit au contenu (WCAG 2.4.1).
          Invisible jusqu'à ce qu'il reçoive le focus. */}
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-accent-dark focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium focus:text-white focus:shadow-lift"
      >
        Aller au contenu principal
      </a>
      <SiteHeader />
      <main id="contenu-principal" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
