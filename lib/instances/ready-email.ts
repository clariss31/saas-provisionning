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
  /** URL de l'instance déployée (l'ERP, l'outil métier au quotidien). */
  erpUrl: string;
  /** URL du portail client Provi (gestion des abonnements). */
  portalUrl: string;
}): Promise<void> {
  const { to, companyName, erpUrl, portalUrl } = params;

  await sendMail({
    to,
    subject: "Votre ERP est prêt",
    text: [
      "Bonjour,",
      "",
      `L'ERP de votre entreprise « ${companyName} » a été déployé et configuré avec succès.`,
      "Vous disposez désormais de DEUX accès distincts :",
      "",
      "1) VOTRE ERP — votre logiciel de gestion au quotidien (clients, devis, factures, stock…).",
      `   Accès : ${erpUrl}`,
      "   Connexion : identifiant « admin » + le mot de passe choisi à l'inscription.",
      "",
      "2) VOTRE ESPACE CLIENT PROVI — la gestion de vos abonnements : factures,",
      "   options, support, nouvelles instances ou résiliation de votre compte.",
      `   Accès : ${portalUrl}`,
      "   Connexion : votre adresse e-mail + le même mot de passe.",
      "",
      "À très vite,",
      "L'équipe Provi",
    ].join("\n"),
  });
}