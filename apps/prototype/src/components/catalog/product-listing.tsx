"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useOptimistic, useRef, useState, useTransition, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import type { ListingData } from "@/lib/catalog/listing";
import { activeFilterCount, labelFor, PAGE_SIZE, serializeListState, SORTS, VARIANT_FACETS, type FacetGroup, type FacetLabelMap, type ListState, type SortKey } from "@/lib/catalog/filters";
import { normalize } from "@/lib/catalog/search";
import { useWielBinnen } from "@/lib/site/scroll";
import { Drawer } from "@/components/ui/drawer";
import { Icon } from "@/components/ui/icon";
import { ProductCard } from "./product-card";

const NO_LABELS: FacetLabelMap = {};

/** Vanaf zoveel waarden krijgt een vrije lijst een zoekveld en "Toon alle". */
const LANGE_LIJST = 10;
const EERST_ZICHTBAAR = 8;

const headerHoogte = () => Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 106;

const VERTREK = "brunic-lijst-vertrek";

function schrijfVertrekpositie(y: number | null) {
  try {
    if (y === null) sessionStorage.removeItem(VERTREK);
    else sessionStorage.setItem(VERTREK, JSON.stringify({ url: window.location.href, y }));
  } catch {
    /* geen sessionStorage (privémodus): de browser herstelt zelf zo goed als hij kan */
  }
}

/** De positie van bij het vertrek, eenmalig: enkel als dit document net herladen of via "terug" geopend is, op dezelfde URL. */
function leesVertrekpositie(): number | null {
  try {
    const opgeslagen = sessionStorage.getItem(VERTREK);
    if (!opgeslagen) return null;
    sessionStorage.removeItem(VERTREK);
    const soort = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type;
    const { url, y } = JSON.parse(opgeslagen) as { url: string; y: number };
    return (soort === "reload" || soort === "back_forward") && performance.now() < 15000 && url === window.location.href ? y : null;
  } catch {
    return null;
  }
}

/**
 * Productlijst met filters, sortering en "meer laden" — dezelfde component voor elke lijst in
 * de winkel. De toestand leeft in de URL (deelbaar, terugknop werkt). Filteren, tellen en
 * pagineren gebeurt op de server (lib/catalog/listing.ts, B11): deze component krijgt enkel de
 * getoonde producten en de filtergroepen, en vraagt bij elke keuze een nieuwe serverrender.
 * Keuzes verschijnen meteen (optimistisch); het raster dimt tot de nieuwe lijst er is.
 * Desktop (filterknoppen) en mobiel (lade) gebruiken dezelfde groepen en dezelfde logica.
 */
