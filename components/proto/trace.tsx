"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion"
import type { MotionValue } from "framer-motion"
import type { Lang } from "./dict"
import { t } from "./dict"

/* ------------------------------------------------------------
   Géométrie
   Deux dispositions : chaîne horizontale au large, colonne avec
   bus latéral en compact. Même rendu, mêmes étapes.
   ------------------------------------------------------------ */

type Layout = {
  vb: { w: number; h: number }
  box: { w: number; h: number }
  /* position de la i-ème boîte de la chaîne */
  at: (i: number) => { x: number; y: number }
  pool: { x: number; y: number; w: number; h: number }
  /* départ/arrivée de chaque lien de la chaîne */
  link: (i: number) => { x1: number; y1: number; x2: number; y2: number }
  branch: string
  model: (i: number) => { x: number; y: number; w: number }
  /* ordonnée de l'axe gradué — absent en compact, où il ferait
     doublon avec la colonne elle-même */
  axisY?: number
  type: "wide" | "compact"
}

const WIDE: Layout = (() => {
  const box = { w: 176, h: 74 }
  const gap = 36
  const y = 112
  const x = (i: number) => 20 + i * (box.w + gap)
  const pool = { x: x(3), y: 358, w: 470, h: 100 }
  return {
    vb: { w: 1276, h: 516 },
    box,
    at: (i) => ({ x: x(i), y }),
    pool,
    link: (i) => ({ x1: x(i) + box.w, y1: y + box.h / 2, x2: x(i + 1), y2: y + box.h / 2 }),
    branch: `M${x(3) + box.w / 2} ${y + box.h} V${(y + box.h + pool.y) / 2} H${pool.x + pool.w / 2} V${pool.y}`,
    model: (i) => ({ x: pool.x + 14 + i * 108, y: pool.y + 74, w: 96 }),
    axisY: 492,
    type: "wide",
  }
})()

const COMPACT: Layout = (() => {
  const box = { w: 312, h: 74 }
  const gap = 30
  const x = 44
  const y = (i: number) => 20 + i * (box.h + gap)
  const pool = { x, y: 700, w: box.w, h: 172 }
  return {
    vb: { w: 400, h: 900 },
    box,
    at: (i) => ({ x, y: y(i) }),
    pool,
    link: (i) => ({ x1: x + box.w / 2, y1: y(i) + box.h, x2: x + box.w / 2, y2: y(i + 1) }),
    /* bus qui descend dans la gouttière gauche */
    branch: `M${x} ${y(3) + box.h / 2} H18 V${pool.y + pool.h / 2} H${x}`,
    model: (i) => ({ x: pool.x + 14, y: pool.y + 96 + i * 22, w: box.w - 28 }),
    type: "compact",
  }
})()

const MODELS = ["haiku", "sonnet", "opus"]

/* 6 boîtes + 5 liens + dérivation + réservoir.
   Les rangs pairs allument une boîte, les impairs tirent un lien. */
const STEPS = 13

