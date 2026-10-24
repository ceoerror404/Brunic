"use client";

import { useEffect, useId, useState } from "react";
import type { QuantityRule, SalesUnit } from "@/lib/catalog/types";
import { formatQuantity, UNIT_NAME } from "@/lib/catalog/product";
import { Icon } from "@/components/ui/icon";

const round = (n: number) => Math.round(n * 100) / 100;

/** "2,5" of "2.5" → 2.5; leeg of ongeldig → NaN. */
function parseDecimal(text: string): number {
  const t = text.trim().replace(",", ".");
  return t === "" ? Number.NaN : Number(t);
}

/**
 * Tekstveld voor meterware: de invoer blijft lokaal tijdens het typen (een leeg veld
 * verwijdert dus niets) en wordt pas bij verlaten gecorrigeerd naar min/stap/max.
 * Komma en punt zijn allebei geldig als decimaalteken.
 */
function DecimalField({ id, value, rule, onChange }: { id: string; value: number; rule: QuantityRule; onChange: (q: number) => void }) {
  const [draft, setDraft] = useState(formatQuantity(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setDraft(formatQuantity(value));
  }, [value, editing]);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={draft}
      onFocus={() => setEditing(true)}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = parseDecimal(e.target.value);
        if (Number.isFinite(n) && n >= rule.min && (rule.max === undefined || n <= rule.max)) onChange(n);
      }}
      onBlur={() => {
        setEditing(false);
        const n = clampQuantity(parseDecimal(draft), rule);
        setDraft(formatQuantity(n));
        onChange(n);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="h-full w-14 bg-transparent text-center text-[15px]"
    />
  );
}

/** Snap naar de stapgrootte en binnen min/max. */
export function clampQuantity(q: number, rule: QuantityRule): number {
  if (!Number.isFinite(q)) return rule.min;
  const stepped = rule.min + Math.round((q - rule.min) / rule.step) * rule.step;
  return round(Math.min(rule.max ?? 999, Math.max(rule.min, stepped)));
}

/**
 * Hoeveelheid kiezen in de verkoopeenheid. Stuks/rollen: keuzelijst (zoals de
 * referentie). Meter/m²: −/+ met invoerveld (decimaal, stap uit de productregel).
 */
export function QuantityInput({
  unit,
  rule,
  value,
  onChange,
  compact = false,
}: {
  unit: SalesUnit;
  rule: QuantityRule;
  value: number;
  onChange: (q: number) => void;
  compact?: boolean;
}) {
  const id = useId();
  const decimal = unit === "meter" || unit === "m2";

  if (!decimal) {
    const max = Math.min(rule.max ?? 10, 20);
    const options: number[] = [];
    for (let q = rule.min; q <= max; q += rule.step) options.push(q);
    // De huidige waarde moet altijd zichtbaar zijn, ook als ze buiten de lijst valt.
    if (!options.includes(value)) {
      options.push(value);
      options.sort((a, b) => a - b);
    }
    return (
      <div className="relative shrink-0">
        <label htmlFor={id} className="sr-only">
          Aantal ({UNIT_NAME[unit].many})
        </label>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`h-12 appearance-none rounded-[var(--radius-field)] border border-line-strong bg-white pl-4 pr-10 text-[15px] hover:border-ink ${compact ? "w-[76px]" : "w-[84px]"}`}
        >
          {options.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={20} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
      </div>
    );
  }

  return (
    <div className="flex h-12 shrink-0 items-center rounded-[var(--radius-field)] border border-line-strong bg-white">
      <button
        type="button"
        onClick={() => onChange(clampQuantity(value - rule.step, rule))}
        disabled={value <= rule.min}
        className="flex h-full w-10 items-center justify-center rounded-l-[var(--radius-field)] hover:bg-mist disabled:text-ink-40"
        aria-label={`${formatQuantity(rule.step)} ${UNIT_NAME[unit].short} minder`}
      >
        <Icon name="minus" size={18} />
      </button>
      <label htmlFor={id} className="sr-only">
        Hoeveelheid in {UNIT_NAME[unit].many}
      </label>
      <DecimalField id={id} value={value} rule={rule} onChange={onChange} />
      <span className="pr-1 text-[14px] text-ink-60" aria-hidden="true">
        {UNIT_NAME[unit].short}
      </span>
      <button
        type="button"
        onClick={() => onChange(clampQuantity(value + rule.step, rule))}
        disabled={rule.max !== undefined && value >= rule.max}
        className="flex h-full w-10 items-center justify-center rounded-r-[var(--radius-field)] hover:bg-mist disabled:text-ink-40"
        aria-label={`${formatQuantity(rule.step)} ${UNIT_NAME[unit].short} meer`}
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}
