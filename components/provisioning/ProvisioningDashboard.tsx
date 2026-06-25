"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Icon, { type IconName } from "@/components/ui/Icon";
import DeployingView from "@/components/provisioning/DeployingView";
import { isValidJob } from "@/lib/instances/jobs";

type Props = {
  /** Raison sociale, affichée dans le message de succès. */
  companyName: string;
  /** URL de l'instance déployée (fallback de `status.url`) — bouton « Accéder à mon ERP ». */
  accessUrl: string;
  /** URL du portail client (gestion des abonnements) — bouton « Accéder à mon espace ». */
  portalUrl: string;
  /** Réf de l'instance à suivre — clé du polling de statut. */
  instanceRef: string;
  /**
   * Métier sélectionné (`?job=`), transmis depuis le tunnel. Permet, en cas de
   * réf introuvable, de proposer la reprise de l'inscription pré-paramétrée.
   */
  job?: string | null;
};

/** Intervalle d'interrogation (polling) du statut, en millisecondes. */
const POLL_MS = 2000;

/**
 * Nombre de 404 consécutifs tolérés avant de conclure « introuvable ». En live, le
 * contrat n'existe pas instantanément : le POST vers SYS est *fire-and-forget* et le
 * contrat est créé quelques secondes plus tard. On ne conclut donc pas à l'absence
 * sur le 1er 404. ~10 × POLL_MS ≈ 20 s de marge.
 */
const NOT_FOUND_LIMIT = 10;

/** Statut renvoyé par `GET /api/provisioning/[ref]`. */
type ProvisioningStatus = {
  state: "deploying" | "deployed" | "error";
  step: number;
  /** URL publique de l'instance déployée (cible du bouton « Accéder à mon espace »). */
  url?: string;
};

/**
 * Tableau de bord de provisioning (SPEC page 6, US 6.x).
 *
 * Affiché sur `/provisioning/[ref]`. Il **interroge en boucle (polling)** la route
 * `GET /api/provisioning/[ref]` pour suivre l'avancement **réel** du déploiement.
 *
 * Important : en mode **live**, SellYourSaas ne renvoie qu'un signal **binaire**
 * (`options_deployment_status` : en cours / `done` / `error`) — il n'y a PAS de
 * sous-étapes ni de pourcentage fiable. On affiche donc un **loader indéterminé**
 * ({@link DeployingView}) plutôt qu'une barre en % (qui resterait bloquée puis
 * sauterait à 100 %). À la fin, on déclenche l'e-mail « prêt » (idempotent serveur).
 */
