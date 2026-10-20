"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { POSE_VOITURE } from "./rue"
import { regleAberration } from "./rendu"
import { LANCE_S, TOURS_MAX, TOURS_ROUGE, avance, distance, elan, polygoneVolet, progresVolet, rapport, regime, tempsTrajet, vitesse } from "./trajet"
import { ARC, classeRupteur } from "@/components/nfs/course"

/* LA POURSUITE (menu NFS) : pendant le DÉPART, la caméra coupe net
   derrière la GT86, qui accélère dans la rue. Tout se lit sur l'horloge
   du trajet (trajet.ts) : la voiture (via `avance`, appliqué par rue.tsx),
   la caméra, le champ, l'aberration, et le DOM de la course (rayures,
   compteur, volet). Rien ne compile : positions, matrices, uniformes et
   styles seulement.
   Priorité -1 : avant la voiture garée, qui applique `avance` dans la
   même image (sinon la caméra viserait la voiture d'une image en retard,
   un demi-mètre à pleine vitesse). */

export type DomTrajet = {
  lignes: HTMLDivElement | null
  volet: HTMLDivElement | null
  arc: SVGCircleElement | null
  vitesse: HTMLSpanElement | null
  rapport: HTMLSpanElement | null
  nitro: HTMLSpanElement | null
}

export const domTrajetVide = (): DomTrajet => ({ lignes: null, volet: null, arc: null, vitesse: null, rapport: null, nitro: null })

/* la caméra de poursuite, en mètres autour de la voiture : elle part de
   trois quarts arrière et se recentre, puis la voiture la distance */
const CAMERA = { pivot: 2.6, pivotS: 1.8, hauteur: 1.25, recul: 5.2, reculVitesse: 1.2, vise: 3 }
const CHAMP = { depart: 48, ecart: 16 }
const TREMBLE = { repos: 0.012, vitesse: 0.035 }
const ABERRATION_MAX = 6
const VIBRATION = { amplitude: 0.008, hz: 31 }
const CABRE = { angle: -0.035, duree: 0.5 }

export function Poursuite({ actif, dom }: { actif: boolean; dom: DomTrajet }) {
  const vise = useMemo(() => new THREE.Vector3(), [])
  const enCourse = useRef(false)
  useFrame(({ camera }) => {
    if (!actif) {
      if (enCourse.current) rangeVoiture()
      enCourse.current = false
      return
    }
    enCourse.current = true
    const t = tempsTrajet()
    const k = elan(t)
    poseVoiture(t)
    const cam = camera as THREE.PerspectiveCamera
    const x = POSE_VOITURE[0]
    const z = POSE_VOITURE[2] - avance.z
    const pivot = 1 - adoucit(Math.min(1, t / CAMERA.pivotS))
    const tremble = TREMBLE.repos + TREMBLE.vitesse * k
    cam.position.set(
      x + CAMERA.pivot * pivot + tremble * Math.sin(t * 37),
      CAMERA.hauteur + 0.25 * pivot + tremble * Math.sin(t * 53 + 1),
      z + CAMERA.recul + CAMERA.reculVitesse * k,
    )
    vise.set(x + 0.4 * pivot, 0.75, z - CAMERA.vise)
    cam.lookAt(vise)
    cam.fov = CHAMP.depart + CHAMP.ecart * k
    cam.updateProjectionMatrix()
    regleAberration(1 + ABERRATION_MAX * k)
    peintCourse(dom, t, k)
  }, -1)
  return null
}

const adoucit = (k: number) => k * k * (3 - 2 * k)

function poseVoiture(t: number) {
  avance.z = distance(t)
  avance.y = t < LANCE_S ? VIBRATION.amplitude * Math.sin(t * 2 * Math.PI * VIBRATION.hz) : 0
  avance.tangage = t < LANCE_S ? 0 : CABRE.angle * Math.exp(-(t - LANCE_S) / CABRE.duree)
}

function rangeVoiture() {
  avance.z = 0
  avance.y = 0
  avance.tangage = 0
  regleAberration(1)
}

function peintCourse(dom: DomTrajet, t: number, k: number) {
  const tours = regime(t)
  if (dom.lignes) {
    dom.lignes.style.opacity = String(0.9 * k)
    dom.lignes.style.transform = `scale(${1 + 0.6 * k})`
  }
  if (dom.arc) {
    dom.arc.style.strokeDashoffset = String(ARC * (1 - Math.min(tours, TOURS_MAX) / TOURS_MAX))
    dom.arc.classList.toggle(classeRupteur, tours > TOURS_ROUGE)
  }
  if (dom.vitesse) dom.vitesse.textContent = String(Math.round(vitesse(t) * 3.6))
  if (dom.rapport) dom.rapport.textContent = t < LANCE_S ? "N" : String(rapport(t))
  if (dom.nitro) dom.nitro.style.transform = `scaleX(${1 - 0.85 * k})`
  if (dom.volet) dom.volet.style.clipPath = polygoneVolet(progresVolet(t))
}
