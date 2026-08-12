import type { Lang } from "./dict"

/* ==================================================================
   LES QUATRE CHAPITRES DE /PARCOURS — le récit, pas la fiche.
   Contenu repris des quatre entrées `genre:"formation"` de projets.ts
   et RESTRUCTURÉ pour la page-monde (spec 2026-08-11, chantier #6) :
   - `seuil` était la seule chair nouvelle du premier jet — la frontière
     racontée (quitter le rail vers Hokkaido, la seconde voie MBDS) ;
   - `lien`, `photos` et `marques` (tâche 6) en sont une seconde vague :
     l'école, le tirage photographique, les homologations. Chair neuve
     elle aussi, comme `seuil` — hors table de correspondance avec
     projets.ts, garde-fou de fidélité inclus ;
   - le reste est le contenu des fiches, renommé pour le récit
     (contraintes → programme, decisions → travaux, parc → compétences).
   Jusqu'à la bascule (phase 4 du spec), les fiches /work/<slug> vivent
   encore : les deux modules coexistent, puis projets.ts perd ses
   formations et CE fichier devient la source unique.
   La structure reste quatre chapitres à plat ; la vraie chronologie
   (le rail, l'échappée, le contrepoint) vit dans la chair : périodes
   en chevauchement affichées sans honte, seuils qui racontent.
   ================================================================== */

/* L'OS de la page : quatre ancres bêtes et solides, ordre
   chronologique d'entrée. Les redirections de la phase 4 viseront
   exactement ces fragments — elles ne bougent plus. */
export const ANCRES = ["cpge", "estia", "hokkaido", "mbds"] as const

export type Chapitre = {
  ancre: (typeof ANCRES)[number]
  numero: string // "01"…"04" — ordre chronologique d'ENTRÉE
  nom: string
  intitule: string
  jp: string
  cadre: string
  periode: string // chevauchements assumés — la chair dit la vraie chronologie
  etat: string
  seuil: string // comment on ENTRE dans ce chapitre — la frontière racontée
  contexte: string
  programme: string[]
  travaux: { titre: string; texte: string }[]
  competences: string[]
  resultat?: string
  lien?: { role: string; url: string } // l'école — role traduit, url identique FR/EN
  photos?: { src: string; alt: string; legende: string }[] // src identiques FR/EN, alt/legende traduits
  marques?: { src: string; alt: string }[] // [0] logotype (cartouche) · [1] homologations (nomenclature)
}