export function ProductListing({
  data,
  promo,
  emptyState,
  showOffersToggle = true,
  facetLabels = NO_LABELS,
}: {
  data: ListingData;
  /** Labels voor filterwaarden die slugs zijn (bv. hoofdcategorie). */
  facetLabels?: FacetLabelMap;
  /** Brede campagnetegel die na de 8e kaart in het raster verschijnt (referentie). */
  promo?: ReactNode;
  emptyState?: ReactNode;
  showOffersToggle?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setOptimisticState] = useOptimistic(data.state);
  // Blijft true tot de serverrender van de nieuwe URL binnen is (navigatie in een transition).
  const [pending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Na "meer tonen": het eerste nieuwe product en de scrollpositie, tot de nieuwe producten er zijn.
  const focusVanaf = useRef<{ index: number; scrollY: number; gescrold?: boolean } | null>(null);
  // Na een filter of sortering: naar het begin van de lijst zodra de nieuwe producten er zijn.
  const naarBegin = useRef(false);

  const update = useCallback(
    (next: Partial<ListState>, resetPage = true) => {
      if (resetPage) focusVanaf.current = null;
      naarBegin.current = resetPage;
      const merged: ListState = { ...state, ...next, page: resetPage ? 1 : (next.page ?? state.page) };
      // Andere parameters (?q=, ?weergave=) blijven staan. Gelezen bij de klik en niet via
      // useSearchParams: zo blijft de lijst in de server-HTML (geen client-side bailout).
      const url = `${pathname}${serializeListState(merged, new URLSearchParams(window.location.search))}`;
      startTransition(() => {
        setOptimisticState(merged);
        // Een filter of sortering is een stap in de geschiedenis (de terugknop maakt hem ongedaan);
        // "meer tonen" niet: dat is dezelfde lijst, verder gelezen.
        if (resetPage) router.push(url, { scroll: false });
        else router.replace(url, { scroll: false });
      });
    },
    [state, router, pathname, setOptimisticState],
  );

  const toggleValue = (key: string, value: string) => {
    const cur = state.selection[key] ?? [];
    const nextVals = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    update({ selection: { ...state.selection, [key]: nextVals } });
  };
  const clearKey = (key: string) => update({ selection: { ...state.selection, [key]: [] } });
  const clearAll = () => update({ selection: {}, offersOnly: false });

  const { items: shown, total, groups, hasOffers } = data;
  const activeCount = activeFilterCount(state);
  const groupOf = (key: string) => groups.find((g) => g.def.key === key);
  const chipLabel = (key: string, value: string) => groupOf(key)?.options.find((o) => o.value === value)?.label ?? labelFor(key, value, facetLabels);

  // Kleeft de filterbalk (desktop)? Dan schuift hij mee omhoog wanneer de header inklapt
  // (transform, geen top-wijziging: dat zou als layoutverschuiving tellen — B10).
  const meetpunt = useRef<HTMLDivElement>(null);
  const [vast, setVast] = useState(false);
  useEffect(() => {
    const el = meetpunt.current;
    if (!el) return;
    let io: IntersectionObserver | undefined;
    const start = () => {
      io?.disconnect();
      const h = headerHoogte();
      io = new IntersectionObserver(([e]) => setVast(!e.isIntersecting && e.boundingClientRect.top < h + 1), { rootMargin: `-${h + 1}px 0px 0px 0px` });
      io.observe(el);
    };
    start();
    window.addEventListener("resize", start);
    return () => {
      io?.disconnect();
      window.removeEventListener("resize", start);
    };
  }, []);

  // De toetsenbordfocus in de lijst houdt rekening met de kleverige filterbalk (desktop): anders
  // valt de focus erachter (scroll-margin in globals.css). Verandert enkel als de balk zelf verandert.
  const balk = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = balk.current;
    const lijst = el?.parentElement;
    if (!el || !lijst) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const meet = () => {
      if (desktop.matches) lijst.style.setProperty("--filterbalk-h", `${Math.round(el.getBoundingClientRect().height)}px`);
      else lijst.style.removeProperty("--filterbalk-h");
    };
    const ro = new ResizeObserver(meet);
    ro.observe(el);
    meet();
    return () => ro.disconnect();
  }, []);

  // Na "meer tonen": focus naar het eerste nieuwe product (toetsenbordgebruikers), pas als het er is.
  // De pagina blijft staan waar de klant was: de browser houdt anders de knop in beeld (scroll
  // anchoring) en de klant slaat 48 producten over. Vóór het tekenen, dus zonder zichtbare sprong.
  // Scrolde de klant tijdens het laden verder, dan trekken we hem niet terug.
  const raster = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    const vanaf = focusVanaf.current;
    if (vanaf === null || shown.length <= vanaf.index) return;
    focusVanaf.current = null;
    raster.current?.querySelector<HTMLAnchorElement>(`[data-kaart="${vanaf.index}"] h3 a`)?.focus({ preventScroll: true });
    if (!vanaf.gescrold) window.scrollTo({ top: vanaf.scrollY, behavior: "instant" });
  }, [shown.length]);
  useEffect(() => {
    const onScroll = () => {
      const vanaf = focusVanaf.current;
      if (vanaf && Math.abs(window.scrollY - vanaf.scrollY) > 1) vanaf.gescrold = true;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // De browser herstelt de scrollpositie soms te vroeg en dan niet meer: bij "terug" na het herladen
  // van de productpagina (die is korter), en bij het herladen van de lijst zelf (de lijst komt
  // gestreamd binnen). De positie wordt dan afgekapt; zodra de lijst er is, zetten we de klant goed.
  // Bij een klik naar een product: bewaard bij deze stap in de geschiedenis.
  const bewaarPositie = (e: ReactMouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.target instanceof Element && e.target.closest("a[href]")) window.history.replaceState({ ...window.history.state, lijstY: window.scrollY }, "");
  };
  useLayoutEffect(() => {
    const { lijstY, ...rest } = (window.history.state ?? {}) as { lijstY?: number };
    const y = typeof lijstY === "number" ? lijstY : leesVertrekpositie();
    if (typeof lijstY === "number") window.history.replaceState(rest, "");
    if (y !== null && Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y, behavior: "instant" });
  }, []);
  // Bij het verlaten van de pagina (herladen, de kassa): in sessionStorage, want Chrome negeert
  // history.replaceState tijdens pagehide. Terug uit de bfcache staat de pagina nog goed.
  useEffect(() => {
    const opVertrek = () => schrijfVertrekpositie(window.scrollY);
    const opTerugkeer = (e: PageTransitionEvent) => {
      if (e.persisted) schrijfVertrekpositie(null);
    };
    window.addEventListener("pagehide", opVertrek);
    window.addEventListener("pageshow", opTerugkeer);
    return () => {
      window.removeEventListener("pagehide", opVertrek);
      window.removeEventListener("pageshow", opTerugkeer);
    };
  }, []);

  // Na een filter of sortering staat de klant anders midden in de nieuwe lijst, of bij een korte
  // lijst onder de footer. Staat het begin al in beeld, dan blijft de pagina staan. Vóór het tekenen.
  useLayoutEffect(() => {
    if (!naarBegin.current) return;
    naarBegin.current = false;
    const boven = (meetpunt.current?.getBoundingClientRect().top ?? 0) - headerHoogte();
    if (boven < 0) window.scrollBy({ top: boven, behavior: "instant" });
  }, [data]);

  // Verdwijnt het element met de focus (een chip, een filter zonder waarden meer), dan gaat de focus
  // naar "Alle filters" in plaats van verloren.
  const laatsteFocus = useRef<HTMLElement | null>(null);
  const alleFilters = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = laatsteFocus.current;
    if (el && !el.isConnected && document.activeElement === document.body) alleFilters.current?.focus({ preventScroll: true });
  }, [groups, state]);

  // Lade dicht en de opener is onzichtbaar geworden (de mobiele filterknop na een filter): focus naar "Alle filters".
  const ladeWasOpen = useRef(false);
  useEffect(() => {
    if (ladeWasOpen.current && !drawerOpen && document.activeElement === document.body) alleFilters.current?.focus({ preventScroll: true });
    ladeWasOpen.current = drawerOpen;
  }, [drawerOpen]);

  return (
    <div data-lijst="">
      <div ref={meetpunt} aria-hidden="true" />
      {/* Filterbalk */}
      <div
        ref={balk}
        onFocus={(e) => {
          laatsteFocus.current = e.target;
        }}
        className={`kleeft z-30 bg-white py-3 transition-transform duration-200 motion-reduce:transition-none lg:sticky lg:top-[var(--header-h,106px)] ${vast ? "mee-met-header" : ""}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {groups.slice(0, 6).map((g) => (
              <FacetDropdown key={g.def.key} group={g} selected={state.selection[g.def.key] ?? []} onToggle={toggleValue} onClear={clearKey} />
            ))}
          </div>
          <button ref={alleFilters} type="button" onClick={() => setDrawerOpen(true)} className="btn btn-outline h-12 gap-3 px-4 text-[15px] sm:px-5" aria-haspopup="dialog">
            Alle filters
            {activeCount > 0 ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-ink text-xs text-white">
                {activeCount}
                <span className="sr-only"> actief</span>
              </span>
            ) : (
              <Icon name="filter" size={22} />
            )}
          </button>
          <SortSelect value={state.sort} onChange={(sort) => update({ sort })} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="text-[14px] text-ink-80" role="status" aria-live="polite">
            {pending ? "Bezig met filteren…" : `${total} ${total === 1 ? "product" : "producten"}`}
          </p>
          {showOffersToggle && hasOffers && (
            <label className="flex cursor-pointer items-center gap-3 text-[14px] font-medium">
              Enkel aanbiedingen
              <input
                type="checkbox"
                role="switch"
                checked={state.offersOnly}
                onChange={(e) => update({ offersOnly: e.target.checked })}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="relative h-5 w-9 rounded-full bg-ink-40 transition-colors peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
              />
            </label>
          )}
        </div>

        {activeCount > 0 && (
          <ul className="mt-3 flex flex-wrap items-center gap-2" role="list" aria-label="Actieve filters">
            {Object.entries(state.selection).flatMap(([key, vals]) =>
              vals.map((v) => {
                const naam = groupOf(key)?.def.label;
                const label = chipLabel(key, v);
                return (
                  <li key={`${key}-${v}`}>
                    <button
                      type="button"
                      onClick={() => toggleValue(key, v)}
                      className="flex min-h-9 items-center gap-1.5 rounded-full bg-mist px-3 text-[13px] hover:bg-sand"
                      aria-label={`Filter verwijderen: ${naam ? `${naam} ` : ""}${label}`}
                    >
                      {naam && <span className="text-ink-60">{naam}:</span>} {label} <Icon name="close" size={14} />
                    </button>
                  </li>
                );
              }),
            )}
            {state.offersOnly && (
              <li>
                <button type="button" onClick={() => update({ offersOnly: false })} className="flex min-h-9 items-center gap-1.5 rounded-full bg-mist px-3 text-[13px] hover:bg-sand">
                  Enkel aanbiedingen <Icon name="close" size={14} />
                </button>
              </li>
            )}
            <li>
              <button type="button" onClick={clearAll} className="min-h-9 px-2 text-[13px] font-medium underline underline-offset-2">
                Alle filters wissen
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* Raster */}
      <div aria-busy={pending} className={`transition-opacity duration-150 ${pending ? "opacity-50" : ""}`}>
        {total === 0 ? (
          (emptyState ?? (
            <div className="my-10 rounded-[var(--radius-tile)] bg-cloud px-6 py-14 text-center">
              <Icon name="search" size={36} className="mx-auto text-ink-60" />
              <p className="mt-4 text-lg font-medium">Geen producten gevonden</p>
              <p className="mt-1 text-ink-80">
                {activeCount > 0 ? "Met deze filtercombinatie vinden we niets. Verwijder een filter hierboven of wis ze allemaal." : "Hier staan nog geen producten."}
              </p>
              {activeCount > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={() => setDrawerOpen(true)} className="btn btn-outline">
                    Filters aanpassen
                  </button>
                  <button type="button" onClick={clearAll} className="btn btn-primary">
                    Alle filters wissen
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          // Op mobiel twee kolommen (B22): één kaart per rij gaf ±440 px per product.
          <ul ref={raster} role="list" onClickCapture={bewaarPositie} className="mt-4 grid grid-cols-2 gap-x-2 gap-y-4 sm:gap-x-3 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-5">
            {shown.map((p, i) => (
              <FragmentWithPromo key={p.id} index={i} promo={promo && activeCount === 0 && i === 8 ? promo : null}>
                <li data-kaart={i}>
                  {/* Andere Kleur-, Maat-, Vorm- of Prijsfilter = nieuwe kaart: een gekozen staal van de vorige filter blijft niet hangen. */}
                  <ProductCard key={VARIANT_FACETS.map((k) => data.state.selection[k]?.join(",") ?? "").join("|")} product={p} priority={i < 4} tone={i} />
                </li>
              </FragmentWithPromo>
            ))}
          </ul>
        )}
      </div>

      {/* Mobiel kleeft de filterbalk niet. Bij omhoog scrollen komt de filterknop onderaan in beeld;
          aan het einde van de lijst rust hij in de witruimte onder het raster. Hoogte 0: schuift niets op. */}
      {total > 0 && (
        <div className={`sticky bottom-[60px] z-20 h-0 lg:hidden ${vast ? "" : "invisible"}`}>
          <div className="verberg-bij-inklap pointer-events-none absolute inset-x-0 top-0 flex justify-center transition-[opacity,visibility] duration-150 motion-reduce:transition-none">
            <button type="button" onClick={() => setDrawerOpen(true)} className="btn btn-primary btn-sm pointer-events-auto gap-2 shadow-[var(--shadow-pop)]" aria-haspopup="dialog">
              <Icon name="filter" size={18} />
              Filters
              {activeCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-white text-[11px] text-ink">
                  {activeCount}
                  <span className="sr-only"> actief</span>
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Meer laden (referentie: "Vous avez vu 49 produits sur 49") */}
      {total > 0 && (
        <div className="mx-auto mt-10 flex max-w-sm flex-col items-center gap-3 text-center">
          <p className="text-[14px] text-ink-80">
            U hebt {shown.length} van {total} producten bekeken
          </p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-mist" aria-hidden="true">
            <div className="h-full rounded-full bg-ink" style={{ width: `${(shown.length / total) * 100}%` }} />
          </div>
          {shown.length < total && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                focusVanaf.current = { index: shown.length, scrollY: window.scrollY };
                update({ page: state.page + 1 }, false);
              }}
              className="btn btn-outline mt-2"
            >
              {pending ? "Bezig met laden…" : `${Math.min(PAGE_SIZE, total - shown.length)} meer tonen`}
            </button>
          )}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={clearAll} className="btn btn-outline flex-1" disabled={activeCount === 0}>
              Alles wissen
            </button>
            <button type="button" onClick={() => setDrawerOpen(false)} className="btn btn-primary flex-[1.4]">
              {pending ? "Bezig…" : `Toon ${total} ${total === 1 ? "product" : "producten"}`}
            </button>
          </div>
        }
      >
        <div className="px-5 pb-6">
          {showOffersToggle && hasOffers && (
            <label className="flex min-h-14 cursor-pointer items-center justify-between border-b border-line text-[15px] font-medium">
              Enkel aanbiedingen
              <input type="checkbox" checked={state.offersOnly} onChange={(e) => update({ offersOnly: e.target.checked })} className="size-5 accent-[var(--color-ink)]" />
            </label>
          )}
          {groups.map((g, i) => (
            <DrawerGroup
              key={g.def.key}
              group={g}
              selected={state.selection[g.def.key] ?? []}
              defaultOpen={(state.selection[g.def.key] ?? []).length > 0 || i === 0}
              onToggle={toggleValue}
            />
          ))}
        </div>
      </Drawer>
    </div>
  );
}

function FragmentWithPromo({ children, promo }: { children: ReactNode; promo: ReactNode; index: number }) {
  return (
    <>
      {promo && <li className="col-span-full">{promo}</li>}
      {children}
    </>
  );
}

/** Inklapbare filtergroep in de lade. Eigen open-toestand: de groep klapt niet dicht als de laatste keuze erin wegvalt. */
function DrawerGroup({
  group,
  selected,
  defaultOpen,
  onToggle,
}: {
  group: FacetGroup;
  selected: string[];
  defaultOpen: boolean;
  onToggle: (k: string, v: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details className="group border-b border-line" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-[15px] font-medium [&::-webkit-details-marker]:hidden">
        <span>
          {group.def.label}
          {selected.length > 0 && <span className="ml-2 text-ink-60">({selected.length})</span>}
        </span>
        <Icon name="chevronDown" size={20} className="transition-transform group-open:rotate-180" />
      </summary>
      <FacetOptions group={group} selected={selected} onToggle={onToggle} />
    </details>
  );
}

/** De waarden van één filter — dezelfde weergave in de filterknop (desktop) en de lade. */
function FacetOptions({ group, selected, onToggle }: { group: FacetGroup; selected: string[]; onToggle: (k: string, v: string) => void }) {
  const [zoek, setZoek] = useState("");
  const [alles, setAlles] = useState(false);
  const zoekId = useId();
  // Enkel vrije lijsten (merk, motief…): een vaste reeks (kleur, klassen) staat altijd volledig, anders valt bv. Grijs weg.
  const lang = group.options.length > LANGE_LIJST && !group.def.volgorde && !group.def.buckets;
  const q = normalize(zoek.trim());
  const gevonden = q ? group.options.filter((o) => normalize(o.label).includes(q)) : group.options;
  // Ingeklapt: de eerste waarden en alles wat gekozen is (een keuze verdwijnt nooit uit beeld).
  const zichtbaar = lang && !alles && !q ? gevonden.filter((o, i) => i < EERST_ZICHTBAAR || selected.includes(o.value)) : gevonden;

  return (
    <div className="pb-4">
      {lang && (
        <div className="relative mb-2">
          <label htmlFor={zoekId} className="sr-only">
            Zoeken in {group.def.label.toLowerCase()}
          </label>
          <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-60" />
          <input
            id={zoekId}
            type="search"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder={`Zoek in ${group.def.label.toLowerCase()}`}
            autoComplete="off"
            className="h-11 w-full rounded-[var(--radius-field)] border border-line-strong bg-white pl-10 pr-3 text-[14px] hover:border-ink"
          />
        </div>
      )}
      <ul role="list" className="space-y-1">
        {zichtbaar.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <li key={o.value}>
              <label className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-[14px] hover:bg-mist ${o.count === 0 && !checked ? "text-ink-40" : ""}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={o.count === 0 && !checked}
                  onChange={() => onToggle(group.def.key, o.value)}
                  className="size-[18px] shrink-0 accent-[var(--color-ink)]"
                />
                {o.swatch && <span className="size-5 shrink-0 rounded-full ring-1 ring-line-strong/40" style={{ background: o.swatch }} aria-hidden="true" />}
                <span className="flex-1">{o.label}</span>
                <span className="text-ink-60">
                  {o.count}
                  <span className="sr-only"> {o.count === 1 ? "product" : "producten"}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {q && gevonden.length === 0 && <p className="px-2 py-2 text-[14px] text-ink-60">Niets gevonden voor “{zoek.trim()}”.</p>}
      {lang && !q && gevonden.length > EERST_ZICHTBAAR && (
        <button type="button" onClick={() => setAlles((a) => !a)} aria-expanded={alles} className="mt-1 min-h-11 px-2 text-[14px] font-medium underline underline-offset-2">
          {alles ? "Toon minder" : `Toon alle ${group.options.length}`}
        </button>
      )}
    </div>
  );
}

/** Filterpil met uitklappaneel (desktop). */
function FacetDropdown({
  group,
  selected,
  onToggle,
  onClear,
}: {
  group: FacetGroup;
  selected: string[];
  onToggle: (k: string, v: string) => void;
  onClear: (k: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const knop = useRef<HTMLButtonElement>(null);
  const paneel = useRef<HTMLDivElement>(null);
  const id = useId();
  useWielBinnen(paneel, open);
  // Sluiten met Escape of "Klaar": de focus gaat terug naar de filterknop (anders valt ze weg met het paneel).
  const sluit = useCallback(() => {
    setOpen(false);
    knop.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && sluit();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, sluit]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={knop}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className={`flex h-12 items-center gap-2 rounded-[var(--radius-field)] border px-3 text-[15px] font-medium text-ink-80 transition-colors hover:border-ink ${
          selected.length ? "border-ink bg-mist text-ink" : "border-line-strong"
        }`}
      >
        {group.def.label}
        {selected.length > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] text-white">
            {selected.length}
            <span className="sr-only"> gekozen</span>
          </span>
        )}
        <Icon name="chevronDown" size={20} className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <div
          ref={paneel}
          id={id}
          role="group"
          aria-label={group.def.label}
          className="absolute left-0 top-[calc(100%+6px)] z-40 w-[300px] rounded-[var(--radius-tile)] bg-white p-3 shadow-[var(--shadow-pop)] ring-1 ring-line"
        >
          <div className="max-h-[320px] overflow-y-auto overscroll-contain">
            <FacetOptions group={group} selected={selected} onToggle={onToggle} />
          </div>
          <div className="flex justify-between border-t border-line pt-3">
            <button type="button" onClick={() => onClear(group.def.key)} disabled={!selected.length} className="px-2 text-[13px] font-medium underline underline-offset-2 disabled:text-ink-40 disabled:no-underline">
              Wissen
            </button>
            <button type="button" onClick={sluit} className="btn btn-primary btn-sm">
              Klaar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (s: SortKey) => void }) {
  const id = useId();
  return (
    <div className="relative ml-auto">
      <label htmlFor={id} className="sr-only">
        Sorteren op
      </label>
      <Icon name="sort" size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
      {/* Zichtbaar voorvoegsel naast de keuze (desktop), zoals "Trier par" bij de referentie. */}
      <span aria-hidden="true" className="pointer-events-none absolute left-10 top-1/2 hidden -translate-y-1/2 text-[15px] font-medium text-ink-60 sm:block">
        Sorteren:
      </span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="h-12 max-w-[200px] appearance-none truncate rounded-[var(--radius-field)] border border-line-strong bg-white pl-10 pr-10 text-[15px] font-medium hover:border-ink sm:max-w-none sm:pl-[112px]"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={20} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
    </div>
  );
}
