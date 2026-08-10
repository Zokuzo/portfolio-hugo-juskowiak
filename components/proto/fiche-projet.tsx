"use client"

import { useState, ViewTransition } from "react"
import Link from "next/link"
import { useReducedMotion } from "motion/react"
import { Smooth } from "./smooth"
import { World } from "./world"
import { t, type Lang } from "./dict"
import { projet } from "./projets"
import { Bloc, type Corps } from "./fiche-blocs"
import { CorpsEternal } from "./fiche-eternal"

/* ==================================================================
   FICHE D'UNITÉ — /work/[slug]. LA COQUE.

   Une page projet est une ANNEXE au jeu de plans : même vocabulaire,
   même mobilier, mais elle documente un sous-ensemble et non
   l'ensemble. D'où la référence en U-0n et non en feuille 0n : ce
   n'est pas une neuvième feuille, c'est une pièce détachée.

   CE QUI EST COMMUN AUX CINQ FICHES, ET POURQUOI C'EST ICI. La carte
   a tranché : chaque fiche a sa mise en page propre. Ce fichier est
   ce qui ne se négocie pas, et il ne se négocie pas parce qu'un corps
   de fiche N'Y A PAS ACCÈS — il reçoit trois valeurs et rend des
   blocs. Sont donc communs, mécaniquement :

     · le décor et le cadre de coins ;
     · le rail latéral et sa référence REF.0043-B / REV.2 ;
     · la barre de retour et la bascule FR/EN ;
     · l'EN-TÊTE `fp-head`, porteur du nom de transition `fiche-<slug>`
       — c'est lui qui fait du morph un morph, et une fiche qui le
       réécrirait casserait la navigation depuis les feuilles ;
     · la référence U-0n, le titre, le sous-titre, les trois méta ;
     · le pied et son retour au document.

   CE QUI EST LIBRE : tout ce qui vit entre l'en-tête et le pied. Le
   corps est choisi par slug ci-dessous. Sans entrée dédiée, la fiche
   prend le corps générique — c'est le cas des quatre cursus et des
   projets pas encore repris.

   BUDGET DE FRAME : le décor est monté, mais la page reste en DOM plat
   et n'anime que des transforms à l'entrée.
   ================================================================== */

/* Les corps sur mesure, par slug. Une fiche reprise = une entrée ici
   et un fichier. Les autres tombent sur CORPS_GENERIQUE, inchangé. */
const CORPS: Record<string, Corps> = {
  eternal: CorpsEternal,
}

/* Le corps d'origine, à l'identique : contexte, contraintes,
   décisions, résultat, parc. Il reste la valeur par défaut parce
   qu'une fiche formation n'a pas de code à montrer — un cursus n'a ni
   architecture, ni cotes, ni extrait. */
