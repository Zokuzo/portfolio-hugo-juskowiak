# La voiture manipulable à la souris — plan d'implémentation

> **État au 2026-08-11 soir** : Tâches 1–11 EXÉCUTÉES (les écarts au plan
> sont consignés sur l'issue #12 : Draco au lieu de meshopt — 5,8 Mo contre
> 11, `--palette false` obligatoire, gate bundle re-défini en somme des
> scripts du HTML — Next 16.3 n'imprime plus First Load JS, banc corrigé
> du travail par-événement). Gates réseau/reduce/bundle verts ; scroll
> 2,09 % sans drag, 7,13 % après drag ; **gate 1 (drag) non prononçable en
> CDP** — le compositeur décroît à 60 Hz sans entrée réelle : il attend le
> test d'une minute de Hugo à la vraie souris. Tâche 12 : issue commentée,
> **rien n'est poussé** (le push déploie).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**But :** rendre la voiture de l'accueil saisissable à la souris sur desktop — WebGL au drag, séquence partout ailleurs — selon le spec `docs/superpowers/specs/2026-08-10-voiture-drag-webgl-design.md` (chantier GitHub #12).

**Architecture :** phase pipeline d'abord (studio extrait en module partagé, `.glb` optimisé et VÉRIFIÉ par re-rendu des 160 vues contre la production — avant d'écrire une ligne de client), puis phase client (module drag chargé dynamiquement au premier geste avéré, réconciliation par offset persistant), puis phase gates (banc drag, réseau, bundle). Trois gates au banc + un gate humain au raccord ; si un seul échoue, `DRAG_LIVRE = false` et le site reste ce qu'il est.

**Stack :** three 0.169.0 (épinglé exact), gltf-transform CLI 4.4.2 (via `npx -y`, jamais en dépendance), pipeline CDP existant (`tools/chrome.mjs`), ImageMagick pour les diffs, ffmpeg (libwebp) pour l'encodage — les deux sont présents sur la machine (vérifié le 2026-08-11).

## Contraintes globales

- **three est épinglé à `0.169.0` exact des deux côtés** — la version de l'importmap `scene.html:13`. Pas de caret : three change sa gestion de la couleur d'une version à l'autre.
- **Zéro octet avant le geste** : ni le chunk three ni le `.glb` ne partent vers un visiteur qui ne drague pas. First Load JS de l'accueil identique avant/après (`next build`).
- **`pointer-events: none` de `.voiture` ne bouge pas** (`planche.css`, section voiture). La saisie s'écoute au document.
- **Budget** : gates en **% de frames > 8,3 ms à plancher de cadence égal**, seuil d'alerte 10 % (`tools/banc/SEUIL.md`), `--tete` obligatoire. Jamais des millisecondes brutes entre planchers inégaux.
- **Mobile/tactile exclus** : tout le régime drag est derrière `matchMedia("(hover: hover) and (pointer: fine)")`.
- **Aucun texte nouveau** : l'affordance est le curseur `grab`/`grabbing` seul tant que Hugo n'a pas tranché la décision n°4 du spec. Si un indice écrit arrive un jour : `dict.ts`, FR **et** EN.
- **Paramètres de la séquence en production** (CREDIT.txt) : `--nb=160 --rendu=2000 --elevation=30 --poids=30000 --encodeur=ffmpeg`, modèle source `~/PP/modeles-3d/free_-_mclaren_p1_mso.glb` (70 471 356 octets).
- **Jamais `git add -A`** — fichier par fichier. `*.glb binary` est déjà dans `.gitattributes` (vérifié) : rien à y ajouter.
- **Messages de commit** : français, style narratif du dépôt, avec `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- `$SCRATCH` désigne le scratchpad de session (hors dépôt). Les rendus témoins y vivent, jamais dans l'arbre git.

## Structure de fichiers

| Fichier | Rôle |
|---|---|
| `tools/voiture/studio.mjs` (nouveau) | studio 9 bandes, retouches, réglages moteur, normalisation modèle, caméra — partagé outil/client, THREE en paramètre |
| `tools/voiture/scene.html` (modifié) | consomme `/studio.mjs` au lieu de ses copies ; décodeur meshopt |
| `tools/voiture/rendu.mjs` (modifié) | alias `/studio.mjs`, MIME `.mjs`, mode `--cadre` |
| `tools/voiture/compare.mjs` (nouveau) | diff chiffré (RMSE) de deux séquences + planche des pires paires |
| `tools/voiture/reseau.mjs` (nouveau) | gate réseau : zéro chunk/glb sans drag ; une image sous reduce |
| `tools/voiture/geste.test.mjs` (nouveau) | `node --test` de l'arithmétique du geste |
| `components/proto/geste.mjs` (nouveau) | modulo, aimantation au cran, offset au relâchement — pur, testable |
| `components/proto/voiture-drag.ts` (nouveau) | régime WebGL : scène, rendu à la demande, cadre consigné — chargé dynamiquement |
| `components/proto/voiture.tsx` (modifié) | écoute du geste, drag séquence, bascule, réconciliation, interrupteur |
| `app/planche.css` (modifié) | seconde toile, curseurs, suspension de sélection |
| `tools/banc/frame.mjs` (modifié) | scénario `--drag` : gates 1 et 3 |
| `public/voiture/modele-web.glb` (nouveau) | le dérivé optimisé, committé (décision Hugo du 2026-08-10) |
| `public/voiture/CREDIT.txt` (modifié) | le fichier distribué, sa fabrication, le cadre consigné |
| `package.json` (modifié) | `three` 0.169.0 exact, `@types/three` en dev |

---

### Tâche 1 : le studio ne s'écrit qu'une fois

**Files:**
- Create: `tools/voiture/studio.mjs`
- Modify: `tools/voiture/scene.html` (tout le `<script type="module">`)
- Modify: `tools/voiture/rendu.mjs:105-109` (MIME), `:146-149` (alias), `:138` (encodeur), après `:189` (mode `--cadre`)

**Interfaces:**
- Produces: `studio(THREE)`, `retouches({carrosserie?, rugosite?})`, `regleRenderer(THREE, renderer)`, `prepareModele(THREE, modele) → rayon`, `appliqueRetouches(modele, table) → [{mesh, mat, type}]`, `placeCamera(THREE, camera, rayon, elevationDeg)`, constantes `FOV = 22`, `ELEVATION = 30`, `FLOU_PMREM = 0.02`, `INTENSITE_ENV = 1`, `CARROSSERIE = "0b0e14"`, `RUGOSITE = 0.08` — consommées par scene.html (Tâche 1) et voiture-drag.ts (Tâche 8).

- [ ] **Step 1 : écrire `tools/voiture/studio.mjs`**

Contenu complet — les corps de `studio()` et des retouches sont **copiés à l'identique** de `scene.html:57-121` et `:196-246`, seuls les emballages changent :

```js
/* ==================================================================
   STUDIO PARTAGÉ — la scène d'éclairage, les retouches matériaux, les
   réglages du moteur et la mise en place du modèle, extraits de
   scene.html pour être consommés par l'outil de rendu ET par le régime
   drag du client (chantier #12).

   Le risque central du drag est un écart visible au raccord. La parade
   n'est pas de « reproduire » le studio côté client, c'est de NE PLUS
   AVOIR DEUX STUDIOS — deux copies, c'est une copie qui pourrit, la
   règle que rendu.mjs s'applique déjà à trouveChrome.

   THREE ARRIVE EN PARAMÈTRE, jamais importé ici : l'outil le tire du
   CDN (importmap de scene.html), le client de node_modules — importer
   ici figerait une des deux sources et dédoublerait le moteur. La
   version est ÉPINGLÉE À 0.169.0 DES DEUX CÔTÉS : three change sa
   gestion de la couleur d'une version à l'autre, et un pipeline en
   0.169 contre un client d'une autre version serait un raccord qui
   dérive sans qu'aucun code n'ait bougé.
   ================================================================== */

/* Les réglages solidaires du raccord : en changer un invalide à la
   fois la séquence rendue et le rendu client — jamais l'un sans
   l'autre. ELEVATION est celle de la séquence en production
   (CREDIT.txt) ; scene.html garde son défaut d'URL à 13 pour ne pas
   changer le comportement de l'outil, la production passe --elevation=30. */
export const FOV = 22
export const ELEVATION = 30
export const FLOU_PMREM = 0.02
export const INTENSITE_ENV = 1
export const CARROSSERIE = "0b0e14"
export const RUGOSITE = 0.08

/* ── RETOUCHES MATÉRIAUX ──────────────────────────────────────────
   Propres au modèle McLaren P1 MSO de bohmerang. Le .glb arrive
   TEXTURÉ (34 textures) : on ne recolore que les matériaux de couleur
   pure qui portent la livrée. La carrosserie blanche et l'accent bleu
   MSO passent au carbone sombre parce que le système du site est
   mono-accent. Aucun des trois matériaux ne porte de texture — les 34
   textures du modèle restent intactes. Si on change de modèle, on
   réécrit ce tableau, c'est le seul endroit. */
export function retouches({ carrosserie = CARROSSERIE, rugosite = RUGOSITE } = {}) {
  return {
    WhitePaintjob: { couleur: carrosserie, metal: 0.90, rugo: rugosite, vernis: 1 },
    Blue:          { couleur: "121317", metal: 0.30, rugo: 0.45 }, // accent MSO neutralisé
    Glass:         { couleur: "04060a", metal: 0.00, rugo: 0.06 }, // vitrage teinté
  }
}

