import type { Lang } from "./dict"

/* ==================================================================
   PARCOURS — employeurs, études, atelier personnel.

   TROIS SOURCES, ET ELLES NE SE VALENT PAS :
   — le CV, pour les dates, les intitulés et les technologies ;
   — le propriétaire, en direct, pour ce que le CV ne dit pas
     (les noms internes des produits UpYourBizz, la nature réelle du
     stage Guill Corp, les projets personnels récents) ;
   — GitHub, pour les liens : seuls les dépôts PUBLICS sont liés.

   CE QUI EST MARQUÉ « À CONFIRMER » : UYB360 et UpYourAds ont été
   nommés sans description, et le bot de candidature aussi. Les libellés
   ci-dessous sont volontairement courts et factuels plutôt que
   plausibles — inventer une description crédible serait pire que d'en
   écrire une pauvre, parce qu'elle passerait inaperçue.

   CORRECTION DU CV : le stage Guill Corp est décrit dans le CV comme
   une interface de « données de programmation d'usinage ». Le
   propriétaire le corrige en filtrage de données d'AVIATION. C'est sa
   version qui fait foi.
   ================================================================== */

/* `note` porte une réserve sur le lien lui-même — « desktop
   uniquement », par exemple. Elle vit ICI et pas dans le paragraphe :
   quelqu'un qui scanne la page pour cliquer ne lit pas le texte avant,
   il lit le bouton. Une réserve écrite ailleurs arrive trop tard. */
export type Lien = { role: string; url: string; note?: string }

export type Produit = {
  code: string
  nom: string
  aka?: string
  texte: string
  liens?: Lien[]
  /* Slug de la fiche détaillée en /work/[slug], quand elle existe.
     Toutes les lignes n approfondissent pas — seules celles qui ont
     des contraintes et des décisions à raconter. */
  fiche?: string
  aConfirmer?: boolean
}

export type Employeur = {
  slug: string
  nom: string
  fonction: string
  lieu?: string
  periode: string
  courant?: boolean
  resume: string
  produits: Produit[]
  parc: string[]
}

export type Etude = {
  code: string
  nom: string
  intitule: string
  lieu?: string
  debut: number // année décimale — porte la position sur le rail
  fin: number
  rail: 0 | 1 // 0 = rail principal, 1 = second rail (double diplôme)
  excursion?: boolean
  texte: string
  /* Slug de la fiche détaillée en /work/[slug] — même mécanique que
     les produits et l'atelier. */
  fiche?: string
}

export type ProjetPerso = {
  code: string
  nom: string
  intitule: string
  texte: string
  etat: string
  liens?: Lien[]
  fiche?: string
  aConfirmer?: boolean
}

/* ---------------------------------------------------------------- */

