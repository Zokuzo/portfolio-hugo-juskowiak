"use client"

/* ==================================================================
   UNIVERS CH.01 — CPGE : Style Typographique International /
   brutalisme de copie. La planche gatée v1 portée dans la page
   (addendum du spec, 2e du 2026-08-12).
   LE PARTI : la grille stricte du typographe, corrigée en rouge
   par-dessus — la couche imprimée se cale au quadrillage 5×5,
   seule la couche du correcteur a le droit d'être de travers.
   NUIT : le tableau noir — craie, fusain, deux panneaux joints.
   JOUR (html.clair) : la copie double sous néon — impression noire
   (l'énoncé), Bic bleu (la voix de l'étudiant), rouge (le
   correcteur SEUL).
   Les données restent chapitres.ts — l'univers met en scène, il ne
   forke jamais. La voix du correcteur (verdict, ✓✓, « c'est le
   métier ») met en scène resultat/etat RÉELS — rien d'inventé.
   ================================================================== */

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { ANCRES, type Chapitre } from "./chapitres"
import { t, type Lang } from "./dict"

/* Le programme TSI réel, en matière de fond (aria-hidden) : de la
   texture, pas de l'information — identique aux deux langues. */
const EQUATIONS = ["H(p) = K ⁄ (1 + τ·p)", "m·ẍ + λ·ẋ + k·x = F(t)", "e = − dΦ ⁄ dt"] as const

/* « Mathématiques : analyse… » → le correcteur souligne le TERME.
   Coupe sur le premier deux-points, séparateur conservé tel quel
   (FR « : », EN ": ") — dérivation d'affichage, pas un fork. */
const scinde = (ligne: string): [string, string, string] | null => {
  const m = /^(.+?)(\s?:\s)(.+)$/.exec(ligne)
  return m ? [m[1], m[2], m[3]] : null
}

