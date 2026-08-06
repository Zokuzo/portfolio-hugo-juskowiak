"use client"

import type { ReactNode } from "react"
import { motion } from "motion/react"
import { t, type Lang } from "./dict"
import type { Projet } from "./projets"

/* ==================================================================
   VOCABULAIRE DE BLOCS — ce qui reste COMMUN quand la mise en page
   devient libre.

   LA DÉCISION QUE CE FICHIER APPLIQUE. Chaque fiche projet a sa mise
   en page propre ; seul l'en-tête est partagé. Une cohérence qui ne
   tiendrait qu'à la discipline de celui qui écrit la cinquième fiche
   ne tiendrait pas. Elle tient donc à deux choses mécaniques :

     1. la COQUE (`fiche-projet.tsx`) — en-tête porteur du morph, rail,
        barre de retour, bascule FR/EN, référence U-0n, pied. Aucune
        fiche ne la réécrit : elle n'y a pas accès.
     2. ce VOCABULAIRE — les blocs dans lesquels une fiche pioche. Une
        fiche compose librement, mais elle compose AVEC ça.

   POURQUOI DES COMPOSANTS ET PAS DES DONNÉES. Déclarer les blocs dans
   `projets.ts` demanderait une union de variantes et un rendu par
   branche : un mini-CMS dont la seule instance serait ce site. Et une
   « mise en page propre » n'est pas une liste de blocs — c'est un
   ordre, des largeurs, des ruptures de gabarit. Le langage qui dit ça
   s'appelle JSX. Le contrat de contenu, lui, ne bouge pas : aucune
   chaîne visible ici, tout vient de `dict.ts` ou de `projets.ts`, en
   FR et en EN.

   MOUVEMENT. Un seul motif, `monte()`, et il est coupé sous
   `prefers-reduced-motion: reduce` (ticket 23). Aucun bloc de ce
   fichier n'anime autre chose.
   ================================================================== */

/** Le corps d'une fiche. La coque lui passe l'enregistrement, la
 *  langue et l'état de la préférence de mouvement — rien d'autre.
 *  Une fiche sur mesure est UNE fonction de cette forme. */
export type Corps = (props: { p: Projet; lang: Lang; reduit: boolean | null }) => ReactNode

/* La révélation à l'entrée en vue. La coupure s'écrit ICI et pas en
   CSS : le CSS n'atteint pas le moteur d'animation. Seule la
   TRANSITION est branchée — brancher `initial` ferait diverger le
   rendu du serveur de celui du client (ticket 23). */
export function monte(reduit: boolean | null, i: number) {
  return {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: reduit ? { duration: 0 } : { duration: 0.5, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] as const },
  }
}

/** Un bloc titré, révélé à l'entrée en vue. C'est la seule unité de
 *  découpage d'une fiche : tout ce qu'une fiche montre est dedans. */
export function Bloc({
  id,
  titre,
  reduit,
  i,
  children,
}: {
  id: string
  titre: string
  reduit: boolean | null
  i: number
  children: ReactNode
}) {
  return (
    <motion.section className="fp-bloc" aria-labelledby={id} {...monte(reduit, i)}>
      <h2 id={id} className="mono mono-sm fp-bloc-titre">
        {titre}
      </h2>
      {children}
    </motion.section>
  )
}

/* ------------------------------------------------------------------
   COTES RELEVÉES

   Le bloc qui manquait au site. `projets.ts` écrit qu'une fiche
   technique qui invente ses cotes n'est plus une fiche, et que
   l'absence de chiffres est le seul manque assumé du document. Un
   chiffre ne devient publiable qu'avec ce qui le rejoue : la COMMANDE
   est donc une colonne du tableau, pas une note de bas de page.
   ------------------------------------------------------------------ */
export function Cotes({ lang, lignes, note }: { lang: Lang; lignes: string[][]; note: string }) {
  const tete = t(lang, "fpCotesTete") as unknown as string[]
  return (
    <>
      <div className="fp-cotes-cadre">
        <table className="fp-cotes">
          <thead>
            <tr className="mono mono-xs dim">
              <th scope="col">{tete[0]}</th>
              <th scope="col">{tete[1]}</th>
              <th scope="col">{tete[2]}</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l[0]}>
                <th scope="row" className="mono mono-sm fp-cote-nom">
                  {l[0]}
                </th>
                <td className="mono mono-sm fp-cote-val">{l[1]}</td>
                <td className="mono mono-xs dim fp-cote-cmd">
                  <code>{l[2]}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mono mono-xs dim fp-cotes-note">{note}</p>
    </>
  )
}

/* ------------------------------------------------------------------
   EXTRAIT DE CODE COMMENTÉ

   Le catalogue 21st ne connaît pas ce besoin (recherche 01, 5c) : il
   propose douze fois le même bloc à coloration syntaxique avec bouton
   copier. Le filtre du ticket 06 tranche le point :

     R-10.1 — un thème de coloration est une palette (six à dix
       teintes) ; `planche.css` en interdit UNE. Refusé.
     R-10.2 — le code se différencie par la graisse et par le gris.
       Trois niveaux : mise en évidence sur --paper, corps sur
       --g-100, commentaire sur --g-500.
     R-10.3 — aucun moteur de coloration installé. Ici : des <span>.
     R-10.4 — la mise en évidence passe par le RAIL géométrique
       (`inset 2px 0 0 var(--sig-hot)`, trois précédents dans le
       dépôt), jamais par un fond coloré.

   ÉCART ASSUMÉ à R-10.2, écrit pour qu'il se relise : le niveau
   --paper porte la LIGNE mise en évidence et non les mots-clés.
   Peindre deux mots-clés demanderait un analyseur lexical JavaScript
   pour deux mots ; le rail de R-10.4 porte déjà l'emphase.

   LE CODE NE SE TRADUIT PAS. Les deux langues rendent les mêmes
   lignes — c'est du code source, il n'en existe qu'une version.
   Seules la source et la note changent de langue.
   ------------------------------------------------------------------ */
export function CodeAnnote({
  source,
  lignes,
  note,
  elision,
}: {
  source: string
  lignes: string[][]
  note: string
  elision: string
}) {
  return (
    <figure className="fp-code">
      <figcaption className="mono mono-xs dim fp-code-src">{source}</figcaption>
      <div className="fp-code-cadre">
        <pre>
          <code>
            {lignes.map((l, i) => {
              /* Une ligne dont le numéro n'est pas un nombre est
                 l'ÉLISION. Le glyphe « ⋯ » vit dans la colonne des
                 numéros, et cette colonne est aria-hidden — sinon
                 chaque ligne se ferait annoncer son numéro. Un lecteur
                 d'écran entendrait donc un bloc CONTIGU. Le compte de
                 lignes sautées se déduit des numéros voisins : il ne
                 peut pas dériver si l'extrait change. */
              const saute = Number.isNaN(Number(l[0]))
                ? Number(lignes[i + 1]?.[0]) - Number(lignes[i - 1]?.[0]) - 1
                : 0
              return (
                <span
                  key={i}
                  className={`fp-code-l${l[2] === "!" ? " fp-code-m" : ""}${l[2] === "c" ? " fp-code-c" : ""}`}
                >
                  <span className="fp-code-n" aria-hidden="true">
                    {l[0]}
                  </span>
                  {saute > 0 ? <span className="sr-only">{`${saute} ${elision}`}</span> : null}
                  {l[1]}
                  {"\n"}
                </span>
              )
            })}
          </code>
        </pre>
      </div>
      <p className="mono mono-xs fp-code-note">{note}</p>
    </figure>
  )
}
