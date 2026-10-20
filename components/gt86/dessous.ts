import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { boiteDans } from "./echappement"

/* LE DESSOUS DE CAISSE (Hugo, 2026-10-20 : « il faut un peu styliser le
   dessous de la voiture pour rendre cela réaliste ») : pendant la chute on
   voit souvent le ventre de la GT86, et le GLB n'y a qu'un aplat noir.
   On y pose un plancher à tunnel et nervures, la ligne d'échappement
   jusqu'aux sorties Akrapovic, les trains roulants, le réservoir, le
   diffuseur et le sabot.

   Tout est mesuré sur le GLB (repère propre du modèle : +z vers l'avant,
   +y vers le haut) : la carrosserie (Paint_0) donne le bas de caisse, les
   pneus (Wheels_7) les essieux. Posé une seule fois sur le GLB du ciel,
   AVANT le rideau, comme l'Akrapovic : la rue clone ce GLB déjà équipé.
   Trois maillages fusionnés, trois MeshStandardMaterial cartés : un seul
   programme GPU, compilé avec la voiture. */

const NOM = "Dessous"
const CARROSSERIE = "Paint_0"
const PNEUS = "Wheels_7"
const SORTIES = "Akrapovic"

const EPAISSEUR = 0.008
const TUNNEL_LARGEUR = 0.3
const TUNNEL_HAUTEUR = 0.09
const RENTRE_FLANC = 0.33
const DEGAGEMENT_ROUE = 0.38
const RAYON_TUBE = 0.032
const SEGMENTS = 12

type Cote = { x: number; avant: number; arriere: number; sol: number }
type Pieces = { plancher: THREE.BufferGeometry[]; alu: THREE.BufferGeometry[]; trains: THREE.BufferGeometry[] }

export function poseDessous(modele: THREE.Object3D) {
  if (modele.getObjectByName(NOM)) return
  const carrosserie = modele.getObjectByName(CARROSSERIE)
  const pneus = modele.getObjectByName(PNEUS)
  if (!carrosserie || !pneus) {
    console.warn("dessous : le GLB n'a plus Paint_0 ou Wheels_7, le dessous de caisse n'est pas posé")
    return
  }
  const caisse = boiteDans(modele, [carrosserie])
  const roues = boiteDans(modele, [pneus])

  const rayonRoue = (roues.max.y - roues.min.y) / 2
  const cote: Cote = {
    x: (caisse.max.x - caisse.min.x) / 2 - RENTRE_FLANC,
    avant: roues.max.z - rayonRoue,
    arriere: roues.min.z + rayonRoue,
    sol: caisse.min.y + 0.004,
  }
  const centre = new THREE.Vector3((caisse.min.x + caisse.max.x) / 2, rayonRoue + roues.min.y, 0)
  const sorties = modele.getObjectByName(SORTIES)?.children.map((s) => s.position.clone().setX(s.position.x - centre.x)) ?? []

  const pieces: Pieces = { plancher: [], alu: [], trains: [] }
  plancher(pieces, cote, caisse)
  echappement(pieces, cote, sorties)
  trains(pieces, cote, centre.y)
  arriere(pieces, cote, caisse)

  const { anthracite, aluBrosse, metalSombre } = materiaux()
  const dessous = new THREE.Group()
  dessous.name = NOM
  dessous.position.x = centre.x
  dessous.add(
    new THREE.Mesh(mergeGeometries(pieces.plancher), anthracite),
    new THREE.Mesh(mergeGeometries(pieces.alu), aluBrosse),
    new THREE.Mesh(mergeGeometries(pieces.trains), metalSombre),
  )
  modele.add(dessous)
}

/* le fond plat en deux panneaux de part et d'autre du tunnel, le tunnel
   lui-même, des nervures, et le sabot avant en alu */
function plancher(p: Pieces, c: Cote, caisse: THREE.Box3) {
  const avant = c.avant - DEGAGEMENT_ROUE
  const arriere = c.arriere + DEGAGEMENT_ROUE
  const long = avant - arriere
  const milieuZ = (avant + arriere) / 2
  const panneau = c.x - TUNNEL_LARGEUR / 2
  for (const s of [-1, 1]) {
    const x = s * (TUNNEL_LARGEUR / 2 + panneau / 2)
    p.plancher.push(boite([panneau, EPAISSEUR, long], [x, c.sol, milieuZ]))
    for (const n of [0.25, 0.55, 0.85]) {
      p.plancher.push(boite([0.018, 0.012, long * 0.86], [s * (TUNNEL_LARGEUR / 2 + panneau * n), c.sol - 0.008, milieuZ]))
    }
    p.plancher.push(boite([EPAISSEUR, TUNNEL_HAUTEUR, long], [s * TUNNEL_LARGEUR / 2, c.sol + TUNNEL_HAUTEUR / 2, milieuZ]))
    p.plancher.push(boite([panneau * 0.9, 0.025, 0.04], [x, c.sol - 0.012, milieuZ + long * 0.18]))
  }
  p.plancher.push(boite([TUNNEL_LARGEUR, EPAISSEUR, long], [0, c.sol + TUNNEL_HAUTEUR, milieuZ]))
  p.alu.push(boite([TUNNEL_LARGEUR * 0.8, 0.004, long * 0.9], [0, c.sol + TUNNEL_HAUTEUR - 0.01, milieuZ]))

  const sabotArriere = c.avant - DEGAGEMENT_ROUE * 0.6
  const sabotAvant = caisse.max.z - 0.35
  p.alu.push(boite([c.x * 1.3, EPAISSEUR, sabotAvant - sabotArriere], [0, c.sol + 0.006, (sabotAvant + sabotArriere) / 2]))
  for (const z of [0.25, 0.5, 0.75]) {
    p.alu.push(boite([c.x * 1.2, 0.01, 0.02], [0, c.sol, sabotArriere + (sabotAvant - sabotArriere) * z]))
  }
  p.plancher.push(boite([c.x * 1.9, EPAISSEUR, 0.3], [0, c.sol + 0.03, sabotAvant + 0.12]))
}

