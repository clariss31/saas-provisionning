import type { ContactFieldErrors } from "@/lib/contact/validation";

/**
 * État du formulaire de contact partagé entre la Server Action et l'UI.
 *
 * Ce module n'est volontairement PAS marqué `"use server"` : un fichier
 * `"use server"` ne peut exporter que des fonctions async. Le type et la
 * valeur initiale vivent donc ici, importables côté client comme serveur.
 */
export type ContactFormState = {
  status: "idle" | "success" | "error";
  /** Erreurs par champ (validation). */
  errors?: ContactFieldErrors;
  /** Erreur globale (échec d'envoi côté serveur). */
  formError?: string;
};

/** État initial du formulaire. */
export const initialContactState: ContactFormState = { status: "idle" };
