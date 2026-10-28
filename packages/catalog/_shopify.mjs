// _shopify.mjs — gedeelde env-loader + Admin-GraphQL-helper voor de catalog-scripts.
// Leest SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_API_TOKEN, SHOPIFY_API_VERSION uit repo-root .env.
// Geen SHOPIFY_ADMIN_API_TOKEN? Dan via de Dev Dashboard-app (SHOPIFY_CLIENT_ID +
// SHOPIFY_CLIENT_SECRET, client credentials) — net als apps/prototype/src/lib/shopify/admin.ts.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function laadEnv() {
  try {
    const raw = readFileSync(join(ROOT, ".env"), "utf8");
    for (const regel of raw.split("\n")) {
      const m = regel.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* geen .env: dan moeten de vars al in de omgeving staan */
  }
}
laadEnv();

export const ROOT_DIR = ROOT;
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-10";
const { SHOPIFY_CLIENT_ID: CLIENT_ID, SHOPIFY_CLIENT_SECRET: CLIENT_SECRET } = process.env;

if (!DOMAIN || !(process.env.SHOPIFY_ADMIN_API_TOKEN || (CLIENT_ID && CLIENT_SECRET))) {
  console.error("SHOPIFY_STORE_DOMAIN en SHOPIFY_ADMIN_API_TOKEN (of SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET) ontbreken (.env).");
  process.exit(1);
}

async function clientToken() {
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.access_token) throw new Error(`Aanmelden bij Shopify mislukt (HTTP ${res.status})`);
  return json.access_token;
}
// Token van de client-credentials leeft 24 u — ruim genoeg voor één scriptrun.
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || (await clientToken());

export async function admin(query, variables = {}) {
  for (let poging = 1; ; poging++) {
    const res = await fetch(`https://${DOMAIN}/admin/api/${VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Admin API weigert de token (HTTP ${res.status}) — scopes?`);
    }
    const json = await res.json().catch(() => ({}));
    // Throttled (429 of THROTTLED): even wachten en opnieuw, zoals scripts/sync-shopify.mjs. Grote
    // reeksen schrijfopdrachten (25 metafields per oproep) lopen anders halverwege vast.
    const throttled = res.status === 429 || json.errors?.some?.((e) => e.extensions?.code === "THROTTLED");
    if (throttled && poging < 10) {
      await new Promise((r) => setTimeout(r, 1000 * poging));
      continue;
    }
    if (json.errors || !res.ok) throw new Error(`GraphQL (HTTP ${res.status}): ` + JSON.stringify(json.errors ?? json).slice(0, 400));
    return json.data;
  }
}

export { DOMAIN, VERSION };
