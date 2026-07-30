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
  /* Feuille 01. Le « 00 » d'origine contredisait `traceUnit` qui a
     toujours dit « Unité 01 » — l'index et l'unité sont maintenant le
     même nombre. Voir idxFeuilles pour la numérotation du jeu. */
  traceIndex: { fr: "01 — Tracé", en: "01 — Trace" },
  traceTitle: {
    fr: "Prospector — chaîne de traitement",
    en: "Prospector — processing chain",
  },
  traceNote: {
    fr: "SaaS de prospection B2B multi-tenant, en marque blanche. Six types de tâches routés vers le modèle le plus adapté.",
    en: "Multi-tenant white-label B2B prospecting SaaS. Six task types routed to the best-fitting model.",
  },
  traceUnit: { fr: "Unité 01", en: "Unit 01" },
  /* Le compteur d'étapes doit être NOMMÉ : sans libellé il s'affichait
     « 01 / 06 — 01 — Tracé » et les deux nombres se lisaient comme un
     seul. Un compteur d'avancement et un numéro de feuille ne sont pas
     la même grandeur. */
  traceEtape: { fr: "Étape", en: "Step" },
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
  ovIndex: { fr: "03", en: "03" },
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
    fr: "Unité 03 — Planche de vues — REF.0043-B / REV.2 — Éch. 1:1",
    en: "Unit 03 — View plate — REF.0043-B / REV.2 — Scale 1:1",
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
  telIndex: { fr: "02 — Télémétrie", en: "02 — Telemetry" },
  telNum: { fr: "02", en: "02" },
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
    fr: "Unité 02 — Télémétrie — Routage multi-modèle — OpenRouter — REF.0043-B / REV.2",
    en: "Unit 02 — Telemetry — Multi-model routing — OpenRouter — REF.0043-B / REV.2",
  },

  /* — 06 RÉVISIONS : le parcours en cartouche de révisions —

     TOUT VIENT DU CV, y compris les dates au mois. Rien n'est arrondi,
     rien n'est ajouté. Les villes ne sont mentionnées que là où le CV
     les donne : il les donne pour les emplois, pas pour les écoles.

     La colonne ZONE est la seule invention, et elle est structurelle :
     un cartouche de révisions porte toujours la zone du plan touchée
     par la modification. Si la machine est l'ingénieur, chaque étape
     révise une zone de la machine. C'est ce qui transforme une liste
     de lignes de CV en historique d'un objet qui se construit.

     [n°, zone, période, organisme, fonction, modification] */
  revIndex: { fr: "04 — Révisions", en: "04 — Revisions" },
  revTitle: { fr: "Historique de l'unité", en: "Unit history" },
  revJp: { fr: "改訂履歴", en: "改訂履歴" },
  revNote: {
    fr: "Huit révisions depuis la mise en fabrication. Chacune touche une zone et une seule — c'est ce qui distingue une machine d'un empilement.",
    en: "Eight revisions since first build. Each touches one zone and one only — that is what separates a machine from a pile.",
  },
  revCols: {
    fr: ["Rév", "Zone", "Période", "Modification"],
    en: ["Rev", "Zone", "Period", "Change"],
  },
  revEnCours: { fr: "En cours", en: "Current" },
  revEntrees: {
    fr: [
      ["01", "Socle", "2020.09 → 2022.06", "Lycée Touchard-Washington", "Classe préparatoire TSI",
        "Mise en fabrication. Mathématiques, physique, sciences de l'ingénieur."],
      ["02", "Atelier", "2022.07 → 2022.08", "Legrand · Le Mans", "Opérateur industriel",
        "Assemblage sur chaîne, tri de produits retournés pour recyclage, appui aux stocks. La machine passe par l'atelier avant le bureau d'études."],
      ["03", "Structure", "2022.09 → 2025.10", "ESTIA", "Master d'ingénieur trilingue",
        "Cycle ingénieur. Trois langues de travail."],
      ["04", "Interface", "2023.02 → 2023.07", "The Guill Corp · Anglet", "Stagiaire ingénieur développement logiciel",
        "Première mise en service logicielle : interface de gestion des données de programmation d'usinage (Python/Flask, JavaScript/jQuery, Ajax, SQL). Front-end et design appris en autonomie."],
      ["05", "Étalonnage", "2024.03 → 2024.08", "Imperial University of Hokkaido · Japon", "Semestre d'échange",
        "Information & Ingénierie. Un semestre à travailler dans une autre norme."],
      ["06", "Calcul", "2024.09 → 2025.10", "Université Côte d'Azur", "Master en Data Science — MBDS MIAGE",
        "Ajout du module data : modèles, pipelines, mise en production."],
      ["07", "Mesure", "2025.04 → 2025.09", "Sophia Genetics · Bidart", "Stagiaire ingénieur développement logiciel",
        "Machine learning en production : prédiction de l'usage mémoire par tâche sur pipelines bio-informatiques (XGBoost, LightGBM, CatBoost, Random Forest). Pipelines ETL, allocation de ressources en calcul distribué, CI/CD GitLab."],
      ["08", "Commande", "2026.05 → présent", "UpYourBizz", "Ingénieur Full Stack & IA",
        "Prospector : SaaS de prospection B2B multi-tenant en marque blanche, routage multi-modèle sur six types de tâches, orchestration de campagnes. Octo : segmentation d'exports DMS pour concessionnaires."],
    ],
    en: [
      ["01", "Base", "2020.09 → 2022.06", "Lycée Touchard-Washington", "TSI preparatory class",
        "First build. Mathematics, physics, engineering science."],
      ["02", "Shop floor", "2022.07 → 2022.08", "Legrand · Le Mans", "Industrial operator",
        "Production line assembly, sorting returns for recycling, stock support. The machine goes through the shop floor before the drawing office."],
      ["03", "Structure", "2022.09 → 2025.10", "ESTIA", "Trilingual engineering master's",
        "Engineering cycle. Three working languages."],
      ["04", "Interface", "2023.02 → 2023.07", "The Guill Corp · Anglet", "Software engineering intern",
        "First software commissioning: machining programme data management interface (Python/Flask, JavaScript/jQuery, Ajax, SQL). Front-end and design self-taught."],
      ["05", "Calibration", "2024.03 → 2024.08", "Imperial University of Hokkaido · Japan", "Exchange semester",
        "Information & Engineering. One semester working to another standard."],
      ["06", "Compute", "2024.09 → 2025.10", "Université Côte d'Azur", "MSc Data Science — MBDS MIAGE",
        "Data module added: models, pipelines, production."],
      ["07", "Measurement", "2025.04 → 2025.09", "Sophia Genetics · Bidart", "Software engineering intern",
        "Machine learning in production: per-task memory usage prediction on bioinformatics pipelines (XGBoost, LightGBM, CatBoost, Random Forest). ETL pipelines, distributed compute resource allocation, GitLab CI/CD."],
      ["08", "Control", "2026.05 → present", "UpYourBizz", "Full Stack & AI Engineer",
        "Prospector: multi-tenant white-label B2B prospecting SaaS, multi-model routing across six task types, campaign orchestration. Octo: DMS export segmentation for car dealers."],
    ],
  },
  revRail: {
    fr: "Unité 04 — Historique de révisions — 01 à 08 — REF.0043-B / REV.2",
    en: "Unit 04 — Revision history — 01 to 08 — REF.0043-B / REV.2",
  },

  /* ================================================================
     NUMÉROTATION DES FEUILLES — source unique.
     Un jeu de plans est numéroté SANS TROU : une feuille manquante est
     une feuille perdue, pas une feuille réservée. L'ordre ci-dessous
     est celui de la page, et l'index 00 le récite.
     Il raconte : le travail d'abord (01, 02), la machine comme objet
     ensuite (03, la respiration), puis l'histoire, les capacités,
     l'humain, et le cartouche qui ferme le document.
     ================================================================ */
  idxIndex: { fr: "00 — Index", en: "00 — Index" },
  idxTitle: { fr: "Nomenclature des feuilles", en: "Sheet index" },
  idxJp: { fr: "図面目録", en: "図面目録" },
  idxNote: {
    fr: "Huit feuilles. Le document se lit dans l'ordre, mais chaque feuille se tient seule — c'est la différence entre un plan et un récit.",
    en: "Eight sheets. The document reads in order, but each sheet stands alone — that is the difference between a drawing and a story.",
  },
  /* [numéro, ancre, titre, objet de la feuille] */
  idxFeuilles: {
    fr: [
      ["01", "trace", "Tracé", "Prospector — chaîne de traitement, six étapes"],
      ["02", "telemetrie", "Télémétrie", "Routage multi-modèle — l'arbitrage du coût"],
      ["03", "vues", "Vues", "Projections orthographiques et rendu de matière"],
      ["04", "revisions", "Révisions", "Historique de l'unité — huit révisions"],
      ["05", "specifications", "Spécifications", "Caractéristiques et classes"],
      ["06", "operateur", "Opérateur", "Conditions d'emploi"],
      ["07", "contact", "Cartouche", "Références et prise de contact"],
    ],
    en: [
      ["01", "trace", "Trace", "Prospector — processing chain, six steps"],
      ["02", "telemetrie", "Telemetry", "Multi-model routing — the cost arbitrage"],
      ["03", "vues", "Views", "Orthographic projections and material render"],
      ["04", "revisions", "Revisions", "Unit history — eight revisions"],
      ["05", "specifications", "Specifications", "Characteristics and classes"],
      ["06", "operateur", "Operator", "Conditions of use"],
      ["07", "contact", "Title block", "References and contact"],
    ],
  },

  /* — 05 SPÉCIFICATIONS —
     Forme : la fiche de caractéristiques. C'est la version dépliée de
     la ligne de spécification de la plaque — même objet, plus de
     détail — donc ce n'est pas une redite, c'est un zoom.

     LA COLONNE CLASSE NE CONTIENT QUE CE QUE LE CV DÉCLARE. « Avancé »,
     « Intermédiaire », « Natif », « Courant », « B2 », « Notions » sont
     ses mots. Là où il n'annonce pas de niveau, la case reste VIDE —
     on n'invente pas une classe, et une case vide sur une fiche
     technique est une information honnête, pas un oubli.
     Surtout : PAS DE BARRES DE COMPÉTENCE. Une barre invite à comparer
     à une échelle de 100 % qui n'existe pas ; une classe écrite est ce
     qu'un dessin technique utilise, et c'est plus juste.
     [groupe, [[désignation, classe]]] */
  specIndex: { fr: "05 — Spécifications", en: "05 — Specifications" },
  specTitle: { fr: "Caractéristiques", en: "Characteristics" },
  specJp: { fr: "仕様", en: "仕様" },
  specNote: {
    fr: "Les classes sont celles que la fiche déclare. Là où aucune classe n'est déclarée, la case reste vide.",
    en: "Classes are those the sheet declares. Where none is declared, the cell stays empty.",
  },
  specCols: { fr: ["Désignation", "Classe"], en: ["Designation", "Class"] },
  specGroupes: {
    fr: [
      ["Programmation", [
        ["Python", "Avancé"], ["TypeScript / JavaScript", "Avancé"], ["SQL", "Avancé"],
        ["HTML / CSS", "Avancé"], ["Java", "Intermédiaire"], ["C / C++", "Intermédiaire"],
      ]],
      ["Frameworks & outils", [
        ["React", ""], ["React Native", ""], ["Node.js", ""], ["Flask", ""],
        ["Pandas", ""], ["Git", ""], ["GitLab CI/CD", ""],
      ]],
      ["ML, IA & data", [
        ["XGBoost", ""], ["LightGBM", ""], ["CatBoost", ""], ["Random Forest", ""],
        ["Intégration de LLM & prompt engineering", "OpenRouter"],
        ["Pipelines ETL", ""], ["Web scraping", "Scrapy · Playwright"],
      ]],
      ["Cloud & bases de données", [
        ["AWS", ""], ["Azure", ""], ["Supabase / PostgreSQL", ""],
        ["MongoDB", ""], ["ElasticSearch", ""], ["Systèmes distribués", ""],
      ]],
      ["Langues", [
        ["Français", "Natif"], ["Anglais", "Courant · IELTS 2023"],
        ["Espagnol", "B2"], ["Japonais", "Notions"],
      ]],
    ],
    en: [
      ["Programming", [
        ["Python", "Advanced"], ["TypeScript / JavaScript", "Advanced"], ["SQL", "Advanced"],
        ["HTML / CSS", "Advanced"], ["Java", "Intermediate"], ["C / C++", "Intermediate"],
      ]],
      ["Frameworks & tools", [
        ["React", ""], ["React Native", ""], ["Node.js", ""], ["Flask", ""],
        ["Pandas", ""], ["Git", ""], ["GitLab CI/CD", ""],
      ]],
      ["ML, AI & data", [
        ["XGBoost", ""], ["LightGBM", ""], ["CatBoost", ""], ["Random Forest", ""],
        ["LLM integration & prompt engineering", "OpenRouter"],
        ["ETL pipelines", ""], ["Web scraping", "Scrapy · Playwright"],
      ]],
      ["Cloud & databases", [
        ["AWS", ""], ["Azure", ""], ["Supabase / PostgreSQL", ""],
        ["MongoDB", ""], ["ElasticSearch", ""], ["Distributed systems", ""],
      ]],
      ["Languages", [
        ["French", "Native"], ["English", "Fluent · IELTS 2023"],
        ["Spanish", "B2"], ["Japanese", "Basics"],
      ]],
    ],
  },
  specRail: {
    fr: "Unité 05 — Spécifications — Caractéristiques et classes — REF.0043-B / REV.2",
    en: "Unit 05 — Specifications — Characteristics and classes — REF.0043-B / REV.2",
  },

  /* — 06 OPÉRATEUR —
     La section la plus AÉRÉE du document, et c'est structurel : cinq
     feuilles denses d'affilée fatiguent, et l'humain derrière la
     machine ne se raconte pas dans un tableau. Une respiration avant
     le cartouche.
     Tout vient du CV, y compris l'encadrement. Rien n'est enjolivé. */
  opIndex: { fr: "06 — Opérateur", en: "06 — Operator" },
  opTitle: { fr: "Conditions d'emploi", en: "Conditions of use" },
  opJp: { fr: "操作者", en: "操作者" },
  opCorps: {
    fr: "Hors service, la machine s'entraîne. Musculation et force athlétique, encadré par un champion du monde de powerlifting 2023 et un bodybuilder professionnel.",
    en: "Off duty, the machine trains. Strength training and powerlifting, coached by a 2023 powerlifting world champion and a professional bodybuilder.",
  },
  opChute: {
    fr: "Trois programmes de force conçus pour des pratiquants intermédiaires. Un programme d'entraînement est une spécification : une charge, une progression, une tolérance — et quelqu'un qui doit pouvoir l'exécuter sans vous.",
    en: "Three strength programmes written for intermediate lifters. A training programme is a specification: a load, a progression, a tolerance — and someone who has to run it without you.",
  },
  opChamps: {
    fr: [
      ["Qualification", "Musculation & force athlétique"],
      ["Encadrement", "Champion du monde de powerlifting 2023 · Bodybuilder professionnel"],
      ["Production", "3 programmes de force — pratiquants intermédiaires"],
      ["Langues de travail", "FR · EN · ES · JP"],
    ],
    en: [
      ["Qualification", "Strength training & powerlifting"],
      ["Coaching", "2023 powerlifting world champion · Professional bodybuilder"],
      ["Output", "3 strength programmes — intermediate lifters"],
      ["Working languages", "FR · EN · ES · JP"],
    ],
  },
  opRail: {
    fr: "Unité 06 — Opérateur — Conditions d'emploi — REF.0043-B / REV.2",
    en: "Unit 06 — Operator — Conditions of use — REF.0043-B / REV.2",
  },

  /* — 07 CONTACT : LE CARTOUCHE —
     Tout dessin technique se termine par son cartouche : le bloc qui
     porte le titre, l'échelle, la date, la référence et le nom du
     dessinateur. C'est LA forme juste pour une page de contact ici —
     le document ne s'arrête pas, il se signe.

     Contacts alignés sur ce que le site de production expose déjà :
     e-mail et LinkedIn. Le CV porte aussi un numéro de téléphone ;
     il n'est PAS repris — publier un numéro sur une page ouverte est
     une décision qui appartient au propriétaire, pas au document. */
  ctIndex: { fr: "07 — Cartouche", en: "07 — Title block" },
  ctTitle: { fr: "Prise de contact", en: "Get in touch" },
  ctJp: { fr: "表題欄", en: "表題欄" },
  ctAccroche: {
    fr: "Le document s'arrête ici. La machine, non.",
    en: "The document ends here. The machine does not.",
  },
  ctChamps: {
    fr: [
      ["Titre", "Portfolio — planche technique"],
      ["Dessiné par", "Hugo Juskowiak"],
      ["Fonction", "Ingénieur Full Stack & IA"],
      ["Base", "France"],
      ["Échelle", "1:1"],
      ["Référence", "REF.0043-B / REV.2"],
      ["Date", "2026"],
      ["Feuilles", "00 à 07"],
    ],
    en: [
      ["Title", "Portfolio — technical plate"],
      ["Drawn by", "Hugo Juskowiak"],
      ["Function", "Full Stack & AI Engineer"],
      ["Base", "France"],
      ["Scale", "1:1"],
      ["Reference", "REF.0043-B / REV.2"],
      ["Date", "2026"],
      ["Sheets", "00 to 07"],
    ],
  },
  ctLiens: {
    fr: [
      ["E-mail", "hugo.jskpro@outlook.fr", "mailto:hugo.jskpro@outlook.fr"],
      ["LinkedIn", "linkedin.com/in/hugo-juskowiak", "https://www.linkedin.com/in/hugo-juskowiak/"],
      ["Dossier", "CV — format PDF", "/CV_Hugo_JUSKOWIAK_1.0.pdf"],
    ],
    en: [
      ["Email", "hugo.jskpro@outlook.fr", "mailto:hugo.jskpro@outlook.fr"],
      ["LinkedIn", "linkedin.com/in/hugo-juskowiak", "https://www.linkedin.com/in/hugo-juskowiak/"],
      ["File", "Résumé — PDF", "/CV_Hugo_JUSKOWIAK_1.0.pdf"],
    ],
  },
  ctRail: {
    fr: "Unité 07 — Cartouche — Fin du document — REF.0043-B / REV.2",
    en: "Unit 07 — Title block — End of document — REF.0043-B / REV.2",
  },

  /* — libellés des fiches d'unité (/work/[slug]) —
     Le contenu des fiches vit dans projets.ts : ce sont des
     enregistrements, pas des chaînes. Ici ne restent que les
     étiquettes du gabarit. */
  fpRetour: { fr: "Document", en: "Document" },
  fpRetourDocument: { fr: "Retour au document", en: "Back to the document" },
  fpFiche: { fr: "Fiche d'unité", en: "Unit file" },
  fpCadre: { fr: "Cadre", en: "Context" },
  fpPeriode: { fr: "Période", en: "Period" },
  fpEtat: { fr: "État", en: "Status" },
  fpContexte: { fr: "Contexte", en: "Background" },
  fpContraintes: { fr: "Contraintes", en: "Constraints" },
  fpDecisions: { fr: "Décisions techniques", en: "Technical decisions" },
  fpResultat: { fr: "Résultat", en: "Outcome" },
  fpParc: { fr: "Parc", en: "Stack" },

  /* Annexes de l'index : les fiches d'unité ne sont pas des feuilles du
     jeu, ce sont des pièces détachées — d'où un bloc distinct et une
     référence en U-0n. */
  idxAnnexes: { fr: "Annexes — fiches d'unité", en: "Annexes — unit files" },
  idxAnnexesNote: {
    fr: "Cinq sous-ensembles documentés séparément : contexte, contraintes, décisions.",
    en: "Five sub-assemblies documented separately: background, constraints, decisions.",
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
