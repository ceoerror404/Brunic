#!/usr/bin/env node
/**
 * Bouwt src/data/oude-urls.json: elke product-URL van de oude WooCommerce-site (brunic.be)
 * → het nieuwe Shopify-product, of anders de oude categorieën van dat product (de site kiest
 * daar bij een bezoek de best passende nieuwe categorie bij, zie src/lib/site/oude-urls.ts).
 *
 *   node apps/prototype/scripts/genereer-oude-urls.mjs --data "<map met de importbestanden>"
 *
 * Bronnen:
 * - de publieke sitemaps van brunic.be (alleen lezen) — welke oude URL's bestaan;
 * - de importbestanden van de catalogus-pipeline (device-local, NIET in de repo):
 *   BRUNIC_VINYL_GROEPERING_*.csv + BRUNIC_VINYL_SHOPIFY_PUSH_LOG.json (vinyl),
 *   LALEE_RAGOLLE_IMPORTPLAN_*.json (Lalee/Ragolle) en BRUNIC_PRODUCTEN_ZONDER_VINYL_*.json
 *   (oude categorieën van de overige producten).
 * De uitvoer bevat enkel publieke slugs en handles — geen klantgegevens.
 *
 * Opnieuw draaien na een nieuwe import die oude Woo-producten vervangt; daarna committen.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "../src/data/oude-urls.json");
const args = process.argv.slice(2);
const DATA = args.includes("--data") ? args[args.indexOf("--data") + 1] : process.env.BRUNIC_DATA_DIR;
if (!DATA || !fs.existsSync(DATA)) {
  console.error("Geef de map met de importbestanden: --data <map> (of BRUNIC_DATA_DIR).");
  process.exit(1);
}

const BOM = String.fromCharCode(0xfeff);
const tekst = (p) => {
  const t = fs.readFileSync(p, "utf8");
  return t.startsWith(BOM) ? t.slice(1) : t;
};
/** Nieuwste bestand dat met dit voorvoegsel begint (de bestandsnamen dragen een datum). */
const nieuwste = (voorvoegsel) => {
  const f = fs.readdirSync(DATA).filter((n) => n.startsWith(voorvoegsel)).sort().pop();
  if (!f) throw new Error(`${voorvoegsel}* niet gevonden in ${DATA}`);
  return path.join(DATA, f);
};
const lees = (voorvoegsel) => JSON.parse(tekst(nieuwste(voorvoegsel)));
/** Slug uit een oude product-URL, gedecodeerd ("…-1m%c2%b2" → "…-1m²"), zoals src/proxy.ts hem vergelijkt. */
const slugVan = (u) => {
  const s = u.split("/product/")[1]?.replace(/\/$/, "");
  if (!s) return s;
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// 1) Oude product-URL's uit de sitemaps
const locs = (xml) => [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?([^<\]]+?)(?:\]\]>)?\s*<\/loc>/g)].map((m) => m[1].trim());
const get = async (u) => {
  const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Brunic migratie)" }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`);
  return r.text();
};
const oud = [];
for (const s of locs(await get("https://brunic.be/sitemap_index.xml")).filter((s) => s.includes("product-sitemap"))) {
  oud.push(...locs((await get(s)).replace(/<image:image>[\s\S]*?<\/image:image>/g, "")).map(slugVan).filter(Boolean));
}

// 2) Oude URL → nieuwe handle
const naarHandle = new Map();
const pushVinyl = new Map(lees("BRUNIC_VINYL_SHOPIFY_PUSH_LOG").filter((r) => !r.fout).map((r) => [r.bron_handle, r.handle]));
for (const r of tekst(nieuwste("BRUNIC_VINYL_GROEPERING")).split(/\r?\n/).slice(1)) {
  const c = [...r.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1]);
  if (c.length >= 7 && c[6]) naarHandle.set(slugVan(c[6]), pushVinyl.get(c[1]) ?? c[1]);
}
for (const p of lees("LALEE_RAGOLLE_IMPORTPLAN").producten) for (const k of p.kleuren ?? []) if (k.bron_url) naarHandle.set(slugVan(k.bron_url), p.handle);

// 3) Oude URL → oude categorieslugs (terugval)
const cats = new Map();
for (const p of lees("BRUNIC_PRODUCTEN_ZONDER_VINYL")) cats.set(p.bron_url ? slugVan(p.bron_url) : p.slug, p.categorie_slugs ?? []);
for (const p of lees("BRUNIC_VINYL_PRODUCTEN")) if (!cats.has(slugVan(p.bron_url))) cats.set(slugVan(p.bron_url), ["vinylvloeren", "vloerbekleding"]);

const producten = {};
for (const s of [...new Set(oud)].sort()) {
  const h = naarHandle.get(s);
  const c = cats.get(s);
  producten[s] = { ...(h ? { h } : {}), ...(c?.length ? { c } : {}) };
}
fs.writeFileSync(OUT, `${JSON.stringify({ gegenereerd: new Date().toISOString().slice(0, 10), producten }, null, 0)}\n`);
const metHandle = Object.values(producten).filter((p) => p.h).length;
console.log(`${Object.keys(producten).length} oude product-URL's → ${metHandle} met nieuw product, ${Object.keys(producten).length - metHandle} enkel via categorie → ${path.relative(process.cwd(), OUT)}`);
