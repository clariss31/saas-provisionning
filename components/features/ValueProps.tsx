import Icon, { type IconName } from "@/components/ui/Icon";

/** Un argument de valeur (pictogramme + titre + explication). */
type ValueProp = { icon: IconName; title: string; description: string };

/** Les 6 atouts différenciants de la plateforme. */
const VALUE_PROPS: ValueProp[] = [
  {
    icon: "shield-check",
    title: "Propriété de vos données",
    description:
      "Soyez le seul maître de vos données. Notre plateforme garantit indépendance et sécurité maximales. Vous souhaitez changer d'ERP ? Repartez avec vos données.",
  },
  {
    icon: "receipt",
    title: "Facturation électronique",
    description:
      "Prêt pour la réforme de la facturation électronique. Créez, envoyez et recevez vos factures en toute conformité et simplicité.",
  },
  {
    icon: "trending-up",
    title: "Grandissez avec nous",
    description:
      "Un outil qui évolue avec votre activité. De l'auto-entreprise à la PME, Provi s'adapte à vos besoins grâce à une personnalisation avancée.",
  },
  {
    icon: "landmark",
    title: "Rapprochement bancaire",
    description:
      "Automatisez votre comptabilité. Connectez votre banque et laissez notre IA pointer vos transactions et factures automatiquement.",
  },
  {
    icon: "link",
    title: "Freelance : connexion URSSAF",
    description:
      "Simplifiez vos déclarations. Une connexion directe et automatique avec l'URSSAF pour vos cotisations en un clic.",
  },
  {
    icon: "bar-chart",
    title: "Analyses & Rapports",
    description:
      "Suivez votre rentabilité avec des graphiques clairs. Identifiez vos chantiers les plus profitables pour optimiser votre stratégie.",
  },
];

/**
 * Section « Des avantages conçus pour votre croissance » : grille de cartes
 * argumentaires (sécurité, conformité, évolutivité, automatisation).
 *
 * Rendue côté serveur (contenu statique). Le pictogramme s'agrandit légèrement
 * au survol de la carte (groupe), effet purement décoratif.
 */
export default function ValueProps() {
  return (
    <section
      aria-labelledby="valueprops-titre"
      className="border-y border-border-light bg-surface px-6 py-16 sm:px-10 md:px-16"
    >
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2
          id="valueprops-titre"
          className="mb-4 text-[28px] font-bold text-text sm:text-[32px]"
        >
          Des avantages conçus pour votre croissance
        </h2>
        <p className="text-[15px] text-soft">
          Découvrez comment Provi s&apos;adapte à chaque étape de votre
          développement grâce à des outils pensés pour les experts.
        </p>
      </div>

      <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {VALUE_PROPS.map((prop) => (
          <li
            key={prop.title}
            className="group rounded-2xl border border-border-light bg-surface p-8 shadow-card transition-all duration-300 hover:shadow-lift"
          >
            <span className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent-light text-accent-dark transition-transform group-hover:scale-110">
              <Icon name={prop.icon} size={28} />
            </span>
            <h3 className="mb-3 text-[18px] font-bold text-text">
              {prop.title}
            </h3>
            <p className="text-[13.5px] leading-relaxed text-soft">
              {prop.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
