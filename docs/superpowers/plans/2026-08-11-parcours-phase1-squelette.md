# /parcours phase 1 — squelette + données — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**But :** la page `/parcours` EXISTE, laide et vraie — couverture sobre, quatre chapitres à plat sur leurs ancres, les trois besoins de navigation — selon `docs/superpowers/specs/2026-08-11-parcours-quatre-univers-design.md` (chantier #6), phase 1 du séquençage §5.

**Architecture :** un module de données `chapitres.ts` (le récit, pas la fiche — seule chair nouvelle : les `seuil`, la frontière racontée) sous garde-fou de parité FR/EN ; une route serveur mince `app/parcours/page.tsx` qui porte les premières métadonnées par page du dépôt et charge une feuille CSS propre à la page ; un composant client `PageParcours` sur le modèle de `FicheProjet` (état `lang` local, `<Smooth />`, pas de décor du site). Aucune animation en phase 1 — c'est voulu : les univers arrivent planche par planche.

**Stack :** rien de nouveau. React 19.2 / Next 16.3.0 App Router (docs embarquées `node_modules/next/dist/docs/` — ce Next diffère des données d'entraînement, `params` est une Promise, `metadata` = Server Components seulement), jiti pour le garde-fou (devDependency existante), playwright-core pour le contrôle navigateur (devDependency existante).

## Décisions de plan (issues du spec, figées ici)

1. **Redirections 301 : PAS dans cette phase.** Le §5.1 du spec les liste dans le squelette mais le §5.4 tranche le séquençage : « les quatre fiches `/work` restent en vie jusqu'à ce que `/parcours` soit prêt à les remplacer, **redirections comprises** ». Une redirection active en phase 1 tuerait les fiches finies au profit d'une page laide. Elles arrivent avec la bascule (phase 4).
2. **CSS : nouvelle feuille `app/parcours/parcours.css`, importée par `app/parcours/page.tsx`.** La doc embarquée (`01-getting-started/11-css.md`, « Good to know ») : un CSS global s'importe depuis n'importe quelle page de `app/`, mais **n'est jamais retiré à la navigation** — donc TOUT sélecteur y est scopé `.pc-` (préfixe vérifié libre dans planche.css et les composants). La page-monde ne charge pas ses octets sur l'accueil ; l'accueil ne reçoit aucune règle fuyante.
3. **`chapitres.ts` coexiste avec les entrées formation de `projets.ts` jusqu'à la phase 4** — c'est le séquençage du spec (retrait « EN DERNIER »). La duplication est transitoire et assumée ; à la bascule, `projets.ts` maigrit et `chapitres.ts` devient la source unique.
4. **Libellés de sections réutilisés** : `fpContexte`, `fpProgramme`, `fpTravaux`, `fpCompetences`, `fpResultat`, `fpRetour`, `fpRetourDocument` existent déjà en FR/EN (dict.ts:657-702). Trois clés nouvelles seulement (`pcTitre`, `pcArc`, `pcSommaire`).
5. **Aucune couleur nouvelle en phase 1** → zéro paire nouvelle dans `contrastes.mjs` (les jetons du site, déjà gatés, portent la page sobre). **Aucune animation** → `controle-reduce` et le banc n'ont rien de neuf à mesurer ; les gates par univers arrivent en phase 2. La sortie de chaque chapitre vise `/#carte-<ancre>` — ces ancres existent déjà (etudes.tsx:159).
6. **Thème** : `ThemeToggle` monté tel quel sur la couverture — sa première apparition hors accueil, aucun changement du composant (il lit/écrit `html.clair` + localStorage, l'anti-FOUC du layout couvre déjà `/parcours`).

## Contraintes globales

- **Un seul invariant de design : LES DONNÉES** (spec §« Contexte » pt 4). `chapitres.ts` = enregistrements, `dict.ts` = chaînes plates — la frontière documentée en tête de `projets.ts:6-11` s'applique.
- **Aucune chaîne visible en dur dans les composants ; FR ET EN systématiquement** (contrat dict.ts:26-30).
- **Tout sélecteur de `parcours.css` commence par `.pc-`** — la feuille survit à la navigation, rien ne doit fuir sur l'accueil.
- `.proto-root` ne reçoit JAMAIS `transform`, `filter`, `perspective`, `will-change`, `contain:paint` (layout.tsx:51-56) — on n'y touche pas.
- `globals.css` ne déclare AUCUNE couleur, rayon, police (commentaire l.1-26) — on n'y touche pas.
- **Aucune dépendance nouvelle.**
- Next 16 : `params` est une `Promise` ; `export const metadata` en Server Component seulement ; métadonnées FR en dur (même règle que le layout : la langue est un état client, le HTML est statique).
- **Jamais `git add -A`** ; commits en français, style du dépôt, `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- `$SCRATCH` = scratchpad de session, hors dépôt.

## Structure de fichiers

| Fichier | Rôle |
|---|---|
| `components/proto/chapitres.ts` (nouveau) | les 4 chapitres FR/EN — le récit restructuré, `ANCRES`, `chapitres(lang)` |
| `tools/controles/garde-fous-chapitres.mjs` (nouveau) | parité FR/EN + solidité des ancres, exit 1 si une assertion casse |
| `components/proto/dict.ts` | + 3 clés `pcTitre` / `pcArc` / `pcSommaire` |
| `components/proto/page-parcours.tsx` (nouveau) | `PageParcours` — couverture sobre + 4 chapitres à plat |
| `app/parcours/page.tsx` (nouveau) | route serveur, métadonnées FR, import du CSS |
| `app/parcours/parcours.css` (nouveau) | squelette scopé `.pc-` |

## Hors périmètre de CE plan

Les univers (phase 2, un plan par univers APRÈS sa planche gatée par Hugo) ; les frontières (phase 3) ; la bascule feuille 03 + index + retrait des entrées formation + redirections 301 (phase 4) ; toute retouche de l'accueil ou des fiches `/work`.

---

### Tâche 1 : les chapitres — données FR/EN sous garde-fou

**Files:**
- Create: `tools/controles/garde-fous-chapitres.mjs`
- Create: `components/proto/chapitres.ts`

**Interfaces:**
- Consumes: `type Lang` de `./dict` (`"fr" | "en"`, dict.ts:1) ; le contenu des 4 entrées `genre:"formation"` de `components/proto/projets.ts` (FR l.349-467, EN l.731-849) — **copie verbatim, champ par champ**, selon la table de correspondance ci-dessous.
- Produces: `export const ANCRES = ["cpge", "estia", "hokkaido", "mbds"] as const` ; `export type Chapitre` (champs exacts ci-dessous) ; `export function chapitres(lang: Lang): Chapitre[]`. La Tâche 2 consomme les trois.

**Correspondance `Projet` (formation) → `Chapitre`** — le contenu ne se fork pas, il se renomme :

| Champ `Chapitre` | Source |
|---|---|
| `ancre` | `slug` (inchangé — les redirections de phase 4 viseront ces fragments) |
| `numero` | `"01"`…`"04"` — ordre chronologique d'entrée (cpge, estia, hokkaido, mbds) |
| `nom`, `jp`, `cadre`, `periode`, `etat` | copie verbatim |
| `intitule` | `sousTitre` verbatim |
| `seuil` | **NEUF** — écrit dans ce plan, verbatim ci-dessous |
| `contexte` | `contexte` verbatim |
| `programme` | `contraintes` verbatim (mêmes chaînes, même ordre) |
| `travaux` | `decisions` verbatim (`{titre, texte}` inchangés) |
| `competences` | `parc` verbatim |
| `resultat` | `resultat` verbatim (absent pour hokkaido — dans les DEUX langues) |
| *(abandonné)* | `unite` (F-01…F-04 : la nomenclature de l'index, pas du récit), `genre`, `courant`, `prevu`, `captures` |

Lignes sources exactes dans `projets.ts` : cpge FR 349-374 / EN 731-756 ; estia FR 375-409 / EN 757-791 ; hokkaido FR 410-435 / EN 792-817 ; mbds FR 436-467 / EN 818-849.

**Les huit `seuil` (contenu neuf, verbatim — la seule chair nouvelle autorisée : « là où le récit l'exige », spec § Hors périmètre) :**

| ancre | FR | EN |
|---|---|---|
| cpge | « Le parcours s'ouvre ici : deux ans de discipline pure au tableau noir, avant la première ligne de code du métier. » | "The journey opens here: two years of pure discipline at the blackboard, before the first line of professional code." |
| estia | « Les fondations posées, le rail principal commence — trois ans qui portent tout le reste : l'échappée au Japon et le second master en contrepoint. » | "Foundations laid, the main rail begins — three years that carry everything else: the escape to Japan and the second master's in counterpoint." |
| hokkaido | « Printemps 2024 : le rail ESTIA ne s'arrête pas — et pourtant on le quitte. Cinq mois de parenthèse à Sapporo, dedans et ailleurs à la fois. » | "Spring 2024: the ESTIA rail does not stop — and yet this is where it is left. A five-month parenthesis in Sapporo, inside and elsewhere at once." |
| mbds | « Rentrée 2024 : une seconde voie s'ouvre à côté du rail, pas après lui. Un an durant, les deux masters courent ensemble. » | "Autumn 2024: a second track opens beside the rail, not after it. For a year, the two master's degrees run side by side." |

- [ ] **Step 1 : écrire le garde-fou (il doit ÉCHOUER — le module n'existe pas)**

```js
/* Contrôle des garde-fous de `components/proto/chapitres.ts`, hors navigateur.
   La page /parcours met en scène ces enregistrements sans les vérifier :
   c'est ICI que la parité FR/EN et la solidité des ancres se prouvent —
   quatre ancres bêtes et solides, les redirections de la phase 4 viseront
   exactement ces fragments.

   node tools/controles/garde-fous-chapitres.mjs
   Code de sortie 1 si une seule assertion casse. */

import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { interopDefault: true })
const { chapitres, ANCRES } = await jiti.import("../../components/proto/chapitres.ts")

let echecs = 0
const dire = (ok, quoi, detail) => {
  if (!ok) echecs++
  console.log(`${ok ? "OK  " : "FAIL"}  ${quoi}${detail ? `  →  ${detail}` : ""}`)
}

/* --- l'OS de la page : quatre ancres, ordre chronologique d'entrée --- */
dire(
  JSON.stringify(ANCRES) === JSON.stringify(["cpge", "estia", "hokkaido", "mbds"]),
  "ANCRES = cpge, estia, hokkaido, mbds",
  ANCRES.join(", "),
)

const fr = chapitres("fr")
const en = chapitres("en")
dire(fr.length === 4 && en.length === 4, "quatre chapitres dans chaque langue", `${fr.length} FR / ${en.length} EN`)

/* --- parité FR/EN : mêmes ancres, même ordre, mêmes comptes --- */
for (let i = 0; i < 4; i++) {
  const f = fr[i]
  const e = en[i]
  dire(f.ancre === ANCRES[i] && e.ancre === ANCRES[i], `chapitre ${i} sur son ancre`, `${f.ancre} / ${e.ancre}`)
  dire(
    f.numero === e.numero && f.nom === e.nom && f.jp === e.jp && f.periode === e.periode,
    `${f.ancre} : numero/nom/jp/periode identiques FR-EN`,
  )
  dire(f.programme.length === e.programme.length, `${f.ancre} : programme au même compte`, `${f.programme.length} / ${e.programme.length}`)
  dire(f.travaux.length === e.travaux.length, `${f.ancre} : travaux au même compte`, `${f.travaux.length} / ${e.travaux.length}`)
  dire(f.competences.length === e.competences.length, `${f.ancre} : compétences au même compte`, `${f.competences.length} / ${e.competences.length}`)
  dire(Boolean(f.resultat) === Boolean(e.resultat), `${f.ancre} : resultat des deux côtés ou d'aucun`)
  for (const [chapitre, langue] of [[f, "FR"], [e, "EN"]]) {
    for (const champ of ["seuil", "contexte", "intitule", "cadre", "etat"]) {
      const v = chapitre[champ]
      dire(typeof v === "string" && v.trim().length > 0, `${f.ancre} : ${champ} ${langue} non vide`)
    }
  }
}

process.exit(echecs ? 1 : 0)
```

- [ ] **Step 2 : le lancer, constater l'échec attendu**

Run: `node tools/controles/garde-fous-chapitres.mjs`
Expected: erreur de résolution (module `chapitres.ts` introuvable), exit ≠ 0.

- [ ] **Step 3 : écrire `components/proto/chapitres.ts`**

Squelette exact — les entrées `estia` FR sont écrites en entier ci-dessous (modèle) ; les sept autres suivent la table de correspondance avec le contenu copié verbatim depuis `projets.ts` aux lignes indiquées, plus leur `numero` et leur `seuil` de la table des seuils :

```ts
import type { Lang } from "./dict"

/* ==================================================================
   LES QUATRE CHAPITRES DE /PARCOURS — le récit, pas la fiche.
   Contenu repris des quatre entrées `genre:"formation"` de projets.ts
   et RESTRUCTURÉ pour la page-monde (spec 2026-08-11, chantier #6) :
   - `seuil` est la seule chair nouvelle — la frontière racontée
     (quitter le rail vers Hokkaido, la seconde voie MBDS) ;
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
}

const FR: Chapitre[] = [
  /* cpge — contenu : projets.ts l.349-374 */
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
  },
  /* hokkaido — contenu : projets.ts l.410-435 (PAS de resultat) */
  /* mbds — contenu : projets.ts l.436-467 */
]

