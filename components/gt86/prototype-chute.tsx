"use client"

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { DepthOfField } from "@react-three/postprocessing"
import type { DepthOfFieldEffect } from "postprocessing"
import * as THREE from "three"
import { poseNeutre, type Pose, type Trajectoire } from "./vol"
import { FOV_POSE, POSE, voitureDuCiel } from "./ciel"
import { brume, CAM_FINALE, enMondeRepos, POSE_VOITURE } from "./rue"
import { ASSISE, type Cockpit } from "./habitacle"
import { CLAQUE, SEUIL_MS, VERRE_T } from "./seuil"
import { attenueMusique, caleMusique, musiqueEnAttente, tempsMusique } from "./musique-intro"

/* PROTOTYPE JETABLE (#56) : la nouvelle chute, montée sur la musique.

   La consigne de Hugo : « dès que le début de la musique se lance la
   voiture ralentit dans les airs et là on fait les différents plans de
   coupe sur elle en rapport avec la musique [...] et après on laisse la
   voiture tomber au sol et on rentre dedans, il faut que le travelling se
   fasse sans à-coup ». L'entrée dans le montage coupe l'écran comme la
   référence (« BMW Falling from Sky ») :
   - ?montage=obliques : deux bandes noires obliques cadrent l'image en
     parallélogramme, puis s'ouvrent sur le drop ;
   - ?montage=cadre : le cadre se resserre en scope (2,39:1) le temps du
     montage, puis se rouvre quand la voiture tombe.
   &dof=0 coupe la profondeur de champ. Sans ?montage, rien ne change :
   vol.tsx et seuil.tsx jouent la chute de toujours.

   LE DÉROULÉ, en secondes depuis le clic (= temps dans l'extrait) :
   1. clic : la voiture freine, se redresse et tourne lentement sur
      elle-même, suspendue au-dessus de la mer de nuages, jusqu'à CHUTE ;
   2. ECRAN_COUPE : l'écran se coupe, les PLANS commencent, centrés sur le
      design, en coupes franches aux COUPES ;
   3. CHUTE : elle tombe (gravité, vitesse limite, le nez qui bascule), la
      caméra la suit sur un ressort, plonge avec elle dans les nuages, la
      lumière baisse et bleuit ; au cœur du banc, la bascule vers la rue ;
      sous les nuages la brume s'ouvre sur la ville de nuit ; la voiture
      freine dans ses derniers mètres et s'assied sur sa suspension ;
   4. FINI : la caméra arrive sur la vue d'arrivée (CAM_FINALE) à la
      vitesse et dans l'axe du travelling, qui la porte sans voile
      jusqu'au siège (TravellingChute, pendant le SEUIL) ;
   5. la musique fond de CHUTE à l'entrée dans l'habitacle.

   L'HORLOGE : tempsMusique() quand la musique joue ; tant qu'elle charge,
   le temps reste au début (le ralenti attend la musique) ; sans musique
   (son refusé, fichier absent), une horloge murale calée sur le clic.
   Elle ne recule ni ne gèle jamais : une musique en retard est recalée
   sur l'image, ou rattrapée en ralentissant l'image.

   LE GEL : rien ne compile après le rideau. Les bandes et le voile sont
   du DOM ; brume, exposition, profondeur de champ et assiettes ne sont
   que des uniformes et des matrices ; la profondeur de champ est montée
   en tête du composer dès le départ (rendu.tsx, enTete). */

export type Montage = "obliques" | "cadre"

export function montageVoulu(): Montage | null {
  if (typeof location === "undefined") return null
  const v = new URLSearchParams(location.search).get("montage")
  return v === "obliques" || v === "cadre" ? v : null
}

export function flouVoulu(): boolean {
  if (typeof location === "undefined") return false
  return montageVoulu() !== null && new URLSearchParams(location.search).get("dof") !== "0"
}

/* LA PARTITION, calée par Hugo à l'oreille sur vision-debut.m4a */
const ECRAN_COUPE = 0.91
const COUPES = [1.62, 4.62, 7.61, 10.63]
const CHUTE = 13.01

/* comme le vol : une image lente ne téléporte rien */
const DELTA_MAX = 1 / 12
/* au-delà, la musique qui charge ne retient plus le montage */
const ATTENTE_MAX = 4
/* une musique en retard de plus que ça (départ tardif, trou de lecture)
   est recalée sur l'image ; en deçà, l'image ralentit de moitié pour se
   laisser rattraper */
const RETARD_MUSIQUE_MAX = 0.5
const RATTRAPAGE = 0.5

const lisse = (a: number, b: number, t: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))
/* smootherstep : vitesse et accélération nulles aux deux bouts */
const douce = (u: number) => u * u * u * (u * (6 * u - 15) + 10)
/* la réponse d'un ressort critique à un échelon : part au repos */
const amortiCritique = (tau: number, pulsation: number) => 1 - (1 + pulsation * tau) * Math.exp(-pulsation * tau)

/* ---- l'horloge ---------------------------------------------------------- */

const horloge = { t: 0, partie: false, attente: 0 }

function remetHorloge() {
  horloge.t = 0
  horloge.partie = false
  horloge.attente = 0
}

function avanceHorloge(delta: number): number {
  const pas = Math.min(delta, DELTA_MAX)
  const musique = tempsMusique()
  if (musique !== null) {
    horloge.partie = true
    if (horloge.t - musique > RETARD_MUSIQUE_MAX) caleMusique(horloge.t)
    horloge.t = musique >= horloge.t ? musique : horloge.t + pas * RATTRAPAGE
    return horloge.t
  }
  /* avant son départ, la musique qui charge retient le temps ; après,
     pendant un trou de lecture, l'image avance sur l'horloge murale */
  if (!horloge.partie && musiqueEnAttente() && (horloge.attente += pas) < ATTENTE_MAX) return horloge.t
  horloge.t += pas
  return horloge.t
}

/* ---- la voiture du ciel : le ralenti ------------------------------------ */

/* au clic elle glisse encore un peu vers le bas et s'arrête (FREINAGE),
   se redresse de son piqué (REDRESSE, en tangage : du piqué de 57° de la
   pose du ciel à une quinzaine de degrés) et prend un cap lent, sa
   vitesse angulaire montant en rampe */
const FREINAGE = { profondeur: 0.35, duree: 1.4 }
const REDRESSE = { tangage: -0.75, debut: 0, fin: 4.2 }
const ROTATION = { vitesse: 0.09, montee: 3 }
/* à chaque coupe franche, où rien ne se voit, elle monte d'un PALIER : elle
   tombe ensuite de plus haut, et le sommet du banc (-2,6) ne la touche
   qu'une fois le voile monté (VOILE_TEMPS). Plus bas, le banc, qui ne
   connaît pas la profondeur de la scène, la tranchait net en pleine vue */
