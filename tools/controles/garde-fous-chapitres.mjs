/* Contrôle des garde-fous de `components/proto/chapitres.ts`, hors navigateur.
   La page /parcours met en scène ces enregistrements sans les vérifier :
   c'est ICI que la parité FR/EN et la solidité des ancres se prouvent —
   quatre ancres bêtes et solides, les redirections de la phase 4 viseront
   exactement ces fragments.

   node tools/controles/garde-fous-chapitres.mjs
   Code de sortie 1 si une seule assertion casse. */

import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { interopDefault: true })
const { chapitres, ANCRES } = await jiti.import("../../components/proto/chapitres.ts")

let echecs = 0
const dire = (ok, quoi, detail) => {
  if (!ok) echecs++
  console.log(`${ok ? "OK  " : "FAIL"}  ${quoi}${detail ? `  →  ${detail}` : ""}`)
}

/* --- l'OS de la page : quatre ancres, ordre chronologique d'entrée --- */
dire(
  JSON.stringify(ANCRES) === JSON.stringify(["cpge", "estia", "hokkaido", "mbds"]),
  "ANCRES = cpge, estia, hokkaido, mbds",
  ANCRES.join(", "),
)

const fr = chapitres("fr")
const en = chapitres("en")
dire(fr.length === 4 && en.length === 4, "quatre chapitres dans chaque langue", `${fr.length} FR / ${en.length} EN`)

/* --- parité FR/EN : mêmes ancres, même ordre, mêmes comptes --- */
for (let i = 0; i < 4; i++) {
  const f = fr[i]
  const e = en[i]
  dire(f.ancre === ANCRES[i] && e.ancre === ANCRES[i], `chapitre ${i} sur son ancre`, `${f.ancre} / ${e.ancre}`)
  dire(
    f.numero === e.numero && f.nom === e.nom && f.jp === e.jp && f.periode === e.periode,
    `${f.ancre} : numero/nom/jp/periode identiques FR-EN`,
  )
  dire(f.programme.length === e.programme.length, `${f.ancre} : programme au même compte`, `${f.programme.length} / ${e.programme.length}`)
  dire(f.travaux.length === e.travaux.length, `${f.ancre} : travaux au même compte`, `${f.travaux.length} / ${e.travaux.length}`)
  dire(f.competences.length === e.competences.length, `${f.ancre} : compétences au même compte`, `${f.competences.length} / ${e.competences.length}`)
  dire(Boolean(f.resultat) === Boolean(e.resultat), `${f.ancre} : resultat des deux côtés ou d'aucun`)
  for (const [chapitre, langue] of [[f, "FR"], [e, "EN"]]) {
    for (const champ of ["seuil", "contexte", "intitule", "cadre", "etat"]) {
      const v = chapitre[champ]
      dire(typeof v === "string" && v.trim().length > 0, `${f.ancre} : ${champ} ${langue} non vide`)
    }
  }
}

process.exit(echecs ? 1 : 0)
