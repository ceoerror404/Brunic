/**
 * Redactionele inhoud: diensten (Op maat & plaatsing), inspiratie-artikels,
 * infopagina's en veelgestelde vragen. Vlaams, u-vorm.
 *
 * Enkel feiten die Brunic bevestigde: familiebedrijf, al 40 jaar in Ninove, nv sinds 1992,
 * eigen atelier met eigen stiksters, gratis opmeting aan huis, levering en plaatsing door
 * eigen mensen. Geen prijzen, levertermijnen of kosten: die staan in de offerte of bij het afrekenen.
 * Beelden komen uit `BEELD` (src/data/beelden.ts).
 */
import type { CategoryId, ImageRef } from "@/lib/catalog/types";
import { BEELD } from "@/data/beelden";
import { SITE } from "@/lib/site/config";

const ADRES = `${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city}`;

/* ------------------------------------------------------------------ */
/* Diensten                                                             */
/* ------------------------------------------------------------------ */

export type Service = {
  slug: string;
  title: string;
  summary: string;
  image: ImageRef;
  steps: { title: string; text: string }[];
  body: string[];
  relatedCategoryIds: CategoryId[];
};

/**
 * Algemene werkwijze voor al het maatwerk (overzichtspagina Op maat & plaatsing):
 * gordijnen, raamdecoratie en vasttapijt. De stappen per dienst staan bij die dienst.
 */
export const WERKWIJZE: { title: string; text: string }[] = [
  {
    title: "Advies",
    text: "In de winkel ziet en voelt u gordijnstoffen, raamdecoratie en vasttapijt in het echt. Wij helpen u kiezen op basis van licht, gebruik en sfeer.",
  },
  {
    title: "Gratis opmeting",
    text: "Wij komen bij u thuis opmeten: de ramen voor gordijnen en raamdecoratie, de ruimtes voor vasttapijt. Zo vertrekt uw offerte van de juiste maten.",
  },
  {
    title: "Op maat gemaakt",
    text: "Onze eigen stiksters maken uw gordijnen in ons atelier; raamdecoratie en vasttapijt voorzien we op uw exacte maten.",
  },
  {
    title: "Plaatsing",
    text: "Onze eigen mensen hangen gordijnen en raamdecoratie op en leggen het vasttapijt, netjes afgewerkt.",
  },
];

