import type { CategoryId } from "@/lib/catalog/types";

/**
 * Hoe de Shopify-collecties op de categorieboom van de site landen.
 *
 * - De hoofdcategorieën (naam, URL, beeld) komen uit src/data/categories.ts; hier staat
 *   enkel welke Shopify-collectie erbij hoort.
 * - Subcategorieën komen uit Shopify: een collectie wiens handle met een voorvoegsel
 *   begint, wordt een subcategorie van die hoofdcategorie (behang-effen → Behang › Effen).
 *   Lege collecties worden niet getoond.
 * - Een subcategorie toevoegen/hernoemen = in Shopify; hier niets aan te passen.
 */
export const SHOPIFY_HOOFDCOLLECTIE: Record<CategoryId, string> = {
  c01: "raamdecoratie",
  c02: "behang",
  c03: "tapijten",
  c04: "vloerbekleding",
  c05: "gordijnen-stoffen",
  c06: "slapen-wonen",
  c07: "verf",
};

/** Handle-voorvoegsel → hoofdcategorie. */
export const SHOPIFY_SUB_VOORVOEGSEL: [string, CategoryId][] = [
  ["raamdecoratie-", "c01"],
  ["behang-", "c02"],
  ["tapijten-", "c03"],
  ["vloerbekleding-", "c04"],
  ["stoffen-", "c05"],
  ["slapen-", "c06"],
  ["verf-", "c07"],
];

/** Subcollecties zonder voorvoegsel (bv. gedeeld over twee hoofdcategorieën). */
export const SHOPIFY_SUB_EXTRA: Record<string, CategoryId> = {
  logotapijt: "c03",
};

/**
 * Collectie waarmee Brunic zelf bepaalt wat "Nieuw binnen" is (in de Shopify-admin).
 * Leeg of onbestaand → één product per merk (zie shopify-adapter.ts).
 */
export const SHOPIFY_NIEUW_COLLECTIE = "nieuw-binnen";

/** Technische collecties die geen categorie zijn. */
export const SHOPIFY_NEGEER = new Set(["frontpage", "in-de-kijker", SHOPIFY_NIEUW_COLLECTIE]);

/**
 * Zelfde merk en naam, toch verschillende ontwerpen: niet samenvoegen tot één product
 * (lib/catalog/ontwerpen.ts). Ze blijven apart, met de collectie achter de naam.
 */
export const ZELFDE_NAAM_ANDER_ONTWERP: { merk: string; titel: string }[] = [
  { merk: "Desso", titel: "Fuse B755" }, // collecties Fuse Landscape en Fuse Create
];

