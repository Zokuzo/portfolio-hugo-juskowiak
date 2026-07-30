"use client"

import { motion } from "framer-motion"
import { t, type Lang } from "./dict"

/* ==================================================================
   06 — OPÉRATEUR. Les conditions d'emploi.

   LA SECTION LA PLUS AÉRÉE DU DOCUMENT, et c'est structurel. Cinq
   feuilles denses d'affilée fatiguent, et l'humain derrière la machine
   ne se raconte pas dans un tableau. Si on densifie cette section
   « pour l'harmoniser », le document perd sa respiration juste avant
   sa signature.

   Le texte est en display, pas en mono : c'est le seul endroit du
   document où quelqu'un PARLE. Partout ailleurs c'est un plan qui
   énonce.
   ================================================================== */

export function Operateur({ lang }: { lang: Lang }) {
  const champs = t(lang, "opChamps") as unknown as [string, string][]

  return (
    <section className="op" id="operateur" aria-labelledby="op-titre">
      <div className="op-rail mono mono-xs dim" aria-hidden="true">
        {t(lang, "opRail")}
      </div>

      <header className="op-head">
        <p className="mono mono-sm dim op-idx">{t(lang, "opIndex")}</p>
        <h2 id="op-titre" className="op-titre">
          {t(lang, "opTitle")}
        </h2>
        <p className="jp dim op-jp">{t(lang, "opJp")}</p>
      </header>

      {/* Déclaration à gauche, conditions à droite : la feuille respire
          par son interligne et sa mesure, pas par un vide horizontal. */}
      <div className="op-bloc">
        <motion.div
          className="op-corps"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="op-texte">{t(lang, "opCorps")}</p>
          {/* La chute porte le seul rapprochement du document entre le
              hors-travail et le métier. Elle est en retrait et non en
              gras : une idée juste n'a pas besoin d'être criée, et la
              crier ferait de la citation motivante. */}
          <p className="op-chute">{t(lang, "opChute")}</p>
        </motion.div>

        <dl className="op-champs">
          {champs.map(([cle, valeur], i) => (
            <motion.div
              key={cle}
              className="op-champ"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.45, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              <dt className="mono mono-xs dim">{cle}</dt>
              <dd className="mono mono-sm op-valeur">{valeur}</dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  )
}
