"use client"

import { useRef, type MutableRefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { DepthOfField } from "@react-three/postprocessing"
import type { DepthOfFieldEffect } from "postprocessing"
import * as THREE from "three"
import type { Trajectoire } from "./vol"

/* PROTOTYPE JETABLE (#56) : le zoom cinématographique sur la voiture.

   Trois chorégraphies de caméra, commutées par ?zoom=a|b|c sur / :
   - a : travelling avant lent, la focale se resserre sur la voiture ;
   - b : orbite autour de la voiture qui tombe ;
   - c : plongée qui accompagne la chute, comme dans la référence
     (« BMW Falling from Sky »).
   Sans paramètre, rien ne se monte : aucun useFrame, aucun effet de plus.

   LE MOMENT : pendant le VOL (état ATTERRISSAGE), pas pendant le CIEL.
   Le CIEL est l'invitation au clic : la voiture y est la cible du raycast
   et la levée en nuages s'y découvre sur une pose fixe ; une caméra qui
   bouge en ferait une cible mouvante. La voiture ne TOMBE que pendant le
   vol : acte I (elle s'enfonce dans le banc) et acte II (la voiture de la
   rue chute de 45 m sur son garage).

   LE RACCORD : ce composant tourne JUSTE APRÈS vol.tsx (monté après lui,
   même priorité : R3F appelle les useFrame dans l'ordre d'abonnement).
   Le vol pose sa caméra, la variante la remplace avec un poids qui part
   de 0 au clic (la pose du ciel), tient sous le voile crème (la bascule
   ciel vers rue y est invisible) et retombe à 0 juste après l'impact :
   le vol rend au seuil exactement la caméra d'arrivée de toujours. La
   variante c finit d'ailleurs sur CAM_FINALE par construction.

   LA PROFONDEUR DE CHAMP : ?zoom=x seul l'active, ?zoom=x&dof=0 la coupe
   (pour la comparer au banc). Montée dans le composer dès le départ, ses
   programmes compilent avec ceux des effets, avant le rideau (61 au lieu
   de 53, stables du rideau à l'habitacle, mesuré en capture). Hors du vol
   son flou tombe à 0, mais ses passes tournent quand même. Pas de flou de
   mouvement : postprocessing n'en a pas, il faudrait un tampon de vitesse. */

export type Variante = "a" | "b" | "c"

export function zoomVoulu(): Variante | null {
  if (typeof location === "undefined") return null
  const v = new URLSearchParams(location.search).get("zoom")
  return v === "a" || v === "b" || v === "c" ? v : null
}

/* ?montage=a|b|c (#56, prototype-montage.tsx), lu ici pour flouVoulu :
   l'importer de prototype-montage, qui importe déjà ce fichier, ferait
   un cycle qui casse le module au chargement. */
export function montageVoulu(): Variante | null {
  if (typeof location === "undefined") return null
  const v = new URLSearchParams(location.search).get("montage")
  return v === "a" || v === "b" || v === "c" ? v : null
}

/* le montage emprunte la même profondeur de champ */
export function flouVoulu(): boolean {
  if (typeof location === "undefined") return false
  const p = new URLSearchParams(location.search)
  return (zoomVoulu() !== null || montageVoulu() !== null) && p.get("dof") !== "0"
}

/* repris de vol.tsx, ciel.tsx et rue.tsx (le prototype ne touche pas
   leurs exports). Recopiés plutôt qu'importés : rendu.tsx importe ce
   fichier et rue.tsx importe rendu.tsx, le cycle cassait le module. */
const CAM_FINALE: [number, number, number] = [-1.2, 2.0, -12.5]
const POSE_VOITURE: [number, number, number] = [-4.4, -0.05, -19]
const CHUTE_ALTITUDE = 45
export const BASCULE = 0.42
const CHUTE_FENETRE: [number, number] = [0.45, 0.88]
const PLONGEE = 9
const POSE_CIEL = new THREE.Vector3(-4.2, -0.4, 7.8)
const ARRIVEE = new THREE.Vector3(...CAM_FINALE)
/* le centre de la caisse, au-dessus de son point de pose */
const CENTRE_POSEE = new THREE.Vector3(POSE_VOITURE[0], POSE_VOITURE[1] + 0.6, POSE_VOITURE[2])
/* le retour au vol : après l'impact (0,88), avant la fin de la course */
export const RENDU_AU_VOL: [number, number] = [0.87, 0.97]
const BOKEH = 3
const PROFONDEUR_NETTE = 3

const lisse = (a: number, b: number, t: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))
const adoucit = (t: number) => t * t * (3 - 2 * t)

/* l'état partagé avec la profondeur de champ : où viser, combien flouter */
const foyer = new THREE.Vector3()
let flou = 0

export type Plan = { position: THREE.Vector3; vise: THREE.Vector3; fov: number; poids: number }

export function ZoomCamera({ etat, vol }: { etat: string; vol: MutableRefObject<Trajectoire> }) {
  const variante = zoomVoulu()
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const interne = useRef({ fovBase: 0, plan: nouveauPlan() })

  useFrame(() => {
    const i = interne.current
    if (etat !== "ATTERRISSAGE" || !variante) {
      i.fovBase = 0
      eteintFlou()
      return
    }
    if (!i.fovBase) i.fovBase = camera.fov
    const t = vol.current.t
    const plan = t < BASCULE ? acteI(variante, t / BASCULE, i.plan) : acteII(variante, vol.current, i.plan)
    cadre(camera, plan, i.fovBase)
  })

  return null
}

