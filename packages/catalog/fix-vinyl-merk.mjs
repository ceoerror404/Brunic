#!/usr/bin/env node
// fix-vinyl-merk.mjs — de brunic.be-vinylimport (19/10) gaf 31 vinylproducten merk "Brunic",
// maar Brunic heeft geen eigen merk. Regel (Alexander, 20/10): begint met T of "Ster" → Tarkett,
// begint met B → Beauflor; de rest heeft een Tarkett-artikelnummer → Tarkett.
// Zet vendor + brunic.leverancier + handle (<type>-<titel>-<merk>) en werkt de push log bij.
// Tag "BRUNIC" wordt de merknaam. De gordijnstof in de log gaat uit eventuele vloer-collecties.
//
//   node packages/catalog/fix-vinyl-merk.mjs [--go]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { admin, ROOT_DIR } from "./_shopify.mjs";

const GO = process.argv.includes("--go");
const LOG = join(ROOT_DIR, "..", "Data", "BRUNIC_VINYL_SHOPIFY_PUSH_LOG.json");
const log = JSON.parse(readFileSync(LOG, "utf8").replace(/^﻿/, ""));

function merkVoor(bronHandle) {
  if (bronHandle.startsWith("b")) return "Beauflor";
  return "Tarkett"; // t…, ster…, en de rest (Tarkett-artikelnummers)
}

const Q = `query($id:ID!){ product(id:$id){ id title handle vendor tags
  leverancier: metafield(namespace:"brunic", key:"leverancier"){ type value }
  collections(first:20){ nodes{ id handle } } } }`;

const STOF = "stof-babyblauw-black-out-beatrix-h7-1-40m";
const teDoen = log.filter((r) => r.handle.endsWith("-brunic") && r.id);

for (const r of teDoen) {
  const { product: p } = await admin(Q, { id: r.id });
  if (!p) { console.log(`! niet gevonden: ${r.handle}`); continue; }

  if (r.bron_handle === STOF) {
    const vloer = p.collections.nodes.filter((c) => c.handle.startsWith("vloerbekleding"));
    console.log(`STOF  ${p.title}: uit ${vloer.map((c) => c.handle).join(", ") || "(geen vloercollecties)"}`);
    if (GO) {
      for (const c of vloer) {
        const d = await admin(
          `mutation($id:ID!,$p:[ID!]!){ collectionRemoveProducts(id:$id, productIds:$p){ userErrors{ message } } }`,
          { id: c.id, p: [p.id] },
        );
        const e = d.collectionRemoveProducts.userErrors;
        if (e.length) console.log("   ! " + e.map((x) => x.message).join("; "));
      }
    }
    continue;
  }

  const merk = merkVoor(r.bron_handle);
  const handle = p.handle.replace(/-brunic$/, "-" + merk.toLowerCase());
  console.log(`${merk.padEnd(9)} ${p.title.padEnd(36)} ${p.vendor} → ${merk} · ${handle} · leverancier=${p.leverancier?.value ?? "-"}`);
  if (!GO) continue;

  const d = await admin(
    `mutation($p:ProductUpdateInput!){ productUpdate(product:$p){ product{ handle vendor } userErrors{ field message } } }`,
    {
      p: {
        id: p.id,
        vendor: merk,
        handle,
        redirectNewHandle: true,
        tags: [...p.tags.filter((t) => t !== "BRUNIC"), merk],
        ...(p.leverancier
          ? { metafields: [{ namespace: "brunic", key: "leverancier", type: p.leverancier.type, value: merk }] }
          : {}),
      },
    },
  );
  const e = d.productUpdate.userErrors;
  if (e.length) { console.log("   ! " + e.map((x) => x.message).join("; ")); continue; }
  r.handle = d.productUpdate.product.handle;
}

if (GO) {
  writeFileSync(LOG, JSON.stringify(log, null, 4));
  console.log(`\nKlaar · push log bijgewerkt (${LOG}). Draai een catalogus-sync zodat de site het oppikt.`);
} else {
  console.log("\nDRY-RUN — draai met --go om te schrijven.");
}
