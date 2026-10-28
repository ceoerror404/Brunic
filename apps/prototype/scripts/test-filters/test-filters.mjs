/**
 * Test van het filtersysteem op de echte catalogus-momentopname (.data/shopify-catalogus.json),
 * voor elke hoofdcategorie: normalisatie, URL ⇄ toestand, elke getoonde filterwaarde, OF binnen
 * een filter, EN tussen filters en binnen Eigenschappen, lege combinaties, sorteren, pagineren,
 * oude links en verborgen filters. Drukt ook de dekkingsmatrix per afdeling af.
 *
 *   pnpm --filter @brunic/prototype test:filters
 *
 * Geen testframework of extra pakket: Node laadt de TypeScript-modules zelf (register.mjs).
 * docs/filtersysteem.md beschrijft wat er getest wordt en waarom.
 */
import assert from "node:assert/strict";

const imp = (p) => import(new URL(`../../src/${p}`, import.meta.url).href);
const { laadShopifyCatalogus } = await imp("lib/catalog/shopify-adapter.ts");
const { buildCategoryTree, descendantIds } = await imp("lib/catalog/tree.ts");
const { toListingItem } = await imp("lib/catalog/view.ts");
const { buildListing } = await imp("lib/catalog/listing.ts");
const F = await imp("lib/catalog/filters.ts");
const N = await imp("lib/catalog/facet-normalisatie.ts");
const { filterProfiel, FILTERPROFIEL_GEMENGD } = await imp("data/filterprofielen.ts");

let ok = 0;
const fouten = [];
function check(naam, fn) {
  try {
    fn();
    ok++;
  } catch (e) {
    fouten.push(`✖ ${naam}\n    ${String(e.message).split("\n").slice(0, 3).join("\n    ")}`);
  }
}
const ids = (item, key) => (item.facets[key] ?? []).map(F.waardeId);
const heeft = (item, key, id) => ids(item, key).includes(id);
const pct = (a, b) => `${Math.round((100 * a) / Math.max(b, 1))}%`;