const PALIERS = [ECRAN_COUPE, ...COUPES]
const PALIER = 1
const paliersPasses = (t: number) => PALIERS.reduce((n, debut) => n + (t >= debut ? 1 : 0), 0)

function poseSuspendue(t: number, pose: Pose) {
  const u = Math.min(1, t / FREINAGE.duree)
  pose.y = -FREINAGE.profondeur * (1 - (1 - u) * (1 - u) * (1 - u)) + PALIER * paliersPasses(t)
  pose.tangage = REDRESSE.tangage * douce(lisse(REDRESSE.debut, REDRESSE.fin, t))
  pose.lacet =
    t < ROTATION.montee
      ? (ROTATION.vitesse * t * t) / (2 * ROTATION.montee)
      : ROTATION.vitesse * (t - ROTATION.montee / 2)
  pose.roulis = 0
  pose.toucher = -1
}

/* ---- la chute ----------------------------------------------------------- */

/* gravité et traînée quadratique : la vitesse tend vers VITESSE_LIMITE
   (v = V tanh(g t / V)), forme close, identique à toute cadence */
const G = 9.81
const VITESSE_LIMITE = 16
const descente = (tau: number) => ((VITESSE_LIMITE * VITESSE_LIMITE) / G) * Math.log(Math.cosh((G * tau) / VITESSE_LIMITE))
const vitesseDescente = (tau: number) => VITESSE_LIMITE * Math.tanh((G * tau) / VITESSE_LIMITE)

/* le ciel : le nez bascule (ressort critique, part au repos) et un
   léger roulis s'installe */
const NEZ = { tangage: 0.38, pulsation: 1.7 }
const ROULIS = { angle: 0.16, pulsation: 1.2 }

/* la bascule ciel → rue, au cœur du banc, en secondes de chute ; la
   voiture de la rue y est à ALTITUDE_BASCULE et poursuit la même chute */
const BASCULE = 1.4
const ALTITUDE_BASCULE = 40
/* la rue : de son assiette d'entrée, elle se rétablit pour toucher à
   plat ; dans les FREIN.hauteur derniers mètres la décélération est
   constante jusqu'à FREIN.vitesse, puis la suspension encaisse (une
   compression, un petit rebond) */
const ASSIETTE_RUE = { tangage: 0.5, toucherTangage: -0.04 }
const FREIN = { hauteur: 5, vitesse: 2.6 }
const SUSPENSION = { pulsation: 16, amorti: 5, plongeon: 0.05 }
/* la pose après le toucher, avant de rendre la main au seuil : plus que
   le ressort de la rue (TASSE_DUREE 1,2 s), qui reste ainsi au repos */
const POSE_S = 1.3

/* un freinage à décélération constante, de la chute libre à `hauteur`
   jusqu'au sol à `vitesse` (sa durée garde la vitesse moyenne) ; le
   départ du frein est résolu une fois, par dichotomie */
type Freinage = { hauteur: number; vitesse: number; tau: number; elan: number; duree: number }
function freinage(hauteur: number, vitesse: number): Freinage {
  const cible = descente(BASCULE) + ALTITUDE_BASCULE - hauteur
  let bas = BASCULE
  let haut = BASCULE + 20
  for (let k = 0; k < 60; k++) {
    const milieu = (bas + haut) / 2
    if (descente(milieu) < cible) bas = milieu
    else haut = milieu
  }
  const elan = vitesseDescente(bas)
  return { hauteur, vitesse, tau: bas, elan, duree: (2 * hauteur) / (elan + vitesse) }
}

/* la hauteur au-dessus du sol, prolongée avant la bascule (la voiture de
   la rue y est cachée, et le suivi en retard la lit là aussi) */
function hauteurFreinee(tau: number, f: Freinage): number {
  if (tau < f.tau) return ALTITUDE_BASCULE + descente(BASCULE) - descente(tau)
  const s = Math.min(tau - f.tau, f.duree)
  return f.hauteur - f.elan * s + ((f.elan - f.vitesse) * s * s) / (2 * f.duree)
}

const FREIN_VOITURE = freinage(FREIN.hauteur, FREIN.vitesse)
/* la caméra freine plus haut et plus doucement : la voiture la devance
   au sol, la caméra arrive après elle, sans à-coup */
const FREIN_CAMERA = freinage(11, 0)
const TAU_TOUCHER = FREIN_VOITURE.tau + FREIN_VOITURE.duree
const T_TOUCHER = CHUTE + TAU_TOUCHER
const T_FINI = T_TOUCHER + POSE_S
/* la course de l'atterrissage, pour le filet de scene.tsx */
export const CHUTE_MS = Math.ceil((T_FINI + ATTENTE_MAX) * 1000)
/* le fondu de la musique : de CHUTE à l'entrée dans l'habitacle */
const FONDU_S = T_FINI - CHUTE + SEUIL_MS / 1000

/* l'assiette au départ de la chute */
const SUSPENDUE = poseNeutre()
poseSuspendue(CHUTE, SUSPENDUE)

function poseTombanteCiel(tau: number, pose: Pose) {
  poseSuspendue(CHUTE + tau, pose)
  pose.y = SUSPENDUE.y - descente(tau)
  pose.tangage = SUSPENDUE.tangage + NEZ.tangage * amortiCritique(tau, NEZ.pulsation)
  pose.roulis = ROULIS.angle * amortiCritique(tau, ROULIS.pulsation)
}

function hauteurRue(tau: number): number {
  if (tau < TAU_TOUCHER) return hauteurFreinee(tau, FREIN_VOITURE)
  const s = tau - TAU_TOUCHER
  return -(FREIN.vitesse / SUSPENSION.pulsation) * Math.exp(-SUSPENSION.amorti * s) * Math.sin(SUSPENSION.pulsation * s)
}

function poseTombanteRue(tau: number, pose: Pose) {
  const retabli = douce(lisse(BASCULE, TAU_TOUCHER, tau))
  const s = Math.max(0, tau - TAU_TOUCHER)
  const rebond = tau < TAU_TOUCHER ? 0 : Math.exp(-SUSPENSION.amorti * s) * Math.sin(SUSPENSION.pulsation * s)
  pose.y = hauteurRue(tau)
  pose.lacet = 0
  /* l'assiette du toucher s'amortit vers le plat : le seuil reprend une
     voiture au repos, sans bascule */
  const toucher = ASSIETTE_RUE.toucherTangage * Math.exp(-SUSPENSION.amorti * s)
  pose.tangage = THREE.MathUtils.lerp(ASSIETTE_RUE.tangage, toucher, retabli) + SUSPENSION.plongeon * rebond
  pose.roulis = ROULIS.angle * amortiCritique(BASCULE, ROULIS.pulsation) * (1 - retabli)
  pose.toucher = tau < TAU_TOUCHER ? -1 : s
}

