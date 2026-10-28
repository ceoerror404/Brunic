#!/usr/bin/env node
// export-tagreview.mjs — maakt van een tagreview (reviewpagina op claude.ai) de export voor set-tapijt-tags.mjs.
// Invoer: een map met de twee collecties van de reviewpagina, zoals Claude ze bewaart met ArtifactData
// (`list` met `out_dir`): <map>/voorstellen/<handle>.json en <map>/beoordelingen/<handle>.json.
// Elke beoordeling (goedgekeurd of aangepast) wint van het voorstel; stoffen zonder beoordeling
// gaan niet mee, tenzij --ook-open.
//
//   node packages/catalog/export-tagreview.mjs <map> <uit.json> [--ook-open]
//   bv. → ../Data/BRUNIC_STOFFEN_TAGS_2026-10-25.json, daarna:
//   node packages/catalog/set-tapijt-tags.mjs ../Data/BRUNIC_STOFFEN_TAGS_2026-10-25.json --type Gordijnstof,Passement
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const [MAP, UIT] = args.filter((a) => !a.startsWith("--"));
const OOK_OPEN = args.includes("--ook-open");
if (!MAP || !UIT) {
  console.error("Gebruik: node packages/catalog/export-tagreview.mjs <map> <uit.json> [--ook-open]");
  process.exit(1);
}

// ArtifactData bewaart elk document als { id, version, data } of als het document zelf.
const lees = (dir) =>
  existsSync(dir)
    ? new Map(readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => {
        const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
        return [f.replace(/\.json$/, ""), j.data ?? j];
      }))
    : new Map();
const voorstellen = lees(join(MAP, "voorstellen"));
const beoordelingen = lees(join(MAP, "beoordelingen"));

const meestVoorkomend = (kleuren) => {
  const tel = new Map();
  for (const k of kleuren) if (k.hoofd) tel.set(k.hoofd, (tel.get(k.hoofd) ?? 0) + 1);
  return [...tel.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

const producten = [];
const tel = { goedgekeurd: 0, aangepast: 0, open: 0, overgeslagen: 0 };
for (const [handle, v] of [...voorstellen].sort((a, b) => (a[1].volgorde ?? 0) - (b[1].volgorde ?? 0))) {
  const b = beoordelingen.get(handle);
  const status = b ? (b.status === "aangepast" ? "aangepast" : "goedgekeurd") : "open";
  tel[status]++;
  if (!b && !OOK_OPEN) { tel.overgeslagen++; continue; }
  const bron = b ?? { motief: v.motief, stijl: v.stijl, kleuren: v.varianten };
  const perCode = new Map((bron.kleuren ?? []).map((k) => [k.kleur, k]));
  const kleuren = v.varianten.map((x) => {
    const k = perCode.get(x.kleur) ?? x;
    return { kleur: x.kleur, hoofd: k.hoofd, accenten: (k.accenten ?? []).filter((a) => a && a !== k.hoofd), bron: b?.status === "aangepast" ? "review" : "foto" };
  });
  producten.push({
    handle,
    titel: v.titel,
    merk: v.merk,
    motief: bron.motief ?? [],
    stijl: bron.stijl ?? [],
    kleurfamilie_product: meestVoorkomend(kleuren),
    kleuren,
    zekerheid_voorstel: v.zekerheid,
    beoordeling: b ? { status, op: b.op ?? null } : null,
  });
}

writeFileSync(UIT, JSON.stringify({ bron: "tagreview (claude.ai-reviewpagina) + export-tagreview.mjs", gemaakt: new Date().toISOString(), aantal: producten.length, producten }, null, 1));
console.log(`voorstellen ${voorstellen.size} · goedgekeurd ${tel.goedgekeurd} · aangepast ${tel.aangepast} · nog open ${tel.open}${tel.overgeslagen ? ` (niet in de export: ${tel.overgeslagen})` : ""}`);
console.log(`export: ${producten.length} producten → ${UIT}`);
