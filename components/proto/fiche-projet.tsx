"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Smooth } from "./smooth"
import { World } from "./world"
import { t, type Lang } from "./dict"
import { projet } from "./projets"

/* ==================================================================
   FICHE D'UNITÉ — /work/[slug]

   Une page projet est une ANNEXE au jeu de plans : même vocabulaire,
   même mobilier, mais elle documente un sous-ensemble et non
   l'ensemble. D'où la référence en U-0n et non en feuille 0n : ce
   n'est pas une neuvième feuille, c'est une pièce détachée.

   L'ORDRE EST CELUI D'UNE VRAIE FICHE et pas celui d'une étude de cas
   marketing : contexte, contraintes, décisions, résultat, parc. Les
   CONTRAINTES arrivent avant les DÉCISIONS parce qu'une décision ne
   veut rien dire sans ce qu'elle avait à tenir — c'est la seule chose
   qui distingue un choix d'ingénieur d'une liste de technologies.

   BUDGET DE FRAME : le décor est monté, mais la page reste en DOM plat
   et n'anime que des transforms à l'entrée.
   ================================================================== */

export function FicheProjet({ slug }: { slug: string }) {
  const [lang, setLang] = useState<Lang>("fr")
  const p = projet(lang, slug)

  // La route valide déjà le slug ; ce garde-fou couvre le cas d'une
  // fiche présente dans une langue et pas dans l'autre.
  if (!p) return null

  const monte = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.5, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] as const },
  })

  return (
    <main lang={lang}>
      <Smooth />
      <World />
      <div className="frame" aria-hidden="true">
        <span className="tick tl" />
        <span className="tick tr" />
        <span className="tick bl" />
        <span className="tick br" />
      </div>

      <article className={`fp${p.courant ? " fp-courante" : ""}`}>
        <div className="fp-rail mono mono-xs dim" aria-hidden="true">
          {p.unite} — {p.nom} — {p.cadre} — REF.0043-B / REV.2
        </div>

        <header className="fp-head">
          <div className="fp-barre">
            <Link href="/#index" className="mono mono-xs dim fp-retour">
              <span aria-hidden="true">←</span> {t(lang, "fpRetour")}
            </Link>
            <div className="fp-lang">
              <button type="button" className="mono mono-xs" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>
                FR
              </button>
              <button type="button" className="mono mono-xs" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
                EN
              </button>
            </div>
          </div>

          <p className="mono mono-sm dim fp-unite">
            <span className="fp-mark">{p.unite}</span>
            <span>{t(lang, "fpFiche")}</span>
          </p>
          <h1 className="fp-nom">{p.nom}</h1>
          <p className="jp dim fp-jp">{p.jp}</p>
          <p className="fp-soustitre">{p.sousTitre}</p>

          <dl className="fp-meta mono mono-xs">
            <div>
              <dt className="dim">{t(lang, "fpCadre")}</dt>
              <dd>{p.cadre}</dd>
            </div>
            <div>
              <dt className="dim">{t(lang, "fpPeriode")}</dt>
              <dd>{p.periode}</dd>
            </div>
            <div>
              <dt className="dim">{t(lang, "fpEtat")}</dt>
              <dd className="fp-etat">{p.etat}</dd>
            </div>
          </dl>
        </header>

        <motion.section className="fp-bloc" aria-labelledby="fp-ctx" {...monte(0)}>
          <h2 id="fp-ctx" className="mono mono-sm fp-bloc-titre">
            {t(lang, "fpContexte")}
          </h2>
          <p className="fp-prose">{p.contexte}</p>
        </motion.section>

        {/* Les contraintes AVANT les décisions : une décision ne veut
            rien dire sans ce qu'elle avait à tenir. */}
        <motion.section className="fp-bloc" aria-labelledby="fp-ctr" {...monte(1)}>
          <h2 id="fp-ctr" className="mono mono-sm fp-bloc-titre">
            {t(lang, "fpContraintes")}
          </h2>
          <ul className="fp-contraintes">
            {p.contraintes.map((c, i) => (
              <li key={c}>
                <span className="mono mono-xs dim fp-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="mono mono-sm dim-2 fp-contrainte">{c}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section className="fp-bloc" aria-labelledby="fp-dec" {...monte(2)}>
          <h2 id="fp-dec" className="mono mono-sm fp-bloc-titre">
            {t(lang, "fpDecisions")}
          </h2>
          <ol className="fp-decisions">
            {p.decisions.map((d, i) => (
              <li key={d.titre} className="fp-decision">
                <span className="mono mono-xs dim fp-num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="fp-decision-titre">{d.titre}</h3>
                  <p className="mono mono-sm dim-2 fp-decision-texte">{d.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.section>

        {p.resultat && (
          <motion.section className="fp-bloc" aria-labelledby="fp-res" {...monte(3)}>
            <h2 id="fp-res" className="mono mono-sm fp-bloc-titre">
              {t(lang, "fpResultat")}
            </h2>
            <p className="fp-prose">{p.resultat}</p>
          </motion.section>
        )}

        <motion.section className="fp-bloc" aria-labelledby="fp-parc" {...monte(4)}>
          <h2 id="fp-parc" className="mono mono-sm fp-bloc-titre">
            {t(lang, "fpParc")}
          </h2>
          <ul className="fp-parc">
            {p.parc.map((x) => (
              <li key={x} className="mono mono-xs fp-piece">
                {x}
              </li>
            ))}
          </ul>
        </motion.section>

        <footer className="fp-pied">
          <Link href="/#index" className="mono mono-sm fp-retour-bas">
            <span aria-hidden="true">←</span> {t(lang, "fpRetourDocument")}
          </Link>
        </footer>
      </article>
    </main>
  )
}