const EN: Chapitre[] = [
  /* cpge : l.731-756 · estia : l.757-791 · hokkaido : l.792-817 (pas de
     resultat) · mbds : l.818-849 — mêmes numero, seuils EN de la table. */
]

const PAR_LANGUE: Record<Lang, Chapitre[]> = { fr: FR, en: EN }

export function chapitres(lang: Lang): Chapitre[] {
  return PAR_LANGUE[lang]
}
```

Attention : les entrées FR de `projets.ts` portent des commentaires de provenance (tickets 11/14/20, issues #2/#7) — **ne pas les copier** ; la provenance de `chapitres.ts` est son en-tête. Les mentions « fiche F-03 » / « fiche F-04 » DANS les textes copiés restent telles quelles (le contenu est l'invariant ; leur réécriture appartient à la phase 4, quand les fiches meurent).

- [ ] **Step 4 : relancer le garde-fou, tout doit passer**

Run: `node tools/controles/garde-fous-chapitres.mjs`
Expected: toutes lignes `OK`, exit 0. En cas de `FAIL` sur un compte : une entrée EN a été tronquée ou réordonnée — corriger la donnée, pas l'assertion.

- [ ] **Step 5 : commit**

```bash
git add components/proto/chapitres.ts tools/controles/garde-fous-chapitres.mjs
git commit -m "Les chapitres précèdent leurs univers — le récit des quatre formations restructuré FR/EN, quatre seuils neufs, la parité sous garde-fou

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Tâche 2 : la page — couverture sobre, quatre ancres, trois besoins

