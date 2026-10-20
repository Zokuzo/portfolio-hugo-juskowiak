"use client"

import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { DepthOfField } from "@react-three/postprocessing"
import type { DepthOfFieldEffect } from "postprocessing"
import * as THREE from "three"
import { poseNeutre, type Pose, type Trajectoire } from "./vol"
import { CAP, FOV_POSE, PIQUE, POSE, voitureDuCiel } from "./ciel"
import { brume, CAM_FINALE, enMondeRepos, POSE_VOITURE } from "./rue"
import { ASSISE, type Cockpit } from "./habitacle"
import { allumeLueurs } from "./lueurs"
import { EMISSIF, LED, PROJECTEUR } from "./leds"
import { CLAQUE, SEUIL_MS, VERRE_T } from "./seuil"
import { attenueMusique, caleMusique, musiqueEnAttente, tempsMusique } from "./musique-intro"
import { decalageNuages, fileNuages } from "./mer-de-nuages"
import {
  altitudeCiel,
  attitudeCiel,
  detenteRoues,
  douce,
  elanPlongee,
  finDeSegment,
  lisCalage,
  lisse,
  nappeDuCiel,
  partitionDe,
  plafondDuCiel,
  plongee,
  poseRue,
  progresPlongee,
  segmentDe,
  tempsSimule,
  verticaleCamera,
  type Calage,
  type Partition,
  type Segment,
} from "./chute-physique"

/* PROTOTYPE JETABLE (#56) : la nouvelle chute, montée sur la musique (v4).

   La consigne de Hugo : « dès que le début de la musique se lance la
   voiture ralentit dans les airs et là on fait les différents plans de
   coupe sur elle [...] et après on laisse la voiture tomber au sol et on
   rentre dedans ». Son retour sur la v3 : la voiture tombe d'encore plus
   haut avant l'écran coupé, puis quatre plans calqués sur ses références
   (la voiture entière nez en bas, la face avant de près, le trois-quarts
   arrière, la face avant de loin presque à plat), et un cinquième : la
   voiture entière qui tombe vers le sol. Le calage, il le fait lui-même.

   C'est la chute par défaut depuis le 2026-10-20 (Hugo : « chute par
   défaut + prod ») ; ?vol=ancien rejoue l'ancien vol de vol.tsx et
   seuil.tsx. &dof=0 coupe la profondeur de champ ;
   &calage=ecran:2.29,ouvre:5.74,a:4.12,... règle les instants
   (chute-physique.ts, lisCalage) et affiche un bandeau du temps musical.

   LE DÉROULÉ, en secondes depuis le clic (= temps dans l'extrait) :
   1. clic : la lévitation lâche, la voiture tombe en vitesse réelle ; la
      caméra part de la pose du ciel et glisse, sans coupe, vers le plan
      large de trois-quarts qui la suit dans sa chute ; le ralenti
      s'installe juste avant l'écran coupé (chute-physique.ts) ;
   2. ecran : deux bandes noires obliques se referment sur ce même plan
      et le cadrent en parallélogramme (lot 8 : plus de coupe vers un
      autre angle) ;
   3. a, b, c, d : les plans de Hugo, en coupes franches ; à « ouvre »
      les obliques s'ouvrent et rendent l'écran entier ;
   4. tombe : coupe sur le plan 5, le temps reprend sa vitesse en moins
      d'une seconde, la voiture réaccélère jusqu'à 55 m/s, la caméra la suit
      d'au-dessus sur un ressort, en retard ; voile du banc de nuages,
      bascule vers la rue, la brume s'ouvre sur la ville de nuit, la
      voiture se rétablit et frappe le sol (lot 8 : impact franc,
      écrasement, rebond, secousse de la caméra, poussière) ;
   5. fini : la caméra arrive sur la vue d'arrivée (CAM_FINALE) à la
      vitesse et dans l'axe du travelling, qui la porte jusqu'au siège ;
   6. la musique fond de « tombe » à l'entrée dans l'habitacle.

   L'HORLOGE : tempsMusique() quand la musique joue ; tant qu'elle charge,
   le temps reste au début (le ralenti attend la musique) ; sans musique
   (son refusé, fichier absent), une horloge murale calée sur le clic.
   Elle ne recule ni ne gèle jamais : une musique en retard est recalée
   sur l'image, ou rattrapée en ralentissant l'image.

   LE GEL : rien ne compile après le rideau. Les bandes, le bandeau et le
   voile sont du DOM ; brume, exposition, profondeur de champ, assiettes,
   roues et hauteur des nuages ne sont que des uniformes et des matrices ; la profondeur de
   champ est montée en tête du composer dès le départ (rendu.tsx). */

export function montageVoulu(): boolean {
  return typeof location !== "undefined" && new URLSearchParams(location.search).get("vol") !== "ancien"
}

export function flouVoulu(): boolean {
  return montageVoulu() && new URLSearchParams(location.search).get("dof") !== "0"
}

/* la partition, intégrée une fois par page sur le calage de l'URL */
let partitionCourante: Partition | null = null
function partition(): Partition {
  partitionCourante ??= partitionDe(lisCalage(new URLSearchParams(location.search).get("calage")), PIQUE)
  return partitionCourante
}

/* comme le vol : une image lente ne téléporte rien */
const DELTA_MAX = 1 / 12
/* au-delà, la musique qui charge ne retient plus le montage */
const ATTENTE_MAX = 4
/* une musique en retard de plus que ça (départ tardif, trou de lecture)
   est recalée sur l'image, une seule fois par chute : sur un réseau lent,
   le saut vide le tampon et le retard se reformerait sans fin ; en deçà,
   et ensuite, l'image ralentit de moitié pour se laisser rattraper */
const RETARD_MUSIQUE_MAX = 0.5
const RATTRAPAGE = 0.5

/* la course de l'atterrissage, pour le filet de scene.tsx */
export const dureeChuteMs = () => Math.ceil((partition().tFini + ATTENTE_MAX) * 1000)
/* le fondu de la musique : de « tombe » à l'entrée dans l'habitacle */
const dureeFondu = (p: Partition) => p.tFini - p.calage.tombe + SEUIL_MS / 1000


/* ---- l'horloge ---------------------------------------------------------- */

