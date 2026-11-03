"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { MenuNode } from "@/lib/catalog/menu";
import { productCount } from "@/lib/catalog/product";
import { routes } from "@/lib/routes";
import { useWielBinnen } from "@/lib/site/scroll";
import { Icon } from "@/components/ui/icon";
import { ImageSlot } from "@/components/ui/image-slot";

/**
 * Megamenu onder "Catalogus" (zoals "Tous nos produits" bij de referentie). Bewust rustig:
 * links de afdelingen, in het midden de onderverdeling als tekstlinks met aantallen en de
 * merken van die afdeling, rechts één sfeerfoto + een dienstkaart die bij de afdeling past.
 * Gevoed door lib/catalog/menu-data.ts — nieuwe of hernoemde categorieën en merken
 * verschijnen hier automatisch.
 */
export function MegaMenu({ menu, onNavigate, metAanbiedingen = false }: { menu: MenuNode[]; onNavigate: () => void; metAanbiedingen?: boolean }) {
  const [activeId, setActiveId] = useState<string>(menu[0]?.id ?? "");
  const active = menu.find((m) => m.id === activeId) ?? menu[0];
  const paneel = useRef<HTMLDivElement>(null);
  useWielBinnen(paneel);

  return (
    // Escape wordt in de header afgehandeld (sluiten + focus terug naar de Catalogus-knop).
    <div id="megamenu" className="absolute left-0 right-0 top-full z-40 pt-1">
      <div className="shell">
        <div ref={paneel} className="flex min-h-[440px] overflow-hidden rounded-b-[var(--radius-tile)] rounded-tr-[var(--radius-tile)] bg-white shadow-[var(--shadow-pop)] ring-1 ring-line">
          {/* Kolom 1: afdelingen */}
          <div className="flex w-[280px] shrink-0 flex-col border-r border-line bg-cloud/60">
            <ul className="p-2" role="list">
              {menu.map((m) => {
                const actief = m.id === active?.id;
                return (
                  <li key={m.id}>
                    <Link
                      href={m.href}
                      onClick={onNavigate}
                      onMouseEnter={() => setActiveId(m.id)}
                      onFocus={() => setActiveId(m.id)}
                      aria-current={actief ? "true" : undefined}
                      className={`flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-field)] px-3 text-[15px] transition-colors ${
                        actief ? "bg-white font-medium shadow-[var(--shadow-label)]" : "hover:bg-white/70"
                      }`}
                    >
                      {m.name}
                      <Icon name="chevronRight" size={16} className={actief ? "text-ink" : "text-ink-40"} />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <ul className="mt-auto border-t border-line p-2 text-[14px]" role="list">
              <li>
                <Link href={routes.catalog()} onClick={onNavigate} className="flex min-h-11 items-center rounded-lg px-3 hover:bg-white">
                  Volledige catalogus
                </Link>
              </li>
              <li>
                <Link href={routes.brands()} onClick={onNavigate} className="flex min-h-11 items-center rounded-lg px-3 hover:bg-white">
                  Alle merken
                </Link>
              </li>
              <li>
                <Link href={routes.newArrivals()} onClick={onNavigate} className="flex min-h-11 items-center rounded-lg px-3 hover:bg-white">
                  Nieuw binnen
                </Link>
              </li>
              {metAanbiedingen && (
                <li>
                  <Link href={routes.offers()} onClick={onNavigate} className="flex min-h-11 items-center rounded-lg px-3 font-medium text-brand-dark hover:bg-white">
                    Aanbiedingen
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Kolom 2: de actieve afdeling */}
          {active && (
            <div className="flex min-w-0 flex-1 gap-8 p-6 xl:p-8">
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h2 className="font-display text-[26px] leading-tight">{active.name}</h2>
                  <Link href={active.href} onClick={onNavigate} className="inline-flex items-center gap-1.5 text-[14px] font-medium hover:underline">
                    Alles bekijken {active.count !== undefined && <span className="font-normal text-ink-60">({active.count})</span>} <Icon name="arrowRight" size={18} />
                  </Link>
                </div>

                {active.children.length > 0 ? (
                  <ul role="list" className="mt-5 grid grid-cols-2 gap-x-8">
                    {active.children.map((sub) => (
                      <li key={sub.id} className="border-b border-line">
                        <Link href={sub.href} onClick={onNavigate} className="group flex min-h-12 items-center justify-between gap-3 py-2 text-[15px]">
                          <span className="group-hover:underline">{sub.name}</span>
                          {sub.count !== undefined && <span className="shrink-0 text-[13px] text-ink-60">{sub.count}</span>}
                        </Link>
                        {sub.children.length > 0 && (
                          <ul className="mb-2 space-y-1.5 pl-3" role="list">
                            {sub.children.map((leaf) => (
                              <li key={leaf.id}>
                                <Link href={leaf.href} onClick={onNavigate} className="text-sm text-ink-80 hover:text-ink hover:underline">
                                  {leaf.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 text-sm text-ink-60">Bekijk alle {active.count !== undefined ? productCount(active.count) : "producten"} in {active.name.toLowerCase()}.</p>
                )}

                {active.merken && active.merken.length > 0 && (
                  <div className="mt-auto pt-8">
                    <p className="text-[12px] font-medium uppercase tracking-wide text-ink-60">Merken in {active.name.toLowerCase()}</p>
                    <ul role="list" className="-ml-3 mt-2 flex flex-wrap items-center gap-x-1 gap-y-1">
                      {active.merken.map((b) => (
                        <li key={b.href}>
                          <Link
                            href={b.href}
                            onClick={onNavigate}
                            className="flex h-11 items-center rounded-[var(--radius-field)] px-3 text-[14px] font-medium opacity-60 transition-opacity hover:bg-mist hover:opacity-100"
                            aria-label={b.name}
                          >
                            {b.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element -- klein merklogo (SVG)
                              <img src={b.logo} alt="" className="h-5 w-auto max-w-[110px] object-contain [filter:brightness(0)]" />
                            ) : (
                              b.name
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Kolom 3: één sfeerfoto van de afdeling + de dienst die erbij past */}
              <div className="flex w-[260px] shrink-0 flex-col gap-3 xl:w-[300px]">
                <Link href={active.href} onClick={onNavigate} className="group relative block flex-1 overflow-hidden rounded-[var(--radius-tile)]">
                  <ImageSlot
                    src={active.image?.src}
                    alt=""
                    sizes="300px"
                    className="absolute inset-0"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <span className="tile-shade absolute inset-0" aria-hidden="true" />
                  <span className="absolute inset-x-0 bottom-0 p-5 font-display text-[22px] leading-tight text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.3)]">
                    Ontdek {active.name.toLowerCase()}
                  </span>
                </Link>
                {active.dienst && (
                  <Link href={active.dienst.href} onClick={onNavigate} className="flex items-start gap-3 rounded-[var(--radius-tile)] border border-line p-4 transition-colors hover:border-line-strong">
                    <Icon name={active.dienst.icon} size={20} className="mt-0.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium">{active.dienst.titel}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-ink-80">{active.dienst.tekst}</span>
                    </span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
