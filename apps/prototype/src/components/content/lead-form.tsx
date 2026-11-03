"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { verstuurAanvraag } from "@/lib/leads/actions";
import { MARKETING_CONSENT_TEKST, SERVICE_CONSENT_TEKST } from "@/lib/leads/consent";
import type { FormState, LeadSoort } from "@/lib/leads/types";
import { useWishlist } from "@/lib/store/stores";
import { useProducts, useProductsBySlug, type LiteProduct } from "@/lib/store/use-products";
import { routes } from "@/lib/routes";
import { SITE } from "@/lib/site/config";
import { Icon } from "@/components/ui/icon";
import { ImageSlot } from "@/components/ui/image-slot";

export type FormField = {
  name: "voornaam" | "naam" | "email" | "telefoon" | "postcode" | "onderwerp" | "bericht";
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "select" | "postcode";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  autoComplete?: string;
  half?: boolean;
};

const MAX_FOTOS = 5;
/** BE/LU (4 cijfers), NL (4 cijfers + 2 letters) of FR/DE (5 cijfers). */
const POSTCODE = /^(\d{4}(\s?[A-Za-z]{2})?|\d{5})$/;

/** Foto verkleinen in de browser (max. 1600 px, JPEG): houdt de verzending onder de limiet van de server. */
async function verklein(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const schaal = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * schaal);
    canvas.height = Math.round(bmp.height * schaal);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" }) : file;
  } catch {
    return file; // formaat dat de browser niet kan lezen (bv. HEIC in Chrome): origineel meesturen
  }
}

/**
 * Aanvraag- en contactformulier. Valideert in de browser (snelle feedback) én op de server
 * (lib/leads/actions.ts), en bewaart de aanvraag als klantfiche in Brunics Shopify.
 *
 * Met `productContext` leest het formulier ?product=…&variant=… of ?verlanglijst=1 uit de
 * URL en stuurt die producten mee — zo sluit "Offerte aanvragen" op een productpagina of
 * de verlanglijst rechtstreeks aan op dit formulier.
 */