/* ---------------- normalisatie (eenheden) ---------------- */
check("netjes: hoofdletter en vaste schrijfwijze", () => {
  assert.equal(N.netjes("  bloemen "), "Bloemen");
  assert.equal(N.netjes("3d"), "3D");
  assert.equal(N.netjes("ESTAhome"), "ESTAhome");
  assert.equal(N.netjes("toile de jouy"), "Toile de Jouy");
});
check("kleur: synoniemen en hoofdletters → één waarde", () => {
  assert.deepEqual(N.normaliseerFacetten({ kleur: ["Grijs", "grijs", "Grey", "gray", "Multicolor", "multicolour", "Goud/metallic"] }), { kleur: ["Grijs", "Meerkleurig", "Goud/metallic"] });
});
check("motief/stijl: 'Overig' valt weg, dubbels weg", () => {
  assert.deepEqual(N.normaliseerFacetten({ motief: ["overige prints", "bloemen", "Bloemen"], stijl: ["overig"] }), { motief: ["Bloemen"] });
});
check("maatklassen: breedte = kleinste zijde of diameter, stalen tellen niet", () => {
  assert.deepEqual(new Set(N.maatKlassen(["160 × 230 cm", "Rond Ø 140 cm", "Staal 21 × 30 cm", "80 x 150 cm", "240 × 340 cm", "Op maat"])), new Set(["120-170", "tot-120", "240-plus"]));
  assert.deepEqual(N.maatKlassen(["170 × 240 cm"]), ["170-240"]);
  assert.deepEqual(N.maatKlassen(["120 × 170 cm"]), ["120-170"]);
});
check("rolbreedte: één notatie in cm", () => {
  assert.deepEqual(N.normaliseerFacetten({ rolbreedte: N.rolbreedtes(["4 m", "400 cm", "67 cm", "2m"]) }), { rolbreedte: ["400 cm", "67 cm", "200 cm"] });
});
const spec = (o) => Object.entries(o).map(([label, value]) => ({ label, value }));
check("specs: lichtdoorlatendheid", () => {
  assert.deepEqual(new Set(N.facettenUitSpecs(spec({ Transparantie: "Gesloten, Black-out" })).lichtdoorlatendheid), new Set(["Gesloten", "Verduisterend (black-out)"]));
  assert.deepEqual(N.facettenUitSpecs(spec({ Transparantie: "Semi-transparant" })).lichtdoorlatendheid, ["Semi-transparant"]);
  assert.deepEqual(N.facettenUitSpecs(spec({ Transparantie: "Transparant" })).lichtdoorlatendheid, ["Transparant"]);
  // Artelux/Loft79 schrijven het als "Dichtheid", met een spatie in "Dim out".
  assert.deepEqual(new Set(N.facettenUitSpecs(spec({ Dichtheid: "Gesloten, Dim out" })).lichtdoorlatendheid), new Set(["Gesloten", "Lichtdempend (dim-out)"]));
  assert.deepEqual(new Set(N.facettenUitSpecs(spec({ Dichtheid: "Inbetween/Transparant" })).lichtdoorlatendheid), new Set(["Semi-transparant", "Transparant"]));
  assert.deepEqual(N.facettenUitSpecs(spec({ Eigenschappen: "Kamerhoog, Black out" })).lichtdoorlatendheid, ["Verduisterend (black-out)", "Gesloten"]);
});
check("specs: vloerverwarming ja/nee", () => {
  assert.deepEqual(N.facettenUitSpecs(spec({ Vloerverwarming: "Ja (Maximaal 27°C)" })).eigenschappen, ["Geschikt voor vloerverwarming"]);
  assert.deepEqual(N.facettenUitSpecs(spec({ Vloerverwarming: "Geschikt (maximaal 29°C)" })).eigenschappen, ["Geschikt voor vloerverwarming"]);
  assert.equal(N.facettenUitSpecs(spec({ Vloerverwarming: "Niet geschikt" })).eigenschappen?.length ?? 0, 0);
});
check("specs: eigenschappen — 'Niet wasbaar' is niet 'Wasbaar', afwasbaar ≠ wasbaar", () => {
  assert.equal(N.facettenUitSpecs(spec({ Eigenschappen: "Niet wasbaar" })).eigenschappen?.length ?? 0, 0);
  assert.deepEqual(N.facettenUitSpecs(spec({ Eigenschappen: "Kamerhoog, Wasbaar, Brandvertragend" })).eigenschappen, ["Kamerhoog", "Wasbaar", "Brandvertragend"]);
  assert.deepEqual(N.facettenUitSpecs(spec({ Onderhoud: "Extra goed afwasbaar" })).eigenschappen, ["Afwasbaar"]);
});
check("specs: slijtlaag, poolhoogte, gebruiksklasse, plaatsing", () => {
  assert.deepEqual(N.facettenUitSpecs(spec({ Slijtlaag: "0,25mm" })).slijtlaag, ["0,25 mm"]);
  assert.deepEqual(N.facettenUitSpecs(spec({ Slijtlaag: "0,4 mm" })).slijtlaag, ["0,40 mm"]);
  assert.deepEqual(N.facettenUitSpecs(spec({ Poolhoogte: "15/10 mm" })).poolhoogte, ["10-20"]);
  assert.deepEqual(N.facettenUitSpecs(spec({ Poolhoogte: "9 mm" })).poolhoogte, ["tot-10"]);
  assert.deepEqual(N.facettenUitSpecs(spec({ Poolhoogte: "25 mm" })).poolhoogte, ["20-plus"]);
  assert.deepEqual(N.facettenUitSpecs(spec({ "Residentiële gebruiksklasse": "23 Zwaar", "Commerciële gebruiksklasse": "33 Intensief" })).gebruiksklasse, ["23 – Wonen, intensief", "33 – Project, intensief"]);
  assert.deepEqual(N.facettenUitSpecs(spec({ Installatiemethode: "vastlijmen/loose-lay" })).plaatsing, ["Los gelegd", "Verlijmd"]);
});
check("specs: materiaal behang uit samenstelling, coating telt niet", () => {
  assert.deepEqual(N.facettenUitSpecs(spec({ Samenstelling: "krijtverf op vliesdrager" })).materiaal, ["Vlies"]);
  assert.deepEqual(N.facettenUitSpecs(spec({ Samenstelling: "100% polyester; coating: 100% acryl vlamvertragend" })).materiaal, ["Polyester"]);
});
check("specs: ruimte enkel kamers", () => {
  assert.deepEqual(N.facettenUitSpecs(spec({ "Geschikt voor": "Badkamer, horeca, Goed bestand tegen vlekken, hal" })).ruimte, ["Badkamer", "hal"]);
});