const CORPS_GENERIQUE: Corps = ({ p, lang, reduit }) => {
  /* Une fiche formation garde le mobilier mais change de grille de
     lecture : programme au lieu de contraintes, travaux au lieu de
     décisions, compétences au lieu de parc. Les clés sont figées en
     `as const` pour rester dans l'union des clés du dictionnaire. */
  const libelles =
    p.genre === "formation"
      ? ({ bloc2: "fpProgramme", bloc3: "fpTravaux", parc: "fpCompetences" } as const)
      : ({ bloc2: "fpContraintes", bloc3: "fpDecisions", parc: "fpParc" } as const)

  return (
    <>
      <Bloc id="fp-ctx" titre={t(lang, "fpContexte")} reduit={reduit} i={0}>
        <p className="fp-prose">{p.contexte}</p>
      </Bloc>

      {/* Les contraintes AVANT les décisions : une décision ne veut
          rien dire sans ce qu'elle avait à tenir. */}
      <Bloc id="fp-ctr" titre={t(lang, libelles.bloc2)} reduit={reduit} i={1}>
        <ul className="fp-contraintes">
          {p.contraintes.map((c, i) => (
            <li key={c}>
              <span className="mono mono-xs dim fp-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="mono mono-sm dim-2 fp-contrainte">{c}</span>
            </li>
          ))}
        </ul>
      </Bloc>

      <Bloc id="fp-dec" titre={t(lang, libelles.bloc3)} reduit={reduit} i={2}>
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
      </Bloc>

      {/* Le PRÉVU est une rubrique et pas une ligne de parc : le parc
          ne dit que ce qui est, un projet au futur qui s'y glisserait
          redeviendrait un fait inventé (issue #7, IBKR). La flèche
          remplace le numéro d'ordre — on n'ordonne pas ce qui n'existe
          pas encore. */}
      {p.prevu && (
        <Bloc id="fp-prevu" titre={t(lang, "fpPrevu")} reduit={reduit} i={3}>
          <ul className="fp-contraintes">
            {p.prevu.map((c) => (
              <li key={c}>
                <span className="mono mono-xs dim fp-num" aria-hidden="true">
                  →
                </span>
                <span className="mono mono-sm dim-2 fp-contrainte">{c}</span>
              </li>
            ))}
          </ul>
        </Bloc>
      )}

      {p.resultat && (
        <Bloc id="fp-res" titre={t(lang, "fpResultat")} reduit={reduit} i={4}>
          <p className="fp-prose">{p.resultat}</p>
        </Bloc>
      )}

      <Bloc id="fp-parc" titre={t(lang, libelles.parc)} reduit={reduit} i={5}>
        <ul className="fp-parc">
          {p.parc.map((x) => (
            <li key={x} className="mono mono-xs fp-piece">
              {x}
            </li>
          ))}
        </ul>
      </Bloc>

      {/* Les captures ferment la fiche : la preuve visuelle après les
          faits, jamais à leur place. `<img>` nu et pas next/image —
          l'optimiseur est coupé (next.config.mjs, unoptimized), les
          dimensions posées dans le balisage réservent la place avant
          l'arrivée du fichier. */}
      {p.captures && (
        <Bloc id="fp-captures" titre={t(lang, "fpCaptures")} reduit={reduit} i={6}>
          <ul className="fp-captures">
            {p.captures.map((c) => (
              <li key={c.src}>
                <figure>
                  <img src={c.src} alt={c.alt} width={1600} height={900} loading="lazy" decoding="async" />
                  <figcaption className="mono mono-xs dim">{c.legende}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Bloc>
      )}
    </>
  )
}

export function FicheProjet({ slug }: { slug: string }) {
  const [lang, setLang] = useState<Lang>("fr")
  /* Avant le garde-fou ci-dessous : un hook ne se place jamais après un
     retour anticipé. La coupure reduced-motion s'écrit ICI parce que le
     CSS n'atteint pas framer — cf. planche.css, ACCESSIBILITÉ. */
  const reduit = useReducedMotion()
  const p = projet(lang, slug)

  // La route valide déjà le slug ; ce garde-fou couvre le cas d'une
  // fiche présente dans une langue et pas dans l'autre.
  if (!p) return null

  const Corps = CORPS[slug] ?? CORPS_GENERIQUE

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

        {/* L'en-tête porte le nom de transition : la card cliquée sur une
            feuille et cet en-tête sont LE MÊME objet pour le navigateur,
            qui anime position et taille entre les deux. Sans support
            View Transitions, la navigation reste une navigation. */}
        <ViewTransition name={`fiche-${p.slug}`} share="morph" default="none">
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
              <span>{t(lang, p.genre === "formation" ? "fpFicheFormation" : "fpFiche")}</span>
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
        </ViewTransition>

        <Corps p={p} lang={lang} reduit={reduit} />

        <footer className="fp-pied">
          <Link href="/#index" className="mono mono-sm fp-retour-bas">
            <span aria-hidden="true">←</span> {t(lang, "fpRetourDocument")}
          </Link>
        </footer>
      </article>
    </main>
  )
}
