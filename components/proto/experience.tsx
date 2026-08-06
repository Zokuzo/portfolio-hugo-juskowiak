"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ViewTransition } from "react"
import { t, type Lang } from "./dict"
import { employeurs, type Employeur } from "./parcours"

/* ==================================================================
   02 — EXPÉRIENCE. Les projets, groupés par employeur.

   POURQUOI PAR EMPLOYEUR ET NON PAR PROJET : un projet seul ne dit pas
   dans quelles conditions il a été fait. Quatre produits chez le même
   employeur sur la même base technique, ce n'est pas quatre lignes de
   CV, c'est une contrainte d'architecture — et ça ne se voit qu'en les
   regroupant.

   LE SCHÉMA D'ARBORESCENCE porte cette information : un bus vertical
   part de l'employeur, chaque produit s'y raccorde. À quatre produits
   on voit une suite ; à un seul on voit une mission. La forme dit la
   différence sans qu'on ait à l'écrire.
   ================================================================== */

/* Géométrie de l'arborescence. Une seule source : le composant et le
   calcul de hauteur doivent rester d'accord, sinon le viewBox coupe. */
const G = {
  busX: 26,
  stub: 34,
  boxX: 60,
  boxW: 190,
  boxH: 34,
  pas: 46,
  haut: 22,
}
const hauteur = (n: number) => G.haut + n * G.pas + 10

function Arborescence({ e }: { e: Employeur }) {
  const n = e.produits.length
  const h = hauteur(n)
  return (
    <svg viewBox={`0 0 300 ${h}`} className="xp-svg" role="img" aria-hidden="true">
      {/* bus vertical : il s'arrête au DERNIER raccordement et ne
          dépasse pas — un bus qui continue dans le vide suggère une
          suite qui n'existe pas */}
      <line className="xp-bus" x1={G.busX} y1={4} x2={G.busX} y2={G.haut + (n - 1) * G.pas} />
      {e.produits.map((p, i) => {
        const y = G.haut + i * G.pas
        return (
          <g key={p.code}>
            <line className="xp-stub" x1={G.busX} y1={y} x2={G.boxX} y2={y} />
            <rect className="xp-box" x={G.boxX} y={y - G.boxH / 2} width={G.boxW} height={G.boxH} />
            <text className="xp-t xp-t-code" x={G.boxX + 10} y={y + 3.5}>
              {p.code}
            </text>
            <text className="xp-t xp-t-nom" x={G.boxX + 34} y={y + 3.5}>
              {p.nom}
            </text>
            {/* pastille « à confirmer » : un carré vide, pas un point
                d'interrogation — on signale une lacune de documentation,
                pas un doute sur l'existence du produit */}
            {p.aConfirmer && <rect className="xp-vide" x={G.boxX + G.boxW - 16} y={y - 5} width={10} height={10} />}
          </g>
        )
      })}
    </svg>
  )
}

export function Experience({ lang }: { lang: Lang }) {
  const liste = employeurs(lang)
  // la coupure reduced-motion s'écrit ICI : le CSS n'atteint pas framer — cf. planche.css, ACCESSIBILITÉ
  const reduit = useReducedMotion()

  return (
    <section className="xp" id="experience" aria-labelledby="xp-titre">
      <div className="xp-rail mono mono-xs dim" aria-hidden="true">
        {t(lang, "xpRail")}
      </div>

      <header className="xp-head">
        <p className="mono mono-sm dim xp-idx">{t(lang, "xpIndex")}</p>
        <span className="f-num chrome" aria-hidden="true">
          {t(lang, "xpNum")}
        </span>
        <h2 id="xp-titre" className="xp-titre">
          {t(lang, "xpTitle")}
        </h2>
        <p className="jp dim xp-jp">{t(lang, "xpJp")}</p>
        <p className="mono mono-sm dim-2 xp-note">{t(lang, "xpNote")}</p>
      </header>

      <div className="xp-liste">
        {liste.map((e, i) => (
          <motion.article
            key={e.slug}
            className={`xp-employeur${e.courant ? " xp-courant" : ""}`}
            initial={e.produits.some((p) => p.fiche) ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={reduit ? { duration: 0 } : { duration: 0.55, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="xp-fiche">
              <header className="xp-emp-head">
                <h3 className="xp-nom">
                  {e.nom}
                  {e.courant && <span className="xp-chip mono mono-xs">{t(lang, "xpEnCours")}</span>}
                </h3>
                <p className="mono mono-xs dim xp-fonction">
                  {e.fonction}
                  {e.lieu ? ` · ${e.lieu}` : ""}
                </p>
                <p className="mono mono-xs dim xp-periode">{e.periode}</p>
              </header>
              <p className="mono mono-sm dim-2 xp-resume">{e.resume}</p>

              <ol className="xp-produits">
                {e.produits.map((p) => {
                  const ligne = (
                    <li key={p.code} className="xp-produit">
                      <span className="mono mono-xs dim xp-code">{p.code}</span>
                      <div>
                        <h4 className="xp-produit-nom">
                          {p.nom}
                          {p.aka && <span className="mono mono-xs dim xp-aka">— {p.aka}</span>}
                        </h4>
                        <p className="mono mono-sm dim-2 xp-produit-texte">{p.texte}</p>
                        {/* Le lien n apparait que si la fiche existe : un
                            renvoi vers une page vide est pire qu absence. */}
                        {p.fiche && (
                          <Link href={`/work/${p.fiche}`} className="mono mono-xs xp-fiche-lien">
                            {t(lang, "xpFiche")} <span aria-hidden="true">→</span>
                          </Link>
                        )}
                      </div>
                    </li>
                  )
                  /* Seules les lignes à fiche portent un nom de transition : nommer
                     les autres créerait des paires fantômes sans destination. */
                  return p.fiche ? (
                    <ViewTransition key={p.code} name={`fiche-${p.fiche}`} share="morph" default="none">
                      {ligne}
                    </ViewTransition>
                  ) : (
                    ligne
                  )
                })}
              </ol>

              <ul className="xp-parc">
                {e.parc.map((x) => (
                  <li key={x} className="mono mono-xs xp-piece">
                    {x}
                  </li>
                ))}
              </ul>
            </div>

            <div className="xp-schema" aria-hidden="true">
              <p className="mono mono-xs dim xp-schema-titre">{t(lang, "xpSchema")}</p>
              <Arborescence e={e} />
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