const horloge = { t: 0, partie: false, attente: 0, recalee: false }

function remetHorloge() {
  horloge.t = 0
  horloge.partie = false
  horloge.attente = 0
  horloge.recalee = false
}

function avanceHorloge(delta: number): number {
  const pas = Math.min(delta, DELTA_MAX)
  const musique = tempsMusique()
  if (musique !== null) {
    horloge.partie = true
    if (!horloge.recalee && horloge.t - musique > RETARD_MUSIQUE_MAX) {
      horloge.recalee = true
      caleMusique(horloge.t)
    }
    horloge.t = musique >= horloge.t ? musique : horloge.t + pas * RATTRAPAGE
    return horloge.t
  }
  /* avant son départ, la musique qui charge retient le temps ; après,
     pendant un trou de lecture, l'image avance sur l'horloge murale */
  if (!horloge.partie && musiqueEnAttente() && (horloge.attente += pas) < ATTENTE_MAX) return horloge.t
  horloge.t += pas
  return horloge.t
}

/* ---- les voitures ------------------------------------------------------- */

const attitude = new THREE.Quaternion()
const assiette = new THREE.Euler()

/* la voiture du ciel : l'assiette simulée, décomposée comme ciel.tsx la
   recompose (cap, piqué, roulis), tournée du cap du plan */
function poseDuCiel(p: Partition, t: number, pose: Pose) {
  const decalage = capDuPlan(p, t)
  assiette.setFromQuaternion(attitudeCiel(p, tempsSimule(t, p.calage), attitude), "YXZ")
  pose.y = altitudeCiel(p, t)
  pose.lacet = assiette.y + decalage
  pose.tangage = assiette.x - PIQUE + tangageDuPlan(p, t)
  pose.roulis = assiette.z
  pose.toucher = -1
}

function poseDeLaRue(p: Partition, t: number, pose: Pose) {
  const r = poseRue(p, t)
  pose.y = r.hauteur
  pose.lacet = 0
  pose.tangage = r.tangage
  pose.roulis = r.roulis
  pose.toucher = r.toucher
}

/* les roues pendent en détente : le nœud Wheels du GLB (jantes, pneus,
   freins) et sa visserie descendent le long du « bas » de la voiture */
const ROUES = ["Wheels", "Screws"]
const roues: { modele: THREE.Object3D | null; noeuds: { noeud: THREE.Object3D; base: THREE.Vector3; bas: THREE.Vector3 }[] } = { modele: null, noeuds: [] }

function pendRoues(modele: THREE.Object3D, detente: number) {
  if (roues.modele !== modele) {
    modele.updateWorldMatrix(true, true)
    const vers = (local: THREE.Vector3, parent: THREE.Object3D) => parent.worldToLocal(modele.localToWorld(local))
    roues.modele = modele
    roues.noeuds = ROUES.flatMap((nom) => {
      const noeud = modele.getObjectByName(nom)
      if (!noeud?.parent) return []
      const bas = vers(new THREE.Vector3(0, -1, 0), noeud.parent).sub(vers(new THREE.Vector3(), noeud.parent))
      return [{ noeud, base: noeud.position.clone(), bas }]
    })
  }
  for (const { noeud, base, bas } of roues.noeuds) noeud.position.copy(base).addScaledVector(bas, detente)
}

/* les feux, allumés pendant toute la chute (références 4, 6, 7, 10 et
   11) : le feu arrière fumé rougi de l'intérieur, son C du GLB (RedGlow)
   en lueur et le tube LED en rouge vif (leds.ts), la barre des phares en
   blanc bleuté, leurs projecteurs (LightsFront) en simple reflet bleuté ; la
   lumière qui s'en dégage est violette (lueurs.tsx). La couleur et l'intensité
   émissives des matériaux du GLB, deux uniformes de leur programme déjà
   compilé (pas de carte émissive : elle en compilerait un autre). Hors de
   la chute ils retrouvent leurs valeurs du GLB */
const SEGMENTS_ALLUMES: Segment[] = ["a", "b", "c", "d", "chute"]
const FEUX = [
  { materiau: "Taillightbody", couleur: new THREE.Color("#ff2a1a"), intensite: 0.8 },
  { materiau: "RedGlow", couleur: new THREE.Color("#ff1a0a"), intensite: 1.5 },
  { materiau: LED.avant, couleur: EMISSIF.avant, intensite: 30 },
  { materiau: LED.arriere, couleur: EMISSIF.arriere, intensite: 8 },
  { materiau: LED.coeur, couleur: EMISSIF.coeur, intensite: 8 },
  { materiau: LED.reflet, couleur: EMISSIF.reflet, intensite: 2.5 },
  { materiau: "LightsFront", couleur: new THREE.Color(PROJECTEUR), intensite: 4 },
  { materiau: "HeadlightsTex", couleur: new THREE.Color("#dfeaff"), intensite: 0 },
]
type FeuDuModele = { materiau: THREE.MeshStandardMaterial; couleur: THREE.Color; intensite: number }
const feux: { modele: THREE.Object3D | null; materiaux: FeuDuModele[] } = { modele: null, materiaux: [] }

function materiauxDesFeux(modele: THREE.Object3D) {
  if (feux.modele !== modele) {
    feux.modele = modele
    feux.materiaux = FEUX.map(({ materiau: nom }) => {
      let trouve: THREE.MeshStandardMaterial | undefined
      modele.traverse((o) => {
        const materiau = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
        if (!trouve && materiau?.name === nom && materiau.emissive) trouve = materiau
      })
      if (!trouve) throw new Error(`gt86 : le GLB du ciel n'a plus de matériau ${nom}`)
      return { materiau: trouve, couleur: trouve.emissive.clone(), intensite: trouve.emissiveIntensity }
    })
  }
  return feux.materiaux
}

function allumeFeu(modele: THREE.Object3D, segment: Segment) {
  if (!SEGMENTS_ALLUMES.includes(segment)) return eteinsFeu(modele)
  materiauxDesFeux(modele).forEach(({ materiau }, i) => {
    materiau.emissive.copy(FEUX[i].couleur)
    materiau.emissiveIntensity = FEUX[i].intensite
  })
  allumeLueurs(true)
}

