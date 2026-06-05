import Mailjet from "node-mailjet";

/**
 * Transport e-mail mutualisé (MailJet Send API v3.1).
 *
 * ⚠️ Module **strictement serveur** : il porte les clés MailJet et ne doit être
 * importé que par du code serveur (Server Actions, Route Handlers). Réutilisé
 * par le formulaire de contact et l'e-mail de bienvenue à l'inscription.
 *
 * Sans clés configurées (`MJ_APIKEY_PUBLIC` / `MJ_APIKEY_PRIVATE`), l'envoi
 * retombe sur une simple journalisation côté serveur — pratique en développement.
 */

/** Adresse expéditrice (doit être un expéditeur validé dans MailJet). */
const MAIL_FROM = process.env.MAIL_FROM ?? "contact@pichinov.com";

/** Message générique prêt à être envoyé. */
export type OutgoingEmail = {
  to: string;
  subject: string;
  /** Corps en texte brut (aucun HTML → pas d'injection dans le client mail). */
  text: string;
  /** Adresse de réponse (ex. l'expéditeur d'un formulaire de contact). */
  replyTo?: string;
  /** Nom affiché de l'expéditeur (défaut : « Provi »). */
  fromName?: string;
};

/**
 * Envoie un e-mail via MailJet, ou le journalise si les clés sont absentes.
 *
 * @throws Error si MailJet est configuré mais répond en échec. Le détail
 *   technique est journalisé côté serveur, pas propagé à l'appelant.
 */
export async function sendMail(email: OutgoingEmail): Promise<void> {
  const apiKey = process.env.MJ_APIKEY_PUBLIC;
  const apiSecret = process.env.MJ_APIKEY_PRIVATE;

  if (!apiKey || !apiSecret) {
    console.info(
      `[mail] (repli dev — MailJet non configuré) à ${email.to} — sujet « ${email.subject} »`,
    );
    return;
  }

  const mailjet = Mailjet.apiConnect(apiKey, apiSecret);
  try {
    await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: { Email: MAIL_FROM, Name: email.fromName ?? "Provi" },
          To: [{ Email: email.to }],
          ...(email.replyTo ? { ReplyTo: { Email: email.replyTo } } : {}),
          Subject: email.subject,
          TextPart: email.text,
        },
      ],
    });
  } catch (error) {
    console.error("[mail] échec de l'envoi MailJet :", error);
    throw new Error("Échec de l'envoi de l'e-mail.");
  }
}