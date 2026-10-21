"use client"

import { useMemo, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import "./a-flip-text.css"

/* Copie de ObsidianUI (src/components/block/flip-text.tsx), piste A du
   mobile. Classes et keyframes préfixées `a-` pour ne pas croiser les
   copies des autres pistes. */

type FlipTextProps = {
  className?: string
  children: string
  duration?: number
  delay?: number
  loop?: boolean
}

export function FlipText({ className, children, duration = 2.2, delay = 0, loop = true }: FlipTextProps) {
  const mots = useMemo(() => children.split(" "), [children])
  const total = children.length

  // l'index global d'un caractère, espaces compris : le décalage suit une courbe sinus
  const indexGlobal = (mot: number, car: number) => mots.slice(0, mot).reduce((n, m) => n + m.length + 1, 0) + car

  return (
    <span className={cn("a-flip-text inline-block leading-none", className)} style={{ perspective: "1000px" }}>
      {mots.map((mot, i) => (
        <span key={i} className="inline-block whitespace-nowrap" style={{ transformStyle: "preserve-3d" }}>
          {mot.split("").map((car, j) => {
            const decalage = Math.sin((indexGlobal(i, j) / total) * (Math.PI / 2)) * (duration * 0.25) + delay
            const style = {
              "--flip-duration": `${duration}s`,
              "--flip-delay": `${decalage.toFixed(3)}s`,
              "--flip-iteration": loop ? "infinite" : "1",
              transformStyle: "preserve-3d",
            } as CSSProperties
            return (
              <span key={j} className="a-flip-char relative inline-block" data-char={car} style={style}>
                {car}
              </span>
            )
          })}
          {i < mots.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  )
}
