"use client"

import { useEffect, useRef } from "react"
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react"
import type { Lang } from "./dict"
import { t } from "./dict"
import { ThemeToggle } from "./theme-toggle"

/* Le code-barres est décoratif : une suite de barres stable, pas un
   vrai EAN. Motif figé en dur pour qu'il soit identique serveur et
   client. Une seule barre est allumée, à une position volontairement
   non centrée — c'est la barre de contrôle d'une planche
   d'imprimerie, une anomalie de fabrication, pas un ornement. */
const BARS = "1021120110210112012101102110210112011021201102101120210110211201021"
const KEY_BAR = 23

/* L'axe du parcours est un vrai axe : la position d'une étape est sa
   date, pas son rang. 2022 → 0 %, 2026 → 100 %. */
const AXIS_FROM = 2022
const AXIS_TO = 2026

export function Plaque({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const root = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start start", "end start"],
  })

  /* Doctrine de l'issue #9 (cf. planche.css, ACCESSIBILITÉ) : la
     plongée de la plaque est du mouvement que le scroll CAUSE, pas un
     état de lecture — sous `reduce`, elle se coupe. Même porte
     multiplicative que world.tsx : `useReducedMotion()` rend null au
     SSR puis un booléen, on ne branche jamais un hook dessus, on
     l'injecte dans une MotionValue. Sous `reduce`, `prog` vaut 0 en
     permanence — la plaque défile comme un contenu ordinaire. */
  const reduit = useReducedMotion()
  const gate = useMotionValue(1)
  useEffect(() => {
    gate.set(reduit ? 0 : 1)
  }, [reduit, gate])
  const prog = useTransform([scrollYProgress, gate] as MotionValue<number>[], ([v, g]) => (v as number) * (g as number))

  /* La plaque ne « fade » plus : elle S'ENFONCE. Le fondu s'arrête à
     0,15 — le résidu visible derrière elle est précisément ce qui
     fait la continuité avec le décor. Sans lui on retombe sur un
     cross-fade. */
  const depth = useTransform(prog, [0, 1], [0, -180])
  const scale = useTransform(prog, [0, 1], [1, 0.88])
  const fade = useTransform(prog, [0, 0.62, 1], [1, 0.5, 0.15])
  /* Le flou est QUANTIFIÉ au pixel entier. Un `filter: blur()` qui
     varie en continu re-rastérise toute la plaque à chaque frame :
     c'était de loin le poste le plus cher de la page (p90 17ms
     contre 8ms sans lui). Par paliers de 1px il n'y a plus que
     quatre rastérisations sur toute la transition — et un saut d'un
     pixel de flou, sur un élément qui s'efface et recule, est
     invisible. */
  const blur = useTransform(prog, (v) => `blur(${Math.round(v * 4)}px)`)

  /* La réflexion du chrome suit le scroll ET le pointeur.
     1,6em = deux cycles du motif : l'horizon traverse deux fois.

     CONTINUE depuis le retour Hugo (#13) : les pas de 0,04em — posés
     contre un scintillement Firefox — se VOYAIENT au défilement, le
     reflet avançait image par image. Chaque changement de --chrome-y
     repeint le dégradé à travers les glyphes (background-clip: text) ;
     en continu c'est une repeinture par frame de scroll DE CE SEUL
     ÉLÉMENT, mesurée au banc du même jour : la campagne titre reste
     dans la bande témoin. Si le scintillement Firefox revient, le
     remède sera un arrondi FIN (0,005em), pas les gros pas. */
  const chromeYBrut = useTransform(prog, [0, 1], [0, 1.6])
  const chromeY = useTransform(chromeYBrut, (v) => v.toFixed(4) + "em")

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0

    /* La boucle ne tourne que tant que la position converge. Une
       boucle rAF permanente, en plus de celle de Lenis, écrit trois
       custom properties par frame pendant toute la vie de la page —
       y compris quand la plaque est sortie de l'écran. */
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1
      ty = (e.clientY / window.innerHeight) * 2 - 1
      wake()
    }

    const tick = () => {
      // lissage : la profondeur ne doit jamais suivre le curseur au
      // pixel près
      cx += (tx - cx) * 0.06
      cy += (ty - cy) * 0.06
      // le monde est en position:fixed, hors de la plaque : les
      // variables de pointeur vivent donc sur la racine du document.
      // PAR PAS DE 0,02, et seulement SI la valeur change : une custom
      // property écrite sur la racine invalide le style de tout ce qui
      // la consomme (sol, arcs), et --chrome-x repeint le dégradé du
      // titre à travers ses glyphes. Écrire quatre décimales par frame
      // de souris salissait tout ça pour des déplacements sub-pixel.
      const rootStyle = document.documentElement.style
      const qx = (Math.round(cx * 50) / 50).toFixed(2)
      const qy = (Math.round(cy * 50) / 50).toFixed(2)
      if (rootStyle.getPropertyValue("--px") !== qx) rootStyle.setProperty("--px", qx)
      if (rootStyle.getPropertyValue("--py") !== qy) rootStyle.setProperty("--py", qy)
      // le pointeur incline la réflexion latéralement, comme une
      // surface courbe — celle-ci reste locale à la plaque
      const qcx = (Math.round(cx * 0.22 * 100) / 100).toFixed(2) + "em"
      if (el.style.getPropertyValue("--chrome-x") !== qcx) el.style.setProperty("--chrome-x", qcx)

      // convergé à moins d'un demi-millième : plus rien à écrire
      if (Math.abs(tx - cx) < 0.0005 && Math.abs(ty - cy) < 0.0005) {
        raf = 0
        return
      }
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  /* L'entrée de la plaque est la seule du document à jouer AU CHARGEMENT,
     sans attendre le scroll : c'est donc la révélation la plus visible
     sous `reduce`, et la seule qu'on ait pu mesurer sans faire défiler la
     page (contrôle 23). Le CSS n'atteint pas framer — cf. planche.css,
     ACCESSIBILITÉ. `reduit` est déclaré plus haut, avec la porte. */
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: reduit ? { duration: 0 } : { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] as const },
  })

  const timeline = t(lang, "timeline") as unknown as [string, string][]

  return (
    <section className="plaque" ref={root}>
      {/* La voiture ne vit plus ici : son trajet couvre les trois
          premières feuilles, donc elle est montée au niveau de la page,
          à côté du décor. La garder dans cette section l'aurait enfermée
          dedans — un enfant en `absolute` ne peut pas déborder de trois
          sections, et `.plaque` porte en plus `isolation: isolate`. */}
      <motion.div className="plaque-body" style={{ y: depth, scale, opacity: fade, filter: blur }}>
        {/* — barre d'identification — */}
        <motion.header className="topbar" {...rise(0.15)}>
          <div className="id mono">
            <span>HUGO JUSKOWIAK</span>
            <span className="sep">/</span>
            <span className="dim">{t(lang, "role")}</span>
          </div>
          <div className="id mono">
            <span className="stamp mono mono-xs">
              {t(lang, "stamp")}
              <b>{t(lang, "stampYear")}</b>
            </span>
            <span className="dim mono-sm">{t(lang, "status")}</span>
            <div className="langtoggle mono mono-sm" role="group" aria-label="Langue / Language">
              <button type="button" data-on={lang === "fr"} onClick={() => setLang("fr")} aria-pressed={lang === "fr"}>
                FR
              </button>
              <button type="button" data-on={lang === "en"} onClick={() => setLang("en")} aria-pressed={lang === "en"}>
                EN
              </button>
            </div>
            <ThemeToggle lang={lang} />
          </div>
        </motion.header>

        {/* — rails de gouttière : lus en dernier, ils referment la
              composition par les côtés et donnent au nom une butée — */}
        <div className="rail rail-l mono" aria-hidden="true">
          <span>{t(lang, "railL")}</span>
        </div>
        <div className="rail rail-r mono" aria-hidden="true">
          <span>{t(lang, "railR")}</span>
        </div>

        {/* — la plaque — */}
        <div className="plate">
          {/* mire de repérage : le signe le plus économique de
              « planche technique ». Aucun texte, donc honnête. */}
          <svg className="mire" viewBox="0 0 62 62" aria-hidden="true">
            <g fill="none" stroke="var(--line-3)" strokeWidth="0.75">
              <circle cx="31" cy="31" r="28" strokeDasharray="1.5 3" />
              <circle cx="31" cy="31" r="17" />
              <line x1="31" y1="0" x2="31" y2="62" />
              <line x1="0" y1="31" x2="62" y2="31" />
            </g>
            <circle cx="31" cy="31" r="3" fill="var(--g-700)" />
          </svg>

          {/* règle graduée du parcours : une biographie devient un axe
              mesuré, et le rouge gagne sa première justification
              sémantique — « vous êtes ici » */}
          <motion.div className="scale" {...rise(0.24)} aria-label={t(lang, "timelineLabel")}>
            <div className="scale-rule" aria-hidden="true" />
            {timeline.map(([date, place], i) => {
              const x = ((Number(date) - AXIS_FROM) / (AXIS_TO - AXIS_FROM)) * 100
              const last = i === timeline.length - 1
              /* La date du dict est fractionnaire pour placer le trait au
                 mois ; on n'affiche que l'année. Deux étapes de la même
                 année sont donc deux traits distincts sous un même
                 millésime — et sous 720px le lieu disparaît, d'où le
                 décalage vertical alterné en CSS (sans quoi les deux
                 « 2025 » se chevauchent à 42px d'écart). */
              const year = date.split(".")[0]
              return (
                <div
                  key={date}
                  className={`scale-stop${last ? " now" : ""}`}
                  style={{ left: `${x}%` }}
                  data-align={i === 0 ? "start" : last ? "end" : "mid"}
                  data-row={i % 2}
                >
                  <i />
                  <span className="lbl">
                    <b>{year}</b>
                    <em>{place}</em>
                  </span>
                </div>
              )
            })}
          </motion.div>

          <motion.div className="plate-label mono mono-sm dim" {...rise(0.3)}>
            <span className="bar" />
            <span>{t(lang, "plateLabel")}</span>
          </motion.div>

          <motion.h1 className="name chrome-bed" {...rise(0.42)}>
            {/* Le volume du titre (#13) : la 3D vit sur ce wrapper et
                pas sur le h1 — framer y écrit déjà son transform
                d'entrée, deux écritures se disputeraient la case. */}
            <span className="name-3d">
              <span className="given">HUGO</span>
              <motion.span className="chrome" style={{ ["--chrome-y" as string]: chromeY }}>
                JUSKOWIAK
              </motion.span>
            </span>
          </motion.h1>

          <motion.div className="subline" {...rise(0.56)}>
            <span className="role">{t(lang, "role")}</span>
            <span className="role-jp jp">フルスタック ＆ AI エンジニア</span>
          </motion.div>

          <motion.dl className="spec mono" {...rise(0.68)}>
            {(t(lang, "spec") as unknown as [string, string][]).map(([key, value]) => (
              <div key={key}>
                <dt className="mono-sm">{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </motion.dl>

          {/* blocs satellites : le second est délibérément une marche
              en dessous, pour que la paire ait une direction */}
          <motion.div className="plate-meta" {...rise(0.78)}>
            <div className="aside-block featured">
              <span>{t(lang, "featuredLabel")}</span>
              <h2>{t(lang, "featuredName")}</h2>
              <p>{t(lang, "featuredDesc")}</p>
              <p>{t(lang, "featuredFigures")}</p>
            </div>
            <div className="aside-block offduty">
              <span>{t(lang, "offdutyLabel")}</span>
              <h2>{t(lang, "offdutyName")}</h2>
              <p>{t(lang, "offdutyDesc")}</p>
            </div>
          </motion.div>
        </div>

        {/* — pied — */}
        <motion.div className="plate-foot" {...rise(0.9)}>
          <div className="foot-row">
            <div className="scrollcue mono mono-sm dim">
              <span className="track">
                <i />
              </span>
              <span>{t(lang, "scroll")}</span>
            </div>

            <div className="scrollcue">
              <span className="chevrons" aria-hidden="true">
                {Array.from({ length: 9 }, (_, i) => (
                  <i key={i} style={{ opacity: 1 - i * 0.1 }} />
                ))}
              </span>
              <span className="barcode" aria-hidden="true">
                {BARS.split("").map((c, i) => (
                  <i key={i} className={i === KEY_BAR ? "key" : c === "2" ? "w" : c === "0" ? "t" : undefined} />
                ))}
              </span>
              {/* cartouche 1/2 : pour écrire en rouge, on pose d'abord
                  du papier */}
              <span className="ref">{t(lang, "ref")}</span>
            </div>
          </div>

          <p className="legal">{t(lang, "legal")}</p>
        </motion.div>
      </motion.div>
    </section>
  )
}
