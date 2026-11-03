import type { FotoSoort, Price, Product, ProductImage, SalesUnit, Variant } from "./types";

const eur = new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" });
const num = new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 2 });

export function formatMoney(amount: number): string {
  return eur.format(amount);
}

export function formatQuantity(q: number): string {
  return num.format(q);
}

export const UNIT_SUFFIX: Record<SalesUnit, string> = {
  stuk: "",
  meter: "/ m",
  m2: "/ m²",
  rol: "/ rol",
  set: "/ set",
};

export const UNIT_NAME: Record<SalesUnit, { one: string; many: string; short: string }> = {
  stuk: { one: "stuk", many: "stuks", short: "st." },
  meter: { one: "meter", many: "meter", short: "m" },
  m2: { one: "m²", many: "m²", short: "m²" },
  rol: { one: "rol", many: "rollen", short: "rol" },
  set: { one: "set", many: "sets", short: "set" },
};

/** Volgorde van de foto's: productfoto, overige foto's, details, sfeerfoto's, en de rolfoto als laatste. */
export const FOTO_RANG: Record<FotoSoort, number> = { product: 0, overig: 1, detail: 2, sfeer: 3, rol: 9 };

export const fotoRang = (i: ProductImage) => FOTO_RANG[i.soort ?? "overig"];

/** 0 = mag vooraan staan, 1 = sfeerfoto, 2 = rolfoto. Sfeer- en rolfoto's komen enkel eerst als er niets anders is. */
export const fotoTrede = (i: ProductImage) => (i.soort === "rol" ? 2 : i.soort === "sfeer" ? 1 : 0);

/** Vormen die een eigen foto kunnen hebben (de variantfoto van die maat). */
export const BIJZONDERE_VORM = new Set(["Rond", "Organisch", "Loper"]);

export const isStaal = (v: Variant) => Object.values(v.options).some((w) => /staal/i.test(w));

export function isPurchasable(p: Product, v?: Variant): boolean {
  if (p.pricing !== "fixed") return false;
  const variant = v ?? p.variants[0];
  return Boolean(variant?.price) && variant.availability !== "uitverkocht";
}

/** Laagste variantprijs (de "vanaf"-prijs op kaarten). */
export function lowestPrice(p: Product): Price | null {
  let best: Price | null = null;
  for (const v of p.variants) {
    if (v.price && (!best || v.price.amount.amount < best.amount.amount)) best = v.price;
  }
  return best;
}

export function hasPriceRange(p: Product): boolean {
  const amounts = new Set(p.variants.map((v) => v.price?.amount.amount).filter((a) => a !== undefined));
  return amounts.size > 1;
}

/** Korting in procent t.o.v. de vergelijkingsprijs (enkel weergave). */
export function discountPercent(price: Price): number | null {
  if (!price.compareAt || price.compareAt.amount <= price.amount.amount) return null;
  return Math.round((1 - price.amount.amount / price.compareAt.amount) * 100);
}

export function findVariant(p: Product, selection: Record<string, string>): Variant | undefined {
  return p.variants.find((v) => Object.entries(selection).every(([k, val]) => v.options[k] === val));
}

export function variantById(p: Product, id: string | undefined): Variant | undefined {
  return id ? p.variants.find((v) => v.id === id) : undefined;
}

/**
 * Beelden voor de gekozen variant: die van haar kleur en de beelden zonder kleur. Beelden van andere
 * kleuren vallen weg. Bruikbare foto's eerst, dan sfeerfoto's, rolfoto's als laatste, en bij een
 * bijzondere vorm (rond, organisch, loper) de foto in die vorm vooraan.
 */
export function imagesForVariant(p: Product, v: Variant | undefined): ProductImage[] {
  if (!v) return p.images;
  const values = new Set(Object.values(v.options));
  const specific = p.images.filter((img) => img.optionValue && values.has(img.optionValue));
  const shared = p.images.filter((img) => !img.optionValue);
  const list = specific.length || shared.length ? [...specific, ...shared] : p.images;
  const vormRang = (img: ProductImage) => (!img.vorm ? 0 : img.vorm === v.vorm ? -1 : 1);
  return [...list].sort((a, b) => fotoTrede(a) - fotoTrede(b) || vormRang(a) - vormRang(b));
}