export function UniversCpge({
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
  /* la fin de période, pour le tampon : « 2020.09 → 2022.06 » → « 2022.06 » */
  const findePeriode = c.periode.split("→").pop()!.trim()
  void reduit // consommé par la Tâche 3 (mouvement)

  return (
    <section id="cpge" data-univers="cpge" className="uc" aria-labelledby="pc-titre-cpge">
      <div className="uc-copie">
        <div className="uc-halo" aria-hidden="true"></div>
        <div className="uc-pli" aria-hidden="true"></div>
        <div className="uc-marge-g" aria-hidden="true"></div>
        <div className="uc-marge-d" aria-hidden="true"></div>

        {/* ---- page de gauche ---- */}
        <div className="uc-page">
          {/* l'en-tête de copie EST le cartouche : identité + les trois
              besoins de navigation de l'univers */}
          <dl className="uc-piece uc-entete">
            <div><dt>{t(lang, "ucEpreuve")}</dt><dd>{t(lang, "pcTitre")} — CH.{c.numero} / {String(ANCRES.length).padStart(2, "0")}</dd></div>
            <div><dt>{t(lang, "ucCentre")}</dt><dd>{c.cadre}</dd></div>
            <div><dt>{t(lang, "ucSession")}</dt><dd>{c.periode}</dd></div>
            <div><dt>{t(lang, "ueUnivers")}</dt><dd>{t(lang, "ucUniversNom")}</dd></div>
            <div>
              <dt>{t(lang, "ueLangue")}</dt>
              <dd className="uc-nav">
                <button type="button" className="mono mono-xs" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>FR</button>
                <button type="button" className="mono mono-xs" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
              </dd>
            </div>
            <div><dt>{t(lang, "ueTheme")}</dt><dd className="uc-nav"><ThemeToggle lang={lang} /></dd></div>
            <div>
              <dt>{t(lang, "ueSortie")}</dt>
              <dd className="uc-nav">
                <Link href="/#carte-cpge" className="mono mono-xs uc-sortie">
                  <span aria-hidden="true">←</span> {t(lang, "fpRetourDocument")}
                </Link>
              </dd>
            </div>
          </dl>

          {/* le seuil : la première ligne de la copie, soulignée en rouge */}
          <p className="uc-piece uc-seuil">
            {c.seuil}
            <svg className="uc-souligne" aria-hidden="true" viewBox="0 0 320 12" preserveAspectRatio="none">
              <path d="M2,7 Q10,2 18,7 Q26,12 34,7 Q42,2 50,7 Q58,12 66,7 Q74,2 82,7 Q90,12 98,7 Q106,2 114,7 Q122,12 130,7 Q138,2 146,7 Q154,12 162,7 Q170,2 178,7 Q186,12 194,7 Q202,2 210,7 Q218,12 226,7 Q234,2 242,7 Q250,12 258,7 Q266,2 274,7 Q282,12 290,7 Q298,2 306,7 Q312,10 318,6" />
            </svg>
          </p>

          {/* I. CONTEXTE */}
          <div className="uc-piece uc-ctx">
            <div className="uc-tete-q"><b aria-hidden="true">I.</b><h3>{t(lang, "fpContexte")}</h3></div>
            <p>{c.contexte}</p>
          </div>

          {/* III. CE QUI RESTE — travaux[0] */}
          <div className="uc-piece uc-travail">
            <div className="uc-tete-q"><b aria-hidden="true">III.</b><h3>{t(lang, "ucCeQuiReste")}</h3></div>
            <h4>{c.travaux[0].titre}</h4>
            <p>{c.travaux[0].texte}</p>
            <span className="uc-annote" aria-hidden="true"><i>✓✓</i> <span className="uc-main">{t(lang, "ucMetier")}</span></span>
          </div>

          <span className="uc-piece uc-eq uc-eq3" aria-hidden="true">{EQUATIONS[2]}</span>
          <span className="uc-piece uc-ne-pas-effacer mono" aria-hidden="true">{t(lang, "ucNePasEffacer")}</span>
          <span className="uc-piece uc-no-page uc-p1 mono mono-xs" aria-hidden="true">— 1 —</span>
        </div>

        {/* ---- page de droite ---- */}
        <div className="uc-page">
          {/* le cadre réservé (imprimé, JOUR) — et le correcteur écrit dedans */}
          <div className="uc-piece uc-reserve" aria-hidden="true">
            <span className="mono mono-xs">{t(lang, "ucCadreReserve")}</span>
          </div>
          <div className="uc-piece uc-verdict">
            <svg aria-hidden="true" viewBox="0 0 340 74" preserveAspectRatio="none">
              <path d="M22,37 Q20,12 88,9 Q180,2 292,13 Q334,19 331,38 Q330,60 250,66 Q140,74 52,64 Q18,58 22,40" />
            </svg>
            <span className="uc-main">{t(lang, "ucVerdict")}</span>
            <span className="mono mono-xs">{t(lang, "ucVoir")} · {findePeriode}</span>
          </div>

          <span className="uc-piece uc-eq uc-eq1" aria-hidden="true">{EQUATIONS[0]}</span>

          {/* II. PROGRAMME */}
          <div className="uc-piece uc-prog">
            <div className="uc-tete-q"><b aria-hidden="true">II.</b><h3>{t(lang, "fpProgramme")}</h3></div>
            <ol>
              {c.programme.map((ligne, i) => {
                const coupe = scinde(ligne)
                return (
                  <li key={ligne}>
                    <i aria-hidden="true">{i + 1}.</i>
                    <p>{coupe ? (<><b>{coupe[0]}</b>{coupe[1]}{coupe[2]}</>) : ligne}</p>
                  </li>
                )
              })}
            </ol>
            <span className="uc-coche uc-main" aria-hidden="true">✓✓</span>
          </div>

          <span className="uc-piece uc-eq uc-eq2" aria-hidden="true">{EQUATIONS[1]}</span>

          {/* le barème : les compétences */}
          <div className="uc-piece uc-bareme">
            <table>
              <caption className="mono mono-xs">{t(lang, "ucBareme")}</caption>
              <thead>
                <tr><th scope="col">{t(lang, "ueRep")}</th><th scope="col">{t(lang, "ueDesignation")}</th><th scope="col">{t(lang, "ucEtatCol")}</th></tr>
              </thead>
              <tbody>
                {c.competences.map((o, i) => (
                  <tr key={o}>
                    <td>{String(i + 1).padStart(2, "0")}</td>
                    <td>{o}</td>
                    <td><span aria-hidden="true">✓</span><span className="sr-only">{t(lang, "ucAcquis")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* le tampon du visa, qui MORD sur l'encadré du résultat */}
          <div className="uc-piece uc-tampon" role="img" aria-label={`${c.etat} — ${findePeriode}`}>
            <b>{c.etat}</b>
            <span>{findePeriode} — {t(lang, "ueVisa")}</span>
          </div>

          <span className="uc-piece uc-no-page uc-p2 mono mono-xs" aria-hidden="true">— 2 —</span>
        </div>

        {/* ---- pièces sur la pliure (hors respiration des pages) ---- */}
        <header className="uc-piece uc-titre">
          <div className="uc-barre" aria-hidden="true"></div>
          <h2 id="pc-titre-cpge" className="uc-nom">{c.nom}</h2>
          <span className="jp uc-jp-v" lang="ja">{c.jp}</span>
          <div className="uc-titre-ligne">
            <p className="uc-intitule">{c.intitule}</p>
            <span className="mono mono-xs dim">{c.periode}</span>
          </div>
        </header>

        {c.resultat && (
          <div className="uc-piece uc-resultat">
            <span className="mono mono-xs dim">{t(lang, "ucResultatEncadre")}</span>
            <p>{c.resultat}</p>
            <p className="uc-suite dim">{t(lang, "ucSuite")}</p>
          </div>
        )}

        <div className="uc-rail" aria-hidden="true"><i></i><i className="r"></i></div>
      </div>
    </section>
  )
}
