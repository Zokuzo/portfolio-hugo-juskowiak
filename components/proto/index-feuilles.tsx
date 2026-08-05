"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { t, type Lang } from "./dict"
import { projets } from "./projets"

/* ==================================================================
   00 — INDEX. La nomenclature des feuilles.

   Un jeu de plans s'ouvre sur son index : la liste des feuilles, leur
   numéro et leur objet. C'est la feuille la plus COURTE du document et
   ça doit le rester — un index qui se lit longtemps a échoué.

   Elle sert deux fois : elle annonce ce que le document contient, et
   elle NAVIGUE. Les numéros sont des ancres réelles, pas un décor de
   sommaire ; sur un document de huit feuilles, un lecteur pressé doit
   pouvoir sauter à celle qui l'intéresse.
   ================================================================== */

export function IndexFeuilles({ lang }: { lang: Lang }) {
  const feuilles = t(lang, "idxFeuilles") as unknown as [string, string, string, string][]
  const annexes = projets(lang)

  return (
    <section className="nomen" id="index" aria-labelledby="nomen-titre">
      <header className="nomen-head">
        <p className="mono mono-sm dim nomen-idx">{t(lang, "idxIndex")}</p>
        <span className="f-num chrome" aria-hidden="true">
          {t(lang, "idxNum")}
        </span>
        <h2 id="nomen-titre" className="nomen-titre">
          {t(lang, "idxTitle")}
        </h2>
        <p className="jp dim nomen-jp">{t(lang, "idxJp")}</p>
        <p className="mono mono-sm dim-2 nomen-note">{t(lang, "idxNote")}</p>
      </header>

      <ol className="nomen-liste">
        {feuilles.map(([num, ancre, titre, objet], i) => (
          <motion.li
            key={num}
            className="nomen-feuille"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, delay: 0.035 * i, ease: [0.22, 1, 0.36, 1] }}
          >
            <a href={`#${ancre}`} className="nomen-lien">
              <span className="mono mono-xs nomen-num">{num}</span>
              <span className="nomen-nom">{titre}</span>
              <span className="mono mono-xs dim nomen-objet">{objet}</span>
              {/* Le filet de conduite : convention de sommaire imprimé.
                  Il n'est pas décoratif, il RELIE le numéro à l'objet
                  sur une ligne qui peut être longue. */}
              <span className="nomen-conduite" aria-hidden="true" />
            </a>
          </motion.li>
        ))}
      </ol>

      {/* Les fiches d'unité ne sont PAS des feuilles du jeu : ce sont
          des pièces détachées, documentées à part et référencées en
          U-0n et F-0n. Les mêler à la nomenclature ferait passer le
          document de dix à dix-neuf feuilles et casserait sa promesse
          de brièveté. */}
      <div className="nomen-annexes">
        <h3 className="mono mono-sm nomen-annexes-titre">{t(lang, "idxAnnexes")}</h3>
        <p className="mono mono-xs dim nomen-annexes-note">{t(lang, "idxAnnexesNote")}</p>
        <ul className="nomen-liste">
          {annexes.map((p, i) => (
            <motion.li
              key={p.slug}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.45, delay: 0.035 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/work/${p.slug}`} className="nomen-lien">
                <span className="mono mono-xs nomen-num">{p.unite}</span>
                <span className="nomen-nom">{p.nom}</span>
                <span className="mono mono-xs dim nomen-objet">{p.sousTitre}</span>
                <span className="nomen-conduite" aria-hidden="true" />
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
