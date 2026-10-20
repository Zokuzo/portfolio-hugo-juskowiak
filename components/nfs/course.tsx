"use client"

import { useState, type Ref } from "react"
import { useRouter } from "next/navigation"
import c from "./course.module.css"
import { joue } from "./sons"
import type { Piste } from "./menu-nfs"

/* LES PIÈCES DE LA COURSE en DOM : le volet en biais et sa carte de
   destination, les rayures de vitesse, le compteur. La scène 3D les
   pilote image par image (trajet.tsx) ; sans 3D, le départ les joue en
   CSS seul (useDepartSeul). */

export const ROUTES: Record<Piste, string> = { maison: "/da/a/maison", work: "/da/a/work" }
export const MENU = "/"

const CARTES: Record<Piste | "garage", { nom: string; jp: string }> = {
  maison: { nom: "Maison", jp: "ホーム" },
  work: { nom: "Work", jp: "ワーク" },
  garage: { nom: "Garage", jp: "ガレージ" },
}

/* `vers` : la carte de destination portée par le volet */
export function Volet({ vers, className = "", ref }: { vers: Piste | "garage"; className?: string; ref?: Ref<HTMLDivElement> }) {
  const carte = CARTES[vers]
  return (
    <div ref={ref} className={`${c.volet} ${className}`}>
      <div className={c.carte}>
        <span className={c.carteNom}>{carte.nom}</span>
        <span className={c.carteJp}>{carte.jp}</span>
        <span className={c.carteMono}>portfolio · ref. gt86</span>
      </div>
    </div>
  )
}

export function Lignes({ className = "", ref }: { className?: string; ref?: Ref<HTMLDivElement> }) {
  return <div ref={ref} className={`${c.lignes} ${className}`} />
}

/* l'arc du compte-tours : 270° d'un cercle de rayon 100 */
const RAYON = 100
const TOUR = 2 * Math.PI * RAYON
export const ARC = TOUR * 0.75

export type RefsCompteur = {
  arc: Ref<SVGCircleElement>
  vitesse: Ref<HTMLSpanElement>
  rapport: Ref<HTMLSpanElement>
  nitro: Ref<HTMLSpanElement>
}

export function Compteur({ refs, rouge }: { refs: RefsCompteur; rouge: number }) {
  const cercle = { cx: 115, cy: 115, r: RAYON, transform: "rotate(135 115 115)" }
  return (
    <div className={c.hud}>
      <svg viewBox="0 0 230 230" aria-hidden>
        <circle {...cercle} className={c.arcFond} strokeDasharray={`${ARC} ${TOUR}`} />
        <circle {...cercle} className={c.zoneRouge} strokeDasharray={`0 ${ARC * rouge} ${ARC * (1 - rouge)} ${TOUR}`} />
        <circle ref={refs.arc} {...cercle} className={c.arc} strokeDasharray={`${ARC} ${TOUR}`} strokeDashoffset={ARC} />
      </svg>
      <div className={c.vitesse}>
        <span ref={refs.vitesse}>0</span>
        <span className={c.unite}>km/h</span>
      </div>
      <span ref={refs.rapport} className={c.rapport}>N</span>
      <div className={c.nitro}><span ref={refs.nitro} /></div>
    </div>
  )
}

export const classeRupteur = c.arcRouge
export const classeCourse = c.course

/* SANS 3D : le volet en biais et les rayures seules, puis la navigation.
   Sous reduced-motion, la navigation part directement. */
const DEPART_SEUL_MS = 1150

export function useDepartSeul() {
  const router = useRouter()
  const [piste, setPiste] = useState<Piste | null>(null)
  const part = (p: Piste) => {
    router.prefetch(ROUTES[p])
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(ROUTES[p])
      return
    }
    joue("souffle")
    setPiste(p)
    setTimeout(() => router.push(ROUTES[p]), DEPART_SEUL_MS)
  }
  const voile = piste && (
    <div className={c.course}>
      <Lignes className={c.lignesSeules} />
      <Volet vers={piste} className={`${c.voletEntre} ${c.voletTard}`} />
    </div>
  )
  return { part, voile }
}

/* l'entrée d'une page d'arrivée : le volet repart par la droite */
export function VoletSortant({ piste }: { piste: Piste }) {
  return (
    <div className={c.course}>
      <Volet vers={piste} className={c.voletSort} />
    </div>
  )
}
