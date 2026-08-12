# /parcours univers ESTIA — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**But :** le chapitre `#estia` de `/parcours` devient l'univers « Cyanotype / blueprint d'atelier » — la planche gatée v2.3 portée dans la vraie page, FR/EN, NUIT/JOUR, **avec ses animations et son interactivité propres** (directive Hugo 2026-08-12, addendum du spec `docs/superpowers/specs/2026-08-11-parcours-quatre-univers-design.md`).

**Architecture :** un composant dédié `UniversEstia` branché dans `page-parcours.tsx` par l'ancre (le pattern `CORPS[slug] ?? CORPS_GENERIQUE` des fiches, transposé) ; une feuille `app/parcours/estia.css` scopée `.ue` ; le thème JOUR se décline sous `html.clair` (le mécanisme du site — PAS de classe `jour` propre). Les données restent `chapitres.ts`, l'univers les met en scène sans les forker. Mouvement : la langue du dessin technique — les traits se **tracent**, le tampon **s'imprime**, le nuage **se dessine**, le calque **se soulève** au scroll (fonction pure) et se laisse **saisir** au pointeur fin. Sous `reduce` et au tactile : tout est posé.

**Stack :** rien de neuf. `motion/react` (déjà dep, patterns du dépôt : `whileInView` + `viewport once` + `transition={reduit ? {duration:0} : …}`), Lenis fenêtre, jetons CSS.

## Valeurs contractuelles (gate planche v2.3 — addendum du spec)

| Jeton | NUIT (base) | JOUR (`html.clair`) |
|---|---|---|
| `--ue-table` | `#050d18` | `#6e6350` |
| `--ue-feuille` | `#0e2a4a` | `#f0e9d8` |
| `--ue-feuille-bord` | `#081c33` | `#e6ddc8` |
| `--ue-papier-nu` | `#dfe3e6` | `#f0e9d8` |
| `--ue-trait` | `#e9eef5` (12,434) | `#1c3a5e` (9,554) |
| `--ue-trait-2` | `#a9bed6` (7,609) | `#48617f` (5,271) |
| `--ue-ligne` | `rgba(233,238,245,.30)` | `rgba(28,58,94,.34)` |
| `--ue-ligne-2` | `rgba(233,238,245,.14)` | `rgba(28,58,94,.14)` |
| `--ue-calque-fond` | `rgba(233,238,245,.07)` | `rgba(255,253,247,.55)` |
| `--ue-calque-bord` | `rgba(233,238,245,.38)` | `rgba(28,58,94,.35)` |
| `--ue-lampe` | `none` | flaque chaude (voir CSS Tâche 2) |
| `--ue-revision` | `#e9eef5` (bichrome !) | `#a83c22` (5,204 — nuage, RÉV., tampon) |

Composition « feuille de travail » : coordonnées de la planche v2.3 reprises telles quelles (feuille 1240×1830, pièces en % ; flux sous 1000px). Règle : les cadres peuvent se toucher, **les textes jamais** (pièces opaques `background: var(--ue-feuille)`).

## Contraintes globales

