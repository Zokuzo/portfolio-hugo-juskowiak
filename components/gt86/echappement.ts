import * as THREE from "three"

/* L'ÉCHAPPEMENT AKRAPOVIC (Hugo, 2026-10-20 : « a custom Akrapovic carbon
   one ») : deux sorties, une de chaque côté, là où le GLB posait les
   siennes (maillages Exhaust_0 et Exhaust_1, cachés). Chaque sortie est un
   manchon de carbone tressé verni, fermé à l'arrière par une lèvre
   biseautée et une bague de titane bleui qui plonge vers un fond noir.

   Posé une seule fois sur le GLB du ciel, AVANT le rideau : la rue clone
   ce même GLB déjà équipé. Les deux matériaux partagent un seul programme
   (MeshPhysicalMaterial, carte, vernis), créé avec eux. */

const ORIGINAUX = ["Exhaust_0", "Exhaust_1"]
const NOM = "Akrapovic"
const LONGUEUR = 0.2
const DEPASSE = 0.015
const BAGUE = 0.84
const FOND = 0.03

export function poseAkrapovic(modele: THREE.Object3D) {
  if (modele.getObjectByName(NOM)) return
  const originaux = ORIGINAUX.flatMap((nom) => modele.getObjectByName(nom) ?? [])
  if (originaux.length === 0) {
    console.warn("echappement : le GLB n'a plus ses sorties Exhaust, l'Akrapovic n'est pas posé")
    return
  }
  const boite = boiteDans(modele, originaux)
  originaux.forEach((o) => (o.visible = false))

  const rayon = (boite.max.y - boite.min.y) / 2
  const centreY = (boite.min.y + boite.max.y) / 2
  const arriere = boite.min.z - DEPASSE
  const echappement = new THREE.Group()
  echappement.name = NOM
  const { manchon, bague } = geometries(rayon)
  const { carbone, titane } = materiaux()
  for (const x of [boite.min.x + rayon, boite.max.x - rayon]) {
    const sortie = new THREE.Group()
    sortie.position.set(x, centreY, arriere + LONGUEUR)
    sortie.add(new THREE.Mesh(manchon, carbone), new THREE.Mesh(bague, titane))
    echappement.add(sortie)
  }
  modele.add(echappement)
}

/* la boîte des `pieces` dans le repère propre de `racine` */
export function boiteDans(racine: THREE.Object3D, pieces: THREE.Object3D[]) {
  racine.updateWorldMatrix(true, true)
  const versRacine = racine.matrixWorld.clone().invert()
  const boite = new THREE.Box3()
  for (const piece of pieces) {
    piece.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.geometry.computeBoundingBox()
      const relative = versRacine.clone().multiply(mesh.matrixWorld)
      boite.union(mesh.geometry.boundingBox!.clone().applyMatrix4(relative))
    })
  }
  return boite
}

/* Deux tours, l'axe vers l'arrière (−z). Le profil part de l'avant (y = 0)
   vers l'arrière (y = LONGUEUR) : le sens du profil oriente les normales
   du tour, dehors pour le manchon, vers l'arrière pour la lèvre, dedans
   pour la bague. */
function geometries(r: number) {
  const L = LONGUEUR
  const manchon = new THREE.LatheGeometry(
    [new THREE.Vector2(r * 0.9, 0), new THREE.Vector2(r, 0.025), new THREE.Vector2(r, L - 0.012), new THREE.Vector2(r * 0.97, L)],
    48,
  )
  const bague = new THREE.LatheGeometry(
    [
      new THREE.Vector2(r * 0.97, L),
      new THREE.Vector2(r * 0.9, L - 0.002),
      new THREE.Vector2(r * BAGUE, L - 0.008),
      new THREE.Vector2(r * BAGUE, L - 0.05),
      new THREE.Vector2(r * BAGUE, FOND),
      new THREE.Vector2(0, FOND),
    ],
    48,
  )
  for (const g of [manchon, bague]) g.rotateX(-Math.PI / 2)
  return { manchon, bague }
}

function materiaux() {
  const carbone = new THREE.MeshPhysicalMaterial({
    name: "AkrapovicCarbone",
    map: carboneTresse(),
    metalness: 0.15,
    roughness: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  })
  const titane = new THREE.MeshPhysicalMaterial({
    name: "AkrapovicTitane",
    map: titaneBleui(),
    metalness: 1,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  })
  return { carbone, titane }
}

/* le sergé 2x2 du carbone : des mèches alternées, chacune un dégradé qui
   accroche la lumière dans un sens puis dans l'autre */
const MECHE = 16
const MECHES = 16
function carboneTresse() {
  const c = document.createElement("canvas")
  c.width = c.height = MECHE * MECHES
  const ctx = c.getContext("2d")!
  for (let i = 0; i < MECHES; i++) {
    for (let j = 0; j < MECHES; j++) {
      const trame = Math.floor((i + j) / 2) % 2 === 0
      const x = i * MECHE
      const y = j * MECHE
      const degrade = trame ? ctx.createLinearGradient(x, y, x + MECHE, y) : ctx.createLinearGradient(x, y, x, y + MECHE)
      degrade.addColorStop(0, "#0b0b0e")
      degrade.addColorStop(0.5, trame ? "#3a3a42" : "#26262c")
      degrade.addColorStop(1, "#0b0b0e")
      ctx.fillStyle = degrade
      ctx.fillRect(x, y, MECHE, MECHE)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 1)
  tex.anisotropy = 8
  return tex
}

/* le titane chauffé : or brûlé à la lèvre, puis violet, bleu, et le noir
   du fond. v du tour = position le long du profil de la bague, 0 à la
   lèvre (le bas du canvas, flipY) */
function titaneBleui() {
  const c = document.createElement("canvas")
  c.width = 4
  c.height = 128
  const ctx = c.getContext("2d")!
  const degrade = ctx.createLinearGradient(0, 128, 0, 0)
  degrade.addColorStop(0, "#d9c7a0")
  degrade.addColorStop(0.18, "#c8913f")
  degrade.addColorStop(0.36, "#7b3fa8")
  degrade.addColorStop(0.55, "#2f5fd0")
  degrade.addColorStop(0.75, "#1b2650")
  degrade.addColorStop(0.85, "#050508")
  degrade.addColorStop(1, "#020203")
  ctx.fillStyle = degrade
  ctx.fillRect(0, 0, 4, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
