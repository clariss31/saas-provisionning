"use client";

import { useEffect, useState } from "react";

/**
 * Messages de réassurance qui évoluent avec le temps écoulé (en secondes).
 *
 * Le back-end (SellYourSaas) ne renvoie qu'un signal **binaire** « en cours / prêt »,
 * et la durée réelle varie (de quelques secondes à ~5 min) : on n'affiche donc **pas**
 * de pourcentage ni d'étapes (impossibles à refléter honnêtement) — on rassure par
 * paliers de temps, sous une barre de progression indéterminée.
 */
const MESSAGES = [
  { after: 0, text: "Veuillez patienter pendant que nous configurons votre espace dédié." },
  { after: 25, text: "Configuration de votre ERP… cela prend généralement une à trois minutes." },
  { after: 90, text: "Encore quelques instants, votre espace sera bientôt prêt." },
  { after: 210, text: "C'est un peu plus long que d'habitude — merci de patienter, votre espace arrive." },
] as const;

type Props = {
  /** Raison sociale, rappelée dans le sous-titre si fournie. */
  companyName?: string;
};

/**
 * Écran « déploiement en cours » — loader **indéterminé** (sans pourcentage ni
 * étapes). Partagé entre le tunnel d'inscription (affiché dès le clic « Créer mon
 * instance ») et le tableau de bord de suivi (`/provisioning/[ref]`), pour une
 * **expérience de chargement continue** : on tombe directement sur le loader, qui
 * se poursuit à l'identique après la redirection.
 */
export default function DeployingView({ companyName }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const message =
    [...MESSAGES].reverse().find((m) => elapsed >= m.after)?.text ?? MESSAGES[0].text;

  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-border-light bg-surface p-8 shadow-card sm:p-12 md:p-14">
      {/* Halo décoratif diffus. */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-accent/5 blur-[80px]"
        aria-hidden="true"
      />

      {/* Annonce d'état pour les lecteurs d'écran (mise à jour par paliers). */}
      <p className="sr-only" role="status" aria-live="polite">
        Déploiement en cours. {message}
      </p>

      {/* Icône animée. */}
      <div className="relative z-10 mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-accent/10 bg-content text-accent">
        <span
          className="h-10 w-10 animate-spin rounded-full border-[3px] border-accent/20 border-t-accent"
          aria-hidden="true"
        />
      </div>

      {/* Titre + message évolutif. */}
      <h1 className="z-10 mb-3 text-center text-[26px] font-bold text-text md:text-[30px]">
        Nous préparons votre ERP…
      </h1>
      <p className="z-10 mb-12 max-w-[460px] text-center text-[13.5px] leading-relaxed text-soft">
        {companyName ? (
          <>
            Espace de <b className="text-text">{companyName}</b> — {message}
          </>
        ) : (
          message
        )}
      </p>

      {/* Barre de progression INDÉTERMINÉE (pas de pourcentage : le back-end ne
          renvoie qu'un signal binaire « en cours / prêt »). */}
      <div className="z-10 w-full max-w-[480px]">
        <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-wider text-accent-dark">
          Déploiement en cours
        </span>
        <div
          className="relative h-2 w-full overflow-hidden rounded-full bg-content"
          role="progressbar"
          aria-label="Déploiement en cours"
        >
          {/* role=progressbar sans aria-valuenow ⇒ progression indéterminée. */}
          <div className="provi-indeterminate absolute inset-y-0 left-0 w-2/5 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}