/* ---- l'état partagé ----------------------------------------------------- */

/* écrit par Chute (en tête de la boucle), lu par CameraChute et
   TravellingChute (en fin de boucle) et par la profondeur de champ. Une
   seule chute à la fois, comme une seule musique. */
type Monde = "ciel" | "rue"
const chute = {
  t: 0,
  monde: "ciel" as Monde,
  /* la hauteur de la caméra à l'image d'avant : le voile couvre avant
     qu'elle ne passe sous le dessus des nuages, qui disparaîtraient */
  cameraY: 0,
  foyer: new THREE.Vector3(),
  nettete: 3,
  flou: 0,
}

/* ---- Chute : la partition, les voitures, le voile, la brume ------------- */

/* le voile du banc de nuages : de la teinte des nuages au couchant à un
   bleu ardoise au cœur, plus clair en haut (la lumière vient d'en haut) */
const VOILE_ENTREE: [THREE.Color, THREE.Color] = [new THREE.Color("#e7bdb3"), new THREE.Color("#b98f98")]
const VOILE_COEUR: [THREE.Color, THREE.Color] = [new THREE.Color("#8d8a9d"), new THREE.Color("#5e5c70")]
const VOILE_SORTIE: [THREE.Color, THREE.Color] = [new THREE.Color("#36405a"), new THREE.Color("#1c2131")]
/* le voile monte avec l'entrée dans le banc (en secondes de chute : plein
   avant que la voiture, partie des PALIERS, n'en touche le sommet) ou
   avec la descente de la caméra vers le dessus de la nappe (-2,6) */
const VOILE_TEMPS: [number, number] = [0.8, 1.1]
const VOILE_HAUTEUR: [number, number] = [-0.8, -2.45]
/* sous le banc : il s'efface dès que la rue est montée */
const VOILE_LEVEE_S = 0.5
/* la brume sous les nuages : dense et bleutée, elle s'ouvre jusqu'à la
   brume de nuit de la rue ; l'exposition baisse dans le banc et remonte */
const BRUME_NUAGE = { couleur: new THREE.Color(0.035, 0.044, 0.075), proche: 0, loin: 10 }
const BRUME_OUVERTURE_S = 2.4
const EXPOSITION_BANC = 0.6
const EXPOSITION_REMONTEE: [number, number] = [0.3, 2.6]

const BRUME_NUIT = brume()
const teinte = [new THREE.Color(), new THREE.Color()]

export function Chute({
  montage,
  etat,
  vol,
  voile,
  enRue,
  surBascule,
  fini,
}: {
  montage: Montage
  etat: string
  vol: MutableRefObject<Trajectoire>
  voile: RefObject<HTMLDivElement | null>
  enRue: boolean
  surBascule: () => void
  fini: () => void
}) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const interne = useRef({ enChute: false, bascule: false, fini: false, fondVoile: "" })

  /* poignée de test (harnais CDP), comme window.__gt86 : l'instant
     musical et le monde, pour les captures en temps contrôlé */
  useEffect(() => {
    Object.assign(window as object, { __gt86chute: chute })
  }, [])

  /* le rangement (skip compris) : voitures, voile, brume, exposition */
  useEffect(() => {
    if (etat !== "ATTERRISSAGE") return
    const v = vol.current
    const i = interne.current
    return () => {
      i.enChute = false
      v.ciel = poseNeutre()
      v.rue = null
      v.plonge = 0
      v.chute = 1
      const d = voile.current
      if (d) {
        d.style.opacity = "0"
        if (i.fondVoile) d.style.background = i.fondVoile
      }
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.copy(BRUME_NUIT.color)
        scene.fog.near = BRUME_NUIT.near
        scene.fog.far = BRUME_NUIT.far
      }
      gl.toneMappingExposure = 1
      poseBandes(montage, 0)
    }
  }, [etat, vol, voile, scene, gl, montage])

  useFrame((_, delta) => {
    if (etat !== "ATTERRISSAGE") {
      if (etat === "CIEL") remetHorloge()
      return
    }
    const v = vol.current
    const i = interne.current
    if (!i.enChute) {
      /* première image : tout se capture ici (recette du vol) */
      i.enChute = true
      i.bascule = false
      i.fini = false
      if (voile.current && !i.fondVoile) i.fondVoile = voile.current.style.background
      remetHorloge()
      chute.monde = "ciel"
      v.t = 0
      v.plonge = 0
      v.chute = 0
      v.rue = poseNeutre()
    }
    const t = (chute.t = avanceHorloge(delta))
    const tau = t - CHUTE

    if (tau < 0) poseSuspendue(t, v.ciel)
    else poseTombanteCiel(tau, v.ciel)
    if (v.rue) poseTombanteRue(Math.max(tau, 0), v.rue)

    if (tau >= BASCULE && !i.bascule) {
      i.bascule = true
      chute.monde = "rue"
      surBascule()
    }
    regleVoileEtBrume(tau, enRue, voile.current, scene.fog, gl)
    poseBandes(montage, t)
    if (tau >= 0) attenueMusique(fonduMusique(tau / FONDU_S))

    if (t >= T_FINI && !i.fini) {
      i.fini = true
      fini()
    }
  })

  return null
}

/* la courbe du fondu : lente au départ et à l'arrivée */
const fonduMusique = (p: number) => 0.5 * (1 + Math.cos(Math.PI * Math.min(1, Math.max(0, p))))

