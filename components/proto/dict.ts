export type Lang = "fr" | "en"

/* Contenu bilingue du prototype. Tout le texte visible passe par ici —
   pas de chaîne en dur dans les composants.
   Règle de contenu : rien d'inventé. Chaque chiffre, date et techno
   vient du CV. Le mobilier purement graphique (code-barres, mire,
   chevrons) ne porte aucun texte et reste aria-hidden. */
const DICT = {
  role: {
    fr: "Ingénieur Full Stack & IA",
    en: "Full Stack & AI Engineer",
  },
  status: {
    fr: "En poste · France",
    en: "Employed · France",
  },
  plateLabel: {
    fr: "Unité 001 — Plaque d'identification",
    en: "Unit 001 — Identification plate",
  },
  scroll: {
    fr: "Défiler",
    en: "Scroll",
  },
  spec: {
    fr: [
      ["Désignation", "Hugo Juskowiak"],
      ["Fonction", "Ingénieur Full Stack & IA"],
      ["Base", "France"],
      ["En service", "Depuis 2022"],
      ["Domaines", "ML · Data · Systèmes distribués"],
      ["Langues", "FR · EN · ES · JP"],
    ],
    en: [
      ["Designation", "Hugo Juskowiak"],
      ["Function", "Full Stack & AI Engineer"],
      ["Base", "France"],
      ["In service", "Since 2022"],
      ["Domains", "ML · Data · Distributed systems"],
      ["Languages", "FR · EN · ES · JP"],
    ],
  },

  /* — mobilier d'affiche : la règle graduée du parcours —
       [année, lieu]. L'index rouge se pose sur la dernière entrée. */
  timeline: {
    fr: [
      ["2022", "ESTIA"],
      ["2024", "北海道"],
      ["2025", "MBDS"],
      ["2026", "UPYOURBIZZ"],
    ],
    en: [
      ["2022", "ESTIA"],
      ["2024", "HOKKAIDO"],
      ["2025", "MBDS"],
      ["2026", "UPYOURBIZZ"],
    ],
  },
  timelineLabel: {
    fr: "Parcours — 2022 / 2026",
    en: "Track record — 2022 / 2026",
  },

  /* — rails de gouttière (texte vertical) — */
  railL: {
    fr: "Hugo Juskowiak — Ingénieur Full Stack & IA — France — En service depuis 2022",
    en: "Hugo Juskowiak — Full Stack & AI Engineer — France — In service since 2022",
  },
  railR: {
    fr: "FR · EN · ES · JP — ML · Data · Systèmes distribués — REF.0043-B",
    en: "FR · EN · ES · JP — ML · Data · Distributed systems — REF.0043-B",
  },

  /* — tampon d'en-service — */
  stamp: {
    fr: "En service",
    en: "In service",
  },
  stampYear: { fr: "2022", en: "2022" },

  /* — blocs satellites — */
  featuredLabel: {
    fr: "Projet en vedette",
    en: "Featured project",
  },
  featuredName: { fr: "Prospector", en: "Prospector" },
  featuredDesc: {
    fr: "SaaS de prospection B2B multi-tenant, en marque blanche.",
    en: "Multi-tenant white-label B2B prospecting SaaS.",
  },
  featuredFigures: {
    fr: "06 étapes · 3 canaux · n modèles",
    en: "06 steps · 3 channels · n models",
  },
  offdutyLabel: {
    fr: "Hors travail",
    en: "Off duty",
  },
  offdutyName: {
    fr: "Powerlifting · Multilingue",
    en: "Powerlifting · Multilingual",
  },
  offdutyDesc: {
    fr: "Disponibilité — sur demande.",
    en: "Availability — on request.",
  },

  /* — mention légale de pied — */
  legal: {
    fr: "Planche technique — document de présentation · Hugo Juskowiak · Ingénieur Full Stack & IA · France · FR/EN/ES/JP · REF.0043-B · REV.2 · 2026",
    en: "Technical plate — presentation document · Hugo Juskowiak · Full Stack & AI Engineer · France · FR/EN/ES/JP · REF.0043-B · REV.2 · 2026",
  },
  ref: { fr: "REF.0043-B / REV.2 / 2026", en: "REF.0043-B / REV.2 / 2026" },

  /* — section tracé — */
  traceIndex: { fr: "00 — Tracé", en: "00 — Trace" },
  traceTitle: {
    fr: "Prospector — chaîne de traitement",
    en: "Prospector — processing chain",
  },
  traceNote: {
    fr: "SaaS de prospection B2B multi-tenant, en marque blanche. Six types de tâches routés vers le modèle le plus adapté.",
    en: "Multi-tenant white-label B2B prospecting SaaS. Six task types routed to the best-fitting model.",
  },
  traceUnit: { fr: "Unité 01", en: "Unit 01" },
  traceRail: {
    fr: "Unité 01 — Prospector — Chaîne de traitement — REF.0043-B / REV.2",
    en: "Unit 01 — Prospector — Processing chain — REF.0043-B / REV.2",
  },
  /* légende : [pastille, libellé]. La pastille dit l'état par la
     géométrie (rail plein / contour vide / filet), jamais par la
     seule teinte. */
  legend: {
    fr: [
      ["on", "Étape atteinte"],
      ["off", "En attente"],
      ["wire", "Lien tiré"],
      ["branch", "Dérivation"],
    ],
    en: [
      ["on", "Step reached"],
      ["off", "Pending"],
      ["wire", "Link drawn"],
      ["branch", "Branch"],
    ],
  },
  nodes: {
    fr: [
      ["01", "Collecte", "Scrapy · Playwright"],
      ["02", "Enrichissement", "Supabase"],
      ["03", "Personas", "Depuis documents"],
      ["04", "Routage", "6 tâches → n modèles"],
      ["05", "Séquençage", "Lemlist · OAuth 365"],
      ["06", "Envoi", "Mail · LinkedIn · WhatsApp"],
    ],
    en: [
      ["01", "Collect", "Scrapy · Playwright"],
      ["02", "Enrich", "Supabase"],
      ["03", "Personas", "From documents"],
      ["04", "Routing", "6 tasks → n models"],
      ["05", "Sequencing", "Lemlist · OAuth 365"],
      ["06", "Dispatch", "Mail · LinkedIn · WhatsApp"],
    ],
  },
  pool: {
    fr: ["Réservoir de modèles", "OpenRouter · coût / latence arbitrés par tâche"],
    en: ["Model pool", "OpenRouter · cost / latency arbitrated per task"],
  },
} as const

type Key = keyof typeof DICT

/* Générique sur la clé : sans ça, t() renvoie l'union de TOUTES les
   valeurs du dictionnaire, et un simple aria-label ne compile plus
   parce que certaines entrées sont des tableaux. */
export function t<K extends Key>(lang: Lang, key: K): (typeof DICT)[K][Lang] {
  // l'indexation par une union de langues n'est pas vérifiable ici :
  // le contrat est tenu par la signature, côté appelants
  return DICT[key][lang] as (typeof DICT)[K][Lang]
}
