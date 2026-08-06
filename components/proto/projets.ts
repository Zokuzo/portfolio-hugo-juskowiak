import type { Lang } from "./dict"

/* ==================================================================
   FICHES D'UNITÉ — le contenu des pages /work/[slug].

   POURQUOI CE FICHIER ET PAS dict.ts : le dictionnaire porte des
   CHAÎNES traduites, indexées par clé plate. Une fiche projet est un
   ENREGISTREMENT — un slug, un état, des listes imbriquées. L'y
   enfoncer sous forme de tuples anonymes rendrait les deux illisibles.
   Le contrat reste le même : aucune chaîne visible en dur dans les
   composants, et FR/EN systématiquement.

   TOUT VIENT DU CV. Les décisions techniques listées sont celles qu'il
   décrit ; aucune n'est extrapolée.

   PAS DE RÉSULTATS CHIFFRÉS, et c'est un manque assumé. Le CV dit
   « réduisant les coûts cloud, les échecs et le temps d'exécution »
   sans donner de chiffres. Une fiche technique qui invente ses cotes
   n'est plus une fiche — donc la rubrique dit ce qui a été obtenu, pas
   de combien. À COMPLÉTER AVEC LE PROPRIÉTAIRE : c'est le seul endroit
   du site où un chiffre vérifié ajouterait beaucoup.
   ================================================================== */

export type Projet = {
  slug: string
  unite: string
  nom: string
  sousTitre: string
  jp: string
  cadre: string
  periode: string
  etat: string
  /* `courant` allume le rail rouge : un seul projet à la fois, comme la
     révision courante et la voie lourde de la télémétrie. */
  courant?: boolean
  /* Une fiche formation partage le gabarit des fiches projet mais
     pas leur grille de lecture : un cursus n'a ni contraintes ni
     décisions techniques, il a un programme et des travaux. Le
     genre choisit les libellés — absent = projet. */
  genre?: "formation"
  contexte: string
  contraintes: string[]
  decisions: { titre: string; texte: string }[]
  parc: string[]
  resultat?: string
}

