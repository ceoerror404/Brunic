# Brunic — projectregels voor Codex

Dit is de **werkplaats** voor het Brunic-webshopproject (klant van HackersQuattro/Atelier Sjiek). Hier wordt gebouwd: design, code, catalogus-pipeline, chatbot.

## De brug met J.A.R.V.I.S (Jeroens cockpit)
- **Strategie, beslissingen, klantcommunicatie en het dossier** leven in `D:\GithubLocal\J.A.R.V.I.S\clients\brunic\` (genummerde werkdocs 01-17) — niet hier dupliceren. Duikt hier een strategische beslissing of klant-afspraak op → log ze direct: `node "D:\GithubLocal\J.A.R.V.I.S\decisions\log-decision.mjs" "<titel>" "<beslissing>" "<waarom>"` (AUTO-granted, melden achteraf volstaat) en wijs op de dossier-update.
- Belangrijkste dossier-docs: `15-meeting-2026-07-08.md` (het akkoord) · `16-trechter-v2-analyse.md` (catalogus-cijfers) · `17-losse-eindjes-en-vragenlijst.md` (open punten + wat nog van de klant moet komen) · `14-chatbot-architectuur.md` · `11-webcategorie-mapping.md` (familie → webcategorie).

## Harde regels
- **`data/` is gitignored en blijft dat** — ruwe klantdata (ERP-exports, WooCommerce-export, klantrecords) nooit committen of naar externe diensten sturen. Secrets in `.env*` (gitignored); klant-credentials leven in J.A.R.V.I.S `clients/brunic/.env.client`.
- **Eigendomsprincipe**: alle klant-accounts (Shopify, GA4, GSC, domein) komen op naam van Bruno/Brunic nv; wij zijn collaborator/staff. Nooit omgekeerd — dat is letterlijk het verkoopverhaal van dit project.
- **Niets gaat live vóór getekende offerte + voorschot** (afspraak 08/07). Bouwen in een Shopify Partner development store mag wél.
- Repo is privé, GitHub-org = **HackersQuattroOrg**; Vercel-team = fruitcocktailbe-projects. Jeroen pusht/deployt zelf of geeft expliciet go.

## Praktisch
- Taal: site en alle klant-zichtbare content in **nl-BE (Vlaams)**; "u"-vorm op de site.
- Stack en structuur: zie `docs/architectuur.md`. Design-input: `docs/design-brief.md`.
- De catalogus-CSV's in `data/` zijn de bron voor realistische design-content (echte productnamen, categorieën, foto-URL's) — gebruik ze in plaats van lorem ipsum.

## Git & deploy (sinds 04/10/2026)
- **Iedereen werkt op `master`** (Jeroen én Alexander) — geen aparte persoonlijke branches meer. Altijd eerst `git pull --rebase`, dan pushen.
- Elke push naar `master` = **productie op https://brunic.vercel.app** (Vercel-project `brunic`, root `apps/prototype`). Andere branches krijgen enkel een preview-URL.
- `apps/web` (de oude storefront) is verwijderd op 20/10/2026; `apps/prototype` is de enige front. Het Vercel-project `brunic-prototype` is overbodig (builds staan uit).

## Gedeeld werkcontract — Claude en Codex

- Voer omkeerbaar intern werk uit wanneer de intentie duidelijk is. Benoem materiële aannames. Vraag verduidelijking wanneer ambiguïteit het resultaat, een commitment, een privacygrens of de kosten verandert. Bestaande expliciete beperkingen voor externe acties blijven gelden.
- Plan substantieel werk eerst; respecteer expliciet gevraagde planreview vóór uitvoering.
- Verifieer wijzigingen met passende checks; meld wat wel en niet getest is.
- Behoud projectspecifieke domeinregels, privacygrenzen en externe toestemmingen.
- Bundel UI-feedback en gebruik de beschikbare visuele controle; veronderstel geen ontbrekende tools.
- AGENTS.md is de gedeelde bron; CLAUDE.md importeert die. Bewaar duurzame projectcontext in repo-documenten, niet uitsluitend in agent-chatgeheugen.
- Nieuwe repo: AGENTS.md met dit contract + CLAUDE.md met @AGENTS.md. Projectspecifieke skills in .agents/skills; voer agent-setup.ps1 uit voor de Claude-verwijzing.
- Bij gelijktijdig werk: controleer git-status, claim een afgebakende taak in een eigen docs/agent-work/<taak>.md wanneer werk over sessies loopt, en gebruik aparte worktrees voor overlappende codewijzigingen. Overschrijf nooit andermans wijzigingen. Lees vlak vóór een edit opnieuw; stop bij een onverwachte wijziging.
- Eindig een overdracht met huidige toestand, verificatie, open punten en volgende actie. Chatgeschiedenis wordt niet automatisch tussen agents gedeeld.

