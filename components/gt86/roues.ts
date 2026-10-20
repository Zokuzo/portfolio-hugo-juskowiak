import * as THREE from "three"

/* LES ROUES QUI TOURNENT (trajet du menu NFS). Dans le GLB, chaque enfant
   du nœud Wheels (jante, pneu, disque...) est UN maillage qui contient les
   quatre roues fusionnées, et la visserie (Screws) aussi : on coupe chaque
   géométrie par quadrant (signe de x et de z en repère voiture), on pose
   un pivot au centre de chaque roue, et le tout sort de la caisse pour que
   le cabrage ne soulève pas les roues. Mêmes matériaux, donc mêmes
   programmes GPU : tout naît au clonage, sous le rideau. Les étriers
   (Klotz) suivent les roues sans tourner. */

const ROUES = ["Wheels", "Screws"]
const ETRIER = "Klotz"
const PNEU = "Tire"
export const RAYON_ROUE = 0.33

export type Roues = { groupe: THREE.Group; pivots: THREE.Group[] }

/* `voiture` doit être à sa pose finale (assise, centrée) et sans parent :
   sa matrice monde est alors le repère du porteur */
export function detacheRoues(voiture: THREE.Object3D): Roues {
  voiture.updateMatrixWorld(true)
  const groupe = new THREE.Group()
  const maillages = ROUES.flatMap((nom) => {
    const noeud = voiture.getObjectByName(nom)
    const trouves: THREE.Mesh[] = []
    noeud?.traverse((o) => { if ((o as THREE.Mesh).isMesh) trouves.push(o as THREE.Mesh) })
    return trouves
  })
  if (maillages.length === 0) {
    console.warn("roues : le GLB n'a plus de nœud Wheels, les roues ne tourneront pas")
    return { groupe, pivots: [] }
  }
  const tournants = maillages.filter((m) => nomMateriau(m) !== ETRIER)
  const centres = centresDesRoues(tournants.filter((m) => nomMateriau(m) === PNEU))
  const pivots = centres.map((c) => {
    const pivot = new THREE.Group()
    pivot.position.copy(c)
    groupe.add(pivot)
    return pivot
  })
  for (const m of maillages) {
    if (nomMateriau(m) === ETRIER) groupe.attach(m)
    else coupeParRoue(m, pivots)
  }
  return { groupe, pivots }
}

export function tourneRoues(roues: Roues, angle: number) {
  for (const p of roues.pivots) p.rotation.x = angle
}

const nomMateriau = (m: THREE.Mesh) => (Array.isArray(m.material) ? m.material[0] : m.material)?.name ?? ""

const quadrant = (x: number, z: number) => (x < 0 ? 0 : 1) + (z < 0 ? 0 : 2)

const sommet = new THREE.Vector3()

function centresDesRoues(pneus: THREE.Mesh[]): THREE.Vector3[] {
  const boites = [0, 1, 2, 3].map(() => new THREE.Box3())
  for (const m of pneus) {
    const pos = m.geometry.getAttribute("position")
    for (let i = 0; i < pos.count; i++) {
      sommet.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld)
      boites[quadrant(sommet.x, sommet.z)].expandByPoint(sommet)
    }
  }
  return boites.map((b) => b.getCenter(new THREE.Vector3()))
}

/* un maillage à quatre roues devient quatre maillages, un par pivot, qui
   partagent les attributs d'origine (seul l'index est neuf) */
function coupeParRoue(m: THREE.Mesh, pivots: THREE.Group[]) {
  const geo = m.geometry
  const pos = geo.getAttribute("position")
  const index = geo.getIndex()
  const nb = index ? index.count : pos.count
  const sommetDe = (k: number) => (index ? index.getX(k) : k)
  const parRoue: number[][] = [[], [], [], []]
  for (let k = 0; k < nb; k += 3) {
    sommet.set(0, 0, 0)
    for (let j = 0; j < 3; j++) sommet.add(new THREE.Vector3().fromBufferAttribute(pos, sommetDe(k + j)))
    sommet.divideScalar(3).applyMatrix4(m.matrixWorld)
    parRoue[quadrant(sommet.x, sommet.z)].push(sommetDe(k), sommetDe(k + 1), sommetDe(k + 2))
  }
  parRoue.forEach((triangles, q) => {
    if (triangles.length === 0) return
    const morceau = new THREE.BufferGeometry()
    for (const [nom, attribut] of Object.entries(geo.attributes)) morceau.setAttribute(nom, attribut)
    morceau.setIndex(triangles)
    const roue = new THREE.Mesh(morceau, m.material)
    roue.name = `${m.name}_roue${q}`
    roue.renderOrder = m.renderOrder
    roue.castShadow = m.castShadow
    roue.receiveShadow = m.receiveShadow
    const pivot = pivots[q]
    roue.matrix.copy(m.matrixWorld).premultiply(new THREE.Matrix4().makeTranslation(-pivot.position.x, -pivot.position.y, -pivot.position.z))
    roue.matrix.decompose(roue.position, roue.quaternion, roue.scale)
    pivot.add(roue)
  })
  m.removeFromParent()
}
