"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { t, type Lang } from "./dict"
import { perso, type ProjetPerso } from "./parcours"

/* ==================================================================
   04 — ATELIER. Les projets personnels.

   CHAQUE PROJET A SON SCHÉMA, et ce n'est pas de la décoration : les
   quatre ont des FORMES différentes, et c'est la forme qui dit ce que
   le projet est. Un cycle, une convergence avec vanne, un empilement,
   un tuyau. Un même gabarit répété quatre fois n'aurait rien appris.

   Un schéma générique par projet aurait été plus court à écrire et
   aurait menti : il aurait suggéré que les quatre projets sont la même
   chose sous des noms différents.
   ================================================================== */

/* Repère commun aux quatre schémas : même viewBox, donc même échelle,
   donc les formes se comparent à l'œil. */
const VB = "0 0 200 110"

/* Eternal — un CYCLE. Le travail produit du code, le code produit une
   leçon, la leçon revient dans le travail. Rien ne sort de la boucle,
   c'est tout le propos du projet. */
function SchemaCycle() {
  return (
    <svg viewBox={VB} className="at-svg" role="img" aria-hidden="true">
      <path className="at-fil" d="M40 30 H160 M170 40 V70 M160 80 H40 M30 70 V40" />
      <path className="at-fil" d="M40 30 A10 10 0 0 0 30 40 M160 30 A10 10 0 0 1 170 40 M170 70 A10 10 0 0 1 160 80 M30 70 A10 10 0 0 0 40 80" />
      <path className="at-tete" d="M104 30 l-9 -3.5 l0 7 z" />
      <rect className="at-noeud" x="22" y="20" width="42" height="20" />
      <rect className="at-noeud" x="136" y="20" width="42" height="20" />
      <rect className="at-noeud at-actif" x="79" y="70" width="42" height="20" />
      <text className="at-t" x="43" y="33.5">
        code
      </text>
      <text className="at-t" x="157" y="33.5">
        leçon
      </text>
      <text className="at-t" x="100" y="83.5">
        travail
      </text>
    </svg>
  )
}

/* Trading Agent — une CONVERGENCE avec vanne. N stratégies entrent, un
   cockpit agrège, et la vanne est fermée : le passage à l'argent réel
   est un acte séparé, pas un réglage. Le losange est le symbole
   normalisé d'une vanne — il est ici parce qu'il veut dire quelque
   chose, pas parce qu'il décore. */
function SchemaVanne() {
  return (
    <svg viewBox={VB} className="at-svg" role="img" aria-hidden="true">
      <path className="at-fil" d="M14 26 H58 M14 55 H58 M14 84 H58" />
      <rect className="at-noeud" x="58" y="34" width="52" height="42" />
      <path className="at-fil" d="M110 55 H132" />
      <path className="at-vanne" d="M132 47 L146 63 L146 47 L132 63 Z" />
      <path className="at-fil at-coupe" d="M146 55 H186" />
      <text className="at-t" x="84" y="52">
        cockpit
      </text>
      <text className="at-t" x="84" y="66">
        report
      </text>
      <text className="at-t at-t-g" x="14" y="22">
        stratégies
      </text>
      <text className="at-t at-t-d" x="186" y="47">
        réel
      </text>
    </svg>
  )
}

/* La Provence — un EMPILEMENT. Un site vitrine est une page : des
   blocs les uns sur les autres, du plus lourd au plus léger. La forme
   la plus honnête est la plus simple. */
function SchemaPile() {
  return (
    <svg viewBox={VB} className="at-svg" role="img" aria-hidden="true">
      <rect className="at-noeud at-actif" x="40" y="14" width="120" height="26" />
      <rect className="at-noeud" x="40" y="46" width="120" height="16" />
      <rect className="at-noeud" x="40" y="68" width="56" height="16" />
      <rect className="at-noeud" x="104" y="68" width="56" height="16" />
      <rect className="at-noeud" x="40" y="90" width="120" height="10" />
      <line className="at-cote" x1="30" y1="14" x2="30" y2="100" />
    </svg>
  )
}

/* Bot de candidature — un TUYAU. Une file entre, un filtre écarte, un
   envoi sort. Le triangle est le symbole du filtre. */
function SchemaTuyau() {
  return (
    <svg viewBox={VB} className="at-svg" role="img" aria-hidden="true">
      <path className="at-fil" d="M14 55 H44 M76 55 H108 M140 55 H186" />
      <rect className="at-noeud" x="44" y="40" width="32" height="30" />
      <path className="at-filtre" d="M108 38 H140 L128 55 V72 H120 V55 Z" />
      <rect className="at-noeud at-actif" x="150" y="40" width="36" height="30" />
      <path className="at-tete" d="M108 55 l-9 -3.5 l0 7 z" />
      <path className="at-tete" d="M186 55 l-9 -3.5 l0 7 z" />
      <text className="at-t" x="60" y="58.5">
        file
      </text>
      <text className="at-t" x="168" y="58.5">
        envoi
      </text>
    </svg>
  )
}

const SCHEMAS: Record<string, () => React.JSX.Element> = {
  A1: SchemaCycle,
  A2: SchemaVanne,
  A3: SchemaPile,
  A4: SchemaTuyau,
}

export function Atelier({ lang }: { lang: Lang }) {
  const liste = perso(lang)

  return (
    <section className="at" id="atelier" aria-labelledby="at-titre">
      <div className="at-rail mono mono-xs dim" aria-hidden="true">
        {t(lang, "atRail")}
      </div>

      <header className="at-head">
        <p className="mono mono-sm dim at-idx">{t(lang, "atIndex")}</p>
        <span className="f-num chrome" aria-hidden="true">
          {t(lang, "atNum")}
        </span>
        <h2 id="at-titre" className="at-titre">
          {t(lang, "atTitle")}
        </h2>
        <p className="jp dim at-jp">{t(lang, "atJp")}</p>
        <p className="mono mono-sm dim-2 at-note">{t(lang, "atNote")}</p>
      </header>

      <div className="at-grille">
        {liste.map((p: ProjetPerso, i) => {
          const Schema = SCHEMAS[p.code]
          return (
            <motion.article
              key={p.code}
              className="at-projet"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="at-cadre">{Schema && <Schema />}</div>

              <div className="at-corps">
                <p className="at-ligne-code mono mono-xs dim">
                  <span className="at-code">{p.code}</span>
                  <span className="at-etat">{p.etat}</span>
                </p>
                <h3 className="at-nom">{p.nom}</h3>
                <p className="mono mono-xs dim at-intitule">{p.intitule}</p>
                <p className="mono mono-sm dim-2 at-texte">{p.texte}</p>

                {p.fiche && (
                  <Link href={`/work/${p.fiche}`} className="mono mono-xs at-fiche-lien">
                    {t(lang, "xpFiche")} <span aria-hidden="true">→</span>
                  </Link>
                )}

                {p.liens && (
                  <ul className="at-liens">
                    {p.liens.map((l) => (
                      <li key={l.url}>
                        <a className="mono mono-xs at-lien" href={l.url} target="_blank" rel="noreferrer noopener">
                          {l.role}
                          <span aria-hidden="true"> ↗</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Un projet sans dépôt public le DIT, au lieu de laisser
                    croire qu'on a oublié le lien. */}
                {!p.liens && <p className="mono mono-xs dim at-prive">{t(lang, "atPrive")}</p>}
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