export const SERVICES: Service[] = [
  {
    slug: "gordijnen-op-maat",
    title: "Gordijnen op maat uit eigen atelier",
    summary:
      "Wij adviseren u in de winkel of bij u thuis, meten gratis op en laten uw gordijnen maken door onze eigen stiksters in ons eigen atelier. Nadien hangen onze eigen mensen ze bij u op.",
    image: BEELD.dienstGordijnen,
    steps: [
      {
        title: "Stofkeuze",
        text: "In de winkel bekijkt u onze gordijnstoffen in het echt: effen, met tekening, isolerend of verduisterend. Wij helpen u kiezen op basis van licht, privacy en sfeer.",
      },
      {
        title: "Opmeting",
        text: "Wij komen gratis bij u thuis opmeten en bespreken ter plaatse de ophanging, de plooi en de gewenste lengte.",
      },
      {
        title: "Maakwerk",
        text: "Onze eigen stiksters werken uw gordijnen af in ons atelier, op de exacte maten van uw ramen.",
      },
      {
        title: "Plaatsing",
        text: "Onze eigen mensen brengen de gordijnen bij u thuis en hangen ze op, zodat ze meteen mooi vallen.",
      },
    ],
    body: [
      "Gordijnen op maat zijn meer dan een stof aan een rail. De plooi, de voering en de juiste lengte bepalen hoe een gordijn valt en hoe lang het mooi blijft. Daarom begint alles bij ons met een goed gesprek. In de winkel in Ninove toont u ons foto’s of maten van uw ramen, en samen bekijken we welke stof past bij de ruimte, het licht en het gebruik. Een slaapkamer vraagt nu eenmaal iets anders dan een living op het zuiden.",
      "In ons assortiment vindt u gordijnstoffen van onder meer ADO, Artelux en Loft79: effen stoffen met een mooie structuur, stoffen met tekening, en isolerende en verduisterende kwaliteiten. Veel stoffen zijn kamerhoog geweven, tot 300 cm breed. Zo loopt een gordijn zonder naden over de volledige breedte van een raam, ook bij grote ramen of schuiframen. Wij rekenen voor u uit hoeveel stof er nodig is, rekening houdend met de plooi en met de herhaling van het patroon.",
      "Wat Brunic onderscheidt, is ons eigen atelier. Uw gordijnen worden gemaakt door onze eigen stiksters, op de maten die wij bij u thuis hebben opgemeten. Dat geeft korte lijnen: wie opmeet, weet wat er in het atelier gebeurt, en wie plaatst, weet hoe het gordijn gemaakt is. Een bijzondere wens of een raam dat net iets anders is, bespreken we rechtstreeks met het atelier. Zo krijgt u gordijnen die echt voor uw woning gemaakt zijn.",
      "Na het maakwerk komen onze eigen mensen de gordijnen bij u ophangen. Zij controleren de lengte, verdelen de plooien en zorgen dat alles netjes hangt voor ze vertrekken. Wilt u weten wat uw project kost? Beschrijf het kort in het aanvraagformulier en voeg eventueel een foto van uw ramen toe. Wij nemen binnen 1 à 2 werkdagen contact met u op om een gratis opmeting af te spreken.",
    ],
    relatedCategoryIds: ["c05", "s-stoffen-isolerend-verduisterend"],
  },
  {
    slug: "raamdecoratie-op-maat",
    title: "Raamdecoratie op maat",
    summary:
      "Rolgordijnen, plissés, jaloezieën en vouwgordijnen, telkens op maat van uw ramen. U bekijkt en kiest ze in onze winkel of bij u thuis; wij meten op en plaatsen.",
    image: BEELD.dienstRaamdecoratie,
    steps: [
      {
        title: "Kennismaking",
        text: "U vertelt ons wat u wilt bereiken: meer privacy, minder zon, verduistering in de slaapkamer of een strakke afwerking.",
      },
      {
        title: "Kiezen",
        text: "In de winkel of bij u thuis bekijkt u de mogelijkheden, kleuren en materialen. Wij leggen de verschillen helder uit.",
      },
      {
        title: "Opmeting",
        text: "Wij meten elk raam gratis op en bekijken of de raamdecoratie in de dagopening of ervoor komt.",
      },
      {
        title: "Plaatsing",
        text: "Onze eigen mensen plaatsen alles netjes en tonen u hoe de bediening werkt.",
      },
    ],
    body: [
      "Niet elk raam vraagt om een gordijn. In een badkamer, een keuken of een bureau is raamdecoratie vaak praktischer: ze neemt weinig plaats in, laat zich precies regelen en is eenvoudig te onderhouden. Bij Brunic kunt u terecht voor rolgordijnen, plissés, jaloezieën en vouwgordijnen, telkens op maat van uw ramen. U vindt ze niet in onze webshop, omdat elke bestelling vertrekt van uw eigen maten en keuzes. U bekijkt ze in onze winkel in Ninove of, na afspraak, bij u thuis.",
      "Elk type heeft zijn eigen sterke punten. Een rolgordijn is strak en eenvoudig, en bestaat in lichtdoorlatende en verduisterende uitvoeringen. Een plissé bestaat ook voor schuine of bijzondere raamvormen en kan, afhankelijk van het model, zowel van boven als van onder geopend worden. Met jaloezieën richt u het licht nauwkeurig met de lamellen. Een vouwgordijn heeft de zachtheid van stof, maar vouwt compact op wanneer u het optrekt. Wij helpen u kiezen op basis van de ruimte, de lichtinval en het gebruik.",
      "Een goede opmeting maakt het verschil tussen raamdecoratie die bijna past en raamdecoratie die mooi aansluit. Daarom meten wij elk raam zelf op, gratis en bij u thuis. Wij kijken of de montage het best in de dagopening, op het raam zelf of op de muur erboven gebeurt, of er klinken of een vensterbank in de weg zitten en aan welke kant de bediening het handigst uitkomt. Die gegevens vormen de basis van uw offerte.",
      "Na de bestelling plaatsen onze eigen mensen de raamdecoratie bij u thuis. Zij zorgen voor een stevige, rechte montage en tonen u hoe alles werkt. Combineert u raamdecoratie met gordijnen, bijvoorbeeld een plissé voor de privacy en een gordijn voor de sfeer, dan stemmen we beide op elkaar af. Laat ons via het aanvraagformulier weten om welke ramen het gaat; wij nemen binnen 1 à 2 werkdagen contact met u op.",
    ],
    relatedCategoryIds: ["c05", "s-stoffen-isolerend-verduisterend"],
  },
  {
    slug: "opmeting-aan-huis",
    title: "Gratis opmeting aan huis",
    summary:
      "Wij komen gratis bij u thuis opmeten en bekijken ter plaatse wat uw ramen of vloeren nodig hebben. Zo krijgt u advies in uw eigen interieur en een offerte die vertrekt van de juiste maten, zonder enige verplichting.",
    image: BEELD.dienstOpmeting,
    steps: [
      {
        title: "Aanvraag",
        text: "Beschrijf kort uw project in het formulier en voeg gerust foto’s toe. Wij nemen binnen 1 à 2 werkdagen contact met u op.",
      },
      {
        title: "Afspraak",
        text: "Samen kiezen we een moment dat u past om bij u thuis langs te komen.",
      },
      {
        title: "Opmeting",
        text: "Wij meten alles nauwkeurig op, bekijken het licht en de ruimte en bespreken ter plaatse uw wensen en de mogelijkheden.",
      },
      {
        title: "Offerte",
        text: "U ontvangt een duidelijke offerte op basis van de exacte maten. Pas als u akkoord gaat, starten wij met het maakwerk of de bestelling.",
      },
    ],
    body: [
      "Maatwerk staat of valt met de juiste maten. Een gordijn dat een paar centimeter te kort is, of vasttapijt dat net niet aansluit tegen de plint, ziet u elke dag. Daarom komen wij gratis bij u thuis opmeten. U hoeft zelf niets te meten of uit te rekenen: wij nemen de maten, noteren de details die ertoe doen en bespreken meteen wat mogelijk is. Zo vertrekt uw offerte van de werkelijke situatie in uw woning, en niet van een schatting.",
      "Een opmeting bij u thuis is meer dan een meetlint uitrollen. Ter plaatse zien we hoe het licht binnenvalt, hoe hoog het plafond is, waar de radiatoren hangen en hoe de ramen opendraaien. Dat bepaalt mee welke stof, welke plooi of welke raamdecoratie het best werkt. Voor vasttapijt bekijken we de ondergrond, de dorpels en de overgangen tussen de ruimtes. Waar mogelijk nemen we stalen mee, zodat u kleuren en materialen beoordeelt in uw eigen licht, naast uw eigen meubels.",
      "Na de opmeting krijgt u een offerte die precies aangeeft wat er gemaakt, geleverd en geplaatst wordt, met een indicatie van de termijn. Omdat de maten vastliggen, kunt u rustig beslissen. De opmeting verplicht u tot niets. Gaat u akkoord, dan blijft uw project in dezelfde handen: onze eigen stiksters maken uw gordijnen in ons atelier, en onze eigen mensen komen ze nadien plaatsen. Wie bij u opmeet, kent dus ook het vervolg.",
      `Een opmeting aanvragen is eenvoudig. Vul het formulier op deze pagina in, vertel kort om welke ruimtes en welke ramen of vloeren het gaat, en voeg eventueel een paar foto’s toe. Wij nemen binnen 1 à 2 werkdagen contact met u op om een afspraak te maken. Liever eerst even praten? Bel ons op ${SITE.phone.display} of kom langs in onze winkel aan de ${SITE.address.street} in ${SITE.address.city}. Wij nemen graag de tijd voor uw vragen.`,
    ],
    relatedCategoryIds: ["c05", "c04"],
  },
  {
    slug: "plaatsing",
    title: "Plaatsing door onze eigen mensen",
    summary:
      "Wat wij verkopen, plaatsen we ook zelf. Gordijnen, raamdecoratie en vasttapijt worden bij u thuis geleverd en geplaatst door onze eigen mensen.",
    image: BEELD.dienstPlaatsing,
    steps: [
      {
        title: "Planning",
        text: "Zodra uw bestelling klaar is, spreken we samen een dag en een tijdstip af voor de levering en plaatsing.",
      },
      {
        title: "Voorbereiding",
        text: "Wij laten u vooraf weten wat er moet gebeuren, bijvoorbeeld welke ruimte vrij moet zijn of welke meubels verplaatst moeten worden.",
      },
      {
        title: "Plaatsing",
        text: "Onze eigen mensen leveren en plaatsen alles vakkundig, met oog voor detail en respect voor uw woning.",
      },
      {
        title: "Controle",
        text: "Samen met u lopen we het resultaat na, zodat alles hangt, ligt en werkt zoals afgesproken.",
      },
    ],
    body: [
      "Een mooi gordijn of een kwaliteitsvol vasttapijt komt pas tot zijn recht als het goed geplaatst is. Daarom gebeuren de levering en de plaatsing bij Brunic door onze eigen mensen. Zij kennen onze producten, weten hoe de stukken in het atelier gemaakt zijn en werken met de maten die we bij de opmeting genomen hebben. Dat geeft u één aanspreekpunt, van het eerste advies tot de laatste afwerking.",
      "Bij gordijnen betekent plaatsing meer dan ophangen. Waar nodig bevestigen onze mensen de rails of roeden, hangen ze de gordijnen op, verdelen ze de plooien en controleren ze of de lengte klopt ten opzichte van de vloer. Bij raamdecoratie zorgen ze voor een rechte, stevige montage en een vlotte bediening. Bij vasttapijt maken ze de ruimte klaar, leggen ze het tapijt strak en werken ze de randen en overgangen netjes af.",
      "Wij spreken de plaatsing altijd vooraf met u af, op een moment dat u thuis bent. U hoort van ons wat u zelf kunt voorbereiden: een vrije doorgang, ramen die goed bereikbaar zijn, een ruimte zonder losse spullen op de vloer. Wat er precies in de plaatsing inbegrepen is, staat duidelijk in uw offerte. Zo weet u vooraf waar u aan toe bent, en verloopt de dag van de plaatsing rustig.",
      "Na de plaatsing overlopen we samen het resultaat. Is er iets dat u anders wenst of dat niet klopt, dan horen we dat liever meteen. En hebt u achteraf een vraag over onderhoud of bediening, dan belt of mailt u ons gewoon: u krijgt dezelfde winkel aan de lijn waar uw project begon. Wilt u weten wat plaatsing voor uw project inhoudt? Vraag het ons via het formulier; wij nemen binnen 1 à 2 werkdagen contact met u op.",
    ],
    relatedCategoryIds: ["c05", "c04"],
  },
  {
    slug: "vasttapijt-en-vloeren",
    title: "Vasttapijt & vloeren, vakkundig gelegd",
    summary:
      "Vasttapijt, tapijttegels en lopers van onder meer Associated Weavers, Desso, Lano, Balsan en Tarkett, met eerlijk advies over materiaal en gebruik. Wij meten gratis op en onze eigen mensen leggen het tapijt bij u thuis.",
    image: BEELD.dienstVloeren,
    steps: [
      {
        title: "Advies",
        text: "In de winkel voelt u de verschillende kwaliteiten en materialen. Wij helpen u kiezen op basis van de ruimte en het gebruik.",
      },
      {
        title: "Opmeting",
        text: "Wij meten de ruimtes gratis op, bekijken de ondergrond en bepalen hoe de banen het best gelegd worden.",
      },
      {
        title: "Voorbereiding",
        text: "Wij bespreken wat er vooraf moet gebeuren, zoals het vrijmaken van de ruimte of het voorbereiden van de ondergrond.",
      },
      {
        title: "Leggen",
        text: "Onze eigen mensen leggen het tapijt strak en werken randen, naden en overgangen netjes af.",
      },
    ],
    body: [
      "Vasttapijt voelt warm aan de voeten, dempt geluid en maakt een slaapkamer of living meteen rustiger. De keuze is wel groot: van korte, stevige lussen tot zachte velours, in polyamide, polypropyleen, polyester, wol of sisal. Bij Brunic vindt u vasttapijt van onder meer Associated Weavers, Desso, Lano, Balsan en Tarkett, naast tapijttegels en tapijtlopers. In onze winkel in Ninove kunt u de stalen voelen en naast elkaar vergelijken, zodat u niet op een foto hoeft te kiezen.",
      "Het juiste materiaal hangt af van de ruimte. Polyamide is sterk en veerkrachtig, en daardoor geschikt voor plaatsen waar veel gelopen wordt, zoals een gang of een trap. Polypropyleen is kleurvast en eenvoudig te onderhouden; polyester voelt vaak zacht aan en bestaat in levendige kleuren. Wol is een natuurlijke, veerkrachtige vezel met een warme uitstraling, en sisal geeft een stevige, natuurlijke structuur, al is het minder geschikt voor vochtige ruimtes. Wij helpen u afwegen wat voor u het belangrijkst is.",
      "Een vasttapijt wordt gelegd op maat van uw ruimte. Daarom meten wij gratis bij u thuis op. We bekijken de ondergrond, de deuren, de dorpels en de overgangen naar andere vloeren, en we bepalen hoe de banen het best liggen, met zo weinig mogelijk naden op zichtbare plaatsen. Zo weet u vooraf hoeveel vierkante meter u nodig hebt en wat er bij het leggen komt kijken. Dat alles staat duidelijk in uw offerte.",
      "Het leggen zelf gebeurt door onze eigen mensen. Zij maken de ruimte klaar, leggen het tapijt strak en werken randen en overgangen verzorgd af. Voor kantoren, horeca en zorg bekijken we ook tapijttegels van Desso en Balsan, die u per tegel kunt vervangen. Beschrijf uw ruimte kort in het aanvraagformulier, eventueel met een foto, en wij nemen binnen 1 à 2 werkdagen contact met u op om de opmeting af te spreken.",
    ],
    relatedCategoryIds: ["c04", "s-vloerbekleding-vasttapijt"],
  },
  {
    slug: "tapijt-op-maat",
    title: "Tapijt op maat",
    summary:
      "Een vloerkleed dat precies past bij uw ruimte en uw meubels, in de afmeting die u kiest. Wij adviseren u over maat, materiaal en afwerking.",
    image: BEELD.dienstTapijtOpMaat,
    steps: [
      {
        title: "Maat bepalen",
        text: "Wij bekijken samen met u hoe groot het tapijt moet zijn ten opzichte van de zetel, de tafel of het bed.",
      },
      {
        title: "Kwaliteit kiezen",
        text: "U kiest uit onze tapijtkwaliteiten, onder meer van Desso en Tarkett, en uit de beschikbare kleuren en structuren.",
      },
      {
        title: "Afwerking",
        text: "Wij bespreken de vorm en de afwerking van de randen, afgestemd op het gebruik van de ruimte.",
      },
      {
        title: "Levering",
        text: "Uw tapijt wordt op maat gemaakt en door onze eigen mensen bij u thuis geleverd.",
      },
    ],
    body: [
      "Een standaardmaat past niet altijd. Een living met een grote hoekzetel, een eetkamer met een lange tafel of een slaapkamer met een ruim bed vraagt soms om een tapijt dat net iets groter, smaller of anders van vorm is. Met een tapijt op maat bepaalt u zelf de afmetingen, zodat het vloerkleed de ruimte samenbrengt in plaats van erin te verdwijnen. Voor tapijten op maat werken wij met kwaliteiten van onder meer Desso en Tarkett.",
      "De juiste maat vertrekt van de meubels. Als vuistregel staan ofwel alle meubels van de zithoek volledig op het tapijt, ofwel enkel de voorpoten van de zetel en de fauteuils. Rond het tapijt laat u best 20 tot 40 cm vrije vloer tot aan de muur, zodat de ruimte ademt. Onder een eettafel rekent u op ongeveer 60 à 70 cm extra rondom, zodat de stoelen niet van de rand glijden. Een handige tip: baken de gewenste maat af met afplakband op de vloer.",
      "Naast de maat kiest u het materiaal en de afwerking. Een dichte, korte pool is gemakkelijk te onderhouden en geschikt voor een eethoek; een hoger, zachter tapijt voelt warmer aan in een living of slaapkamer. Bij de afwerking van de randen houden we rekening met het gebruik en met de uitstraling die u zoekt. Zoekt u eerder een kant-en-klaar vloerkleed in een ronde of bijzondere vorm, bekijk dan ook onze vloerkleden van Louis De Poortere.",
      "U kunt stalen en kwaliteiten bekijken in onze winkel in Ninove. Wij noteren de gewenste maat en vorm, en u krijgt vooraf een offerte. Wanneer uw tapijt klaar is, leveren onze eigen mensen het bij u thuis af. Omdat een tapijt op maat speciaal voor u wordt gemaakt, kan het niet worden teruggenomen zoals een standaardartikel. Daarom nemen we de tijd om de maat en de kwaliteit samen met u goed te bepalen.",
    ],
    relatedCategoryIds: ["s-tapijten-op-maat", "c03"],
  },
  {
    slug: "behang-en-fotobehang",
    title: "Behangadvies & fotobehang op maat",
    summary:
      "Hulp bij het kiezen van behang en fotobehang van onder meer ESTAhome, Origin Wallcoverings en Boråstapeter, van effen en gestreept tot bloemen en grafische motieven. Voor één blikvangerwand kiest u fotobehang op maat.",
    image: BEELD.dienstBehang,
    steps: [
      {
        title: "Inspiratie",
        text: "In de winkel bladert u door stalenboeken en voelt u de materialen, van vinyl en textiel tot natuurlijke wandbekleding.",
      },
      {
        title: "Advies",
        text: "Wij helpen u kiezen op basis van de ruimte, het licht en de stijl van uw interieur, en letten op de patroonherhaling.",
      },
      {
        title: "Berekening",
        text: "Op basis van de afmetingen van uw wanden berekenen we hoeveel rollen u nodig hebt.",
      },
      {
        title: "Bestelling",
        text: "Wij bestellen uw behang, of uw fotobehang op maat volgens de exacte afmetingen van uw wand.",
      },
    ],
    body: [
      "Behang geeft een ruimte in één keer karakter. Een effen behang met een subtiele structuur brengt rust, een streep geeft ritme en hoogte, een bloemenmotief zorgt voor warmte en beweging. Bij Brunic vindt u behang en fotobehang van onder meer ESTAhome, Origin Wallcoverings en Boråstapeter. Boråstapeter is een Zweeds behangmerk dat ook fotobehang op maat maakt.",
      "Kiezen is vaak het moeilijkste. Een klein staal zegt weinig over hoe een motief op een volledige wand werkt. Daarom kijken we samen naar de ruimte: hoe groot is ze, hoeveel daglicht valt er binnen, welke kleuren hebben uw vloer, uw gordijnen en uw meubels? Wij tonen u hoe een motief zich herhaalt en adviseren over de schaal. In een kleine ruimte werkt een fijn patroon anders dan een groot dessin, en een streep anders in een lage dan in een hoge kamer.",
      "Voor één blikvangerwand is fotobehang of panoramisch behang een sterke keuze. Een panoramisch behang loopt als één groot beeld over de wand, zonder dat het motief zich herhaalt. Bij ESTAhome en Origin Wallcoverings vindt u fotobehang in vaste afmetingen, en bij Boråstapeter kunt u fotobehang op maat laten maken, afgestemd op de afmetingen van uw wand. Zo bepaalt u zelf welk deel van het beeld waar komt, en valt er geen belangrijk stuk van het motief weg achter een kast of in een hoek.",
      "Wij berekenen voor u hoeveel rollen u nodig hebt, rekening houdend met de patroonherhaling en een kleine reserve. Behang wordt per rol verkocht, fotobehang per stuk of op maat van uw wand. Breng de maten van uw wanden mee naar de winkel, of beschrijf uw project in het aanvraagformulier. Wij nemen binnen 1 à 2 werkdagen contact met u op en helpen u met de keuze en de bestelling.",
    ],
    relatedCategoryIds: ["c02"],
  },
  {
    slug: "projectinrichting",
    title: "Projectinrichting voor horeca & zorg",
    summary:
      "Voor hotels, restaurants, zorginstellingen en andere projecten leveren wij brandvertragende en brandvrije stoffen, gordijnen uit ons eigen atelier en vasttapijt of tapijttegels, afgestemd op intensief gebruik.",
    image: BEELD.dienstProject,
    steps: [
      {
        title: "Kennismaking",
        text: "U vertelt ons over het project: de ruimtes, het gebruik, de planning en de eisen rond brandveiligheid.",
      },
      {
        title: "Voorstel",
        text: "Wij stellen een selectie stoffen en vloerbekleding samen en maken een offerte op maat van uw project.",
      },
      {
        title: "Opmeting",
        text: "Wij meten de ruimtes ter plaatse op en stemmen de uitvoering af met u, uw architect of uw aannemer.",
      },
      {
        title: "Uitvoering",
        text: "Onze stiksters maken de gordijnen in ons atelier en onze eigen mensen plaatsen alles volgens de afgesproken planning.",
      },
    ],
    body: [
      "In een hotelkamer, een restaurant, een woonzorgcentrum of een vergaderzaal gelden andere eisen dan thuis. Textiel moet er intensief gebruik aankunnen, vaak gereinigd worden en voldoen aan de brandveiligheidsvoorschriften die voor het gebouw gelden. Naast particulieren werkt Brunic daarom ook voor horeca en zorg. Wij combineren het advies van een interieurzaak met een eigen atelier en eigen plaatsers, zodat u één partner hebt voor stoffen, gordijnen en vloerbekleding.",
      "In onze collectie gordijnstoffen vindt u een aparte reeks brandvrije stoffen voor projecten, naast brandvertragende kwaliteiten. Bij sommige stoffen zit de brandvertragende eigenschap in de vezel zelf en blijft ze ook na het wassen behouden; bij andere gaat het om een behandeling van de stof. Welke norm of brandklasse vereist is, hangt af van het gebouw en de regelgeving. Wij bekijken dat per stof met u en bezorgen u op vraag de technische gegevens die de fabrikant ter beschikking stelt.",
      "Ook voor de vloer denken we mee. Voor projecten bekijken we vasttapijt en tapijttegels in kwaliteiten die bestemd zijn voor intensief gebruik, onder meer van Desso en Balsan. Tapijt helpt het geluid in drukke ruimtes te dempen. Tapijttegels hebben bovendien het voordeel dat u een beschadigde of vervuilde tegel afzonderlijk kunt vervangen, wat in gangen, kantoren en ontvangstruimtes handig is. Wij adviseren u over de kwaliteit, het patroon en de legrichting.",
      `Een project vraagt een duidelijke planning. Wij meten ter plaatse op, stemmen de uitvoering af met u, uw architect of uw aannemer, en werken met een offerte op maat. Onze eigen stiksters maken de gordijnen in ons atelier en onze eigen mensen zorgen voor de plaatsing. Beschrijf uw project kort in het aanvraagformulier of bel ons op ${SITE.phone.display}. Wij nemen binnen 1 à 2 werkdagen contact met u op om uw project te bespreken.`,
    ],
    relatedCategoryIds: ["s-stoffen-brandvrij", "c04"],
  },
];

