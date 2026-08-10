/* Contrôle des garde-fous de `components/proto/schema.tsx`, hors navigateur.
   Le contrôle du §5 mesure la géométrie RENDUE ; celui-ci mesure ce que le
   module fait des plans MAL FORMÉS, et l'unicité de l'identifiant du <title>.

   node tools/controles/garde-fous-schema.mjs
   Code de sortie 1 si une seule assertion casse. */

import { createJiti } from "jiti"
import { renderToStaticMarkup } from "react-dom/server"
import * as React from "react"

const { createElement } = React
// jiti compile le JSX en `React.createElement` (runtime classique) sans
// importer React : on le pose en global pour ce script seulement.
globalThis.React = React

const jiti = createJiti(import.meta.url, { jsx: true, interopDefault: true })
const { dessiner, Planche } = await jiti.import("../../components/proto/schema.tsx")
const { SchemaEternal } = await jiti.import("../../components/proto/schema-eternal.tsx")

let echecs = 0
const dire = (ok, quoi, detail) => {
  if (!ok) echecs++
  console.log(`${ok ? "OK  " : "FAIL"}  ${quoi}${detail ? `  →  ${detail}` : ""}`)
}

/* --- D1 : les trois cas limites doivent LEVER, pas rendre du vide --- */
const nd = (id, col, rang, n = 1) => ({ id, col, rang, lignes: Array.from({ length: n }, (_, i) => `${id}-${i}`) })

const cas = {
  "rangée vide": { noeuds: [nd("a", 0, 0), nd("b", 0, 2)], liens: [] },
  "colonne vide": { noeuds: [nd("a", 0, 0), nd("b", 2, 0)], liens: [] },
  "nœud sans lignes": { noeuds: [{ id: "a", col: 0, rang: 0, lignes: [] }], liens: [] },
}
for (const [nom, plan] of Object.entries(cas)) {
  let msg = null
  let sorti = null
  try {
    sorti = dessiner(plan).viewBox
  } catch (e) {
    msg = e.message
  }
  dire(msg !== null, `${nom} lève`, msg ?? `AUCUNE erreur, viewBox: ${sorti}`)
}

/* --- le plan bien formé continue de passer, aux mêmes chiffres qu'au §5 --- */
for (const [lang, attendu] of [
  ["fr", "-25 -39.63 917.83 509.63"],
  ["en", "-25 -39.63 943.06 509.63"],
]) {
  const html = renderToStaticMarkup(createElement(SchemaEternal, { lang }))
  const vb = html.match(/viewBox="([^"]+)"/)[1]
  dire(vb === attendu, `viewBox ${lang.toUpperCase()} inchangé`, vb)
}

/* --- D2 : deux instances du même schéma, deux identifiants distincts --- */
const page = renderToStaticMarkup(
  createElement(
    "div",
    null,
    createElement(SchemaEternal, { lang: "fr" }),
    createElement(SchemaEternal, { lang: "en" }),
  ),
)
const titres = [...page.matchAll(/<title id="([^"]+)"/g)].map((m) => m[1])
const labels = [...page.matchAll(/aria-labelledby="([^"]+)"/g)].map((m) => m[1])
dire(titres.length === 2 && new Set(titres).size === 2, "deux <title> aux id distincts", titres.join(" | "))
dire(
  labels.length === 2 && labels[0] === titres[0] && labels[1] === titres[1],
  "chaque <svg> pointe SON titre",
  labels.join(" | "),
)

/* --- la donnée change, le viewBox suit, l'accrochage ne bouge pas ---
   Les trois lignes du nœud `vue` sont remplacées par des libellés longs,
   EN MÉMOIRE (`t()` rend le tableau du dictionnaire par référence), puis
   remises. Le dépôt n'est pas touché : l'expérience se rejoue telle quelle. */
const LONGUES = [
  "monde.html — la vue trois dimensions",
  "la vue — three.js r160, scene camera renderer",
  "aucune règle métier ici : 0 setItem, 0 décision",
]
const { t } = await jiti.import("../../components/proto/dict.ts")
const rangs = t("fr", "etnNoeuds")
const iVue = rangs.findIndex((r) => r[0] === "vue")
const avant = rangs[iVue]
rangs[iVue] = ["vue", ...LONGUES]
const htmlLong = renderToStaticMarkup(createElement(SchemaEternal, { lang: "fr" }))
rangs[iVue] = avant

const vbLong = htmlLong.match(/viewBox="([^"]+)"/)[1]
/* accrochage : chaque pointe de flèche doit toucher le bord de sa boîte.
   Les <rect> et les <path> portent leurs coordonnées en clair. */
const boites = new Map(
  [...htmlLong.matchAll(/data-boite="([^"]+)"><rect[^>]*x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map(
    (m) => [m[1], { x: +m[2], y: +m[3], l: +m[4], h: +m[5] }],
  ),
)
let ecartMax = 0
let mesures = 0
for (const m of htmlLong.matchAll(/data-de="([^"]+)" data-vers="([^"]+)"><path[^>]*d="M([-\d.]+) ([-\d.]+) L([-\d.]+) ([-\d.]+)"/g)) {
  for (const [id, x, y] of [
    [m[1], +m[3], +m[4]],
    [m[2], +m[5], +m[6]],
  ]) {
    const r = boites.get(id)
    const d = Math.max(0, r.x - x, x - (r.x + r.l), r.y - y, y - (r.y + r.h))
    const dans = Math.min(x - r.x, r.x + r.l - x, y - r.y, r.y + r.h - y)
    ecartMax = Math.max(ecartMax, Math.abs(d > 0 ? d : dans))
    mesures++
  }
}
dire(Number.isFinite(+vbLong.split(" ")[2]), `viewBox FR avec libellés longs`, vbLong)
dire(mesures === 12 && ecartMax < 0.02, `accrochage inchangé (écart max)`, `${ecartMax} u sur ${mesures} extrémités`)
console.log(`libellés employés : ${JSON.stringify(LONGUES)}`)

process.exit(echecs ? 1 : 0)