/* Réglages du moteur : mêmes valeurs des deux côtés, sinon la couleur
   du client n'est pas celle des images. L'appelant garde la CRÉATION
   du renderer (alpha, antialias, canvas, preserveDrawingBuffer) : ces
   choix-là diffèrent légitimement entre l'outil et le client. */
export function regleRenderer(THREE, renderer) {
  renderer.setClearAlpha(0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
}

/* ── STUDIO SOMBRE ──────────────────────────────────────────────── */
export function studio(THREE) {
  const s = new THREE.Scene()
  s.add(new THREE.Mesh(
    new THREE.BoxGeometry(40, 24, 40),
    new THREE.MeshBasicMaterial({ color: 0x04060a, side: THREE.BackSide })
  ))
  const bande = (w, h, pos, rot, force) => {
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    m.color.multiplyScalar(force)
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)
    p.position.set(...pos); p.rotation.set(...rot); s.add(p)
  }
  const H = Math.PI / 2
  bande(0.8, 30, [    0, 12.0,  0], [ H,  0, 0], 9)
  bande(0.6, 28, [-3.4, 12.0,  0], [ H,  0, 0], 6)
  bande(0.6, 28, [ 3.4, 12.0,  0], [ H,  0, 0], 6)
  bande(0.9, 30, [-9.5, 2.6,  0], [ 0,  H, 0], 8)
  bande(0.9, 30, [ 9.5, 2.6,  0], [ 0, -H, 0], 8)
  bande(1.1, 30, [-7.0, 0.35, 0], [ 0,  H, 0], 7)
  bande(1.1, 30, [ 7.0, 0.35, 0], [ 0, -H, 0], 7)
  bande(16, 0.7, [ 0, 3.0, -12], [0, 0, 0], 3)
  bande(16, 0.7, [ 0, 3.0,  12], [0, Math.PI, 0], 3)
  return s
}

/* Normalisation du modèle : échelle à 4 unités D'ABORD, recentrage
   ENSUITE (l'ordre compte — scale s'applique à la géométrie, position
   dans l'espace du parent). Rend le rayon de la sphère englobante,
   dont le placement caméra a besoin. */
export function prepareModele(THREE, m) {
  const t0 = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3())
  m.scale.setScalar(4 / Math.max(t0.x, t0.y, t0.z))
  m.updateMatrixWorld(true)
  const boite = new THREE.Box3().setFromObject(m)
  m.position.sub(boite.getCenter(new THREE.Vector3()))
  m.updateMatrixWorld(true)
  return boite.getBoundingSphere(new THREE.Sphere()).radius
}

/* Applique la table de retouches, rend l'inventaire des matériaux
   rencontrés (l'introspection --materiaux de l'outil s'en sert). */
export function appliqueRetouches(m, table) {
  const releves = []
  m.traverse((o) => {
    if (!o.isMesh) return
    o.frustumCulled = false
    for (const mat of (Array.isArray(o.material) ? o.material : [o.material])) {
      if (!mat) continue
      releves.push({ mesh: o.name, mat: mat.name, type: mat.type })
      if (!mat.isMeshStandardMaterial) continue
      mat.envMapIntensity = 1
      const r = table[mat.name]
      if (!r) continue
      if (r.couleur !== undefined) { mat.color.setHex(parseInt(r.couleur, 16)); if (r.sansTexture) mat.map = null }
      if (r.masquer) mat.visible = false
      if (r.metal !== undefined) mat.metalness = r.metal
      if (r.rugo !== undefined) mat.roughness = r.rugo
      if (r.vernis !== undefined && "clearcoat" in mat) { mat.clearcoat = r.vernis; mat.clearcoatRoughness = 0.04 }
    }
  })
  return releves
}

/* Place la caméra sur l'arc d'élévation, à la distance où la sphère
   englobante rentre dans le champ. Appelée par frame côté client quand
   l'élévation bouge : trois lignes de trigonométrie, rien à mémoïser. */
export function placeCamera(THREE, camera, rayon, elevationDeg) {
  const d = (rayon / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.25
  const e = THREE.MathUtils.degToRad(elevationDeg)
  camera.position.set(0, Math.sin(e) * d, Math.cos(e) * d)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
}
```

- [ ] **Step 2 : faire consommer le module par `scene.html`**

Remplacer tout le contenu du `<script type="module">` (l'importmap au-dessus ne bouge pas) par :

```js
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js"
/* Le studio, les retouches et la mise en place viennent du module
   PARTAGÉ avec le client (chantier #12) — servi par l'alias de
   rendu.mjs. Il n'y a plus qu'un studio. */
import { studio, retouches, regleRenderer, prepareModele, appliqueRetouches, placeCamera,
         FOV as FOV_DEFAUT, FLOU_PMREM, CARROSSERIE, RUGOSITE } from "/studio.mjs"

const P = new URLSearchParams(location.search)
const n      = (k, d) => { const v = P.get(k); return v === null ? d : +v }
const MODELE = P.get("modele")
const NB     = n("nb", 60)
const RENDU  = n("rendu", 2000)     // on rend grand pour redescendre : c'est l'antialiasing le moins cher
const SORTIE = n("sortie", 1000)
const FOV    = n("fov", FOV_DEFAUT)
const ELEV   = n("elevation", 13)   // degrés au-dessus de l'horizon (la production passe 30)
const DEPART = n("depart", 0)       // azimut de l'image 000
const SENS   = n("sens", 1)
const ENV    = n("env", 1)
const MARGE  = n("marge", 1.02)     // respiration autour du cadrage automatique
const CARRO  = P.get("carrosserie") || CARROSSERIE
const RUGO   = n("rugosite", RUGOSITE)

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
regleRenderer(THREE, renderer)
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = null          // le fond transparent, c'est tout l'intérêt du format
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 5000)

const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(studio(THREE), FLOU_PMREM).texture
scene.environmentIntensity = ENV
// Aucune lumière ajoutée : tout vient de l'environnement.

const voiture = new THREE.Group()
scene.add(voiture)

let materiaux = []
let cadre = null   // rectangle de recadrage, en fractions de l'image rendue

const loader = new GLTFLoader()
const draco = new DRACOLoader()
draco.setDecoderPath("https://unpkg.com/three@0.169.0/examples/jsm/libs/draco/gltf/")
loader.setDRACOLoader(draco)
loader.setMeshoptDecoder(MeshoptDecoder)   // le .glb optimisé arrive compressé meshopt (#12)

function pose(i) {
  voiture.rotation.y = THREE.MathUtils.degToRad(DEPART + SENS * i * 360 / NB)
}
```

Les fonctions `mesure(res)` et `window.rendreFrame` restent **exactement telles quelles** (elles sont propres à l'outil : union des pixels opaques, sortie PNG). Le callback de chargement devient :

```js
loader.load(MODELE, (gltf) => {
  const m = gltf.scene
  voiture.add(m)
  const rayon = prepareModele(THREE, m)
  materiaux = appliqueRetouches(m, retouches({ carrosserie: CARRO, rugosite: RUGO }))
  window.materiaux = materiaux
  placeCamera(THREE, camera, rayon, ELEV)
  cadre = mesure(360)
  window.cadre = cadre
  window.pret = true
}, undefined, (e) => { window.erreur = String(e && e.message || e) })
```

Les gros commentaires de doctrine qui vivaient sur `studio()` et `RETOUCHES` ont déménagé avec le code dans `studio.mjs` — ne pas les dupliquer ici.

- [ ] **Step 3 : `rendu.mjs` — MIME, alias, `--cadre`**

Dans `MIME`, ajouter :

```js
".mjs": "text/javascript",
```

Dans `main()`, l'appel à `servir` gagne l'alias du module partagé :

```js
const srv = await servir(
  { "/scene.html": path.join(ICI, "scene.html"), "/studio.mjs": path.join(ICI, "studio.mjs") },
  path.dirname(glb)
)
```

Ligne 138, la sonde d'encodeur saute aussi en mode `--cadre` (pas d'encodage, donc pas besoin d'encodeur) :

```js
if (!opt.materiaux && !opt.cadre) { ENCODEUR = await trouveEncodeur(); console.log("encodeur :", ENCODEUR) }
```

Juste après `console.log("cadrage commun :", cadre)` :

```js
/* --cadre : consignation seule. Le cadre vient d'être imprimé — c'est
   l'union des pixels opaques sur les NB vues, irrejouable au client
   (spec #12, décision 4) : ce mode le relève sans payer le rendu. */
