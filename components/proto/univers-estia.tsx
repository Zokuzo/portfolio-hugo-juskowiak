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

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { ANCRES, type Chapitre } from "./chapitres"
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

  const feuille = useRef<HTMLDivElement>(null)
  /* le calque suit le scroll — FONCTION PURE : le F5 en pleine feuille
     rend l'état exact (leçon de l'iris, revue #13) */
  const { scrollYProgress } = useScroll({ target: feuille, offset: ["start end", "end start"] })
  const souleve = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })
  /* porte multiplicative (s'applique à TOUT le scroll-lié) : chaque
     valeur = pose + porte × progression × amplitude. Le SSR rend la
     pose (souleve fige à 0) ; sous reduce, cette même formule ÉCRIT la
     pose — plus de résidu, plus de style={reduit ? undefined : …} à
     entretenir pièce par pièce.
     Naît FERMÉE (0), pas ouverte : le rail (scaleLigne, amplitude
     maximale à p=0) et les lettres B/C (opacité 0,35 à p=0) cuisent
     sinon leur pose « ouverte » au SSR, et un utilisateur reduce voit
     un flash de quelques frames avant que l'effet ci-dessous ne
     referme la porte (relecture, sonde $SCRATCH/sonde-rail-flash.mjs).
     Porte fermée à la naissance : le HTML statique est reduce-safe par
     construction, et les utilisateurs animés engagent le mouvement à
     l'hydratation plutôt que l'inverse — jamais de pose qui se voit
     après coup. */
  const porte = useMotionValue(0)
  useEffect(() => { porte.set(reduit ? 0 : 1) }, [reduit, porte])
  /* la plage démarre EXACTEMENT sur l'état posé (CSS rotate(-4.6deg),
     aucune translation) plutôt qu'à -2,2°/12px : SSR fige scrollYProgress
     à 0, et sous reduce le style motion se foreclot à ce gel — vérifié à
     l'écran (voir rapport Tâche 3) — sans ce recalage le calque restait
     visiblement décalé de la feuille posée de la Tâche 2. Amplitude du
     CAP conservée (-4,2° / -38px), seule l'origine bouge. */
  const rotCalque = useTransform([souleve, porte], ([p, g]: number[]) => -4.6 + g * p * -4.2)
  const yCalque = useTransform([souleve, porte], ([p, g]: number[]) => g * p * -38)

  /* le rail se mesure : scaleY 0,15→1, origine haut — 0,15 en tête de
     lecture (porte ouverte, p=0), plein sous reduce (porte fermée, la
     pose ne doit jamais paraître amputée) */
  const scaleLigne = useTransform([souleve, porte], ([p, g]: number[]) => 1 - g * (1 - p) * 0.85)

  /* les strates dérivent : parallaxe ≤ 20px, pose à 0 — pièces neuves,
     rien à recaler comme pour le calque. Le poché et la liminaire ont
     un tilt CSS existant (-3,2deg / 0,6deg) : framer pilotant x/y sur
     ces pièces écrase leur transform CSS (l'inline gagne toujours sur
     la feuille de style), donc le rotate migre dans le style framer. */
  const yTitre = useTransform([souleve, porte], ([p, g]: number[]) => g * p * -12)
  const yLiminaire = useTransform([souleve, porte], ([p, g]: number[]) => g * p * -18)
  const xPoche = useTransform([souleve, porte], ([p, g]: number[]) => -14 + g * p * 28)

  /* la lampe suit la lecture (JOUR seul — en nuit --ue-lampe vaut none,
     la couche ne peint rien mais continue de se translater sans coût :
     transform pur, compositor) */
  const yLampe = useTransform([souleve, porte], ([p, g]: number[]) => g * p * 90)

  /* les repères savent où tu es : 3 paliers sur la progression brute,
     la porte multiplie l'ATTÉNUATION (pas la présence) — sous reduce
     (g=0) les trois lettres restent à 1, aucune ne s'éteint */
  const opaciteA = useTransform([souleve, porte], ([p, g]: number[]) => (p < 1 / 3 ? 1 : 1 - g * 0.65))
  const opaciteB = useTransform([souleve, porte], ([p, g]: number[]) => (p >= 1 / 3 && p < 2 / 3 ? 1 : 1 - g * 0.65))
  const opaciteC = useTransform([souleve, porte], ([p, g]: number[]) => (p >= 2 / 3 ? 1 : 1 - g * 0.65))

  /* la main n'existe qu'au pointeur fin — au tactile le drag volerait
     le scroll de la page */
  const [pointeurFin, setPointeurFin] = useState(false)
  useEffect(() => {
    setPointeurFin(matchMedia("(hover: hover) and (pointer: fine)").matches)
  }, [])

  const EASE = [0.22, 1, 0.36, 1] as const
  /* un filet qui se trace ; sous reduce : posé (le CSS n'atteint pas
     framer — doctrine planche.css:1570) */
  const traceur = (delai = 0) => ({
    initial: reduit ? false : ({ scaleX: 0 } as const),
    whileInView: { scaleX: 1 },
    viewport: { once: true, amount: 0.5 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.7, delay: delai, ease: EASE },
    style: { transformOrigin: "left center" } as const,
  })
  const encre = (delai = 0) => ({
    initial: reduit ? false : ({ opacity: 0, y: 8 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.35 } as const,
    transition: reduit ? { duration: 0 } : { duration: 0.5, delay: delai, ease: EASE },
  })

  return (
    <section id="estia" data-univers="estia" className="ue" aria-labelledby="pc-titre-estia">
      <div className="ue-tirage">
        <div className="ue-reperes" aria-hidden="true">
          <span className="h" style={{ left: "12.5%" }}>1</span><span className="h" style={{ left: "37.5%" }}>2</span><span className="h" style={{ left: "62.5%" }}>3</span><span className="h" style={{ left: "87.5%" }}>4</span>
          <span className="h b" style={{ left: "12.5%" }}>1</span><span className="h b" style={{ left: "37.5%" }}>2</span><span className="h b" style={{ left: "62.5%" }}>3</span><span className="h b" style={{ left: "87.5%" }}>4</span>
          <motion.span className="v" style={{ top: "16.6%", opacity: opaciteA }}>A</motion.span><motion.span className="v" style={{ top: "50%", opacity: opaciteB }}>B</motion.span><motion.span className="v" style={{ top: "83.3%", opacity: opaciteC }}>C</motion.span>
          <motion.span className="v d" style={{ top: "16.6%", opacity: opaciteA }}>A</motion.span><motion.span className="v d" style={{ top: "50%", opacity: opaciteB }}>B</motion.span><motion.span className="v d" style={{ top: "83.3%", opacity: opaciteC }}>C</motion.span>
        </div>
        <div className="ue-emulsion" ref={feuille}>
          <motion.div className="ue-lampe" aria-hidden="true" style={{ y: yLampe }}></motion.div>
          <motion.div className="ue-poche" aria-hidden="true" style={{ x: xPoche, rotate: -3.2 }}></motion.div>

          <svg className="ue-rappels" aria-hidden="true" viewBox="0 0 1210 1830" preserveAspectRatio="none">
            <line x1="650" y1="390" x2="548" y2="330"></line>
            <circle cx="650" cy="390" r="2.5"></circle>
            <line x1="660" y1="812" x2="620" y2="885"></line>
            <circle cx="660" cy="812" r="2.5"></circle>
          </svg>

          <motion.aside className="ue-piece ue-liminaire" style={{ y: yLiminaire, rotate: 0.6 }} {...encre(0)}>
            <span className="mono mono-xs dim">{t(lang, "ueNote")}</span>
            {c.seuil}
          </motion.aside>

          <motion.header className="ue-piece ue-elevation" style={{ y: yTitre }}>
            <motion.p className="ue-cote mono mono-xs" {...traceur()}><i aria-hidden="true">⟨</i>{c.periode}<i aria-hidden="true">⟩</i></motion.p>
            <h2 id="pc-titre-estia" className="ue-nom">{c.nom}</h2>
            <div className="ue-el-ligne">
              <span className="jp ue-el-jp" lang="ja">{c.jp}</span>
              <span className="mono mono-xs dim">{c.cadre} · {c.etat}</span>
            </div>
            <p className="ue-el-sous">{c.intitule}</p>
          </motion.header>

          <div className="ue-piece ue-cote-v" aria-hidden="true">
            <motion.span className="ue-cote-v-rail" style={{ scaleY: scaleLigne }}></motion.span>
            <span className="ue-cote-v-label">{t(lang, "ueRail")}</span>
          </div>

          <motion.div className="ue-piece ue-ctx" {...encre(0.04)}>
            <motion.div className="ue-vue-tete" {...traceur()}>
              <span className="ue-vue" aria-hidden="true"><i>A</i><b>{c.numero}</b></span>
              <h3>{t(lang, "fpContexte")}</h3>
              <span className="ue-fil" aria-hidden="true"></span>
            </motion.div>
            <p>{c.contexte}</p>
          </motion.div>

          <motion.div className="ue-piece ue-prog" {...encre(0.08)}>
            <motion.div className="ue-vue-tete" {...traceur()}>
              <span className="ue-vue" aria-hidden="true"><i>B</i><b>{c.numero}</b></span>
              <h3>{t(lang, "fpProgramme")}</h3>
            </motion.div>
            <ul>
              {c.programme.map((ligne) => (
                <li key={ligne}>{ligne}</li>
              ))}
            </ul>
          </motion.div>

          <motion.article className="ue-piece ue-detail ue-d01" {...encre(0.12)}>
            <span className="mono mono-xs dim">{t(lang, "ueDetail")} D-01 · {t(lang, "fpTravaux")}</span>
            <h4>{c.travaux[0].titre}</h4>
            <p>{c.travaux[0].texte}</p>
          </motion.article>

          <motion.article className="ue-piece ue-detail ue-d02" aria-hidden="true" {...encre(0.16)}>
            <span className="mono mono-xs dim">{t(lang, "ueDetail")} D-02 — {t(lang, "ueVoirCalque")}</span>
            <h4>{c.travaux[1].titre}</h4>
            <p>{t(lang, "ueGhost")}</p>
          </motion.article>

          <motion.article className="ue-piece ue-detail ue-d03" {...encre(0.2)}>
            <svg className="ue-nuage" viewBox="0 0 420 240" preserveAspectRatio="none" aria-hidden="true">
              <motion.path
                d="M30,30 Q45,8 62,26 Q80,4 98,24 Q118,4 136,24 Q156,4 174,24 Q194,6 212,26 Q232,6 250,26 Q270,8 288,26 Q308,8 326,28 Q346,10 362,30 Q382,16 388,42 Q404,52 392,72 Q408,88 392,106 Q406,124 390,140 Q404,158 386,172 Q398,192 378,200 Q368,222 346,210 Q330,230 310,214 Q292,232 272,214 Q252,232 232,214 Q212,232 192,214 Q172,230 152,212 Q132,228 112,210 Q92,226 74,208 Q52,220 44,198 Q22,192 30,170 Q12,156 28,138 Q12,120 30,104 Q14,86 32,70 Q18,52 30,30 Z"
                initial={reduit ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={reduit ? { duration: 0 } : { duration: 1.2, ease: "easeInOut" }}
              ></motion.path>
              {/* l'entrée du MBDS — la date de la révision au plan, dérivée du dict (M-2) */}
              <text x="330" y="16">{t(lang, "ueRev")} {t(lang, "ueRevDate")}</text>
            </svg>
            <span className="mono mono-xs dim">{t(lang, "ueDetail")} D-03 — {t(lang, "ueSecondeVoie")}</span>
            <h4>{c.travaux[2].titre}</h4>
            <p>{c.travaux[2].texte}</p>
          </motion.article>

          {/* le tirage épinglé (tâche 6) — encre one-shot seulement,
              posé dans le vide du tiers C : aucun mouvement scroll-lié
              ajouté, la porte multiplicative ne le touche pas */}
          {c.photos && (
            <motion.figure className="ue-piece ue-photo" {...encre(0.3)}>
              <img
                src={c.photos[0].src}
                alt={c.photos[0].alt}
                width={500}
                height={333}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="mono mono-xs">{c.photos[0].legende}</figcaption>
            </motion.figure>
          )}

          <motion.aside
            className="ue-piece ue-calque"
            style={{ rotate: rotCalque, y: yCalque }}
          >
            {/* le drag vit sur ce div intérieur, jamais sur l'aside : son
                origine 0 est correcte (celle de l'aside est une MotionValue
                dérivée du scroll — dragSnapToOrigin y ramènerait y à 0,
                cassant la pose au relâchement, cf. I-2 de la revue) */}
            <motion.div
              drag={pointeurFin && !reduit}
              dragConstraints={{ left: -14, right: 14, top: -10, bottom: 10 }}
              dragElastic={0.18}
              dragSnapToOrigin
              whileDrag={{ scale: 1.015 }}
              whileHover={pointeurFin && !reduit ? { rotate: -2.5 } : undefined}
            >
              <span className="mono mono-xs dim">{t(lang, "ueCalque")} — {t(lang, "ueDetail")} D-02 · {t(lang, "ueEchappee")}</span>
              <h4>{c.travaux[1].titre}</h4>
              <p>{c.travaux[1].texte}</p>
              <span className="jp ue-calque-jp" lang="ja">{t(lang, "ueCalqueJp")}</span>
            </motion.div>
          </motion.aside>

          {c.resultat && (
            <motion.p className="ue-piece ue-resultat" {...encre(0.24)}>
              <span className="mono mono-xs dim">{t(lang, "fpResultat")}</span>
              {c.resultat}
            </motion.p>
          )}

          <motion.div className="ue-piece ue-nomenclature" {...encre(0.28)}>
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
            {c.marques && (
              <figure className="ue-homologations">
                <figcaption className="mono mono-xs dim">{t(lang, "ueHomologations")}</figcaption>
                <img src={c.marques[1].src} alt={c.marques[1].alt} height={32} loading="lazy" />
              </figure>
            )}
          </motion.div>

          <motion.div
            className="ue-piece ue-tampon"
            role="img"
            aria-label={`${c.etat} — ${findePeriode}`}
            initial={reduit ? false : { opacity: 0, scale: 1.35 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={reduit ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
          >
            <b>{c.etat}</b>
            <span>{findePeriode} — {t(lang, "ueVisa")}</span>
          </motion.div>

          {/* le cartouche est la navigation de l'univers : langue, thème, sortie */}
          <motion.dl className="ue-piece ue-cartouche" {...encre(0.32)}>
            <div><dt>{t(lang, "ueProjet")}</dt><dd>{t(lang, "pcTitre")} — CH.{c.numero} / {String(ANCRES.length).padStart(2, "0")}</dd></div>
            <div><dt>{t(lang, "ueObjet")}</dt><dd>{c.nom}</dd></div>
            <div><dt>{t(lang, "ueUnivers")}</dt><dd>{t(lang, "ueUniversNom")}</dd></div>
            <div><dt>{t(lang, "ueEchelle")}</dt><dd>{t(lang, "ueEchelleVal")}</dd></div>
            {c.lien && (
              <div>
                <dt>{t(lang, "ueEcole")}</dt>
                <dd className="ue-nav">
                  <img className="ue-logo" src={c.marques![0].src} alt="" height={16} />
                  <a
                    href={c.lien.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={c.lien.role}
                    className="mono mono-xs ue-sortie"
                  >
                    {new URL(c.lien.url).hostname.replace("www.", "")} <span aria-hidden="true">↗</span>
                  </a>
                </dd>
              </div>
            )}
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
          </motion.dl>
        </div>
      </div>
    </section>
  )
}
