"use client"

import { motion } from "framer-motion"
import { t, type Lang } from "./dict"
import { etudes } from "./parcours"

/* ==================================================================
   03 — ÉTUDES. Le parcours en rails parallèles.

   POURQUOI UN SCHÉMA ET PAS UNE LISTE. Un double diplôme n'est pas
   « deux diplômes » : c'est deux cursus menés EN MÊME TEMPS. Écrit en
   liste, ESTIA et MBDS se lisent l'un après l'autre et l'information
   disparaît. Dessinés en deux rails, la période de septembre 2024 à
   octobre 2025 se voit d'un coup — c'est la seule chose que ce schéma
   a à dire, et il la dit sans légende.

   Hokkaido est une EXCURSION : le trait quitte le rail principal et y
   revient. Un semestre à l'étranger n'est pas une étape de plus dans
   une file, c'est un détour dont on rentre.

   La cote sous la zone parallèle est la seule affirmation chiffrée du
   schéma, et elle est vérifiable : 2024.09 → 2025.10.
   ================================================================== */

const A0 = 2020.5
const A1 = 2026.2
const X0 = 70
const LARGEUR = 850
const x = (a: number) => X0 + ((a - A0) / (A1 - A0)) * LARGEUR

const Y_EXC = 52
const Y_R0 = 112
const Y_R1 = 158
const Y_COTE = 198
const Y_AXE = 226
const H = 18

const ANNEES = [2021, 2022, 2023, 2024, 2025, 2026]

export function Etudes({ lang }: { lang: Lang }) {
  const liste = etudes(lang)
  const principal = liste.filter((e) => e.rail === 0 && !e.excursion)
  const second = liste.filter((e) => e.rail === 1)
  const excursions = liste.filter((e) => e.excursion)

  /* La zone de recouvrement se CALCULE, elle n'est pas écrite : si une
     date change dans parcours.ts, la cote suit. */
  const chevauchement = second.length
    ? { debut: Math.max(second[0].debut, principal[principal.length - 1].debut), fin: Math.min(second[0].fin, principal[principal.length - 1].fin) }
    : null

  return (
    <section className="etu" id="etudes" aria-labelledby="etu-titre">
      <div className="etu-rail mono mono-xs dim" aria-hidden="true">
        {t(lang, "etuRail")}
      </div>

      <header className="etu-head">
        <p className="mono mono-sm dim etu-idx">{t(lang, "etuIndex")}</p>
        <span className="f-num chrome" aria-hidden="true">
          {t(lang, "etuNum")}
        </span>
        <h2 id="etu-titre" className="etu-titre">
          {t(lang, "etuTitle")}
        </h2>
        <p className="jp dim etu-jp">{t(lang, "etuJp")}</p>
        <p className="mono mono-sm dim-2 etu-note">{t(lang, "etuNote")}</p>
      </header>

      {/* Le schéma est aria-hidden : la liste qui suit porte la même
          information sous forme lisible par un lecteur d'écran. */}
      <motion.div
        className="etu-schema"
        aria-hidden="true"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <svg viewBox="0 0 960 250" className="etu-svg" role="img">
          {/* graduations d'année, sous tout le reste */}
          {ANNEES.map((a) => (
            <g key={a}>
              <line className="etu-grad" x1={x(a)} y1={30} x2={x(a)} y2={Y_AXE} />
              <text className="etu-t etu-t-annee" x={x(a)} y={Y_AXE + 14}>
                {a}
              </text>
            </g>
          ))}
          <line className="etu-axe" x1={X0 - 10} y1={Y_AXE} x2={x(A1)} y2={Y_AXE} />

          {/* rail principal */}
          {principal.map((e) => (
            <g key={e.code}>
              <rect className="etu-barre" x={x(e.debut)} y={Y_R0 - H / 2} width={x(e.fin) - x(e.debut)} height={H} />
              <text className="etu-t etu-t-nom" x={x(e.debut) + 6} y={Y_R0 - H / 2 - 7}>
                {e.nom}
              </text>
            </g>
          ))}

          {/* excursion : elle QUITTE le rail et y revient */}
          {excursions.map((e) => (
            <g key={e.code}>
              <path
                className="etu-detour"
                d={`M${x(e.debut) - 16} ${Y_R0 - H / 2} L${x(e.debut)} ${Y_EXC + H} M${x(e.fin)} ${Y_EXC + H} L${x(e.fin) + 16} ${Y_R0 - H / 2}`}
              />
              <rect className="etu-barre etu-barre-exc" x={x(e.debut)} y={Y_EXC} width={x(e.fin) - x(e.debut)} height={H} />
              <text className="etu-t etu-t-nom" x={x(e.debut) + 6} y={Y_EXC - 7}>
                {e.nom}
              </text>
            </g>
          ))}

          {/* second rail — le double diplôme */}
          {second.map((e) => (
            <g key={e.code}>
              <rect className="etu-barre etu-barre-2" x={x(e.debut)} y={Y_R1 - H / 2} width={x(e.fin) - x(e.debut)} height={H} />
              {/* Étiquette AU-DESSUS de la barre, comme sur le rail
                  principal. En dessous, elle tombait sur le libellé de
                  cote : deux textes à 10px d'écart, illisibles. */}
              <text className="etu-t etu-t-nom" x={x(e.debut) + 6} y={Y_R1 - H / 2 - 7}>
                {e.nom}
              </text>
            </g>
          ))}

          {/* LA COTE : la seule affirmation chiffrée du schéma. Elle
              mesure exactement ce que le double diplôme veut dire. */}
          {chevauchement && (
            <g>
              <line className="etu-attache" x1={x(chevauchement.debut)} y1={Y_R1 + H / 2} x2={x(chevauchement.debut)} y2={Y_COTE + 6} />
              <line className="etu-attache" x1={x(chevauchement.fin)} y1={Y_R1 + H / 2} x2={x(chevauchement.fin)} y2={Y_COTE + 6} />
              <line className="etu-cote" x1={x(chevauchement.debut)} y1={Y_COTE} x2={x(chevauchement.fin)} y2={Y_COTE} />
              <path className="etu-cote-f" d={`M${x(chevauchement.debut)} ${Y_COTE} l7 -2.5 l0 5 z`} />
              <path className="etu-cote-f" d={`M${x(chevauchement.fin)} ${Y_COTE} l-7 -2.5 l0 5 z`} />
              <text className="etu-t etu-t-cote" x={(x(chevauchement.debut) + x(chevauchement.fin)) / 2} y={Y_COTE - 7}>
                {t(lang, "etuDouble")}
              </text>
            </g>
          )}
        </svg>
      </motion.div>

      <ol className="etu-liste">
        {liste
          .slice()
          .sort((a, b) => a.debut - b.debut)
          .map((e, i) => (
            <motion.li
              key={e.code}
              className="etu-entree"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.45, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="mono mono-xs dim etu-code">{e.code}</span>
              <div>
                <h3 className="etu-nom">{e.nom}</h3>
                <p className="mono mono-xs dim etu-intitule">
                  {e.intitule}
                  {e.lieu ? ` · ${e.lieu}` : ""}
                </p>
                <p className="mono mono-sm dim-2 etu-texte">{e.texte}</p>
              </div>
            </motion.li>
          ))}
      </ol>
    </section>
  )
}