const FR: Chapitre[] = [
  /* cpge — contenu : projets.ts l.349-374 */
  {
    ancre: "cpge",
    numero: "01",
    nom: "CPGE",
    intitule: "Classe préparatoire TSI — deux ans de fondations avant le code",
    jp: "準備学級",
    cadre: "Lycée Touchard-Washington, Le Mans",
    periode: "2020.09 → 2022.06",
    etat: "Validée",
    seuil:
      "Le parcours s'ouvre ici : deux ans de discipline pure au tableau noir, avant la première ligne de code du métier.",
    contexte:
      "Deux ans de mathématiques, de physique et de sciences de l'ingénieur avant toute ligne de code. La filière TSI mène aux concours d'écoles d'ingénieurs par le volume de travail et la méthode — c'est là que la discipline de travail a pris sa forme.",
    programme: [
      "Mathématiques : analyse, algèbre, probabilités — le socle formel.",
      "Physique et sciences de l'ingénieur : mécanique, électricité, automatique.",
      "Rythme de concours : colles hebdomadaires, devoirs surveillés, correction publique.",
    ],
    travaux: [
      {
        titre: "Apprendre à être évalué souvent",
        texte:
          "La prépa n'enseigne pas que des théorèmes : elle apprend à retravailler vite ce qui vient d'être corrigé. Ce réflexe — l'itération courte sur sa propre production — sert tous les jours en ingénierie logicielle.",
      },
    ],
    competences: ["Mathématiques", "Physique", "Sciences de l'ingénieur", "Méthode de travail"],
    resultat: "Admission en cycle ingénieur à l'ESTIA.",
  },
  /* estia — modèle complet : */
  {
    ancre: "estia",
    numero: "02",
    nom: "ESTIA",
    intitule: "Master d'ingénieur trilingue — le rail principal du parcours",
    jp: "エスティア",
    cadre: "ESTIA, Bidart",
    periode: "2022.09 → 2025.10",
    etat: "Diplômé",
    seuil:
      "Les fondations posées, le rail principal commence — trois ans qui portent tout le reste : l'échappée au Japon et le second master en contrepoint.",
    contexte:
      "Cycle ingénieur mené en trois langues de travail — français, anglais, espagnol. C'est le rail principal du parcours : il porte l'excursion à Hokkaido et le double diplôme MBDS, et il se termine en octobre 2025.",
    programme: [
      "Formation généraliste : informatique, génie industriel, systèmes embarqués, gestion de projet.",
      "Trois langues de travail — les cours changent de langue, pas les exigences.",
      "Alternance de périodes académiques et de stages en entreprise.",
    ],
    travaux: [
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
    competences: ["Informatique", "Génie industriel", "FR / EN / ES", "Gestion de projet"],
    resultat:
      "Diplôme d'ingénieur obtenu en 2025, avec un semestre d'échange au Japon et un second master mené en parallèle.",
    lien: { role: "Site de l'école", url: "https://www.estia.fr/" },
    photos: [
      {
        src: "/parcours/estia/batiment-cyanotype.webp",
        alt: "Le bâtiment de l'ESTIA à Bidart — coque blanche aux courbes de navire, parvis en gradins",
        legende: "Le campus de Bidart — la vue photographique, passée dans la chimie du chapitre",
      },
    ],
    marques: [
      { src: "/parcours/estia/logo-estia-encre.webp", alt: "ESTIA — Institute of Technology" },
      {
        src: "/parcours/estia/homologations-encre.webp",
        alt: "Habilitation CTI · Groupe ISAE, partenaire · Conférence des grandes écoles",
      },
    ],
  },
  /* hokkaido — contenu : projets.ts l.410-435 (PAS de resultat) */
  {
    ancre: "hokkaido",
    numero: "03",
    nom: "Hokkaido",
    intitule: "Semestre d'échange — Information & Ingénierie",
    jp: "北海道",
    cadre: "Imperial University of Hokkaido, Japon",
    periode: "2024.03 → 2024.07",
    etat: "Validé",
    seuil:
      "Printemps 2024 : le rail ESTIA ne s'arrête pas — et pourtant on le quitte. Cinq mois de parenthèse à Sapporo, dedans et ailleurs à la fois.",
    contexte:
      "Un semestre à travailler dans une autre norme, une autre langue et un autre rapport au détail. C'est l'excursion du schéma de la feuille 03 : le trait quitte le rail principal et y revient — on ne revient pas identique d'un pays qui documente autrement.",
    programme: [
      "Cours d'information et d'ingénierie, en anglais.",
      "Une autre norme de travail et de documentation, à apprendre sur place.",
      "La vie quotidienne dans une langue non maîtrisée — l'ingénierie continue quand même.",
    ],
    travaux: [
      {
        titre: "Documenter ce qu'on croyait évident",
        texte:
          "Les conventions ne sont pas des évidences universelles : ce qui va sans dire en France s'écrit au Japon, et inversement. Ce réflexe est resté — il se voit jusque dans ce site.",
      },
    ],
    competences: ["Information & Ingénierie", "Anglais de travail", "Normes & documentation"],
  },
  /* mbds — contenu : projets.ts l.436-467 */
  {
    ancre: "mbds",
    numero: "04",
    nom: "MBDS",
    intitule: "Master en Data Science — MBDS MIAGE, mené en parallèle du cycle ingénieur",
    jp: "データ科学",
    cadre: "Université Côte d'Azur",
    periode: "2024.09 → 2025.10",
    etat: "Diplômé",
    seuil:
      "Rentrée 2024 : une seconde voie s'ouvre à côté du rail, pas après lui. Un an durant, les deux masters courent ensemble.",
    contexte:
      "Second diplôme mené EN PARALLÈLE du cycle ingénieur, pas après. De septembre 2024 à octobre 2025, les deux rails avancent ensemble — c'est la cote du schéma de la feuille 03, sa seule affirmation chiffrée.",
    programme: [
      "Data science : statistiques, machine learning, bases de données.",
      "MIAGE : l'informatique appliquée à la gestion, pas la théorie seule.",
      "Deux cursus de front — l'arbitrage du temps ne figure pas au syllabus, il est pourtant la première épreuve.",
    ],
    travaux: [
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
    competences: ["Statistiques", "Machine learning", "Bases de données", "Python"],
    resultat: "Second master obtenu, en parallèle de la dernière année du cycle ingénieur.",
  },
]

const EN: Chapitre[] = [
  /* cpge : l.731-756 */
  {
    ancre: "cpge",
    numero: "01",
    nom: "CPGE",
    intitule: "TSI preparatory class — two years of foundations before the code",
    jp: "準備学級",
    cadre: "Lycée Touchard-Washington, Le Mans",
    periode: "2020.09 → 2022.06",
    etat: "Completed",
    seuil:
      "The journey opens here: two years of pure discipline at the blackboard, before the first line of professional code.",
    contexte:
      "Two years of mathematics, physics and engineering science before a single line of code. The TSI track leads to engineering school entrance exams through sheer volume of work and method — this is where the working discipline took its shape.",
    programme: [
      "Mathematics: analysis, algebra, probability — the formal base.",
      "Physics and engineering science: mechanics, electricity, control.",
      "Exam rhythm: weekly oral examinations, supervised tests, public correction.",
    ],
    travaux: [
      {
        titre: "Learning to be assessed often",
        texte:
          "Prépa does not only teach theorems: it teaches reworking quickly what has just been corrected. That reflex — short iteration on your own output — serves every day in software engineering.",
      },
    ],
    competences: ["Mathematics", "Physics", "Engineering science", "Working method"],
    resultat: "Admission to the ESTIA engineering cycle.",
  },
  /* estia : l.757-791 */
  {
    ancre: "estia",
    numero: "02",
    nom: "ESTIA",
    intitule: "Trilingual engineering master's — the main rail of the journey",
    jp: "エスティア",
    cadre: "ESTIA, Bidart",
    periode: "2022.09 → 2025.10",
    etat: "Graduated",
    seuil:
      "Foundations laid, the main rail begins — three years that carry everything else: the escape to Japan and the second master's in counterpoint.",
    contexte:
      "Engineering cycle run in three working languages — French, English, Spanish. This is the main rail: it carries the Hokkaido excursion and the MBDS double degree, and it ends in October 2025.",
    programme: [
      "Generalist curriculum: computer science, industrial engineering, embedded systems, project management.",
      "Three working languages — the courses switch language, the requirements do not.",
      "Alternating academic periods and industry internships.",
    ],
    travaux: [
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
    competences: ["Computer science", "Industrial engineering", "FR / EN / ES", "Project management"],
    resultat:
      "Engineering degree obtained in 2025, with an exchange semester in Japan and a second master's run in parallel.",
    lien: { role: "School website", url: "https://www.estia.fr/" },
    photos: [
      {
        src: "/parcours/estia/batiment-cyanotype.webp",
        alt: "The ESTIA building in Bidart — white hull-like curves, stepped forecourt",
        legende: "The Bidart campus — the photographic view, run through the chapter's chemistry",
      },
    ],
    marques: [
      { src: "/parcours/estia/logo-estia-encre.webp", alt: "ESTIA — Institute of Technology" },
      {
        src: "/parcours/estia/homologations-encre.webp",
        alt: "CTI accreditation · ISAE Group, partner · Conférence des grandes écoles",
      },
    ],
  },
  /* hokkaido : l.792-817 (pas de resultat) */
  {
    ancre: "hokkaido",
    numero: "03",
    nom: "Hokkaido",
    intitule: "Exchange semester — Information & Engineering",
    jp: "北海道",
    cadre: "Imperial University of Hokkaido, Japan",
    periode: "2024.03 → 2024.07",
    etat: "Completed",
    seuil:
      "Spring 2024: the ESTIA rail does not stop — and yet this is where it is left. A five-month parenthesis in Sapporo, inside and elsewhere at once.",
    contexte:
      "A semester working to another standard, another language and another relationship with detail. It is the excursion on the sheet 03 diagram: the line leaves the main rail and returns — you do not come back the same from a country that documents differently.",
    programme: [
      "Information and engineering coursework, in English.",
      "Another standard of work and documentation, learned on site.",
      "Daily life in a language not mastered — the engineering carries on regardless.",
    ],
    travaux: [
      {
        titre: "Documenting what seemed obvious",
        texte:
          "Conventions are not universal evidences: what goes without saying in France is written down in Japan, and vice versa. That reflex stayed — it shows all the way into this site.",
      },
    ],
    competences: ["Information & Engineering", "Working English", "Standards & documentation"],
  },
  /* mbds : l.818-849 */
  {
    ancre: "mbds",
    numero: "04",
    nom: "MBDS",
    intitule: "MSc Data Science — MBDS MIAGE, run in parallel with the engineering cycle",
    jp: "データ科学",
    cadre: "Université Côte d'Azur",
    periode: "2024.09 → 2025.10",
    etat: "Graduated",
    seuil:
      "Autumn 2024: a second track opens beside the rail, not after it. For a year, the two master's degrees run side by side.",
    contexte:
      "A second degree run IN PARALLEL with the engineering cycle, not after it. From September 2024 to October 2025 both rails advance together — that is the dimension line on the sheet 03 diagram, its only numbered claim.",
    programme: [
      "Data science: statistics, machine learning, databases.",
      "MIAGE: computing applied to management, not theory alone.",
      "Two programmes at once — time arbitration is not on the syllabus, yet it is the first test.",
    ],
    travaux: [
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
    competences: ["Statistics", "Machine learning", "Databases", "Python"],
    resultat: "Second master's obtained, in parallel with the final year of the engineering cycle.",
  },
]

const PAR_LANGUE: Record<Lang, Chapitre[]> = { fr: FR, en: EN }

export function chapitres(lang: Lang): Chapitre[] {
  return PAR_LANGUE[lang]
}
