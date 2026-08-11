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
const { projets } = await jiti.import("../../components/proto/projets.ts")

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

/* --- fidélité à la source, champ par champ : chapitres.ts est une MISE
   EN SCÈNE de projets.ts, pas un fork. Tant que les deux modules
   coexistent (phases 2-3 du spec /parcours, potentiellement plusieurs
   semaines), une retouche d'un côté qui ne se répercute pas de l'autre
   viole en silence l'invariant n°1 du spec (« un univers met en scène
   le contenu, il ne le fork jamais »). Ce bloc MEURT en phase 4, quand
   projets.ts perd ses formations et que chapitres.ts devient la seule
   source : il sera alors SUPPRIMÉ, pas contourné. `seuil` et `numero`
   restent hors contrôle — chair propre à chapitres.ts, sans équivalent
   dans une fiche projet. */
const CORRESPONDANCE = [
  ["slug", "ancre"],
  ["nom", "nom"],
  ["sousTitre", "intitule"],
  ["jp", "jp"],
  ["cadre", "cadre"],
  ["periode", "periode"],
  ["etat", "etat"],
  ["contexte", "contexte"],
]

const direListe = (lang, ancre, nomChapitre, nomProjet, listeChapitre, listeProjet) => {
  dire(
    listeChapitre.length === listeProjet.length,
    `${lang}/${ancre} : ${nomChapitre} au même compte que ${nomProjet}`,
    `${listeChapitre.length} / ${listeProjet.length}`,
  )
  for (let i = 0; i < Math.max(listeChapitre.length, listeProjet.length); i++) {
    dire(listeChapitre[i] === listeProjet[i], `${lang}/${ancre} : ${nomChapitre}[${i}] fidèle à ${nomProjet}[${i}]`)
  }
}

for (const [lang, chapitresLang] of [["fr", fr], ["en", en]]) {
  const formations = projets(lang).filter((p) => p.genre === "formation")
  dire(
    formations.length === chapitresLang.length,
    `${lang} : formations de projets.ts au même compte que chapitres.ts`,
    `${formations.length} / ${chapitresLang.length}`,
  )
  for (const ancre of ANCRES) {
    const p = formations.find((f) => f.slug === ancre)
    const c = chapitresLang.find((ch) => ch.ancre === ancre)
    if (!p || !c) {
      dire(false, `${lang}/${ancre} : formation et chapitre trouvés des deux côtés`, `projet ${p ? "OK" : "absent"} / chapitre ${c ? "OK" : "absent"}`)
      continue
    }
    for (const [champProjet, champChapitre] of CORRESPONDANCE) {
      dire(
        p[champProjet] === c[champChapitre],
        `${lang}/${ancre} : ${champChapitre} fidèle à projets.${champProjet}`,
        `${JSON.stringify(c[champChapitre])} / ${JSON.stringify(p[champProjet])}`,
      )
    }
    direListe(lang, ancre, "programme", "contraintes", c.programme, p.contraintes)
    direListe(
      lang, ancre, "travaux[].titre", "decisions[].titre",
      c.travaux.map((t) => t.titre), p.decisions.map((d) => d.titre),
    )
    direListe(
      lang, ancre, "travaux[].texte", "decisions[].texte",
      c.travaux.map((t) => t.texte), p.decisions.map((d) => d.texte),
    )
    direListe(lang, ancre, "competences", "parc", c.competences, p.parc)
    dire(Boolean(c.resultat) === Boolean(p.resultat), `${lang}/${ancre} : resultat présent des deux côtés ou d'aucun`)
    if (c.resultat || p.resultat) {
      dire(c.resultat === p.resultat, `${lang}/${ancre} : resultat fidèle à projets.resultat`)
    }
  }
}

process.exit(echecs ? 1 : 0)
