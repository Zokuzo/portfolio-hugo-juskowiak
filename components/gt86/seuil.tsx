"use client"

import { useEffect, useRef, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { ALLUME, ASSISE, allumeHabitacle, type Cockpit } from "./habitacle"
import { enMondeRepos } from "./rue"

/* LE SEUIL — ticket #31, la mise en scène gravée au #24 : « la mise sous
   contact et la plongée dans le verre ». Sur la recette du vol (#30/#26) :
   course à DURÉE FIXE en courbe douce, delta plafonné à 1/12 s,
   initialisation DANS useFrame (première frame, drapeau — jamais dans un
   effet : React les diffère, une frame courrait avant), c'est LUI qui
   envoie le vrai `{t:"fini"}`, l'horloge de scene.tsx n'est qu'un filet.

   Quatre actes :
   1. la caméra glisse du ¾ arrière d'arrivée au ¾ avant, côté rue ;
   2. la mise sous contact en cascade — le combiné s'éveille (surtension
      d'aiguille : le GLB n'offre aucun pivot, le balayage est une lueur
      qui monte, dépasse et se pose), puis écrans, rétroéclairage et néons,
      l'habitacle luisant à travers le verre fumé ;
   3. les phares CLAQUENT en dernier et le nom se pose dessus (overlay DOM,
      ~2,5 s) ;
   4. le nom s'efface, la caméra arc au-dessus du capot vers la vitre
      conducteur : le verre fumé emplit le cadre, son noir devient
      l'obscurité (le voile #161b21 du DOM couvre la traversée du near
      plane), et on ressort assis, l'habitacle déjà vivant.

   Le repère des poses est celui de la VOITURE (brut GLB : nez +z,
   conducteur +x — conduite à droite) converti en monde à l'initialisation
   via localToWorld du clone garé : les chiffres restent lisibles et la
   pose de la rue peut bouger sans rien casser ici. */

const DUREE = 8.2
export const SEUIL_MS = 8200

/* les fenêtres de la partition, en secondes */
const GLISSE_FIN = 1.5
const AIGUILLE_HAUT: [number, number] = [1.5, 2.05]
const AIGUILLE_POSE: [number, number] = [2.05, 2.6]
const CADRAN: [number, number] = [1.6, 2.4]
const INTERIEUR: [number, number] = [2.4, 3.4]
const CLAQUE: [number, number] = [3.6, 3.75]
const NOM_ENTRE: [number, number] = [3.65, 4.05]
const NOM_SORT: [number, number] = [6.5, 6.9]
const PLONGE_DEBUT = 6.7
const VOILE: [number, number] = [7.85, 8.15]
/* la surtension du réveil d'aiguille */
const AIGUILLE_CRETE = 2.4

/* poses caméra en repère voiture (calées aux captures CDP — pose « B » :
   frontal, les deux optiques, HORS des cônes volumétriques dont la
   traversée peignait des aplats crème en bord de cadre) */
const TQ_ARRIVEE = new THREE.Vector3(-3.3, 1.5, 6.8)
const TQ_DERIVE = new THREE.Vector3(-3.05, 1.45, 6.45)
const GLISSE_DETOUR = new THREE.Vector3(-4.5, 1.6, -0.5)
const VISE_ARRIERE = new THREE.Vector3(0, 1.05, 0)
const VISE_AVANT = new THREE.Vector3(0, 0.75, 1.3)
/* la plongée : par-dessus le capot vers la vitre conducteur (+x) */
const PLONGE_1 = new THREE.Vector3(1.2, 1.15, 5.2)
const PLONGE_2 = new THREE.Vector3(2.3, 1.16, 1.3)
const PLONGE_3 = new THREE.Vector3(0.8, 1.06, -0.3)
const VISE_PLONGE_1 = new THREE.Vector3(0, 0.8, 2.0)
const VISE_PLONGE_2 = new THREE.Vector3(0.32, 0.98, -0.3)

const adoucit = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lisse = (a: number, b: number, t: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))
const fenetre = ([a, b]: [number, number], t: number) => lisse(a, b, t)

