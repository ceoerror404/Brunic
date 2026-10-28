"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

/** Indexeerbare tekst onderaan (SEO) met "Meer lezen". Inhoud: design-brief §1 — enkel feiten. */
export function SeoText() {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-[14px] leading-relaxed text-ink-80">
      <p>
        Brunic is een familiebedrijf uit Ninove en al 40 jaar uw adres voor interieurdecoratie. In onze winkel aan de Ring-West vindt u gordijnstoffen en
        vitrages, behang en wandbekleding, vasttapijt en tapijttegels, vloerkleden en raamdecoratie — met persoonlijk advies van mensen die het vak kennen.
      </p>
      <div id="seo-meer" hidden={!open}>
        <p className="mt-3">
          Gordijnen op maat maken we in ons eigen atelier, door onze eigen stiksters. Wij komen gratis opmeten bij u thuis, adviseren over stof, plooi en
          afwerking, en plaatsen alles met onze eigen mensen — in Ninove en de ruime Denderstreek.
        </p>
        <p className="mt-3">
          In de webshop ontdekt u het assortiment van merken als ADO, Artelux, Loft79, ESTAhome, Boråstapeter, Associated Weavers, Balsan, Desso en Louis De Poortere.
          Bewaar uw favorieten op uw verlanglijst, vraag vrijblijvend een offerte aan of breng uw lijst mee naar de winkel.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="seo-meer"
        className="mt-2 inline-flex items-center gap-1.5 border-b-2 border-ink pb-1 font-medium text-ink"
      >
        {open ? "Minder lezen" : "Meer lezen"}
        <Icon name="chevronDown" size={16} className={open ? "rotate-180" : ""} />
      </button>
    </div>
  );
}
