# Bi-thème clair P1 MSO — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**But :** un thème clair aux couleurs de la McLaren P1 MSO — papier, encre carbone, le bleu MSO qui REMPLACE le rouge — sans toucher un pixel du sombre, selon `docs/superpowers/specs/2026-08-10-bi-theme-p1-mso-design.md` (chantier #13).

**Décisions Hugo (2026-08-11, consignées sur l'issue) :** bascule **(c) les deux** (média par défaut + interrupteur topbar près du langtoggle, localStorage, anti-FOUC) ; écriture claire **inversion pure `#07080b`** ; glow **lueur bleue atténuée** (pas transparent) ; lobes `.p-void` **version encre**. Les gates à l'œil (studio clair, rampe, grain, dosage voiture, lueur, lobes) se prennent en séance — Hugo est disponible.

**Architecture :** l'outil de contrastes d'abord (il gate chaque valeur), puis les corrections inertes aux deux thèmes, puis LE bloc clair (`:where(html.clair) .proto-root` — spécificité 0,1,0, placé avant `prefers-contrast`), puis la bascule (script anti-FOUC + interrupteur), puis la séquence claire et le régime drag par thème (interaction nouvelle : #12 est en production), puis les vérifications.

**Stack :** CSS pur pour le thème (aucune dépendance) ; pipeline #12 réutilisé tel quel pour la séquence claire (studio.mjs partagé, rendu.mjs, compare.mjs).

## Contraintes globales

- **Le sombre sort de ce chantier identique à l'œil** — chaque promotion de jeton prouvée inerte avant commit (méthode ticket 22).
- **Verrou mono-accent** : dans le thème clair, le bleu REMPLACE le rouge. Jamais les deux.
- **Spécificité nulle ajoutée** : tout le bloc clair sous `:where(html.clair)` — `prefers-contrast` et `forced-colors` gardent le dernier mot par ordre de fichier.
- **Les NOMS de jetons ne bougent pas** (`--ink` = le fond, `--paper` = l'écriture — des rôles).
- **Aucun `filter` nouveau** ; toute retouche de grain se fait DANS la texture.
- **Chaînes** : tout libellé nouveau passe par `dict.ts`, FR **et** EN.
- **Chaque valeur de couleur retenue passe par `tools/controles/contrastes.mjs`** (Tâche 1) — les seuils des tableaux §3/§5 du spec sont des gates.
- **Jamais `git add -A`** ; commits en français, style du dépôt, `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Paramètres de rendu de la séquence (identiques au sombre) : `--nb=160 --rendu=2000 --elevation=30 --poids=30000 --encodeur=ffmpeg`, pose 140 / assiette −12 inchangées.
- `$SCRATCH` = scratchpad de session, hors dépôt.

## Structure de fichiers

| Fichier | Rôle |
|---|---|
| `tools/controles/contrastes.mjs` (nouveau) | calcul WCAG étalonné (15 ratios connus au millième) + table de gates du thème clair |
| `app/planche.css` | bloc clair (jetons + surcharges), jeton `--chip`, `.ov-bore-hole` → `var(--line-3)`, classes pour world.tsx, contrepartie claire du bloc contraste, 2 commentaires rafraîchis |
| `app/layout.tsx` | script anti-FOUC inline + `suppressHydrationWarning` |
| `components/proto/theme-toggle.tsx` (nouveau) | l'interrupteur — même gabarit que le langtoggle |
| `components/proto/plaque.tsx` | monte l'interrupteur dans la topbar |
| `components/proto/dict.ts` | libellés FR/EN de l'interrupteur |
| `components/proto/world.tsx` | 3 `stroke` en dur → classes |
| `components/proto/voiture.tsx` | `SRC` par thème, wrapper de remontage par clé |
| `components/proto/voiture-drag.ts` | studio/retouches/cadre par thème |
| `tools/voiture/studio.mjs` | `studioClair(THREE)`, `retouchesClair()` |
| `tools/voiture/scene.html` | paramètre `--studio` |
| `tools/voiture/rendu.mjs` | transmet `studio`, commentaire « 120 » corrigé |
| `public/voiture/clair/*.webp` | 160 images neuves |
| `public/voiture/CREDIT.txt` | seconde fabrication |

---

### Tâche 1 : le calcul de contrastes, étalonné puis armé

**Files:**
- Create: `tools/controles/contrastes.mjs`

**Interfaces:**
- Produces: exécutable seul — `node tools/controles/contrastes.mjs` étalonne (15 ratios du sombre au millième) PUIS vérifie la table de gates du clair ; code de sortie 1 si un gate tombe. `node tools/controles/contrastes.mjs '#a' '#b'` rend un ratio ponctuel. Les Tâches 3 et 7 l'invoquent tel quel.

- [ ] **Step 1 : écrire l'outil**

```js
/* ==================================================================
   CONTRASTES — le calcul WCAG 2 étalonné du spec #13, rejouable.
   D'abord l'ÉTALONNAGE : il reproduit au millième les quinze ratios
   déjà écrits dans planche.css — si un seul dévie, aucun chiffre de
   cet outil ne vaut rien et il refuse de continuer.
   Ensuite les GATES du thème clair : chaque valeur du bloc clair
   re-passe son seuil. Les seuils sont ceux des tableaux §3/§5 du
   spec — des gates, pas des intentions.
   usage : node tools/controles/contrastes.mjs            (étalonnage + gates)
           node tools/controles/contrastes.mjs '#0066b7' '#f2f0ec'
           node tools/controles/contrastes.mjs 'rgba(23,27,46,0.095)' '#f2f0ec'
   ================================================================== */

const hex = (s) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(s.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [n >> 16 & 255, n >> 8 & 255, n & 255]
}
const rgba = (s) => {
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/i.exec(s.trim())
  if (!m) return null
  return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]]
}
const parse = (s) => hex(s) ?? rgba(s) ?? (() => { throw new Error("couleur illisible : " + s) })()

/* Un rgba se COMPOSE sur sa base avant tout ratio : le canal alpha
   n'existe pas pour WCAG, seule la couleur résultante compte. */
const compose = (c, base) => {
  const a = c[3] ?? 1
  return [0, 1, 2].map((i) => c[i] * a + base[i] * (1 - a))
}
const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
export const ratio = (avant, fond) => {
  const f = parse(fond)
  const [l1, l2] = [lum(compose(parse(avant), f)), lum(f)]
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
const r3 = (x) => Math.round(x * 1000) / 1000

/* ── ÉTALONNAGE — les quinze ratios écrits dans planche.css ─────── */
const INK = "#07080b", PAPER = "#f2f0ec"
const ETALON = [
  [PAPER, INK, 17.596], ["#dcd9d3", INK, 14.218], ["#a3a8b2", INK, 8.393],
  ["#7c818c", INK, 5.127], ["#33383f", INK, 1.696], ["#191c22", INK, 1.174],
  ["#c8102e", PAPER, 5.169], ["#c8102e", INK, 3.404], ["#d91f11", INK, 3.962],
  [PAPER, "#d91f11", 4.441], ["#4a4f57", INK, 2.429], ["#5e1018", INK, 1.491],
  ["#d91f11", "#5e1018", 2.658], ["#14060a", INK, 1.011], ["#c8102e", "#d91f11", 1.164],
]

/* ── GATES DU THÈME CLAIR — tableaux §3/§5 du spec + décisions ────
   [étiquette, couleur, fond, min, max] — max null : seuil plancher
   seul ; min et max serrés : une PARITÉ avec le sombre à ±0,05. */
const CARBONE = "#07080b", PAPIER = "#f2f0ec"
const GATES = [
  ["écriture / fond (inversion pure)", CARBONE, PAPIER, 17.5, null],
  ["--sig-hot #0080e7 sur papier (non-textuel ≥ 3)", "#0080e7", PAPIER, 3, null],
  ["--sig-hot sur carbone (.ref/.count, texte ≥ 4,5)", "#0080e7", CARBONE, 4.5, null],
  ["--sig #0066b7 sur papier (texte ≥ 4,5)", "#0066b7", PAPIER, 4.5, null],
  ["les deux bleus ne se touchent jamais (~1,462)", "#0066b7", "#0080e7", 1.41, 1.51],
  ["--sig-dim parité 1,491 sombre (~1,488)", "#a4ccea", PAPIER, 1.44, 1.54],
  ["dim → hot (~2,366)", "#a4ccea", "#0080e7", 2.31, 2.42],
  ["--sig-ember parité 1,011 (~1,010)", "#f0efec", PAPIER, 1.005, 1.06],
  ["--g-100 parité 14,218 (~14,185)", "#1e2126", PAPIER, 14, 14.4],
  ["--g-300 parité 8,393 (~8,440)", "#434549", PAPIER, 8.3, 8.6],
  ["--g-500 parité 5,127 (~5,126)", "#646567", PAPIER, 5.05, 5.2],
  ["--g-700 filet parité 1,696 (~1,703)", "#bbbab9", PAPIER, 1.65, 1.75],
  ["--g-800 parité 1,174 (~1,172)", "#e0dfdb", PAPIER, 1.13, 1.22],
  ["--off parité 2,429 (~2,442)", "#9b9b9b", PAPIER, 2.39, 2.49],
  ["--line composite parité 1,206", "rgba(23,27,46,0.095)", PAPIER, 1.18, 1.23],
  ["--line-2 composite parité 1,522 (~1,524)", "rgba(23,27,46,0.205)", PAPIER, 1.49, 1.56],
  ["--line-3 composite parité 2,642 (~2,641)", "rgba(23,27,46,0.43)", PAPIER, 2.59, 2.69],
  ["--sig-rail composite (~1,446)", "rgba(0,128,231,0.30)", PAPIER, 1.40, 1.50],
  ["--sig-veil composite (~1,151)", "rgba(0,102,183,0.10)", PAPIER, 1.10, 1.20],
  ["focus carbone sur papier (≥ 3)", CARBONE, PAPIER, 3, null],
  ["focus carbone sur bleu vif (≥ 3)", CARBONE, "#0080e7", 3, null],
  ["::selection papier-clair sur --sig (≥ 4,5)", PAPIER, "#0066b7", 4.5, null],
]

const args = process.argv.slice(2)
if (args.length === 2) {
  console.log(r3(ratio(args[0], args[1])))
  process.exit(0)
}

let ok = true
for (const [a, b, attendu] of ETALON) {
  const r = r3(ratio(a, b))
  if (Math.abs(r - attendu) > 0.0015) { console.error(`ÉTALONNAGE FAUX : ${a} vs ${b} → ${r}, attendu ${attendu}`); ok = false }
}
if (!ok) { console.error("Le calcul ne reproduit pas planche.css — rien d'autre ne vaut."); process.exit(1) }
console.log(`étalonnage : ${ETALON.length}/${ETALON.length} ratios du sombre reproduits au millième`)

for (const [nom, a, b, min, max] of GATES) {
  const r = r3(ratio(a, b))
  const passe = r >= min && (max === null || r <= max)
  console.log(`${passe ? "✓" : "✗"} ${nom} → ${r}`)
  if (!passe) ok = false
}
process.exitCode = ok ? 0 : 1
```

- [ ] **Step 2 : lancer — étalonnage ET gates doivent passer**

```bash
node tools/controles/contrastes.mjs
```

Attendu : `étalonnage : 15/15`, puis 22 `✓`. Un `✗` sur un gate = la valeur candidate du spec est fausse, corriger la COULEUR (jamais le seuil) avant d'aller plus loin.

- [ ] **Step 3 : commit**

```bash
git add tools/controles/contrastes.mjs
git commit -m "Le calcul de contrastes du spec entre aux contrôles — étalonné sur le sombre, armé sur le clair"
```

---

### Tâche 2 : les corrections inertes aux deux thèmes

**Files:**
- Modify: `app/planche.css` (~:1368, :1762, :1948, :2293, :2305, :3630 ; :292-294 ; bloc NEUTRES pour `--chip`)
- Modify: `components/proto/world.tsx:189,196,202`
- Modify: `tools/voiture/rendu.mjs:2-4`

**Interfaces:**
- Produces: le jeton `--chip` (valeur sombre `rgba(226, 232, 240, 0.08)`) et 2-3 classes pour les traits de world.tsx — le bloc clair (Tâche 3) les redéfinit.

- [ ] **Step 1 : relevé AVANT** — build et empreinte du CSS compilé :

```bash
npx next build > /dev/null 2>&1 && cat .next/static/chunks/*.css 2>/dev/null | md5sum > $SCRATCH/css-avant.md5 || find .next -name "*.css" -exec cat {} + | md5sum > $SCRATCH/css-avant.md5
```

- [ ] **Step 2 : les cinq corrections**

1. **`--chip`** : déclarer dans le bloc NEUTRES de `.proto-root` : `--chip: rgba(226, 232, 240, 0.08); /* le lit des puces — 5 sites, promu au chantier #13 */` puis remplacer la valeur littérale par `var(--chip)` aux 5 sites (`.node .chip` :1368, `.ov-mark` :1762, `.fp-lang [aria-pressed]` :2293, `.fp-mark` :2305, `.at-code` :3630 — retrouver chaque site par `grep -n "rgba(226, 232, 240, 0.08)" app/planche.css`).
2. **`.ov-bore-hole`** :1948 : `rgba(226, 232, 240, 0.34)` → `var(--line-3)` (valeur identique — vérifier au grep avant de toucher).
3. **`world.tsx`** :189,196,202 : lire les trois valeurs de `stroke="…"`, créer trois classes dans `planche.css` près des règles du monde (noms au style du fichier, ex. `.w-trait-途`), porter `className` sur les éléments SVG et retirer l'attribut. Un attribut de présentation SVG ne consomme pas de `var()` — c'est ce qui le rendait infixable au thème.
4. **Commentaire grain** :292-294 : retirer « poussière » de la liste `screen` (`.p-dust` ne porte aucun blend).
5. **`rendu.mjs`** :2-4 : « la séquence en production en compte 120 » → 160 (périmé depuis le ticket 18).

- [ ] **Step 3 : prouver l'inertie**

```bash
npx next build > /dev/null 2>&1
```

Puis, au navigateur sur le build (`npx next start -p 3210`), contrôle visuel des 6 zones touchées (puces de nœuds, marqueurs overlay, boutons langue, code atelier, perçage overlay, traits du monde) — identiques au pixel. Les swaps `var()` changent le texte du CSS compilé, pas la valeur calculée : la preuve d'inertie est le calcul (mêmes valeurs) + l'œil.

- [ ] **Step 4 : commit**

```bash
git add app/planche.css components/proto/world.tsx tools/voiture/rendu.mjs
git commit -m "Cinq sites apprennent les jetons avant le thème — prouvés inertes, le sombre n'a pas bougé d'un pixel"
```

---

### Tâche 3 : LE bloc clair

**Files:**
- Modify: `app/planche.css` — insertion juste AVANT `@media (prefers-contrast: more)` (~:1570) ; contrepartie claire ajoutée EN FIN du bloc `prefers-contrast` existant.

**Interfaces:**
- Consumes: `--chip` et les classes world (Tâche 2) ; `tools/controles/contrastes.mjs` (Tâche 1).
- Produces: la classe `html.clair` comme unique déclencheur — la Tâche 4 la pose.

- [ ] **Step 1 : le bloc de jetons + surcharges**, inséré avant le bloc `prefers-contrast` :

```css
/* ============================================================
   THÈME CLAIR — McLaren P1 MSO (chantier #13)
   ------------------------------------------------------------
   L'INVERSION PURE des neutres : --ink devient le papier du système,
   --paper son encre — le couple écriture/fond garde EXACTEMENT ses
   17,596:1 et aucune teinte neuve n'entre. Les NOMS mentent en clair
   (--ink est blanc) : c'est le prix pour ne toucher AUCUN des ~300
   sites consommateurs.

   LE BLEU REMPLACE LE ROUGE — un thème, un accent, le verrou
   mono-accent tient dans les deux mondes. La teinte vient du modèle
   3D lui-même (matériau Blue du .glb : #0080e7 en sRGB).

   LA LOI TRANSPOSÉE : SUR LE PAPIER, LE BLEU DÉSIGNE — IL N'ÉCRIT EN
   VIF JAMAIS. POUR ALLUMER LE BLEU, POSER D'ABORD DU CARBONE. Le
   bleu vif ne passe pas le seuil texte sur papier (3,520 < 4,5) :
   --sig est son assombrissement iso-teinte, et les deux seuls îlots
   où le vif écrit sont les cartouches, devenus carbone (§4 du spec).

   :where() : spécificité 0,1,0 — identique au bloc de base, pour que
   prefers-contrast et forced-colors, plus bas, gardent le dernier
   mot par ordre de fichier. Le piège inverse est silencieux : il ne
   casserait que chez les visiteurs qui cumulent les préférences.
   ============================================================ */
:where(html.clair) .proto-root {
  --ink: #f2f0ec;   /* le papier du système, inchangé — le FOND du thème clair */
  --ink-2: #edebe7; /* 1,046:1 — un cran vers l'encre, même geste de décollement */
  --paper: #07080b; /* l'encre du système — l'ÉCRITURE, 17,596:1 conservés */
  --g-100: #1e2126; /* 14,185:1 */
  --g-300: #434549; /*  8,440:1 — plancher du 9px tenu */
  --g-500: #646567; /*  5,126:1 — plancher absolu du texte */
  --g-700: #bbbab9; /*  1,703:1 — FILET, jamais de glyphe */
  --g-800: #e0dfdb; /*  1,172:1 — lit neutre (0 site, recalculé quand même) */
  /* --steel ne bouge PAS : il est le PLANCHER de la rampe claire
     (14,968:1 contre le papier) — la bande sombre dessine sur le
     métal clair comme la claire dessinait sur le sombre. */

  /* filets : parité de DENSITÉ COMPOSITE, pas d'alpha — 1,206 /
     1,524 / 2,641 contre 1,206 / 1,522 / 2,642 en sombre. Base
     rgb(23,27,46) : le steel, l'encre froide. */
  --line: rgba(23, 27, 46, 0.095);
  --line-2: rgba(23, 27, 46, 0.205);
  --line-3: rgba(23, 27, 46, 0.43);
  --chip: rgba(23, 27, 46, 0.075);

  /* le bleu MSO — deux états, substrats disjoints (1,462:1 entre eux) */
  --sig: #0066b7;     /* ENCRE — 5,148:1 sur papier (parité 5,169) */
  --sig-hot: #0080e7; /* LAMPE — 3,520:1 sur papier (≥ 3, non-textuel) ;
                         4,821:1 sur carbone : là, et là seulement, il écrit */
  --sig-dim: #a4ccea; /* LIT — 1,488 puis dim→hot 2,366 (escalier plus
                         court que le sombre : assumé, documenté au spec) */
  --sig-ember: #f0efec; /* BRAISE — 1,010:1, chaleur sans couleur */
  --sig-rail: rgba(0, 128, 231, 0.3);
  --sig-glow: rgba(0, 128, 231, 0.3); /* LUEUR ATTÉNUÉE — décision Hugo
                         2026-08-11 : la lampe survit au jour, dosée à
                         l'œil (candidat 0,3 contre 0,55 en sombre) */
  --sig-veil: rgba(0, 102, 183, 0.1);
  --off: #9b9b9b; /* 2,442:1 */

  /* la rampe chrome sur papier : même STRUCTURE (12 arrêts, mêmes em,
     même cyclicité — tout ce que .chrome, .f-num et .ov-face
     supposent), PLAGE déplacée vers le sombre — le spéculaire blanc
     ferait 1,138:1, invisible en plein jour. Plancher --steel
     (14,968), plafond ~#b6b6bd (1,772). Candidats — LES ONZE ARRÊTS
     SE RÈGLENT À L'ŒIL (gate Hugo : du métal, pas une rayure). */
  --chrome-ramp: repeating-linear-gradient(
    178deg,
    #8e8e95 0em,
    #33333a 0.08em,
    var(--steel) 0.15em,
    #b6b6bd 0.23em,
    #6e6e75 0.31em,
    #a6a6ad 0.35em,
    #4f4f55 0.4em,
    #24283a 0.48em,
    var(--steel) 0.55em,
    #9a9aa1 0.64em,
    #5b5b62 0.72em,
    #8e8e95 0.8em
  );
}

/* le fond hors .proto-root : la règle jumelle de html,body */
html.clair,
html.clair body {
  background: #f2f0ec;
}

/* ── surcharges de site du thème clair — le modèle forced-colors :
      des jetons, plus une poignée de règles assumées ─────────── */

/* les cartouches s'inversent : les deux seuls îlots papier du sombre
   deviennent les deux seuls îlots carbone du clair (le plafond de
   DEUX vaut dans les deux sens) — et c'est là que le bleu vif écrit
   (4,821:1). Sans cette règle : 3,297, échec. */
:where(html.clair) .proto-root .ref,
:where(html.clair) .proto-root .count {
  color: var(--sig-hot);
}

/* sélection : le texte doit être le clair du thème — sans cette
   règle, carbone sur bleu foncé, 3,297, échec. Avec : 5,148. */
:where(html.clair) .proto-root ::selection {
  color: var(--ink);
}

/* le grain ASSOMBRIT sur papier : multiply au lieu de screen. La
   texture biaisée claire (moyenne 176,5) pose ~2,6 % de voile moyen
   sous multiply à 0,085 — si ça se voit, la retouche se fait DANS la
   texture (recuisson, tools/monde/cuire.md), jamais en filter. Gate
   à l'œil : du grain, pas un voile. */
:where(html.clair) .p-grain {
  mix-blend-mode: multiply;
}

/* les lobes d'atmosphère, VERSION ENCRE — décision Hugo 2026-08-11 :
   la lumière du soir devient de l'ombre portée du jour. L'encre
   marque plus fort sur papier que le blanc sur encre : alphas
   divisés par deux (candidats, à l'œil — le plafond du sombre vaut
   toujours : au-delà, l'ombre acquiert un bord et devient un objet). */
:where(html.clair) .p-void {
  background:
    radial-gradient(85% 42% at 50% 100%, rgba(7, 8, 11, 0.1), transparent 70%),
    radial-gradient(140% 70% at 50% 106%, rgba(7, 8, 11, 0.045), transparent 62%),
    var(--ink);
}

/* l'arête du chrome : d'encre en plein jour */
:where(html.clair) .chrome {
  -webkit-text-stroke: 0.5px rgba(7, 8, 11, 0.22);
}

/* la chaleur sous le titre : le voile suit déjà --sig-veil ; seule
   la lueur froide en dur passe à l'encre froide */
:where(html.clair) .chrome-bed::before {
  background:
    radial-gradient(120% 70% at 50% 118%, var(--sig-veil) 0%, transparent 62%),
    radial-gradient(60% 70% at 50% 52%, rgba(23, 27, 46, 0.055), transparent 72%);
}
```

- [ ] **Step 2 : les règles jumelles restantes du §6b** — pour chacun, LIRE la règle sombre au numéro indiqué (les numéros bougent, retrouver au grep), recopier sa forme exacte avec la valeur claire, dans le bloc clair :

| Site | Valeur sombre | Règle jumelle claire |
|---|---|---|
| `--floor-line` (`.floor-grid`, ~:458) | `rgba(226,232,240,0.42)` | `:where(html.clair) .floor-grid { --floor-line: rgba(23, 27, 46, 0.42); }` |
| `.p-dust` (~:555) | `rgba(242,240,236,0.5)` | même règle, `rgba(7, 8, 11, 0.5)` |
| `.p-scrim` (~:567) | 2 × `rgb(7 8 11 / …)` | mêmes arrêts, `rgb(242 240 236 / …)` — le voile assoit le plancher de contraste, rôle inchangé |
| `.node.on rect` (~:1376) | stroke `rgba(226,232,240,0.62)` | `rgba(23, 27, 46, 0.62)` |
| `.node.on .chip` (~:1394) | `rgba(226,232,240,0.16)` | `rgba(23, 27, 46, 0.16)` |
| `.tel-b0/b1/b2` (~:2922-2928) | alphas 0,022 / 0,045 / 0,07 | `rgba(7, 8, 11, …)` mêmes alphas — l'escalier d'encre garde ses rapports |
| classes world (Tâche 2) | 3 traits | versions claires à densité équivalente (le contrôle Step 4 vérifie) |

- [ ] **Step 3 : la contrepartie claire du bloc contraste** — À LA FIN du bloc `@media (prefers-contrast: more)` existant (après la règle sombre, pour gagner par ordre) :

```css
  /* La contrepartie CLAIRE : le bloc ci-dessus est calibré pour le
     sombre (--g-500: #8f949e est un gris clair) — un visiteur en
     contraste renforcé + thème clair recevrait des valeurs d'encre.
     Mêmes gestes, recalculés contre le papier (contrastes.mjs). */
  :where(html.clair) .proto-root {
    --g-500: #4a4b4d;
    --off: #767677;
    --sig-rail: rgba(0, 128, 231, 0.46);
    --rail-w: 3px;
    --line: rgba(23, 27, 46, 0.16);
    --line-2: rgba(23, 27, 46, 0.3);
  }
```

(Contrôle : `--g-500` clair renforcé doit ≥ le ratio du `#8f949e` sombre contre l'encre — vérifier les deux au `contrastes.mjs` ponctuel et ajuster la teinte, jamais le seuil.)

- [ ] **Step 4 : les gates**

```bash
node tools/controles/contrastes.mjs
npx next build > /dev/null 2>&1
```

Attendu : 22 ✓ et build propre. Puis au navigateur : `document.documentElement.classList.add("clair")` dans la console — TOUT le document bascule (la voiture reste sombre : normal, Tâches 5-6). Le sombre sans la classe : identique à avant.

- [ ] **Step 5 : commit**

```bash
git add app/planche.css
git commit -m "Le thème clair existe — l'inversion pure, le bleu du modèle à la place du rouge, et la loi transposée : sur le papier, le bleu désigne"
```

---

### Tâche 4 : la bascule — média par défaut, la main qui écrase

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/proto/theme-toggle.tsx`
- Modify: `components/proto/plaque.tsx` (topbar), `components/proto/dict.ts`, `app/planche.css` (si l'interrupteur a besoin d'un écart au gabarit langtoggle)

**Interfaces:**
- Produces: l'événement `window` `"themechange"` (Event nu) — la Tâche 6 s'y abonne ; la clé localStorage `"theme"` ∈ {"clair","sombre"}.

- [ ] **Step 1 : le script anti-FOUC** dans `layout.tsx` — `suppressHydrationWarning` sur `<html>` (la classe posée avant React diffère du HTML serveur) et le script AVANT tout contenu :

```tsx
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        {/* AVANT LA PREMIÈRE PEINTURE : le site est statique, le serveur
            ne connaît pas le choix — sans ce script, chaque chargement
            en clair flasherait sombre d'abord. Choix mémorisé d'abord,
            l'OS sinon. La classe `dark` reste : elle ne pilote que la
            @custom-variant Tailwind des composants importés (aucun
            site aujourd'hui), le thème vit sur `clair`. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t?t==="clair":matchMedia("(prefers-color-scheme: light)").matches)document.documentElement.classList.add("clair")}catch(e){}`,
          }}
        />
      </head>
```

- [ ] **Step 2 : l'interrupteur** — `components/proto/theme-toggle.tsx`, MÊME gabarit que le langtoggle (deux boutons, `data-on`, `aria-pressed`, classe `.langtoggle` réutilisée telle quelle) :

```tsx
"use client"

import { useEffect, useState } from "react"
import { t, type Lang } from "./dict"

/* L'interrupteur de thème — le jumeau du langtoggle, même gabarit,
   même CSS. L'état vit sur <html> (posé par le script anti-FOUC de
   layout.tsx avant React) : ce composant le LIT au montage — le
   serveur ne le connaît pas, d'où l'état null avant hydratation, qui
   rend les deux boutons éteints une frame plutôt qu'un mensonge. */
export function ThemeToggle({ lang }: { lang: Lang }) {
  const [clair, setClair] = useState<boolean | null>(null)
  useEffect(() => {
    setClair(document.documentElement.classList.contains("clair"))
  }, [])
  const choisit = (v: boolean) => () => {
    setClair(v)
    document.documentElement.classList.toggle("clair", v)
    try { localStorage.setItem("theme", v ? "clair" : "sombre") } catch {}
    /* la voiture remonte sa séquence sur cet événement (voiture.tsx) */
    window.dispatchEvent(new Event("themechange"))
  }
  return (
    <div className="langtoggle mono mono-sm" role="group" aria-label={t(lang, "themeLabel")}>
      <button type="button" data-on={clair === false} onClick={choisit(false)} aria-pressed={clair === false}>
        {t(lang, "themeSombre")}
      </button>
      <button type="button" data-on={clair === true} onClick={choisit(true)} aria-pressed={clair === true}>
        {t(lang, "themeClair")}
      </button>
    </div>
  )
}
```

- [ ] **Step 3 : dict.ts** — trois clés, au gabarit exact des entrées voisines (lire la forme du fichier avant d'écrire) :

`themeLabel` : FR « Thème / Theme » (le même bilinguisme que l'aria-label du langtoggle) ; `themeSombre` : FR « NUIT », EN « DARK » ; `themeClair` : FR « JOUR », EN « LIGHT ». (Libellés courts, MAJUSCULES comme FR/EN du langtoggle — si Hugo préfère SOMBRE/CLAIR, un mot.)

- [ ] **Step 4 : montage en topbar** — dans `plaque.tsx`, à côté du langtoggle :

```tsx
            <div className="langtoggle mono mono-sm" role="group" aria-label="Langue / Language">
              …boutons FR/EN inchangés…
            </div>
            <ThemeToggle lang={lang} />
```

(+ `import { ThemeToggle } from "./theme-toggle"`.)

- [ ] **Step 5 : vérifier** — build + navigateur : bascule au clic, mémorisée au rechargement (sans flash — recharger en clair PLUSIEURS fois), l'OS décide quand rien n'est mémorisé (`localStorage.removeItem("theme")` puis émuler le média), clavier (Tab + Entrée), focus visible sur les deux thèmes.

- [ ] **Step 6 : commit**

```bash
git add app/layout.tsx components/proto/theme-toggle.tsx components/proto/plaque.tsx components/proto/dict.ts app/planche.css
git commit -m "Le jour se choisit — l'OS propose, la topbar dispose, et jamais un flash"
```

---

### Tâche 5 : la séquence claire — studio inversé, livrée d'origine

**Files:**
- Modify: `tools/voiture/studio.mjs`, `tools/voiture/scene.html`, `tools/voiture/rendu.mjs`
- Create: `public/voiture/clair/*.webp` (160), section CREDIT.txt

**Interfaces:**
- Produces: `studioClair(THREE)` et `retouchesClair()` dans studio.mjs — consommés par scene.html (`--studio=clair`) ET par voiture-drag.ts (Tâche 6) ; le cadre clair consigné.

- [ ] **Step 1 : studio.mjs** — ajouter :

```js
/* ── LE STUDIO CLAIR (#13) ────────────────────────────────────────
   Boîte CLAIRE, bandes SOMBRES : sur une carrosserie blanche, c'est
   la bande sombre qui dessine l'arête — « une arête ne se voit que
   si elle a une bande à réfléchir », le principe survit au signe.
   GÉOMÉTRIE IDENTIQUE au studio sombre (mêmes positions, mêmes
   tailles : le galbe est calé dessus) ; seules la boîte et la teinte
   des bandes s'inversent. Les teintes sont des CANDIDATS réglés à
   l'œil à l'essai 8 vues — gate Hugo. */
export function studioClair(THREE) {
  const s = new THREE.Scene()
  s.add(new THREE.Mesh(
    new THREE.BoxGeometry(40, 24, 40),
    new THREE.MeshBasicMaterial({ color: 0xf2f0ec, side: THREE.BackSide })
  ))
  const bande = (w, h, pos, rot, teinte) => {
    const m = new THREE.MeshBasicMaterial({ color: teinte, side: THREE.DoubleSide })
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)
    p.position.set(...pos); p.rotation.set(...rot); s.add(p)
  }
  const H = Math.PI / 2
  /* la force HDR du sombre devient une PROFONDEUR d'encre : la bande
     la plus forte (9) est la plus sombre. */
  bande(0.8, 30, [    0, 12.0,  0], [ H,  0, 0], 0x07080b)
  bande(0.6, 28, [-3.4, 12.0,  0], [ H,  0, 0], 0x171b2e)
  bande(0.6, 28, [ 3.4, 12.0,  0], [ H,  0, 0], 0x171b2e)
  bande(0.9, 30, [-9.5, 2.6,  0], [ 0,  H, 0], 0x0b0e14)
  bande(0.9, 30, [ 9.5, 2.6,  0], [ 0, -H, 0], 0x0b0e14)
  bande(1.1, 30, [-7.0, 0.35, 0], [ 0,  H, 0], 0x10131c)
  bande(1.1, 30, [ 7.0, 0.35, 0], [ 0, -H, 0], 0x10131c)
  bande(16, 0.7, [ 0, 3.0, -12], [0, 0, 0], 0x2a2d36)
  bande(16, 0.7, [ 0, 3.0,  12], [0, Math.PI, 0], 0x2a2d36)
  return s
}

/* La livrée MSO d'origine EST le but : ni WhitePaintjob ni Blue ne se
   retouchent — le blanc du modèle est le défaut glTF, le bleu est le
   #0080e7 que le thème clair prend pour accent. Table vide ; si
   l'essai 8 vues montre un vitrage ou un accent à reprendre, il
   s'ajoute ICI, seul endroit. */
export function retouchesClair() {
  return {}
}
```

- [ ] **Step 2 : scene.html** — paramètre `studio` :

```js
const STUDIO = P.get("studio") || "sombre"
```
imports étendus (`studioClair, retouchesClair`), puis :
```js
scene.environment = pmrem.fromScene(STUDIO === "clair" ? studioClair(THREE) : studio(THREE), FLOU_PMREM).texture
```
et dans le callback de chargement :
```js
materiaux = appliqueRetouches(m, STUDIO === "clair" ? retouchesClair() : retouches({ carrosserie: CARRO, rugosite: RUGO }))
```

- [ ] **Step 3 : rendu.mjs** — ajouter `"studio"` à la liste des clés transmises (`for (const k of ["rendu", "fov", …])`).

- [ ] **Step 4 : l'ESSAI 8 vues — gate Hugo à l'œil**

```bash
node tools/voiture/rendu.mjs ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb \
  --nb=8 --rendu=2000 --elevation=30 --poids=30000 --encodeur=ffmpeg \
  --studio=clair --dest=$SCRATCH/essai-clair
magick montage -tile 4x2 -geometry +2+2 -background '#f2f0ec' $SCRATCH/essai-clair/*.webp $SCRATCH/essai-clair.png
```

Montrer la planche à Hugo. Régler `studioClair` (teintes des bandes, `--env` si la boîte claire éblouit) et re-essayer jusqu'au « bon ». SEULEMENT ENSUITE :

- [ ] **Step 5 : le rendu complet** (arrière-plan, ~15-20 min)

```bash
node tools/voiture/rendu.mjs ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb \
  --nb=160 --rendu=2000 --elevation=30 --poids=30000 --encodeur=ffmpeg \
  --studio=clair --dest=public/voiture/clair
```

**Consigner** : le `cadrage commun` imprimé (attendu identique au sombre — même géométrie ; s'il diffère, c'est le cadre CLAIR du client, Tâche 6) et le poids total mesuré (attendu ~4,2 Mo, mais MESURÉ — une carrosserie blanche ne compresse pas forcément comme une carbone).

- [ ] **Step 6 : CREDIT.txt** — seconde section Fabrication : la commande exacte avec `--studio=clair`, le poids mesuré, le cadre, même licence CC-BY-NC-SA, même attribution (la séquence claire est une adaptation de plus du même modèle).

- [ ] **Step 7 : commit** (fichier par fichier, jamais `git add -A`)

```bash
git add tools/voiture/studio.mjs tools/voiture/scene.html tools/voiture/rendu.mjs public/voiture/clair public/voiture/CREDIT.txt
git commit -m "La livrée MSO sort du réservé — studio inversé, 160 vues claires, la fabrication consignée"
```

---

### Tâche 6 : la voiture suit le thème — séquence ET régime drag

**Files:**
- Modify: `components/proto/voiture.tsx`, `components/proto/voiture-drag.ts`, `app/planche.css` (dosage clair)

**Interfaces:**
- Consumes: l'événement `"themechange"` (Tâche 4), `studioClair`/`retouchesClair` (Tâche 5), le cadre clair consigné (Tâche 5 Step 5).

- [ ] **Step 1 : `voiture.tsx`** — le thème se lit AU MONTAGE, et la bascule REMONTE le composant (le démontage ferme déjà tous les bitmaps et détruit la scène GL — l'acquis de #12) :

```tsx
const SRC = (i: number, clair: boolean) => `/voiture/${clair ? "clair/" : ""}${String(i).padStart(3, "0")}.webp`
```
Dans le composant interne (renommé `VoitureSequence`, non exporté) :
```tsx
  /* Le thème au MONTAGE, une fois : la bascule à mi-session remonte le
     composant par la clé du wrapper — refenêtrer coûte ~660 Ko, et
     chaque thème ne télécharge QUE sa séquence (propriété acquise :
     tout part de fetch(SRC(i)) à la demande). */
  const [clair] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("clair"))
