/**
 * Métiers proposés au catalogue (SPEC §1.3).
 *
 * Source unique des **slugs valides** (`?job=`) partagée entre le catalogue, le
 * tunnel d'inscription et la validation serveur. Volontairement sans dépendance
 * (aucun import Dolibarr) afin de rester utilisable aussi bien côté serveur que
 * client. La correspondance slug → Service SYS vit, elle, dans
 * `lib/dolibarr/instances.ts` (`JOB_TO_SERVICE`) et doit rester alignée sur
 * cette liste.
 */
export const JOB_SLUGS = [
  "freelance",
  "fleuriste",
  "garagiste",
  "artisan",
] as const;

/** Slug de métier connu. */
export type JobSlug = (typeof JOB_SLUGS)[number];

/**
 * Indique si une valeur d'URL `?job=` correspond à un métier connu.
 *
 * Sert de garde au tunnel d'inscription : un métier doit obligatoirement avoir
 * été sélectionné au catalogue avant d'accéder au formulaire.
 */
export function isValidJob(value: string | null | undefined): value is JobSlug {
  return value != null && (JOB_SLUGS as readonly string[]).includes(value);
}