function regleVoileEtBrume(tau: number, enRue: boolean, voile: HTMLDivElement | null, fog: THREE.Fog | THREE.FogExp2 | null, gl: THREE.WebGLRenderer) {
  if (tau < 0) {
    if (voile) voile.style.opacity = "0"
    return
  }
  /* dans le ciel, le banc monte ; sous le banc, il s'efface quand la rue
     est vraiment montée (le commit React peut suivre d'une image) */
  const entree = Math.max(lisse(...VOILE_TEMPS, tau), lisse(...VOILE_HAUTEUR, chute.cameraY))
  const levee = enRue ? lisse(BASCULE + 0.1, BASCULE + 0.1 + VOILE_LEVEE_S, tau) : 0
  const opacite = chute.monde === "ciel" ? douce(entree) : 1 - douce(levee)
  if (voile) {
    const coeur = Math.min(1, entree)
    const sortie = lisse(BASCULE - 0.25, BASCULE + 0.3, tau)
    for (let k = 0; k < 2; k++)
      teinte[k].lerpColors(VOILE_ENTREE[k], VOILE_COEUR[k], coeur).lerp(VOILE_SORTIE[k], douce(sortie))
    voile.style.background = `linear-gradient(180deg, #${teinte[0].getHexString()}, #${teinte[1].getHexString()})`
    voile.style.opacity = opacite.toFixed(3)
  }

  const plongee = chute.monde === "ciel" ? douce(entree) : 1
  const remontee = douce(lisse(BASCULE + EXPOSITION_REMONTEE[0], BASCULE + EXPOSITION_REMONTEE[1], tau))
  gl.toneMappingExposure = THREE.MathUtils.lerp(1, EXPOSITION_BANC, plongee * (1 - remontee))

  if (!(fog instanceof THREE.Fog) || chute.monde === "ciel") return
  const u = douce(lisse(BASCULE, BASCULE + BRUME_OUVERTURE_S, tau))
  fog.color.lerpColors(BRUME_NUAGE.couleur, BRUME_NUIT.color, u)
  fog.near = THREE.MathUtils.lerp(BRUME_NUAGE.proche, BRUME_NUIT.near, u * u)
  /* exponentielle : l'ouverture se lit régulière à l'œil */
  fog.far = BRUME_NUAGE.loin * Math.pow(BRUME_NUIT.far / BRUME_NUAGE.loin, u)
}

/* ---- la caméra ---------------------------------------------------------- */

/* LES PLANS, sur la carrosserie (repère du GLB : nez +z, côté conducteur
   +x, phares à z 1,6 à 2,0, feux à -1,6 à -1,9, aileron vers y 1,2 et
   z -1,8, roues avant à z 1,3 et arrière à -1,2, rayon 0,33). La caméra
   (de, a) se place dans le repère de la voiture SANS son tangage : elle
   tourne avec son cap, garde l'horizon droit, et la voiture bascule
   devant elle ; la visée (viseDe, viseA) est sur la carrosserie même,
   tangage compris, et porte le point net. Longue focale (fov 16 à 30,
   un 50 à 85 mm), mouvement lent et constant dans chaque plan, coupe
   franche au suivant. */
type V3 = [number, number, number]
type Plan = { debut: number; de: V3; a: V3; viseDe: V3; viseA: V3; fov: [number, number]; nettete: number }
/* le centre de la boîte du GLB (sans son disque de sol) */
const CENTRE_GLB: V3 = [-0.075, 0.715, 0.045]
const PLANS: Plan[] = [
  /* le phare, en macro, vu d'en dessous et de face : la voiture pique
     encore du nez, l'œil regarde vers la caméra */
  { debut: ECRAN_COUPE, de: [1.1, -1.39, 1.94], a: [0.9, -1.3, 2.0], viseDe: [0.5, 0.53, 1.82], viseA: [0.52, 0.53, 1.8], fov: [17, 15], nettete: 0.8 },
  /* le drop : trois-quarts avant en contre-plongée, elle se redresse
     sur le couchant, la caméra s'approche en tournant */
  { debut: COUPES[0], de: [3.9, -0.55, 4.6], a: [3.2, -0.3, 4.4], viseDe: [0.2, 0.58, 0.9], viseA: [0.25, 0.6, 1.0], fov: [26, 23], nettete: 3 },
  /* le profil : travelling latéral le long du flanc, de l'aile avant et
     sa jante jusqu'au passage de roue arrière */
  { debut: COUPES[1], de: [3.5, 0.5, 2.6], a: [3.5, 0.6, -2.2], viseDe: [0.85, 0.48, 1.35], viseA: [0.85, 0.55, -1.25], fov: [24, 24], nettete: 2 },
  /* trois-quarts arrière : du feu à l'aileron, la caméra monte, le
     point net glisse de l'un à l'autre */
  { debut: COUPES[2], de: [2.5, 0.75, -4.1], a: [1.4, 2.25, -3.7], viseDe: [0.52, 0.8, -1.82], viseA: [-0.05, 1.18, -1.8], fov: [21, 17], nettete: 1.5 },
  /* la plongée : elle, au-dessus de la mer de nuages ; la chute part de
     ce plan, sans coupe, la visée déjà au centre de la voiture */
  { debut: COUPES[3], de: [6.4, 4.2, 4.3], a: [7.0, 4.6, 5.0], viseDe: CENTRE_GLB, viseA: CENTRE_GLB, fov: [30, 31], nettete: 4 },
]
const NETTETE_CHUTE = 5
/* le premier temps, avant l'écran coupé : la pose du ciel, un souffle
   de travelling avant */
const APPROCHE_CIEL = { avance: 0.06, fov: 35 }

/* LE SUIVI, en forme close (la même courbe à toute cadence) : la caméra
   rejoue la chute de la voiture avec RETARD secondes de retard (elle la
   voit partir, puis tombe à sa vitesse), la visée avec RETARD_VISE, les
   deux retards montant en RETARD_MONTEE. L'écart à la voiture, gelé au
   départ de la chute, glisse vers celui de la rue (au-dessus, à l'est,
   au sud) ; en rue la caméra freine plus tôt que la voiture
   (FREIN_CAMERA) ; la vitesse du dernier plan
   s'éteint en ELAN_S ; sur APPROCHE_S la caméra rejoint la droite
   d'approche du travelling. Ciel et rue partagent la même descente :
   la vitesse passe la bascule telle quelle. */
const RETARD = 0.22
const RETARD_VISE = 0.06
const RETARD_MONTEE = 0.8
const ECART_RUE = new THREE.Vector3(3.2, 4.5, 6.5)
const ECART_RUE_S = 1.5
const ELAN_S = 0.5
const APPROCHE_S = 2.2
const FOV_CHUTE = 31
const FOV_RUE = 34
/* le point net s'efface sous les nuages : la ville reste nette */
const FLOU_PLANS = 3
const FLOU_CHUTE = 2
const NETTETE_DERNIER_PLAN = PLANS[PLANS.length - 1].nettete
const RELAIS_FLOU_S = 0.5

const CENTRE_POSEE = new THREE.Vector3(POSE_VOITURE[0], POSE_VOITURE[1] + 0.6, POSE_VOITURE[2])
const VISE_ARRIVEE_LOCALE = new THREE.Vector3(0, 1.05, 0)

const camPrec = new THREE.Vector3()
const point = new THREE.Vector3()
const centre = new THREE.Vector3()
const ecart = new THREE.Vector3()
const surDroite = new THREE.Vector3()
const nez = new THREE.Vector3()
const lacetMat = new THREE.Matrix4()
/* une caméra, pas un Object3D : seul un isCamera regarde vers -z */
const pivot = new THREE.PerspectiveCamera()