if (opt.cadre) return
```

- [ ] **Step 4 : vérifier que l'outil marche encore, sans rendu complet**

```bash
node tools/voiture/rendu.mjs ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb --nb=160 --rendu=2000 --elevation=30 --materiaux | head -20
```

Attendu : la liste des matériaux s'imprime (73 meshes), avec `WhitePaintjob`, `Blue` et `Glass` présents. Toute erreur « module introuvable » = l'alias ou le MIME est faux.

```bash
node tools/voiture/rendu.mjs ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb --nb=160 --rendu=2000 --elevation=30 --cadre
```

Attendu : `cadrage commun : {"x":…,"y":…,"c":…}` puis sortie propre, en ~1-2 min (la mesure 360² sur 160 vues, pas le rendu 2000²). **Noter ces trois valeurs** : elles servent à la Tâche 8 et à CREDIT.txt (Tâche 5).

- [ ] **Step 5 : commit**

```bash
git add tools/voiture/studio.mjs tools/voiture/scene.html tools/voiture/rendu.mjs
git commit -m "Le studio ne s'écrit plus qu'une fois — scene.html et le futur client liront le même module"
```

---

### Tâche 2 : la séquence se re-prouve — plancher de bruit et cadre consignés

**Files:**
- Create: `tools/voiture/compare.mjs`
- Rendus dans `$SCRATCH/seq-source/` (hors dépôt)

**Interfaces:**
- Consumes: la chaîne `rendu.mjs` de la Tâche 1.
- Produces: le **plancher de bruit** (RMSE moyen/max entre un re-rendu depuis la SOURCE et la production) et le **cadre** — les deux chiffres dont les Tâches 4, 5 et 8 ont besoin.

- [ ] **Step 1 : écrire `tools/voiture/compare.mjs`**

```js
/* ==================================================================
   COMPARAISON DE SÉQUENCES — le contrôle qui ne pardonne pas (#12).
   Compare image à image deux dossiers de vues homonymes (000 → NB-1)
   et chiffre l'écart en RMSE normalisé (magick compare). Sert deux fois :
   1) PLANCHER DE BRUIT : re-rendu depuis le .glb SOURCE contre la
      production — l'écart que le pipeline produit tout seul (encodeur,
      SwiftShader, plateforme du rendu d'origine) ;
   2) VERDICT : re-rendu depuis le .glb OPTIMISÉ contre la production —
      doit rester dans la bande du plancher, sinon l'optimisation a
      mangé quelque chose que l'œil pourrait voir.
   Le chiffre dit QU'IL y a un écart ; la planche des pires paires dit
   s'il SE VOIT — les deux contrôles du spec, dans cet ordre.
   usage : node tools/voiture/compare.mjs <référence> <candidat>
             [--nb=160] [--planche=pires.png]
   ================================================================== */
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { existsSync } from "node:fs"
import path from "node:path"

const pexec = promisify(execFile)
const args = process.argv.slice(2)
const libres = args.filter((a) => !a.startsWith("--"))
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => {
  const [k, v] = a.slice(2).split("=")
  return [k, v === undefined ? "1" : v]
}))
const [REF, CAND] = libres.map((d) => path.resolve(d))
const NB = +(opt.nb ?? 160)
if (!REF || !CAND) {
  console.error("usage: node tools/voiture/compare.mjs <référence> <candidat> [--nb=160] [--planche=pires.png]")
  process.exit(1)
}

const trouve = (dossier, i) => {
  const n = String(i).padStart(3, "0")
  for (const ext of [".webp", ".png"]) {
    const p = path.join(dossier, n + ext)
    if (existsSync(p)) return p
  }
  throw new Error(`image manquante : ${n} dans ${dossier}`)
}

/* magick compare écrit le RMSE sur stderr — « 123.4 (0.00188) », la
   parenthèse est la valeur normalisée [0..1] — et rend un code 1 quand
   les images diffèrent : différer est ici le cas NORMAL, pas une erreur. */
async function rmse(a, b) {
  try { await pexec("magick", ["compare", "-metric", "RMSE", a, b, "null:"]); return 0 }
  catch (e) {
    const m = /\(([\d.eE+-]+)\)/.exec(e.stderr ?? "")
    if (!m) throw new Error(`magick compare illisible sur ${a} : ${e.stderr}`)
    return +m[1]
  }
}

const notes = []
for (let i = 0; i < NB; i++) {
  notes.push({ i, v: await rmse(trouve(REF, i), trouve(CAND, i)) })
  process.stdout.write(`\rcompare ${i + 1}/${NB}`)
}
console.log("")
const tri = [...notes].sort((a, b) => b.v - a.v)
const moy = notes.reduce((s, n) => s + n.v, 0) / NB
console.log(`RMSE normalisé — moyenne ${moy.toFixed(5)}, max ${tri[0].v.toFixed(5)} (image ${String(tri[0].i).padStart(3, "0")})`)
console.log(`pires : ${tri.slice(0, 8).map((n) => `${String(n.i).padStart(3, "0")}=${n.v.toFixed(4)}`).join("  ")}`)

if (opt.planche) {
  /* Huit pires paires — rangée du haut : référence, rangée du bas :
     candidat, colonnes alignées par image. */
  await pexec("magick", ["montage", "-tile", "8x2", "-geometry", "+2+2", "-background", "#222",
    ...tri.slice(0, 8).map((n) => trouve(REF, n.i)),
    ...tri.slice(0, 8).map((n) => trouve(CAND, n.i)),
    opt.planche])
  console.log(`planche des pires : ${opt.planche}`)
}
```

- [ ] **Step 2 : re-rendre les 160 vues depuis le `.glb` SOURCE** (long — ~40 min, à lancer en arrière-plan)

```bash
node tools/voiture/rendu.mjs ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb \
  --nb=160 --rendu=2000 --elevation=30 --poids=30000 --encodeur=ffmpeg \
  --dest=$SCRATCH/seq-source
```

Attendu en fin de course : `160 images dans … — ~4 Mo`. Le `cadrage commun` imprimé doit être **identique** à celui du Step 4 de la Tâche 1 (même modèle, mêmes réglages, SwiftShader déterministe).

- [ ] **Step 3 : chiffrer le plancher de bruit**

```bash
node tools/voiture/compare.mjs public/voiture $SCRATCH/seq-source --planche=$SCRATCH/plancher-bruit.png
```

Attendu : un RMSE faible (la production a été rendue sous Windows/ffmpeg, ce re-rendu sous Linux — l'écart mesuré ICI est le bruit de plateforme + encodage, pas un défaut). **Consigner moyenne et max** : c'est la bande dans laquelle l'optimisé devra rester (Tâche 4). Regarder la planche : si un écart se VOIT déjà entre source et production, s'arrêter et enquêter (studio.mjs a changé quelque chose) avant toute optimisation.

- [ ] **Step 4 : commit**

```bash
git add tools/voiture/compare.mjs
git commit -m "Le pipeline se re-prouve : l'outil de comparaison chiffre ce que l'œil devra juger"
```

---

### Tâche 3 : le `.glb` optimisé — mesuré à chaque levier

**Files:**
- Candidats dans `$SCRATCH/glb/` (hors dépôt)

**Interfaces:**
- Produces: `$SCRATCH/glb/candidat.glb` retenu + tableau des poids par étape (pour l'issue et CREDIT.txt).

- [ ] **Step 1 : l'inventaire d'abord — savoir où vivent les 67 Mio**

```bash
mkdir -p $SCRATCH/glb
npx -y @gltf-transform/cli@4.4.2 inspect ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb
```

Lire la sortie : part de la géométrie contre part des 34 textures. Toute affirmation « les textures dominent » sans cet inventaire serait un fait inventé. **Consigner les 3-4 postes les plus lourds.**

- [ ] **Step 2 : premier candidat — le moins destructeur**

`optimize` de gltf-transform enchaîne dedup/prune/weld/join à défaut ; on coupe `simplify` (la décimation attaque la silhouette, on ne la paie que si le poids l'exige) :

```bash
npx -y @gltf-transform/cli@4.4.2 optimize \
  ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb $SCRATCH/glb/candidat-a.glb \
  --compress meshopt --texture-compress webp --texture-size 1024 --simplify false
stat -c%s $SCRATCH/glb/candidat-a.glb
```

meshopt plutôt que Draco en premier choix : son décodeur est un module three déjà dans `three/addons`, pas un WASM séparé à servir. WebP plutôt que KTX2 : le navigateur le décode nativement, zéro décodeur côté client.

- [ ] **Step 3 : escalade si > ~8 Mo, dans l'ordre du moins destructeur**

Chaque cran se mesure avant de passer au suivant ; on s'arrête au premier qui passe sous ~8 Mo :

```bash
# cran B : textures à 512 (la voiture vit derrière un titre à 0,72, en retrait)
npx -y @gltf-transform/cli@4.4.2 optimize \
  ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb $SCRATCH/glb/candidat-b.glb \
  --compress meshopt --texture-compress webp --texture-size 512 --simplify false
# cran C : simplification prudente en plus
npx -y @gltf-transform/cli@4.4.2 optimize \
  ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb $SCRATCH/glb/candidat-c.glb \
  --compress meshopt --texture-compress webp --texture-size 512 --simplify true --simplify-error 0.0001
```

Si les noms de commandes/drapeaux diffèrent dans la CLI installée : `npx -y @gltf-transform/cli@4.4.2 optimize --help` fait foi — les leviers restent les mêmes (compression meshopt, textures WebP redimensionnées, simplification en dernier).

- [ ] **Step 4 : contrôle que les retouches trouveront leurs matériaux**

```bash
node tools/voiture/rendu.mjs $SCRATCH/glb/<candidat-retenu>.glb --nb=8 --materiaux | grep -E "WhitePaintjob|Blue|Glass"
```

Attendu : les trois noms présents. `optimize` dédoublonne et fusionne — si un des trois noms a disparu, la livrée ne s'appliquera plus : descendre d'un cran d'optimisation ou passer les étapes une à une (`dedup`, `prune`, `weld`, `meshopt`…) pour isoler celle qui mange les noms.

Pas de commit : rien n'entre au dépôt avant la vérification de la Tâche 4.

---

### Tâche 4 : la vérification qui ne pardonne pas — et le verdict de poids

**Files:**
- Rendus dans `$SCRATCH/seq-optimisee/` (hors dépôt)

**Interfaces:**
- Consumes: le candidat de la Tâche 3, le plancher de bruit de la Tâche 2.
- Produces: le verdict — candidat validé (et son poids), ou remontée à Hugo.

- [ ] **Step 1 : re-rendre les 160 vues depuis le candidat** (long — arrière-plan)

```bash
node tools/voiture/rendu.mjs $SCRATCH/glb/<candidat>.glb \
  --nb=160 --rendu=2000 --elevation=30 --poids=30000 --encodeur=ffmpeg \
  --dest=$SCRATCH/seq-optimisee
