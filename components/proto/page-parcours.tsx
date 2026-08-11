"use client"

/* ==================================================================
   /PARCOURS — phase 1 : le squelette (spec 2026-08-11, chantier #6).
   La page EXISTE, laide et vraie : couverture sobre, quatre chapitres
   à plat sur leurs ancres, les trois besoins de navigation (sortir,
   langue, thème). Monde à part : pas de décor du site ici — pas de
   World, pas de Voiture, pas de frame. Rien n'anime encore, à
   dessein : chaque univers arrive derrière sa planche.
   ================================================================== */

import { useState } from "react"
import Link from "next/link"
import { Smooth } from "./smooth"
import { ThemeToggle } from "./theme-toggle"
import { chapitres } from "./chapitres"
import { t, type Lang } from "./dict"

export function PageParcours() {
  const [lang, setLang] = useState<Lang>("fr")
  const liste = chapitres(lang)

  return (
    <main lang={lang} className="pc-root">
      <Smooth />

      <header className="pc-couverture">
        <div className="pc-barre">
          <Link href="/" className="mono mono-xs dim pc-sortir">
            <span aria-hidden="true">←</span> {t(lang, "fpRetour")}
          </Link>
          <div className="pc-lang">
            <button type="button" className="mono mono-xs" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>
              FR
            </button>
            <button type="button" className="mono mono-xs" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
          </div>
          <ThemeToggle lang={lang} />
        </div>

        <h1 className="pc-titre">{t(lang, "pcTitre")}</h1>
        <p className="mono mono-sm dim pc-arc">{t(lang, "pcArc")}</p>

        <nav aria-label={t(lang, "pcSommaire")}>
          <ol className="pc-sommaire">
            {liste.map((c) => (
              <li key={c.ancre}>
                <a href={`#${c.ancre}`} className="pc-sommaire-lien">
                  <span className="mono mono-xs dim">{c.numero}</span>
                  <span className="pc-sommaire-nom">{c.nom}</span>
                  <span className="mono mono-xs dim-2">{c.periode}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      {liste.map((c) => (
        <section key={c.ancre} id={c.ancre} className="pc-chapitre" aria-labelledby={`pc-titre-${c.ancre}`}>
          <p className="pc-seuil dim">{c.seuil}</p>

          <header className="pc-tete">
            <p className="mono mono-xs dim">
              {c.numero} · {c.periode} · {c.etat}
            </p>
            <h2 id={`pc-titre-${c.ancre}`} className="pc-nom">
              {c.nom}
            </h2>
            <p className="jp dim pc-jp">{c.jp}</p>
            <p className="pc-intitule">{c.intitule}</p>
            <p className="mono mono-xs dim-2">{c.cadre}</p>
          </header>

          <h3 className="mono mono-sm dim">{t(lang, "fpContexte")}</h3>
          <p>{c.contexte}</p>

          <h3 className="mono mono-sm dim">{t(lang, "fpProgramme")}</h3>
          <ul className="pc-liste">
            {c.programme.map((ligne) => (
              <li key={ligne}>{ligne}</li>
            ))}
          </ul>

          <h3 className="mono mono-sm dim">{t(lang, "fpTravaux")}</h3>
          {c.travaux.map((tr) => (
            <div key={tr.titre} className="pc-travail">
              <h4>{tr.titre}</h4>
              <p>{tr.texte}</p>
            </div>
          ))}

          <h3 className="mono mono-sm dim">{t(lang, "fpCompetences")}</h3>
          <ul className="mono mono-xs pc-liste">
            {c.competences.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>

          {c.resultat && (
            <>
              <h3 className="mono mono-sm dim">{t(lang, "fpResultat")}</h3>
              <p>{c.resultat}</p>
            </>
          )}

          <p>
            <Link href={`/#carte-${c.ancre}`} className="mono mono-xs dim pc-retour">
              <span aria-hidden="true">←</span> {t(lang, "fpRetourDocument")}
            </Link>
          </p>
        </section>
      ))}
    </main>
  )
}
