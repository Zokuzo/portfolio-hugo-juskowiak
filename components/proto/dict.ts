export type Lang = "fr" | "en"

/* LE CODE NE SE TRADUIT PAS. Cet extrait est du source : il n'en
   existe qu'une version, donc les deux langues rendent le MÊME
   tableau — dupliquer les lignes serait ouvrir la porte à deux codes
   qui divergent. Seules la source et la note changent de langue.
   [numéro de ligne, texte, marque] ; marque « c » = commentaire
   (--g-500), « ! » = ligne mise en évidence (rail + --paper).
   Relevé le 2026-08-06 dans `/home/hjuskowiak/PP/Eternal/index.html`,
   HEAD `acfe5b8` ; aucune ligne montrée n'est tronquée, la ligne « ⋯ »
   est une ÉLISION. Elle est déclarée aux DEUX publics : « ⋯ » pour
   l'œil, et un relais `sr-only` posé par `CodeAnnote` pour le lecteur
   d'écran — le marqueur vit dans la colonne des numéros, qui est
   aria-hidden, donc sans ce relais l'extrait s'entendrait contigu. */
const CODE_PONT = [
  ["3729", "/* Pont lecture seule pour le monde 3D (monde.html, même origine) :", "c"],
  ["3730", "   des dérivés calculés, jamais l'état brut ni de mutation. */", "c"],
  ["3731", "window.__eternal = {", "!"],
  ["3732", "  solde:     () => eclatsSolde(),", ""],
  ["3733", "  xp:        () => xpTotal(),", ""],
  ["⋯", "", ""],
  ["3757", "  shopDo:  (action, arg) => actionRPG({ dataset:{ action, item:arg, slot:arg } }),  // réutilise le vrai chemin d'achat/équip", ""],
  ["3758", "};", "!"],
] as const

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
  /* l'interrupteur de thème (#13) — le jumeau du langtoggle */
  themeLabel: {
    fr: "Thème / Theme",
    en: "Thème / Theme",
  },
  themeSombre: {
    fr: "NUIT",
    en: "DARK",
  },
  themeClair: {
    fr: "JOUR",
    en: "LIGHT",
  },
  /* L'expérience GT86 (#27) — aucune chaîne en dur dans la surcouche, la
     doctrine de la spec veut que TOUT le texte de l'expérience soit du DOM
     bilingue en overlay, jamais porté par la 3D. */
  gt86Chantier: { fr: "COQUILLE #27", en: "SHELL #27" },
  gt86Demarrer: {
    fr: "Cliquez pour démarrer",
    en: "Click to start",
  },
  gt86EnRoute: { fr: "en route…", en: "on the way…" },
  gt86Gps: { fr: "GPS", en: "GPS" },
  gt86Musiques: { fr: "Musiques", en: "Music" },
  gt86Maison: { fr: "Maison", en: "Home" },
  gt86Travail: { fr: "Travail", en: "Work" },
  gt86Partir: { fr: "Départ", en: "Go" },
  gt86Passer: { fr: "passer l'intro", en: "skip intro" },
  gt86Retour: { fr: "retour", en: "back" },
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
  featuredName: { fr: "Reach-Up", en: "Reach-Up" },
  featuredDesc: {
    fr: "SaaS de prospection B2B multi-tenant, en marque blanche.",
    en: "Multi-tenant white-label B2B prospecting SaaS.",
  },
  /* Recalé par la revue (issue #7) : « 06 étapes » citait la chaîne
     de l'ancien Prospector, disparue de la feuille 01 ; le code du
     produit déclare sept types de tâches et quatre canaux. */
  featuredFigures: {
    fr: "07 types de tâches · 4 canaux · n modèles",
    en: "07 task types · 4 channels · n models",
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

  /* — mention légale de pied —
     Le crédit du modèle 3D n'est pas décoratif : la McLaren P1 de la
     séquence est sous CC BY-NC-SA 4.0, qui EXIGE de nommer l'auteur
     partout où l'œuvre est partagée. L'attribution complète, avec les
     liens, vit dans public/voiture/CREDIT.txt — une ligne de pied ne
     peut pas porter trois URL sans se saborder. */
  legal: {
    fr: "Planche technique — document de présentation · Hugo Juskowiak · Ingénieur Full Stack & IA · France · FR/EN/ES/JP · REF.0043-B · REV.2 · 2026 · Modèle 3D McLaren P1 : bohmerang — CC BY-NC-SA 4.0",
    en: "Technical plate — presentation document · Hugo Juskowiak · Full Stack & AI Engineer · France · FR/EN/ES/JP · REF.0043-B · REV.2 · 2026 · McLaren P1 3D model: bohmerang — CC BY-NC-SA 4.0",
  },
  ref: { fr: "REF.0043-B / REV.2 / 2026", en: "REF.0043-B / REV.2 / 2026" },

  /* — section tracé — */
  /* — 01 MÉTHODE —
     Cette feuille décrivait la chaîne de Reach-Up (alors nommé
     Prospector). Elle décrit maintenant la MANIÈRE DE TRAVAILLER :
     Reach-Up est un projet, il a sa fiche ; ce qu'un recruteur ne peut
     pas déduire d'une liste de projets, c'est comment on s'y prend.

     À CONFIRMER AVEC LE PROPRIÉTAIRE. Les six étapes ne sont pas
     inventées, elles sont DÉDUITES de ce que le CV démontre : router
     chaque tâche vers le modèle le moins cher qui la tient (on arbitre
     avant de dépenser), prédire l'usage mémoire pour éviter les échecs
     (on mesure avant d'allouer), apprendre le front-end en autonomie,
     construire une bibliothèque de composants interne (on factorise),
     convertir le code généré par IA en leçons (on refuse de livrer ce
     qu'on ne comprend pas). Si la formulation ne lui ressemble pas,
     c'est ici qu'on la corrige — un seul endroit. */
  traceIndex: { fr: "01 — Méthode", en: "01 — Method" },
  traceNum: { fr: "01", en: "01" },
  traceTitle: {
    fr: "Manière de travailler",
    en: "How I work",
  },
  traceNote: {
    fr: "Six étapes, dans cet ordre. Celle du milieu est la seule qui coûte du temps sans produire de code — c'est aussi la seule qui empêche d'en écrire pour rien.",
    en: "Six steps, in this order. The middle one is the only one that costs time without producing code — and the only one that stops you writing code for nothing.",
  },
  traceUnit: { fr: "Unité 01", en: "Unit 01" },
  /* Le compteur d'étapes doit être NOMMÉ : sans libellé il s'affichait
     « 01 / 06 — 01 — Tracé » et les deux nombres se lisaient comme un
     seul. Un compteur d'avancement et un numéro de feuille ne sont pas
     la même grandeur. */
  traceEtape: { fr: "Étape", en: "Step" },
  traceRail: {
    fr: "Unité 01 — Méthode — Manière de travailler — REF.0043-B / REV.2",
    en: "Unit 01 — Method — How I work — REF.0043-B / REV.2",
  },
  traceJp: { fr: "仕事の進め方", en: "仕事の進め方" },
  /* Il n'y a PAS de légende d'états ici, et c'est délibéré : elle
     faisait doublon avec l'axe gradué pour trois marques colorées de
     plus. Décision prise avec le propriétaire — ne pas la réintroduire
     sans lui. Récupérable au commit f444a5b. */
  nodes: {
    fr: [
      ["01", "Comprendre", "Le problème avant l'outil"],
      ["02", "Cadrer", "Contraintes, budget, périmètre"],
      ["03", "Prototyper", "La version la plus courte qui prouve"],
      ["04", "Mesurer", "Ce qui n'est pas mesuré n'est pas su"],
      ["05", "Livrer", "En production, pas en démo"],
      ["06", "Itérer", "La suite sort de l'usage"],
    ],
    en: [
      ["01", "Understand", "The problem before the tool"],
      ["02", "Frame", "Constraints, budget, scope"],
      ["03", "Prototype", "The shortest version that proves it"],
      ["04", "Measure", "What isn't measured isn't known"],
      ["05", "Ship", "To production, not to a demo"],
      ["06", "Iterate", "What comes next comes from use"],
    ],
  },
  /* La dérivation part de MESURER : c'est l'étape qui a un outillage
     propre, et la seule dont on peut être tenté de se passer. */
  pool: {
    fr: ["Banc de mesure", "On ne règle pas ce qu'on n'a pas instrumenté"],
    en: ["Measurement bench", "You cannot tune what you never instrumented"],
  },
  poolMark: { fr: "Banc", en: "Bench" },
  poolChips: {
    fr: ["profilage", "tests", "journaux"],
    en: ["profiling", "tests", "logs"],
  },

  /* — planche de vues orthographiques —
       Vocabulaire de dessin technique, pas de décor : les quatre vues
       sont les trois projections normalisées plus un rendu de matière.
       Aucune référence littérale à un véhicule : l'objet est un volume
       abstrait, et c'est la MÉTHODE de représentation qui porte la
       direction. */
  ovTitle: { fr: "Planche de vues", en: "View plate" },
  ovJp: { fr: "正投影図", en: "正投影図" },
  ovIndex: { fr: "06", en: "06" },
  ovNum: { fr: "06", en: "06" },
  ovLigne: { fr: "06 — Vues", en: "06 — Views" },
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
    fr: "Unité 06 — Planche de vues — REF.0043-B / REV.2 — Éch. 1:1",
    en: "Unit 06 — View plate — REF.0043-B / REV.2 — Scale 1:1",
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
  telNum: { fr: "05", en: "05" },
  telTitle: { fr: "Routage multi-modèle", en: "Multi-model routing" },
  telJp: { fr: "テレメトリ", en: "テレメトリ" },
  /* « Six voies » et non « six types de tâches » : la feuille décrit
     SON tableau — six voies affichées dessous — pas le schéma du
     produit, qui en déclare sept (revue, issue #7). */
  telNote: {
    fr: "Six voies, un parc de modèles, une règle : le palier le plus bas qui tient la tâche. Le palier n'est pas un réglage de confort, c'est la facture.",
    en: "Six channels, one model pool, one rule: the lowest tier that holds the task. The tier is not a comfort setting, it is the invoice.",
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
      ["05", "Conversation", "Assistant agentique", "1"],
      ["06", "Rapport", "Segmentation DMS", "2"],
    ],
    en: [
      ["01", "Extraction", "From documents", "0"],
      ["02", "Classification", "Reply triage", "0"],
      ["03", "Personas", "Target synthesis", "1"],
      ["04", "Drafting", "Multichannel sequences", "1"],
      ["05", "Conversation", "Agentic assistant", "1"],
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

  /* — 02 EXPÉRIENCE : les projets, groupés par employeur —
     Le contenu vit dans parcours.ts : ce sont des enregistrements
     imbriqués, pas des chaînes. Ici, les étiquettes du gabarit. */
  xpIndex: { fr: "02 — Expérience", en: "02 — Experience" },
  xpNum: { fr: "02", en: "02" },
  xpTitle: { fr: "Là où j'ai travaillé", en: "Where I have worked" },
  xpJp: { fr: "職務経歴", en: "職務経歴" },
  /* La thèse précédente — « une même base technique » — est morte
     contre le code (issue #7) : zéro fichier commun entre les dépôts
     comparés. Ce qui est vrai, et plus intéressant : une manière de
     faire commune, et la contrainte que les produits se parlent. */
  xpNote: {
    fr: "Groupés par employeur et non par projet : quatre produits d'une même maison ne partagent pas un socle de code, ils partagent une manière de faire — et une contrainte d'architecture réelle, se parler entre eux.",
    en: "Grouped by employer rather than by project: four products from one house share no common codebase — they share a way of building, and one real architectural constraint: talking to each other.",
  },
  xpEnCours: { fr: "En poste", en: "Current" },
  xpSchema: { fr: "Arborescence", en: "Tree" },
  xpFiche: { fr: "Fiche détaillée", en: "Detailed file" },
  xpRail: {
    fr: "Unité 02 — Expérience — Projets par employeur — REF.0043-B / REV.2",
    en: "Unit 02 — Experience — Projects by employer — REF.0043-B / REV.2",
  },

  /* — 03 ÉTUDES : le parcours en rails parallèles — */
  etuIndex: { fr: "03 — Études", en: "03 — Studies" },
  etuNum: { fr: "03", en: "03" },
  etuTitle: { fr: "Deux rails en parallèle", en: "Two rails in parallel" },
  etuJp: { fr: "学歴", en: "学歴" },
  etuNote: {
    fr: "Un double diplôme n'est pas deux diplômes : ce sont deux cursus menés en même temps. Écrit en liste, ça se lit l'un après l'autre et l'information disparaît.",
    en: "A double degree is not two degrees: it is two courses run at the same time. Written as a list, they read one after the other and the information is lost.",
  },
  etuDouble: { fr: "Double diplôme — 13 mois", en: "Double degree — 13 months" },
  etuRail: {
    fr: "Unité 03 — Études — ESTIA · MBDS · Hokkaido — REF.0043-B / REV.2",
    en: "Unit 03 — Studies — ESTIA · MBDS · Hokkaido — REF.0043-B / REV.2",
  },

  /* — 04 ATELIER : les projets personnels — */
  atIndex: { fr: "04 — Atelier", en: "04 — Workshop" },
  atNum: { fr: "04", en: "04" },
  atTitle: { fr: "Ce que je construis à côté", en: "What I build on the side" },
  atJp: { fr: "個人制作", en: "個人制作" },
  atNote: {
    fr: "Quatre projets, quatre formes différentes. Un cycle, une convergence avec vanne, un empilement, un tuyau — c'est la forme qui dit ce que le projet est.",
    en: "Four projects, four different shapes. A cycle, a convergence with a valve, a stack, a pipe — the shape says what the project is.",
  },
  atPrive: { fr: "Dépôt privé", en: "Private repository" },
  atRail: {
    fr: "Unité 04 — Atelier — Projets personnels — REF.0043-B / REV.2",
    en: "Unit 04 — Workshop — Personal projects — REF.0043-B / REV.2",
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
  idxNum: { fr: "00", en: "00" },
  idxTitle: { fr: "Nomenclature des feuilles", en: "Sheet index" },
  idxJp: { fr: "図面目録", en: "図面目録" },
  idxNote: {
    fr: "Dix feuilles. Le document se lit dans l'ordre, mais chaque feuille se tient seule — c'est la différence entre un plan et un récit.",
    en: "Ten sheets. The document reads in order, but each sheet stands alone — that is the difference between a drawing and a story.",
  },
  /* [numéro, ancre, titre, objet de la feuille] */
  idxFeuilles: {
    fr: [
      ["01", "trace", "Méthode", "Manière de travailler — six étapes"],
      ["02", "experience", "Expérience", "UpYourBizz · Sophia Genetics · Guill Corp · Legrand"],
      ["03", "etudes", "Études", "ESTIA · double diplôme MBDS · Hokkaido"],
      ["04", "atelier", "Atelier", "Eternal · Trading Agent · La Provence · bot"],
      ["05", "telemetrie", "Télémétrie", "Routage multi-modèle — l'arbitrage du coût"],
      ["06", "vues", "Vues", "Projections orthographiques et rendu de matière"],
      ["07", "specifications", "Spécifications", "Caractéristiques et classes"],
      ["08", "profil", "Profil", "Hors travail"],
      ["09", "contact", "Contact", "Références et prise de contact"],
    ],
    en: [
      ["01", "trace", "Method", "How I work — six steps"],
      ["02", "experience", "Experience", "UpYourBizz · Sophia Genetics · Guill Corp · Legrand"],
      ["03", "etudes", "Studies", "ESTIA · MBDS double degree · Hokkaido"],
      ["04", "atelier", "Workshop", "Eternal · Trading Agent · La Provence · bot"],
      ["05", "telemetrie", "Telemetry", "Multi-model routing — the cost arbitrage"],
      ["06", "vues", "Views", "Orthographic projections and material render"],
      ["07", "specifications", "Specifications", "Characteristics and classes"],
      ["08", "profil", "Profile", "Off duty"],
      ["09", "contact", "Contact", "References and contact"],
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
  specIndex: { fr: "07 — Spécifications", en: "07 — Specifications" },
  specNum: { fr: "07", en: "07" },
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
        ["Pipelines ETL", ""], ["Web scraping", "Scrapy"],
      ]],
      ["Cloud & bases de données", [
        ["AWS", ""], ["Azure", ""], ["Supabase / PostgreSQL", ""],
        ["MongoDB", ""], ["ElasticSearch", ""], ["Systèmes distribués", ""],
      ]],
      /* Ce groupe ne vient pas du CV : déclaré par le propriétaire et
         relevé sur sa machine le 2026-08-10 (issue #3). La colonne
         Classe porte le nom de l'outil, comme « OpenRouter » plus
         haut — jamais un niveau inventé. Hyprland n'y est pas : c'est
         un projet, pas un fait. */
      ["Systèmes & environnement", [
        ["Linux", "Ubuntu"], ["Terminal & shell", "kitty · bash"],
        ["Gestion de paquets", "apt"],
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
        ["ETL pipelines", ""], ["Web scraping", "Scrapy"],
      ]],
      ["Cloud & databases", [
        ["AWS", ""], ["Azure", ""], ["Supabase / PostgreSQL", ""],
        ["MongoDB", ""], ["ElasticSearch", ""], ["Distributed systems", ""],
      ]],
      ["Systems & environment", [
        ["Linux", "Ubuntu"], ["Terminal & shell", "kitty · bash"],
        ["Package management", "apt"],
      ]],
      ["Languages", [
        ["French", "Native"], ["English", "Fluent · IELTS 2023"],
        ["Spanish", "B2"], ["Japanese", "Basics"],
      ]],
    ],
  },
  specRail: {
    fr: "Unité 07 — Spécifications — Caractéristiques et classes — REF.0043-B / REV.2",
    en: "Unit 07 — Specifications — Characteristics and classes — REF.0043-B / REV.2",
  },

  /* — 06 OPÉRATEUR —
     La section la plus AÉRÉE du document, et c'est structurel : cinq
     feuilles denses d'affilée fatiguent, et l'humain derrière la
     machine ne se raconte pas dans un tableau. Une respiration avant
     le cartouche.
     Tout vient du CV, y compris l'encadrement. Rien n'est enjolivé. */
  opIndex: { fr: "08 — Profil", en: "08 — Profile" },
  opNum: { fr: "08", en: "08" },
  opTitle: { fr: "Hors travail", en: "Off duty" },
  opJp: { fr: "余暇", en: "余暇" },
  opCorps: {
    fr: "En dehors du code, je soulève. Musculation et force athlétique, encadré par un champion du monde de powerlifting 2023 et un bodybuilder professionnel.",
    en: "Away from the code, I lift. Strength training and powerlifting, coached by a 2023 powerlifting world champion and a professional bodybuilder.",
  },
  opChute: {
    fr: "Trois programmes de force conçus pour des pratiquants intermédiaires. Un programme d'entraînement est une spécification : une charge, une progression, une tolérance — et quelqu'un qui doit pouvoir l'exécuter sans vous.",
    en: "Three strength programmes written for intermediate lifters. A training programme is a specification: a load, a progression, a tolerance — and someone who has to run it without you.",
  },
  /* Le second goût déclaré (issue #3) : le réglage de l'environnement.
     Sans chute vers le métier — celle du bloc force existe déjà, la
     répéter ferait une redite de procédé. */
  opDesign: {
    fr: "L'autre goût est celui du réglage : un environnement de travail se choisit, puis s'ajuste — couleurs, typographie, chaque outil à sa place, jusqu'à ce que l'ensemble soit cohérent.",
    en: "The other taste is tuning: a working environment is chosen, then adjusted — colors, typography, every tool in its place, until the whole is coherent.",
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
    fr: "Unité 08 — Profil — Hors travail — REF.0043-B / REV.2",
    en: "Unit 08 — Profile — Off duty — REF.0043-B / REV.2",
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
  ctIndex: { fr: "09 — Contact", en: "09 — Contact" },
  ctNum: { fr: "09", en: "09" },
  ctTitle: { fr: "Prise de contact", en: "Get in touch" },
  ctJp: { fr: "表題欄", en: "表題欄" },
  ctAccroche: {
    fr: "Le document s'arrête ici. Le travail, non.",
    en: "The document ends here. The work does not.",
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
      ["Feuilles", "00 à 09"],
    ],
    en: [
      ["Title", "Portfolio — technical plate"],
      ["Drawn by", "Hugo Juskowiak"],
      ["Function", "Full Stack & AI Engineer"],
      ["Base", "France"],
      ["Scale", "1:1"],
      ["Reference", "REF.0043-B / REV.2"],
      ["Date", "2026"],
      ["Sheets", "00 to 09"],
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
    fr: "Unité 09 — Cartouche — Fin du document — REF.0043-B / REV.2",
    en: "Unit 09 — Title block — End of document — REF.0043-B / REV.2",
  },

  /* — libellés des fiches d'unité (/work/[slug]) —
     Le contenu des fiches vit dans projets.ts : ce sont des
     enregistrements, pas des chaînes. Ici ne restent que les
     étiquettes du gabarit. */
  fpRetour: { fr: "Document", en: "Document" },
  fpRetourDocument: { fr: "Retour au document", en: "Back to the document" },
  fpFiche: { fr: "Fiche projet", en: "Project file" },
  fpCadre: { fr: "Cadre", en: "Context" },
  fpPeriode: { fr: "Période", en: "Period" },
  fpEtat: { fr: "État", en: "Status" },
  fpContexte: { fr: "Contexte", en: "Background" },
  fpContraintes: { fr: "Contraintes", en: "Constraints" },
  fpDecisions: { fr: "Décisions techniques", en: "Technical decisions" },
  fpResultat: { fr: "Résultat", en: "Outcome" },
  fpParc: { fr: "Parc", en: "Stack" },
  /* Le prévu est séparé du parc pour que le futur ne se déguise
     jamais en présent (issue #7). */
  fpPrevu: { fr: "Prévu", en: "Planned" },
  fpCaptures: { fr: "Captures d'interface", en: "Interface screens" },

  /* — blocs des fiches sur mesure —
     Titres du vocabulaire de `fiche-blocs.tsx`. Ils sont ici et non
     dans la fiche qui les emploie : deux fiches qui montrent une
     architecture doivent l'appeler pareil. */
  fpArchitecture: { fr: "Architecture", en: "Architecture" },
  fpPont: { fr: "Le pont, en code", en: "The bridge, in code" },
  fpCotes: { fr: "Cotes relevées", en: "Measured figures" },
  fpCotesTete: {
    fr: ["Cote", "Valeur", "Commande"],
    en: ["Figure", "Value", "Command"],
  },
  /* La commande est une COLONNE et pas une note : `projets.ts` écrit
     qu'une fiche technique qui invente ses cotes n'est plus une fiche.
     Un chiffre sans son geste de reproduction est une affirmation. */
  fpCotesNote: {
    fr: "Chaque valeur se rejoue par sa commande, à la racine du dépôt du projet. Relevé du 2026-08-06.",
    en: "Every value replays through its command, at the root of the project repository. Taken 2026-08-06.",
  },
  /* Le mot que le glyphe « ⋯ » ne prononce pas. Il est précédé du
     nombre de lignes sautées, que `CodeAnnote` DÉDUIT des numéros
     voisins — donc pas de nombre à tenir à jour ici. */
  fpCodeElision: { fr: "lignes omises", en: "lines omitted" },

  /* Les fiches formation partagent le gabarit des fiches projet
     mais pas leur grille de lecture : un cursus n'a ni contraintes
     ni décisions techniques. Mêmes emplacements, autres mots. */
  fpFicheFormation: { fr: "Fiche formation", en: "Education file" },
  fpProgramme: { fr: "Programme", en: "Curriculum" },
  fpTravaux: { fr: "Travaux marquants", en: "Notable work" },
  fpCompetences: { fr: "Compétences & outils", en: "Skills & tools" },

  /* Annexes de l'index : les fiches d'unité ne sont pas des feuilles du
     jeu, ce sont des pièces détachées — d'où un bloc distinct et une
     référence en U-0n. */
  idxAnnexes: { fr: "Annexes — fiches détaillées", en: "Annexes — detailed files" },
  idxAnnexesNote: {
    fr: "Neuf pièces documentées séparément — cinq projets, quatre cursus.",
    en: "Nine pieces documented separately — five projects, four programmes.",
  },

  /* — schéma d'architecture d'Eternal —
       Chaque chiffre affiché ici a été relevé dans le dépôt Eternal et
       porte sa commande dans `.scratch/planche-profonde/recherches/02-eternal.md`
       §6 : 11 fragments (`ls lecons/lecon-*.html | wc -l`), 5 784 octets de
       manifeste (`du -b`), 3 763 lignes et 116 fonctions pour `index.html`,
       zéro URL externe pour la même page, zéro `setItem` dans `monde.html`,
       `actif: false` dans `state.json:2`, 8 thèmes fermés (`FORMAT.md:44-53`).
       Les noms de fichier ne se traduisent pas : les deux langues portent
       les mêmes, et c'est exact — le dépôt n'en a qu'un jeu.
       [id, titre, précision…] — la géométrie vit dans schema-eternal.tsx,
       ce dictionnaire ne porte que des mots. */
  etnNoeuds: {
    fr: [
      ["etat", "state.json", "interrupteur — actif : false"],
      ["projet", "un projet quelconque", "git diff · git log"],
      ["contrat", "FORMAT.md", "le contrat — 8 thèmes fermés"],
      ["agent", "agent professeur", "lit le diff, écrit, pousse"],
      ["fragment", "lecon-N.html", "le fragment — 11 fichiers"],
      ["manifeste", "index.json", "le manifeste — 5 784 o"],
      ["moteur", "index.html", "le moteur — 0 dépendance", "3 763 lignes · 116 fonctions"],
      ["vue", "monde.html", "la vue — three.js r160", "aucune règle : 0 setItem"],
    ],
    en: [
      ["etat", "state.json", "the switch — actif: false"],
      ["projet", "any project", "git diff · git log"],
      ["contrat", "FORMAT.md", "the contract — 8 closed themes"],
      ["agent", "professeur agent", "reads the diff, writes, pushes"],
      ["fragment", "lecon-N.html", "the fragment — 11 files"],
      ["manifeste", "index.json", "the manifest — 5,784 B"],
      ["moteur", "index.html", "the engine — 0 dependency", "3,763 lines · 116 functions"],
      ["vue", "monde.html", "the view — three.js r160", "no rule: 0 setItem"],
    ],
  },
  etnBus: {
    fr: ["dépôt git — Zokuzo/eternal", "base · canal multi-machine · hébergement"],
    en: ["git repository — Zokuzo/eternal", "database · cross-machine channel · hosting"],
  },
  etnGroupes: {
    fr: [
      ["1", "chaîne d'écriture"],
      ["2", "transport"],
      ["3", "runtime"],
    ],
    en: [
      ["1", "writing chain"],
      ["2", "transport"],
      ["3", "runtime"],
    ],
  },
  etnLegende: {
    fr: [
      ["1", "un interrupteur, un contrat, un rédacteur — et deux fichiers déposés"],
      ["2", "le dépôt est à la fois la base, le canal entre machines et l'hébergement"],
      ["3", "deux vues, un seul moteur — le pont ne rend que des dérivés, en lecture seule"],
    ],
    en: [
      ["1", "a switch, a contract, a writer — and two files dropped"],
      ["2", "the repository is the database, the cross-machine channel and the host"],
      ["3", "two views, one engine — the bridge only returns derived values, read-only"],
    ],
  },
  etnPont: {
    fr: "iframe cachée — pont en lecture seule",
    en: "hidden iframe — read-only bridge",
  },
  /* La cote mesure l'ÉCART entre les deux vues, et cet écart vaut zéro
     règle : c'est la seule affirmation chiffrée du schéma. */
  etnCote: { fr: "1 moteur · 0 règle dupliquée", en: "1 engine · 0 duplicated rule" },
  etnTitre: {
    fr: "Architecture d'Eternal : une chaîne d'écriture dépose deux fichiers dans un dépôt git, que deux vues du navigateur relisent — index.html porte toutes les règles, monde.html n'en porte aucune.",
    en: "Eternal architecture: a writing chain drops two files into a git repository, which two browser views read back — index.html holds every rule, monde.html holds none.",
  },

  /* — l'extrait de code de la fiche U-04 —
       Le pont : la seule surface par laquelle le monde 3D touche le
       moteur. 15 méthodes au total, 3 montrées — compté par
       `awk 'NR>=3732 && NR<=3757' index.html | grep -cE "^  [a-zA-Z]+: *"`
       → 15. La recherche 02 §2 en annonçait 14 : c'est elle qui se
       trompe, et le chiffre publié ici est celui de la commande. */
  etnPontSource: {
    fr: "index.html:3729-3758 — extrait, 3 des 15 méthodes",
    en: "index.html:3729-3758 — excerpt, 3 of 15 methods",
  },
  etnPontCode: { fr: CODE_PONT, en: CODE_PONT },
  etnPontNote: {
    fr: "Tout ce que le monde 3D peut toucher tient entre ces deux accolades : des lectures et des appels au moteur, jamais l'état brut, jamais une mutation. De l'autre côté du pont, `grep -c setItem monde.html` rend 0 — la vue n'écrit rien.",
    en: "Everything the 3D world can touch fits between those two braces: reads and calls into the engine, never the raw state, never a mutation. On the other side of the bridge, `grep -c setItem monde.html` returns 0 — the view writes nothing.",
  },

  /* — les cotes de la fiche U-04 —
       [cote, valeur, commande]. Chaque ligne a été RELEVÉE le
       2026-08-06 à la racine de `/home/hjuskowiak/PP/Eternal`, HEAD
       `acfe5b8`, par la commande qu'elle affiche — pas recopiée d'une
       recherche. La ligne « Fichiers TypeScript » est celle qui corrige
       le `parc: ["TypeScript"]` que la fiche annonçait : la fiche
       publie désormais sa propre preuve. */
  etnCotes: {
    fr: [
      ["Fragments de leçon", "11", "ls lecons/lecon-*.html | wc -l"],
      ["Manifeste", "5 784 o", "du -b lecons/index.json"],
      ["Interface 2D", "3 763 lignes", "wc -l index.html"],
      ["Fonctions d'index.html", "116", "grep -cE '^(async )?function ' index.html"],
      ["Fichiers TypeScript", "0", "find . -name '*.ts' -not -path './.git/*' | wc -l"],
      ["Écritures d'état dans monde.html", "0", "grep -c setItem monde.html"],
      ["Assets tracés", "226 PNG", "find assets -name '*.png' | wc -l"],
      ["Fenêtre de publication", "2026-07-08 → 2026-07-15", "git log --date=short --pretty=%ad | sort -u"],
    ],
    en: [
      ["Lesson fragments", "11", "ls lecons/lecon-*.html | wc -l"],
      ["Manifest", "5,784 B", "du -b lecons/index.json"],
      ["2D interface", "3,763 lines", "wc -l index.html"],
      ["Functions in index.html", "116", "grep -cE '^(async )?function ' index.html"],
      ["TypeScript files", "0", "find . -name '*.ts' -not -path './.git/*' | wc -l"],
      ["State writes in monde.html", "0", "grep -c setItem monde.html"],
      ["Credited assets", "226 PNG", "find assets -name '*.png' | wc -l"],
      ["Publishing window", "2026-07-08 → 2026-07-15", "git log --date=short --pretty=%ad | sort -u"],
    ],
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
