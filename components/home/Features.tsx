import ButtonLink from "@/components/ui/ButtonLink";
import Icon, { type IconName } from "@/components/ui/Icon";

/** Un module fonctionnel mis en avant dans la grille. */
type Feature = {
  icon: IconName;
  label: string;
  /** Couleur du pictogramme (classe Tailwind littérale, requise par le JIT). */
  iconColor: string;
  /** Fond pastel du pictogramme (classe Tailwind littérale). */
  iconBg: string;
};

/**
 * Les 8 modules transverses. Les classes de couleur sont écrites en toutes
 * lettres : Tailwind n'analyse que les chaînes littérales présentes dans le
 * code, des noms construits dynamiquement ne seraient pas générés.
 */
const FEATURES: Feature[] = [
  { icon: "share-2", label: "CRM & Ventes", iconColor: "text-purple", iconBg: "bg-purple-light" },
  { icon: "users", label: "Gestion RH", iconColor: "text-pink", iconBg: "bg-pink-light" },
  { icon: "shopping-cart", label: "Site Web & Vente", iconColor: "text-info", iconBg: "bg-info-light" },
  { icon: "package", label: "Produit & Stock", iconColor: "text-yellow", iconBg: "bg-yellow-light" },
  { icon: "banknote", label: "Finance", iconColor: "text-success", iconBg: "bg-success-light" },
  { icon: "megaphone", label: "Marketing", iconColor: "text-warning", iconBg: "bg-warning-light" },
  { icon: "rocket", label: "Productivité", iconColor: "text-teal", iconBg: "bg-teal-light" },
  { icon: "grid", label: "Intégrations", iconColor: "text-danger", iconBg: "bg-danger-light" },
];

/**
 * Section « Fonctionnalités » : grille des modules pré-paramétrés.
 *
 * Rendue côté serveur (contenu statique). Chaque carte associe un pictogramme
 * coloré et un libellé porteur de sens (le pictogramme est décoratif).
 */
export default function Features() {
  return (
    <section
      aria-labelledby="features-titre"
      className="bg-surface px-6 py-24 sm:px-10 md:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2
            id="features-titre"
            className="mb-4 text-[28px] font-bold text-text sm:text-[32px]"
          >
            Tout ce dont vous avez besoin,
            <br />
            pré-configuré
          </h2>
          <p className="text-[15px] text-soft">
            Oubliez les installations complexes. Nous avons sélectionné et
            paramétré les meilleurs modules pour vous.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {FEATURES.map((feature) => (
            <li
              key={feature.label}
              className="flex flex-col items-center gap-4 rounded-2xl border border-border-light bg-surface p-6 text-center shadow-card transition-all hover:shadow-lift"
            >
              <span
                className={`mb-2 inline-flex rounded-xl p-3 ${feature.iconBg} ${feature.iconColor}`}
              >
                <Icon name={feature.icon} size={32} />
              </span>
              <span className="text-[14.5px] font-semibold text-text">
                {feature.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex justify-center">
          <ButtonLink href="/fonctionnalites" size="lg" withArrow>
            Découvrir les fonctionnalités
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
