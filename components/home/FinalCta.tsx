import ButtonLink from "@/components/ui/ButtonLink";

/**
 * Bloc d'appel à l'action final, sur dégradé de marque violet → rose.
 *
 * Rendu côté serveur. Un voile sombre léger (`bg-black/20`) est superposé au
 * dégradé : il abaisse la luminance du fond juste assez pour que le texte blanc
 * conserve un contraste ≥ 4.5:1 (WCAG AA) sur toute la largeur, y compris la
 * portion rose la plus claire — sans dénaturer la vivacité de la charte.
 */
export default function FinalCta() {
  return (
    <section className="bg-surface px-6 py-24 sm:px-10 md:px-16">
      <div className="mx-auto max-w-5xl">
        <div className="cta-surface relative overflow-hidden rounded-[32px] p-10 text-center shadow-lift sm:p-12">
          <div aria-hidden="true" className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="mb-4 text-[32px] font-bold tracking-tight text-white sm:text-[40px]">
              Prêt à démarrer ?
            </h2>
            <p className="mb-8 max-w-lg text-[16px] text-white">
              Rejoignez les professionnels qui gagnent du temps chaque jour.
              Configuration instantanée, sans engagement.
            </p>
            <ButtonLink href="/metiers" variant="white" size="lg">
              Obtenir un essai gratuit de 30 jours
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
