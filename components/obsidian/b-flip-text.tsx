"use client"

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import "./b-flip-text.css"

/* Copie adaptée de ObsidianUI (src/components/block/flip-text.tsx) :
   chaque lettre bascule sur son axe horizontal, en vague sinusoïdale.
   Simplifiée au séparateur espace, le seul dont la piste se sert. */

type Props = {
  children: string
  className?: string
  duree?: number
  delai?: number
}

export function FlipText({ children, className, duree = 2.2, delai = 0 }: Props) {
  const mots = children.split(" ")
  const total = children.length
  let indexGlobal = 0

  return (
    <span className={cn("inline-block leading-none", className)} style={{ perspective: "1000px" }} aria-label={children}>
      {mots.map((mot, indexMot) => {
        const lettres = mot.split("").map((lettre) => {
          const vague = Math.sin((indexGlobal / total) * (Math.PI / 2))
          indexGlobal += 1
          const style = {
            "--flip-duration": `${duree}s`,
            "--flip-delay": `${vague * duree * 0.25 + delai}s`,
            transformStyle: "preserve-3d",
          } as CSSProperties
          return { lettre, style }
        })
        indexGlobal += 1
        return (
          <span key={indexMot} aria-hidden className="inline-block whitespace-nowrap" style={{ transformStyle: "preserve-3d" }}>
            {lettres.map(({ lettre, style }, i) => (
              <span key={i} className="b-flip-char relative inline-block" data-char={lettre} style={style}>
                {lettre}
              </span>
            ))}
            {indexMot < mots.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        )
      })}
    </span>
  )
}