/** De optie die de kleur draagt. */
export const kleurOptie = (p: Product) => p.options.find((o) => /kleur|color|colour/i.test(o.name));

/** Bij een vloerkleed is de vorm het product: de foto (meestal staand) past heel in het kader, zonder uitsnede. */
export const toonHeleFoto = (type: string | undefined) => type === "Vloerkleed";

/**
 * Het hoverbeeld van een kaart: een foto in dezelfde kleur, liefst een sfeerfoto. Een foto zonder kleur
 * mag enkel bij een product met één kleur: bij meer kleuren is niet zeker welke kleur erop staat.
 * Anders geen hoverbeeld: dan blijft de foto gewoon staan.
 */
export function hoverVoor(p: Product, kleur: string | undefined, kaart: ProductImage | undefined): ProductImage | undefined {
  const nietKaart = (i: ProductImage) => i.src !== kaart?.src;
  const eigen = (i: ProductImage) => kleur !== undefined && i.optionValue === kleur;
  const eenKleur = (kleurOptie(p)?.values.length ?? 0) <= 1;
  return (
    p.images.find((i) => nietKaart(i) && i.soort === "sfeer" && eigen(i)) ??
    (eenKleur ? p.images.find((i) => nietKaart(i) && i.soort === "sfeer" && !i.optionValue) : undefined) ??
    p.images.find((i) => nietKaart(i) && i.soort !== "rol" && eigen(i)) ??
    (eenKleur ? p.images.find((i) => nietKaart(i) && i.soort !== "rol") : undefined)
  );
}

const STANDAARD = new WeakMap<Product, Variant>();

/**
 * De variant waarop het product standaard opent, en die de kaart toont: de eerste beschikbare
 * variant (geen staal) met het beste eerste beeld, en bij een gelijk beeld de eerste met een
 * hoverbeeld. Kaart en productpagina gebruiken allebei deze variant, zo tonen ze hetzelfde beeld.
 */
export function standaardVariant(p: Product): Variant {
  const bekend = STANDAARD.get(p);
  if (bekend) return bekend;
  const beschikbaar = p.variants.filter((v) => v.availability !== "uitverkocht");
  const zonderStaal = beschikbaar.filter((v) => !isStaal(v));
  const keuze = zonderStaal.length ? zonderStaal : beschikbaar.length ? beschikbaar : p.variants;
  const ko = kleurOptie(p);
  let beste = keuze[0];
  let besteScore = Infinity;
  for (const v of keuze) {
    const eerste = imagesForVariant(p, v)[0];
    const score = (eerste ? fotoTrede(eerste) : 3) * 10 + (hoverVoor(p, ko ? v.options[ko.name] : undefined, eerste) ? 0 : 1);
    if (score < besteScore) {
      beste = v;
      besteScore = score;
    }
    if (besteScore === 0) break;
  }
  if (beste) STANDAARD.set(p, beste);
  return beste;
}

/** Omschrijving van een variant voor winkelmand/verlanglijst: "Grijs · 60 × 180 cm". */
export function variantLabel(v: Variant): string {
  return Object.values(v.options).join(" · ");
}

/** "1 product" / "3 producten". */
export function productCount(n: number): string {
  return `${n} ${n === 1 ? "product" : "producten"}`;
}

/**
 * Regeltotaal in euro, afgerond op de cent (half naar boven): eerst naar centen, dan
 * vermenigvuldigen — zo geeft 3,5 × € 29,99 netjes € 104,97 i.p.v. een zwevendekomma-
 * afronding naar € 104,96. Subtotalen = som van deze afgeronde regels.
 */
export function lineTotal(unitAmount: number, quantity: number): number {
  return Math.round(Math.round(unitAmount * 100) * quantity) / 100;
}

/** Indexeerbaar = heeft minstens één foto (fotoloze producten blijven noindex tot ze verrijkt zijn). */
export function isIndexable(p: Product): boolean {
  return p.images.some((i) => i.src);
}