function eteinsFeu(modele: THREE.Object3D) {
  for (const { materiau, couleur, intensite } of materiauxDesFeux(modele)) {
    materiau.emissive.copy(couleur)
    materiau.emissiveIntensity = intensite
  }
  allumeLueurs(false)
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
/* le voile monte avec la voiture qui approche du banc (son centre, en
   altitude : plein avant que la caisse ne touche le sommet -2,6 que le
   banc trancherait net ; lancée par la reprise, elle arrive à 55 m/s,
   le voile monte en un quart de seconde) ou avec la caméra qui descend
   vers le dessus de la nappe */
const VOILE_VOITURE: [number, number] = [12, -0.7]
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
  etat,
  vol,
  voile,
  enRue,
  surBascule,
  fini,
}: {
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
     musical, le monde et les assiettes, pour les captures en temps
     contrôlé. La partition s'intègre ici, sous le voile du chargement,
     pas dans l'image du clic */
  useEffect(() => {
    Object.assign(window as object, { __gt86chute: chute, __gt86vol: vol.current })
    partition()
  }, [vol])

  /* le rangement (skip compris) : voitures, roues, voile, brume, exposition */
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
      if (voitureDuCiel.modele) {
        pendRoues(voitureDuCiel.modele, 0)
        eteinsFeu(voitureDuCiel.modele)
      }
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
      decalageNuages.sol = 0
      decalageNuages.plafond = 0
      fileNuages.etirement = 0
      fileNuages.defile = 0
      poseBandes(partition().calage, 0)
    }
  }, [etat, vol, voile, scene, gl])

  useFrame((_, delta) => {
    if (etat !== "ATTERRISSAGE") {
      if (etat === "CIEL") remetHorloge()
      return
    }
    const v = vol.current
    const i = interne.current
    const p = partition()
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

    poseDuCiel(p, t, v.ciel)
    if (v.rue) poseDeLaRue(p, t, v.rue)
    decalageNuages.sol = nappeDuCiel(p, t)
    decalageNuages.plafond = plafondDuCiel(p, t)
    regleTrainees(p, t)
    if (voitureDuCiel.modele) {
      pendRoues(voitureDuCiel.modele, detenteRoues(tempsSimule(t, p.calage)))
      allumeFeu(voitureDuCiel.modele, segmentDe(p, t))
    }

    if (t >= p.tBascule && !i.bascule) {
      i.bascule = true
      chute.monde = "rue"
      surBascule()
    }
    regleVoileEtBrume(p, t, enRue, voile.current, scene.fog, gl)
    poseBandes(p.calage, t)
    afficheCalage(p, t)
    if (t >= p.calage.tombe) attenueMusique(fonduMusique((t - p.calage.tombe) / dureeFondu(p)))

    if (t >= p.tFini && !i.fini) {
      i.fini = true
      fini()
    }
  })

  return null
}

/* LES TRAÎNÉES DES NUAGES (lot 9) : pendant la plongée de l'intro et la
   chute du plan 5, la mer de nuages s'étire et défile avec la vitesse. Le
   défilé est un chemin (la plongée parcourue, ou l'altitude perdue depuis
   « tombe ») : déterministe, il ne recule jamais */
const TRAINEES = { etirementPlongee: 1.6, defilePlongee: 260, etirementChute: 1.6, defileChute: 1.4 }

function regleTrainees(p: Partition, t: number) {
  if (t < p.calage.tombe) {
    fileNuages.etirement = TRAINEES.etirementPlongee * elanPlongee(p, t)
    fileNuages.defile = TRAINEES.defilePlongee * progresPlongee(p, t)
    return
  }
  const ciel = chute.monde === "ciel"
  fileNuages.etirement = ciel ? TRAINEES.etirementChute * elanDeChute(p, t) : 0
  fileNuages.defile = ciel ? TRAINEES.defileChute * (altitudeCiel(p, p.calage.tombe) - altitudeCiel(p, t)) : 0
}

/* la vitesse de chute du plan 5, de 0 à 1 (1 : VITESSE_PLEINE m/s) ; 0
   une fois en rue */
const VITESSE_PLEINE = 55
function elanDeChute(p: Partition, t: number) {
  if (t < p.calage.tombe || t >= p.tBascule) return 0
  const d = 1 / 120
  return Math.min(1, Math.max(0, (altitudeCiel(p, t - d) - altitudeCiel(p, t + d)) / (2 * d * VITESSE_PLEINE)))
}

/* la courbe du fondu : lente au départ et à l'arrivée */
const fonduMusique = (p: number) => 0.5 * (1 + Math.cos(Math.PI * Math.min(1, Math.max(0, p))))

function regleVoileEtBrume(p: Partition, t: number, enRue: boolean, voile: HTMLDivElement | null, fog: THREE.Fog | THREE.FogExp2 | null, gl: THREE.WebGLRenderer) {
  const tau = t - p.calage.tombe
  const bascule = p.tBascule - p.calage.tombe
  if (tau < 0) {
    if (voile) voile.style.opacity = "0"
    return
  }
  /* dans le ciel, le banc monte ; sous le banc, il s'efface quand la rue
     est vraiment montée (le commit React peut suivre d'une image) */
  const entree = Math.max(lisse(...VOILE_VOITURE, altitudeCiel(p, t)), lisse(...VOILE_HAUTEUR, chute.cameraY))
  const levee = enRue ? lisse(bascule + 0.1, bascule + 0.1 + VOILE_LEVEE_S, tau) : 0
  const opacite = chute.monde === "ciel" ? douce(entree) : 1 - douce(levee)
  if (voile) {
    const coeur = Math.min(1, entree)
    const sortie = lisse(bascule - 0.25, bascule + 0.3, tau)
    for (let k = 0; k < 2; k++)
      teinte[k].lerpColors(VOILE_ENTREE[k], VOILE_COEUR[k], coeur).lerp(VOILE_SORTIE[k], douce(sortie))
    voile.style.background = `linear-gradient(180deg, #${teinte[0].getHexString()}, #${teinte[1].getHexString()})`
    voile.style.opacity = opacite.toFixed(3)
  }

  const plongee = chute.monde === "ciel" ? douce(entree) : 1
  const remontee = douce(lisse(bascule + EXPOSITION_REMONTEE[0], bascule + EXPOSITION_REMONTEE[1], tau))
  gl.toneMappingExposure = THREE.MathUtils.lerp(1, EXPOSITION_BANC, plongee * (1 - remontee))

  if (!(fog instanceof THREE.Fog) || chute.monde === "ciel") return
  const u = douce(lisse(bascule, bascule + BRUME_OUVERTURE_S, tau))
  fog.color.lerpColors(BRUME_NUAGE.couleur, BRUME_NUIT.color, u)
  fog.near = THREE.MathUtils.lerp(BRUME_NUAGE.proche, BRUME_NUIT.near, u * u)
  /* exponentielle : l'ouverture se lit régulière à l'œil */
  fog.far = BRUME_NUAGE.loin * Math.pow(BRUME_NUIT.far / BRUME_NUAGE.loin, u)
}

