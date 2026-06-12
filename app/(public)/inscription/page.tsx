import type { Metadata } from "next";
import { redirect } from "next/navigation";
import InscriptionForm from "@/components/inscription/InscriptionForm";
import { isValidJob } from "@/lib/instances/jobs";

/**
 * Métadonnées propres à la page « Inscription » (SEO).
 */
export const metadata: Metadata = {
  title: "Provi — Inscription",
  description:
    "Créez votre instance Provi en quelques étapes : nommez votre entreprise, vérifiez la disponibilité de votre espace, puis définissez vos accès.",
};

/**
 * Page « Tunnel d'inscription » (SPEC page 5, US 5.x).
 *
 * Server Component : il lit le contexte transmis par l'URL (`?job=` / `?billing=`,
 * cf. catalogue & grille tarifaire) et fournit le domaine racine des instances
 * (variable serveur `INSTANCE_DOMAIN`). Toute l'interactivité (saisie,
 * vérification du sous-domaine, stepper) est déléguée au Client Component
 * `InscriptionForm`.
 *
 * Dans l'App Router de Next 16, `searchParams` est asynchrone : on l'attend.
 */
export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; billing?: string }>;
}) {
  const { job, billing } = await searchParams;

  // Un métier doit obligatoirement avoir été sélectionné au catalogue : sans
  // `?job=` valide, le tunnel n'a aucun template à configurer. On renvoie alors
  // vers le catalogue (redirection serveur, sans rendu intermédiaire). Après
  // cette garde, `job` est garanti être un slug de métier connu.
  if (!isValidJob(job)) {
    redirect("/metiers");
  }

  // Schéma de sous-domaine des instances Sell Your SaaS (ex. with1.pichinov.fr).
  const domain = process.env.INSTANCE_DOMAIN ?? "with1.pichinov.fr";

  return (
    // Fond lavande pleine hauteur, tunnel centré (cf. DESIGN — écran formulaire,
    // maquette docs/screen.png).
    <div className="min-h-full bg-content">
      <div className="mx-auto w-full max-w-[640px] px-6 py-16 sm:px-8">
        {/* Le titre de page reste présent pour le SEO et la hiérarchie de titres,
            mais visuellement c'est le stepper qui ouvre l'écran (cf. maquette). */}
        <h1 className="sr-only">Inscription — créez votre instance Provi</h1>

        <InscriptionForm
          domain={domain}
          job={job}
          billing={billing ?? null}
        />
      </div>
    </div>
  );
}