**Files:**
- Modify: `components/proto/dict.ts` (3 clés, à insérer après le bloc `fp*`, ~l.702)
- Create: `components/proto/page-parcours.tsx`
- Create: `app/parcours/page.tsx`
- Create: `app/parcours/parcours.css`

**Interfaces:**
- Consumes: `chapitres(lang)` (Tâche 1) ; `t`, `type Lang` (`./dict`) ; `Smooth` (`./smooth`) ; `ThemeToggle` (`./theme-toggle`) ; clés dict existantes `fpRetour` (« Document »), `fpRetourDocument`, `fpContexte`, `fpProgramme`, `fpTravaux`, `fpCompetences`, `fpResultat`.
- Produces: `export function PageParcours()` (composant client sans props) ; route `/parcours` statique ; classes `.pc-*`.

- [ ] **Step 1 : les trois clés dict (FR et EN)**

Dans `components/proto/dict.ts`, après `fpCompetences` (l.702) :

```ts
  /* ---------------- /parcours — couverture (chantier #6) ---------------- */
  pcTitre: { fr: "Parcours", en: "Journey" },
  pcArc: {
    fr: "La discipline → le métier → le souffle → la modernité",
    en: "Discipline → craft → breath → modernity",
  },
  pcSommaire: { fr: "Sommaire des chapitres", en: "Chapter contents" },
```