/* le collecteur sous le moteur, le tube dans le tunnel, le résonateur, le
   silencieux arrière en travers, et un tube vers chaque sortie Akrapovic */
function echappement(p: Pieces, c: Cote, sorties: THREE.Vector3[]) {
  const basTube = c.sol + RAYON_TUBE + 0.03
  const jonction = new THREE.Vector3(0, basTube, c.avant - 0.55)
  for (const x of [-0.2, -0.07, 0.07, 0.2]) {
    p.alu.push(tube([new THREE.Vector3(x, c.sol + 0.18, c.avant - 0.2), new THREE.Vector3(x * 0.6, basTube + 0.03, c.avant - 0.42), jonction], RAYON_TUBE * 0.7))
  }
  const resoAvant = c.avant - 0.95
  const resoArriere = resoAvant - 0.5
  p.alu.push(tube([jonction, new THREE.Vector3(0, basTube, resoAvant)], RAYON_TUBE))
  p.alu.push(cylindreZ(0.065, resoAvant, resoArriere, 0, basTube))
  p.plancher.push(boite([0.2, 0.004, resoAvant - resoArriere + 0.1], [0, basTube + 0.07, (resoAvant + resoArriere) / 2]))

  const silencieuxZ = c.arriere - 0.24
  const hautSilencieux = sorties[0]?.y ?? c.sol + 0.15
  const xs = sorties.length > 0 ? sorties.map((s) => s.x) : [-0.44, 0.44]
  p.alu.push(tube([
    new THREE.Vector3(0, basTube, resoArriere),
    new THREE.Vector3(-0.12, basTube, c.arriere + 0.35),
    new THREE.Vector3(-0.15, hautSilencieux - 0.02, c.arriere - 0.05),
    new THREE.Vector3(-0.15, hautSilencieux, silencieuxZ + 0.05),
  ], RAYON_TUBE))
  const xMin = Math.min(...xs) - 0.05
  const xMax = Math.max(...xs) + 0.05
  const silencieux = new THREE.CylinderGeometry(0.075, 0.075, xMax - xMin, 20).rotateZ(Math.PI / 2)
  silencieux.scale(1, 1, 1.5).translate((xMin + xMax) / 2, hautSilencieux, silencieuxZ)
  p.alu.push(silencieux)
  for (const x of xs) {
    const fin = sorties.find((s) => Math.abs(s.x - x) < 1e-6)?.z ?? silencieuxZ - 0.3
    p.alu.push(cylindreZ(RAYON_TUBE * 1.2, silencieuxZ, fin - 0.02, x, hautSilencieux))
  }
}

/* triangles, biellettes, combinés et barre stabilisatrice à chaque essieu */
function trains(p: Pieces, c: Cote, moyeuY: number) {
  const bas = c.sol - 0.01
  for (const essieu of [c.avant, c.arriere]) {
    const versAvant = essieu === c.avant ? 1 : -1
    for (const s of [-1, 1]) {
      const moyeu = new THREE.Vector3(s * (c.x + 0.05), bas + 0.02, essieu)
      p.trains.push(barre(new THREE.Vector3(s * 0.28, bas, essieu + 0.17), moyeu, 0.018))
      p.trains.push(barre(new THREE.Vector3(s * 0.28, bas, essieu - 0.13), moyeu, 0.018))
      p.trains.push(barre(new THREE.Vector3(s * 0.3, bas + 0.06, essieu - versAvant * 0.12), new THREE.Vector3(s * (c.x + 0.04), bas + 0.05, essieu - versAvant * 0.1), 0.011))
      p.trains.push(boite([0.06, 0.09, 0.09], [moyeu.x, bas + 0.06, essieu]))
      p.trains.push(barre(new THREE.Vector3(s * (c.x - 0.04), bas + 0.03, essieu), new THREE.Vector3(s * (c.x - 0.08), moyeuY + 0.25, essieu), 0.03))
    }
    const barreZ = essieu - versAvant * 0.2
    p.trains.push(barre(new THREE.Vector3(-c.x + 0.02, bas + 0.04, barreZ), new THREE.Vector3(c.x - 0.02, bas + 0.04, barreZ), 0.012))
    for (const s of [-1, 1]) {
      p.trains.push(barre(new THREE.Vector3(s * (c.x - 0.02), bas + 0.04, barreZ), new THREE.Vector3(s * (c.x - 0.02), bas + 0.04, essieu - versAvant * 0.02), 0.012))
    }
    p.trains.push(boite([c.x * 1.4, 0.04, 0.06], [0, bas + 0.03, essieu + versAvant * 0.26]))
  }
  p.trains.push(boite([0.22, 0.12, 0.2], [0, moyeuY - 0.02, c.arriere]))
  p.trains.push(cylindreZ(0.035, c.avant - 0.55, c.arriere + 0.1, 0.0, c.sol + TUNNEL_HAUTEUR * 0.55))
}