/* gelés au départ de la chute */
const suivi = { parti: false, ecart: new THREE.Vector3(), elan: new THREE.Vector3(), tPrec: 0 }

/* APRÈS le ciel et la rue (priorité 0, et le ciel s'abonne tard, sous
   Suspense) : leurs assiettes de cette image sont posées, la caméra vise
   ce qui sera peint ; le flou lit ensuite sa visée ; le composer rend à 1 */
const PRIORITE_CAMERA = 0.5
const PRIORITE_FLOU = 0.75

export function CameraChute({ montage, etat, cockpit }: { montage: Montage; etat: string; cockpit: Cockpit }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  useFrame(() => {
    if (etat !== "ATTERRISSAGE") {
      suivi.parti = false
      chute.flou = 0
      return
    }
    const t = chute.t
    const modele = voitureDuCiel.modele
    if (!modele) return
    modele.updateWorldMatrix(true, false)

    if (t < CHUTE) {
      suivi.parti = false
      if (t < ECRAN_COUPE) planDuCiel(camera, modele, t)
      else planDeCoupe(camera, modele, t)
    } else {
      if (!suivi.parti) {
        /* le dernier plan passe la main : son écart à la voiture et sa
           vitesse sont repris */
        suivi.parti = true
        suivi.ecart.subVectors(camera.position, centreDuCiel(modele, centre))
        suivi.elan.subVectors(camera.position, camPrec).divideScalar(Math.max(1e-3, t - suivi.tPrec))
      }
      suis(camera, modele, cockpit.voiture, t - CHUTE)
    }
    camPrec.copy(camera.position)
    suivi.tPrec = t
    chute.cameraY = camera.position.y
    compenseCadre(camera, montage, t)
  }, PRIORITE_CAMERA)

  return null
}

function centreDuCiel(modele: THREE.Object3D, out: THREE.Vector3) {
  /* le GLB est recentré dans le ciel : son centre est l'opposé de sa
     position */
  return modele.localToWorld(out.copy(modele.position).negate())
}

function cadre(camera: THREE.PerspectiveCamera, vise: THREE.Vector3, fov: number, nettete: number, flou: number) {
  pivot.position.copy(camera.position)
  pivot.lookAt(vise)
  camera.quaternion.copy(pivot.quaternion)
  camera.fov = fov
  camera.updateProjectionMatrix()
  chute.foyer.copy(vise)
  chute.nettete = nettete
  chute.flou = flou
}

/* le premier temps : la pose du ciel de toujours (aucune coupe au clic) */
function planDuCiel(camera: THREE.PerspectiveCamera, modele: THREE.Object3D, t: number) {
  const u = t / ECRAN_COUPE
  centreDuCiel(modele, point)
  camera.position.lerpVectors(POSE, point, APPROCHE_CIEL.avance * u)
  cadre(camera, point, THREE.MathUtils.lerp(FOV_POSE, APPROCHE_CIEL.fov, u), NETTETE_CHUTE, 0)
}

function planDeCoupe(camera: THREE.PerspectiveCamera, modele: THREE.Object3D, t: number) {
  let k = 0
  while (k + 1 < PLANS.length && t >= PLANS[k + 1].debut) k++
  const p = PLANS[k]
  const fin = k + 1 < PLANS.length ? PLANS[k + 1].debut : CHUTE
  const u = lisse(p.debut, fin, t)
  centreDuCiel(modele, centre)
  /* le cap de la voiture, sans son tangage : l'axe du nez à plat */
  nez.set(0, 0, 1).transformDirection(modele.matrixWorld)
  lacetMat.makeRotationY(Math.atan2(nez.x, nez.z))
  camera.position
    .set(...p.de)
    .lerp(point.set(...p.a), u)
    .add(modele.position)
    .applyMatrix4(lacetMat)
    .add(centre)
  modele.localToWorld(point.set(...p.viseDe).lerp(ecart.set(...p.viseA), u))
  cadre(camera, point, THREE.MathUtils.lerp(p.fov[0], p.fov[1], u), p.nettete, FLOU_PLANS)
}

/* le retard monte de 0 : la caméra part avec la voiture, au repos */
const retarde = (tau: number, retard: number) => tau - retard * douce(lisse(0, RETARD_MONTEE, tau))

function suis(camera: THREE.PerspectiveCamera, modele: THREE.Object3D, voiture: THREE.Object3D | null, tau: number) {
  const t = CHUTE + tau
  ecart.copy(suivi.ecart).lerp(ECART_RUE, douce(lisse(BASCULE, BASCULE + ECART_RUE_S, tau)))
  ecart.addScaledVector(suivi.elan, ELAN_S * (1 - Math.exp(-tau / ELAN_S)))
  if (chute.monde === "ciel") {
    /* le centre mesuré porte la respiration ; le retard s'y ajoute */
    centreDuCiel(modele, centre)
    camera.position.copy(centre).add(ecart)
    camera.position.y += descente(tau) - descente(retarde(tau, RETARD))
    point.copy(centre)
    point.y += descente(tau) - descente(retarde(tau, RETARD_VISE))
    /* le point net et le flou du dernier plan glissent vers ceux de la
       chute : elle part sans coupe */
    const relais = douce(lisse(0, RELAIS_FLOU_S, tau))
    cadre(camera, point, fovDeChute(t), THREE.MathUtils.lerp(NETTETE_DERNIER_PLAN, NETTETE_CHUTE, relais), THREE.MathUtils.lerp(FLOU_PLANS, FLOU_CHUTE, relais))
    return
  }
  /* la rue n'est vue qu'une fois sa voiture montée et mesurée */
  if (!voiture) return
  const approche = travellingDe(voiture)
  const w = douce(lisse(T_FINI - APPROCHE_S, T_FINI, t))
  camera.position.copy(CENTRE_POSEE).add(ecart)
  camera.position.y += hauteurFreinee(retarde(tau, RETARD), FREIN_CAMERA)
  camera.position.lerp(droiteApproche(t, approche, surDroite), w)
  point.copy(CENTRE_POSEE)
  point.y += hauteurRue(retarde(tau, RETARD_VISE))
  point.lerp(approche.viseArriere, w)
  cadre(camera, point, fovDeChute(t), NETTETE_CHUTE, THREE.MathUtils.lerp(FLOU_CHUTE, 0, douce(lisse(BASCULE, BASCULE + BRUME_OUVERTURE_S, tau))))
}

/* la droite qui arrive sur le départ du travelling à sa vitesse et dans
   son axe, à l'instant FINI */
