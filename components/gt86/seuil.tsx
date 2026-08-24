"use client"

import { useEffect, useRef, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { ALLUME, ASSISE, allumeHabitacle, type Cockpit } from "./habitacle"
import { CAM_FINALE, enMondeRepos } from "./rue"

/* LE SEUIL — ticket #31, la mise en scène gravée au #24 : « la mise sous
   contact et la plongée dans le verre ». Sur la recette du vol (#30/#26) :
   course à DURÉE FIXE en courbe douce, delta plafonné à 1/12 s,
   initialisation DANS useFrame (première frame, drapeau — jamais dans un
   effet : React les diffère, une frame courrait avant), c'est LUI qui
   envoie le vrai `{t:"fini"}`, l'horloge de scene.tsx n'est qu'un filet.

   Quatre actes SUR UNE SEULE COURBE (2e retour de gate, « pas assez
   fluide » : la version en segments s'arrêtait NET à chaque jonction —
   glissé, stop, tenue, stop, plongée. La caméra suit désormais une
   Catmull-Rom paramétrée en longueur d'arc, et un profil de vitesse
   Hermite C1 dont les nœuds intérieurs portent une pente NON NULLE : du
   départ au verre, elle ne s'arrête jamais) :
   1. l'approche — du ¾ arrière d'arrivée, large autour du flanc, jusqu'au
      ¾ avant, en décélérant SANS s'arrêter ;
   2. la mise sous contact en cascade pendant l'approche — le combiné
      s'éveille (surtension d'aiguille : le GLB n'offre aucun pivot, le
      balayage est une lueur qui monte, dépasse et se pose), puis écrans,
      rétroéclairage et néons, l'habitacle luisant à travers le verre ;
   3. les phares CLAQUENT en dernier et le nom se pose dessus (overlay
      DOM), la caméra en lent travelling avant constant ;
   4. le nom s'efface, la course ré-accélère par-dessus le capot et meurt
      SUR le pare-brise conducteur : le verre fumé emplit le cadre, son
      noir devient l'obscurité (le voile #161b21 du DOM finit le noir),
      et on ressort assis, l'habitacle déjà vivant.

   Le repère des poses est celui de la VOITURE (brut GLB : nez +z,
   conducteur +x — conduite à droite) converti en monde à l'initialisation
   via la pose de repos (enMondeRepos) : les chiffres restent lisibles et
   la pose de la rue peut bouger sans rien casser ici. */

/* PARTITION RESSERRÉE au retour de gate #31 (« ni correcte ni assez
   rapide ») — diagnostiquée aux arrêts sur image CDP puis contre-vérifiée
   au calcul (rejeux numériques indépendants, géométrie du cône relue dans
   drei/core/SpotLight.js, GLB mesuré au sommet) :
   - le « pas assez rapidement » : 8,2 s dont ~2,5 s de plan GELÉ après le
     claquement (dérive 8 cm/s, imperceptible) → 6,1 s, cascade PENDANT le
     glissé, claquement à 2,3 s, et la tenue du nom devient un lent
     travelling avant (~0,9 m en courbe douce) — le cadre reste vivant ;
   - le « pas correctement » : l'ancienne plongée par la vitre latérale
     finissait sa course à bout portant du flanc, voile encore transparent
     (vue à travers le verre AVANT l'obscurité — capturé), et frôlait les
     éclats d'optiques ; elle passe désormais PAR-DESSUS LE CAPOT vers le
     pare-brise conducteur, décélère à zéro sur le verre, et le voile est
     plein avant tout contact — ce chemin passe AU-DESSUS des cônes
     volumétriques et derrière leurs éclats, les faisceaux restent
     allumés (vérifié aux captures du scrubber) ;
   - les à-coups machine-rapide confirmés en revue : visée continue à
     l'entrée de plongée (même cible que la tenue), claquement en 3 frames
     avec cônes ET optiques synchrones, plus AUCUNE bascule de pixelRatio
     en pleine vue, et `depuis` posé sur CAM_FINALE (jamais lu de la
     caméra : le filet peut couper un vol en plein ciel). Les lumières,
     elles, se pilotent par INTENSITÉ seule — topologie constante, voir le
     Cockpit d'habitacle.tsx (le double gel de recompilation shader était
     le premier suspect du gate). */
const DUREE = 6.1
export const SEUIL_MS = 6100

/* les fenêtres de la partition, en secondes */
const AIGUILLE_HAUT: [number, number] = [0.55, 1.05]
const AIGUILLE_POSE: [number, number] = [1.05, 1.5]
const CADRAN: [number, number] = [0.7, 1.4]
const INTERIEUR: [number, number] = [1.15, 2.05]
const CLAQUE: [number, number] = [2.3, 2.35]
const NOM_ENTRE: [number, number] = [2.35, 2.7]
const NOM_SORT: [number, number] = [4.9, 5.2]
const PLONGE_DEBUT = 5.0
const VOILE: [number, number] = [5.72, 5.98]
/* la surtension du réveil d'aiguille */
const AIGUILLE_CRETE = 2.4

/* LE CHEMIN, en repère voiture — la Catmull-Rom passe PAR chaque ancre :
   vue d'arrivée (CAM_FINALE, préfixée en monde à l'init) → large autour
   du flanc → ¾ avant « B » (calé aux captures) → fin du travelling du
   nom → au-dessus du capot → le pare-brise conducteur */
const CHEMIN: [number, number, number][] = [
  [-5.0, 1.7, -0.5],
  [-3.3, 1.5, 6.8],
  [-2.8, 1.43, 6.0],
  [-0.6, 1.78, 3.5],
  [0.3, 1.22, 0.95],
]
/* les index d'ancre qui portent le rythme : le ¾ avant (le claquement y
   arrive) et la fin du travelling (la plongée en part) */
const ANCRE_TQ = 2
const ANCRE_TENUE = 3
/* la pente de départ du profil (fraction du chemin par seconde) : douce
   mais non nulle — la caméra repart sans à-coup de la vue d'arrivée */
const PENTE_DEPART = 0.08

/* les visées : la voiture pendant l'approche, la calandre pendant le nom
   (continue — un saut de 3,8° claquait à l'image), le poste pendant la
   plongée */
const VISE_ARRIERE = new THREE.Vector3(0, 1.05, 0)
const VISE_AVANT = new THREE.Vector3(0, 0.75, 1.3)
const VISE_VERRE = new THREE.Vector3(0.3, 0.95, -0.4)
const VISE_APPROCHE_FIN = 1.3

const adoucit = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lisse = (a: number, b: number, t: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))
const fenetre = ([a, b]: [number, number], t: number) => lisse(a, b, t)