/* ------------------------------------------------------------------ */
/* Inspiratie & advies                                                  */
/* ------------------------------------------------------------------ */

export const ARTICLE_TOPICS = ["Stijl", "Kleur", "Advies", "Onderhoud"] as const;
export type ArticleTopic = (typeof ARTICLE_TOPICS)[number];

export type Article = {
  slug: string;
  title: string;
  topic: ArticleTopic;
  excerpt: string;
  image: ImageRef;
  date: string;
  readingMinutes: number;
  sections: { heading: string; paragraphs: string[] }[];
  relatedCategoryId: CategoryId;
};

export const ARTICLES: Article[] = [
  {
    slug: "gordijnstof-kiezen",
    title: "Welke gordijnstof past bij uw ramen?",
    topic: "Advies",
    excerpt:
      "Lichtdoorlatend, verduisterend of isolerend: de juiste gordijnstof hangt af van de ruimte, het licht en wat u van uw gordijnen verwacht. Zo maakt u een doordachte keuze.",
    image: BEELD.artGordijnstof,
    date: "2026-09-25",
    readingMinutes: 3,
    sections: [
      {
        heading: "Begin bij de functie van de ruimte",
        paragraphs: [
          "Vraag uzelf eerst af wat het gordijn moet doen. In een living wilt u overdag vaak zacht licht en ’s avonds privacy. In een slaapkamer is verduistering belangrijk, zeker in de zomer, wanneer het vroeg licht wordt. In een bureau of een kamer op het zuiden speelt de zon een grote rol. Die functie bepaalt of u kiest voor een lichte, transparante stof, een dichte stof of een combinatie van beide.",
          "Veel mensen combineren een halftransparante stof of vitrage met een dichter overgordijn. Zo regelt u licht en privacy in twee stappen, en krijgt het raam meer diepte.",
        ],
      },
      {
        heading: "Effen, met tekening of met structuur",
        paragraphs: [
          "Een effen stof is tijdloos en laat andere elementen in de ruimte spreken, zoals behang of een opvallende zetel. Denk wel aan structuur: een linnenlook, een fijne weving of een zachte velours geeft ook een effen gordijn karakter. Een stof met tekening wordt zelf een blikvanger. Kies dan een motief in verhouding tot het raam: een groot dessin komt beter tot zijn recht op een breed raam dan op een smal venster.",
          "Houd bij een stof met tekening rekening met de patroonherhaling. De banen moeten mooi op elkaar aansluiten, en dat vraagt soms iets meer stof.",
        ],
      },
      {
        heading: "Isolerend en verduisterend",
        paragraphs: [
          "Isolerende en verduisterende stoffen hebben een dichtere weving of een extra laag aan de achterzijde. Ze houden ’s nachts het licht buiten, beperken in de winter het warmteverlies langs de ramen en houden in de zomer een deel van de warmte buiten. Ook geluid wordt wat gedempt, al vervangt een gordijn natuurlijk geen goede beglazing.",
          "Verduisteren werkt het best wanneer het gordijn ruim over het raam valt, zowel in de breedte als in de hoogte. Zo glipt er langs de zijkanten minder licht binnen.",
        ],
      },
      {
        heading: "Kamerhoog geweven: geen naden",
        paragraphs: [
          "Veel gordijnstoffen in ons assortiment zijn kamerhoog geweven, tot 300 cm breed. De breedte van de stof wordt dan de hoogte van het gordijn, zodat u over de volledige breedte van het raam geen naden hebt. Dat is vooral mooi bij grote ramen en schuiframen. Voor de hoeveelheid stof rekent u met twee tot tweeënhalve keer de breedte van de rail, afhankelijk van de plooi die u kiest. Hoe meer stof, hoe voller het gordijn valt.",
        ],
      },
      {
        heading: "Voel en zie de stof in het echt",
        paragraphs: [
          "Een gordijnstof beoordeelt u het best in het echt: hoe ze valt, hoe ze aanvoelt en hoe ze reageert op daglicht. In onze winkel in Ninove vindt u stoffen van onder meer ADO, Artelux en Loft79. Wilt u advies bij u thuis, in uw eigen licht? Vraag dan een gratis opmeting aan; dan bekijken we alles ter plaatse.",
        ],
      },
    ],
    relatedCategoryId: "c05",
  },
  {
    slug: "behang-kleine-ruimte",
    title: "Behang kiezen voor een kleine ruimte",
    topic: "Stijl",
    excerpt:
      "Een kleine ruimte en behang gaan prima samen, op voorwaarde dat u bewust kiest. Over kleur, motief, strepen en die ene accentwand.",
    image: BEELD.artBehangKlein,
    date: "2026-09-11",
    readingMinutes: 2,
    sections: [
      {
        heading: "Behang in een kleine ruimte? Zeker",
        paragraphs: [
          "Veel mensen denken dat behang een kleine ruimte kleiner maakt. Dat hoeft niet. Een goed gekozen behang geeft een toilet, een hal, een bureau of een kleine slaapkamer net meer diepte en karakter. Het komt erop aan kleur, motief en schaal af te stemmen op de ruimte en op het licht dat er binnenvalt.",
        ],
      },
      {
        heading: "Kleur en licht",
        paragraphs: [
          "Lichte, zachte tinten weerkaatsen meer licht en laten muren optisch wijken. Een effen behang met een subtiele structuur, zoals een linnenlook of een fijn textielbehang, geeft rust zonder saai te worden. Maar ook donker kan werken: in een klein toilet of een leeshoek zorgt een diepe kleur voor een knusse, omhullende sfeer. Het verschil zit in wat u wilt bereiken: ruimte winnen of net geborgenheid creëren.",
          "Kijk ook naar het daglicht. In een ruimte op het noorden ogen koele tinten al snel kil; warmere tonen brengen daar evenwicht.",
        ],
      },
      {
        heading: "Motief en schaal",
        paragraphs: [
          "Een klein, fijn motief leest van op afstand bijna als een structuur en blijft daardoor rustig in een kleine ruimte. Een groot motief kan ook, zeker op één wand: het doet vergeten waar de muren eindigen. Een middelgroot, druk patroon op alle wanden maakt een kleine ruimte daarentegen snel onrustig.",
          "Bloemenmotieven geven warmte en passen goed in een slaapkamer of toilet. Kies dan een dessin met voldoende achtergrond, zodat het motief kan ademen.",
        ],
      },
      {
        heading: "Strepen voor hoogte of breedte",
        paragraphs: [
          "Verticale strepen trekken het oog naar boven en laten een plafond hoger lijken. Dat is handig in een lage kamer of op de zolder. Horizontale strepen doen het omgekeerde: ze verbreden een smalle gang of hal optisch. Kies bij voorkeur fijne of ton-sur-tonstrepen; brede strepen in sterk contrast zijn in een kleine ruimte al snel te veel.",
        ],
      },
      {
        heading: "Begin met één wand",
        paragraphs: [
          "Twijfelt u, begin dan met één wand: de wand achter het bed, achter de zetel of tegenover de deur. Zo ervaart u het effect van een motief zonder de ruimte te overladen. In onze winkel in Ninove kunt u behang bekijken en voelen, van effen en gestreept tot bloemen. Neem gerust de maten van uw wanden mee; dan berekenen we meteen hoeveel rollen u nodig hebt.",
        ],
      },
    ],
    relatedCategoryId: "c02",
  },
  {
    slug: "tapijtmaat-bepalen",
    title: "De juiste tapijtmaat bepalen",
    topic: "Advies",
    excerpt:
      "Een te klein tapijt laat een ruimte verloren ogen. Met deze vuistregels vindt u de juiste maat voor de living, de eethoek en de slaapkamer.",
    image: BEELD.artTapijtmaat,
    date: "2026-08-28",
    readingMinutes: 3,
    sections: [
      {
        heading: "Vertrek van de meubels, niet van de kamer",
        paragraphs: [
          "Een vloerkleed brengt meubels samen tot één geheel. Daarom bepaalt u de maat het best op basis van de meubels die erop of errond staan, en niet op basis van de totale oppervlakte van de kamer. Een veelgemaakte fout is een tapijt dat te klein is: het ligt als een eilandje midden in de ruimte, los van de zetel en de fauteuils.",
          "Een handige tip: baken de gewenste maat af met afplakband op de vloer en laat dat een paar dagen liggen. Zo ziet u hoe het tapijt zich verhoudt tot de meubels en de looplijnen.",
        ],
      },
      {
        heading: "In de living",
        paragraphs: [
          "Twee opstellingen werken goed. Ofwel staan alle meubels van de zithoek volledig op het tapijt, wat een ruim en samenhangend geheel geeft. Ofwel staan enkel de voorpoten van de zetel en de fauteuils op het tapijt, wat in kleinere ruimtes vaak beter werkt. Laat rond het tapijt 20 tot 40 cm vrije vloer tot aan de muur, zodat de vloer zichtbaar blijft en de kamer ademt.",
          "Het tapijt is idealiter ook iets breder dan de zetel zelf, zodat de zetel er niet over lijkt te hangen.",
        ],
      },
      {
        heading: "Onder de eettafel",
        paragraphs: [
          "Onder een eettafel moet het tapijt groot genoeg zijn om de stoelen achteruit te schuiven zonder dat de achterpoten van de rand glijden. Reken op ongeveer 60 à 70 cm extra rondom de tafel. Bij een ronde tafel is een rond tapijt een logische keuze; bij een lange, rechthoekige tafel volgt het tapijt best dezelfde vorm.",
          "Kies onder een eettafel bij voorkeur een tapijt met een korte, dichte pool. Stoelen schuiven dan vlotter en kruimels zijn eenvoudiger te verwijderen.",
        ],
      },
      {
        heading: "In de slaapkamer",
        paragraphs: [
          "In de slaapkamer ligt het tapijt meestal gedeeltelijk onder het bed, dat er met ongeveer twee derde op staat. Zo stapt u aan beide kanten op iets zachts. Laat het tapijt aan de zijkanten en aan het voeteinde telkens een goede 50 cm uitsteken. Een alternatief zijn twee lopers links en rechts van het bed, of een kleiner tapijt aan het voeteinde.",
        ],
      },
      {
        heading: "Standaardmaat of op maat?",
        paragraphs: [
          "Vloerkleden van Louis De Poortere bestaan in verschillende maten en vormen, ook rond of in bijzondere vormen, en sommige ook voor binnen en buiten. Past geen enkele standaardmaat, dan is een tapijt op maat een oplossing: u kiest zelf de afmetingen, onder meer in kwaliteiten van Desso en Tarkett. Kom gerust langs in onze winkel met de maten van uw ruimte en uw meubels; dan zoeken we samen de juiste maat.",
        ],
      },
    ],
    relatedCategoryId: "c03",
  },
  {
    slug: "vasttapijt-kiezen",
    title: "Vasttapijt kiezen: waar let u op?",
    topic: "Advies",
    excerpt:
      "Materiaal, poolstructuur, gebruik en onderhoud: dit zijn de vragen die u zich best stelt voor u vasttapijt kiest.",
    image: BEELD.artVasttapijt,
    date: "2026-08-14",
    readingMinutes: 2,
    sections: [
      {
        heading: "Waar komt het tapijt te liggen?",
        paragraphs: [
          "De eerste vraag is niet welke kleur u mooi vindt, maar hoe intensief de ruimte gebruikt wordt. Een slaapkamer vraagt vooral comfort en warmte. Een trap, een gang of een speelkamer krijgt veel meer te verduren en vraagt om een slijtvaste kwaliteit. Ook huisdieren, kinderen en rechtstreeks zonlicht spelen mee in de keuze.",
        ],
      },
      {
        heading: "Het materiaal",
        paragraphs: [
          "Polyamide is sterk en veerkrachtig: de vezels veren goed terug na belasting, waardoor het tapijt zijn uitzicht langer behoudt. Het is een veelgekozen materiaal voor plaatsen waar veel gelopen wordt. Polypropyleen is kleurvast en goed bestand tegen vlekken, maar iets minder veerkrachtig. Polyester voelt vaak zacht aan en bestaat in heldere kleuren.",
          "Wol is een natuurlijke vezel met een warme uitstraling. Ze is veerkrachtig en kan vocht uit de lucht opnemen en weer afgeven. Sisal is een plantaardige vezel met een stevige, natuurlijke structuur, maar is gevoelig voor vocht en daardoor minder geschikt voor ruimtes waar gemorst kan worden.",
        ],
      },
      {
        heading: "Lussen of velours",
        paragraphs: [
          "Bij een lussentapijt blijven de garens als lusjes bewaard. Dat geeft een stevig oppervlak met structuur, dat goed tegen belasting kan. Let wel op met huisdieren: nagels kunnen in de lussen haken. Bij velours zijn de lussen opengesneden. Dat voelt zachter en warmer aan, maar toont sneller voetafdrukken en lichtere en donkere zones in het licht. Dat is een eigenschap van het materiaal, geen gebrek.",
        ],
      },
      {
        heading: "Kleur, onderhoud en ondergrond",
        paragraphs: [
          "Een gemêleerde kleur verbergt dagelijks vuil beter dan een egale, heel lichte of heel donkere tint. Vraag ook naar de onderhoudsvoorschriften van de fabrikant: niet elk tapijt reageert hetzelfde op water of reinigingsmiddelen.",
          "Tot slot telt wat eronder ligt. Voor een mooi resultaat is een vlakke, droge en schone ondergrond nodig. Hebt u vloerverwarming, kies dan een tapijt en een ondertapijt die daarvoor geschikt zijn. Vasttapijt wordt meestal geleverd in rolbreedtes van 4 of 5 meter; de juiste breedte beperkt het aantal naden.",
        ],
      },
      {
        heading: "Voelen en vergelijken",
        paragraphs: [
          "Vasttapijt kiest u het best met uw handen en uw voeten. In onze winkel in Ninove vindt u stalen van onder meer Associated Weavers, Desso, Lano, Balsan en Tarkett, van zachte velours tot stevige lussen en natuurlijke materialen als wol en sisal. Hebt u een keuze gemaakt, dan meten wij gratis bij u thuis op en leggen onze eigen mensen het tapijt.",
        ],
      },
    ],
    relatedCategoryId: "c04",
  },
  {
    slug: "stoffen-combineren",
    title: "Stoffen, behang en kleuren combineren",
    topic: "Kleur",
    excerpt:
      "Gordijnen, behang, tapijt en zetel: hoe laat u alles samenwerken zonder dat het te veel wordt? Een paar eenvoudige principes helpen.",
    image: BEELD.artCombineren,
    date: "2026-07-31",
    readingMinutes: 2,
    sections: [
      {
        heading: "Kies een vertrekpunt",
        paragraphs: [
          "Een samenhangend interieur begint zelden bij nul. Vaak is er al een zetel, een vloer of een kast die blijft. Gebruik dat als vertrekpunt. Of kies één element waar u echt van houdt, zoals een behang met bloemen of een gordijnstof met tekening, en bouw daar de rest omheen. Uit een motief haalt u meteen twee of drie kleuren voor de andere stoffen in de ruimte.",
        ],
      },
      {
        heading: "Verdeel de kleuren",
        paragraphs: [
          "Een bekende vuistregel verdeelt de kleuren in een ruimte in drie: ongeveer 60 procent voor een basiskleur, 30 procent voor een tweede kleur en 10 procent voor een accent. De basiskleur zit in de grote vlakken, zoals muren en vloer. De tweede kleur vindt u terug in de gordijnen, een tapijt of de zetel. Het accent brengt u aan met kussens, een plaid of een detail in het behang.",
          "Het is geen wet, maar het helpt om evenwicht te bewaren, zeker wanneer u met uitgesproken kleuren werkt.",
        ],
      },
      {
        heading: "Speel met structuur en schaal",
        paragraphs: [
          "Wie binnen één kleurfamilie blijft, houdt het interessant door te variëren in structuur. Combineer een gladde stof met linnen, een fijn geweven gordijn met een grof wollen tapijt, of een effen muur met een textielbehang. Zo blijft een ton-sur-toninterieur levendig.",
          "Combineert u motieven, varieer dan in schaal. Een groot bloemenmotief op de muur gaat goed samen met een fijne streep in de gordijnen en een effen tapijt. Twee grote, drukke motieven naast elkaar vechten om aandacht.",
        ],
      },
      {
        heading: "Kijk in uw eigen licht",
        paragraphs: [
          "Kleuren veranderen met het licht. Een stof die in de winkel warm grijs oogt, kan thuis in noorderlicht koeler overkomen. Kijk ook naar de kleur van uw vloer en uw houtwerk: die spreken altijd mee. Hebt u een staal of een foto van uw zetel, vloer of kasten, breng die dan mee naar de winkel. Tijdens een opmeting aan huis bekijken we de stalen graag bij u, in uw eigen licht.",
        ],
      },
      {
        heading: "Laat u adviseren",
        paragraphs: [
          "In onze winkel in Ninove ziet u gordijnstoffen, behang, tapijten en verf naast elkaar, wat combineren een stuk eenvoudiger maakt. Wij helpen u graag een kleurenpalet samen te stellen dat bij uw interieur past. Wilt u alles in uw eigen woning bekijken, vraag dan een gratis opmeting aan.",
        ],
      },
    ],
    relatedCategoryId: "c05",
  },
  {
    slug: "warme-tinten",
    title: "Warme tinten voor een knus interieur",
    topic: "Kleur",
    excerpt:
      "Terracotta, oker, zandtinten en warm groen maken een ruimte meteen gezelliger. Zo brengt u warmte binnen met stoffen, behang en tapijt.",
    image: BEELD.artWarmeTinten,
    date: "2026-07-17",
    readingMinutes: 2,
    sections: [
      {
        heading: "Wat zijn warme tinten?",
        paragraphs: [
          "Warme tinten hebben een ondertoon van rood, oranje of geel. Denk aan terracotta, roest, oker, honing, karamel en zandkleuren, maar ook aan warm groen zoals olijf en mos, en aan gebroken wit met een gele of roze ondertoon. Ze doen denken aan hout, klei en herfstbladeren, en geven een ruimte een gevoel van geborgenheid.",
        ],
      },
      {
        heading: "Begin met de grote vlakken",
        paragraphs: [
          "Een warme basis begint bij de muren en de vloer. Kies in plaats van helder wit een gebroken wit of een zachte zandtint; het verschil lijkt klein, maar de sfeer verandert helemaal. Een behang in een warme, effen tint of met een subtiele structuur werkt hier ook mooi. Op de vloer zorgt een wollen vasttapijt of een vloerkleed in natuurlijke tinten meteen voor warmte onder de voeten.",
        ],
      },
      {
        heading: "Gordijnen als warme laag",
        paragraphs: [
          "Gordijnen zijn een van de sterkste middelen om een ruimte warmer te maken. Ze verzachten harde lijnen, dempen geluid en filteren het licht. Een linnenlook in zand of karamel geeft overdag een zachte gloed; een velours in roest of flessengroen zorgt ’s avonds voor een omhullende sfeer. Kiest u een isolerende stof, dan wint u ook aan comfort tijdens de koudere maanden.",
          "Ook kleiner textiel speelt mee: een wollen plaid, kussens in velours of linnen, een vloerkleed met een warme ondertoon. Zulke accenten wisselt u gemakkelijk met de seizoenen, zonder dat u meteen de muren of de vloer hoeft aan te pakken.",
        ],
      },
      {
        heading: "Evenwicht bewaren",
        paragraphs: [
          "Te veel warme tinten tegelijk kunnen een ruimte zwaar maken. Zorg daarom voor rustpunten: een lichte muur naast een donkerder gordijn, of een effen tapijt onder een zetel met motief. Een beetje contrast, zoals een koelere groen- of blauwtint in een kussen of een kunstwerk, laat de warme kleuren net beter uitkomen.",
          "Let ook op het licht. In een ruimte op het zuiden worden warme tinten snel intens; daar kiest u beter zachtere, gedempte varianten. In een ruimte op het noorden brengen ze net het nodige evenwicht.",
        ],
      },
      {
        heading: "Kleuren in het echt bekijken",
        paragraphs: [
          "Warme tinten beoordeelt u het best in het echt, naast elkaar en in wisselend licht. In onze winkel in Ninove kunt u gordijnstoffen, behang, tapijten en verf samen bekijken. Wij denken graag met u mee over een palet dat past bij uw interieur, en bij een opmeting aan huis bekijken we het ook in uw eigen ruimte.",
        ],
      },
    ],
    relatedCategoryId: "c02",
  },
  {
    slug: "fotobehang-panoramisch",
    title: "Fotobehang en panoramisch behang: één wand als blikvanger",
    topic: "Stijl",
    excerpt:
      "Eén wand met een groot, doorlopend beeld verandert een ruimte volledig. Wat is het verschil tussen fotobehang en panoramisch behang, en hoe kiest u?",
    image: BEELD.artFotobehang,
    date: "2026-07-03",
    readingMinutes: 3,
    sections: [
      {
        heading: "Wat is het verschil?",
        paragraphs: [
          "Klassiek behang herhaalt een motief over de hele wand. Bij panoramisch behang en fotobehang is dat anders: het beeld loopt als één geheel over de wand, zonder herhaling. Panoramisch behang bestaat meestal uit een reeks genummerde banen die samen één ontwerp vormen, zoals een landschap of een botanisch tafereel. Fotobehang wordt vaak op maat gemaakt: het beeld wordt afgedrukt op de afmetingen van uw wand.",
          "Bij ESTAhome en Origin Wallcoverings vindt u fotobehang in vaste afmetingen; bij Boråstapeter kunt u fotobehang op maat laten maken.",
        ],
      },
      {
        heading: "Welke wand kiest u?",
        paragraphs: [
          "Een blikvangerwand werkt het best op een plaats waar het oog vanzelf naartoe gaat: achter het bed, achter de zetel of de eettafel, of de wand die u ziet wanneer u de kamer binnenkomt. Kies bij voorkeur een wand zonder te veel onderbrekingen door deuren, ramen of stopcontacten, zodat het beeld zijn kracht behoudt.",
          "Ook in een hal, een trapzaal of een toilet kan een panoramisch motief verrassend goed werken. Het geeft diepte aan een ruimte waar u anders weinig mee doet.",
        ],
      },
      {
        heading: "Het beeld kiezen",
        paragraphs: [
          "Een landschap of een beeld met perspectief, zoals een bos of een zicht in de verte, laat een kleine kamer dieper lijken. Botanische ontwerpen en grote bloemen brengen leven en kleur. Abstracte of grafische beelden passen goed in een strak interieur.",
          "Laat de kleuren van het beeld terugkomen in de rest van de ruimte, bijvoorbeeld in de gordijnen, een kussen of het tapijt. Zo is de wand geen los element, maar een deel van het geheel. Houd de andere wanden liefst rustig en effen.",
        ],
      },
      {
        heading: "Nauwkeurig opmeten",
        paragraphs: [
          "Bij fotobehang op maat is een nauwkeurige opmeting belangrijk. Meet de breedte en de hoogte van de wand op verschillende plaatsen, want muren en plafonds zijn zelden helemaal recht. Volg de richtlijnen van de fabrikant voor de marge aan de randen, zodat het behang bij het plaatsen kan worden bijgesneden. Bepaal ook vooraf welk deel van het beeld het belangrijkst is, zodat het niet achter een kast of een bed verdwijnt.",
          "Omdat fotobehang op maat speciaal voor u wordt gemaakt, kan het na de bestelling niet worden teruggenomen. Neem dus rustig de tijd om het beeld en de afmetingen te controleren.",
        ],
      },
      {
        heading: "Samen kiezen",
        paragraphs: [
          "In onze winkel in Ninove kunt u panoramische ontwerpen en fotobehang bekijken en bespreken hoe een beeld op uw wand zal ogen. Breng gerust een foto en de maten van de wand mee; wij helpen u met de keuze en de bestelling.",
        ],
      },
    ],
    relatedCategoryId: "c02",
  },
  {
    slug: "tapijt-onderhouden",
    title: "Zo onderhoudt u vasttapijt en vloerkleden",
    topic: "Onderhoud",
    excerpt:
      "Regelmatig stofzuigen, vlekken meteen aanpakken en af en toe een grondige reiniging: zo blijft uw tapijt langer mooi.",
    image: BEELD.artTapijtOnderhoud,
    date: "2026-06-19",
    readingMinutes: 2,
    sections: [
      {
        heading: "Regelmatig stofzuigen",
        paragraphs: [
          "Het belangrijkste onderhoud is ook het eenvoudigste: regelmatig stofzuigen. Zand en vuil zakken tussen de vezels en schuren daar bij elke stap. Stofzuig op drukke plaatsen een paar keer per week en in minder gebruikte ruimtes wekelijks. Zuig in verschillende richtingen, zodat u ook het vuil tussen de vezels meeneemt.",
          "Gebruik bij een lussentapijt of een wollen tapijt bij voorkeur een zuigmond zonder draaiende borstel, of zet de borstel hoger. Een draaiende borstel kan lussen doen uitrafelen of vezels doen pluizen. Volg ook hier de aanbevelingen van de fabrikant.",
        ],
      },
      {
        heading: "Vlekken: snel en voorzichtig",
        paragraphs: [
          "Hoe sneller u een vlek aanpakt, hoe groter de kans dat ze volledig verdwijnt. Dep vloeistoffen meteen op met een droge, witte doek of keukenpapier. Wrijf niet, want dan duwt u de vlek dieper en beschadigt u de vezels. Werk van de buitenkant naar het midden, zodat de vlek zich niet uitbreidt, en schep vaste resten eerst voorzichtig weg.",
          "Gebruik daarna enkel een reinigingsmiddel dat geschikt is voor uw tapijt, en test het eerst op een onopvallende plaats. Volg altijd het onderhoudsvoorschrift van de fabrikant: wol, sisal en synthetische vezels reageren elk anders op water en reinigingsmiddelen. Sisal verdraagt bijvoorbeeld weinig vocht.",
        ],
      },
      {
        heading: "Eigenschappen, geen gebreken",
        paragraphs: [
          "Een nieuw wollen tapijt kan de eerste maanden wat pluizen. Dat zijn losse vezeltjes van de productie, die met regelmatig stofzuigen vanzelf verminderen. Bij velours ziet u soms lichtere en donkere zones, afhankelijk van de richting waarin de pool ligt. Die schaduwwerking hoort bij het materiaal. Drukplekken van meubels kunt u vaak verminderen door de pool voorzichtig op te borstelen.",
        ],
      },
      {
        heading: "Vloerkleden draaien en beschermen",
        paragraphs: [
          "Draai een vloerkleed een of twee keer per jaar een halve slag. Zo verdeelt u de slijtage en verkleurt het tapijt gelijkmatiger onder invloed van het zonlicht. Een antislipmat eronder houdt het kleed op zijn plaats en beschermt de vloer.",
          "Aan de voordeur vangt een goede antivuilmat een groot deel van het zand en vuil op voor het uw tapijt bereikt.",
        ],
      },
      {
        heading: "Grondig laten reinigen",
        paragraphs: [
          "Afhankelijk van het gebruik laat u vasttapijt of een vloerkleed af en toe grondig reinigen door een gespecialiseerde tapijtreiniger. Vraag vooraf welke methode geschikt is voor uw materiaal. Twijfelt u over het onderhoud van een tapijt dat u bij ons kocht, vraag het ons gerust in de winkel; wij helpen u graag verder.",
        ],
      },
    ],
    relatedCategoryId: "c04",
  },
  {
    slug: "gordijnen-onderhouden",
    title: "Gordijnen wassen en onderhouden",
    topic: "Onderhoud",
    excerpt:
      "Gordijnen vangen stof, licht en geurtjes op. Met regelmatig onderhoud en de juiste wasmethode blijven ze jarenlang mooi.",
    image: BEELD.artGordijnenOnderhoud,
    date: "2026-06-05",
    readingMinutes: 2,
    sections: [
      {
        heading: "Eerst het onderhoudslabel",
        paragraphs: [
          "Elke gordijnstof heeft haar eigen onderhoudsvoorschriften. Sommige stoffen mogen in de wasmachine, andere enkel droog gereinigd worden. Kijk daarom altijd eerst naar het onderhoudslabel of het wasvoorschrift van de stof, en volg dat nauwkeurig. Weet u niet meer welk voorschrift bij uw gordijnen hoort, vraag het ons dan; wij helpen u graag verder.",
        ],
      },
      {
        heading: "Regelmatig ontstoffen",
        paragraphs: [
          "Het beste onderhoud gebeurt tussendoor. Zuig uw gordijnen om de paar weken voorzichtig af met de zachte borstel van uw stofzuiger, op een lage zuigkracht en van boven naar beneden. Schud ze af en toe even uit en verlucht de kamer regelmatig. Zo hoeft u ze minder vaak te wassen, en dat komt de levensduur van de stof ten goede.",
        ],
      },
      {
        heading: "Wassen: voorzichtig en koel",
        paragraphs: [
          "Mag uw gordijn in de wasmachine, kies dan het programma en de temperatuur die op het label staan, meestal een fijnwasprogramma op lage temperatuur. Gebruik een mild wasmiddel zonder bleekmiddel en was niet te veel stof tegelijk, zodat de gordijnen vrij kunnen bewegen. Centrifugeer op een laag toerental om kreuken te beperken.",
          "Houd er rekening mee dat sommige stoffen, zoals linnen en katoen, bij het wassen licht kunnen krimpen. Ook voeringen en verduisterende lagen vragen extra zorg. Twijfelt u, laat de gordijnen dan reinigen door een professionele stomerij.",
        ],
      },
      {
        heading: "Drogen en ophangen",
        paragraphs: [
          "Stop gordijnen niet in de droogkast, tenzij het label dat uitdrukkelijk toelaat. Hang ze licht vochtig terug op: door hun eigen gewicht trekken veel stoffen vanzelf mooi recht. Moet u toch strijken, doe dat dan op de temperatuur die het label aangeeft, bij voorkeur aan de achterzijde van de stof.",
          "Geef de gordijnen na het ophangen een paar dagen de tijd voor u de lengte beoordeelt: sommige stoffen moeten zich nog zetten. Hangt een gordijn na het wassen merkbaar korter of langer dan voordien, laat het ons dan weten; in de winkel bekijken we graag met u wat mogelijk is.",
        ],
      },
      {
        heading: "Bescherming tegen de zon",
        paragraphs: [
          "Zonlicht is een van de grootste vijanden van textiel. Na verloop van tijd kunnen stoffen aan de raamkant verkleuren of verzwakken, zeker op het zuiden. Een voering of een tweede, lichtere gordijnlaag beschermt uw gordijnen. Hebt u vragen over het onderhoud van uw gordijnen, of denkt u aan nieuwe? Kom langs in onze winkel in Ninove; wij bekijken het graag met u.",
        ],
      },
    ],
    relatedCategoryId: "c05",
  },
  {
    slug: "van-stof-tot-plaatsing",
    title: "Van stofkeuze tot plaatsing: zo werkt ons atelier",
    topic: "Advies",
    excerpt:
      "Hoe worden gordijnen op maat bij Brunic gemaakt? Een blik achter de schermen, van het eerste gesprek in de winkel tot de plaatsing bij u thuis.",
    image: BEELD.artAtelier,
    date: "2026-05-15",
    readingMinutes: 2,
    sections: [
      {
        heading: "Het begint met een gesprek",
        paragraphs: [
          "Elk gordijn op maat begint in onze winkel in Ninove of bij u thuis, met een gesprek over de ruimte en wat u zoekt. Wilt u meer privacy, minder licht, meer warmte of vooral sfeer? Samen bekijken we stoffen van onder meer ADO, Artelux en Loft79: effen of met tekening, licht en luchtig of dicht en verduisterend. U voelt de stof, ziet hoe ze valt en krijgt eerlijk advies over wat bij uw ramen past.",
        ],
      },
      {
        heading: "Opmeten bij u thuis",
        paragraphs: [
          "Daarna komen we gratis bij u thuis opmeten. Dat doen we zelf, omdat de maten het fundament zijn van alles wat volgt. We noteren niet alleen de breedte en de hoogte van de ramen, maar ook de plaats van de rail of roede, de afstand tot het plafond en de vloer, en de gewenste lengte: net boven de vloer, er net op of met een lichte val. Op basis daarvan maken we uw offerte, met een indicatie van de termijn.",
        ],
      },
      {
        heading: "Maakwerk in ons atelier",
        paragraphs: [
          "Na uw akkoord gaat de bestelling naar ons eigen atelier. Onze stiksters snijden de stof op maat, werken de zomen af en brengen de plooien aan, precies zoals afgesproken. Omdat het atelier deel uitmaakt van ons eigen bedrijf, zijn de lijnen kort: een vraag over een detail wordt meteen opgelost tussen winkel en atelier.",
          "Vakmanschap zit in de details: een zoom die recht valt, plooien die gelijkmatig verdeeld zijn, een patroon dat mooi doorloopt over de banen. Het zijn dingen die u misschien niet bewust opmerkt, maar wel elke dag ziet.",
        ],
      },
      {
        heading: "Plaatsing door onze eigen mensen",
        paragraphs: [
          "Wanneer uw gordijnen klaar zijn, spreken we een moment af voor de plaatsing. Onze eigen mensen brengen de gordijnen bij u thuis, hangen ze op en verdelen de plooien, zodat ze meteen mooi hangen. Ze controleren de lengte en overlopen alles samen met u. Zo weet u zeker dat alles hangt zoals afgesproken.",
        ],
      },
      {
        heading: "Waarom een eigen atelier?",
        paragraphs: [
          "Een eigen atelier betekent voor u één aanspreekpunt, van het eerste advies tot de laatste plooi. Wie opmeet, weet wat het atelier nodig heeft, en wie plaatst, weet hoe de gordijnen gemaakt zijn. Als familiebedrijf dat al 40 jaar in Ninove gevestigd is, geloven we in die korte lijnen. Benieuwd wat dat voor uw ramen kan betekenen? Vraag een gratis opmeting aan of kom langs in de winkel.",
        ],
      },
    ],
    relatedCategoryId: "c05",
  },
];