```

Le `cadrage commun` imprimé doit rester celui des Tâches 1/2 — s'il bouge, l'optimisation a déplacé la boîte englobante (élagage trop gourmand) et le raccord client serait faux : candidat rejeté, cran précédent.

- [ ] **Step 2 : diff chiffré + contrôle à l'œil**

```bash
node tools/voiture/compare.mjs public/voiture $SCRATCH/seq-optimisee --planche=$SCRATCH/verdict.png
```

Gate : moyenne et max **dans la bande du plancher de bruit** (Tâche 2) — un dépassement léger se juge à l'œil sur la planche, un dépassement net rejette le candidat. Regarder `verdict.png` dans tous les cas : le chiffre dit qu'il y a un écart, l'œil dit s'il se voit.

- [ ] **Step 3 : le verdict de poids**

- ≤ ~8 Mo et diff propre → candidat retenu, Tâche 5.
- \> ~8 Mo sans écart visible au cran le plus destructeur acceptable → **STOP : la décision (accepter plus lourd, presser plus fort, abandonner) remonte à Hugo avec les chiffres sur la table** (décision n°3 du spec). Ne pas trancher à sa place.

---

### Tâche 5 : le dérivé web entre au dépôt

**Files:**
- Create: `public/voiture/modele-web.glb` (copie du candidat retenu)
- Modify: `public/voiture/CREDIT.txt`

- [ ] **Step 1 : copier et vérifier l'attribut binaire**

```bash
cp $SCRATCH/glb/<candidat-retenu>.glb public/voiture/modele-web.glb
git check-attr binary public/voiture/modele-web.glb
```

Attendu : `binary: set` (la règle `*.glb binary` existe depuis le commit du 2026-08-10).

- [ ] **Step 2 : étendre CREDIT.txt au fichier distribué**

Ajouter après la section « Fabrication » (adapter les chiffres mesurés, la commande exacte du candidat retenu, et le cadre relevé en Tâche 1) :

```
Le modèle optimisé distribué — modele-web.glb
---------------------------------------------
modele-web.glb est le même modèle, optimisé pour le régime drag de la
page d'accueil (chantier #12) : géométrie compressée meshopt, textures
ramenées à N px et transcodées WebP. X XXX XXX octets contre 70 471 356
à la source. C'est une adaptation du même modèle de bohmerang,
distribuée sous la même licence CC BY-NC-SA 4.0, couverte par
l'attribution ci-dessus. Décision de publier prise le 2026-08-10 : le
modèle est libre (« FREE - McLaren P1 MSO »), servir le dérivé
n'expose aucun bien propre.

Fabriqué par :
    npx -y @gltf-transform/cli@4.4.2 optimize <source> modele-web.glb \
      --compress meshopt --texture-compress webp --texture-size N --simplify false
Vérifié en re-rendant les 160 vues du pipeline depuis ce fichier et en
les comparant aux images de ce dossier : RMSE normalisé max X,XXXXX,
pour un plancher de bruit du pipeline de X,XXXXX (mesuré en re-rendant
depuis la source le 2026-08-11).

Le cadre de recadrage commun aux 160 vues, relevé le 2026-08-11 —
fractions du rendu carré, IRREJOUABLE au client qui l'applique au
viewport de sa caméra (components/proto/voiture-drag.ts) :
    x=0.XXXX  y=0.XXXX  c=0.XXXX
```

- [ ] **Step 3 : commit**

```bash
git add public/voiture/modele-web.glb public/voiture/CREDIT.txt
git commit -m "Le dérivé web entre au dépôt — X,X Mo mesurés, vérifiés contre les 160 vues de production"
```

---

### Tâche 6 : three entre au runtime, épinglé — et le bundle ne bouge pas

**Files:**
- Modify: `package.json`

- [ ] **Step 1 : relevé AVANT**

```bash
npx next build 2>&1 | grep -A4 "First Load JS"
```

Consigner le First Load JS de `/`.

- [ ] **Step 2 : épingler**

Dans `dependencies` : `"three": "0.169.0"` (exact, **sans caret** — la version de l'importmap `scene.html:13`). Dans `devDependencies` : `"@types/three": "0.169.0"`. Puis `npm install`.

- [ ] **Step 3 : relevé APRÈS — identique**

```bash
npx next build 2>&1 | grep -A4 "First Load JS"
```

Attendu : First Load JS de `/` **inchangé à l'octet** — une dépendance jamais importée ne pèse rien. C'est la moitié du gate de la décision 7 ; l'autre moitié (toujours identique une fois le code client écrit) se rejoue en Tâche 10.

- [ ] **Step 4 : commit**

```bash
git add package.json package-lock.json
git commit -m "three entre au runtime, épinglé à l'importmap — et le First Load JS n'a pas bougé d'un octet"
```

---

### Tâche 7 : l'arithmétique du geste, extraite et prouvée

**Files:**
- Create: `components/proto/geste.mjs`
- Create: `tools/voiture/geste.test.mjs`

**Interfaces:**
- Produces: `mod(i, nb)`, `azimutVersIndex(azimutDeg, nb)`, `offsetAuRelachement(azimutDeg, v, {nb, pose, tours})` — consommées par voiture.tsx (Tâche 9).

- [ ] **Step 1 : écrire le test qui échoue**

`tools/voiture/geste.test.mjs` :

```js
/* Le modulo négatif de JavaScript a déjà mordu ce composant une fois
   (voir le commentaire d'`index` dans voiture.tsx) : l'arithmétique du
   drag est extraite ici pour être prouvée au node --test. */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mod, azimutVersIndex, offsetAuRelachement } from "../../components/proto/geste.mjs"

test("mod ramène les négatifs dans [0, nb)", () => {
  assert.equal(mod(-1, 160), 159)
  assert.equal(mod(320, 160), 0)
  assert.equal(mod(-161, 160), 159)
})

test("azimutVersIndex aimante au cran le plus proche (ajustement ≤ 1,125°)", () => {
  assert.equal(azimutVersIndex(0, 160), 0)
  assert.equal(azimutVersIndex(1.124, 160), 0)        // sous le demi-cran : image 0
  assert.equal(azimutVersIndex(1.126, 160), 1)        // au-dessus : image 1
  assert.equal(azimutVersIndex(315, 160), 140)        // la pose de départ, azimut 315°
  assert.equal(azimutVersIndex(-2.25, 160), 159)      // un cran en arrière : la voisine
  assert.equal(azimutVersIndex(3600 + 315, 160), 140) // dix tours plus loin : même image
})

test("offsetAuRelachement : l'angle laissé par la main persiste", () => {
  const P = { nb: 160, pose: 140, tours: 1 }
  // relâché exactement où le scroll dicte : offset nul
  assert.equal(offsetAuRelachement(140 * 2.25, 0, P), 0)
  // relâché trois crans plus loin : offset 3…
  assert.equal(offsetAuRelachement(143 * 2.25, 0, P), 3)
  // …quel que soit l'endroit où le scroll est rendu pendant le geste
  assert.equal(offsetAuRelachement((40 + 143) * 2.25, 0.25, P), 3)
  // un tour arrière complet : offset nul, jamais négatif
  assert.equal(offsetAuRelachement((140 - 160) * 2.25, 0, P), 0)
})
```

- [ ] **Step 2 : vérifier l'échec**

```bash
node --test tools/voiture/geste.test.mjs
```

Attendu : ÉCHEC — `Cannot find module … geste.mjs`.

- [ ] **Step 3 : écrire `components/proto/geste.mjs`**

```js
/* ==================================================================
   L'ARITHMÉTIQUE DU GESTE (#12) — pur, sans DOM, testable au
   node --test (tools/voiture/geste.test.mjs). nb et pose arrivent en
   paramètres : les constantes vivent dans voiture.tsx avec leur
   doctrine, ce module ne fait que compter juste.
   ================================================================== */

/* Le second `+ nb` couvre les valeurs négatives, que le `%` de
   JavaScript propagerait — le même garde structurel que l'index du
   scroll dans voiture.tsx. */
export const mod = (i, nb) => ((i % nb) + nb) % nb

/* L'image la plus proche d'un azimut continu : l'aimantation au cran
   de 2,25°, ajustement ≤ 1,125° — sous ce que le ticket 18 a montré
   invisible en mouvement. */
export const azimutVersIndex = (azimutDeg, nb) => mod(Math.round(azimutDeg / (360 / nb)), nb)

/* L'offset en crans qui fait persister l'angle laissé par la main :
   le delta entre le cran du relâchement et le cran que le scroll
   dicte à cet instant (v = valeur courante du ressort). Absorbe aussi
   un scroll survenu pendant le geste — on recalcule contre v, rien
   d'autre. */
export const offsetAuRelachement = (azimutDeg, v, { nb, pose, tours }) =>
  mod(Math.round(azimutDeg / (360 / nb)) - pose - Math.round(v * tours * nb), nb)
