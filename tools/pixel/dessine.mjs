/* Dessine LA FENÊTRE du monde MAISON (#37) et écrit la source de
   vérité `components/y2k/pixel-art.ts`.

   La branche de cerisier autonome a vécu : son hero « boot » a perdu le
   gate du 2026-08-27 (« j'aime beaucoup la deuxième version avec la
   fenêtre »). Le cerisier n'a pas disparu pour autant — il est DEHORS,
   derrière la vitre, dessiné dans la fenêtre elle-même.

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
/* LA FENÊTRE — un PANNEAU autonome (châssis et vue). Le mur, l'appui  */
/* et le bureau sont du CSS.                                          */

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

  /* LA BRANCHE DE CERISIER, dehors — repixelisée au 2e gate d'après
     « Pixel by Number » et « PT » : marches franches, fleurs à lobes et
     cœur clair. C'est elle que Hugo voulait voir en pixels. */
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

const FENETRE = fenetre()

const src = `/* ENGENDRÉ par \`node tools/pixel/dessine.mjs\` — NE PAS ÉDITER À LA MAIN.
   Le geste qui dessine ces grilles (polylignes, sprites, semis de
   fenêtres) vit dans l'outil ; ici ne vit que son résultat, figé et
   déterministe. Un caractère = un pixel, '.' = transparent.

   La fenêtre du hero de /home, châssis compris. Références : le feed
   Pinterest de Hugo (moisson du 2026-08-27). */

/* la palette : un caractère → une couleur. La ville et le ciel ont été
   REMONTÉS d'un cran au 3e gate (« faut que ce soit un peu plus clair,
   l'ensemble ») — la vue reste une nuit, mais une nuit éclairée. */
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
  "4": "#7566b2",
  "5": "#4a4084", // ciel — le zénith
  n: "#241c46", // la nuit sous l'horizon
  m: "#fff6d6", // la lune
  c: "#463a70", // ville, plan lointain
  C: "#2a2250", // ville, plan proche
  w: "#ffd68a", // fenêtre allumée
  W: "#fff0c8", // fenêtre allumée, vive
  f: "#f2f0fd", // châssis, arête éclairée
  F: "#9c92c8", // châssis
}

export const FENETRE: readonly string[] = [
${FENETRE.map((l) => `  ${JSON.stringify(l)},`).join("\n")}
]
`
const sortie = path.join(RACINE, "components/y2k/pixel-art.ts")
writeFileSync(sortie, src)
console.log(`écrit ${path.relative(RACINE, sortie)} — fenêtre ${FENETRE[0].length}×${FENETRE.length}`)

if (apercu) {
  const PAL = {
    b: [47, 39, 64], B: [90, 76, 116], p: [245, 138, 184], P: [255, 194, 220],
    y: [255, 226, 122], s: [255, 243, 196],
    "0": [244, 178, 202], "1": [226, 148, 190], "2": [192, 130, 192],
    "3": [148, 110, 186], "4": [117, 102, 178], "5": [74, 64, 132],
    n: [36, 28, 70], m: [255, 246, 214], c: [70, 58, 112], C: [42, 34, 80],
    w: [255, 214, 138], W: [255, 240, 200], f: [242, 240, 253], F: [156, 146, 200],
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
  writeFileSync(path.join(apercu, "fenetre.ppm"), ppm(FENETRE, [20, 16, 40]))
  console.log(`aperçus dans ${apercu}`)
}