const EMPLOYEURS_FR: Employeur[] = [
  {
    slug: "upyourbizz",
    nom: "UpYourBizz",
    fonction: "Ingénieur Full Stack & IA",
    lieu: "France",
    periode: "2026.05 → présent",
    courant: true,
    resume:
      "Quatre produits sur une même base technique. Le travail consiste autant à faire tenir les quatre ensemble qu'à en construire un.",
    produits: [
      {
        code: "P1",
        nom: "reach_up",
        aka: "Prospector",
        fiche: "prospector",
        texte:
          "SaaS de prospection B2B multi-tenant, en marque blanche. Routage multi-modèle sur six types de tâches, orchestration de campagnes sur canvas, séquençage multicanal e-mail / LinkedIn / WhatsApp, envoi par les comptes Office 365 des clients en OAuth, collecte automatisée en Scrapy et Playwright.",
      },
      {
        code: "P2",
        nom: "Octo",
        fiche: "octo",
        texte:
          "Segmentation d'exports DMS pour concessionnaires automobiles. Trois populations lues séparément — clients, leads, après-vente — et une sortie en rapport plutôt qu'en tableau de bord.",
      },
      {
        code: "P3",
        nom: "UYB360",
        texte: "Produit de la suite UpYourBizz.",
        aConfirmer: true,
      },
      {
        code: "P4",
        nom: "UpYourAds",
        texte: "Volet publicitaire de la suite UpYourBizz.",
        aConfirmer: true,
      },
    ],
    parc: ["TypeScript", "React", "Supabase", "OpenRouter", "Lemlist", "OAuth Office 365", "Scrapy", "Playwright"],
  },
  {
    slug: "sophia-genetics",
    nom: "Sophia Genetics",
    fonction: "Stagiaire ingénieur développement logiciel",
    lieu: "Bidart",
    periode: "2025.04 → 2025.09",
    resume:
      "Un pipeline bio-informatique demande une allocation mémoire avant de démarrer. Trop haut, on paie du cloud pour rien ; trop bas, la tâche échoue et repart de zéro.",
    produits: [
      {
        code: "P1",
        nom: "Prédiction d'usage mémoire",
        fiche: "prediction-memoire",
        texte:
          "Modèle prédisant la RAM consommée par tâche. XGBoost, LightGBM, CatBoost et Random Forest comparés ; chaîne ETL en Python et Pandas sur ElasticSearch et Azure Blob Storage ; mise en production par GitLab CI/CD.",
      },
    ],
    parc: ["Python", "Pandas", "XGBoost", "LightGBM", "CatBoost", "Random Forest", "ElasticSearch", "Azure", "GitLab CI/CD"],
  },
  {
    slug: "the-guill-corp",
    nom: "The Guill Corp",
    fonction: "Stagiaire ingénieur développement logiciel",
    lieu: "Anglet",
    periode: "2023.02 → 2023.07",
    resume: "Aéronautique. Première mise en service logicielle, et le front-end appris en autonomie pour la tenir.",
    produits: [
      {
        code: "P1",
        nom: "Filtrage de données d'aviation",
        texte:
          "Interface de consultation et de filtrage des données de vol. Back-end Python/Flask, front en JavaScript/jQuery et Ajax sur base SQL. Maquettage Figma appris pour l'occasion.",
      },
    ],
    parc: ["Python", "Flask", "JavaScript", "jQuery", "Ajax", "SQL", "Figma"],
  },
  {
    slug: "legrand",
    nom: "Legrand",
    fonction: "Opérateur industriel",
    lieu: "Le Mans",
    periode: "2022.07 → 2022.08",
    resume: "Deux mois en production. Assemblage sur chaîne, tri de retours pour recyclage, appui aux stocks.",
    produits: [
      {
        code: "P1",
        nom: "Chaîne de production",
        texte:
          "Le poste ne s'invente pas depuis un bureau : cadence imposée, geste répété, qualité contrôlée en sortie. On comprend autrement ce qu'est une contrainte de production après l'avoir tenue.",
      },
    ],
    parc: ["Assemblage", "Contrôle qualité", "Logistique"],
  },
]

const EMPLOYEURS_EN: Employeur[] = [
  {
    slug: "upyourbizz",
    nom: "UpYourBizz",
    fonction: "Full Stack & AI Engineer",
    lieu: "France",
    periode: "2026.05 → present",
    courant: true,
    resume:
      "Four products on one technical base. The work is as much about keeping the four coherent as about building one.",
    produits: [
      {
        code: "P1",
        nom: "reach_up",
        aka: "Prospector",
        fiche: "prospector",
        texte:
          "Multi-tenant white-label B2B prospecting SaaS. Multi-model routing across six task types, canvas campaign orchestration, multichannel sequencing over email / LinkedIn / WhatsApp, sending through clients' own Office 365 accounts over OAuth, automated collection with Scrapy and Playwright.",
      },
      {
        code: "P2",
        nom: "Octo",
        fiche: "octo",
        texte:
          "DMS export segmentation for car dealerships. Three populations read separately — customers, leads, after-sales — and a report as output rather than a dashboard.",
      },
      { code: "P3", nom: "UYB360", texte: "Product in the UpYourBizz suite.", aConfirmer: true },
      { code: "P4", nom: "UpYourAds", texte: "Advertising side of the UpYourBizz suite.", aConfirmer: true },
    ],
    parc: ["TypeScript", "React", "Supabase", "OpenRouter", "Lemlist", "OAuth Office 365", "Scrapy", "Playwright"],
  },
  {
    slug: "sophia-genetics",
    nom: "Sophia Genetics",
    fonction: "Software engineering intern",
    lieu: "Bidart",
    periode: "2025.04 → 2025.09",
    resume:
      "A bioinformatics pipeline requests memory before it starts. Too high and you pay for cloud you never use; too low and the task fails and starts over.",
    produits: [
      {
        code: "P1",
        nom: "Memory usage prediction",
        fiche: "prediction-memoire",
        texte:
          "Model predicting RAM consumed per task. XGBoost, LightGBM, CatBoost and Random Forest compared; ETL chain in Python and Pandas over ElasticSearch and Azure Blob Storage; shipped through GitLab CI/CD.",
      },
    ],
    parc: ["Python", "Pandas", "XGBoost", "LightGBM", "CatBoost", "Random Forest", "ElasticSearch", "Azure", "GitLab CI/CD"],
  },
  {
    slug: "the-guill-corp",
    nom: "The Guill Corp",
    fonction: "Software engineering intern",
    lieu: "Anglet",
    periode: "2023.02 → 2023.07",
    resume: "Aeronautics. First software commissioning, with the front-end self-taught to carry it.",
    produits: [
      {
        code: "P1",
        nom: "Aviation data filtering",
        texte:
          "Interface for browsing and filtering flight data. Python/Flask back-end, JavaScript/jQuery and Ajax front over a SQL base. Figma picked up for the occasion.",
      },
    ],
    parc: ["Python", "Flask", "JavaScript", "jQuery", "Ajax", "SQL", "Figma"],
  },
  {
    slug: "legrand",
    nom: "Legrand",
    fonction: "Industrial operator",
    lieu: "Le Mans",
    periode: "2022.07 → 2022.08",
    resume: "Two months on the floor. Line assembly, sorting returns for recycling, stock support.",
    produits: [
      {
        code: "P1",
        nom: "Production line",
        texte:
          "The job cannot be imagined from a desk: imposed pace, repeated motion, quality checked at the end. You understand a production constraint differently once you have held one.",
      },
    ],
    parc: ["Assembly", "Quality control", "Logistics"],
  },
]

