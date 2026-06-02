/**
 * Accroche de la page « Catalogue Métiers » : titre et sous-titre centrés.
 *
 * Rendue côté serveur (contenu statique). Le mot « métier » est mis en valeur
 * par un dégradé de marque clippé sur le texte ; il reste lisible et porté par
 * la balise de titre (aucune information uniquement véhiculée par la couleur).
 */
export default function JobHero() {
  return (
    <section
      aria-labelledby="job-titre"
      className="mx-auto flex max-w-3xl flex-col gap-5 text-center"
    >
      <h1
        id="job-titre"
        className="text-[36px] leading-[1.1] font-bold tracking-tight text-text sm:text-[44px] lg:text-[48px]"
      >
        Choisissez votre{" "}
        <span className="bg-gradient-to-r from-accent-dark to-accent bg-clip-text text-transparent">
          métier
        </span>
      </h1>
      <p className="text-[16px] leading-relaxed text-soft">
        Chaque template est pré-configuré avec les modules essentiels à votre
        activité. Démarrez en quelques clics et obtenez votre ERP en quelques
        minutes.
      </p>
    </section>
  );
}