- [ ] **Step 2 : le composant `components/proto/page-parcours.tsx`**

```tsx
"use client"

/* ==================================================================
   /PARCOURS — phase 1 : le squelette (spec 2026-08-11, chantier #6).
   La page EXISTE, laide et vraie : couverture sobre, quatre chapitres
   à plat sur leurs ancres, les trois besoins de navigation (sortir,
   langue, thème). Monde à part : pas de décor du site ici — pas de
   World, pas de Voiture, pas de frame. Rien n'anime encore, à
   dessein : chaque univers arrive derrière sa planche.
   ================================================================== */

import { useState } from "react"
import Link from "next/link"
import { Smooth } from "./smooth"
import { ThemeToggle } from "./theme-toggle"
import { chapitres } from "./chapitres"
import { t, type Lang } from "./dict"

export function PageParcours() {
  const [lang, setLang] = useState<Lang>("fr")
  const liste = chapitres(lang)

  return (
    <main lang={lang} className="pc-root">
      <Smooth />

      <header className="pc-couverture">
        <div className="pc-barre">
          <Link href="/" className="mono mono-xs dim pc-sortir">
            <span aria-hidden="true">←</span> {t(lang, "fpRetour")}
          </Link>
          <div className="pc-lang">
            <button type="button" className="mono mono-xs" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>
              FR
            </button>
            <button type="button" className="mono mono-xs" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
          </div>
          <ThemeToggle lang={lang} />
        </div>

        <h1 className="pc-titre">{t(lang, "pcTitre")}</h1>
        <p className="mono mono-sm dim pc-arc">{t(lang, "pcArc")}</p>

        <nav aria-label={t(lang, "pcSommaire")}>
          <ol className="pc-sommaire">
            {liste.map((c) => (
              <li key={c.ancre}>
                <a href={`#${c.ancre}`} className="pc-sommaire-lien">
                  <span className="mono mono-xs dim">{c.numero}</span>
                  <span className="pc-sommaire-nom">{c.nom}</span>
                  <span className="mono mono-xs dim-2">{c.periode}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      {liste.map((c) => (
        <section key={c.ancre} id={c.ancre} className="pc-chapitre" aria-labelledby={`pc-titre-${c.ancre}`}>
          <p className="pc-seuil dim">{c.seuil}</p>

          <header className="pc-tete">
            <p className="mono mono-xs dim">
              {c.numero} · {c.periode} · {c.etat}
            </p>
            <h2 id={`pc-titre-${c.ancre}`} className="pc-nom">
              {c.nom}
            </h2>
            <p className="jp dim pc-jp">{c.jp}</p>
            <p className="pc-intitule">{c.intitule}</p>
            <p className="mono mono-xs dim-2">{c.cadre}</p>
          </header>

          <h3 className="mono mono-sm dim">{t(lang, "fpContexte")}</h3>
          <p>{c.contexte}</p>

          <h3 className="mono mono-sm dim">{t(lang, "fpProgramme")}</h3>
          <ul className="pc-liste">
            {c.programme.map((ligne) => (
              <li key={ligne}>{ligne}</li>
            ))}
          </ul>

          <h3 className="mono mono-sm dim">{t(lang, "fpTravaux")}</h3>
          {c.travaux.map((tr) => (
            <div key={tr.titre} className="pc-travail">
              <h4>{tr.titre}</h4>
              <p>{tr.texte}</p>
            </div>
          ))}

          <h3 className="mono mono-sm dim">{t(lang, "fpCompetences")}</h3>
          <ul className="mono mono-xs pc-liste">
            {c.competences.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>

          {c.resultat && (
            <>
              <h3 className="mono mono-sm dim">{t(lang, "fpResultat")}</h3>
              <p>{c.resultat}</p>
            </>
          )}

          <p>
            <Link href={`/#carte-${c.ancre}`} className="mono mono-xs dim pc-retour">
              <span aria-hidden="true">←</span> {t(lang, "fpRetourDocument")}
            </Link>
          </p>
        </section>
      ))}
    </main>
  )
}
```

- [ ] **Step 3 : la route `app/parcours/page.tsx`**

```tsx
import type { Metadata } from "next"
import { PageParcours } from "@/components/proto/page-parcours"
import "./parcours.css"

