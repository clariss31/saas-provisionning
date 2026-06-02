import ButtonLink from "@/components/ui/ButtonLink";
import Icon, { type IconName } from "@/components/ui/Icon";

/** Un argument différenciant (pictogramme + libellé). */
type Advantage = { icon: IconName; label: string };

/** Les 6 atouts transverses de la plateforme. */
const ADVANTAGES: Advantage[] = [
  { icon: "shield-check", label: "Souveraineté des données" },
  { icon: "receipt", label: "Facturation électronique" },
  { icon: "trending-up", label: "Un outil qui évolue avec vous" },
  { icon: "landmark", label: "Rapprochement bancaire" },
  { icon: "link", label: "Freelance : connexion URSSAF" },
  { icon: "bar-chart", label: "Analyses & Rapports" },
];

/**
 * Section « Atouts » : arguments de réassurance (sécurité, conformité,
 * évolutivité). Rendue côté serveur (contenu statique).
 */
export default function Advantages() {
  return (
    <section
      aria-labelledby="advantages-titre"
      className="bg-content px-6 py-24 sm:px-10 md:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2
            id="advantages-titre"
            className="mb-4 text-[28px] font-bold text-text sm:text-[32px]"
          >
            Rapide, conforme, scalable
          </h2>
          <p className="text-[15px] text-soft">
            Une base technique solide, pensée pour la conformité française et la
            croissance de votre activité.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {ADVANTAGES.map((advantage) => (
            <li
              key={advantage.label}
              className="flex items-center gap-4 rounded-2xl border border-border-light bg-surface p-6 shadow-card transition-all hover:shadow-lift"
            >
              <Icon
                name={advantage.icon}
                size={28}
                className="shrink-0 text-accent-dark"
              />
              <span className="text-[14.5px] font-semibold text-text">
                {advantage.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex justify-center">
          <ButtonLink href="/fonctionnalites" size="lg" withArrow>
            Voir les avantages
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