/* ---- la caméra ---------------------------------------------------------- */

/* LES PLANS DE HUGO. Chacun est posé dans le repère de la voiture figé au
   milieu du plan (son assiette simulée à cet instant), qui suit la
   voiture en translation : elle reste cadrée pendant qu'elle tombe, et
   ce qu'elle tourne pendant le plan (le nez qui se relève, le cap qui
   dérive, la turbulence) se VOIT, au lieu d'emporter la caméra avec
   elle. La caméra = un repère du GLB (`ancre`, assiette comprise) plus un
   écart en mètres dans le repère du CAP seul (`de` vers `a` : la
   contre-plongée reste une contre-plongée quelle que soit l'assiette) ;
   la visée (`viseDe` vers `viseA`) est sur la carrosserie et porte le
   point net (rack focus léger). L'horizon reste droit (lookAt, haut du
   monde). Longue focale, mouvement lent et continu, coupe franche au
   suivant. Repère du GLB : nez +z, conducteur +x.

   LA LUMIÈRE. Le cap de la voiture ne se voit pas d'un plan à l'autre :
   à chaque coupe, il tourne (capDuPlan) pour que l'axe de visée du plan
   fasse l'angle `soleil` (degrés) avec le soleil du ciel. À 0, la
   caméra regarde le couchant : contre-jour, et la lueur du soleil, que
   le bloom fait déborder, derrière la voiture. */
type V3 = [number, number, number]
type Plan = {
  ancre: THREE.Vector3
  de: V3
  a: V3
  viseDe: THREE.Vector3
  viseA: THREE.Vector3
  fov: [number, number]
  nettete: number
  soleil: number
  /* l'assiette du plan, posée à la coupe : `tangage` degrés ajoutés au
     piqué simulé (négatif : le nez se relève) ; `suit` la part de la
     rotation pendant le plan que le repère de la caméra accompagne (0 :
     repère figé au milieu du plan, 1 : la voiture immobile à l'image) */
  tangage: number
  suit: number
}
type PlanDeCoupe = Exclude<Segment, "ciel" | "large" | "chute" | "rue">

/* l'azimut du soleil du ciel, atan2(x, z) de sa direction : le point le
   plus lumineux du dôme (ciel-4k, rotation ROT de ciel.tsx), mesuré à
   (0,22 ; 0,22 ; -0,95), 12,5° au-dessus de l'horizon */
const AZIMUT_SOLEIL = Math.atan2(0.22, -0.95)
const DEGRE = Math.PI / 180

/* les repères de la carrosserie, lus aux boîtes du GLB par matériau */
type Reperes = { centre: THREE.Vector3; phare: THREE.Vector3; face: THREE.Vector3; feu: THREE.Vector3; echappement: THREE.Vector3; aileron: THREE.Vector3 }

function reperesDe(modele: THREE.Object3D): Reperes {
  modele.updateWorldMatrix(true, true)
  const versModele = new THREE.Matrix4().copy(modele.matrixWorld).invert()
  const boite = (materiau: string) => {
    const b = new THREE.Box3()
    modele.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh || (mesh.material as THREE.Material).name !== materiau) return
      mesh.geometry.computeBoundingBox()
      b.union(mesh.geometry.boundingBox!.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(versModele, mesh.matrixWorld)))
    })
    if (b.isEmpty()) throw new Error(`gt86 : le GLB du ciel n'a plus de matériau ${materiau}`)
    return b
  }
  const phares = boite("HeadlightsTex")
  const feux = boite("Taillightbody")
  /* ciel.tsx recentre le GLB sur sa boîte */
  const centre = modele.position.clone().negate()
  const cy = phares.getCenter(new THREE.Vector3()).y
  return {
    centre,
    phare: new THREE.Vector3(phares.max.x - 0.2, cy, phares.max.z - 0.12),
    face: new THREE.Vector3(centre.x, cy - 0.05, phares.max.z),
    feu: new THREE.Vector3(feux.max.x - 0.2, feux.getCenter(new THREE.Vector3()).y, feux.min.z + 0.1),
    echappement: boite("Exhaust").getCenter(new THREE.Vector3()),
    /* l'aileron n'a pas de matériau à lui : au-dessus des feux, au bord
       du coffre (mesuré au #56) */
    aileron: new THREE.Vector3(centre.x, feux.max.y + 0.32, feux.min.z + 0.2),
  }
}

