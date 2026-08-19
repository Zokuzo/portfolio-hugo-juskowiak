/* Coupe un GLB au carré |x-cx|<R, |z-cz|<R (coords monde) en ne
   réécrivant QUE les index de triangles ; les sommets orphelins seront
   purgés par gltf-transform optimize ensuite.
   Usage: node coupe-ville.mjs <in.glb> <out.glb> <cx> <cz> <R> */
import { readFileSync, writeFileSync } from "node:fs"

const [fin, fout, cxS, czS, RS] = process.argv.slice(2)
const [cx, cz, R] = [Number(cxS), Number(czS), Number(RS)]
const buf = readFileSync(fin)
const jsonLen = buf.readUInt32LE(12)
const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"))
const binOffset = 20 + jsonLen + 8
const bin = buf.subarray(binOffset, binOffset + buf.readUInt32LE(20 + jsonLen))

/* transforms monde (aucune matrice dans ce GLB : TRS simples) */
const nodes = gltf.nodes
const chaines = new Array(nodes.length).fill(null)
function compose(n) {
  return { t: n.translation ?? [0, 0, 0], s: n.scale ?? [1, 1, 1], q: n.rotation ?? [0, 0, 0, 1] }
}
function applique(tr, x, y, z) {
  const [qx, qy, qz, qw] = tr.q
  let [a, b, c] = [x * tr.s[0], y * tr.s[1], z * tr.s[2]]
  const uvx = qy * c - qz * b, uvy = qz * a - qx * c, uvz = qx * b - qy * a
  const uuvx = qy * uvz - qz * uvy, uuvy = qz * uvx - qx * uvz, uuvz = qx * uvy - qy * uvx
  a += 2 * (qw * uvx + uuvx); b += 2 * (qw * uvy + uuvy); c += 2 * (qw * uvz + uuvz)
  return [a + tr.t[0], b + tr.t[1], c + tr.t[2]]
}
function parcours(i, chaine) {
  chaines[i] = [...chaine, compose(nodes[i])]
  for (const c of nodes[i].children ?? []) parcours(c, chaines[i])
}
for (const s of gltf.scenes) for (const r of s.nodes) parcours(r, [])

function litAccessor(idx) {
  const a = gltf.accessors[idx]
  if (a.sparse) throw new Error("accessor sparse non géré")
  const bv = gltf.bufferViews[a.bufferView]
  const base = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0)
  return { a, bv, base }
}

const ajouts = []
let ajoutOffset = bin.length
let tGardes = 0, tTotal = 0

for (const [ni, n] of nodes.entries()) {
  if (n.mesh === undefined) continue
  const mesh = gltf.meshes[n.mesh]
  const chaine = chaines[ni] ?? []
  const monde = (x, y, z) => {
    let p = [x, y, z]
    for (let i = chaine.length - 1; i >= 0; i--) p = applique(chaine[i], p[0], p[1], p[2])
    return p
  }
  mesh.primitives = mesh.primitives.filter((prim) => {
    if (prim.indices === undefined) throw new Error("primitive non indexée")
    const { a: pa, bv: pbv, base: pbase } = litAccessor(prim.attributes.POSITION)
    if (pa.componentType !== 5126) throw new Error("POSITION non float32")
    const stride = pbv.byteStride ?? 12
    const pos = (i) => [bin.readFloatLE(pbase + i * stride), bin.readFloatLE(pbase + i * stride + 4), bin.readFloatLE(pbase + i * stride + 8)]
    const { a: ia, base: ibase } = litAccessor(prim.indices)
    const lit = ia.componentType === 5123 ? (i) => bin.readUInt16LE(ibase + i * 2)
      : ia.componentType === 5125 ? (i) => bin.readUInt32LE(ibase + i * 4)
      : (() => { throw new Error("indices " + ia.componentType) })()
    const gardes = []
    for (let t = 0; t + 2 < ia.count; t += 3) {
      const [i0, i1, i2] = [lit(t), lit(t + 1), lit(t + 2)]
      const [x0, , z0] = monde(...pos(i0))
      const [x1, , z1] = monde(...pos(i1))
      const [x2, , z2] = monde(...pos(i2))
      const mx = (x0 + x1 + x2) / 3, mz = (z0 + z1 + z2) / 3
      if (Math.abs(mx - cx) < R && Math.abs(mz - cz) < R) gardes.push(i0, i1, i2)
    }
    tTotal += ia.count / 3
    tGardes += gardes.length / 3
    if (gardes.length === 0) return false
    /* nouvel accessor d'indices en uint32, appendu au bin */
    const donnees = Buffer.from(new Uint32Array(gardes).buffer)
    const bvIdx = gltf.bufferViews.length
    gltf.bufferViews.push({ buffer: 0, byteOffset: ajoutOffset, byteLength: donnees.length, target: 34963 })
    ajouts.push(donnees)
    ajoutOffset += donnees.length
    const accIdx = gltf.accessors.length
    gltf.accessors.push({ bufferView: bvIdx, componentType: 5125, count: gardes.length, type: "SCALAR" })
    prim.indices = accIdx
    return true
  })
}

/* meshes vidés : détache-les des nœuds */
for (const n of nodes) if (n.mesh !== undefined && gltf.meshes[n.mesh].primitives.length === 0) delete n.mesh

const nouveauBin = Buffer.concat([bin, ...ajouts])
const pad4 = (x) => (x + 3) & ~3
gltf.buffers[0].byteLength = pad4(nouveauBin.length)
let jsonTxt = Buffer.from(JSON.stringify(gltf), "utf8")
const jsonPad = Buffer.alloc(pad4(jsonTxt.length) - jsonTxt.length, 0x20)
jsonTxt = Buffer.concat([jsonTxt, jsonPad])
const binPad = Buffer.alloc(pad4(nouveauBin.length) - nouveauBin.length)
const binOut = Buffer.concat([nouveauBin, binPad])
const entete = Buffer.alloc(12)
entete.writeUInt32LE(0x46546c67, 0)
entete.writeUInt32LE(2, 4)
entete.writeUInt32LE(12 + 8 + jsonTxt.length + 8 + binOut.length, 8)
const cJson = Buffer.alloc(8)
cJson.writeUInt32LE(jsonTxt.length, 0)
cJson.writeUInt32LE(0x4e4f534a, 4)
const cBin = Buffer.alloc(8)
cBin.writeUInt32LE(binOut.length, 0)
cBin.writeUInt32LE(0x004e4942, 4)
writeFileSync(fout, Buffer.concat([entete, cJson, jsonTxt, cBin, binOut]))
console.log(`triangles: ${tTotal} → ${tGardes} (${((tGardes / tTotal) * 100).toFixed(1)} %)`)
