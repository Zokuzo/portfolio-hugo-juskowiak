# Cards projets, morph au clic, fiches formation — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le clic vers une fiche `/work/[slug]` joue un morph (View Transitions), les cards de la feuille 04 deviennent entièrement cliquables avec schémas animés au survol, et la formation reçoit quatre fiches détaillées sur le gabarit existant.

**Architecture:** Le composant React `ViewTransition` (vendu par Next 16.3, aucune dépendance nouvelle) nomme `fiche-<slug>` la card côté liste et l'en-tête `fp-head` côté fiche ; le navigateur anime le morph dans les deux sens. Tout le reste est du CSS dans `planche.css` et des données dans `projets.ts` / `parcours.ts` / `dict.ts` — le gabarit `FicheProjet` reste l'unique composant de fiche et choisit ses libellés selon un champ `genre`.

**Tech Stack:** Next.js 16.3 (App Router), React `ViewTransition` (canary vendu par Next), framer-motion (existant), CSS pur. Pas de nouvelle dépendance.

**Spec:** `docs/superpowers/specs/2026-08-05-cards-transitions-design.md`

## Global Constraints

- **Jamais `git add -A`** : l'arbre est en CRLF contre un HEAD en LF, un add global réécrit 16 fichiers. Toujours ajouter les fichiers un par un.
- **Aucune chaîne visible en dur dans les composants** : tout passe par `dict.ts` (libellés) ou `projets.ts`/`parcours.ts` (enregistrements), FR **et** EN systématiquement.
- **Commentaires en français**, dans le style du dépôt : ils expliquent le POURQUOI, pas le quoi.
- **Aucun fait inventé dans le contenu** : les fiches formation ne disent que ce que `parcours.ts` et le cursus public permettent d'affirmer. Dates, états et résultats sont **à valider par Hugo** à la revue de la tâche 4.
- **`.at-coupe` ne s'anime jamais** : le tronçon tireté dit « vanne fermée, argent réel non branché ». Un flux qui y circule dirait le contraire.
- Gestionnaire de paquets : **npm** (package-lock.json). Build : `npm run build`.
- Le bloc auto-généré de `AGENTS.md` et les fichiers déjà modifiés du dépôt ne font pas partie de ce travail : ne pas les committer.
- `prefers-reduced-motion: reduce` coupe toute animation ajoutée (morph, flux, pulse).

---

### Task 1: Socle ViewTransition — types canary, CSS de transition, en-tête de fiche nommé

**Files:**
- Create: `react-canary.d.ts` (racine du dépôt)
- Modify: `components/proto/fiche-projet.tsx` (import + enveloppe de `fp-head`)
- Modify: `app/planche.css` (nouvelle section en fin de fichier, après la ligne 3593)

**Interfaces:**
- Consumes: rien.
- Produces: la convention de nommage **`fiche-${slug}`** (côté fiche) et la classe de transition **`.morph`** — les tâches 2 et 5 nomment leurs éléments de liste avec exactement `fiche-${slug}` et les props `share="morph" default="none"`.

- [ ] **Step 1: Activer les types canary de React**

Le runtime React vendu par Next exporte `ViewTransition`, mais le paquet `react` épinglé en 19.2.0 ne porte pas ses types : ils vivent dans `@types/react/canary.d.ts` et ne s'activent que par référence explicite. Créer `react-canary.d.ts` à la racine (le glob `**/*.ts` du tsconfig le ramasse) :

```ts
/* Le composant ViewTransition existe dans le React vendu par Next
   (App Router = canal canary), mais pas dans les types stables de
   react@19.2 : cette référence active sa déclaration, rien d'autre. */
/// <reference types="react/canary" />
```

- [ ] **Step 2: Nommer l'en-tête de la fiche**

Dans `components/proto/fiche-projet.tsx` :

Ajouter l'import (ligne 3, à côté de `useState`) :

```tsx
import { useState, ViewTransition } from "react"
```

Envelopper le `<header className="fp-head">` existant (lignes 60–97) — le contenu du header ne change pas d'un caractère :

```tsx
{/* L'en-tête porte le nom de transition : la card cliquée sur une
    feuille et cet en-tête sont LE MÊME objet pour le navigateur,
    qui anime position et taille entre les deux. Sans support
    View Transitions, la navigation reste une navigation. */}
<ViewTransition name={`fiche-${p.slug}`} share="morph" default="none">
  <header className="fp-head">
    ...contenu existant inchangé...
  </header>
</ViewTransition>
```

