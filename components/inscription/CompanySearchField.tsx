"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Icon from "@/components/ui/Icon";
import ModernField, { MODERN_CONTROL } from "./ModernField";
import { useSubdomainCheck, type SubdomainStatus } from "./useSubdomainCheck";
import type { CompanyResult } from "@/lib/instances/company";
import type { CompanySearchResponse } from "@/app/api/company/search/route";

type Props = {
  /** Valeur contrôlée de la raison sociale. */
  value: string;
  /** Remonte la raison sociale saisie (frappe libre ou nom sélectionné). */
  onValueChange: (companyName: string) => void;
  /** Remonte l'entreprise choisie dans le répertoire SIRENE (auto-remplissage). */
  onSelect: (company: CompanyResult) => void;
  /** Remonte le statut de disponibilité du sous-domaine (conditionne l'étape). */
  onSubdomainStatus: (status: SubdomainStatus) => void;
  /** Domaine racine affiché (ex. « pichinov.fr »), fourni par le serveur. */
  domain: string;
};

/** Délai avant l'appel de recherche, le temps que la saisie se stabilise. */
const DEBOUNCE_MS = 400;
/** Longueur minimale de requête avant d'interroger l'API (aligné serveur). */
const MIN_QUERY_LENGTH = 3;
/** id de l'option du dropdown pour `aria-activedescendant`. */
const optionId = (index: number) => `company-option-${index}`;

/**
 * Champ « Raison sociale » sous forme de **recherche d'entreprise** (base SIRENE).
 *
 * Inspiré du « wizard SIRENE » du module Dolibarr kaleido : on tape un nom / SIREN
 * / SIRET, l'API publique `recherche-entreprises.api.gouv.fr` (via notre proxy
 * `/api/company/search`) renvoie des suggestions ; la sélection auto-remplit les
 * informations de la société (et, en plus de kaleido, déduit le dirigeant).
 *
 * - Recherche **débattue** (debounce) + réponses obsolètes annulées (`AbortController`).
 * - Dropdown **accessible** : pattern ARIA combobox + navigation clavier
 *   (↑/↓/Entrée/Échap).
 * - Sous l'input, la **disponibilité du sous-domaine** dérivé est vérifiée en
 *   continu (US 5.2, via {@link useSubdomainCheck}).
 * - **Repli saisie libre** : si l'entreprise n'est pas encore au répertoire, on
 *   bascule en saisie manuelle (le nom alimente quand même le sous-domaine).
 */
