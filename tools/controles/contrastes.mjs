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

/* ── GATES DU THÈME CLAIR — tableaux §3/§5 du spec + décisions Hugo
   du 2026-08-11. [étiquette, couleur, fond, min, max] — max null :
   seuil plancher seul ; min et max serrés : une PARITÉ avec le
   sombre, tenue à ±0,05. */
const GATES = [
  ["écriture / fond (inversion pure)", INK, PAPER, 17.5, null],
  ["--sig-hot #0080e7 sur papier (non-textuel ≥ 3)", "#0080e7", PAPER, 3, null],
  ["--sig-hot sur carbone (.ref/.count, texte ≥ 4,5)", "#0080e7", INK, 4.5, null],
  ["--sig #0066b7 sur papier (texte ≥ 4,5)", "#0066b7", PAPER, 4.5, null],
  ["les deux bleus ne se touchent jamais (~1,462)", "#0066b7", "#0080e7", 1.41, 1.51],
  ["--sig-dim parité 1,491 sombre (~1,488)", "#a4ccea", PAPER, 1.44, 1.54],
  ["dim → hot (~2,366)", "#a4ccea", "#0080e7", 2.31, 2.42],
  ["--sig-ember parité 1,011 (~1,010)", "#f0efec", PAPER, 1.005, 1.06],
  ["--g-100 parité 14,218 (~14,185)", "#1e2126", PAPER, 14, 14.4],
  ["--g-300 parité 8,393 (~8,440)", "#434549", PAPER, 8.3, 8.6],
  ["--g-500 parité 5,127 (~5,126)", "#646567", PAPER, 5.05, 5.2],
  ["--g-700 filet parité 1,696 (~1,703)", "#bbbab9", PAPER, 1.65, 1.75],
  ["--g-800 parité 1,174 (~1,172)", "#e0dfdb", PAPER, 1.13, 1.22],
  ["--off parité 2,429 (~2,442)", "#9b9b9b", PAPER, 2.39, 2.49],
  ["--line composite parité 1,206", "rgba(23,27,46,0.095)", PAPER, 1.18, 1.23],
  ["--line-2 composite parité 1,522 (~1,524)", "rgba(23,27,46,0.205)", PAPER, 1.49, 1.56],
  ["--line-3 composite parité 2,642 (~2,641)", "rgba(23,27,46,0.43)", PAPER, 2.59, 2.69],
  ["--sig-rail composite (~1,446)", "rgba(0,128,231,0.30)", PAPER, 1.40, 1.50],
  ["--sig-veil composite (~1,151)", "rgba(0,102,183,0.10)", PAPER, 1.10, 1.20],
  ["arcs-t1 clair parité 1,429 (~1,426)", "rgba(23,27,46,0.175)", PAPER, 1.38, 1.48],
  ["arcs-t2 clair parité 1,307 (~1,31)", "rgba(23,27,46,0.135)", PAPER, 1.26, 1.36],
  ["focus carbone sur papier (≥ 3)", INK, PAPER, 3, null],
  ["focus carbone sur bleu vif (≥ 3)", INK, "#0080e7", 3, null],
  ["::selection papier-clair sur --sig (≥ 4,5)", PAPER, "#0066b7", 4.5, null],
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
