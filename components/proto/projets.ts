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
    contexte:
      "Le code écrit avec une IA part plus vite qu'il n'est compris. Eternal convertit ce code en leçons interactives, dans la forme d'un jeu vidéo 2D pixel HD, pour ancrer la connaissance sans ralentir la livraison.",
    contraintes: [
      "La leçon ne doit rien coûter au rythme de travail, sinon elle ne sera jamais lue.",
      "Apprendre après coup n'a d'intérêt que si la leçon porte sur le code réellement écrit.",
      "Le jeu se joue au clavier sur grand écran : la démo en ligne est desktop uniquement, et l'assumer vaut mieux que servir une version tactile dégradée.",
    ],
    decisions: [
      {
        titre: "La leçon se déclenche depuis l'outil de travail",
        texte:
          "Une commande `/prof` lancée là où le code est écrit : la leçon naît du travail au lieu de l'interrompre.",
      },
      {
        titre: "Forme de jeu, pas de cours",
        texte:
          "Un jeu 2D pixel HD plutôt qu'une liste d'articles — on revient dans un jeu, on ne revient pas dans un wiki.",
      },
    ],
    parc: ["TypeScript", "Génération de contenu par LLM"],
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
    contexte:
      "Code written with an AI ships faster than it is understood. Eternal turns that code into interactive lessons, shaped as a 2D pixel HD video game, to anchor the knowledge without slowing delivery.",
    contraintes: [
      "The lesson must cost nothing to the working rhythm, or it will never be read.",
      "Learning after the fact only matters if the lesson covers the code actually written.",
      "The game is played on a keyboard and a large screen: the online demo is desktop only, and owning that beats serving a degraded touch version.",
    ],
    decisions: [
      {
        titre: "The lesson fires from the working tool",
        texte: "A `/prof` command run where the code is written: the lesson comes out of the work instead of interrupting it.",
      },
      {
        titre: "Game form, not course form",
        texte:
          "A 2D pixel HD game rather than a list of articles — people come back to a game, they do not come back to a wiki.",
      },
    ],
    parc: ["TypeScript", "LLM content generation"],
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