```
`charge()` appelle `SRC(i, clair)`. L'export devient le wrapper :
```tsx
export function Voiture() {
  const [cle, setCle] = useState(0)
  useEffect(() => {
    const f = () => setCle((c) => c + 1)
    window.addEventListener("themechange", f)
    return () => window.removeEventListener("themechange", f)
  }, [])
  return <VoitureSequence key={cle} />
}
```

- [ ] **Step 2 : `voiture-drag.ts`** — le régime drag suit le thème, sinon la saisie en clair montrerait la voiture carbone sur la séquence MSO :

```ts
import { studio, studioClair, retouches, retouchesClair, regleRenderer, prepareModele,
         appliqueRetouches, placeCamera, FOV, FLOU_PMREM, INTENSITE_ENV } from "../../tools/voiture/studio.mjs"

export const CADRE = { x: 0.14017, y: 0.16378, c: 0.71967 }        // séquence sombre
export const CADRE_CLAIR = { x: 0.14017, y: 0.16378, c: 0.71967 }  // ← valeurs consignées Tâche 5 Step 5
```
Dans `creeScene`, avant la construction :
```ts
  const clair = document.documentElement.classList.contains("clair")
```
puis `pmrem.fromScene(clair ? studioClair(THREE) : studio(THREE), FLOU_PMREM)`, `appliqueRetouches(gltf.scene, clair ? retouchesClair() : retouches())`, et `const cadre = clair ? CADRE_CLAIR : CADRE` pour le `setViewOffset`. Le remontage par clé (Step 1) détruit et recrée la scène au bon thème — rien d'autre à synchroniser.

- [ ] **Step 3 : le dosage clair** — dans le bloc clair de `planche.css` :

```css
/* Une carrosserie blanche sur papier s'efface à 0,72 : le dosage
   clair remonte — CANDIDAT, gate Hugo à l'œil. */
