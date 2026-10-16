"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type * as THREE from "three"

/* LE DPR CHOISI SOUS LE VOILE : carte #42.

   La toile partait à min(devicePixelRatio, 1,5) pour toute l'expérience,
   quel que soit le GPU. Elle se choisit désormais UNE fois, pendant la
   chauffe, derrière le rideau CHARGEMENT : on mesure ce que coûte une
   image du ciel (CPU et GPU, jusqu'à la fin du travail du GPU), on en
   déduit ce que coûterait le seuil, la phase la plus lourde, et on prend
   la plus grande densité qui tient le budget. Ensuite plus rien ne bouge :
   une bascule de pixelRatio réalloue le framebuffer MSAA et les cibles du
   composer, c'est un gel et un saut de netteté (déjà interdit en pleine
   vue au #44, voir vol.tsx et seuil.tsx).

   ?dpr=1, ?dpr=1.25 ou ?dpr=1.5 force la valeur sans mesurer (bancs,
   compteur de cadence, œil de Hugo). */

export const DPR_DEPART: [number, number] = [1, 1.5]
const DENSITES = [1.5, 1.25, 1]
/* 60 images par seconde au seuil, la cible de la carte #42 */
const BUDGET_SEUIL_MS = 1000 / 60
/* le seuil coûte environ 1,4 fois le ciel (banc headless, après le #42) */
const SEUIL_SUR_CIEL = 1.4
/* la moitié du coût d'une image ne dépend pas du nombre de pixels : au
   banc, le ciel passé de 1,5 à 1 (56 % de pixels en moins) ne coûte que
   27 % de moins */
const PART_FIXE = 0.5
/* images de ciel mesurées ; la médiane écarte celles que la chauffe de la
   rue alourdit */
const ECHANTILLONS = 12
/* images peintes à la densité choisie avant de lever le rideau : la
   première réalloue les cibles du composer, la seconde le prouve */
const IMAGES_APPLIQUEES = 2

export function dprForce(): number | null {
  const valeur = Number(new URLSearchParams(window.location.search).get("dpr"))
  return DENSITES.includes(valeur) ? valeur : null
}

/* Mesure dès que `mesure` passe à vrai (le composer peint), annonce la
   densité par `surChoix`, puis `surPret` une fois qu'elle est peinte. */
export function ChoixDpr({
  mesure,
  surChoix,
  surPret,
}: {
  mesure: boolean
  surChoix: (dpr: number) => void
  surPret: () => void
}) {
  const debut = useRef(0)
  const couts = useRef<number[]>([])
  const choix = useRef<number | null>(null)
  const appliquees = useRef(0)
  const pixel = useRef(new Uint8Array(4))

  useFrame(() => {
    debut.current = performance.now()
  }, -1)

  /* après le composer (1) et le voile (2) : l'image entière est soumise */
  useFrame(({ gl }) => {
    if (!mesure || appliquees.current >= IMAGES_APPLIQUEES) return
    if (choix.current === null) {
      const force = dprForce()
      if (force === null) {
        couts.current.push(coutDeLImage(gl, pixel.current, debut.current))
        if (couts.current.length < ECHANTILLONS) return
      }
      choix.current = force ?? densitePour(mediane(couts.current), gl.getPixelRatio())
      surChoix(choix.current)
      return
    }
    if (gl.getPixelRatio() !== choix.current) return
    appliquees.current++
    if (appliquees.current === IMAGES_APPLIQUEES) surPret()
  }, 3)

  return null
}

/* lire un pixel de l'écran attend la fin du travail du GPU pour cette image */
function coutDeLImage(gl: THREE.WebGLRenderer, pixel: Uint8Array, debut: number): number {
  const ctx = gl.getContext()
  gl.setRenderTarget(null)
  ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, pixel)
  return performance.now() - debut
}

function mediane(valeurs: number[]): number {
  const triees = [...valeurs].sort((a, b) => a - b)
  return triees[Math.floor(triees.length / 2)]
}

/* la plus grande densité, sans dépasser celle de départ, dont le seuil
   estimé tient le budget ; 1 sinon */
export function densitePour(coutCielMs: number, dprMesure: number): number {
  const coutSeuil = (dpr: number) =>
    SEUIL_SUR_CIEL * coutCielMs * (PART_FIXE + (1 - PART_FIXE) * (dpr / dprMesure) ** 2)
  const possibles = DENSITES.filter((dpr) => dpr <= dprMesure + 0.001)
  return possibles.find((dpr) => coutSeuil(dpr) <= BUDGET_SEUIL_MS) ?? 1
}