function droiteApproche(t: number, approche: Travelling, out: THREE.Vector3) {
  return out.copy(approche.depart).addScaledVector(approche.tangente, -V_ARRIVEE * (T_FINI - t))
}

/* la focale du suivi : celle du dernier plan, un peu plus large pour la
   chute puis pour la rue, et celle du travelling à l'arrivée */
const FOV_DERNIER_PLAN = PLANS[PLANS.length - 1].fov[1]
function fovDeChute(t: number) {
  const chuteFov = THREE.MathUtils.lerp(FOV_DERNIER_PLAN, FOV_CHUTE, douce(lisse(CHUTE, CHUTE + 1.2, t)))
  const rueFov = THREE.MathUtils.lerp(chuteFov, FOV_RUE, douce(lisse(CHUTE + BASCULE, CHUTE + BASCULE + 1, t)))
  return THREE.MathUtils.lerp(rueFov, FOV_POSE, douce(lisse(T_FINI - APPROCHE_S, T_FINI, t)))
}

/* ---- les bandes --------------------------------------------------------- */

/* Obliques : le parallélogramme de la référence (pente OBLIQUE_DEG, la
   bande d'image décalée vers le haut), posé d'un coup sur l'écran coupé,
   ouvert en un éclair sur le drop. Cadre : le scope 2,39:1, refermé en
   un souffle et rouvert quand la voiture tombe. */
const OBLIQUE_DEG = -12
const OBLIQUE_DECALAGE = -0.06
const OBLIQUE_DEMI_HAUTEUR = 0.34
const OBLIQUE_OUVERTURE_S = 0.22
const FORMAT_SCOPE = 2.39
const CADRE_FERMETURE_S = 0.35
const CADRE_OUVERTURE_S = 0.9

const bandes: { haut: HTMLDivElement | null; bas: HTMLDivElement | null } = { haut: null, bas: null }

function poseBandes(montage: Montage | null, t: number) {
  const { haut, bas } = bandes
  if (!haut || !bas || !montage) return
  const h = window.innerHeight
  const demiDiagonale = Math.hypot(window.innerWidth, h) / 2
  let angle = 0
  let centre = 0
  let demi = demiDiagonale
  if (montage === "obliques") {
    if (t >= ECRAN_COUPE && t < COUPES[0] + OBLIQUE_OUVERTURE_S) {
      angle = OBLIQUE_DEG
      centre = OBLIQUE_DECALAGE * h
      const ouvre = 1 - Math.pow(1 - lisse(COUPES[0], COUPES[0] + OBLIQUE_OUVERTURE_S, t), 3)
      demi = THREE.MathUtils.lerp(OBLIQUE_DEMI_HAUTEUR * h, demiDiagonale, ouvre)
    }
  } else {
    demi = demiCadre(t, demiDiagonale)
  }
  haut.style.transform = `rotate(${angle}deg) translateY(${(centre - demi).toFixed(1)}px)`
  bas.style.transform = `rotate(${angle}deg) translateY(${(centre + demi).toFixed(1)}px)`
}

/* la demi-hauteur d'image laissée par le scope à l'instant t */
function demiCadre(t: number, demiOuvert: number) {
  const scope = Math.min(window.innerWidth / FORMAT_SCOPE, window.innerHeight) / 2
  const ferme = douce(lisse(ECRAN_COUPE, ECRAN_COUPE + CADRE_FERMETURE_S, t)) * (1 - douce(lisse(CHUTE, CHUTE + CADRE_OUVERTURE_S, t)))
  return THREE.MathUtils.lerp(demiOuvert, scope, ferme)
}

/* sous le scope, la focale s'ouvre d'autant que le cadre se resserre :
   la bande d'image garde le cadrage plein écran des plans (jantes, toit,
   aileron) au lieu de le rogner */
function compenseCadre(camera: THREE.PerspectiveCamera, montage: Montage, t: number) {
  if (montage !== "cadre") return
  const visible = (2 * demiCadre(t, window.innerHeight / 2)) / window.innerHeight
  if (visible >= 1) return
  const demiAngle = THREE.MathUtils.degToRad(camera.fov / 2)
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(demiAngle) / visible))
  camera.updateProjectionMatrix()
}

/* les deux bandes, sur la toile et sous les boutons ; chacune pivote
   autour du centre de l'écran, son bord intérieur y passe */
const bande = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "300vmax",
  height: "150vmax",
  marginLeft: "-150vmax",
  background: "#000",
  pointerEvents: "none",
} as const

export function BandesChute() {
  return (
    <>
      <div
        ref={(d) => void (bandes.haut = d)}
        style={{ ...bande, marginTop: "-150vmax", transformOrigin: "50% 100%", transform: "translateY(-150vmax)" }}
      />
      <div
        ref={(d) => void (bandes.bas = d)}
        style={{ ...bande, transformOrigin: "50% 0", transform: "translateY(150vmax)" }}
      />
    </>
  )
}

/* ---- la profondeur de champ ---------------------------------------------- */

/* à monter EN TÊTE du composer (rendu.tsx) : ses programmes compilent
   avec ceux des effets, avant le rideau ; hors montage son flou est nul */
export function FlouChute() {
  const effet = useRef<DepthOfFieldEffect>(null)
  useFrame(() => {
    const e = effet.current
    if (!e?.target) return
    e.target.copy(chute.foyer)
    e.cocMaterial.focusRange = chute.nettete
    e.bokehScale = chute.flou
  }, PRIORITE_FLOU)
  return <DepthOfField ref={effet} target={[0, 0, 0]} focusRange={3} bokehScale={0} />
}

/* ---- le travelling d'entrée --------------------------------------------- */

/* « on rentre dedans, il faut que le travelling se fasse sans à-coup ».
   Le seuil de toujours (seuil.tsx) garde sa partition (contact,
   claquement, nom, verre intérieur, fini) ; seule sa CAMÉRA est
   remplacée, image par image, juste après lui. Ce qu'il avait d'à-coups :
   un quasi-arrêt sous le nom (8 m/s puis 0,35 m/s), une ré-accélération
   à 12 m/s, une visée qui pivote très vite en passant sur la planche,
   cachée par un voile noir.

   Ici, une seule spline naturelle (en longueur d'arc) de la vue
   d'arrivée à l'œil du conducteur, un profil de vitesse en Hermite QUINTIQUE
   (vitesse et accélération continues), et l'entrée se fait EN RECULANT :
   après le nom, la caméra monte au-dessus de l'avant et pivote d'un
   demi-tour (lacet seul) pour regarder la route, puis redescend à
   reculons par le pare-brise jusqu'au siège. Le verre est derrière elle
   quand elle le traverse : plus de voile. La focale glisse de 38 à 45 en
   continu, la course meurt sur l'assise exacte du seuil (même pose, même
   focale : le passage à l'habitacle ne bouge pas d'un pixel). La chute
   arrive sur son départ à V_ARRIVEE, dans l'axe de sa tangente. */

