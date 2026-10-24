"use server";

import { catalog } from "@/lib/catalog/repository";
import { variantLabel } from "@/lib/catalog/product";
import { routes } from "@/lib/routes";
import { SITE } from "@/lib/site/config";
import { absoluteUrl } from "@/lib/site/seo";
import { meld } from "@/lib/melding";
import { geldigEmail, normaliseerTelefoon } from "./consent";
import { uploadFotos } from "./fotos";
import { bewaarKlant, koppelFotos, markeerVoorOpvolging, samenvatting, schrijfInVoorNieuwsbrief } from "./klant";
import { binnenLimiet } from "./limiet";
import { LEAD_SOORTEN, type FormState, type Lead, type LeadSoort } from "./types";

/**
 * Server actions voor alle formulieren van de site. Elke aanvraag wordt een klantfiche in
 * Shopify (zie ./klant.ts). LEADS_DRYRUN=1 (lokaal/preview) logt de aanvraag i.p.v. ze te
 * versturen, zodat testen de winkel niet vervuilt.
 */

const DRYRUN = process.env.LEADS_DRYRUN === "1";
const FOUT_ALGEMEEN = `Er ging technisch iets mis bij het versturen. Bel ons gerust op ${SITE.phone.display} of mail naar ${SITE.email} — dan helpen we u meteen verder.`;

function tekst(fd: FormData, key: string, max = 2000): string {
  return String(fd.get(key) ?? "")
    .trim()
    .slice(0, max);
}

/**
 * Bots vullen het verborgen veld "website" in, versturen binnen een paar seconden, of posten
 * rechtstreeks zonder het formulier te laden (geen geldig tijdstip `_t`). Elk formulier op de
 * site zet `_t` (lead-form.tsx, newsletter-band.tsx).
 */
function isSpam(fd: FormData): boolean {
  if (tekst(fd, "website")) return true;
  const start = Number(tekst(fd, "_t", 20));
  if (!Number.isFinite(start) || start <= 0) return true;
  // Te snel (bot); een vervalst tijdstip in de toekomst valt hier ook onder.
  return Date.now() - start < 2500;
}

const TE_VEEL = `U verstuurde net al enkele aanvragen. Probeer het over een kwartier opnieuw, of bel ons op ${SITE.phone.display}.`;

/** Productregels server-side opbouwen uit "slug|variantId" — nooit vertrouwen op tekst uit de browser. */
async function productRegels(fd: FormData): Promise<string[]> {
  const regels: string[] = [];
  for (const raw of fd.getAll("product").map(String).slice(0, 30)) {
    const [slug, variantId] = raw.split("|");
    const p = slug ? await catalog.getProductBySlug(slug) : undefined;
    if (!p) continue;
    const v = p.variants.find((x) => x.id === variantId);
    regels.push(
      [p.title, p.brand, v && p.options.length ? variantLabel(v) : null, v ? `art.nr. ${v.sku}` : null, absoluteUrl(routes.product(p.slug, v?.id))]
        .filter(Boolean)
        .join(" · "),
    );
  }
  return regels;
}

