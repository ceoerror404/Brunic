/**
 * Catalogus actueel houden zonder ontwikkelaar. De site toont een momentopname die bij elke
 * build uit Shopify komt (scripts/voor-build.mjs). Een nieuwe build starten we via een
 * Vercel Deploy Hook (VERCEL_DEPLOY_HOOK_URL):
 *
 * - meteen na een product- of collectiewijziging (Shopify-webhook → /api/webhooks/shopify),
 *   hoogstens één keer per HERBOUW_PAUZE per serverinstantie (een import van 500 producten
 *   mag geen 500 builds starten);
 * - als vangnet dagelijks (Vercel Cron, vercel.json) of op een schema in Shopify Flow
 *   (/api/catalogus/vernieuwen): enkel als de momentopname echt afwijkt van Shopify.
 *
 * Voorraad per variant wacht niet op een build: winkelmand en productpagina lezen die live
 * (/api/producten?live=1), en de kassa controleert hoe dan ook live.
 */
import fs from "node:fs";
import { storefront } from "@/lib/shopify/storefront";
import { meld } from "@/lib/melding";
import { SNAPSHOT_PAD, type Snapshot } from "./shopify-adapter";

const HERBOUW_PAUZE = 15 * 60_000;
let laatsteHerbouw = 0;

export type HerbouwResultaat = "gestart" | "recent-al-gestart" | "geen-deploy-hook" | "mislukt";

/** Start een nieuwe build (met de verse catalogus) via de Vercel Deploy Hook. */
export async function vraagHerbouw(reden: string): Promise<HerbouwResultaat> {
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hook) return "geen-deploy-hook";
  if (Date.now() - laatsteHerbouw < HERBOUW_PAUZE) return "recent-al-gestart";
  laatsteHerbouw = Date.now();
  try {
    const res = await fetch(hook, { method: "POST", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log(`[catalogus] nieuwe build gevraagd (${reden})`);
    return "gestart";
  } catch (e) {
    laatsteHerbouw = 0;
    meld("catalogus", "Nieuwe build via de Vercel Deploy Hook mislukt — nieuwe producten verschijnen niet", { reden, fout: (e as Error).message });
    return "mislukt";
  }
}

const VINGERAFDRUK = /* GraphQL */ `
  query Vingerafdruk($after: String) {
    products(first: 100, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { id updatedAt availableForSale collections(first: 25) { nodes { handle } } }
    }
    collections(first: 250) { nodes { handle title } }
  }
`;
type VingerNode = { id: string; updatedAt: string; availableForSale: boolean; collections: { nodes: { handle: string }[] } };

const regel = (updatedAt: string, beschikbaar: boolean, collecties: string[]) => `${updatedAt}|${beschikbaar}|${[...collecties].sort().join(",")}`;

export type Verschil = { gesynchroniseerd: string; nieuw: number; weg: number; gewijzigd: number; collecties: boolean };

/**
 * Vergelijkt de momentopname van deze deploy met wat Shopify nu publiceert op het kanaal:
 * nieuwe en verdwenen producten, gewijzigde producten (updatedAt, beschikbaarheid,
 * collecties) en de collectielijst zelf.
 */
export async function vergelijkMetShopify(): Promise<Verschil> {
  const snap = JSON.parse(fs.readFileSync(SNAPSHOT_PAD, "utf8")) as Snapshot;
  const oud = new Map(snap.products.map((p) => [p.id, regel(p.updatedAt, p.variants.some((v) => v.availableForSale), p.collections)]));

  const nu = new Map<string, string>();
  let collecties: { handle: string; title: string }[] = [];
  let after: string | null = null;
  do {
    const d: { products: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: VingerNode[] }; collections: { nodes: { handle: string; title: string }[] } } =
      await storefront(VINGERAFDRUK, { after });
    for (const p of d.products.nodes) nu.set(p.id, regel(p.updatedAt, p.availableForSale, p.collections.nodes.map((c) => c.handle)));
    if (!after) collecties = d.collections.nodes;
    after = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
  } while (after);

  let nieuw = 0;
  let gewijzigd = 0;
  for (const [id, r] of nu) {
    const o = oud.get(id);
    if (o === undefined) nieuw++;
    else if (o !== r) gewijzigd++;
  }
  const weg = [...oud.keys()].filter((id) => !nu.has(id)).length;
  const sleutel = (l: { handle: string; title: string }[]) => l.map((c) => `${c.handle}=${c.title}`).sort().join("|");
  return { gesynchroniseerd: snap.gesynchroniseerd, nieuw, weg, gewijzigd, collecties: sleutel(collecties) !== sleutel(snap.collections) };
}

export const heeftVerschil = (v: Verschil) => v.nieuw + v.weg + v.gewijzigd > 0 || v.collecties;
