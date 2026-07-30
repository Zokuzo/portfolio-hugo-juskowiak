"use client"

import { useEffect } from "react"
import Lenis from "lenis"

/* Scroll lissé. C'est l'essentiel de la sensation "site primé" :
   le scroll natif est saccadé, celui-ci a de l'inertie.
   Désactivé si l'utilisateur a demandé moins d'animation. */
export function Smooth() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    /* Mode `lerp` plutôt que `duration` + easing.
       En mode duration, chaque cran de molette relance une animation
       vers une nouvelle cible : pendant un scroll continu, Lenis
       recible en permanence et le mouvement « flotte ».
       En lerp, la position converge vers la cible à taux constant —
       le geste et l'image restent solidaires quelle que soit la
       cadence des événements. 0,085 est le compromis habituel : plus
       haut, on perd l'inertie ; plus bas, on décroche du doigt. */
    /* `anchors` est INDISPENSABLE dès qu'un lien interne existe : un
       saut natif sur #ancre déplace le scroll de la fenêtre, puis Lenis
       ramène tout à sa cible interne et le saut est annulé. L'index des
       feuilles ne fonctionnerait pas sans ça. */
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      touchMultiplier: 1.7,
      anchors: true,
    })

    // en dev seulement : permet de positionner le scroll depuis l'extérieur
    // (Lenis ramène sinon toute position posée à la main)
    if (process.env.NODE_ENV !== "production") {
      ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
    }

    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  return null
}
