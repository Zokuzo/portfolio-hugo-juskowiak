/* Génère la couche « bâtiments réels » de la carte GPS (#26) : projection
   du dessus du GLB brut dans le repère de la voiture garée (pose de la rue
   #22 : (-4,4, -19), cap sud, sud = haut d'écran), rastérisée en masques
   PGM — l'arrondi façon Waze se fait ensuite en morphologie ImageMagick.
   Usage: node tools/monde/carte-quartier.mjs <in.glb> <dossier-sortie> */
import { readFileSync, writeFileSync } from "node:fs"

const [fin, dossier] = process.argv.slice(2)
const L = 512, H = 256, ECHELLE = 4 /* px/m */
const CX = -4.4, CZ = -19 /* la pose (repère décor) */
const PX0 = 256, PY0 = 244 /* la voiture à l'écran */
/* écran : +x décor → droite ; sud (−z) → haut */
const versPx = (x, z) => [PX0 + (x - CX) * ECHELLE, PY0 - (CZ - z) * ECHELLE]

const BATIMENTS = new Set([
  "CityGen_LR_Facades", "CityGenroof.001", "CityGenroof.002", "CityGenroof.003",
  "CityGensimple_concrete_1", "CityGenwhite_marble_tiles", "CityGenconcrete.001",
  "Material", "Material.001", "Material.002", "Material.003", "material", "material_34",
])
const PARC = new Set(["CityGen_Grass"])

const buf = readFileSync(fin)
const jsonLen = buf.readUInt32LE(12)
const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString())
const binOffset = 20 + jsonLen + 8
const bin = buf.subarray(binOffset)

const nodes = gltf.nodes
const chaines = new Array(nodes.length).fill(null)
const compose = (n) => ({ t: n.translation ?? [0, 0, 0], s: n.scale ?? [1, 1, 1], q: n.rotation ?? [0, 0, 0, 1] })
function applique(tr, x, y, z) {
  const [qx, qy, qz, qw] = tr.q
  let [a, b, c] = [x * tr.s[0], y * tr.s[1], z * tr.s[2]]
  const uvx = qy * c - qz * b, uvy = qz * a - qx * c, uvz = qx * b - qy * a
  const ux = qy * uvz - qz * uvy, uy = qz * uvx - qx * uvz, uz = qx * uvy - qy * uvx
  a += 2 * (qw * uvx + ux); b += 2 * (qw * uvy + uy); c += 2 * (qw * uvz + uz)
  return [a + tr.t[0], b + tr.t[1], c + tr.t[2]]
}
function parcours(i, chaine) {
  chaines[i] = [...chaine, compose(nodes[i])]
  for (const c of nodes[i].children ?? []) parcours(c, chaines[i])
}
for (const sc of gltf.scenes) for (const r of sc.nodes) parcours(r, [])

const masques = { batiments: new Uint8Array(L * H), parc: new Uint8Array(L * H) }

function triangle(m, x0, y0, x1, y1, x2, y2) {
  const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)))
  const maxX = Math.min(L - 1, Math.ceil(Math.max(x0, x1, x2)))
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)))
  const maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)))
  if (minX > maxX || minY > maxY) return
  const aire = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
  if (Math.abs(aire) < 1e-9) return
  for (let py = minY; py <= maxY; py++)
    for (let px = minX; px <= maxX; px++) {
      const w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) / aire
      const w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) / aire
      const w2 = 1 - w0 - w1
      if (w0 >= -0.001 && w1 >= -0.001 && w2 >= -0.001) m[py * L + px] = 255
    }
}

let tris = 0
for (const [ni, n] of nodes.entries()) {
  if (n.mesh === undefined) continue
  for (const prim of gltf.meshes[n.mesh].primitives) {
    const nomMat = gltf.materials?.[prim.material]?.name ?? ""
    const masque = BATIMENTS.has(nomMat) ? masques.batiments : PARC.has(nomMat) ? masques.parc : null
    if (!masque) continue
    const pa = gltf.accessors[prim.attributes.POSITION]
    const pbv = gltf.bufferViews[pa.bufferView]
    const pbase = (pbv.byteOffset ?? 0) + (pa.byteOffset ?? 0)
    const stride = pbv.byteStride ?? 12
    const ia = gltf.accessors[prim.indices]
    const ibv = gltf.bufferViews[ia.bufferView]
    const ibase = (ibv.byteOffset ?? 0) + (ia.byteOffset ?? 0)
    const lit = ia.componentType === 5123 ? (i) => bin.readUInt16LE(ibase + i * 2) : (i) => bin.readUInt32LE(ibase + i * 4)
    const chaine = chaines[ni] ?? []
    const monde = (i) => {
      let p = [bin.readFloatLE(pbase + i * stride), bin.readFloatLE(pbase + i * stride + 4), bin.readFloatLE(pbase + i * stride + 8)]
      for (let k = chaine.length - 1; k >= 0; k--) p = applique(chaine[k], p[0], p[1], p[2])
      return p
    }
    for (let t = 0; t + 2 < ia.count; t += 3) {
      const A = monde(lit(t)), B = monde(lit(t + 1)), C = monde(lit(t + 2))
      /* seules les vraies structures : au-dessus du sol pour les bâtiments */
      if (masque === masques.batiments && Math.max(A[1], B[1], C[1]) < 2.5) continue
      const [ax, ay] = versPx(A[0], A[2])
      const [bx, by] = versPx(B[0], B[2])
      const [cx2, cy2] = versPx(C[0], C[2])
      triangle(masque, ax, ay, bx, by, cx2, cy2)
      tris++
    }
  }
}

for (const [nom, m] of Object.entries(masques)) {
  const entete = Buffer.from(`P5\n${L} ${H}\n255\n`)
  writeFileSync(`${dossier}/masque-${nom}.pgm`, Buffer.concat([entete, Buffer.from(m)]))
}
console.log(`triangles rasterisés: ${tris}`)
