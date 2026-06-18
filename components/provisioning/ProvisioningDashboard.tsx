"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { isValidJob } from "@/lib/instances/jobs";

type Props = {
  /** Raison sociale, affichée dans le message de succès. */
  companyName: string;
  /** URL de l'espace une fois déployé (bouton « Accéder à mon espace »). */
  accessUrl: string;
  /** Réf de l'instance à suivre — clé du polling de statut. */
  instanceRef: string;
  /**
   * Métier sélectionné (`?job=`), transmis depuis le tunnel. Permet, en cas de
   * réf introuvable, de proposer la reprise de l'inscription pré-paramétrée.
   */
  job?: string | null;
};

/** Sous-étapes de déploiement affichées dans le stepper vertical (SPEC page 6). */
const STEPS = [
  "Création de la base de données",
  "Création de l'interface",
  "Configuration des modules métiers",
  "Génération des accès administrateur",
] as const;

/** Intervalle d'interrogation (polling) du statut, en millisecondes. */
const POLL_MS = 2000;

/**
 * Nombre de 404 consécutifs tolérés avant de conclure « introuvable ». En live, le
 * contrat n'existe pas instantanément : le POST vers SYS est *fire-and-forget* et le
 * contrat est créé quelques secondes plus tard. On ne conclut donc pas à l'absence
 * sur le 1er 404. ~10 × POLL_MS ≈ 20 s de marge.
 */
const NOT_FOUND_LIMIT = 10;

type StepStatus = "done" | "active" | "pending";

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
 * Affiché sur `/provisioning/[ref]`. Il **interroge en boucle (polling)** la
 * route `GET /api/provisioning/[ref]` pour suivre l'avancement **réel** du
 * déploiement (simulé côté serveur en mode mock), jusqu'à l'état « déployé ».
 *
 * À la fin, il déclenche l'e-mail « Votre ERP est prêt » via
 * `POST /api/provisioning/notify` (idempotent côté serveur).
 */