/* ---------------------------------------------------------------- */
/* Le rail 1 n'existe qu'à partir de 2024.09 : c'est LE double diplôme,
   deux cursus menés en parallèle jusqu'à octobre 2025. Hokkaido est
   marqué `excursion` — un semestre qui quitte le rail et y revient. */

const ETUDES_FR: Etude[] = [
  {
    code: "E1", nom: "CPGE", intitule: "Classe préparatoire TSI",
    lieu: "Lycée Touchard-Washington", debut: 2020.7, fin: 2022.5, rail: 0, fiche: "cpge",
    texte: "Deux ans de mathématiques, physique et sciences de l'ingénieur avant toute ligne de code.",
  },
  {
    code: "E2", nom: "ESTIA", intitule: "Master d'ingénieur trilingue",
    debut: 2022.7, fin: 2025.8, rail: 0, fiche: "estia",
    texte: "Cycle ingénieur mené en trois langues de travail. C'est le rail principal — il porte tout le reste.",
  },
  {
    code: "E3", nom: "Hokkaido", intitule: "Semestre d'échange — Information & Ingénierie",
    lieu: "Imperial University of Hokkaido, Japon", debut: 2024.2, fin: 2024.6, rail: 0, excursion: true, fiche: "hokkaido",
    texte:
      "Un semestre à travailler dans une autre norme, une autre langue et un autre rapport au détail. On ne revient pas identique d'un pays qui documente autrement.",
  },
  {
    code: "E4", nom: "MBDS", intitule: "Master en Data Science — MBDS MIAGE",
    lieu: "Université Côte d'Azur", debut: 2024.7, fin: 2025.8, rail: 1, fiche: "mbds",
    texte:
      "Second diplôme mené EN PARALLÈLE du cycle ingénieur, pas après. Les deux rails avancent ensemble de septembre 2024 à octobre 2025 — c'est ce que le schéma montre et ce qu'une liste ne dit pas.",
  },
]