/* le réservoir devant l'essieu arrière, puis le diffuseur et ses ailettes */
function arriere(p: Pieces, c: Cote, caisse: THREE.Box3) {
  const reservoirZ = c.arriere + DEGAGEMENT_ROUE + 0.2
  p.plancher.push(boite([c.x * 1.2, 0.05, 0.38], [0.18, c.sol - 0.02, reservoirZ]))
  for (const z of [-0.12, 0, 0.12]) p.plancher.push(boite([c.x * 1.15, 0.012, 0.025], [0.18, c.sol - 0.046, reservoirZ + z]))

  const debut = c.arriere - 0.3
  const fin = caisse.min.z + 0.22
  const montee = 0.12
  const longueur = Math.hypot(debut - fin, montee)
  const angle = Math.atan2(montee, debut - fin)
  const plaque = new THREE.BoxGeometry(c.x * 2, EPAISSEUR, longueur).rotateX(angle).translate(0, c.sol + montee / 2, (debut + fin) / 2)
  p.plancher.push(plaque)
  for (const x of [-0.3, -0.15, 0, 0.15, 0.3]) {
    const ailette = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(longueur, montee), new THREE.Vector2(longueur, montee - 0.05), new THREE.Vector2(0.15, 0)])
    const g = new THREE.ExtrudeGeometry(ailette, { depth: 0.008, bevelEnabled: false })
    g.rotateY(Math.PI / 2).translate(x - 0.004, c.sol, debut)
    p.plancher.push(indexe(g))
  }
}

function boite(taille: [number, number, number], position: [number, number, number]) {
  return new THREE.BoxGeometry(...taille).translate(...position)
}

function cylindreZ(rayon: number, zA: number, zB: number, x: number, y: number) {
  return new THREE.CylinderGeometry(rayon, rayon, Math.abs(zA - zB), SEGMENTS).rotateX(Math.PI / 2).translate(x, y, (zA + zB) / 2)
}

function barre(a: THREE.Vector3, b: THREE.Vector3, rayon: number) {
  const g = new THREE.CylinderGeometry(rayon, rayon, a.distanceTo(b), 8)
  const axe = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return g.applyQuaternion(axe).translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
}

function tube(points: THREE.Vector3[], rayon: number) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, rayon, 8)
}

/* mergeGeometries exige que tout soit indexé ou rien : l'extrusion ne
   l'est pas, on lui donne un index trivial */
function indexe(g: THREE.BufferGeometry) {
  g.setIndex([...Array(g.attributes.position.count).keys()])
  return g
}

function materiaux() {
  const salete = texture(salir)
  const brosse = texture(brosser)
  return {
    anthracite: new THREE.MeshStandardMaterial({ name: "DessousAnthracite", color: "#3a3c40", map: salete, roughness: 0.92, metalness: 0.05 }),
    aluBrosse: new THREE.MeshStandardMaterial({ name: "DessousAlu", color: "#c4c8ce", map: brosse, roughness: 0.38, metalness: 1 }),
    metalSombre: new THREE.MeshStandardMaterial({ name: "DessousTrains", color: "#5a5d63", map: salete, roughness: 0.55, metalness: 0.7 }),
  }
}

const COTE_TEXTURE = 128

function texture(peindre: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas")
  c.width = c.height = COTE_TEXTURE
  peindre(c.getContext("2d")!)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/* des taches de poussière et de boue claire sur un gris moyen */
function salir(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#9a9a9a"
  ctx.fillRect(0, 0, COTE_TEXTURE, COTE_TEXTURE)
  for (let i = 0; i < 260; i++) {
    const v = 120 + Math.floor(Math.random() * 90)
    ctx.fillStyle = `rgba(${v},${v - 6},${v - 14},0.18)`
    ctx.beginPath()
    ctx.arc(Math.random() * COTE_TEXTURE, Math.random() * COTE_TEXTURE, 2 + Math.random() * 10, 0, Math.PI * 2)
    ctx.fill()
  }
}

/* les stries du brossage, toutes dans le même sens */
function brosser(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#d8d8d8"
  ctx.fillRect(0, 0, COTE_TEXTURE, COTE_TEXTURE)
  for (let y = 0; y < COTE_TEXTURE; y++) {
    const v = 190 + Math.floor(Math.random() * 60)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(0, y, COTE_TEXTURE, 1)
  }
}
