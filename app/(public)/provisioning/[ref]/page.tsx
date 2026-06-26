import type { Metadata } from "next";
import ProvisioningDashboard from "@/components/provisioning/ProvisioningDashboard";
import { slugify } from "@/lib/instances/subdomain";
import { instanceUrl } from "@/lib/dolibarr/instances";

export const metadata: Metadata = {
  title: "Provi — Déploiement de votre espace",
  description: "Suivi en temps réel du déploiement de votre instance.",
};

/**
 * Page « Tableau de bord de provisioning » (SPEC page 6, US 6.x).
 *
 * Server Component : elle reçoit la réf de l'instance (segment d'URL) et la
 * raison sociale (paramètre `?company=`, transmis par le tunnel pour le message
 * de succès). Tout le suivi temps réel (polling) est délégué au Client Component
 * `ProvisioningDashboard`, qui lit l'URL **réelle** de l'instance dans le statut.
 */
export default async function ProvisioningPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ company?: string; job?: string }>;
}) {
  const { ref } = await params;
  const { company, job } = await searchParams;
  const companyName = company?.trim() || "votre entreprise";

  // URL de repli de l'ERP. Le tableau de bord privilégie l'URL **réelle** de
  // l'instance remontée par le statut (`status.url`) ; ce repli ne sert que tant
  // que le statut n'est pas encore disponible (écran « finalisation longue »). On
  // la reconstruit depuis la raison sociale : le sous-domaine est exactement
  // `slugify(companyName)` — même dérivation que la route d'inscription.
  const subdomain = slugify(company?.trim() ?? "");
  const accessUrl = subdomain ? instanceUrl(subdomain) : "#";
  // URL du portail client (gestion des abonnements) — bouton « Accéder à mon espace ».
  const portalUrl = process.env.SELLYOURSAAS_ACCOUNT_URL ?? "#";

  return (
    <div className="min-h-full bg-content">
      <div className="mx-auto w-full max-w-[720px] px-6 py-16 sm:px-8">
        <ProvisioningDashboard
          instanceRef={ref}
          companyName={companyName}
          accessUrl={accessUrl}
          portalUrl={portalUrl}
          job={job ?? null}
        />
      </div>
    </div>
  );
}