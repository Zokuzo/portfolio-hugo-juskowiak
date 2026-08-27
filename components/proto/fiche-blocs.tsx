"use client"

import { t, type Lang } from "./dict"

/* ==================================================================
   VOCABULAIRE DE BLOCS — les deux blocs qu'une fiche EMPRUNTE.

   CE QUI A CHANGÉ AU #39. Ce fichier servait la coque planche
   (`fiche-projet.tsx`) et son vocabulaire de mise en page libre. Les
   neuf fiches sont passées au gabarit « affiche Y2K » — trois au
   bureau, six à la chambre — et la coque a été supprimée avec son
   corps sur mesure : leur contenu vit désormais dans
   `components/y2k/fiche-y2k.tsx`.

   NE RESTE QUE CE QUI EST ENCORE APPELÉ : les COTES et le CODE
   ANNOTÉ, les deux blocs de la fiche Eternal. `Bloc` et `monte()`
   sont partis avec la coque — et avec eux la dépendance à `motion`,
   qui n'a plus rien à animer ici.

   LE CONTRAT DE CONTENU NE BOUGE PAS : aucune chaîne visible dans ce
   fichier, tout vient de `dict.ts` ou de `projets.ts`, en FR et en EN.
   ================================================================== */

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