/* ---------------- URL ⇄ toestand ---------------- */
check("parse: labels, ID's en vervallen parameters", () => {
  const st = F.parseListState(new URLSearchParams("kleur=Grijs,Goud/metallic,grijs&prijs=25-50&sorteer=prijs-op&pagina=3&q=linnen&beschikbaarheid=op-voorraad&categorie=Behang"));
  assert.deepEqual(st.selection, { kleur: ["grijs", "goud-metallic"], prijs: ["25-50"], categorie: ["behang"] });
  assert.equal(st.sort, "prijs-op");
  assert.equal(st.page, 3);
  const qs = F.serializeListState(st, new URLSearchParams("q=linnen&beschikbaarheid=op-voorraad&weergave=producten"));
  const p = new URLSearchParams(qs.slice(1));
  assert.equal(p.get("q"), "linnen");
  assert.equal(p.get("weergave"), "producten");
  assert.equal(p.get("beschikbaarheid"), null);
  assert.equal(p.get("kleur"), "grijs,goud-metallic");
  assert.deepEqual(F.parseListState(p), st);
});
check("parse: onzin in pagina/sorteer valt terug", () => {
  const st = F.parseListState(new URLSearchParams("pagina=-4&sorteer=hack&kleur=,,"));
  assert.equal(st.page, 1);
  assert.equal(st.sort, "aanbevolen");
  assert.deepEqual(st.selection, {});
});

/* ---------------- per hoofdcategorie, op de echte catalogus ---------------- */
const { categories, products, info } = laadShopifyCatalogus();
console.log(info);
const tree = buildCategoryTree(categories);
const ROOTS = { c02: "Behang", c04: "Vloerbekleding", c03: "Tapijten", c05: "Gordijnen & stoffen" };
const matrix = [];

