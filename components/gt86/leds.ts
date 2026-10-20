import * as THREE from "three"

/* LES BANDES LED DES OPTIQUES (Hugo, 2026-10-20, références 10 et 11) :
   à l'avant, une barre blanc bleuté épaisse qui longe le bord BAS de
   chaque phare de l'extérieur vers la calandre puis remonte en crochet
   (GT86 phase 2) ; à l'arrière, un tube rouge en C, cœur presque blanc,
   posé sur le C du GLB (RedGlow) sous le verre fumé. De la vraie
   géométrie : des tubes le long de courbes relevées au rayon sur le GLB,
   DANS le boîtier, derrière le verre (repère du GLB, côté droit ; le
   gauche en est le miroir autour de l'axe de la voiture).

   Les matériaux sont des MeshStandardMaterial noirs à émissif hors tone
   mapping : ils s'allument par leur emissiveIntensity, comme les feux du
   GLB, dans la chute (prototype-chute.tsx) et dans la rue (habitacle.tsx),
   qui les retrouvent par leur nom. Le bloom fait le halo. Un enfant nommé
   du modèle, posé sur le GLB du ciel avant le rideau : la rue le clone. */

const NOM = "BandesLed"
export const LED = { avant: "LedAvant", arriere: "LedArriere", coeur: "LedCoeur", reflet: "LedReflet" }
/* l'axe de symétrie de la caisse (boîte des optiques, plaque.ts) */
const AXE_X = -0.074

/* x, y, z : la barre du phare droit, de l'angle extérieur à la calandre,
   2 cm au-dessus du bord bas du verre (plus bas, la lèvre du boîtier
   la cachait à moitié) et 4 à 14 mm derrière lui ; le
   crochet remonte de 5 cm le long du bord haut de la pointe intérieure,
   1 cm sous lui (v11, référence 11) */
const PHARE: [number, number, number][] = [
  [0.655, 0.596, 1.775], [0.63, 0.584, 1.789], [0.6, 0.582, 1.8], [0.57, 0.589, 1.824],
  [0.54, 0.597, 1.836], [0.5, 0.602, 1.86], [0.45, 0.601, 1.893], [0.4, 0.599, 1.912],
  [0.36, 0.597, 1.928], [0.335, 0.598, 1.936], [0.322, 0.602, 1.936], [0.33, 0.607, 1.92],
  [0.35, 0.62, 1.91], [0.375, 0.635, 1.894],
]
/* le centre de la lentille du projecteur droit (LightsFront), 8 mm devant
   elle : un point de reflet bleu sur le disque assombri */
const REFLET: [number, number, number] = [0.59, 0.64, 1.756]
/* le C du feu arrière droit, ouvert vers la plaque : l'axe du RedGlow du
   GLB, 2 mm derrière lui, sous le verre fumé */
const FEU: [number, number, number][] = [
  [0.39, 0.832, -1.892], [0.46, 0.833, -1.86], [0.53, 0.833, -1.822], [0.6, 0.832, -1.783],
  [0.624, 0.827, -1.77], [0.634, 0.815, -1.762], [0.636, 0.79, -1.761], [0.635, 0.765, -1.762],
  [0.627, 0.748, -1.768], [0.61, 0.737, -1.784], [0.585, 0.733, -1.808], [0.56, 0.739, -1.828],
  [0.54, 0.75, -1.838], [0.515, 0.763, -1.85], [0.49, 0.772, -1.86],
]
const RAYON = { avant: 0.013, arriere: 0.0045, coeur: 0.0016, reflet: 0.014 }
const SEGMENTS = 64
const FACETTES = 8

/* l'émissif à intensité 1 ; l'allumage pose la même intensité partout
   (ALLUME.optiques, 8) : la barre avant blanc bleuté, le tube arrière rouge
   vif, son cœur rose pâle que le bloom blanchit */
export const EMISSIF = {
  avant: new THREE.Color(0.75, 0.88, 1),
  arriere: new THREE.Color(0.9, 0.012, 0.008),
  coeur: new THREE.Color(0.32, 0.07, 0.05),
  reflet: new THREE.Color(0.1, 0.3, 1),
}
/* les projecteurs du GLB (LightsFront), au-dessus de la barre : une
   lueur bleu nuit sur la lentille noire, le point REFLET fait l'éclat */
export const PROJECTEUR = "#0b1a36"
/* éteintes, les bandes restent un liseré sombre sous le verre */
const ETEINTE = { avant: "#1c1d20", arriere: "#140808", coeur: "#1a0c0c", reflet: "#0c1220" }
/* le boîtier et la lentille des phares, noirs comme sur la référence 11 :
   la couleur de base, un uniforme de leur programme (la carte reste) ;
   leur poli garde les reflets des réflecteurs */
