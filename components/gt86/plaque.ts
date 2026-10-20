import * as THREE from "three"

/* LA PLAQUE ARRIÈRE (demande de Hugo, 2026-10-20 : « une plaque
   d'immatriculation derrière avec écrit HUGOJSK ») : une plaque
   américaine personnalisée, style Californie, 12 x 6 pouces. Le GLB n'a
   ni maillage ni cavité de plaque : elle se pose à plat sur le bandeau
   peint du pare-chocs, entre le diffuseur et l'arête du coffre, dans
   l'axe des feux (mesures au rayon sur le modèle, repère du GLB).

   Un enfant nommé du modèle : le ciel la pose sur la scène du cache, la
   rue la retrouve dans son clone, et la chauffe de chaque groupe la
   compile et téléverse sa texture avant le rideau, comme le reste. */
const NOM = "PlaqueArriere"
const TEXTE = "HUGOJSK"
const ETAT = "California"
const LARGEUR = 0.305
const HAUTEUR = 0.152
/* centre du bandeau (y 0,48 à 0,64) ; la peinture affleure à z -2,025,
   la plaque s'en décolle de 7 mm contre le z-fighting et la courbure */
const POSE = new THREE.Vector3(-0.074, 0.556, -2.032)
/* le bandeau se couche vers le coffre : 1,1 cm sur 12,5 cm de haut */
const INCLINAISON = Math.atan2(0.011, 0.125)
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