export default function ProvisioningDashboard({
  companyName,
  accessUrl,
  instanceRef,
  job = null,
}: Props) {
  const [status, setStatus] = useState<ProvisioningStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const done = status?.state === "deployed";

  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Polling : on interroge le statut toutes les POLL_MS, jusqu'au déploiement.
  useEffect(() => {
    if (done || notFound) return;
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
  }, [done, notFound, instanceRef]);

  // À la fin du déploiement, on déclenche (une seule fois) l'e-mail « prêt ».
  // L'idempotence est aussi garantie côté serveur (`claimReadyNotification`).
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (!done || notifiedRef.current) return;
    notifiedRef.current = true;
    void fetch("/api/provisioning/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: instanceRef }),
    }).catch(() => {
      // Échec réseau : non bloquant (l'écran reste « prêt »).
    });
  }, [done, instanceRef]);

  // Dérivés d'affichage : nb d'étapes terminées, étape active, pourcentage.
  const serverStep = status?.step ?? 0;
  const completed = done ? STEPS.length : Math.max(0, serverStep - 1);
  const activeIndex = done ? -1 : Math.min(STEPS.length - 1, completed);
  const progress = done
    ? 100
    : Math.round(((completed + 0.5) / STEPS.length) * 100);
  const percent = progress;

  function statusOf(i: number): StepStatus {
    if (done || i < completed) return "done";
    if (i === activeIndex) return "active";
    return "pending";
  }

  if (notFound) {
    return <ProvisioningNotFound job={job} />;
  }

  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-border-light bg-surface p-8 shadow-card sm:p-12 md:p-14">
      {/* Halo décoratif diffus (violet en cours, vert au succès). */}
      <div
        className={`pointer-events-none absolute -top-24 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full blur-[80px] ${
          done ? "bg-success/10" : "bg-accent/5"
        }`}
        aria-hidden="true"
      />

      {/* Annonce d'état pour les lecteurs d'écran (mise à jour à chaque étape). */}
      <p className="sr-only" role="status" aria-live="polite">
        {done
          ? "Déploiement terminé. Votre espace est prêt."
          : `Étape ${Math.min(completed + 1, STEPS.length)} sur ${STEPS.length} : ${STEPS[Math.min(completed, STEPS.length - 1)]}`}
      </p>

      {/* Icône d'état. */}
      <div
        className={`relative z-10 mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border ${
          done
            ? "border-success/10 bg-success-light text-success"
            : "border-accent/10 bg-content text-accent"
        }`}
      >
        {done ? (
          <Icon name="check-circle" size={40} />
        ) : (
          <span
            className="h-10 w-10 animate-spin rounded-full border-[3px] border-accent/20 border-t-accent"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Titre + description. */}
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="z-10 mb-3 text-center text-[26px] font-bold text-text outline-none md:text-[30px]"
      >
        {done ? "Votre ERP est prêt !" : "Nous préparons votre ERP…"}
      </h1>
      <p className="z-10 mb-10 max-w-[460px] text-center text-[13.5px] leading-relaxed text-soft">
        {done ? (
          <>
            L&apos;ERP de votre entreprise <b className="text-text">{companyName}</b> a
            été déployé et configuré avec succès. Vous pouvez dès à présent démarrer
            votre activité.
          </>
        ) : (
          "Veuillez patienter pendant que nous configurons votre espace dédié. Cette opération prend généralement moins d'une minute."
        )}
      </p>

      {/* Barre de progression. */}
      <div className="z-10 mb-12 w-full max-w-[480px]">
        <div className="mb-2.5 flex items-end justify-between">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider ${done ? "text-success" : "text-accent-dark"}`}
          >
            {done ? "Déploiement terminé" : "Déploiement en cours"}
          </span>
          <span className={`text-[12px] font-bold ${done ? "text-success" : "text-soft"}`}>
            {percent}%
          </span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-content"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progression du déploiement"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-200 ease-out ${done ? "bg-success" : "bg-accent"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stepper vertical. */}
      <ol className="z-10 w-full max-w-[400px]">
        {STEPS.map((label, i) => {
          const status = statusOf(i);
          const isLast = i === STEPS.length - 1;
          return (
            <li key={label} className="flex gap-4">
              {/* Colonne gauche : pastille + ligne de liaison. */}
              <div className="flex flex-col items-center self-stretch">
                <StepCircle status={status} success={done} />
                {!isLast && (
                  <span
                    className={`my-1 w-[1.5px] flex-1 rounded-full ${
                      i < completed
                        ? done
                          ? "bg-success/30"
                          : "bg-accent"
                        : "bg-border"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Colonne droite : libellé + sous-statut. */}
              <div className={`${isLast ? "pb-0" : "pb-8"} ${status === "pending" ? "opacity-40" : ""}`}>
                <p
                  className={`text-[15px] font-semibold leading-tight ${
                    status === "active" ? "text-accent-dark" : "text-text"
                  }`}
                >
                  {label}
                </p>
                {!done && status === "done" && (
                  <p className="mt-0.5 text-[12px] text-accent-dark/70">Terminé avec succès</p>
                )}
                {!done && status === "active" && (
                  <p className="mt-0.5 text-[12px] text-soft">En cours…</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Rappel des identifiants + CTA final (état succès uniquement). */}
      {done && (
        <div className="z-10 mt-12 flex w-full max-w-[400px] flex-col gap-4">
          {/* Le login de l'admin de l'instance est TOUJOURS `admin` (posé par
              Sell Your SaaS) ; le mot de passe est celui choisi au questionnaire.
              On le rappelle ici pour que le client sache comment se connecter. */}
          <p className="rounded-xl border border-border-light bg-content px-4 py-3 text-center text-[13px] leading-relaxed text-soft">
            Connectez-vous avec l&apos;identifiant{" "}
            <b className="text-text">admin</b> et le mot de passe que vous avez
            choisi lors de votre inscription.
          </p>
          <a
            // Priorité à l'URL réelle de l'instance déployée (remontée par le statut) ;
            // `accessUrl` n'est qu'un repli (jamais utilisé une fois « déployé »).
            href={status?.url ?? accessUrl}
            className="group flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-accent-dark text-[14px] font-bold text-white shadow-card transition-all hover:-translate-y-px hover:shadow-lift"
          >
            Accéder à mon espace
            <Icon
              name="arrow-right"
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
        </div>
      )}
    </div>
  );
}

/** Pastille d'une étape du stepper vertical. */
function StepCircle({ status, success }: { status: StepStatus; success: boolean }) {
  if (status === "done") {
    return (
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          success
            ? "bg-success-light text-success"
            : "border-[1.5px] border-accent bg-surface text-accent-dark"
        }`}
      >
        <Icon name="check" size={14} />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent bg-content">
        <span
          className="h-3 w-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
          aria-hidden="true"
        />
      </span>
    );
  }
  // pending
  return (
    <span className="h-6 w-6 shrink-0 rounded-full border-[1.5px] border-border bg-surface" />
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