function plansDe(r: Reperes): Record<PlanDeCoupe, Plan> {
  const decale = (v: THREE.Vector3, x: number, y: number, z: number) => v.clone().add(new THREE.Vector3(x, y, z))
  const calandre = r.face.clone().lerp(r.phare, 0.5)
  return {
    /* a (référence 3) : la voiture entière, nez en bas, de trois-quarts
       avant en contre-plongée (l'objectif plus bas en v11 : nez en bas,
       la face se voit d'en dessous), découpée sur le couchant */
    a: { ancre: r.centre, de: [7.4, -4.6, 7.4], a: [6.7, -4.3, 8.1], viseDe: r.centre, viseA: decale(r.centre, 0, 0, 0.2), fov: [26, 25], nettete: 4, soleil: 30, tangage: 0, suit: 0 },
    /* b (référence 4) : la face avant de près, capot et calandre plein
       cadre, l'objectif bas : le soleil déborde sous le bouclier */
    b: { ancre: calandre, de: [1.6, -1.2, 2.7], a: [1.3, -1.05, 2.95], viseDe: calandre, viseA: calandre.clone().lerp(r.phare, 0.4), fov: [30, 28], nettete: 1.2, soleil: 0, tangage: 0, suit: 0 },
    /* c (référence 6) : le trois-quarts arrière serré, l'objectif à
       hauteur du feu, de côté, la roue arrière en premier plan, l'aileron
       découpé sur le ciel, le feu allumé, les échappements. Nez en bas à
       36°, la voiture montrait surtout son plancher noir vu d'en dessous
       (v4) : le plan la pose plus à plat, la contre-plongée vient de son
       assiette et non plus d'un objectif sous elle, et son repère
       accompagne une part de sa rotation */
    c: { ancre: r.feu, de: [1.5, 0.05, -1.3], a: [1.35, 0.12, -1.4], viseDe: r.feu.clone().lerp(r.echappement, 0.25), viseA: r.feu.clone().lerp(r.echappement, 0.2), fov: [40, 38], nettete: 1.4, soleil: 4, tangage: -20, suit: 0.6 },
    /* d (référence 7) : la face avant entière, de face et de loin, la
       voiture presque à plat dans la brume rose */
    d: { ancre: r.centre, de: [0.5, -1.6, 10.5], a: [0.3, -1.4, 9.4], viseDe: r.centre, viseA: r.centre, fov: [21, 20], nettete: 4, soleil: 40, tangage: 0, suit: 0 },
  }
}

const plans: { modele: THREE.Object3D | null; liste: Record<PlanDeCoupe, Plan> | null } = { modele: null, liste: null }
function plansPour(modele: THREE.Object3D) {
  if (plans.modele !== modele || !plans.liste) {
    plans.modele = modele
    plans.liste = plansDe(reperesDe(modele))
  }
  return plans.liste
}

const NETTETE_CHUTE = 5
/* L'OUVERTURE, du clic au plan a, sous les obliques comme avant elles :
   UN plan continu (lot 8, « un plan en plongée qui ne matche pas avec le
   plan des obliques »). La caméra part de la pose du ciel (position,
   visée, focale, immobile) et glisse jusqu'au plan a vers `ecart` (repère
   du monde, depuis le centre de la voiture) et `fov` ; sur `depart`
   secondes elle se met à suivre la chute, jusqu'à `suivi` fois la
   descente de la voiture, qui glisse un peu dans le cadre sans que la
   caméra ne passe au-dessus d'elle */
const OUVERTURE = { ecart: new THREE.Vector3(-8, -1.2, 10.5), fov: 30, suivi: 0.85, depart: 0.8 }
/* la plongée (lot 9) : la caméra la suit avec `retard` secondes de
   retard, sa visée avec `retardVisee` : la voiture file vers les nuages
   et la caméra peine à suivre ; la focale s'ouvre de `fov` degrés au plus
   fort, le vent la secoue */
const PLONGEE_CAMERA = { retard: 0.12, retardVisee: 0.03, fov: 16, vent: 0.22 }
/* la pose du ciel vise l'origine (ciel.tsx) */
const VISEE_DU_CIEL = new THREE.Vector3()

/* LE PLAN 5, la chute, après la coupe de « tombe » : la caméra part
   d'ECART_CHUTE, au-dessus et à côté de la voiture entière, la mer de
   nuages sous elle ; la voiture lui présente son trois-quarts avant
   (VUE_CHUTE, la direction de la caméra dans le repère du cap de la
   voiture). La verticale vient du ressort de chute-physique.ts : la
   voiture réaccélère vers sa vitesse de chute (la reprise, v5), la
   caméra la suit avec un retard qui grandit avec la vitesse, elle file
   vers la mer de nuages loin sous elle ; l'écart
   glisse vers celui de la rue (au-dessus, à l'est, au sud) avant la
   bascule ; sur APPROCHE_S la caméra rejoint la droite d'approche du
   travelling. */
const ECART_CHUTE = new THREE.Vector3(6, 3, 9.5)
const VUE_CHUTE: V3 = [-0.6, 0, 1]
const ECART_RUE = new THREE.Vector3(3.2, 4.5, 6.5)
const ECART_RUE_S = 1.5
const APPROCHE_S = 2.2
const FOV_CHUTE = 30
const FOV_RUE = 34
/* au plan 5 (lot 9), la vitesse se sent : la focale s'ouvre de FOV_VITESSE
   degrés à pleine vitesse, le vent secoue la caméra de VENT_CHUTE mètres
   (au carré de la vitesse, comme la pression) */
const FOV_VITESSE = 9
const VENT_CHUTE = 0.18
/* le point net s'efface sous les nuages : la ville reste nette */
const FLOU_PLANS = 3
const FLOU_CHUTE = 2

const CENTRE_POSEE = new THREE.Vector3(POSE_VOITURE[0], POSE_VOITURE[1] + 0.6, POSE_VOITURE[2])
const VISE_ARRIVEE_LOCALE = new THREE.Vector3(0, 1.05, 0)

const point = new THREE.Vector3()
const centre = new THREE.Vector3()
const ecart = new THREE.Vector3()
const surDroite = new THREE.Vector3()
const repere = new THREE.Quaternion()
const cap = new THREE.Quaternion()
const AXE_Y = new THREE.Vector3(0, 1, 0)
/* une caméra, pas un Object3D : seul un isCamera regarde vers -z */
const pivot = new THREE.PerspectiveCamera()

/* APRÈS le ciel et la rue (priorité 0, et le ciel s'abonne tard, sous
   Suspense) : leurs assiettes de cette image sont posées, la caméra vise
   ce qui sera peint ; le flou lit ensuite sa visée ; le composer rend à 1 */
const PRIORITE_CAMERA = 0.5
const PRIORITE_FLOU = 0.75

export function CameraChute({ etat, cockpit }: { etat: string; cockpit: Cockpit }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  useFrame(() => {
    if (etat !== "ATTERRISSAGE") {
      chute.flou = 0
      return
    }
    const p = partition()
    const t = chute.t
    const modele = voitureDuCiel.modele
    if (!modele) return
    modele.updateWorldMatrix(true, false)

    const segment = segmentDe(p, t)
    if (segment === "ciel" || segment === "large") planDOuverture(camera, modele, p, t)
    else if (t < p.calage.tombe) cadreLePlan(camera, modele, p, t, segment as PlanDeCoupe)
    else suis(camera, modele, cockpit.voiture, p, t)
    chute.cameraY = camera.position.y
  }, PRIORITE_CAMERA)

  return null
}