/* les ancres, repère voiture (nez +z, conducteur +x) : flanc large, 3/4
   avant (claquement), fin du lent travelling du nom (de 3/4 : de face,
   les phares aveuglent), au-dessus de l'avant (le demi-tour), au-dessus
   du capot, le pare-brise (mesuré au GLB du seuil), puis l'œil */
const ANCRES_TRAVELLING: V3[] = [
  [-5.0, 1.7, -0.5],
  [-3.4, 1.5, 6.6],
  [-2.0, 1.7, 5.7],
  [0.3, 2.6, 3.8],
  [0.3, 1.65, 1.6],
  [0.3, 1.1, 0.45],
]
const ANCRE_TQ = 2
const ANCRE_NOM = 3
const ANCRE_VERRE = 6
/* la vitesse d'arrivée, celle du vol de toujours au raccord ; sous le nom
   la vitesse est constante, au verre 15/8 de la vitesse moyenne du
   dernier segment (la plus basse qui laisse la quintique décroître sans
   rebond jusqu'au siège) */
const V_ARRIVEE = 1.78
const PENTE_ARRET = 15 / 8
const T_NOM_FIN = 4.0
/* le demi-tour : du regard sur la voiture à celui de l'assise, lancé
   pendant la fin du nom pour rester sous 120°/s */
const DEMI_TOUR: [number, number] = [3.6, SEUIL_MS / 1000]
const SENS = 1
const FOCALE: [number, number] = [4.6, SEUIL_MS / 1000]
const FOV_ASSIS = 45
/* les visées du début (celles du seuil) : la caisse, puis la calandre */
const VISE_AVANT = new THREE.Vector3(0, 0.75, 1.3)
const VISE_BASCULE = 1.3

type CleQuintique = { t: number; s: number; v: number }

type Travelling = {
  voiture: THREE.Object3D
  courbe: SplineNaturelle
  longueur: number
  cles: CleQuintique[]
  depart: THREE.Vector3
  tangente: THREE.Vector3
  viseArriere: THREE.Vector3
  viseAvant: THREE.Vector3
  /* le regard au début du demi-tour (valeur et vitesse), et à l'arrivée */
  regardDepart: { lacet: number; tangage: number; vLacet: number; vTangage: number }
  regardArrivee: { lacet: number; tangage: number }
}

let travelling: Travelling | null = null
const ECHANTILLONS = 600

/* LA COURBE : une spline cubique NATURELLE par les ancres, paramétrée
   en racine de la corde (centripète, sans boucle) : sa courbure est
   continue aux ancres, là où la Catmull-Rom cassait l'accélération de la
   caméra à chaque passage (pics de 20 à 30 m/s² relevés au #56). Les
   dérivées secondes se résolvent une fois (algorithme de Thomas). */
class SplineNaturelle extends THREE.Curve<THREE.Vector3> {
  private noeuds: number[] = [0]
  private secondes: THREE.Vector3[]

  constructor(private points: THREE.Vector3[]) {
    super()
    /* une table de longueurs fine : la vitesse reste lisse entre ses pas */
    this.arcLengthDivisions = 2000
    const n = points.length - 1
    for (let k = 1; k <= n; k++) this.noeuds.push(this.noeuds[k - 1] + Math.sqrt(points[k].distanceTo(points[k - 1])))
    const h = (k: number) => this.noeuds[k + 1] - this.noeuds[k]
    const pente = (k: number) => points[k + 1].clone().sub(points[k]).divideScalar(h(k))
    /* système tridiagonal sur les points intérieurs, bords naturels */
    const diag: number[] = []
    const droite: THREE.Vector3[] = []
    for (let k = 1; k < n; k++) {
      diag.push(2 * (h(k - 1) + h(k)))
      droite.push(pente(k).sub(pente(k - 1)).multiplyScalar(6))
    }
    for (let k = 1; k < diag.length; k++) {
      const m = h(k) / diag[k - 1]
      diag[k] -= m * h(k)
      droite[k].addScaledVector(droite[k - 1], -m)
    }
    const interieures: THREE.Vector3[] = new Array(diag.length)
    for (let k = diag.length - 1; k >= 0; k--) {
      interieures[k] = droite[k].clone()
      if (k + 1 < diag.length) interieures[k].addScaledVector(interieures[k + 1], -h(k + 1))
      interieures[k].divideScalar(diag[k])
    }
    this.secondes = [new THREE.Vector3(), ...interieures, new THREE.Vector3()]
  }

  /* la fraction du paramètre où passe l'ancre k */
  fraction(k: number) {
    return this.noeuds[k] / this.noeuds[this.noeuds.length - 1]
  }

  getPoint(u: number, out = new THREE.Vector3()) {
    const t = u * this.noeuds[this.noeuds.length - 1]
    let k = 0
    while (k < this.noeuds.length - 2 && t > this.noeuds[k + 1]) k++
    const h = this.noeuds[k + 1] - this.noeuds[k]
    const b = (t - this.noeuds[k]) / h
    const a = 1 - b
    return out
      .copy(this.points[k])
      .multiplyScalar(a)
      .addScaledVector(this.points[k + 1], b)
      .addScaledVector(this.secondes[k], ((a * a * a - a) * h * h) / 6)
      .addScaledVector(this.secondes[k + 1], ((b * b * b - b) * h * h) / 6)
  }
}

/* tracé une fois par voiture : la chute en tire sa droite d'approche */
function travellingDe(voiture: THREE.Object3D): Travelling {
  if (travelling?.voiture !== voiture) travelling = traceTravelling(voiture)
  return travelling
}

