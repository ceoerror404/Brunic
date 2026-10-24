#!/usr/bin/env node
/**
 * Haalt de gepubliceerde catalogus op via de Shopify Storefront API (ALLEEN LEZEN) en
 * bewaart een momentopname in apps/prototype/.data/shopify-catalogus.json (gitignored).
 * Het prototype leest die momentopname via src/lib/catalog/shopify-adapter.ts.
 *
 *   pnpm prototype:sync                 # alles
 *   pnpm prototype:sync -- --limit 25   # snelle test
 *
 * Nodig in de repo-root .env: SHOPIFY_STORE_DOMAIN + SHOPIFY_STOREFRONT_API_TOKEN
 * (publieke token, of een privé-token "shpat_…" — die gaat mee als privé-header en
 * blijft enkel op deze machine). De Storefront API toont alleen producten die actief
 * zijn én gepubliceerd op het kanaal van de token (Brunic Headless).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "../../..");
const OUT_DIR = path.resolve(here, "../.data");
const OUT = path.join(OUT_DIR, "shopify-catalogus.json");

try {
  for (const regel of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
    const m = regel.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* geen .env */
}

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_API_TOKEN;
const VERSION = process.env.SHOPIFY_API_VERSION || "2025-10";
const args = process.argv.slice(2);
const LIMIT = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;

if (!DOMAIN || !TOKEN) {
  console.error("SHOPIFY_STORE_DOMAIN of SHOPIFY_STOREFRONT_API_TOKEN ontbreekt in de repo-root .env");
  process.exit(1);
}
const authHeader = TOKEN.startsWith("shpat_") ? "Shopify-Storefront-Private-Token" : "X-Shopify-Storefront-Access-Token";

async function storefront(query, variables = {}) {
  for (let poging = 1; ; poging++) {
    const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [authHeader]: TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json().catch(() => ({}));
    // 429/430 = throttled; een 5xx geeft Shopify soms tijdelijk midden in de paginering (gezien op Vercel-builds).
    const tijdelijk =
      res.status === 429 || res.status === 430 || res.status >= 500 || json.errors?.some?.((e) => e.extensions?.code === "THROTTLED");
    if (tijdelijk && poging < 8) {
      await new Promise((r) => setTimeout(r, 1000 * poging));
      continue;
    }
    if (!res.ok || json.errors) throw new Error(`Storefront API: HTTP ${res.status} ${JSON.stringify(json.errors ?? json).slice(0, 400)}`);
    return json.data;
  }
}

const IMG = "url altText width height";
const PRODUCTS = /* GraphQL */ `
  query Producten($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id handle title vendor productType createdAt updatedAt descriptionHtml
        options { name optionValues { name swatch { color image { previewImage { url } } } } }
        images(first: 100) { pageInfo { hasNextPage } nodes { ${IMG} } }
        collections(first: 25) { pageInfo { hasNextPage } nodes { handle } }
        etalage: metafield(namespace: "brunic", key: "etalage") { value }
        eenheid: metafield(namespace: "brunic", key: "verkoop_eenheid") { value }
        kleurfamilie: metafield(namespace: "brunic", key: "kleurfamilie") { value }
        materiaal: metafield(namespace: "brunic", key: "materiaal") { value }
        collectie: metafield(namespace: "brunic", key: "collectie") { value }
        specificaties: metafield(namespace: "brunic", key: "specificaties") { value }
        motief: metafield(namespace: "brunic", key: "motief") { value }
        stijl: metafield(namespace: "brunic", key: "stijl") { value }
        variants(first: 250) {
          pageInfo { hasNextPage }
          nodes {
            id sku availableForSale
            price { amount } compareAtPrice { amount }
            selectedOptions { name value }
            image { url }
            breedte: metafield(namespace: "brunic", key: "breedte_cm") { value }
            lengte: metafield(namespace: "brunic", key: "lengte_cm") { value }
            kleurfamilie: metafield(namespace: "brunic", key: "kleurfamilie") { value }
            accentkleuren: metafield(namespace: "brunic", key: "accentkleuren") { value }
          }
        }
      }
    }
  }
`;

const COLLECTIONS = /* GraphQL */ `
  query Collecties($after: String) {
    collections(first: 100, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { handle title description image { ${IMG} } }
    }
  }
`;

const t0 = Date.now();
const shop = (await storefront(`{ shop { name } }`)).shop;
console.log(`Winkel: ${shop.name} (${DOMAIN}) · Storefront API ${VERSION}`);

const collections = [];
let after = null;
do {
  const d = await storefront(COLLECTIONS, { after });
  collections.push(...d.collections.nodes);
  after = d.collections.pageInfo.hasNextPage ? d.collections.pageInfo.endCursor : null;
} while (after);
console.log(`Collecties: ${collections.length}`);

const products = [];
after = null;
do {
  const d = await storefront(PRODUCTS, { first: Math.min(25, LIMIT - products.length), after });
  products.push(...d.products.nodes);
  after = d.products.pageInfo.hasNextPage && products.length < LIMIT ? d.products.pageInfo.endCursor : null;
  process.stdout.write(`\rProducten: ${products.length}`);
} while (after);
process.stdout.write("\n");

// Afgekapte lijsten melden (Storefront geeft per product max. zoveel terug als gevraagd).
const afgekapt = (soort) => products.filter((p) => p[soort].pageInfo?.hasNextPage).map((p) => p.handle);
for (const [soort, max] of [["images", 100], ["collections", 25], ["variants", 250]]) {
  const lijst = afgekapt(soort);
  if (lijst.length) console.warn(`⚠️  ${lijst.length} producten hebben meer dan ${max} ${soort} — enkel de eerste ${max} staan op de site: ${lijst.slice(0, 5).join(", ")}${lijst.length > 5 ? " …" : ""}`);
}

// Metafield-afkortingen platslaan ({ value } → string | null) houdt het bestand compact.
const flat = (m) => (m && typeof m.value === "string" ? m.value : null);
const compact = products.map((p) => ({
  ...p,
  etalage: flat(p.etalage),
  eenheid: flat(p.eenheid),
  kleurfamilie: flat(p.kleurfamilie),
  materiaal: flat(p.materiaal),
  collectie: flat(p.collectie),
  specificaties: flat(p.specificaties),
  motief: flat(p.motief),
  stijl: flat(p.stijl),
  images: p.images.nodes,
  collections: p.collections.nodes.map((c) => c.handle),
  variants: p.variants.nodes.map((v) => ({
    ...v,
    image: v.image?.url ?? null,
    breedte: flat(v.breedte),
    lengte: flat(v.lengte),
    kleurfamilie: flat(v.kleurfamilie),
    accentkleuren: flat(v.accentkleuren),
  })),
}));

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ gesynchroniseerd: new Date().toISOString(), winkel: shop.name, domein: DOMAIN, collections, products: compact }));
const mb = (fs.statSync(OUT).size / 1e6).toFixed(1);
const varianten = compact.reduce((n, p) => n + p.variants.length, 0);
console.log(`Opgeslagen: ${compact.length} producten, ${varianten} varianten, ${collections.length} collecties → apps/prototype/.data/shopify-catalogus.json (${mb} MB, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
console.log("Draait het prototype al? Vernieuw de pagina — de nieuwe gegevens worden automatisch geladen. Anders: pnpm dev:prototype");