export function LeadForm({
  title,
  intro,
  fields,
  soort,
  submitLabel = "Versturen",
  allowPhotos = false,
  productContext = false,
  titelMetProducten,
  bevestiging,
}: {
  title: string;
  intro?: string;
  fields: FormField[];
  soort: LeadSoort;
  submitLabel?: string;
  allowPhotos?: boolean;
  productContext?: boolean;
  /** Titel wanneer er producten uit de URL of verlanglijst meekomen (bv. "Vraag uw offerte aan"). */
  titelMetProducten?: string;
  bevestiging?: string;
}) {
  const id = useId();
  const pathname = usePathname();
  const [state, formAction, pending] = useActionState<FormState, FormData>(verstuurAanvraag, { status: "leeg" });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [fotos, setFotos] = useState<File[]>([]);
  const [start] = useState(() => Date.now());
  const statusRef = useRef<HTMLDivElement>(null);
  const errors = { ...(state.velden ?? {}), ...clientErrors };
  const producten = useProductContext(productContext);
  // Met producten erbij is het een offerteaanvraag (ook op de opmetingspagina).
  const effectief: LeadSoort = producten.length > 0 ? "offerte" : soort;
  // Bij een productofferte (B24): geen keuze "Waarvoor?" (het product zegt het al) en de
  // postcode is optioneel — die is enkel nodig om een opmeting aan huis te plannen.
  const velden = producten.length > 0 ? fields.filter((f) => f.name !== "onderwerp").map((f) => (f.name === "postcode" ? { ...f, required: false } : f)) : fields;

  useEffect(() => {
    if (state.status === "ok") statusRef.current?.focus();
  }, [state.status]);

  const validate = (data: FormData) => {
    const e: Record<string, string> = {};
    for (const f of velden) {
      const v = String(data.get(f.name) ?? "").trim();
      if (f.required && !v) e[f.name] = `${f.label} is verplicht.`;
      else if (v && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) e[f.name] = "Vul een geldig e-mailadres in.";
      else if (v && f.type === "tel" && !/^[+0-9 ()/.-]{8,}$/.test(v)) e[f.name] = "Vul een geldig telefoonnummer in.";
      else if (v && f.type === "postcode" && !POSTCODE.test(v)) e[f.name] = "Vul een geldige postcode in (bv. 9400).";
    }
    if (data.get("consent") !== "on") e.consent = "We hebben uw akkoord nodig om u te mogen contacteren.";
    return e;
  };

  if (state.status === "ok") {
    return (
      <section aria-labelledby={`${id}-titel`} className="rounded-[var(--radius-tile)] border border-line p-5 md:p-8">
        <div ref={statusRef} tabIndex={-1} role="status" className="outline-none">
          <p id={`${id}-titel`} className="flex items-center gap-2 font-display text-[28px] leading-tight">
            <Icon name="check" size={28} /> Bedankt, uw aanvraag is goed ontvangen
          </p>
          <p className="mt-3 text-[15px] text-ink-80">
            {bevestiging ?? "Wij nemen binnen 1 à 2 werkdagen contact met u op."} Dringend? Bel ons op{" "}
            <a href={SITE.phone.href} className="font-medium underline">
              {SITE.phone.display}
            </a>{" "}
            ({SITE.hoursShort}).
          </p>
          <Link href={routes.catalog()} className="btn btn-outline btn-sm mt-5">
            Verder rondkijken
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={`${id}-titel`} className="rounded-[var(--radius-tile)] border border-line p-5 md:p-8">
      <h2 id={`${id}-titel`} className="font-display text-[28px] leading-tight">
        {producten.length > 0 && titelMetProducten ? titelMetProducten : title}
      </h2>
      {intro && <p className="mt-2 text-[15px] text-ink-80">{intro}</p>}

      {producten.length > 0 && (
        <div className="mt-5 rounded-[var(--radius-tile)] bg-mist p-4">
          <p className="text-[14px] font-medium">Uw aanvraag gaat over:</p>
          <ul role="list" className="mt-3 space-y-2">
            {producten.map(({ p, variantId }) => {
              const v = p.variants.find((x) => x.id === variantId);
              return (
                <li key={`${p.card.slug}|${variantId ?? ""}`} className="flex items-center gap-3 text-[14px]">
                  <ImageSlot src={p.card.image?.src} alt="" sizes="48px" className="size-12 shrink-0 rounded-lg" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.card.title}</span>
                    <span className="block truncate text-[13px] text-ink-60">
                      {[p.card.brand, p.variants.length > 1 ? v?.label : null, v ? `art.nr. ${v.sku}` : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <form
        noValidate
        className="mt-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          const errs = validate(data);
          setClientErrors(errs);
          if (Object.keys(errs).length > 0) {
            form.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
            return;
          }
          data.delete("fotos");
          for (const f of await Promise.all(fotos.map(verklein))) data.append("fotos", f, f.name);
          startTransition(() => formAction(data));
        }}
      >
        <input type="hidden" name="soort" value={effectief} />
        <input type="hidden" name="_bron" value={pathname} />
        <input type="hidden" name="_t" value={start} />
        <input type="hidden" name="_telefoonVerplicht" value={velden.some((f) => f.name === "telefoon" && f.required) ? "1" : "0"} />
        {producten.length > 0 && <input type="hidden" name="onderwerp" value="Offerte voor producten" />}
        {producten.map(({ p, variantId }) => (
          <input key={`${p.card.slug}|${variantId ?? ""}`} type="hidden" name="product" value={`${p.card.slug}|${variantId ?? ""}`} />
        ))}
        {/* Honeypot: onzichtbaar voor mensen, bots vullen het in. */}
        <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
          <label>
            Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
          {velden.map((f) => {
            const fid = `${id}-${f.name}`;
            const err = errors[f.name];
            const common = {
              id: fid,
              name: f.name,
              "aria-invalid": Boolean(err),
              "aria-describedby": err ? `${fid}-fout` : undefined,
              required: f.required,
              autoComplete: f.autoComplete,
              placeholder: f.placeholder,
            };
            return (
              <div key={f.name} className={f.half ? "" : "md:col-span-2"}>
                <label htmlFor={fid} className="mb-1.5 block text-[14px] font-medium">
                  {f.label}
                  {f.required && <span aria-hidden="true">*</span>}
                </label>
                {f.type === "textarea" ? (
                  <textarea {...common} rows={5} maxLength={3000} className="field min-h-32" />
                ) : f.type === "select" ? (
                  <div className="relative">
                    <select {...common} defaultValue="" className="field appearance-none pr-10">
                      <option value="" disabled>
                        Maak een keuze
                      </option>
                      {f.options?.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                    <Icon name="chevronDown" size={20} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                ) : (
                  <input
                    {...common}
                    type={f.type === "postcode" ? "text" : (f.type ?? "text")}
                    inputMode={f.type === "tel" ? "tel" : undefined}
                    maxLength={f.type === "postcode" ? 8 : 160}
                    className="field"
                  />
                )}
                {err && (
                  <p id={`${fid}-fout`} className="mt-1 text-[13px] text-brand-dark">
                    {err}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {allowPhotos && (
          <div className="mt-5">
            <input
              id={`${id}-fotos`}
              name="fotos"
              type="file"
              multiple
              accept="image/*"
              className="peer sr-only"
              onChange={(e) => setFotos(Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/")).slice(0, MAX_FOTOS))}
            />
            <label
              htmlFor={`${id}-fotos`}
              className="btn btn-outline btn-sm cursor-pointer whitespace-normal peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
            >
              Foto&apos;s van uw ramen of ruimte toevoegen <Icon name="paperclip" size={18} className="shrink-0" />
            </label>
            <p className="mt-2 text-[13px] text-ink-60">
              {fotos.length > 0 ? `${fotos.length} foto${fotos.length === 1 ? "" : "'s"} gekozen: ${fotos.map((f) => f.name).join(", ")}` : `Optioneel, max. ${MAX_FOTOS} foto's.`}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-3 text-[14px]">
          <label className="flex items-start gap-3">
            <input type="checkbox" name="consent" className="mt-0.5 size-5 shrink-0 accent-[var(--color-ink)]" aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? `${id}-consent-fout` : undefined} />
            <span>
              {SERVICE_CONSENT_TEKST}{" "}
              <Link href={routes.info("privacy")} className="underline underline-offset-2">
                Privacyverklaring
              </Link>
              <span aria-hidden="true">*</span>
            </span>
          </label>
          {errors.consent && (
            <p id={`${id}-consent-fout`} className="text-[13px] text-brand-dark">
              {errors.consent}
            </p>
          )}
          <label className="flex items-start gap-3">
            <input type="checkbox" name="marketing" className="mt-0.5 size-5 shrink-0 accent-[var(--color-ink)]" />
            <span className="text-ink-80">{MARKETING_CONSENT_TEKST}</span>
          </label>
        </div>

        {state.status === "fout" && state.message && (
          <p role="alert" className="mt-5 rounded-[var(--radius-field)] bg-brand-tint p-4 text-[14px] text-brand-dark">
            {state.message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-ink-60">* Verplichte velden</p>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Bezig met versturen…" : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

/** Producten uit de URL (?product=&variant=) of de verlanglijst (?verlanglijst=1). */
function useProductContext(enabled: boolean): { p: LiteProduct; variantId?: string }[] {
  const params = useSearchParams();
  const wish = useWishlist();
  const slug = enabled ? (params.get("product") ?? "") : "";
  const variant = params.get("variant") ?? undefined;
  const uitLijst = enabled && params.get("verlanglijst") === "1";
  const { map: bySlug } = useProductsBySlug(slug ? [slug] : []);
  const { map: byId } = useProducts(uitLijst ? wish.items.map((i) => i.productId) : []);

  if (slug) {
    const p = bySlug.get(slug);
    return p ? [{ p, variantId: variant ?? p.variants[0]?.id }] : [];
  }
  if (uitLijst) {
    return wish.items.flatMap((i) => {
      const p = byId.get(i.productId);
      return p ? [{ p, variantId: i.variantId ?? p.variants[0]?.id }] : [];
    });
  }
  return [];
}
