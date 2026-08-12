# /parcours univers CPGE — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**But :** le chapitre `#cpge` de `/parcours` devient l'univers « Style Typographique International / brutalisme de copie » — la planche gatée v1 portée dans la vraie page, FR/EN, NUIT/JOUR, avec ses animations et son interactivité propres (directive Hugo 2026-08-12, addendums du spec `docs/superpowers/specs/2026-08-11-parcours-quatre-univers-design.md`).

**Architecture :** un composant dédié `UniversCpge` branché dans `page-parcours.tsx` via le **`Record UNIVERS[ancre]`** (déclencheur commenté dans le code : « Un Record viendra quand un DEUXIÈME univers existera » — c'est maintenant) ; une feuille `app/parcours/cpge.css` scopée `.uc` ; JOUR sous `html.clair` (mécanisme du site). **Le parti gaté : la grille stricte du typographe, corrigée en rouge par-dessus** — la couche imprimée se cale au quadrillage (18/90 px), seule la couche du correcteur est de travers. Mouvement : l'encre s'écrit, la correction tombe APRÈS coup ; respiration scroll-liée derrière la **porte multiplicative née FERMÉE**. Interactivité : souligner à la règle (JOUR), l'éponge efface (NUIT), le tampon se réimprime. Sous `reduce` et au tactile : tout posé.

**Stack :** `motion/react` (dep existante, patterns ESTIA), Lenis fenêtre, jetons CSS. **Une fonte neuve GATÉE : Caveat (Google Fonts, OFL)** — la main du correcteur seule, chargée par `app/parcours/page.tsx` via `next/font` (zéro octet hors /parcours).

## Valeurs contractuelles (gate planche v1 — addendum du spec, 2e du 2026-08-12)

| Jeton | NUIT (base) | JOUR (`html.clair`) |
|---|---|---|
| `--uc-salle` | `#0c100f` | `#8f9691` |
| `--uc-lumiere` | `none` | radial néon plafonnier (voir CSS Tâche 2) |
| `--uc-copie` | `#1b2422` | `#f2f4ef` |
| `--uc-cadre` | `#333a36` | `transparent` |
| `--uc-structure` | `#eef1ef` (13,966) | `#1d211f` (14,704) |
| `--uc-chair` | `#eef1ef` (craie) | `#1e3f9f` (Bic — 8,365) |
| `--uc-chair-2` | `#9fb0aa` (7,008) | `#44598f` (6,174) |
| `--uc-correction` | `#e89286` (6,722) | `#c0271c` (5,344) |
| `--uc-carreau` | `rgba(238,241,239,.07)` | `rgba(110,130,185,.20)` |
| `--uc-carreau-fort` | `rgba(238,241,239,.14)` | `rgba(110,130,185,.34)` |
| `--uc-fusain` | `rgba(238,241,239,.20)` | `rgba(29,33,31,.14)` |
| `--uc-marge` | `rgba(238,241,239,.22)` | `rgba(198,68,80,.50)` |
| `--uc-halo` | `none` | bandes de néon (voir CSS Tâche 2) |

Composition « copie double dépliée » : géométrie de la planche v1 — support 1240×1880, couche imprimée calée au quadrillage fort (multiples de 90 px), positions convertie en % (÷1240 / ÷1880, le pattern ESTIA), largeurs de pièce en px (rem planche ×16), textes en rem. Pièces NUIT seules : porte-craie, « NE PAS EFFACER » ; JOUR seul : cadre réservé, marges roses, halo néon. Règle : les cadres peuvent se toucher, **les textes jamais**.

## Contraintes globales

- **Les données sont l'invariant** : tout le contenu vient de `chapitres.ts` (`c.seuil/nom/intitule/jp/cadre/periode/etat/contexte/programme/travaux/competences/resultat`) — aucune chaîne de contenu dupliquée. Libellés d'appareil via `dict.ts`, FR **et** EN. `chapitres.ts` et `projets.ts` **intouchés** (CPGE n'a ni lien/photos/marques).
- **Trois besoins de navigation DANS l'univers** : l'en-tête de copie porte langue / thème / sortie (il EST le cartouche de cet univers).
- **Porte multiplicative née FERMÉE (0)** pour tout scroll-lié : le SSR cuit la pose, `reduce` ne voit jamais une frame bouger. Jamais `style={reduit ? undefined : …}`.
- **Mouvement compositor-friendly** : transforms + opacité ; exception comptée : les reveals `clip-path` one-shot de l'écriture (once, jamais par frame de scroll — le banc tranchera, repli = opacité simple).
- **`reduce` + tactile : tout posé** — framer coupé (`{duration:0}` / `initial:false`), interactions pointeur sous `(hover: hover) and (pointer: fine)`, effets CSS hover sous `(prefers-reduced-motion: no-preference)`.
- **Fonction pure du scroll** : le F5 en plein chapitre rend l'état exact.
- Tout sélecteur nouveau commence par `.uc`. `parcours.css`, `estia.css` et les chapitres sobres ne bougent pas (hokkaido/mbds restent sobres).
- Aucune dépendance nouvelle. Fonte : Caveat seule (gatée), via `next/font/google` dans `app/parcours/page.tsx`.
- **Jamais `git add -A`** ; commits français, `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- `$SCRATCH` = scratchpad de session, hors dépôt.
- Navigateur de contrôle : chromium `~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome` + `--no-sandbox` ; headless se déclare clair (forcer `localStorage theme`) ; `fuser -k 3210/tcp` (jamais pkill) ; `mouse.wheel` uniquement ; vérité = sondes `getComputedStyle` ; mesurer APRÈS stabilisation des `whileInView`.

## Structure de fichiers

| Fichier | Changement |
|---|---|
| `components/proto/dict.ts` | + 15 clés `uc*` (appareil de la copie, FR/EN) |
| `tools/controles/contrastes.mjs` | + 9 gates CPGE (NUIT ×4, JOUR ×5, plancher WCAG) |
| `app/parcours/page.tsx` | + fonte Caveat (`--f-correcteur`) + `import "./cpge.css"` |
| `components/proto/univers-cpge.tsx` (nouveau) | l'univers — structure + animations + interactivité |
| `app/parcours/cpge.css` (nouveau) | matière et composition, NUIT base + JOUR sous `html.clair` |
| `components/proto/page-parcours.tsx` | extraction du `Record UNIVERS[ancre]` (cpge + estia) |

## Hors périmètre

Hokkaido / MBDS (chacun attend sa planche) ; les frontières (phase 3) ; la bascule (phase 4) ; toute retouche d'ESTIA, de la couverture ou des redirections ; le contrôle 200 % text-only (différé, consigné en mémoire).

---

### Tâche 1 : l'appareil — clés dict, gates de contraste, la fonte du correcteur

**Files:**
- Modify: `components/proto/dict.ts` (après `ueHomologations`, ~l.746)
- Modify: `tools/controles/contrastes.mjs` (fin du tableau `GATES`, après la ligne « ESTIA légende »)
- Modify: `app/parcours/page.tsx`

**Interfaces:**
- Consumes: rien (première tâche).
- Produces: les clés `uc*` ci-dessous, consommées par la Tâche 2 via `t(lang, "ucXxx")` ; la variable CSS `--f-correcteur` (Caveat) disponible sous `/parcours` ; 9 gates dans `node tools/controles/contrastes.mjs`.

- [ ] **Step 1 : les clés dict (FR et EN), verbatim**

Dans `components/proto/dict.ts`, juste après `ueHomologations: …` :

```ts
  /* ---------------- univers CPGE — l'appareil de la copie (chantier #6) ---------------- */
  ucEpreuve: { fr: "Épreuve", en: "Paper" },
  ucCentre: { fr: "Centre", en: "Centre" },
  ucSession: { fr: "Session", en: "Session" },
  ucUniversNom: { fr: "Style typographique international", en: "International Typographic Style" },
  ucCadreReserve: {
    fr: "Cadre réservé à la correction — ne rien écrire",
    en: "Reserved for marking — do not write",
  },
  /* la voix du correcteur : mise en scène du résultat et de l'état
     RÉELS (gate planche v1) — aucune note chiffrée inventée */
  ucVerdict: { fr: "Admis — cycle ingénieur ESTIA", en: "Admitted — ESTIA engineering cycle" },
  ucVoir: { fr: "→ voir CH.02", en: "→ see CH.02" },
  ucCeQuiReste: { fr: "Ce qui reste", en: "What remains" },
  ucMetier: { fr: "c'est le métier —", en: "that's the job —" },
  ucBareme: { fr: "Barème — compétences construites", en: "Marking scheme — skills built" },
  ucEtatCol: { fr: "État", en: "Status" },
  ucAcquis: { fr: "Acquis", en: "Acquired" },
  ucResultatEncadre: { fr: "Résultat — encadré à la règle", en: "Result — ruled box" },
  ucSuite: {
    fr: "La suite du parcours — CH.02, le rail principal.",
    en: "The journey continues — CH.02, the main rail.",
  },
  ucNePasEffacer: { fr: "Ne pas effacer", en: "Do not erase" },
```

(Réutilisées telles quelles, PAS de doublon : `ueUnivers`, `ueLangue`, `ueTheme`, `ueSortie`, `ueRep`, `ueDesignation`, `ueVisa`, `fpContexte`, `fpProgramme`, `fpRetourDocument`, `pcTitre`.)

- [ ] **Step 2 : les gates de contraste**

Dans `tools/controles/contrastes.mjs`, à la fin du tableau `GATES` (après la ligne `["ESTIA légende …]`) :

```js
  /* ---- univers CPGE (/parcours) — gate planche v1, addendum du spec ---- */
  ["CPGE nuit craie #eef1ef sur ardoise (texte ≥ 7)", "#eef1ef", "#1b2422", 7, null],
  ["CPGE nuit fusain #9fb0aa sur ardoise (texte ≥ 4,5)", "#9fb0aa", "#1b2422", 4.5, null],
  ["CPGE nuit craie rouge #e89286 sur ardoise (texte ≥ 4,5)", "#e89286", "#1b2422", 4.5, null],
  ["CPGE nuit craie rouge #e89286 sur ardoise (non-textuel ≥ 3)", "#e89286", "#1b2422", 3, null],
  ["CPGE jour encre #1d211f sur copie (texte ≥ 7)", "#1d211f", "#f2f4ef", 7, null],
  ["CPGE jour Bic #1e3f9f sur copie (texte ≥ 7)", "#1e3f9f", "#f2f4ef", 7, null],
  ["CPGE jour Bic retrait #44598f sur copie (texte ≥ 4,5)", "#44598f", "#f2f4ef", 4.5, null],
  ["CPGE jour rouge #c0271c sur copie (texte ≥ 4,5)", "#c0271c", "#f2f4ef", 4.5, null],
  ["CPGE jour rouge #c0271c sur copie (non-textuel ≥ 3)", "#c0271c", "#f2f4ef", 3, null],
```

- [ ] **Step 3 : la fonte du correcteur — `app/parcours/page.tsx` réécrit en entier**

```tsx
import type { Metadata } from "next"
import { Caveat } from "next/font/google"
import { PageParcours } from "@/components/proto/page-parcours"
import "./parcours.css"
import "./estia.css"
import "./cpge.css"

/* La main du correcteur (univers CPGE) — QUATRIÈME fonte du dépôt,
   gatée avec la planche v1. Chargée ICI et pas au layout : zéro octet
   de Caveat hors /parcours. preload:false — elle n'écrit que des
   annotations, on ne bloque pas le rendu pour elle. */
const correcteur = Caveat({
  subsets: ["latin"],
  variable: "--f-correcteur",
  display: "swap",
  preload: false,
})

/* FR en dur — même règle que le layout : le HTML est statique, la
   langue est un état client, le title ne bascule pas. Premières
   métadonnées PAR PAGE du dépôt (spec §1 : « Métadonnées propres »). */
export const metadata: Metadata = {
  title: "Parcours | Hugo Juskowiak",
  description:
    "Quatre chapitres — la discipline (CPGE), le métier (ESTIA), le souffle (Hokkaido), la modernité (MBDS). Le parcours d'un ingénieur full stack et IA.",
}

export default function Page() {
  return (
    <div className={correcteur.variable}>
      <PageParcours />
    </div>
  )
}
```

NOTE : `app/parcours/cpge.css` n'existe pas encore — créer en Step 3bis un fichier **stub d'une ligne de commentaire** pour que le build passe, la Tâche 2 le remplit :

```css
/* UNIVERS CH.01 — CPGE : rempli par la Tâche 2 (plan 2026-08-12-parcours-univers-cpge). */
```

- [ ] **Step 4 : vérifier**

Run: `node tools/controles/contrastes.mjs`
Expected: étalonnage 15/15, puis tous gates ✓ (les 9 nouveaux : 13,966 / 7,008 / 6,722 / 6,722 / 14,704 / 8,365 / 6,174 / 5,344 / 5,344), exit 0.
Run: `npx tsc --noEmit` → exit 0.
Run: `npm run build` → vert (le stub CSS suffit).

- [ ] **Step 5 : commit**

```bash
git add components/proto/dict.ts tools/controles/contrastes.mjs app/parcours/page.tsx app/parcours/cpge.css
git commit -m "L'univers CPGE reçoit son appareil — les libellés de la copie en deux langues, neuf gates de contraste, la main du correcteur en Caveat

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Tâche 2 : la copie — structure et matière (sans mouvement)

**Files:**
- Create: `components/proto/univers-cpge.tsx`
- Modify: `app/parcours/cpge.css` (remplacer le stub de la Tâche 1 par la feuille complète)
- Modify: `components/proto/page-parcours.tsx`

**Interfaces:**
- Consumes: `type Chapitre`, `ANCRES` (`./chapitres`) ; clés `uc*` (Tâche 1) + `ueUnivers/ueLangue/ueTheme/ueSortie/ueRep/ueDesignation/ueVisa/fpContexte/fpProgramme/fpRetourDocument/pcTitre` ; `ThemeToggle` (`./theme-toggle`) ; `--f-correcteur` (Tâche 1).
- Produces: `export function UniversCpge({ c, lang, setLang, reduit }: { c: Chapitre; lang: Lang; setLang: (l: Lang) => void; reduit: boolean | null })` — la Tâche 3 y ajoute le mouvement sans changer cette signature. Le `Record UNIVERS` de `page-parcours.tsx` (les univers hokkaido/mbds s'y ajouteront).

- [ ] **Step 1 : le composant `components/proto/univers-cpge.tsx`** (version posée — le mouvement arrive en Tâche 3)

```tsx
"use client"

/* ==================================================================
   UNIVERS CH.01 — CPGE : Style Typographique International /
   brutalisme de copie. La planche gatée v1 portée dans la page
   (addendum du spec, 2e du 2026-08-12).
   LE PARTI : la grille stricte du typographe, corrigée en rouge
   par-dessus — la couche imprimée se cale au quadrillage 5×5,
   seule la couche du correcteur a le droit d'être de travers.
   NUIT : le tableau noir — craie, fusain, deux panneaux joints.
   JOUR (html.clair) : la copie double sous néon — impression noire
   (l'énoncé), Bic bleu (la voix de l'étudiant), rouge (le
   correcteur SEUL).
   Les données restent chapitres.ts — l'univers met en scène, il ne
   forke jamais. La voix du correcteur (verdict, ✓✓, « c'est le
   métier ») met en scène resultat/etat RÉELS — rien d'inventé.
   ================================================================== */

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { ANCRES, type Chapitre } from "./chapitres"
import { t, type Lang } from "./dict"

/* Le programme TSI réel, en matière de fond (aria-hidden) : de la
   texture, pas de l'information — identique aux deux langues. */
const EQUATIONS = ["H(p) = K ⁄ (1 + τ·p)", "m·ẍ + λ·ẋ + k·x = F(t)", "e = − dΦ ⁄ dt"] as const

/* « Mathématiques : analyse… » → le correcteur souligne le TERME.
   Coupe sur le premier deux-points, séparateur conservé tel quel
   (FR « : », EN ": ") — dérivation d'affichage, pas un fork. */
const scinde = (ligne: string): [string, string, string] | null => {
  const m = /^(.+?)(\s?:\s)(.+)$/.exec(ligne)
  return m ? [m[1], m[2], m[3]] : null
}

export function UniversCpge({
  c,
  lang,
  setLang,
  reduit,
}: {
  c: Chapitre
  lang: Lang
  setLang: (l: Lang) => void
  reduit: boolean | null
}) {
  /* la fin de période, pour le tampon : « 2020.09 → 2022.06 » → « 2022.06 » */
  const findePeriode = c.periode.split("→").pop()!.trim()
  void reduit // consommé par la Tâche 3 (mouvement)

  return (
    <section id="cpge" data-univers="cpge" className="uc" aria-labelledby="pc-titre-cpge">
      <div className="uc-copie">
        <div className="uc-halo" aria-hidden="true"></div>
        <div className="uc-pli" aria-hidden="true"></div>
        <div className="uc-marge-g" aria-hidden="true"></div>
        <div className="uc-marge-d" aria-hidden="true"></div>

        {/* ---- page de gauche ---- */}
        <div className="uc-page">
          {/* l'en-tête de copie EST le cartouche : identité + les trois
              besoins de navigation de l'univers */}
          <dl className="uc-piece uc-entete">
            <div><dt>{t(lang, "ucEpreuve")}</dt><dd>{t(lang, "pcTitre")} — CH.{c.numero} / {String(ANCRES.length).padStart(2, "0")}</dd></div>
            <div><dt>{t(lang, "ucCentre")}</dt><dd>{c.cadre}</dd></div>
            <div><dt>{t(lang, "ucSession")}</dt><dd>{c.periode}</dd></div>
            <div><dt>{t(lang, "ueUnivers")}</dt><dd>{t(lang, "ucUniversNom")}</dd></div>
            <div>
              <dt>{t(lang, "ueLangue")}</dt>
              <dd className="uc-nav">
                <button type="button" className="mono mono-xs" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>FR</button>
                <button type="button" className="mono mono-xs" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
              </dd>
            </div>
            <div><dt>{t(lang, "ueTheme")}</dt><dd className="uc-nav"><ThemeToggle lang={lang} /></dd></div>
            <div>
              <dt>{t(lang, "ueSortie")}</dt>
              <dd className="uc-nav">
                <Link href="/#carte-cpge" className="mono mono-xs uc-sortie">
                  <span aria-hidden="true">←</span> {t(lang, "fpRetourDocument")}
                </Link>
              </dd>
            </div>
          </dl>

          {/* le seuil : la première ligne de la copie, soulignée en rouge */}
          <p className="uc-piece uc-seuil">
            {c.seuil}
            <svg className="uc-souligne" aria-hidden="true" viewBox="0 0 320 12" preserveAspectRatio="none">
              <path d="M2,7 Q10,2 18,7 Q26,12 34,7 Q42,2 50,7 Q58,12 66,7 Q74,2 82,7 Q90,12 98,7 Q106,2 114,7 Q122,12 130,7 Q138,2 146,7 Q154,12 162,7 Q170,2 178,7 Q186,12 194,7 Q202,2 210,7 Q218,12 226,7 Q234,2 242,7 Q250,12 258,7 Q266,2 274,7 Q282,12 290,7 Q298,2 306,7 Q312,10 318,6" />
            </svg>
          </p>

          {/* I. CONTEXTE */}
          <div className="uc-piece uc-ctx">
            <div className="uc-tete-q"><b aria-hidden="true">I.</b><h3>{t(lang, "fpContexte")}</h3></div>
            <p>{c.contexte}</p>
          </div>

          {/* III. CE QUI RESTE — travaux[0] */}
          <div className="uc-piece uc-travail">
            <div className="uc-tete-q"><b aria-hidden="true">III.</b><h3>{t(lang, "ucCeQuiReste")}</h3></div>
            <h4>{c.travaux[0].titre}</h4>
            <p>{c.travaux[0].texte}</p>
            <span className="uc-annote" aria-hidden="true"><i>✓✓</i> <span className="uc-main">{t(lang, "ucMetier")}</span></span>
          </div>

          <span className="uc-piece uc-eq uc-eq3" aria-hidden="true">{EQUATIONS[2]}</span>
          <span className="uc-piece uc-ne-pas-effacer mono" aria-hidden="true">{t(lang, "ucNePasEffacer")}</span>
          <span className="uc-piece uc-no-page uc-p1 mono mono-xs" aria-hidden="true">— 1 —</span>
        </div>

        {/* ---- page de droite ---- */}
        <div className="uc-page">
          {/* le cadre réservé (imprimé, JOUR) — et le correcteur écrit dedans */}
          <div className="uc-piece uc-reserve" aria-hidden="true">
            <span className="mono mono-xs">{t(lang, "ucCadreReserve")}</span>
          </div>
          <div className="uc-piece uc-verdict">
            <svg aria-hidden="true" viewBox="0 0 340 74" preserveAspectRatio="none">
              <path d="M22,37 Q20,12 88,9 Q180,2 292,13 Q334,19 331,38 Q330,60 250,66 Q140,74 52,64 Q18,58 22,40" />
            </svg>
            <span className="uc-main">{t(lang, "ucVerdict")}</span>
            <span className="mono mono-xs">{t(lang, "ucVoir")} · {findePeriode}</span>
          </div>

          <span className="uc-piece uc-eq uc-eq1" aria-hidden="true">{EQUATIONS[0]}</span>

          {/* II. PROGRAMME */}
          <div className="uc-piece uc-prog">
            <div className="uc-tete-q"><b aria-hidden="true">II.</b><h3>{t(lang, "fpProgramme")}</h3></div>
            <ol>
              {c.programme.map((ligne, i) => {
                const coupe = scinde(ligne)
                return (
                  <li key={ligne}>
                    <i aria-hidden="true">{i + 1}.</i>
                    <p>{coupe ? (<><b>{coupe[0]}</b>{coupe[1]}{coupe[2]}</>) : ligne}</p>
                  </li>
                )
              })}
            </ol>
            <span className="uc-coche uc-main" aria-hidden="true">✓✓</span>
          </div>

          <span className="uc-piece uc-eq uc-eq2" aria-hidden="true">{EQUATIONS[1]}</span>

          {/* le barème : les compétences */}
          <div className="uc-piece uc-bareme">
            <table>
              <caption className="mono mono-xs">{t(lang, "ucBareme")}</caption>
              <thead>
                <tr><th scope="col">{t(lang, "ueRep")}</th><th scope="col">{t(lang, "ueDesignation")}</th><th scope="col">{t(lang, "ucEtatCol")}</th></tr>
              </thead>
              <tbody>
                {c.competences.map((o, i) => (
                  <tr key={o}>
                    <td>{String(i + 1).padStart(2, "0")}</td>
                    <td>{o}</td>
                    <td><span aria-hidden="true">✓</span><span className="sr-only">{t(lang, "ucAcquis")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* le tampon du visa, qui MORD sur l'encadré du résultat */}
          <div className="uc-piece uc-tampon" role="img" aria-label={`${c.etat} — ${findePeriode}`}>
            <b>{c.etat}</b>
            <span>{findePeriode} — {t(lang, "ueVisa")}</span>
          </div>

          <span className="uc-piece uc-no-page uc-p2 mono mono-xs" aria-hidden="true">— 2 —</span>
        </div>

        {/* ---- pièces sur la pliure (hors respiration des pages) ---- */}
        <header className="uc-piece uc-titre">
          <div className="uc-barre" aria-hidden="true"></div>
          <h2 id="pc-titre-cpge" className="uc-nom">{c.nom}</h2>
          <span className="jp uc-jp-v" lang="ja">{c.jp}</span>
          <div className="uc-titre-ligne">
            <p className="uc-intitule">{c.intitule}</p>
            <span className="mono mono-xs dim">{c.periode}</span>
          </div>
        </header>

        {c.resultat && (
          <div className="uc-piece uc-resultat">
            <span className="mono mono-xs dim">{t(lang, "ucResultatEncadre")}</span>
            <p>{c.resultat}</p>
            <p className="uc-suite dim">{t(lang, "ucSuite")}</p>
          </div>
        )}

        <div className="uc-rail" aria-hidden="true"><i></i><i className="r"></i></div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2 : la feuille `app/parcours/cpge.css`** (remplace le stub de la Tâche 1 en entier ; les blocs interactivité/transitions arrivent en Tâche 3)

```css
/* ==================================================================
   UNIVERS CH.01 — CPGE (Style Typographique International /
   brutalisme de copie). Feuille chargée par app/parcours/page.tsx,
   jamais retirée à la navigation : tout est scopé .uc. Valeurs =
   gate planche v1 (addendum du spec, 2e du 2026-08-12).
   LE PARTI : la couche imprimée se cale au quadrillage 5×5 (18/90px,
   qui est AUSSI la grille de mise en page — positions % = multiples
   de 90px de la planche ÷ 1240/1880) ; seule la couche du correcteur
   est de travers. NUIT en base (tableau noir) ; JOUR sous html.clair
   (copie double sous néon). Ratios : nuit 13,966 / 7,008 / 6,722 ·
   jour 14,704 / 8,365 / 6,174 / 5,344 (gates armés dans
   tools/controles/contrastes.mjs).
   ================================================================== */

.uc {
  --uc-salle: #0c100f;
  --uc-lumiere: none;
  --uc-copie: #1b2422;
  --uc-cadre: #333a36;
  --uc-structure: #eef1ef;
  --uc-chair: #eef1ef;
  --uc-chair-2: #9fb0aa;
  --uc-correction: #e89286;
  --uc-carreau: rgba(238, 241, 239, 0.07);
  --uc-carreau-fort: rgba(238, 241, 239, 0.14);
  --uc-fusain: rgba(238, 241, 239, 0.20);
  --uc-marge: rgba(238, 241, 239, 0.22);
  --uc-halo: none;

  background-color: var(--uc-salle);
  background-image: var(--uc-lumiere);
  color: var(--uc-chair);
  padding: clamp(2rem, 6vw, 5rem) clamp(0.75rem, 3vw, 2.5rem);
  scroll-margin-block-start: 0; /* le monde est plein écran : l'ancre pose la copie en haut */
  margin-top: 24vh;
}

:where(html.clair) .uc {
  --uc-salle: #8f9691;
  --uc-lumiere: radial-gradient(120% 60% at 50% -5%, rgba(255, 255, 255, 0.22), transparent 60%);
  --uc-copie: #f2f4ef;
  --uc-cadre: transparent;
  --uc-structure: #1d211f;
  --uc-chair: #1e3f9f;   /* le Bic : la voix de l'étudiant */
  --uc-chair-2: #44598f;
  --uc-correction: #c0271c;
  --uc-carreau: rgba(110, 130, 185, 0.20);
  --uc-carreau-fort: rgba(110, 130, 185, 0.34);
  --uc-fusain: rgba(29, 33, 31, 0.14);
  --uc-marge: rgba(198, 68, 80, 0.50);
  --uc-halo: linear-gradient(180deg, rgba(255, 255, 255, 0.10) 0%, transparent 9%, transparent 40%, rgba(255, 255, 255, 0.07) 47%, transparent 55%);
}

/* les utilitaires du site gardent leurs tailles ; la couleur suit l'univers */
.uc .dim { color: var(--uc-chair-2); }
/* la main du correcteur — Caveat (gate planche v1), fallback cursive */
.uc .uc-main { font-family: var(--f-correcteur), cursive; }

/* ---- la copie double / les deux panneaux du tableau ---- */
.uc-copie {
  position: relative;
  max-width: 1240px;
  height: 1880px;
  margin: 0 auto;
  background: var(--uc-copie);
  border: 12px solid var(--uc-cadre);
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
}
:where(html.clair) .uc-copie { border: 0; box-shadow: 0 34px 80px rgba(20, 24, 20, 0.45); }

/* le quadrillage 5×5 : petits carreaux 18px, ligne appuyée toutes les 5.
   C'est la grille de mise en page — la couche imprimée s'y cale. */
.uc-copie::before {
  content: "";
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    repeating-linear-gradient(0deg, var(--uc-carreau-fort) 0 1px, transparent 1px 90px),
    repeating-linear-gradient(90deg, var(--uc-carreau-fort) 0 1px, transparent 1px 90px),
    repeating-linear-gradient(0deg, var(--uc-carreau) 0 1px, transparent 1px 18px),
    repeating-linear-gradient(90deg, var(--uc-carreau) 0 1px, transparent 1px 18px);
}
/* NUIT : la poussière de craie — nuages bas, traces d'éponge */
.uc-copie::after {
  content: "";
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(60% 22% at 30% 96%, rgba(238, 241, 239, 0.05), transparent 70%),
    radial-gradient(45% 16% at 78% 88%, rgba(238, 241, 239, 0.04), transparent 70%),
    radial-gradient(38% 12% at 55% 34%, rgba(238, 241, 239, 0.035), transparent 75%);
}
:where(html.clair) .uc-copie::after { background: none; }

/* le néon balaie la copie (JOUR peint, NUIT vaut none — la couche se
   translate sans coût : transform pur, compositor). Posée avant les
   pièces dans le DOM, sans z-index : elle reste au fond. */
.uc-halo {
  position: absolute;
  inset: -10%;
  pointer-events: none;
  background: var(--uc-halo);
}

/* la pliure de la copie double — le joint des deux panneaux, en NUIT */
.uc-pli {
  position: absolute; top: 0; bottom: 0; left: 50%;
  width: 42px; transform: translateX(-50%);
  pointer-events: none;
  background: linear-gradient(90deg, transparent 44%, rgba(0, 0, 0, 0.5) 49%, var(--uc-cadre) 50%, rgba(238, 241, 239, 0.10) 51%, transparent 56%);
}
:where(html.clair) .uc-pli {
  background: linear-gradient(90deg, transparent, rgba(20, 24, 20, 0.10) 46%, rgba(20, 24, 20, 0.16) 50%, rgba(255, 255, 255, 0.5) 54%, transparent);
}

/* les marges de copie : le trait vertical, page gauche et page droite */
.uc-marge-g, .uc-marge-d {
  position: absolute; top: 0; bottom: 0; width: 1px;
  border-left: 1px solid var(--uc-marge);
  pointer-events: none;
}
.uc-marge-g { left: 7%; }
.uc-marge-d { left: 56.5%; }

/* les deux pages : couches de respiration (la Tâche 3 les translate).
   inset:0 → les % des pièces restent les % de la copie. */
.uc-page { position: absolute; inset: 0; pointer-events: none; }
.uc-page .uc-piece { pointer-events: auto; }

/* le porte-craie, NUIT seulement */
.uc-rail {
  position: absolute; left: 18%; bottom: 0; height: 14px; width: 30%;
  background: var(--uc-cadre);
  border-top: 1px solid rgba(238, 241, 239, 0.18);
}
:where(html.clair) .uc-rail { display: none; }
.uc-rail i {
  position: absolute; top: -7px; height: 7px; width: 58px;
  background: #d8dbd8; border-radius: 2px;
}
.uc-rail i:first-child { left: 12%; transform: rotate(-1.2deg); }
.uc-rail i.r { left: 70%; width: 40px; background: #c78a80; }

/* ---- les pièces ---- */
.uc-piece { position: absolute; }

/* l'en-tête de copie : il PORTE le cartouche et la navigation */
.uc-entete {
  top: 2.87%; left: 7.26%;
  width: 432px;
  border: 1px solid var(--uc-structure);
  font-family: var(--f-mono); font-size: 0.66rem; letter-spacing: 0.1em;
  color: var(--uc-structure);
  background: var(--uc-copie);
  margin: 0;
}
.uc-entete div { display: grid; grid-template-columns: 7.5em 1fr; border-top: 1px solid var(--uc-carreau-fort); }
.uc-entete div:first-child { border-top: 0; }
.uc-entete dt { padding: 0.42em 0.7em; border-right: 1px solid var(--uc-carreau-fort); color: var(--uc-chair-2); text-transform: uppercase; font-size: 0.6rem; }
.uc-entete dd { padding: 0.42em 0.7em; text-transform: uppercase; margin: 0; }
.uc-nav { display: flex; align-items: center; gap: 0.7rem; }
.uc-nav button {
  font: inherit; background: none; border: 0; cursor: pointer;
  color: var(--uc-chair-2); padding: 0; letter-spacing: inherit; text-transform: inherit;
}
.uc-nav button[aria-pressed="true"] { color: var(--uc-structure); text-decoration: underline; text-underline-offset: 0.3em; }
.uc-nav button:focus-visible, .uc-sortie:focus-visible { outline: 2px solid var(--uc-structure); outline-offset: 2px; }
.uc-sortie { color: var(--uc-structure); text-decoration: none; }
.uc-nav .langtoggle { display: flex; gap: 0.7rem; }
.uc-nav .langtoggle button { font-size: 0.66rem; color: var(--uc-chair-2); background: none; border: 0; }
.uc-nav .langtoggle button[data-on="true"] { background: var(--uc-structure); color: var(--uc-copie); padding: 0 0.5em; }

/* le cadre réservé à la correction (imprimé — JOUR seulement) */
.uc-reserve {
  top: 2.87%; right: 7.26%;
  width: 352px; min-height: 158px;
  border: 1px solid var(--uc-structure);
  padding: 0.5rem 0.7rem;
  color: var(--uc-structure);
  display: none;
}
:where(html.clair) .uc-reserve { display: block; }

/* le verdict : le correcteur écrit — dans le cadre réservé, sous le
   libellé imprimé (textes opaques, jamais l'un sur l'autre).
   rotate(-2.6deg) : Tâche 2 en CSS ; la Tâche 3 le migre dans le
   style framer (yRouge) — un transform inline écrase toujours celui
   de la feuille de style. */
.uc-verdict {
  top: 6.81%; right: 9.84%;
  width: 304px;
  transform: rotate(-2.6deg);
  z-index: 2;
  color: var(--uc-correction);
}
.uc-verdict .uc-main { display: block; font-size: 1.7rem; line-height: 1.05; font-weight: 600; }
.uc-verdict .mono-xs { display: block; margin-top: 0.85rem; letter-spacing: 0.2em; }
.uc-verdict svg { position: absolute; inset: -13px -10px auto -16px; height: 58px; width: calc(100% + 26px); pointer-events: none; }
.uc-verdict svg path { fill: none; stroke: var(--uc-correction); stroke-width: 1.6; }

/* le titre : la barre grasse suisse, le display massif condensé */
.uc-titre { top: 12.45%; left: 7.26%; right: 7.26%; color: var(--uc-structure); }
.uc-barre { height: 7px; background: var(--uc-structure); margin-bottom: 1.4rem; transform-origin: left center; }
.uc-nom {
  font-family: var(--f-display);
  font-stretch: 62%;
  font-weight: 900;
  font-size: clamp(6rem, 15vw, 12.5rem);
  line-height: 0.8;
  letter-spacing: 0.005em;
  text-transform: uppercase;
  margin-left: -0.04em;
}
.uc-jp-v {
  position: absolute; right: 0; top: 1.6rem;
  writing-mode: vertical-rl;
  font-size: 1.05rem; letter-spacing: 0.4em;
  color: var(--uc-chair-2);
}
.uc-titre-ligne { display: flex; align-items: baseline; gap: 1.4rem; flex-wrap: wrap; margin-top: 1rem; }
.uc-intitule { font-size: 1.1rem; font-weight: 600; max-width: 544px; }

/* le seuil : la voix de l'étudiant, première ligne de la copie */
.uc-seuil {
  top: 32.55%; left: 7.26%;
  width: 528px;
  font-size: 1.06rem; font-weight: 500;
  color: var(--uc-chair);
}
/* le trait ondulé du correcteur, sous le bloc (jamais sur les glyphes) */
.uc-souligne {
  position: absolute; left: 0; bottom: -14px;
  width: 62%; height: 12px;
  transform: rotate(-0.5deg); transform-origin: left center;
}
.uc-souligne path { fill: none; stroke: var(--uc-correction); stroke-width: 1.6; }

/* têtes de parties : chiffre romain massif + règle */
.uc-tete-q { display: flex; align-items: baseline; gap: 0.9rem; border-top: 4px solid var(--uc-structure); padding-top: 0.55rem; margin-bottom: 0.8rem; color: var(--uc-structure); }
.uc-tete-q b { font-stretch: 62%; font-weight: 900; font-size: 2.4rem; line-height: 1; }
.uc-tete-q h3 { font-family: var(--f-mono); font-size: 0.6875rem; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 500; align-self: center; }

/* I. CONTEXTE — page gauche */
.uc-ctx { top: 43.09%; left: 7.26%; width: 480px; }
.uc-ctx p { font-size: 0.98rem; }

/* II. PROGRAMME — page droite, trois entrées réglées */
.uc-prog { top: 28.72%; left: 58.06%; width: 448px; }
.uc-prog ol { list-style: none; margin: 0; padding: 0; }
.uc-prog li { display: grid; grid-template-columns: 2.6rem 1fr; gap: 0.7rem; padding: 0.75rem 0; border-bottom: 1px solid var(--uc-carreau-fort); }
.uc-prog li:last-child { border-bottom: 0; }
.uc-prog li i { font-style: normal; font-stretch: 62%; font-weight: 900; font-size: 1.5rem; line-height: 1.1; color: var(--uc-structure); }
.uc-prog li p { font-size: 0.92rem; color: var(--uc-chair-2); }
.uc-prog li p b { color: var(--uc-chair); font-weight: 600; position: relative; }
.uc-coche {
  position: absolute; left: -3.2rem; bottom: 0.6rem;
  transform: rotate(-4deg);
  font-size: 1.5rem; color: var(--uc-correction);
}

/* III. CE QUI RESTE — page gauche, bas */
.uc-travail { top: 64.15%; left: 7.26%; width: 480px; }
.uc-travail h4 { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.45rem; }
.uc-travail p { font-size: 0.95rem; color: var(--uc-chair-2); }
.uc-annote {
  position: absolute; left: -0.4rem; top: 100%; margin-top: 0.7rem;
  transform: rotate(-2.2deg);
  color: var(--uc-correction);
  white-space: nowrap;
}
.uc-annote i { font-style: normal; letter-spacing: 0.1em; }
.uc-annote .uc-main { font-size: 1.4rem; font-weight: 600; }

/* le barème — page droite : les compétences, colonnes réglées */
.uc-bareme { top: 61.28%; left: 58.06%; width: 416px; }
.uc-bareme table { border-collapse: collapse; width: 100%; font-family: var(--f-mono); font-size: 0.72rem; letter-spacing: 0.06em; color: var(--uc-chair); }
.uc-bareme caption { text-align: left; letter-spacing: 0.2em; text-transform: uppercase; padding-bottom: 0.55rem; font-weight: 500; color: var(--uc-structure); }
.uc-bareme th, .uc-bareme td { border: 1px solid var(--uc-carreau-fort); padding: 0.45em 0.8em; text-align: left; font-weight: 400; }
.uc-bareme th { color: var(--uc-chair-2); text-transform: uppercase; font-size: 0.625rem; letter-spacing: 0.14em; }
.uc-bareme td:first-child { width: 3.5em; color: var(--uc-chair-2); }
.uc-bareme td:last-child { width: 4.5em; color: var(--uc-correction); text-align: center; }

/* le résultat, encadré à la règle (on encadre TOUJOURS le résultat) —
   posé sur la pliure : le chapitre ferme la double page */
.uc-resultat {
  top: 82.34%; left: 37.74%;
  width: 544px;
  border: 1px solid var(--uc-structure);
  outline: 1px solid var(--uc-structure);
  outline-offset: 4px;
  padding: 1.1rem 1.3rem 1.2rem;
  background: var(--uc-copie);
}
.uc-resultat .mono-xs { display: block; margin-bottom: 0.5rem; }
.uc-resultat p { font-size: 1.1rem; font-weight: 600; color: var(--uc-chair); }
.uc-resultat .uc-suite { font-size: 0.88rem; font-weight: 400; margin-top: 0.3rem; }

/* le tampon du visa, qui MORD sur l'encadré.
   rotate(-6deg) : Tâche 2 en CSS ; la Tâche 3 le migre dans le style
   framer (yRouge + réimpression). */
.uc-tampon {
  top: 79.79%; left: 75.48%;
  transform: rotate(-6deg);
  color: var(--uc-correction);
  border: 2px solid var(--uc-correction);
  outline: 1px solid var(--uc-carreau-fort);
  outline-offset: 3px;
  padding: 0.7rem 1.3rem;
  text-align: center;
  font-family: var(--f-mono);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  z-index: 2;
}
.uc-tampon b { display: block; font-size: 1.05rem; font-weight: 700; }
.uc-tampon span { font-size: 0.625rem; letter-spacing: 0.2em; }

/* les équations au fusain : de la matière, pas de l'information.
   rotate : Tâche 2 en CSS ; la Tâche 3 les migre dans le style framer
   (dérive scroll-liée). */
.uc-eq {
  font-family: var(--f-mono);
  color: var(--uc-fusain);
  white-space: nowrap;
  pointer-events: none;
}
:where(html:not(.clair)) .uc-eq { filter: blur(0.6px); }
.uc-eq1 { top: 20.21%; right: 5.65%; font-size: 2rem; transform: rotate(-0.8deg); }
.uc-eq2 { top: 53.72%; left: 51.61%; font-size: 2.5rem; transform: rotate(-1.6deg); }
.uc-eq3 { top: 79.79%; left: 8.71%; font-size: 1.85rem; transform: rotate(0.7deg); }
/* la trace d'éponge qui a à moitié mangé eq2, NUIT */
:where(html:not(.clair)) .uc-eq2::after {
  content: "";
  position: absolute; inset: -20px -30px;
  background: radial-gradient(70% 80% at 60% 50%, var(--uc-copie) 20%, transparent 75%);
  opacity: 0.55;
}

/* NE PAS EFFACER — le tableau seul y a droit, sous le résultat encadré */
.uc-ne-pas-effacer {
  top: 86.06%; left: 9.68%;
  transform: rotate(-1.5deg);
  font-size: 0.72rem; letter-spacing: 0.3em;
  color: var(--uc-chair);
  border-bottom: 1px solid var(--uc-chair);
  padding-bottom: 0.3em;
}
:where(html.clair) .uc-ne-pas-effacer { display: none; }

/* pages */
.uc-no-page { bottom: 18px; color: var(--uc-chair-2); letter-spacing: 0.2em; }
.uc-p1 { left: 25%; }
.uc-p2 { left: 75%; }

/* ---- petit écran : la copie redevient un flux ---- */
@media (max-width: 1000px) {
  .uc-copie { height: auto; padding: 1.5rem; }
  .uc-page { position: static; }
  .uc-piece { position: static; width: auto !important; max-width: 34rem; transform: none !important; margin-bottom: 1.6rem; }
  .uc-pli, .uc-marge-g, .uc-marge-d, .uc-halo, .uc-rail, .uc-eq, .uc-no-page, .uc-souligne, .uc-reserve, .uc-ne-pas-effacer { display: none; }
  .uc-verdict svg { display: none; }
  .uc-jp-v { position: static; writing-mode: horizontal-tb; display: block; margin-top: 0.5rem; }
  .uc-coche, .uc-annote { position: static; display: block; margin-top: 0.5rem; }
}
```

- [ ] **Step 3 : le Record UNIVERS — `components/proto/page-parcours.tsx`**

Trois retouches exactes :

1. Les imports — ajouter `UniversCpge`, le type `Chapitre` et `ReactElement` :

```tsx
import { useState } from "react"
import type { ReactElement } from "react"
import { useReducedMotion } from "motion/react"
import Link from "next/link"
import { Smooth } from "./smooth"
import { ThemeToggle } from "./theme-toggle"
import { UniversCpge } from "./univers-cpge"
import { UniversEstia } from "./univers-estia"
import { chapitres, type Chapitre } from "./chapitres"
import { t, type Lang } from "./dict"
```

2. Le Record, au niveau module (au-dessus de `export function PageParcours()`) :

```tsx
/* Chaque univers remplace son chapitre sobre quand sa planche est
   gatée — le pattern CORPS[slug] des fiches, transposé. Le Record
   promis au premier univers est là depuis le deuxième ; hokkaido et
   mbds s'y ajouteront, planche par planche. */
type UniversProps = { c: Chapitre; lang: Lang; setLang: (l: Lang) => void; reduit: boolean | null }
const UNIVERS: Partial<Record<Chapitre["ancre"], (props: UniversProps) => ReactElement>> = {
  cpge: UniversCpge,
  estia: UniversEstia,
}
```

3. Le corps de la boucle — remplacer le ternaire `c.ancre === "estia" ? … : …` (et son commentaire « Un Record viendra… ») par :

```tsx
      {liste.map((c) => {
        const Univers = UNIVERS[c.ancre]
        return Univers ? (
          <Univers key={c.ancre} c={c} lang={lang} setLang={setLang} reduit={reduit} />
        ) : (
          <section key={c.ancre} id={c.ancre} className="pc-chapitre" aria-labelledby={`pc-titre-${c.ancre}`}>
```

…le contenu du chapitre sobre reste identique, seule la parenthèse finale change (fermeture du map avec `)}` → `)
      })}`).

- [ ] **Step 4 : vérifier**

Run: `npx tsc --noEmit` → exit 0.
Run: `npm run build` → vert, `/parcours` statique.
Run: `grep -c 'data-univers="cpge"' .next/server/app/parcours.html` → 1 ; `grep -c 'data-univers="estia"' .next/server/app/parcours.html` → 1 ; `grep -c 'id="hokkaido"' .next/server/app/parcours.html` → 1 (les chapitres sobres vivent toujours).
Run: `node tools/controles/garde-fous-chapitres.mjs` → exit 0 (283 OK — rien ne doit bouger, `chapitres.ts` est intouché).
Puis à l'œil de l'implémenteur : `fuser -k 3210/tcp 2>/dev/null; npx next start -p 3210 &` et captures **viewport** (jamais l'élément géant) aux positions du chapitre `#cpge`, NUIT puis JOUR (headless : forcer `localStorage.setItem("theme","sombre"|"clair")` avant navigation) — vérifier : couche imprimée calée sur le quadrillage fort, textes jamais l'un sur l'autre, verdict DANS le cadre réservé sous le libellé (JOUR), porte-craie et NE PAS EFFACER en NUIT seulement. `fuser -k 3210/tcp` ensuite.

- [ ] **Step 5 : commit**

```bash
git add components/proto/univers-cpge.tsx app/parcours/cpge.css components/proto/page-parcours.tsx
git commit -m "La copie CPGE se pose — la grille suisse stricte sur ses carreaux, trois encres, l'en-tête-cartouche ; le Record UNIVERS tient désormais deux mondes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Tâche 3 : le mouvement — l'encre s'écrit, la correction tombe après coup, et la main

**Files:**
- Modify: `components/proto/univers-cpge.tsx` (REMPLACÉ EN ENTIER par la version ci-dessous — même structure que la Tâche 2, le mouvement en plus, signature inchangée)
- Modify: `app/parcours/cpge.css` (retraits de transforms migrés + bloc interactivité, voir Step 2)
- Create: `$SCRATCH/controle-cpge.mjs` (sonde reduce/pose — hors dépôt)

**Interfaces:**
- Consumes: tout la Tâche 2 ; `motion/react` (dep existante).
- Produces: la même `UniversCpge({ c, lang, setLang, reduit })` — rien d'autre ne change pour les voisins.

**La langue du mouvement (gate planche v1)** : l'IMPRESSION paraît d'un bloc (`imprime`), l'ENCRE s'écrit gauche→droite (`ecrit`, clip-path one-shot), la CORRECTION tombe APRÈS coup, décalée (`corrige`, le pattern du tampon ESTIA) ; les traits se tirent à la règle (`trace`).

> **AMENDEMENT D'EXÉCUTION (2026-08-12, contrôleur — commit `aaafbbd`)** : le
> pattern `clipPath` + `whileInView` est INERTE sous motion 12.43 (prouvé en
> exécution : transcription byte-exacte, frères opacity/scale/scaleX vivants
> sur la même page, expérience « insets sans négatifs » réfutée aussi). Le
> repli contractuel de ce plan est adopté : `ecrit()` = balayage d'encre
> `opacity 0→1, x -8→0`, mêmes viewport/transition ; aucun `clip-path` au
> composant ; sites d'usage audités sans conflit de transform. La sonde
> filtre l'artefact local `_vercel/insights` (404 d'`<Analytics/>` hors
> Vercel) et vérifie l'opacité du seuil. Le code ci-dessous reste le texte
> d'origine — le commit fait foi. Respiration scroll-liée derrière la **porte multiplicative née FERMÉE** : les deux pages de la copie respirent autour du pli (±8px), les équations dérivent, la couche du correcteur flotte, le néon balaie (JOUR). Interactivité pointeur fin : souligner à la règle (JOUR), l'éponge efface (NUIT), le tampon se réimprime. **Règle absolue : tout transform CSS d'une pièce pilotée par framer migre dans le style framer** (l'inline écrase toujours la feuille de style).

- [ ] **Step 1 : le composant final `components/proto/univers-cpge.tsx`** (remplace le fichier de la Tâche 2 en entier)

```tsx
"use client"

/* ==================================================================
   UNIVERS CH.01 — CPGE : Style Typographique International /
   brutalisme de copie. La planche gatée v1 portée dans la page
   (addendum du spec, 2e du 2026-08-12).
   LE PARTI : la grille stricte du typographe, corrigée en rouge
   par-dessus — la couche imprimée se cale au quadrillage 5×5,
   seule la couche du correcteur a le droit d'être de travers.
   MOUVEMENT (la langue de la copie) : l'impression paraît d'un
   bloc, l'encre s'écrit gauche→droite, la correction tombe APRÈS
   coup — décalée, comme un correcteur repasse derrière. Au scroll,
   derrière la porte multiplicative née FERMÉE : les deux pages
   respirent autour du pli, les équations au fusain dérivent, la
   couche rouge flotte, le néon balaie (JOUR seul — sa couche vaut
   none en NUIT et se translate sans coût).
   INTERACTIVITÉ (pointeur fin seul) : souligner à la règle (JOUR,
   CSS), l'éponge efface et la craie se redessine (NUIT, CSS), le
   tampon se réimprime (whileTap). Sous reduce et au tactile : tout
   posé — le SSR cuit la pose, reduce ne voit jamais une frame.
   Les données restent chapitres.ts — l'univers met en scène, il ne
   forke jamais.
   ================================================================== */

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { ANCRES, type Chapitre } from "./chapitres"
import { t, type Lang } from "./dict"

/* Le programme TSI réel, en matière de fond (aria-hidden) : de la
   texture, pas de l'information — identique aux deux langues. */
const EQUATIONS = ["H(p) = K ⁄ (1 + τ·p)", "m·ẍ + λ·ẋ + k·x = F(t)", "e = − dΦ ⁄ dt"] as const

/* « Mathématiques : analyse… » → le correcteur souligne le TERME.
   Coupe sur le premier deux-points, séparateur conservé tel quel
   (FR « : », EN ": ") — dérivation d'affichage, pas un fork. */
const scinde = (ligne: string): [string, string, string] | null => {
  const m = /^(.+?)(\s?:\s)(.+)$/.exec(ligne)
  return m ? [m[1], m[2], m[3]] : null
}

export function UniversCpge({
  c,
  lang,
  setLang,
  reduit,
}: {
  c: Chapitre
  lang: Lang
  setLang: (l: Lang) => void
  reduit: boolean | null
}) {
  /* la fin de période, pour le tampon : « 2020.09 → 2022.06 » → « 2022.06 » */
  const findePeriode = c.periode.split("→").pop()!.trim()

  const copie = useRef<HTMLDivElement>(null)
  /* la respiration suit le scroll — FONCTION PURE : le F5 en pleine
     copie rend l'état exact (leçon de l'iris, revue #13) */
  const { scrollYProgress } = useScroll({ target: copie, offset: ["start end", "end start"] })
  const souffle = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })
  /* porte multiplicative, née FERMÉE (0) : le SSR cuit la pose, un
     utilisateur reduce ne voit jamais une frame bouger — les animés
     engagent le mouvement à l'hydratation, jamais l'inverse. */
  const porte = useMotionValue(0)
  useEffect(() => { porte.set(reduit ? 0 : 1) }, [reduit, porte])

  /* la copie double respire autour du pli : ±8px de cisaillement */
  const yPageG = useTransform([souffle, porte], ([p, g]: number[]) => g * p * -8)
  const yPageD = useTransform([souffle, porte], ([p, g]: number[]) => g * p * 8)
  /* les équations au fusain dérivent (matière) — leur rotate CSS migre
     ICI : un transform inline écrase toujours la feuille de style */
  const yEq1 = useTransform([souffle, porte], ([p, g]: number[]) => g * p * -26)
  const yEq2 = useTransform([souffle, porte], ([p, g]: number[]) => g * p * -16)
  const yEq3 = useTransform([souffle, porte], ([p, g]: number[]) => g * p * 20)
  /* la couche du correcteur flotte au-dessus de la copie */
  const yRouge = useTransform([souffle, porte], ([p, g]: number[]) => g * p * -12)
  /* le néon balaie la copie (JOUR peint, NUIT vaut none — transform
     pur sur sa propre couche, compositor) */
  const yHalo = useTransform([souffle, porte], ([p, g]: number[]) => g * p * 120)

  /* la main n'existe qu'au pointeur fin — au tactile, tout est posé */
  const [pointeurFin, setPointeurFin] = useState(false)
  useEffect(() => {
    setPointeurFin(matchMedia("(hover: hover) and (pointer: fine)").matches)
  }, [])

  const EASE = [0.22, 1, 0.36, 1] as const
  /* l'impression : la structure paraît d'un bloc, brève */
  const imprime = (delai = 0) => ({
    initial: reduit ? false : ({ opacity: 0 } as const),
    whileInView: { opacity: 1 },
    viewport: { once: true, amount: 0.35 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.35, delay: delai, ease: EASE },
  })
  /* l'encre s'écrit : reveal gauche→droite, clip-path one-shot (once,
     jamais par frame de scroll — le banc tranchera, repli = imprime) */
  const ecrit = (delai = 0) => ({
    /* bottom -35% : le clip doit couvrir le soulignement rouge qui
       déborde 26px sous le seuil — un clip trop court l'amputerait */
    initial: reduit ? false : ({ clipPath: "inset(-5% 100% -35% -2%)" } as const),
    whileInView: { clipPath: "inset(-5% -2% -35% -2%)" },
    viewport: { once: true, amount: 0.35 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.9, delay: delai, ease: "easeOut" as const },
  })
  /* la correction tombe APRÈS coup — le geste du tampon ESTIA */
  const corrige = (delai = 0) => ({
    initial: reduit ? false : ({ opacity: 0, scale: 1.3 } as const),
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, amount: 0.6 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.18, delay: delai, ease: "easeOut" as const },
  })
  /* le trait tiré à la règle */
  const trace = (delai = 0) => ({
    initial: reduit ? false : ({ scaleX: 0 } as const),
    whileInView: { scaleX: 1 },
    viewport: { once: true, amount: 0.5 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.6, delay: delai, ease: EASE },
    style: { transformOrigin: "left center" } as const,
  })

  return (
    <section id="cpge" data-univers="cpge" className="uc" aria-labelledby="pc-titre-cpge">
      <div className="uc-copie" ref={copie}>
        <motion.div className="uc-halo" aria-hidden="true" style={{ y: yHalo }}></motion.div>
        <div className="uc-pli" aria-hidden="true"></div>
        <div className="uc-marge-g" aria-hidden="true"></div>
        <div className="uc-marge-d" aria-hidden="true"></div>

        {/* ---- page de gauche (respire autour du pli) ---- */}
        <motion.div className="uc-page" style={{ y: yPageG }}>
          {/* l'en-tête de copie EST le cartouche : identité + les trois
              besoins de navigation de l'univers */}
          <motion.dl className="uc-piece uc-entete" {...imprime(0)}>
            <div><dt>{t(lang, "ucEpreuve")}</dt><dd>{t(lang, "pcTitre")} — CH.{c.numero} / {String(ANCRES.length).padStart(2, "0")}</dd></div>
            <div><dt>{t(lang, "ucCentre")}</dt><dd>{c.cadre}</dd></div>
            <div><dt>{t(lang, "ucSession")}</dt><dd>{c.periode}</dd></div>
            <div><dt>{t(lang, "ueUnivers")}</dt><dd>{t(lang, "ucUniversNom")}</dd></div>
            <div>
              <dt>{t(lang, "ueLangue")}</dt>
              <dd className="uc-nav">
                <button type="button" className="mono mono-xs" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>FR</button>
                <button type="button" className="mono mono-xs" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
              </dd>
            </div>
            <div><dt>{t(lang, "ueTheme")}</dt><dd className="uc-nav"><ThemeToggle lang={lang} /></dd></div>
            <div>
              <dt>{t(lang, "ueSortie")}</dt>
              <dd className="uc-nav">
                <Link href="/#carte-cpge" className="mono mono-xs uc-sortie">
                  <span aria-hidden="true">←</span> {t(lang, "fpRetourDocument")}
                </Link>
              </dd>
            </div>
          </motion.dl>

          {/* le seuil : la première ligne de la copie — elle s'écrit,
              puis le correcteur souligne, après coup */}
          <motion.p className="uc-piece uc-seuil" {...ecrit(0)}>
            {c.seuil}
            <motion.svg
              className="uc-souligne"
              aria-hidden="true"
              viewBox="0 0 320 12"
              preserveAspectRatio="none"
              initial={reduit ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.9 }}
              transition={reduit ? { duration: 0 } : { duration: 0.5, delay: 1.0, ease: "easeOut" }}
              style={{ transformOrigin: "left center", rotate: -0.5 }}
            >
              <path d="M2,7 Q10,2 18,7 Q26,12 34,7 Q42,2 50,7 Q58,12 66,7 Q74,2 82,7 Q90,12 98,7 Q106,2 114,7 Q122,12 130,7 Q138,2 146,7 Q154,12 162,7 Q170,2 178,7 Q186,12 194,7 Q202,2 210,7 Q218,12 226,7 Q234,2 242,7 Q250,12 258,7 Q266,2 274,7 Q282,12 290,7 Q298,2 306,7 Q312,10 318,6" />
            </motion.svg>
          </motion.p>

          {/* I. CONTEXTE */}
          <div className="uc-piece uc-ctx">
            <motion.div className="uc-tete-q" {...trace(0)}><b aria-hidden="true">I.</b><h3>{t(lang, "fpContexte")}</h3></motion.div>
            <motion.p {...ecrit(0.15)}>{c.contexte}</motion.p>
          </div>

          {/* III. CE QUI RESTE — travaux[0] */}
          <div className="uc-piece uc-travail">
            <motion.div className="uc-tete-q" {...trace(0)}><b aria-hidden="true">III.</b><h3>{t(lang, "ucCeQuiReste")}</h3></motion.div>
            <motion.div {...ecrit(0.15)}>
              <h4>{c.travaux[0].titre}</h4>
              <p>{c.travaux[0].texte}</p>
            </motion.div>
            <motion.span className="uc-annote" aria-hidden="true" style={{ rotate: -2.2 }} {...corrige(0.9)}>
              <i>✓✓</i> <span className="uc-main">{t(lang, "ucMetier")}</span>
            </motion.span>
          </div>

          <motion.span className="uc-piece uc-eq uc-eq3" aria-hidden="true" style={{ y: yEq3, rotate: 0.7 }}>{EQUATIONS[2]}</motion.span>
          <motion.span className="uc-piece uc-ne-pas-effacer mono" aria-hidden="true" {...imprime(0.2)}>{t(lang, "ucNePasEffacer")}</motion.span>
          <motion.span className="uc-piece uc-no-page uc-p1 mono mono-xs" aria-hidden="true" {...imprime(0)}>— 1 —</motion.span>
        </motion.div>

        {/* ---- page de droite (respire en sens inverse) ---- */}
        <motion.div className="uc-page" style={{ y: yPageD }}>
          {/* le cadre réservé (imprimé, JOUR) — et le correcteur écrit dedans */}
          <motion.div className="uc-piece uc-reserve" aria-hidden="true" {...imprime(0)}>
            <span className="mono mono-xs">{t(lang, "ucCadreReserve")}</span>
          </motion.div>
          {/* la correction tombe après l'impression — et flotte au-dessus
              de la copie au scroll (yRouge ; rotate migré de la CSS) */}
          <motion.div className="uc-piece uc-verdict" style={{ y: yRouge, rotate: -2.6 }} {...corrige(0.5)}>
            <svg aria-hidden="true" viewBox="0 0 340 74" preserveAspectRatio="none">
              <path d="M22,37 Q20,12 88,9 Q180,2 292,13 Q334,19 331,38 Q330,60 250,66 Q140,74 52,64 Q18,58 22,40" />
            </svg>
            <span className="uc-main">{t(lang, "ucVerdict")}</span>
            <span className="mono mono-xs">{t(lang, "ucVoir")} · {findePeriode}</span>
          </motion.div>

          <motion.span className="uc-piece uc-eq uc-eq1" aria-hidden="true" style={{ y: yEq1, rotate: -0.8 }}>{EQUATIONS[0]}</motion.span>

          {/* II. PROGRAMME */}
          <div className="uc-piece uc-prog">
            <motion.div className="uc-tete-q" {...trace(0)}><b aria-hidden="true">II.</b><h3>{t(lang, "fpProgramme")}</h3></motion.div>
            <ol>
              {c.programme.map((ligne, i) => {
                const coupe = scinde(ligne)
                return (
                  <motion.li key={ligne} {...ecrit(0.12 + i * 0.14)}>
                    <i aria-hidden="true">{i + 1}.</i>
                    <p>{coupe ? (<><b>{coupe[0]}</b>{coupe[1]}{coupe[2]}</>) : ligne}</p>
                  </motion.li>
                )
              })}
            </ol>
            <motion.span className="uc-coche uc-main" aria-hidden="true" style={{ rotate: -4 }} {...corrige(0.85)}>✓✓</motion.span>
          </div>

          <motion.span className="uc-piece uc-eq uc-eq2" aria-hidden="true" style={{ y: yEq2, rotate: -1.6 }}>{EQUATIONS[1]}</motion.span>

          {/* le barème : les compétences */}
          <motion.div className="uc-piece uc-bareme" {...imprime(0.1)}>
            <table>
              <caption className="mono mono-xs">{t(lang, "ucBareme")}</caption>
              <thead>
                <tr><th scope="col">{t(lang, "ueRep")}</th><th scope="col">{t(lang, "ueDesignation")}</th><th scope="col">{t(lang, "ucEtatCol")}</th></tr>
              </thead>
              <tbody>
                {c.competences.map((o, i) => (
                  <tr key={o}>
                    <td>{String(i + 1).padStart(2, "0")}</td>
                    <td>{o}</td>
                    <td><span aria-hidden="true">✓</span><span className="sr-only">{t(lang, "ucAcquis")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* le tampon du visa : il tombe après coup, MORD sur l'encadré,
              et se réimprime sous la main (pointeur fin seul) */}
          <motion.div
            className="uc-piece uc-tampon"
            role="img"
            aria-label={`${c.etat} — ${findePeriode}`}
            style={{ y: yRouge, rotate: -6 }}
            whileTap={pointeurFin && !reduit ? { scale: 0.92 } : undefined}
            whileHover={pointeurFin && !reduit ? { rotate: -4 } : undefined}
            {...corrige(0.85)}
          >
            <b>{c.etat}</b>
            <span>{findePeriode} — {t(lang, "ueVisa")}</span>
          </motion.div>

          <motion.span className="uc-piece uc-no-page uc-p2 mono mono-xs" aria-hidden="true" {...imprime(0)}>— 2 —</motion.span>
        </motion.div>

        {/* ---- pièces sur la pliure (hors respiration des pages) ---- */}
        <header className="uc-piece uc-titre">
          <motion.div className="uc-barre" aria-hidden="true" {...trace(0)}></motion.div>
          <motion.h2 id="pc-titre-cpge" className="uc-nom" {...imprime(0.15)}>{c.nom}</motion.h2>
          <motion.span className="jp uc-jp-v" lang="ja" {...imprime(0.3)}>{c.jp}</motion.span>
          <motion.div className="uc-titre-ligne" {...imprime(0.25)}>
            <p className="uc-intitule">{c.intitule}</p>
            <span className="mono mono-xs dim">{c.periode}</span>
          </motion.div>
        </header>

        {c.resultat && (
          <motion.div className="uc-piece uc-resultat" {...imprime(0)}>
            <span className="mono mono-xs dim">{t(lang, "ucResultatEncadre")}</span>
            <motion.p {...ecrit(0.25)}>{c.resultat}</motion.p>
            <motion.p className="uc-suite dim" {...ecrit(0.6)}>{t(lang, "ucSuite")}</motion.p>
          </motion.div>
        )}

        <div className="uc-rail" aria-hidden="true"><i></i><i className="r"></i></div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2 : la CSS — retraits + interactivité**

Dans `app/parcours/cpge.css` :

1. **Retirer** les lignes `transform: rotate(…)` des sélecteurs `.uc-verdict`, `.uc-tampon`, `.uc-eq1`, `.uc-eq2`, `.uc-eq3`, `.uc-coche`, `.uc-annote` et le `transform: rotate(-0.5deg);` de `.uc-souligne` — chacun migré dans le style framer (Step 1). Laisser à la place, sur chaque sélecteur concerné, le commentaire : `/* rotate : dans le style framer — l'inline écrase toujours la feuille de style */`.

2. Dans le bloc `@media (max-width: 1000px)`, ajouter après la ligne `.uc-page { position: static; }` :

```css
  .uc-page { transform: none !important; }
```

(fusionnable en `.uc-page { position: static; transform: none !important; }`.)

3. **Ajouter en fin de feuille**, avant le bloc `@media (max-width: 1000px)` :

```css
/* ==================================================================
   INTERACTIVITÉ — pointeur fin, mouvement autorisé. Au tactile et
   sous reduce : rien, tout est posé.
   ================================================================== */
@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  /* JOUR — souligner à la règle : le trait rouge sous le terme */
  .uc-prog li p b::after {
    content: "";
    position: absolute; left: 0; right: 0; bottom: -2px;
    border-bottom: 2px solid var(--uc-correction);
    transform: scaleX(0); transform-origin: left center;
    transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .uc-prog li:hover p b::after { transform: scaleX(1); }
  /* …et sous les têtes de parties */
  .uc-tete-q { position: relative; }
  .uc-tete-q::after {
    content: "";
    position: absolute; left: 0; width: 5.2rem; bottom: -3px;
    border-bottom: 2px solid var(--uc-correction);
    transform: scaleX(0); transform-origin: left center;
    transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .uc-ctx:hover .uc-tete-q::after,
  .uc-prog:hover .uc-tete-q::after,
  .uc-travail:hover .uc-tete-q::after { transform: scaleX(1); }
  /* NUIT — l'éponge efface, la craie se redessine (opacity/filter :
     pas de conflit avec le y framer, qui ne pilote que transform) */
  :where(html:not(.clair)) .uc-eq { pointer-events: auto; transition: opacity 1100ms ease, filter 1100ms ease; }
  :where(html:not(.clair)) .uc-eq:hover { opacity: 0.06; filter: blur(3px); transition-duration: 500ms; }
  /* le tampon se réimprime */
  .uc-tampon { cursor: pointer; }
}
```

- [ ] **Step 3 : la sonde `$SCRATCH/controle-cpge.mjs`** (vérité = getComputedStyle ; les captures mentent)

```js
/* Sonde reduce/pose de l'univers CPGE — deux modes, relevés pendant
   traversée à la molette (mouse.wheel UNIQUEMENT : Lenis reprend
   toute position posée à la main).
   Usage : node controle-cpge.mjs [url]
           (défaut http://localhost:3210/parcours#cpge — build de PROD) */
import { existsSync } from "node:fs"
import { chromium } from "playwright-core"

const URL_ = process.argv[2] ?? "http://localhost:3210/parcours#cpge"
const CHROME = process.env.CHROME ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`
if (!existsSync(CHROME)) { console.error(`Chrome introuvable (${CHROME}) — passe CHROME=<binaire>.`); process.exit(2) }

const navigateur = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] })
let echecs = 0
const dire = (ok, quoi, detail) => { if (!ok) echecs++; console.log(`${ok ? "OK  " : "FAIL"}  ${quoi}${detail ? `  →  ${detail}` : ""}`) }

/* garde héritée : rAF doit tirer, sinon tout relevé serait faux */
{
  const p = await navigateur.newPage()
  await p.setContent("<div>x</div>")
  const frames = await p.evaluate(() => new Promise((res) => {
    let n = 0
    const t = () => { n++; requestAnimationFrame(t) }
    requestAnimationFrame(t)
    setTimeout(() => res(n), 1000)
  }))
  if (frames < 10) { console.error("ARRÊT — ce navigateur ne tire pas de frames."); await navigateur.close(); process.exit(2) }
  await p.close()
}

for (const mode of ["reduce", "no-preference"]) {
  const ctx = await navigateur.newContext({ reducedMotion: mode, viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  /* le headless se déclare clair : NUIT forcée (la sonde du thème JOUR
     se relance avec "clair" si besoin — le mouvement est identique) */
  await page.addInitScript(() => { try { localStorage.setItem("theme", "sombre") } catch {} })
  const erreurs = []
  page.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text().slice(0, 160)) })
  page.on("pageerror", (e) => erreurs.push(String(e).slice(0, 160)))
  await page.goto(URL_, { waitUntil: "networkidle" })
  /* stabilisation des whileInView : mesurer avant = faux relevés */
  await page.waitForTimeout(1200)

  const sonde = () => page.evaluate(() => {
    const q = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null }
    const pg = q("#cpge .uc-page"), eq = q("#cpge .uc-eq2"), vd = q("#cpge .uc-verdict"), se = q("#cpge .uc-seuil")
    return {
      page: pg ? pg.transform : "absent",
      eq2: eq ? eq.transform : "absent",
      verdictO: vd ? vd.opacity : "absent",
      seuilClip: se ? se.clipPath : "absent",
    }
  })

  const vals = { page: new Set(), eq2: new Set(), verdictO: new Set() }
  for (let i = 0; i < 24; i++) {
    const s = await sonde()
    vals.page.add(s.page); vals.eq2.add(s.eq2); vals.verdictO.add(s.verdictO)
    await page.mouse.wheel(0, 240)
    await page.waitForTimeout(90)
  }
  /* le seuil se juge APRÈS la traversée (once:true le laisse ouvert) —
     le juger avant son entrée en vue serait un faux FAIL */
  const dernier = await sonde()

  console.log(`\n=== ${mode} ===`)
  if (mode === "reduce") {
    dire(vals.page.size === 1, "reduce : la respiration des pages ne bouge JAMAIS", `${vals.page.size} transform distincts`)
    dire(vals.eq2.size === 1, "reduce : l'équation ne dérive JAMAIS", `${vals.eq2.size} transform distincts`)
    dire([...vals.verdictO].every((o) => o === "1"), "reduce : le verdict est posé (opacité 1 partout)", [...vals.verdictO].join(","))
    dire(dernier.seuilClip === "none" || !dernier.seuilClip.includes("100%"), "reduce : le seuil est écrit (clip ouvert)", dernier.seuilClip)
  } else {
    dire(vals.page.size > 1, "animé : la respiration des pages vit au scroll", `${vals.page.size} transform distincts`)
    dire(vals.eq2.size > 1, "animé : l'équation dérive au scroll", `${vals.eq2.size} transform distincts`)
  }
  dire(erreurs.length === 0, "console propre", erreurs.join(" | ") || undefined)
  await ctx.close()
}

await navigateur.close()
process.exit(echecs ? 1 : 0)
```

- [ ] **Step 4 : vérifier**

Run: `npx tsc --noEmit` → exit 0.
Run: `npm run build` → vert.
Run: `fuser -k 3210/tcp 2>/dev/null; npx next start -p 3210 &` puis `node $SCRATCH/controle-cpge.mjs` → **tout OK, exit 0** (reduce : 1 transform distinct partout, verdict posé, seuil écrit ; animé : >1). Puis `fuser -k 3210/tcp`.
Expected aussi : le HTML pré-rendu (`.next/server/app/parcours.html`) contient `data-univers="cpge"` et la pose (aucun `translateY` non nul cuit dans les `.uc-page` — la porte naît fermée).

- [ ] **Step 5 : commit**

```bash
git add components/proto/univers-cpge.tsx app/parcours/cpge.css
git commit -m "La copie CPGE s'anime — l'encre s'écrit, la correction tombe après coup, les pages respirent autour du pli derrière la porte fermée ; la règle souligne, l'éponge efface, le tampon se réimprime

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Tâche 4 : les gates de sortie

**Files:**
- Aucun fichier de code — exécution des gates, captures, journal de chantier.

**Interfaces:**
- Consumes: tout ce qui précède, sur build de PRODUCTION.
- Produces: le chiffrage du banc, les captures de traversée, le commentaire d'issue #6.

- [ ] **Step 1 : les gates hors navigateur**

Run: `node tools/controles/contrastes.mjs` → étalonnage 15/15 puis **40 gates ✓** (31 existants + 9 CPGE), exit 0.
Run: `node tools/controles/garde-fous-chapitres.mjs` → **283 OK**, exit 0 (`chapitres.ts` intouché — tout écart est un bug).
Run: `npx tsc --noEmit` → exit 0.
Run: `npm run build` → vert, `/parcours` statique.
Run: `grep -c 'data-univers="cpge"' .next/server/app/parcours.html` → 1 ; `grep -c 'data-univers="estia"' .next/server/app/parcours.html` → 1 ; `grep -c 'id="hokkaido"' .next/server/app/parcours.html` → 1 ; `grep -c 'id="mbds"' .next/server/app/parcours.html` → 1.

- [ ] **Step 2 : le banc (frames)** — l'univers ajoute du mouvement scroll-lié (2 pages + 3 équations + 2 couches rouges + halo) :

```bash
fuser -k 3210/tcp 2>/dev/null; npx next start -p 3210 &
npm run banc -- http://localhost:3210/parcours parcours-cpge-nuit --tete
npm run banc -- http://localhost:3210/parcours parcours-cpge-jour --tete --clair
fuser -k 3210/tcp
```

Seuil : ≤ 10 % de frames > 8,3 ms à plancher égal (SEUIL.md). `--tete` exige une fenêtre réelle — si la machine est sans écran au moment de l'exécution, consigner « banc à passer en séance » dans le rapport et NE PAS conclure sur un relevé headless (il ment, doctrine du dépôt). Si une passe casse le seuil, suspects dans l'ordre : les reveals `clip-path` (repli → `imprime` simple), les DEUX couches de pages pleine taille (fusionner la respiration sur les pièces seules), le halo (le rendre statique).

- [ ] **Step 3 : les captures de gate** — viewport à N positions APRÈS traversée (jamais l'élément géant, jamais avant stabilisation des `whileInView` — le tampon naît à scale 1,35) : chapitre `#cpge` en NUIT et en JOUR, 4 positions de molette chacune, posées dans `$SCRATCH/captures-cpge/`. Vérité des poses par la sonde, les captures ne servent que l'œil.

- [ ] **Step 4 : le journal et la mémoire**

Commenter l'issue #6 (`gh issue comment 6 --body …`) : univers CPGE construit derrière ses gates — parti « grille corrigée en rouge », Caveat gatée, banc chiffré NUIT/JOUR (ou « à passer en séance »), Record UNIVERS extrait, prochaine planche = Hokkaido. **Pas de push** (auto-déploiement, décision Hugo).
Mettre à jour `~/.claude/projects/-home-hjuskowiak-PP-portfolio-hugo-juskowiak/memory/chantiers-arbitrages-en-attente.md` (+ la ligne d'index `MEMORY.md`) : CPGE construit, gates, suite = planche Hokkaido.

## Vérification finale

- Les 4 tâches commitées (4 commits français, co-signés), arbre propre hors `.scratch/`.
- `node tools/controles/contrastes.mjs` : 40 ✓, exit 0.
- `node tools/controles/garde-fous-chapitres.mjs` : 283 OK, exit 0.
- `npx tsc --noEmit` + `npm run build` : exit 0.
- Sonde `$SCRATCH/controle-cpge.mjs` sur build de prod : reduce = 1 transform distinct partout, verdict posé, seuil écrit ; animé = la copie respire. Console propre dans les deux modes.
- Banc `--tete` NUIT et JOUR ≤ 10 % (ou consigné « à passer en séance »).
- FR **et** EN à l'œil (bouton du cartouche-en-tête) : aucun texte l'un sur l'autre dans les deux langues (l'EN est plus long par endroits — « Admitted — ESTIA engineering cycle »).
- Les trois besoins de navigation atteignables au clavier depuis `#cpge`, dans chaque thème (focus visible sur FR/EN, thème, sortie).
- ESTIA intact (aucun sélecteur `.ue` touché), hokkaido/mbds sobres intacts.

## Points de vigilance

- **Le quadrillage est en px, les positions en %** : l'alignement couche-imprimée/carreaux est exact à 1240 de large ; en dessous il dérive doucement (même compromis qu'ESTIA, gate œil au bureau ≥ 1280). Ne pas « corriger » en background-size % : les carreaux doivent rester carrés.
- **`clip-path` anime le paint** — one-shot (`once`), jamais par frame de scroll ; le banc a le dernier mot, repli = `imprime`.
- **Caveat n'a pas de glyphe ✓** : les ✓✓ passent par le fallback `cursive` — vérifier à l'œil que le rendu reste digne ; sinon les sortir du `.uc-main` (mono).
- **Tout transform CSS d'une pièce pilotée par framer migre dans le style framer** (verdict, tampon, équations, coche, annote, souligné) — un résidu CSS est un bug silencieux, pas un filet.
- **`whileHover`/`whileTap` du tampon** : conditionnés `pointeurFin && !reduit` — au tactile le tampon est une image posée.
- **L'EN-TÊTE porte la navigation** : si une retouche le déplace, les trois besoins doivent rester atteignables (spec, pt 6 du grilling).
- Les rapports de sous-agents se trompent dans leurs COMPTES — exiger « chiffres recomptés ou rien » ; le code de sortie fait foi.
