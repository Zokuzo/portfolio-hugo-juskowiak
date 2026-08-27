"use client"

import { useState, ViewTransition } from "react"
import Link from "next/link"
import { t, type Lang } from "@/components/proto/dict"
import { projet } from "@/components/proto/projets"

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
/* les clés de cette table DOIVENT égaler SLUGS_Y2K de
   app/work/[slug]/page.tsx — un export d'ici n'y arriverait que comme
   référence client opaque (payé au build : `.includes is not a
   function` côté serveur) */
const ACCENTS: Record<string, string> = {
  "reach-up": "#ff3ea5",
  octo: "#9be05a",
  "prediction-memoire": "#8fd0ff",
}

export function FicheY2k({ slug }: { slug: string }) {
  const [lang, setLang] = useState<Lang>("fr")
  const p = projet(lang, slug)
  if (!p) return null
  const acc = ACCENTS[slug] ?? "#ff3ea5"

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
        <Link href="/work" className="y2k-ejecter">
          ‹ {t(lang, "hubTravailSys")}
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

        <div className="fy-duo">
          <section aria-labelledby="fy-con">
            <h2 id="fy-con" className="fy-titre-bloc">
              {t(lang, "fpContraintes")}
            </h2>
            <ul className="fy-liste">
              {p.contraintes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="fy-dec">
            <h2 id="fy-dec" className="fy-titre-bloc">
              {t(lang, "fpDecisions")}
            </h2>
            <ol className="fy-liste fy-decisions">
              {p.decisions.map((d) => (
                <li key={d.titre}>
                  <b>{d.titre}</b>
                  <span>{d.texte}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

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
            {t(lang, "fpParc")}
          </h2>
          <div className="fy-parc">
            {p.parc.map((o) => (
              <span key={o}>{o}</span>
            ))}
          </div>
        </section>

        <Link href="/work" className="fy-retour">
          ‹ {t(lang, "hubTravailSys")}
        </Link>
      </div>

      <footer className="y2k-pied">
        <span>{t(lang, "hubStatut")}</span>
        <span>{t(lang, "hubOs")}</span>
      </footer>
    </main>
  )
}
