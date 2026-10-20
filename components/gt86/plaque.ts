import * as THREE from "three"

/* LA PLAQUE ARRIÈRE (demande de Hugo, 2026-10-20 : « une plaque
   d'immatriculation derrière avec écrit HUGOJSK ») : une plaque
   américaine personnalisée, style Californie, 12 x 6 pouces. Le GLB n'a
   pas de maillage de plaque mais la malle a son renfoncement : un pan
   peint entre les deux feux, sous la lèvre du logo (y 0,65 à 0,83),
   au-dessus du pare-chocs. Elle s'y pose, comme sur la photo 10
   (mesures au rayon sur le modèle, repère du GLB).

   Un enfant nommé du modèle : le ciel la pose sur la scène du cache, la
   rue la retrouve dans son clone, et la chauffe de chaque groupe la
   compile et téléverse sa texture avant le rideau, comme le reste. */
const NOM = "PlaqueArriere"
const TEXTE = "HUGOJSK"
const ETAT = "California"
const LARGEUR = 0.305
const HAUTEUR = 0.152
/* centre du renfoncement : la peinture y affleure à z -1,929 ; la
   plaque s'en décolle de 4 mm le long de sa normale contre le z-fighting
   (le pan est bombé, les bords restent devant la peinture) */
const POSE = new THREE.Vector3(-0.074, 0.741, -1.933)
/* le pan se couche vers l'habitacle : 4,6 cm sur 14 cm de haut */
const INCLINAISON = Math.atan2(0.046, 0.14)
const PIXELS = { l: 1024, h: 512 }
const ANISOTROPIE = 8

export function posePlaque(voiture: THREE.Object3D) {
  if (voiture.getObjectByName(NOM)) return
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(LARGEUR, HAUTEUR),
    new THREE.MeshStandardMaterial({ map: textureDePlaque(), roughness: 0.4, alphaTest: 0.5 }),
  )
  plaque.name = NOM
  plaque.position.copy(POSE)
  plaque.rotation.set(INCLINAISON, Math.PI, 0)
  voiture.add(plaque)
}

let texture: THREE.CanvasTexture | null = null
function textureDePlaque() {
  if (texture) return texture
  const toile = document.createElement("canvas")
  toile.width = PIXELS.l
  toile.height = PIXELS.h
  const ctx = toile.getContext("2d")
  if (!ctx) throw new Error("plaque : pas de contexte 2D pour dessiner HUGOJSK")
  dessinePlaque(ctx)
  texture = new THREE.CanvasTexture(toile)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = ANISOTROPIE
  return texture
}

/* coins arrondis transparents (alphaTest), fond blanc, liseré, État en
   script rouge, numéro bleu marine étiré à la largeur utile */
function dessinePlaque(ctx: CanvasRenderingContext2D) {
  const { l, h } = PIXELS
  ctx.beginPath()
  ctx.roundRect(0, 0, l, h, 40)
  ctx.fillStyle = "#f4f4f0"
  ctx.fill()
  ctx.lineWidth = 10
  ctx.strokeStyle = "#1b2a5c"
  ctx.beginPath()
  ctx.roundRect(18, 18, l - 36, h - 36, 28)
  ctx.stroke()

  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = "#c8102e"
  ctx.font = "italic bold 112px 'Brush Script MT', 'URW Chancery L', cursive"
  ctx.fillText(ETAT, l / 2, 136)

  ctx.fillStyle = "#1b2a5c"
  ctx.font = "bold 270px 'Arial Narrow', 'Liberation Sans Narrow', 'DejaVu Sans Condensed', sans-serif"
  const largeurUtile = l - 120
  const etirement = Math.min(1, largeurUtile / ctx.measureText(TEXTE).width)
  ctx.save()
  ctx.translate(l / 2, 420)
  ctx.scale(etirement, 1)
  ctx.fillText(TEXTE, 0, 0)
  ctx.restore()
}
