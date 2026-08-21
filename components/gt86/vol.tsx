"use client"

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { CAM_FINALE, CIBLE_FINALE } from "./rue"

/* LE VOL D'ATTERRISSAGE — ticket #30, sur la recette du #26 : une course à
   DURÉE FIXE en courbe douce (jamais de lerp par image, qui hache dès que
   la cadence tombe), delta plafonné à 1/12 s (une image lente ne téléporte
   pas), pixelRatio à 1 pendant le vol et restauré à l'arrivée.

   Le chorégraphe écrit des CANAUX dans une ref partagée — `plonge` (la
   voiture du ciel s'enfonce dans le banc) et `chute` (celle de la rue tombe
   vers son garage) — que ciel.tsx et rue.tsx consomment sans rien savoir
   du minutage. Deux actes autour d'un voile crème (le DOM le porte) :
   la plongée dans les nuages, puis la descente sur la ville.

   C'est LUI qui envoie le vrai `{t:"fini"}` à la fin de sa course — accroché
   au temps du rendu, il finit toujours en phase avec l'image ; l'horloge de
   scene.tsx ne reste qu'en filet si la boucle de rendu meurt. */

export type Trajectoire = { t: number; plonge: number; chute: number }

const DUREE = 4.6
export const VOL_MS = 4600
/* la bascule ciel → rue, cachée derrière le voile plein */
const BASCULE = 0.42

/* le départ de la descente : haut au-dessus du carrefour, dans l'axe de la
   vue d'arrivée gatée — le chemin reste au-dessus du couloir des rues */
const CAM_AERIENNE = new THREE.Vector3(6, 78, 8)
const VISE_AERIENNE = new THREE.Vector3(-4.4, 4, -19)
const ARRIVEE = new THREE.Vector3(...CAM_FINALE)
const CIBLE = new THREE.Vector3(...CIBLE_FINALE)

const adoucit = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lisse = (a: number, b: number, t: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))

export default function Vol({
  etat,
  vol,
  voile,
  surBascule,
  fini,
}: {
  etat: string
  vol: MutableRefObject<Trajectoire>
  voile: RefObject<HTMLDivElement | null>
  surBascule: () => void
  fini: () => void
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const interne = useRef({
    enVol: false,
    bascule: false,
    fini: false,
    depuis: new THREE.Vector3(),
    vise: new THREE.Vector3(),
  })

  /* le RANGEMENT seulement — skip en plein vol compris : résolution, voile,
     et la voiture de la rue retombe posée. L'INITIALISATION du vol n'est
     PAS ici : React diffère les effets passifs, et une frame rAF peut
     courir entre le commit ATTERRISSAGE et l'effet — elle lirait un
     `depuis` encore vierge (0,0,0) et téléporterait la caméra dans
     l'habitacle (payé : télémétrie du build #30). */
  useEffect(() => {
    if (etat !== "ATTERRISSAGE") return
    const v = vol.current
    const i = interne.current
    return () => {
      i.enVol = false
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      if (voile.current) voile.current.style.opacity = "0"
      v.plonge = 0
      v.chute = 1
    }
  }, [etat, gl, vol, voile])

  useFrame((_, delta) => {
    if (etat !== "ATTERRISSAGE") return
    const v = vol.current
    const i = interne.current
    if (!i.enVol) {
      /* première frame du vol : tout se capture ICI, dans la même phase
         que les écritures — aucune course possible avec les effets */
      i.enVol = true
      i.bascule = false
      i.fini = false
      i.depuis.copy(camera.position)
      v.t = 0
      v.plonge = 0
      v.chute = 0
      gl.setPixelRatio(1)
    }
    v.t = Math.min(1, v.t + Math.min(delta, 1 / 12) / DUREE)

    /* le voile : plein à la bascule, dissipé de part et d'autre */
    const opacite = Math.min(lisse(BASCULE - 0.14, BASCULE, v.t), 1 - lisse(BASCULE, BASCULE + 0.18, v.t))
    if (voile.current) voile.current.style.opacity = opacite.toFixed(3)

    if (v.t < BASCULE) {
      /* acte I — la plongée : la voiture s'enfonce dans le banc, la caméra
         l'accompagne du regard et glisse à peine */
      const p = v.t / BASCULE
      v.plonge = p * p
      camera.position.set(i.depuis.x, i.depuis.y - 1.6 * v.plonge, i.depuis.z)
      camera.lookAt(0, -5 * v.plonge, 0)
      return
    }

    if (!i.bascule) {
      i.bascule = true
      surBascule()
    }

    /* acte II — la descente : du ciel au-dessus du carrefour jusqu'à la
       vue d'arrivée gatée au #22, la ville montant à travers la brume */
    const e = adoucit((v.t - BASCULE) / (1 - BASCULE))
    camera.position.lerpVectors(CAM_AERIENNE, ARRIVEE, e)
    i.vise.lerpVectors(VISE_AERIENNE, CIBLE, e)
    camera.lookAt(i.vise)
    v.chute = lisse(0.5, 0.85, v.t)

    if (v.t >= 1 && !i.fini) {
      i.fini = true
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      fini()
    }
  })

  return null
}
