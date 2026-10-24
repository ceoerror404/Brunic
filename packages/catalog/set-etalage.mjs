#!/usr/bin/env node
// set-etalage.mjs — zet de brunic.etalage-vlag op alle producten van één collectie.
// Etalage = tonen-niet-verkopen: de storefront verbergt prijs + koopknop en toont
// "prijs op aanvraag / kom langs" (apps/prototype/src/app/api/kassa/route.ts blokkeert de checkout).
//
//   node packages/catalog/set-etalage.mjs <collectie-handle> <true|false>
//   node packages/catalog/set-etalage.mjs raamdecoratie true
import { admin } from "./_shopify.mjs";

const [handle, vlagArg] = process.argv.slice(2);
if (!handle || (vlagArg !== "true" && vlagArg !== "false")) {
  console.error("Gebruik: node set-etalage.mjs <collectie-handle> <true|false>");
  process.exit(1);
}

const col = await admin(`query($h:String!){ collectionByHandle(handle:$h){ id title } }`, { h: handle });
if (!col.collectionByHandle) {
  console.error(`Collectie '${handle}' niet gevonden.`);
  process.exit(1);
}
const colId = col.collectionByHandle.id;

// alle product-ids van de collectie ophalen
const ids = [];
let cursor = null;
do {
  const d = await admin(
    `query($id:ID!,$c:String){ collection(id:$id){ products(first:100, after:$c){ nodes{ id title } pageInfo{ hasNextPage endCursor } } } }`,
    { id: colId, c: cursor },
  );
  for (const n of d.collection.products.nodes) ids.push(n);
  cursor = d.collection.products.pageInfo.hasNextPage ? d.collection.products.pageInfo.endCursor : null;
} while (cursor);

console.log(`Collectie '${col.collectionByHandle.title}': ${ids.length} producten → etalage=${vlagArg}\n`);

const SET = `mutation($mfs:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$mfs){ userErrors{ field message } } }`;
for (let i = 0; i < ids.length; i += 25) {
  const batch = ids.slice(i, i + 25);
  const mfs = batch.map((p) => ({
    ownerId: p.id,
    namespace: "brunic",
    key: "etalage",
    type: "boolean",
    value: vlagArg,
  }));
  const r = await admin(SET, { mfs });
  const errs = r.metafieldsSet.userErrors;
  if (errs.length) console.log("! ", errs.map((e) => e.message).join("; "));
  for (const p of batch) console.log(`  ✓ ${p.title}`);
}
console.log("\nKlaar.");