for (const [rootId, naam] of Object.entries(ROOTS)) {
  const desc = descendantIds(tree, rootId);
  const all = products.filter((p) => p.categoryIds.some((c) => desc.has(c)));
  const items = all.map((p) => toListingItem(p));
  const profiel = filterProfiel(rootId);
  const L = (sp) => buildListing(items, sp, {}, undefined, profiel);
  const basis = L({});
  console.log(`\n=== ${naam}: ${items.length} producten · filters getoond: ${basis.groups.map((g) => g.def.label).join(" · ")}`);
  for (const key of profiel) {
    const g = basis.groups.find((x) => x.def.key === key);
    const dekking = items.filter((i) => (i.facets[key] ?? []).length).length;
    const regel = `${(F.FACET_BY_KEY.get(key)?.label ?? key).padEnd(20)} ${g ? "getoond  " : "verborgen"} ${String(g?.options.length ?? 0).padStart(3)} waarden · dekking ${String(dekking).padStart(4)}/${items.length} (${pct(dekking, items.length)})`;
    console.log(`  ${regel} · ${(g?.options ?? []).slice(0, 10).map((o) => `${o.label} (${o.count})`).join(", ")}${(g?.options.length ?? 0) > 10 ? " …" : ""}`);
    matrix.push({ naam, key, getoond: Boolean(g), waarden: g?.options.length ?? 0, dekking, totaal: items.length });
  }

  check(`${naam}: basis = alle producten, pagina 1`, () => {
    assert.equal(basis.total, items.length);
    assert.equal(basis.items.length, Math.min(F.PAGE_SIZE, items.length));
    assert.ok(!("facets" in basis.items[0]) && !("vormen" in basis.items[0]), "filterdata hoort niet bij de browser");
  });

  // Elke getoonde waarde, alleen gekozen: totaal = optie-aantal = handmatige telling.
  for (const g of basis.groups) {
    for (const o of g.options) {
      check(`${naam}: ${g.def.key}=${o.value}`, () => {
        const verwacht = items.filter((i) => heeft(i, g.def.key, o.value)).length;
        const r = L({ [g.def.key]: o.value });
        assert.equal(o.count, verwacht, `optie toont ${o.count}, data zegt ${verwacht}`);
        assert.equal(r.total, verwacht, `lijst toont ${r.total}, data zegt ${verwacht}`);
        assert.ok(verwacht > 0, "een getoonde waarde zonder producten");
      });
    }
    check(`${naam}: ${g.def.key} — één schrijfwijze per waarde`, () => {
      assert.equal(new Set(g.options.map((o) => o.value)).size, g.options.length);
      assert.equal(new Set(g.options.map((o) => o.label.toLowerCase())).size, g.options.length, g.options.map((o) => o.label).join("|"));
      for (const o of g.options) {
        assert.ok(!/^overige?\b/i.test(o.label), `"${o.label}"`);
        if (g.def.kind !== "bucket") assert.ok(/^[\p{Lu}\d]/u.test(o.label), `"${o.label}" begint niet met een hoofdletter`);
        if (g.def.kind === "swatch") assert.ok(o.swatch, `geen kleurstaal voor "${o.label}"`);
      }
    });
  }

  // OF binnen een filter: de eerste twee waarden samen = unie.
  for (const g of basis.groups.filter((x) => x.def.logica !== "en" && x.options.length >= 2)) {
    const [a, b] = g.options;
    check(`${naam}: ${g.def.key}=${a.value},${b.value} (OF)`, () => {
      const r = L({ [g.def.key]: `${a.value},${b.value}` });
      const verwacht = items.filter((i) => heeft(i, g.def.key, a.value) || heeft(i, g.def.key, b.value)).length;
      assert.equal(r.total, verwacht);
      const gg = r.groups.find((x) => x.def.key === g.def.key);
      assert.ok(gg && [a, b].every((v) => gg.options.some((o) => o.value === v.value)), "gekozen waarden verdwenen");
    });
  }

  // EN binnen Eigenschappen: de twee meest voorkomende samen = doorsnede; tellingen houden rekening met de eigen keuze.
  const eg = basis.groups.find((x) => x.def.logica === "en");
  if (eg && eg.options.length >= 2) {
    const [a, b] = eg.options;
    check(`${naam}: eigenschappen=${a.value},${b.value} (EN)`, () => {
      const r = L({ eigenschappen: `${a.value},${b.value}` });
      const verwacht = items.filter((i) => heeft(i, "eigenschappen", a.value) && heeft(i, "eigenschappen", b.value)).length;
      assert.equal(r.total, verwacht);
      const metA = L({ eigenschappen: a.value }).groups.find((x) => x.def.key === "eigenschappen");
      assert.equal(metA.options.find((o) => o.value === b.value)?.count ?? 0, verwacht, "telling van een extra eigenschap");
    });
  }

  // EN tussen filters: paren uit de eerste vijf filters; tellingen in beide groepen kloppen met de doorsnede.
  const top = basis.groups.slice(0, 5);
  for (let x = 0; x < top.length; x++) {
    for (let y = x + 1; y < top.length; y++) {
      const gx = top[x];
      const gy = top[y];
      const a = gx.options[0];
      // Een waarde in gy die samen met a iets oplevert.
      const b = gy.options.find((o) => items.some((i) => heeft(i, gx.def.key, a.value) && heeft(i, gy.def.key, o.value)));
      if (!b) continue;
      check(`${naam}: ${gx.def.key}=${a.value} & ${gy.def.key}=${b.value}`, () => {
        const r = L({ [gx.def.key]: a.value, [gy.def.key]: b.value });
        const verwacht = items.filter((i) => heeft(i, gx.def.key, a.value) && heeft(i, gy.def.key, b.value)).length;
        assert.equal(r.total, verwacht);
        assert.equal(r.groups.find((g) => g.def.key === gy.def.key).options.find((o) => o.value === b.value).count, verwacht);
        assert.equal(r.groups.find((g) => g.def.key === gx.def.key).options.find((o) => o.value === a.value).count, verwacht);
        // Eén filter weghalen: de andere blijft, het resultaat = de enkele filter.
        const zonderA = L({ [gy.def.key]: b.value });
        assert.equal(zonderA.total, items.filter((i) => heeft(i, gy.def.key, b.value)).length);
        assert.deepEqual(zonderA.state.selection, { [gy.def.key]: [b.value] });
      });
    }
  }

  // Onmogelijke combinatie: lege lijst, beide keuzes blijven zichtbaar (aantal 0).
  outer: for (let x = 0; x < basis.groups.length; x++) {
    for (let y = x + 1; y < basis.groups.length; y++) {
      const gx = basis.groups[x];
      const gy = basis.groups[y];
      for (const a of gx.options) {
        const b = gy.options.find((o) => !items.some((i) => heeft(i, gx.def.key, a.value) && heeft(i, gy.def.key, o.value)));
        if (!b) continue;
        check(`${naam}: lege combinatie ${gx.def.key}=${a.value} & ${gy.def.key}=${b.value}`, () => {
          const r = L({ [gx.def.key]: a.value, [gy.def.key]: b.value });
          assert.equal(r.total, 0);
          assert.equal(r.items.length, 0);
          assert.ok(r.groups.find((g) => g.def.key === gx.def.key)?.options.some((o) => o.value === a.value));
          assert.ok(r.groups.find((g) => g.def.key === gy.def.key)?.options.some((o) => o.value === b.value && o.count === 0));
        });
        break outer;
      }
    }
  }

  // Sortering behoudt filters; prijs oplopend = oplopend met "op aanvraag" achteraan.
  const g0 = basis.groups[0];
  check(`${naam}: sorteren behoudt de filter`, () => {
    const a = g0.options[0].value;
    const r = L({ [g0.def.key]: a, sorteer: "naam" });
    assert.equal(r.total, L({ [g0.def.key]: a }).total);
    const titels = r.items.map((i) => i.title);
    assert.deepEqual(titels, [...titels].sort((p, q) => p.localeCompare(q, "nl")));
    const prijs = L({ sorteer: "prijs-op", pagina: "999" }).items.map((i) => (i.pricing === "fixed" && i.price ? i.price.amount.amount : null));
    const vast = prijs.filter((p) => p !== null);
    assert.deepEqual(vast, [...vast].sort((p, q) => p - q));
    assert.ok(prijs.indexOf(null) === -1 || prijs.slice(prijs.indexOf(null)).every((p) => p === null), "op aanvraag niet achteraan");
  });

  // Paginering: pagina 2 = 96 kaarten (of alles), zelfde volgorde als pagina 1.
  check(`${naam}: paginering`, () => {
    const p1 = L({});
    const p2 = L({ pagina: "2" });
    assert.equal(p2.items.length, Math.min(2 * F.PAGE_SIZE, items.length));
    assert.deepEqual(p2.items.slice(0, F.PAGE_SIZE).map((i) => i.id), p1.items.map((i) => i.id));
    assert.equal(new Set(L({ pagina: "999" }).items.map((i) => i.id)).size, items.length, "dubbele of ontbrekende producten over de pagina's");
  });

  // Oude links met labels werken nog; vervallen en niet-getoonde filters filteren niet stilletjes.
  check(`${naam}: oude links en verborgen filters`, () => {
    const opt = basis.groups.find((g) => g.def.kind !== "bucket")?.options[0];
    const key = basis.groups.find((g) => g.def.kind !== "bucket").def.key;
    assert.equal(L({ [key]: opt.label }).total, L({ [key]: opt.value }).total);
    const vreemd = F.FACETS.map((f) => f.key).find((k) => !profiel.includes(k));
    const r = L({ beschikbaarheid: "op-voorraad", eenheid: "per-rol", [vreemd]: "iets" });
    assert.equal(r.total, items.length);
    assert.deepEqual(r.state.selection, {});
  });
}

