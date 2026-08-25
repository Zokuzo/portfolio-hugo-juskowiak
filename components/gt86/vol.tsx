"use client"

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { CAM_FINALE, CHUTE_ALTITUDE, CIBLE_FINALE } from "./rue"

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
/* la fenêtre de chute de la voiture (en v.t) et la secousse d'impact
   (frein 9 : l'enveloppe repasse sous le millimètre avant la fin du vol) */
const CHUTE_FENETRE: [number, number] = [0.45, 0.88]
const SECOUSSE = 0.09
const SECOUSSE_FREIN = 9
/* la pente résiduelle de l'arrivée : ~1,8 m/s au raccord avec le seuil */
const PENTE_ARRIVEE = 0.06

/* le départ de la descente : haut au-dessus du carrefour, dans l'axe de la
   vue d'arrivée gatée — le chemin reste au-dessus du couloir des rues */
const CAM_AERIENNE = new THREE.Vector3(6, 78, 8)
const VISE_AERIENNE = new THREE.Vector3(-4.4, 4, -19)
const ARRIVEE = new THREE.Vector3(...CAM_FINALE)
const CIBLE = new THREE.Vector3(...CIBLE_FINALE)
/* LA FLARE (9e retour de gate : « le passage d'une transition à l'autre
   dans la ville reste très brut ») : la descente était une DROITE — la
   caméra plantait à la verticale puis le seuil repartait à l'horizontale,
   un coin net dans la trajectoire au raccord. L'acte II devient une
   Bézier quadratique dont la TANGENTE FINALE s'aligne sur la marche du
   seuil ; |ARRIVEE−CONTROLE| = L/2 conserve EXACTEMENT la vitesse
   d'arrivée (2·L/2 = L), seule la direction se replie — l'atterrissage
   s'évase comme une vraie finale. La MARCHE est la première ancre
   INTÉRIEURE de la courbe du seuil en monde (CHEMIN[0] « large autour
   du flanc », (−5.0, 1.7, −0.5) local → repère voiture posée) — viser
   la VOITURE laissait un coin résiduel de 43° au raccord (revue,
   tangente réelle du seuil mesurée (0.287, −0.056, −0.956)). */
const MARCHE_SEUIL = new THREE.Vector3(0.6, 1.65, -18.5)
const TANGENTE_SEUIL = MARCHE_SEUIL.clone().sub(ARRIVEE).normalize()
const CONTROLE = ARRIVEE.clone().sub(
  TANGENTE_SEUIL.clone().multiplyScalar(CAM_AERIENNE.distanceTo(ARRIVEE) / 2),
)
const bez = new THREE.Vector3()
const bezA = new THREE.Vector3()
const bezB = new THREE.Vector3()

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
       vue d'arrivée gatée au #22, la ville montant à travers la brume.
       La course ne MEURT plus sur l'arrivée (3e retour de gate #31,
       « fluidifie encore ») : elle y passe à ~1,8 m/s, la vitesse à
       laquelle le seuil démarre — la jonction vol → seuil est raccordée */
    const u = (v.t - BASCULE) / (1 - BASCULE)
    const e = PENTE_ARRIVEE * u + (1 - PENTE_ARRIVEE) * adoucit(u)
    bezA.lerpVectors(CAM_AERIENNE, CONTROLE, e)
    bezB.lerpVectors(CONTROLE, ARRIVEE, e)
    camera.position.copy(bez.lerpVectors(bezA, bezB, e))
    i.vise.lerpVectors(VISE_AERIENNE, CIBLE, e)
    v.chute = lisse(CHUTE_FENETRE[0], CHUTE_FENETRE[1], v.t)

    /* le regard SUIT la chute : la visée au ras du sol laissait les 45 m
       de dégringolade HORS CADRE — la voiture n'apparaissait que 92 ms
       avant l'impact (chiffré en revue). La visée se relève vers
       l'altitude de la voiture puis redescend avec elle : l'impact
       revient cadrer la rue de lui-même. */
    const altitude = (1 - v.chute * v.chute) * CHUTE_ALTITUDE
    const engagement = lisse(CHUTE_FENETRE[0], CHUTE_FENETRE[0] + 0.11, v.t)
    /* 0,85 : la voiture tient le tiers haut du cadre jusqu'à l'impact
       (0,62 la perdait en fin de chute — 39 % hors cadre, NDC rejoué) */
    i.vise.y = Math.max(i.vise.y, i.vise.y + (altitude * 0.85 - i.vise.y) * engagement)
    camera.lookAt(i.vise)

    /* l'impact : la voiture vient de s'asseoir 45 m plus bas — la caméra
       ENCAISSE, secousse brève et amortie (déterministe, en temps de
       partition : identique à toute cadence) */
    if (v.t > CHUTE_FENETRE[1]) {
      const tau = (v.t - CHUTE_FENETRE[1]) * DUREE
      const coup = SECOUSSE * Math.exp(-tau * SECOUSSE_FREIN)
      camera.position.x += coup * Math.sin(tau * 61)
      camera.position.y += coup * 0.7 * Math.sin(tau * 83 + 1.3)
    }

    if (v.t >= 1 && !i.fini) {
      i.fini = true
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      fini()
    }
  })

  return null
}