/* LE CAP DU PLAN, constant d'une coupe à la suivante : 0 jusqu'au plan a
   (le clic ne bouge rien) ; pour un plan de coupe, de quoi mettre
   le soleil à `soleil` degrés de son axe de visée (au milieu du plan) ;
   pour la chute, de quoi présenter VUE_CHUTE à la caméra (à « tombe ») */
function capDuPlan(p: Partition, t: number): number {
  const modele = voitureDuCiel.modele
  const segment = segmentDe(p, t)
  if (!modele || segment === "ciel" || segment === "large" || segment === "rue") return 0
  if (segment === "chute") {
    const azimutCamera = Math.atan2(-ECART_CHUTE.x, -ECART_CHUTE.z)
    return azimutCamera - azimutDeVisee(VUE_CHUTE) - capSimule(p, p.calage.tombe)
  }
  const plan = plansPour(modele)[segment]
  return AZIMUT_SOLEIL + plan.soleil * DEGRE - azimutDeVisee(plan.de) - capSimule(p, milieuDuPlan(p, t))
}

/* l'azimut de la visée d'une caméra posée en `de` autour de la voiture */
const azimutDeVisee = (de: V3) => Math.atan2(-de[0], -de[2])

/* le cap de la voiture simulée, celui de ciel.tsx compris */
const attitudeCap = new THREE.Quaternion()
const assietteCap = new THREE.Euler()
const capCiel = new THREE.Quaternion()

function capSimule(p: Partition, t: number) {
  attitudeCiel(p, tempsSimule(t, p.calage), attitudeCap).premultiply(capCiel.setFromAxisAngle(AXE_Y, CAP))
  return assietteCap.setFromQuaternion(attitudeCap, "YXZ").y
}

function milieuDuPlan(p: Partition, t: number) {
  const debut = p.calage[segmentDe(p, t) as PlanDeCoupe]
  return (debut + finDeSegment(p, t)) / 2
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

const viseOuverture = new THREE.Vector3()
function planDOuverture(camera: THREE.PerspectiveCamera, modele: THREE.Object3D, p: Partition, t: number) {
  const glisse = douce(lisse(0, p.calage.a, t))
  const depart = douce(lisse(0, OUVERTURE.depart, t))
  const altitude = altitudeCiel(p, t)
  const plonge = plongee(p, t)
  centreDuCiel(modele, point)
  ecart.copy(point).add(OUVERTURE.ecart)
  ecart.y -= altitude
  camera.position.lerpVectors(POSE, ecart, glisse)
  camera.position.y += OUVERTURE.suivi * depart * (altitude - plonge) + plongee(p, t - PLONGEE_CAMERA.retard)
  /* le ciel visait l'origine : la visée rejoint la voiture qui part, et
     suit sa plongée de près */
  point.y -= plonge
  viseOuverture.lerpVectors(VISEE_DU_CIEL, point, depart)
  viseOuverture.y += plongee(p, t - PLONGEE_CAMERA.retardVisee)
  const elan = elanPlongee(p, t)
  souffle(camera.position, viseOuverture, t, PLONGEE_CAMERA.vent * elan)
  const fov = THREE.MathUtils.lerp(FOV_POSE, OUVERTURE.fov, glisse) + PLONGEE_CAMERA.fov * elan
  cadre(camera, viseOuverture, fov, NETTETE_CHUTE, FLOU_PLANS * depart)
  tiensEntreLesBandes(camera, modele, viseOuverture, depart)
}

/* LA VOITURE ENTIÈRE ENTRE LES OBLIQUES (Hugo, 2026-10-20 : « elle est
   coupée par les bandes ou par le cadre ») : de l'intro au plan a, la
   caméra recule le long de sa visée jusqu'à ce que les huit coins de la
   boîte de la voiture tiennent dans la fenêtre des bandes fermées
   (poseBandes), réduite de MARGE_CADRE, et dans l'écran. Le recul monte
   avec `poids` (0 au clic : la pose du ciel reste celle du clic). Deux
   passes : le recul change la profondeur des coins, la seconde rattrape. */
const MARGE_CADRE = 0.9
const PASSES_DE_RECUL = 2
const coin = new THREE.Vector3()

function tiensEntreLesBandes(camera: THREE.PerspectiveCamera, modele: THREE.Object3D, vise: THREE.Vector3, poids: number) {
  if (poids <= 0) return
  for (let passe = 0; passe < PASSES_DE_RECUL; passe++) {
    camera.updateMatrixWorld()
    const recul = THREE.MathUtils.lerp(1, reculPourLaFenetre(camera, modele), poids)
    if (recul <= 1) return
    camera.position.sub(vise).multiplyScalar(recul).add(vise)
  }
}

/* le facteur de recul (≥ 1) qui fait tenir les coins : en recul, leur
   écart au centre de l'écran se divise à peu près par ce facteur */
function reculPourLaFenetre(camera: THREE.PerspectiveCamera, modele: THREE.Object3D) {
  const angle = OBLIQUE_DEG * DEGRE
  const nx = -Math.sin(angle)
  const ny = Math.cos(angle)
  const centre = OBLIQUE_DECALAGE
  const demi = OBLIQUE_DEMI_HAUTEUR * MARGE_CADRE
  const demiLargeur = (camera.aspect / 2) * MARGE_CADRE
  const demiHauteur = 0.5 * MARGE_CADRE
  let recul = 1
  for (const local of coinsDe(modele)) {
    coin.copy(local).applyMatrix4(modele.matrixWorld).project(camera)
    /* en hauteurs d'écran depuis le centre, y vers le bas comme le CSS */
    const x = (coin.x * camera.aspect) / 2
    const y = -coin.y / 2
    const d = nx * x + ny * y
    recul = Math.max(recul, d > 0 ? d / (centre + demi) : d / (centre - demi), Math.abs(x) / demiLargeur, Math.abs(y) / demiHauteur)
  }
  return recul
}

/* les coins de la boîte de la voiture, dans le repère du modèle, tirés une
   fois des boîtes de ses géométries */
const coinsDuModele = new WeakMap<THREE.Object3D, THREE.Vector3[]>()
function coinsDe(modele: THREE.Object3D) {
  let coins = coinsDuModele.get(modele)
  if (coins) return coins
  modele.updateWorldMatrix(true, true)
  const versModele = modele.matrixWorld.clone().invert()
  const boite = new THREE.Box3()
  const piece = new THREE.Box3()
  const matrice = new THREE.Matrix4()
  modele.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    piece.copy(mesh.geometry.boundingBox!).applyMatrix4(matrice.multiplyMatrices(versModele, mesh.matrixWorld))
    boite.union(piece)
  })
  const { min, max } = boite
  coins = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new THREE.Vector3(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z))
  coinsDuModele.set(modele, coins)
  return coins
}

