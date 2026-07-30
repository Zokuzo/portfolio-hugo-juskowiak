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
} from "framer-motion"

/* ==================================================================
   MODÈLE DE CAMÉRA

   Caméra en z = 0, regardant vers +z. Pour une avance normalisée
   t ∈ [0,1] sur toute la page :

     k(z)     = ZREF / z             vitesse de parallaxe (division perspective)
     y(t)     = −TRAVEL · t · k(z)   dérive écran
     scale(t) = 1 + GROW · t · k(z)  on TRAVERSE, on ne glisse pas

   Les vitesses ne sont pas choisies au doigt mouillé : elles sortent
   d'une profondeur déclarée. Idem pour l'opacité de chaque plan, qui
   est sa transmittance exp(−z/26) — l'extinction dans la brume.

   RÈGLE STRUCTURANTE : tout plan plus rapide que le sol doit être une
   texture tuilable, parce qu'il sort du cadre et qu'on ne peut pas
   instancier son remplaçant — il faut pouvoir le boucler par modulo.
   Tout plan à contenu unique (arcs, repères, grille de construction)
   reste donc sous k ≤ 2,4.
   ================================================================== */

const ZREF = 12 // profondeur du sol = plan de référence
const TRAVEL = 120 // px de dérive du plan de référence sur toute la page
const GROW = 0.045 // croissance du plan de référence sur toute la page
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
    return wrapAt ? wrap(raw, wrapAt) - wrapAt : raw
  })
  const scale = useTransform(cam, (t) => 1 + GROW * t * kk)
  return { y, scale }
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

  /* Lenis (config actuelle) scrolle réellement la fenêtre, donc
     useScroll() sans target voit tout. S'il passait un jour en mode
     transform sur un wrapper, il faudrait lui passer { container }
     ici — sinon la scène se fige sans lever d'erreur. */
  const { scrollY, scrollYProgress } = useScroll()

  /* UN seul spring pour toute la scène : les onze plans en dérivent.
     Les MotionValues écrivent directement dans le DOM, donc zéro
     re-rendu React au scroll quel que soit le nombre de plans.

     Lenis lisse DÉJÀ le scroll : ce ressort est un second lissage
     par-dessus. À 74/30/0,55 sa constante de temps valait 0,40 s —
     le décor décrochait visiblement du contenu. Ramenée à ~0,27 s :
     il reste assez de retard pour que les plans aient de la masse,
     plus assez pour qu'on ait l'impression d'attendre. */
  const smooth = useSpring(scrollYProgress, { stiffness: 112, damping: 30, mass: 0.42 })
  const cam = useTransform([smooth, gate] as MotionValue<number>[], ([s, g]) => (s as number) * (g as number))

  /* Densité de brume — la continuité inter-sections.
     On ne fait pas un fondu, on traverse des bancs : la densité monte
     pendant que la plaque recule, puis redescend quand le tracé
     arrive. On ressort de l'autre côté et le schéma se résout. */
  const fogD = useTransform(scrollYProgress, [0, 0.1, 0.22, 0.34, 0.52, 0.72, 1], [0.5, 0.78, 1.18, 0.72, 1.05, 0.62, 0.5])

  const fogDeepO = useTransform(fogD, (d) => 0.5 * d)
  const fogMidO = useTransform(fogD, (d) => 0.58 * d)
  const fogNearO = useTransform(fogD, (d) => 0.07 * d)

  /* Le grain est en screen : dès que la brume éclaircit le fond il
     tourne au lait. Son opacité est donc l'inverse de la densité. */
  const grainO = useTransform(fogD, [0.5, 1.25], [0.095, 0.04])

  /* Le scrim restaure le plancher de contraste sous le texte. Faible
     sur la plaque (fond quasi nu), fort sur le tracé où le schéma
     doit se lire à travers la brume. */
  const scrimO = useTransform(scrollYProgress, [0, 0.18, 0.3, 1], [0.1, 0.28, 0.66, 0.6])

  /* wrapAt = période de tuilage. 0 = contenu unique, pas de bouclage. */
  const pVoid = usePlane(cam, 100)
  const pFogDeep = usePlane(cam, 46, 1400)
  const pArcs = usePlane(cam, 30)
  const pFogMid = usePlane(cam, 18)
  const pFloor = usePlane(cam, 12)
  const pMarks = usePlane(cam, 8)
  const pRules = usePlane(cam, 5)
  const pStruts = usePlane(cam, 2.6, 240)
  const pFogNear = usePlane(cam, 1.4, 1500)
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
    return wrap((t as number) * FLOW_TOTAL + lead, CELL) - CELL
  })

  /* Balayage inter-sections : un filet de 1px, pas une lueur. */
  const sweepY = useTransform(scrollYProgress, [0.16, 0.3], ["110vh", "-10vh"])
  const sweepO = useTransform(scrollYProgress, [0.16, 0.2, 0.26, 0.3], [0, 0.9, 0.9, 0])

  return (
    <div className="world" aria-hidden="true">
      {/* z100 — atmosphère opaque : socle du groupe d'isolation. Sans
          elle, les mix-blend-mode:screen se composent contre le
          backdrop de la page et la brume vire au blanc plein. */}
      <motion.div className="p-void" style={{ y: pVoid.y, scale: pVoid.scale }} />

      {/* z46 — brume profonde : DEVANT l'atmosphère, DERRIÈRE les arcs.
          `drift-l`/`drift-r` ne sont pas décoratives : elles portent le
          sens de la dérive, et le CSS n'ouvre la marge horizontale que de
          ce côté-là. Retirer la classe retire l'animation ET la marge. */}
      <motion.div className="p-fog-deep" style={{ y: pFogDeep.y, scale: pFogDeep.scale, opacity: fogDeepO }}>
        <div className="fog-sheet fog-lit drift-l" />
        <div className="fog-sheet fog-occl drift-l" />
      </motion.div>

      {/* z30 — instrumentation, déjà mangée par la nappe précédente */}
      <motion.svg className="p-arcs" viewBox="0 0 100 100" style={{ y: pArcs.y, scale: pArcs.scale }}>
        <g className="spin-slow" fill="none" stroke="rgba(226,232,240,0.16)" strokeWidth="0.09">
          <circle cx="50" cy="50" r="49" strokeDasharray="0.6 2.4" />
          <circle cx="50" cy="50" r="41" strokeDasharray="14 5 2 5" />
          <circle cx="50" cy="50" r="26.5" />
        </g>
        <g className="spin-rev" fill="none" stroke="rgba(226,232,240,0.13)" strokeWidth="0.09">
          <circle cx="50" cy="50" r="34" strokeDasharray="40 8" />
          <circle className="ring-sig" cx="50" cy="50" r="18" strokeDasharray="1 3" />
        </g>
        <g stroke="rgba(226,232,240,0.1)" strokeWidth="0.09">
          <line x1="50" y1="0.5" x2="50" y2="99.5" strokeDasharray="2 4" />
          <line x1="0.5" y1="50" x2="99.5" y2="50" strokeDasharray="2 4" />
        </g>
      </motion.svg>

      {/* z18 — brume médiane : deux échelles de rapport non entier en
          sens inverse, l'interférence détruit la périodicité */}
      <motion.div className="p-fog-mid" style={{ y: pFogMid.y, scale: pFogMid.scale, opacity: fogMidO }}>
        <div className="fog-sheet fog-lit sheet-a drift-l" />
        <div className="fog-sheet fog-occl sheet-b drift-r" />
      </motion.div>

      {/* z12 — LE SOL. Trois boîtes imbriquées : la perspective ne
          cohabite jamais avec les transforms de framer. */}
      <motion.div className="p-floor" style={{ y: pFloor.y, scale: pFloor.scale }}>
        <div className="floor-cam">
          <div className="floor-plane">
            <motion.div className="floor-grid" style={{ y: flow }} />
          </div>
        </div>
      </motion.div>

      {/* z8 — repères d'horizon */}
      <motion.div className="p-marks" style={{ y: pMarks.y, scale: pMarks.scale }}>
        {Array.from({ length: 15 }, (_, i) => (
          <i key={i} className={i === 7 ? "key" : undefined} />
        ))}
      </motion.div>

      {/* z5 — grille de construction */}
      <motion.div className="p-rules" style={{ y: pRules.y, scale: pRules.scale }}>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} />
        ))}
      </motion.div>

      {/* z2.6 — entretoises, tuilées 240px */}
      <motion.div className="p-struts" style={{ y: pStruts.y, scale: pStruts.scale }} />

      {/* z1.4 — écharpe qui passe l'objectif : c'est elle qui fait
          « on traverse » plutôt que « ça glisse » */}
      <motion.div className="p-fog-near" style={{ y: pFogNear.y, scale: pFogNear.scale, opacity: fogNearO }} />

      {/* z1 — poussière */}
      <motion.div className="p-dust" style={{ y: pDust.y, scale: pDust.scale }} />

      {/* — objectif : solidaire de la caméra, jamais parallaxé — */}
      <motion.div className="p-scrim" style={{ opacity: scrimO }} />
      <motion.div className="p-sweep" style={{ y: sweepY, opacity: sweepO }} />
      <motion.div className="p-grain" style={{ opacity: grainO }} />
      <div className="p-vignette" />
    </div>
  )
}