export function Trace({ lang }: { lang: Lang }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [reached, setReached] = useState(0)
  const L = useLayout()

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] })

  // on ne consomme que 82 % de la course : le schéma se termine avant de sortir
  const raw = useTransform(scrollYProgress, [0.04, 0.86], [0, 1], { clamp: true })
  /* Plus raide que le décor : le tracé est ce qu'on REGARDE, il doit
     répondre au doigt. Le décor a le droit d'avoir de la masse, pas
     le trait qu'on suit des yeux. */
  const p = useSpring(raw, { stiffness: 210, damping: 34, mass: 0.26 })

  useMotionValueEvent(p, "change", (v) => {
    const n = Math.round(v * STEPS)
    setReached((prev) => (prev === n ? prev : n))
  })

  const pct = useTransform(p, (v) => String(Math.round(v * 100)).padStart(3, "0"))

  const nodes = t(lang, "nodes") as unknown as [string, string, string][]
  const pool = t(lang, "pool") as unknown as [string, string]

  /* Une seule étape ALLUMÉE à la fois : celle où l'on est. Les
     précédentes basculent en « épuisé » (--off), neutre et toujours
     lisible. Sans ça, arrivé au bout, six rails rouges s'accumulent
     et le signal cesse d'en être un.
     Les rangs pairs allument une boîte ; l'index 6 est le réservoir. */
  const current = Math.min(Math.floor(reached / 2), nodes.length)
  const stateOf = (i: number): NodeState => (reached >= i * 2 ? (i === current ? "on" : "done") : "off")
  const step = Math.min(nodes.length, current + 1)

  return (
    <div className="trace-wrap" ref={wrap}>
      <div className="trace-pin">
        {/* le même rail que sur la plaque : deux planches du même
            dossier, pas deux pages */}
        <div className="trace-rail" aria-hidden="true">
          <span>{t(lang, "traceRail")}</span>
        </div>

        <header className="trace-head">
          <div>
            <span className="trace-index mono mono-sm dim">
              {/* cartouche 2/2 : la valeur est en encre sur papier, le
                  total reste gris à l'extérieur — la cote de plan */}
              <span className="count">{String(step).padStart(2, "0")}</span>
              <span>/ {String(nodes.length).padStart(2, "0")} — {t(lang, "traceIndex")}</span>
            </span>
            <h2>{t(lang, "traceTitle")}</h2>
            <span className="jp">プロスペクター ／ 処理チェーン</span>
          </div>
          <p className="trace-note mono dim-2">{t(lang, "traceNote")}</p>
        </header>

        <div className="trace-stage">
          <svg
            viewBox={`0 0 ${L.vb.w} ${L.vb.h}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={t(lang, "traceTitle")}
          >
            {/* lit : le tracé complet en très faible contraste — on devine la destination */}
            <g className="wire-bed">
              {nodes.slice(0, -1).map((_, i) => (
                <line key={i} {...L.link(i)} />
              ))}
              <path className="bed-branch" d={L.branch} />
              {nodes.map((_, i) => (
                <rect key={i} {...L.at(i)} width={L.box.w} height={L.box.h} fill="none" />
              ))}
              <rect x={L.pool.x} y={L.pool.y} width={L.pool.w} height={L.pool.h} fill="none" />
            </g>

            {/* Axe gradué : un diagramme flottant est un dessin, un
                diagramme posé sur un axe est une mesure. Le segment
                allumé sous l'étape 04 est la dernière justification
                sémantique du rouge — c'est là que la chaîne bifurque. */}
            {L.axisY !== undefined && (
              <g className="t-axis" aria-hidden="true">
                <line x1={L.at(0).x} y1={L.axisY} x2={L.at(5).x + L.box.w} y2={L.axisY} />
                {nodes.map(([idx], i) => {
                  const cx = L.at(i).x + L.box.w / 2
                  return (
                    <g key={idx}>
                      <line x1={cx} y1={L.axisY! - 8} x2={cx} y2={L.axisY!} />
                      <text x={cx} y={L.axisY! + 16} textAnchor="middle">
                        {idx}
                      </text>
                    </g>
                  )
                })}
                <line
                  className="branch"
                  x1={L.at(3).x}
                  y1={L.axisY}
                  x2={L.at(3).x + L.box.w}
                  y2={L.axisY}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )}

            {/* liens actifs, tirés un à un */}
            {nodes.slice(0, -1).map((_, i) => (
              <Wire key={i} p={p} index={i * 2 + 1} geom={L.link(i)} />
            ))}
            <Wire p={p} index={11} d={L.branch} branch />

            {/* boîtes de la chaîne */}
            {nodes.map(([idx, label, sub], i) => {
              const { x, y } = L.at(i)
              return (
                <Node key={idx} state={stateOf(i)}>
                  <rect x={x} y={y} width={L.box.w} height={L.box.h} />
                  {/* canal GÉOMÉTRIQUE de l'état allumé : ce rail
                      n'existe pas au repos. Le remplissage braise est
                      à 1,011:1, donc invisible — il ne peut pas porter
                      l'état à lui seul. */}
                  <rect className="n-rail" x={x} y={y} width={2} height={L.box.h} />
                  <text className="idx" x={x + 16} y={y + 20}>
                    {idx}
                  </text>
                  <text className="lbl" x={x + 16} y={y + 46}>
                    {label}
                  </text>
                  <text className="sub" x={x + 16} y={y + 63}>
                    {sub}
                  </text>
                  <path
                    className="corner"
                    d={`M${x + L.box.w - 9} ${y} H${x + L.box.w} V${y + 9}`}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                </Node>
              )
            })}

            {/* réservoir de modèles */}
            <Node state={stateOf(nodes.length)}>
              <rect x={L.pool.x} y={L.pool.y} width={L.pool.w} height={L.pool.h} />
              <rect className="n-rail" x={L.pool.x} y={L.pool.y} width={2} height={L.pool.h} />
              <text className="idx" x={L.pool.x + 16} y={L.pool.y + 22}>
                POOL
              </text>
              <text className="lbl" x={L.pool.x + 16} y={L.pool.y + 48}>
                {pool[0]}
              </text>
              <text className="sub" x={L.pool.x + 16} y={L.pool.y + 66}>
                {pool[1]}
              </text>
              {MODELS.map((m, i) => {
                const g = L.model(i)
                return (
                  <g key={m}>
                    <rect x={g.x} y={g.y} width={g.w} height={14} className="chip" />
                    <text className="sub" x={g.x + 6} y={g.y + 11}>
                      {m}
                    </text>
                  </g>
                )
              })}
            </Node>
          </svg>
        </div>

        <footer className="trace-foot">
          <span className="mono mono-sm dim">{t(lang, "traceUnit")}</span>
          <span className="progress">
            <motion.i style={{ scaleX: p }} />
          </span>
          <motion.span className="mono mono-sm dim">{pct}</motion.span>
        </footer>
      </div>
    </div>
  )
}

/* Un lien. Un seul hook par instance — pas de hook dans une boucle. */
function Wire({
  p,
  index,
  geom,
  d,
  branch,
}: {
  p: MotionValue<number>
  index: number
  geom?: { x1: number; y1: number; x2: number; y2: number }
  d?: string
  branch?: boolean
}) {
  const offset = useTransform(p, (v) => 1 - clamp01(v * STEPS - index))
  const common = {
    className: `wire${branch ? " branch" : ""}`,
    pathLength: 1,
    strokeDasharray: 1,
    style: { strokeDashoffset: offset },
  }
  return d ? <motion.path d={d} {...common} /> : <motion.line {...geom} {...common} />
}

type NodeState = "off" | "on" | "done"

function Node({ state, children }: { state: NodeState; children: React.ReactNode }) {
  const seen = state !== "off"
  return (
    <motion.g
      className={`node ${state}`}
      initial={false}
      animate={{ opacity: seen ? 1 : 0.26, y: seen ? 0 : 9 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.g>
  )
}

function useLayout() {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)")
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  return compact ? COMPACT : WIDE
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}
