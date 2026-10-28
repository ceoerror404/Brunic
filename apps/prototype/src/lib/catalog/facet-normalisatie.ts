/**
 * Normalisatielaag voor filterwaarden: ruwe Shopify-data (metafields, productopties en de
 * leveranciersspecificaties in `brunic.specificaties`) → de waarden van de filters in
 * ./filters.ts. Puur en zonder bijwerkingen; de Shopify-data zelf blijft ongewijzigd en
 * traceerbaar (de productpagina toont de specificaties zoals de leverancier ze aanlevert).
 *
 * Regels:
 * - Eén schrijfwijze per waarde: spaties opgeschoond, hoofdletter vooraan ("bloemen" → "Bloemen"),
 *   Engelse termen en synoniemen naar de Nederlandse term ("Multicolor", "grey" → "Meerkleurig", "Grijs").
 * - Getallen krijgen één notatie ("0,25 mm", "400 cm") of een vaste klasse (maat, poolhoogte, stofbreedte).
 * - Liever geen waarde dan een gegokte: wat niet herkend wordt, valt weg (ook "Overig").
 * - Wat iets anders betekent, blijft apart: Wasbaar (stof) ≠ Afwasbaar (behang), Gesloten ≠ Black-out.
 * - Het metafield wint van de leveranciersspecificatie (de adapter zet het erover): de specificaties
 *   zijn de terugval tot de pipeline de velden vult (docs/filtersysteem.md §Shopify).
 */
import { bucketVoor, FACET_BY_KEY, MAAT_BUCKETS, POOLHOOGTE_BUCKETS, STOFBREEDTE_BUCKETS, waardeId } from "./filters";
import type { Spec } from "./types";

/** Vaste schrijfwijzen die "hoofdletter vooraan" niet oplost. */
const SCHRIJFWIJZE: Record<string, string> = { "3d": "3D", "toile de jouy": "Toile de Jouy" };

/** "bloemen" → "Bloemen", "3d" → "3D"; de rest blijft zoals hij is (merknamen als "ESTAhome"). */
export function netjes(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  return SCHRIJFWIJZE[t.toLowerCase()] ?? t.charAt(0).toLocaleUpperCase("nl") + t.slice(1);
}

/** Kleurnamen zoals leveranciers ze schrijven → de kleurfamilie van de site (keuzelijst brunic.kleurfamilie). */
const KLEUR: Record<string, string> = {
  multicolor: "Meerkleurig", multicolour: "Meerkleurig", multi: "Meerkleurig", meerkleurig: "Meerkleurig",
  grey: "Grijs", gray: "Grijs", white: "Wit", black: "Zwart", blue: "Blauw", green: "Groen", red: "Rood",
  brown: "Bruin", pink: "Roze", rose: "Roze", yellow: "Geel", orange: "Oranje", purple: "Paars",
  anthracite: "Antraciet", ivory: "Ivoor", natural: "Naturel", naturel: "Naturel",
  goud: "Goud/metallic", gold: "Goud/metallic", zilver: "Zilver/metallic", silver: "Zilver/metallic",
};

const zonderOverig = (w: string) => (/^overige?\b/i.test(w.trim()) ? undefined : netjes(w));

/** Per filter een eigen normalisatie; standaard `netjes`. Klassen (bucket-filters) zijn al ID's. */
const PER_FILTER: Record<string, (w: string) => string | undefined> = {
  kleur: (w) => KLEUR[w.trim().toLowerCase()] ?? netjes(w),
  motief: zonderOverig,
  stijl: zonderOverig,
};

/**
 * De laatste stap voor elk product: per filter normaliseren en ontdubbelen op waarde-ID
 * ("Grijs" en "grijs" worden één waarde). Lege filters vallen weg.
 */
