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
       [date, lieu]. L'index rouge se pose sur la dernière entrée.
       La date PORTE LA POSITION sur l'axe, donc elle peut être
       fractionnaire : .2 = mars, .7 = septembre. Seule la partie entière
       est affichée (plaque.tsx tronque).
       Chaque étape est posée à son DÉBUT, pas à sa fin — MBDS à sept.
       2024 et non au diplôme d'oct. 2025. Mesuré : au diplôme, MBDS
       tombe à 95 % et son étiquette chevauche UPYOURBIZZ de 32px.
       Les écarts d'ici sont 320 / 112 / 96 / 112 px sur la règle de
       640px, pour des étiquettes de ~55px. Toute nouvelle entrée doit
       être re-mesurée : c'est un axe, pas une liste. */
  timeline: {
    fr: [
      ["2022", "ESTIA"],
      ["2024.2", "北海道"],
      ["2024.7", "MBDS"],
      ["2025.3", "SOPHIA"],
      ["2026", "UPYOURBIZZ"],
    ],
    en: [
      ["2022", "ESTIA"],
      ["2024.2", "HOKKAIDO"],
      ["2024.7", "MBDS"],
      ["2025.3", "SOPHIA"],
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
  /* Il n'y a PAS de légende d'états ici, et c'est délibéré : elle
     faisait doublon avec l'axe gradué pour trois marques colorées de
     plus. Décision prise avec le propriétaire — ne pas la réintroduire
     sans lui. Récupérable au commit f444a5b. */
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

  /* — planche de vues orthographiques —
       Vocabulaire de dessin technique, pas de décor : les quatre vues
       sont les trois projections normalisées plus un rendu de matière.
       Aucune référence littérale à un véhicule : l'objet est un volume
       abstrait, et c'est la MÉTHODE de représentation qui porte la
       direction. */
  ovTitle: { fr: "Planche de vues", en: "View plate" },
  ovJp: { fr: "正投影図", en: "正投影図" },
  ovIndex: { fr: "PL.04", en: "PL.04" },
  /* [repère, nom de la vue, angle de prise] */
  ovViews: {
    fr: [
      ["A", "Dessus", "Projection horizontale"],
      ["B", "Face", "Projection frontale"],
      ["C", "Profil", "Projection latérale"],
      ["D", "Matière", "Rendu — surface polie"],
    ],
    en: [
      ["A", "Top", "Horizontal projection"],
      ["B", "Front", "Frontal projection"],
      ["C", "Side", "Lateral projection"],
      ["D", "Material", "Render — polished surface"],
    ],
  },
  ovScale: { fr: "Éch. 1:1", en: "Scale 1:1" },
  ovSection: { fr: "Coupe A-A", en: "Section A-A" },
  ovNote: {
    fr: "Trois projections normalisées et un rendu de matière. Le trait continu porte l'arête vue, le tireté l'arête cachée, l'axe mixte le centre. La cote est la seule affirmation de la planche.",
    en: "Three standard projections and one material render. Continuous line carries the visible edge, dashed the hidden edge, chain-dotted the centre. The dimension is the plate's only assertion.",
  },
  ovRail: {
    fr: "Planche de vues — PL.04 — REF.0043-B / REV.2 — Éch. 1:1",
    en: "View plate — PL.04 — REF.0043-B / REV.2 — Scale 1:1",
  },

  /* — 05 TÉLÉMÉTRIE : le routeur multi-modèle —

     CE QUI VIENT DU CV, donc sûr : « intégration de plusieurs LLM via
     OpenRouter sur six types de tâches, avec optimisation du coût et
     des performances en routant chaque tâche vers le modèle le plus
     adapté ». Les six domaines listés ci-dessous sont tous traçables au
     CV (extraction depuis documents, personas, séquençage multicanal,
     chatbot agentique, rapports Octo).

     À CONFIRMER AVEC LE PROPRIÉTAIRE — le découpage exact des six types
     de tâches, et surtout le PALIER attribué à chacun. C'est une carte
     de routage, pas un relevé : aucun chiffre de coût ni de latence
     n'est affiché, précisément parce qu'on ne les a pas mesurés. Ne pas
     ajouter de chiffres ici sans les tenir de lui.

     [repère, nom, précision, palier 0|1|2] */
  telIndex: { fr: "05 — Télémétrie", en: "05 — Telemetry" },
  telTitle: { fr: "Routage multi-modèle", en: "Multi-model routing" },
  telJp: { fr: "テレメトリ", en: "テレメトリ" },
  telNote: {
    fr: "Six types de tâches, un parc de modèles, une règle : prendre le moins cher qui tient la tâche. Le palier n'est pas un réglage de confort, c'est la facture.",
    en: "Six task types, one model pool, one rule: take the cheapest that holds the task. The tier is not a comfort setting, it is the invoice.",
  },
  telRead: {
    fr: "Chaque voie monte jusqu'au palier qu'elle exige. Une seule atteint le palier lourd — c'est là que passe le coût, et c'est la seule qui mérite de le coûter.",
    en: "Each channel rises to the tier it demands. Only one reaches the heavy tier — that is where the cost goes, and the only one worth it.",
  },
  telTiers: {
    fr: [
      ["Haiku", "Économique"],
      ["Sonnet", "Courant"],
      ["Opus", "Lourd"],
    ],
    en: [
      ["Haiku", "Economy"],
      ["Sonnet", "Standard"],
      ["Opus", "Heavy"],
    ],
  },
  telVoies: {
    fr: [
      ["01", "Extraction", "Depuis documents", "0"],
      ["02", "Classification", "Tri des retours", "0"],
      ["03", "Personas", "Synthèse de cible", "1"],
      ["04", "Rédaction", "Séquences multicanal", "1"],
      ["05", "Conversation", "Chatbot agentique", "1"],
      ["06", "Rapport", "Segmentation DMS", "2"],
    ],
    en: [
      ["01", "Extraction", "From documents", "0"],
      ["02", "Classification", "Reply triage", "0"],
      ["03", "Personas", "Target synthesis", "1"],
      ["04", "Drafting", "Multichannel sequences", "1"],
      ["05", "Conversation", "Agentic chatbot", "1"],
      ["06", "Report", "DMS segmentation", "2"],
    ],
  },
  telCols: {
    fr: ["Voie", "Tâche", "Palier", "Pourquoi ce palier"],
    en: ["Channel", "Task", "Tier", "Why this tier"],
  },
  telWhy: {
    fr: [
      "Structure connue, sortie contrainte.",
      "Décision binaire, volume élevé.",
      "Synthèse ouverte à partir de sources hétérogènes.",
      "La qualité du texte est le produit.",
      "Multi-tours, l'état de session doit tenir.",
      "Contexte long, agrégation, chiffres à ne pas inventer.",
    ],
    en: [
      "Known structure, constrained output.",
      "Binary decision, high volume.",
      "Open synthesis from heterogeneous sources.",
      "Text quality is the product.",
      "Multi-turn, session state must hold.",
      "Long context, aggregation, figures that must not be invented.",
    ],
  },
  telRail: {
    fr: "Unité 05 — Télémétrie — Routage multi-modèle — OpenRouter — REF.0043-B / REV.2",
    en: "Unit 05 — Telemetry — Multi-model routing — OpenRouter — REF.0043-B / REV.2",
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