/* FR en dur — même règle que le layout : le HTML est statique, la
   langue est un état client, le title ne bascule pas. Premières
   métadonnées PAR PAGE du dépôt (spec §1 : « Métadonnées propres »). */
export const metadata: Metadata = {
  title: "Parcours | Hugo Juskowiak",
  description:
    "Quatre chapitres — la discipline (CPGE), le métier (ESTIA), le souffle (Hokkaido), la modernité (MBDS). Le parcours d'un ingénieur full stack et IA.",
}

export default function Page() {
  return <PageParcours />
}
```

- [ ] **Step 4 : la feuille `app/parcours/parcours.css`**

```css
/* ==================================================================
   /PARCOURS — squelette (phase 1, chantier #6).
   Feuille chargée par app/parcours/page.tsx seulement — mais JAMAIS
   retirée à la navigation (doc CSS App Router embarquée) : tout
   sélecteur d'ici est scopé .pc- pour ne rien fuir sur l'accueil.
   Monde à part en devenir : aucun décor du site, aucune couleur
   nouvelle — les jetons de .proto-root portent la page sobre, les
   univers les remplaceront chapitre par chapitre, planche par
   planche. Rien n'anime : reduce n'a rien à couper ici.
   ================================================================== */

.pc-root {
  max-width: 68rem;
  margin: 0 auto;
  padding: calc(var(--gutter) * 1.5) var(--gutter) 8rem;
}