export function normaliseerFacetten(ruw: Record<string, (string | undefined)[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, waarden] of Object.entries(ruw)) {
    const norm = FACET_BY_KEY.get(key)?.kind === "bucket" ? (w: string) => w : (PER_FILTER[key] ?? netjes);
    const gezien = new Map<string, string>();
    for (const w of waarden) {
      const n = w ? norm(w) : undefined;
      const id = n ? waardeId(n) : "";
      if (n && id && !gezien.has(id)) gezien.set(id, n);
    }
    if (gezien.size) out[key] = [...gezien.values()];
  }
  return out;
}

/* ---------------- getallen ---------------- */

/** Eerste getal in een tekst, met komma of punt: "0,25mm" → 0.25. */
function getal(s: string | undefined): number | undefined {
  const m = s?.match(/\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(",", ".")) : undefined;
}

/** Een maat in cm: "4 m" → 400, "67 cm" → 67, "15 mm" → 1,5. Zonder eenheid: cm. */
function inCm(s: string): number | undefined {
  const n = getal(s);
  if (n === undefined) return undefined;
  const eenheid = s.match(/\d\s*(mm|cm|m)\b/i)?.[1]?.toLowerCase();
  return eenheid === "m" ? n * 100 : eenheid === "mm" ? n / 10 : n;
}

const komma = (n: number, decimalen: number) => n.toFixed(decimalen).replace(".", ",");

/** Rolbreedtes uit de optie "Breedte" ("4 m", "400 cm" → "400 cm"). */
export function rolbreedtes(waarden: string[]): string[] {
  return waarden.map(inCm).filter((n): n is number => n !== undefined && n > 0).map((n) => `${Math.round(n)} cm`);
}

/**
 * Maatklassen uit de optie "Maat" van een vloerkleed: "160 × 230 cm" → breedte 160, "Rond Ø 140 cm" → 140.
 * Stalen ("Staal 21 × 30 cm") tellen niet: anders verschijnt elk tapijt met een staal onder "Tot 120 cm".
 */
export function maatKlassen(maten: string[]): string[] {
  const out = new Set<string>();
  for (const m of maten) {
    if (/staal/i.test(m)) continue;
    const r = m.match(/(\d+(?:[.,]\d+)?)\s*[×x]\s*(\d+(?:[.,]\d+)?)/i);
    const d = m.match(/ø\s*(\d+(?:[.,]\d+)?)/i);
    const breedte = r ? Math.min(getal(r[1])!, getal(r[2])!) : d ? getal(d[1]) : undefined;
    const klasse = breedte !== undefined ? bucketVoor(MAAT_BUCKETS, breedte) : undefined;
    if (klasse) out.add(klasse);
  }
  return [...out];
}

/* ---------------- leveranciersspecificaties ---------------- */

const lijst = (s: string | undefined) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);

/** Materialen in een samenstelling; enkel het hoofdweefsel (vóór een ";" staat bv. de coating). */
const MATERIAAL: [RegExp, string][] = [
  [/\bvinyl/i, "Vinyl"],
  [/vlies/i, "Vlies"],
  [/papier/i, "Papier"],
  [/polyamide|nylon|econyl/i, "Polyamide"],
  [/polypropyleen/i, "Polypropyleen"],
  [/polyester/i, "Polyester"],
  [/\bwol\b|wool/i, "Wol"],
  [/acryl/i, "Acryl"],
  [/viscose/i, "Viscose"],
  [/katoen|cotton/i, "Katoen"],
  [/linnen/i, "Linnen"],
  [/jute/i, "Jute"],
  [/sisal/i, "Sisal"],
];

/** Kamers uit "Geschikt voor" (behang); andere teksten in dat veld ("horeca", "goed bestand tegen…") niet. */
const IS_RUIMTE = /^(\w+kamer|hal|keuken)$/i;