/* bézier quadratique et cubique, sans allocation par frame */
const bez2 = (out: THREE.Vector3, p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, t: number) => {
  const u = 1 - t
  return out.set(
    u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    u * u * p0.z + 2 * u * t * p1.z + t * t * p2.z,
  )
}
const bez3 = (out: THREE.Vector3, p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, t: number) => {
  const u = 1 - t
  return out.set(
    u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    u * u * u * p0.z + 3 * u * u * t * p1.z + 3 * u * t * t * p2.z + t * t * t * p3.z,
  )
}

export default function Seuil({
  etat,
  cockpit,
  voile,
  nom,
  fini,
}: {
  etat: string
  cockpit: Cockpit
  /* le voile de la plongée (#161b21, le verre fumé gaté) et le nom — deux
     divs du DOM pilotés image par image via leur ref, comme le voile crème
     du vol */
  voile: RefObject<HTMLDivElement | null>
  nom: RefObject<HTMLDivElement | null>
  fini: () => void
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const interne = useRef({
    lance: false,
    plonge: false,
    fini: false,
    t: 0,
    /* les poses en monde, converties du repère voiture au lancement */
    depuis: new THREE.Vector3(),
    tq: new THREE.Vector3(),
    tqDerive: new THREE.Vector3(),
    detour: new THREE.Vector3(),
    viseArriere: new THREE.Vector3(),
    viseAvant: new THREE.Vector3(),
    p1: new THREE.Vector3(),
    p2: new THREE.Vector3(),
    p3: new THREE.Vector3(),
    visePlonge1: new THREE.Vector3(),
    visePlonge2: new THREE.Vector3(),
    assiseCam: new THREE.Vector3(),
    assiseVise: new THREE.Vector3(),
    pos: new THREE.Vector3(),
    vise: new THREE.Vector3(),
  })

  /* le RANGEMENT seulement (recette du vol) : un skip en pleine mise en
     scène restaure la résolution et coupe le voile net — l'état ALLUMÉ de
     la voiture, lui, est posé par l'effet `vivant` de la rue à l'entrée
     de l'habitacle, pas ici. Au fini naturel le voile n'est PAS touché :
     sa dissipation douce (CSS) est déjà en route sur la vue assise. */
  useEffect(() => {
    if (etat !== "SEUIL") return
    const i = interne.current
    return () => {
      i.lance = false
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      if (!i.fini && voile.current) {
        voile.current.style.transition = ""
        voile.current.style.opacity = "0"
      }
    }
  }, [etat, gl, voile])

  useFrame((_, delta) => {
    if (etat !== "SEUIL") return
    const i = interne.current
    /* la course est finie mais React n'a pas encore commité HABITACLE :
       ne pas réécrire la caméra par-dessus l'assise posée */
    if (i.fini) return
    if (!i.lance) {
      /* la voiture doit être montée et mesurée — sinon on attend la frame
         suivante, le filet de scene.tsx couvre le pire */
      const voiture = cockpit.voiture
      if (!voiture) return
      i.lance = true
      i.plonge = false
      i.fini = false
      i.t = 0
      i.depuis.copy(camera.position)
      /* les ancres se posent sur la voiture AU REPOS (enMondeRepos) : si le
         filet a coupé le vol en plein ciel, les groupes de chute portent
         encore l'altitude — la voiture, elle, sera posée dès cette frame */
      for (const [monde, local] of [
        [i.tq, TQ_ARRIVEE],
        [i.tqDerive, TQ_DERIVE],
        [i.detour, GLISSE_DETOUR],
        [i.viseArriere, VISE_ARRIERE],
        [i.viseAvant, VISE_AVANT],
        [i.p1, PLONGE_1],
        [i.p2, PLONGE_2],
        [i.p3, PLONGE_3],
        [i.visePlonge1, VISE_PLONGE_1],
        [i.visePlonge2, VISE_PLONGE_2],
        [i.assiseCam, ASSISE.cam],
        [i.assiseVise, ASSISE.vise],
      ] as const) {
        enMondeRepos(monde, local, voiture)
      }
      if (voile.current) voile.current.style.transition = ""
    }
    i.t = Math.min(1, i.t + Math.min(delta, 1 / 12) / DUREE)
    const t = i.t * DUREE

    /* ---- la caméra ---- */
    if (t < GLISSE_FIN) {
      const e = adoucit(t / GLISSE_FIN)
      bez2(i.pos, i.depuis, i.detour, i.tq, e)
      camera.position.copy(i.pos)
      camera.lookAt(i.vise.lerpVectors(i.viseArriere, i.viseAvant, e))
    } else if (t < PLONGE_DEBUT) {
      /* la tenue : une dérive imperceptible, la pose reste vivante */
      const e = lisse(GLISSE_FIN, PLONGE_DEBUT, t)
      camera.position.lerpVectors(i.tq, i.tqDerive, e)
      camera.lookAt(i.viseAvant)
    } else {
      if (!i.plonge) {
        i.plonge = true
        gl.setPixelRatio(1)
      }
      const e = adoucit(lisse(PLONGE_DEBUT, DUREE, t))
      bez3(i.pos, i.tqDerive, i.p1, i.p2, i.p3, e)
      camera.position.copy(i.pos)
      camera.lookAt(i.vise.lerpVectors(i.visePlonge1, i.visePlonge2, e))
    }

    /* ---- la mise sous contact ---- */
    const haut = fenetre(AIGUILLE_HAUT, t)
    const pose = fenetre(AIGUILLE_POSE, t)
    const aiguille = AIGUILLE_CRETE * haut + (ALLUME.aiguille - AIGUILLE_CRETE) * pose
    for (const m of cockpit.aiguille) m.emissiveIntensity = aiguille
    const cadran = fenetre(CADRAN, t) * ALLUME.cadran
    for (const m of cockpit.cadran) m.emissiveIntensity = cadran
    const dedans = fenetre(INTERIEUR, t)
    for (const m of cockpit.ecran) {
      m.emissiveIntensity = dedans * ALLUME.ecran
      m.color.setScalar(dedans)
    }
    for (const m of cockpit.boutons) m.emissiveIntensity = dedans * ALLUME.boutons
    for (const m of cockpit.planche) m.emissiveIntensity = dedans * ALLUME.planche
    if (cockpit.neons) cockpit.neons.visible = dedans > 0.3

    /* ---- le claquement des phares, en DERNIER ---- */
    const claque = fenetre(CLAQUE, t)
    for (const m of cockpit.optiques) m.emissiveIntensity = claque * ALLUME.optiques
    for (const m of cockpit.signature) m.emissiveIntensity = claque * ALLUME.signature
    for (const m of cockpit.braises) m.emissiveIntensity = claque * ALLUME.braises
    if (cockpit.phares) cockpit.phares.visible = claque > 0

    /* ---- le nom, posé sur le claquement ---- */
    if (nom.current) {
      const opacite = Math.min(fenetre(NOM_ENTRE, t), 1 - fenetre(NOM_SORT, t))
      nom.current.style.opacity = opacite.toFixed(3)
    }

    /* ---- le voile du verre : couvre la traversée du near plane ---- */
    if (voile.current && !i.fini) voile.current.style.opacity = fenetre(VOILE, t).toFixed(3)

    if (i.t >= 1 && !i.fini) {
      i.fini = true
      /* sous le voile plein : tout se pose d'un coup — l'état final
         idempotent, l'assise conducteur, la focale de l'habitacle — puis
         le voile se dissout en CSS (le DOM n'attend pas la boucle WebGL,
         qui repasse en "demand" à l'habitacle). */
      allumeHabitacle(cockpit)
      camera.position.copy(i.assiseCam)
      camera.fov = 45
      camera.lookAt(i.assiseVise)
      camera.updateProjectionMatrix()
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      if (voile.current) {
        voile.current.style.transition = "opacity 600ms ease"
        voile.current.style.opacity = "0"
      }
      fini()
    }
  })

  return null
}
