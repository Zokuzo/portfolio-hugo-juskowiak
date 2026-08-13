"use client"

/* ==================================================================
   UNIVERS CH.01 — CPGE : Style Typographique International /
   brutalisme de copie. La planche gatée v1 portée dans la page
   (addendum du spec, 2e du 2026-08-12).
   LE PARTI : la grille stricte du typographe, corrigée en rouge
   par-dessus — la couche imprimée se cale au quadrillage 5×5,
   seule la couche du correcteur a le droit d'être de travers.
   MOUVEMENT (la langue de la copie) : l'impression paraît d'un
   bloc, l'encre s'écrit gauche→droite, la correction tombe APRÈS
   coup — décalée, comme un correcteur repasse derrière. Au scroll,
   derrière la porte multiplicative née FERMÉE : les deux pages
   respirent autour du pli, les équations au fusain dérivent, la
   couche rouge flotte, le néon balaie (JOUR seul — sa couche vaut
   none en NUIT et se translate sans coût).
   INTERACTIVITÉ (pointeur fin seul) : souligner à la règle (JOUR,
   CSS), l'éponge efface et la craie se redessine (NUIT, CSS), le
   tampon se réimprime (whileTap). Sous reduce et au tactile : tout
   posé — le SSR cuit la pose, reduce ne voit jamais une frame.
   Les données restent chapitres.ts — l'univers met en scène, il ne
   forke jamais.
   ================================================================== */

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react"
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

  const copie = useRef<HTMLDivElement>(null)
  /* la respiration suit le scroll — FONCTION PURE : le F5 en pleine
     copie rend l'état exact (leçon de l'iris, revue #13) */
  const { scrollYProgress } = useScroll({ target: copie, offset: ["start end", "end start"] })
  const souffle = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })
  /* porte multiplicative, née FERMÉE (0) : le SSR cuit la pose, un
     utilisateur reduce ne voit jamais une frame bouger — les animés
     engagent le mouvement à l'hydratation, jamais l'inverse. */
  const porte = useMotionValue(0)
  useEffect(() => { porte.set(reduit ? 0 : 1) }, [reduit, porte])

  /* la copie double respire autour du pli : ±8px de cisaillement */
  const yPageG = useTransform([souffle, porte], ([p, g]: number[]) => g * p * -8)
  const yPageD = useTransform([souffle, porte], ([p, g]: number[]) => g * p * 8)
  /* les équations au fusain dérivent (matière) — leur rotate CSS migre
     ICI : un transform inline écrase toujours la feuille de style */
  const yEq1 = useTransform([souffle, porte], ([p, g]: number[]) => g * p * -26)
  const yEq2 = useTransform([souffle, porte], ([p, g]: number[]) => g * p * -16)
  const yEq3 = useTransform([souffle, porte], ([p, g]: number[]) => g * p * 20)
  /* la couche du correcteur flotte au-dessus de la copie */
  const yRouge = useTransform([souffle, porte], ([p, g]: number[]) => g * p * -12)
  /* le néon balaie la copie (JOUR peint, NUIT vaut none — transform
     pur sur sa propre couche, compositor) */
  const yHalo = useTransform([souffle, porte], ([p, g]: number[]) => g * p * 120)

  /* la main n'existe qu'au pointeur fin — au tactile, tout est posé */
  const [pointeurFin, setPointeurFin] = useState(false)
  useEffect(() => {
    setPointeurFin(matchMedia("(hover: hover) and (pointer: fine)").matches)
  }, [])

  const EASE = [0.22, 1, 0.36, 1] as const
  /* l'impression : la structure paraît d'un bloc, brève */
  const imprime = (delai = 0) => ({
    initial: reduit ? false : ({ opacity: 0 } as const),
    whileInView: { opacity: 1 },
    viewport: { once: true, amount: 0.35 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.35, delay: delai, ease: EASE },
  })
  /* l'encre s'écrit : repli contractuel (fix round 1) — motion 12.43
     n'anime le clip-path via whileInView dans AUCUNE forme testée (ni
     insets négatifs, ni positifs, cf. sonde diagnostic) ; balayage
     opacity+x à la place. JAMAIS posé sur un élément à transform CSS/
     MotionValue — vérifié pour chaque site d'usage (uc-seuil, uc-ctx p,
     wrapper travail, li programme, p résultat : aucun n'a de transform). */
  const ecrit = (delai = 0) => ({
    initial: reduit ? false : ({ opacity: 0, x: -8 } as const),
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, amount: 0.35 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.9, delay: delai, ease: "easeOut" as const },
  })
  /* la correction tombe APRÈS coup — le geste du tampon ESTIA */
  const corrige = (delai = 0) => ({
    initial: reduit ? false : ({ opacity: 0, scale: 1.3 } as const),
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, amount: 0.6 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.18, delay: delai, ease: "easeOut" as const },
  })
  /* le trait tiré à la règle */
  const trace = (delai = 0) => ({
    initial: reduit ? false : ({ scaleX: 0 } as const),
    whileInView: { scaleX: 1 },
    viewport: { once: true, amount: 0.5 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.6, delay: delai, ease: EASE },
    style: { transformOrigin: "left center" } as const,
  })

  return (
    <section id="cpge" data-univers="cpge" className="uc" aria-labelledby="pc-titre-cpge">
      {/* la craie (NUIT) : rugosité des bords par déplacement fractal —
          définition locale au document, référencée par cpge.css
          (filter: url(#uc-craie)). Région large : les débords des
          pièces (soulignement, coches) ne doivent pas être rognés. */}
      <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="uc-craie" x="-15%" y="-25%" width="130%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="2" seed="7" result="grain" />
            <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* le grain FORT des grands traits : ondulation plus large,
              déplacement plus franc — le geste de la main se lit sur
              le display, les têtes, la barre, le tampon */}
          <filter id="uc-craie-forte" x="-15%" y="-25%" width="130%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="2" seed="11" result="grain" />
            <feDisplacementMap in="SourceGraphic" in2="grain" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div className="uc-copie" ref={copie}>
        <motion.div className="uc-halo" aria-hidden="true" style={{ y: yHalo }}></motion.div>
        <div className="uc-pli" aria-hidden="true"></div>
        <div className="uc-marge-g" aria-hidden="true"></div>
        <div className="uc-marge-d" aria-hidden="true"></div>

        {/* ---- page de gauche (respire autour du pli) ---- */}
        <motion.div className="uc-page" style={{ y: yPageG }}>
          {/* l'en-tête de copie EST le cartouche : identité + les trois
              besoins de navigation de l'univers */}
          <motion.dl className="uc-piece uc-entete" {...imprime(0)}>
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
          </motion.dl>

          {/* le seuil : la première ligne de la copie — elle s'écrit,
              puis le correcteur souligne, après coup */}
          <motion.p className="uc-piece uc-seuil" {...ecrit(0)}>
            {c.seuil}
            <motion.svg
              className="uc-souligne"
              aria-hidden="true"
              viewBox="0 0 320 12"
              preserveAspectRatio="none"
              initial={reduit ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.9 }}
              transition={reduit ? { duration: 0 } : { duration: 0.5, delay: 1.0, ease: "easeOut" }}
              style={{ transformOrigin: "left center", rotate: -0.5 }}
            >
              <path d="M2,7 Q10,2 18,7 Q26,12 34,7 Q42,2 50,7 Q58,12 66,7 Q74,2 82,7 Q90,12 98,7 Q106,2 114,7 Q122,12 130,7 Q138,2 146,7 Q154,12 162,7 Q170,2 178,7 Q186,12 194,7 Q202,2 210,7 Q218,12 226,7 Q234,2 242,7 Q250,12 258,7 Q266,2 274,7 Q282,12 290,7 Q298,2 306,7 Q312,10 318,6" />
            </motion.svg>
          </motion.p>

          {/* I. CONTEXTE */}
          <div className="uc-piece uc-ctx">
            <motion.div className="uc-tete-q" {...trace(0)}><b aria-hidden="true">I.</b><h3>{t(lang, "fpContexte")}</h3></motion.div>
            <motion.p {...ecrit(0.15)}>{c.contexte}</motion.p>
          </div>

          {/* III. CE QUI RESTE — travaux[0] */}
          <div className="uc-piece uc-travail">
            <motion.div className="uc-tete-q" {...trace(0)}><b aria-hidden="true">III.</b><h3>{t(lang, "ucCeQuiReste")}</h3></motion.div>
            <motion.div {...ecrit(0.15)}>
              <h4>{c.travaux[0].titre}</h4>
              <p>{c.travaux[0].texte}</p>
            </motion.div>
            <motion.span className="uc-annote" aria-hidden="true" style={{ rotate: -2.2 }} {...corrige(0.9)}>
              <i>✓✓</i> <span className="uc-main">{t(lang, "ucMetier")}</span>
            </motion.span>
          </div>

          <motion.span className="uc-piece uc-eq uc-eq3" aria-hidden="true" style={{ y: yEq3, rotate: 0.7 }}>{EQUATIONS[2]}</motion.span>
          <motion.span className="uc-piece uc-ne-pas-effacer mono" aria-hidden="true" {...imprime(0.2)}>{t(lang, "ucNePasEffacer")}</motion.span>
          <motion.span className="uc-piece uc-no-page uc-p1 mono mono-xs" aria-hidden="true" {...imprime(0)}>— 1 —</motion.span>
        </motion.div>

        {/* ---- page de droite (respire en sens inverse) ---- */}
        <motion.div className="uc-page" style={{ y: yPageD }}>
          {/* le cadre réservé (imprimé, JOUR) — et le correcteur écrit dedans */}
          <motion.div className="uc-piece uc-reserve" aria-hidden="true" {...imprime(0)}>
            <span className="mono mono-xs">{t(lang, "ucCadreReserve")}</span>
          </motion.div>
          {/* la correction tombe après l'impression — et flotte au-dessus
              de la copie au scroll (yRouge ; rotate migré de la CSS) */}
          <motion.div className="uc-piece uc-verdict" style={{ y: yRouge, rotate: -2.6 }} {...corrige(0.5)}>
            {/* l'ellipse encercle les DEUX lignes du verdict — un cercle
                qui ne ferme que la première ne fait pas propre (retour
                Hugo 2026-08-13) */}
            <svg aria-hidden="true" viewBox="0 0 340 106" preserveAspectRatio="none">
              <path d="M22,53 Q18,16 88,11 Q180,2 294,15 Q336,22 332,54 Q331,88 252,97 Q140,108 54,94 Q16,84 22,56" />
            </svg>
            <span className="uc-main">{t(lang, "ucVerdict")}</span>
            <span className="mono mono-xs">{t(lang, "ucVoir")} · {findePeriode}</span>
          </motion.div>

          <motion.span className="uc-piece uc-eq uc-eq1" aria-hidden="true" style={{ y: yEq1, rotate: -0.8 }}>{EQUATIONS[0]}</motion.span>

          {/* II. PROGRAMME */}
          <div className="uc-piece uc-prog">
            <motion.div className="uc-tete-q" {...trace(0)}><b aria-hidden="true">II.</b><h3>{t(lang, "fpProgramme")}</h3></motion.div>
            <ol>
              {c.programme.map((ligne, i) => {
                const coupe = scinde(ligne)
                return (
                  <motion.li key={ligne} {...ecrit(0.12 + i * 0.14)}>
                    <i aria-hidden="true">{i + 1}.</i>
                    <p>{coupe ? (<><b>{coupe[0]}</b>{coupe[1]}{coupe[2]}</>) : ligne}</p>
                  </motion.li>
                )
              })}
            </ol>
            <motion.span className="uc-coche uc-main" aria-hidden="true" style={{ rotate: -4 }} {...corrige(0.85)}>✓✓</motion.span>
          </div>

          <motion.span className="uc-piece uc-eq uc-eq2" aria-hidden="true" style={{ y: yEq2, rotate: -1.6 }}>{EQUATIONS[1]}</motion.span>

          {/* le barème : les compétences */}
          <motion.div className="uc-piece uc-bareme" {...imprime(0.1)}>
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
          </motion.div>

          <motion.span className="uc-piece uc-no-page uc-p2 mono mono-xs" aria-hidden="true" {...imprime(0)}>— 2 —</motion.span>
        </motion.div>

        {/* ---- pièces sur la pliure (hors respiration des pages) ---- */}
        <header className="uc-piece uc-titre">
          <motion.div className="uc-barre" aria-hidden="true" {...trace(0)}></motion.div>
          <motion.h2 id="pc-titre-cpge" className="uc-nom" {...imprime(0.15)}>{c.nom}</motion.h2>
          <motion.span className="jp uc-jp-v" lang="ja" {...imprime(0.3)}>{c.jp}</motion.span>
          <motion.div className="uc-titre-ligne" {...imprime(0.25)}>
            <p className="uc-intitule">{c.intitule}</p>
            <span className="mono mono-xs dim">{c.periode}</span>
          </motion.div>
        </header>

        {c.resultat && (
          <motion.div className="uc-piece uc-resultat" {...imprime(0)}>
            <span className="mono mono-xs dim">{t(lang, "ucResultatEncadre")}</span>
            <motion.p {...ecrit(0.25)}>{c.resultat}</motion.p>
            <motion.p className="uc-suite dim" {...ecrit(0.6)}>{t(lang, "ucSuite")}</motion.p>
          </motion.div>
        )}

        {/* le tampon du visa : il tombe après coup, MORD sur l'encadré —
            APRÈS lui dans le DOM, obligatoirement : l'encadré vit hors
            des couches de respiration (contextes d'empilement), un
            z-index dans la page droite ne le battrait jamais (retour
            Hugo 2026-08-13 : le tampon passait dessous). Il garde sa
            respiration yRouge et se réimprime sous la main. */}
        <motion.div
          className="uc-piece uc-tampon"
          role="img"
          aria-label={`${c.etat} — ${findePeriode}`}
          style={{ y: yRouge, rotate: -6 }}
          whileTap={pointeurFin && !reduit ? { scale: 0.92 } : undefined}
          whileHover={pointeurFin && !reduit ? { rotate: -4 } : undefined}
          {...corrige(0.85)}
        >
          <b>{c.etat}</b>
          <span>{findePeriode} — {t(lang, "ueVisa")}</span>
        </motion.div>

        <div className="uc-rail" aria-hidden="true"><i></i><i className="r"></i></div>
      </div>
    </section>
  )
}