const ETUDES_EN: Etude[] = [
  {
    code: "E1", nom: "CPGE", intitule: "TSI preparatory class",
    lieu: "Lycée Touchard-Washington", debut: 2020.7, fin: 2022.5, rail: 0, fiche: "cpge",
    texte: "Two years of mathematics, physics and engineering science before a single line of code.",
  },
  {
    code: "E2", nom: "ESTIA", intitule: "Trilingual engineering master's",
    debut: 2022.7, fin: 2025.8, rail: 0, fiche: "estia",
    texte: "Engineering cycle run in three working languages. This is the main rail — it carries everything else.",
  },
  {
    code: "E3", nom: "Hokkaido", intitule: "Exchange semester — Information & Engineering",
    lieu: "Imperial University of Hokkaido, Japan", debut: 2024.2, fin: 2024.6, rail: 0, excursion: true, fiche: "hokkaido",
    texte:
      "A semester working to another standard, another language and another relationship with detail. You do not come back the same from a country that documents differently.",
  },
  {
    code: "E4", nom: "MBDS", intitule: "MSc Data Science — MBDS MIAGE",
    lieu: "Université Côte d'Azur", debut: 2024.7, fin: 2025.8, rail: 1, fiche: "mbds",
    texte:
      "A second degree run IN PARALLEL with the engineering cycle, not after it. Both rails advance together from September 2024 to October 2025 — that is what the diagram shows and what a list cannot say.",
  },
]

/* ---------------------------------------------------------------- */

const PERSO_FR: ProjetPerso[] = [
  {
    code: "A1", nom: "Eternal", fiche: "eternal", intitule: "Plateforme d'apprentissage gamifiée",
    etat: "En ligne",
    texte:
      "Le code écrit avec une IA part plus vite qu'il n'est compris. Eternal le convertit en leçons interactives, dans la forme d'un jeu 2D pixel HD, déclenchées par une commande depuis l'outil de travail.",
    liens: [{ role: "Démo", url: "https://zokuzo.github.io/eternal/", note: "Desktop uniquement" }],
  },
  {
    code: "A2", nom: "Trading Agent", fiche: "trading-agent", intitule: "Bot de trading multi-stratégie",
    etat: "Paper trading",
    texte:
      "Plusieurs stratégies exécutées en parallèle sur de l'argent fictif via Alpaca et TradingView, avec un cockpit de reporting qui dit ce que chacune a fait. Le passage à l'argent réel se fait par IBKR, séparément et volontairement.",
  },
  {
    code: "A3", nom: "La Provence", intitule: "Site vitrine — savonnerie artisanale, Montpellier",
    etat: "Livré",
    texte: "Site vitrine pour une savonnerie artisanale. Commande réelle, contraintes réelles, dépôt public.",
    liens: [{ role: "Dépôt", url: "https://github.com/Zokuzo/la-provence-montpellier" }],
  },
  {
    code: "A4", nom: "Bot de candidature", intitule: "Automatisation de recherche d'emploi",
    etat: "En cours",
    texte: "Automatisation du dépôt et du suivi de candidatures.",
    aConfirmer: true,
  },
]

const PERSO_EN: ProjetPerso[] = [
  {
    code: "A1", nom: "Eternal", fiche: "eternal", intitule: "Gamified learning platform",
    etat: "Live",
    texte:
      "Code written with an AI ships faster than it is understood. Eternal turns it into interactive lessons, shaped as a 2D pixel HD game, fired by a command from the working tool.",
    liens: [{ role: "Demo", url: "https://zokuzo.github.io/eternal/", note: "Desktop only" }],
  },
  {
    code: "A2", nom: "Trading Agent", fiche: "trading-agent", intitule: "Multi-strategy trading bot",
    etat: "Paper trading",
    texte:
      "Several strategies running in parallel on fake money through Alpaca and TradingView, with a reporting cockpit that says what each one did. The move to real money runs through IBKR, separately and deliberately.",
  },
  {
    code: "A3", nom: "La Provence", intitule: "Storefront site — artisan soap maker, Montpellier",
    etat: "Delivered",
    texte: "Storefront site for an artisan soap maker. A real commission, real constraints, public repository.",
    liens: [{ role: "Repository", url: "https://github.com/Zokuzo/la-provence-montpellier" }],
  },
  {
    code: "A4", nom: "Application bot", intitule: "Job search automation",
    etat: "Ongoing",
    texte: "Automating job application submission and follow-up.",
    aConfirmer: true,
  },
]

/* ---------------------------------------------------------------- */

const E: Record<Lang, Employeur[]> = { fr: EMPLOYEURS_FR, en: EMPLOYEURS_EN }
const S: Record<Lang, Etude[]> = { fr: ETUDES_FR, en: ETUDES_EN }
const P: Record<Lang, ProjetPerso[]> = { fr: PERSO_FR, en: PERSO_EN }

export const employeurs = (l: Lang) => E[l]
export const etudes = (l: Lang) => S[l]
export const perso = (l: Lang) => P[l]
