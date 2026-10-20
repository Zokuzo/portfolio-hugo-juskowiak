import * as THREE from "three"

/* LES BANDES LED DES OPTIQUES (Hugo, 2026-10-20, références 9 et 10) :
   à l'avant, une fine bande blanche qui suit le bord haut de chaque phare
   puis se recourbe vers le bas côté calandre (une virgule) ; à l'arrière,
   un tube rouge en C, cœur presque blanc, dans un feu fumé. De la vraie
   géométrie : des tubes le long de courbes posées sur le verre des
   optiques (relevées au rayon sur le GLB, repère du GLB, côté droit ; le
   gauche en est le miroir autour de l'axe de la voiture).

   Les matériaux sont des MeshStandardMaterial noirs à émissif hors tone
   mapping : ils s'allument par leur emissiveIntensity, comme les feux du
   GLB, dans la chute (prototype-chute.tsx) et dans la rue (habitacle.tsx),
   qui les retrouvent par leur nom. Le bloom fait le halo. Un enfant nommé
   du modèle, posé sur le GLB du ciel avant le rideau : la rue le clone. */

const NOM = "BandesLed"
export const LED = { avant: "LedAvant", arriere: "LedArriere", coeur: "LedCoeur" }
/* l'axe de symétrie de la caisse (boîte des optiques, plaque.ts) */
const AXE_X = -0.074

/* x, y, z : la courbe du phare droit, 8 mm devant le verre */
const PHARE: [number, number, number][] = [
  [0.645, 0.712, 1.688], [0.6, 0.706, 1.741], [0.54, 0.692, 1.785], [0.49, 0.674, 1.833],
  [0.44, 0.655, 1.876], [0.39, 0.635, 1.913], [0.35, 0.617, 1.94], [0.325, 0.603, 1.952],
  [0.316, 0.592, 1.959], [0.335, 0.586, 1.961], [0.38, 0.589, 1.95], [0.45, 0.594, 1.914],
]
/* le C du feu arrière droit, ouvert vers la plaque, 9 mm derrière le verre */
const FEU: [number, number, number][] = [
  [0.42, 0.835, -1.906], [0.52, 0.838, -1.858], [0.61, 0.838, -1.804], [0.643, 0.815, -1.778],
  [0.646, 0.775, -1.776], [0.625, 0.748, -1.794], [0.585, 0.752, -1.825], [0.535, 0.775, -1.857],
]
const RAYON = { avant: 0.0055, arriere: 0.0075, coeur: 0.0022 }
const SEGMENTS = 64
const FACETTES = 8

/* l'émissif à intensité 1 ; l'allumage pose la même intensité partout
   (ALLUME.optiques, 8) : la bande avant blanc froid, le tube arrière rouge
   vif, son cœur rose pâle que le bloom blanchit */
export const EMISSIF = {
  avant: new THREE.Color(0.5, 0.55, 0.6),
  arriere: new THREE.Color(0.9, 0.012, 0.008),
  coeur: new THREE.Color(0.32, 0.07, 0.05),
}
/* éteintes, les bandes restent un liseré sombre sous le verre */
const ETEINTE = { avant: "#1c1d20", arriere: "#140808", coeur: "#1a0c0c" }

export function poseLeds(modele: THREE.Object3D) {
  if (modele.getObjectByName(NOM)) return
  const bandes = new THREE.Group()
  bandes.name = NOM
  const mats = materiaux()
  for (const miroir of [false, true]) {
    bandes.add(
      tube(PHARE, RAYON.avant, miroir, mats.avant),
      tube(FEU, RAYON.arriere, miroir, mats.arriere),
      tube(FEU.map(([x, y, z]) => [x, y, z - RAYON.arriere * 0.7]), RAYON.coeur, miroir, mats.coeur),
    )
  }
  modele.add(bandes)
}

function tube(points: [number, number, number][], rayon: number, miroir: boolean, materiau: THREE.Material) {
  const courbe = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(miroir ? 2 * AXE_X - x : x, y, z)),
  )
  return new THREE.Mesh(new THREE.TubeGeometry(courbe, SEGMENTS, rayon, FACETTES, false), materiau)
}

function materiaux() {
  const fais = (cle: keyof typeof LED) => {
    const m = new THREE.MeshStandardMaterial({
      color: ETEINTE[cle],
      roughness: 1,
      metalness: 0,
      emissive: EMISSIF[cle],
      emissiveIntensity: 0,
      toneMapped: false,
    })
    m.name = LED[cle]
    return m
  }
  return { avant: fais("avant"), arriere: fais("arriere"), coeur: fais("coeur") }
}
