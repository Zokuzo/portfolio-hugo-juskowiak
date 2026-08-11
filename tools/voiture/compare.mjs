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
