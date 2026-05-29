/**
 * Page d'accueil (vitrine). Contenu provisoire : seuls le header et le
 * footer sont intégrés pour l'instant — la landing page complète viendra
 * dans un second temps.
 */
export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-[1440px] flex-col items-center justify-center gap-3 px-16 py-32 text-center">
      <h1 className="text-3xl font-bold tracking-tight">
        La puissance de Dolibarr,{" "}
        <span className="text-accent">en toute simplicité.</span>
      </h1>
      <p className="max-w-md text-soft">
        Contenu de la page d&apos;accueil à venir. Le header et le footer
        sont en place.
      </p>
    </section>
  );
}
