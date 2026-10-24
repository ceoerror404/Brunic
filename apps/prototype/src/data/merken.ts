/**
 * Merklogo's voor de merktegels (homepage "Onze merken" en /merken).
 *
 * De logo's in public/merken/ zijn witte, éénkleurige SVG's (gevectoriseerd uit de
 * leveranciersbestanden in apps/prototype/logo's/) — bedoeld voor op de sfeerfoto, dus op
 * een witte achtergrond onzichtbaar. Lano staat er zonder zijn groene/rode vlakken.
 *
 * Een logo toevoegen:
 *   1. Het officiële logo (liefst SVG, anders PNG met transparante achtergrond) van de
 *      leverancier — uit het dealerportaal of de brand kit — in public/merken/<slug>.svg zetten.
 *   2. Hier een regel toevoegen met de slug van het merk (zie /merken/<slug> in de URL).
 *
 * `wit: true` (standaard) kleurt een éénkleurig logo wit, zodat het leesbaar is op de foto.
 * Zet `wit: false` voor een logo dat in kleur getoond moet worden.
 * Zonder logo toont de tegel de merknaam in de sierletter van de site.
 */
export const MERK_LOGO: Record<string, { src: string; wit?: boolean }> = {
  ado: { src: "/merken/ado.svg" },
  arte: { src: "/merken/arte.svg" },
  borastapeter: { src: "/merken/borastapeter.svg" },
  "associated-weavers": { src: "/merken/associated-weavers.svg" },
  artelux: { src: "/merken/artelux.svg" },
  loft79: { src: "/merken/loft79.svg" },
  lano: { src: "/merken/lano.svg" },
  "louis-de-poortere": { src: "/merken/louis-de-poortere.svg" },
  balsan: { src: "/merken/balsan.svg" },
  tarkett: { src: "/merken/tarkett.svg" },
  lalee: { src: "/merken/lalee.svg" },
  ragolle: { src: "/merken/ragolle.svg" },
};

/**
 * Shopify-vendors die geen eigen merktegel krijgen maar onder hun moedermerk vallen.
 * Desso is een merk van Tarkett: de Desso-producten staan op /merken/tarkett
 * (/merken/desso stuurt door, zie next.config.ts).
 */
export const MERK_ONDER: Record<string, string> = {
  Desso: "Tarkett",
};