/** Eigenschappen-teksten van leveranciers → één term per eigenschap. Eerste treffer wint. */
const EIGENSCHAP: [RegExp, string | null][] = [
  [/^niet wasbaar/i, null],
  [/^wasbaar|easy care/i, "Wasbaar"],
  [/^kamerhoog/i, "Kamerhoog"],
  [/brandvertragend|vlamvertragend|vlamwerend/i, "Brandvertragend"],
  [/vouwgordijn/i, "Geschikt voor vouwgordijn"],
  [/thermisch/i, "Thermisch isolerend"],
  [/geluidsabsorberend/i, "Geluidsabsorberend"],
  [/buitengebruik/i, "Geschikt voor buiten"],
  [/gerecycleerd/i, "Gerecycleerd materiaal"],
  [/vlekwerend/i, "Vlekwerend"],
  [/antislip|slipbestendig/i, "Antislip"],
  [/waterbestendig|waterdicht|waterproof/i, "Waterbestendig"],
];

const EN_685: Record<string, string> = {
  "21": "21 – Wonen, matig",
  "22": "22 – Wonen, normaal",
  "23": "23 – Wonen, intensief",
  "31": "31 – Project, matig",
  "32": "32 – Project, normaal",
  "33": "33 – Project, intensief",
  "34": "34 – Project, zeer intensief",
};

/**
 * Filterwaarden uit de leveranciersspecificaties (`brunic.specificaties`, label → waarde).
 * Leveranciers schrijven labels verschillend ("Plank Afmeting" / "Plank afmeting"): de vergelijking
 * negeert hoofdletters.
 */
