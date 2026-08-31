"use client"

import { useState, ViewTransition } from "react"
import Link from "next/link"
import { t, type Lang } from "@/components/proto/dict"
import { projet } from "@/components/proto/projets"
import { Cotes, CodeAnnote } from "@/components/proto/fiche-blocs"
import { SchemaEternal } from "@/components/proto/schema-eternal"
import { venuDeLaPlanche } from "@/components/proto/lien-fiche"

/* ==================================================================
   FICHE Y2K — le gabarit « affiche publicitaire » (#38). La grammaire
   vient de la moisson du feed Pinterest de Hugo (synthèse au ticket) :
   HÉROS de pub auto (le produit plein cadre, le nom en chrome liquide,
   l'accroche italique), panneau SYSTEM pixel-UI pour les méta, pavé
   dense pour le contexte, panneaux de nuit pour contraintes/décisions,
   readout LCD pour le résultat, étiquettes noires pour le parc.

   CONTENU : projets.ts repris TEL QUEL, libellés fp* du dict — rien du
   vocabulaire planche (unite U-0n, rails REF/REV, feuilles) n'entre.

   L'EN-TÊTE porte le ViewTransition `fiche-<slug>` (share="morph"),
   comme la coque planche : le morph depuis les feuilles de `/` tient.
   ================================================================== */

/* un accent PAR PROJET (décision du 2026-08-26) — le rose au produit
   courant, le vert acide du feed à Octo, le glacé Sophia à la
   prédiction mémoire. Plus de `txt` par accent : `--acc-txt` a un
   défaut AUDITÉ dans y2k.css (la nuit) et rien ici ne le consomme —
   l'encre morte qu'on posait quand même n'était PAS auditée (revue du
   re-gate). */
/* CETTE TABLE DOIT COUVRIR LES NEUF SLUGS — SLUGS_TRAVAIL ET
   SLUGS_MAISON de projets.ts. Un slug absent tombe sur le rose par
   défaut : la fiche s'affiche, mais avec l'accent d'une autre. Le repli
   est là pour que la page ne casse pas, pas pour dispenser d'une entrée.

   ELLE NE PEUT PAS ÊTRE LA SOURCE DE VÉRITÉ DE LA SCISSION : ce fichier
   est un module « use client », et une liste exportée d'ici n'arrive au
   serveur que comme référence opaque — payé au build du #38, sur un
   `.includes is not a function` côté serveur. D'où la scission dans
   projets.ts, qui n'est pas un module client. */
const ACCENTS: Record<string, string> = {
  /* — le BUREAU (#38) — */
  "reach-up": "#ff3ea5",
  octo: "#9be05a",
  "prediction-memoire": "#8fd0ff",
  /* — la CHAMBRE (#39) — les deux premiers ne sont pas choisis ici :
     ils sont RECOPIÉS des disquettes du hub /home (ACCENTS_ATELIER de
     hub-maison.tsx). La couleur d'une disquette est une promesse ; une
     affiche d'une autre teinte que l'objet cliqué la trahirait. */
  eternal: "#a06bff", // le violet du monde — disquette A1
  "trading-agent": "#9be05a", // le vert acide — disquette A2
  /* Les quatre cursus vivent dans UNE playlist violette : le hub ne
     leur donne pas d'accent individuel, la fiche doit donc l'inventer.
     Chacun prend la teinte de ce qu'il est, dans la palette du monde. */
  cpge: "#5fe3d0", // aqua — le socle formel, froid, avant la première ligne de code
  estia: "#ffb02e", // ambre — le rail principal, le long fût chaud du parcours
  hokkaido: "#ff9ec7", // rose sakura — le cerisier qui est derrière la vitre de /home
  mbds: "#6f83f0", // cobalt — la teinte déjà ÉCLAIRCIE et auditée AA au re-gate du #38
}

/* LA FICHE SUIT SA PARTITION (#39). Une fiche maison qui renverrait au
   bureau éjecterait de la chambre — c'était la dette léguée par le #37,
   en pire : elle renvoyait à la PLANCHE. La route passe son monde, la
   fiche ne le devine pas.

   DEUX LIBELLÉS ET PAS UN : le retour ET le pied. Le pied disait
   « session TRAVAIL » sous une fiche de la chambre (attrapé à l'œil sur
   la capture d'ESTIA) — même faute que le retour, même cause, donc même
   table. Tout ce qui nomme le monde passe par ICI ; un troisième
   libellé oublié se verrait comme les deux premiers.

   ET LE #40 LES SÉPARE — pas la table, les deux colonnes. Le RETOUR
   suit le VISITEUR : venu de la planche, il y ramène. Le PIED suit la
   FICHE : ESTIA reste un cursus de la chambre, quelle que soit la
   porte par laquelle on est entré. Une seule des deux colonnes
   bascule, et `statut` n'a donc pas de troisième entrée à recevoir —
   la planche n'est pas un monde de la fiche, c'est un point de
   départ. */
const MONDE = {
  "/work": { sys: "hubTravailSys", statut: "hubStatut" },
  "/home": { sys: "hubMaisonSys", statut: "hubMaisonStatut" },
} as const

