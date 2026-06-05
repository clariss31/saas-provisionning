"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";

type Props = {
  /** Raison sociale, affichée dans le message de succès. */
  companyName: string;
  /** URL de l'espace une fois déployé (bouton « Accéder à mon espace »). */
  accessUrl: string;
  /**
   * Réf de l'instance. Quand le déploiement atteint « prêt », le dashboard
   * notifie le serveur (`POST /api/provisioning/notify`) pour déclencher
   * l'e-mail « Votre ERP est prêt ». Optionnelle (pas de notification sans réf).
   */
  instanceRef?: string | null;
};

/** Sous-étapes de déploiement affichées dans le stepper vertical (SPEC page 6). */
const STEPS = [
  "Création de la base de données",
  "Création de l'interface",
  "Configuration des modules métiers",
  "Génération des accès administrateur",
] as const;

/** Durée totale de la simulation (mock) et fréquence de rafraîchissement. */
const TOTAL_MS = 6000;
const TICK_MS = 60;

type StepStatus = "done" | "active" | "pending";

/**
 * Tableau de bord de provisioning (SPEC page 6, US 6.x).
 *
 * Affiché à la fin du tunnel d'inscription. Pour l'instant, l'avancement est
 * **simulé** côté client (données mockées) : une barre de progression et un
 * stepper vertical passent de « en cours » à « terminé », puis l'état bascule
 * sur le succès avec un bouton vers l'espace déployé.
 *
 * À la fin du déploiement, le dashboard déclenche l'e-mail « Votre ERP est prêt »
 * via `POST /api/provisioning/notify` (Lot 4).
 *
 * TODO(Lot 5) : remplacer la simulation client par un vrai polling de
 * `GET /api/provisioning/[ref]` (statut réel issu du Dolibarr Maître).
 */
export default function ProvisioningDashboard({
  companyName,
  accessUrl,
  instanceRef,
}: Props) {
  const [progress, setProgress] = useState(0);
  const done = progress >= 100;

  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Progression simulée : la barre se remplit régulièrement jusqu'à 100 %.
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setProgress((p) => Math.min(100, p + (100 * TICK_MS) / TOTAL_MS));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [done]);

  // Quand le déploiement est terminé, on déclenche (une seule fois) l'e-mail
  // « Votre ERP est prêt » côté serveur. L'idempotence est aussi garantie côté
  // serveur (`claimReadyNotification`), ce garde évite juste un appel en double.
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (!done || !instanceRef || notifiedRef.current) return;
    notifiedRef.current = true;
    void fetch("/api/provisioning/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: instanceRef }),
    }).catch(() => {
      // Échec réseau : non bloquant pour l'utilisateur (l'écran reste « prêt »).
    });
  }, [done, instanceRef]);

  // Nombre d'étapes terminées (chaque étape = 25 %) et étape active courante.
  const completed = Math.min(STEPS.length, Math.floor(progress / 25));
  const percent = Math.round(progress);

  function statusOf(i: number): StepStatus {
    if (done || i < completed) return "done";
    if (i === completed) return "active";
    return "pending";
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

      {/* CTA final (état succès uniquement). */}
      {done && (
        <a
          href={accessUrl}
          className="group z-10 mt-12 flex h-[52px] w-full max-w-[400px] items-center justify-center gap-2.5 rounded-xl bg-accent-dark text-[14px] font-bold text-white shadow-card transition-all hover:-translate-y-px hover:shadow-lift"
        >
          Accéder à mon espace
          <Icon
            name="arrow-right"
            size={20}
            className="transition-transform group-hover:translate-x-1"
          />
        </a>
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