export function facettenUitSpecs(specs: Spec[]): Record<string, string[]> {
  const waarde = (...labels: string[]) => {
    const l = labels.map((x) => x.toLowerCase());
    return specs.find((s) => l.includes(s.label.toLowerCase()))?.value;
  };
  const uit: Record<string, string[]> = {};
  const voeg = (key: string, ...w: (string | undefined)[]) => (uit[key] ??= []).push(...w.filter((x): x is string => Boolean(x)));

  // Behang: motief, stijl en ruimte als kommalijst ("3D, hout").
  voeg("motief", ...lijst(waarde("Motief")));
  voeg("stijl", ...lijst(waarde("Stijl")));
  voeg("ruimte", ...lijst(waarde("Geschikt voor")).filter((r) => IS_RUIMTE.test(r)));

  // Materiaal (terugval op het metafield): uit de samenstelling of het poolmateriaal.
  const samenstelling = waarde("Samenstelling", "Poolmateriaal")?.split(";")[0];
  if (samenstelling) voeg("materiaal", ...MATERIAAL.filter(([re]) => re.test(samenstelling)).map(([, m]) => m));

  // Lichtdoorlatendheid (stoffen): "Transparantie" (ADO) of "Dichtheid" (Artelux, Loft79). Dim-out en
  // black-out zijn ook gesloten. "Inbetween/Transparant" laat de leverancier open: dan allebei.
  const eigenschappen = lijst(waarde("Eigenschappen"));
  const DIM = /dim[\s-]?out|lichtdempend/i;
  const BLACK = /black[\s-]?out|verduister/i;
  const licht = [...lijst(waarde("Transparantie", "Dichtheid")), ...eigenschappen.filter((e) => DIM.test(e) || BLACK.test(e))];
  for (const t of licht.flatMap((x) => x.split("/").map((d) => d.trim()))) {
    if (BLACK.test(t)) voeg("lichtdoorlatendheid", "Verduisterend (black-out)", "Gesloten");
    else if (DIM.test(t)) voeg("lichtdoorlatendheid", "Lichtdempend (dim-out)", "Gesloten");
    else if (/semi|inbetween/i.test(t)) voeg("lichtdoorlatendheid", "Semi-transparant");
    else if (/^transparant/i.test(t)) voeg("lichtdoorlatendheid", "Transparant");
    else if (/gesloten|opaak/i.test(t)) voeg("lichtdoorlatendheid", "Gesloten");
  }

  // Eigenschappen: uit de eigenschappenlijst en uit losse ja/nee-velden.
  for (const e of eigenschappen) voeg("eigenschappen", EIGENSCHAP.find(([re]) => re.test(e))?.[1] ?? undefined);
  if (/^ja/i.test(waarde("Geschikt voor vouwgordijnen") ?? "")) voeg("eigenschappen", "Geschikt voor vouwgordijn");
  if (waarde("Brandvertragend (norm)")) voeg("eigenschappen", "Brandvertragend");
  const vloerverwarming = waarde("Vloerverwarming");
  if (vloerverwarming && !/niet|nee/i.test(vloerverwarming) && /ja|geschikt/i.test(vloerverwarming)) voeg("eigenschappen", "Geschikt voor vloerverwarming");
  if (/buiten/i.test(waarde("Gebruik") ?? "")) voeg("eigenschappen", "Geschikt voor buiten");
  if (/^ja/i.test(waarde("Anti-slip") ?? "")) voeg("eigenschappen", "Antislip");
  if (/zelfklevend/i.test(`${waarde("Aanbrengen") ?? ""} ${waarde("Samenstelling") ?? ""}`)) voeg("eigenschappen", "Zelfklevend");
  if (/afwasbaar/i.test(waarde("Onderhoud") ?? "")) voeg("eigenschappen", "Afwasbaar");
  if (/nat verwijderbaar/i.test(waarde("Verwijderen") ?? "")) voeg("eigenschappen", "Nat verwijderbaar");

  // Vloerbekleding: plaatsing, gebruiksklasse, slijtlaag, look.
  const plaatsing = waarde("Installatiemethode", "Installatietype", "Installatie systeem (bekleding)");
  if (plaatsing) {
    if (/los|loose/i.test(plaatsing)) voeg("plaatsing", "Los gelegd");
    if (/lijm/i.test(plaatsing)) voeg("plaatsing", "Verlijmd");
    if (/zelfklevend/i.test(plaatsing)) voeg("plaatsing", "Zelfklevend");
    if (/klik|click/i.test(plaatsing)) voeg("plaatsing", "Kliksysteem");
  }
  for (const s of [waarde("Residentiële gebruiksklasse"), waarde("Commerciële gebruiksklasse"), waarde("Gebruiksklasse")]) {
    voeg("gebruiksklasse", EN_685[s?.match(/\b(2[1-3]|3[1-4])\b/)?.[1] ?? ""]);
  }
  const slijtlaag = getal(waarde("Slijtlaag", "Slijtlaagdikte", "Dikte van de slijtlaag"));
  if (slijtlaag && slijtlaag < 5) voeg("slijtlaag", `${komma(slijtlaag, 2)} mm`);

  if (waarde("Plank Afmeting")) voeg("look", "Planken");
  if (waarde("Tegel Afmeting")) voeg("look", "Tegels");
  for (const d of [waarde("Dessin"), waarde("Uitzicht"), waarde("Patroontype")]) {
    if (!d) continue;
    if (/lat|parket|visgraat|hout|plank/i.test(d)) voeg("look", "Planken");
    else if (/tegel|kassei|blok/i.test(d)) voeg("look", "Tegels");
    else if (/beton|steen/i.test(d)) voeg("look", "Steen / beton");
    else if (/effen|uni\b|spikkel|gespikkeld/i.test(d)) voeg("look", "Effen / gespikkeld");
    else voeg("look", "Structuur / dessin");
  }

  // Tapijt en vasttapijt: poolhoogte in klassen. Stoffen: stofbreedte in klassen.
  const pool = waarde("Poolhoogte");
  // Poolhoogte staat in mm ("11 mm", "15/10 mm"); enkel een expliciete cm of m wordt omgerekend.
  const poolMm = pool && /\d\s*c?m\b/i.test(pool) ? (inCm(pool) ?? 0) * 10 : getal(pool);
  if (poolMm) voeg("poolhoogte", bucketVoor(POOLHOOGTE_BUCKETS, poolMm));
  const stof = waarde("Stofbreedte");
  const stofCm = stof ? inCm(stof) : undefined;
  if (stofCm) voeg("stofbreedte", bucketVoor(STOFBREEDTE_BUCKETS, stofCm));

  return uit;
}
