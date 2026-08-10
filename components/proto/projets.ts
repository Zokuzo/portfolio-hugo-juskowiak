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

   LES CHIFFRES ONT UNE SOURCE, OU N'EXISTENT PAS. Une fiche technique
   qui invente ses cotes n'est plus une fiche. Les chiffres de la fiche
   prédiction-mémoire viennent du support du tech talk de fin de stage,
   fourni par le propriétaire le 2026-08-10 — le code est resté chez
   Sophia Genetics, et la fiche dit sa source plutôt que de faire
   passer un souvenir pour une mesure.
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
  /* Ce qui est PRÉVU et pas encore construit. La rubrique existe pour
     qu'un projet réel au futur ne se glisse pas dans le parc, qui ne
     dit que ce qui est. */
  prevu?: string[]
  resultat?: string
  /* Captures d'interface, expurgées AVANT d'entrer ici : noms de
     clients pixelisés à la source. `src` pointe sous public/ ; alt et
     légende vivent dans l'enregistrement pour être traduits comme le
     reste de la fiche. CONTRAT DE COTES : toutes les captures font
     1600×900 — le gabarit fige ces dimensions dans le balisage pour
     réserver la place ; une capture d'un autre ratio devra d'abord
     porter ses cotes ici. */
  captures?: { src: string; alt: string; legende: string }[]
}

