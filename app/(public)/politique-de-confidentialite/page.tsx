import type { Metadata } from "next";
import LegalLayout, { Placeholder } from "@/components/legal/LegalLayout";

/**
 * Métadonnées SEO de la page « Politique de confidentialité ».
 */
export const metadata: Metadata = {
  title: "Provi — Politique de confidentialité",
  description:
    "Comment Provi collecte, utilise et protège vos données personnelles, et comment exercer vos droits (RGPD).",
};

/** Date de dernière mise à jour (statique, à actualiser à chaque révision). */
const LAST_UPDATED = "19 juin 2026";

/**
 * Page « Politique de confidentialité » (RGPD — Règlement (UE) 2016/679 et loi
 * « Informatique et Libertés »).
 *
 * Server Component statique. Elle décrit les traitements réellement opérés par
 * l'application : inscription (création d'instance ERP), formulaire de contact,
 * envoi d'e-mails transactionnels, provisionnement. Les éléments non encore
 * arrêtés (DPO, durées exactes, liste définitive des sous-traitants, hébergeur)
 * sont laissés en {@link Placeholder}.
 *
 * Distinction importante : pour les données saisies sur le site (inscription,
 * contact), Provi SAS est *responsable de traitement* ; pour les données
 * métier saisies par le client à l'intérieur de son instance ERP, Provi SAS
 * agit en qualité de *sous-traitant* au sens de l'article 28 du RGPD.
 */