- [ ] **Step 3: CSS des transitions de vue**

Ajouter en **fin** de `app/planche.css` (après le bloc `.voiture` / reduced-motion, ligne 3593) :

```css
/* ------------------------------------------------------------
   TRANSITIONS DE VUE — le morph card → fiche
   La card nommée sur une feuille et l'en-tête de la fiche portent
   le même nom de transition : le navigateur anime position et
   taille, aller et retour. Sans support, navigation normale —
   aucun code de repli à écrire.
   ------------------------------------------------------------ */

/* L'overlay de transition gobe les clics pendant l'animation :
   on le rend transparent aux événements, la page reste vivante. */
::view-transition {
  pointer-events: none;
}
::view-transition-group(.morph) {
  animation-duration: 400ms;
  animation-timing-function: var(--ease);
}
/* Le flou en vol masque l'interpolation de pixels entre deux
   compositions très différentes — recette du guide Next embarqué. */
::view-transition-image-pair(.morph) {
  animation-name: vt-flou;
}
@keyframes vt-flou {
  30% {
    filter: blur(3px);
  }
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

- [ ] **Step 4: Vérifier que le build passe**

Run: `npm run build`
Expected: build vert, les cinq pages `/work/*` sortent en statique comme avant. Si TS râle sur `ViewTransition`, la référence canary du Step 1 n'est pas ramassée — vérifier que `react-canary.d.ts` est bien à la racine.

- [ ] **Step 5: Commit**

```bash
git add react-canary.d.ts components/proto/fiche-projet.tsx app/planche.css
git commit -m "Le socle des transitions de vue — l'en-tête de fiche porte son nom"
```

---

### Task 2: Morph côté listes — cards de l'atelier et produits de l'expérience

**Files:**
- Modify: `components/proto/atelier.tsx:145-198` (la boucle `liste.map`)
- Modify: `components/proto/experience.tsx:113-133` (la boucle `e.produits.map`)

**Interfaces:**
- Consumes: la convention `fiche-${slug}` + `share="morph" default="none"` de la tâche 1.
- Produces: la classe **`at-a-fiche`** sur les cards A1/A2 (la tâche 3 s'y accroche pour le stretched link et le hover).

- [ ] **Step 1: Envelopper les cards de l'atelier**

Dans `components/proto/atelier.tsx`, ajouter l'import :

```tsx
import { ViewTransition } from "react"
```

Réécrire la boucle (lignes 145–198). La card devient une variable ; seules celles qui ont une fiche sont nommées — et gagnent la classe `at-a-fiche` :

```tsx
{liste.map((p: ProjetPerso, i) => {
  const Schema = SCHEMAS[p.code]
  const carte = (
    <motion.article
      key={p.code}
      className={`at-projet${p.fiche ? " at-a-fiche" : ""}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
    >
      ...corps existant inchangé (at-cadre, at-corps, liens)...
    </motion.article>
  )
  /* Seules les cards à fiche portent un nom de transition : nommer
     les autres créerait des paires fantômes sans destination. */
  return p.fiche ? (
    <ViewTransition key={p.code} name={`fiche-${p.fiche}`} share="morph" default="none">
      {carte}
    </ViewTransition>
  ) : (
    carte
  )
})}
```

Note : `ViewTransition` ne crée **aucun élément DOM** — les enfants de `.at-grille` restent des `<article>`, la grille ne bouge pas.

- [ ] **Step 2: Envelopper les produits de l'expérience**

Dans `components/proto/experience.tsx`, même import, même motif autour du `<li className="xp-produit">` (lignes 114–132) :

```tsx
{e.produits.map((p) => {
  const ligne = (
    <li key={p.code} className="xp-produit">
      ...corps existant inchangé...
    </li>
  )
  return p.fiche ? (
    <ViewTransition key={p.code} name={`fiche-${p.fiche}`} share="morph" default="none">
      {ligne}
    </ViewTransition>
  ) : (
    ligne
  )
})}
```

- [ ] **Step 3: Vérifier le morph au navigateur**

Run: `npm run dev`, puis (Playwright MCP ou à la main) ouvrir `http://localhost:3000`, descendre à la feuille 04, cliquer « Fiche détaillée → » sur Eternal.
Expected: la card se prolonge en morph dans l'en-tête de `/work/eternal` (~400 ms, léger flou en vol). Retour navigateur : morph inverse. Même chose depuis la feuille 02 (reach_up → `/work/prospector`). Chrome/Chromium requis — Firefox ancien = navigation sèche, c'est le comportement attendu.

