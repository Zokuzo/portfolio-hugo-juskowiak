/* Dessine les deux pièces de PIXEL ART du monde MAISON (#37, retour de
   gate « la fleur de cerisier est ignoble, pixelise-la ») et écrit la
   source de vérité `components/y2k/pixel-art.ts`.

   Pourquoi un outil et pas un fichier peint à la main : une branche et
   une skyline sont des GESTES (une polyligne épaissie, une suite de
   hauteurs, un semis de fenêtres allumées) — les décrire est plus court
   et plus modifiable que de taper 50 lignes de 72 caractères, et le
   rendu reste DÉTERMINISTE (aucune valeur tirée au sort : une skyline
   qui change à chaque build n'est pas de l'art, c'est du bruit).

   Les références sont le feed Pinterest de Hugo, moissonné le
   2026-08-27 : branche sombre à marches franches et fleurs à lobes avec
   cœur clair (« Pixel by Number »), étincelles et pétales qui tombent
   (« PT »), chambres de nuit à fenêtre sur la ville.

   Usage: node tools/pixel/dessine.mjs [--apercu <dossier>]
   `--apercu` écrit en plus deux PPM à l'échelle 10 pour juger à l'œil. */
import { writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const apercu = process.argv.includes("--apercu")
  ? process.argv[process.argv.indexOf("--apercu") + 1]
  : null

/* ------------------------------------------------------------------ */
/* La toile : une grille de caractères, un caractère par pixel.        */

const toile = (l, h) => {
  const g = Array.from({ length: h }, () => Array(l).fill("."))
  const pose = (x, y, c) => {
    if (x >= 0 && x < l && y >= 0 && y < h) g[y][x] = c
  }
  return {
    g,
    l,
    h,
    pose,
    rect(x0, y0, w, ht, c) {
      for (let y = y0; y < y0 + ht; y++) for (let x = x0; x < x0 + w; x++) pose(x, y, c)
    },
    /* polyligne épaissie — les marches franches SONT le style : aucun
       lissage, l'arrondi se fait à l'œil du lecteur */
    trait(x0, y0, x1, y1, ep, c) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
      for (let i = 0; i <= n; i++) {
        const x = Math.round(x0 + ((x1 - x0) * i) / n)
        const y = Math.round(y0 + ((y1 - y0) * i) / n)
        for (let e = 0; e < ep; e++) pose(x, y + e, c)
      }
    },
    sprite(sx, sy, art) {
      art.forEach((ligne, dy) =>
        [...ligne].forEach((c, dx) => {
          if (c !== ".") pose(sx + dx, sy + dy, c)
        }),
      )
    },
    lignes: () => g.map((r) => r.join("")),
  }
}

/* Les sprites communs aux deux pièces : la fleur à quatre lobes et cœur
   clair, le bouton, l'étincelle. */
const FLEUR = [".P.P.", "PpppP", ".pyp.", "PpppP", ".P.P."]
const BOUTON = [".p.", "pPp", ".p."]
const ETINCELLE = [".s.", "sss", ".s."]

/* ------------------------------------------------------------------ */
/* 1. LA BRANCHE DE CERISIER — l'ornement du hero « boot » de /home.   */

function sakura() {
  /* UNE BANDE PLATE, PAS UNE DIAGONALE PLONGEANTE. Le premier dessin
     faisait 60×42 et descendait en travers du cadre : à 390px de large,
     ses fleurs passaient derrière la ligne de démarrage et cassaient la
     lecture (relevé à l'œil au 2e retour de gate — aucune sonde ne peut
     l'attraper, l'ornement est muet et n'est pas un bloc texte).
     En 64×24, la branche tient dans un BANDEAU d'angle : sa hauteur
     rendue reste sous le retrait haut du bloc à toutes les largeurs,
     et le texte n'a plus jamais de pétale derrière lui.
     C'est aussi la proportion des références (~2:1, « Pixel by Number »). */
  const t = toile(64, 24)
  /* le tronc entre par le coin haut-droit et court vers la gauche en
     pente douce, en s'affinant : il doit se lire D'ABORD, les fleurs se
     posent à côté */
  t.trait(63, 2, 50, 5, 3, "b")
  t.trait(50, 5, 37, 8, 3, "b")
  t.trait(37, 8, 24, 11, 2, "b")
  t.trait(24, 11, 12, 14, 2, "b")
  t.trait(12, 14, 2, 17, 2, "b")
  /* quatre fourches COURTES — des départs, pas des bâtons */
  t.trait(46, 6, 43, 2, 2, "b")
  t.trait(31, 9, 34, 14, 2, "b")
  t.trait(19, 12, 21, 17, 2, "b")
  t.trait(8, 15, 5, 11, 2, "b")
  /* l'arête claire sur le dessus du tronc : le volume, en une passe */
  t.trait(63, 2, 50, 5, 1, "B")
  t.trait(50, 5, 37, 8, 1, "B")
  t.trait(37, 8, 24, 11, 1, "B")

  /* les fleurs en grappes le long du tronc, décalées de 2-3px pour ne
     pas le sectionner ; deux ou trois le chevauchent, comme en vrai */
  for (const [x, y] of [
    [58, 0], [53, 6], [47, 1], [44, 8], [39, 4], [36, 11], [32, 5], [28, 12],
    [24, 6], [21, 13], [16, 9], [12, 16], [7, 11], [2, 18],
  ])
    t.sprite(x, y, FLEUR)
  for (const [x, y] of [[61, 7], [50, 11], [42, 14], [34, 2], [26, 17], [18, 5], [10, 8], [6, 17]])
    t.sprite(x, y, BOUTON)
  /* peu d'étincelles, et loin des fleurs : elles ponctuent */
  for (const [x, y] of [[56, 12], [30, 19], [14, 2]]) t.sprite(x, y, ETINCELLE)
  /* les pétales qui tombent */
  for (const [x, y] of [[48, 17], [40, 20], [33, 22], [23, 21], [15, 22], [9, 21], [54, 19], [60, 15]]) {
    t.pose(x, y, "P")
    t.pose(x + 1, y, "p")
  }
  return t.lignes()
}