const FR: Projet[] = [
  {
    slug: "prospector",
    unite: "U-01",
    nom: "Prospector",
    sousTitre: "SaaS de prospection B2B multi-tenant, en marque blanche",
    jp: "プロスペクター",
    cadre: "UpYourBizz",
    periode: "2026.05 → présent",
    etat: "En service",
    courant: true,
    contexte:
      "Une plateforme de prospection vendue en marque blanche : chaque client la voit comme la sienne, tous partagent la même base et le même moteur. La multi-tenance n'est pas une option ajoutée, c'est la première contrainte de conception.",
    contraintes: [
      "Multi-tenant : l'isolation des données est structurelle, pas applicative.",
      "Marque blanche : l'identité visuelle est une donnée, pas du code.",
      "Coût par tâche : un modèle lourd sur toutes les tâches rendrait le produit non rentable.",
      "Multicanal : e-mail, LinkedIn et WhatsApp n'ont ni les mêmes limites ni le même ton.",
    ],
    decisions: [
      {
        titre: "Routage multi-modèle sur six types de tâches",
        texte:
          "Chaque type de tâche part vers le modèle le moins cher qui la tient, via OpenRouter. Le coût et la latence sont arbitrés par tâche et non réglés une fois pour toutes — c'est ce qui sépare une intégration de LLM d'un produit qui tient sa marge.",
      },
      {
        titre: "Orchestration de campagnes sur canvas",
        texte:
          "Les workflows se construisent visuellement, les personas se génèrent à partir de documents fournis, et le séquençage multicanal passe par l'API Lemlist.",
      },
      {
        titre: "Infrastructure e-mail en OAuth",
        texte:
          "L'envoi passe par les comptes Office 365 des clients en OAuth, pas par un relais mutualisé : la délivrabilité appartient à l'expéditeur.",
      },
      {
        titre: "Collecte automatisée",
        texte: "Web scraping en Scrapy et Playwright pour alimenter la base sans saisie manuelle.",
      },
      {
        titre: "Chatbot agentique et bibliothèque interne",
        texte:
          "Un chatbot IA à routage multi-sessions, et une bibliothèque de composants maison pour que l'interface reste cohérente à mesure que le produit grossit.",
      },
    ],
    parc: ["TypeScript", "React", "Supabase", "OpenRouter", "Lemlist", "OAuth Office 365", "Scrapy", "Playwright"],
  },
  {
    slug: "octo",
    unite: "U-02",
    nom: "Octo",
    sousTitre: "Segmentation d'exports DMS pour concessionnaires automobiles",
    jp: "オクト",
    cadre: "UpYourBizz",
    periode: "2026.05 → présent",
    etat: "En service",
    contexte:
      "Un concessionnaire dispose d'un DMS qui sait tout de ses clients et ne sait rien en dire. Octo prend ses exports bruts et les rend lisibles.",
    contraintes: [
      "L'entrée est un export, pas une API : le format varie d'un concessionnaire à l'autre.",
      "Le lecteur n'est pas analyste : la sortie doit être un rapport, pas un tableau croisé.",
    ],
    decisions: [
      {
        titre: "Segmentation sur trois bases distinctes",
        texte:
          "Clients, leads et après-vente ne se lisent pas ensemble : ce sont trois populations avec trois questions différentes, donc trois segmentations.",
      },
      {
        titre: "Rapport complet plutôt que tableau de bord",
        texte:
          "La sortie est un document qui se lit et se transmet, parce que la décision se prend en réunion et pas devant un écran.",
      },
    ],
    parc: ["TypeScript", "Traitement d'exports DMS"],
  },
  {
    slug: "prediction-memoire",
    unite: "U-03",
    nom: "Prédiction d'usage mémoire",
    sousTitre: "Machine learning en production sur pipelines bio-informatiques",
    jp: "メモリ予測",
    cadre: "Sophia Genetics",
    periode: "2025.04 → 2025.09",
    etat: "Livré",
    contexte:
      "Dans un pipeline bio-informatique, chaque tâche demande une allocation mémoire avant de démarrer. Surestimer coûte du cloud ; sous-estimer fait échouer la tâche et repartir de zéro. Le système prédit l'usage réel par tâche.",
    contraintes: [
      "Se tromper vers le bas est plus cher que se tromper vers le haut : l'erreur n'est pas symétrique.",
      "Le modèle sert en production, pas en notebook : il doit tenir dans une chaîne CI/CD.",
      "Les données viennent de sources hétérogènes et ne sont pas propres.",
    ],
    decisions: [
      {
        titre: "Ensembles d'arbres plutôt qu'un réseau",
        texte:
          "XGBoost, LightGBM, CatBoost et Random Forest comparés : sur des données tabulaires hétérogènes, un ensemble d'arbres se règle plus vite, s'explique et ne demande pas de GPU en production.",
      },
      {
        titre: "Chaîne ETL avant modèle",
        texte:
          "Collecte, prétraitement et feature engineering en Python et Pandas, sur ElasticSearch et Azure Blob Storage. La qualité du jeu d'entraînement décide de tout le reste.",
      },
      {
        titre: "Mise en production continue",
        texte: "Déploiement par GitLab CI/CD, en méthode agile — le modèle vit avec le pipeline qu'il sert.",
      },
    ],
    parc: ["Python", "Pandas", "XGBoost", "LightGBM", "CatBoost", "Random Forest", "ElasticSearch", "Azure Blob Storage", "GitLab CI/CD"],
    resultat:
      "Coûts cloud, taux d'échec et temps d'exécution en baisse sur le calcul distribué. Les valeurs chiffrées ne sont pas publiées ici.",
  },
  {
    slug: "eternal",
    unite: "U-04",
    nom: "Eternal",
    sousTitre: "Plateforme d'apprentissage gamifiée",
    jp: "エターナル",
    cadre: "Projet personnel",
    periode: "En cours",
    etat: "En cours",
    /* RÉÉCRIT AU TICKET 11, contre le code et non contre le souvenir.
       Tout ce qui suit est sourcé dans
       `.scratch/planche-profonde/recherches/02-eternal.md`, et le parc
       est CORRIGÉ : il annonçait TypeScript, et
       `find . -name '*.ts' -not -path './.git/*' | wc -l` rend 0 dans
       le dépôt Eternal ; les autres faux souvenirs (ce que sert le lien
       de démo, « Desktop uniquement », « En cours » contre
       `actif: false`) demandent un arbitrage éditorial et restent au
       ticket 20.

       DEUXIÈME CORRECTION, et celle-là avait été INTRODUITE par le
       ticket 11 lui-même : le contexte annonçait deux pages « sans
       build ni dépendance ». Faux pour l'une des deux. Toutes les URL
       externes des deux pages, hors espace de noms SVG :
       `grep -oE 'https?://[^" ]+' index.html monde.html |
       grep -v w3.org | sort -u` rend DEUX lignes, les deux dans
       `monde.html`, les deux `cdn.jsdelivr.net/npm/three@0.160.0`.
       L'asymétrie est le fait intéressant, et c'est elle qui est
       publiée : le build est absent des deux côtés, la dépendance ne
       l'est que d'un. */
    contexte:
      "Le code écrit avec une IA part plus vite qu'il n'est compris. Eternal n'est pas une application mais une chaîne de production : à la fin d'un travail significatif, un agent lit le vrai diff du projet, écrit une leçon interactive et la pousse dans un dépôt git. Deux pages HTML sans build la relisent au navigateur — l'interface 2D porte toutes les règles du jeu et zéro dépendance ; le monde 3D n'a aucune règle et exactement une dépendance, three.js chargé depuis un CDN.",
    contraintes: [
      "La leçon ne doit rien coûter au rythme de travail : elle part en arrière-plan à la fin d'une tâche, jamais en bloquant.",
      "Des agents qui n'échangent aucun message doivent produire des fichiers interopérables — il fallait un point de rendez-vous qui ne soit ni une API ni une base.",
      "Plusieurs sessions, sur plusieurs machines, peuvent rédiger en même temps : deux d'entre elles ne doivent pas se donner le même numéro de leçon.",
      "Zéro serveur, zéro compte, hébergement statique — la progression reste donc sur l'appareil, et cette limite est écrite plutôt que masquée.",
    ],
    decisions: [
      {
        titre: "Un fichier de contrat à la place d'une réunion",
        texte:
          "`FORMAT.md` est déclaré source de vérité partagée entre l'agent qui écrit et l'interface qui rend : disposition, vocabulaire fermé de huit thèmes, économie d'XP, structure exacte du fragment. Onze leçons plus tard, les onze le respectent.",
      },
      {
        titre: "Le manifeste est séparé du contenu",
        texte:
          "Au démarrage, l'interface ne charge que les métadonnées — 5 784 octets — et va chercher le fragment d'une leçon à son ouverture, une seule fois. Trier, filtrer et calculer la progression ne coûtent donc pas les 194 989 octets de fragments.",
      },
      {
        titre: "Aucun compteur persisté",
        texte:
          "L'XP, le solde, les rangs et les statistiques de combat se recalculent à chaque affichage depuis ce qui a été lu et répondu. Un état de progression corrompu ou d'une ancienne version ne peut donc pas mentir sur un total.",
      },
      {
        titre: "Deux vues, un seul moteur",
        texte:
          "Le monde en trois dimensions ne rend que le décor : il n'a aucune règle. Il pilote le moteur de la page 2D par un pont en lecture seule, exposé depuis une iframe cachée — et il n'écrit jamais l'état.",
      },
    ],
    parc: [
      "HTML",
      "CSS (OKLCH)",
      "JavaScript sans build",
      "three.js r160",
      "WebGL",
      "SVG inline",
      "localStorage",
      "git / GitHub Pages",
      "PowerShell",
      "Claude Code",
    ],
  },
  {
    slug: "trading-agent",
    unite: "U-05",
    nom: "Trading Agent",
    sousTitre: "Bot de trading multi-stratégie en paper trading",
    jp: "トレーディング",
    cadre: "Projet personnel",
    periode: "En cours",
    etat: "Paper trading",
    contexte:
      "Un bot qui exécute plusieurs stratégies en parallèle sur de l'argent fictif, avec le cockpit qu'il faut pour comprendre ce qu'il fait avant de lui confier quoi que ce soit de réel.",
    contraintes: [
      "Une stratégie qui gagne en backtest ne gagne pas forcément en marché : le paper trading est la seule mesure honnête.",
      "Passer à l'argent réel est irréversible : la bascule doit être un acte, pas un réglage.",
    ],
    decisions: [
      {
        titre: "Paper trading d'abord, bascule explicite ensuite",
        texte:
          "Alpaca et TradingView pour l'exécution fictive et les signaux ; le passage à l'argent réel se fait par IBKR, séparément et volontairement.",
      },
      {
        titre: "Cockpit de reporting",
        texte:
          "Un bot sans reporting est une boîte noire qui perd de l'argent poliment. Le cockpit dit ce que chaque stratégie a fait et pourquoi.",
      },
      {
        titre: "Leçons intégrées et dictionnaire d'abréviations",
        texte: "Le domaine est plein de jargon : l'outil l'explique au lieu de supposer qu'il est connu.",
      },
    ],
    parc: ["Python", "Alpaca", "TradingView", "IBKR"],
  },
  {
    slug: "cpge",
    unite: "F-01",
    genre: "formation",
    nom: "CPGE",
    sousTitre: "Classe préparatoire TSI — deux ans de fondations avant le code",
    jp: "準備学級",
    cadre: "Lycée Touchard-Washington, Le Mans",
    periode: "2020.09 → 2022.06",
    etat: "Validée",
    contexte:
      "Deux ans de mathématiques, de physique et de sciences de l'ingénieur avant toute ligne de code. La filière TSI mène aux concours d'écoles d'ingénieurs par le volume de travail et la méthode — c'est là que la discipline de travail a pris sa forme.",
    contraintes: [
      "Mathématiques : analyse, algèbre, probabilités — le socle formel.",
      "Physique et sciences de l'ingénieur : mécanique, électricité, automatique.",
      "Rythme de concours : colles hebdomadaires, devoirs surveillés, correction publique.",
    ],
    decisions: [
      {
        titre: "Apprendre à être évalué souvent",
        texte:
          "La prépa n'enseigne pas que des théorèmes : elle apprend à retravailler vite ce qui vient d'être corrigé. Ce réflexe — l'itération courte sur sa propre production — sert tous les jours en ingénierie logicielle.",
      },
    ],
    parc: ["Mathématiques", "Physique", "Sciences de l'ingénieur", "Méthode de travail"],
    resultat: "Admission en cycle ingénieur à l'ESTIA.",
  },
  {
    slug: "estia",
    unite: "F-02",
    genre: "formation",
    nom: "ESTIA",
    sousTitre: "Master d'ingénieur trilingue — le rail principal du parcours",
    jp: "エスティア",
    cadre: "ESTIA, Bidart",
    periode: "2022.09 → 2025.10",
    etat: "Diplômé",
    contexte:
      "Cycle ingénieur mené en trois langues de travail — français, anglais, espagnol. C'est le rail principal du parcours : il porte l'excursion à Hokkaido et le double diplôme MBDS, et il se termine en octobre 2025.",
    contraintes: [
      "Formation généraliste : informatique, génie industriel, systèmes embarqués, gestion de projet.",
      "Trois langues de travail — les cours changent de langue, pas les exigences.",
      "Alternance de périodes académiques et de stages en entreprise.",
    ],
    decisions: [
      {
        titre: "Deux stages d'ingénierie logicielle",
        texte:
          "The Guill Corp en 2023 — interface de filtrage de données d'aviation — puis Sophia Genetics en 2025 — machine learning en production (U-03). Le second est documenté en fiche d'unité.",
      },
      {
        titre: "Un semestre au Japon",
        texte: "Semestre d'échange à l'Imperial University of Hokkaido, en cours de cycle — fiche F-03.",
      },
      {
        titre: "Un second master en parallèle",
        texte: "Le MBDS mené en même temps que la fin du cycle ingénieur, pas après — fiche F-04.",
      },
    ],
    parc: ["Informatique", "Génie industriel", "FR / EN / ES", "Gestion de projet"],
    resultat: "Diplôme d'ingénieur obtenu en 2025, avec un semestre d'échange au Japon et un second master mené en parallèle.",
  },
  {
    slug: "hokkaido",
    unite: "F-03",
    genre: "formation",
    nom: "Hokkaido",
    sousTitre: "Semestre d'échange — Information & Ingénierie",
    jp: "北海道",
    cadre: "Imperial University of Hokkaido, Japon",
    periode: "2024.03 → 2024.07",
    etat: "Validé",
    contexte:
      "Un semestre à travailler dans une autre norme, une autre langue et un autre rapport au détail. C'est l'excursion du schéma de la feuille 03 : le trait quitte le rail principal et y revient — on ne revient pas identique d'un pays qui documente autrement.",
    contraintes: [
      "Cours d'information et d'ingénierie, en anglais.",
      "Une autre norme de travail et de documentation, à apprendre sur place.",
      "La vie quotidienne dans une langue non maîtrisée — l'ingénierie continue quand même.",
    ],
    decisions: [
      {
        titre: "Documenter ce qu'on croyait évident",
        texte:
          "Les conventions ne sont pas des évidences universelles : ce qui va sans dire en France s'écrit au Japon, et inversement. Ce réflexe est resté — il se voit jusque dans ce site.",
      },
    ],
    parc: ["Information & Ingénierie", "Anglais de travail", "Normes & documentation"],
  },
  {
    slug: "mbds",
    unite: "F-04",
    genre: "formation",
    nom: "MBDS",
    sousTitre: "Master en Data Science — MBDS MIAGE, mené en parallèle du cycle ingénieur",
    jp: "データ科学",
    cadre: "Université Côte d'Azur",
    periode: "2024.09 → 2025.10",
    etat: "Diplômé",
    contexte:
      "Second diplôme mené EN PARALLÈLE du cycle ingénieur, pas après. De septembre 2024 à octobre 2025, les deux rails avancent ensemble — c'est la cote du schéma de la feuille 03, sa seule affirmation chiffrée.",
    contraintes: [
      "Data science : statistiques, machine learning, bases de données.",
      "MIAGE : l'informatique appliquée à la gestion, pas la théorie seule.",
      "Deux cursus de front — l'arbitrage du temps ne figure pas au syllabus, il est pourtant la première épreuve.",
    ],
    decisions: [
      {
        titre: "Un terrain d'application immédiat",
        texte:
          "Le stage Sophia Genetics — machine learning en production (U-03) — se déroule pendant la même période : ce que le master enseigne, le pipeline le met à l'épreuve.",
      },
      {
        titre: "Deux diplômes, un ordonnancement",
        texte:
          "Mener deux cursus de front n'est pas une performance de sprint mais d'ordonnancement : décider chaque semaine ce qui peut attendre, et le tenir.",
      },
    ],
    parc: ["Statistiques", "Machine learning", "Bases de données", "Python"],
    resultat: "Second master obtenu, en parallèle de la dernière année du cycle ingénieur.",
  },
]

