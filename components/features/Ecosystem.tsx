import Icon, { type IconName } from "@/components/ui/Icon";

/** Un pôle de gestion couvert par la plateforme. */
type Module = {
  icon: IconName;
  title: string;
  description: string;
  /** Couleur du pictogramme (classe Tailwind littérale, requise par le JIT). */
  iconColor: string;
  /** Fond pastel du pictogramme (classe Tailwind littérale). */
  iconBg: string;
};

/**
 * Les 8 pôles fonctionnels. Les classes de couleur sont écrites en toutes
 * lettres : Tailwind n'analyse que les chaînes littérales présentes dans le
 * code source (un nom de classe construit dynamiquement ne serait pas généré).
 */
const MODULES: Module[] = [
  {
    icon: "share-2",
    title: "CRM & Ventes",
    description:
      "Gérez vos prospects, transformez vos opportunités et éditez des devis professionnels en quelques clics.",
    iconColor: "text-accent-dark",
    iconBg: "bg-accent-light",
  },
  {
    icon: "users",
    title: "Gestion RH",
    description:
      "Centralisez vos employés, gérez les congés, les notes de frais et simplifiez vos processus de recrutement.",
    iconColor: "text-pink",
    iconBg: "bg-pink-light",
  },
  {
    icon: "shopping-cart",
    title: "Site Web & Vente",
    description:
      "Créez votre vitrine en ligne avec notre CMS intégré et gérez vos points de vente physiques en temps réel.",
    iconColor: "text-info",
    iconBg: "bg-info-light",
  },
  {
    icon: "package",
    title: "Produit & Stock",
    description:
      "Suivez vos stocks, automatisez vos approvisionnements et pilotez vos services de fabrication facilement.",
    iconColor: "text-yellow",
    iconBg: "bg-yellow-light",
  },
  {
    icon: "banknote",
    title: "Finance",
    description:
      "Facturation, paiements et comptabilité à double entrée. Simplifiez votre rapprochement bancaire quotidien.",
    iconColor: "text-success",
    iconBg: "bg-success-light",
  },
  {
    icon: "megaphone",
    title: "Marketing",
    description:
      "Fidélisez vos clients grâce à des campagnes d'emailing ciblées et des enquêtes de satisfaction intégrées.",
    iconColor: "text-warning",
    iconBg: "bg-warning-light",
  },
  {
    icon: "rocket",
    title: "Productivité",
    description:
      "Organisez vos projets et interventions via un agenda partagé et un gestionnaire de tâches collaboratif.",
    iconColor: "text-teal",
    iconBg: "bg-teal-light",
  },
  {
    icon: "grid",
    title: "Intégrations",
    description:
      "Connectez vos outils externes via notre API ouverte et développez vos propres modules personnalisés.",
    iconColor: "text-danger",
    iconBg: "bg-danger-light",
  },
];

/**
 * Section « Un écosystème complet » : grille des pôles de gestion, chacun
 * présenté par une carte (pictogramme coloré + titre + description).
 *
 * Rendue côté serveur (contenu statique). Les pictogrammes sont décoratifs ;
 * le sens est porté par le titre et la description.
 */
export default function Ecosystem() {
  return (
    <section
      aria-labelledby="ecosystem-titre"
      className="bg-content px-6 py-20 sm:px-10 md:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2
            id="ecosystem-titre"
            className="mb-4 text-[28px] font-bold text-text sm:text-[32px]"
          >
            Un écosystème complet
          </h2>
          <p className="text-[15px] text-soft">
            Explorez toutes les fonctionnalités natives de Provi, organisées par
            pôles de gestion pour couvrir 100 % de vos besoins.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((module) => (
            <li
              key={module.title}
              className="flex flex-col items-start gap-4 rounded-2xl border border-border-light bg-surface p-6 text-left shadow-card transition-all hover:shadow-lift"
            >
              <span
                className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${module.iconBg} ${module.iconColor}`}
              >
                <Icon name={module.icon} size={28} />
              </span>
              <span className="text-[15px] font-semibold text-text">
                {module.title}
              </span>
              <p className="text-[13.5px] leading-relaxed text-soft">
                {module.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