export default function CompanySearchField({
  value,
  onValueChange,
  onSelect,
  onSubdomainStatus,
  domain,
}: Props) {
  // Disponibilité du sous-domaine dérivé (logique partagée, US 5.2).
  const { status, subdomain, reason } = useSubdomainCheck(value);

  const [results, setResults] = useState<CompanyResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Mode saisie manuelle : désactive la recherche (entreprise hors répertoire).
  const [manual, setManual] = useState(false);

  // Empêche la recherche de se relancer juste après une sélection (qui change
  // `value`). Remis à `false` dès que l'utilisateur tape à nouveau.
  const suppressRef = useRef(false);

  // --- Recherche SIRENE (debounce + abort) ---------------------------------
  useEffect(() => {
    const q = value.trim();
    if (suppressRef.current || manual || q.length < MIN_QUERY_LENGTH) {
      suppressRef.current = false;
      setResults([]);
      setOpen(false);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setOpen(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/company/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as CompanySearchResponse;
        setResults(data.results ?? []);
        setActiveIndex(-1);
        setSearching(false);
      } catch (error) {
        // Requête annulée (frappe suivante) : on ne touche à aucun état.
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, manual]);

  // Remonte le statut du sous-domaine au parent (ref → pas dans les deps).
  const onStatusRef = useRef(onSubdomainStatus);
  useEffect(() => {
    onStatusRef.current = onSubdomainStatus;
  });
  useEffect(() => {
    onStatusRef.current(status);
  }, [status]);

  /** Sélectionne une entreprise : auto-remplit et ferme le dropdown. */
  function selectCompany(company: CompanyResult) {
    suppressRef.current = true; // la maj de `value` ne doit pas relancer la recherche
    onValueChange(company.name);
    onSelect(company);
    setOpen(false);
    setResults([]);
    setActiveIndex(-1);
  }

  /** Navigation clavier dans le dropdown (pattern combobox). */
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      // Une sélection au clavier ne doit pas soumettre le formulaire.
      if (activeIndex >= 0 && activeIndex < results.length) {
        event.preventDefault();
        selectCompany(results[activeIndex]);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  const borderClass =
    status === "unavailable"
      ? "border-danger focus:border-danger"
      : "border-border focus:border-accent";
  const showDropdown = open && !manual;

  return (
    <div>
      <div className="relative">
        <ModernField id="companyName" label="Raison sociale" invalid={status === "unavailable"}>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            autoComplete="organization"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="company-listbox"
            aria-autocomplete="list"
            aria-activedescendant={
              showDropdown && activeIndex >= 0 ? optionId(activeIndex) : undefined
            }
            value={value}
            onChange={(e) => {
              suppressRef.current = false; // frappe → on autorise la recherche
              onValueChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => setOpen(false)}
            placeholder={manual ? "Nom de votre entreprise" : "Nom, SIREN ou SIRET"}
            aria-describedby="subdomain-status"
            className={`${MODERN_CONTROL} ${borderClass}`}
          />
        </ModernField>

        {/* Dropdown de suggestions (pattern listbox). */}
        {showDropdown && (
          <ul
            id="company-listbox"
            role="listbox"
            aria-label="Entreprises trouvées"
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-dropdown"
          >
            {searching && (
              <li className="flex items-center gap-2 px-4 py-3 text-[13px] text-soft">
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-accent"
                  aria-hidden="true"
                />
                Recherche en cours…
              </li>
            )}

            {!searching &&
              results.map((company, index) => {
                const meta = [
                  company.siren && `SIREN ${company.siren}`,
                  company.siret && `SIRET ${company.siret}`,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const desc = [meta, company.address].filter(Boolean).join(" — ");
                return (
                  <li
                    key={company.siret || company.siren}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === activeIndex}
                    // `mousedown` plutôt que `click` + preventDefault : conserve le
                    // focus de l'input (évite le `blur` qui fermerait le dropdown).
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectCompany(company)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`cursor-pointer px-4 py-2.5 ${
                      index === activeIndex ? "bg-accent-light" : ""
                    }`}
                  >
                    <p className="text-[14px] font-medium text-text">{company.name}</p>
                    {desc && <p className="mt-0.5 text-[12px] text-muted">{desc}</p>}
                  </li>
                );
              })}

            {!searching && results.length === 0 && (
              <li className="px-4 py-3 text-[13px] text-soft">
                Aucune entreprise trouvée.
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Pastille d'état du sous-domaine (vert si disponible, motif en rouge sinon). */}
      <div id="subdomain-status" aria-live="polite" className="mt-3 min-h-[28px]">
        {status === "checking" && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-content px-3 py-1.5 text-[12px] font-medium text-soft">
            <span
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-accent"
              aria-hidden="true"
            />
            <span>
              {subdomain}.{domain}
            </span>
          </span>
        )}

        {status === "available" && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-success/15 bg-success-light px-3 py-1.5 text-[12px] font-medium text-success-dark">
            <Icon name="check-circle" size={16} />
            <span>
              {subdomain}.{domain}
            </span>
            <span className="sr-only">Sous-domaine disponible</span>
          </span>
        )}

        {status === "unavailable" && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-danger/15 bg-danger-light px-3 py-1.5 text-[12px] font-medium text-danger">
            <Icon name="x" size={16} />
            <span>{reason ?? "Sous-domaine indisponible"}</span>
          </span>
        )}
      </div>

      {/* Bascule saisie manuelle ↔ recherche (entreprise hors répertoire SIRENE). */}
      <button
        type="button"
        onClick={() => {
          setManual((m) => !m);
          setOpen(false);
        }}
        className="mt-2 text-[12.5px] font-medium text-accent-dark underline-offset-2 hover:underline"
      >
        {manual
          ? "Rechercher mon entreprise dans le répertoire"
          : "Mon entreprise n'est pas listée — saisir manuellement"}
      </button>
    </div>
  );
}