/* ---------------- gemengde lijsten ---------------- */
check("gemengd: alle producten → gemengd profiel met Categorie", () => {
  const items = products.map((p) => toListingItem(p, tree));
  const r = buildListing(items, {});
  assert.deepEqual(r.groups.map((g) => g.def.key).filter((k) => !FILTERPROFIEL_GEMENGD.includes(k)), []);
  assert.equal(r.groups[0].def.key, "categorie");
  const behang = r.groups[0].options.find((o) => o.value === "behang");
  assert.equal(buildListing(items, { categorie: "behang" }).total, behang.count);
});
check("gemengd: één merk in één afdeling → profiel van die afdeling", () => {
  const items = products.filter((p) => p.brand === "ESTAhome").map((p) => toListingItem(p, tree));
  const r = buildListing(items, {});
  assert.ok(r.groups.some((g) => g.def.key === "ruimte"), r.groups.map((g) => g.def.key).join(","));
  assert.ok(!r.groups.some((g) => g.def.key === "categorie"));
});

console.log(`\n${ok} geslaagd, ${fouten.length} mislukt`);
for (const f of fouten.slice(0, 40)) console.log(f);
if (fouten.length > 40) console.log(`… en ${fouten.length - 40} meer`);
process.exitCode = fouten.length ? 1 : 0;