/* ------------------------------------------------------------------ */
/* 2. LA FENÊTRE — le hero « fenêtre » : un PANNEAU autonome (châssis   */
/*    et vue). Le mur, l'appui et le bureau sont du CSS.               */

function fenetre() {
  const t = toile(72, 50)
  /* le ciel en BANDES FRANCHES : un dégradé lissé n'est pas du pixel */
  for (const [y, h, c] of [[0, 6, "5"], [6, 5, "4"], [11, 5, "3"], [16, 5, "2"], [21, 5, "1"], [26, 4, "0"]])
    t.rect(0, y, t.l, h, c)
  /* la nuit sous la traverse : les trouées entre les tours doivent lire
     la NUIT, pas des éclats de ciel rose */
  t.rect(0, 24, t.l, t.h - 24, "n")

  t.sprite(11, 6, ["..mmmm..", ".mmmmmm.", "mmmmmmmm", "mmmmmmmm", "mmmmmmmm", "mmmmmmmm", ".mmmmmm.", "..mmmm.."])

  /* LA VILLE, deux plans. Hauteurs d'une suite FIXE : de l'art, pas du
     bruit — le rendu doit être identique à chaque build. */
  let x = 0
  for (const [i, h] of [3, 7, 2, 10, 5, 8, 3, 12, 4, 6, 9, 2, 11, 5, 7, 3, 8, 4, 10, 6].entries()) {
    const w = 3 + (i % 3)
    t.rect(x, 32 - h, w, 44 - (32 - h), "c")
    x += w + 1
  }
  /* le plan proche : des hauteurs très contrastées, pour que la nuit
     passe ENTRE les tours — une skyline sans trouée est un mur noir */
  x = 1
  for (const [i, h] of [6, 1, 11, 3, 8, 14, 2, 9, 5, 12, 1, 7, 10, 4, 13].entries()) {
    const w = 4 + (i % 2)
    const haut = 36 - h
    t.rect(x, haut, w, t.h - haut, "C")
    /* les fenêtres allumées en quinconce serré : c'est ce qui fait vivre
       une skyline de nuit (le même geste que le shader de la rue 3D) */
    for (let wy = haut + 2; wy < t.h - 2; wy += 2)
      for (let wx = x + 1; wx < x + w - 1; wx += 2)
        if ((wx * 3 + wy * 5 + i * 7) % 4 !== 0) t.pose(wx, wy, (wx + wy) % 5 === 0 ? "W" : "w")
    x += w + 2
  }

  /* la branche DEHORS — même grammaire que le sakura du hero boot */
  t.trait(71, 3, 60, 8, 2, "b")
  t.trait(60, 8, 49, 13, 2, "b")
  t.trait(56, 10, 58, 17, 2, "b")
  for (const [fx, fy] of [[64, 2], [57, 10], [50, 8], [54, 16], [46, 12]]) t.sprite(fx, fy, FLEUR)

  /* LE CHÂSSIS, dessiné EN DERNIER : c'est à travers lui qu'on regarde.
     Montants, traverse, meneau — quatre carreaux. */
  const M = 3
  t.rect(0, 0, M, t.h, "F")
  t.rect(t.l - M, 0, M, t.h, "F")
  t.rect(0, 0, t.l, M, "F")
  t.rect(0, t.h - M, t.l, M, "F")
  t.rect(t.l / 2 - 1, M, 2, t.h - 2 * M, "F")
  t.rect(M, 23, t.l - 2 * M, 2, "F")
  /* l'arête éclairée, côté intérieur du châssis */
  t.rect(M - 1, M - 1, t.l - 2 * M + 2, 1, "f")
  t.rect(M - 1, M, 1, t.h - 2 * M, "f")
  t.rect(t.l - M, M, 1, t.h - 2 * M, "f")
  t.rect(M - 1, t.h - M, t.l - 2 * M + 2, 1, "f")
  return t.lignes()
}