/* ---- la barre : sortir / langue / thème ---- */
.pc-barre {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.pc-barre > :last-child {
  margin-left: auto;
}
.pc-lang {
  display: flex;
  gap: 0.6rem;
}
.pc-lang button {
  opacity: 0.55;
}
.pc-lang button[aria-pressed="true"] {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 0.3em;
}

/* ---- la couverture sobre ---- */
.pc-couverture {
  min-height: 55vh;
}
.pc-titre {
  margin-top: 4rem;
  font-family: var(--f-display);
  font-stretch: 84%;
  font-weight: 700;
  font-size: clamp(2.6rem, 7vw, 4.6rem);
  line-height: 1;
  text-transform: uppercase;
}
.pc-arc {
  margin-top: 0.75rem;
}
.pc-sommaire {
  margin-top: 3.5rem;
  list-style: none;
  padding: 0;
}
.pc-sommaire-lien {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding-block: 0.55rem;
  border-top: var(--rule) solid var(--line);
}
.pc-sommaire li:last-child .pc-sommaire-lien {
  border-bottom: var(--rule) solid var(--line);
}
.pc-sommaire-nom {
  font-family: var(--f-display);
  font-stretch: 84%;
  font-weight: 600;
  font-size: 1.3rem;
}
.pc-sommaire-lien > :last-child {
  margin-left: auto;
}

/* ---- les chapitres, à plat sur leurs ancres ---- */
.pc-chapitre {
  max-width: 46rem;
  margin-top: 24vh;
  /* L'ancre atterrit DANS le chapitre : l'en-tête posé sous le bord,
     jamais collé — et de la marge pour les zones de frontière à
     venir (phase 3). */
  scroll-margin-block-start: 10vh;
  display: grid;
  gap: 1.1rem;
}
.pc-seuil {
  font-style: italic;
  max-width: 34rem;
}
.pc-tete {
  display: grid;
  gap: 0.35rem;
}
.pc-nom {
  font-family: var(--f-display);
  font-stretch: 84%;
  font-weight: 700;
  font-size: clamp(1.9rem, 4.5vw, 3rem);
  line-height: 1.02;
  text-transform: uppercase;
}
.pc-chapitre h3 {
  margin-top: 1.4rem;
}
.pc-chapitre h4 {
  font-weight: 600;
}
.pc-liste {
  padding-left: 1.1rem;
  display: grid;
  gap: 0.4rem;
}
.pc-liste li {
  list-style: "— ";
}
.pc-travail {
  display: grid;
  gap: 0.25rem;
}
```

- [ ] **Step 5 : build vert, la route sort statique avec ses quatre ancres**

Run: `npm run build`
Expected: build vert, `/parcours` listée statique (`○` ou `●`) dans la sortie.

Run: `grep -c 'id="cpge"\|id="estia"\|id="hokkaido"\|id="mbds"' .next/server/app/parcours.html`
Expected: `4` (les quatre ancres dans le HTML pré-rendu, FR par défaut).

Run: `grep -o "<title>[^<]*</title>" .next/server/app/parcours.html`
Expected: `<title>Parcours | Hugo Juskowiak</title>`.

- [ ] **Step 6 : commit**

```bash
git add components/proto/dict.ts components/proto/page-parcours.tsx app/parcours/page.tsx app/parcours/parcours.css
git commit -m "La page /parcours existe, laide et vraie — couverture sobre, quatre chapitres à plat, les trois besoins de navigation

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Tâche 3 : contrôle navigateur — ancres, langue, thème, clavier

**Files:**
- Create: `$SCRATCH/controle-parcours.mjs` (jetable, hors dépôt — rien à committer si tout passe)

**Interfaces:**
- Consumes: le build de la Tâche 2 servi en production locale ; les classes `.pc-sortir`, `.pc-lang`, `.pc-sommaire`, les ids `#cpge…#mbds` ; `ThemeToggle` (boutons NUIT/JOUR dans `div.langtoggle`).
- Produces: un verdict — si un FAIL sort, la correction se fait dans les fichiers des Tâches 1-2 et se commite en amendement de leur périmètre.

- [ ] **Step 1 : servir le build**

```bash
npx next start -p 3210 &
```

(Le build de la Tâche 2 Step 5 est déjà là. Pour tuer le serveur ensuite : `fuser -k 3210/tcp` — `pkill next-server` ne marche pas sur cette machine, comm tronqué.)

- [ ] **Step 2 : écrire `$SCRATCH/controle-parcours.mjs`**

Même socle que `tools/controles/controle-reduce.mjs` (playwright-core, binaire via `CHROME`, `--no-sandbox` ticket 21) :

```js
/* Contrôle jetable — /parcours phase 1 : ancres, langue, thème, clavier.
   node $SCRATCH/controle-parcours.mjs [url]   (défaut http://localhost:3210/parcours)
   CHROME=<chemin d'un Chrome/Chromium> pour un autre binaire. */

import { chromium } from "playwright-core"
import { existsSync } from "node:fs"

const BASE = process.argv[2] ?? "http://localhost:3210/parcours"
const CHROME = process.env.CHROME ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`
if (!existsSync(CHROME)) {
  console.error(`Chrome introuvable (${CHROME}) — passe CHROME=<chemin du binaire>.`)
  process.exit(2)
}

const navigateur = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] })
const page = await navigateur.newPage({ viewport: { width: 1280, height: 900 } })
const erreurs = []
page.on("pageerror", (e) => erreurs.push(String(e).slice(0, 200)))
page.on("console", (m) => {
  if (m.type() === "error") erreurs.push(`console: ${m.text().slice(0, 200)}`)
})