```

- [ ] **Step 4 : vérifier le passage**

```bash
node --test tools/voiture/geste.test.mjs
```

Attendu : 3 tests PASS.

- [ ] **Step 5 : commit**

```bash
git add components/proto/geste.mjs tools/voiture/geste.test.mjs
git commit -m "L'arithmétique du geste, extraite et prouvée — le modulo négatif ne mordra pas deux fois"
```

---

### Tâche 8 : le module du régime drag — chargé au geste, jamais avant

**Files:**
- Create: `components/proto/voiture-drag.ts`

**Interfaces:**
- Consumes: `tools/voiture/studio.mjs` (Tâche 1), `public/voiture/modele-web.glb` (Tâche 5), le cadre consigné (Tâche 1 Step 4).
- Produces: `creeScene(toile: HTMLCanvasElement, surPerte?: () => void): Promise<SceneDrag | null>` avec `SceneDrag = { rend(azimutDeg, elevationDeg), taille(l, h), info(), estPerdu(), detruit() }` — consommé par voiture.tsx (Tâche 9) via `import("./voiture-drag")`.

- [ ] **Step 1 : écrire le module** (remplacer `CADRE` par les valeurs consignées à la Tâche 1) :

```ts
/* ==================================================================
   RÉGIME DRAG (#12) — la scène WebGL de la voiture, chargée
   DYNAMIQUEMENT au premier geste avéré, jamais avant : le visiteur
   qui ne saisit pas ne paie ni three, ni ce module, ni le modèle.

   Le studio, les retouches et la caméra viennent du module PARTAGÉ
   avec le pipeline (tools/voiture/studio.mjs) : il n'y a pas deux
   studios, donc pas de teinte nouvelle par construction — le client
   réaffiche les mêmes couleurs, sur fond alpha.

   Le rendu est À LA DEMANDE : rend() n'est appelé que par l'événement
   de pointeur, au plus une fois par frame, zéro quand la main ne
   bouge pas. Aucune boucle ici.
   ================================================================== */
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js"
import { studio, retouches, regleRenderer, prepareModele, appliqueRetouches, placeCamera,
         FOV, FLOU_PMREM, INTENSITE_ENV } from "../../tools/voiture/studio.mjs"

/* Le cadre de recadrage de la séquence en production — l'union des
   pixels opaques sur les 160 vues, IRREJOUABLE ici (CREDIT.txt,
   campagne du 2026-08-11). Appliqué au viewport de la caméra : sans
   lui la voiture serait à la bonne pose mais pas à la bonne place
   dans la toile. */
export const CADRE = { x: 0.0, y: 0.0, c: 1.0 } // ← valeurs consignées, Tâche 1

const MODELE = "/voiture/modele-web.glb"

export type SceneDrag = {
  rend(azimutDeg: number, elevationDeg: number): void
  taille(largeur: number, hauteur: number): void
  info(): { geometries: number; textures: number }
  estPerdu(): boolean
  detruit(): void
}

