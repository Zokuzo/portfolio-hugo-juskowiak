import { writeFileSync, mkdirSync } from "node:fs"
const dir = process.argv[2]
mkdirSync(dir, { recursive: true })
// cube 1×1×1, 24 sommets (normales par face), 36 indices — juste de quoi
// donner à three.js une géométrie réelle à éclairer et à faire tourner.
const F = [
  [[0,0,1],[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]],
  [[0,0,-1],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]],
  [[1,0,0],[[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]]],
  [[-1,0,0],[[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]],
  [[0,1,0],[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]],
  [[0,-1,0],[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]],
]
const pos = [], nor = [], idx = []
F.forEach(([n, v], f) => { v.forEach((p) => { pos.push(...p); nor.push(...n) }); const b = f * 4; idx.push(b,b+1,b+2, b,b+2,b+3) })
const pb = Buffer.from(new Float32Array(pos).buffer)
const nb = Buffer.from(new Float32Array(nor).buffer)
const ib = Buffer.from(new Uint16Array(idx).buffer)
const bin = Buffer.concat([pb, nb, ib])
const gltf = {
  asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
  materials: [{ name: "body.001", pbrMetallicRoughness: { baseColorFactor: [1,1,1,1], metallicFactor: 1, roughnessFactor: 0.2 } }],
  buffers: [{ byteLength: bin.length, uri: "cube.bin" }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: pb.length, target: 34962 },
    { buffer: 0, byteOffset: pb.length, byteLength: nb.length, target: 34962 },
    { buffer: 0, byteOffset: pb.length + nb.length, byteLength: ib.length, target: 34963 },
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: 24, type: "VEC3", min: [-.5,-.5,-.5], max: [.5,.5,.5] },
    { bufferView: 1, componentType: 5126, count: 24, type: "VEC3" },
    { bufferView: 2, componentType: 5123, count: 36, type: "SCALAR" },
  ],
}
writeFileSync(dir + "/cube.bin", bin)
writeFileSync(dir + "/cube.gltf", JSON.stringify(gltf))
console.log("cube.gltf écrit,", bin.length, "octets de binaire")