let echecs = 0
const dire = (ok, quoi, detail) => {
  if (!ok) echecs++
  console.log(`${ok ? "OK  " : "FAIL"}  ${quoi}${detail ? `  →  ${detail}` : ""}`)
}

/* --- 1. atterrissage direct par fragment : la section DANS le viewport --- */
for (const ancre of ["cpge", "estia", "hokkaido", "mbds"]) {
  await page.goto(`${BASE}#${ancre}`, { waitUntil: "load" })
  const r = await page.evaluate((a) => {
    const b = document.getElementById(a).getBoundingClientRect()
    return { top: Math.round(b.top), h: innerHeight }
  }, ancre)
  dire(r.top >= -1 && r.top < r.h * 0.5, `#${ancre} atterrit dans son chapitre`, `top ${r.top}px`)
}

/* --- 2. sommaire : le clic mène au chapitre (Lenis anchors:true) --- */
await page.goto(BASE, { waitUntil: "load" })
await page.click('.pc-sommaire a[href="#mbds"]')
await page.waitForTimeout(2000) /* lissage Lenis (lerp 0.085) */
const apres = await page.evaluate(() => ({
  top: Math.round(document.getElementById("mbds").getBoundingClientRect().top),
  h: innerHeight,
}))
dire(Math.abs(apres.top) < apres.h, "clic sommaire → #mbds rejoint", `top ${apres.top}px`)

/* --- 3. langue : EN bascule contenu ET attribut lang --- */
await page.goto(BASE, { waitUntil: "load" })
await page.click('.pc-lang button:text-is("EN")')
const langAttr = await page.getAttribute("main", "lang")
const h1 = (await page.textContent("h1")).trim()
dire(langAttr === "en" && h1 === "Journey", "bascule EN (main[lang] + titre)", `lang=${langAttr}, h1=${h1}`)

