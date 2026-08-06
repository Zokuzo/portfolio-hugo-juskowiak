"use client"

import { useEffect } from "react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react"

/* ==================================================================
   MODÈLE DE CAMÉRA

   Caméra en z = 0, regardant vers +z. Pour une avance normalisée
   t ∈ [0,1] sur toute la page :

     k(z)     = ZREF / z             vitesse de parallaxe (division perspective)
     y(t)     = −TRAVEL · t · k(z)   dérive écran

   Les vitesses ne sont pas choisies au doigt mouillé : elles sortent
   d'une profondeur déclarée. Idem pour l'opacité de chaque plan, qui
   est sa transmittance exp(−z/26) — l'extinction atmosphérique.

   PLUS DE scale(t), ET TOUT EST QUANTIFIÉ. Mesuré sur build de
   production, compositeur logiciel : p50 183 ms/frame en scroll,
   33 ms une fois le monde figé, fil principal à 73 % d'inactivité —
   le coût n'était ni le JS ni la peinture d'un plan, mais la
   RECOMPOSITION : dès qu'UNE valeur change d'un sous-pixel, le groupe
   isolé `.world` perd son cache et ses couches — plusieurs en blend —
   se remélangent plein écran. Soixante fois par seconde, pour des
   déplacements invisibles.

   D'où deux règles, solidaires du CSS :
   — les y de plan et le flow s'arrondissent AU PIXEL, les opacités
     au centième : une valeur qui ne change pas n'est pas réécrite ;
   — chaque plan est promu en couche PERMANENTE (will-change, voir
     planche.css) : une couche stable ne churne pas, et les animations
     continues du compositeur (rotation des arcs) n'y coûtent qu'une
     composition.

   Le scale(t) d'origine (« on traverse ») est supprimé, pas quantifié :
   c'était le plus faible des indices de traversée, et un scale même
   par paliers re-rasterise le plan entier à chaque palier.

   RÈGLE STRUCTURANTE : tout plan plus rapide que le sol doit être une
   texture tuilable, parce qu'il sort du cadre et qu'on ne peut pas
   instancier son remplaçant — il faut pouvoir le boucler par modulo.
   Tout plan à contenu unique (arcs, repères, grille de construction)
   reste donc sous k ≤ 2,4.
   ================================================================== */

const ZREF = 12 // profondeur du sol = plan de référence
const TRAVEL = 120 // px de dérive du plan de référence sur toute la page
const CELL = 78 // pas de la grille du sol — DOIT égaler --cell en CSS
const FLOW_TOTAL = 5200 // px de sol défilés sur toute la page (~67 cellules)
const VEL_CLAMP = 1800 // px/s — au-delà, le couplage vitesse sature
const VEL_LEAD = 0.05 // s d'anticipation du sol sur la vitesse de scroll

const k = (z: number) => ZREF / z

/* En JS, (−5 % 78) vaut −5, pas 73. Sans cette normalisation le
   bouclage saute d'une tuile entière dès que le spring dépasse en
   arrière au-dessus du scroll 0 — visible comme un à-coup. */
const wrap = (v: number, m: number) => ((v % m) + m) % m
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/* Hook de plan. Appelé inconditionnellement et toujours dans le même
   ordre : c'est un vrai hook, pas une factory conditionnelle. */
function usePlane(cam: MotionValue<number>, z: number, wrapAt = 0) {
  const kk = k(z)
  const y = useTransform(cam, (t) => {
    const raw = -TRAVEL * t * kk
    // borné dans [−m, 0) : monotone, avec des sauts d'exactement une
    // tuile, donc invisibles.
    // Arrondi AU PIXEL : une MotionValue qui rend la même valeur
    // n'écrit pas le DOM, et le cache de composition du monde survit.
    return Math.round(wrapAt ? wrap(raw, wrapAt) - wrapAt : raw)
  })
  return { y }
}

