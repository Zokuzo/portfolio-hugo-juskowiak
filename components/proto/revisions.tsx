"use client"

import { motion } from "framer-motion"
import { t, type Lang } from "./dict"

/* ==================================================================
   06 — RÉVISIONS. Le parcours en cartouche de révisions.

   TROIS FORMES ÉTAIENT DÉJÀ PRISES. La plaque porte une règle graduée
   (un axe de temps), le tracé porte un schéma, la télémétrie porte un
   tableau. Une frise chronologique aurait redit la règle ; un tableau
   aurait redit la télémétrie. Le cartouche de révisions est la
   quatrième forme du même vocabulaire, et c'est la seule qui dise
   « ceci a été MODIFIÉ », ce qui est exactement ce qu'est un parcours.

   LA COLONNE ZONE EST LA CLÉ. Un cartouche de révisions porte toujours
   la zone du plan touchée par la modification — c'est sa colonne la
   plus caractéristique. Si la machine est l'ingénieur, chaque étape
   révise une zone : socle, atelier, structure, interface, étalonnage,
   calcul, mesure, commande. C'est ce qui transforme huit lignes de CV
   en historique d'un objet qui se construit, sans rien inventer sur
   les faits eux-mêmes.

   <ol> ET NON <table> : une révision succède à une autre, elle ne
   croise pas des colonnes. L'ordre EST l'information, donc il est
   porté par le balisage et pas seulement par la mise en page.

   BUDGET DE FRAME : DOM plat, aucun plan fixe, aucun blend, aucun
   filter, aucun masque. Une seule animation de transform à l'entrée.
   ================================================================== */

export function Revisions({ lang }: { lang: Lang }) {
  const entrees = t(lang, "revEntrees") as unknown as [string, string, string, string, string, string][]
  const cols = t(lang, "revCols") as unknown as string[]

  return (
    <section className="rev" aria-labelledby="rev-titre">
      <div className="rev-rail mono mono-xs dim" aria-hidden="true">
        {t(lang, "revRail")}
      </div>

      <header className="rev-head">
        <p className="mono mono-sm dim rev-idx">{t(lang, "revIndex")}</p>
        <h2 id="rev-titre" className="rev-titre">
          {t(lang, "revTitle")}
        </h2>
        <p className="jp dim rev-jp">{t(lang, "revJp")}</p>
        <p className="mono mono-sm dim-2 rev-note">{t(lang, "revNote")}</p>
      </header>

      {/* Ligne d'en-tête décorative : chaque entrée se décrit elle-même
          au lecteur d'écran, donc ces libellés ne sont qu'un repère
          visuel de colonnes. */}
      <div className="rev-cols mono mono-xs dim" aria-hidden="true">
        {cols.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>

      <ol className="rev-liste">
        {entrees.map(([num, zone, periode, organisme, fonction, modif], i) => {
          const courante = i === entrees.length - 1
          return (
            <motion.li
              key={num}
              className={`rev-entree${courante ? " rev-courante" : ""}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.045 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Bulle de révision : convention de dessin technique. Sur
                  la révision courante l'anneau est rouge mais le chiffre
                  reste PAPIER — la lampe est à 3,962:1, elle n'écrit
                  pas. Même arbitrage que `.node.on .idx`. */}
              <span className="rev-bulle mono mono-xs" aria-hidden="true">
                {num}
              </span>
              <span className="rev-zone mono mono-xs">{zone}</span>
              <span className="rev-periode mono mono-xs dim">{periode}</span>
              <div className="rev-corps">
                <p className="rev-organisme">
                  {organisme}
                  {courante && <span className="rev-chip mono mono-xs">{t(lang, "revEnCours")}</span>}
                </p>
                <p className="mono mono-xs dim rev-fonction">{fonction}</p>
                <p className="mono mono-sm dim-2 rev-modif">{modif}</p>
              </div>
            </motion.li>
          )
        })}
      </ol>
    </section>
  )
}