export function FicheY2k({ slug, retour = "/work" }: { slug: string; retour?: keyof typeof MONDE }) {
  const [lang, setLang] = useState<Lang>("fr")
  /* FIGÉ AU MONTAGE (#40). La mémoire de `lien-fiche.tsx` est vide sur
     tout rendu serveur — donc l'hydratation ne peut pas diverger — mais
     un initialisateur paresseux vaut mieux qu'une lecture à chaque
     rendu : la réponse ne concerne QUE cette ouverture-ci, elle ne doit
     pas bouger quand la bascule FR/EN redessine la fiche. */
  const [dePlanche] = useState(() => venuDeLaPlanche(slug))
  const p = projet(lang, slug)
  if (!p) return null
  const acc = ACCENTS[slug] ?? "#ff3ea5"
  const monde = MONDE[retour]
  /* L'ancre `carte-<slug>` existe sur les NEUF cards de la planche
     (experience.tsx, etudes.tsx, atelier.tsx) : c'est elle qui rend le
     défilement, et `app/page.tsx` rend le focus au lien de la card. */
  const cible = dePlanche ? `/#carte-${slug}` : retour
  const sys = t(lang, dePlanche ? "fpDocumentSys" : monde.sys)
  /* Un cursus garde le mobilier de l'affiche mais change de grille de
     lecture : un diplôme n'a ni contraintes ni décisions techniques, il
     a un programme et des travaux. Même bascule que la coque planche —
     les clés `as const` restent dans l'union des clés du dictionnaire. */
  const libelles =
    p.genre === "formation"
      ? ({ bloc2: "fpProgramme", bloc3: "fpTravaux", parc: "fpCompetences" } as const)
      : ({ bloc2: "fpContraintes", bloc3: "fpDecisions", parc: "fpParc" } as const)

  return (
    <main lang={lang} className="y2k fy" style={{ "--acc": acc } as React.CSSProperties}>
      <header className="y2k-barre">
        <span className="y2k-barre-os">{t(lang, "hubOs")}</span>
        <span className="y2k-barre-fichier">{p.nom}</span>
        <span className="y2k-barre-espace" />
        <span className="y2k-langues" role="group" aria-label="FR / EN">
          {(["fr", "en"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </span>
        <Link href={cible} className="y2k-ejecter">
          ‹ {sys}
        </Link>
      </header>

      {/* — l'affiche : le héros de pub — */}
      <ViewTransition name={`fiche-${p.slug}`} share="morph" default="none">
        <header className={`fy-hero${p.captures?.length ? "" : " fy-hero--court"}`}>
          {/* les coins RÉPÈTENT les méta du panneau SYSTEM dessous —
              décor de pub, soustrait aux lecteurs d'écran */}
          <span className="fy-coin hg" aria-hidden="true">{`${t(lang, "fpCadre")} — ${p.cadre}\n${t(lang, "fpPeriode")} — ${p.periode}`}</span>
          <span className="fy-coin hd" aria-hidden="true">{`${t(lang, "fpEtat")} — ${p.etat}`}</span>
          <span className="fy-vertical" aria-hidden="true">
            {p.jp}
          </span>
          <span className="fy-etoile" aria-hidden="true">
            ✦
          </span>
          <p className="fy-fiche-type">{t(lang, p.genre === "formation" ? "fpFicheFormation" : "fpFiche")}</p>
          {/* le porteur .fy-nom-halo tient le SKEW ; l'ombre dure et le
              halo sont le ::after du h1 (data-nom) — ni ombre ni filter
              sur le texte clippé lui-même (cause racine du « néon
              noir », voir y2k.css) */}
          <div className="fy-nom-halo">
            <h1 className="fy-nom" data-nom={p.nom}>
              {p.nom}
            </h1>
          </div>
          <p className="fy-claim">{p.sousTitre}</p>
          <dl className="fy-system">
            <div>
              <dt>{t(lang, "fpCadre")}</dt>
              <dd>{p.cadre}</dd>
            </div>
            <div>
              <dt>{t(lang, "fpPeriode")}</dt>
              <dd>{p.periode}</dd>
            </div>
            <div>
              <dt>{t(lang, "fpEtat")}</dt>
              <dd>{p.etat}</dd>
            </div>
            {/* pas de badge « En poste » : c'est un libellé d'EMPLOYEUR,
                et l'état « En service » dit déjà tout (revue #38) */}
          </dl>
          {p.captures && p.captures.length > 0 && (
            <figure className="fy-vitrine">
              {/* la 2e capture glisse derrière, inclinée — elle garde
                  son alt : partiellement visible, pas un pur décor */}
              {p.captures[1] && (
                <img
                  className="arriere"
                  src={p.captures[1].src}
                  alt={p.captures[1].alt}
                  width={1600}
                  height={900}
                  loading="lazy"
                />
              )}
              <img src={p.captures[0].src} alt={p.captures[0].alt} width={1600} height={900} />
              <figcaption className="fy-legende">{p.captures[0].legende}</figcaption>
            </figure>
          )}
        </header>
      </ViewTransition>

      <div className="fy-colonne">
        {/* — le pavé de pub : le contexte — */}
        <section className="fy-pave" aria-labelledby="fy-ctx">
          <h2 id="fy-ctx" className="fy-titre-bloc">
            {t(lang, "fpContexte")}
          </h2>
          <p>{p.contexte}</p>
        </section>

        {/* — LE CORPS SUR MESURE D'ETERNAL (#39, hérité du monde
            planche). Cette fiche est la seule dont on connaît le CODE
            (recherche 02, tout sourcé) : elle MONTRE au lieu de
            raconter — le schéma juste après le contexte parce que sa
            seule phrase difficile (« deux vues, un seul moteur ») se
            lit en dessin, le pont EN CODE juste après la décision
            qu'il prouve, les cotes en fermeture avec la commande qui
            les rejoue. Pas de bloc « Résultat » : le projet n'a aucune
            télémétrie, un résultat inventé serait pire que rien.

            LES TROIS BLOCS SONT EMPRUNTÉS TELS QUELS au vocabulaire de
            la planche (`fiche-blocs.tsx`, `schema-eternal.tsx`) — les
            réécrire en Y2K aurait dupliqué une géométrie SVG de 101
            nœuds et un tableau de cotes pour n'en changer que les
            couleurs. Ils portent leurs classes `.fp-*` / `.etn-*`, et
            c'est `.fy-etn` qui les rhabille : le monde Y2K y REPOINTE
            les tokens de la planche (voir fiche-y2k.css). */}
        {slug === "eternal" && (
          <section className="fy-etn" aria-labelledby="fy-arc">
            <h2 id="fy-arc" className="fy-titre-bloc">
              {t(lang, "fpArchitecture")}
            </h2>
            <div className="fy-etn-lit">
              <SchemaEternal lang={lang} />
            </div>
          </section>
        )}

        <div className="fy-duo">
          <section aria-labelledby="fy-con">
            <h2 id="fy-con" className="fy-titre-bloc">
              {t(lang, libelles.bloc2)}
            </h2>
            <ul className="fy-liste">
              {p.contraintes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="fy-dec">
            <h2 id="fy-dec" className="fy-titre-bloc">
              {t(lang, libelles.bloc3)}
            </h2>
            <ol className="fy-liste fy-decisions">
              {p.decisions.map((d) => (
                <li key={d.titre}>
                  {/* h3 et non <b> : la coque planche supprimée en faisait
                      un vrai titre, et six fiches de plus basculent ici au
                      #39. Sans lui, la fiche n'a plus que h1 → h2 et un
                      lecteur d'écran ne peut plus sauter de décision en
                      décision au rotor. Le style ne bouge pas d'un pixel :
                      `.fy-decisions b` devient `.fy-decisions h3`, mêmes
                      déclarations, et h3 est remis à plat (marge et taille
                      héritées de l'agent utilisateur). */}
                  <h3>{d.titre}</h3>
                  <span>{d.texte}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {slug === "eternal" && (
          <>
            <section className="fy-etn" aria-labelledby="fy-pont">
              <h2 id="fy-pont" className="fy-titre-bloc">
                {t(lang, "fpPont")}
              </h2>
              <div className="fy-etn-lit">
                <CodeAnnote
                  source={t(lang, "etnPontSource")}
                  lignes={t(lang, "etnPontCode") as unknown as string[][]}
                  note={t(lang, "etnPontNote")}
                  elision={t(lang, "fpCodeElision")}
                />
              </div>
            </section>
            <section className="fy-etn" aria-labelledby="fy-cotes">
              <h2 id="fy-cotes" className="fy-titre-bloc">
                {t(lang, "fpCotes")}
              </h2>
              <div className="fy-etn-lit">
                <Cotes lang={lang} lignes={t(lang, "etnCotes") as unknown as string[][]} note={t(lang, "fpCotesNote")} />
              </div>
            </section>
          </>
        )}

        {p.prevu && p.prevu.length > 0 && (
          <section aria-labelledby="fy-prevu">
            <h2 id="fy-prevu" className="fy-titre-bloc">
              {t(lang, "fpPrevu")}
            </h2>
            <ul className="fy-liste">
              {p.prevu.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </section>
        )}

        {p.resultat && (
          <section aria-labelledby="fy-res">
            <h2 id="fy-res" className="fy-titre-bloc">
              {t(lang, "fpResultat")}
            </h2>
            <p className="fy-resultat">{p.resultat}</p>
          </section>
        )}

        <section aria-labelledby="fy-parc">
          <h2 id="fy-parc" className="fy-titre-bloc">
            {t(lang, libelles.parc)}
          </h2>
          <div className="fy-parc">
            {p.parc.map((o) => (
              <span key={o}>{o}</span>
            ))}
          </div>
        </section>

        <Link href={cible} className="fy-retour">
          ‹ {sys}
        </Link>
      </div>

      <footer className="y2k-pied">
        <span>{t(lang, monde.statut)}</span>
        <span>{t(lang, "hubOs")}</span>
      </footer>
    </main>
  )
}
