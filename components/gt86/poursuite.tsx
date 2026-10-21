"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { POSE_VOITURE } from "./rue"
import { RAYON_ROUE } from "./roues"
import { regleAberration } from "./rendu"
import { LANCE_S, TOURS_MAX, TOURS_ROUGE, avance, distance, elan, passage, polygoneVolet, progresVolet, rapport, regime, tempsTrajet, vitesse } from "./trajet"
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
   trois quarts arrière et se recentre, puis la voiture la distance ; elle
   s'abaisse avec la vitesse, comme la poursuite de NFS */
const CAMERA = { pivot: 2.6, pivotS: 1.8, hauteur: 1.25, baisse: 0.18, recul: 5.2, reculVitesse: 0.9, vise: 3.5 }
/* le décrochage : la caméra traîne quand la GT86 tire, se rapproche à
   chaque coupure de rapport (la poussée tombe), puis repart */
const DECROCHE = { recul: 0.55, montee: 0.35, coupure: 0.3 }
const CHAMP = { depart: 48, ecart: 16, coup: 3.5 }
/* les secousses : deux couches de sinus déphasés qui croissent avec la
   vitesse (houle de la route, grain du bitume), plus une impulsion amortie
   au départ et à chaque rapport ; jamais d'aléatoire, qui tremblote */
const SECOUSSE = { houle: 0.012, grain: 0.0025, impulsion: 0.03, roulis: 0.006 }
const ABERRATION_MAX = 6
const VIBRATION = { amplitude: 0.008, hz: 31 }
/* la caisse : cabrage au lancement, tenu tant qu'on accélère, et plongée
   du nez à chaque passage (ressort sous-amorti, ~1,9 Hz) */
const CABRE = { angle: -0.025, duree: 0.5, tenu: -0.009 }
const PLONGE = { angle: 0.028, frein: 0.22, hz: 1.9 }
const ECRASE = { lance: -0.018, passage: -0.01 }
/* au-delà d'un demi-radian par image, une jante à cinq branches semble
   tourner à l'envers (stroboscope) : le pas visible est plafonné */
const PAS_ROUE_MAX = 0.5

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
    poseVoiture(t, k)
    const cam = camera as THREE.PerspectiveCamera
    const x = POSE_VOITURE[0]
    const z = POSE_VOITURE[2] - avance.z
    const pivot = 1 - adoucit(Math.min(1, t / CAMERA.pivotS))
    const s = passage(t)
    const u = Math.max(0, t - LANCE_S)
    const decroche = t < LANCE_S ? 0 : DECROCHE.recul * (1 - Math.exp(-u / DECROCHE.montee)) - DECROCHE.coupure * bosse(s, 0.12)
    const choc = SECOUSSE.impulsion * (amortie(u, t >= LANCE_S) + 0.6 * amortie(s, s >= 0))
    const houle = SECOUSSE.houle * k * (Math.sin(t * 13.2) + 0.5 * Math.sin(t * 9.1 + 2))
    const grain = SECOUSSE.grain * (0.3 + k) * (Math.sin(t * 151) + 0.6 * Math.sin(t * 117 + 1))
    cam.position.set(
      x + CAMERA.pivot * pivot + grain,
      CAMERA.hauteur - CAMERA.baisse * k + 0.25 * pivot + houle + grain + choc,
      z + CAMERA.recul + CAMERA.reculVitesse * k + decroche,
    )
    vise.set(x + 0.4 * pivot, 0.75, z - CAMERA.vise)
    cam.lookAt(vise)
    cam.rotateZ(SECOUSSE.roulis * k * Math.sin(t * 4.3) + 0.15 * choc)
    cam.fov = CHAMP.depart + CHAMP.ecart * k + CHAMP.coup * coup(s)
    cam.updateProjectionMatrix()
    regleAberration(1 + ABERRATION_MAX * k + 3 * coup(s))
    peintCourse(dom, t, k)
  }, -1)
  return null
}

const adoucit = (k: number) => k * k * (3 - 2 * k)

/* 0 → 1 → 0 : une bosse qui culmine à `pic` secondes */
const bosse = (s: number, pic: number) => (s < 0 ? 0 : (s / pic) * Math.exp(1 - s / pic))

/* le coup de champ du rapport : monte en 80 ms, retombe en 300 ms */
const coup = (s: number) => (s < 0 ? 0 : s < 0.08 ? s / 0.08 : Math.exp(-(s - 0.08) / 0.3))

/* une impulsion amortie de 0,2 s */
const amortie = (s: number, arme: boolean) => (arme ? Math.exp(-s / 0.07) * Math.sin(s * 2 * Math.PI * 17) : 0)

let dernierZ = 0

function poseVoiture(t: number, k: number) {
  const z = distance(t)
  avance.roue += Math.min(PAS_ROUE_MAX, Math.max(0, z - dernierZ) / RAYON_ROUE)
  dernierZ = z
  avance.z = z
  avance.elan = k
  avance.y = t < LANCE_S ? VIBRATION.amplitude * Math.sin(t * 2 * Math.PI * VIBRATION.hz) : 0
  if (t < LANCE_S) {
    avance.tangage = 0
    avance.caisse = 0
    return
  }
  const u = t - LANCE_S
  const s = passage(t)
  const plonge = s < 0 ? 0 : Math.exp(-s / PLONGE.frein) * Math.sin(s * 2 * Math.PI * PLONGE.hz)
  avance.tangage = CABRE.tenu + (CABRE.angle - CABRE.tenu) * Math.exp(-u / CABRE.duree) + PLONGE.angle * plonge
  avance.caisse = ECRASE.lance * Math.exp(-u / 0.4) + ECRASE.passage * plonge + 0.003 * k * Math.sin(t * 16)
}

function rangeVoiture() {
  avance.z = 0
  avance.y = 0
  avance.tangage = 0
  avance.caisse = 0
  avance.elan = 0
  dernierZ = 0
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