export async function verstuurAanvraag(_vorige: FormState, fd: FormData): Promise<FormState> {
  if (isSpam(fd)) return { status: "ok" };

  const soortRaw = tekst(fd, "soort", 20);
  const soort: LeadSoort = (LEAD_SOORTEN as readonly string[]).includes(soortRaw) ? (soortRaw as LeadSoort) : "contact";
  const voornaam = tekst(fd, "voornaam", 80);
  const naam = tekst(fd, "naam", 80);
  const email = tekst(fd, "email", 160).toLowerCase();
  const telefoonRuw = tekst(fd, "telefoon", 40);
  const postcode = tekst(fd, "postcode", 10);
  const onderwerp = tekst(fd, "onderwerp", 120);
  const bericht = tekst(fd, "bericht", 3000);
  const marketing = fd.get("marketing") === "on";
  const telefoonVerplicht = fd.get("_telefoonVerplicht") === "1";

  const velden: Record<string, string> = {};
  if (voornaam.length < 1) velden.voornaam = "Vul uw voornaam in.";
  if (naam.length < 1) velden.naam = "Vul uw naam in.";
  if (!email) velden.email = "Vul uw e-mailadres in.";
  else if (!geldigEmail(email)) velden.email = "Dit e-mailadres lijkt niet te kloppen.";
  if (telefoonVerplicht && telefoonRuw.length < 6) velden.telefoon = "Vul een telefoonnummer in waarop we u kunnen bereiken.";
  if (postcode && !/^(\d{4}(\s?[A-Za-z]{2})?|\d{5})$/.test(postcode)) velden.postcode = "Vul een geldige postcode in (bv. 9400).";
  if (soort === "contact" && bericht.length < 5) velden.bericht = "Schrijf kort uw vraag.";
  if (fd.get("consent") !== "on") velden.consent = "We hebben uw akkoord nodig om u te mogen contacteren.";
  if (Object.keys(velden).length > 0) return { status: "fout", message: "Kijk de aangeduide velden even na.", velden };

  const lead: Lead = {
    soort,
    voornaam,
    naam,
    email,
    telefoonRuw,
    telefoon: normaliseerTelefoon(telefoonRuw),
    postcode,
    onderwerp,
    bericht,
    producten: await productRegels(fd),
    marketing,
    bron: tekst(fd, "_bron", 300) || "/",
    tijdstip: new Date().toISOString(),
  };
  const fotos = fd.getAll("fotos").filter((x): x is File => x instanceof File && x.size > 0);

  // 5 geldige aanvragen per kwartier per IP-adres (zie limiet.ts); een tikfout telt niet mee.
  if (!(await binnenLimiet("aanvraag", 5, 15 * 60_000))) return { status: "fout", message: TE_VEEL };

  if (DRYRUN) {
    console.log(`[aanvraag] DRY-RUN (LEADS_DRYRUN=1) — niets verstuurd.\n${samenvatting(lead)}\nFoto's: ${fotos.length}`);
    return { status: "ok" };
  }

  // 1) Duurzaam opslaan. Lukt dit niet, dan is de aanvraag verloren: zeg dat eerlijk.
  let klantId: string;
  try {
    klantId = await bewaarKlant(lead);
  } catch (e) {
    meld("aanvraag", "Opslaan als Shopify-klant mislukt — de bezoeker kreeg de vraag om te bellen", { soort, fout: (e as Error).message });
    return { status: "fout", message: FOUT_ALGEMEEN };
  }

  // 2) Foto's — best effort, vóór de opvolgvlag zodat ze al op de fiche staan bij de melding.
  try {
    await koppelFotos(klantId, await uploadFotos(fotos));
  } catch (e) {
    meld("aanvraag", "Foto-upload mislukt (aanvraag zelf is bewaard)", { klant: klantId, fotos: fotos.length, fout: (e as Error).message });
  }

  // 3) Opvolgvlag → Shopify Flow mailt de winkel. Eén nieuwe poging: zonder vlag mailt niemand.
  for (let poging = 1; poging <= 2; poging++) {
    try {
      await markeerVoorOpvolging(klantId);
      break;
    } catch (e) {
      if (poging === 2) {
        meld("aanvraag", "Aanvraag bewaard maar de opvolgvlag (Flow-mail) is mislukt — volg deze klant handmatig op", { klant: klantId, soort, fout: (e as Error).message });
      }
    }
  }
  return { status: "ok" };
}

export async function schrijfIn(_vorige: FormState, fd: FormData): Promise<FormState> {
  if (isSpam(fd)) return { status: "ok" };
  const email = tekst(fd, "email", 160).toLowerCase();
  if (!geldigEmail(email)) return { status: "fout", velden: { email: "Vul een geldig e-mailadres in." } };
  if (!(await binnenLimiet("nieuwsbrief", 5, 15 * 60_000))) return { status: "fout", message: "Te veel inschrijvingen na elkaar. Probeer het later opnieuw." };
  if (DRYRUN) {
    console.log(`[nieuwsbrief] DRY-RUN — ${email}`);
    return { status: "ok" };
  }
  try {
    await schrijfInVoorNieuwsbrief(email, new Date().toISOString());
    return { status: "ok" };
  } catch (e) {
    meld("nieuwsbrief", "Inschrijven mislukt", { fout: (e as Error).message });
    return { status: "fout", message: "Inschrijven lukte even niet. Probeer het later opnieuw." };
  }
}