export default function PolitiqueDeConfidentialitePage() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      lastUpdated={LAST_UPDATED}
    >
      <p>
        La présente politique décrit la manière dont Provi SAS (« Provi »,
        « nous ») collecte, utilise et protège vos données à caractère personnel,
        conformément au Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) et à la
        loi n° 78-17 du 6 janvier 1978 modifiée, dite « Informatique et
        Libertés ».
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable des traitements réalisés sur ce site est Provi SAS, dont
        les coordonnées figurent dans les{" "}
        <a href="/mentions-legales">mentions légales</a>. Pour toute question
        relative à vos données, vous pouvez nous contacter à{" "}
        <a href="mailto:contact@provi.com">contact@provi.com</a>.
      </p>

      <h2>2. Délégué à la protection des données (DPO)</h2>
      <p>
        Vous pouvez contacter notre délégué à la protection des données à
        l&apos;adresse suivante :{" "}
        <Placeholder>
          adresse e-mail du DPO, ou mention « non désigné » le cas échéant
        </Placeholder>
        .
      </p>

      <h2>3. Données que nous collectons</h2>

      <h3>Lors de la création de votre instance</h3>
      <p>
        Au cours du tunnel d&apos;inscription, nous collectons les informations
        nécessaires à la création et à la configuration de votre instance :
      </p>
      <ul>
        <li>
          <strong>Identité et entreprise :</strong> raison sociale, nom du
          gérant, statut juridique, assujettissement à la TVA ;
        </li>
        <li>
          <strong>Compte administrateur :</strong> adresse e-mail et mot de
          passe.
        </li>
      </ul>
      <p>
        Le mot de passe que vous choisissez sert uniquement à configurer
        l&apos;accès administrateur de votre instance. Il est transmis via une
        connexion chiffrée (HTTPS) et n&apos;est ni journalisé ni conservé sur
        nos serveurs.
      </p>

      <h3>Lorsque vous nous contactez</h3>
      <p>
        Via le formulaire de contact, nous traitons les données que vous nous
        transmettez (par exemple nom, adresse e-mail et contenu de votre
        message) afin de répondre à votre demande.
      </p>

      <h3>Données de navigation</h3>
      <p>
        Lors de votre visite, des données techniques peuvent être enregistrées
        (adresse IP, type de navigateur, pages consultées, journaux de
        connexion) à des fins de sécurité et de bon fonctionnement du service.
      </p>

      <h3>Données hébergées dans votre instance ERP</h3>
      <p>
        Votre instance peut contenir des données personnelles que vous y saisissez
        (clients, fournisseurs, salariés, factures…). Pour ces données, vous
        restez responsable de traitement et Provi SAS agit en qualité de{" "}
        <strong>sous-traitant</strong> au sens de l&apos;article 28 du RGPD, dans
        les conditions prévues par{" "}
        <Placeholder>
          référence au contrat / aux conditions de sous-traitance (accord de
          traitement des données)
        </Placeholder>
        .
      </p>

      <h2>4. Finalités et bases légales</h2>
      <ul>
        <li>
          <strong>Création et gestion de votre instance</strong> — exécution du
          contrat (art. 6.1.b) ;
        </li>
        <li>
          <strong>Gestion de la relation client et réponse à vos demandes</strong>{" "}
          — exécution de mesures précontractuelles ou intérêt légitime
          (art. 6.1.b / 6.1.f) ;
        </li>
        <li>
          <strong>Facturation et obligations comptables</strong> — respect
          d&apos;une obligation légale (art. 6.1.c) ;
        </li>
        <li>
          <strong>Sécurité, prévention de la fraude et amélioration du
          service</strong>{" "}
          — intérêt légitime (art. 6.1.f) ;
        </li>
        <li>
          <strong>Envoi d&apos;e-mails transactionnels</strong> (confirmation,
          instance prête, suivi de déploiement) — exécution du contrat
          (art. 6.1.b) ;
        </li>
        <li>
          <strong>
            Communications commerciales et cookies non essentiels
          </strong>{" "}
          — consentement (art. 6.1.a), lorsqu&apos;ils sont mis en œuvre.
        </li>
      </ul>

      <h2>5. Destinataires et sous-traitants</h2>
      <p>
        Vos données sont traitées par les équipes habilitées de Provi SAS et par
        des prestataires (sous-traitants) agissant pour notre compte et soumis à
        des obligations contractuelles de confidentialité et de sécurité :
      </p>
      <ul>
        <li>
          <strong>Hébergement</strong> :{" "}
          <Placeholder>nom de l&apos;hébergeur</Placeholder> ;
        </li>
        <li>
          <strong>Envoi d&apos;e-mails transactionnels</strong> : Mailjet ;
        </li>
        <li>
          <strong>Provisionnement des instances</strong> : Sell Your SaaS /
          DoliCloud ;
        </li>
        <li>
          <strong>Paiement et facturation</strong> :{" "}
          <Placeholder>
            prestataire de paiement (ex. Stripe) et modalités
          </Placeholder>{" "}
          ;
        </li>
        <li>
          <strong>Autres prestataires éventuels</strong> :{" "}
          <Placeholder>
            tout autre sous-traitant (analytics, support…) le cas échéant
          </Placeholder>
          .
        </li>
      </ul>
      <p>
        Vos données ne sont jamais vendues. Elles peuvent être communiquées aux
        autorités administratives ou judiciaires lorsque la loi l&apos;exige.
      </p>

      <h2>6. Durées de conservation</h2>
      <ul>
        <li>
          <strong>Données de compte et d&apos;instance :</strong> pendant toute
          la durée de la relation contractuelle, puis{" "}
          <Placeholder>durée d&apos;archivage après résiliation</Placeholder> ;
        </li>
        <li>
          <strong>Demandes de contact / prospects :</strong>{" "}
          <Placeholder>durée (ex. 3 ans à compter du dernier contact)</Placeholder>{" "}
          ;
        </li>
        <li>
          <strong>Documents comptables et factures :</strong> 10 ans
          (obligation légale) ;
        </li>
        <li>
          <strong>Journaux de connexion :</strong>{" "}
          <Placeholder>durée de conservation des logs (ex. 12 mois)</Placeholder>
          .
        </li>
      </ul>

      <h2>7. Transferts hors de l&apos;Union européenne</h2>
      <p>
        Nous privilégions un hébergement et des prestataires situés dans
        l&apos;Union européenne. En cas de transfert de données vers un pays
        tiers, celui-ci est encadré par des garanties appropriées (décision
        d&apos;adéquation ou clauses contractuelles types de la Commission
        européenne) :{" "}
        <Placeholder>
          préciser les transferts éventuels et les garanties associées
        </Placeholder>
        .
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles
        appropriées pour protéger vos données : chiffrement des échanges (HTTPS),
        cloisonnement des instances, contrôle des accès, sauvegardes et
        journalisation. Aucune transmission ou conservation ne pouvant être
        garantie totalement infaillible, nous ne pouvons assurer une sécurité
        absolue.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Le site utilise les cookies strictement nécessaires à son
        fonctionnement, qui ne requièrent pas votre consentement. Tout cookie de
        mesure d&apos;audience ou de marketing ne serait déposé qu&apos;après
        recueil de votre consentement, que vous pouvez retirer à tout moment :{" "}
        <Placeholder>
          détailler les cookies réellement déposés et l&apos;outil de gestion du
          consentement, si applicable
        </Placeholder>
        .
      </p>

      <h2>10. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez des droits suivants sur vos données :
      </p>
      <ul>
        <li>droit d&apos;accès et de rectification ;</li>
        <li>droit à l&apos;effacement (« droit à l&apos;oubli ») ;</li>
        <li>droit à la limitation du traitement ;</li>
        <li>droit d&apos;opposition, pour un motif légitime ;</li>
        <li>droit à la portabilité de vos données ;</li>
        <li>
          droit de définir des directives relatives au sort de vos données après
          votre décès.
        </li>
      </ul>
      <p>
        Pour exercer ces droits, écrivez-nous à{" "}
        <a href="mailto:contact@provi.com">contact@provi.com</a> en justifiant de
        votre identité. Nous répondons dans un délai d&apos;un mois.
      </p>

      <h2>11. Réclamation auprès de la CNIL</h2>
      <p>
        Si vous estimez, après nous avoir contactés, que vos droits ne sont pas
        respectés, vous pouvez introduire une réclamation auprès de la
        Commission nationale de l&apos;informatique et des libertés (CNIL) —{" "}
        <a
          href="https://www.cnil.fr"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.cnil.fr
        </a>
        .
      </p>

      <h2>12. Modifications de la politique</h2>
      <p>
        La présente politique peut être modifiée pour refléter l&apos;évolution
        du service ou de la réglementation. La date de dernière mise à jour
        figure en tête de page ; nous vous invitons à la consulter régulièrement.
      </p>
    </LegalLayout>
  );
}
