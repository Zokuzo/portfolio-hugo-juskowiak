#!/usr/bin/env node
/* LE RÉGIME DES DÉCORS — ticket #28 de la carte #15.
 *
 *   node tools/monde/regime.mjs public/prototype/decor-procedural.glb -4.4 -19
 *   node tools/monde/regime.mjs public/prototype/decor-habitacle.glb    0    0
 *
 * Les deux arguments qui suivent le fichier sont le POINT DE VUE (x, z) dans
 * le repère du GLB : la pose de la voiture. C'est de là que tout se décide.
 *
 * ── Pourquoi ce script et pas `gltf-transform optimize` ────────────────────
 *
 * Le gate #22 demande 16 → ~8 Mo sur la ville. Mesuré : ces fichiers sont DÉJÀ
 * meshopt + WebP (c'est la recette du #16), et leur poids est presque tout en
 * TEXTURES — 63 % pour la ville, 90 % pour l'habitacle. Le levier est donc la
 * DÉFINITION des textures, et un plafond uniforme est le mauvais outil : les
 * mêmes 2048² servent une bordure de trottoir à 3 m et un marbre à 70 m.
 *
 * Ici le budget de chaque texture est déduit de la DISTANCE MINIMALE, mesurée
 * sommet par sommet, entre le matériau qui la porte et le point de vue. La
 * distance est recalculée DANS CHAQUE FICHIER : depuis le siège les arbres
 * sont à 9,5 m, depuis la rue à 26 m — une liste de noms figée se tromperait
 * sur l'un des deux.
 *
 *     < 15 m   baseColor/émissif natif (≤ 2048)   normal/MR/AO ≤ 512
 *     15-40 m  baseColor ≤ 512                    normal/MR/AO ≤ 256
 *     > 40 m   baseColor ≤ 256                    normal/MR/AO ≤ 256
 *
 * La brume de la scène ferme à 25 m (`rue/scene.tsx`) : au-delà de la première
 * bande, on paie de la définition pour des surfaces déjà noyées.
 *
 * ── Ce que le script NE FAIT PAS, et pourquoi ──────────────────────────────
 *
 * Ni flatten, ni join, ni palette, ni instance, ni simplify. La recette par
 * défaut d'`optimize` a l'air inoffensive et rabote 9 % des triangles en
 * silence (`--simplify` est à `true`) ; `--prune-solid-textures` ferait, lui,
 * DISPARAÎTRE des textures unies. Le code du décor s'appuie sur des noms de
 * matériaux — `tools/gt86/verifie.mjs` les compte après coup.
 *
 * Pas de Draco non plus : il exigerait un décodeur au chargement (drei le tire
 * de gstatic.com par défaut), il décode plus lentement que meshopt sur 350 000
 * triangles, et il SOUDE la géométrie — mesuré, −5,5 % de triangles. La
 * fluidité vaut mieux que les 3 Mo qu'il ferait gagner.
 */

import { readFileSync, renameSync, statSync } from "node:fs"
import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer"
import sharp from "sharp"

/* LES INTOUCHABLES. Le shader des façades (`app/prototype/rue/decor-glb.tsx`)
   allume les fenêtres en lisant la LUMINANCE des pixels de la texture — les
   murs n'ont aucune géométrie de fenêtre, tout est peint. Redimensionner ou
   ré-encoder ce baseColor DÉPLACE ces valeurs autour du seuil de 0,055 : des
   vitres s'éteignent, ou des linteaux sombres s'allument — l'aberration en
   blocs crème que Hugo a déjà fait corriger une fois.
   Ces baseColor sont donc recopiés octet pour octet. Le reste de leurs cartes
   (normal, metallicRoughness) suit le régime : le shader ne les lit pas. */
const INTOUCHABLES = new Set(["CityGen_LR_Facades"])

const QUALITE = 82
const BANDES = { proche: 15, moyen: 40 }
const PLAFOND = {
  //            < 15 m   15-40 m   > 40 m
  couleur: [2048, 512, 256],
  autre: [512, 256, 256],
}

const [fichier, xArg, zArg] = process.argv.slice(2)
if (!fichier || xArg === undefined || zArg === undefined) {
  console.error("usage : node tools/monde/regime.mjs <fichier.glb> <vueX> <vueZ>")
  process.exit(2)
}
const VUE = [Number(xArg), Number(zArg)]

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.decoder": MeshoptDecoder,
  "meshopt.encoder": MeshoptEncoder,
})

const avant = statSync(fichier).size
const doc = await io.read(fichier)
const racine = doc.getRoot()

/* ── 1. La distance de chaque matériau au point de vue ─────────────────────
   Sommet par sommet, et dans le repère MONDE : les nœuds du GLB portent des
   transformations (l'habitacle est tourné de π et translaté), une bbox locale
   mentirait. */
const produit = (a, b) => {
  const o = new Array(16)
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      let s = 0
      for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]
      o[i * 4 + j] = s
    }
  return o
}

const distance = new Map()
const parcours = (noeud, parent) => {
  const m = produit(parent, noeud.getMatrix())
  const mesh = noeud.getMesh()
  if (mesh)
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION")
      if (!pos) continue
      const mat = prim.getMaterial()
      let mini = distance.get(mat) ?? Infinity
      const v = [0, 0, 0]
      for (let i = 0, n = pos.getCount(); i < n; i++) {
        pos.getElement(i, v)
        const x = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12]
        const z = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]
        const d = Math.hypot(x - VUE[0], z - VUE[1])
        if (d < mini) mini = d
      }
      distance.set(mat, mini)
    }
  for (const enfant of noeud.listChildren()) parcours(enfant, m)
}
const IDENTITE = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
for (const scene of racine.listScenes()) for (const n of scene.listChildren()) parcours(n, IDENTITE)

