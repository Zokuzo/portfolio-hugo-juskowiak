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
  /* L'expérience GT86 (#27) — aucune chaîne en dur dans la surcouche, la
     doctrine de la spec veut que TOUT le texte de l'expérience soit du DOM
     bilingue en overlay, jamais porté par la 3D. */
  gt86Demarrer: {
    fr: "Cliquez pour démarrer",
    en: "Click to start",
  },
  gt86Chargement: { fr: "chargement", en: "loading" },
  gt86Gps: { fr: "GPS", en: "GPS" },
  gt86Musiques: { fr: "Musiques", en: "Music" },
  gt86Maison: { fr: "Maison", en: "Home" },
  gt86Travail: { fr: "Travail", en: "Work" },
  gt86Partir: { fr: "Départ", en: "Go" },
  gt86Passer: { fr: "passer l'intro", en: "skip intro" },
  gt86Retour: { fr: "retour", en: "back" },
  /* le nom du seuil (#31) : identique dans les deux langues, mais il passe
     par le dictionnaire comme tout texte de l'expérience (doctrine #25) */
  gt86Nom: { fr: "Hugo Juskowiak", en: "Hugo Juskowiak" },
  gt86Titre: { fr: "Software Development Engineer", en: "Software Development Engineer" },
  gt86Rejouer: { fr: "revoir la scène", en: "replay the scene" },
  /* l'écran média (#32) : les libellés du peintre passent par le dict */
  gt86OuVaTOn: { fr: "OÙ VA-T-ON ?", en: "WHERE TO?" },
  gt86ChargerSpotify: { fr: "cliquer pour écouter via Spotify", en: "click to listen via Spotify" },
  gt86SpotifyBloque: {
    fr: "l'embed n'a pas répondu, écouter directement :",
    en: "the embed didn't respond, listen directly:",
  },
  gt86Date: { fr: "mar. 19 août", en: "Tue, Aug 19" },
  status: {
    fr: "En poste · France",
    en: "Employed · France",
  },
  spec: {
    fr: [
      ["Désignation", "Hugo Juskowiak"],
      ["Fonction", "Ingénieur Full Stack & IA"],
      ["Base", "Le Mans, France"],
      ["En service", "Depuis 2022"],
      ["Domaines", "ML · Data · Systèmes distribués"],
      ["Langues", "FR · EN · ES · JP"],
    ],
    en: [
      ["Designation", "Hugo Juskowiak"],
      ["Function", "Full Stack & AI Engineer"],
      ["Base", "Le Mans, France"],
      ["In service", "Since 2022"],
      ["Domains", "ML · Data · Distributed systems"],
      ["Languages", "FR · EN · ES · JP"],
    ],
  },
  offdutyName: {
    fr: "Powerlifting · Multilingue",
    en: "Powerlifting · Multilingual",
  },
  offdutyDesc: {
    fr: "Disponibilité : sur demande.",
    en: "Availability: on request.",
  },
  traceTitle: {
    fr: "Manière de travailler",
    en: "How I work",
  },
  traceNote: {
    fr: "Six étapes, dans cet ordre. Celle du milieu est la seule qui coûte du temps sans produire de code, et c'est aussi la seule qui empêche d'en écrire pour rien.",
    en: "Six steps, in this order. The middle one is the only one that costs time without producing code, and the only one that stops you writing code for nothing.",
  },
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
  xpTitle: { fr: "Là où j'ai travaillé", en: "Where I have worked" },
  /* La thèse précédente — « une même base technique » — est morte
     contre le code (issue #7) : zéro fichier commun entre les dépôts
     comparés. Ce qui est vrai, et plus intéressant : une manière de
     faire commune, et la contrainte que les produits se parlent. */
  xpNote: {
    fr: "Groupés par employeur et non par projet : quatre produits d'une même maison ne partagent pas un socle de code, ils partagent une manière de faire, et une contrainte d'architecture réelle : se parler entre eux.",
    en: "Grouped by employer rather than by project: four products from one house share no common codebase; they share a way of building, and one real architectural constraint: talking to each other.",
  },
  xpEnCours: { fr: "En poste", en: "Current" },
  xpFiche: { fr: "Fiche détaillée", en: "Detailed file" },
  etuTitle: { fr: "Deux rails en parallèle", en: "Two rails in parallel" },
  etuNote: {
    fr: "Un double diplôme n'est pas deux diplômes : ce sont deux cursus menés en même temps. Écrit en liste, ça se lit l'un après l'autre et l'information disparaît.",
    en: "A double degree is not two degrees: it is two courses run at the same time. Written as a list, they read one after the other and the information is lost.",
  },
  etuDouble: { fr: "Double diplôme · 13 mois", en: "Double degree · 13 months" },
  atTitle: { fr: "Ce que je construis à côté", en: "What I build on the side" },
  specTitle: { fr: "Caractéristiques", en: "Characteristics" },
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
        ["Three.js", ""], ["Pandas", ""], ["Git", ""], ["GitLab CI/CD", ""],
      ]],
      ["ML, IA & data", [
        ["XGBoost", ""], ["LightGBM", ""], ["CatBoost", ""], ["Random Forest", ""],
        ["Intégration de LLM & prompt engineering", "OpenRouter"],
        ["Pipelines ETL", ""], ["Web scraping", "Scrapy · Playwright"],
      ]],
      ["Cloud & bases de données", [
        ["AWS", ""], ["Azure", ""], ["Supabase / PostgreSQL", ""],
        ["MongoDB", ""], ["ElasticSearch", ""], ["Vercel", ""],
        ["API REST & OAuth", ""], ["Microservices & systèmes distribués", ""],
      ]],
      ["Méthodes & outils", [
        ["Scrum", ""], ["Jira", ""], ["Figma", ""], ["Claude Code", ""],
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
        ["Three.js", ""], ["Pandas", ""], ["Git", ""], ["GitLab CI/CD", ""],
      ]],
      ["ML, AI & data", [
        ["XGBoost", ""], ["LightGBM", ""], ["CatBoost", ""], ["Random Forest", ""],
        ["LLM integration & prompt engineering", "OpenRouter"],
        ["ETL pipelines", ""], ["Web scraping", "Scrapy · Playwright"],
      ]],
      ["Cloud & databases", [
        ["AWS", ""], ["Azure", ""], ["Supabase / PostgreSQL", ""],
        ["MongoDB", ""], ["ElasticSearch", ""], ["Vercel", ""],
        ["REST APIs & OAuth", ""], ["Microservices & distributed systems", ""],
      ]],
      ["Methods & tools", [
        ["Scrum", ""], ["Jira", ""], ["Figma", ""], ["Claude Code", ""],
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
  opTitle: { fr: "Hors travail", en: "Off duty" },
  opCorps: {
    fr: "En dehors du code, je soulève. Musculation et force athlétique, encadré par un champion du monde de powerlifting 2023 et un bodybuilder professionnel.",
    en: "Away from the code, I lift. Strength training and powerlifting, coached by a 2023 powerlifting world champion and a professional bodybuilder.",
  },
  opChute: {
    fr: "Trois programmes de force conçus pour des pratiquants intermédiaires. Un programme d'entraînement est une spécification : une charge, une progression, une tolérance, et quelqu'un qui doit pouvoir l'exécuter sans vous.",
    en: "Three strength programmes written for intermediate lifters. A training programme is a specification: a load, a progression, a tolerance, and someone who has to run it without you.",
  },
  /* Le second goût déclaré (issue #3) : le réglage de l'environnement.
     Sans chute vers le métier — celle du bloc force existe déjà, la
     répéter ferait une redite de procédé. */
  opDesign: {
    fr: "L'autre goût est celui du réglage : un environnement de travail se choisit, puis s'ajuste (couleurs, typographie, chaque outil à sa place) jusqu'à ce que l'ensemble soit cohérent.",
    en: "The other taste is tuning: a working environment is chosen, then adjusted (colors, typography, every tool in its place) until the whole is coherent.",
  },
  opChamps: {
    fr: [
      ["Qualification", "Musculation & force athlétique"],
      ["Encadrement", "Champion du monde de powerlifting 2023 · Bodybuilder professionnel"],
      ["Production", "3 programmes de force, pratiquants intermédiaires"],
      ["Langues de travail", "FR · EN · ES · JP"],
    ],
    en: [
      ["Qualification", "Strength training & powerlifting"],
      ["Coaching", "2023 powerlifting world champion · Professional bodybuilder"],
      ["Output", "3 strength programmes, intermediate lifters"],
      ["Working languages", "FR · EN · ES · JP"],
    ],
  },
  ctTitle: { fr: "Prise de contact", en: "Get in touch" },
  ctAccroche: {
    fr: "Le document s'arrête ici. Le travail, non.",
    en: "The document ends here. The work does not.",
  },
  ctLiens: {
    fr: [
      ["E-mail", "hugo.jskpro@outlook.fr", "mailto:hugo.jskpro@outlook.fr"],
      ["LinkedIn", "linkedin.com/in/hugo-juskowiak", "https://www.linkedin.com/in/hugo-juskowiak/"],
      ["Dossier", "CV au format PDF", "/CV_Hugo_Juskowiak_FR.pdf"],
    ],
    en: [
      ["Email", "hugo.jskpro@outlook.fr", "mailto:hugo.jskpro@outlook.fr"],
      ["LinkedIn", "linkedin.com/in/hugo-juskowiak", "https://www.linkedin.com/in/hugo-juskowiak/"],
      ["File", "Résumé (PDF)", "/CV_Hugo_Juskowiak_FR.pdf"],
    ],
  },

  /* — libellés des fiches, les deux mondes (/work/[slug] et
     /home/[slug] depuis le #39) —
     Le contenu des fiches vit dans projets.ts : ce sont des
     enregistrements, pas des chaînes. Ici ne restent que les
     étiquettes du gabarit — et RIEN QUE celles qui sont rendues :
     `fpRetour`, `fpRetourDocument` et `fpCaptures` sont parties avec la
     coque planche qui les portait (#39). Une clé sans appelant est une
     étiquette qu'on retraduira pour rien, exactement le motif qui a
     fait dé-exporter `SLUGS` au même commit. (Le #40 rend le RETOUR
     vers la planche, donc son mot : il revient en une seule clé,
     `fpDocumentSys`, et avec un appelant — pas deux comme avant.) */
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
      ["etat", "state.json", "interrupteur, actif : false"],
      ["projet", "un projet quelconque", "git diff · git log"],
      ["contrat", "FORMAT.md", "le contrat, 8 thèmes fermés"],
      ["agent", "agent professeur", "lit le diff, écrit, pousse"],
      ["fragment", "lecon-N.html", "le fragment, 11 fichiers"],
      ["manifeste", "index.json", "le manifeste, 5 784 o"],
      ["moteur", "index.html", "le moteur, 0 dépendance", "3 763 lignes · 116 fonctions"],
      ["vue", "monde.html", "la vue, three.js r160", "aucune règle : 0 setItem"],
    ],
    en: [
      ["etat", "state.json", "the switch, actif: false"],
      ["projet", "any project", "git diff · git log"],
      ["contrat", "FORMAT.md", "the contract, 8 closed themes"],
      ["agent", "professeur agent", "reads the diff, writes, pushes"],
      ["fragment", "lecon-N.html", "the fragment, 11 files"],
      ["manifeste", "index.json", "the manifest, 5,784 B"],
      ["moteur", "index.html", "the engine, 0 dependency", "3,763 lines · 116 functions"],
      ["vue", "monde.html", "the view, three.js r160", "no rule: 0 setItem"],
    ],
  },
  etnBus: {
    fr: ["dépôt git : Zokuzo/eternal", "base · canal multi-machine · hébergement"],
    en: ["git repository: Zokuzo/eternal", "database · cross-machine channel · hosting"],
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
      ["1", "un interrupteur, un contrat, un rédacteur, et deux fichiers déposés"],
      ["2", "le dépôt est à la fois la base, le canal entre machines et l'hébergement"],
      ["3", "deux vues, un seul moteur : le pont ne rend que des dérivés, en lecture seule"],
    ],
    en: [
      ["1", "a switch, a contract, a writer, and two files dropped"],
      ["2", "the repository is the database, the cross-machine channel and the host"],
      ["3", "two views, one engine: the bridge only returns derived values, read-only"],
    ],
  },
  etnPont: {
    fr: "iframe cachée, pont en lecture seule",
    en: "hidden iframe, read-only bridge",
  },
  /* La cote mesure l'ÉCART entre les deux vues, et cet écart vaut zéro
     règle : c'est la seule affirmation chiffrée du schéma. */
  etnCote: { fr: "1 moteur · 0 règle dupliquée", en: "1 engine · 0 duplicated rule" },
  etnTitre: {
    fr: "Architecture d'Eternal : une chaîne d'écriture dépose deux fichiers dans un dépôt git, que deux vues du navigateur relisent : index.html porte toutes les règles, monde.html n'en porte aucune.",
    en: "Eternal architecture: a writing chain drops two files into a git repository, which two browser views read back: index.html holds every rule, monde.html holds none.",
  },

  /* L'extrait de code de la fiche U-05.
       Le pont : la seule surface par laquelle le monde 3D touche le
       moteur. 15 méthodes au total, 3 montrées — compté par
       `awk 'NR>=3732 && NR<=3757' index.html | grep -cE "^  [a-zA-Z]+: *"`
       → 15. La recherche 02 §2 en annonçait 14 : c'est elle qui se
       trompe, et le chiffre publié ici est celui de la commande. */
  etnPontSource: {
    fr: "index.html:3729-3758 : extrait, 3 des 15 méthodes",
    en: "index.html:3729-3758: excerpt, 3 of 15 methods",
  },
  etnPontCode: { fr: CODE_PONT, en: CODE_PONT },
  etnPontNote: {
    fr: "Tout ce que le monde 3D peut toucher tient entre ces deux accolades : des lectures et des appels au moteur, jamais l'état brut, jamais une mutation. De l'autre côté du pont, `grep -c setItem monde.html` rend 0 : la vue n'écrit rien.",
    en: "Everything the 3D world can touch fits between those two braces: reads and calls into the engine, never the raw state, never a mutation. On the other side of the bridge, `grep -c setItem monde.html` returns 0: the view writes nothing.",
  },

  /* Les cotes de la fiche U-05.
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
  /* — le hub TRAVAIL (#36) — le monde 2D passe Y2K Brutalist (décision
     Hugo du 2026-08-26 sur #34) : la page se présente comme un bureau
     système an-2000 — fenêtres à biseau, noms de fichiers, readouts LCD.
     Le CONTENU reste celui des feuilles (xp*, tel*, trace*, spec*, ct* et
     parcours.ts, repris tels quels) ; ici ne vivent que les chromes de la
     coquille. Les noms de fichiers ne se traduisent pas tous : .EXE est
     l'esthétique, seule la racine suit la langue quand elle est un mot. */
  hubOs: { fr: "HJ·OS", en: "HJ·OS" },
  creditModeles: { fr: "Modèles 3D :", en: "3D models:" },
  creditGt86: { fr: "« Fox's Rocketbunny GT86 » par Swiss_Fox", en: "“Fox's Rocketbunny GT86” by Swiss_Fox" },
  creditVille: { fr: "« Procedural City 5 » par abhayexe", en: "“Procedural City 5” by abhayexe" },
  creditSon: { fr: "Son :", en: "Sound:" },
  creditAcceleration: { fr: "« FR-S BRZ GT-86 Vortech Supercharged Dyno Run » par dezoris", en: "“FR-S BRZ GT-86 Vortech Supercharged Dyno Run” by dezoris" },
  hubTravailSys: { fr: "TRAVAIL.SYS", en: "WORK.SYS" },
  hubBoot: {
    fr: "session ouverte, partition montée",
    en: "session open, partition mounted",
  },
  hubMarquee: {
    fr: "★ PARTITION TRAVAIL ··· 4 employeurs ··· méthode en 6 étapes ··· caractéristiques et classes ··· contact en fin de session ★",
    en: "★ WORK PARTITION ··· 4 employers ··· 6-step method ··· characteristics and classes ··· contact at end of session ★",
  },
  hubEjecter: { fr: "⏏ Éjecter : retour à l'expérience", en: "⏏ Eject: back to the experience" },
  hubFenXp: { fr: "EXPERIENCE.EXE", en: "EXPERIENCE.EXE" },
  /* TELEMETRIE.EXE a vécu une vague : « enlève le routage multimodèle
     c'est useless » (gate #36, 2026-08-26) — la décision « Télémétrie en
     vitrine » du #20 est ENTERRÉE par le propriétaire. */
  hubFenMethode: { fr: "METHODE.EXE", en: "METHOD.EXE" },
  hubFenSpec: { fr: "SPECS.SYS", en: "SPECS.SYS" },
  hubFenContact: { fr: "CONTACT.DLL", en: "CONTACT.DLL" },
  hubObjets: { fr: "objets", en: "items" },
  /* la réserve de parcours.ts (aConfirmer), le hub la DIT : une
     lacune de documentation se signale */
  hubAConfirmer: { fr: "à confirmer", en: "to be confirmed" },
  hubStatut: {
    fr: "© 2026 Hugo Juskowiak · session TRAVAIL",
    en: "© 2026 Hugo Juskowiak · WORK session",
  },
  /* — le hub MAISON (#37) — la CHAMBRE au crépuscule, le miroir du
     bureau de nuit : l'OS du foyer qui démarre (boot sakura façon
     « Cherry Windows 97 » de la moisson), disquettes d'atelier,
     playlist HJ·AMP, PROFIL.INI, messagerie. Ici ne vivent que les
     chromes de la coquille — le contenu vient de parcours.ts et des
     clés at·, etu·, op· et ct·, repris tels quels (doctrine #20). */
  hubMaisonSys: { fr: "MAISON.SYS", en: "HOME.SYS" },
  hubMaisonBoot: {
    fr: "démarrage du foyer, partition personnelle",
    en: "booting home, personal partition",
  },
  hubMaisonCharge: { fr: "foyer monté : 100 %", en: "home mounted: 100%" },
  /* « cursus », JAMAIS « diplômes » : la playlist rend les quatre
     entrées de etudes() — CPGE est une classe préparatoire et Hokkaido
     un semestre d'échange, seuls ESTIA et MBDS sont des diplômes
     (revue adversariale du #37 ; la loi « rien d'inventé » vaut aussi
     pour les chromes de la coquille). */
  hubMaisonMarquee: {
    fr: "✿ PARTITION MAISON ··· 4 projets d'atelier sur disquettes ··· 4 cursus en lecture ··· hors travail ··· messagerie ouverte ✿",
    en: "✿ HOME PARTITION ··· 4 workshop projects on floppies ··· 4 courses playing ··· off duty ··· messenger online ✿",
  },
  /* le kanji du foyer, décoratif, mais il passe par le dict */
  hubMaisonJp: { fr: "家", en: "家" },
  /* les noms de sections suivent la métaphore de chacune : le lecteur
     de disquettes, la playlist, le fichier de config, le messager —
     comme .EXE/.SYS côté travail, l'extension est l'esthétique */
  hubMaisonAtelier: { fr: "A:\\ATELIER", en: "A:\\WORKSHOP" },
  hubMaisonAtNote: {
    fr: "Quatre projets, quatre disquettes : l'étiquette dit l'état, la fiche dit le reste.",
    en: "Four projects, four floppies: the label says the status, the file says the rest.",
  },
  /* la racine suit la langue quand elle est un mot (loi du #36) :
     « QUALIF » est une troncation française qu'un anglophone ne lit
     pas — l'anglais reprend le mot de la feuille 03 (etuIndex) */
  hubMaisonQualif: { fr: "QUALIF.M3U", en: "STUDIES.M3U" },
  hubMaisonAmp: { fr: "HJ·AMP", en: "HJ·AMP" },
  hubMaisonPistes: { fr: "pistes", en: "tracks" },
  hubMaisonPerso: { fr: "PROFIL.INI", en: "PROFILE.INI" },
  hubMaisonIniForce: { fr: "[FORCE]", en: "[STRENGTH]" },
  hubMaisonIniReglages: { fr: "[REGLAGES]", en: "[TUNING]" },
  hubMaisonContact: { fr: "MSGR.EXE", en: "MSGR.EXE" },
  hubMaisonEnLigne: { fr: "hugo · en ligne", en: "hugo · online" },
  hubMaisonStatut: {
    fr: "© 2026 Hugo Juskowiak · session MAISON",
    en: "© 2026 Hugo Juskowiak · HOME session",
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
