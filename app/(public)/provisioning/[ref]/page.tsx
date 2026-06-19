import type { Metadata } from "next";
import ProvisioningDashboard from "@/components/provisioning/ProvisioningDashboard";

export const metadata: Metadata = {
  title: "Provi — Déploiement de votre espace",
  description: "Suivi en temps réel du déploiement de votre instance.",
};

/**
 * Page « Tableau de bord de provisioning » (SPEC page 6, US 6.x).
 *
 * Server Component : elle reçoit la réf de l'instance (segment d'URL) et la
 * raison sociale (paramètre `?company=`, transmis par le tunnel pour le message
 * de succès), puis fournit l'URL d'accès (`MASTER_INSTANCE_URL`). Tout le suivi
 * temps réel (polling) est délégué au Client Component `ProvisioningDashboard`.
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
  // URL de l'instance déployée (ERP) et URL du portail client (abonnements),
  // lues côté serveur (hors code versionné), puis passées au composant client.
  const accessUrl = process.env.MASTER_INSTANCE_URL ?? "#";
  const portalUrl = process.env.SELLYOURSAAS_ACCOUNT_URL ?? "#";

  return (
    <div className="min-h-full bg-content">
      <div className="mx-auto w-full max-w-[720px] px-6 py-16 sm:px-8">
        <ProvisioningDashboard
          instanceRef={ref}
          companyName={company?.trim() || "votre entreprise"}
          accessUrl={accessUrl}
          portalUrl={portalUrl}
          job={job ?? null}
        />
      </div>
    </div>
  );
}