/* LE VENT (lot 9) : la caméra tremble à `force` mètres, sur des sinus de
   fréquences incommensurables (déterministe), plus vite que la secousse
   de l'impact n'est longue : un bourdonnement, pas un choc */
const VENT_FREQUENCES = [23, 31, 37, 43]

function souffle(position: THREE.Vector3, visee: THREE.Vector3, t: number, force: number) {
  if (force <= 0) return
  const [a, b, c, d] = VENT_FREQUENCES
  position.x += force * Math.sin(a * t + 0.4) * 0.6
  position.y += force * Math.sin(b * t + 1.9)
  visee.x += force * 0.35 * Math.sin(c * t + 2.6)
  visee.y += force * 0.35 * Math.sin(d * t + 0.8)
}

/* le repère du plan : l'assiette simulée au milieu du plan (ou, selon
   `suit`, plus près de l'instant t), cap de ciel.tsx, cap et tangage du
   plan compris, et son cap seul */
function repereDuPlan(p: Partition, t: number, plan: Plan) {
  const decalage = capDuPlan(p, t)
  const instant = THREE.MathUtils.lerp(milieuDuPlan(p, t), t, plan.suit)
  attitudeCiel(p, tempsSimule(instant, p.calage), repere).premultiply(cap.setFromAxisAngle(AXE_Y, CAP + decalage))
  assiette.setFromQuaternion(repere, "YXZ")
  assiette.x += plan.tangage * DEGRE
  repere.setFromEuler(assiette)
  cap.setFromAxisAngle(AXE_Y, assiette.y)
}

/* le tangage ajouté au piqué simulé pendant un plan de coupe */
function tangageDuPlan(p: Partition, t: number): number {
  const modele = voitureDuCiel.modele
  const segment = segmentDe(p, t)
  if (!modele || segment === "ciel" || segment === "large" || segment === "chute" || segment === "rue") return 0
  return plansPour(modele)[segment].tangage * DEGRE
}

/* la position (out) et la visée (vise) du plan à l'instant t, relatives
   au centre de la voiture */
function positionDuPlan(modele: THREE.Object3D, plan: Plan, u: number, out: THREE.Vector3, vise: THREE.Vector3) {
  out
    .copy(plan.ancre)
    .add(modele.position)
    .applyQuaternion(repere)
    .add(ecart.set(...plan.de).lerp(point.set(...plan.a), u).applyQuaternion(cap))
  vise.copy(plan.viseDe).lerp(plan.viseA, u).add(modele.position).applyQuaternion(repere)
}

const viseRelative = new THREE.Vector3()
function cadreLePlan(camera: THREE.PerspectiveCamera, modele: THREE.Object3D, p: Partition, t: number, segment: PlanDeCoupe) {
  const plan = plansPour(modele)[segment]
  const u = lisse(p.calage[segment], finDeSegment(p, t), t)
  repereDuPlan(p, t, plan)
  centreDuCiel(modele, centre)
  positionDuPlan(modele, plan, u, camera.position, viseRelative)
  camera.position.add(centre)
  cadre(camera, viseRelative.add(centre), THREE.MathUtils.lerp(plan.fov[0], plan.fov[1], u), plan.nettete, FLOU_PLANS)
  /* le plan a commence sous les obliques fermées : la voiture y tient
     entière, puis la caméra avance avec leur ouverture (v11) */
  if (segment === "a") tiensEntreLesBandes(camera, modele, viseRelative, 1 - douce(lisse(p.calage.ouvre, p.calage.ouvre + OUVERTURE_S, t)))
}

function suis(camera: THREE.PerspectiveCamera, modele: THREE.Object3D, voiture: THREE.Object3D | null, p: Partition, t: number) {
  const tau = t - p.calage.tombe
  const bascule = p.tBascule - p.calage.tombe
  ecart.copy(ECART_CHUTE).lerp(ECART_RUE, douce(lisse(0, bascule + ECART_RUE_S, tau)))
  if (chute.monde === "ciel") {
    /* le centre mesuré porte la respiration ; le retard du ressort s'y
       ajoute */
    const { camera: yCamera, visee } = verticaleCamera(p, t, "ciel")
    const altitude = altitudeCiel(p, t)
    centreDuCiel(modele, centre)
    camera.position.copy(centre).add(ecart)
    camera.position.y += yCamera - altitude
    point.copy(centre)
    point.y += visee - altitude
    const elan = elanDeChute(p, t)
    souffle(camera.position, point, t, VENT_CHUTE * elan * elan)
    cadre(camera, point, fovDeChute(p, t) + FOV_VITESSE * elan, NETTETE_CHUTE, FLOU_CHUTE)
    return
  }
  /* la rue n'est vue qu'une fois sa voiture montée et mesurée */
  if (!voiture) return
  const { camera: hCamera, visee } = verticaleCamera(p, t, "rue")
  const approche = travellingDe(voiture)
  const w = douce(lisse(p.tFini - APPROCHE_S, p.tFini, t))
  camera.position.copy(CENTRE_POSEE).add(ecart)
  camera.position.y += hCamera
  camera.position.lerp(droiteApproche(p, t, approche, surDroite), w)
  point.copy(CENTRE_POSEE)
  point.y += visee
  point.lerp(approche.viseArriere, w)
  secoue(camera.position, point, t - p.tToucher)
  cadre(camera, point, fovDeChute(p, t), NETTETE_CHUTE, THREE.MathUtils.lerp(FLOU_CHUTE, 0, douce(lisse(bascule, bascule + BRUME_OUVERTURE_S, tau))))
}

