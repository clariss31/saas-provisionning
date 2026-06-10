import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import ButtonLink from "@/components/ui/ButtonLink";
import freelanceImg from "./images/job-freelance.png";
import fleuristeImg from "./images/job-fleuriste.png";
import garagisteImg from "./images/job-garagiste.png";
import artisanImg from "./images/job-artisan.png";

/** Une déclinaison métier proposée au catalogue. */
type Job = {
  /** Identifiant transmis au tunnel d'inscription (cf. SPEC `?job=`). */
  slug: string;
  title: string;
  description: string;
  image: StaticImageData;
};

/**
 * Les 4 profils types (cf. SPEC §1.3). Sur la page d'accueil, il s'agit d'un
 * aperçu : le clic mène au catalogue `/metiers` en pré-sélectionnant le métier
 * via le paramètre `?job=`.
 */
const JOBS: Job[] = [
  {
    slug: "freelance",
    title: "Freelance",
    description: "Pour les consultants, designers et développeurs.",
    image: freelanceImg,
  },
  {
    slug: "fleuriste",
    title: "Fleuriste",
    description: "Gestion de boutique et commandes spéciales.",
    image: fleuristeImg,
  },
  {
    slug: "garagiste",
    title: "Garagiste",
    description: "Ateliers de réparation et entretien auto.",
    image: garagisteImg,
  },
  {
    slug: "artisan",
    title: "Artisan BTP",
    description: "Plombiers, électriciens, menuisiers…",
    image: artisanImg,
  },
];

/**
 * Section « Métiers » : aperçu des 4 configurations sectorielles.
 *
 * Rendue côté serveur. Chaque carte est un lien unique englobant (grande zone
 * cliquable). Les illustrations sont décoratives (`alt=""`) car le nom
 * accessible du lien est déjà porté par le titre et la description ; cela évite
 * une répétition gênante pour les lecteurs d'écran tout en restant sans erreur
 * pour un audit WAVE.
 */
export default function Jobs() {
  return (
    <section
      id="job"
      aria-labelledby="job-titre"
      className="scroll-mt-24 bg-surface px-6 py-24 sm:px-10 md:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2
            id="job-titre"
            className="mb-4 text-[28px] font-bold text-text sm:text-[32px]"
          >
            Des solutions adaptées à votre métier
          </h2>
          <p className="text-[15px] text-soft">
            Découvrez nos configurations pré-paramétrées pour les
            professionnels.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {JOBS.map((job) => (
            <li key={job.slug}>
              <Link
                href={`/metiers?job=${job.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-border-light bg-content p-5 shadow-card transition-all duration-300 hover:shadow-lift"
              >
                <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl">
                  <Image
                    src={job.image}
                    alt=""
                    placeholder="blur"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    fill
                  />
                </div>
                <h3 className="mb-2 text-[14.5px] font-semibold text-text transition-colors group-hover:text-accent-dark">
                  {job.title}
                </h3>
                <p className="text-[13px] text-soft">{job.description}</p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex justify-center">
          <ButtonLink href="/metiers" size="lg" withArrow>
            Voir les métiers
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