/* ------------------------------------------------------------------ */
/* Veelgestelde vragen (contactpagina + infopagina)                     */
/* ------------------------------------------------------------------ */

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Is de opmeting aan huis echt gratis?",
    a: "Ja. Wij komen gratis bij u thuis opmeten en geven ter plaatse advies over stoffen, raamdecoratie of vloerbekleding. Nadien ontvangt u een offerte op basis van de exacte maten. De opmeting verplicht u tot niets.",
  },
  {
    q: "Hoe lang duurt het maken van gordijnen op maat?",
    a: "Dat hangt af van de gekozen stof en van de omvang van uw project. U krijgt een indicatie van de termijn bij uw offerte. Zodra uw gordijnen klaar zijn, plannen we de plaatsing samen met u in.",
  },
  {
    q: "Waarom staat er bij de producten ‘prijs op aanvraag’?",
    a: "De prijs van gordijnen, behang en vloerbekleding hangt af van uw maten, het stofverbruik, de afwerking en een eventuele plaatsing. Een vaste prijs per stuk zou daarom weinig zeggen. Beschrijf uw project via het aanvraagformulier; wij nemen binnen 1 à 2 werkdagen contact met u op om het te bespreken.",
  },
  {
    q: "Kan ik stoffen en stalen in de winkel bekijken?",
    a: `Zeker. In onze winkel in ${SITE.address.city} kunt u gordijnstoffen, behang, vasttapijt en tapijten in het echt bekijken en voelen. Kleur en structuur beoordeelt u zo veel beter dan op een scherm. U bent welkom tijdens onze openingsuren (${SITE.hoursShort}).`,
  },
  {
    q: "Hoe gebruik ik de verlanglijst?",
    a: "Bewaar de producten die u interesseren op uw verlanglijst terwijl u door de website bladert. U kunt die lijst afdrukken, met de artikelnummers erbij, en meenemen naar de winkel. Zo vinden we samen snel de juiste stalen terug.",
  },
  {
    q: "Plaatst Brunic ook zelf?",
    a: "Ja. Gordijnen, raamdecoratie en vasttapijt worden bij u thuis geleverd en geplaatst door onze eigen mensen. Wat de plaatsing inhoudt en kost, staat vooraf in uw offerte.",
  },
  {
    q: "Kan ik mijn bestelling afhalen in de winkel?",
    a: `Ja, u kunt uw bestelling afhalen in onze winkel aan de ${SITE.address.street} in ${SITE.address.city}. Wij laten u weten wanneer ze voor u klaarligt, zodat u niet voor niets komt.`,
  },
  {
    q: "Werkt Brunic ook voor horeca, zorg en bedrijven?",
    a: "Ja. Voor hotels, restaurants, zorginstellingen en andere projecten leveren wij brandvertragende en brandvrije stoffen, gordijnen uit ons eigen atelier en vasttapijt of tapijttegels voor intensief gebruik. Wij maken graag een offerte op maat van uw project.",
  },
  {
    q: "Kan ik maatwerk terugsturen?",
    a: "Maatwerk, zoals gordijnen op maat of op maat gesneden stof en vasttapijt, wordt speciaal voor u gemaakt en valt daarom wettelijk niet onder het herroepingsrecht. De wettelijke garantie van twee jaar blijft natuurlijk gelden. Daarom overlopen we de maten en uw keuzes vooraf zorgvuldig met u.",
  },
  {
    q: "Hoe onderhoud ik mijn gordijnen of tapijt?",
    a: "Volg altijd het onderhoudslabel of het wasvoorschrift van de stof of het tapijt. Regelmatig afstoffen of stofzuigen doet al veel. In onze rubriek Inspiratie & advies vindt u praktische tips, en in de winkel helpen wij u graag verder.",
  },
  {
    q: "Verkoopt u raamdecoratie ook online?",
    a: "Rolgordijnen, plissés, jaloezieën en vouwgordijnen worden altijd op maat gemaakt en zijn daarom niet online te koop. U bekijkt en kiest ze in onze winkel of bij u thuis, waarna wij opmeten en plaatsen.",
  },
  {
    q: "Wanneer bent u open en hoe bereik ik u?",
    a: `Onze winkel vindt u aan de ${ADRES}. Openingsuren: ${SITE.hoursShort}. U kunt ons ook bellen op ${SITE.phone.display} of mailen naar ${SITE.email}.`,
  },
];

