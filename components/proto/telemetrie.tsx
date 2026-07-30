"use client"

import { motion } from "framer-motion"
import { t, type Lang } from "./dict"

/* ==================================================================
   05 — TÉLÉMÉTRIE. Le routeur multi-modèle.

   POURQUOI CE N'EST PAS UN SCHÉMA DE FLUX. La section Tracé montre
   déjà une chaîne qui se dessine au scroll ; refaire ça ici serait
   une redite, et le lecteur apprendrait deux fois la même chose. Ce
   que le routeur fait n'est pas de faire circuler, c'est d'ARBITRER —
   prendre le modèle le moins cher qui tient la tâche. Un arbitrage
   se lit comme un relevé de niveau, pas comme un flux.

   D'où la forme : un banc d'essai. Trois paliers en bandes, six voies
   qui montent chacune jusqu'à celui qu'elle exige. On voit d'un coup
   que presque tout tourne en économique et qu'une seule voie monte au
   palier lourd — c'est-à-dire où passe la facture. C'est ça, la
   démonstration d'ingénierie : pas « j'ai branché des LLM », mais
   « j'ai su lequel coûtait de l'argent et pourquoi ».

   AUCUN CHIFFRE. Pas de latence en ms, pas de coût au million de
   tokens. On ne les a pas mesurés, donc on ne les affiche pas — une
   planche technique qui invente ses cotes n'est plus une planche.
   Le palier est une carte de routage, et il est marqué À CONFIRMER
   dans dict.ts.

   BUDGET DE FRAME. Cette section n'ajoute aucun plan fixe, aucun
   mix-blend-mode, aucun filter, aucun masque. Le monde consomme déjà
   la totalité du budget par frame ; une section qui s'y ajoute doit
   être en DOM plat et n'animer que des transforms, une seule fois à
   l'entrée. Pas de scroll scrubbé ici.

   PIÈGE DU PROJET — collision CSS/SVG. Tout est préfixé `tel-`, et
   aucune règle `.tel-*` ne déclare width, height, x, y ni r.
   ================================================================== */

/* Repère du relevé. La ligne de base et les bandes ne sont pas des
   valeurs choisies : ce sont les seules cotes de cette section, donc
   elles vivent ici et nulle part ailleurs. */
const BASE = 210 // ligne de base des voies
const BANDES = [
  { haut: 170, bas: 210 }, // palier 0 — économique
  { haut: 118, bas: 170 }, // palier 1 — courant
  { haut: 56, bas: 118 }, // palier 2 — lourd
]
const X0 = 126
const PAS = 82
const LARGEUR = 16
const centre = (i: number) => (BANDES[i].haut + BANDES[i].bas) / 2

export function Telemetrie({ lang }: { lang: Lang }) {
  const voies = t(lang, "telVoies") as unknown as [string, string, string, string][]
  const paliers = t(lang, "telTiers") as unknown as [string, string][]
  const cols = t(lang, "telCols") as unknown as string[]
  const pourquoi = t(lang, "telWhy") as unknown as string[]

  return (
    <section className="tel" id="telemetrie" aria-labelledby="tel-titre">
      <div className="tel-rail mono mono-xs dim" aria-hidden="true">
        {t(lang, "telRail")}
      </div>

      <header className="tel-head">
        <p className="mono mono-sm dim tel-idx">{t(lang, "telIndex")}</p>
        {/* Le numéro en chrome : même traitement que le nom sur la
            plaque. Le chrome marque l'identité de la machine, il ne
            décore pas — c'est pour ça qu'il ne touche que des
            numéros et des noms, jamais du texte courant. */}
        <span className="f-num chrome" aria-hidden="true">
          {t(lang, "telNum")}
        </span>
        <h2 id="tel-titre" className="tel-titre">
          {t(lang, "telTitle")}
        </h2>
        <p className="jp dim tel-jp">{t(lang, "telJp")}</p>
        <p className="mono mono-sm dim-2 tel-note">{t(lang, "telNote")}</p>
      </header>

      {/* Le relevé est une ILLUSTRATION : toute son information est
          dans le tableau qui suit, donc il est masqué aux lecteurs
          d'écran plutôt que décrit par un aria-label qui mentirait
          sur sa richesse. */}
      <div className="tel-banc" aria-hidden="true">
        <svg viewBox="0 0 620 250" className="tel-svg" role="img">
          {/* Bandes de palier, et surtout LIGNE DE NIVEAU. Sans elle on
              devine le palier d'une voie au lieu de le lire : l'escalier
              de bandes est volontairement discret (il sert de lit), donc
              il ne peut pas porter seul la lecture. Le sommet de chaque
              voie se pose exactement sur la ligne de son palier, et la
              ligne porte le nom du palier à son extrémité. C'est ainsi
              qu'un banc d'essai se lit, et ça survit au niveau de gris. */}
          {BANDES.map((b, i) => (
            <g key={i}>
              <rect className={`tel-bande tel-b${i}`} x={96} y={b.haut} width={508} height={b.bas - b.haut} />
              <line className="tel-sep" x1={96} y1={b.haut} x2={604} y2={b.haut} />
              <line className="tel-niveau" x1={96} y1={centre(i)} x2={604} y2={centre(i)} />
              <text className="tel-t tel-t-palier" x={88} y={centre(i) - 3}>
                {paliers[i][0]}
              </text>
              <text className="tel-t tel-t-role" x={88} y={centre(i) + 8}>
                {paliers[i][1]}
              </text>
            </g>
          ))}

          <line className="tel-base" x1={96} y1={BASE} x2={604} y2={BASE} />

          {voies.map(([rep, , , palier], i) => {
            const p = Number(palier)
            const x = X0 + i * PAS
            const haut = centre(p)
            const lourd = p === BANDES.length - 1
            return (
              <g key={rep}>
                {/* Loi du lit : la lampe ne touche jamais le noir
                    directement. La voie lourde repose sur sa braise,
                    exactement comme l'index de la règle graduée. */}
                {lourd && <rect className="tel-lit" x={x - 3} y={haut} width={LARGEUR + 6} height={BASE - haut} />}
                <motion.rect
                  className={`tel-voie${lourd ? " tel-lourde" : ""}`}
                  x={x}
                  y={haut}
                  width={LARGEUR}
                  height={BASE - haut}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.7, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
                />
                <text className="tel-t tel-t-rep" x={x + LARGEUR / 2} y={BASE + 16}>
                  {rep}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <p className="mono mono-sm dim-2 tel-lecture">{t(lang, "telRead")}</p>

      <table className="tel-table">
        <caption className="tel-caption mono mono-xs dim">{t(lang, "telTitle")}</caption>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} scope="col" className="mono mono-xs dim">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {voies.map(([rep, nom, precision, palier], i) => (
            <tr key={rep} className={Number(palier) === BANDES.length - 1 ? "tel-tr-lourde" : undefined}>
              <td className="mono mono-xs dim">{rep}</td>
              <td>
                <span className="tel-nom">{nom}</span>
                <span className="mono mono-xs dim tel-precision">{precision}</span>
              </td>
              <td className="mono mono-xs tel-palier">{paliers[Number(palier)][0]}</td>
              <td className="mono mono-xs dim tel-motif">{pourquoi[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
