#!/usr/bin/env node
// register-webhooks.mjs — koppelt de Shopify-webhooks aan de gedeployde site
// (apps/prototype, /api/webhooks/shopify), zodat teksten en foto's die de klant in de
// admin aanpast (metaobjects, collecties) meteen live staan in plaats van na 5 minuten.
//
// Idempotent: een subscription met hetzelfde topic, dezelfde URL en dezelfde filter wordt
// overgeslagen; wijst een topic naar een ándere URL of filter, dan wordt die vervangen.
//
// Draai NA de deploy die de route bevat (Shopify kan localhost niet bereiken, en een
// webhook die blijft falen schakelt Shopify uiteindelijk zelf uit):
//   node packages/catalog/register-webhooks.mjs https://brunic.vercel.app --dry-run
//   node packages/catalog/register-webhooks.mjs https://brunic.vercel.app
//   node packages/catalog/register-webhooks.mjs https://www.brunic.be --producten   # + productwijzigingen → nieuwe build
//
// Komt er een nieuw metaobject-type bij: dit script opnieuw draaien (de filter somt de
// types op, want Shopify eist bij metaobject-webhooks een filter op type).

import { admin, DOMAIN } from "./_shopify.mjs";

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const base = argv.find((a) => !a.startsWith("--"));

if (!base) {
  console.error("Gebruik: node register-webhooks.mjs <https://basis-url> [--dry-run]");
  process.exit(1);
}

const CALLBACK = `${base.replace(/\/$/, "")}/api/webhooks/shopify`;

const types = (await admin(`{ metaobjectDefinitions(first: 100) { nodes { type } } }`)).metaobjectDefinitions.nodes.map((d) => d.type).sort();
const METAFILTER = types.map((t) => `type:${t}`).join(" OR ");

/** Topic → filter ("" = geen filter). */
const TOPICS = {
  METAOBJECTS_CREATE: METAFILTER,
  METAOBJECTS_UPDATE: METAFILTER,
  METAOBJECTS_DELETE: METAFILTER,
  COLLECTIONS_UPDATE: "",
  // --producten: product- en collectiewijzigingen starten een nieuwe build van de site
  // (VERCEL_DEPLOY_HOOK_URL op Vercel, afgeremd tot 1 per kwartier per instantie — zie
  // apps/prototype/src/lib/catalog/herbouw.ts). Pas aanzetten als die deploy hook bestaat.
  ...(argv.includes("--producten") ? { PRODUCTS_CREATE: "", PRODUCTS_UPDATE: "", PRODUCTS_DELETE: "", COLLECTIONS_CREATE: "", COLLECTIONS_DELETE: "" } : {}),
};

const LIST = `query { webhookSubscriptions(first: 100) { nodes { id topic uri filter } } }`;
const CREATE = `mutation($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
  webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
    webhookSubscription { id topic uri filter } userErrors { field message }
  }
}`;
const DELETE = `mutation($id: ID!) {
  webhookSubscriptionDelete(id: $id) { deletedWebhookSubscriptionId userErrors { field message } }
}`;

console.log(`Store   : ${DOMAIN}`);
console.log(`Callback: ${CALLBACK}`);
console.log(`Types   : ${types.length} metaobject-types`);
console.log(dryRun ? "Modus   : DRY RUN\n" : "");

const bestaand = (await admin(LIST)).webhookSubscriptions.nodes;

for (const [topic, filter] of Object.entries(TOPICS)) {
  const zelfdeTopic = bestaand.filter((w) => w.topic === topic);
  if (zelfdeTopic.some((w) => w.uri === CALLBACK && (w.filter ?? "") === filter)) {
    console.log(`✓ ${topic} — al gekoppeld`);
    continue;
  }

  // Topic wijst naar een oude URL of filter (bv. vorige deploy-preview): opruimen.
  for (const oud of zelfdeTopic) {
    console.log(`↻ ${topic} — verwijder oude koppeling ${oud.uri}`);
    if (!dryRun) await admin(DELETE, { id: oud.id });
  }

  console.log(`+ ${topic} — aanmaken`);
  if (!dryRun) {
    const sub = { uri: CALLBACK, format: "JSON", ...(filter ? { filter } : {}) };
    const r = await admin(CREATE, { topic, sub });
    const err = r.webhookSubscriptionCreate.userErrors;
    if (err.length) console.error(`  ! ${topic}: ${err.map((e) => e.message).join(", ")}`);
  }
}

console.log("\nKlaar.");