/* --- 4. thème : JOUR pose html.clair (et le choix persiste) --- */
await page.goto(BASE, { waitUntil: "load" })
await page.click('.langtoggle button:text-is("JOUR")')
const clair = await page.evaluate(() => ({
  classe: document.documentElement.classList.contains("clair"),
  memo: localStorage.getItem("theme"),
}))
dire(clair.classe && clair.memo === "clair", "JOUR pose html.clair + localStorage", JSON.stringify(clair))

/* --- 5. sortir : le lien vise / --- */
const href = await page.getAttribute(".pc-sortir", "href")
dire(href === "/", "sortir vise /", href)

/* --- 6. clavier : sortir / langue / thème atteignables au Tab --- */
await page.goto(BASE, { waitUntil: "load" })
const touchees = []
for (let i = 0; i < 8; i++) {
  await page.keyboard.press("Tab")
  touchees.push(
    await page.evaluate(() => `${document.activeElement.className}|${document.activeElement.textContent.trim()}`),
  )
}
dire(
  touchees.some((s) => s.includes("pc-sortir")) &&
    touchees.some((s) => s.endsWith("|FR")) &&
    touchees.some((s) => s.endsWith("|NUIT") || s.endsWith("|JOUR")),
  "sortir / langue / thème au clavier (8 premiers Tab)",
  touchees.map((s) => s.split("|")[1]).join(" · "),
)

console.log(`erreurs page/console : ${erreurs.length ? erreurs.join("\n  ") : "(aucune)"}`)
if (erreurs.length) echecs++

await navigateur.close()
process.exit(echecs ? 1 : 0)
```

- [ ] **Step 3 : le lancer**

Run: `node $SCRATCH/controle-parcours.mjs`
Expected: toutes lignes `OK`, aucune erreur console, exit 0.
Si `#<ancre> atterrit` FAIL avec un top très négatif : le `scroll-margin-block-start` de `.pc-chapitre` n'est pas pris — vérifier que l'id est bien sur la `<section className="pc-chapitre">`.
Si la bascule EN FAIL : vérifier que `chapitres("en")` n'est pas vide (garde-fou Tâche 1) et que `pcTitre.en === "Journey"`.

- [ ] **Step 4 : éteindre le serveur, re-vérifier le garde-fou, clore**

```bash
fuser -k 3210/tcp
node tools/controles/garde-fous-chapitres.mjs
```

Expected: garde-fou toujours OK. Si des corrections ont été nécessaires au Step 3, les committer dans le périmètre des fichiers des Tâches 1-2 (message : « La phase 1 tient ses contrôles — <ce qui a été redressé> »), sinon rien à committer.

---

## Vérification finale (avant de fermer la phase 1)

- `npm run build` vert, `/parcours` statique.
- `node tools/controles/garde-fous-chapitres.mjs` → exit 0.
- Contrôle navigateur Tâche 3 → tout OK.
- **Rien d'autre ne bouge** : `git status` ne montre aucun fichier hors des six listés (+ le bloc AGENTS.md que `next dev` régénère, à committer avec le travail s'il réapparaît).
- Les fiches `/work/{cpge,estia,hokkaido,mbds}` répondent toujours (pas de redirection — phase 4).
- Signaler sur l'issue #6 : phase 1 livrée, prochaine étape = planche ESTIA ×2 thèmes, gate à l'œil Hugo.

## Ce que cette phase NE vérifie PAS (et pourquoi)

- **Banc de frames** : rien n'anime en phase 1 (pas de framer, pas de scroll-lié, Lenis seul — déjà mesuré sur les autres pages). Le banc arme ses gates avec le premier univers (phase 2).
- **`contrastes.mjs`** : aucune couleur nouvelle — les paires par univers × thème arrivent avec les planches.
- **`controle-reduce`** : aucune animation à couper ; `Smooth` se coupe déjà seul sous reduce (smooth.tsx:11).
- **Gates à l'œil Hugo** : la couverture se gate sur build de production quand Hugo est en séance — la phase 1 la livre sobre précisément pour que ce gate porte sur la matière, pas sur un placeholder.