/* le profil de vitesse : Hermite cubique par morceaux, C1 — chaque nœud
   porte sa pente (ds/dt), les nœuds intérieurs une pente NON NULLE : la
   caméra ne s'arrête qu'au verre */
type Cle = { t: number; s: number; m: number }
function profil(cles: Cle[], t: number) {
  if (t <= cles[0].t) return cles[0].s
  const der = cles[cles.length - 1]
  if (t >= der.t) return der.s
  let a = cles[0]
  let b = cles[1]
  for (let k = 1; k < cles.length; k++) {
    if (t <= cles[k].t) {
      a = cles[k - 1]
      b = cles[k]
      break
    }
  }
  const d = b.t - a.t
  const u = (t - a.t) / d
  const u2 = u * u
  const u3 = u2 * u
  return (2 * u3 - 3 * u2 + 1) * a.s + (u3 - 2 * u2 + u) * d * a.m + (-2 * u3 + 3 * u2) * b.s + (u3 - u2) * d * b.m
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
  const interne = useRef({
    lance: false,
    fini: false,
    t: 0,
    /* la courbe et son profil, construits en monde au lancement */
    courbe: null as THREE.CatmullRomCurve3 | null,
    cles: [] as Cle[],
    viseArriere: new THREE.Vector3(),
    viseAvant: new THREE.Vector3(),
    viseVerre: new THREE.Vector3(),
    assiseCam: new THREE.Vector3(),
    assiseVise: new THREE.Vector3(),
    pos: new THREE.Vector3(),
    vise: new THREE.Vector3(),
  })

  /* le RANGEMENT seulement (recette du vol) : un skip en pleine mise en
     scène coupe le voile net — l'état ALLUMÉ de la voiture, lui, est posé
     par l'effet `vivant` de la rue à l'entrée de l'habitacle, pas ici.
     Au fini naturel le voile n'est PAS touché : sa dissipation douce
     (CSS) est déjà en route sur la vue assise. */
  useEffect(() => {
    if (etat !== "SEUIL") return
    const i = interne.current
    return () => {
      i.lance = false
      if (!i.fini && voile.current) {
        voile.current.style.transition = ""
        voile.current.style.opacity = "0"
      }
    }
  }, [etat, voile])

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
      i.fini = false
      i.t = 0
      /* les ancres se posent sur la voiture AU REPOS (enMondeRepos) : si le
         filet a coupé le vol en plein ciel, les groupes de chute portent
         encore l'altitude — la voiture, elle, sera posée dès cette frame.
         L'entrée est CONTRACTUELLEMENT la vue d'arrivée, jamais lue de la
         caméra (la première frame peut courir avant l'effet de pose). */
      const ancres = [
        new THREE.Vector3(...CAM_FINALE),
        ...CHEMIN.map((l) => enMondeRepos(new THREE.Vector3(), new THREE.Vector3(...l), voiture)),
      ]
      i.courbe = new THREE.CatmullRomCurve3(ancres, false, "centripetal")
      /* les fractions de longueur d'arc des ancres du rythme, mesurées sur
         la courbe réelle (600 échantillons) — puis le profil : arrivée au
         ¾ avant pour le claquement, travelling du nom à vitesse constante
         NON NULLE, ré-accélération, mort sur le verre */
      const n = ancres.length - 1
      const longueurs = i.courbe.getLengths(600)
      const total = longueurs[600]
      const frac = (idx: number) => longueurs[Math.round((idx / n) * 600)] / total
      const fTq = frac(ANCRE_TQ)
      const fTenue = frac(ANCRE_TENUE)
      const derive = (fTenue - fTq) / (PLONGE_DEBUT - CLAQUE[0])
      i.cles = [
        { t: 0, s: 0, m: PENTE_DEPART },
        { t: CLAQUE[0], s: fTq, m: derive },
        { t: PLONGE_DEBUT, s: fTenue, m: derive },
        { t: DUREE, s: 1, m: 0 },
      ]
      for (const [monde, local] of [
        [i.viseArriere, VISE_ARRIERE],
        [i.viseAvant, VISE_AVANT],
        [i.viseVerre, VISE_VERRE],
        [i.assiseCam, ASSISE.cam],
        [i.assiseVise, ASSISE.vise],
      ] as const) {
        enMondeRepos(monde, local, voiture)
      }
      if (voile.current) voile.current.style.transition = ""
    }
    i.t = Math.min(1, i.t + Math.min(delta, 1 / 12) / DUREE)
    const t = i.t * DUREE

    /* ---- la caméra : une position sur LA courbe, jamais un segment ---- */
    i.courbe!.getPointAt(profil(i.cles, t), i.pos)
    camera.position.copy(i.pos)
    if (t < VISE_APPROCHE_FIN) {
      camera.lookAt(i.vise.lerpVectors(i.viseArriere, i.viseAvant, adoucit(t / VISE_APPROCHE_FIN)))
    } else if (t < PLONGE_DEBUT) {
      camera.lookAt(i.viseAvant)
    } else {
      camera.lookAt(i.vise.lerpVectors(i.viseAvant, i.viseVerre, adoucit(lisse(PLONGE_DEBUT, DUREE, t))))
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
    for (const n of cockpit.neonLums) n.lum.intensity = dedans * n.plein
    if (cockpit.neons) cockpit.neons.visible = dedans > 0.3

    /* ---- le claquement des phares, en DERNIER — optiques, faisceaux et
       cônes d'un même geste (3 frames). Le chemin par le capot passe
       AU-DESSUS des cônes et derrière leurs éclats : les faisceaux
       restent allumés pendant toute la plongée. ---- */
    const claque = fenetre(CLAQUE, t)
    for (const m of cockpit.optiques) m.emissiveIntensity = claque * ALLUME.optiques
    for (const m of cockpit.signature) m.emissiveIntensity = claque * ALLUME.signature
    for (const m of cockpit.braises) m.emissiveIntensity = claque * ALLUME.braises
    for (const l of cockpit.phareLums) l.intensity = claque * ALLUME.faisceau
    const faisceaux = claque > 0
    if (cockpit.phares) cockpit.phares.visible = faisceaux
    for (const c of cockpit.phareCones) c.visible = faisceaux

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
      if (voile.current) {
        voile.current.style.transition = "opacity 600ms ease"
        voile.current.style.opacity = "0"
      }
      fini()
    }
  })

  return null
}
