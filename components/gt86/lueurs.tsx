"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { boiteDans } from "./echappement"
import { halo } from "./rue"

/* LA LUEUR VIOLETTE DES FEUX (Hugo, 2026-10-20 : « c'est le rendu des
   feux qui doit être violet, la lumière qui s'en dégage, pas les feux en
   eux-mêmes »). Les optiques restent blanches à l'avant, rouges à
   l'arrière (prototype-chute.tsx, habitacle.tsx) ; autour d'elles, des
   sprites additifs violets. Aucune lumière three.js : en ajouter une
   recompilerait tous les programmes. Les sprites sont toujours VISIBLES,
   l'opacité seule les allume : ils se compilent avec le reste du ciel,
   avant le rideau. */

export const VIOLET_LUEUR = "#9a4dff"
const LUEUR = { avant: { taille: 1, opacite: 0.4 }, arriere: { taille: 1, opacite: 0.28 } }
/* à l'avant, la lueur part devant et sous le phare (Hugo, 2026-10-20 :
   « halo autour ») : posée sur l'optique, le violet additif teintait en
   lavande le noir du boîtier et noyait la barre LED */
const SOUS_LE_PHARE = { descend: 0.3, avance: 0.35 }
/* la part de la demi-largeur du bandeau où tombe le centre d'une optique */
const ECART = 0.86
/* décollée de la carrosserie : sans ça la caisse mange la moitié du sprite */
const DECOLLE = 0.06

const materiaux = {
  avant: new THREE.SpriteMaterial({ color: VIOLET_LUEUR, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  arriere: new THREE.SpriteMaterial({ color: VIOLET_LUEUR, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
}

export function allumeLueurs(allumees: boolean) {
  materiaux.avant.opacity = allumees ? LUEUR.avant.opacite : 0
  materiaux.arriere.opacity = allumees ? LUEUR.arriere.opacite : 0
}

type Optique = { position: THREE.Vector3; cote: "avant" | "arriere" }

/* à poser à côté du <primitive> de la voiture du ciel, dans le même parent */
export function LueursDuCiel({ modele }: { modele: THREE.Object3D }) {
  const optiques = useMemo(() => optiquesDe(modele), [modele])
  return (
    <group position={modele.position}>
      {optiques.map(({ position, cote }, i) => (
        <sprite key={i} position={position} scale={[LUEUR[cote].taille, LUEUR[cote].taille, 1]} material={materiauAvecHalo(cote)} />
      ))}
    </group>
  )
}

function materiauAvecHalo(cote: "avant" | "arriere") {
  materiaux[cote].map = halo()
  return materiaux[cote]
}

function optiquesDe(modele: THREE.Object3D): Optique[] {
  return [
    ...paireDOptiques(modele, "LightsFront", "avant"),
    ...paireDOptiques(modele, "Taillightbody", "arriere"),
  ]
}

function paireDOptiques(modele: THREE.Object3D, materiau: string, cote: Optique["cote"]): Optique[] {
  const pieces: THREE.Object3D[] = []
  modele.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && ((o as THREE.Mesh).material as THREE.Material).name === materiau) pieces.push(o)
  })
  if (pieces.length === 0) return []
  const boite = boiteDans(modele, pieces)
  const centre = boite.getCenter(new THREE.Vector3())
  const demiLargeur = (boite.max.x - boite.min.x) / 2
  const avant = cote === "avant"
  const y = avant ? centre.y - SOUS_LE_PHARE.descend : centre.y
  const z = avant ? boite.max.z + DECOLLE + SOUS_LE_PHARE.avance : boite.min.z - DECOLLE
  return [-1, 1].map((sens) => ({ position: new THREE.Vector3(centre.x + sens * demiLargeur * ECART, y, z), cote }))
}