const BOITIER_SOMBRE = { HeadlightsTex: "#050608", LightsFront: "#050608" }

/* LE VERRE DES PHARES (lot 14) : le GLB n'a qu'un verre (Glass), vitres
   et phares mêlés ; poli en miroir du couchant (ciel.tsx), il teintait
   les phares de lavande. Ses triangles d'avant (z > PHARES_Z, devant le
   pare-brise) passent dans un second groupe, sous un clone du verre :
   même type, mêmes defines, donc même programme GPU ; seuls des
   uniformes changent, pour un verre clair qui laisse voir le noir. Sous
   scene.environment, three r169 ignore l'envMapIntensity (carrosserie.tsx) :
   le reflet du ciel tombe par le spéculaire, le vernis et l'opacité */
const VERRE = "Glass"
const VERRE_PHARE = "GlassPhare"
const PHARES_Z = 1.5
const REGLAGE_VERRE_PHARE = { couleur: "#050608", metalness: 0, envMapIntensity: 0.25, opacity: 0.18, clearcoat: 0.05, specularIntensity: 0.15 }

export function poseLeds(modele: THREE.Object3D) {
  if (modele.getObjectByName(NOM)) return
  const bandes = new THREE.Group()
  bandes.name = NOM
  const mats = materiaux()
  const reflet = new THREE.SphereGeometry(RAYON.reflet, FACETTES, FACETTES / 2)
  for (const miroir of [false, true]) {
    const [x, y, z] = REFLET
    const point = new THREE.Mesh(reflet, mats.reflet)
    point.position.set(miroir ? 2 * AXE_X - x : x, y, z)
    bandes.add(
      point,
      tube(PHARE, RAYON.avant, miroir, mats.avant),
      tube(FEU, RAYON.arriere, miroir, mats.arriere),
      tube(FEU.map(([x, y, z]) => [x, y, z - RAYON.arriere * 0.7]), RAYON.coeur, miroir, mats.coeur),
    )
  }
  modele.add(bandes)
  assombritBoitiers(modele)
  separeVerresPhares(modele)
}

function assombritBoitiers(modele: THREE.Object3D) {
  modele.traverse((o) => {
    const materiau = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
    const sombre = materiau && BOITIER_SOMBRE[materiau.name as keyof typeof BOITIER_SOMBRE]
    if (sombre) materiau.color.set(sombre)
  })
}

function separeVerresPhares(modele: THREE.Object3D) {
  modele.updateMatrixWorld(true)
  const versModele = new THREE.Matrix4().copy(modele.matrixWorld).invert()
  modele.traverse((o) => {
    const mesh = o as THREE.Mesh
    const verre = mesh.material as THREE.MeshPhysicalMaterial
    if (!mesh.isMesh || Array.isArray(verre) || verre?.name !== VERRE) return
    regroupeTrianglesAvant(mesh.geometry, new THREE.Matrix4().multiplyMatrices(versModele, mesh.matrixWorld))
    mesh.material = [verre, verrePhare(verre)]
  })
}

/* le groupe 0 garde les vitres, le groupe 1 prend les phares ; la
   géométrie est partagée avec le clone de la rue : regroupée une fois */
function regroupeTrianglesAvant(geometrie: THREE.BufferGeometry, versModele: THREE.Matrix4) {
  if (geometrie.groups.length) return
  const index = geometrie.index
  if (!index) throw new Error("gt86 : le verre du GLB n'est plus indexé, impossible d'isoler les phares")
  const positions = geometrie.attributes.position
  const sommet = new THREE.Vector3()
  const avant = (i: number) => sommet.fromBufferAttribute(positions, index.getX(i)).applyMatrix4(versModele).z > PHARES_Z
  const vitres: number[] = []
  const phares: number[] = []
  for (let t = 0; t < index.count; t += 3) {
    const cible = avant(t) && avant(t + 1) && avant(t + 2) ? phares : vitres
    cible.push(index.getX(t), index.getX(t + 1), index.getX(t + 2))
  }
  geometrie.setIndex([...vitres, ...phares])
  geometrie.addGroup(0, vitres.length, 0)
  geometrie.addGroup(vitres.length, phares.length, 1)
}

function verrePhare(verre: THREE.MeshPhysicalMaterial) {
  const phare = verre.clone()
  const r = REGLAGE_VERRE_PHARE
  phare.name = VERRE_PHARE
  phare.color.set(r.couleur)
  phare.metalness = r.metalness
  phare.envMapIntensity = r.envMapIntensity
  phare.opacity = r.opacity
  phare.clearcoat = r.clearcoat
  phare.specularIntensity = r.specularIntensity
  return phare
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
  return { avant: fais("avant"), arriere: fais("arriere"), coeur: fais("coeur"), reflet: fais("reflet") }
}
