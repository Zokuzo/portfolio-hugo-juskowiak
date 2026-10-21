"use client"

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import "./c-flip-text.css"

/* Copié d'ObsidianUI (src/components/block/flip-text.tsx), piste C.
   Chaque lettre bascule d'un quart de tour sur l'axe X ; le décalage
   suit une sinusoïde, donc la vague démarre vite et finit douce.
   Les règles CSS vivaient dans le globals.css d'ObsidianUI : elles
   sont dans c-flip-text.css, préfixées pour ne rien toucher ailleurs. */

type FlipTextProps = {
  className?: string
  children: string
  duration?: number
  delay?: number
  loop?: boolean
}

export function FlipText({ className, children, duration = 2.2, delay = 0, loop = true }: FlipTextProps) {
  const mots = children.split(" ")
  /* Position de la première lettre de chaque mot dans la phrase entière (espaces compris). */
  const debuts = mots.map((_, i) => mots.slice(0, i).join(" ").length + (i > 0 ? 1 : 0))

  return (
    <span className={cn("c-flip inline-block leading-none", className)} style={{ perspective: "1000px" }} aria-label={children}>
      {mots.map((mot, indexMot) => (
        <span key={indexMot} className="inline-block whitespace-nowrap" style={{ transformStyle: "preserve-3d" }} aria-hidden>
          {mot.split("").map((lettre, indexLettre) => {
            const progression = (debuts[indexMot] + indexLettre) / children.length
            const retard = Math.sin(progression * (Math.PI / 2)) * (duration * 0.25) + delay
            return (
              <span
                key={indexLettre}
                className="c-flip-char relative inline-block"
                data-char={lettre}
                style={
                  {
                    "--flip-duration": `${duration}s`,
                    "--flip-delay": `${retard.toFixed(3)}s`,
                    "--flip-iteration": loop ? "infinite" : "1",
                    transformStyle: "preserve-3d",
                  } as CSSProperties
                }
              >
                {lettre}
              </span>
            )
          })}
          {indexMot < mots.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  )
}