/* ------------------------------------------------------------------ */

const SAKURA = sakura()
const FENETRE = fenetre()

const src = `/* ENGENDRÉ par \`node tools/pixel/dessine.mjs\` — NE PAS ÉDITER À LA MAIN.
   Le geste qui dessine ces grilles (polylignes, sprites, semis de
   fenêtres) vit dans l'outil ; ici ne vit que son résultat, figé et
   déterministe. Un caractère = un pixel, '.' = transparent.

   Pièces du monde MAISON (#37) : la branche de cerisier du hero « boot »
   et la fenêtre du hero « fenêtre ». Références : le feed Pinterest de
   Hugo (moisson du 2026-08-27). */

/* la palette : un caractère → une couleur. Les deux pièces la partagent
   — c'est ce qui fait qu'elles appartiennent au même monde. */
export const PALETTE: Record<string, string> = {
  b: "#2f2740", // branche
  B: "#5a4c74", // arête claire de la branche
  p: "#f58ab8", // pétale
  P: "#ffc2dc", // pétale clair
  y: "#ffe27a", // cœur
  s: "#fff3c4", // étincelle
  "0": "#f4b2ca", // ciel — l'horizon chaud
  "1": "#e294be",
  "2": "#c082c0",
  "3": "#946eba",
  "4": "#64549e",
  "5": "#383066", // ciel — le zénith
  n: "#18122e", // la nuit sous l'horizon
  m: "#fff6d6", // la lune
  c: "#342a56", // ville, plan lointain
  C: "#1c1636", // ville, plan proche
  w: "#ffd68a", // fenêtre allumée
  W: "#fff0c8", // fenêtre allumée, vive
  f: "#f2f0fd", // châssis, arête éclairée
  F: "#8278b0", // châssis
}

export const SAKURA: readonly string[] = [
${SAKURA.map((l) => `  ${JSON.stringify(l)},`).join("\n")}
]

export const FENETRE: readonly string[] = [
${FENETRE.map((l) => `  ${JSON.stringify(l)},`).join("\n")}
]
`
const sortie = path.join(RACINE, "components/y2k/pixel-art.ts")
writeFileSync(sortie, src)
console.log(`écrit ${path.relative(RACINE, sortie)} — sakura ${SAKURA[0].length}×${SAKURA.length}, fenêtre ${FENETRE[0].length}×${FENETRE.length}`)

if (apercu) {
  const PAL = {
    b: [47, 39, 64], B: [90, 76, 116], p: [245, 138, 184], P: [255, 194, 220],
    y: [255, 226, 122], s: [255, 243, 196],
    "0": [244, 178, 202], "1": [226, 148, 190], "2": [192, 130, 192],
    "3": [148, 110, 186], "4": [100, 84, 158], "5": [56, 48, 102],
    n: [24, 18, 46], m: [255, 246, 214], c: [52, 42, 86], C: [28, 22, 54],
    w: [255, 214, 138], W: [255, 240, 200], f: [242, 240, 253], F: [130, 120, 176],
  }
  const ppm = (lignes, fond) => {
    const l = lignes[0].length
    const h = lignes.length
    const E = 10
    const W = l * E
    const HH = h * E
    const buf = Buffer.alloc(W * HH * 3)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < l; x++) {
        const c = PAL[lignes[y][x]] || fond
        for (let dy = 0; dy < E; dy++)
          for (let dx = 0; dx < E; dx++) {
            const i = ((y * E + dy) * W + x * E + dx) * 3
            buf[i] = c[0]
            buf[i + 1] = c[1]
            buf[i + 2] = c[2]
          }
      }
    return Buffer.concat([Buffer.from(`P6\n${W} ${HH}\n255\n`), buf])
  }
  writeFileSync(path.join(apercu, "sakura.ppm"), ppm(SAKURA, [190, 178, 230]))
  writeFileSync(path.join(apercu, "fenetre.ppm"), ppm(FENETRE, [20, 16, 40]))
  console.log(`aperçus dans ${apercu}`)
}