:where(html.clair) .voiture-toile,
:where(html.clair) .voiture-toile-gl {
  opacity: 0.85;
}
```
(et son pendant ≤ 720px si le 0,5 sombre s'efface aussi — candidat 0,62, à l'œil.)

- [ ] **Step 4 : vérifier** — `npx tsc --noEmit && npx next build` ; au navigateur : en clair la voiture MSO s'affiche (et depuis le retour Hugo du même jour : se fait engloutir au scroll — la rotation appartient au drag), se saisit (WebGL clair au relâchement suivant), raccord invisible ; bascule à mi-page → la voiture remonte dans l'autre livrée ; onglet réseau : en clair aucune requête vers `/voiture/0…webp` racine, en sombre aucune vers `clair/`.

- [ ] **Step 5 : commit**

```bash
git add components/proto/voiture.tsx components/proto/voiture-drag.ts app/planche.css
git commit -m "La voiture suit le jour — séquence et drag au thème, remontés par la clé, chaque thème ne paie que le sien"
```

---

### Tâche 7 : les vérifications du spec

- [ ] **Contrastes** : `node tools/controles/contrastes.mjs` → 22 ✓.
- [ ] **Le sombre ne bouge pas** : parcours visuel complet en sombre (aucune classe) — identique ; `git stash` mental interdit, c'est l'œil qui signe.
- [ ] **Réseau croisé** : `node tools/voiture/reseau.mjs http://localhost:3210/` (sombre) puis le même en clair (ajouter au script un `--clair` qui pose la classe via `Page.addScriptToEvaluateOnNewDocument("localStorage.setItem('theme','clair')")` — 5 lignes) : zéro fuite croisée entre séquences.
- [ ] **`reduce` en clair** : `node tools/controles/controle-reduce.mjs` rejoué avec le thème clair forcé — une seule requête `/voiture/clair/`, pose figée.
- [ ] **FOUC** : rechargements à froid en clair (cache vidé) — aucun flash sombre.
- [ ] **Banc** : `npm run banc -- http://localhost:3210/ bi-theme-clair --tete` (thème clair forcé par localStorage au même procédé) — comparé au témoin sombre en % de frames > 8,3 ms à plancher égal. Un thème est du CSS recalculé une fois : un écart net est un signal à chercher.
- [ ] **Gates Hugo à l'œil, en séance** : la rampe chrome (du métal, pas une rayure) ; le grain multiply (du grain, pas un voile — sinon recuisson dans la texture) ; la lueur bleue (0,3 — monter/descendre d'un mot) ; les lobes d'encre (0,1/0,045) ; le dosage voiture (0,85) ; le studio clair (déjà gaté Tâche 5).
- [ ] **Revue adversariale** (rituel #12) : workflow 3 lentilles × vérification croisée sur le diff complet, correctifs, re-build.

### Tâche 8 : clôture

- [ ] Commenter l'issue #13 (chiffres : poids séquence claire, cadre, verdicts banc/réseau/contrastes, réglages retenus à l'œil).
- [ ] Mémoire : `chantiers-arbitrages-en-attente.md` (+ MEMORY.md).
- [ ] **Pousser SEULEMENT après le feu vert explicite de Hugo** (le push déploie).

## Auto-revue (faite à l'écriture)

- **Couverture spec** : §1→T3 (place/spécificité/jumelle html,body/contrepartie contraste) ; §2→T3 jetons ; §3→T3+T1 gates ; §4→T3 surcharges (.ref/.count, ::selection, glow lueur, focus alias inchangé) ; §5→T3+T1 ; §6a→T2 (--chip), §6b→T3 Step 2, §6c→T2 ; §7→T3 rampe ; §8(c)→T4 ; §9→T3 grain + T2 commentaire ; §10→T5+T6 (dosage, SRC, clé, CREDIT, poids mesuré, « 120 » corrigé) ; Vérification→T7 ; vigilances→T3 commentaires + T7.
- **Placeholders** : les seules valeurs ouvertes sont des CANDIDATS gates-à-l'œil explicitement listés (rampe, lueur, lobes, dosage, teintes studio) — prévus par le spec.
- **Cohérence** : `studioClair`/`retouchesClair` (T5) = imports T6 ; `"themechange"` (T4) = écoute T6 ; `--chip` (T2) = redéfinition T3 ; `CADRE_CLAIR` consigné T5→T6.