/* ── 2. Le rôle et la distance de chaque texture ───────────────────────────
   Une texture peut servir plusieurs matériaux et plusieurs emplacements : on
   retient la distance la PLUS COURTE (le plus exigeant gagne) et on la traite
   en « couleur » dès qu'un seul de ses emplacements est un baseColor ou un
   émissif — un aplat trop petit se voit, une normale trop petite non. */
const ROLES = [
  ["BaseColorTexture", true],
  ["EmissiveTexture", true],
  ["NormalTexture", false],
  ["MetallicRoughnessTexture", false],
  ["OcclusionTexture", false],
]

const usage = new Map()
for (const mat of racine.listMaterials())
  for (const [role, estCouleur] of ROLES) {
    const tex = mat[`get${role}`]?.()
    if (!tex) continue
    if (!usage.has(tex)) usage.set(tex, { couleur: false, distance: Infinity, intouchable: false, mats: new Set() })
    const u = usage.get(tex)
    u.couleur ||= estCouleur
    u.distance = Math.min(u.distance, distance.get(mat) ?? Infinity)
    u.mats.add(mat.getName())
    /* seul le baseColor d'un matériau intouchable l'est — voir INTOUCHABLES */
    if (role === "BaseColorTexture" && INTOUCHABLES.has(mat.getName())) u.intouchable = true
  }

/* ── 3. Le régime ──────────────────────────────────────────────────────────*/
const bande = (d) => (d < BANDES.proche ? 0 : d < BANDES.moyen ? 1 : 2)
const lignes = []
let texAvant = 0
let texApres = 0
let gardees = 0

for (const tex of racine.listTextures()) {
  const image = tex.getImage()
  if (!image) continue
  const [l, h] = tex.getSize()
  const u = usage.get(tex) ?? { couleur: true, distance: Infinity, intouchable: false, mats: new Set(["(orpheline)"]) }
  texAvant += image.byteLength

  if (u.intouchable) {
    texApres += image.byteLength
    gardees++
    lignes.push(fmt(u, l, h, l, h, image.byteLength, image.byteLength, "INTOUCHABLE"))
    continue
  }

  const plafond = (u.couleur ? PLAFOND.couleur : PLAFOND.autre)[bande(u.distance)]
  const cote = Math.max(l, h)
  const f = cote > plafond ? plafond / cote : 1

  let pipe = sharp(Buffer.from(image))
  if (f < 1) pipe = pipe.resize(Math.max(1, Math.round(l * f)), Math.max(1, Math.round(h * f)), { fit: "fill" })
  const sortie = await pipe.webp({ quality: QUALITE, effort: 6 }).toBuffer()

  /* Une texture déjà mieux compressée que ce qu'on produit est LAISSÉE telle
     quelle : le régime ne doit jamais faire grossir un fichier. */
  const gagne = sortie.byteLength < image.byteLength
  if (gagne) {
    tex.setImage(new Uint8Array(sortie))
    tex.setMimeType("image/webp")
  }
  const fin = gagne ? sortie.byteLength : image.byteLength
  texApres += fin
  lignes.push(fmt(u, l, h, gagne ? Math.round(l * f) : l, gagne ? Math.round(h * f) : h, image.byteLength, fin, ""))
}

function fmt(u, l0, h0, l1, h1, o0, o1, note) {
  const d = u.distance === Infinity ? "  ∞" : u.distance.toFixed(1)
  return [
    `${d.padStart(7)} m`,
    `${`${l0}×${h0}`.padStart(10)} → ${`${l1}×${h1}`.padEnd(10)}`,
    `${(o0 / 1024).toFixed(0).padStart(6)} Ko →${(o1 / 1024).toFixed(0).padStart(6)} Ko`,
    note.padEnd(12),
    [...u.mats].join(", "),
  ].join("  ")
}

/* ── 4. Écriture ───────────────────────────────────────────────────────────
   Par un fichier temporaire puis renommage : une écriture interrompue ne doit
   pas laisser un décor à moitié écrit dans `public/`.

   Le provisoire DOIT finir en `.glb` : NodeIO choisit son format d'après
   l'extension du chemin, et tout autre suffixe produit un `.gltf` JSON qui
   éparpille ses 70 binaires à côté (payé une fois — 71 fichiers à ramasser
   dans public/). Garde-fou en plus du nom : le binaire commence par `glTF`. */
const provisoire = `${fichier}.regime.glb`
await io.write(provisoire, doc)
const entete = statSync(provisoire).size >= 4 && readFileSync(provisoire).subarray(0, 4).toString() === "glTF"
if (!entete) {
  console.error(`écriture non binaire (${provisoire} ne commence pas par glTF) — fichier d'origine intact`)
  process.exit(1)
}
renameSync(provisoire, fichier)
const apres = statSync(fichier).size

console.log(lignes.sort().join("\n"))
console.log(
  `\n${fichier}\n  vue (${VUE[0]}, ${VUE[1]})` +
    (gardees ? `  ·  ${gardees} texture(s) intouchable(s)` : "") +
    `\n  textures ${(texAvant / 1e6).toFixed(2)} → ${(texApres / 1e6).toFixed(2)} Mo` +
    `\n  fichier  ${(avant / 1e6).toFixed(2)} → ${(apres / 1e6).toFixed(2)} Mo` +
    `  (${(((apres - avant) / avant) * 100).toFixed(0)} %)`,
)
