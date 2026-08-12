"use client"

/* ==================================================================
   UNIVERS CH.02 — ESTIA : cyanotype / blueprint d'atelier.
   La planche gatée v2.3 portée dans la page (addendum du spec).
   NUIT : le tirage — blanc sur Prusse, bichrome strict.
   JOUR (html.clair) : la table d'architecte — papier machine sous la
   lampe, la sanguine réservée aux révisions.
   Les données restent chapitres.ts — l'univers met en scène, il ne
   forke jamais. Le calque porte travaux[1] (l'échappée) : c'est
   l'amorce littérale de la frontière vers CH.03 (phase 3).
   ================================================================== */

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import type { Chapitre } from "./chapitres"
import { t, type Lang } from "./dict"

export function UniversEstia({
  c,
  lang,
  setLang,
  reduit,
}: {
  c: Chapitre
  lang: Lang
  setLang: (l: Lang) => void
  reduit: boolean | null
}) {
  /* la fin de période, pour le tampon : « 2022.09 → 2025.10 » → « 2025.10 » */
  const findePeriode = c.periode.split("→").pop()!.trim()

  return (
    <section id="estia" data-univers="estia" className="ue" aria-labelledby="pc-titre-estia">
      <div className="ue-tirage">
        <div className="ue-reperes" aria-hidden="true">
          <span className="h" style={{ left: "12.5%" }}>1</span><span className="h" style={{ left: "37.5%" }}>2</span><span className="h" style={{ left: "62.5%" }}>3</span><span className="h" style={{ left: "87.5%" }}>4</span>
          <span className="h b" style={{ left: "12.5%" }}>1</span><span className="h b" style={{ left: "37.5%" }}>2</span><span className="h b" style={{ left: "62.5%" }}>3</span><span className="h b" style={{ left: "87.5%" }}>4</span>
          <span className="v" style={{ top: "16.6%" }}>A</span><span className="v" style={{ top: "50%" }}>B</span><span className="v" style={{ top: "83.3%" }}>C</span>
          <span className="v d" style={{ top: "16.6%" }}>A</span><span className="v d" style={{ top: "50%" }}>B</span><span className="v d" style={{ top: "83.3%" }}>C</span>
        </div>
        <div className="ue-emulsion">
          <div className="ue-poche" aria-hidden="true"></div>

          <svg className="ue-rappels" aria-hidden="true" viewBox="0 0 1210 1830" preserveAspectRatio="none">
            <line x1="650" y1="390" x2="548" y2="330"></line>
            <circle cx="650" cy="390" r="2.5"></circle>
            <line x1="660" y1="812" x2="620" y2="885"></line>
            <circle cx="660" cy="812" r="2.5"></circle>
          </svg>

          <aside className="ue-piece ue-liminaire">
            <span className="mono mono-xs dim">{t(lang, "ueNote")}</span>
            {c.seuil}
          </aside>

          <header className="ue-piece ue-elevation">
            <p className="ue-cote mono mono-xs"><i aria-hidden="true">⟨</i>{c.periode}<i aria-hidden="true">⟩</i></p>
            <h2 id="pc-titre-estia" className="ue-nom">{c.nom}</h2>
            <div className="ue-el-ligne">
              <span className="jp ue-el-jp" lang="ja">{c.jp}</span>
              <span className="mono mono-xs dim">{c.cadre} · {c.etat}</span>
            </div>
            <p className="ue-el-sous">{c.intitule}</p>
          </header>

          <div className="ue-piece ue-cote-v" aria-hidden="true"><span>{t(lang, "ueRail")}</span></div>

          <div className="ue-piece ue-ctx">
            <div className="ue-vue-tete">
              <span className="ue-vue" aria-hidden="true"><i>A</i><b>02</b></span>
              <h3>{t(lang, "fpContexte")}</h3>
              <span className="ue-fil" aria-hidden="true"></span>
            </div>
            <p>{c.contexte}</p>
          </div>

          <div className="ue-piece ue-prog">
            <div className="ue-vue-tete">
              <span className="ue-vue" aria-hidden="true"><i>B</i><b>02</b></span>
              <h3>{t(lang, "fpProgramme")}</h3>
            </div>
            <ul>
              {c.programme.map((ligne) => (
                <li key={ligne}>{ligne}</li>
              ))}
            </ul>
          </div>

          <article className="ue-piece ue-detail ue-d01">
            <span className="mono mono-xs dim">{t(lang, "ueDetail")} D-01 · {t(lang, "fpTravaux")}</span>
            <h4>{c.travaux[0].titre}</h4>
            <p>{c.travaux[0].texte}</p>
          </article>

          <article className="ue-piece ue-detail ue-d02" aria-hidden="true">
            <span className="mono mono-xs dim">{t(lang, "ueDetail")} D-02 — {t(lang, "ueVoirCalque")}</span>
            <h4>{c.travaux[1].titre}</h4>
            <p>{t(lang, "ueGhost")}</p>
          </article>

          <article className="ue-piece ue-detail ue-d03">
            <svg className="ue-nuage" viewBox="0 0 420 240" preserveAspectRatio="none" aria-hidden="true">
              <path d="M30,30 Q45,8 62,26 Q80,4 98,24 Q118,4 136,24 Q156,4 174,24 Q194,6 212,26 Q232,6 250,26 Q270,8 288,26 Q308,8 326,28 Q346,10 362,30 Q382,16 388,42 Q404,52 392,72 Q408,88 392,106 Q406,124 390,140 Q404,158 386,172 Q398,192 378,200 Q368,222 346,210 Q330,230 310,214 Q292,232 272,214 Q252,232 232,214 Q212,232 192,214 Q172,230 152,212 Q132,228 112,210 Q92,226 74,208 Q52,220 44,198 Q22,192 30,170 Q12,156 28,138 Q12,120 30,104 Q14,86 32,70 Q18,52 30,30 Z"></path>
              {/* 2024.09 : l'entrée du MBDS — la date de la révision au plan */}
              <text x="330" y="16">{t(lang, "ueRev")} 2024.09</text>
            </svg>
            <span className="mono mono-xs dim">{t(lang, "ueDetail")} D-03 — {t(lang, "ueSecondeVoie")}</span>
            <h4>{c.travaux[2].titre}</h4>
            <p>{c.travaux[2].texte}</p>
          </article>

          <aside className="ue-piece ue-calque">
            <span className="mono mono-xs dim">{t(lang, "ueCalque")} — {t(lang, "ueDetail")} D-02 · {t(lang, "ueEchappee")}</span>
            <h4>{c.travaux[1].titre}</h4>
            <p>{c.travaux[1].texte}</p>
            <span className="jp ue-calque-jp" lang="ja">{t(lang, "ueCalqueJp")}</span>
          </aside>

          {c.resultat && (
            <p className="ue-piece ue-resultat">
              <span className="mono mono-xs dim">{t(lang, "fpResultat")}</span>
              {c.resultat}
            </p>
          )}

          <div className="ue-piece ue-nomenclature">
            <table>
              <caption className="mono mono-xs">{t(lang, "ueNomenclature")}</caption>
              <thead>
                <tr><th scope="col">{t(lang, "ueRep")}</th><th scope="col">{t(lang, "ueDesignation")}</th></tr>
              </thead>
              <tbody>
                {c.competences.map((o, i) => (
                  <tr key={o}><td>{String(i + 1).padStart(2, "0")}</td><td>{o}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ue-piece ue-tampon" role="img" aria-label={`${c.etat} — ${findePeriode}`}>
            <b>{c.etat}</b>
            <span>{findePeriode} — {t(lang, "ueVisa")}</span>
          </div>

          {/* le cartouche est la navigation de l'univers : langue, thème, sortie */}
          <dl className="ue-piece ue-cartouche">
            <div><dt>{t(lang, "ueProjet")}</dt><dd>{t(lang, "pcTitre")} — CH.{c.numero} / 04</dd></div>
            <div><dt>{t(lang, "ueObjet")}</dt><dd>{c.nom}</dd></div>
            <div><dt>{t(lang, "ueUnivers")}</dt><dd>{t(lang, "ueUniversNom")}</dd></div>
            <div><dt>{t(lang, "ueEchelle")}</dt><dd>{t(lang, "ueEchelleVal")}</dd></div>
            <div>
              <dt>{t(lang, "ueLangue")}</dt>
              <dd className="ue-nav">
                <button type="button" className="mono mono-xs" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>FR</button>
                <button type="button" className="mono mono-xs" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
              </dd>
            </div>
            <div><dt>{t(lang, "ueTheme")}</dt><dd className="ue-nav"><ThemeToggle lang={lang} /></dd></div>
            <div>
              <dt>{t(lang, "ueSortie")}</dt>
              <dd className="ue-nav">
                <Link href="/#carte-estia" className="mono mono-xs ue-sortie">
                  <span aria-hidden="true">←</span> {t(lang, "fpRetourDocument")}
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