- [ ] **Step 4: Vérifier le build**

Run: `npm run build`
Expected: vert.

- [ ] **Step 5: Commit**

```bash
git add components/proto/atelier.tsx components/proto/experience.tsx
git commit -m "Les cards et produits à fiche se prolongent en morph dans leur fiche"
```

---

### Task 3: Cards feuille 04 — cliquables partout, hiérarchie, schémas vivants au survol

**Files:**
- Modify: `app/planche.css:3325-3473` (section `04 — ATELIER`)

**Interfaces:**
- Consumes: la classe `at-a-fiche` posée par la tâche 2.
- Produces: le motif CSS **stretched link** (`::after` en `inset: 0` + `z-index`) — la tâche 5 le reproduit pour `.etu-fiche-lien`.

- [ ] **Step 1: Stretched link + hover de card**

Dans la section `04 — ATELIER` de `planche.css`, modifier `.at-projet` (ligne 3333) et ajouter à sa suite :

```css
.at-projet {
  display: flex;
  flex-direction: column;
  background: var(--ink-2);
  /* Ancre du lien étiré : le ::after du lien fiche se cale sur la
     card entière, pas sur le lien. */
  position: relative;
}
/* La card à fiche est cliquable PARTOUT : le lien « fiche
   détaillée » s'étire sur toute la card par son ::after. Le lien
   lui-même reste non positionné, sinon l'::after se calerait sur
   lui au lieu de la card. */
.at-a-fiche .at-fiche-lien::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
}
/* Les liens dépôts et leur réserve repassent AU-DESSUS du lien
   étiré : sans ça, la card avalerait leurs clics. */
.at-liens {
  position: relative;
  z-index: 2;
}
/* « Bordure vers --paper, léger lift » dit la spec. La bordure y
   est ; le lift, non : framer-motion laisse un transform inline sur
   la card après son entrée, un translate CSS au hover perdrait.
   L'outline + les couleurs suffisent à dire « cliquable ». */
.at-a-fiche:hover,
.at-a-fiche:focus-within {
  outline: var(--rule) solid var(--paper);
  outline-offset: calc(-1 * var(--rule));
}
.at-a-fiche:hover .at-fiche-lien,
.at-a-fiche:focus-within .at-fiche-lien {
  color: var(--paper);
  border-color: var(--paper);
}
```