const FR: Projet[] = [
  /* RÉÉCRITE AU TICKET 20 (issue GitHub #7), contre le code et les
     réponses du propriétaire du 2026-08-10. Le produit s'appelle
     Reach-Up depuis le 2026-07-15 — le travail a commencé sous le nom
     Prospector, l'ancienne URL /work/prospector redirige ici. Le parc
     précédent annonçait OAuth Office 365 (les boîtes sont en réalité
     connectées chez l'exécutant d'envoi) et Scrapy (la collecte est
     réelle mais vit dans un dépôt séparé) ; « En service » est confirmé
     par le propriétaire : un client réel utilise le produit. */
  {
    slug: "reach-up",
    unite: "U-01",
    nom: "Reach-Up",
    sousTitre: "SaaS de prospection B2B multi-tenant, en marque blanche",
    jp: "リーチアップ",
    cadre: "UpYourBizz",
    periode: "2026.05 → présent",
    etat: "En service",
    courant: true,
    contexte:
      "Une plateforme de prospection vendue en marque blanche : chaque client la voit comme la sienne, tous partagent la même base et le même moteur. La multi-tenance n'est pas une option ajoutée, c'est la première contrainte de conception.",
    contraintes: [
      "Multi-tenant : l'isolation des données est structurelle, pas applicative — deux portes opérateur assumées la contournent, filtrées et auditées.",
      "Marque blanche : sur les surfaces publiques, l'identité visuelle est une donnée, pas du code.",
      "Coût par tâche : un modèle lourd sur toutes les tâches rendrait le produit non rentable.",
      "Multicanal : e-mail, LinkedIn, SMS et WhatsApp n'ont ni les mêmes limites ni le même ton.",
    ],
    decisions: [
      {
        titre: "Routage multi-modèle par type de tâche",
        texte:
          "Chaque type de tâche part vers le modèle choisi pour lui dans une table de routage par tenant, via OpenRouter. Le verrou juridique eu_only est automatique et ferme par défaut ; l'arbitrage coût/qualité est posé par l'opérateur, tâche par tâche — c'est ce qui sépare une intégration de LLM d'un produit qui tient sa marge.",
      },
      {
        titre: "Orchestration de campagnes sur canvas",
        texte:
          "Les workflows se construisent visuellement, les personas se génèrent à partir de documents fournis, et le séquençage multicanal passe par l'API Lemlist.",
      },
      {
        titre: "L'envoi part des boîtes des clients",
        texte:
          "Les boîtes Office 365 des clients sont connectées chez l'exécutant d'envoi, pas derrière un relais mutualisé : la délivrabilité appartient à l'expéditeur, et le produit ne porte pas d'OAuth applicatif.",
      },
      {
        titre: "Collecte du catalogue client",
        texte:
          "Le catalogue de chaque client est collecté en Scrapy, dans un dépôt séparé du produit : e-mails et messages de prospection s'adaptent aux offres du moment sans saisie manuelle.",
      },
      {
        titre: "Assistant agentique et bibliothèque interne",
        texte:
          "Un assistant à outils fixes, conversation persistée par tenant et par campagne, chaque action sortante passant par une confirmation humaine — et une bibliothèque de composants maison pour que l'interface reste cohérente à mesure que le produit grossit.",
      },
    ],
    parc: [
      "TypeScript",
      "React",
      "Vite",
      "Hono",
      "Turborepo / pnpm",
      "Supabase",
      "PostgreSQL — RLS & partitionnement",
      "pgmq · pg_cron",
      "Zod",
      "Vitest",
      "OpenRouter",
      "Lemlist",
      "Sentry",
      "Vercel",
    ],
    captures: [
      {
        src: "/reach-up/01-dashboard.webp",
        alt: "Dashboard opérateur de Reach-Up : indicateurs de prospection, table des tenants, journal de gouvernance et console assistant.",
        legende: "Le dashboard opérateur — pilotage multi-tenants, conformité et assistant. Noms de clients expurgés.",
      },
      {
        src: "/reach-up/02-campagne.webp",
        alt: "Vue campagne de Reach-Up : séquence multicanal en workflow, taux d'ouverture et de réponse par étape.",
        legende: "Une campagne en séquence — le workflow d'exécution multicanal, étape par étape. Noms de clients expurgés.",
      },
    ],
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
  /* RÉÉCRITE AU TICKET 14 (issue GitHub #2), depuis le support du tech
     talk de fin de stage fourni par le propriétaire le 2026-08-10. Le
     code est resté chez Sophia Genetics : la fiche ne publie que les
     agrégats du support — jamais un nom de pipeline, de cluster ou de
     collègue — et dit sa source. L'ancienne version surdéclarait :
     « en production » (le stage livre une étude et une baseline, le
     microservice est dessiné, pas déployé) et « Random Forest comparé »
     (écarté dès la pré-analyse). */
  {
    slug: "prediction-memoire",
    unite: "U-03",
    nom: "Prédiction d'usage mémoire",
    sousTitre: "Machine learning contre la sur-allocation mémoire de pipelines bio-informatiques",
    jp: "メモリ予測",
    cadre: "Sophia Genetics",
    periode: "2025.04 → 2025.09",
    etat: "Livré",
    contexte:
      "Dans un pipeline bio-informatique, chaque tâche demande une allocation mémoire avant de démarrer. Le système en place — une table par tranches de 100 Mo sur la taille du plus gros fichier d'entrée, qui ne se met à jour qu'à la hausse — est très sûr et très pessimiste : environ 1200 To de RAM sur-alloués en trois mois. Le stage le confronte à des modèles appris. Le code est resté chez Sophia Genetics ; cette fiche s'appuie sur le support du tech talk de fin de stage.",
    contraintes: [
      "Se tromper vers le bas est plus cher que se tromper vers le haut : l'échec d'une tâche coûte l'analyse entière, le gaspillage ne coûte que du cloud.",
      "Le système en place fait zéro échec : le battre sur le gaspillage sans créer d'échecs est tout l'arbitrage.",
      "L'entrée est un journal d'exécution brut, à reconstruire par tâche, par échantillon et par partition avant d'apprendre quoi que ce soit.",
    ],
    decisions: [
      {
        titre: "Un modèle par type de tâche",
        texte:
          "Les journaux quotidiens de l'exécuteur deviennent des jeux hebdomadaires par cluster, puis des features — taille du plus gros fichier d'entrée, tailles et nombre d'échantillons, taille du panel de gènes, historique mémoire et CPU. Chaque type de tâche a son modèle, pas un modèle global qui moyenne des comportements différents.",
      },
      {
        titre: "Ensembles d'arbres, choisis pour s'expliquer",
        texte:
          "Decision Trees et Random Forest écartés dès la pré-analyse ; XGBoost, CatBoost et LightGBM comparés à fond. Le gradient boosting est retenu pour son interprétabilité : l'importance de chaque feature se lit en valeurs SHAP, et la taille du plus gros fichier d'entrée domine.",
      },
      {
        titre: "Une perte asymétrique contre la sous-prédiction",
        texte:
          "Une fonction de perte custom pénalise la sous-prédiction plus que la sur-prédiction, avec un facteur de pondération balayé sur échelle logarithmique pour trouver la zone d'équilibre entre échec de tâche et gaspillage de RAM.",
      },
      {
        titre: "Un score en argent plutôt qu'une métrique",
        texte:
          "Loss = c_fail · F + c_waste · W : le coût d'un échec (humain et infra) contre le prix du gigaoctet-seconde de VM gaspillé. Les modèles se comparent en argent, pas en métriques abstraites.",
      },
    ],
    parc: ["Python", "Pandas / NumPy", "scikit-learn", "XGBoost", "LightGBM", "CatBoost", "SHAP", "Matplotlib / Seaborn / Plotly", "Azure Blob Storage"],
    resultat:
      "Sur les familles de tâches étudiées, la mémoire réservée totale est divisée par deux à dix selon la famille — la sous-prédiction restant à quelques pour cent sur les plus gros volumes — d'après le support du tech talk. Le stage livre l'étude comparative et la baseline ; le microservice de prédiction est dessiné, pas déployé.",
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
       le dépôt Eternal ; le lien de démo et « Desktop uniquement » ont
       été tranchés au ticket 20 (issue #7) : deux liens en feuille 04,
       la réserve desktop portée par le seul monde 3D. Reste « En
       cours » contre `actif: false`, non arbitré.

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
    /* ENRICHIE AU TICKET 20 (issue GitHub #7) : IBKR sort du parc —
       le mot n'apparaît dans aucun fichier de code du bot, seulement
       dans des ADR au futur — et rejoint la rubrique « prévu ». Les
       quatre morceaux d'architecture ajoutés sont prouvés par la
       recherche sur le dépôt du bot, consignée à l'issue #7. */
    contexte:
      "Un bot qui exécute plusieurs stratégies en parallèle sur de l'argent fictif, avec le cockpit qu'il faut pour comprendre ce qu'il fait avant de lui confier quoi que ce soit de réel.",
    contraintes: [
      "Une stratégie qui gagne en backtest ne gagne pas forcément en marché : le paper trading est la seule mesure honnête.",
      "Passer à l'argent réel est irréversible : la bascule doit être un acte, pas un réglage — aujourd'hui, l'argent réel n'est pas branché du tout.",
    ],
    decisions: [
      {
        titre: "Paper trading d'abord",
        texte:
          "Alpaca exécute sur compte fictif ; TradingView sert à choisir l'univers de titres, ce sont les barres de marché qui décident des entrées. Chaque stratégie a son propre compte et ses propres clés — jamais de repli sur le compte d'une autre.",
      },
      {
        titre: "Le backtest rejoue le même code que le live",
        texte:
          "Un seul cycle argent, neutre vis-à-vis du courtier : le rejeu historique passe par le même contrat que l'exécution réelle. Ce qu'on teste est ce qui tournera — pas une réimplémentation qui divergerait en silence.",
      },
      {
        titre: "Zéro dépendance Python",
        texte:
          "Le bot tient en bibliothèque standard pure, adaptateur REST compris. Pas de dépendance à casser, pas de chaîne d'approvisionnement à surveiller pour un process qui touche à l'argent.",
      },
      {
        titre: "Cockpit déployé, gardé par clé",
        texte:
          "Un bot sans reporting est une boîte noire qui perd de l'argent poliment. Le cockpit — neuf écrans, déployé — dit ce que chaque stratégie a fait et pourquoi, derrière une clé d'accès.",
      },
      {
        titre: "Un watchdog indépendant",
        texte:
          "Un processus séparé surveille l'âge des journaux des deux boucles de trading et alerte une fois par incident. Le surveillant ne partage pas le sort du surveillé.",
      },
      {
        titre: "Leçons intégrées et dictionnaire d'abréviations",
        texte: "Le domaine est plein de jargon : l'outil l'explique au lieu de supposer qu'il est connu.",
      },
    ],
    parc: ["Python — stdlib pur", "Alpaca (paper, données IEX)", "TradingView", "Vercel", "bash / systemd"],
    prevu: ["IBKR — le passage à l'argent réel, par une bascule volontaire et séparée"],
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
          "The Guill Corp en 2023 — interface de filtrage de données d'aviation — puis Sophia Genetics en 2025 — machine learning contre la sur-allocation mémoire (U-03). Le second est documenté en fiche d'unité.",
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
          "Le stage Sophia Genetics — machine learning contre la sur-allocation mémoire (U-03) — se déroule pendant la même période : ce que le master enseigne, le pipeline le met à l'épreuve.",
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
  /* Voir le commentaire de la fiche FR : réécrite au ticket 20
     (issue GitHub #7) — nom Reach-Up, boîtes connectées chez
     l'exécutant, collecte Scrapy dans un dépôt séparé, parc relevé
     sur le dépôt réel. */
  {
    slug: "reach-up",
    unite: "U-01",
    nom: "Reach-Up",
    sousTitre: "Multi-tenant white-label B2B prospecting SaaS",
    jp: "リーチアップ",
    cadre: "UpYourBizz",
    periode: "2026.05 → present",
    etat: "In service",
    courant: true,
    contexte:
      "A prospecting platform sold white-label: every client sees it as their own, all of them share one base and one engine. Multi-tenancy is not a feature bolted on — it is the first design constraint.",
    contraintes: [
      "Multi-tenant: data isolation is structural, not application-level — two acknowledged operator doors bypass it, filtered and audited.",
      "White-label: on public surfaces, visual identity is data, not code.",
      "Cost per task: a heavy model on every task would make the product unprofitable.",
      "Multichannel: email, LinkedIn, SMS and WhatsApp share neither limits nor tone.",
    ],
    decisions: [
      {
        titre: "Multi-model routing per task type",
        texte:
          "Each task type goes to the model chosen for it in a per-tenant routing table, through OpenRouter. The eu_only legal lock is automatic and fails closed; the cost/quality trade-off is set by the operator, task by task — that is what separates an LLM integration from a product that keeps its margin.",
      },
      {
        titre: "Canvas campaign orchestration",
        texte:
          "Workflows are built visually, personas are generated from supplied documents, and multichannel sequencing runs through the Lemlist API.",
      },
      {
        titre: "Sending leaves from the clients' own mailboxes",
        texte:
          "Clients' Office 365 mailboxes are connected at the sending executor, not behind a shared relay: deliverability belongs to the sender, and the product carries no application-side OAuth.",
      },
      {
        titre: "Client catalogue collection",
        texte:
          "Each client's catalogue is collected with Scrapy, in a repository separate from the product: prospecting emails and messages adapt to current offers without manual entry.",
      },
      {
        titre: "Agentic assistant and internal library",
        texte:
          "A fixed-toolset assistant, conversation persisted per tenant and per campaign, every outbound action gated by human confirmation — and an in-house component library so the interface stays coherent as the product grows.",
      },
    ],
    parc: [
      "TypeScript",
      "React",
      "Vite",
      "Hono",
      "Turborepo / pnpm",
      "Supabase",
      "PostgreSQL — RLS & partitioning",
      "pgmq · pg_cron",
      "Zod",
      "Vitest",
      "OpenRouter",
      "Lemlist",
      "Sentry",
      "Vercel",
    ],
    captures: [
      {
        src: "/reach-up/01-dashboard.webp",
        alt: "Reach-Up operator dashboard: prospecting indicators, tenant table, governance log and assistant console.",
        legende: "The operator dashboard — multi-tenant steering, compliance and assistant. Client names redacted.",
      },
      {
        src: "/reach-up/02-campagne.webp",
        alt: "Reach-Up campaign view: multichannel workflow sequence with open and reply rates per step.",
        legende: "A campaign as a sequence — the multichannel execution workflow, step by step. Client names redacted.",
      },
    ],
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
  /* Voir le commentaire de la fiche FR : réécrite au ticket 14
     (issue GitHub #2) depuis le support du tech talk — agrégats seuls,
     source dite, plus de « en production ». */
  {
    slug: "prediction-memoire",
    unite: "U-03",
    nom: "Memory usage prediction",
    sousTitre: "Machine learning against memory over-allocation in bioinformatics pipelines",
    jp: "メモリ予測",
    cadre: "Sophia Genetics",
    periode: "2025.04 → 2025.09",
    etat: "Delivered",
    contexte:
      "In a bioinformatics pipeline, every task requests a memory allocation before it starts. The incumbent system — a lookup table in 100 MB bins on the largest input file size, updated only upwards — is very safe and very pessimistic: roughly 1200 TB of RAM over-allocated in three months. The internship put learned models against it. The code stayed at Sophia Genetics; this file draws on the end-of-internship tech talk deck.",
    contraintes: [
      "Being wrong downwards costs more than being wrong upwards: a failed task costs the whole analysis, waste only costs cloud.",
      "The incumbent system fails zero tasks: beating it on waste without creating failures is the entire trade-off.",
      "The input is a raw execution log, to be rebuilt per task, per sample and per partition before learning anything.",
    ],
    decisions: [
      {
        titre: "One model per task type",
        texte:
          "The executor's daily logs become weekly per-cluster datasets, then features — largest input file size, sample sizes and count, gene panel size, memory and CPU history. Each task type gets its own model, not one global model averaging different behaviours.",
      },
      {
        titre: "Tree ensembles, chosen to explain themselves",
        texte:
          "Decision Trees and Random Forest discarded at pre-analysis; XGBoost, CatBoost and LightGBM compared in depth. Gradient boosting is kept for its interpretability: each feature's weight reads out as SHAP values, and the largest input file size dominates.",
      },
      {
        titre: "An asymmetric loss against under-prediction",
        texte:
          "A custom loss function penalises under-prediction more than over-prediction, with a weight factor swept on a log scale to find the balance zone between task failure and wasted RAM.",
      },
      {
        titre: "A score in money rather than a metric",
        texte:
          "Loss = c_fail · F + c_waste · W: the cost of a failure (human and infra) against the price of a wasted VM gigabyte-second. Models are compared in money, not abstract metrics.",
      },
    ],
    parc: ["Python", "Pandas / NumPy", "scikit-learn", "XGBoost", "LightGBM", "CatBoost", "SHAP", "Matplotlib / Seaborn / Plotly", "Azure Blob Storage"],
    resultat:
      "On the task families studied, total reserved memory is divided by two to ten depending on the family — under-prediction staying at a few percent on the largest volumes — per the tech talk deck. The internship delivers the comparative study and the baseline; the prediction microservice is designed, not deployed.",
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
    /* Voir le commentaire de la fiche FR : IBKR déplacé en « prévu »,
       quatre morceaux d'architecture ajoutés (ticket 20 / issue #7). */
    contexte:
      "A bot running several strategies in parallel on fake money, with the cockpit needed to understand what it does before trusting it with anything real.",
    contraintes: [
      "A strategy that wins in backtest does not necessarily win in the market: paper trading is the only honest measure.",
      "Going to real money is irreversible: the switch must be an act, not a setting — today, real money is not wired at all.",
    ],
    decisions: [
      {
        titre: "Paper trading first",
        texte:
          "Alpaca executes on a paper account; TradingView picks the universe of symbols, and market bars decide the entries. Each strategy holds its own account and its own keys — never a fallback onto another's.",
      },
      {
        titre: "The backtest replays the same code as live",
        texte:
          "One money cycle, broker-neutral: historical replay goes through the same contract as real execution. What gets tested is what will run — not a reimplementation drifting in silence.",
      },
      {
        titre: "Zero Python dependencies",
        texte:
          "The bot runs on the pure standard library, REST adapter included. No dependency to break, no supply chain to watch for a process that touches money.",
      },
      {
        titre: "A deployed cockpit, behind a key",
        texte:
          "A bot without reporting is a black box that loses money politely. The cockpit — nine screens, deployed — says what each strategy did and why, behind an access key.",
      },
      {
        titre: "An independent watchdog",
        texte:
          "A separate process watches the age of both trading loops' logs and alerts once per incident. The watcher does not share the fate of the watched.",
      },
      {
        titre: "Built-in lessons and an abbreviation dictionary",
        texte: "The domain is dense with jargon: the tool explains it instead of assuming it is known.",
      },
    ],
    parc: ["Python — pure stdlib", "Alpaca (paper, IEX data)", "TradingView", "Vercel", "bash / systemd"],
    prevu: ["IBKR — the move to real money, through a deliberate, separate switch"],
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
          "The Guill Corp in 2023 — aviation data filtering interface — then Sophia Genetics in 2025 — machine learning against memory over-allocation (U-03). The second is documented as a unit file.",
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
          "The Sophia Genetics internship — machine learning against memory over-allocation (U-03) — runs over the same period: what the master's teaches, the pipeline puts to the test.",
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