const EN: Projet[] = [
  {
    slug: "prospector",
    unite: "U-01",
    nom: "Prospector",
    sousTitre: "Multi-tenant white-label B2B prospecting SaaS",
    jp: "プロスペクター",
    cadre: "UpYourBizz",
    periode: "2026.05 → present",
    etat: "In service",
    courant: true,
    contexte:
      "A prospecting platform sold white-label: every client sees it as their own, all of them share one base and one engine. Multi-tenancy is not a feature bolted on — it is the first design constraint.",
    contraintes: [
      "Multi-tenant: data isolation is structural, not application-level.",
      "White-label: visual identity is data, not code.",
      "Cost per task: a heavy model on every task would make the product unprofitable.",
      "Multichannel: email, LinkedIn and WhatsApp share neither limits nor tone.",
    ],
    decisions: [
      {
        titre: "Multi-model routing across six task types",
        texte:
          "Each task type goes to the cheapest model that holds it, through OpenRouter. Cost and latency are arbitrated per task rather than set once — that is what separates an LLM integration from a product that keeps its margin.",
      },
      {
        titre: "Canvas campaign orchestration",
        texte:
          "Workflows are built visually, personas are generated from supplied documents, and multichannel sequencing runs through the Lemlist API.",
      },
      {
        titre: "OAuth email infrastructure",
        texte:
          "Sending goes through clients' own Office 365 accounts over OAuth rather than a shared relay: deliverability belongs to the sender.",
      },
      {
        titre: "Automated collection",
        texte: "Scrapy and Playwright web scraping feeds the base without manual entry.",
      },
      {
        titre: "Agentic chatbot and internal library",
        texte:
          "A multi-session routed AI chatbot, and an in-house component library so the interface stays coherent as the product grows.",
      },
    ],
    parc: ["TypeScript", "React", "Supabase", "OpenRouter", "Lemlist", "OAuth Office 365", "Scrapy", "Playwright"],
  },
  {
    slug: "octo",
    unite: "U-02",
    nom: "Octo",
    sousTitre: "DMS export segmentation for car dealerships",
    jp: "オクト",
    cadre: "UpYourBizz",
    periode: "2026.05 → present",
    etat: "In service",
    contexte:
      "A dealership has a DMS that knows everything about its customers and can say nothing about them. Octo takes the raw exports and makes them readable.",
    contraintes: [
      "The input is an export, not an API: the format varies between dealerships.",
      "The reader is not an analyst: the output must be a report, not a pivot table.",
    ],
    decisions: [
      {
        titre: "Segmentation across three distinct bases",
        texte:
          "Customers, leads and after-sales do not read together: three populations, three questions, three segmentations.",
      },
      {
        titre: "A full report rather than a dashboard",
        texte:
          "The output is a document that can be read and passed on, because the decision is made in a meeting and not in front of a screen.",
      },
    ],
    parc: ["TypeScript", "DMS export processing"],
  },
  {
    slug: "prediction-memoire",
    unite: "U-03",
    nom: "Memory usage prediction",
    sousTitre: "Machine learning in production on bioinformatics pipelines",
    jp: "メモリ予測",
    cadre: "Sophia Genetics",
    periode: "2025.04 → 2025.09",
    etat: "Delivered",
    contexte:
      "In a bioinformatics pipeline, every task requests a memory allocation before it starts. Overestimating costs cloud money; underestimating fails the task and starts it over. The system predicts actual per-task usage.",
    contraintes: [
      "Being wrong downwards costs more than being wrong upwards: the error is not symmetric.",
      "The model serves production, not a notebook: it has to live inside a CI/CD chain.",
      "Data comes from heterogeneous sources and is not clean.",
    ],
    decisions: [
      {
        titre: "Tree ensembles rather than a network",
        texte:
          "XGBoost, LightGBM, CatBoost and Random Forest compared: on heterogeneous tabular data a tree ensemble tunes faster, explains itself, and needs no GPU in production.",
      },
      {
        titre: "ETL chain before model",
        texte:
          "Collection, preprocessing and feature engineering in Python and Pandas, over ElasticSearch and Azure Blob Storage. Training set quality decides everything downstream.",
      },
      {
        titre: "Continuous delivery",
        texte: "Deployed through GitLab CI/CD, agile — the model lives with the pipeline it serves.",
      },
    ],
    parc: ["Python", "Pandas", "XGBoost", "LightGBM", "CatBoost", "Random Forest", "ElasticSearch", "Azure Blob Storage", "GitLab CI/CD"],
    resultat:
      "Cloud cost, failure rate and run time down on distributed compute. Figures are not published here.",
  },
  {
    slug: "eternal",
    unite: "U-04",
    nom: "Eternal",
    sousTitre: "Gamified learning platform",
    jp: "エターナル",
    cadre: "Personal project",
    periode: "Ongoing",
    etat: "Ongoing",
    /* Voir le commentaire de la fiche FR : réécrite au ticket 11
       contre le code, le parc corrigé, et la dépendance de `monde.html`
       rétablie — la version précédente écrivait « no dependency » des
       DEUX pages, ce qui était faux de celle qui charge three.js. */
    contexte:
      "Code written with an AI ships faster than it is understood. Eternal is not an application but a production chain: at the end of a significant piece of work, an agent reads the project's real diff, writes an interactive lesson and pushes it into a git repository. Two HTML pages with no build read it back in the browser — the 2D interface holds every rule of the game and zero dependencies; the 3D world holds no rule and exactly one dependency, three.js loaded from a CDN.",
    contraintes: [
      "The lesson must cost nothing to the working rhythm: it fires in the background at the end of a task, never blocking.",
      "Agents that exchange no messages must still produce interoperable files — the meeting point had to be neither an API nor a database.",
      "Several sessions, on several machines, may write at the same time: no two of them may claim the same lesson number.",
      "No server, no account, static hosting — so progress stays on the device, and that limit is written down rather than hidden.",
    ],
    decisions: [
      {
        titre: "A contract file instead of a meeting",
        texte:
          "`FORMAT.md` is declared the shared source of truth between the agent that writes and the interface that renders: layout, a closed vocabulary of eight themes, the XP economy, the exact shape of a fragment. Eleven lessons later, all eleven comply.",
      },
      {
        titre: "The manifest is separate from the content",
        texte:
          "At start-up the interface loads metadata only — 5,784 bytes — and fetches a lesson's fragment when it is opened, once. Sorting, filtering and computing progress therefore do not cost the 194,989 bytes of fragments.",
      },
      {
        titre: "No persisted counter",
        texte:
          "XP, balance, ranks and combat statistics are recomputed on every render from what was actually read and answered. A corrupted or outdated progress store therefore cannot lie about a total.",
      },
      {
        titre: "Two views, one engine",
        texte:
          "The three-dimensional world only renders scenery: it holds no rule. It drives the 2D page's engine through a read-only bridge exposed from a hidden iframe — and it never writes state.",
      },
    ],
    parc: [
      "HTML",
      "CSS (OKLCH)",
      "Build-less JavaScript",
      "three.js r160",
      "WebGL",
      "Inline SVG",
      "localStorage",
      "git / GitHub Pages",
      "PowerShell",
      "Claude Code",
    ],
  },
  {
    slug: "trading-agent",
    unite: "U-05",
    nom: "Trading Agent",
    sousTitre: "Multi-strategy paper trading bot",
    jp: "トレーディング",
    cadre: "Personal project",
    periode: "Ongoing",
    etat: "Paper trading",
    contexte:
      "A bot running several strategies in parallel on fake money, with the cockpit needed to understand what it does before trusting it with anything real.",
    contraintes: [
      "A strategy that wins in backtest does not necessarily win in the market: paper trading is the only honest measure.",
      "Going to real money is irreversible: the switch must be an act, not a setting.",
    ],
    decisions: [
      {
        titre: "Paper trading first, explicit switch after",
        texte:
          "Alpaca and TradingView for simulated execution and signals; the move to real money runs through IBKR, separately and deliberately.",
      },
      {
        titre: "Reporting cockpit",
        texte: "A bot without reporting is a black box that loses money politely. The cockpit says what each strategy did, and why.",
      },
      {
        titre: "Built-in lessons and an abbreviation dictionary",
        texte: "The domain is dense with jargon: the tool explains it instead of assuming it is known.",
      },
    ],
    parc: ["Python", "Alpaca", "TradingView", "IBKR"],
  },
  {
    slug: "cpge",
    unite: "F-01",
    genre: "formation",
    nom: "CPGE",
    sousTitre: "TSI preparatory class — two years of foundations before the code",
    jp: "準備学級",
    cadre: "Lycée Touchard-Washington, Le Mans",
    periode: "2020.09 → 2022.06",
    etat: "Completed",
    contexte:
      "Two years of mathematics, physics and engineering science before a single line of code. The TSI track leads to engineering school entrance exams through sheer volume of work and method — this is where the working discipline took its shape.",
    contraintes: [
      "Mathematics: analysis, algebra, probability — the formal base.",
      "Physics and engineering science: mechanics, electricity, control.",
      "Exam rhythm: weekly oral examinations, supervised tests, public correction.",
    ],
    decisions: [
      {
        titre: "Learning to be assessed often",
        texte:
          "Prépa does not only teach theorems: it teaches reworking quickly what has just been corrected. That reflex — short iteration on your own output — serves every day in software engineering.",
      },
    ],
    parc: ["Mathematics", "Physics", "Engineering science", "Working method"],
    resultat: "Admission to the ESTIA engineering cycle.",
  },
  {
    slug: "estia",
    unite: "F-02",
    genre: "formation",
    nom: "ESTIA",
    sousTitre: "Trilingual engineering master's — the main rail of the journey",
    jp: "エスティア",
    cadre: "ESTIA, Bidart",
    periode: "2022.09 → 2025.10",
    etat: "Graduated",
    contexte:
      "Engineering cycle run in three working languages — French, English, Spanish. This is the main rail: it carries the Hokkaido excursion and the MBDS double degree, and it ends in October 2025.",
    contraintes: [
      "Generalist curriculum: computer science, industrial engineering, embedded systems, project management.",
      "Three working languages — the courses switch language, the requirements do not.",
      "Alternating academic periods and industry internships.",
    ],
    decisions: [
      {
        titre: "Two software engineering internships",
        texte:
          "The Guill Corp in 2023 — aviation data filtering interface — then Sophia Genetics in 2025 — machine learning in production (U-03). The second is documented as a unit file.",
      },
      {
        titre: "A semester in Japan",
        texte: "Exchange semester at the Imperial University of Hokkaido, mid-cycle — file F-03.",
      },
      {
        titre: "A second master's in parallel",
        texte: "The MBDS run alongside the end of the engineering cycle, not after it — file F-04.",
      },
    ],
    parc: ["Computer science", "Industrial engineering", "FR / EN / ES", "Project management"],
    resultat: "Engineering degree obtained in 2025, with an exchange semester in Japan and a second master's run in parallel.",
  },
  {
    slug: "hokkaido",
    unite: "F-03",
    genre: "formation",
    nom: "Hokkaido",
    sousTitre: "Exchange semester — Information & Engineering",
    jp: "北海道",
    cadre: "Imperial University of Hokkaido, Japan",
    periode: "2024.03 → 2024.07",
    etat: "Completed",
    contexte:
      "A semester working to another standard, another language and another relationship with detail. It is the excursion on the sheet 03 diagram: the line leaves the main rail and returns — you do not come back the same from a country that documents differently.",
    contraintes: [
      "Information and engineering coursework, in English.",
      "Another standard of work and documentation, learned on site.",
      "Daily life in a language not mastered — the engineering carries on regardless.",
    ],
    decisions: [
      {
        titre: "Documenting what seemed obvious",
        texte:
          "Conventions are not universal evidences: what goes without saying in France is written down in Japan, and vice versa. That reflex stayed — it shows all the way into this site.",
      },
    ],
    parc: ["Information & Engineering", "Working English", "Standards & documentation"],
  },
  {
    slug: "mbds",
    unite: "F-04",
    genre: "formation",
    nom: "MBDS",
    sousTitre: "MSc Data Science — MBDS MIAGE, run in parallel with the engineering cycle",
    jp: "データ科学",
    cadre: "Université Côte d'Azur",
    periode: "2024.09 → 2025.10",
    etat: "Graduated",
    contexte:
      "A second degree run IN PARALLEL with the engineering cycle, not after it. From September 2024 to October 2025 both rails advance together — that is the dimension line on the sheet 03 diagram, its only numbered claim.",
    contraintes: [
      "Data science: statistics, machine learning, databases.",
      "MIAGE: computing applied to management, not theory alone.",
      "Two programmes at once — time arbitration is not on the syllabus, yet it is the first test.",
    ],
    decisions: [
      {
        titre: "An immediate proving ground",
        texte:
          "The Sophia Genetics internship — machine learning in production (U-03) — runs over the same period: what the master's teaches, the pipeline puts to the test.",
      },
      {
        titre: "Two degrees, one schedule",
        texte:
          "Running two programmes at once is not a sprint performance but a scheduling one: deciding each week what can wait, and holding to it.",
      },
    ],
    parc: ["Statistics", "Machine learning", "Databases", "Python"],
    resultat: "Second master's obtained, in parallel with the final year of the engineering cycle.",
  },
]

const PAR_LANGUE: Record<Lang, Projet[]> = { fr: FR, en: EN }

export function projets(lang: Lang): Projet[] {
  return PAR_LANGUE[lang]
}

/* Les slugs sont identiques dans les deux langues — une URL ne se
   traduit pas, sinon changer de langue changerait d'adresse. */
export function projet(lang: Lang, slug: string): Projet | undefined {
  return PAR_LANGUE[lang].find((p) => p.slug === slug)
}

export const SLUGS = FR.map((p) => p.slug)
