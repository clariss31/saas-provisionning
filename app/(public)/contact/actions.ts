"use server";

import { validateContact } from "@/lib/contact/validation";
import { sendContactEmail } from "@/lib/contact/email";
import type { ContactFormState } from "./form-state";

/**
 * Traite l'envoi du formulaire de contact (US 7.1).
 *
 * Sécurité : cette Server Action est joignable par requête POST directe, pas
 * seulement via l'UI — on revalide donc **systématiquement** côté serveur et
 * on n'accorde aucune confiance aux données reçues.
 *  - Piège anti-robot (honeypot) : un champ caché qui doit rester vide.
 *  - Validation + assainissement (cf. `validateContact`).
 *  - Destinataire imposé côté serveur (`support@pichinov.com`), jamais transmis
 *    par le client.
 */
export async function sendContactMessage(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot : rempli uniquement par les robots → on simule un succès pour ne
  // pas les renseigner, sans rien envoyer.
  const honeypot = formData.get("company");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { status: "success" };
  }

  const result = validateContact({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!result.success) {
    return { status: "error", errors: result.errors };
  }

  try {
    await sendContactEmail(result.data);
  } catch {
    return {
      status: "error",
      formError:
        "L'envoi a échoué. Veuillez réessayer dans un instant ou nous écrire directement.",
    };
  }

  return { status: "success" };
}
