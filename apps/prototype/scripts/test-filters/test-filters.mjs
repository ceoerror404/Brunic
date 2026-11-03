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
const { imagesForVariant, standaardVariant, fotoTrede, toonHeleFoto } = await imp("lib/catalog/product.ts");
const { compactSrc } = await imp("lib/catalog/cdn.ts");
const { searchProducts } = await imp("lib/catalog/search.ts");
const { productJsonLd } = await imp("lib/site/seo.ts");

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
const VARIANTFILTER = new Set(F.VARIANT_FACETS);
/** Past een item bij een keuze? De variantfilters (kleur, maat, vorm, prijs) moeten samen op één variant kloppen. */
const past = (item, keuze) => {
  const paren = Object.entries(keuze);
  if (!paren.filter(([k]) => !VARIANTFILTER.has(k)).every(([k, id]) => heeft(item, k, id))) return false;
  const opVariant = paren.filter(([k]) => VARIANTFILTER.has(k));
  return !opVariant.length || item.varianten.some((v) => opVariant.every(([k, id]) => v.waarden[k]?.includes(id)));
};
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
      const b = gy.options.find((o) => items.some((i) => past(i, { [gx.def.key]: a.value, [gy.def.key]: o.value })));
      if (!b) continue;
      check(`${naam}: ${gx.def.key}=${a.value} & ${gy.def.key}=${b.value}`, () => {
        const r = L({ [gx.def.key]: a.value, [gy.def.key]: b.value });
        const verwacht = items.filter((i) => past(i, { [gx.def.key]: a.value, [gy.def.key]: b.value })).length;
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
        const b = gy.options.find((o) => !items.some((i) => past(i, { [gx.def.key]: a.value, [gy.def.key]: o.value })));
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

  // Audit R3-03: na een keuze staat er nooit een filter zonder waarden.
  check(`${naam}: geen lege filtergroepen na een keuze`, () => {
    for (const g of basis.groups) {
      for (const o of g.options) {
        const leeg = L({ [g.def.key]: o.value }).groups.filter((x) => x.options.length === 0);
        assert.equal(leeg.length, 0, `${g.def.key}=${o.value}: ${leeg.map((x) => x.def.key).join(",")}`);
      }
    }
  });

  // Audit R3-21: de kaart toont de variant die aan de keuze voldoet.
  const kaartVariant = (kaart) => {
    const p = all.find((x) => x.id === kaart.id);
    return { p, v: kaart.variantId ? p.variants.find((x) => x.id === kaart.variantId) : standaardVariant(p) };
  };
  check(`${naam}: de kaart volgt de kleurfilter`, () => {
    for (const o of basis.groups.find((g) => g.def.key === "kleur")?.options ?? []) {
      for (const kaart of L({ kleur: o.value, pagina: "999" }).items) {
        const { p, v } = kaartVariant(kaart);
        const opVariant = p.variants.some((x) => (x.kleurfamilies ?? []).map(F.waardeId).includes(o.value));
        if (!opVariant) continue; // de kleur staat enkel op het product: elke variant telt
        assert.ok((v.kleurfamilies ?? []).map(F.waardeId).includes(o.value), `${p.slug}: ${o.value} toont variant ${v.id}`);
        const kleur = v.options.Kleur;
        if (kleur && p.options.find((x) => x.name === "Kleur")?.values.length > 4) {
          assert.ok(kaart.swatches.some((s) => s.value === kleur), `${p.slug}: gekozen kleur ${kleur} niet bij de stalen`);
        }
      }
    }
  });
}

/* ---------------- beeld, kleur en prijs op de kaart (audit 31/10/2026, R3-02, -04, -05, -21) ---------------- */
{
  const desc = descendantIds(tree, "c03");
  const tapijten = products.filter((p) => p.categoryIds.some((c) => desc.has(c)));
  const items = tapijten.map((p) => toListingItem(p));
  const L = (sp) => buildListing(items, sp, {}, undefined, filterProfiel("c03"));
  const klassen = F.PRICE_BUCKETS.filter((b) => b.value !== "op-aanvraag");
  const inKlasse = (v, b) => v.price && v.price.amount.amount >= b.min && v.price.amount.amount < b.max;
  const metPrijs = tapijten.filter((p) => p.pricing === "fixed");

  check("prijsfilter: een tapijt staat in elke klasse waarin een van zijn maten valt", () => {
    for (const b of klassen) {
      const verwacht = metPrijs.filter((p) => p.variants.some((v) => inKlasse(v, b))).map((p) => p.id).sort();
      assert.deepEqual(L({ prijs: b.value, pagina: "999" }).items.map((i) => i.id).sort(), verwacht, b.value);
    }
  });
  check("maat + prijs: de prijs geldt voor een maat in die klasse", () => {
    for (const m of F.MAAT_BUCKETS) {
      for (const b of klassen) {
        const verwacht = metPrijs.filter((p) => p.variants.some((v) => N.maatKlassen([v.options.Maat ?? ""]).includes(m.value) && inKlasse(v, b))).length;
        const r = L({ maat: m.value, prijs: b.value });
        assert.equal(r.total, verwacht, `${m.value} + ${b.value}`);
        assert.equal(r.groups.find((g) => g.def.key === "prijs").options.find((o) => o.value === b.value)?.count ?? 0, verwacht, "telling prijs");
        assert.equal(r.groups.find((g) => g.def.key === "maat").options.find((o) => o.value === m.value)?.count ?? 0, verwacht, "telling maat");
      }
    }
  });
  check("prijsfilter: de kaart toont een prijs in de gekozen klasse en de link opent daarop", () => {
    for (const b of klassen) {
      for (const k of L({ prijs: b.value, pagina: "999" }).items) {
        const prijs = k.price?.amount.amount;
        assert.ok(prijs >= b.min && prijs < b.max, `${k.slug}: € ${prijs} bij ${b.value}`);
        const p = tapijten.find((x) => x.id === k.id);
        const v = k.variantId ? p.variants.find((x) => x.id === k.variantId) : standaardVariant(p);
        assert.equal(v.price?.amount.amount, prijs, `${k.slug}: de link opent niet op de getoonde prijs`);
      }
    }
  });
  check("sorteren op prijs volgt de prijs op de kaart", () => {
    const prijzen = L({ prijs: "250-plus", sorteer: "prijs-op", pagina: "999" }).items.map((k) => k.price.amount.amount);
    assert.deepEqual(prijzen, [...prijzen].sort((a, b) => a - b));
  });
  check("vormfilter: de kaart linkt naar een maat in die vorm", () => {
    for (const k of L({ vorm: "rond", pagina: "999" }).items) {
      const p = tapijten.find((x) => x.id === k.id);
      const v = k.variantId ? p.variants.find((x) => x.id === k.variantId) : standaardVariant(p);
      assert.equal(v.vorm, "Rond", k.slug);
    }
  });
  check("de browser krijgt geen servergegevens", () => {
    const k = L({ kleur: "grijs" }).items[0];
    for (const veld of ["varianten", "kleuren", "standaardId", "facets", "vormen", "createdAt", "popularity"]) assert.ok(!(veld in k), veld);
  });

  // Audit 02/11/2026, R4-01 tot R4-05: kaart, staal en productpagina komen uit dezelfde variant.
  const opties = (key) => L({}).groups.find((g) => g.def.key === key)?.options.map((o) => o.value) ?? [];
  const lijstKeuzes = [
    ...["maat", "vorm", "prijs", "kleur"].flatMap((key) => opties(key).filter((w) => w !== "op-aanvraag").map((w) => ({ [key]: w }))),
    ...opties("maat").flatMap((m) => opties("merk").map((merk) => ({ maat: m, merk }))),
    ...opties("maat").flatMap((m) => opties("kleur").map((kleur) => ({ maat: m, kleur }))),
  ];
  const vormLijsten = [["Rond"], ["Organisch"]].flatMap(([vorm]) => [{}, ...opties("maat").map((maat) => ({ maat })), ...opties("kleur").map((kleur) => ({ kleur }))].map((keuze) => ({ keuze, vorm })));
  const alleKaarten = [
    ...lijstKeuzes.flatMap((keuze) => L({ ...keuze, pagina: "999" }).items.map((k) => ({ k, keuze }))),
    ...vormLijsten.flatMap(({ keuze, vorm }) => buildListing(items, { ...keuze, pagina: "999" }, {}, vorm, filterProfiel("c03")).items.map((k) => ({ k, keuze, vorm }))),
  ];
  const perId = new Map(tapijten.map((p) => [p.id, p]));
  const variantVan = (p, id) => (id ? p.variants.find((x) => x.id === id) : standaardVariant(p));
  const beeldVan = (p, v) => {
    const kleur = v.options.Kleur;
    const heeftBeeld = !kleur || p.images.some((i) => !i.optionValue || i.optionValue === kleur);
    const eerste = heeftBeeld ? imagesForVariant(p, v)[0] : undefined;
    return eerste ? compactSrc(eerste.src) : undefined;
  };

  check("toonvariant: kaart en staal tonen het eerste beeld van de productpagina", () => {
    assert.ok(alleKaarten.length > 5000, `${alleKaarten.length} kaarten`);
    for (const { k } of alleKaarten) {
      const p = perId.get(k.id);
      const verwacht = beeldVan(p, variantVan(p, k.variantId));
      if (verwacht) assert.equal(k.image?.src, verwacht, `${k.slug}: kaartbeeld`);
      for (const s of k.swatches) {
        const sv = beeldVan(p, variantVan(p, s.variantId));
        if (sv) assert.equal(s.image?.src, sv, `${k.slug} ${s.value}: staalbeeld`);
      }
    }
  });
  check("toonvariant: na een klik op een staal klopt de prijs met de pagina (R4-01)", () => {
    for (const { k } of alleKaarten) {
      const p = perId.get(k.id);
      for (const s of k.swatches) {
        const v = variantVan(p, s.variantId);
        const getoond = s.price !== undefined ? s.price : k.price;
        if (v.price) assert.equal(getoond?.amount.amount, v.price.amount.amount, `${k.slug} ${s.value}: kaart € ${getoond?.amount.amount}, pagina € ${v.price.amount.amount}`);
      }
    }
  });
  check("toonvariant: het staal van de kaartkleur opent op dezelfde variant als de kaart", () => {
    for (const { k } of alleKaarten) {
      const p = perId.get(k.id);
      const v = variantVan(p, k.variantId);
      const s = k.swatches.find((x) => x.value === v.options.Kleur);
      if (!s) continue;
      assert.equal(s.variantId, v.id, `${k.slug}: staal ${s.variantId}, kaart ${v.id}`);
      assert.equal(s.price, undefined, `${k.slug}: staal van de kaartkleur met een andere prijs`);
    }
  });
  check("toonvariant: zonder vormkeuze een gewone maat als die aan de filter voldoet (R4-02)", () => {
    const BIJZONDER = new Set(["Rond", "Organisch", "Loper"]);
    for (const { k, keuze, vorm } of alleKaarten) {
      if (vorm || keuze.vorm) continue;
      const p = perId.get(k.id);
      const v = variantVan(p, k.variantId);
      if (!BIJZONDER.has(v.vorm)) continue;
      const it = items.find((x) => x.id === k.id);
      const actief = F.actieveVariantFilters(Object.fromEntries(Object.entries(keuze).map(([a, b]) => [a, [b]])));
      const gewoon = it.varianten.filter((x) => x.kleur === v.options.Kleur && F.variantVoldoet(x.waarden, actief) && !BIJZONDER.has(x.vorm) && !x.staal && x.availability !== "uitverkocht");
      assert.equal(gewoon.length, 0, `${k.slug}: ${v.vorm} terwijl een gewone maat bestaat`);
    }
  });
  check("toonvariant: een sfeerfoto komt ook met een filter enkel eerst als die kleur niets anders heeft (R4-04)", () => {
    for (const { k } of alleKaarten) {
      const p = perId.get(k.id);
      const v = variantVan(p, k.variantId);
      const eerste = p.images.find((i) => compactSrc(i.src) === k.image?.src);
      if (!eerste || fotoTrede(eerste) === 0) continue;
      assert.ok(!imagesForVariant(p, v).some((i) => fotoTrede(i) < fotoTrede(eerste)), `${k.slug}: ${eerste.soort} terwijl er een betere foto is`);
    }
  });
  check("toonvariant: de vormfoto enkel als de variant die vorm echt heeft (R4-05)", () => {
    for (const { k, vorm } of alleKaarten) {
      if (!vorm) continue;
      const p = perId.get(k.id);
      const v = variantVan(p, k.variantId);
      const eerste = p.images.find((i) => compactSrc(i.src) === k.image?.src);
      if (eerste?.vorm) assert.equal(eerste.vorm, v.vorm, `${k.slug}: foto ${eerste.vorm}, variant ${v.vorm}`);
    }
  });
  check("toonvariant: hover in de kleur van de kaart, nooit hetzelfde beeld", () => {
    for (const { k } of alleKaarten) {
      if (!k.hoverImage) continue;
      assert.notEqual(k.hoverImage.src, k.image?.src, `${k.slug}: hover = kaartbeeld`);
      const p = perId.get(k.id);
      const v = variantVan(p, k.variantId);
      if ((p.options.find((o) => o.name === "Kleur")?.values.length ?? 0) <= 1) continue;
      const hover = p.images.find((i) => compactSrc(i.src) === k.hoverImage.src);
      assert.equal(hover?.optionValue, v.options.Kleur, `${k.slug}: kaart ${v.options.Kleur}, hover ${hover?.optionValue}`);
    }
  });
}

check("stalen: de vlakke foto van die kleur, een bolletje enkel zonder vlakke foto", () => {
  let foto = 0;
  for (const p of products) {
    for (const o of p.options) {
      if (!/kleur|color|colour/i.test(o.name)) continue;
      for (const w of o.values) {
        const vlak = p.images.find((i) => i.optionValue === w.value && fotoTrede(i) === 0);
        if (!vlak) continue;
        foto++;
        assert.ok(w.swatch?.startsWith("url("), `${p.slug} ${w.value}: ${w.swatch}`);
        assert.ok(w.swatch.includes(vlak.src.split("?")[0]), `${p.slug} ${w.value}: staal is niet de eerste vlakke foto`);
      }
    }
  }
  assert.ok(foto > 5000, `${foto} stalen met een foto`);
});
check("stalen: de kaart volgt hetzelfde: geen bolletje naast een vlakke foto", () => {
  for (const p of products) {
    for (const s of toListingItem(p).swatches) {
      if (!s.swatch || s.swatch.startsWith("url(")) continue;
      assert.ok(!p.images.some((i) => i.optionValue === s.value && fotoTrede(i) === 0), `${p.slug} ${s.value}: bolletje terwijl er een vlakke foto is`);
    }
  }
});
check("geen levertermijnen: geen ERP, dus geen belofte", () => {
  for (const p of products) {
    const labels = [...p.specs, ...p.dimensions].map((s) => s.label);
    assert.ok(!labels.some((l) => /^lever(tijd|termijn)$/i.test(l.trim())), `${p.slug}: ${labels.join(", ")}`);
    assert.ok(!/levertermijn|levertijd\s*\d/i.test(p.description), `${p.slug}: staat nog in de beschrijving`);
  }
});
check("beschrijving: geen tabel als lopende zin, en nooit leeg door het weghalen van de tabel", () => {
  for (const p of products) {
    assert.ok(!/Slijtlaag\s+\d[\d,.]*\s*mm\s+\S/i.test(p.description), `${p.slug}: tabel staat nog in de beschrijving`);
    assert.ok(!/<\/?(table|tr|td)\b/i.test(p.description), `${p.slug}: tabel-HTML in de beschrijving`);
  }
});
check("vloerkleden tonen de hele foto, andere producten niet", () => {
  const vloerkleden = products.filter((p) => toonHeleFoto(p.facets.type?.[0]));
  assert.ok(vloerkleden.length > 100, `${vloerkleden.length} vloerkleden`);
  for (const p of vloerkleden) assert.equal(toListingItem(p).type, "Vloerkleed", p.slug);
  assert.ok(!toonHeleFoto("Behang") && !toonHeleFoto("Gordijnstof") && !toonHeleFoto(undefined));
});

check("kaart en productpagina openen op hetzelfde beeld", () => {
  for (const p of products) {
    const eerste = imagesForVariant(p, standaardVariant(p))[0];
    assert.equal(toListingItem(p).image?.src, eerste ? compactSrc(eerste.src) : undefined, p.slug);
  }
});
check("een sfeer- of rolfoto komt enkel eerst als er niets anders is", () => {
  for (const p of products) {
    const eerste = imagesForVariant(p, standaardVariant(p))[0];
    if (!eerste || fotoTrede(eerste) === 0) continue;
    const beter = p.variants.some((v) => imagesForVariant(p, v)[0] && fotoTrede(imagesForVariant(p, v)[0]) < fotoTrede(eerste));
    assert.ok(!beter || p.variants.every((v) => v.availability === "uitverkocht"), `${p.slug}: ${eerste.soort} terwijl een andere variant beter kan`);
    for (const v of p.variants) {
      const lijst = imagesForVariant(p, v);
      const rol = lijst.findIndex((i) => i.soort === "rol");
      if (rol >= 0) assert.ok(lijst.slice(rol).every((i) => i.soort === "rol"), `${p.slug}: rolfoto voor een andere foto`);
    }
  }
});
check("hover: enkel een foto in de kleur van de kaart", () => {
  for (const p of products) {
    const k = toListingItem(p);
    if (!k.hoverImage) continue;
    const hover = p.images.find((i) => compactSrc(i.src) === k.hoverImage.src);
    const ko = p.options.find((o) => /kleur|color|colour/i.test(o.name));
    if (!ko || ko.values.length <= 1) continue;
    const kleur = standaardVariant(p).options[ko.name];
    assert.equal(hover?.optionValue, kleur, `${p.slug}: kaart ${kleur}, hover ${hover?.optionValue ?? "zonder kleur"}`);
    assert.notEqual(k.hoverImage.src, k.image?.src, `${p.slug}: hover = kaartbeeld`);
  }
});
check("de kaart kiest een kleur met een hoverbeeld als dat kan, zonder een slechter eerste beeld", () => {
  for (const p of products) {
    const k = toListingItem(p);
    if (k.hoverImage) continue;
    const ko = p.options.find((o) => /kleur|color|colour/i.test(o.name));
    if (!ko || ko.values.length < 2) continue;
    const trede = fotoTrede(imagesForVariant(p, standaardVariant(p))[0] ?? { soort: "rol" });
    for (const v of p.variants.filter((x) => x.availability !== "uitverkocht" && !Object.values(x.options).some((w) => /staal/i.test(w)))) {
      const eerste = imagesForVariant(p, v)[0];
      if (!eerste || fotoTrede(eerste) > trede) continue;
      const anderBeeld = p.images.some((i) => i.src !== eerste.src && i.soort !== "rol" && i.optionValue === v.options[ko.name]);
      assert.ok(!anderBeeld, `${p.slug}: geen hover, terwijl kleur ${v.options[ko.name]} er een heeft`);
    }
  }
});
check("Beauflor: _rsh_ is een sfeerfoto, _psh een productfoto", () => {
  const beelden = products.flatMap((p) => p.images);
  const rsh = beelden.filter((i) => /_rsh[_.]/i.test(i.src.split("?")[0]));
  const psh = beelden.filter((i) => /_psh[_.]/i.test(i.src.split("?")[0]));
  assert.ok(rsh.length > 0 && psh.length > 0);
  assert.ok(rsh.every((i) => i.soort === "sfeer"));
  assert.ok(psh.every((i) => i.soort === "product"));
});
check("Breedte is geen kleur: geen kleurbeelden, wel een rolbreedte", () => {
  const enkelBreedte = products.filter((p) => p.options.length === 1 && /breedte/i.test(p.options[0].name));
  assert.ok(enkelBreedte.length > 0);
  for (const p of enkelBreedte) {
    assert.ok(p.images.every((i) => !i.optionValue), `${p.slug}: foto aan een breedte gekoppeld`);
    assert.ok(p.facets.rolbreedte?.length > 0, `${p.slug}: geen rolbreedte`);
  }
});
check("Desso staat onder Tarkett en blijft vindbaar", () => {
  assert.equal(products.filter((p) => p.brand === "Desso" || p.facets.merk?.includes("Desso")).length, 0);
  const desso = products.filter((p) => p.merkBron === "Desso");
  assert.ok(desso.length > 0 && desso.every((p) => p.brand === "Tarkett" && p.specs.find((s) => s.label === "Merk")?.value === "Tarkett"));
  const gevonden = new Set(searchProducts(products, tree, "desso").map((p) => p.id));
  assert.ok(desso.every((p) => gevonden.has(p.id)), "niet elk Desso-product is vindbaar op 'desso'");
  assert.deepEqual(F.parseListState(new URLSearchParams("merk=desso,tarkett")).selection, { merk: ["tarkett"] });
  assert.equal(products.filter((p) => /^fuse b755/i.test(p.title)).length, 2, "Fuse B755: de twee ontwerpen moeten apart blijven");
});
check("geen voorraadbelofte aan zoekmachines", () => {
  for (const p of products) {
    const tekst = JSON.stringify(productJsonLd(p));
    assert.ok(!tekst.includes("InStock") && !tekst.includes("BackOrder"), p.slug);
    assert.equal(tekst.includes("OutOfStock"), p.pricing === "fixed" && p.variants.filter((v) => v.price).every((v) => v.availability === "uitverkocht"), p.slug);
  }
});

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