export async function creeScene(toile: HTMLCanvasElement, surPerte?: () => void): Promise<SceneDrag | null> {
  /* Chaque échec rend null, sans un message : le drag azimut-seul sur
     la séquence reste, et c'est le repli permanent — le même
     renoncement propre que le composant applique à sa séquence. */
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas: toile, alpha: true, antialias: true })
  } catch {
    return null
  }
  renderer.setPixelRatio(1) // les pixels sont gérés par taille(), comme la toile 2D
  regleRenderer(THREE, renderer)

  const scene = new THREE.Scene()
  scene.background = null
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 5000)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(studio(THREE), FLOU_PMREM).texture
  scene.environmentIntensity = INTENSITE_ENV
  const voiture = new THREE.Group()
  scene.add(voiture)

  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  let gltf
  try {
    gltf = await loader.loadAsync(MODELE)
  } catch {
    renderer.dispose()
    return null
  }
  const rayon = prepareModele(THREE, gltf.scene)
  appliqueRetouches(gltf.scene, retouches())
  voiture.add(gltf.scene)

  camera.setViewOffset(1, 1, CADRE.x, CADRE.y, CADRE.c, CADRE.c)

  let perdu = false
  toile.addEventListener("webglcontextlost", (e) => {
    e.preventDefault()
    perdu = true
    surPerte?.()
  })

  /* Échauffement HORS du geste : compile les shaders, téléverse les
     34 textures et la géométrie — la première saisie ne paiera que le
     rendu. C'est aussi ce qui rend info() honnête. */
  placeCamera(THREE, camera, rayon, 30)
  renderer.render(scene, camera)

  return {
    rend(azimutDeg, elevationDeg) {
      if (perdu) return
      voiture.rotation.y = THREE.MathUtils.degToRad(azimutDeg)
      placeCamera(THREE, camera, rayon, elevationDeg)
      renderer.render(scene, camera)
    },
    taille(l, h) {
      if (toile.width !== l || toile.height !== h) renderer.setSize(l, h, false)
    },
    info: () => ({ geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }),
    estPerdu: () => perdu,
    detruit() {
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
```

- [ ] **Step 2 : vérifier le typage**

```bash
npx tsc --noEmit
```

Attendu : zéro erreur (`allowJs: true` couvre l'import du `.mjs`).

- [ ] **Step 3 : commit**

```bash
git add components/proto/voiture-drag.ts
git commit -m "Le régime drag a son module — chargé au geste, rendu par événement, repli silencieux"
```

---

### Tâche 9 : la voiture se saisit — geste, bascule, réconciliation

**Files:**
- Modify: `components/proto/voiture.tsx`
- Modify: `app/planche.css` (section voiture)

**Interfaces:**
- Consumes: `geste.mjs` (Tâche 7), `voiture-drag.ts` (Tâche 8).
- Produces: attributs `data-regime="gl"`, `data-gl-geometries`, `data-gl-textures` sur `.voiture` — relevés par le banc (Tâche 11) ; classes `voiture-survol`/`voiture-saisie` sur `<html>` — stylées ici même.

- [ ] **Step 1 : `voiture.tsx` — imports et constantes**

Après l'import de motion, ajouter :

```tsx
import { azimutVersIndex, offsetAuRelachement } from "./geste.mjs"
```

Après le bloc `FLOT`/`TAU`, ajouter :

```tsx
/* ── LE RÉGIME DRAG (#12) ─────────────────────────────────────────
   La doctrine anti-3D de l'en-tête ne tombe pas, elle se précise :
   c'est un argument de RÉGIME. Pendant un drag la page ne défile pas,
   la parallaxe est immobile, la respiration est suspendue, et le rendu
   3D est déclenché par l'événement de pointeur — au plus un rendu par
   frame quand la main bouge, ZÉRO quand elle ne bouge pas. Le même
   motif marche/arrêt que la respiration ci-dessous.

   Rien ne se télécharge sans un geste de saisie : mousedown sur un
   pixel opaque + déplacement au-delà du seuil. Pendant que le modèle
   arrive, le geste pilote la SÉQUENCE en azimut (zéro octet nouveau) ;
   la promotion WebGL attend le relâchement — jamais de changement de
   régime en cours de geste. Ce mode séquence est aussi le repli
   permanent : contexte refusé, perdu, chargement en échec — le drag
   azimut-seul reste, sans un message. */
const DRAG_LIVRE = true  // retirer le régime drag sans toucher au reste
const ELEV_REPOS = 30    // l'élévation de la séquence (CREDIT.txt) : la seule où elle existe
const ELEV_MIN = 18      // bornes de l'axe d'élévation — PROPOSÉES, à régler à l'œil par Hugo
const ELEV_MAX = 42      //   (décision n°2 du spec) : trop d'amplitude montre le dessous et le toit
const SENS_AZIMUT = 0.45 // °/px — un tour en ~800 px de glissement, à régler à l'œil
const SENS_ELEV = 0.12   // °/px vertical
const CRAN = 360 / NB    // 2,25°
const SEUIL_DRAG = 4     // px avant qu'un mousedown ne devienne un drag avéré — un clic reste un clic
const SEUIL_ALPHA = 32   // alpha minimal d'un pixel « saisissable » : le halo anti-aliasé ne compte pas
const SEUIL_FONDU = 0.05 // sous ce fondu la voiture est invisible : rien à saisir
const AMORTI = 0.94      // décroissance de l'inertie par frame — coupée sous reduce
const RETOUR_ELEV = 0.8  // fraction d'écart d'élévation restante par frame au retour
const INTERACTIFS = "a,button,input,textarea,select,summary,label,[contenteditable],[role=button]"
```

- [ ] **Step 2 : refs, offset et index**

Dans le corps du composant, après `const canvas = useRef…`, ajouter :

```tsx
const conteneur = useRef<HTMLDivElement>(null)
const toileGl = useRef<HTMLCanvasElement>(null)
const tenue = useRef(false)
const sceneGl = useRef<import("./voiture-drag").SceneDrag | null>(null)
const chargementGl = useRef<Promise<void> | null>(null)
```

Après `const lisse = useSpring(p, RESSORT)`, ajouter :

```tsx
/* L'offset en crans laissé par la main au relâchement : la voiture
   reste où on l'a posée, et le scroll continue de la tourner à partir
   de là. MotionValue et non ref : l'index en dépend, et c'est son
   changement qui déclenche la repeinture au relâchement. */
const decalage = useMotionValue(0)
/* 1 pendant la prise : la respiration s'arrête (une chose que la main
   tient ne flotte pas) et la peinture au fil de l'index se suspend —
   pendant le geste c'est la main qui peint, pas le scroll. */
const saisie = useMotionValue(0)
```

Remplacer la ligne de `index` par :

```tsx
const index = useTransform([lisse, decalage], ([v, off]: number[]) => ((POSE + Math.round(v * TOURS * NB) + off) % NB + NB) % NB)
```

(Le commentaire existant au-dessus du modulo reste tel quel.)

- [ ] **Step 3 : la respiration s'arrête sous la main**

Dans l'effet de respiration, remplacer les trois lignes d'abonnement :

```tsx
    if (fondu.get() > 0) marche()
    const stop = fondu.on("change", (o) => (o > 0 ? marche() : arret()))
    return () => {
      stop()
      arret()
    }
```

par :

```tsx
    /* Deux raisons de s'arrêter, une seule règle : la respiration ne
       tourne que si la voiture se voit ET que la main ne la tient pas
       — une chose tenue ne flotte pas (spec #12, décision 3). */
    const evalue = () => ((fondu.get() > 0 && !saisie.get()) ? marche() : arret())
    evalue()
    const stopF = fondu.on("change", evalue)
    const stopS = saisie.on("change", evalue)
    return () => {
      stopF()
      stopS()
      arret()
    }
```

et ajouter `saisie` aux dépendances de cet effet.

- [ ] **Step 4 : suspendre la peinture au fil de l'index pendant le geste**

Dans le `useMotionValueEvent(index …)`, la garde devient :

```tsx
if (reduit || !pretes || tenue.current) return
```

(un commentaire d'une ligne : `/* pendant le geste, la main peint — voir l'effet du drag */`).

- [ ] **Step 5 : l'effet du geste** — ajouter après le `useMotionValueEvent`, avant `if (absente)` :

```tsx
  /* ── LA SAISIE (#12) ──────────────────────────────────────────────
     Écoutée au DOCUMENT : `pointer-events: none` de la couche ne bouge
     pas (c'est ce qui protège le texte que la voiture traverse), donc
     c'est la page qu'on écoute et la géométrie qui décide — cible non
     interactive ET pixel opaque de la toile. Desktop au pointeur fin
     seulement : au tactile, le drag se disputerait la page avec le
     scroll, le contraire d'une bascule invisible. */
  useEffect(() => {
    if (!DRAG_LIVRE || !pretes || absente) return
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    const cont = conteneur.current
    const c2d = canvas.current
    if (!cont || !c2d) return

    /* Coordonnées de page → pixel de toile. getBoundingClientRect
       subit l'assiette : on passe par le CENTRE (invariant par
       rotation) puis on tourne le vecteur de -assiette ; la dérive
       verticale est déjà dans le rect, et offsetWidth donne la taille
       CSS non transformée. Un getImageData d'un pixel — pas de coût
       mesurable, et jamais plus d'un par frame (voir survole). */
    const surVoiture = (x: number, y: number) => {
      if (fondu.get() <= SEUIL_FONDU) return false // invisible = insaisissable
      const r = cont.getBoundingClientRect()
      const vx = x - (r.left + r.width / 2)
      const vy = y - (r.top + r.height / 2)
      const a = (-assiette.get() * Math.PI) / 180
      const ech = c2d.width / cont.offsetWidth
      const px = Math.round((vx * Math.cos(a) - vy * Math.sin(a) + cont.offsetWidth / 2) * ech)
      const py = Math.round((vx * Math.sin(a) + vy * Math.cos(a) + cont.offsetHeight / 2) * ech)
      if (px < 0 || py < 0 || px >= c2d.width || py >= c2d.height) return false
      const ctx = c2d.getContext("2d", { alpha: true })
      return !!ctx && ctx.getImageData(px, py, 1, 1).data[3] >= SEUIL_ALPHA
    }

    let candidat: { x: number; y: number } | null = null
    let azimut = 0        // degrés, continu pendant le geste et l'inertie
    let elevation = ELEV_REPOS
    let vitesse = 0       // °/frame, pour l'inertie du relâchement
    let dernierX = 0
    let dernierY = 0
    let enGl = false      // CE geste-ci est rendu en WebGL
    let inertie = 0       // rAF de la décrue en cours, 0 sinon
    let renduPrevu = 0    // au plus un rendu WebGL par frame
    let sondePrevue = 0   // au plus un test de survol par frame

    const chargeRegime = () => {
      if (chargementGl.current) return
      /* Le premier geste avéré est le SEUL déclencheur du chunk et du
         modèle — jamais le survol (tout le monde survole le centre de
         l'écran), jamais l'idle, jamais le clic nu. */
      chargementGl.current = import("./voiture-drag")
        .then(async (m) => {
          const t = toileGl.current
          if (!t) return
          const s = await m.creeScene(t, () => {
            /* Perte de contexte : retour SILENCIEUX au mode séquence,
               jamais un écran vide — le renoncement propre de
               l'en-tête, appliqué au WebGL. */
            delete cont.dataset.regime
            if (tenue.current && enGl) {
              enGl = false
              c2d.style.visibility = "visible"
              t.style.visibility = "hidden"
              peindre(azimutVersIndex(azimut, NB), true)
            }
          })
          if (!s) return // contexte refusé ou modèle en échec : le drag azimut-seul reste
          sceneGl.current = s
          /* Relevés par le banc (--drag) : le régime et l'empreinte
             GPU réelle — des chiffres mesurés, pas estimés. */
          cont.dataset.regime = "gl"
          const inf = s.info()
          cont.dataset.glGeometries = String(inf.geometries)
          cont.dataset.glTextures = String(inf.textures)
        })
        .catch(() => {})
    }

    const rendGl = () => {
      if (renduPrevu) return
      renduPrevu = requestAnimationFrame(() => {
        renduPrevu = 0
        sceneGl.current?.rend(azimut, elevation)
      })
    }

    const saisit = (x: number, y: number) => {
      tenue.current = true
      saisie.set(1)
      document.documentElement.classList.remove("voiture-survol")
      document.documentElement.classList.add("voiture-saisie")
      window.getSelection()?.removeAllRanges()
      chargeRegime()
      if (inertie) {
        /* Reprise en pleine décrue : la main récupère la voiture LÀ OÙ
           ELLE EST — azimut et élévation gardent leurs valeurs. */
        cancelAnimationFrame(inertie)
        inertie = 0
      } else {
        azimut = index.get() * CRAN
        elevation = ELEV_REPOS
      }
      vitesse = 0
      dernierX = x
      dernierY = y
      /* La promotion s'est décidée ENTRE les gestes : si le modèle est
         arrivé, ce geste-ci est WebGL — bascule sèche, au même azimut,
         même cadre. Sinon, séquence — et jamais de changement en cours
         de geste : une main qui découvre un axe de plus au milieu d'un
         mouvement, c'est une surprise, pas une bascule invisible. */
      enGl = !!sceneGl.current && !sceneGl.current.estPerdu()
      if (enGl) {
        const t = toileGl.current!
        const d = Math.min(DPR_MAX, window.devicePixelRatio || 1)
        sceneGl.current!.taille(Math.round(t.offsetWidth * d), Math.round(t.offsetHeight * d))
        sceneGl.current!.rend(azimut, elevation)
        t.style.visibility = "visible"
        c2d.style.visibility = "hidden"
      }
    }

    const bouge = (x: number, y: number) => {
      vitesse = (x - dernierX) * SENS_AZIMUT
      azimut += vitesse
      if (enGl) {
        elevation = Math.min(ELEV_MAX, Math.max(ELEV_MIN, elevation + (dernierY - y) * SENS_ELEV))
        rendGl()
      } else {
        peindre(azimutVersIndex(azimut, NB)) // le drag pilote la séquence : zéro octet nouveau
      }
      /* La veille SUIT l'azimut du drag : l'image du relâchement sera
         déjà décodée. La fenêtre glisse, l'empreinte ne bouge pas. */
      veille(azimutVersIndex(azimut, NB))
      dernierX = x
      dernierY = y
    }

    /* Réconciliation au relâchement : inertie (coupée sous reduce),
       retour d'élévation vers ELEV_REPOS (instantané sous reduce — la
       séquence n'existe qu'à cette élévation), aimantation au cran,
       et L'ANGLE LAISSÉ PAR LA MAIN PERSISTE via l'offset. */
    const pose = () => {
      document.documentElement.classList.remove("voiture-saisie")
      const fini = () => {
        inertie = 0
        decalage.set(offsetAuRelachement(azimut, lisse.get(), { nb: NB, pose: POSE, tours: TOURS }))
        if (enGl) {
          c2d.style.visibility = "visible"
          toileGl.current!.style.visibility = "hidden"
        }
        tenue.current = false
        peindre(index.get(), true)
        saisie.set(0)
      }
      if (reduit) {
        /* Sous reduce, rien ne continue après la main : pas d'inertie,
           élévation reposée d'un coup. Le drag lui-même reste — c'est
           de l'interaction, pas une animation. */
        elevation = ELEV_REPOS
        if (enGl) sceneGl.current?.rend(azimut, elevation)
        return fini()
      }
      const decroit = () => {
        azimut += vitesse
        vitesse *= AMORTI
        elevation = ELEV_REPOS + (elevation - ELEV_REPOS) * RETOUR_ELEV
        const posee = Math.abs(elevation - ELEV_REPOS) < 0.05
        if (posee) elevation = ELEV_REPOS
        if (enGl) sceneGl.current?.rend(azimut, elevation)
        else peindre(azimutVersIndex(azimut, NB))
        veille(azimutVersIndex(azimut, NB))
        if (Math.abs(vitesse) < 0.02 && posee) return fini()
        inertie = requestAnimationFrame(decroit)
      }
      inertie = requestAnimationFrame(decroit)
    }

    const survole = (e: MouseEvent) => {
      if (sondePrevue) return
      const { clientX: x, clientY: y } = e
      const cible = e.target as Element | null
      sondePrevue = requestAnimationFrame(() => {
        sondePrevue = 0
        const dessus = !cible?.closest?.(INTERACTIFS) && surVoiture(x, y)
        document.documentElement.classList.toggle("voiture-survol", dessus)
      })
    }

    const surMousedown = (e: MouseEvent) => {
      if (e.button !== 0 || tenue.current) return
      if ((e.target as Element | null)?.closest?.(INTERACTIFS)) return
      if (!surVoiture(e.clientX, e.clientY)) return
      /* Pas le mousedown nu : un clic pour poser le focus ou dissiper
         une sélection ne doit pas coûter des mégaoctets. Candidat
         seulement — le drag est avéré au-delà du seuil. */
      candidat = { x: e.clientX, y: e.clientY }
    }

    const surMousemove = (e: MouseEvent) => {
      if (tenue.current) return bouge(e.clientX, e.clientY)
      if (candidat) {
        if (Math.hypot(e.clientX - candidat.x, e.clientY - candidat.y) < SEUIL_DRAG) return
        const dep = candidat
        candidat = null
        saisit(dep.x, dep.y)
        bouge(e.clientX, e.clientY)
        return
      }
      survole(e)
    }

    const surMouseup = () => {
      candidat = null
      if (tenue.current) pose()
    }

    document.addEventListener("mousedown", surMousedown)
    document.addEventListener("mousemove", surMousemove)
    window.addEventListener("mouseup", surMouseup)
    window.addEventListener("blur", surMouseup) // un alt-tab en pleine prise est un relâchement

    return () => {
      document.removeEventListener("mousedown", surMousedown)
      document.removeEventListener("mousemove", surMousemove)
      window.removeEventListener("mouseup", surMouseup)
      window.removeEventListener("blur", surMouseup)
      if (inertie) cancelAnimationFrame(inertie)
      if (renduPrevu) cancelAnimationFrame(renduPrevu)
      if (sondePrevue) cancelAnimationFrame(sondePrevue)
      document.documentElement.classList.remove("voiture-saisie", "voiture-survol")
      tenue.current = false
      saisie.set(0)
      sceneGl.current?.detruit()
      sceneGl.current = null
      chargementGl.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pretes, absente, reduit])
```

- [ ] **Step 6 : le JSX — la seconde toile**

```tsx
    <motion.div
      ref={conteneur}
      className="voiture"
      aria-hidden="true"
      /* … le commentaire existant ne bouge pas … */
      style={{ rotate: assiette, y: derive, opacity: fondu }}
    >
      <canvas ref={canvas} className="voiture-toile" />
      {/* La toile du régime drag : même cadre, même dosage, échangée
          SEC avec la 2D à la saisie. Toujours dans le DOM — un canvas
          sans contexte ne coûte rien, et serveur et client écrivent
          le même HTML. */}
      <canvas ref={toileGl} className="voiture-toile-gl" />
    </motion.div>
```

- [ ] **Step 7 : `planche.css` — après le bloc `.voiture-toile`, ajouter**

```css
/* La seconde toile du régime drag (#12) : même cadre, même dosage,
   échangée SEC avec la toile 2D à la saisie — le fondu croisé a été
   rejeté au côte-à-côte du 2026-08-10, il dédouble les arêtes.
   `visibility` et non `display` : l'échange ne doit pas invalider la
   mise en page en plein geste. Jamais montrée sans pointeur fin. */
.voiture-toile-gl {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  visibility: hidden;
  opacity: 0.72; /* le même dosage que la toile 2D : deux toiles, un seul retrait */
}

/* L'affordance du drag, et rien d'autre : le curseur. Les classes
   sont posées sur <html> par le composant — la couche voiture garde
   pointer-events: none, la saisie s'écoute au document. Pendant la
   prise, la sélection ne doit pas se dessiner sous la main : le
   mousedown n'est pas neutralisé (un clic doit rester un clic), c'est
   la sélection elle-même qu'on suspend, le temps du geste. */
.voiture-survol { cursor: grab; }
.voiture-saisie { user-select: none; }
.voiture-saisie, .voiture-saisie * { cursor: grabbing !important; }
```

- [ ] **Step 8 : vérifier typage et build**

```bash
npx tsc --noEmit && npx next build
```

Attendu : zéro erreur. Le build liste un chunk séparé pour voiture-drag (visible dans la sortie) et le First Load JS de `/` est celui de la Tâche 6.

- [ ] **Step 9 : contrôle à la main en dev**

```bash
npx next dev
```

Vérifier au navigateur (souris réelle) : saisir tourne la séquence pendant le chargement ; au relâchement suivant la voiture passe en WebGL sous la main ; l'élévation répond ; au relâchement l'inertie décroît, l'élévation revient, la 2D reprend sur l'image posée ; le scroll continue de tourner à partir de l'angle laissé. Curseur `grab` sur pixel opaque seulement. Un clic sec ne télécharge rien (onglet réseau).

- [ ] **Step 10 : commit**

```bash
git add components/proto/voiture.tsx app/planche.css
git commit -m "La voiture se saisit — la séquence pendant le chargement, le WebGL à la prise suivante, et l'angle de la main persiste"
```

---

### Tâche 10 : les gates réseau et bundle

**Files:**
- Create: `tools/voiture/reseau.mjs`

- [ ] **Step 1 : écrire `tools/voiture/reseau.mjs`**

```js
/* ==================================================================
   GATE RÉSEAU (#12) — le visiteur qui ne drague pas ne paie RIEN.
   Rechargement + défilement complet sans drag : zéro requête vers le
   chunk du régime drag et le .glb. Sous --reduce : le montage ne
   charge qu'UNE image de la séquence (voiture.tsx, veille).
   usage : node tools/voiture/reseau.mjs <url> [--tete] [--reduce]
   ================================================================== */
import { lanceChrome, attends, pause } from "../chrome.mjs"

const args = process.argv.slice(2)
const URL_ = args.find((a) => !a.startsWith("--"))
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => {
  const [k, v] = a.slice(2).split("=")
  return [k, v === undefined ? "1" : v]
}))
if (!URL_) {
  console.error("usage: node tools/voiture/reseau.mjs <url> [--tete] [--reduce]")
  process.exit(1)
}

const { cdp, ferme } = await lanceChrome({
  nom: "reseau-voiture",
  tete: !!opt.tete,
  args: ["--window-size=1440,900", "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"],
})
try {
  await cdp.envoie("Page.enable")
  await cdp.envoie("Emulation.setFocusEmulationEnabled", { enabled: true })
  /* Le tampon par défaut de l'API resource est de 250 entrées : les 160
     images le crèveraient et le relevé mentirait par omission. */
  await cdp.envoie("Page.addScriptToEvaluateOnNewDocument", {
    source: "performance.setResourceTimingBufferSize(4096)",
  })
  if (opt.reduce) {
    await cdp.envoie("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    })
  }
  await cdp.envoie("Page.navigate", { url: URL_ })
  await attends(async () => await cdp.evalue("document.readyState === 'complete'"), 30000, "chargement de " + URL_)
  await pause(2500) // hydratation, polices, veille du montage

  const avant = await cdp.evalue('performance.getEntriesByType("resource").length')

  if (!opt.reduce) {
    /* Défilement complet à la molette — Lenis n'écoute que ça. */
    const h = await cdp.evalue("Math.max(0, document.documentElement.scrollHeight - innerHeight)")
    const pas = Math.max(1, Math.min(500, Math.ceil(h / 120)))
    for (const sens of [1, -1]) {
      for (let i = 0; i < pas; i++) {
        await cdp.envoie("Input.dispatchMouseEvent", {
          type: "mouseWheel", x: 720, y: 450, deltaX: 0, deltaY: sens * 120, button: "none", modifiers: 0,
        })
        await pause(8)
      }
      await pause(600)
    }
    await pause(1000)
  }

  const toutes = JSON.parse(await cdp.evalue(
    'JSON.stringify(performance.getEntriesByType("resource").map((e) => e.name))'
  ))
  const nouvelles = toutes.slice(avant)
  const glb = toutes.filter((u) => u.includes(".glb"))
  const chunks = nouvelles.filter((u) => /\/_next\/.*\.js/.test(u))
  const sequence = toutes.filter((u) => /\/voiture\/\d{3}\.webp/.test(u))

  let echec = false
  if (glb.length) { console.log(`✗ ${glb.length} requête(s) vers le .glb sans drag — ${glb[0]}`); echec = true }
  else console.log("✓ zéro requête vers le .glb")
  if (opt.reduce) {
    if (sequence.length === 1) console.log("✓ sous reduce : une seule image de la séquence au montage")
    else { console.log(`✗ sous reduce : ${sequence.length} images chargées au lieu d'une`); echec = true }
  } else {
    if (chunks.length) { console.log(`✗ ${chunks.length} chunk(s) JS déclenché(s) par le défilement — ${chunks.join(", ")}`); echec = true }
    else console.log("✓ aucun chunk JS déclenché par le défilement")
    console.log(`  ${sequence.length} images de séquence, ${toutes.length} requêtes en tout`)
  }
  process.exitCode = echec ? 1 : 0
} finally {
  await ferme()
}
```

- [ ] **Step 2 : lancer les deux gates sur build de production**

```bash
npm run build && npx next start -p 3210 &
node tools/voiture/reseau.mjs http://localhost:3210/
node tools/voiture/reseau.mjs http://localhost:3210/ --reduce
```

Attendu : `✓` partout, code de sortie 0 aux deux passes. Un `✗` sur le chunk = l'import dynamique fuit (vérifier qu'aucun import statique de voiture-drag n'a été ajouté à voiture.tsx en dehors du type).

- [ ] **Step 3 : re-vérifier le First Load JS**

Comparer la sortie du build au relevé de la Tâche 6 : identique. Consigner les deux chiffres pour l'issue.

- [ ] **Step 4 : commit**

```bash
git add tools/voiture/reseau.mjs
git commit -m "Le gate réseau est un outil, pas une promesse — zéro octet sans geste, une image sous reduce"
```

---

### Tâche 11 : le banc apprend le drag — gates 1 et 3

**Files:**
- Modify: `tools/banc/frame.mjs` (fonction `drague`, branche `--drag` dans `passe()`, bilan)

- [ ] **Step 1 : la fonction `drague`** — après `defile()` :

```js
/* ── scénario drag (#12) ─────────────────────────────────────────────
   Mousedown au centre de la voiture en haut de page (fondu = 1),
   balayage en azimut sur plusieurs tours avec une sinusoïde
   d'élévation — les deux axes travaillent — puis relâchement. Même
   sonde, même unité que le défilement. L'injection CDP ne traverse
   pas le compositeur comme une vraie souris (#11) : le POURCENTAGE
   au-dessus du seuil à plancher égal reste comparable, la cadence
   présentée non. */
async function drague(cdp, mesurer = true) {
  const cx = LARGEUR / 2, cy = HAUTEUR / 2
  const souris = (type, x, y, extra = {}) => cdp.envoie("Input.dispatchMouseEvent", {
    type, x, y, button: "left", buttons: 1, clickCount: 1, ...extra,
  })
  if (mesurer) await cdp.evalue("window.__banc.demarre()")
  await souris("mousePressed", cx, cy)
  /* ~3 tours d'azimut (0,45 °/px) en crans de 8 px, l'élévation
     balayée à ±80 px, en rebondissant aux bords de la fenêtre. */
  let x = cx
  let sens = 1
  for (let i = 0; i < 300; i++) {
    x += sens * 8
    if (x > LARGEUR - 40 || x < 40) { sens = -sens; x += sens * 16 }
    await souris("mouseMoved", x, cy + Math.sin(i / 18) * 80)
    await pause(8)
  }
  await souris("mouseReleased", x, cy, { buttons: 0 })
  await pause(700) // l'inertie fait encore des frames après la main
  if (!mesurer) return null
  const { ech, duree } = await cdp.evalue("JSON.stringify(window.__banc.arrete())").then(JSON.parse)
  return { couts: ech.map((e) => e[0]), intervalles: ech.map((e) => e[1]).filter(Boolean), duree }
}
```

- [ ] **Step 2 : la branche `--drag` de `passe()`** — remplacer les deux lignes `const repos = …` / `const scroll = …` par :

```js
    await pause(1500)                       // échauffement : polices, images, hydratation
    const repos = await mesure(cdp, 1500)

    if (opt.drag) {
      /* Premier geste : l'AMORCE — déclenche le chunk et le .glb, pilote
         la séquence. Non mesurée : c'est le régime WebGL qu'on juge. */
      await drague(cdp, false)
      await attends(async () =>
        await cdp.evalue("document.querySelector('.voiture')?.dataset.regime === 'gl'"),
        30000, "promotion WebGL (le modèle ne charge pas ?)")
      await pause(500)
      const drag = await drague(cdp)        // gate 1 : pendant le drag
      const scroll = await defile(cdp)      // gate 3 : le défilement APRÈS le premier drag
      const gpu = JSON.parse(await cdp.evalue(`JSON.stringify({
        geometries: document.querySelector('.voiture')?.dataset.glGeometries ?? null,
        textures: document.querySelector('.voiture')?.dataset.glTextures ?? null,
      })`))
      console.log(`  passe ${n} — plancher ${r2(plancher)} ms${melange ? " (MÉLANGE)" : ""} · drag ${drag.couts.length} frames · scroll après drag ${scroll.couts.length} frames`)
      console.log(`            écran ${env.ecran} · ${env.webgl} · GPU ${gpu.geometries} géométries, ${gpu.textures} textures`)
      console.log(`            intervalles du plancher : ${histo}`)
      return { plancher, melange, env, repos, scroll, drag, gpu }
    }

    const scroll = await defile(cdp)
```

- [ ] **Step 3 : le bilan** — dans `main()`, après le calcul de `depassent`, ajouter :

```js
  const drags = bonnes.flatMap((b) => b.drag?.couts ?? [])
  const dragDepassent = drags.filter((c) => c > SEUIL).length
```

et dans l'objet `bilan`, avant `seuilMs` :

```js
    ...(drags.length ? {
      dragFrames: drags.length,
      dragCoutP50: pct(drags, 50),
      dragCoutP90: pct(drags, 90),
      dragPartAuDessusDuSeuilPct: (dragDepassent / drags.length) * 100,
      gpu: bonnes[0].gpu,
    } : {}),
```

et après le bloc `console.log` du bilan scroll :

```js
  if (drags.length) {
    console.log(`
  drag — coût p50 / p90   ${r2(bilan.dragCoutP50)} / ${r2(bilan.dragCoutP90)} ms
  drag — frames > ${SEUIL} ms  ${r2(bilan.dragPartAuDessusDuSeuilPct)} %   (${dragDepassent}/${drags.length})
  GPU après promotion     ${bilan.gpu.geometries} géométries · ${bilan.gpu.textures} textures
  (en mode --drag, le bloc scroll ci-dessus est le défilement APRÈS le premier drag — gate 3)`)
  }
```

- [ ] **Step 4 : usage dans l'en-tête** — ajouter `--drag` à la ligne Options du commentaire d'en-tête de frame.mjs.

- [ ] **Step 5 : la campagne des trois gates** (`--tete` obligatoire ; les fenêtres headed doivent rester au premier plan)

```bash
npm run build && npx next start -p 3210 &
node tools/banc/frame.mjs http://localhost:3210/ accueil-sans-drag --tete            # gate 2
node tools/banc/frame.mjs http://localhost:3210/ accueil-drag --tete --drag          # gates 1 et 3
```

Verdicts, dans les termes de SEUIL.md (à plancher égal entre les deux campagnes) :
1. **Gate 1** : `drag — frames > 8,3 ms` ≤ 10 %.
2. **Gate 2** : `frames > 8,3 ms` de `accueil-sans-drag` dans la bande de bruit connue (2,72–7,07 %) du témoin d'avant-chantier.
3. **Gate 3** : le bloc scroll de `accueil-drag` (défilement après premier drag) ne régresse pas au-delà de la même bande.

**Si un gate échoue** : `DRAG_LIVRE = false`, commit du relevé, le chantier se ferme sur un relevé, pas sur un regret (le site reste exactement ce qu'il est). Consigner `renderer.info` (géométries/textures) dans l'issue quoi qu'il arrive.

- [ ] **Step 6 : commit**

```bash
git add tools/banc/frame.mjs
git commit -m "Le banc apprend le drag — l'amorce puis la mesure, et le défilement d'après compte aussi"
```

---

### Tâche 12 : clôture — les chiffres sur la table de Hugo

- [ ] **Step 1 : commenter l'issue #12** avec : poids final du `.glb` (et les crans essayés), RMSE plancher/verdict, First Load JS avant/après, les trois verdicts du banc, l'empreinte GPU, et **ce qui reste à l'œil de Hugo** :
  1. les bornes d'élévation (18–42° proposées — se règlent dans `voiture.tsx` : `ELEV_MIN`/`ELEV_MAX`) ;
  2. le raccord saisie/relâchement sur build de production, écran 120 Hz (gate humain — si l'œil voit la bascule, ça ne sort pas) ;
  3. l'affordance : curseur seul (livré) ou indice écrit (décision n°4 — si oui : `dict.ts`, FR+EN) ;
  4. le test d'une minute à la vraie souris (consigné au #11) — l'injection CDP ne traverse pas le compositeur.
- [ ] **Step 2 : mettre à jour la mémoire** (`chantiers-arbitrages-en-attente.md`) : #12 implémenté en attente des réglages à l'œil ; #13 et #4 toujours ouverts.
- [ ] **Step 3 : ne PAS fermer l'issue** — elle se ferme après le gate humain de Hugo.

---

## Auto-revue (faite à l'écriture du plan)

- **Couverture du spec** : §1 deux toiles → T9 ; §2 déclencheur + affordance + mode séquence → T9 ; §3 protocole/réconciliation → T7+T9 ; §4 studio unique + cadre consigné → T1+T2+T8 ; §5 glb optimisé/vérifié/committé → T3+T4+T5 ; §6 reduce → T9 (+gate T10) ; §7 bundle → T6+T8+T10 ; §8 banc → T11 ; vigilances (pointer-events, clavier assumé, contextlost, un seul contexte, teintes, chaînes, pas de git add -A) → T9 et contraintes globales.
- **Types cohérents** : `SceneDrag` (T8) consommé tel quel en T9 ; `geste.mjs` (T7) appelé avec `{nb, pose, tours}` en T9 ; `CADRE` consigné T1→T8 ; data-attributes T9→T11.
- **Pas de placeholders** : les seuls `X` sont des MESURES à venir (poids, RMSE, cadre), pas du code à inventer.