(`.at-liens` a déjà une déclaration ligne 3434 — ajouter `position` et `z-index` à la règle existante plutôt que d'en créer une seconde.)

- [ ] **Step 2: La flèche glisse**

Remplacer le bloc existant `.xp-fiche-lien, .at-fiche-lien` hover (lignes 3116–3134) par une version qui fait aussi glisser la flèche (le `<span aria-hidden>→</span>` des liens) :

```css
.xp-fiche-lien,
.at-fiche-lien {
  display: inline-block;
  margin-top: 0.6rem;
  color: var(--g-300);
  text-decoration: none;
  border-bottom: var(--rule) solid var(--line-3);
  padding-bottom: 2px;
  transition:
    color 0.3s var(--ease),
    border-color 0.3s var(--ease);
}
.xp-fiche-lien span,
.at-fiche-lien span {
  display: inline-block;
  transition: transform 0.3s var(--ease);
}
.xp-fiche-lien:hover,
.xp-fiche-lien:focus-visible,
.at-fiche-lien:hover,
.at-fiche-lien:focus-visible {
  color: var(--paper);
  border-color: var(--paper);
}
.xp-fiche-lien:hover span,
.at-fiche-lien:hover span,
.at-a-fiche:hover .at-fiche-lien span {
  transform: translateX(4px);
}
```

- [ ] **Step 3: Les schémas s'animent au survol**

Ajouter après les règles SVG existantes (autour de la ligne 3398, après `.at-t-d`) :

```css
/* Au survol, chaque schéma joue SA forme : le flux circule sur les
   fils, la vanne et le filtre pulsent, le nœud actif s'allume. Le
   tronçon coupé ne bouge JAMAIS : la vanne est fermée, un flux qui
   y circulerait dirait le contraire de la fiche. */
.at-projet:hover .at-fil:not(.at-coupe) {
  stroke-dasharray: 6 4;
  animation: at-flux 1.1s linear infinite;
}
@keyframes at-flux {
  to {
    stroke-dashoffset: -10;
  }
}
.at-projet:hover .at-vanne,
.at-projet:hover .at-filtre {
  animation: at-pulse 1.6s var(--ease) infinite;
}
@keyframes at-pulse {
  50% {
    stroke-width: 2.4;
  }
}
.at-projet:hover .at-actif {
  fill: var(--sig-hot);
}
@media (prefers-reduced-motion: reduce) {
  .at-projet:hover .at-fil:not(.at-coupe),
  .at-projet:hover .at-vanne,
  .at-projet:hover .at-filtre {
    animation: none;
  }
}
```

Et ajouter la transition de fill à la règle `.at-noeud` existante (ligne 3364) :

```css
.at-noeud {
  fill: var(--ink-2);
  stroke: var(--g-500);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  transition: fill 0.3s var(--ease);
}
```

- [ ] **Step 4: Hiérarchie du corps de card**

Modifier trois règles existantes et en ajouter une :

`.at-ligne-code` (ligne 3406) — resserrée en cartouche, plus d'air dessous :

```css
.at-ligne-code {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin: 0 0 0.9rem;
}
```

Nouvelle règle `.at-code`, juste après :

```css
/* Le code en cartouche : une référence de plan se lit comme une
   plaque, pas comme un mot du paragraphe. Même fond que .fp-mark. */
.at-code {
  padding: 2px 6px;
  background: rgba(226, 232, 240, 0.08);
  color: var(--g-100);
}
```

`.at-nom` (ligne 3415) — un cran plus affirmé :

```css
.at-nom {
  margin: 0;
  font-size: clamp(1.25rem, 2.4vw, 1.7rem);
  font-weight: 700;
  font-stretch: 86%;
  text-transform: uppercase;
  letter-spacing: -0.005em;
}
```

- [ ] **Step 5: Vérifier au navigateur**

Run: `npm run dev`, feuille 04.
Expected: clic n'importe où sur la card Eternal → `/work/eternal` (morph) ; le lien « Dépôt ↗ » de La Provence reste cliquable et ouvre GitHub, pas la fiche ; hover d'une card à fiche → liseré + lien blanc + flèche qui glisse ; hover de chaque card → son schéma s'anime, **le tronçon tireté de la vanne (A2) reste immobile** ; les cards A3/A4 n'ont ni liseré ni curseur pointer.

- [ ] **Step 6: Vérifier le build et committer**

Run: `npm run build` — Expected: vert.

```bash
git add app/planche.css
git commit -m "Les cards à fiche se cliquent partout et les schémas jouent leur forme au survol"
```

---

### Task 4: Données formation — quatre fiches, libellés par genre, index honnête

**Files:**
- Modify: `components/proto/projets.ts` (type + 4 enregistrements FR + 4 EN)
- Modify: `components/proto/dict.ts` (4 clés `fp*`, 2 clés `idx*` retouchées)
- Modify: `components/proto/fiche-projet.tsx` (libellés selon `genre`)
- Modify: `app/work/[slug]/page.tsx` (commentaire de compte)

**Interfaces:**
- Consumes: le gabarit `FicheProjet` (tâche 1) tel quel.
- Produces: les slugs **`cpge`, `estia`, `hokkaido`, `mbds`** dans `SLUGS` et le champ **`genre?: "formation"`** sur `Projet` — la tâche 5 pointe ces slugs depuis `parcours.ts`.

- [ ] **Step 1: Le champ `genre` sur le type `Projet`**

Dans `components/proto/projets.ts`, ajouter au type (après `courant?`, ligne 35) :

```ts
  /* Une fiche formation partage le gabarit des fiches projet mais
     pas leur grille de lecture : un cursus n'a ni contraintes ni
     décisions techniques, il a un programme et des travaux. Le
     genre choisit les libellés — absent = projet. */
  genre?: "formation"
```

- [ ] **Step 2: Les quatre fiches FR**

Ajouter à la fin du tableau `FR` (après `trading-agent`, ligne 217), dans l'ordre chronologique F-01 → F-04. **Contenu dérivé de `parcours.ts` et du cursus public uniquement — dates, états et résultats à valider par Hugo à la revue de cette tâche.**

```ts
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
```

- [ ] **Step 3: Les quatre fiches EN**

Ajouter à la fin du tableau `EN` (après `trading-agent`, ligne 393) — mêmes slugs, mêmes unités, même `genre` :

```ts
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
```

- [ ] **Step 4: Les libellés dans `dict.ts`**

Après `fpParc` (ligne 601) :

```ts
  /* Les fiches formation partagent le gabarit des fiches projet
     mais pas leur grille de lecture : un cursus n'a ni contraintes
     ni décisions techniques. Mêmes emplacements, autres mots. */
  fpFicheFormation: { fr: "Fiche formation", en: "Education file" },
  fpProgramme: { fr: "Programme", en: "Curriculum" },
  fpTravaux: { fr: "Travaux marquants", en: "Notable work" },
  fpCompetences: { fr: "Compétences & outils", en: "Skills & tools" },
```

Et retoucher les deux clés d'annexes (lignes 606–610) — l'index récite `projets(lang)` en entier, il va donc lister neuf pièces :

```ts
  idxAnnexes: { fr: "Annexes — fiches détaillées", en: "Annexes — detailed files" },
  idxAnnexesNote: {
    fr: "Neuf pièces documentées séparément — cinq projets, quatre cursus.",
    en: "Nine pieces documented separately — five projects, four programmes.",
  },
```

- [ ] **Step 5: `FicheProjet` choisit ses libellés**

Dans `components/proto/fiche-projet.tsx`, après le garde-fou `if (!p) return null` (ligne 35) :

```tsx
  /* Une fiche formation garde le mobilier mais change de grille de
     lecture : programme au lieu de contraintes, travaux au lieu de
     décisions, compétences au lieu de parc. Les clés sont figées en
     `as const` pour rester dans l'union des clés du dictionnaire. */
  const libelles =
    p.genre === "formation"
      ? ({ fiche: "fpFicheFormation", bloc2: "fpProgramme", bloc3: "fpTravaux", parc: "fpCompetences" } as const)
      : ({ fiche: "fpFiche", bloc2: "fpContraintes", bloc3: "fpDecisions", parc: "fpParc" } as const)
```

Puis remplacer les quatre usages :
- ligne 77 : `{t(lang, "fpFiche")}` → `{t(lang, libelles.fiche)}`
- ligne 110 : `{t(lang, "fpContraintes")}` → `{t(lang, libelles.bloc2)}`
- ligne 124 : `{t(lang, "fpDecisions")}` → `{t(lang, libelles.bloc3)}`
- ligne 151 : `{t(lang, "fpParc")}` → `{t(lang, libelles.parc)}`

Les commentaires de bloc (« Les contraintes AVANT les décisions… ») restent : ils sont vrais pour le genre projet, qui reste le cas nominal.

- [ ] **Step 6: Le commentaire de compte dans la route**

`app/work/[slug]/page.tsx`, ligne 5 — le commentaire dit « Les cinq fiches » :

```ts
/* Toutes les fiches sont connues à la compilation : elles sortent
   en statique, comme le reste du document. Aucune donnée n'arrive
   d'un serveur à l'exécution. */
```

- [ ] **Step 7: Vérifier build et pages**

Run: `npm run build`
Expected: vert, et la sortie liste `/work/cpge`, `/work/estia`, `/work/hokkaido`, `/work/mbds` en plus des cinq existantes.

Run: `npm run dev`, ouvrir `/work/estia`.
Expected: en-tête « F-02 · Fiche formation », blocs « Programme », « Travaux marquants », « Compétences & outils » ; bascule EN → « Education file », « Curriculum »… ; `/work/eternal` inchangée (« Contraintes », « Décisions techniques », « Parc ») ; l'index (feuille 00) liste neuf annexes sous « Annexes — fiches détaillées ».

- [ ] **Step 8: Revue de contenu par Hugo**

Présenter les huit textes (dates, états, résultats, katakana/kanji des `jp`) à Hugo pour validation factuelle avant de committer. Corriger ce qu'il signale.

- [ ] **Step 9: Commit**

```bash
git add components/proto/projets.ts components/proto/dict.ts components/proto/fiche-projet.tsx "app/work/[slug]/page.tsx"
git commit -m "Quatre fiches formation en F-0n — même gabarit, autre grille de lecture"
```

---

### Task 5: Feuille 03 — les entrées d'études deviennent cliquables

**Files:**
- Modify: `components/proto/parcours.ts` (type `Etude` + 8 entrées)
- Modify: `components/proto/etudes.tsx` (lien + ViewTransition + classe)
- Modify: `app/planche.css` (section `03 — ÉTUDES` + règles de lien partagées)

**Interfaces:**
- Consumes: les slugs `cpge`/`estia`/`hokkaido`/`mbds` de la tâche 4 ; la convention `fiche-${slug}` de la tâche 1 ; le motif stretched link de la tâche 3.
- Produces: rien — dernière pièce fonctionnelle.

- [ ] **Step 1: Le champ `fiche` sur le type `Etude`**

Dans `components/proto/parcours.ts`, ajouter au type `Etude` (après `excursion?`, ligne 64) :

```ts
  /* Slug de la fiche détaillée en /work/[slug] — même mécanique que
     les produits et l'atelier. */
  fiche?: string
```

Puis poser le slug sur les huit entrées (FR **et** EN, mêmes valeurs) :
- `E1` : `fiche: "cpge",`
- `E2` : `fiche: "estia",`
- `E3` : `fiche: "hokkaido",`
- `E4` : `fiche: "mbds",`

(Une ligne par entrée, à la suite de `rail:` — par exemple `code: "E1", …, rail: 0, fiche: "cpge",`.)

- [ ] **Step 2: L'entrée devient cliquable**

Dans `components/proto/etudes.tsx`, ajouter les imports :

```tsx
import Link from "next/link"
import { ViewTransition } from "react"
```

Réécrire la boucle de la liste (lignes 146–170) :

```tsx
<ol className="etu-liste">
  {liste
    .slice()
    .sort((a, b) => a.debut - b.debut)
    .map((e, i) => {
      const entree = (
        <motion.li
          key={e.code}
          className={`etu-entree${e.fiche ? " etu-a-fiche" : ""}`}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="mono mono-xs dim etu-code">{e.code}</span>
          <div>
            <h3 className="etu-nom">{e.nom}</h3>
            <p className="mono mono-xs dim etu-intitule">
              {e.intitule}
              {e.lieu ? ` · ${e.lieu}` : ""}
            </p>
            <p className="mono mono-sm dim-2 etu-texte">{e.texte}</p>
            {/* Le lien n'apparaît que si la fiche existe — même règle
                que la feuille 02 : un renvoi vers une page vide est
                pire qu'une absence. */}
            {e.fiche && (
              <Link href={`/work/${e.fiche}`} className="mono mono-xs etu-fiche-lien">
                {t(lang, "xpFiche")} <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </motion.li>
      )
      return e.fiche ? (
        <ViewTransition key={e.code} name={`fiche-${e.fiche}`} share="morph" default="none">
          {entree}
        </ViewTransition>
      ) : (
        entree
      )
    })}
</ol>
```

- [ ] **Step 3: Le CSS des entrées**

Dans la section `03 — ÉTUDES` de `planche.css`, modifier `.etu-entree` (ligne 3293) :

```css
.etu-entree {
  display: grid;
  grid-template-columns: 2.4rem minmax(0, 1fr);
  gap: 0 clamp(0.6rem, 1.6vw, 1.2rem);
  padding: clamp(0.9rem, 2.2vh, 1.4rem) 0;
  border-bottom: var(--rule) solid var(--line);
  /* Ancre du lien étiré, comme .at-projet. */
  position: relative;
}
/* L'entrée à fiche se clique PARTOUT — même motif que la feuille 04. */
.etu-a-fiche .etu-fiche-lien::after {
  content: "";
  position: absolute;
  inset: 0;
}
.etu-a-fiche:hover,
.etu-a-fiche:focus-within {
  background: rgba(226, 232, 240, 0.03);
}
.etu-a-fiche:hover .etu-fiche-lien,
.etu-a-fiche:focus-within .etu-fiche-lien {
  color: var(--paper);
  border-color: var(--paper);
}
```

Et ajouter `.etu-fiche-lien` aux règles partagées de la tâche 3 (section expérience, lignes ~3116) — chaque sélecteur `.at-fiche-lien` y gagne son jumeau `.etu-fiche-lien` :

```css
.xp-fiche-lien,
.at-fiche-lien,
.etu-fiche-lien { … }

.xp-fiche-lien span,
.at-fiche-lien span,
.etu-fiche-lien span { … }

.xp-fiche-lien:hover,
.xp-fiche-lien:focus-visible,
.at-fiche-lien:hover,
.at-fiche-lien:focus-visible,
.etu-fiche-lien:hover,
.etu-fiche-lien:focus-visible { … }

.xp-fiche-lien:hover span,
.at-fiche-lien:hover span,
.etu-fiche-lien:hover span,
.at-a-fiche:hover .at-fiche-lien span,
.etu-a-fiche:hover .etu-fiche-lien span { … }
```

(Les corps de règles ne changent pas — seuls les sélecteurs s'allongent.)

- [ ] **Step 4: Vérifier au navigateur**

Run: `npm run dev`, feuille 03.
Expected: chaque entrée affiche « Fiche détaillée → », se clique partout, hover = fond léger + lien blanc ; clic sur MBDS → morph vers `/work/mbds` ; retour → morph inverse vers l'entrée de liste.

- [ ] **Step 5: Vérifier le build et committer**

Run: `npm run build` — Expected: vert.

```bash
git add components/proto/parcours.ts components/proto/etudes.tsx app/planche.css
git commit -m "La formation se clique — quatre entrées, quatre fiches, même morph"
```

---

### Task 6: Contrôle final — retour arrière, reduced-motion, mobile

**Files:**
- Modify (si besoin) : `components/proto/atelier.tsx`, `components/proto/etudes.tsx`, `components/proto/experience.tsx`

**Interfaces:**
- Consumes: tout ce qui précède.
- Produces: la décision documentée sur la ré-animation d'entrée au retour (risque nommé dans la spec).

- [ ] **Step 1: Juger le retour arrière à l'œil**

Run: `npm run dev`. Depuis la feuille 04, ouvrir `/work/eternal`, revenir (bouton retour ET lien « Retour au document »). Observer la card à l'arrivée.
Expected: si le morph retour se pose proprement sur la card, ne rien faire. Si la card clignote (le morph atterrit sur un élément encore à opacité 0 le temps que framer rejoue son entrée), appliquer le correctif du Step 2 — sinon le sauter.

- [ ] **Step 2 (conditionnel): Couper la ré-animation d'entrée des seuls éléments nommés**

Le principe : au retour de la fiche, le morph doit atterrir sur un élément déjà posé, pas sur un fantôme à opacité zéro. On ne coupe l'animation d'entrée que là où un nom de transition atterrit — les éléments sans fiche gardent la leur.

Dans `atelier.tsx` (le `motion.article` de la card) :

```tsx
initial={p.fiche ? false : { opacity: 0, y: 12 }}
```

Dans `etudes.tsx` (le `motion.li` de l'entrée) :

```tsx
initial={e.fiche ? false : { opacity: 0, y: 10 }}
```

Dans `experience.tsx`, le framer est au niveau EMPLOYEUR (le `motion.article`, pas les `<li>` produits) — si le clignotement s'y voit aussi, couper l'entrée des employeurs dont un produit porte une fiche :

```tsx
initial={e.produits.some((p) => p.fiche) ? false : { opacity: 0, y: 14 }}
```

- [ ] **Step 3: Reduced-motion**

Au navigateur (Playwright : émulation `prefers-reduced-motion: reduce`, ou DevTools → Rendering) :
Expected: navigation vers une fiche = bascule instantanée sans morph ; hover des cards = liseré et couleurs OK mais **aucun** flux ni pulse sur les schémas.

- [ ] **Step 4: Mobile**

Fenêtre à 375 px de large :
Expected: les cards en une colonne restent cliquables partout, les liens dépôts ↗ répondent au premier tap, les entrées d'études se cliquent, rien ne déborde en horizontal.

- [ ] **Step 5: Build final et commit (si le Step 2 a modifié des fichiers)**

Run: `npm run build` — Expected: vert.

```bash
git add components/proto/atelier.tsx components/proto/etudes.tsx components/proto/experience.tsx
git commit -m "Le morph retour atterrit sur des cards posées, pas sur des fantômes"
```