/** Extra vragen die enkel op de infopagina ‘Veelgestelde vragen’ staan. */
const FAQ_EXTRA: { q: string; a: string }[] = [
  {
    q: "Kan ik foto’s meesturen met mijn aanvraag?",
    a: "Ja. In het aanvraagformulier kunt u foto’s toevoegen van uw ramen, vloer of ruimte. Zo krijgen wij meteen een beeld van uw project en kunnen we gerichter advies geven wanneer we contact met u opnemen.",
  },
  {
    q: "Werkt u ook buiten Ninove?",
    a: "Onze klanten wonen vooral in Ninove en de Denderstreek. Woont u verder, vraag het ons gerust; wij bekijken graag wat mogelijk is voor opmeting, levering en plaatsing.",
  },
  {
    q: "Moet ik een afspraak maken om naar de winkel te komen?",
    a: "Nee, tijdens onze openingsuren bent u welkom om rond te kijken en stoffen, behang en tapijten te bekijken. Voor een uitgebreid adviesgesprek over een groter project belt u best even vooraf, zodat we voldoende tijd voor u kunnen maken.",
  },
  {
    q: "Is mijn verlanglijst op al mijn toestellen zichtbaar?",
    a: "Nee. Uw verlanglijst wordt bewaard in de browser van het toestel waarop u ze aanmaakte. Wilt u ze bijhouden of meenemen, druk ze dan af of bewaar ze als pdf via de afdrukfunctie van uw browser.",
  },
];

