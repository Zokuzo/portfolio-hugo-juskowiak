"use client"

import { useRef, type MutableRefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { VOL_MS, type Trajectoire } from "./vol"
import { tempsMusique } from "./musique-intro"
import { acteI, acteII, BASCULE, cadre, eteintFlou, montageVoulu, nouveauPlan, RENDU_AU_VOL, type Plan, type Variante } from "./prototype-zoom"

/* PROTOTYPE JETABLE (#56) : le zoom cinématographique, monté en plans.

   Verdict de Hugo sur ?zoom : « c plus b pour matcher la vidéo avec des
   plans avec des coupures comme dans la vidéo et matché avec la musique ».
   Le vol devient donc un MONTAGE : des plans en coupe franche (la caméra
   change d'un coup, aucune interpolation entre deux plans) qui alternent
   la plongée (pose c de prototype-zoom.tsx : la caméra tombe avec la
   voiture) et l'orbite (pose b), les coupes tombant sur la musique.
   ?montage=a|b|c sur / ; &dof=0 coupe la profondeur de champ ; sans
   paramètre, rien ne se monte.

   LES RACCORDS : le premier plan part de la pose du ciel avec la rampe de
   poids de prototype-zoom (pas de coupe au clic). Le dernier plan est
   toujours une plongée sans rotation : elle converge sur CAM_FINALE à
   l'impact et le poids retombe à 0 sur RENDU_AU_VOL, le seuil reçoit la
   caméra de toujours.

   L'HORLOGE : les coupes suivent tempsMusique() quand la musique joue ;
   sinon (son refusé, chargement raté ou en retard) une grille fixe calée
   sur le clic, en secondes de vol. Les coupes ne reculent jamais : si la
   musique démarre en retard, la coupe suivante attend son temps. Si elle
   n'est pas tombée avant RENDU_AU_VOL, le dernier plan est forcé.

   LES EFFETS À LA COUPE : la profondeur de champ de postprocessing n'a pas
   de mémoire d'une image à l'autre (cercle de confusion recalculé à
   chaque image), ni le bloom, ni le tone mapping AgX (non adaptatif) :
   rien ne traîne sur une coupe. */

/* LA GRILLE DE « VISION (Slowed) », mesurée sur la préversion de 24 s
   (ffmpeg en mono 22 050 Hz, flux spectral sur fenêtres de 1024 / pas de
   256 en numpy) : autocorrélation du flux après 2 s, pic à 0,750 s et
   harmonique forte à 0,375 s ; le peigne le mieux calé donne une période
   de 0,7500 s. Grosse caisse et caisse claire alternent toutes les
   0,375 s : 160 bpm, grosse caisse sur 1 et 3, caisse claire sur 2 et 4.
   Le 1 est le drop, de loin l'attaque la plus forte de l'extrait (flux et
   graves à 2,183 s) ; les mesures de 4 temps partent de lui. */
const TEMPS = 0.375
const DROP = 2.18
const mesure = (n: number) => DROP + n * TEMPS
/* les quatre attaques les plus fortes du vol (flux + graves normalisés,
   au moins 0,35 s d'écart) : 0,697 s, le drop, 2,926 s et 3,297 s */
const ACCENTS = [0.7, DROP, 2.93, 3.3]

/* instants de coupe en secondes de musique. Le voile crème couvre de
   1,48 s à 2,51 s (opacité au-dessus de 0,3) : la coupe du drop y est
   cachée, les autres sont visibles */
const COUPES: Record<Variante, number[]> = {
  a: [mesure(-4), mesure(0), mesure(4)],
  b: [mesure(-4), mesure(-2), mesure(0), mesure(2), mesure(4)],
  c: ACCENTS,
}

/* rotation de chaque plan autour de la voiture, en radians, pour que deux
   plans voisins ne cadrent jamais pareil ; le premier et le dernier n'en
   ont pas (raccords du ciel et du seuil). Les deux premiers, souvent dans
   les nuages, restent du côté de la lumière du ciel : au-delà, la caisse
   se découpe en ombre chinoise. Ceux de la rue évitent les tours : à 2,6
   l'orbite entrait dans un immeuble (image noire en capture) */
const TOURS = [0, 1.2, -0.3, -1.7, 0.9]
const VERTICALE = new THREE.Vector3(0, 1, 0)
const DUREE_VOL = VOL_MS / 1000

export function MontageCamera({ etat, vol }: { etat: string; vol: MutableRefObject<Trajectoire> }) {
  const variante = montageVoulu()
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const interne = useRef({ fovBase: 0, plan: 0, pose: nouveauPlan() })

  useFrame(() => {
    const i = interne.current
    if (etat !== "ATTERRISSAGE" || !variante) {
      i.fovBase = 0
      i.plan = 0
      eteintFlou()
      return
    }
    if (!i.fovBase) i.fovBase = camera.fov
    const v = vol.current
    const coupes = COUPES[variante]
    const horloge = tempsMusique() ?? v.t * DUREE_VOL
    while (i.plan < coupes.length && horloge >= coupes[i.plan]) i.plan++
    if (v.t >= RENDU_AU_VOL[0]) i.plan = coupes.length

    const dernier = i.plan === coupes.length
    /* l'alternance part du dernier plan, toujours une plongée */
    const type = (coupes.length - i.plan) % 2 === 0 ? "c" : "b"
    const pose = v.t < BASCULE ? acteI(type, v.t / BASCULE, i.pose) : acteII(type, v, i.pose)
    if (i.plan > 0 && v.t < BASCULE) pose.poids = 1
    tourne(pose, dernier ? 0 : TOURS[i.plan % TOURS.length])
    cadre(camera, pose, i.fovBase)
  })

  return null
}

function tourne(pose: Plan, angle: number) {
  pose.position.sub(pose.vise).applyAxisAngle(VERTICALE, angle).add(pose.vise)
}