export default function ProvisioningDashboard({
  companyName,
  accessUrl,
  portalUrl,
  instanceRef,
  job = null,
}: Props) {
  const [status, setStatus] = useState<ProvisioningStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const done = status?.state === "deployed";
  const errored = status?.state === "error";

  // Polling : on interroge le statut toutes les POLL_MS, jusqu'à un état terminal.
  useEffect(() => {
    if (done || errored || notFound) return;
    let cancelled = false;
    // En live, la création du contrat est asynchrone côté SYS → on tolère plusieurs
    // 404 d'affilée avant de conclure à un déploiement réellement introuvable.
    let notFoundCount = 0;

    async function poll() {
      try {
        const res = await fetch(`/api/provisioning/${instanceRef}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          notFoundCount += 1;
          if (notFoundCount >= NOT_FOUND_LIMIT && !cancelled) setNotFound(true);
          return;
        }
        notFoundCount = 0;
        if (!res.ok) return; // erreur transitoire : on réessaiera au tick suivant
        const data = (await res.json()) as ProvisioningStatus;
        if (!cancelled) setStatus(data);
      } catch {
        // Échec réseau transitoire : on retentera au prochain tick.
      }
    }

    poll(); // premier appel immédiat (pas d'attente initiale)
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [done, errored, notFound, instanceRef]);

  // NB : l'e-mail « votre ERP est prêt » n'est plus envoyé par l'application.
  // Il est désormais émis **côté serveur** par SellYourSaas à la fin du
  // déploiement (cron de provisioning), ce qui est plus fiable : l'envoi ne
  // dépend plus de l'onglet de suivi resté ouvert dans le navigateur.

  if (notFound) return <ProvisioningNotFound job={job} />;
  if (errored) return <ProvisioningError job={job} />;
  if (done) {
    return (
      <ProvisioningSuccess
        companyName={companyName}
        erpUrl={status?.url ?? accessUrl}
        portalUrl={portalUrl}
      />
    );
  }
  // État par défaut (statut inconnu ou « deploying ») : loader indéterminé.
  return <DeployingView companyName={companyName} />;
}

/**
 * Écran de succès : ERP prêt + **deux accès clairement distincts** — l'ERP
 * (l'outil métier au quotidien) et l'espace client Provi (gestion des
 * abonnements). Chaque carte rappelle son identifiant de connexion propre, pour
 * que l'utilisateur ne confonde pas les deux.
 */
function ProvisioningSuccess({
  companyName,
  erpUrl,
  portalUrl,
}: {
  companyName: string;
  erpUrl: string;
  portalUrl: string;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-border-light bg-surface p-8 shadow-card sm:p-12 md:p-14">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-success/10 blur-[80px]"
        aria-hidden="true"
      />

      <p className="sr-only" role="status" aria-live="polite">
        Déploiement terminé. Votre ERP est prêt.
      </p>

      <div className="relative z-10 mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-success/10 bg-success-light text-success">
        <Icon name="check-circle" size={40} />
      </div>

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="focus-silent z-10 mb-3 text-center text-[26px] font-bold text-text outline-none md:text-[30px]"
      >
        Votre ERP est prêt !
      </h1>
      <p className="z-10 mb-10 max-w-[460px] text-center text-[13.5px] leading-relaxed text-soft">
        L&apos;ERP de votre entreprise <b className="text-text">{companyName}</b> a
        été déployé avec succès. Vous disposez de{" "}
        <b className="text-text">deux accès</b> distincts :
      </p>

      <div className="z-10 grid w-full max-w-[460px] gap-4 text-left">
        {/* 1. L'ERP — l'outil métier au quotidien (accès principal, mis en avant). */}
        <AccessCard
          highlighted
          icon="grid"
          title="Votre ERP"
          description="Votre logiciel de gestion au quotidien : clients, devis, factures, stock…"
          login={
            <>
              Identifiant <b className="text-text">admin </b> + le mot de passe
              choisi à l&apos;inscription.
            </>
          }
          href={erpUrl}
          cta="Accéder à mon ERP"
        />

        {/* 2. L'espace client Provi — gestion des abonnements (accès secondaire). */}
        <AccessCard
          icon="receipt"
          title="Mon espace client Provi"
          description="Vos abonnements : factures, options, support, nouvelles instances ou résiliation."
          login={
            <>
              Connexion avec votre <b className="text-text">e-mail</b> + le même
              mot de passe.
            </>
          }
          href={portalUrl}
          cta="Accéder à mon espace"
        />
      </div>
    </div>
  );
}

/**
 * Carte d'un accès (ERP ou espace client) : icône, titre, rôle, identifiant de
 * connexion et bouton. `highlighted` met l'accès principal (l'ERP) en avant
 * (bouton plein) ; l'autre est en bouton « outline » pour hiérarchiser.
 */
function AccessCard({
  icon,
  title,
  description,
  login,
  href,
  cta,
  highlighted = false,
}: {
  icon: IconName;
  title: string;
  description: string;
  login: ReactNode;
  href: string;
  cta: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlighted
          ? "border-accent/20 bg-content"
          : "border-border-light bg-surface"
      }`}
    >
      <div className="mb-2 flex items-center gap-2.5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            highlighted
              ? "bg-accent text-white"
              : "bg-accent-light text-accent-dark"
          }`}
        >
          <Icon name={icon} size={18} />
        </span>
        <h2 className="text-[15px] font-bold text-text">{title}</h2>
      </div>
      <p className="mb-1.5 text-[13px] leading-relaxed text-soft">{description}</p>
      <p className="mb-4 text-[12px] leading-relaxed text-muted">{login}</p>
      <a
        href={href}
        className={`group flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13.5px] font-bold transition-all ${
          highlighted
            ? "bg-accent-dark text-white shadow-card hover:-translate-y-px hover:shadow-lift"
            : "border border-border text-text hover:bg-content"
        }`}
      >
        {cta}
        <Icon
          name="arrow-right"
          size={18}
          className="transition-transform group-hover:translate-x-1"
        />
      </a>
    </div>
  );
}

/**
 * Écran d'échec : le déploiement a été rejeté/échoué côté SYS
 * (`options_deployment_status = 'error'`). On propose de reprendre l'inscription.
 */
function ProvisioningError({ job }: { job?: string | null }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const resumeHref = isValidJob(job)
    ? `/inscription?job=${encodeURIComponent(job)}`
    : "/metiers";
  const resumeLabel = isValidJob(job)
    ? "Reprendre mon inscription"
    : "Choisir mon métier";

  return (
    <div className="flex flex-col items-center rounded-3xl border border-border-light bg-surface p-10 text-center shadow-card md:p-14">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-light text-danger">
        <Icon name="x" size={28} />
      </span>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="focus-silent text-[22px] font-bold text-text outline-none"
      >
        Le déploiement a échoué
      </h1>
      <p className="mt-2 max-w-[420px] text-[13.5px] text-soft">
        Une erreur est survenue pendant la création de votre espace. Aucun
        montant n&apos;a été prélevé. Vous pouvez relancer une inscription, ou
        nous contacter si le problème persiste.
      </p>
      <Link
        href={resumeHref}
        className="mt-6 text-[13px] font-medium text-accent-dark hover:underline"
      >
        {resumeLabel}
      </Link>
    </div>
  );
}

/**
 * Écran affiché si la réf de suivi est inconnue (ex. serveur redémarré en mock).
 *
 * Le lien de reprise dépend du contexte : un métier devant **obligatoirement**
 * être sélectionné, on ne renvoie jamais vers `/inscription` nu. Si le métier
 * est connu, on rouvre le tunnel pré-paramétré ; sinon on renvoie au catalogue
 * pour qu'un métier soit choisi.
 */
function ProvisioningNotFound({ job }: { job?: string | null }) {
  const resumeHref = isValidJob(job)
    ? `/inscription?job=${encodeURIComponent(job)}`
    : "/metiers";
  const resumeLabel = isValidJob(job)
    ? "Reprendre mon inscription"
    : "Choisir mon métier";

  return (
    <div className="flex flex-col items-center rounded-3xl border border-border-light bg-surface p-10 text-center shadow-card md:p-14">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-light text-danger">
        <Icon name="x" size={28} />
      </span>
      <h1 className="text-[22px] font-bold text-text">Déploiement introuvable</h1>
      <p className="mt-2 max-w-[420px] text-[13.5px] text-soft">
        Ce lien de suivi n&apos;est plus valide. Relancez une inscription pour
        créer votre espace.
      </p>
      <Link
        href={resumeHref}
        className="mt-6 text-[13px] font-medium text-accent-dark hover:underline"
      >
        {resumeLabel}
      </Link>
    </div>
  );
}
