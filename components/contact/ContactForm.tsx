"use client";

import { useActionState } from "react";
import Icon from "@/components/ui/Icon";
import { sendContactMessage } from "@/app/(public)/contact/actions";
import { initialContactState } from "@/app/(public)/contact/form-state";
import { CONTACT_SUBJECTS, LIMITS } from "@/lib/contact/validation";

/** Classe commune aux champs (input / select / textarea). */
const FIELD =
  "peer block w-full rounded-xl border border-border bg-surface px-4 text-[14px] text-text transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent aria-[invalid=true]:border-danger";

/** Classe du label flottant (remonte au focus ou quand le champ est rempli). */
const FLOAT_LABEL =
  "pointer-events-none absolute left-4 text-[13px] text-soft transition-all duration-200 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-dark peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider";

/**
 * Formulaire de contact (US 7.1).
 *
 * Client Component : la soumission passe par une Server Action via
 * `useActionState`, qui revalide tout côté serveur. La validation **client**
 * (attributs natifs `required`, `type="email"`, `maxLength`) s'exécute avant
 * l'envoi ; les erreurs renvoyées par le serveur sont affichées par champ et
 * annoncées aux lecteurs d'écran (`role="alert"`). Aucune valeur saisie n'est
 * réinjectée en HTML : React l'échappe automatiquement.
 */
export default function ContactForm() {
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    initialContactState,
  );
  const errors = state.status === "error" ? state.errors : undefined;

  if (state.status === "success") {
    return (
      <div className="rounded-3xl bg-surface p-10 shadow-card sm:p-12">
        <div
          role="status"
          className="flex flex-col items-center text-center"
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success">
            <Icon name="check-circle" size={32} />
          </span>
          <h2 className="mb-2 text-[18px] font-bold text-text">
            Message envoyé !
          </h2>
          <p className="mb-6 text-[13px] text-soft">
            Nous vous répondrons dans les plus brefs délais.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-border px-5 py-2 text-[13px] font-medium text-text transition-colors hover:bg-content"
          >
            Envoyer un autre message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-surface p-8 shadow-card sm:p-10">
      <h2 className="mb-8 text-[24px] leading-[32px] font-bold text-text">
        Envoyez-nous un message
      </h2>

      {/* Erreur globale (échec d'envoi serveur). */}
      {state.status === "error" && state.formError && (
        <p
          role="alert"
          className="mb-6 rounded-xl bg-danger-light px-4 py-3 text-[13px] text-danger"
        >
          {state.formError}
        </p>
      )}

      <form action={formAction} noValidate className="flex flex-col gap-6">
        {/* Piège anti-robot : hors écran et invisible aux humains, mais présent
            dans le DOM. S'il est rempli, l'envoi est ignoré côté serveur. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="company">Ne pas remplir ce champ</label>
          <input
            id="company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Nom */}
        <div className="relative">
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={LIMITS.nameMax}
            placeholder=" "
            aria-invalid={errors?.name ? true : undefined}
            aria-describedby={errors?.name ? "name-error" : undefined}
            className={`${FIELD} h-14 pt-4 pb-1`}
          />
          <label
            htmlFor="name"
            className={`${FLOAT_LABEL} top-1/2 -translate-y-1/2 peer-focus:top-3 peer-focus:translate-y-0 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0`}
          >
            Nom complet
          </label>
          {errors?.name && (
            <p id="name-error" role="alert" className="mt-1.5 text-[12px] text-danger">
              {errors.name}
            </p>
          )}
        </div>

        {/* E-mail */}
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={LIMITS.emailMax}
            placeholder=" "
            aria-invalid={errors?.email ? true : undefined}
            aria-describedby={errors?.email ? "email-error" : undefined}
            className={`${FIELD} h-14 pt-4 pb-1`}
          />
          <label
            htmlFor="email"
            className={`${FLOAT_LABEL} top-1/2 -translate-y-1/2 peer-focus:top-3 peer-focus:translate-y-0 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0`}
          >
            Adresse email
          </label>
          {errors?.email && (
            <p id="email-error" role="alert" className="mt-1.5 text-[12px] text-danger">
              {errors.email}
            </p>
          )}
        </div>

        {/* Sujet */}
        <div className="relative">
          <label htmlFor="subject" className="sr-only">
            Sujet de votre demande
          </label>
          <select
            id="subject"
            name="subject"
            required
            defaultValue=""
            aria-invalid={errors?.subject ? true : undefined}
            aria-describedby={errors?.subject ? "subject-error" : undefined}
            className={`${FIELD} h-14 appearance-none pr-10`}
          >
            <option value="" disabled>
              Sélectionnez un sujet
            </option>
            {Object.entries(CONTACT_SUBJECTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-down"
            size={20}
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-soft"
          />
          {errors?.subject && (
            <p id="subject-error" role="alert" className="mt-1.5 text-[12px] text-danger">
              {errors.subject}
            </p>
          )}
        </div>

        {/* Message */}
        <div className="relative">
          <textarea
            id="message"
            name="message"
            required
            minLength={LIMITS.messageMin}
            maxLength={LIMITS.messageMax}
            placeholder=" "
            rows={5}
            aria-invalid={errors?.message ? true : undefined}
            aria-describedby={errors?.message ? "message-error" : undefined}
            className={`${FIELD} min-h-[140px] resize-y pt-6 pb-2`}
          />
          <label
            htmlFor="message"
            className={`${FLOAT_LABEL} top-4 peer-focus:top-2 peer-[:not(:placeholder-shown)]:top-2`}
          >
            Votre message
          </label>
          {errors?.message && (
            <p id="message-error" role="alert" className="mt-1.5 text-[12px] text-danger">
              {errors.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent-dark px-5 text-[14px] font-medium text-white shadow-card transition-all hover:-translate-y-px hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Envoi en cours…" : "Envoyer le message"}
        </button>
      </form>
    </div>
  );
}