- **Les données sont l'invariant** : tout le contenu vient de `chapitres.ts` (`c.seuil/nom/intitule/jp/cadre/periode/etat/contexte/programme/travaux/competences/resultat`) — aucune chaîne de contenu dupliquée dans le composant. Les libellés d'appareil passent par `dict.ts`, FR **et** EN.
- **Trois besoins de navigation DANS l'univers** : le cartouche porte langue / thème / sortie (spec §« Contexte » pt 6).
- **Mouvement compositor-friendly** : transforms + opacité seulement ; exceptions comptées : `pathLength` du nuage (petit SVG, une fois) et le `backdrop-filter` du calque (1 surface — caveat assumé au spec, le banc tranchera).
- **`reduce` + tactile : tout posé** — `reduit` coupe les framer (`{duration:0}` / `initial:false`), le drag n'existe qu'au pointeur fin (`(hover: hover) and (pointer: fine)`).
- **Fonction pure du scroll** pour le calque (leçon de l'iris, revue #13) : le F5 en plein chapitre rend l'état exact.
- Tout sélecteur nouveau commence par `.ue` (même règle de survie à la navigation que `.pc-`). `parcours.css` et les chapitres sobres ne bougent pas.
- Aucune dépendance ni fonte nouvelle. `chapitres.ts`, `projets.ts`, `next.config.mjs` intouchés.
- **Jamais `git add -A`** ; commits français, `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- `$SCRATCH` = scratchpad de session, hors dépôt.

## Structure de fichiers

| Fichier | Changement |
|---|---|
| `components/proto/dict.ts` | + ~20 clés `ue*` (appareil de l'univers, FR/EN) |
| `tools/controles/contrastes.mjs` | + 6 gates ESTIA (NUIT ×2, JOUR ×3 dont sanguine, plancher WCAG) |
| `components/proto/univers-estia.tsx` (nouveau) | l'univers — structure + animations + interactivité |
| `app/parcours/estia.css` (nouveau) | matière et composition, NUIT base + JOUR sous `html.clair` |
| `components/proto/page-parcours.tsx` | branchement `UniversEstia` pour l'ancre `estia`, `useReducedMotion`, prop `setLang` |
| `app/parcours/page.tsx` | + `import "./estia.css"` |

## Hors périmètre

CPGE / Hokkaido / MBDS (chacun attend sa planche) ; les frontières (phase 3) ; la bascule (phase 4) ; toute retouche de la couverture sobre.

---

### Tâche 1 : l'appareil — clés dict et gates de contraste

**Files:**
- Modify: `components/proto/dict.ts` (après le bloc `pc*`, ~l.705)
- Modify: `tools/controles/contrastes.mjs` (fin du tableau `GATES`)

**Interfaces:**
- Produces: les clés `ue*` ci-dessous, consommées telles quelles par la Tâche 2 via `t(lang, "ueXxx")` ; les 6 gates tournent avec `node tools/controles/contrastes.mjs`.

- [ ] **Step 1 : les clés dict (FR et EN), verbatim**

Dans `components/proto/dict.ts`, après `pcSommaire` :

```ts
  /* ---------------- univers ESTIA — l'appareil du dessin (chantier #6) ---------------- */
  ueNote: { fr: "Note liminaire — l'entrée du chapitre", en: "Preliminary note — entering the chapter" },
  ueDetail: { fr: "Détail", en: "Detail" },
  ueVoirCalque: { fr: "voir calque", en: "see tracing sheet" },
  ueGhost: {
    fr: "L'échappée vit sur le calque, posé sur le tirage.",
    en: "The escape lives on the tracing sheet, laid over the print.",
  },
  ueCalque: { fr: "Calque", en: "Tracing sheet" },
  ueEchappee: { fr: "l'échappée", en: "the escape" },
  ueCalqueJp: { fr: "北海道 — 間", en: "北海道 — 間" },
  ueSecondeVoie: { fr: "seconde voie", en: "second track" },
  ueRev: { fr: "RÉV.", en: "REV." },
  ueVisa: { fr: "visa", en: "visa" },
  ueRail: { fr: "3 ans — le rail", en: "3 years — the rail" },
  ueNomenclature: { fr: "Nomenclature — compétences & outils", en: "Parts list — skills & tools" },
  ueRep: { fr: "Rep", en: "Ref" },
  ueDesignation: { fr: "Désignation", en: "Designation" },
  ueProjet: { fr: "Projet", en: "Project" },
  ueObjet: { fr: "Objet", en: "Subject" },
  ueUnivers: { fr: "Univers", en: "Universe" },
  ueUniversNom: { fr: "Cyanotype / blueprint d'atelier", en: "Cyanotype / workshop blueprint" },
  ueEchelle: { fr: "Échelle", en: "Scale" },
  ueEchelleVal: { fr: "1:1 — données seules", en: "1:1 — data only" },
  ueLangue: { fr: "Langue", en: "Language" },
  ueTheme: { fr: "Thème", en: "Theme" },
  ueSortie: { fr: "Sortie", en: "Exit" },
```

- [ ] **Step 2 : les gates de contraste**

Dans `tools/controles/contrastes.mjs`, à la fin du tableau `GATES` (mêmes quintuplets, plancher seul — `max: null`) :

```js
  /* ---- univers ESTIA (/parcours) — gate planche v2.3, addendum du spec ---- */
  ["ESTIA nuit trait #e9eef5 sur Prusse (texte ≥ 7)", "#e9eef5", "#0e2a4a", 7, null],
  ["ESTIA nuit annotation #a9bed6 sur Prusse (texte ≥ 4,5)", "#a9bed6", "#0e2a4a", 4.5, null],
  ["ESTIA jour encre #1c3a5e sur papier (texte ≥ 7)", "#1c3a5e", "#f0e9d8", 7, null],
  ["ESTIA jour annotation #48617f sur papier (texte ≥ 4,5)", "#48617f", "#f0e9d8", 4.5, null],
  ["ESTIA jour sanguine #a83c22 sur papier (texte ≥ 4,5)", "#a83c22", "#f0e9d8", 4.5, null],
  ["ESTIA jour sanguine #a83c22 sur papier (non-textuel ≥ 3)", "#a83c22", "#f0e9d8", 3, null],
```

- [ ] **Step 3 : vérifier**

Run: `node tools/controles/contrastes.mjs`
Expected: étalonnage OK puis tous gates ✓ (les 6 nouveaux : 12,434 / 7,609 / 9,554 / 5,271 / 5,204 / 5,204), exit 0.
Run: `npx tsc --noEmit` → exit 0.

- [ ] **Step 4 : commit**

```bash
git add components/proto/dict.ts tools/controles/contrastes.mjs
git commit -m "L'univers ESTIA reçoit son appareil — les libellés du dessin en deux langues, six gates de contraste armés

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Tâche 2 : la feuille — structure et matière (sans mouvement)

**Files:**
- Create: `components/proto/univers-estia.tsx`
- Create: `app/parcours/estia.css`
- Modify: `components/proto/page-parcours.tsx`
- Modify: `app/parcours/page.tsx` (+1 import)

**Interfaces:**
- Consumes: `type Chapitre` et `chapitres` (`./chapitres`) ; clés `ue*` (Tâche 1) + `fpContexte/fpProgramme/fpTravaux/fpResultat/fpRetourDocument/pcTitre` ; `ThemeToggle` (`./theme-toggle`).
- Produces: `export function UniversEstia({ c, lang, setLang, reduit }: { c: Chapitre; lang: Lang; setLang: (l: Lang) => void; reduit: boolean | null })` — la Tâche 3 y ajoute le mouvement sans changer cette signature.

- [ ] **Step 1 : le composant `components/proto/univers-estia.tsx`** (version posée — les crochets d'animation arrivent en Tâche 3)

```tsx
"use client"

/* ==================================================================
   UNIVERS CH.02 — ESTIA : cyanotype / blueprint d'atelier.
   La planche gatée v2.3 portée dans la page (addendum du spec).
   NUIT : le tirage — blanc sur Prusse, bichrome strict.
   JOUR (html.clair) : la table d'architecte — papier machine sous la
   lampe, la sanguine réservée aux révisions.
   Les données restent chapitres.ts — l'univers met en scène, il ne
   forke jamais. Le calque porte travaux[1] (l'échappée) : c'est
   l'amorce littérale de la frontière vers CH.03 (phase 3).
   ================================================================== */

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import type { Chapitre } from "./chapitres"
import { t, type Lang } from "./dict"

export function UniversEstia({
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
  /* la fin de période, pour le tampon : « 2022.09 → 2025.10 » → « 2025.10 » */
  const findePeriode = c.periode.split("→").pop()!.trim()

  return (
    <section id="estia" data-univers="estia" className="ue" aria-labelledby="pc-titre-estia">
      <div className="ue-tirage">
        <div className="ue-reperes" aria-hidden="true">
          <span className="h" style={{ left: "12.5%" }}>1</span><span className="h" style={{ left: "37.5%" }}>2</span><span className="h" style={{ left: "62.5%" }}>3</span><span className="h" style={{ left: "87.5%" }}>4</span>
          <span className="h b" style={{ left: "12.5%" }}>1</span><span className="h b" style={{ left: "37.5%" }}>2</span><span className="h b" style={{ left: "62.5%" }}>3</span><span className="h b" style={{ left: "87.5%" }}>4</span>
          <span className="v" style={{ top: "16.6%" }}>A</span><span className="v" style={{ top: "50%" }}>B</span><span className="v" style={{ top: "83.3%" }}>C</span>
          <span className="v d" style={{ top: "16.6%" }}>A</span><span className="v d" style={{ top: "50%" }}>B</span><span className="v d" style={{ top: "83.3%" }}>C</span>
        </div>
        <div className="ue-emulsion">
          <div className="ue-poche" aria-hidden="true"></div>

          <svg className="ue-rappels" aria-hidden="true" viewBox="0 0 1210 1830" preserveAspectRatio="none">
            <line x1="650" y1="390" x2="548" y2="330"></line>
            <circle cx="650" cy="390" r="2.5"></circle>
            <line x1="660" y1="812" x2="620" y2="885"></line>
            <circle cx="660" cy="812" r="2.5"></circle>
          </svg>

          <aside className="ue-piece ue-liminaire">
            <span className="mono mono-xs dim">{t(lang, "ueNote")}</span>
            {c.seuil}
          </aside>

          <header className="ue-piece ue-elevation">
            <p className="ue-cote mono mono-xs"><i aria-hidden="true">⟨</i>{c.periode}<i aria-hidden="true">⟩</i></p>
            <h2 id="pc-titre-estia" className="ue-nom">{c.nom}</h2>
            <div className="ue-el-ligne">
              <span className="jp ue-el-jp" lang="ja">{c.jp}</span>
              <span className="mono mono-xs dim">{c.cadre} · {c.etat}</span>
            </div>
            <p className="ue-el-sous">{c.intitule}</p>
          </header>

          <div className="ue-piece ue-cote-v" aria-hidden="true"><span>{t(lang, "ueRail")}</span></div>

          <div className="ue-piece ue-ctx">
            <div className="ue-vue-tete">
              <span className="ue-vue" aria-hidden="true"><i>A</i><b>02</b></span>
              <h3>{t(lang, "fpContexte")}</h3>
              <span className="ue-fil" aria-hidden="true"></span>
            </div>
            <p>{c.contexte}</p>
          </div>

          <div className="ue-piece ue-prog">
            <div className="ue-vue-tete">
              <span className="ue-vue" aria-hidden="true"><i>B</i><b>02</b></span>
              <h3>{t(lang, "fpProgramme")}</h3>
            </div>
            <ul>
              {c.programme.map((ligne) => (
                <li key={ligne}>{ligne}</li>
              ))}
            </ul>
          </div>

          <article className="ue-piece ue-detail ue-d01">
            <span className="mono mono-xs dim">{t(lang, "ueDetail")} D-01 · {t(lang, "fpTravaux")}</span>
            <h4>{c.travaux[0].titre}</h4>
            <p>{c.travaux[0].texte}</p>
          </article>

          <article className="ue-piece ue-detail ue-d02" aria-hidden="true">
            <span className="mono mono-xs dim">{t(lang, "ueDetail")} D-02 — {t(lang, "ueVoirCalque")}</span>
            <h4>{c.travaux[1].titre}</h4>
            <p>{t(lang, "ueGhost")}</p>
          </article>

          <article className="ue-piece ue-detail ue-d03">
            <svg className="ue-nuage" viewBox="0 0 420 240" preserveAspectRatio="none" aria-hidden="true">
              <path d="M30,30 Q45,8 62,26 Q80,4 98,24 Q118,4 136,24 Q156,4 174,24 Q194,6 212,26 Q232,6 250,26 Q270,8 288,26 Q308,8 326,28 Q346,10 362,30 Q382,16 388,42 Q404,52 392,72 Q408,88 392,106 Q406,124 390,140 Q404,158 386,172 Q398,192 378,200 Q368,222 346,210 Q330,230 310,214 Q292,232 272,214 Q252,232 232,214 Q212,232 192,214 Q172,230 152,212 Q132,228 112,210 Q92,226 74,208 Q52,220 44,198 Q22,192 30,170 Q12,156 28,138 Q12,120 30,104 Q14,86 32,70 Q18,52 30,30 Z"></path>
              {/* 2024.09 : l'entrée du MBDS — la date de la révision au plan */}
              <text x="330" y="16">{t(lang, "ueRev")} 2024.09</text>
            </svg>
            <span className="mono mono-xs dim">{t(lang, "ueDetail")} D-03 — {t(lang, "ueSecondeVoie")}</span>
            <h4>{c.travaux[2].titre}</h4>
            <p>{c.travaux[2].texte}</p>
          </article>

          <aside className="ue-piece ue-calque">
            <span className="mono mono-xs dim">{t(lang, "ueCalque")} — {t(lang, "ueDetail")} D-02 · {t(lang, "ueEchappee")}</span>
            <h4>{c.travaux[1].titre}</h4>
            <p>{c.travaux[1].texte}</p>
            <span className="jp ue-calque-jp" lang="ja">{t(lang, "ueCalqueJp")}</span>
          </aside>

          {c.resultat && (
            <p className="ue-piece ue-resultat">
              <span className="mono mono-xs dim">{t(lang, "fpResultat")}</span>
              {c.resultat}
            </p>
          )}

          <div className="ue-piece ue-nomenclature">
            <table>
              <caption className="mono mono-xs">{t(lang, "ueNomenclature")}</caption>
              <thead>
                <tr><th scope="col">{t(lang, "ueRep")}</th><th scope="col">{t(lang, "ueDesignation")}</th></tr>
              </thead>
              <tbody>
                {c.competences.map((o, i) => (
                  <tr key={o}><td>{String(i + 1).padStart(2, "0")}</td><td>{o}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ue-piece ue-tampon" role="img" aria-label={`${c.etat} — ${findePeriode}`}>
            <b>{c.etat}</b>
            <span>{findePeriode} — {t(lang, "ueVisa")}</span>
          </div>

          {/* le cartouche est la navigation de l'univers : langue, thème, sortie */}
          <dl className="ue-piece ue-cartouche">
            <div><dt>{t(lang, "ueProjet")}</dt><dd>{t(lang, "pcTitre")} — CH.{c.numero} / 04</dd></div>
            <div><dt>{t(lang, "ueObjet")}</dt><dd>{c.nom}</dd></div>
            <div><dt>{t(lang, "ueUnivers")}</dt><dd>{t(lang, "ueUniversNom")}</dd></div>
            <div><dt>{t(lang, "ueEchelle")}</dt><dd>{t(lang, "ueEchelleVal")}</dd></div>
            <div>
              <dt>{t(lang, "ueLangue")}</dt>
              <dd className="ue-nav">
                <button type="button" className="mono mono-xs" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>FR</button>
                <button type="button" className="mono mono-xs" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
              </dd>
            </div>
            <div><dt>{t(lang, "ueTheme")}</dt><dd className="ue-nav"><ThemeToggle lang={lang} /></dd></div>
            <div>
              <dt>{t(lang, "ueSortie")}</dt>
              <dd className="ue-nav">
                <Link href="/#carte-estia" className="mono mono-xs ue-sortie">
                  <span aria-hidden="true">←</span> {t(lang, "fpRetourDocument")}
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
```

Note : `reduit` est déjà dans la signature (la Tâche 3 s'en sert) — le composant posé ne l'utilise pas encore, c'est attendu ; préfixer `_reduit` si le lint râle, puis renommer en Tâche 3.

- [ ] **Step 2 : la feuille `app/parcours/estia.css`**

Port de la planche v2.3, scopée `.ue`, JOUR sous `:where(html.clair)` (spécificité tenue basse, même règle que le thème du site) :

```css
/* ==================================================================
   UNIVERS CH.02 — ESTIA (cyanotype / blueprint d'atelier).
   Feuille chargée par app/parcours/page.tsx, jamais retirée à la
   navigation : tout est scopé .ue. Valeurs = gate planche v2.3
   (addendum du spec 2026-08-12). NUIT en base ; JOUR sous html.clair.
   Ratios : nuit 12,434 / 7,609 · jour 9,554 / 5,271 · sanguine 5,204
   (gates armés dans tools/controles/contrastes.mjs).
   ================================================================== */

.ue {
  --ue-table: #050d18;
  --ue-feuille: #0e2a4a;
  --ue-feuille-bord: #081c33;
  --ue-papier-nu: #dfe3e6;
  --ue-trait: #e9eef5;
  --ue-trait-2: #a9bed6;
  --ue-ligne: rgba(233, 238, 245, 0.30);
  --ue-ligne-2: rgba(233, 238, 245, 0.14);
  --ue-calque-fond: rgba(233, 238, 245, 0.07);
  --ue-calque-bord: rgba(233, 238, 245, 0.38);
  --ue-lampe: none;
  --ue-ombre: none;
  --ue-revision: #e9eef5; /* la NUIT reste bichrome : sa chimie */

  background: var(--ue-table);
  color: var(--ue-trait);
  padding: clamp(2rem, 6vw, 5rem) clamp(0.75rem, 3vw, 2.5rem);
  scroll-margin-block-start: 0; /* le monde est plein écran : l'ancre pose la feuille en haut */
  margin-top: 24vh;
}

:where(html.clair) .ue {
  --ue-table: #6e6350;
  --ue-feuille: #f0e9d8;
  --ue-feuille-bord: #e6ddc8;
  --ue-papier-nu: #f0e9d8;
  --ue-trait: #1c3a5e;
  --ue-trait-2: #48617f;
  --ue-ligne: rgba(28, 58, 94, 0.34);
  --ue-ligne-2: rgba(28, 58, 94, 0.14);
  --ue-calque-fond: rgba(255, 253, 247, 0.55);
  --ue-calque-bord: rgba(28, 58, 94, 0.35);
  --ue-lampe: radial-gradient(95% 75% at 35% 6%, rgba(255, 242, 205, 0.95), rgba(255, 242, 205, 0) 58%);
  --ue-ombre:
    linear-gradient(115deg, transparent 58%, rgba(66, 52, 28, 0.07) 64%, rgba(66, 52, 28, 0.15) 100%),
    radial-gradient(130% 110% at 35% 8%, transparent 55%, rgba(66, 52, 28, 0.10) 100%);
  --ue-revision: #a83c22; /* le crayon gras des corrections — JOUR seulement */
}

/* les utilitaires du site (.mono/.dim/.jp) gardent leurs tailles ;
   seule la couleur suit l'univers */
.ue .dim { color: var(--ue-trait-2); }

/* ---- la feuille ---- */
.ue-tirage {
  position: relative;
  max-width: 1240px;
  margin: 0 auto;
  background: var(--ue-papier-nu);
  padding: 14px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
}
:where(html.clair) .ue-tirage { box-shadow: 0 40px 90px rgba(30, 22, 8, 0.5); }

.ue-reperes {
  position: absolute; inset: 0; pointer-events: none;
  font-family: var(--f-mono); font-size: 9px; line-height: 14px; color: #5b6b80;
}
.ue-reperes span { position: absolute; }
.ue-reperes .h { top: 0; transform: translateX(-50%); }
.ue-reperes .h.b { top: auto; bottom: 0; }
.ue-reperes .v { left: 0; width: 14px; text-align: center; transform: translateY(-50%); }
.ue-reperes .v.d { left: auto; right: 0; }

.ue-emulsion {
  position: relative;
  height: 1830px;
  background:
    var(--ue-lampe),
    radial-gradient(140% 110% at 30% 12%, rgba(255, 255, 255, 0.06), transparent 60%),
    radial-gradient(120% 140% at 85% 95%, rgba(0, 0, 0, 0.18), transparent 55%),
    var(--ue-feuille);
  outline: 1px solid var(--ue-ligne);
  overflow: hidden;
}
.ue-emulsion::before {
  content: "";
  position: absolute; inset: 0; pointer-events: none;
  background:
    linear-gradient(90deg, var(--ue-feuille-bord), transparent 2.5%),
    linear-gradient(-90deg, var(--ue-feuille-bord), transparent 3%),
    linear-gradient(180deg, var(--ue-feuille-bord), transparent 2%),
    linear-gradient(0deg, var(--ue-feuille-bord), transparent 3.5%);
  opacity: 0.8;
}
:where(html.clair) .ue-emulsion::before { opacity: 0.35; }
/* JOUR : l'ombre du bras de lampe + la retombée de lumière — au-dessus
   des pièces, comme la vraie lumière ; alphas ≤ .15, ratios tenus */
.ue-emulsion::after {
  content: "";
  position: absolute; inset: 0; pointer-events: none;
  background: var(--ue-ombre);
}

.ue-poche {
  position: absolute;
  left: -4%; top: 31.5%;
  width: 112%; height: 90px;
  transform: rotate(-3.2deg);
  background-image: repeating-linear-gradient(45deg, var(--ue-ligne-2) 0 1px, transparent 1px 8px);
  border-top: 1px solid var(--ue-ligne-2);
  border-bottom: 1px solid var(--ue-ligne-2);
}

.ue-rappels { position: absolute; inset: 0; pointer-events: none; }
.ue-rappels line { stroke: var(--ue-ligne); stroke-width: 1; }
.ue-rappels circle { fill: var(--ue-trait-2); }

/* ---- grammaire ---- */
.ue-vue {
  display: inline-grid; place-items: center; grid-template-rows: 1fr 1fr;
  width: 2.1em; height: 2.1em;
  border: 1px solid var(--ue-trait); border-radius: 50%;
  font-family: var(--f-mono); font-size: 0.625rem; line-height: 1;
  position: relative; flex: none;
}
.ue-vue::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px solid var(--ue-trait); }
.ue-vue i { font-style: normal; padding-bottom: 0.2em; }
.ue-vue b { font-weight: 400; padding-top: 0.25em; color: var(--ue-trait-2); }

.ue-vue-tete { display: flex; align-items: center; gap: 0.8rem; border-bottom: 1px solid var(--ue-ligne); padding-bottom: 0.55rem; margin-bottom: 0.9rem; }
.ue-vue-tete h3 { font-family: var(--f-mono); font-size: 0.6875rem; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500; }
.ue-vue-tete .ue-fil { flex: 1; height: 6px; background-image: repeating-linear-gradient(45deg, var(--ue-ligne-2) 0 1px, transparent 1px 7px); }

/* ---- les pièces ---- */
.ue-piece { position: absolute; }

.ue-liminaire {
  top: 3.2%; right: 4.5%;
  width: 21.5rem;
  transform: rotate(0.6deg);
  border: 1px solid var(--ue-ligne);
  border-left: 2px solid var(--ue-trait);
  padding: 0.9rem 1.1rem;
  font-style: italic;
  font-size: 0.95rem;
  color: var(--ue-trait-2);
  background: var(--ue-feuille);
}
.ue-liminaire .mono-xs { display: block; font-style: normal; margin-bottom: 0.45rem; }

.ue-elevation { top: 7.5%; left: 4.5%; width: 62%; }
.ue-cote {
  display: flex; align-items: center; gap: 0.8rem;
  color: var(--ue-trait-2);
  width: 138%;
}
.ue-cote::before, .ue-cote::after { content: ""; flex: 1; border-top: 1px solid var(--ue-ligne); }
.ue-cote i { font-style: normal; flex: none; }
.ue-nom {
  font-family: var(--f-display);
  font-stretch: 78%;
  font-weight: 800;
  font-size: clamp(4rem, 12.5vw, 10rem);
  line-height: 0.9;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  margin: 1rem 0 0.5rem -0.045em;
}
.ue-el-ligne { display: flex; align-items: baseline; gap: 1.2rem; flex-wrap: wrap; }
.ue-el-jp { font-size: 1.05rem; letter-spacing: 0.42em; color: var(--ue-trait-2); }
.ue-el-sous { font-size: 1.06rem; font-weight: 500; margin-top: 0.6rem; max-width: 30rem; }

.ue-cote-v {
  top: 36.5%; right: 1.8%;
  height: 300px; width: 1px;
  border-right: 1px solid var(--ue-ligne);
  display: flex; align-items: center;
}
.ue-cote-v span {
  transform: rotate(90deg); white-space: nowrap;
  font-family: var(--f-mono); font-size: 0.625rem; letter-spacing: 0.3em;
  color: var(--ue-trait-2); background: var(--ue-feuille); padding: 0 0.8em; margin-left: -2.4em;
}
.ue-cote-v::before, .ue-cote-v::after { content: ""; position: absolute; right: -3px; width: 7px; border-top: 1px solid var(--ue-ligne); }
.ue-cote-v::before { top: 0; }
.ue-cote-v::after { bottom: 0; }

.ue-ctx { top: 20.5%; left: 53%; width: 26rem; }
.ue-ctx p { font-size: 0.98rem; }

.ue-prog { top: 42%; right: 4.5%; width: 16.5rem; }
.ue-prog ul { list-style: none; margin: 0; padding: 0; }
.ue-prog li { font-size: 0.88rem; color: var(--ue-trait-2); padding-left: 1.2rem; position: relative; margin-bottom: 0.7rem; }
.ue-prog li::before { content: "—"; position: absolute; left: 0; }

.ue-detail { background: var(--ue-feuille); }
.ue-detail .mono-xs { display: block; margin-bottom: 0.6rem; }
.ue-detail h4 { font-size: 1rem; font-weight: 600; margin-bottom: 0.45rem; }
.ue-detail p { font-size: 0.92rem; color: var(--ue-trait-2); }
.ue-detail::before, .ue-detail::after {
  content: ""; position: absolute; width: 9px; height: 9px; border: 0 solid var(--ue-trait);
}
.ue-detail::before { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
.ue-detail::after { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; }

.ue-d01 { top: 46%; left: 4.5%; width: 29rem; border: 1px solid var(--ue-ligne); padding: 1.2rem 1.3rem 1.4rem; }
.ue-d02 { top: 48.5%; left: 45.5%; width: 17rem; border: 1px dashed var(--ue-ligne); padding: 1rem 1.1rem; }
.ue-d02 h4, .ue-d02 p { opacity: 0.4; }
.ue-d03 {
  top: 60%; left: 27%; width: 22rem;
  border: 1px solid var(--ue-ligne); border-left: 3px double var(--ue-trait);
  padding: 1.1rem 1.2rem 1.3rem;
  transform: rotate(-0.5deg);
}

.ue-nuage { position: absolute; inset: -26px -30px; pointer-events: none; overflow: visible; }
.ue-nuage path { fill: none; stroke: var(--ue-revision); stroke-width: 1; opacity: 0.7; }
.ue-nuage text { font-family: var(--f-mono); font-size: 10px; fill: var(--ue-revision); letter-spacing: 0.1em; }

.ue-calque {
  top: 31.5%; left: 31%;
  width: 23rem;
  transform: rotate(-4.6deg);
  background: var(--ue-calque-fond);
  border: 1px solid var(--ue-calque-bord);
  backdrop-filter: blur(1.5px);
  padding: 1rem 1.15rem 2.3rem;
  box-shadow: -14px 18px 28px rgba(0, 0, 0, 0.28);
  cursor: grab;
}
:where(html.clair) .ue-calque { box-shadow: -14px 18px 22px rgba(43, 34, 16, 0.18); }
.ue-calque::after {
  content: ""; position: absolute; right: -1px; bottom: -1px; width: 26px; height: 26px;
  background: linear-gradient(315deg, transparent 48%, var(--ue-calque-bord) 49%, var(--ue-calque-fond) 52%);
}
.ue-calque .mono-xs { display: block; margin-bottom: 0.5rem; }
.ue-calque h4 { font-size: 0.98rem; font-weight: 600; margin-bottom: 0.35rem; }
.ue-calque p { font-size: 0.88rem; color: var(--ue-trait-2); }
.ue-calque-jp { letter-spacing: 0.3em; display: block; margin-top: 0.7rem; color: var(--ue-trait-2); font-size: 0.8rem; }

.ue-resultat {
  left: 4.5%; bottom: 14.5%;
  max-width: 30rem;
  font-size: 0.92rem;
  color: var(--ue-trait-2);
}
.ue-resultat .mono-xs { display: block; margin-bottom: 0.35rem; }

.ue-nomenclature { left: 4.5%; bottom: 3.5%; width: 30rem; max-width: 40%; }
.ue-nomenclature table { border-collapse: collapse; width: 100%; font-family: var(--f-mono); font-size: 0.72rem; letter-spacing: 0.06em; }
.ue-nomenclature caption { text-align: left; letter-spacing: 0.2em; text-transform: uppercase; padding-bottom: 0.55rem; font-weight: 500; }
.ue-nomenclature th, .ue-nomenclature td { border: 1px solid var(--ue-ligne); padding: 0.45em 0.8em; text-align: left; font-weight: 400; }
.ue-nomenclature th { color: var(--ue-trait-2); text-transform: uppercase; font-size: 0.625rem; letter-spacing: 0.14em; }
.ue-nomenclature td:first-child { width: 3.5em; color: var(--ue-trait-2); }

.ue-tampon {
  right: 30%; bottom: 13%;
  transform: rotate(-7deg);
  color: var(--ue-revision);
  border: 2px solid var(--ue-revision);
  outline: 1px solid var(--ue-ligne);
  outline-offset: 3px;
  padding: 0.7rem 1.3rem;
  text-align: center;
  font-family: var(--f-mono);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  z-index: 2;
}
.ue-tampon b { display: block; font-size: 1.05rem; font-weight: 700; }
.ue-tampon span { font-size: 0.625rem; color: var(--ue-trait-2); letter-spacing: 0.2em; }
:where(html.clair) .ue-tampon span { color: var(--ue-revision); }

.ue-cartouche {
  right: 4.5%; bottom: 3.5%; width: 26rem;
  border: 1px solid var(--ue-trait);
  font-family: var(--f-mono); font-size: 0.66rem; letter-spacing: 0.1em;
  background: var(--ue-feuille);
  margin: 0;
}
.ue-cartouche div { display: grid; grid-template-columns: 7em 1fr; border-top: 1px solid var(--ue-ligne); }
.ue-cartouche div:first-child { border-top: 0; }
.ue-cartouche dt { padding: 0.42em 0.7em; border-right: 1px solid var(--ue-ligne); color: var(--ue-trait-2); text-transform: uppercase; font-size: 0.6rem; }
.ue-cartouche dd { padding: 0.42em 0.7em; text-transform: uppercase; margin: 0; }
.ue-nav { display: flex; align-items: center; gap: 0.7rem; }
.ue-nav button {
  font: inherit; background: none; border: 0; cursor: pointer;
  color: var(--ue-trait-2); padding: 0; letter-spacing: inherit; text-transform: inherit;
}
.ue-nav button[aria-pressed="true"] { color: var(--ue-trait); text-decoration: underline; text-underline-offset: 0.3em; }
.ue-nav button:focus-visible, .ue-sortie:focus-visible { outline: 2px solid var(--ue-trait); outline-offset: 2px; }
.ue-sortie { color: var(--ue-trait); text-decoration: none; }
/* le ThemeToggle du site, à l'échelle du cartouche */
.ue-nav .langtoggle { display: flex; gap: 0.7rem; }
.ue-nav .langtoggle button { font-size: 0.66rem; }

/* ---- petit écran : la feuille redevient un flux ---- */
@media (max-width: 1000px) {
  .ue-emulsion { height: auto; padding: 1.5rem; }
  .ue-piece { position: static; width: auto !important; max-width: 34rem; transform: none !important; margin-bottom: 1.6rem; }
  .ue-poche, .ue-rappels, .ue-cote-v, .ue-nuage { display: none; }
  .ue-cote { width: 100%; }
}
```

- [ ] **Step 3 : brancher dans `components/proto/page-parcours.tsx`**

1. Imports : ajouter `import { useReducedMotion } from "motion/react"` et `import { UniversEstia } from "./univers-estia"`.
2. Dans le composant : `const reduit = useReducedMotion()` (sous le `useState`).
3. Dans le `liste.map(...)`, l'ancre `estia` prend son univers, les autres gardent le rendu sobre :

```tsx
      {liste.map((c) =>
        /* Chaque univers remplace son chapitre sobre quand sa planche est
           gatée — le pattern CORPS[slug] des fiches, transposé. Un Record
           viendra quand un DEUXIÈME univers existera. */
        c.ancre === "estia" ? (
          <UniversEstia key="estia" c={c} lang={lang} setLang={setLang} reduit={reduit} />
        ) : (
          <section key={c.ancre} id={c.ancre} className="pc-chapitre" aria-labelledby={`pc-titre-${c.ancre}`}>
```

(le reste du rendu sobre inchangé, fermeture du ternaire après `</section>`).

4. Dans `app/parcours/page.tsx` : ajouter `import "./estia.css"` sous l'import de `parcours.css`.

- [ ] **Step 4 : vérifier**

Run: `npx tsc --noEmit` → exit 0.
Run: `npm run build` → vert, `/parcours` statique.
Run: `grep -c 'data-univers="estia"' .next/server/app/parcours.html` → 1 ; `grep -c 'id="cpge"' .next/server/app/parcours.html` → 1 (les chapitres sobres vivent toujours).
Screenshots des deux thèmes (serveur `npx next start -p 3210`, script `$SCRATCH` de capture comme en phase 1) — regarder : aucune fuite de l'univers sur la couverture/les autres chapitres, aucun texte sur texte.

- [ ] **Step 5 : commit**

```bash
git add components/proto/univers-estia.tsx app/parcours/estia.css components/proto/page-parcours.tsx app/parcours/page.tsx
git commit -m "Le chapitre ESTIA entre dans son univers — la feuille de travail cyanotype posée dans la page, cartouche-navigation, FR/EN sous deux thèmes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Tâche 3 : le mouvement — la langue du dessin, et la main

**Files:**
- Modify: `components/proto/univers-estia.tsx`
- Modify: `app/parcours/estia.css` (états hover des repères)

**Interfaces:**
- Consumes: la signature `UniversEstia` de la Tâche 2 (inchangée) ; `motion/react` : `motion`, `useScroll`, `useSpring`, `useTransform`.
- Produces: le chapitre animé ; sous `reduce` et au tactile, strictement posé (l'état final de la Tâche 2).

**Le CAP de mouvement (directive Hugo : les animations de CE monde, dans SA langue) :**

| Pièce | Mouvement | Mécanique |
|---|---|---|
| cotes & filets (`.ue-cote`, `.ue-vue-tete`) | se **tracent** à l'approche | `scaleX 0→1`, origine gauche, once, 0,7 s ease du dépôt |
| pièces de texte | se **révèlent** (l'encre prend) | `opacity 0→1` léger `y 8→0`, once, cascade 40 ms |
| nuage de révision | se **dessine** | `pathLength 0→1`, 1,2 s, once (petit SVG, coût compté) |
| tampon | s'**imprime** | `scale 1.35→1` + `opacity 0→1`, 0,18 s — le coup sec |
| calque | se **soulève** au scroll | `useScroll` sur la feuille + `useSpring` → `rotate -2,2°→-6,4°`, `y 12→-26` — fonction pure du scroll |
| calque (pointeur fin) | se laisse **saisir** | `drag` framer, contraintes ±14/±10 px, `dragElastic 0.18`, `dragSnapToOrigin` — on soulève le calque, il retombe |
| repères Ⓐ/Ⓑ (CSS seul) | s'**allument** au survol de leur bloc | `.ue-ctx:hover .ue-vue` (et prog) : fond `--ue-trait`, encre `--ue-feuille` |

- [ ] **Step 1 : les crochets framer dans `univers-estia.tsx`**

En tête :

```tsx
import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useSpring, useTransform } from "motion/react"
```

Dans le composant, avant le `return` :

```tsx
  const feuille = useRef<HTMLDivElement>(null)
  /* le calque suit le scroll — FONCTION PURE : le F5 en pleine feuille
     rend l'état exact (leçon de l'iris, revue #13) */
  const { scrollYProgress } = useScroll({ target: feuille, offset: ["start end", "end start"] })
  const souleve = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })
  const rotCalque = useTransform(souleve, [0, 1], [-2.2, -6.4])
  const yCalque = useTransform(souleve, [0, 1], [12, -26])

  /* la main n'existe qu'au pointeur fin — au tactile le drag volerait
     le scroll de la page */
  const [pointeurFin, setPointeurFin] = useState(false)
  useEffect(() => {
    setPointeurFin(matchMedia("(hover: hover) and (pointer: fine)").matches)
  }, [])

  const EASE = [0.22, 1, 0.36, 1] as const
  /* un filet qui se trace ; sous reduce : posé (le CSS n'atteint pas
     framer — doctrine planche.css:1570) */
  const traceur = (delai = 0) => ({
    initial: reduit ? false : ({ scaleX: 0 } as const),
    whileInView: { scaleX: 1 },
    viewport: { once: true, amount: 0.5 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.7, delay: delai, ease: EASE },
    style: { transformOrigin: "left center" } as const,
  })
  const encre = (delai = 0) => ({
    initial: reduit ? false : ({ opacity: 0, y: 8 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.35 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.5, delay: delai, ease: EASE },
  })
```

- `ref={feuille}` sur `<div className="ue-emulsion">`.
- Les pièces deviennent des `motion.*` : `ue-liminaire`, `ue-ctx`, `ue-prog`, `ue-d01`, `ue-d02`, `ue-d03`, `ue-resultat`, `ue-nomenclature`, `ue-cartouche` reçoivent `{...encre(i * 0.04)}` (i = ordre d'apparition) ; `ue-cote` et chaque `ue-vue-tete` reçoivent `{...traceur()}` (sur un `motion.p`/`motion.div`).
- Le tampon :

```tsx
          <motion.div
            className="ue-piece ue-tampon"
            role="img"
            aria-label={`${c.etat} — ${findePeriode}`}
            initial={reduit ? false : { opacity: 0, scale: 1.35 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={reduit ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
          >
```

- Le nuage : `<motion.path d="…" initial={reduit ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, amount: 0.6 }} transition={reduit ? { duration: 0 } : { duration: 1.2, ease: "easeInOut" }} />`.
- Le calque :

```tsx
          <motion.aside
            className="ue-piece ue-calque"
            style={reduit ? undefined : { rotate: rotCalque, y: yCalque }}
            drag={pointeurFin && !reduit}
            dragConstraints={{ left: -14, right: 14, top: -10, bottom: 10 }}
            dragElastic={0.18}
            dragSnapToOrigin
            whileDrag={{ scale: 1.015 }}
            whileHover={pointeurFin && !reduit ? { rotate: -7.5 } : undefined}
          >
```

- [ ] **Step 2 : les repères qui s'allument (CSS seul, `estia.css`)**

```css
/* le repère s'allume quand on est chez lui — l'œil trouve la vue */
.ue-ctx:hover .ue-vue, .ue-prog:hover .ue-vue,
.ue-ctx:focus-within .ue-vue, .ue-prog:focus-within .ue-vue {
  background: var(--ue-trait);
  color: var(--ue-feuille);
}
.ue-calque { will-change: transform; }
@media (prefers-reduced-motion: reduce) {
  .ue-calque { will-change: auto; cursor: default; }
}
```

- [ ] **Step 3 : contrôle reduce + fonctionnel (script `$SCRATCH`, jetable)**

Même socle playwright-core que les contrôles du dépôt (binaire `~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`, `--no-sandbox`) ; build + `npx next start -p 3210` :

```js
/* Contrôle jetable — univers ESTIA : reduce posé, calque scroll-lié, nav cartouche.
   node $SCRATCH/controle-estia.mjs [url]   (défaut http://localhost:3210/parcours) */
import { chromium } from "playwright-core"
import { existsSync } from "node:fs"
const BASE = process.argv[2] ?? "http://localhost:3210/parcours"
const CHROME = process.env.CHROME ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`
if (!existsSync(CHROME)) { console.error(`Chrome introuvable (${CHROME})`); process.exit(2) }
const nav = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] })
let echecs = 0
const dire = (ok, quoi, detail) => { if (!ok) echecs++; console.log(`${ok ? "OK  " : "FAIL"}  ${quoi}${detail ? `  →  ${detail}` : ""}`) }

/* 1 — sous reduce : le calque est POSÉ (transform stable sur 1,2 s au repos) */
{
  const ctx = await nav.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 }, colorScheme: "dark" })
  const p = await ctx.newPage()
  await p.goto(`${BASE}#estia`, { waitUntil: "load" })
  const r = await p.evaluate(() => new Promise((res) => {
    const el = document.querySelector(".ue-calque")
    const vues = []
    const t0 = performance.now()
    const tick = () => {
      vues.push(getComputedStyle(el).transform)
      if (performance.now() - t0 < 1200) requestAnimationFrame(tick)
      else res([...new Set(vues)].length)
    }
    requestAnimationFrame(tick)
  }))
  dire(r === 1, "reduce : le calque est posé", `${r} transform distincts`)
  await ctx.close()
}

/* 2 — sans reduce : le calque BOUGE avec le scroll (fonction du scroll) */
{
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" })
  const p = await ctx.newPage()
  await p.goto(`${BASE}#estia`, { waitUntil: "load" })
  await p.waitForTimeout(600)
  const avant = await p.evaluate(() => getComputedStyle(document.querySelector(".ue-calque")).transform)
  await p.mouse.wheel(0, 900)
  await p.waitForTimeout(900)
  const apres = await p.evaluate(() => getComputedStyle(document.querySelector(".ue-calque")).transform)
  dire(avant !== apres, "scroll : le calque se soulève", `${avant.slice(0, 28)}… → ${apres.slice(0, 28)}…`)

  /* 3 — la nav du cartouche : EN bascule, JOUR pose html.clair, sortie vise la carte */
  await p.click('.ue-cartouche button:text-is("EN")')
  const h4 = (await p.textContent(".ue-d01 h4")).trim()
  dire(h4 === "Two software engineering internships", "cartouche : EN bascule le contenu", h4)
  await p.click('.ue-cartouche .langtoggle button:text-is("LIGHT")')
  const clair = await p.evaluate(() => document.documentElement.classList.contains("clair"))
  dire(clair, "cartouche : LIGHT pose html.clair")
  const sortie = await p.getAttribute(".ue-sortie", "href")
  dire(sortie === "/#carte-estia", "cartouche : la sortie vise la carte", sortie)
  await ctx.close()
}
await nav.close()
process.exit(echecs ? 1 : 0)
```

Note : après bascule EN, le ThemeToggle affiche `DARK/LIGHT` (dict `themeClair`). Le titre EN de D-01 est `travaux[0].titre` EN — vérifier la chaîne exacte dans `chapitres.ts` (`Two software engineering internships`) avant d'écrire l'assertion ; si elle diffère, prendre la vraie.

Run: `node $SCRATCH/controle-estia.mjs` → tout OK, exit 0. Puis `fuser -k 3210/tcp`.

- [ ] **Step 4 : commit**

```bash
git add components/proto/univers-estia.tsx app/parcours/estia.css
git commit -m "L'univers ESTIA apprend le geste — les traits se tracent, le tampon s'imprime, le nuage se dessine, le calque se soulève au scroll et se laisse saisir

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Tâche 4 : les gates de sortie

**Files:**
- aucun nouveau — exécution des contrôles, corrections éventuelles dans le périmètre des Tâches 1-3.

- [ ] **Step 1 : la batterie**

```bash
node tools/controles/contrastes.mjs        # étalonnage + 6 gates ESTIA → exit 0
node tools/controles/garde-fous-chapitres.mjs   # les données n'ont pas bougé → exit 0
npx tsc --noEmit
npm run build                              # vert, /parcours statique
git status --short                         # rien hors périmètre
```

- [ ] **Step 2 : le banc (frames)** — la page a maintenant du mouvement scroll-lié :

```bash
npm run build && npx next start -p 3210 &
npm run banc -- http://localhost:3210/parcours parcours-estia-nuit --tete
npm run banc -- http://localhost:3210/parcours parcours-estia-jour --tete --clair
fuser -k 3210/tcp
```

Seuil : ≤ 10 % de frames > 8,3 ms à plancher égal (SEUIL.md). `--tete` exige une fenêtre réelle — si la machine est sans écran au moment de l'exécution, consigner « banc à passer en séance » dans le rapport et NE PAS conclure sur un relevé headless (il ment, doctrine du dépôt). Si une passe casse le seuil : suspects dans l'ordre — `pathLength` du nuage (le passer en apparition simple), le `backdrop-filter` du calque (flou pré-cuit dans `--ue-calque-fond` opaque), les ombres portées.

- [ ] **Step 3 : captures pour le gate à l'œil Hugo**

Deux thèmes × (chapitre entier + gros plan calque/tampon), posées dans `$SCRATCH` — c'est Hugo qui tranche sur build de production, pas la CI.

- [ ] **Step 4 : signaler**

Commenter l'issue #6 : univers ESTIA construit derrière ses gates, banc chiffré (ou « à passer en séance »), prochaine planche = CPGE. Pas de push (auto-déploiement).

## Vérification finale

- Les 4 ancres répondent toujours (`#cpge…#mbds`), les trois chapitres sobres intacts, la couverture intacte.
- L'univers répond aux trois besoins DANS le cartouche (langue/thème/sortie), au clavier.
- `reduce` : chapitre strictement posé (contrôle Step 3 Tâche 3).
- FR/EN : tout le contenu bascule (données) ET tout l'appareil (dict).
- Aucune couleur hors jetons `--ue-*` ; la sanguine n'apparaît qu'en JOUR.
- Les fiches `/work` vivent toujours (rien de la phase 4).

## Points de vigilance

- **`useScroll` + Lenis** : Lenis scrolle la vraie fenêtre (config du dépôt) — `useScroll({ target })` fonctionne sans `container` (précédent : `world.tsx:116`).
- **`drag` framer et le scroll** : le drag n'est actif qu'au pointeur fin ; ne jamais l'activer au tactile.
- **`pathLength`** anime le paint du SVG — petit élément, once ; le banc a le dernier mot.
- **`position: static` du fallback mobile** neutralise le drag/scroll-transform proprement (transform: none !important) — vérifier qu'aucun motion value ne le ré-écrase (le `style` framer gagne sur la feuille : sous 1000px, passer `style={undefined}`… NON : garder simple, le `!important` du CSS ne tient pas contre le style inline framer ; la bonne coupe est `reduit`/`pointeurFin` + accepter le léger scroll-lift sur tablette paysage > 1000px).
- Le cartouche contient des boutons dans un `<dl>` — valide (dd accepte du flux), garder `aria-pressed` cohérent.

---

### Tâche 5 : la feuille respire au scroll (ajout du 2026-08-12 soir — directive Hugo : « encore du mouvement »)

**Files:**
- Modify: `components/proto/univers-estia.tsx`
- Modify: `app/parcours/estia.css`

**Le CAP — quatre mouvements continus, fonction pure du scroll (`souleve`), amplitudes discrètes :**

| Mouvement | Pièce | Plage | Mécanique |
|---|---|---|---|
| le rail se mesure | ligne de la cote-v | `scaleY 0.15 → 1`, origine haut | ligne = élément dédié (motion.span absolu dans `.ue-cote-v`) — le label rotaté ne se déforme JAMAIS ; les pointes (::before/::after) restent posées |
| les strates dérivent | titre (`.ue-elevation`), note (`.ue-liminaire`), poché | titre `y 0→-12` ; note `y 0→-18` ; poché `x -14→14` | parallaxe ≤ 20px — de la profondeur, pas du spectacle |
| les repères savent où tu es | les 6 lettres A/B/C des marges | opacité 0,35 → 1 sur le tiers courant | 3 paliers de `useTransform(souleve)` (0-1/3 → A, 1/3-2/3 → B, sinon C) ; les chiffres 1-4 restent statiques |
| la lampe suit la lecture (JOUR seul) | couche `.ue-lampe` neuve | `y 0 → 90px` | le radial de `--ue-lampe` passe du fond de `.ue-emulsion` à une div absolue (`inset: -12%`, pointer-events none, sous ::after) translatée — gradient peint une fois, transform compositor ; en NUIT la couche est transparente |

**Migration porte multiplicative (règle gravée au ledger, s'applique à TOUT le scroll-lié, calque compris) :**

```tsx
const porte = useMotionValue(1)
useEffect(() => { porte.set(reduit ? 0 : 1) }, [reduit, porte])
/* chaque valeur : pose + porte × progression × amplitude — le SSR rend
   la pose, reduce ÉCRIT la pose (plus jamais de résidu) */
const rotCalque = useTransform([souleve, porte], ([p, g]: number[]) => -4.6 + g * p * -4.2)
const yCalque = useTransform([souleve, porte], ([p, g]: number[]) => g * p * -38)
```

Le `style={reduit ? undefined : …}` du calque DISPARAÎT (le style est toujours actif, la porte fait le travail). Idem pour les quatre mouvements neufs. Les révélations one-shot (encre/traceur/tampon/nuage) ne changent pas.

**Steps :**
- [ ] les crochets + la couche lampe + la ligne de cote-v dédiée ; `npx tsc --noEmit` → 0
- [ ] contrôle `$SCRATCH` : sous reduce, `.ue-calque`, la ligne de cote-v et `.ue-lampe` rendent UN transform distinct sur 1,2 s ; sans reduce, chacun bouge au scroll ; F5 en milieu de section → état exact (fonction pure)
- [ ] gates : `npm run build`, garde-fous, **banc `--tete` NUIT et JOUR repassés** (mouvement continu ajouté — consigner les nouveaux %) ; captures traversée × 2 thèmes
- [ ] commit : « La feuille respire au scroll — le rail se mesure, les strates dérivent, les repères savent où tu es, la lampe suit la lecture »
