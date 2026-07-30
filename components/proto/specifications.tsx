"use client"

import { motion } from "framer-motion"
import { t, type Lang } from "./dict"

/* ==================================================================
   05 — SPÉCIFICATIONS. La fiche de caractéristiques.

   C'est la version DÉPLIÉE de la ligne de spécification de la plaque :
   même objet, plus de détail. Ce n'est donc pas une cinquième forme,
   c'est un zoom sur la première — et un document technique a le droit
   de zoomer sur lui-même.

   POURQUOI `fiche-` ET NON `spec-` : la plaque possède déjà `.spec`
   (sa ligne de spécification, une grille de six colonnes). Nommer
   cette section `.spec` lui faisait hériter de cette grille, et
   l'en-tête se retrouvait à côté du contenu au lieu d'être au-dessus.
   C'est le même piège que la collision CSS/SVG documentée ailleurs :
   AVANT DE NOMMER UNE CLASSE, VÉRIFIER QU'ELLE N'EXISTE PAS DÉJÀ.
   Le préfixe des sections n'est pas décoratif, il est fonctionnel.

   LA COLONNE CLASSE NE CONTIENT QUE CE QUE LE CV DÉCLARE. Là où aucun
   niveau n'est annoncé, la case reste vide. Une case vide sur une
   fiche technique est une information honnête, pas un oubli — et la
   remplir demanderait d'inventer une évaluation.

   PAS DE BARRES DE COMPÉTENCE, JAMAIS. Une barre invite à lire un
   pourcentage sur une échelle de 100 % qui n'existe pas ; c'est le
   cliché n°2 du portfolio de développeur, juste après le compteur en
   néon. Une classe ÉCRITE est ce qu'un dessin technique utilise pour
   dire la même chose, et elle ne ment pas.
   ================================================================== */

export function Specifications({ lang }: { lang: Lang }) {
  const groupes = t(lang, "specGroupes") as unknown as [string, [string, string][]][]
  const cols = t(lang, "specCols") as unknown as string[]

  return (
    <section className="fiche" id="specifications" aria-labelledby="fiche-titre">
      <div className="fiche-rail mono mono-xs dim" aria-hidden="true">
        {t(lang, "specRail")}
      </div>

      <header className="fiche-head">
        <p className="mono mono-sm dim fiche-idx">{t(lang, "specIndex")}</p>
        <span className="f-num chrome" aria-hidden="true">
          {t(lang, "specNum")}
        </span>
        <h2 id="fiche-titre" className="fiche-titre">
          {t(lang, "specTitle")}
        </h2>
        <p className="jp dim fiche-jp">{t(lang, "specJp")}</p>
        <p className="mono mono-sm dim-2 fiche-note">{t(lang, "specNote")}</p>
      </header>

      <div className="fiche-grille">
        {groupes.map(([groupe, lignes], g) => (
          <motion.section
            key={groupe}
            className="fiche-groupe"
            aria-label={groupe}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.05 * g, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="mono mono-sm fiche-groupe-titre">{groupe}</h3>
            <div className="mono mono-xs dim fiche-cols" aria-hidden="true">
              <span>{cols[0]}</span>
              <span>{cols[1]}</span>
            </div>
            <dl className="fiche-lignes">
              {lignes.map(([designation, classe]) => (
                <div key={designation} className="fiche-ligne">
                  <dt className="fiche-designation">{designation}</dt>
                  {/* Case non renseignée : un tiret, pas un blanc. Un
                      blanc se lirait comme un défaut de rendu ; un
                      tiret se lit comme « non renseigné », ce qui est
                      exactement l'information. */}
                  <dd className={`mono mono-xs fiche-classe${classe ? "" : " fiche-vide"}`}>{classe || "—"}</dd>
                </div>
              ))}
            </dl>
          </motion.section>
        ))}
      </div>
    </section>
  )
}