/* ------------------------------------------------------------------ */
/* Infopagina's (footerlinks)                                           */
/* ------------------------------------------------------------------ */

export type InfoPage = {
  slug: string;
  title: string;
  intro: string;
  sections: { heading?: string; paragraphs: string[] }[];
  /** ISO-datum van de laatste wijziging (juridische pagina's). */
  updated?: string;
};

const JURIDISCH_BIJGEWERKT = "2026-09-30";

// Juridische teksten = ontwerp; te valideren door Brunic vóór livegang.
export const INFO_PAGES: InfoPage[] = [
  {
    slug: "over-ons",
    title: "Over Brunic",
    intro:
      "Brunic is een familiebedrijf dat al 40 jaar in Ninove klaarstaat voor wie zijn interieur wil verfraaien. Van gordijnen op maat uit ons eigen atelier tot behang, tapijt en vasttapijt: wij adviseren, meten op, maken en plaatsen.",
    sections: [
      {
        heading: "Een familiebedrijf in Ninove",
        paragraphs: [
          "Brunic is al 40 jaar een vertrouwd adres in Ninove en de Denderstreek. Als familiebedrijf helpen wij u met alles wat een woning warm en persoonlijk maakt: gordijnen en stoffen, raamdecoratie, behang, vasttapijt, tapijten, verf en slaapcomfort. Sinds 1992 is Brunic een nv. Onze aanpak is dezelfde gebleven: persoonlijk advies, vakmanschap en betrokkenheid tot uw project af is.",
        ],
      },
      {
        heading: "Ons eigen atelier",
        paragraphs: [
          "Wat ons onderscheidt, is ons eigen atelier. Gordijnen op maat worden bij ons gemaakt door onze eigen stiksters, op de maten die wij bij u thuis opmeten. Dat geeft korte lijnen tussen winkel, atelier en plaatsing, en het laat ons toe om ook bijzondere wensen of moeilijke ramen met zorg aan te pakken.",
        ],
      },
      {
        heading: "Van advies tot plaatsing",
        paragraphs: [
          "Bij Brunic hoeft u niet zelf alles te regelen. U krijgt advies in de winkel, wij komen gratis bij u thuis opmeten, het maakwerk gebeurt in ons eigen atelier en onze eigen mensen zorgen voor de levering en de plaatsing. Zo hebt u van begin tot einde één aanspreekpunt dat uw project kent.",
        ],
      },
      {
        heading: "Ook voor projecten",
        paragraphs: [
          "Naast particulieren werken wij ook voor horeca en zorg. Voor hotels, restaurants en zorginstellingen leveren wij brandvertragende en brandvrije stoffen, gordijnen uit ons eigen atelier en vasttapijt of tapijttegels, afgestemd op intensief gebruik.",
        ],
      },
      {
        heading: "Welkom in de winkel",
        paragraphs: [
          `U vindt onze winkel aan de ${ADRES}. U bent welkom tijdens onze openingsuren (${SITE.hoursShort}) om rond te kijken, stoffen te voelen en stalen te vergelijken. Liever eerst iets vragen? Bel ons op ${SITE.phone.display} of mail naar ${SITE.email}.`,
        ],
      },
    ],
  },
  {
    slug: "levering",
    title: "Levering & afhalen",
    intro:
      "Maatwerk leveren en plaatsen wij met onze eigen mensen. Andere bestellingen laat u leveren of haalt u af in onze winkel in Ninove.",
    sections: [
      {
        heading: "Maatwerk: levering en plaatsing door onze eigen mensen",
        paragraphs: [
          "Gordijnen op maat, raamdecoratie, vasttapijt en tapijten op maat leveren wij bij u thuis met onze eigen mensen. Hoort plaatsing bij de opdracht, dan gebeurt die meteen bij de levering. Wij spreken de datum en het tijdstip vooraf met u af.",
          "De termijn hangt af van de gekozen stof of kwaliteit en van de omvang van het project. U krijgt een indicatie in uw offerte, samen met wat de levering en de plaatsing kosten. Zo weet u waar u aan toe bent voor u beslist.",
        ],
      },
      {
        heading: "Bestellingen via de webshop",
        paragraphs: [
          "Voor producten met ‘prijs op aanvraag’ maken wij een offerte op; daarin staan ook de levering en een eventuele plaatsing. Bestelt u een product rechtstreeks online, dan ziet u bij het afrekenen welke leveringsmogelijkheden er zijn, wat ze eventueel kosten en wanneer u uw bestelling mag verwachten, nog voor u de bestelling bevestigt.",
          "Tenzij anders afgesproken, leveren wij uiterlijk 30 dagen na het sluiten van de overeenkomst, zoals de wet voorschrijft. Lukt dat onverwacht niet, dan brengen wij u zo snel mogelijk op de hoogte.",
        ],
      },
      {
        heading: "Afhalen in de winkel",
        paragraphs: [
          `U kunt uw bestelling ook afhalen in onze winkel aan de ${ADRES}. Wij laten u weten wanneer ze voor u klaarligt. Afhalen kan tijdens onze openingsuren (${SITE.hoursShort}). Vermeld bij het afhalen uw naam of uw bestelnummer.`,
        ],
      },
      {
        heading: "Bij ontvangst",
        paragraphs: [
          `Controleer uw bestelling bij ontvangst. Is er iets beschadigd, ontbreekt er iets of klopt een artikel niet, meld het ons dan zo snel mogelijk via ${SITE.email} of op ${SITE.phone.display}, bij voorkeur met een foto. Wij zoeken samen met u naar een oplossing.`,
        ],
      },
      {
        heading: "Waar leveren wij?",
        paragraphs: [
          "Onze klanten wonen vooral in Ninove en de Denderstreek. Woont u verder, vraag het ons gerust; wij bekijken graag wat mogelijk is.",
        ],
      },
    ],
  },
  {
    slug: "retourneren",
    title: "Retourneren",
    intro:
      "Wilt u een online gekocht artikel terugsturen? Hier leest u hoe dat werkt, wanneer u uw geld terugkrijgt en waarom maatwerk een uitzondering is.",
    updated: JURIDISCH_BIJGEWERKT,
    sections: [
      {
        heading: "Online gekocht: 14 dagen bedenktijd",
        paragraphs: [
          "Kocht u als consument een product via onze webshop, of sloot u een overeenkomst buiten onze winkel, bijvoorbeeld bij u thuis, dan hebt u in principe het recht om de overeenkomst binnen 14 kalenderdagen te herroepen, zonder opgave van redenen. Bij goederen begint die termijn de dag nadat u, of iemand die u aanwees, het product ontvangen hebt. Alle voorwaarden en het modelformulier vindt u op de pagina Herroepingsrecht.",
        ],
      },
      {
        heading: "Zo stuurt u een artikel terug",
        paragraphs: [
          `Laat ons binnen de termijn van 14 dagen weten dat u de overeenkomst herroept, per e-mail naar ${SITE.email} of per brief aan ${SITE.legalName}, ${ADRES}. U kunt daarvoor het modelformulier gebruiken, maar dat is niet verplicht. Vermeld uw naam, uw bestelnummer en om welke artikelen het gaat.`,
          `Bezorg ons het artikel daarna binnen 14 dagen terug. Wij spreken met u af hoe dat het best gebeurt: u brengt het binnen in onze winkel aan de ${SITE.address.street} in ${SITE.address.city}, of u stuurt het naar dat adres. De rechtstreekse kosten van het terugzenden zijn voor uw rekening, tenzij wij iets anders met u afspreken.`,
          "Stuur het artikel terug in zijn oorspronkelijke staat, met alle toebehoren en indien mogelijk in de originele verpakking. U mag een product bekijken zoals u dat in een winkel zou doen. Hebt u het meer gebruikt dan nodig om de aard, de kenmerken en de werking vast te stellen, dan kunnen wij de waardevermindering aanrekenen. Een rol behang die al aangesneden of met lijm ingestreken is, kan bijvoorbeeld niet meer als nieuw verkocht worden.",
        ],
      },
      {
        heading: "Terugbetaling",
        paragraphs: [
          "Wij betalen alle bedragen die u betaald hebt, inclusief de kosten van de standaardlevering, terug binnen 14 dagen nadat wij uw herroeping ontvingen. Koos u voor een duurdere leveringswijze dan de standaardlevering, dan betalen wij enkel de kosten van de standaardlevering terug. Wij mogen wachten met terugbetalen tot wij het artikel terug hebben of tot u aantoont dat u het hebt teruggestuurd. Wij betalen terug met hetzelfde betaalmiddel dat u gebruikte, tenzij we samen iets anders afspreken; dat kost u niets.",
        ],
      },
      {
        heading: "Maatwerk kan niet worden geretourneerd",
        paragraphs: [
          "Het herroepingsrecht geldt niet voor producten die volgens uw specificaties worden gemaakt of die duidelijk voor u gepersonaliseerd zijn (artikel VI.53, 3° van het Wetboek van economisch recht). Bij Brunic gaat het onder meer om gordijnen op maat, raamdecoratie op maat, fotobehang op maat, tapijten op maat, en stof, wandbekleding of vasttapijt die op de door u gevraagde lengte of maat gesneden wordt. Daarom nemen wij bij de opmeting en de offerte uitgebreid de tijd om alles met u te overlopen.",
        ],
      },
      {
        heading: "Aankopen in de winkel",
        paragraphs: [
          "Voor aankopen in onze winkel geldt geen wettelijk herroepingsrecht. Wilt u toch een standaardartikel ruilen of terugbrengen, vraag het ons dan; wij bekijken graag wat mogelijk is.",
        ],
      },
      {
        heading: "Een defect of een verkeerde levering",
        paragraphs: [
          "Is een product beschadigd, defect of niet wat u bestelde, dan valt dat niet onder de herroeping maar onder de wettelijke garantie van twee jaar, die ook voor maatwerk geldt. Meld het ons zo snel mogelijk, en in elk geval binnen twee maanden nadat u het probleem vaststelde, bij voorkeur met een foto. Wij zoeken dan samen met u naar een oplossing.",
        ],
      },
    ],
  },
  {
    slug: "veelgestelde-vragen",
    title: "Veelgestelde vragen",
    intro:
      "Hier vindt u antwoorden op de vragen die wij het vaakst krijgen. Staat uw vraag er niet bij, bel of mail ons gerust.",
    sections: [...FAQ, ...FAQ_EXTRA].map((f) => ({ heading: f.q, paragraphs: [f.a] })),
  },
  {
    slug: "betaalmethoden",
    title: "Betaalmethoden",
    intro: "Hoe u betaalt, hangt af van hoe u bij ons koopt: online, in de winkel of via een offerte.",
    sections: [
      {
        heading: "Online bestellen",
        paragraphs: [
          "Bestelt u rechtstreeks via de webshop, dan ziet u de beschikbare betaalmethoden bij het afrekenen. Online betalingen verlopen via de beveiligde betaalomgeving van onze webshop; uw volledige kaart- of bankgegevens komen niet bij ons terecht.",
        ],
      },
      {
        heading: "In de winkel",
        paragraphs: [
          `In de winkel kunt u ter plaatse betalen. U vindt ons aan de ${ADRES} (${SITE.hoursShort}).`,
        ],
      },
      {
        heading: "Maatwerk en offertes",
        paragraphs: [
          "Voor maatwerk en producten met ‘prijs op aanvraag’ werken wij met een offerte. Daarin staat duidelijk wat u betaalt, hoe en wanneer, bijvoorbeeld of er een voorschot gevraagd wordt en wanneer het saldo betaald moet worden. Zo weet u vooraf waar u aan toe bent.",
        ],
      },
      {
        heading: "Factuur op naam van uw bedrijf",
        paragraphs: [
          "Hebt u een factuur nodig op naam van uw bedrijf, bijvoorbeeld voor een project in horeca of zorg, geef dan bij uw aanvraag of bestelling uw bedrijfsgegevens en uw btw-nummer door.",
        ],
      },
      {
        heading: "Vragen over een betaling?",
        paragraphs: [`Bel ons op ${SITE.phone.display} of mail naar ${SITE.email}; wij helpen u graag verder.`],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookies",
    intro:
      "Deze website gebruikt geen tracking- of advertentiecookies. Wij bewaren enkel wat nodig is om de website te laten werken, en dat lokaal in uw browser.",
    updated: JURIDISCH_BIJGEWERKT,
    sections: [
      {
        heading: "Wat zijn cookies en lokale opslag?",
        paragraphs: [
          "Cookies zijn kleine tekstbestanden die een website in uw browser plaatst. Lokale opslag werkt gelijkaardig: de website bewaart gegevens in uw browser, zodat ze er bij een volgend bezoek nog zijn. Beide technieken kunnen dienen om een website te laten werken, maar ook om surfgedrag te volgen. Wij gebruiken ze enkel voor het eerste.",
        ],
      },
      {
        heading: "Wat wij bewaren",
        paragraphs: [
          "Deze website bewaart enkel functionele gegevens in de lokale opslag van uw browser:",
          "• uw winkelmand;",
          "• uw verlanglijst, zodat u die later kunt bekijken of afdrukken;",
          "• de producten die u recent bekeken hebt.",
          "Deze gegevens blijven op uw toestel, worden niet naar ons verstuurd en worden niet gebruikt om u te volgen of te profileren. Omdat ze strikt noodzakelijk zijn voor functies die u zelf gebruikt, vragen wij hiervoor geen toestemming.",
        ],
      },
      {
        heading: "Geen statistieken, geen advertenties",
        paragraphs: [
          "Wij plaatsen geen statistische cookies of marketingcookies en werken niet met advertentienetwerken. Willen wij later statistieken bijhouden of marketingcookies gebruiken, dan vragen wij eerst uw toestemming via een duidelijke keuze op deze website, en passen wij deze pagina aan.",
        ],
      },
      {
        heading: "Gegevens wissen",
        paragraphs: [
          "U kunt de opgeslagen gegevens op elk moment wissen via de instellingen van uw browser, bij de websitegegevens of de browsegeschiedenis. Uw winkelmand, verlanglijst en recent bekeken producten zijn daarna leeg.",
        ],
      },
      {
        heading: "Externe websites",
        paragraphs: [
          "Klikt u door naar een externe website, zoals Google Maps, Facebook of Instagram, dan gelden de cookieregels van die website. Daar hebben wij geen invloed op.",
        ],
      },
    ],
  },
  {
    slug: "algemene-voorwaarden",
    title: "Algemene voorwaarden",
    intro: `Deze algemene voorwaarden gelden voor alle offertes, bestellingen en overeenkomsten van ${SITE.legalName}, in de winkel, via de webshop en bij u thuis.`,
    updated: JURIDISCH_BIJGEWERKT,
    sections: [
      {
        heading: "1. Identiteit",
        paragraphs: [
          `De winkel en deze website worden uitgebaat door ${SITE.legalName}, ${ADRES}, België (hierna ‘Brunic’). U bereikt ons op ${SITE.phone.display} en via ${SITE.email}. Ons ondernemingsnummer en onze overige bedrijfsgegevens vindt u onderaan deze pagina.`,
        ],
      },
      {
        heading: "2. Toepassing",
        paragraphs: [
          "Deze voorwaarden gelden voor elke offerte, bestelling en overeenkomst tussen Brunic en de klant, ongeacht of die in de winkel, via de webshop, per e-mail, per telefoon of bij de klant thuis tot stand komt. Met ‘consument’ bedoelen we een natuurlijke persoon die handelt voor doeleinden buiten zijn beroeps- of bedrijfsactiviteit; met ‘professionele klant’ elke andere klant, zoals een horecazaak of een zorginstelling.",
          "Afwijkingen gelden enkel als Brunic ze schriftelijk aanvaardt. Algemene voorwaarden van een professionele klant zijn niet van toepassing, tenzij Brunic ze uitdrukkelijk en schriftelijk aanvaardt. Is een bepaling nietig of niet afdwingbaar, dan blijven de andere bepalingen gelden.",
        ],
      },
      {
        heading: "3. Aanbod, prijzen en offertes",
        paragraphs: [
          "Maatwerk en producten met ‘prijs op aanvraag’ worden aangeboden via een offerte. Een offerte is gebaseerd op de maten en gegevens die bij de opmeting werden genoteerd of die de klant zelf meedeelde, en blijft geldig gedurende de termijn die erop vermeld staat. Prijzen voor consumenten zijn uitgedrukt in euro, inclusief btw. Kosten voor levering, plaatsing of andere diensten worden vooraf afzonderlijk vermeld.",
          "Wij doen ons best om producten, kleuren en structuren zo correct mogelijk weer te geven. Kleuren op een scherm, stalen en de uiteindelijke levering kunnen echter licht van elkaar verschillen, onder meer door verschillende verfbaden bij textiel. Natuurlijke materialen zoals wol, linnen en sisal kunnen kleine onregelmatigheden vertonen die eigen zijn aan het materiaal. Kennelijke vergissingen of drukfouten in het aanbod binden Brunic niet.",
        ],
      },
      {
        heading: "4. Totstandkoming van de overeenkomst",
        paragraphs: [
          "Een bestelling via de webshop is definitief zodra Brunic ze per e-mail bevestigt. Een offerte leidt tot een overeenkomst zodra de klant ze ondertekent of schriftelijk aanvaardt, bijvoorbeeld per e-mail. Bij een aankoop in de winkel komt de overeenkomst tot stand bij de ondertekening van de bestelbon of bij de betaling. Wordt er een voorschot gevraagd, dan staat dat in de offerte of op de bestelbon.",
        ],
      },
      {
        heading: "5. Maatwerk en opmeting",
        paragraphs: [
          "Bij maatwerk, zoals gordijnen, raamdecoratie, tapijt of vasttapijt op maat, werkt Brunic op basis van een opmeting. Voert Brunic de opmeting zelf uit, dan is Brunic verantwoordelijk voor die maten. Deelt de klant zelf maten mee, dan is de klant daarvoor verantwoordelijk.",
          "Maatwerk wordt speciaal voor de klant gemaakt of besteld en valt niet onder het herroepingsrecht (zie artikel 8). Annuleert de klant een overeenkomst voor maatwerk nadat die tot stand kwam, dan kan Brunic een vergoeding vragen voor de reeds gemaakte kosten en voor de materialen die al besteld of gesneden zijn, zonder afbreuk aan de rechten die de wet de consument toekent.",
        ],
      },
      {
        heading: "6. Levering en plaatsing",
        paragraphs: [
          "Leverings- en plaatsingstermijnen worden in de offerte of bij de bestelling meegedeeld. Tenzij uitdrukkelijk anders afgesproken, levert Brunic aan consumenten uiterlijk 30 dagen na het sluiten van de overeenkomst. Levert Brunic niet binnen de afgesproken termijn, dan kan de consument een redelijke bijkomende termijn geven; wordt ook die niet gehaald, dan mag de consument de overeenkomst ontbinden.",
          "De klant zorgt ervoor dat de plaats van levering en plaatsing vlot bereikbaar en vrijgemaakt is, en dat de ondergrond of de muren in de staat zijn die vooraf besproken werd. Blijkt ter plaatse dat de werken door onvoorziene omstandigheden niet kunnen worden uitgevoerd zoals voorzien, dan overlegt Brunic met de klant voor er bijkomende kosten worden gemaakt.",
          "Het risico van verlies of beschadiging gaat over op de consument zodra hij, of een door hem aangewezen derde, de goederen fysiek in bezit neemt.",
        ],
      },
      {
        heading: "7. Betaling",
        paragraphs: [
          "De klant betaalt volgens de voorwaarden in de offerte, op de factuur of bij het afrekenen. De beschikbare betaalmethoden voor online bestellingen ziet u bij het afrekenen; in de winkel kunt u ter plaatse betalen.",
          "Bij laattijdige betaling door een consument stuurt Brunic eerst een kosteloze herinnering met een betalingstermijn van ten minste 14 kalenderdagen. Pas daarna kunnen de intresten en de forfaitaire schadevergoeding worden aangerekend die Boek XIX van het Wetboek van economisch recht toelaat. Voor professionele klanten gelden de regels van de wet van 2 augustus 2002 betreffende de bestrijding van de betalingsachterstand bij handelstransacties.",
        ],
      },
      {
        heading: "8. Herroepingsrecht",
        paragraphs: [
          "Consumenten hebben bij een overeenkomst op afstand of buiten de verkoopruimte in principe een herroepingsrecht van 14 kalenderdagen. Dat recht geldt niet voor goederen die volgens de specificaties van de consument vervaardigd zijn of duidelijk voor hem gepersonaliseerd zijn (art. VI.53, 3° WER), zoals maatwerk. De volledige regeling en het modelformulier vindt u op de pagina Herroepingsrecht.",
        ],
      },
      {
        heading: "9. Eigendomsvoorbehoud",
        paragraphs: [
          "Geleverde goederen blijven eigendom van Brunic tot de volledige prijs betaald is. Het risico gaat over zoals bepaald in artikel 6.",
        ],
      },
      {
        heading: "10. Conformiteit en wettelijke garantie",
        paragraphs: [
          "De consument geniet de wettelijke garantie van twee jaar vanaf de levering voor elk gebrek aan overeenstemming dat bestaat bij de levering. De consument meldt een gebrek zo snel mogelijk en uiterlijk binnen twee maanden nadat hij het heeft vastgesteld. Hij heeft dan recht op herstelling of vervanging, tenzij dat onmogelijk of onevenredig is; in dat geval heeft hij recht op een prijsvermindering of op ontbinding van de overeenkomst, zoals de wet bepaalt.",
          "Buiten de garantie vallen normale slijtage, schade door een ongeval, gebruik of onderhoud dat niet overeenstemt met de gebruiks- en onderhoudsvoorschriften, en eigenschappen die eigen zijn aan het materiaal, zoals lichte kleurverschillen tussen stalen en levering, de natuurlijke verkleuring van textiel onder invloed van zonlicht, schaduwwerking bij velours of het pluizen van een nieuw wollen tapijt.",
          "Voor professionele klanten gelden de wettelijke regels over verborgen gebreken; zichtbare gebreken meldt de professionele klant bij de levering.",
        ],
      },
      {
        heading: "11. Aansprakelijkheid",
        paragraphs: [
          "Brunic is aansprakelijk voor schade die het rechtstreekse gevolg is van een fout bij de uitvoering van de overeenkomst. Tegenover professionele klanten is die aansprakelijkheid, behalve bij opzet of zware fout, beperkt tot het bedrag van de betrokken opdracht, en is Brunic niet aansprakelijk voor onrechtstreekse schade zoals winstderving. Niets in deze voorwaarden beperkt de rechten die de wet aan consumenten toekent.",
        ],
      },
      {
        heading: "12. Privacy",
        paragraphs: [
          "Brunic verwerkt persoonsgegevens volgens de Algemene Verordening Gegevensbescherming (AVG). Meer informatie vindt u in onze privacyverklaring.",
        ],
      },
      {
        heading: "13. Klachten en bemiddeling",
        paragraphs: [
          `Hebt u een klacht, neem dan eerst contact met ons op via ${SITE.email} of ${SITE.phone.display}; wij zoeken graag samen met u naar een oplossing. Komen we er samen niet uit, dan kan de consument zich wenden tot de Consumentenombudsdienst, Koning Albert II-laan 8 bus 1, 1000 Brussel (www.consumentenombudsdienst.be). Die onderzoekt de klacht of verwijst ze door naar de bevoegde bemiddelingsinstantie. Voor grensoverschrijdende geschillen binnen de Europese Unie kunt u ook terecht bij het Europees Consumentencentrum België.`,
        ],
      },
      {
        heading: "14. Toepasselijk recht en bevoegde rechtbank",
        paragraphs: [
          "Op alle overeenkomsten met Brunic is het Belgische recht van toepassing, zonder afbreuk aan de dwingende bescherming die een consument geniet volgens het recht van het land waar hij gewoonlijk verblijft. Geschillen behoren tot de bevoegdheid van de bevoegde rechtbanken van het gerechtelijk arrondissement Oost-Vlaanderen, onverminderd het recht van de consument om zich te wenden tot de rechter die de wet voor hem bevoegd verklaart.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacyverklaring",
    intro: `${SITE.legalName} gaat zorgvuldig om met uw persoonsgegevens. In deze verklaring leest u welke gegevens wij verwerken, waarom, hoe lang we ze bewaren en welke rechten u hebt.`,
    updated: JURIDISCH_BIJGEWERKT,
    sections: [
      {
        heading: "Wie is verantwoordelijk?",
        paragraphs: [
          `De verwerkingsverantwoordelijke is ${SITE.legalName}, ${ADRES}, België. Voor vragen over uw gegevens of om uw rechten uit te oefenen, mailt u naar ${SITE.email} of schrijft u naar het adres hierboven.`,
        ],
      },
      {
        heading: "Welke gegevens verwerken wij?",
        paragraphs: [
          "Wij verwerken enkel de gegevens die wij nodig hebben: uw naam en voornaam, uw e-mailadres, uw telefoon- of gsm-nummer, uw adres of postcode, de beschrijving van uw project en de foto’s die u zelf meestuurt, de maten die wij bij een opmeting noteren, en gegevens over uw offertes, bestellingen, leveringen en betalingen.",
          "Uw verlanglijst, winkelmand en recent bekeken producten worden enkel lokaal in uw browser bewaard. Die gegevens komen niet bij ons terecht, tenzij u ze zelf met ons deelt, bijvoorbeeld door een afgedrukte verlanglijst mee te brengen naar de winkel.",
        ],
      },
      {
        heading: "Waarvoor gebruiken wij uw gegevens?",
        paragraphs: [
          "• Om uw terugbel-, contact- of offerteaanvraag te beantwoorden en een opmeting in te plannen. Dat is nodig om op uw verzoek stappen te zetten vóór een overeenkomst.",
          "• Om uw bestelling of opdracht uit te voeren: maakwerk, levering, plaatsing, facturatie, klantendienst en de afhandeling van de wettelijke garantie. Dat is nodig voor de uitvoering van de overeenkomst.",
          "• Om te voldoen aan onze wettelijke verplichtingen, zoals de boekhoudkundige en fiscale bewaarplicht.",
          "• Om u onze nieuwsbrief te sturen, enkel als u daarvoor toestemming gaf. U kunt zich op elk moment uitschrijven via de link in de nieuwsbrief of door ons te mailen.",
          "• Om onze website veilig en goed te laten werken, op basis van ons gerechtvaardigd belang.",
          "Wij gebruiken uw gegevens niet voor geautomatiseerde besluitvorming of profilering, en wij verkopen ze nooit aan derden.",
        ],
      },
      {
        heading: "Met wie delen wij uw gegevens?",
        paragraphs: [
          "Wij werken met enkele dienstverleners die gegevens in onze opdracht verwerken. Onze webshop en de bijbehorende klantgegevens worden beheerd via Shopify. Deze website wordt gehost door een externe hostingprovider. Met deze verwerkers maken wij de nodige afspraken, zodat zij uw gegevens enkel volgens onze instructies en met passende beveiliging verwerken.",
          "Sommige van deze dienstverleners kunnen gegevens verwerken buiten de Europese Economische Ruimte. Dat gebeurt dan enkel met de waarborgen die de AVG voorschrijft, zoals een adequaatheidsbesluit van de Europese Commissie of de standaardcontractbepalingen van de Europese Commissie. Daarnaast geven wij gegevens enkel door wanneer de wet ons daartoe verplicht.",
        ],
      },
      {
        heading: "Hoe lang bewaren wij uw gegevens?",
        paragraphs: [
          "• Aanvragen zonder vervolg: tot twee jaar na ons laatste contact.",
          "• Klant- en projectgegevens, zoals maten, offertes en bestellingen: zolang dat nodig is voor de uitvoering, de wettelijke garantie en eventuele nabestellingen, en in principe tot vijf jaar na de laatste levering of plaatsing.",
          "• Facturen en boekhoudkundige stukken: zolang de wettelijke bewaartermijnen dat vereisen.",
          "• Nieuwsbrief: tot u zich uitschrijft.",
          "Daarna verwijderen of anonimiseren wij uw gegevens.",
        ],
      },
      {
        heading: "Beveiliging",
        paragraphs: [
          "Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beschermen tegen verlies, misbruik en ongeoorloofde toegang. Alleen wie de gegevens nodig heeft voor zijn werk, krijgt er toegang toe.",
        ],
      },
      {
        heading: "Uw rechten",
        paragraphs: [
          "U hebt het recht om uw gegevens in te zien, te laten verbeteren of te laten wissen. U kunt ook vragen om de verwerking te beperken, bezwaar maken tegen een verwerking op basis van ons gerechtvaardigd belang, en uw gegevens opvragen in een gangbaar formaat om ze aan een andere partij over te dragen. Gaf u toestemming, bijvoorbeeld voor de nieuwsbrief, dan kunt u die op elk moment intrekken.",
          `Stuur uw vraag naar ${SITE.email}. Wij kunnen u vragen uw identiteit te bevestigen en antwoorden u binnen één maand.`,
        ],
      },
      {
        heading: "Klacht",
        paragraphs: [
          "Bent u niet tevreden over de manier waarop wij met uw gegevens omgaan, laat het ons dan eerst weten. U hebt ook het recht om klacht in te dienen bij de Gegevensbeschermingsautoriteit, Drukpersstraat 35, 1000 Brussel (www.gegevensbeschermingsautoriteit.be).",
        ],
      },
      {
        heading: "Cookies en wijzigingen",
        paragraphs: [
          "Meer over de gegevens die in uw browser worden bewaard, leest u op onze pagina Cookies. Wij kunnen deze privacyverklaring aanpassen, bijvoorbeeld wanneer wij nieuwe diensten aanbieden. De datum van de laatste wijziging vindt u op deze pagina.",
        ],
      },
    ],
  },
  {
    slug: "herroepingsrecht",
    title: "Herroepingsrecht",
    intro:
      "Koopt u als consument op afstand of buiten onze winkel, dan kunt u in principe binnen 14 kalenderdagen afzien van de overeenkomst. Voor maatwerk geldt een wettelijke uitzondering.",
    updated: JURIDISCH_BIJGEWERKT,
    sections: [
      {
        heading: "Wanneer geldt het herroepingsrecht?",
        paragraphs: [
          `Het herroepingsrecht geldt voor consumenten die met ${SITE.legalName} een overeenkomst op afstand sluiten, zoals een bestelling via de webshop, of een overeenkomst buiten onze verkoopruimte, bijvoorbeeld een offerte die u bij u thuis ondertekent. Voor aankopen in onze winkel geldt het wettelijke herroepingsrecht niet. Deze regels volgen uit Boek VI van het Wetboek van economisch recht.`,
        ],
      },
      {
        heading: "Termijn",
        paragraphs: [
          "U kunt de overeenkomst binnen 14 kalenderdagen herroepen, zonder opgave van redenen. Bij de aankoop van goederen begint die termijn de dag nadat u, of een door u aangewezen derde die niet de vervoerder is, het goed fysiek in bezit hebt genomen. Worden meerdere goederen van één bestelling afzonderlijk geleverd, dan begint de termijn de dag na ontvangst van het laatste goed. Bij een overeenkomst voor diensten begint de termijn de dag na het sluiten van de overeenkomst.",
        ],
      },
      {
        heading: "Hoe herroept u?",
        paragraphs: [
          `Om uw herroepingsrecht uit te oefenen, laat u ons via een ondubbelzinnige verklaring weten dat u de overeenkomst herroept, bijvoorbeeld per e-mail naar ${SITE.email} of per brief aan ${SITE.legalName}, ${ADRES}. U kunt daarvoor het modelformulier hieronder gebruiken, maar dat is niet verplicht. U bent op tijd als u uw verklaring verstuurt voor de termijn van 14 dagen verstreken is.`,
        ],
      },
      {
        heading: "Gevolgen van de herroeping",
        paragraphs: [
          "Wij betalen u alle betalingen terug die wij van u ontvingen, inclusief de kosten van de standaardlevering, uiterlijk 14 dagen nadat wij uw beslissing tot herroeping ontvangen hebben. Koos u uitdrukkelijk voor een duurdere leveringswijze dan de goedkoopste standaardlevering, dan betalen wij die meerkost niet terug. Wij betalen terug met hetzelfde betaalmiddel waarmee u betaalde, tenzij u uitdrukkelijk met een ander betaalmiddel instemt; in geen geval rekenen wij u daarvoor kosten aan. Wij mogen wachten met terugbetalen tot wij de goederen terug ontvangen hebben of tot u aantoont dat u ze hebt teruggestuurd, naargelang wat het eerst gebeurt.",
          "U bezorgt de goederen onverwijld en uiterlijk 14 dagen na de mededeling van uw herroeping terug aan het adres hierboven. De rechtstreekse kosten van het terugzenden zijn voor uw rekening. Voor goederen die door hun omvang niet met de post kunnen worden teruggestuurd, spreken wij het terugbrengen of ophalen met u af. Werden zulke goederen bij een overeenkomst buiten onze winkel bij u thuis geleverd op het moment dat de overeenkomst gesloten werd, dan halen wij ze op onze kosten op.",
          "U bent enkel aansprakelijk voor de waardevermindering van de goederen die het gevolg is van een behandeling die verder gaat dan nodig om de aard, de kenmerken en de werking ervan vast te stellen.",
          "Vroeg u ons uitdrukkelijk om een dienst, zoals een plaatsing, al tijdens de herroepingstermijn uit te voeren, dan betaalt u bij herroeping een bedrag dat in verhouding staat tot wat al gepresteerd werd.",
        ],
      },
      {
        heading: "Uitzonderingen",
        paragraphs: [
          "Het herroepingsrecht geldt onder meer niet voor:",
          "• goederen die volgens uw specificaties vervaardigd zijn of duidelijk voor u gepersonaliseerd zijn (art. VI.53, 3° WER), zoals gordijnen op maat, raamdecoratie op maat, fotobehang op maat, tapijten op maat, verf die in een door u gekozen kleur aangemaakt wordt, en stof, wandbekleding of vasttapijt die op de door u gevraagde lengte of maat gesneden wordt;",
          "• diensten die volledig uitgevoerd zijn met uw uitdrukkelijke voorafgaande toestemming, nadat u erkende dat u uw herroepingsrecht verliest zodra de dienst volledig uitgevoerd is;",
          "• verzegelde goederen die om redenen van gezondheidsbescherming of hygiëne niet geschikt zijn om te worden teruggezonden en waarvan de verzegeling na de levering verbroken is.",
        ],
      },
      {
        heading: "Modelformulier voor herroeping",
        paragraphs: [
          "(Dit formulier alleen invullen en terugzenden als u de overeenkomst wilt herroepen.)",
          `— Aan ${SITE.legalName}, ${ADRES}, ${SITE.email}:`,
          "— Ik/Wij (*) deel/delen (*) u hierbij mede dat ik/wij (*) onze overeenkomst betreffende de verkoop van de volgende goederen/levering van de volgende dienst (*) herroep/herroepen (*):",
          "— Besteld op (*)/Ontvangen op (*):",
          "— Naam/Namen consument(en):",
          "— Adres consument(en):",
          "— Handtekening van consument(en) (alleen wanneer dit formulier op papier wordt ingediend):",
          "— Datum:",
          "(*) Doorhalen wat niet van toepassing is.",
        ],
      },
    ],
  },
];