export const nouveauPlan = (): Plan => ({ position: new THREE.Vector3(), vise: new THREE.Vector3(), fov: 38, poids: 0 })

/* une caméra, pas un Object3D : seul un isCamera regarde vers -z */
const pivot = new THREE.PerspectiveCamera()

/* pose la caméra sur le plan, au poids du plan, et y met le point net */
export function cadre(camera: THREE.PerspectiveCamera, plan: Plan, fovBase: number) {
  pivot.position.copy(plan.position)
  pivot.lookAt(plan.vise)
  camera.position.lerp(plan.position, plan.poids)
  camera.quaternion.slerp(pivot.quaternion, plan.poids)
  camera.fov = THREE.MathUtils.lerp(fovBase, plan.fov, plan.poids)
  camera.updateProjectionMatrix()
  foyer.copy(plan.vise)
  flou = plan.poids
}

export function eteintFlou() {
  flou = 0
}

/* acte I : la voiture du ciel s'enfonce dans le banc (canal plonge = p²) */
export function acteI(variante: Variante, p: number, plan: Plan): Plan {
  const plonge = p * p
  const e = adoucit(p)
  const voiture = new THREE.Vector3(0, -PLONGEE * plonge, 0)
  plan.poids = adoucit(lisse(0, 0.25, p))
  plan.vise.copy(voiture)
  if (variante === "a") {
    /* on avance vers elle, la focale se resserre, elle s'éloigne vers le bas */
    plan.position.copy(POSE_CIEL).multiplyScalar(1 - 0.42 * e)
    plan.position.y -= 2.2 * plonge
    plan.vise.y *= 0.7
    plan.fov = 38 - 8 * e
  } else if (variante === "b") {
    /* un quart de tour autour d'elle pendant qu'elle plonge */
    const angle = Math.atan2(POSE_CIEL.x, POSE_CIEL.z) - 1.1 * e
    const rayon = POSE_CIEL.length() * (1 - 0.18 * e)
    plan.position.set(Math.sin(angle) * rayon, POSE_CIEL.y - 3 * plonge, Math.cos(angle) * rayon)
    plan.fov = 38
  } else {
    /* la caméra plonge AVEC elle, d'un peu au-dessus : le banc monte */
    plan.position.copy(POSE_CIEL).multiplyScalar(1 - 0.3 * e)
    plan.position.y += 1.8 * e - PLONGEE * 0.85 * plonge
    plan.fov = 38 + 10 * e
  }
  return plan
}

/* acte II : la voiture de la rue tombe sur son garage (canal chute) */
export function acteII(variante: Variante, v: Trajectoire, plan: Plan): Plan {
  const voiture = CENTRE_POSEE.clone()
  voiture.y += (1 - v.chute * v.chute) * CHUTE_ALTITUDE
  /* sous le voile plein à la bascule, le poids est déjà à 1 : rien ne saute */
  plan.poids = 1 - adoucit(lisse(RENDU_AU_VOL[0], RENDU_AU_VOL[1], v.t))
  plan.vise.copy(voiture)
  const u = lisse(BASCULE, CHUTE_FENETRE[1], v.t)
  const arrivee = ARRIVEE.clone().sub(CENTRE_POSEE)
  if (variante === "a") {
    /* d'en haut, la caméra glisse lentement vers la voiture qui tombe et
       la focale se referme sur elle ; elle finit dans l'axe d'arrivée */
    const recul = arrivee.clone().multiplyScalar(THREE.MathUtils.lerp(6, 1.15, adoucit(u)))
    recul.y += THREE.MathUtils.lerp(14, 0.4, adoucit(u))
    plan.position.copy(voiture).add(recul)
    plan.fov = THREE.MathUtils.lerp(30, 24, adoucit(u))
  } else if (variante === "b") {
    /* un demi-tour autour d'elle, le rayon se resserre jusqu'à l'arrivée */
    const angleFinal = Math.atan2(arrivee.x, arrivee.z)
    const rayonFinal = Math.hypot(arrivee.x, arrivee.z)
    const angle = angleFinal + Math.PI * (1 - adoucit(u))
    const rayon = THREE.MathUtils.lerp(16, rayonFinal, adoucit(u))
    plan.position.set(Math.sin(angle) * rayon, THREE.MathUtils.lerp(4, arrivee.y, adoucit(u)), Math.cos(angle) * rayon)
    plan.position.add(voiture)
    plan.fov = 38
  } else {
    /* elle tombe, la caméra tombe avec elle, au-dessus et de côté : la
       ville monte vers les deux ; au toucher elle est sur CAM_FINALE */
    const dessus = new THREE.Vector3(2.5, 7, 5.5)
    plan.position.copy(voiture).add(dessus.lerp(arrivee, adoucit(lisse(0.6, 1, u))))
    plan.fov = THREE.MathUtils.lerp(48, 38, adoucit(lisse(0.7, 1, u)))
  }
  return plan
}

/* la profondeur de champ, à monter EN TÊTE du composer (rendu.tsx) */
export function FlouZoom() {
  const effet = useRef<DepthOfFieldEffect>(null)
  useFrame(() => {
    const e = effet.current
    if (!e?.target) return
    e.target.copy(foyer)
    e.bokehScale = BOKEH * flou
  })
  return <DepthOfField ref={effet} target={[0, 0, 0]} focusRange={PROFONDEUR_NETTE} bokehScale={0} />
}