/* LA SECOUSSE de l'impact (lot 8) : courte et forte, la caméra et sa
   visée tremblent sur des sinus de fréquences incommensurables
   (déterministe), l'amplitude s'éteint en `duree` secondes */
const SECOUSSE = { position: 0.32, visee: 0.12, duree: 0.13, frequences: [47, 61, 53] }

function secoue(position: THREE.Vector3, visee: THREE.Vector3, depuisToucher: number) {
  if (depuisToucher < 0) return
  const force = Math.exp(-depuisToucher / SECOUSSE.duree)
  const [fx, fy, fz] = SECOUSSE.frequences
  const tremble = (f: number, phase: number) => force * Math.sin(f * depuisToucher + phase)
  position.x += SECOUSSE.position * tremble(fx, 0.3)
  position.y += SECOUSSE.position * tremble(fy, 1.1)
  position.z += SECOUSSE.position * tremble(fz, 2.2)
  visee.y += SECOUSSE.visee * tremble(fz, 0.7)
}

/* la droite qui arrive sur le départ du travelling à sa vitesse et dans
   son axe, à l'instant FINI */
function droiteApproche(p: Partition, t: number, approche: Travelling, out: THREE.Vector3) {
  return out.copy(approche.depart).addScaledVector(approche.tangente, -V_ARRIVEE * (p.tFini - t))
}

/* la focale du suivi : celle de la chute, un peu plus large pour la rue,
   et celle du travelling à l'arrivée */
function fovDeChute(p: Partition, t: number) {
  const rueFov = THREE.MathUtils.lerp(FOV_CHUTE, FOV_RUE, douce(lisse(p.tBascule, p.tBascule + 1, t)))
  return THREE.MathUtils.lerp(rueFov, FOV_POSE, douce(lisse(p.tFini - APPROCHE_S, p.tFini, t)))
}

/* ---- les bandes --------------------------------------------------------- */

/* Les obliques de la référence (« BMW Falling from Sky ») : un
   parallélogramme (pente OBLIQUE_DEG, la bande d'image décalée vers le
   haut) qui se referme en FERMETURE_S sur le plan continu, fermé pile à
   l'écran coupé, et tenu jusqu'à « ouvre » ; là, les bandes s'ouvrent en
   OUVERTURE_S, toujours penchées. Ouvertes, elles sont hors de l'écran
   quelle que soit leur pente : elles penchent dès le début. */
const OBLIQUE_DEG = -12
const OBLIQUE_DECALAGE = -0.06
const OBLIQUE_DEMI_HAUTEUR = 0.34
const FERMETURE_S = 0.3
const OUVERTURE_S = 0.9

const bandes: { haut: HTMLDivElement | null; bas: HTMLDivElement | null; bandeau: HTMLDivElement | null } = { haut: null, bas: null, bandeau: null }

function poseBandes(calage: Calage, t: number) {
  const { haut, bas } = bandes
  if (!haut || !bas) return
  const h = window.innerHeight
  const demiOuvert = Math.hypot(window.innerWidth, h) / 2
  let angle = 0
  let centre = 0
  let demi = demiOuvert
  if (t > 0) {
    const fermeture = douce(lisse(calage.ecran - FERMETURE_S, calage.ecran, t))
    const ouverture = douce(lisse(calage.ouvre, calage.ouvre + OUVERTURE_S, t))
    angle = OBLIQUE_DEG
    centre = OBLIQUE_DECALAGE * h * fermeture
    demi = THREE.MathUtils.lerp(demiOuvert, OBLIQUE_DEMI_HAUTEUR * h, fermeture * (1 - ouverture))
  }
  haut.style.transform = `rotate(${angle.toFixed(2)}deg) translateY(${(centre - demi).toFixed(1)}px)`
  bas.style.transform = `rotate(${angle.toFixed(2)}deg) translateY(${(centre + demi).toFixed(1)}px)`
}

/* le bandeau de calage (?calage) : le temps musical et ce qu'on voit */
const NOMS: Record<Segment | "seuil", string> = {
  ciel: "ciel, avant l'écran coupé",
  large: "plan large",
  a: "a · la voiture entière, nez en bas",
  b: "b · la face avant, de près",
  c: "c · le trois-quarts arrière",
  d: "d · la face avant, de loin",
  chute: "la chute",
  rue: "la rue",
  seuil: "le seuil",
}

function afficheCalage(p: Partition, t: number, segment: Segment | "seuil" = segmentDe(p, t)) {
  if (!bandes.bandeau) return
  const { ecran, ouvre } = p.calage
  const cadre = t >= ecran && t < ouvre ? " · obliques" : ""
  bandes.bandeau.textContent = `${t.toFixed(2)} s · ${NOMS[segment]}${cadre}`
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
  const [calageAffiche] = useState(() => new URLSearchParams(location.search).has("calage"))
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
      {calageAffiche && (
        <div
          ref={(d) => void (bandes.bandeau = d)}
          data-gt86="calage"
          style={{
            position: "absolute",
            left: 14,
            bottom: 12,
            font: "500 12px/1 var(--f-mono)",
            letterSpacing: "0.06em",
            color: "#e8dff5",
            textShadow: "0 0 3px rgba(0, 0, 0, 0.9)",
            pointerEvents: "none",
          }}
        />
      )}
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
    const p = partition()
    if (!i.parti) {
      /* la chute a pu filer une image ou deux sur sa droite d'approche
         avant que React ne pose le SEUIL : le travelling reprend où elle
         en est */
      i.parti = true
      i.t = Math.max(0, chute.t - p.tFini)
    }
    /* même horloge que le seuil (delta plafonné) : la partition reste en
       phase, le verre passe au réglage intérieur à la traversée */
    const duree = SEUIL_MS / 1000
    i.t = Math.min(duree, i.t + Math.min(delta, DELTA_MAX))
    chute.t = p.tFini + i.t
    poseTravelling(camera, travellingDe(voiture), i.t)
    if (voile.current) voile.current.style.opacity = "0"
    attenueMusique(fonduMusique((p.tFini - p.calage.tombe + i.t) / dureeFondu(p)))
    afficheCalage(p, chute.t, "seuil")
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