function traceTravelling(voiture: THREE.Object3D): Travelling {
  const monde = (l: THREE.Vector3) => enMondeRepos(new THREE.Vector3(), l, voiture)
  const ancres = [
    new THREE.Vector3(...CAM_FINALE),
    ...ANCRES_TRAVELLING.map((l) => monde(new THREE.Vector3(...l))),
    monde(ASSISE.cam),
  ]
  const courbe = new SplineNaturelle(ancres)
  const longueurs = courbe.getLengths(ECHANTILLONS)
  const longueur = longueurs[ECHANTILLONS]
  /* la longueur d'arc jusqu'à l'ancre k */
  const arc = (k: number) => {
    const x = courbe.fraction(k) * ECHANTILLONS
    const j = Math.min(ECHANTILLONS - 1, Math.floor(x))
    return THREE.MathUtils.lerp(longueurs[j], longueurs[j + 1], x - j)
  }
  const duree = SEUIL_MS / 1000
  const vNom = (arc(ANCRE_NOM) - arc(ANCRE_TQ)) / (T_NOM_FIN - CLAQUE[0])
  const vVerre = (PENTE_ARRET * (longueur - arc(ANCRE_VERRE))) / (duree - VERRE_T)
  const tr: Travelling = {
    voiture,
    courbe,
    longueur,
    cles: [
      { t: 0, s: 0, v: V_ARRIVEE },
      { t: CLAQUE[0], s: arc(ANCRE_TQ), v: vNom },
      { t: T_NOM_FIN, s: arc(ANCRE_NOM), v: vNom },
      { t: VERRE_T, s: arc(ANCRE_VERRE), v: vVerre },
      { t: duree, s: longueur, v: 0 },
    ],
    depart: ancres[0].clone(),
    tangente: courbe.getTangentAt(0),
    viseArriere: monde(VISE_ARRIVEE_LOCALE),
    viseAvant: monde(VISE_AVANT),
    regardDepart: { lacet: 0, tangage: 0, vLacet: 0, vTangage: 0 },
    regardArrivee: { lacet: 0, tangage: 0 },
  }
  /* le regard de départ du demi-tour et sa vitesse (différence finie) :
     le panoramique prend la suite sans cassure */
  const pas = 0.02
  const [l1, p1] = regardSuivi(tr, DEMI_TOUR[0])
  const [l0, p0] = regardSuivi(tr, DEMI_TOUR[0] - pas)
  const assis = monde(ASSISE.vise).sub(monde(ASSISE.cam))
  let lacetAssis = lacetDe(assis)
  /* le demi-tour dans le SENS voulu, jamais par le plus court */
  while (SENS * (lacetAssis - l1) < Math.PI / 2) lacetAssis += SENS * 2 * Math.PI
  while (SENS * (lacetAssis - l1) > (3 * Math.PI) / 2) lacetAssis -= SENS * 2 * Math.PI
  tr.regardDepart = { lacet: l1, tangage: p1, vLacet: deroule(l1 - l0) / pas, vTangage: (p1 - p0) / pas }
  tr.regardArrivee = { lacet: lacetAssis, tangage: tangageDe(assis) }
  return tr
}

export function TravellingChute({ etat, cockpit, voile }: { etat: string; cockpit: Cockpit; voile: RefObject<HTMLDivElement | null> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const interne = useRef({ t: 0, parti: false })

  useFrame((_, delta) => {
    const i = interne.current
    if (etat !== "SEUIL") {
      i.parti = false
      return
    }
    /* même condition de départ que le seuil : la voiture mesurée */
    const voiture = cockpit.voiture
    if (!voiture) return
    if (!i.parti) {
      /* la chute a pu filer une image ou deux sur sa droite d'approche
         avant que React ne pose le SEUIL : le travelling reprend où elle
         en est */
      i.parti = true
      i.t = Math.max(0, chute.t - T_FINI)
    }
    /* même horloge que le seuil (delta plafonné) : la partition reste en
       phase, le verre passe au réglage intérieur à la traversée */
    const duree = SEUIL_MS / 1000
    i.t = Math.min(duree, i.t + Math.min(delta, DELTA_MAX))
    chute.t = T_FINI + i.t
    poseTravelling(camera, travellingDe(voiture), i.t)
    if (voile.current) voile.current.style.opacity = "0"
    attenueMusique(fonduMusique((T_FINI - CHUTE + i.t) / FONDU_S))
  })

  return null
}

/* Hermite quintique par morceaux, accélération nulle aux clés : C2 */
function profilQuintique(cles: CleQuintique[], t: number): number {
  if (t <= cles[0].t) return cles[0].s
  const der = cles[cles.length - 1]
  if (t >= der.t) return der.s
  let k = 1
  while (t > cles[k].t) k++
  const a = cles[k - 1]
  const b = cles[k]
  const d = b.t - a.t
  return quintique(a.s, d * a.v, b.s, d * b.v, (t - a.t) / d)
}

/* un segment de Hermite quintique sur u dans [0, 1] : valeurs et pentes
   (déjà multipliées par la durée) aux bouts, accélérations nulles */
function quintique(a: number, va: number, b: number, vb: number, u: number) {
  const u3 = u * u * u
  const u4 = u3 * u
  const u5 = u4 * u
  return (
    (1 - 10 * u3 + 15 * u4 - 6 * u5) * a +
    (u - 6 * u3 + 8 * u4 - 3 * u5) * va +
    (-4 * u3 + 7 * u4 - 3 * u5) * vb +
    (10 * u3 - 15 * u4 + 6 * u5) * b
  )
}

/* lacet et tangage d'une direction (caméra three : elle regarde vers -z) */
const lacetDe = (d: THREE.Vector3) => Math.atan2(-d.x, -d.z)
const tangageDe = (d: THREE.Vector3) => Math.asin(d.y / d.length())
const deroule = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const ici = new THREE.Vector3()
const direction = new THREE.Vector3()
const euler = new THREE.Euler(0, 0, 0, "YXZ")

/* la caméra suit la voiture : la caisse, puis la calandre */
function regardSuivi(tr: Travelling, t: number): [number, number] {
  tr.courbe.getPointAt(profilQuintique(tr.cles, t) / tr.longueur, ici)
  direction.lerpVectors(tr.viseArriere, tr.viseAvant, douce(Math.min(1, t / VISE_BASCULE))).sub(ici)
  return [lacetDe(direction), tangageDe(direction)]
}

function poseTravelling(camera: THREE.PerspectiveCamera, tr: Travelling, t: number) {
  let lacet: number
  let tangage: number
  if (t < DEMI_TOUR[0]) {
    ;[lacet, tangage] = regardSuivi(tr, t)
  } else {
    const d = DEMI_TOUR[1] - DEMI_TOUR[0]
    const u = Math.min(1, (t - DEMI_TOUR[0]) / d)
    lacet = quintique(tr.regardDepart.lacet, tr.regardDepart.vLacet * d, tr.regardArrivee.lacet, 0, u)
    tangage = quintique(tr.regardDepart.tangage, tr.regardDepart.vTangage * d, tr.regardArrivee.tangage, 0, u)
  }
  tr.courbe.getPointAt(profilQuintique(tr.cles, t) / tr.longueur, camera.position)
  camera.quaternion.setFromEuler(euler.set(tangage, lacet, 0))
  camera.fov = THREE.MathUtils.lerp(FOV_POSE, FOV_ASSIS, douce(lisse(FOCALE[0], FOCALE[1], t)))
  camera.updateProjectionMatrix()
}