export function World() {
  /* useReducedMotion() renvoie null au premier rendu (SSR) puis un
     booléen. On ne s'en sert JAMAIS pour brancher un appel de hook —
     le nombre de hooks varierait entre deux rendus. On l'injecte dans
     une MotionValue multiplicative. */
  const reduce = useReducedMotion()
  const gate = useMotionValue(1)
  useEffect(() => {
    gate.set(reduce ? 0 : 1)
  }, [reduce, gate])

  /* PLUS DE SYSTÈME DE PAS EN JS, ET C'EST UN RETOUR MESURÉ. Une
     première version écrivait dérives et rotation toutes les ~700 ms
     pour laisser les couches se dé-promouvoir entre deux pas. Sur la
     capture de production, chaque pas produisait un FLASH sombre d'une
     frame — luminance moyenne 34 → 21 → 34 — à la période exacte des
     700 ms : en se re-créant, la couche en mix-blend-mode perd sa
     contribution pendant une frame. C'était le « flickering ».

     L'architecture finale est l'inverse : couches promues EN
     PERMANENCE (will-change, voir planche.css) et animations continues
     du compositeur. Depuis que les textures sont des bitmaps cuits et
     que la rotation des arcs vit sur les <svg> racines, une animation
     `linear infinite` sur ces couches ne re-rasterise rien : elle ne
     coûte qu'une composition, et ne churne jamais. */

  /* Lenis (config actuelle) scrolle réellement la fenêtre, donc
     useScroll() sans target voit tout. S'il passait un jour en mode
     transform sur un wrapper, il faudrait lui passer { container }
     ici — sinon la scène se fige sans lever d'erreur. */
  const { scrollY, scrollYProgress } = useScroll()

  /* UN seul spring pour toute la scène : les huit plans en dérivent.
     Les MotionValues écrivent directement dans le DOM, donc zéro
     re-rendu React au scroll quel que soit le nombre de plans.

     Lenis lisse DÉJÀ le scroll : ce ressort est un second lissage
     par-dessus. À 74/30/0,55 sa constante de temps valait 0,40 s —
     le décor décrochait visiblement du contenu. Ramenée à ~0,27 s :
     il reste assez de retard pour que les plans aient de la masse,
     plus assez pour qu'on ait l'impression d'attendre. */
  const smooth = useSpring(scrollYProgress, { stiffness: 112, damping: 30, mass: 0.42 })
  const cam = useTransform([smooth, gate] as MotionValue<number>[], ([s, g]) => (s as number) * (g as number))

  /* PLUS DE BRUME. Les trois nappes (profonde, médiane, écharpe) et
     leur système de densité sont retirés sur demande : le décor se lit
     à nu — grille, arcs, repères, poussière, grain. Le grain, dont
     l'opacité compensait l'éclaircissement de la brume, redevient une
     constante en CSS. */

  /* Opacités au CENTIÈME, même logique que l'arrondi des y : un fondu
     qui varie de 0,0003 par frame salit la couche pour rien. */
  const cent = (x: number) => Math.round(x * 100) / 100

  /* Le scrim restaure le plancher de contraste sous le texte. Faible
     sur la plaque (fond quasi nu), fort sur le tracé où le schéma
     doit rester lisible sous le contenu. */
  const scrimBrut = useTransform(scrollYProgress, [0, 0.18, 0.3, 1], [0.1, 0.28, 0.66, 0.6])
  const scrimO = useTransform(scrimBrut, cent)

  /* wrapAt = période de tuilage. 0 = contenu unique, pas de bouclage. */
  const pVoid = usePlane(cam, 100)
  const pArcs = usePlane(cam, 30)
  const pFloor = usePlane(cam, 12)
  const pMarks = usePlane(cam, 8)
  const pRules = usePlane(cam, 5)
  const pStruts = usePlane(cam, 2.6, 240)
  const pDust = usePlane(cam, 1, 240)

  /* Avance au sol : défilement de base + anticipation couplée à la
     vitesse de scroll. C'est le signal « on avance » le plus fort du
     dispositif et il coûte un useTransform.
     useVelocity crache des pics de plusieurs milliers de px/s et
     change de signe au relâchement : on amortit PUIS on clampe. */
  const vel = useVelocity(scrollY)
  const velS = useSpring(vel, { stiffness: 110, damping: 46, mass: 0.5 })
  const flow = useTransform([cam, velS, gate] as MotionValue<number>[], ([t, v, g]) => {
    const lead = clamp(v as number, -VEL_CLAMP, VEL_CLAMP) * VEL_LEAD * (g as number)
    // modulo CELL : le saut vaut exactement une cellule de grille,
    // donc il est invisible. Défilement infini à coût nul.
    // Au pixel, comme les y de plan — même cache à préserver.
    return Math.round(wrap((t as number) * FLOW_TOTAL + lead, CELL) - CELL)
  })

  /* Balayage inter-sections : un filet de 1px, pas une lueur. */
  const sweepY = useTransform(scrollYProgress, [0.16, 0.3], ["110vh", "-10vh"])
  const sweepO = useTransform(scrollYProgress, [0.16, 0.2, 0.26, 0.3], [0, 0.9, 0.9, 0])

  return (
    <div className="world" aria-hidden="true">
      {/* z100 — atmosphère opaque : socle du groupe d'isolation. Sans
          elle, les mix-blend-mode:screen (grain, poussière) se
          composent contre le backdrop de la page et virent au blanc. */}
      <motion.div className="p-void" style={{ y: pVoid.y }} />

      {/* z30 — instrumentation.
          TROIS SVG EMPILÉS, pas un seul : Firefox re-rasterise le SVG
          entier dès qu'un <g> INTERNE tourne (mesuré : p50 750 ms/frame
          en scroll, 33 sans les arcs), mais met en cache un SVG dont
          c'est l'élément RACINE qui tourne. La rotation par pas écrite
          plus haut vise donc les <svg> eux-mêmes. */}
      <motion.div className="p-arcs" style={{ y: pArcs.y }}>
        <svg className="arcs-c arcs-lent" viewBox="0 0 100 100">
          <g fill="none" stroke="rgba(226,232,240,0.16)" strokeWidth="0.09">
            <circle cx="50" cy="50" r="49" strokeDasharray="0.6 2.4" />
            <circle cx="50" cy="50" r="41" strokeDasharray="14 5 2 5" />
            <circle cx="50" cy="50" r="26.5" />
          </g>
        </svg>
        <svg className="arcs-c arcs-inverse" viewBox="0 0 100 100">
          <g fill="none" stroke="rgba(226,232,240,0.13)" strokeWidth="0.09">
            <circle cx="50" cy="50" r="34" strokeDasharray="40 8" />
            <circle className="ring-sig" cx="50" cy="50" r="18" strokeDasharray="1 3" />
          </g>
        </svg>
        <svg className="arcs-c" viewBox="0 0 100 100">
          <g stroke="rgba(226,232,240,0.1)" strokeWidth="0.09">
            <line x1="50" y1="0.5" x2="50" y2="99.5" strokeDasharray="2 4" />
            <line x1="0.5" y1="50" x2="99.5" y2="50" strokeDasharray="2 4" />
          </g>
        </svg>
      </motion.div>

      {/* z12 — LE SOL. Trois boîtes imbriquées : la perspective ne
          cohabite jamais avec les transforms de framer. */}
      <motion.div className="p-floor" style={{ y: pFloor.y }}>
        <div className="floor-cam">
          <div className="floor-plane">
            <motion.div className="floor-grid" style={{ y: flow }} />
          </div>
        </div>
      </motion.div>

      {/* z8 — repères d'horizon */}
      <motion.div className="p-marks" style={{ y: pMarks.y }}>
        {Array.from({ length: 15 }, (_, i) => (
          <i key={i} className={i === 7 ? "key" : undefined} />
        ))}
      </motion.div>

      {/* z5 — grille de construction */}
      <motion.div className="p-rules" style={{ y: pRules.y }}>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} />
        ))}
      </motion.div>

      {/* z2.6 — entretoises, tuilées 240px */}
      <motion.div className="p-struts" style={{ y: pStruts.y }} />

      {/* z1 — poussière */}
      <motion.div className="p-dust" style={{ y: pDust.y }} />

      {/* — objectif : solidaire de la caméra, jamais parallaxé — */}
      <motion.div className="p-scrim" style={{ opacity: scrimO }} />
      <motion.div className="p-sweep" style={{ y: sweepY, opacity: sweepO }} />
      {/* opacité constante en CSS : elle ne compensait que la brume */}
      <div className="p-grain" />
      <div className="p-vignette" />
    </div>
  )
}
