"use client";

import {
  useEffect,
  useRef,
  useState,
  type Ref,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import SubdomainField, { type SubdomainStatus } from "./SubdomainField";
import ModernField, { MODERN_CONTROL } from "./ModernField";
import { scorePassword, PASSWORD_MIN_LENGTH } from "@/lib/instances/password";

type Props = {
  /** Domaine racine des instances (fourni par le serveur, ex. « pichinov.fr »). */
  domain: string;
  /** Métier pré-sélectionné via `?job=` (contexte, non déterminant pour le MVP). */
  job: string | null;
  /** Engagement pré-sélectionné via `?billing=`. */
  billing: string | null;
};

/** Réponse à la question « assujetti à la TVA ? ». */
type VatAnswer = "" | "oui" | "non";

/** Libellés des étapes (stepper). */
const STEPS = ["Identité", "Fiscalité", "Identifiants"] as const;

/** Statuts juridiques proposés (US fiscalité). */
const LEGAL_STATUSES = [
  { value: "auto-entrepreneur", label: "Auto-entrepreneur / Micro-entreprise" },
  { value: "ei", label: "Entreprise individuelle (EI)" },
  { value: "eurl", label: "EURL" },
  { value: "sarl", label: "SARL" },
  { value: "sasu", label: "SASU" },
  { value: "sas", label: "SAS" },
  { value: "sa", label: "SA" },
  { value: "autre", label: "Autre" },
] as const;

/** Motif e-mail simple mais sûr (aucun espace → aucun CR/LF). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Couleur de chaque segment de la jauge de mot de passe selon le score. */
const STRENGTH_COLORS = ["bg-danger", "bg-danger", "bg-warning", "bg-info", "bg-success"];

/**
 * Tunnel d'inscription (SPEC page 5) — design aligné sur `docs/screen.png` et
 * DESIGN.md (champs « Modern », stepper raffiné, carte blanche).
 *
 * Stepper à 3 étapes :
 *  1. **Identité** — raison sociale (avec vérification du sous-domaine, US 5.2)
 *     + nom du gérant.
 *  2. **Fiscalité** — statut juridique + assujettissement à la TVA.
 *  3. **Identifiants** — e-mail + mot de passe (jauge de robustesse).
 *
 * Chaque étape est **verrouillée** tant que ses champs ne sont pas valides. À la
 * soumission, l'instance est créée (`POST /api/inscription`) puis on redirige
 * vers le suivi du déploiement (`/provisioning/[ref]`).
 */
export default function InscriptionForm({ domain, job, billing }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Étape 1 — Identité
  const [companyName, setCompanyName] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>("idle");
  const [managerName, setManagerName] = useState("");

  // Étape 2 — Fiscalité
  const [legalStatus, setLegalStatus] = useState("");
  const [vat, setVat] = useState<VatAnswer>("");

  // Étape 3 — Identifiants
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Accessibilité : focus sur le titre de l'étape à chaque changement.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const strength = scorePassword(password);
  const emailValid = EMAIL_RE.test(email);
  const step1Valid =
    subdomainStatus === "available" && managerName.trim().length >= 2;
  const step2Valid = legalStatus !== "" && vat !== "";
  const step3Valid = emailValid && strength.acceptable;

  return (
    <>
      <Stepper step={step} />

      <div className="mt-8 rounded-3xl border border-border-light bg-surface p-8 shadow-card sm:p-10 md:p-12">
        {/* Contexte transmis par le catalogue / la grille tarifaire. */}
        {(job || billing) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {job && <ContextChip label="Métier" value={job} />}
            {billing && <ContextChip label="Offre" value={billing} />}
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!step3Valid || submitting) return;
            setSubmitting(true);
            setSubmitError(null);
            try {
              // Option B : le mot de passe est transmis en clair (sur TLS) car
              // Sell Your SaaS doit poser ce mot de passe exact sur l'admin de
              // l'instance. Il n'est jamais journalisé ni stocké côté serveur.
              const res = await fetch("/api/inscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  companyName,
                  managerName,
                  legalStatus,
                  vat,
                  email,
                  password,
                  job,
                  billing,
                }),
              });
              if (!res.ok) {
                const data = (await res.json().catch(() => null)) as
                  | { error?: string }
                  | null;
                throw new Error(data?.error ?? "La création a échoué. Réessayez.");
              }
              // Succès : on récupère la réf et on redirige vers le suivi.
              const data = (await res.json().catch(() => null)) as
                | { ref?: string }
                | null;
              if (!data?.ref) {
                throw new Error("Réponse inattendue du serveur.");
              }
              // On transmet aussi le métier : si la réf de suivi devient
              // introuvable, l'écran d'erreur peut proposer de reprendre
              // l'inscription avec le bon template pré-sélectionné.
              router.push(
                `/provisioning/${data.ref}?company=${encodeURIComponent(companyName.trim())}${
                  job ? `&job=${encodeURIComponent(job)}` : ""
                }`,
              );
            } catch (err) {
              setSubmitError(
                err instanceof Error ? err.message : "Une erreur est survenue.",
              );
            } finally {
              setSubmitting(false);
            }
          }}
          noValidate
        >
          {/* ÉTAPE 1 — Identité */}
          {step === 1 && (
            <section aria-labelledby="step-heading" className="flex flex-col gap-8">
              <StepHeader
                headingRef={headingRef}
                title="Identité de l'entreprise"
                description="Comment vos clients vous connaissent-ils ? Ces informations apparaîtront sur vos factures."
              />

              <SubdomainField
                value={companyName}
                onValueChange={setCompanyName}
                onResult={(status) => setSubdomainStatus(status)}
                domain={domain}
              />

              <ModernField id="managerName" label="Nom du gérant">
                <input
                  id="managerName"
                  name="managerName"
                  type="text"
                  required
                  autoComplete="name"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Prénom Nom"
                  className={`${MODERN_CONTROL} border-border focus:border-accent`}
                />
              </ModernField>

              <StepActions
                back={
                  <Link href="/tarifs" className={BACK_CLASS}>
                    <Icon name="arrow-left" size={18} />
                    Retour
                  </Link>
                }
                primary={
                  <PrimaryButton
                    type="button"
                    disabled={!step1Valid}
                    onClick={() => setStep(2)}
                  >
                    Continuer
                    <Icon name="arrow-right" size={18} />
                  </PrimaryButton>
                }
              />
            </section>
          )}

          {/* ÉTAPE 2 — Fiscalité */}
          {step === 2 && (
            <section aria-labelledby="step-heading" className="flex flex-col gap-8">
              <StepHeader
                headingRef={headingRef}
                title="Régime fiscal"
                description="Votre statut configure la TVA et les mentions légales de votre instance."
              />

              <ModernField id="legalStatus" label="Statut juridique">
                <select
                  id="legalStatus"
                  name="legalStatus"
                  required
                  value={legalStatus}
                  onChange={(e) => setLegalStatus(e.target.value)}
                  className={`${MODERN_CONTROL} appearance-none border-border pr-10 focus:border-accent ${
                    legalStatus === "" ? "text-muted" : ""
                  }`}
                >
                  <option value="" disabled>
                    Sélectionnez votre statut
                  </option>
                  {LEGAL_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Icon
                  name="chevron-down"
                  size={20}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-soft"
                />
              </ModernField>

              <fieldset>
                <legend className="mb-3 text-[13px] font-semibold text-text">
                  Êtes-vous assujetti à la TVA ?
                </legend>
                <div className="flex gap-3">
                  {([
                    ["oui", "Oui"],
                    ["non", "Non"],
                  ] as const).map(([val, label]) => (
                    <label
                      key={val}
                      className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-[1.5px] px-4 py-3 text-[14px] font-medium transition-all focus-within:ring-2 focus-within:ring-accent-light ${
                        vat === val
                          ? "border-accent bg-accent-light text-accent-dark"
                          : "border-border text-soft hover:border-accent/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="vat"
                        value={val}
                        checked={vat === val}
                        onChange={() => setVat(val)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <StepActions
                back={
                  <button type="button" onClick={() => setStep(1)} className={BACK_CLASS}>
                    <Icon name="arrow-left" size={18} />
                    Retour
                  </button>
                }
                primary={
                  <PrimaryButton
                    type="button"
                    disabled={!step2Valid}
                    onClick={() => setStep(3)}
                  >
                    Continuer
                    <Icon name="arrow-right" size={18} />
                  </PrimaryButton>
                }
              />
            </section>
          )}

          {/* ÉTAPE 3 — Identifiants */}
          {step === 3 && (
            <section aria-labelledby="step-heading" className="flex flex-col gap-8">
              <StepHeader
                headingRef={headingRef}
                title="Vos identifiants"
                description="Créez l'accès administrateur de votre future instance."
              />

              <ModernField id="email" label="Adresse e-mail" invalid={email.length > 0 && !emailValid}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.fr"
                  aria-invalid={email.length > 0 && !emailValid ? true : undefined}
                  aria-describedby="email-hint"
                  className={`${MODERN_CONTROL} ${
                    email.length > 0 && !emailValid
                      ? "border-danger focus:border-danger"
                      : "border-border focus:border-accent"
                  }`}
                />
                {email.length > 0 && !emailValid && (
                  <p id="email-hint" role="alert" className="mt-1.5 text-[12px] text-danger">
                    Cette adresse e-mail n&apos;est pas valide.
                  </p>
                )}
              </ModernField>

              <div>
                <ModernField id="password" label="Mot de passe">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    aria-describedby="password-strength"
                    className={`${MODERN_CONTROL} border-border focus:border-accent`}
                  />
                </ModernField>

                {/* Jauge de robustesse (4 segments). */}
                <div id="password-strength" aria-live="polite" className="mt-3">
                  <div className="flex gap-1.5" aria-hidden="true">
                    {[1, 2, 3, 4].map((seg) => (
                      <span
                        key={seg}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          password.length > 0 && seg <= strength.score
                            ? STRENGTH_COLORS[strength.score]
                            : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[12px] text-soft">
                    {password.length === 0
                      ? `Au moins ${PASSWORD_MIN_LENGTH} caractères.`
                      : `Robustesse : ${strength.label}.`}
                  </p>
                </div>
              </div>

              {submitError && (
                <p
                  role="alert"
                  className="rounded-xl bg-danger-light px-4 py-3 text-[13px] text-danger"
                >
                  {submitError}
                </p>
              )}

              <StepActions
                back={
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={submitting}
                    className={BACK_CLASS}
                  >
                    <Icon name="arrow-left" size={18} />
                    Retour
                  </button>
                }
                primary={
                  <PrimaryButton type="submit" disabled={!step3Valid || submitting}>
                    {submitting ? "Création en cours…" : "Créer mon instance"}
                    {!submitting && <Icon name="arrow-right" size={18} />}
                  </PrimaryButton>
                }
              />
            </section>
          )}
        </form>
      </div>
    </>
  );
}

/** Classe du bouton « Retour » (lien ou bouton, même apparence). */
const BACK_CLASS =
  "group inline-flex h-12 items-center gap-2 rounded-xl px-5 text-[14px] font-semibold text-soft transition-colors hover:bg-content hover:text-text";

/** Bouton d'action principal (violet, texte blanc → accent-dark pour le contraste AA). */
function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="group inline-flex h-12 items-center gap-2 rounded-xl bg-accent-dark px-8 text-[14px] font-semibold text-white shadow-card transition-all hover:-translate-y-px hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-card"
    >
      {children}
    </button>
  );
}

/** Barre d'actions en bas d'étape (Retour à gauche, action principale à droite). */
function StepActions({
  back,
  primary,
}: {
  back: ReactNode;
  primary: ReactNode;
}) {
  return (
    <div className="mt-4 flex items-center justify-between">
      {back}
      {primary}
    </div>
  );
}

/** Titre + description d'une étape (le titre reçoit le focus). */
function StepHeader({
  headingRef,
  title,
  description,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2
        id="step-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-[20px] font-bold text-text outline-none"
      >
        {title}
      </h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-soft">{description}</p>
    </div>
  );
}

/** Stepper raffiné (3 cercles reliés par des lignes). */
function Stepper({ step }: { step: number }) {
  return (
    <nav aria-label="Progression de l'inscription" className="px-2">
      <ol className="flex items-center">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const isActive = n === step;
          const isDone = n < step;
          return (
            <li key={label} className={`flex items-center ${i > 0 ? "flex-1" : ""}`}>
              {i > 0 && (
                <span
                  className={`mx-1 mb-6 h-0.5 flex-1 rounded-full ${isDone || isActive ? "bg-accent" : "bg-border"}`}
                  aria-hidden="true"
                />
              )}
              <div
                aria-current={isActive ? "step" : undefined}
                className={`flex flex-col items-center gap-2 ${isActive || isDone ? "" : "opacity-50"}`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 bg-surface ${
                    isActive
                      ? "border-accent ring-4 ring-accent/10"
                      : isDone
                        ? "border-accent"
                        : "border-border"
                  }`}
                >
                  {isDone ? (
                    <Icon name="check-circle" size={18} className="text-accent-dark" />
                  ) : isActive ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                  ) : (
                    <span className="text-[14px] font-bold text-muted">{n}</span>
                  )}
                </span>
                <span
                  className={`text-[11px] uppercase tracking-wider ${
                    isActive
                      ? "font-bold text-accent-dark"
                      : isDone
                        ? "font-medium text-soft"
                        : "font-medium text-muted"
                  }`}
                >
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Petite étiquette de contexte (métier / offre). */
function ContextChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-light px-2.5 py-1 text-[11.5px] font-medium text-accent-dark">
      <span className="uppercase tracking-wide text-accent-dark/70">{label}</span>
      {value}
    </span>
  );
}