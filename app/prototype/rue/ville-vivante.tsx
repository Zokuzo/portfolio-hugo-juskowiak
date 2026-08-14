"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { halo } from "./rue"

/* La vie nocturne de la city procédurale — v3, tout ancré à la GÉOMÉTRIE
   (analyse-ville2.mjs : clustering des sommets du GLB brut).
   - ~20 luminaires réels sur deux gammes de mâts : têtes hautes (10,1 m,
     bras longs) et courtes (7,9 m). Spots réels près de la mise en scène,
     halo + flaque peinte au-delà (doctrine fluidité #21).
   - le boîtier de feux du carrefour mesure 0,8×0,8 m entre y 2,6 et 3,9 :
     les lentilles vivent DANS ce volume, une pile par face.
   - les tours n'ont aucun matériau « vitre » (fenêtres cuites dans les
     textures) : les bâtiments s'habitent par des quads-fenêtres chauds
     générés sur des grilles de façades, épars et déterministes. */

const REDUIT =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

function graine(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* [x, z, y de la tête, vrai spot ?] — positions des luminaires analysées */
const LAMPES: [number, number, number, boolean?][] = [
  /* rue N-S, rangée ouest (hautes) et est (courtes) */
  [-4.8, -15.5, 10.1, true],
  [-4.8, -30.0, 10.1, true],
  [-4.8, -44.5, 10.1],
  [5.7, -15.5, 7.9, true],
  [5.7, -30.0, 7.9],
  [5.7, -44.5, 7.9],
  /* rue E-O, rangée nord (hautes) et sud (courtes puis hautes à l'ouest) */
  [8.0, 1.0, 10.1, true],
  [20.2, 1.0, 10.1],
  [32.3, 1.0, 10.1],
  [44.5, 1.0, 10.1],
  [-8.0, 1.0, 10.1],
  [-20.2, 1.0, 10.1],
  [-32.3, 1.0, 10.1],
  [-44.5, 1.0, 10.1],
  [15.5, -2.0, 7.9, true],
  [26.4, -2.0, 7.9],
  [37.3, -2.0, 7.9],
  [48.2, -2.0, 7.9],
  [-15.5, -4.8, 10.1],
  [-30.0, -4.8, 10.1],
  [-44.5, -4.8, 10.1],
  /* le mât d'angle du carrefour */
  [-2.0, 4.7, 9.8],
]

function Lampe({ x, z, y, vrai }: { x: number; z: number; y: number; vrai?: boolean }) {
  const cible = useMemo(() => new THREE.Object3D(), [])
  return (
    <group>
      <sprite position={[x, y, z]} scale={[1.15, 1.15, 1]}>
        <spriteMaterial map={halo()} color="#ffe6bb" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite position={[x, y, z]} scale={[3.4, 3.4, 1]}>
        <spriteMaterial map={halo()} color="#ffca7a" transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      {vrai ? (
        <>
          <primitive object={cible} position={[x, 0, z]} />
          <spotLight position={[x, y, z]} target={cible} color="#ffd9a2" intensity={110} angle={0.62} penumbra={0.9} decay={1.7} distance={30} />
        </>
      ) : (
        <mesh position={[x, 0.02, z]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[4.2, 24]} />
          <meshBasicMaterial map={halo()} color="#7d6039" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/* ---- les feux tricolores ------------------------------------------- */
/* boîtier analysé : x∈[9,46;10,24] z∈[-6,04;-5,23] y∈[2,64;3,93] —
   une pile de lentilles par face, DANS le volume */
const CYCLE = 17
const TEINTES = ["#ff3b30", "#ffab2e", "#3bd06b"] as const

function TeteDeFeu({ pos, phase }: { pos: [number, number, number]; phase: number }) {
  const refs = useRef<(THREE.SpriteMaterial | null)[]>([])
  useFrame((etat) => {
    /* figé à t=0 sous reduce : phase 0 verte, phase 1 rouge — jamais deux
       verts croisés */
    const t = REDUIT ? 0 : etat.clock.elapsedTime
    const local = (t + phase * (CYCLE / 2)) % CYCLE
    const etatFeu = local < 7 ? 2 : local < 8.5 ? 1 : 0
    refs.current.forEach((m, i) => {
      if (m) m.opacity = i === etatFeu ? 0.95 : 0.05
    })
  })
  return (
    <group position={pos}>
      {TEINTES.map((c, i) => (
        <sprite key={c} position={[0, 0.37 - i * 0.37, 0]} scale={[0.26, 0.26, 1]}>
          <spriteMaterial
            ref={(m) => { refs.current[i] = m }}
            map={halo()}
            color={c}
            transparent
            opacity={0.05}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  )
}

/* ---- les fenêtres habitées ------------------------------------------ */
/* plus de façades devinées : chaque fenêtre est COLLÉE au mur par un
   raycast horizontal au montage — depuis la rue vers le bâti, au premier
   impact. Les bandes décrivent d'où l'on tire et à quelles hauteurs. */
type Bande = {
  /* origine du tir : le long d'un axe, à hauteurs fixes */
  origines: [number, number, number][]
  dir: [number, number, number]
  portee: number
  teinte: string
  part: number
}
const BANDES: Bande[] = [
  /* la brique ouest de la rue N-S : tirs vers -X depuis la chaussée */
  {
    origines: Array.from({ length: 24 }, (_, i) => [-6, 2.1 + (i % 2) * 2.3, -8 - Math.floor(i / 2) * 2.6] as [number, number, number]),
    dir: [-1, 0, 0],
    portee: 18,
    teinte: "#ffc98a",
    part: 0.42,
  },
  /* le bloc est de la rue N-S : tirs vers +X */
  {
    origines: Array.from({ length: 16 }, (_, i) => [6, 2.3 + (i % 2) * 2.4, -9 - Math.floor(i / 2) * 2.8] as [number, number, number]),
    dir: [1, 0, 0],
    portee: 14,
    teinte: "#ffd9a2",
    part: 0.36,
  },
  /* les tours au nord du carrefour : tirs vers +Z depuis le MILIEU de la
     rue (partir trop près, c'est tirer depuis l'intérieur du bâtiment —
     une façade vue de dos ne se raycast pas), étages 6,5 à 20 m */
  {
    origines: Array.from({ length: 64 }, (_, i) => [-14 + (i % 8) * 3.3, 6.5 + Math.floor(i / 8) * 2.7, 1] as [number, number, number]),
    dir: [0, 0, 1],
    portee: 24,
    teinte: "#cfe0ff",
    part: 0.3,
  },
  /* la façade est de la rue N-S en étage (au-dessus des vitrines) */
  {
    origines: Array.from({ length: 16 }, (_, i) => [6, 5.2 + Math.floor(i / 8) * 2.6, -8 - (i % 8) * 2.8] as [number, number, number]),
    dir: [1, 0, 0],
    portee: 14,
    teinte: "#ffe0b0",
    part: 0.3,
  },
]

function Fenetres({ decor }: { decor: THREE.Object3D }) {
  const quads = useMemo(() => {
    decor.updateWorldMatrix(true, true)
    const ray = new THREE.Raycaster()
    const liste: { p: THREE.Vector3; q: THREE.Quaternion; teinte: string }[] = []
    const avantPlan = new THREE.Vector3(0, 0, 1)
    BANDES.forEach((b, bi) => {
      const dir = new THREE.Vector3(...b.dir).normalize()
      b.origines.forEach((o, oi) => {
        if (graine(bi * 97.3 + oi * 13.7) > b.part) return
        ray.set(new THREE.Vector3(...o), dir)
        ray.far = b.portee
        /* premier impact FAÇADE : on saute arbres, mobilier, bras de mâts —
           un quad-fenêtre sur un lampadaire a déjà été vu, jamais deux */
        const impact = ray
          .intersectObject(decor, true)
          .find((h) => {
            const mat = (h.object as THREE.Mesh).material as THREE.Material | THREE.Material[]
            const nom = (Array.isArray(mat) ? mat[0] : mat)?.name ?? ""
            return !/Street_Assets|Foliage|Bark|Glass|Grass|WetFloor|trash|firescape/i.test(nom)
          })
        if (!impact || !impact.face) return
        /* le quad épouse le mur : posé au point d'impact, tourné selon la
           normale, décollé de 6 cm */
        const n = impact.face.normal.clone().transformDirection(impact.object.matrixWorld).normalize()
        if (Math.abs(n.y) > 0.4) return /* toit ou sol : pas une façade */
        const p = impact.point.clone().addScaledVector(n, 0.06)
        const q = new THREE.Quaternion().setFromUnitVectors(avantPlan, n)
        liste.push({ p, q, teinte: b.teinte })
      })
    })
    return liste
  }, [decor])
  return (
    <group>
      {quads.map((f, i) => (
        <mesh key={i} position={f.p} quaternion={f.q}>
          <planeGeometry args={[0.85, 1.15]} />
          <meshBasicMaterial color={f.teinte} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}

export default function VieNocturne() {
  /* même GLB que DecorGlb : le cache useGLTF rend l'instance partagée,
     transform identité en variante e — le raycast des fenêtres vise juste */
  const { scene } = useGLTF("/prototype/decor-procedural.glb")
  return (
    <group>
      {LAMPES.map(([x, z, y, vrai], i) => (
        <Lampe key={i} x={x} z={z} y={y} vrai={vrai} />
      ))}
      {/* tête face ouest (dans le boîtier, côté x-) et tête face nord
          (côté z+), en opposition de phase */}
      <TeteDeFeu pos={[9.42, 3.35, -5.63]} phase={0} />
      <TeteDeFeu pos={[9.9, 3.35, -5.19]} phase={1} />
      <Fenetres decor={scene} />
    </group>
  )
}
