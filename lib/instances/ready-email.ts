import { sendMail } from "@/lib/email/mailjet";

/**
 * E-mail « Votre ERP est prêt » — envoyé quand l'instance est **déployée** (fin
 * du provisioning), et non à la soumission du formulaire.
 *
 * ⚠️ Module strictement serveur (importe le transport MailJet). Ne contient
 * jamais le mot de passe.
 */
export async function sendInstanceReadyEmail(params: {
  to: string;
  companyName: string;
  /** URL d'accès à l'espace déployé. */
  url: string;
}): Promise<void> {
  const { to, companyName, url } = params;

  await sendMail({
    to,
    subject: "Votre ERP est prêt",
    text: [
      "Bonjour,",
      "",
      `L'ERP de votre entreprise « ${companyName} » a été déployé et configuré avec succès.`,
      "Vous pouvez dès à présent démarrer votre activité.",
      "",
      `Accéder à votre espace : ${url}`,
      "",
      "À très vite,",
      "L'équipe Provi",
    ].join("\n"),
  });
}